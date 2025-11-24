<script setup lang="ts">
import { z } from "zod";
import { formatCurrency } from "~/utils/format";

// SEO
useSeoMeta({
  title: "New Transfer - Stock Management System",
  description: "Create a new stock transfer between locations",
});

// Composables
const router = useRouter();
const locationStore = useLocationStore();
const periodStore = usePeriodStore();
const authStore = useAuthStore();
const toast = useAppToast();
const permissions = usePermissions();

// State
const loading = ref(false);
const locations = ref<any[]>([]);
const items = ref<any[]>([]);
const stockLevels = ref<Record<string, { on_hand: number; wac: number }>>({}); // Map of itemId -> stock info

// Computed permission check
const hasTransferPermission = computed(() => {
  return permissions.canCreateTransfer(authStore.user?.default_location_id || "");
});

// Form state
const formData = ref({
  from_location_id: authStore.user?.default_location_id || "",
  to_location_id: "",
  transfer_date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
  notes: "",
});

// Transfer lines state
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

  // Get stock info for this item from source location
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
    formData.value.from_location_id &&
    formData.value.to_location_id &&
    formData.value.from_location_id !== formData.value.to_location_id &&
    formData.value.transfer_date &&
    lines.value.length > 0 &&
    lines.value.every((line) => line.item_id && line.quantity && parseFloat(line.quantity) > 0) &&
    !hasInsufficientStock.value
  );
});

// Get available "to" locations (exclude from location)
const availableToLocations = computed(() => {
  return locations.value.filter((loc) => loc.id !== formData.value.from_location_id);
});

// Get item by ID
const getItemById = (itemId: string) => {
  return items.value.find((item) => item.id === itemId);
};

// Fetch user's accessible locations
const fetchLocations = async () => {
  try {
    const data: any = await $fetch("/api/user/locations");
    locations.value = data?.locations || [];
  } catch (error: any) {
    toast.error("Failed to fetch locations", error.message);
  }
};

