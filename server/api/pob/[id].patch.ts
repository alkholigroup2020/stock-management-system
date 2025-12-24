/**
 * PATCH /api/pob/:id
 *
 * Update a single POB (Personnel On Board) entry
 *
 * This endpoint handles:
 * - Updating crew count and/or extra count for a specific POB entry
 *
 * Business Rules:
 * - Period must still be OPEN for the location
 * - Crew count and extra count must be non-negative
 * - User must have POST or MANAGE access to the location
 *
 * Permissions:
 * - User must have POST or MANAGE access to the POB entry's location
 * - Supervisors and Admins can update any POB entry
 */

import prisma from "../../utils/prisma";
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
const bodySchema = z.object({
  crew_count: z.number().int().nonnegative().optional(),
  extra_count: z.number().int().nonnegative().optional(),
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
    // Get POB ID from route params
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_ID",
          message: "POB ID is required",
        },
      });
    }

    // Parse and validate request body
    const body = await readBody(event);
    const data = bodySchema.parse(body);

    // Check if at least one field is being updated
    if (data.crew_count === undefined && data.extra_count === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "NO_UPDATES",
          message: "At least one field (crew_count or extra_count) must be provided",
        },
      });
    }

    // Fetch existing POB entry
    const pobEntry = await prisma.pOB.findUnique({
      where: { id },
      include: {
        location: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!pobEntry) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "POB_NOT_FOUND",
          message: "POB entry not found",
        },
      });
    }

    // Check if user has access to the POB entry's location (Operators need explicit assignment)
    if (user.role === "OPERATOR") {
      const userLocation = await prisma.userLocation.findUnique({
        where: {
          user_id_location_id: {
            user_id: user.id,
            location_id: pobEntry.location_id,
          },
        },
      });

      if (!userLocation) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            code: "LOCATION_ACCESS_DENIED",
            message: "You do not have access to this POB entry",
          },
        });
      }
    }
    // Admins and Supervisors have implicit access to all locations

    // Check if period is still open for this location
    const periodLocation = await prisma.periodLocation.findUnique({
      where: {
        period_id_location_id: {
          period_id: pobEntry.period_id,
          location_id: pobEntry.location_id,
        },
      },
    });

    if (!periodLocation || periodLocation.status !== "OPEN") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "PERIOD_CLOSED",
          message: "Period is not open for this location. Cannot update POB entry.",
        },
      });
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      entered_by: user.id, // Update the user who last modified this entry
    };

    if (data.crew_count !== undefined) {
      updateData.crew_count = data.crew_count;
    }

    if (data.extra_count !== undefined) {
      updateData.extra_count = data.extra_count;
    }

    // Update POB entry
    const updatedPOB = await prisma.pOB.update({
      where: { id },
      data: updateData,
      include: {
        location: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        enterer: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
      },
    });

    return {
      message: "POB entry updated successfully",
      entry: {
        id: updatedPOB.id,
        location: updatedPOB.location,
        period: updatedPOB.period,
        date: updatedPOB.date,
        crew_count: updatedPOB.crew_count,
        extra_count: updatedPOB.extra_count,
        total_count: updatedPOB.crew_count + updatedPOB.extra_count,
        enterer: updatedPOB.enterer,
        entered_at: updatedPOB.entered_at,
        updated_at: updatedPOB.updated_at,
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

    console.error("Error updating POB entry:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to update POB entry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
