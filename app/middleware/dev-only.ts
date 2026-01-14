/**
 * Route middleware: dev-only
 *
 * Restricts access to routes in development mode only.
 * Redirects to 404 in production builds.
 */
export default defineNuxtRouteMiddleware(() => {
  if (!import.meta.dev) {
    return navigateTo("/", { redirectCode: 404 });
  }
});
