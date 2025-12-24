/**
 * Remove User from Location API Route
 * DELETE /api/locations/[id]/users/[userId]
 *
 * Removes a user's access to a location (Admin only)
 */

import type { UserRole } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

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
    // Check if user is authenticated and is admin
    const session = await getUserSession(event);

    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        data: {
          code: "NOT_AUTHENTICATED",
          message: "You must be logged in to remove user location access",
        },
      });
    }

    const currentUser = session.user as UserSession;

    if (currentUser.role !== "ADMIN") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Only administrators can remove user location access",
        },
      });
    }

    // Get location ID and user ID from route params
    const locationId = getRouterParam(event, "id");
    const userId = getRouterParam(event, "userId");

    if (!locationId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_LOCATION_ID",
          message: "Location ID is required",
        },
      });
    }

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_USER_ID",
          message: "User ID is required",
        },
      });
    }

    // Check if the assignment exists
    const existingAssignment = await prisma.userLocation.findUnique({
      where: {
        user_id_location_id: {
          user_id: userId,
          location_id: locationId,
        },
      },
      include: {
        user: {
          select: { full_name: true },
        },
        location: {
          select: { name: true },
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
      message: `${existingAssignment.user.full_name}'s access to ${existingAssignment.location.name} has been removed`,
    };
  } catch (error) {
    // Re-throw H3 errors (already formatted)
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Handle unexpected errors
    console.error("Remove user from location error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "REMOVE_USER_ERROR",
        message: "An error occurred while removing user location access",
      },
    });
  }
});
