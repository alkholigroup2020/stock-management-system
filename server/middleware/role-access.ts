/**
 * Role-Based Access Control Middleware for PROCUREMENT_SPECIALIST
 *
 * Enforces server-side access restrictions for PROCUREMENT_SPECIALIST role.
 * This middleware runs after the auth middleware and checks if the user's role
 * is allowed to access specific API endpoints.
 *
 * PROCUREMENT_SPECIALIST can only access:
 * - GET /api/prfs/* (view PRFs - approved only filtered by API)
 * - GET/POST/PATCH /api/pos/* (manage POs)
 * - GET /api/suppliers/* (view suppliers for PO dropdown)
 * - GET /api/items/* (view items for PO line items)
 * - GET /api/periods/current (view current period for UI)
 *
 * PROCUREMENT_SPECIALIST cannot access:
 * - POST/PATCH/DELETE /api/prfs/* (create/edit/delete PRFs)
 * - /api/locations/[id]/deliveries/* (Deliveries)
 * - /api/locations/[id]/issues/* (Issues)
 * - /api/transfers/* (Transfers)
 * - /api/reconciliations/* (Reconciliations)
 * - /api/locations/[id]/pob* (POB)
 * - /api/pob/* (POB)
 * - /api/ncrs/* (NCR)
 * - /api/stock/* (Stock Now)
 * - /api/reports/* (Reports)
 * - /api/periods/* (except /api/periods/current)
 * - /api/period-locations/* (Period Close)
 * - POST/PATCH/DELETE /api/locations/* (Location management)
 * - POST/PATCH/DELETE /api/suppliers/* (Supplier management)
 * - /api/users/* (User management)
 */

import type { UserRole } from "@prisma/client";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
  locations?: string[];
}

// Routes completely blocked for PROCUREMENT_SPECIALIST
const BLOCKED_ROUTES = [
  "/api/transfers",
  "/api/reconciliations",
  "/api/pob",
  "/api/ncrs",
  "/api/stock",
  "/api/period-locations",
  "/api/users",
];

// Specific period routes that ARE allowed for PROCUREMENT_SPECIALIST (read-only)
// These are exceptions to the general /api/periods/* restrictions
const ALLOWED_PERIOD_ROUTES = [
  "/api/periods/current", // PROCUREMENT_SPECIALIST needs to see current period for UI
];

// Specific report routes that ARE allowed for PROCUREMENT_SPECIALIST (read-only)
// These are exceptions to the general /api/reports/* restrictions
// NOTE: No report routes are allowed - PROCUREMENT_SPECIALIST cannot access reports
const ALLOWED_REPORT_ROUTES: string[] = [];

// Routes with method restrictions for PROCUREMENT_SPECIALIST
// Key: route prefix, Value: allowed HTTP methods
const METHOD_RESTRICTED_ROUTES: Record<string, string[]> = {
  "/api/prfs": ["GET"], // Can view PRFs only (approved ones filtered by API)
  "/api/locations": ["GET"], // Can view locations only
  "/api/suppliers": ["GET"], // Can view suppliers only (for PO dropdown)
  "/api/items": ["GET"], // Can view items only (for PO line items)
  "/api/periods": ["GET"], // Can view current period only (via ALLOWED_PERIOD_ROUTES check)
  "/api/reports": ["GET"], // Can view deliveries report only (via ALLOWED_REPORT_ROUTES check)
};

// Special patterns that need regex matching
const BLOCKED_PATTERNS = [
  /^\/api\/locations\/[^/]+\/issues/i, // /api/locations/[id]/issues/*
  /^\/api\/locations\/[^/]+\/pob/i, // /api/locations/[id]/pob/*
  /^\/api\/locations\/[^/]+\/deliveries/i, // /api/locations/[id]/deliveries/* - blocked for PROCUREMENT_SPECIALIST
];

/**
 * Check if the path matches any blocked route prefix
 */
