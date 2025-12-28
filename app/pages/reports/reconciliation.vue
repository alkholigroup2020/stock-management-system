<script setup lang="ts">
/**
 * Reconciliation Report Page
 *
 * Generates period-based reconciliation report showing opening stock,
 * receipts, transfers, issues, and closing values with consumption calculations.
 */

import type { PeriodStatus } from "@prisma/client";
import { generateSimpleCSV, downloadCSV, formatCurrencyForCSV } from "~/utils/csvExport";

// Page metadata
definePageMeta({
  title: "Reconciliation Report",
});

// Composables
const { isAtLeastSupervisor } = useAuth();
const locationStore = useLocationStore();
const periodStore = usePeriodStore();
const toast = useAppToast();

// State
const loading = ref(false);
const loadingPeriods = ref(false);
const exporting = ref(false);
const error = ref<string | null>(null);
const selectedPeriodId = ref<string>("");
const selectedLocationId = ref<string>("");

// Period data
interface PeriodOption {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: PeriodStatus;
}

const periods = ref<PeriodOption[]>([]);

// Report data types
interface LocationReconciliationSummary {
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

interface ReconciliationReport {
  report_type: string;
  generated_at: string;
  generated_by: {
    id: string;
    username: string;
  };
  period: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: PeriodStatus;
  };
  filters: {
    location_id: string | null;
  };
  locations: LocationReconciliationSummary[];
  grand_totals: {
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
    consumption: number;
    total_mandays: number;
    average_manday_cost: number | null;
  };
  summary: {
    total_locations: number;
    locations_with_saved_data: number;
    locations_with_calculated_data: number;
  };
}

const reportData = ref<ReconciliationReport | null>(null);

// Computed
const hasData = computed(() => {
  return reportData.value && reportData.value.locations.length > 0;
});

const periodOptions = computed(() => {
  return [
    { label: "Select a period", value: "" },
    ...periods.value.map((p) => ({
      label: `${p.name} (${p.status})`,
      value: p.id,
    })),
  ];
});

// Methods
const fetchPeriods = async () => {
  loadingPeriods.value = true;

  try {
    const data = await $fetch<{ periods: PeriodOption[] }>("/api/periods");
    periods.value = data.periods || [];

    // Auto-select current period if available
    if (periodStore.currentPeriod && !selectedPeriodId.value) {
      selectedPeriodId.value = periodStore.currentPeriod.id;
    } else if (periods.value.length > 0 && !selectedPeriodId.value) {
      selectedPeriodId.value = periods.value[0]?.id || "";
    }
  } catch (err: unknown) {
    const errorObj = err as { data?: { message?: string } };
    console.error("Error fetching periods:", errorObj);
  } finally {
    loadingPeriods.value = false;
  }
};

const fetchReport = async () => {
  if (!selectedPeriodId.value) {
    toast.warning("Period Required", { description: "Please select a period" });
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();
    params.append("periodId", selectedPeriodId.value);

    if (selectedLocationId.value) {
      params.append("locationId", selectedLocationId.value);
    }

    const data = await $fetch<ReconciliationReport>(
      `/api/reports/reconciliation?${params.toString()}`
    );
    reportData.value = data;
  } catch (err: unknown) {
    const errorObj = err as { data?: { message?: string } };
    error.value = errorObj?.data?.message || "Failed to fetch report";
    toast.error("Error", { description: error.value || undefined });
  } finally {
    loading.value = false;
  }
};

const clearFilters = () => {
  selectedLocationId.value = "";
  if (periods.value.length > 0) {
    selectedPeriodId.value = periods.value[0]?.id || "";
  }
  fetchReport();
};

