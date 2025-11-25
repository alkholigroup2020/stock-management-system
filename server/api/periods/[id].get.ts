/**
 * GET /api/periods/:id
 *
 * Fetch a single period by ID with location statuses
 *
 * Permissions:
 * - All authenticated users can view periods
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
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_ID",
          message: "Period ID is required",
        },
      });
    }

    // Fetch the period with location statuses
    const period = await prisma.period.findUnique({
      where: { id },
      include: {
        period_locations: {
          select: {
            location_id: true,
            status: true,
            opening_value: true,
            closing_value: true,
            ready_at: true,
            closed_at: true,
            location: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: {
            location: {
              name: "asc",
            },
          },
        },
        _count: {
          select: {
            deliveries: true,
            issues: true,
            reconciliations: true,
            item_prices: true,
          },
        },
      },
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

    return { period };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching period:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch period",
      },
    });
  }
});
