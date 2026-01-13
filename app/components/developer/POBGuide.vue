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
  pobModel: `// POB Model - Prisma Schema
// File: prisma/schema.prisma

model POB {
  id          String   @id @default(uuid()) @db.Uuid
  period_id   String   @db.Uuid
  location_id String   @db.Uuid
  date        DateTime @db.Date
  crew_count  Int      @default(0)
  extra_count Int      @default(0)
  entered_by  String   @db.Uuid
  entered_at  DateTime @default(now()) @db.Timestamptz(6)
  updated_at  DateTime @updatedAt @db.Timestamptz(6)
  enterer     User     @relation("POBEnterer", fields: [entered_by], references: [id])
  location    Location @relation(fields: [location_id], references: [id], onDelete: Cascade)
  period      Period   @relation(fields: [period_id], references: [id], onDelete: Cascade)

  @@unique([period_id, location_id, date])
  @@index([period_id])
  @@index([location_id])
  @@index([date])
  @@index([period_id, location_id])
  @@map("pob")
}

// Key Constraints:
// - Unique constraint on (period_id, location_id, date)
// - One entry per day per location per period
// - Both crew_count and extra_count default to 0
// - Tracks who entered/updated via entered_by`,

  mandaysExplanation: `// POB Mandays Calculation
//
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │                          MANDAYS CALCULATION                                 │
// └─────────────────────────────────────────────────────────────────────────────┘
//
// For each day:
//   Total Count = crew_count + extra_count
//
// For the period:
//   Total Mandays = SUM(crew_count + extra_count) for all days
//
// Example (30-day period):
// ┌──────────────────────────────────────────────────────────────────┐
// │  Date       │ Crew Count │ Extra Count │ Daily Total            │
// ├──────────────────────────────────────────────────────────────────┤
// │  2025-01-01 │     65     │      5      │     70                 │
// │  2025-01-02 │     68     │      3      │     71                 │
// │  2025-01-03 │     70     │      0      │     70                 │
// │     ...     │    ...     │     ...     │    ...                 │
// │  2025-01-30 │     66     │      2      │     68                 │
// ├──────────────────────────────────────────────────────────────────┤
// │  TOTALS     │   2,000    │    100      │  2,100 Total Mandays   │
// └──────────────────────────────────────────────────────────────────┘
//
// Purpose:
// - crew_count: Regular personnel on board (employees, crew members)
// - extra_count: Visitors, guests, or additional meals served
// - Total Mandays: Used for cost-per-manday calculations in reconciliation`,

  mandayCostFormula: `// Manday Cost Calculation
// File: server/utils/reconciliation.ts

/**
 * Calculate manday cost (cost per person per day)
 *
 * Formula:
 *   MandayCost = Consumption / TotalMandays
 *
 * Where:
 *   Consumption = Opening + Receipts + TransfersIn - TransfersOut - Closing + Adjustments
 *   TotalMandays = SUM(crew_count + extra_count) from POB entries
 *
 * Example:
 *   Consumption: SAR 34,500
 *   Total Mandays: 2,100
 *   Manday Cost: SAR 34,500 / 2,100 = SAR 16.43 per person per day
 */
export function calculateMandayCost(
  consumption: number | Decimal,
  totalMandays: number
): MandayCostResult {
  const consumptionValue = toNumber(consumption);

  // Validate inputs
  if (!Number.isFinite(consumptionValue)) {
    throw new Error("Invalid consumption: must be a finite number");
  }
  if (!Number.isFinite(totalMandays)) {
    throw new Error("Invalid totalMandays: must be a finite number");
  }
  if (totalMandays <= 0) {
    throw new Error("Invalid totalMandays: must be greater than zero");
  }

  // Calculate manday cost
  const mandayCost = consumptionValue / totalMandays;

  // Round to 2 decimal places for currency
  const roundedMandayCost = Math.round(mandayCost * 100) / 100;

  return {
    mandayCost: roundedMandayCost,
    consumption: Math.round(consumptionValue * 100) / 100,
    totalMandays,
  };
}

// Combined reconciliation calculation
export function calculateReconciliation(
  input: ConsumptionInput,
  totalMandays: number
): { consumption: ConsumptionResult; mandayCost: MandayCostResult } {
  const consumptionResult = calculateConsumption(input);
  const mandayCostResult = calculateMandayCost(consumptionResult.consumption, totalMandays);

  return {
    consumption: consumptionResult,
    mandayCost: mandayCostResult,
  };
}`,

  getPOBEndpoint: `// GET /api/locations/:id/pob
// File: server/api/locations/[id]/pob.get.ts

/**
 * Fetch POB data for a location
 *
 * Returns:
 * - Location and period information
 * - All POB entries for the current period
 * - Summary totals (total crew, extra, mandays)
 *
 * Permissions:
 * - User must have VIEW, POST, or MANAGE access to the location
 * - Supervisors and Admins have implicit access
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const locationId = getRouterParam(event, "id");

  // Validate location exists and user has access
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { id: true, code: true, name: true },
  });

  if (!location) {
    throw createError({
      statusCode: 404,
      data: { code: "LOCATION_NOT_FOUND", message: "Location not found" },
    });
  }

  // Check user access (Operators need explicit assignment)
  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    const userLocation = await prisma.userLocation.findUnique({
      where: {
        user_id_location_id: { user_id: user.id, location_id: locationId },
      },
    });

    if (!userLocation) {
      throw createError({
        statusCode: 403,
        data: { code: "LOCATION_ACCESS_DENIED" },
      });
    }
  }

  // Get current open period
  const currentPeriod = await prisma.period.findFirst({
    where: { status: "OPEN" },
    orderBy: { start_date: "desc" },
    select: { id: true, name: true, start_date: true, end_date: true, status: true },
  });

  if (!currentPeriod) {
    throw createError({
      statusCode: 404,
      data: { code: "NO_OPEN_PERIOD", message: "No open period found" },
    });
  }

  // Get POB entries for this location and period
  const pobEntries = await prisma.pOB.findMany({
    where: { location_id: locationId, period_id: currentPeriod.id },
    include: {
      enterer: { select: { id: true, username: true, full_name: true } },
    },
    orderBy: { date: "asc" },
  });

  // Calculate summary
  const summary = {
    total_crew_count: pobEntries.reduce((sum, e) => sum + e.crew_count, 0),
    total_extra_count: pobEntries.reduce((sum, e) => sum + e.extra_count, 0),
    total_mandays: pobEntries.reduce((sum, e) => sum + e.crew_count + e.extra_count, 0),
    entries_count: pobEntries.length,
  };

  return {
    location,
    period: currentPeriod,
    entries: pobEntries.map((entry) => ({
      id: entry.id,
      date: entry.date.toISOString().split("T")[0],
      crew_count: entry.crew_count,
      extra_count: entry.extra_count,
      total_count: entry.crew_count + entry.extra_count,
      enterer: entry.enterer,
      entered_at: entry.entered_at,
      updated_at: entry.updated_at,
    })),
    summary,
  };
});`,

  postPOBEndpoint: `// POST /api/locations/:id/pob
// File: server/api/locations/[id]/pob.post.ts

/**
 * Create or update POB entries for a location
 *
 * Uses UPSERT pattern - creates new entries or updates existing ones
 * based on unique constraint (period_id, location_id, date)
 *
 * Business Rules:
 * - Period must be OPEN for the location
 * - Crew count and extra count must be non-negative integers
 * - Date must be within the period date range
 */

// Request body schema
const entrySchema = z.object({
  date: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/, "Date must be in YYYY-MM-DD format"),
  crew_count: z.number().int().nonnegative("Crew count must be non-negative"),
  extra_count: z.number().int().nonnegative("Extra count must be non-negative"),
});

const bodySchema = z.object({
  entries: z.array(entrySchema).min(1, "At least one entry is required"),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const locationId = getRouterParam(event, "id");
  const { entries } = bodySchema.parse(await readBody(event));

  // Validate location and access...

  // Get current open period
  const currentPeriod = await prisma.period.findFirst({
    where: { status: "OPEN" },
    orderBy: { start_date: "desc" },
  });

  // Check if period is open for this location
  const periodLocation = await prisma.periodLocation.findUnique({
    where: {
      period_id_location_id: {
        period_id: currentPeriod.id,
        location_id: locationId,
      },
    },
  });

  if (!periodLocation || periodLocation.status !== "OPEN") {
    throw createError({
      statusCode: 400,
      data: { code: "PERIOD_CLOSED", message: "Period is not open for this location" },
    });
  }

  // Validate all dates are within the period
  for (const entry of entries) {
    const entryDate = new Date(entry.date);
    if (entryDate < currentPeriod.start_date || entryDate > currentPeriod.end_date) {
      throw createError({
        statusCode: 400,
        data: {
          code: "DATE_OUT_OF_PERIOD",
          message: \`Date \${entry.date} is outside the current period\`,
        },
      });
    }
  }

  // Upsert POB entries (create or update)
  const results = await Promise.all(
    entries.map(async (entry) => {
      const entryDate = new Date(entry.date);

      return prisma.pOB.upsert({
        where: {
          period_id_location_id_date: {
            period_id: currentPeriod.id,
            location_id: locationId,
            date: entryDate,
          },
        },
        create: {
          period_id: currentPeriod.id,
          location_id: locationId,
          date: entryDate,
          crew_count: entry.crew_count,
          extra_count: entry.extra_count,
          entered_by: user.id,
        },
        update: {
          crew_count: entry.crew_count,
          extra_count: entry.extra_count,
          entered_by: user.id,
        },
      });
    })
  );

  // Return updated summary
  const allPobEntries = await prisma.pOB.findMany({
    where: { location_id: locationId, period_id: currentPeriod.id },
  });

  return {
    message: \`\${results.length} POB entries saved successfully\`,
    entries: results,
    summary: {
      total_crew_count: allPobEntries.reduce((sum, e) => sum + e.crew_count, 0),
      total_extra_count: allPobEntries.reduce((sum, e) => sum + e.extra_count, 0),
      total_mandays: allPobEntries.reduce((sum, e) => sum + e.crew_count + e.extra_count, 0),
      entries_count: allPobEntries.length,
    },
  };
});`,

  patchPOBEndpoint: `// PATCH /api/pob/:id
// File: server/api/pob/[id].patch.ts

/**
 * Update a single POB entry
 *
 * Business Rules:
 * - Period must still be OPEN for the location
 * - Crew count and extra count must be non-negative
 * - At least one field must be provided
 */

const bodySchema = z.object({
  crew_count: z.number().int().nonnegative().optional(),
  extra_count: z.number().int().nonnegative().optional(),
});

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const id = getRouterParam(event, "id");
  const data = bodySchema.parse(await readBody(event));

  // At least one field required
  if (data.crew_count === undefined && data.extra_count === undefined) {
    throw createError({
      statusCode: 400,
      data: { code: "NO_UPDATES", message: "At least one field must be provided" },
    });
  }

  // Fetch existing POB entry
  const pobEntry = await prisma.pOB.findUnique({
    where: { id },
    include: { location: true, period: true },
  });

  if (!pobEntry) {
    throw createError({
      statusCode: 404,
      data: { code: "POB_NOT_FOUND", message: "POB entry not found" },
    });
  }

  // Check period is still open for this location
  const periodLocation = await prisma.periodLocation.findUnique({
    where: {
      period_id_location_id: {
        period_id: pobEntry.period_id,
        location_id: pobEntry.location_id,
      },
    },
  });

  if (!periodLocation || periodLocation.status !== "OPEN") {
    throw createError({
      statusCode: 400,
      data: { code: "PERIOD_CLOSED", message: "Cannot update POB entry" },
    });
  }

  // Update POB entry
  const updateData: Record<string, unknown> = { entered_by: user.id };
  if (data.crew_count !== undefined) updateData.crew_count = data.crew_count;
  if (data.extra_count !== undefined) updateData.extra_count = data.extra_count;

  const updatedPOB = await prisma.pOB.update({
    where: { id },
    data: updateData,
  });

  return { message: "POB entry updated successfully", entry: updatedPOB };
});`,

  frontendPage: `// POB Entry Page
// File: app/pages/pob.vue

<script setup lang="ts">
const locationStore = useLocationStore();
const periodStore = usePeriodStore();
const toast = useAppToast();

interface POBEntry {
  id?: string;
  date: string;
  crew_count: number;
  extra_count: number;
  total_count: number;
}

const pobData = ref<POBData | null>(null);
const editableEntries = ref<Map<string, POBEntry>>(new Map());
const savingDates = ref<Set<string>>(new Set());

const activeLocationId = computed(() => locationStore.activeLocationId);
const isPeriodOpen = computed(() => periodStore.isPeriodOpen);

// Fetch POB data for current location and period
async function fetchPOBData() {
  const response = await $fetch(\`/api/locations/\${activeLocationId.value}/pob\`);
  pobData.value = response;
  initializeEditableEntries(response);
}

// Initialize entries for all dates in period
function initializeEditableEntries(data: POBData) {
  const entries = new Map<string, POBEntry>();
  const startDate = new Date(data.period.start_date);
  const endDate = new Date(data.period.end_date);

  // Generate all dates in period
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0]!;

    // Use existing entry or create empty one
    const existingEntry = data.entries?.find((e) => {
      const entryDate = new Date(e.date).toISOString().split("T")[0]!;
      return entryDate === dateStr;
    });

    entries.set(dateStr, existingEntry || {
      date: dateStr,
      crew_count: 0,
      extra_count: 0,
      total_count: 0,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  editableEntries.value = entries;
}

// Auto-save on blur
async function saveEntry(dateStr: string) {
  if (!activeLocationId.value || !isPeriodOpen.value) return;

  const entry = editableEntries.value.get(dateStr);
  if (!entry) return;

  savingDates.value.add(dateStr);

  try {
    const response = await $fetch(\`/api/locations/\${activeLocationId.value}/pob\`, {
      method: "POST",
      body: {
        entries: [{
          date: entry.date,
          crew_count: entry.crew_count,
          extra_count: entry.extra_count,
        }],
      },
    });

    // Update summary
    if (pobData.value && response?.summary) {
      pobData.value.summary = response.summary;
    }

    toast.success("POB entry saved");
  } catch (err) {
    toast.error("Failed to save POB entry");
  } finally {
    savingDates.value.delete(dateStr);
  }
}

function handleBlur(dateStr: string) {
  updateTotal(dateStr);
  saveEntry(dateStr);
}

function updateTotal(dateStr: string) {
  const entry = editableEntries.value.get(dateStr);
  if (entry) {
    entry.total_count = entry.crew_count + entry.extra_count;
  }
}
\x3C/script>`,

  pobTableComponent: `// POB Table Component
// File: app/components/pob/POBTable.vue

<script setup lang="ts">
interface POBEntry {
  id?: string;
  date: string;
  crew_count: number;
  extra_count: number;
  total_count: number;
}

interface Props {
  entries: Map<string, POBEntry>;
  disabled?: boolean;
  savingDates?: Set<string>;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  savingDates: () => new Set(),
});

const emit = defineEmits<{
  blur: [dateStr: string];
  change: [dateStr: string];
}>();

// Table columns
const columns = [
  { key: "date", label: "Date" },
  { key: "crew_count", label: "Mandays" },
  { key: "extra_count", label: "Visitors Meals" },
  { key: "total_count", label: "Total" },
];

// Sorted dates for display
const sortedDates = computed(() => {
  return Array.from(props.entries.keys()).sort();
});

function isSaving(dateStr: string): boolean {
  return props.savingDates.has(dateStr);
}
\x3C/script>

<template>
  <UCard class="card-elevated">
    <table class="min-w-full">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key">
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="dateStr in sortedDates" :key="dateStr">
          <!-- Date -->
          <td>{{ formatDateDisplay(dateStr) }}</td>

          <!-- Crew Count -->
          <td>
            <UInput
              v-model.number="entries.get(dateStr)!.crew_count"
              type="number"
              min="0"
              :disabled="disabled || isSaving(dateStr)"
              @blur="emit('blur', dateStr)"
              @input="emit('change', dateStr)"
            />
          </td>

          <!-- Extra Count -->
          <td>
            <UInput
              v-model.number="entries.get(dateStr)!.extra_count"
              type="number"
              min="0"
              :disabled="disabled || isSaving(dateStr)"
              @blur="emit('blur', dateStr)"
              @input="emit('change', dateStr)"
            />
          </td>

          <!-- Total -->
          <td>
            <span :class="{ 'text-emerald-600': entries.get(dateStr)!.total_count > 0 }">
              {{ entries.get(dateStr)!.total_count }}
            </span>
            <UIcon v-if="isSaving(dateStr)" name="i-lucide-loader-2" class="animate-spin" />
          </td>
        </tr>
      </tbody>
    </table>
  </UCard>
</template>`,

  pobSummaryComponent: `// POB Summary Component
// File: app/components/pob/POBSummary.vue

<script setup lang="ts">
interface POBSummary {
  total_crew_count: number;
  total_extra_count: number;
  total_mandays: number;
  entries_count: number;
}

interface Period {
  name: string;
  start_date: string | Date;
  end_date: string | Date;
}

interface Props {
  period: Period;
  summary: POBSummary;
  periodDateRange?: string;
}

const props = defineProps<Props>();

const formattedDateRange = computed(() => {
  if (props.periodDateRange) return props.periodDateRange;

  const startDate = new Date(props.period.start_date);
  const endDate = new Date(props.period.end_date);
  return \`\${formatDate(startDate)} - \${formatDate(endDate)}\`;
});
\x3C/script>

<template>
  <UCard class="card-elevated">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Period Info -->
      <div class="flex items-center gap-4">
        <UIcon name="i-lucide-calendar" class="w-10 h-10 text-primary" />
        <div>
          <h3 class="text-sm text-muted">Current Period</h3>
          <p class="text-lg font-semibold">{{ period.name }}</p>
          <p class="text-sm text-muted">{{ formattedDateRange }}</p>
        </div>
      </div>

      <!-- Total Mandays Summary -->
      <div class="flex items-center gap-4">
        <UIcon name="i-lucide-users" class="w-10 h-10 text-emerald-500" />
        <div>
          <h3 class="text-sm text-muted">Total Mandays</h3>
          <p class="text-3xl font-bold text-primary">
            {{ summary.total_mandays.toLocaleString() }}
          </p>
          <p class="text-xs text-muted">
            {{ summary.total_crew_count.toLocaleString() }} crew +
            {{ summary.total_extra_count.toLocaleString() }} extra
          </p>
        </div>
      </div>
    </div>
  </UCard>
</template>`,

  errorCodes: `// POB-Related Error Codes
// Used in API responses for specific error handling

// Validation Errors (400)
VALIDATION_ERROR             // Invalid request data (Zod validation failed)
DATE_OUT_OF_PERIOD           // Entry date outside period date range
PERIOD_CLOSED                // Period not open for this location
NO_UPDATES                   // PATCH requires at least one field
MISSING_LOCATION_ID          // Location ID required in route params
MISSING_ID                   // POB ID required in route params

// Authorization Errors (401, 403)
NOT_AUTHENTICATED            // User not logged in
LOCATION_ACCESS_DENIED       // User cannot access location

// Not Found Errors (404)
POB_NOT_FOUND                // POB entry ID doesn't exist
LOCATION_NOT_FOUND           // Location doesn't exist
NO_OPEN_PERIOD               // No open period found

// Internal Errors (500)
INTERNAL_ERROR               // Unexpected server error

// Example error response:
{
  "statusCode": 400,
  "statusMessage": "Bad Request",
  "data": {
    "code": "DATE_OUT_OF_PERIOD",
    "message": "Date 2025-02-15 is outside the current period (2025-01-01 to 2025-01-31)"
  }
}`,

  businessRules: `// POB Business Rules Summary
//
// 1. Data Model
// ─────────────
// • One entry per location per day per period (unique constraint)
// • crew_count: Regular personnel on board
// • extra_count: Visitors/guests (additional meals)
// • total = crew_count + extra_count
// • All counts must be non-negative integers
//
// 2. Period Constraints
// ─────────────────────
// • Period must be OPEN to create/update entries
// • PeriodLocation status checked (not just Period status)
// • Entry date must be within period start_date to end_date
// • Cannot modify POB for closed periods
//
// 3. Location Access
// ──────────────────
// • OPERATOR: Must have explicit UserLocation assignment
// • SUPERVISOR: Has implicit access to all locations
// • ADMIN: Has implicit access to all locations
//
// 4. Upsert Pattern
// ─────────────────
// • POST endpoint creates OR updates entries
// • Based on unique key (period_id, location_id, date)
// • Simplifies frontend - no need to track create vs update
// • Supports batch updates (multiple entries per request)
//
// 5. Auto-Save UX
// ───────────────
// • Frontend saves on blur (field loses focus)
// • Shows saving indicator per date row
// • Updates summary totals after each save
// • Seamless experience - no explicit save button needed
//
// 6. Manday Cost Integration
// ──────────────────────────
// • Total mandays used in reconciliation calculations
// • MandayCost = Consumption / TotalMandays
// • Key KPI for kitchen/store efficiency
// • Requires at least one POB entry (totalMandays > 0)
//
// 7. Audit Trail
// ──────────────
// • entered_by: User who last modified the entry
// • entered_at: Original creation timestamp
// • updated_at: Last modification timestamp
//
// 8. Pre-Population
// ─────────────────
// • Frontend generates all dates in period range
// • Missing entries shown as editable zeros
// • Existing entries populated from database
// • Users can leave days as zero if no personnel`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
        POB (Persons on Board)
      </h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Daily personnel tracking, mandays calculation, and cost per manday reporting
      </p>
    </div>

    <!-- POB Model Section -->
    <section
      id="dev-section-pob-model"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('pob-model')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-users" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">POB Model</span>
        </span>
        <UIcon
          :name="isExpanded('pob-model') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('pob-model')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The POB (Persons on Board) model tracks daily personnel counts per location. This data is
          essential for calculating cost per manday in period-end reconciliations.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">POB Model</h4>
          <DeveloperCodeBlock
            :code="codeExamples.pobModel"
            language="typescript"
            filename="prisma/schema.prisma"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key Fields</h4>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">crew_count</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Regular personnel on board (employees, crew members)
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">extra_count</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Visitors, guests, or additional meals served
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">date</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Entry date (must be within period range)
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="soft" size="xs">entered_by</UBadge>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                User who last modified the entry
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Unique Constraint:</strong>
              Only one POB entry per location per day per period. The upsert pattern handles
              create-or-update automatically.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Mandays Calculation Section -->
    <section
      id="dev-section-mandays-calculation"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('mandays-calculation')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-calculator" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Mandays Calculation</span>
        </span>
        <UIcon
          :name="
            isExpanded('mandays-calculation')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('mandays-calculation')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Total mandays is the sum of all personnel (crew + extra) across all days in the period.
          This value is critical for calculating the cost per manday in reconciliation.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Mandays Calculation Explained
          </h4>
          <DeveloperCodeBlock :code="codeExamples.mandaysExplanation" language="plaintext" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Summary Statistics</h4>
          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-user-group" class="text-[var(--ui-primary)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Total Crew
                </span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Sum of crew_count across all days in the period
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-user-plus" class="text-[var(--ui-primary)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Total Extra
                </span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Sum of extra_count (visitors/guests) across all days
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-users" class="text-emerald-500" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Total Mandays
                </span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Total Crew + Total Extra (used for cost calculations)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Cost Per Manday Section -->
    <section
      id="dev-section-cost-per-manday"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('cost-per-manday')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-currency-dollar" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Cost Per Manday</span>
        </span>
        <UIcon
          :name="
            isExpanded('cost-per-manday') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('cost-per-manday')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Cost per manday is a key performance indicator that shows how much it costs to feed one
          person for one day. This is calculated by dividing total consumption by total mandays.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Manday Cost Calculation
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.mandayCostFormula"
            language="typescript"
            filename="server/utils/reconciliation.ts"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Formula Breakdown</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-success)]/30 bg-[var(--ui-bg)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="success" variant="soft">Formula</UBadge>
              </div>
              <p class="font-mono text-sm text-[var(--ui-text)]">
                MandayCost = Consumption / TotalMandays
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-primary)]/30 bg-[var(--ui-bg)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UBadge color="primary" variant="soft">Example</UBadge>
              </div>
              <p class="text-sm text-[var(--ui-text)]">
                SAR 34,500 / 2,100 = SAR 16.43 per manday
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Important:</strong>
              TotalMandays must be greater than zero. If no POB entries exist, the manday cost
              calculation will fail with a validation error.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Daily POB Entry Section -->
    <section
      id="dev-section-daily-entry"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('daily-entry')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-calendar-days" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Daily POB Entry</span>
        </span>
        <UIcon
          :name="isExpanded('daily-entry') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('daily-entry')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The POB entry page allows users to input daily personnel counts for the current period.
          Entries are auto-saved on field blur for a seamless experience.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Page Implementation</h4>
          <DeveloperCodeBlock
            :code="codeExamples.frontendPage"
            language="vue"
            filename="app/pages/pob.vue"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key UX Features</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-arrow-path" class="text-[var(--ui-primary)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Auto-Save
                </span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Entries save automatically when field loses focus (blur event)
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-calendar" class="text-[var(--ui-primary)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Pre-Populated Dates
                </span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                All dates in period shown as editable rows (zeros for missing entries)
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-arrow-trending-up" class="text-[var(--ui-primary)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Live Summary
                </span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Total mandays updated after each save
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="mb-2 flex items-center gap-2">
                <UIcon name="i-heroicons-shield-check" class="text-[var(--ui-primary)]" />
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Period Validation
                </span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)]">
                Editing disabled when period is not open
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- API Endpoints Section -->
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
          :name="
            isExpanded('api-endpoints') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('api-endpoints')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The POB system provides RESTful API endpoints for fetching, creating, and updating POB
          entries.
        </p>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Endpoint Summary</h4>
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
                  <td class="px-2 py-2 font-mono text-xs">/api/locations/:id/pob</td>
                  <td class="px-2 py-2">Get POB entries for location</td>
                </tr>
                <tr class="border-b border-[var(--ui-border)]">
                  <td class="px-2 py-2">
                    <UBadge color="success" variant="soft" size="xs">POST</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/locations/:id/pob</td>
                  <td class="px-2 py-2">Create/update POB entries (upsert)</td>
                </tr>
                <tr>
                  <td class="px-2 py-2">
                    <UBadge color="warning" variant="soft" size="xs">PATCH</UBadge>
                  </td>
                  <td class="px-2 py-2 font-mono text-xs">/api/pob/:id</td>
                  <td class="px-2 py-2">Update single POB entry</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">GET Endpoint</h4>
          <DeveloperCodeBlock
            :code="codeExamples.getPOBEndpoint"
            language="typescript"
            filename="server/api/locations/[id]/pob.get.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">POST Endpoint (Upsert)</h4>
          <DeveloperCodeBlock
            :code="codeExamples.postPOBEndpoint"
            language="typescript"
            filename="server/api/locations/[id]/pob.post.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">PATCH Endpoint</h4>
          <DeveloperCodeBlock
            :code="codeExamples.patchPOBEndpoint"
            language="typescript"
            filename="server/api/pob/[id].patch.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Error Codes</h4>
          <DeveloperCodeBlock :code="codeExamples.errorCodes" language="typescript" />
        </div>
      </div>
    </section>

    <!-- Frontend Components Section -->
    <section
      id="dev-section-frontend-components"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('frontend-components')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-puzzle-piece" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Frontend Components</span>
        </span>
        <UIcon
          :name="
            isExpanded('frontend-components')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('frontend-components')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The POB UI consists of reusable components for displaying the summary and entry table.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">POB Table Component</h4>
          <DeveloperCodeBlock
            :code="codeExamples.pobTableComponent"
            language="vue"
            filename="app/components/pob/POBTable.vue"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">POB Summary Component</h4>
          <DeveloperCodeBlock
            :code="codeExamples.pobSummaryComponent"
            language="vue"
            filename="app/components/pob/POBSummary.vue"
          />
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
          Summary of all business rules governing POB data entry, validation, and usage.
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
                <strong>One entry per location per day</strong>
                - Unique constraint enforced at database level
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Period must be OPEN</strong>
                - Both Period and PeriodLocation status checked
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Date must be within period range</strong>
                - Validated against period start_date and end_date
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Non-negative integers only</strong>
                - Crew and extra counts validated as non-negative
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Location access required</strong>
                - Operators need explicit UserLocation assignment
              </span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span class="text-[var(--ui-text-muted)]">
                <strong>Used in reconciliation</strong>
                - Total mandays required for cost-per-manday calculation
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
