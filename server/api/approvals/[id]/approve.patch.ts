/**
 * PATCH /api/approvals/:id/approve
 *
 * Approve an approval request
 *
 * For PERIOD_CLOSE approvals:
 * - Executes the period close in a database transaction
 * - Creates snapshots of current stock for each location
 * - Sets closing_value on PeriodLocation
 * - Updates PeriodLocation status to CLOSED
 * - Updates Period status to CLOSED
 *
 * Permissions:
 * - ADMIN only
 */

import prisma from "~~/server/utils/prisma";
import type { Prisma } from "@prisma/client";

// Type aliases for Prisma payloads
type PeriodLocationWithLocation = Prisma.PeriodLocationGetPayload<{
  include: { location: { select: { id: true; code: true; name: true; type: true } } };
}>;

type LocationStockWithRelations = Prisma.LocationStockGetPayload<{
  include: {
    item: { select: { id: true; code: true; name: true; unit: true } };
    location: { select: { id: true; code: true; name: true } };
  };
}>;

interface StockSnapshot {
  item_id: string;
  item_code: string;
  item_name: string;
  item_unit: string;
  quantity: number;
  wac: number;
  value: number;
}

interface ReconciliationSnapshot {
  opening_stock: number;
  receipts: number;
  transfers_in: number;
  transfers_out: number;
  issues: number;
  closing_stock: number;
  adjustments: number;
  back_charges: number;
  credits: number;
  condemnations: number;
  calculated_closing: number;
  variance: number;
}

interface LocationSnapshot {
  location_id: string;
  location_code: string;
  location_name: string;
  total_value: number;
  item_count: number;
  items: StockSnapshot[];
  reconciliation: ReconciliationSnapshot | null;
  snapshot_timestamp: string;
}

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
        message: "Only admins can approve requests",
      },
    });
  }

  try {
    const approvalId = getRouterParam(event, "id");

    if (!approvalId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_PARAMETERS",
          message: "Approval ID is required",
        },
      });
    }

    // Fetch the approval
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
    });

    if (!approval) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "APPROVAL_NOT_FOUND",
          message: "Approval not found",
        },
      });
    }

    // Check approval is still pending
    if (approval.status !== "PENDING") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "APPROVAL_ALREADY_PROCESSED",
          message: `Approval has already been ${approval.status.toLowerCase()}`,
          currentStatus: approval.status,
        },
      });
    }

    // Handle different entity types
    switch (approval.entity_type) {
      case "PERIOD_CLOSE":
        return await handlePeriodCloseApproval(approval.id, approval.entity_id, user.id);

      case "TRANSFER":
        // TODO: Implement transfer approval
        throw createError({
          statusCode: 501,
          statusMessage: "Not Implemented",
          data: {
            code: "NOT_IMPLEMENTED",
            message: "Transfer approval not yet implemented",
          },
        });

      case "PRF":
      case "PO":
        // TODO: Implement PRF/PO approval
        throw createError({
          statusCode: 501,
          statusMessage: "Not Implemented",
          data: {
            code: "NOT_IMPLEMENTED",
            message: `${approval.entity_type} approval not yet implemented`,
          },
        });

      default:
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "UNKNOWN_ENTITY_TYPE",
            message: `Unknown entity type: ${approval.entity_type}`,
          },
        });
    }
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error approving request:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to approve request",
      },
    });
  }
});

/**
 * Handle Period Close approval - executes the close in a transaction
 */
