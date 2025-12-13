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
 */

import prisma from "../../utils/prisma";
import { setCacheHeaders } from "../../utils/performance";
import { calculateConsumption, calculateMandayCost } from "../../utils/reconciliation";
import { z } from "zod";
import type { UserRole, Period } from "@prisma/client";
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

    // Get user's accessible locations
    let accessibleLocationIds: string[] = [];

    if (user.role === "ADMIN" || user.role === "SUPERVISOR") {
      // Admin and Supervisor can see all active locations
      const allLocations = await prisma.location.findMany({
        where: { is_active: true },
        select: { id: true },
      });
      accessibleLocationIds = allLocations.map((l) => l.id);
    } else {
      // Operator can only see assigned locations
      const userLocations = await prisma.userLocation.findMany({
        where: { user_id: user.id },
        select: { location_id: true },
      });
      accessibleLocationIds = userLocations.map((ul) => ul.location_id);
    }

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

    // Check if period exists
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

    // Fetch locations
    const locations = await prisma.location.findMany({
      where: {
        id: { in: accessibleLocationIds },
        is_active: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
      },
      orderBy: { code: "asc" },
    });

    // Helper function to calculate reconciliation for a location
    async function getLocationReconciliation(
      locId: string,
      currentPeriod: Period
    ): Promise<{ reconciliation: NonNullable<unknown>; isSaved: boolean }> {
      // Try to fetch existing reconciliation
      const reconciliation = await prisma.reconciliation.findUnique({
        where: {
          period_id_location_id: {
            period_id: periodId,
            location_id: locId,
          },
        },
      });

      if (reconciliation) {
        return { reconciliation, isSaved: true };
      }

      // Auto-calculate if no saved reconciliation
      // Calculate opening stock (from previous period's closing stock)
      let openingStock = new Decimal(0);

      const previousPeriod = await prisma.period.findFirst({
        where: {
          end_date: {
            lt: currentPeriod.start_date,
          },
        },
        orderBy: {
          end_date: "desc",
        },
      });

      if (previousPeriod) {
        const previousReconciliation = await prisma.reconciliation.findUnique({
          where: {
            period_id_location_id: {
              period_id: previousPeriod.id,
              location_id: locId,
            },
          },
        });

        if (previousReconciliation) {
          openingStock = previousReconciliation.closing_stock;
        }
      }

      // Calculate receipts (sum of deliveries)
      const deliveries = await prisma.delivery.findMany({
        where: {
          location_id: locId,
          period_id: periodId,
        },
        include: {
          delivery_lines: true,
        },
      });

      const receipts = deliveries.reduce((sum, delivery) => {
        const deliveryTotal = delivery.delivery_lines.reduce((lineSum: Decimal, line) => {
          return lineSum.add(line.line_value);
        }, new Decimal(0));
        return sum.add(deliveryTotal);
      }, new Decimal(0));

      // Calculate transfers in (TO this location)
      const transfersIn = await prisma.transfer.findMany({
        where: {
          to_location_id: locId,
          transfer_date: {
            gte: currentPeriod.start_date,
            lte: currentPeriod.end_date,
          },
          status: "COMPLETED",
        },
        include: {
          transfer_lines: true,
        },
      });

      const transfersInValue = transfersIn.reduce((sum, transfer) => {
        const transferTotal = transfer.transfer_lines.reduce((lineSum: Decimal, line) => {
          return lineSum.add(line.line_value);
        }, new Decimal(0));
        return sum.add(transferTotal);
      }, new Decimal(0));

      // Calculate transfers out (FROM this location)
      const transfersOut = await prisma.transfer.findMany({
        where: {
          from_location_id: locId,
          transfer_date: {
            gte: currentPeriod.start_date,
            lte: currentPeriod.end_date,
          },
          status: "COMPLETED",
        },
        include: {
          transfer_lines: true,
        },
      });

      const transfersOutValue = transfersOut.reduce((sum, transfer) => {
        const transferTotal = transfer.transfer_lines.reduce((lineSum: Decimal, line) => {
          return lineSum.add(line.line_value);
        }, new Decimal(0));
        return sum.add(transferTotal);
      }, new Decimal(0));

      // Calculate issues (sum of issues)
      const issues = await prisma.issue.findMany({
        where: {
          location_id: locId,
          period_id: periodId,
        },
        include: {
          issue_lines: true,
        },
      });

      const issuesValue = issues.reduce((sum, issue) => {
        const issueTotal = issue.issue_lines.reduce((lineSum: Decimal, line) => {
          return lineSum.add(line.line_value);
        }, new Decimal(0));
        return sum.add(issueTotal);
      }, new Decimal(0));

      // Calculate closing stock (sum of LocationStock values)
      const locationStocks = await prisma.locationStock.findMany({
        where: {
          location_id: locId,
        },
      });

      const closingStock = locationStocks.reduce((sum, stock) => {
        const stockValue = stock.on_hand.mul(stock.wac);
        return sum.add(stockValue);
      }, new Decimal(0));

      return {
        reconciliation: {
          period_id: periodId,
          location_id: locId,
          opening_stock: openingStock,
          receipts: receipts,
          transfers_in: transfersInValue,
          transfers_out: transfersOutValue,
          issues: issuesValue,
          closing_stock: closingStock,
          adjustments: new Decimal(0),
          back_charges: new Decimal(0),
          credits: new Decimal(0),
          condemnations: new Decimal(0),
        },
        isSaved: false,
      };
    }

    // Fetch reconciliations for all locations
    const locationSummaries: LocationReconciliationSummary[] = [];

    for (const location of locations) {
      const { reconciliation, isSaved } = await getLocationReconciliation(location.id, period);

      // Get total mandays from POB
      const pobEntries = await prisma.pOB.findMany({
        where: {
          location_id: location.id,
          period_id: periodId,
        },
      });

      const totalMandays = pobEntries.reduce(
        (sum, entry) => sum + entry.crew_count + entry.extra_count,
        0
      );

      // Convert Decimal to number
      const rec = reconciliation as {
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

      const recData = {
        opening_stock: parseFloat(rec.opening_stock.toString()),
        receipts: parseFloat(rec.receipts.toString()),
        transfers_in: parseFloat(rec.transfers_in.toString()),
        transfers_out: parseFloat(rec.transfers_out.toString()),
        issues: parseFloat(rec.issues.toString()),
        closing_stock: parseFloat(rec.closing_stock.toString()),
        adjustments: parseFloat(rec.adjustments.toString()),
        back_charges: parseFloat(rec.back_charges.toString()),
        credits: parseFloat(rec.credits.toString()),
        condemnations: parseFloat(rec.condemnations.toString()),
      };

      // Calculate consumption
      const consumptionResult = calculateConsumption({
        openingStock: rec.opening_stock,
        receipts: rec.receipts,
        transfersIn: rec.transfers_in,
        transfersOut: rec.transfers_out,
        issues: rec.issues,
        closingStock: rec.closing_stock,
        adjustments: rec.adjustments,
        backCharges: rec.back_charges,
        credits: rec.credits,
        condemnations: rec.condemnations,
      });

      // Calculate manday cost if mandays > 0
      let mandayCost: number | null = null;
      if (totalMandays > 0) {
        const mandayCostResult = calculateMandayCost(consumptionResult.consumption, totalMandays);
        mandayCost = mandayCostResult.mandayCost;
      }

      locationSummaries.push({
        location_id: location.id,
        location_code: location.code,
        location_name: location.name,
        location_type: location.type,
        reconciliation: {
          opening_stock: Math.round(recData.opening_stock * 100) / 100,
          receipts: Math.round(recData.receipts * 100) / 100,
          transfers_in: Math.round(recData.transfers_in * 100) / 100,
          transfers_out: Math.round(recData.transfers_out * 100) / 100,
          issues: Math.round(recData.issues * 100) / 100,
          closing_stock: Math.round(recData.closing_stock * 100) / 100,
          adjustments: Math.round(recData.adjustments * 100) / 100,
          back_charges: Math.round(recData.back_charges * 100) / 100,
          credits: Math.round(recData.credits * 100) / 100,
          condemnations: Math.round(recData.condemnations * 100) / 100,
        },
        calculations: {
          consumption: Math.round(consumptionResult.consumption * 100) / 100,
          total_adjustments: Math.round(consumptionResult.totalAdjustments * 100) / 100,
          total_mandays: totalMandays,
          manday_cost: mandayCost !== null ? Math.round(mandayCost * 100) / 100 : null,
        },
        is_saved: isSaved,
      });
    }

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

    // Set cache headers (60 seconds for reconciliation report - expensive to compute)
    setCacheHeaders(event, {
      maxAge: 60,
      staleWhileRevalidate: 30,
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
