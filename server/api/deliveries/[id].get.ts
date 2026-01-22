/**
 * GET /api/deliveries/:id
 *
 * Fetch a single delivery by ID with full details
 *
 * Includes:
 * - Delivery header information (including status)
 * - All delivery lines with item details
 * - Associated NCRs (price variance reports)
 * - Supplier, period, PO, and creator information
 *
 * Permissions:
 * - User must have access to the delivery's location
 * - DRAFT deliveries are only visible to their creator (unless ADMIN/SUPERVISOR)
 */

import prisma from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      data: {
        code: "NOT_AUTHENTICATED",
        message: "You must be logged in to access this resource",
      },
    });
  }

  try {
    const deliveryId = getRouterParam(event, "id");

    if (!deliveryId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_DELIVERY_ID",
          message: "Delivery ID is required",
        },
      });
    }

    // OPTIMIZATION: Fetch delivery and user's location access in parallel
    // For operators, we need to verify location access
    // For admin/supervisor, we skip the userLocation query
    const deliveryPromise = prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        location: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
            contact: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
            status: true,
            start_date: true,
            end_date: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            full_name: true,
            role: true,
          },
        },
        po: {
          select: {
            id: true,
            po_no: true,
            status: true,
            total_amount: true,
            lines: {
              select: {
                id: true,
                item_id: true,
                quantity: true,
                delivered_qty: true,
              },
            },
          },
        },
        delivery_lines: {
          include: {
            item: {
              select: {
                id: true,
                code: true,
                name: true,
                unit: true,
                category: true,
                sub_category: true,
              },
            },
          },
          // NOTE: Removed nested orderBy on item.name for performance
          // Sorting is done in JavaScript below
        },
        ncrs: {
          select: {
            id: true,
            ncr_no: true,
            type: true,
            status: true,
            reason: true,
            quantity: true,
            value: true,
            created_at: true,
            delivery_line_id: true,
            creator: {
              select: {
                id: true,
                username: true,
                full_name: true,
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });

    // For operators, also fetch their location assignments in parallel
    const userLocationsPromise =
      user.role !== "ADMIN" && user.role !== "SUPERVISOR"
        ? prisma.userLocation.findMany({
            where: { user_id: user.id },
            select: { location_id: true },
          })
        : Promise.resolve([]);

    const [delivery, userLocations] = await Promise.all([deliveryPromise, userLocationsPromise]);

    if (!delivery) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "DELIVERY_NOT_FOUND",
          message: "Delivery not found",
        },
      });
    }

    // Check if user has access to the delivery's location
    // Admin and Supervisor have access to all locations
    if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
      const hasLocationAccess = userLocations.some((ul) => ul.location_id === delivery.location_id);

      if (!hasLocationAccess) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            code: "LOCATION_ACCESS_DENIED",
            message: "You do not have access to this delivery's location",
          },
        });
      }

      // Draft deliveries are only visible to their creator
      if (delivery.status === "DRAFT" && delivery.created_by !== user.id) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            code: "NOT_DRAFT_OWNER",
            message: "You can only view drafts you created",
          },
        });
      }
    }

    // Format the response - convert Decimal types to numbers for JSON serialization
    const totalAmount = parseFloat(delivery.total_amount.toString());

    // Build PO line map for over-delivery calculation
    // Map: po_line_id -> { remaining_qty (before this delivery), item_id }
    // For draft deliveries, we calculate remaining by: quantity - delivered_qty
    // For posted deliveries, we need to add back this delivery's qty since it's already counted
    const poLineMap = new Map<
      string,
      { item_id: string | null; quantity: number; delivered_qty: number; remaining_qty: number }
    >();

    if (delivery.po?.lines) {
      for (const poLine of delivery.po.lines) {
        const poQty = parseFloat(poLine.quantity.toString());
        const deliveredQty = parseFloat(poLine.delivered_qty.toString());

        // For POSTED deliveries, the delivered_qty already includes this delivery
        // For DRAFT deliveries, delivered_qty doesn't include this delivery yet
        // Calculate remaining as if this delivery hadn't happened yet
        let effectiveDeliveredQty = deliveredQty;
        if (delivery.status === "POSTED") {
          // Subtract this delivery's quantity from delivered_qty to get the "before" state
          const thisDeliveryLine = delivery.delivery_lines.find(
            (dl) => dl.po_line_id === poLine.id
          );
          if (thisDeliveryLine) {
            effectiveDeliveredQty -= parseFloat(thisDeliveryLine.quantity.toString());
          }
        }

        poLineMap.set(poLine.id, {
          item_id: poLine.item_id,
          quantity: poQty,
          delivered_qty: effectiveDeliveredQty,
          remaining_qty: Math.max(0, poQty - effectiveDeliveredQty),
        });
      }
    }

    // Process delivery lines with over-delivery detection
    const processedLines = [...delivery.delivery_lines]
      .sort((a, b) => (a.item?.name || "").localeCompare(b.item?.name || ""))
      .map((line) => {
        const quantity = parseFloat(line.quantity.toString());
        const unitPrice = parseFloat(line.unit_price.toString());
        const periodPrice = line.period_price ? parseFloat(line.period_price.toString()) : null;
        const priceVariance = parseFloat(line.price_variance.toString());
        const lineValue = parseFloat(line.line_value.toString());

        // Calculate over-delivery status by comparing to PO line
        let isOverDelivery = false;
        let poLineRemainingQty: number | null = null;

        if (line.po_line_id && poLineMap.has(line.po_line_id)) {
          const poLineInfo = poLineMap.get(line.po_line_id)!;
          poLineRemainingQty = poLineInfo.remaining_qty;
          isOverDelivery = quantity > poLineRemainingQty;
        } else if (delivery.po?.lines) {
          // Fallback: find PO line by item_id
          for (const poLine of delivery.po.lines) {
            if (poLine.item_id === line.item_id) {
              const poLineInfo = poLineMap.get(poLine.id);
              if (poLineInfo) {
                poLineRemainingQty = poLineInfo.remaining_qty;
                isOverDelivery = quantity > poLineRemainingQty;
              }
              break;
            }
          }
        }

        return {
          id: line.id,
          po_line_id: line.po_line_id,
          item: line.item,
          quantity,
          unit_price: unitPrice,
          period_price: periodPrice,
          price_variance: priceVariance,
          line_value: lineValue,
          has_variance: priceVariance !== 0,
          is_over_delivery: isOverDelivery,
          po_line_remaining_qty: poLineRemainingQty,
          over_delivery_approved: line.over_delivery_approved,
          variance_percentage:
            periodPrice && periodPrice > 0
              ? ((priceVariance / periodPrice) * 100).toFixed(2)
              : null,
        };
      });

    // Check if there are any over-delivery lines that need approval
    const hasOverDeliveryLines = processedLines.some((line) => line.is_over_delivery);
    const hasUnapprovedOverDelivery = processedLines.some(
      (line) => line.is_over_delivery && !line.over_delivery_approved
    );

    return {
      delivery: {
        id: delivery.id,
        delivery_no: delivery.delivery_no,
        delivery_date: delivery.delivery_date,
        invoice_no: delivery.invoice_no,
        delivery_note: delivery.delivery_note,
        total_amount: totalAmount,
        has_variance: delivery.has_variance,
        has_over_delivery: hasOverDeliveryLines,
        has_unapproved_over_delivery: hasUnapprovedOverDelivery,
        status: delivery.status,
        created_at: delivery.created_at,
        updated_at: delivery.updated_at,
        posted_at: delivery.posted_at,
        location: delivery.location,
        supplier: delivery.supplier,
        period: delivery.period,
        po: delivery.po
          ? {
              id: delivery.po.id,
              po_no: delivery.po.po_no,
              status: delivery.po.status,
              total_amount: parseFloat(delivery.po.total_amount.toString()),
            }
          : null,
        creator: delivery.creator,
        lines: processedLines,
        ncrs: delivery.ncrs.map((ncr) => ({
          ...ncr,
          quantity: ncr.quantity ? parseFloat(ncr.quantity.toString()) : null,
          value: parseFloat(ncr.value.toString()),
        })),
        summary: {
          total_lines: delivery.delivery_lines.length,
          total_items: delivery.delivery_lines.reduce(
            (sum, line) => sum + parseFloat(line.quantity.toString()),
            0
          ),
          total_amount: totalAmount,
          variance_lines: delivery.delivery_lines.filter(
            (line) => parseFloat(line.price_variance.toString()) !== 0
          ).length,
          total_variance_amount: delivery.delivery_lines.reduce(
            (sum, line) =>
              sum +
              parseFloat(line.price_variance.toString()) * parseFloat(line.quantity.toString()),
            0
          ),
          ncr_count: delivery.ncrs.length,
        },
      },
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching delivery:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch delivery",
      },
    });
  }
});
