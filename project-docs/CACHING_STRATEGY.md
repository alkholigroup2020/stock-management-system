# Caching Strategy

This document describes the multi-layer caching architecture used in the Stock Management System.

## Overview

The application uses a **multi-layer caching approach** combining:

1. Client-side data caching via `useAsyncData`
2. Pinia store caching
3. Smart cache invalidation utilities
4. HTTP Cache-Control headers
5. PWA/Service Worker caching

---

## 1. Client-Side Data Caching (Primary)

Located in `/app/composables/`, these composables use Nuxt's `useAsyncData` with custom `getCachedData` callbacks.

### Cache TTLs by Composable

| Composable | TTL | File |
|------------|-----|------|
| `useCurrentPeriod` | 10 seconds | `useCurrentPeriod.ts` |
| `useItems` | 20 seconds | `useItems.ts` |
| `useLocations` | 20 seconds | `useLocations.ts` |
| `useSuppliers` | 20 seconds | `useSuppliers.ts` |

### How It Works

```typescript
// Example from useItems.ts
const { data, refresh } = useAsyncData(
  cacheKey,
  () => $fetch('/api/items', { query: filters }),
  {
    getCachedData(key, nuxtApp) {
      const cached = nuxtApp.payload.data[key];
      const cacheTime = nuxtApp.payload.data[`${key}:time`];

      // Return cached data if within TTL (20 seconds)
      if (cached && cacheTime && Date.now() - cacheTime < 20000) {
        return cached;
      }
      return null; // Force refetch
    }
  }
);
```

### Features

- **Pagination-aware**: Separate cache keys per filter combination
- **Automatic invalidation**: Watches filter changes and invalidates cache
- **Manual refresh**: All composables expose `refresh()` for forced updates

---

## 2. Pinia Store Caching

Located in `/app/stores/`, these stores maintain global state with built-in cache timeout mechanisms.

### Cache TTLs by Store

| Store | TTL | File |
|-------|-----|------|
| `useLocationStore` | 5 minutes (300,000ms) | `location.ts` |
| `usePeriodStore` | 10 minutes (600,000ms) | `period.ts` |

### How It Works

```typescript
// Example from useLocationStore
const CACHE_TIMEOUT = 300000; // 5 minutes

const isCacheValid = computed(() => {
  if (!lastFetched.value) return false;
  return Date.now() - lastFetched.value < CACHE_TIMEOUT;
});

async function fetchLocations(forceRefresh = false) {
  if (!forceRefresh && isCacheValid.value) {
    return; // Use cached data
  }
  // Fetch from API...
  lastFetched.value = Date.now();
}
```

---

## 3. Smart Cache Invalidation

Located in `/app/composables/useCache.ts`, this utility provides operation-based cache invalidation.

### Granular Invalidation Functions

| Function | Invalidates |
|----------|-------------|
| `invalidateLocations()` | All location caches |
| `invalidateLocation(id)` | Single location cache |
| `invalidateItems()` | All item caches |
| `invalidateItem(id)` | Single item cache |
| `invalidatePeriods()` | Period caches |
| `invalidateSuppliers()` | Supplier caches |
| `invalidateStock(locationId?)` | Stock-related caches |
| `invalidateTransactions(type?)` | Delivery/issue/transfer caches |
| `invalidateDashboard(locationId?)` | Dashboard caches |
| `invalidateAll()` | Everything except auth |

### Operation-Based Invalidation (useSmartCacheInvalidation)

| Function | Use Case | What Gets Invalidated |
|----------|----------|----------------------|
| `afterDelivery(locationId)` | After posting a delivery | Stock, transactions, dashboard, periods |
| `afterIssue(locationId)` | After posting an issue | Stock, transactions, dashboard, periods |
| `afterTransfer(from, to)` | After completing a transfer | Both locations' stock, transactions, dashboard |
| `afterPeriodClose()` | After closing a period | Full cache invalidation |
| `afterLocationReady()` | After marking location ready | Periods |
| `afterPriceChange()` | After updating prices | Items, periods |
| `afterReconciliation(locationId)` | After saving reconciliation | Stock, dashboard, periods |

### Debug Utility

```typescript
const { getCacheStats } = useCache();
console.log(getCacheStats()); // Returns categorized cache entry counts
```

---

## 4. HTTP Cache-Control Headers (Server-Side)

Located in `/server/utils/performance.ts`, the `setCacheHeaders` utility sets browser-level caching.

### Current Configuration

**All endpoints now use 2-second caching:**

```typescript
setCacheHeaders(event, {
  maxAge: 2,              // Browser caches for 2 seconds
  staleWhileRevalidate: 2 // Can use stale data for 2 seconds while revalidating
});
```

### Endpoints Using Cache Headers

| Endpoint | File |
|----------|------|
| `/api/periods/current` | `periods/current.get.ts` |
| `/api/periods` | `periods/index.get.ts` |
| `/api/items` | `items/index.get.ts` |
| `/api/locations` | `locations/index.get.ts` |
| `/api/suppliers` | `suppliers/index.get.ts` |
| `/api/user/locations` | `user/locations.get.ts` |
| `/api/ncrs` | `ncrs/index.get.ts` |
| `/api/transfers` | `transfers/index.get.ts` |
| `/api/stock/consolidated` | `stock/consolidated.get.ts` |
| `/api/reconciliations/consolidated` | `reconciliations/consolidated.get.ts` |
| `/api/reports/deliveries` | `reports/deliveries.get.ts` |
| `/api/reports/issues` | `reports/issues.get.ts` |
| `/api/reports/stock-now` | `reports/stock-now.get.ts` |
| `/api/reports/reconciliation` | `reports/reconciliation.get.ts` |

### Default Value

