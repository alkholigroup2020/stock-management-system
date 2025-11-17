/**
 * GET /api/transfers/:id
 *
 * Fetch a single transfer by ID with full details
 *
 * Includes:
 * - Transfer header information
 * - All transfer lines with item details
 * - Source and destination location information
 * - Requester and approver information
 *
 * Permissions:
 * - User must have access to at least one of the transfer's locations
 * - Supervisors and Admins can access all transfers
 */

import prisma from "../../utils/prisma";
import type { UserRole } from "@prisma/client";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
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

  try {
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

    // Fetch transfer with all related data
    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
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
            role: true,
          },
        },
        approver: {
          select: {
            id: true,
            username: true,
            full_name: true,
            role: true,
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
                category: true,
                sub_category: true,
              },
            },
          },
          orderBy: {
            item: {
              name: "asc",
            },
          },
        },
      },
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

    // Check if user has access to at least one of the transfer's locations
    // Admin and Supervisor have access to all transfers
    if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
      const userLocations = await prisma.userLocation.findMany({
        where: {
          user_id: user.id,
          location_id: {
            in: [transfer.from_location_id, transfer.to_location_id],
          },
        },
      });

      if (userLocations.length === 0) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            code: "LOCATION_ACCESS_DENIED",
            message: "You do not have access to this transfer's locations",
          },
        });
      }
    }

    // Format the response
    return {
      transfer: {
        id: transfer.id,
        transfer_no: transfer.transfer_no,
        request_date: transfer.request_date,
        approval_date: transfer.approval_date,
        transfer_date: transfer.transfer_date,
        status: transfer.status,
        total_value: transfer.total_value,
        notes: transfer.notes,
        created_at: transfer.created_at,
        updated_at: transfer.updated_at,
        from_location: transfer.from_location,
        to_location: transfer.to_location,
        requester: transfer.requester,
        approver: transfer.approver,
        lines: transfer.transfer_lines.map((line) => ({
          id: line.id,
          item: line.item,
          quantity: line.quantity,
          wac_at_transfer: line.wac_at_transfer,
          line_value: line.line_value,
        })),
        summary: {
          total_lines: transfer.transfer_lines.length,
          total_items: transfer.transfer_lines.reduce(
            (sum, line) => sum + parseFloat(line.quantity.toString()),
            0
          ),
          total_value: transfer.total_value,
        },
      },
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching transfer:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch transfer",
      },
    });
  }
});
