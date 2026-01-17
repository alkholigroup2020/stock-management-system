/**
 * GET /api/ncrs/summary
 *
 * Get NCR summary for a specific period and location
 *
 * Query Parameters:
 * - periodId: string (required) - The period ID
 * - locationId: string (required) - The location ID
 *
 * Returns categorized NCR breakdown:
 * - credited: NCRs with CREDITED status
 * - losses: NCRs with REJECTED status or RESOLVED with LOSS impact
 * - pending: NCRs with SENT status
 * - open: NCRs with OPEN status
 *
 * Permissions:
 * - User must have access to the requested location
 * - Operators: Only assigned locations
 * - Supervisors/Admins: All locations
 */

import prisma from "~~/server/utils/prisma";
import { z } from "zod";
import { getAllNCRSummaryForPeriod } from "~~/server/utils/ncrCredits";
import type { UserRole } from "@prisma/client";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

// Query params schema
const querySchema = z.object({
  periodId: z.string().min(1, "Period ID is required"),
  locationId: z.string().min(1, "Location ID is required"),
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

  try {
    // Parse and validate query params
    const query = getQuery(event);
    const { periodId, locationId } = querySchema.parse(query);

    // Verify period exists
    const period = await prisma.period.findUnique({
      where: { id: periodId },
      select: {
        id: true,
        name: true,
        start_date: true,
        end_date: true,
        status: true,
      },
    });

    if (!period) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "PERIOD_NOT_FOUND",
          message: "Period not found",
        },
      });
    }

    // Verify location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
      },
    });

    if (!location) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "LOCATION_NOT_FOUND",
          message: "Location not found",
        },
      });
    }

    // Check if user has access to the requested location
    if (user.role === "OPERATOR") {
      const userLocation = await prisma.userLocation.findFirst({
        where: {
          user_id: user.id,
          location_id: locationId,
        },
      });

      if (!userLocation) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            code: "LOCATION_ACCESS_DENIED",
            message: "You do not have access to this location",
          },
        });
      }
    }
    // Supervisors and Admins have access to all locations

    // Get NCR summary for the period and location
    const summary = await getAllNCRSummaryForPeriod(periodId, locationId);

    return {
      period: {
        id: period.id,
        name: period.name,
        startDate: period.start_date,
        endDate: period.end_date,
        status: period.status,
      },
      location: {
        id: location.id,
        code: location.code,
        name: location.name,
        type: location.type,
      },
      summary: {
        credited: summary.credited,
        losses: summary.losses,
        pending: summary.pending,
        open: summary.open,
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
          message: "Invalid query parameters",
          details: error.issues,
        },
      });
    }

    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching NCR summary:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch NCR summary",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
