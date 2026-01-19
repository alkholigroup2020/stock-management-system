/**
 * usePRFs Composable
 *
 * Provides CRUD operations for PRFs (Purchase Requisition Forms).
 * Uses Nuxt's useAsyncData for built-in caching and SSR support.
 */

import type {
  PRFType,
  PRFCategory,
  PRFStatus,
  Unit,
} from "~~/shared/types/database";

// Types
export interface PRFListItem {
  id: string;
  prf_no: string;
  status: PRFStatus;
  prf_type: PRFType;
  category: PRFCategory;
  total_value: string;
  request_date: string;
  expected_delivery_date: string | null;
  requester: {
    id: string;
    full_name: string | null;
  };
  location: {
    id: string;
    code: string;
    name: string;
  };
  created_at: string;
}

export interface PRFLineItem {
  id: string;
  prf_id: string;
  item_id: string | null;
  item_description: string;
  cost_code: string | null;
  stock_qty: string | null;
  unit: Unit;
  required_qty: string;
  estimated_price: string;
  line_value: string;
  notes: string | null;
  item?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface PRFDetail {
  id: string;
  prf_no: string;
  period_id: string;
  location_id: string;
  project_name: string | null;
  prf_type: PRFType;
  category: PRFCategory;
  expected_delivery_date: string | null;
  is_reimbursable: boolean;
  status: PRFStatus;
  requested_by: string;
  approved_by: string | null;
  request_date: string;
  approval_date: string | null;
  rejection_reason: string | null;
  total_value: string;
  contact_person_name: string | null;
  contact_person_phone: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lines: PRFLineItem[];
  requester: {
    id: string;
    username: string;
    full_name: string | null;
  };
  approver?: {
    id: string;
    username: string;
    full_name: string | null;
  } | null;
  location: {
    id: string;
    code: string;
    name: string;
  };
  period: {
    id: string;
    name: string;
  };
  purchase_orders?: Array<{
    id: string;
    po_no: string;
    status: string;
  }>;
}

export interface PRFsResponse {
  data: PRFListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PRFResponse {
  data: PRFDetail;
}

export interface PRFFilters {
  page?: number;
  limit?: number;
  status?: PRFStatus;
  location_id?: string;
  period_id?: string;
  prf_type?: PRFType;
  category?: PRFCategory;
  requested_by?: string;
  search?: string;
}

export interface PRFLineInput {
  id?: string;
  item_id?: string | null;
  item_description: string;
  cost_code?: string | null;
  unit: Unit;
  required_qty: number;
  estimated_price: number;
  notes?: string | null;
}

export interface PRFCreateInput {
  location_id: string;
  period_id: string;
  project_name?: string | null;
  prf_type?: PRFType;
  category?: PRFCategory;
  expected_delivery_date?: string | null;
  is_reimbursable?: boolean;
  contact_person_name?: string | null;
  contact_person_phone?: string | null;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  notes?: string | null;
  lines: PRFLineInput[];
}

export interface PRFUpdateInput {
  project_name?: string | null;
  prf_type?: PRFType;
  category?: PRFCategory;
  expected_delivery_date?: string | null;
  is_reimbursable?: boolean;
  contact_person_name?: string | null;
  contact_person_phone?: string | null;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  notes?: string | null;
  lines?: PRFLineInput[];
}

/**
 * Fetch PRFs list with filters and pagination
 */
export function usePRFs(
  filters?: Ref<PRFFilters> | PRFFilters,
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
    const params: Record<string, string | number> = {};

    if (filterRef.value.page) params.page = filterRef.value.page;
    if (filterRef.value.limit) params.limit = filterRef.value.limit;
    if (filterRef.value.status) params.status = filterRef.value.status;
    if (filterRef.value.location_id) params.location_id = filterRef.value.location_id;
    if (filterRef.value.period_id) params.period_id = filterRef.value.period_id;
    if (filterRef.value.prf_type) params.prf_type = filterRef.value.prf_type;
    if (filterRef.value.category) params.category = filterRef.value.category;
    if (filterRef.value.requested_by) params.requested_by = filterRef.value.requested_by;
    if (filterRef.value.search) params.search = filterRef.value.search;

    return params;
  });

