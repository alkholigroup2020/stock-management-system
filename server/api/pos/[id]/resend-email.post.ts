/**
 * POST /api/pos/:id/resend-email
 *
 * Resend PO email to supplier
 *
 * Request Body:
 * - additional_emails?: Optional array of additional email addresses
 *
 * Permissions:
 * - PROCUREMENT_SPECIALIST, ADMIN can resend emails
 */

import prisma from "../../../utils/prisma";
import { sendPOToSupplier } from "../../../utils/email";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

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
const bodySchema = z.object({
  additional_emails: z
    .array(z.string().email("Invalid email address"))
    .max(10, "Maximum 10 additional emails allowed")
    .optional(),
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

  // Check role permissions
  if (user.role !== "PROCUREMENT_SPECIALIST" && user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "PERMISSION_DENIED",
        message: "Only procurement specialists and admins can resend PO emails",
      },
    });
  }

  try {
    // Validate path params
    const params = paramsSchema.parse(event.context.params);

    // Parse and validate request body
    const body = await readBody(event);
    const data = bodySchema.parse(body || {});

    // Fetch PO with supplier
    const po = await prisma.pO.findUnique({
      where: { id: params.id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            emails: true,
          },
        },
      },
    });

    if (!po) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "PO_NOT_FOUND",
          message: "PO not found",
        },
      });
    }

    // Check if PO is open
    if (po.status !== "OPEN") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "PO_NOT_OPEN",
          message: "Can only resend emails for open POs",
        },
      });
    }

    // Combine supplier emails with additional emails
    const supplierEmails = po.supplier?.emails || [];
    const additionalEmails = data.additional_emails || [];
    const allEmails = [...new Set([...supplierEmails, ...additionalEmails])];

    if (allEmails.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "NO_RECIPIENTS",
          message:
            "No email addresses to send to. Add supplier emails or provide additional emails.",
        },
      });
    }

    // Build PO URL
    const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const poUrl = `${siteUrl}/orders/pos/${po.id}`;

    // Send email
    const emailResult = await sendPOToSupplier({
      supplierEmails: allEmails,
      poNumber: po.po_no,
      supplierName: po.supplier?.name || "Supplier",
      totalAmount: `SAR ${parseFloat(po.total_amount.toString()).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      deliveryTerms: po.delivery_terms,
      paymentTerms: po.payment_terms,
      poUrl,
    });

    if (!emailResult.success) {
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
        data: {
          code: "EMAIL_FAILED",
          message: emailResult.error || "Failed to send email",
        },
      });
    }

    return {
      message: `PO email sent successfully to ${allEmails.length} recipient(s)`,
      recipients: allEmails,
      message_id: emailResult.messageId,
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

    console.error("Error resending PO email:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to resend PO email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
