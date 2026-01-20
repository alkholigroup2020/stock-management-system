<script setup lang="ts">
/**
 * PRF Detail Page
 *
 * View, edit, and submit a Purchase Requisition Form (PRF).
 * Supports draft editing, submission for approval, and read-only view of approved PRFs.
 */

import { formatCurrency, formatDate } from "~/utils/format";
import type { PRFType, PRFCategory, Unit, POStatus } from "~~/shared/types/database";
import type { PRFFormData, PRFLineInput } from "~/components/orders/PRFForm.vue";

// SEO
useSeoMeta({
  title: "PRF Details - Stock Management System",
  description: "View and manage Purchase Requisition Form",
});

// Composables
const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const locationStore = useLocationStore();
const periodStore = usePeriodStore();
const { canCreatePRF, canApprovePRF, canCreatePO } = usePermissions();
const { isOnline, guardAction } = useOfflineGuard();
const { handleError, handleSuccess, handleWarning } = useErrorHandler();
const { update, remove, submit, clone } = usePRFActions();
const { user } = useAuth();

// State
const prfId = computed(() => route.params.id as string);
const saving = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const cloning = ref(false);
const showDeleteConfirmation = ref(false);
const showSubmitConfirmation = ref(false);
const showCloneConfirmation = ref(false);
const isEditing = ref(false);
const loadingInitialData = ref(true);
const items = ref<Array<{ id: string; code: string; name: string; unit: Unit }>>([]);
const locations = ref<Array<{ id: string; code: string; name: string; locationType: string }>>([]);

// Fetch PRF
const { prf, loading: loadingPRF, refresh: refreshPRF } = usePRF(prfId);

// Form data for editing
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
  lines: [],
});

// Computed
const currentPeriod = computed(() => periodStore.currentPeriod);
const currentPeriodName = computed(() => prf.value?.period?.name || "");

const isDraft = computed(() => prf.value?.status === "DRAFT");
const isPending = computed(() => prf.value?.status === "PENDING");
const isApproved = computed(() => prf.value?.status === "APPROVED");
const isRejected = computed(() => prf.value?.status === "REJECTED");
const isClosed = computed(() => prf.value?.status === "CLOSED");

const canEdit = computed(() => {
  // Only draft PRFs can be edited by the requester
  return isDraft.value && prf.value?.requested_by === user.value?.id && !isEditing.value;
});

const canSubmit = computed(() => {
  // Only draft PRFs can be submitted by the requester
  return (
    isDraft.value &&
    prf.value?.requested_by === user.value?.id &&
    (prf.value?.lines?.length || 0) > 0
  );
});

const canDelete = computed(() => {
  // Only draft PRFs can be deleted by the requester
  return isDraft.value && prf.value?.requested_by === user.value?.id;
});

const canCreatePOFromPRF = computed(() => {
  // Can create PO if:
  // - PRF is approved
  // - User can create PO (procurement specialist or admin)
  // - PRF doesn't already have a PO
  return (
    isApproved.value &&
    canCreatePO() &&
    (!prf.value?.purchase_orders || prf.value.purchase_orders.length === 0)
  );
});

const canClone = computed(() => {
  // Can clone if:
  // - PRF is rejected (primary use case)
  // - User can create PRF (has the permission to create new PRFs)
  return isRejected.value && canCreatePRF();
});

// Navigate to create PO from this PRF
function goToCreatePOFromPRF() {
  router.push(`/orders/pos/create?prf_id=${prfId.value}`);
}

