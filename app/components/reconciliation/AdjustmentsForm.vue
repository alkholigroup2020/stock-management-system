<script setup lang="ts">
/**
 * AdjustmentsForm Component
 *
 * Reusable form for entering reconciliation adjustments:
 * - Back-charges
 * - Credits Due
 * - Condemnations
 * - Other Adjustments
 *
 * Emits save event with adjustment values
 */

// Props
interface Props {
  backCharges?: number;
  credits?: number;
  condemnations?: number;
  adjustments?: number;
  readOnly?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  backCharges: 0,
  credits: 0,
  condemnations: 0,
  adjustments: 0,
  readOnly: false,
  loading: false,
});

// Emits
const emit = defineEmits<{
  save: [
    values: {
      back_charges: number;
      credits: number;
      condemnations: number;
      adjustments: number;
    },
  ];
}>();

// Local state for form values
const formValues = ref({
  back_charges: props.backCharges,
  credits: props.credits,
  condemnations: props.condemnations,
  adjustments: props.adjustments,
});

// Watch props to update form values when they change
watch(
  () => [props.backCharges, props.credits, props.condemnations, props.adjustments],
  ([newBackCharges, newCredits, newCondemnations, newAdjustments]) => {
    formValues.value = {
      back_charges: newBackCharges ?? 0,
      credits: newCredits ?? 0,
      condemnations: newCondemnations ?? 0,
      adjustments: newAdjustments ?? 0,
    };
  }
);

// Computed
const hasChanges = computed(() => {
  return (
    formValues.value.back_charges !== props.backCharges ||
    formValues.value.credits !== props.credits ||
    formValues.value.condemnations !== props.condemnations ||
    formValues.value.adjustments !== props.adjustments
  );
});

const isValid = computed(() => {
  return (
    formValues.value.back_charges >= 0 &&
    formValues.value.credits >= 0 &&
    formValues.value.condemnations >= 0 &&
    formValues.value.adjustments >= 0
  );
});

const totalAdjustments = computed(() => {
  return (
    formValues.value.back_charges +
    formValues.value.credits +
    formValues.value.condemnations +
    formValues.value.adjustments
  );
});

/**
 * Handle save button click
 */
function handleSave() {
  if (!isValid.value) {
    return;
  }

  emit("save", formValues.value);
}

/**
 * Format currency value
 */
function formatCurrency(value: number): string {
  return `SAR ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-[var(--ui-text)]">Adjustments</h3>
        <UBadge v-if="readOnly" color="warning" variant="soft">Read-only</UBadge>
      </div>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Back-charges -->
      <div>
        <label class="block text-sm font-medium text-[var(--ui-text)] mb-2">
          Back-charges
          <span class="text-[var(--ui-text-muted)] font-normal ml-1">(SAR)</span>
        </label>
        <UInput
          v-model.number="formValues.back_charges"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          :disabled="readOnly || loading"
        />
        <p class="text-xs text-[var(--ui-text-muted)] mt-1">Amounts charged back to suppliers</p>
      </div>

      <!-- Credits Due -->
      <div>
        <label class="block text-sm font-medium text-[var(--ui-text)] mb-2">
          Credits Due
          <span class="text-[var(--ui-text-muted)] font-normal ml-1">(SAR)</span>
        </label>
        <UInput
          v-model.number="formValues.credits"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          :disabled="readOnly || loading"
        />
        <p class="text-xs text-[var(--ui-text-muted)] mt-1">Credits expected from suppliers</p>
      </div>

      <!-- Condemnations -->
      <div>
        <label class="block text-sm font-medium text-[var(--ui-text)] mb-2">
          Condemnations
          <span class="text-[var(--ui-text-muted)] font-normal ml-1">(SAR)</span>
        </label>
        <UInput
          v-model.number="formValues.condemnations"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          :disabled="readOnly || loading"
        />
        <p class="text-xs text-[var(--ui-text-muted)] mt-1">Value of condemned/discarded stock</p>
      </div>

      <!-- Other Adjustments -->
      <div>
        <label class="block text-sm font-medium text-[var(--ui-text)] mb-2">
          Other Adjustments
          <span class="text-[var(--ui-text-muted)] font-normal ml-1">(SAR)</span>
        </label>
        <UInput
          v-model.number="formValues.adjustments"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          :disabled="readOnly || loading"
        />
        <p class="text-xs text-[var(--ui-text-muted)] mt-1">Miscellaneous adjustments</p>
      </div>
    </div>

    <!-- Total Adjustments Summary -->
    <div
      v-if="totalAdjustments > 0"
      class="mt-6 pt-6 border-t border-[var(--ui-border)] flex items-center justify-between"
    >
      <span class="text-sm font-medium text-[var(--ui-text)]">Total Adjustments:</span>
      <span class="text-lg font-semibold text-[var(--ui-primary)]">
        {{ formatCurrency(totalAdjustments) }}
      </span>
    </div>

    <!-- Action Buttons -->
    <div v-if="!readOnly" class="mt-6 flex justify-end gap-3">
      <UButton
        color="primary"
        :disabled="!isValid || !hasChanges || loading"
        :loading="loading"
        @click="handleSave"
      >
        Save Adjustments
      </UButton>
    </div>

    <!-- Validation Error -->
    <div v-if="!isValid" class="mt-4">
      <UAlert
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        title="Invalid Values"
        description="All adjustment values must be non-negative numbers"
      />
    </div>
  </UCard>
</template>
