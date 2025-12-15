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
    condemnations: number;
  };
  calculations: {
    consumption: number;
    total_adjustments: number;
    total_mandays: number;
    manday_cost: number | null;
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
    const response = await $fetch<ReconciliationReportResponse>(
      `/api/reports/reconciliation`,
      {
        method: "GET",
        query: {
          periodId: currentPeriod.value.id,
          locationId: activeLocationId.value,
        },
      }
    );

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
 * Note: Save functionality requires API endpoint implementation
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

  // Note: Save functionality requires API endpoint implementation
  // For now, show a message that this feature is coming soon
  toast.info("Reconciliation adjustment saving will be available in a future update.");
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
  <div class="space-y-6">
    <!-- Page Header -->
    <LayoutPageHeader
      title="Reconciliations"
      icon="i-lucide-calculator"
      :show-location="true"
      :show-period="true"
      location-scope="current"
    />

    <!-- Location Selector (Supervisor/Admin only) -->
    <UCard v-if="isSupervisorOrAdmin && locations.length > 0">
      <div class="flex items-center gap-4">
        <label class="form-label">Location:</label>
        <USelectMenu
          v-model="selectedLocationId"
          :options="locations.map((loc) => ({ label: `${loc.code} - ${loc.name}`, value: loc.id }))"
          value-attribute="value"
          placeholder="Select location"
          class="w-64"
        />
      </div>
    </UCard>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" text="Loading reconciliation..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" :retry="fetchReconciliation" />

    <!-- No Period State -->
    <div v-else-if="!currentPeriod" class="text-center py-12">
      <EmptyState
        icon="i-lucide-calendar-x"
        title="No Active Period"
        description="There is no active period to view reconciliation data."
      />
    </div>

    <!-- Reconciliation Data -->
    <div v-else-if="reconciliationData" class="space-y-6">
      <!-- Period and Location Info -->
      <UCard>
        <div class="flex items-center justify-between">
          <!-- Period Info -->
          <div>
            <h3 class="text-caption text-muted">Period</h3>
            <p class="text-subheading font-semibold mt-1">
              {{ reconciliationData.period.name }}
            </p>
            <p class="text-caption mt-1">
              {{ formattedDateRange }}
            </p>
          </div>

          <!-- Location Info -->
          <div class="text-right">
            <h3 class="text-caption text-muted">Location</h3>
            <p class="text-subheading font-semibold mt-1">
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
          <h2 class="text-subheading font-semibold">Stock Movement</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Opening Stock -->
          <div>
            <h4 class="text-caption text-muted">Opening Stock</h4>
            <p class="text-heading font-semibold mt-1">
              {{ formatCurrency(reconciliationData.reconciliation.opening_stock) }}
            </p>
          </div>

          <!-- Receipts -->
          <div>
            <h4 class="text-caption text-muted">Receipts</h4>
            <p class="text-heading font-semibold text-success mt-1">
              {{ formatCurrency(reconciliationData.reconciliation.receipts) }}
            </p>
          </div>

          <!-- Transfers In -->
          <div>
            <h4 class="text-caption text-muted">Transfers In</h4>
            <p class="text-heading font-semibold text-success mt-1">
              {{ formatCurrency(reconciliationData.reconciliation.transfers_in) }}
            </p>
          </div>

          <!-- Transfers Out -->
          <div>
            <h4 class="text-caption text-muted">Transfers Out</h4>
            <p class="text-heading font-semibold text-error mt-1">
              {{ formatCurrency(reconciliationData.reconciliation.transfers_out) }}
            </p>
          </div>

          <!-- Issues -->
          <div>
            <h4 class="text-caption text-muted">Issues</h4>
            <p class="text-heading font-semibold text-error mt-1">
              {{ formatCurrency(reconciliationData.reconciliation.issues) }}
            </p>
          </div>

          <!-- Closing Stock -->
          <div>
            <h4 class="text-caption text-muted">Closing Stock</h4>
            <p class="text-heading font-semibold mt-1">
              {{ formatCurrency(reconciliationData.reconciliation.closing_stock) }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Adjustments (Editable) -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-subheading font-semibold">Adjustments</h2>
            <UBadge v-if="!isSupervisorOrAdmin" color="warning" variant="soft">Read-only</UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Back-charges -->
          <div>
            <label class="form-label">Back-charges</label>
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
            <label class="form-label">Credits Due</label>
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
            <label class="form-label">Condemnations</label>
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
            <label class="form-label">Other Adjustments</label>
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
            class="cursor-pointer"
            @click="saveAdjustments"
          >
            Save Adjustments
          </UButton>
        </div>
      </UCard>

      <!-- Consumption Analysis -->
      <UCard>
        <template #header>
          <h2 class="text-subheading font-semibold">Consumption Analysis</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Total Consumption -->
          <div>
            <h4 class="text-caption text-muted">Total Consumption</h4>
            <p class="text-display font-bold text-primary mt-1">
              {{ formatCurrency(reconciliationData.calculations.consumption) }}
            </p>
          </div>

          <!-- Total Mandays -->
          <div>
            <h4 class="text-caption text-muted">Total Mandays</h4>
            <p class="text-display font-bold mt-1">
              {{ reconciliationData.calculations.total_mandays.toLocaleString() }}
            </p>
          </div>

          <!-- Manday Cost -->
          <div>
            <h4 class="text-caption text-muted">Manday Cost</h4>
            <p class="text-display font-bold text-success mt-1">
              {{
                reconciliationData.calculations.manday_cost
                  ? formatCurrency(reconciliationData.calculations.manday_cost)
                  : "N/A"
              }}
            </p>
            <p v-if="reconciliationData.calculations.total_mandays === 0" class="text-caption mt-1">
              No POB entries for this period
            </p>
          </div>
        </div>

        <!-- Total Adjustments Summary -->
        <div class="mt-6 pt-6 border-t border-default">
          <div class="flex justify-between">
            <span class="text-muted">Total Adjustments:</span>
            <span class="text-body font-medium">
              {{ formatCurrency(reconciliationData.calculations.total_adjustments) }}
            </span>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
