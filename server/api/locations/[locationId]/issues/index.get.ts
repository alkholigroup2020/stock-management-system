/**
 * GET /api/locations/:locationId/issues
 *
 * Fetch issues (stock consumption) for a location with optional filters
 *
 * Query Parameters:
 * - periodId: Filter by period
 * - startDate: Filter by issue date (from)
 * - endDate: Filter by issue date (to)
 * - costCentre: Filter by cost centre (FOOD/CLEAN/OTHER)
 * - includeLines: Include issue lines in response (true/false)
 *
 * Permissions:
 * - User must have access to the location
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

// Query schema for validation
const querySchema = z.object({
  periodId: z.string().uuid().optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  costCentre: z.enum(["FOOD", "CLEAN", "OTHER"]).optional(),
  includeLines: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(200).default(50),
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

    // Parse and validate query parameters
    const query = await getQuery(event);
    const { periodId, startDate, endDate, costCentre, includeLines, page, limit } =
      querySchema.parse(query);

    // Build where clause for issues
    const where: Record<string, unknown> = {
      location_id: locationId,
    };

    if (periodId) {
      where.period_id = periodId;
    }

    if (startDate || endDate) {
      const issueDateFilter: Record<string, Date> = {};
      if (startDate) {
        issueDateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        issueDateFilter.lte = new Date(endDate);
      }
      where.issue_date = issueDateFilter;
    }

    if (costCentre) {
      where.cost_centre = costCentre;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Fetch issues with pagination
    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
      where,
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
        issue_lines:
          includeLines === "true"
            ? {
                include: {
                  item: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                      unit: true,
                    },
                  },
                },
              }
            : false,
      },
      orderBy: {
        issue_date: "desc",
      },
      skip,
      take,
    }),
    prisma.issue.count({ where }),
  ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      location: {
        id: location.id,
        code: location.code,
        name: location.name,
      },
      issues: issues.map((issue) => ({
        id: issue.id,
        issue_no: issue.issue_no,
        issue_date: issue.issue_date,
        cost_centre: issue.cost_centre,
        total_value: issue.total_value,
        posted_at: issue.posted_at,
        period: issue.period,
        poster: issue.poster,
        lines:
          includeLines === "true" && Array.isArray(issue.issue_lines)
            ? issue.issue_lines.map((line: unknown) => {
                const issueLine = line as {
                  id: string;
                  item: { id: string; code: string; name: string; unit: string };
                  quantity: number;
                  wac_at_issue: number;
                  line_value: number;
                };
                return {
                  id: issueLine.id,
                  item: issueLine.item,
                  quantity: issueLine.quantity,
                  wac_at_issue: issueLine.wac_at_issue,
                  line_value: issueLine.line_value,
                };
              })
            : undefined,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
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

    console.error("Error fetching issues:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch issues",
      },
    });
  }
});
