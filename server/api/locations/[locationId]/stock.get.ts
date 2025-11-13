/**
 * GET /api/locations/:locationId/stock
 *
 * Fetch current stock levels for a location
 *
 * Query Parameters:
 * - category: Filter by item category
 * - lowStock: Show only items below minimum stock
 *
 * Permissions:
 * - User must have access to the location
 */

import prisma from "../../../utils/prisma";
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

// Query schema for validation
const querySchema = z.object({
  category: z.string().optional(),
  lowStock: z.enum(["true", "false"]).optional(),
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
    const locationId = getRouterParam(event, "locationId");

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

    // Check if location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
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

    // Parse and validate query parameters
    const query = await getQuery(event);
    const { category, lowStock } = querySchema.parse(query);

    // Build where clause for items
    const itemWhere: Record<string, unknown> = {
      is_active: true,
    };

    if (category) {
      itemWhere.category = category;
    }

    // Fetch location stock
    const stock = await prisma.locationStock.findMany({
      where: {
        location_id: locationId,
        item: itemWhere,
      },
      include: {
        item: {
          select: {
            id: true,
            code: true,
            name: true,
            unit: true,
            category: true,
            sub_category: true,
          },
        },
      },
      orderBy: {
        item: {
          name: "asc",
        },
      },
    });

    // Filter low stock if requested
    let filteredStock = stock;
    if (lowStock === "true") {
      filteredStock = stock.filter((s) => {
        if (s.min_stock === null) return false;
        return parseFloat(s.on_hand.toString()) < parseFloat(s.min_stock.toString());
      });
    }

    // Calculate total value
    const totalValue = filteredStock.reduce((sum, s) => {
      const qty = parseFloat(s.on_hand.toString());
      const wac = parseFloat(s.wac.toString());
      return sum + qty * wac;
    }, 0);

    return {
      location: {
        id: location.id,
        code: location.code,
        name: location.name,
        type: location.type,
      },
      stock: filteredStock.map((s) => ({
        item_id: s.item.id,
        item_code: s.item.code,
        item_name: s.item.name,
        item_unit: s.item.unit,
        item_category: s.item.category,
        item_sub_category: s.item.sub_category,
        on_hand: s.on_hand,
        wac: s.wac,
        value: parseFloat(s.on_hand.toString()) * parseFloat(s.wac.toString()),
        min_stock: s.min_stock,
        max_stock: s.max_stock,
        is_low_stock: s.min_stock
          ? parseFloat(s.on_hand.toString()) < parseFloat(s.min_stock.toString())
          : false,
      })),
      total_value: totalValue,
      count: filteredStock.length,
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

    console.error("Error fetching location stock:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch location stock",
      },
    });
  }
});
