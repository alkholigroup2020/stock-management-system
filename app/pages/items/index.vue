<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <!-- Mobile: smaller icon and title -->
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-package-2" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Items</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Manage inventory items and stock levels
          </p>
        </div>
      </div>
      <!-- Mobile: shorter button text -->
      <UButton
        v-if="canEditItems()"
        color="primary"
        icon="i-lucide-plus"
        size="lg"
        class="cursor-pointer rounded-full px-3 sm:px-6"
        @click="navigateTo('/items/create')"
      >
        <span class="hidden sm:inline">Create Item</span>
        <span class="sm:hidden">Create</span>
      </UButton>
    </div>

    <!-- Filters -->
    <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
      <!-- Desktop: Single row layout (lg and above) -->
      <div class="hidden lg:flex items-center gap-3">
        <!-- Search -->
        <div class="flex-1 min-w-0 max-w-md">
          <UInput
            v-model="filters.search"
            placeholder="Search items by name or code..."
            icon="i-lucide-search"
            size="lg"
            class="w-full"
            @input="debouncedSearch"
          />
        </div>

        <!-- Status Filter Dropdown -->
        <UDropdownMenu
          :items="statusDropdownItems"
          :ui="{ content: 'min-w-[140px]' }"
          class="ml-auto"
        >
          <UButton
            color="neutral"
            variant="outline"
            size="lg"
            class="cursor-pointer rounded-full px-5"
            trailing-icon="i-lucide-chevron-down"
          >
            <UIcon :name="currentStatusIcon" class="w-4 h-4 mr-2" />
            {{ currentStatusLabel }}
          </UButton>
        </UDropdownMenu>
      </div>

      <!-- Mobile: Stacked layout (below lg) -->
      <div class="flex flex-col gap-3 lg:hidden">
        <!-- Row 1: Search and Status Dropdown -->
        <div class="flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <UInput
              v-model="filters.search"
              placeholder="Search items..."
              icon="i-lucide-search"
              size="lg"
              class="w-full"
              @input="debouncedSearch"
            />
          </div>
          <!-- Icon-only dropdown on mobile -->
          <UDropdownMenu :items="statusDropdownItems" :ui="{ content: 'min-w-[140px]' }">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              class="cursor-pointer rounded-full px-3"
              trailing-icon="i-lucide-chevron-down"
            >
              <UIcon :name="currentStatusIcon" class="w-4 h-4" />
            </UButton>
          </UDropdownMenu>
        </div>
      </div>
    </UCard>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading items..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" @retry="fetchItems" />

    <!-- Empty State -->
    <EmptyState
      v-else-if="!items.length"
      icon="i-lucide-package-2"
      title="No items found"
      description="No items match your search criteria. Try adjusting your filters or create a new item."
    >
      <template v-if="canEditItems()" #actions>
        <UButton
          color="primary"
          icon="i-lucide-plus"
          class="cursor-pointer"
          @click="navigateTo('/items/create')"
        >
          Create Item
        </UButton>
      </template>
    </EmptyState>

    <!-- Items Table -->
    <UCard v-else class="card-elevated" :ui="{ body: 'p-0' }">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-[var(--ui-border)]">
          <thead>
            <tr class="bg-[var(--ui-bg-elevated)]">
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Code</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Name</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Unit</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Category</th>
              <th class="px-4 py-3 text-right text-label uppercase tracking-wider">On-Hand</th>
              <th class="px-4 py-3 text-right text-label uppercase tracking-wider">WAC</th>
              <th class="px-4 py-3 text-right text-label uppercase tracking-wider">Value</th>
              <th
                v-if="canEditItems()"
                class="px-4 py-3 text-right text-label uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)]">
            <tr
              v-for="item in items"
              :key="item.id"
              class="hover:bg-[var(--ui-bg-elevated)] transition-colors"
            >
              <td
                class="px-4 py-4 whitespace-nowrap font-mono text-[var(--ui-text)] text-sm cursor-pointer"
                @click="navigateTo(`/items/${item.id}`)"
              >
                {{ item.code }}
              </td>
              <td
                class="px-4 py-4 text-[var(--ui-text)] cursor-pointer"
                @click="navigateTo(`/items/${item.id}`)"
              >
                <div class="flex items-center gap-2">
                  {{ item.name }}
                  <UBadge v-if="!item.is_active" color="neutral" variant="subtle" size="xs">
                    Inactive
                  </UBadge>
                </div>
              </td>
              <td
                class="px-4 py-4 whitespace-nowrap text-caption cursor-pointer"
                @click="navigateTo(`/items/${item.id}`)"
              >
                {{ item.unit }}
              </td>
              <td
                class="px-4 py-4 whitespace-nowrap text-caption cursor-pointer"
                @click="navigateTo(`/items/${item.id}`)"
              >
                {{ item.category || "-" }}
              </td>
              <td
                class="px-4 py-4 whitespace-nowrap text-[var(--ui-text)] text-right cursor-pointer"
                @click="navigateTo(`/items/${item.id}`)"
              >
                {{ formatQuantity(getStockData(item).onHand) }}
              </td>
              <td
                class="px-4 py-4 whitespace-nowrap text-[var(--ui-text)] text-right cursor-pointer"
                @click="navigateTo(`/items/${item.id}`)"
              >
                {{ formatCurrency(getStockData(item).wac) }}
              </td>
              <td
                class="px-4 py-4 whitespace-nowrap text-[var(--ui-text)] text-right font-medium cursor-pointer"
                @click="navigateTo(`/items/${item.id}`)"
              >
                {{ formatCurrency(getStockData(item).value) }}
              </td>
              <td v-if="canEditItems()" class="px-4 py-4 whitespace-nowrap text-sm text-right">
                <UButton
                  color="primary"
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-edit"
                  class="cursor-pointer"
                  @click.stop="navigateTo(`/items/${item.id}/edit`)"
                >
                  Edit
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="px-4 py-4 border-t border-[var(--ui-border)]">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <!-- Pagination Info -->
          <div class="text-caption">
            Showing
            <span class="font-medium">
              {{ (pagination.page - 1) * pagination.limit + 1 }}
            </span>
            to
            <span class="font-medium">
              {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
            </span>
            of
            <span class="font-medium">
              {{ pagination.total }}
            </span>
            items
          </div>

          <!-- Pagination Controls -->
          <div class="flex items-center gap-2">
            <UButton
              :disabled="!pagination.hasPrevPage"
              variant="soft"
              icon="i-lucide-chevron-left"
              class="cursor-pointer"
              @click="goToPage(pagination.page - 1)"
            >
              Previous
            </UButton>

            <!-- Page Numbers -->
            <div class="flex items-center gap-1">
              <template v-for="pageNum in visiblePages" :key="pageNum">
                <UButton
                  v-if="typeof pageNum === 'number'"
                  :variant="pageNum === pagination.page ? 'solid' : 'soft'"
                  :color="pageNum === pagination.page ? 'primary' : 'neutral'"
                  size="sm"
                  class="cursor-pointer"
                  @click="goToPage(pageNum)"
                >
                  {{ pageNum }}
                </UButton>
                <span v-else class="px-2 text-[var(--ui-text-muted)]">...</span>
              </template>
            </div>

            <UButton
              :disabled="!pagination.hasNextPage"
              variant="soft"
              icon="i-lucide-chevron-right"
              trailing
              class="cursor-pointer"
              @click="goToPage(pagination.page + 1)"
            >
              Next
            </UButton>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { Item, LocationStock } from "~~/shared/types/database";

// Type for Item with optional location stock
interface ItemWithStock extends Item {
  location_stock?: Array<
    LocationStock & {
      location: {
        id: string;
        code: string;
        name: string;
      };
    }
  >;
}

definePageMeta({
  layout: "default",
});

// Composables
const { canEditItems } = usePermissions();
const locationStore = useLocationStore();
const toast = useAppToast();

// Reactive state
const items = ref<ItemWithStock[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const filters = reactive({
  search: "",
  is_active: true as boolean | null,
});

// Pagination state
const pagination = ref({
  total: 0,
  page: 1,
  limit: 50,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
});

// Status dropdown items
const statusDropdownItems = computed(() => [
  [
    {
      label: "Active",
      icon: "i-lucide-circle-check",
      active: filters.is_active === true,
      onSelect: () => selectStatus(true),
    },
    {
      label: "Inactive",
      icon: "i-lucide-archive",
      active: filters.is_active === false,
      onSelect: () => selectStatus(false),
    },
    {
      label: "All",
      icon: "i-lucide-list",
      active: filters.is_active === null,
      onSelect: () => selectStatus(null),
    },
  ],
]);

// Current status label for dropdown button
const currentStatusLabel = computed(() => {
  if (filters.is_active === true) return "Active";
  if (filters.is_active === false) return "Inactive";
  return "All";
});

// Current status icon for dropdown button
const currentStatusIcon = computed(() => {
  if (filters.is_active === false) return "i-lucide-archive";
  if (filters.is_active === null) return "i-lucide-list";
  return "i-lucide-circle-check";
});

// Select status handler
const selectStatus = (statusValue: boolean | null) => {
  filters.is_active = statusValue;
  pagination.value.page = 1;
  fetchItems();
};

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  pagination.value.page = 1;
  fetchItems();
}, 500);

