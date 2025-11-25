/**
 * POST /api/periods/:periodId/roll-forward
 *
 * Roll forward a closed period to create the next period
 *
 * This endpoint:
 * - Creates a new period starting the day after the closed period ends
 * - Copies closing stock values as opening stock values for the new period
 * - Copies item prices from the closed period (new period starts in DRAFT so prices can be modified)
 * - Reconciliation values are automatically reset (fresh for each period)
 *
 * Body (optional):
 * - name: Custom name for the new period (defaults to next month name)
 * - end_date: Custom end date (defaults to last day of the month)
 * - copy_prices: Whether to copy prices (default: true)
 *
 * Permissions:
 * - ADMIN only
 */

import prisma from "~~/server/utils/prisma";
import { z } from "zod";

// Request body schema (all optional)
const rollForwardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  copy_prices: z.boolean().optional().default(true),
});

/**
 * Calculate default end date (last day of the month containing start_date)
 */
function getLastDayOfMonth(date: Date): Date {
  const year = date.getFullYear();
  const month = date.getMonth();
  // Get first day of next month, then subtract 1 day
  return new Date(year, month + 1, 0);
}

/**
 * Generate default period name based on start date (e.g., "February 2025")
 */
function generatePeriodName(date: Date): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

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
        message: "Only admins can roll forward periods",
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

    // Parse body (optional)
    const body = await readBody(event).catch(() => ({}));
    const options = rollForwardSchema.parse(body || {});

    // Fetch the source period with all related data
    const sourcePeriod = await prisma.period.findUnique({
      where: { id: periodId },
      include: {
        period_locations: {
          select: {
            location_id: true,
            closing_value: true,
          },
        },
        item_prices: {
          where: {
            item: {
              is_active: true,
            },
          },
          select: {
            item_id: true,
            price: true,
            currency: true,
          },
        },
      },
    });

    if (!sourcePeriod) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "PERIOD_NOT_FOUND",
          message: "Period not found",
        },
      });
    }

    // Verify period is CLOSED
    if (sourcePeriod.status !== "CLOSED") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "PERIOD_NOT_CLOSED",
          message: `Cannot roll forward a period that is not closed. Current status: ${sourcePeriod.status}`,
          currentStatus: sourcePeriod.status,
        },
      });
    }

    // Calculate new period dates
    // Start date is the day after the source period ends
    const sourceEndDate = new Date(sourcePeriod.end_date);
    const newStartDate = new Date(sourceEndDate);
    newStartDate.setDate(newStartDate.getDate() + 1);

    // Default end date is last day of the month containing the start date
    let newEndDate: Date;
    if (options.end_date) {
      newEndDate = new Date(options.end_date);
      // Validate end date is after start date
      if (newEndDate <= newStartDate) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "INVALID_DATE_RANGE",
            message: "End date must be after start date",
          },
        });
      }
    } else {
      newEndDate = getLastDayOfMonth(newStartDate);
    }

    // Generate period name if not provided
    const periodName = options.name || generatePeriodName(newStartDate);

    // Check for overlapping periods
    const overlappingPeriod = await prisma.period.findFirst({
      where: {
        OR: [
          {
            AND: [{ start_date: { lte: newStartDate } }, { end_date: { gte: newStartDate } }],
          },
          {
            AND: [{ start_date: { lte: newEndDate } }, { end_date: { gte: newEndDate } }],
          },
          {
            AND: [{ start_date: { gte: newStartDate } }, { end_date: { lte: newEndDate } }],
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
          message: `New period would overlap with existing period '${overlappingPeriod.name}'`,
          existingPeriod: {
            id: overlappingPeriod.id,
            name: overlappingPeriod.name,
            start_date: overlappingPeriod.start_date,
            end_date: overlappingPeriod.end_date,
          },
        },
      });
    }

    // Create a map of closing values by location
    const closingValuesByLocation = new Map<string, number>();
    sourcePeriod.period_locations.forEach((pl) => {
      if (pl.closing_value !== null) {
        closingValuesByLocation.set(pl.location_id, Number(pl.closing_value));
      }
    });

    // Get all active locations (in case new ones were added since the closed period)
    const activeLocations = await prisma.location.findMany({
      where: { is_active: true },
      select: { id: true, code: true, name: true, type: true },
    });

    // Execute in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the new period with PeriodLocation entries
      const newPeriod = await tx.period.create({
        data: {
          name: periodName,
          start_date: newStartDate,
          end_date: newEndDate,
          status: "DRAFT", // Always start as DRAFT so prices can be modified
          period_locations: {
            create: activeLocations.map((location) => ({
              location_id: location.id,
              status: "OPEN",
              // Copy closing value from source period as opening value (if available)
              opening_value: closingValuesByLocation.get(location.id) || null,
            })),
          },
        },
        include: {
          period_locations: {
            select: {
              location_id: true,
              status: true,
              opening_value: true,
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

      // Copy item prices if requested
      let copiedPricesCount = 0;
      if (options.copy_prices && sourcePeriod.item_prices.length > 0) {
        const priceCreates = sourcePeriod.item_prices.map((priceData) => ({
          item_id: priceData.item_id,
          period_id: newPeriod.id,
          price: priceData.price,
          currency: priceData.currency,
          set_by: user.id,
        }));

        await tx.itemPrice.createMany({
          data: priceCreates,
        });

        copiedPricesCount = priceCreates.length;
      }

      return { newPeriod, copiedPricesCount };
    });

    // Prepare response
    const locationSummaries = result.newPeriod.period_locations.map((pl) => ({
      locationId: pl.location.id,
      locationCode: pl.location.code,
      locationName: pl.location.name,
      locationType: pl.location.type,
      status: pl.status,
      openingValue: pl.opening_value ? Number(pl.opening_value) : null,
    }));

    return {
      message: "Period rolled forward successfully",
      sourcePeriod: {
        id: sourcePeriod.id,
        name: sourcePeriod.name,
        start_date: sourcePeriod.start_date,
        end_date: sourcePeriod.end_date,
        status: sourcePeriod.status,
      },
      newPeriod: {
        id: result.newPeriod.id,
        name: result.newPeriod.name,
        start_date: result.newPeriod.start_date,
        end_date: result.newPeriod.end_date,
        status: result.newPeriod.status,
        locations: locationSummaries,
      },
      summary: {
        locationsCreated: locationSummaries.length,
        locationsWithOpeningValue: locationSummaries.filter((l) => l.openingValue !== null).length,
        totalOpeningValue: locationSummaries.reduce((sum, l) => sum + (l.openingValue || 0), 0),
        pricesCopied: result.copiedPricesCount,
      },
      nextSteps: [
        "Review and adjust item prices if needed (period is in DRAFT status)",
        "When ready, change period status to OPEN to lock prices and allow transactions",
      ],
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid roll forward options",
          details: error.issues,
        },
      });
    }

    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error rolling forward period:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to roll forward period",
      },
    });
  }
});
