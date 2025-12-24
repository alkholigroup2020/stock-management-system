<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-arrow-left-right" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Stock Transfers</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            View and manage stock transfers between locations
          </p>
        </div>
      </div>
      <UButton
        v-if="canRequestTransfer"
        color="primary"
        icon="i-lucide-plus"
        size="lg"
        class="cursor-pointer rounded-full px-3 sm:px-6"
        @click="goToNewTransfer"
      >
        <span class="hidden sm:inline">New Transfer</span>
        <span class="sm:hidden">New</span>
      </UButton>
    </div>

    <!-- Filter Section -->
    <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
      <!-- Desktop: Full filter bar (lg and above) -->
      <div class="hidden lg:flex items-center gap-3">
        <!-- From Location -->
        <div class="flex-1 min-w-0 max-w-xs">
          <USelectMenu
            v-model="filters.fromLocationId"
            :items="fromLocationOptions"
            value-key="value"
            placeholder="From Location"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <UIcon name="i-lucide-map-pin" class="w-5 h-5" />
            </template>
          </USelectMenu>
        </div>

        <!-- To Location -->
        <div class="flex-1 min-w-0 max-w-xs">
          <USelectMenu
            v-model="filters.toLocationId"
            :items="toLocationOptions"
            value-key="value"
            placeholder="To Location"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <UIcon name="i-lucide-map-pin-off" class="w-5 h-5" />
            </template>
          </USelectMenu>
        </div>

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

        <!-- Status Dropdown (Far Right) -->
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
      </div>

      <!-- Mobile: Stacked layout (below lg) -->
      <div class="flex flex-col gap-3 lg:hidden">
        <!-- Row 1: From and To Location -->
        <div class="flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <USelectMenu
              v-model="filters.fromLocationId"
              :items="fromLocationOptions"
              value-key="value"
              placeholder="From"
              size="lg"
              class="w-full"
            >
              <template #leading>
                <UIcon name="i-lucide-map-pin" class="w-5 h-5" />
              </template>
            </USelectMenu>
          </div>
          <div class="flex-1 min-w-0">
            <USelectMenu
              v-model="filters.toLocationId"
              :items="toLocationOptions"
              value-key="value"
              placeholder="To"
              size="lg"
              class="w-full"
            >
              <template #leading>
                <UIcon name="i-lucide-map-pin-off" class="w-5 h-5" />
              </template>
            </USelectMenu>
          </div>
        </div>

        <!-- Row 2: Date Range -->
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

        <!-- Row 3: Status Dropdown -->
        <div class="flex items-center gap-3">
          <UDropdownMenu :items="statusDropdownItems" class="flex-1">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              class="cursor-pointer rounded-full w-full"
              trailing-icon="i-lucide-chevron-down"
              aria-label="Filter by status"
              :title="`Status: ${currentStatusLabel}`"
            >
              <UIcon :name="currentStatusIcon" class="w-4 h-4 mr-2" />
              <span class="truncate">{{ currentStatusLabel }}</span>
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
    <ErrorAlert v-if="error" :message="error" @retry="fetchTransfers" />

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading transfers..." />
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="!hasTransfers"
      icon="i-lucide-arrow-left-right"
      :title="activeFilters.length > 0 ? 'No transfers found' : 'No transfers yet'"
      :description="
        activeFilters.length > 0
          ? 'No transfers match your current filters. Try adjusting your search criteria.'
          : 'Get started by creating your first transfer.'
      "
    >
      <template v-if="canRequestTransfer && activeFilters.length === 0" #action>
        <UButton
          color="primary"
          icon="i-lucide-plus"
          class="cursor-pointer rounded-full"
          @click="goToNewTransfer"
        >
          Create First Transfer
        </UButton>
      </template>
    </EmptyState>

    <!-- Transfers Table -->
    <UCard v-else class="card-elevated" :ui="{ body: 'p-0' }">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-[var(--ui-border)]">
          <thead>
            <tr class="bg-[var(--ui-bg-elevated)]">
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Transfer No</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Date</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">From Location</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">To Location</th>
              <th class="px-4 py-3 text-right text-label uppercase tracking-wider">Total Value</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)]">
            <tr
              v-for="transfer in transfers"
              :key="transfer.id"
              class="hover:bg-[var(--ui-bg-elevated)] transition-colors cursor-pointer"
              @click="handleRowClick(transfer)"
            >
              <!-- Transfer No -->
              <td class="px-4 py-4 text-[var(--ui-text)] font-medium">
                {{ transfer.transfer_no }}
              </td>

              <!-- Status -->
              <td class="px-4 py-4">
                <UBadge :color="getStatusColor(transfer.status)" variant="subtle" size="md">
                  {{ getStatusLabel(transfer.status) }}
                </UBadge>
              </td>

              <!-- Date -->
              <td class="px-4 py-4 text-caption">
                {{ formatDate(transfer.request_date) }}
              </td>

              <!-- From Location -->
              <td class="px-4 py-4">
                <div class="font-medium text-[var(--ui-text)]">
                  {{ transfer.from_location.name }}
                </div>
                <div class="text-caption">
                  {{ transfer.from_location.code }}
                </div>
              </td>

              <!-- To Location -->
              <td class="px-4 py-4">
                <div class="font-medium text-[var(--ui-text)]">{{ transfer.to_location.name }}</div>
                <div class="text-caption">
                  {{ transfer.to_location.code }}
                </div>
              </td>

              <!-- Total Value -->
              <td class="px-4 py-4 text-right text-[var(--ui-text)] font-medium">
                {{ formatCurrency(transfer.total_value) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>

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
  fromLocationId: "all",
  toLocationId: "all",
  status: "all" as "all" | "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "COMPLETED",
  startDate: "",
  endDate: "",
});

