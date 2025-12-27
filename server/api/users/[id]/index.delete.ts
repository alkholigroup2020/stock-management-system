/**
 * Delete User API Route
 * DELETE /api/users/[id]
 *
 * Deletes a user (Admin only)
 * Cannot delete self or the last admin
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
          message: "You must be logged in to delete users",
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
          message: "Only administrators can delete users",
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

    // Prevent deleting self
    if (userId === currentUser.id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "CANNOT_DELETE_SELF",
          message: "You cannot delete your own account",
        },
      });
    }

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToDelete) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    // Prevent deleting the last admin
    if (userToDelete.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: {
          role: "ADMIN",
          is_active: true,
        },
      });

      if (adminCount <= 1) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "CANNOT_DELETE_LAST_ADMIN",
            message: "Cannot delete the last active admin user",
          },
        });
      }
    }

    // Delete user (this will cascade delete user_locations)
    await prisma.user.delete({
      where: { id: userId },
    });

    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    // Re-throw H3 errors (already formatted)
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Handle Prisma foreign key constraint errors
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2003"
    ) {
      throw createError({
        statusCode: 409,
        statusMessage: "Conflict",
        data: {
          code: "USER_HAS_REFERENCES",
          message:
            "Cannot delete this user because they have created transactions (deliveries, issues, transfers, etc.). Consider deactivating the user instead.",
        },
      });
    }

    // Handle unexpected errors
    console.error("Delete user error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "DELETE_USER_ERROR",
        message: "An error occurred while deleting user",
      },
    });
  }
});
