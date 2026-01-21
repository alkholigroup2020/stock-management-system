<script setup lang="ts">
/**
 * PO Detail Page
 *
 * View and edit a Purchase Order (PO).
 * Supports editing open POs and viewing closed POs.
 */

import { formatCurrency, formatDate } from "~/utils/format";
import type { Unit } from "~~/shared/types/database";
import type { POFormData, POLineInput } from "~/components/orders/POForm.vue";

// SEO
useSeoMeta({
  title: "PO Details - Stock Management System",
  description: "View and manage Purchase Order",
});

// Composables
const route = useRoute();
const router = useRouter();
const { canCreatePO } = usePermissions();
const { isProcurementSpecialist, isAdmin, user } = useAuth();
const { isOnline, guardAction } = useOfflineGuard();
const { handleError, handleSuccess } = useErrorHandler();
const { update, close } = usePOActions();

// State
const poId = computed(() => route.params.id as string);
const saving = ref(false);
const closing = ref(false);
const showCloseConfirmation = ref(false);
const isEditing = ref(false);
const loadingInitialData = ref(true);
const items = ref<Array<{ id: string; code: string; name: string; unit: Unit }>>([]);
const suppliers = ref<
  Array<{ id: string; code: string; name: string; emails: string[]; phone: string | null }>
>([]);
const locations = ref<Array<{ id: string; code: string; name: string; locationType: string }>>([]);

// Fetch PO
const { po, loading: loadingPO, refresh: refreshPO } = usePO(poId);

// Form data for editing
const formData = ref<POFormData>({
  prf_id: null,
  supplier_id: "",
  quotation_ref: "",
  ship_to_location_id: "",
  ship_to_contact: "",
  ship_to_phone: "",
  payment_terms: "",
  delivery_terms: "",
  duration_days: "",
  terms_conditions: "",
  notes: "",
  lines: [],
});

// Computed
const isOpen = computed(() => po.value?.status === "OPEN");
const isClosed = computed(() => po.value?.status === "CLOSED");

const canEdit = computed(() => {
  // Only open POs can be edited by procurement specialists or admins
  return isOpen.value && (isProcurementSpecialist.value || isAdmin.value) && !isEditing.value;
});

const canClose = computed(() => {
  // Only open POs can be closed
  return isOpen.value && (isProcurementSpecialist.value || isAdmin.value);
});

// Form validation for editing
const isFormValid = computed(() => {
  if (!formData.value.supplier_id) return false;

  const validLines = formData.value.lines.filter(
    (line) =>
      line.item_description.trim() &&
      parseFloat(line.quantity) > 0 &&
      parseFloat(line.unit_price) >= 0
  );

  return validLines.length > 0;
});

// Create empty line helper
function createEmptyLine(): POLineInput {
  return {
    id: crypto.randomUUID(),
    item_id: null,
    item_code: "",
    item_description: "",
    unit: "EA" as Unit,
    quantity: "",
    unit_price: "",
    discount_percent: "0",
    vat_percent: "15",
    total_before_vat: 0,
    vat_amount: 0,
    total_after_vat: 0,
    notes: "",
  };
}

// Initialize form data from PO
function initializeFormData() {
  if (!po.value) return;

  formData.value = {
    prf_id: po.value.prf_id,
    supplier_id: po.value.supplier_id,
    quotation_ref: po.value.quotation_ref || "",
    ship_to_location_id: po.value.ship_to_location_id || "",
    ship_to_contact: po.value.ship_to_contact || "",
    ship_to_phone: po.value.ship_to_phone || "",
    payment_terms: po.value.payment_terms || "",
    delivery_terms: po.value.delivery_terms || "",
    duration_days: po.value.duration_days?.toString() || "",
    terms_conditions: po.value.terms_conditions || "",
    notes: po.value.notes || "",
    lines: po.value.lines?.map((line) => ({
      id: line.id,
      item_id: line.item_id,
      item_code: line.item_code || "",
      item_description: line.item_description,
      unit: line.unit,
      quantity: line.quantity,
      unit_price: line.unit_price,
      discount_percent: line.discount_percent,
      vat_percent: line.vat_percent,
      total_before_vat: parseFloat(line.total_before_vat) || 0,
      vat_amount: parseFloat(line.vat_amount) || 0,
      total_after_vat: parseFloat(line.total_after_vat) || 0,
      notes: line.notes || "",
    })) || [createEmptyLine()],
  };
}

