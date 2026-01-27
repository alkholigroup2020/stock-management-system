<template>
  <UModal v-model:open="isOpen" :dismissible="!loading">
    <template #content>
      <UCard :ui="{ body: 'p-6', header: 'p-6 pb-4' }">
        <template #header>
          <div class="flex items-start gap-3">
            <div
              class="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
              :class="
                hasUnfulfilledItems ? 'bg-[var(--ui-warning)]/10' : 'bg-[var(--ui-primary)]/10'
              "
            >
              <UIcon
                :name="hasUnfulfilledItems ? 'i-lucide-alert-triangle' : 'i-lucide-lock'"
                :class="
                  hasUnfulfilledItems ? 'text-[var(--ui-warning)]' : 'text-[var(--ui-primary)]'
                "
                class="w-5 h-5"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-subheading font-semibold text-[var(--ui-text)]">
                Close Purchase Order
              </h3>
              <p class="text-sm text-[var(--ui-text-muted)] mt-1">
                {{ po?.po_no }}
              </p>
            </div>
          </div>
        </template>

        <div class="flex flex-col gap-4">
          <!-- Warning for unfulfilled items -->
          <UAlert
            v-if="hasUnfulfilledItems"
            color="warning"
            variant="subtle"
            icon="i-lucide-alert-triangle"
            title="Unfulfilled Items Detected"
            :description="`This PO has ${unfulfilledItems.length} item(s) with unfulfilled quantities (${fulfillmentPercent}% delivered). A closure reason is required.`"
          />

          <!-- Unfulfilled items table -->
          <div
            v-if="hasUnfulfilledItems && unfulfilledItems.length > 0"
            class="flex flex-col gap-2"
          >
            <span class="block text-sm font-medium text-[var(--ui-text)]">Unfulfilled Items</span>
            <div class="max-h-48 overflow-y-auto border border-[var(--ui-border)] rounded-lg">
              <table class="w-full text-sm">
                <thead class="bg-[var(--ui-bg-elevated)] sticky top-0">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-[var(--ui-text-muted)]">
                      Item
                    </th>
                    <th
                      class="px-3 py-2 text-right text-xs font-medium text-[var(--ui-text-muted)]"
                    >
                      Ordered
                    </th>
                    <th
                      class="px-3 py-2 text-right text-xs font-medium text-[var(--ui-text-muted)]"
                    >
                      Delivered
                    </th>
                    <th
                      class="px-3 py-2 text-right text-xs font-medium text-[var(--ui-text-muted)]"
                    >
                      Remaining
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[var(--ui-border)]">
                  <tr v-for="item in unfulfilledItems" :key="item.item_description">
                    <td class="px-3 py-2 text-[var(--ui-text)]">
                      {{ item.item_description }}
                    </td>
                    <td class="px-3 py-2 text-right text-[var(--ui-text)]">
                      {{ item.ordered_qty }} {{ item.unit }}
                    </td>
                    <td class="px-3 py-2 text-right text-[var(--ui-text)]">
                      {{ item.delivered_qty }} {{ item.unit }}
                    </td>
                    <td class="px-3 py-2 text-right font-medium text-[var(--ui-warning)]">
                      {{ item.remaining_qty }} {{ item.unit }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Closure reason (required for unfulfilled POs) -->
          <UFormField
            v-if="hasUnfulfilledItems"
            label="Closure Reason"
            required
            :error="
              !closureReason.trim()
                ? 'A closure reason is required when closing a PO with unfulfilled quantities.'
                : undefined
            "
          >
            <UTextarea
              v-model="closureReason"
              placeholder="e.g., supplier unable to fulfill, order cancelled, items no longer needed..."
              :rows="3"
              :disabled="loading"
              class="w-full"
            />
          </UFormField>

          <!-- Confirmation message for fully fulfilled POs -->
          <p v-if="!hasUnfulfilledItems" class="text-sm text-[var(--ui-text-muted)]">
            This PO has been fully delivered ({{ fulfillmentPercent }}%). Once closed, it cannot be
            edited and no more deliveries can be linked to it.
          </p>

          <!-- Additional notes (optional) -->
          <UFormField label="Additional Notes" hint="Optional">
            <UTextarea
              v-model="additionalNotes"
              placeholder="Any additional notes about this closure..."
              :rows="2"
              :disabled="loading"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Actions -->
        <div class="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end mt-6">
          <UButton
            color="neutral"
            variant="soft"
            size="lg"
            class="cursor-pointer"
            :disabled="loading"
            @click="handleCancel"
          >
            Cancel
          </UButton>
          <UButton
            :color="hasUnfulfilledItems ? 'warning' : 'primary'"
            size="lg"
            class="cursor-pointer"
            :loading="loading"
            :disabled="!canClose || loading"
            @click="handleConfirm"
          >
            {{ loading ? "Closing..." : "Close PO" }}
          </UButton>
        </div>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { PODetail } from "~/composables/usePOs";

interface UnfulfilledItem {
  item_description: string;
  unit: string;
  ordered_qty: string;
  delivered_qty: string;
  remaining_qty: string;
}

interface Props {
  modelValue: boolean;
  po: PODetail | null | undefined;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [options: { closure_reason?: string; notes?: string }];
  cancel: [];
}>();

// State
const closureReason = ref("");
const additionalNotes = ref("");

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const unfulfilledItems = computed<UnfulfilledItem[]>(() => {
  if (!props.po?.lines) return [];

  return props.po.lines
    .map((line) => {
      const orderedQty = parseFloat(line.quantity) || 0;
      const deliveredQty = parseFloat(line.delivered_qty || "0") || 0;
      const remainingQty = Math.max(0, orderedQty - deliveredQty);

      return {
        item_description: line.item_description,
        unit: line.unit,
        ordered_qty: orderedQty.toString(),
        delivered_qty: deliveredQty.toString(),
        remaining_qty: remainingQty.toString(),
      };
    })
    .filter((item) => parseFloat(item.remaining_qty) > 0);
});

const hasUnfulfilledItems = computed(() => unfulfilledItems.value.length > 0);

const fulfillmentPercent = computed(() => {
  if (!props.po?.lines || props.po.lines.length === 0) return 100;

  const totalOrdered = props.po.lines.reduce(
    (sum, line) => sum + (parseFloat(line.quantity) || 0),
    0
  );
  const totalDelivered = props.po.lines.reduce(
    (sum, line) => sum + (parseFloat(line.delivered_qty || "0") || 0),
    0
  );

  if (totalOrdered === 0) return 100;
  return Math.round((totalDelivered / totalOrdered) * 100);
});

const canClose = computed(() => {
  // If fully fulfilled, can always close
  if (!hasUnfulfilledItems.value) return true;

  // If unfulfilled, need closure reason
  return closureReason.value.trim().length > 0;
});

// Reset form when modal opens
watch(isOpen, (newValue) => {
  if (newValue) {
    closureReason.value = "";
    additionalNotes.value = "";
  }
});

// Handlers
function handleConfirm() {
  if (!canClose.value || props.loading) return;

  const options: { closure_reason?: string; notes?: string } = {};

  if (hasUnfulfilledItems.value && closureReason.value.trim()) {
    options.closure_reason = closureReason.value.trim();
  }

  if (additionalNotes.value.trim()) {
    options.notes = additionalNotes.value.trim();
  }

  emit("confirm", options);
}

function handleCancel() {
  if (!props.loading) {
    isOpen.value = false;
    emit("cancel");
  }
}
</script>
