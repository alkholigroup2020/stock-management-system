<script setup lang="ts">
/**
 * Stock Now Page
 *
 * Real-time inventory visibility page showing current stock levels
 * for active location or consolidated view across all locations.
 *
 * Features:
 * - Display stock table with item details, quantities, WAC, and values
 * - Filter by category, low stock, and search
 * - Location selector for supervisors/admins
 * - Export to CSV (optional)
 * - Total inventory value display
 */

import type { LocationType } from "@prisma/client";

// Page metadata
// Auth is handled by auth.global.ts middleware automatically

// Composables
const { isAtLeastSupervisor } = useAuth();
const locationStore = useLocationStore();
const toast = useAppToast();

// State
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref("");
const selectedCategory = ref<string>("");
const showLowStockOnly = ref(false);
const selectedLocationId = ref<string>("");
const viewMode = ref<"single" | "consolidated">("single");

// Stock data
interface StockItem {
  item_id: string;
  item_code: string;
  item_name: string;
  item_unit: string;
  item_category: string | null;
  item_sub_category: string | null;
  on_hand: number;
  wac: number;
  stock_value: number;
  value?: number; // Alias for compatibility
  min_stock?: number | null;
  max_stock?: number | null;
  is_low_stock?: boolean;
}

interface LocationStockSummary {
  location_id: string;
  location_code: string;
  location_name: string;
  location_type: string;
  total_items: number;
  total_value: number;
  low_stock_items: number;
  items: StockItem[];
}

