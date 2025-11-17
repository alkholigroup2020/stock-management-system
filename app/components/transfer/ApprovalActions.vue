<script setup lang="ts">
/**
 * ApprovalActions Component
 *
 * Provides approve/reject action buttons with modal confirmations for transfer approval workflow.
 * Designed for supervisor and admin users to approve or reject pending transfers.
 *
 * @component
 */

// Props
interface ApprovalActionsProps {
  transferId: string;
  fromLocationName: string;
  toLocationName: string;
  canApprove?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<ApprovalActionsProps>(), {
  canApprove: true,
  loading: false,
});

// Emits
const emit = defineEmits<{
  approve: [];
  reject: [comment: string];
  success: [];
  error: [message: string];
}>();

// Composables
const toast = useAppToast();

// State
const showApproveModal = ref(false);
const showRejectModal = ref(false);
const rejectComment = ref("");
const actionLoading = ref(false);

// Methods
const handleApproveClick = () => {
  if (!props.canApprove) {
    toast.error("Permission Denied", {
      description: "You do not have permission to approve this transfer",
    });
    return;
  }
  showApproveModal.value = true;
};

const handleRejectClick = () => {
  if (!props.canApprove) {
    toast.error("Permission Denied", {
      description: "You do not have permission to reject this transfer",
    });
    return;
  }
  showRejectModal.value = true;
};

const confirmApprove = async () => {
  actionLoading.value = true;

  try {
    const response = await $fetch(`/api/transfers/${props.transferId}/approve`, {
      method: "PATCH",
    });

    toast.success("Transfer Approved", {
      description: "Stock has been successfully transferred",
    });

    emit("approve");
    emit("success");
    showApproveModal.value = false;
  } catch (err: any) {
    console.error("Error approving transfer:", err);

    // Handle specific errors
    if (err.data?.code === "INSUFFICIENT_STOCK") {
      const message = "Source location no longer has sufficient stock for this transfer";
      toast.error("Insufficient Stock", { description: message });
      emit("error", message);
    } else if (err.data?.code === "INVALID_STATUS") {
      const message = err.data?.message || "Transfer cannot be approved in its current status";
      toast.error("Invalid Status", { description: message });
      emit("error", message);
    } else if (err.data?.code === "INSUFFICIENT_PERMISSIONS") {
      const message = "You do not have permission to approve this transfer";
      toast.error("Permission Denied", { description: message });
      emit("error", message);
    } else {
      const message = err.data?.message || "Failed to approve transfer. Please try again.";
      toast.error("Approval Failed", { description: message });
      emit("error", message);
    }
  } finally {
    actionLoading.value = false;
  }
};

const confirmReject = async () => {
  if (!rejectComment.value.trim()) {
    toast.error("Comment Required", {
      description: "Please provide a reason for rejecting this transfer",
    });
    return;
  }

  actionLoading.value = true;

  try {
    const response = await $fetch(`/api/transfers/${props.transferId}/reject`, {
      method: "PATCH",
      body: {
        comment: rejectComment.value,
      },
    });

    toast.success("Transfer Rejected", {
      description: "Transfer has been rejected",
    });

    emit("reject", rejectComment.value);
    emit("success");
    showRejectModal.value = false;
    rejectComment.value = "";
  } catch (err: any) {
    console.error("Error rejecting transfer:", err);

    if (err.data?.code === "INVALID_STATUS") {
      const message = err.data?.message || "Transfer cannot be rejected in its current status";
      toast.error("Invalid Status", { description: message });
      emit("error", message);
    } else if (err.data?.code === "INSUFFICIENT_PERMISSIONS") {
      const message = "You do not have permission to reject this transfer";
      toast.error("Permission Denied", { description: message });
      emit("error", message);
    } else {
      const message = err.data?.message || "Failed to reject transfer. Please try again.";
      toast.error("Rejection Failed", { description: message });
      emit("error", message);
    }
  } finally {
    actionLoading.value = false;
  }
};

const closeApproveModal = () => {
  if (!actionLoading.value) {
    showApproveModal.value = false;
  }
};

const closeRejectModal = () => {
  if (!actionLoading.value) {
    showRejectModal.value = false;
    rejectComment.value = "";
  }
};
</script>

<template>
  <div>
    <!-- Action Buttons Card -->
    <UCard class="card-elevated border-primary">
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
            @click="handleApproveClick"
            :disabled="!canApprove || loading"
          >
            Approve Transfer
          </UButton>

          <!-- Reject Button -->
          <UButton
            color="error"
            variant="outline"
            icon="i-lucide-x-circle"
            size="lg"
            @click="handleRejectClick"
            :disabled="!canApprove || loading"
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

    <!-- Approve Confirmation Modal -->
    <UModal v-model="showApproveModal">
      <UCard>
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
            <li>Deduct stock from {{ fromLocationName }}</li>
            <li>Add stock to {{ toLocationName }}</li>
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
              @click="closeApproveModal"
              :disabled="actionLoading"
            >
              Cancel
            </UButton>
            <UButton
              color="success"
              icon="i-lucide-check"
              @click="confirmApprove"
              :loading="actionLoading"
            >
              Confirm Approval
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Reject Confirmation Modal -->
    <UModal v-model="showRejectModal">
      <UCard>
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
              @click="closeRejectModal"
              :disabled="actionLoading"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              icon="i-lucide-x"
              @click="confirmReject"
              :loading="actionLoading"
              :disabled="!rejectComment.trim()"
            >
              Confirm Rejection
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
