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
  periodModel: `// Period Model - Prisma Schema
// File: prisma/schema.prisma

model Period {
  id               String           @id @default(uuid()) @db.Uuid
  name             String           @db.VarChar(100)
  start_date       DateTime         @db.Date
  end_date         DateTime         @db.Date
  status           PeriodStatus     @default(DRAFT)
  approval_id      String?          @db.Uuid
  created_at       DateTime         @default(now()) @db.Timestamptz(6)
  closed_at        DateTime?        @db.Timestamptz(6)

  // Relations
  deliveries       Delivery[]
  issues           Issue[]
  item_prices      ItemPrice[]
  period_locations PeriodLocation[]
  pobs             POB[]
  prfs             PRF[]
  reconciliations  Reconciliation[]

  @@index([status])
  @@index([start_date, end_date])
  @@map("periods")
}

// Period Status Enum
enum PeriodStatus {
  DRAFT          // Period created, not yet active
  OPEN           // Active accounting period
  PENDING_CLOSE  // All locations ready, awaiting approval
  APPROVED       // Admin approved close
  CLOSED         // Period closed, no more transactions
}`,

  periodLifecycle: `// Period Lifecycle State Machine
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                        PERIOD LIFECYCLE                                  │
// └─────────────────────────────────────────────────────────────────────────┘
//
//   ┌─────────┐     Admin      ┌─────────┐    All Locs     ┌───────────────┐
//   │  DRAFT  │ ─────────────► │  OPEN   │ ──────────────► │ PENDING_CLOSE │
//   └─────────┘   activates    └─────────┘    READY        └───────────────┘
//        │                          │                              │
//        │                          │                              │
//        │        Transactions:     │                              │
//        │        • Deliveries      │                      Admin   │
//        │        • Issues          │                    approves  │
//        │        • Transfers       │                              │
//        │        • NCRs            │                              │
//        │                          │                              ▼
//        │                          │                       ┌───────────┐
//        │                          │                       │ APPROVED  │
//        │                          │                       └───────────┘
//        │                          │                              │
//        └──────────────────────────┼──────────────────────────────┤
//                                   │                              │
//                                   │                        Close │
//                                   │                      process │
//                                   │                              ▼
//                                   │                       ┌─────────┐
//                                   │                       │ CLOSED  │
//                                   │                       └─────────┘
//                                   │                              │
//                                   │                              │
//                                   ▼                              │
//                            ┌─────────────┐                       │
//                            │ Roll-forward├───────────────────────┘
//                            │ New Period  │
//                            └─────────────┘`,

  periodLocationModel: `// PeriodLocation Model - Tracks Per-Location Period Status
// File: prisma/schema.prisma

model PeriodLocation {
  period_id     String               @db.Uuid
  location_id   String               @db.Uuid
  status        PeriodLocationStatus @default(OPEN)
  opening_value Decimal?             @db.Decimal(15, 2)
  closing_value Decimal?             @db.Decimal(15, 2)
  snapshot_id   String?              @db.Uuid
  snapshot_data Json?                // Stores stock snapshot at close
  ready_at      DateTime?            @db.Timestamptz(6)
  closed_at     DateTime?            @db.Timestamptz(6)

  // Relations
  location      Location @relation(...)
  period        Period   @relation(...)

  @@id([period_id, location_id])  // Composite primary key
  @@index([period_id])
  @@index([location_id])
  @@index([status])
  @@index([period_id, status])
  @@map("period_locations")
}

// Per-Location Period Status
enum PeriodLocationStatus {
  OPEN   // Location can post transactions
  READY  // Location marked ready for period close
  CLOSED // Location period closed
}`,

  periodLocationWorkflow: `// PeriodLocation Status Workflow
//
//                    LOCATION PERIOD STATUS
//
//     ┌────────────────────────────────────────────────────┐
//     │                    OPEN                            │
//     │  ─────────────────────────────────────────────     │
//     │  • All transactions allowed                        │
//     │  • Deliveries, Issues, Transfers                   │
//     │  • Reconciliation calculations running             │
//     │  • Stock values updating                           │
//     └────────────────────────────────────────────────────┘
//                           │
//                           │ Supervisor marks
//                           │ location ready
//                           ▼
//     ┌────────────────────────────────────────────────────┐
//     │                   READY                            │
//     │  ─────────────────────────────────────────────     │
//     │  • No more transactions allowed                    │
//     │  • Waiting for all locations to be READY           │
//     │  • Can revert to OPEN if needed                    │
//     │  • ready_at timestamp recorded                     │
//     └────────────────────────────────────────────────────┘
//                           │
//                           │ All locations READY
//                           │ Admin approves period close
//                           ▼
//     ┌────────────────────────────────────────────────────┐
//     │                   CLOSED                           │
//     │  ─────────────────────────────────────────────     │
//     │  • Stock snapshot captured                         │
//     │  • closing_value calculated                        │
//     │  • closed_at timestamp recorded                    │
//     │  • No changes allowed                              │
//     │  • Becomes opening_value for next period           │
//     └────────────────────────────────────────────────────┘`,

  itemPriceModel: `// ItemPrice Model - Period Price Locking
// File: prisma/schema.prisma

model ItemPrice {
  id        String   @id @default(uuid()) @db.Uuid
  item_id   String   @db.Uuid
  period_id String   @db.Uuid
  price     Decimal  @db.Decimal(15, 4)
  currency  String   @default("SAR") @db.VarChar(3)
  set_by    String?  @db.Uuid
  set_at    DateTime @default(now()) @db.Timestamptz(6)

  // Relations
  item      Item     @relation(...)
  period    Period   @relation(...)

  // Unique constraint: One price per item per period
  @@unique([item_id, period_id])
  @@index([period_id])
  @@index([item_id])
  @@map("item_prices")
}

// Key Concept:
// ItemPrice locks the expected price at period start
// DeliveryLine compares actual price vs period price
// Price difference triggers automatic NCR generation`,

  priceLockingMechanism: `// Price Locking Mechanism
//
// 1. Period Opens → Admin locks prices
// 2. Delivery received → Compare delivery price vs locked price
// 3. Variance detected → Auto-generate NCR
//
// ┌──────────────────┐    ┌──────────────────┐
// │   ItemPrice      │    │   DeliveryLine   │
// │  ─────────────   │    │  ─────────────   │
// │  period_price:   │    │  unit_price:     │  Actual supplier
// │  SAR 10.00       │    │  SAR 12.00       │  invoice price
// │                  │    │  period_price:   │
// │  (locked at      │────│  SAR 10.00       │  Copied from
// │   period start)  │    │  price_variance: │  ItemPrice
// │                  │    │  SAR 2.00        │  Calculated diff
// └──────────────────┘    └──────────────────┘
//                                │
//                                │ variance > 0
//                                ▼
//                         ┌──────────────────┐
//                         │      NCR         │
//                         │  ─────────────   │
//                         │  type: PRICE_    │
//                         │       VARIANCE   │
//                         │  auto_generated: │
//                         │       true       │
//                         │  value: SAR 2.00 │
//                         └──────────────────┘`,

  priceVarianceCheck: `// Price Variance Detection
// File: server/utils/priceVariance.ts

interface PriceVarianceResult {
  hasVariance: boolean;
  periodPrice: Decimal;
  actualPrice: Decimal;
  variance: Decimal;
  variancePercent: number;
}

export async function checkPriceVariance(
  itemId: string,
  periodId: string,
  actualPrice: Decimal,
  prisma: PrismaClient
): Promise<PriceVarianceResult> {
  // Get locked period price
  const itemPrice = await prisma.itemPrice.findUnique({
    where: {
      item_id_period_id: {
        item_id: itemId,
        period_id: periodId,
      },
    },
  });

  if (!itemPrice) {
    throw new Error(\`No price locked for item \${itemId} in period \${periodId}\`);
  }

  const periodPrice = itemPrice.price;
  const variance = actualPrice.sub(periodPrice);
  const variancePercent = variance.div(periodPrice).mul(100).toNumber();

  return {
    hasVariance: !variance.equals(0),
    periodPrice,
    actualPrice,
    variance,
    variancePercent,
  };
}

// Usage in delivery posting
const varianceResult = await checkPriceVariance(
  line.item_id,
  delivery.period_id,
  line.unit_price,
  prisma
);

if (varianceResult.hasVariance) {
  // Create auto-generated NCR
  await prisma.nCR.create({
    data: {
      ncr_no: generateNCRNumber(),
      location_id: delivery.location_id,
      type: "PRICE_VARIANCE",
      auto_generated: true,
      delivery_id: delivery.id,
      delivery_line_id: line.id,
      reason: \`Price variance: Expected \${varianceResult.periodPrice}, got \${varianceResult.actualPrice}\`,
      value: varianceResult.variance.mul(line.quantity),
      status: "OPEN",
      created_by: userId,
    },
  });
}`,

  periodStoreInterface: `// Period Store - State Interface
// File: app/stores/period.ts

import { defineStore } from "pinia";
import type { Period } from "~~/shared/types/database";

export interface PeriodState {
  currentPeriod: Period | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheTimeout: number;  // 10 minutes (600000ms)
}

export const usePeriodStore = defineStore("period", {
  state: (): PeriodState => ({
    currentPeriod: null,
    loading: false,
    error: null,
    lastFetched: null,
    cacheTimeout: 10 * 60 * 1000, // 10 minutes
  }),
  // ...
});`,

  periodStoreGetters: `// Period Store - Getters
const periodStore = usePeriodStore();

// Check if there's an active period
periodStore.hasPeriod       // boolean

// Check if current period is open (transactions allowed)
periodStore.isPeriodOpen    // boolean (status === "OPEN")

// Get period name (e.g., "January 2026")
periodStore.periodName      // string

// Get period status
periodStore.periodStatus    // "DRAFT" | "OPEN" | "PENDING_CLOSE" | "APPROVED" | "CLOSED"

// Get formatted date range (DD/MM/YYYY format)
periodStore.periodDateRange // "01/01/2026 - 31/01/2026"

// Get days remaining in period
periodStore.daysRemaining   // number (e.g., 16)

// Check if cache is still valid (10-minute TTL)
periodStore.isCacheValid    // boolean`,

  periodStoreActions: `// Period Store - Actions
const periodStore = usePeriodStore();

// Fetch current period (uses 10-minute cache)
await periodStore.fetchCurrentPeriod();

// Force refresh (bypass cache)
await periodStore.refresh();
// or
await periodStore.fetchCurrentPeriod(true);

// Invalidate cache manually
periodStore.invalidateCache();

// Reset store (on logout)
periodStore.reset();

// Clear error
periodStore.clearError();`,

  periodValidation: `// Period Validation in Transactions
// Always validate period status before posting

// 1. Check period is open
export async function validatePeriodOpen(
  periodId: string,
  prisma: PrismaClient
): Promise<void> {
  const period = await prisma.period.findUnique({
    where: { id: periodId },
    select: { status: true, name: true },
  });

  if (!period) {
    throw createError({
      statusCode: 404,
      statusMessage: "Period not found",
      data: { code: "PERIOD_NOT_FOUND" },
    });
  }

  if (period.status !== "OPEN") {
    throw createError({
      statusCode: 400,
      statusMessage: \`Cannot post: Period "\${period.name}" is \${period.status}\`,
      data: { code: "PERIOD_CLOSED" },
    });
  }
}

// 2. Check location period is open
export async function validateLocationPeriodOpen(
  periodId: string,
  locationId: string,
  prisma: PrismaClient
): Promise<void> {
  const periodLocation = await prisma.periodLocation.findUnique({
    where: {
      period_id_location_id: {
        period_id: periodId,
        location_id: locationId,
      },
    },
  });

  if (!periodLocation || periodLocation.status !== "OPEN") {
    throw createError({
      statusCode: 400,
      statusMessage: "Location period is not open for transactions",
      data: { code: "LOCATION_PERIOD_CLOSED" },
    });
  }
}

// Usage in API route
export default defineEventHandler(async (event) => {
  const { period_id, location_id } = await readBody(event);

  // Validate both period and location period
  await validatePeriodOpen(period_id, prisma);
  await validateLocationPeriodOpen(period_id, location_id, prisma);

  // Proceed with transaction...
});`,

  periodCloseWorkflow: `// Period Close Workflow
//
// Step 1: Locations Mark Ready
// ────────────────────────────
// Each location supervisor marks their location as READY
// when reconciliation is complete
//
await prisma.periodLocation.update({
  where: {
    period_id_location_id: { period_id, location_id },
  },
  data: {
    status: "READY",
    ready_at: new Date(),
  },
});

// Step 2: Check All Locations Ready
// ─────────────────────────────────
const periodLocations = await prisma.periodLocation.findMany({
  where: { period_id },
});

const allReady = periodLocations.every((pl) => pl.status === "READY");

if (allReady) {
  // Update period to PENDING_CLOSE
  await prisma.period.update({
    where: { id: period_id },
    data: { status: "PENDING_CLOSE" },
  });

  // Create approval request
  await prisma.approval.create({
    data: {
      entity_type: "PERIOD_CLOSE",
      entity_id: period_id,
      status: "PENDING",
      requested_by: userId,
    },
  });
}

// Step 3: Admin Approves Close
// ────────────────────────────
// Admin reviews and approves the period close request

await prisma.period.update({
  where: { id: period_id },
  data: { status: "APPROVED" },
});

// Step 4: Execute Close (Atomic Transaction)
// ──────────────────────────────────────────
await prisma.$transaction(async (tx) => {
  // Close all location periods with snapshots
  for (const location of locations) {
    const stockSnapshot = await tx.locationStock.findMany({
      where: { location_id: location.id },
    });

    await tx.periodLocation.update({
      where: {
        period_id_location_id: {
          period_id,
          location_id: location.id,
        },
      },
      data: {
        status: "CLOSED",
        closing_value: calculateTotalValue(stockSnapshot),
        snapshot_data: stockSnapshot,
        closed_at: new Date(),
      },
    });
  }

  // Close the period
  await tx.period.update({
    where: { id: period_id },
    data: {
      status: "CLOSED",
      closed_at: new Date(),
    },
  });
});`,

  rollForwardPeriod: `// Roll-Forward to New Period
// Creates new period from closed period's closing values

export async function rollForwardPeriod(
  closedPeriodId: string,
  newPeriodName: string,
  startDate: Date,
  endDate: Date,
  prisma: PrismaClient
): Promise<Period> {
  return await prisma.$transaction(async (tx) => {
    // 1. Get closed period with location data
    const closedPeriod = await tx.period.findUnique({
      where: { id: closedPeriodId },
      include: {
        period_locations: true,
        item_prices: true,
      },
    });

    if (!closedPeriod || closedPeriod.status !== "CLOSED") {
      throw new Error("Can only roll forward from a CLOSED period");
    }

    // 2. Create new period
    const newPeriod = await tx.period.create({
      data: {
        name: newPeriodName,
        start_date: startDate,
        end_date: endDate,
        status: "DRAFT",
      },
    });

    // 3. Create period locations with opening values
    for (const pl of closedPeriod.period_locations) {
      await tx.periodLocation.create({
        data: {
          period_id: newPeriod.id,
          location_id: pl.location_id,
          status: "OPEN",
          opening_value: pl.closing_value, // Carry forward
        },
      });
    }

    // 4. Copy item prices (optional - can adjust)
    for (const ip of closedPeriod.item_prices) {
      await tx.itemPrice.create({
        data: {
          item_id: ip.item_id,
          period_id: newPeriod.id,
          price: ip.price, // Copy or adjust prices
          currency: ip.currency,
        },
      });
    }

    return newPeriod;
  });
}

// Usage
const newPeriod = await rollForwardPeriod(
  closedPeriodId,
  "February 2026",
  new Date("2026-02-01"),
  new Date("2026-02-28"),
  prisma
);

// Then admin activates when ready
await prisma.period.update({
  where: { id: newPeriod.id },
  data: { status: "OPEN" },
});`,

  currentPeriodApi: `// Current Period API
// File: server/api/periods/current.get.ts

import prisma from "~~/server/utils/prisma";
import { setCacheHeaders } from "~~/server/utils/performance";

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  try {
    // Find the current open period
    const currentPeriod = await prisma.period.findFirst({
      where: {
        status: { in: ["OPEN", "PENDING_CLOSE"] },
      },
      orderBy: { start_date: "desc" },
    });

    // Set short cache (10 seconds) for critical data
    setCacheHeaders(event, { maxAge: 10, staleWhileRevalidate: 5 });

    return { period: currentPeriod };
  } catch (error) {
    console.error("Error fetching current period:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch current period",
    });
  }
});`,

  periodIndicatorComponent: `// Period Indicator Component
// File: app/components/layout/PeriodIndicator.vue

<script setup lang="ts">
const periodStore = usePeriodStore();

const badgeColor = computed(() => {
  switch (periodStore.currentPeriod?.status) {
    case "OPEN":
      return "success";
    case "PENDING_CLOSE":
      return "warning";
    case "APPROVED":
      return "info";
    case "CLOSED":
      return "neutral";
    default:
      return "neutral";
  }
});

const statusLabel = computed(() => {
  switch (periodStore.currentPeriod?.status) {
    case "OPEN":
      return "Open";
    case "PENDING_CLOSE":
      return "Pending Close";
    case "APPROVED":
      return "Approved";
    case "CLOSED":
      return "Closed";
    default:
      return "Unknown";
  }
});
\x3C/script>

\x3Ctemplate>
  \x3Cdiv class="flex items-center gap-3">
    \x3CUIcon name="i-heroicons-calendar-days" class="text-[var(--ui-text-muted)]" />
    \x3Cdiv class="flex flex-col">
      \x3Cspan class="text-sm font-medium text-[var(--ui-text)]">
        {{ periodStore.periodName }}
      \x3C/span>
      \x3Cspan class="text-xs text-[var(--ui-text-muted)]">
        {{ periodStore.periodDateRange }}
      \x3C/span>
    \x3C/div>
    \x3CUBadge :color="badgeColor" variant="soft" size="xs">
      {{ statusLabel }}
    \x3C/UBadge>
    \x3Cspan
      v-if="periodStore.isPeriodOpen && periodStore.daysRemaining > 0"
      class="text-xs text-[var(--ui-text-muted)]"
    >
      {{ periodStore.daysRemaining }} days left
    \x3C/span>
  \x3C/div>
\x3C/template>`,

  transactionPeriodCheck: `// Transaction Period Check Pattern
// Use this pattern in all transaction forms/pages

<script setup lang="ts">
const periodStore = usePeriodStore();
const locationStore = useLocationStore();

// Check if transactions can be posted
const canPost = computed(() => {
  return periodStore.isPeriodOpen;
});

// Show warning if period is not open
const periodWarning = computed(() => {
  if (!periodStore.hasPeriod) {
    return "No active period. Contact administrator.";
  }
  if (!periodStore.isPeriodOpen) {
    return \`Period "\${periodStore.periodName}" is \${periodStore.periodStatus}. Transactions disabled.\`;
  }
  return null;
});
\x3C/script>

\x3Ctemplate>
  \x3Cdiv>
    \x3C!-- Period Warning Alert -->
    \x3CUAlert
      v-if="periodWarning"
      icon="i-heroicons-exclamation-triangle"
      color="warning"
      variant="soft"
      :title="periodWarning"
      class="mb-4"
    />

    \x3C!-- Transaction Form -->
    \x3Cform @submit.prevent="submitDelivery">
      \x3C!-- Form fields... -->

      \x3CUButton
        type="submit"
        :disabled="!canPost || isSubmitting"
        :loading="isSubmitting"
        class="cursor-pointer"
      >
        Post Delivery
      \x3C/UButton>
    \x3C/form>
  \x3C/div>
\x3C/template>`,

  periodDiagram: `// Period Management Data Flow
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                           PERIOD                                         │
// │  ┌───────────────────────────────────────────────────────────────────┐   │
// │  │  name: "January 2026"                                             │   │
// │  │  start_date: 2026-01-01                                           │   │
// │  │  end_date: 2026-01-31                                             │   │
// │  │  status: OPEN                                                     │   │
// │  └───────────────────────────────────────────────────────────────────┘   │
// └─────────────────────────────────────────────────────────────────────────┘
//           │                    │                         │
//           │                    │                         │
//           ▼                    ▼                         ▼
// ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐
// │ PeriodLocation  │  │ PeriodLocation  │  │       ItemPrice             │
// │ ───────────────-│  │ ─────────────── │  │  ─────────────────────────  │
// │ Kitchen A: OPEN │  │ Store 1: OPEN   │  │  Item A: SAR 10.00         │
// │ opening: 50,000 │  │ opening: 25,000 │  │  Item B: SAR 5.50          │
// │                 │  │                 │  │  Item C: SAR 22.00         │
// └─────────────────┘  └─────────────────┘  └─────────────────────────────┘
//           │                    │                         │
//           │                    │                         │
//           ▼                    ▼                         ▼
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                         TRANSACTIONS                                     │
// │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
// │  │     Delivery     │  │      Issue       │  │     Transfer     │       │
// │  │  period_id: xxx  │  │  period_id: xxx  │  │  from_loc: xxx   │       │
// │  │  location_id: x  │  │  location_id: x  │  │  to_loc: xxx     │       │
// │  │  unit_price vs   │  │  wac_at_issue    │  │  wac_at_transfer │       │
// │  │  period_price    │  │  captured        │  │  captured        │       │
// │  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
// └─────────────────────────────────────────────────────────────────────────┘`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Period Management</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Accounting period lifecycle, price locking, and coordinated period close
      </p>
    </div>

    <!-- Period Lifecycle Section -->
    <section
      id="dev-section-period-lifecycle"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('period-lifecycle')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-path" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Period Lifecycle</span>
        </span>
        <UIcon
          :name="
            isExpanded('period-lifecycle') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('period-lifecycle')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Periods follow a strict lifecycle from creation to close. Each status has specific rules
          about what actions are permitted.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Period Model</h4>
          <DeveloperCodeBlock
            :code="codeExamples.periodModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Period Statuses</h4>
          <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="neutral" variant="soft" size="xs">DRAFT</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Period created, prices being set, not yet active.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="success" variant="soft" size="xs">OPEN</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Active accounting period. All transactions allowed.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="warning" variant="soft" size="xs">PENDING_CLOSE</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                All locations ready, awaiting admin approval.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="info" variant="soft" size="xs">APPROVED</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Admin approved, ready for close execution.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="neutral" variant="soft" size="xs">CLOSED</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Period closed, no more transactions. Snapshots captured.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Lifecycle Diagram</h4>
          <DeveloperCodeBlock :code="codeExamples.periodLifecycle" language="plaintext" />
        </div>
      </div>
    </section>

    <!-- PeriodLocation Section -->
    <section
      id="dev-section-period-location"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('period-location')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-map-pin" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            PeriodLocation Status Tracking
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('period-location') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('period-location')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Each location has its own period status, tracking opening/closing values and readiness for
          period close.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">PeriodLocation Model</h4>
          <DeveloperCodeBlock
            :code="codeExamples.periodLocationModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Location Period Statuses</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UBadge color="success" variant="soft" size="xs">OPEN</UBadge>
              <span>Location can post deliveries, issues, and transfers</span>
            </li>
            <li class="flex items-start gap-2">
              <UBadge color="warning" variant="soft" size="xs">READY</UBadge>
              <span>Supervisor marked ready, waiting for all locations</span>
            </li>
            <li class="flex items-start gap-2">
              <UBadge color="neutral" variant="soft" size="xs">CLOSED</UBadge>
              <span>Location period closed, stock snapshot captured</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Status Workflow</h4>
          <DeveloperCodeBlock :code="codeExamples.periodLocationWorkflow" language="plaintext" />
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Coordinated Close:</strong>
              All locations must be READY before the period can move to PENDING_CLOSE. This ensures
              all transactions are complete.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Price Locking Section -->
    <section
      id="dev-section-price-locking"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('price-locking')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-lock-closed" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Price Locking Mechanism
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('price-locking') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('price-locking')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          ItemPrice locks expected prices at period start. Deliveries compare actual prices against
          locked prices, auto-generating NCRs for variances.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">ItemPrice Model</h4>
          <DeveloperCodeBlock
            :code="codeExamples.itemPriceModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Price Flow Diagram</h4>
          <DeveloperCodeBlock :code="codeExamples.priceLockingMechanism" language="plaintext" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Price Variance Detection
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.priceVarianceCheck"
            language="typescript"
            filename="server/utils/priceVariance.ts"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-error)]">
            <UIcon name="i-heroicons-exclamation-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Critical Business Rule:</strong>
              Price variances automatically generate NCRs with
              <code class="code-inline">auto_generated: true</code>
              . This ensures all price discrepancies are tracked and resolved.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Period Store Section -->
    <section
      id="dev-section-period-store"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('period-store')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-cube-transparent" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Current Period Store</span>
        </span>
        <UIcon
          :name="isExpanded('period-store') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('period-store')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The Period Store manages the current accounting period with a 10-minute cache, providing
          status checks and formatted date helpers.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Store Interface</h4>
          <DeveloperCodeBlock
            :code="codeExamples.periodStoreInterface"
            language="typescript"
            filename="app/stores/period.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Getters</h4>
          <DeveloperCodeBlock :code="codeExamples.periodStoreGetters" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Actions</h4>
          <DeveloperCodeBlock :code="codeExamples.periodStoreActions" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Current Period API</h4>
          <DeveloperCodeBlock
            :code="codeExamples.currentPeriodApi"
            language="typescript"
            filename="server/api/periods/current.get.ts"
          />
        </div>
      </div>
    </section>

    <!-- Period Validation Section -->
    <section
      id="dev-section-period-validation"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('period-validation')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-shield-check" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Period Validation in Transactions
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('period-validation') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('period-validation')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Always validate period status before posting transactions. Both the global period and the
          specific location period must be open.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Server-Side Validation</h4>
          <DeveloperCodeBlock :code="codeExamples.periodValidation" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Client-Side Check</h4>
          <DeveloperCodeBlock :code="codeExamples.transactionPeriodCheck" language="vue" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Error Codes</h4>
          <div class="space-y-2 text-sm">
            <div class="flex items-start gap-2">
              <UBadge color="error" variant="soft" size="xs">400</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                <code class="code-inline">PERIOD_CLOSED</code>
                - Period is not OPEN
              </span>
            </div>
            <div class="flex items-start gap-2">
              <UBadge color="error" variant="soft" size="xs">400</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                <code class="code-inline">LOCATION_PERIOD_CLOSED</code>
                - Location period is READY or CLOSED
              </span>
            </div>
            <div class="flex items-start gap-2">
              <UBadge color="warning" variant="soft" size="xs">404</UBadge>
              <span class="text-[var(--ui-text-muted)]">
                <code class="code-inline">PERIOD_NOT_FOUND</code>
                - No period exists with given ID
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Period Close Workflow Section -->
    <section
      id="dev-section-period-close"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('period-close')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-check-circle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Period Close Workflow</span>
        </span>
        <UIcon
          :name="isExpanded('period-close') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('period-close')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Period close is a coordinated process requiring all locations to be ready before admin
          approval and final close execution.
        </p>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Close Process Steps</h4>
          <ol class="list-inside list-decimal space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Location Supervisors:</strong>
              Mark each location as READY when reconciliation is complete
            </li>
            <li>
              <strong>System Check:</strong>
              When all locations are READY, period moves to PENDING_CLOSE
            </li>
            <li>
              <strong>Approval Request:</strong>
              System creates PERIOD_CLOSE approval for admin
            </li>
            <li>
              <strong>Admin Review:</strong>
              Admin reviews reconciliations and approves
            </li>
            <li>
              <strong>Close Execution:</strong>
              Atomic transaction captures snapshots and closes all locations
            </li>
          </ol>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Close Implementation</h4>
          <DeveloperCodeBlock :code="codeExamples.periodCloseWorkflow" language="typescript" />
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Important:</strong>
              Period close is an atomic operation. All locations close simultaneously with
              snapshots. If any part fails, the entire close is rolled back.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Roll-Forward Section -->
    <section
      id="dev-section-roll-forward"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('roll-forward')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-right-circle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Roll-Forward to New Period
          </span>
        </span>
        <UIcon
          :name="isExpanded('roll-forward') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('roll-forward')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          After closing a period, a new period is created with opening values from the previous
          period's closing values.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Roll-Forward Function</h4>
          <DeveloperCodeBlock :code="codeExamples.rollForwardPeriod" language="typescript" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Roll-Forward Process</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check" class="mt-0.5 text-[var(--ui-success)]" />
              <span>Create new period in DRAFT status</span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                Copy PeriodLocation records with
                <code class="code-inline">closing_value → opening_value</code>
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check" class="mt-0.5 text-[var(--ui-success)]" />
              <span>Copy or adjust ItemPrice records for new period</span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check" class="mt-0.5 text-[var(--ui-success)]" />
              <span>Admin reviews and activates (DRAFT → OPEN)</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Period Indicator Component Section -->
    <section
      id="dev-section-period-indicator"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('period-indicator')"
      >
        <span class="flex items-center gap-3">
          <UIcon
            name="i-heroicons-presentation-chart-bar"
            class="text-xl text-[var(--ui-primary)]"
          />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Period Indicator UI</span>
        </span>
        <UIcon
          :name="
            isExpanded('period-indicator') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('period-indicator')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The Period Indicator component displays the current period status, date range, and days
          remaining in the navbar or dashboard.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Component Example</h4>
          <DeveloperCodeBlock
            :code="codeExamples.periodIndicatorComponent"
            language="vue"
            filename="app/components/layout/PeriodIndicator.vue"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Data Flow Diagram</h4>
          <DeveloperCodeBlock :code="codeExamples.periodDiagram" language="plaintext" />
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