interface StockNowResponse {
  report_type: string;
  generated_at: string;
  generated_by: { id: string; username: string };
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

interface ConsolidatedStockItem {
  item_id: string;
  item_code: string;
  item_name: string;
  item_unit: string;
  item_category: string | null;
  item_sub_category: string | null;
  total_on_hand: number;
  total_value: number;
  locations: Array<{
    location_id: string;
    location_code: string;
    location_name: string;
    location_type: string;
    on_hand: number;
    wac: number;
    value: number;
    min_stock: number | null;
    max_stock: number | null;
    is_low_stock: boolean;
  }>;
}

interface ConsolidatedStockResponse {
  consolidated_stock: ConsolidatedStockItem[];
  location_totals: Array<{
    location_id: string;
    location_code: string;
    location_name: string;
    location_type: string;
    total_value: number;
    item_count: number;
  }>;
  grand_total_value: number;
  total_items: number;
  total_locations: number;
}

const stockData = ref<StockNowResponse | null>(null);
const consolidatedData = ref<ConsolidatedStockResponse | null>(null);
const categories = ref<string[]>([]);
const currentLocationData = ref<LocationStockSummary | null>(null);

// Computed properties
const activeLocationId = computed(() => {
  // If supervisor/admin selects a specific location
  if (selectedLocationId.value) {
    return selectedLocationId.value;
  }
  // Otherwise use active location from store
  return locationStore.activeLocation?.id || "";
});

const filteredStock = computed(() => {
  if (viewMode.value === "consolidated" && consolidatedData.value) {
    let items = consolidatedData.value.consolidated_stock;

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      items = items.filter(
        (item) =>
          item.item_name.toLowerCase().includes(query) ||
          item.item_code.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory.value) {
      items = items.filter((item) => item.item_category === selectedCategory.value);
    }

    // Apply low stock filter
    if (showLowStockOnly.value) {
      items = items.filter((item) => item.locations.some((loc) => loc.is_low_stock));
    }

    return items;
  } else if (currentLocationData.value) {
    let items = currentLocationData.value.items;

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      items = items.filter(
        (item) =>
          item.item_name.toLowerCase().includes(query) ||
          item.item_code.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory.value) {
      items = items.filter((item) => item.item_category === selectedCategory.value);
    }

    // Apply low stock filter
    if (showLowStockOnly.value) {
      items = items.filter((item) => item.is_low_stock === true);
    }

    return items;
  }

  return [];
});

const totalInventoryValue = computed(() => {
  if (viewMode.value === "consolidated" && consolidatedData.value) {
    return consolidatedData.value.grand_total_value;
  } else if (currentLocationData.value) {
    return currentLocationData.value.total_value;
  }
  return 0;
});

const totalItems = computed(() => {
  return filteredStock.value.length;
});

// Table columns for single location view
const stockColumns = [
  {
    accessorKey: "item_code",
    header: "Code",
  },
  {
    accessorKey: "item_name",
    header: "Item Name",
  },
  {
    accessorKey: "item_unit",
    header: "Unit",
  },
  {
    accessorKey: "item_category",
    header: "Category",
  },
  {
    accessorKey: "on_hand",
    header: "On Hand",
  },
  {
    accessorKey: "wac",
    header: "WAC",
  },
  {
    accessorKey: "value",
    header: "Total Value",
  },
];

// Table columns for consolidated view
const consolidatedColumns = [
  {
    accessorKey: "item_code",
    header: "Code",
  },
  {
    accessorKey: "item_name",
    header: "Item Name",
  },
  {
    accessorKey: "item_unit",
    header: "Unit",
  },
  {
    accessorKey: "item_category",
    header: "Category",
  },
  {
    accessorKey: "total_on_hand",
    header: "Total On Hand",
  },
  {
    accessorKey: "total_value",
    header: "Total Value",
  },
  {
    accessorKey: "locations",
    header: "Locations",
  },
];

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

// Methods
const fetchStockData = async () => {
  if (!activeLocationId.value && viewMode.value === "single") {
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    if (viewMode.value === "consolidated") {
      // Fetch consolidated stock
      const params = new URLSearchParams();
      if (selectedCategory.value) {
        params.append("category", selectedCategory.value);
      }
      if (showLowStockOnly.value) {
        params.append("lowStock", "true");
      }

      const data = await $fetch<ConsolidatedStockResponse>(
        `/api/stock/consolidated?${params.toString()}`
      );
      consolidatedData.value = data;

      // Extract categories from consolidated data
      const categorySet = new Set<string>();
      if (data.consolidated_stock) {
        data.consolidated_stock.forEach((item) => {
          if (item.item_category) {
            categorySet.add(item.item_category);
          }
        });
      }
      categories.value = Array.from(categorySet).sort();
    } else {
      // Fetch single location stock using the stock-now report endpoint
      const params = new URLSearchParams();
      if (activeLocationId.value) {
        params.append("locationId", activeLocationId.value);
      }
      if (selectedCategory.value) {
        params.append("category", selectedCategory.value);
      }
      if (showLowStockOnly.value) {
        params.append("lowStock", "true");
      }

      const data = await $fetch<StockNowResponse>(
        `/api/reports/stock-now?${params.toString()}`
      );
      stockData.value = data;

      // Find the current location's data from the response
      if (data.locations && data.locations.length > 0) {
        currentLocationData.value = data.locations[0] ?? null;
      } else {
        currentLocationData.value = null;
      }

      // Use categories from the API response
      categories.value = data.available_categories || [];
    }
  } catch (err: unknown) {
    console.error("Error fetching stock data:", err);
    const errorData = err as { data?: { message?: string } };
    error.value = errorData.data?.message || "Failed to fetch stock data";
    toast.error("Error", { description: error.value || undefined });
  } finally {
    loading.value = false;
  }
};

const handleLocationChange = (locationId: any) => {
  if (locationId && typeof locationId === "string") {
    selectedLocationId.value = locationId;
    viewMode.value = "single";
    fetchStockData();
  }
};

const handleViewModeChange = (mode: "single" | "consolidated") => {
  viewMode.value = mode;
  if (mode === "single") {
    selectedLocationId.value = locationStore.activeLocation?.id || "";
  }
  fetchStockData();
};

const clearFilters = () => {
  searchQuery.value = "";
  selectedCategory.value = "";
  showLowStockOnly.value = false;
};

const exportToCSV = () => {
  if (filteredStock.value.length === 0) {
    toast.warning("No Data", { description: "No stock data to export" });
    return;
  }

  // Prepare CSV content
  let csvContent = "";

  if (viewMode.value === "consolidated") {
    // Consolidated view CSV
    csvContent = "Item Code,Item Name,Unit,Category,Total On Hand,Total Value,Locations\n";
    filteredStock.value.forEach((item: any) => {
      const locationCount = item.locations?.length || 0;
      const row = [
        item.item_code,
        `"${item.item_name}"`,
        item.item_unit,
        item.item_category || "",
        item.total_on_hand.toFixed(4),
        item.total_value.toFixed(2),
        locationCount,
      ].join(",");
      csvContent += row + "\n";
    });
  } else {
    // Single location view CSV
    csvContent = "Item Code,Item Name,Unit,Category,On Hand,WAC,Total Value\n";
    filteredStock.value.forEach((item: any) => {
      const row = [
        item.item_code,
        `"${item.item_name}"`,
        item.item_unit,
        item.item_category || "",
        item.on_hand.toFixed(4),
        item.wac.toFixed(4),
        item.value?.toFixed(2) || item.stock_value?.toFixed(2) || "0.00",
      ].join(",");
      csvContent += row + "\n";
    });
  }

  // Create and download CSV file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `stock-${viewMode.value}-${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.success("Exported", { description: "Stock data exported to CSV" });
};

// Lifecycle
onMounted(() => {
  // Fetch location store data first if not loaded
  if (locationStore.userLocations.length === 0) {
    locationStore.fetchUserLocations().then(() => {
      fetchStockData();
    });
  } else {
    fetchStockData();
  }
});

// Watch for active location changes
watch(
  () => locationStore.activeLocation,
  () => {
    if (viewMode.value === "single" && !selectedLocationId.value) {
      fetchStockData();
    }
  }
);
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
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Stock Now</h1>
          <!-- Description: hidden on mobile, visible on sm+ -->
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Real-time inventory levels across locations
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <!-- View Mode Toggle (Supervisor/Admin only) -->
        <div v-if="isAtLeastSupervisor" class="hidden lg:flex items-center gap-1 p-1 bg-muted rounded-full">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap"
            :class="viewMode === 'single' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-default hover:bg-elevated'"
            @click="handleViewModeChange('single')"
          >
            Single Location
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap"
            :class="viewMode === 'consolidated' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-default hover:bg-elevated'"
            @click="handleViewModeChange('consolidated')"
          >
            All Locations
          </button>
        </div>

