<script setup lang="ts">
/**
 * Dashboard Page
 *
 * Main landing page for authenticated users showing key metrics,
 * recent activity, and quick actions.
 *
 * Features:
 * - Single Location View: Shows data for the active location
 * - Consolidated View (Supervisor/Admin only): Shows aggregated data across all locations
 */

import type { Delivery, Issue } from "~~/shared/types/database";
import { formatCurrency, formatDate } from "~/utils/format";

// Types for single location dashboard
interface DashboardData {
  location: {
    id: string;
    code: string;
    name: string;
  };
  period: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
  } | null;
  totals: {
    total_receipts: number;
    total_issues: number;
    total_mandays: number;
    days_left: number;
  };
  recent_deliveries: Array<
    Delivery & {
      supplier: { name: string; code: string };
    }
  >;
  recent_issues: Array<
    Issue & {
      cost_centre: string;
    }
  >;
}

// Types for consolidated dashboard
interface LocationTotals {
  location_id: string;
  location_code: string;
  location_name: string;
  location_type: string;
  total_receipts: number;
  total_issues: number;
  total_mandays: number;
}

interface ConsolidatedDashboardData {
  period: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
  } | null;
  global_totals: {
    total_receipts: number;
    total_issues: number;
    total_mandays: number;
    days_left: number;
    location_count: number;
    pending_transfers: number;
    pending_approvals: number;
  };
  location_breakdown: LocationTotals[];
  recent_deliveries: Array<{
    id: string;
    delivery_no: string;
    delivery_date: string;
    invoice_no: string | null;
    total_amount: number;
    has_variance: boolean;
    supplier: { id: string; code: string; name: string };
    location: { id: string; code: string; name: string };
  }>;
  recent_issues: Array<{
    id: string;
    issue_no: string;
    issue_date: string;
    cost_centre: string;
    total_value: number;
    location: { id: string; code: string; name: string };
  }>;
}

// Composables
const locationStore = useLocationStore();
const periodStore = usePeriodStore();
const authStore = useAuthStore();
const router = useRouter();
const appInit = useAppInit();

// Page metadata
definePageMeta({
  layout: "default",
});

useHead({
  title: "Dashboard - Stock Management",
});

// View mode: 'location' for single location, 'consolidated' for all locations
type ViewMode = "location" | "consolidated";
const viewMode = ref<ViewMode>("location");

// Check if user can access consolidated view
const canAccessConsolidated = computed(() => {
  return authStore.isAdmin || authStore.isSupervisor;
});

// Reactive state
const loading = ref(true);
const error = ref<string | null>(null);
const dashboardData = ref<DashboardData | null>(null);
const consolidatedData = ref<ConsolidatedDashboardData | null>(null);

// Fetch single location dashboard data
const fetchLocationDashboardData = async () => {
  if (!appInit.isReady.value) {
    return;
  }

  if (!locationStore.activeLocation) {
    error.value = "Please select a location";
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const data = await $fetch<DashboardData>(
      `/api/locations/${locationStore.activeLocation.id}/dashboard`
    );
    dashboardData.value = data;
  } catch (err: unknown) {
    console.error("Failed to fetch dashboard data:", err);
    const fetchError = err as { data?: { message?: string } };
    error.value = fetchError?.data?.message || "Failed to load dashboard data";
  } finally {
    loading.value = false;
  }
};

// Fetch consolidated dashboard data
const fetchConsolidatedDashboardData = async () => {
  if (!appInit.isReady.value) {
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const data = await $fetch<ConsolidatedDashboardData>("/api/dashboard/consolidated");
    consolidatedData.value = data;
  } catch (err: unknown) {
    console.error("Failed to fetch consolidated dashboard data:", err);
    const fetchError = err as { data?: { message?: string } };
    error.value = fetchError?.data?.message || "Failed to load consolidated dashboard data";
  } finally {
    loading.value = false;
  }
};

// Fetch data based on view mode
const fetchDashboardData = async () => {
  if (viewMode.value === "consolidated" && canAccessConsolidated.value) {
    await fetchConsolidatedDashboardData();
  } else {
    await fetchLocationDashboardData();
  }
};

// Switch view mode
const switchViewMode = (mode: ViewMode) => {
  viewMode.value = mode;
  fetchDashboardData();
};

