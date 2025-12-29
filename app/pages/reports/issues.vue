<script setup lang="ts">
/**
 * Issues Report Page
 *
 * Generates stock consumption report by location and cost centre
 * with top consumed items analysis.
 */

import type { PeriodStatus, CostCentre } from "~~/shared/types/database";
import {
  generateSimpleCSV,
  downloadCSV,
  formatCurrencyForCSV,
  formatDateForCSV,
  formatNumberForCSV,
} from "~/utils/csvExport";

// Page metadata
definePageMeta({
  title: "Issues Report",
});

// Composables
const { isAtLeastSupervisor } = useAuth();
const locationStore = useLocationStore();
const toast = useAppToast();

// State
const loading = ref(false);
const loadingPeriods = ref(false);
const exporting = ref(false);
const exportingDetailed = ref(false);
const error = ref<string | null>(null);
const selectedPeriodId = ref<string>("");
const selectedLocationId = ref<string>("");
const selectedCostCentre = ref<CostCentre | "">("");
const startDate = ref<string>("");
const endDate = ref<string>("");

// Period data
interface PeriodOption {
  id: string;
  name: string;
  status: PeriodStatus;
}

const periods = ref<PeriodOption[]>([]);

// Report data types
interface IssueLineReport {
  item_code: string;
  item_name: string;
  item_unit: string;
  quantity: number;
  wac_at_issue: number;
  line_value: number;
}

interface IssueReport {
  id: string;
  issue_no: string;
  issue_date: string;
  location_code: string;
  location_name: string;
  period_name: string;
  cost_centre: CostCentre;
  total_value: number;
  poster_name: string;
  posted_at: string;
  notes: string | null;
  line_count: number;
  lines: IssueLineReport[];
}

interface LocationIssueSummary {
  location_id: string;
  location_code: string;
  location_name: string;
  issue_count: number;
  total_value: number;
  by_cost_centre: {
    FOOD: number;
    CLEAN: number;
    OTHER: number;
  };
}

interface CostCentreSummary {
  cost_centre: CostCentre;
  issue_count: number;
  total_value: number;
  line_count: number;
  top_items: Array<{
    item_code: string;
    item_name: string;
    total_quantity: number;
    total_value: number;
  }>;
}

interface IssuesReportData {
  report_type: string;
  generated_at: string;
  generated_by: {
    id: string;
    username: string;
  };
  filters: {
    period_id: string | null;
    location_id: string | null;
    cost_centre: CostCentre | null;
    start_date: string | null;
    end_date: string | null;
  };
  period: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: PeriodStatus;
  } | null;
  issues: IssueReport[];
  by_location: LocationIssueSummary[];
  by_cost_centre: CostCentreSummary[];
  grand_totals: {
    total_issues: number;
    total_value: number;
    total_line_items: number;
    by_cost_centre: {
      FOOD: { count: number; value: number };
      CLEAN: { count: number; value: number };
      OTHER: { count: number; value: number };
    };
  };
}

const reportData = ref<IssuesReportData | null>(null);

// Computed
const hasData = computed(() => {
  return reportData.value && reportData.value.issues.length > 0;
});

const costCentreOptions = [
  { label: "All Cost Centres", value: "" },
  { label: "Food", value: "FOOD" },
  { label: "Cleaning", value: "CLEAN" },
  { label: "Other", value: "OTHER" },
];

// Methods
const fetchPeriods = async () => {
  loadingPeriods.value = true;

  try {
    const data = await $fetch<{ periods: PeriodOption[] }>("/api/periods");
    periods.value = data.periods || [];
  } catch (err: unknown) {
    const errorObj = err as { data?: { message?: string } };
    console.error("Error fetching periods:", errorObj);
  } finally {
    loadingPeriods.value = false;
  }
};

