<script setup lang="ts">
/**
 * ReconciliationSummary Component
 *
 * Displays comprehensive reconciliation data including:
 * - Stock movement (opening, receipts, transfers, issues, closing)
 * - Consumption analysis (consumption, mandays, cost per manday)
 * - Calculation breakdown
 */

// Props
interface Props {
  reconciliation: {
    opening_stock: number;
    receipts: number;
    transfers_in: number;
    transfers_out: number;
    issues: number;
    closing_stock: number;
    ncr_credits?: number;
    ncr_losses?: number;
  };
  calculations: {
    consumption: number;
    total_adjustments: number;
    total_mandays: number;
    manday_cost: number | null;
    breakdown?: {
      receipts_and_transfers: number;
      issues_and_stock_change: number;
      stock_change: number;
      variance_before_adjustments: number;
    };
  };
  showBreakdown?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showBreakdown: true,
});

/**
 * Format currency value
 */
function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) {
    return "SAR 0.00";
  }
  return `SAR ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
</script>

<template>
  <div class="space-y-3">
    <!-- Stock Movement Summary -->
    <UCard class="card-elevated">
      <template #header>
        <h3 class="text-lg font-semibold text-[var(--ui-text)]">Stock Movement</h3>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
        <!-- Opening Stock -->
        <div>
          <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Opening Stock</h4>
          <p class="text-xl font-bold text-[var(--ui-text)] mt-1">
            {{ formatCurrency(reconciliation.opening_stock) }}
          </p>
        </div>

        <!-- Receipts -->
        <div>
          <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Receipts</h4>
          <p class="text-xl font-bold text-[var(--ui-success)] mt-1">
            {{ formatCurrency(reconciliation.receipts) }}
          </p>
        </div>

        <!-- Transfers In -->
        <div>
          <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Transfers In</h4>
          <p class="text-xl font-bold text-[var(--ui-success)] mt-1">
            {{ formatCurrency(reconciliation.transfers_in) }}
          </p>
        </div>

        <!-- Transfers Out -->
        <div>
          <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Transfers Out</h4>
          <p class="text-xl font-bold text-[var(--ui-error)] mt-1">
            {{ formatCurrency(reconciliation.transfers_out) }}
          </p>
        </div>

        <!-- Issues -->
        <div>
          <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Issues</h4>
          <p class="text-xl font-bold text-[var(--ui-error)] mt-1">
            {{ formatCurrency(reconciliation.issues) }}
          </p>
        </div>

        <!-- Closing Stock -->
        <div>
          <div class="flex items-center gap-1">
            <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Closing Stock</h4>
            <UTooltip text="Calculated from current inventory levels (on-hand × WAC for all items)">
              <UIcon name="i-lucide-info" class="w-3.5 h-3.5 text-[var(--ui-text-muted)]" />
            </UTooltip>
          </div>
          <p class="text-xl font-bold text-[var(--ui-text)] mt-1">
            {{ formatCurrency(reconciliation.closing_stock) }}
          </p>
          <p class="text-xs text-[var(--ui-text-muted)] mt-1">System-calculated</p>
        </div>
      </div>
    </UCard>

    <!-- Consumption Analysis -->
    <UCard class="card-elevated">
      <template #header>
        <h3 class="text-lg font-semibold text-[var(--ui-text)]">Consumption Analysis</h3>
      </template>

      <div class="space-y-6">
        <!-- Row 1: NCR Credits, NCR Losses, Total Consumption -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- NCR Credits -->
          <div v-if="reconciliation.ncr_credits && reconciliation.ncr_credits > 0">
            <div class="flex items-center gap-1">
              <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">NCR Credits</h4>
              <UTooltip text="Credits from CREDITED and RESOLVED/CREDIT NCRs (reduces consumption)">
                <UIcon name="i-lucide-info" class="w-3.5 h-3.5 text-[var(--ui-text-muted)]" />
              </UTooltip>
            </div>
            <p class="text-2xl font-bold text-[var(--ui-success)] mt-1">
              {{ formatCurrency(reconciliation.ncr_credits) }}
            </p>
          </div>

          <!-- NCR Losses -->
          <div v-if="reconciliation.ncr_losses && reconciliation.ncr_losses > 0">
            <div class="flex items-center gap-1">
              <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">NCR Losses</h4>
              <UTooltip text="Losses from REJECTED and RESOLVED/LOSS NCRs (increases consumption)">
                <UIcon name="i-lucide-info" class="w-3.5 h-3.5 text-[var(--ui-text-muted)]" />
              </UTooltip>
            </div>
            <p class="text-2xl font-bold text-[var(--ui-error)] mt-1">
              {{ formatCurrency(reconciliation.ncr_losses) }}
            </p>
          </div>

          <!-- Total Consumption -->
          <div
            :class="{
              'md:col-start-3':
                !(reconciliation.ncr_credits && reconciliation.ncr_credits > 0) &&
                !(reconciliation.ncr_losses && reconciliation.ncr_losses > 0),
            }"
          >
            <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Total Consumption</h4>
            <p class="text-2xl font-bold text-[var(--ui-primary)] mt-1">
              {{ formatCurrency(calculations.consumption) }}
            </p>
          </div>
        </div>

        <!-- Row 2: Total Mandays, Manday Cost -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Total Mandays -->
          <div>
            <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Total Mandays</h4>
            <p class="text-2xl font-bold text-[var(--ui-text)] mt-1">
              {{ calculations.total_mandays.toLocaleString() }}
            </p>
          </div>

          <!-- Manday Cost -->
          <div>
            <h4 class="text-sm font-medium text-[var(--ui-text-muted)]">Manday Cost</h4>
            <p class="text-2xl font-bold text-[var(--ui-success)] mt-1">
              {{ calculations.manday_cost ? formatCurrency(calculations.manday_cost) : "N/A" }}
            </p>
            <p
              v-if="calculations.total_mandays === 0"
              class="text-xs text-[var(--ui-text-muted)] mt-1"
            >
              No POB entries for this period
            </p>
          </div>
        </div>
      </div>

      <!-- Breakdown Details -->
      <div
        v-if="showBreakdown && calculations.breakdown"
        class="mt-6 pt-6 border-t border-[var(--ui-border)]"
      >
        <h4 class="text-sm font-medium text-[var(--ui-text-muted)] mb-4">Calculation Breakdown</h4>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-[var(--ui-text-muted)]">Stock Change:</span>
            <span class="font-medium text-[var(--ui-text)]">
              {{ formatCurrency(calculations.breakdown.stock_change) }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-[var(--ui-text-muted)]">Receipts + Transfers In:</span>
            <span class="font-medium text-[var(--ui-text)]">
              {{ formatCurrency(calculations.breakdown.receipts_and_transfers) }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-[var(--ui-text-muted)]">Issues + Stock Change:</span>
            <span class="font-medium text-[var(--ui-text)]">
              {{ formatCurrency(calculations.breakdown.issues_and_stock_change) }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-[var(--ui-text-muted)]">Total Adjustments:</span>
            <span class="font-medium text-[var(--ui-text)]">
              {{ formatCurrency(calculations.total_adjustments) }}
            </span>
          </div>
          <div
            v-if="reconciliation.ncr_credits && reconciliation.ncr_credits > 0"
            class="flex justify-between pl-4"
          >
            <span class="text-[var(--ui-text-muted)] text-xs">NCR Credits:</span>
            <span class="font-medium text-[var(--ui-success)] text-xs">
              -{{ formatCurrency(reconciliation.ncr_credits) }}
            </span>
          </div>
          <div
            v-if="reconciliation.ncr_losses && reconciliation.ncr_losses > 0"
            class="flex justify-between pl-4"
          >
            <span class="text-[var(--ui-text-muted)] text-xs">NCR Losses:</span>
            <span class="font-medium text-[var(--ui-error)] text-xs">
              +{{ formatCurrency(reconciliation.ncr_losses) }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-[var(--ui-text-muted)]">Variance Before Adjustments:</span>
            <span class="font-medium text-[var(--ui-text)]">
              {{ formatCurrency(calculations.breakdown.variance_before_adjustments) }}
            </span>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
