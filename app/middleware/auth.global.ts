/**
 * Global Authentication Middleware
 *
 * Runs on every route navigation to enforce authentication requirements.
 * - Redirects unauthenticated users to /login
 * - Allows access to login page for unauthenticated users
 *
 * Note: Session fetching is handled by the auth plugin (app/plugins/auth.client.ts)
 * which runs on app initialization after Pinia is ready.
 */

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
});
