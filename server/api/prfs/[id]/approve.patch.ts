/**
 * PATCH /api/prfs/:id/approve
 *
 * Approve a pending PRF. Changes status from PENDING to APPROVED.
 * Triggers email notification to all PROCUREMENT_SPECIALIST users.
 *
 * Validation Rules:
 * - PRF must be in PENDING status
 * - User must be SUPERVISOR or ADMIN
 *
 * Permissions:
 * - SUPERVISOR, ADMIN
 */

import prisma from "../../../utils/prisma";
import { z } from "zod";
import type { UserRole } from "@prisma/client";
import { sendPRFApprovalNotification } from "../../../utils/email";

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
  id: z.string().uuid("Invalid PRF ID"),
});

// Request body schema
const bodySchema = z.object({
  comments: z.string().optional(),
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

  // Check if user has permission to approve PRFs (SUPERVISOR or ADMIN)
  if (user.role !== "SUPERVISOR" && user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Only Supervisors and Admins can approve PRFs",
      },
    });
  }

  try {
    // Validate path params
    const params = paramsSchema.parse(event.context.params);

    // Validate request body (optional)
    const body = await readBody(event);
    const validatedBody = bodySchema.parse(body || {});

    // Fetch existing PRF with requester and location details
    const existingPRF = await prisma.pRF.findUnique({
      where: { id: params.id },
      include: {
        requester: {
          select: { id: true, username: true, full_name: true },
        },
        location: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!existingPRF) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "PRF_NOT_FOUND",
          message: "PRF not found",
        },
      });
    }

    // Check if PRF is in PENDING status
    if (existingPRF.status !== "PENDING") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "NOT_PENDING",
          message: "Only pending PRFs can be approved",
        },
      });
    }

    // Update PRF status to APPROVED
    const prf = await prisma.pRF.update({
      where: { id: params.id },
      data: {
        status: "APPROVED",
        approved_by: user.id,
        approval_date: new Date(),
      },
      include: {
        requester: {
          select: { id: true, username: true, full_name: true },
        },
        approver: {
          select: { id: true, username: true, full_name: true },
        },
        location: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    // Send email notification to all PROCUREMENT_SPECIALIST users
    let emailSent = false;
    let emailRecipients = 0;

    try {
      // Get all active procurement specialists
      const procurementSpecialists = await prisma.user.findMany({
        where: {
          role: "PROCUREMENT_SPECIALIST",
          is_active: true,
        },
        select: { email: true },
      });

      const recipientEmails = procurementSpecialists.map((u) => u.email);

      if (recipientEmails.length > 0) {
        // Build PRF URL
        const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const prfUrl = `${baseUrl}/orders/prfs/${prf.id}`;

        const emailResult = await sendPRFApprovalNotification({
          recipientEmails,
          prfNumber: prf.prf_no,
          requesterName: prf.requester.full_name || prf.requester.username,
          locationName: prf.location.name,
          totalValue: `SAR ${Number(prf.total_value).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          prfUrl,
        });

        emailSent = emailResult.success;
        emailRecipients = recipientEmails.length;

        if (!emailResult.success) {
          console.error(`[PRF Approve] Email notification failed: ${emailResult.error}`);
        }
      }
    } catch (emailError) {
      console.error("[PRF Approve] Failed to send email notification:", emailError);
      // Don't fail the approval if email fails
    }

    return {
      data: {
        id: prf.id,
        prf_no: prf.prf_no,
        status: prf.status,
        prf_type: prf.prf_type,
        category: prf.category,
        total_value: prf.total_value.toString(),
        request_date: prf.request_date.toISOString().split("T")[0],
        approval_date: prf.approval_date?.toISOString().split("T")[0],
        approved_by: prf.approved_by,
        requester: prf.requester,
        approver: prf.approver,
        location: prf.location,
      },
      message: "PRF approved",
      email_sent: emailSent,
      email_recipients: emailRecipients > 0 ? emailRecipients : undefined,
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

    console.error("Error approving PRF:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to approve PRF",
      },
    });
  }
});
