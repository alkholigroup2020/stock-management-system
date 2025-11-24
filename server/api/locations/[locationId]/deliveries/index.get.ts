/**
 * GET /api/locations/:locationId/deliveries
 *
 * Fetch deliveries for a location with optional filters
 *
 * Query Parameters:
 * - periodId: Filter by period
 * - supplierId: Filter by supplier
 * - startDate: Filter by delivery date (from)
 * - endDate: Filter by delivery date (to)
 * - hasVariance: Filter by price variance (true/false)
 * - includeLines: Include delivery lines in response (true/false)
 *
 * Permissions:
 * - User must have access to the location
 */

import prisma from "../../../../utils/prisma";
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
  periodId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  hasVariance: z.enum(["true", "false"]).optional(),
  includeLines: z.enum(["true", "false"]).optional(),
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
    const { periodId, supplierId, startDate, endDate, hasVariance, includeLines, page, limit } =
      querySchema.parse(query);

    // Build where clause for deliveries
    const where: Record<string, unknown> = {
      location_id: locationId,
    };

    if (periodId) {
      where.period_id = periodId;
    }

    if (supplierId) {
      where.supplier_id = supplierId;
    }

    if (startDate || endDate) {
      const deliveryDateFilter: Record<string, Date> = {};
      if (startDate) {
        deliveryDateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        deliveryDateFilter.lte = new Date(endDate);
      }
      where.delivery_date = deliveryDateFilter;
    }

    if (hasVariance) {
      where.has_variance = hasVariance === "true";
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Fetch deliveries with pagination
    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        poster: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
        po: {
          select: {
            id: true,
            po_no: true,
          },
        },
        delivery_lines:
          includeLines === "true"
            ? {
                include: {
                  item: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                      unit: true,
                    },
                  },
                },
              }
            : false,
        ncrs: {
          select: {
            id: true,
            ncr_no: true,
            type: true,
            status: true,
            value: true,
          },
        },
      },
      orderBy: {
        delivery_date: "desc",
      },
      skip,
      take,
    }),
    prisma.delivery.count({ where }),
  ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      location: {
        id: location.id,
        code: location.code,
        name: location.name,
      },
      deliveries: deliveries.map((delivery) => ({
        id: delivery.id,
        delivery_no: delivery.delivery_no,
        delivery_date: delivery.delivery_date,
        invoice_no: delivery.invoice_no,
        delivery_note: delivery.delivery_note,
        total_amount: delivery.total_amount,
        has_variance: delivery.has_variance,
        posted_at: delivery.posted_at,
        supplier: delivery.supplier,
        period: delivery.period,
        po: delivery.po,
        poster: delivery.poster,
        ncrs: delivery.ncrs,
        lines:
          includeLines === "true" && Array.isArray(delivery.delivery_lines)
            ? delivery.delivery_lines.map((line: unknown) => {
                const deliveryLine = line as {
                  id: string;
                  item: { id: string; code: string; name: string; unit: string };
                  quantity: number;
                  unit_price: number;
                  period_price: number;
                  price_variance: number;
                  line_value: number;
                };
                return {
                  id: deliveryLine.id,
                  item: deliveryLine.item,
                  quantity: deliveryLine.quantity,
                  unit_price: deliveryLine.unit_price,
                  period_price: deliveryLine.period_price,
                  price_variance: deliveryLine.price_variance,
                  line_value: deliveryLine.line_value,
                };
              })
            : undefined,
      })),
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

    console.error("Error fetching deliveries:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch deliveries",
      },
    });
  }
});
