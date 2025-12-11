/**
 * GET /api/locations/:id/deliveries
 *
 * List deliveries for a location
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - period_id: Filter by period
 * - supplier_id: Filter by supplier
 * - has_variance: Filter by variance status (true/false)
 * - from_date: Filter from date (ISO string)
 * - to_date: Filter to date (ISO string)
 *
 * Permissions:
 * - User must have VIEW, POST, or MANAGE access to the location
 * - ADMIN and SUPERVISOR have implicit access
 */

import prisma from "../../../../utils/prisma";
import type { UserRole, Prisma } from "@prisma/client";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
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

  // Get location ID from route params
  const locationId = getRouterParam(event, "id");

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

  try {
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

    // Check user has access to location
    const userLocation = await prisma.userLocation.findUnique({
      where: {
        user_id_location_id: {
          user_id: user.id,
          location_id: locationId,
        },
      },
    });

    if (!userLocation && user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "LOCATION_ACCESS_DENIED",
          message: "You do not have access to this location",
        },
      });
    }

    // Parse query parameters
    const query = getQuery(event);
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.DeliveryWhereInput = {
      location_id: locationId,
    };

    if (query.period_id) {
      where.period_id = query.period_id as string;
    }

    if (query.supplier_id) {
      where.supplier_id = query.supplier_id as string;
    }

    if (query.has_variance !== undefined) {
      where.has_variance = query.has_variance === "true";
    }

    if (query.from_date) {
      where.delivery_date = {
        ...(where.delivery_date as Prisma.DateTimeFilter || {}),
        gte: new Date(query.from_date as string),
      };
    }

    if (query.to_date) {
      where.delivery_date = {
        ...(where.delivery_date as Prisma.DateTimeFilter || {}),
        lte: new Date(query.to_date as string),
      };
    }

    // Get total count
    const total = await prisma.delivery.count({ where });

    // Get deliveries
    const deliveries = await prisma.delivery.findMany({
      where,
      skip,
      take: limit,
      orderBy: { delivery_date: "desc" },
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        poster: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            delivery_lines: true,
            ncrs: true,
          },
        },
      },
    });

    return {
      deliveries: deliveries.map((d) => ({
        id: d.id,
        delivery_no: d.delivery_no,
        delivery_date: d.delivery_date,
        invoice_no: d.invoice_no,
        total_amount: d.total_amount,
        has_variance: d.has_variance,
        supplier: d.supplier,
        posted_by: d.poster,
        period: d.period,
        line_count: d._count.delivery_lines,
        ncr_count: d._count.ncrs,
        posted_at: d.posted_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching deliveries:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch deliveries",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