// Enter edit mode
function startEditing() {
  initializeFormData();
  isEditing.value = true;
}

// Cancel editing
function cancelEditing() {
  isEditing.value = false;
  initializeFormData();
}

// Save changes
async function saveChanges() {
  if (!isFormValid.value) {
    handleError({
      data: { message: "Please fill in all required fields and add at least one line item" },
    });
    return;
  }

  await guardAction(
    async () => {
      saving.value = true;

      try {
        const lines = formData.value.lines
          .filter((line) => line.item_description.trim())
          .map((line) => ({
            id: line.id.includes("-") ? undefined : line.id,
            item_id: line.item_id || undefined,
            item_code: line.item_code || undefined,
            item_description: line.item_description,
            unit: line.unit,
            quantity: parseFloat(line.quantity) || 0,
            unit_price: parseFloat(line.unit_price) || 0,
            discount_percent: parseFloat(line.discount_percent) || 0,
            vat_percent: parseFloat(line.vat_percent) || 15,
            notes: line.notes || undefined,
          }));

        const result = await update(poId.value, {
          quotation_ref: formData.value.quotation_ref || undefined,
          ship_to_location_id: formData.value.ship_to_location_id || undefined,
          ship_to_contact: formData.value.ship_to_contact || undefined,
          ship_to_phone: formData.value.ship_to_phone || undefined,
          payment_terms: formData.value.payment_terms || undefined,
          delivery_terms: formData.value.delivery_terms || undefined,
          duration_days: formData.value.duration_days
            ? parseInt(formData.value.duration_days, 10)
            : undefined,
          terms_conditions: formData.value.terms_conditions || undefined,
          notes: formData.value.notes || undefined,
          lines,
        });

        if (result) {
          handleSuccess("PO Updated", "Changes have been saved successfully.");
          isEditing.value = false;
          await refreshPO();
        }
      } catch (error) {
        handleError(error, { context: "updating PO" });
      } finally {
        saving.value = false;
      }
    },
    {
      offlineMessage: "Cannot update PO",
      offlineDescription: "You need an internet connection to save changes.",
    }
  );
}

// Close PO
async function closePO() {
  showCloseConfirmation.value = false;

  await guardAction(
    async () => {
      closing.value = true;

      try {
        const result = await close(poId.value);

        if (result) {
          let message = `PO ${po.value?.po_no} has been closed.`;
          if (result.prf_closed) {
            message += " The linked PRF has also been closed.";
          }
          handleSuccess("PO Closed", message);
          await refreshPO();
        }
      } catch (error) {
        handleError(error, { context: "closing PO" });
      } finally {
        closing.value = false;
      }
    },
    {
      offlineMessage: "Cannot close PO",
      offlineDescription: "You need an internet connection to close POs.",
    }
  );
}

// Fetch items
async function fetchItems() {
  try {
    const data: { items: Array<{ id: string; code: string; name: string; unit: Unit }> } =
      await $fetch("/api/items", {
        query: { limit: 200, is_active: true },
      });
    items.value = data.items || [];
  } catch (error) {
    console.error("Failed to fetch items:", error);
  }
}

// Fetch suppliers
async function fetchSuppliers() {
  try {
    const data: {
      suppliers: Array<{
        id: string;
        code: string;
        name: string;
        emails: string[];
        phone: string | null;
      }>;
    } = await $fetch("/api/suppliers", {
      query: { is_active: true, limit: 200 },
    });
    suppliers.value = data.suppliers || [];
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
  }
}

// Fetch locations
async function fetchLocations() {
  try {
    const data: {
      locations: Array<{ id: string; code: string; name: string; type: string }>;
    } = await $fetch("/api/locations");
    locations.value = (data.locations || []).map((loc) => ({
      id: loc.id,
      code: loc.code,
      name: loc.name,
      locationType: loc.type,
    }));
  } catch (error) {
    console.error("Failed to fetch locations:", error);
  }
}

// Go back
function goBack() {
  router.push("/orders?tab=pos");
}

// Go to create delivery
function goToCreateDelivery() {
  router.push(`/transactions/deliveries/create?po_id=${poId.value}`);
}

// Watch for PO load
watch(po, (newPo) => {
  if (newPo && !isEditing.value) {
    initializeFormData();
  }
});

