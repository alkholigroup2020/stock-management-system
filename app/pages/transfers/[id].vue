<script setup lang="ts">
import { formatCurrency, formatDate } from "~/utils/format";

// SEO
useSeoMeta({
  title: "Transfer Details - Stock Management System",
  description: "View and manage stock transfer details",
});

// Composables
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { canApproveTransfers } = usePermissions();
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
  sub_category?: string;
}

interface TransferLine {
  id: string;
  item: Item;
  quantity: number;
  wac_at_transfer: number;
  line_value: number;
}

interface Transfer {
  id: string;
  transfer_no: string;
  request_date: string;
  approval_date: string | null;
  transfer_date: string | null;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "COMPLETED";
  total_value: number;
  notes: string | null;
  from_location: Location;
  to_location: Location;
  requester: User;
  approver: User | null;
  lines: TransferLine[];
  summary?: {
    total_lines: number;
    total_items: number;
    total_value: number;
  };
  created_at: string;
  updated_at: string;
}

// State
const loading = ref(false);
const error = ref<string | null>(null);
const transfer = ref<Transfer | null>(null);
const showApproveModal = ref(false);
const showRejectModal = ref(false);
const rejectComment = ref("");
const actionLoading = ref(false);

// Computed
const transferId = computed(() => route.params.id as string);

const canUserApprove = computed(() => {
  if (!transfer.value) return false;
  const user = authStore.user;
  if (!user) return false;

  // Check role (Supervisor or Admin)
  const hasRole = user.role === "SUPERVISOR" || user.role === "ADMIN";

  // Check status (must be PENDING_APPROVAL)
  const isPending = transfer.value.status === "PENDING_APPROVAL";

  return hasRole && isPending;
});

const isTransferPending = computed(() => {
  return transfer.value?.status === "PENDING_APPROVAL";
});

const isTransferCompleted = computed(() => {
  return transfer.value?.status === "COMPLETED";
});

const isTransferRejected = computed(() => {
  return transfer.value?.status === "REJECTED";
});

// Status badge helper
function getStatusColor(status: Transfer["status"]) {
  const statusColors = {
    DRAFT: "neutral",
    PENDING_APPROVAL: "primary",
    APPROVED: "success",
    REJECTED: "error",
    COMPLETED: "success",
  } as const;
  return statusColors[status] || "neutral";
}

function getStatusLabel(status: Transfer["status"]) {
  const statusLabels = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending Approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    COMPLETED: "Completed",
  };
  return statusLabels[status] || status;
}

// Fetch transfer
async function fetchTransfer() {
  loading.value = true;
  error.value = null;

  try {
    const response = await $fetch<{ transfer: Transfer }>(`/api/transfers/${transferId.value}`);

    transfer.value = response.transfer;
  } catch (err: any) {
    error.value = err?.data?.message || "Failed to fetch transfer details";
    console.error("Error fetching transfer:", err);

    // If transfer not found, show error briefly then redirect
    if (err?.statusCode === 404) {
      toast.error("Transfer not found");
      setTimeout(() => {
        router.push("/transfers");
      }, 2000);
    }
  } finally {
    loading.value = false;
  }
}

// Approve transfer
async function handleApprove() {
  if (!transfer.value) return;

  actionLoading.value = true;

  try {
    const response = await $fetch<{ message: string; transfer: Transfer }>(
      `/api/transfers/${transferId.value}/approve`,
      {
        method: "PATCH",
      }
    );

    toast.success("Transfer Approved", {
      description: response.message || "Stock has been successfully transferred",
    });

    // Refresh transfer data
    await fetchTransfer();

    // Close modal
    showApproveModal.value = false;
  } catch (err: any) {
    console.error("Error approving transfer:", err);

    // Handle specific errors
    if (err.data?.code === "INSUFFICIENT_STOCK") {
      toast.error("Insufficient Stock", {
        description: "Source location no longer has sufficient stock for this transfer",
      });
    } else if (err.data?.code === "INVALID_STATUS") {
      toast.error("Invalid Status", {
        description: err.data?.message || "Transfer cannot be approved in its current status",
      });
    } else if (err.data?.code === "INSUFFICIENT_PERMISSIONS") {
      toast.error("Permission Denied", {
        description: "You do not have permission to approve this transfer",
      });
    } else {
      toast.error("Approval Failed", {
        description: err.data?.message || "Failed to approve transfer. Please try again.",
      });
    }
  } finally {
    actionLoading.value = false;
  }
}

