<template>
  <div class="card-elevated p-4 space-y-4">
    <!-- Title Skeleton -->
    <div v-if="showTitle" class="space-y-2">
      <USkeleton class="h-6 w-48" />
      <USkeleton v-if="showSubtitle" class="h-4 w-64" />
    </div>

    <!-- Content Lines Skeleton -->
    <div class="space-y-3">
      <div v-for="line in lines" :key="line" class="space-y-2">
        <USkeleton :class="['h-4', getLineWidth(line)]" />
      </div>
    </div>

    <!-- Action Skeleton -->
    <div v-if="showAction" class="flex gap-2 pt-2">
      <USkeleton class="h-10 w-24" />
      <USkeleton class="h-10 w-24" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * CardSkeleton Component
 * Displays a skeleton loading state for card content
 *
 * Usage:
 * <CardSkeleton :lines="4" :show-title="true" :show-action="true" />
 */

interface Props {
  /** Number of content lines to display */
  lines?: number;
  /** Show title skeleton */
  showTitle?: boolean;
  /** Show subtitle skeleton */
  showSubtitle?: boolean;
  /** Show action buttons skeleton */
  showAction?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  lines: 3,
  showTitle: true,
  showSubtitle: false,
  showAction: false,
});

// Generate line widths for variation
function getLineWidth(index: number): string {
  const widths = ["w-full", "w-5/6", "w-4/5", "w-full", "w-3/4", "w-5/6"];
  return widths[index % widths.length] || "w-full";
}
</script>
