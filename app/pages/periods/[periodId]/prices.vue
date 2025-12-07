<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-tag" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Period Prices</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Set and manage item prices for accounting periods
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-if="!hasChanges && periodData?.status === 'DRAFT'"
          color="secondary"
          icon="i-lucide-copy"
          :loading="copying"
          :disabled="copying || !permissions.canSetItemPrices"
          size="lg"
          class="cursor-pointer rounded-full px-3 sm:px-6"
          @click="handleCopyPrices"
        >
          <span class="hidden sm:inline">Copy Prices</span>
          <span class="sm:hidden">Copy</span>
        </UButton>
        <UButton
          v-if="hasChanges"
          color="primary"
          icon="i-lucide-save"
          :loading="saving"
          :disabled="!canSave || saving"
          size="lg"
          class="cursor-pointer rounded-full px-3 sm:px-6"
          @click="handleSaveAll"
        >
          <span class="hidden sm:inline">Save All</span>
          <span class="sm:hidden">Save</span>
        </UButton>
      </div>
    </div>

    <!-- Period Info -->
    <UCard v-if="periodData" class="card-elevated" :ui="{ body: 'p-4' }">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-[var(--ui-text)]">
            {{ periodData.name }}
          </h2>
          <p class="text-caption text-[var(--ui-text-muted)]">
            {{ formatDateRange(periodData.start_date, periodData.end_date) }}
          </p>
        </div>
        <UBadge :color="getStatusBadgeColor(periodData.status)" variant="subtle" size="lg">
          {{ periodData.status }}
        </UBadge>
      </div>
    </UCard>

    <!-- Period Locked Warning -->
    <UAlert
      v-if="periodData?.status === 'OPEN'"
      color="warning"
      icon="i-lucide-lock"
      title="Prices Locked"
      description="This period is open. Prices are locked and cannot be modified."
    />
    <UAlert
      v-if="periodData?.status === 'CLOSED'"
      color="warning"
      icon="i-lucide-alert-triangle"
      title="Period Closed"
      description="This period is closed. You cannot modify prices."
    />

    <!-- Filters -->
    <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <!-- Search -->
        <div class="flex-1 min-w-0 max-w-md">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Search by name or code..."
            size="lg"
            class="w-full"
          >
            <template #trailing>
              <UButton
                v-if="searchQuery"
                color="neutral"
                variant="link"
                icon="i-lucide-x"
                :padded="false"
                class="cursor-pointer"
                @click="searchQuery = ''"
              />
            </template>
          </UInput>
        </div>

        <!-- Category Filter -->
        <div class="sm:w-64">
          <USelectMenu
            v-model="selectedCategory"
            :items="categoryOptions"
            value-key="value"
            placeholder="All Categories"
            size="lg"
            class="w-full"
          />
        </div>

        <!-- Clear Filters -->
        <UButton
          v-if="searchQuery || selectedCategory"
          color="neutral"
          variant="soft"
          icon="i-lucide-filter-x"
          class="cursor-pointer"
          @click="clearFilters"
        >
          Clear
        </UButton>
      </div>
    </UCard>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading prices..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" @retry="fetchPrices" />

    <!-- Prices Table -->
    <UCard v-else-if="pricesData" class="card-elevated" :ui="{ body: 'p-0' }">
      <!-- Statistics -->
      <div class="px-4 py-3 flex flex-wrap gap-4 text-caption border-b border-[var(--ui-border)]">
        <div>
          <span class="text-[var(--ui-text-muted)]">Total Items:</span>
          <span class="ml-2 font-semibold text-[var(--ui-text)]">{{ pricesData.length }}</span>
        </div>
        <div>
          <span class="text-[var(--ui-text-muted)]">Prices Set:</span>
          <span class="ml-2 font-semibold text-[var(--ui-text)]">{{ pricesSetCount }}</span>
        </div>
        <div>
          <span class="text-[var(--ui-text-muted)]">Prices Missing:</span>
          <span class="ml-2 font-semibold text-[var(--ui-text)]">{{ pricesMissingCount }}</span>
        </div>
        <div v-if="hasChanges" class="ml-auto">
          <span class="text-[var(--ui-text-muted)]">Unsaved Changes:</span>
          <span class="ml-2 font-semibold text-[var(--ui-warning)]">{{ changesCount }}</span>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-[var(--ui-border)]">
          <thead>
            <tr class="bg-[var(--ui-bg-elevated)]">
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Code</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Item Name</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Unit</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Category</th>
              <th class="px-4 py-3 text-right text-label uppercase tracking-wider">Current WAC</th>
              <th class="px-4 py-3 text-right text-label uppercase tracking-wider">Period Price</th>
              <th class="px-4 py-3 text-center text-label uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)]">
            <tr
              v-for="item in filteredPrices"
              :key="item.item_id"
              class="hover:bg-[var(--ui-bg-elevated)] transition-colors"
            >
              <!-- Code -->
              <td class="px-4 py-3 font-mono text-caption">
                {{ item.item_code }}
              </td>

              <!-- Item Name -->
              <td class="px-4 py-3 text-[var(--ui-text)]">
                {{ item.item_name }}
              </td>

              <!-- Unit -->
              <td class="px-4 py-3 text-caption">
                {{ item.item_unit }}
              </td>

              <!-- Category -->
              <td class="px-4 py-3 text-caption">
                {{ item.item_category || "-" }}
              </td>

              <!-- Current WAC -->
              <td class="px-4 py-3 text-right text-caption">
                {{ item.wac !== null ? formatCurrency(item.wac) : "-" }}
              </td>

              <!-- Period Price (Editable) -->
              <td class="px-4 py-3 text-right">
                <UInput
                  v-model="item.editedPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  :disabled="periodData?.status !== 'DRAFT' || !permissions.canSetItemPrices"
                  class="w-32 ml-auto"
                  @input="handlePriceChange(item)"
                />
              </td>

              <!-- Status -->
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-2">
                  <!-- Modified Indicator -->
                  <UBadge v-if="item.isModified" color="warning" variant="subtle" size="xs">
                    Modified
                  </UBadge>

                  <!-- Price Variance Warning -->
                  <UTooltip
                    v-if="item.hasPriceVariance"
                    text="Price differs significantly from current WAC"
                  >
                    <UIcon
                      name="i-lucide-alert-triangle"
                      class="h-5 w-5 text-[var(--ui-warning)]"
                    />
                  </UTooltip>

                  <!-- Price Set Indicator -->
                  <UIcon
                    v-else-if="item.has_price && !item.isModified"
                    name="i-lucide-check-circle"
                    class="h-5 w-5 text-[var(--ui-success)]"
                  />

                  <!-- Price Missing Indicator -->
                  <UIcon
                    v-else-if="!item.editedPrice"
                    name="i-lucide-circle-dashed"
                    class="h-5 w-5 text-[var(--ui-text-muted)]"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="filteredPrices.length === 0" class="px-4 py-12">
        <EmptyState
          icon="i-lucide-search-x"
          title="No items found"
          description="Try adjusting your search or filters."
        />
      </div>
    </UCard>

    <!-- Footer Actions -->
    <UCard v-if="pricesData && pricesData.length > 0" class="card-elevated" :ui="{ body: 'p-4' }">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="text-caption text-[var(--ui-text-muted)]">
          <span v-if="hasChanges" class="flex items-center gap-2">
            <UIcon name="i-lucide-alert-circle" class="h-4 w-4 text-[var(--ui-warning)]" />
            You have {{ changesCount }} unsaved change{{ changesCount > 1 ? "s" : "" }}. Click "Save
            All" to apply them.
          </span>
          <span v-else class="flex items-center gap-2">
            <UIcon name="i-lucide-check-circle" class="h-4 w-4 text-[var(--ui-success)]" />
            All prices are saved.
          </span>
        </div>

        <UButton
          v-if="hasChanges"
          color="primary"
          size="lg"
          icon="i-lucide-save"
          :loading="saving"
          :disabled="!canSave || saving"
          class="cursor-pointer rounded-full px-6"
          @click="handleSaveAll"
        >
          Save All ({{ changesCount }})
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDateRange } from "~/utils/format";

