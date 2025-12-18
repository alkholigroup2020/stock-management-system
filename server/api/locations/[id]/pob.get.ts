/**
 * GET /api/locations/:id/pob
 *
 * Fetch POB (Personnel On Board) data for a location
 *
 * This endpoint returns:
 * - Location and period information
 * - All POB entries for the current period
 * - Summary totals (total crew, extra, mandays)
 *
 * Business Rules:
 * - Returns entries for the current open period
 * - User must have access to the location
 *
 * Permissions:
 * - User must have VIEW, POST, or MANAGE access to the location
 * - Supervisors and Admins have implicit access
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

  // Get location ID from route params
  const locationId = getRouterParam(event, "id");

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

  try {
    // Check if location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        code: true,
        name: true,
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

    // Check user has access to location
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

    // Get current open period
    const currentPeriod = await prisma.period.findFirst({
      where: {
        status: "OPEN",
      },
      orderBy: {
        start_date: "desc",
      },
      select: {
        id: true,
        name: true,
        start_date: true,
        end_date: true,
        status: true,
      },
    });

    if (!currentPeriod) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "NO_OPEN_PERIOD",
          message: "No open period found",
        },
      });
    }

    // Get POB entries for this location and period
    const pobEntries = await prisma.pOB.findMany({
      where: {
        location_id: locationId,
        period_id: currentPeriod.id,
      },
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

    // Transform entries
    const entries = pobEntries.map((entry) => ({
      id: entry.id,
      date: entry.date.toISOString().split("T")[0],
      crew_count: entry.crew_count,
      extra_count: entry.extra_count,
      total_count: entry.crew_count + entry.extra_count,
      enterer: entry.enterer
        ? {
            id: entry.enterer.id,
            username: entry.enterer.username,
            full_name: entry.enterer.full_name,
          }
        : null,
      entered_at: entry.entered_at,
      updated_at: entry.updated_at,
    }));

    // Calculate summary
    const summary = {
      total_crew_count: pobEntries.reduce((sum, e) => sum + e.crew_count, 0),
      total_extra_count: pobEntries.reduce((sum, e) => sum + e.extra_count, 0),
      total_mandays: pobEntries.reduce((sum, e) => sum + e.crew_count + e.extra_count, 0),
      entries_count: pobEntries.length,
    };

    return {
      location: {
        id: location.id,
        code: location.code,
        name: location.name,
      },
      period: {
        id: currentPeriod.id,
        name: currentPeriod.name,
        start_date: currentPeriod.start_date.toISOString().split("T")[0],
        end_date: currentPeriod.end_date.toISOString().split("T")[0],
        status: currentPeriod.status,
      },
      entries,
      summary,
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching POB data:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch POB data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
