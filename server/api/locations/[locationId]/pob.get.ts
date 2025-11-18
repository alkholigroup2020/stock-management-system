/**
 * GET /api/locations/:locationId/pob
 *
 * Fetch POB (Personnel On Board) entries for a location
 *
 * Query Parameters:
 * - periodId: Filter by period (defaults to current open period)
 * - startDate: Filter by date (from)
 * - endDate: Filter by date (to)
 *
 * Permissions:
 * - User must have access to the location
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

// Query schema for validation
const querySchema = z.object({
  periodId: z.string().uuid().optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
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
    const locationId = getRouterParam(event, "locationId");

    if (!locationId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_LOCATION_ID",
          message: "Location ID is required",
        },
      });
    }

    // Check if location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
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

    // Check user has access to location (unless Admin/Supervisor)
    if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
      const userLocation = await prisma.userLocation.findUnique({
        where: {
          user_id_location_id: {
            user_id: user.id,
            location_id: locationId,
          },
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

    // Parse and validate query parameters
    const query = await getQuery(event);
    const { periodId, startDate, endDate } = querySchema.parse(query);

    // Determine which period to use
    let targetPeriod;
    if (periodId) {
      targetPeriod = await prisma.period.findUnique({
        where: { id: periodId },
      });

      if (!targetPeriod) {
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
          data: {
            code: "PERIOD_NOT_FOUND",
            message: "Period not found",
          },
        });
      }
    } else {
      // Default to current open period
      targetPeriod = await prisma.period.findFirst({
        where: {
          status: "OPEN",
        },
      });

      if (!targetPeriod) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "NO_OPEN_PERIOD",
            message: "No open period found",
          },
        });
      }
    }

    // Build where clause for POB entries
    const where: Record<string, unknown> = {
      location_id: locationId,
      period_id: targetPeriod.id,
    };

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }
      where.date = dateFilter;
    }

    // Fetch POB entries
    const pobEntries = await prisma.pOB.findMany({
      where,
      include: {
        enterer: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Calculate total mandays for the period
    const totalCrewCount = pobEntries.reduce(
      (sum, entry) => sum + entry.crew_count,
      0
    );
    const totalExtraCount = pobEntries.reduce(
      (sum, entry) => sum + entry.extra_count,
      0
    );
    const totalMandays = totalCrewCount + totalExtraCount;

    return {
      location: {
        id: location.id,
        code: location.code,
        name: location.name,
      },
      period: {
        id: targetPeriod.id,
        name: targetPeriod.name,
        start_date: targetPeriod.start_date,
        end_date: targetPeriod.end_date,
        status: targetPeriod.status,
      },
      entries: pobEntries.map((entry) => ({
        id: entry.id,
        date: entry.date,
        crew_count: entry.crew_count,
        extra_count: entry.extra_count,
        total_count: entry.crew_count + entry.extra_count,
        enterer: entry.enterer,
        entered_at: entry.entered_at,
        updated_at: entry.updated_at,
      })),
      summary: {
        total_crew_count: totalCrewCount,
        total_extra_count: totalExtraCount,
        total_mandays: totalMandays,
        entries_count: pobEntries.length,
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

    console.error("Error fetching POB entries:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch POB entries",
      },
    });
  }
});
