/**
 * Register API Route
 * POST /api/auth/register
 *
 * Creates a new user account (Admin only)
 * Validates registration data, hashes password, and creates user in database
 */

import { z } from "zod";
import type { UserRole } from "@prisma/client";
import prisma from "../../utils/prisma";

// User session type
interface UserSession {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

// Validation schema for user registration
const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, hyphens, and underscores"
    )
    .transform((val) => val.toLowerCase().trim()),
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
    ),
  full_name: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name must not exceed 100 characters")
    .transform((val) => val.trim()),
  role: z.enum(["OPERATOR", "SUPERVISOR", "ADMIN", "PROCUREMENT_SPECIALIST"]),
  default_location_id: z.string().uuid("Invalid location ID").optional(),
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
          message: "You must be logged in to register users",
        },
      });
    }

    const user = session.user as UserSession;

    if (user.role !== "ADMIN") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Only administrators can register new users",
        },
      });
    }

    // Parse and validate request body
    const body = await readBody(event);
    const validatedData = registerSchema.parse(body);

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });

    if (existingUsername) {
      throw createError({
        statusCode: 409,
        statusMessage: "Conflict",
        data: {
          code: "USERNAME_EXISTS",
          message: "Username is already taken",
        },
      });
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingEmail) {
      throw createError({
        statusCode: 409,
        statusMessage: "Conflict",
        data: {
          code: "EMAIL_EXISTS",
          message: "Email is already registered",
        },
      });
    }

    // If default_location_id is provided, verify it exists
    if (validatedData.default_location_id) {
      const locationExists = await prisma.location.findUnique({
        where: {
          id: validatedData.default_location_id,
          is_active: true,
        },
      });

      if (!locationExists) {
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
          data: {
            code: "LOCATION_NOT_FOUND",
            message: "Default location not found or inactive",
          },
        });
      }
    }

    // Hash the password
    const password_hash = await hashUserPassword(validatedData.password);

    // Create user in database with automatic location access
    const newUser = await prisma.$transaction(async (tx) => {
      // Create user in database
      const createdUser = await tx.user.create({
        data: {
          username: validatedData.username,
          email: validatedData.email,
          password_hash,
          full_name: validatedData.full_name,
          role: validatedData.role as UserRole,
          default_location_id: validatedData.default_location_id || null,
          is_active: true,
        },
        select: {
          id: true,
          username: true,
          email: true,
          full_name: true,
          role: true,
          default_location_id: true,
          is_active: true,
          created_at: true,
        },
      });

      // Auto-create UserLocation for Operators and Procurement Specialists if default location is assigned
      // Supervisors and Admins have implicit access to all locations
      if (
        validatedData.default_location_id &&
        (validatedData.role === "OPERATOR" || validatedData.role === "PROCUREMENT_SPECIALIST")
      ) {
        await tx.userLocation.create({
          data: {
            user_id: createdUser.id,
            location_id: validatedData.default_location_id,
            assigned_at: new Date(),
            assigned_by: user.id, // Admin who created the user
          },
        });
      }

      return createdUser;
    });

    // Return success response with created user (password excluded)
    return {
      success: true,
      message: "User registered successfully",
      user: newUser,
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
    console.error("Registration error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "REGISTRATION_ERROR",
        message: "An error occurred during user registration",
      },
    });
  }
});
