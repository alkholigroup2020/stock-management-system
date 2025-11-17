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
const { canUpdateNCRStatus } = usePermissions();
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
}

// State
const loading = ref(false);
const error = ref<string | null>(null);
const ncr = ref<NCR | null>(null);
const updateLoading = ref(false);
const showUpdateModal = ref(false);

// Form state for status update
const statusUpdateForm = ref({
  status: "",
  resolution_notes: "",
});

// Computed
const ncrId = computed(() => route.params.id as string);

const canUserUpdate = computed(() => {
  if (!ncr.value) return false;
  return canUpdateNCRStatus();
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

// Status options
const statusOptions = [
  { value: "OPEN", label: "Open" },
  { value: "SENT", label: "Sent to Supplier" },
  { value: "CREDITED", label: "Credited" },
  { value: "REJECTED", label: "Rejected by Supplier" },
  { value: "RESOLVED", label: "Resolved" },
];

// Status badge helper
function getStatusColor(
  status: NCR["status"],
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
  } catch (err: any) {
    error.value = err?.data?.message || "Failed to fetch NCR details";
    console.error("Error fetching NCR:", err);

    // If NCR not found, show error briefly then redirect
    if (err?.statusCode === 404) {
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

  updateLoading.value = true;

  try {
    const response = await $fetch<{ message: string; ncr: NCR }>(
      `/api/ncrs/${ncrId.value}`,
      {
        method: "PATCH",
        body: {
          status: statusUpdateForm.value.status,
          resolution_notes: statusUpdateForm.value.resolution_notes || undefined,
        },
      },
    );

    toast.success("NCR Updated", {
      description: response.message || "NCR status has been updated successfully",
    });

    // Refresh NCR data
    await fetchNCR();

    // Close modal
    showUpdateModal.value = false;
  } catch (err: any) {
    console.error("Error updating NCR:", err);

    // Handle specific errors
    if (err.data?.code === "NCR_NOT_FOUND") {
      toast.error("NCR Not Found", {
        description: "The NCR could not be found",
      });
    } else if (err.data?.code === "LOCATION_ACCESS_DENIED") {
      toast.error("Access Denied", {
        description: "You do not have access to this NCR",
      });
    } else if (err.data?.code === "INSUFFICIENT_PERMISSIONS") {
      toast.error("Permission Denied", {
        description: "You do not have permission to update this NCR",
      });
    } else if (err.data?.code === "VALIDATION_ERROR") {
      toast.error("Validation Error", {
        description: err.data?.message || "Invalid data provided",
      });
    } else {
      toast.error("Update Failed", {
        description: err.data?.message || "Failed to update NCR. Please try again.",
      });
    }
  } finally {
    updateLoading.value = false;
  }
}

// Open update modal
function openUpdateModal() {
  // Reset form to current values
  if (ncr.value) {
    statusUpdateForm.value.status = ncr.value.status;
    statusUpdateForm.value.resolution_notes = ncr.value.resolution_notes || "";
  }
  showUpdateModal.value = true;
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
  <div class="p-4 md:p-6">
    <div class="space-y-6">
      <!-- Page Header -->
      <LayoutPageHeader
        :title="ncr ? `NCR ${ncr.ncr_no}` : 'NCR Details'"
        icon="i-lucide-alert-circle"
        :show-location="false"
        :show-period="false"
        location-scope="none"
      >
        <template #actions>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-arrow-left"
            label="Back to NCRs"
            @click="goBack"
          />
        </template>
      </LayoutPageHeader>

      <!-- Error State -->
      <ErrorAlert v-if="error" :message="error" @retry="fetchNCR" />

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>

      <!-- NCR Details -->
      <div v-else-if="ncr" class="space-y-6">
        <!-- NCR Header Card -->
        <UCard class="card-elevated">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-subheading font-semibold">NCR Information</h2>
              <div class="flex items-center gap-2">
                <UBadge :color="getTypeBadgeColor(ncr.type)" variant="soft">
                  {{ getTypeLabel(ncr.type) }}
                </UBadge>
                <UBadge
                  v-if="ncr.auto_generated"
                  color="neutral"
                  variant="soft"
                  icon="i-lucide-zap"
                >
                  Auto-Generated
                </UBadge>
                <UBadge :color="getStatusColor(ncr.status)" variant="soft" size="lg">
                  {{ getStatusLabel(ncr.status) }}
                </UBadge>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <p class="text-heading font-bold text-error">{{ formatCurrency(ncr.value) }}</p>
            </div>

            <!-- Quantity (if available) -->
            <div v-if="ncr.quantity !== null">
              <label class="form-label">Quantity</label>
              <p class="text-body font-medium">{{ Number(ncr.quantity).toFixed(4) }}</p>
            </div>
          </div>
        </UCard>

        <!-- Related Delivery Card (if auto-generated) -->
        <UCard v-if="ncr.delivery && ncr.delivery_line" class="card-elevated border-warning">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-truck" class="h-5 w-5 text-warning" />
                <h2 class="text-subheading font-semibold">Related Delivery</h2>
              </div>
              <UButton
                color="primary"
                variant="outline"
                size="sm"
                icon="i-lucide-external-link"
                @click="goToDelivery"
              >
                View Delivery
              </UButton>
            </div>
          </template>

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
            <div class="mt-4 p-4 rounded-lg bg-warning-50 dark:bg-warning-950 border border-warning">
              <h3 class="text-label font-semibold mb-3 text-warning-700 dark:text-warning-300">
                Price Variance Details
              </h3>
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
                        Math.abs(ncr.delivery_line.unit_price - ncr.delivery_line.period_price),
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
                  <p class="text-heading font-bold text-error">{{ formatCurrency(ncr.value) }}</p>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Reason Card -->
        <UCard class="card-elevated">
          <template #header>
            <h2 class="text-subheading font-semibold">Reason for Non-Conformance</h2>
          </template>

          <div class="text-body whitespace-pre-wrap">{{ ncr.reason }}</div>
        </UCard>

        <!-- Resolution Notes Card (if available) -->
        <UCard v-if="ncr.resolution_notes" class="card-elevated">
          <template #header>
            <h2 class="text-subheading font-semibold">Resolution Notes</h2>
          </template>

          <div class="text-body whitespace-pre-wrap">{{ ncr.resolution_notes }}</div>
        </UCard>

        <!-- Status Update Card (if user can update) -->
        <UCard v-if="canUserUpdate" class="card-elevated border-primary">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-edit" class="h-5 w-5 text-primary" />
              <h2 class="text-subheading font-semibold">Update NCR Status</h2>
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-body">
              Update the status of this NCR as it progresses through the resolution process.
            </p>

            <div class="flex gap-3">
              <UButton
                color="primary"
                icon="i-lucide-edit"
                size="lg"
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
      </div>
    </div>

    <!-- Status Update Modal -->
    <UModal v-model="showUpdateModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-edit" class="h-5 w-5 text-primary" />
            <h3 class="text-subheading font-semibold">Update NCR Status</h3>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Status Dropdown -->
          <div>
            <label class="form-label">Status *</label>
            <select v-model="statusUpdateForm.status" class="form-input w-full">
              <option value="">Select status</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Resolution Notes -->
          <div>
            <label class="form-label">Resolution Notes</label>
            <UTextarea
              v-model="statusUpdateForm.resolution_notes"
              placeholder="Add any notes about the resolution (optional)"
              :rows="4"
            />
            <p class="mt-1 text-caption text-muted">
              Provide details about how this NCR is being resolved or any relevant updates
            </p>
          </div>

          <UAlert
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
              variant="outline"
              @click="showUpdateModal = false"
              :disabled="updateLoading"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              icon="i-lucide-save"
              @click="handleUpdateStatus"
              :loading="updateLoading"
              :disabled="!statusUpdateForm.status"
            >
              Update NCR
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
