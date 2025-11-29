/**
 * Service Worker Cleanup Plugin (Development Only)
 *
 * Unregisters any existing service workers in development mode
 * to prevent cached service workers from interfering with API requests.
 */
export default defineNuxtPlugin(async () => {
  // Only run in development mode
  if (import.meta.dev && "serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log("[Dev] Unregistered service worker:", registration.scope);
      }
      if (registrations.length > 0) {
        console.log(
          `[Dev] Cleaned up ${registrations.length} service worker(s) - please refresh the page`
        );
      }
    } catch (error) {
      console.warn("[Dev] Failed to unregister service workers:", error);
    }
  }
});
