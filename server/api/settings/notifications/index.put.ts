/**
 * PUT /api/settings/notifications
 *
 * Update notification settings for NCR emails.
 *
 * Updates the configured Finance Team and Procurement Team email addresses.
 * Creates settings records if they don't exist (upsert pattern).
 *
 * Permissions:
 * - User must be authenticated
 * - User must be ADMIN role
 */

import prisma from "../../../utils/prisma";
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

// Request body schema
const updateSchema = z.object({
  finance_team_emails: z.array(z.string().email()).default([]),
  procurement_team_emails: z.array(z.string().email()).default([]),
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

  // Check user is ADMIN
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "ADMIN_REQUIRED",
        message: "Only administrators can modify notification settings",
      },
    });
  }

  try {
    // Parse and validate request body
    const body = await readBody(event);
    const data = updateSchema.parse(body);

    // Upsert both settings in a transaction
    const [financeSetting, procurementSetting] = await prisma.$transaction([
      prisma.notificationSetting.upsert({
        where: { key: "NCR_FINANCE_TEAM_EMAILS" },
        update: {
          emails: data.finance_team_emails,
          updated_by: user.id,
        },
        create: {
          key: "NCR_FINANCE_TEAM_EMAILS",
          emails: data.finance_team_emails,
          updated_by: user.id,
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
      }),
      prisma.notificationSetting.upsert({
        where: { key: "NCR_PROCUREMENT_TEAM_EMAILS" },
        update: {
          emails: data.procurement_team_emails,
          updated_by: user.id,
        },
        create: {
          key: "NCR_PROCUREMENT_TEAM_EMAILS",
          emails: data.procurement_team_emails,
          updated_by: user.id,
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
      }),
    ]);

    // Find the most recent update timestamp
    const updatedAt =
      financeSetting.updated_at > procurementSetting.updated_at
        ? financeSetting.updated_at
        : procurementSetting.updated_at;

    return {
      message: "Notification settings updated successfully",
      settings: {
        finance_team_emails: financeSetting.emails,
        procurement_team_emails: procurementSetting.emails,
        updated_at: updatedAt.toISOString(),
        updated_by: {
          id: user.id,
          username: user.username,
          full_name: financeSetting.updater.full_name,
        },
      },
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: error.issues,
        },
      });
    }

    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error updating notification settings:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to update notification settings",
      },
    });
  }
});
