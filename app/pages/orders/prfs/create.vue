<script setup lang="ts">
/**
 * PRF Create Page
 *
 * Page for creating a new Purchase Requisition Form (PRF).
 * Allows users to fill in header details and add line items.
 */

import type { PRFType, PRFCategory, Unit } from "~~/shared/types/database";
import type { PRFFormData, PRFLineInput } from "~/components/orders/PRFForm.vue";

// SEO
useSeoMeta({
  title: "Create PRF - Stock Management System",
  description: "Create a new Purchase Requisition Form",
});

// Composables
const router = useRouter();
const toast = useAppToast();
const locationStore = useLocationStore();
const periodStore = usePeriodStore();
const { canCreatePRF } = usePermissions();
const { isOnline, guardAction } = useOfflineGuard();
const { handleError, handleSuccess } = useErrorHandler();
const { create } = usePRFActions();

// State
const saving = ref(false);
const loadingInitialData = ref(true);
const items = ref<Array<{ id: string; code: string; name: string; unit: Unit }>>([]);
const locations = ref<Array<{ id: string; code: string; name: string; locationType: string }>>([]);

// Form data with default values
const formData = ref<PRFFormData>({
  location_id: "",
  period_id: "",
  project_name: "",
  prf_type: "NORMAL" as PRFType,
  category: "FOOD" as PRFCategory,
  expected_delivery_date: "",
  contact_person_name: "",
  contact_person_phone: "",
  receiver_name: "",
  receiver_phone: "",
  notes: "",
  lines: [createEmptyLine()],
});

// Create empty line helper
function createEmptyLine(): PRFLineInput {
  return {
    id: crypto.randomUUID(),
    item_id: null,
    item_description: "",
    cost_code: "",
    unit: "EA" as Unit,
    required_qty: "",
    estimated_price: "",
    line_value: 0,
    notes: "",
  };
}

// Computed
const currentPeriod = computed(() => periodStore.currentPeriod);
const activeLocation = computed(() => locationStore.activeLocation);

const currentPeriodName = computed(() => {
  return currentPeriod.value?.name || "No period selected";
});

// Form validation
const isFormValid = computed(() => {
  // Must have location and period
  if (!formData.value.location_id || !formData.value.period_id) return false;

  // Must have at least one valid line
  const validLines = formData.value.lines.filter(
    (line) =>
      line.item_description.trim() &&
      parseFloat(line.required_qty) > 0 &&
      parseFloat(line.estimated_price) >= 0
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

// Save as draft
async function saveDraft() {
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
            item_description: line.item_description,
            cost_code: line.cost_code || undefined,
            unit: line.unit,
            required_qty: parseFloat(line.required_qty) || 0,
            estimated_price: parseFloat(line.estimated_price) || 0,
            notes: line.notes || undefined,
          }));

        const result = await create({
          location_id: formData.value.location_id,
          period_id: formData.value.period_id,
          project_name: formData.value.project_name || undefined,
          prf_type: formData.value.prf_type,
          category: formData.value.category,
          expected_delivery_date: formData.value.expected_delivery_date || undefined,
          contact_person_name: formData.value.contact_person_name || undefined,
          contact_person_phone: formData.value.contact_person_phone || undefined,
          receiver_name: formData.value.receiver_name || undefined,
          receiver_phone: formData.value.receiver_phone || undefined,
          notes: formData.value.notes || undefined,
          lines,
        });

        if (result) {
          handleSuccess("PRF Created", `PRF ${result.prf_no} has been saved as draft.`);
          router.push(`/orders/prfs/${result.id}`);
        }
      } catch (error) {
        handleError(error, { context: "creating PRF" });
      } finally {
        saving.value = false;
      }
    },
    {
      offlineMessage: "Cannot create PRF",
      offlineDescription: "You need an internet connection to create PRFs.",
    }
  );
}

// Cancel and go back
function cancel() {
  router.push("/orders?tab=prfs");
}

// Initialize
onMounted(async () => {
  // Check permission
  if (!canCreatePRF()) {
    handleError({
      data: { message: "You do not have permission to create PRFs" },
    });
    router.push("/orders?tab=prfs");
    return;
  }

  // Check period
  if (!currentPeriod.value) {
    handleError({
      data: { message: "No active period. Please ensure a period is open." },
    });
    router.push("/orders?tab=prfs");
    return;
  }

  // Set default values
  formData.value.period_id = currentPeriod.value.id;
  if (activeLocation.value) {
    formData.value.location_id = activeLocation.value.id;
  }

  // Fetch required data
  try {
    await Promise.all([fetchItems(), fetchLocations()]);
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
        <UIcon name="i-lucide-file-plus" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">New PRF</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Create a new Purchase Requisition Form
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
      <OrdersPRFForm
        v-model="formData"
        :items="items"
        :locations="locations"
        :current-period-id="currentPeriod?.id || ''"
        :current-period-name="currentPeriodName"
        :disabled="saving"
        :loading="loadingInitialData"
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
          icon="i-lucide-save"
          size="lg"
          class="cursor-pointer rounded-full px-6"
          :loading="saving"
          :disabled="!isFormValid || saving || !isOnline"
          @click="saveDraft"
        >
          Save as Draft
        </UButton>
      </div>
    </template>

    <!-- Loading Overlay -->
    <LoadingOverlay
      v-if="saving"
      title="Creating PRF..."
      message="Please wait while we save your PRF"
    />
  </div>
</template>
