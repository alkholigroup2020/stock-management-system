/**
 * PATCH /api/approvals/:id/reject
 *
 * Reject an approval request
 *
 * For PERIOD_CLOSE approvals:
 * - Reverts period status back to OPEN
 * - Allows locations to remain READY for another close attempt
 *
 * Body:
 * - comments: Optional rejection reason
 *
 * Permissions:
 * - ADMIN only
 */

import prisma from "~~/server/utils/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

// Type alias for PeriodLocation with included location
type PeriodLocationWithLocation = Prisma.PeriodLocationGetPayload<{
  include: { location: { select: { id: true; code: true; name: true; type: true } } };
}>;

const rejectSchema = z.object({
  comments: z.string().max(1000).optional(),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user;

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

  // Check if user is ADMIN
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Only admins can reject requests",
      },
    });
  }

  try {
    const approvalId = getRouterParam(event, "id");

    if (!approvalId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_PARAMETERS",
          message: "Approval ID is required",
        },
      });
    }

    // Parse body for comments
    const body = await readBody(event);
    const data = rejectSchema.parse(body || {});

    // Fetch the approval
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
    });

    if (!approval) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "APPROVAL_NOT_FOUND",
          message: "Approval not found",
        },
      });
    }

    // Check approval is still pending
    if (approval.status !== "PENDING") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "APPROVAL_ALREADY_PROCESSED",
          message: `Approval has already been ${approval.status.toLowerCase()}`,
          currentStatus: approval.status,
        },
      });
    }

    const now = new Date();

    // Handle different entity types
    switch (approval.entity_type) {
      case "PERIOD_CLOSE":
        return await handlePeriodCloseRejection(
          approval.id,
          approval.entity_id,
          user.id,
          data.comments || null,
          now
        );

      case "TRANSFER":
        // TODO: Implement transfer rejection
        throw createError({
          statusCode: 501,
          statusMessage: "Not Implemented",
          data: {
            code: "NOT_IMPLEMENTED",
            message: "Transfer rejection not yet implemented",
          },
        });

      case "PRF":
      case "PO":
        // TODO: Implement PRF/PO rejection
        throw createError({
          statusCode: 501,
          statusMessage: "Not Implemented",
          data: {
            code: "NOT_IMPLEMENTED",
            message: `${approval.entity_type} rejection not yet implemented`,
          },
        });

      default:
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "UNKNOWN_ENTITY_TYPE",
            message: `Unknown entity type: ${approval.entity_type}`,
          },
        });
    }
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

    console.error("Error rejecting request:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to reject request",
      },
    });
  }
});

/**
 * Handle Period Close rejection - reverts period status back to OPEN
 */
async function handlePeriodCloseRejection(
  approvalId: string,
  periodId: string,
  reviewerId: string,
  comments: string | null,
  now: Date
) {
  // Execute rejection in a transaction
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Update approval to REJECTED
    const updatedApproval = await tx.approval.update({
      where: { id: approvalId },
      data: {
        status: "REJECTED",
        reviewed_by: reviewerId,
        reviewed_at: now,
        comments,
      },
    });

    // Revert period status back to OPEN
    const updatedPeriod = await tx.period.update({
      where: { id: periodId },
      data: {
        status: "OPEN",
        approval_id: null, // Clear the approval reference
      },
      include: {
        period_locations: {
          include: {
            location: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: {
            location: {
              name: "asc",
            },
          },
        },
      },
    });

    return { approval: updatedApproval, period: updatedPeriod };
  });

  return {
    approval: {
      id: result.approval.id,
      status: result.approval.status,
      reviewedAt: result.approval.reviewed_at,
      comments: result.approval.comments,
    },
    period: {
      id: result.period.id,
      name: result.period.name,
      status: result.period.status,
      locations: result.period.period_locations.map((pl: PeriodLocationWithLocation) => ({
        locationId: pl.location_id,
        locationCode: pl.location.code,
        locationName: pl.location.name,
        status: pl.status,
      })),
    },
    message: "Period close request rejected - period reverted to OPEN status",
  };
}
