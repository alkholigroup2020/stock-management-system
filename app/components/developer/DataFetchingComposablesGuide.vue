<script setup lang="ts">
import type { Ref } from "vue";

const expandedSections = ref<string[]>([]);

const toggleSection = (section: string) => {
  if (expandedSections.value.includes(section)) {
    expandedSections.value = [];
  } else {
    expandedSections.value = [section];
  }
};

const isExpanded = (section: string) => expandedSections.value.includes(section);

const targetSubSection = inject<Ref<string | null>>("devTargetSection", ref(null));

watch(
  targetSubSection,
  (newSection) => {
    if (newSection) {
      if (!expandedSections.value.includes(newSection)) {
        expandedSections.value.push(newSection);
      }
      nextTick(() => {
        const element = document.getElementById(`dev-section-${newSection}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (targetSubSection.value) {
          targetSubSection.value = null;
        }
      });
    }
  },
  { immediate: true }
);

// Code examples
const codeExamples = {
  overview: `// Data Fetching Architecture
//
// This application uses a multi-layered approach:
//
// 1. Composable-level caching (useAsyncData + nuxtApp.payload.data)
// 2. Store-level state (Pinia for auth, location, period)
// 3. Direct $fetch for mutations and one-off operations
//
// Data fetching composables provide:
// - Automatic caching with TTL
// - Loading state management
// - Error handling
// - Filter-aware cache keys
// - Manual refresh capability
// - Integration with cache invalidation system`,

  useItemsSignature: `// useItems Composable Signature
// File: app/composables/useItems.ts

export function useItems(
  filters?: Ref<ItemFilters> | ItemFilters,
  options: {
    immediate?: boolean;  // Fetch immediately (default: true)
    watch?: boolean;      // Re-fetch when filters change (default: false)
  } = {}
) {
  // Returns reactive data with loading/error states
  return {
    items: computed(() => Item[]),      // Reactive items array
    pagination: computed(() => PaginationMeta),
    loading: computed(() => boolean),   // status.value === "pending"
    error: computed(() => Error | null),
    refresh: () => Promise<void>        // Manual refresh function
  };
}`,

  useItemsImplementation: `// useItems Implementation Pattern
// File: app/composables/useItems.ts

export function useItems(
  filters?: Ref<ItemFilters> | ItemFilters,
  options: { immediate?: boolean; watch?: boolean } = {}
) {
  const { immediate = true, watch: watchFilters = false } = options;

  // Convert filters to ref if not already
  const filterRef = isRef(filters) ? filters : ref(filters || {});

  // Build query parameters from filters
  const query = computed(() => {
    const params: Record<string, string> = {};
    if (filterRef.value.search) params.search = filterRef.value.search;
    if (filterRef.value.is_active !== undefined) {
      params.is_active = String(filterRef.value.is_active);
    }
    if (filterRef.value.locationId) params.locationId = filterRef.value.locationId;
    if (filterRef.value.page) params.page = String(filterRef.value.page);
    if (filterRef.value.limit) params.limit = String(filterRef.value.limit);
    return params;
  });

  // useAsyncData with custom caching
  const { data, error, status, refresh } = useAsyncData<ItemsResponse>(
    \`items:\${JSON.stringify(query.value)}\`,  // Unique cache key per filter set
    () => $fetch<ItemsResponse>("/api/items", { query: query.value }),
    {
      getCachedData: (key) => {
        const cached = useNuxtApp().payload.data[key];
        if (!cached) return; // Cache miss

        // Check timestamp (20 seconds TTL)
        const now = Date.now();
        const cacheTime = useNuxtApp().payload.data[\`\${key}:time\`] as number;
        if (cacheTime && now - cacheTime < 20 * 1000) {
          return cached; // Cache hit within TTL
        }

        return; // Cache expired
      },
      immediate,
      watch: watchFilters ? [query] : false, // Re-fetch on filter changes if enabled
    }
  );

  // Store timestamp when data arrives
  watch(data, (newData) => {
    if (newData) {
      const key = \`items:\${JSON.stringify(query.value)}\`;
      useNuxtApp().payload.data[\`\${key}:time\`] = Date.now();
    }
  }, { immediate: true });

  // Extract items and pagination from response
  const items = computed(() => data.value?.items || []);
  const pagination = computed(() => data.value?.pagination || {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const loading = computed(() => status.value === "pending");

  return { items, pagination, loading, error, refresh };
}`,

  useItemsUsage: `// Using useItems Composable
<script setup lang="ts">
// Basic usage - fetch all items
const { items, loading, error } = useItems();

// With filters
const filters = ref({
  search: "",
  is_active: true,
  locationId: "loc-123",
  page: 1,
  limit: 50,
});

const { items, pagination, loading, refresh } = useItems(filters);

// With watch enabled - auto-refetch when filters change
const { items, loading } = useItems(filters, { watch: true });

// Lazy loading - don't fetch immediately
const { items, loading, refresh } = useItems(filters, { immediate: false });

// Manual trigger
const fetchData = async () => {
  await refresh();
};
\x3C/script>

\x3Ctemplate>
  \x3Cdiv>
    \x3Cdiv v-if="loading">Loading items...\x3C/div>
    \x3Cdiv v-else-if="error">Error: {{ error.message }}\x3C/div>
    \x3Cdiv v-else>
      \x3Cdiv v-for="item in items" :key="item.id">
        {{ item.name }}
      \x3C/div>
    \x3C/div>
  \x3C/div>
\x3C/template>`,

  availableComposables: `// Available Data Fetching Composables

// 1. useItems - Item catalog with location stock
// File: app/composables/useItems.ts
const { items, pagination, loading, error, refresh } = useItems(filters, options);

// 2. useSuppliers - Supplier/vendor master data
// File: app/composables/useSuppliers.ts
const { suppliers, pagination, loading, error, refresh } = useSuppliers(filters, options);

// 3. useLocations - Location master data
// File: app/composables/useLocations.ts
const { locations, loading, error, refresh } = useLocations(filters, options);

// 4. useCurrentPeriod - Current accounting period (shorter TTL)
// File: app/composables/useCurrentPeriod.ts
const { period, isPeriodOpen, arePricesLocked, loading, refresh } = useCurrentPeriod(options);

// 5. usePeriods - All periods (list)
// File: app/composables/useCurrentPeriod.ts
const { periods, loading, error, refresh } = usePeriods();

// 6. usePeriod - Single period by ID
// File: app/composables/useCurrentPeriod.ts
const { period, loading, error, refresh } = usePeriod(periodId);

// All composables follow the same pattern:
// - Time-based caching (10-20 seconds TTL)
// - Filter-aware cache keys
// - Loading/error state management
// - Manual refresh capability`,

  useCurrentPeriodAdvanced: `// useCurrentPeriod - Advanced Features
// File: app/composables/useCurrentPeriod.ts

export function useCurrentPeriod(options: {
  immediate?: boolean;
  autoRefresh?: boolean;      // Enable polling
  refreshInterval?: number;   // Polling interval in ms (default: 60000)
} = {}) {
  const { immediate = true, autoRefresh = false, refreshInterval = 60000 } = options;

  const { data, status, error, refresh } = useAsyncData<CurrentPeriodResponse>(
    "currentPeriod",  // Fixed key (no filters)
    () => $fetch<CurrentPeriodResponse>("/api/periods/current"),
    {
      getCachedData: (key) => {
        const cached = useNuxtApp().payload.data[key];
        if (!cached) return;

        const now = Date.now();
        const cacheTime = useNuxtApp().payload.data[\`\${key}:time\`] as number;
        // Shorter TTL (10 seconds) - period status is critical
        if (cacheTime && now - cacheTime < 10 * 1000) {
          return cached;
        }
        return;
      },
      immediate,
    }
  );

  // Store timestamp
  watch(data, (newData) => {
    if (newData) {
      useNuxtApp().payload.data["currentPeriod:time"] = Date.now();
    }
  }, { immediate: true });

  // Auto-refresh with polling (optional)
  if (autoRefresh && process.client) {
    let intervalId: NodeJS.Timeout | null = null;

    onMounted(() => {
      intervalId = setInterval(() => refresh(), refreshInterval);
    });

    onUnmounted(() => {
      if (intervalId) clearInterval(intervalId);
    });
  }

  // Computed helpers
  const period = computed(() => data.value?.period || null);
  const loading = computed(() => status.value === "pending");
  const isPeriodOpen = computed(() => data.value?.period?.status === "OPEN");
  const arePricesLocked = computed(() => data.value?.period?.prices_locked || false);

  // Helper methods
  const isLocationReady = (locationId: string) => {
    const locStatus = data.value?.locationStatuses?.find((ls) => ls.location_id === locationId);
    return locStatus?.status === "READY";
  };

  const areAllLocationsReady = () => {
    return data.value?.locationStatuses?.every((ls) => ls.status === "READY") || false;
  };

  const getLocationStatus = (locationId: string) => {
    return data.value?.locationStatuses?.find((ls) => ls.location_id === locationId);
  };

  return {
    period,
    locationStatuses: computed(() => data.value?.locationStatuses || []),
    isPeriodOpen,
    arePricesLocked,
    loading,
    error,
    refresh,
    // Helper methods
    isLocationReady,
    areAllLocationsReady,
    getLocationStatus,
  };
}`,

  composableWithMutation: `// Complete CRUD Pattern with Data Fetching Composable
<script setup lang="ts">
import { useItems, invalidateItemsCache } from "~/composables/useItems";
import { useSmartCacheInvalidation } from "~/composables/useCache";

// Fetch items with caching
const filters = ref({ is_active: true, page: 1, limit: 50 });
const { items, pagination, loading, error, refresh } = useItems(filters, { watch: true });

const smartCache = useSmartCacheInvalidation();

// CREATE - Direct $fetch + cache invalidation
const createItem = async (data: CreateItemInput) => {
  try {
    const newItem = await $fetch("/api/items", {
      method: "POST",
      body: data,
    });

    // Invalidate cache and refresh
    invalidateItemsCache();
    await refresh();

    return { success: true, item: newItem };
  } catch (err) {
    return { success: false, error: err };
  }
};

// UPDATE - Direct $fetch + cache invalidation
const updateItem = async (id: string, data: UpdateItemInput) => {
  try {
    const updatedItem = await $fetch(\`/api/items/\${id}\`, {
      method: "PATCH",
      body: data,
    });

    invalidateItemsCache();
    await refresh();

    return { success: true, item: updatedItem };
  } catch (err) {
    return { success: false, error: err };
  }
};

// DELETE - Direct $fetch + cache invalidation
const deleteItem = async (id: string) => {
  try {
    await $fetch(\`/api/items/\${id}\`, {
      method: "DELETE",
    });

    invalidateItemsCache();
    await refresh();

    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
};

// Business operation with smart invalidation
const postDelivery = async (deliveryData: DeliveryInput) => {
  try {
    const result = await $fetch("/api/deliveries", {
      method: "POST",
      body: deliveryData,
    });

    // Smart invalidation handles all related caches:
    // - Stock, deliveries, dashboard, periods
    smartCache.afterDelivery(deliveryData.location_id);

    return { success: true, delivery: result };
  } catch (err) {
    return { success: false, error: err };
  }
};
\x3C/script>`,

  directFetchPattern: `// Direct $fetch Pattern (Without Composable)
// Use for mutations, one-off fetches, or when caching isn't needed

<script setup lang="ts">
// Manual state management
const items = ref<Item[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
});

// Fetch function
const fetchItems = async () => {
  loading.value = true;
  error.value = null;

  try {
    const params = {
      page: String(pagination.value.page),
      limit: String(pagination.value.limit),
      search: filters.value.search,
      is_active: String(filters.value.is_active),
    };

    const response = await $fetch<ItemsResponse>("/api/items", {
      method: "GET",
      query: params,
    });

    items.value = response.items;
    pagination.value = response.pagination;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "An error occurred";
  } finally {
    loading.value = false;
  }
};

// Call on mount or manually
onMounted(() => {
  fetchItems();
});

// Pagination handler
const onPageChange = async (page: number) => {
  pagination.value.page = page;
  await fetchItems();
};
\x3C/script>

\x3Ctemplate>
  \x3Cdiv>
    \x3Cdiv v-if="loading">Loading...\x3C/div>
    \x3Cdiv v-else-if="error">Error: {{ error }}\x3C/div>
    \x3Cdiv v-else>
      \x3Cdiv v-for="item in items" :key="item.id">
        {{ item.name }}
      \x3C/div>
      \x3CUPagination
        v-model="pagination.page"
        :total="pagination.total"
        :page-size="pagination.limit"
        @update:model-value="onPageChange"
      />
    \x3C/div>
  \x3C/div>
\x3C/template>`,

  whenToUseWhat: `// When to Use Data Fetching Composables vs Direct $fetch

// ✅ USE COMPOSABLES (useItems, useSuppliers, useLocations, etc.) when:

1. Fetching list/master data that benefits from caching
   - Items, Suppliers, Locations, Periods
   - Data that doesn't change frequently
   - Data that's accessed multiple times in short period

2. You want automatic loading/error state management
   - No need to manually manage ref(false) and try/catch

3. You want filter-based caching
   - Different filter combinations cached separately
   - Automatic re-fetch when filters change (with watch: true)

4. You want integration with cache invalidation system
   - Call invalidateItemsCache() after mutations
   - Smart cache invalidation for related data


// ✅ USE DIRECT $fetch when:

1. Performing mutations (CREATE, UPDATE, DELETE)
   - POST, PATCH, PUT, DELETE requests
   - One-time operations, not repeated

2. Fetching data that should never be cached
   - Real-time data
   - User-specific data that changes frequently

3. Complex query logic or conditional fetching
   - Dynamic endpoints
   - Conditional parameters that change frequently

4. Fine-grained control over fetch timing
   - Manual pagination with different patterns
   - Custom loading states
   - Special error handling

5. One-off data fetches
   - Single-use API calls
   - Form submissions
   - Action handlers


// EXAMPLE DECISION FLOW:

// Scenario 1: Loading items for a table with filters
const { items, loading } = useItems(filters, { watch: true }); // ✅ Use composable

// Scenario 2: Creating a new item
await $fetch("/api/items", { method: "POST", body: data }); // ✅ Use $fetch

// Scenario 3: Fetching current user's dashboard data (changes frequently)
const data = await $fetch("/api/dashboard"); // ✅ Use $fetch

// Scenario 4: Loading locations for a dropdown (rarely changes)
const { locations } = useLocations(); // ✅ Use composable`,

  cacheIntegration: `// Cache Integration with Data Fetching Composables

// Each composable exports invalidation helpers:

// From useItems.ts
export function invalidateItemsCache() {
  const nuxtApp = useNuxtApp();
  Object.keys(nuxtApp.payload.data).forEach((key) => {
    if (key.startsWith("items:")) {
      delete nuxtApp.payload.data[key];
    }
  });
}

export function invalidateItemCache(itemId: string) {
  const nuxtApp = useNuxtApp();
  delete nuxtApp.payload.data[\`item:\${itemId}\`];
  delete nuxtApp.payload.data[\`item:\${itemId}:time\`];
  invalidateItemsCache(); // Also invalidate list
}

// Usage after mutations:
const { items, refresh } = useItems();

const createItem = async (data: CreateItemInput) => {
  await $fetch("/api/items", { method: "POST", body: data });

  // Invalidate and refresh
  invalidateItemsCache();
  await refresh();
};

// Integration with useCache for related invalidations:
import { useSmartCacheInvalidation } from "~/composables/useCache";

const smartCache = useSmartCacheInvalidation();

// After posting delivery - invalidates stock, deliveries, dashboard, periods
smartCache.afterDelivery(locationId);

// After item price change - invalidates items and period prices
smartCache.afterPriceChange();`,

  errorHandlingPattern: `// Error Handling in Data Fetching Composables

<script setup lang="ts">
import { useErrorHandler } from "~/composables/useErrorHandler";

const { items, loading, error, refresh } = useItems();
const errorHandler = useErrorHandler();

// Watch for errors and show toast
watch(error, (err) => {
  if (err) {
    errorHandler.handleError(err, {
      context: "Failed to load items",
      showToast: true,
    });
  }
});

// Or handle inline
const fetchItems = async () => {
  const { items, error, refresh } = useItems();

  if (error.value) {
    // Get user-friendly message
    const message = errorHandler.getErrorMessage(error.value, "loading items");

    // Show toast
    errorHandler.handleError(error.value, {
      context: "Failed to load items",
      suggestion: "Please try refreshing the page",
    });
  }
};

// Retry on error
const retryFetch = async () => {
  try {
    await refresh();
  } catch (err) {
    errorHandler.handleError(err, { context: "Retry failed" });
  }
};
\x3C/script>

\x3Ctemplate>
  \x3Cdiv>
    \x3Cdiv v-if="loading">Loading...\x3C/div>
    \x3Cdiv v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4">
      \x3Cp class="text-sm text-red-800">{{ errorHandler.getErrorMessage(error) }}\x3C/p>
      \x3CUButton size="sm" @click="retryFetch">Retry\x3C/UButton>
    \x3C/div>
    \x3Cdiv v-else>
      \x3C!-- Render items -->
    \x3C/div>
  \x3C/div>
\x3C/template>`,

  paginationPattern: `// Pagination Pattern with Data Fetching Composables

<script setup lang="ts">
// Filters include pagination params
const filters = ref({
  search: "",
  is_active: true,
  page: 1,
  limit: 50,
});

// Use composable with watch enabled
const { items, pagination, loading, refresh } = useItems(filters, { watch: true });

// Page change handler - just update filter
const onPageChange = (page: number) => {
  filters.value.page = page;
  // Composable automatically re-fetches due to watch: true
};

// Search handler - reset to page 1
const onSearch = (query: string) => {
  filters.value.search = query;
  filters.value.page = 1; // Reset pagination
  // Automatic re-fetch
};

// Filter change handler
const onFilterChange = () => {
  filters.value.page = 1; // Reset to page 1 on filter change
  // Automatic re-fetch
};
\x3C/script>

\x3Ctemplate>
  \x3Cdiv>
    \x3C!-- Search -->
    \x3CUInput v-model="filters.search" placeholder="Search items..." @input="onSearch" />

    \x3C!-- Filters -->
    \x3CUSelect v-model="filters.is_active" :options="[...]" @change="onFilterChange" />

    \x3C!-- Loading state -->
    \x3Cdiv v-if="loading">Loading...\x3C/div>

    \x3C!-- Items table -->
    \x3CUTable v-else :rows="items" :columns="columns" />

    \x3C!-- Pagination -->
    \x3CUPagination
      v-model="pagination.page"
      :total="pagination.total"
      :page-size="pagination.limit"
      @update:model-value="onPageChange"
    />
  \x3C/div>
\x3C/template>`,

  realWorldExample: `// Real-World Example: Items Page with Full CRUD
// File: app/pages/items/index.vue

<script setup lang="ts">
import { useItems, invalidateItemsCache } from "~/composables/useItems";
import { useSmartCacheInvalidation } from "~/composables/useCache";
import { useErrorHandler } from "~/composables/useErrorHandler";

// Page state
const filters = ref({
  search: "",
  is_active: true,
  page: 1,
  limit: 50,
});

// Fetch items with composable
const { items, pagination, loading, error, refresh } = useItems(filters, { watch: true });

// Utilities
const smartCache = useSmartCacheInvalidation();
const errorHandler = useErrorHandler();

// Create item
const creating = ref(false);
const createItem = async (data: CreateItemInput) => {
  creating.value = true;
  try {
    await $fetch("/api/items", {
      method: "POST",
      body: data,
    });

    invalidateItemsCache();
    await refresh();

    errorHandler.handleSuccess("Item Created", \`\${data.name} has been created\`);
    return { success: true };
  } catch (err) {
    errorHandler.handleError(err, { context: "Failed to create item" });
    return { success: false };
  } finally {
    creating.value = false;
  }
};

// Update item
const updateItem = async (id: string, data: UpdateItemInput) => {
  try {
    await $fetch(\`/api/items/\${id}\`, {
      method: "PATCH",
      body: data,
    });

    invalidateItemsCache();
    await refresh();

    errorHandler.handleSuccess("Item Updated", "Changes saved successfully");
    return { success: true };
  } catch (err) {
    errorHandler.handleError(err, { context: "Failed to update item" });
    return { success: false };
  }
};

// Delete item
const deleteItem = async (id: string, name: string) => {
  try {
    await $fetch(\`/api/items/\${id}\`, {
      method: "DELETE",
    });

    invalidateItemsCache();
    await refresh();

    errorHandler.handleSuccess("Item Deleted", \`\${name} has been removed\`);
    return { success: true };
  } catch (err) {
    errorHandler.handleError(err, { context: "Failed to delete item" });
    return { success: false };
  }
};

// Pagination
const onPageChange = (page: number) => {
  filters.value.page = page;
};

// Search
const onSearch = useDebounceFn((query: string) => {
  filters.value.search = query;
  filters.value.page = 1;
}, 300);
\x3C/script>

\x3Ctemplate>
  \x3Cdiv class="space-y-4">
    \x3C!-- Header with create button -->
    \x3Cdiv class="flex items-center justify-between">
      \x3Ch1 class="text-2xl font-bold">Items\x3C/h1>
      \x3CUButton @click="showCreateModal = true">Create Item\x3C/UButton>
    \x3C/div>

    \x3C!-- Filters -->
    \x3Cdiv class="flex gap-4">
      \x3CUInput
        v-model="filters.search"
        placeholder="Search items..."
        icon="i-heroicons-magnifying-glass"
        @input="onSearch"
      />
      \x3CUSelect v-model="filters.is_active" :options="statusOptions" />
    \x3C/div>

    \x3C!-- Loading state -->
    \x3Cdiv v-if="loading" class="flex justify-center py-8">
      \x3CUIcon name="i-heroicons-arrow-path" class="animate-spin" />
    \x3C/div>

    \x3C!-- Error state -->
    \x3Cdiv v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4">
      \x3Cp class="text-sm text-red-800">{{ errorHandler.getErrorMessage(error) }}\x3C/p>
      \x3CUButton size="sm" @click="refresh">Retry\x3C/UButton>
    \x3C/div>

    \x3C!-- Empty state -->
    \x3Cdiv v-else-if="items.length === 0" class="text-center py-8">
      \x3Cp class="text-gray-500">No items found\x3C/p>
    \x3C/div>

    \x3C!-- Items table -->
    \x3Ctemplate v-else>
      \x3CUTable :rows="items" :columns="columns">
        \x3Ctemplate #actions="{ row }">
          \x3CUButton size="xs" @click="editItem(row)">Edit\x3C/UButton>
          \x3CUButton size="xs" color="red" @click="deleteItem(row.id, row.name)">
            Delete
          \x3C/UButton>
        \x3C/template>
      \x3C/UTable>

      \x3C!-- Pagination -->
      \x3CUPagination
        v-model="pagination.page"
        :total="pagination.total"
        :page-size="pagination.limit"
        @update:model-value="onPageChange"
      />
    \x3C/template>
  \x3C/div>
\x3C/template>`,

  migrationGuide: `// Migration Guide: Direct $fetch → Data Fetching Composable

// ❌ BEFORE: Manual state management, no caching
<script setup lang="ts">
const items = ref<Item[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const fetchItems = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await $fetch<ItemsResponse>("/api/items");
    items.value = response.items;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to fetch";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchItems();
});

watch(filters, () => {
  fetchItems();
});
\x3C/script>


// ✅ AFTER: Automatic caching, loading, error handling
<script setup lang="ts">
import { useItems } from "~/composables/useItems";

const filters = ref({ is_active: true });

// That's it! Automatic:
// - Data fetching on mount
// - Caching (20 seconds)
// - Re-fetch when filters change
// - Loading/error state management
const { items, loading, error, refresh } = useItems(filters, { watch: true });
\x3C/script>


// Benefits:
// ✅ 10 lines → 3 lines
// ✅ Automatic caching with TTL
// ✅ No manual loading/error state
// ✅ No onMounted/watch boilerplate
// ✅ Filter-aware cache keys
// ✅ Integration with cache invalidation system`,

  bestPractices: `// Best Practices for Data Fetching Composables

// ✅ DO: Use composables for list/master data
const { items } = useItems();
const { suppliers } = useSuppliers();
const { locations } = useLocations();

// ✅ DO: Enable watch for reactive filters
const filters = ref({ search: "", is_active: true });
const { items } = useItems(filters, { watch: true });

// ✅ DO: Call invalidation after mutations
const createItem = async (data) => {
  await $fetch("/api/items", { method: "POST", body: data });
  invalidateItemsCache();
  await refresh();
};

// ✅ DO: Use smart cache invalidation for business operations
smartCache.afterDelivery(locationId);
smartCache.afterTransfer(fromId, toId);

// ✅ DO: Handle errors with useErrorHandler
watch(error, (err) => {
  if (err) errorHandler.handleError(err);
});

// ✅ DO: Reset page to 1 on filter change
const onFilterChange = () => {
  filters.value.page = 1;
};


// ❌ DON'T: Use composables for mutations
// Use direct $fetch instead
await $fetch("/api/items", { method: "POST", body: data });

// ❌ DON'T: Forget to invalidate cache after mutations
const updateItem = async (id, data) => {
  await $fetch(\`/api/items/\${id}\`, { method: "PATCH", body: data });
  // Missing: invalidateItemsCache() and refresh()
};

// ❌ DON'T: Use composables for real-time data
// Use direct $fetch or consider polling
const { data } = await $fetch("/api/live-metrics");

// ❌ DON'T: Forget watch: true for reactive filters
// This won't auto-refetch when filters change:
const { items } = useItems(filters); // Missing { watch: true }

// ❌ DON'T: Cache user-specific frequently-changing data
// Use direct $fetch instead
const userData = await $fetch("/api/user/activity");`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
        Data Fetching Composables
      </h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Frontend data fetching patterns with automatic caching, loading states, and cache
        integration
      </p>
    </div>

    <!-- Overview Section -->
    <section
      id="dev-section-data-fetching-overview"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('data-fetching-overview')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-cloud-arrow-down" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Data Fetching Overview
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('data-fetching-overview')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('data-fetching-overview')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          This application uses a multi-layered data fetching architecture that combines
          composable-level caching (via
          <code class="code-inline">useAsyncData</code>
          ), Pinia stores for application state, and direct
          <code class="code-inline">$fetch</code>
          for mutations.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Architecture</h4>
          <DeveloperCodeBlock :code="codeExamples.overview" language="typescript" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key Features</h4>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-clock" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">Automatic Caching</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Time-based TTL (10-20 seconds) with filter-aware keys
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-arrow-path" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">Loading States</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Built-in loading/error state management
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-funnel" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">Reactive Filters</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Auto-refetch when filters change (with watch: true)
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-trash" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">Cache Integration</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Works with cache invalidation system
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- useItems Pattern Section -->
    <section
      id="dev-section-useitems-pattern"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('useitems-pattern')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-cube" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            useItems Pattern (Example)
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('useitems-pattern') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('useitems-pattern')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The
          <code class="code-inline">useItems</code>
          composable demonstrates the standard pattern used by all data fetching composables in this
          application.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Signature</h4>
          <DeveloperCodeBlock
            :code="codeExamples.useItemsSignature"
            language="typescript"
            filename="app/composables/useItems.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Implementation</h4>
          <DeveloperCodeBlock
            :code="codeExamples.useItemsImplementation"
            language="typescript"
            filename="app/composables/useItems.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Usage Examples</h4>
          <DeveloperCodeBlock :code="codeExamples.useItemsUsage" language="vue" />
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              All other composables (useSuppliers, useLocations, etc.) follow the same pattern with
              different endpoints and response types.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Available Composables Section -->
    <section
      id="dev-section-available-composables"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('available-composables')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-rectangle-group" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Available Composables</span>
        </span>
        <UIcon
          :name="
            isExpanded('available-composables')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('available-composables')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The application provides several pre-built data fetching composables for common data
          types.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Composable List</h4>
          <DeveloperCodeBlock :code="codeExamples.availableComposables" language="typescript" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Composable Details</h4>
          <div class="space-y-2 text-sm">
            <div class="flex items-start gap-2">
              <UBadge color="primary" variant="soft" size="xs">useItems</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                Item catalog with optional location stock. Supports pagination, search, active
                filter.
              </span>
            </div>
            <div class="flex items-start gap-2">
              <UBadge color="primary" variant="soft" size="xs">useSuppliers</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                Supplier/vendor master data. Used in delivery and PO forms.
              </span>
            </div>
            <div class="flex items-start gap-2">
              <UBadge color="primary" variant="soft" size="xs">useLocations</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                Location master data with type and status filters.
              </span>
            </div>
            <div class="flex items-start gap-2">
              <UBadge color="warning" variant="soft" size="xs">useCurrentPeriod</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                Current accounting period with shorter TTL (10s). Critical for transaction
                validation.
              </span>
            </div>
            <div class="flex items-start gap-2">
              <UBadge color="primary" variant="soft" size="xs">usePeriods</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                All periods list with 20-second cache.
              </span>
            </div>
            <div class="flex items-start gap-2">
              <UBadge color="primary" variant="soft" size="xs">usePeriod</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                Single period by ID with 20-second cache.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- useCurrentPeriod Advanced Section -->
    <section
      id="dev-section-current-period-advanced"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('current-period-advanced')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-calendar-days" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            useCurrentPeriod Advanced Features
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('current-period-advanced')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('current-period-advanced')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The
          <code class="code-inline">useCurrentPeriod</code>
          composable includes advanced features like auto-refresh polling and helper methods for
          period status.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Advanced Implementation
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.useCurrentPeriodAdvanced"
            language="typescript"
            filename="app/composables/useCurrentPeriod.ts"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key Features</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Shorter TTL (10s):</strong>
                Period status is critical for transaction validation
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Auto-refresh polling:</strong>
                Optional interval-based refresh (default: 60s)
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Helper methods:</strong>
                isLocationReady(), areAllLocationsReady(), getLocationStatus()
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Computed properties:</strong>
                isPeriodOpen, arePricesLocked for easy status checks
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- CRUD with Composables Section -->
    <section
      id="dev-section-crud-composables"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('crud-composables')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-text" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">CRUD with Composables</span>
        </span>
        <UIcon
          :name="
            isExpanded('crud-composables') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('crud-composables')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Use data fetching composables for reads (GET), and direct
          <code class="code-inline">$fetch</code>
          for mutations (POST, PATCH, DELETE) with proper cache invalidation.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Complete CRUD Pattern</h4>
          <DeveloperCodeBlock :code="codeExamples.composableWithMutation" language="vue" />
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Always invalidate cache and refresh</strong>
              after mutations to ensure UI reflects the latest data.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Direct $fetch Pattern Section -->
    <section
      id="dev-section-direct-fetch"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('direct-fetch')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-down-tray" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Direct $fetch Pattern</span>
        </span>
        <UIcon
          :name="isExpanded('direct-fetch') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('direct-fetch')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          For use cases where composables aren't suitable (mutations, real-time data, custom logic),
          use direct
          <code class="code-inline">$fetch</code>
          with manual state management.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Manual Fetch Pattern</h4>
          <DeveloperCodeBlock :code="codeExamples.directFetchPattern" language="vue" />
        </div>
      </div>
    </section>

    <!-- When to Use What Section -->
    <section
      id="dev-section-when-to-use"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('when-to-use')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-question-mark-circle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">When to Use What</span>
        </span>
        <UIcon
          :name="isExpanded('when-to-use') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('when-to-use')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Guidelines for choosing between data fetching composables and direct
          <code class="code-inline">$fetch</code>
          calls.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Decision Guide</h4>
          <DeveloperCodeBlock :code="codeExamples.whenToUseWhat" language="typescript" />
        </div>
      </div>
    </section>

    <!-- Cache Integration Section -->
    <section
      id="dev-section-cache-integration-fetch"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('cache-integration-fetch')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-link" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Cache Integration</span>
        </span>
        <UIcon
          :name="
            isExpanded('cache-integration-fetch')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('cache-integration-fetch')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Data fetching composables integrate with the cache invalidation system. Each composable
          exports invalidation helpers that work with
          <code class="code-inline">useCache</code>
          and
          <code class="code-inline">useSmartCacheInvalidation</code>
          .
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Cache Integration Pattern
          </h4>
          <DeveloperCodeBlock :code="codeExamples.cacheIntegration" language="typescript" />
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              See the
              <strong>Caching System</strong>
              guide for detailed information on cache invalidation patterns and smart invalidation.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Error Handling Section -->
    <section
      id="dev-section-error-handling-fetch"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('error-handling-fetch')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-exclamation-circle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Error Handling</span>
        </span>
        <UIcon
          :name="
            isExpanded('error-handling-fetch')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('error-handling-fetch')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          All data fetching composables return an
          <code class="code-inline">error</code>
          ref that can be used with
          <code class="code-inline">useErrorHandler</code>
          for user-friendly error messages.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Error Handling Pattern</h4>
          <DeveloperCodeBlock :code="codeExamples.errorHandlingPattern" language="vue" />
        </div>
      </div>
    </section>

    <!-- Pagination Section -->
    <section
      id="dev-section-pagination-fetch"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('pagination-fetch')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-bars-3-bottom-left" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Pagination Pattern</span>
        </span>
        <UIcon
          :name="
            isExpanded('pagination-fetch') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('pagination-fetch')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Pagination is handled by including page/limit in filters. With
          <code class="code-inline">watch: true</code>
          , the composable automatically refetches when page changes.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Pagination Pattern</h4>
          <DeveloperCodeBlock :code="codeExamples.paginationPattern" language="vue" />
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Always reset to page 1</strong>
              when filters change to avoid showing empty results from higher page numbers.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Real-World Example Section -->
    <section
      id="dev-section-real-world-fetch"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('real-world-fetch')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-code-bracket-square" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Real-World Example</span>
        </span>
        <UIcon
          :name="
            isExpanded('real-world-fetch') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('real-world-fetch')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          A complete, production-ready example showing items management with full CRUD operations,
          pagination, search, and error handling.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Items Page Implementation
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.realWorldExample"
            language="vue"
            filename="app/pages/items/index.vue"
          />
        </div>
      </div>
    </section>

    <!-- Migration Guide Section -->
    <section
      id="dev-section-migration-fetch"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('migration-fetch')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-right-circle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Migration Guide</span>
        </span>
        <UIcon
          :name="
            isExpanded('migration-fetch') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('migration-fetch')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Refactoring existing code from direct
          <code class="code-inline">$fetch</code>
          to data fetching composables reduces code and improves maintainability.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Before & After</h4>
          <DeveloperCodeBlock :code="codeExamples.migrationGuide" language="vue" />
        </div>
      </div>
    </section>

    <!-- Best Practices Section -->
    <section
      id="dev-section-best-practices-fetch"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('best-practices-fetch')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-check-badge" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Best Practices</span>
        </span>
        <UIcon
          :name="
            isExpanded('best-practices-fetch')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('best-practices-fetch')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Follow these best practices to get the most out of data fetching composables.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Do's and Don'ts</h4>
          <DeveloperCodeBlock :code="codeExamples.bestPractices" language="typescript" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.code-inline {
  @apply rounded bg-[var(--ui-bg-muted)] px-1.5 py-0.5 font-mono text-xs;
}
</style>
