# Data Caching Composables

This directory contains composables that implement client-side caching for frequently accessed data.

## Overview

The caching composables provide:
- **Automatic caching** using Nuxt's `useAsyncData`
- **Cache invalidation** helpers for after mutations
- **Smart cache management** with time-based expiration
- **Type-safe** interfaces for all data

## Available Composables

### 1. useLocations

Cache and fetch locations with filtering support.

```typescript
import { useLocations, useLocation, invalidateLocationsCache } from "~/composables/useLocations";

// Fetch all locations with caching
const { locations, loading, error, refresh } = useLocations();

// Fetch with filters
const filters = ref({ type: "KITCHEN", is_active: true });
const { locations, loading } = useLocations(filters, { watch: true });

// Fetch single location
const { location, loading } = useLocation("location-id");

// Invalidate cache after mutations
invalidateLocationsCache(); // Invalidate all
invalidateLocationCache("location-id"); // Invalidate specific
```

**Cache Duration:** 5 minutes

### 2. useItems

Cache and fetch items with pagination and filtering.

```typescript
import { useItems, useItem, invalidateItemsCache } from "~/composables/useItems";

// Fetch items with caching
const { items, pagination, loading, error, refresh } = useItems();

// Fetch with filters and pagination
const filters = ref({
  category: "Vegetables",
  search: "tomato",
  page: 1,
  limit: 50,
  locationId: "location-id", // Include stock for specific location
});
const { items, pagination, loading } = useItems(filters, { watch: true });

// Fetch single item
const { item, loading } = useItem("item-id");

// Invalidate cache after mutations
invalidateItemsCache(); // Invalidate all
invalidateItemCache("item-id"); // Invalidate specific
```

**Cache Duration:** 5 minutes

### 3. useCurrentPeriod

Cache the current accounting period with helper methods.

```typescript
import { useCurrentPeriod, invalidateCurrentPeriodCache } from "~/composables/useCurrentPeriod";

// Fetch current period with caching
const {
  period,
  loading,
  isPeriodOpen,
  isPeriodClosed,
  arePricesLocked,
  areAllLocationsReady,
  isLocationReady,
  getLocationStatus,
  refresh,
} = useCurrentPeriod();

// With auto-refresh (polls every 60 seconds)
const { period } = useCurrentPeriod({ autoRefresh: true, refreshInterval: 60000 });

// Check period status
if (isPeriodOpen.value) {
  // Post transactions
}

// Check location readiness
if (isLocationReady("location-id")) {
  // Location is ready for period close
}

// Invalidate cache after period operations
invalidateCurrentPeriodCache();
```

**Cache Duration:** 1 minute

### 4. useCache

Centralized cache management and smart invalidation.

```typescript
import { useCache, useSmartCacheInvalidation } from "~/composables/useCache";

// Basic cache management
const cache = useCache();

// Invalidate specific caches
cache.invalidateLocations();
cache.invalidateItems();
cache.invalidatePeriods();
cache.invalidateStock("location-id");
cache.invalidateTransactions("deliveries");
cache.invalidateDashboard("location-id");

// Nuclear option - clear all caches
cache.invalidateAll();

// Debug - get cache statistics
const stats = cache.getCacheStats();
console.log(stats); // { total: 15, locations: 3, items: 5, ... }

// Smart invalidation (automatically invalidates related caches)
const smartCache = useSmartCacheInvalidation();

// After posting a delivery
smartCache.afterDelivery("location-id");

// After posting an issue
smartCache.afterIssue("location-id");

// After creating/approving a transfer
smartCache.afterTransfer("from-location-id", "to-location-id");

// After period close
smartCache.afterPeriodClose();

// After marking location ready
smartCache.afterLocationReady();

// After item price change
smartCache.afterPriceChange();

// After reconciliation
smartCache.afterReconciliation("location-id");
```

## Migration Guide

### Before (Direct Fetch)

