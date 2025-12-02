/**
 * POST /api/suppliers
 *
 * Create a new supplier
 *
 * Permissions:
 * - ADMIN only
 *
 * Request Body:
 * - code: Unique supplier code (required)
 * - name: Supplier name (required)
 * - contact: Contact information (optional)
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
const createSupplierSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  name: z.string().min(1).max(200),
  contact: z.string().optional(),
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
        message: "Only administrators can create suppliers",
      },
    });
  }

  try {
    // Parse and validate request body
    const body = await readBody(event);
    const data = createSupplierSchema.parse(body);

    // Create supplier in database
    const supplier = await prisma.supplier.create({
      data: {
        code: data.code,
        name: data.name,
        contact: data.contact,
        is_active: true,
      },
    });

    return {
      supplier,
      message: "Supplier created successfully",
    };
  } catch (error) {
    // Handle unique constraint violation (duplicate code)
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      throw createError({
        statusCode: 409,
        statusMessage: "Conflict",
        data: {
          code: "DUPLICATE_CODE",
          message: "A supplier with this code already exists",
        },
      });
    }

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

    console.error("Error creating supplier:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to create supplier",
      },
    });
  }
});
