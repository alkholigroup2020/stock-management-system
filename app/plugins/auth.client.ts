/**
 * Auth Initialization Plugin
 *
 * This plugin runs on client-side after Pinia is initialized.
 * It fetches the user session on app startup to restore authentication state.
 *
 * Why a plugin instead of middleware?
 * - Plugins run after Pinia is ready, avoiding "getActivePinia()" errors
 * - This runs once on app startup, not on every route navigation
 * - Middleware can then just check auth state without fetching
 */
export default defineNuxtPlugin(async () => {
  const auth = useAuth();

  // Fetch the current session on app initialization
  // This will populate the auth store with the user data if they have a valid session
  try {
    await auth.fetchSession();
  } catch (error) {
    // Silently fail - user is simply not authenticated
    // The middleware will redirect to login if needed
    console.warn("Failed to fetch session on app init:", error);
  }
});
