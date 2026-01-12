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
  id               String        @id @default(uuid()) @db.Uuid
  ncr_no           String        @unique @db.VarChar(50)
  location_id      String        @db.Uuid
  type             NCRType       @default(MANUAL)
  auto_generated   Boolean       @default(false)
  delivery_id      String?       @db.Uuid
  delivery_line_id String?       @db.Uuid
  reason           String
  quantity         Decimal?      @db.Decimal(15, 4)
  value            Decimal       @db.Decimal(15, 2)
  status           NCRStatus     @default(OPEN)
  created_by       String        @db.Uuid
  created_at       DateTime      @default(now()) @db.Timestamptz(6)
  resolved_at      DateTime?     @db.Timestamptz(6)
  resolution_notes String?
  creator          User          @relation("NCRCreator", ...)
  delivery         Delivery?     @relation(...)
  delivery_line    DeliveryLine? @relation(...)
  location         Location      @relation(...)

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
  SENT      // Sent to supplier for review
  CREDITED  // Supplier issued credit note
  REJECTED  // Supplier rejected the claim
  RESOLVED  // Internally resolved without credit
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
//                    ┌────────────────┴────────────────┐
//                    │                                 │
//                    ▼                                 ▼
//            ┌───────────────┐               ┌───────────────┐
//            │     SENT      │               │   RESOLVED    │
//            │ (to supplier) │               │   (direct)    │
//            └───────┬───────┘               │   (final)     │
//                    │                       └───────────────┘
//                    │
//       ┌────────────┼────────────┐
//       │            │            │
//       ▼            ▼            ▼
// ┌──────────┐ ┌──────────┐ ┌──────────┐
// │ CREDITED │ │ REJECTED │ │ RESOLVED │
// │  (final) │ │  (final) │ │  (final) │
// │  Credit  │ │  No      │ │ Internal │
// │  issued  │ │  credit  │ │ resolve  │
// └──────────┘ └──────────┘ └──────────┘
//
// Status Transitions:
// - OPEN → SENT: Claim sent to supplier
// - OPEN → RESOLVED: Resolved internally (skip supplier)
// - SENT → CREDITED: Supplier issued credit note
// - SENT → REJECTED: Supplier rejected the claim
// - SENT → RESOLVED: Resolved without credit/rejection
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
  status: z.enum(["OPEN", "SENT", "CREDITED", "REJECTED", "RESOLVED"]).optional(),
  resolution_notes: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const id = getRouterParam(event, "id");
  const data = bodySchema.parse(await readBody(event));

  const ncr = await prisma.nCR.findUnique({ where: { id } });

  // Validate status transition
  const validTransitions: Record<string, string[]> = {
    OPEN: ["SENT", "RESOLVED"],           // Can send to supplier or resolve directly
    SENT: ["CREDITED", "REJECTED", "RESOLVED"],  // Supplier response options
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
// • SENT: Claim sent to supplier for review
// • CREDITED: Supplier issued credit note (final)
// • REJECTED: Supplier rejected the claim (final)
// • RESOLVED: Internally resolved, no credit (final)
// • Can skip SENT and go directly from OPEN to RESOLVED
//
// 4. Status Transitions (valid paths)
// ───────────────────────────────────
// OPEN → SENT, RESOLVED
// SENT → CREDITED, REJECTED, RESOLVED
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
// • Used for reporting and reconciliation impact`,

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
          <UIcon
            name="i-heroicons-exclamation-triangle"
            class="text-xl text-[var(--ui-primary)]"
          />
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
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Status Workflow Diagram</h4>
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
                <UBadge color="info" variant="soft">SENT</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Claim sent to supplier for review and response.
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
              <strong>Shortcut Path:</strong>
              NCRs can go directly from OPEN to RESOLVED, skipping the SENT state if the issue is
              resolved internally without supplier involvement.
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
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Manual NCR Creation API</h4>
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
                <tr>
                  <td class="px-2 py-2">
                    <UBadge color="warning" variant="soft" size="xs">PATCH</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/ncrs/:id</td>
                  <td class="px-2 py-2">Update NCR status/notes</td>
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
