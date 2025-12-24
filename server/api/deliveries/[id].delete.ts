/**
 * DELETE /api/deliveries/:id
 *
 * Delete a draft delivery
 *
 * Business Rules:
 * - Only DRAFT deliveries can be deleted
 * - Only the creator can delete their draft (or ADMIN/SUPERVISOR)
 * - Posted deliveries cannot be deleted
 *
 * Permissions:
 * - User must have POST or MANAGE access to the location
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

  // Get delivery ID from route params
  const deliveryId = getRouterParam(event, "id");

  if (!deliveryId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        code: "MISSING_DELIVERY_ID",
        message: "Delivery ID is required",
      },
    });
  }

  try {
    // Fetch the existing delivery
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        location: true,
      },
    });

    if (!delivery) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "DELIVERY_NOT_FOUND",
          message: "Delivery not found",
        },
      });
    }

    // Check if delivery is already posted
    if (delivery.status === "POSTED") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "CANNOT_DELETE_POSTED_DELIVERY",
          message: "Posted deliveries cannot be deleted. Contact your administrator if you need to reverse this delivery.",
        },
      });
    }

    // Check if user is the creator (or ADMIN/SUPERVISOR)
    if (delivery.created_by !== user.id && user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "NOT_DRAFT_OWNER",
          message: "You can only delete drafts you created",
        },
      });
    }

    // Check user has access to location (Operators need explicit assignment)
    if (user.role === "OPERATOR") {
      const userLocation = await prisma.userLocation.findUnique({
        where: {
          user_id_location_id: {
            user_id: user.id,
            location_id: delivery.location_id,
          },
        },
      });

      if (!userLocation) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            code: "LOCATION_ACCESS_DENIED",
            message: "You do not have access to this location",
          },
        });
      }
    }
    // Admins and Supervisors have implicit access to all locations

    // Delete the delivery (cascades to delivery_lines)
    await prisma.delivery.delete({
      where: { id: deliveryId },
    });

    return {
      message: "Delivery draft deleted successfully",
      id: deliveryId,
      delivery_no: delivery.delivery_no,
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error deleting delivery:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete delivery",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