If `maxAge` is not specified, the default is **2 seconds** (configured in `performance.ts`).

---

## 5. PWA/Service Worker Caching

Configured in `nuxt.config.ts` under the `pwa` section.

### Static Assets

- **Strategy**: CacheFirst
- **Includes**: JS, CSS, HTML, images, SVGs, ICO, WOFF2 files
- **Managed by**: Workbox

### External Resources

| Resource | TTL | Strategy | Max Entries |
|----------|-----|----------|-------------|
| Google Fonts (googleapis.com) | 1 year | CacheFirst | 10 |
| Google Static Fonts (gstatic.com) | 1 year | CacheFirst | 10 |

### API Routes

- **Excluded from Service Worker**: All `/api/*` routes
- **Reason**: Ensures fresh data is always fetched from server

### Configuration

```typescript
// nuxt.config.ts
pwa: {
  registerType: "autoUpdate",
  workbox: {
    navigateFallback: "/",
    cleanupOutdatedCaches: true,
    navigateFallbackDenylist: [/^\/api\//] // Exclude API routes
  }
}
```

---

## Cache TTL Summary Table

| Cache Type | TTL | Storage | Scope |
|------------|-----|---------|-------|
| Items (useAsyncData) | 20 sec | nuxtApp.payload.data | Per filter combo |
| Locations (useAsyncData) | 20 sec | nuxtApp.payload.data | Per filter combo |
| Suppliers (useAsyncData) | 20 sec | nuxtApp.payload.data | Per filter combo |
| Current Period (useAsyncData) | 10 sec | nuxtApp.payload.data | Global |
| All Periods (useAsyncData) | 20 sec | nuxtApp.payload.data | Global |
| Location Store (Pinia) | 5 min | Pinia state | Global |
| Period Store (Pinia) | 10 min | Pinia state | Global |
| HTTP Cache-Control | 2 sec | Browser HTTP cache | Per request |
| Google Fonts | 1 year | Service Worker cache | Static |
| Theme Preference | Persistent | localStorage | User preference |

---

## Key Design Characteristics

1. **Multi-Layer Approach**: Combines useAsyncData, Pinia stores, and HTTP headers
2. **Conservative TTLs**: Short cache periods (2-20 seconds) for critical business data
3. **Automatic Invalidation**: Smart cache invalidation based on operation type
4. **Manual Override**: All caches support forced refresh via `forceRefresh` parameters
5. **PWA-Ready**: Service worker caching for offline-awareness (static assets only)
6. **No IndexedDB**: Relies on in-memory and browser HTTP caching (offline database deferred to post-MVP)
7. **Debug-Friendly**: Cache statistics available via `getCacheStats()` for monitoring

---

## Recommendations

### Current State Assessment

The HTTP Cache-Control has been set to **2 seconds** across all endpoints. This effectively disables browser-level caching and has the following implications:

#### Positive Effects

- **Fresher Data**: Users see near real-time information
- **Reduced Stale Data Issues**: Critical for inventory accuracy
- **Simpler Mental Model**: Less confusion about when data updates

#### Negative Effects

- **Increased Server Load**: More API requests hit the server
- **Higher Database Load**: Expensive endpoints (reconciliation, reports) query DB more frequently
- **Increased Latency**: Users experience network round-trips more often
- **Higher Bandwidth Usage**: More data transferred between client and server

### Suggested Improvements

1. **Consider Increasing HTTP Cache for Read-Heavy Endpoints**

   For endpoints that are read frequently but change rarely, consider higher cache values:

   ```typescript
   // Suppliers rarely change - could be 30-60 seconds
   setCacheHeaders(event, { maxAge: 30, staleWhileRevalidate: 15 });

   // Reports are point-in-time snapshots - could be 30-60 seconds
   setCacheHeaders(event, { maxAge: 30, staleWhileRevalidate: 15 });
   ```

2. **Improve Cache Invalidation Instead of Reducing TTL**

   If stale data is the concern, focus on calling the smart cache invalidation functions after mutations:

   ```typescript
   // After posting a delivery
   const { afterDelivery } = useSmartCacheInvalidation();
   await postDelivery(data);
   afterDelivery(locationId); // Invalidates relevant caches immediately
   ```

3. **Monitor Server Performance**

   After deployment, monitor:
   - API response times
   - Database query counts
   - Server CPU/memory usage
   - Vercel function invocation counts

4. **Consider Tiered Caching Strategy**

   | Data Type | Suggested HTTP Cache | Rationale |
   |-----------|---------------------|-----------|
   | Current Period | 2-5 sec | Critical, changes rarely |
   | Stock Levels | 2-5 sec | Frequently updated |
   | Items/Suppliers | 30 sec | Master data, rarely changes |
   | Reports | 30-60 sec | Point-in-time, expensive to compute |
   | Locations | 60 sec | Very static data |

5. **Use ETags for Conditional Requests**

   For large responses, consider implementing ETag headers to allow conditional GET requests that return 304 Not Modified when data hasn't changed.

---

## Files Reference

| Purpose | Location |
|---------|----------|
| Cache Composables | `/app/composables/useCache.ts` |
| Item Caching | `/app/composables/useItems.ts` |
| Location Caching | `/app/composables/useLocations.ts` |
| Supplier Caching | `/app/composables/useSuppliers.ts` |
| Period Caching | `/app/composables/useCurrentPeriod.ts` |
| Location Store | `/app/stores/location.ts` |
| Period Store | `/app/stores/period.ts` |
| HTTP Cache Utility | `/server/utils/performance.ts` |
| PWA Config | `/nuxt.config.ts` (pwa section) |
| SW Cleanup Plugin | `/app/plugins/sw-cleanup.client.ts` |
| App Initialization | `/app/composables/useAppInit.ts` |

---

*Last updated: December 2024*
