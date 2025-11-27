/**
 * useItems Composable
 *
 * Provides cached access to items with pagination, filtering, and automatic refresh.
 * Uses Nuxt's useAsyncData for built-in caching and SSR support.
 */

// Types
export interface ItemStock {
  location_id: string;
  item_id: string;
  on_hand: number;
  wac: number;
  location: {
    id: string;
    code: string;
    name: string;
  };
}

export interface ItemData {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  default_price: number;
  is_active: boolean;
  location_stock?: ItemStock[];
}

export interface ItemsResponse {
  items: ItemData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ItemFilters {
  category?: string;
  search?: string;
  locationId?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Fetch items with caching and pagination
 * @param filters Optional filters for items
 * @param options Async data options
 */
export function useItems(
  filters?: Ref<ItemFilters> | ItemFilters,
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
    const params: Record<string, string | number | boolean> = {};

    if (filterRef.value.category) {
      params.category = filterRef.value.category;
    }
    if (filterRef.value.search) {
      params.search = filterRef.value.search;
    }
    if (filterRef.value.locationId) {
      params.locationId = filterRef.value.locationId;
    }
    if (filterRef.value.is_active !== undefined) {
      params.is_active = filterRef.value.is_active;
    }
    if (filterRef.value.page) {
      params.page = filterRef.value.page;
    }
    if (filterRef.value.limit) {
      params.limit = filterRef.value.limit;
    }

    return params;
  });

  // Use useAsyncData for automatic caching
  const { data, error, status, refresh, execute } = useAsyncData<ItemsResponse>(
    // Unique key for caching - includes filter values to cache separately
    `items:${JSON.stringify(query.value)}`,
    () =>
      $fetch<ItemsResponse>("/api/items", {
        query: query.value,
      }),
    {
      // Cache for 5 minutes (matches server cache)
      getCachedData: (key) => {
        const cached = useNuxtApp().payload.data[key];
        if (!cached) return;

        // Check if cache is still valid (5 minutes)
        const now = Date.now();
        const cacheTime = useNuxtApp().payload.data[`${key}:time`] as number | undefined;
        if (cacheTime && now - cacheTime < 5 * 60 * 1000) {
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
        useNuxtApp().payload.data[`items:${JSON.stringify(query.value)}:time`] = Date.now();
      }
    },
    { immediate: true }
  );

  // Computed values
  const items = computed(() => (data.value as ItemsResponse | null)?.items || []);
  const pagination = computed(() => (data.value as ItemsResponse | null)?.pagination);
  const loading = computed(() => status.value === "pending");

  return {
    // Data
    items,
    pagination,
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
 * Invalidate all items caches
 * Call this after creating, updating, or deleting items
 */
export function invalidateItemsCache() {
  const nuxtApp = useNuxtApp();

  // Find all items cache keys and remove them
  Object.keys(nuxtApp.payload.data).forEach((key) => {
    if (key.startsWith("items:") || key.startsWith("item:")) {
      delete nuxtApp.payload.data[key];
    }
  });
}

/**
 * Fetch a single item by ID with caching
 * @param itemId Item ID
 */
export function useItem(itemId: Ref<string> | string) {
  const id = isRef(itemId) ? itemId : ref(itemId);

  const { data, error, status, refresh } = useAsyncData<{ item: ItemData }>(
    `item:${id.value}`,
    () => $fetch<{ item: ItemData }>(`/api/items/${id.value}`),
    {
      // Cache for 5 minutes
      getCachedData: (key) => {
        const cached = useNuxtApp().payload.data[key];
        if (!cached) return;

        const now = Date.now();
        const cacheTime = useNuxtApp().payload.data[`${key}:time`] as number | undefined;
        if (cacheTime && now - cacheTime < 5 * 60 * 1000) {
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
        useNuxtApp().payload.data[`item:${id.value}:time`] = Date.now();
      }
    },
    { immediate: true }
  );

  const item = computed(() => data.value?.item);
  const loading = computed(() => status.value === "pending");

  return {
    item,
    data,
    loading,
    error,
    status,
    refresh,
  };
}

/**
 * Invalidate a specific item cache
 * @param itemId Item ID
 */
export function invalidateItemCache(itemId: string) {
  const nuxtApp = useNuxtApp();

  // Remove specific item cache
  delete nuxtApp.payload.data[`item:${itemId}`];
  delete nuxtApp.payload.data[`item:${itemId}:time`];

  // Also invalidate the items list cache as it may contain this item
  invalidateItemsCache();
}
