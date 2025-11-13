/**
 * GET /api/locations/:id
 *
 * Fetch a single location by ID
 *
 * Permissions:
 * - ADMIN/SUPERVISOR: Can view any location
 * - OPERATOR: Can only view assigned locations
 *
 * Returns:
 * - Location details with manager info
 * - User assignments count
 * - Stock items count
 */

import prisma from "../../utils/prisma";
import type { UserRole } from "@prisma/client";

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

    // Fetch location with related data
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: {
        manager: {
          select: {
            id: true,
            username: true,
            full_name: true,
            email: true,
          },
        },
        _count: {
          select: {
            user_locations: true,
            location_stock: true,
            deliveries: true,
            issues: true,
            transfers_from: true,
            transfers_to: true,
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

    return {
      location,
    };
  } catch (error) {
    // Re-throw if already a createError
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching location:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch location",
      },
    });
  }
});
