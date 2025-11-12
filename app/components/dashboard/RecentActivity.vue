<script setup lang="ts">
/**
 * RecentActivity Component
 *
 * Displays a list of recent transactions (deliveries, issues, transfers, etc.)
 * Used on the dashboard to show recent activity.
 *
 * @example
 * <DashboardRecentActivity
 *   title="Recent Deliveries"
 *   :items="recentDeliveries"
 *   item-route="/deliveries"
 *   empty-message="No recent deliveries"
 * />
 */

interface ActivityItem {
  /** Unique identifier */
  id: string;
  /** Primary text (e.g., transaction number) */
  primary: string;
  /** Secondary text (e.g., date) */
  secondary: string;
  /** Tertiary text (e.g., supplier name, cost centre) */
  tertiary?: string;
  /** Amount to display */
  amount?: string;
  /** Optional badge label */
  badge?: string;
  /** Optional badge color */
  badgeColor?:
    | "primary"
    | "secondary"
    | "success"
    | "error"
    | "warning"
    | "neutral";
  /** Optional icon */
  icon?: string;
}

interface Props {
  /** Title for the section */
  title: string;
  /** Array of activity items */
  items: ActivityItem[];
  /** Base route for item links (item.id will be appended) */
  itemRoute: string;
  /** Icon for the section header */
  // eslint-disable-next-line vue/require-default-prop
  icon?: string;
  /** Message to display when no items */
  emptyMessage?: string;
  /** Whether the data is loading */
  loading?: boolean;
  /** View all link text */
  viewAllText?: string;
  /** View all route */
  // eslint-disable-next-line vue/require-default-prop
  viewAllRoute?: string;
}

const props = withDefaults(defineProps<Props>(), {
  emptyMessage: "No recent activity",
  loading: false,
  viewAllText: "View All",
});

const router = useRouter();

const handleItemClick = (item: ActivityItem) => {
  router.push(`${props.itemRoute}/${item.id}`);
};

const handleViewAll = () => {
  if (props.viewAllRoute) {
    router.push(props.viewAllRoute);
  }
};

// Map badge colors to Nuxt UI colors
const getBadgeColor = (
  color?: string
):
  | "primary"
  | "secondary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "neutral" => {
  const colorMap: Record<
    string,
    | "primary"
    | "secondary"
    | "success"
    | "error"
    | "warning"
    | "info"
    | "neutral"
  > = {
    primary: "primary",
    secondary: "secondary",
    success: "success",
    error: "error",
    warning: "warning",
    neutral: "neutral",
  };
  return colorMap[color || "neutral"] || "neutral";
};
</script>

<template>
  <UCard class="card-elevated">
    <!-- Header -->
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon
            v-if="icon"
            :name="`i-lucide-${icon}`"
            class="w-5 h-5 text-muted"
          />
          <h3 class="text-lg font-semibold text-default">{{ title }}</h3>
        </div>
        <UButton
          v-if="viewAllRoute"
          variant="ghost"
          color="neutral"
          size="sm"
          @click="handleViewAll"
        >
          {{ viewAllText }}
          <UIcon name="i-lucide-arrow-right" class="w-4 h-4 ml-1" />
        </UButton>
      </div>
    </template>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <UIcon
        name="i-lucide-loader-circle"
        class="w-8 h-8 animate-spin text-muted"
      />
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="py-8 text-center">
      <UIcon name="i-lucide-inbox" class="w-12 h-12 mx-auto mb-3 text-muted" />
      <p class="text-sm text-muted">{{ emptyMessage }}</p>
    </div>

    <!-- Activity List -->
    <div v-else class="divide-y divide-default">
      <div
        v-for="item in items"
        :key="item.id"
        class="py-3 cursor-pointer hover:bg-elevated transition-colors rounded-lg px-2 -mx-2"
        @click="handleItemClick(item)"
      >
        <div class="flex items-start justify-between gap-4">
          <!-- Left Side: Icon + Content -->
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <!-- Icon -->
            <div v-if="item.icon" class="shrink-0 mt-0.5">
              <div class="p-2 rounded-lg bg-default">
                <UIcon
                  :name="`i-lucide-${item.icon}`"
                  class="w-4 h-4 text-muted"
                />
              </div>
            </div>

            <!-- Text Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <p class="text-sm font-medium text-default truncate">
                  {{ item.primary }}
                </p>
                <UBadge
                  v-if="item.badge"
                  :color="getBadgeColor(item.badgeColor)"
                  variant="subtle"
                  size="xs"
                >
                  {{ item.badge }}
                </UBadge>
              </div>
              <p class="text-xs text-muted mb-0.5">
                {{ item.secondary }}
              </p>
              <p v-if="item.tertiary" class="text-xs text-muted truncate">
                {{ item.tertiary }}
              </p>
            </div>
          </div>

          <!-- Right Side: Amount -->
          <div v-if="item.amount" class="shrink-0 text-right">
            <p class="text-sm font-semibold text-default">
              {{ item.amount }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
