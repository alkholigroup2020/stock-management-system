<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-calendar" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Periods</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Manage accounting periods and price locking
          </p>
        </div>
      </div>
      <UButton
        v-if="isAdmin"
        color="primary"
        icon="i-lucide-plus"
        size="lg"
        class="cursor-pointer rounded-full px-3 sm:px-6"
        @click="openCreateModal"
      >
        <span class="hidden sm:inline">New Period</span>
        <span class="sm:hidden">New</span>
      </UButton>
    </div>

    <!-- Current Period Alert -->
    <UAlert
      v-if="currentPeriod"
      color="success"
      icon="i-lucide-check-circle"
      title="Current Active Period"
      :description="`${currentPeriod.name} (${formatDateRange(currentPeriod.start_date, currentPeriod.end_date)})`"
    />

    <!-- Search Filter -->
    <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
      <div class="flex items-center gap-3">
        <div class="flex-1 min-w-0 max-w-md">
          <UInput
            v-model="searchQuery"
            placeholder="Search periods by name..."
            icon="i-lucide-search"
            size="lg"
            class="w-full"
          />
        </div>
      </div>
    </UCard>

    <!-- Loading State -->
    <div v-if="pending" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading periods..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error.message" @retry="refresh" />

    <!-- Empty State -->
    <EmptyState
      v-else-if="!filteredPeriods || filteredPeriods.length === 0"
      icon="i-lucide-calendar-x"
      :title="searchQuery ? 'No periods found' : 'No periods yet'"
      :description="
        searchQuery
          ? 'No periods match your search. Try adjusting your search term.'
          : 'Get started by creating your first accounting period.'
      "
    >
      <template v-if="isAdmin && !searchQuery" #actions>
        <UButton
          color="primary"
          icon="i-lucide-plus"
          class="cursor-pointer"
          @click="openCreateModal"
        >
          Create First Period
        </UButton>
      </template>
    </EmptyState>

    <!-- Periods Table -->
    <UCard v-else class="card-elevated" :ui="{ body: 'p-0' }">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-[var(--ui-border)]">
          <thead>
            <tr class="bg-[var(--ui-bg-elevated)]">
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Period Name</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Date Range</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Status</th>
              <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Locations</th>
              <th class="px-4 py-3 text-right text-label uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)]">
            <tr
              v-for="period in filteredPeriods"
              :key="period.id"
              class="hover:bg-[var(--ui-bg-elevated)] transition-colors cursor-pointer"
              @click="viewDetails(period.id)"
            >
              <!-- Period Name -->
              <td class="px-4 py-4 text-[var(--ui-text)] font-medium">
                {{ period.name }}
              </td>

              <!-- Date Range -->
              <td class="px-4 py-4 text-caption">
                {{ formatDateRange(period.start_date, period.end_date) }}
              </td>

              <!-- Status -->
              <td class="px-4 py-4">
                <UBadge :color="getStatusColor(period.status)" variant="subtle" size="md">
                  {{ period.status }}
                </UBadge>
              </td>

              <!-- Locations -->
              <td class="px-4 py-4 text-caption">
                {{ period.period_locations?.length || 0 }} locations
              </td>

              <!-- Actions -->
              <td class="px-4 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-tag"
                    size="sm"
                    class="cursor-pointer"
                    @click.stop="goToPrices(period.id)"
                  >
                    <span class="hidden sm:inline">Prices</span>
                  </UButton>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-eye"
                    size="sm"
                    class="cursor-pointer"
                    @click.stop="viewDetails(period.id)"
                  >
                    <span class="hidden sm:inline">View</span>
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Create Period Modal -->
    <UModal v-model:open="showCreateModal">
      <template #content>
        <UCard class="card-elevated">
          <template #header>
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-calendar-plus" class="w-6 h-6 text-primary" />
                <h3 class="text-xl font-bold text-[var(--ui-text-highlighted)]">
                  Create New Period
                </h3>
              </div>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                size="sm"
                class="cursor-pointer"
                :disabled="isCreating"
                @click="closeCreateModal"
              />
            </div>
          </template>

          <form class="space-y-6" @submit.prevent="handleCreatePeriod">
            <!-- Period Name -->
            <div>
              <label for="period-name" class="form-label mb-2 block">
                Period Name <span class="text-[var(--ui-error)]">*</span>
              </label>
              <UInput
                id="period-name"
                v-model="createForm.name"
                placeholder="e.g., January 2025"
                size="lg"
                icon="i-lucide-calendar"
                :disabled="isCreating"
                :color="createErrors.name ? 'error' : undefined"
                class="w-full"
              />
              <p v-if="createErrors.name" class="form-error mt-1">{{ createErrors.name }}</p>
              <p v-else class="text-sm text-[var(--ui-text-muted)] mt-1">
                Enter a descriptive name for this accounting period
              </p>
            </div>

            <!-- Date Range -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Start Date -->
              <div>
                <label for="start-date" class="form-label mb-2 block">
                  Start Date <span class="text-[var(--ui-error)]">*</span>
                </label>
                <UInput
                  id="start-date"
                  v-model="createForm.start_date"
                  type="date"
                  size="lg"
                  icon="i-lucide-calendar-check"
                  :disabled="isCreating"
                  :color="createErrors.start_date ? 'error' : undefined"
                  class="w-full"
                />
                <p v-if="createErrors.start_date" class="form-error mt-1">
                  {{ createErrors.start_date }}
                </p>
              </div>

              <!-- End Date -->
              <div>
                <label for="end-date" class="form-label mb-2 block">
                  End Date <span class="text-[var(--ui-error)]">*</span>
                </label>
                <UInput
                  id="end-date"
                  v-model="createForm.end_date"
                  type="date"
                  size="lg"
                  icon="i-lucide-calendar-x"
                  :disabled="isCreating"
                  :color="createErrors.end_date ? 'error' : undefined"
                  class="w-full"
                />
                <p v-if="createErrors.end_date" class="form-error mt-1">
                  {{ createErrors.end_date }}
                </p>
              </div>
            </div>

            <!-- Status Selection -->
            <div>
              <div class="space-y-2 mb-3">
                <div class="flex items-start gap-2">
                  <UIcon name="i-lucide-file-edit" class="w-4 h-4 text-warning mt-0.5" />
                  <p class="text-sm text-[var(--ui-text-muted)]">
                    <span class="font-medium">DRAFT:</span> Period can be edited before activation
                  </p>
                </div>
                <div class="flex items-start gap-2">
                  <UIcon name="i-lucide-unlock" class="w-4 h-4 text-success mt-0.5" />
                  <p class="text-sm text-[var(--ui-text-muted)]">
                    <span class="font-medium">OPEN:</span> Period is immediately active and accepts
                    transactions
                  </p>
                </div>
              </div>
              <USelectMenu
                id="status"
                v-model="createForm.status"
                :items="statusOptions"
                value-key="value"
                placeholder="Select status"
                size="lg"
                :disabled="isCreating"
                class="w-full"
              >
                <template #leading>
                  <UIcon
                    :name="createForm.status === 'DRAFT' ? 'i-lucide-file-edit' : 'i-lucide-unlock'"
                    class="w-5 h-5"
                  />
                </template>
              </USelectMenu>
            </div>

            <!-- Previous Period Info -->
            <UAlert
              v-if="previousPeriodInfo"
              color="primary"
              icon="i-lucide-info"
              :title="previousPeriodInfo.title"
            >
              <template #description>
                <p class="text-sm">{{ previousPeriodInfo.description }}</p>
              </template>
            </UAlert>
          </form>

          <template #footer>
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-[var(--ui-border)]">
              <UButton
                color="neutral"
                variant="outline"
                size="lg"
                class="cursor-pointer rounded-full px-6"
                :disabled="isCreating"
                @click="closeCreateModal"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                icon="i-lucide-check"
                size="lg"
                class="cursor-pointer rounded-full px-6"
                :loading="isCreating"
                :disabled="isCreating"
                @click="handleCreatePeriod"
              >
                Create Period
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "role",
  roleRequired: "ADMIN",
});

