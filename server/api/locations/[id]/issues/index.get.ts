/**
 * GET /api/locations/:id/issues
 *
 * Fetch issues for a location with optional filters and pagination
 *
 * Query Parameters:
 * - costCentre: Filter by cost centre (FOOD, CLEAN, OTHER)
 * - startDate: Filter by start date (ISO date string)
 * - endDate: Filter by end date (ISO date string)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 200)
 *
 * Permissions:
 * - User must have access to the location
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

// Query schema for validation
const querySchema = z.object({
  costCentre: z.enum(["FOOD", "CLEAN", "OTHER"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(50),
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
    // Parse and validate query parameters
    const query = getQuery(event);
    const { costCentre, startDate, endDate, page, limit } = querySchema.parse(query);

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

    // Check user has access to location
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

    // Build where clause
    const where: Record<string, unknown> = {
      location_id: locationId,
    };

    // Filter by cost centre
    if (costCentre) {
      where.cost_centre = costCentre;
    }

    // Filter by date range
    if (startDate && endDate) {
      where.issue_date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.issue_date = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.issue_date = {
        lte: new Date(endDate),
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch issues with pagination
    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        include: {
          period: {
            select: {
              id: true,
              name: true,
            },
          },
          poster: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
          issue_lines: {
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
          },
        },
        orderBy: { posted_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.issue.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    // Transform response
    const transformedIssues = issues.map((issue) => ({
      id: issue.id,
      issue_no: issue.issue_no,
      issue_date: issue.issue_date,
      cost_centre: issue.cost_centre,
      total_value: parseFloat(issue.total_value.toString()),
      period: issue.period,
      posted_at: issue.posted_at,
      posted_by_user: {
        id: issue.poster.id,
        username: issue.poster.username,
        full_name: issue.poster.full_name,
      },
      lines_count: issue.issue_lines.length,
    }));

    return {
      issues: transformedIssues,
      pagination: {
        total,
        page,
        limit,
        totalPages,
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
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
