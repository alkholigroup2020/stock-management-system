/**
 * POST /api/periods/:periodId/open
 *
 * Open a period (change status from DRAFT to OPEN)
 *
 * Permissions:
 * - ADMIN only
 *
 * Business Rules:
 * - Period must be in DRAFT status
 * - No other period can be OPEN (only one active period at a time)
 * - Opening a period locks prices (cannot be modified once OPEN)
 */

import prisma from "~~/server/utils/prisma";

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
        message: "Only admins can open periods",
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
          code: "MISSING_PARAMETERS",
          message: "Period ID is required",
        },
      });
    }

    // Fetch the period
    const period = await prisma.period.findUnique({
      where: { id: periodId },
      include: {
        period_locations: {
          include: {
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
            item_prices: true,
          },
        },
      },
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

    // Check period status - must be DRAFT
    if (period.status !== "DRAFT") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "INVALID_PERIOD_STATUS",
          message: `Period cannot be opened - current status is ${period.status}`,
          currentStatus: period.status,
        },
      });
    }

    // Check if there's already an OPEN period
    const existingOpenPeriod = await prisma.period.findFirst({
      where: {
        status: "OPEN",
        id: { not: periodId },
      },
    });

    if (existingOpenPeriod) {
      throw createError({
        statusCode: 409,
        statusMessage: "Conflict",
        data: {
          code: "PERIOD_ALREADY_OPEN",
          message: `Cannot open period - '${existingOpenPeriod.name}' is currently open. Close it first.`,
          openPeriodId: existingOpenPeriod.id,
          openPeriodName: existingOpenPeriod.name,
        },
      });
    }

    // Check if there are any locations
    if (period.period_locations.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "NO_LOCATIONS",
          message: "Period has no locations configured",
        },
      });
    }

    // Update period status to OPEN
    const updatedPeriod = await prisma.period.update({
      where: { id: periodId },
      data: {
        status: "OPEN",
      },
      include: {
        period_locations: {
          include: {
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
      period: updatedPeriod,
      message: "Period opened successfully. Prices are now locked.",
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error opening period:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to open period",
      },
    });
  }
});