// Props and route
const route = useRoute();
const periodId = computed(() => route.params.periodId as string);

// Composables
const { canSetItemPrices } = usePermissions();
const permissions = { canSetItemPrices };
const toast = useAppToast();
const locationStore = useLocationStore();

// State
const loading = ref(true);
const saving = ref(false);
const copying = ref(false);
const error = ref<string | null>(null);
const periodData = ref<any>(null);
const pricesData = ref<any[]>([]);
const originalPrices = ref<Map<string, number | null>>(new Map());

// Filters
const searchQuery = ref("");
const selectedCategory = ref<string | undefined>(undefined);

// Fetch prices on mount
onMounted(async () => {
  await fetchPrices();
});

// Fetch location stock for WAC comparison
const locationStock = ref<Map<string, number>>(new Map());

async function fetchPrices() {
  loading.value = true;
  error.value = null;

  try {
    // Fetch period prices
    const response = await $fetch(`/api/periods/${periodId.value}/prices`);
    periodData.value = response.period;

    // Fetch location stock for current location to get WAC values
    const activeLocationId = locationStore.activeLocation?.id;
    if (activeLocationId) {
      const stockResponse = (await $fetch(`/api/locations/${activeLocationId}/stock`)) as {
        stock?: Array<{ item_id: string; wac: string | number }>;
      };
      if (stockResponse.stock) {
        stockResponse.stock.forEach((s) => {
          locationStock.value.set(s.item_id, parseFloat(String(s.wac)) || 0);
        });
      }
    }

    // Process prices data
    pricesData.value = response.prices.map((item: any) => {
      const wac = locationStock.value.get(item.item_id) || null;
      const currentPrice = item.price ? parseFloat(item.price.toString()) : null;

      return {
        ...item,
        wac,
        editedPrice: currentPrice !== null ? currentPrice.toString() : "",
        originalPrice: currentPrice,
        isModified: false,
        hasPriceVariance: false,
      };
    });

    // Store original prices
    pricesData.value.forEach((item) => {
      originalPrices.value.set(item.item_id, item.originalPrice);
    });
  } catch (err: any) {
    console.error("Error fetching prices:", err);
    error.value = err.data?.message || "Failed to load prices";
  } finally {
    loading.value = false;
  }
}