// Watch for app initialization and location changes
watch(
  [() => appInit.isReady.value, () => locationStore.activeLocation?.id, viewMode],
  ([isReady, locationId], [wasReady]) => {
    if (isReady && (locationId || !wasReady)) {
      fetchDashboardData();
    }
  },
  { immediate: true }
);

// Computed: Metric cards data for single location view
const metricCards = computed(() => {
  if (!dashboardData.value?.totals) return [];

  const { totals } = dashboardData.value;

  // Calculate mandays cost (total issues / total mandays)
  const mandaysCost = totals.total_mandays > 0 ? totals.total_issues / totals.total_mandays : 0;

  return [
    {
      label: "Total Receipts",
      value: formatCurrency(totals.total_receipts || 0),
      icon: "package-check",
      color: "primary" as const,
    },
    {
      label: "Total Issues",
      value: formatCurrency(totals.total_issues || 0),
      icon: "file-minus",
      color: "secondary" as const,
    },
    {
      label: "Total Mandays",
      value: (totals.total_mandays || 0).toString(),
      icon: "users",
      color: "success" as const,
    },
    {
      label: "Mandays Cost",
      value: formatCurrency(mandaysCost),
      icon: "wallet",
      color: "warning" as const,
    },
    {
      label: "Days Left in Period",
      value: (totals.days_left || 0).toString(),
      icon: "calendar-days",
      color: "neutral" as const,
    },
  ];
});

// Computed: Metric cards for consolidated view
const consolidatedMetricCards = computed(() => {
  if (!consolidatedData.value?.global_totals) return [];

  const { global_totals } = consolidatedData.value;

  // Calculate mandays cost (total issues / total mandays)
  const mandaysCost =
    global_totals.total_mandays > 0 ? global_totals.total_issues / global_totals.total_mandays : 0;

  return [
    {
      label: "Total Receipts",
      value: formatCurrency(global_totals.total_receipts || 0),
      icon: "package-check",
      color: "primary" as const,
    },
    {
      label: "Total Issues",
      value: formatCurrency(global_totals.total_issues || 0),
      icon: "file-minus",
      color: "secondary" as const,
    },
    {
      label: "Total Mandays",
      value: (global_totals.total_mandays || 0).toString(),
      icon: "users",
      color: "success" as const,
    },
    {
      label: "Mandays Cost",
      value: formatCurrency(mandaysCost),
      icon: "wallet",
      color: "warning" as const,
    },
    {
      label: "Days Left in Period",
      value: (global_totals.days_left || 0).toString(),
      icon: "calendar-days",
      color: "neutral" as const,
    },
  ];
});

// Additional consolidated stats
const consolidatedStats = computed(() => {
  if (!consolidatedData.value?.global_totals) return [];

  const { global_totals } = consolidatedData.value;

  return [
    {
      label: "Active Locations",
      value: global_totals.location_count.toString(),
      icon: "map-pin",
      color: "primary" as const,
    },
    {
      label: "Pending Transfers",
      value: global_totals.pending_transfers.toString(),
      icon: "arrow-right-left",
      color: global_totals.pending_transfers > 0 ? ("error" as const) : ("neutral" as const),
    },
    {
      label: "Pending Approvals",
      value: global_totals.pending_approvals.toString(),
      icon: "clock",
      color: global_totals.pending_approvals > 0 ? ("error" as const) : ("neutral" as const),
    },
  ];
});

// Computed: Recent deliveries activity items for single location
const recentDeliveriesItems = computed(() => {
  if (!dashboardData.value?.recent_deliveries) return [];

  return dashboardData.value.recent_deliveries.map((delivery) => ({
    id: delivery.id,
    primary: delivery.delivery_no,
    secondary: formatDate(delivery.delivery_date),
    tertiary: `${delivery.supplier.name} (${delivery.supplier.code})`,
    amount: formatCurrency(Number(delivery.total_amount)),
    badge: delivery.has_variance ? "Price Variance" : undefined,
    badgeColor: delivery.has_variance ? ("warning" as const) : undefined,
    icon: "package",
  }));
});

