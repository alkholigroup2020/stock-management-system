<script setup lang="ts">
/**
 * Deliveries Report Page
 *
 * Generates detailed delivery report with supplier breakdown,
 * price variance tracking, and NCR summary.
 */

import type { PeriodStatus } from "@prisma/client";
import {
  generateSimpleCSV,
  downloadCSV,
  formatCurrencyForCSV,
  formatDateForCSV,
  formatNumberForCSV,
} from "~/utils/csvExport";

// Page metadata
definePageMeta({
  title: "Deliveries Report",
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
const showVarianceOnly = ref(false);
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
interface DeliveryLineReport {
  item_code: string;
  item_name: string;
  item_unit: string;
  quantity: number;
  unit_price: number;
  period_price: number;
  price_variance: number;
  line_value: number;
}

interface DeliveryReport {
  id: string;
  delivery_no: string;
  delivery_date: string;
  invoice_no: string | null;
  supplier_code: string;
  supplier_name: string;
  location_code: string;
  location_name: string;
  period_name: string;
  total_amount: number;
  has_variance: boolean;
  total_variance: number;
  poster_name: string;
  posted_at: string;
  ncr_count: number;
  lines: DeliveryLineReport[];
}

interface LocationDeliverySummary {
  location_id: string;
  location_code: string;
  location_name: string;
  delivery_count: number;
  total_value: number;
  variance_count: number;
  total_variance: number;
}

interface SupplierDeliverySummary {
  supplier_id: string;
  supplier_code: string;
  supplier_name: string;
  delivery_count: number;
  total_value: number;
  variance_count: number;
  total_variance: number;
}

interface DeliveriesReportData {
  report_type: string;
  generated_at: string;
  generated_by: {
    id: string;
    username: string;
  };
  filters: {
    period_id: string | null;
    location_id: string | null;
    supplier_id: string | null;
    start_date: string | null;
    end_date: string | null;
    has_variance_only: boolean;
  };
  period: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: PeriodStatus;
  } | null;
  deliveries: DeliveryReport[];
  by_location: LocationDeliverySummary[];
  by_supplier: SupplierDeliverySummary[];
  grand_totals: {
    total_deliveries: number;
    total_value: number;
    deliveries_with_variance: number;
    total_variance: number;
    total_ncrs: number;
    total_line_items: number;
  };
}

const reportData = ref<DeliveriesReportData | null>(null);

// Computed
const hasData = computed(() => {
  return reportData.value && reportData.value.deliveries.length > 0;
});

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
    if (showVarianceOnly.value) {
      params.append("hasVariance", "true");
    }
    if (startDate.value) {
      params.append("startDate", startDate.value);
    }
    if (endDate.value) {
      params.append("endDate", endDate.value);
    }

    const data = await $fetch<DeliveriesReportData>(`/api/reports/deliveries?${params.toString()}`);
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
  showVarianceOnly.value = false;
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
      "Delivery No",
      "Date",
      "Invoice No",
      "Supplier",
      "Location",
      "Period",
      "Total Amount",
      "Has Variance",
      "Total Variance",
      "NCR Count",
      "Posted By",
      "Posted At",
    ];

    // Build rows
    const rows: (string | number | null)[][] = [];

    for (const delivery of reportData.value.deliveries) {
      rows.push([
        delivery.delivery_no,
        formatDateForCSV(delivery.delivery_date),
        delivery.invoice_no || "",
        delivery.supplier_name,
        delivery.location_name,
        delivery.period_name,
        formatCurrencyForCSV(delivery.total_amount),
        delivery.has_variance ? "Yes" : "No",
        formatCurrencyForCSV(delivery.total_variance),
        delivery.ncr_count,
        delivery.poster_name,
        formatDateForCSV(delivery.posted_at),
      ]);
    }

    const csvContent = generateSimpleCSV(headers, rows);
    const filename = `deliveries-report-${new Date().toISOString().split("T")[0]}`;
    downloadCSV(csvContent, filename);

    toast.success("Exported", { description: "Deliveries report exported to CSV" });
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
      "Delivery No",
      "Date",
      "Supplier",
      "Location",
      "Item Code",
      "Item Name",
      "Unit",
      "Quantity",
      "Unit Price",
      "Period Price",
      "Variance",
      "Line Value",
    ];

    // Build rows
    const rows: (string | number | null)[][] = [];

    for (const delivery of reportData.value.deliveries) {
      for (const line of delivery.lines) {
        rows.push([
          delivery.delivery_no,
          formatDateForCSV(delivery.delivery_date),
          delivery.supplier_name,
          delivery.location_name,
          line.item_code,
          line.item_name,
          line.item_unit,
          formatNumberForCSV(line.quantity, 4),
          formatCurrencyForCSV(line.unit_price),
          formatCurrencyForCSV(line.period_price),
          formatCurrencyForCSV(line.price_variance),
          formatCurrencyForCSV(line.line_value),
        ]);
      }
    }

    const csvContent = generateSimpleCSV(headers, rows);
    const filename = `deliveries-detailed-${new Date().toISOString().split("T")[0]}`;
    downloadCSV(csvContent, filename);

    toast.success("Exported", { description: "Detailed deliveries exported to CSV" });
  } finally {
    exportingDetailed.value = false;
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
        <UIcon name="i-lucide-truck" class="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
        <div>
          <!-- Responsive title size -->
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Deliveries Report</h1>
          <!-- Description: hidden on mobile, visible on sm+ -->
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Delivery history with supplier and variance analysis
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

        <!-- Start Date -->
        <UFormField label="From Date" class="w-full">
          <UInput v-model="startDate" type="date" size="lg" class="w-full" />
        </UFormField>

        <!-- End Date -->
        <UFormField label="To Date" class="w-full">
          <UInput v-model="endDate" type="date" size="lg" class="w-full" />
        </UFormField>

        <!-- Variance Filter -->
        <UFormField label="Variance" class="w-full">
          <div class="flex items-center h-10">
            <UCheckbox v-model="showVarianceOnly" label="With variance only" />
          </div>
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
        <!-- Period and Location -->
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

        <!-- Variance and Actions -->
        <div class="flex items-center gap-2">
          <div class="flex-1">
            <UCheckbox v-model="showVarianceOnly" label="With variance only" />
          </div>
          <UButton
            color="primary"
            size="lg"
            :loading="loading"
            :disabled="loading"
            class="cursor-pointer"
            icon="i-lucide-refresh-cw"
            @click="fetchReport"
          />
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
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Deliveries</p>
          <p class="text-2xl sm:text-3xl font-bold text-primary mt-1">
            {{ reportData.grand_totals.total_deliveries }}
          </p>
        </UCard>
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Total Value</p>
          <p class="text-2xl sm:text-3xl font-bold text-emerald-500 dark:text-emerald-400 mt-1">
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
          <p class="text-sm text-[var(--ui-text-muted)]">With Variance</p>
          <p class="text-2xl sm:text-3xl font-bold text-amber-500 dark:text-amber-400 mt-1">
            {{ reportData.grand_totals.deliveries_with_variance }}
          </p>
        </UCard>
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Total Variance</p>
          <p class="text-2xl sm:text-3xl font-bold text-red-500 dark:text-red-400 mt-1">
            {{ formatCurrency(reportData.grand_totals.total_variance) }}
          </p>
        </UCard>
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">NCRs</p>
          <p class="text-2xl sm:text-3xl font-bold text-[var(--ui-text)] mt-1">
            {{ reportData.grand_totals.total_ncrs }}
          </p>
        </UCard>
      </div>

      <!-- By Location Summary -->
      <UCard v-if="reportData.by_location.length > 0" class="card-elevated">
        <div class="p-4 border-b border-[var(--ui-border)]">
          <h3 class="text-subheading font-semibold">By Location</h3>
        </div>
        <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="loc in reportData.by_location"
            :key="loc.location_id"
            class="p-3 rounded-lg bg-[var(--ui-bg)]"
          >
            <p class="font-medium">{{ loc.location_name }}</p>
            <p class="text-caption">{{ loc.delivery_count }} deliveries</p>
            <p class="text-emerald-500 font-semibold">{{ formatCurrency(loc.total_value) }}</p>
            <p v-if="loc.variance_count > 0" class="text-caption text-amber-500">
              {{ loc.variance_count }} with variance ({{ formatCurrency(loc.total_variance) }})
            </p>
          </div>
        </div>
      </UCard>

      <!-- By Supplier Summary -->
      <UCard v-if="reportData?.by_supplier && reportData.by_supplier.length > 0" class="card-elevated">
        <template #header>
          <h3 class="text-lg font-semibold text-[var(--ui-text)]">Top Suppliers</h3>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            v-for="sup in reportData.by_supplier.slice(0, 8)"
            :key="sup.supplier_id"
            class="p-3 rounded-lg bg-[var(--ui-bg-muted)]"
          >
            <p class="font-medium text-[var(--ui-text)]">{{ sup.supplier_name }}</p>
            <p class="text-sm text-[var(--ui-text-muted)]">{{ sup.delivery_count }} deliveries</p>
            <p class="text-emerald-500 dark:text-emerald-400 font-semibold">
              {{ formatCurrency(sup.total_value) }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Deliveries Table -->
      <UCard v-if="hasData" class="card-elevated">
        <template #header>
          <h3 class="text-lg font-semibold text-[var(--ui-text)]">Delivery List</h3>
        </template>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-[var(--ui-bg-elevated)]">
              <tr>
                <th class="px-4 py-3 text-left font-semibold">Delivery</th>
                <th class="px-4 py-3 text-left font-semibold">Date</th>
                <th class="px-4 py-3 text-left font-semibold">Supplier</th>
                <th class="px-4 py-3 text-left font-semibold">Location</th>
                <th class="px-4 py-3 text-right font-semibold">Amount</th>
                <th class="px-4 py-3 text-right font-semibold">Variance</th>
                <th class="px-4 py-3 text-center font-semibold">NCRs</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="delivery in reportData?.deliveries ?? []"
                :key="delivery.id"
                class="border-b border-[var(--ui-border)] hover:bg-[var(--ui-bg-elevated)]/50"
              >
                <td class="px-4 py-3">
                  <div>
                    <p class="font-medium font-mono">{{ delivery.delivery_no }}</p>
                    <p v-if="delivery.invoice_no" class="text-caption">
                      Inv: {{ delivery.invoice_no }}
                    </p>
                  </div>
                </td>
                <td class="px-4 py-3">{{ formatDate(delivery.delivery_date) }}</td>
                <td class="px-4 py-3">
                  <div>
                    <p class="font-medium">{{ delivery.supplier_name }}</p>
                    <p class="text-caption">{{ delivery.supplier_code }}</p>
                  </div>
                </td>
                <td class="px-4 py-3">{{ delivery.location_name }}</td>
                <td class="px-4 py-3 text-right font-mono font-semibold text-emerald-500">
                  {{ formatCurrency(delivery.total_amount) }}
                </td>
                <td class="px-4 py-3 text-right">
                  <span
                    v-if="delivery.has_variance"
                    class="font-mono"
                    :class="delivery.total_variance > 0 ? 'text-red-500' : 'text-emerald-500'"
                  >
                    {{ formatCurrency(delivery.total_variance) }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <UBadge v-if="delivery.ncr_count > 0" color="warning" variant="subtle" size="sm">
                    {{ delivery.ncr_count }}
                  </UBadge>
                  <span v-else class="text-muted">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <!-- Empty State -->
      <UCard v-else class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <div class="py-16">
          <EmptyState
            icon="i-lucide-truck"
            title="No deliveries"
            description="No deliveries found matching the selected filters."
          />
        </div>
      </UCard>
    </template>
  </div>
</template>
