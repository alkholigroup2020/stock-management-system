/**
 * POST /api/locations/:id/users
 *
 * Assign a user to a location with a specific access level
 */

import prisma from "../../../../utils/prisma";
import type { UserRole } from "@prisma/client";
import { z } from "zod";

console.log("✓ POST [id]/users/index.post.ts HANDLER LOADED");

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

// Validation schema
const assignUserSchema = z.object({
  user_id: z.string().uuid("Invalid user ID format"),
  access_level: z.enum(["VIEW", "POST", "MANAGE"], {
    errorMap: () => ({ message: "Access level must be VIEW, POST, or MANAGE" }),
  }),
});

export default defineEventHandler(async (event) => {
  console.log("[POST /api/locations/:id/users] Handler called");
  console.log("[POST] URL:", event.node.req.url);

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

  // Only ADMIN and SUPERVISOR can assign users to locations
  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Only administrators and supervisors can assign users to locations",
      },
    });
  }

  try {
    // Get location ID from route params
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

    // Parse and validate request body
    const body = await readBody(event);
    const validationResult = assignUserSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          errors,
        },
      });
    }

    const { user_id, access_level } = validationResult.data;

    // Check if location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true, name: true, code: true },
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

    // Check if user exists and is active
    const targetUser = await prisma.user.findUnique({
      where: { id: user_id },
      select: {
        id: true,
        username: true,
        full_name: true,
        email: true,
        is_active: true,
      },
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

    if (!targetUser.is_active) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "USER_INACTIVE",
          message: "Cannot assign inactive users to locations",
        },
      });
    }

    // Check if user is already assigned to this location
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
          code: "USER_ALREADY_ASSIGNED",
          message: `${targetUser.full_name || targetUser.username} is already assigned to ${location.name}`,
        },
      });
    }

    // Create user location assignment
    const userLocation = await prisma.userLocation.create({
      data: {
        user_id: user_id,
        location_id: locationId,
        access_level: access_level,
        assigned_by: user.id,
        assigned_at: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            full_name: true,
            email: true,
            role: true,
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

    console.log(
      `[SUCCESS] User ${targetUser.username} assigned to location ${location.code} with access level ${access_level}`
    );

    return {
      message: `${targetUser.full_name || targetUser.username} has been assigned to ${location.name} with ${access_level} access`,
      user_location: {
        user_id: userLocation.user.id,
        user: {
          id: userLocation.user.id,
          username: userLocation.user.username,
          full_name: userLocation.user.full_name,
          email: userLocation.user.email,
          role: userLocation.user.role,
        },
        location: {
          id: userLocation.location.id,
          code: userLocation.location.code,
          name: userLocation.location.name,
        },
        access_level: userLocation.access_level,
        assigned_at: userLocation.assigned_at,
      },
    };
  } catch (error) {
    // Re-throw if already a createError
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error assigning user to location:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to assign user to location",
      },
    });
  }
});
