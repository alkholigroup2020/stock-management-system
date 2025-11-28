<script setup lang="ts">
import { formatCurrency, formatDate } from "~/utils/format";

// SEO
useSeoMeta({
  title: "Deliveries - Stock Management System",
  description: "View and manage deliveries and goods receipts",
});

// No middleware needed - auth.global will handle authentication automatically

// Composables
const router = useRouter();
const locationStore = useLocationStore();
const { canPostDeliveries } = usePermissions();
const toast = useAppToast();

// Types
interface Delivery {
  id: string;
  delivery_no: string;
  delivery_date: string;
  invoice_no: string | null;
  total_amount: number;
  has_variance: boolean;
  supplier: {
    id: string;
    name: string;
    code: string;
  };
  period: {
    id: string;
    name: string;
  };
  posted_at: string;
  posted_by_user: {
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
  search: "",
  supplierId: "",
  hasVariance: false,
  startDate: "",
  endDate: "",
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
const hasDeliveries = computed(() => deliveries.value.length > 0);
const paginationInfo = computed(() => {
  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);
  return `${start}-${end} of ${pagination.total}`;
});

// Active filters
const activeFilters = computed(() => {
  const activeFiltersList: Array<{ key: string; label: string; value: any }> = [];
  if (filters.supplierId) {
    const supplier = suppliers.value.find((s) => s.id === filters.supplierId);
    if (supplier) {
      activeFiltersList.push({
        key: "supplierId",
        label: "Supplier",
        value: supplier.name,
      });
    }
  }
  if (filters.hasVariance) {
    activeFiltersList.push({
      key: "hasVariance",
      label: "Has Price Variance",
      value: "Yes",
    });
  }
  if (filters.startDate) {
    activeFiltersList.push({
      key: "startDate",
      label: "Start Date",
      value: formatDate(filters.startDate),
    });
  }
  if (filters.endDate) {
    activeFiltersList.push({
      key: "endDate",
      label: "End Date",
      value: formatDate(filters.endDate),
    });
  }
  return activeFiltersList;
});

// Table columns
const columns = [
  { key: "delivery_no", label: "Delivery No" },
  { key: "delivery_date", label: "Date" },
  { key: "supplier", label: "Supplier" },
  { key: "invoice_no", label: "Invoice No" },
  { key: "total_amount", label: "Total Amount" },
  { key: "has_variance", label: "Price Variance" },
];

// Fetch deliveries
async function fetchDeliveries() {
  if (!activeLocationId.value) {
    error.value = "No active location selected";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    });

