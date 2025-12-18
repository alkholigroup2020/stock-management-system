<script setup lang="ts">
// Explicit component imports
import POBSummary from "~/components/pob/POBSummary.vue";
import POBTable from "~/components/pob/POBTable.vue";

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
  location?: {
    id: string;
    code: string;
    name: string;
  };
  period?: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  entries: POBEntry[];
  summary?: {
    total_crew_count: number;
    total_extra_count: number;
    total_mandays: number;
    entries_count: number;
  };
}

// State
const loading = ref(false);
const error = ref<string | null>(null);
const pobData = ref<POBData | null>(null);
const editableEntries = ref<Map<string, POBEntry>>(new Map());
const savingDates = ref<Set<string>>(new Set());
const apiNotReady = ref(false);

// Computed
const activeLocationId = computed(() => locationStore.activeLocationId);
const currentPeriod = computed(() => periodStore.currentPeriod);
const isPeriodOpen = computed(() => periodStore.isPeriodOpen);

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
  apiNotReady.value = false;

  try {
    const response = await $fetch<POBData>(`/api/locations/${activeLocationId.value}/pob`, {
      method: "GET",
    });

    pobData.value = response;

    // Initialize editable entries with all dates in period
    if (response?.period) {
      initializeEditableEntries(response);
    }
  } catch (err: unknown) {
    console.error("Error fetching POB data:", err);

    // Check if API endpoint doesn't exist (404)
    const errorObj = err as { statusCode?: number; data?: { message?: string } };
    if (errorObj?.statusCode === 404) {
      apiNotReady.value = true;
      error.value = null; // Don't show as error, show as info
    } else {
      const errorMessage = errorObj?.data?.message || "Failed to fetch POB data";
      error.value = errorMessage;
      toast.error(errorMessage);
    }
  } finally {
    loading.value = false;
  }
}

/**
 * Initialize editable entries for all dates in period
 */
function initializeEditableEntries(data: POBData) {
  const entries = new Map<string, POBEntry>();

  // Ensure period data exists
  if (!data.period?.start_date || !data.period?.end_date) {
    console.warn("Period data missing, cannot initialize entries");
    editableEntries.value = entries;
    return;
  }

  // Generate all dates in period
  const startDate = new Date(data.period.start_date);
  const endDate = new Date(data.period.end_date);
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0]!;

    // Check if we have an existing entry for this date
    const existingEntry = data.entries?.find((e) => {
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
    const response = await $fetch<POBData>(`/api/locations/${activeLocationId.value}/pob`, {
      method: "post",
      body: {
        entries: [
          {
            date: entry.date,
            crew_count: entry.crew_count,
            extra_count: entry.extra_count,
          },
        ],
      },
    });

    // Update POB data with new summary
    if (pobData.value && response?.summary) {
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
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-users" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">POB Entry</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Personnel On Board daily entry for
            {{ pobData?.location?.name || locationStore.activeLocation?.name || "current location" }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" text="Loading POB data..." />
    </div>

    <!-- API Not Ready State -->
    <UCard v-else-if="apiNotReady" class="card-elevated">
      <div class="flex flex-col items-center justify-center py-8 text-center">
        <UIcon name="i-lucide-construction" class="w-12 h-12 text-amber-500 mb-4" />
        <h3 class="text-lg font-semibold text-[var(--ui-text)]">Feature Coming Soon</h3>
        <p class="text-sm text-[var(--ui-text-muted)] mt-2 max-w-md">
          The POB (Personnel On Board) tracking feature is not yet available. This feature will
          allow you to record daily crew and extra personnel counts for mandays calculation.
        </p>
        <UButton
          to="/"
          color="primary"
          variant="soft"
          class="mt-4 cursor-pointer"
          icon="i-lucide-arrow-left"
        >
          Back to Dashboard
        </UButton>
      </div>
    </UCard>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" :retry="fetchPOBData" />

    <!-- No Location Selected State -->
    <EmptyState
      v-else-if="!activeLocationId"
      icon="i-lucide-map-pin-off"
      title="No Location Selected"
      description="Please select a location from the header to view POB data."
    />

    <!-- No Period State -->
    <EmptyState
      v-else-if="!currentPeriod"
      icon="i-lucide-calendar-x"
      title="No Active Period"
      description="There is no active period to enter POB data."
    />

    <!-- Period Closed State -->
    <UAlert
      v-else-if="!isPeriodOpen"
      color="warning"
      variant="soft"
      icon="i-lucide-lock"
      title="Period is not open"
      description="You cannot edit POB entries for a closed period."
    />

    <!-- POB Entry Content -->
    <template v-else-if="pobData">
      <!-- Period Info with Summary -->
      <POBSummary
        v-if="currentPeriod && pobData.summary"
        :period="currentPeriod"
        :summary="pobData.summary"
        :period-date-range="periodStore.periodDateRange"
      />

      <!-- POB Entry Table -->
      <POBTable
        v-if="editableEntries.size > 0"
        :entries="editableEntries"
        :disabled="!isPeriodOpen"
        :saving-dates="savingDates"
        @blur="handleBlur"
        @change="handleChange"
      />

      <!-- No Entries State - when data loaded but no entries available -->
      <EmptyState
        v-else-if="!editableEntries.size"
        icon="i-lucide-calendar-x"
        title="No Entries Available"
        description="No POB entries are available for the current period. Please check if the period is configured correctly."
      />

      <!-- Instructions - only show when there are entries to edit -->
      <UAlert
        v-if="editableEntries.size > 0"
        color="primary"
        variant="soft"
        icon="i-lucide-info"
        title="Auto-save enabled"
        description="POB entries are automatically saved when you move to the next field. Ensure all counts are non-negative whole numbers."
      />
    </template>
  </div>
</template>
