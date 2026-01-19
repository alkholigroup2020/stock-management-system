/**
 * PATCH /api/prfs/:id/submit
 *
 * Submit PRF for approval. Changes status from DRAFT to PENDING.
 *
 * Validation Rules:
 * - PRF must be in DRAFT status
 * - PRF must have at least 1 line item
 * - User must be the requester
 *
 * Permissions:
 * - Only the original requester can submit
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

  try {
    // Validate path params
    const params = paramsSchema.parse(event.context.params);

    // Fetch existing PRF with lines count
    const existingPRF = await prisma.pRF.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { lines: true },
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

    // Check if user is the requester
    if (existingPRF.requested_by !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "NOT_REQUESTER",
          message: "Only the original requester can submit this PRF",
        },
      });
    }

    // Check if PRF is in DRAFT status
    if (existingPRF.status !== "DRAFT") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "NOT_DRAFT",
          message: "Only draft PRFs can be submitted for approval",
        },
      });
    }

    // Check if PRF has at least 1 line item
    if (existingPRF._count.lines === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "NO_LINE_ITEMS",
          message: "PRF must have at least one line item before submitting",
        },
      });
    }

    // Update PRF status to PENDING
    const prf = await prisma.pRF.update({
      where: { id: params.id },
      data: {
        status: "PENDING",
      },
      include: {
        requester: {
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
        requester: prf.requester,
        location: prf.location,
      },
      message: "PRF submitted for approval",
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid PRF ID",
          details: error.issues,
        },
      });
    }

    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error submitting PRF:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to submit PRF",
      },
    });
  }
});
