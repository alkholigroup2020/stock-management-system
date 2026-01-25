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

    <!-- No Open POs Warning -->
    <UAlert
      v-if="!loadingOpenPOs && openPOs.length === 0"
      icon="i-lucide-alert-circle"
      color="warning"
      variant="subtle"
      title="No Open Purchase Orders"
      description="There are no open POs available. Deliveries require a linked Purchase Order. Please create a PO first."
    >
      <template #actions>
        <UButton
          color="warning"
          variant="soft"
          size="sm"
          class="cursor-pointer"
          to="/orders?tab=pos"
          icon="i-lucide-plus"
        >
          Create PO
        </UButton>
      </template>
    </UAlert>

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
          <!-- Purchase Order (Required) -->
          <div>
            <label class="form-label mb-2 block">
              Purchase Order
              <span class="text-[var(--ui-error)]">*</span>
            </label>
            <USelectMenu
              v-model="formData.po_id"
              :items="poDropdownItems"
              label-key="label"
              value-key="value"
              placeholder="Select Purchase Order"
              searchable
              size="lg"
              class="w-full"
              :loading="loadingOpenPOs"
              :disabled="openPOs.length === 0"
            >
              <template #leading>
                <UIcon name="i-lucide-file-text" class="w-5 h-5" />
              </template>
              <template #item="{ item }">
                <div class="flex flex-col">
                  <span class="font-medium">{{ item.label }}</span>
                  <span class="text-xs text-[var(--ui-text-muted)]">
                    {{ item.supplierName }} - {{ formatCurrency(item.totalAmount) }}
                  </span>
                </div>
              </template>
            </USelectMenu>
            <p class="text-xs text-[var(--ui-text-muted)] mt-1">
              Selecting a PO will auto-populate supplier and items
            </p>
          </div>

          <!-- Supplier (Auto-populated from PO, read-only) -->
          <div>
            <label class="form-label mb-2 block">
              Supplier
              <span class="text-[var(--ui-error)]">*</span>
            </label>
            <div
              v-if="selectedPO"
              class="flex items-center gap-2 px-3 py-2.5 bg-[var(--ui-bg-muted)] rounded-lg border border-[var(--ui-border)]"
            >
              <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary" />
              <div class="flex-1">
                <span class="font-medium text-[var(--ui-text)]">
                  {{ selectedPO.supplier.name }}
                </span>
                <span class="text-xs text-[var(--ui-text-muted)] ml-2">
                  ({{ selectedPO.supplier.code }})
                </span>
              </div>
              <UIcon
                name="i-lucide-lock"
                class="w-4 h-4 text-[var(--ui-text-muted)]"
                title="Auto-populated from PO"
              />
            </div>
            <div
              v-else
              class="flex items-center gap-2 px-3 py-2.5 bg-[var(--ui-bg-muted)] rounded-lg border border-[var(--ui-border)] text-[var(--ui-text-muted)]"
            >
              <UIcon name="i-lucide-building-2" class="w-5 h-5" />
              <span class="text-sm">Select a PO to auto-populate supplier</span>
            </div>
          </div>

          <!-- Invoice Number -->
          <div>
            <label class="form-label mb-2 block">
              Invoice Number
              <span class="text-[var(--ui-error)]">*</span>
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

        <!-- Over-Delivery Warning -->
        <div v-if="hasOverDeliveryLines" class="px-3 sm:px-4 pt-3 sm:pt-4">
          <UAlert
            icon="i-lucide-alert-triangle"
            :color="hasUnapprovedOverDelivery ? 'error' : 'warning'"
            variant="subtle"
            :title="
              hasUnapprovedOverDelivery
                ? 'Over-Delivery Requires Approval'
                : 'Over-Delivery Approved'
            "
          >
            <template #description>
              <div class="space-y-2">
                <p>
                  {{ overDeliveryCount }} item(s) have quantity exceeding the remaining PO quantity.
                </p>
                <p v-if="hasUnapprovedOverDelivery && canApproveOverDelivery" class="text-sm">
                  As a {{ user?.role }}, you can approve these over-deliveries.
                </p>
                <p v-else-if="hasUnapprovedOverDelivery" class="text-sm">
                  <strong>Supervisor or Admin approval is required</strong>
                  to proceed with over-deliveries.
                </p>
              </div>
            </template>
            <template v-if="hasUnapprovedOverDelivery && canApproveOverDelivery" #actions>
              <UButton
                color="warning"
                variant="soft"
                size="sm"
                class="cursor-pointer"
                icon="i-lucide-check"
                @click="approveAllOverDeliveries"
              >
                Approve Over-Deliveries
              </UButton>
            </template>
          </UAlert>
        </div>

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
                <th class="px-4 py-3 text-left text-label uppercase tracking-wider">PO Qty</th>
                <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Remaining</th>
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
              <!-- Loading State -->
              <tr v-if="loadingInitialData">
                <td colspan="9" class="px-4 py-8">
                  <div class="flex flex-col items-center justify-center gap-3">
                    <UIcon name="i-lucide-loader-2" class="w-8 h-8 text-primary animate-spin" />
                    <p class="text-sm text-[var(--ui-text-muted)]">Loading items...</p>
                  </div>
                </td>
              </tr>

              <tr
                v-for="line in lines"
                v-else
                :key="line.id"
                :class="{
                  'bg-amber-50 dark:bg-amber-950/20': line.has_variance || line.is_over_delivery,
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

                <!-- PO Quantity (Original) -->
                <td class="px-4 py-3">
                  <span v-if="line.po_quantity !== undefined" class="text-caption">
                    {{ formatNumber(line.po_quantity) }}
                  </span>
                  <span v-else class="text-caption">-</span>
                </td>

                <!-- Remaining Quantity -->
                <td class="px-4 py-3">
                  <span
                    v-if="line.remaining_qty !== undefined"
                    :class="[
                      'text-caption font-medium',
                      line.remaining_qty <= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-[var(--ui-text)]',
                    ]"
                  >
                    {{ formatNumber(line.remaining_qty) }}
                    <span
                      v-if="line.delivered_qty && line.delivered_qty > 0"
                      class="text-xs text-[var(--ui-text-muted)]"
                    >
                      ({{ formatNumber(line.delivered_qty) }} received)
                    </span>
                  </span>
                  <span v-else class="text-caption">-</span>
                </td>

                <!-- Quantity -->
                <td class="px-4 py-3">
                  <div class="relative">
                    <UInput
                      v-model="line.quantity"
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="0.00"
                      size="sm"
                      class="w-32"
                      :class="{ 'border-amber-500': line.is_over_delivery }"
                    />
                    <UIcon
                      v-if="line.is_over_delivery"
                      name="i-lucide-alert-triangle"
                      class="absolute -right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500"
                      title="Quantity exceeds PO quantity"
                    />
                  </div>
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
              <tr v-if="!loadingInitialData && lines.length === 0">
                <td colspan="9" class="px-4 py-8 text-center text-[var(--ui-text-muted)]">
                  <div v-if="selectedPO">
                    No items added yet. PO items have been added as suggestions.
                  </div>
                  <div v-else>Select a Purchase Order to load suggested items.</div>
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
          :disabled="savingDraft || posting || sendingForApproval"
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
          :disabled="!isDraftValid || savingDraft || posting || sendingForApproval || !isOnline"
          @click="saveDraft"
        >
          Save Draft
        </UButton>
        <!-- Send For Approval Button - Only for Operators with unapproved over-deliveries -->
        <UButton
          v-if="showSendForApprovalButton"
          color="warning"
          icon="i-lucide-send"
          size="lg"
          class="cursor-pointer rounded-full px-6"
          :loading="sendingForApproval"
          :disabled="!isDraftValid || savingDraft || posting || sendingForApproval || !isOnline"
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
          :disabled="!isFormValid || savingDraft || posting || sendingForApproval || !isOnline"
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

    <!-- Loading Overlay for Draft Save -->
    <LoadingOverlay
      v-if="savingDraft"
      title="Saving Draft..."
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
import { formatCurrency, formatNumber } from "~/utils/format";
import type { OpenPO } from "~/composables/usePOs";

