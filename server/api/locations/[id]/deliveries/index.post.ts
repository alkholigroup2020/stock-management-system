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
import {
  sendOverDeliveryApprovalNotification,
  sendPOClosedNotification,
} from "../../../../utils/email";
import type { UserRole } from "@prisma/client";
import {
  getLocationNameForDocument,
  formatDateForDocumentNumber,
} from "../../../../utils/documentNumbering";

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
  po_line_id: z.string().uuid().optional(), // Link to the specific PO line
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  over_delivery_approved: z.boolean().optional().default(false), // Requires Supervisor/Admin approval
});

// Request body schema
const bodySchema = z.object({
  supplier_id: z.string().uuid(),
  po_id: z.string().uuid(), // REQUIRED: Deliveries must be linked to a PO (as of User Story 4)
  invoice_no: z.string().min(1).nullable().optional(), // Optional for drafts, required for posting
  delivery_note: z.string().nullable().optional(),
  delivery_date: z.string(), // ISO date string
  lines: z.array(deliveryLineSchema).min(1),
  status: z.enum(["DRAFT", "POSTED"]).optional().default("DRAFT"), // Draft or Post directly
  send_for_approval: z.boolean().optional().default(false), // Only send approval notification when true
});

/**
 * Generate next delivery number
 * Format: DLV-{LocationName}-{DD}-{Mon}-{YYYY}-{NN}
 * Example: DLV-KITCHEN-27-Jan-2026-01
 */
