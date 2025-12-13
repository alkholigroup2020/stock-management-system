<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-truck" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">New Delivery</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Record a new delivery from supplier
          </p>
        </div>
      </div>
    </div>

    <!-- Main Form -->
    <div class="space-y-3">
      <!-- Delivery Header Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-[var(--ui-text)]">Delivery Information</h2>

            <!-- Location Indicator -->
            <div
              v-if="locationStore.activeLocation"
              class="flex items-center gap-2 px-3 py-1.5 md:p-3 bg-[var(--ui-bg)] rounded-lg border border-[var(--ui-border)]"
            >
              <UIcon
                :name="getLocationIcon(locationStore.activeLocation.type)"
                class="w-4 md:w-6 h-4 md:h-6 text-primary p-3"
              />
              <div class="text-left">
                <p class="text-sm font-medium text-[var(--ui-text)]">
                  {{ locationStore.activeLocation.name }}
                </p>
                <p class="text-xs text-[var(--ui-text-muted)]">
                  Delivery will be linked to this location
                </p>
              </div>
            </div>
            <div
              v-else
              class="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800"
            >
              <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 text-amber-500" />
              <p class="text-sm text-amber-700 dark:text-amber-400">No location selected</p>
            </div>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Supplier -->
          <div>
            <label class="form-label mb-2 block">
              Supplier
              <span class="text-[var(--ui-error)]">*</span>
            </label>
            <USelectMenu
              v-model="formData.supplier_id"
              :items="suppliers"
              label-key="name"
              value-key="id"
              placeholder="Select supplier"
              searchable
              size="lg"
              class="w-full"
            >
              <template #leading>
                <UIcon name="i-lucide-building-2" class="w-5 h-5" />
              </template>
            </USelectMenu>
          </div>

          <!-- PO (Optional) - Hidden until PO system is implemented -->
          <!-- TODO: Replace with PO selector dropdown when PO module is ready -->
          <div class="hidden">
            <label class="form-label mb-2 block">Purchase Order (Optional)</label>
            <UInput
              v-model="formData.po_id"
              placeholder="PO number if applicable"
              size="lg"
              icon="i-lucide-file-text"
              class="w-full"
            />
          </div>

          <!-- Placeholder for PO field - coming soon -->
          <div>
            <label class="form-label mb-2 block text-[var(--ui-text-muted)]">
              Purchase Order (Optional)
            </label>
            <div
              class="flex items-center gap-2 px-3 py-2.5 bg-[var(--ui-bg-muted)] rounded-lg border border-[var(--ui-border)] text-[var(--ui-text-muted)]"
            >
              <UIcon name="i-lucide-file-text" class="w-5 h-5" />
              <span class="text-sm">PO linking coming soon</span>
            </div>
          </div>

          <!-- Invoice Number -->
          <div>
            <label class="form-label mb-2 block">
              Invoice Number
              <span class="text-xs text-[var(--ui-text-muted)] ml-1">(required for posting)</span>
            </label>
            <UInput
              v-model="formData.invoice_no"
              placeholder="Enter invoice number"
              size="lg"
              icon="i-lucide-file-check"
              class="w-full"
            />
          </div>

          <!-- Delivery Date -->
          <div>
            <label class="form-label mb-2 block">
              Delivery Date
              <span class="text-[var(--ui-error)]">*</span>
            </label>
            <UInput
              v-model="formData.delivery_date"
              type="date"
              size="lg"
              icon="i-lucide-calendar"
              class="w-full"
            />
          </div>

          <!-- Delivery Note (Full Width) -->
          <div class="md:col-span-2">
            <label class="form-label mb-2 block">Delivery Note</label>
            <UTextarea
              v-model="formData.delivery_note"
              placeholder="Add any notes about this delivery"
              :rows="3"
              size="lg"
              class="w-full"
            />
          </div>
        </div>
      </UCard>

      <!-- Delivery Lines Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-0' }">
        <template #header>
          <div class="flex items-center justify-between p-3 sm:p-4">
            <h2 class="text-lg font-semibold text-[var(--ui-text)]">Delivery Items</h2>
            <UButton
              icon="i-lucide-plus"
              color="primary"
              variant="soft"
              size="sm"
              class="cursor-pointer rounded-full"
              @click="addLine"
            >
              <span class="hidden sm:inline">Add Item</span>
            </UButton>
          </div>
        </template>

        <!-- Variance Warning -->
        <div v-if="hasVarianceLines" class="px-3 sm:px-4 pt-3 sm:pt-4">
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
          <table class="min-w-full divide-y divide-[var(--ui-border)]">
            <thead>
              <tr class="bg-[var(--ui-bg-elevated)]">
                <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Item</th>
                <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Quantity</th>
                <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Unit Price</th>
                <th class="px-4 py-3 text-left text-label uppercase tracking-wider">
                  Period Price
                </th>
                <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Variance</th>
                <th class="px-4 py-3 text-right text-label uppercase tracking-wider">Line Value</th>
                <th class="px-4 py-3 text-center text-label uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--ui-border)]">
              <tr
                v-for="line in lines"
                :key="line.id"
                :class="{
                  'bg-amber-50 dark:bg-amber-950/20': line.has_variance,
                }"
                class="hover:bg-[var(--ui-bg-elevated)] transition-colors"
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
                    class="min-w-[200px] w-full"
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
                    size="sm"
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
                    size="sm"
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
                    <UIcon name="i-lucide-alert-triangle" class="text-amber-500 w-4 h-4" />
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
                  <span class="text-[var(--ui-text)] font-medium">
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
                    @click="removeLine(line.id)"
                  />
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-if="lines.length === 0">
                <td colspan="7" class="px-4 py-8 text-center text-[var(--ui-text-muted)]">
                  No items added yet. Click "Add Item" to start.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div class="px-4 py-6 border-t border-[var(--ui-border)]">
          <div class="flex justify-between items-center">
            <div class="text-caption">{{ lines.length }} item(s)</div>
            <div class="text-right">
              <div class="text-caption">Total Amount</div>
              <div class="text-2xl font-bold text-primary">
                {{ formatCurrency(totalAmount) }}
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Form Actions -->
      <div class="flex flex-wrap items-center justify-end gap-3">
        <UButton
          color="error"
          variant="soft"
          size="lg"
          class="cursor-pointer rounded-full px-6"
          :disabled="savingDraft || posting"
          @click="cancel"
        >
          Cancel
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-save"
          size="lg"
          class="cursor-pointer rounded-full px-6"
          :loading="savingDraft"
          :disabled="!isDraftValid || savingDraft || posting || !isOnline"
          @click="saveDraft"
        >
          Save Draft
        </UButton>
        <UButton
          color="primary"
          icon="i-lucide-check"
          size="lg"
          class="cursor-pointer rounded-full px-6"
          :loading="posting"
          :disabled="!isFormValid || savingDraft || posting || !isOnline"
          @click="showPostConfirmation = true"
        >
          Post Delivery
        </UButton>
      </div>
    </div>

    <!-- Post Confirmation Modal -->
    <UiConfirmModal
      v-model="showPostConfirmation"
      title="Post Delivery"
      message="Once posted, this delivery cannot be edited. Stock levels will be updated and any price variances will generate NCRs automatically. Are you sure you want to post this delivery?"
      confirm-text="Post Delivery"
      cancel-text="Continue Editing"
      loading-text="Posting..."
      :loading="posting"
      variant="warning"
      @confirm="postDelivery"
    />
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from "~/utils/format";

