<script setup lang="ts">
import { usePeriodStore } from "~/stores/period";

const periodStore = usePeriodStore();

// Fetch current period on mount
onMounted(async () => {
  await periodStore.fetchCurrentPeriod();
});

// Compute badge color based on period status
const badgeColor = computed(() => {
  if (!periodStore.currentPeriod) return "neutral";

  switch (periodStore.currentPeriod.status) {
    case "OPEN":
      return "success";
    case "PENDING_CLOSE":
      return "warning";
    case "CLOSED":
      return "neutral";
    case "DRAFT":
      return "neutral";
    default:
      return "neutral";
  }
});

// Format status text
const statusText = computed(() => {
  if (!periodStore.currentPeriod) return "No Period";

  return periodStore.currentPeriod.status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
});
</script>

<template>
  <div class="flex items-center">
    <!-- Loading State -->
    <div v-if="periodStore.loading" class="flex items-center gap-2 px-3 py-2">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-muted" />
    </div>

    <!-- Period Info -->
    <div v-else-if="periodStore.currentPeriod" class="flex items-center gap-2">
      <!-- Desktop & Tablet: Show period name and status only -->
      <div class="hidden md:flex items-center gap-2">
        <UIcon name="i-heroicons-calendar" class="text-muted" />
        <span class="text-label font-medium">
          {{ periodStore.periodName }}
        </span>
        <UBadge :color="badgeColor" variant="soft" size="xs">
          {{ statusText }}
        </UBadge>
      </div>

      <!-- Mobile: Just show icon with tooltip -->
      <UTooltip :text="`${periodStore.periodName} - ${statusText}`" class="md:hidden">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-calendar"
          :aria-label="periodStore.periodName"
        />
      </UTooltip>
    </div>

    <!-- No Period State -->
    <div v-else class="flex items-center gap-2 px-3 py-2">
      <UIcon name="i-heroicons-exclamation-triangle" class="text-amber-500" />
      <span class="text-caption hidden md:inline">No active period</span>
    </div>
  </div>
</template>
