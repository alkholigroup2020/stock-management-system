import { getPerformanceSummary, getAllMetrics } from "../../utils/performance";

/**
 * GET /api/metrics/performance
 * Get API performance metrics
 * Requires admin role
 */
export default defineEventHandler(async (event) => {
  // Get authenticated user from context
  const user = event.context.user;

  // Only admins can view metrics
  if (!user || user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "PERMISSION_DENIED",
        message: "Only administrators can view performance metrics",
      },
    });
  }

  const query = getQuery(event);
  const detailed = query.detailed === "true";

  if (detailed) {
    // Return all metrics
    return {
      metrics: getAllMetrics(),
      count: getAllMetrics().length,
    };
  }

  // Return summary statistics
  const summary = getPerformanceSummary();

  // Calculate overall stats
  const allMetrics = getAllMetrics();
  const totalRequests = allMetrics.length;
  const slowRequests = allMetrics.filter((m) => m.duration > 1000).length;
  const avgDuration =
    totalRequests > 0
      ? Math.round(allMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests)
      : 0;

  return {
    summary,
    overall: {
      totalRequests,
      slowRequests,
      avgDuration,
      slowRequestPercentage:
        totalRequests > 0 ? Math.round((slowRequests / totalRequests) * 100) : 0,
    },
  };
});