const fetchReport = async () => {
  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();

    if (selectedPeriodId.value) {
      params.append("periodId", selectedPeriodId.value);
    }
    if (selectedLocationId.value) {
      params.append("locationId", selectedLocationId.value);
    }
    if (selectedCostCentre.value) {
      params.append("costCentre", selectedCostCentre.value);
    }
    if (startDate.value) {
      params.append("startDate", startDate.value);
    }
    if (endDate.value) {
      params.append("endDate", endDate.value);
    }

    const data = await $fetch<IssuesReportData>(`/api/reports/issues?${params.toString()}`);
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
  selectedPeriodId.value = "";
  selectedLocationId.value = "";
  selectedCostCentre.value = "";
  startDate.value = "";
  endDate.value = "";
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
      "Issue No",
      "Date",
      "Location",
      "Cost Centre",
      "Period",
      "Total Value",
      "Line Items",
      "Posted By",
      "Notes",
    ];

    // Build rows
    const rows: (string | number | null)[][] = [];

    for (const issue of reportData.value.issues) {
      rows.push([
        issue.issue_no,
        formatDateForCSV(issue.issue_date),
        issue.location_name,
        issue.cost_centre,
        issue.period_name,
        formatCurrencyForCSV(issue.total_value),
        issue.line_count,
        issue.poster_name,
        issue.notes || "",
      ]);
    }

    const csvContent = generateSimpleCSV(headers, rows);
    const filename = `issues-report-${new Date().toISOString().split("T")[0]}`;
    downloadCSV(csvContent, filename);

    toast.success("Exported", { description: "Issues report exported to CSV" });
  } finally {
    exporting.value = false;
  }
};

const exportDetailedCSV = () => {
  if (!reportData.value || !hasData.value) {
    toast.warning("No Data", { description: "No data to export" });
    return;
  }

  exportingDetailed.value = true;

  try {
    // Build CSV headers for detailed line items
    const headers = [
      "Issue No",
      "Date",
      "Location",
      "Cost Centre",
      "Item Code",
      "Item Name",
      "Unit",
      "Quantity",
      "WAC at Issue",
      "Line Value",
    ];

    // Build rows
    const rows: (string | number | null)[][] = [];

    for (const issue of reportData.value.issues) {
      for (const line of issue.lines) {
        rows.push([
          issue.issue_no,
          formatDateForCSV(issue.issue_date),
          issue.location_name,
          issue.cost_centre,
          line.item_code,
          line.item_name,
          line.item_unit,
          formatNumberForCSV(line.quantity, 4),
          formatCurrencyForCSV(line.wac_at_issue),
          formatCurrencyForCSV(line.line_value),
        ]);
      }
    }

    const csvContent = generateSimpleCSV(headers, rows);
    const filename = `issues-detailed-${new Date().toISOString().split("T")[0]}`;
    downloadCSV(csvContent, filename);

    toast.success("Exported", { description: "Detailed issues exported to CSV" });
  } finally {
    exportingDetailed.value = false;
  }
};

const getCostCentreColor = (cc: CostCentre) => {
  switch (cc) {
    case "FOOD":
      return "text-emerald-500 dark:text-emerald-400";
    case "CLEAN":
      return "text-blue-500 dark:text-blue-400";
    case "OTHER":
      return "text-amber-500 dark:text-amber-400";
    default:
      return "";
  }
};

const getCostCentreBadgeColor = (cc: CostCentre): "success" | "info" | "warning" => {
  switch (cc) {
    case "FOOD":
      return "success";
    case "CLEAN":
      return "info";
    case "OTHER":
      return "warning";
    default:
      return "info";
  }
};

