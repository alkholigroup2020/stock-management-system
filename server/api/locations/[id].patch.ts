/**
 * PATCH /api/locations/:id
 *
 * Update an existing location
 *
 * Permissions:
 * - ADMIN only
 *
 * Request Body (all fields optional):
 * - name: Location name
 * - type: Location type (KITCHEN, STORE, CENTRAL, WAREHOUSE)
 * - address: Location address
 * - timezone: Timezone
 * - is_active: Active status
 */

import prisma from "../../utils/prisma";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

// Request body schema for validation
const updateLocationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["KITCHEN", "STORE", "CENTRAL", "WAREHOUSE"]).optional(),
  address: z.string().optional().nullable(),
  timezone: z.string().max(50).optional(),
  is_active: z.boolean().optional(),
});

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

  // Check if user is ADMIN
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Only administrators can update locations",
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
    const data = updateLocationSchema.parse(body);

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true },
    });

    if (!existingLocation) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "LOCATION_NOT_FOUND",
          message: "Location not found",
        },
      });
    }

    // Update location in database
    const location = await prisma.location.update({
      where: { id: locationId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.timezone && { timezone: data.timezone }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
      },
    });

    return {
      location,
      message: "Location updated successfully",
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid location data",
          details: error.issues,
        },
      });
    }

    // Re-throw if already a createError
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error updating location:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to update location",
      },
    });
  }
});
