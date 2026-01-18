<template>
  <div>
    <!-- Loading Overlay -->
    <LoadingOverlay
      v-if="submitting"
      title="Creating Issue..."
      message="Please wait while we process your issue"
    />

    <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
      <!-- Page Header -->
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 sm:gap-4">
          <UIcon name="i-lucide-arrow-up-from-line" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-xl sm:text-3xl font-bold text-primary">New Issue</h1>
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
              Record a new stock issue to a cost centre
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
      </div>

      <!-- Issue Header Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <template #header>
          <h2 class="text-lg font-semibold text-[var(--ui-text)]">Issue Information</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Issue Date -->
          <div>
            <label class="form-label">Issue Date *</label>
            <UInput v-model="formData.issue_date" type="date" size="lg" class="w-full" />
          </div>

          <!-- Cost Centre -->
          <div>
            <label class="form-label">Cost Centre *</label>
            <USelectMenu
              v-model="formData.cost_centre"
              :items="costCentreOptions"
              value-key="value"
              placeholder="Select cost centre"
              size="lg"
              class="w-full"
            />
          </div>
        </div>
      </UCard>

      <!-- Issue Lines Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-[var(--ui-text)]">Issue Items</h2>
            <div class="flex items-center gap-2">
              <UButton
                icon="i-lucide-refresh-cw"
                color="primary"
                variant="outline"
                size="sm"
                class="cursor-pointer"
                :loading="syncing"
                :disabled="!isOnline || syncing"
                @click="syncStock"
              >
                Sync Stock
              </UButton>
              <UButton
                icon="i-lucide-plus"
                color="primary"
                variant="soft"
                size="sm"
                class="cursor-pointer"
                @click="addLine"
              >
                Add Item
              </UButton>
            </div>
          </div>
        </template>

        <!-- Insufficient Stock Warning -->
        <div v-if="hasInsufficientStock" class="mb-4">
          <UAlert
            icon="i-lucide-alert-triangle"
            color="error"
            variant="subtle"
            title="Insufficient Stock"
            :description="`${insufficientStockCount} item(s) have insufficient stock. Please reduce quantities.`"
          />
        </div>

        <!-- Lines Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--ui-border)]">
            <thead>
              <tr class="bg-[var(--ui-bg-elevated)]">
                <th class="px-4 py-3 text-left text-label uppercase">Item</th>
                <th class="px-4 py-3 text-left text-label uppercase">On Hand</th>
                <th class="px-4 py-3 text-left text-label uppercase">Quantity</th>
                <th class="px-4 py-3 text-left text-label uppercase">WAC</th>
                <th class="px-4 py-3 text-right text-label uppercase">Line Value</th>
                <th class="px-4 py-3 text-center text-label uppercase">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--ui-border)]">
              <tr
                v-for="line in lines"
                :key="line.id"
                :class="{
                  'bg-red-50 dark:bg-red-950/20': line.has_insufficient_stock,
                }"
              >
                <!-- Item Selection -->
                <td class="px-4 py-3">
                  <USelectMenu
                    v-model="line.item_id"
                    :items="items"
                    label-key="name"
                    value-key="id"
                    placeholder="Select item"
                    searchable
                    size="lg"
                    class="min-w-[200px]"
                  />
                </td>

                <!-- On Hand -->
                <td class="px-4 py-3">
                  <div v-if="line.item_id" class="flex items-center space-x-2">
                    <span class="text-body font-medium">
                      {{ line.on_hand.toFixed(4) }}
                    </span>
                    <UIcon
                      v-if="line.has_insufficient_stock"
                      name="i-lucide-alert-circle"
                      class="text-red-500"
                    />
                  </div>
                  <span v-else class="text-caption">-</span>
                </td>

                <!-- Quantity -->
                <td class="px-4 py-3">
                  <UInput
                    v-model="line.quantity"
                    type="number"
                    step="0.0001"
                    min="0"
                    placeholder="0.00"
                    size="lg"
                    class="w-32"
                  />
                </td>

                <!-- WAC (Read-only) -->
                <td class="px-4 py-3">
                  <span v-if="line.item_id" class="text-caption">
                    {{ formatCurrency(line.wac) }}
                  </span>
                  <span v-else class="text-caption">-</span>
                </td>

                <!-- Line Value -->
                <td class="px-4 py-3 text-right">
                  <span class="text-body font-medium">
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
                    class="cursor-pointer"
                    :disabled="lines.length === 1"
                    aria-label="Remove item from issue"
                    @click="removeLine(line.id)"
                  />
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-if="lines.length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-caption">
                  No items added yet. Click "Add Item" to start.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div class="mt-4 pt-4 border-t border-[var(--ui-border)]">
          <div class="flex justify-between items-center">
            <div class="text-caption">{{ lines.length }} item(s)</div>
            <div class="text-right">
              <div class="text-caption">Total Value</div>
              <div class="text-xl font-bold text-primary">
                {{ formatCurrency(totalValue) }}
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Form Actions -->
      <div class="flex justify-end space-x-3">
        <UButton
          color="error"
          variant="soft"
          size="lg"
          class="cursor-pointer"
          :disabled="submitting"
          @click="handleCancel"
        >
          Cancel
        </UButton>
        <UButton
          color="primary"
          size="lg"
          class="cursor-pointer"
          :loading="submitting"
          :disabled="!isFormValid || submitting || !isOnline"
          @click="submitIssue"
        >
          Create Issue
        </UButton>
      </div>
    </div>

    <!-- Unsaved Changes Confirmation Modal -->
    <UModal v-model:open="showDiscardModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-amber-500" />
              <h3 class="text-lg font-semibold text-[var(--ui-text)]">Discard Changes?</h3>
            </div>
          </template>

          <p class="text-[var(--ui-text-muted)]">
            You have unsaved changes. Are you sure you want to leave this page? Your changes will be
            lost.
          </p>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="outline"
                class="cursor-pointer"
                @click="showDiscardModal = false"
              >
                Keep Editing
              </UButton>
              <UButton color="error" class="cursor-pointer" @click="confirmCancel">
                Discard Changes
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from "~/utils/format";

