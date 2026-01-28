<script setup lang="ts">
/**
 * Notification Settings Page
 *
 * Admin-only page for configuring NCR email notification recipients.
 * Allows setting Finance Team and Procurement Team email addresses.
 */

// SEO
useSeoMeta({
  title: "Notification Settings | Stock Management System",
  description: "Configure email recipients for NCR notifications",
});

definePageMeta({
  middleware: "role",
  roleRequired: "ADMIN",
});

// Auth & Permissions
const toast = useToast();
const { settings, isLoading, isSaving, error, fetchSettings, updateSettings } =
  useNotificationSettings();

// Local state for editing
const localFinanceEmails = ref<string[]>([]);
const localProcurementEmails = ref<string[]>([]);
const hasUnsavedChanges = ref(false);

// Fetch settings on mount
// Note: Role middleware handles auth check, so we can just fetch settings
onMounted(async () => {
  await fetchSettings();

  // Initialize local state from fetched settings
  if (settings.value) {
    localFinanceEmails.value = [...settings.value.finance_team_emails];
    localProcurementEmails.value = [...settings.value.procurement_team_emails];
  }
});

// Watch for settings changes to initialize local state
watch(
  settings,
  (newSettings) => {
    if (newSettings) {
      localFinanceEmails.value = [...newSettings.finance_team_emails];
      localProcurementEmails.value = [...newSettings.procurement_team_emails];
      hasUnsavedChanges.value = false;
    }
  },
  { immediate: true }
);

// Track changes
watch(
  [localFinanceEmails, localProcurementEmails],
  () => {
    if (settings.value) {
      const financeChanged =
        JSON.stringify(localFinanceEmails.value) !==
        JSON.stringify(settings.value.finance_team_emails);
      const procurementChanged =
        JSON.stringify(localProcurementEmails.value) !==
        JSON.stringify(settings.value.procurement_team_emails);
      hasUnsavedChanges.value = financeChanged || procurementChanged;
    }
  },
  { deep: true }
);

// Handle save
async function handleSave(): Promise<void> {
  const result = await updateSettings({
    finance_team_emails: localFinanceEmails.value,
    procurement_team_emails: localProcurementEmails.value,
  });

  if (result.success) {
    toast.add({
      title: "Settings Saved",
      description: "Notification settings have been updated successfully",
      color: "success",
    });
    hasUnsavedChanges.value = false;
  } else {
    toast.add({
      title: "Error",
      description: result.error || "Failed to save notification settings",
      color: "error",
    });
  }
}

// Reset changes
function handleReset(): void {
  if (settings.value) {
    localFinanceEmails.value = [...settings.value.finance_team_emails];
    localProcurementEmails.value = [...settings.value.procurement_team_emails];
    hasUnsavedChanges.value = false;
  }
}

// Format date for display
function formatDate(dateString: string | null): string {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-6">
    <!-- Page Header -->
    <div class="flex items-center gap-4">
      <UIcon name="i-lucide-bell" class="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-primary">Notification Settings</h1>
        <p class="hidden sm:block text-sm text-muted mt-1">
          Configure email recipients for NCR (Non-Conformance Report) notifications
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading settings..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" @retry="fetchSettings" />

    <!-- Settings Form -->
    <template v-else>
      <!-- Info Banner -->
      <UCard class="border-l-4 border-info bg-info/5" :ui="{ body: 'p-4' }">
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-info" class="w-5 h-5 text-info shrink-0 mt-0.5" />
          <div>
            <p class="text-sm text-default">
              When an NCR is created, automatic email notifications are sent to the configured
              recipients. Suppliers with registered email addresses will also receive notifications.
            </p>
          </div>
        </div>
      </UCard>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Finance Team Emails -->
        <UCard class="card-elevated">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <UIcon name="i-lucide-calculator" class="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h2 class="text-lg font-semibold">Finance Team</h2>
                <p class="text-sm text-muted">Receive all NCR notifications</p>
              </div>
            </div>
          </template>

          <SettingsNotificationEmailList
            v-model="localFinanceEmails"
            label="Email Addresses"
            description="Add email addresses for the Finance team members who should receive NCR notifications."
            :disabled="isSaving"
          />
        </UCard>

        <!-- Procurement Team Emails -->
        <UCard class="card-elevated">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <UIcon name="i-lucide-shopping-cart" class="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 class="text-lg font-semibold">Procurement Team</h2>
                <p class="text-sm text-muted">Receive all NCR notifications</p>
              </div>
            </div>
          </template>

          <SettingsNotificationEmailList
            v-model="localProcurementEmails"
            label="Email Addresses"
            description="Add email addresses for the Procurement team members who should receive NCR notifications."
            :disabled="isSaving"
          />
        </UCard>
      </div>

      <!-- Last Updated Info -->
      <div v-if="settings?.updated_at" class="text-sm text-muted">
        Last updated {{ formatDate(settings.updated_at) }}
        <span v-if="settings.updated_by">
          by {{ settings.updated_by.full_name || settings.updated_by.username }}
        </span>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="outline"
          :disabled="!hasUnsavedChanges || isSaving"
          class="cursor-pointer"
          @click="handleReset"
        >
          Reset
        </UButton>
        <UButton
          color="primary"
          :loading="isSaving"
          :disabled="!hasUnsavedChanges"
          class="cursor-pointer"
          @click="handleSave"
        >
          <UIcon name="i-lucide-save" class="w-4 h-4 mr-2" />
          Save Changes
        </UButton>
      </div>

      <!-- Supplier Note -->
      <UCard class="bg-muted/50" :ui="{ body: 'p-4' }">
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-building-2" class="w-5 h-5 text-muted shrink-0 mt-0.5" />
          <div>
            <h3 class="font-medium text-default mb-1">Supplier Notifications</h3>
            <p class="text-sm text-muted">
              Suppliers are automatically notified when an NCR is created against their delivery,
              using the email addresses registered in the
              <NuxtLink to="/suppliers" class="text-primary hover:underline">
                Supplier Management
              </NuxtLink>
              section.
            </p>
          </div>
        </div>
      </UCard>
    </template>
  </div>
</template>
