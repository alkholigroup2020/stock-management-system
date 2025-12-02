/**
 * PATCH /api/suppliers/:id
 *
 * Update an existing supplier
 *
 * Permissions:
 * - ADMIN only
 *
 * Request Body (all fields optional):
 * - name: Supplier name
 * - contact: Contact information
 * - is_active: Active status
 */

import prisma from "../../utils/prisma";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

// Request body schema for validation
const updateSupplierSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  contact: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

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
        message: "Only administrators can update suppliers",
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

    // Parse and validate request body
    const body = await readBody(event);
    const data = updateSupplierSchema.parse(body);

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true },
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

    // Update supplier in database
    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.contact !== undefined && { contact: data.contact }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
      },
    });

    return {
      supplier,
      message: "Supplier updated successfully",
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid supplier data",
          details: error.issues,
        },
      });
    }

    // Re-throw if already a createError
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error updating supplier:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to update supplier",
      },
    });
  }
});