// Reject transfer
async function handleReject() {
  if (!transfer.value) return;

  if (!rejectComment.value.trim()) {
    toast.error("Comment Required", {
      description: "Please provide a reason for rejecting this transfer",
    });
    return;
  }

  actionLoading.value = true;

  try {
    const response = await $fetch<{ message: string; transfer: Transfer }>(
      `/api/transfers/${transferId.value}/reject`,
      {
        method: "PATCH",
        body: {
          comment: rejectComment.value,
        },
      }
    );

    toast.success("Transfer Rejected", {
      description: response.message || "Transfer has been rejected",
    });

    // Refresh transfer data
    await fetchTransfer();

    // Close modal and reset comment
    showRejectModal.value = false;
    rejectComment.value = "";
  } catch (err: any) {
    console.error("Error rejecting transfer:", err);

    if (err.data?.code === "INVALID_STATUS") {
      toast.error("Invalid Status", {
        description: err.data?.message || "Transfer cannot be rejected in its current status",
      });
    } else if (err.data?.code === "INSUFFICIENT_PERMISSIONS") {
      toast.error("Permission Denied", {
        description: "You do not have permission to reject this transfer",
      });
    } else {
      toast.error("Rejection Failed", {
        description: err.data?.message || "Failed to reject transfer. Please try again.",
      });
    }
  } finally {
    actionLoading.value = false;
  }
}

// Navigation
function goBack() {
  router.push("/transfers");
}

