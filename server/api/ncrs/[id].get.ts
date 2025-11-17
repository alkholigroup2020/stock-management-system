/**
 * GET /api/ncrs/:id
 *
 * Fetch a single NCR (Non-Conformance Report) by ID
 *
 * This endpoint returns:
 * - NCR header information
 * - Related delivery and delivery line details (if applicable)
 * - Location information
 * - Creator information
 * - Resolution notes and status
 *
 * Permissions:
 * - User must have access to the NCR's location
 * - Supervisors and Admins can view all NCRs
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
    // Get NCR ID from route params
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_ID",
          message: "NCR ID is required",
        },
      });
    }

    // Fetch NCR with related data
    const ncr = await prisma.nCR.findUnique({
      where: { id },
      include: {
        location: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
        delivery: {
          select: {
            id: true,
            delivery_no: true,
            delivery_date: true,
            supplier: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        delivery_line: {
          select: {
            id: true,
            item: {
              select: {
                id: true,
                code: true,
                name: true,
                unit: true,
                category: true,
              },
            },
            quantity: true,
            unit_price: true,
            period_price: true,
            line_value: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            full_name: true,
            role: true,
          },
        },
      },
    });

    if (!ncr) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "NCR_NOT_FOUND",
          message: "NCR not found",
        },
      });
    }

    // Check if user has access to the NCR's location
    if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
      const userLocation = await prisma.userLocation.findUnique({
        where: {
          user_id_location_id: {
            user_id: user.id,
            location_id: ncr.location_id,
          },
        },
      });

      if (!userLocation) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            code: "LOCATION_ACCESS_DENIED",
            message: "You do not have access to this NCR",
          },
        });
      }
    }

    // Return NCR with all related information
    return {
      ncr: {
        id: ncr.id,
        ncr_no: ncr.ncr_no,
        location: ncr.location,
        type: ncr.type,
        auto_generated: ncr.auto_generated,
        delivery: ncr.delivery,
        delivery_line: ncr.delivery_line
          ? {
              id: ncr.delivery_line.id,
              item: ncr.delivery_line.item,
              quantity: ncr.delivery_line.quantity,
              unit_price: ncr.delivery_line.unit_price,
              period_price: ncr.delivery_line.period_price,
              line_value: ncr.delivery_line.line_value,
            }
          : null,
        reason: ncr.reason,
        quantity: ncr.quantity,
        value: ncr.value,
        status: ncr.status,
        creator: ncr.creator,
        created_at: ncr.created_at,
        resolved_at: ncr.resolved_at,
        resolution_notes: ncr.resolution_notes,
      },
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching NCR:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch NCR",
      },
    });
  }
});