// Composables
const router = useRouter();
const locationStore = useLocationStore();
const periodStore = usePeriodStore();
const toast = useAppToast();
const permissions = usePermissions();
const { isOnline, guardAction } = useOfflineGuard();
const { handleError, handleSuccess, handleWarning } = useErrorHandler();

// Fetch open POs for dropdown
const { openPOs, loading: loadingOpenPOs, refresh: refreshOpenPOs } = useOpenPOs();

// State
const savingDraft = ref(false);
const posting = ref(false);
const sendingForApproval = ref(false);
const showPostConfirmation = ref(false);
const loadingInitialData = ref(true);

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

// Transform open POs for dropdown
const poDropdownItems = computed(() => {
  return openPOs.value.map((po) => ({
    value: po.id,
    label: po.po_no,
    supplierName: po.supplier.name,
    totalAmount: parseFloat(po.total_amount),
  }));
});

// Get selected PO details
const selectedPO = computed<OpenPO | undefined>(() => {
  if (!formData.value.po_id) return undefined;
  return openPOs.value.find((po) => po.id === formData.value.po_id);
});

// Build a map of item_id -> { po_line_id, quantity, delivered_qty, remaining_qty } for delivery tracking
const poLineTrackingMap = computed<
  Record<
    string,
    { po_line_id: string; quantity: number; delivered_qty: number; remaining_qty: number }
  >
