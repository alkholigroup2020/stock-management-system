/**
 * PATCH /api/transfers/:id/reject
 *
 * Reject a transfer
 *
 * This endpoint handles:
 * - Transfer rejection by Supervisor or Admin
 * - Update transfer status to REJECTED
 * - Optional rejection comment
 *
 * Business Rules:
 * - Only Supervisor or Admin can reject transfers
 * - Transfer must be in PENDING_APPROVAL status
 * - No stock movement occurs on rejection
 * - Rejection is final (cannot be undone)
 *
 * Permissions:
 * - User must be Supervisor or Admin
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

// Request body schema
const bodySchema = z.object({
  comment: z.string().optional(),
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
    // Check if user is Supervisor or Admin
    if (user.role !== "SUPERVISOR" && user.role !== "ADMIN") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Only Supervisors and Admins can reject transfers",
        },
      });
    }

    const transferId = getRouterParam(event, "id");

    if (!transferId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_TRANSFER_ID",
          message: "Transfer ID is required",
        },
      });
    }

    // Parse request body
    const body = await readBody(event);
    const data = bodySchema.parse(body);

    // Fetch transfer
    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
    });

    if (!transfer) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "TRANSFER_NOT_FOUND",
          message: "Transfer not found",
        },
      });
    }

    // Check if transfer is in PENDING_APPROVAL status
    if (transfer.status !== "PENDING_APPROVAL") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "INVALID_STATUS",
          message: `Transfer cannot be rejected from status ${transfer.status}. Only transfers in PENDING_APPROVAL status can be rejected.`,
        },
      });
    }

    // Update transfer status to REJECTED
    const updatedTransfer = await prisma.transfer.update({
      where: { id: transferId },
      data: {
        status: "REJECTED",
        approved_by: user.id,
        approval_date: new Date(),
        notes: data.comment
          ? `${transfer.notes ? transfer.notes + "\n\n" : ""}REJECTED: ${data.comment}`
          : transfer.notes,
      },
      include: {
        from_location: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
        to_location: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
        requester: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
        approver: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
        transfer_lines: {
          include: {
            item: {
              select: {
                id: true,
                code: true,
                name: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    return {
      message: "Transfer rejected successfully",
      transfer: {
        id: updatedTransfer.id,
        transfer_no: updatedTransfer.transfer_no,
        request_date: updatedTransfer.request_date,
        approval_date: updatedTransfer.approval_date,
        status: updatedTransfer.status,
        total_value: updatedTransfer.total_value,
        notes: updatedTransfer.notes,
        from_location: updatedTransfer.from_location,
        to_location: updatedTransfer.to_location,
        requester: updatedTransfer.requester,
        approver: updatedTransfer.approver,
        lines: updatedTransfer.transfer_lines.map((line) => ({
          id: line.id,
          item: line.item,
          quantity: line.quantity,
          wac_at_transfer: line.wac_at_transfer,
          line_value: line.line_value,
        })),
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

    console.error("Error rejecting transfer:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to reject transfer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
