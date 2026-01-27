/**
 * PATCH /api/pos/:id/close
 *
 * Close a PO, preventing further edits and deliveries.
 * Also closes the linked PRF if one exists.
 *
 * Request Body:
 * - closure_reason: Required if PO has unfulfilled quantities (mandatory for shortage/no deliveries)
 * - notes?: Additional notes about the closure
 *
 * Permissions:
 * - ADMIN and SUPERVISOR can close POs
 * - PROCUREMENT_SPECIALIST cannot close POs
 *
 * Business Rules:
 * - If any PO line has remaining_qty > 0, closure_reason is required
 * - The closure reason is stored in notes with timestamp and username
 * - Email notification includes fulfillment status for each line item
 */

import prisma from "../../../utils/prisma";
import { z } from "zod";
import type { UserRole } from "@prisma/client";
import { sendPOClosedNotification } from "../../../utils/email";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

// Path params schema
const paramsSchema = z.object({
  id: z.string().uuid("Invalid PO ID"),
});

// Request body schema
const bodySchema = z
  .object({
    closure_reason: z.string().max(1000).optional(),
    notes: z.string().max(1000).optional(),
  })
  .optional();

// Line fulfillment info for response and email
interface LineFulfillment {
  item_description: string;
  unit: string;
  ordered_qty: string;
  delivered_qty: string;
  remaining_qty: string;
  is_fulfilled: boolean;
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