function isBlockedRoute(path: string): boolean {
  return BLOCKED_ROUTES.some((route) => path.startsWith(route));
}

/**
 * Check if the path matches any blocked pattern
 */
function matchesBlockedPattern(path: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(path));
}

/**
 * Check if the path is an explicitly allowed period route (read-only)
 */
function isAllowedPeriodRoute(path: string, method: string): boolean {
  // Only GET requests are allowed
  if (method.toUpperCase() !== "GET") {
    return false;
  }
  // Check if the path exactly matches or starts with an allowed period route
  return ALLOWED_PERIOD_ROUTES.some((route) => path === route || path.startsWith(route + "?"));
}

/**
 * Check if this is a restricted period route (not in allowed list)
 */
function isRestrictedPeriodRoute(path: string, method: string): boolean {
  // If the path starts with /api/periods
  if (path.startsWith("/api/periods")) {
    // Block if it's NOT an allowed period route
    return !isAllowedPeriodRoute(path, method);
  }
  return false;
}

/**
 * Check if the path is an explicitly allowed report route (read-only)
 */
function isAllowedReportRoute(path: string, method: string): boolean {
  // Only GET requests are allowed
  if (method.toUpperCase() !== "GET") {
    return false;
  }
  // Check if the path exactly matches or starts with an allowed report route
  return ALLOWED_REPORT_ROUTES.some((route) => path === route || path.startsWith(route + "?"));
}

/**
 * Check if this is a restricted report route (not in allowed list)
 */
function isRestrictedReportRoute(path: string, method: string): boolean {
  // If the path starts with /api/reports
  if (path.startsWith("/api/reports")) {
    // Block if it's NOT an allowed report route
    return !isAllowedReportRoute(path, method);
  }
  return false;
}

/**
 * Check if the method is restricted for the given path
 */
function isMethodRestricted(path: string, method: string): boolean {
  for (const [routePrefix, allowedMethods] of Object.entries(METHOD_RESTRICTED_ROUTES)) {
    if (path.startsWith(routePrefix)) {
      // Special handling for /api/periods - need to check allowed routes list
      if (routePrefix === "/api/periods") {
        return isRestrictedPeriodRoute(path, method);
      }
      // Special handling for /api/reports - need to check allowed routes list
      if (routePrefix === "/api/reports") {
        return isRestrictedReportRoute(path, method);
      }
      return !allowedMethods.includes(method.toUpperCase());
    }
  }
  return false;
}

export default defineEventHandler(async (event) => {
  const path = event.node.req.url || "";
  const method = event.node.req.method || "GET";

  // Only apply to API routes
  if (!path.startsWith("/api")) {
    return;
  }

  // Get user from context (set by auth middleware)
  const user = event.context.user as AuthUser | undefined;

  // If no user in context, skip (auth middleware will handle)
  if (!user) {
    return;
  }

  // Only apply restrictions to PROCUREMENT_SPECIALIST role
  if (user.role !== "PROCUREMENT_SPECIALIST") {
    return;
  }

  // Check if route is completely blocked
  if (isBlockedRoute(path)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "ROLE_ACCESS_DENIED",
        message: "Procurement Specialists cannot access this resource",
        path,
      },
    });
  }

  // Check if route matches blocked patterns
  if (matchesBlockedPattern(path)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "ROLE_ACCESS_DENIED",
        message: "Procurement Specialists cannot access this resource",
        path,
      },
    });
  }

  // Check if method is restricted for this route
  if (isMethodRestricted(path, method)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "ROLE_ACCESS_DENIED",
        message: `Procurement Specialists cannot ${method} this resource`,
        path,
        method,
      },
    });
  }

  // Log access for debugging (optional, remove in production)
  if (process.env.NODE_ENV === "development") {
    console.log(`[Role Access] PROCUREMENT_SPECIALIST ${user.username} allowed ${method} ${path}`);
  }
});
