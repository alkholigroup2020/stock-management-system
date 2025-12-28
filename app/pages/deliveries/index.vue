<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-truck" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl sm:text-3xl font-bold text-primary">Deliveries</h1>
            <UBadge
              v-if="activeLocation"
              color="primary"
              variant="soft"
              size="md"
              class="hidden sm:inline-flex items-center gap-1"
            >
              <UIcon name="i-lucide-map-pin" class="h-3 w-3" />
              {{ activeLocation.name }}
            </UBadge>
          </div>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            View and manage goods receipts and supplier deliveries
          </p>
          <!-- Mobile location badge (smaller, below title) -->
          <UBadge
            v-if="activeLocation"
            color="primary"
            variant="soft"
            size="sm"
            class="sm:hidden inline-flex items-center gap-1 mt-1"
          >
            <UIcon name="i-lucide-map-pin" class="h-3 w-3" />
            {{ activeLocation.name }}
          </UBadge>
        </div>
      </div>
      <UButton
        v-if="canPostDeliveries()"
        color="primary"
        icon="i-lucide-plus"
        size="lg"
        class="cursor-pointer rounded-full px-3 sm:px-6"
        @click="goToNewDelivery"
      >
        <span class="hidden sm:inline">New Delivery</span>
        <span class="sm:hidden">New</span>
      </UButton>
    </div>

    <!-- Filter Section -->
    <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
      <!-- Desktop: Full filter bar (lg and above) -->
      <div class="hidden lg:flex items-center gap-3">
        <!-- Date Range Start -->
        <div class="flex-1 min-w-0 max-w-xs">
          <label class="sr-only" for="filter-start-date">Start date</label>
          <UInput
            id="filter-start-date"
            v-model="filters.startDate"
            type="date"
            icon="i-lucide-calendar"
            size="lg"
            class="w-full"
            placeholder="Start date"
          />
        </div>

        <!-- Date Range End -->
        <div class="flex-1 min-w-0 max-w-xs">
          <label class="sr-only" for="filter-end-date">End date</label>
          <UInput
            id="filter-end-date"
            v-model="filters.endDate"
            type="date"
            icon="i-lucide-calendar"
            size="lg"
            class="w-full"
            placeholder="End date"
          />
        </div>

        <!-- Supplier Dropdown -->
        <USelectMenu
          v-model="filters.supplierId"
          :items="supplierOptions"
          value-key="value"
          placeholder="All Suppliers"
          size="lg"
          class="min-w-[200px]"
        >
          <template #leading>
            <UIcon name="i-lucide-building-2" class="w-5 h-5" />
          </template>
        </USelectMenu>

        <!-- Status Dropdown -->
        <UDropdownMenu :items="statusDropdownItems" class="ml-auto">
          <UButton
            color="neutral"
            variant="outline"
            size="lg"
            class="cursor-pointer rounded-full px-5"
            trailing-icon="i-lucide-chevron-down"
            aria-label="Filter by status"
          >
            <UIcon :name="currentStatusIcon" class="w-4 h-4 mr-2" />
            Status: {{ currentStatusLabel }}
          </UButton>
        </UDropdownMenu>

        <!-- Price Variance Dropdown -->
        <UDropdownMenu :items="varianceDropdownItems">
          <UButton
            color="neutral"
            variant="outline"
            size="lg"
            class="cursor-pointer rounded-full px-5"
            trailing-icon="i-lucide-chevron-down"
            aria-label="Filter by price variance"
          >
            <UIcon :name="currentVarianceIcon" class="w-4 h-4 mr-2" />
            Variance: {{ currentVarianceLabel }}
          </UButton>
        </UDropdownMenu>
      </div>

      <!-- Mobile: Stacked layout (below lg) -->
      <div class="flex flex-col gap-3 lg:hidden">
        <!-- Row 1: Date Range -->
        <div class="flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <label class="sr-only" for="filter-start-date-mobile">Start date</label>
            <UInput
              id="filter-start-date-mobile"
              v-model="filters.startDate"
              type="date"
              icon="i-lucide-calendar"
              size="lg"
              class="w-full"
              placeholder="Start"
            />
          </div>
          <div class="flex-1 min-w-0">
            <label class="sr-only" for="filter-end-date-mobile">End date</label>
            <UInput
              id="filter-end-date-mobile"
              v-model="filters.endDate"
              type="date"
              icon="i-lucide-calendar"
              size="lg"
              class="w-full"
              placeholder="End"
            />
          </div>
        </div>

        <!-- Row 2: Supplier and Dropdowns -->
        <div class="flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <USelectMenu
              v-model="filters.supplierId"
              :items="supplierOptions"
              value-key="value"
              placeholder="All Suppliers"
              size="lg"
              class="w-full"
            >
              <template #leading>
                <UIcon name="i-lucide-building-2" class="w-5 h-5" />
              </template>
            </USelectMenu>
          </div>

          <!-- Icon-only status dropdown on mobile -->
          <UDropdownMenu :items="statusDropdownItems">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              class="cursor-pointer rounded-full px-3"
              trailing-icon="i-lucide-chevron-down"
              aria-label="Filter by status"
              :title="`Status: ${currentStatusLabel}`"
            >
              <UIcon :name="currentStatusIcon" class="w-4 h-4" />
            </UButton>
          </UDropdownMenu>

          <!-- Icon-only variance dropdown on mobile -->
          <UDropdownMenu :items="varianceDropdownItems">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              class="cursor-pointer rounded-full px-3"
              trailing-icon="i-lucide-chevron-down"
              aria-label="Filter by price variance"
              :title="`Variance: ${currentVarianceLabel}`"
            >
              <UIcon :name="currentVarianceIcon" class="w-4 h-4" />
            </UButton>
          </UDropdownMenu>
        </div>
      </div>

      <!-- Active Filters -->
      <div v-if="activeFilters.length > 0" class="mt-4 pt-4 border-t border-[var(--ui-border)]">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-[var(--ui-text-muted)]">Active filters:</span>
          <UBadge
            v-for="filter in activeFilters"
            :key="filter.key"
            color="primary"
            variant="soft"
            class="cursor-pointer"
            @click="clearFilter(filter.key)"
          >
            {{ filter.label }}: {{ filter.value }}
            <UIcon name="i-lucide-x" class="ml-1 h-3 w-3" />
          </UBadge>
        </div>
      </div>
    </UCard>

    <!-- Error State -->
    <ErrorAlert v-if="error" :message="error" @retry="fetchDeliveries" />

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading deliveries..." />
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="!hasDeliveries"
      icon="i-lucide-package-x"
      :title="activeFilters.length > 0 ? 'No deliveries found' : 'No deliveries yet'"
      :description="
        activeFilters.length > 0
          ? 'No deliveries match your current filters. Try adjusting your search criteria.'
          : 'Get started by creating your first delivery.'
      "
    >
      <template v-if="canPostDeliveries() && activeFilters.length === 0" #actions>
        <UButton
          color="primary"
          icon="i-lucide-plus"
          class="cursor-pointer"
          @click="goToNewDelivery"
        >
          Create First Delivery
        </UButton>
      </template>
    </EmptyState>

    <!-- Deliveries Table -->
    <UCard v-else class="card-elevated" :ui="{ body: 'p-0' }">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-[var(--ui-border)]">
          <thead>
            <tr class="bg-[var(--ui-bg-elevated)]">
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Delivery No</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Date</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Supplier</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Invoice No</th>
              <th class="px-4 py-3 text-right text-label uppercase tracking-wider">Total Amount</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">
                Price Variance
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)]">
            <tr
              v-for="delivery in deliveries"
              :key="delivery.id"
              class="hover:bg-[var(--ui-bg-elevated)] transition-colors cursor-pointer"
              @click="handleRowClick(delivery)"
            >
              <!-- Delivery No -->
              <td class="px-4 py-4 text-[var(--ui-text)] font-medium">
                {{ delivery.delivery_no }}
              </td>

              <!-- Status -->
              <td class="px-4 py-4">
                <UBadge
                  :color="delivery.status === 'DRAFT' ? 'neutral' : 'success'"
                  variant="subtle"
                  size="md"
                  class="inline-flex items-center gap-1"
                >
                  <UIcon
                    :name="
                      delivery.status === 'DRAFT' ? 'i-lucide-file-edit' : 'i-lucide-check-circle'
                    "
                    class="h-3 w-3"
                  />
                  {{ delivery.status === "DRAFT" ? "Draft" : "Posted" }}
                </UBadge>
              </td>

              <!-- Date -->
              <td class="px-4 py-4 text-caption">
                {{ formatDate(delivery.delivery_date) }}
              </td>

              <!-- Supplier -->
              <td class="px-4 py-4">
                <div class="font-medium text-[var(--ui-text)]">{{ delivery.supplier.name }}</div>
                <div class="text-caption">{{ delivery.supplier.code }}</div>
              </td>

              <!-- Invoice No -->
              <td class="px-4 py-4 text-caption">
                {{ delivery.invoice_no || "—" }}
              </td>

              <!-- Total Amount -->
              <td class="px-4 py-4 text-right text-[var(--ui-text)] font-medium">
                {{ formatCurrency(delivery.total_amount) }}
              </td>

              <!-- Price Variance -->
              <td class="px-4 py-4">
                <UBadge
                  v-if="delivery.has_variance"
                  color="warning"
                  variant="subtle"
                  size="md"
                  class="inline-flex items-center gap-1"
                >
                  <UIcon name="i-lucide-alert-triangle" class="h-3 w-3" />
                  Yes
                </UBadge>
                <span v-else class="text-caption">No</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="pagination.totalPages > 1"
        class="flex items-center justify-between border-t border-[var(--ui-border)] px-4 py-3"
      >
        <div class="text-caption">
          {{ paginationInfo }}
        </div>
        <div class="flex gap-1">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-chevron-left"
            size="sm"
            class="cursor-pointer"
            :disabled="pagination.page === 1"
            @click="previousPage"
          />

          <template v-for="page in pagination.totalPages" :key="page">
            <UButton
              v-if="
                page === 1 ||
                page === pagination.totalPages ||
                Math.abs(page - pagination.page) <= 1
              "
              :color="page === pagination.page ? 'primary' : 'neutral'"
              :variant="page === pagination.page ? 'solid' : 'outline'"
              size="sm"
              class="cursor-pointer"
              @click="goToPage(page)"
            >
              {{ page }}
            </UButton>
            <span
              v-else-if="page === 2 || page === pagination.totalPages - 1"
              class="flex items-center px-2 text-[var(--ui-text-muted)]"
            >
              ...
            </span>
          </template>

          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-chevron-right"
            size="sm"
            class="cursor-pointer"
            :disabled="pagination.page === pagination.totalPages"
            @click="nextPage"
          />
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate } from "~/utils/format";