        <!-- Export Button -->
        <UButton
          icon="i-lucide-download"
          color="neutral"
          variant="outline"
          size="lg"
          class="cursor-pointer rounded-full px-3 sm:px-5"
          :disabled="loading || totalItems === 0"
          @click="exportToCSV"
        >
          <span class="hidden sm:inline">Export CSV</span>
        </UButton>
      </div>
    </div>

    <!-- Location Selector (when in single location mode and supervisor/admin) -->
    <UCard
      v-if="isAtLeastSupervisor && viewMode === 'single'"
      class="card-elevated"
      :ui="{ body: 'p-3 sm:p-4' }"
    >
      <UFormField label="Select Location">
        <USelectMenu
          v-model="selectedLocationId"
          :options="
            locationStore.userLocations.map((loc) => ({
              label: `${loc.name} (${loc.code})`,
              value: loc.id,
            }))
          "
          placeholder="Select a location"
          value-attribute="value"
          class="w-full"
          @update:model-value="handleLocationChange"
        />
      </UFormField>
    </UCard>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <!-- Total Inventory Value -->
      <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-[var(--ui-text-muted)]">Total Inventory Value</p>
            <p class="text-2xl sm:text-3xl font-bold text-primary mt-1">
              {{ formatCurrency(totalInventoryValue) }}
            </p>
          </div>
          <UIcon name="i-lucide-coins" class="w-10 h-10 text-emerald-500" />
        </div>
      </UCard>

      <!-- Total Items -->
      <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-[var(--ui-text-muted)]">Total Items</p>
            <p class="text-2xl sm:text-3xl font-bold text-[var(--ui-text)] mt-1">
              {{ totalItems }}
            </p>
          </div>
          <UIcon name="i-lucide-boxes" class="w-10 h-10 text-blue-500" />
        </div>
      </UCard>

