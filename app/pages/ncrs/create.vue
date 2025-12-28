<script setup lang="ts">
import { formatCurrency, formatDate } from "~/utils/format";

// SEO
useSeoMeta({
  title: "New NCR - Stock Management System",
  description: "Create a new Non-Conformance Report",
});

// Composables
const router = useRouter();
const locationStore = useLocationStore();
const toast = useAppToast();
const permissions = usePermissions();
const { handleError, handleSuccess } = useErrorHandler();

// State
const loading = ref(false);
const loadingDeliveries = ref(false);
const locations = ref<
  Array<{
    id: string;
    code: string;
    name: string;
    type: string;
  }>
>([]);
const items = ref<
  Array<{
    id: string;
    code: string;
    name: string;
    unit: string;
    category?: string;
  }>
>([]);
const deliveries = ref<
  Array<{
    id: string;
    delivery_no: string;
    delivery_date: string;
    invoice_no: string | null;
    total_amount: number;
    has_variance: boolean;
    line_count: number;
    supplier: {
      code: string;
      name: string;
    };
    period: {
      name: string;
    };
    posted_by: {
      full_name: string;
    };
    lines?: Array<{
      id: string;
      quantity: number;
      unit_price: number;
      line_value: number;
      item: {
        id: string;
        code: string;
        name: string;
        unit: string;
      };
    }>;
  }>
>([]);

// Computed permission check
const hasNCRPermission = computed(() => permissions.canCreateNCR());

// Get selected delivery details
const selectedDelivery = computed(() => {
  if (!formData.value.delivery_id) return null;
  return deliveries.value.find((d) => d.id === formData.value.delivery_id) || null;
});

// Form state - start with no location selected (user must choose)
const formData = ref({
  location_id: "",
  delivery_id: "",
  reason: "",
});

// NCR lines state - for tracking individual items in the NCR
const lines = ref<
  Array<{
    id: string;
    item_id: string;
    quantity: string;
    unit_value: string;
    line_value: number;
    is_auto_filled: boolean; // Track if unit_value was auto-filled from delivery
  }>
>([
  {
    id: crypto.randomUUID(),
    item_id: "",
    quantity: "",
    unit_value: "",
    line_value: 0,
    is_auto_filled: false,
  },
]);

// Add new line
const addLine = () => {
  lines.value.push({
    id: crypto.randomUUID(),
    item_id: "",
    quantity: "",
    unit_value: "",
    line_value: 0,
    is_auto_filled: false,
  });
};

// Remove line
const removeLine = (id: string) => {
  lines.value = lines.value.filter((line) => line.id !== id);
};

// Calculate line value
const updateLineValue = (line: { quantity: string; unit_value: string; line_value: number }) => {
  const quantity = parseFloat(line.quantity) || 0;
  const unitValue = parseFloat(line.unit_value) || 0;
  line.line_value = quantity * unitValue;
};

// Get item by ID
const getItemById = (itemId: string) => {
  return items.value.find((item) => item.id === itemId);
};

// Get delivery line for a specific item from the selected delivery
const getDeliveryLineForItem = (itemId: string) => {
  if (!selectedDelivery.value?.lines) return null;
  return selectedDelivery.value.lines.find((line) => line.item.id === itemId) || null;
};

// Handle item selection - auto-fill unit value from delivery if available
const onItemSelected = (line: (typeof lines.value)[0], itemId: string) => {
  line.item_id = itemId;

  // Check if this item exists in the selected delivery
  const deliveryLine = getDeliveryLineForItem(itemId);

  if (deliveryLine) {
    // Auto-fill from delivery line
    line.unit_value = deliveryLine.unit_price.toString();
    line.is_auto_filled = true;
  } else {
    // Clear auto-fill status if item not in delivery
    line.unit_value = "";
    line.is_auto_filled = false;
  }

  updateLineValue(line);
};

// Computed
const totalValue = computed(() => {
  return lines.value.reduce((sum, line) => sum + line.line_value, 0);
});

const totalQuantity = computed(() => {
  return lines.value.reduce((sum, line) => sum + (parseFloat(line.quantity) || 0), 0);
});

// Location options for dropdown
const locationOptions = computed(() => {
  return locations.value.map((loc) => ({
    label: `${loc.name} (${loc.code})`,
    value: loc.id,
  }));
});

