/**
 * POST /api/locations
 *
 * Create a new location
 *
 * Permissions:
 * - ADMIN only
 *
 * Request Body:
 * - code: Unique location code (required)
 * - name: Location name (required)
 * - type: Location type (KITCHEN, STORE, CENTRAL, WAREHOUSE) (required)
 * - address: Location address (optional)
 * - manager_id: Manager user ID (optional)
 * - timezone: Timezone (optional, defaults to Asia/Riyadh)
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
const createLocationSchema = z.object({
  code: z.string().min(1).max(10).toUpperCase(),
  name: z.string().min(1).max(100),
  type: z.enum(["KITCHEN", "STORE", "CENTRAL", "WAREHOUSE"]),
  address: z.string().optional(),
  manager_id: z.string().uuid().optional(),
  timezone: z.string().max(50).optional().default("Asia/Riyadh"),
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
        message: "Only administrators can create locations",
      },
    });
  }

  try {
    // Parse and validate request body
    const body = await readBody(event);
    const data = createLocationSchema.parse(body);

    // Check if manager_id exists if provided
    if (data.manager_id) {
      const manager = await prisma.user.findUnique({
        where: { id: data.manager_id },
        select: { id: true, is_active: true },
      });

      if (!manager) {
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
          data: {
            code: "MANAGER_NOT_FOUND",
            message: "The specified manager user does not exist",
          },
        });
      }

      if (!manager.is_active) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "MANAGER_INACTIVE",
            message: "The specified manager is not an active user",
          },
        });
      }
    }

    // Create location in database
    const location = await prisma.location.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        address: data.address,
        manager_id: data.manager_id,
        timezone: data.timezone,
        is_active: true,
      },
      include: {
        manager: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
      },
    });

    return {
      location,
      message: "Location created successfully",
    };
  } catch (error) {
    // Handle unique constraint violation (duplicate code)
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      throw createError({
        statusCode: 409,
        statusMessage: "Conflict",
        data: {
          code: "DUPLICATE_CODE",
          message: "A location with this code already exists",
        },
      });
    }

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

    console.error("Error creating location:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to create location",
      },
    });
  }
});