// Computed: Recent deliveries for consolidated view (includes location)
const consolidatedDeliveriesItems = computed(() => {
  if (!consolidatedData.value?.recent_deliveries) return [];

  return consolidatedData.value.recent_deliveries.map((delivery) => ({
    id: delivery.id,
    primary: delivery.delivery_no,
    secondary: formatDate(delivery.delivery_date),
    tertiary: `${delivery.supplier.name} • ${delivery.location.code}`,
    amount: formatCurrency(delivery.total_amount),
    badge: delivery.has_variance ? "Price Variance" : undefined,
    badgeColor: delivery.has_variance ? ("warning" as const) : undefined,
    icon: "package",
  }));
});

// Computed: Recent issues activity items for single location
const recentIssuesItems = computed(() => {
  if (!dashboardData.value?.recent_issues) return [];

  return dashboardData.value.recent_issues.map((issue) => ({
    id: issue.id,
    primary: issue.issue_no,
    secondary: formatDate(issue.issue_date),
    tertiary: `Cost Centre: ${issue.cost_centre}`,
    amount: formatCurrency(Number(issue.total_value)),
    icon: "file-minus",
  }));
});

// Computed: Recent issues for consolidated view (includes location)
const consolidatedIssuesItems = computed(() => {
  if (!consolidatedData.value?.recent_issues) return [];

  return consolidatedData.value.recent_issues.map((issue) => ({
    id: issue.id,
    primary: issue.issue_no,
    secondary: formatDate(issue.issue_date),
    tertiary: `${issue.cost_centre} • ${issue.location.code}`,
    amount: formatCurrency(issue.total_value),
    icon: "file-minus",
  }));
});

// Location type icon mapping
const getLocationTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    KITCHEN: "chef-hat",
    STORE: "store",
    CENTRAL: "building-2",
    WAREHOUSE: "warehouse",
  };
  return icons[type] || "map-pin";
};

// Location type color mapping
const getLocationTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    KITCHEN: "text-amber-500 dark:text-amber-400",
    STORE: "text-emerald-500 dark:text-emerald-400",
    CENTRAL: "text-blue-500 dark:text-blue-400",
    WAREHOUSE: "text-zinc-500 dark:text-zinc-400",
  };
  return colors[type] || "text-zinc-500 dark:text-zinc-400";
};

// Quick actions
const quickActions = [
  {
    label: "Record Delivery",
    description: "Post new goods receipts",
    icon: "package-plus",
    color: "primary" as const,
    route: "/deliveries/create",
    gradient: "from-navy-500 to-navy-600",
  },
  {
    label: "Record Issue",
    description: "Issue stock to cost centres",
    icon: "file-minus",
    color: "secondary" as const,
    route: "/issues/create",
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    label: "View Stock",
    description: "Check current inventory",
    icon: "boxes",
    color: "success" as const,
    route: "/stock-now",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    label: "Enter POB",
    description: "Record persons on board",
    icon: "users",
    color: "warning" as const,
    route: "/pob",
    gradient: "from-amber-500 to-amber-600",
  },
];

const handleQuickAction = (route: string) => {
  router.push(route);
};

const handleRetry = () => {
  fetchDashboardData();
};

