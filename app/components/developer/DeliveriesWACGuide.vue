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
  deliveryModel: `// Delivery Model - Prisma Schema
// File: prisma/schema.prisma

model Delivery {
  id             String         @id @default(uuid()) @db.Uuid
  delivery_no    String         @unique @db.VarChar(50)
  period_id      String         @db.Uuid
  location_id    String         @db.Uuid
  supplier_id    String         @db.Uuid
  po_id          String?        @db.Uuid
  invoice_no     String?        @db.VarChar(100)
  delivery_note  String?
  delivery_date  DateTime       @db.Date
  total_amount   Decimal        @default(0) @db.Decimal(15, 2)
  has_variance   Boolean        @default(false)
  status         DeliveryStatus @default(DRAFT)
  created_by     String         @db.Uuid
  posted_at      DateTime?      @db.Timestamptz(6)
  created_at     DateTime       @default(now()) @db.Timestamptz(6)
  updated_at     DateTime       @updatedAt @db.Timestamptz(6)

  // Relations
  creator        User           @relation(...)
  location       Location       @relation(...)
  period         Period         @relation(...)
  po             PO?            @relation(...)
  supplier       Supplier       @relation(...)
  delivery_lines DeliveryLine[]
  ncrs           NCR[]

  @@index([period_id, location_id])
  @@index([location_id, status])
  @@index([has_variance])
  @@map("deliveries")
}

// Delivery Status Enum
enum DeliveryStatus {
  DRAFT   // Being prepared, no stock impact
  POSTED  // Finalized, stock updated, NCRs generated
}`,

  deliveryLineModel: `// DeliveryLine Model - Individual Items in Delivery
// File: prisma/schema.prisma

model DeliveryLine {
  id             String   @id @default(uuid()) @db.Uuid
  delivery_id    String   @db.Uuid
  item_id        String   @db.Uuid
  quantity       Decimal  @db.Decimal(15, 4)
  unit_price     Decimal  @db.Decimal(15, 4)   // Actual invoice price
  period_price   Decimal  @db.Decimal(15, 4)   // Expected price (from ItemPrice)
  price_variance Decimal  @default(0) @db.Decimal(15, 4)
  line_value     Decimal  @db.Decimal(15, 2)   // quantity × unit_price
  ncr_id         String?  @db.Uuid

  // Relations
  delivery       Delivery @relation(...)
  item           Item     @relation(...)
  ncrs           NCR[]

  @@index([delivery_id])
  @@index([item_id])
  @@map("delivery_lines")
}

// Key Fields:
// - unit_price: What the supplier actually charged
// - period_price: What we expected to pay (locked at period start)
// - price_variance: unit_price - period_price (auto-calculated)`,

  deliveryDataFlow: `// Delivery Data Flow Diagram
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                           DELIVERY CREATION FLOW                             │
// └─────────────────────────────────────────────────────────────────────────────┘
//
//  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────────────────┐
//  │   DRAFT     │────►│   POSTED    │────►│     STOCK & WAC UPDATED         │
//  │  (Editable) │     │ (Finalized) │     │                                 │
//  └─────────────┘     └─────────────┘     └─────────────────────────────────┘
//        │                    │                         │
//        │                    │                         │
//        ▼                    ▼                         ▼
//  • No stock impact     • Stock updated          • LocationStock.on_hand ↑
//  • Can edit/delete     • WAC recalculated       • LocationStock.wac recalc
//  • invoice_no optional • invoice_no required    • NCR if price variance
//  • Period not required • Period must be OPEN    • has_variance flag set
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                         POSTING TRIGGERS                                     │
// └─────────────────────────────────────────────────────────────────────────────┘
//
//  For each DeliveryLine:
//  ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
//  │  Get Current      │────►│  Calculate New    │────►│  Update Location  │
//  │  LocationStock    │     │  WAC              │     │  Stock            │
//  └───────────────────┘     └───────────────────┘     └───────────────────┘
//           │                         │                         │
//           │                         │                         │
//           ▼                         ▼                         ▼
//  • on_hand quantity          • WAC formula              • Upsert stock
//  • current WAC               • (oldVal + newVal)        • increment on_hand
//                              •  / totalQty              • update WAC`,

  wacCalculationUtil: `// WAC Calculation Utility
// File: server/utils/wac.ts

/**
 * Result of WAC calculation
 */
export interface WACCalculationResult {
  newWAC: number;           // Newly calculated WAC
  previousWAC: number;      // WAC before this receipt
  newQuantity: number;      // Total quantity after receipt
  newValue: number;         // Total value (newQuantity × newWAC)
  currentValue: number;     // Stock value before receipt
  receiptValue: number;     // Value of this receipt
}

/**
 * Calculate Weighted Average Cost (WAC)
 *
 * Formula:
 * newWAC = (currentQty × currentWAC + receivedQty × receiptPrice)
 *        / (currentQty + receivedQty)
 *
 * Example:
 * Current stock: 100 KG @ SAR 10.00/KG = SAR 1,000.00
 * New receipt:    50 KG @ SAR 12.00/KG = SAR 600.00
 * New WAC: (1000 + 600) / (100 + 50) = SAR 10.67/KG
 */
export function calculateWAC(
  currentQty: number,
  currentWAC: number,
  receivedQty: number,
  receiptPrice: number
): WACCalculationResult {
  // Input validation
  if (currentQty < 0) throw new Error("currentQty cannot be negative");
  if (currentWAC < 0) throw new Error("currentWAC cannot be negative");
  if (receivedQty <= 0) throw new Error("receivedQty must be > 0");
  if (receiptPrice < 0) throw new Error("receiptPrice cannot be negative");

  // Calculate values
  const currentValue = currentQty * currentWAC;
  const receiptValue = receivedQty * receiptPrice;
  const newQuantity = currentQty + receivedQty;

  // Calculate new WAC (first receipt = receipt price)
  const newWAC = newQuantity > 0
    ? (currentValue + receiptValue) / newQuantity
    : 0;

  // Round to 4 decimal places (database precision)
  return {
    newWAC: Math.round(newWAC * 10000) / 10000,
    previousWAC: Math.round(currentWAC * 10000) / 10000,
    newQuantity: Math.round(newQuantity * 10000) / 10000,
    newValue: Math.round((newQuantity * newWAC) * 100) / 100,
    currentValue: Math.round(currentValue * 100) / 100,
    receiptValue: Math.round(receiptValue * 100) / 100,
  };
}`,

  wacDiagram: `// WAC Calculation Visual
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                     WEIGHTED AVERAGE COST (WAC)                              │
// └─────────────────────────────────────────────────────────────────────────────┘
//
//         BEFORE DELIVERY                    AFTER DELIVERY
//  ┌──────────────────────────┐      ┌──────────────────────────┐
//  │    LocationStock         │      │    LocationStock         │
//  │  ─────────────────────   │      │  ─────────────────────   │
//  │  item: Rice 5kg          │      │  item: Rice 5kg          │
//  │  on_hand: 100 KG         │─────►│  on_hand: 150 KG         │
//  │  wac: SAR 10.00          │      │  wac: SAR 10.67          │
//  │  value: SAR 1,000.00     │      │  value: SAR 1,600.00     │
//  └──────────────────────────┘      └──────────────────────────┘
//                │
//                │  + Receipt: 50 KG @ SAR 12.00
//                │            = SAR 600.00
//                │
//                ▼
//        ┌───────────────────────────────────────┐
//        │  newWAC = (1000 + 600) / (100 + 50)  │
//        │        = 1600 / 150                   │
//        │        = SAR 10.67/KG                 │
//        └───────────────────────────────────────┘
//
// Key Rules:
// • Deliveries UPDATE WAC (recalculate from new receipts)
// • Issues DEDUCT at current WAC (no recalculation)
// • Transfers MOVE stock at current WAC from source`,

  priceVarianceUtil: `// Price Variance Detection Utility
// File: server/utils/priceVariance.ts

/**
 * Price variance detection result
 */
export interface PriceVarianceResult {
  hasVariance: boolean;      // Any price difference
  variance: number;          // unit_price - period_price
  variancePercent: number;   // Percentage variance
  varianceAmount: number;    // variance × quantity
  actualPrice: number;       // Invoice price
  expectedPrice: number;     // Period-locked price
  exceedsThreshold: boolean; // Triggers NCR creation
}

/**
 * Check if a delivery line has a price variance
 *
 * Compares actual delivery price with period-locked price.
 * ANY variance triggers NCR creation (threshold = 0).
 */
export function checkPriceVariance(
  unitPrice: number,
  periodPrice: number,
  quantity: number
): PriceVarianceResult {
  const variance = unitPrice - periodPrice;
  const variancePercent = periodPrice > 0
    ? (variance / periodPrice) * 100
    : (unitPrice > 0 ? 100 : 0);
  const varianceAmount = variance * quantity;
  const hasVariance = variance !== 0;

  return {
    hasVariance,
    variance: Number(variance.toFixed(4)),
    variancePercent: Number(variancePercent.toFixed(2)),
    varianceAmount: Number(varianceAmount.toFixed(2)),
    actualPrice: unitPrice,
    expectedPrice: periodPrice,
    exceedsThreshold: hasVariance, // Any variance triggers NCR
  };
}`,

  priceVarianceDiagram: `// Price Variance Detection Flow
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                         PRICE VARIANCE DETECTION                             │
// └─────────────────────────────────────────────────────────────────────────────┘
//
//  ┌──────────────────┐       ┌──────────────────┐
//  │   ItemPrice      │       │   DeliveryLine   │
//  │  ─────────────── │       │  ─────────────── │
//  │  period_id       │       │  unit_price:     │  Actual supplier
//  │  item_id         │       │  SAR 12.00       │  invoice price
//  │  price:          │───────│  period_price:   │  Copied from
//  │  SAR 10.00       │       │  SAR 10.00       │  ItemPrice
//  │  (locked)        │       │  price_variance: │  Calculated
//  └──────────────────┘       │  SAR 2.00        │
//                             └──────────────────┘
//                                    │
//                                    │ variance ≠ 0
//                                    ▼
//                             ┌──────────────────┐
//                             │      NCR         │
//                             │  ─────────────── │
//                             │  type: PRICE_    │
//                             │       VARIANCE   │
//                             │  auto_generated: │
//                             │       true       │
//                             │  value: SAR 2.00 │
//                             │       × qty      │
//                             │  status: OPEN    │
//                             └──────────────────┘`,

  autoNcrCreation: `// Automatic NCR Creation for Price Variance
// File: server/utils/priceVariance.ts

/**
 * Create an automatic NCR for price variance
 */
export async function createPriceVarianceNCR(
  prisma: any,
  data: PriceVarianceNCRData
) {
  // Generate NCR number: NCR-YYYY-NNN
  const ncrNo = await generateNCRNumber(prisma);

  // Format reason with variance details
  const varianceType = data.variance > 0 ? "increase" : "decrease";
  const variancePercent = (
    (data.variance / data.expectedPrice) * 100
  ).toFixed(2);

  const reason =
    \`Automatic NCR for price variance detected on delivery.\\n\\n\` +
    \`Item: \${data.itemName} (\${data.itemCode})\\n\` +
    \`Quantity: \${data.quantity}\\n\` +
    \`Expected Price (Period): SAR \${data.expectedPrice.toFixed(4)}\\n\` +
    \`Actual Price (Delivery): SAR \${data.actualPrice.toFixed(4)}\\n\` +
    \`Variance: SAR \${data.variance.toFixed(4)} (\${variancePercent}% \${varianceType})\\n\` +
    \`Total Variance Amount: SAR \${data.varianceAmount.toFixed(2)}\`;

  // Create NCR record
  return await prisma.nCR.create({
    data: {
      ncr_no: ncrNo,
      location_id: data.locationId,
      type: "PRICE_VARIANCE",
      auto_generated: true,
      delivery_id: data.deliveryId,
      delivery_line_id: data.deliveryLineId,
      reason,
      quantity: data.quantity,
      value: Math.abs(data.varianceAmount),
      status: "OPEN",
      created_by: data.createdBy,
    },
  });
}`,

  deliveryApiEndpoint: `// Delivery Creation API Endpoint
// File: server/api/locations/[id]/deliveries/index.post.ts

import { z } from "zod";
import { calculateWAC } from "../../../../utils/wac";
import { checkPriceVariance } from "../../../../utils/priceVariance";

// Request body validation schema
const bodySchema = z.object({
  supplier_id: z.string().uuid(),
  po_id: z.string().uuid().nullable().optional(),
  invoice_no: z.string().min(1).nullable().optional(),
  delivery_note: z.string().nullable().optional(),
  delivery_date: z.string(), // ISO date string
  lines: z.array(z.object({
    item_id: z.string().uuid(),
    quantity: z.number().positive(),
    unit_price: z.number().nonnegative(),
  })).min(1),
  status: z.enum(["DRAFT", "POSTED"]).default("DRAFT"),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const locationId = getRouterParam(event, "id");
  const body = await readBody(event);
  const data = bodySchema.parse(body);

  // Validation checks:
  // 1. Location exists and user has access
  // 2. Supplier exists
  // 3. All items exist (and are active if posting)
  // 4. Period is OPEN (if posting)

  // ... validation code ...

  // Create delivery in transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Create delivery header
    const delivery = await tx.delivery.create({
      data: {
        delivery_no: await generateDeliveryNumber(),
        location_id: locationId,
        supplier_id: data.supplier_id,
        period_id: currentPeriod.id,
        status: data.status,
        // ... other fields
      },
    });

    // Process each line
    for (const lineData of data.lines) {
      // Calculate WAC (only when posting)
      const wacResult = calculateWAC(
        currentStock.quantity,
        currentStock.wac,
        lineData.quantity,
        lineData.unit_price
      );

      // Check price variance
      const variance = checkPriceVariance(
        lineData.unit_price,
        periodPrice,
        lineData.quantity
      );

      // Create delivery line
      await tx.deliveryLine.create({...});

      // Update stock (only when posting)
      await tx.locationStock.upsert({
        where: { location_id_item_id: {...} },
        update: {
          on_hand: { increment: lineData.quantity },
          wac: wacResult.newWAC,
        },
        create: {...},
      });

      // Create NCR if variance detected
      if (variance.hasVariance) {
        await createPriceVarianceNCR(tx, {...});
      }
    }

    return { delivery, lines, ncrs };
  });
});`,

  stockUpdateFlow: `// Stock Update on Delivery Receipt
//
// When a delivery is POSTED, stock is updated atomically:
//
// 1. Upsert LocationStock
// ────────────────────────
// If stock record exists:  UPDATE (increment on_hand, update WAC)
// If stock record missing: CREATE (initial stock from this receipt)
//
// await tx.locationStock.upsert({
//   where: {
//     location_id_item_id: {
//       location_id: locationId,
//       item_id: lineData.item_id,
//     },
//   },
//   update: {
//     on_hand: { increment: lineData.quantity },  // Add to existing
//     wac: wacResult.newWAC,                       // Recalculated WAC
//   },
//   create: {
//     location_id: locationId,
//     item_id: lineData.item_id,
//     on_hand: lineData.quantity,                  // Initial quantity
//     wac: wacResult.newWAC,                       // = receipt price
//   },
// });
//
// 2. Transaction Atomicity
// ────────────────────────
// All updates wrapped in \$transaction:
// • If any line fails, entire delivery rolls back
// • No partial stock updates
// • Timeout: 30 seconds for large deliveries`,

  deliveryPostingFlow: `// Delivery Posting Flow
// File: server/api/locations/[id]/deliveries/index.post.ts

// Step 1: Validate Inputs
// ───────────────────────
const isPosting = data.status === "POSTED";

if (isPosting && !data.invoice_no) {
  throw createError({
    statusCode: 400,
    data: { code: "VALIDATION_ERROR", message: "Invoice required" },
  });
}

if (isPosting && !currentPeriod) {
  throw createError({
    statusCode: 400,
    data: { code: "NO_OPEN_PERIOD", message: "No open period" },
  });
}

// Step 2: Batch Fetch Data
// ────────────────────────
const [periodPrices, currentStocks] = await prisma.$transaction([
  prisma.itemPrice.findMany({
    where: { period_id: currentPeriod.id, item_id: { in: itemIds } },
  }),
  prisma.locationStock.findMany({
    where: { location_id: locationId, item_id: { in: itemIds } },
  }),
]);

// Step 3: Process in Transaction
// ──────────────────────────────
await prisma.$transaction(async (tx) => {
  // Create delivery header
  const delivery = await tx.delivery.create({ ... });

  for (const line of data.lines) {
    // a) Calculate WAC
    const wacResult = calculateWAC(current.qty, current.wac, line.qty, line.price);

    // b) Check price variance
    const variance = checkPriceVariance(line.price, periodPrice, line.qty);

    // c) Create delivery line
    await tx.deliveryLine.create({ ... });

    // d) Update stock
    await tx.locationStock.upsert({ ... });

    // e) Create NCR if variance
    if (variance.hasVariance) {
      await tx.nCR.create({ ... });
    }
  }

  // Update delivery totals
  await tx.delivery.update({
    where: { id: delivery.id },
    data: { total_amount, has_variance },
  });
}, { timeout: 30000 });`,

  useDeliveriesComposable: `// Frontend Data Fetching Pattern (Recommended Implementation)
// File: app/composables/useDeliveries.ts (to be created)

export function useDeliveries(locationId: Ref<string | null>) {
  const {
    data: deliveries,
    pending,
    error,
    refresh,
  } = useAsyncData(
    () => \`deliveries-\${locationId.value}\`,
    () => $fetch(\`/api/locations/\${locationId.value}/deliveries\`),
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

  return { deliveries, pending, error, refresh };
}

// Creating a delivery
async function createDelivery(locationId: string, data: CreateDeliveryInput) {
  const response = await $fetch(\`/api/locations/\${locationId}/deliveries\`, {
    method: "POST",
    body: data,
  });

  // Invalidate caches after creation
  const { afterDelivery } = useSmartCacheInvalidation();
  afterDelivery(locationId);

  return response;
}`,

  deliveryFormComponent: `// Delivery Form Component Pattern (Recommended Implementation)
// File: app/components/delivery/DeliveryForm.vue (to be created)

<script setup lang="ts">
import { z } from "zod";

const locationStore = useLocationStore();
const periodStore = usePeriodStore();

// Form state
const isSubmitting = ref(false);
const deliveryData = ref({
  supplier_id: "",
  invoice_no: "",
  delivery_date: new Date().toISOString().split("T")[0],
  lines: [] as DeliveryLine[],
  status: "DRAFT" as "DRAFT" | "POSTED",
});

// Check if can post
const canPost = computed(() => {
  return periodStore.isPeriodOpen && deliveryData.value.invoice_no;
});

// Submit handler
async function handleSubmit() {
  isSubmitting.value = true;
  try {
    const response = await $fetch(
      \`/api/locations/\${locationStore.activeLocationId}/deliveries\`,
      {
        method: "POST",
        body: deliveryData.value,
      }
    );

    // Show success with NCR info if applicable
    if (response.ncrs?.length > 0) {
      useAppToast().showWarning(
        \`Delivery posted. \${response.ncrs.length} price variance(s) detected.\`
      );
    } else {
      useAppToast().showSuccess("Delivery saved successfully.");
    }

    // Invalidate caches
    const { afterDelivery } = useSmartCacheInvalidation();
    afterDelivery(locationStore.activeLocationId!);

  } catch (error) {
    useAppToast().showError("Failed to save delivery.");
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
      color="warning"
      icon="i-heroicons-exclamation-triangle"
      title="Period not open. Delivery will be saved as draft."
    />

    \x3C!-- Supplier Select -->
    \x3CUFormField label="Supplier">
      \x3CUSelect v-model="deliveryData.supplier_id" :items="suppliers" />
    \x3C/UFormField>

    \x3C!-- Line Items -->
    \x3CDeliveryLineItems v-model="deliveryData.lines" />

    \x3C!-- Actions -->
    \x3Cdiv class="flex gap-2">
      \x3CUButton
        type="submit"
        :disabled="isSubmitting"
        :loading="isSubmitting"
        @click="deliveryData.status = 'DRAFT'"
        class="cursor-pointer"
      >
        Save Draft
      \x3C/UButton>
      \x3CUButton
        type="submit"
        color="primary"
        :disabled="!canPost || isSubmitting"
        :loading="isSubmitting"
        @click="deliveryData.status = 'POSTED'"
        class="cursor-pointer"
      >
        Post Delivery
      \x3C/UButton>
    \x3C/div>
  \x3C/form>
\x3C/template>`,

  errorCodes: `// Delivery-Related Error Codes
// Used in API responses for specific error handling

// Validation Errors (400)
VALIDATION_ERROR      // Invalid request data (Zod validation failed)
MISSING_LOCATION_ID   // Location ID not provided in route

// Authorization Errors (401, 403)
NOT_AUTHENTICATED     // User not logged in
LOCATION_ACCESS_DENIED // User cannot access this location

// Not Found Errors (404)
LOCATION_NOT_FOUND    // Location ID doesn't exist
SUPPLIER_NOT_FOUND    // Supplier ID doesn't exist
ITEM_NOT_FOUND        // Item ID doesn't exist

// Business Rule Errors (400)
NO_OPEN_PERIOD        // Cannot post - no period is OPEN
NO_PERIOD_EXISTS      // No period exists at all
INVALID_ITEMS         // Items not found or inactive
PERIOD_CLOSED         // Period is not OPEN for transactions

// Internal Errors (500)
INTERNAL_ERROR        // Unexpected server error

// Example error response:
{
  "statusCode": 400,
  "statusMessage": "Bad Request",
  "data": {
    "code": "NO_OPEN_PERIOD",
    "message": "No open accounting period. Please open a period before posting."
  }
}`,

  businessRules: `// Delivery Business Rules Summary
//
// 1. DRAFT vs POSTED Status
// ─────────────────────────
// DRAFT:
//   • No stock impact
//   • Can be edited or deleted
//   • invoice_no optional
//   • Period not required to be OPEN
//   • Only visible to creator
//
// POSTED:
//   • Stock updated (on_hand incremented)
//   • WAC recalculated
//   • invoice_no required
//   • Period must be OPEN
//   • Cannot be edited or deleted
//   • Price variance NCRs auto-created
//
// 2. Price Variance Rules
// ───────────────────────
// • Compare unit_price (invoice) vs period_price (locked)
// • ANY difference triggers NCR (threshold = 0)
// • NCR has type: PRICE_VARIANCE, auto_generated: true
// • NCR links to delivery and delivery_line
// • Delivery flagged with has_variance: true
//
// 3. WAC Calculation Rules
// ────────────────────────
// • Only recalculated on receipts (deliveries)
// • Issues deduct at current WAC (no recalc)
// • First receipt sets WAC = receipt price
// • Formula: newWAC = (oldValue + newValue) / totalQty
// • Rounded to 4 decimal places
//
// 4. Stock Update Rules
// ─────────────────────
// • Upsert pattern (create if not exists)
// • Atomic within transaction
// • Location-specific (per LocationStock)
// • Never allows negative stock (validated elsewhere)`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Deliveries & WAC</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Receiving inventory, Weighted Average Cost calculation, and price variance detection
      </p>
    </div>

    <!-- Delivery Model Section -->
    <section
      id="dev-section-delivery-model"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('delivery-model')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-truck" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Delivery Model</span>
        </span>
        <UIcon
          :name="
            isExpanded('delivery-model') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('delivery-model')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The Delivery model represents inbound stock from suppliers. Each delivery contains
          multiple line items and tracks price variances, total amounts, and posting status.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Delivery Model</h4>
          <DeveloperCodeBlock
            :code="codeExamples.deliveryModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">DeliveryLine Model</h4>
          <DeveloperCodeBlock
            :code="codeExamples.deliveryLineModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key Fields</h4>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">delivery_no</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Auto-generated: DEL-YYYY-NNN (e.g., DEL-2025-001)
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">has_variance</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                True if any line has price variance (NCR created)
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">unit_price</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Actual invoice price from supplier
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">period_price</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Expected price (locked at period start)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Delivery Data Flow Section -->
    <section
      id="dev-section-delivery-flow"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('delivery-flow')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-path" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Delivery Creation Flow
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('delivery-flow') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('delivery-flow')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Deliveries can be saved as DRAFT (editable, no stock impact) or POSTED (finalized with
          stock and WAC updates).
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Data Flow Diagram</h4>
          <DeveloperCodeBlock :code="codeExamples.deliveryDataFlow" language="plaintext" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">DRAFT vs POSTED</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="neutral" variant="soft">DRAFT</UBadge>
              </div>
              <ul class="space-y-1 text-xs text-[var(--ui-text-muted)]">
                <li>• No stock impact</li>
                <li>• Can be edited or deleted</li>
                <li>• invoice_no optional</li>
                <li>• invoice_no must be unique when provided</li>
                <li>• Period not required to be OPEN</li>
                <li>• Only visible to creator</li>
              </ul>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="success" variant="soft">POSTED</UBadge>
              </div>
              <ul class="space-y-1 text-xs text-[var(--ui-text-muted)]">
                <li>• Stock updated (on_hand ↑)</li>
                <li>• WAC recalculated</li>
                <li>• invoice_no required</li>
                <li>• invoice_no must be unique</li>
                <li>• Period must be OPEN</li>
                <li>• Price variance NCRs created</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- WAC Calculation Section -->
    <section
      id="dev-section-wac-calculation"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('wac-calculation')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-calculator" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Weighted Average Cost (WAC)
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('wac-calculation') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('wac-calculation')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          WAC is recalculated on every delivery by combining current stock value with the new
          receipt value, then dividing by total quantity.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            WAC Calculation Utility
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.wacCalculationUtil"
            language="typescript"
            filename="server/utils/wac.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Visual Example</h4>
          <DeveloperCodeBlock :code="codeExamples.wacDiagram" language="plaintext" />
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Key Rule:</strong>
              Only deliveries recalculate WAC. Issues deduct at current WAC, and transfers move
              stock at source location's WAC.
            </span>
          </p>
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">WAC Formula</h4>
          <div class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-4">
            <code class="text-sm text-[var(--ui-text-highlighted)]">
              newWAC = (currentQty × currentWAC + receivedQty × receiptPrice) / (currentQty +
              receivedQty)
            </code>
          </div>
        </div>
      </div>
    </section>

    <!-- Price Variance Section -->
    <section
      id="dev-section-price-variance"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('price-variance')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-exclamation-triangle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Price Variance Detection
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('price-variance') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('price-variance')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          When a delivery price differs from the period-locked price, a Price Variance NCR is
          automatically created.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Price Variance Detection
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.priceVarianceUtil"
            language="typescript"
            filename="server/utils/priceVariance.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Variance Flow Diagram</h4>
          <DeveloperCodeBlock :code="codeExamples.priceVarianceDiagram" language="plaintext" />
        </div>

        <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-error)]">
            <UIcon name="i-heroicons-exclamation-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Critical Business Rule:</strong>
              ANY price difference triggers NCR creation. There is no tolerance threshold - even SAR
              0.01 variance creates an NCR.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Auto-NCR Generation Section -->
    <section
      id="dev-section-auto-ncr"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('auto-ncr')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-text" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Auto-NCR Generation</span>
        </span>
        <UIcon
          :name="isExpanded('auto-ncr') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('auto-ncr')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          NCRs (Non-Conformance Reports) are automatically created when price variance is detected
          during delivery posting.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">NCR Creation Function</h4>
          <DeveloperCodeBlock
            :code="codeExamples.autoNcrCreation"
            language="typescript"
            filename="server/utils/priceVariance.ts"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">
            Auto-Generated NCR Properties
          </h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UBadge color="warning" variant="soft" size="xs">type</UBadge>
              <span>PRICE_VARIANCE (vs MANUAL for user-created NCRs)</span>
            </li>
            <li class="flex items-start gap-2">
              <UBadge color="warning" variant="soft" size="xs">auto_generated</UBadge>
              <span>true (distinguishes from manually created NCRs)</span>
            </li>
            <li class="flex items-start gap-2">
              <UBadge color="warning" variant="soft" size="xs">status</UBadge>
              <span>OPEN (requires resolution before period close)</span>
            </li>
            <li class="flex items-start gap-2">
              <UBadge color="warning" variant="soft" size="xs">delivery_id</UBadge>
              <span>Links to source delivery</span>
            </li>
            <li class="flex items-start gap-2">
              <UBadge color="warning" variant="soft" size="xs">delivery_line_id</UBadge>
              <span>Links to specific line item</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Delivery Posting Flow Section -->
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
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Delivery Posting Flow</span>
        </span>
        <UIcon
          :name="isExpanded('posting-flow') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('posting-flow')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The posting flow validates inputs, fetches required data, and processes all line items
          atomically in a database transaction.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Posting Flow</h4>
          <DeveloperCodeBlock :code="codeExamples.deliveryPostingFlow" language="typescript" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Posting Steps</h4>
          <ol class="list-inside list-decimal space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Validate inputs:</strong>
              Check invoice_no, verify period is OPEN
            </li>
            <li>
              <strong>Batch fetch data:</strong>
              Get period prices and current stock levels
            </li>
            <li>
              <strong>Start transaction:</strong>
              Ensure atomic operations
            </li>
            <li>
              <strong>Create delivery header:</strong>
              Generate delivery_no, set metadata
            </li>
            <li>
              <strong>For each line:</strong>
              Calculate WAC, check variance, create line
            </li>
            <li>
              <strong>Update stock:</strong>
              Upsert LocationStock with new quantity and WAC
            </li>
            <li>
              <strong>Create NCRs:</strong>
              Auto-generate for any price variances
            </li>
            <li>
              <strong>Update totals:</strong>
              Set total_amount and has_variance on delivery
            </li>
          </ol>
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Transaction Timeout:</strong>
              Set to 30 seconds for large deliveries with many line items. If timeout occurs, the
              entire delivery rolls back.
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
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Stock Update on Receipt
          </span>
        </span>
        <UIcon
          :name="isExpanded('stock-update') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('stock-update')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          When a delivery is posted, stock is updated using Prisma's upsert pattern - creating the
          record if it doesn't exist, or updating if it does.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Stock Update Pattern</h4>
          <DeveloperCodeBlock :code="codeExamples.stockUpdateFlow" language="typescript" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Upsert Behavior</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-plus-circle" class="text-[var(--ui-success)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  First Receipt
                </span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Creates new LocationStock record. WAC equals receipt price. on_hand equals received
                quantity.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-arrow-path" class="text-[var(--ui-info)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Subsequent Receipts
                </span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Updates existing record. on_hand incremented. WAC recalculated using formula.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- API Endpoint Section -->
    <section
      id="dev-section-api-endpoint"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('api-endpoint')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-code-bracket" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">API Endpoint</span>
        </span>
        <UIcon
          :name="isExpanded('api-endpoint') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('api-endpoint')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The delivery creation endpoint handles both draft saving and direct posting with all
          business logic.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Endpoint Overview</h4>
          <DeveloperCodeBlock
            :code="codeExamples.deliveryApiEndpoint"
            language="typescript"
            filename="server/api/locations/[id]/deliveries/index.post.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Error Codes</h4>
          <DeveloperCodeBlock :code="codeExamples.errorCodes" language="typescript" />
        </div>
      </div>
    </section>

    <!-- Frontend Integration Section -->
    <section
      id="dev-section-frontend"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('frontend')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-computer-desktop" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Frontend Integration</span>
        </span>
        <UIcon
          :name="isExpanded('frontend') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('frontend')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Recommended patterns for frontend composables and components. The
          <code class="code-inline">afterDelivery()</code>
          function from
          <code class="code-inline">useSmartCacheInvalidation()</code>
          is implemented; the composable and form patterns below are recommended implementations.
        </p>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Note:</strong>
              The
              <code class="code-inline">useDeliveries</code>
              composable and
              <code class="code-inline">DeliveryForm</code>
              component shown below are recommended patterns to be implemented. The API endpoints
              and cache invalidation are already implemented.
            </span>
          </p>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Data Fetching Composable (Pattern)
          </h4>
          <DeveloperCodeBlock :code="codeExamples.useDeliveriesComposable" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Form Component (Pattern)
          </h4>
          <DeveloperCodeBlock :code="codeExamples.deliveryFormComponent" language="vue" />
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Cache Invalidation:</strong>
              Always call
              <code class="code-inline">afterDelivery()</code>
              from
              <code class="code-inline">useSmartCacheInvalidation()</code>
              after creating a delivery to refresh stock and transaction caches.
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
          Summary of all business rules governing deliveries, WAC calculation, and price variance.
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
                <strong>Deliveries update WAC</strong>
                - Recalculated from new receipts
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Issues deduct at current WAC</strong>
                - No recalculation
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>ANY price variance creates NCR</strong>
                - No tolerance threshold
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Posted deliveries are immutable</strong>
                - Cannot edit or delete
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Period must be OPEN</strong>
                - Required for posting
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
