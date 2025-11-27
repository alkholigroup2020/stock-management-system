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
          },
        },
      },
      orderBy: {
        start_date: "desc",
      },
    });

    // Set cache headers (1 minute for current period)
    setCacheHeaders(event, {
      maxAge: 60,
      staleWhileRevalidate: 30,
    });

    return {
      period: currentPeriod,
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