      <!-- Locations (consolidated view only) -->
      <UCard
        v-if="viewMode === 'consolidated' && consolidatedData"
        class="card-elevated"
        :ui="{ body: 'p-3 sm:p-4' }"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-[var(--ui-text-muted)]">Active Locations</p>
            <p class="text-2xl sm:text-3xl font-bold text-[var(--ui-text)] mt-1">
              {{ consolidatedData.total_locations }}
            </p>
          </div>
          <UIcon name="i-lucide-map-pin" class="w-10 h-10 text-blue-500" />
        </div>
      </UCard>

      <!-- Current Location (single view only) -->
      <UCard
        v-else-if="currentLocationData"
        class="card-elevated"
        :ui="{ body: 'p-3 sm:p-4' }"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-[var(--ui-text-muted)]">Current Location</p>
            <p class="text-lg font-semibold text-[var(--ui-text)] mt-1">
              {{ currentLocationData.location_name }}
            </p>
            <p class="text-sm text-[var(--ui-text-muted)]">
              {{ currentLocationData.location_code }}
            </p>
          </div>
          <UIcon name="i-lucide-warehouse" class="w-10 h-10 text-blue-500" />
        </div>
      </UCard>
    </div>

    <!-- Filters Section -->
    <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
      <!-- Desktop: Single row layout (lg and above) -->
      <div class="hidden lg:flex items-center gap-3">
        <!-- Search -->
        <div class="flex-1 min-w-0 max-w-md">
          <UInput
            v-model="searchQuery"
            placeholder="Search by name or code..."
            icon="i-lucide-search"
            size="lg"
            class="w-full"
          />
        </div>

