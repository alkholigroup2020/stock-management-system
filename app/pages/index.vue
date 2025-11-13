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
  if (!dashboardData.value) return [];

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
    icon: "package-plus",
    color: "primary" as const,
    route: "/deliveries/create",
  },
  {
    label: "Record Issue",
    icon: "file-minus",
    color: "primary" as const,
    route: "/issues/create",
  },
  {
    label: "View Stock",
    icon: "boxes",
    color: "primary" as const,
    route: "/stock-now",
  },
  {
    label: "Enter POB",
    icon: "users",
    color: "primary" as const,
    route: "/pob",
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
  <div class="p-6 space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-3xl font-bold text-default mb-2">Dashboard</h1>
      <div
        v-if="dashboardData?.location"
        class="flex items-center gap-2 text-sm text-muted"
      >
        <UIcon name="i-lucide-map-pin" class="w-4 h-4" />
        <span>{{ dashboardData.location.name }}</span>
        <span v-if="dashboardData.period" class="ml-2">
          • Period: {{ dashboardData.period.name }}
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <CommonLoadingSpinner size="lg" />
    </div>

    <!-- Error State -->
    <CommonErrorAlert v-else-if="error" :title="error" @retry="handleRetry" />

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
      <UCard class="card-elevated">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-zap" class="w-5 h-5 text-muted" />
            <h2 class="text-lg font-semibold text-default">Quick Actions</h2>
          </div>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <UButton
            v-for="action in quickActions"
            :key="action.route"
            :color="action.color"
            variant="soft"
            size="lg"
            block
            @click="handleQuickAction(action.route)"
          >
            <UIcon :name="`i-lucide-${action.icon}`" class="w-5 h-5 mr-2" />
            {{ action.label }}
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>
