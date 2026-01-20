<script setup lang="ts">
/**
 * Orders Index Page
 *
 * Main page for the PRF/PO workflow with tabs for:
 * - PRFs (Purchase Requisition Forms)
 * - POs (Purchase Orders)
 * - Stock Reference (read-only stock levels for PRF creation)
 */

import { formatCurrency, formatDate } from "~/utils/format";
import type { PRFStatus, POStatus, Unit } from "~~/shared/types/database";
import type { PRFListItem, PRFFilters } from "~/composables/usePRFs";
import type { POFilters } from "~/composables/usePOs";
import type { StockItem } from "~/components/orders/StockLevelsTable.vue";

// SEO
useSeoMeta({
  title: "Orders - Stock Management System",
  description: "Manage purchase requisitions and purchase orders",
});

// Composables
const router = useRouter();
const route = useRoute();
const locationStore = useLocationStore();
const { canCreatePRF, canCreatePO, canViewPRFs, canViewPOs } = usePermissions();
const { isProcurementSpecialist, user, locations } = useAuth();
const { handleError } = useErrorHandler();

// State
const activeTab = ref("prfs");

// PRF filters
const prfFilters = ref<PRFFilters>({
  page: 1,
  limit: 20,
  status: undefined,
  location_id: undefined,
});

// PO filters
const poFilters = ref<POFilters>({
  page: 1,
  limit: 20,
  status: undefined,
});

// Stock tab state
const stockLoading = ref(false);
const stocks = ref<StockItem[]>([]);

// Fetch PRFs
const { prfs, pagination, loading: prfsLoading, refresh: refreshPRFs } = usePRFs(prfFilters);

// Fetch POs
const {
  pos,
  pagination: poPagination,
  loading: posLoading,
  refresh: refreshPOs,
} = usePOs(poFilters);

// Sync tab from URL query
onMounted(() => {
  const tab = route.query.tab as string;
  if (tab && ["prfs", "pos", "stock"].includes(tab)) {
    activeTab.value = tab;
  }

  // Set initial location filter
  if (locationStore.activeLocation) {
    prfFilters.value.location_id = locationStore.activeLocation.id;
  }
});

// Watch tab changes and update URL
watch(activeTab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } });

  // Load stock data when switching to stock tab
  if (newTab === "stock" && stocks.value.length === 0) {
    fetchStockLevels();
  }
});

// Watch location changes
watch(
  () => locationStore.activeLocation,
  (newLocation) => {
    if (newLocation) {
      prfFilters.value.location_id = newLocation.id;

      // Refetch stock if on stock tab
      if (activeTab.value === "stock") {
        fetchStockLevels();
      }
    }
  }
);

// Computed
const activeLocation = computed(() => locationStore.activeLocation);

// Check if PROCUREMENT_SPECIALIST has location assignments
const hasLocationAssignments = computed(() => {
  // Only relevant for PROCUREMENT_SPECIALIST
  if (!isProcurementSpecialist.value) return true;
  // Check if locations array has any items
  return locations.value && locations.value.length > 0;
});

// Can create PO (permission + location check for procurement specialists)
const canCreatePOWithLocation = computed(() => {
  return canCreatePO() && hasLocationAssignments.value;
});

// Tab items configuration
const tabItems = computed(() => {
  const items: { value: string; label: string; icon: string }[] = [];

  if (canViewPRFs()) {
    items.push({
      value: "prfs",
      label: "Purchase Requisitions",
      icon: "i-lucide-file-text",
    });
  }

  if (canViewPOs()) {
    items.push({
      value: "pos",
      label: "Purchase Orders",
      icon: "i-lucide-shopping-cart",
    });
  }

  // Stock reference tab - not for procurement specialists
  if (!isProcurementSpecialist.value) {
    items.push({
      value: "stock",
      label: "Stock Reference",
      icon: "i-lucide-package",
    });
  }

  return items;
});

