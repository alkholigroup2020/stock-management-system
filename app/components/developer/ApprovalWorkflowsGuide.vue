<script setup lang="ts">
import type { Ref } from "vue";

const expandedSections = ref<string[]>([]);

const toggleSection = (section: string) => {
  if (expandedSections.value.includes(section)) {
    expandedSections.value = [];
  } else {
    expandedSections.value = [section];
  }
};

const isExpanded = (section: string) => expandedSections.value.includes(section);

const targetSubSection = inject<Ref<string | null>>("devTargetSection", ref(null));

watch(
  targetSubSection,
  (newSection) => {
    if (newSection) {
      if (!expandedSections.value.includes(newSection)) {
        expandedSections.value.push(newSection);
      }
      nextTick(() => {
        const element = document.getElementById(`dev-section-${newSection}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (targetSubSection.value) {
          targetSubSection.value = null;
        }
      });
    }
  },
  { immediate: true }
);

// Code examples
const codeExamples = {
  approvalModel: `// Approval Model - Generic approval system for all entity types
// File: prisma/schema.prisma

model Approval {
  id           String             @id @default(uuid()) @db.Uuid
  entity_type  ApprovalEntityType // PRF, PO, PERIOD_CLOSE, TRANSFER
  entity_id    String             @db.Uuid  // Links to the actual entity
  status       ApprovalStatus     @default(PENDING)
  requested_by String             @db.Uuid
  reviewed_by  String?            @db.Uuid
  requested_at DateTime           @default(now()) @db.Timestamptz(6)
  reviewed_at  DateTime?          @db.Timestamptz(6)
  comments     String?            // Rejection reason or approval notes
  requester    User               @relation("ApprovalRequester", ...)
  reviewer     User?              @relation("ApprovalReviewer", ...)

  @@index([entity_type])
  @@index([entity_id])
  @@index([status])
  @@map("approvals")
}

// Approval Entity Type Enum
enum ApprovalEntityType {
  PRF           // Purchase Request Form
  PO            // Purchase Order
  PERIOD_CLOSE  // Period close request
  TRANSFER      // Inter-location transfer
}

// Approval Status Enum
enum ApprovalStatus {
  PENDING   // Awaiting reviewer action
  APPROVED  // Approved by reviewer
  REJECTED  // Rejected by reviewer
}`,

  approvalWorkflowDiagram: `// Generic Approval Workflow
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                        APPROVAL WORKFLOW                                     │
// └─────────────────────────────────────────────────────────────────────────────┘
//
//   OPERATOR/USER                              SUPERVISOR/ADMIN
//   ─────────────                              ────────────────
//
//   ┌────────────────┐
//   │ Create Entity  │ (PRF, Transfer, etc.)
//   │   (DRAFT)      │
//   └───────┬────────┘
//           │
//           │ Submit for Approval
//           ▼
//   ┌────────────────┐                    ┌────────────────────────┐
//   │    Create      │───────────────────►│    Review Request      │
//   │   Approval     │                    │   (PENDING status)     │
//   │   Request      │                    └───────────┬────────────┘
//   └────────────────┘                                │
//                                    ┌────────────────┴────────────────┐
//                                    │                                 │
//                                    ▼                                 ▼
//                            ┌───────────────┐               ┌───────────────┐
//                            │   APPROVED    │               │   REJECTED    │
//                            │ Execute action│               │ Return to     │
//                            │ (post entity) │               │ requester     │
//                            └───────────────┘               └───────────────┘
//
// Key Points:
// ───────────
// 1. Approval is a separate entity linked by entity_type + entity_id
// 2. Single approval per entity (one-to-one relationship)
// 3. Approval status determines if entity can be executed/posted
// 4. Comments field captures rejection reason or approval notes`,

  approvalTypeMatrix: `// Approval Type Requirements Matrix
//
// ┌────────────────┬──────────────────┬───────────────────────┬─────────────────┐
// │  Entity Type   │  Who Can Request │   Who Can Approve     │  Post-Approval  │
// ├────────────────┼──────────────────┼───────────────────────┼─────────────────┤
// │  PRF           │  Operator+       │   Supervisor, Admin   │  Create PO      │
// │                │                  │                       │                 │
// │  PO            │  Operator+       │   Supervisor, Admin   │  Submit to      │
// │                │                  │                       │  supplier       │
// │                │                  │                       │                 │
// │  TRANSFER      │  Operator+       │   Supervisor, Admin   │  Execute stock  │
// │                │                  │                       │  movement       │
// │                │                  │                       │                 │
// │  PERIOD_CLOSE  │  Supervisor      │   Admin only          │  Close period,  │
// │                │                  │                       │  capture        │
// │                │                  │                       │  snapshots      │
// └────────────────┴──────────────────┴───────────────────────┴─────────────────┘
//
// Role Hierarchy:
// ───────────────
// ADMIN > SUPERVISOR > OPERATOR
//
// Note: Admins can always approve (includes Supervisor permissions)`,

  createApprovalRequest: `// Create Approval Request
// File: server/utils/approval.ts

import { ApprovalEntityType, ApprovalStatus, type Prisma } from "@prisma/client";

interface CreateApprovalParams {
  entityType: ApprovalEntityType;
  entityId: string;
  requestedBy: string;
  comments?: string;
}

/**
 * Create an approval request for an entity
 * Called when submitting PRF, Transfer, or Period Close
 */
export async function createApprovalRequest(
  tx: Prisma.TransactionClient,
  params: CreateApprovalParams
) {
  const { entityType, entityId, requestedBy, comments } = params;

  // Check if approval already exists for this entity
  const existing = await tx.approval.findFirst({
    where: {
      entity_type: entityType,
      entity_id: entityId,
    },
  });

  if (existing) {
    throw createError({
      statusCode: 400,
      data: {
        code: "APPROVAL_ALREADY_EXISTS",
        message: "An approval request already exists for this entity",
      },
    });
  }

  // Create new approval request
  const approval = await tx.approval.create({
    data: {
      entity_type: entityType,
      entity_id: entityId,
      status: "PENDING",
      requested_by: requestedBy,
      requested_at: new Date(),
      comments,
    },
    include: {
      requester: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return approval;
}`,

  submitTransferForApproval: `// Submit Transfer for Approval - Example Flow
// File: server/api/transfers/[id]/submit.patch.ts

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const transferId = getRouterParam(event, "id");

  // Step 1: Fetch transfer and validate status
  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    include: { transfer_lines: true },
  });

  if (!transfer) {
    throw createError({
      statusCode: 404,
      data: { code: "TRANSFER_NOT_FOUND" },
    });
  }

  if (transfer.status !== "DRAFT") {
    throw createError({
      statusCode: 400,
      data: {
        code: "INVALID_STATUS",
        message: "Only DRAFT transfers can be submitted for approval",
      },
    });
  }

  // Step 2: Validate user has access to source location
  await validateLocationAccess(user, transfer.from_location_id);

  // Step 3: Validate stock availability before submission
  await validateStockAvailability(
    transfer.from_location_id,
    transfer.transfer_lines
  );

  // Step 4: Create approval request and update transfer status
  const result = await prisma.$transaction(async (tx) => {
    // Create approval record
    const approval = await createApprovalRequest(tx, {
      entityType: "TRANSFER",
      entityId: transferId,
      requestedBy: user.id,
    });

    // Update transfer status
    const updatedTransfer = await tx.transfer.update({
      where: { id: transferId },
      data: {
        status: "PENDING_APPROVAL",
        request_date: new Date(),
      },
    });

    return { transfer: updatedTransfer, approval };
  });

  return {
    message: "Transfer submitted for approval",
    transfer: result.transfer,
    approval: result.approval,
  };
});`,

  processApproval: `// Process Approval (Approve/Reject)
// File: server/utils/approval.ts

interface ProcessApprovalParams {
  approvalId: string;
  reviewerId: string;
  action: "APPROVED" | "REJECTED";
  comments?: string;
}

/**
 * Process an approval request (approve or reject)
 * Returns the updated approval record
 */
export async function processApproval(
  tx: Prisma.TransactionClient,
  params: ProcessApprovalParams
) {
  const { approvalId, reviewerId, action, comments } = params;

  // Fetch current approval
  const approval = await tx.approval.findUnique({
    where: { id: approvalId },
    include: { requester: true },
  });

  if (!approval) {
    throw createError({
      statusCode: 404,
      data: { code: "APPROVAL_NOT_FOUND" },
    });
  }

  if (approval.status !== "PENDING") {
    throw createError({
      statusCode: 400,
      data: {
        code: "APPROVAL_ALREADY_PROCESSED",
        message: \`This approval has already been \${approval.status.toLowerCase()}\`,
      },
    });
  }

  // Update approval record
  const updatedApproval = await tx.approval.update({
    where: { id: approvalId },
    data: {
      status: action,
      reviewed_by: reviewerId,
      reviewed_at: new Date(),
      comments: comments || approval.comments,
    },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      reviewer: { select: { id: true, name: true, email: true } },
    },
  });

  return updatedApproval;
}`,

  approveTransfer: `// Approve Transfer API Endpoint
// File: server/api/approvals/[id]/approve.patch.ts

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const approvalId = getRouterParam(event, "id");
  const body = await readBody(event);

  // Step 1: Validate permissions
  if (user.role !== "SUPERVISOR" && user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      data: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: "Only Supervisors and Admins can approve requests",
      },
    });
  }

  // Step 2: Fetch approval and validate type
  const approval = await prisma.approval.findUnique({
    where: { id: approvalId },
  });

  if (!approval || approval.status !== "PENDING") {
    throw createError({
      statusCode: 400,
      data: { code: "INVALID_APPROVAL_STATE" },
    });
  }

  // Step 3: Execute approval and post-approval action in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Process the approval
    const updatedApproval = await processApproval(tx, {
      approvalId,
      reviewerId: user.id,
      action: "APPROVED",
      comments: body.comments,
    });

    // Execute post-approval action based on entity type
    let entityResult;
    switch (approval.entity_type) {
      case "TRANSFER":
        entityResult = await executeTransferApproval(tx, approval.entity_id, user.id);
        break;
      case "PRF":
        entityResult = await executePRFApproval(tx, approval.entity_id, user.id);
        break;
      case "PO":
        entityResult = await executePOApproval(tx, approval.entity_id, user.id);
        break;
      case "PERIOD_CLOSE":
        // Admin-only check for period close
        if (user.role !== "ADMIN") {
          throw createError({
            statusCode: 403,
            data: { code: "ADMIN_REQUIRED", message: "Only Admins can approve period close" },
          });
        }
        entityResult = await executePeriodClose(tx, approval.entity_id, user.id);
        break;
    }

    return { approval: updatedApproval, entity: entityResult };
  }, { timeout: 30000 });

  return {
    message: \`\${approval.entity_type} approved successfully\`,
    ...result,
  };
});`,

  rejectApproval: `// Reject Approval API Endpoint
// File: server/api/approvals/[id]/reject.patch.ts

const bodySchema = z.object({
  comments: z.string().min(1, "Rejection reason is required"),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const approvalId = getRouterParam(event, "id");
  const body = bodySchema.parse(await readBody(event));

  // Step 1: Validate permissions
  if (user.role !== "SUPERVISOR" && user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      data: { code: "INSUFFICIENT_PERMISSIONS" },
    });
  }

  // Step 2: Fetch approval
  const approval = await prisma.approval.findUnique({
    where: { id: approvalId },
  });

  if (!approval || approval.status !== "PENDING") {
    throw createError({
      statusCode: 400,
      data: { code: "INVALID_APPROVAL_STATE" },
    });
  }

  // Step 3: Process rejection and update entity status
  const result = await prisma.$transaction(async (tx) => {
    // Process the rejection
    const updatedApproval = await processApproval(tx, {
      approvalId,
      reviewerId: user.id,
      action: "REJECTED",
      comments: body.comments,  // Required for rejections
    });

    // Update entity status based on type
    let entityResult;
    switch (approval.entity_type) {
      case "TRANSFER":
        entityResult = await tx.transfer.update({
          where: { id: approval.entity_id },
          data: { status: "REJECTED" },
        });
        break;
      case "PRF":
        entityResult = await tx.prf.update({
          where: { id: approval.entity_id },
          data: { status: "REJECTED" },
        });
        break;
      case "PO":
        entityResult = await tx.po.update({
          where: { id: approval.entity_id },
          data: { status: "REJECTED" },
        });
        break;
      case "PERIOD_CLOSE":
        // Period close rejection - mark period back to OPEN
        entityResult = await tx.period.update({
          where: { id: approval.entity_id },
          data: { status: "OPEN" },
        });
        break;
    }

    return { approval: updatedApproval, entity: entityResult };
  });

  return {
    message: \`\${approval.entity_type} rejected\`,
    ...result,
  };
});

// Key Points:
// ───────────
// 1. Rejection reason (comments) is REQUIRED
// 2. Entity status reverts (Transfer: REJECTED, Period: OPEN)
// 3. Rejection is final - cannot be undone
// 4. Requester is notified of rejection reason`,

  roleRequirementsCode: `// Role-Based Approval Permissions
// File: server/utils/approval.ts

type ApprovalEntityType = "PRF" | "PO" | "TRANSFER" | "PERIOD_CLOSE";
type UserRole = "OPERATOR" | "SUPERVISOR" | "ADMIN";

/**
 * Check if user can approve a specific entity type
 */
export function canApprove(
  userRole: UserRole,
  entityType: ApprovalEntityType
): boolean {
  // Approval permission matrix
  const permissions: Record<ApprovalEntityType, UserRole[]> = {
    PRF: ["SUPERVISOR", "ADMIN"],
    PO: ["SUPERVISOR", "ADMIN"],
    TRANSFER: ["SUPERVISOR", "ADMIN"],
    PERIOD_CLOSE: ["ADMIN"],  // Admin only!
  };

  return permissions[entityType].includes(userRole);
}

/**
 * Check if user can request approval for entity type
 */
export function canRequest(
  userRole: UserRole,
  entityType: ApprovalEntityType
): boolean {
  // Request permission matrix
  const permissions: Record<ApprovalEntityType, UserRole[]> = {
    PRF: ["OPERATOR", "SUPERVISOR", "ADMIN"],
    PO: ["OPERATOR", "SUPERVISOR", "ADMIN"],
    TRANSFER: ["OPERATOR", "SUPERVISOR", "ADMIN"],
    PERIOD_CLOSE: ["SUPERVISOR", "ADMIN"],  // Supervisor+ only
  };

  return permissions[entityType].includes(userRole);
}

// Usage in API route:
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const approval = await getApproval(approvalId);

  // Check permission before processing
  if (!canApprove(user.role, approval.entity_type)) {
    throw createError({
      statusCode: 403,
      data: {
        code: "INSUFFICIENT_PERMISSIONS",
        message: \`Your role cannot approve \${approval.entity_type} requests\`,
      },
    });
  }

  // Proceed with approval...
});`,

  periodCloseApproval: `// Period Close Approval - Admin Only
// File: server/api/periods/[id]/approve-close.patch.ts

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const periodId = getRouterParam(event, "id");

  // Step 1: Admin-only check
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      data: {
        code: "ADMIN_REQUIRED",
        message: "Only Administrators can approve period close",
      },
    });
  }

  // Step 2: Validate period is in PENDING_CLOSE status
  const period = await prisma.period.findUnique({
    where: { id: periodId },
    include: {
      period_locations: { include: { location: true } },
    },
  });

  if (!period) {
    throw createError({
      statusCode: 404,
      data: { code: "PERIOD_NOT_FOUND" },
    });
  }

  if (period.status !== "PENDING_CLOSE") {
    throw createError({
      statusCode: 400,
      data: {
        code: "INVALID_PERIOD_STATUS",
        message: "Period must be in PENDING_CLOSE status to approve close",
      },
    });
  }

  // Step 3: Verify all locations are READY
  const notReadyLocations = period.period_locations.filter(
    (pl) => pl.status !== "READY"
  );

  if (notReadyLocations.length > 0) {
    throw createError({
      statusCode: 400,
      data: {
        code: "LOCATIONS_NOT_READY",
        message: "All locations must be READY before period can be closed",
        details: notReadyLocations.map((pl) => pl.location.name),
      },
    });
  }

  // Step 4: Execute coordinated close with snapshots
  const result = await prisma.$transaction(async (tx) => {
    // Create approval record
    const approval = await createApprovalRequest(tx, {
      entityType: "PERIOD_CLOSE",
      entityId: periodId,
      requestedBy: user.id,
    });

    // Process immediate approval (Admin self-approves)
    await processApproval(tx, {
      approvalId: approval.id,
      reviewerId: user.id,
      action: "APPROVED",
      comments: "Period closed by administrator",
    });

    // Close all period locations with snapshots
    for (const periodLocation of period.period_locations) {
      const snapshot = await captureLocationSnapshot(tx, periodLocation);

      await tx.periodLocation.update({
        where: { id: periodLocation.id },
        data: {
          status: "CLOSED",
          closing_value: snapshot.totalValue,
          snapshot_data: snapshot,
        },
      });
    }

    // Close the period
    const closedPeriod = await tx.period.update({
      where: { id: periodId },
      data: {
        status: "CLOSED",
        approval_id: approval.id,
      },
    });

    return { period: closedPeriod, approval };
  }, { timeout: 60000 });  // Longer timeout for multi-location snapshots

  return {
    message: "Period closed successfully",
    ...result,
  };
});`,

  approvalStatusComponent: `// Approval Status Badge Component
// File: app/components/approval/ApprovalStatusBadge.vue

<script setup lang="ts">
interface Props {
  status: "PENDING" | "APPROVED" | "REJECTED";
  size?: "xs" | "sm" | "md";
  showIcon?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: "sm",
  showIcon: true,
});

const statusConfig = computed(() => {
  const configs = {
    PENDING: {
      color: "warning" as const,
      icon: "i-heroicons-clock",
      label: "Pending Approval",
    },
    APPROVED: {
      color: "success" as const,
      icon: "i-heroicons-check-circle",
      label: "Approved",
    },
    REJECTED: {
      color: "error" as const,
      icon: "i-heroicons-x-circle",
      label: "Rejected",
    },
  };
  return configs[props.status];
});
<\/script>

<template>
  <UBadge
    :color="statusConfig.color"
    variant="soft"
    :size="size"
    class="inline-flex items-center gap-1"
  >
    <UIcon v-if="showIcon" :name="statusConfig.icon" class="text-current" />
    {{ statusConfig.label }}
  </UBadge>
</template>`,

  approvalActionsComponent: `// Approval Actions Component
// File: app/components/approval/ApprovalActions.vue

<script setup lang="ts">
import type { Approval } from "~/shared/types";

interface Props {
  approval: Approval;
  loading?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  approve: [approvalId: string];
  reject: [approvalId: string, reason: string];
}>();

const { user } = useAuth();

// Check if current user can approve
const canApprove = computed(() => {
  if (!user.value) return false;
  if (props.approval.status !== "PENDING") return false;

  // Period close requires Admin
  if (props.approval.entity_type === "PERIOD_CLOSE") {
    return user.value.role === "ADMIN";
  }

  // Other approvals: Supervisor or Admin
  return user.value.role === "SUPERVISOR" || user.value.role === "ADMIN";
});

// Rejection modal state
const showRejectModal = ref(false);
const rejectionReason = ref("");

const handleApprove = () => {
  emit("approve", props.approval.id);
};

const handleReject = () => {
  showRejectModal.value = true;
};

const confirmReject = () => {
  if (rejectionReason.value.trim()) {
    emit("reject", props.approval.id, rejectionReason.value);
    showRejectModal.value = false;
    rejectionReason.value = "";
  }
};
<\/script>

<template>
  <div v-if="canApprove" class="flex items-center gap-2">
    <UButton
      color="success"
      variant="soft"
      icon="i-heroicons-check"
      :loading="loading"
      class="cursor-pointer"
      @click="handleApprove"
    >
      Approve
    </UButton>

    <UButton
      color="error"
      variant="soft"
      icon="i-heroicons-x-mark"
      :disabled="loading"
      class="cursor-pointer"
      @click="handleReject"
    >
      Reject
    </UButton>

    <!-- Rejection Reason Modal -->
    <UModal v-model:open="showRejectModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)]" />
              <span class="font-semibold">Reject Request</span>
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-sm text-[var(--ui-text-muted)]">
              Please provide a reason for rejecting this request.
            </p>
            <UTextarea
              v-model="rejectionReason"
              placeholder="Enter rejection reason..."
              :rows="3"
              required
            />
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                class="cursor-pointer"
                @click="showRejectModal = false"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                :disabled="!rejectionReason.trim()"
                class="cursor-pointer"
                @click="confirmReject"
              >
                Confirm Rejection
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>

  <!-- Read-only status for non-approvers -->
  <div v-else-if="approval.status !== 'PENDING'" class="text-sm text-[var(--ui-text-muted)]">
    <span v-if="approval.status === 'APPROVED'" class="text-[var(--ui-success)]">
      Approved by {{ approval.reviewer?.name }}
    </span>
    <span v-else class="text-[var(--ui-error)]">
      Rejected by {{ approval.reviewer?.name }}
    </span>
  </div>
</template>`,

  pendingApprovalsComponent: `// Pending Approvals List Component
// File: app/components/approval/PendingApprovalsList.vue

<script setup lang="ts">
import type { Approval } from "~/shared/types";

const { user } = useAuth();

// Fetch pending approvals that user can review
const { data: pendingApprovals, refresh } = await useAsyncData(
  "pending-approvals",
  async () => {
    if (!user.value || user.value.role === "OPERATOR") {
      return [];
    }
    return await $fetch<Approval[]>("/api/approvals/pending");
  }
);

// Entity type display labels
const entityTypeLabels: Record<string, string> = {
  PRF: "Purchase Request",
  PO: "Purchase Order",
  TRANSFER: "Transfer",
  PERIOD_CLOSE: "Period Close",
};

// Entity type icons
const entityTypeIcons: Record<string, string> = {
  PRF: "i-heroicons-document-text",
  PO: "i-heroicons-shopping-cart",
  TRANSFER: "i-heroicons-arrows-right-left",
  PERIOD_CLOSE: "i-heroicons-calendar-days",
};

// Handle approval actions
const handleApprove = async (approvalId: string) => {
  await $fetch(\`/api/approvals/\${approvalId}/approve\`, {
    method: "PATCH",
  });
  await refresh();
};

const handleReject = async (approvalId: string, reason: string) => {
  await $fetch(\`/api/approvals/\${approvalId}/reject\`, {
    method: "PATCH",
    body: { comments: reason },
  });
  await refresh();
};
<\/script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-inbox" class="text-[var(--ui-primary)]" />
          <span class="font-semibold">Pending Approvals</span>
        </div>
        <UBadge v-if="pendingApprovals?.length" color="warning" variant="soft">
          {{ pendingApprovals.length }}
        </UBadge>
      </div>
    </template>

    <div v-if="pendingApprovals?.length" class="space-y-3">
      <div
        v-for="approval in pendingApprovals"
        :key="approval.id"
        class="rounded-lg border border-[var(--ui-border)] p-4"
      >
        <div class="mb-3 flex items-start justify-between">
          <div class="flex items-center gap-2">
            <UIcon
              :name="entityTypeIcons[approval.entity_type]"
              class="text-lg text-[var(--ui-primary)]"
            />
            <div>
              <p class="font-medium text-[var(--ui-text-highlighted)]">
                {{ entityTypeLabels[approval.entity_type] }}
              </p>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Requested by {{ approval.requester.name }}
                on {{ formatDate(approval.requested_at) }}
              </p>
            </div>
          </div>
          <ApprovalStatusBadge :status="approval.status" />
        </div>

        <ApprovalApprovalActions
          :approval="approval"
          @approve="handleApprove"
          @reject="handleReject"
        />
      </div>
    </div>

    <div v-else class="py-8 text-center text-[var(--ui-text-muted)]">
      <UIcon name="i-heroicons-check-circle" class="mb-2 text-3xl" />
      <p>No pending approvals</p>
    </div>
  </UCard>
</template>`,

  apiEndpoints: `// Approval API Endpoints Summary
//
// ┌─────────┬───────────────────────────────┬──────────────────────────────────┐
// │ Method  │ Endpoint                      │ Description                      │
// ├─────────┼───────────────────────────────┼──────────────────────────────────┤
// │ GET     │ /api/approvals                │ List all approvals (filtered)    │
// │ GET     │ /api/approvals/pending        │ List pending approvals for user  │
// │ GET     │ /api/approvals/:id            │ Get approval details             │
// │ PATCH   │ /api/approvals/:id/approve    │ Approve request                  │
// │ PATCH   │ /api/approvals/:id/reject     │ Reject request (requires reason) │
// └─────────┴───────────────────────────────┴──────────────────────────────────┘
//
// Entity-Specific Submit Endpoints:
// ┌─────────┬───────────────────────────────┬──────────────────────────────────┐
// │ Method  │ Endpoint                      │ Description                      │
// ├─────────┼───────────────────────────────┼──────────────────────────────────┤
// │ PATCH   │ /api/transfers/:id/submit     │ Submit transfer for approval     │
// │ PATCH   │ /api/prfs/:id/submit          │ Submit PRF for approval          │
// │ PATCH   │ /api/pos/:id/submit           │ Submit PO for approval           │
// │ PATCH   │ /api/periods/:id/request-close│ Request period close (Supervisor)│
// │ PATCH   │ /api/periods/:id/approve-close│ Approve period close (Admin)     │
// └─────────┴───────────────────────────────┴──────────────────────────────────┘
//
// Error Codes:
// ────────────
// APPROVAL_NOT_FOUND          - Approval ID doesn't exist
// APPROVAL_ALREADY_EXISTS     - Duplicate approval for entity
// APPROVAL_ALREADY_PROCESSED  - Approval already approved/rejected
// INSUFFICIENT_PERMISSIONS    - User role cannot approve this type
// ADMIN_REQUIRED              - Only Admin can approve (period close)
// INVALID_APPROVAL_STATE      - Approval not in expected status`,

  businessRulesSummary: `// Approval Workflow Business Rules
//
// 1. One Approval Per Entity
// ──────────────────────────
// • Each entity (PRF, Transfer, etc.) has exactly ONE approval record
// • Linked by entity_type + entity_id
// • Cannot create duplicate approvals for same entity
//
// 2. Status Transitions
// ─────────────────────
// • PENDING → APPROVED (approval action)
// • PENDING → REJECTED (rejection action)
// • Cannot change from APPROVED or REJECTED (final states)
//
// 3. Role Requirements
// ────────────────────
// • PRF/PO/Transfer: Supervisor or Admin can approve
// • Period Close: ADMIN ONLY can approve
// • Rejection requires comments (reason)
//
// 4. Post-Approval Actions
// ────────────────────────
// • Transfer: Execute stock movement (COMPLETED status)
// • PRF: Allow PO creation
// • PO: Mark as ready for supplier
// • Period Close: Capture snapshots, close all locations
//
// 5. Rejection Handling
// ─────────────────────
// • Entity status reverts or marks as REJECTED
// • Rejection reason stored in comments field
// • Rejection is FINAL (cannot be undone)
// • Requester must create new entity to retry
//
// 6. Audit Trail
// ──────────────
// • requested_by: User who submitted for approval
// • reviewed_by: User who approved/rejected
// • requested_at: Timestamp of submission
// • reviewed_at: Timestamp of decision
// • comments: Approval notes or rejection reason`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Approval Workflows</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Generic approval system for PRF, PO, Transfers, and Period Close with role-based
        permissions
      </p>
    </div>

    <!-- Generic Approval Model Section -->
    <section
      id="dev-section-approval-model"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('approval-model')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-shield-check" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Generic Approval Model
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('approval-model') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('approval-model')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The Approval model provides a generic approval system that can be attached to any entity
          type. Instead of each entity having its own approval fields, a single Approval table links
          to entities via
          <code class="code-inline">entity_type</code>
          and
          <code class="code-inline">entity_id</code>
          .
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Approval Model Schema</h4>
          <DeveloperCodeBlock
            :code="codeExamples.approvalModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key Fields</h4>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">entity_type</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Type of entity: PRF, PO, PERIOD_CLOSE, TRANSFER
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">entity_id</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                UUID linking to the actual entity record
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">status</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                PENDING, APPROVED, or REJECTED
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">comments</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Rejection reason or approval notes
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>One-to-One Relationship:</strong>
              Each entity has exactly one Approval record. The combination of entity_type +
              entity_id uniquely identifies which entity the approval is for.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Approval Types Section -->
    <section
      id="dev-section-approval-types"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('approval-types')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-rectangle-stack" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Approval Types & Permissions
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('approval-types') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('approval-types')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Different entity types have different approval requirements. PRF, PO, and Transfers
          require Supervisor approval, while Period Close requires Admin approval.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Approval Type Permission Matrix
          </h4>
          <DeveloperCodeBlock :code="codeExamples.approvalTypeMatrix" language="plaintext" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Entity Types</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-document-text" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">PRF</span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Purchase Request Form. Operator creates, Supervisor approves. Allows PO creation
                when approved.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-shopping-cart" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">PO</span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Purchase Order. Created from PRF. Supervisor approves before sending to supplier.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-arrows-right-left" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">TRANSFER</span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Inter-location stock movement. Operator creates, Supervisor approves. Stock moves on
                approval.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-calendar-days" class="text-[var(--ui-warning)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">PERIOD_CLOSE</span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Period close request.
                <strong class="text-[var(--ui-warning)]">Admin only</strong>
                can approve. Closes all locations and captures snapshots.
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Admin-Only Period Close:</strong>
              Period close is a critical operation that affects all locations. Only Administrators
              can approve period close requests.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Approval Request Flow Section -->
    <section
      id="dev-section-approval-request"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('approval-request')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-paper-airplane" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Approval Request Flow</span>
        </span>
        <UIcon
          :name="
            isExpanded('approval-request') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('approval-request')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          When a user submits an entity for approval, an Approval record is created with PENDING
          status. The entity remains in a waiting state until a reviewer takes action.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Workflow Diagram</h4>
          <DeveloperCodeBlock :code="codeExamples.approvalWorkflowDiagram" language="plaintext" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Create Approval Request Utility
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.createApprovalRequest"
            language="typescript"
            filename="server/utils/approval.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Example: Submit Transfer for Approval
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.submitTransferForApproval"
            language="typescript"
            filename="server/api/transfers/[id]/submit.patch.ts"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Request Flow Steps</h4>
          <ol class="list-inside list-decimal space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Validate entity status:</strong>
              Only DRAFT entities can be submitted
            </li>
            <li>
              <strong>Validate user permissions:</strong>
              Check user can request for this entity type
            </li>
            <li>
              <strong>Pre-submission validation:</strong>
              Validate data (e.g., stock availability for transfers)
            </li>
            <li>
              <strong>Create approval record:</strong>
              Insert PENDING approval with entity link
            </li>
            <li>
              <strong>Update entity status:</strong>
              Set entity to PENDING_APPROVAL status
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- Approve/Reject Actions Section -->
    <section
      id="dev-section-approve-reject"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('approve-reject')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-check-circle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Approve/Reject Actions</span>
        </span>
        <UIcon
          :name="
            isExpanded('approve-reject') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('approve-reject')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Reviewers can approve or reject pending approval requests. Approval triggers
          post-approval actions (e.g., stock movement for transfers), while rejection requires a
          reason and reverts the entity status.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Process Approval Utility
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.processApproval"
            language="typescript"
            filename="server/utils/approval.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Approve Endpoint</h4>
          <DeveloperCodeBlock
            :code="codeExamples.approveTransfer"
            language="typescript"
            filename="server/api/approvals/[id]/approve.patch.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Reject Endpoint</h4>
          <DeveloperCodeBlock
            :code="codeExamples.rejectApproval"
            language="typescript"
            filename="server/api/approvals/[id]/reject.patch.ts"
          />
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-lg border border-[var(--ui-success)]/30 bg-[var(--ui-bg)] p-3">
            <h5 class="mb-2 flex items-center gap-2 font-medium text-[var(--ui-success)]">
              <UIcon name="i-heroicons-check-circle" />
              On Approval
            </h5>
            <ul class="space-y-1 text-xs text-[var(--ui-text-muted)]">
              <li>Status changes to APPROVED</li>
              <li>Post-approval action executes</li>
              <li>Entity status updates (e.g., COMPLETED)</li>
              <li>Optional approval comments saved</li>
            </ul>
          </div>
          <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
            <h5 class="mb-2 flex items-center gap-2 font-medium text-[var(--ui-error)]">
              <UIcon name="i-heroicons-x-circle" />
              On Rejection
            </h5>
            <ul class="space-y-1 text-xs text-[var(--ui-text-muted)]">
              <li>Status changes to REJECTED</li>
              <li>Rejection reason REQUIRED</li>
              <li>Entity status reverts or marks REJECTED</li>
              <li>Rejection is FINAL (cannot undo)</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Role Requirements Section -->
    <section
      id="dev-section-role-requirements"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('role-requirements')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-user-group" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Role Requirements</span>
        </span>
        <UIcon
          :name="
            isExpanded('role-requirements') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('role-requirements')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Different approval types require different role levels. Use the permission utilities to
          check if users can request or approve specific entity types.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Role-Based Permission Code
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.roleRequirementsCode"
            language="typescript"
            filename="server/utils/approval.ts"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Role Capabilities</h4>
          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-user" class="text-[var(--ui-neutral)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">Operator</span>
              </div>
              <div class="space-y-2 text-xs">
                <div>
                  <span class="text-[var(--ui-text-muted)]">Can Request:</span>
                  <div class="mt-1 flex flex-wrap gap-1">
                    <UBadge color="success" variant="soft" size="xs">PRF</UBadge>
                    <UBadge color="success" variant="soft" size="xs">PO</UBadge>
                    <UBadge color="success" variant="soft" size="xs">Transfer</UBadge>
                  </div>
                </div>
                <div>
                  <span class="text-[var(--ui-text-muted)]">Can Approve:</span>
                  <div class="mt-1">
                    <UBadge color="neutral" variant="soft" size="xs">None</UBadge>
                  </div>
                </div>
              </div>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-user-circle" class="text-[var(--ui-warning)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Supervisor
                </span>
              </div>
              <div class="space-y-2 text-xs">
                <div>
                  <span class="text-[var(--ui-text-muted)]">Can Request:</span>
                  <div class="mt-1 flex flex-wrap gap-1">
                    <UBadge color="success" variant="soft" size="xs">All + Period Close</UBadge>
                  </div>
                </div>
                <div>
                  <span class="text-[var(--ui-text-muted)]">Can Approve:</span>
                  <div class="mt-1 flex flex-wrap gap-1">
                    <UBadge color="success" variant="soft" size="xs">PRF</UBadge>
                    <UBadge color="success" variant="soft" size="xs">PO</UBadge>
                    <UBadge color="success" variant="soft" size="xs">Transfer</UBadge>
                  </div>
                </div>
              </div>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-shield-check" class="text-[var(--ui-primary)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">Admin</span>
              </div>
              <div class="space-y-2 text-xs">
                <div>
                  <span class="text-[var(--ui-text-muted)]">Can Request:</span>
                  <div class="mt-1 flex flex-wrap gap-1">
                    <UBadge color="success" variant="soft" size="xs">All</UBadge>
                  </div>
                </div>
                <div>
                  <span class="text-[var(--ui-text-muted)]">Can Approve:</span>
                  <div class="mt-1 flex flex-wrap gap-1">
                    <UBadge color="success" variant="soft" size="xs">All + Period Close</UBadge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Period Close (Admin Only)
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.periodCloseApproval"
            language="typescript"
            filename="server/api/periods/[id]/approve-close.patch.ts"
          />
        </div>
      </div>
    </section>

    <!-- UI Components Section -->
    <section
      id="dev-section-ui-components"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('ui-components')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-squares-2x2" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">UI Components</span>
        </span>
        <UIcon
          :name="
            isExpanded('ui-components') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('ui-components')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Reusable Vue components for displaying approval status, handling approval actions, and
          listing pending approvals.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            ApprovalStatusBadge Component
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.approvalStatusComponent"
            language="vue"
            filename="app/components/approval/ApprovalStatusBadge.vue"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            ApprovalActions Component
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.approvalActionsComponent"
            language="vue"
            filename="app/components/approval/ApprovalActions.vue"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            PendingApprovalsList Component
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.pendingApprovalsComponent"
            language="vue"
            filename="app/components/approval/PendingApprovalsList.vue"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Component Hierarchy</h4>
          <div class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-4">
            <pre class="text-xs text-[var(--ui-text)]">app/components/approval/
├── ApprovalStatusBadge.vue    # Status display badge
├── ApprovalActions.vue        # Approve/Reject buttons + modal
└── PendingApprovalsList.vue   # Dashboard widget for reviewers</pre>
          </div>
        </div>
      </div>
    </section>

    <!-- API & Endpoints Section -->
    <section
      id="dev-section-api-endpoints"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('api-endpoints')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-code-bracket" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">API Endpoints</span>
        </span>
        <UIcon
          :name="isExpanded('api-endpoints') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('api-endpoints')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          API endpoints for managing approvals and entity-specific submission endpoints.
        </p>

        <div>
          <DeveloperCodeBlock :code="codeExamples.apiEndpoints" language="plaintext" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Quick Reference</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-[var(--ui-border)]">
                  <th class="px-2 py-2 text-left text-[var(--ui-text-muted)]">Method</th>
                  <th class="px-2 py-2 text-left text-[var(--ui-text-muted)]">Endpoint</th>
                  <th class="px-2 py-2 text-left text-[var(--ui-text-muted)]">Description</th>
                </tr>
              </thead>
              <tbody class="text-[var(--ui-text)]">
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="info" variant="soft" size="xs">GET</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/approvals/pending</td>
                  <td class="px-2 py-2">List pending approvals for user</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="warning" variant="soft" size="xs">PATCH</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/approvals/:id/approve</td>
                  <td class="px-2 py-2">Approve request</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="warning" variant="soft" size="xs">PATCH</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/approvals/:id/reject</td>
                  <td class="px-2 py-2">Reject request (requires reason)</td>
                </tr>
                <tr>
                  <td class="px-2 py-2">
                    <UBadge color="warning" variant="soft" size="xs">PATCH</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/transfers/:id/submit</td>
                  <td class="px-2 py-2">Submit transfer for approval</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- Business Rules Section -->
    <section
      id="dev-section-business-rules"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('business-rules')"
      >
        <span class="flex items-center gap-3">
          <UIcon
            name="i-heroicons-clipboard-document-list"
            class="text-xl text-[var(--ui-primary)]"
          />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Business Rules Summary
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('business-rules') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('business-rules')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Summary of all business rules governing the approval workflow system.
        </p>

        <div>
          <DeveloperCodeBlock :code="codeExamples.businessRulesSummary" language="typescript" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Critical Rules</h4>
          <div class="space-y-2">
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>One approval per entity</strong>
                - Cannot create duplicate approvals
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Rejection requires reason</strong>
                - Comments field mandatory for rejections
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Period close is Admin-only</strong>
                - Supervisors cannot approve period close
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Approval/Rejection is final</strong>
                - Cannot change after processing
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Post-approval actions atomic</strong>
                - Approval and action execute in transaction
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Full audit trail</strong>
                - Requester, reviewer, timestamps, comments logged
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.code-inline {
  @apply rounded bg-[var(--ui-bg-muted)] px-1.5 py-0.5 font-mono text-xs;
}
</style>
