<script setup lang="ts">
/**
 * PRFLineItemsTable Component
 *
 * Displays and manages editable line items for a PRF (Purchase Requisition Form).
 * Supports adding, editing, and removing line items with automatic calculations.
 */

import { formatCurrency } from "~/utils/format";
import type { Unit } from "~~/shared/types/database";

// Types
export interface PRFLineInput {
  id: string;
  item_id: string | null;
  item_description: string;
  cost_code: string;
  unit: Unit;
  required_qty: string;
  estimated_price: string;
  line_value: number;
  notes: string;
}

export interface ItemOption {
  id: string;
  code: string;
  name: string;
  unit: Unit;
}

// Props
interface Props {
  lines: PRFLineInput[];
  items: ItemOption[];
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  loading: false,
});

// Emits
const emit = defineEmits<{
  "update:lines": [lines: PRFLineInput[]];
  addLine: [];
  removeLine: [id: string];
  lineChange: [line: PRFLineInput];
}>();

// Unit options
const unitOptions: { label: string; value: Unit }[] = [
  { label: "KG", value: "KG" },
  { label: "EA", value: "EA" },
  { label: "LTR", value: "LTR" },
  { label: "BOX", value: "BOX" },
  { label: "CASE", value: "CASE" },
  { label: "PACK", value: "PACK" },
];

// Computed
const totalValue = computed(() => {
  return props.lines.reduce((sum, line) => sum + (line.line_value || 0), 0);
});

/**
 * Handle item selection - auto-fill description and unit
 */
function handleItemSelect(line: PRFLineInput) {
  if (line.item_id) {
    const selectedItem = props.items.find((item) => item.id === line.item_id);
    if (selectedItem) {
      line.item_description = selectedItem.name;
      line.unit = selectedItem.unit;
    }
  }
  updateLineCalculation(line);
}

/**
 * Update line value calculation
 */
function updateLineCalculation(line: PRFLineInput) {
  const qty = parseFloat(line.required_qty) || 0;
  const price = parseFloat(line.estimated_price) || 0;
  line.line_value = qty * price;
  emit("lineChange", line);
}

/**
 * Add new line
 */
function addLine() {
  emit("addLine");
}

/**
 * Remove line
 */
