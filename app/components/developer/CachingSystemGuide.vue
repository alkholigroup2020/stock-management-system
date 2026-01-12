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
  architectureOverview: `// Cache Architecture: Nuxt payload-based caching
//
// ┌─────────────────────────────────────────────────────────────┐
// │                      Client (Browser)                        │
// ├─────────────────────────────────────────────────────────────┤
// │  useAsyncData ──► getCachedData() ──► nuxtApp.payload.data  │
// │        │                                      │              │
// │        │ (cache miss)          (check timestamp)            │
// │        ▼                                      │              │
// │     $fetch ◄──────────────────────────────────┘              │
// │        │                                                     │
// │        │ (store response + timestamp)                        │
// │        ▼                                                     │
// │  nuxtApp.payload.data[key] = response                       │
// │  nuxtApp.payload.data[key + ":time"] = Date.now()           │
// └─────────────────────────────────────────────────────────────┘
//
// Key Features:
// - Time-based cache expiration
// - Automatic cache invalidation helpers
// - Filter-aware cache keys (different filters = different cache)
// - Smart invalidation for related data`,

  useAsyncDataPattern: `// useAsyncData with Timestamp-Based Caching
// File: app/composables/useLocations.ts

export function useLocations(
  filters?: Ref<LocationFilters> | LocationFilters,
  options: { immediate?: boolean; watch?: boolean } = {}
) {
  // Build unique cache key from filters
  const query = computed(() => ({
    type: filterRef.value.type,
    is_active: filterRef.value.is_active,
    search: filterRef.value.search,
  }));

  const { data, error, status, refresh } = useAsyncData<LocationsResponse>(
    // Unique key includes filters for separate caches
    \`locations:\${JSON.stringify(query.value)}\`,
    () => $fetch<LocationsResponse>("/api/locations", { query: query.value }),
    {
      // Custom cache validation
      getCachedData: (key) => {
        const cached = useNuxtApp().payload.data[key];
        if (!cached) return; // Cache miss

        // Check timestamp (20 seconds TTL)
        const now = Date.now();
        const cacheTime = useNuxtApp().payload.data[\`\${key}:time\`] as number;
        if (cacheTime && now - cacheTime < 20 * 1000) {
          return cached; // Cache hit
        }

        return; // Cache expired
      },
      immediate: true,
      watch: [query], // Re-fetch when filters change
    }
  );

  // Store timestamp when data arrives
  watch(data, (newData) => {
    if (newData) {
      useNuxtApp().payload.data[\`locations:\${JSON.stringify(query.value)}:time\`] = Date.now();
    }
  }, { immediate: true });

  return { data, loading: computed(() => status.value === "pending"), refresh };
}`,

  cacheCategories: `// Cache Categories and Their Keys
//
// ┌──────────────────┬─────────────────────────────┬─────────┐
// │ Category         │ Key Pattern                 │ TTL     │
// ├──────────────────┼─────────────────────────────┼─────────┤
// │ Locations        │ locations:{filters}         │ 20 sec  │
// │                  │ location:{id}               │ 20 sec  │
// ├──────────────────┼─────────────────────────────┼─────────┤
// │ Items            │ items:{filters}             │ 20 sec  │
// │                  │ item:{id}                   │ 20 sec  │
// ├──────────────────┼─────────────────────────────┼─────────┤
// │ Periods          │ currentPeriod               │ 10 sec  │
// │                  │ periods                     │ 20 sec  │
// │                  │ period:{id}                 │ 20 sec  │
// ├──────────────────┼─────────────────────────────┼─────────┤
// │ Suppliers        │ suppliers:{filters}         │ 20 sec  │
// │                  │ supplier:{id}               │ 20 sec  │
// ├──────────────────┼─────────────────────────────┼─────────┤
// │ Stock            │ stock:{locationId}:{...}    │ 20 sec  │
// ├──────────────────┼─────────────────────────────┼─────────┤
// │ Transactions     │ deliveries:{...}            │ 20 sec  │
// │                  │ issues:{...}                │ 20 sec  │
// │                  │ transfers:{...}             │ 20 sec  │
// ├──────────────────┼─────────────────────────────┼─────────┤
// │ Dashboard        │ dashboard:{locationId}      │ 20 sec  │
// └──────────────────┴─────────────────────────────┴─────────┘`,

  useCacheBasic: `// useCache Composable - Basic Usage
// File: app/composables/useCache.ts

import { useCache } from "~/composables/useCache";

// Get cache utilities
const cache = useCache();

// Invalidate by category
cache.invalidateLocations();      // All location caches
cache.invalidateLocation("id");   // Specific location
cache.invalidateItems();          // All item caches
cache.invalidateItem("id");       // Specific item
cache.invalidatePeriods();        // All period caches
cache.invalidateSuppliers();      // All supplier caches
cache.invalidateSupplier("id");   // Specific supplier

// Invalidate operational data
cache.invalidateStock("locationId");           // Stock for location
cache.invalidateTransactions("deliveries");    // Specific type
cache.invalidateTransactions();                // All transactions
cache.invalidateDashboard("locationId");       // Dashboard for location

// Nuclear option - clear all (except auth)
cache.invalidateAll();

// Debug - get cache statistics
const stats = cache.getCacheStats();
console.log(stats);
// {
//   total: 25,
//   locations: 3,
//   items: 8,
//   periods: 2,
//   suppliers: 2,
//   stock: 5,
//   transactions: 4,
//   dashboard: 1,
//   other: 0
// }`,

  useCacheImplementation: `// useCache Implementation
// File: app/composables/useCache.ts

export function useCache() {
  /**
   * Invalidate stock-related caches
   * Use after: Deliveries, issues, transfers, reconciliations
   */
  const invalidateStock = (locationId?: string) => {
    const nuxtApp = useNuxtApp();

    Object.keys(nuxtApp.payload.data).forEach((key) => {
      if (key.startsWith("stock:")) {
        // If locationId provided, only invalidate that location
        if (locationId && !key.includes(locationId)) {
          return;
        }
        delete nuxtApp.payload.data[key];
      }
    });

    // Also invalidate items cache if location stock was updated
    if (locationId) {
      invalidateItemsCache();
    }
  };

  /**
   * Invalidate transaction caches by type
   */
  const invalidateTransactions = (type?: "deliveries" | "issues" | "transfers") => {
    const nuxtApp = useNuxtApp();

    Object.keys(nuxtApp.payload.data).forEach((key) => {
      if (type) {
        if (key.startsWith(\`\${type}:\`)) {
          delete nuxtApp.payload.data[key];
        }
      } else {
        // Invalidate all transaction types
        if (
          key.startsWith("deliveries:") ||
          key.startsWith("issues:") ||
          key.startsWith("transfers:")
        ) {
          delete nuxtApp.payload.data[key];
        }
      }
    });

    // Transactions affect stock
    invalidateStock();
  };

  return { invalidateStock, invalidateTransactions, /* ... */ };
}`,

  smartCacheUsage: `// useSmartCacheInvalidation - Automatic Related Cache Invalidation
// File: app/composables/useCache.ts

import { useSmartCacheInvalidation } from "~/composables/useCache";

const smartCache = useSmartCacheInvalidation();

// After posting a delivery - automatically invalidates:
// - Stock cache for location
// - Deliveries transaction cache
// - Dashboard cache for location
// - Periods cache (transaction counts)
smartCache.afterDelivery(locationId);

// After posting an issue
smartCache.afterIssue(locationId);

// After creating/approving/completing a transfer
smartCache.afterTransfer(fromLocationId, toLocationId);

// After period close
smartCache.afterPeriodClose();

// After marking location ready for close
smartCache.afterLocationReady();

// After item price change
smartCache.afterPriceChange();

// After reconciliation
smartCache.afterReconciliation(locationId);`,

  smartCacheImplementation: `// useSmartCacheInvalidation Implementation
// File: app/composables/useCache.ts

export function useSmartCacheInvalidation() {
  const cache = useCache();

  /**
   * Invalidate caches after a delivery is posted
   * A delivery affects:
   * - Stock levels at the location
   * - Delivery transaction list
   * - Dashboard metrics
   * - Period transaction counts
   */
  const afterDelivery = (locationId: string) => {
    cache.invalidateStock(locationId);
    cache.invalidateTransactions("deliveries");
    cache.invalidateDashboard(locationId);
    cache.invalidatePeriods(); // For transaction counts
  };

  /**
   * Invalidate caches after a transfer is completed
   * A transfer affects both source and destination locations
   */
  const afterTransfer = (fromLocationId: string, toLocationId?: string) => {
    cache.invalidateStock(fromLocationId);
    if (toLocationId) {
      cache.invalidateStock(toLocationId);
    }
    cache.invalidateTransactions("transfers");
    cache.invalidateDashboard(fromLocationId);
    if (toLocationId) {
      cache.invalidateDashboard(toLocationId);
    }
  };

  /**
   * Invalidate caches after period close
   * Affects all period-related and location data
   */
  const afterPeriodClose = () => {
    cache.invalidatePeriods();
    cache.invalidateStock();
    cache.invalidateDashboard();
  };

  return { afterDelivery, afterTransfer, afterPeriodClose, /* ... */ };
}`,

  fetchingComposablePattern: `// Data Fetching Composable with Caching
// This pattern is used by useLocations, useItems, useSuppliers, etc.

export function useLocations(filters?: Ref<LocationFilters>) {
  const filterRef = isRef(filters) ? filters : ref(filters || {});

  // Build query params from filters
  const query = computed(() => {
    const params: Record<string, string | boolean> = {};
    if (filterRef.value.type) params.type = filterRef.value.type;
    if (filterRef.value.is_active !== undefined) {
      params.is_active = filterRef.value.is_active;
    }
    if (filterRef.value.search) params.search = filterRef.value.search;
    return params;
  });

  // Use useAsyncData with caching
  const { data, error, status, refresh } = useAsyncData<LocationsResponse>(
    \`locations:\${JSON.stringify(query.value)}\`,  // Filter-aware key
    () => $fetch<LocationsResponse>("/api/locations", { query: query.value }),
    {
      getCachedData: (key) => {
        const cached = useNuxtApp().payload.data[key];
        if (!cached) return;

        const now = Date.now();
        const cacheTime = useNuxtApp().payload.data[\`\${key}:time\`] as number;
        if (cacheTime && now - cacheTime < 20 * 1000) {
          return cached;
        }
        return;
      },
      watch: [query],  // Re-fetch when filters change
    }
  );

  // Store cache timestamp
  watch(data, (newData) => {
    if (newData) {
      useNuxtApp().payload.data[\`locations:\${JSON.stringify(query.value)}:time\`] = Date.now();
    }
  }, { immediate: true });

  // Return reactive data
  const locations = computed(() => data.value?.locations || []);
  const loading = computed(() => status.value === "pending");

  return { locations, loading, error, refresh };
}`,

  invalidationFunctions: `// Invalidation Functions Pattern
// Each composable exports its own invalidation helpers

// Invalidate ALL items in a category
export function invalidateLocationsCache() {
  const nuxtApp = useNuxtApp();

  // Find all location cache keys and remove them
  Object.keys(nuxtApp.payload.data).forEach((key) => {
    if (key.startsWith("locations:")) {
      delete nuxtApp.payload.data[key];
    }
  });
}

// Invalidate a SPECIFIC item (also invalidates list)
export function invalidateLocationCache(locationId: string) {
  const nuxtApp = useNuxtApp();

  // Remove specific location cache and timestamp
  delete nuxtApp.payload.data[\`location:\${locationId}\`];
  delete nuxtApp.payload.data[\`location:\${locationId}:time\`];

  // Also invalidate the list cache as it may contain this item
  invalidateLocationsCache();
}`,

  currentPeriodCache: `// Current Period Cache - Shorter TTL for Critical Data
// File: app/composables/useCurrentPeriod.ts

export function useCurrentPeriod(options: {
  immediate?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
} = {}) {
  const { autoRefresh = false, refreshInterval = 60000 } = options;

  const { data, refresh } = useAsyncData<CurrentPeriodResponse>(
    "currentPeriod",  // Fixed key (no filters)
    () => $fetch<CurrentPeriodResponse>("/api/periods/current"),
    {
      // Shorter TTL (10 seconds) - period status is critical
      getCachedData: (key) => {
        const cached = useNuxtApp().payload.data[key];
        if (!cached) return;

        const now = Date.now();
        const cacheTime = useNuxtApp().payload.data[\`\${key}:time\`] as number;
        if (cacheTime && now - cacheTime < 10 * 1000) {
          return cached;
        }
        return;
      },
    }
  );

  // Optional: Auto-refresh at intervals
  if (autoRefresh && process.client) {
    let intervalId: NodeJS.Timeout | null = null;

    onMounted(() => {
      intervalId = setInterval(() => refresh(), refreshInterval);
    });

    onUnmounted(() => {
      if (intervalId) clearInterval(intervalId);
    });
  }

  // Computed helpers for period status
  const isPeriodOpen = computed(() => data.value?.period?.status === "OPEN");
  const arePricesLocked = computed(() => data.value?.period?.prices_locked || false);

  return { period: computed(() => data.value?.period), isPeriodOpen, arePricesLocked, refresh };
}`,

  crudExample: `// Complete CRUD with Cache Invalidation
<script setup lang="ts">
import { useLocations, invalidateLocationsCache } from "~/composables/useLocations";
import { useCache, useSmartCacheInvalidation } from "~/composables/useCache";

// Fetch locations with caching
const filters = ref({ is_active: true });
const { locations, loading, error, refresh } = useLocations(filters, { watch: true });

// Smart cache for related invalidations
const smartCache = useSmartCacheInvalidation();

// CREATE
const createLocation = async (data: CreateLocationInput) => {
  await $fetch("/api/locations", {
    method: "POST",
    body: data,
  });

  // Invalidate cache and refresh
  invalidateLocationsCache();
  await refresh();
};

// UPDATE
const updateLocation = async (id: string, data: UpdateLocationInput) => {
  await $fetch(\`/api/locations/\${id}\`, {
    method: "PATCH",
    body: data,
  });

  invalidateLocationsCache();
  await refresh();
};

// DELETE
const deleteLocation = async (id: string) => {
  await $fetch(\`/api/locations/\${id}\`, {
    method: "DELETE",
  });

  invalidateLocationsCache();
  await refresh();
};

// POST DELIVERY (with smart invalidation)
const postDelivery = async (deliveryData: DeliveryInput) => {
  const result = await $fetch("/api/deliveries", {
    method: "POST",
    body: deliveryData,
  });

  // Smart invalidation handles all related caches
  smartCache.afterDelivery(deliveryData.location_id);
};
\x3C/script>`,

  migrationGuide: `// Migration: Direct $fetch → Caching Composable

// BEFORE: Manual loading/error handling, no caching
const loading = ref(false);
const error = ref<string | null>(null);
const locations = ref<Location[]>([]);

const fetchLocations = async () => {
  loading.value = true;
  try {
    const response = await $fetch("/api/locations");
    locations.value = response.locations;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchLocations();
});


// AFTER: Automatic caching, loading, error handling
import { useLocations } from "~/composables/useLocations";

const { locations, loading, error } = useLocations();

// That's it! Data fetches automatically and is cached for 20 seconds
// No need for onMounted, manual loading state, or error handling

// With filters:
const filters = ref({ type: "KITCHEN", is_active: true });
const { locations, loading } = useLocations(filters, { watch: true });
// Automatically re-fetches when filters change`,

  debuggingCache: `// Debugging Cache
import { useCache } from "~/composables/useCache";

const cache = useCache();

// Get cache statistics
const stats = cache.getCacheStats();
console.log("Cache Stats:", stats);
// Output:
// {
//   total: 25,
//   locations: 3,
//   items: 8,
//   periods: 2,
//   suppliers: 2,
//   stock: 5,
//   transactions: 4,
//   dashboard: 1,
//   other: 0
// }

// Inspect raw cache data
const nuxtApp = useNuxtApp();
console.log("All Cache Keys:", Object.keys(nuxtApp.payload.data));
// ["locations:{}", "locations:{}:time", "currentPeriod", "currentPeriod:time", ...]

// Check specific cache entry
const locationsData = nuxtApp.payload.data["locations:{}"];
const locationsTime = nuxtApp.payload.data["locations:{}:time"];
const age = Date.now() - locationsTime;
console.log(\`Locations cache age: \${age}ms\`);

// Force clear all caches (for debugging)
cache.invalidateAll();`,

  invalidationTable: `// Cache Invalidation Quick Reference
//
// ┌─────────────────────────────────┬─────────────────────────────────┐
// │ After This Operation...         │ Call This Invalidation          │
// ├─────────────────────────────────┼─────────────────────────────────┤
// │ Create/Update/Delete Location   │ invalidateLocationsCache()      │
// │ Create/Update/Delete Item       │ invalidateItemsCache()          │
// │ Change Item Price               │ smartCache.afterPriceChange()   │
// │ Create/Update/Delete Supplier   │ invalidateSuppliersCache()      │
// ├─────────────────────────────────┼─────────────────────────────────┤
// │ Post Delivery                   │ smartCache.afterDelivery(locId) │
// │ Post Issue                      │ smartCache.afterIssue(locId)    │
// │ Create/Approve/Complete Transfer│ smartCache.afterTransfer(from,to)│
// ├─────────────────────────────────┼─────────────────────────────────┤
// │ Close Period                    │ smartCache.afterPeriodClose()   │
// │ Mark Location Ready             │ smartCache.afterLocationReady() │
// │ Save Reconciliation             │ smartCache.afterReconciliation()│
// ├─────────────────────────────────┼─────────────────────────────────┤
// │ Logout / Major State Change     │ cache.invalidateAll()           │
// └─────────────────────────────────┴─────────────────────────────────┘`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Caching System</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Client-side data caching with useAsyncData, time-based expiration, and smart invalidation
      </p>
    </div>

    <!-- Cache Architecture Overview Section -->
    <section
      id="dev-section-cache-overview"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('cache-overview')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-square-3-stack-3d" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Cache Architecture Overview
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('cache-overview') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('cache-overview')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The caching system uses Nuxt's
          <code class="code-inline">useAsyncData</code>
          with
          <code class="code-inline">nuxtApp.payload.data</code>
          for client-side caching. Each cache entry stores both the data and a timestamp for
          time-based expiration.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">How It Works</h4>
          <DeveloperCodeBlock :code="codeExamples.architectureOverview" language="plaintext" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key Concepts</h4>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-clock" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">Time-Based TTL</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Each cache entry expires after a set time (10-20 seconds)
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-key" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">Filter-Aware Keys</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Different filters create different cache entries
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-trash" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">
                  Manual Invalidation
                </span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Call invalidation helpers after mutations
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-link" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">
                  Smart Invalidation
                </span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Automatically invalidates related caches
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Cache Categories Section -->
    <section
      id="dev-section-cache-categories"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('cache-categories')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-rectangle-group" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Cache Categories</span>
        </span>
        <UIcon
          :name="
            isExpanded('cache-categories') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('cache-categories')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Caches are organized by category with consistent key patterns. Each category has its own
          TTL (Time To Live) based on how frequently the data changes.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Cache Key Patterns & TTLs
          </h4>
          <DeveloperCodeBlock :code="codeExamples.cacheCategories" language="plaintext" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Category Details</h4>
          <div class="space-y-2 text-sm">
            <div class="flex items-start gap-2">
              <UBadge color="primary" variant="soft" size="xs">Locations</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                Master data for all locations. Rarely changes during a session.
              </span>
            </div>
            <div class="flex items-start gap-2">
              <UBadge color="primary" variant="soft" size="xs">Items</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                Product catalog with optional location stock. Includes pagination.
              </span>
            </div>
            <div class="flex items-start gap-2">
              <UBadge color="warning" variant="soft" size="xs">Periods</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                Current period has shorter TTL (10s) since status is critical for transactions.
              </span>
            </div>
            <div class="flex items-start gap-2">
              <UBadge color="primary" variant="soft" size="xs">Suppliers</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                Vendor master data. Used in delivery and PO forms.
              </span>
            </div>
            <div class="flex items-start gap-2">
              <UBadge color="success" variant="soft" size="xs">Stock</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                Location-specific inventory levels. Changes with transactions.
              </span>
            </div>
            <div class="flex items-start gap-2">
              <UBadge color="info" variant="soft" size="xs">Transactions</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                Deliveries, issues, and transfers. Changes frequently during operations.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- useAsyncData Pattern Section -->
    <section
      id="dev-section-useAsyncData-pattern"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('useAsyncData-pattern')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-code-bracket" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            useAsyncData with Timestamps
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('useAsyncData-pattern')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('useAsyncData-pattern')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Data fetching composables use Nuxt's
          <code class="code-inline">useAsyncData</code>
          with a custom
          <code class="code-inline">getCachedData</code>
          function to implement time-based caching.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Standard Caching Pattern
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.useAsyncDataPattern"
            language="typescript"
            filename="app/composables/useLocations.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Fetching Composable Pattern
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.fetchingComposablePattern"
            language="typescript"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              The cache key includes serialized filters, so different filter combinations are cached
              separately. This prevents stale data when switching between filtered views.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- useCache Composable Section -->
    <section
      id="dev-section-useCache"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('useCache')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-archive-box" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">useCache Composable</span>
        </span>
        <UIcon
          :name="isExpanded('useCache') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('useCache')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The
          <code class="code-inline">useCache()</code>
          composable provides centralized cache management and invalidation utilities.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Basic Usage</h4>
          <DeveloperCodeBlock
            :code="codeExamples.useCacheBasic"
            language="typescript"
            filename="app/composables/useCache.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Implementation Details</h4>
          <DeveloperCodeBlock
            :code="codeExamples.useCacheImplementation"
            language="typescript"
            filename="app/composables/useCache.ts"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Available Methods</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <code class="code-inline">invalidateLocations()</code>
                - All location caches
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <code class="code-inline">invalidateItems()</code>
                - All item caches
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <code class="code-inline">invalidatePeriods()</code>
                - All period caches
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <code class="code-inline">invalidateStock(locationId?)</code>
                - Stock caches
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <code class="code-inline">invalidateTransactions(type?)</code>
                - Transaction caches
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <code class="code-inline">invalidateAll()</code>
                - Nuclear option (except auth)
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <code class="code-inline">getCacheStats()</code>
                - Debug cache statistics
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Smart Cache Invalidation Section -->
    <section
      id="dev-section-smart-cache"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('smart-cache')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-sparkles" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Smart Cache Invalidation
          </span>
        </span>
        <UIcon
          :name="isExpanded('smart-cache') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('smart-cache')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The
          <code class="code-inline">useSmartCacheInvalidation()</code>
          composable automatically invalidates related caches based on the operation type. Use this
          after business operations to ensure all affected data is refreshed.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Usage</h4>
          <DeveloperCodeBlock
            :code="codeExamples.smartCacheUsage"
            language="typescript"
            filename="app/composables/useCache.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Implementation</h4>
          <DeveloperCodeBlock
            :code="codeExamples.smartCacheImplementation"
            language="typescript"
            filename="app/composables/useCache.ts"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Always use smart invalidation</strong>
              after business operations (deliveries, issues, transfers, etc.) to avoid stale data in
              related views.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Cache Invalidation Strategies Section -->
    <section
      id="dev-section-invalidation-strategies"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('invalidation-strategies')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-path" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Cache Invalidation Strategies
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('invalidation-strategies')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('invalidation-strategies')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Cache invalidation is critical for keeping data fresh after mutations. Follow this quick
          reference to know which invalidation to call.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Quick Reference</h4>
          <DeveloperCodeBlock :code="codeExamples.invalidationTable" language="plaintext" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Invalidation Function Pattern
          </h4>
          <DeveloperCodeBlock :code="codeExamples.invalidationFunctions" language="typescript" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Best Practices</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Use smart invalidation</strong>
                for business operations (deliveries, issues, transfers)
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Use category invalidation</strong>
                for master data CRUD (locations, items, suppliers)
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Call refresh()</strong>
                after invalidation to update the current view
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-x-circle" class="mt-0.5 text-[var(--ui-error)]" />
              <span>
                <strong>Avoid invalidateAll()</strong>
                unless necessary (logout, major state change)
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Current Period Cache Section -->
    <section
      id="dev-section-period-cache"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('period-cache')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-calendar-days" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Current Period Cache</span>
        </span>
        <UIcon
          :name="isExpanded('period-cache') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('period-cache')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The current period has a shorter TTL (10 seconds) because period status is critical for
          validating transactions. If the period closes, users should know quickly.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Implementation</h4>
          <DeveloperCodeBlock
            :code="codeExamples.currentPeriodCache"
            language="typescript"
            filename="app/composables/useCurrentPeriod.ts"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-error)]">
            <UIcon name="i-heroicons-exclamation-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Critical:</strong>
              Always check
              <code class="code-inline">isPeriodOpen</code>
              before allowing transaction posts. A closed period means no new transactions can be
              recorded.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Complete CRUD Example Section -->
    <section
      id="dev-section-crud-example"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('crud-example')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-text" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Complete CRUD Example</span>
        </span>
        <UIcon
          :name="isExpanded('crud-example') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('crud-example')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          This example shows how to use caching composables with full CRUD operations, including
          proper cache invalidation after each mutation.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Full CRUD with Cache Invalidation
          </h4>
          <DeveloperCodeBlock :code="codeExamples.crudExample" language="vue" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Migration Guide</h4>
          <DeveloperCodeBlock :code="codeExamples.migrationGuide" language="typescript" />
        </div>
      </div>
    </section>

    <!-- Debugging Section -->
    <section
      id="dev-section-debugging"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('debugging')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-bug-ant" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Debugging Cache</span>
        </span>
        <UIcon
          :name="isExpanded('debugging') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('debugging')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Use these techniques to debug caching issues and understand what data is cached.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Debugging Techniques</h4>
          <DeveloperCodeBlock :code="codeExamples.debuggingCache" language="typescript" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Common Issues</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="mt-0.5 text-[var(--ui-warning)]"
              />
              <span>
                <strong>Stale data:</strong>
                Forgot to invalidate cache after mutation. Use smart invalidation.
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="mt-0.5 text-[var(--ui-warning)]"
              />
              <span>
                <strong>Data not updating:</strong>
                Called invalidation but not
                <code class="code-inline">refresh()</code>
                . Always refresh after invalidation.
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="mt-0.5 text-[var(--ui-warning)]"
              />
              <span>
                <strong>Wrong data for filters:</strong>
                Filters changed but cache key didn't include filters. Use filter-aware keys.
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="mt-0.5 text-[var(--ui-warning)]"
              />
              <span>
                <strong>Too many API calls:</strong>
                Cache TTL too short or not using caching composables. Check cache stats.
              </span>
            </li>
          </ul>
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
