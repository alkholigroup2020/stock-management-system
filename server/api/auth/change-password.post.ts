/**
 * Change Password API Route
 * POST /api/auth/change-password
 *
 * Allows authenticated users to change their password
 * Requires current password verification
 */

import { z } from "zod";
import type { UserRole } from "@prisma/client";

// AuthUser interface matching the session user
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

// Validation schema for password change request
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default defineEventHandler(async (event) => {
  try {
    // Get user from context (set by auth middleware)
    const authUser = event.context.user as AuthUser | undefined;

    if (!authUser) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        data: {
          code: "NOT_AUTHENTICATED",
          message: "You must be logged in to change your password",
        },
      });
    }

    // Parse and validate request body
    const body = await readBody(event);
    const validatedData = changePasswordSchema.parse(body);

    // Get user from database to verify current password
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        password_hash: true,
      },
    });

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "USER_NOT_FOUND",
          message: "User account not found",
        },
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyUserPassword(
      validatedData.currentPassword,
      user.password_hash
    );

    if (!isCurrentPasswordValid) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "INVALID_CURRENT_PASSWORD",
          message: "Current password is incorrect",
        },
      });
    }

    // Check if new password is the same as current password
    const isSamePassword = await verifyUserPassword(validatedData.newPassword, user.password_hash);

    if (isSamePassword) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "SAME_PASSWORD",
          message: "New password must be different from current password",
        },
      });
    }

    // Validate password strength
    const strengthResult = validatePasswordStrength(validatedData.newPassword);
    if (!strengthResult.valid) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "WEAK_PASSWORD",
          message: "Password does not meet strength requirements",
          errors: strengthResult.errors,
        },
      });
    }

    // Hash the new password
    const newPasswordHash = await hashUserPassword(validatedData.newPassword);

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: newPasswordHash },
    });

    return {
      success: true,
      message: "Password changed successfully",
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
    console.error("Change password error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "PASSWORD_CHANGE_ERROR",
        message: "An error occurred while changing password",
      },
    });
  }
});
