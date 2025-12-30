/**
 * GET /api/stock/consolidated
 *
 * Fetch consolidated stock levels across all locations
 *
 * Query Parameters:
 * - category: Filter by item category
 * - lowStock: Show only items below minimum stock
 *
 * Permissions:
 * - SUPERVISOR/ADMIN only (multi-location view)
 */

import prisma from "../../utils/prisma";
import { setCacheHeaders } from "../../utils/performance";
import { z } from "zod";

// Query schema for validation
const querySchema = z.object({
  category: z.string().optional(),
  lowStock: z.enum(["true", "false"]).optional(),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user;

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

  // Check if user is SUPERVISOR or ADMIN
  if (user.role !== "SUPERVISOR" && user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Only supervisors and administrators can view consolidated stock",
      },
    });
  }

  try {
    // Parse and validate query parameters
    const query = await getQuery(event);
    const { category, lowStock } = querySchema.parse(query);

    // Build where clause for items
    const itemWhere: { is_active: boolean; category?: string } = {
      is_active: true,
    };

    if (category) {
      itemWhere.category = category;
    }

    // Use $transaction to batch both queries into a single database round-trip
    const [locations, allStock] = await prisma.$transaction([
      // Fetch all locations
      prisma.location.findMany({
        where: { is_active: true },
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
        },
        orderBy: { name: "asc" },
      }),
      // Fetch all stock across all locations
      // NOTE: Removed nested orderBy on item.name for performance
      // Sorting is done in JavaScript after aggregation
      prisma.locationStock.findMany({
        where: {
          location: { is_active: true },
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
          location: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
            },
          },
        },
      }),
    ]);

    // Group stock by item and aggregate across locations
    const stockByItem = new Map<
      string,
      {
        item: any;
        total_on_hand: number;
        total_value: number;
        locations: Array<{
          location_id: string;
          location_code: string;
          location_name: string;
          location_type: string;
          on_hand: number;
          wac: number;
          value: number;
          min_stock: number | null;
          max_stock: number | null;
          is_low_stock: boolean;
        }>;
      }
    >();

    // Process each stock record
    for (const stock of allStock) {
      const itemId = stock.item.id;
      const onHand = parseFloat(stock.on_hand.toString());
      const wac = parseFloat(stock.wac.toString());
      const value = onHand * wac;
      const isLowStock =
        stock.min_stock !== null ? onHand < parseFloat(stock.min_stock.toString()) : false;

      if (!stockByItem.has(itemId)) {
        stockByItem.set(itemId, {
          item: stock.item,
          total_on_hand: 0,
          total_value: 0,
          locations: [],
        });
      }

      const itemData = stockByItem.get(itemId)!;
      itemData.total_on_hand += onHand;
      itemData.total_value += value;
      itemData.locations.push({
        location_id: stock.location.id,
        location_code: stock.location.code,
        location_name: stock.location.name,
        location_type: stock.location.type,
        on_hand: onHand,
        wac: wac,
        value: value,
        min_stock: stock.min_stock ? parseFloat(stock.min_stock.toString()) : null,
        max_stock: stock.max_stock ? parseFloat(stock.max_stock.toString()) : null,
        is_low_stock: isLowStock,
      });
    }

    // Convert map to array and sort by item name (JS sorting instead of SQL nested orderBy)
    let consolidatedStock = Array.from(stockByItem.values()).sort((a, b) =>
      (a.item?.name || "").localeCompare(b.item?.name || "")
    );

    // Filter low stock if requested
    if (lowStock === "true") {
      consolidatedStock = consolidatedStock.filter((item) =>
        item.locations.some((loc) => loc.is_low_stock)
      );
    }

    // Calculate grand totals
    const grandTotalValue = consolidatedStock.reduce((sum, item) => sum + item.total_value, 0);

    // Calculate totals by location
    const locationTotals = locations.map((location) => {
      const locationStock = allStock.filter((s) => s.location.id === location.id);
      const totalValue = locationStock.reduce((sum, s) => {
        const qty = parseFloat(s.on_hand.toString());
        const wac = parseFloat(s.wac.toString());
        return sum + qty * wac;
      }, 0);

      return {
        location_id: location.id,
        location_code: location.code,
        location_name: location.name,
        location_type: location.type,
        total_value: totalValue,
        item_count: locationStock.length,
      };
    });

    // Set cache headers (2 seconds for aggregated stock data)
    setCacheHeaders(event, {
      maxAge: 2,
      staleWhileRevalidate: 2,
    });

    return {
      consolidated_stock: consolidatedStock.map((item) => ({
        item_id: item.item.id,
        item_code: item.item.code,
        item_name: item.item.name,
        item_unit: item.item.unit,
        item_category: item.item.category,
        item_sub_category: item.item.sub_category,
        total_on_hand: item.total_on_hand,
        total_value: item.total_value,
        locations: item.locations,
      })),
      location_totals: locationTotals,
      grand_total_value: grandTotalValue,
      total_items: consolidatedStock.length,
      total_locations: locations.length,
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

    console.error("Error fetching consolidated stock:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch consolidated stock",
      },
    });
  }
});
