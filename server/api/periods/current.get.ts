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
    // Find the current working period (OPEN or PENDING_CLOSE)
    // PENDING_CLOSE periods still need to be accessible for approval workflow
    // NOTE: Sorting by location name is done in JavaScript below for performance
    const currentPeriod = await prisma.period.findFirst({
      where: {
        status: { in: ["OPEN", "PENDING_CLOSE"] },
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

    if (!currentPeriod) {
      setCacheHeaders(event, {
        maxAge: 2,
        staleWhileRevalidate: 2,
      });
      return { period: null };
    }

    // Get per-location counts for the current period
    const locationIds = currentPeriod.period_locations.map((pl) => pl.location_id);

    // Fetch counts in parallel using Promise.all for better performance
    // Note: Using Promise.all instead of $transaction because groupBy queries
    // with the same structure execute efficiently in parallel
    const [
      deliveryCounts,
      issueCounts,
      transferFromCounts,
      reconciliationCounts,
      transferToCounts,
    ] = await Promise.all([
      // Deliveries per location
      prisma.delivery.groupBy({
        by: ["location_id"],
        where: {
          period_id: currentPeriod.id,
          location_id: { in: locationIds },
        },
        _count: { id: true },
      }),
      // Issues per location
      prisma.issue.groupBy({
        by: ["location_id"],
        where: {
          period_id: currentPeriod.id,
          location_id: { in: locationIds },
        },
        _count: { id: true },
      }),
      // Transfers per location (from) - filter by date range since transfers don't have period_id
      prisma.transfer.groupBy({
        by: ["from_location_id"],
        where: {
          from_location_id: { in: locationIds },
          request_date: {
            gte: currentPeriod.start_date,
            lte: currentPeriod.end_date,
          },
        },
        _count: { _all: true },
      }),
      // Reconciliations per location
      prisma.reconciliation.groupBy({
        by: ["location_id"],
        where: {
          period_id: currentPeriod.id,
          location_id: { in: locationIds },
        },
        _count: { id: true },
      }),
      // Transfers per location (to) for accurate per-location counts
      prisma.transfer.groupBy({
        by: ["to_location_id"],
        where: {
          to_location_id: { in: locationIds },
          request_date: {
            gte: currentPeriod.start_date,
            lte: currentPeriod.end_date,
          },
        },
        _count: { _all: true },
      }),
    ]);

    // Build lookup maps for quick access
    const deliveryMap = new Map(deliveryCounts.map((d) => [d.location_id, d._count.id]));
    const issueMap = new Map(issueCounts.map((i) => [i.location_id, i._count.id]));
    const transferFromMap = new Map(
      transferFromCounts.map((t) => [t.from_location_id, t._count._all])
    );
    const transferToMap = new Map(transferToCounts.map((t) => [t.to_location_id, t._count._all]));
    const reconciliationMap = new Map(
      reconciliationCounts.map((r) => [r.location_id, r._count.id])
    );

    // Enhance period_locations with per-location counts
    const enhancedPeriodLocations = currentPeriod.period_locations.map((pl) => {
      const transfersFrom = transferFromMap.get(pl.location_id) || 0;
      const transfersTo = transferToMap.get(pl.location_id) || 0;

      return {
        ...pl,
        _count: {
          deliveries: deliveryMap.get(pl.location_id) || 0,
          issues: issueMap.get(pl.location_id) || 0,
          transfers: transfersFrom + transfersTo, // Total transfers involving this location
          reconciliations: reconciliationMap.get(pl.location_id) || 0,
        },
      };
    });

    // Sort period_locations by location name in JavaScript (faster than nested SQL ordering)
    const sortedPeriod = {
      ...currentPeriod,
      period_locations: enhancedPeriodLocations.sort((a, b) =>
        (a.location?.name || "").localeCompare(b.location?.name || "")
      ),
    };

    // Set cache headers (2 seconds for current period - critical data)
    setCacheHeaders(event, {
      maxAge: 2,
      staleWhileRevalidate: 2,
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
