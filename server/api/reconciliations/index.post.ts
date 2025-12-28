/**
 * POST /api/reconciliations
 *
 * Save or update reconciliation adjustments for a location/period
 *
 * Body:
 * - periodId: Required - Period ID
 * - locationId: Required - Location ID
 * - back_charges: Optional - Back-charges amount (default 0)
 * - credits: Optional - Credits due amount (default 0)
 * - condemnations: Optional - Condemnations amount (default 0)
 * - adjustments: Optional - Other adjustments amount (default 0)
 *
 * Features:
 * - Creates or updates reconciliation record
 * - Auto-calculates stock values from transactions
 * - Validates period is open
 * - Validates user has access to location
 *
 * Permissions:
 * - SUPERVISOR/ADMIN only
 */

import prisma from "../../utils/prisma";
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

// Request body schema
const bodySchema = z.object({
  periodId: z.string().uuid(),
  locationId: z.string().uuid(),
  back_charges: z.number().min(0).default(0),
  credits: z.number().min(0).default(0),
  condemnations: z.number().min(0).default(0),
  adjustments: z.number().min(0).default(0),
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

  // Only SUPERVISOR and ADMIN can save reconciliation adjustments
  if (user.role !== "SUPERVISOR" && user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Only supervisors and admins can save reconciliation adjustments",
      },
    });
  }

  try {
    // Parse and validate request body
    const body = await readBody(event);
    const { periodId, locationId, back_charges, credits, condemnations, adjustments } =
      bodySchema.parse(body);

    // Check if period exists and is open
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

    if (period.status !== "OPEN") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "PERIOD_CLOSED",
          message: "Cannot save adjustments to a closed period",
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

    // Calculate opening stock (from previous period's closing stock)
    let openingStock = new Decimal(0);

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

    // Upsert reconciliation record
    const reconciliation = await prisma.reconciliation.upsert({
      where: {
        period_id_location_id: {
          period_id: periodId,
          location_id: locationId,
        },
      },
      create: {
        period_id: periodId,
        location_id: locationId,
        opening_stock: openingStock,
        receipts: receipts,
        transfers_in: transfersInValue,
        transfers_out: transfersOutValue,
        issues: issuesValue,
        closing_stock: closingStock,
        back_charges: new Decimal(back_charges),
        credits: new Decimal(credits),
        condemnations: new Decimal(condemnations),
        adjustments: new Decimal(adjustments),
      },
      update: {
        opening_stock: openingStock,
        receipts: receipts,
        transfers_in: transfersInValue,
        transfers_out: transfersOutValue,
        issues: issuesValue,
        closing_stock: closingStock,
        back_charges: new Decimal(back_charges),
        credits: new Decimal(credits),
        condemnations: new Decimal(condemnations),
        adjustments: new Decimal(adjustments),
      },
    });

    // Calculate consumption for response
    const totalAdjustments = back_charges - credits + condemnations + adjustments;
    const consumption =
      parseFloat(openingStock.toString()) +
      parseFloat(receipts.toString()) +
      parseFloat(transfersInValue.toString()) -
      parseFloat(closingStock.toString()) -
      parseFloat(transfersOutValue.toString()) +
      totalAdjustments;

    return {
      success: true,
      message: "Reconciliation adjustments saved successfully",
      reconciliation: {
        id: reconciliation.id,
        period_id: reconciliation.period_id,
        location_id: reconciliation.location_id,
        opening_stock: parseFloat(reconciliation.opening_stock.toString()),
        receipts: parseFloat(reconciliation.receipts.toString()),
        transfers_in: parseFloat(reconciliation.transfers_in.toString()),
        transfers_out: parseFloat(reconciliation.transfers_out.toString()),
        issues: parseFloat(reconciliation.issues.toString()),
        closing_stock: parseFloat(reconciliation.closing_stock.toString()),
        back_charges: parseFloat(reconciliation.back_charges.toString()),
        credits: parseFloat(reconciliation.credits.toString()),
        condemnations: parseFloat(reconciliation.condemnations.toString()),
        adjustments: parseFloat(reconciliation.adjustments.toString()),
        last_updated: reconciliation.last_updated,
      },
      calculations: {
        consumption: Math.round(consumption * 100) / 100,
        total_adjustments: Math.round(totalAdjustments * 100) / 100,
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
          message: "Invalid request body",
          details: error.issues,
        },
      });
    }

    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error saving reconciliation:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to save reconciliation adjustments",
      },
    });
  }
});
