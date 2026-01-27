<script setup lang="ts">
/**
 * PO Create Page
 *
 * Page for creating a new Purchase Order (PO).
 * A PO must be created from an approved PRF (1:1 relationship per spec).
 * Can be navigated with query params: ?prf_id=xxx for pre-population from PRF.
 */

import { formatCurrency } from "~/utils/format";
import type { Unit } from "~~/shared/types/database";
import type { POFormData, POLineInput } from "~/components/orders/POForm.vue";

// SEO
useSeoMeta({
  title: "Create PO - Stock Management System",
  description: "Create a new Purchase Order",
});

// Composables
const router = useRouter();
const route = useRoute();
const { canCreatePO } = usePermissions();
const { isProcurementSpecialist, locations: userLocations } = useAuth();
const { isOnline, guardAction } = useOfflineGuard();
const { handleError, handleSuccess } = useErrorHandler();
const { create } = usePOActions();

// State
const saving = ref(false);
const loadingInitialData = ref(true);
const items = ref<Array<{ id: string; code: string; name: string; unit: Unit }>>([]);
const suppliers = ref<
  Array<{ id: string; code: string; name: string; emails: string[]; phone: string | null }>
>([]);
const locations = ref<Array<{ id: string; code: string; name: string; locationType: string }>>([]);
const approvedPRFs = ref<
  Array<{
    id: string;
    prf_no: string;
    requester: string;
    total_value: string;
    location: string;
  }>
>([]);

// Form data with default values
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
  lines: [createEmptyLine()],
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

// Selected PRF for pre-population
const selectedPRF = ref<{
  id: string;
  prf_no: string;
  location_id: string;
  lines: Array<{
    item_id: string | null;
    item_description: string;
    unit: Unit;
    required_qty: string;
    estimated_price: string;
  }>;
} | null>(null);

// Check if there are approved PRFs available to create a PO from
const hasAvailablePRFs = computed(() => approvedPRFs.value.length > 0);

// Check if PRF is pre-selected via query param
const hasPRFFromQuery = computed(() => !!route.query.prf_id);

// Form validation
const isFormValid = computed(() => {
  // Must have PRF selected (mandatory per spec - PO requires approved PRF)
  if (!formData.value.prf_id) return false;

  // Must have supplier
  if (!formData.value.supplier_id) return false;

  // Must have at least one valid line
  const validLines = formData.value.lines.filter(
    (line) =>
      line.item_description.trim() &&
      parseFloat(line.quantity) > 0 &&
      parseFloat(line.unit_price) >= 0
  );

  return validLines.length > 0;
});

// Fetch items
async function fetchItems() {
  try {
    const data: { items: Array<{ id: string; code: string; name: string; unit: Unit }> } =
      await $fetch("/api/items", {
        query: {
          limit: 200,
          is_active: true,
        },
      });
    items.value = data.items || [];
  } catch (error) {
    handleError(error, { context: "fetching items" });
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
    handleError(error, { context: "fetching suppliers" });
  }
}

// Fetch locations
async function fetchLocations() {
  try {
    const data: {
      locations: Array<{ id: string; code: string; name: string; type: string }>;
    } = await $fetch("/api/locations");
    // Map 'type' to 'locationType' to avoid SelectMenuItem conflict
    locations.value = (data.locations || []).map((loc) => ({
      id: loc.id,
      code: loc.code,
      name: loc.name,
      locationType: loc.type,
    }));
  } catch (error) {
    handleError(error, { context: "fetching locations" });
  }
}

// Fetch approved PRFs (without PO)
async function fetchApprovedPRFs() {
  try {
    const data: {
      data: Array<{
        id: string;
        prf_no: string;
        total_value: string;
        requester: { full_name: string | null };
        location: { name: string };
        purchase_orders: Array<{ id: string }>;
      }>;
    } = await $fetch("/api/prfs", {
      query: {
        status: "APPROVED",
        limit: 100,
      },
    });

    // Filter PRFs that don't already have a PO
    approvedPRFs.value = (data.data || [])
      .filter((prf) => !prf.purchase_orders || prf.purchase_orders.length === 0)
      .map((prf) => ({
        id: prf.id,
        prf_no: prf.prf_no,
        requester: prf.requester.full_name || "Unknown",
        total_value: formatCurrency(parseFloat(prf.total_value) || 0),
        location: prf.location.name,
      }));
  } catch (error) {
    handleError(error, { context: "fetching approved PRFs" });
  }
}

