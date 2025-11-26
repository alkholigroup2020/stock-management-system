/**
 * Online/Offline Status Composable
 *
 * Detects and tracks the browser's online/offline status.
 * Provides a reactive `isOnline` ref that updates when connection changes.
 *
 * @example
 * ```typescript
 * const { isOnline } = useOnlineStatus()
 *
 * // Use in template
 * <template>
 *   <div v-if="!isOnline">You are offline</div>
 * </template>
 *
 * // Watch for changes
 * watch(isOnline, (online) => {
 *   if (online) console.log('Back online!')
 * })
 * ```
 */

export const useOnlineStatus = () => {
  const isOnline = ref(true);

  // Initialize with current browser status (only on client)
  if (import.meta.client) {
    isOnline.value = navigator.onLine;
  }

  const handleOnline = () => {
    isOnline.value = true;
  };

  const handleOffline = () => {
    isOnline.value = false;
  };

  onMounted(() => {
    // Set initial value
    isOnline.value = navigator.onLine;

    // Listen for connection changes
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
  });

  onUnmounted(() => {
    // Clean up event listeners
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  });

  return {
    isOnline: readonly(isOnline),
  };
};
