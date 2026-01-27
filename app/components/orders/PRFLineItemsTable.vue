<script setup lang="ts">
/**
 * PRFLineItemsTable Component
 *
 * Displays and manages editable line items for a PRF (Purchase Requisition Form).
 * Supports adding, editing, and removing line items with automatic VAT calculations.
 */

import { formatCurrency } from "~/utils/format";
import type { Unit } from "~~/shared/types/database";

// VAT rate for Saudi Arabia
const VAT_RATE = 15;

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
  vat_percent: string;
  total_before_vat: number;
  vat_amount: number;
  total_after_vat: number;
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

// Computed totals
const totals = computed(() => {
  const result = props.lines.reduce(
    (acc, line) => {
      const qty = parseFloat(line.required_qty) || 0;
      const price = parseFloat(line.estimated_price) || 0;
      const vatPercent = parseFloat(line.vat_percent) || VAT_RATE;

      const lineValue = qty * price;
      const vatAmount = (lineValue * vatPercent) / 100;
      const totalAfterVat = lineValue + vatAmount;

      return {
        total_before_vat: acc.total_before_vat + lineValue,
        total_vat: acc.total_vat + vatAmount,
        total_amount: acc.total_amount + totalAfterVat,
      };
    },
    {
      total_before_vat: 0,
      total_vat: 0,
      total_amount: 0,
    }
  );

  return {
    total_before_vat: Math.round(result.total_before_vat * 100) / 100,
    total_vat: Math.round(result.total_vat * 100) / 100,
    total_amount: Math.round(result.total_amount * 100) / 100,
  };
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
 * Update line value calculation with VAT
 */
function updateLineCalculation(line: PRFLineInput) {
  const qty = parseFloat(line.required_qty) || 0;
  const price = parseFloat(line.estimated_price) || 0;
  const vatPercent = parseFloat(line.vat_percent) || VAT_RATE;

  const lineValue = qty * price;
  const vatAmount = (lineValue * vatPercent) / 100;
  const totalAfterVat = lineValue + vatAmount;

  line.line_value = lineValue;
  line.total_before_vat = Math.round(lineValue * 100) / 100;
  line.vat_amount = Math.round(vatAmount * 100) / 100;
  line.total_after_vat = Math.round(totalAfterVat * 100) / 100;

  emit("lineChange", line);
}

/**
 * Get line values for display (computed from inputs)
 */
function getLineValues(line: PRFLineInput): {
  lineValue: number;
  vatAmount: number;
  totalAfterVat: number;
} {
  const qty = parseFloat(line.required_qty) || 0;
  const price = parseFloat(line.estimated_price) || 0;
  const vatPercent = parseFloat(line.vat_percent) || VAT_RATE;

  const lineValue = qty * price;
  const vatAmount = (lineValue * vatPercent) / 100;
  const totalAfterVat = lineValue + vatAmount;

  return {
    lineValue: Math.round(lineValue * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    totalAfterVat: Math.round(totalAfterVat * 100) / 100,
  };
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
    <div v-if="!readonly" class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-[var(--ui-text-muted)]">
          {{ lines.length }} item{{ lines.length !== 1 ? "s" : "" }}
        </span>
      </div>
      <UButton
        icon="i-lucide-plus"
        color="primary"
        variant="soft"
        size="md"
        class="cursor-pointer rounded-full shadow-sm hover:shadow-md transition-all"
        :disabled="disabled"
        @click="addLine"
      >
        <span class="hidden sm:inline">Add Item</span>
        <span class="sm:hidden">Add</span>
      </UButton>
    </div>

    <!-- Lines Table -->
    <div
      class="overflow-hidden border border-[var(--ui-border)] rounded-xl shadow-sm bg-[var(--ui-bg)]"
    >
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-[var(--ui-border)]">
          <thead>
            <tr class="bg-gradient-to-r from-[var(--ui-bg-elevated)] to-[var(--ui-bg-elevated)]">
              <th
                class="px-4 py-3.5 text-left text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider"
              >
                Item Description
              </th>
              <th
                class="px-4 py-3.5 text-center text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider w-24"
              >
                Unit
              </th>
              <th
                class="px-4 py-3.5 text-right text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider w-28"
              >
                Qty
              </th>
              <th
                class="px-4 py-3.5 text-right text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider w-32"
              >
                Est. Price
              </th>
              <th
                class="px-4 py-3.5 text-right text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider w-32 hidden md:table-cell"
              >
                Before VAT
              </th>
              <th
                class="px-4 py-3.5 text-right text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider w-28 hidden lg:table-cell"
              >
                VAT
              </th>
              <th
                class="px-4 py-3.5 text-right text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider w-36"
              >
                Total
              </th>
              <th
                v-if="!readonly"
                class="px-4 py-3.5 text-center text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider w-20"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)] bg-[var(--ui-bg)]">
            <!-- Loading State -->
            <tr v-if="loading">
              <td :colspan="readonly ? 7 : 8" class="px-4 py-12">
                <div class="flex flex-col items-center justify-center gap-3">
                  <UIcon name="i-lucide-loader-2" class="w-10 h-10 text-primary animate-spin" />
                  <p class="text-sm text-[var(--ui-text-muted)] font-medium">Loading items...</p>
                </div>
              </td>
            </tr>

            <!-- Line Items -->
            <tr
              v-for="(line, index) in lines"
              v-else
              :key="line.id"
              class="group hover:bg-[var(--ui-bg-elevated)] transition-colors duration-150"
              :class="{ 'bg-[var(--ui-bg-muted)]/30': index % 2 === 0 }"
            >
              <!-- Item Selection / Description -->
              <td class="px-4 py-4">
                <div v-if="readonly" class="text-sm font-medium text-[var(--ui-text)]">
                  {{ line.item_description }}
                </div>
                <div v-else class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <USelectMenu
                    :model-value="line.item_id ?? undefined"
                    :items="items"
                    label-key="name"
                    value-key="id"
                    placeholder="Select from catalog"
                    searchable
                    clearable
                    size="md"
                    class="w-full sm:w-52 flex-shrink-0"
                    :disabled="disabled"
                    @update:model-value="
                      (val: string | undefined) => {
                        line.item_id = val ?? null;
                        handleItemSelect(line);
                      }
                    "
                  >
                    <template #item="{ item }">
                      <div class="flex flex-col py-1">
                        <span class="font-medium text-sm">{{ item.name }}</span>
                        <span class="text-xs text-[var(--ui-text-muted)]">
                          Code: {{ item.code }}
                        </span>
                      </div>
                    </template>
                  </USelectMenu>
                  <UInput
                    v-model="line.item_description"
                    placeholder="Item description (required)"
                    size="md"
                    :disabled="disabled"
                    class="flex-1 min-w-[200px]"
                    @blur="updateLineCalculation(line)"
                  />
                </div>
              </td>

              <!-- Unit -->
              <td class="px-4 py-4 text-center">
                <div v-if="readonly" class="text-sm font-medium text-[var(--ui-text)]">
                  {{ line.unit }}
                </div>
                <USelectMenu
                  v-else
                  v-model="line.unit"
                  :items="unitOptions"
                  label-key="label"
                  value-key="value"
                  size="md"
                  :disabled="disabled"
                  class="w-full"
                />
              </td>

              <!-- Quantity -->
              <td class="px-4 py-4 text-right">
                <div v-if="readonly" class="text-sm font-medium text-[var(--ui-text)]">
                  {{ line.required_qty }}
                </div>
                <UInput
                  v-else
                  :model-value="line.required_qty"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="0"
                  size="md"
                  :disabled="disabled"
                  class="w-full text-right font-mono"
                  @update:model-value="
                    (val: string | number) => {
                      line.required_qty = String(val);
                      updateLineCalculation(line);
                    }
                  "
                />
              </td>

              <!-- Estimated Price -->
              <td class="px-4 py-4 text-right">
                <div v-if="readonly" class="text-sm font-medium text-[var(--ui-text)]">
                  {{ formatCurrency(parseFloat(line.estimated_price) || 0) }}
                </div>
                <UInput
                  v-else
                  :model-value="line.estimated_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  size="md"
                  :disabled="disabled"
                  class="w-full text-right font-mono"
                  @update:model-value="
                    (val: string | number) => {
                      line.estimated_price = String(val);
                      updateLineCalculation(line);
                    }
                  "
                />
              </td>

              <!-- Before VAT -->
              <td class="px-4 py-4 text-right hidden md:table-cell">
                <span class="text-sm font-semibold text-[var(--ui-text)] font-mono">
                  {{ formatCurrency(getLineValues(line).lineValue) }}
                </span>
              </td>

              <!-- VAT Amount -->
              <td class="px-4 py-4 text-right hidden lg:table-cell">
                <span class="text-sm text-[var(--ui-text-muted)] font-mono">
                  {{ formatCurrency(getLineValues(line).vatAmount) }}
                </span>
              </td>

              <!-- Total After VAT -->
              <td class="px-4 py-4 text-right">
                <span class="text-base font-bold text-primary font-mono">
                  {{ formatCurrency(getLineValues(line).totalAfterVat) }}
                </span>
              </td>

              <!-- Action -->
              <td v-if="!readonly" class="px-4 py-4 text-center">
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="md"
                  class="cursor-pointer opacity-60 group-hover:opacity-100 transition-opacity"
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
                :colspan="readonly ? 7 : 8"
                class="px-4 py-16 text-center bg-[var(--ui-bg-muted)]/20"
              >
                <div class="flex flex-col items-center gap-3">
                  <div
                    class="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--ui-bg-elevated)] border-2 border-dashed border-[var(--ui-border)]"
                  >
                    <UIcon
                      name="i-lucide-package-open"
                      class="w-8 h-8 text-[var(--ui-text-muted)]"
                    />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-[var(--ui-text-muted)]">
                      No items added yet
                    </p>
                    <button
                      v-if="!readonly"
                      type="button"
                      class="text-sm text-primary hover:underline cursor-pointer font-semibold mt-1"
                      @click="addLine"
                    >
                      Add your first item
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>

          <!-- Summary Footer -->
          <tfoot class="bg-gradient-to-br from-[var(--ui-bg-elevated)] to-[var(--ui-bg-muted)]/30">
            <!-- Before VAT -->
            <tr class="border-t-2 border-[var(--ui-border)]">
              <td colspan="4" class="px-4 py-3"></td>
              <td class="px-4 py-3 hidden md:table-cell"></td>
              <td
                class="px-4 py-3 text-right font-semibold text-[var(--ui-text-muted)] hidden lg:table-cell"
              >
                Subtotal:
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-sm font-bold text-[var(--ui-text)] font-mono">
                  {{ formatCurrency(totals.total_before_vat) }}
                </span>
              </td>
              <td v-if="!readonly" class="px-4 py-3"></td>
            </tr>

            <!-- VAT -->
            <tr>
              <td colspan="4" class="px-4 py-3"></td>
              <td class="px-4 py-3 hidden md:table-cell"></td>
              <td
                class="px-4 py-3 text-right font-semibold text-[var(--ui-text-muted)] hidden lg:table-cell"
              >
                VAT ({{ VAT_RATE }}%):
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-sm font-bold text-[var(--ui-text)] font-mono">
                  {{ formatCurrency(totals.total_vat) }}
                </span>
              </td>
              <td v-if="!readonly" class="px-4 py-3"></td>
            </tr>

            <!-- Grand Total -->
            <tr class="border-t-2 border-[var(--ui-border)]">
              <td colspan="4" class="px-4 py-4"></td>
              <td class="px-4 py-4 hidden md:table-cell"></td>
              <td class="px-4 py-4 text-right hidden lg:table-cell">
                <div class="flex flex-col items-end gap-1">
                  <span
                    class="text-xs text-[var(--ui-text-muted)] uppercase tracking-wider font-bold"
                  >
                    Grand Total
                  </span>
                  <span class="text-sm text-[var(--ui-text-muted)]">
                    {{ lines.length }} item{{ lines.length !== 1 ? "s" : "" }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-4 text-right">
                <div class="flex flex-col items-end gap-1">
                  <span
                    class="lg:hidden text-xs text-[var(--ui-text-muted)] uppercase tracking-wider font-bold"
                  >
                    Grand Total ({{ lines.length }} item{{ lines.length !== 1 ? "s" : "" }})
                  </span>
                  <span class="text-2xl font-black text-primary font-mono tracking-tight">
                    {{ formatCurrency(totals.total_amount) }}
                  </span>
                </div>
              </td>
              <td v-if="!readonly" class="px-4 py-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>