// Fetch PRF details for pre-population
async function fetchPRFDetails(prfId: string) {
  try {
    const data: {
      data: {
        id: string;
        prf_no: string;
        location_id: string;
        lines: Array<{
          item_id: string | null;
          item_description: string;
          unit: Unit;
          required_qty: string;
          estimated_price: string;
        }>;
      };
    } = await $fetch(`/api/prfs/${prfId}`);

    selectedPRF.value = data.data;

    // Pre-populate form from PRF
    formData.value.prf_id = data.data.id;
    formData.value.ship_to_location_id = data.data.location_id;

    // Convert PRF lines to PO lines
    if (data.data.lines.length > 0) {
      formData.value.lines = data.data.lines.map((line) => ({
        id: crypto.randomUUID(),
        item_id: line.item_id,
        item_code: "",
        item_description: line.item_description,
        unit: line.unit,
        quantity: line.required_qty,
        unit_price: line.estimated_price,
        discount_percent: "0",
        vat_percent: "15",
        total_before_vat: parseFloat(line.required_qty) * parseFloat(line.estimated_price),
        vat_amount: parseFloat(line.required_qty) * parseFloat(line.estimated_price) * 0.15,
        total_after_vat: parseFloat(line.required_qty) * parseFloat(line.estimated_price) * 1.15,
        notes: "",
      }));
    }
  } catch (error) {
    handleError(error, { context: "fetching PRF details" });
  }
}

// Handle PRF selection change
async function handlePrfSelected(prfId: string | null) {
  if (prfId) {
    await fetchPRFDetails(prfId);
  } else {
    // Clear PRF-related data
    selectedPRF.value = null;
    formData.value.prf_id = null;
    formData.value.lines = [createEmptyLine()];
  }
}

