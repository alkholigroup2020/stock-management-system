/**
 * GET /api/suppliers/:id
 *
 * Get a single supplier by ID
 *
 * Permissions:
 * - All authenticated users can view suppliers
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

    // Fetch supplier from database
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: {
        id: true,
        code: true,
        name: true,
        contact: true,
        is_active: true,
        created_at: true,
        _count: {
          select: {
            deliveries: true,
            purchase_orders: true,
          },
        },
      },
    });

    if (!supplier) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "SUPPLIER_NOT_FOUND",
          message: "Supplier not found",
        },
      });
    }

    return {
      supplier,
    };
  } catch (error) {
    // Re-throw if already a createError
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching supplier:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch supplier",
      },
    });
  }
});
