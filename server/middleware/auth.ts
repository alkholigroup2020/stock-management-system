/**
 * Authentication Middleware
 *
 * Protects all API routes (except auth routes) by checking for valid user session.
 * Runs on every /api/* request.
 *
 * Functionality:
 * - Checks if user session exists
 * - Throws 401 if not authenticated
 * - Attaches user to event.context for use in route handlers
 * - Excludes auth-related routes (/api/auth/*)
 */

export default defineEventHandler(async (event) => {
  // Get the request path
  const path = event.node.req.url || "";

  // Skip middleware for non-API routes
  if (!path.startsWith("/api")) {
    return;
  }

  // Skip middleware for auth routes (login, logout, session, register)
  // These routes handle their own authentication logic
  const publicAuthRoutes = [
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/session",
    "/api/auth/register",
    "/api/auth/test", // Test endpoint
    "/api/auth/test-password", // Test endpoint
    "/api/health", // Health check endpoint
  ];

  // Check if current path matches any public routes
  if (publicAuthRoutes.some((route) => path.startsWith(route))) {
    return;
  }

  // Get user session
  const session = await getUserSession(event);

  // If no user in session, throw 401 Unauthorized
  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      data: {
        code: "NOT_AUTHENTICATED",
        message: "You must be logged in to access this resource",
      },
    });
  }

  // Attach user to event.context for easy access in route handlers
  // This allows routes to access user via event.context.user
  event.context.user = session.user;

  // Log authentication for debugging (optional, remove in production)
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Auth] User ${(session.user as any).username} accessing ${path}`,
    );
  }
});
