<script setup lang="ts">
/**
 * ApprovalRequest Component
 *
 * Displays approval request details with approve/reject actions for
 * period close, transfer, PRF, and PO approvals.
 *
 * @component
 */

// Types
interface Requester {
  id: string;
  username: string;
  full_name: string | null;
  email: string | null;
}

interface Reviewer {
  id: string;
  username: string;
  full_name: string | null;
  email: string | null;
}

interface Approval {
  id: string;
  entityType: "PERIOD_CLOSE" | "TRANSFER" | "PRF" | "PO";
  entityId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requester: Requester;
  reviewer: Reviewer | null;
  requestedAt: string | Date;
  reviewedAt: string | Date | null;
  comments: string | null;
}

// Entity-specific types
interface PeriodEntity {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  period_locations?: Array<{
    location_id: string;
    status: string;
    opening_value: number | null;
    closing_value: number | null;
    ready_at: string | null;
    closed_at: string | null;
    location: {
      id: string;
      code: string;
      name: string;
      type: string;
    };
  }>;
}

interface TransferEntity {
  id: string;
  transfer_no: string;
  status: string;
  from_location: { id: string; code: string; name: string };
  to_location: { id: string; code: string; name: string };
  total_value: number;
  request_date: string;
}

interface PRFEntity {
  id: string;
  prf_no: string;
  status: string;
  request_date: string;
  location: { id: string; code: string; name: string };
}

interface POEntity {
  id: string;
  po_no: string;
  status: string;
  total_amount: number;
  supplier: { id: string; code: string; name: string };
}

type Entity = PeriodEntity | TransferEntity | PRFEntity | POEntity | null;

// Props
interface ApprovalRequestProps {
  approval: Approval;
  entity?: Entity;
  canApprove?: boolean;
  showEntityDetails?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<ApprovalRequestProps>(), {
  canApprove: false,
  showEntityDetails: true,
  loading: false,
});

