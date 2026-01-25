<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Loading State -->
    <div v-if="loadingDelivery" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading draft..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="loadError" :message="loadError" @retry="fetchDeliveryData" />

    <!-- Edit Form -->
    <template v-else-if="deliveryLoaded">
      <!-- Page Header -->
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 sm:gap-4">
          <UIcon name="i-lucide-truck" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl sm:text-3xl font-bold text-primary">Edit {{ deliveryNo }}</h1>
              <UBadge
                color="neutral"
                variant="subtle"
                size="md"
                class="inline-flex items-center gap-1"
              >
                <UIcon name="i-lucide-file-edit" class="h-3 w-3" />
                Draft
              </UBadge>
            </div>
            <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
              Edit delivery details before posting
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
                  class="w-4 md:w-6 h-4 md:h-6 text-primary flex-shrink-0"
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
                  <th class="px-4 py-3 text-left text-label uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th class="px-4 py-3 text-left text-label uppercase tracking-wider">
                    Period Price
                  </th>
                  <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Variance</th>
                  <th class="px-4 py-3 text-right text-label uppercase tracking-wider">
                    Line Value
                  </th>
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
                      aria-label="Remove line item"
                      title="Remove this item"
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
            :disabled="saving || posting || sendingForApproval"
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
            :loading="saving"
            :disabled="!isDraftValid || saving || posting || sendingForApproval || !isOnline"
            @click="saveChanges"
          >
            Save Changes
          </UButton>
          <!-- Send For Approval Button - Only for Operators with unapproved over-deliveries -->
          <UButton
            v-if="showSendForApprovalButton"
            color="warning"
            icon="i-lucide-send"
            size="lg"
            class="cursor-pointer rounded-full px-6"
            :loading="sendingForApproval"
            :disabled="!isDraftValid || saving || posting || sendingForApproval || !isOnline"
            @click="sendForApproval"
          >
            Send For Approval
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-check"
            size="lg"
            class="cursor-pointer rounded-full px-6"
            :loading="posting"
            :disabled="!isFormValid || saving || posting || sendingForApproval || !isOnline"
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
    </template>

    <!-- Not Found State -->
    <EmptyState
      v-else
      icon="i-lucide-package-x"
      title="Delivery Not Found"
      description="The delivery you're trying to edit doesn't exist or has been removed."
    >
      <template #actions>
        <UButton color="primary" icon="i-lucide-arrow-left" class="cursor-pointer" @click="goBack">
          Back to Deliveries
        </UButton>
      </template>
    </EmptyState>

    <!-- Loading Overlay for Save -->
    <LoadingOverlay
      v-if="saving"
      title="Saving Changes..."
      message="Please wait while we save your delivery draft"
    />

    <!-- Loading Overlay for Posting -->
    <LoadingOverlay
      v-if="posting"
      title="Posting Delivery..."
      message="Please wait while we process your delivery"
    />

    <!-- Loading Overlay for Send For Approval -->
    <LoadingOverlay
      v-if="sendingForApproval"
      title="Sending for Approval..."
      message="Please wait while we save and notify supervisors"
    />
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from "~/utils/format";

// Composables
const router = useRouter();
const route = useRoute();
const locationStore = useLocationStore();
const periodStore = usePeriodStore();
const permissions = usePermissions();
const { isOnline, guardAction } = useOfflineGuard();
const { handleError, handleSuccess, handleWarning } = useErrorHandler();
const { user } = useAuth();

// State
const loadingDelivery = ref(true);
const loadError = ref<string | null>(null);
const deliveryLoaded = ref(false);
const deliveryNo = ref("");
const saving = ref(false);
const posting = ref(false);
const sendingForApproval = ref(false);
const showPostConfirmation = ref(false);

// Over-delivery state (loaded from API)
const hasOverDelivery = ref(false);
const hasUnapprovedOverDelivery = ref(false);
const pendingApproval = ref(false);

// Delivery ID from route
const deliveryId = computed(() => route.params.id as string);

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

const suppliers = ref<Array<{ id: string; name: string; code: string }>>([]);
const items = ref<Array<{ id: string; name: string; code: string; unit: string }>>([]);
const periodPrices = ref<Record<string, number>>({});

// Computed permission check
const hasDeliveryPermission = computed(() => permissions.canPostDeliveries());

// Form state
const formData = ref({
  supplier_id: "",
  po_id: null as string | null,
  invoice_no: "",
  delivery_note: "",
  delivery_date: "",
});

