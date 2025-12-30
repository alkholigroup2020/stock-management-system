/**
 * GET /api/reconciliations/consolidated
 *
 * Fetch reconciliations for all locations in a period (consolidated view)
 *
 * Query Parameters:
 * - periodId: Required - Period ID to fetch reconciliations for
 *
 * This endpoint provides:
 * - Individual reconciliations for each location
 * - Consumption and manday cost calculations per location
 * - Grand totals aggregated across all locations
 *
 * Business Rules:
 * - Only Supervisor and Admin can view consolidated reconciliations
 * - Returns all active locations with their reconciliation data
 * - Auto-calculates reconciliations that don't exist yet
 * - Aggregates totals across all locations for management reporting
 *
 * Permissions:
 * - User must be Supervisor or Admin
 *
 * OPTIMIZED: Uses batched queries and pre-fetched data to reduce latency
 */

import prisma from "../../utils/prisma";
import { setCacheHeaders } from "../../utils/performance";
import { calculateConsumption, calculateMandayCost } from "../../utils/reconciliation";
import { z } from "zod";
import type { UserRole, Reconciliation } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

// Query schema
const querySchema = z.object({
  periodId: z.string().uuid(),
});

// Pre-fetched data structure for efficient location processing
interface PreFetchedData {
  savedReconciliations: Map<string, Reconciliation>;
  previousPeriodReconciliations: Map<string, Reconciliation>;
  deliveryTotals: Map<string, Decimal>;
  transfersInTotals: Map<string, Decimal>;
  transfersOutTotals: Map<string, Decimal>;
  issueTotals: Map<string, Decimal>;
  closingStockTotals: Map<string, Decimal>;
  pobTotals: Map<string, number>;
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

