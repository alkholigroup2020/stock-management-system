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
interface ReconciliationData {
  reconciliation: {
    id: string;
    period_id: string;
    location_id: string;
    opening_stock: number;
    receipts: number;
    transfers_in: number;
    transfers_out: number;
    issues: number;
    closing_stock: number;
    adjustments: number;
    back_charges: number;
    credits: number;
    condemnations: number;
    last_updated: string;
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

interface Location {
  id: string;
  code: string;
  name: string;
}

// State
const loading = ref(false);
const error = ref<string | null>(null);
const reconciliationData = ref<ReconciliationData | null>(null);
const saving = ref(false);

// Editable adjustments
const adjustments = ref({
  back_charges: 0,
  credits: 0,
  condemnations: 0,
  adjustments: 0,
});

// For location selector (supervisor/admin)
const selectedLocationId = ref<string | null>(null);
const locations = ref<Location[]>([]);
const loadingLocations = ref(false);

// Computed
const activeLocationId = computed(() => {
  // Supervisor/Admin can select location, otherwise use active location
  if (isSupervisorOrAdmin.value && selectedLocationId.value) {
    return selectedLocationId.value;
  }
  return locationStore.activeLocationId;
});
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

  // If supervisor/admin, fetch all locations for selector
  if (isSupervisorOrAdmin.value) {
    await fetchLocations();
  }

  if (activeLocationId.value && currentPeriod.value) {
    await fetchReconciliation();
  }
});

/**
 * Fetch all locations (for supervisor/admin selector)
 */
async function fetchLocations() {
  loadingLocations.value = true;
  try {
    const response = await $fetch<{ locations: Location[] }>("/api/locations", {
      method: "GET",
    });
    locations.value = response.locations;

    // Set selected location to active location by default
    if (locationStore.activeLocationId) {
      selectedLocationId.value = locationStore.activeLocationId;
    } else if (locations.value.length > 0) {
      selectedLocationId.value = locations.value[0]!.id;
    }
  } catch (err: any) {
    console.error("Error fetching locations:", err);
  } finally {
    loadingLocations.value = false;
  }
}

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
    const response = await $fetch<ReconciliationData>(
      `/api/locations/${activeLocationId.value}/reconciliations/${currentPeriod.value.id}`,
      {
        method: "GET",
      }
    );

    reconciliationData.value = response;

    // Initialize editable adjustments with fetched values (default to 0 if undefined)
    adjustments.value = {
      back_charges: response.reconciliation.back_charges || 0,
      credits: response.reconciliation.credits || 0,
      condemnations: response.reconciliation.condemnations || 0,
      adjustments: response.reconciliation.adjustments || 0,
    };
  } catch (err: any) {
    console.error("Error fetching reconciliation:", err);
    const errorMessage = err?.data?.message || "Failed to fetch reconciliation";
    error.value = errorMessage;
    toast.error(errorMessage);
  } finally {
    loading.value = false;
  }
}

/**
 * Save adjustments
 */