// Computed
const hasTransfers = computed(() => transfers.value.length > 0);
// Check if user can request a transfer - call without locationId to check general permission
const canRequestTransfer = computed(() => canCreateTransfer());

// Location options for dropdowns
const fromLocationOptions = computed(() => [
  { label: "All Locations", value: "all" },
  ...locations.value.map((loc) => ({
    label: `${loc.name} (${loc.code})`,
    value: loc.id,
  })),
]);

const toLocationOptions = computed(() => [
  { label: "All Locations", value: "all" },
  ...locations.value.map((loc) => ({
    label: `${loc.name} (${loc.code})`,
    value: loc.id,
  })),
]);

// Status dropdown items
const statusDropdownItems = computed(() => [
  [
    {
      label: "All Status",
      icon: "i-lucide-list",
      active: filters.status === "all",
      onSelect: () => selectStatus("all"),
    },
    {
      label: "Draft",
      icon: "i-lucide-file-edit",
      active: filters.status === "DRAFT",
      onSelect: () => selectStatus("DRAFT"),
    },
    {
      label: "Pending",
      icon: "i-lucide-clock",
      active: filters.status === "PENDING_APPROVAL",
      onSelect: () => selectStatus("PENDING_APPROVAL"),
    },
    {
      label: "Approved",
      icon: "i-lucide-check-circle",
      active: filters.status === "APPROVED",
      onSelect: () => selectStatus("APPROVED"),
    },
    {
      label: "Rejected",
      icon: "i-lucide-x-circle",
      active: filters.status === "REJECTED",
      onSelect: () => selectStatus("REJECTED"),
    },
    {
      label: "Completed",
      icon: "i-lucide-check-square",
      active: filters.status === "COMPLETED",
      onSelect: () => selectStatus("COMPLETED"),
    },
  ],
]);

const currentStatusLabel = computed(() => {
  if (filters.status === "all") return "All";
  if (filters.status === "PENDING_APPROVAL") return "Pending";
  return filters.status.charAt(0) + filters.status.slice(1).toLowerCase();
});

const currentStatusIcon = computed(() => {
  const icons = {
    all: "i-lucide-list",
    DRAFT: "i-lucide-file-edit",
    PENDING_APPROVAL: "i-lucide-clock",
    APPROVED: "i-lucide-check-circle",
    REJECTED: "i-lucide-x-circle",
    COMPLETED: "i-lucide-check-square",
  };
  return icons[filters.status] || "i-lucide-list";
});

