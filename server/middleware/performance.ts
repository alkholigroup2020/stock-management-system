import { recordPerformance } from "../utils/performance";

/**
 * Performance monitoring middleware
 * Tracks response times for all API endpoints
 */
export default defineEventHandler((event) => {
  // Only monitor API routes
  if (!event.path?.startsWith("/api/")) {
    return;
  }

  const startTime = Date.now();

  // Hook into the response to measure total time
  event.node.res.on("finish", () => {
    const statusCode = event.node.res.statusCode || 200;
    recordPerformance(event, startTime, statusCode);
  });
});
