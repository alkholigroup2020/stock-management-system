<script setup lang="ts">
// SEO
useSeoMeta({
  title: "Reconciliations - Stock Management System",
  description: "Period-end stock reconciliations and consumption analysis",
});

// Composables
const locationStore = useLocationStore();
const periodStore = usePeriodStore();
const authStore = useAuthStore();
const toast = useAppToast();

// Types
interface LocationReconciliation {
  location_id: string;
  location_code: string;
  location_name: string;
  location_type: string;
  reconciliation: {
    opening_stock: number;
    receipts: number;
    transfers_in: number;
    transfers_out: number;
    issues: number;
    closing_stock: number;
    adjustments: number;
    back_charges: number;
    credits: number;
    ncr_credits?: number;
    ncr_losses?: number;
    condemnations: number;
  };
  calculations: {
    consumption: number;
    total_adjustments: number;
    total_mandays: number;
    manday_cost: number | null;
    breakdown: {
      receipts_and_transfers: number;
      issues_and_stock_change: number;
      stock_change: number;
      variance_before_adjustments: number;
    };
  };
  is_saved: boolean;
}

interface ReconciliationReportResponse {
  report_type: string;
  generated_at: string;
  period: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  locations: LocationReconciliation[];
}

interface ReconciliationData {
  reconciliation: {
    opening_stock: number;
    receipts: number;
    transfers_in: number;
    transfers_out: number;
    issues: number;
    closing_stock: number;
    adjustments: number;
    back_charges: number;
    credits: number;
    ncr_credits?: number;
    ncr_losses?: number;
    condemnations: number;
  };
  location: {
    id: string;
    code: string;
    name: string;
  };
  period: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  calculations: {
    consumption: number;
    total_adjustments: number;
    total_mandays: number;
    manday_cost: number | null;
    breakdown: {
      receipts_and_transfers: number;
      issues_and_stock_change: number;
      stock_change: number;
      variance_before_adjustments: number;
    };
  };
  is_auto_calculated: boolean;
}

// State
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const reconciliationData = ref<ReconciliationData | null>(null);

// Editable adjustments
const adjustments = ref({
  back_charges: 0,
  credits: 0,
  condemnations: 0,
  adjustments: 0,
});

// Computed - use main navbar location selector via store
const activeLocationId = computed(() => locationStore.activeLocationId);
const activeLocation = computed(() => locationStore.activeLocation);
const currentPeriod = computed(() => periodStore.currentPeriod);

const isSupervisorOrAdmin = computed(() => {
  const role = authStore.user?.role;
  return role === "SUPERVISOR" || role === "ADMIN";
});

// Watch for location or period changes
watch([activeLocationId, currentPeriod], async ([newLocationId, newPeriod]) => {
  if (newLocationId && newPeriod) {
    await fetchReconciliation();
  }
});

// Fetch data on mount
onMounted(async () => {
  if (!currentPeriod.value) {
    await periodStore.fetchCurrentPeriod();
  }

  if (activeLocationId.value && currentPeriod.value) {
    await fetchReconciliation();
  }
});

/**
 * Fetch reconciliation data for current location and period
 */
async function fetchReconciliation() {
  if (!activeLocationId.value || !currentPeriod.value) {
    error.value = "No location or period selected";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await $fetch<ReconciliationReportResponse>("/api/reports/reconciliation", {
      method: "GET",
      query: {
        periodId: currentPeriod.value.id,
        locationId: activeLocationId.value,
      },
    });

    // Extract the location data from the response
    const locationData = response.locations.find(
      (loc) => loc.location_id === activeLocationId.value
    );

    if (locationData) {
      reconciliationData.value = {
        reconciliation: locationData.reconciliation,
        location: {
          id: locationData.location_id,
          code: locationData.location_code,
          name: locationData.location_name,
        },
        period: response.period,
        calculations: locationData.calculations,
        is_auto_calculated: !locationData.is_saved,
      };

      // Initialize editable adjustments with fetched values (default to 0 if undefined)
      adjustments.value = {
        back_charges: locationData.reconciliation.back_charges || 0,
        credits: locationData.reconciliation.credits || 0,
        condemnations: locationData.reconciliation.condemnations || 0,
        adjustments: locationData.reconciliation.adjustments || 0,
      };
    } else {
      error.value = "No reconciliation data found for this location";
    }
  } catch (err: unknown) {
    console.error("Error fetching reconciliation:", err);
    const apiError = err as { data?: { message?: string } };
    const errorMessage = apiError?.data?.message || "Failed to fetch reconciliation";
    error.value = errorMessage;
    toast.error(errorMessage);
  } finally {
    loading.value = false;
  }
}

/**
 * Save adjustments
 */
async function saveAdjustments(values: {
  back_charges: number;
  credits: number;
  condemnations: number;
  adjustments: number;
}) {
  if (!activeLocationId.value || !currentPeriod.value) {
    toast.error("No location or period selected");
    return;
  }

  // Validate non-negative numbers
  if (
    values.back_charges < 0 ||
    values.credits < 0 ||
    values.condemnations < 0 ||
    values.adjustments < 0
  ) {
    toast.error("All adjustment values must be non-negative");
    return;
  }

  saving.value = true;

  try {
    await $fetch("/api/reconciliations", {
      method: "POST",
      body: {
        periodId: currentPeriod.value.id,
        locationId: activeLocationId.value,
        back_charges: values.back_charges,
        credits: values.credits,
        condemnations: values.condemnations,
        adjustments: values.adjustments,
      },
    });

    toast.success("Reconciliation adjustments saved successfully");

    // Refresh data after save
    await fetchReconciliation();
  } catch (err: unknown) {
    console.error("Error saving adjustments:", err);
    const apiError = err as { data?: { message?: string } };
    toast.error(apiError?.data?.message || "Failed to save adjustments");
  } finally {
    saving.value = false;
  }
}

