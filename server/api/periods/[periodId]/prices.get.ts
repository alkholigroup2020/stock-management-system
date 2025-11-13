/**
 * GET /api/periods/:periodId/prices
 *
 * Fetch all item prices for a specific period
 *
 * Query Parameters:
 * - search: Search by item name or code
 * - category: Filter by item category
 *
 * Permissions:
 * - All authenticated users can view prices
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
  search: z.string().optional(),
  category: z.string().optional(),
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
    const periodId = getRouterParam(event, "periodId");

    if (!periodId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_PERIOD_ID",
          message: "Period ID is required",
        },
      });
    }

    // Check if period exists
    const period = await prisma.period.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "PERIOD_NOT_FOUND",
          message: "Period not found",
        },
      });
    }

    // Parse and validate query parameters
    const query = await getQuery(event);
    const { search, category } = querySchema.parse(query);

    // Build where clause for items
    const itemWhere: Record<string, unknown> = {
      is_active: true,
    };

    if (category) {
      itemWhere.category = category;
    }

    if (search) {
      itemWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch all active items with their prices for this period
    const items = await prisma.item.findMany({
      where: itemWhere,
      include: {
        item_prices: {
          where: {
            period_id: periodId,
          },
        },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Transform the data to include price info
    const prices = items.map((item) => {
      const itemPrice = item.item_prices[0]; // Should only be one due to unique constraint

      return {
        item_id: item.id,
        item_code: item.code,
        item_name: item.name,
        item_unit: item.unit,
        item_category: item.category,
        item_sub_category: item.sub_category,
        price_id: itemPrice?.id || null,
        price: itemPrice?.price || null,
        currency: itemPrice?.currency || "SAR",
        set_by: itemPrice?.set_by || null,
        set_at: itemPrice?.set_at || null,
        has_price: !!itemPrice,
      };
    });

    return {
      period: {
        id: period.id,
        name: period.name,
        status: period.status,
        start_date: period.start_date,
        end_date: period.end_date,
      },
      prices,
      count: prices.length,
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

    console.error("Error fetching period prices:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch period prices",
      },
    });
  }
});