        <!-- Category Filter -->
        <USelectMenu
          v-model="selectedCategory"
          :options="[
            { label: 'All Categories', value: '' },
            ...categories.map((cat) => ({ label: cat, value: cat })),
          ]"
          placeholder="Category"
          value-attribute="value"
          size="lg"
          class="w-48"
        />

        <!-- Status Dropdown (Far Right) -->
        <UDropdownMenu :items="statusFilterItems" class="ml-auto">
          <UButton
            color="neutral"
            variant="outline"
            size="lg"
            class="cursor-pointer rounded-full px-5"
            trailing-icon="i-lucide-chevron-down"
          >
            <UIcon :name="statusFilterIcon" class="w-4 h-4 mr-2" />
            {{ statusFilterLabel }}
          </UButton>
        </UDropdownMenu>

        <!-- Clear Filters Button -->
        <UButton
          v-if="searchQuery || selectedCategory || showLowStockOnly"
          color="neutral"
          variant="ghost"
          size="lg"
          icon="i-lucide-x"
          class="cursor-pointer"
          @click="clearFilters"
        >
          Clear
        </UButton>
      </div>

      <!-- Mobile: Search and Status only - NO category filter (below lg) -->
      <div class="flex items-center gap-3 lg:hidden">
        <div class="flex-1 min-w-0">
          <UInput
            v-model="searchQuery"
            placeholder="Search..."
            icon="i-lucide-search"
            size="lg"
            class="w-full"
          />
        </div>
        <UDropdownMenu :items="statusFilterItems">
          <UButton
            color="neutral"
            variant="outline"
            size="lg"
            class="cursor-pointer rounded-full px-3"
            trailing-icon="i-lucide-chevron-down"
          >
            <UIcon :name="statusFilterIcon" class="w-4 h-4" />
          </UButton>
        </UDropdownMenu>
        <UButton
          v-if="searchQuery || selectedCategory || showLowStockOnly"
          color="neutral"
          variant="ghost"
          size="lg"
          icon="i-lucide-x"
          class="cursor-pointer px-3"
          @click="clearFilters"
        />
      </div>
    </UCard>

    <!-- Stock Table -->
    <UCard class="card-elevated">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" text="Loading stock data..." />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-6">
        <ErrorAlert :message="error" :retry="fetchStockData" />
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredStock.length === 0" class="py-16">
        <EmptyState
          icon="i-lucide-package-x"
          title="No stock data"
          :description="
            searchQuery || selectedCategory || showLowStockOnly
              ? 'No items match your filters. Try adjusting your search criteria.'
              : 'No stock data available for this location.'
          "
        />
      </div>

      <!-- Stock Table - Single Location View -->
      <div v-else-if="viewMode === 'single'" class="overflow-x-auto">
        <UTable :columns="stockColumns" :data="filteredStock as StockItem[]" class="w-full">
          <!-- Item Code -->
          <template #item_code-data="{ row }">
            <span class="font-mono text-sm">{{ (row as any).item_code }}</span>
          </template>

          <!-- Item Name -->
          <template #item_name-data="{ row }">
            <div>
              <p class="font-medium text-[var(--ui-text)]">{{ (row as any).item_name }}</p>
              <p v-if="(row as any).item_sub_category" class="text-sm text-[var(--ui-text-muted)]">
                {{ (row as any).item_sub_category }}
              </p>
            </div>
          </template>

          <!-- Unit -->
          <template #item_unit-data="{ row }">
            <span class="text-sm">{{ (row as any).item_unit }}</span>
          </template>

          <!-- Category -->
          <template #item_category-data="{ row }">
            <UBadge v-if="(row as any).item_category" color="neutral" variant="subtle">
              {{ (row as any).item_category }}
            </UBadge>
            <span v-else class="text-[var(--ui-text-muted)]">-</span>
          </template>

          <!-- On Hand -->
          <template #on_hand-data="{ row }">
            <div class="flex items-center gap-2">
              <span class="font-semibold">{{ formatQuantity((row as any).on_hand) }}</span>
              <UBadge v-if="(row as any).is_low_stock" color="error" variant="subtle" size="xs">
                Low
              </UBadge>
            </div>
          </template>

          <!-- WAC -->
          <template #wac-data="{ row }">
            <span class="text-sm">{{ formatCurrency((row as any).wac) }}</span>
          </template>

          <!-- Value -->
          <template #value-data="{ row }">
            <span class="font-semibold">{{
              formatCurrency((row as any).stock_value || (row as any).value || 0)
            }}</span>
          </template>
        </UTable>
      </div>

      <!-- Stock Table - Consolidated View -->
      <div v-else-if="viewMode === 'consolidated'" class="overflow-x-auto">
        <UTable
          :columns="consolidatedColumns"
          :data="filteredStock as ConsolidatedStockItem[]"
          class="w-full"
        >
          <!-- Item Code -->
          <template #item_code-data="{ row }">
            <span class="font-mono text-sm">{{ (row as any).item_code }}</span>
          </template>

          <!-- Item Name -->
          <template #item_name-data="{ row }">
            <div>
              <p class="font-medium text-[var(--ui-text)]">{{ (row as any).item_name }}</p>
              <p v-if="(row as any).item_sub_category" class="text-sm text-[var(--ui-text-muted)]">
                {{ (row as any).item_sub_category }}
              </p>
            </div>
          </template>

          <!-- Unit -->
          <template #item_unit-data="{ row }">
            <span class="text-sm">{{ (row as any).item_unit }}</span>
          </template>

          <!-- Category -->
          <template #item_category-data="{ row }">
            <UBadge v-if="(row as any).item_category" color="neutral" variant="subtle">
              {{ (row as any).item_category }}
            </UBadge>
            <span v-else class="text-[var(--ui-text-muted)]">-</span>
          </template>

          <!-- Total On Hand -->
          <template #total_on_hand-data="{ row }">
            <span class="font-semibold">{{ formatQuantity((row as any).total_on_hand) }}</span>
          </template>

          <!-- Total Value -->
          <template #total_value-data="{ row }">
            <span class="font-semibold">{{ formatCurrency((row as any).total_value) }}</span>
          </template>

          <!-- Locations -->
          <template #locations-data="{ row }">
            <div class="flex flex-wrap gap-1">
              <UBadge
                v-for="loc in (row as any).locations"
                :key="loc.location_id"
                :color="loc.is_low_stock ? 'error' : 'neutral'"
                variant="subtle"
                size="xs"
                :title="`${loc.location_name}: ${formatQuantity(
                  loc.on_hand
                )} @ ${formatCurrency(loc.wac)}`"
              >
                {{ loc.location_code }}
              </UBadge>
            </div>
          </template>
        </UTable>
      </div>
    </UCard>
  </div>
</template>
