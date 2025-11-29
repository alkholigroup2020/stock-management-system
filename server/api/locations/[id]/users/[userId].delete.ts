/**
 * DELETE /api/locations/:id/users/:userId
 *
 * Remove a user's assignment from a location
 *
 * Admin only
 */

import prisma from "../../../../utils/prisma";
import type { UserRole } from "@prisma/client";

console.log("✓ DELETE [id]/users/[userId].delete.ts HANDLER LOADED");

// User session type
interface UserLocation {
  location_id: string;
  access_level: string;
}

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
  locations?: UserLocation[];
}

export default defineEventHandler(async (event) => {
  console.log("[DELETE /api/locations/:id/users/:userId] Handler called");
  console.log("[DELETE] URL:", event.node.req.url);

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

  // Only admins can remove user assignments
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Only administrators can remove user location assignments",
      },
    });
  }

  try {
    // Get location ID and user ID from route params
    const locationId = getRouterParam(event, "id");
    const userId = getRouterParam(event, "userId");

    if (!locationId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "INVALID_LOCATION_ID",
          message: "Location ID is required",
        },
      });
    }

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "INVALID_USER_ID",
          message: "User ID is required",
        },
      });
    }

    // Check if assignment exists
    const existingAssignment = await prisma.userLocation.findUnique({
      where: {
        user_id_location_id: {
          user_id: userId,
          location_id: locationId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
        location: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!existingAssignment) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "ASSIGNMENT_NOT_FOUND",
          message: "User is not assigned to this location",
        },
      });
    }

    // Prevent removing the last admin's access to prevent lockout
    // Check if user is an admin
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (targetUser?.role === "ADMIN") {
      // Count how many locations this admin has access to
      const adminLocationCount = await prisma.userLocation.count({
        where: { user_id: userId },
      });

      // If this is their last location, prevent removal
      if (adminLocationCount === 1) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "CANNOT_REMOVE_LAST_ADMIN_LOCATION",
            message:
              "Cannot remove the last location from an admin user. Admins must have at least one location assigned.",
          },
        });
      }
    }

    // Delete the assignment
    await prisma.userLocation.delete({
      where: {
        user_id_location_id: {
          user_id: userId,
          location_id: locationId,
        },
      },
    });

    return {
      success: true,
      message: `Successfully removed ${existingAssignment.user.full_name || existingAssignment.user.username} from ${existingAssignment.location.name}`,
      removed_assignment: {
        user_id: userId,
        location_id: locationId,
        user_name:
          existingAssignment.user.full_name || existingAssignment.user.username,
        location_name: existingAssignment.location.name,
      },
    };
  } catch (error) {
    // Re-throw if already a createError
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error removing user from location:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to remove user from location",
      },
    });
  }
});