const exportToCSV = () => {
  if (!reportData.value || !hasData.value) {
    toast.warning("No Data", { description: "No data to export" });
    return;
  }

  exporting.value = true;

  try {
    // Build CSV headers
    const headers = [
      "Location",
      "Location Code",
      "Opening Stock",
      "Receipts",
      "Transfers In",
      "Transfers Out",
      "Issues",
      "Closing Stock",
      "Adjustments",
      "Back Charges",
      "Credits",
      "Condemnations",
      "Consumption",
      "Total Mandays",
      "Manday Cost",
      "Data Status",
    ];

    // Build rows
    const rows: (string | number | null)[][] = [];

    for (const location of reportData.value.locations) {
      rows.push([
        location.location_name,
        location.location_code,
        formatCurrencyForCSV(location.reconciliation.opening_stock),
        formatCurrencyForCSV(location.reconciliation.receipts),
        formatCurrencyForCSV(location.reconciliation.transfers_in),
        formatCurrencyForCSV(location.reconciliation.transfers_out),
        formatCurrencyForCSV(location.reconciliation.issues),
        formatCurrencyForCSV(location.reconciliation.closing_stock),
        formatCurrencyForCSV(location.reconciliation.adjustments),
        formatCurrencyForCSV(location.reconciliation.back_charges),
        formatCurrencyForCSV(location.reconciliation.credits),
        formatCurrencyForCSV(location.reconciliation.condemnations),
        formatCurrencyForCSV(location.calculations.consumption),
        location.calculations.total_mandays,
        location.calculations.manday_cost
          ? formatCurrencyForCSV(location.calculations.manday_cost)
          : "",
        location.is_saved ? "Saved" : "Calculated",
      ]);
    }

    // Add totals row
    rows.push([
      "GRAND TOTAL",
      "",
      formatCurrencyForCSV(reportData.value.grand_totals.opening_stock),
      formatCurrencyForCSV(reportData.value.grand_totals.receipts),
      formatCurrencyForCSV(reportData.value.grand_totals.transfers_in),
      formatCurrencyForCSV(reportData.value.grand_totals.transfers_out),
      formatCurrencyForCSV(reportData.value.grand_totals.issues),
      formatCurrencyForCSV(reportData.value.grand_totals.closing_stock),
      formatCurrencyForCSV(reportData.value.grand_totals.adjustments),
      formatCurrencyForCSV(reportData.value.grand_totals.back_charges),
      formatCurrencyForCSV(reportData.value.grand_totals.credits),
      formatCurrencyForCSV(reportData.value.grand_totals.condemnations),
      formatCurrencyForCSV(reportData.value.grand_totals.consumption),
      reportData.value.grand_totals.total_mandays,
      reportData.value.grand_totals.average_manday_cost
        ? formatCurrencyForCSV(reportData.value.grand_totals.average_manday_cost)
        : "",
      "",
    ]);

    const csvContent = generateSimpleCSV(headers, rows);
    const periodName = reportData.value.period.name.replace(/\s+/g, "-");
    const filename = `reconciliation-report-${periodName}-${new Date().toISOString().split("T")[0]}`;
    downloadCSV(csvContent, filename);

    toast.success("Exported", { description: "Reconciliation report exported to CSV" });
  } finally {
    exporting.value = false;
  }
};