>(() => {
  if (!selectedPO.value) return {};
  const map: Record<
    string,
    { po_line_id: string; quantity: number; delivered_qty: number; remaining_qty: number }
  > = {};
  for (const line of selectedPO.value.lines) {
    if (line.item_id) {
      map[line.item_id] = {
        po_line_id: line.id,
        quantity: parseFloat(line.quantity),
        delivered_qty: parseFloat(line.delivered_qty || "0"),
        remaining_qty: parseFloat(line.remaining_qty || line.quantity),
      };
    }
  }
  return map;
});

// Backwards compatibility: simple map for quick lookup
const poQuantityMap = computed<Record<string, number>>(() => {
  if (!selectedPO.value) return {};
  const map: Record<string, number> = {};
  for (const line of selectedPO.value.lines) {
    if (line.item_id) {
      // Use remaining_qty for over-delivery checking
      map[line.item_id] = parseFloat(line.remaining_qty || line.quantity);
    }
  }
  return map;
});

// Form state
const formData = ref({
  supplier_id: "",
  po_id: undefined as string | undefined,
  invoice_no: "",
  delivery_note: "",
  delivery_date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
});

// Delivery lines state - with PO line tracking
const lines = ref<
  Array<{
    id: string;
    item_id: string;
    po_line_id?: string; // Link to the PO line
    quantity: string;
    unit_price: string;
    line_value: number;
    price_variance: number;
    has_variance: boolean;
    period_price?: number;
    po_quantity?: number; // Original PO quantity
    delivered_qty?: number; // Already delivered
    remaining_qty?: number; // What's left to deliver
    is_over_delivery: boolean;
    over_delivery_approved: boolean; // Set to true if user confirms over-delivery
  }>
>([]);

// Add initial empty line
const addLine = () => {
  lines.value.push({
    id: crypto.randomUUID(),
    item_id: "",
    po_line_id: undefined,
    quantity: "",
    unit_price: "",
    line_value: 0,
    price_variance: 0,
    has_variance: false,
    po_quantity: undefined,
    delivered_qty: undefined,
    remaining_qty: undefined,
    is_over_delivery: false,
    over_delivery_approved: false,
  });
};

