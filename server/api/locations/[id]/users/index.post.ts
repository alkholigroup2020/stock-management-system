/**
 * Add User to Location API Route
 * POST /api/locations/[id]/users
 *
 * Assigns a user to a location (Admin only)
 * Only applies to OPERATOR role users
 */

import type { UserRole } from "@prisma/client";
import { z } from "zod";
import prisma from "../../../../utils/prisma";

// User session type
interface UserSession {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

// Request body schema
const addUserSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
});

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
          message: "You must be logged in to assign users to locations",
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
          message: "Only administrators can assign users to locations",
        },
      });
    }

    // Get location ID from route params
    const locationId = getRouterParam(event, "id");

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

    // Parse and validate request body
    const body = await readBody(event);
    const validationResult = addUserSchema.safeParse(body);

    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: validationResult.error.flatten().fieldErrors,
        },
      });
    }

    const { user_id } = validationResult.data;

    // Verify location exists and is active
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true, code: true, name: true, is_active: true },
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

    if (!location.is_active) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "LOCATION_INACTIVE",
          message: "Cannot assign users to an inactive location",
        },
      });
    }

    // Verify user exists and is an operator
    const targetUser = await prisma.user.findUnique({
      where: { id: user_id },
      select: { id: true, full_name: true, role: true, is_active: true },
    });

    if (!targetUser) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    if (targetUser.role !== "OPERATOR") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "INVALID_USER_ROLE",
          message:
            "Location assignments are only applicable to Operators. Supervisors and Admins have automatic access to all locations.",
        },
      });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.userLocation.findUnique({
      where: {
        user_id_location_id: {
          user_id: user_id,
          location_id: locationId,
        },
      },
    });

    if (existingAssignment) {
      throw createError({
        statusCode: 409,
        statusMessage: "Conflict",
        data: {
          code: "ASSIGNMENT_EXISTS",
          message: "User is already assigned to this location",
        },
      });
    }

    // Create the assignment
    await prisma.userLocation.create({
      data: {
        user_id: user_id,
        location_id: locationId,
        assigned_by: currentUser.id,
      },
    });

    return {
      message: `${targetUser.full_name} has been assigned to ${location.name}`,
      assignment: {
        user_id: user_id,
        location_id: locationId,
        assigned_by: currentUser.id,
      },
    };
  } catch (error) {
    // Re-throw H3 errors (already formatted)
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Handle unexpected errors
    console.error("Add user to location error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "ASSIGN_USER_ERROR",
        message: "An error occurred while assigning user to location",
      },
    });
  }
});