async function handlePeriodCloseApproval(approvalId: string, periodId: string, reviewerId: string) {
  // Fetch the period with all location data
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
              type: true,
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

  // Verify period is in correct state
  if (period.status !== "PENDING_CLOSE") {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        code: "INVALID_PERIOD_STATUS",
        message: `Period is not pending close - current status is ${period.status}`,
        currentStatus: period.status,
      },
    });
  }

  // Verify all locations are still READY
  const notReadyLocations = period.period_locations.filter(
    (pl: PeriodLocationWithLocation) => pl.status !== "READY"
  );
  if (notReadyLocations.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        code: "LOCATIONS_NOT_READY",
        message: "Some locations are no longer ready",
        locations: notReadyLocations.map((pl: PeriodLocationWithLocation) => pl.location.name),
      },
    });
  }

  const now = new Date();
  const locationIds = period.period_locations.map(
    (pl: PeriodLocationWithLocation) => pl.location_id
  );

  // Fetch all stock data for all locations
  const allLocationStock = await prisma.locationStock.findMany({
    where: {
      location_id: { in: locationIds },
      on_hand: { gt: 0 }, // Only include items with stock
    },
    include: {
      item: {
        select: {
          id: true,
          code: true,
          name: true,
          unit: true,
        },
      },
      location: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });

  // Fetch all reconciliation data for all locations in this period
  const allReconciliations = await prisma.reconciliation.findMany({
    where: {
      period_id: periodId,
      location_id: { in: locationIds },
    },
  });

  // Create a map of reconciliations by location ID for quick lookup
  const reconciliationsByLocation = new Map<string, ReconciliationSnapshot>();
  for (const recon of allReconciliations) {
    const openingStock = Number(recon.opening_stock);
    const receipts = Number(recon.receipts);
    const transfersIn = Number(recon.transfers_in);
    const transfersOut = Number(recon.transfers_out);
    const issues = Number(recon.issues);
    const closingStock = Number(recon.closing_stock);
    const adjustments = Number(recon.adjustments);
    const backCharges = Number(recon.back_charges);
    const credits = Number(recon.credits);
    const condemnations = Number(recon.condemnations);

    // Calculate expected closing: opening + receipts + transfers_in - transfers_out - issues + adjustments - back_charges + credits - condemnations
    const calculatedClosing =
      openingStock +
      receipts +
      transfersIn -
      transfersOut -
      issues +
      adjustments -
      backCharges +
      credits -
      condemnations;

    // Variance = actual closing - calculated closing
    const variance = Math.round((closingStock - calculatedClosing) * 100) / 100;

    reconciliationsByLocation.set(recon.location_id, {
      opening_stock: openingStock,
      receipts: receipts,
      transfers_in: transfersIn,
      transfers_out: transfersOut,
      issues: issues,
      closing_stock: closingStock,
      adjustments: adjustments,
      back_charges: backCharges,
      credits: credits,
      condemnations: condemnations,
      calculated_closing: Math.round(calculatedClosing * 100) / 100,
      variance: variance,
    });
  }

  // Group stock by location and calculate snapshots
  const snapshotsByLocation = new Map<string, LocationSnapshot>();

  for (const pl of period.period_locations as PeriodLocationWithLocation[]) {
    const locationStock = allLocationStock.filter(
      (s: LocationStockWithRelations) => s.location_id === pl.location_id
    );

    const items: StockSnapshot[] = locationStock.map((s: LocationStockWithRelations) => {
      const quantity = Number(s.on_hand);
      const wac = Number(s.wac);
      return {
        item_id: s.item.id,
        item_code: s.item.code,
        item_name: s.item.name,
        item_unit: s.item.unit,
        quantity,
        wac,
        value: Math.round(quantity * wac * 100) / 100, // Round to 2 decimal places
      };
    });

    const totalValue = items.reduce((sum, item) => sum + item.value, 0);

    // Get reconciliation data for this location (if exists)
    const reconciliation = reconciliationsByLocation.get(pl.location_id) || null;

    snapshotsByLocation.set(pl.location_id, {
      location_id: pl.location.id,
      location_code: pl.location.code,
      location_name: pl.location.name,
      total_value: Math.round(totalValue * 100) / 100,
      item_count: items.length,
      items,
      reconciliation,
      snapshot_timestamp: now.toISOString(),
    });
  }

  // Execute the close in a transaction
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Update approval to APPROVED
    const updatedApproval = await tx.approval.update({
      where: { id: approvalId },
      data: {
        status: "APPROVED",
        reviewed_by: reviewerId,
        reviewed_at: now,
      },
    });

    // Update each PeriodLocation with snapshot and CLOSED status
    const periodLocationUpdates: Prisma.PrismaPromise<unknown>[] = [];

    for (const [locationId, snapshot] of snapshotsByLocation) {
      periodLocationUpdates.push(
        tx.periodLocation.update({
          where: {
            period_id_location_id: {
              period_id: periodId,
              location_id: locationId,
            },
          },
          data: {
            status: "CLOSED",
            closing_value: snapshot.total_value,
            snapshot_data: snapshot as unknown as Prisma.JsonObject,
            closed_at: now,
          },
        })
      );
    }

    // Execute all PeriodLocation updates
    await Promise.all(periodLocationUpdates);

    // Update Period status to CLOSED
    const updatedPeriod = await tx.period.update({
      where: { id: periodId },
      data: {
        status: "CLOSED",
        closed_at: now,
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

    return { approval: updatedApproval, period: updatedPeriod };
  });

  // Prepare summary for response
  const locationSummaries = Array.from(snapshotsByLocation.values()).map((snapshot) => ({
    locationId: snapshot.location_id,
    locationCode: snapshot.location_code,
    locationName: snapshot.location_name,
    closingValue: snapshot.total_value,
    itemCount: snapshot.item_count,
  }));

  const totalClosingValue = locationSummaries.reduce((sum, loc) => sum + loc.closingValue, 0);

  return {
    approval: {
      id: result.approval.id,
      status: result.approval.status,
      reviewedAt: result.approval.reviewed_at,
    },
    period: {
      id: result.period.id,
      name: result.period.name,
      status: result.period.status,
      closedAt: result.period.closed_at,
      locations: result.period.period_locations.map((pl: PeriodLocationWithLocation) => ({
        locationId: pl.location_id,
        locationCode: pl.location.code,
        locationName: pl.location.name,
        status: pl.status,
        closingValue: Number(pl.closing_value),
        closedAt: pl.closed_at,
      })),
    },
    summary: {
      totalLocations: locationSummaries.length,
      totalClosingValue: Math.round(totalClosingValue * 100) / 100,
      locations: locationSummaries,
    },
    message: "Period closed successfully",
  };
}
