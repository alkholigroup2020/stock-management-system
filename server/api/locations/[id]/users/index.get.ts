/**
 * GET /api/locations/:id/users
 *
 * Fetch all users assigned to a location
 */

import prisma from "../../../../utils/prisma";
import type { UserRole } from "@prisma/client";

console.log("✓ GET [id]/users/index.get.ts HANDLER LOADED");

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
  console.log("[GET /api/locations/:id/users] Handler called");
  console.log("[GET] URL:", event.node.req.url);

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

    // Check access permissions for OPERATOR role
    if (user.role === "OPERATOR") {
      const userLocationIds = user.locations?.map((loc) => loc.location_id) || [];

      if (!userLocationIds.includes(locationId)) {
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

    // Fetch users assigned to this location
    const userLocations = await prisma.userLocation.findMany({
      where: {
        location_id: locationId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            full_name: true,
            email: true,
            role: true,
            is_active: true,
          },
        },
        assigner: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
      },
      orderBy: {
        assigned_at: "desc",
      },
    });

    // Format response to include user details with access level
    const users = userLocations.map((ul) => ({
      user_id: ul.user.id,
      user: {
        id: ul.user.id,
        username: ul.user.username,
        full_name: ul.user.full_name,
        email: ul.user.email,
        role: ul.user.role,
        is_active: ul.user.is_active,
      },
      access_level: ul.access_level,
      assigned_at: ul.assigned_at,
      assigned_by: ul.assigner
        ? {
            id: ul.assigner.id,
            username: ul.assigner.username,
            full_name: ul.assigner.full_name,
          }
        : null,
    }));

    return {
      location: {
        id: location.id,
        name: location.name,
        code: location.code,
      },
      users,
      count: users.length,
    };
  } catch (error) {
    // Re-throw if already a createError
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching location users:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch location users",
      },
    });
  }
});
