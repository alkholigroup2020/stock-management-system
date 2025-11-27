/**
 * GET /api/items
 *
 * Fetch items with optional filters and pagination
 *
 * Query Parameters:
 * - category: Filter by category
 * - search: Search by name or code
 * - locationId: Include location stock data for specific location
 * - is_active: Filter by active status (true/false)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 200)
 *
 * Permissions:
 * - All authenticated users can view items
 * - Operators only see items available at their assigned locations
 */

import prisma from "../../utils/prisma";
import { z } from "zod";
import type { UserRole } from "@prisma/client";
import { setCacheHeaders } from "../../utils/performance";

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

// Query schema for validation
const querySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  locationId: z.string().uuid().optional(),
  is_active: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(200).default(50),
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
    // Parse and validate query parameters
    const query = await getQuery(event);
    const { category, search, locationId, is_active, page, limit } = querySchema.parse(query);

    // Build where clause based on filters
    const where: Record<string, unknown> = {};

    // Filter by category if provided
    if (category) {
      where.category = category;
    }

    // Filter by active status if provided
    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    // Search by name or code if provided
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Build include clause
    const include: Record<string, unknown> = {};

    // Include location stock if locationId is provided
    if (locationId) {
      // Check if user has access to this location
      if (user.role === "OPERATOR") {
        const hasAccess = user.locations?.some((loc) => loc.location_id === locationId);
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
            },
          },
        },
      };
    }

    // Fetch items with pagination
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include,
        orderBy: [{ category: "asc" }, { name: "asc" }],
        skip,
        take,
      }),
      prisma.item.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Set cache headers (5 minutes for items list)
    setCacheHeaders(event, {
      maxAge: 300,
      staleWhileRevalidate: 60,
    });

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };
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

    console.error("Error fetching items:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch items",
      },
    });
  }
});