const router = useRouter();
const toast = useToast();

// Auth
const { user } = useAuth();
const isAdmin = computed(() => user.value?.role === "ADMIN");

// Search
const searchQuery = ref("");

// Fetch periods (single API call - current period is derived from this)
const {
  data: periods,
  pending,
  error,
  refresh,
} = await useFetch("/api/periods", {
  method: "GET",
});

// Get current period from the periods list (avoid double API call)
const currentPeriod = computed(() => {
  if (!periods.value?.periods) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return periods.value.periods.find((p: any) => p.status === "OPEN") || null;
});

// Filtered periods
const filteredPeriods = computed(() => {
  if (!periods.value?.periods) return [];

  const query = searchQuery.value.toLowerCase();
  if (!query) return periods.value.periods;

  return periods.value.periods.filter(
    (p: any) => p.name.toLowerCase().includes(query) || p.status.toLowerCase().includes(query)
  );
});

// Create period modal
const showCreateModal = ref(false);
const isCreating = ref(false);
const createForm = ref({
  name: "",
  start_date: "",
  end_date: "",
  status: "DRAFT" as "DRAFT" | "OPEN",
});
const createErrors = ref({
  name: "",
  start_date: "",
  end_date: "",
});

const statusOptions = [
  { label: "Draft", value: "DRAFT" },
  { label: "Open", value: "OPEN" },
];

