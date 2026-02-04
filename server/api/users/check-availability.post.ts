/**
 * Check User Availability API Route
 * POST /api/users/check-availability
 *
 * Checks if a username or email is already registered.
 * Returns 200 if available, 409 with error code if taken.
 * Used for real-time validation in user creation form.
 */

import { z } from "zod";
import prisma from "../../utils/prisma";

const checkSchema = z
  .object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
  })
  .refine((data) => data.username || data.email, {
    message: "Either username or email must be provided",
  });

export default defineEventHandler(async (event) => {
  try {
    // Check if user is authenticated
    const session = await getUserSession(event);

    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        data: {
          code: "NOT_AUTHENTICATED",
          message: "You must be logged in",
        },
      });
    }

    // Parse and validate request body
    const body = await readBody(event);
    const validated = checkSchema.parse(body);

    // Check username availability
    if (validated.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: validated.username.toLowerCase() },
      });

      if (existingUser) {
        throw createError({
          statusCode: 409,
          statusMessage: "Conflict",
          data: {
            code: "USERNAME_EXISTS",
            message: "Username is already taken",
          },
        });
      }
    }

    // Check email availability
    if (validated.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validated.email.toLowerCase() },
      });

      if (existingUser) {
        throw createError({
          statusCode: 409,
          statusMessage: "Conflict",
          data: {
            code: "EMAIL_EXISTS",
            message: "Email is already registered",
          },
        });
      }
    }

    return { available: true };
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
    console.error("Availability check error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "SERVER_ERROR",
        message: "An error occurred while checking availability",
      },
    });
  }
});
