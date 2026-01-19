<script setup lang="ts">
/**
 * StockLevelsTable Component
 *
 * Displays read-only stock levels for a location.
 * Used as a reference when creating PRFs to see current inventory.
 */

import { formatNumber, formatCurrency } from "~/utils/format";
import type { Unit } from "~~/shared/types/database";

// Types
export interface StockItem {
  item_id: string;
  item_code: string;
  item_name: string;
  unit: Unit;
  on_hand: number;
  wac: number;
  stock_value: number;
  min_stock?: number | null;
  max_stock?: number | null;
}

// Props
interface Props {
  stocks: StockItem[];
  loading?: boolean;
  searchQuery?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  searchQuery: "",
});

// Emits
const emit = defineEmits<{
  selectItem: [item: StockItem];
}>();

// Local state
const localSearch = ref(props.searchQuery);

// Filtered stocks based on search
const filteredStocks = computed(() => {
  if (!localSearch.value) return props.stocks;

  const query = localSearch.value.toLowerCase();
  return props.stocks.filter(
    (stock) =>
      stock.item_code.toLowerCase().includes(query) || stock.item_name.toLowerCase().includes(query)
  );
});

// Stock level status
function getStockStatus(stock: StockItem): "low" | "normal" | "high" {
  if (stock.min_stock && stock.on_hand < stock.min_stock) {
    return "low";
  }
  if (stock.max_stock && stock.on_hand > stock.max_stock) {
    return "high";
  }
  return "normal";
}

function getStockStatusColor(status: "low" | "normal" | "high"): string {
  switch (status) {
    case "low":
      return "text-red-600 dark:text-red-400";
    case "high":
      return "text-amber-600 dark:text-amber-400";
    default:
      return "text-emerald-600 dark:text-emerald-500";
  }
}

function getStockStatusIcon(status: "low" | "normal" | "high"): string {
  switch (status) {
    case "low":
      return "i-lucide-alert-triangle";
    case "high":
      return "i-lucide-trending-up";
    default:
      return "i-lucide-check-circle";
  }
}

// Handle item click
function handleItemClick(stock: StockItem) {
  emit("selectItem", stock);
}
</script>

<template>
  <div class="space-y-4">
    <!-- Search -->
    <div class="flex items-center gap-4">
      <UInput
        v-model="localSearch"
        placeholder="Search items by code or name..."
        icon="i-lucide-search"
        size="md"
        class="flex-1 max-w-md"
      />
      <div class="text-sm text-[var(--ui-text-muted)]">
        {{ filteredStocks.length }} of {{ stocks.length }} items
      </div>
    </div>

    <!-- Stock Table -->
    <div class="overflow-x-auto border border-[var(--ui-border)] rounded-lg">
      <table class="min-w-full divide-y divide-[var(--ui-border)]">
        <thead>
          <tr class="bg-[var(--ui-bg-elevated)]">
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider"
            >
              Item
            </th>
            <th
              class="px-4 py-3 text-center text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider w-20"
            >
              Unit
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider w-28"
            >
              On Hand
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider w-28"
            >
              WAC
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider w-32"
            >
              Stock Value
            </th>
            <th
              class="px-4 py-3 text-center text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider w-20"
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--ui-border)]">
          <!-- Loading State -->
          <tr v-if="loading">
            <td colspan="6" class="px-4 py-8">
              <div class="flex flex-col items-center justify-center gap-3">
                <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-primary animate-spin" />
                <p class="text-sm text-[var(--ui-text-muted)]">Loading stock levels...</p>
              </div>
            </td>
          </tr>

          <!-- Stock Items -->
          <tr
            v-for="stock in filteredStocks"
            v-else
            :key="stock.item_id"
            class="hover:bg-[var(--ui-bg-elevated)] transition-colors cursor-pointer"
            @click="handleItemClick(stock)"
          >
            <!-- Item -->
            <td class="px-4 py-3">
              <div class="flex flex-col">
                <span class="text-sm font-medium text-[var(--ui-text)]">
                  {{ stock.item_name }}
                </span>
                <span class="text-xs text-[var(--ui-text-muted)]">
                  {{ stock.item_code }}
                </span>
              </div>
            </td>

            <!-- Unit -->
            <td class="px-4 py-3 text-center">
              <span class="text-sm text-[var(--ui-text)]">{{ stock.unit }}</span>
            </td>

            <!-- On Hand -->
            <td class="px-4 py-3 text-right">
              <span class="text-sm font-medium" :class="getStockStatusColor(getStockStatus(stock))">
                {{ formatNumber(stock.on_hand, 4) }}
              </span>
            </td>

            <!-- WAC -->
            <td class="px-4 py-3 text-right">
              <span class="text-sm text-[var(--ui-text-muted)]">
                {{ formatCurrency(stock.wac) }}
              </span>
            </td>

            <!-- Stock Value -->
            <td class="px-4 py-3 text-right">
              <span class="text-sm font-medium text-[var(--ui-text)]">
                {{ formatCurrency(stock.stock_value) }}
              </span>
            </td>

            <!-- Status -->
            <td class="px-4 py-3 text-center">
              <UTooltip
                :text="
                  getStockStatus(stock) === 'low'
                    ? 'Below minimum stock level'
                    : getStockStatus(stock) === 'high'
                      ? 'Above maximum stock level'
                      : 'Normal stock level'
                "
              >
                <UIcon
                  :name="getStockStatusIcon(getStockStatus(stock))"
                  class="w-5 h-5"
                  :class="getStockStatusColor(getStockStatus(stock))"
                />
              </UTooltip>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="!loading && filteredStocks.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-[var(--ui-text-muted)]">
              <div class="flex flex-col items-center gap-2">
                <UIcon name="i-lucide-package-x" class="w-12 h-12" />
                <p v-if="stocks.length === 0">No stock data available for this location.</p>
                <p v-else>No items match your search.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Legend -->
    <div class="flex items-center gap-6 text-xs text-[var(--ui-text-muted)]">
      <div class="flex items-center gap-1">
        <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-emerald-500" />
        <span>Normal</span>
      </div>
      <div class="flex items-center gap-1">
        <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 text-red-500" />
        <span>Low Stock</span>
      </div>
      <div class="flex items-center gap-1">
        <UIcon name="i-lucide-trending-up" class="w-4 h-4 text-amber-500" />
        <span>Overstocked</span>
      </div>
    </div>
  </div>
</template>
