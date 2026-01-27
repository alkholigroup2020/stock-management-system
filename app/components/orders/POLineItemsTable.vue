<script setup lang="ts">
/**
 * POLineItemsTable Component
 *
 * Displays and manages editable line items for a PO (Purchase Order).
 * Supports adding, editing, and removing line items with automatic VAT calculations.
 */

import { formatCurrency } from "~/utils/format";
import type { Unit } from "~~/shared/types/database";

// VAT rate for Saudi Arabia
const VAT_RATE = 15;

// Types
export interface POLineInput {
  id: string;
  item_id: string | null;
  item_code: string;
  item_description: string;
  unit: Unit;
  quantity: string;
  delivered_qty?: string; // Cumulative delivered quantity (readonly display)
  remaining_qty?: string; // Remaining quantity (readonly display)
  unit_price: string;
  discount_percent: string;
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
  lines: POLineInput[];
  items: ItemOption[];
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
  showDiscounts?: boolean;
  showDeliveryTracking?: boolean; // Show delivered/remaining columns in readonly mode
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  loading: false,
  showDiscounts: true,
  showDeliveryTracking: false,
});

// Emits
const emit = defineEmits<{
  "update:lines": [lines: POLineInput[]];
  addLine: [];
  removeLine: [id: string];
  lineChange: [line: POLineInput];
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
      const grossAmount = (parseFloat(line.quantity) || 0) * (parseFloat(line.unit_price) || 0);
      const discountAmount = (grossAmount * (parseFloat(line.discount_percent) || 0)) / 100;

      return {
        total_before_discount: acc.total_before_discount + grossAmount,
        total_discount: acc.total_discount + discountAmount,
        total_after_discount: acc.total_after_discount + (line.total_before_vat || 0),
        total_vat: acc.total_vat + (line.vat_amount || 0),
        total_amount: acc.total_amount + (line.total_after_vat || 0),
      };
    },
    {
      total_before_discount: 0,
      total_discount: 0,
      total_after_discount: 0,
      total_vat: 0,
      total_amount: 0,
    }
  );

  return {
    total_before_discount: Math.round(result.total_before_discount * 100) / 100,
    total_discount: Math.round(result.total_discount * 100) / 100,
    total_after_discount: Math.round(result.total_after_discount * 100) / 100,
    total_vat: Math.round(result.total_vat * 100) / 100,
    total_amount: Math.round(result.total_amount * 100) / 100,
  };
});

/**
 * Handle item selection - auto-fill description, code, and unit
 */
function handleItemSelect(line: POLineInput) {
  if (line.item_id) {
    const selectedItem = props.items.find((item) => item.id === line.item_id);
    if (selectedItem) {
      line.item_description = selectedItem.name;
      line.item_code = selectedItem.code;
      line.unit = selectedItem.unit;
    }
  }
  updateLineCalculation(line);
}

/**
 * Update line value calculation with VAT
 */