// Delivery lines state
interface DeliveryLine {
  id: string;
  item_id: string;
  quantity: string;
  unit_price: string;
  line_value: number;
  price_variance: number;
  has_variance: boolean;
  period_price?: number;
}

const lines = ref<DeliveryLine[]>([]);

// Add line
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
const updateLineCalculations = (line: DeliveryLine) => {
  const quantity = parseFloat(line.quantity) || 0;
  const unitPrice = parseFloat(line.unit_price) || 0;
  line.line_value = quantity * unitPrice;

  // Check for price variance
  const periodPrice = periodPrices.value[line.item_id];
  if (periodPrice !== undefined && unitPrice > 0) {
    line.period_price = periodPrice;
    line.price_variance = unitPrice - periodPrice;
    line.has_variance = Math.abs(line.price_variance) > 0.01;
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

// Draft validation (relaxed - for saving)
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
  const basicValid =
    formData.value.supplier_id &&
    formData.value.invoice_no &&
    formData.value.delivery_date &&
    lines.value.length > 0 &&
    lines.value.every((line) => line.item_id && line.quantity && line.unit_price);

  if (!basicValid) return false;

  // Operators cannot post with unapproved over-delivery
  const isOperator = user.value?.role === "OPERATOR";
  if (isOperator && hasUnapprovedOverDelivery.value) {
    return false;
  }

  return true;
});

// Show "Send For Approval" button only for Operators with unapproved over-deliveries
const showSendForApprovalButton = computed(() => {
  return user.value?.role === "OPERATOR" && hasUnapprovedOverDelivery.value;
});

// Fetch delivery data
const fetchDeliveryData = async () => {
  if (!deliveryId.value) {
    loadError.value = "No delivery ID provided";
    loadingDelivery.value = false;
    return;
  }

  loadingDelivery.value = true;
  loadError.value = null;

  try {
    const response = await $fetch<{
      delivery: {
        id: string;
        delivery_no: string;
        delivery_date: string;
        invoice_no: string | null;
        delivery_note: string | null;
        status: string;
        has_over_delivery: boolean;
        has_unapproved_over_delivery: boolean;
        pending_approval: boolean;
        supplier: { id: string; name: string; code: string };
        po: { id: string } | null;
        lines: Array<{
          id: string;
          item: { id: string; name: string; code: string; unit: string };
          quantity: number;
          unit_price: number;
          period_price: number | null;
        }>;
      };
    }>(`/api/deliveries/${deliveryId.value}`);

    const delivery = response.delivery;

    // Check if it's a draft - only drafts can be edited
    if (delivery.status !== "DRAFT") {
      loadError.value = "Only draft deliveries can be edited";
      loadingDelivery.value = false;
      return;
    }

    // Populate over-delivery state
    hasOverDelivery.value = delivery.has_over_delivery ?? false;
    hasUnapprovedOverDelivery.value = delivery.has_unapproved_over_delivery ?? false;
    pendingApproval.value = delivery.pending_approval ?? false;

    // Populate form data
    deliveryNo.value = delivery.delivery_no;
    formData.value = {
      supplier_id: delivery.supplier.id,
      po_id: delivery.po?.id || null,
      invoice_no: delivery.invoice_no || "",
      delivery_note: delivery.delivery_note || "",
      delivery_date: delivery.delivery_date?.split("T")[0] ?? "",
    };

    // Populate lines
    lines.value = delivery.lines.map((line) => ({
      id: line.id,
      item_id: line.item.id,
      quantity: line.quantity.toString(),
      unit_price: line.unit_price.toString(),
      line_value: line.quantity * line.unit_price,
      price_variance: 0,
      has_variance: false,
      period_price: line.period_price ?? undefined,
    }));

    deliveryLoaded.value = true;
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } };
    loadError.value = fetchError?.data?.message || "Failed to load delivery";
    console.error("Error fetching delivery:", err);
  } finally {
    loadingDelivery.value = false;
  }
};

// Fetch suppliers
const fetchSuppliers = async () => {
  try {
    const data = await $fetch<{ suppliers: Array<{ id: string; name: string; code: string }> }>(
      "/api/suppliers"
    );
    suppliers.value = data.suppliers || [];
  } catch (error: unknown) {
    handleError(error, { context: "fetching suppliers" });
  }
};