// SEO
useSeoMeta({
  title: "Deliveries - Stock Management System",
  description: "View and manage deliveries and goods receipts",
});

// Composables
const router = useRouter();
const locationStore = useLocationStore();
const { canPostDeliveries } = usePermissions();

// Types
type DeliveryStatus = "DRAFT" | "POSTED";

interface Delivery {
  id: string;
  delivery_no: string;
  delivery_date: string;
  invoice_no: string | null;
  total_amount: number;
  has_variance: boolean;
  status: DeliveryStatus;
  supplier: {
    id: string;
    name: string;
    code: string;
  };
  period: {
    id: string;
    name: string;
  };
  created_at: string;
  posted_at: string | null;
  creator: {
    id: string;
    full_name: string;
  };
}

interface Supplier {
  id: string;
  name: string;
  code: string;
}

// State
const loading = ref(false);
const error = ref<string | null>(null);
const deliveries = ref<Delivery[]>([]);
const suppliers = ref<Supplier[]>([]);

// Filters
const filters = reactive({
  supplierId: "all",
  hasVariance: null as boolean | null,
  startDate: "",
  endDate: "",
  status: "all" as "all" | "my_drafts" | "posted",
});

// Pagination
const pagination = reactive({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
});

// Computed
const activeLocationId = computed(() => locationStore.activeLocationId);
const activeLocation = computed(() => locationStore.activeLocation);
const hasDeliveries = computed(() => deliveries.value.length > 0);

