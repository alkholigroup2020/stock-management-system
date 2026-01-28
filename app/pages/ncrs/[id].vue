<script setup lang="ts">
import { formatCurrency, formatDate, formatDateTime } from "~/utils/format";

// SEO
useSeoMeta({
  title: "NCR Details - Stock Management System",
  description: "View and manage Non-Conformance Report details",
});

// Composables
const route = useRoute();
const router = useRouter();
const { canUpdateNCRStatus, canManageNotificationSettings } = usePermissions();
const toast = useAppToast();

// Types
interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface User {
  id: string;
  username: string;
  full_name: string;
  role?: string;
}

interface Item {
  id: string;
  code: string;
  name: string;
  unit: string;
  category?: string;
}

interface DeliveryLine {
  id: string;
  item: Item;
  quantity: number;
  unit_price: number;
  period_price: number;
  line_value: number;
}

interface Delivery {
  id: string;
  delivery_no: string;
  delivery_date: string;
  supplier: {
    id: string;
    code: string;
    name: string;
  };
}

interface NotificationLog {
  id: string;
  recipient_type: "FINANCE" | "PROCUREMENT" | "SUPPLIER";
  recipients: string[];
  status: "SENT" | "FAILED";
  error_message: string | null;
  sent_at: string;
}

interface NCR {
  id: string;
  ncr_no: string;
  location: Location;
  type: "MANUAL" | "PRICE_VARIANCE";
  auto_generated: boolean;
  delivery: Delivery | null;
  delivery_line: DeliveryLine | null;
  reason: string;
  quantity: number | null;
  value: number;
  status: "OPEN" | "SENT" | "CREDITED" | "REJECTED" | "RESOLVED";
  creator: User;
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  resolution_type: string | null;
  financial_impact: "NONE" | "CREDIT" | "LOSS" | null;
  notification_logs?: NotificationLog[];
}

// State
const loading = ref(false);
const error = ref<string | null>(null);
const ncr = ref<NCR | null>(null);
const updateLoading = ref(false);
const showUpdateModal = ref(false);
const resendLoading = ref(false);

// Form state for status update
const statusUpdateForm = ref({
  status: "",
  resolution_notes: "",
  resolution_type: "",
  financial_impact: "",
});

// Computed
const ncrId = computed(() => route.params.id as string);

const canUserUpdate = computed(() => {
  if (!ncr.value) return false;
  return canUpdateNCRStatus();
});

const canResendNotifications = computed(() => {
  return canManageNotificationSettings();
});

const isNCROpen = computed(() => {
  return ncr.value?.status === "OPEN";
});

const isNCRResolved = computed(() => {
  return (
    ncr.value?.status === "CREDITED" ||
    ncr.value?.status === "REJECTED" ||
    ncr.value?.status === "RESOLVED"
  );
});

// All status options (for reference)
const allStatusOptions = [
  { value: "OPEN", label: "Open" },
  { value: "SENT", label: "Sent to Supplier" },
  { value: "CREDITED", label: "Credited" },
  { value: "REJECTED", label: "Rejected by Supplier" },
  { value: "RESOLVED", label: "Resolved" },
];

// Valid status transitions
// OPEN → SENT, RESOLVED (can skip SENT and resolve directly)
// SENT → CREDITED, REJECTED, RESOLVED
// CREDITED, REJECTED, RESOLVED → (no further transitions - final states)
const validTransitions: Record<string, string[]> = {
  OPEN: ["SENT", "RESOLVED"],
  SENT: ["CREDITED", "REJECTED", "RESOLVED"],
  CREDITED: [], // Final state
  REJECTED: [], // Final state
  RESOLVED: [], // Final state
};

// Computed: Available status options based on current NCR status
const availableStatusOptions = computed(() => {
  if (!ncr.value) return [];

  const currentStatus = ncr.value.status;
  const allowedNextStatuses = validTransitions[currentStatus] || [];

  // Filter to only show valid next statuses
  return allStatusOptions.filter((option) => allowedNextStatuses.includes(option.value));
});

