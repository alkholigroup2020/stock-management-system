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

    return {
      delivery: {
        id: delivery.id,
        delivery_no: delivery.delivery_no,
        delivery_date: delivery.delivery_date,
        invoice_no: delivery.invoice_no,
        delivery_note: delivery.delivery_note,
        total_amount: totalAmount,
        has_variance: delivery.has_variance,
        status: delivery.status,
        created_at: delivery.created_at,
        updated_at: delivery.updated_at,
        posted_at: delivery.posted_at,
        location: delivery.location,
        supplier: delivery.supplier,
        period: delivery.period,
        po: delivery.po
          ? {
              ...delivery.po,
              total_amount: parseFloat(delivery.po.total_amount.toString()),
            }
          : null,
        creator: delivery.creator,
        // Sort delivery lines by item name in JavaScript (faster than nested SQL ordering)
        lines: [...delivery.delivery_lines]
          .sort((a, b) => (a.item?.name || "").localeCompare(b.item?.name || ""))
          .map((line) => {
            const quantity = parseFloat(line.quantity.toString());
            const unitPrice = parseFloat(line.unit_price.toString());
            const periodPrice = line.period_price ? parseFloat(line.period_price.toString()) : null;
            const priceVariance = parseFloat(line.price_variance.toString());
            const lineValue = parseFloat(line.line_value.toString());

            return {
              id: line.id,
              item: line.item,
              quantity,
              unit_price: unitPrice,
              period_price: periodPrice,
              price_variance: priceVariance,
              line_value: lineValue,
              has_variance: priceVariance !== 0,
              variance_percentage:
                periodPrice && periodPrice > 0
                  ? ((priceVariance / periodPrice) * 100).toFixed(2)
                  : null,
            };
          }),
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
