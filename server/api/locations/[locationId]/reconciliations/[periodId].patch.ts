/**
 * PATCH /api/locations/:locationId/reconciliations/:periodId
 *
 * Update reconciliation adjustments for a location and period
 *
 * This endpoint handles:
 * - Updating adjustment values (back_charges, credits, condemnations, adjustments)
 * - Creating reconciliation record if it doesn't exist
 * - Recalculating consumption and manday cost
 *
 * Business Rules:
 * - Only Supervisor or Admin can update reconciliations
 * - User must have access to the location
 * - All adjustment fields are optional (defaults to 0)
 * - System automatically recalculates consumption after updates
 *
 * Permissions:
 * - User must be Supervisor or Admin
 * - User must have access to the location
 */

import prisma from "../../../../utils/prisma";
import { calculateConsumption, calculateMandayCost } from "../../../../utils/reconciliation";
import { z } from "zod";
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

// Request body schema - all fields optional
const updateSchema = z.object({
  back_charges: z.number().optional(),
  credits: z.number().optional(),
  condemnations: z.number().optional(),
  adjustments: z.number().optional(),
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

    // Check user is Supervisor or Admin
    if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Only Supervisors and Admins can update reconciliations",
        },
      });
    }

    // Parse and validate request body
    const body = await readBody(event);
    const data = updateSchema.parse(body);

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

    // Check user has access to location (Supervisors need access, Admins have access to all)
    if (user.role === "SUPERVISOR") {
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

    // Check if reconciliation exists, if not calculate it first
    let existingReconciliation = await prisma.reconciliation.findUnique({
      where: {
        period_id_location_id: {
          period_id: periodId,
          location_id: locationId,
        },
      },
    });

    // If reconciliation doesn't exist, we need to calculate base values first
    if (!existingReconciliation) {
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

      // Create the reconciliation record with calculated base values
      existingReconciliation = await prisma.reconciliation.create({
        data: {
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
        },
      });
    }

    // Build update data object
    const updateData: Record<string, Decimal> = {};

    if (data.back_charges !== undefined) {
      updateData.back_charges = new Decimal(data.back_charges);
    }
    if (data.credits !== undefined) {
      updateData.credits = new Decimal(data.credits);
    }
    if (data.condemnations !== undefined) {
      updateData.condemnations = new Decimal(data.condemnations);
    }
    if (data.adjustments !== undefined) {
      updateData.adjustments = new Decimal(data.adjustments);
    }

    // Update the reconciliation
    const updatedReconciliation = await prisma.reconciliation.update({
      where: {
        period_id_location_id: {
          period_id: periodId,
          location_id: locationId,
        },
      },
      data: updateData,
    });

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
      openingStock: updatedReconciliation.opening_stock,
      receipts: updatedReconciliation.receipts,
      transfersIn: updatedReconciliation.transfers_in,
      transfersOut: updatedReconciliation.transfers_out,
      issues: updatedReconciliation.issues,
      closingStock: updatedReconciliation.closing_stock,
      adjustments: updatedReconciliation.adjustments,
      backCharges: updatedReconciliation.back_charges,
      credits: updatedReconciliation.credits,
      condemnations: updatedReconciliation.condemnations,
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
      message: "Reconciliation updated successfully",
      reconciliation: {
        id: updatedReconciliation.id,
        period_id: updatedReconciliation.period_id,
        location_id: updatedReconciliation.location_id,
        opening_stock: updatedReconciliation.opening_stock.toNumber(),
        receipts: updatedReconciliation.receipts.toNumber(),
        transfers_in: updatedReconciliation.transfers_in.toNumber(),
        transfers_out: updatedReconciliation.transfers_out.toNumber(),
        issues: updatedReconciliation.issues.toNumber(),
        closing_stock: updatedReconciliation.closing_stock.toNumber(),
        adjustments: updatedReconciliation.adjustments.toNumber(),
        back_charges: updatedReconciliation.back_charges.toNumber(),
        credits: updatedReconciliation.credits.toNumber(),
        condemnations: updatedReconciliation.condemnations.toNumber(),
        last_updated: updatedReconciliation.last_updated,
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

    console.error("Error updating reconciliation:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to update reconciliation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