```typescript
// Old way - manual loading/error handling
const loading = ref(false);
const error = ref(null);
const locations = ref([]);

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
```

### After (With Caching)

```typescript
// New way - automatic caching, loading, and error handling
const { locations, loading, error } = useLocations();

// No need for onMounted - data fetches automatically
// Cached for 5 minutes - subsequent calls return cached data
```

## Cache Invalidation Strategy

### When to Invalidate

| Operation | Cache to Invalidate | Use |
|-----------|-------------------|-----|
| Create/Update/Delete Location | `invalidateLocations()` | After location mutations |
| Create/Update/Delete Item | `invalidateItems()` | After item mutations |
| Change Item Price | `invalidatePriceChange()` | After price updates |
| Post Delivery | `afterDelivery(locationId)` | After delivery posted |
| Post Issue | `afterIssue(locationId)` | After issue posted |
| Create/Approve Transfer | `afterTransfer(fromId, toId)` | After transfer mutation |
| Close Period | `afterPeriodClose()` | After period closed |
| Mark Location Ready | `afterLocationReady()` | After location marked ready |
| Reconciliation | `afterReconciliation(locationId)` | After reconciliation saved |

### Smart Invalidation

Use `useSmartCacheInvalidation()` composable for automatic related cache invalidation:

```typescript
const smartCache = useSmartCacheInvalidation();

// Automatically invalidates:
// - Stock cache for location
// - Transactions cache (deliveries)
// - Dashboard cache for location
// - Periods cache (for transaction counts)
smartCache.afterDelivery(locationId);
```

## Performance Benefits

1. **Reduced API Calls**: Data cached for 5 minutes (or 1 minute for current period)
2. **Faster Page Loads**: Subsequent navigations use cached data
3. **Better UX**: No loading spinners for cached data
4. **Server-Side Rendering**: Works with Nuxt's SSR (when enabled)
5. **Optimistic Updates**: Use `refresh()` to update cache after mutations

## Best Practices

1. **Always use composables** instead of direct `$fetch` for master data
2. **Invalidate caches** after mutations to keep data fresh
3. **Use smart invalidation** to avoid missing related cache invalidations
4. **Set `watch: true`** for reactive filters
5. **Use `immediate: false`** to defer initial fetch if needed
6. **Check loading state** before rendering data
7. **Handle errors** appropriately with error state

## Example: Complete CRUD with Caching

```typescript
<script setup lang="ts">
import { useLocations, invalidateLocationsCache } from "~/composables/useLocations";

// Fetch locations with caching
const filters = ref({ is_active: true });
const { locations, loading, error, refresh } = useLocations(filters, { watch: true });

// Create location
const createLocation = async (data) => {
  await $fetch("/api/locations", {
    method: "POST",
    body: data,
  });

  // Invalidate cache to show new location
  invalidateLocationsCache();
  refresh(); // Re-fetch to update UI
};

// Update location
const updateLocation = async (id, data) => {
  await $fetch(`/api/locations/${id}`, {
    method: "PATCH",
    body: data,
  });

  // Invalidate cache
  invalidateLocationsCache();
  refresh();
};

// Delete location
const deleteLocation = async (id) => {
  await $fetch(`/api/locations/${id}`, {
    method: "DELETE",
  });

  // Invalidate cache
  invalidateLocationsCache();
  refresh();
};
</script>
```

## Debugging

Check cache statistics in browser console:

```typescript
const cache = useCache();
console.log(cache.getCacheStats());
// Output:
// {
//   total: 25,
//   locations: 3,
//   items: 8,
//   periods: 2,
//   stock: 5,
//   transactions: 4,
//   dashboard: 2,
//   other: 1
// }
```

## Future Enhancements

- [ ] Persistent cache with IndexedDB (offline support)
- [ ] Background cache refresh
- [ ] Cache warming on app load
- [ ] Custom cache TTL per composable
- [ ] Cache size limits
