/**
 * PATCH /api/deliveries/:id
 *
 * Update a draft delivery or post it
 *
 * This endpoint handles:
 * - Updating draft delivery fields and lines
 * - Posting a draft (transitioning from DRAFT to POSTED)
 * - When posting: WAC recalculation, stock updates, NCR generation
 *
 * Business Rules:
 * - Only DRAFT deliveries can be updated
 * - Only the creator can update their draft
 * - When status changes to POSTED, full validation applies
 * - Posted deliveries cannot be modified
 *
 * Permissions:
 * - User must have POST or MANAGE access to the location
 * - Only the creator can update their draft (unless ADMIN/SUPERVISOR)
 */

import prisma from "../../utils/prisma";
import { z } from "zod";
import { calculateWAC } from "../../utils/wac";
import { checkPriceVariance } from "../../utils/priceVariance";
import type { UserRole } from "@prisma/client";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

// Delivery line schema for updates
const deliveryLineSchema = z.object({
  id: z.string().uuid().optional(), // Existing line ID (for updates)
  item_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
});

// Request body schema
const bodySchema = z.object({
  supplier_id: z.string().uuid().optional(),
  po_id: z.string().uuid().nullable().optional(),
  invoice_no: z.string().min(1).optional().nullable(),
  delivery_note: z.string().nullable().optional(),
  delivery_date: z.string().optional(),
  lines: z.array(deliveryLineSchema).min(1).optional(),
  status: z.enum(["DRAFT", "POSTED"]).optional(),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user as AuthUser | undefined;

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

  // Get delivery ID from route params
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

  try {
    // Parse and validate request body
    const body = await readBody(event);
    const data = bodySchema.parse(body);
    const isPosting = data.status === "POSTED";

    // Get item IDs from request for validation query
    const requestItemIds = data.lines?.map((line) => line.item_id) || [];

    // OPTIMIZATION: Batch all initial validation queries into a single parallel fetch
    const [delivery, userLocations, currentPeriod, items] = await Promise.all([
      // Fetch the existing delivery
      prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          delivery_lines: true,
          location: true,
        },
      }),
      // For operators, fetch their location assignments
      user.role === "OPERATOR"
        ? prisma.userLocation.findMany({
            where: { user_id: user.id },
            select: { location_id: true },
          })
        : Promise.resolve([]),
      // Get current open period (needed for posting)
      isPosting
        ? prisma.period.findFirst({
            where: { status: "OPEN" },
            orderBy: { start_date: "desc" },
          })
        : Promise.resolve(null),
      // Get items for validation (if lines provided in request)
      requestItemIds.length > 0
        ? prisma.item.findMany({
            where: {
              id: { in: requestItemIds },
              ...(isPosting ? { is_active: true } : {}),
            },
          })
        : Promise.resolve([]),
    ]);

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

    // Check if delivery is already posted
    if (delivery.status === "POSTED") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "DELIVERY_ALREADY_POSTED",
          message: "Posted deliveries cannot be edited",
        },
      });
    }

    // Check if user is the creator (or ADMIN/SUPERVISOR)
    if (delivery.created_by !== user.id && user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "NOT_DRAFT_OWNER",
          message: "You can only edit drafts you created",
        },
      });
    }

    // Check user has access to location (Operators need explicit assignment)
    if (user.role === "OPERATOR") {
      const hasLocationAccess = userLocations.some((ul) => ul.location_id === delivery.location_id);

      if (!hasLocationAccess) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            code: "LOCATION_ACCESS_DENIED",
            message: "You do not have access to this location",
          },
        });
      }
    }
    // Admins and Supervisors have implicit access to all locations

    // Additional validation for posting
    const finalInvoiceNo = data.invoice_no ?? delivery.invoice_no;
    if (isPosting && !finalInvoiceNo) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invoice number is required when posting a delivery",
        },
      });
    }

    if (finalInvoiceNo) {
      const existingInvoice = await prisma.delivery.findFirst({
        where: {
          invoice_no: finalInvoiceNo,
          NOT: { id: deliveryId },
        },
        select: { id: true },
      });

      if (existingInvoice) {
        throw createError({
          statusCode: 409,
          statusMessage: "Conflict",
          data: {
            code: "DUPLICATE_INVOICE_NO",
            message: "Invoice number already exists for another delivery",
          },
        });
      }
    }

    // Validate period exists for posting
    if (isPosting && !currentPeriod) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "NO_OPEN_PERIOD",
          message: "No open accounting period. Please open a period before posting deliveries.",
        },
      });
    }

    // Get items for validation - use fetched items or fetch from existing delivery lines
    const linesToProcess =
      data.lines ||
      delivery.delivery_lines.map((l) => ({
        id: l.id,
        item_id: l.item_id,
        quantity: parseFloat(l.quantity.toString()),
        unit_price: parseFloat(l.unit_price.toString()),
      }));

    const itemIds = linesToProcess.map((line) => line.item_id);

    // If no lines were in request, fetch items from existing delivery lines
    let finalItems = items;
    if (requestItemIds.length === 0 && itemIds.length > 0) {
      finalItems = await prisma.item.findMany({
        where: {
          id: { in: itemIds },
          ...(isPosting ? { is_active: true } : {}),
        },
      });
    }

    if (finalItems.length !== itemIds.length) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "INVALID_ITEMS",
          message: isPosting
            ? "One or more items not found or inactive"
            : "One or more items not found",
        },
      });
    }

    // Get period prices and stock levels (only for posting)
    const periodPriceMap = new Map<string, number>();
    const stockMap = new Map<string, { quantity: number; wac: number }>();

    if (isPosting && currentPeriod) {
      const periodPrices = await prisma.itemPrice.findMany({
        where: {
          period_id: currentPeriod.id,
          item_id: { in: itemIds },
        },
      });

      periodPrices.forEach((pp) => {
        periodPriceMap.set(pp.item_id, parseFloat(pp.price.toString()));
      });

      const currentStocks = await prisma.locationStock.findMany({
        where: {
          location_id: delivery.location_id,
          item_id: { in: itemIds },
        },
      });

      currentStocks.forEach((stock) => {
        stockMap.set(stock.item_id, {
          quantity: parseFloat(stock.on_hand.toString()),
          wac: parseFloat(stock.wac.toString()),
        });
      });
    }

    // Use a transaction to ensure atomicity
    // Increase timeout to 30 seconds to handle multiple line items and stock updates
    const result = await prisma.$transaction(
      async (tx) => {
        // Delete existing lines if new lines provided OR if we're posting
        // When posting without explicit lines, we use existing lines as fallback (line 200),
        // but we still need to delete them first to avoid duplication
        if (data.lines || isPosting) {
          await tx.deliveryLine.deleteMany({
            where: { delivery_id: deliveryId },
          });
        }

        let totalAmount = 0;
        let hasVariance = false;
        const createdLines: unknown[] = [];
        const createdNCRs: unknown[] = [];

        // Process each delivery line
        for (const lineData of linesToProcess) {
          const item = finalItems.find((i) => i.id === lineData.item_id)!;
          const periodPrice = periodPriceMap.get(lineData.item_id);
          const currentStock = stockMap.get(lineData.item_id) || { quantity: 0, wac: 0 };

          // Calculate line value
          const lineValue = lineData.quantity * lineData.unit_price;
          totalAmount += lineValue;

          // Calculate WAC and check variance only when posting
          let wacResult = { newWAC: 0, previousWAC: 0 };
          let priceVariance = 0;
          let variancePercent = 0;
          let lineHasVariance = false;

          if (isPosting) {
            // Calculate new WAC
            wacResult = calculateWAC(
              currentStock.quantity,
              currentStock.wac,
              lineData.quantity,
              lineData.unit_price
            );

            // Check for price variance
            if (periodPrice !== undefined) {
              const varianceResult = checkPriceVariance(
                lineData.unit_price,
                periodPrice,
                lineData.quantity
              );
              priceVariance = varianceResult.variance;
              variancePercent = varianceResult.variancePercent;
              lineHasVariance = varianceResult.hasVariance;

              if (lineHasVariance) {
                hasVariance = true;
              }
            }
          }

          // Create delivery line (either new or recreated)
          const deliveryLine = await tx.deliveryLine.create({
            data: {
              delivery_id: deliveryId,
              item_id: lineData.item_id,
              quantity: lineData.quantity,
              unit_price: lineData.unit_price,
              period_price: periodPrice || lineData.unit_price,
              price_variance: priceVariance,
              line_value: lineValue,
            },
          });

          // Update or create location stock (only when posting)
          if (isPosting) {
            await tx.locationStock.upsert({
              where: {
                location_id_item_id: {
                  location_id: delivery.location_id,
                  item_id: lineData.item_id,
                },
              },
              update: {
                on_hand: { increment: lineData.quantity },
                wac: wacResult.newWAC,
              },
              create: {
                location_id: delivery.location_id,
                item_id: lineData.item_id,
                on_hand: lineData.quantity,
                wac: wacResult.newWAC,
              },
            });

            // Create NCR if price variance detected
            if (lineHasVariance && periodPrice !== undefined) {
              const ncrPrefix = `NCR-${new Date().getFullYear()}-`;
              const lastNCR = await tx.nCR.findFirst({
                where: { ncr_no: { startsWith: ncrPrefix } },
                orderBy: { ncr_no: "desc" },
                select: { ncr_no: true },
              });

              let ncrNumber = 1;
              if (lastNCR) {
                const parts = lastNCR.ncr_no.split("-");
                ncrNumber = parseInt(parts[2] || "0", 10) + 1;
              }
              const ncrNo = `${ncrPrefix}${ncrNumber.toString().padStart(3, "0")}`;

              const ncr = await tx.nCR.create({
                data: {
                  ncr_no: ncrNo,
                  location_id: delivery.location_id,
                  delivery_id: deliveryId,
                  delivery_line_id: deliveryLine.id,
                  type: "PRICE_VARIANCE",
                  status: "OPEN",
                  reason: `Price variance detected: Expected ${periodPrice?.toFixed(2)}, Actual ${lineData.unit_price.toFixed(2)} (${variancePercent.toFixed(1)}% ${priceVariance > 0 ? "increase" : "decrease"})`,
                  quantity: lineData.quantity,
                  value: Math.abs(priceVariance * lineData.quantity),
                  auto_generated: true,
                  created_by: user.id,
                },
              });

              createdNCRs.push({
                id: ncr.id,
                ncr_no: ncr.ncr_no,
                type: ncr.type,
                item: {
                  id: item.id,
                  code: item.code,
                  name: item.name,
                },
                expected_price: periodPrice,
                actual_price: lineData.unit_price,
                variance: priceVariance,
                variance_percent: variancePercent,
              });
            }
          }

          createdLines.push({
            id: deliveryLine.id,
            item: {
              id: item.id,
              code: item.code,
              name: item.name,
              unit: item.unit,
            },
            quantity: lineData.quantity,
            unit_price: lineData.unit_price,
            period_price: periodPrice || lineData.unit_price,
            price_variance: priceVariance,
            line_value: lineValue,
            wac_before: currentStock.wac,
            wac_after: wacResult.newWAC,
          });
        }

        // Update delivery record
        const updatedDelivery = await tx.delivery.update({
          where: { id: deliveryId },
          data: {
            supplier_id: data.supplier_id,
            po_id: data.po_id,
            invoice_no: data.invoice_no ?? delivery.invoice_no,
            delivery_note: data.delivery_note ?? delivery.delivery_note,
            delivery_date: data.delivery_date ? new Date(data.delivery_date) : undefined,
            period_id: isPosting && currentPeriod ? currentPeriod.id : undefined,
            status: data.status,
            posted_at: isPosting ? new Date() : undefined,
            total_amount: totalAmount,
            has_variance: hasVariance,
          },
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
              },
            },
            creator: {
              select: {
                id: true,
                username: true,
                full_name: true,
              },
            },
          },
        });

        return {
          delivery: updatedDelivery,
          lines: createdLines,
          ncrs: createdNCRs,
        };
      },
      {
        maxWait: 10000, // Max time to wait for a transaction slot (10 seconds)
        timeout: 30000, // Max time the transaction can run (30 seconds)
      }
    );

    // Build response message based on status
    let message: string;
    if (isPosting) {
      message =
        result.ncrs.length > 0
          ? `Delivery posted. ${result.ncrs.length} price variance(s) detected and NCR(s) created automatically.`
          : "Delivery posted successfully.";
    } else {
      message = "Delivery draft updated successfully.";
    }

    return {
      id: result.delivery.id,
      message,
      delivery: {
        id: result.delivery.id,
        delivery_no: result.delivery.delivery_no,
        delivery_date: result.delivery.delivery_date,
        invoice_no: result.delivery.invoice_no,
        total_amount: result.delivery.total_amount,
        has_variance: result.delivery.has_variance,
        status: result.delivery.status,
        location: result.delivery.location,
        supplier: result.delivery.supplier,
        created_by: result.delivery.creator,
        created_at: result.delivery.created_at,
        posted_at: result.delivery.posted_at,
      },
      lines: result.lines,
      ncrs: result.ncrs,
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: error.issues,
        },
      });
    }

    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error updating delivery:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to update delivery",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
