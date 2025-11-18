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
 */

import prisma from "../../utils/prisma";
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

// Query schema
const querySchema = z.object({
  periodId: z.string().uuid(),
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

    // Get all active locations
    const locations = await prisma.location.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        code: "asc",
      },
    });

    // Helper function to calculate reconciliation for a location
    async function getLocationReconciliation(locationId: string, currentPeriod: Period) {
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
            from_location_id: locationId,
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

        // Create auto-calculated reconciliation object (not saved to DB)
        reconciliation = {
          id: `auto-calculated-${locationId}`,
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

      // Calculate consumption
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
        calculations: {
          consumption: consumptionResult.consumption,
          total_adjustments: consumptionResult.totalAdjustments,
          total_mandays: totalMandays,
          manday_cost: mandayCostResult ? mandayCostResult.mandayCost : null,
        },
        is_auto_calculated: reconciliation.id.startsWith("auto-calculated"),
      };
    }

    // Fetch reconciliations for all locations
    const locationReconciliations = await Promise.all(
      locations.map(async (location) => {
        const reconciliationData = await getLocationReconciliation(location.id, period);

        return {
          location: {
            id: location.id,
            code: location.code,
            name: location.name,
            type: location.type,
          },
          ...reconciliationData,
        };
      })
    );

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