const paginationInfo = computed(() => {
  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);
  return `${start}-${end} of ${pagination.total}`;
});

// Supplier options for dropdown
const supplierOptions = computed(() => [
  { label: "All Suppliers", value: "all" },
  ...suppliers.value.map((s) => ({
    label: `${s.name} (${s.code})`,
    value: s.id,
  })),
]);

// Variance dropdown items
const varianceDropdownItems = computed(() => [
  [
    {
      label: "All",
      icon: "i-lucide-list",
      active: filters.hasVariance === null,
      onSelect: () => selectVariance(null),
    },
    {
      label: "With Variance",
      icon: "i-lucide-alert-triangle",
      active: filters.hasVariance === true,
      onSelect: () => selectVariance(true),
    },
    {
      label: "No Variance",
      icon: "i-lucide-circle-check",
      active: filters.hasVariance === false,
      onSelect: () => selectVariance(false),
    },
  ],
]);

const currentVarianceLabel = computed(() => {
  if (filters.hasVariance === true) return "With Variance";
  if (filters.hasVariance === false) return "No Variance";
  return "All";
});

const currentVarianceIcon = computed(() => {
  if (filters.hasVariance === true) return "i-lucide-alert-triangle";
  if (filters.hasVariance === false) return "i-lucide-circle-check";
  return "i-lucide-list";
});

