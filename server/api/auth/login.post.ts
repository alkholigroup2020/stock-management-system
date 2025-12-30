/**
 * Login API Route
 * POST /api/auth/login
 *
 * Authenticates user with email/username and password
 * Creates a session and returns user data
 */

import { z } from "zod";
import prisma from "../../utils/prisma";

// Validation schema for login request
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email or username is required")
    .transform((val) => val.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate request body
    const body = await readBody(event);
    const { email, password } = loginSchema.parse(body);

    // Query user from database (check both email and username)
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: email }],
        is_active: true,
      },
      include: {
        default_location: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
        user_locations: {
          select: {
            location_id: true,
          },
        },
      },
    });

    // If user not found or inactive
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        data: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email/username or password",
        },
      });
    }

    // Verify password
    const isPasswordValid = await verifyUserPassword(password, user.password_hash);

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        data: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email/username or password",
        },
      });
    }

    // Update last login timestamp (non-blocking - don't wait for response)
    prisma.user
      .update({
        where: { id: user.id },
        data: { last_login: new Date() },
      })
      .catch((err) => {
        console.error("Failed to update last_login:", err);
      });

    // Prepare user session data (exclude password_hash)
    const sessionUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      default_location_id: user.default_location_id,
      default_location: user.default_location,
      locations: user.user_locations.map((ul) => ul.location_id),
    };

    // Create session using nuxt-auth-utils
    await setUserSession(event, {
      user: sessionUser,
      loggedInAt: new Date().toISOString(),
    });

    // Return success response with user data
    return {
      success: true,
      message: "Login successful",
      user: sessionUser,
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
    console.error("Login error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "LOGIN_ERROR",
        message: "An error occurred during login",
      },
    });
  }
});