// Fetch items
const fetchItems = async () => {
  try {
    const data = await $fetch<{
      items: Array<{ id: string; name: string; code: string; unit: string }>;
    }>("/api/items", {
      query: {
        limit: 200,
        is_active: true,
      },
    });
    items.value = data.items || [];
  } catch (error: unknown) {
    handleError(error, { context: "fetching items" });
  }
};

// Fetch period prices for variance detection
const fetchPeriodPrices = async () => {
  if (!periodStore.currentPeriod?.id) return;

  try {
    const data = await $fetch<{ prices: Array<{ item_id: string; price: number }> }>(
      `/api/periods/${periodStore.currentPeriod.id}/prices`
    );
    periodPrices.value = {};
    const pricesArray = data.prices || [];
    pricesArray.forEach((priceItem) => {
      periodPrices.value[priceItem.item_id] = priceItem.price;
    });
  } catch (error: unknown) {
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

// Save changes (update draft)
const saveChanges = async () => {
  if (!isDraftValid.value) {
    handleError("REQUIRED_FIELD");
    return;
  }

  if (!hasDeliveryPermission.value) {
    handleError("PERMISSION_DENIED");
    return;
  }

  await guardAction(
    async () => {
      saving.value = true;

      try {
        await $fetch(`/api/deliveries/${deliveryId.value}`, {
          method: "PATCH",
          body: {
            supplier_id: formData.value.supplier_id,
            po_id: formData.value.po_id || null,
            invoice_no: formData.value.invoice_no || null,
            delivery_note: formData.value.delivery_note || null,
            delivery_date: formData.value.delivery_date
              ? new Date(formData.value.delivery_date).toISOString()
              : new Date().toISOString(),
            lines: prepareLinesData(),
          },
        });

        handleSuccess("Changes Saved", "Your delivery draft has been updated.");

        // Navigate back to detail page
        router.push(`/deliveries/${deliveryId.value}`);
      } catch (error: unknown) {
        console.error("Save error:", error);
        handleError(error, { context: "saving changes" });
      } finally {
        saving.value = false;
      }
    },
    {
      offlineMessage: "Cannot save changes",
      offlineDescription: "You need an internet connection to save changes.",
    }
  );
};

// Send for approval (save draft and notify supervisors)
const sendForApproval = async () => {
  if (!isDraftValid.value) {
    handleError("REQUIRED_FIELD");
    return;
  }

  if (!hasDeliveryPermission.value) {
    handleError("PERMISSION_DENIED");
    return;
  }

  await guardAction(
    async () => {
      sendingForApproval.value = true;

      try {
        await $fetch(`/api/deliveries/${deliveryId.value}`, {
          method: "PATCH",
          body: {
            supplier_id: formData.value.supplier_id,
            po_id: formData.value.po_id || null,
            invoice_no: formData.value.invoice_no || null,
            delivery_note: formData.value.delivery_note || null,
            delivery_date: formData.value.delivery_date
              ? new Date(formData.value.delivery_date).toISOString()
              : new Date().toISOString(),
            lines: prepareLinesData(),
            send_for_approval: true,
          },
        });

        handleSuccess(
          "Sent for Approval",
          "Delivery draft saved. Supervisors have been notified for over-delivery approval."
        );

        // Navigate back to detail page
        router.push(`/deliveries/${deliveryId.value}`);
      } catch (error: unknown) {
        console.error("Send for approval error:", error);
        handleError(error, { context: "sending for approval" });
      } finally {
        sendingForApproval.value = false;
      }
    },
    {
      offlineMessage: "Cannot send for approval",
      offlineDescription: "You need an internet connection to send for approval.",
    }
  );
};

// Post delivery
const postDelivery = async () => {
  if (!isFormValid.value) {
    handleError("REQUIRED_FIELD");
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
        // First update the draft with current data
        await $fetch(`/api/deliveries/${deliveryId.value}`, {
          method: "PATCH",
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
        });

        // Check if NCRs were created (we don't have this info here, but show success)
        handleSuccess(
          "Delivery Posted Successfully",
          "The delivery has been recorded and stock levels have been updated."
        );

        // Redirect to delivery detail page
        router.push(`/deliveries/${deliveryId.value}`);
      } catch (error: unknown) {
        console.error("Posting error:", error);
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
  router.push(`/deliveries/${deliveryId.value}`);
};

// Go back to deliveries list
const goBack = () => {
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

  // Fetch required data in parallel
  await Promise.all([fetchSuppliers(), fetchItems(), fetchPeriodPrices(), fetchDeliveryData()]);
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