// Status badge helper
function getStatusColor(
  status: NCR["status"]
): "success" | "warning" | "error" | "neutral" | "primary" {
  const statusColors = {
    OPEN: "primary" as const,
    SENT: "warning" as const,
    CREDITED: "success" as const,
    REJECTED: "error" as const,
    RESOLVED: "neutral" as const,
  };
  return statusColors[status] || "neutral";
}

function getStatusLabel(status: NCR["status"]) {
  const statusLabels = {
    OPEN: "Open",
    SENT: "Sent to Supplier",
    CREDITED: "Credited",
    REJECTED: "Rejected",
    RESOLVED: "Resolved",
  };
  return statusLabels[status] || status;
}

function getFinancialImpactLabel(impact: "NONE" | "CREDIT" | "LOSS" | null) {
  if (!impact) return "";
  const impactLabels = {
    NONE: "No Financial Impact",
    CREDIT: "Credit Recovered",
    LOSS: "Loss Incurred",
  };
  return impactLabels[impact] || impact;
}

function getFinancialImpactColor(
  impact: "NONE" | "CREDIT" | "LOSS" | null
): "neutral" | "success" | "error" {
  if (!impact) return "neutral";
  const impactColors = {
    NONE: "neutral" as const,
    CREDIT: "success" as const,
    LOSS: "error" as const,
  };
  return impactColors[impact] || "neutral";
}

function getTypeLabel(type: NCR["type"]) {
  return type === "MANUAL" ? "Manual" : "Price Variance";
}

function getTypeBadgeColor(type: NCR["type"]): "primary" | "warning" {
  return type === "MANUAL" ? "primary" : "warning";
}

// Fetch NCR
async function fetchNCR() {
  loading.value = true;
  error.value = null;

  try {
    const response = await $fetch<{ ncr: NCR }>(`/api/ncrs/${ncrId.value}`);

    ncr.value = response.ncr;

    // Initialize status update form
    statusUpdateForm.value.status = response.ncr.status;
    statusUpdateForm.value.resolution_notes = response.ncr.resolution_notes || "";
    statusUpdateForm.value.resolution_type = response.ncr.resolution_type || "";
    statusUpdateForm.value.financial_impact = response.ncr.financial_impact || "";
  } catch (err: unknown) {
    const fetchError = err as { statusCode?: number; data?: { message?: string } };
    error.value = fetchError?.data?.message || "Failed to fetch NCR details";
    console.error("Error fetching NCR:", err);

    // If NCR not found, show error briefly then redirect
    if (fetchError?.statusCode === 404) {
      toast.error("NCR not found");
      setTimeout(() => {
        router.push("/ncrs");
      }, 2000);
    }
  } finally {
    loading.value = false;
  }
}

// Update NCR status
async function handleUpdateStatus() {
  if (!ncr.value) return;

  // Validation
  if (!statusUpdateForm.value.status) {
    toast.warning("Status Required", {
      description: "Please select a status",
    });
    return;
  }

  // Validate resolution fields when status is RESOLVED
  if (statusUpdateForm.value.status === "RESOLVED") {
    if (!statusUpdateForm.value.resolution_type || !statusUpdateForm.value.resolution_type.trim()) {
      toast.warning("Resolution Type Required", {
        description: "Please provide a resolution type when marking NCR as RESOLVED",
      });
      return;
    }
    if (!statusUpdateForm.value.financial_impact) {
      toast.warning("Financial Impact Required", {
        description: "Please select the financial impact when marking NCR as RESOLVED",
      });
      return;
    }
  }

  updateLoading.value = true;

  // Close modal immediately when save starts - loading overlay will show progress
  showUpdateModal.value = false;

  try {
    const response = await $fetch<{ message: string; ncr: NCR }>(`/api/ncrs/${ncrId.value}`, {
      method: "PATCH",
      body: {
        status: statusUpdateForm.value.status,
        resolution_notes: statusUpdateForm.value.resolution_notes || undefined,
        resolution_type:
          statusUpdateForm.value.status === "RESOLVED"
            ? statusUpdateForm.value.resolution_type
            : undefined,
        financial_impact:
          statusUpdateForm.value.status === "RESOLVED"
            ? statusUpdateForm.value.financial_impact
            : undefined,
      },
    });

    toast.success("NCR Updated", {
      description: response.message || "NCR status has been updated successfully",
    });

    // Refresh NCR data
    await fetchNCR();
  } catch (err: unknown) {
    console.error("Error updating NCR:", err);

    const updateError = err as { data?: { code?: string; message?: string } };

    // Handle specific errors
    if (updateError.data?.code === "NCR_NOT_FOUND") {
      toast.error("NCR Not Found", {
        description: "The NCR could not be found",
      });
    } else if (updateError.data?.code === "LOCATION_ACCESS_DENIED") {
      toast.error("Access Denied", {
        description: "You do not have access to this NCR",
      });
    } else if (updateError.data?.code === "INSUFFICIENT_PERMISSIONS") {
      toast.error("Permission Denied", {
        description: "You do not have permission to update this NCR",
      });
    } else if (updateError.data?.code === "VALIDATION_ERROR") {
      toast.error("Validation Error", {
        description: updateError.data?.message || "Invalid data provided",
      });
    } else {
      toast.error("Update Failed", {
        description: updateError.data?.message || "Failed to update NCR. Please try again.",
      });
    }
  } finally {
    updateLoading.value = false;
  }
}

