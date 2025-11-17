<script setup lang="ts">
/**
 * TransferStatusBadge Component
 *
 * Displays a status badge for transfer status with appropriate semantic colors
 * following the project's design system.
 *
 * @component
 */

// Props
interface TransferStatusBadgeProps {
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "COMPLETED";
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "soft" | "outline" | "subtle";
}

const props = withDefaults(defineProps<TransferStatusBadgeProps>(), {
  size: "md",
  variant: "soft",
});

// Computed
const statusColor = computed(() => {
  const colorMap = {
    DRAFT: "neutral" as const,
    PENDING_APPROVAL: "primary" as const,
    APPROVED: "success" as const,
    REJECTED: "error" as const,
    COMPLETED: "success" as const,
  };
  return colorMap[props.status] || "neutral";
});

const statusLabel = computed(() => {
  const labelMap = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending Approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    COMPLETED: "Completed",
  };
  return labelMap[props.status] || props.status;
});

const statusIcon = computed(() => {
  const iconMap = {
    DRAFT: "i-lucide-file-edit",
    PENDING_APPROVAL: "i-lucide-clock",
    APPROVED: "i-lucide-check-circle",
    REJECTED: "i-lucide-x-circle",
    COMPLETED: "i-lucide-check-circle-2",
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
