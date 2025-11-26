/**
 * Offline Guard Composable
 *
 * Provides utilities for guarding actions against offline state.
 * When the user is offline, actions will be blocked and a toast notification shown.
 *
 * @example
 * ```typescript
 * const { isOnline, guardAction } = useOfflineGuard()
 *
 * // Use in template to disable buttons
 * <UButton :disabled="!isOnline" @click="handleSubmit">Submit</UButton>
 *
 * // Wrap async actions
 * const handleSubmit = async () => {
 *   await guardAction(async () => {
 *     await $fetch('/api/deliveries', { method: 'POST', body })
 *   })
 * }
 * ```
 */

export const useOfflineGuard = () => {
  const { isOnline } = useOnlineStatus();
  const toast = useAppToast();

  /**
   * Guard an action against offline state.
   * If offline, shows a warning toast and returns without executing the action.
   * If online, executes the action normally.
   *
   * @param action - The async action to execute
   * @param options - Optional configuration
   * @returns The result of the action, or undefined if blocked due to offline state
   */
  const guardAction = async <T>(
    action: () => Promise<T>,
    options?: {
      /** Custom message to show when offline */
      offlineMessage?: string;
      /** Custom description for the toast */
      offlineDescription?: string;
    }
  ): Promise<T | undefined> => {
    if (!isOnline.value) {
      toast.warning(options?.offlineMessage || "You are offline", {
        description:
          options?.offlineDescription ||
          "This action requires an internet connection. Please check your connection and try again.",
        icon: "i-lucide-wifi-off",
      });
      return undefined;
    }

    return await action();
  };

  /**
   * Check if online and show toast if not.
   * Useful for synchronous checks before starting an action.
   *
   * @returns true if online, false if offline (and shows toast)
   */
  const checkOnline = (options?: {
    offlineMessage?: string;
    offlineDescription?: string;
  }): boolean => {
    if (!isOnline.value) {
      toast.warning(options?.offlineMessage || "You are offline", {
        description:
          options?.offlineDescription ||
          "This action requires an internet connection. Please check your connection and try again.",
        icon: "i-lucide-wifi-off",
      });
      return false;
    }
    return true;
  };

  return {
    /** Reactive online status - use to disable buttons when offline */
    isOnline,
    /** Wrap async actions to guard against offline execution */
    guardAction,
    /** Synchronous check that returns boolean and shows toast if offline */
    checkOnline,
  };
};