/**
 * Format currency value
 */
function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) {
    return "SAR 0.00";
  }
  return `SAR ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format period date range
 */
const formattedDateRange = computed(() => {
  if (!reconciliationData.value) return "";

  const startDate = new Date(reconciliationData.value.period.start_date);
  const endDate = new Date(reconciliationData.value.period.end_date);

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
});
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Loading Overlay -->
    <LoadingOverlay
      v-if="saving"
      title="Saving Adjustments..."
      message="Please wait while we save your adjustments"
    />

    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-calculator" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl sm:text-3xl font-bold text-primary">Reconciliations</h1>
            <UBadge
              v-if="activeLocation"
              color="primary"
              variant="soft"
              size="md"
              class="hidden sm:inline-flex items-center gap-1"
            >
              <UIcon name="i-lucide-map-pin" class="h-3 w-3" />
              {{ activeLocation.name }}
            </UBadge>
            <UBadge
              v-if="currentPeriod"
              color="success"
              variant="soft"
              size="md"
              class="hidden sm:inline-flex items-center gap-1"
            >
              <UIcon name="i-lucide-calendar" class="h-3 w-3" />
              {{ currentPeriod.name }}
            </UBadge>
          </div>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Period-end stock reconciliations and consumption analysis
          </p>
          <!-- Mobile badges (smaller, below title) -->
          <div class="sm:hidden flex items-center gap-2 mt-1">
            <UBadge
              v-if="activeLocation"
              color="primary"
              variant="soft"
              size="sm"
              class="inline-flex items-center gap-1"
            >
              <UIcon name="i-lucide-map-pin" class="h-3 w-3" />
              {{ activeLocation.name }}
            </UBadge>
            <UBadge
              v-if="currentPeriod"
              color="success"
              variant="soft"
              size="sm"
              class="inline-flex items-center gap-1"
            >
              <UIcon name="i-lucide-calendar" class="h-3 w-3" />
              {{ currentPeriod.name }}
            </UBadge>
          </div>
        </div>
      </div>
      <UButton
        v-if="isSupervisorOrAdmin"
        color="primary"
        icon="i-lucide-building-2"
        size="lg"
        class="cursor-pointer rounded-full px-3 sm:px-6"
        to="/reconciliations/consolidated"
      >
        <span class="hidden sm:inline">Consolidated Reconciliation</span>
        <span class="sm:hidden">Consolidated</span>
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" @retry="fetchReconciliation" />

    <!-- No Period State -->
    <div v-else-if="!currentPeriod">
      <EmptyState
        icon="i-lucide-calendar-x"
        title="No Active Period"
        description="There is no active period to view reconciliation data."
      />
    </div>

    <!-- Reconciliation Data -->
    <template v-else-if="reconciliationData">
      <!-- Auto-calculated warning -->
      <UAlert
        v-if="reconciliationData.is_auto_calculated"
        color="primary"
        variant="soft"
        icon="i-lucide-info"
        title="Not Yet Confirmed"
        description="This reconciliation has been automatically calculated. Click 'Confirm Reconciliation' below to save it and enable period close for this location."
      />

      <!-- Period and Location Info -->
      <UCard class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Period Info -->
          <div>
            <h3 class="text-sm font-medium text-[var(--ui-text-muted)]">Period</h3>
            <p class="text-xl font-bold text-primary mt-1">
              {{ reconciliationData.period.name }}
            </p>
            <p class="text-sm text-[var(--ui-text-muted)] mt-1">
              {{ formattedDateRange }}
            </p>
          </div>

          <!-- Location Info -->
          <div class="text-left sm:text-right">
            <h3 class="text-sm font-medium text-[var(--ui-text-muted)]">Location</h3>
            <p class="text-xl font-bold text-primary mt-1">
              {{ reconciliationData.location.code }}
            </p>
            <p class="text-sm text-[var(--ui-text-muted)] mt-1">
              {{ reconciliationData.location.name }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Use ReconciliationSummary Component -->
      <ReconciliationSummary
        :reconciliation="reconciliationData.reconciliation"
        :calculations="reconciliationData.calculations"
        :show-breakdown="true"
      />

      <!-- Use AdjustmentsForm Component -->
      <ReconciliationAdjustmentsForm
        :back-charges="adjustments.back_charges"
        :credits="adjustments.credits"
        :ncr-credits="reconciliationData.reconciliation.ncr_credits"
        :ncr-losses="reconciliationData.reconciliation.ncr_losses"
        :condemnations="adjustments.condemnations"
        :adjustments="adjustments.adjustments"
        :read-only="!isSupervisorOrAdmin"
        :loading="saving"
        :is-auto-calculated="reconciliationData.is_auto_calculated"
        @save="saveAdjustments"
      />
    </template>
  </div>
</template>
