/**
 * PATCH /api/period-locations/unready
 *
 * Mark a location as not ready (revert from READY to OPEN)
 *
 * Body:
 * - periodId: The period ID
 * - locationId: The location ID
 *
 * Permissions:
 * - SUPERVISOR or ADMIN
 *
 * Business Rules:
 * - Only READY locations can be reverted to OPEN
 * - Updates PeriodLocation status to OPEN
 * - Clears ready_at timestamp
 */

import prisma from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const user = event.context.user;

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

  // Check if user is SUPERVISOR or ADMIN
  if (user.role !== "SUPERVISOR" && user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Only supervisors or admins can change location readiness",
      },
    });
  }

  try {
    const body = await readBody(event);
    const periodId = body?.periodId;
    const locationId = body?.locationId;

    if (!periodId || !locationId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_PARAMETERS",
          message: "Period ID and Location ID are required in request body",
        },
      });
    }

    // Check that the PeriodLocation exists
    const periodLocation = await prisma.periodLocation.findUnique({
      where: {
        period_id_location_id: {
          period_id: periodId,
          location_id: locationId,
        },
      },
    });

    if (!periodLocation) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "PERIOD_LOCATION_NOT_FOUND",
          message: "Period location not found",
        },
      });
    }

    // Check that the location is in READY status
    if (periodLocation.status !== "READY") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "LOCATION_NOT_READY",
          message: "Location is not in READY status",
        },
      });
    }

    // Update PeriodLocation status to OPEN
    const updatedPeriodLocation = await prisma.periodLocation.update({
      where: {
        period_id_location_id: {
          period_id: periodId,
          location_id: locationId,
        },
      },
      data: {
        status: "OPEN",
        ready_at: null,
      },
      include: {
        location: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
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

    return {
      periodLocation: updatedPeriodLocation,
      message: "Location marked as not ready",
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error marking location as not ready:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to mark location as not ready",
      },
    });
  }
});
