<script setup lang="ts">
import { z } from "zod";

// Composables
const router = useRouter();
const locationStore = useLocationStore();
const periodStore = usePeriodStore();
const toast = useAppToast();
const permissions = usePermissions();
const { isOnline, guardAction } = useOfflineGuard();

// State
const loading = ref(false);
const suppliers = ref<any[]>([]);
const items = ref<any[]>([]);
const periodPrices = ref<Record<string, number>>({}); // Map of itemId -> period_price

// Computed permission check
const hasDeliveryPermission = computed(() => permissions.canPostDeliveries());

// Form state
const formData = ref({
  supplier_id: "",
  po_id: null as string | null,
  invoice_no: "",
  delivery_note: "",
  delivery_date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
});

// Delivery lines state
const lines = ref<
  Array<{
    id: string;
    item_id: string;
    quantity: string;
    unit_price: string;
    line_value: number;
    price_variance: number;
    has_variance: boolean;
    period_price?: number;
  }>
>([]);

// Add initial empty line
const addLine = () => {
  lines.value.push({
    id: crypto.randomUUID(),
    item_id: "",
    quantity: "",
    unit_price: "",
    line_value: 0,
    price_variance: 0,
    has_variance: false,
  });
};

// Remove line
const removeLine = (id: string) => {
  lines.value = lines.value.filter((line) => line.id !== id);
};

// Calculate line value and variance
const updateLineCalculations = (line: any) => {
  const quantity = parseFloat(line.quantity) || 0;
  const unitPrice = parseFloat(line.unit_price) || 0;
  line.line_value = quantity * unitPrice;

  // Check for price variance
  const periodPrice = periodPrices.value[line.item_id];
  if (periodPrice !== undefined && unitPrice > 0) {
    line.period_price = periodPrice;
    line.price_variance = unitPrice - periodPrice;
    line.has_variance = Math.abs(line.price_variance) > 0.01; // Variance threshold
  } else {
    line.period_price = undefined;
    line.price_variance = 0;
    line.has_variance = false;
  }
};

// Computed
const totalAmount = computed(() => {
  return lines.value.reduce((sum, line) => sum + line.line_value, 0);
});

const hasVarianceLines = computed(() => {
  return lines.value.some((line) => line.has_variance);
});

const varianceCount = computed(() => {
  return lines.value.filter((line) => line.has_variance).length;
});

const isFormValid = computed(() => {
  return (
    formData.value.supplier_id &&
    formData.value.invoice_no &&
    formData.value.delivery_date &&
    lines.value.length > 0 &&
    lines.value.every((line) => line.item_id && line.quantity && line.unit_price)
  );
});

// Get item by ID
const getItemById = (itemId: string) => {
  return items.value.find((item) => item.id === itemId);
};

// Fetch suppliers
const fetchSuppliers = async () => {
  try {
    const data: any = await $fetch("/api/suppliers");
    suppliers.value = data.suppliers || [];
  } catch (error: any) {
    toast.error("Failed to fetch suppliers", error.message);
  }
};

// Fetch items
const fetchItems = async () => {
  try {
    const data: any = await $fetch("/api/items", {
      query: {
        limit: 500, // Get more items for dropdown
        is_active: true,
      },
    });
    items.value = data.items || [];
  } catch (error: any) {
    toast.error("Failed to fetch items", error.message);
  }
};

// Fetch period prices for variance detection
const fetchPeriodPrices = async () => {
  if (!periodStore.currentPeriod?.id) return;

  try {
    const data: any = await $fetch(`/api/periods/${periodStore.currentPeriod.id}/prices`);
    // Build map of itemId -> price
    periodPrices.value = {};
    data.forEach((priceItem: any) => {
      periodPrices.value[priceItem.item_id] = priceItem.price;
    });
  } catch (error: any) {
    console.error("Failed to fetch period prices:", error);
  }
};

// Submit form
const submitDelivery = async () => {
  if (!isFormValid.value) {
    toast.error("Please fill in all required fields");
    return;
  }

  if (!locationStore.activeLocation?.id) {
    toast.error("No location selected");
    return;
  }

  if (!hasDeliveryPermission.value) {
    toast.error("You do not have permission to post deliveries");
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
          unit_price: parseFloat(line.unit_price),
        }));

        // Submit delivery
        const result: any = await $fetch(
          `/api/locations/${locationStore.activeLocation!.id}/deliveries`,
          {
            method: "POST",
            body: {
              supplier_id: formData.value.supplier_id,
              po_id: formData.value.po_id || null,
              invoice_no: formData.value.invoice_no,
              delivery_note: formData.value.delivery_note || null,
              delivery_date: formData.value.delivery_date
                ? new Date(formData.value.delivery_date).toISOString()
                : new Date().toISOString(),
              lines: linesData,
            },
          }
        );

        // Check if NCRs were created
        const ncrCount = result.ncrs?.length || 0;

        if (ncrCount > 0) {
          toast.warning("Delivery created with price variances", {
            description: `${ncrCount} NCR(s) automatically generated for price variances`,
          });
        } else {
          toast.success("Delivery created successfully", {
            description: "Delivery record has been saved",
          });
        }

        // Redirect to delivery detail page
        router.push(`/deliveries/${result.id}`);
      } catch (error: any) {
        console.error("Delivery submission error:", error);
        toast.error("Failed to create delivery", error.data?.message || error.message);
      } finally {
        loading.value = false;
      }
    },
    {
      offlineMessage: "Cannot create delivery",
      offlineDescription: "You need an internet connection to post deliveries.",
    }
  );
};