async function generateDeliveryNumber(locationId: string): Promise<string> {
  // Fetch and sanitize location name (uppercase)
  const sanitizedName = await getLocationNameForDocument(locationId);

  // Format date as DD-Mon-YYYY
  const formattedDate = formatDateForDocumentNumber();

  // Build prefix: DLV-LocationName-Date-
  const prefix = `DLV-${sanitizedName}-${formattedDate}-`;

  // Find highest number for this location+date combination
  const lastDelivery = await prisma.delivery.findFirst({
    where: {
      delivery_no: { startsWith: prefix },
      location_id: locationId,
    },
    orderBy: { delivery_no: "desc" },
    select: { delivery_no: true },
  });

  if (!lastDelivery) {
    return `${prefix}01`;
  }

  // Extract number and increment
  const parts = lastDelivery.delivery_no.split("-");
  const lastNumber = parseInt(parts[parts.length - 1] || "0", 10);
  const nextNumber = lastNumber + 1;

  return `${prefix}${nextNumber.toString().padStart(2, "0")}`;
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

    // Additional validation for send_for_approval - invoice number is required
    if (data.send_for_approval && !data.invoice_no) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invoice number is required when sending for approval",
        },
      });
    }

    if (data.invoice_no) {
      const existingInvoice = await prisma.delivery.findFirst({
        where: {
          invoice_no: data.invoice_no,
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

    // Verify all items exist (for drafts, just check they exist; for posting, check they're active)
    const itemIds = data.lines.map((line) => line.item_id);

    // Use $transaction to batch all initial validation queries into a single database round-trip
    const [location, userLocation, currentPeriod, supplier, items, purchaseOrder] =
      await prisma.$transaction([
        // Check if location exists
        prisma.location.findUnique({
          where: { id: locationId },
        }),
        // Check user access
        prisma.userLocation.findUnique({
          where: {
            user_id_location_id: {
              user_id: user.id,
              location_id: locationId,
            },
          },
        }),
        // Get current open period
        prisma.period.findFirst({
          where: { status: "OPEN" },
          orderBy: { start_date: "desc" },
        }),
        // Verify supplier exists
        prisma.supplier.findUnique({
          where: { id: data.supplier_id },
        }),
        // Verify all items exist
        prisma.item.findMany({
          where: {
            id: { in: itemIds },
            ...(isPosting ? { is_active: true } : {}),
          },
        }),
        // Verify PO exists and is OPEN, include lines for quantity tracking
        prisma.pO.findUnique({
          where: { id: data.po_id },
          include: {
            supplier: { select: { id: true } },
            lines: {
              select: {
                id: true,
                item_id: true,
                quantity: true,
                delivered_qty: true,
              },
            },
          },
        }),
      ]);

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
    if (user.role === "OPERATOR" && !userLocation) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "LOCATION_ACCESS_DENIED",
          message: "You do not have access to this location",
        },
      });
    }
    // Admins and Supervisors have implicit access to all locations

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

    // Validate PO exists and is in OPEN status
    if (!purchaseOrder) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "PO_NOT_FOUND",
          message: "Purchase Order not found. Deliveries must be linked to a valid PO.",
        },
      });
    }

    if (purchaseOrder.status !== "OPEN") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "PO_NOT_OPEN",
          message: `Cannot create delivery for a ${purchaseOrder.status} Purchase Order. Only OPEN POs can receive deliveries.`,
        },
      });
    }

    // Validate that the supplier matches the PO's supplier
    if (purchaseOrder.supplier.id !== data.supplier_id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "SUPPLIER_MISMATCH",
          message:
            "Supplier does not match the Purchase Order. Delivery supplier must match PO supplier.",
        },
      });
    }

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

    // Build a map of PO lines for quantity tracking
    // Map: po_line_id -> { item_id, quantity, delivered_qty, remaining_qty }
    const poLineMap = new Map<
      string,
      { item_id: string | null; quantity: number; delivered_qty: number; remaining_qty: number }
    >();
    if (purchaseOrder.lines) {
      for (const poLine of purchaseOrder.lines) {
        const qty = parseFloat(poLine.quantity.toString());
        const deliveredQty = parseFloat(poLine.delivered_qty.toString());
        poLineMap.set(poLine.id, {
          item_id: poLine.item_id,
          quantity: qty,
          delivered_qty: deliveredQty,
          remaining_qty: Math.max(0, qty - deliveredQty),
        });
      }
    }

    // Validate over-delivery: check if any line exceeds remaining PO quantity
    const overDeliveryLines: Array<{
      item_id: string;
      po_line_id: string | undefined;
      requested_qty: number;
      remaining_qty: number;
      approved: boolean;
    }> = [];

    for (const lineData of data.lines) {
      // Find matching PO line by po_line_id or by item_id
      let poLineId = lineData.po_line_id;
      let poLineInfo:
        | { item_id: string | null; quantity: number; delivered_qty: number; remaining_qty: number }
        | undefined;

      if (poLineId && poLineMap.has(poLineId)) {
        poLineInfo = poLineMap.get(poLineId);
      } else {
        // Fallback: find PO line by item_id (for backwards compatibility)
        for (const [id, info] of poLineMap.entries()) {
          if (info.item_id === lineData.item_id) {
            poLineId = id;
            poLineInfo = info;
            break;
          }
        }
      }

      if (poLineInfo && lineData.quantity > poLineInfo.remaining_qty) {
        overDeliveryLines.push({
          item_id: lineData.item_id,
          po_line_id: poLineId,
          requested_qty: lineData.quantity,
          remaining_qty: poLineInfo.remaining_qty,
          approved: lineData.over_delivery_approved ?? false,
        });
      }
    }

    // If there are over-delivery lines without approval, block for non-Supervisor/Admin
    // NOTE: This validation only applies when POSTING, not when saving as draft
    // Operators can save drafts with over-delivery and Supervisors will be notified
    const unapprovedOverDeliveries = overDeliveryLines.filter((line) => !line.approved);
    if (isPosting && unapprovedOverDeliveries.length > 0) {
      // Only Supervisor and Admin can approve over-deliveries when posting
      if (user.role !== "SUPERVISOR" && user.role !== "ADMIN") {
        const itemNames = unapprovedOverDeliveries.map((line) => {
          const item = items.find((i) => i.id === line.item_id);
          return item ? item.name : line.item_id;
        });
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "OVER_DELIVERY_NOT_APPROVED",
            message: `Over-delivery detected for: ${itemNames.join(", ")}. Supervisor or Admin approval is required to exceed PO quantities.`,
            details: unapprovedOverDeliveries.map((line) => ({
              item_id: line.item_id,
              requested_qty: line.requested_qty,
              remaining_qty: line.remaining_qty,
              excess: line.requested_qty - line.remaining_qty,
            })),
          },
        });
      }
      // Supervisor/Admin can proceed, but flag it as approved
      for (const line of overDeliveryLines) {
        line.approved = true;
      }
    }

    // Build maps for period prices and stock levels
    const periodPriceMap = new Map<string, number>();
    const stockMap = new Map<string, { quantity: number; wac: number }>();
    let periodIdForDelivery = currentPeriod?.id;

    // Use $transaction to batch additional queries into a single database round-trip
    if (isPosting && currentPeriod) {
      // When posting, fetch period prices and current stock levels together
      const [periodPrices, currentStocks] = await prisma.$transaction([
        prisma.itemPrice.findMany({
          where: {
            period_id: currentPeriod.id,
            item_id: { in: itemIds },
          },
        }),
        prisma.locationStock.findMany({
          where: {
            location_id: locationId,
            item_id: { in: itemIds },
          },
        }),
      ]);

      periodPrices.forEach((pp) => {
        periodPriceMap.set(pp.item_id, parseFloat(pp.price.toString()));
      });

      currentStocks.forEach((stock) => {
        stockMap.set(stock.item_id, {
          quantity: parseFloat(stock.on_hand.toString()),
          wac: parseFloat(stock.wac.toString()),
        });
      });
    } else if (!periodIdForDelivery) {
      // For drafts without open period, find the most recent period
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
    const deliveryNo = await generateDeliveryNumber(locationId);

    // Ensure periodIdForDelivery is defined before creating delivery
    if (!periodIdForDelivery) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "NO_PERIOD_EXISTS",
          message: "No accounting period exists. Please create a period first.",
        },
      });
    }

    // Capture periodIdForDelivery in a const for type safety inside transaction
    const periodId = periodIdForDelivery;

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
            period_id: periodId,
            po_id: data.po_id, // Required: validated above
            invoice_no: data.invoice_no || null,
            delivery_note: data.delivery_note || null,
            delivery_date: new Date(data.delivery_date),
            status: data.status,
            created_by: user.id,
            posted_at: isPosting ? new Date() : null,
            total_amount: 0, // Will be calculated from lines
            has_variance: false, // Will be updated if variance detected
            pending_approval: data.send_for_approval || false, // Lock for operator if sent for approval
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

          // Find the matching PO line for tracking
          let matchedPoLineId = lineData.po_line_id;
          if (!matchedPoLineId) {
            // Fallback: find PO line by item_id
            for (const [id, info] of poLineMap.entries()) {
              if (info.item_id === lineData.item_id) {
                matchedPoLineId = id;
                break;
              }
            }
          }

          // Check if this line has approved over-delivery
          const overDeliveryInfo = overDeliveryLines.find(
            (ol) => ol.item_id === lineData.item_id && ol.po_line_id === matchedPoLineId
          );
          const isOverDeliveryApproved = overDeliveryInfo?.approved ?? false;

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

          // Create delivery line with PO line link and over-delivery approval
          const deliveryLine = await tx.deliveryLine.create({
            data: {
              delivery_id: delivery.id,
              item_id: lineData.item_id,
              po_line_id: matchedPoLineId || null,
              quantity: lineData.quantity,
              unit_price: lineData.unit_price,
              period_price: periodPrice || lineData.unit_price,
              price_variance: priceVariance,
              line_value: lineValue,
              over_delivery_approved: isOverDeliveryApproved,
            },
          });

          // Update PO line delivered_qty (only when posting and we have a matched PO line)
          if (isPosting && matchedPoLineId) {
            await tx.pOLine.update({
              where: { id: matchedPoLineId },
              data: {
                delivered_qty: { increment: lineData.quantity },
              },
            });
          }

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
            po_line_id: matchedPoLineId || null,
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
            over_delivery_approved: isOverDeliveryApproved,
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

    // Check if PO should be automatically closed (all items fully delivered)
    let poAutoClosed = false;
    let poAutoCloseEmailSent = false;
    if (isPosting && data.po_id) {
      // Re-query the PO lines to get updated delivered_qty values
      const poLines = await prisma.pOLine.findMany({
        where: { po_id: data.po_id },
        select: {
          id: true,
          quantity: true,
          delivered_qty: true,
        },
      });

      // Check if all lines are fully delivered (delivered_qty >= quantity)
      const allFullyDelivered = poLines.every((line) => {
        const qty = parseFloat(line.quantity.toString());
        const deliveredQty = parseFloat(line.delivered_qty.toString());
        return deliveredQty >= qty;
      });

      if (allFullyDelivered && poLines.length > 0) {
        // Automatically close the PO with full details for email notification
        const closedPO = await prisma.pO.update({
          where: { id: data.po_id },
          data: { status: "CLOSED" },
          include: {
            prf: {
              select: {
                id: true,
                status: true,
                prf_no: true,
                requester: {
                  select: { id: true, username: true, full_name: true, email: true },
                },
              },
            },
            supplier: {
              select: { id: true, name: true },
            },
          },
        });

        poAutoClosed = true;

        // Also close the linked PRF if it exists and is still approved
        if (closedPO.prf && closedPO.prf.status === "APPROVED") {
          await prisma.pRF.update({
            where: { id: closedPO.prf.id },
            data: { status: "CLOSED" },
          });
        }

        // Send email notification to the original PRF requester
        if (closedPO.prf && closedPO.prf.requester?.email) {
          const poWithDetails = await prisma.pO.findUnique({
            where: { id: data.po_id },
            select: { po_no: true, total_amount: true },
          });

          if (poWithDetails) {
            const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000";
            const poUrl = `${baseUrl}/orders/pos/${data.po_id}`;

            try {
              const emailResult = await sendPOClosedNotification({
                recipientEmail: closedPO.prf.requester.email,
                poNumber: poWithDetails.po_no,
                prfNumber: closedPO.prf.prf_no,
                closedByName: "System (Auto-Close)",
                supplierName: closedPO.supplier.name,
                totalAmount: `SAR ${Number(poWithDetails.total_amount).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                poUrl,
              });

              if (emailResult.success) {
                poAutoCloseEmailSent = true;
              } else {
                console.error(
                  `[Delivery POST] PO auto-close email notification failed: ${emailResult.error}`
                );
              }
            } catch (err) {
              console.error("[Delivery POST] Failed to send PO auto-close notification:", err);
              // Don't fail the delivery creation if email fails
            }
          }
        }
      }
    }

    // Build response message based on status
    let message: string;
    let emailSent = false;

    if (isPosting) {
      const parts: string[] = [];
      if (result.ncrs.length > 0) {
        parts.push(
          `${result.ncrs.length} price variance(s) detected and NCR(s) created automatically`
        );
      }
      if (poAutoClosed) {
        parts.push("PO has been automatically closed (all items fully delivered)");
      }
      message =
        parts.length > 0
          ? `Delivery posted. ${parts.join(". ")}.`
          : "Delivery posted successfully.";
    } else {
      message = "Delivery draft saved successfully.";

      // Send email notification to Supervisors only when explicitly requested via send_for_approval flag
      if (
        data.send_for_approval &&
        user.role === "OPERATOR" &&
        overDeliveryLines.length > 0 &&
        overDeliveryLines.some((line) => !line.approved)
      ) {
        try {
          // Find all Supervisors and Admins assigned to this location
          const supervisorsAndAdmins = await prisma.user.findMany({
            where: {
              is_active: true,
              role: { in: ["SUPERVISOR", "ADMIN"] },
              OR: [
                // Supervisors/Admins explicitly assigned to this location
                {
                  user_locations: {
                    some: { location_id: locationId },
                  },
                },
                // Admins and Supervisors have implicit access to all locations
                { role: "ADMIN" },
                { role: "SUPERVISOR" },
              ],
            },
            select: {
              email: true,
              full_name: true,
            },
          });

          const recipientEmails = supervisorsAndAdmins
            .map((u) => u.email)
            .filter((email): email is string => !!email);

          if (recipientEmails.length > 0) {
            // Build over-delivery items for email
            const overDeliveryItemsForEmail = overDeliveryLines
              .filter((line) => !line.approved)
              .map((line) => {
                const item = items.find((i) => i.id === line.item_id);
                return {
                  itemName: item?.name || line.item_id,
                  requestedQty: line.requested_qty,
                  remainingQty: line.remaining_qty,
                  excessQty: line.requested_qty - line.remaining_qty,
                };
              });

            // Build delivery URL
            const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000";
            const deliveryUrl = `${siteUrl}/deliveries/${result.delivery.id}`;

            // Send notification email
            const emailResult = await sendOverDeliveryApprovalNotification({
              recipientEmails,
              deliveryNumber: result.delivery.delivery_no,
              creatorName: user.username,
              locationName: location.name,
              overDeliveryItems: overDeliveryItemsForEmail,
              deliveryUrl,
            });

            if (emailResult.success) {
              emailSent = true;
            }
          }
        } catch (emailError) {
          // Don't fail the delivery creation if email fails
          console.error("[Delivery API] Failed to send over-delivery notification:", emailError);
        }

        message = emailSent
          ? "Delivery draft saved. Supervisors have been notified for over-delivery approval."
          : "Delivery draft saved. Over-delivery items require supervisor approval.";
      }
    }

    return {
      id: result.delivery.id,
      message,
      po_auto_closed: poAutoClosed, // Flag to indicate if PO was automatically closed
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