// Composables
const router = useRouter();
const locationStore = useLocationStore();
const periodStore = usePeriodStore();
const toast = useAppToast();
const permissions = usePermissions();
const { isOnline, guardAction } = useOfflineGuard();
const { handleError, handleSuccess, handleWarning } = useErrorHandler();

// State
const savingDraft = ref(false);
const posting = ref(false);
const showPostConfirmation = ref(false);

// Helper function to get location-specific icon
const getLocationIcon = (type: string): string => {
  const icons: Record<string, string> = {
    KITCHEN: "i-lucide-chef-hat",
    STORE: "i-lucide-store",
    CENTRAL: "i-lucide-warehouse",
    WAREHOUSE: "i-lucide-package-2",
  };
  return icons[type] || "i-lucide-map-pin";
};

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

// Draft validation (relaxed - for saving as draft)
const isDraftValid = computed(() => {
  return (
    formData.value.supplier_id &&
    formData.value.delivery_date &&
    lines.value.length > 0 &&
    lines.value.some((line) => line.item_id && line.quantity)
  );
});

// Full validation (strict - for posting)
const isFormValid = computed(() => {
  return (
    formData.value.supplier_id &&
    formData.value.invoice_no &&
    formData.value.delivery_date &&
    lines.value.length > 0 &&
    lines.value.every((line) => line.item_id && line.quantity && line.unit_price)
  );
});

// Fetch suppliers
const fetchSuppliers = async () => {
  try {
    const data: any = await $fetch("/api/suppliers");
    suppliers.value = data.suppliers || [];
  } catch (error: any) {
    handleError(error, { context: "fetching suppliers" });
  }
};