  try {
    // Check user is Supervisor or Admin
    if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Only Supervisors and Admins can view consolidated reconciliations",
        },
      });
    }

    // Parse and validate query parameters
    const query = await getQuery(event);
    const { periodId } = querySchema.parse(query);

    // OPTIMIZATION 1: Batch initial queries into a single parallel fetch
    const [period, locations, previousPeriod] = await Promise.all([
      // Check if period exists
      prisma.period.findUnique({
        where: { id: periodId },
      }),
      // Get all active locations
      prisma.location.findMany({
        where: { is_active: true },
        orderBy: { code: "asc" },
      }),
      // Get previous period (needed for opening stock calculation) - ONCE for all locations
      prisma.period.findFirst({
        where: { status: "CLOSED" },
        orderBy: { end_date: "desc" },
      }),
    ]);

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

    if (locations.length === 0) {
      return {
        period: {
          id: period.id,
          name: period.name,
          start_date: period.start_date,
          end_date: period.end_date,
          status: period.status,
        },
        locations: [],
        grand_totals: {
          opening_stock: 0,
          receipts: 0,
          transfers_in: 0,
          transfers_out: 0,
          issues: 0,
          closing_stock: 0,
          adjustments: 0,
          back_charges: 0,
          credits: 0,
          condemnations: 0,
          consumption: 0,
          total_mandays: 0,
          average_manday_cost: null,
        },
        summary: {
          total_locations: 0,
          locations_with_saved_reconciliations: 0,
          locations_with_auto_calculated: 0,
        },
      };
    }

    const locationIds = locations.map((l) => l.id);

    // OPTIMIZATION 2: Pre-fetch ALL data for all locations in parallel
    const [
      savedReconciliations,
      previousReconciliations,
      deliveryAggregates,
      transfersInAggregates,
      transfersOutAggregates,
      issueAggregates,
      locationStocks,
      pobEntries,
    ] = await Promise.all([
      // All saved reconciliations for this period
      prisma.reconciliation.findMany({
        where: {
          period_id: periodId,
          location_id: { in: locationIds },
        },
      }),
      // Previous period reconciliations (for opening stock)
      previousPeriod
        ? prisma.reconciliation.findMany({
            where: {
              period_id: previousPeriod.id,
              location_id: { in: locationIds },
            },
          })
        : Promise.resolve([]),
      // Delivery totals per location using aggregate
      prisma.delivery.groupBy({
        by: ["location_id"],
        where: {
          period_id: periodId,
          location_id: { in: locationIds },
        },
        _sum: { total_amount: true },
      }),
      // Transfers IN totals per location
      prisma.transfer.groupBy({
        by: ["to_location_id"],
        where: {
          to_location_id: { in: locationIds },
          transfer_date: {
            gte: period.start_date,
            lte: period.end_date,
          },
          status: "COMPLETED",
        },
        _sum: { total_value: true },
      }),
      // Transfers OUT totals per location
      prisma.transfer.groupBy({
        by: ["from_location_id"],
        where: {
          from_location_id: { in: locationIds },
          transfer_date: {
            gte: period.start_date,
            lte: period.end_date,
          },
          status: "COMPLETED",
        },
        _sum: { total_value: true },
      }),
      // Issue totals per location
      prisma.issue.groupBy({
        by: ["location_id"],
        where: {
          period_id: periodId,
          location_id: { in: locationIds },
        },
        _sum: { total_value: true },
      }),
      // All location stocks (for closing stock calculation)
      prisma.locationStock.findMany({
        where: {
          location_id: { in: locationIds },
        },
        select: {
          location_id: true,
          on_hand: true,
          wac: true,
        },
      }),
      // All POB entries for mandays calculation
      prisma.pOB.findMany({
        where: {
          period_id: periodId,
          location_id: { in: locationIds },
        },
        select: {
          location_id: true,
          crew_count: true,
          extra_count: true,
        },
      }),
    ]);

    // OPTIMIZATION 3: Build lookup maps for O(1) access
    const preFetchedData: PreFetchedData = {
      savedReconciliations: new Map(savedReconciliations.map((r) => [r.location_id, r])),
      previousPeriodReconciliations: new Map(previousReconciliations.map((r) => [r.location_id, r])),
      deliveryTotals: new Map(
        deliveryAggregates.map((d) => [d.location_id, new Decimal(d._sum.total_amount || 0)])
      ),
      transfersInTotals: new Map(
        transfersInAggregates.map((t) => [t.to_location_id, new Decimal(t._sum.total_value || 0)])
      ),
      transfersOutTotals: new Map(
        transfersOutAggregates.map((t) => [
          t.from_location_id,
          new Decimal(t._sum.total_value || 0),
        ])
      ),
      issueTotals: new Map(
        issueAggregates.map((i) => [i.location_id, new Decimal(i._sum.total_value || 0)])
      ),
      closingStockTotals: new Map(),
      pobTotals: new Map(),
    };

    // Calculate closing stock totals per location
    for (const stock of locationStocks) {
      const stockValue = stock.on_hand.mul(stock.wac);
      const existing = preFetchedData.closingStockTotals.get(stock.location_id) || new Decimal(0);
      preFetchedData.closingStockTotals.set(stock.location_id, existing.add(stockValue));
    }

    // Calculate POB totals per location
    for (const pob of pobEntries) {
      const existing = preFetchedData.pobTotals.get(pob.location_id) || 0;
      preFetchedData.pobTotals.set(pob.location_id, existing + pob.crew_count + pob.extra_count);
    }

    // OPTIMIZATION 4: Process all locations using pre-fetched data (no additional queries)
    const locationReconciliations = locations.map((location) => {
      // Check if we have a saved reconciliation
      const savedRec = preFetchedData.savedReconciliations.get(location.id);

      let reconciliationData: {
        id: string;
        period_id: string;
        location_id: string;
        opening_stock: Decimal;
        receipts: Decimal;
        transfers_in: Decimal;
        transfers_out: Decimal;
        issues: Decimal;
        closing_stock: Decimal;
        adjustments: Decimal;
        back_charges: Decimal;
        credits: Decimal;
        condemnations: Decimal;
        last_updated: Date;
      };
      let isAutoCalculated = false;

      if (savedRec) {
        // Use saved reconciliation data
        reconciliationData = {
          id: savedRec.id,
          period_id: savedRec.period_id,
          location_id: savedRec.location_id,
          opening_stock: savedRec.opening_stock,
          receipts: savedRec.receipts,
          transfers_in: savedRec.transfers_in,
          transfers_out: savedRec.transfers_out,
          issues: savedRec.issues,
          closing_stock: savedRec.closing_stock,
          adjustments: savedRec.adjustments,
          back_charges: savedRec.back_charges,
          credits: savedRec.credits,
          condemnations: savedRec.condemnations,
          last_updated: savedRec.last_updated,
        };
      } else {
        // Auto-calculate from pre-fetched data
        const previousRec = preFetchedData.previousPeriodReconciliations.get(location.id);
        const openingStock = previousRec ? previousRec.closing_stock : new Decimal(0);

        reconciliationData = {
          id: `auto-calculated-${location.id}`,
          period_id: periodId,
          location_id: location.id,
          opening_stock: openingStock,
          receipts: preFetchedData.deliveryTotals.get(location.id) || new Decimal(0),
          transfers_in: preFetchedData.transfersInTotals.get(location.id) || new Decimal(0),
          transfers_out: preFetchedData.transfersOutTotals.get(location.id) || new Decimal(0),
          issues: preFetchedData.issueTotals.get(location.id) || new Decimal(0),
          closing_stock: preFetchedData.closingStockTotals.get(location.id) || new Decimal(0),
          adjustments: new Decimal(0),
          back_charges: new Decimal(0),
          credits: new Decimal(0),
          condemnations: new Decimal(0),
          last_updated: new Date(),
        };
        isAutoCalculated = true;
      }

      // Get POB totals
      const totalMandays = preFetchedData.pobTotals.get(location.id) || 0;

      // Calculate consumption
      const consumptionResult = calculateConsumption({
        openingStock: reconciliationData.opening_stock,
        receipts: reconciliationData.receipts,
        transfersIn: reconciliationData.transfers_in,
        transfersOut: reconciliationData.transfers_out,
        issues: reconciliationData.issues,
        closingStock: reconciliationData.closing_stock,
        adjustments: reconciliationData.adjustments,
        backCharges: reconciliationData.back_charges,
        credits: reconciliationData.credits,
        condemnations: reconciliationData.condemnations,
      });

      // Calculate manday cost if mandays > 0
      let mandayCost: number | null = null;
      if (totalMandays > 0) {
        const mandayCostResult = calculateMandayCost(consumptionResult.consumption, totalMandays);
        mandayCost = mandayCostResult.mandayCost;
      }

      return {
        location: {
          id: location.id,
          code: location.code,
          name: location.name,
          type: location.type,
        },
        reconciliation: {
          id: reconciliationData.id,
          period_id: reconciliationData.period_id,
          location_id: reconciliationData.location_id,
          opening_stock: reconciliationData.opening_stock.toNumber(),
          receipts: reconciliationData.receipts.toNumber(),
          transfers_in: reconciliationData.transfers_in.toNumber(),
          transfers_out: reconciliationData.transfers_out.toNumber(),
          issues: reconciliationData.issues.toNumber(),
          closing_stock: reconciliationData.closing_stock.toNumber(),
          adjustments: reconciliationData.adjustments.toNumber(),
          back_charges: reconciliationData.back_charges.toNumber(),
          credits: reconciliationData.credits.toNumber(),
          condemnations: reconciliationData.condemnations.toNumber(),
          last_updated: reconciliationData.last_updated,
        },
        calculations: {
          consumption: consumptionResult.consumption,
          total_adjustments: consumptionResult.totalAdjustments,
          total_mandays: totalMandays,
          manday_cost: mandayCost,
        },
        is_auto_calculated: isAutoCalculated,
      };
    });

    // Calculate grand totals
    const grandTotals = locationReconciliations.reduce(
      (totals, item) => {
        return {
          opening_stock: totals.opening_stock + item.reconciliation.opening_stock,
          receipts: totals.receipts + item.reconciliation.receipts,
          transfers_in: totals.transfers_in + item.reconciliation.transfers_in,
          transfers_out: totals.transfers_out + item.reconciliation.transfers_out,
          issues: totals.issues + item.reconciliation.issues,
          closing_stock: totals.closing_stock + item.reconciliation.closing_stock,
          adjustments: totals.adjustments + item.reconciliation.adjustments,
          back_charges: totals.back_charges + item.reconciliation.back_charges,
          credits: totals.credits + item.reconciliation.credits,
          condemnations: totals.condemnations + item.reconciliation.condemnations,
          consumption: totals.consumption + item.calculations.consumption,
          total_mandays: totals.total_mandays + item.calculations.total_mandays,
        };
      },
      {
        opening_stock: 0,
        receipts: 0,
        transfers_in: 0,
        transfers_out: 0,
        issues: 0,
        closing_stock: 0,
        adjustments: 0,
        back_charges: 0,
        credits: 0,
        condemnations: 0,
        consumption: 0,
        total_mandays: 0,
      }
    );

    // Calculate average manday cost across all locations
    const averageMandayCost =
      grandTotals.total_mandays > 0
        ? Math.round((grandTotals.consumption / grandTotals.total_mandays) * 100) / 100
        : null;

    // Set cache headers (2 seconds for consolidated reconciliation)
    setCacheHeaders(event, {
      maxAge: 2,
      staleWhileRevalidate: 2,
    });

    return {
      period: {
        id: period.id,
        name: period.name,
        start_date: period.start_date,
        end_date: period.end_date,
        status: period.status,
      },
      locations: locationReconciliations,
      grand_totals: {
        ...grandTotals,
        average_manday_cost: averageMandayCost,
      },
      summary: {
        total_locations: locations.length,
        locations_with_saved_reconciliations: locationReconciliations.filter(
          (item) => !item.is_auto_calculated
        ).length,
        locations_with_auto_calculated: locationReconciliations.filter(
          (item) => item.is_auto_calculated
        ).length,
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

    console.error("Error fetching consolidated reconciliations:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch consolidated reconciliations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