  // Use useAsyncData for automatic caching
  const { data, error, status, refresh, execute } = useAsyncData<PRFsResponse>(
    // Unique key for caching
    `prfs:${JSON.stringify(query.value)}`,
    () =>
      $fetch<PRFsResponse>("/api/prfs", {
        query: query.value,
      }),
    {
      // Cache for 5 seconds
      getCachedData: (key) => {
        const cached = useNuxtApp().payload.data[key];
        if (!cached) return;

        const now = Date.now();
        const cacheTime = useNuxtApp().payload.data[`${key}:time`] as number | undefined;
        if (cacheTime && now - cacheTime < 5 * 1000) {
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
        useNuxtApp().payload.data[`prfs:${JSON.stringify(query.value)}:time`] = Date.now();
      }
    },
    { immediate: true }
  );

  // Computed values
  const prfs = computed(() => data.value?.data || []);
  const pagination = computed(() => data.value?.pagination);
  const total = computed(() => data.value?.pagination.total || 0);
  const loading = computed(() => status.value === "pending");

  return {
    // Data
    prfs,
    pagination,
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
 * Fetch a single PRF by ID with caching
 */
export function usePRF(prfId: Ref<string> | string) {
  const id = isRef(prfId) ? prfId : ref(prfId);

  const { data, error, status, refresh } = useAsyncData<PRFResponse>(
    `prf:${id.value}`,
    () => $fetch<PRFResponse>(`/api/prfs/${id.value}`),
    {
      // Cache for 5 seconds
      getCachedData: (key) => {
        const cached = useNuxtApp().payload.data[key];
        if (!cached) return;

        const now = Date.now();
        const cacheTime = useNuxtApp().payload.data[`${key}:time`] as number | undefined;
        if (cacheTime && now - cacheTime < 5 * 1000) {
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
        useNuxtApp().payload.data[`prf:${id.value}:time`] = Date.now();
      }
    },
    { immediate: true }
  );

  const prf = computed(() => data.value?.data);
  const loading = computed(() => status.value === "pending");

  return {
    prf,
    data,
    loading,
    error,
    status,
    refresh,
  };
}

/**
 * PRF CRUD operations
 */
export function usePRFActions() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Create a new PRF
   */
  async function create(input: PRFCreateInput): Promise<PRFDetail | null> {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<PRFResponse>("/api/prfs", {
        method: "POST",
        body: input,
      });

      invalidatePRFsCache();
      return response.data;
    } catch (err) {
      const errorData = err as { data?: { message?: string } };
      error.value = errorData.data?.message || "Failed to create PRF";
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update an existing PRF
   */
  async function update(id: string, input: PRFUpdateInput): Promise<PRFDetail | null> {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<PRFResponse>(`/api/prfs/${id}`, {
        method: "PATCH",
        body: input,
      });

      invalidatePRFCache(id);
      return response.data;
    } catch (err) {
      const errorData = err as { data?: { message?: string } };
      error.value = errorData.data?.message || "Failed to update PRF";
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete a PRF
   */
  async function remove(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      await $fetch(`/api/prfs/${id}`, {
        method: "DELETE",
      });

      invalidatePRFCache(id);
      return true;
    } catch (err) {
      const errorData = err as { data?: { message?: string } };
      error.value = errorData.data?.message || "Failed to delete PRF";
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Submit a PRF for approval
   */
  async function submit(id: string): Promise<PRFDetail | null> {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<{ data: PRFDetail }>(`/api/prfs/${id}/submit`, {
        method: "PATCH",
      });

      invalidatePRFCache(id);
      return response.data;
    } catch (err) {
      const errorData = err as { data?: { message?: string } };
      error.value = errorData.data?.message || "Failed to submit PRF";
      return null;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    create,
    update,
    remove,
    submit,
  };
}

/**
 * Invalidate all PRFs caches
 */
export function invalidatePRFsCache() {
  const nuxtApp = useNuxtApp();

  // Find all PRF cache keys and remove them
  Object.keys(nuxtApp.payload.data).forEach((key) => {
    if (key.startsWith("prfs:") || key.startsWith("prf:")) {
      delete nuxtApp.payload.data[key];
    }
  });
}

/**
 * Invalidate a specific PRF cache
 */
export function invalidatePRFCache(prfId: string) {
  const nuxtApp = useNuxtApp();

  // Remove specific PRF cache
  delete nuxtApp.payload.data[`prf:${prfId}`];
  delete nuxtApp.payload.data[`prf:${prfId}:time`];

  // Also invalidate the PRFs list cache
  invalidatePRFsCache();
}
