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
  badgeColor?: "primary" | "secondary" | "success" | "error" | "warning" | "neutral";
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
): "primary" | "secondary" | "success" | "error" | "warning" | "info" | "neutral" => {
  const colorMap: Record<
    string,
    "primary" | "secondary" | "success" | "error" | "warning" | "info" | "neutral"
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
  <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3 sm:mb-4">
      <div class="flex items-center gap-2">
        <UIcon v-if="icon" :name="`i-lucide-${icon}`" class="w-5 h-5 text-primary" />
        <h2 class="text-base sm:text-lg font-semibold text-[var(--ui-text)]">{{ title }}</h2>
      </div>
      <UButton
        v-if="viewAllRoute"
        variant="ghost"
        color="neutral"
        size="sm"
        class="cursor-pointer"
        @click="handleViewAll"
      >
        <span class="hidden sm:inline">{{ viewAllText }}</span>
        <UIcon name="i-lucide-arrow-right" class="w-4 h-4" :class="{ 'ml-1': viewAllText }" />
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8 sm:py-12">
      <UIcon
        name="i-lucide-loader-circle"
        class="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[var(--ui-text-muted)]"
      />
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="py-8 sm:py-12 text-center">
      <UIcon
        name="i-lucide-inbox"
        class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-[var(--ui-text-muted)]"
      />
      <p class="text-sm text-[var(--ui-text-muted)]">{{ emptyMessage }}</p>
    </div>

    <!-- Activity List -->
    <div v-else class="divide-y divide-[var(--ui-border-muted)]">
      <div
        v-for="item in items"
        :key="item.id"
        class="py-2 sm:py-3 cursor-pointer hover:bg-[var(--ui-bg-hover)] smooth-transition rounded-lg px-2 -mx-2"
        @click="handleItemClick(item)"
      >
        <div class="flex items-start justify-between gap-3 sm:gap-4">
          <!-- Left Side: Icon + Content -->
          <div class="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <!-- Icon -->
            <div v-if="item.icon" class="shrink-0 mt-0.5">
              <div class="p-1.5 sm:p-2 rounded-lg bg-[var(--ui-bg-muted)]">
                <UIcon
                  :name="`i-lucide-${item.icon}`"
                  class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--ui-text-muted)]"
                />
              </div>
            </div>

            <!-- Text Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5 sm:mb-1">
                <p class="text-sm sm:text-base font-medium text-[var(--ui-text)] truncate">
                  {{ item.primary }}
                </p>
                <UBadge
                  v-if="item.badge"
                  :color="getBadgeColor(item.badgeColor)"
                  variant="subtle"
                  size="xs"
                  class="shrink-0"
                >
                  {{ item.badge }}
                </UBadge>
              </div>
              <p class="text-xs sm:text-sm text-[var(--ui-text-muted)] mb-0.5">
                {{ item.secondary }}
              </p>
              <p v-if="item.tertiary" class="text-xs text-[var(--ui-text-muted)] truncate">
                {{ item.tertiary }}
              </p>
            </div>
          </div>

          <!-- Right Side: Amount -->
          <div v-if="item.amount" class="shrink-0 text-right">
            <p class="text-sm sm:text-base font-semibold text-[var(--ui-text)]">
              {{ item.amount }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
