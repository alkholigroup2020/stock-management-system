/**
 * POST /api/locations/:locationId/issues
 *
 * Create a new issue (stock consumption) for a location
 *
 * This endpoint handles:
 * - Issue creation with multiple line items
 * - Stock validation (sufficient quantity check)
 * - Stock quantity deduction (on_hand)
 * - WAC-based valuation (uses current WAC, does NOT recalculate)
 *
 * Business Rules:
 * - Period must be OPEN
 * - Each line must have sufficient stock (on_hand >= quantity)
 * - Issues use current WAC but do NOT recalculate it (only deliveries do)
 * - All operations must succeed in a single database transaction
 *
 * Permissions:
 * - User must have POST or MANAGE access to the location
 */

import prisma from "../../../../utils/prisma";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

// Issue line schema
const issueLineSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.number().positive(),
});

// Request body schema
const bodySchema = z.object({
  issue_date: z.string(), // ISO date string
  cost_centre: z.enum(["FOOD", "CLEAN", "OTHER"]),
  lines: z.array(issueLineSchema).min(1),
});

/**
 * Generate next issue number
 * Format: ISS-YYYY-NNN (e.g., ISS-2025-001)
 */
async function generateIssueNumber(year?: number): Promise<string> {
  const currentYear = year || new Date().getFullYear();
  const prefix = `ISS-${currentYear}-`;

  // Find the highest issue number for this year
  const lastIssue = await prisma.issue.findFirst({
    where: {
      issue_no: {
        startsWith: prefix,
      },
    },
    orderBy: {
      issue_no: "desc",
    },
    select: {
      issue_no: true,
    },
  });

  if (!lastIssue) {
    // First issue of the year
    return `${prefix}001`;
  }

  // Extract number from last issue and increment
  const parts = lastIssue.issue_no.split("-");
  const lastNumber = parseInt(parts[2] || "0", 10);
  const nextNumber = lastNumber + 1;

  // Pad with zeros to 3 digits
  return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
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

    // Parse and validate request body
    const body = await readBody(event);
    const data = bodySchema.parse(body);

    // Check if location exists and user has access
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

    // Check user has POST or MANAGE access to location
    const userLocation = await prisma.userLocation.findUnique({
      where: {
        user_id_location_id: {
          user_id: user.id,
          location_id: locationId,
        },
      },
    });

    if (!userLocation && user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "LOCATION_ACCESS_DENIED",
          message: "You do not have access to this location",
        },
      });
    }

    if (userLocation && userLocation.access_level === "VIEW") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "You do not have permission to post issues at this location",
        },
      });
    }

    // Get current open period
    const currentPeriod = await prisma.period.findFirst({
      where: {
        status: "OPEN",
      },
      include: {
        period_locations: {
          where: {
            location_id: locationId,
          },
        },
      },
    });

    if (!currentPeriod) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "NO_OPEN_PERIOD",
          message: "No open period found",
        },
      });
    }

    // Check if period is open for this location
    const periodLocation = currentPeriod.period_locations[0];
    if (!periodLocation || periodLocation.status !== "OPEN") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "PERIOD_CLOSED",
          message: "Period is not open for this location",
        },
      });
    }

    // Verify all items exist
    const itemIds = data.lines.map((line) => line.item_id);
    const items = await prisma.item.findMany({
      where: {
        id: { in: itemIds },
        is_active: true,
      },
    });

    if (items.length !== itemIds.length) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "INVALID_ITEMS",
          message: "One or more items not found or inactive",
        },
      });
    }

    // Get current stock for all items
    const locationStocks = await prisma.locationStock.findMany({
      where: {
        location_id: locationId,
        item_id: { in: itemIds },
      },
    });

    // Create a map of item_id -> stock data
    const stockMap = new Map<string, { on_hand: number; wac: number }>();
    locationStocks.forEach((stock) => {
      stockMap.set(stock.item_id, {
        on_hand: parseFloat(stock.on_hand.toString()),
        wac: parseFloat(stock.wac.toString()),
      });
    });

    // Validate sufficient stock for each line
    const insufficientStockErrors: Array<{
      item_id: string;
      item_name: string;
      item_code: string;
      requested: number;
      available: number;
    }> = [];

    for (const lineData of data.lines) {
      const item = items.find((i) => i.id === lineData.item_id)!;
      const stock = stockMap.get(lineData.item_id);

      if (!stock) {
        insufficientStockErrors.push({
          item_id: lineData.item_id,
          item_name: item.name,
          item_code: item.code,
          requested: lineData.quantity,
          available: 0,
        });
      } else if (stock.on_hand < lineData.quantity) {
        insufficientStockErrors.push({
          item_id: lineData.item_id,
          item_name: item.name,
          item_code: item.code,
          requested: lineData.quantity,
          available: stock.on_hand,
        });
      }
    }

    // If any items have insufficient stock, return error
    if (insufficientStockErrors.length > 0) {
      const errorMessages = insufficientStockErrors.map(
        (err) =>
          `${err.item_name} (${err.item_code}): requested ${err.requested}, available ${err.available}`
      );

      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "INSUFFICIENT_STOCK",
          message: `Insufficient stock for ${insufficientStockErrors.length} item(s)`,
          details: {
            errors: insufficientStockErrors,
            messages: errorMessages,
          },
        },
      });
    }

    // Generate issue number
    const issueNo = await generateIssueNumber();

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create issue record
      const issue = await tx.issue.create({
        data: {
          issue_no: issueNo,
          period_id: currentPeriod.id,
          location_id: locationId,
          issue_date: new Date(data.issue_date),
          cost_centre: data.cost_centre,
          total_value: 0, // Will be calculated from lines
          posted_by: user.id,
        },
      });

      let totalValue = 0;
      const createdLines: unknown[] = [];

      // Process each issue line
      for (const lineData of data.lines) {
        const item = items.find((i) => i.id === lineData.item_id)!;
        const stock = stockMap.get(lineData.item_id)!;

        // Calculate line value using current WAC
        const lineValue = lineData.quantity * stock.wac;

        // Create issue line
        const issueLine = await tx.issueLine.create({
          data: {
            issue_id: issue.id,
            item_id: lineData.item_id,
            quantity: lineData.quantity,
            wac_at_issue: stock.wac,
            line_value: lineValue,
          },
        });

        createdLines.push({
          ...issueLine,
          item,
        });

        totalValue += lineValue;

        // Deduct from location stock (DO NOT recalculate WAC)
        await tx.locationStock.update({
          where: {
            location_id_item_id: {
              location_id: locationId,
              item_id: lineData.item_id,
            },
          },
          data: {
            on_hand: stock.on_hand - lineData.quantity,
            // WAC remains unchanged - only deliveries recalculate WAC
          },
        });
      }

      // Update issue with calculated total value
      const updatedIssue = await tx.issue.update({
        where: { id: issue.id },
        data: {
          total_value: totalValue,
        },
        include: {
          period: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          poster: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
        },
      });

      return {
        issue: updatedIssue,
        lines: createdLines,
      };
    });

    return {
      message: "Issue created successfully",
      issue: {
        id: result.issue.id,
        issue_no: result.issue.issue_no,
        issue_date: result.issue.issue_date,
        cost_centre: result.issue.cost_centre,
        total_value: result.issue.total_value,
        posted_at: result.issue.posted_at,
        period: result.issue.period,
        poster: result.issue.poster,
        lines: result.lines.map((line: unknown) => {
          const issueLine = line as {
            id: string;
            item: { id: string; code: string; name: string; unit: string };
            quantity: number;
            wac_at_issue: number;
            line_value: number;
          };
          return {
            id: issueLine.id,
            item: {
              id: issueLine.item.id,
              code: issueLine.item.code,
              name: issueLine.item.name,
              unit: issueLine.item.unit,
            },
            quantity: issueLine.quantity,
            wac_at_issue: issueLine.wac_at_issue,
            line_value: issueLine.line_value,
          };
        }),
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

    console.error("Error creating issue:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to create issue",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
