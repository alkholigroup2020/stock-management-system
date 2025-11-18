/**
 * GET /api/locations/:locationId/reconciliations/:periodId
 *
 * Fetch reconciliation for a location and period
 *
 * If the reconciliation record doesn't exist, it will be auto-calculated:
 * - Opening stock (from previous period closing stock)
 * - Receipts (sum of deliveries)
 * - Transfers in (sum of transfers TO this location)
 * - Transfers out (sum of transfers FROM this location)
 * - Issues (sum of issues)
 * - Closing stock (sum of current LocationStock WAC values)
 *
 * Business Rules:
 * - Returns existing reconciliation if found
 * - Auto-calculates if not found (doesn't create record yet)
 * - Adjustments default to 0 if not set
 * - Consumption and manday cost calculated using utility functions
 *
 * Permissions:
 * - User must have access to the location
 */

import prisma from "../../../../utils/prisma";
import { calculateConsumption, calculateMandayCost } from "../../../../utils/reconciliation";
import type { UserRole } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
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
    const locationId = getRouterParam(event, "locationId");
    const periodId = getRouterParam(event, "periodId");

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

    if (!periodId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_PERIOD_ID",
          message: "Period ID is required",
        },
      });
    }

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

    // Check user has access to location (unless Admin/Supervisor)
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
    }

    // Try to fetch existing reconciliation
    let reconciliation = await prisma.reconciliation.findUnique({
      where: {
        period_id_location_id: {
          period_id: periodId,
          location_id: locationId,
        },
      },
    });

    // If reconciliation doesn't exist, auto-calculate
    if (!reconciliation) {
      // Calculate opening stock (from previous period's closing stock)
      let openingStock = new Decimal(0);

      // Find previous period
      const previousPeriod = await prisma.period.findFirst({
        where: {
          end_date: {
            lt: period.start_date,
          },
        },
        orderBy: {
          end_date: "desc",
        },
      });

      if (previousPeriod) {
        // Get previous period's reconciliation closing stock
        const previousReconciliation = await prisma.reconciliation.findUnique({
          where: {
            period_id_location_id: {
              period_id: previousPeriod.id,
              location_id: locationId,
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
          location_id: locationId,
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
          to_location_id: locationId,
          transfer_date: {
            gte: period.start_date,
            lte: period.end_date,
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
          from_location_id: locationId,
          transfer_date: {
            gte: period.start_date,
            lte: period.end_date,
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
          location_id: locationId,
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
          location_id: locationId,
        },
      });

      const closingStock = locationStocks.reduce((sum, stock) => {
        const stockValue = stock.on_hand.mul(stock.wac);
        return sum.add(stockValue);
      }, new Decimal(0));

      // Create auto-calculated reconciliation object (not saved to DB yet)
      reconciliation = {
        id: "auto-calculated",
        period_id: periodId,
        location_id: locationId,
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
        last_updated: new Date(),
      };
    }

    // Get total mandays from POB
    const pobEntries = await prisma.pOB.findMany({
      where: {
        location_id: locationId,
        period_id: periodId,
      },
    });

    const totalMandays = pobEntries.reduce(
      (sum, entry) => sum + entry.crew_count + entry.extra_count,
      0
    );

    // Calculate consumption using utility function
    const consumptionResult = calculateConsumption({
      openingStock: reconciliation.opening_stock,
      receipts: reconciliation.receipts,
      transfersIn: reconciliation.transfers_in,
      transfersOut: reconciliation.transfers_out,
      issues: reconciliation.issues,
      closingStock: reconciliation.closing_stock,
      adjustments: reconciliation.adjustments,
      backCharges: reconciliation.back_charges,
      credits: reconciliation.credits,
      condemnations: reconciliation.condemnations,
    });

    // Calculate manday cost if mandays > 0
    let mandayCostResult = null;
    if (totalMandays > 0) {
      mandayCostResult = calculateMandayCost(
        consumptionResult.consumption,
        totalMandays
      );
    }

    return {
      reconciliation: {
        id: reconciliation.id,
        period_id: reconciliation.period_id,
        location_id: reconciliation.location_id,
        opening_stock: reconciliation.opening_stock.toNumber(),
        receipts: reconciliation.receipts.toNumber(),
        transfers_in: reconciliation.transfers_in.toNumber(),
        transfers_out: reconciliation.transfers_out.toNumber(),
        issues: reconciliation.issues.toNumber(),
        closing_stock: reconciliation.closing_stock.toNumber(),
        adjustments: reconciliation.adjustments.toNumber(),
        back_charges: reconciliation.back_charges.toNumber(),
        credits: reconciliation.credits.toNumber(),
        condemnations: reconciliation.condemnations.toNumber(),
        last_updated: reconciliation.last_updated,
      },
      location: {
        id: location.id,
        code: location.code,
        name: location.name,
      },
      period: {
        id: period.id,
        name: period.name,
        start_date: period.start_date,
        end_date: period.end_date,
        status: period.status,
      },
      calculations: {
        consumption: consumptionResult.consumption,
        total_adjustments: consumptionResult.totalAdjustments,
        total_mandays: totalMandays,
        manday_cost: mandayCostResult ? mandayCostResult.mandayCost : null,
        breakdown: consumptionResult.breakdown,
      },
      is_auto_calculated: reconciliation.id === "auto-calculated",
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching reconciliation:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch reconciliation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
