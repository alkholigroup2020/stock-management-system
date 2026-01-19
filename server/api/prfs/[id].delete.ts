/**
 * DELETE /api/prfs/:id
 *
 * Delete a draft PRF. Only the requester can delete.
 *
 * Permissions:
 * - Only the original requester can delete
 * - PRF must be in DRAFT status
 */

import prisma from "../../utils/prisma";
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

    // Fetch existing PRF
    const existingPRF = await prisma.pRF.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        prf_no: true,
        requested_by: true,
        status: true,
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
          message: "Only the original requester can delete this PRF",
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
          message: "Only draft PRFs can be deleted",
        },
      });
    }

    // Delete PRF (cascade will delete lines)
    await prisma.pRF.delete({
      where: { id: params.id },
    });

    return {
      message: "PRF deleted successfully",
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

    console.error("Error deleting PRF:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete PRF",
      },
    });
  }
});
