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
    toast.warning("Form validation failed", {
      description: "Please fill in all required fields",
    });
    return;
  }

  if (!hasNCRPermission.value) {
    toast.error("Permission Denied", {
      description: "You do not have permission to create NCRs",
    });
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

    toast.success("NCR Created", {
      description: `NCR created successfully: ${response.ncr.ncr_no}`,
    });
    router.push(`/ncrs/${response.ncr.id}`);
  } catch (error: any) {
    console.error("Error creating NCR:", error);

    // Handle specific error codes
    const errorCode = error?.data?.data?.code;
    if (errorCode === "LOCATION_NOT_FOUND") {
      toast.error("Location Not Found", {
        description: "The selected location was not found",
      });
    } else if (errorCode === "LOCATION_ACCESS_DENIED") {
      toast.error("Access Denied", {
        description: "You do not have access to this location",
      });
    } else if (errorCode === "INSUFFICIENT_PERMISSIONS") {
      toast.error("Insufficient Permissions", {
        description: "You do not have permission to create NCRs for this location",
      });
    } else if (errorCode === "DELIVERY_NOT_FOUND") {
      toast.error("Delivery Not Found", {
        description: "The selected delivery was not found",
      });
    } else if (errorCode === "VALIDATION_ERROR") {
      const details = error?.data?.data?.details?.[0];
      const fieldError = details ? `${details.path.join(".")}: ${details.message}` : "";
      toast.error("Validation Error", {
        description: fieldError || "Please check your input and try again",
      });
    } else {
      toast.error("Error Creating NCR", {
        description: error?.data?.message || "Failed to create NCR. Please try again.",
      });
    }
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
    toast.error("Error", {
      description: "Failed to load locations",
    });
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
    toast.error("Error", {
      description: "Failed to load items",
    });
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
      },
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
  },
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
  <div class="p-4 md:p-6">
    <div class="mx-auto max-w-4xl space-y-6">
      <!-- Page Header -->
      <LayoutPageHeader
        title="New Non-Conformance Report"
        icon="i-lucide-alert-circle"
        :show-location="false"
        :show-period="false"
        location-scope="none"
      >
        <template #breadcrumbs>
          <nav class="flex items-center space-x-2 text-sm">
            <NuxtLink to="/ncrs" class="text-muted hover:text-default transition-colors">
              NCRs
            </NuxtLink>
            <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-muted" />
            <span class="text-default">New</span>
          </nav>
        </template>
      </LayoutPageHeader>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- NCR Information -->
        <div class="card-elevated p-6">
          <h2 class="mb-4 text-h3 font-semibold">NCR Information</h2>

          <div class="space-y-4">
            <!-- Location -->
            <div>
              <label class="form-label">Location *</label>
              <select v-model="formData.location_id" class="form-input w-full" required>
                <option value="">Select location</option>
                <option v-for="location in locations" :key="location.id" :value="location.id">
                  {{ location.name }} ({{ location.code }})
                </option>
              </select>
            </div>

            <!-- Delivery (Optional) -->
            <div>
              <label class="form-label">Related Delivery (Optional)</label>
              <select v-model="formData.delivery_id" class="form-input w-full">
                <option value="">No delivery selected</option>
                <option v-for="delivery in deliveries" :key="delivery.id" :value="delivery.id">
                  {{ delivery.delivery_no }} - {{ delivery.supplier.name }} ({{
                    formatCurrency(delivery.total_amount)
                  }})
                </option>
              </select>
              <p class="mt-1 text-caption text-muted">
                Link this NCR to a specific delivery if applicable
              </p>
            </div>

            <!-- Reason -->
            <div>
              <label class="form-label">Reason *</label>
              <textarea
                v-model="formData.reason"
                class="form-input w-full"
                rows="3"
                required
                placeholder="Describe the non-conformance issue..."
              ></textarea>
              <p class="mt-1 text-caption text-muted">
                Item details will be automatically appended to this reason
              </p>
            </div>
          </div>
        </div>

        <!-- NCR Items -->
        <div class="card-elevated p-6">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-h3 font-semibold">NCR Items</h2>
            <UButton
              color="primary"
              variant="outline"
              icon="i-lucide-plus"
              label="Add Item"
              size="sm"
              @click="addLine"
            />
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-default">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-muted">
                    Item
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-muted">
                    Quantity
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-muted">
                    Unit Value
                  </th>
                  <th class="px-3 py-2 text-right text-xs font-semibold uppercase text-muted">
                    Line Value
                  </th>
                  <th class="px-3 py-2 text-center text-xs font-semibold uppercase text-muted">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="line in lines" :key="line.id" class="border-b border-default">
                  <td class="px-3 py-2">
                    <select
                      v-model="line.item_id"
                      class="form-input w-full min-w-[200px]"
                      @change="updateLineValue(line)"
                    >
                      <option value="">Select item</option>
                      <option v-for="item in items" :key="item.id" :value="item.id">
                        {{ item.name }} ({{ item.code }}) - {{ item.unit }}
                      </option>
                    </select>
                  </td>
                  <td class="px-3 py-2">
                    <input
                      v-model="line.quantity"
                      type="number"
                      step="0.0001"
                      min="0"
                      class="form-input w-24"
                      placeholder="0.00"
                      @input="updateLineValue(line)"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <input
                      v-model="line.unit_value"
                      type="number"
                      step="0.01"
                      min="0"
                      class="form-input w-32"
                      placeholder="0.00"
                      @input="updateLineValue(line)"
                    />
                  </td>
                  <td class="px-3 py-2 text-right font-medium">
                    {{ formatCurrency(line.line_value) }}
                  </td>
                  <td class="px-3 py-2 text-center">
                    <UButton
                      color="error"
                      variant="ghost"
                      icon="i-lucide-trash-2"
                      size="sm"
                      :disabled="lines.length === 1"
                      @click="removeLine(line.id)"
                    />
                  </td>
                </tr>
              </tbody>
              <tfoot class="border-t-2 border-default bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <td colspan="3" class="px-3 py-3 text-right font-semibold">Total NCR Value:</td>
                  <td class="px-3 py-3 text-right text-lg font-bold text-primary">
                    {{ formatCurrency(totalValue) }}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Validation Warning -->
          <div v-if="!isFormValid && lines.some((l) => l.item_id)" class="mt-4">
            <UAlert
              color="warning"
              variant="soft"
              icon="i-lucide-alert-triangle"
              title="Please complete all item lines"
              description="Each item must have a quantity and unit value greater than zero."
            />
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3">
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            label="Cancel"
            @click="handleCancel"
          />
          <UButton
            type="submit"
            color="primary"
            :loading="loading"
            :disabled="!isFormValid || loading"
            icon="i-lucide-save"
          >
            Create NCR
          </UButton>
        </div>
      </form>
    </div>
  </div>
</template>