/**
 * Fetch items from the API
 */
async function fetchItems() {
  loading.value = true;
  error.value = null;

  try {
    const params: Record<string, string> = {
      page: String(pagination.value.page),
      limit: String(pagination.value.limit),
    };

    // Add locationId if available to include stock data
    if (locationStore.activeLocationId) {
      params.locationId = locationStore.activeLocationId;
    }

    // Add search query if present
    if (filters.search) {
      params.search = filters.search;
    }

    // Add status filter
    if (filters.is_active !== null) {
      params.is_active = String(filters.is_active);
    }

    const response = await $fetch<{
      items: ItemWithStock[];
      pagination: typeof pagination.value;
    }>("/api/items", {
      method: "GET",
      query: params,
    });

    items.value = response.items;
    pagination.value = response.pagination;
  } catch (err: unknown) {
    const errorMessage =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to load items";
    error.value = errorMessage;
    console.error("Error fetching items:", err);
    toast.error("Error", { description: errorMessage });
  } finally {
    loading.value = false;
  }
}

/**
 * Navigate to a specific page
 */
function goToPage(page: number) {
  if (page < 1 || page > pagination.value.totalPages) return;
  pagination.value.page = page;
  fetchItems();
}

/**
 * Calculate visible page numbers for pagination
 */
