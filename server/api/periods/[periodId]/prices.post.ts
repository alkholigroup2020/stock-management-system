/**
 * POST /api/periods/:periodId/prices
 *
 * Bulk create or update item prices for a period
 *
 * Body:
 * - prices: Array of { item_id, price }
 *
 * Permissions:
 * - ADMIN only
 *
 * Business Rules:
 * - Period must not be CLOSED
 * - Prices must be positive
 * - Creates new price records or updates existing ones
 */

import prisma from "../../../utils/prisma";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

// Price item schema
const priceItemSchema = z.object({
  item_id: z.string().uuid(),
  price: z.number().positive(),
});

// Request body schema
const bulkPriceSchema = z.object({
  prices: z.array(priceItemSchema).min(1),
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
        message: "Only admins can set item prices",
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

    if (period.status === "CLOSED") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "PERIOD_CLOSED",
          message: "Cannot set prices for a closed period",
        },
      });
    }

    // Parse and validate request body
    const body = await readBody(event);
    const { prices } = bulkPriceSchema.parse(body);

    // Verify all items exist
    const itemIds = prices.map((p) => p.item_id);
    const items = await prisma.item.findMany({
      where: {
        id: { in: itemIds },
        is_active: true,
      },
    });

    if (items.length !== itemIds.length) {
      const foundIds = items.map((item) => item.id);
      const missingIds = itemIds.filter((id) => !foundIds.includes(id));
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "INVALID_ITEMS",
          message: "Some items do not exist or are inactive",
          details: { missing_item_ids: missingIds },
        },
      });
    }

    // Use transaction to create/update all prices
    const results = await prisma.$transaction(
      prices.map((priceData) =>
        prisma.itemPrice.upsert({
          where: {
            item_id_period_id: {
              item_id: priceData.item_id,
              period_id: periodId,
            },
          },
          update: {
            price: new Decimal(priceData.price),
            set_by: user.id,
            set_at: new Date(),
          },
          create: {
            item_id: priceData.item_id,
            period_id: periodId,
            price: new Decimal(priceData.price),
            currency: "SAR",
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
      message: `Successfully updated ${results.length} item prices`,
      updated_count: results.length,
      prices: results,
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid price data",
          details: error.issues,
        },
      });
    }

    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error updating period prices:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to update period prices",
      },
    });
  }
});
