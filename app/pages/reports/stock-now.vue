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
const exporting = ref(false);
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

// Status filter dropdown items
const statusFilterItems = computed(() => [
  [
    {
      label: "All Items",
      icon: "i-lucide-list",
      active: !showLowStockOnly.value,
      onSelect: () => {
        showLowStockOnly.value = false;
      },
    },
    {
      label: "Low Stock Only",
      icon: "i-lucide-alert-triangle",
      active: showLowStockOnly.value,
      onSelect: () => {
        showLowStockOnly.value = true;
      },
    },
  ],
]);

const statusFilterIcon = computed(() => {
  return showLowStockOnly.value ? "i-lucide-alert-triangle" : "i-lucide-list";
});

const statusFilterLabel = computed(() => {
  return showLowStockOnly.value ? "Low Stock" : "All Items";
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

  exporting.value = true;

  try {
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
  } finally {
    exporting.value = false;
  }
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
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <!-- Responsive icon size - NO background, NO border -->
        <UIcon name="i-lucide-package" class="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
        <div>
          <!-- Responsive title size -->
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Stock Now Report</h1>
          <!-- Description: hidden on mobile, visible on sm+ -->
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Current inventory levels across locations
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <!-- Back Button -->
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
          <span class="hidden sm:inline">Export CSV</span>
        </UButton>
      </div>
    </div>

    <!-- Filters -->
    <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
      <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-4">Filters</h3>

      <!-- Desktop: Single row layout (lg and above) -->
      <div class="hidden lg:grid lg:grid-cols-5 gap-3 items-end">
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

        <!-- Category Filter -->
        <UFormField label="Category" class="w-full">
          <USelectMenu
            v-model="selectedCategory"
            :items="[
              { label: 'All Categories', value: '' },
              ...categories.map((cat) => ({ label: cat, value: cat })),
            ]"
            placeholder="Select category"
            value-key="value"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <!-- Status Dropdown -->
        <UFormField label="Status" class="w-full">
          <UDropdownMenu :items="statusFilterItems" class="w-full">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              class="cursor-pointer rounded-full w-full"
              trailing-icon="i-lucide-chevron-down"
            >
              <UIcon :name="statusFilterIcon" class="w-4 h-4 mr-2" />
              {{ statusFilterLabel }}
            </UButton>
          </UDropdownMenu>
        </UFormField>

        <!-- Spacer (when not supervisor) -->
        <div v-if="!isAtLeastSupervisor" />

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
        <!-- Location and Category Filters -->
        <div class="grid grid-cols-1 gap-3">
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
          <UFormField label="Category">
            <USelectMenu
              v-model="selectedCategory"
              :items="[
                { label: 'All Categories', value: '' },
                ...categories.map((cat) => ({ label: cat, value: cat })),
              ]"
              placeholder="Category"
              value-key="value"
              size="lg"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Status and Action Buttons -->
        <div class="flex items-center gap-2">
          <UDropdownMenu :items="statusFilterItems" class="flex-1">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              class="cursor-pointer w-full"
              trailing-icon="i-lucide-chevron-down"
            >
              <UIcon :name="statusFilterIcon" class="w-4 h-4 mr-2" />
              {{ statusFilterLabel }}
            </UButton>
          </UDropdownMenu>
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
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Locations</p>
          <p class="text-2xl sm:text-3xl font-bold text-primary mt-1">
            {{ reportData.grand_totals.total_locations }}
          </p>
        </UCard>
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Total Items</p>
          <p class="text-2xl sm:text-3xl font-bold text-[var(--ui-text)] mt-1">
            {{ reportData.grand_totals.total_items.toLocaleString() }}
          </p>
        </UCard>
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Total Value</p>
          <p class="text-2xl sm:text-3xl font-bold text-emerald-500 mt-1">
            {{ formatCurrency(reportData.grand_totals.total_value) }}
          </p>
        </UCard>
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <p class="text-sm text-[var(--ui-text-muted)]">Low Stock</p>
          <p class="text-2xl sm:text-3xl font-bold text-red-500 mt-1">
            {{ reportData.grand_totals.low_stock_items }}
          </p>
        </UCard>
      </div>

      <!-- Report Info -->
      <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <div class="flex flex-wrap gap-4 text-sm text-[var(--ui-text-muted)]">
          <span>
            <strong class="text-[var(--ui-text)]">Generated:</strong>
            {{ formatDateTime(reportData.generated_at) }}
          </span>
          <span>
            <strong class="text-[var(--ui-text)]">Generated By:</strong>
            {{ reportData.generated_by.username }}
          </span>
          <span v-if="reportData.filters.location_id">
            <strong class="text-[var(--ui-text)]">Location:</strong>
            {{
              locationStore.userLocations.find((l) => l.id === reportData?.filters.location_id)
                ?.name
            }}
          </span>
          <span v-if="reportData.filters.category">
            <strong class="text-[var(--ui-text)]">Category:</strong>
            {{ reportData.filters.category }}
          </span>
          <span v-if="reportData.filters.low_stock_only">
            <UBadge color="warning" variant="subtle" size="xs">Low Stock Only</UBadge>
          </span>
        </div>
      </UCard>

      <!-- Location Tables -->
      <div v-if="hasData" class="space-y-3">
        <UCard
          v-for="location in reportData.locations"
          :key="location.location_id"
          class="card-elevated"
        >
          <!-- Location Header -->
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-[var(--ui-text)]">
                  {{ location.location_name }}
                </h3>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  {{ location.location_code }} - {{ location.location_type }}
                </p>
              </div>
              <div class="flex gap-4 text-right">
                <div>
                  <p class="text-sm text-[var(--ui-text-muted)]">Items</p>
                  <p class="font-semibold text-[var(--ui-text)]">{{ location.total_items }}</p>
                </div>
                <div>
                  <p class="text-sm text-[var(--ui-text-muted)]">Value</p>
                  <p class="font-semibold text-emerald-500">
                    {{ formatCurrency(location.total_value) }}
                  </p>
                </div>
                <div v-if="location.low_stock_items > 0">
                  <p class="text-sm text-[var(--ui-text-muted)]">Low Stock</p>
                  <p class="font-semibold text-red-500">{{ location.low_stock_items }}</p>
                </div>
              </div>
            </div>
          </template>

          <!-- Items Table -->
          <div class="overflow-x-auto">
            <UTable :columns="columns" :data="location.items" class="w-full">
              <template #item_code-data="{ row }">
                <span class="font-mono text-sm">
                  {{ (row as unknown as StockReportItem).item_code }}
                </span>
              </template>

              <template #item_name-data="{ row }">
                <div>
                  <p class="font-medium text-[var(--ui-text)]">
                    {{ (row as unknown as StockReportItem).item_name }}
                  </p>
                  <p
                    v-if="(row as unknown as StockReportItem).item_sub_category"
                    class="text-sm text-[var(--ui-text-muted)]"
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
                <span v-else class="text-[var(--ui-text-muted)]">-</span>
              </template>

              <template #on_hand-data="{ row }">
                <span class="font-semibold">
                  {{ formatQuantity((row as unknown as StockReportItem).on_hand) }}
                </span>
              </template>

              <template #wac-data="{ row }">
                <span class="text-sm">
                  {{ formatCurrency((row as unknown as StockReportItem).wac) }}
                </span>
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
                    class="text-[var(--ui-text-muted)]"
                  >
                    -
                  </span>
                </div>
              </template>
            </UTable>
          </div>
        </UCard>
      </div>

      <!-- Empty State -->
      <div v-else class="py-16">
        <EmptyState
          icon="i-lucide-package-x"
          title="No stock data"
          description="No stock data matches the selected filters."
        />
      </div>
    </template>
  </div>
</template>
