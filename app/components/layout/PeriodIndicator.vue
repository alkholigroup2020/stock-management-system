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
      <!-- Desktop: Show full info -->
      <div class="hidden lg:flex items-center gap-2">
        <UIcon name="i-heroicons-calendar" class="text-muted" />
        <div class="flex flex-col">
          <span class="text-sm font-medium text-default">
            {{ periodStore.periodName }}
          </span>
          <span class="text-xs text-muted">
            {{ periodStore.periodDateRange }}
          </span>
        </div>
        <UBadge :color="badgeColor" variant="soft" size="xs">
          {{ statusText }}
        </UBadge>
      </div>

      <!-- Tablet: Show period name and status -->
      <div class="hidden md:flex lg:hidden items-center gap-2">
        <UIcon name="i-heroicons-calendar" class="text-muted" />
        <span class="text-sm font-medium text-default">
          {{ periodStore.periodName }}
        </span>
        <UBadge :color="badgeColor" variant="soft" size="xs">
          {{ statusText }}
        </UBadge>
      </div>

      <!-- Mobile: Just show icon with tooltip -->
      <UTooltip
        :text="`${periodStore.periodName} - ${statusText}`"
        class="md:hidden"
      >
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
      <span class="text-sm text-muted hidden md:inline">No active period</span>
    </div>
  </div>
</template>
