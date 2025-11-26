<script setup lang="ts">
import { formatCurrency, formatDate } from "~/utils/format";

// SEO
useSeoMeta({
  title: "Transfers - Stock Management System",
  description: "View and manage stock transfers between locations",
});

// Composables
const router = useRouter();
const authStore = useAuthStore();
const { canCreateTransfer } = usePermissions();
const toast = useAppToast();

// Types
interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface Transfer {
  id: string;
  transfer_no: string;
  request_date: string;
  approval_date: string | null;
  transfer_date: string | null;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "COMPLETED";
  total_value: number;
  notes: string | null;
  from_location: Location;
  to_location: Location;
  requester: {
    id: string;
    username: string;
    full_name: string;
    role: string;
  };
  approver: {
    id: string;
    username: string;
    full_name: string;
    role: string;
  } | null;
  created_at: string;
  updated_at: string;
}

// State
const loading = ref(false);
const error = ref<string | null>(null);
const transfers = ref<Transfer[]>([]);
const locations = ref<Location[]>([]);

// Filters
const filters = reactive({
  fromLocationId: "",
  toLocationId: "",
  status: "",
  startDate: "",
  endDate: "",
});

// Computed
const hasTransfers = computed(() => transfers.value.length > 0);
const canRequestTransfer = computed(() => {
  // User can create transfer if they have at least one location
  const defaultLocationId = authStore.user?.default_location_id;
  return defaultLocationId ? canCreateTransfer(defaultLocationId) : false;
});