// Lifecycle
onMounted(async () => {
  if (locationStore.userLocations.length === 0) {
    await locationStore.fetchUserLocations();
  }
  await fetchPeriods();
  fetchReport();
});
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <!-- Responsive icon size - NO background, NO border -->
        <UIcon name="i-lucide-package-minus" class="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
        <div>
          <!-- Responsive title size -->
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Issues Report</h1>
          <!-- Description: hidden on mobile, visible on sm+ -->
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Stock consumption by location and cost centre
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
        <!-- Export Buttons (Supervisor+ only) -->
        <template v-if="isAtLeastSupervisor">
          <UButton
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
          <UButton
            icon="i-lucide-file-spreadsheet"
            color="neutral"
            variant="outline"
            size="lg"
            :loading="exportingDetailed"
            :disabled="loading || !hasData || exportingDetailed"
            class="cursor-pointer rounded-full px-3"
            @click="exportDetailedCSV"
          >
            <span class="hidden lg:inline">Detail</span>
          </UButton>
        </template>
      </div>
    </div>

    <!-- Filters -->
    <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
      <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-4">Filters</h3>

      <!-- Desktop: Grid layout (lg and above) -->
      <div class="hidden lg:grid lg:grid-cols-6 gap-3">
        <!-- Period Filter -->
        <UFormField label="Period" class="w-full">
          <USelectMenu
            v-model="selectedPeriodId"
            :items="[
              { label: 'All Periods', value: '' },
              ...periods.map((p) => ({ label: p.name, value: p.id })),
            ]"
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

        <!-- Cost Centre Filter -->
        <UFormField label="Cost Centre" class="w-full">
          <USelectMenu
            v-model="selectedCostCentre"
            :items="costCentreOptions"
            placeholder="Select cost centre"
            value-key="value"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <!-- Start Date -->
        <UFormField label="From Date" class="w-full">
          <UInput v-model="startDate" type="date" size="lg" class="w-full" />
        </UFormField>

        <!-- End Date -->
        <UFormField label="To Date" class="w-full">
          <UInput v-model="endDate" type="date" size="lg" class="w-full" />
        </UFormField>

        <!-- Actions -->
        <UFormField label="Actions" class="w-full">
          <div class="flex gap-2">
            <UButton
              color="primary"
              size="lg"
              :loading="loading"
              :disabled="loading"
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
        <!-- Period, Location, Cost Centre -->
        <div class="grid grid-cols-1 gap-3">
          <UFormField label="Period">
            <USelectMenu
              v-model="selectedPeriodId"
              :items="[
                { label: 'All Periods', value: '' },
                ...periods.map((p) => ({ label: p.name, value: p.id })),
              ]"
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
          <UFormField label="Cost Centre">
            <USelectMenu
              v-model="selectedCostCentre"
              :items="costCentreOptions"
              placeholder="Cost Centre"
              value-key="value"
              size="lg"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Date Range -->
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="From">
            <UInput v-model="startDate" type="date" size="lg" class="w-full" />
          </UFormField>
          <UFormField label="To">
            <UInput v-model="endDate" type="date" size="lg" class="w-full" />
          </UFormField>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <UButton
            color="primary"
            size="lg"
            :loading="loading"
            :disabled="loading"
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
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Total Issues</p>
          <p class="text-2xl sm:text-3xl font-bold text-primary mt-1">
            {{ reportData.grand_totals.total_issues }}
          </p>
        </UCard>
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Total Value</p>
          <p class="text-2xl sm:text-3xl font-bold text-red-500 dark:text-red-400 mt-1">
            {{ formatCurrency(reportData.grand_totals.total_value) }}
          </p>
        </UCard>
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Line Items</p>
          <p class="text-2xl sm:text-3xl font-bold text-[var(--ui-text)] mt-1">
            {{ reportData.grand_totals.total_line_items }}
          </p>
        </UCard>
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Cost Centres</p>
          <div class="flex gap-2 mt-1">
            <UBadge color="success" variant="subtle" size="xs">
              FOOD: {{ reportData.grand_totals.by_cost_centre.FOOD.count }}
            </UBadge>
            <UBadge color="info" variant="subtle" size="xs">
              CLEAN: {{ reportData.grand_totals.by_cost_centre.CLEAN.count }}
            </UBadge>
          </div>
        </UCard>
      </div>

      <!-- Cost Centre Breakdown -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <UCard
          v-for="cc in reportData.by_cost_centre"
          :key="cc.cost_centre"
          class="card-elevated"
          :ui="{ body: 'p-3 sm:p-4' }"
        >
          <div class="flex items-center justify-between mb-3">
            <UBadge :color="getCostCentreBadgeColor(cc.cost_centre)" variant="subtle">
              {{ cc.cost_centre }}
            </UBadge>
            <span class="text-sm text-[var(--ui-text-muted)]">{{ cc.issue_count }} issues</span>
          </div>
          <p class="text-2xl font-bold" :class="getCostCentreColor(cc.cost_centre)">
            {{ formatCurrency(cc.total_value) }}
          </p>

          <!-- Top Items -->
          <div v-if="cc.top_items.length > 0" class="mt-4">
            <p class="text-sm font-medium text-[var(--ui-text-muted)] mb-2">Top Consumed Items</p>
            <div class="space-y-1">
              <div
                v-for="(item, idx) in cc.top_items.slice(0, 5)"
                :key="item.item_code"
                class="flex justify-between text-sm"
              >
                <span class="truncate text-[var(--ui-text)]">
                  {{ idx + 1 }}. {{ item.item_name }}
                </span>
                <span class="font-mono text-[var(--ui-text-muted)]">
                  {{ formatCurrency(item.total_value) }}
                </span>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- By Location Summary -->
      <UCard v-if="reportData.by_location.length > 0" class="card-elevated">
        <template #header>
          <h3 class="text-lg font-semibold text-[var(--ui-text)]">By Location</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            v-for="loc in reportData.by_location"
            :key="loc.location_id"
            class="p-3 rounded-lg bg-[var(--ui-bg-muted)]"
          >
            <p class="font-medium text-[var(--ui-text)]">{{ loc.location_name }}</p>
            <p class="text-sm text-[var(--ui-text-muted)]">{{ loc.issue_count }} issues</p>
            <p class="text-red-500 dark:text-red-400 font-semibold">
              {{ formatCurrency(loc.total_value) }}
            </p>
            <div class="flex gap-2 mt-2 text-xs">
              <span class="text-emerald-500 dark:text-emerald-400">
                F: {{ formatCurrency(loc.by_cost_centre.FOOD) }}
              </span>
              <span class="text-blue-500 dark:text-blue-400">
                C: {{ formatCurrency(loc.by_cost_centre.CLEAN) }}
              </span>
              <span class="text-amber-500 dark:text-amber-400">
                O: {{ formatCurrency(loc.by_cost_centre.OTHER) }}
              </span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Issues Table -->
      <UCard v-if="hasData" class="card-elevated">
        <template #header>
          <h3 class="text-lg font-semibold text-[var(--ui-text)]">Issue List</h3>
        </template>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-[var(--ui-bg-elevated)]">
              <tr>
                <th class="px-4 py-3 text-left font-semibold">Issue</th>
                <th class="px-4 py-3 text-left font-semibold">Date</th>
                <th class="px-4 py-3 text-left font-semibold">Location</th>
                <th class="px-4 py-3 text-center font-semibold">Cost Centre</th>
                <th class="px-4 py-3 text-right font-semibold">Value</th>
                <th class="px-4 py-3 text-right font-semibold">Items</th>
                <th class="px-4 py-3 text-left font-semibold">Posted By</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="issue in reportData.issues"
                :key="issue.id"
                class="border-b border-[var(--ui-border)] hover:bg-[var(--ui-bg-elevated)]/50"
              >
                <td class="px-4 py-3">
                  <p class="font-medium font-mono">{{ issue.issue_no }}</p>
                </td>
                <td class="px-4 py-3">{{ formatDate(issue.issue_date) }}</td>
                <td class="px-4 py-3">
                  <div>
                    <p class="font-medium">{{ issue.location_name }}</p>
                    <p class="text-sm text-[var(--ui-text-muted)]">{{ issue.location_code }}</p>
                  </div>
                </td>
                <td class="px-4 py-3 text-center">
                  <UBadge
                    :color="getCostCentreBadgeColor(issue.cost_centre)"
                    variant="subtle"
                    size="sm"
                  >
                    {{ issue.cost_centre }}
                  </UBadge>
                </td>
                <td
                  class="px-4 py-3 text-right font-mono font-semibold text-red-500 dark:text-red-400"
                >
                  {{ formatCurrency(issue.total_value) }}
                </td>
                <td class="px-4 py-3 text-right">{{ issue.line_count }}</td>
                <td class="px-4 py-3">{{ issue.poster_name }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <!-- Empty State -->
      <div v-else class="py-16">
        <EmptyState
          icon="i-lucide-package-minus"
          title="No issues"
          description="No issues found matching the selected filters."
        />
      </div>
    </template>
  </div>
</template>