// Navigate to location detail from consolidated view
const navigateToLocation = (locationId: string) => {
  locationStore.switchLocation(locationId);
  viewMode.value = "location";
};
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header with View Toggle -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-layout-dashboard" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Dashboard</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            {{
              viewMode === "consolidated"
                ? "Consolidated overview across all locations"
                : "Overview of your current location's activity"
            }}
          </p>
        </div>
      </div>

      <!-- View Mode Toggle - Only for Supervisor/Admin -->
      <div v-if="canAccessConsolidated" class="flex items-center">
        <div class="flex items-center gap-1 p-1 bg-[var(--ui-bg-muted)] rounded-full">
          <button
            type="button"
            class="px-3 sm:px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap"
            :class="
              viewMode === 'location'
                ? 'bg-primary text-white shadow-sm'
                : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated)]'
            "
            @click="switchViewMode('location')"
          >
            <span class="flex items-center gap-1.5">
              <UIcon name="i-lucide-map-pin" class="w-4 h-4" />
              <span class="hidden sm:inline">Location</span>
            </span>
          </button>
          <button
            type="button"
            class="px-3 sm:px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap"
            :class="
              viewMode === 'consolidated'
                ? 'bg-primary text-white shadow-sm'
                : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated)]'
            "
            @click="switchViewMode('consolidated')"
          >
            <span class="flex items-center gap-1.5">
              <UIcon name="i-lucide-layers" class="w-4 h-4" />
              <span class="hidden sm:inline">All Locations</span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :title="error" @retry="handleRetry" />

    <!-- No Active Period Warning -->
    <UAlert
      v-else-if="!periodStore.hasPeriod"
      icon="i-lucide-alert-triangle"
      color="warning"
      variant="subtle"
      title="No Active Period"
      description="There is no currently open period. Some features may be limited."
    />

    <!-- Single Location Dashboard Content -->
    <template v-if="viewMode === 'location' && dashboardData && !loading">
      <!-- Metric Cards Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <DashboardMetricCard
          v-for="(card, index) in metricCards"
          :key="index"
          :label="card.label"
          :value="card.value"
          :icon="card.icon"
          :color="card.color"
        />
      </div>

      <!-- Recent Activity Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <DashboardRecentActivity
          title="Recent Deliveries"
          icon="package"
          :items="recentDeliveriesItems"
          item-route="/deliveries"
          empty-message="No recent deliveries"
          view-all-route="/deliveries"
        />
        <DashboardRecentActivity
          title="Recent Issues"
          icon="file-minus"
          :items="recentIssuesItems"
          item-route="/issues"
          empty-message="No recent issues"
          view-all-route="/issues"
        />
      </div>

      <!-- Quick Actions -->
      <UCard class="card-elevated" :ui="{ body: 'p-3' }">
        <div class="flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-zap" class="w-4 h-4 text-primary" />
          <h2 class="text-base font-semibold text-[var(--ui-text)]">Quick Actions</h2>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            v-for="action in quickActions"
            :key="action.route"
            class="group flex items-center gap-2 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] p-2.5 text-left smooth-transition hover:shadow-sm hover:border-[var(--ui-border-accented)] focus:outline-none focus-ring cursor-pointer"
            @click="handleQuickAction(action.route)"
          >
            <div
              class="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md bg-gradient-to-br"
              :class="action.gradient"
            >
              <UIcon :name="`i-lucide-${action.icon}`" class="w-4 h-4 text-white" />
            </div>
            <div class="min-w-0">
              <h3 class="text-sm font-medium text-[var(--ui-text-highlighted)] truncate">
                {{ action.label }}
              </h3>
              <p class="text-xs text-[var(--ui-text-muted)] truncate hidden sm:block">
                {{ action.description }}
              </p>
            </div>
          </button>
        </div>
      </UCard>
    </template>

    <!-- Consolidated Dashboard Content -->
    <template v-if="viewMode === 'consolidated' && consolidatedData && !loading">
      <!-- Global Metric Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <DashboardMetricCard
          v-for="(card, index) in consolidatedMetricCards"
          :key="index"
          :label="card.label"
          :value="card.value"
          :icon="card.icon"
          :color="card.color"
        />
      </div>

      <!-- Additional Consolidated Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <DashboardMetricCard
          v-for="(stat, index) in consolidatedStats"
          :key="index"
          :label="stat.label"
          :value="stat.value"
          :icon="stat.icon"
          :color="stat.color"
        />
      </div>

      <!-- Location Breakdown Table -->
      <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <div class="flex items-center gap-2 mb-4">
          <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary" />
          <h2 class="text-lg font-semibold text-[var(--ui-text)]">Location Breakdown</h2>
        </div>

        <!-- Mobile: Card Layout -->
        <div class="lg:hidden space-y-3">
          <div
            v-for="loc in consolidatedData.location_breakdown"
            :key="loc.location_id"
            class="p-4 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] cursor-pointer hover:border-[var(--ui-border-accented)] smooth-transition"
            @click="navigateToLocation(loc.location_id)"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <UIcon
                  :name="`i-lucide-${getLocationTypeIcon(loc.location_type)}`"
                  class="w-5 h-5"
                  :class="getLocationTypeColor(loc.location_type)"
                />
                <div>
                  <p class="font-semibold text-[var(--ui-text)]">{{ loc.location_name }}</p>
                  <p class="text-xs text-[var(--ui-text-muted)]">{{ loc.location_code }}</p>
                </div>
              </div>
              <UBadge color="neutral" variant="subtle" size="xs">
                {{ loc.location_type }}
              </UBadge>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div>
                <p class="text-xs text-[var(--ui-text-muted)]">Receipts</p>
                <p class="font-semibold text-sm text-[var(--ui-text)]">
                  {{ formatCurrency(loc.total_receipts) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-[var(--ui-text-muted)]">Issues</p>
                <p class="font-semibold text-sm text-[var(--ui-text)]">
                  {{ formatCurrency(loc.total_issues) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-[var(--ui-text-muted)]">Mandays</p>
                <p class="font-semibold text-sm text-[var(--ui-text)]">
                  {{ loc.total_mandays }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop: Table Layout -->
        <div class="hidden lg:block overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-[var(--ui-border)]">
                <th class="py-3 px-4 text-left text-sm font-medium text-[var(--ui-text-muted)]">
                  Location
                </th>
                <th class="py-3 px-4 text-left text-sm font-medium text-[var(--ui-text-muted)]">
                  Type
                </th>
                <th class="py-3 px-4 text-right text-sm font-medium text-[var(--ui-text-muted)]">
                  Total Receipts
                </th>
                <th class="py-3 px-4 text-right text-sm font-medium text-[var(--ui-text-muted)]">
                  Total Issues
                </th>
                <th class="py-3 px-4 text-right text-sm font-medium text-[var(--ui-text-muted)]">
                  Mandays
                </th>
                <th class="py-3 px-4 text-center text-sm font-medium text-[var(--ui-text-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="loc in consolidatedData.location_breakdown"
                :key="loc.location_id"
                class="border-b border-[var(--ui-border-muted)] hover:bg-[var(--ui-bg-hover)] smooth-transition"
              >
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <UIcon
                      :name="`i-lucide-${getLocationTypeIcon(loc.location_type)}`"
                      class="w-5 h-5"
                      :class="getLocationTypeColor(loc.location_type)"
                    />
                    <div>
                      <p class="font-medium text-[var(--ui-text)]">{{ loc.location_name }}</p>
                      <p class="text-xs text-[var(--ui-text-muted)]">{{ loc.location_code }}</p>
                    </div>
                  </div>
                </td>
                <td class="py-3 px-4">
                  <UBadge color="neutral" variant="subtle" size="xs">
                    {{ loc.location_type }}
                  </UBadge>
                </td>
                <td class="py-3 px-4 text-right font-medium text-[var(--ui-text)]">
                  {{ formatCurrency(loc.total_receipts) }}
                </td>
                <td class="py-3 px-4 text-right font-medium text-[var(--ui-text)]">
                  {{ formatCurrency(loc.total_issues) }}
                </td>
                <td class="py-3 px-4 text-right font-medium text-[var(--ui-text)]">
                  {{ loc.total_mandays }}
                </td>
                <td class="py-3 px-4 text-center">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    icon="i-lucide-external-link"
                    class="cursor-pointer"
                    @click="navigateToLocation(loc.location_id)"
                  >
                    View
                  </UButton>
                </td>
              </tr>
            </tbody>
            <!-- Totals Row -->
            <tfoot>
              <tr class="bg-[var(--ui-bg-muted)]">
                <td class="py-3 px-4 font-semibold text-[var(--ui-text)] whitespace-nowrap" colspan="2">
                  Total ({{ consolidatedData.location_breakdown.length }} locations)
                </td>
                <td class="py-3 px-4 text-right font-bold text-[var(--ui-text)]">
                  {{ formatCurrency(consolidatedData.global_totals.total_receipts) }}
                </td>
                <td class="py-3 px-4 text-right font-bold text-[var(--ui-text)]">
                  {{ formatCurrency(consolidatedData.global_totals.total_issues) }}
                </td>
                <td class="py-3 px-4 text-right font-bold text-[var(--ui-text)]">
                  {{ consolidatedData.global_totals.total_mandays }}
                </td>
                <td class="py-3 px-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </UCard>

      <!-- Recent Activity Across All Locations -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <DashboardRecentActivity
          title="Recent Deliveries (All Locations)"
          icon="package"
          :items="consolidatedDeliveriesItems"
          item-route="/deliveries"
          empty-message="No recent deliveries"
          view-all-route="/deliveries"
        />
        <DashboardRecentActivity
          title="Recent Issues (All Locations)"
          icon="file-minus"
          :items="consolidatedIssuesItems"
          item-route="/issues"
          empty-message="No recent issues"
          view-all-route="/issues"
        />
      </div>
    </template>
  </div>
</template>