// Status dropdown items
const statusDropdownItems = computed(() => [
  [
    {
      label: "All Deliveries",
      icon: "i-lucide-list",
      active: filters.status === "all",
      onSelect: () => selectStatus("all"),
    },
    {
      label: "My Drafts",
      icon: "i-lucide-file-edit",
      active: filters.status === "my_drafts",
      onSelect: () => selectStatus("my_drafts"),
    },
    {
      label: "Posted",
      icon: "i-lucide-check-circle",
      active: filters.status === "posted",
      onSelect: () => selectStatus("posted"),
    },
  ],
]);

const currentStatusLabel = computed(() => {
  if (filters.status === "my_drafts") return "My Drafts";
  if (filters.status === "posted") return "Posted";
  return "All";
});

const currentStatusIcon = computed(() => {
  if (filters.status === "my_drafts") return "i-lucide-file-edit";
  if (filters.status === "posted") return "i-lucide-check-circle";
  return "i-lucide-list";
});

// Active filters
const activeFilters = computed(() => {
  const activeFiltersList: Array<{ key: string; label: string; value: string }> = [];

  if (filters.supplierId && filters.supplierId !== "all") {
    const supplier = suppliers.value.find((s) => s.id === filters.supplierId);
    if (supplier) {
      activeFiltersList.push({
        key: "supplierId",
        label: "Supplier",
        value: supplier.name,
      });
    }
  }

  if (filters.hasVariance !== null) {
    activeFiltersList.push({
      key: "hasVariance",
      label: "Variance",
      value: filters.hasVariance ? "With Variance" : "No Variance",
    });
  }

  // Only show date range filter when BOTH dates are specified
  if (filters.startDate && filters.endDate) {
    activeFiltersList.push({
      key: "dateRange",
      label: "Date Range",
      value: `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`,
    });
  }

  if (filters.status !== "all") {
    activeFiltersList.push({
      key: "status",
      label: "Status",
      value: filters.status === "my_drafts" ? "My Drafts" : "Posted",
    });
  }

  return activeFiltersList;
});

// Select variance handler
function selectVariance(value: boolean | null) {
  filters.hasVariance = value;
  applyFilters();
}

// Select status handler
function selectStatus(value: "all" | "my_drafts" | "posted") {
  filters.status = value;
  applyFilters();
}

