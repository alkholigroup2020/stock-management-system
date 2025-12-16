<script setup lang="ts">
import { formatCurrency } from "~/utils/format";

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
    total_amount: number;
    supplier?: {
      name: string;
    };
  }>
>([]);

// Computed permission check
const hasNCRPermission = computed(() => permissions.canCreateNCR());

// Form state
const formData = ref({
  location_id: locationStore.activeLocation?.id || "",
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
  }>
>([
  {
    id: crypto.randomUUID(),
    item_id: "",
    quantity: "",
    unit_value: "",
    line_value: 0,
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
  });
};

// Remove line
const removeLine = (id: string) => {
  lines.value = lines.value.filter((line) => line.id !== id);
};

// Calculate line value
const updateLineValue = (line: {
  quantity: string;
  unit_value: string;
  line_value: number;
}) => {
  const quantity = parseFloat(line.quantity) || 0;
  const unitValue = parseFloat(line.unit_value) || 0;
  line.line_value = quantity * unitValue;
};

// Get item by ID
const getItemById = (itemId: string) => {
  return items.value.find((item) => item.id === itemId);
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
    return [{ label: "No deliveries available", value: "" }];
  }
  return [
    { label: "No delivery selected", value: "" },
    ...deliveries.value.map((delivery) => ({
      label: `${delivery.delivery_no} - ${delivery.supplier?.name || "Unknown"} (${formatCurrency(delivery.total_amount)})`,
      value: delivery.id,
    })),
  ];
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

    // Set default location if available and not already set
    if (!formData.value.location_id && locationStore.activeLocation?.id) {
      formData.value.location_id = locationStore.activeLocation.id;
    }
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
        limit: 500,
        is_active: "true",
      },
    });
    items.value = response.items;
  } catch (error) {
    console.error("Error fetching items:", error);
    handleError(error, { context: "fetching items" });
  }
};

// Fetch deliveries for selected location
const fetchDeliveries = async () => {
  if (!formData.value.location_id) {
    deliveries.value = [];
    return;
  }

  try {
    const response = await $fetch<{
      deliveries: Array<{
        id: string;
        delivery_no: string;
        total_amount: number;
        supplier?: {
          name: string;
        };
      }>;
    }>(`/api/locations/${formData.value.location_id}/deliveries`, {
      params: {
        includeLines: false,
      },
    });
    deliveries.value = response.deliveries;
  } catch (error) {
    console.error("Error fetching deliveries:", error);
  }
};

// Watch location changes to refresh deliveries
watch(
  () => formData.value.location_id,
  () => {
    fetchDeliveries();
    // Reset delivery selection when location changes
    formData.value.delivery_id = "";
  }
);

// Initial load
onMounted(async () => {
  await Promise.all([fetchLocations(), fetchItems()]);
  // Fetch deliveries after locations are loaded
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
            <USelectMenu
              v-model="formData.delivery_id"
              :items="deliveryOptions"
              value-key="value"
              placeholder="No delivery selected"
              searchable
              size="lg"
              class="w-full"
              :disabled="!formData.location_id || deliveries.length === 0"
            />
            <p class="mt-1 text-caption">Link this NCR to a specific delivery if applicable</p>
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
          <h2 class="text-lg font-semibold">NCR Items</h2>
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
                      v-model="line.item_id"
                      :items="items"
                      label-key="name"
                      value-key="id"
                      placeholder="Select item"
                      searchable
                      size="lg"
                      class="min-w-[200px]"
                      @update:model-value="updateLineValue(line)"
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
                      @input="updateLineValue(line)"
                    />
                  </td>

                  <!-- Unit Value -->
                  <td class="px-3 sm:px-4 py-3">
                    <UInput
                      v-model="line.unit_value"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      size="lg"
                      class="w-28"
                      @input="updateLineValue(line)"
                    />
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
