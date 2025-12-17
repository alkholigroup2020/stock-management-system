<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-arrow-up-from-line" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl sm:text-3xl font-bold text-primary">Issues</h1>
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
            View and manage stock issues to cost centres
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
        v-if="canPostIssues()"
        color="primary"
        icon="i-lucide-plus"
        size="lg"
        class="cursor-pointer rounded-full px-3 sm:px-6"
        @click="goToNewIssue"
      >
        <span class="hidden sm:inline">New Issue</span>
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

        <!-- Cost Centre Dropdown (Far Right) -->
        <UDropdownMenu :items="costCentreDropdownItems" class="ml-auto">
          <UButton
            color="neutral"
            variant="outline"
            size="lg"
            class="cursor-pointer rounded-full px-5"
            trailing-icon="i-lucide-chevron-down"
            aria-label="Filter by cost centre"
          >
            <UIcon :name="currentCostCentreIcon" class="w-4 h-4 mr-2" />
            Cost Centre: {{ currentCostCentreLabel }}
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

        <!-- Row 2: Cost Centre Dropdown -->
        <div class="flex items-center gap-3">
          <!-- Icon-only dropdown on mobile -->
          <UDropdownMenu :items="costCentreDropdownItems" class="flex-1">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              class="cursor-pointer rounded-full w-full"
              trailing-icon="i-lucide-chevron-down"
              aria-label="Filter by cost centre"
              :title="`Cost Centre: ${currentCostCentreLabel}`"
            >
              <UIcon :name="currentCostCentreIcon" class="w-4 h-4 mr-2" />
              <span class="truncate">{{ currentCostCentreLabel }}</span>
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
    <ErrorAlert v-if="error" :message="error" @retry="fetchIssues" />

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading issues..." />
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="!hasIssues"
      icon="i-lucide-file-minus"
      :title="activeFilters.length > 0 ? 'No issues found' : 'No issues yet'"
      :description="
        activeFilters.length > 0
          ? 'No issues match your current filters. Try adjusting your search criteria.'
          : 'Get started by creating your first issue.'
      "
    >
      <template v-if="canPostIssues() && activeFilters.length === 0" #actions>
        <UButton
          color="primary"
          icon="i-lucide-plus"
          class="cursor-pointer"
          @click="goToNewIssue"
        >
          Create First Issue
        </UButton>
      </template>
    </EmptyState>

    <!-- Issues Table -->
    <UCard v-else class="card-elevated" :ui="{ body: 'p-0' }">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-[var(--ui-border)]">
          <thead>
            <tr class="bg-[var(--ui-bg-elevated)]">
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Issue No</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Date</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Cost Centre</th>
              <th class="px-4 py-3 text-right text-label uppercase tracking-wider">Total Value</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Posted By</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)]">
            <tr
              v-for="issue in issues"
              :key="issue.id"
              class="hover:bg-[var(--ui-bg-elevated)] transition-colors cursor-pointer"
              @click="handleRowClick(issue)"
            >
              <!-- Issue No -->
              <td class="px-4 py-4 text-[var(--ui-text)] font-medium">
                {{ issue.issue_no }}
              </td>

              <!-- Date -->
              <td class="px-4 py-4 text-caption">
                {{ formatDate(issue.issue_date) }}
              </td>

              <!-- Cost Centre -->
              <td class="px-4 py-4">
                <UBadge :color="getCostCentreColor(issue.cost_centre)" variant="subtle" size="md">
                  {{ issue.cost_centre }}
                </UBadge>
              </td>

              <!-- Total Value -->
              <td class="px-4 py-4 text-right text-[var(--ui-text)] font-medium">
                {{ formatCurrency(issue.total_value) }}
              </td>

              <!-- Posted By -->
              <td class="px-4 py-4">
                <div class="font-medium text-[var(--ui-text)]">
                  {{ issue.posted_by_user.full_name }}
                </div>
                <div class="text-caption">
                  {{ formatDate(issue.posted_at) }}
                </div>
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
  title: "Issues - Stock Management System",
  description: "View and manage stock issues",
});

// Composables
const router = useRouter();
const locationStore = useLocationStore();
const { canPostIssues } = usePermissions();

// Types
interface Issue {
  id: string;
  issue_no: string;
  issue_date: string;
  cost_centre: "FOOD" | "CLEAN" | "OTHER";
  total_value: number;
  period: {
    id: string;
    name: string;
  };
  posted_at: string;
  posted_by_user: {
    full_name: string;
  };
}