    if (filters.supplierId) params.append("supplierId", filters.supplierId);
    if (filters.hasVariance) params.append("hasVariance", "true");
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const response = await $fetch<{
      deliveries: Delivery[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/api/locations/${activeLocationId.value}/deliveries?${params}`);

    deliveries.value = response.deliveries;
    pagination.total = response.pagination.total;
    pagination.totalPages = response.pagination.totalPages;
  } catch (err: any) {
    error.value = err?.data?.message || "Failed to fetch deliveries";
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
  } catch (err: any) {
    console.error("Error fetching suppliers:", err);
  }
}

// Filter handlers
function clearFilter(key: string) {
  (filters as any)[key] = key === "hasVariance" ? false : "";
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

// Initial load
onMounted(async () => {
  await fetchSuppliers();
  if (activeLocationId.value) {
    await fetchDeliveries();
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <LayoutPageHeader
      title="Deliveries & Goods Receipts"
      icon="i-lucide-truck"
      :show-location="true"
      :show-period="true"
      location-scope="current"
    >
      <template #actions>
        <UButton
          v-if="canPostDeliveries()"
          color="primary"
          icon="i-lucide-plus"
          label="New Delivery"
          @click="goToNewDelivery"
        />
      </template>
    </LayoutPageHeader>

    <!-- Filters -->
    <div class="card-elevated p-4">
      <h2 class="mb-4 text-label font-semibold">Filters</h2>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- Date Range Start -->
        <div>
          <label class="form-label">Start Date</label>
          <input
            v-model="filters.startDate"
            type="date"
            class="form-input w-full"
            placeholder="Start date"
          />
        </div>

        <!-- Date Range End -->
        <div>
          <label class="form-label">End Date</label>
          <input
            v-model="filters.endDate"
            type="date"
            class="form-input w-full"
            placeholder="End date"
          />
        </div>

        <!-- Supplier Filter -->
        <div>
          <label class="form-label">Supplier</label>
          <select v-model="filters.supplierId" class="form-input w-full">
            <option value="">All Suppliers</option>
            <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
              {{ supplier.name }} ({{ supplier.code }})
            </option>
          </select>
        </div>

        <!-- Has Variance Filter -->
        <div class="flex items-end">
          <UCheckbox v-model="filters.hasVariance" label="Has Price Variance" class="text-body" />
        </div>
      </div>

      <!-- Filter Actions -->
      <div class="mt-4 flex gap-2">
        <UButton
          color="primary"
          icon="i-lucide-filter"
          label="Apply Filters"
          @click="applyFilters"
        />
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-x"
          label="Clear All"
          @click="
            () => {
              filters.search = '';
              filters.supplierId = '';
              filters.hasVariance = false;
              filters.startDate = '';
              filters.endDate = '';
              applyFilters();
            }
          "
        />
      </div>

      <!-- Active Filters -->
      <div v-if="activeFilters.length > 0" class="mt-4 flex flex-wrap gap-2">
        <span class="text-caption">Active filters:</span>
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

    <!-- Error State -->
    <ErrorAlert v-if="error" :message="error" @retry="fetchDeliveries" class="mb-6" />

    <!-- Loading State -->
    <TableSkeleton v-if="loading" :columns="6" :rows="8" />

    <!-- Deliveries Table -->
    <div
      v-else-if="hasDeliveries"
      class="overflow-hidden rounded-lg border border-default bg-elevated"
    >
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-default bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr
              v-for="delivery in deliveries"
              :key="delivery.id"
              class="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
              @click="handleRowClick(delivery)"
            >
              <td class="whitespace-nowrap px-4 py-3 text-body font-medium">
                {{ delivery.delivery_no }}
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-body">
                {{ formatDate(delivery.delivery_date) }}
              </td>
              <td class="px-4 py-3 text-body">
                <div class="font-medium">{{ delivery.supplier.name }}</div>
                <div class="text-caption">
                  {{ delivery.supplier.code }}
                </div>
              </td>
              <td class="px-4 py-3 text-body">
                {{ delivery.invoice_no || "—" }}
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-body font-medium">
                {{ formatCurrency(delivery.total_amount) }}
              </td>
              <td class="px-4 py-3 text-body">
                <UBadge
                  v-if="delivery.has_variance"
                  color="warning"
                  variant="soft"
                  class="inline-flex items-center gap-1"
                >
                  <UIcon name="i-lucide-alert-triangle" class="h-3 w-3" />
                  Yes
                </UBadge>
                <span v-else class="text-muted">No</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="pagination.totalPages > 1"
        class="flex items-center justify-between border-t border-default px-4 py-3"
      >
        <div class="text-caption">
          {{ paginationInfo }}
        </div>
        <div class="flex gap-1">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-chevron-left"
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
              @click="goToPage(page)"
            >
              {{ page }}
            </UButton>
            <span
              v-else-if="page === 2 || page === pagination.totalPages - 1"
              class="flex items-center px-2 text-muted"
            >
              ...
            </span>
          </template>

          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-chevron-right"
            :disabled="pagination.page === pagination.totalPages"
            @click="nextPage"
          />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else
      icon="i-lucide-package"
      title="No Deliveries Found"
      :description="
        activeFilters.length > 0
          ? 'No deliveries match your current filters. Try adjusting your search criteria.'
          : 'No deliveries have been recorded yet. Click the button above to create your first delivery.'
      "
    >
      <template v-if="canPostDeliveries()" #action>
        <UButton
          color="primary"
          icon="i-lucide-plus"
          label="New Delivery"
          @click="goToNewDelivery"
        />
      </template>
    </EmptyState>
  </div>
</template>
