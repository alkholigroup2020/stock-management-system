/**
 * usePOs Composable
 *
 * Provides CRUD operations for POs (Purchase Orders).
 * Uses Nuxt's useAsyncData for built-in caching and SSR support.
 */

import type { POStatus, Unit } from "~~/shared/types/database";

// Types
export interface POListItem {
  id: string;
  po_no: string;
  status: POStatus;
  total_amount: string;
  supplier: {
    id: string;
    code: string;
    name: string;
  };
  prf?: {
    id: string;
    prf_no: string;
  };
  creator: {
    id: string;
    full_name: string | null;
  };
  deliveries_count: number;
  created_at: string;
}

export interface POLineItem {
  id: string;
  po_id: string;
  item_id: string | null;
  item_code: string | null;
  item_description: string;
  quantity: string;
  delivered_qty: string; // Cumulative delivered quantity
  remaining_qty: string; // quantity - delivered_qty (computed by API)
  unit: Unit;
  unit_price: string;
  discount_percent: string;
  total_before_vat: string;
  vat_percent: string;
  vat_amount: string;
  total_after_vat: string;
  notes: string | null;
  item?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface PODetail {
  id: string;
  po_no: string;
  prf_id: string | null;
  supplier_id: string;
  quotation_ref: string | null;
  ship_to_location_id: string | null;
  ship_to_contact: string | null;
  ship_to_phone: string | null;
  status: POStatus;
  total_before_discount: string;
  total_discount: string;
  total_after_discount: string;
  total_vat: string;
  total_amount: string;
  payment_terms: string | null;
  delivery_terms: string | null;
  duration_days: number | null;
  terms_conditions: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  lines: POLineItem[];
  supplier: {
    id: string;
    code: string;
    name: string;
    emails: string[];
    phone: string | null;
    vat_reg_no: string | null;
    address: string | null;
  };
  prf?: {
    id: string;
    prf_no: string;
    status: string;
    location?: {
      id: string;
      code: string;
      name: string;
    };
  } | null;
  ship_to_location?: {
    id: string;
    code: string;
    name: string;
  } | null;
  creator: {
    id: string;
    username: string;
    full_name: string | null;
  };
  deliveries?: Array<{
    id: string;
    delivery_no: string;
    status: string;
    delivery_date: string;
    total_amount: string;
  }>;
}

export interface POsResponse {
  data: POListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface POResponse {
  data: PODetail;
  message?: string;
  email_sent?: boolean;
  email_recipients?: number;
  email_error?: string;
}

export interface POFilters {
  page?: number;
  limit?: number;
  status?: POStatus;
  supplier_id?: string;
  prf_id?: string;
  created_by?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
}

export interface POLineInput {
  id?: string;
  item_id?: string | null;
  item_code?: string | null;
  item_description: string;
  quantity: number;
  unit: Unit;
  unit_price: number;
  discount_percent?: number;
  vat_percent?: number;
  notes?: string | null;
}

export interface POCreateInput {
  prf_id?: string | null;
  supplier_id: string;
  quotation_ref?: string | null;
  ship_to_location_id?: string | null;
  ship_to_contact?: string | null;
  ship_to_phone?: string | null;
  payment_terms?: string | null;
  delivery_terms?: string | null;
  duration_days?: number | null;
  terms_conditions?: string | null;
  notes?: string | null;
  lines: POLineInput[];
}

export interface POUpdateInput {
  quotation_ref?: string | null;
  ship_to_location_id?: string | null;
  ship_to_contact?: string | null;
  ship_to_phone?: string | null;
  payment_terms?: string | null;
  delivery_terms?: string | null;
  duration_days?: number | null;
  terms_conditions?: string | null;
  notes?: string | null;
  lines?: POLineInput[];
}

// Open PO for dropdown - includes delivery tracking info
export interface OpenPO {
  id: string;
  po_no: string;
  supplier: {
    id: string;
    code: string;
    name: string;
  };
  total_amount: string;
  lines: Array<{
    id: string;
    item_id: string | null;
    item_description: string;
    quantity: string;
    delivered_qty: string; // Cumulative delivered quantity
    remaining_qty: string; // quantity - delivered_qty
    unit: Unit;
    unit_price: string;
    item?: {
      id: string;
      code: string;
      name: string;
    } | null;
  }>;
}

/**
 * Fetch POs list with filters and pagination
 */
export function usePOs(
  filters?: Ref<POFilters> | POFilters,
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
    if (filterRef.value.supplier_id) params.supplier_id = filterRef.value.supplier_id;
    if (filterRef.value.prf_id) params.prf_id = filterRef.value.prf_id;
    if (filterRef.value.created_by) params.created_by = filterRef.value.created_by;
    if (filterRef.value.search) params.search = filterRef.value.search;
    if (filterRef.value.from_date) params.from_date = filterRef.value.from_date;
    if (filterRef.value.to_date) params.to_date = filterRef.value.to_date;

    return params;
  });

  // Use useAsyncData for automatic caching
  const { data, error, status, refresh, execute } = useAsyncData<POsResponse>(
    // Unique key for caching
    `pos:${JSON.stringify(query.value)}`,
    () =>
      $fetch<POsResponse>("/api/pos", {
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
        useNuxtApp().payload.data[`pos:${JSON.stringify(query.value)}:time`] = Date.now();
      }
    },
    { immediate: true }
  );

  // Computed values
  const pos = computed(() => data.value?.data || []);
  const pagination = computed(() => data.value?.pagination);
  const total = computed(() => data.value?.pagination.total || 0);
  const loading = computed(() => status.value === "pending");

