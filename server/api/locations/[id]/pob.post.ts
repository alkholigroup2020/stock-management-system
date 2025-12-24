/**
 * POST /api/locations/:id/pob
 *
 * Create or update POB (Personnel On Board) entries for a location
 *
 * This endpoint handles:
 * - Creating new POB entries for specific dates
 * - Updating existing POB entries (upsert pattern)
 *
 * Business Rules:
 * - Period must be OPEN for the location
 * - Crew count and extra count must be non-negative integers
 * - One entry per location per day per period (upsert)
 *
 * Permissions:
 * - User must have POST or MANAGE access to the location
 * - Supervisors and Admins have implicit access
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
const entrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  crew_count: z.number().int().nonnegative("Crew count must be non-negative"),
  extra_count: z.number().int().nonnegative("Extra count must be non-negative"),
});

const bodySchema = z.object({
  entries: z.array(entrySchema).min(1, "At least one entry is required"),
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
    // Parse and validate request body
    const body = await readBody(event);
    const { entries } = bodySchema.parse(body);

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

    // Check user has access to location (Operators need explicit assignment)
    if (user.role === "OPERATOR") {
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
    // Admins and Supervisors have implicit access to all locations

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
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "NO_OPEN_PERIOD",
          message: "No open period found. Cannot create POB entries.",
        },
      });
    }

    // Check if period is open for this location
    const periodLocation = await prisma.periodLocation.findUnique({
      where: {
        period_id_location_id: {
          period_id: currentPeriod.id,
          location_id: locationId,
        },
      },
    });

    if (!periodLocation || periodLocation.status !== "OPEN") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "PERIOD_CLOSED",
          message: "Period is not open for this location. Cannot create/update POB entries.",
        },
      });
    }

    // Validate all dates are within the period
    const periodStart = currentPeriod.start_date;
    const periodEnd = currentPeriod.end_date;

    for (const entry of entries) {
      const entryDate = new Date(entry.date);
      if (entryDate < periodStart || entryDate > periodEnd) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "DATE_OUT_OF_PERIOD",
            message: `Date ${entry.date} is outside the current period (${currentPeriod.start_date.toISOString().split("T")[0]} to ${currentPeriod.end_date.toISOString().split("T")[0]})`,
          },
        });
      }
    }

    // Upsert POB entries
    const results = await Promise.all(
      entries.map(async (entry) => {
        const entryDate = new Date(entry.date);

        return prisma.pOB.upsert({
          where: {
            period_id_location_id_date: {
              period_id: currentPeriod.id,
              location_id: locationId,
              date: entryDate,
            },
          },
          create: {
            period_id: currentPeriod.id,
            location_id: locationId,
            date: entryDate,
            crew_count: entry.crew_count,
            extra_count: entry.extra_count,
            entered_by: user.id,
          },
          update: {
            crew_count: entry.crew_count,
            extra_count: entry.extra_count,
            entered_by: user.id,
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
        });
      })
    );

    // Get updated summary for all POB entries in this period/location
    const allPobEntries = await prisma.pOB.findMany({
      where: {
        location_id: locationId,
        period_id: currentPeriod.id,
      },
    });

    const summary = {
      total_crew_count: allPobEntries.reduce((sum, e) => sum + e.crew_count, 0),
      total_extra_count: allPobEntries.reduce((sum, e) => sum + e.extra_count, 0),
      total_mandays: allPobEntries.reduce((sum, e) => sum + e.crew_count + e.extra_count, 0),
      entries_count: allPobEntries.length,
    };

    // Transform results
    const savedEntries = results.map((entry) => ({
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

    return {
      message: `${results.length} POB ${results.length === 1 ? "entry" : "entries"} saved successfully`,
      entries: savedEntries,
      summary,
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

    console.error("Error saving POB entries:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to save POB entries",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
