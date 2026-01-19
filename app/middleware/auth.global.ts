/**
 * Global Authentication Middleware
 *
 * Runs on every route navigation to enforce authentication requirements.
 * - Redirects unauthenticated users to /login
 * - Allows access to login page for unauthenticated users
 * - Enforces role-based access control for PROCUREMENT_SPECIALIST
 *
 * Note: Session fetching is handled by the auth plugin (app/plugins/auth.client.ts)
 * which runs on app initialization after Pinia is ready.
 */

// Routes restricted for PROCUREMENT_SPECIALIST role
// These users can only access: Dashboard, Orders (PRF/PO), Deliveries (view only)
const PROCUREMENT_SPECIALIST_RESTRICTED_ROUTES = [
  "/items",
  "/issues",
  "/transfers",
  "/reconciliations",
  "/pob",
  "/ncrs",
  "/stock-now",
  "/reports",
  "/periods",
  "/period-close",
  "/locations",
  "/suppliers",
  "/users",
];

/**
 * Check if a path matches any restricted route prefix
 */
function isRestrictedForProcurementSpecialist(path: string): boolean {
  return PROCUREMENT_SPECIALIST_RESTRICTED_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuth();

  // Define public routes that don't require authentication
  const publicRoutes = ["/login"];

  // Check if the target route is public
  const isPublicRoute = publicRoutes.includes(to.path);

  // If user is not authenticated and trying to access a protected route
  if (!auth.isAuthenticated.value && !isPublicRoute) {
    return navigateTo({
      path: "/login",
      query: { redirect: to.fullPath }, // Store intended destination for post-login redirect
    });
  }

  // If user is authenticated and trying to access login page
  if (auth.isAuthenticated.value && to.path === "/login") {
    // Check for redirect query parameter (from previous login redirect)
    const redirect = to.query.redirect as string;
    return navigateTo(redirect || "/");
  }

  // Role-based access control for PROCUREMENT_SPECIALIST
  if (auth.isAuthenticated.value && auth.isProcurementSpecialist.value) {
    if (isRestrictedForProcurementSpecialist(to.path)) {
      // Redirect to dashboard with an error message
      return abortNavigation({
        statusCode: 403,
        statusMessage: "Access denied. Procurement Specialists cannot access this page.",
      });
    }
  }
});