async function saveAdjustments() {
  if (!activeLocationId.value || !currentPeriod.value) {
    toast.error("No location or period selected");
    return;
  }

  // Validate non-negative numbers
  if (
    adjustments.value.back_charges < 0 ||
    adjustments.value.credits < 0 ||
    adjustments.value.condemnations < 0 ||
    adjustments.value.adjustments < 0
  ) {
    toast.error("All adjustment values must be non-negative");
    return;
  }

  saving.value = true;

  try {
    const response = await $fetch<ReconciliationData>(
      `/api/locations/${activeLocationId.value}/reconciliations/${currentPeriod.value.id}`,
      {
        method: "PATCH",
        body: adjustments.value,
      }
    );

    reconciliationData.value = response;

    toast.success("Adjustments saved successfully");
  } catch (err: any) {
    console.error("Error saving adjustments:", err);
    const errorMessage = err?.data?.message || "Failed to save adjustments";
    toast.error(errorMessage);
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
  <div class="p-4 md:p-6">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-[var(--ui-text)]">Reconciliations</h1>
      <p class="text-sm text-[var(--ui-text-muted)] mt-1">
        Period-end stock reconciliation and consumption analysis
      </p>
    </div>

    <!-- Location Selector (Supervisor/Admin only) -->
    <div v-if="isSupervisorOrAdmin && locations.length > 0" class="mb-6">
      <UCard>
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium text-[var(--ui-text)]">Location:</label>
          <USelect
            v-model="selectedLocationId"
            :options="locations.map((loc) => ({ label: `${loc.code} - ${loc.name}`, value: loc.id }))"
            placeholder="Select location"
            :loading="loadingLocations"
            class="w-64"
          />
        </div>
      </UCard>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--ui-primary)]" />
      <span class="ml-3 text-[var(--ui-text-muted)]">Loading reconciliation...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="mb-6">
      <UAlert
        color="error"
        variant="soft"
        :title="error"
        :close-button="{ icon: 'i-heroicons-x-mark', color: 'error', variant: 'link' }"
        @close="error = null"
      />
    </div>

    <!-- No Period State -->
    <div v-else-if="!currentPeriod" class="text-center py-12">
      <UIcon name="i-heroicons-calendar-days" class="w-16 h-16 mx-auto text-[var(--ui-text-muted)]" />
      <h3 class="mt-4 text-lg font-medium text-[var(--ui-text)]">No Active Period</h3>
      <p class="mt-2 text-sm text-[var(--ui-text-muted)]">
        There is no active period to view reconciliation data.
      </p>
    </div>

    <!-- Reconciliation Data -->
    <div v-else-if="reconciliationData" class="space-y-6">
      <!-- Period and Location Info -->
      <UCard>
        <div class="flex items-center justify-between">
          <!-- Period Info -->
          <div>
            <h3 class="text-sm font-medium text-[var(--ui-text-muted)]">Period</h3>
            <p class="text-lg font-semibold text-[var(--ui-text)] mt-1">
              {{ reconciliationData.period.name }}
            </p>
            <p class="text-sm text-[var(--ui-text-muted)] mt-1">
              {{ formattedDateRange }}
            </p>
          </div>

          <!-- Location Info -->
          <div class="text-right">
            <h3 class="text-sm font-medium text-[var(--ui-text-muted)]">Location</h3>
            <p class="text-lg font-semibold text-[var(--ui-text)] mt-1">
              {{ reconciliationData.location.code }} - {{ reconciliationData.location.name }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Auto-calculated warning -->
      <UAlert
        v-if="reconciliationData.is_auto_calculated"
        color="primary"
        variant="soft"
        title="Auto-calculated"
        description="This reconciliation has been automatically calculated based on current transactions. Save adjustments to create a permanent record."
      />

      <!-- Stock Movement Summary (Read-only) -->
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold text-[var(--ui-text)]">Stock Movement</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Opening Stock -->
          <div>
            <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Opening Stock</h4>
            <p class="text-xl font-semibold text-[var(--ui-text)] mt-1">
              {{ formatCurrency(reconciliationData.reconciliation.opening_stock) }}
            </p>
          </div>

          <!-- Receipts -->
          <div>
            <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Receipts</h4>
            <p class="text-xl font-semibold text-[var(--ui-success)] mt-1">
              {{ formatCurrency(reconciliationData.reconciliation.receipts) }}
            </p>
          </div>

          <!-- Transfers In -->
          <div>
            <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Transfers In</h4>
            <p class="text-xl font-semibold text-[var(--ui-success)] mt-1">
              {{ formatCurrency(reconciliationData.reconciliation.transfers_in) }}
            </p>
          </div>

          <!-- Transfers Out -->
          <div>
            <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Transfers Out</h4>
            <p class="text-xl font-semibold text-[var(--ui-error)] mt-1">
              {{ formatCurrency(reconciliationData.reconciliation.transfers_out) }}
            </p>
          </div>

          <!-- Issues -->
          <div>
            <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Issues</h4>
            <p class="text-xl font-semibold text-[var(--ui-error)] mt-1">
              {{ formatCurrency(reconciliationData.reconciliation.issues) }}
            </p>
          </div>

          <!-- Closing Stock -->
          <div>
            <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Closing Stock</h4>
            <p class="text-xl font-semibold text-[var(--ui-text)] mt-1">
              {{ formatCurrency(reconciliationData.reconciliation.closing_stock) }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Adjustments (Editable) -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-[var(--ui-text)]">Adjustments</h2>
            <UBadge v-if="!isSupervisorOrAdmin" color="warning" variant="soft">
              Read-only
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Back-charges -->
          <div>
            <label class="block text-sm font-medium text-[var(--ui-text)] mb-2">
              Back-charges
            </label>
            <UInput
              v-model.number="adjustments.back_charges"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              :disabled="!isSupervisorOrAdmin"
            />
          </div>

          <!-- Credits Due -->
          <div>
            <label class="block text-sm font-medium text-[var(--ui-text)] mb-2">
              Credits Due
            </label>
            <UInput
              v-model.number="adjustments.credits"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              :disabled="!isSupervisorOrAdmin"
            />
          </div>

          <!-- Condemnations -->
          <div>
            <label class="block text-sm font-medium text-[var(--ui-text)] mb-2">
              Condemnations
            </label>
            <UInput
              v-model.number="adjustments.condemnations"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              :disabled="!isSupervisorOrAdmin"
            />
          </div>

          <!-- Other Adjustments -->
          <div>
            <label class="block text-sm font-medium text-[var(--ui-text)] mb-2">
              Other Adjustments
            </label>
            <UInput
              v-model.number="adjustments.adjustments"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              :disabled="!isSupervisorOrAdmin"
            />
          </div>
        </div>

        <!-- Save Button -->
        <div v-if="isSupervisorOrAdmin" class="mt-6 flex justify-end">
          <UButton
            color="primary"
            :loading="saving"
            :disabled="saving"
            @click="saveAdjustments"
          >
            Save Adjustments
          </UButton>
        </div>
      </UCard>

      <!-- Consumption Analysis -->
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold text-[var(--ui-text)]">Consumption Analysis</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Total Consumption -->
          <div>
            <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Total Consumption</h4>
            <p class="text-2xl font-bold text-[var(--ui-primary)] mt-1">
              {{ formatCurrency(reconciliationData.calculations.consumption) }}
            </p>
          </div>

          <!-- Total Mandays -->
          <div>
            <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Total Mandays</h4>
            <p class="text-2xl font-bold text-[var(--ui-text)] mt-1">
              {{ reconciliationData.calculations.total_mandays.toLocaleString() }}
            </p>
          </div>

          <!-- Manday Cost -->
          <div>
            <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Manday Cost</h4>
            <p class="text-2xl font-bold text-[var(--ui-success)] mt-1">
              {{
                reconciliationData.calculations.manday_cost
                  ? formatCurrency(reconciliationData.calculations.manday_cost)
                  : "N/A"
              }}
            </p>
            <p
              v-if="reconciliationData.calculations.total_mandays === 0"
              class="text-xs text-[var(--ui-text-muted)] mt-1"
            >
              No POB entries for this period
            </p>
          </div>
        </div>

        <!-- Breakdown Details -->
        <div class="mt-6 pt-6 border-t border-[var(--ui-border)]">
          <h3 class="text-sm font-medium text-[var(--ui-text-muted)] mb-4">
            Calculation Breakdown
          </h3>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-[var(--ui-text-muted)]">Stock Change:</span>
              <span class="font-medium text-[var(--ui-text)]">
                {{ formatCurrency(reconciliationData.calculations.breakdown.stock_change) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-[var(--ui-text-muted)]">Receipts + Transfers In:</span>
              <span class="font-medium text-[var(--ui-text)]">
                {{ formatCurrency(reconciliationData.calculations.breakdown.receipts_and_transfers) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-[var(--ui-text-muted)]">Issues + Stock Change:</span>
              <span class="font-medium text-[var(--ui-text)]">
                {{ formatCurrency(reconciliationData.calculations.breakdown.issues_and_stock_change) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-[var(--ui-text-muted)]">Total Adjustments:</span>
              <span class="font-medium text-[var(--ui-text)]">
                {{ formatCurrency(reconciliationData.calculations.total_adjustments) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-[var(--ui-text-muted)]">Variance Before Adjustments:</span>
              <span class="font-medium text-[var(--ui-text)]">
                {{
                  formatCurrency(
                    reconciliationData.calculations.breakdown.variance_before_adjustments
                  )
                }}
              </span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Last Updated Info -->
      <div v-if="reconciliationData.reconciliation.last_updated" class="text-center text-sm text-[var(--ui-text-muted)]">
        Last updated: {{ new Date(reconciliationData.reconciliation.last_updated).toLocaleString() }}
      </div>
    </div>
  </div>
</template>
