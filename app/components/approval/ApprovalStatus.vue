<script setup lang="ts">
/**
 * ApprovalStatus Component
 *
 * Displays an approval status badge with appropriate semantic colors
 * following the project's design system.
 *
 * @component
 */

// Props
interface ApprovalStatusProps {
  status: "PENDING" | "APPROVED" | "REJECTED";
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "soft" | "outline" | "subtle";
  showIcon?: boolean;
}

const props = withDefaults(defineProps<ApprovalStatusProps>(), {
  size: "md",
  variant: "soft",
  showIcon: true,
});

// Computed
const statusColor = computed(() => {
  const colorMap = {
    PENDING: "primary" as const,
    APPROVED: "success" as const,
    REJECTED: "error" as const,
  };
  return colorMap[props.status] || "neutral";
});

const statusLabel = computed(() => {
  const labelMap = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };
  return labelMap[props.status] || props.status;
});

const statusIcon = computed(() => {
  const iconMap = {
    PENDING: "i-lucide-clock",
    APPROVED: "i-lucide-check-circle",
    REJECTED: "i-lucide-x-circle",
  };
  return iconMap[props.status];
});
</script>

<template>
  <UBadge :color="statusColor" :variant="variant" :size="size">
    <div class="flex items-center gap-1.5">
      <UIcon v-if="showIcon && statusIcon" :name="statusIcon" class="h-3.5 w-3.5" />
      <span>{{ statusLabel }}</span>
    </div>
  </UBadge>
</template>
