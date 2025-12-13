/**
 * GET /api/reports/stock-now
 *
 * Generate current stock report across all locations
 *
 * Query Parameters:
 * - locationId: Filter by specific location (optional)
 * - category: Filter by item category (optional)
 * - lowStock: Show only items below minimum stock (true/false)
 *
 * Features:
 * - Current stock levels with WAC values
 * - Per-location breakdown when no location filter
 * - Low stock indicators
 * - Total values by location and overall
 *
 * Permissions:
 * - OPERATOR: Can only view assigned locations
 * - SUPERVISOR/ADMIN: Can view all locations
 */

import prisma from "../../utils/prisma";
import { setCacheHeaders } from "../../utils/performance";
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
  locationId: z.string().uuid().optional(),
  category: z.string().optional(),
  lowStock: z.enum(["true", "false"]).optional(),
});

// Stock item type for report
interface StockReportItem {
  item_id: string;
  item_code: string;
  item_name: string;
  item_unit: string;
  item_category: string | null;
  item_sub_category: string | null;
  on_hand: number;
  wac: number;
  stock_value: number;
  min_stock: number | null;
  max_stock: number | null;
  is_low_stock: boolean;
  is_over_stock: boolean;
  last_counted: Date | null;
}

// Location stock summary
interface LocationStockSummary {
  location_id: string;
  location_code: string;
  location_name: string;
  location_type: string;
  total_items: number;
  total_value: number;
  low_stock_items: number;
  items: StockReportItem[];
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
    // Parse and validate query parameters
    const query = await getQuery(event);
    const { locationId, category, lowStock } = querySchema.parse(query);

    // Get user's accessible locations
    let accessibleLocationIds: string[] = [];

    if (user.role === "ADMIN" || user.role === "SUPERVISOR") {
      // Admin and Supervisor can see all active locations
      const allLocations = await prisma.location.findMany({
        where: { is_active: true },
        select: { id: true },
      });
      accessibleLocationIds = allLocations.map((l) => l.id);
    } else {
      // Operator can only see assigned locations
      const userLocations = await prisma.userLocation.findMany({
        where: { user_id: user.id },
        select: { location_id: true },
      });
      accessibleLocationIds = userLocations.map((ul) => ul.location_id);
    }

    // If specific location requested, verify access
    if (locationId) {
      if (!accessibleLocationIds.includes(locationId)) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            code: "LOCATION_ACCESS_DENIED",
            message: "You do not have access to this location",
          },
        });
      }
      accessibleLocationIds = [locationId];
    }

    // Build item filter
    const itemWhere: Record<string, unknown> = {
      is_active: true,
    };

    if (category) {
      itemWhere.category = category;
    }

    // Fetch locations
    const locations = await prisma.location.findMany({
      where: {
        id: { in: accessibleLocationIds },
        is_active: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
      },
      orderBy: { code: "asc" },
    });

    // Fetch all stock for accessible locations
    // NOTE: Removed nested orderBy for performance - sorting done in JS below
    const allStock = await prisma.locationStock.findMany({
      where: {
        location_id: { in: accessibleLocationIds },
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
    });

    // Sort in JavaScript (faster than nested SQL orderBy)
    allStock.sort((a, b) => {
      const locCompare = (a.location?.code || "").localeCompare(b.location?.code || "");
      if (locCompare !== 0) return locCompare;
      return (a.item?.name || "").localeCompare(b.item?.name || "");
    });

    // Process stock by location
    const locationSummaries: LocationStockSummary[] = [];

    for (const location of locations) {
      const locationStock = allStock.filter((s) => s.location.id === location.id);

      const items: StockReportItem[] = [];
      let totalValue = 0;
      let lowStockCount = 0;

      for (const stock of locationStock) {
        const onHand = parseFloat(stock.on_hand.toString());
        const wac = parseFloat(stock.wac.toString());
        const stockValue = onHand * wac;
        const minStock = stock.min_stock ? parseFloat(stock.min_stock.toString()) : null;
        const maxStock = stock.max_stock ? parseFloat(stock.max_stock.toString()) : null;
        const isLowStock = minStock !== null && onHand < minStock;
        const isOverStock = maxStock !== null && onHand > maxStock;

        if (isLowStock) {
          lowStockCount++;
        }

        // Apply low stock filter if requested
        if (lowStock === "true" && !isLowStock) {
          continue;
        }

        totalValue += stockValue;

        items.push({
          item_id: stock.item.id,
          item_code: stock.item.code,
          item_name: stock.item.name,
          item_unit: stock.item.unit,
          item_category: stock.item.category,
          item_sub_category: stock.item.sub_category,
          on_hand: onHand,
          wac: Math.round(wac * 10000) / 10000,
          stock_value: Math.round(stockValue * 100) / 100,
          min_stock: minStock,
          max_stock: maxStock,
          is_low_stock: isLowStock,
          is_over_stock: isOverStock,
          last_counted: stock.last_counted,
        });
      }

      // Only add location if it has items (after filtering)
      if (items.length > 0 || lowStock !== "true") {
        locationSummaries.push({
          location_id: location.id,
          location_code: location.code,
          location_name: location.name,
          location_type: location.type,
          total_items: items.length,
          total_value: Math.round(totalValue * 100) / 100,
          low_stock_items: lowStockCount,
          items,
        });
      }
    }

    // Calculate grand totals
    const grandTotals = locationSummaries.reduce(
      (totals, loc) => ({
        total_items: totals.total_items + loc.total_items,
        total_value: totals.total_value + loc.total_value,
        low_stock_items: totals.low_stock_items + loc.low_stock_items,
      }),
      { total_items: 0, total_value: 0, low_stock_items: 0 }
    );

    // Get unique categories in the data
    const categories = [...new Set(allStock.map((s) => s.item.category).filter(Boolean))].sort();

    // Set cache headers (30 seconds for report data)
    setCacheHeaders(event, {
      maxAge: 30,
      staleWhileRevalidate: 15,
    });

    return {
      report_type: "stock-now",
      generated_at: new Date().toISOString(),
      generated_by: {
        id: user.id,
        username: user.username,
      },
      filters: {
        location_id: locationId || null,
        category: category || null,
        low_stock_only: lowStock === "true",
      },
      locations: locationSummaries,
      grand_totals: {
        total_locations: locationSummaries.length,
        total_items: grandTotals.total_items,
        total_value: Math.round(grandTotals.total_value * 100) / 100,
        low_stock_items: grandTotals.low_stock_items,
      },
      available_categories: categories,
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

    console.error("Error generating stock report:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to generate stock report",
      },
    });
  }
});
