<script setup lang="ts">
/**
 * Stock Now Report Page
 *
 * Generates detailed stock report showing current inventory levels
 * across locations with filtering and CSV export capabilities.
 */

import {
  generateSimpleCSV,
  downloadCSV,
  formatNumberForCSV,
  formatCurrencyForCSV,
} from "~/utils/csvExport";

// Page metadata
definePageMeta({
  title: "Stock Now Report",
});

// Composables
const { isAtLeastSupervisor } = useAuth();
const locationStore = useLocationStore();
const toast = useAppToast();

// State
const loading = ref(false);
const error = ref<string | null>(null);
const selectedLocationId = ref<string>("");
const selectedCategory = ref<string>("");
const showLowStockOnly = ref(false);

// Report data types
interface StockReportItem {
  item_id: string;
  item_code: string;
  item_name: string;
  item_unit: string;
  item_category: string | null;
  item_sub_category: string | null;
  on_hand: number;
  wac: number;
  stock_value: number;
  min_stock: number | null;
  max_stock: number | null;
  is_low_stock: boolean;
  is_over_stock: boolean;
  last_counted: Date | null;
}

interface LocationStockSummary {
  location_id: string;
  location_code: string;
  location_name: string;
  location_type: string;
  total_items: number;
  total_value: number;
  low_stock_items: number;
  items: StockReportItem[];
}

interface StockNowReport {
  report_type: string;
  generated_at: string;
  generated_by: {
    id: string;
    username: string;
  };
  filters: {
    location_id: string | null;
    category: string | null;
    low_stock_only: boolean;
  };
  locations: LocationStockSummary[];
  grand_totals: {
    total_locations: number;
    total_items: number;
    total_value: number;
    low_stock_items: number;
  };
  available_categories: string[];
}

const reportData = ref<StockNowReport | null>(null);

// Computed
const categories = computed(() => {
  return reportData.value?.available_categories || [];
});

const hasData = computed(() => {
  return reportData.value && reportData.value.locations.length > 0;
});

// Table columns
const columns = [
  { accessorKey: "item_code", header: "Code" },
  { accessorKey: "item_name", header: "Item Name" },
  { accessorKey: "item_unit", header: "Unit" },
  { accessorKey: "item_category", header: "Category" },
  { accessorKey: "on_hand", header: "On Hand" },
  { accessorKey: "wac", header: "WAC" },
  { accessorKey: "stock_value", header: "Value" },
  { accessorKey: "status", header: "Status" },
];

// Methods
const fetchReport = async () => {
  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();

    if (selectedLocationId.value) {
      params.append("locationId", selectedLocationId.value);
    }
    if (selectedCategory.value) {
      params.append("category", selectedCategory.value);
    }
    if (showLowStockOnly.value) {
      params.append("lowStock", "true");
    }

    const data = await $fetch<StockNowReport>(`/api/reports/stock-now?${params.toString()}`);
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
  selectedCategory.value = "";
  showLowStockOnly.value = false;
  fetchReport();
};

const exportToCSV = () => {
  if (!reportData.value || !hasData.value) {
    toast.warning("No Data", { description: "No data to export" });
    return;
  }

  // Build CSV headers
  const headers = [
    "Location",
    "Item Code",
    "Item Name",
    "Unit",
    "Category",
    "On Hand",
    "WAC",
    "Stock Value",
    "Min Stock",
    "Max Stock",
    "Low Stock",
    "Over Stock",
  ];

  // Build rows
  const rows: (string | number | null)[][] = [];

  for (const location of reportData.value.locations) {
    for (const item of location.items) {
      rows.push([
        location.location_name,
        item.item_code,
        item.item_name,
        item.item_unit,
        item.item_category || "",
        formatNumberForCSV(item.on_hand, 4),
        formatCurrencyForCSV(item.wac),
        formatCurrencyForCSV(item.stock_value),
        item.min_stock ? formatNumberForCSV(item.min_stock, 4) : "",
        item.max_stock ? formatNumberForCSV(item.max_stock, 4) : "",
        item.is_low_stock ? "Yes" : "No",
        item.is_over_stock ? "Yes" : "No",
      ]);
    }
  }

  const csvContent = generateSimpleCSV(headers, rows);
  const filename = `stock-now-report-${new Date().toISOString().split("T")[0]}`;
  downloadCSV(csvContent, filename);

  toast.success("Exported", { description: "Stock report exported to CSV" });
};

// Lifecycle
onMounted(async () => {
  if (locationStore.userLocations.length === 0) {
    await locationStore.fetchUserLocations();
  }
  fetchReport();
});
</script>