// Open update modal
function openUpdateModal() {
  // Reset form - user must select a new status and enter fresh notes
  if (ncr.value) {
    statusUpdateForm.value.status = ""; // Force user to select a valid next status
    statusUpdateForm.value.resolution_notes = ""; // Clear notes - each update should have fresh notes
    statusUpdateForm.value.resolution_type = ""; // Clear resolution type
    statusUpdateForm.value.financial_impact = ""; // Clear financial impact
  }
  showUpdateModal.value = true;
}

// Resend notification
async function handleResendNotification(recipientType: "FINANCE" | "PROCUREMENT" | "SUPPLIER") {
  if (!ncr.value) return;

  resendLoading.value = true;

  try {
    const response = await $fetch<{ message: string; recipients: string[] }>(
      `/api/ncrs/${ncrId.value}/resend-notification`,
      {
        method: "POST",
        body: { recipient_type: recipientType },
      }
    );

    const recipientLabel =
      recipientType === "FINANCE"
        ? "Finance Team"
        : recipientType === "PROCUREMENT"
          ? "Procurement Team"
          : "Supplier";

    toast.success("Notification Sent", {
      description: `Notification resent to ${recipientLabel}`,
    });

    // Refresh NCR data to get updated notification logs
    await fetchNCR();
  } catch (err: unknown) {
    console.error("Error resending notification:", err);

    const resendError = err as { statusCode?: number; data?: { code?: string; message?: string } };

    if (resendError.data?.code === "RATE_LIMITED") {
      toast.warning("Rate Limited", {
        description: resendError.data?.message || "Please wait before resending",
      });
    } else if (resendError.data?.code === "NO_RECIPIENTS") {
      toast.warning("No Recipients", {
        description: resendError.data?.message || "No email addresses configured",
      });
    } else {
      toast.error("Send Failed", {
        description: resendError.data?.message || "Failed to resend notification",
      });
    }
  } finally {
    resendLoading.value = false;
  }
}

// Navigation
function goBack() {
  router.push("/ncrs");
}

function goToDelivery() {
  if (ncr.value?.delivery) {
    router.push(`/deliveries/${ncr.value.delivery.id}`);
  }
}