// Fetch items with stock levels for source location
const fetchItemsForLocation = async (locationId: string) => {
  if (!locationId) return;

  try {
    const data: any = await $fetch("/api/items", {
      query: {
        limit: 200, // Get items for dropdown (API max is 200)
        is_active: "true",
        locationId: locationId, // Include stock data for source location
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

    // Update line calculations after fetching new stock data
    lines.value.forEach((line) => updateLineCalculations(line));
  } catch (error: any) {
    toast.error("Failed to fetch items", error.message);
  }
};

// Submit form
const submitTransfer = async () => {
  if (!isFormValid.value) {
    toast.error("Please fill in all required fields");
    return;
  }

  if (!hasTransferPermission.value) {
    toast.error("You do not have permission to create transfers");
    return;
  }

  loading.value = true;

  try {
    // Prepare lines data
    const linesData = lines.value.map((line) => ({
      item_id: line.item_id,
      quantity: parseFloat(line.quantity),
    }));

    // Submit transfer
    const result: any = await $fetch("/api/transfers", {
      method: "POST",
      body: {
        from_location_id: formData.value.from_location_id,
        to_location_id: formData.value.to_location_id,
        transfer_date: formData.value.transfer_date
          ? new Date(formData.value.transfer_date).toISOString()
          : new Date().toISOString(),
        notes: formData.value.notes || null,
        lines: linesData,
      },
    });

    toast.success("Transfer created successfully", {
      description: "Transfer is pending approval",
    });

    // Redirect to transfer detail page
    router.push(`/transfers/${result.id}`);
  } catch (error: any) {
    console.error("Transfer submission error:", error);

    // Check for insufficient stock error
    if (error.data?.code === "INSUFFICIENT_STOCK" && error.data?.details?.insufficient_items) {
      const items = error.data.details.insufficient_items;
      const itemList = items
        .map(
          (item: any) =>
            `${item.item_name}: requested ${item.requested}, available ${item.available}`
        )
        .join("; ");
      toast.error("Insufficient Stock", {
        description: `Cannot create transfer. ${itemList}`,
      });
    } else if (error.data?.code === "SAME_LOCATION") {
      toast.error("Invalid Transfer", {
        description: "From and To locations must be different",
      });
    } else {
      toast.error("Failed to create transfer", {
        description: error.data?.message || error.message,
      });
    }
  } finally {
    loading.value = false;
  }
};

// Cancel and go back
const cancel = () => {
  router.push("/transfers");
};

// Initialize
onMounted(async () => {
  // Check permission
  if (!hasTransferPermission.value) {
    toast.error("You do not have permission to create transfers");
    router.push("/transfers");
    return;
  }

  // Fetch required data
  await fetchLocations();

  // If default location is set, fetch items for it
  if (formData.value.from_location_id) {
    await fetchItemsForLocation(formData.value.from_location_id);
  }

  // Add initial empty line
  addLine();
});

// Watch for from_location changes to refetch items with new stock levels
watch(
  () => formData.value.from_location_id,
  async (newLocationId) => {
    if (newLocationId) {
      await fetchItemsForLocation(newLocationId);
    } else {
      items.value = [];
      stockLevels.value = {};
    }
  }
);

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
      title="New Transfer"
      icon="i-lucide-arrow-left-right"
      :show-location="false"
      :show-period="true"
      location-scope="none"
    />

    <!-- Main Form -->
    <div class="space-y-6">
      <!-- Transfer Header Card -->
      <UCard class="card-elevated">
        <template #header>
          <h2 class="text-subheading font-semibold">Transfer Information</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- From Location -->
          <div>
            <label class="form-label">From Location *</label>
            <USelectMenu
              v-model="formData.from_location_id"
              :options="locations"
              option-attribute="name"
              value-attribute="id"
              placeholder="Select source location"
              searchable
            />
          </div>

          <!-- To Location -->
          <div>
            <label class="form-label">To Location *</label>
            <USelectMenu
              v-model="formData.to_location_id"
              :options="availableToLocations"
              option-attribute="name"
              value-attribute="id"
              placeholder="Select destination location"
              searchable
              :disabled="!formData.from_location_id"
            />
            <p v-if="!formData.from_location_id" class="text-caption mt-1">
              Please select a source location first
            </p>
          </div>

          <!-- Transfer Date -->
          <div>
            <label class="form-label">Transfer Date *</label>
            <UInput v-model="formData.transfer_date" type="date" />
          </div>

          <!-- Notes -->
          <div class="md:col-span-2">
            <label class="form-label">Notes</label>
            <UTextarea
              v-model="formData.notes"
              placeholder="Add any notes about this transfer"
              :rows="3"
            />
          </div>
        </div>
      </UCard>

      <!-- Transfer Lines Card -->
      <UCard class="card-elevated">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-subheading font-semibold">Transfer Items</h2>
            <UButton
              icon="i-lucide-plus"
              color="primary"
              variant="soft"
              size="sm"
              @click="addLine"
              :disabled="!formData.from_location_id"
            >
              Add Item
            </UButton>
          </div>
        </template>

        <!-- No Source Location Warning -->
        <div v-if="!formData.from_location_id" class="mb-4">
          <UAlert
            icon="i-lucide-info"
            color="primary"
            variant="subtle"
            title="Select Source Location"
            description="Please select a source location to add items to the transfer"
          />
        </div>

        <!-- Insufficient Stock Warning -->
        <div v-if="hasInsufficientStock" class="mb-4">
          <UAlert
            icon="i-lucide-alert-triangle"
            color="error"
            variant="subtle"
            title="Insufficient Stock"
            :description="`${insufficientStockCount} item(s) have insufficient stock at source location. Please reduce quantities.`"
          />
        </div>

        <!-- Lines Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-default">
            <thead>
              <tr class="bg-default">
                <th class="px-4 py-3 text-left text-label uppercase">Item</th>
                <th class="px-4 py-3 text-left text-label uppercase">On Hand (Source)</th>
                <th class="px-4 py-3 text-left text-label uppercase">Quantity</th>
                <th class="px-4 py-3 text-left text-label uppercase">WAC</th>
                <th class="px-4 py-3 text-right text-label uppercase">Line Value</th>
                <th class="px-4 py-3 text-center text-label uppercase">Action</th>
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
                    :options="items"
                    option-attribute="name"
                    value-attribute="id"
                    placeholder="Select item"
                    searchable
                    class="min-w-[200px]"
                    :disabled="!formData.from_location_id"
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
        <UButton color="neutral" variant="soft" @click="cancel" :disabled="loading">
          Cancel
        </UButton>
        <UButton
          color="primary"
          :loading="loading"
          :disabled="!isFormValid || loading"
          @click="submitTransfer"
        >
          Create Transfer
        </UButton>
      </div>
    </div>
  </div>
</template>
