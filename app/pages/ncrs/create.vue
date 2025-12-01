<script setup lang="ts">
import { z } from "zod";
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
const locations = ref<any[]>([]);
const items = ref<any[]>([]);
const deliveries = ref<any[]>([]);

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
const updateLineValue = (line: any) => {
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

// Delivery options for dropdown
const deliveryOptions = computed(() => {
  if (!deliveries.value || deliveries.value.length === 0) {
    return [{ label: "No deliveries available", value: "" }];
  }
  return [
    { label: "No delivery selected", value: "" },
    ...deliveries.value.map((delivery: any) => ({
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

    const response = await $fetch("/api/ncrs", {
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
  } catch (error: any) {
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
    const response = await $fetch<{ locations: any[] }>("/api/locations");
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
    const response = await $fetch<{ items: any[] }>("/api/items", {
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
    const response = await $fetch<{ deliveries: any[] }>(
      `/api/locations/${formData.value.location_id}/deliveries`,
      {
        params: {
          includeLines: false,
        },
      }
    );
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
  <div class="space-y-6">
    <!-- Page Header -->
    <LayoutPageHeader
      title="New Non-Conformance Report"
      icon="i-lucide-alert-circle"
      :show-location="true"
      :show-period="true"
      location-scope="current"
    />

    <!-- Main Form -->
    <div class="space-y-6">
      <!-- NCR Information Card -->
      <UCard class="card-elevated">
        <template #header>
          <h2 class="text-subheading font-semibold">NCR Information</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Location -->
          <div>
            <label class="form-label">Location *</label>
            <USelectMenu
              v-model="formData.location_id"
              :items="locations"
              label-key="name"
              value-key="id"
              placeholder="Select location"
              searchable
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
              :disabled="!formData.location_id || deliveries.length === 0"
            />
            <p class="mt-1 text-caption">Link this NCR to a specific delivery if applicable</p>
          </div>

          <!-- Reason -->
          <div class="md:col-span-2">
            <label class="form-label">Reason *</label>
            <UTextarea
              v-model="formData.reason"
              placeholder="Describe the non-conformance issue..."
              :rows="3"
            />
            <p class="mt-1 text-caption">
              Item details will be automatically appended to this reason
            </p>
          </div>
        </div>
      </UCard>

      <!-- NCR Items Card -->
      <UCard class="card-elevated">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-subheading font-semibold">NCR Items</h2>
            <UButton icon="i-lucide-plus" color="primary" variant="soft" size="sm" @click="addLine">
              Add Item
            </UButton>
          </div>
        </template>

        <!-- Lines Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-default">
            <thead>
              <tr class="bg-default">
                <th class="px-4 py-3 text-left text-label uppercase">Item</th>
                <th class="px-4 py-3 text-left text-label uppercase">Quantity</th>
                <th class="px-4 py-3 text-left text-label uppercase">Unit Value</th>
                <th class="px-4 py-3 text-right text-label uppercase">Line Value</th>
                <th class="px-4 py-3 text-center text-label uppercase">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="line in lines" :key="line.id">
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
                    @update:model-value="updateLineValue(line)"
                  />
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
                    @input="updateLineValue(line)"
                  />
                </td>

                <!-- Unit Value -->
                <td class="px-4 py-3">
                  <UInput
                    v-model="line.unit_value"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    class="w-32"
                    @input="updateLineValue(line)"
                  />
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
                <td colspan="5" class="px-4 py-8 text-center text-caption">
                  No items added yet. Click "Add Item" to start.
                </td>
              </tr>
            </tbody>
          </table>
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
        <div class="mt-4 pt-4 border-t border-default">
          <div class="flex justify-between items-center">
            <div class="text-caption">{{ lines.length }} item(s)</div>
            <div class="text-right">
              <div class="text-caption">Total NCR Value</div>
              <div class="text-heading font-bold text-primary">
                {{ formatCurrency(totalValue) }}
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Form Actions -->
      <div class="flex justify-end space-x-3">
        <UButton
          color="neutral"
          variant="soft"
          class="cursor-pointer"
          @click="handleCancel"
          :disabled="loading"
        >
          Cancel
        </UButton>
        <UButton
          color="primary"
          class="cursor-pointer"
          :loading="loading"
          :disabled="!isFormValid || loading"
          @click="handleSubmit"
        >
          Create NCR
        </UButton>
      </div>
    </div>
  </div>
</template>