function updateLineCalculation(line: POLineInput) {
  const qty = parseFloat(line.quantity) || 0;
  const price = parseFloat(line.unit_price) || 0;
  const discountPercent = parseFloat(line.discount_percent) || 0;
  const vatPercent = parseFloat(line.vat_percent) || VAT_RATE;

  const grossAmount = qty * price;
  const discountAmount = (grossAmount * discountPercent) / 100;
  const totalBeforeVat = grossAmount - discountAmount;
  const vatAmount = (totalBeforeVat * vatPercent) / 100;
  const totalAfterVat = totalBeforeVat + vatAmount;

  line.total_before_vat = Math.round(totalBeforeVat * 100) / 100;
  line.vat_amount = Math.round(vatAmount * 100) / 100;
  line.total_after_vat = Math.round(totalAfterVat * 100) / 100;

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
    <div v-if="!readonly" class="flex items-center justify-between mb-2">
      <p class="text-sm font-medium text-[var(--ui-text-muted)]">
        Add and manage line items for this purchase order
      </p>
      <UButton
        icon="i-lucide-plus"
        color="primary"
        variant="soft"
        size="md"
        class="cursor-pointer rounded-full px-4"
        :disabled="disabled"
        @click="addLine"
      >
        <span class="hidden sm:inline">Add Item</span>
      </UButton>
    </div>

    <!-- Lines Table -->
    <div class="overflow-x-auto border border-[var(--ui-border)] rounded-lg shadow-sm">
      <table class="min-w-full divide-y divide-[var(--ui-border)]">
        <thead class="bg-[var(--ui-bg-elevated)]">
          <tr>
            <th
              class="px-4 py-3.5 text-left text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider"
            >
              Item
            </th>
            <th
              class="px-4 py-3.5 text-center text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider w-20"
            >
              Unit
            </th>
            <th
              class="px-4 py-3.5 text-right text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider w-24"
            >
              Qty
            </th>
            <!-- Delivery Tracking Columns (readonly mode only) -->
            <th
              v-if="showDeliveryTracking && readonly"
              class="px-4 py-3.5 text-right text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider w-24"
            >
              Delivered
            </th>
            <th
              v-if="showDeliveryTracking && readonly"
              class="px-4 py-3.5 text-right text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider w-24"
            >
              Remaining
            </th>
            <th
              class="px-4 py-3.5 text-right text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider w-28"
            >
              Unit Price
            </th>
            <th
              v-if="showDiscounts"
              class="px-4 py-3.5 text-right text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider w-20 hidden lg:table-cell"
            >
              Disc %
            </th>
            <th
              class="px-4 py-3.5 text-right text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider w-28 hidden md:table-cell"
            >
              Before VAT
            </th>
            <th
              class="px-4 py-3.5 text-right text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider w-24 hidden lg:table-cell"
            >
              VAT ({{ VAT_RATE }}%)
            </th>
            <th
              class="px-4 py-3.5 text-right text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider w-32"
            >
              Total
            </th>
            <th
              v-if="!readonly"
              class="px-4 py-3.5 text-center text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider w-16"
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--ui-border)]">
          <!-- Loading State -->
          <tr v-if="loading">
            <td :colspan="readonly ? 8 : 9" class="px-4 py-8">
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
            <td class="px-4 py-3">
              <div v-if="readonly" class="text-sm text-[var(--ui-text)]">
                <span v-if="line.item_code" class="font-mono text-xs text-[var(--ui-text-muted)]">
                  {{ line.item_code }}
                </span>
                {{ line.item_description }}
              </div>
              <div v-else class="flex items-center gap-2">
                <USelectMenu
                  :model-value="line.item_id ?? undefined"
                  :items="items"
                  label-key="name"
                  value-key="id"
                  placeholder="Select item (optional)"
                  searchable
                  clearable
                  size="md"
                  class="w-48 flex-shrink-0"
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
                  size="md"
                  :disabled="disabled"
                  class="flex-1 min-w-[200px]"
                  @blur="updateLineCalculation(line)"
                />
              </div>
            </td>

            <!-- Unit -->
            <td class="px-4 py-3 text-center">
              <div v-if="readonly" class="text-sm text-[var(--ui-text)]">
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
                class="w-20"
              />
            </td>

            <!-- Quantity -->
            <td class="px-4 py-3">
              <div v-if="readonly" class="text-sm text-right text-[var(--ui-text)]">
                {{ line.quantity }}
              </div>
              <UInput
                v-else
                v-model="line.quantity"
                type="number"
                step="0.0001"
                min="0"
                placeholder="0"
                size="md"
                :disabled="disabled"
                class="w-24 text-right"
                @input="updateLineCalculation(line)"
              />
            </td>

            <!-- Delivered Quantity (readonly mode only) -->
            <td v-if="showDeliveryTracking && readonly" class="px-4 py-3 text-right">
              <span
                class="text-sm"
                :class="[
                  parseFloat(line.delivered_qty || '0') > 0
                    ? 'text-primary font-medium'
                    : 'text-[var(--ui-text-muted)]',
                ]"
              >
                {{ line.delivered_qty || "0" }}
              </span>
            </td>

            <!-- Remaining Quantity (readonly mode only) -->
            <td v-if="showDeliveryTracking && readonly" class="px-4 py-3 text-right">
              <span
                class="text-sm font-medium"
                :class="[
                  parseFloat(line.remaining_qty || '0') <= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : parseFloat(line.remaining_qty || '0') < parseFloat(line.quantity)
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-[var(--ui-text)]',
                ]"
              >
                {{ line.remaining_qty || line.quantity }}
                <UIcon
                  v-if="parseFloat(line.remaining_qty || line.quantity) <= 0"
                  name="i-lucide-check-circle"
                  class="w-4 h-4 inline ml-1"
                />
              </span>
            </td>

            <!-- Unit Price -->
            <td class="px-4 py-3">
              <div v-if="readonly" class="text-sm text-right text-[var(--ui-text)]">
                {{ formatCurrency(parseFloat(line.unit_price) || 0) }}
              </div>
              <UInput
                v-else
                v-model="line.unit_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                size="md"
                :disabled="disabled"
                class="w-28 text-right"
                @input="updateLineCalculation(line)"
              />
            </td>

            <!-- Discount Percent -->
            <td v-if="showDiscounts" class="px-4 py-3 hidden lg:table-cell">
              <div v-if="readonly" class="text-sm text-right text-[var(--ui-text-muted)]">
                {{ line.discount_percent || 0 }}%
              </div>
              <UInput
                v-else
                v-model="line.discount_percent"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0"
                size="md"
                :disabled="disabled"
                class="w-20 text-right"
                @input="updateLineCalculation(line)"
              />
            </td>

            <!-- Before VAT -->
            <td class="px-4 py-3 text-right hidden md:table-cell">
              <span class="text-sm text-[var(--ui-text)]">
                {{ formatCurrency(line.total_before_vat || 0) }}
              </span>
            </td>

            <!-- VAT Amount -->
            <td class="px-4 py-3 text-right hidden lg:table-cell">
              <span class="text-sm text-[var(--ui-text-muted)]">
                {{ formatCurrency(line.vat_amount || 0) }}
              </span>
            </td>

            <!-- Total After VAT -->
            <td class="px-4 py-3 text-right">
              <span class="text-sm font-medium text-[var(--ui-text)]">
                {{ formatCurrency(line.total_after_vat || 0) }}
              </span>
            </td>

            <!-- Action -->
            <td v-if="!readonly" class="px-4 py-3 text-center">
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="md"
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
              :colspan="readonly ? 8 : 9"
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
        <tfoot class="bg-[var(--ui-bg-elevated)] border-t-2 border-[var(--ui-border)]">
          <!-- Subtotal Before Discount -->
          <tr v-if="totals.total_discount > 0" class="text-sm">
            <td :colspan="showDeliveryTracking && readonly ? 6 : 4" class="px-4 py-2.5"></td>
            <td v-if="showDiscounts" class="px-4 py-2.5 hidden lg:table-cell"></td>
            <td class="px-4 py-2.5 hidden md:table-cell"></td>
            <td
              class="px-4 py-2.5 text-right font-semibold text-[var(--ui-text-muted)] hidden lg:table-cell whitespace-nowrap"
            >
              Subtotal:
            </td>
            <td class="px-4 py-2.5 text-right font-medium text-[var(--ui-text)]">
              {{ formatCurrency(totals.total_before_discount) }}
            </td>
            <td v-if="!readonly" class="px-4 py-2.5"></td>
          </tr>

          <!-- Discount -->
          <tr v-if="totals.total_discount > 0" class="text-sm">
            <td :colspan="showDeliveryTracking && readonly ? 6 : 4" class="px-4 py-2.5"></td>
            <td v-if="showDiscounts" class="px-4 py-2.5 hidden lg:table-cell"></td>
            <td class="px-4 py-2.5 hidden md:table-cell"></td>
            <td
              class="px-4 py-2.5 text-right font-semibold text-error hidden lg:table-cell whitespace-nowrap"
            >
              Discount:
            </td>
            <td class="px-4 py-2.5 text-right font-medium text-error">
              -{{ formatCurrency(totals.total_discount) }}
            </td>
            <td v-if="!readonly" class="px-4 py-2.5"></td>
          </tr>

          <!-- After Discount / Before VAT -->
          <tr class="text-sm">
            <td :colspan="showDeliveryTracking && readonly ? 6 : 4" class="px-4 py-2.5"></td>
            <td v-if="showDiscounts" class="px-4 py-2.5 hidden lg:table-cell"></td>
            <td class="px-4 py-2.5 hidden md:table-cell"></td>
            <td
              class="px-4 py-2.5 text-right font-semibold text-[var(--ui-text-muted)] hidden lg:table-cell whitespace-nowrap"
            >
              Before VAT:
            </td>
            <td class="px-4 py-2.5 text-right font-medium text-[var(--ui-text)]">
              {{ formatCurrency(totals.total_after_discount) }}
            </td>
            <td v-if="!readonly" class="px-4 py-2.5"></td>
          </tr>

          <!-- VAT -->
          <tr class="text-sm">
            <td :colspan="showDeliveryTracking && readonly ? 6 : 4" class="px-4 py-2.5"></td>
            <td v-if="showDiscounts" class="px-4 py-2.5 hidden lg:table-cell"></td>
            <td class="px-4 py-2.5 hidden md:table-cell"></td>
            <td
              class="px-4 py-2.5 text-right font-semibold text-[var(--ui-text-muted)] hidden lg:table-cell whitespace-nowrap"
            >
              VAT ({{ VAT_RATE }}%):
            </td>
            <td class="px-4 py-2.5 text-right font-medium text-[var(--ui-text)]">
              {{ formatCurrency(totals.total_vat) }}
            </td>
            <td v-if="!readonly" class="px-4 py-2.5"></td>
          </tr>

          <!-- Grand Total -->
          <tr class="border-t-2 border-[var(--ui-border)] bg-[var(--ui-bg-muted)]">
            <td :colspan="showDeliveryTracking && readonly ? 6 : 4" class="px-4 py-4"></td>
            <td v-if="showDiscounts" class="px-4 py-4 hidden lg:table-cell"></td>
            <td class="px-4 py-4 hidden md:table-cell"></td>
            <td class="px-4 py-4 text-right hidden lg:table-cell whitespace-nowrap">
              <span class="text-base font-bold text-[var(--ui-text)]">
                {{ lines.length }} item(s) - Total:
              </span>
            </td>
            <td class="px-4 py-4 text-right">
              <span
                class="lg:hidden text-sm font-semibold text-[var(--ui-text-muted)] mr-2 whitespace-nowrap"
              >
                {{ lines.length }} item(s) - Total:
              </span>
              <span class="text-xl font-bold text-primary">
                {{ formatCurrency(totals.total_amount) }}
              </span>
            </td>
            <td v-if="!readonly" class="px-4 py-4"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>