// SEO
useSeoMeta({
  title: "New Issue - Stock Management System",
  description: "Record a new stock issue",
});

// Composables
const router = useRouter();
const locationStore = useLocationStore();
const permissions = usePermissions();
const { isOnline, guardAction } = useOfflineGuard();
const { handleError, handleSuccess } = useErrorHandler();

// State
const loading = ref(false);
const submitting = ref(false);
const syncing = ref(false);
const showDiscardModal = ref(false);
const items = ref<
  Array<{
    id: string;
    name: string;
    code: string;
    unit: string;
    location_stock?: Array<{ on_hand: number; wac: number }>;
  }>
>([]);
const stockLevels = ref<Record<string, { on_hand: number; wac: number }>>({}); // Map of itemId -> stock info

// Computed permission check
const hasIssuePermission = computed(() => permissions.canPostIssues());
const activeLocation = computed(() => locationStore.activeLocation);

// Form state
const formData = ref({
  issue_date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
  cost_centre: "FOOD" as "FOOD" | "CLEAN" | "OTHER",
});

// Issue lines state
const lines = ref<
  Array<{
    id: string;
    item_id: string;
    quantity: string;
    wac: number;
    line_value: number;
    on_hand: number;
    has_insufficient_stock: boolean;
  }>
>([]);

// Add initial empty line
const addLine = () => {
  lines.value.push({
    id: crypto.randomUUID(),
    item_id: "",
    quantity: "",
    wac: 0,
    line_value: 0,
    on_hand: 0,
    has_insufficient_stock: false,
  });
};

// Remove line
const removeLine = (id: string) => {
  lines.value = lines.value.filter((line) => line.id !== id);
};

// Calculate line value and check stock
const updateLineCalculations = (line: {
  id: string;
  item_id: string;
  quantity: string;
  wac: number;
  line_value: number;
  on_hand: number;
  has_insufficient_stock: boolean;
}) => {
  const quantity = parseFloat(line.quantity) || 0;

  // Get stock info for this item
  const stockInfo = stockLevels.value[line.item_id];
  if (stockInfo) {
    line.wac = stockInfo.wac;
    line.on_hand = stockInfo.on_hand;
    line.line_value = quantity * stockInfo.wac;

    // Check if quantity exceeds available stock
    line.has_insufficient_stock = quantity > stockInfo.on_hand;
  } else {
    line.wac = 0;
    line.on_hand = 0;
    line.line_value = 0;
    // If item has no stock record and quantity > 0, that's insufficient stock
    line.has_insufficient_stock = quantity > 0;
  }
};

// Computed
const totalValue = computed(() => {
  return lines.value.reduce((sum, line) => sum + line.line_value, 0);
});

const hasInsufficientStock = computed(() => {
  return lines.value.some((line) => line.has_insufficient_stock);
});

const insufficientStockCount = computed(() => {
  return lines.value.filter((line) => line.has_insufficient_stock).length;
});

const isFormValid = computed(() => {
  return (
    formData.value.issue_date &&
    formData.value.cost_centre &&
    lines.value.length > 0 &&
    lines.value.every((line) => line.item_id && line.quantity && parseFloat(line.quantity) > 0) &&
    !hasInsufficientStock.value
  );
});

// Check if form has unsaved changes
const hasUnsavedChanges = computed(() => {
  // Check if any line has been filled
  const hasLineChanges = lines.value.some(
    (line) => line.item_id !== "" || (line.quantity !== "" && line.quantity !== "0")
  );
  return hasLineChanges;
});

