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
const router = useRouter();

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
  } catch (err: any) {
    console.error("Failed to fetch dashboard data:", err);
    error.value = err?.data?.message || "Failed to load dashboard data";
  } finally {
    loading.value = false;
  }
};

// Fetch data on mount
onMounted(() => {
  fetchDashboardData();
});

// Watch for location changes
watch(
  () => locationStore.activeLocation?.id,
  () => {
    fetchDashboardData();
  }
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
  <div class="space-y-6">
    <!-- Page Header -->
    <LayoutPageHeader
      title="Dashboard"
      icon="i-lucide-layout-dashboard"
      :show-location="true"
      :show-period="true"
      location-scope="current"
    />

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :title="error" @retry="handleRetry" />

    <!-- No Active Period Warning -->
    <UAlert
      v-else-if="!dashboardData?.period"
      icon="i-lucide-alert-triangle"
      color="warning"
      variant="subtle"
      title="No Active Period"
      description="There is no currently open period. Some features may be limited."
    />

    <!-- Dashboard Content -->
    <div v-if="dashboardData && !loading">
      <!-- Metric Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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

      <!-- Quick Actions -->
      <div>
        <div class="flex items-center gap-2 mb-4">
          <UIcon name="i-lucide-zap" class="w-5 h-5 text-muted" />
          <h2 class="text-subheading">Quick Actions</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            v-for="action in quickActions"
            :key="action.route"
            @click="handleQuickAction(action.route)"
            class="group relative overflow-hidden rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] p-6 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-ring)] focus-visible:ring-offset-2"
          >
            <!-- Gradient Background on Hover -->
            <div
              class="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300"
              :class="action.gradient"
            ></div>

            <!-- Content -->
            <div class="relative z-10">
              <!-- Icon -->
              <div
                class="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 bg-gradient-to-br transition-transform duration-300 group-hover:scale-110"
                :class="action.gradient"
              >
                <UIcon :name="`i-lucide-${action.icon}`" class="w-6 h-6 text-white" />
              </div>

              <!-- Text -->
              <h3
                class="text-lg font-semibold text-[var(--ui-text-highlighted)] mb-1 transition-colors duration-300 group-hover:text-[var(--ui-primary)]"
              >
                {{ action.label }}
              </h3>
              <p class="text-sm text-[var(--ui-text-muted)]">
                {{ action.description }}
              </p>

              <!-- Arrow Icon -->
              <div
                class="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0"
              >
                <UIcon name="i-lucide-arrow-right" class="w-5 h-5 text-[var(--ui-primary)]" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
