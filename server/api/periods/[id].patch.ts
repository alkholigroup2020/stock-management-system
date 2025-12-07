/**
 * PATCH /api/periods/:id
 *
 * Update an existing period (DRAFT status only)
 *
 * Body (all fields optional):
 * - name: Period name
 * - start_date: Start date (YYYY-MM-DD)
 * - end_date: End date (YYYY-MM-DD)
 *
 * Note: Status cannot be changed via this endpoint (use workflow endpoints)
 *
 * Permissions:
 * - ADMIN only
 * - Period must be in DRAFT status
 */

import prisma from "../../utils/prisma";
import { z } from "zod";

// Request body schema for update (all fields optional)
const updatePeriodSchema = z.object({
  name: z.string().min(1).max(100).optional(),
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

  // Check if user is ADMIN
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Only admins can update periods",
      },
    });
  }

  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_ID",
          message: "Period ID is required",
        },
      });
    }

    // Check if period exists
    const existingPeriod = await prisma.period.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        start_date: true,
        end_date: true,
      },
    });

    if (!existingPeriod) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "PERIOD_NOT_FOUND",
          message: "Period not found",
        },
      });
    }

    // Only DRAFT periods can be edited
    if (existingPeriod.status !== "DRAFT") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "PERIOD_NOT_EDITABLE",
          message: "Only DRAFT periods can be edited",
        },
      });
    }

    // Parse and validate request body
    const body = await readBody(event);
    const data = updatePeriodSchema.parse(body);

    // Check if there's anything to update
    if (Object.keys(data).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "NO_UPDATE_DATA",
          message: "No update data provided",
        },
      });
    }

    // Determine final dates for validation
    const startDate = data.start_date ? new Date(data.start_date) : existingPeriod.start_date;
    const endDate = data.end_date ? new Date(data.end_date) : existingPeriod.end_date;

    // Validate date range
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

    // Check for overlapping periods (excluding the current period)
    const overlappingPeriod = await prisma.period.findFirst({
      where: {
        AND: [
          { id: { not: id } }, // Exclude current period
          {
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

    // Prepare update data with date conversion
    const updateData: {
      name?: string;
      start_date?: Date;
      end_date?: Date;
    } = {};

    if (data.name) {
      updateData.name = data.name;
    }
    if (data.start_date) {
      updateData.start_date = new Date(data.start_date);
    }
    if (data.end_date) {
      updateData.end_date = new Date(data.end_date);
    }

    // Update the period
    const period = await prisma.period.update({
      where: { id },
      data: updateData,
      include: {
        period_locations: {
          select: {
            location_id: true,
            status: true,
            opening_value: true,
            closing_value: true,
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
          orderBy: {
            location: {
              name: "asc",
            },
          },
        },
        _count: {
          select: {
            item_prices: true,
            deliveries: true,
            issues: true,
            reconciliations: true,
          },
        },
      },
    });

    return {
      period,
      message: "Period updated successfully",
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

    console.error("Error updating period:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to update period",
      },
    });
  }
});
