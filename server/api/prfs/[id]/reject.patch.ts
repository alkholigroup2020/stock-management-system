/**
 * PATCH /api/prfs/:id/reject
 *
 * Reject a pending PRF. Changes status from PENDING to REJECTED.
 * Requires a mandatory rejection reason.
 *
 * Validation Rules:
 * - PRF must be in PENDING status
 * - User must be SUPERVISOR or ADMIN
 * - rejection_reason is required and non-empty
 *
 * Permissions:
 * - SUPERVISOR, ADMIN
 */

import prisma from "../../../utils/prisma";
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
  id: z.string().uuid("Invalid PRF ID"),
});

// Request body schema
const bodySchema = z.object({
  rejection_reason: z
    .string()
    .min(1, "Rejection reason is required")
    .max(1000, "Rejection reason must be less than 1000 characters"),
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

  // Check if user has permission to reject PRFs (SUPERVISOR or ADMIN)
  if (user.role !== "SUPERVISOR" && user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Only Supervisors and Admins can reject PRFs",
      },
    });
  }

  try {
    // Validate path params
    const params = paramsSchema.parse(event.context.params);

    // Validate request body
    const body = await readBody(event);
    const validatedBody = bodySchema.parse(body);

    // Fetch existing PRF
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
          message: "Only pending PRFs can be rejected",
        },
      });
    }

    // Update PRF status to REJECTED
    const prf = await prisma.pRF.update({
      where: { id: params.id },
      data: {
        status: "REJECTED",
        approved_by: user.id, // Store who rejected it
        approval_date: new Date(), // Store when it was rejected
        rejection_reason: validatedBody.rejection_reason,
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
        rejection_reason: prf.rejection_reason,
        requester: prf.requester,
        approver: prf.approver,
        location: prf.location,
      },
      message: "PRF rejected",
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const rejectionReasonError = error.issues.find(
        (issue) => issue.path[0] === "rejection_reason"
      );

      if (rejectionReasonError) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "MISSING_REJECTION_REASON",
            message: rejectionReasonError.message,
          },
        });
      }

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

    console.error("Error rejecting PRF:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to reject PRF",
      },
    });
  }
});