// Active filters
const activeFilters = computed(() => {
  const activeFiltersList: Array<{ key: string; label: string; value: string }> = [];

  if (filters.fromLocationId && filters.fromLocationId !== "all") {
    const location = locations.value.find((l) => l.id === filters.fromLocationId);
    if (location) {
      activeFiltersList.push({
        key: "fromLocationId",
        label: "From",
        value: location.name,
      });
    }
  }

  if (filters.toLocationId && filters.toLocationId !== "all") {
    const location = locations.value.find((l) => l.id === filters.toLocationId);
    if (location) {
      activeFiltersList.push({
        key: "toLocationId",
        label: "To",
        value: location.name,
      });
    }
  }

  if (filters.status !== "all") {
    activeFiltersList.push({
      key: "status",
      label: "Status",
      value: currentStatusLabel.value,
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

  return activeFiltersList;
});

// Status badge helpers
function getStatusColor(
  status: Transfer["status"]
): "success" | "warning" | "error" | "neutral" | "primary" {
  const statusColors = {
    DRAFT: "neutral" as const,
    PENDING_APPROVAL: "primary" as const,
    APPROVED: "success" as const,
    REJECTED: "error" as const,
    COMPLETED: "success" as const,
  };
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

// Select status handler
function selectStatus(
  value: "all" | "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "COMPLETED"
) {
  filters.status = value;
  applyFilters();
}

// Fetch transfers
async function fetchTransfers() {
  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();

    if (filters.fromLocationId && filters.fromLocationId !== "all") {
      params.append("fromLocationId", filters.fromLocationId);
    }
    if (filters.toLocationId && filters.toLocationId !== "all") {
      params.append("toLocationId", filters.toLocationId);
    }
    if (filters.status !== "all") params.append("status", filters.status);

    // Only apply date filter when BOTH dates are specified
    if (filters.startDate && filters.endDate) {
      params.append("startDate", filters.startDate);
      params.append("endDate", filters.endDate);
    }

    const response = await $fetch<{
      transfers: Transfer[];
      count: number;
    }>(`/api/transfers?${params}`);

    transfers.value = response.transfers;
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } };
    error.value = fetchError?.data?.message || "Failed to fetch transfers";
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
  } catch (err: unknown) {
    console.error("Error fetching locations:", err);
  }
}

// Filter handlers
function clearFilter(key: string) {
  if (key === "fromLocationId") {
    filters.fromLocationId = "all";
  } else if (key === "toLocationId") {
    filters.toLocationId = "all";
  } else if (key === "status") {
    filters.status = "all";
  } else if (key === "dateRange") {
    filters.startDate = "";
    filters.endDate = "";
  }
  fetchTransfers();
}

function applyFilters() {
  fetchTransfers();
}

// Row click handler
function handleRowClick(transfer: Transfer) {
  router.push(`/transfers/${transfer.id}`);
}

// Navigation
function goToNewTransfer() {
  router.push("/transfers/create");
}

// Watch location filter changes - apply immediately
watch(
  () => filters.fromLocationId,
  () => {
    applyFilters();
  }
);

watch(
  () => filters.toLocationId,
  () => {
    applyFilters();
  }
);

// Watch date range changes - only apply when BOTH dates are specified
watch(
  () => [filters.startDate, filters.endDate],
  ([newStartDate, newEndDate], [oldStartDate, oldEndDate]) => {
    // Only trigger fetch when:
    // 1. Both dates are now specified (complete range)
    // 2. OR a date was cleared (to remove the filter)
    const bothDatesSet = newStartDate !== "" && newEndDate !== "";
    const dateWasCleared =
      (oldStartDate !== "" && newStartDate === "") || (oldEndDate !== "" && newEndDate === "");

    if (bothDatesSet || dateWasCleared) {
      applyFilters();
    }
  }
);

// Initial load
onMounted(async () => {
  await fetchLocations();
  await fetchTransfers();
});
</script>
