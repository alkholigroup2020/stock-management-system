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
  transferModel: `// Transfer Model - Prisma Schema
// File: prisma/schema.prisma

model Transfer {
  id               String         @id @default(uuid()) @db.Uuid
  transfer_no      String         @unique @db.VarChar(50)
  from_location_id String         @db.Uuid
  to_location_id   String         @db.Uuid
  status           TransferStatus @default(DRAFT)
  requested_by     String         @db.Uuid
  approved_by      String?        @db.Uuid
  request_date     DateTime       @db.Date
  approval_date    DateTime?      @db.Date
  transfer_date    DateTime?      @db.Date
  total_value      Decimal        @default(0) @db.Decimal(15, 2)
  notes            String?
  created_at       DateTime       @default(now()) @db.Timestamptz(6)
  updated_at       DateTime       @updatedAt @db.Timestamptz(6)
  transfer_lines   TransferLine[]
  approver         User?          @relation("TransferApprover", ...)
  from_location    Location       @relation("TransferFrom", ...)
  requester        User           @relation("TransferRequester", ...)
  to_location      Location       @relation("TransferTo", ...)

  @@index([from_location_id])
  @@index([to_location_id])
  @@index([status])
  @@index([from_location_id, status])
  @@index([to_location_id, status])
  @@map("transfers")
}

// Transfer Status Enum
enum TransferStatus {
  DRAFT             // Created but not submitted
  PENDING_APPROVAL  // Submitted, awaiting approval
  APPROVED          // Approved, ready for execution
  REJECTED          // Rejected by approver
  COMPLETED         // Stock movement executed
}`,

  transferLineModel: `// TransferLine Model - Individual Items in Transfer
// File: prisma/schema.prisma

model TransferLine {
  id              String   @id @default(uuid()) @db.Uuid
  transfer_id     String   @db.Uuid
  item_id         String   @db.Uuid
  quantity        Decimal  @db.Decimal(15, 4)
  wac_at_transfer Decimal  @db.Decimal(15, 4)  // WAC from source location
  line_value      Decimal  @db.Decimal(15, 2)  // quantity × wac_at_transfer
  item            Item     @relation(...)
  transfer        Transfer @relation(..., onDelete: Cascade)

  @@index([transfer_id])
  @@index([item_id])
  @@map("transfer_lines")
}

// Key Fields:
// - wac_at_transfer: Captures source location WAC at time of creation
// - line_value: Calculated as quantity × wac_at_transfer
// - Destination receives stock at source WAC (or recalculated if existing)`,

  statusWorkflowDiagram: `// Transfer Status Workflow
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                        TRANSFER STATUS WORKFLOW                              │
// └─────────────────────────────────────────────────────────────────────────────┘
//
//                              ┌─────────────┐
//                              │    DRAFT    │
//                              │ (optional)  │
//                              └──────┬──────┘
//                                     │ Submit
//                                     ▼
//                        ┌────────────────────────┐
//                        │   PENDING_APPROVAL     │
//                        │ (awaiting supervisor)  │
//                        └────────────┬───────────┘
//                                     │
//                    ┌────────────────┴────────────────┐
//                    │                                 │
//                    ▼                                 ▼
//            ┌───────────────┐               ┌───────────────┐
//            │   APPROVED    │               │   REJECTED    │
//            │ (ready to     │               │   (final)     │
//            │  execute)     │               │ No stock move │
//            └───────┬───────┘               └───────────────┘
//                    │
//                    │ Execute (automatic)
//                    ▼
//            ┌───────────────┐
//            │   COMPLETED   │
//            │ Stock moved   │
//            │   (final)     │
//            └───────────────┘
//
// Notes:
// - In current implementation, approval immediately executes (APPROVED → COMPLETED)
// - PENDING_APPROVAL requires Supervisor or Admin approval
// - REJECTED and COMPLETED are final states
// - Stock is only moved on COMPLETED status`,

  transferCreationFlow: `// Transfer Creation Flow
// File: server/api/transfers/index.post.ts

import { z } from "zod";

// Request validation schema
const bodySchema = z.object({
  from_location_id: z.string().uuid(),
  to_location_id: z.string().uuid(),
  request_date: z.string(), // ISO date string
  notes: z.string().optional(),
  lines: z.array(z.object({
    item_id: z.string().uuid(),
    quantity: z.number().positive(),
  })).min(1),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const body = await readBody(event);
  const data = bodySchema.parse(body);

  // Step 1: Validate locations are different
  if (data.from_location_id === data.to_location_id) {
    throw createError({
      statusCode: 400,
      data: { code: "SAME_LOCATION_TRANSFER", message: "Cannot transfer to same location" },
    });
  }

  // Step 2: Batch validate - locations, user access, items, stock levels
  const [fromLocation, toLocation, userLocation, items, stockRecords] = await Promise.all([
    prisma.location.findUnique({ where: { id: data.from_location_id } }),
    prisma.location.findUnique({ where: { id: data.to_location_id } }),
    user.role === "OPERATOR"
      ? prisma.userLocation.findUnique({ where: { user_id_location_id: { ... } } })
      : Promise.resolve({ location_id: data.from_location_id }),
    prisma.item.findMany({ where: { id: { in: itemIds }, is_active: true } }),
    prisma.locationStock.findMany({ where: { location_id: data.from_location_id, item_id: { in: itemIds } } }),
  ]);

  // Step 3: Validate sufficient stock
  const insufficientStock = [];
  for (const line of data.lines) {
    const available = stockMap.get(line.item_id) || 0;
    if (line.quantity > available) {
      insufficientStock.push({ item: item.name, requested: line.quantity, available });
    }
  }
  if (insufficientStock.length > 0) {
    throw createError({
      statusCode: 400,
      data: { code: "INSUFFICIENT_STOCK", details: insufficientStock },
    });
  }

  // Step 4: Create transfer in transaction
  const result = await prisma.$transaction(async (tx) => {
    const transferNo = await generateTransferNumber(tx);

    const transfer = await tx.transfer.create({
      data: {
        transfer_no: transferNo,
        from_location_id: data.from_location_id,
        to_location_id: data.to_location_id,
        status: "PENDING_APPROVAL",  // Requires approval
        requested_by: user.id,
        request_date: new Date(data.request_date),
        notes: data.notes,
      },
    });

    // Create lines with captured WAC
    for (const lineData of data.lines) {
      const wac = wacMap.get(lineData.item_id) || 0;
      await tx.transferLine.create({
        data: {
          transfer_id: transfer.id,
          item_id: lineData.item_id,
          quantity: lineData.quantity,
          wac_at_transfer: wac,
          line_value: lineData.quantity * wac,
        },
      });
    }

    return transfer;
  });

  return { message: "Transfer created and pending approval", transfer: result };
});`,

  transferApprovalFlow: `// Transfer Approval Flow - Atomic Stock Movement
// File: server/api/transfers/[id]/approve.patch.ts

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const transferId = getRouterParam(event, "id");

  // Step 1: Check permissions - Only Supervisor or Admin
  if (user.role !== "SUPERVISOR" && user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      data: { code: "INSUFFICIENT_PERMISSIONS", message: "Only Supervisors and Admins can approve" },
    });
  }

  // Step 2: Fetch transfer with lines
  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    include: { transfer_lines: { include: { item: true } } },
  });

  // Step 3: Validate status is PENDING_APPROVAL
  if (transfer.status !== "PENDING_APPROVAL") {
    throw createError({
      statusCode: 400,
      data: { code: "INVALID_STATUS", message: "Only PENDING_APPROVAL transfers can be approved" },
    });
  }

  // Step 4: Re-validate stock availability (might have changed)
  await validateAndThrowIfInsufficientStock(
    transfer.from_location_id,
    transfer.transfer_lines.map((line) => ({
      itemId: line.item_id,
      quantity: parseFloat(line.quantity.toString()),
    }))
  );

  // Step 5: Execute atomic stock movement
  const result = await prisma.$transaction(async (tx) => {
    for (const line of transfer.transfer_lines) {
      const quantity = parseFloat(line.quantity.toString());
      const wacAtTransfer = parseFloat(line.wac_at_transfer.toString());

      // 1. Deduct from source location
      await tx.locationStock.update({
        where: { location_id_item_id: { location_id: transfer.from_location_id, item_id: line.item_id } },
        data: { on_hand: { decrement: quantity } },
      });

      // 2. Add to destination (with WAC recalculation)
      const destStock = await tx.locationStock.findUnique({
        where: { location_id_item_id: { location_id: transfer.to_location_id, item_id: line.item_id } },
      });

      if (destStock) {
        // Recalculate WAC at destination
        const wacResult = calculateWAC(
          parseFloat(destStock.on_hand.toString()),
          parseFloat(destStock.wac.toString()),
          quantity,
          wacAtTransfer  // Use source WAC as "receipt price"
        );

        await tx.locationStock.update({
          where: { location_id_item_id: { location_id: transfer.to_location_id, item_id: line.item_id } },
          data: { on_hand: wacResult.newQuantity, wac: wacResult.newWAC },
        });
      } else {
        // Create new stock record at destination with source WAC
        await tx.locationStock.create({
          data: {
            location_id: transfer.to_location_id,
            item_id: line.item_id,
            on_hand: quantity,
            wac: wacAtTransfer,
          },
        });
      }
    }

    // 3. Update transfer status to COMPLETED
    return await tx.transfer.update({
      where: { id: transferId },
      data: {
        status: "COMPLETED",
        approved_by: user.id,
        approval_date: new Date(),
        transfer_date: new Date(),
      },
    });
  }, { timeout: 30000 });

  return { message: "Transfer approved and completed", transfer: result };
});`,

  transferRejectionFlow: `// Transfer Rejection Flow
// File: server/api/transfers/[id]/reject.patch.ts

const bodySchema = z.object({
  comment: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const transferId = getRouterParam(event, "id");
  const data = bodySchema.parse(await readBody(event));

  // Step 1: Check permissions - Only Supervisor or Admin
  if (user.role !== "SUPERVISOR" && user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      data: { code: "INSUFFICIENT_PERMISSIONS" },
    });
  }

  // Step 2: Validate status is PENDING_APPROVAL
  const transfer = await prisma.transfer.findUnique({ where: { id: transferId } });

  if (transfer.status !== "PENDING_APPROVAL") {
    throw createError({
      statusCode: 400,
      data: { code: "INVALID_STATUS" },
    });
  }

  // Step 3: Update status to REJECTED (no stock movement)
  const updatedTransfer = await prisma.transfer.update({
    where: { id: transferId },
    data: {
      status: "REJECTED",
      approved_by: user.id,
      approval_date: new Date(),
      notes: data.comment
        ? \`\${transfer.notes ? transfer.notes + "\\n\\n" : ""}REJECTED: \${data.comment}\`
        : transfer.notes,
    },
  });

  return { message: "Transfer rejected", transfer: updatedTransfer };
});

// Key Points:
// - No stock movement on rejection
// - Rejection comment appended to notes
// - Rejection is final (cannot be undone)`,

  stockUpdatePattern: `// Stock Update Pattern for Transfers
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                       TRANSFER STOCK MOVEMENT                                │
// └─────────────────────────────────────────────────────────────────────────────┘
//
//   SOURCE LOCATION                          DESTINATION LOCATION
//   ───────────────                          ────────────────────
//
//   BEFORE TRANSFER                          BEFORE TRANSFER
//   ┌─────────────────────┐                  ┌─────────────────────┐
//   │  Item: Rice 5kg     │                  │  Item: Rice 5kg     │
//   │  on_hand: 100 KG    │                  │  on_hand: 50 KG     │
//   │  wac: SAR 10.00     │                  │  wac: SAR 9.00      │
//   └─────────────────────┘                  └─────────────────────┘
//            │                                        │
//            │                                        │
//            │  Transfer: 20 KG @ SAR 10.00           │
//            │  ─────────────────────────────────────►│
//            │                                        │
//            ▼                                        ▼
//   AFTER TRANSFER                           AFTER TRANSFER
//   ┌─────────────────────┐                  ┌─────────────────────┐
//   │  Item: Rice 5kg     │                  │  Item: Rice 5kg     │
//   │  on_hand: 80 KG     │                  │  on_hand: 70 KG     │
//   │  wac: SAR 10.00     │ ◄─ UNCHANGED!    │  wac: SAR 9.29      │ ◄─ RECALCULATED!
//   └─────────────────────┘                  └─────────────────────┘
//
//   Destination WAC Calculation:
//   newWAC = (50 × 9.00 + 20 × 10.00) / (50 + 20)
//          = (450 + 200) / 70
//          = 650 / 70
//          = SAR 9.29
//
// Key Rules:
// ───────────
// 1. Source location: WAC UNCHANGED (just decrement quantity)
// 2. Destination location: WAC RECALCULATED using standard WAC formula
// 3. Source WAC captured at transfer creation time (wac_at_transfer)
// 4. If destination has no existing stock, WAC = source WAC`,

  wacHandling: `// WAC Handling in Transfers
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                       WAC AT TRANSFER EXPLAINED                              │
// └─────────────────────────────────────────────────────────────────────────────┘
//
//  1. AT TRANSFER CREATION
//  ───────────────────────
//  • Source location WAC is captured in wac_at_transfer field
//  • This captures the cost at the time of request
//  • Even if source WAC changes before approval, transfer uses original WAC
//
//  2. AT TRANSFER APPROVAL/COMPLETION
//  ──────────────────────────────────
//  • Source: Quantity decremented, WAC unchanged
//  • Destination (existing stock): WAC recalculated using formula:
//      newWAC = (currentQty × currentWAC + transferQty × wac_at_transfer)
//               / (currentQty + transferQty)
//  • Destination (no existing stock): WAC = wac_at_transfer
//
//  3. LINE VALUE CALCULATION
//  ─────────────────────────
//  line_value = quantity × wac_at_transfer
//  total_value = SUM(all line_values)
//
//  Comparison with Other Operations:
//  ┌──────────────┬─────────────────────┬────────────────────────────────┐
//  │   OPERATION  │    SOURCE WAC       │       DESTINATION WAC          │
//  ├──────────────┼─────────────────────┼────────────────────────────────┤
//  │   Delivery   │        N/A          │   RECALCULATE (receipt price)  │
//  │   Issue      │  UNCHANGED (capture)│          N/A                   │
//  │   Transfer   │     UNCHANGED       │   RECALCULATE (source WAC)     │
//  └──────────────┴─────────────────────┴────────────────────────────────┘`,

  generateTransferNumber: `// Transfer Number Generation
// File: server/api/transfers/index.post.ts

/**
 * Generate unique transfer number: TRF-YYYY-NNN
 *
 * Format:
 * - TRF: Transfer prefix
 * - YYYY: Current year
 * - NNN: Sequential number (padded to 3 digits)
 *
 * Examples:
 * - TRF-2025-001
 * - TRF-2025-042
 * - TRF-2025-999
 */
async function generateTransferNumber(year?: number): Promise<string> {
  const currentYear = year || new Date().getFullYear();
  const prefix = \`TRF-\${currentYear}-\`;

  // Find the highest transfer number for this year
  const lastTransfer = await prisma.transfer.findFirst({
    where: {
      transfer_no: { startsWith: prefix },
    },
    orderBy: { transfer_no: "desc" },
    select: { transfer_no: true },
  });

  let nextNumber = 1;
  if (lastTransfer) {
    const parts = lastTransfer.transfer_no.split("-");
    const lastNumber = parseInt(parts[2] || "0", 10);
    nextNumber = lastNumber + 1;
  }

  return \`\${prefix}\${String(nextNumber).padStart(3, "0")}\`;
}`,

  cacheInvalidation: `// Cache Invalidation for Transfers
// File: app/composables/useCache.ts

/**
 * useSmartCacheInvalidation - afterTransfer
 *
 * Invalidates relevant caches after transfer creation/approval
 */
export function useSmartCacheInvalidation() {
  const cache = useCache();

  /**
   * Call after creating, approving, or completing a transfer
   *
   * @param fromLocationId - Source location ID
   * @param toLocationId - Destination location ID (optional for creation, required for approval)
   */
  const afterTransfer = (fromLocationId: string, toLocationId?: string) => {
    // Invalidate stock at source location
    cache.invalidateStock(fromLocationId);

    // Invalidate stock at destination location (if approved/completed)
    if (toLocationId) {
      cache.invalidateStock(toLocationId);
    }

    // Invalidate transfers list cache
    cache.invalidateTransactions("transfers");

    // Invalidate dashboard for affected locations
    cache.invalidateDashboard(fromLocationId);
    if (toLocationId) {
      cache.invalidateDashboard(toLocationId);
    }
  };

  return { afterTransfer, ... };
}

// Usage Example:
async function handleApproveTransfer(transfer: Transfer) {
  const { afterTransfer } = useSmartCacheInvalidation();

  await $fetch(\`/api/transfers/\${transfer.id}/approve\`, { method: "PATCH" });

  // Invalidate both locations' caches
  afterTransfer(transfer.from_location_id, transfer.to_location_id);

  // Refresh data
  await refresh();
}`,

  transferFormComponent: `// Transfer Form Component Pattern
// File: app/components/transfer/TransferForm.vue

<script setup lang="ts">
interface TransferFormData {
  from_location_id: string;
  to_location_id: string;
  transfer_date: string;
  notes: string;
  lines: Array<{ item_id: string; quantity: number }>;
}

const props = defineProps<{
  locations: Array<{ id: string; code: string; name: string; type: string }>;
  items: Array<{ id: string; code: string; name: string; unit: string }>;
  stockLevels: Record<string, { on_hand: number; wac: number }>;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [data: TransferFormData];
  cancel: [];
}>();

// Form validation
const isFormValid = computed(() => {
  return (
    formData.value.from_location_id &&
    formData.value.to_location_id &&
    formData.value.from_location_id !== formData.value.to_location_id &&
    lines.value.length > 0 &&
    !hasInsufficientStock.value
  );
});

// Stock validation per line
const hasInsufficientStock = computed(() => {
  return lines.value.some((line) => line.has_insufficient_stock);
});

// Update line with stock info from source location
const updateLineCalculations = (line: TransferLine) => {
  const stockInfo = props.stockLevels[line.item_id];
  if (stockInfo) {
    line.wac = stockInfo.wac;
    line.on_hand = stockInfo.on_hand;
    line.line_value = parseFloat(line.quantity) * stockInfo.wac;
    line.has_insufficient_stock = parseFloat(line.quantity) > stockInfo.on_hand;
  }
};
\x3C/script>

\x3Ctemplate>
  \x3Cdiv class="space-y-6">
    \x3C!-- Location Selection -->
    \x3CUCard>
      \x3Cdiv class="grid grid-cols-2 gap-6">
        \x3CUSelectMenu
          v-model="formData.from_location_id"
          :items="locations"
          label-key="name"
          value-key="id"
          placeholder="Select source location"
        />
        \x3CUSelectMenu
          v-model="formData.to_location_id"
          :items="availableToLocations"
          label-key="name"
          value-key="id"
          placeholder="Select destination"
          :disabled="!formData.from_location_id"
        />
      \x3C/div>
    \x3C/UCard>

    \x3C!-- Insufficient Stock Warning -->
    \x3CUAlert
      v-if="hasInsufficientStock"
      color="error"
      icon="i-lucide-alert-triangle"
      title="Insufficient Stock"
    />

    \x3C!-- Transfer Lines Table -->
    \x3Ctable>
      \x3C!-- Item selection, quantity, WAC, line value columns -->
    \x3C/table>

    \x3C!-- Submit Button -->
    \x3CUButton
      :disabled="!isFormValid || loading"
      :loading="loading"
      @click="handleSubmit"
    >
      Create Transfer
    \x3C/UButton>
  \x3C/div>
\x3C/template>`,

  errorCodes: `// Transfer-Related Error Codes
// Used in API responses for specific error handling

// Validation Errors (400)
VALIDATION_ERROR        // Invalid request data (Zod validation failed)
SAME_LOCATION_TRANSFER  // Cannot transfer from location to itself
INSUFFICIENT_STOCK      // Source location has insufficient stock
INVALID_ITEMS           // One or more items not found or inactive
INVALID_STATUS          // Transfer not in expected status for operation

// Authorization Errors (401, 403)
NOT_AUTHENTICATED       // User not logged in
LOCATION_ACCESS_DENIED  // User cannot access source location
INSUFFICIENT_PERMISSIONS // Only Supervisor/Admin can approve/reject

// Not Found Errors (404)
TRANSFER_NOT_FOUND      // Transfer ID doesn't exist
FROM_LOCATION_NOT_FOUND // Source location doesn't exist
TO_LOCATION_NOT_FOUND   // Destination location doesn't exist

// Internal Errors (500)
INTERNAL_ERROR          // Unexpected server error
STOCK_RECORD_NOT_FOUND  // Stock record missing during execution

// Example error response:
{
  "statusCode": 400,
  "statusMessage": "Bad Request",
  "data": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock for one or more items",
    "details": [
      { "item": "Rice 5kg", "requested": 100, "available": 50 }
    ]
  }
}`,

  businessRules: `// Transfer Business Rules Summary
//
// 1. Location Validation
// ──────────────────────
// • Source and destination must be different locations
// • Source location must exist and be active
// • Destination location must exist and be active
// • User must have access to source location (Operators need explicit assignment)
//
// 2. Stock Validation (at Creation AND Approval)
// ──────────────────────────────────────────────
// • Source must have sufficient stock for ALL items
// • Validate ALL items before processing ANY (atomic)
// • Stock is re-validated at approval time (may have changed)
// • INSUFFICIENT_STOCK error returns specific item details
//
// 3. Approval Requirements
// ────────────────────────
// • Only Supervisor or Admin can approve/reject
// • Transfer must be in PENDING_APPROVAL status
// • Approval immediately executes stock movement (APPROVED → COMPLETED)
// • Rejection is final and cannot be undone
//
// 4. WAC Handling
// ───────────────
// • Source WAC captured at transfer creation (wac_at_transfer)
// • Source location WAC: UNCHANGED after transfer
// • Destination WAC: RECALCULATED using standard WAC formula
// • If no existing stock at destination: WAC = source WAC
//
// 5. Stock Movement (Atomic)
// ──────────────────────────
// • All line items processed in single database transaction
// • Transaction timeout: 30 seconds
// • All-or-nothing: Either all items transfer or none do
// • Stock deducted from source, added to destination
//
// 6. Audit Trail
// ──────────────
// • requested_by: User who created the transfer
// • approved_by: User who approved/rejected
// • request_date: When transfer was created
// • approval_date: When approved/rejected
// • transfer_date: When stock movement executed
// • transfer_no: Auto-generated unique number (TRF-YYYY-NNN)
//
// 7. Reconciliation Impact
// ────────────────────────
// • Transfers In: Added to destination's reconciliation
// • Transfers Out: Deducted from source's reconciliation
// • Formula: Opening + Receipts + TransfersIn - TransfersOut - Issues - Adjustments = Closing`,

  reconciliationImpact: `// Transfer Impact on Reconciliation
//
// Reconciliation Formula:
// ───────────────────────
// Opening + Receipts + TransfersIn - TransfersOut - Issues - Adjustments = Closing
//
// Transfer Contribution:
// ──────────────────────
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                                                                               │
// │   SOURCE LOCATION (TransfersOut):                                            │
// │   ─────────────────────────────────                                          │
// │   SELECT SUM(total_value)                                                    │
// │   FROM transfers                                                              │
// │   WHERE from_location_id = :locationId                                       │
// │   AND status = 'COMPLETED'                                                    │
// │   AND transfer_date BETWEEN :startDate AND :endDate                          │
// │                                                                               │
// │   DESTINATION LOCATION (TransfersIn):                                        │
// │   ────────────────────────────────────                                       │
// │   SELECT SUM(total_value)                                                    │
// │   FROM transfers                                                              │
// │   WHERE to_location_id = :locationId                                         │
// │   AND status = 'COMPLETED'                                                    │
// │   AND transfer_date BETWEEN :startDate AND :endDate                          │
// │                                                                               │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// Example Reconciliation:
// ───────────────────────
// Kitchen Location (Period: January 2025)
// ┌────────────────────────┬──────────────┐
// │      Component         │    Value     │
// ├────────────────────────┼──────────────┤
// │ Opening Balance        │ SAR 10,000   │
// │ + Receipts (Deliveries)│ SAR 5,000    │
// │ + Transfers In         │ SAR 2,000    │ ◄─ From Central
// │ - Transfers Out        │ SAR 500      │ ◄─ To Store
// │ - Issues               │ SAR 8,000    │
// │ - Adjustments          │ SAR 200      │
// │ = Closing Balance      │ SAR 8,300    │
// └────────────────────────┴──────────────┘`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
        Transfers (Inter-Location Stock Movement)
      </h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Inter-location transfers, approval workflows, WAC handling, and atomic stock movement
      </p>
    </div>

    <!-- Transfer Model Section -->
    <section
      id="dev-section-transfer-model"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('transfer-model')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrows-right-left" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Transfer Model</span>
        </span>
        <UIcon
          :name="
            isExpanded('transfer-model') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('transfer-model')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The Transfer model represents inter-location stock movements. Each transfer tracks source
          and destination locations, approval workflow, and contains multiple line items with
          captured WAC values.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Transfer Model</h4>
          <DeveloperCodeBlock
            :code="codeExamples.transferModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">TransferLine Model</h4>
          <DeveloperCodeBlock
            :code="codeExamples.transferLineModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key Fields</h4>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">transfer_no</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Auto-generated: TRF-YYYY-NNN (e.g., TRF-2025-001)
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">status</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, COMPLETED
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">wac_at_transfer</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Source WAC captured at creation time
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">line_value</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Calculated: quantity x wac_at_transfer
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Status Workflow Section -->
    <section
      id="dev-section-status-workflow"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('status-workflow')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrows-pointing-out" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Status Workflow</span>
        </span>
        <UIcon
          :name="
            isExpanded('status-workflow') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('status-workflow')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Transfers follow an approval workflow before stock movement is executed. The status
          determines what operations are allowed and who can perform them.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Status Workflow Diagram
          </h4>
          <DeveloperCodeBlock :code="codeExamples.statusWorkflowDiagram" language="plaintext" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Status Descriptions</h4>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="neutral" variant="soft">DRAFT</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Created but not submitted. Can be edited or deleted.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="warning" variant="soft">PENDING_APPROVAL</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Submitted and waiting for Supervisor/Admin approval.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="info" variant="soft">APPROVED</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Approved by supervisor. Execution follows immediately.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="error" variant="soft">REJECTED</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Rejected by supervisor. Final state, no stock movement.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="success" variant="soft">COMPLETED</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Stock successfully moved. Final state.
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Current Implementation:</strong>
              In the current implementation, approval immediately executes stock movement,
              transitioning directly from PENDING_APPROVAL to COMPLETED.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Approval Requirements Section -->
    <section
      id="dev-section-approval-requirements"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('approval-requirements')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-shield-check" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Approval Requirements</span>
        </span>
        <UIcon
          :name="
            isExpanded('approval-requirements')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('approval-requirements')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Transfers require supervisor or admin approval before stock is moved. This ensures proper
          oversight of inter-location inventory movements.
        </p>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Who Can Do What?</h4>
          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-user" class="text-[var(--ui-neutral)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">Operator</span>
              </div>
              <ul class="space-y-1 text-xs text-[var(--ui-text-muted)]">
                <li class="flex items-center gap-1">
                  <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
                  Create transfers (assigned locations)
                </li>
                <li class="flex items-center gap-1">
                  <UIcon name="i-heroicons-x-mark" class="text-[var(--ui-error)]" />
                  Cannot approve/reject
                </li>
              </ul>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-user-circle" class="text-[var(--ui-warning)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Supervisor
                </span>
              </div>
              <ul class="space-y-1 text-xs text-[var(--ui-text-muted)]">
                <li class="flex items-center gap-1">
                  <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
                  Create transfers (all locations)
                </li>
                <li class="flex items-center gap-1">
                  <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
                  Approve/Reject transfers
                </li>
              </ul>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-shield-check" class="text-[var(--ui-primary)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">Admin</span>
              </div>
              <ul class="space-y-1 text-xs text-[var(--ui-text-muted)]">
                <li class="flex items-center gap-1">
                  <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
                  Create transfers (all locations)
                </li>
                <li class="flex items-center gap-1">
                  <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
                  Approve/Reject transfers
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Approval Flow Code</h4>
          <DeveloperCodeBlock
            :code="codeExamples.transferApprovalFlow"
            language="typescript"
            filename="server/api/transfers/[id]/approve.patch.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Rejection Flow Code</h4>
          <DeveloperCodeBlock
            :code="codeExamples.transferRejectionFlow"
            language="typescript"
            filename="server/api/transfers/[id]/reject.patch.ts"
          />
        </div>
      </div>
    </section>

    <!-- Transfer Creation Section -->
    <section
      id="dev-section-transfer-creation"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('transfer-creation')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-plus" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Transfer Creation Flow
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('transfer-creation') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('transfer-creation')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Transfer creation validates locations, user access, items, and stock availability before
          creating the transfer in PENDING_APPROVAL status.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Creation Flow Code</h4>
          <DeveloperCodeBlock
            :code="codeExamples.transferCreationFlow"
            language="typescript"
            filename="server/api/transfers/index.post.ts"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Creation Steps</h4>
          <ol class="list-inside list-decimal space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Validate locations:</strong>
              Source and destination must be different
            </li>
            <li>
              <strong>Batch validation:</strong>
              Check locations, user access, items, stock in parallel
            </li>
            <li>
              <strong>Stock validation:</strong>
              Ensure source has sufficient stock for ALL items
            </li>
            <li>
              <strong>Generate number:</strong>
              Create unique TRF-YYYY-NNN
            </li>
            <li>
              <strong>Create transfer:</strong>
              Insert with PENDING_APPROVAL status
            </li>
            <li>
              <strong>Create lines:</strong>
              Capture WAC from source location
            </li>
          </ol>
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Stock Not Reserved:</strong>
              Creating a transfer does NOT reserve stock. Stock is only moved upon approval, so
              availability is re-validated at approval time.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Stock Update Section -->
    <section
      id="dev-section-stock-update"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('stock-update')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-cube" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Stock Updates</span>
        </span>
        <UIcon
          :name="isExpanded('stock-update') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('stock-update')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Upon approval, stock is atomically moved from source to destination. The source location's
          WAC remains unchanged, while the destination's WAC is recalculated.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Stock Movement Diagram</h4>
          <DeveloperCodeBlock :code="codeExamples.stockUpdatePattern" language="plaintext" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">
            Source vs Destination Updates
          </h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon
                  name="i-heroicons-arrow-right-start-on-rectangle"
                  class="text-[var(--ui-error)]"
                />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Source Location (Deduct)
                </span>
              </div>
              <ul class="space-y-1 text-xs text-[var(--ui-text-muted)]">
                <li>Stock: DECREMENT on_hand</li>
                <li>WAC: UNCHANGED</li>
                <li>Operation: UPDATE existing record</li>
              </ul>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon
                  name="i-heroicons-arrow-right-end-on-rectangle"
                  class="text-[var(--ui-success)]"
                />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Destination Location (Add)
                </span>
              </div>
              <ul class="space-y-1 text-xs text-[var(--ui-text-muted)]">
                <li>Stock: INCREMENT on_hand</li>
                <li>WAC: RECALCULATE (if existing) or = source WAC</li>
                <li>Operation: UPDATE or CREATE record</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-error)]">
            <UIcon name="i-heroicons-exclamation-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Atomic Execution:</strong>
              All line items are processed in a single database transaction with a 30-second
              timeout. Either all items transfer or none do.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- WAC Handling Section -->
    <section
      id="dev-section-wac-handling"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('wac-handling')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-calculator" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">WAC Handling</span>
        </span>
        <UIcon
          :name="isExpanded('wac-handling') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('wac-handling')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Transfers capture the source location's WAC at creation time. At approval, the
          destination's WAC is recalculated using the standard WAC formula.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            WAC at Transfer Explained
          </h4>
          <DeveloperCodeBlock :code="codeExamples.wacHandling" language="plaintext" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">WAC Calculation Example</h4>
          <div class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-4">
            <p class="mb-2 text-sm font-medium text-[var(--ui-text-highlighted)]">Scenario:</p>
            <ul class="mb-3 space-y-1 text-xs text-[var(--ui-text-muted)]">
              <li>Destination has: 50 KG @ SAR 9.00 (value: SAR 450)</li>
              <li>Transfer: 20 KG @ SAR 10.00 (wac_at_transfer from source)</li>
            </ul>
            <p class="text-sm font-medium text-[var(--ui-text-highlighted)]">Calculation:</p>
            <code class="mt-1 block text-xs text-[var(--ui-primary)]">
              newWAC = (50 × 9.00 + 20 × 10.00) / (50 + 20) = 650 / 70 = SAR 9.29
            </code>
          </div>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Key Rule:</strong>
              Source WAC is captured at transfer creation and used as the "receipt price" for the
              destination's WAC calculation, even if source WAC changes before approval.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- API & Frontend Section -->
    <section
      id="dev-section-api-frontend"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('api-frontend')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-code-bracket" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">API & Frontend</span>
        </span>
        <UIcon
          :name="isExpanded('api-frontend') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('api-frontend')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          API endpoints for transfer operations and frontend patterns including form components and
          cache invalidation.
        </p>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">API Endpoints</h4>
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
                    <UBadge color="success" variant="soft" size="xs">POST</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/transfers</td>
                  <td class="px-2 py-2">Create new transfer</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="info" variant="soft" size="xs">GET</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/transfers/:id</td>
                  <td class="px-2 py-2">Get transfer details</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="warning" variant="soft" size="xs">PATCH</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/transfers/:id/approve</td>
                  <td class="px-2 py-2">Approve and execute transfer</td>
                </tr>
                <tr>
                  <td class="px-2 py-2">
                    <UBadge color="warning" variant="soft" size="xs">PATCH</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/transfers/:id/reject</td>
                  <td class="px-2 py-2">Reject transfer</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Transfer Number Generation
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.generateTransferNumber"
            language="typescript"
            filename="server/api/transfers/index.post.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Cache Invalidation</h4>
          <DeveloperCodeBlock
            :code="codeExamples.cacheInvalidation"
            language="typescript"
            filename="app/composables/useCache.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Form Component Pattern</h4>
          <DeveloperCodeBlock
            :code="codeExamples.transferFormComponent"
            language="vue"
            filename="app/components/transfer/TransferForm.vue"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Error Codes</h4>
          <DeveloperCodeBlock :code="codeExamples.errorCodes" language="typescript" />
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Cache Invalidation:</strong>
              Always call
              <code class="code-inline">afterTransfer(fromLocationId, toLocationId)</code>
              from
              <code class="code-inline">useSmartCacheInvalidation()</code>
              after creating, approving, or rejecting a transfer.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Reconciliation Impact Section -->
    <section
      id="dev-section-reconciliation"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('reconciliation')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-chart-bar" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Reconciliation Impact</span>
        </span>
        <UIcon
          :name="
            isExpanded('reconciliation') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('reconciliation')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Transfers affect reconciliation for both source (Transfers Out) and destination (Transfers
          In) locations.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Reconciliation Impact</h4>
          <DeveloperCodeBlock :code="codeExamples.reconciliationImpact" language="plaintext" />
        </div>

        <div class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 text-sm font-medium text-[var(--ui-text-highlighted)]">
            Reconciliation Formula
          </h5>
          <code class="text-sm text-[var(--ui-text-highlighted)]">
            Opening + Receipts +
            <strong>TransfersIn</strong>
            -
            <strong>TransfersOut</strong>
            - Issues - Adjustments = Closing
          </code>
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
          Summary of all business rules governing transfers, approvals, and stock movement.
        </p>

        <div>
          <DeveloperCodeBlock :code="codeExamples.businessRules" language="typescript" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Critical Rules</h4>
          <div class="space-y-2">
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Cannot transfer to same location</strong>
                - Source and destination must differ
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Stock validated at creation AND approval</strong>
                - May change between steps
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Only Supervisor/Admin can approve</strong>
                - INSUFFICIENT_PERMISSIONS for others
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Source WAC unchanged</strong>
                - Only destination WAC recalculated
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Atomic stock movement</strong>
                - All items transfer or none do
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Rejection is final</strong>
                - Cannot undo or resubmit rejected transfers
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
