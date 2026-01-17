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
interface PendingNCRItem {
  id: string;
  ncr_no: string;
  value: number;
  reason: string;
}

interface PendingNCRsData {
  total: number;
  count: number;
  ncrs: PendingNCRItem[];
}

interface Props {
  backCharges?: number;
  credits?: number;
  ncrCredits?: number;
  ncrLosses?: number;
  pendingNCRs?: PendingNCRsData | null;
  condemnations?: number;
  adjustments?: number;
  readOnly?: boolean;
  loading?: boolean;
  isAutoCalculated?: boolean; // When true, shows "Confirm" button even without changes
}

const props = withDefaults(defineProps<Props>(), {
  backCharges: 0,
  credits: 0,
  ncrCredits: 0,
  ncrLosses: 0,
  pendingNCRs: null,
  condemnations: 0,
  adjustments: 0,
  readOnly: false,
  loading: false,
  isAutoCalculated: false,
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

// Can save if: valid AND (has changes OR is auto-calculated and needs confirmation)
const canSave = computed(() => {
  return isValid.value && (hasChanges.value || props.isAutoCalculated);
});

// Button text changes based on state
const saveButtonText = computed(() => {
  if (hasChanges.value) {
    return "Save Adjustments";
  }
  if (props.isAutoCalculated) {
    return "Confirm Reconciliation";
  }
  return "Save Adjustments";
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

/**
 * Pending NCRs expansion state
 */
const pendingNCRsExpanded = ref(false);

/**
 * Navigate to NCR detail page
 */
function goToNCR(ncrId: string) {
  navigateTo(`/ncrs/${ncrId}`);
}
</script>

<template>
  <UCard class="card-elevated">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-[var(--ui-text)]">Adjustments</h3>
        <UBadge v-if="readOnly" color="warning" variant="soft">Read-only</UBadge>
      </div>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
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
          class="w-full"
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
          class="w-full"
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
          class="w-full"
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
          class="w-full"
        />
        <p class="text-xs text-[var(--ui-text-muted)] mt-1">Miscellaneous adjustments</p>
      </div>
    </div>

    <!-- Pending Credits Section (Informational) -->
    <div
      v-if="pendingNCRs && pendingNCRs.count > 0"
      class="mt-6 pt-6 border-t border-[var(--ui-border)]"
    >
      <div class="flex items-center gap-2 mb-4">
        <h4 class="text-sm font-semibold text-[var(--ui-text)]">Pending Credits</h4>
        <UBadge color="warning" variant="soft" size="xs">Informational</UBadge>
      </div>

      <UAlert icon="i-lucide-clock" color="warning" variant="soft" class="mb-4">
        <template #description>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm">
                <strong>{{ pendingNCRs.count }}</strong>
                NCR(s) sent to suppliers
              </span>
              <span class="text-sm font-semibold">{{ formatCurrency(pendingNCRs.total) }}</span>
            </div>
            <p class="text-xs text-[var(--ui-text-muted)]">
              Awaiting supplier response. These values do not affect current reconciliation
              calculations.
            </p>

            <!-- Expandable NCR List -->
            <div v-if="pendingNCRs.ncrs.length > 0" class="mt-3">
              <button
                @click="pendingNCRsExpanded = !pendingNCRsExpanded"
                class="flex items-center gap-1 text-xs font-medium text-[var(--ui-text)] hover:text-[var(--ui-primary)] transition-colors cursor-pointer"
                :aria-expanded="pendingNCRsExpanded"
                aria-controls="pending-ncrs-list"
              >
                <UIcon
                  :name="pendingNCRsExpanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                  class="h-3 w-3"
                />
                {{ pendingNCRsExpanded ? "Hide" : "Show" }} NCR Details
              </button>

              <div
                v-if="pendingNCRsExpanded"
                id="pending-ncrs-list"
                class="mt-2 space-y-1.5 max-h-48 overflow-y-auto"
              >
                <div
                  v-for="ncr in pendingNCRs.ncrs"
                  :key="ncr.id"
                  class="flex items-start justify-between gap-2 p-2 rounded bg-[var(--ui-bg-muted)] hover:bg-[var(--ui-bg-elevated)] transition-colors"
                >
                  <div class="flex-1 min-w-0">
                    <button
                      @click="goToNCR(ncr.id)"
                      class="text-xs font-medium text-primary hover:underline cursor-pointer"
                    >
                      {{ ncr.ncr_no }}
                    </button>
                    <p class="text-xs text-[var(--ui-text-muted)] mt-0.5 line-clamp-1">
                      {{ ncr.reason }}
                    </p>
                  </div>
                  <span class="text-xs font-semibold text-warning whitespace-nowrap">
                    {{ formatCurrency(ncr.value) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </UAlert>
    </div>

    <!-- NCR Adjustments Section (Read-only) -->
    <div
      v-if="ncrCredits > 0 || ncrLosses > 0"
      class="mt-6 pt-6 border-t border-[var(--ui-border)]"
    >
      <div class="flex items-center gap-2 mb-4">
        <h4 class="text-sm font-semibold text-[var(--ui-text)]">NCR Adjustments</h4>
        <UBadge color="primary" variant="soft" size="xs">Auto-calculated</UBadge>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- NCR Credits (Deducted from consumption) -->
        <div v-if="ncrCredits > 0">
          <label class="block text-sm font-medium text-[var(--ui-text)] mb-2">
            NCR Credits
            <span class="text-[var(--ui-text-muted)] font-normal ml-1">(SAR)</span>
          </label>
          <UInput :model-value="formatCurrency(ncrCredits)" disabled class="w-full" readonly />
          <p class="text-xs text-[var(--ui-text-muted)] mt-1">
            Credits from CREDITED and RESOLVED/CREDIT NCRs
          </p>
        </div>

        <!-- NCR Losses (Added to consumption) -->
        <div v-if="ncrLosses > 0">
          <label class="block text-sm font-medium text-[var(--ui-text)] mb-2">
            NCR Losses
            <span class="text-[var(--ui-text-muted)] font-normal ml-1">(SAR)</span>
          </label>
          <UInput :model-value="formatCurrency(ncrLosses)" disabled class="w-full" readonly />
          <p class="text-xs text-[var(--ui-text-muted)] mt-1">
            Losses from REJECTED and RESOLVED/LOSS NCRs
          </p>
        </div>
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
        :disabled="!canSave || loading"
        :loading="loading"
        class="cursor-pointer"
        @click="handleSave"
      >
        {{ saveButtonText }}
      </UButton>
    </div>

    <!-- Help text for confirm button -->
    <p
      v-if="!readOnly && isAutoCalculated && !hasChanges"
      class="mt-2 text-sm text-[var(--ui-text-muted)] text-right"
    >
      Click "Confirm Reconciliation" to save current values and enable period close for this
      location.
    </p>

    <!-- Validation Error -->
    <div v-if="!isValid" class="mt-4">
      <UAlert
        color="error"
        variant="soft"
        icon="i-lucide-alert-triangle"
        title="Invalid Values"
        description="All adjustment values must be non-negative numbers"
      />
    </div>
  </UCard>
</template>
