<script setup lang="ts">
import { formatDate } from "~/utils/format";

// SEO
useSeoMeta({
  title: "POB Entry - Stock Management System",
  description: "Personnel On Board daily entry",
});

// Composables
const locationStore = useLocationStore();
const periodStore = usePeriodStore();
const toast = useAppToast();

// Types
interface POBEntry {
  id?: string;
  date: string;
  crew_count: number;
  extra_count: number;
  total_count: number;
  enterer?: {
    full_name: string;
  };
  entered_at?: string;
  updated_at?: string;
}

interface POBData {
  location: {
    id: string;
    code: string;
    name: string;
  };
  period: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  entries: POBEntry[];
  summary: {
    total_crew_count: number;
    total_extra_count: number;
    total_mandays: number;
    entries_count: number;
  };
}

// State
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const pobData = ref<POBData | null>(null);
const editableEntries = ref<Map<string, POBEntry>>(new Map());
const savingDates = ref<Set<string>>(new Set());

// Computed
const activeLocationId = computed(() => locationStore.activeLocationId);
const currentPeriod = computed(() => periodStore.currentPeriod);
const isPeriodOpen = computed(() => periodStore.isPeriodOpen);

// Table columns
const columns = [
  {
    key: "date",
    label: "Date",
    class: "font-medium",
  },
  {
    key: "crew_count",
    label: "Crew Count",
    class: "text-center",
  },
  {
    key: "extra_count",
    label: "Extra Count",
    class: "text-center",
  },
  {
    key: "total_count",
    label: "Total",
    class: "text-center font-semibold",
  },
];

// Watch for location changes
watch(activeLocationId, async (newLocationId) => {
  if (newLocationId) {
    await fetchPOBData();
  }
});

// Fetch POB data on mount
onMounted(async () => {
  if (!currentPeriod.value) {
    await periodStore.fetchCurrentPeriod();
  }
  if (activeLocationId.value) {
    await fetchPOBData();
  }
});

/**
 * Fetch POB data for current location and period
 */
async function fetchPOBData() {
  if (!activeLocationId.value) {
    error.value = "No location selected";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await $fetch<POBData>(
      `/api/locations/${activeLocationId.value}/pob`,
      {
        method: "GET",
      }
    );

    pobData.value = response;

    // Initialize editable entries with all dates in period
    initializeEditableEntries(response);
  } catch (err: any) {
    console.error("Error fetching POB data:", err);
    const errorMessage = err?.data?.message || "Failed to fetch POB data";
    error.value = errorMessage;
    toast.error(errorMessage);
  } finally {
    loading.value = false;
  }
}

/**
 * Initialize editable entries for all dates in period
 */
function initializeEditableEntries(data: POBData) {
  const entries = new Map<string, POBEntry>();

  // Generate all dates in period
  const startDate = new Date(data.period.start_date);
  const endDate = new Date(data.period.end_date);
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0]!;

    // Check if we have an existing entry for this date
    const existingEntry = data.entries.find((e) => {
      const entryDate = new Date(e.date).toISOString().split("T")[0]!;
      return entryDate === dateStr;
    });

    if (existingEntry) {
      entries.set(dateStr, { ...existingEntry });
    } else {
      // Create empty entry
      entries.set(dateStr, {
        date: dateStr,
        crew_count: 0,
        extra_count: 0,
        total_count: 0,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  editableEntries.value = entries;
}

/**
 * Update total count when crew or extra count changes
 */
function updateTotal(dateStr: string) {
  const entry = editableEntries.value.get(dateStr);
  if (entry) {
    entry.total_count = entry.crew_count + entry.extra_count;
  }
}

/**
 * Save a single POB entry (auto-save on blur)
 */
async function saveEntry(dateStr: string) {
  if (!activeLocationId.value || !isPeriodOpen.value) {
    return;
  }

  const entry = editableEntries.value.get(dateStr);
  if (!entry) {
    return;
  }

  // Validate non-negative integers
  if (entry.crew_count < 0 || entry.extra_count < 0) {
    toast.error("Crew and extra counts must be non-negative");
    return;
  }

  // Check if values are integers
  if (!Number.isInteger(entry.crew_count) || !Number.isInteger(entry.extra_count)) {
    toast.error("Crew and extra counts must be whole numbers");
    return;
  }

  savingDates.value.add(dateStr);

  try {
    const response = await $fetch(
      `/api/locations/${activeLocationId.value}/pob`,
      {
        method: "POST",
        body: {
          entries: [
            {
              date: entry.date,
              crew_count: entry.crew_count,
              extra_count: entry.extra_count,
            },
          ],
        },
      }
    );

    // Update POB data with new summary
    if (pobData.value && response.summary) {
      pobData.value.summary = response.summary;
    }

    toast.success("POB entry saved");
  } catch (err: any) {
    console.error("Error saving POB entry:", err);
    const errorMessage = err?.data?.message || "Failed to save POB entry";
    toast.error(errorMessage);
  } finally {
    savingDates.value.delete(dateStr);
  }
}

/**
 * Handle input blur event
 */
function handleBlur(dateStr: string) {
  updateTotal(dateStr);
  saveEntry(dateStr);
}

/**
 * Handle input change
 */
function handleChange(dateStr: string) {
  updateTotal(dateStr);
}

/**
 * Check if date is being saved
 */
function isSaving(dateStr: string): boolean {
  return savingDates.value.has(dateStr);
}

/**
 * Format date for display
 */
function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });
  const formatted = formatDate(dateStr);
  return `${dayOfWeek}, ${formatted}`;
}

