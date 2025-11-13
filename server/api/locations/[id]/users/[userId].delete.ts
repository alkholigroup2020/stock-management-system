/**
 * DELETE /api/locations/:id/users/:userId
 *
 * Remove a user's assignment from a location
 *
 * Admin only
 */

import { PrismaClient } from "@prisma/client";
import type { UserRole } from "@prisma/client";

const prisma = new PrismaClient();

// User session type
interface UserSession {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

export default defineEventHandler(async (event) => {
  try {
    // Get authenticated user from session
    const session = await getUserSession(event);
    const authUser = session?.user as UserSession | undefined;

    if (!authUser?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        data: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to perform this action",
        },
      });
    }

    // Only admins can remove user assignments
    if (authUser.role !== "ADMIN") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Only administrators can remove user location assignments",
        },
      });
    }

    // Get location ID and user ID from route params
    const locationId = event.context.params?.id;
    const userId = event.context.params?.userId;

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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === "ADMIN") {
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
        user_name: existingAssignment.user.full_name || existingAssignment.user.username,
        location_name: existingAssignment.location.name,
      },
    };
  } catch (error) {
    // Re-throw H3 errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Log unexpected errors
    console.error("Error removing user from location:", error);

    // Generic error response
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while removing user from location",
      },
    });
  }
});
