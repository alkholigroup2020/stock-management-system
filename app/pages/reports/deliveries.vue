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
};

const exportDetailedCSV = () => {
  if (!reportData.value || !hasData.value) {
    toast.warning("No Data", { description: "No data to export" });
    return;
  }

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
  <div class="p-4 md:p-6">
    <!-- Page Header -->
    <LayoutPageHeader
      title="Deliveries Report"
      subtitle="Delivery history with supplier and variance analysis"
      icon="i-lucide-truck"
      :show-location="false"
      :show-period="false"
    >
      <template #actions>
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          to="/reports"
          class="cursor-pointer"
        >
          Back to Reports
        </UButton>
        <UButton
          icon="i-lucide-download"
          color="primary"
          :disabled="loading || !hasData"
          class="cursor-pointer"
          @click="exportToCSV"
        >
          Export Summary
        </UButton>
        <UButton
          icon="i-lucide-file-spreadsheet"
          color="neutral"
          variant="outline"
          :disabled="loading || !hasData"
          class="cursor-pointer"
          @click="exportDetailedCSV"
        >
          Export Detail
        </UButton>
      </template>
    </LayoutPageHeader>

    <!-- Filters -->
    <div class="card-elevated p-6 mb-6">
      <h3 class="text-subheading font-semibold mb-4">Filters</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <!-- Period Filter -->
        <UFormField label="Period">
          <USelectMenu
            v-model="selectedPeriodId"
            :options="[
              { label: 'All Periods', value: '' },
              ...periods.map((p) => ({ label: p.name, value: p.id })),
            ]"
            :loading="loadingPeriods"
            placeholder="Select period"
            value-attribute="value"
          />
        </UFormField>

        <!-- Location Filter -->
        <UFormField v-if="isAtLeastSupervisor" label="Location">
          <USelectMenu
            v-model="selectedLocationId"
            :options="[
              { label: 'All Locations', value: '' },
              ...locationStore.userLocations.map((loc) => ({
                label: `${loc.name} (${loc.code})`,
                value: loc.id,
              })),
            ]"
            placeholder="Select location"
            value-attribute="value"
          />
        </UFormField>

        <!-- Start Date -->
        <UFormField label="From Date">
          <UInput v-model="startDate" type="date" />
        </UFormField>

        <!-- End Date -->
        <UFormField label="To Date">
          <UInput v-model="endDate" type="date" />
        </UFormField>

        <!-- Variance Filter -->
        <UFormField label="Variance">
          <UCheckbox v-model="showVarianceOnly" label="With variance only" />
        </UFormField>

        <!-- Actions -->
        <UFormField label="Actions">
          <div class="flex gap-2">
            <UButton color="primary" class="cursor-pointer" @click="fetchReport"> Generate </UButton>
            <UButton color="neutral" variant="outline" class="cursor-pointer" @click="clearFilters">
              Clear
            </UButton>
          </div>
        </UFormField>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="card-elevated p-12">
      <LoadingSpinner size="lg" text="Generating report..." />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="card-elevated p-6">
      <ErrorAlert :message="error" :retry="fetchReport" />
    </div>

    <!-- Report Content -->
    <template v-else-if="reportData">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div class="card-elevated p-4">
          <p class="text-caption">Deliveries</p>
          <p class="text-heading font-bold">
            {{ reportData.grand_totals.total_deliveries }}
          </p>
        </div>
        <div class="card-elevated p-4">
          <p class="text-caption">Total Value</p>
          <p class="text-heading font-bold text-emerald-500">
            {{ formatCurrency(reportData.grand_totals.total_value) }}
          </p>
        </div>
        <div class="card-elevated p-4">
          <p class="text-caption">Line Items</p>
          <p class="text-heading font-bold">
            {{ reportData.grand_totals.total_line_items }}
          </p>
        </div>
        <div class="card-elevated p-4">
          <p class="text-caption">With Variance</p>
          <p class="text-heading font-bold text-amber-500">
            {{ reportData.grand_totals.deliveries_with_variance }}
          </p>
        </div>
        <div class="card-elevated p-4">
          <p class="text-caption">Total Variance</p>
          <p class="text-heading font-bold text-red-500">
            {{ formatCurrency(reportData.grand_totals.total_variance) }}
          </p>
        </div>
        <div class="card-elevated p-4">
          <p class="text-caption">NCRs</p>
          <p class="text-heading font-bold">
            {{ reportData.grand_totals.total_ncrs }}
          </p>
        </div>
      </div>

      <!-- By Location Summary -->
      <div v-if="reportData.by_location.length > 0" class="card-elevated mb-6">
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
      </div>

      <!-- By Supplier Summary -->
      <div v-if="reportData.by_supplier.length > 0" class="card-elevated mb-6">
        <div class="p-4 border-b border-[var(--ui-border)]">
          <h3 class="text-subheading font-semibold">Top Suppliers</h3>
        </div>
        <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="sup in reportData.by_supplier.slice(0, 8)"
            :key="sup.supplier_id"
            class="p-3 rounded-lg bg-[var(--ui-bg)]"
          >
            <p class="font-medium">{{ sup.supplier_name }}</p>
            <p class="text-caption">{{ sup.delivery_count }} deliveries</p>
            <p class="text-emerald-500 font-semibold">{{ formatCurrency(sup.total_value) }}</p>
          </div>
        </div>
      </div>

      <!-- Deliveries Table -->
      <div v-if="hasData" class="card-elevated overflow-hidden">
        <div class="p-4 border-b border-[var(--ui-border)]">
          <h3 class="text-subheading font-semibold">Delivery List</h3>
        </div>
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
                v-for="delivery in reportData.deliveries"
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
                  <UBadge
                    v-if="delivery.ncr_count > 0"
                    color="warning"
                    variant="subtle"
                    size="sm"
                  >
                    {{ delivery.ncr_count }}
                  </UBadge>
                  <span v-else class="text-muted">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="card-elevated p-12">
        <EmptyState
          icon="i-lucide-truck"
          title="No deliveries"
          description="No deliveries found matching the selected filters."
        />
      </div>
    </template>
  </div>
</template>