// Populate delivery lines from selected PO - use remaining quantity
const populateLinesFromPO = (po: OpenPO) => {
  lines.value = po.lines.map((poLine) => {
    const quantity = parseFloat(poLine.quantity);
    const deliveredQty = parseFloat(poLine.delivered_qty || "0");
    const remainingQty = parseFloat(poLine.remaining_qty || poLine.quantity);
    return {
      id: crypto.randomUUID(),
      item_id: poLine.item_id || "",
      po_line_id: poLine.id, // Track the PO line ID
      quantity: remainingQty > 0 ? remainingQty.toString() : "0", // Pre-fill with REMAINING qty
      unit_price: poLine.unit_price,
      line_value: remainingQty * parseFloat(poLine.unit_price),
      price_variance: 0,
      has_variance: false,
      po_quantity: quantity, // Original PO quantity
      delivered_qty: deliveredQty, // Already delivered
      remaining_qty: remainingQty, // What's left
      is_over_delivery: false,
      over_delivery_approved: false,
    };
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

  // Check for over-delivery based on remaining quantity
  const poLineInfo = poLineTrackingMap.value[line.item_id];
  if (poLineInfo) {
    line.po_line_id = poLineInfo.po_line_id;
    line.po_quantity = poLineInfo.quantity;
    line.delivered_qty = poLineInfo.delivered_qty;
    line.remaining_qty = poLineInfo.remaining_qty;
    // Over-delivery is when quantity exceeds what's remaining
    line.is_over_delivery = quantity > poLineInfo.remaining_qty;
  } else {
    line.po_line_id = undefined;
    line.po_quantity = undefined;
    line.delivered_qty = undefined;
    line.remaining_qty = undefined;
    line.is_over_delivery = false;
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

const hasOverDeliveryLines = computed(() => {
  return lines.value.some((line) => line.is_over_delivery);
});

const overDeliveryCount = computed(() => {
  return lines.value.filter((line) => line.is_over_delivery).length;
});

// Check if there are unapproved over-deliveries
const hasUnapprovedOverDelivery = computed(() => {
  return lines.value.some((line) => line.is_over_delivery && !line.over_delivery_approved);
});

// Get current user from auth
const { user } = useAuth();

// Check if user can approve over-deliveries (Supervisor/Admin)
const canApproveOverDelivery = computed(() => {
  return user.value?.role === "SUPERVISOR" || user.value?.role === "ADMIN";
});

// Show "Send For Approval" button only for Operators with unapproved over-deliveries
const showSendForApprovalButton = computed(() => {
  return user.value?.role === "OPERATOR" && hasUnapprovedOverDelivery.value;
});

// Approve all over-deliveries
const approveAllOverDeliveries = () => {
  lines.value.forEach((line) => {
    if (line.is_over_delivery) {
      line.over_delivery_approved = true;
    }
  });
};

// Draft validation (relaxed - for saving as draft)
const isDraftValid = computed(() => {
  return (
    formData.value.po_id && // PO is now required
    selectedPO.value?.supplier.id && // Supplier from PO
    formData.value.delivery_date &&
    lines.value.length > 0 &&
    lines.value.some((line) => line.item_id && line.quantity)
  );
});

// Full validation (strict - for posting)
const isFormValid = computed(() => {
  // Basic validation
  const basicValid =
    formData.value.po_id && // PO is now required
    selectedPO.value?.supplier.id && // Supplier from PO
    formData.value.invoice_no &&
    formData.value.delivery_date &&
    lines.value.length > 0 &&
    lines.value.every((line) => line.item_id && line.quantity && line.unit_price);

  if (!basicValid) return false;

  // Check over-delivery approval requirements
  if (hasUnapprovedOverDelivery.value && !canApproveOverDelivery.value) {
    // Non-Supervisor/Admin cannot submit with unapproved over-deliveries
    return false;
  }

  return true;
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

// Prepare lines data for API - include PO line tracking and over-delivery approval
const prepareLinesData = () => {
  return lines.value
    .filter((line) => line.item_id && line.quantity)
    .map((line) => ({
      item_id: line.item_id,
      po_line_id: line.po_line_id || undefined,
      quantity: parseFloat(line.quantity) || 0,
      unit_price: parseFloat(line.unit_price) || 0,
      over_delivery_approved: line.over_delivery_approved || false,
    }));
};

// Save as draft
const saveDraft = async () => {
  if (!isDraftValid.value) {
    handleError("REQUIRED_FIELD");
    return;
  }

  if (!formData.value.po_id || !selectedPO.value) {
    handleError({
      data: { message: "Please select a Purchase Order before saving a delivery" },
    });
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
              supplier_id: selectedPO.value!.supplier.id, // Use supplier from PO
              po_id: formData.value.po_id,
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

// Send for approval (save draft and notify supervisors)
const sendForApproval = async () => {
  if (!isDraftValid.value) {
    handleError("REQUIRED_FIELD");
    return;
  }

  if (!formData.value.po_id || !selectedPO.value) {
    handleError({
      data: { message: "Please select a Purchase Order before saving a delivery" },
    });
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
      sendingForApproval.value = true;

      try {
        const result: any = await $fetch(
          `/api/locations/${locationStore.activeLocation!.id}/deliveries`,
          {
            method: "post",
            body: {
              supplier_id: selectedPO.value!.supplier.id,
              po_id: formData.value.po_id,
              invoice_no: formData.value.invoice_no || null,
              delivery_note: formData.value.delivery_note || null,
              delivery_date: formData.value.delivery_date
                ? new Date(formData.value.delivery_date).toISOString()
                : new Date().toISOString(),
              lines: prepareLinesData(),
              status: "DRAFT",
              send_for_approval: true,
            },
          }
        );

        handleSuccess(
          "Sent for Approval",
          "Delivery draft saved. Supervisors have been notified for over-delivery approval."
        );

        // Redirect to delivery detail page
        router.push(`/deliveries/${result.id}`);
      } catch (error: any) {
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

// Post delivery (called from confirmation modal)
const postDelivery = async () => {
  if (!isFormValid.value) {
    handleError("REQUIRED_FIELD");
    showPostConfirmation.value = false;
    return;
  }

  if (!formData.value.po_id || !selectedPO.value) {
    handleError({
      data: { message: "Please select a Purchase Order before posting a delivery" },
    });
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
              supplier_id: selectedPO.value!.supplier.id, // Use supplier from PO
              po_id: formData.value.po_id,
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

        // Check if NCRs were created and if PO was auto-closed
        const ncrCount = result.ncrs?.length || 0;
        const poAutoClosed = result.po_auto_closed || false;

        // Build notification messages
        const notificationParts: string[] = [];
        if (ncrCount > 0) {
          notificationParts.push(`${ncrCount} NCR(s) automatically generated for review`);
        }
        if (poAutoClosed) {
          notificationParts.push("PO has been automatically closed (all items fully delivered)");
        }

        if (ncrCount > 0) {
          handleWarning("Delivery Posted with Price Variances", {
            description: notificationParts.join(". ") + ".",
          });
        } else if (poAutoClosed) {
          handleSuccess("Delivery Posted - PO Completed", notificationParts.join(". ") + ".");
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
  try {
    await Promise.all([fetchSuppliers(), fetchItems(), fetchPeriodPrices()]);
  } finally {
    loadingInitialData.value = false;
  }

  // Don't add an initial empty line - wait for PO selection
});

// Watch for PO selection changes
watch(
  () => formData.value.po_id,
  (newPoId) => {
    if (newPoId && selectedPO.value) {
      // Auto-populate lines from selected PO
      populateLinesFromPO(selectedPO.value);
      // Update line calculations
      lines.value.forEach((line) => updateLineCalculations(line));
    } else {
      // Clear lines when no PO selected
      lines.value = [];
    }
  }
);

// Watch for item or price changes to update calculations
watch(
  lines,
  () => {
    lines.value.forEach((line) => updateLineCalculations(line));
  },
  { deep: true }
);
</script>
