<script setup lang="ts">
/**
 * Dashboard Page
 *
 * Main landing page for authenticated users showing key metrics,
 * recent activity, and quick actions for the active location.
 */

import type { Delivery } from "@prisma/client";
import type { Issue } from "@prisma/client";
import { formatCurrency, formatDate } from "~/utils/format";

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

// Composables
const locationStore = useLocationStore();
const periodStore = usePeriodStore();
const router = useRouter();
const appInit = useAppInit();

// Page metadata
definePageMeta({
  layout: "default",
});

useHead({
  title: "Dashboard - Stock Management",
});

// Reactive state
const loading = ref(true);
const error = ref<string | null>(null);
const dashboardData = ref<DashboardData | null>(null);

// Fetch dashboard data
const fetchDashboardData = async () => {
  // Don't fetch until app is initialized and location is available
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

// Watch for app initialization and location changes
// Using immediate: true means it will run as soon as the condition is met
watch(
  [() => appInit.isReady.value, () => locationStore.activeLocation?.id],
  ([isReady, locationId], [wasReady]) => {
    // Only fetch when app becomes ready or when location changes after ready
    if (isReady && (locationId || !wasReady)) {
      fetchDashboardData();
    }
  },
  { immediate: true }
);

// Computed: Metric cards data
const metricCards = computed(() => {
  if (!dashboardData.value?.totals) return [];

  const { totals } = dashboardData.value;

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
      label: "Days Left in Period",
      value: (totals.days_left || 0).toString(),
      icon: "calendar-days",
      color: "neutral" as const,
    },
  ];
});

// Computed: Recent deliveries activity items
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

// Computed: Recent issues activity items
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
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-layout-dashboard" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Dashboard</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Overview of your current location's activity
          </p>
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

    <!-- Dashboard Content -->
    <template v-if="dashboardData && !loading">
      <!-- Quick Actions -->
      <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <div class="flex items-center gap-2 mb-4">
          <UIcon name="i-lucide-zap" class="w-5 h-5 text-primary" />
          <h2 class="text-lg font-semibold text-[var(--ui-text)]">Quick Actions</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            v-for="action in quickActions"
            :key="action.route"
            class="group relative overflow-hidden rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] p-4 sm:p-6 text-left smooth-transition hover:shadow-md hover:border-[var(--ui-border-accented)] focus:outline-none focus-ring cursor-pointer"
            @click="handleQuickAction(action.route)"
          >
            <!-- Content -->
            <div class="relative z-10">
              <!-- Icon -->
              <div
                class="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg mb-3 sm:mb-4 bg-gradient-to-br smooth-transition"
                :class="action.gradient"
              >
                <UIcon :name="`i-lucide-${action.icon}`" class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>

              <!-- Text -->
              <h3
                class="text-base sm:text-lg font-semibold text-[var(--ui-text-highlighted)] mb-1"
              >
                {{ action.label }}
              </h3>
              <p class="text-xs sm:text-sm text-[var(--ui-text-muted)]">
                {{ action.description }}
              </p>
            </div>
          </button>
        </div>
      </UCard>

      <!-- Metric Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
        <!-- Recent Deliveries -->
        <DashboardRecentActivity
          title="Recent Deliveries"
          icon="package"
          :items="recentDeliveriesItems"
          item-route="/deliveries"
          empty-message="No recent deliveries"
          view-all-route="/deliveries"
        />

        <!-- Recent Issues -->
        <DashboardRecentActivity
          title="Recent Issues"
          icon="file-minus"
          :items="recentIssuesItems"
          item-route="/issues"
          empty-message="No recent issues"
          view-all-route="/issues"
        />
      </div>
    </template>
  </div>
</template>