// Cancel and go back
const cancel = () => {
  router.push("/deliveries");
};

// Initialize
onMounted(async () => {
  // Check permission
  if (!hasDeliveryPermission.value) {
    toast.error("You do not have permission to post deliveries");
    router.push("/deliveries");
    return;
  }

  // Fetch required data
  await Promise.all([fetchSuppliers(), fetchItems(), fetchPeriodPrices()]);

  // Add initial empty line
  addLine();
});

// Watch for item or price changes to update calculations
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
      title="New Delivery"
      icon="i-lucide-truck"
      :show-location="true"
      :show-period="true"
      location-scope="current"
    />

    <!-- Main Form -->
    <div class="space-y-6">
      <!-- Delivery Header Card -->
      <UCard class="card-elevated">
        <template #header>
          <h2 class="text-subheading font-semibold">Delivery Information</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Supplier -->
          <div>
            <label class="form-label">Supplier *</label>
            <USelectMenu
              v-model="formData.supplier_id"
              :options="suppliers"
              option-attribute="name"
              value-attribute="id"
              placeholder="Select supplier"
              searchable
            />
          </div>

          <!-- PO (Optional) -->
          <div>
            <label class="form-label">Purchase Order (Optional)</label>
            <UInput v-model="formData.po_id" placeholder="PO number if applicable" />
          </div>

          <!-- Invoice Number -->
          <div>
            <label class="form-label">Invoice Number *</label>
            <UInput v-model="formData.invoice_no" placeholder="Enter invoice number" />
          </div>

          <!-- Delivery Date -->
          <div>
            <label class="form-label">Delivery Date *</label>
            <UInput v-model="formData.delivery_date" type="date" />
          </div>

          <!-- Delivery Note -->
          <div class="md:col-span-2">
            <label class="form-label">Delivery Note</label>
            <UTextarea
              v-model="formData.delivery_note"
              placeholder="Add any notes about this delivery"
              :rows="3"
            />
          </div>
        </div>
      </UCard>

      <!-- Delivery Lines Card -->
      <UCard class="card-elevated">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-subheading font-semibold">Delivery Items</h2>
            <UButton icon="i-lucide-plus" color="primary" variant="soft" size="sm" @click="addLine">
              Add Item
            </UButton>
          </div>
        </template>

        <!-- Variance Warning -->
        <div v-if="hasVarianceLines" class="mb-4">
          <UAlert
            icon="i-lucide-alert-triangle"
            color="warning"
            variant="subtle"
            title="Price Variance Detected"
            :description="`${varianceCount} item(s) have price variance. NCRs will be automatically created.`"
          />
        </div>

        <!-- Lines Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-default">
            <thead>
              <tr class="bg-default">
                <th class="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Item</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  Quantity
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  Unit Price
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  Period Price
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-muted uppercase">
                  Variance
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium text-muted uppercase">
                  Line Value
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-muted uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr
                v-for="line in lines"
                :key="line.id"
                :class="{
                  'bg-amber-50 dark:bg-amber-950/20': line.has_variance,
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
                  />
                </td>

                <!-- Unit Price -->
                <td class="px-4 py-3">
                  <UInput
                    v-model="line.unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    class="w-32"
                  />
                </td>

                <!-- Period Price -->
                <td class="px-4 py-3">
                  <span v-if="line.period_price !== undefined" class="text-caption">
                    {{ formatCurrency(line.period_price) }}
                  </span>
                  <span v-else class="text-caption">-</span>
                </td>

                <!-- Variance -->
                <td class="px-4 py-3">
                  <div v-if="line.has_variance" class="flex items-center space-x-2">
                    <UIcon name="i-lucide-alert-triangle" class="text-amber-500" />
                    <span
                      :class="[
                        'text-sm font-medium',
                        line.price_variance > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-600 dark:text-emerald-400',
                      ]"
                    >
                      {{ formatCurrency(line.price_variance) }}
                    </span>
                  </div>
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
                <td colspan="7" class="px-4 py-8 text-center text-muted">
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
              <div class="text-caption">Total Amount</div>
              <div class="text-heading font-bold text-primary">
                {{ formatCurrency(totalAmount) }}
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Form Actions -->
      <div class="flex justify-end space-x-3">
        <UButton color="neutral" variant="soft" @click="cancel" :disabled="loading">Cancel</UButton>
        <UButton
          color="primary"
          class="cursor-pointer"
          :loading="loading"
          :disabled="!isFormValid || loading || !isOnline"
          @click="submitDelivery"
        >
          Create Delivery
        </UButton>
      </div>
    </div>
  </div>
</template>
