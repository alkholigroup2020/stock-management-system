/**
 * Toast Notification Composable
 *
 * Wrapper around Nuxt UI's useToast() composable with predefined toast types
 * and brand color styling (navy blue primary, emerald green success).
 *
 * @example
 * ```typescript
 * const toast = useAppToast()
 * toast.success('Item created successfully')
 * toast.error('Failed to save data')
 * toast.warning('Stock level is low')
 * toast.info('Period closing in 2 days')
 * ```
 */

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  icon?: string;
  actions?: Array<{
    label: string;
    click: () => void;
  }>;
}

export const useAppToast = () => {
  const toast = useToast();

  /**
   * Show a success toast notification
   * Uses emerald color (success/secondary brand color)
   */
  const success = (title: string, options?: Omit<ToastOptions, "title">) => {
    toast.add({
      title,
      description: options?.description,
      icon: options?.icon || "i-lucide-check-circle",
      color: "success",
      duration: options?.duration || 5000,
      actions: options?.actions,
    });
  };

  /**
   * Show an error toast notification
   * Uses red color for errors
   */
  const error = (title: string, options?: Omit<ToastOptions, "title">) => {
    toast.add({
      title,
      description: options?.description,
      icon: options?.icon || "i-lucide-circle-x",
      color: "error",
      duration: options?.duration || 7000, // Errors stay longer
      actions: options?.actions,
    });
  };

  /**
   * Show a warning toast notification
   * Uses amber color for warnings
   */
  const warning = (title: string, options?: Omit<ToastOptions, "title">) => {
    toast.add({
      title,
      description: options?.description,
      icon: options?.icon || "i-lucide-alert-triangle",
      color: "warning",
      duration: options?.duration || 6000,
      actions: options?.actions,
    });
  };

  /**
   * Show an info toast notification
   * Uses primary (navy) color for informational messages
   */
  const info = (title: string, options?: Omit<ToastOptions, "title">) => {
    toast.add({
      title,
      description: options?.description,
      icon: options?.icon || "i-lucide-info",
      color: "primary",
      duration: options?.duration || 5000,
      actions: options?.actions,
    });
  };

  /**
   * Remove all toast notifications
   */
  const clear = () => {
    toast.clear();
  };

  return {
    success,
    error,
    warning,
    info,
    clear,
    // Expose the underlying toast instance for advanced usage
    toast,
  };
};