// Delivery options for dropdown
const deliveryOptions = computed(() => {
  if (!deliveries.value || deliveries.value.length === 0) {
    return [];
  }
  return deliveries.value.map((delivery) => ({
    label: `${delivery.delivery_no} - ${delivery.supplier?.name || "Unknown"} (${formatCurrency(delivery.total_amount)})`,
    value: delivery.id,
  }));
});

// Filtered items based on selected delivery
// If a delivery is selected, only show items from that delivery
// Otherwise, show all items
const filteredItems = computed(() => {
  if (!selectedDelivery.value?.lines || selectedDelivery.value.lines.length === 0) {
    // No delivery selected or delivery has no lines - show all items
    return items.value;
  }

  // Get item IDs from the selected delivery
  const deliveryItemIds = new Set(selectedDelivery.value.lines.map((line) => line.item.id));

  // Filter items to only those in the delivery
  return items.value.filter((item) => deliveryItemIds.has(item.id));
});

// Check if items are being filtered by delivery
const isItemsFiltered = computed(() => {
  return selectedDelivery.value?.lines && selectedDelivery.value.lines.length > 0;
});

const isFormValid = computed(() => {
  // Check required fields
  if (!formData.value.location_id || !formData.value.reason) {
    return false;
  }

  // Check if there's at least one valid line
  const hasValidLines = lines.value.some((line) => {
    return (
      line.item_id &&
      parseFloat(line.quantity) > 0 &&
      parseFloat(line.unit_value) > 0 &&
      line.line_value > 0
    );
  });

  // Check if total value is positive
  return hasValidLines && totalValue.value > 0;
});

// Build detailed reason with item breakdown
const buildDetailedReason = () => {
  const itemDetails = lines.value
    .filter((line) => line.item_id && parseFloat(line.quantity) > 0)
    .map((line) => {
      const item = getItemById(line.item_id);
      const itemName = item ? `${item.name} (${item.code})` : "Unknown Item";
      const qty = parseFloat(line.quantity);
      const unitVal = parseFloat(line.unit_value);
      const unit = item?.unit || "";
      return `${itemName}: ${qty} ${unit} @ ${formatCurrency(unitVal)} = ${formatCurrency(line.line_value)}`;
    })
    .join("\n");

  return `${formData.value.reason}\n\nItem Breakdown:\n${itemDetails}\n\nTotal: ${formatCurrency(totalValue.value)}`;
};

// Submit handler
const handleSubmit = async () => {
  if (!isFormValid.value) {
    handleError("REQUIRED_FIELD");
    return;
  }

  if (!hasNCRPermission.value) {
    handleError("PERMISSION_DENIED");
    return;
  }

  loading.value = true;

  try {
    const detailedReason = buildDetailedReason();

    const response = await $fetch<{
      ncr: {
        id: string;
        ncr_no: string;
      };
    }>("/api/ncrs", {
      method: "POST",
      body: {
        location_id: formData.value.location_id,
        delivery_id: formData.value.delivery_id || undefined,
        reason: detailedReason,
        quantity: totalQuantity.value,
        value: totalValue.value,
      },
    });

    handleSuccess(
      "NCR Created Successfully",
      `NCR ${response.ncr.ncr_no} has been created and is pending review.`
    );
    router.push(`/ncrs/${response.ncr.id}`);
  } catch (error: unknown) {
    console.error("NCR submission error:", error);
    handleError(error, { context: "creating NCR" });
  } finally {
    loading.value = false;
  }
};

// Cancel handler
const handleCancel = () => {
  router.push("/ncrs");
};

// Fetch locations
const fetchLocations = async () => {
  try {
    const response = await $fetch<{
      locations: Array<{
        id: string;
        code: string;
        name: string;
        type: string;
      }>;
    }>("/api/locations");
    locations.value = response.locations;
  } catch (error) {
    console.error("Error fetching locations:", error);
    handleError(error, { context: "fetching locations" });
  }
};

// Fetch items
const fetchItems = async () => {
  try {
    const response = await $fetch<{
      items: Array<{
        id: string;
        code: string;
        name: string;
        unit: string;
        category?: string;
      }>;
    }>("/api/items", {
      params: {
        limit: 200,
        is_active: "true",
      },
    });
    items.value = response.items;
  } catch (error) {
    console.error("Error fetching items:", error);
    handleError(error, { context: "fetching items" });
  }
};

