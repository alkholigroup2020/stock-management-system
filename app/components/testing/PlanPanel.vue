<script setup lang="ts">
import testingPlanData from "~/data/testing-plan.json";
import type { TestingPlanData } from "~/composables/useTestingPlanProgress";

defineEmits<{
  close: [];
}>();

const { getOverallProgress } = useTestingPlanProgress();

// Type assertion for JSON import
const planData = testingPlanData as TestingPlanData;

const progress = computed(() => getOverallProgress(planData.phases));
</script>

<template>
  <aside
    class="fixed right-0 top-0 h-screen w-[400px] border-l border-[var(--ui-border)] bg-[var(--ui-bg)] z-40 flex flex-col shadow-lg"
  >
    <!-- Header with Progress Bar -->
    <div class="flex-shrink-0 border-b border-[var(--ui-border)] p-4 bg-[var(--ui-bg-elevated)]">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-heroicons-clipboard-document-check"
            class="text-[var(--ui-primary)] text-xl"
          />
          <h2 class="font-semibold text-[var(--ui-text-highlighted)]">Testing Plan</h2>
        </div>
        <UButton
          icon="i-heroicons-x-mark"
          color="neutral"
          variant="ghost"
          size="sm"
          class="cursor-pointer"
          aria-label="Close testing plan"
          @click="$emit('close')"
        />
      </div>

      <!-- Progress Bar -->
      <div class="space-y-1.5">
        <div class="flex justify-between text-xs text-[var(--ui-text-muted)]">
          <span>{{ progress.completed }} / {{ progress.total }} completed</span>
          <span class="font-medium">{{ progress.percentage }}%</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-[var(--ui-bg-accented)]">
          <div
            class="h-full bg-[var(--ui-primary)] transition-all duration-300 ease-out"
            :style="{ width: `${progress.percentage}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Content (scrollable) -->
    <div class="flex-1 overflow-y-auto p-4">
      <TestingPlanContent />
    </div>

  </aside>
</template>
