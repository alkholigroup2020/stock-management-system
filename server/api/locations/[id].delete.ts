/**
 * DELETE /api/locations/:id
 * Delete or deactivate a location based on transaction history
 * Admin only
 *
 * Logic:
 * - If location has transactions → SOFT DELETE (set is_active = false)
 * - If location is empty → HARD DELETE (permanent removal)
 */

import prisma from "../../utils/prisma";
import type { UserRole } from "@prisma/client";

interface AuthUser {
  id: string;
  role: UserRole;
}

export default defineEventHandler(async (event) => {
  const user = event.context.user as AuthUser | undefined;

  // Authentication check
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

  // Authorization check - Admin only
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Only administrators can delete locations",
      },
    });
  }

  try {
    const locationId = getRouterParam(event, "id");

    if (!locationId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_PARAMETER",
          message: "Location ID is required",
        },
      });
    }

    // Fetch location with transaction counts
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: {
        _count: {
          select: {
            deliveries: true,
            issues: true,
            transfers_from: true,
            transfers_to: true,
            prfs: true,
            ncrs: true,
            default_for_users: true,
          },
        },
      },
    });

    if (!location) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "LOCATION_NOT_FOUND",
          message: "Location not found",
        },
      });
    }

    // Determine if location has any transaction history
    const hasTransactions =
      location._count.deliveries > 0 ||
      location._count.issues > 0 ||
      location._count.transfers_from > 0 ||
      location._count.transfers_to > 0 ||
      location._count.prfs > 0 ||
      location._count.ncrs > 0;

    if (hasTransactions) {
      // SOFT DELETE: Location has transaction history
      // Set is_active = false to preserve audit trail
      const updatedLocation = await prisma.location.update({
        where: { id: locationId },
        data: { is_active: false },
      });

      return {
        success: true,
        deleted: false,
        deactivated: true,
        message:
          "Location deactivated successfully (has transaction history and cannot be permanently deleted)",
        location: {
          id: updatedLocation.id,
          name: updatedLocation.name,
          is_active: updatedLocation.is_active,
        },
      };
    }

    // HARD DELETE: Location is empty, can be permanently removed
    // First: Handle users who have this as their default_location
    if (location._count.default_for_users > 0) {
      await prisma.user.updateMany({
        where: { default_location_id: locationId },
        data: { default_location_id: null },
      });
    }

    // Second: Delete location
    // Cascades will auto-delete: user_locations, period_locations, location_stock, pobs, reconciliations
    await prisma.location.delete({
      where: { id: locationId },
    });

    return {
      success: true,
      deleted: true,
      deactivated: false,
      message: "Location deleted successfully",
      reassignedUsers: location._count.default_for_users,
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Handle Prisma errors
    if (error && typeof error === "object" && "code" in error) {
      console.error("Prisma error deleting location:", error);
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "DELETE_FAILED",
          message: "Cannot delete location due to existing references or constraints",
        },
      });
    }

    // Generic error
    console.error("Error deleting location:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete location",
      },
    });
  }
});
