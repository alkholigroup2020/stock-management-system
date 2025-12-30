/**
 * PATCH /api/items/:itemId/price
 *
 * Update single item price for the current open period
 *
 * Body:
 * - price: The new price value
 * - period_id: Optional - specify period (defaults to current open period)
 *
 * Permissions:
 * - ADMIN only
 *
 * Business Rules:
 * - Period must not be CLOSED
 * - Price must be positive
 * - Updates existing price or creates new one
 */

import prisma from "../../../utils/prisma";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

// Request body schema
const updatePriceSchema = z.object({
  price: z.number().positive(),
  period_id: z.string().uuid().optional(),
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
        message: "Only admins can update item prices",
      },
    });
  }

  try {
    const itemId = getRouterParam(event, "itemId");

    if (!itemId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_ITEM_ID",
          message: "Item ID is required",
        },
      });
    }

    // Parse and validate request body
    const body = await readBody(event);
    const { price, period_id } = updatePriceSchema.parse(body);

    // OPTIMIZATION: Batch item and period queries into parallel fetch
    const [item, period] = await Promise.all([
      // Check if item exists
      prisma.item.findUnique({
        where: { id: itemId },
      }),
      // Get period (use provided or find current open period)
      period_id
        ? prisma.period.findUnique({
            where: { id: period_id },
          })
        : prisma.period.findFirst({
            where: { status: "OPEN" },
            orderBy: { start_date: "desc" },
          }),
    ]);

    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "ITEM_NOT_FOUND",
          message: "Item not found",
        },
      });
    }

    if (!item.is_active) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "ITEM_INACTIVE",
          message: "Cannot set price for inactive item",
        },
      });
    }

    if (!period) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "NO_OPEN_PERIOD",
          message: period_id
            ? "Period not found"
            : "No open period found. Please create and open a period first.",
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

    // Upsert the item price
    const itemPrice = await prisma.itemPrice.upsert({
      where: {
        item_id_period_id: {
          item_id: itemId,
          period_id: period.id,
        },
      },
      update: {
        price: new Decimal(price),
        set_by: user.id,
        set_at: new Date(),
      },
      create: {
        item_id: itemId,
        period_id: period.id,
        price: new Decimal(price),
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
            category: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return {
      message: "Item price updated successfully",
      item_price: itemPrice,
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

    console.error("Error updating item price:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to update item price",
      },
    });
  }
});
