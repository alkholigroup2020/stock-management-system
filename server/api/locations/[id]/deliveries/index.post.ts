/**
 * POST /api/locations/:id/deliveries
 *
 * Create a new delivery for a location (as DRAFT or POSTED)
 *
 * This endpoint handles:
 * - Delivery creation with multiple line items
 * - Draft saving (no stock impact, can be edited later)
 * - Direct posting with WAC recalculation, stock updates, NCR generation
 *
 * Business Rules:
 * - User must have POST or MANAGE access to the location
 * - For DRAFT: Period open not required, invoice_no optional
 * - For POSTED: Period must be open, invoice_no required, items must be active
 * - Price variance auto-creates NCR with type PRICE_VARIANCE (only on POSTED)
 * - Drafts are only visible to their creator
 *
 * Permissions:
 * - User must have POST or MANAGE access to the location
 * - ADMIN and SUPERVISOR have implicit access
 */

import prisma from "../../../../utils/prisma";
import { z } from "zod";
import { calculateWAC } from "../../../../utils/wac";
import { checkPriceVariance } from "../../../../utils/priceVariance";
import type { UserRole } from "@prisma/client";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

// Delivery line schema
const deliveryLineSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
});

// Request body schema
const bodySchema = z.object({
  supplier_id: z.string().uuid(),
  po_id: z.string().uuid().nullable().optional(),
  invoice_no: z.string().min(1).nullable().optional(), // Optional for drafts, required for posting
  delivery_note: z.string().nullable().optional(),
  delivery_date: z.string(), // ISO date string
  lines: z.array(deliveryLineSchema).min(1),
  status: z.enum(["DRAFT", "POSTED"]).optional().default("DRAFT"), // Draft or Post directly
});

/**
 * Generate next delivery number
 * Format: DEL-YYYY-NNN (e.g., DEL-2025-001)
 */
async function generateDeliveryNumber(year?: number): Promise<string> {
  const currentYear = year || new Date().getFullYear();
  const prefix = `DEL-${currentYear}-`;

  // Find the highest delivery number for this year
  const lastDelivery = await prisma.delivery.findFirst({
    where: {
      delivery_no: {
        startsWith: prefix,
      },
    },
    orderBy: {
      delivery_no: "desc",
    },
    select: {
      delivery_no: true,
    },
  });

  if (!lastDelivery) {
    // First delivery of the year
    return `${prefix}001`;
  }

  // Extract number from last delivery and increment
  const parts = lastDelivery.delivery_no.split("-");
  const lastNumber = parseInt(parts[2] || "0", 10);
  const nextNumber = lastNumber + 1;

  // Pad with zeros to 3 digits
  return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
}

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

  // Get location ID from route params
  const locationId = getRouterParam(event, "id");

  if (!locationId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        code: "MISSING_LOCATION_ID",
        message: "Location ID is required",
      },
    });
  }

  try {
    // Parse and validate request body
    const body = await readBody(event);
    const data = bodySchema.parse(body);
    const isPosting = data.status === "POSTED";

    // Additional validation for posting
    if (isPosting && !data.invoice_no) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invoice number is required when posting a delivery",
        },
      });
    }

    // Check if location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "LOCATION_NOT_FOUND",
          message: "Location not found",
        },
      });
    }

    // Check user has access to location (Operators need explicit assignment)
    if (user.role === "OPERATOR") {
      const userLocation = await prisma.userLocation.findUnique({
        where: {
          user_id_location_id: {
            user_id: user.id,
            location_id: locationId,
          },
        },
      });

      if (!userLocation) {
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

    // Get current open period (required for posting, optional for drafts)
    const currentPeriod = await prisma.period.findFirst({
      where: { status: "OPEN" },
      orderBy: { start_date: "desc" },
    });

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

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplier_id },
    });

    if (!supplier) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "SUPPLIER_NOT_FOUND",
          message: "Supplier not found",
        },
      });
    }

    // Verify all items exist (for drafts, just check they exist; for posting, check they're active)
    const itemIds = data.lines.map((line) => line.item_id);
    const items = await prisma.item.findMany({
      where: {
        id: { in: itemIds },
        ...(isPosting ? { is_active: true } : {}),
      },
    });

    if (items.length !== itemIds.length) {
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

    // Get period prices for variance detection (only needed if posting)
    const periodPriceMap = new Map<string, number>();
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
    }

    // Get current stock levels for WAC calculation (only needed if posting)
    const stockMap = new Map<string, { quantity: number; wac: number }>();
    if (isPosting) {
      const currentStocks = await prisma.locationStock.findMany({
        where: {
          location_id: locationId,
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

    // For drafts without open period, use the most recent period
    let periodIdForDelivery = currentPeriod?.id;
    if (!periodIdForDelivery) {
      const mostRecentPeriod = await prisma.period.findFirst({
        orderBy: { start_date: "desc" },
        select: { id: true },
      });
      if (!mostRecentPeriod) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "NO_PERIOD_EXISTS",
            message: "No accounting period exists. Please create a period first.",
          },
        });
      }
      periodIdForDelivery = mostRecentPeriod.id;
    }

    // Generate delivery number
    const deliveryNo = await generateDeliveryNumber();

    // Use a transaction to ensure atomicity
    // Increase timeout to 30 seconds to handle multiple line items and stock updates
    const result = await prisma.$transaction(
      async (tx) => {
        // Create delivery record
      const delivery = await tx.delivery.create({
        data: {
          delivery_no: deliveryNo,
          location_id: locationId,
          supplier_id: data.supplier_id,
          period_id: periodIdForDelivery,
          po_id: data.po_id || null,
          invoice_no: data.invoice_no || null,
          delivery_note: data.delivery_note || null,
          delivery_date: new Date(data.delivery_date),
          status: data.status,
          created_by: user.id,
          posted_at: isPosting ? new Date() : null,
          total_amount: 0, // Will be calculated from lines
          has_variance: false, // Will be updated if variance detected
        },
      });

      let totalAmount = 0;
      let hasVariance = false;
      const createdLines: unknown[] = [];
      const createdNCRs: unknown[] = [];

      // Process each delivery line
      for (const lineData of data.lines) {
        const item = items.find((i) => i.id === lineData.item_id)!;
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

        // Create delivery line
        const deliveryLine = await tx.deliveryLine.create({
          data: {
            delivery_id: delivery.id,
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
                location_id: locationId,
                item_id: lineData.item_id,
              },
            },
            update: {
              on_hand: { increment: lineData.quantity },
              wac: wacResult.newWAC,
            },
            create: {
              location_id: locationId,
              item_id: lineData.item_id,
              on_hand: lineData.quantity,
              wac: wacResult.newWAC,
            },
          });
        }

        // Create NCR if price variance detected
        if (lineHasVariance && periodPrice !== undefined) {
          // Generate NCR number
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
              location_id: locationId,
              delivery_id: delivery.id,
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

      // Update delivery with calculated totals
      const updatedDelivery = await tx.delivery.update({
        where: { id: delivery.id },
        data: {
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
      message = "Delivery draft saved successfully.";
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

    console.error("Error creating delivery:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to create delivery",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
