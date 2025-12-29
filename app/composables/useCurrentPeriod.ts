/**
 * useCurrentPeriod Composable
 *
 * Provides cached access to the current accounting period with automatic refresh.
 * Uses Nuxt's useAsyncData for built-in caching and SSR support.
 *
 * The current period is critical for:
 * - Validating transactions (must be in OPEN period)
 * - Period close workflow
 * - Locking prices at period start
 */

import type { PeriodStatus, PeriodLocationStatus, LocationType } from "~~/shared/types/database";

// Extended PeriodLocation type with joined location data (API response type)
interface PeriodLocationWithDetails {
  location_id: string;
  status: PeriodLocationStatus;
  opening_value: number | null;
  closing_value: number | null;
  ready_at: Date | null;
  closed_at: Date | null;
  location: {
    id: string;
    code: string;
    name: string;
    type: LocationType;
  };
}

export interface PeriodData {
  id: string;
  name: string;
  year: number;
  month: number;
  start_date: Date;
  end_date: Date;
  status: PeriodStatus;
  prices_locked: boolean;
  closed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  period_locations: PeriodLocationWithDetails[];
  _count?: {
    deliveries: number;
    issues: number;
    reconciliations: number;
  };
}

export interface CurrentPeriodResponse {
  period: PeriodData | null;
}

/**
 * Fetch the current period with caching
 * @param options Async data options
 */
export function useCurrentPeriod(
  options: {
    immediate?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number;
  } = {}
) {
  const { immediate = true, autoRefresh = false, refreshInterval = 60000 } = options;

  // Use useAsyncData for automatic caching
  const { data, error, status, refresh } = useAsyncData<CurrentPeriodResponse>(
    "currentPeriod",
    () => $fetch<CurrentPeriodResponse>("/api/periods/current"),
    {
      // Cache for 10 seconds (matches server cache - critical data)
      getCachedData: (key) => {
        const cached = useNuxtApp().payload.data[key];
        if (!cached) return;

        // Check if cache is still valid (10 seconds)
        const now = Date.now();
        const cacheTime = useNuxtApp().payload.data[`${key}:time`] as number | undefined;
        if (cacheTime && now - cacheTime < 10 * 1000) {
          return cached;
        }

        return;
      },
      immediate,
    }
  );

  // Store cache time
  watch(
    data,
    (newData) => {
      if (newData) {
        useNuxtApp().payload.data["currentPeriod:time"] = Date.now();
      }
    },
    { immediate: true }
  );

  // Auto-refresh if enabled
  let intervalId: NodeJS.Timeout | null = null;

  if (autoRefresh && process.client) {
    onMounted(() => {
      intervalId = setInterval(() => {
        refresh();
      }, refreshInterval);
    });

    onUnmounted(() => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    });
  }

  // Computed values
  const period = computed(() => data.value?.period);
  const loading = computed(() => status.value === "pending");
  const isPeriodOpen = computed(() => period.value?.status === "OPEN");
  const isPeriodClosed = computed(() => period.value?.status === "CLOSED");
  const arePricesLocked = computed(() => period.value?.prices_locked || false);

  // Helper to check if a location is ready for period close
  const isLocationReady = (locationId: string) => {
    if (!period.value) return false;

    const periodLocation = period.value.period_locations.find(
      (pl) => pl.location_id === locationId
    );

    return periodLocation?.status === "READY";
  };

  // Helper to check if all locations are ready for period close
  const areAllLocationsReady = computed(() => {
    if (!period.value) return false;

    return period.value.period_locations.every((pl) => pl.status === "READY");
  });

  // Helper to get location status in current period
  const getLocationStatus = (locationId: string) => {
    if (!period.value) return null;

    const periodLocation = period.value.period_locations.find(
      (pl) => pl.location_id === locationId
    );

    return periodLocation?.status || null;
  };

  return {
    // Data
    period,
    data,

    // State
    loading,
    error,
    status,

    // Computed helpers
    isPeriodOpen,
    isPeriodClosed,
    arePricesLocked,
    areAllLocationsReady,

    // Actions
    refresh,
    isLocationReady,
    getLocationStatus,
  };
}

/**
 * Invalidate current period cache
 * Call this after:
 * - Creating a new period
 * - Closing a period
 * - Marking locations as ready
 * - Rolling forward a period
 */
export function invalidateCurrentPeriodCache() {
  const nuxtApp = useNuxtApp();

  // Remove current period cache
  delete nuxtApp.payload.data["currentPeriod"];
  delete nuxtApp.payload.data["currentPeriod:time"];

  // Also invalidate all periods caches
  Object.keys(nuxtApp.payload.data).forEach((key) => {
    if (key.startsWith("periods:") || key.startsWith("period:")) {
      delete nuxtApp.payload.data[key];
    }
  });
}

/**
 * Fetch all periods with caching
 * @param options Async data options
 */
export function usePeriods(
  options: {
    immediate?: boolean;
  } = {}
) {
  const { immediate = true } = options;

  interface PeriodsResponse {
    periods: PeriodData[];
  }

  const { data, error, status, refresh } = useAsyncData<PeriodsResponse>(
    "periods",
    () => $fetch<PeriodsResponse>("/api/periods"),
    {
      // Cache for 20 seconds (matches server cache)
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
      immediate,
    }
  );

  // Store cache time
  watch(
    data,
    (newData) => {
      if (newData) {
        useNuxtApp().payload.data["periods:time"] = Date.now();
      }
    },
    { immediate: true }
  );

  const periods = computed(() => data.value?.periods || []);
  const loading = computed(() => status.value === "pending");

  return {
    periods,
    data,
    loading,
    error,
    status,
    refresh,
  };
}

/**
 * Fetch a single period by ID with caching
 * @param periodId Period ID
 */
export function usePeriod(periodId: Ref<string> | string) {
  const id = isRef(periodId) ? periodId : ref(periodId);

  const { data, error, status, refresh } = useAsyncData<{ period: PeriodData }>(
    `period:${id.value}`,
    () => $fetch<{ period: PeriodData }>(`/api/periods/${id.value}`),
    {
      // Cache for 20 seconds (matches server cache)
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
        useNuxtApp().payload.data[`period:${id.value}:time`] = Date.now();
      }
    },
    { immediate: true }
  );

  const period = computed(() => data.value?.period);
  const loading = computed(() => status.value === "pending");

  return {
    period,
    data,
    loading,
    error,
    status,
    refresh,
  };
}
