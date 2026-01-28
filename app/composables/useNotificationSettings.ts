/**
 * Notification Settings Composable
 *
 * Provides API operations for managing NCR notification settings.
 * Admin-only functionality for configuring Finance and Procurement team emails.
 */

// Notification settings update payload type
export interface NotificationSettingsPayload {
  finance_team_emails: string[];
  procurement_team_emails: string[];
}

// API response types
export interface NotificationSettingsResponse {
  finance_team_emails: string[];
  procurement_team_emails: string[];
  updated_at: string | null;
  updated_by: {
    id: string;
    username: string;
    full_name: string | null;
  } | null;
}

export interface UpdateNotificationSettingsResponse {
  message: string;
  settings: NotificationSettingsResponse;
}

/**
 * Composable for managing notification settings
 */
export function useNotificationSettings() {
  const settings = ref<NotificationSettingsResponse | null>(null);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);

  /**
   * Fetch current notification settings
   */
  async function fetchSettings(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch<NotificationSettingsResponse>("/api/settings/notifications", {
        method: "GET",
      });
      settings.value = response;
    } catch (err: unknown) {
      const fetchError = err as { data?: { message?: string }; message?: string };
      error.value = fetchError.data?.message || fetchError.message || "Failed to fetch settings";
      console.error("[useNotificationSettings] Fetch error:", err);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Update notification settings
   */
  async function updateSettings(
    data: NotificationSettingsPayload
  ): Promise<{ success: boolean; error?: string }> {
    isSaving.value = true;
    error.value = null;

    try {
      const response = await $fetch<UpdateNotificationSettingsResponse>(
        "/api/settings/notifications",
        {
          method: "PUT",
          body: data,
        }
      );
      settings.value = response.settings;
      return { success: true };
    } catch (err: unknown) {
      const fetchError = err as {
        data?: { message?: string; details?: unknown };
        message?: string;
      };
      const errorMessage =
        fetchError.data?.message || fetchError.message || "Failed to update settings";
      error.value = errorMessage;
      console.error("[useNotificationSettings] Update error:", err);
      return { success: false, error: errorMessage };
    } finally {
      isSaving.value = false;
    }
  }

  /**
   * Add an email to a team list
   */
  function addEmail(
    team: "finance" | "procurement",
    email: string
  ): { valid: boolean; error?: string } {
    if (!settings.value) {
      return { valid: false, error: "Settings not loaded" };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: "Invalid email format" };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const list =
      team === "finance"
        ? settings.value.finance_team_emails
        : settings.value.procurement_team_emails;

    // Check for duplicates
    if (list.includes(normalizedEmail)) {
      return { valid: false, error: "Email already exists" };
    }

    // Add email
    list.push(normalizedEmail);
    return { valid: true };
  }

  /**
   * Remove an email from a team list
   */
  function removeEmail(team: "finance" | "procurement", email: string): void {
    if (!settings.value) return;

    const list =
      team === "finance"
        ? settings.value.finance_team_emails
        : settings.value.procurement_team_emails;

    const index = list.indexOf(email);
    if (index !== -1) {
      list.splice(index, 1);
    }
  }

  /**
   * Check if there are unsaved changes
   */
  const hasChanges = computed(() => {
    // This would need to compare against original values
    // For now, always return false (changes tracked separately in component)
    return false;
  });

  return {
    // State
    settings,
    isLoading,
    isSaving,
    error,
    hasChanges,

    // Actions
    fetchSettings,
    updateSettings,
    addEmail,
    removeEmail,
  };
}
