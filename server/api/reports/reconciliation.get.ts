/**
 * GET /api/reports/reconciliation
 *
 * Generate reconciliation report for a period
 *
 * Query Parameters:
 * - periodId: Required - Period ID to report on
 * - locationId: Filter by specific location (optional)
 *
 * Features:
 * - Opening stock, receipts, transfers, issues, closing stock
 * - Consumption calculations per location
 * - Manday costs from POB data
 * - Grand totals across all locations
 *
 * Permissions:
 * - OPERATOR: Can only view assigned locations
 * - SUPERVISOR/ADMIN: Can view all locations
 *
 * OPTIMIZED: Uses batched queries and parallel processing to reduce latency
 */

import prisma from "../../utils/prisma";
import { setCacheHeaders } from "../../utils/performance";
import { calculateConsumption, calculateMandayCost } from "../../utils/reconciliation";
import { z } from "zod";
import type { UserRole, Period, Reconciliation } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

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
  periodId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
});

// Location reconciliation summary
interface LocationReconciliationSummary {
  location_id: string;
  location_code: string;
  location_name: string;
  location_type: string;
  reconciliation: {
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
  };
  calculations: {
    consumption: number;
    total_adjustments: number;
    total_mandays: number;
    manday_cost: number | null;
  };
  is_saved: boolean;
}

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
    // Parse and validate query parameters
    const query = await getQuery(event);
    const { periodId, locationId } = querySchema.parse(query);

    // OPTIMIZATION 1: Batch initial authorization and period queries
    const [allActiveLocations, userLocations, period, previousPeriod] = await Promise.all([
      // Get all active locations (for admin/supervisor)
      prisma.location.findMany({
        where: { is_active: true },
        select: { id: true, code: true, name: true, type: true },
        orderBy: { code: "asc" },
      }),
      // Get user's assigned locations (for operators)
      prisma.userLocation.findMany({
        where: { user_id: user.id },
        select: { location_id: true },
      }),
      // Check if period exists
      prisma.period.findUnique({
        where: { id: periodId },
      }),
      // Get previous period (needed for opening stock calculation)
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

    // Determine accessible location IDs
    let accessibleLocationIds: string[] =
      user.role === "ADMIN" || user.role === "SUPERVISOR"
        ? allActiveLocations.map((l) => l.id)
        : userLocations.map((ul) => ul.location_id);

    // If specific location requested, verify access
    if (locationId) {
      if (!accessibleLocationIds.includes(locationId)) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            code: "LOCATION_ACCESS_DENIED",
            message: "You do not have access to this location",
          },
        });
      }
      accessibleLocationIds = [locationId];
    }

    // Filter locations to only accessible ones
    const locations = allActiveLocations.filter((l) => accessibleLocationIds.includes(l.id));

    if (locations.length === 0) {
      return {
        report_type: "reconciliation",
        generated_at: new Date().toISOString(),
        generated_by: { id: user.id, username: user.username },
        period: {
          id: period.id,
          name: period.name,
          start_date: period.start_date,
          end_date: period.end_date,
          status: period.status,
        },
        filters: { location_id: locationId || null },
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
          locations_with_saved_data: 0,
          locations_with_calculated_data: 0,
        },
      };
    }

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
          location_id: { in: accessibleLocationIds },
        },
      }),
      // Previous period reconciliations (for opening stock)
      previousPeriod
        ? prisma.reconciliation.findMany({
            where: {
              period_id: previousPeriod.id,
              location_id: { in: accessibleLocationIds },
            },
          })
        : Promise.resolve([]),
      // Delivery totals per location using aggregate
      prisma.delivery.groupBy({
        by: ["location_id"],
        where: {
          period_id: periodId,
          location_id: { in: accessibleLocationIds },
        },
        _sum: { total_amount: true },
      }),
      // Transfers IN totals per location
      prisma.transfer.groupBy({
        by: ["to_location_id"],
        where: {
          to_location_id: { in: accessibleLocationIds },
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
          from_location_id: { in: accessibleLocationIds },
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
          location_id: { in: accessibleLocationIds },
        },
        _sum: { total_value: true },
      }),
      // All location stocks (for closing stock calculation)
      prisma.locationStock.findMany({
        where: {
          location_id: { in: accessibleLocationIds },
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
          location_id: { in: accessibleLocationIds },
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

    // OPTIMIZATION 4: Process all locations in parallel using pre-fetched data
    const locationSummaries: LocationReconciliationSummary[] = locations.map((location) => {
      // Check if we have a saved reconciliation
      const savedRec = preFetchedData.savedReconciliations.get(location.id);

      let recData: {
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
      };
      let isSaved = false;

      if (savedRec) {
        // Use saved reconciliation data
        recData = {
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
        };
        isSaved = true;
      } else {
        // Auto-calculate from pre-fetched data
        const previousRec = preFetchedData.previousPeriodReconciliations.get(location.id);
        const openingStock = previousRec ? previousRec.closing_stock : new Decimal(0);

        recData = {
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
        };
      }

      // Get POB totals
      const totalMandays = preFetchedData.pobTotals.get(location.id) || 0;

      // Calculate consumption
      const consumptionResult = calculateConsumption({
        openingStock: recData.opening_stock,
        receipts: recData.receipts,
        transfersIn: recData.transfers_in,
        transfersOut: recData.transfers_out,
        issues: recData.issues,
        closingStock: recData.closing_stock,
        adjustments: recData.adjustments,
        backCharges: recData.back_charges,
        credits: recData.credits,
        condemnations: recData.condemnations,
      });

      // Calculate manday cost if mandays > 0
      let mandayCost: number | null = null;
      if (totalMandays > 0) {
        const mandayCostResult = calculateMandayCost(consumptionResult.consumption, totalMandays);
        mandayCost = mandayCostResult.mandayCost;
      }

      return {
        location_id: location.id,
        location_code: location.code,
        location_name: location.name,
        location_type: location.type,
        reconciliation: {
          opening_stock: Math.round(parseFloat(recData.opening_stock.toString()) * 100) / 100,
          receipts: Math.round(parseFloat(recData.receipts.toString()) * 100) / 100,
          transfers_in: Math.round(parseFloat(recData.transfers_in.toString()) * 100) / 100,
          transfers_out: Math.round(parseFloat(recData.transfers_out.toString()) * 100) / 100,
          issues: Math.round(parseFloat(recData.issues.toString()) * 100) / 100,
          closing_stock: Math.round(parseFloat(recData.closing_stock.toString()) * 100) / 100,
          adjustments: Math.round(parseFloat(recData.adjustments.toString()) * 100) / 100,
          back_charges: Math.round(parseFloat(recData.back_charges.toString()) * 100) / 100,
          credits: Math.round(parseFloat(recData.credits.toString()) * 100) / 100,
          condemnations: Math.round(parseFloat(recData.condemnations.toString()) * 100) / 100,
        },
        calculations: {
          consumption: Math.round(consumptionResult.consumption * 100) / 100,
          total_adjustments: Math.round(consumptionResult.totalAdjustments * 100) / 100,
          total_mandays: totalMandays,
          manday_cost: mandayCost !== null ? Math.round(mandayCost * 100) / 100 : null,
        },
        is_saved: isSaved,
      };
    });

    // Calculate grand totals
    const grandTotals = locationSummaries.reduce(
      (totals, loc) => ({
        opening_stock: totals.opening_stock + loc.reconciliation.opening_stock,
        receipts: totals.receipts + loc.reconciliation.receipts,
        transfers_in: totals.transfers_in + loc.reconciliation.transfers_in,
        transfers_out: totals.transfers_out + loc.reconciliation.transfers_out,
        issues: totals.issues + loc.reconciliation.issues,
        closing_stock: totals.closing_stock + loc.reconciliation.closing_stock,
        adjustments: totals.adjustments + loc.reconciliation.adjustments,
        back_charges: totals.back_charges + loc.reconciliation.back_charges,
        credits: totals.credits + loc.reconciliation.credits,
        condemnations: totals.condemnations + loc.reconciliation.condemnations,
        consumption: totals.consumption + loc.calculations.consumption,
        total_mandays: totals.total_mandays + loc.calculations.total_mandays,
      }),
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

    // Calculate average manday cost
    const averageMandayCost =
      grandTotals.total_mandays > 0
        ? Math.round((grandTotals.consumption / grandTotals.total_mandays) * 100) / 100
        : null;

    // Set cache headers (2 seconds for reconciliation report)
    setCacheHeaders(event, {
      maxAge: 2,
      staleWhileRevalidate: 2,
    });

    return {
      report_type: "reconciliation",
      generated_at: new Date().toISOString(),
      generated_by: {
        id: user.id,
        username: user.username,
      },
      period: {
        id: period.id,
        name: period.name,
        start_date: period.start_date,
        end_date: period.end_date,
        status: period.status,
      },
      filters: {
        location_id: locationId || null,
      },
      locations: locationSummaries,
      grand_totals: {
        ...grandTotals,
        opening_stock: Math.round(grandTotals.opening_stock * 100) / 100,
        receipts: Math.round(grandTotals.receipts * 100) / 100,
        transfers_in: Math.round(grandTotals.transfers_in * 100) / 100,
        transfers_out: Math.round(grandTotals.transfers_out * 100) / 100,
        issues: Math.round(grandTotals.issues * 100) / 100,
        closing_stock: Math.round(grandTotals.closing_stock * 100) / 100,
        adjustments: Math.round(grandTotals.adjustments * 100) / 100,
        back_charges: Math.round(grandTotals.back_charges * 100) / 100,
        credits: Math.round(grandTotals.credits * 100) / 100,
        condemnations: Math.round(grandTotals.condemnations * 100) / 100,
        consumption: Math.round(grandTotals.consumption * 100) / 100,
        average_manday_cost: averageMandayCost,
      },
      summary: {
        total_locations: locationSummaries.length,
        locations_with_saved_data: locationSummaries.filter((loc) => loc.is_saved).length,
        locations_with_calculated_data: locationSummaries.filter((loc) => !loc.is_saved).length,
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

    console.error("Error generating reconciliation report:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to generate reconciliation report",
      },
    });
  }
});
