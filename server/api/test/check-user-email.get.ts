/**
 * GET /api/test/check-user-email?userId=xxx
 *
 * Check if a user has an email address configured (ADMIN only)
 * Useful for debugging email notification issues
 */

import prisma from "../../utils/prisma";
import type { UserRole } from "@prisma/client";

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

export default defineEventHandler(async (event) => {
  const user = event.context.user as AuthUser | undefined;

  // Only allow ADMIN users to access this endpoint
  if (!user || user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "ADMIN_ONLY",
        message: "Only admins can check user email addresses",
      },
    });
  }

  const query = getQuery(event);
  const userId = query.userId as string | undefined;

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        code: "MISSING_USER_ID",
        message: "userId query parameter is required",
      },
    });
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
      },
    });

    if (!targetUser) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    const hasEmail = !!targetUser.email && targetUser.email.trim().length > 0;
    const emailMasked = targetUser.email
      ? `${targetUser.email.substring(0, 3)}***@${targetUser.email.split("@")[1] || ""}`
      : "NOT SET";

    return {
      user: {
        id: targetUser.id,
        username: targetUser.username,
        full_name: targetUser.full_name,
        role: targetUser.role,
        is_active: targetUser.is_active,
      },
      email_status: {
        has_email: hasEmail,
        email_masked: emailMasked,
        can_receive_notifications: hasEmail && targetUser.is_active,
      },
      warning: !hasEmail
        ? "This user has no email address configured and cannot receive email notifications"
        : null,
      recommendation: !hasEmail
        ? "Update the user profile to add an email address"
        : "User can receive email notifications",
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error checking user email:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to check user email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
