/**
 * useCache Composable
 *
 * Centralized cache management and invalidation utilities.
 * Provides easy access to invalidate specific caches after mutations.
 *
 * Usage:
 * - After creating/updating/deleting a location: invalidateLocations()
 * - After creating/updating/deleting an item: invalidateItems()
 * - After period operations: invalidatePeriods()
 * - After any transaction: invalidateAll() (nuclear option)
 */

import { invalidateLocationsCache, invalidateLocationCache } from "./useLocations";
import { invalidateItemsCache, invalidateItemCache } from "./useItems";
import { invalidateCurrentPeriodCache } from "./useCurrentPeriod";
import { invalidateSuppliersCache, invalidateSupplierCache } from "./useSuppliers";

/**
 * Cache invalidation utilities
 */
export function useCache() {
  /**
   * Invalidate all location caches
   * Use after: Create, update, or delete location
   */
  const invalidateLocations = () => {
    invalidateLocationsCache();
  };

  /**
   * Invalidate a specific location cache
   * Use after: Update or delete a specific location
   */
  const invalidateLocation = (locationId: string) => {
    invalidateLocationCache(locationId);
  };

  /**
   * Invalidate all item caches
   * Use after: Create, update, or delete item, or price changes
   */
  const invalidateItems = () => {
    invalidateItemsCache();
  };

  /**
   * Invalidate a specific item cache
   * Use after: Update or delete a specific item
   */
  const invalidateItem = (itemId: string) => {
    invalidateItemCache(itemId);
  };

  /**
   * Invalidate current period and all period caches
   * Use after: Period close, roll forward, or mark location ready
   */
  const invalidatePeriods = () => {
    invalidateCurrentPeriodCache();
  };

  /**
   * Invalidate all supplier caches
   * Use after: Create, update, or delete supplier
   */
  const invalidateSuppliers = () => {
    invalidateSuppliersCache();
  };

  /**
   * Invalidate a specific supplier cache
   * Use after: Update or delete a specific supplier
   */
  const invalidateSupplier = (supplierId: string) => {
    invalidateSupplierCache(supplierId);
  };

  /**
   * Invalidate stock-related caches
   * Use after: Deliveries, issues, transfers, reconciliations
   */
  const invalidateStock = (locationId?: string) => {
    const nuxtApp = useNuxtApp();

    // Invalidate stock cache keys
    Object.keys(nuxtApp.payload.data).forEach((key) => {
      if (key.startsWith("stock:")) {
        // If locationId provided, only invalidate that location's stock
        if (locationId && !key.includes(locationId)) {
          return;
        }
        delete nuxtApp.payload.data[key];
      }
    });

    // Also invalidate items cache if location-specific stock was updated
    if (locationId) {
      invalidateItemsCache();
    }
  };

  /**
   * Invalidate transaction-related caches
   * Use after: Creating, updating, or deleting deliveries, issues, transfers
   */
  const invalidateTransactions = (type?: "deliveries" | "issues" | "transfers") => {
    const nuxtApp = useNuxtApp();

    Object.keys(nuxtApp.payload.data).forEach((key) => {
      if (type) {
        // Invalidate specific transaction type
        if (key.startsWith(`${type}:`)) {
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

    // Also invalidate stock since transactions affect stock
    invalidateStock();
  };

  /**
   * Invalidate dashboard caches
   * Use after: Any transaction or stock change
   */
  const invalidateDashboard = (locationId?: string) => {
    const nuxtApp = useNuxtApp();

    Object.keys(nuxtApp.payload.data).forEach((key) => {
      if (key.startsWith("dashboard:")) {
        // If locationId provided, only invalidate that location's dashboard
        if (locationId && !key.includes(locationId)) {
          return;
        }
        delete nuxtApp.payload.data[key];
      }
    });
  };

  /**
   * Clear ALL caches (nuclear option)
   * Use sparingly - only when necessary (e.g., logout, period close)
   */
  const invalidateAll = () => {
    const nuxtApp = useNuxtApp();

    // Clear all cache data except auth
    Object.keys(nuxtApp.payload.data).forEach((key) => {
      // Keep auth data
      if (key.startsWith("auth:")) {
        return;
      }
      delete nuxtApp.payload.data[key];
    });
  };

  /**
   * Get cache statistics (for debugging)
   */
  const getCacheStats = () => {
    const nuxtApp = useNuxtApp();
    const keys = Object.keys(nuxtApp.payload.data);

    const stats = {
      total: keys.length,
      locations: keys.filter((k) => k.startsWith("locations:") || k.startsWith("location:")).length,
      items: keys.filter((k) => k.startsWith("items:") || k.startsWith("item:")).length,
      periods: keys.filter(
        (k) => k.startsWith("periods:") || k.startsWith("period:") || k === "currentPeriod"
      ).length,
      suppliers: keys.filter((k) => k.startsWith("suppliers:") || k.startsWith("supplier:")).length,
      stock: keys.filter((k) => k.startsWith("stock:")).length,
      transactions: keys.filter(
        (k) => k.startsWith("deliveries:") || k.startsWith("issues:") || k.startsWith("transfers:")
      ).length,
      dashboard: keys.filter((k) => k.startsWith("dashboard:")).length,
      other: keys.filter(
        (k) =>
          !k.startsWith("locations:") &&
          !k.startsWith("location:") &&
          !k.startsWith("items:") &&
          !k.startsWith("item:") &&
          !k.startsWith("periods:") &&
          !k.startsWith("period:") &&
          k !== "currentPeriod" &&
          !k.startsWith("suppliers:") &&
          !k.startsWith("supplier:") &&
          !k.startsWith("stock:") &&
          !k.startsWith("deliveries:") &&
          !k.startsWith("issues:") &&
          !k.startsWith("transfers:") &&
          !k.startsWith("dashboard:")
      ).length,
    };

    return stats;
  };

  return {
    // Location caches
    invalidateLocations,
    invalidateLocation,

    // Item caches
    invalidateItems,
    invalidateItem,

    // Period caches
    invalidatePeriods,

    // Supplier caches
    invalidateSuppliers,
    invalidateSupplier,

    // Stock caches
    invalidateStock,

    // Transaction caches
    invalidateTransactions,

    // Dashboard caches
    invalidateDashboard,

    // Nuclear option
    invalidateAll,

    // Debug utilities
    getCacheStats,
  };
}

/**
 * Smart cache invalidation based on operation type
 * Automatically determines which caches to invalidate
 */
export function useSmartCacheInvalidation() {
  const cache = useCache();

  /**
   * Invalidate caches after a delivery is posted
   */
  const afterDelivery = (locationId: string) => {
    cache.invalidateStock(locationId);
    cache.invalidateTransactions("deliveries");
    cache.invalidateDashboard(locationId);
    cache.invalidatePeriods(); // For transaction counts
  };

  /**
   * Invalidate caches after an issue is posted
   */
  const afterIssue = (locationId: string) => {
    cache.invalidateStock(locationId);
    cache.invalidateTransactions("issues");
    cache.invalidateDashboard(locationId);
    cache.invalidatePeriods(); // For transaction counts
  };

  /**
   * Invalidate caches after a transfer is created/approved/completed
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
   */
  const afterPeriodClose = () => {
    cache.invalidatePeriods();
    cache.invalidateStock();
    cache.invalidateDashboard();
  };

  /**
   * Invalidate caches after location is marked ready
   */
  const afterLocationReady = () => {
    cache.invalidatePeriods();
  };

  /**
   * Invalidate caches after item price change
   */
  const afterPriceChange = () => {
    cache.invalidateItems();
    cache.invalidatePeriods(); // For period prices
  };

  /**
   * Invalidate caches after reconciliation
   */
  const afterReconciliation = (locationId: string) => {
    cache.invalidateStock(locationId);
    cache.invalidateDashboard(locationId);
    cache.invalidatePeriods();
  };

  return {
    afterDelivery,
    afterIssue,
    afterTransfer,
    afterPeriodClose,
    afterLocationReady,
    afterPriceChange,
    afterReconciliation,
  };
}
