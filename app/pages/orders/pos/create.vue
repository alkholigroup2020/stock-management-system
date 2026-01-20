<script setup lang="ts">
/**
 * PO Create Page
 *
 * Page for creating a new Purchase Order (PO).
 * Supports creating PO from approved PRF or as a standalone PO.
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

// Form validation
const isFormValid = computed(() => {
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
          const emailInfo = result.email_sent
            ? ` Email sent to ${result.email_recipients || 0} recipient(s).`
            : " (No email sent - supplier has no email configured)";

          handleSuccess("PO Created", `PO ${result.data.po_no} has been created.${emailInfo}`);
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
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-shopping-cart" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">New Purchase Order</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Create a new Purchase Order
            <span v-if="selectedPRF" class="text-primary">from {{ selectedPRF.prf_no }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loadingInitialData" class="flex justify-center py-12">
      <div class="flex flex-col items-center gap-3">
        <UIcon name="i-lucide-loader-2" class="w-12 h-12 text-primary animate-spin" />
        <p class="text-sm text-[var(--ui-text-muted)]">Loading form data...</p>
      </div>
    </div>

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
        :show-prf-select="!route.query.prf_id"
        @prf-selected="handlePrfSelected"
      />

      <!-- Form Actions -->
      <div class="flex flex-wrap items-center justify-end gap-3">
        <UButton
          color="error"
          variant="soft"
          size="lg"
          class="cursor-pointer rounded-full px-6"
          :disabled="saving"
          @click="cancel"
        >
          Cancel
        </UButton>
        <UButton
          color="primary"
          icon="i-lucide-check"
          size="lg"
          class="cursor-pointer rounded-full px-6"
          :loading="saving"
          :disabled="!isFormValid || saving || !isOnline"
          @click="createPO"
        >
          Create PO
        </UButton>
      </div>
    </template>

    <!-- Loading Overlay -->
    <LoadingOverlay
      v-if="saving"
      title="Creating PO..."
      message="Please wait while we create your PO and notify the supplier"
    />
  </div>
</template>