/**
 * Get sorted dates array
 */
const sortedDates = computed(() => {
  return Array.from(editableEntries.value.keys()).sort();
});
</script>

<template>
  <div class="p-4 md:p-6">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-[var(--ui-text)]">POB Entry</h1>
      <p class="text-sm text-[var(--ui-text-muted)] mt-1">
        Personnel On Board - Daily headcount entry
      </p>
    </div>

    <!-- Period Info -->
    <div v-if="currentPeriod" class="mb-6">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-[var(--ui-text-muted)]">
              Current Period
            </h3>
            <p class="text-lg font-semibold text-[var(--ui-text)] mt-1">
              {{ currentPeriod.name }}
            </p>
            <p class="text-sm text-[var(--ui-text-muted)] mt-1">
              {{ periodStore.periodDateRange }}
            </p>
          </div>
          <div v-if="pobData?.summary" class="text-right">
            <h3 class="text-sm font-medium text-[var(--ui-text-muted)]">
              Total Mandays
            </h3>
            <p class="text-3xl font-bold text-[var(--ui-primary)] mt-1">
              {{ pobData.summary.total_mandays.toLocaleString() }}
            </p>
            <p class="text-xs text-[var(--ui-text-muted)] mt-1">
              {{ pobData.summary.total_crew_count.toLocaleString() }} crew +
              {{ pobData.summary.total_extra_count.toLocaleString() }} extra
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-[var(--ui-primary)]" />
      <span class="ml-3 text-[var(--ui-text-muted)]">Loading POB data...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="mb-6">
      <UAlert
        color="error"
        variant="soft"
        :title="error"
        :close-button="{ icon: 'i-heroicons-x-mark', color: 'error', variant: 'link' }"
        @close="error = null"
      />
    </div>

    <!-- No Period State -->
    <div v-else-if="!currentPeriod" class="text-center py-12">
      <UIcon name="i-heroicons-calendar-days" class="w-16 h-16 mx-auto text-[var(--ui-text-muted)]" />
      <h3 class="mt-4 text-lg font-medium text-[var(--ui-text)]">No Active Period</h3>
      <p class="mt-2 text-sm text-[var(--ui-text-muted)]">
        There is no active period to enter POB data.
      </p>
    </div>

    <!-- Period Closed State -->
    <div v-else-if="!isPeriodOpen" class="mb-6">
      <UAlert
        color="warning"
        variant="soft"
        title="Period is not open"
        description="You cannot edit POB entries for a closed period."
      />
    </div>

    <!-- POB Entry Table -->
    <div v-else-if="pobData && sortedDates.length > 0">
      <UCard>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--ui-border)]">
            <thead>
              <tr class="bg-[var(--ui-bg-elevated)]">
                <th
                  v-for="column in columns"
                  :key="column.key"
                  :class="[
                    'px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider',
                    column.class,
                  ]"
                >
                  {{ column.label }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--ui-border)]">
              <tr
                v-for="dateStr in sortedDates"
                :key="dateStr"
                :class="[
                  'hover:bg-[var(--ui-bg-elevated)] transition-colors',
                  isSaving(dateStr) ? 'opacity-50' : '',
                ]"
              >
                <!-- Date -->
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-[var(--ui-text)]">
                  {{ formatDateDisplay(dateStr) }}
                </td>

                <!-- Crew Count -->
                <td class="px-4 py-3 whitespace-nowrap text-center">
                  <UInput
                    v-model.number="editableEntries.get(dateStr)!.crew_count"
                    type="number"
                    min="0"
                    step="1"
                    :disabled="!isPeriodOpen || isSaving(dateStr)"
                    class="w-24 mx-auto"
                    @blur="handleBlur(dateStr)"
                    @input="handleChange(dateStr)"
                  />
                </td>

                <!-- Extra Count -->
                <td class="px-4 py-3 whitespace-nowrap text-center">
                  <UInput
                    v-model.number="editableEntries.get(dateStr)!.extra_count"
                    type="number"
                    min="0"
                    step="1"
                    :disabled="!isPeriodOpen || isSaving(dateStr)"
                    class="w-24 mx-auto"
                    @blur="handleBlur(dateStr)"
                    @input="handleChange(dateStr)"
                  />
                </td>

                <!-- Total -->
                <td class="px-4 py-3 whitespace-nowrap text-center text-sm font-semibold text-[var(--ui-text)]">
                  <div class="flex items-center justify-center gap-2">
                    <span>{{ editableEntries.get(dateStr)!.total_count }}</span>
                    <UIcon
                      v-if="isSaving(dateStr)"
                      name="i-heroicons-arrow-path"
                      class="w-4 h-4 animate-spin text-[var(--ui-primary)]"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <!-- Instructions -->
      <div class="mt-4">
        <UAlert
          color="primary"
          variant="soft"
          title="Auto-save enabled"
          description="POB entries are automatically saved when you move to the next field. Ensure all counts are non-negative whole numbers."
        />
      </div>
    </div>
  </div>
</template>