// Initialize
onMounted(async () => {
  try {
    await Promise.all([fetchItems(), fetchSuppliers(), fetchLocations()]);
  } finally {
    loadingInitialData.value = false;
  }
});
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          class="cursor-pointer"
          @click="goBack"
        />
        <UIcon name="i-lucide-shopping-cart" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl sm:text-3xl font-bold text-primary">
              {{ po?.po_no || "Loading..." }}
            </h1>
            <OrdersPOStatusBadge v-if="po?.status" :status="po.status" size="lg" />
          </div>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">Purchase Order</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="!loadingPO && po" class="flex items-center gap-2 flex-wrap">
        <!-- Edit Mode Actions -->
        <template v-if="isEditing">
          <UButton
            color="error"
            variant="soft"
            size="md"
            class="cursor-pointer rounded-full"
            :disabled="saving"
            @click="cancelEditing"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-save"
            size="md"
            class="cursor-pointer rounded-full"
            :loading="saving"
            :disabled="!isFormValid || saving || !isOnline"
            @click="saveChanges"
          >
            Save Changes
          </UButton>
        </template>

        <!-- View Mode Actions -->
        <template v-else>
          <!-- Create Delivery -->
          <UButton
            v-if="isOpen"
            color="neutral"
            variant="outline"
            icon="i-lucide-truck"
            size="md"
            class="cursor-pointer rounded-full"
            @click="goToCreateDelivery"
          >
            <span class="hidden sm:inline">Create Delivery</span>
          </UButton>

          <!-- Edit -->
          <UButton
            v-if="canEdit"
            color="neutral"
            variant="outline"
            icon="i-lucide-pencil"
            size="md"
            class="cursor-pointer rounded-full"
            :disabled="closing"
            @click="startEditing"
          >
            <span class="hidden sm:inline">Edit</span>
          </UButton>

          <!-- Close PO -->
          <UButton
            v-if="canClose"
            color="warning"
            icon="i-lucide-lock"
            size="md"
            class="cursor-pointer rounded-full"
            :loading="closing"
            :disabled="!isOnline"
            @click="showCloseConfirmation = true"
          >
            <span class="hidden sm:inline">Close PO</span>
          </UButton>
        </template>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loadingPO || loadingInitialData" class="flex justify-center py-12">
      <div class="flex flex-col items-center gap-3">
        <UIcon name="i-lucide-loader-2" class="w-12 h-12 text-primary animate-spin" />
        <p class="text-sm text-[var(--ui-text-muted)]">Loading PO...</p>
      </div>
    </div>

    <!-- PO Not Found -->
    <UCard v-else-if="!po" class="card-elevated" :ui="{ body: 'p-6' }">
      <div class="text-center py-8">
        <UIcon name="i-lucide-file-x" class="w-16 h-16 mx-auto text-muted mb-4" />
        <h2 class="text-lg font-semibold text-[var(--ui-text)] mb-2">PO Not Found</h2>
        <p class="text-[var(--ui-text-muted)] mb-4">
          The requested PO does not exist or you don't have permission to view it.
        </p>
        <UButton color="primary" class="cursor-pointer" @click="goBack">Back to POs</UButton>
      </div>
    </UCard>

    <!-- PO Details -->
    <template v-else>
      <!-- Edit Mode Form -->
      <OrdersPOForm
        v-if="isEditing"
        v-model="formData"
        :items="items"
        :suppliers="suppliers"
        :locations="locations"
        :disabled="saving"
        :loading="false"
        :show-prf-select="false"
      />

      <!-- View Mode -->
      <template v-else>
        <!-- PO Header Info -->
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <template #header>
            <h2 class="text-lg font-semibold text-[var(--ui-text)]">Purchase Order Details</h2>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- PO Number -->
            <div>
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">PO Number</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">{{ po.po_no }}</p>
            </div>

            <!-- Supplier -->
            <div>
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Supplier</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">{{ po.supplier?.name }}</p>
              <p v-if="po.supplier?.code" class="text-xs text-[var(--ui-text-muted)]">
                {{ po.supplier.code }}
              </p>
            </div>

            <!-- Linked PRF -->
            <div v-if="po.prf">
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Source PRF</label>
              <NuxtLink
                :to="`/orders/prfs/${po.prf.id}`"
                class="text-sm font-medium text-primary hover:underline"
              >
                {{ po.prf.prf_no }}
              </NuxtLink>
            </div>

            <!-- Quotation Reference -->
            <div v-if="po.quotation_ref">
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Quotation Ref</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">{{ po.quotation_ref }}</p>
            </div>

            <!-- Ship-To Location -->
            <div v-if="po.ship_to_location">
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Ship To</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">
                {{ po.ship_to_location.name }}
              </p>
            </div>

            <!-- Contract Duration -->
            <div v-if="po.duration_days">
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Duration</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">{{ po.duration_days }} days</p>
            </div>

            <!-- Created By -->
            <div>
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Created By</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">
                {{ po.creator?.full_name || po.creator?.username }}
              </p>
            </div>

            <!-- Created Date -->
            <div>
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Created Date</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">
                {{ formatDate(po.created_at) }}
              </p>
            </div>
          </div>

          <!-- Ship-To Contact Information -->
          <div
            v-if="po.ship_to_contact || po.ship_to_phone"
            class="mt-6 pt-6 border-t border-[var(--ui-border)]"
          >
            <h3
              class="text-sm font-semibold text-[var(--ui-text-muted)] mb-4 uppercase tracking-wider"
            >
              Shipping Contact
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-if="po.ship_to_contact">
                <label class="text-xs text-[var(--ui-text-muted)] uppercase">Contact Name</label>
                <p class="text-sm font-medium text-[var(--ui-text)]">{{ po.ship_to_contact }}</p>
              </div>
              <div v-if="po.ship_to_phone">
                <label class="text-xs text-[var(--ui-text-muted)] uppercase">Contact Phone</label>
                <p class="text-sm font-medium text-[var(--ui-text)]">{{ po.ship_to_phone }}</p>
              </div>
            </div>
          </div>

          <!-- Terms -->
          <div
            v-if="po.payment_terms || po.delivery_terms || po.terms_conditions"
            class="mt-6 pt-6 border-t border-[var(--ui-border)]"
          >
            <h3
              class="text-sm font-semibold text-[var(--ui-text-muted)] mb-4 uppercase tracking-wider"
            >
              Terms & Conditions
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-if="po.payment_terms">
                <label class="text-xs text-[var(--ui-text-muted)] uppercase">Payment Terms</label>
                <p class="text-sm font-medium text-[var(--ui-text)]">{{ po.payment_terms }}</p>
              </div>
              <div v-if="po.delivery_terms">
                <label class="text-xs text-[var(--ui-text-muted)] uppercase">Delivery Terms</label>
                <p class="text-sm font-medium text-[var(--ui-text)]">{{ po.delivery_terms }}</p>
              </div>
            </div>
            <div v-if="po.terms_conditions" class="mt-4">
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Additional Terms</label>
              <p class="text-sm text-[var(--ui-text)] mt-1 whitespace-pre-wrap">
                {{ po.terms_conditions }}
              </p>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="po.notes" class="mt-6 pt-6 border-t border-[var(--ui-border)]">
            <label class="text-xs text-[var(--ui-text-muted)] uppercase">Notes</label>
            <p class="text-sm text-[var(--ui-text)] mt-1 whitespace-pre-wrap">{{ po.notes }}</p>
          </div>

          <!-- Totals Summary -->
          <div class="mt-6 pt-6 border-t border-[var(--ui-border)]">
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label class="text-xs text-[var(--ui-text-muted)] uppercase">Subtotal</label>
                <p class="text-sm font-medium text-[var(--ui-text)]">
                  {{ formatCurrency(parseFloat(po.total_before_discount)) }}
                </p>
              </div>
              <div v-if="parseFloat(po.total_discount) > 0">
                <label class="text-xs text-[var(--ui-text-muted)] uppercase">Discount</label>
                <p class="text-sm font-medium text-error">
                  -{{ formatCurrency(parseFloat(po.total_discount)) }}
                </p>
              </div>
              <div>
                <label class="text-xs text-[var(--ui-text-muted)] uppercase">Before VAT</label>
                <p class="text-sm font-medium text-[var(--ui-text)]">
                  {{ formatCurrency(parseFloat(po.total_after_discount)) }}
                </p>
              </div>
              <div>
                <label class="text-xs text-[var(--ui-text-muted)] uppercase">VAT (15%)</label>
                <p class="text-sm font-medium text-[var(--ui-text)]">
                  {{ formatCurrency(parseFloat(po.total_vat)) }}
                </p>
              </div>
              <div>
                <label class="text-xs text-[var(--ui-text-muted)] uppercase">Total</label>
                <p class="text-xl font-bold text-primary">
                  {{ formatCurrency(parseFloat(po.total_amount)) }}
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Supplier Information -->
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text)]">Supplier Information</h2>
            </div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Name</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">{{ po.supplier?.name }}</p>
            </div>
            <div>
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Code</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">{{ po.supplier?.code }}</p>
            </div>
            <div v-if="po.supplier?.phone">
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Phone</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">{{ po.supplier.phone }}</p>
            </div>
            <div v-if="po.supplier?.vat_reg_no">
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">VAT Registration</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">{{ po.supplier.vat_reg_no }}</p>
            </div>
            <div v-if="po.supplier?.emails && po.supplier.emails.length > 0" class="md:col-span-2">
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Email(s)</label>
              <div class="flex flex-wrap gap-2 mt-1">
                <UBadge
                  v-for="email in po.supplier.emails"
                  :key="email"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                >
                  {{ email }}
                </UBadge>
              </div>
            </div>
            <div v-if="po.supplier?.address" class="md:col-span-2">
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Address</label>
              <p class="text-sm text-[var(--ui-text)] mt-1 whitespace-pre-wrap">
                {{ po.supplier.address }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Line Items (Read-only) -->
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-list" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text)]">Order Items</h2>
            </div>
          </template>

          <OrdersPOLineItemsTable
            :lines="
              (po.lines || []).map((line) => ({
                id: line.id,
                item_id: line.item_id,
                item_code: line.item_code || '',
                item_description: line.item_description,
                unit: line.unit,
                quantity: line.quantity,
                unit_price: line.unit_price,
                discount_percent: line.discount_percent,
                vat_percent: line.vat_percent,
                total_before_vat: parseFloat(line.total_before_vat) || 0,
                vat_amount: parseFloat(line.vat_amount) || 0,
                total_after_vat: parseFloat(line.total_after_vat) || 0,
                notes: line.notes || '',
              }))
            "
            :items="items"
            :readonly="true"
            :loading="false"
          />
        </UCard>

        <!-- Linked Deliveries -->
        <UCard
          v-if="po.deliveries && po.deliveries.length > 0"
          class="card-elevated"
          :ui="{ body: 'p-3 sm:p-4' }"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-truck" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text)]">Linked Deliveries</h2>
            </div>
          </template>

          <div class="space-y-2">
            <div
              v-for="delivery in po.deliveries"
              :key="delivery.id"
              class="flex items-center justify-between p-3 bg-[var(--ui-bg)] rounded-lg border border-[var(--ui-border)]"
            >
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-package" class="w-5 h-5 text-primary" />
                <div>
                  <span class="font-medium text-[var(--ui-text)]">{{ delivery.delivery_no }}</span>
                  <p class="text-xs text-[var(--ui-text-muted)]">
                    {{ formatDate(delivery.delivery_date) }} •
                    {{ formatCurrency(parseFloat(delivery.total_amount)) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UBadge
                  :color="delivery.status === 'POSTED' ? 'success' : 'warning'"
                  variant="subtle"
                  size="sm"
                >
                  {{ delivery.status }}
                </UBadge>
                <UButton
                  icon="i-lucide-external-link"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  class="cursor-pointer"
                  :to="`/transactions/deliveries/${delivery.id}`"
                />
              </div>
            </div>
          </div>
        </UCard>
      </template>
    </template>

    <!-- Close PO Confirmation Modal -->
    <UiConfirmModal
      v-model="showCloseConfirmation"
      title="Close Purchase Order"
      message="Are you sure you want to close this PO? Once closed, it cannot be edited and no more deliveries can be linked to it."
      confirm-text="Close PO"
      cancel-text="Cancel"
      loading-text="Closing..."
      :loading="closing"
      variant="warning"
      @confirm="closePO"
    />

    <!-- Loading Overlays -->
    <LoadingOverlay v-if="saving" title="Saving Changes..." message="Please wait" />
    <LoadingOverlay v-if="closing" title="Closing PO..." message="Please wait" />
  </div>
</template>
