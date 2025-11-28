<script setup lang="ts">
import { z } from "zod";
import { formatCurrency } from "~/utils/format";

// SEO
useSeoMeta({
  title: "New Issue - Stock Management System",
  description: "Record a new stock issue",
});

// Composables
const router = useRouter();
const locationStore = useLocationStore();
const periodStore = usePeriodStore();
const toast = useAppToast();
const permissions = usePermissions();
const { isOnline, guardAction } = useOfflineGuard();
const { handleError, handleSuccess } = useErrorHandler();

// State
const loading = ref(false);
const items = ref<any[]>([]);
const stockLevels = ref<Record<string, { on_hand: number; wac: number }>>({}); // Map of itemId -> stock info

// Computed permission check
const hasIssuePermission = computed(() => permissions.canPostIssues());

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
const updateLineCalculations = (line: any) => {
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
    line.has_insufficient_stock = false;
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

// Get item by ID
const getItemById = (itemId: string) => {
  return items.value.find((item) => item.id === itemId);
};

// Fetch items with stock levels
const fetchItems = async () => {
  if (!locationStore.activeLocation?.id) {
    handleError({ data: { message: "Please select a location first" } });
    return;
  }

  try {
    const data: any = await $fetch("/api/items", {
      query: {
        limit: 500, // Get more items for dropdown
        is_active: true,
        locationId: locationStore.activeLocation.id, // Include stock data
      },
    });
    items.value = data.items || [];

    // Build stock levels map
    stockLevels.value = {};
    items.value.forEach((item: any) => {
      if (item.location_stock && item.location_stock.length > 0) {
        const stock = item.location_stock[0];
        stockLevels.value[item.id] = {
          on_hand: stock.on_hand,
          wac: stock.wac,
        };
      }
    });
  } catch (error: any) {
    handleError(error, { context: "fetching items" });
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
      loading.value = true;

      try {
        // Prepare lines data
        const linesData = lines.value.map((line) => ({
          item_id: line.item_id,
          quantity: parseFloat(line.quantity),
        }));

        // Submit issue
        const result: any = await $fetch(
          `/api/locations/${locationStore.activeLocation!.id}/issues`,
          {
            method: "POST",
            body: {
              issue_date: formData.value.issue_date
                ? new Date(formData.value.issue_date).toISOString()
                : new Date().toISOString(),
              cost_centre: formData.value.cost_centre,
              lines: linesData,
            },
          }
        );

        handleSuccess("Issue Created Successfully", "The issue has been recorded and stock levels have been updated.");

        // Redirect to issue detail page
        router.push(`/issues/${result.id}`);
      } catch (error: any) {
        console.error("Issue submission error:", error);
        handleError(error, { context: "creating issue" });
      } finally {
        loading.value = false;
      }
    },
    {
      offlineMessage: "Cannot create issue",
      offlineDescription: "You need an internet connection to post issues.",
    }
  );
};

// Cancel and go back
const cancel = () => {
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
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <LayoutPageHeader
      title="New Issue"
      icon="i-lucide-arrow-up-from-line"
      :show-location="true"
      :show-period="true"
      location-scope="current"
    />

    <!-- Main Form -->
    <div class="space-y-6">
      <!-- Issue Header Card -->
      <UCard class="card-elevated">
        <template #header>
          <h2 class="text-subheading font-semibold">Issue Information</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Issue Date -->
          <div>
            <label class="form-label">Issue Date *</label>
            <UInput v-model="formData.issue_date" type="date" />
          </div>

          <!-- Cost Centre -->
          <div>
            <label class="form-label">Cost Centre *</label>
            <USelectMenu
              v-model="formData.cost_centre"
              :items="costCentreOptions"
              value-key="value"
              placeholder="Select cost centre"
            />
          </div>

          <!-- Location (Read-only) -->
          <div>
            <label class="form-label">Location</label>
            <UInput :model-value="locationStore.activeLocation?.name" readonly disabled />
          </div>
        </div>
      </UCard>

      <!-- Issue Lines Card -->
      <UCard class="card-elevated">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-subheading font-semibold">Issue Items</h2>
            <UButton icon="i-lucide-plus" color="primary" variant="soft" size="sm" class="cursor-pointer" @click="addLine">
              Add Item
            </UButton>
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
          <table class="min-w-full divide-y divide-default">
            <thead>
              <tr class="bg-default">
                <th class="px-4 py-3 text-left text-label uppercase">Item</th>
                <th class="px-4 py-3 text-left text-label uppercase">
                  On Hand
                </th>
                <th class="px-4 py-3 text-left text-label uppercase">
                  Quantity
                </th>
                <th class="px-4 py-3 text-left text-label uppercase">WAC</th>
                <th class="px-4 py-3 text-right text-label uppercase">
                  Line Value
                </th>
                <th class="px-4 py-3 text-center text-label uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
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
                    :disabled="lines.length === 1"
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
        <div class="mt-4 pt-4 border-t border-default">
          <div class="flex justify-between items-center">
            <div class="text-caption">{{ lines.length }} item(s)</div>
            <div class="text-right">
              <div class="text-caption">Total Value</div>
              <div class="text-heading font-bold text-primary">
                {{ formatCurrency(totalValue) }}
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Form Actions -->
      <div class="flex justify-end space-x-3">
        <UButton color="neutral" variant="soft" class="cursor-pointer" @click="cancel" :disabled="loading">Cancel</UButton>
        <UButton
          color="primary"
          class="cursor-pointer"
          :loading="loading"
          :disabled="!isFormValid || loading || !isOnline"
          @click="submitIssue"
        >
          Create Issue
        </UButton>
      </div>
    </div>
  </div>
</template>
