/**
 * Update User API Route
 * PATCH /api/users/[id]
 *
 * Updates user information (Admin only)
 */

import { z } from "zod";
import type { UserRole } from "@prisma/client";
import prisma from "../../../utils/prisma";

// User session type
interface UserSession {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

// Validation schema for user update
const updateUserSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase().trim())
    .optional(),
  full_name: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name must not exceed 100 characters")
    .transform((val) => val.trim())
    .optional(),
  role: z.enum(["OPERATOR", "SUPERVISOR", "ADMIN"]).optional(),
  is_active: z.boolean().optional(),
  default_location_id: z.string().uuid("Invalid location ID").nullable().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
    )
    .optional(),
});

export default defineEventHandler(async (event) => {
  try {
    // Check if user is authenticated and is admin
    const session = await getUserSession(event);

    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        data: {
          code: "NOT_AUTHENTICATED",
          message: "You must be logged in to update users",
        },
      });
    }

    const currentUser = session.user as UserSession;

    if (currentUser.role !== "ADMIN") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Only administrators can update users",
        },
      });
    }

    // Get user ID from route params
    const userId = getRouterParam(event, "id");

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_USER_ID",
          message: "User ID is required",
        },
      });
    }

    // Parse and validate request body
    const body = await readBody(event);
    const validatedData = updateUserSchema.parse(body);

    // OPTIMIZATION: Batch all validation queries into a single parallel fetch
    const [existingUser, emailCheck, locationCheck] = await Promise.all([
      // Check if user exists
      prisma.user.findUnique({
        where: { id: userId },
      }),
      // If email is being updated, check if it's already taken
      validatedData.email
        ? prisma.user.findUnique({
            where: { email: validatedData.email },
            select: { id: true, email: true },
          })
        : Promise.resolve(null),
      // If default_location_id is provided, verify it exists
      validatedData.default_location_id
        ? prisma.location.findUnique({
            where: {
              id: validatedData.default_location_id,
              is_active: true,
            },
            select: { id: true },
          })
        : Promise.resolve({ id: "skip" }), // Non-null placeholder for "not checking"
    ]);

    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    // Check email uniqueness (only if email changed)
    if (validatedData.email && validatedData.email !== existingUser.email && emailCheck) {
      throw createError({
        statusCode: 409,
        statusMessage: "Conflict",
        data: {
          code: "EMAIL_EXISTS",
          message: "Email is already registered",
        },
      });
    }

    // Check location exists (only if location was provided)
    if (validatedData.default_location_id && !locationCheck) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "LOCATION_NOT_FOUND",
          message: "Default location not found or inactive",
        },
      });
    }

    // Prepare update data
    const updateData: any = {};

    if (validatedData.email) updateData.email = validatedData.email;
    if (validatedData.full_name) updateData.full_name = validatedData.full_name;
    if (validatedData.role) updateData.role = validatedData.role as UserRole;
    if (validatedData.is_active !== undefined) updateData.is_active = validatedData.is_active;
    if (validatedData.default_location_id !== undefined) {
      updateData.default_location_id = validatedData.default_location_id;
    }

    // Hash password if provided
    if (validatedData.password) {
      updateData.password_hash = await hashUserPassword(validatedData.password);
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        default_location_id: true,
      },
    });

    return {
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Validation Error",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          errors: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    // Re-throw H3 errors (already formatted)
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Handle unexpected errors
    console.error("Update user error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "UPDATE_USER_ERROR",
        message: "An error occurred while updating user",
      },
    });
  }
});
