/**
 * GET /api/items/:id
 *
 * Fetch a single item by ID with optional location stock data
 *
 * Query Parameters:
 * - locationId: Include stock data for specific location (optional)
 * - includeAllStock: Include stock data for all locations (admin/supervisor only)
 *
 * Permissions:
 * - All authenticated users can view items
 * - Operators only see stock for their assigned locations
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
  locations?: string[]; // Array of location IDs (for Operators)
}

// Query schema for validation
const querySchema = z.object({
  locationId: z.string().uuid().optional(),
  includeAllStock: z
    .string()
    .transform((val) => val === "true")
    .optional(),
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

  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_ID",
          message: "Item ID is required",
        },
      });
    }

    // Parse and validate query parameters
    const query = await getQuery(event);
    const { locationId, includeAllStock } = querySchema.parse(query);

    // Build include clause
    const include: Record<string, unknown> = {};

    // Include location stock based on query parameters
    if (includeAllStock && (user.role === "ADMIN" || user.role === "SUPERVISOR")) {
      // Include all location stock for admins/supervisors
      include.location_stock = {
        include: {
          location: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: {
          location: {
            name: "asc",
          },
        },
      };
    } else if (locationId) {
      // Check if user has access to the requested location
      if (user.role === "OPERATOR") {
        const hasAccess = user.locations?.includes(locationId);
        if (!hasAccess) {
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

      // Include stock for specific location
      include.location_stock = {
        where: {
          location_id: locationId,
        },
        include: {
          location: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
            },
          },
        },
      };
    } else if (user.role === "OPERATOR") {
      // For operators without specific locationId, include stock from their assigned locations
      const userLocationIds = user.locations || [];
      if (userLocationIds.length > 0) {
        include.location_stock = {
          where: {
            location_id: { in: userLocationIds },
          },
          include: {
            location: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: {
            location: {
              name: "asc",
            },
          },
        };
      }
    }

    // Fetch the item
    const item = await prisma.item.findUnique({
      where: { id },
      include,
    });

    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "ITEM_NOT_FOUND",
          message: "Item not found",
        },
      });
    }

    return { item };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: error.issues,
        },
      });
    }

    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching item:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch item",
      },
    });
  }
});
