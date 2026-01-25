<template>
  <UBadge :color="statusColor" variant="subtle" size="md" class="inline-flex items-center gap-1">
    <UIcon :name="statusIcon" class="h-3 w-3" />
    {{ statusLabel }}
  </UBadge>
</template>

<script setup lang="ts">
type BadgeColor = "error" | "info" | "success" | "primary" | "secondary" | "warning" | "neutral";

interface Props {
  status: "DRAFT" | "POSTED";
  pendingApproval?: boolean;
  approved?: boolean;
  rejected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  pendingApproval: false,
  approved: false,
  rejected: false,
});

type DisplayStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "POSTED";

const displayStatus = computed<DisplayStatus>(() => {
  if (props.status === "POSTED") return "POSTED";
  if (props.rejected) return "REJECTED";
  if (props.approved) return "APPROVED";
  if (props.pendingApproval) return "PENDING_APPROVAL";
  return "DRAFT";
});

const statusColor = computed<BadgeColor>(() => {
  const colorMap: Record<DisplayStatus, BadgeColor> = {
    DRAFT: "neutral",
    PENDING_APPROVAL: "warning",
    APPROVED: "success",
    REJECTED: "error",
    POSTED: "success",
  };
  return colorMap[displayStatus.value];
});

const statusLabel = computed(() => {
  const labelMap: Record<DisplayStatus, string> = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending Approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    POSTED: "Posted",
  };
  return labelMap[displayStatus.value];
});

const statusIcon = computed(() => {
  const iconMap: Record<DisplayStatus, string> = {
    DRAFT: "i-lucide-file-edit",
    PENDING_APPROVAL: "i-lucide-clock",
    APPROVED: "i-lucide-check",
    REJECTED: "i-lucide-x-circle",
    POSTED: "i-lucide-check-circle",
  };
  return iconMap[displayStatus.value];
});
</script>
