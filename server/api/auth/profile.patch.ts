/**
 * Profile Update API Route
 * PATCH /api/auth/profile
 *
 * Allows authenticated users to update their own profile
 * Only full_name can be updated by the user
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

// Validation schema for profile update request
const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name must not exceed 100 characters")
    .transform((val) => val.trim()),
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
          message: "You must be logged in to update your profile",
        },
      });
    }

    // Parse and validate request body
    const body = await readBody(event);
    const validatedData = updateProfileSchema.parse(body);

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: { full_name: validatedData.full_name },
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

    // Prepare updated session user data
    const updatedSessionUser = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      full_name: updatedUser.full_name,
      role: updatedUser.role,
      default_location_id: updatedUser.default_location_id,
      default_location: updatedUser.default_location,
      locations: updatedUser.user_locations.map((ul) => ul.location_id),
    };

    // Get current session for loggedInAt value
    const currentSession = await getUserSession(event);

    // Update session with new data
    await setUserSession(event, {
      user: updatedSessionUser,
      loggedInAt: currentSession?.loggedInAt || new Date().toISOString(),
    });

    return {
      success: true,
      message: "Profile updated successfully",
      user: updatedSessionUser,
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
    console.error("Profile update error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "PROFILE_UPDATE_ERROR",
        message: "An error occurred while updating profile",
      },
    });
  }
});
