/**
 * GET /api/issues/:id
 *
 * Fetch a single issue by ID with full details
 *
 * Includes:
 * - Issue header information
 * - All issue lines with item details
 * - Location, period, and poster information
 *
 * Permissions:
 * - User must have access to the issue's location
 */

import prisma from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const user = event.context.user;

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
    const issueId = getRouterParam(event, "id");

    if (!issueId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_ISSUE_ID",
          message: "Issue ID is required",
        },
      });
    }

    // Fetch issue with all related data
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        location: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
            status: true,
            start_date: true,
            end_date: true,
          },
        },
        poster: {
          select: {
            id: true,
            username: true,
            full_name: true,
            role: true,
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
                category: true,
                sub_category: true,
              },
            },
          },
          // NOTE: Removed nested orderBy on item.name for performance
          // Sorting is done in JavaScript below
        },
      },
    });

    if (!issue) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "ISSUE_NOT_FOUND",
          message: "Issue not found",
        },
      });
    }

    // Check if user has access to the issue's location
    // Admin and Supervisor have access to all locations
    if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
      const userLocation = await prisma.userLocation.findUnique({
        where: {
          user_id_location_id: {
            user_id: user.id,
            location_id: issue.location_id,
          },
        },
      });

      if (!userLocation) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            code: "LOCATION_ACCESS_DENIED",
            message: "You do not have access to this issue's location",
          },
        });
      }
    }

    // Format the response
    return {
      issue: {
        id: issue.id,
        issue_no: issue.issue_no,
        issue_date: issue.issue_date,
        cost_centre: issue.cost_centre,
        total_value: issue.total_value,
        posted_at: issue.posted_at,
        location: issue.location,
        period: issue.period,
        poster: issue.poster,
        // Sort issue lines by item name in JavaScript (faster than nested SQL ordering)
        lines: [...issue.issue_lines]
          .sort((a, b) => (a.item?.name || "").localeCompare(b.item?.name || ""))
          .map((line) => ({
            id: line.id,
            item: line.item,
            quantity: line.quantity,
            wac_at_issue: line.wac_at_issue,
            line_value: line.line_value,
          })),
        summary: {
          total_lines: issue.issue_lines.length,
          total_items: issue.issue_lines.reduce(
            (sum, line) => sum + parseFloat(line.quantity.toString()),
            0
          ),
          total_value: issue.total_value,
        },
      },
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching issue:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch issue",
      },
    });
  }
});