  // Check role permissions - ADMIN and SUPERVISOR can close POs
  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "PERMISSION_DENIED",
        message: "Only admins and supervisors can close POs",
      },
    });
  }

  try {
    // Validate path params
    const params = paramsSchema.parse(event.context.params);

    // Parse optional request body
    const body = await readBody(event);
    const data = bodySchema.parse(body);

    // Fetch existing PO with PRF
    const existingPO = await prisma.pO.findUnique({
      where: { id: params.id },
      include: {
        prf: {
          select: {
            id: true,
            prf_no: true,
            status: true,
            requester: {
              select: { id: true, username: true, full_name: true, email: true },
            },
          },
        },
        supplier: {
          select: { id: true, code: true, name: true, emails: true, phone: true, vat_reg_no: true },
        },
        lines: {
          include: {
            item: {
              select: { id: true, code: true, name: true },
            },
          },
        },
        ship_to_location: {
          select: { id: true, code: true, name: true },
        },
        creator: {
          select: { id: true, username: true, full_name: true },
        },
      },
    });

    if (!existingPO) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "PO_NOT_FOUND",
          message: "PO not found",
        },
      });
    }

    // Check PO is still open
    if (existingPO.status === "CLOSED") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "PO_ALREADY_CLOSED",
          message: "This PO is already closed",
        },
      });
    }

    // Calculate fulfillment status for each line
    const lineFulfillment: LineFulfillment[] = existingPO.lines.map((line) => {
      const orderedQty = Number(line.quantity);
      const deliveredQty = Number(line.delivered_qty || 0);
      const remainingQty = Math.max(0, orderedQty - deliveredQty);

      return {
        item_description: line.item_description,
        unit: line.unit,
        ordered_qty: orderedQty.toString(),
        delivered_qty: deliveredQty.toString(),
        remaining_qty: remainingQty.toString(),
        is_fulfilled: remainingQty === 0,
      };
    });

    // Check if PO is fully fulfilled
    const hasUnfulfilledItems = lineFulfillment.some((line) => !line.is_fulfilled);
    const totalOrdered = lineFulfillment.reduce((sum, l) => sum + Number(l.ordered_qty), 0);
    const totalDelivered = lineFulfillment.reduce((sum, l) => sum + Number(l.delivered_qty), 0);
    const fulfillmentPercent =
      totalOrdered > 0 ? Math.round((totalDelivered / totalOrdered) * 100) : 0;

    // Require closure_reason if there are unfulfilled items
    if (hasUnfulfilledItems && !data?.closure_reason?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "CLOSURE_REASON_REQUIRED",
          message:
            "A closure reason is required when closing a PO with unfulfilled quantities. Please provide a reason for early closure.",
          unfulfilled_items: lineFulfillment.filter((l) => !l.is_fulfilled),
          fulfillment_percent: fulfillmentPercent,
        },
      });
    }

    // Update PO and linked PRF in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Prepare updated notes with closure reason and timestamp
      const timestamp = new Date().toISOString();
      const closedByInfo = `Closed by ${user.username} on ${new Date(timestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} at ${new Date(timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;

      let closureNote = "";

      // Add closure reason if provided (required for unfulfilled POs)
      if (data?.closure_reason?.trim()) {
        closureNote = `[EARLY CLOSURE - ${fulfillmentPercent}% fulfilled]\n${closedByInfo}\nReason: ${data.closure_reason.trim()}`;
      } else {
        closureNote = `[CLOSED - 100% fulfilled]\n${closedByInfo}`;
      }

      // Add additional notes if provided
      if (data?.notes?.trim()) {
        closureNote += `\nAdditional notes: ${data.notes.trim()}`;
      }

      const updatedNotes = existingPO.notes ? `${existingPO.notes}\n\n${closureNote}` : closureNote;

      // Close the PO
      const updatedPO = await tx.pO.update({
        where: { id: params.id },
        data: {
          status: "CLOSED",
          notes: updatedNotes,
        },
        include: {
          supplier: {
            select: {
              id: true,
              code: true,
              name: true,
              emails: true,
              phone: true,
              vat_reg_no: true,
              address: true,
            },
          },
          prf: {
            select: {
              id: true,
              prf_no: true,
              status: true,
              location: {
                select: { id: true, code: true, name: true },
              },
              requester: {
                select: { id: true, username: true, full_name: true, email: true },
              },
            },
          },
          lines: {
            include: {
              item: {
                select: { id: true, code: true, name: true },
              },
            },
          },
          ship_to_location: {
            select: { id: true, code: true, name: true },
          },
          creator: {
            select: { id: true, username: true, full_name: true },
          },
          deliveries: {
            select: {
              id: true,
              delivery_no: true,
              status: true,
              delivery_date: true,
              total_amount: true,
            },
          },
        },
      });

      // Close the linked PRF if it exists and is in APPROVED status
      let prfClosed = false;
      if (existingPO.prf && existingPO.prf.status === "APPROVED") {
        await tx.pRF.update({
          where: { id: existingPO.prf.id },
          data: { status: "CLOSED" },
        });
        prfClosed = true;
      }

      return { po: updatedPO, prfClosed };
    });

    // Send email notification to the original PRF requester
    let emailSent = false;

    try {
      if (result.po.prf && result.po.prf.requester?.email) {
        // Build PO URL
        const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const poUrl = `${baseUrl}/orders/pos/${result.po.id}`;

        const emailResult = await sendPOClosedNotification({
          recipientEmail: result.po.prf.requester.email,
          poNumber: result.po.po_no,
          prfNumber: result.po.prf.prf_no,
          closedByName: user.username,
          supplierName: result.po.supplier.name,
          totalAmount: `SAR ${Number(result.po.total_amount).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          poUrl,
          // Include fulfillment details
          fulfillmentPercent,
          closureReason: data?.closure_reason?.trim() || undefined,
          lineItems: lineFulfillment,
        });

        emailSent = emailResult.success;

        if (!emailResult.success) {
          console.error(`[PO Close] Email notification failed: ${emailResult.error}`);
        }
      }
    } catch (emailError) {
      console.error("[PO Close] Failed to send email notification:", emailError);
      // Don't fail the PO closure if email fails
    }

    return {
      data: {
        id: result.po.id,
        po_no: result.po.po_no,
        prf_id: result.po.prf_id,
        supplier_id: result.po.supplier_id,
        quotation_ref: result.po.quotation_ref,
        ship_to_location_id: result.po.ship_to_location_id,
        ship_to_contact: result.po.ship_to_contact,
        ship_to_phone: result.po.ship_to_phone,
        status: result.po.status,
        total_before_discount: result.po.total_before_discount.toString(),
        total_discount: result.po.total_discount.toString(),
        total_after_discount: result.po.total_after_discount.toString(),
        total_vat: result.po.total_vat.toString(),
        total_amount: result.po.total_amount.toString(),
        payment_terms: result.po.payment_terms,
        delivery_terms: result.po.delivery_terms,
        duration_days: result.po.duration_days,
        terms_conditions: result.po.terms_conditions,
        notes: result.po.notes,
        created_by: result.po.created_by,
        created_at: result.po.created_at.toISOString(),
        updated_at: result.po.updated_at.toISOString(),
        lines: result.po.lines.map((line) => ({
          id: line.id,
          po_id: line.po_id,
          item_id: line.item_id,
          item_code: line.item_code,
          item_description: line.item_description,
          quantity: line.quantity.toString(),
          unit: line.unit,
          unit_price: line.unit_price.toString(),
          discount_percent: line.discount_percent.toString(),
          total_before_vat: line.total_before_vat.toString(),
          vat_percent: line.vat_percent.toString(),
          vat_amount: line.vat_amount.toString(),
          total_after_vat: line.total_after_vat.toString(),
          notes: line.notes,
          item: line.item,
        })),
        supplier: result.po.supplier,
        prf: result.po.prf,
        ship_to_location: result.po.ship_to_location,
        creator: result.po.creator,
        deliveries: result.po.deliveries.map((delivery) => ({
          id: delivery.id,
          delivery_no: delivery.delivery_no,
          status: delivery.status,
          delivery_date: delivery.delivery_date.toISOString(),
          total_amount: delivery.total_amount.toString(),
        })),
      },
      message: hasUnfulfilledItems
        ? `PO closed with ${fulfillmentPercent}% fulfillment`
        : "PO closed successfully (fully delivered)",
      prf_closed: result.prfClosed,
      email_sent: emailSent,
      fulfillment_summary: {
        total_ordered: totalOrdered,
        total_delivered: totalDelivered,
        fulfillment_percent: fulfillmentPercent,
        has_unfulfilled_items: hasUnfulfilledItems,
        line_items: lineFulfillment,
      },
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

    console.error("Error closing PO:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to close PO",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
