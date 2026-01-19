<script setup lang="ts">
/**
 * PRFStatusBadge Component
 *
 * Displays a status badge for PRF (Purchase Requisition Form) status
 * with appropriate semantic colors following the project's design system.
 *
 * @component
 */

import type { PRFStatus } from "~~/shared/types/database";

// Props
interface PRFStatusBadgeProps {
  status: PRFStatus;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "soft" | "outline" | "subtle";
}

const props = withDefaults(defineProps<PRFStatusBadgeProps>(), {
  size: "md",
  variant: "soft",
});

// Computed
const statusColor = computed(() => {
  const colorMap: Record<PRFStatus, "neutral" | "primary" | "success" | "error" | "info"> = {
    DRAFT: "neutral",
    PENDING: "primary",
    APPROVED: "success",
    REJECTED: "error",
    CLOSED: "info",
  };
  return colorMap[props.status] || "neutral";
});

const statusLabel = computed(() => {
  const labelMap: Record<PRFStatus, string> = {
    DRAFT: "Draft",
    PENDING: "Pending Approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CLOSED: "Closed",
  };
  return labelMap[props.status] || props.status;
});

const statusIcon = computed(() => {
  const iconMap: Record<PRFStatus, string> = {
    DRAFT: "i-lucide-file-edit",
    PENDING: "i-lucide-clock",
    APPROVED: "i-lucide-check-circle",
    REJECTED: "i-lucide-x-circle",
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