// Create PO
async function createPO() {
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
        // Prepare lines data
        const lines = formData.value.lines
          .filter((line) => line.item_description.trim())
          .map((line) => ({
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

        const result = await create({
          prf_id: formData.value.prf_id || undefined,
          supplier_id: formData.value.supplier_id,
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
          handleSuccess("PO Created", `PO ${result.data.po_no} has been created.`);
          router.push(`/orders/pos/${result.data.id}`);
        }
      } catch (error) {
        handleError(error, { context: "creating PO" });
      } finally {
        saving.value = false;
      }
    },
    {
      offlineMessage: "Cannot create PO",
      offlineDescription: "You need an internet connection to create POs.",
    }
  );
}

// Cancel and go back
function cancel() {
  router.push("/orders?tab=pos");
}

// Initialize
onMounted(async () => {
  // Check permission
  if (!canCreatePO()) {
    handleError({
      data: { message: "You do not have permission to create POs" },
    });
    router.push("/orders?tab=pos");
    return;
  }

  // Check location assignments for PROCUREMENT_SPECIALIST
  if (isProcurementSpecialist.value && (!userLocations.value || userLocations.value.length === 0)) {
    handleError({
      data: { message: "You need at least one location assignment to create POs" },
    });
    router.push("/orders?tab=pos");
    return;
  }

  // Fetch required data
  try {
    await Promise.all([fetchItems(), fetchSuppliers(), fetchLocations(), fetchApprovedPRFs()]);

    // Check for prf_id in query params
    const prfIdFromQuery = route.query.prf_id as string | undefined;
    if (prfIdFromQuery) {
      await fetchPRFDetails(prfIdFromQuery);
    }
  } finally {
    loadingInitialData.value = false;
  }
});
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Enhanced Page Header -->
    <div
      class="relative overflow-hidden rounded-lg sm:rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] p-4 sm:p-6 shadow-sm"
    >
      <!-- Subtle Decorative Pattern -->
      <div
        class="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style="
          background-image: radial-gradient(
            circle at 1px 1px,
            var(--ui-text-muted) 1px,
            transparent 0
          );
          background-size: 24px 24px;
        "
      />

      <div class="relative flex items-center justify-between gap-3 sm:gap-6">
        <div class="flex items-center gap-3 sm:gap-5">
          <!-- Icon with Primary Color Accent -->
          <div
            class="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/10 dark:bg-primary/15 border border-primary/20 dark:border-primary/30 shadow-sm"
          >
            <UIcon name="i-lucide-shopping-cart" class="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          </div>

          <!-- Title Section -->
          <div>
            <h1 class="text-xl sm:text-3xl lg:text-4xl font-bold text-primary tracking-tight">
              New Purchase Order
            </h1>
            <p
              class="hidden sm:block text-sm sm:text-base text-[var(--ui-text-muted)] mt-1 font-medium"
            >
              Create a new Purchase Order
              <span v-if="selectedPRF" class="text-primary">from {{ selectedPRF.prf_no }}</span>
            </p>
          </div>
        </div>

        <!-- Supplier Indicator (shown when supplier is selected) -->
        <div
          v-if="formData.supplier_id && suppliers.find((s) => s.id === formData.supplier_id)"
          class="hidden lg:flex items-center gap-3 px-4 py-3 bg-[var(--ui-bg-muted)] rounded-xl border border-[var(--ui-border)]"
        >
          <UIcon name="i-lucide-building-2" class="w-6 h-6 text-primary flex-shrink-0" />
          <div class="text-right">
            <p class="text-xs text-[var(--ui-text-muted)] uppercase tracking-wider font-semibold">
              Supplier
            </p>
            <p class="text-sm font-bold text-[var(--ui-text)]">
              {{ suppliers.find((s) => s.id === formData.supplier_id)?.name }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loadingInitialData" class="flex justify-center py-16">
      <div class="flex flex-col items-center gap-4">
        <UIcon name="i-lucide-loader-2" class="w-12 h-12 text-primary animate-spin" />
        <p class="text-sm text-[var(--ui-text-muted)] font-medium">Loading form data...</p>
      </div>
    </div>

    <!-- No Approved PRFs Available Alert -->
    <template v-else-if="!hasAvailablePRFs && !hasPRFFromQuery">
      <UCard class="card-elevated">
        <div class="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div
            class="flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4"
          >
            <UIcon name="i-lucide-file-x" class="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-2">
            No Approved PRFs Available
          </h3>
          <p class="text-sm text-[var(--ui-text-muted)] max-w-md mb-6">
            You must have an approved Purchase Requisition Form (PRF) to create a Purchase Order.
            Please create and get a PRF approved first.
          </p>
          <UButton
            color="primary"
            icon="i-lucide-arrow-left"
            class="cursor-pointer"
            @click="cancel"
          >
            Back to Orders
          </UButton>
        </div>
      </UCard>
    </template>

    <!-- Main Form -->
    <template v-else>
      <OrdersPOForm
        v-model="formData"
        :items="items"
        :suppliers="suppliers"
        :locations="locations"
        :prf-options="approvedPRFs"
        :disabled="saving"
        :loading="loadingInitialData"
        :show-prf-select="!hasPRFFromQuery"
        @prf-selected="handlePrfSelected"
      />

      <!-- Sticky Footer with Form Actions -->
      <div
        class="sticky bottom-0 z-10 bg-[var(--ui-bg-elevated)]/95 dark:bg-[var(--ui-bg-elevated)]/98 backdrop-blur-md border-t border-[var(--ui-border)] rounded-t-lg shadow-2xl -mx-4 px-4 py-4 sm:mx-0 sm:px-6 sm:rounded-xl"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <!-- Form Status Indicator -->
          <div class="hidden sm:flex items-center gap-2 text-sm text-[var(--ui-text-muted)]">
            <UIcon
              :name="isFormValid ? 'i-lucide-check-circle-2' : 'i-lucide-alert-circle'"
              :class="['w-5 h-5', isFormValid ? 'text-emerald-500' : 'text-amber-500']"
            />
            <span class="font-medium">
              {{ isFormValid ? "Form ready to submit" : "Please complete all required fields" }}
            </span>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center gap-3 ml-auto">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              class="cursor-pointer rounded-full px-6 hover:bg-[var(--ui-bg-elevated)] transition-all"
              :disabled="saving"
              @click="cancel"
            >
              <UIcon name="i-lucide-x" class="w-4 h-4 sm:mr-2" />
              <span class="hidden sm:inline">Cancel</span>
            </UButton>
            <UButton
              color="primary"
              icon="i-lucide-check"
              size="lg"
              class="cursor-pointer rounded-full px-6 shadow-lg hover:shadow-xl transition-all"
              :loading="saving"
              :disabled="!isFormValid || saving || !isOnline"
              @click="createPO"
            >
              Create PO
            </UButton>
          </div>
        </div>
      </div>
    </template>

    <!-- Loading Overlay -->
    <LoadingOverlay
      v-if="saving"
      title="Creating PO..."
      message="Please wait while we create your PO"
    />
  </div>
</template>
