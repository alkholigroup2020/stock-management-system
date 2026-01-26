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
import {
  sendOverDeliveryApprovalNotification,
  sendOverDeliveryApprovedNotification,
  sendOverDeliveryRejectedNotification,
  sendPOClosedNotification,
} from "../../utils/email";
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
  po_line_id: z.string().uuid().nullable().optional(), // Link to the specific PO line (can be null)
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  over_delivery_approved: z.boolean().optional().default(false), // Requires Supervisor/Admin approval
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
  // Email notification triggers
  send_for_approval: z.boolean().optional(), // Operator sends draft for over-delivery approval
  notify_approval: z.boolean().optional(), // Send approval notification to creator
  notify_rejection: z.boolean().optional(), // Send rejection notification to creator
  rejection_reason: z.string().optional(), // Reason for rejection (required if notify_rejection)
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

    // Block ALL actions if over-delivery was rejected
    // Rejected deliveries are locked - a new delivery must be created instead
    if (delivery.over_delivery_rejected) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "OVER_DELIVERY_REJECTED",
          message:
            "This delivery was rejected due to over-delivery and is now locked. Please create a new delivery with the correct quantities.",
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

    // Additional validation for send_for_approval - invoice number is required
    if (data.send_for_approval && !finalInvoiceNo) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invoice number is required when sending for approval",
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
    // IMPORTANT: Include po_line_id and over_delivery_approved to preserve approval status
    const linesToProcess =
      data.lines ||
      delivery.delivery_lines.map((l) => ({
        id: l.id,
        item_id: l.item_id,
        po_line_id: l.po_line_id,
        quantity: parseFloat(l.quantity.toString()),
        unit_price: parseFloat(l.unit_price.toString()),
        over_delivery_approved: l.over_delivery_approved,
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

    // Get PO and its lines for over-delivery validation (if PO exists)
    const poId = data.po_id ?? delivery.po_id;
    let poLineMap = new Map<
      string,
      { item_id: string | null; quantity: number; delivered_qty: number; remaining_qty: number }
    >();

    if (poId && isPosting) {
      const purchaseOrder = await prisma.pO.findUnique({
        where: { id: poId },
        include: {
          lines: {
            select: {
              id: true,
              item_id: true,
              quantity: true,
              delivered_qty: true,
            },
          },
        },
      });

      if (purchaseOrder && purchaseOrder.status !== "OPEN") {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "PO_NOT_OPEN",
            message: `Cannot post delivery for a ${purchaseOrder.status} Purchase Order.`,
          },
        });
      }

      if (purchaseOrder?.lines) {
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
    }

    // Validate over-delivery when posting
    interface OverDeliveryLineInfo {
      item_id: string;
      po_line_id: string | undefined;
      requested_qty: number;
      remaining_qty: number;
      approved: boolean;
    }
    const overDeliveryLines: OverDeliveryLineInfo[] = [];

    if (isPosting && poId) {
      for (const lineData of linesToProcess) {
        // Find matching PO line by po_line_id or by item_id
        const lineWithPoId = lineData as typeof lineData & {
          po_line_id?: string;
          over_delivery_approved?: boolean;
        };
        let poLineId = lineWithPoId.po_line_id;
        let poLineInfo:
          | {
              item_id: string | null;
              quantity: number;
              delivered_qty: number;
              remaining_qty: number;
            }
          | undefined;

        if (poLineId && poLineMap.has(poLineId)) {
          poLineInfo = poLineMap.get(poLineId);
        } else {
          // Fallback: find PO line by item_id
          for (const [id, info] of poLineMap.entries()) {
            if (info.item_id === lineData.item_id) {
              poLineId = id;
              poLineInfo = info;
              break;
            }
          }
        }

        if (poLineInfo && lineData.quantity > poLineInfo.remaining_qty) {
          // Check if this line was already marked as approved in the delivery
          const existingLine = delivery.delivery_lines.find((l) => l.item_id === lineData.item_id);
          const isApproved =
            existingLine?.over_delivery_approved || lineWithPoId.over_delivery_approved || false;

          overDeliveryLines.push({
            item_id: lineData.item_id,
            po_line_id: poLineId,
            requested_qty: lineData.quantity,
            remaining_qty: poLineInfo.remaining_qty,
            approved: isApproved,
          });
        }
      }

      // If there are unapproved over-deliveries, block non-Supervisor/Admin
      const unapprovedOverDeliveries = overDeliveryLines.filter((line) => !line.approved);
      if (unapprovedOverDeliveries.length > 0) {
        if (user.role !== "SUPERVISOR" && user.role !== "ADMIN") {
          const itemNames = unapprovedOverDeliveries.map((line) => {
            const item = finalItems.find((i) => i.id === line.item_id);
            return item ? item.name : line.item_id;
          });
          throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            data: {
              code: "OVER_DELIVERY_NOT_APPROVED",
              message: `Over-delivery detected for: ${itemNames.join(", ")}. Supervisor or Admin approval is required.`,
              details: unapprovedOverDeliveries.map((line) => ({
                item_id: line.item_id,
                requested_qty: line.requested_qty,
                remaining_qty: line.remaining_qty,
                excess: line.requested_qty - line.remaining_qty,
              })),
            },
          });
        }
        // Supervisor/Admin implicitly approves by posting
        for (const line of overDeliveryLines) {
          line.approved = true;
        }
      }
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
        let totalAmount = parseFloat(delivery.total_amount.toString());
        let hasVariance = delivery.has_variance;
        const createdLines: unknown[] = [];
        const createdNCRs: unknown[] = [];

        // Only process lines if explicitly provided or posting
        // This prevents duplicating lines when only updating header fields (e.g., rejection note)
        const shouldProcessLines = data.lines || isPosting;

        if (shouldProcessLines) {
          // Delete existing lines first to avoid duplication
          await tx.deliveryLine.deleteMany({
            where: { delivery_id: deliveryId },
          });

          // Reset totals for recalculation
          totalAmount = 0;
          hasVariance = false;
        }

        // Process each delivery line (only if we should)
        for (const lineData of shouldProcessLines ? linesToProcess : []) {
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

          // Find matching PO line info for this delivery line
          const lineWithPoId = lineData as typeof lineData & { po_line_id?: string };
          let matchedPoLineId = lineWithPoId.po_line_id;
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
          // When posting, use the calculated overDeliveryLines array
          // When updating draft, also accept the value from the request body
          const overDeliveryInfo = overDeliveryLines.find(
            (ol) => ol.item_id === lineData.item_id && ol.po_line_id === matchedPoLineId
          );
          const lineWithApproval = lineData as typeof lineData & {
            over_delivery_approved?: boolean;
          };
          const isOverDeliveryApproved =
            overDeliveryInfo?.approved ?? lineWithApproval.over_delivery_approved ?? false;

          // Create delivery line (either new or recreated)
          const deliveryLine = await tx.deliveryLine.create({
            data: {
              delivery_id: deliveryId,
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
        // Set over_delivery_rejected when rejecting - once rejected, delivery is locked
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
            // Set pending_approval when operator sends for approval
            // Reset only when posting (not when approving - keep true for "Approved" status)
            pending_approval: isPosting ? false : data.send_for_approval ? true : undefined,
            // Set rejection flag when rejecting over-delivery (delivery becomes permanently locked)
            over_delivery_rejected: data.notify_rejection ? true : undefined,
            // Only update totals if we processed lines
            ...(shouldProcessLines && {
              total_amount: totalAmount,
              has_variance: hasVariance,
            }),
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

        // If we didn't process lines (e.g., during rejection), fetch existing lines
        // This is needed for notifications that need to check over-delivery items
        let linesToReturn = createdLines;
        if (!shouldProcessLines || createdLines.length === 0) {
          const existingLines = await tx.deliveryLine.findMany({
            where: { delivery_id: deliveryId },
            include: {
              item: {
                select: { id: true, code: true, name: true },
              },
            },
          });
          linesToReturn = existingLines;
        }

        return {
          delivery: updatedDelivery,
          lines: linesToReturn,
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
    if (isPosting && poId) {
      // First check if PO is still OPEN (don't auto-close if already closed)
      const poStatus = await prisma.pO.findUnique({
        where: { id: poId },
        select: { status: true },
      });

      if (poStatus?.status === "OPEN") {
        // Re-query the PO lines to get updated delivered_qty values
        const poLines = await prisma.pOLine.findMany({
          where: { po_id: poId },
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
            where: { id: poId },
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
              where: { id: poId },
              select: { po_no: true, total_amount: true },
            });

            if (poWithDetails) {
              const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000";
              const poUrl = `${baseUrl}/orders/pos/${poId}`;

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

                if (!emailResult.success) {
                  console.error(
                    `[Delivery PATCH] PO auto-close email failed: ${emailResult.error}`
                  );
                }
              } catch (err) {
                console.error("[Delivery PATCH] Failed to send PO auto-close notification:", err);
                // Don't fail the delivery post if email fails
              }
            }
          }
        }
      }
    }

    // Send email notifications (non-blocking - don't fail the request if email fails)
    const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000";

    if (data.notify_approval || data.notify_rejection) {
      // Get creator's email and over-delivery items info
      const creatorWithEmail = await prisma.user.findUnique({
        where: { id: delivery.created_by },
        select: { email: true, full_name: true },
      });

      // Fetch PO lines for over-delivery calculation if we have a PO
      // (poLineMap might be empty if not posting)
      let notificationPoLineMap = poLineMap;
      if (poId && notificationPoLineMap.size === 0) {
        const purchaseOrderForNotification = await prisma.pO.findUnique({
          where: { id: poId },
          include: {
            lines: {
              select: {
                id: true,
                item_id: true,
                quantity: true,
                delivered_qty: true,
              },
            },
          },
        });

        if (purchaseOrderForNotification?.lines) {
          notificationPoLineMap = new Map();
          for (const poLine of purchaseOrderForNotification.lines) {
            const qty = parseFloat(poLine.quantity.toString());
            const deliveredQty = parseFloat(poLine.delivered_qty.toString());
            notificationPoLineMap.set(poLine.id, {
              item_id: poLine.item_id,
              quantity: qty,
              delivered_qty: deliveredQty,
              remaining_qty: Math.max(0, qty - deliveredQty),
            });
          }
        }
      }

      // Get over-delivery items from the updated delivery lines
      const overDeliveryItems = result.lines
        .filter((line) => {
          const lineAny = line as {
            item: { id: string; name: string };
            quantity: number;
            po_line_id?: string | null;
          };
          // Check if this item was an over-delivery by comparing to PO line
          // Use po_line_id from the delivery line itself (from database)
          const poLineIdToCheck = lineAny.po_line_id;

          // Try to find by po_line_id first, then by item_id
          let poLineInfo;
          if (poLineIdToCheck) {
            poLineInfo = notificationPoLineMap.get(poLineIdToCheck);
          }
          if (!poLineInfo) {
            for (const [, info] of notificationPoLineMap.entries()) {
              if (info.item_id === lineAny.item.id) {
                poLineInfo = info;
                break;
              }
            }
          }

          return poLineInfo && lineAny.quantity > poLineInfo.remaining_qty;
        })
        .map((line) => {
          const lineAny = line as {
            item: { id: string; name: string };
            quantity: number;
            po_line_id?: string | null;
          };
          const poLineIdToCheck = lineAny.po_line_id;

          let poLineInfo;
          if (poLineIdToCheck) {
            poLineInfo = notificationPoLineMap.get(poLineIdToCheck);
          }
          if (!poLineInfo) {
            for (const [, info] of notificationPoLineMap.entries()) {
              if (info.item_id === lineAny.item.id) {
                poLineInfo = info;
                break;
              }
            }
          }

          return {
            itemName: lineAny.item.name,
            requestedQty: lineAny.quantity,
            remainingQty: poLineInfo?.remaining_qty ?? 0,
          };
        });

      if (creatorWithEmail?.email && overDeliveryItems.length > 0) {
        if (data.notify_approval) {
          // Send approval notification
          sendOverDeliveryApprovedNotification({
            recipientEmail: creatorWithEmail.email,
            deliveryNumber: result.delivery.delivery_no,
            approverName: user.username,
            locationName: result.delivery.location.name,
            approvedItems: overDeliveryItems,
            deliveryUrl: `${siteUrl}/deliveries/${deliveryId}`,
          }).catch((err) => {
            console.error("[Delivery PATCH] Failed to send approval notification:", err);
          });
        }

        if (data.notify_rejection && data.rejection_reason) {
          // Send rejection notification
          sendOverDeliveryRejectedNotification({
            recipientEmail: creatorWithEmail.email,
            deliveryNumber: result.delivery.delivery_no,
            rejectorName: user.username,
            locationName: result.delivery.location.name,
            rejectionReason: data.rejection_reason,
            rejectedItems: overDeliveryItems,
            deliveryUrl: `${siteUrl}/deliveries/${deliveryId}/edit`,
          }).catch((err) => {
            console.error("[Delivery PATCH] Failed to send rejection notification:", err);
          });
        }
      }
    }

    // Send notification to supervisors when operator sends for approval
    let emailSent = false;
    if (
      data.send_for_approval &&
      user.role === "OPERATOR" &&
      result.lines.some((line) => {
        const lineAny = line as { over_delivery_approved?: boolean };
        return !lineAny.over_delivery_approved;
      })
    ) {
      try {
        // Find all Supervisors and Admins assigned to this location
        const supervisorsAndAdmins = await prisma.user.findMany({
          where: {
            is_active: true,
            role: { in: ["SUPERVISOR", "ADMIN"] },
            OR: [
              {
                user_locations: {
                  some: { location_id: delivery.location_id },
                },
              },
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
          const overDeliveryItemsForEmail = result.lines
            .filter((line) => {
              const lineAny = line as { over_delivery_approved?: boolean };
              return !lineAny.over_delivery_approved;
            })
            .map((line) => {
              const lineAny = line as {
                item: { name: string };
                quantity: number;
              };
              return {
                itemName: lineAny.item.name,
                requestedQty: lineAny.quantity,
                remainingQty: 0, // Not easily available here
                excessQty: 0,
              };
            });

          // Send notification email
          const emailResult = await sendOverDeliveryApprovalNotification({
            recipientEmails,
            deliveryNumber: result.delivery.delivery_no,
            creatorName: user.username,
            locationName: result.delivery.location.name,
            overDeliveryItems: overDeliveryItemsForEmail,
            deliveryUrl: `${siteUrl}/deliveries/${deliveryId}`,
          });

          if (emailResult.success) {
            emailSent = true;
          }
        }
      } catch (emailError) {
        console.error("[Delivery PATCH] Failed to send over-delivery notification:", emailError);
      }
    }

    // Build response message based on status
    let message: string;
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
      if (data.send_for_approval && emailSent) {
        message =
          "Delivery draft updated. Supervisors have been notified for over-delivery approval.";
      } else if (data.send_for_approval) {
        message = "Delivery draft updated. Over-delivery items require supervisor approval.";
      } else {
        message = "Delivery draft updated successfully.";
      }
    }

    return {
      id: result.delivery.id,
      message,
      po_auto_closed: poAutoClosed,
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
