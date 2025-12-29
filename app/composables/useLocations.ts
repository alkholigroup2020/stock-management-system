/**
 * useLocations Composable
 *
 * Provides cached access to locations with automatic refresh and invalidation.
 * Uses Nuxt's useAsyncData for built-in caching and SSR support.
 */

import type { LocationType } from "~~/shared/types/database";

// Types
export interface LocationItem {
  id: string;
  code: string;
  name: string;
  type: LocationType;
  address?: string | null;
  manager?: {
    id: string;
    username: string;
    full_name?: string | null;
  } | null;
  is_active: boolean;
  _count?: {
    user_locations?: number;
    location_stock?: number;
  };
}

export interface LocationsResponse {
  locations: LocationItem[];
  count: number;
}

export interface LocationFilters {
  type?: LocationType;
  is_active?: boolean;
  search?: string;
}

/**
 * Fetch locations with caching
 * @param filters Optional filters for locations
 * @param options Async data options
 */
export function useLocations(
  filters?: Ref<LocationFilters> | LocationFilters,
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

    if (filterRef.value.type) {
      params.type = filterRef.value.type;
    }
    if (filterRef.value.is_active !== undefined) {
      params.is_active = filterRef.value.is_active;
    }
    if (filterRef.value.search) {
      params.search = filterRef.value.search;
    }

    return params;
  });

  // Use useAsyncData for automatic caching
  const { data, error, status, refresh, execute } = useAsyncData<LocationsResponse>(
    // Unique key for caching - includes filter values to cache separately
    `locations:${JSON.stringify(query.value)}`,
    () =>
      $fetch<LocationsResponse>("/api/locations", {
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
        useNuxtApp().payload.data[`locations:${JSON.stringify(query.value)}:time`] = Date.now();
      }
    },
    { immediate: true }
  );

  // Computed values
  const locations = computed(() => (data.value as LocationsResponse | null)?.locations || []);
  const count = computed(() => (data.value as LocationsResponse | null)?.count || 0);
  const loading = computed(() => status.value === "pending");

  return {
    // Data
    locations,
    count,
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
 * Invalidate all location caches
 * Call this after creating, updating, or deleting locations
 */
export function invalidateLocationsCache() {
  const nuxtApp = useNuxtApp();

  // Find all location cache keys and remove them
  Object.keys(nuxtApp.payload.data).forEach((key) => {
    if (key.startsWith("locations:")) {
      delete nuxtApp.payload.data[key];
    }
  });
}

/**
 * Fetch a single location by ID with caching
 * @param locationId Location ID
 */
export function useLocation(locationId: Ref<string> | string) {
  const id = isRef(locationId) ? locationId : ref(locationId);

  const { data, error, status, refresh } = useAsyncData<{ location: LocationItem }>(
    `location:${id.value}`,
    () => $fetch<{ location: LocationItem }>(`/api/locations/${id.value}`),
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
        useNuxtApp().payload.data[`location:${id.value}:time`] = Date.now();
      }
    },
    { immediate: true }
  );

  const location = computed(() => data.value?.location);
  const loading = computed(() => status.value === "pending");

  return {
    location,
    data,
    loading,
    error,
    status,
    refresh,
  };
}

/**
 * Invalidate a specific location cache
 * @param locationId Location ID
 */
export function invalidateLocationCache(locationId: string) {
  const nuxtApp = useNuxtApp();

  // Remove specific location cache
  delete nuxtApp.payload.data[`location:${locationId}`];
  delete nuxtApp.payload.data[`location:${locationId}:time`];

  // Also invalidate the locations list cache as it may contain this location
  invalidateLocationsCache();
}