// Previous period info
const previousPeriodInfo = computed(() => {
  if (!periods.value?.periods) return null;

  const closedPeriods = periods.value.periods.filter((p: any) => p.status === "CLOSED");
  if (closedPeriods.length === 0) return null;

  const sortedPeriods = closedPeriods.sort(
    (a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
  );

  const latest = sortedPeriods[0];
  if (!latest) return null;

  return {
    title: "Previous Period Found",
    description: `Opening stock values will be copied from ${latest.name} (${formatDateRange(latest.start_date, latest.end_date)})`,
  };
});

// Open/close modal
function openCreateModal() {
  // Reset form
  createForm.value = {
    name: "",
    start_date: "",
    end_date: "",
    status: "DRAFT",
  };
  createErrors.value = {
    name: "",
    start_date: "",
    end_date: "",
  };
  showCreateModal.value = true;
}

function closeCreateModal() {
  showCreateModal.value = false;
}

// Validate form
function validateForm(): boolean {
  let isValid = true;

  // Reset errors
  createErrors.value = {
    name: "",
    start_date: "",
    end_date: "",
  };

  // Validate name
  if (!createForm.value.name.trim()) {
    createErrors.value.name = "Period name is required";
    isValid = false;
  }

  // Validate start date
  if (!createForm.value.start_date) {
    createErrors.value.start_date = "Start date is required";
    isValid = false;
  }

  // Validate end date
  if (!createForm.value.end_date) {
    createErrors.value.end_date = "End date is required";
    isValid = false;
  }

  // Validate date range
  if (createForm.value.start_date && createForm.value.end_date) {
    const startDate = new Date(createForm.value.start_date);
    const endDate = new Date(createForm.value.end_date);

    if (endDate <= startDate) {
      createErrors.value.end_date = "End date must be after start date";
      isValid = false;
    }
  }

  return isValid;
}

// Create period
async function handleCreatePeriod() {
  if (!validateForm()) return;

  isCreating.value = true;

  try {
    const response = await $fetch("/api/periods", {
      method: "POST",
      body: {
        name: createForm.value.name.trim(),
        start_date: createForm.value.start_date,
        end_date: createForm.value.end_date,
        status: createForm.value.status,
      },
    });

    toast.add({
      title: "Success",
      description: "Period created successfully",
      color: "success",
      icon: "i-lucide-check",
    });

    // Refresh periods list
    await refresh();

    // Close modal
    closeCreateModal();
  } catch (err: any) {
    console.error("Error creating period:", err);

    toast.add({
      title: "Error",
      description: err.data?.message || "Failed to create period",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    isCreating.value = false;
  }
}

// Helper functions
function formatDateRange(startDate: string | Date, endDate: string | Date): string {
  const start = new Date(startDate).toLocaleDateString("en-GB");
  const end = new Date(endDate).toLocaleDateString("en-GB");
  return `${start} - ${end}`;
}

type BadgeColor = "error" | "info" | "success" | "primary" | "secondary" | "warning" | "neutral";

function getStatusColor(status: string): BadgeColor {
  switch (status) {
    case "OPEN":
      return "success";
    case "DRAFT":
      return "warning";
    case "CLOSED":
      return "neutral";
    case "PENDING_CLOSE":
      return "primary";
    case "APPROVED":
      return "primary";
    default:
      return "neutral";
  }
}

function goToPrices(periodId: string) {
  router.push(`/periods/${periodId}/prices`);
}

function viewDetails(periodId: string) {
  router.push(`/periods/${periodId}`);
}
</script>
