<template>
  <div class="p-4 md:p-6">
    <!-- Page Header -->
    <LayoutPageHeader
      title="Consolidated Reconciliation"
      subtitle="View reconciliation data across all locations"
      icon="building-office-2"
      :location-scope="'none'"
      :show-period="true"
    />

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="mt-6">
      <ErrorAlert :message="error" @retry="fetchData" />
    </div>

    <!-- No Period Selected -->
    <div v-else-if="!currentPeriod" class="mt-6">
      <UAlert
        color="warning"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        title="No Active Period"
        description="There is no active period selected. Please ensure a period is set."
      />
    </div>

    <!-- Consolidated Reconciliation Data -->
    <div v-else-if="consolidatedData" class="mt-6 space-y-6">
      <!-- Period Information & Summary -->
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-[var(--ui-text)]">
              {{ consolidatedData.period.name }}
            </h3>
            <p class="text-sm text-[var(--ui-text-muted)] mt-1">
              {{ formatDate(consolidatedData.period.start_date) }} -
              {{ formatDate(consolidatedData.period.end_date) }}
            </p>
          </div>
          <div class="text-right">
            <div class="text-sm text-[var(--ui-text-muted)]">Total Locations</div>
            <div class="text-2xl font-bold text-[var(--ui-text)]">
              {{ consolidatedData.summary.total_locations }}
            </div>
          </div>
        </div>

        <!-- Summary Stats -->
        <div
          class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[var(--ui-border)]"
        >
          <div>
            <div class="text-sm text-[var(--ui-text-muted)]">Total Consumption</div>
            <div class="text-xl font-semibold text-[var(--ui-primary)]">
              {{ formatCurrency(consolidatedData.grand_totals.consumption) }}
            </div>
          </div>
          <div>
            <div class="text-sm text-[var(--ui-text-muted)]">Total Mandays</div>
            <div class="text-xl font-semibold text-[var(--ui-text)]">
              {{ consolidatedData.grand_totals.total_mandays.toLocaleString() }}
            </div>
          </div>
          <div>
            <div class="text-sm text-[var(--ui-text-muted)]">Average Manday Cost</div>
            <div class="text-xl font-semibold text-[var(--ui-success)]">
              {{
                consolidatedData.grand_totals.average_manday_cost !== null
                  ? formatCurrency(consolidatedData.grand_totals.average_manday_cost)
                  : "N/A"
              }}
            </div>
          </div>
        </div>

        <!-- Auto-calculated Warning -->
        <div v-if="consolidatedData.summary.locations_with_auto_calculated > 0" class="mt-4">
          <UAlert
            color="warning"
            variant="soft"
            icon="i-heroicons-information-circle"
            :title="`${consolidatedData.summary.locations_with_auto_calculated} location(s) with auto-calculated data`"
            description="Some reconciliations are auto-calculated from current transactions and have not been saved by supervisors yet."
          />
        </div>
      </UCard>

      <!-- Export Button -->
      <div class="flex justify-end">
        <UButton
          color="primary"
          variant="outline"
          icon="i-heroicons-arrow-down-tray"
          @click="exportToCSV"
        >
          Export to CSV
        </UButton>
      </div>

      <!-- Location Reconciliations Table -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-[var(--ui-text)]">Reconciliations by Location</h3>
        </template>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--ui-border)]">
            <thead>
              <tr class="bg-[var(--ui-bg-elevated)]">
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Location
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Opening
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Receipts
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Transfers In
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Transfers Out
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Issues
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Closing
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Adjustments
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Consumption
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Mandays
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Cost/Manday
                </th>
                <th
                  class="px-4 py-3 text-center text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="bg-[var(--ui-bg)] divide-y divide-[var(--ui-border)]">
              <tr
                v-for="item in consolidatedData.locations"
                :key="item.location.id"
                class="hover:bg-[var(--ui-bg-elevated)] transition-colors cursor-pointer"
                @click="viewLocationDetails(item.location.id)"
              >
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="text-sm font-medium text-[var(--ui-text)]">
                    {{ item.location.code }}
                  </div>
                  <div class="text-xs text-[var(--ui-text-muted)]">
                    {{ item.location.name }}
                  </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-text)]">
                  {{ formatCurrency(item.reconciliation.opening_stock) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-success)]">
                  {{ formatCurrency(item.reconciliation.receipts) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-success)]">
                  {{ formatCurrency(item.reconciliation.transfers_in) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-error)]">
                  {{ formatCurrency(item.reconciliation.transfers_out) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-error)]">
                  {{ formatCurrency(item.reconciliation.issues) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-text)]">
                  {{ formatCurrency(item.reconciliation.closing_stock) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-text)]">
                  {{ formatCurrency(item.calculations.total_adjustments) }}
                </td>
                <td
                  class="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-[var(--ui-primary)]"
                >
                  {{ formatCurrency(item.calculations.consumption) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-text)]">
                  {{ item.calculations.total_mandays.toLocaleString() }}
                </td>
                <td
                  class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-[var(--ui-success)]"
                >
                  {{
                    item.calculations.manday_cost !== null
                      ? formatCurrency(item.calculations.manday_cost)
                      : "N/A"
                  }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-center">
                  <UBadge
                    :color="item.is_auto_calculated ? 'warning' : 'success'"
                    variant="soft"
                    size="xs"
                  >
                    {{ item.is_auto_calculated ? "Auto" : "Saved" }}
                  </UBadge>
                </td>
              </tr>

              <!-- Grand Totals Row -->
              <tr
                class="bg-[var(--ui-bg-elevated)] font-semibold border-t-2 border-[var(--ui-border)]"
              >
                <td class="px-4 py-3 whitespace-nowrap text-sm text-[var(--ui-text)]">
                  GRAND TOTAL
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-text)]">
                  {{ formatCurrency(consolidatedData.grand_totals.opening_stock) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-success)]">
                  {{ formatCurrency(consolidatedData.grand_totals.receipts) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-success)]">
                  {{ formatCurrency(consolidatedData.grand_totals.transfers_in) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-error)]">
                  {{ formatCurrency(consolidatedData.grand_totals.transfers_out) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-error)]">
                  {{ formatCurrency(consolidatedData.grand_totals.issues) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-text)]">
                  {{ formatCurrency(consolidatedData.grand_totals.closing_stock) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-text)]">
                  {{
                    formatCurrency(
                      consolidatedData.grand_totals.adjustments +
                        consolidatedData.grand_totals.back_charges +
                        consolidatedData.grand_totals.credits +
                        consolidatedData.grand_totals.condemnations
                    )
                  }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-primary)]">
                  {{ formatCurrency(consolidatedData.grand_totals.consumption) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-text)]">
                  {{ consolidatedData.grand_totals.total_mandays.toLocaleString() }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm text-[var(--ui-success)]">
                  {{
                    consolidatedData.grand_totals.average_manday_cost !== null
                      ? formatCurrency(consolidatedData.grand_totals.average_manday_cost)
                      : "N/A"
                  }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-center">
                  <span class="text-xs text-[var(--ui-text-muted)]">
                    {{ consolidatedData.summary.locations_with_saved_reconciliations }}/{{
                      consolidatedData.summary.total_locations
                    }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { usePeriodStore } from "~/stores/period";
import { useAuthStore } from "~/stores/auth";
import { formatCurrency, formatDate } from "~/utils/format";

// Types
interface LocationReconciliation {
  location: {
    id: string;
    code: string;
    name: string;
    type: string;
  };
  reconciliation: {
    id: string;
    period_id: string;
    location_id: string;
    opening_stock: number;
    receipts: number;
    transfers_in: number;
    transfers_out: number;
    issues: number;
    closing_stock: number;
    adjustments: number;
    back_charges: number;
    credits: number;
    condemnations: number;
    last_updated: Date | string;
  };
  calculations: {
    consumption: number;
    total_adjustments: number;
    total_mandays: number;
    manday_cost: number | null;
  };
  is_auto_calculated: boolean;
}

interface ConsolidatedData {
  period: {
    id: string;
    name: string;
    start_date: Date | string;
    end_date: Date | string;
    status: string;
  };
  locations: LocationReconciliation[];
  grand_totals: {
    opening_stock: number;
    receipts: number;
    transfers_in: number;
    transfers_out: number;
    issues: number;
    closing_stock: number;
    adjustments: number;
    back_charges: number;
    credits: number;
    condemnations: number;
    consumption: number;
    total_mandays: number;
    average_manday_cost: number | null;
  };
  summary: {
    total_locations: number;
    locations_with_saved_reconciliations: number;
    locations_with_auto_calculated: number;
  };
}

// Stores
const periodStore = usePeriodStore();
const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

// Check permissions on mount
onMounted(() => {
  if (
    !authStore.user ||
    (authStore.user.role !== "SUPERVISOR" && authStore.user.role !== "ADMIN")
  ) {
    toast.add({
      title: "Access Denied",
      description: "Only Supervisors and Admins can view consolidated reconciliations",
      color: "error",
      icon: "i-heroicons-exclamation-circle",
    });
    router.push("/reconciliations");
  }
});

// State
const loading = ref(false);
const error = ref<string | null>(null);
const consolidatedData = ref<ConsolidatedData | null>(null);

// Computed
const currentPeriod = computed(() => periodStore.currentPeriod);

// Methods
async function fetchData() {
  if (!currentPeriod.value) {
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await $fetch(`/api/reconciliations/consolidated`, {
      method: "GET",
      query: {
        periodId: currentPeriod.value.id,
      },
    });

    consolidatedData.value = response as ConsolidatedData;
  } catch (err: unknown) {
    console.error("Error fetching consolidated reconciliations:", err);
    const apiError = err as { data?: { code?: string; message?: string } };

    // Handle specific error codes
    if (apiError.data?.code === "INSUFFICIENT_PERMISSIONS") {
      error.value = "You do not have permission to view consolidated reconciliations";
      toast.add({
        title: "Access Denied",
        description: error.value,
        color: "error",
        icon: "i-heroicons-exclamation-circle",
      });
      router.push("/reconciliations");
    } else if (apiError.data?.code === "PERIOD_NOT_FOUND") {
      error.value = "Period not found";
    } else {
      error.value = apiError.data?.message || "Failed to load consolidated reconciliations";
    }
  } finally {
    loading.value = false;
  }
}

function viewLocationDetails(locationId: string) {
  router.push(`/reconciliations?locationId=${locationId}`);
}

function exportToCSV() {
  if (!consolidatedData.value) {
    return;
  }

  try {
    // Build CSV header
    const headers = [
      "Location Code",
      "Location Name",
      "Opening Stock",
      "Receipts",
      "Transfers In",
      "Transfers Out",
      "Issues",
      "Closing Stock",
      "Adjustments",
      "Consumption",
      "Mandays",
      "Cost per Manday",
      "Status",
    ];

    // Build CSV rows
    const rows = consolidatedData.value.locations.map((item: LocationReconciliation) => {
      return [
        item.location.code,
        item.location.name,
        item.reconciliation.opening_stock.toFixed(2),
        item.reconciliation.receipts.toFixed(2),
        item.reconciliation.transfers_in.toFixed(2),
        item.reconciliation.transfers_out.toFixed(2),
        item.reconciliation.issues.toFixed(2),
        item.reconciliation.closing_stock.toFixed(2),
        item.calculations.total_adjustments.toFixed(2),
        item.calculations.consumption.toFixed(2),
        item.calculations.total_mandays,
        item.calculations.manday_cost !== null ? item.calculations.manday_cost.toFixed(2) : "N/A",
        item.is_auto_calculated ? "Auto-calculated" : "Saved",
      ];
    });

    // Add grand totals row
    const grandTotalsRow = [
      "GRAND TOTAL",
      "",
      consolidatedData.value.grand_totals.opening_stock.toFixed(2),
      consolidatedData.value.grand_totals.receipts.toFixed(2),
      consolidatedData.value.grand_totals.transfers_in.toFixed(2),
      consolidatedData.value.grand_totals.transfers_out.toFixed(2),
      consolidatedData.value.grand_totals.issues.toFixed(2),
      consolidatedData.value.grand_totals.closing_stock.toFixed(2),
      (
        consolidatedData.value.grand_totals.adjustments +
        consolidatedData.value.grand_totals.back_charges +
        consolidatedData.value.grand_totals.credits +
        consolidatedData.value.grand_totals.condemnations
      ).toFixed(2),
      consolidatedData.value.grand_totals.consumption.toFixed(2),
      consolidatedData.value.grand_totals.total_mandays,
      consolidatedData.value.grand_totals.average_manday_cost !== null
        ? consolidatedData.value.grand_totals.average_manday_cost.toFixed(2)
        : "N/A",
      `${consolidatedData.value.summary.locations_with_saved_reconciliations}/${consolidatedData.value.summary.total_locations}`,
    ];

    rows.push(grandTotalsRow);

    // Convert to CSV string
    const csvContent = [
      // Title
      [`Consolidated Reconciliation Report - ${consolidatedData.value.period.name}`],
      [
        `Period: ${formatDate(consolidatedData.value.period.start_date)} - ${formatDate(consolidatedData.value.period.end_date)}`,
      ],
      [`Generated: ${formatDate(new Date())}`],
      [], // Empty row
      headers,
      ...rows,
    ]
      .map((row) => row.map((cell: string | number) => `"${cell}"`).join(","))
      .join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `consolidated-reconciliation-${consolidatedData.value.period.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.add({
      title: "Export Successful",
      description: "Consolidated reconciliation exported to CSV",
      color: "success",
      icon: "i-heroicons-check-circle",
    });
  } catch (err) {
    console.error("Error exporting to CSV:", err);
    toast.add({
      title: "Export Failed",
      description: "Failed to export consolidated reconciliation to CSV",
      color: "error",
      icon: "i-heroicons-exclamation-circle",
    });
  }
}

// Watch for period changes
watch(currentPeriod, (newPeriod) => {
  if (newPeriod) {
    fetchData();
  }
});

// Initial data load
onMounted(() => {
  if (currentPeriod.value) {
    fetchData();
  }
});
</script>