// Handle price change
function handlePriceChange(item: any) {
  const editedValue = item.editedPrice ? parseFloat(item.editedPrice) : null;
  const originalValue = originalPrices.value.get(item.item_id);

  // Check if modified
  item.isModified = editedValue !== originalValue;

  // Check for price variance (>10% difference from WAC)
  if (editedValue !== null && item.wac !== null) {
    const variance = Math.abs((editedValue - item.wac) / item.wac) * 100;
    item.hasPriceVariance = variance > 10;
  } else {
    item.hasPriceVariance = false;
  }
}

// Computed properties
const categoryOptions = computed(() => {
  const categories = new Set<string>();
  pricesData.value.forEach((item) => {
    if (item.item_category) {
      categories.add(item.item_category);
    }
  });
  return Array.from(categories)
    .sort()
    .map((cat) => ({ label: cat, value: cat }));
});

const filteredPrices = computed(() => {
  let filtered = pricesData.value;

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.item_name.toLowerCase().includes(query) || item.item_code.toLowerCase().includes(query)
    );
  }

  // Filter by category
  if (selectedCategory.value) {
    filtered = filtered.filter((item) => item.item_category === selectedCategory.value);
  }

  return filtered;
});

const pricesSetCount = computed(() => {
  return pricesData.value.filter((item) => item.has_price).length;
});

const pricesMissingCount = computed(() => {
  return pricesData.value.filter((item) => !item.has_price).length;
});

const hasChanges = computed(() => {
  return pricesData.value.some((item) => item.isModified);
});

const changesCount = computed(() => {
  return pricesData.value.filter((item) => item.isModified).length;
});

const canSave = computed(() => {
  return hasChanges.value && periodData.value?.status === "DRAFT" && permissions.canSetItemPrices;
});

// Clear filters
function clearFilters() {
  searchQuery.value = "";
  selectedCategory.value = undefined;
}

// Get status badge color
type BadgeColor = "error" | "info" | "success" | "primary" | "secondary" | "warning" | "neutral";

function getStatusBadgeColor(status: string): BadgeColor {
  switch (status) {
    case "OPEN":
      return "success";
    case "DRAFT":
      return "warning";
    case "CLOSED":
      return "neutral";
    default:
      return "neutral";
  }
}

// Copy prices from previous period
async function handleCopyPrices() {
  if (periodData.value?.status === "CLOSED") return;

  copying.value = true;

  try {
    const response = await $fetch<{
      copied_count: number;
      source_period: { name: string };
    }>(`/api/periods/${periodId.value}/prices/copy`, {
      method: "POST",
    });

    toast.success("Prices Copied", {
      description: `Successfully copied ${response.copied_count} prices from ${response.source_period.name}`,
    });

    // Refresh data
    await fetchPrices();
  } catch (err: any) {
    console.error("Error copying prices:", err);
    toast.error("Copy Failed", {
      description: err.data?.message || "Failed to copy prices from previous period",
    });
  } finally {
    copying.value = false;
  }
}

// Save all prices
async function handleSaveAll() {
  if (!canSave.value) return;

  saving.value = true;

  try {
    // Collect modified prices
    const modifiedPrices = pricesData.value
      .filter((item) => item.isModified && item.editedPrice)
      .map((item) => ({
        item_id: item.item_id,
        price: parseFloat(item.editedPrice),
      }));

    if (modifiedPrices.length === 0) {
      toast.warning("No Changes", { description: "No prices to save" });
      return;
    }

    // Send update request
    const response = await $fetch<{ updated_count: number }>(
      `/api/periods/${periodId.value}/prices`,
      {
        method: "POST",
        body: { prices: modifiedPrices },
      }
    );

    toast.success("Prices Updated", {
      description: `Successfully updated ${response.updated_count} item prices`,
    });

    // Refresh data
    await fetchPrices();
  } catch (err: any) {
    console.error("Error saving prices:", err);
    toast.error("Save Failed", {
      description: err.data?.message || "Failed to save prices",
    });
  } finally {
    saving.value = false;
  }
}

// Page metadata
definePageMeta({
  middleware: ["role"],
  roleRequired: "ADMIN",
});

// Page title
useHead({
  title: "Set Item Prices - SM Stock Management",
});
</script>
