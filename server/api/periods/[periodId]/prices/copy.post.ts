/**
 * POST /api/periods/:periodId/prices/copy
 *
 * Copy all item prices from the most recent previous period
 *
 * Permissions:
 * - ADMIN only
 *
 * Business Rules:
 * - Period must not be CLOSED
 * - Finds the most recent closed period before the target period
 * - Copies all item prices from that period
 * - Overwrites existing prices if any
 */

import prisma from "../../../../utils/prisma";
import { Decimal } from "@prisma/client/runtime/library";

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
        message: "Only admins can copy item prices",
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

    // Check if period exists and is not closed
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

    if (period.status !== "DRAFT") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "PERIOD_LOCKED",
          message: "Cannot copy prices to a period that is not in DRAFT status",
        },
      });
    }

    // Find the most recent closed period before this period
    const previousPeriod = await prisma.period.findFirst({
      where: {
        end_date: {
          lt: period.start_date,
        },
        status: "CLOSED",
      },
      orderBy: {
        end_date: "desc",
      },
      include: {
        item_prices: {
          include: {
            item: {
              select: {
                id: true,
                code: true,
                name: true,
                unit: true,
                is_active: true,
              },
            },
          },
        },
      },
    });

    if (!previousPeriod) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "NO_PREVIOUS_PERIOD",
          message: "No previous closed period found to copy prices from",
        },
      });
    }

    if (previousPeriod.item_prices.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "NO_PRICES_FOUND",
          message: "Previous period has no item prices to copy",
        },
      });
    }

    // Filter only active items
    const activePrices = previousPeriod.item_prices.filter(
      (price) => price.item.is_active
    );

    if (activePrices.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "NO_ACTIVE_PRICES",
          message: "No active item prices found in previous period",
        },
      });
    }

    // Use transaction to copy all prices
    const results = await prisma.$transaction(
      activePrices.map((priceData) =>
        prisma.itemPrice.upsert({
          where: {
            item_id_period_id: {
              item_id: priceData.item_id,
              period_id: periodId,
            },
          },
          update: {
            price: priceData.price,
            set_by: user.id,
            set_at: new Date(),
          },
          create: {
            item_id: priceData.item_id,
            period_id: periodId,
            price: priceData.price,
            currency: priceData.currency,
            set_by: user.id,
          },
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
        })
      )
    );

    return {
      message: `Successfully copied ${results.length} item prices from ${previousPeriod.name}`,
      source_period: {
        id: previousPeriod.id,
        name: previousPeriod.name,
        start_date: previousPeriod.start_date,
        end_date: previousPeriod.end_date,
      },
      copied_count: results.length,
      prices: results,
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error copying period prices:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to copy period prices",
      },
    });
  }
});
