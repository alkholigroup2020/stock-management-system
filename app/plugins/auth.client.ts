/**
 * Auth Initialization Plugin
 *
 * This plugin runs on client-side after Pinia is initialized.
 * It coordinates the initialization of auth, location, and period data
 * using the useAppInit composable to prevent race conditions.
 *
 * Why a plugin instead of middleware?
 * - Plugins run after Pinia is ready, avoiding "getActivePinia()" errors
 * - This runs once on app startup, not on every route navigation
 * - Middleware can then just check auth state without fetching
 */
export default defineNuxtPlugin(async () => {
  const appInit = useAppInit();

  // Initialize the application (auth + location + period)
  // This coordinates all essential data loading in the correct order
  try {
    await appInit.initialize();
  } catch (error) {
    // Error is handled within useAppInit
    // The app will still render and can show appropriate error states
    console.warn("App initialization completed with errors:", error);
  }
});