// Fetch deliveries
async function fetchDeliveries() {
  if (!activeLocationId.value) {
    error.value = "No active location selected";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();

    // Add location filter
    params.append("locationId", activeLocationId.value);

    if (filters.supplierId && filters.supplierId !== "all") {
      params.append("supplierId", filters.supplierId);
    }
    if (filters.hasVariance !== null) params.append("hasVariance", filters.hasVariance.toString());

    // Only apply date filter when BOTH dates are specified
    if (filters.startDate && filters.endDate) {
      params.append("startDate", filters.startDate);
      params.append("endDate", filters.endDate);
    }

    // Add status filter
    if (filters.status === "my_drafts") {
      params.append("status", "DRAFT");
      params.append("myDrafts", "true");
    } else if (filters.status === "posted") {
      params.append("status", "POSTED");
    }

    const response = await $fetch<{
      deliveries: Array<{
        id: string;
        delivery_no: string;
        delivery_date: string;
        invoice_no: string | null;
        total_amount: number;
        has_variance: boolean;
        status: DeliveryStatus;
        supplier_code: string;
        supplier_name: string;
        creator_id: string;
        creator_name: string;
        created_at: string;
        posted_at: string | null;
      }>;
      grand_totals: {
        total_deliveries: number;
      };
    }>(`/api/reports/deliveries?${params}`);

    // Map the response to match our component's expected format
    deliveries.value = response.deliveries.map((d) => ({
      id: d.id,
      delivery_no: d.delivery_no,
      delivery_date: d.delivery_date,
      invoice_no: d.invoice_no,
      total_amount: d.total_amount,
      has_variance: d.has_variance,
      status: d.status || "POSTED", // Default to POSTED for backwards compatibility
      supplier: {
        id: "", // Not available in report response
        name: d.supplier_name,
        code: d.supplier_code,
      },
      period: {
        id: "",
        name: "",
      },
      created_at: d.created_at || d.posted_at || "",
      posted_at: d.posted_at,
      creator: {
        id: d.creator_id || "",
        full_name: d.creator_name || "",
      },
    }));

    // Calculate pagination from response
    const total = response.grand_totals.total_deliveries;
    pagination.total = total;
    pagination.totalPages = Math.ceil(total / pagination.limit);
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } };
    error.value = fetchError?.data?.message || "Failed to fetch deliveries";
    console.error("Error fetching deliveries:", err);
  } finally {
    loading.value = false;
  }
}

// Fetch suppliers
async function fetchSuppliers() {
  try {
    const response = await $fetch<{ suppliers: Supplier[] }>("/api/suppliers");
    suppliers.value = response.suppliers;
  } catch (err: unknown) {
    console.error("Error fetching suppliers:", err);
  }
}

// Filter handlers
function clearFilter(key: string) {
  if (key === "hasVariance") {
    filters.hasVariance = null;
  } else if (key === "supplierId") {
    filters.supplierId = "all";
  } else if (key === "dateRange") {
    // Clear both dates when clearing the date range filter
    filters.startDate = "";
    filters.endDate = "";
  } else if (key === "status") {
    filters.status = "all";
  }
  pagination.page = 1;
  fetchDeliveries();
}

function applyFilters() {
  pagination.page = 1;
  fetchDeliveries();
}

// Pagination handlers
function goToPage(page: number) {
  if (page >= 1 && page <= pagination.totalPages) {
    pagination.page = page;
    fetchDeliveries();
  }
}

function previousPage() {
  if (pagination.page > 1) {
    goToPage(pagination.page - 1);
  }
}

function nextPage() {
  if (pagination.page < pagination.totalPages) {
    goToPage(pagination.page + 1);
  }
}

// Row click handler
function handleRowClick(delivery: Delivery) {
  router.push(`/deliveries/${delivery.id}`);
}

// Navigation
function goToNewDelivery() {
  router.push("/deliveries/create");
}

// Watch location changes
watch(activeLocationId, () => {
  if (activeLocationId.value) {
    pagination.page = 1;
    fetchDeliveries();
  }
});

// Computed: check if date range is complete (both dates specified)
const isDateRangeComplete = computed(() => {
  return filters.startDate !== "" && filters.endDate !== "";
});

// Watch supplier filter changes - apply immediately
watch(
  () => filters.supplierId,
  () => {
    if (activeLocationId.value) {
      pagination.page = 1;
      fetchDeliveries();
    }
  }
);

// Watch date range changes - only apply when BOTH dates are specified
watch(
  () => [filters.startDate, filters.endDate],
  ([newStartDate, newEndDate], [oldStartDate, oldEndDate]) => {
    if (!activeLocationId.value) return;

    // Only trigger fetch when:
    // 1. Both dates are now specified (complete range)
    // 2. OR a date was cleared (to remove the filter)
    const bothDatesSet = newStartDate !== "" && newEndDate !== "";
    const dateWasCleared =
      (oldStartDate !== "" && newStartDate === "") || (oldEndDate !== "" && newEndDate === "");

    if (bothDatesSet || dateWasCleared) {
      pagination.page = 1;
      fetchDeliveries();
    }
  }
);

// Initial load
onMounted(async () => {
  await fetchSuppliers();
  if (activeLocationId.value) {
    await fetchDeliveries();
  }
});
</script>