// Initial load
onMounted(async () => {
  await fetchTransfer();
});
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-arrow-left-right" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">
            {{ transfer ? `Transfer ${transfer.transfer_no}` : "Transfer Details" }}
          </h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            View transfer details and approval actions
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
        <span class="hidden sm:inline">Back to Transfers</span>
        <span class="sm:hidden">Back</span>
      </UButton>
    </div>

    <!-- Error State -->
    <ErrorAlert v-if="error" :message="error" @retry="fetchTransfer" />

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Transfer Details -->
    <div v-else-if="transfer" class="space-y-3">
      <!-- Transfer Header Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-subheading font-semibold">Transfer Information</h2>
            <UBadge :color="getStatusColor(transfer.status)" variant="soft" size="lg">
              {{ getStatusLabel(transfer.status) }}
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Transfer No -->
          <div>
            <label class="form-label">Transfer No</label>
            <p class="text-body font-semibold">{{ transfer.transfer_no }}</p>
          </div>

          <!-- Request Date -->
          <div>
            <label class="form-label">Request Date</label>
            <p class="text-body">{{ formatDate(transfer.request_date) }}</p>
          </div>

          <!-- From Location -->
          <div>
            <label class="form-label">From Location</label>
            <p class="text-body font-medium">{{ transfer.from_location.name }}</p>
            <p class="text-caption">{{ transfer.from_location.code }}</p>
          </div>

          <!-- To Location -->
          <div>
            <label class="form-label">To Location</label>
            <p class="text-body font-medium">{{ transfer.to_location.name }}</p>
            <p class="text-caption">{{ transfer.to_location.code }}</p>
          </div>

          <!-- Requested By -->
          <div>
            <label class="form-label">Requested By</label>
            <p class="text-body font-medium">{{ transfer.requester.full_name }}</p>
            <p class="text-caption">{{ transfer.requester.username }}</p>
          </div>

          <!-- Approval Date (if approved/rejected) -->
          <div v-if="transfer.approval_date">
            <label class="form-label">
              {{ isTransferRejected ? "Rejected On" : "Approved On" }}
            </label>
            <p class="text-body">{{ formatDate(transfer.approval_date) }}</p>
          </div>

          <!-- Approved/Rejected By -->
          <div v-if="transfer.approver">
            <label class="form-label">
              {{ isTransferRejected ? "Rejected By" : "Approved By" }}
            </label>
            <p class="text-body font-medium">{{ transfer.approver.full_name }}</p>
            <p class="text-caption">{{ transfer.approver.username }}</p>
          </div>

          <!-- Transfer Date (if completed) -->
          <div v-if="transfer.transfer_date && isTransferCompleted">
            <label class="form-label">Transfer Date</label>
            <p class="text-body">{{ formatDate(transfer.transfer_date) }}</p>
          </div>

          <!-- Notes -->
          <div v-if="transfer.notes" class="lg:col-span-2">
            <label class="form-label">Notes</label>
            <p class="text-body whitespace-pre-wrap">{{ transfer.notes }}</p>
          </div>
        </div>
      </UCard>

      <!-- Transfer Lines Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-0' }">
        <template #header>
          <div class="px-3 py-3 sm:px-4 sm:py-4">
            <h2 class="text-subheading font-semibold">Transfer Items</h2>
          </div>
        </template>

        <!-- Lines Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--ui-border)]">
            <thead>
              <tr class="bg-[var(--ui-bg-elevated)]">
                <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Item Code</th>
                <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Item Name</th>
                <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Unit</th>
                <th class="px-4 py-3 text-right text-label uppercase tracking-wider">Quantity</th>
                <th class="px-4 py-3 text-right text-label uppercase tracking-wider">WAC</th>
                <th class="px-4 py-3 text-right text-label uppercase tracking-wider">Line Value</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--ui-border)]">
              <tr v-for="line in transfer.lines" :key="line.id">
                <!-- Item Code -->
                <td class="whitespace-nowrap px-4 py-3 text-body font-medium">
                  {{ line.item.code }}
                </td>

                <!-- Item Name -->
                <td class="px-4 py-3 text-body">
                  <div class="font-medium">{{ line.item.name }}</div>
                  <div v-if="line.item.category" class="text-caption">
                    {{ line.item.category }}
                    <span v-if="line.item.sub_category">/ {{ line.item.sub_category }}</span>
                  </div>
                </td>

                <!-- Unit -->
                <td class="whitespace-nowrap px-4 py-3 text-body">
                  {{ line.item.unit }}
                </td>

                <!-- Quantity -->
                <td class="whitespace-nowrap px-4 py-3 text-right text-body font-medium">
                  {{ Number(line.quantity).toFixed(4) }}
                </td>

                <!-- WAC -->
                <td class="whitespace-nowrap px-4 py-3 text-right text-body">
                  {{ formatCurrency(line.wac_at_transfer) }}
                </td>

                <!-- Line Value -->
                <td class="whitespace-nowrap px-4 py-3 text-right text-body font-semibold">
                  {{ formatCurrency(line.line_value) }}
                </td>
              </tr>
            </tbody>

            <!-- Summary Row -->
            <tfoot class="border-t-2 border-[var(--ui-border)] bg-[var(--ui-bg-muted)]">
              <tr>
                <td colspan="3" class="px-4 py-3 text-body font-semibold">Total</td>
                <td class="whitespace-nowrap px-4 py-3 text-right text-body font-semibold">
                  {{
                    transfer.lines.reduce((sum, line) => sum + Number(line.quantity), 0).toFixed(4)
                  }}
                </td>
                <td></td>
                <td class="whitespace-nowrap px-4 py-3 text-right text-heading font-bold">
                  {{ formatCurrency(transfer.total_value) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </UCard>

      <!-- Approval Actions Card (Supervisor/Admin only, Pending status only) -->
      <UCard
        v-if="canUserApprove"
        class="card-elevated border-primary"
        :ui="{ body: 'p-3 sm:p-4' }"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-user-check" class="h-5 w-5 text-primary" />
            <h2 class="text-subheading font-semibold">Approval Actions</h2>
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-body">
            This transfer is pending your approval. Please review the details above and choose an
            action:
          </p>

          <div class="flex gap-3">
            <!-- Approve Button -->
            <UButton
              color="success"
              icon="i-lucide-check-circle"
              size="lg"
              class="cursor-pointer"
              @click="showApproveModal = true"
            >
              Approve Transfer
            </UButton>

            <!-- Reject Button -->
            <UButton
              color="error"
              variant="outline"
              icon="i-lucide-x-circle"
              size="lg"
              class="cursor-pointer"
              @click="showRejectModal = true"
            >
              Reject Transfer
            </UButton>
          </div>

          <!-- Warning Alert -->
          <UAlert
            icon="i-lucide-info"
            color="primary"
            variant="subtle"
            title="Important"
            description="Approving this transfer will immediately move stock from the source location to the destination location. This action cannot be undone."
          />
        </div>
      </UCard>
    </div>

    <!-- Approve Confirmation Modal -->
    <UModal v-model:open="showApproveModal">
      <template #content>
        <UCard :ui="{ body: 'p-3 sm:p-4' }">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-success" />
              <h3 class="text-subheading font-semibold">Approve Transfer</h3>
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-body">
              Are you sure you want to approve this transfer? This will immediately:
            </p>

            <ul class="list-disc list-inside space-y-1 text-body ml-2">
              <li>Deduct stock from {{ transfer?.from_location.name }}</li>
              <li>Add stock to {{ transfer?.to_location.name }}</li>
              <li>Mark the transfer as COMPLETED</li>
            </ul>

            <UAlert
              icon="i-lucide-alert-triangle"
              color="warning"
              variant="subtle"
              description="This action cannot be undone. Please ensure you have verified the stock availability."
            />
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="outline"
                class="cursor-pointer"
                @click="showApproveModal = false"
                :disabled="actionLoading"
              >
                Cancel
              </UButton>
              <UButton
                color="success"
                icon="i-lucide-check"
                class="cursor-pointer"
                @click="handleApprove"
                :loading="actionLoading"
              >
                Confirm Approval
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Reject Confirmation Modal -->
    <UModal v-model:open="showRejectModal">
      <template #content>
        <UCard :ui="{ body: 'p-3 sm:p-4' }">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-x-circle" class="h-5 w-5 text-error" />
              <h3 class="text-subheading font-semibold">Reject Transfer</h3>
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-body">
              Please provide a reason for rejecting this transfer. This will help the requester
              understand why the transfer was not approved.
            </p>

            <!-- Rejection Comment -->
            <div>
              <label class="form-label">Reason for Rejection *</label>
              <UTextarea
                v-model="rejectComment"
                placeholder="Enter the reason for rejecting this transfer"
                :rows="4"
                autofocus
                class="w-full"
              />
            </div>

            <UAlert
              icon="i-lucide-info"
              color="primary"
              variant="subtle"
              description="The transfer will be marked as REJECTED and no stock movement will occur."
            />
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="outline"
                class="cursor-pointer"
                @click="
                  showRejectModal = false;
                  rejectComment = '';
                "
                :disabled="actionLoading"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                icon="i-lucide-x"
                class="cursor-pointer"
                @click="handleReject"
                :loading="actionLoading"
                :disabled="!rejectComment.trim()"
              >
                Confirm Rejection
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
