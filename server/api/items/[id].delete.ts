/**
 * DELETE /api/items/:id
 *
 * Soft delete an item (set is_active = false)
 *
 * Note: Items with transaction history cannot be deleted,
 * they can only be deactivated.
 *
 * Permissions:
 * - ADMIN only
 */

import prisma from "../../utils/prisma";

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
        message: "Only admins can delete items",
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
          message: "Item ID is required",
        },
      });
    }

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            delivery_lines: true,
            issue_lines: true,
            transfer_lines: true,
          },
        },
      },
    });

    if (!existingItem) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "ITEM_NOT_FOUND",
          message: "Item not found",
        },
      });
    }

    // Check if item has transaction history
    const hasTransactions =
      existingItem._count.delivery_lines > 0 ||
      existingItem._count.issue_lines > 0 ||
      existingItem._count.transfer_lines > 0;

    if (hasTransactions) {
      // Item has history, can only be deactivated
      const item = await prisma.item.update({
        where: { id },
        data: { is_active: false },
      });

      return {
        item,
        message: "Item deactivated successfully (has transaction history)",
        deactivated: true,
      };
    }

    // Item has no history, perform soft delete by setting is_active to false
    const item = await prisma.item.update({
      where: { id },
      data: { is_active: false },
    });

    return {
      item,
      message: "Item deleted successfully",
      deactivated: true,
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error deleting item:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete item",
      },
    });
  }
});