// State
const loading = ref(false);
const error = ref<string | null>(null);
const issues = ref<Issue[]>([]);

// Filters
const filters = reactive({
  costCentre: "all",
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
const activeLocation = computed(() => locationStore.activeLocation);
const hasIssues = computed(() => issues.value.length > 0);
const paginationInfo = computed(() => {
  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);
  return `${start}-${end} of ${pagination.total}`;
});

// Cost centre dropdown items
const costCentreDropdownItems = computed(() => [
  [
    {
      label: "All Cost Centres",
      icon: "i-lucide-list",
      active: filters.costCentre === "all",
      onSelect: () => selectCostCentre("all"),
    },
    {
      label: "Food",
      icon: "i-lucide-utensils",
      active: filters.costCentre === "FOOD",
      onSelect: () => selectCostCentre("FOOD"),
    },
    {
      label: "Cleaning",
      icon: "i-lucide-spray-can",
      active: filters.costCentre === "CLEAN",
      onSelect: () => selectCostCentre("CLEAN"),
    },
    {
      label: "Other",
      icon: "i-lucide-package",
      active: filters.costCentre === "OTHER",
      onSelect: () => selectCostCentre("OTHER"),
    },
  ],
]);

const currentCostCentreLabel = computed(() => {
  if (filters.costCentre === "FOOD") return "Food";
  if (filters.costCentre === "CLEAN") return "Cleaning";
  if (filters.costCentre === "OTHER") return "Other";
  return "All";
});

const currentCostCentreIcon = computed(() => {
  if (filters.costCentre === "FOOD") return "i-lucide-utensils";
  if (filters.costCentre === "CLEAN") return "i-lucide-spray-can";
  if (filters.costCentre === "OTHER") return "i-lucide-package";
  return "i-lucide-list";
});

// Active filters
const activeFilters = computed(() => {
  const activeFiltersList: Array<{ key: string; label: string; value: string }> = [];

  if (filters.costCentre && filters.costCentre !== "all") {
    activeFiltersList.push({
      key: "costCentre",
      label: "Cost Centre",
      value: currentCostCentreLabel.value,
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

// Cost centre color helper
function getCostCentreColor(
  costCentre: string
): "primary" | "secondary" | "success" | "error" | "warning" | "info" | "neutral" {
  switch (costCentre) {
    case "FOOD":
      return "success";
    case "CLEAN":
      return "info";
    case "OTHER":
      return "neutral";
    default:
      return "neutral";
  }
}

// Select cost centre handler
function selectCostCentre(value: string) {
  filters.costCentre = value;
  applyFilters();
}

// Fetch issues
async function fetchIssues() {
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

    if (filters.costCentre && filters.costCentre !== "all") {
      params.append("costCentre", filters.costCentre);
    }

    // Only apply date filter when BOTH dates are specified
    if (filters.startDate && filters.endDate) {
      params.append("startDate", filters.startDate);
      params.append("endDate", filters.endDate);
    }

    const response = await $fetch<{
      issues: Issue[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/api/locations/${activeLocationId.value}/issues?${params}`);

    // Safely handle response with defensive checks
    issues.value = response?.issues ?? [];
    pagination.total = response?.pagination?.total ?? 0;
    pagination.totalPages = response?.pagination?.totalPages ?? 0;
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } };
    error.value = fetchError?.data?.message || "Failed to fetch issues";
    console.error("Error fetching issues:", err);
  } finally {
    loading.value = false;
  }
}

// Filter handlers
function clearFilter(key: string) {
  if (key === "costCentre") {
    filters.costCentre = "all";
  } else if (key === "dateRange") {
    filters.startDate = "";
    filters.endDate = "";
  }
  pagination.page = 1;
  fetchIssues();
}

function applyFilters() {
  pagination.page = 1;
  fetchIssues();
}

// Pagination handlers
function goToPage(page: number) {
  if (page >= 1 && page <= pagination.totalPages) {
    pagination.page = page;
    fetchIssues();
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
function handleRowClick(issue: Issue) {
  router.push(`/issues/${issue.id}`);
}

// Navigation
function goToNewIssue() {
  router.push("/issues/create");
}

// Watch location changes
watch(activeLocationId, () => {
  if (activeLocationId.value) {
    pagination.page = 1;
    fetchIssues();
  }
});

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
      fetchIssues();
    }
  }
);

// Initial load
onMounted(async () => {
  if (activeLocationId.value) {
    await fetchIssues();
  }
});
</script>