const visiblePages = computed(() => {
  const current = pagination.value.page;
  const total = pagination.value.totalPages;
  const pages: (number | string)[] = [];

  if (total <= 7) {
    // Show all pages if total is 7 or less
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (current > 3) {
      pages.push("...");
    }

    // Show pages around current page
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push("...");
    }

    // Always show last page
    pages.push(total);
  }

  return pages;
});

/**
 * Get stock data for an item
 */
function getStockData(item: ItemWithStock) {
  if (!item.location_stock || item.location_stock.length === 0) {
    return {
      onHand: 0,
      wac: 0,
      value: 0,
    };
  }

  const stock = item.location_stock[0];
  const onHand = Number(stock?.on_hand || 0);
  const wac = Number(stock?.wac || 0);
  const value = onHand * wac;

  return {
    onHand,
    wac,
    value,
  };
}

/**
 * Format quantity with appropriate decimal places
 */
function formatQuantity(value: number): string {
  // Show up to 4 decimal places for quantities
  return value.toFixed(4).replace(/\.?0+$/, "");
}

/**
 * Format currency (SAR)
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Fetch items on mount
onMounted(() => {
  fetchItems();
});

// Watch for location changes
watch(
  () => locationStore.activeLocationId,
  () => {
    // Refetch items when location changes to update stock data
    fetchItems();
  }
);

// Set page title
useHead({
  title: "Items - Stock Management System",
});
</script>
