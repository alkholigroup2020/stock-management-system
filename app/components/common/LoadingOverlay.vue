<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
  >
    <div class="rounded-lg bg-elevated p-6 shadow-xl">
      <!-- Progress Bar (if step-based) -->
      <div v-if="totalSteps && totalSteps > 1" class="mb-4 w-80">
        <div class="mb-2 flex justify-between text-caption">
          <span>Step {{ currentStep }} of {{ totalSteps }}</span>
          <span>{{ progressPercentage }}%</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            class="h-full bg-primary transition-all duration-300 ease-in-out"
            :style="{ width: `${progressPercentage}%` }"
          />
        </div>
      </div>

      <!-- Loading Content -->
      <div class="flex items-center gap-4">
        <UIcon
          name="i-heroicons-arrow-path"
          class="h-8 w-8 animate-spin text-primary"
        />
        <div>
          <p class="text-body font-semibold">{{ title }}</p>
          <p v-if="message" class="text-caption">{{ message }}</p>
        </div>
      </div>

      <!-- Current Step Description -->
      <p v-if="stepDescription" class="mt-4 text-caption">
        {{ stepDescription }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * LoadingOverlay Component
 * Displays a full-screen loading overlay with optional progress tracking
 *
 * Usage:
 * <CommonLoadingOverlay
 *   title="Processing..."
 *   message="Please wait"
 *   :current-step="2"
 *   :total-steps="5"
 *   step-description="Validating data..."
 * />
 */

interface Props {
  /** Title text */
  title: string;
  /** Optional message text */
  message?: string;
  /** Current step number (for multi-step processes) */
  currentStep?: number;
  /** Total number of steps */
  totalSteps?: number;
  /** Description of current step */
  stepDescription?: string;
}

const props = withDefaults(defineProps<Props>(), {
  message: "",
  currentStep: 0,
  totalSteps: 0,
  stepDescription: "",
});

// Computed progress percentage
const progressPercentage = computed(() => {
  if (!props.totalSteps || props.totalSteps === 0) return 0;
  return Math.round((props.currentStep / props.totalSteps) * 100);
});
</script>