// Fetch deliveries for selected location (with line items for info display)
const fetchDeliveries = async () => {
  if (!formData.value.location_id) {
    deliveries.value = [];
    return;
  }

  loadingDeliveries.value = true;
  try {
    const response = await $fetch<{
      deliveries: Array<{
        id: string;
        delivery_no: string;
        delivery_date: string;
        invoice_no: string | null;
        total_amount: number;
        has_variance: boolean;
        line_count: number;
        supplier: {
          code: string;
          name: string;
        };
        period: {
          name: string;
        };
        posted_by: {
          full_name: string;
        };
        lines?: Array<{
          id: string;
          quantity: number;
          unit_price: number;
          line_value: number;
          item: {
            id: string;
            code: string;
            name: string;
            unit: string;
          };
        }>;
      }>;
    }>(`/api/locations/${formData.value.location_id}/deliveries`, {
      params: {
        includeLines: true,
      },
    });
    deliveries.value = response.deliveries;
  } catch (error) {
    console.error("Error fetching deliveries:", error);
  } finally {
    loadingDeliveries.value = false;
  }
};

// Watch location changes to refresh deliveries
watch(
  () => formData.value.location_id,
  (newLocationId) => {
    if (newLocationId) {
      fetchDeliveries();
    } else {
      deliveries.value = [];
    }
    // Reset delivery selection when location changes
    formData.value.delivery_id = "";
  }
);

// Watch delivery changes to update auto-fill status for all lines
watch(
  () => formData.value.delivery_id,
  (newDeliveryId) => {
    // Get the new selected delivery
    const newDelivery = newDeliveryId ? deliveries.value.find((d) => d.id === newDeliveryId) : null;

    // Get item IDs from the new delivery (if any)
    const deliveryItemIds = newDelivery?.lines
      ? new Set(newDelivery.lines.map((line) => line.item.id))
      : null;

    // Re-check all lines when delivery changes
    lines.value.forEach((line) => {
      if (line.item_id) {
        // If a delivery is now selected and item is NOT in that delivery, clear it
        if (deliveryItemIds && !deliveryItemIds.has(line.item_id)) {
          line.item_id = "";
          line.quantity = "";
          line.unit_value = "";
          line.line_value = 0;
          line.is_auto_filled = false;
        } else {
          // Item is in delivery (or no delivery selected) - update auto-fill
          const deliveryLine = getDeliveryLineForItem(line.item_id);
          if (deliveryLine) {
            line.unit_value = deliveryLine.unit_price.toString();
            line.is_auto_filled = true;
          } else {
            line.is_auto_filled = false;
          }
          updateLineValue(line);
        }
      }
    });
  }
);

