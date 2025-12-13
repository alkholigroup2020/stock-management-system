/**
 * GET /api/periods
 *
 * Fetch all periods with optional filters
 *
 * Query Parameters:
 * - status: Filter by period status (DRAFT, OPEN, PENDING_CLOSE, APPROVED, CLOSED)
 * - start_date: Filter by start date (YYYY-MM-DD)
 * - end_date: Filter by end date (YYYY-MM-DD)
 *
 * Permissions:
 * - All authenticated users can view periods
 */

import prisma from "../../utils/prisma";
import { setCacheHeaders } from "../../utils/performance";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

// Query schema for validation
const querySchema = z.object({
  status: z.enum(["DRAFT", "OPEN", "PENDING_CLOSE", "APPROVED", "CLOSED"]).optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
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

  try {
    // Parse and validate query parameters
    const query = await getQuery(event);
    const { status, start_date, end_date } = querySchema.parse(query);

    // Build where clause based on filters
    const where: Prisma.PeriodWhereInput = {};

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // Filter by date range if provided
    if (start_date || end_date) {
      where.AND = [];

      if (start_date) {
        where.AND.push({
          start_date: {
            gte: new Date(start_date),
          },
        });
      }

      if (end_date) {
        where.AND.push({
          end_date: {
            lte: new Date(end_date),
          },
        });
      }
    }

    // Fetch all periods with location statuses
    // NOTE: Removed nested orderBy on location.name for performance
    // Sorting is done in JavaScript below to avoid expensive JOIN operations
    const periods = await prisma.period.findMany({
      where,
      include: {
        period_locations: {
          select: {
            location_id: true,
            status: true,
            ready_at: true,
            closed_at: true,
            location: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
              },
            },
          },
        },
        _count: {
          select: {
            deliveries: true,
            issues: true,
            reconciliations: true,
          },
        },
      },
      orderBy: {
        start_date: "desc",
      },
    });

    // Sort period_locations by location name in JavaScript (faster than nested SQL ordering)
    const sortedPeriods = periods.map((period) => ({
      ...period,
      period_locations: [...period.period_locations].sort((a, b) =>
        (a.location?.name || "").localeCompare(b.location?.name || "")
      ),
    }));

    // Set cache headers (20 seconds with 10 second stale-while-revalidate)
    setCacheHeaders(event, {
      maxAge: 20,
      staleWhileRevalidate: 10,
    });

    return {
      periods: sortedPeriods,
      count: sortedPeriods.length,
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

    console.error("Error fetching periods:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch periods",
      },
    });
  }
});
