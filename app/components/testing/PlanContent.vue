<script setup lang="ts">
import testingPlanData from "~/data/testing-plan.json";
import type { TestingPlanData } from "~/composables/useTestingPlanProgress";

const { resetProgress } = useTestingPlanProgress();
const toast = useToast();

// Type assertion for JSON import
const planData = testingPlanData as TestingPlanData;

// Accordion state - single open section at a time
const expandedPhase = ref<string | null>(null);

const togglePhase = (phaseId: string) => {
  expandedPhase.value = expandedPhase.value === phaseId ? null : phaseId;
};

// Reset confirmation modal state
const showResetModal = ref(false);
const isResetting = ref(false);

// Open reset confirmation modal
const openResetModal = () => {
  showResetModal.value = true;
};

// Handle the actual reset
const handleReset = async () => {
  isResetting.value = true;

  try {
    // Call API to reset database
    const response = await $fetch("/api/testing/reset-database", {
      method: "POST",
    });

    // Reset localStorage progress
    resetProgress();

    // Show success toast
    toast.add({
      title: "Database Reset Complete",
      description: `Only Admin account remains. Email: ${response.admin.email}`,
      color: "success",
      icon: "i-heroicons-check-circle",
    });

    // Close modal
    showResetModal.value = false;
  } catch (error) {
    console.error("Reset failed:", error);
    toast.add({
      title: "Reset Failed",
      description: "An error occurred while resetting the database. Please try again.",
      color: "error",
      icon: "i-heroicons-exclamation-triangle",
    });
  } finally {
    isResetting.value = false;
  }
};
</script>

<template>
  <div class="space-y-3">
    <!-- Description -->
    <p class="text-xs text-[var(--ui-text-muted)] pb-2">
      {{ planData.description }}
    </p>

    <!-- Phase Accordions -->
    <TestingPlanPhase
      v-for="phase in planData.phases"
      :key="phase.id"
      :phase="phase"
      :expanded="expandedPhase === phase.id"
      @toggle="togglePhase(phase.id)"
    />

    <!-- Reset Button -->
    <div class="pt-4 border-t border-[var(--ui-border)]">
      <UButton
        icon="i-heroicons-arrow-path"
        color="error"
        variant="soft"
        size="sm"
        class="cursor-pointer w-full"
        @click="openResetModal"
      >
        Reset All Progress
      </UButton>
    </div>

    <!-- Reset Confirmation Modal -->
    <UModal v-model:open="showResetModal">
      <template #content>
        <div class="p-6 space-y-4">
          <!-- Header -->
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="w-5 h-5 text-red-600 dark:text-red-400"
              />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                Reset Database & Progress
              </h3>
              <p class="text-sm text-[var(--ui-text-muted)]">
                This action cannot be undone
              </p>
            </div>
          </div>

          <!-- Warning Content -->
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
            <p class="text-sm text-red-800 dark:text-red-200 font-medium">
              This will perform the following actions:
            </p>
            <ul class="text-sm text-red-700 dark:text-red-300 space-y-1.5 ml-4 list-disc">
              <li>Delete ALL data from the database</li>
              <li>Remove all locations, items, suppliers, and transactions</li>
              <li>Delete all users except the Admin account</li>
              <li>Reset Admin password to default (Admin@123)</li>
              <li>Clear all testing plan checkbox progress</li>
            </ul>
          </div>

          <!-- Info -->
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              <span class="font-medium">After reset:</span> You'll need to log in again with
              <span class="font-mono bg-blue-100 dark:bg-blue-800 px-1 rounded">admin@foodstock.local</span>
              and password
              <span class="font-mono bg-blue-100 dark:bg-blue-800 px-1 rounded">Admin@123</span>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-2">
            <UButton
              color="neutral"
              variant="outline"
              class="cursor-pointer"
              :disabled="isResetting"
              @click="showResetModal = false"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              class="cursor-pointer"
              :loading="isResetting"
              @click="handleReset"
            >
              Yes, Reset Everything
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