// Emits
const emit = defineEmits<{
  approve: [approvalId: string];
  reject: [approvalId: string, comment: string];
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

// Computed
const entityTypeLabel = computed(() => {
  const labelMap: Record<string, string> = {
    PERIOD_CLOSE: "Period Close",
    TRANSFER: "Transfer",
    PRF: "Purchase Request Form",
    PO: "Purchase Order",
  };
  return labelMap[props.approval.entityType] || props.approval.entityType;
});

const entityTypeIcon = computed(() => {
  const iconMap: Record<string, string> = {
    PERIOD_CLOSE: "i-lucide-calendar-check",
    TRANSFER: "i-lucide-arrow-right-left",
    PRF: "i-lucide-file-text",
    PO: "i-lucide-shopping-cart",
  };
  return iconMap[props.approval.entityType] || "i-lucide-file";
});

const isPending = computed(() => props.approval.status === "PENDING");

// Methods
const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateShort = (date: string | Date | null | undefined): string => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "—";
  return `SAR ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const handleApproveClick = () => {
  if (!props.canApprove) {
    toast.error("Permission Denied", {
      description: "You do not have permission to approve this request",
    });
    return;
  }
  showApproveModal.value = true;
};

const handleRejectClick = () => {
  if (!props.canApprove) {
    toast.error("Permission Denied", {
      description: "You do not have permission to reject this request",
    });
    return;
  }
  showRejectModal.value = true;
};

const confirmApprove = async () => {
  actionLoading.value = true;

  try {
    await $fetch(`/api/approvals/${props.approval.id}/approve`, {
      method: "PATCH",
    });

    toast.success("Request Approved", {
      description: `${entityTypeLabel.value} request has been approved`,
    });

    emit("approve", props.approval.id);
    emit("success");
    showApproveModal.value = false;
  } catch (err: unknown) {
    console.error("Error approving request:", err);

    const error = err as { data?: { code?: string; message?: string } };
    const message = error.data?.message || "Failed to approve request. Please try again.";
    toast.error("Approval Failed", { description: message });
    emit("error", message);
  } finally {
    actionLoading.value = false;
  }
};

const confirmReject = async () => {
  if (!rejectComment.value.trim()) {
    toast.error("Comment Required", {
      description: "Please provide a reason for rejecting this request",
    });
    return;
  }

  actionLoading.value = true;

  try {
    await $fetch(`/api/approvals/${props.approval.id}/reject`, {
      method: "PATCH",
      body: {
        comments: rejectComment.value,
      },
    });

    toast.success("Request Rejected", {
      description: `${entityTypeLabel.value} request has been rejected`,
    });

    emit("reject", props.approval.id, rejectComment.value);
    emit("success");
    showRejectModal.value = false;
    rejectComment.value = "";
  } catch (err: unknown) {
    console.error("Error rejecting request:", err);

    const error = err as { data?: { code?: string; message?: string } };
    const message = error.data?.message || "Failed to reject request. Please try again.";
    toast.error("Rejection Failed", { description: message });
    emit("error", message);
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

// Type guards for entity rendering
const isPeriodEntity = (entity: Entity): entity is PeriodEntity => {
  return props.approval.entityType === "PERIOD_CLOSE" && entity !== null;
};

const isTransferEntity = (entity: Entity): entity is TransferEntity => {
  return props.approval.entityType === "TRANSFER" && entity !== null;
};

const isPRFEntity = (entity: Entity): entity is PRFEntity => {
  return props.approval.entityType === "PRF" && entity !== null;
};

const isPOEntity = (entity: Entity): entity is POEntity => {
  return props.approval.entityType === "PO" && entity !== null;
};
</script>

<template>
  <UCard class="card-elevated">
    <!-- Header -->
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--ui-bg-elevated)]"
          >
            <UIcon :name="entityTypeIcon" class="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 class="text-subheading font-semibold">{{ entityTypeLabel }} Approval</h2>
            <p class="text-caption text-muted">
              Requested {{ formatDate(approval.requestedAt) }}
            </p>
          </div>
        </div>
        <ApprovalApprovalStatus :status="approval.status" />
      </div>
    </template>

    <!-- Content -->
    <div class="space-y-6">
      <!-- Requester Info -->
      <div class="flex items-start gap-4 p-4 rounded-lg bg-[var(--ui-bg)]">
        <div class="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--ui-primary)]">
          <UIcon name="i-lucide-user" class="w-5 h-5 text-white" />
        </div>
        <div class="flex-1">
          <p class="text-label font-medium">Requested by</p>
          <p class="text-body font-semibold">
            {{ approval.requester.full_name || approval.requester.username }}
          </p>
          <p v-if="approval.requester.email" class="text-caption text-muted">
            {{ approval.requester.email }}
          </p>
        </div>
      </div>

      <!-- Entity Details -->
      <div v-if="showEntityDetails && entity" class="space-y-4">
        <!-- Period Close Details -->
        <template v-if="isPeriodEntity(entity)">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-caption text-muted mb-1">Period Name</p>
              <p class="text-body font-semibold">{{ entity.name }}</p>
            </div>
            <div>
              <p class="text-caption text-muted mb-1">Date Range</p>
              <p class="text-body font-semibold">
                {{ formatDateShort(entity.start_date) }} - {{ formatDateShort(entity.end_date) }}
              </p>
            </div>
          </div>

          <!-- Location Statuses -->
          <div v-if="entity.period_locations && entity.period_locations.length > 0">
            <p class="text-label font-medium mb-3">Location Status</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div
                v-for="pl in entity.period_locations"
                :key="pl.location_id"
                class="flex items-center justify-between p-3 rounded-lg border border-[var(--ui-border)]"
              >
                <div>
                  <p class="text-body font-medium">{{ pl.location.name }}</p>
                  <p class="text-caption text-muted">{{ pl.location.code }}</p>
                </div>
                <UBadge
                  :color="pl.status === 'READY' ? 'success' : pl.status === 'CLOSED' ? 'neutral' : 'warning'"
                  variant="soft"
                  size="sm"
                >
                  {{ pl.status }}
                </UBadge>
              </div>
            </div>
          </div>
        </template>

        <!-- Transfer Details -->
        <template v-else-if="isTransferEntity(entity)">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-caption text-muted mb-1">Transfer Number</p>
              <p class="text-body font-semibold">{{ entity.transfer_no }}</p>
            </div>
            <div>
              <p class="text-caption text-muted mb-1">Total Value</p>
              <p class="text-body font-semibold text-primary">
                {{ formatCurrency(entity.total_value) }}
              </p>
            </div>
            <div>
              <p class="text-caption text-muted mb-1">From Location</p>
              <p class="text-body font-semibold">{{ entity.from_location.name }}</p>
              <p class="text-caption text-muted">{{ entity.from_location.code }}</p>
            </div>
            <div>
              <p class="text-caption text-muted mb-1">To Location</p>
              <p class="text-body font-semibold">{{ entity.to_location.name }}</p>
              <p class="text-caption text-muted">{{ entity.to_location.code }}</p>
            </div>
          </div>
        </template>

        <!-- PRF Details -->
        <template v-else-if="isPRFEntity(entity)">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-caption text-muted mb-1">PRF Number</p>
              <p class="text-body font-semibold">{{ entity.prf_no }}</p>
            </div>
            <div>
              <p class="text-caption text-muted mb-1">Request Date</p>
              <p class="text-body font-semibold">{{ formatDateShort(entity.request_date) }}</p>
            </div>
            <div>
              <p class="text-caption text-muted mb-1">Location</p>
              <p class="text-body font-semibold">{{ entity.location.name }}</p>
              <p class="text-caption text-muted">{{ entity.location.code }}</p>
            </div>
          </div>
        </template>

        <!-- PO Details -->
        <template v-else-if="isPOEntity(entity)">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-caption text-muted mb-1">PO Number</p>
              <p class="text-body font-semibold">{{ entity.po_no }}</p>
            </div>
            <div>
              <p class="text-caption text-muted mb-1">Total Amount</p>
              <p class="text-body font-semibold text-primary">
                {{ formatCurrency(entity.total_amount) }}
              </p>
            </div>
            <div>
              <p class="text-caption text-muted mb-1">Supplier</p>
              <p class="text-body font-semibold">{{ entity.supplier.name }}</p>
              <p class="text-caption text-muted">{{ entity.supplier.code }}</p>
            </div>
          </div>
        </template>
      </div>

      <!-- Reviewer Info (if already processed) -->
      <div
        v-if="approval.reviewer && approval.reviewedAt"
        class="flex items-start gap-4 p-4 rounded-lg border border-[var(--ui-border)]"
      >
        <div
          :class="[
            'flex items-center justify-center w-10 h-10 rounded-full',
            approval.status === 'APPROVED' ? 'bg-[var(--ui-success)]' : 'bg-[var(--ui-error)]'
          ]"
        >
          <UIcon
            :name="approval.status === 'APPROVED' ? 'i-lucide-check' : 'i-lucide-x'"
            class="w-5 h-5 text-white"
          />
        </div>
        <div class="flex-1">
          <p class="text-label font-medium">
            {{ approval.status === 'APPROVED' ? 'Approved' : 'Rejected' }} by
          </p>
          <p class="text-body font-semibold">
            {{ approval.reviewer.full_name || approval.reviewer.username }}
          </p>
          <p class="text-caption text-muted">
            {{ formatDate(approval.reviewedAt) }}
          </p>
          <p v-if="approval.comments" class="mt-2 text-body text-muted italic">
            "{{ approval.comments }}"
          </p>
        </div>
      </div>

      <!-- Action Buttons (only for pending approvals) -->
      <div v-if="isPending && canApprove" class="pt-4 border-t border-[var(--ui-border)]">
        <p class="text-body text-muted mb-4">
          Please review the details above and approve or reject this request.
        </p>

        <div class="flex gap-3">
          <UButton
            color="success"
            icon="i-lucide-check-circle"
            size="lg"
            :disabled="loading"
            class="cursor-pointer"
            @click="handleApproveClick"
          >
            Approve
          </UButton>
          <UButton
            color="error"
            variant="outline"
            icon="i-lucide-x-circle"
            size="lg"
            :disabled="loading"
            class="cursor-pointer"
            @click="handleRejectClick"
          >
            Reject
          </UButton>
        </div>
      </div>
    </div>

    <!-- Approve Confirmation Modal -->
    <UModal v-model:open="showApproveModal">
      <template #content>
        <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-check-circle" class="h-5 w-5 text-success" />
              <h3 class="text-subheading font-semibold">Approve {{ entityTypeLabel }}</h3>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="sm"
              class="cursor-pointer"
              @click="closeApproveModal"
              :disabled="actionLoading"
            />
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-body">
            Are you sure you want to approve this {{ entityTypeLabel.toLowerCase() }} request?
          </p>

          <UAlert
            v-if="approval.entityType === 'PERIOD_CLOSE'"
            icon="i-lucide-alert-triangle"
            color="warning"
            variant="subtle"
            title="Important"
            description="This action will close the period, create snapshots of all stock levels, and lock all transactions. This cannot be undone."
          />

          <UAlert
            v-else-if="approval.entityType === 'TRANSFER'"
            icon="i-lucide-info"
            color="primary"
            variant="subtle"
            description="Stock will be immediately moved from the source to the destination location."
          />

          <UAlert
            v-else
            icon="i-lucide-info"
            color="primary"
            variant="subtle"
            :description="`The ${entityTypeLabel.toLowerCase()} will be marked as approved and can proceed to the next stage.`"
          />
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="outline"
              class="cursor-pointer"
              @click="closeApproveModal"
              :disabled="actionLoading"
            >
              Cancel
            </UButton>
            <UButton
              color="success"
              icon="i-lucide-check"
              class="cursor-pointer"
              @click="confirmApprove"
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
        <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-x-circle" class="h-5 w-5 text-error" />
              <h3 class="text-subheading font-semibold">Reject {{ entityTypeLabel }}</h3>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="sm"
              class="cursor-pointer"
              @click="closeRejectModal"
              :disabled="actionLoading"
            />
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-body">
            Please provide a reason for rejecting this {{ entityTypeLabel.toLowerCase() }} request.
          </p>

          <div>
            <label class="form-label">Reason for Rejection *</label>
            <UTextarea
              v-model="rejectComment"
              placeholder="Enter the reason for rejecting this request"
              :rows="4"
              autofocus
            />
          </div>

          <UAlert
            icon="i-lucide-info"
            color="primary"
            variant="subtle"
            :description="`The request will be marked as rejected. ${approval.entityType === 'PERIOD_CLOSE' ? 'The period will be reverted to OPEN status.' : 'No changes will be made.'}`"
          />
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="outline"
              class="cursor-pointer"
              @click="closeRejectModal"
              :disabled="actionLoading"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              icon="i-lucide-x"
              class="cursor-pointer"
              @click="confirmReject"
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
  </UCard>
</template>
