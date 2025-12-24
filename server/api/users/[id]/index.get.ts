/**
 * Get User by ID API Route
 * GET /api/users/[id]
 *
 * Returns a specific user with their locations (Admin only)
 */

import type { UserRole } from "@prisma/client";
import prisma from "../../../utils/prisma";

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
          message: "You must be logged in to view users",
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
          message: "Only administrators can view user details",
        },
      });
    }

    // Get user ID from route params
    const userId = getRouterParam(event, "id");

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

    // Fetch user with locations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        created_at: true,
        default_location_id: true,
        default_location: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        user_locations: {
          select: {
            location_id: true,
            location: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    // Transform the data to a cleaner format
    const transformedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      default_location: user.default_location,
      locations: user.user_locations.map((ul: any) => ({
        location_id: ul.location_id,
        location: ul.location,
      })),
    };

    return {
      user: transformedUser,
    };
  } catch (error) {
    // Re-throw H3 errors (already formatted)
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Handle unexpected errors
    console.error("Get user error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "FETCH_USER_ERROR",
        message: "An error occurred while fetching user",
      },
    });
  }
});
