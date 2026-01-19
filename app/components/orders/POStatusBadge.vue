<script setup lang="ts">
/**
 * POStatusBadge Component
 *
 * Displays a status badge for PO (Purchase Order) status
 * with appropriate semantic colors following the project's design system.
 *
 * @component
 */

import type { POStatus } from "~~/shared/types/database";

// Props
interface POStatusBadgeProps {
  status: POStatus;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "soft" | "outline" | "subtle";
}

const props = withDefaults(defineProps<POStatusBadgeProps>(), {
  size: "md",
  variant: "soft",
});

// Computed
const statusColor = computed(() => {
  const colorMap: Record<POStatus, "success" | "info"> = {
    OPEN: "success",
    CLOSED: "info",
  };
  return colorMap[props.status] || "neutral";
});

const statusLabel = computed(() => {
  const labelMap: Record<POStatus, string> = {
    OPEN: "Open",
    CLOSED: "Closed",
  };
  return labelMap[props.status] || props.status;
});

const statusIcon = computed(() => {
  const iconMap: Record<POStatus, string> = {
    OPEN: "i-lucide-circle-dot",
    CLOSED: "i-lucide-lock",
  };
  return iconMap[props.status];
});
</script>

<template>
  <UBadge :color="statusColor" :variant="variant" :size="size">
    <div class="flex items-center gap-1.5">
      <UIcon v-if="statusIcon" :name="statusIcon" class="h-3.5 w-3.5" />
      <span>{{ statusLabel }}</span>
    </div>
  </UBadge>
</template>