// Fetch items
const fetchItems = async () => {
  try {
    const data: any = await $fetch("/api/items", {
      query: {
        limit: 200, // Max allowed by API
        is_active: true,
      },
    });
    items.value = data.items || [];
  } catch (error: any) {
    handleError(error, { context: "fetching items" });
  }
};

// Fetch period prices for variance detection
const fetchPeriodPrices = async () => {
  if (!periodStore.currentPeriod?.id) return;

  try {
    const data: any = await $fetch(`/api/periods/${periodStore.currentPeriod.id}/prices`);
    // Build map of itemId -> price
    periodPrices.value = {};
    const pricesArray = data.prices || [];
    pricesArray.forEach((priceItem: any) => {
      periodPrices.value[priceItem.item_id] = priceItem.price;
    });
  } catch (error: any) {
    console.error("Failed to fetch period prices:", error);
  }
};

// Prepare lines data for API
const prepareLinesData = () => {
  return lines.value
    .filter((line) => line.item_id && line.quantity)
    .map((line) => ({
      item_id: line.item_id,
      quantity: parseFloat(line.quantity) || 0,
      unit_price: parseFloat(line.unit_price) || 0,
    }));
};

// Save as draft
const saveDraft = async () => {
  if (!isDraftValid.value) {
    handleError("REQUIRED_FIELD");
    return;
  }

  if (!locationStore.activeLocation?.id) {
    handleError({
      data: { message: "Please select a location before saving a delivery" },
    });
    return;
  }

  if (!hasDeliveryPermission.value) {
    handleError("PERMISSION_DENIED");
    return;
  }

  await guardAction(
    async () => {
      savingDraft.value = true;

      try {
        const result: any = await $fetch(
          `/api/locations/${locationStore.activeLocation!.id}/deliveries`,
          {
            method: "post",
            body: {
              supplier_id: formData.value.supplier_id,
              po_id: formData.value.po_id || null,
              invoice_no: formData.value.invoice_no || null,
              delivery_note: formData.value.delivery_note || null,
              delivery_date: formData.value.delivery_date
                ? new Date(formData.value.delivery_date).toISOString()
                : new Date().toISOString(),
              lines: prepareLinesData(),
              status: "DRAFT",
            },
          }
        );

        handleSuccess("Draft Saved", "Your delivery draft has been saved. You can edit it later.");

        // Redirect to delivery detail page
        router.push(`/deliveries/${result.id}`);
      } catch (error: any) {
        console.error("Draft save error:", error);
        handleError(error, { context: "saving draft" });
      } finally {
        savingDraft.value = false;
      }
    },
    {
      offlineMessage: "Cannot save draft",
      offlineDescription: "You need an internet connection to save delivery drafts.",
    }
  );
};

// Post delivery (called from confirmation modal)
const postDelivery = async () => {
  if (!isFormValid.value) {
    handleError("REQUIRED_FIELD");
    showPostConfirmation.value = false;
    return;
  }

  if (!locationStore.activeLocation?.id) {
    handleError({
      data: { message: "Please select a location before posting a delivery" },
    });
    showPostConfirmation.value = false;
    return;
  }

  if (!hasDeliveryPermission.value) {
    handleError("PERMISSION_DENIED");
    showPostConfirmation.value = false;
    return;
  }

  await guardAction(
    async () => {
      posting.value = true;

      try {
        const result: any = await $fetch(
          `/api/locations/${locationStore.activeLocation!.id}/deliveries`,
          {
            method: "post",
            body: {
              supplier_id: formData.value.supplier_id,
              po_id: formData.value.po_id || null,
              invoice_no: formData.value.invoice_no,
              delivery_note: formData.value.delivery_note || null,
              delivery_date: formData.value.delivery_date
                ? new Date(formData.value.delivery_date).toISOString()
                : new Date().toISOString(),
              lines: prepareLinesData(),
              status: "POSTED",
            },
          }
        );

        // Check if NCRs were created
        const ncrCount = result.ncrs?.length || 0;

        if (ncrCount > 0) {
          handleWarning("Delivery Posted with Price Variances", {
            description: `${ncrCount} NCR(s) automatically generated for review. The delivery has been recorded successfully.`,
          });
        } else {
          handleSuccess(
            "Delivery Posted Successfully",
            "The delivery has been recorded and stock levels have been updated."
          );
        }

        // Redirect to delivery detail page
        router.push(`/deliveries/${result.id}`);
      } catch (error: any) {
        console.error("Delivery posting error:", error);
        handleError(error, { context: "posting delivery" });
      } finally {
        posting.value = false;
        showPostConfirmation.value = false;
      }
    },
    {
      offlineMessage: "Cannot post delivery",
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
    handleError("PERMISSION_DENIED");
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
