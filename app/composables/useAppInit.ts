/**
 * App Initialization Composable
 *
 * Coordinates the initialization of essential app state (auth, location, period)
 * and provides a centralized loading state for the entire application.
 *
 * This solves the race condition where pages try to render before essential
 * data (like the current location or period) has been loaded.
 */

interface AppInitState {
  isInitializing: boolean;
  isReady: boolean;
  error: string | null;
  authLoaded: boolean;
  locationsLoaded: boolean;
  periodLoaded: boolean;
}

// Shared state across all instances
const state = reactive<AppInitState>({
  isInitializing: false,
  isReady: false,
  error: null,
  authLoaded: false,
  locationsLoaded: false,
  periodLoaded: false,
});

// Track if initialization has been started (singleton pattern)
let initializationStarted = false;
let initializationPromise: Promise<void> | null = null;

export function useAppInit() {
  const auth = useAuth();

  /**
   * Initialize the application
   * This should be called once from the auth plugin
   */
  async function initialize(): Promise<void> {
    // Prevent multiple initializations
    if (initializationStarted) {
      // If already initializing, wait for it to complete
      if (initializationPromise) {
        return initializationPromise;
      }
      return;
    }

    initializationStarted = true;
    state.isInitializing = true;
    state.error = null;

    initializationPromise = performInitialization();
    await initializationPromise;
  }

  /**
   * Perform the actual initialization sequence
   */
  async function performInitialization(): Promise<void> {
    try {
      // Step 1: Fetch auth session
      await auth.fetchSession();
      state.authLoaded = true;

      // If user is authenticated, load location and period data
      if (auth.isAuthenticated.value) {
        // Step 2: Fetch locations and period in parallel
        const locationStore = useLocationStore();
        const periodStore = usePeriodStore();

        await Promise.all([
          locationStore.fetchUserLocations().then(() => {
            state.locationsLoaded = true;
          }),
          periodStore.fetchCurrentPeriod().then(() => {
            state.periodLoaded = true;
          }),
        ]);
      } else {
        // Not authenticated - mark as loaded (no data needed)
        state.locationsLoaded = true;
        state.periodLoaded = true;
      }

      state.isReady = true;
    } catch (err: unknown) {
      console.error("App initialization error:", err);
      state.error = err instanceof Error ? err.message : "Failed to initialize app";
      // Still mark as ready so the app can show error states
      state.isReady = true;
    } finally {
      state.isInitializing = false;
    }
  }

  /**
   * Reset initialization state (useful for logout)
   */
  function reset(): void {
    initializationStarted = false;
    initializationPromise = null;
    state.isInitializing = false;
    state.isReady = false;
    state.error = null;
    state.authLoaded = false;
    state.locationsLoaded = false;
    state.periodLoaded = false;
  }

  /**
   * Mark app as loading while post-login data is being fetched
   * This is called by the auth store after successful login
   */
  function setLoadingForPostLogin(): void {
    state.isReady = false;
    state.isInitializing = true;
    state.locationsLoaded = false;
    state.periodLoaded = false;
  }

  /**
   * Mark app as ready after post-login data is loaded
   * This is called by the auth store after location/period data is fetched
   */
  function setReadyAfterPostLogin(): void {
    state.locationsLoaded = true;
    state.periodLoaded = true;
    state.isReady = true;
    state.isInitializing = false;
  }

  /**
   * Re-initialize after logout/login
   */
  async function reinitialize(): Promise<void> {
    reset();
    await initialize();
  }

  return {
    // State
    isInitializing: computed(() => state.isInitializing),
    isReady: computed(() => state.isReady),
    error: computed(() => state.error),
    authLoaded: computed(() => state.authLoaded),
    locationsLoaded: computed(() => state.locationsLoaded),
    periodLoaded: computed(() => state.periodLoaded),

    // Actions
    initialize,
    reset,
    reinitialize,
    setLoadingForPostLogin,
    setReadyAfterPostLogin,
  };
}
