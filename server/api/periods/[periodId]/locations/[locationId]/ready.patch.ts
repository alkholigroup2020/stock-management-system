/**
 * PATCH /api/periods/:periodId/locations/:locationId/ready
 *
 * Mark a location as ready for period close
 *
 * Permissions:
 * - SUPERVISOR or ADMIN
 *
 * Business Rules:
 * - Reconciliation must be completed for the location before marking as ready
 * - Updates PeriodLocation status to READY
 * - Records ready_at timestamp
 */

import prisma from "../../../../../utils/prisma";

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
        message: "Only supervisors or admins can mark locations as ready",
      },
    });
  }

  try {
    const periodId = getRouterParam(event, "periodId");
    const locationId = getRouterParam(event, "locationId");

    if (!periodId || !locationId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_PARAMETERS",
          message: "Period ID and Location ID are required",
        },
      });
    }

    // Check that the period exists
    const period = await prisma.period.findUnique({
      where: { id: periodId },
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

    // Check that the location exists
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

    // Check that reconciliation has been completed for this period-location
    const reconciliation = await prisma.reconciliation.findUnique({
      where: {
        period_id_location_id: {
          period_id: periodId,
          location_id: locationId,
        },
      },
    });

    if (!reconciliation) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "RECONCILIATION_NOT_COMPLETED",
          message:
            "Reconciliation must be completed before marking location as ready",
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

    // Check that the location is not already closed
    if (periodLocation.status === "CLOSED") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "LOCATION_ALREADY_CLOSED",
          message: "Location is already closed for this period",
        },
      });
    }

    // Update PeriodLocation status to READY
    const updatedPeriodLocation = await prisma.periodLocation.update({
      where: {
        period_id_location_id: {
          period_id: periodId,
          location_id: locationId,
        },
      },
      data: {
        status: "READY",
        ready_at: new Date(),
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
      message: "Location marked as ready for period close",
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error marking location as ready:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to mark location as ready",
      },
    });
  }
});
