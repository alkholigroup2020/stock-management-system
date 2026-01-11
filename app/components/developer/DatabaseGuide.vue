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
  dbStack: `// Database Stack
// - PostgreSQL 15+ hosted on Supabase (cloud infrastructure)
// - Prisma ORM for type-safe database access
// - Connection pooling via Supabase Transaction Mode (PgBouncer)
// - Prisma Client generated from schema with full TypeScript types`,

  connectionConfig: `# .env Configuration

# Runtime connection (Transaction Pooler - port 6543)
# Used by Prisma Client for all database operations
DATABASE_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (port 5432)
# Used only for migrations (bypasses PgBouncer)
DIRECT_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"`,

  datasourceConfig: `// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // Transaction pooler (runtime)
  directUrl = env("DIRECT_URL")     // Direct connection (migrations)
}`,

  prismaSingleton: `import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client instance for database operations
 *
 * In development, this uses a global variable to prevent
 * multiple instances during hot reloads.
 *
 * In production, creates a new instance.
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}`,

  schemaModels: `// 20 Core Models in prisma/schema.prisma

// Users & Access Control
User              // System users with roles
UserLocation      // Maps users to accessible locations

// Locations & Inventory
Location          // Physical locations (Kitchen, Store, Central, Warehouse)
LocationStock     // Per-location stock levels (on_hand, WAC)
Item              // Master item catalog

// Transactions
Delivery          // Inbound stock from suppliers
DeliveryLine      // Line items in deliveries
Issue             // Outbound stock to cost centers
IssueLine         // Line items in issues
Transfer          // Inter-location transfers
TransferLine      // Line items in transfers

// Accounting & Periods
Period            // Monthly accounting periods
PeriodLocation    // Per-location period status
ItemPrice         // Period-locked item prices
Reconciliation    // Period-end reconciliation
POB               // Personnel headcount (Presence on Board)

// Procurement & Compliance
PRF               // Purchase Request Forms
PO                // Purchase Orders
NCR               // Non-Conformance Reports
Approval          // Approval workflow records
Supplier          // Supplier master data`,

  locationStockModel: `model LocationStock {
  location_id  String    @db.Uuid
  item_id      String    @db.Uuid
  on_hand      Decimal   @default(0) @db.Decimal(15, 4)
  wac          Decimal   @default(0) @db.Decimal(15, 4)
  min_stock    Decimal?  @db.Decimal(15, 4)
  max_stock    Decimal?  @db.Decimal(15, 4)
  last_counted DateTime? @db.Timestamptz(6)
  updated_at   DateTime  @updatedAt @db.Timestamptz(6)

  item         Item      @relation(...)
  location     Location  @relation(...)

  // Composite primary key - unique stock per location per item
  @@id([location_id, item_id])
  @@index([location_id])
  @@index([item_id])
  @@map("location_stock")
}`,

  itemPriceModel: `model ItemPrice {
  id        String   @id @default(uuid()) @db.Uuid
  item_id   String   @db.Uuid
  period_id String   @db.Uuid
  price     Decimal  @db.Decimal(15, 4)
  currency  String   @default("SAR") @db.VarChar(3)
  set_by    String?  @db.Uuid
  set_at    DateTime @default(now()) @db.Timestamptz(6)

  item      Item     @relation(...)
  period    Period   @relation(...)

  // One price per item per period (prevents mid-period changes)
  @@unique([item_id, period_id])
  @@map("item_prices")
}`,

  enums: `// 14 Enums for type safety

enum UserRole {
  OPERATOR    // Basic operations at assigned locations
  SUPERVISOR  // Approvals and oversight
  ADMIN       // Full system access
}

enum PeriodStatus {
  DRAFT         // Period created, not yet open
  OPEN          // Active period for transactions
  PENDING_CLOSE // Awaiting approval to close
  APPROVED      // Approved, ready to close
  CLOSED        // Period closed, no more transactions
}

enum TransferStatus {
  DRAFT             // Being prepared
  PENDING_APPROVAL  // Awaiting supervisor approval
  APPROVED          // Approved, ready to execute
  REJECTED          // Rejected by supervisor
  COMPLETED         // Stock transferred successfully
}

// Other enums: LocationType, Unit, PeriodLocationStatus,
// PRFStatus, POStatus, DeliveryStatus, CostCentre,
// NCRType, NCRStatus, ApprovalEntityType, ApprovalStatus`,

  wacCalculation: `/**
 * Calculate Weighted Average Cost (WAC) for inventory items
 *
 * Formula:
 * newWAC = (currentQty × currentWAC + receivedQty × receiptPrice)
 *        / (currentQty + receivedQty)
 *
 * Example:
 * Current stock: 100 KG @ SAR 10.00/KG = SAR 1,000.00
 * New receipt: 50 KG @ SAR 12.00/KG = SAR 600.00
 * New WAC: (1000 + 600) / (100 + 50) = SAR 10.67/KG
 */
export function calculateWAC(
  currentQty: number,
  currentWAC: number,
  receivedQty: number,
  receiptPrice: number
): WACCalculationResult {
  const currentValue = currentQty * currentWAC;
  const receiptValue = receivedQty * receiptPrice;
  const newQuantity = currentQty + receivedQty;

  const newWAC = newQuantity > 0
    ? (currentValue + receiptValue) / newQuantity
    : 0;

  return {
    newWAC: Math.round(newWAC * 10000) / 10000,
    previousWAC: Math.round(currentWAC * 10000) / 10000,
    newQuantity,
    newValue: newQuantity * newWAC,
    currentValue,
    receiptValue,
  };
}`,

  priceVariance: `/**
 * Check if a delivery line has a price variance
 *
 * Compares actual delivery price with period-locked price.
 * Any variance automatically triggers NCR creation.
 */
export function checkPriceVariance(
  unitPrice: number | Prisma.Decimal,
  periodPrice: number | Prisma.Decimal,
  quantity: number | Prisma.Decimal
): PriceVarianceResult {
  const variance = actualPrice - expectedPrice;
  const variancePercent = expectedPrice > 0
    ? (variance / expectedPrice) * 100
    : 100;

  return {
    hasVariance: variance !== 0,
    variance,
    variancePercent,
    varianceAmount: variance * qty,
    actualPrice,
    expectedPrice,
    exceedsThreshold: hasVariance, // Any variance triggers NCR
  };
}

// Auto-NCR creation when price differs from period price
const result = await detectAndCreateNCR(prisma, {
  locationId, deliveryId, deliveryLineId,
  itemId, itemName, itemCode,
  quantity, unitPrice, periodPrice,
  createdBy: user.id,
});`,

  apiPatternBasic: `// Import the Prisma singleton
import prisma from "../../../../utils/prisma";

export default defineEventHandler(async (event) => {
  // User attached by auth middleware
  const user = event.context.user;
  const locationId = getRouterParam(event, "id");

  // Simple query
  const items = await prisma.item.findMany({
    where: { is_active: true },
    orderBy: { name: "asc" },
  });

  return items;
});`,

  apiPatternTransaction: `// Batch multiple queries with $transaction
const [location, currentPeriod, items] = await prisma.$transaction([
  prisma.location.findUnique({
    where: { id: locationId },
  }),
  prisma.period.findFirst({
    where: { status: "OPEN" },
  }),
  prisma.item.findMany({
    where: { id: { in: itemIds } },
  }),
]);

// Interactive transaction for atomic operations
const result = await prisma.$transaction(async (tx) => {
  // Create delivery
  const delivery = await tx.delivery.create({
    data: { location_id: locationId, ... },
  });

  // Update stock with upsert
  await tx.locationStock.upsert({
    where: {
      location_id_item_id: { location_id: locationId, item_id: itemId },
    },
    update: {
      on_hand: { increment: quantity },
      wac: newWAC,
    },
    create: {
      location_id: locationId,
      item_id: itemId,
      on_hand: quantity,
      wac: newWAC,
    },
  });

  return delivery;
}, { timeout: 30000 });`,

  errorHandling: `// Standard error handling pattern
export default defineEventHandler(async (event) => {
  try {
    // ... database operations
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        // Unique constraint violation
        throw createError({
          statusCode: 409,
          data: { code: "DUPLICATE_ENTRY", message: "Record already exists" },
        });
      }
      if (error.code === "P2025") {
        // Record not found
        throw createError({
          statusCode: 404,
          data: { code: "NOT_FOUND", message: "Record not found" },
        });
      }
    }
    throw error; // Re-throw unexpected errors
  }
});

// Standard error codes used in the app:
// INSUFFICIENT_STOCK, LOCATION_ACCESS_DENIED, PERIOD_CLOSED,
// VALIDATION_ERROR, PRICE_VARIANCE, NOT_FOUND, UNAUTHORIZED`,

  dbCommands: `# Development commands
pnpm db:push        # Sync schema to database (dev only, no migrations)
pnpm db:studio      # Open Prisma Studio GUI for data browsing
pnpm db:seed        # Seed database with test data
pnpm db:generate    # Regenerate Prisma Client after schema changes

# Migration commands
pnpm db:migrate     # Create and apply migration (interactive)
pnpm db:migrate:deploy  # Apply pending migrations (production)

# Build process includes Prisma generate
pnpm build          # Runs: prisma generate && nuxt build

# IMPORTANT: Never use db:push in production!
# Always use migrations for production database changes.`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Database Guide</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        PostgreSQL setup, Prisma ORM, schema design, and data access patterns
      </p>
    </div>

    <!-- Database Overview Section -->
    <section
      id="dev-section-db-overview"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('db-overview')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-server-stack" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Database Overview</span>
        </span>
        <UIcon
          :name="isExpanded('db-overview') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('db-overview')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The Stock Management System uses <strong>PostgreSQL</strong> hosted on Supabase with
          <strong>Prisma ORM</strong> for type-safe database access.
        </p>

        <DeveloperCodeBlock :code="codeExamples.dbStack" language="typescript" />

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key Features</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Type Safety:</strong> Full TypeScript types generated from schema
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Connection Pooling:</strong> PgBouncer via Supabase for scalability
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Migrations:</strong> Version-controlled schema changes
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span><strong>Prisma Studio:</strong> Visual database browser for debugging</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Connection Configuration Section -->
    <section
      id="dev-section-db-connection"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('db-connection')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-link" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Connection Configuration
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('db-connection') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('db-connection')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Supabase provides two connection methods. Use the correct port for each purpose.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Environment Variables</h4>
          <DeveloperCodeBlock :code="codeExamples.connectionConfig" language="bash" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Prisma Configuration</h4>
          <DeveloperCodeBlock
            :code="codeExamples.datasourceConfig"
            language="prisma"
            filename="prisma/schema.prisma"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Critical:</strong> Port 6543 (Transaction Pooler) is required for runtime.
              Port 5432 (Direct) is only for migrations. Using the wrong port will cause connection
              errors.
            </span>
          </p>
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Connection Modes</h4>
          <div class="space-y-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft">Port 6543</UBadge>
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Transaction Pooler
                </span>
              </div>
              <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
                Uses PgBouncer for connection pooling. Required for Prisma runtime operations.
                Handles concurrent connections efficiently.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="neutral" variant="soft">Port 5432</UBadge>
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Direct Connection
                </span>
              </div>
              <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
                Direct PostgreSQL connection. Used only for migrations via
                <code class="code-inline">directUrl</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Prisma Singleton Section -->
    <section
      id="dev-section-db-prisma-singleton"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('db-prisma-singleton')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-cube" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Prisma Client Singleton
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('db-prisma-singleton')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('db-prisma-singleton')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          A global singleton pattern prevents multiple Prisma Client instances during development
          hot reloads.
        </p>

        <DeveloperCodeBlock
          :code="codeExamples.prismaSingleton"
          language="typescript"
          filename="server/utils/prisma.ts"
        />

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Why Singleton?</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check" class="mt-0.5 text-[var(--ui-primary)]" />
              <span>Prevents "too many connections" errors during hot reloads</span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check" class="mt-0.5 text-[var(--ui-primary)]" />
              <span>Development logging (query, error, warn) for debugging</span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check" class="mt-0.5 text-[var(--ui-primary)]" />
              <span>Production logging limited to errors only</span>
            </li>
          </ul>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              Import with: <code class="code-inline">import prisma from "~/server/utils/prisma"</code>
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Schema Overview Section -->
    <section
      id="dev-section-db-schema"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('db-schema')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-table-cells" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Schema Overview</span>
        </span>
        <UIcon
          :name="isExpanded('db-schema') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('db-schema')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The schema contains <strong>21 models</strong> and <strong>14 enums</strong> covering all
          aspects of inventory management.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Models by Category</h4>
          <DeveloperCodeBlock
            :code="codeExamples.schemaModels"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Enums</h4>
          <DeveloperCodeBlock
            :code="codeExamples.enums"
            language="prisma"
            filename="prisma/schema.prisma"
          />
        </div>
      </div>
    </section>

    <!-- Key Domain Models Section -->
    <section
      id="dev-section-db-key-models"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('db-key-models')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-squares-2x2" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Key Domain Models</span>
        </span>
        <UIcon
          :name="
            isExpanded('db-key-models') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('db-key-models')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Critical models that implement core business logic.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            LocationStock (Inventory per Location)
          </h4>
          <p class="mb-2 text-sm text-[var(--ui-text-muted)]">
            Composite key ensures unique stock record per location per item. Stores quantity and
            WAC.
          </p>
          <DeveloperCodeBlock
            :code="codeExamples.locationStockModel"
            language="prisma"
            filename="prisma/schema.prisma"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            ItemPrice (Period-Locked Prices)
          </h4>
          <p class="mb-2 text-sm text-[var(--ui-text-muted)]">
            Locks prices at period start. Unique constraint prevents mid-period price changes.
          </p>
          <DeveloperCodeBlock
            :code="codeExamples.itemPriceModel"
            language="prisma"
            filename="prisma/schema.prisma"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Business Rule:</strong> When a delivery price differs from the ItemPrice, the
              system automatically creates a Price Variance NCR.
            </span>
          </p>
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Data Precision</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>
              <code class="code-inline">Decimal(15, 4)</code> - Quantities, WAC (up to 4 decimals)
            </li>
            <li>
              <code class="code-inline">Decimal(15, 2)</code> - Currency values (SAR with 2
              decimals)
            </li>
            <li>
              <code class="code-inline">Timestamptz(6)</code> - All timestamps with timezone
              (Asia/Riyadh)
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Business Logic Utilities Section -->
    <section
      id="dev-section-db-utilities"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('db-utilities')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-calculator" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Business Logic Utilities
          </span>
        </span>
        <UIcon
          :name="isExpanded('db-utilities') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('db-utilities')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Server utilities that implement core business calculations.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">WAC Calculation</h4>
          <DeveloperCodeBlock
            :code="codeExamples.wacCalculation"
            language="typescript"
            filename="server/utils/wac.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Price Variance Detection</h4>
          <DeveloperCodeBlock
            :code="codeExamples.priceVariance"
            language="typescript"
            filename="server/utils/priceVariance.ts"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Business Rules</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Deliveries:</strong> Recalculate WAC based on new receipts
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Issues:</strong> Deduct at current WAC (no recalculation)
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Transfers:</strong> Move stock at current WAC from source location
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Price Variance:</strong> Any difference from period price creates NCR
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- API Access Patterns Section -->
    <section
      id="dev-section-db-api-patterns"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('db-api-patterns')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-code-bracket" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">API Access Patterns</span>
        </span>
        <UIcon
          :name="
            isExpanded('db-api-patterns') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('db-api-patterns')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Common patterns for using Prisma in API routes.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Basic Query Pattern</h4>
          <DeveloperCodeBlock :code="codeExamples.apiPatternBasic" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Transactions</h4>
          <DeveloperCodeBlock :code="codeExamples.apiPatternTransaction" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Error Handling</h4>
          <DeveloperCodeBlock :code="codeExamples.errorHandling" language="typescript" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key Patterns</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>
              <code class="code-inline">$transaction([])</code> - Batch reads for performance
            </li>
            <li>
              <code class="code-inline">$transaction(async tx)</code> - Atomic writes with rollback
            </li>
            <li>
              <code class="code-inline">upsert</code> - Insert or update in single operation
            </li>
            <li>
              <code class="code-inline">include</code> - Eager load relations
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Database Commands Section -->
    <section
      id="dev-section-db-commands"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('db-commands')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-command-line" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Database Commands</span>
        </span>
        <UIcon
          :name="isExpanded('db-commands') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('db-commands')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Available pnpm commands for database management.
        </p>

        <DeveloperCodeBlock :code="codeExamples.dbCommands" language="bash" />

        <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-error)]">
            <UIcon name="i-heroicons-x-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Never use db:push in production!</strong> It can cause data loss. Always use
              migrations (<code class="code-inline">db:migrate:deploy</code>) for production.
            </span>
          </p>
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">When to Use Each Command</h4>
          <div class="space-y-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft">db:push</UBadge>
                <span class="text-sm text-[var(--ui-text-muted)]">
                  Rapid prototyping in development
                </span>
              </div>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="success" variant="soft">db:migrate</UBadge>
                <span class="text-sm text-[var(--ui-text-muted)]">
                  Create versioned migrations with history
                </span>
              </div>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="warning" variant="soft">db:migrate:deploy</UBadge>
                <span class="text-sm text-[var(--ui-text-muted)]">
                  Apply migrations in CI/CD or production
                </span>
              </div>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="info" variant="soft">db:studio</UBadge>
                <span class="text-sm text-[var(--ui-text-muted)]">
                  Browse and edit data visually
                </span>
              </div>
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
