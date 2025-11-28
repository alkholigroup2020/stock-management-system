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
const error = ref<string | null>(null);
const pobData = ref<POBData | null>(null);
const editableEntries = ref<Map<string, POBEntry>>(new Map());
const savingDates = ref<Set<string>>(new Set());

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

</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <LayoutPageHeader
      title="POB Entry"
      icon="i-lucide-users"
      :show-location="true"
      :show-period="true"
      location-scope="current"
    />

    <!-- Period Info with Summary -->
    <div v-if="currentPeriod && pobData?.summary">
      <POBSummary
        :period="currentPeriod"
        :summary="pobData.summary"
        :period-date-range="periodStore.periodDateRange"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" text="Loading POB data..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" :retry="fetchPOBData" />

    <!-- No Period State -->
    <div v-else-if="!currentPeriod" class="text-center py-12">
      <EmptyState
        icon="i-lucide-calendar-x"
        title="No Active Period"
        description="There is no active period to enter POB data."
      />
    </div>

    <!-- Period Closed State -->
    <UAlert
      v-else-if="!isPeriodOpen"
      color="warning"
      variant="soft"
      title="Period is not open"
      description="You cannot edit POB entries for a closed period."
    />

    <!-- POB Entry Table -->
    <div v-else-if="pobData && editableEntries.size > 0">
      <POBTable
        :entries="editableEntries"
        :disabled="!isPeriodOpen"
        :saving-dates="savingDates"
        @blur="handleBlur"
        @change="handleChange"
      />

      <!-- Instructions -->
      <UAlert
        class="mt-4"
        color="primary"
        variant="soft"
        title="Auto-save enabled"
        description="POB entries are automatically saved when you move to the next field. Ensure all counts are non-negative whole numbers."
      />
    </div>
  </div>
</template>
