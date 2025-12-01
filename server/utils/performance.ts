import type { H3Event } from "h3";

/**
 * Performance monitoring utility for API endpoints
 */

interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: Date;
  statusCode: number;
}

// In-memory store for performance metrics (last 100 requests)
const performanceMetrics: PerformanceMetric[] = [];
const MAX_METRICS = 100;

/**
 * Record API response time
 */
export function recordPerformance(event: H3Event, startTime: number, statusCode: number): void {
  const duration = Date.now() - startTime;
  const endpoint = event.path || "unknown";
  const method = event.method || "unknown";

  const metric: PerformanceMetric = {
    endpoint,
    method,
    duration,
    timestamp: new Date(),
    statusCode,
  };

  performanceMetrics.push(metric);

  // Keep only the last MAX_METRICS entries
  if (performanceMetrics.length > MAX_METRICS) {
    performanceMetrics.shift();
  }

  // Log slow requests (> 1000ms)
  if (duration > 1000) {
    console.warn(`[SLOW API] ${method} ${endpoint} took ${duration}ms (status: ${statusCode})`);
  } else if (duration > 500) {
    console.log(`[API] ${method} ${endpoint} took ${duration}ms (status: ${statusCode})`);
  }
}

/**
 * Get performance statistics for an endpoint
 */
export function getEndpointStats(endpoint: string) {
  const metrics = performanceMetrics.filter((m) => m.endpoint === endpoint);

  if (metrics.length === 0) {
    return null;
  }

  const durations = metrics.map((m) => m.duration);
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  const lastMetric = metrics[metrics.length - 1];

  return {
    endpoint,
    count: metrics.length,
    avgDuration: Math.round(avg),
    minDuration: min,
    maxDuration: max,
    lastRequest: lastMetric!.timestamp,
  };
}

/**
 * Get all performance metrics
 */
export function getAllMetrics() {
  return performanceMetrics;
}

/**
 * Get performance summary
 */
export function getPerformanceSummary() {
  const endpoints = [...new Set(performanceMetrics.map((m) => m.endpoint))];

  return endpoints.map((endpoint) => getEndpointStats(endpoint)).filter(Boolean);
}

/**
 * Clear performance metrics
 */
export function clearMetrics() {
  performanceMetrics.length = 0;
}

/**
 * Set cache control headers for static data
 */
export function setCacheHeaders(
  event: H3Event,
  options: {
    maxAge?: number; // seconds
    sMaxAge?: number; // seconds for shared caches
    staleWhileRevalidate?: number; // seconds
    public?: boolean;
  } = {}
) {
  const {
    maxAge = 300, // 5 minutes default
    sMaxAge,
    staleWhileRevalidate,
    public: isPublic = true,
  } = options;

  const directives: string[] = [];

  if (isPublic) {
    directives.push("public");
  } else {
    directives.push("private");
  }

  directives.push(`max-age=${maxAge}`);

  if (sMaxAge !== undefined) {
    directives.push(`s-maxage=${sMaxAge}`);
  }

  if (staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  event.node.res.setHeader("Cache-Control", directives.join(", "));
}
