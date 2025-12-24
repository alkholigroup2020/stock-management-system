/**
 * POST /api/locations/:id/issues
 *
 * Create a new stock issue for a location
 *
 * This endpoint handles:
 * - Issue creation with multiple line items
 * - Stock deduction from location
 * - WAC capture at time of issue (not recalculated)
 *
 * Business Rules:
 * - User must have POST or MANAGE access to the location
 * - Period must be open
 * - Items must be active and have sufficient stock
 * - WAC is NOT recalculated on issues (per business rules)
 *
 * Permissions:
 * - User must have POST or MANAGE access to the location
 * - ADMIN and SUPERVISOR have implicit access
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
  cost_centre: z.enum(["FOOD", "CLEAN", "OTHER"]).default("FOOD"),
  notes: z.string().nullable().optional(),
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

  // Get location ID from route params
  const locationId = getRouterParam(event, "id");

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

  try {
    // Parse and validate request body
    const body = await readBody(event);
    const data = bodySchema.parse(body);

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

    // Check user has access to location (Operators need explicit assignment)
    if (user.role === "OPERATOR") {
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
    // Admins and Supervisors have implicit access to all locations

    // Get current open period (required for issues)
    const currentPeriod = await prisma.period.findFirst({
      where: { status: "OPEN" },
      orderBy: { start_date: "desc" },
    });

    if (!currentPeriod) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "NO_OPEN_PERIOD",
          message: "No open accounting period. Please open a period before posting issues.",
        },
      });
    }

    // Verify all items exist and are active
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

    // Get current stock levels for all items
    const currentStocks = await prisma.locationStock.findMany({
      where: {
        location_id: locationId,
        item_id: { in: itemIds },
      },
    });

    const stockMap = new Map<string, { on_hand: number; wac: number }>();
    currentStocks.forEach((stock) => {
      stockMap.set(stock.item_id, {
        on_hand: parseFloat(stock.on_hand.toString()),
        wac: parseFloat(stock.wac.toString()),
      });
    });

    // Validate sufficient stock for all items
    const insufficientStock: Array<{ item: string; requested: number; available: number }> = [];
    for (const lineData of data.lines) {
      const stock = stockMap.get(lineData.item_id);
      const available = stock?.on_hand || 0;
      if (lineData.quantity > available) {
        const item = items.find((i) => i.id === lineData.item_id);
        insufficientStock.push({
          item: item?.name || lineData.item_id,
          requested: lineData.quantity,
          available,
        });
      }
    }

    if (insufficientStock.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "INSUFFICIENT_STOCK",
          message: "Insufficient stock for one or more items",
          details: insufficientStock,
        },
      });
    }

    // Generate issue number
    const issueNo = await generateIssueNumber();

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(
      async (tx) => {
        let totalValue = 0;
        const lineItems: Array<{
          item_id: string;
          quantity: number;
          wac_at_issue: number;
          line_value: number;
        }> = [];

        // Calculate line values and prepare data
        for (const lineData of data.lines) {
          const stock = stockMap.get(lineData.item_id) || { on_hand: 0, wac: 0 };
          const lineValue = lineData.quantity * stock.wac;
          totalValue += lineValue;

          lineItems.push({
            item_id: lineData.item_id,
            quantity: lineData.quantity,
            wac_at_issue: stock.wac,
            line_value: lineValue,
          });
        }

        // Create issue record
        const issue = await tx.issue.create({
          data: {
            issue_no: issueNo,
            location_id: locationId,
            period_id: currentPeriod.id,
            issue_date: new Date(data.issue_date),
            cost_centre: data.cost_centre,
            total_value: totalValue,
            notes: data.notes || null,
            posted_by: user.id,
            posted_at: new Date(),
          },
        });

        // Create issue lines and update stock
        const createdLines: unknown[] = [];
        for (const lineItem of lineItems) {
          const item = items.find((i) => i.id === lineItem.item_id)!;

          // Create issue line
          const issueLine = await tx.issueLine.create({
            data: {
              issue_id: issue.id,
              item_id: lineItem.item_id,
              quantity: lineItem.quantity,
              wac_at_issue: lineItem.wac_at_issue,
              line_value: lineItem.line_value,
            },
          });

          // Update location stock (decrement on_hand, DO NOT change WAC)
          await tx.locationStock.update({
            where: {
              location_id_item_id: {
                location_id: locationId,
                item_id: lineItem.item_id,
              },
            },
            data: {
              on_hand: { decrement: lineItem.quantity },
            },
          });

          createdLines.push({
            id: issueLine.id,
            item: {
              id: item.id,
              code: item.code,
              name: item.name,
              unit: item.unit,
            },
            quantity: lineItem.quantity,
            wac_at_issue: lineItem.wac_at_issue,
            line_value: lineItem.line_value,
          });
        }

        // Fetch the complete issue with relations
        const completeIssue = await tx.issue.findUnique({
          where: { id: issue.id },
          include: {
            location: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
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
          issue: completeIssue,
          lines: createdLines,
        };
      },
      {
        maxWait: 10000, // Max time to wait for a transaction slot (10 seconds)
        timeout: 30000, // Max time the transaction can run (30 seconds)
      }
    );

    return {
      id: result.issue!.id,
      message: "Issue posted successfully.",
      issue: {
        id: result.issue!.id,
        issue_no: result.issue!.issue_no,
        issue_date: result.issue!.issue_date,
        cost_centre: result.issue!.cost_centre,
        total_value: result.issue!.total_value,
        location: result.issue!.location,
        posted_by: result.issue!.poster,
        posted_at: result.issue!.posted_at,
      },
      lines: result.lines,
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
