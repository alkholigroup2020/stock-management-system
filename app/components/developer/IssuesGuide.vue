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
  issueModel: `// Issue Model - Prisma Schema
// File: prisma/schema.prisma

model Issue {
  id          String      @id @default(uuid()) @db.Uuid
  issue_no    String      @unique @db.VarChar(50)
  period_id   String      @db.Uuid
  location_id String      @db.Uuid
  issue_date  DateTime    @db.Date
  cost_centre CostCentre  @default(FOOD)
  total_value Decimal     @default(0) @db.Decimal(15, 2)
  notes       String?
  posted_by   String      @db.Uuid
  posted_at   DateTime    @default(now()) @db.Timestamptz(6)
  issue_lines IssueLine[]
  location    Location    @relation(...)
  period      Period      @relation(...)
  poster      User        @relation("IssuePoster", ...)

  @@index([period_id])
  @@index([location_id])
  @@index([issue_date])
  @@index([cost_centre])
  @@index([posted_at])
  @@index([period_id, location_id])
  @@index([location_id, cost_centre])
  @@index([location_id, issue_date])
  @@map("issues")
}

// Cost Centre Enum
enum CostCentre {
  FOOD   // Food-related consumption
  CLEAN  // Cleaning supplies
  OTHER  // Miscellaneous
}`,

  issueLineModel: `// IssueLine Model - Individual Items in Issue
// File: prisma/schema.prisma

model IssueLine {
  id           String  @id @default(uuid()) @db.Uuid
  issue_id     String  @db.Uuid
  item_id      String  @db.Uuid
  quantity     Decimal @db.Decimal(15, 4)
  wac_at_issue Decimal @db.Decimal(15, 4)   // WAC captured at issue time
  line_value   Decimal @db.Decimal(15, 2)   // quantity × wac_at_issue
  issue        Issue   @relation(...)
  item         Item    @relation(...)

  @@index([issue_id])
  @@index([item_id])
  @@map("issue_lines")
}

// Key Fields:
// - wac_at_issue: Captures current WAC at time of issue
// - line_value: Calculated as quantity × wac_at_issue
// - Unlike deliveries, issues do NOT recalculate WAC`,

  issueDataFlow: `// Issue Data Flow Diagram
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                           ISSUE CREATION FLOW                                │
// └─────────────────────────────────────────────────────────────────────────────┘
//
//  ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────────┐
//  │   CREATE ISSUE  │────►│  VALIDATE STOCK  │────►│   POST & UPDATE STOCK   │
//  │   (User Input)  │     │  (No Negative)   │     │   (Decrement on_hand)   │
//  └─────────────────┘     └──────────────────┘     └─────────────────────────┘
//        │                        │                          │
//        │                        │                          │
//        ▼                        ▼                          ▼
//  • Select items           • Check on_hand >= qty     • LocationStock.on_hand ↓
//  • Enter quantities       • Throw if insufficient    • WAC stays UNCHANGED
//  • Select cost centre     • Per item validation      • wac_at_issue captured
//  • Period must be OPEN    • Atomic check-and-update  • Issue record created
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                         COST CENTRE TRACKING                                 │
// └─────────────────────────────────────────────────────────────────────────────┘
//
//  ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
//  │      FOOD         │     │      CLEAN        │     │      OTHER        │
//  │  ─────────────────│     │  ─────────────────│     │  ─────────────────│
//  │  Food consumption │     │  Cleaning supplies│     │  Miscellaneous    │
//  │  Kitchen expenses │     │  Housekeeping     │     │  General supplies │
//  └───────────────────┘     └───────────────────┘     └───────────────────┘`,

  wacAtIssue: `// WAC at Issue - Capturing Cost at Issue Time
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                         WAC AT ISSUE EXPLAINED                               │
// └─────────────────────────────────────────────────────────────────────────────┘
//
//  Why capture wac_at_issue?
//  ─────────────────────────
//  • WAC changes over time as new deliveries arrive
//  • We need to know the cost AT THE TIME of the issue
//  • This ensures accurate consumption value calculation
//  • Required for reconciliation and reporting
//
//         BEFORE ISSUE                     AFTER ISSUE
//  ┌──────────────────────────┐      ┌──────────────────────────┐
//  │    LocationStock         │      │    LocationStock         │
//  │  ─────────────────────   │      │  ─────────────────────   │
//  │  item: Rice 5kg          │      │  item: Rice 5kg          │
//  │  on_hand: 100 KG         │─────►│  on_hand: 80 KG          │
//  │  wac: SAR 10.00          │      │  wac: SAR 10.00          │ ◄─ UNCHANGED!
//  │  value: SAR 1,000.00     │      │  value: SAR 800.00       │
//  └──────────────────────────┘      └──────────────────────────┘
//               │
//               │  Issue: 20 KG
//               │
//               ▼
//        ┌───────────────────────────────────────┐
//        │  IssueLine                             │
//        │  ─────────────────────────────────    │
//        │  quantity: 20 KG                      │
//        │  wac_at_issue: SAR 10.00              │ ◄─ Captured!
//        │  line_value: SAR 200.00               │
//        └───────────────────────────────────────┘
//
// Key Rule: Issues DEDUCT stock at current WAC, but do NOT recalculate WAC`,

  stockValidation: `// Stock Validation - Preventing Negative Stock
// File: server/api/locations/[id]/issues/index.post.ts

import { z } from "zod";

// Validation schema for issue creation
const bodySchema = z.object({
  issue_date: z.string(), // ISO date string
  cost_centre: z.enum(["FOOD", "CLEAN", "OTHER"]).default("FOOD"),
  notes: z.string().nullable().optional(),
  lines: z.array(z.object({
    item_id: z.string().uuid(),
    quantity: z.number().positive(),
  })).min(1),
});

// Stock validation function
async function validateStockAvailability(
  tx: Prisma.TransactionClient,
  locationId: string,
  lines: { item_id: string; quantity: number }[]
): Promise<Map<string, { on_hand: number; wac: number }>> {
  const itemIds = lines.map((l) => l.item_id);

  // Fetch current stock levels
  const stocks = await tx.locationStock.findMany({
    where: {
      location_id: locationId,
      item_id: { in: itemIds },
    },
  });

  const stockMap = new Map(
    stocks.map((s) => [s.item_id, {
      on_hand: Number(s.on_hand),
      wac: Number(s.wac),
    }])
  );

  // Validate each line
  const insufficientItems: string[] = [];

  for (const line of lines) {
    const stock = stockMap.get(line.item_id);
    const available = stock?.on_hand ?? 0;

    if (available < line.quantity) {
      insufficientItems.push(line.item_id);
    }
  }

  // Throw error if any items have insufficient stock
  if (insufficientItems.length > 0) {
    throw createError({
      statusCode: 400,
      data: {
        code: "INSUFFICIENT_STOCK",
        message: "One or more items have insufficient stock",
        details: { itemIds: insufficientItems },
      },
    });
  }

  return stockMap;
}`,

  issuePostingFlow: `// Issue Posting Flow
// File: server/api/locations/[id]/issues/index.post.ts

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const locationId = getRouterParam(event, "id");
  const body = await readBody(event);
  const data = bodySchema.parse(body);

  // Step 1: Validate period is OPEN
  const currentPeriod = await prisma.period.findFirst({
    where: { status: "OPEN" },
  });

  if (!currentPeriod) {
    throw createError({
      statusCode: 400,
      data: { code: "NO_OPEN_PERIOD", message: "No open accounting period" },
    });
  }

  // Step 2: Process in transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Validate stock availability (throws if insufficient)
    const stockMap = await validateStockAvailability(tx, locationId, data.lines);

    // Generate issue number
    const issueNo = await generateIssueNumber(tx);

    // Create issue header
    const issue = await tx.issue.create({
      data: {
        issue_no: issueNo,
        period_id: currentPeriod.id,
        location_id: locationId,
        issue_date: new Date(data.issue_date),
        cost_centre: data.cost_centre,
        notes: data.notes,
        posted_by: user.id,
      },
    });

    // Process each line
    let totalValue = 0;
    const createdLines = [];

    for (const lineData of data.lines) {
      const stock = stockMap.get(lineData.item_id)!;
      const lineValue = lineData.quantity * stock.wac;

      // Create issue line with captured WAC
      const line = await tx.issueLine.create({
        data: {
          issue_id: issue.id,
          item_id: lineData.item_id,
          quantity: lineData.quantity,
          wac_at_issue: stock.wac,    // Capture current WAC
          line_value: lineValue,
        },
      });

      // Decrement stock (WAC remains unchanged)
      await tx.locationStock.update({
        where: {
          location_id_item_id: {
            location_id: locationId,
            item_id: lineData.item_id,
          },
        },
        data: {
          on_hand: { decrement: lineData.quantity },
        },
      });

      totalValue += lineValue;
      createdLines.push(line);
    }

    // Update issue total
    await tx.issue.update({
      where: { id: issue.id },
      data: { total_value: totalValue },
    });

    return { issue, lines: createdLines };
  }, { timeout: 30000 });

  return result;
});`,

  generateIssueNumber: `// Issue Number Generation
// File: server/utils/issueNumber.ts

/**
 * Generate unique issue number: ISS-YYYY-NNN
 *
 * Format:
 * - ISS: Issue prefix
 * - YYYY: Current year
 * - NNN: Sequential number (padded to 3 digits)
 *
 * Examples:
 * - ISS-2025-001
 * - ISS-2025-042
 * - ISS-2025-999
 */
export async function generateIssueNumber(
  prisma: Prisma.TransactionClient
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = \`ISS-\${year}-\`;

  // Find the latest issue for this year
  const latestIssue = await prisma.issue.findFirst({
    where: {
      issue_no: { startsWith: prefix },
    },
    orderBy: { issue_no: "desc" },
    select: { issue_no: true },
  });

  let nextNumber = 1;
  if (latestIssue) {
    // Extract number from "ISS-YYYY-NNN"
    const match = latestIssue.issue_no.match(/-(\\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return \`\${prefix}\${String(nextNumber).padStart(3, "0")}\`;
}`,

  stockUpdatePattern: `// Stock Update Pattern - Decrement Only
//
// Unlike deliveries which use UPSERT, issues only UPDATE existing stock:
//
// await tx.locationStock.update({
//   where: {
//     location_id_item_id: {
//       location_id: locationId,
//       item_id: lineData.item_id,
//     },
//   },
//   data: {
//     on_hand: { decrement: lineData.quantity },
//     // NOTE: WAC is NOT updated on issues!
//   },
// });
//
// Key Differences from Delivery:
// ──────────────────────────────
// ┌─────────────────────────┬───────────────────────────────────┐
// │       DELIVERY          │           ISSUE                   │
// ├─────────────────────────┼───────────────────────────────────┤
// │  Stock: INCREMENT       │  Stock: DECREMENT                 │
// │  WAC: RECALCULATE       │  WAC: UNCHANGED                   │
// │  Operation: UPSERT      │  Operation: UPDATE only           │
// │  Can create new stock   │  Stock must exist                 │
// │  Adds inventory         │  Removes inventory                │
// └─────────────────────────┴───────────────────────────────────┘
//
// Atomic Operation:
// ─────────────────
// The decrement is atomic - Prisma handles the read-modify-write
// within the transaction to prevent race conditions.`,

  useIssuesComposable: `// Frontend Data Fetching Pattern
// File: app/composables/useIssues.ts (recommended implementation)

export function useIssues(locationId: Ref<string | null>) {
  const {
    data: issues,
    pending,
    error,
    refresh,
  } = useAsyncData(
    () => \`issues-\${locationId.value}\`,
    () => $fetch(\`/api/locations/\${locationId.value}/issues\`),
    {
      watch: [locationId],
      getCachedData: (key, nuxtApp) => {
        const cached = nuxtApp.payload.data[key];
        if (!cached) return undefined;

        // 20 second cache TTL
        const CACHE_TTL = 20 * 1000;
        const fetchedAt = nuxtApp.payload._timestamps?.[key] || 0;
        if (Date.now() - fetchedAt > CACHE_TTL) return undefined;

        return cached;
      },
    }
  );

  return { issues, pending, error, refresh };
}

// Creating an issue
async function createIssue(locationId: string, data: CreateIssueInput) {
  const response = await $fetch(\`/api/locations/\${locationId}/issues\`, {
    method: "POST",
    body: data,
  });

  // Invalidate caches after creation
  const { afterIssue } = useSmartCacheInvalidation();
  afterIssue(locationId);

  return response;
}`,

  issueFormComponent: `// Issue Form Component Pattern (Recommended Implementation)
// File: app/components/issue/IssueForm.vue (to be created)

<script setup lang="ts">
import { z } from "zod";

const locationStore = useLocationStore();
const periodStore = usePeriodStore();

// Form state
const isSubmitting = ref(false);
const issueData = ref({
  issue_date: new Date().toISOString().split("T")[0],
  cost_centre: "FOOD" as "FOOD" | "CLEAN" | "OTHER",
  notes: "",
  lines: [] as IssueLine[],
});

// Cost centre options
const costCentreOptions = [
  { value: "FOOD", label: "Food", icon: "i-heroicons-cake" },
  { value: "CLEAN", label: "Cleaning", icon: "i-heroicons-sparkles" },
  { value: "OTHER", label: "Other", icon: "i-heroicons-cube" },
];

// Check if can post
const canPost = computed(() => {
  return periodStore.isPeriodOpen && issueData.value.lines.length > 0;
});

// Submit handler
async function handleSubmit() {
  isSubmitting.value = true;
  try {
    const response = await $fetch(
      \`/api/locations/\${locationStore.activeLocationId}/issues\`,
      {
        method: "POST",
        body: issueData.value,
      }
    );

    useAppToast().showSuccess(
      \`Issue \${response.issue.issue_no} posted successfully.\`
    );

    // Invalidate caches
    const { afterIssue } = useSmartCacheInvalidation();
    afterIssue(locationStore.activeLocationId!);

    // Reset form or navigate
    emit("success", response);

  } catch (error: any) {
    if (error.data?.code === "INSUFFICIENT_STOCK") {
      useAppToast().showError("Insufficient stock for one or more items.");
    } else if (error.data?.code === "NO_OPEN_PERIOD") {
      useAppToast().showError("No open accounting period.");
    } else {
      useAppToast().showError("Failed to post issue.");
    }
  } finally {
    isSubmitting.value = false;
  }
}
\x3C/script>

\x3Ctemplate>
  \x3Cform @submit.prevent="handleSubmit">
    \x3C!-- Period Warning -->
    \x3CUAlert
      v-if="!periodStore.isPeriodOpen"
      color="error"
      icon="i-heroicons-exclamation-triangle"
      title="Period not open. Cannot post issues."
    />

    \x3C!-- Cost Centre Select -->
    \x3CUFormField label="Cost Centre">
      \x3CURadioGroup v-model="issueData.cost_centre" :items="costCentreOptions" />
    \x3C/UFormField>

    \x3C!-- Issue Date -->
    \x3CUFormField label="Issue Date">
      \x3CUInput v-model="issueData.issue_date" type="date" />
    \x3C/UFormField>

    \x3C!-- Line Items -->
    \x3CIssueLineItems v-model="issueData.lines" :location-id="locationStore.activeLocationId" />

    \x3C!-- Actions -->
    \x3Cdiv class="flex gap-2">
      \x3CUButton
        type="submit"
        color="primary"
        :disabled="!canPost || isSubmitting"
        :loading="isSubmitting"
        class="cursor-pointer"
      >
        Post Issue
      \x3C/UButton>
    \x3C/div>
  \x3C/form>
\x3C/template>`,

  errorCodes: `// Issue-Related Error Codes
// Used in API responses for specific error handling

// Validation Errors (400)
VALIDATION_ERROR      // Invalid request data (Zod validation failed)
INSUFFICIENT_STOCK    // Not enough stock to fulfill issue

// Authorization Errors (401, 403)
NOT_AUTHENTICATED     // User not logged in
LOCATION_ACCESS_DENIED // User cannot access this location

// Not Found Errors (404)
LOCATION_NOT_FOUND    // Location ID doesn't exist
ITEM_NOT_FOUND        // Item ID doesn't exist

// Business Rule Errors (400)
NO_OPEN_PERIOD        // Cannot post - no period is OPEN
PERIOD_CLOSED         // Period is not OPEN for transactions
NO_STOCK_RECORD       // Item has no stock at this location

// Internal Errors (500)
INTERNAL_ERROR        // Unexpected server error

// Example error response:
{
  "statusCode": 400,
  "statusMessage": "Bad Request",
  "data": {
    "code": "INSUFFICIENT_STOCK",
    "message": "One or more items have insufficient stock",
    "details": {
      "itemIds": ["uuid-1", "uuid-2"]
    }
  }
}`,

  businessRules: `// Issue Business Rules Summary
//
// 1. Stock Validation (CRITICAL)
// ──────────────────────────────
// • NEVER allow negative stock
// • Validate: requestedQty <= locationStock.on_hand
// • Check ALL items before processing ANY
// • Return specific item IDs that fail validation
// • Atomic check-and-update in transaction
//
// 2. WAC Handling
// ───────────────
// • Capture current WAC at issue time (wac_at_issue)
// • WAC is NOT recalculated on issues
// • line_value = quantity × wac_at_issue
// • total_value = SUM of all line_values
//
// 3. Cost Centre Tracking
// ───────────────────────
// • FOOD: Food-related consumption
// • CLEAN: Cleaning supplies
// • OTHER: Miscellaneous items
// • Used for reporting and analysis
// • Default to FOOD if not specified
//
// 4. Period Validation
// ────────────────────
// • Period must be OPEN to post issues
// • Issue linked to current period
// • Cannot issue to CLOSED or DRAFT periods
// • Period.status checked before processing
//
// 5. Immediate Posting
// ────────────────────
// • Unlike deliveries, issues have NO draft state
// • All issues are immediately POSTED
// • Stock decremented at creation time
// • Cannot edit or delete posted issues
//
// 6. Audit Trail
// ──────────────
// • posted_by: User who created the issue
// • posted_at: Timestamp of creation
// • issue_no: Auto-generated unique number
// • All data preserved for reporting`,

  costCentreUsage: `// Cost Centre Usage Examples
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                         COST CENTRE EXAMPLES                                 │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// FOOD Cost Centre:
// ─────────────────
// • Rice, flour, cooking oil
// • Meat, poultry, seafood
// • Fresh vegetables, fruits
// • Spices, condiments
// • Dairy products
// • Kitchen consumables
//
// CLEAN Cost Centre:
// ──────────────────
// • Dish soap, sanitizers
// • Floor cleaners
// • Laundry detergent
// • Paper towels, tissues
// • Garbage bags
// • Mops, brushes
//
// OTHER Cost Centre:
// ──────────────────
// • Office supplies
// • Miscellaneous items
// • Non-categorized goods
// • General supplies
//
// Reporting Benefits:
// ───────────────────
// • Track consumption by category
// • Analyze costs per cost centre
// • Compare food vs non-food expenses
// • Monthly/period cost breakdowns
// • Cost per manday by category`,

  reconciliationImpact: `// Issue Impact on Reconciliation
//
// Reconciliation Formula:
// ───────────────────────
// Opening + Receipts + TransfersIn - TransfersOut - Issues - Adjustments = Closing
//
// Issue Contribution:
// ───────────────────
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                                                                               │
// │   SELECT SUM(total_value)                                                    │
// │   FROM issues                                                                 │
// │   WHERE period_id = :periodId                                                │
// │   AND location_id = :locationId                                              │
// │                                                                               │
// │   This gives the "Issues" component of reconciliation                        │
// │                                                                               │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// By Cost Centre:
// ───────────────
// SELECT cost_centre, SUM(total_value) as total
// FROM issues
// WHERE period_id = :periodId AND location_id = :locationId
// GROUP BY cost_centre
//
// Result:
// ┌─────────────┬──────────────┐
// │ cost_centre │    total     │
// ├─────────────┼──────────────┤
// │ FOOD        │ SAR 15,000   │
// │ CLEAN       │ SAR 2,500    │
// │ OTHER       │ SAR 500      │
// └─────────────┴──────────────┘`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
        Issues (Stock Deductions)
      </h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Issuing inventory, cost centre tracking, WAC capture, and stock validation
      </p>
    </div>

    <!-- Issue Model Section -->
    <section
      id="dev-section-issue-model"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('issue-model')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-right-on-rectangle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Issue Model</span>
        </span>
        <UIcon
          :name="isExpanded('issue-model') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('issue-model')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The Issue model represents outbound stock deductions. Each issue contains multiple line
          items and tracks cost centre, total value, and posting information.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Issue Model</h4>
          <DeveloperCodeBlock
            :code="codeExamples.issueModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">IssueLine Model</h4>
          <DeveloperCodeBlock
            :code="codeExamples.issueLineModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key Fields</h4>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">issue_no</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Auto-generated: ISS-YYYY-NNN (e.g., ISS-2025-001)
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">cost_centre</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Category: FOOD, CLEAN, or OTHER
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">wac_at_issue</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                WAC captured at time of issue
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">line_value</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Calculated: quantity x wac_at_issue
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Cost Centre Section -->
    <section
      id="dev-section-cost-centre"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('cost-centre')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-tag" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Cost Centre Tracking</span>
        </span>
        <UIcon
          :name="isExpanded('cost-centre') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('cost-centre')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Each issue is assigned to a cost centre for tracking and reporting purposes. This enables
          analysis of consumption by category.
        </p>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Cost Centre Types</h4>
          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-cake" class="text-[var(--ui-warning)]" />
                <UBadge color="warning" variant="soft">FOOD</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Food-related consumption: ingredients, kitchen supplies, consumables
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-sparkles" class="text-[var(--ui-info)]" />
                <UBadge color="info" variant="soft">CLEAN</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Cleaning supplies: sanitizers, detergents, housekeeping items
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-cube" class="text-[var(--ui-neutral)]" />
                <UBadge color="neutral" variant="soft">OTHER</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Miscellaneous: office supplies, general items, non-categorized goods
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Usage Examples</h4>
          <DeveloperCodeBlock :code="codeExamples.costCentreUsage" language="plaintext" />
        </div>
      </div>
    </section>

    <!-- WAC at Issue Section -->
    <section
      id="dev-section-wac-at-issue"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('wac-at-issue')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-calculator" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">WAC at Issue Capture</span>
        </span>
        <UIcon
          :name="
            isExpanded('wac-at-issue') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('wac-at-issue')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Unlike deliveries which recalculate WAC, issues capture the current WAC at the time of
          issue. This preserves the accurate cost for reporting.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">WAC Capture Explained</h4>
          <DeveloperCodeBlock :code="codeExamples.wacAtIssue" language="plaintext" />
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Key Rule:</strong> Issues deduct stock at current WAC but do NOT recalculate
              WAC. Only deliveries recalculate WAC.
            </span>
          </p>
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Why Capture WAC at Issue?</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>WAC changes over time as new deliveries arrive</span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>Accurate cost calculation at the time of consumption</span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>Required for reconciliation and period-end reporting</span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>Enables historical cost analysis</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Stock Validation Section -->
    <section
      id="dev-section-stock-validation"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('stock-validation')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-shield-check" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]"
            >Stock Validation (No Negative)</span
          >
        </span>
        <UIcon
          :name="
            isExpanded('stock-validation') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('stock-validation')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          A critical business rule: stock can never go negative. All issue requests are validated
          against available stock before processing.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Stock Validation Function
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.stockValidation"
            language="typescript"
            filename="server/api/locations/[id]/issues/index.post.ts"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-error)]">
            <UIcon name="i-heroicons-exclamation-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Critical Business Rule:</strong> NEVER allow negative stock. Validate ALL
              items before processing ANY. This prevents partial issues.
            </span>
          </p>
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Validation Rules</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>Check <code class="code-inline">requestedQty <= on_hand</code> for each item</span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>Validate all items before processing any to prevent partial issues</span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>Return specific item IDs that fail validation in error response</span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>Atomic check-and-update within database transaction</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Issue Posting Flow Section -->
    <section
      id="dev-section-posting-flow"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('posting-flow')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-check-circle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Issue Posting Flow</span>
        </span>
        <UIcon
          :name="isExpanded('posting-flow') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('posting-flow')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The issue posting flow validates inputs, checks stock availability, and processes all
          line items atomically in a database transaction.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Data Flow Diagram</h4>
          <DeveloperCodeBlock :code="codeExamples.issueDataFlow" language="plaintext" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Posting Flow Code</h4>
          <DeveloperCodeBlock
            :code="codeExamples.issuePostingFlow"
            language="typescript"
            filename="server/api/locations/[id]/issues/index.post.ts"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Posting Steps</h4>
          <ol class="list-inside list-decimal space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Validate period:</strong> Ensure an OPEN period exists
            </li>
            <li>
              <strong>Start transaction:</strong> Begin atomic database transaction
            </li>
            <li>
              <strong>Validate stock:</strong> Check all items have sufficient stock
            </li>
            <li>
              <strong>Generate issue number:</strong> Create unique ISS-YYYY-NNN
            </li>
            <li>
              <strong>Create issue header:</strong> Insert issue record with metadata
            </li>
            <li>
              <strong>For each line:</strong> Capture WAC, calculate value, create line
            </li>
            <li>
              <strong>Decrement stock:</strong> Update LocationStock.on_hand
            </li>
            <li>
              <strong>Update totals:</strong> Set total_value on issue header
            </li>
          </ol>
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>No Draft State:</strong> Unlike deliveries, issues are immediately posted.
              There is no draft/posted status distinction for issues.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Stock Update Pattern Section -->
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
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Stock Update Pattern</span>
        </span>
        <UIcon
          :name="isExpanded('stock-update') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('stock-update')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Issues decrement stock but do NOT change WAC. This is different from deliveries which
          both increment stock and recalculate WAC.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Stock Update Comparison
          </h4>
          <DeveloperCodeBlock :code="codeExamples.stockUpdatePattern" language="typescript" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Issue vs Delivery Stock Updates</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-arrow-right-on-rectangle" class="text-[var(--ui-error)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Issue (Decrement)
                </span>
              </div>
              <ul class="space-y-1 text-xs text-[var(--ui-text-muted)]">
                <li>Stock: DECREMENT on_hand</li>
                <li>WAC: UNCHANGED</li>
                <li>Operation: UPDATE only</li>
                <li>Stock record must exist</li>
              </ul>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-truck" class="text-[var(--ui-success)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Delivery (Increment)
                </span>
              </div>
              <ul class="space-y-1 text-xs text-[var(--ui-text-muted)]">
                <li>Stock: INCREMENT on_hand</li>
                <li>WAC: RECALCULATE</li>
                <li>Operation: UPSERT</li>
                <li>Creates stock if missing</li>
              </ul>
            </div>
          </div>
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
          Recommended patterns for API endpoints and frontend components. The
          <code class="code-inline">afterIssue()</code> function from
          <code class="code-inline">useSmartCacheInvalidation()</code> is implemented.
        </p>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Note:</strong> The composable and form patterns below are recommended
              implementations. The cache invalidation is already implemented.
            </span>
          </p>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Issue Number Generation</h4>
          <DeveloperCodeBlock
            :code="codeExamples.generateIssueNumber"
            language="typescript"
            filename="server/utils/issueNumber.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Data Fetching Composable (Pattern)
          </h4>
          <DeveloperCodeBlock :code="codeExamples.useIssuesComposable" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Form Component (Pattern)
          </h4>
          <DeveloperCodeBlock :code="codeExamples.issueFormComponent" language="vue" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Error Codes</h4>
          <DeveloperCodeBlock :code="codeExamples.errorCodes" language="typescript" />
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Cache Invalidation:</strong> Always call
              <code class="code-inline">afterIssue()</code> from
              <code class="code-inline">useSmartCacheInvalidation()</code> after creating an issue
              to refresh stock and transaction caches.
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
          Issues are a key component of period-end reconciliation. The total issue value is
          subtracted from available stock in the reconciliation formula.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Reconciliation Formula
          </h4>
          <DeveloperCodeBlock :code="codeExamples.reconciliationImpact" language="plaintext" />
        </div>

        <div class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-4">
          <h5 class="mb-2 text-sm font-medium text-[var(--ui-text-highlighted)]">
            Reconciliation Formula
          </h5>
          <code class="text-sm text-[var(--ui-text-highlighted)]">
            Opening + Receipts + TransfersIn - TransfersOut - <strong>Issues</strong> - Adjustments
            = Closing
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
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Business Rules Summary</span>
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
          Summary of all business rules governing issues, stock validation, and cost tracking.
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
                <strong>Never allow negative stock</strong> - Always validate before issue
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Issues do NOT recalculate WAC</strong> - Only capture current WAC
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Period must be OPEN</strong> - Cannot issue to closed periods
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Immediate posting</strong> - No draft state, all issues are final
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Cost centre required</strong> - Track FOOD, CLEAN, or OTHER
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