// Lifecycle
onMounted(async () => {
  if (locationStore.userLocations.length === 0) {
    await locationStore.fetchUserLocations();
  }
  if (!periodStore.currentPeriod) {
    await periodStore.fetchCurrentPeriod();
  }
  await fetchPeriods();

  if (selectedPeriodId.value) {
    fetchReport();
  }
});
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <!-- Responsive icon size - NO background, NO border -->
        <UIcon name="i-lucide-calculator" class="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
        <div>
          <!-- Responsive title size -->
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Reconciliation Report</h1>
          <!-- Description: hidden on mobile, visible on sm+ -->
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Period-based stock reconciliation analysis
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          size="lg"
          to="/reports"
          class="cursor-pointer px-3 sm:px-5"
        >
          <span class="hidden sm:inline">Back</span>
        </UButton>
        <!-- Export Button (Supervisor+ only) -->
        <UButton
          v-if="isAtLeastSupervisor"
          icon="i-lucide-download"
          color="primary"
          size="lg"
          :loading="exporting"
          :disabled="loading || !hasData || exporting"
          class="cursor-pointer rounded-full px-3 sm:px-5"
          @click="exportToCSV"
        >
          <span class="hidden sm:inline">Export</span>
        </UButton>
      </div>
    </div>

    <!-- Filters -->
    <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
      <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-4">Filters</h3>

      <!-- Desktop: Grid layout (lg and above) -->
      <div class="hidden lg:grid lg:grid-cols-4 gap-3">
        <!-- Period Filter (Required) -->
        <UFormField label="Period" required class="w-full">
          <USelectMenu
            v-model="selectedPeriodId"
            :items="periodOptions"
            :loading="loadingPeriods"
            placeholder="Select period"
            value-key="value"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <!-- Location Filter -->
        <UFormField v-if="isAtLeastSupervisor" label="Location" class="w-full">
          <USelectMenu
            v-model="selectedLocationId"
            :items="[
              { label: 'All Locations', value: '' },
              ...locationStore.userLocations.map((loc) => ({
                label: `${loc.name} (${loc.code})`,
                value: loc.id,
              })),
            ]"
            placeholder="Select location"
            value-key="value"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <!-- Spacer (when not supervisor) -->
        <div v-if="!isAtLeastSupervisor" />

        <!-- Spacer -->
        <div />

        <!-- Actions -->
        <UFormField label="Actions" class="w-full">
          <div class="flex gap-2">
            <UButton
              color="primary"
              size="lg"
              :loading="loading"
              :disabled="!selectedPeriodId || loading"
              class="cursor-pointer rounded-full"
              @click="fetchReport"
            >
              Generate
            </UButton>
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              class="cursor-pointer rounded-full"
              @click="clearFilters"
            >
              Clear
            </UButton>
          </div>
        </UFormField>
      </div>

      <!-- Mobile: Stacked layout (below lg) -->
      <div class="flex flex-col gap-3 lg:hidden">
        <!-- Period and Location -->
        <div class="grid grid-cols-1 gap-3">
          <UFormField label="Period" required>
            <USelectMenu
              v-model="selectedPeriodId"
              :items="periodOptions"
              :loading="loadingPeriods"
              placeholder="Period"
              value-key="value"
              size="lg"
              class="w-full"
            />
          </UFormField>
          <UFormField v-if="isAtLeastSupervisor" label="Location">
            <USelectMenu
              v-model="selectedLocationId"
              :items="[
                { label: 'All Locations', value: '' },
                ...locationStore.userLocations.map((loc) => ({
                  label: `${loc.name} (${loc.code})`,
                  value: loc.id,
                })),
              ]"
              placeholder="Location"
              value-key="value"
              size="lg"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <UButton
            color="primary"
            size="lg"
            :loading="loading"
            :disabled="!selectedPeriodId || loading"
            class="cursor-pointer flex-1"
            @click="fetchReport"
          >
            Generate
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            size="lg"
            class="cursor-pointer"
            icon="i-lucide-x"
            @click="clearFilters"
          />
        </div>
      </div>
    </UCard>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <LoadingSpinner size="lg" text="Generating report..." />
    </div>

    <!-- Error State -->
    <div v-else-if="error">
      <ErrorAlert :message="error" :retry="fetchReport" />
    </div>

    <!-- Report Content -->
    <template v-else-if="reportData">
      <!-- Period Info -->
      <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-calendar" class="text-primary" />
            <span class="font-semibold">{{ reportData.period.name }}</span>
          </div>
          <UBadge
            :color="reportData.period.status === 'OPEN' ? 'success' : 'neutral'"
            variant="subtle"
          >
            {{ reportData.period.status }}
          </UBadge>
          <span class="text-caption">
            {{ formatDateRange(reportData.period.start_date, reportData.period.end_date) }}
          </span>
          <span class="text-caption ml-auto">
            Generated: {{ formatDateTime(reportData.generated_at) }}
          </span>
        </div>
      </UCard>

      <!-- Grand Totals Summary -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Opening Stock</p>
          <p class="text-2xl sm:text-3xl font-bold text-[var(--ui-text)] mt-1">
            {{ reportData ? formatCurrency(reportData.grand_totals.opening_stock) : "" }}
          </p>
        </UCard>
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Receipts</p>
          <p class="text-2xl sm:text-3xl font-bold text-emerald-500 dark:text-emerald-400 mt-1">
            + {{ reportData ? formatCurrency(reportData.grand_totals.receipts) : "" }}
          </p>
        </UCard>
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Transfers In</p>
          <p class="text-2xl sm:text-3xl font-bold text-blue-500 dark:text-blue-400 mt-1">
            + {{ reportData ? formatCurrency(reportData.grand_totals.transfers_in) : "" }}
          </p>
        </UCard>
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Transfers Out</p>
          <p class="text-2xl sm:text-3xl font-bold text-amber-500 dark:text-amber-400 mt-1">
            - {{ reportData ? formatCurrency(reportData.grand_totals.transfers_out) : "" }}
          </p>
        </UCard>
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Issues</p>
          <p class="text-2xl sm:text-3xl font-bold text-red-500 dark:text-red-400 mt-1">
            - {{ reportData ? formatCurrency(reportData.grand_totals.issues) : "" }}
          </p>
        </UCard>
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Closing Stock</p>
          <p class="text-2xl sm:text-3xl font-bold text-primary mt-1">
            {{ reportData ? formatCurrency(reportData.grand_totals.closing_stock) : "" }}
          </p>
        </UCard>
      </div>

      <!-- Consumption Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <UCard class="card-elevated border-l-4 border-l-primary" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Total Consumption</p>
          <p class="text-2xl sm:text-3xl font-bold text-primary mt-1">
            {{ reportData ? formatCurrency(reportData.grand_totals.consumption) : "" }}
          </p>
        </UCard>
        <UCard
          class="card-elevated border-l-4 border-l-emerald-500 dark:border-l-emerald-400"
          :ui="{ body: 'p-3 sm:p-4' }"
        >
          <p class="text-sm text-[var(--ui-text-muted)]">Total Mandays</p>
          <p class="text-2xl sm:text-3xl font-bold text-[var(--ui-text)] mt-1">
            {{ reportData ? reportData.grand_totals.total_mandays.toLocaleString() : "" }}
          </p>
        </UCard>
        <UCard
          class="card-elevated border-l-4 border-l-blue-500 dark:border-l-blue-400"
          :ui="{ body: 'p-3 sm:p-4' }"
        >
          <p class="text-sm text-[var(--ui-text-muted)]">Average Manday Cost</p>
          <p class="text-2xl sm:text-3xl font-bold text-[var(--ui-text)] mt-1">
            {{
              reportData && reportData.grand_totals.average_manday_cost
                ? formatCurrency(reportData.grand_totals.average_manday_cost)
                : "N/A"
            }}
          </p>
        </UCard>
      </div>

      <!-- Location Details Table -->
      <UCard v-if="hasData" class="card-elevated">
        <template #header>
          <div>
            <h3 class="text-lg font-semibold text-[var(--ui-text)]">Location Breakdown</h3>
            <p class="text-sm text-[var(--ui-text-muted)] mt-1">
              {{ reportData?.summary.total_locations ?? 0 }} locations |
              {{ reportData?.summary.locations_with_saved_data ?? 0 }} with saved data |
              {{ reportData?.summary.locations_with_calculated_data ?? 0 }} calculated
            </p>
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-[var(--ui-bg-elevated)]">
              <tr>
                <th class="px-4 py-3 text-left font-semibold">Location</th>
                <th class="px-4 py-3 text-right font-semibold">Opening</th>
                <th class="px-4 py-3 text-right font-semibold">Receipts</th>
                <th class="px-4 py-3 text-right font-semibold">Trans In</th>
                <th class="px-4 py-3 text-right font-semibold">Trans Out</th>
                <th class="px-4 py-3 text-right font-semibold">Issues</th>
                <th class="px-4 py-3 text-right font-semibold">Closing</th>
                <th class="px-4 py-3 text-right font-semibold">Consumption</th>
                <th class="px-4 py-3 text-right font-semibold">Mandays</th>
                <th class="px-4 py-3 text-right font-semibold">Cost/Day</th>
                <th class="px-4 py-3 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="location in reportData?.locations ?? []"
                :key="location.location_id"
                class="border-b border-[var(--ui-border)] hover:bg-[var(--ui-bg-elevated)]/50"
              >
                <td class="px-4 py-3">
                  <div>
                    <p class="font-medium">{{ location.location_name }}</p>
                    <p class="text-caption">{{ location.location_code }}</p>
                  </div>
                </td>
                <td class="px-4 py-3 text-right font-mono">
                  {{ formatCurrency(location.reconciliation.opening_stock) }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-emerald-500">
                  {{ formatCurrency(location.reconciliation.receipts) }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-blue-500">
                  {{ formatCurrency(location.reconciliation.transfers_in) }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-amber-500">
                  {{ formatCurrency(location.reconciliation.transfers_out) }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-red-500">
                  {{ formatCurrency(location.reconciliation.issues) }}
                </td>
                <td class="px-4 py-3 text-right font-mono font-semibold">
                  {{ formatCurrency(location.reconciliation.closing_stock) }}
                </td>
                <td class="px-4 py-3 text-right font-mono font-semibold text-primary">
                  {{ formatCurrency(location.calculations.consumption) }}
                </td>
                <td class="px-4 py-3 text-right">
                  {{ location.calculations.total_mandays.toLocaleString() }}
                </td>
                <td class="px-4 py-3 text-right font-mono">
                  {{
                    location.calculations.manday_cost
                      ? formatCurrency(location.calculations.manday_cost)
                      : "-"
                  }}
                </td>
                <td class="px-4 py-3 text-center">
                  <UBadge
                    :color="location.is_saved ? 'success' : 'neutral'"
                    variant="subtle"
                    size="xs"
                  >
                    {{ location.is_saved ? "Saved" : "Calc" }}
                  </UBadge>
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-[var(--ui-bg-elevated)] font-semibold">
              <tr>
                <td class="px-4 py-3">TOTAL</td>
                <td class="px-4 py-3 text-right font-mono">
                  {{ reportData ? formatCurrency(reportData.grand_totals.opening_stock) : "" }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-emerald-500">
                  {{ reportData ? formatCurrency(reportData.grand_totals.receipts) : "" }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-blue-500">
                  {{ reportData ? formatCurrency(reportData.grand_totals.transfers_in) : "" }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-amber-500">
                  {{ reportData ? formatCurrency(reportData.grand_totals.transfers_out) : "" }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-red-500">
                  {{ reportData ? formatCurrency(reportData.grand_totals.issues) : "" }}
                </td>
                <td class="px-4 py-3 text-right font-mono">
                  {{ reportData ? formatCurrency(reportData.grand_totals.closing_stock) : "" }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-primary">
                  {{ reportData ? formatCurrency(reportData.grand_totals.consumption) : "" }}
                </td>
                <td class="px-4 py-3 text-right">
                  {{ reportData ? reportData.grand_totals.total_mandays.toLocaleString() : "" }}
                </td>
                <td class="px-4 py-3 text-right font-mono">
                  {{
                    reportData && reportData.grand_totals.average_manday_cost
                      ? formatCurrency(reportData.grand_totals.average_manday_cost)
                      : "-"
                  }}
                </td>
                <td class="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </UCard>

      <!-- Empty State -->
      <UCard v-else class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <div class="py-16">
          <EmptyState
            icon="i-lucide-calculator"
            title="No reconciliation data"
            description="No reconciliation data found for the selected period."
          />
        </div>
      </UCard>
    </template>

    <!-- No Period Selected -->
    <div v-else class="py-16">
      <EmptyState
        icon="i-lucide-calendar"
        title="Select a Period"
        description="Please select a period to generate the reconciliation report."
      />
    </div>
  </div>
</template>
