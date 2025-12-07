/**
 * useSuppliers Composable
 *
 * Provides cached access to suppliers with automatic refresh and invalidation.
 * Uses Nuxt's useAsyncData for built-in caching and SSR support.
 */

// Types
export interface SupplierItem {
  id: string;
  code: string;
  name: string;
  contact: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface SuppliersResponse {
  suppliers: SupplierItem[];
  total: number;
}

export interface SupplierFilters {
  search?: string;
  is_active?: boolean;
}

/**
 * Fetch suppliers with caching
 * @param filters Optional filters for suppliers
 * @param options Async data options
 */
export function useSuppliers(
  filters?: Ref<SupplierFilters> | SupplierFilters,
  options: {
    immediate?: boolean;
    watch?: boolean;
  } = {}
) {
  const { immediate = true, watch: watchFilters = true } = options;

  // Convert filters to ref if needed
  const filterRef = isRef(filters) ? filters : ref(filters || {});

  // Build query params from filters
  const query = computed(() => {
    const params: Record<string, string | boolean> = {};

    if (filterRef.value.search) {
      params.search = filterRef.value.search;
    }
    if (filterRef.value.is_active !== undefined) {
      params.is_active = filterRef.value.is_active;
    }

    return params;
  });

  // Use useAsyncData for automatic caching
  const { data, error, status, refresh, execute } = useAsyncData<SuppliersResponse>(
    // Unique key for caching - includes filter values to cache separately
    `suppliers:${JSON.stringify(query.value)}`,
    () =>
      $fetch<SuppliersResponse>("/api/suppliers", {
        query: query.value,
      }),
    {
      // Cache for 20 seconds (matches server cache)
      getCachedData: (key) => {
        const cached = useNuxtApp().payload.data[key];
        if (!cached) return;

        // Check if cache is still valid (20 seconds)
        const now = Date.now();
        const cacheTime = useNuxtApp().payload.data[`${key}:time`] as number | undefined;
        if (cacheTime && now - cacheTime < 20 * 1000) {
          return cached;
        }

        return;
      },
      immediate,
      watch: watchFilters ? [query] : [],
    }
  );

  // Store cache time
  watch(
    data,
    (newData) => {
      if (newData) {
        useNuxtApp().payload.data[`suppliers:${JSON.stringify(query.value)}:time`] = Date.now();
      }
    },
    { immediate: true }
  );

  // Computed values
  const suppliers = computed(() => (data.value as SuppliersResponse | null)?.suppliers || []);
  const total = computed(() => (data.value as SuppliersResponse | null)?.total || 0);
  const loading = computed(() => status.value === "pending");

  return {
    // Data
    suppliers,
    total,
    data,

    // State
    loading,
    error,
    status,

    // Actions
    refresh,
    execute,
  };
}

/**
 * Invalidate all suppliers caches
 * Call this after creating, updating, or deleting suppliers
 */
export function invalidateSuppliersCache() {
  const nuxtApp = useNuxtApp();

  // Find all suppliers cache keys and remove them
  Object.keys(nuxtApp.payload.data).forEach((key) => {
    if (key.startsWith("suppliers:") || key.startsWith("supplier:")) {
      delete nuxtApp.payload.data[key];
    }
  });
}

/**
 * Fetch a single supplier by ID with caching
 * @param supplierId Supplier ID
 */
export function useSupplier(supplierId: Ref<string> | string) {
  const id = isRef(supplierId) ? supplierId : ref(supplierId);

  const { data, error, status, refresh } = useAsyncData<{ supplier: SupplierItem }>(
    `supplier:${id.value}`,
    () => $fetch<{ supplier: SupplierItem }>(`/api/suppliers/${id.value}`),
    {
      // Cache for 20 seconds
      getCachedData: (key) => {
        const cached = useNuxtApp().payload.data[key];
        if (!cached) return;

        const now = Date.now();
        const cacheTime = useNuxtApp().payload.data[`${key}:time`] as number | undefined;
        if (cacheTime && now - cacheTime < 20 * 1000) {
          return cached;
        }

        return;
      },
      watch: [id],
    }
  );

  // Store cache time
  watch(
    data,
    (newData) => {
      if (newData) {
        useNuxtApp().payload.data[`supplier:${id.value}:time`] = Date.now();
      }
    },
    { immediate: true }
  );

  const supplier = computed(() => data.value?.supplier);
  const loading = computed(() => status.value === "pending");

  return {
    supplier,
    data,
    loading,
    error,
    status,
    refresh,
  };
}

/**
 * Invalidate a specific supplier cache
 * @param supplierId Supplier ID
 */
export function invalidateSupplierCache(supplierId: string) {
  const nuxtApp = useNuxtApp();

  // Remove specific supplier cache
  delete nuxtApp.payload.data[`supplier:${supplierId}`];
  delete nuxtApp.payload.data[`supplier:${supplierId}:time`];

  // Also invalidate the suppliers list cache as it may contain this supplier
  invalidateSuppliersCache();
}
