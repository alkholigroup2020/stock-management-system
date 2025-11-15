<script setup lang="ts">
/**
 * MetricCard Component
 *
 * Displays a metric card with an icon, label, and value.
 * Used throughout the dashboard to show key performance indicators.
 *
 * @example
 * <DashboardMetricCard
 *   label="Total Receipts"
 *   value="SAR 125,430.50"
 *   icon="package-check"
 *   color="primary"
 * />
 */

interface Props {
  /** Label for the metric */
  label: string;
  /** Value to display (can be string or number) */
  value: string | number;
  /** Optional icon name from lucide icons */
  icon?: string;
  /** Color variant */
  color?: "primary" | "secondary" | "success" | "error" | "neutral";
  /** Whether the card is loading */
  loading?: boolean;
  /** Optional trend indicator (up/down percentage) */
  trend?: {
    value: number;
    direction: "up" | "down";
  };
}

const props = withDefaults(defineProps<Props>(), {
  color: "primary",
  loading: false,
});

// Map color variants to Tailwind classes
const colorClasses = computed(() => {
  const classes = {
    primary: "bg-navy-50 dark:bg-navy-900/20 text-navy-600 dark:text-navy-400",
    secondary:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    success:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    error: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
    neutral: "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  };
  return classes[props.color];
});

const trendColorClass = computed(() => {
  if (!props.trend) return "";
  return props.trend.direction === "up"
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";
});

const trendIcon = computed(() => {
  if (!props.trend) return "";
  return props.trend.direction === "up" ? "trending-up" : "trending-down";
});
</script>

<template>
  <UCard class="card-elevated">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center h-32">
      <UIcon
        name="i-lucide-loader-circle"
        class="w-8 h-8 animate-spin text-muted"
      />
    </div>

    <!-- Content -->
    <div v-else class="flex items-start gap-4">
      <!-- Icon -->
      <div v-if="icon" class="shrink-0 p-3 rounded-lg" :class="colorClasses">
        <UIcon :name="`i-lucide-${icon}`" class="w-6 h-6" />
      </div>

      <!-- Text Content -->
      <div class="flex-1 min-w-0">
        <p class="text-label mb-1">
          {{ label }}
        </p>
        <p class="text-heading font-bold mb-2">
          {{ value }}
        </p>

        <!-- Trend Indicator -->
        <div
          v-if="trend"
          class="flex items-center gap-1 text-body"
          :class="trendColorClass"
        >
          <UIcon :name="`i-lucide-${trendIcon}`" class="w-4 h-4" />
          <span>{{ Math.abs(trend.value) }}%</span>
        </div>
      </div>
    </div>

    <!-- Optional Default Slot for Additional Content -->
    <slot />
  </UCard>
</template>
