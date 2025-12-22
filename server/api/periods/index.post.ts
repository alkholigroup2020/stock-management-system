/**
 * POST /api/periods
 *
 * Create a new period
 *
 * Body:
 * - name: Period name (e.g., "January 2025")
 * - start_date: Start date (YYYY-MM-DD)
 * - end_date: End date (YYYY-MM-DD)
 * - status: Optional initial status (defaults to DRAFT)
 *
 * Permissions:
 * - ADMIN only
 */

import prisma from "../../utils/prisma";
import { z } from "zod";

// Request body schema
// Note: Periods can only be created as DRAFT. To open a period, use the /open endpoint
// after setting all item prices. This ensures price validation is enforced.
const periodSchema = z.object({
  name: z.string().min(1).max(100),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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

  // Check if user is ADMIN
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Only admins can create periods",
      },
    });
  }

  try {
    // Parse and validate request body
    const body = await readBody(event);
    const data = periodSchema.parse(body);

    // Validate date range
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);

    if (endDate <= startDate) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "INVALID_DATE_RANGE",
          message: "End date must be after start date",
        },
      });
    }

    // Check for overlapping periods
    const overlappingPeriod = await prisma.period.findFirst({
      where: {
        OR: [
          {
            AND: [{ start_date: { lte: startDate } }, { end_date: { gte: startDate } }],
          },
          {
            AND: [{ start_date: { lte: endDate } }, { end_date: { gte: endDate } }],
          },
          {
            AND: [{ start_date: { gte: startDate } }, { end_date: { lte: endDate } }],
          },
        ],
      },
    });

    if (overlappingPeriod) {
      throw createError({
        statusCode: 409,
        statusMessage: "Conflict",
        data: {
          code: "OVERLAPPING_PERIOD",
          message: `Period overlaps with existing period '${overlappingPeriod.name}'`,
        },
      });
    }

    // Get all active locations
    const activeLocations = await prisma.location.findMany({
      where: {
        is_active: true,
      },
      select: {
        id: true,
      },
    });

    // Check if there are any active locations
    if (activeLocations.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "NO_LOCATIONS",
          message: "Cannot create a period without any active locations. Please create at least one location first.",
        },
      });
    }

    // Find the most recent closed period to copy closing stock
    const previousPeriod = await prisma.period.findFirst({
      where: {
        status: "CLOSED",
        end_date: { lt: startDate },
      },
      orderBy: {
        end_date: "desc",
      },
      include: {
        period_locations: {
          select: {
            location_id: true,
            closing_value: true,
          },
        },
      },
    });

    // Create a map of previous period's closing values by location
    const previousClosingValues = new Map<string, number>();
    if (previousPeriod) {
      previousPeriod.period_locations.forEach((pl) => {
        if (pl.closing_value !== null) {
          previousClosingValues.set(pl.location_id, Number(pl.closing_value));
        }
      });
    }

    // Create the period with PeriodLocation entries
    // Always create as DRAFT - must use /open endpoint to activate after setting prices
    const period = await prisma.period.create({
      data: {
        name: data.name,
        start_date: startDate,
        end_date: endDate,
        status: "DRAFT",
        period_locations: {
          create: activeLocations.map((location) => ({
            location_id: location.id,
            status: "OPEN",
            opening_value: previousClosingValues.get(location.id) || null,
          })),
        },
      },
      include: {
        period_locations: {
          select: {
            location_id: true,
            status: true,
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
        },
      },
    });

    return {
      period,
      message: "Period created successfully",
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid period data",
          details: error.issues,
        },
      });
    }

    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error creating period:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to create period",
      },
    });
  }
});
