/**
 * Get All Users API Route
 * GET /api/users
 *
 * Returns all users with their locations (Admin only)
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
          message: "You must be logged in to view users",
        },
      });
    }

    const user = session.user as UserSession;

    if (user.role !== "ADMIN") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Only administrators can view all users",
        },
      });
    }

    // Fetch all users with their locations
    const users = await prisma.user.findMany({
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
            access_level: true,
            location: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Transform the data to a cleaner format
    const transformedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      default_location: user.default_location,
      locations: user.user_locations.map((ul) => ({
        location_id: ul.location_id,
        code: ul.location.code,
        name: ul.location.name,
        access_level: ul.access_level,
      })),
    }));

    return {
      users: transformedUsers,
    };
  } catch (error) {
    // Re-throw H3 errors (already formatted)
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Handle unexpected errors
    console.error("Get users error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "FETCH_USERS_ERROR",
        message: "An error occurred while fetching users",
      },
    });
  }
});