function removeLine(id: string) {
  emit("removeLine", id);
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header with Add Button -->
    <div v-if="!readonly" class="flex items-center justify-between">
      <h3 class="text-base font-semibold text-[var(--ui-text)]">Line Items</h3>
      <UButton
        icon="i-lucide-plus"
        color="primary"
        variant="soft"
        size="sm"
        class="cursor-pointer rounded-full"
        :disabled="disabled"
        @click="addLine"
      >
        <span class="hidden sm:inline">Add Item</span>
      </UButton>
    </div>

    <!-- Lines Table -->
    <div class="overflow-x-auto border border-[var(--ui-border)] rounded-lg">
      <table class="min-w-full divide-y divide-[var(--ui-border)]">
        <thead>
          <tr class="bg-[var(--ui-bg-elevated)]">
            <th
              class="px-3 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider"
            >
              Item
            </th>
            <th
              class="px-3 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider w-24"
            >
              Cost Code
            </th>
            <th
              class="px-3 py-3 text-center text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider w-20"
            >
              Unit
            </th>
            <th
              class="px-3 py-3 text-right text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider w-28"
            >
              Qty
            </th>
            <th
              class="px-3 py-3 text-right text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider w-32"
            >
              Est. Price
            </th>
            <th
              class="px-3 py-3 text-right text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider w-32"
            >
              Line Value
            </th>
            <th
              v-if="!readonly"
              class="px-3 py-3 text-center text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider w-16"
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--ui-border)]">
          <!-- Loading State -->
          <tr v-if="loading">
            <td :colspan="readonly ? 6 : 7" class="px-4 py-8">
              <div class="flex flex-col items-center justify-center gap-3">
                <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-primary animate-spin" />
                <p class="text-sm text-[var(--ui-text-muted)]">Loading...</p>
              </div>
            </td>
          </tr>

          <!-- Line Items -->
          <tr
            v-for="line in lines"
            v-else
            :key="line.id"
            class="hover:bg-[var(--ui-bg-elevated)] transition-colors"
          >
            <!-- Item Selection / Description -->
            <td class="px-3 py-3">
              <div v-if="readonly" class="text-sm text-[var(--ui-text)]">
                {{ line.item_description }}
              </div>
              <div v-else class="space-y-2">
                <USelectMenu
                  :model-value="line.item_id ?? undefined"
                  :items="items"
                  label-key="name"
                  value-key="id"
                  placeholder="Select item (optional)"
                  searchable
                  clearable
                  class="min-w-[200px]"
                  :disabled="disabled"
                  @update:model-value="
                    (val: string | undefined) => {
                      line.item_id = val ?? null;
                      handleItemSelect(line);
                    }
                  "
                >
                  <template #item="{ item }">
                    <div class="flex flex-col">
                      <span class="font-medium">{{ item.name }}</span>
                      <span class="text-xs text-[var(--ui-text-muted)]">{{ item.code }}</span>
                    </div>
                  </template>
                </USelectMenu>
                <UInput
                  v-model="line.item_description"
                  placeholder="Item description *"
                  size="sm"
                  :disabled="disabled"
                  class="w-full"
                  @blur="updateLineCalculation(line)"
                />
              </div>
            </td>

            <!-- Cost Code -->
            <td class="px-3 py-3">
              <div v-if="readonly" class="text-sm text-[var(--ui-text-muted)]">
                {{ line.cost_code || "-" }}
              </div>
              <UInput
                v-else
                v-model="line.cost_code"
                placeholder="Code"
                size="sm"
                :disabled="disabled"
                class="w-24"
              />
            </td>

            <!-- Unit -->
            <td class="px-3 py-3 text-center">
              <div v-if="readonly" class="text-sm text-[var(--ui-text)]">
                {{ line.unit }}
              </div>
              <USelectMenu
                v-else
                v-model="line.unit"
                :items="unitOptions"
                label-key="label"
                value-key="value"
                :disabled="disabled"
                class="w-20"
              />
            </td>

            <!-- Quantity -->
            <td class="px-3 py-3">
              <div v-if="readonly" class="text-sm text-right text-[var(--ui-text)]">
                {{ line.required_qty }}
              </div>
              <UInput
                v-else
                v-model="line.required_qty"
                type="number"
                step="0.0001"
                min="0"
                placeholder="0"
                size="sm"
                :disabled="disabled"
                class="w-28 text-right"
                @input="updateLineCalculation(line)"
              />
            </td>

            <!-- Estimated Price -->
            <td class="px-3 py-3">
              <div v-if="readonly" class="text-sm text-right text-[var(--ui-text)]">
                {{ formatCurrency(parseFloat(line.estimated_price) || 0) }}
              </div>
              <UInput
                v-else
                v-model="line.estimated_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                size="sm"
                :disabled="disabled"
                class="w-32 text-right"
                @input="updateLineCalculation(line)"
              />
            </td>

            <!-- Line Value -->
            <td class="px-3 py-3 text-right">
              <span class="text-sm font-medium text-[var(--ui-text)]">
                {{ formatCurrency(line.line_value || 0) }}
              </span>
            </td>

            <!-- Action -->
            <td v-if="!readonly" class="px-3 py-3 text-center">
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="sm"
                class="cursor-pointer"
                :disabled="disabled || lines.length === 1"
                aria-label="Remove line item"
                title="Remove this item"
                @click="removeLine(line.id)"
              />
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="!loading && lines.length === 0">
            <td
              :colspan="readonly ? 6 : 7"
              class="px-4 py-8 text-center text-[var(--ui-text-muted)]"
            >
              No items added yet.
              <button
                v-if="!readonly"
                type="button"
                class="text-primary hover:underline cursor-pointer"
                @click="addLine"
              >
                Add an item
              </button>
            </td>
          </tr>
        </tbody>

        <!-- Summary Footer -->
        <tfoot class="bg-[var(--ui-bg-muted)]">
          <tr>
            <td :colspan="readonly ? 4 : 5" class="px-3 py-3 text-right">
              <span class="text-sm font-medium text-[var(--ui-text-muted)]">
                {{ lines.length }} item(s) - Total:
              </span>
            </td>
            <td class="px-3 py-3 text-right">
              <span class="text-lg font-bold text-primary">
                {{ formatCurrency(totalValue) }}
              </span>
            </td>
            <td v-if="!readonly"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>
