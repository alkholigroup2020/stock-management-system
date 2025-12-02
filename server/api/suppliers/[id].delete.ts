/**
 * DELETE /api/suppliers/:id
 *
 * Delete (soft-delete) a supplier by setting is_active to false
 *
 * Permissions:
 * - ADMIN only
 *
 * Note: This is a soft delete - the supplier is deactivated, not removed.
 * Suppliers with existing deliveries cannot be permanently deleted.
 */

import prisma from "../../utils/prisma";
import type { UserRole } from "@prisma/client";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

export default defineEventHandler(async (event) => {
  const user = event.context.user as AuthUser | undefined;

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
        message: "Only administrators can delete suppliers",
      },
    });
  }

  try {
    // Get supplier ID from route params
    const supplierId = getRouterParam(event, "id");

    if (!supplierId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_PARAMETER",
          message: "Supplier ID is required",
        },
      });
    }

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: {
        id: true,
        _count: {
          select: {
            deliveries: true,
            purchase_orders: true,
          },
        },
      },
    });

    if (!existingSupplier) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "SUPPLIER_NOT_FOUND",
          message: "Supplier not found",
        },
      });
    }

    // Check if supplier has related records
    const hasRelatedRecords =
      existingSupplier._count.deliveries > 0 || existingSupplier._count.purchase_orders > 0;

    if (hasRelatedRecords) {
      // Soft delete - deactivate the supplier
      await prisma.supplier.update({
        where: { id: supplierId },
        data: { is_active: false },
      });

      return {
        message: "Supplier deactivated successfully (has related records)",
        deactivated: true,
      };
    }

    // Hard delete - no related records
    await prisma.supplier.delete({
      where: { id: supplierId },
    });

    return {
      message: "Supplier deleted successfully",
      deleted: true,
    };
  } catch (error) {
    // Re-throw if already a createError
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error deleting supplier:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete supplier",
      },
    });
  }
});