// Initial load
onMounted(async () => {
  await Promise.all([fetchLocations(), fetchItems()]);
  // Fetch deliveries after locations are loaded (if location is already set)
  if (formData.value.location_id) {
    await fetchDeliveries();
  }
});
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-alert-circle" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">New Non-Conformance Report</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Create a manual NCR for quality or compliance issues
          </p>
        </div>
      </div>
    </div>

    <!-- Main Form -->
    <div class="space-y-3">
      <!-- NCR Information Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <h2 class="text-lg font-semibold mb-4">NCR Information</h2>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Location -->
          <div>
            <label class="form-label">Location *</label>
            <USelectMenu
              v-model="formData.location_id"
              :items="locationOptions"
              value-key="value"
              placeholder="Select location"
              searchable
              size="lg"
              class="w-full"
            />
          </div>

          <!-- Delivery (Optional) -->
          <div>
            <label class="form-label">Related Delivery (Optional)</label>
            <div class="flex gap-2">
              <USelectMenu
                v-model="formData.delivery_id"
                :items="deliveryOptions"
                value-key="value"
                :placeholder="loadingDeliveries ? 'Loading deliveries...' : 'No delivery selected'"
                searchable
                size="lg"
                class="flex-1"
                :disabled="!formData.location_id || loadingDeliveries"
                :loading="loadingDeliveries"
              />
              <UButton
                v-if="formData.delivery_id"
                icon="i-lucide-x"
                color="neutral"
                variant="soft"
                size="lg"
                class="cursor-pointer"
                aria-label="Clear delivery selection"
                @click="formData.delivery_id = ''"
              />
            </div>
            <p class="mt-1 text-caption">Link this NCR to a specific delivery if applicable</p>
          </div>

          <!-- Selected Delivery Info -->
          <div v-if="selectedDelivery" class="lg:col-span-2">
            <UCard variant="subtle" class="bg-[var(--ui-bg-muted)]" :ui="{ body: 'p-4' }">
              <div class="flex items-center gap-2 mb-3">
                <UIcon name="i-lucide-truck" class="w-5 h-5 text-primary" />
                <h3 class="font-semibold">Selected Delivery Details</h3>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <dt class="text-caption">Delivery No</dt>
                  <dd class="text-body font-medium">{{ selectedDelivery.delivery_no }}</dd>
                </div>
                <div>
                  <dt class="text-caption">Delivery Date</dt>
                  <dd class="text-body font-medium">
                    {{ formatDate(selectedDelivery.delivery_date) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-caption">Supplier</dt>
                  <dd class="text-body font-medium">{{ selectedDelivery.supplier.name }}</dd>
                </div>
                <div>
                  <dt class="text-caption">Total Amount</dt>
                  <dd class="text-body font-medium">
                    {{ formatCurrency(selectedDelivery.total_amount) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-caption">Period</dt>
                  <dd class="text-body font-medium">{{ selectedDelivery.period.name }}</dd>
                </div>
                <div>
                  <dt class="text-caption">Items</dt>
                  <dd class="text-body font-medium">{{ selectedDelivery.line_count }} item(s)</dd>
                </div>
                <div v-if="selectedDelivery.invoice_no">
                  <dt class="text-caption">Invoice No</dt>
                  <dd class="text-body font-medium">{{ selectedDelivery.invoice_no }}</dd>
                </div>
                <div v-if="selectedDelivery.has_variance">
                  <dt class="text-caption">Status</dt>
                  <dd>
                    <UBadge color="warning" variant="subtle">Has Price Variance</UBadge>
                  </dd>
                </div>
              </div>

              <!-- Delivery Items Section -->
              <div
                v-if="selectedDelivery.lines && selectedDelivery.lines.length > 0"
                class="mt-4 pt-4 border-t border-[var(--ui-border)]"
              >
                <div class="flex items-center gap-2 mb-3">
                  <UIcon name="i-lucide-package" class="w-4 h-4 text-[var(--ui-text-muted)]" />
                  <h4 class="text-sm font-medium">Delivery Items</h4>
                </div>
                <div class="max-h-48 overflow-y-auto">
                  <table class="min-w-full text-sm">
                    <thead class="sticky top-0 bg-[var(--ui-bg-muted)]">
                      <tr>
                        <th class="py-1.5 pr-3 text-left text-caption font-medium">Item</th>
                        <th class="py-1.5 px-3 text-right text-caption font-medium">Qty</th>
                        <th class="py-1.5 px-3 text-right text-caption font-medium">Unit Price</th>
                        <th class="py-1.5 pl-3 text-right text-caption font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-[var(--ui-border-muted)]">
                      <tr v-for="line in selectedDelivery.lines" :key="line.id">
                        <td class="py-1.5 pr-3">
                          <span class="font-medium">{{ line.item.name }}</span>
                          <span class="text-caption ml-1">({{ line.item.code }})</span>
                        </td>
                        <td class="py-1.5 px-3 text-right">
                          {{ line.quantity }} {{ line.item.unit }}
                        </td>
                        <td class="py-1.5 px-3 text-right">
                          {{ formatCurrency(line.unit_price) }}
                        </td>
                        <td class="py-1.5 pl-3 text-right font-medium">
                          {{ formatCurrency(line.line_value) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Reason -->
          <div class="lg:col-span-2">
            <label class="form-label">Reason *</label>
            <UTextarea
              v-model="formData.reason"
              placeholder="Describe the non-conformance issue..."
              :rows="3"
              class="w-full"
            />
            <p class="mt-1 text-caption">
              Item details will be automatically appended to this reason
            </p>
          </div>
        </div>
      </UCard>

      <!-- NCR Items Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold">NCR Items</h2>
            <p v-if="isItemsFiltered" class="text-caption flex items-center gap-1 mt-1">
              <UIcon name="i-lucide-filter" class="w-3 h-3" />
              Showing only items from selected delivery ({{ filteredItems.length }} item{{
                filteredItems.length !== 1 ? "s" : ""
              }})
            </p>
          </div>
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

        <!-- Lines Table -->
        <div class="overflow-x-auto -mx-3 sm:-mx-4">
          <div class="inline-block min-w-full align-middle">
            <table class="min-w-full divide-y divide-[var(--ui-border)]">
              <thead>
                <tr class="bg-[var(--ui-bg-elevated)]">
                  <th class="px-3 sm:px-4 py-3 text-left text-label uppercase">Item</th>
                  <th class="px-3 sm:px-4 py-3 text-left text-label uppercase">Quantity</th>
                  <th class="px-3 sm:px-4 py-3 text-left text-label uppercase">Unit Value</th>
                  <th class="px-3 sm:px-4 py-3 text-right text-label uppercase">Line Value</th>
                  <th class="px-3 sm:px-4 py-3 text-center text-label uppercase">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--ui-border)]">
                <tr v-for="line in lines" :key="line.id">
                  <!-- Item Selection -->
                  <td class="px-3 sm:px-4 py-3">
                    <USelectMenu
                      :model-value="line.item_id"
                      :items="filteredItems"
                      label-key="name"
                      value-key="id"
                      placeholder="Select item"
                      searchable
                      size="lg"
                      class="min-w-[200px]"
                      @update:model-value="(val: string) => onItemSelected(line, val)"
                    />
                  </td>

                  <!-- Quantity -->
                  <td class="px-3 sm:px-4 py-3">
                    <UInput
                      v-model="line.quantity"
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="0.00"
                      size="lg"
                      class="w-28"
                      @update:model-value="updateLineValue(line)"
                    />
                  </td>

                  <!-- Unit Value -->
                  <td class="px-3 sm:px-4 py-3">
                    <div class="relative">
                      <UInput
                        v-model="line.unit_value"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        size="lg"
                        class="w-28"
                        :disabled="line.is_auto_filled"
                        @update:model-value="updateLineValue(line)"
                      />
                      <UTooltip
                        v-if="line.is_auto_filled"
                        text="Auto-filled from delivery"
                        :popper="{ placement: 'top' }"
                      >
                        <UIcon
                          name="i-lucide-lock"
                          class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ui-text-muted)]"
                        />
                      </UTooltip>
                    </div>
                  </td>

                  <!-- Line Value -->
                  <td class="px-3 sm:px-4 py-3 text-right">
                    <span class="text-body font-medium">
                      {{ formatCurrency(line.line_value) }}
                    </span>
                  </td>

                  <!-- Action -->
                  <td class="px-3 sm:px-4 py-3 text-center">
                    <UButton
                      icon="i-lucide-trash-2"
                      color="error"
                      variant="ghost"
                      size="sm"
                      class="cursor-pointer"
                      :disabled="lines.length === 1"
                      aria-label="Remove line item"
                      @click="removeLine(line.id)"
                    />
                  </td>
                </tr>

                <!-- Empty State -->
                <tr v-if="lines.length === 0">
                  <td colspan="5" class="px-3 sm:px-4 py-8 text-center text-caption">
                    No items added yet. Click "Add Item" to start.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Validation Warning -->
        <div v-if="!isFormValid && lines.some((l) => l.item_id)" class="mt-4">
          <UAlert
            icon="i-lucide-alert-triangle"
            color="warning"
            variant="subtle"
            title="Please complete all item lines"
            description="Each item must have a quantity and unit value greater than zero."
          />
        </div>

        <!-- Summary -->
        <div class="mt-4 pt-4 border-t border-[var(--ui-border)]">
          <div class="flex justify-between items-center">
            <div class="text-caption">{{ lines.length }} item(s)</div>
            <div class="text-right">
              <div class="text-caption">Total NCR Value</div>
              <div class="text-2xl font-bold text-primary">
                {{ formatCurrency(totalValue) }}
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Form Actions -->
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          class="cursor-pointer"
          size="lg"
          @click="handleCancel"
          :disabled="loading"
        >
          Cancel
        </UButton>
        <UButton
          color="primary"
          class="cursor-pointer"
          size="lg"
          :loading="loading"
          :disabled="!isFormValid || loading"
          @click="handleSubmit"
        >
          Create NCR
        </UButton>
      </div>
    </div>

    <!-- Loading Overlay -->
    <LoadingOverlay v-if="loading" title="Creating NCR..." message="Please wait..." />
  </div>
</template>
