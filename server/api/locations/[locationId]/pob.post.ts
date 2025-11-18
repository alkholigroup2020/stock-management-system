/**
 * POST /api/locations/:locationId/pob
 *
 * Bulk create or update POB (Personnel On Board) entries for a location
 *
 * This endpoint handles:
 * - Creating new POB entries for dates
 * - Updating existing POB entries
 * - Bulk operations for multiple dates
 *
 * Business Rules:
 * - Period must be OPEN for the location
 * - Crew count and extra count must be non-negative
 * - One entry per location per day per period (enforced by unique constraint)
 *
 * Permissions:
 * - User must have POST or MANAGE access to the location
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

// POB entry schema
const pobEntrySchema = z.object({
  date: z.string(), // ISO date string
  crew_count: z.number().int().nonnegative(),
  extra_count: z.number().int().nonnegative(),
});

// Request body schema
const bodySchema = z.object({
  period_id: z.string().uuid().optional(), // Optional, defaults to current open period
  entries: z.array(pobEntrySchema).min(1),
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

    // Parse and validate request body
    const body = await readBody(event);
    const data = bodySchema.parse(body);

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

    // Check user has POST or MANAGE access to location
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

      if (userLocation.access_level === "VIEW") {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: "You do not have permission to post POB entries at this location",
          },
        });
      }
    }

    // Determine which period to use
    let targetPeriod;
    if (data.period_id) {
      targetPeriod = await prisma.period.findUnique({
        where: { id: data.period_id },
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

    // Check if period is open for this location
    const periodLocation = await prisma.periodLocation.findUnique({
      where: {
        period_id_location_id: {
          period_id: targetPeriod.id,
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
          message: "Period is not open for this location",
        },
      });
    }

    // Validate dates are within period range
    const periodStart = new Date(targetPeriod.start_date);
    const periodEnd = new Date(targetPeriod.end_date);

    for (const entry of data.entries) {
      const entryDate = new Date(entry.date);
      if (entryDate < periodStart || entryDate > periodEnd) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "DATE_OUT_OF_RANGE",
            message: `Date ${entry.date} is outside period range (${targetPeriod.start_date} to ${targetPeriod.end_date})`,
          },
        });
      }
    }

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      const upsertedEntries = [];

      for (const entryData of data.entries) {
        const pobEntry = await tx.pOB.upsert({
          where: {
            period_id_location_id_date: {
              period_id: targetPeriod.id,
              location_id: locationId,
              date: new Date(entryData.date),
            },
          },
          create: {
            period_id: targetPeriod.id,
            location_id: locationId,
            date: new Date(entryData.date),
            crew_count: entryData.crew_count,
            extra_count: entryData.extra_count,
            entered_by: user.id,
          },
          update: {
            crew_count: entryData.crew_count,
            extra_count: entryData.extra_count,
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

        upsertedEntries.push(pobEntry);
      }

      return upsertedEntries;
    });

    // Calculate totals
    const totalCrewCount = result.reduce((sum, entry) => sum + entry.crew_count, 0);
    const totalExtraCount = result.reduce((sum, entry) => sum + entry.extra_count, 0);
    const totalMandays = totalCrewCount + totalExtraCount;

    return {
      message: "POB entries saved successfully",
      location: {
        id: location.id,
        code: location.code,
        name: location.name,
      },
      period: {
        id: targetPeriod.id,
        name: targetPeriod.name,
      },
      entries: result.map((entry) => ({
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
        entries_count: result.length,
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