<template>
  <div class="p-4 md:p-6">
    <!-- Page Header -->
    <LayoutPageHeader
      title="Stock Now Report"
      subtitle="Current inventory levels across locations"
      icon="i-lucide-package"
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
          Export CSV
        </UButton>
      </template>
    </LayoutPageHeader>

    <!-- Filters -->
    <div class="card-elevated p-6 mb-6">
      <h3 class="text-subheading font-semibold mb-4">Filters</h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <!-- Category Filter -->
        <UFormField label="Category">
          <USelectMenu
            v-model="selectedCategory"
            :options="[
              { label: 'All Categories', value: '' },
              ...categories.map((cat) => ({ label: cat, value: cat })),
            ]"
            placeholder="Select category"
            value-attribute="value"
          />
        </UFormField>

        <!-- Low Stock Filter -->
        <UFormField label="Stock Status">
          <UCheckbox v-model="showLowStockOnly" label="Low stock items only" />
        </UFormField>

        <!-- Actions -->
        <UFormField label="Actions">
          <div class="flex gap-2">
            <UButton color="primary" class="cursor-pointer" @click="fetchReport">Generate</UButton>
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
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="card-elevated p-4">
          <p class="text-caption">Total Locations</p>
          <p class="text-heading font-bold text-primary">
            {{ reportData.grand_totals.total_locations }}
          </p>
        </div>
        <div class="card-elevated p-4">
          <p class="text-caption">Total Items</p>
          <p class="text-heading font-bold">
            {{ reportData.grand_totals.total_items.toLocaleString() }}
          </p>
        </div>
        <div class="card-elevated p-4">
          <p class="text-caption">Total Value</p>
          <p class="text-heading font-bold text-emerald-500">
            {{ formatCurrency(reportData.grand_totals.total_value) }}
          </p>
        </div>
        <div class="card-elevated p-4">
          <p class="text-caption">Low Stock Items</p>
          <p class="text-heading font-bold text-red-500">
            {{ reportData.grand_totals.low_stock_items }}
          </p>
        </div>
      </div>

      <!-- Report Info -->
      <div class="card-elevated p-4 mb-6">
        <div class="flex flex-wrap gap-4 text-caption">
          <span>
            <strong>Generated:</strong>
            {{ formatDateTime(reportData.generated_at) }}
          </span>
          <span>
            <strong>Generated By:</strong>
            {{ reportData.generated_by.username }}
          </span>
          <span v-if="reportData.filters.location_id">
            <strong>Location:</strong>
            {{
              locationStore.userLocations.find((l) => l.id === reportData?.filters.location_id)
                ?.name
            }}
          </span>
          <span v-if="reportData.filters.category">
            <strong>Category:</strong>
            {{ reportData.filters.category }}
          </span>
          <span v-if="reportData.filters.low_stock_only">
            <UBadge color="warning" variant="subtle" size="xs">Low Stock Only</UBadge>
          </span>
        </div>
      </div>

      <!-- Location Tables -->
      <div v-if="hasData" class="space-y-6">
        <div
          v-for="location in reportData.locations"
          :key="location.location_id"
          class="card-elevated"
        >
          <!-- Location Header -->
          <div class="p-4 border-b border-[var(--ui-border)]">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-subheading font-semibold">{{ location.location_name }}</h3>
                <p class="text-caption">
                  {{ location.location_code }} - {{ location.location_type }}
                </p>
              </div>
              <div class="flex gap-4 text-right">
                <div>
                  <p class="text-caption">Items</p>
                  <p class="font-semibold">{{ location.total_items }}</p>
                </div>
                <div>
                  <p class="text-caption">Value</p>
                  <p class="font-semibold text-emerald-500">
                    {{ formatCurrency(location.total_value) }}
                  </p>
                </div>
                <div v-if="location.low_stock_items > 0">
                  <p class="text-caption">Low Stock</p>
                  <p class="font-semibold text-red-500">{{ location.low_stock_items }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <div class="p-4 overflow-x-auto">
            <UTable :columns="columns" :data="location.items" class="w-full">
              <template #item_code-data="{ row }">
                <span class="font-mono text-body">
                  {{ (row as unknown as StockReportItem).item_code }}
                </span>
              </template>

              <template #item_name-data="{ row }">
                <div>
                  <p class="font-medium">{{ (row as unknown as StockReportItem).item_name }}</p>
                  <p
                    v-if="(row as unknown as StockReportItem).item_sub_category"
                    class="text-caption"
                  >
                    {{ (row as unknown as StockReportItem).item_sub_category }}
                  </p>
                </div>
              </template>

              <template #item_category-data="{ row }">
                <UBadge
                  v-if="(row as unknown as StockReportItem).item_category"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                >
                  {{ (row as unknown as StockReportItem).item_category }}
                </UBadge>
                <span v-else class="text-muted">-</span>
              </template>

              <template #on_hand-data="{ row }">
                <span class="font-semibold">
                  {{ formatQuantity((row as unknown as StockReportItem).on_hand) }}
                </span>
              </template>

              <template #wac-data="{ row }">
                <span>{{ formatCurrency((row as unknown as StockReportItem).wac) }}</span>
              </template>

              <template #stock_value-data="{ row }">
                <span class="font-semibold">
                  {{ formatCurrency((row as unknown as StockReportItem).stock_value) }}
                </span>
              </template>

              <template #status-data="{ row }">
                <div class="flex gap-1">
                  <UBadge
                    v-if="(row as unknown as StockReportItem).is_low_stock"
                    color="error"
                    variant="subtle"
                    size="xs"
                  >
                    Low
                  </UBadge>
                  <UBadge
                    v-if="(row as unknown as StockReportItem).is_over_stock"
                    color="warning"
                    variant="subtle"
                    size="xs"
                  >
                    Over
                  </UBadge>
                  <span
                    v-if="
                      !(row as unknown as StockReportItem).is_low_stock &&
                      !(row as unknown as StockReportItem).is_over_stock
                    "
                    class="text-muted"
                  >
                    -
                  </span>
                </div>
              </template>
            </UTable>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="card-elevated p-12">
        <EmptyState
          icon="i-lucide-package-x"
          title="No stock data"
          description="No stock data matches the selected filters."
        />
      </div>
    </template>
  </div>
</template>
