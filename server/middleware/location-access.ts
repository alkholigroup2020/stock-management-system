/**
 * Location Access Middleware
 *
 * Checks if authenticated user has access to the requested location.
 * Applies to location-specific API routes.
 *
 * Functionality:
 * - Extracts locationId from route params
 * - Checks if user has access to the location
 * - Throws 403 if access denied
 * - Admins and Supervisors have access to all locations
 * - Operators only have access to their assigned locations
 */

export default defineEventHandler(async (event) => {
  // Get the request path
  const path = event.node.req.url || "";

  // Only apply to location-specific API routes
  // Pattern: /api/locations/[locationId]/* or /api/locations/[locationId]/...
  const locationRoutePattern = /^\/api\/locations\/([a-f0-9-]+)/i;
  const match = path.match(locationRoutePattern);

  // If route doesn't match location pattern, skip middleware
  if (!match) {
    return;
  }

  // Extract locationId from URL
  const locationId = match[1];

  // Get user from context (set by auth middleware)
  const user = event.context.user;

  // If no user in context, skip (auth middleware will handle)
  if (!user) {
    return;
  }

  // Admins and Supervisors have access to all locations
  if (user.role === "ADMIN" || user.role === "SUPERVISOR") {
    // Attach locationId to context for easy access in route handlers
    event.context.locationId = locationId;
    return;
  }

  // For Operators, check if they have access to this location
  const hasAccess = user.locations?.some(
    (loc: any) => loc.location_id === locationId,
  );

  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "LOCATION_ACCESS_DENIED",
        message: "You do not have access to this location",
        locationId,
      },
    });
  }

  // Attach locationId to context for easy access in route handlers
  event.context.locationId = locationId;

  // Log access for debugging (optional, remove in production)
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Location Access] User ${(user as any).username} (${(user as any).role}) accessing location ${locationId}`,
    );
  }
});