// Initial load
onMounted(async () => {
  await fetchNCR();
});
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-alert-circle" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">
            {{ ncr ? `NCR ${ncr.ncr_no}` : "NCR Details" }}
          </h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            View and manage non-conformance report details
          </p>
        </div>
      </div>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-arrow-left"
        size="lg"
        class="cursor-pointer rounded-full px-3 sm:px-6"
        @click="goBack"
      >
        <span class="hidden sm:inline">Back to NCRs</span>
        <span class="sm:hidden">Back</span>
      </UButton>
    </div>

    <!-- Error State -->
    <ErrorAlert v-if="error" :message="error" @retry="fetchNCR" />

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading NCR details..." />
    </div>

    <!-- NCR Details -->
    <div v-else-if="ncr" class="space-y-3">
      <!-- NCR Header Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">NCR Information</h2>
          <div class="flex items-center gap-2">
            <UBadge :color="getTypeBadgeColor(ncr.type)" variant="soft">
              {{ getTypeLabel(ncr.type) }}
            </UBadge>
            <UBadge
              v-if="ncr.auto_generated"
              color="neutral"
              variant="soft"
              class="inline-flex items-center gap-1"
            >
              <UIcon name="i-lucide-zap" class="h-3 w-3" />
              Auto
            </UBadge>
            <UBadge :color="getStatusColor(ncr.status)" variant="soft" size="lg">
              {{ getStatusLabel(ncr.status) }}
            </UBadge>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          <!-- NCR No -->
          <div>
            <label class="form-label">NCR No</label>
            <p class="text-body font-semibold">{{ ncr.ncr_no }}</p>
          </div>

          <!-- Date -->
          <div>
            <label class="form-label">Date</label>
            <p class="text-body">{{ formatDate(ncr.created_at) }}</p>
          </div>

          <!-- Location -->
          <div>
            <label class="form-label">Location</label>
            <p class="text-body font-medium">{{ ncr.location.name }}</p>
            <p class="text-caption">{{ ncr.location.code }}</p>
          </div>

          <!-- Type -->
          <div>
            <label class="form-label">Type</label>
            <p class="text-body">{{ getTypeLabel(ncr.type) }}</p>
          </div>

          <!-- Created By -->
          <div>
            <label class="form-label">Created By</label>
            <p class="text-body font-medium">{{ ncr.creator.full_name }}</p>
            <p class="text-caption">{{ ncr.creator.username }}</p>
          </div>

          <!-- Resolved Date (if resolved) -->
          <div v-if="ncr.resolved_at">
            <label class="form-label">Resolved On</label>
            <p class="text-body">{{ formatDate(ncr.resolved_at) }}</p>
          </div>

          <!-- Value -->
          <div>
            <label class="form-label">NCR Value</label>
            <p class="text-2xl font-bold text-error">{{ formatCurrency(ncr.value) }}</p>
          </div>

          <!-- Quantity (if available) -->
          <div v-if="ncr.quantity !== null">
            <label class="form-label">Quantity</label>
            <p class="text-body font-medium">{{ Number(ncr.quantity).toFixed(4) }}</p>
          </div>
        </div>
      </UCard>

      <!-- Related Delivery Card (if auto-generated) -->
      <UCard
        v-if="ncr.delivery && ncr.delivery_line"
        class="card-elevated"
        :ui="{ body: 'p-3 sm:p-4' }"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-truck" class="h-5 w-5 text-warning" />
            <h2 class="text-lg font-semibold">Related Delivery</h2>
          </div>
          <UButton
            color="primary"
            variant="outline"
            size="sm"
            icon="i-lucide-external-link"
            class="cursor-pointer"
            @click="goToDelivery"
          >
            View Delivery
          </UButton>
        </div>

        <div class="space-y-4">
          <!-- Delivery Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="form-label">Delivery No</label>
              <p class="text-body font-semibold">{{ ncr.delivery.delivery_no }}</p>
            </div>
            <div>
              <label class="form-label">Delivery Date</label>
              <p class="text-body">{{ formatDate(ncr.delivery.delivery_date) }}</p>
            </div>
            <div class="md:col-span-2">
              <label class="form-label">Supplier</label>
              <p class="text-body font-medium">{{ ncr.delivery.supplier.name }}</p>
              <p class="text-caption">{{ ncr.delivery.supplier.code }}</p>
            </div>
          </div>

          <!-- Price Variance Details -->
          <div class="p-4 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border)]">
            <h3 class="text-sm font-semibold mb-3 text-warning">Price Variance Details</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">Item</label>
                <p class="text-body font-medium">{{ ncr.delivery_line.item.name }}</p>
                <p class="text-caption">{{ ncr.delivery_line.item.code }}</p>
              </div>
              <div>
                <label class="form-label">Quantity</label>
                <p class="text-body">
                  {{ Number(ncr.delivery_line.quantity).toFixed(4) }}
                  {{ ncr.delivery_line.item.unit }}
                </p>
              </div>
              <div>
                <label class="form-label">Period Price (Expected)</label>
                <p class="text-body font-semibold text-success">
                  {{ formatCurrency(ncr.delivery_line.period_price) }}
                </p>
              </div>
              <div>
                <label class="form-label">Delivery Price (Actual)</label>
                <p class="text-body font-semibold text-error">
                  {{ formatCurrency(ncr.delivery_line.unit_price) }}
                </p>
              </div>
              <div>
                <label class="form-label">Price Difference</label>
                <p class="text-body font-bold text-error">
                  {{
                    formatCurrency(
                      Math.abs(ncr.delivery_line.unit_price - ncr.delivery_line.period_price)
                    )
                  }}
                  ({{
                    ncr.delivery_line.unit_price > ncr.delivery_line.period_price
                      ? "Higher"
                      : "Lower"
                  }})
                </p>
              </div>
              <div>
                <label class="form-label">Total Variance Value</label>
                <p class="text-2xl font-bold text-error">{{ formatCurrency(ncr.value) }}</p>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Reason Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <h2 class="text-lg font-semibold mb-4">Reason for Non-Conformance</h2>
        <div class="text-body whitespace-pre-wrap">{{ ncr.reason }}</div>
      </UCard>

      <!-- Resolution Details Card (if resolved) -->
      <UCard
        v-if="ncr.resolution_notes || ncr.resolution_type || ncr.financial_impact"
        class="card-elevated"
        :ui="{ body: 'p-3 sm:p-4' }"
      >
        <div class="flex items-center gap-2 mb-4">
          <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-success" />
          <h2 class="text-lg font-semibold">Resolution Details</h2>
        </div>

        <div class="space-y-4">
          <!-- Resolution Type (if RESOLVED status) -->
          <div v-if="ncr.resolution_type">
            <label class="form-label">Resolution Type</label>
            <p class="text-body font-medium">{{ ncr.resolution_type }}</p>
          </div>

          <!-- Financial Impact (if RESOLVED status) -->
          <div v-if="ncr.financial_impact">
            <label class="form-label">Financial Impact</label>
            <UBadge :color="getFinancialImpactColor(ncr.financial_impact)" variant="soft" size="lg">
              {{ getFinancialImpactLabel(ncr.financial_impact) }}
            </UBadge>
          </div>

          <!-- Resolution Notes -->
          <div v-if="ncr.resolution_notes">
            <label class="form-label">Resolution Notes</label>
            <div class="text-body whitespace-pre-wrap">{{ ncr.resolution_notes }}</div>
          </div>
        </div>
      </UCard>

      <!-- Status Update Card (if user can update) -->
      <UCard v-if="canUserUpdate" class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <div class="flex items-center gap-2 mb-4">
          <UIcon name="i-lucide-edit" class="h-5 w-5 text-primary" />
          <h2 class="text-lg font-semibold">Update NCR Status</h2>
        </div>

        <div class="space-y-4">
          <p class="text-body">
            Update the status of this NCR as it progresses through the resolution process.
          </p>

          <div class="flex gap-3">
            <UButton
              color="primary"
              icon="i-lucide-edit"
              size="lg"
              class="cursor-pointer"
              @click="openUpdateModal"
              :disabled="isNCRResolved"
            >
              Update Status
            </UButton>
          </div>

          <UAlert
            v-if="!isNCRResolved"
            icon="i-lucide-info"
            color="primary"
            variant="subtle"
            title="Status Flow"
            description="NCR Status: OPEN → SENT → CREDITED/REJECTED/RESOLVED. You can also mark as RESOLVED directly if the issue is resolved internally."
          />

          <UAlert
            v-else
            icon="i-lucide-check-circle"
            color="success"
            variant="subtle"
            title="NCR Resolved"
            description="This NCR has been resolved and can no longer be updated."
          />
        </div>
      </UCard>

      <!-- Notification History Card (Admin only) -->
      <UCard v-if="canResendNotifications" class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <div class="flex items-center gap-2 mb-4">
          <UIcon name="i-lucide-mail" class="h-5 w-5 text-primary" />
          <h2 class="text-lg font-semibold">Notification History</h2>
        </div>

        <NcrNotificationHistory
          :ncr-id="ncr.id"
          :logs="ncr.notification_logs || []"
          :can-resend="canResendNotifications"
          @resend="handleResendNotification"
        />
      </UCard>
    </div>

    <!-- Status Update Modal -->
    <UModal v-model:open="showUpdateModal" aria-labelledby="update-ncr-modal-title">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-edit" class="h-5 w-5 text-primary" />
              <h3 id="update-ncr-modal-title" class="text-lg font-semibold">Update NCR Status</h3>
            </div>
          </template>

          <div class="space-y-4">
            <!-- Status Dropdown -->
            <div>
              <label class="form-label">Status *</label>
              <USelectMenu
                v-model="statusUpdateForm.status"
                :items="availableStatusOptions"
                value-key="value"
                placeholder="Select new status"
                size="lg"
                class="w-full"
              />
            </div>

            <!-- Resolution Type (only show when status is RESOLVED) -->
            <div v-if="statusUpdateForm.status === 'RESOLVED'">
              <label class="form-label">Resolution Type *</label>
              <UInput
                v-model="statusUpdateForm.resolution_type"
                placeholder="e.g., Replacement, Writeoff, Price Adjustment"
                size="lg"
                class="w-full"
              />
              <p class="mt-1 text-caption text-muted">
                Specify how this NCR was resolved (e.g., Replacement, Writeoff, Price Adjustment)
              </p>
            </div>

            <!-- Financial Impact (only show when status is RESOLVED) -->
            <div v-if="statusUpdateForm.status === 'RESOLVED'">
              <label class="form-label">Financial Impact *</label>
              <USelectMenu
                v-model="statusUpdateForm.financial_impact"
                :items="[
                  { value: 'NONE', label: 'No Financial Impact' },
                  { value: 'CREDIT', label: 'Credit Recovered' },
                  { value: 'LOSS', label: 'Loss Incurred' },
                ]"
                value-key="value"
                placeholder="Select financial impact"
                size="lg"
                class="w-full"
              />
              <p class="mt-1 text-caption text-muted">
                Select how this resolution affects reconciliation calculations
              </p>
            </div>

            <!-- Resolution Notes -->
            <div>
              <label class="form-label">Resolution Notes</label>
              <UTextarea
                v-model="statusUpdateForm.resolution_notes"
                placeholder="Add any notes about the resolution (optional)"
                :rows="4"
                class="w-full"
              />
              <p class="mt-1 text-caption text-muted">
                Provide details about how this NCR is being resolved or any relevant updates
              </p>
            </div>

            <UAlert
              v-if="statusUpdateForm.status === 'RESOLVED'"
              icon="i-lucide-info"
              color="warning"
              variant="subtle"
              title="Resolution Required"
              description="When marking as RESOLVED, you must specify the resolution type and financial impact. This determines how the NCR affects reconciliation calculations."
            />

            <UAlert
              v-else
              icon="i-lucide-info"
              color="primary"
              variant="subtle"
              description="Updating to CREDITED, REJECTED, or RESOLVED will mark the NCR as resolved and record the resolution timestamp."
            />
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                class="cursor-pointer"
                @click="showUpdateModal = false"
                :disabled="updateLoading"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                icon="i-lucide-save"
                class="cursor-pointer"
                @click="handleUpdateStatus"
                :loading="updateLoading"
                :disabled="!statusUpdateForm.status"
              >
                Update NCR
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Loading Overlay -->
    <LoadingOverlay v-if="updateLoading" title="Updating NCR..." message="Please wait..." />
  </div>
</template>
