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
  reconciliationModel: `// Reconciliation Model - Prisma Schema
// File: prisma/schema.prisma

model Reconciliation {
  id            String   @id @default(uuid()) @db.Uuid
  period_id     String   @db.Uuid
  location_id   String   @db.Uuid
  opening_stock Decimal  @default(0) @db.Decimal(15, 2)
  receipts      Decimal  @default(0) @db.Decimal(15, 2)
  transfers_in  Decimal  @default(0) @db.Decimal(15, 2)
  transfers_out Decimal  @default(0) @db.Decimal(15, 2)
  issues        Decimal  @default(0) @db.Decimal(15, 2)
  closing_stock Decimal  @default(0) @db.Decimal(15, 2)
  adjustments   Decimal  @default(0) @db.Decimal(15, 2)
  back_charges  Decimal  @default(0) @db.Decimal(15, 2)
  credits       Decimal  @default(0) @db.Decimal(15, 2)
  ncr_credits   Decimal  @default(0) @db.Decimal(15, 2) // Auto-calculated from NCRs
  ncr_losses    Decimal  @default(0) @db.Decimal(15, 2) // Auto-calculated from NCRs
  condemnations Decimal  @default(0) @db.Decimal(15, 2)
  last_updated  DateTime @updatedAt @db.Timestamptz(6)
  location      Location @relation(fields: [location_id], references: [id], onDelete: Cascade)
  period        Period   @relation(fields: [period_id], references: [id], onDelete: Cascade)

  @@unique([period_id, location_id])
  @@index([period_id])
  @@index([location_id])
  @@map("reconciliations")
}`,

  consumptionFormula: `// Consumption Calculation Formula
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                    RECONCILIATION CALCULATION                                │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// Core Formula:
// ──────────────
// Consumption = Opening + Receipts + TransfersIn - TransfersOut - Closing
//             + Adjustments - NCRCredits + NCRLosses
//
// Where:
// - Opening     = Closing stock from previous period (carry-forward)
// - Receipts    = Sum of all posted deliveries (value)
// - TransfersIn = Sum of completed transfers TO this location
// - TransfersOut= Sum of completed transfers FROM this location
// - Closing     = Current stock value (on_hand × WAC for all items)
// - Adjustments = BackCharges - Credits - Condemnations + GeneralAdjustments
// - NCRCredits  = Sum of CREDITED NCRs + RESOLVED with CREDIT impact (reduces consumption)
// - NCRLosses   = Sum of REJECTED NCRs + RESOLVED with LOSS impact (increases consumption)
//
// Adjustment Types:
// ─────────────────
// BackCharges   = Amounts charged back to suppliers (adds to consumption)
// Credits       = Credits due from suppliers (reduces consumption)
// Condemnations = Value of condemned/spoiled stock (reduces consumption)
// Adjustments   = General/miscellaneous adjustments (can be +/-)
//
// NCR Impact (Auto-Calculated):
// ─────────────────────────────
// NCRCredits    = Money recovered from suppliers (CREDITED or RESOLVED+CREDIT) → REDUCES consumption
// NCRLosses     = Unrecovered costs (REJECTED or RESOLVED+LOSS) → INCREASES consumption
//
// Example:
// ────────
// Opening Stock:    SAR 125,000
// + Receipts:       SAR  45,000
// + Transfers In:   SAR   5,000
// - Transfers Out:  SAR   3,000
// - Closing Stock:  SAR 137,000
// + Back-charges:   SAR   1,000
// - Credits:        SAR     500
// - Condemnations:  SAR   1,000
// - NCR Credits:    SAR   2,500  // Money recovered from suppliers
// + NCR Losses:     SAR     800  // Unrecovered costs absorbed
// ─────────────────────────────
// = Consumption:    SAR  32,800`,

  mandayCostFormula: `// Manday Cost Calculation
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                       MANDAY COST FORMULA                                    │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// Formula:
// ────────
// MandayCost = Consumption / TotalMandays
//
// Where:
// - Consumption   = Calculated consumption value (from reconciliation)
// - TotalMandays  = Sum of (crew_count + extra_count) from POB entries
//
// Business Context:
// ─────────────────
// - Mandays represent person-days for the period
// - POB (Personnel On Board) entries track daily crew counts
// - Manday cost is a key KPI for kitchen/store efficiency
// - Target manday cost helps budget planning
//
// Example:
// ────────
// Consumption:    SAR 34,500
// Total Mandays:  2,100 (30 days × 70 avg crew)
// ────────────────────────
// Manday Cost:    SAR 16.43 per person per day`,

  calculateConsumptionUtil: `// Consumption Calculation Utility
// File: server/utils/reconciliation.ts

/**
 * Calculate stock consumption for a period
 *
 * @param input - Consumption calculation inputs
 * @returns ConsumptionResult with consumption value and breakdown
 */
export function calculateConsumption(input: ConsumptionInput): ConsumptionResult {
  const openingStock = toNumber(input.openingStock);
  const receipts = toNumber(input.receipts);
  const transfersIn = toNumber(input.transfersIn);
  const transfersOut = toNumber(input.transfersOut);
  const closingStock = toNumber(input.closingStock);
  const adjustments = toNumber(input.adjustments || 0);
  const backCharges = toNumber(input.backCharges || 0);
  const credits = toNumber(input.credits || 0);
  const condemnations = toNumber(input.condemnations || 0);
  const ncrCredits = toNumber(input.ncrCredits || 0);  // Auto-calculated from NCRs
  const ncrLosses = toNumber(input.ncrLosses || 0);    // Auto-calculated from NCRs

  // Calculate total adjustments (includes NCR impact)
  const totalAdjustments = backCharges - credits - condemnations + adjustments
                         - ncrCredits + ncrLosses;

  // Calculate consumption
  const consumption =
    openingStock + receipts + transfersIn - transfersOut - closingStock + totalAdjustments;

  return {
    consumption: Math.round(consumption * 100) / 100,
    totalAdjustments: Math.round(totalAdjustments * 100) / 100,
    breakdown: {
      openingStock,
      receipts,
      transfersIn,
      transfersOut,
      closingStock,
      adjustments,
      backCharges,
      credits,
      condemnations,
    },
  };
}

/**
 * Calculate manday cost
 */
export function calculateMandayCost(
  consumption: number | Decimal,
  totalMandays: number
): MandayCostResult {
  const consumptionValue = toNumber(consumption);

  if (totalMandays <= 0) {
    throw new Error("totalMandays must be greater than zero");
  }

  const mandayCost = consumptionValue / totalMandays;

  return {
    mandayCost: Math.round(mandayCost * 100) / 100,
    consumption: Math.round(consumptionValue * 100) / 100,
    totalMandays,
  };
}`,

  adjustmentTypes: `// Adjustment Types Explained
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                        ADJUSTMENT TYPES                                      │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// 1. BACK-CHARGES
// ───────────────
// • Amounts charged back to suppliers for issues
// • Examples: damaged goods, short delivery, quality issues
// • ADDS to consumption (supplier owes us)
// • Links conceptually to NCRs with CREDITED status
//
// 2. CREDITS DUE
// ──────────────
// • Credits expected from suppliers
// • Examples: price adjustments, refunds pending
// • REDUCES consumption (we expect money back)
// • Outstanding credit notes not yet received
//
// 3. CONDEMNATIONS
// ────────────────
// • Value of condemned/spoiled/discarded stock
// • Examples: expired items, quality failures, pest damage
// • REDUCES consumption (written off, not actual use)
// • Should be documented with disposal records
//
// 4. OTHER ADJUSTMENTS
// ────────────────────
// • Miscellaneous adjustments not fitting above
// • Examples: inventory corrections, count variances
// • Can be positive or negative
// • Should include notes explaining reason
//
// Impact on Consumption:
// ┌──────────────────┬────────────────┬──────────────────┐
// │   Adjustment     │    Impact      │     Formula      │
// ├──────────────────┼────────────────┼──────────────────┤
// │  Back-charges    │  + (increases) │  +backCharges    │
// │  Credits         │  - (decreases) │  -credits        │
// │  Condemnations   │  - (decreases) │  -condemnations  │
// │  Other           │  +/- (varies)  │  +adjustments    │
// │  NCR Credits     │  - (decreases) │  -ncrCredits     │
// │  NCR Losses      │  + (increases) │  +ncrLosses      │
// └──────────────────┴────────────────┴──────────────────┘`,

  ncrIntegration: `// NCR Integration with Reconciliation
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                    NCR RECONCILIATION INTEGRATION                            │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// NCR Status to Reconciliation Mapping:
// ─────────────────────────────────────
// ┌─────────────────┬─────────────────────┬─────────────────────────────────────┐
// │   NCR Status    │  Financial Impact   │        Reconciliation Field         │
// ├─────────────────┼─────────────────────┼─────────────────────────────────────┤
// │   CREDITED      │       (auto)        │  → ncr_credits (reduces consumption)│
// │   REJECTED      │       (auto)        │  → ncr_losses (increases consumption)│
// │   RESOLVED      │      CREDIT         │  → ncr_credits (reduces consumption)│
// │   RESOLVED      │       LOSS          │  → ncr_losses (increases consumption)│
// │   RESOLVED      │       NONE          │  → No financial effect              │
// │   SENT          │       N/A           │  → "Pending Credits" (informational)│
// │   OPEN          │       N/A           │  → Warning during period close      │
// └─────────────────┴─────────────────────┴─────────────────────────────────────┘
//
// NCR Summary API:
// ────────────────
// GET /api/ncrs/summary?periodId=xxx&locationId=xxx
//
// Returns: {
//   credited: { total: number, count: number, ncrs: [...] },
//   losses:   { total: number, count: number, ncrs: [...] },
//   pending:  { total: number, count: number, ncrs: [...] },  // SENT status
//   open:     { count: number, ncrs: [...] }                  // OPEN status
// }
//
// Key Points:
// ───────────
// • ncr_credits and ncr_losses are AUTO-CALCULATED when saving reconciliation
// • NCR Credits REDUCE consumption (money recovered from suppliers)
// • NCR Losses INCREASE consumption (unrecovered costs absorbed)
// • SENT NCRs shown as "Pending Credits" but don't affect calculation
// • OPEN NCRs trigger non-blocking warning during period close
// • OpenNCRWarning component displays grouped warnings by location`,

  saveAdjustmentsApi: `// Save Reconciliation Adjustments
// File: server/api/reconciliations/index.post.ts

const bodySchema = z.object({
  periodId: z.string().uuid(),
  locationId: z.string().uuid(),
  back_charges: z.number().min(0).default(0),
  credits: z.number().min(0).default(0),
  condemnations: z.number().min(0).default(0),
  adjustments: z.number().min(0).default(0),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  // Only SUPERVISOR and ADMIN can save reconciliation adjustments
  if (user.role !== "SUPERVISOR" && user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      data: { code: "INSUFFICIENT_PERMISSIONS" },
    });
  }

  const { periodId, locationId, back_charges, credits, condemnations, adjustments } =
    bodySchema.parse(await readBody(event));

  // Check period is OPEN
  const period = await prisma.period.findUnique({ where: { id: periodId } });
  if (period.status !== "OPEN") {
    throw createError({
      statusCode: 400,
      data: { code: "PERIOD_CLOSED" },
    });
  }

  // Auto-calculate stock values from transactions
  const openingStock = await getOpeningStock(previousPeriod, locationId);
  const receipts = await sumDeliveries(periodId, locationId);
  const transfersIn = await sumTransfersIn(period, locationId);
  const transfersOut = await sumTransfersOut(period, locationId);
  const closingStock = await sumLocationStock(locationId);

  // Auto-calculate NCR credits and losses from NCR status
  const ncrSummary = await getAllNCRSummaryForPeriod(periodId, locationId);
  const ncrCredits = ncrSummary.credited.total;  // CREDITED or RESOLVED+CREDIT
  const ncrLosses = ncrSummary.losses.total;     // REJECTED or RESOLVED+LOSS

  // Upsert reconciliation record
  const reconciliation = await prisma.reconciliation.upsert({
    where: {
      period_id_location_id: { period_id: periodId, location_id: locationId },
    },
    create: {
      period_id: periodId,
      location_id: locationId,
      opening_stock: openingStock,
      receipts: receipts,
      transfers_in: transfersIn,
      transfers_out: transfersOut,
      closing_stock: closingStock,
      back_charges: new Decimal(back_charges),
      credits: new Decimal(credits),
      condemnations: new Decimal(condemnations),
      adjustments: new Decimal(adjustments),
      ncr_credits: new Decimal(ncrCredits),    // Auto-calculated
      ncr_losses: new Decimal(ncrLosses),      // Auto-calculated
    },
    update: { /* same fields */ },
  });

  return { success: true, reconciliation };
});`,

  consolidatedViewApi: `// Consolidated Reconciliation View
// File: server/api/reconciliations/consolidated.get.ts

/**
 * GET /api/reconciliations/consolidated?periodId=xxx
 *
 * Returns reconciliations for ALL locations in a period:
 * - Individual reconciliations per location
 * - Consumption and manday cost calculations
 * - Grand totals aggregated across all locations
 *
 * Permissions: SUPERVISOR/ADMIN only
 */

// OPTIMIZATION: Batched queries for all locations in parallel
const [
  savedReconciliations,
  previousReconciliations,
  deliveryAggregates,
  transfersInAggregates,
  transfersOutAggregates,
  issueAggregates,
  locationStocks,
  pobEntries,
] = await Promise.all([
  prisma.reconciliation.findMany({ where: { period_id: periodId } }),
  prisma.reconciliation.findMany({ where: { period_id: previousPeriod.id } }),
  prisma.delivery.groupBy({ by: ["location_id"], _sum: { total_amount: true } }),
  prisma.transfer.groupBy({ by: ["to_location_id"], _sum: { total_value: true } }),
  prisma.transfer.groupBy({ by: ["from_location_id"], _sum: { total_value: true } }),
  prisma.issue.groupBy({ by: ["location_id"], _sum: { total_value: true } }),
  prisma.locationStock.findMany({ where: { location_id: { in: locationIds } } }),
  prisma.pOB.findMany({ where: { period_id: periodId } }),
]);

// Build lookup maps for O(1) access
const preFetchedData = {
  savedReconciliations: new Map(savedReconciliations.map(r => [r.location_id, r])),
  deliveryTotals: new Map(deliveryAggregates.map(d => [d.location_id, d._sum.total_amount])),
  // ... more maps
};

// Process each location using pre-fetched data (no additional queries)
const locationReconciliations = locations.map((location) => {
  const savedRec = preFetchedData.savedReconciliations.get(location.id);
  // Use saved data or auto-calculate from transactions
  // ...
});

return {
  period: { id, name, start_date, end_date, status },
  locations: locationReconciliations,
  grand_totals: { /* aggregated totals */ },
};`,

  autoCalculation: `// Auto-Calculation Logic
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                    AUTO-CALCULATION FLOW                                     │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// When no saved reconciliation exists, values are auto-calculated:
//
// 1. OPENING STOCK
// ────────────────
// Source: Previous period's closing_stock from Reconciliation table
// If no previous period: Default to 0
//
// 2. RECEIPTS
// ───────────
// Source: Sum of all posted deliveries for location in period
// Query: SUM(delivery.total_amount) WHERE period_id AND location_id
//
// 3. TRANSFERS IN
// ───────────────
// Source: Sum of completed transfers TO this location in period
// Query: SUM(transfer.total_value) WHERE to_location_id AND status = COMPLETED
//
// 4. TRANSFERS OUT
// ────────────────
// Source: Sum of completed transfers FROM this location in period
// Query: SUM(transfer.total_value) WHERE from_location_id AND status = COMPLETED
//
// 5. ISSUES
// ─────────
// Source: Sum of all issues for location in period
// Query: SUM(issue.total_value) WHERE period_id AND location_id
//
// 6. CLOSING STOCK
// ────────────────
// Source: Current LocationStock values (on_hand × WAC) for all items
// Query: SUM(location_stock.on_hand * location_stock.wac) WHERE location_id
//
// 7. ADJUSTMENTS
// ──────────────
// Default: All zero (back_charges, credits, condemnations, adjustments)
// User must manually enter adjustment values
//
// Note: Auto-calculated reconciliations are marked with is_auto_calculated: true`,

  reconciliationReport: `// Reconciliation Report API
// File: server/api/reports/reconciliation.get.ts

/**
 * GET /api/reports/reconciliation?periodId=xxx&locationId=xxx
 *
 * Generate reconciliation report for management
 *
 * Features:
 * - Full stock movement data
 * - Consumption analysis per location
 * - Manday costs from POB data
 * - Grand totals across all locations
 *
 * Permissions:
 * - OPERATOR: Only assigned locations
 * - SUPERVISOR/ADMIN: All locations
 */

interface LocationReconciliationSummary {
  location_id: string;
  location_code: string;
  location_name: string;
  location_type: string;
  reconciliation: {
    opening_stock: number;
    receipts: number;
    transfers_in: number;
    transfers_out: number;
    issues: number;
    closing_stock: number;
    adjustments: number;
    back_charges: number;
    credits: number;
    condemnations: number;
  };
  calculations: {
    consumption: number;
    total_adjustments: number;
    total_mandays: number;
    manday_cost: number | null;
  };
  is_saved: boolean;
}

// Response includes grand totals
return {
  report_type: "reconciliation",
  generated_at: new Date().toISOString(),
  generated_by: { id: user.id, username: user.username },
  period: { id, name, start_date, end_date, status },
  locations: locationSummaries,
  grand_totals: {
    opening_stock,
    receipts,
    transfers_in,
    transfers_out,
    issues,
    closing_stock,
    consumption,
    total_mandays,
    average_manday_cost,
  },
};`,

  frontendComponents: `// Frontend Components for Reconciliation (IMPLEMENTED)

// 1. ReconciliationSummary Component
// File: app/components/reconciliation/ReconciliationSummary.vue
// Displays stock movement and consumption analysis

<template>
  <div class="space-y-3">
    <!-- Stock Movement Summary -->
    <UCard>
      <template #header>
        <h3>Stock Movement</h3>
      </template>
      <div class="grid grid-cols-3 gap-6">
        <div>
          <h4>Opening Stock</h4>
          <p>{{ formatCurrency(reconciliation.opening_stock) }}</p>
        </div>
        <div>
          <h4>Receipts</h4>
          <p class="text-success">{{ formatCurrency(reconciliation.receipts) }}</p>
        </div>
        <!-- ... transfers_in, transfers_out, issues, closing_stock -->
      </div>
    </UCard>

    <!-- Consumption Analysis -->
    <UCard>
      <template #header>
        <h3>Consumption Analysis</h3>
      </template>
      <div class="grid grid-cols-3 gap-6">
        <div>
          <h4>Total Consumption</h4>
          <p class="text-primary">{{ formatCurrency(calculations.consumption) }}</p>
        </div>
        <div>
          <h4>Total Mandays</h4>
          <p>{{ calculations.total_mandays.toLocaleString() }}</p>
        </div>
        <div>
          <h4>Manday Cost</h4>
          <p class="text-success">{{ formatCurrency(calculations.manday_cost) }}</p>
        </div>
      </div>
    </UCard>
  </div>
</template>

// 2. AdjustmentsForm Component
// File: app/components/reconciliation/AdjustmentsForm.vue
// Form for entering adjustment values

<template>
  <UCard>
    <template #header>
      <h3>Adjustments</h3>
    </template>
    <div class="grid grid-cols-3 gap-6">
      <UFormField label="Back-charges (SAR)">
        <UInput v-model.number="formValues.back_charges" type="number" min="0" />
      </UFormField>
      <UFormField label="Credits Due (SAR)">
        <UInput v-model.number="formValues.credits" type="number" min="0" />
      </UFormField>
      <UFormField label="Condemnations (SAR)">
        <UInput v-model.number="formValues.condemnations" type="number" min="0" />
      </UFormField>
      <UFormField label="Other Adjustments (SAR)">
        <UInput v-model.number="formValues.adjustments" type="number" min="0" />
      </UFormField>
    </div>
    <UButton @click="emit('save', formValues)">
      {{ isAutoCalculated ? 'Confirm Reconciliation' : 'Save Adjustments' }}
    </UButton>
  </UCard>
</template>`,

  cacheInvalidation: `// Cache Invalidation for Reconciliations
// File: app/composables/useCache.ts

// useSmartCacheInvalidation composable includes:
async function afterReconciliation(locationId?: string) {
  const cache = useCache();

  // Invalidate reconciliation-related caches
  cache.invalidateDashboard(locationId);

  // If specific location, only invalidate that location's data
  if (locationId) {
    cache.invalidateStock(locationId);
  } else {
    // Invalidate all stock caches for consolidated view
    cache.invalidateStock();
  }

  // Refresh period data (reconciliation affects period status)
  cache.invalidatePeriods();
}

// Usage in components:
async function saveAdjustments(values) {
  const { afterReconciliation } = useSmartCacheInvalidation();

  const result = await $fetch("/api/reconciliations", {
    method: "POST",
    body: {
      periodId: currentPeriod.value.id,
      locationId: activeLocation.value.id,
      ...values,
    },
  });

  // Invalidate caches after successful save
  await afterReconciliation(activeLocation.value.id);

  // Refresh displayed data
  await refresh();

  return result;
}`,

  periodCloseIntegration: `// Reconciliation & Period Close Integration
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │              RECONCILIATION IN PERIOD CLOSE WORKFLOW                         │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// Period Close Flow:
// ─────────────────
// 1. Period is OPEN
// 2. Users complete all transactions (deliveries, issues, transfers)
// 3. Supervisors review and save reconciliation adjustments per location
// 4. Location is marked READY (PeriodLocation.status = READY)
// 5. When ALL locations are READY, period becomes PENDING_CLOSE
// 6. Admin approves period close
// 7. Period moves to CLOSED, snapshots are captured
//
// Reconciliation Requirements:
// ───────────────────────────
// • Reconciliation must be CONFIRMED (saved) before marking location READY
// • Auto-calculated reconciliations require explicit confirmation
// • Adjustments cannot be modified after period is CLOSED
//
// Snapshot Capture:
// ─────────────────
// When period closes, PeriodLocation captures:
// - opening_value: From reconciliation.opening_stock
// - closing_value: From reconciliation.closing_stock
// - snapshot_data: JSON blob with full reconciliation details
//
// Roll-Forward:
// ─────────────
// When new period is created:
// - closing_value of previous period → opening_stock of new reconciliation
// - Ensures continuity between periods
//
// Validation in Period Close:
// ───────────────────────────
// Before marking location READY:
// - Verify reconciliation exists for location
// - Check all open NCRs are resolved (optional)
// - Validate stock counts match system (optional physical count)`,

  errorCodes: `// Reconciliation-Related Error Codes
// Used in API responses for specific error handling

// Validation Errors (400)
VALIDATION_ERROR             // Invalid request data (Zod validation failed)
PERIOD_CLOSED                // Cannot save adjustments to closed period
NEGATIVE_VALUE               // Adjustment values must be non-negative

// Authorization Errors (401, 403)
NOT_AUTHENTICATED            // User not logged in
INSUFFICIENT_PERMISSIONS     // Only SUPERVISOR/ADMIN can save reconciliations
LOCATION_ACCESS_DENIED       // User cannot access location (report endpoint)

// Not Found Errors (404)
PERIOD_NOT_FOUND             // Period ID doesn't exist
LOCATION_NOT_FOUND           // Location ID doesn't exist
RECONCILIATION_NOT_FOUND     // No reconciliation for period/location

// Internal Errors (500)
INTERNAL_ERROR               // Unexpected server error

// Example error response:
{
  "statusCode": 403,
  "statusMessage": "Forbidden",
  "data": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Only supervisors and admins can save reconciliation adjustments"
  }
}`,

  businessRules: `// Reconciliation Business Rules Summary
//
// 1. Calculation Rules
// ────────────────────
// • Consumption = Opening + Receipts + TransfersIn - TransfersOut - Closing + Adjustments
// • MandayCost = Consumption / TotalMandays
// • All values rounded to 2 decimal places (currency)
//
// 2. Opening Stock
// ────────────────
// • Sourced from previous period's closing_stock
// • First period: Opening stock is 0 or manual entry
// • Cannot be manually modified (system-calculated)
//
// 3. Closing Stock
// ────────────────
// • System-calculated: SUM(on_hand × WAC) for all items at location
// • Updates in real-time as stock changes
// • Cannot be manually modified
//
// 4. Adjustments
// ──────────────
// • Back-charges: Adds to consumption (supplier owes us)
// • Credits: Reduces consumption (we expect refund)
// • Condemnations: Reduces consumption (written off)
// • Other: Can be positive or negative
// • All adjustment values must be >= 0
//
// 5. Permission Rules
// ───────────────────
// • OPERATOR: Can view reports for assigned locations only
// • SUPERVISOR: Can view all, can save adjustments, can mark READY
// • ADMIN: Full access, can approve period close
//
// 6. Period Rules
// ───────────────
// • Can only save adjustments when period is OPEN
// • Reconciliation must be confirmed before period close
// • Cannot modify after period is CLOSED
// • Roll-forward carries closing to next opening
//
// 7. Auto-Calculation
// ───────────────────
// • If no saved reconciliation, values are auto-calculated
// • Auto-calculated records marked with is_auto_calculated: true
// • Must be confirmed (saved) to enable period close
//
// 8. Mandays Integration
// ──────────────────────
// • Mandays come from POB (Personnel On Board) entries
// • TotalMandays = SUM(crew_count + extra_count) for period
// • If no POB entries, manday_cost is null
//
// 9. Audit Trail
// ──────────────
// • last_updated: Timestamp of last modification
// • Reconciliation linked to period and location
// • Changes tracked via period close snapshots`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Reconciliation</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Period-end reconciliation with consumption calculations, adjustments, and manday cost
        analysis
      </p>
    </div>

    <!-- Reconciliation Model Section -->
    <section
      id="dev-section-reconciliation-model"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('reconciliation-model')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-calculator" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Reconciliation Model</span>
        </span>
        <UIcon
          :name="
            isExpanded('reconciliation-model')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('reconciliation-model')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The Reconciliation model stores period-end stock movement data per location. It captures
          opening stock, all movements during the period, closing stock, and adjustment values for
          consumption calculation.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Reconciliation Model Schema
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.reconciliationModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key Fields</h4>
          <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">opening_stock</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                From previous period's closing stock (auto-calculated)
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="success" variant="soft" size="xs">receipts</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Sum of all posted deliveries (auto-calculated)
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="success" variant="soft" size="xs">transfers_in</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Completed transfers TO this location
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="error" variant="soft" size="xs">transfers_out</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Completed transfers FROM this location
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="error" variant="soft" size="xs">issues</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Sum of all stock issues (consumption)
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">closing_stock</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Current stock value (on_hand × WAC)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Consumption Formula Section -->
    <section
      id="dev-section-consumption-formula"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('consumption-formula')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-variable" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Consumption Formula</span>
        </span>
        <UIcon
          :name="
            isExpanded('consumption-formula')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('consumption-formula')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Consumption represents the actual stock used during the period. It's calculated from stock
          movements and adjusted for back-charges, credits, and condemnations.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Consumption Calculation
          </h4>
          <DeveloperCodeBlock :code="codeExamples.consumptionFormula" language="plaintext" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Manday Cost Formula</h4>
          <DeveloperCodeBlock :code="codeExamples.mandayCostFormula" language="plaintext" />
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Key KPI:</strong>
              Manday cost (cost per person per day) is a critical efficiency metric. Lower manday
              cost indicates better kitchen/store efficiency. Target values help with budget
              planning.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Adjustment Types Section -->
    <section
      id="dev-section-adjustment-types"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('adjustment-types')"
      >
        <span class="flex items-center gap-3">
          <UIcon
            name="i-heroicons-adjustments-horizontal"
            class="text-xl text-[var(--ui-primary)]"
          />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Adjustment Types</span>
        </span>
        <UIcon
          :name="
            isExpanded('adjustment-types') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('adjustment-types')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Adjustments modify the consumption calculation to account for back-charges, credits,
          condemnations, and other corrections. Each type has a specific impact on the final
          consumption value.
        </p>

        <div>
          <DeveloperCodeBlock :code="codeExamples.adjustmentTypes" language="plaintext" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Adjustment Categories</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-success)]/30 bg-[var(--ui-bg)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="success" variant="soft">Back-charges</UBadge>
                <span class="text-xs text-[var(--ui-success)]">+ Adds</span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Amounts charged back to suppliers for damaged goods, short delivery, or quality
                issues. Increases consumption.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="error" variant="soft">Credits Due</UBadge>
                <span class="text-xs text-[var(--ui-error)]">- Reduces</span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Credits expected from suppliers (price adjustments, refunds). Reduces consumption.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="error" variant="soft">Condemnations</UBadge>
                <span class="text-xs text-[var(--ui-error)]">- Reduces</span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Value of condemned/spoiled stock (expired items, quality failures). Reduces
                consumption as it's written off.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-neutral)]/30 bg-[var(--ui-bg)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="neutral" variant="soft">Other Adjustments</UBadge>
                <span class="text-xs text-[var(--ui-text-muted)]">+/- Varies</span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Miscellaneous adjustments (inventory corrections, count variances). Can be positive
                or negative.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- NCR Integration Section -->
    <section
      id="dev-section-ncr-integration"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('ncr-integration')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-text" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">NCR Integration</span>
        </span>
        <UIcon
          :name="
            isExpanded('ncr-integration') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('ncr-integration')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          NCRs (Non-Conformance Reports) now directly impact reconciliation calculations. Credits
          from resolved NCRs reduce consumption, while losses increase consumption as unrecovered
          costs absorbed by the business.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            NCR Status to Reconciliation Mapping
          </h4>
          <DeveloperCodeBlock :code="codeExamples.ncrIntegration" language="plaintext" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">
            NCR Impact on Reconciliation
          </h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-success)]/30 bg-[var(--ui-bg)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="success" variant="soft">ncr_credits</UBadge>
                <span class="text-xs text-[var(--ui-success)]">- Reduces consumption</span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Sum of CREDITED NCRs + RESOLVED with CREDIT impact. Money recovered from suppliers.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="error" variant="soft">ncr_losses</UBadge>
                <span class="text-xs text-[var(--ui-error)]">+ Increases consumption</span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Sum of REJECTED NCRs + RESOLVED with LOSS impact. Unrecovered costs absorbed.
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Additional NCR Categories</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="info" variant="soft">Pending Credits</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                NCRs with SENT status. Displayed as informational but don't affect calculation until
                supplier responds.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="warning" variant="soft">Open NCRs Warning</UBadge>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                NCRs with OPEN status trigger non-blocking warning during period close. Recommend
                resolving first.
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Auto-Calculation:</strong>
              When saving a reconciliation, ncr_credits and ncr_losses are automatically calculated
              from current NCR statuses using the
              <code class="code-inline">getAllNCRSummaryForPeriod()</code>
              utility.
            </span>
          </p>
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>OpenNCRWarning Component:</strong>
              The
              <code class="code-inline">app/components/reconciliation/OpenNCRWarning.vue</code>
              component displays a collapsible warning grouped by location when unresolved NCRs
              exist during period close.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Auto-Calculation Section -->
    <section
      id="dev-section-auto-calculation"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('auto-calculation')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-cpu-chip" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Auto-Calculation</span>
        </span>
        <UIcon
          :name="
            isExpanded('auto-calculation') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('auto-calculation')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          When no saved reconciliation exists, values are automatically calculated from transaction
          data. This provides real-time visibility into stock movements without requiring manual
          data entry.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Auto-Calculation Flow</h4>
          <DeveloperCodeBlock :code="codeExamples.autoCalculation" language="plaintext" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Calculation Utility</h4>
          <DeveloperCodeBlock
            :code="codeExamples.calculateConsumptionUtil"
            language="typescript"
            filename="server/utils/reconciliation.ts"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Confirmation Required:</strong>
              Auto-calculated reconciliations must be explicitly confirmed (saved) before a location
              can be marked READY for period close.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Consolidated View Section -->
    <section
      id="dev-section-consolidated-view"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('consolidated-view')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-chart-bar-square" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Consolidated View</span>
        </span>
        <UIcon
          :name="
            isExpanded('consolidated-view') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('consolidated-view')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The consolidated view aggregates reconciliation data across all locations for management
          reporting. It shows individual location summaries plus grand totals and average manday
          cost.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Consolidated API (Optimized)
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.consolidatedViewApi"
            language="typescript"
            filename="server/api/reconciliations/consolidated.get.ts"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Response Structure</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-[var(--ui-border)]">
                  <th class="px-2 py-2 text-left text-[var(--ui-text-muted)]">Field</th>
                  <th class="px-2 py-2 text-left text-[var(--ui-text-muted)]">Description</th>
                </tr>
              </thead>
              <tbody class="text-[var(--ui-text)]">
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2 font-mono text-xs">period</td>
                  <td class="px-2 py-2">Period info (id, name, dates, status)</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2 font-mono text-xs">locations[]</td>
                  <td class="px-2 py-2">Per-location reconciliation with calculations</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2 font-mono text-xs">grand_totals</td>
                  <td class="px-2 py-2">Aggregated totals across all locations</td>
                </tr>
                <tr>
                  <td class="px-2 py-2 font-mono text-xs">summary</td>
                  <td class="px-2 py-2">Count of saved vs auto-calculated locations</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- Reconciliation Report Section -->
    <section
      id="dev-section-reconciliation-report"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('reconciliation-report')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-chart-bar" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Reconciliation Report</span>
        </span>
        <UIcon
          :name="
            isExpanded('reconciliation-report')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('reconciliation-report')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The reconciliation report API provides formatted data for management reports. It respects
          role-based access and can filter by location.
        </p>

        <div>
          <DeveloperCodeBlock
            :code="codeExamples.reconciliationReport"
            language="typescript"
            filename="server/api/reports/reconciliation.get.ts"
          />
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
          API endpoints for reconciliation operations and frontend components for displaying and
          editing reconciliation data.
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
                  <td class="px-2 py-2 font-mono text-xs">/api/reconciliations</td>
                  <td class="px-2 py-2">Save/update adjustments</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="info" variant="soft" size="xs">GET</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/reconciliations/consolidated</td>
                  <td class="px-2 py-2">All locations for period</td>
                </tr>
                <tr>
                  <td class="px-2 py-2">
                    <UBadge color="info" variant="soft" size="xs">GET</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/reports/reconciliation</td>
                  <td class="px-2 py-2">Generate report (filterable)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Save Adjustments API</h4>
          <DeveloperCodeBlock
            :code="codeExamples.saveAdjustmentsApi"
            language="typescript"
            filename="server/api/reconciliations/index.post.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Frontend Components</h4>
          <DeveloperCodeBlock :code="codeExamples.frontendComponents" language="vue" />
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

    <!-- Period Close Integration Section -->
    <section
      id="dev-section-period-close-integration"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('period-close-integration')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-calendar-days" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Period Close Integration
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('period-close-integration')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('period-close-integration')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Reconciliation is a critical step in the period close workflow. Locations must have
          confirmed reconciliations before being marked READY for close.
        </p>

        <div>
          <DeveloperCodeBlock :code="codeExamples.periodCloseIntegration" language="plaintext" />
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Important:</strong>
              Once a period is CLOSED, reconciliation data cannot be modified. The closing values
              are captured in PeriodLocation snapshots and used as opening values for the next
              period.
            </span>
          </p>
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
          Summary of all business rules governing reconciliation calculations, adjustments, and
          period close integration.
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
                <strong>Opening stock auto-calculated</strong>
                - From previous period's closing stock
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Closing stock is real-time</strong>
                - Current inventory × WAC
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Adjustments must be non-negative</strong>
                - Validation enforced
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Only SUPERVISOR/ADMIN can save</strong>
                - Permission enforced
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Period must be OPEN to modify</strong>
                - CLOSED periods are immutable
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Confirmation required before period close</strong>
                - Auto-calc must be saved
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
