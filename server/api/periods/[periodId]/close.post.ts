/**
 * POST /api/periods/:periodId/close
 *
 * Request period close - creates an approval request
 *
 * Permissions:
 * - ADMIN only
 *
 * Business Rules:
 * - All locations must be READY for this period
 * - Period must be OPEN (not already PENDING_CLOSE, APPROVED, or CLOSED)
 * - Creates an Approval record with entity_type = PERIOD_CLOSE
 * - Updates period status to PENDING_CLOSE
 */

import prisma from "~~/server/utils/prisma";
import type { Prisma } from "@prisma/client";
import { getOpenNCRsForPeriod } from "~~/server/utils/ncrCredits";

// Type alias for PeriodLocation with included location
type PeriodLocationWithLocation = Prisma.PeriodLocationGetPayload<{
  include: { location: { select: { id: true; code: true; name: true } } };
}>;

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

  // Check if user is ADMIN
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Only admins can request period close",
      },
    });
  }

  try {
    const periodId = getRouterParam(event, "periodId");

    if (!periodId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_PARAMETERS",
          message: "Period ID is required",
        },
      });
    }

    // Fetch the period with all location statuses
    const period = await prisma.period.findUnique({
      where: { id: periodId },
      include: {
        period_locations: {
          include: {
            location: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
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

    // Check period status - must be OPEN
    if (period.status !== "OPEN") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "INVALID_PERIOD_STATUS",
          message: `Period cannot be closed - current status is ${period.status}`,
          currentStatus: period.status,
        },
      });
    }

    // Check if there are any locations
    if (period.period_locations.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "NO_LOCATIONS",
          message: "Period has no locations configured",
        },
      });
    }

    // Check all locations are READY
    const notReadyLocations = period.period_locations.filter(
      (pl: PeriodLocationWithLocation) => pl.status !== "READY"
    );

    if (notReadyLocations.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "LOCATIONS_NOT_READY",
          message: "All locations must be ready before closing the period",
          notReadyLocations: notReadyLocations.map((pl: PeriodLocationWithLocation) => ({
            locationId: pl.location_id,
            locationCode: pl.location.code,
            locationName: pl.location.name,
            status: pl.status,
          })),
        },
      });
    }

    // Check if there's already a pending approval for this period
    const existingApproval = await prisma.approval.findFirst({
      where: {
        entity_type: "PERIOD_CLOSE",
        entity_id: periodId,
        status: "PENDING",
      },
    });

    if (existingApproval) {
      throw createError({
        statusCode: 409,
        statusMessage: "Conflict",
        data: {
          code: "APPROVAL_ALREADY_EXISTS",
          message: "A period close approval request already exists",
          approvalId: existingApproval.id,
        },
      });
    }

    // Query OPEN NCRs for all locations in this period (non-blocking warning)
    const locationIds = period.period_locations.map((pl) => pl.location_id);

    // Query OPEN NCRs for each location in parallel
    const openNCRsResults = await Promise.all(
      locationIds.map(async (locationId) => {
        const openNCRs = await getOpenNCRsForPeriod(periodId, locationId);
        const location = period.period_locations.find(
          (pl) => pl.location_id === locationId
        )?.location;

        return {
          locationId,
          locationCode: location?.code || "",
          locationName: location?.name || "",
          count: openNCRs.count,
          totalValue: openNCRs.ncrs.reduce(
            (sum: number, ncr: { value: number }) => sum + ncr.value,
            0
          ),
          ncrs: openNCRs.ncrs.map(
            (ncr: { id: string; ncr_no: string; value: number; reason: string }) => ({
              id: ncr.id,
              ncr_no: ncr.ncr_no,
              value: ncr.value,
              reason: ncr.reason,
            })
          ),
        };
      })
    );

    // Filter to only include locations with OPEN NCRs
    const openNCRsByLocation = openNCRsResults.filter((loc) => loc.count > 0);

    // Create the approval request and update period status in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create approval record
      const approval = await tx.approval.create({
        data: {
          entity_type: "PERIOD_CLOSE",
          entity_id: periodId,
          status: "PENDING",
          requested_by: user.id,
        },
      });

      // Update period status to PENDING_CLOSE and link approval
      const updatedPeriod = await tx.period.update({
        where: { id: periodId },
        data: {
          status: "PENDING_CLOSE",
          approval_id: approval.id,
        },
        include: {
          period_locations: {
            include: {
              location: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  type: true,
                },
              },
            },
            orderBy: {
              location: {
                name: "asc",
              },
            },
          },
        },
      });

      return { approval, period: updatedPeriod };
    });

    // Build response with warnings if OPEN NCRs exist
    const response: {
      approval: {
        id: string;
        status: string;
        requestedAt: Date;
        entityType: string;
      };
      period: typeof result.period;
      message: string;
      warnings?: {
        openNCRs: {
          totalCount: number;
          totalValue: number;
          byLocation: typeof openNCRsByLocation;
        };
      };
    } = {
      approval: {
        id: result.approval.id,
        status: result.approval.status,
        requestedAt: result.approval.requested_at,
        entityType: result.approval.entity_type,
      },
      period: result.period,
      message: "Period close approval request created successfully",
    };

    // Add warnings if OPEN NCRs exist
    if (openNCRsByLocation.length > 0) {
      const totalOpenNCRs = openNCRsByLocation.reduce((sum, loc) => sum + loc.count, 0);
      const totalOpenValue = openNCRsByLocation.reduce((sum, loc) => sum + loc.totalValue, 0);

      response.warnings = {
        openNCRs: {
          totalCount: totalOpenNCRs,
          totalValue: totalOpenValue,
          byLocation: openNCRsByLocation,
        },
      };
    }

    return response;
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error requesting period close:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to request period close",
      },
    });
  }
});