// Active filters
const activeFilters = computed(() => {
  const activeFiltersList: Array<{ key: string; label: string; value: any }> = [];
  if (filters.fromLocationId) {
    const location = locations.value.find((l) => l.id === filters.fromLocationId);
    if (location) {
      activeFiltersList.push({
        key: "fromLocationId",
        label: "From Location",
        value: location.name,
      });
    }
  }
  if (filters.toLocationId) {
    const location = locations.value.find((l) => l.id === filters.toLocationId);
    if (location) {
      activeFiltersList.push({
        key: "toLocationId",
        label: "To Location",
        value: location.name,
      });
    }
  }
  if (filters.status) {
    activeFiltersList.push({
      key: "status",
      label: "Status",
      value: filters.status.replace(/_/g, " "),
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
  { key: "transfer_no", label: "Transfer No" },
  { key: "request_date", label: "Date" },
  { key: "from_location", label: "From Location" },
  { key: "to_location", label: "To Location" },
  { key: "status", label: "Status" },
  { key: "total_value", label: "Total Value" },
];

// Status badge helper
function getStatusBadgeClass(status: Transfer["status"]) {
  const badgeClasses = {
    DRAFT: "badge-draft",
    PENDING_APPROVAL: "badge-pending",
    APPROVED: "badge-approved",
    REJECTED: "badge-rejected",
    COMPLETED: "badge-approved",
  };
  return badgeClasses[status] || "badge-draft";
}

function getStatusColor(status: Transfer["status"]) {
  const statusColors = {
    DRAFT: "neutral",
    PENDING_APPROVAL: "primary",
    APPROVED: "success",
    REJECTED: "error",
    COMPLETED: "success",
  } as const;
  return statusColors[status] || "neutral";
}

function getStatusLabel(status: Transfer["status"]) {
  const statusLabels = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    COMPLETED: "Completed",
  };
  return statusLabels[status] || status;
}

// Fetch transfers
async function fetchTransfers() {
  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();

    if (filters.fromLocationId) params.append("fromLocationId", filters.fromLocationId);
    if (filters.toLocationId) params.append("toLocationId", filters.toLocationId);
    if (filters.status) params.append("status", filters.status);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const response = await $fetch<{
      transfers: Transfer[];
      count: number;
    }>(`/api/transfers?${params}`);

    transfers.value = response.transfers;
  } catch (err: any) {
    error.value = err?.data?.message || "Failed to fetch transfers";
    console.error("Error fetching transfers:", err);
  } finally {
    loading.value = false;
  }
}

// Fetch locations
async function fetchLocations() {
  try {
    const response = await $fetch<{ locations: Location[] }>("/api/locations");
    locations.value = response.locations;
  } catch (err: any) {
    console.error("Error fetching locations:", err);
  }
}

// Filter handlers
function clearFilter(key: string) {
  (filters as any)[key] = "";
  fetchTransfers();
}

function applyFilters() {
  fetchTransfers();
}

function clearAllFilters() {
  filters.fromLocationId = "";
  filters.toLocationId = "";
  filters.status = "";
  filters.startDate = "";
  filters.endDate = "";
  applyFilters();
}

// Row click handler
function handleRowClick(transfer: Transfer) {
  router.push(`/transfers/${transfer.id}`);
}

// Navigation
function goToNewTransfer() {
  router.push("/transfers/create");
}

// Initial load
onMounted(async () => {
  await fetchLocations();
  await fetchTransfers();
});
</script>

<template>
  <div class="p-4 md:p-6">
    <div class="space-y-6">
      <!-- Page Header -->
      <LayoutPageHeader
        title="Stock Transfers"
        icon="i-lucide-arrow-left-right"
        :show-location="true"
        :show-period="true"
        location-scope="current"
      >
        <template #actions>
          <UButton
            v-if="canRequestTransfer"
            color="primary"
            icon="i-lucide-plus"
            label="New Transfer"
            @click="goToNewTransfer"
          />
        </template>
      </LayoutPageHeader>

      <!-- Filters -->
      <div class="card-elevated p-4">
        <h2 class="mb-4 text-label font-semibold">Filters</h2>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <!-- From Location Filter -->
          <div>
            <label class="form-label">From Location</label>
            <select v-model="filters.fromLocationId" class="form-input w-full">
              <option value="">All Locations</option>
              <option v-for="location in locations" :key="location.id" :value="location.id">
                {{ location.name }} ({{ location.code }})
              </option>
            </select>
          </div>

          <!-- To Location Filter -->
          <div>
            <label class="form-label">To Location</label>
            <select v-model="filters.toLocationId" class="form-input w-full">
              <option value="">All Locations</option>
              <option v-for="location in locations" :key="location.id" :value="location.id">
                {{ location.name }} ({{ location.code }})
              </option>
            </select>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="form-label">Status</label>
            <select v-model="filters.status" class="form-input w-full">
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

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
        </div>

        <!-- Date Range End (Second Row) -->
        <div class="mt-4">
          <label class="form-label">End Date</label>
          <input
            v-model="filters.endDate"
            type="date"
            class="form-input w-full md:w-1/4"
            placeholder="End date"
          />
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
            @click="clearAllFilters"
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
      <ErrorAlert v-if="error" :message="error" @retry="fetchTransfers" class="mb-6" />

      <!-- Loading State -->
      <CommonTableSkeleton v-if="loading" :columns="6" :rows="8" />

      <!-- Transfers Table -->
      <div
        v-else-if="hasTransfers"
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
                v-for="transfer in transfers"
                :key="transfer.id"
                class="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                @click="handleRowClick(transfer)"
              >
                <td class="whitespace-nowrap px-4 py-3 text-body font-medium">
                  {{ transfer.transfer_no }}
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-body">
                  {{ formatDate(transfer.request_date) }}
                </td>
                <td class="px-4 py-3 text-body">
                  <div class="font-medium">{{ transfer.from_location.name }}</div>
                  <div class="text-caption">
                    {{ transfer.from_location.code }}
                  </div>
                </td>
                <td class="px-4 py-3 text-body">
                  <div class="font-medium">{{ transfer.to_location.name }}</div>
                  <div class="text-caption">
                    {{ transfer.to_location.code }}
                  </div>
                </td>
                <td class="px-4 py-3 text-body">
                  <UBadge :color="getStatusColor(transfer.status)" variant="soft">
                    {{ getStatusLabel(transfer.status) }}
                  </UBadge>
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-body font-medium">
                  {{ formatCurrency(transfer.total_value) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <CommonEmptyState
        v-else
        icon="i-lucide-arrow-left-right"
        title="No Transfers Found"
        :description="
          activeFilters.length > 0
            ? 'No transfers match your current filters. Try adjusting your search criteria.'
            : 'No transfers have been recorded yet. Click the button above to create your first transfer.'
        "
      >
        <template v-if="canRequestTransfer" #action>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            label="New Transfer"
            @click="goToNewTransfer"
          />
        </template>
      </CommonEmptyState>
    </div>
  </div>
</template>