// PRF status filter options
const statusFilterOptions = [
  { label: "All Statuses", value: undefined },
  { label: "Draft", value: "DRAFT" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Closed", value: "CLOSED" },
];

// Filter for procurement specialists (only approved/closed)
const filteredStatusOptions = computed(() => {
  if (isProcurementSpecialist.value) {
    return statusFilterOptions.filter(
      (opt) => opt.value === undefined || opt.value === "APPROVED" || opt.value === "CLOSED"
    );
  }
  return statusFilterOptions;
});

// Navigation handlers
function goToNewPRF() {
  router.push("/orders/prfs/create");
}

function goToNewPO() {
  router.push("/orders/pos/create");
}

function goToPRF(id: string) {
  router.push(`/orders/prfs/${id}`);
}

function goToPO(id: string) {
  router.push(`/orders/pos/${id}`);
}

// PRF Pagination handlers
function goToPRFPage(page: number) {
  prfFilters.value.page = page;
}

// PO Pagination handlers
function goToPOPage(page: number) {
  poFilters.value.page = page;
}

// PO status filter options
const poStatusFilterOptions = [
  { label: "All Statuses", value: undefined },
  { label: "Open", value: "OPEN" },
  { label: "Closed", value: "CLOSED" },
];

// Stock report response type
interface StockReportItem {
  item_id: string;
  item_code: string;
  item_name: string;
  item_unit: Unit;
  on_hand: number;
  wac: number;
  stock_value: number;
  min_stock: number | null;
  max_stock: number | null;
}

interface StockReportLocation {
  location_id: string;
  items: StockReportItem[];
}

interface StockReportResponse {
  locations: StockReportLocation[];
}

// Fetch stock levels for reference
async function fetchStockLevels() {
  if (!activeLocation.value) return;

  stockLoading.value = true;
  try {
    const data = await $fetch<StockReportResponse>(
      `/api/reports/stock-now?locationId=${activeLocation.value.id}`
    );

    // Get items from the first (and only) location in the response
    const locationData = data.locations?.[0];
    if (locationData && locationData.items) {
      stocks.value = locationData.items.map((item) => ({
        item_id: item.item_id,
        item_code: item.item_code,
        item_name: item.item_name,
        unit: item.item_unit,
        on_hand: item.on_hand,
        wac: item.wac,
        stock_value: item.stock_value,
        min_stock: item.min_stock,
        max_stock: item.max_stock,
      }));
    } else {
      stocks.value = [];
    }
  } catch (error) {
    handleError(error, { context: "fetching stock levels" });
    stocks.value = [];
  } finally {
    stockLoading.value = false;
  }
}

// Handle stock item selection (could be used to pre-fill PRF line)
function handleStockItemSelect(item: StockItem) {
  // Could navigate to create PRF with pre-selected item
  console.log("Selected stock item:", item);
}
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-clipboard-list" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl sm:text-3xl font-bold text-primary">Orders</h1>
            <UBadge
              v-if="activeLocation"
              color="primary"
              variant="soft"
              size="md"
              class="hidden sm:inline-flex items-center gap-1"
            >
              <UIcon name="i-lucide-map-pin" class="h-3 w-3" />
              {{ activeLocation.name }}
            </UBadge>
          </div>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Manage purchase requisitions and purchase orders
          </p>
          <!-- Mobile location badge (smaller, below title) -->
          <UBadge
            v-if="activeLocation"
            color="primary"
            variant="soft"
            size="sm"
            class="sm:hidden inline-flex items-center gap-1 mt-1"
          >
            <UIcon name="i-lucide-map-pin" class="h-3 w-3" />
            {{ activeLocation.name }}
          </UBadge>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <!-- New PRF Button -->
        <UButton
          v-if="canCreatePRF() && activeTab === 'prfs'"
          color="primary"
          icon="i-lucide-plus"
          size="lg"
          class="cursor-pointer rounded-full px-3 sm:px-6"
          @click="goToNewPRF"
        >
          <span class="hidden sm:inline">New PRF</span>
          <span class="sm:hidden">New</span>
        </UButton>

        <!-- New PO Button -->
        <UTooltip
          v-if="canCreatePO() && activeTab === 'pos'"
          :text="
            !hasLocationAssignments
              ? 'You need at least one location assignment to create POs'
              : ''
          "
          :disabled="hasLocationAssignments"
        >
          <UButton
            color="primary"
            icon="i-lucide-plus"
            size="lg"
            class="rounded-full px-3 sm:px-6"
            :class="{ 'cursor-pointer': hasLocationAssignments, 'cursor-not-allowed': !hasLocationAssignments }"
            :disabled="!hasLocationAssignments"
            @click="goToNewPO"
          >
            <span class="hidden sm:inline">New PO</span>
            <span class="sm:hidden">New</span>
          </UButton>
        </UTooltip>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="border-b border-[var(--ui-border)]">
      <nav class="flex gap-1" aria-label="Orders tabs">
        <button
          v-for="tab in tabItems"
          :key="tab.value"
          type="button"
          class="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors"
          :class="[
            activeTab === tab.value
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-default hover:border-default/50',
          ]"
          @click="activeTab = tab.value"
        >
          <UIcon :name="tab.icon" class="w-4 h-4" />
          <span class="hidden sm:inline">{{ tab.label }}</span>
          <span class="sm:hidden">
            {{ tab.value === "prfs" ? "PRFs" : tab.value === "pos" ? "POs" : "Stock" }}
          </span>
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <!-- PRFs Tab Content -->
    <template v-if="activeTab === 'prfs'">
      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3">
        <USelectMenu
          v-model="prfFilters.status"
          :items="filteredStatusOptions"
          label-key="label"
          value-key="value"
          placeholder="Filter by status"
          class="w-48"
        >
          <template #leading>
            <UIcon name="i-lucide-filter" class="w-4 h-4" />
          </template>
        </USelectMenu>

        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          class="cursor-pointer"
          :loading="prfsLoading"
          @click="refreshPRFs()"
        >
          Refresh
        </UButton>
      </div>

      <!-- PRFs List -->
      <UCard class="card-elevated" :ui="{ body: 'p-0' }">
        <!-- Loading State -->
        <div v-if="prfsLoading" class="flex justify-center py-12">
          <div class="flex flex-col items-center gap-3">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-primary animate-spin" />
            <p class="text-sm text-[var(--ui-text-muted)]">Loading PRFs...</p>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="prfs.length === 0" class="text-center py-12 px-4">
          <UIcon name="i-lucide-file-text" class="w-16 h-16 mx-auto text-muted mb-4" />
          <h3 class="text-lg font-medium text-default mb-2">No PRFs Found</h3>
          <p class="text-muted mb-6">
            {{
              prfFilters.status
                ? `No PRFs with status "${prfFilters.status}" found.`
                : "No purchase requisitions have been created yet."
            }}
          </p>
          <UButton
            v-if="canCreatePRF()"
            color="primary"
            icon="i-lucide-plus"
            class="cursor-pointer"
            @click="goToNewPRF"
          >
            Create New PRF
          </UButton>
        </div>

        <!-- PRFs Table -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--ui-border)]">
            <thead>
              <tr class="bg-[var(--ui-bg-elevated)]">
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  PRF Number
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider hidden md:table-cell"
                >
                  Type
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider hidden lg:table-cell"
                >
                  Location
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider hidden sm:table-cell"
                >
                  Requester
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Total Value
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider hidden md:table-cell"
                >
                  Date
                </th>
                <th
                  class="px-4 py-3 text-center text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider w-16"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--ui-border)]">
              <tr
                v-for="prf in prfs"
                :key="prf.id"
                class="hover:bg-[var(--ui-bg-elevated)] transition-colors cursor-pointer"
                @click="goToPRF(prf.id)"
              >
                <!-- PRF Number -->
                <td class="px-4 py-3">
                  <span class="text-sm font-medium text-primary">{{ prf.prf_no }}</span>
                </td>

                <!-- Status -->
                <td class="px-4 py-3">
                  <OrdersPRFStatusBadge :status="prf.status" size="sm" />
                </td>

                <!-- Type -->
                <td class="px-4 py-3 hidden md:table-cell">
                  <span class="text-sm text-[var(--ui-text)]">{{ prf.prf_type }}</span>
                </td>

                <!-- Location -->
                <td class="px-4 py-3 hidden lg:table-cell">
                  <span class="text-sm text-[var(--ui-text)]">{{ prf.location.name }}</span>
                </td>

                <!-- Requester -->
                <td class="px-4 py-3 hidden sm:table-cell">
                  <span class="text-sm text-[var(--ui-text)]">
                    {{ prf.requester.full_name || "—" }}
                  </span>
                </td>

                <!-- Total Value -->
                <td class="px-4 py-3 text-right">
                  <span class="text-sm font-medium text-[var(--ui-text)]">
                    {{ formatCurrency(parseFloat(prf.total_value)) }}
                  </span>
                </td>

                <!-- Date -->
                <td class="px-4 py-3 hidden md:table-cell">
                  <span class="text-sm text-[var(--ui-text-muted)]">
                    {{ formatDate(prf.request_date) }}
                  </span>
                </td>

                <!-- Action -->
                <td class="px-4 py-3 text-center" @click.stop>
                  <UButton
                    icon="i-lucide-eye"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    class="cursor-pointer"
                    @click="goToPRF(prf.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="pagination && pagination.totalPages > 1"
          class="flex items-center justify-between px-4 py-3 border-t border-[var(--ui-border)]"
        >
          <div class="text-sm text-[var(--ui-text-muted)]">
            Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of
            {{ pagination.total }} PRFs
          </div>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-chevron-left"
              color="neutral"
              variant="ghost"
              size="sm"
              class="cursor-pointer"
              :disabled="pagination.page === 1"
              @click="goToPRFPage(pagination.page - 1)"
            />
            <span class="text-sm text-[var(--ui-text)]">
              Page {{ pagination.page }} of {{ pagination.totalPages }}
            </span>
            <UButton
              icon="i-lucide-chevron-right"
              color="neutral"
              variant="ghost"
              size="sm"
              class="cursor-pointer"
              :disabled="pagination.page === pagination.totalPages"
              @click="goToPRFPage(pagination.page + 1)"
            />
          </div>
        </div>
      </UCard>
    </template>

    <!-- POs Tab Content -->
    <template v-else-if="activeTab === 'pos'">
      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3">
        <USelectMenu
          v-model="poFilters.status"
          :items="poStatusFilterOptions"
          label-key="label"
          value-key="value"
          placeholder="Filter by status"
          class="w-48"
        >
          <template #leading>
            <UIcon name="i-lucide-filter" class="w-4 h-4" />
          </template>
        </USelectMenu>

        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          class="cursor-pointer"
          :loading="posLoading"
          @click="refreshPOs()"
        >
          Refresh
        </UButton>
      </div>

      <!-- POs List -->
      <UCard class="card-elevated" :ui="{ body: 'p-0' }">
        <!-- Loading State -->
        <div v-if="posLoading" class="flex justify-center py-12">
          <div class="flex flex-col items-center gap-3">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-primary animate-spin" />
            <p class="text-sm text-[var(--ui-text-muted)]">Loading POs...</p>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="pos.length === 0" class="text-center py-12 px-4">
          <UIcon name="i-lucide-shopping-cart" class="w-16 h-16 mx-auto text-muted mb-4" />
          <h3 class="text-lg font-medium text-default mb-2">No POs Found</h3>
          <p class="text-muted mb-6">
            {{
              poFilters.status
                ? `No POs with status "${poFilters.status}" found.`
                : "No purchase orders have been created yet."
            }}
          </p>
          <UTooltip
            v-if="canCreatePO()"
            :text="
              !hasLocationAssignments
                ? 'You need at least one location assignment to create POs'
                : ''
            "
            :disabled="hasLocationAssignments"
          >
            <UButton
              color="primary"
              icon="i-lucide-plus"
              :class="{ 'cursor-pointer': hasLocationAssignments, 'cursor-not-allowed': !hasLocationAssignments }"
              :disabled="!hasLocationAssignments"
              @click="goToNewPO"
            >
              Create New PO
            </UButton>
          </UTooltip>
        </div>

        <!-- POs Table -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--ui-border)]">
            <thead>
              <tr class="bg-[var(--ui-bg-elevated)]">
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  PO Number
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider hidden md:table-cell"
                >
                  Supplier
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider hidden lg:table-cell"
                >
                  Source PRF
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Total Amount
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider hidden sm:table-cell"
                >
                  Created By
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider hidden md:table-cell"
                >
                  Date
                </th>
                <th
                  class="px-4 py-3 text-center text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider w-16"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--ui-border)]">
              <tr
                v-for="po in pos"
                :key="po.id"
                class="hover:bg-[var(--ui-bg-elevated)] transition-colors cursor-pointer"
                @click="goToPO(po.id)"
              >
                <!-- PO Number -->
                <td class="px-4 py-3">
                  <span class="text-sm font-medium text-primary">{{ po.po_no }}</span>
                </td>

                <!-- Status -->
                <td class="px-4 py-3">
                  <OrdersPOStatusBadge :status="po.status" size="sm" />
                </td>

                <!-- Supplier -->
                <td class="px-4 py-3 hidden md:table-cell">
                  <span class="text-sm text-[var(--ui-text)]">{{ po.supplier?.name }}</span>
                </td>

                <!-- Source PRF -->
                <td class="px-4 py-3 hidden lg:table-cell">
                  <span v-if="po.prf" class="text-sm text-[var(--ui-text)]">
                    {{ po.prf.prf_no }}
                  </span>
                  <span v-else class="text-sm text-[var(--ui-text-muted)]">—</span>
                </td>

                <!-- Total Amount -->
                <td class="px-4 py-3 text-right">
                  <span class="text-sm font-medium text-[var(--ui-text)]">
                    {{ formatCurrency(parseFloat(po.total_amount)) }}
                  </span>
                </td>

                <!-- Created By -->
                <td class="px-4 py-3 hidden sm:table-cell">
                  <span class="text-sm text-[var(--ui-text)]">
                    {{ po.creator?.full_name || "—" }}
                  </span>
                </td>

                <!-- Date -->
                <td class="px-4 py-3 hidden md:table-cell">
                  <span class="text-sm text-[var(--ui-text-muted)]">
                    {{ formatDate(po.created_at) }}
                  </span>
                </td>

                <!-- Action -->
                <td class="px-4 py-3 text-center" @click.stop>
                  <UButton
                    icon="i-lucide-eye"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    class="cursor-pointer"
                    @click="goToPO(po.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="poPagination && poPagination.totalPages > 1"
          class="flex items-center justify-between px-4 py-3 border-t border-[var(--ui-border)]"
        >
          <div class="text-sm text-[var(--ui-text-muted)]">
            Showing {{ (poPagination.page - 1) * poPagination.limit + 1 }} to
            {{ Math.min(poPagination.page * poPagination.limit, poPagination.total) }} of
            {{ poPagination.total }} POs
          </div>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-chevron-left"
              color="neutral"
              variant="ghost"
              size="sm"
              class="cursor-pointer"
              :disabled="poPagination.page === 1"
              @click="goToPOPage(poPagination.page - 1)"
            />
            <span class="text-sm text-[var(--ui-text)]">
              Page {{ poPagination.page }} of {{ poPagination.totalPages }}
            </span>
            <UButton
              icon="i-lucide-chevron-right"
              color="neutral"
              variant="ghost"
              size="sm"
              class="cursor-pointer"
              :disabled="poPagination.page === poPagination.totalPages"
              @click="goToPOPage(poPagination.page + 1)"
            />
          </div>
        </div>
      </UCard>
    </template>

    <!-- Stock Reference Tab Content -->
    <UCard v-else-if="activeTab === 'stock'" class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
      <!-- No Location Selected -->
      <div v-if="!activeLocation" class="text-center py-12">
        <UIcon name="i-lucide-map-pin-off" class="w-16 h-16 mx-auto text-muted mb-4" />
        <h3 class="text-lg font-medium text-default mb-2">No Location Selected</h3>
        <p class="text-muted">Please select a location to view stock levels.</p>
      </div>

      <!-- Stock Levels Table -->
      <template v-else>
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-[var(--ui-text)]">
            Stock Levels at {{ activeLocation.name }}
          </h3>
          <p class="text-sm text-[var(--ui-text-muted)]">
            Reference stock levels to help with PRF creation. Click an item to view details.
          </p>
        </div>

        <OrdersStockLevelsTable
          :stocks="stocks"
          :loading="stockLoading"
          @select-item="handleStockItemSelect"
        />
      </template>
    </UCard>
  </div>
</template>