  return {
    // Data
    pos,
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
 * Fetch a single PO by ID with caching
 */
export function usePO(poId: Ref<string> | string) {
  const id = isRef(poId) ? poId : ref(poId);

  const { data, error, status, refresh } = useAsyncData<POResponse>(
    `po:${id.value}`,
    () => $fetch<POResponse>(`/api/pos/${id.value}`),
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
        useNuxtApp().payload.data[`po:${id.value}:time`] = Date.now();
      }
    },
    { immediate: true }
  );

  const po = computed(() => data.value?.data);
  const loading = computed(() => status.value === "pending");

  return {
    po,
    data,
    loading,
    error,
    status,
    refresh,
  };
}

/**
 * Fetch open POs for dropdown
 */
interface OpenPOFilters {
  supplier_id?: string;
  search?: string;
  limit?: number;
}

export function useOpenPOs(
  filters?: Ref<OpenPOFilters> | OpenPOFilters,
  options: { immediate?: boolean } = {}
) {
  const { immediate = true } = options;
  const filterRef = isRef(filters) ? filters : ref(filters || {});

  const query = computed(() => {
    const params: Record<string, string | number> = {};
    const f = filterRef.value as OpenPOFilters;

    if (f?.supplier_id) params.supplier_id = f.supplier_id;
    if (f?.search) params.search = f.search;
    if (f?.limit) params.limit = f.limit;

    return params;
  });

  const { data, error, status, refresh } = useAsyncData<{ data: OpenPO[] }>(
    `pos:open:${JSON.stringify(query.value)}`,
    () =>
      $fetch<{ data: OpenPO[] }>("/api/pos/open", {
        query: query.value,
      }),
    {
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
      watch: [query],
    }
  );

  watch(
    data,
    (newData) => {
      if (newData) {
        useNuxtApp().payload.data[`pos:open:${JSON.stringify(query.value)}:time`] = Date.now();
      }
    },
    { immediate: true }
  );

  const openPOs = computed(() => data.value?.data || []);
  const loading = computed(() => status.value === "pending");

  return {
    openPOs,
    data,
    loading,
    error,
    status,
    refresh,
  };
}

/**
 * PO CRUD operations
 */
export function usePOActions() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Create a new PO
   */
  async function create(
    input: POCreateInput
  ): Promise<{ data: PODetail; email_sent: boolean; email_recipients?: number } | null> {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<POResponse>("/api/pos", {
        method: "POST",
        body: input,
      });

      invalidatePOsCache();
      return {
        data: response.data,
        email_sent: response.email_sent || false,
        email_recipients: response.email_recipients,
      };
    } catch (err) {
      const errorData = err as { data?: { message?: string } };
      error.value = errorData.data?.message || "Failed to create PO";
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update an existing PO
   */
  async function update(id: string, input: POUpdateInput): Promise<PODetail | null> {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<POResponse>(`/api/pos/${id}`, {
        method: "PATCH",
        body: input,
      });

      invalidatePOCache(id);
      return response.data;
    } catch (err) {
      const errorData = err as { data?: { message?: string } };
      error.value = errorData.data?.message || "Failed to update PO";
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Close a PO
   * @param id - PO ID
   * @param options - Optional closure options
   * @param options.closure_reason - Required if PO has unfulfilled quantities
   * @param options.notes - Additional notes
   */
  async function close(
    id: string,
    options?: { closure_reason?: string; notes?: string }
  ): Promise<{
    data: PODetail;
    prf_closed: boolean;
    message: string;
    fulfillment_summary?: {
      total_ordered: number;
      total_delivered: number;
      fulfillment_percent: number;
      has_unfulfilled_items: boolean;
    };
  } | null> {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<{
        data: PODetail;
        message: string;
        prf_closed: boolean;
        fulfillment_summary?: {
          total_ordered: number;
          total_delivered: number;
          fulfillment_percent: number;
          has_unfulfilled_items: boolean;
        };
      }>(`/api/pos/${id}/close`, {
        method: "PATCH",
        body: options || {},
      });

      invalidatePOCache(id);
      return {
        data: response.data,
        prf_closed: response.prf_closed,
        message: response.message,
        fulfillment_summary: response.fulfillment_summary,
      };
    } catch (err) {
      const errorData = err as { data?: { message?: string } };
      error.value = errorData.data?.message || "Failed to close PO";
      throw err; // Re-throw to let the caller handle specific errors
    } finally {
      loading.value = false;
    }
  }

  /**
   * Resend PO email to supplier
   */
  async function resendEmail(
    id: string,
    additionalEmails?: string[]
  ): Promise<{ message: string; recipients: string[] } | null> {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<{ message: string; recipients: string[] }>(
        `/api/pos/${id}/resend-email`,
        {
          method: "POST",
          body: additionalEmails ? { additional_emails: additionalEmails } : {},
        }
      );

      return response;
    } catch (err) {
      const errorData = err as { data?: { message?: string } };
      error.value = errorData.data?.message || "Failed to resend email";
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
    close,
    resendEmail,
  };
}

/**
 * Invalidate all POs caches
 */
export function invalidatePOsCache() {
  const nuxtApp = useNuxtApp();

  // Find all PO cache keys and remove them
  Object.keys(nuxtApp.payload.data).forEach((key) => {
    if (key.startsWith("pos:") || key.startsWith("po:")) {
      delete nuxtApp.payload.data[key];
    }
  });
}

/**
 * Invalidate a specific PO cache
 */
export function invalidatePOCache(poId: string) {
  const nuxtApp = useNuxtApp();

  // Remove specific PO cache
  delete nuxtApp.payload.data[`po:${poId}`];
  delete nuxtApp.payload.data[`po:${poId}:time`];

  // Also invalidate the POs list cache
  invalidatePOsCache();
}
