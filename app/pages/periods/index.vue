<template>
  <div class="p-4 md:p-6">
    <!-- Page Header -->
    <LayoutPageHeader
      title="Period Management"
      description="Manage accounting periods for the stock management system"
      icon="i-lucide-calendar"
      :show-location="false"
      :show-period="false"
    >
      <template #actions>
        <UButton
          v-if="isAdmin"
          color="primary"
          icon="i-lucide-plus"
          @click="openCreateModal"
        >
          New Period
        </UButton>
      </template>
    </LayoutPageHeader>

    <!-- Current Period Alert -->
    <UAlert
      v-if="currentPeriod"
      color="success"
      icon="i-lucide-check-circle"
      title="Current Active Period"
      :description="`${currentPeriod.name} (${formatDateRange(currentPeriod.start_date, currentPeriod.end_date)})`"
      class="mb-6"
    />

    <!-- Periods List -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-subheading font-semibold">All Periods</h2>
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Search periods..."
            class="w-64"
          />
        </div>
      </template>

      <!-- Loading State -->
      <div v-if="pending" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
      </div>

      <!-- Error State -->
      <UAlert
        v-else-if="error"
        color="error"
        icon="i-lucide-alert-circle"
        title="Error Loading Periods"
        :description="error.message"
      />

      <!-- Empty State -->
      <div v-else-if="!filteredPeriods || filteredPeriods.length === 0" class="text-center py-12">
        <UIcon name="i-lucide-calendar-x" class="w-16 h-16 mx-auto mb-4 text-muted" />
        <h3 class="text-heading3 font-semibold mb-2">No Periods Found</h3>
        <p class="text-body text-muted mb-6">
          {{ searchQuery ? "No periods match your search." : "Get started by creating your first period." }}
        </p>
        <UButton
          v-if="isAdmin && !searchQuery"
          color="primary"
          icon="i-lucide-plus"
          @click="openCreateModal"
        >
          Create First Period
        </UButton>
      </div>

      <!-- Periods Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-[var(--ui-bg)] border-b border-[var(--ui-border)]">
            <tr>
              <th class="text-left py-3 px-4 text-label font-medium">Period Name</th>
              <th class="text-left py-3 px-4 text-label font-medium">Date Range</th>
              <th class="text-left py-3 px-4 text-label font-medium">Status</th>
              <th class="text-left py-3 px-4 text-label font-medium">Locations</th>
              <th class="text-right py-3 px-4 text-label font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)]">
            <tr
              v-for="period in filteredPeriods"
              :key="period.id"
              class="hover:bg-[var(--ui-bg-elevated)] transition-colors"
            >
              <!-- Period Name -->
              <td class="py-4 px-4">
                <div class="font-medium">{{ period.name }}</div>
              </td>

              <!-- Date Range -->
              <td class="py-4 px-4">
                <div class="text-body">
                  {{ formatDateRange(period.start_date, period.end_date) }}
                </div>
              </td>

              <!-- Status -->
              <td class="py-4 px-4">
                <UBadge
                  :color="getStatusColor(period.status) as any"
                  variant="subtle"
                  size="md"
                >
                  {{ period.status }}
                </UBadge>
              </td>

              <!-- Locations -->
              <td class="py-4 px-4">
                <div class="text-body">
                  {{ period.period_locations?.length || 0 }} locations
                </div>
              </td>

              <!-- Actions -->
              <td class="py-4 px-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-tag"
                    size="sm"
                    @click="goToPrices(period.id)"
                  >
                    Prices
                  </UButton>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-eye"
                    size="sm"
                    @click="viewDetails(period.id)"
                  >
                    View
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Create Period Modal -->
    <UModal v-model="showCreateModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-heading3 font-semibold">Create New Period</h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="sm"
              @click="closeCreateModal"
            />
          </div>
        </template>

        <form @submit.prevent="handleCreatePeriod">
          <div class="space-y-6">
            <!-- Period Name -->
            <div>
              <label for="period-name" class="form-label">
                Period Name
                <span class="text-error">*</span>
              </label>
              <UInput
                id="period-name"
                v-model="createForm.name"
                placeholder="e.g., January 2025"
                size="lg"
                :disabled="isCreating"
                :error="!!createErrors.name"
              />
              <p v-if="createErrors.name" class="mt-1 text-caption text-error">
                {{ createErrors.name }}
              </p>
            </div>

            <!-- Start Date -->
            <div>
              <label for="start-date" class="form-label">
                Start Date
                <span class="text-error">*</span>
              </label>
              <UInput
                id="start-date"
                v-model="createForm.start_date"
                type="date"
                size="lg"
                :disabled="isCreating"
                :error="!!createErrors.start_date"
              />
              <p v-if="createErrors.start_date" class="mt-1 text-caption text-error">
                {{ createErrors.start_date }}
              </p>
            </div>

            <!-- End Date -->
            <div>
              <label for="end-date" class="form-label">
                End Date
                <span class="text-error">*</span>
              </label>
              <UInput
                id="end-date"
                v-model="createForm.end_date"
                type="date"
                size="lg"
                :disabled="isCreating"
                :error="!!createErrors.end_date"
              />
              <p v-if="createErrors.end_date" class="mt-1 text-caption text-error">
                {{ createErrors.end_date }}
              </p>
            </div>

            <!-- Status -->
            <div>
              <label for="status" class="form-label">
                Initial Status
                <span class="text-error">*</span>
              </label>
              <USelectMenu
                v-model="createForm.status"
                :items="statusOptions"
                value-key="value"
                placeholder="Select status"
                size="lg"
                :disabled="isCreating"
              />
              <p class="mt-1 text-caption text-muted">
                DRAFT periods can be edited before opening. OPEN periods are immediately active.
              </p>
            </div>

            <!-- Info Alert -->
            <UAlert
              v-if="previousPeriodInfo"
              color="primary"
              icon="i-lucide-info"
              :title="previousPeriodInfo.title"
              :description="previousPeriodInfo.description"
            />
          </div>
        </form>

        <template #footer>
          <div class="flex items-center justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              @click="closeCreateModal"
              :disabled="isCreating"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              icon="i-lucide-plus"
              :loading="isCreating"
              @click="handleCreatePeriod"
            >
              Create Period
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "role",
});

const router = useRouter();
const toast = useToast();

// Auth
const { user } = useAuth();
const isAdmin = computed(() => user.value?.role === "ADMIN");

// Search
const searchQuery = ref("");

// Fetch periods
const { data: periods, pending, error, refresh } = await useFetch("/api/periods", {
  method: "GET",
});

// Get current period
const { data: currentPeriodData } = await useFetch("/api/periods/current", {
  method: "GET",
});

const currentPeriod = computed(() => currentPeriodData.value?.period);

// Filtered periods
const filteredPeriods = computed(() => {
  if (!periods.value?.periods) return [];

  const query = searchQuery.value.toLowerCase();
  if (!query) return periods.value.periods;

  return periods.value.periods.filter((p: any) =>
    p.name.toLowerCase().includes(query) ||
    p.status.toLowerCase().includes(query)
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

  const sortedPeriods = closedPeriods.sort((a: any, b: any) =>
    new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
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

function getStatusColor(status: string): string {
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
  // TODO: Implement period details page
  toast.add({
    title: "Coming Soon",
    description: "Period details page will be implemented in the next phase",
    color: "primary",
  });
}
</script>
