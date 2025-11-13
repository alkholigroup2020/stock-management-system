/**
 * POST /api/items
 *
 * Create a new item
 *
 * Body:
 * - code: Unique item code (uppercase)
 * - name: Item name
 * - unit: Unit of measure (KG, EA, LTR, BOX, CASE, PACK)
 * - category: Optional category
 * - sub_category: Optional sub-category
 *
 * Permissions:
 * - ADMIN only
 */

import prisma from "../../utils/prisma";
import { z } from "zod";

// Request body schema
const itemSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(50)
    .transform((val) => val.toUpperCase()),
  name: z.string().min(1).max(200),
  unit: z.enum(["KG", "EA", "LTR", "BOX", "CASE", "PACK"]),
  category: z.string().max(50).optional(),
  sub_category: z.string().max(50).optional(),
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
        message: "Only admins can create items",
      },
    });
  }

  try {
    // Parse and validate request body
    const body = await readBody(event);
    const data = itemSchema.parse(body);

    // Check if item code already exists
    const existingItem = await prisma.item.findUnique({
      where: { code: data.code },
    });

    if (existingItem) {
      throw createError({
        statusCode: 409,
        statusMessage: "Conflict",
        data: {
          code: "DUPLICATE_CODE",
          message: `Item with code '${data.code}' already exists`,
        },
      });
    }

    // Create the item
    const item = await prisma.item.create({
      data: {
        code: data.code,
        name: data.name,
        unit: data.unit,
        category: data.category || null,
        sub_category: data.sub_category || null,
        is_active: true,
      },
    });

    return {
      item,
      message: "Item created successfully",
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid item data",
          details: error.issues,
        },
      });
    }

    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error creating item:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to create item",
      },
    });
  }
});
