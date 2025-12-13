import prisma from "../../utils/prisma";
import { setCacheHeaders } from "../../utils/performance";

export default defineEventHandler(async (event) => {
  // Get user from session (auth middleware attaches it to event.context)
  const user = event.context.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      data: {
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      },
    });
  }

  try {
    // Find the current OPEN period with location readiness status
    // NOTE: Removed nested orderBy on location.name for performance
    // Sorting is done in JavaScript below to avoid expensive JOIN operations
    const currentPeriod = await prisma.period.findFirst({
      where: {
        status: "OPEN",
      },
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
        },
        _count: {
          select: {
            deliveries: true,
            issues: true,
            reconciliations: true,
          },
        },
      },
      orderBy: {
        start_date: "desc",
      },
    });

    // Sort period_locations by location name in JavaScript (faster than nested SQL ordering)
    const sortedPeriod = currentPeriod
      ? {
          ...currentPeriod,
          period_locations: [...currentPeriod.period_locations].sort((a, b) =>
            (a.location?.name || "").localeCompare(b.location?.name || "")
          ),
        }
      : null;

    // Set cache headers (10 seconds for current period - critical data)
    setCacheHeaders(event, {
      maxAge: 10,
      staleWhileRevalidate: 10,
    });

    return {
      period: sortedPeriod,
    };
  } catch (error) {
    console.error("Error fetching current period:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch current period",
      },
    });
  }
});
