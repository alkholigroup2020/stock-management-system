<script setup lang="ts">
/**
 * IssueLineInput Component
 *
 * Single table row component for issue line input.
 * Handles item selection, quantity input, stock validation,
 * WAC display, and line value calculation.
 */

import { formatCurrency } from "~/utils/format";

// Props
interface Props {
  /**
   * Issue line data
   */
  line: {
    id: string;
    item_id: string;
    quantity: string;
    wac: number;
    line_value: number;
    on_hand: number;
    has_insufficient_stock: boolean;
  };
  /**
   * Available items for selection
   */
  items: any[];
  /**
   * Stock levels map (itemId -> { on_hand, wac })
   */
  stockLevels: Record<string, { on_hand: number; wac: number }>;
  /**
   * Whether remove button is enabled
   */
  canRemove?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  canRemove: true,
});

// Emits
const emit = defineEmits<{
  "update:line": [value: any];
  remove: [];
}>();

// Methods
const getItemById = (itemId: string) => {
  return props.items.find((item) => item.id === itemId);
};

const handleRemove = () => {
  emit("remove");
};
</script>

<template>
  <tr :class="{ 'bg-red-50 dark:bg-red-950/20': line.has_insufficient_stock }">
    <!-- Item Selection -->
    <td class="px-4 py-3">
      <USelectMenu
        v-model="line.item_id"
        :options="items"
        option-attribute="name"
        value-attribute="id"
        placeholder="Select item"
        searchable
        class="min-w-[200px]"
        @update:model-value="emit('update:line', line)"
      />
    </td>

    <!-- On Hand -->
    <td class="px-4 py-3">
      <div v-if="line.item_id" class="flex items-center space-x-2">
        <span class="text-sm font-medium text-default">
          {{ line.on_hand.toFixed(4) }}
        </span>
        <UIcon
          v-if="line.has_insufficient_stock"
          name="i-lucide-alert-circle"
          class="text-red-500"
        />
      </div>
      <span v-else class="text-sm text-muted">-</span>
    </td>

    <!-- Quantity -->
    <td class="px-4 py-3">
      <UInput
        v-model="line.quantity"
        type="number"
        step="0.0001"
        min="0"
        placeholder="0.00"
        class="w-32"
        @update:model-value="emit('update:line', line)"
      />
    </td>

    <!-- WAC (Read-only) -->
    <td class="px-4 py-3">
      <span v-if="line.item_id" class="text-sm text-muted">
        {{ formatCurrency(line.wac) }}
      </span>
      <span v-else class="text-sm text-muted">-</span>
    </td>

    <!-- Line Value -->
    <td class="px-4 py-3 text-right">
      <span class="text-sm font-medium text-default">
        {{ formatCurrency(line.line_value) }}
      </span>
    </td>

    <!-- Action -->
    <td class="px-4 py-3 text-center">
      <UButton
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        size="sm"
        :disabled="!canRemove"
        @click="handleRemove"
      />
    </td>
  </tr>
</template>