// Form validation for editing
const isFormValid = computed(() => {
  if (!formData.value.location_id || !formData.value.period_id) return false;

  const validLines = formData.value.lines.filter(
    (line) =>
      line.item_description.trim() &&
      parseFloat(line.required_qty) > 0 &&
      parseFloat(line.estimated_price) >= 0
  );

  return validLines.length > 0;
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

// Initialize form data from PRF
function initializeFormData() {
  if (!prf.value) return;

  formData.value = {
    location_id: prf.value.location_id,
    period_id: prf.value.period_id,
    project_name: prf.value.project_name || "",
    prf_type: prf.value.prf_type,
    category: prf.value.category,
    expected_delivery_date: prf.value.expected_delivery_date || "",
    contact_person_name: prf.value.contact_person_name || "",
    contact_person_phone: prf.value.contact_person_phone || "",
    receiver_name: prf.value.receiver_name || "",
    receiver_phone: prf.value.receiver_phone || "",
    notes: prf.value.notes || "",
    lines: prf.value.lines?.map((line) => ({
      id: line.id,
      item_id: line.item_id,
      item_description: line.item_description,
      cost_code: line.cost_code || "",
      unit: line.unit,
      required_qty: line.required_qty,
      estimated_price: line.estimated_price,
      line_value: parseFloat(line.line_value) || 0,
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
            id: line.id.includes("-") ? undefined : line.id, // Only include existing IDs
            item_id: line.item_id || undefined,
            item_description: line.item_description,
            cost_code: line.cost_code || undefined,
            unit: line.unit,
            required_qty: parseFloat(line.required_qty) || 0,
            estimated_price: parseFloat(line.estimated_price) || 0,
            notes: line.notes || undefined,
          }));

        const result = await update(prfId.value, {
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
          handleSuccess("PRF Updated", "Changes have been saved successfully.");
          isEditing.value = false;
          await refreshPRF();
        }
      } catch (error) {
        handleError(error, { context: "updating PRF" });
      } finally {
        saving.value = false;
      }
    },
    {
      offlineMessage: "Cannot update PRF",
      offlineDescription: "You need an internet connection to save changes.",
    }
  );
}

// Submit for approval
async function submitForApproval() {
  showSubmitConfirmation.value = false;

  await guardAction(
    async () => {
      submitting.value = true;

      try {
        const result = await submit(prfId.value);

        if (result) {
          handleSuccess(
            "PRF Submitted",
            `PRF ${prf.value?.prf_no} has been submitted for approval.`
          );
          await refreshPRF();
        }
      } catch (error) {
        handleError(error, { context: "submitting PRF" });
      } finally {
        submitting.value = false;
      }
    },
    {
      offlineMessage: "Cannot submit PRF",
      offlineDescription: "You need an internet connection to submit PRFs.",
    }
  );
}

// Delete PRF
async function deletePRF() {
  showDeleteConfirmation.value = false;

  await guardAction(
    async () => {
      deleting.value = true;

      try {
        const success = await remove(prfId.value);

        if (success) {
          handleSuccess("PRF Deleted", "The PRF has been deleted successfully.");
          router.push("/orders?tab=prfs");
        }
      } catch (error) {
        handleError(error, { context: "deleting PRF" });
      } finally {
        deleting.value = false;
      }
    },
    {
      offlineMessage: "Cannot delete PRF",
      offlineDescription: "You need an internet connection to delete PRFs.",
    }
  );
}

// Clone PRF
async function clonePRF() {
  showCloneConfirmation.value = false;

  await guardAction(
    async () => {
      cloning.value = true;

      try {
        const result = await clone(prfId.value);

        if (result) {
          handleSuccess("PRF Cloned", `New PRF ${result.data.prf_no} has been created as a draft.`);
          // Navigate to the new PRF
          router.push(`/orders/prfs/${result.data.id}`);
        }
      } catch (error) {
        handleError(error, { context: "cloning PRF" });
      } finally {
        cloning.value = false;
      }
    },
    {
      offlineMessage: "Cannot clone PRF",
      offlineDescription: "You need an internet connection to clone PRFs.",
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
    console.error("Failed to fetch locations:", error);
  }
}

// Go back
function goBack() {
  router.push("/orders?tab=prfs");
}

// Handle PRF approved
async function onPRFApproved(result: { email_sent: boolean; email_recipients?: number }) {
  await refreshPRF();
}

// Handle PRF rejected
async function onPRFRejected() {
  await refreshPRF();
}

// Watch for PRF load
watch(prf, (newPrf) => {
  if (newPrf && !isEditing.value) {
    initializeFormData();
  }
});

// Initialize
onMounted(async () => {
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
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          class="cursor-pointer"
          @click="goBack"
        />
        <UIcon name="i-lucide-file-text" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl sm:text-3xl font-bold text-primary">
              {{ prf?.prf_no || "Loading..." }}
            </h1>
            <OrdersPRFStatusBadge v-if="prf?.status" :status="prf.status" size="lg" />
          </div>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Purchase Requisition Form
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="!loadingPRF && prf" class="flex items-center gap-2">
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
          <UButton
            v-if="canDelete"
            color="error"
            variant="soft"
            icon="i-lucide-trash-2"
            size="md"
            class="cursor-pointer rounded-full"
            :disabled="deleting || submitting"
            @click="showDeleteConfirmation = true"
          >
            <span class="hidden sm:inline">Delete</span>
          </UButton>
          <UButton
            v-if="canEdit"
            color="neutral"
            variant="outline"
            icon="i-lucide-pencil"
            size="md"
            class="cursor-pointer rounded-full"
            :disabled="deleting || submitting"
            @click="startEditing"
          >
            <span class="hidden sm:inline">Edit</span>
          </UButton>
          <UButton
            v-if="canSubmit"
            color="primary"
            icon="i-lucide-send"
            size="md"
            class="cursor-pointer rounded-full"
            :loading="submitting"
            :disabled="deleting || !isOnline"
            @click="showSubmitConfirmation = true"
          >
            Submit for Approval
          </UButton>

          <!-- Approval Actions (for pending PRFs) -->
          <OrdersPRFApprovalActions
            v-if="isPending && canApprovePRF()"
            :prf-id="prfId"
            :prf-no="prf?.prf_no || ''"
            :disabled="deleting || submitting"
            @approved="onPRFApproved"
            @rejected="onPRFRejected"
          />

          <!-- Create PO Button (for approved PRFs without PO) -->
          <UButton
            v-if="canCreatePOFromPRF"
            color="primary"
            icon="i-lucide-shopping-cart"
            size="md"
            class="cursor-pointer rounded-full"
            @click="goToCreatePOFromPRF"
          >
            <span class="hidden sm:inline">Create PO</span>
            <span class="sm:hidden">PO</span>
          </UButton>

          <!-- Clone PRF Button (for rejected PRFs) -->
          <UButton
            v-if="canClone"
            color="primary"
            icon="i-lucide-copy"
            size="md"
            class="cursor-pointer rounded-full"
            :loading="cloning"
            :disabled="!isOnline"
            @click="showCloneConfirmation = true"
          >
            <span class="hidden sm:inline">Clone PRF</span>
            <span class="sm:hidden">Clone</span>
          </UButton>
        </template>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loadingPRF || loadingInitialData" class="flex justify-center py-12">
      <div class="flex flex-col items-center gap-3">
        <UIcon name="i-lucide-loader-2" class="w-12 h-12 text-primary animate-spin" />
        <p class="text-sm text-[var(--ui-text-muted)]">Loading PRF...</p>
      </div>
    </div>

    <!-- PRF Not Found -->
    <UCard v-else-if="!prf" class="card-elevated" :ui="{ body: 'p-6' }">
      <div class="text-center py-8">
        <UIcon name="i-lucide-file-x" class="w-16 h-16 mx-auto text-muted mb-4" />
        <h2 class="text-lg font-semibold text-[var(--ui-text)] mb-2">PRF Not Found</h2>
        <p class="text-[var(--ui-text-muted)] mb-4">
          The requested PRF does not exist or you don't have permission to view it.
        </p>
        <UButton color="primary" class="cursor-pointer" @click="goBack">Back to PRFs</UButton>
      </div>
    </UCard>

    <!-- PRF Details -->
    <template v-else>
      <!-- Rejection Reason Alert -->
      <UAlert
        v-if="isRejected && prf.rejection_reason"
        icon="i-lucide-x-circle"
        color="error"
        variant="subtle"
        title="PRF Rejected"
        :description="prf.rejection_reason"
      />

      <!-- Edit Mode Form -->
      <OrdersPRFForm
        v-if="isEditing"
        v-model="formData"
        :items="items"
        :locations="locations"
        :current-period-id="prf.period_id"
        :current-period-name="currentPeriodName"
        :disabled="saving"
        :loading="false"
      />

      <!-- View Mode -->
      <template v-else>
        <!-- PRF Header Info -->
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <template #header>
            <h2 class="text-lg font-semibold text-[var(--ui-text)]">PRF Information</h2>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- PRF Number -->
            <div>
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">PRF Number</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">{{ prf.prf_no }}</p>
            </div>

            <!-- Location -->
            <div>
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Location</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">{{ prf.location?.name }}</p>
            </div>

            <!-- Period -->
            <div>
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Period</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">{{ prf.period?.name }}</p>
            </div>

            <!-- PRF Type -->
            <div>
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Type</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">{{ prf.prf_type }}</p>
            </div>

            <!-- Category -->
            <div>
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Category</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">
                {{ prf.category.replace("_", " ") }}
              </p>
            </div>

            <!-- Request Date -->
            <div>
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Request Date</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">
                {{ formatDate(prf.request_date) }}
              </p>
            </div>

            <!-- Expected Delivery -->
            <div v-if="prf.expected_delivery_date">
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Expected Delivery</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">
                {{ formatDate(prf.expected_delivery_date) }}
              </p>
            </div>

            <!-- Project Name -->
            <div v-if="prf.project_name">
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Project</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">{{ prf.project_name }}</p>
            </div>

            <!-- Requester -->
            <div>
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Requested By</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">
                {{ prf.requester?.full_name || prf.requester?.username }}
              </p>
            </div>

            <!-- Approver (if approved) -->
            <div v-if="prf.approver">
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Approved By</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">
                {{ prf.approver?.full_name || prf.approver?.username }}
              </p>
            </div>

            <!-- Approval Date -->
            <div v-if="prf.approval_date">
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Approval Date</label>
              <p class="text-sm font-medium text-[var(--ui-text)]">
                {{ formatDate(prf.approval_date) }}
              </p>
            </div>

            <!-- Total Value -->
            <div>
              <label class="text-xs text-[var(--ui-text-muted)] uppercase">Total Value</label>
              <p class="text-lg font-bold text-primary">
                {{ formatCurrency(parseFloat(prf.total_value)) }}
              </p>
            </div>
          </div>

          <!-- Contact Information -->
          <div
            v-if="
              prf.contact_person_name ||
              prf.contact_person_phone ||
              prf.receiver_name ||
              prf.receiver_phone
            "
            class="mt-6 pt-6 border-t border-[var(--ui-border)]"
          >
            <h3
              class="text-sm font-semibold text-[var(--ui-text-muted)] mb-4 uppercase tracking-wider"
            >
              Contact Information
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-if="prf.contact_person_name">
                <label class="text-xs text-[var(--ui-text-muted)] uppercase">Contact Person</label>
                <p class="text-sm font-medium text-[var(--ui-text)]">
                  {{ prf.contact_person_name }}
                  <span v-if="prf.contact_person_phone" class="text-[var(--ui-text-muted)]">
                    ({{ prf.contact_person_phone }})
                  </span>
                </p>
              </div>
              <div v-if="prf.receiver_name">
                <label class="text-xs text-[var(--ui-text-muted)] uppercase">Receiver</label>
                <p class="text-sm font-medium text-[var(--ui-text)]">
                  {{ prf.receiver_name }}
                  <span v-if="prf.receiver_phone" class="text-[var(--ui-text-muted)]">
                    ({{ prf.receiver_phone }})
                  </span>
                </p>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="prf.notes" class="mt-6 pt-6 border-t border-[var(--ui-border)]">
            <label class="text-xs text-[var(--ui-text-muted)] uppercase">Notes</label>
            <p class="text-sm text-[var(--ui-text)] mt-1 whitespace-pre-wrap">{{ prf.notes }}</p>
          </div>
        </UCard>

        <!-- Line Items (Read-only) -->
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-list" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text)]">Items Required</h2>
            </div>
          </template>

          <OrdersPRFLineItemsTable
            :lines="
              (prf.lines || []).map((line) => ({
                id: line.id,
                item_id: line.item_id,
                item_description: line.item_description,
                cost_code: line.cost_code || '',
                unit: line.unit,
                required_qty: line.required_qty,
                estimated_price: line.estimated_price,
                line_value: parseFloat(line.line_value) || 0,
                notes: line.notes || '',
              }))
            "
            :items="items"
            :readonly="true"
            :loading="false"
          />
        </UCard>

        <!-- Linked Purchase Orders -->
        <UCard
          v-if="prf.purchase_orders && prf.purchase_orders.length > 0"
          class="card-elevated"
          :ui="{ body: 'p-3 sm:p-4' }"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-shopping-cart" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text)]">Linked Purchase Orders</h2>
            </div>
          </template>

          <div class="space-y-2">
            <div
              v-for="po in prf.purchase_orders"
              :key="po.id"
              class="flex items-center justify-between p-3 bg-[var(--ui-bg)] rounded-lg border border-[var(--ui-border)]"
            >
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-file-text" class="w-5 h-5 text-primary" />
                <span class="font-medium text-[var(--ui-text)]">{{ po.po_no }}</span>
              </div>
              <div class="flex items-center gap-2">
                <OrdersPOStatusBadge :status="po.status as POStatus" size="sm" />
                <UButton
                  icon="i-lucide-external-link"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  class="cursor-pointer"
                  :to="`/orders/pos/${po.id}`"
                />
              </div>
            </div>
          </div>
        </UCard>
      </template>
    </template>

    <!-- Delete Confirmation Modal -->
    <UiConfirmModal
      v-model="showDeleteConfirmation"
      title="Delete PRF"
      message="Are you sure you want to delete this PRF? This action cannot be undone."
      confirm-text="Delete"
      cancel-text="Cancel"
      loading-text="Deleting..."
      :loading="deleting"
      variant="danger"
      @confirm="deletePRF"
    />

    <!-- Submit Confirmation Modal -->
    <UiConfirmModal
      v-model="showSubmitConfirmation"
      title="Submit PRF for Approval"
      message="Once submitted, you will not be able to edit this PRF until it is rejected. The PRF will be reviewed by a supervisor for approval."
      confirm-text="Submit"
      cancel-text="Continue Editing"
      loading-text="Submitting..."
      :loading="submitting"
      variant="warning"
      @confirm="submitForApproval"
    />

    <!-- Clone Confirmation Modal -->
    <UiConfirmModal
      v-model="showCloneConfirmation"
      title="Clone PRF"
      message="This will create a new PRF in Draft status with the same items and details. You can then modify and submit the new PRF for approval."
      confirm-text="Clone PRF"
      cancel-text="Cancel"
      loading-text="Cloning..."
      :loading="cloning"
      variant="info"
      @confirm="clonePRF"
    />

    <!-- Loading Overlays -->
    <LoadingOverlay v-if="saving" title="Saving Changes..." message="Please wait" />
    <LoadingOverlay v-if="submitting" title="Submitting PRF..." message="Please wait" />
    <LoadingOverlay v-if="deleting" title="Deleting PRF..." message="Please wait" />
    <LoadingOverlay v-if="cloning" title="Cloning PRF..." message="Creating new draft" />
  </div>
</template>
