/**
 * GET /api/settings/notifications
 *
 * Retrieve current notification settings for NCR emails.
 *
 * Returns the configured Finance Team and Procurement Team email addresses
 * along with information about who last updated the settings.
 *
 * Permissions:
 * - User must be authenticated
 * - User must be ADMIN role
 */

import prisma from "../../../utils/prisma";
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

  // Check user is ADMIN
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "ADMIN_REQUIRED",
        message: "Only administrators can access notification settings",
      },
    });
  }

  try {
    // Fetch notification settings
    const settings = await prisma.notificationSetting.findMany({
      where: {
        key: { in: ["NCR_FINANCE_TEAM_EMAILS", "NCR_PROCUREMENT_TEAM_EMAILS"] },
      },
      include: {
        updater: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
      },
    });

    // Find specific settings
    const financeSetting = settings.find((s) => s.key === "NCR_FINANCE_TEAM_EMAILS");
    const procurementSetting = settings.find((s) => s.key === "NCR_PROCUREMENT_TEAM_EMAILS");

    // Determine the most recent update
    let updatedAt: Date | null = null;
    let updatedBy: { id: string; username: string; full_name: string | null } | null = null;

    for (const setting of settings) {
      if (!updatedAt || setting.updated_at > updatedAt) {
        updatedAt = setting.updated_at;
        updatedBy = setting.updater;
      }
    }

    return {
      finance_team_emails: financeSetting?.emails || [],
      procurement_team_emails: procurementSetting?.emails || [],
      updated_at: updatedAt?.toISOString() || null,
      updated_by: updatedBy,
    };
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch notification settings",
      },
    });
  }
});
