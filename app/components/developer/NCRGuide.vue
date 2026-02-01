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
  ncrModel: `// NCR Model - Prisma Schema
// File: prisma/schema.prisma

model NCR {
  id               String              @id @default(uuid()) @db.Uuid
  ncr_no           String              @unique @db.VarChar(50)
  location_id      String              @db.Uuid
  type             NCRType             @default(MANUAL)
  auto_generated   Boolean             @default(false)
  delivery_id      String?             @db.Uuid
  delivery_line_id String?             @db.Uuid
  reason           String
  quantity         Decimal?            @db.Decimal(15, 4)
  value            Decimal             @db.Decimal(15, 2)
  status           NCRStatus           @default(OPEN)
  created_by       String              @db.Uuid
  created_at       DateTime            @default(now()) @db.Timestamptz(6)
  resolved_at      DateTime?           @db.Timestamptz(6)
  resolution_notes String?
  resolution_type  String?             @db.VarChar(200)  // How NCR was resolved
  financial_impact NCRFinancialImpact? // Reconciliation treatment
  creator          User                @relation("NCRCreator", ...)
  delivery         Delivery?           @relation(...)
  delivery_line    DeliveryLine?       @relation(...)
  location         Location            @relation(...)

  @@index([location_id])
  @@index([type])
  @@index([status])
  @@index([delivery_id])
  @@index([delivery_line_id])
  @@index([auto_generated])
  @@index([location_id, status])
  @@index([location_id, type])
  @@map("ncrs")
}

// NCR Type Enum
enum NCRType {
  MANUAL          // User-created NCR for any issue
  PRICE_VARIANCE  // Auto-generated from delivery price mismatch
}

// NCR Status Enum
enum NCRStatus {
  OPEN      // Newly created, awaiting action
  CREDITED  // Supplier issued credit note (final state)
  REJECTED  // Supplier rejected the claim (final state)
  RESOLVED  // Internally resolved (uses financial_impact) (final state)
}

// NCR Financial Impact Enum (for reconciliation)
enum NCRFinancialImpact {
  NONE    // No financial adjustment (e.g., replacement received)
  CREDIT  // Value recovered as credit (reduces consumption)
  LOSS    // Value lost (increases consumption)
}`,

  statusWorkflowDiagram: `// NCR Status Workflow
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                          NCR STATUS WORKFLOW                                 │
// └─────────────────────────────────────────────────────────────────────────────┘
//
//                              ┌─────────────┐
//                              │    OPEN     │
//                              │  (initial)  │
//                              └──────┬──────┘
//                                     │
//       ┌─────────────────────────────┼─────────────────────────────┐
//       │                             │                             │
//       ▼                             ▼                             ▼
// ┌──────────┐                 ┌──────────┐                 ┌──────────┐
// │ CREDITED │                 │ REJECTED │                 │ RESOLVED │
// │  (final) │                 │  (final) │                 │  (final) │
// │  Credit  │                 │  No      │                 │ Internal │
// │  issued  │                 │  credit  │                 │ resolve  │
// └──────────┘                 └──────────┘                 └──────────┘
//
// Status Transitions:
// - OPEN → CREDITED: Supplier issued credit note
// - OPEN → REJECTED: Supplier rejected the claim
// - OPEN → RESOLVED: Resolved internally
// - CREDITED, REJECTED, RESOLVED are final states`,

  ncrTypes: `// NCR Types Explained
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                           NCR TYPES                                          │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// 1. MANUAL NCR
// ─────────────
// • Created by users for any non-conformance issue
// • Examples: damaged goods, wrong items, quality issues
// • auto_generated = false
// • Can optionally link to a delivery
// • User provides reason and value
//
// 2. PRICE_VARIANCE NCR
// ─────────────────────
// • Auto-generated when delivery price differs from period price
// • Created during delivery posting (see Deliveries & WAC guide)
// • auto_generated = true
// • Always linked to specific delivery and delivery_line
// • System calculates and captures variance details in reason
// • Value = absolute variance amount (|unit_price - period_price| × quantity)
//
// Key Differences:
// ┌──────────────────┬───────────────────┬─────────────────────┐
// │     Aspect       │      MANUAL       │   PRICE_VARIANCE    │
// ├──────────────────┼───────────────────┼─────────────────────┤
// │   Created by     │       User        │       System        │
// │  auto_generated  │      false        │        true         │
// │  delivery link   │     Optional      │      Required       │
// │  delivery_line   │     Optional      │      Required       │
// │    reason        │   User-provided   │  System-generated   │
// │     value        │   User-provided   │  Auto-calculated    │
// └──────────────────┴───────────────────┴─────────────────────┘`,

  priceVarianceDetection: `// Price Variance Detection
// File: server/utils/priceVariance.ts

/**
 * Check if a delivery line has a price variance
 *
 * Compares actual delivery unit price with expected period price.
 * ANY variance (positive or negative) triggers NCR creation.
 */
export function checkPriceVariance(
  unitPrice: number | Prisma.Decimal,
  periodPrice: number | Prisma.Decimal,
  quantity: number | Prisma.Decimal,
  config: PriceVarianceConfig = {}
): PriceVarianceResult {
  const actualPrice = typeof unitPrice === "number" ? unitPrice : unitPrice.toNumber();
  const expectedPrice = typeof periodPrice === "number" ? periodPrice : periodPrice.toNumber();
  const qty = typeof quantity === "number" ? quantity : quantity.toNumber();

  // Calculate variance (positive = price increase, negative = price decrease)
  const variance = actualPrice - expectedPrice;

  // Calculate percentage variance relative to expected price
  const variancePercent = expectedPrice > 0
    ? (variance / expectedPrice) * 100
    : actualPrice > 0 ? 100 : 0;

  // Calculate total variance amount (variance × quantity)
  const varianceAmount = variance * qty;

  return {
    hasVariance: variance !== 0,
    variance: Number(variance.toFixed(4)),
    variancePercent: Number(variancePercent.toFixed(2)),
    varianceAmount: Number(varianceAmount.toFixed(2)),
    actualPrice: Number(actualPrice.toFixed(4)),
    expectedPrice: Number(expectedPrice.toFixed(4)),
    exceedsThreshold: variance !== 0, // Default: ANY variance triggers NCR
  };
}

// Example:
const result = checkPriceVariance(26.00, 25.50, 100);
// Returns:
// {
//   hasVariance: true,
//   variance: 0.50,              // Unit price difference
//   variancePercent: 1.96,       // 1.96% increase
//   varianceAmount: 50.00,       // Total value impact
//   actualPrice: 26.00,
//   expectedPrice: 25.50,
//   exceedsThreshold: true
// }`,

  autoNCRCreation: `// Auto-NCR Creation from Price Variance
// File: server/utils/priceVariance.ts

/**
 * Create an automatic NCR for price variance
 *
 * Called during delivery posting when price variance is detected.
 */
export async function createPriceVarianceNCR(
  prisma: any,
  data: PriceVarianceNCRData
) {
  // Generate NCR number
  const ncrNo = await generateNCRNumber(prisma);

  // Format reason message with variance details
  const varianceType = data.variance > 0 ? "increase" : "decrease";
  const variancePercent = data.expectedPrice > 0
    ? ((data.variance / data.expectedPrice) * 100).toFixed(2)
    : "100.00";

  const reason =
    \`Automatic NCR for price variance detected on delivery.\\n\\n\` +
    \`Item: \${data.itemName} (\${data.itemCode})\\n\` +
    \`Quantity: \${data.quantity}\\n\` +
    \`Expected Price (Period): SAR \${data.expectedPrice.toFixed(4)}\\n\` +
    \`Actual Price (Delivery): SAR \${data.actualPrice.toFixed(4)}\\n\` +
    \`Variance: SAR \${data.variance.toFixed(4)} (\${variancePercent}% \${varianceType})\\n\` +
    \`Total Variance Amount: SAR \${data.varianceAmount.toFixed(2)}\\n\\n\` +
    \`This NCR was automatically generated due to price difference from period-locked price.\`;

  // Create NCR record
  const ncr = await prisma.nCR.create({
    data: {
      ncr_no: ncrNo,
      location_id: data.locationId,
      type: "PRICE_VARIANCE",
      auto_generated: true,
      delivery_id: data.deliveryId,
      delivery_line_id: data.deliveryLineId,
      reason,
      quantity: data.quantity,
      value: Math.abs(data.varianceAmount), // Store absolute value
      status: "OPEN",
      created_by: data.createdBy,
    },
  });

  return ncr;
}`,

  deliveryIntegration: `// NCR Integration in Delivery Posting
// File: server/api/locations/[id]/deliveries/index.post.ts

// During delivery posting, for each line:
for (const lineData of data.lines) {
  // ... create delivery line ...

  // Check for price variance and create NCR if detected
  if (varianceResult.hasVariance) {
    // Update delivery line with variance flag
    await tx.deliveryLine.update({
      where: { id: deliveryLine.id },
      data: { has_variance: true },
    });

    // Create automatic NCR
    const ncr = await createPriceVarianceNCR(tx, {
      locationId: data.location_id,
      deliveryId: delivery.id,
      deliveryLineId: deliveryLine.id,
      itemId: lineData.item_id,
      itemName: item.name,
      itemCode: item.code,
      quantity: lineData.quantity,
      actualPrice: varianceResult.actualPrice,
      expectedPrice: varianceResult.expectedPrice,
      variance: varianceResult.variance,
      varianceAmount: varianceResult.varianceAmount,
      createdBy: user.id,
    });

    createdNCRs.push(ncr);
  }
}

// Response includes created NCRs
return {
  message: "Delivery posted successfully",
  delivery: result,
  ncrs: createdNCRs, // Auto-generated NCRs
};`,

  manualNCRCreation: `// Manual NCR Creation
// File: server/api/ncrs/index.post.ts

import { z } from "zod";

// Request body schema
const bodySchema = z.object({
  location_id: z.string().uuid(),
  delivery_id: z.string().uuid().optional(),      // Optional link
  delivery_line_id: z.string().uuid().optional(), // Optional link
  reason: z.string().min(1),
  quantity: z.number().optional(),
  value: z.number().positive(),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const data = bodySchema.parse(await readBody(event));

  // Validate location access (Operators need explicit assignment)
  if (user.role === "OPERATOR") {
    const userLocation = await prisma.userLocation.findUnique({
      where: {
        user_id_location_id: {
          user_id: user.id,
          location_id: data.location_id,
        },
      },
    });

    if (!userLocation) {
      throw createError({
        statusCode: 403,
        data: { code: "LOCATION_ACCESS_DENIED" },
      });
    }
  }

  // Validate delivery/delivery_line if provided
  if (data.delivery_id) {
    const delivery = await prisma.delivery.findUnique({
      where: { id: data.delivery_id },
    });

    if (!delivery || delivery.location_id !== data.location_id) {
      throw createError({
        statusCode: 400,
        data: { code: "DELIVERY_LOCATION_MISMATCH" },
      });
    }
  }

  // Generate NCR number and create record
  const ncrNo = await generateNCRNumber();

  const ncr = await prisma.nCR.create({
    data: {
      ncr_no: ncrNo,
      location_id: data.location_id,
      type: "MANUAL",           // Manual NCR
      auto_generated: false,    // User-created
      delivery_id: data.delivery_id,
      delivery_line_id: data.delivery_line_id,
      reason: data.reason,
      quantity: data.quantity,
      value: data.value,
      status: "OPEN",
      created_by: user.id,
    },
  });

  return { message: "NCR created successfully", ncr };
});`,

  ncrResolution: `// NCR Status Update & Resolution
// File: server/api/ncrs/[id].patch.ts

const bodySchema = z.object({
  status: z.enum(["OPEN", "CREDITED", "REJECTED", "RESOLVED"]).optional(),
  resolution_notes: z.string().optional(),
  resolution_type: z.string().max(200).optional(),  // Required for RESOLVED
  financial_impact: z.enum(["NONE", "CREDIT", "LOSS"]).optional(), // Required for RESOLVED
});

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const id = getRouterParam(event, "id");
  const data = bodySchema.parse(await readBody(event));

  const ncr = await prisma.nCR.findUnique({ where: { id } });

  // Validate status transition
  const validTransitions: Record<string, string[]> = {
    OPEN: ["CREDITED", "REJECTED", "RESOLVED"],  // Direct transition to closing status
    CREDITED: [],                          // Final state
    REJECTED: [],                          // Final state
    RESOLVED: [],                          // Final state
  };

  const allowedNextStatuses = validTransitions[ncr.status] || [];

  if (data.status !== ncr.status && !allowedNextStatuses.includes(data.status)) {
    throw createError({
      statusCode: 400,
      data: {
        code: "INVALID_STATUS_TRANSITION",
        message: \`Cannot change from \${ncr.status} to \${data.status}\`,
      },
    });
  }

  // When moving to RESOLVED, require resolution_type and financial_impact
  if (data.status === "RESOLVED") {
    if (!data.resolution_type) {
      throw createError({
        statusCode: 400,
        data: { code: "RESOLUTION_TYPE_REQUIRED" },
      });
    }
    if (!data.financial_impact) {
      throw createError({
        statusCode: 400,
        data: { code: "FINANCIAL_IMPACT_REQUIRED" },
      });
    }
  }

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (data.status) {
    updateData.status = data.status;

    // Set resolved_at when moving to final state
    if (["CREDITED", "REJECTED", "RESOLVED"].includes(data.status) && !ncr.resolved_at) {
      updateData.resolved_at = new Date();
    }
  }

  if (data.resolution_notes !== undefined) {
    updateData.resolution_notes = data.resolution_notes;
  }
  if (data.resolution_type !== undefined) {
    updateData.resolution_type = data.resolution_type;
  }
  if (data.financial_impact !== undefined) {
    updateData.financial_impact = data.financial_impact;
  }

  const updatedNCR = await prisma.nCR.update({
    where: { id },
    data: updateData,
  });

  return { message: "NCR updated successfully", ncr: updatedNCR };
});`,

  generateNCRNumber: `// NCR Number Generation
// File: server/utils/priceVariance.ts

/**
 * Generate next NCR number: NCR-YYYY-NNN
 *
 * Format:
 * - NCR: Non-Conformance Report prefix
 * - YYYY: Current year
 * - NNN: Sequential number (padded to 3 digits)
 *
 * Examples:
 * - NCR-2025-001
 * - NCR-2025-042
 * - NCR-2025-999
 */
export async function generateNCRNumber(
  prisma: any,
  year?: number
): Promise<string> {
  const currentYear = year || new Date().getFullYear();
  const prefix = \`NCR-\${currentYear}-\`;

  // Find the highest NCR number for this year
  const lastNCR = await prisma.nCR.findFirst({
    where: {
      ncr_no: { startsWith: prefix },
    },
    orderBy: { ncr_no: "desc" },
    select: { ncr_no: true },
  });

  let nextNumber = 1;
  if (lastNCR) {
    const parts = lastNCR.ncr_no.split("-");
    const lastNumber = parseInt(parts[2] || "0", 10);
    nextNumber = lastNumber + 1;
  }

  return \`\${prefix}\${String(nextNumber).padStart(3, "0")}\`;
}`,

  errorCodes: `// NCR-Related Error Codes
// Used in API responses for specific error handling

// Validation Errors (400)
VALIDATION_ERROR             // Invalid request data (Zod validation failed)
INVALID_STATUS_TRANSITION    // Cannot change to requested status
DELIVERY_LOCATION_MISMATCH   // Delivery not in same location as NCR
DELIVERY_LINE_MISMATCH       // Delivery line not from specified delivery
MISSING_ID                   // NCR ID required in route params

// Authorization Errors (401, 403)
NOT_AUTHENTICATED            // User not logged in
LOCATION_ACCESS_DENIED       // User cannot access location

// Not Found Errors (404)
NCR_NOT_FOUND                // NCR ID doesn't exist
LOCATION_NOT_FOUND           // Location doesn't exist
DELIVERY_NOT_FOUND           // Referenced delivery doesn't exist
DELIVERY_LINE_NOT_FOUND      // Referenced delivery line doesn't exist

// Internal Errors (500)
INTERNAL_ERROR               // Unexpected server error

// Example error response:
{
  "statusCode": 400,
  "statusMessage": "Bad Request",
  "data": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Cannot change status from CREDITED to OPEN. Allowed transitions: none (final state)"
  }
}`,

  businessRules: `// NCR Business Rules Summary
//
// 1. NCR Types
// ────────────
// • MANUAL: User-created for any issue (damaged goods, wrong items, etc.)
// • PRICE_VARIANCE: Auto-generated when delivery price ≠ period price
// • auto_generated flag distinguishes between the two
//
// 2. Auto-Generation Rules
// ────────────────────────
// • Price variance NCRs created during delivery posting
// • ANY price difference triggers NCR (no threshold)
// • Links to delivery_id and delivery_line_id
// • System captures all variance details in reason field
// • Value = |variance| × quantity (absolute amount)
//
// 3. Status Workflow
// ──────────────────
// • OPEN: Initial state for all NCRs
// • CREDITED: Supplier issued credit note (final)
// • REJECTED: Supplier rejected the claim (final)
// • RESOLVED: Internally resolved, no credit (final)
//
// 4. Status Transitions (valid paths)
// ───────────────────────────────────
// OPEN → CREDITED, REJECTED, RESOLVED
// CREDITED → (none - final state)
// REJECTED → (none - final state)
// RESOLVED → (none - final state)
//
// 5. Resolution
// ─────────────
// • resolved_at timestamp set when moving to final state
// • resolution_notes can be added at any time
// • Final states cannot be changed
//
// 6. Location Access
// ──────────────────
// • Operators can only create/view NCRs for assigned locations
// • Supervisors and Admins have access to all locations
// • NCR inherits location from delivery (if linked) or is specified
//
// 7. Audit Trail
// ──────────────
// • created_by: User who created the NCR
// • created_at: When NCR was created
// • resolved_at: When moved to final state
// • ncr_no: Auto-generated unique number (NCR-YYYY-NNN)
//
// 8. Value Tracking
// ─────────────────
// • Manual NCR: User specifies value
// • Price Variance NCR: System calculates |variance| × quantity
// • Used for reporting and reconciliation impact
//
// 9. Reconciliation Integration
// ─────────────────────────────
// • NCRs with CREDITED status reduce consumption (credits)
// • NCRs with REJECTED status increase consumption (losses)
// • RESOLVED NCRs use financial_impact: CREDIT, LOSS, or NONE
// • When status = RESOLVED, resolution_type and financial_impact are required
// • OPEN NCRs trigger warnings during period close (non-blocking)`,

  ncrReconciliationImpact: `// NCR Status to Reconciliation Impact
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                  NCR RECONCILIATION IMPACT                                   │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// NCR status and financial_impact determine how NCRs affect reconciliation:
//
// ┌─────────────────┬─────────────────────┬─────────────────────────────────────┐
// │   NCR Status    │  Financial Impact   │        Reconciliation Effect        │
// ├─────────────────┼─────────────────────┼─────────────────────────────────────┤
// │   CREDITED      │       (auto)        │  → ncr_credits (reduces consumption)│
// │   REJECTED      │       (auto)        │  → ncr_losses (increases consumption)│
// │   RESOLVED      │      CREDIT         │  → ncr_credits (reduces consumption)│
// │   RESOLVED      │       LOSS          │  → ncr_losses (increases consumption)│
// │   RESOLVED      │       NONE          │  → No financial effect              │
// │   OPEN          │       N/A           │  → Warning during period close      │
// └─────────────────┴─────────────────────┴─────────────────────────────────────┘
//
// Updated Consumption Formula:
// ────────────────────────────
// Consumption = Opening + Receipts + TransfersIn - TransfersOut - Closing
//             + Adjustments - NCRCredits + NCRLosses
//
// Where:
// • NCRCredits = Sum of CREDITED NCRs + RESOLVED with CREDIT impact
// • NCRLosses  = Sum of REJECTED NCRs + RESOLVED with LOSS impact
//
// Key Points:
// • NCR Credits REDUCE consumption (money recovered from suppliers)
// • NCR Losses INCREASE consumption (unrecovered costs absorbed by business)
// • OPEN NCRs generate non-blocking warning during period close`,

  ncrCreditsUtility: `// NCR Credit Utilities
// File: server/utils/ncrCredits.ts

/**
 * Get NCRs with CREDITED status OR RESOLVED with CREDIT impact.
 * These NCRs reduce the reconciliation consumption (money recovered).
 */
export async function getCreditedNCRsForPeriod(
  periodId: string,
  locationId: string
): Promise<NCRSummaryCategory> {
  const ncrs = await prisma.nCR.findMany({
    where: {
      location_id: locationId,
      AND: [
        {
          OR: [
            { status: "CREDITED" },
            { status: "RESOLVED", financial_impact: "CREDIT" },
          ],
        },
        // Period association via delivery or creation date
        {
          OR: [
            { delivery: { period_id: periodId } },
            { delivery_id: null, created_at: { gte: periodStart, lte: periodEnd } },
          ],
        },
      ],
    },
  });

  return {
    total: ncrs.reduce((sum, ncr) => sum + Number(ncr.value), 0),
    count: ncrs.length,
    ncrs: ncrs.map(ncr => ({ id: ncr.id, ncr_no: ncr.ncr_no, value: Number(ncr.value) })),
  };
}

/**
 * Get NCRs with REJECTED status OR RESOLVED with LOSS impact.
 * These NCRs increase the reconciliation consumption (unrecovered costs).
 */
export async function getLostNCRsForPeriod(
  periodId: string,
  locationId: string
): Promise<NCRSummaryCategory> {
  // Similar query with status: "REJECTED" or financial_impact: "LOSS"
}

/**
 * Get OPEN NCRs (unresolved).
 * Triggers warning during period close.
 */
export async function getOpenNCRsForPeriod(...): Promise<{ count: number; ncrs: NCRSummaryItem[] }> { }

/**
 * Get complete NCR summary for reconciliation display.
 */
export async function getAllNCRSummaryForPeriod(
  periodId: string,
  locationId: string
): Promise<NCRSummaryResponse> {
  const [credited, losses, open] = await Promise.all([
    getCreditedNCRsForPeriod(periodId, locationId),
    getLostNCRsForPeriod(periodId, locationId),
    getOpenNCRsForPeriod(periodId, locationId),
  ]);
  return { credited, losses, pending, open };
}`,

  frontendPattern: `// Frontend Component Pattern for NCRs (RECOMMENDED)
// File: app/components/ncr/NCRForm.vue
//
// NOTE: This component is NOT YET IMPLEMENTED.
// This is a recommended pattern for creating the NCR form.

<script setup lang="ts">
interface NCRFormData {
  location_id: string;
  delivery_id?: string;
  delivery_line_id?: string;
  reason: string;
  quantity?: number;
  value: number;
}

const props = defineProps<{
  locations: Array<{ id: string; code: string; name: string }>;
  deliveries?: Array<{ id: string; delivery_no: string }>;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [data: NCRFormData];
  cancel: [];
}>();

const formData = ref<NCRFormData>({
  location_id: "",
  reason: "",
  value: 0,
});

// Form validation
const isFormValid = computed(() => {
  return (
    formData.value.location_id &&
    formData.value.reason.trim().length > 0 &&
    formData.value.value > 0
  );
});

const handleSubmit = () => {
  if (isFormValid.value) {
    emit("submit", formData.value);
  }
};
\x3C/script>

<template>
  <UCard>
    <div class="space-y-4">
      <!-- Location Select -->
      <UFormField label="Location" required>
        <USelectMenu
          v-model="formData.location_id"
          :items="locations"
          label-key="name"
          value-key="id"
          placeholder="Select location"
        />
      </UFormField>

      <!-- Optional Delivery Link -->
      <UFormField label="Related Delivery">
        <USelectMenu
          v-model="formData.delivery_id"
          :items="deliveries"
          label-key="delivery_no"
          value-key="id"
          placeholder="Select delivery (optional)"
          :disabled="!deliveries?.length"
        />
      </UFormField>

      <!-- Reason -->
      <UFormField label="Reason" required>
        <UTextarea
          v-model="formData.reason"
          placeholder="Describe the non-conformance issue..."
          rows="4"
        />
      </UFormField>

      <!-- Value -->
      <UFormField label="Value (SAR)" required>
        <UInput
          v-model.number="formData.value"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
        />
      </UFormField>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <UButton color="neutral" variant="soft" @click="emit('cancel')">
          Cancel
        </UButton>
        <UButton
          :disabled="!isFormValid || loading"
          :loading="loading"
          @click="handleSubmit"
        >
          Create NCR
        </UButton>
      </div>
    </div>
  </UCard>
</template>`,

  // NCR Email Notifications section
  ncrNotificationModels: `// NCR Notification Database Models
// File: prisma/schema.prisma

model NotificationSetting {
  id         String   @id @default(uuid())
  key        String   @unique  // NCR_FINANCE_TEAM_EMAILS, NCR_PROCUREMENT_TEAM_EMAILS
  emails     String[] @default([])
  updated_at DateTime @updatedAt
  updated_by String?  @db.Uuid
  updater    User?    @relation(...)
  @@map("notification_settings")
}

model NCRNotificationLog {
  id             String                    @id @default(uuid())
  ncr_id         String                    @db.Uuid
  recipient_type NotificationRecipientType // FINANCE | PROCUREMENT | SUPPLIER
  recipients     String[]                  // Email addresses sent to
  status         NotificationStatus        // SENT | FAILED
  error_message  String?
  sent_at        DateTime                  @default(now())
  ncr            NCR                       @relation(...)
  @@map("ncr_notification_logs")
}

enum NotificationRecipientType {
  FINANCE
  PROCUREMENT
  SUPPLIER
}

enum NotificationStatus {
  SENT
  FAILED
}`,

  triggerNotificationPattern: `// Fire-and-Forget Notification Pattern
// File: server/api/ncrs/index.post.ts

export default defineEventHandler(async (event) => {
  // ... validation and NCR creation ...

  const ncr = await prisma.nCR.create({ data: { ... } });

  // Trigger email notification (fire-and-forget - does not block response)
  triggerNCRNotification(ncr.id, prisma);

  return { message: "NCR created successfully", ncr };
});

// The triggerNCRNotification function (server/utils/email.ts):
// 1. Fetches NCR with all related data (location, delivery, supplier, items)
// 2. Resolves recipient emails from NotificationSetting table
// 3. Gets supplier emails from linked delivery→supplier relationship
// 4. Queues emails for sequential sending (prevents SMTP throttling)
// 5. Sends emails with 1.5 second delays between each
// 6. Logs each attempt to NCRNotificationLog table
// 7. Never blocks - errors are caught and logged
//
// Email Queue System (prevents delivery issues):
// - Emails are queued and sent one at a time with delays
// - Singleton SMTP transporter with connection pooling
// - Rate limiting: max 5 emails per second
// - Prevents Office 365 throttling when sending multiple emails`,

  notificationFlowDiagram: `// NCR Email Notification Flow
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                     NCR EMAIL NOTIFICATION FLOW                              │
// └─────────────────────────────────────────────────────────────────────────────┘
//
//   ┌─────────────────┐              ┌─────────────────┐
//   │  Manual NCR     │              │  Price Variance │
//   │  POST /api/ncrs │              │  Delivery Post  │
//   └────────┬────────┘              └────────┬────────┘
//            │                                │
//            └───────────────┬────────────────┘
//                            ▼
//              ┌─────────────────────────┐
//              │  triggerNCRNotification │
//              │    (fire-and-forget)    │
//              └───────────┬─────────────┘
//                          ▼
//              ┌─────────────────────────┐
//              │ resolveRecipients()     │
//              │ - Finance from settings │
//              │ - Procurement from      │
//              │   settings              │
//              │ - Supplier from         │
//              │   delivery→supplier     │
//              └───────────┬─────────────┘
//                          ▼
//                          ▼
//              ┌─────────────────────────┐
//              │     EMAIL QUEUE         │
//              │  (sequential sending)   │
//              └───────────┬─────────────┘
//                          ▼
//         ┌────────────────┼────────────────┐
//         ▼                ▼                ▼
//   ┌──────────┐    ┌──────────┐    ┌──────────┐
//   │ Finance  │    │Procurement│   │ Supplier │
//   │  Email   │ →  │  Email   │ →  │  Email   │
//   │(1.5s gap)│    │(1.5s gap)│    │          │
//   └────┬─────┘    └────┬─────┘    └────┬─────┘
//        │               │               │
//        └───────────────┴───────────────┘
//                        ▼
//              ┌─────────────────────────┐
//              │  logNCRNotification()   │
//              │  - Creates log entry    │
//              │  - Records SENT/FAILED  │
//              │  - Stores error message │
//              └─────────────────────────┘`,

  adminSettingsComposable: `// Admin Notification Settings Composable
// File: app/composables/useNotificationSettings.ts

export function useNotificationSettings() {
  const settings = ref<NotificationSettingsResponse | null>(null);
  const isLoading = ref(false);
  const isSaving = ref(false);

  async function fetchSettings(): Promise<void> {
    isLoading.value = true;
    try {
      const response = await $fetch("/api/settings/notifications");
      settings.value = response;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateSettings(data: NotificationSettingsPayload) {
    isSaving.value = true;
    try {
      const response = await $fetch("/api/settings/notifications", {
        method: "PUT",
        body: data,
      });
      settings.value = response.settings;
    } finally {
      isSaving.value = false;
    }
  }

  return { settings, isLoading, isSaving, fetchSettings, updateSettings };
}

// Usage in settings page:
const { settings, fetchSettings, updateSettings } = useNotificationSettings();
await fetchSettings();
await updateSettings({
  finance_team_emails: ["finance@company.com"],
  procurement_team_emails: ["procurement@company.com"],
});`,

  resendWithRateLimit: `// Resend Notification with Rate Limiting
// File: server/api/ncrs/[id]/resend-notification.post.ts

// 5-minute rate limit per recipient type per NCR
const RATE_LIMIT_MS = 5 * 60 * 1000;

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event);
  const { recipient_type } = await readBody(event);

  // Check last notification time for this recipient type
  const lastLog = await prisma.nCRNotificationLog.findFirst({
    where: { ncr_id: id, recipient_type },
    orderBy: { sent_at: "desc" },
  });

  if (lastLog) {
    const timeSinceLastSend = Date.now() - lastLog.sent_at.getTime();
    if (timeSinceLastSend < RATE_LIMIT_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_MS - timeSinceLastSend) / 1000);
      throw createError({
        statusCode: 429,
        data: {
          code: "RATE_LIMITED",
          message: \`Please wait \${remainingSeconds} seconds before resending\`,
          remainingSeconds,
        },
      });
    }
  }

  // Proceed with resend...
});`,

  envVariables: `// Environment Variables for Email Notifications
// Required in .env file

# SMTP Configuration (Required)
SMTP_HOST=smtp.office365.com    # SMTP server (default: Office 365)
SMTP_PORT=587                    # SMTP port (default: 587 for STARTTLS)
SMTP_USER=sender@company.com     # SMTP authentication user
SMTP_PASSWORD=xxxxxxxx           # SMTP authentication password

# Email Branding (Optional)
EMAIL_FROM=noreply@company.com   # From address (defaults to SMTP_USER)
COMPANY_NAME=AKG Group           # Company name in supplier emails

# Application URL (Required for email links)
NUXT_PUBLIC_SITE_URL=https://stock.company.com

# Development Mode
# When SMTP_USER is not set, emails are logged to console instead of sent`,

  cacheInvalidation: `// Cache Invalidation for NCRs (Recommended Pattern)
// File: app/composables/useCache.ts
//
// NOTE: NCR-specific cache invalidation is NOT YET IMPLEMENTED.
// Use the general invalidation pattern below until afterNCR is added.

// CURRENT APPROACH: Use existing cache utilities
async function handleCreateNCR(data: NCRFormData) {
  const cache = useCache();

  const result = await $fetch("/api/ncrs", {
    method: "POST",
    body: data,
  });

  // Manual cache invalidation (until afterNCR is implemented)
  cache.invalidateDashboard(data.location_id);

  // If NCR is linked to a delivery, invalidate delivery cache too
  if (data.delivery_id) {
    cache.invalidateTransactions("deliveries");
  }

  // Refresh data
  await refresh();

  return result;
}

// FUTURE: Add afterNCR to useSmartCacheInvalidation
// When implemented, it should:
// - Invalidate dashboard (NCR counts may change)
// - Invalidate delivery caches (if linked)
// - Add "ncrs" to invalidateTransactions types`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
        NCR (Non-Conformance Reports)
      </h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Manual and automatic NCR creation, status workflow, price variance detection, and resolution
      </p>
    </div>

    <!-- NCR Model Section -->
    <section
      id="dev-section-ncr-model"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('ncr-model')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-exclamation-triangle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">NCR Model & Types</span>
        </span>
        <UIcon
          :name="isExpanded('ncr-model') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('ncr-model')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The NCR (Non-Conformance Report) model tracks quality issues, price variances, and other
          non-conformances that require resolution. NCRs can be created manually by users or
          auto-generated by the system when price variances are detected.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">NCR Model</h4>
          <DeveloperCodeBlock
            :code="codeExamples.ncrModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key Fields</h4>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">ncr_no</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Auto-generated: NCR-YYYY-NNN (e.g., NCR-2025-001)
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">type</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">MANUAL or PRICE_VARIANCE</p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">auto_generated</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Boolean flag: true for system-created NCRs
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">value</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                NCR value in SAR (absolute variance amount)
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">NCR Types</h4>
          <DeveloperCodeBlock :code="codeExamples.ncrTypes" language="plaintext" />
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
          NCRs follow a workflow from creation to resolution. The status determines what actions are
          available and tracks the NCR's progress through supplier communication or internal
          resolution.
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
                <UBadge color="warning" variant="soft">OPEN</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Initial state. Newly created NCR awaiting action.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="success" variant="soft">CREDITED</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Supplier issued credit note. Final state.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="error" variant="soft">REJECTED</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Supplier rejected the claim. Final state.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="neutral" variant="soft">RESOLVED</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Internally resolved without credit. Final state.
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Direct Resolution:</strong>
              NCRs transition directly from OPEN to a closing status (CREDITED, REJECTED, or
              RESOLVED) based on the outcome.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Auto-Generation Section -->
    <section
      id="dev-section-auto-generation"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('auto-generation')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-bolt" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Auto-Generation (Price Variance)
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('auto-generation') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('auto-generation')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          When a delivery is posted, the system automatically compares the delivery unit price with
          the period-locked price. Any price difference triggers automatic NCR creation with
          detailed variance information.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Price Variance Detection
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.priceVarianceDetection"
            language="typescript"
            filename="server/utils/priceVariance.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Auto-NCR Creation</h4>
          <DeveloperCodeBlock
            :code="codeExamples.autoNCRCreation"
            language="typescript"
            filename="server/utils/priceVariance.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Integration in Delivery Posting
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.deliveryIntegration"
            language="typescript"
            filename="server/api/locations/[id]/deliveries/index.post.ts"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Zero Threshold:</strong>
              By default, ANY price difference (no matter how small) triggers NCR creation. This
              ensures full traceability of price variances from period-locked prices.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Manual NCR Section -->
    <section
      id="dev-section-manual-ncr"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('manual-ncr')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-plus" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Creating Manual NCRs</span>
        </span>
        <UIcon
          :name="isExpanded('manual-ncr') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('manual-ncr')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Users can create manual NCRs for any quality issue, damaged goods, wrong items, or other
          non-conformances that need to be tracked and resolved.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Manual NCR Creation API
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.manualNCRCreation"
            language="typescript"
            filename="server/api/ncrs/index.post.ts"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Manual NCR Fields</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-map-pin" class="text-[var(--ui-primary)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Location (Required)
                </span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                The location where the non-conformance occurred. User must have access.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-document-text" class="text-[var(--ui-primary)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Reason (Required)
                </span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Description of the issue (damaged goods, wrong items, quality issues, etc.)
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-currency-dollar" class="text-[var(--ui-primary)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Value (Required)
                </span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Monetary value of the non-conformance in SAR. Must be positive.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-truck" class="text-[var(--ui-primary)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Delivery Link (Optional)
                </span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Can optionally link to a specific delivery and delivery line.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- NCR Resolution Section -->
    <section
      id="dev-section-ncr-resolution"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('ncr-resolution')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-check-circle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">NCR Resolution</span>
        </span>
        <UIcon
          :name="
            isExpanded('ncr-resolution') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('ncr-resolution')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          NCRs are resolved by updating their status through the workflow. The API validates status
          transitions and automatically sets the resolved timestamp when moving to a final state.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Status Update & Resolution API
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.ncrResolution"
            language="typescript"
            filename="server/api/ncrs/[id].patch.ts"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Resolution Outcomes</h4>
          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-lg border border-[var(--ui-success)]/30 bg-[var(--ui-bg)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="success" variant="soft">CREDITED</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Supplier acknowledged the issue and issued a credit note. Best outcome for price
                variances.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="error" variant="soft">REJECTED</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Supplier did not accept the claim. Document the rejection reason in resolution
                notes.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-neutral)]/30 bg-[var(--ui-bg)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="neutral" variant="soft">RESOLVED</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Resolved internally without supplier credit. Use for minor issues or internal
                adjustments.
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Resolution Notes:</strong>
              Always add resolution notes when closing an NCR. This provides an audit trail and
              helps with future reference for similar issues.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- NCR Reconciliation Impact Section -->
    <section
      id="dev-section-ncr-reconciliation-impact"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('ncr-reconciliation-impact')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-calculator" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            NCR Reconciliation Impact
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('ncr-reconciliation-impact')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('ncr-reconciliation-impact')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          NCR status and financial impact determine how NCRs affect period reconciliation
          calculations. Credits reduce consumption (money recovered), while losses increase
          consumption (unrecovered costs absorbed by the business).
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Status to Reconciliation Mapping
          </h4>
          <DeveloperCodeBlock :code="codeExamples.ncrReconciliationImpact" language="plaintext" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Impact Categories</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-success)]/30 bg-[var(--ui-bg)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="success" variant="soft">NCR Credits</UBadge>
                <span class="text-xs text-[var(--ui-success)]">- Reduces consumption</span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                NCRs with CREDITED status or RESOLVED with CREDIT impact. Money recovered from
                suppliers reduces the location's consumption.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="error" variant="soft">NCR Losses</UBadge>
                <span class="text-xs text-[var(--ui-error)]">+ Increases consumption</span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                NCRs with REJECTED status or RESOLVED with LOSS impact. Unrecovered costs are
                absorbed by the business, increasing consumption.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="warning" variant="soft">Open NCRs</UBadge>
                <span class="text-xs text-[var(--ui-warning)]">Warning</span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                NCRs with OPEN status trigger a non-blocking warning during period close. Recommend
                resolving before closing.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            NCR Credits Utility Functions
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.ncrCreditsUtility"
            language="typescript"
            filename="server/utils/ncrCredits.ts"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Period Association:</strong>
              NCRs are associated with periods via their linked delivery's period_id. Manual NCRs
              without a delivery link use their creation date to determine the period.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- NCR Email Notifications Section -->
    <section
      id="dev-section-ncr-notifications"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('ncr-notifications')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-envelope" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            NCR Email Notifications
          </span>
          <UBadge color="success" variant="soft" size="xs">NEW</UBadge>
        </span>
        <UIcon
          :name="
            isExpanded('ncr-notifications') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('ncr-notifications')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The NCR Email Notification system automatically sends emails to Finance, Procurement, and
          Suppliers when NCRs are created (both manual and price variance). Notifications are sent
          asynchronously using a fire-and-forget pattern to avoid blocking NCR creation.
        </p>

        <!-- Overview -->
        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Overview</h4>
          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-building-office" class="text-[var(--ui-primary)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Finance Team
                </span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Internal notification with NCR details for financial tracking and credit note
                follow-up.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-shopping-cart" class="text-[var(--ui-primary)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Procurement Team
                </span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Internal notification for supplier relationship management and issue resolution.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-truck" class="text-[var(--ui-primary)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">Supplier</span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                External notification informing supplier of the non-conformance issue raised against
                them.
              </p>
            </div>
          </div>
        </div>

        <!-- Notification Flow Diagram -->
        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Notification Flow</h4>
          <DeveloperCodeBlock :code="codeExamples.notificationFlowDiagram" language="plaintext" />
        </div>

        <!-- Database Models -->
        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Database Models</h4>
          <DeveloperCodeBlock
            :code="codeExamples.ncrNotificationModels"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <!-- Trigger Pattern -->
        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Fire-and-Forget Pattern
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.triggerNotificationPattern"
            language="typescript"
            filename="server/api/ncrs/index.post.ts"
          />
        </div>

        <!-- Trigger Points -->
        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Trigger Points</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="primary" variant="soft">Manual NCR</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                When a user creates an NCR via
                <code class="code-inline">POST /api/ncrs</code>
                , notifications are triggered after successful creation.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="warning" variant="soft">Price Variance NCR</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                When a delivery is posted with price variance, the auto-generated NCR also triggers
                notifications.
              </p>
            </div>
          </div>
        </div>

        <!-- Admin Configuration -->
        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Admin Configuration</h4>
          <p class="mb-2 text-sm text-[var(--ui-text-muted)]">
            Finance and Procurement team emails are configured via the Settings page. Only Admins
            can modify these settings. Supplier emails are automatically resolved from the supplier
            linked to the NCR's delivery.
          </p>
          <DeveloperCodeBlock
            :code="codeExamples.adminSettingsComposable"
            language="typescript"
            filename="app/composables/useNotificationSettings.ts"
          />
        </div>

        <!-- Resend with Rate Limiting -->
        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Resend with Rate Limiting
          </h4>
          <p class="mb-2 text-sm text-[var(--ui-text-muted)]">
            Users can manually resend notifications from the NCR detail page. A 5-minute rate limit
            prevents spam and abuse.
          </p>
          <DeveloperCodeBlock
            :code="codeExamples.resendWithRateLimit"
            language="typescript"
            filename="server/api/ncrs/[id]/resend-notification.post.ts"
          />
        </div>

        <!-- Notification History -->
        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Notification History</h4>
          <p class="text-sm text-[var(--ui-text-muted)]">
            All notification attempts are logged in the
            <code class="code-inline">NCRNotificationLog</code>
            table. The NCR detail page displays notification history including:
          </p>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-clock" class="text-[var(--ui-text-muted)]" />
                <span class="text-sm text-[var(--ui-text-muted)]">Timestamp of each attempt</span>
              </div>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-user-group" class="text-[var(--ui-text-muted)]" />
                <span class="text-sm text-[var(--ui-text-muted)]">Recipient type and emails</span>
              </div>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
                <span class="text-sm text-[var(--ui-text-muted)]">Success/failure status</span>
              </div>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-exclamation-circle" class="text-[var(--ui-error)]" />
                <span class="text-sm text-[var(--ui-text-muted)]">Error message (if failed)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Environment Variables -->
        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Environment Variables</h4>
          <DeveloperCodeBlock :code="codeExamples.envVariables" language="bash" filename=".env" />
        </div>

        <!-- Business Rules -->
        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Business Rules</h4>
          <div class="space-y-2">
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Fire-and-forget</strong>
                - Notifications sent asynchronously; NCR creation never blocked by email sending
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Three recipient groups</strong>
                - Finance Team, Procurement Team, and Supplier (different email templates)
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Admin-configurable</strong>
                - Finance/Procurement emails configured via Settings page
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Automatic supplier resolution</strong>
                - Supplier emails resolved from delivery → supplier relationship
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Comprehensive logging</strong>
                - All notification attempts logged with status, recipients, timestamps
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Rate-limited resend</strong>
                - 5-minute cooldown per recipient group per NCR
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Development mode</strong>
                - Emails logged to console when SMTP not configured
              </span>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>UI Location:</strong>
              Notification settings are found at Settings → Notifications (Admin only). NCR
              notification history is displayed on the NCR detail page with resend buttons.
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
          API endpoints for NCR operations and frontend patterns including form components and cache
          invalidation.
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
                    <UBadge color="info" variant="soft" size="xs">GET</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/ncrs</td>
                  <td class="px-2 py-2">List NCRs (with filtering)</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="success" variant="soft" size="xs">POST</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/ncrs</td>
                  <td class="px-2 py-2">Create manual NCR</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="info" variant="soft" size="xs">GET</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/ncrs/:id</td>
                  <td class="px-2 py-2">Get NCR details</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="warning" variant="soft" size="xs">PATCH</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/ncrs/:id</td>
                  <td class="px-2 py-2">Update NCR status/notes</td>
                </tr>
                <tr>
                  <td class="px-2 py-2">
                    <UBadge color="info" variant="soft" size="xs">GET</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/ncrs/summary</td>
                  <td class="px-2 py-2">NCR summary for period/location</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">NCR Number Generation</h4>
          <DeveloperCodeBlock
            :code="codeExamples.generateNCRNumber"
            language="typescript"
            filename="server/utils/priceVariance.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Form Component Pattern</h4>
          <DeveloperCodeBlock
            :code="codeExamples.frontendPattern"
            language="vue"
            filename="app/components/ncr/NCRForm.vue"
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
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Error Codes</h4>
          <DeveloperCodeBlock :code="codeExamples.errorCodes" language="typescript" />
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
          Summary of all business rules governing NCR creation, status workflow, and resolution.
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
                <strong>ANY price variance creates NCR</strong>
                - No threshold, full traceability
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Auto-generated NCRs link to delivery</strong>
                - Always has delivery_id and delivery_line_id
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Final states cannot be changed</strong>
                - CREDITED, REJECTED, RESOLVED are permanent
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>resolved_at auto-set on final state</strong>
                - Captures resolution timestamp automatically
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Location access required</strong>
                - Operators need explicit assignment
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>NCR number is unique per year</strong>
                - Format: NCR-YYYY-NNN
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
