<script setup lang="ts">
import testingPlanData from "~/data/testing-plan.json";
import type { TestingPlanData } from "~/composables/useTestingPlanProgress";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { getOverallProgress } = useTestingPlanProgress();

// Type assertion for JSON import
const planData = testingPlanData as TestingPlanData;

const progress = computed(() => getOverallProgress(planData.phases));

const handleOpenChange = (value: boolean) => {
  if (!value) {
    emit("close");
  }
};
</script>

<template>
  <UModal
    :open="open"
    :ui="{
      content: 'sm:max-w-full sm:h-full sm:m-0 sm:rounded-none',
    }"
    @update:open="handleOpenChange"
  >
    <template #content>
      <div class="flex flex-col h-full bg-[var(--ui-bg)]">
        <!-- Header -->
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
              aria-label="Close"
              @click="emit('close')"
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

        <!-- Footer -->
        <div
          class="flex-shrink-0 border-t border-[var(--ui-border)] px-4 py-2 bg-[var(--ui-bg-elevated)]"
        >
          <p class="text-xs text-[var(--ui-text-muted)] text-center">
            v{{ planData.version }} &middot; Last updated: {{ planData.lastUpdated }}
          </p>
        </div>
      </div>
    </template>
  </UModal>
</template>