// Fetch items with stock levels
const fetchItems = async () => {
  if (!locationStore.activeLocation?.id) {
    handleError({ data: { message: "Please select a location first" } });
    return;
  }

  try {
    const data = await $fetch<{
      items: Array<{
        id: string;
        name: string;
        code: string;
        unit: string;
        location_stock?: Array<{ on_hand: number; wac: number }>;
      }>;
    }>("/api/items", {
      query: {
        limit: 200,
        is_active: true,
        locationId: locationStore.activeLocation.id,
      },
    });
    items.value = data.items || [];

    // Build stock levels map (convert Decimal strings to numbers)
    stockLevels.value = {};
    items.value.forEach((item) => {
      if (item.location_stock && item.location_stock.length > 0) {
        const stock = item.location_stock[0];
        if (stock) {
          stockLevels.value[item.id] = {
            on_hand: Number(stock.on_hand) || 0,
            wac: Number(stock.wac) || 0,
          };
        }
      }
    });
  } catch (error: unknown) {
    handleError(error, { context: "fetching items" });
  }
};

// Sync stock - populate lines with all items that have positive stock
const syncStock = async () => {
  syncing.value = true;
  try {
    // Filter items with positive stock
    const itemsWithStock = items.value.filter((item) => {
      const stock = stockLevels.value[item.id];
      return stock && stock.on_hand > 0;
    });

    // Handle empty stock edge case
    if (itemsWithStock.length === 0) {
      handleError({ data: { message: "No items with stock to sync" } });
      return;
    }

    // Transform to IssueLine array and replace existing lines
    lines.value = itemsWithStock.map((item) => {
      const stock = stockLevels.value[item.id]!;
      return {
        id: crypto.randomUUID(),
        item_id: item.id,
        quantity: "0",
        wac: stock.wac,
        line_value: 0,
        on_hand: stock.on_hand,
        has_insufficient_stock: false,
      };
    });
  } finally {
    syncing.value = false;
  }
};

// Submit form
const submitIssue = async () => {
  if (!isFormValid.value) {
    handleError("REQUIRED_FIELD");
    return;
  }

  if (!locationStore.activeLocation?.id) {
    handleError({ data: { message: "Please select a location before creating an issue" } });
    return;
  }

  if (!hasIssuePermission.value) {
    handleError("PERMISSION_DENIED");
    return;
  }

  // Guard against offline state
  await guardAction(
    async () => {
      submitting.value = true;

      try {
        // Prepare lines data
        const linesData = lines.value.map((line) => ({
          item_id: line.item_id,
          quantity: parseFloat(line.quantity),
        }));

        // Extract cost_centre value (handle both string and object formats)
        const costCentreValue =
          typeof formData.value.cost_centre === "object" &&
          formData.value.cost_centre !== null &&
          "value" in formData.value.cost_centre
            ? (formData.value.cost_centre as { value: string }).value
            : formData.value.cost_centre;

        // Submit issue
        const result = await $fetch<{ id: string }>(
          `/api/locations/${locationStore.activeLocation!.id}/issues`,
          {
            method: "post",
            body: {
              issue_date: formData.value.issue_date
                ? new Date(formData.value.issue_date).toISOString()
                : new Date().toISOString(),
              cost_centre: costCentreValue,
              lines: linesData,
            },
          }
        );

        handleSuccess(
          "Issue Created Successfully",
          "The issue has been recorded and stock levels have been updated."
        );

        // Redirect to issue detail page
        router.push(`/issues/${result.id}`);
      } catch (error: unknown) {
        console.error("Issue submission error:", error);
        handleError(error, { context: "creating issue" });
      } finally {
        submitting.value = false;
      }
    },
    {
      offlineMessage: "Cannot create issue",
      offlineDescription: "You need an internet connection to post issues.",
    }
  );
};

// Handle cancel with unsaved changes check
const handleCancel = () => {
  if (hasUnsavedChanges.value) {
    showDiscardModal.value = true;
  } else {
    router.push("/issues");
  }
};

// Confirm cancel and discard changes
const confirmCancel = () => {
  showDiscardModal.value = false;
  router.push("/issues");
};

// Cost centre options
const costCentreOptions = [
  { value: "FOOD", label: "Food" },
  { value: "CLEAN", label: "Cleaning" },
  { value: "OTHER", label: "Other" },
];

// Initialize
onMounted(async () => {
  // Check permission
  if (!hasIssuePermission.value) {
    handleError("PERMISSION_DENIED");
    router.push("/issues");
    return;
  }

  // Wait for location store to be ready
  if (!locationStore.activeLocation?.id) {
    await locationStore.fetchUserLocations();
  }

  // Fetch required data
  await fetchItems();

  // Add initial empty line
  addLine();
});

// Watch for item or quantity changes to update calculations
watch(
  lines,
  () => {
    lines.value.forEach((line) => updateLineCalculations(line));
  },
  { deep: true }
);

// Watch for location changes - refresh stock data
watch(
  () => locationStore.activeLocation?.id,
  async (newLocationId, oldLocationId) => {
    if (newLocationId && newLocationId !== oldLocationId) {
      // Reset lines to prevent stale stock data
      lines.value = [];

      // Re-fetch items with stock for the new location
      await fetchItems();

      // Add initial empty line
      addLine();
    }
  }
);
</script>
