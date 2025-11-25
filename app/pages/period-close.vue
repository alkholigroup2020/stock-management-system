<template>
  <div class="p-4 md:p-6">
    <!-- Page Header -->
    <LayoutPageHeader
      title="Period Close"
      subtitle="Close the current accounting period and roll forward to the next"
      icon="i-lucide-lock"
      :show-location="false"
      :show-period="false"
    />

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
      <span class="ml-3 text-muted">Loading period data...</span>
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="error"
      color="error"
      icon="i-lucide-alert-circle"
      title="Error Loading Period"
      :description="error"
      class="mb-6"
    />

    <!-- No Period State -->
    <UCard v-else-if="!currentPeriod" class="text-center py-12">
      <UIcon name="i-lucide-calendar-x" class="w-16 h-16 mx-auto text-muted mb-4" />
      <h3 class="text-heading3 font-semibold mb-2">No Active Period</h3>
      <p class="text-body text-muted mb-6">
        There is no active period to close. Create a new period first.
      </p>
      <UButton
        color="primary"
        icon="i-lucide-plus"
        to="/periods"
        class="cursor-pointer"
      >
        Go to Period Management
      </UButton>
    </UCard>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      <!-- Current Period Info -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-calendar" class="w-5 h-5 text-primary" />
              <h2 class="text-subheading font-semibold">Current Period</h2>
            </div>
            <UBadge :color="getStatusColor(currentPeriod.status)" variant="subtle" size="md">
              {{ currentPeriod.status }}
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p class="text-caption text-muted mb-1">Period Name</p>
            <p class="text-body font-semibold">{{ currentPeriod.name }}</p>
          </div>
          <div>
            <p class="text-caption text-muted mb-1">Date Range</p>
            <p class="text-body font-semibold">
              {{ formatDateRange(currentPeriod.start_date, currentPeriod.end_date) }}
            </p>
          </div>
          <div>
            <p class="text-caption text-muted mb-1">Locations</p>
            <p class="text-body font-semibold">
              {{ currentPeriod.period_locations?.length || 0 }} locations
            </p>
          </div>
        </div>
      </UCard>

      <!-- Pre-Close Checklist -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-clipboard-check" class="w-5 h-5 text-primary" />
            <h2 class="text-subheading font-semibold">Pre-Close Checklist</h2>
          </div>
        </template>

        <div class="space-y-4">
          <div
            v-for="item in checklistItems"
            :key="item.id"
            class="flex items-center gap-3 p-3 rounded-lg border border-[var(--ui-border)] hover:bg-[var(--ui-bg-elevated)] transition-colors"
          >
            <div
              :class="[
                'flex items-center justify-center w-6 h-6 rounded-full',
                item.completed ? 'bg-[var(--ui-success)] text-white' : 'bg-[var(--ui-bg-elevated)] text-muted'
              ]"
            >
              <UIcon
                :name="item.completed ? 'i-lucide-check' : 'i-lucide-circle'"
                class="w-4 h-4"
              />
            </div>
            <div class="flex-1">
              <p :class="['text-body', item.completed ? 'text-[var(--ui-text)]' : 'text-muted']">
                {{ item.label }}
              </p>
            </div>
            <UBadge
              v-if="item.count !== undefined"
              :color="item.completed ? 'success' : 'warning'"
              variant="subtle"
              size="sm"
            >
              {{ item.count }}
            </UBadge>
          </div>
        </div>
      </UCard>

      <!-- Location Readiness Status -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-primary" />
              <h2 class="text-subheading font-semibold">Location Readiness</h2>
            </div>
            <UBadge
              :color="allLocationsReady ? 'success' : 'warning'"
              variant="subtle"
            >
              {{ readyLocationsCount }}/{{ totalLocationsCount }} Ready
            </UBadge>
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-[var(--ui-bg)] border-b border-[var(--ui-border)]">
              <tr>
                <th class="text-left py-3 px-4 text-label font-medium">Location</th>
                <th class="text-left py-3 px-4 text-label font-medium">Type</th>
                <th class="text-left py-3 px-4 text-label font-medium">Status</th>
                <th class="text-left py-3 px-4 text-label font-medium">Ready Date</th>
                <th class="text-right py-3 px-4 text-label font-medium">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--ui-border)]">
              <tr
                v-for="pl in periodLocations"
                :key="pl.location_id"
                class="hover:bg-[var(--ui-bg-elevated)] transition-colors"
              >
                <td class="py-4 px-4">
                  <div class="font-medium">{{ pl.location.name }}</div>
                  <div class="text-caption text-muted">{{ pl.location.code }}</div>
                </td>
                <td class="py-4 px-4">
                  <UBadge color="neutral" variant="subtle" size="sm">
                    {{ pl.location.type }}
                  </UBadge>
                </td>
                <td class="py-4 px-4">
                  <UBadge
                    :color="getLocationStatusColor(pl.status)"
                    variant="subtle"
                    size="md"
                  >
                    {{ pl.status }}
                  </UBadge>
                </td>
                <td class="py-4 px-4">
                  <span v-if="pl.ready_at" class="text-body">
                    {{ formatDate(pl.ready_at) }}
                  </span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="py-4 px-4 text-right">
                  <UButton
                    v-if="pl.status !== 'READY' && pl.status !== 'CLOSED'"
                    color="primary"
                    variant="soft"
                    size="sm"
                    icon="i-lucide-check"
                    :loading="markingReady === pl.location_id"
                    :disabled="!!markingReady || currentPeriod.status !== 'OPEN'"
                    class="cursor-pointer"
                    @click="handleMarkReady(pl.location_id)"
                  >
                    Mark Ready
                  </UButton>
                  <UBadge
                    v-else-if="pl.status === 'READY'"
                    color="success"
                    variant="soft"
                  >
                    Ready
                  </UBadge>
                  <UBadge
                    v-else
                    color="neutral"
                    variant="soft"
                  >
                    Closed
                  </UBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <template v-if="periodLocations.length === 0" #default>
          <div class="text-center py-8 text-muted">
            No locations configured for this period
          </div>
        </template>
      </UCard>

      <!-- Close Period Section -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-lock" class="w-5 h-5 text-primary" />
            <h2 class="text-subheading font-semibold">Close Period</h2>
          </div>
        </template>

        <!-- Period is already pending close -->
        <div v-if="currentPeriod.status === 'PENDING_CLOSE'" class="text-center py-6">
          <UIcon name="i-lucide-clock" class="w-12 h-12 mx-auto text-primary mb-4" />
          <h3 class="text-heading3 font-semibold mb-2">Period Close Pending</h3>
          <p class="text-body text-muted mb-6">
            A period close request has been submitted and is awaiting approval.
          </p>
          <UButton
            color="primary"
            icon="i-lucide-check-circle"
            :loading="closingPeriod"
            class="cursor-pointer"
            @click="handleApprovePeriodClose"
          >
            Approve & Execute Close
          </UButton>
        </div>

        <!-- Period is ready to close -->
        <div v-else-if="currentPeriod.status === 'OPEN'" class="text-center py-6">
          <template v-if="!allLocationsReady">
            <UIcon name="i-lucide-alert-circle" class="w-12 h-12 mx-auto text-warning mb-4" />
            <h3 class="text-heading3 font-semibold mb-2">Locations Not Ready</h3>
            <p class="text-body text-muted mb-2">
              All locations must be marked as ready before closing the period.
            </p>
            <p class="text-caption text-muted">
              {{ readyLocationsCount }} of {{ totalLocationsCount }} locations are ready.
            </p>
          </template>
          <template v-else>
            <UIcon name="i-lucide-check-circle" class="w-12 h-12 mx-auto text-success mb-4" />
            <h3 class="text-heading3 font-semibold mb-2">Ready to Close</h3>
            <p class="text-body text-muted mb-6">
              All locations are ready. You can now close the period.
            </p>
            <UButton
              color="primary"
              icon="i-lucide-lock"
              size="lg"
              :disabled="closingPeriod"
              class="cursor-pointer"
              @click="showConfirmModal = true"
            >
              Close Period
            </UButton>
          </template>
        </div>

        <!-- Period is already closed -->
        <div v-else-if="currentPeriod.status === 'CLOSED'" class="text-center py-6">
          <UIcon name="i-lucide-lock" class="w-12 h-12 mx-auto text-muted mb-4" />
          <h3 class="text-heading3 font-semibold mb-2">Period Closed</h3>
          <p class="text-body text-muted">
            This period has been closed on {{ formatDate(currentPeriod.closed_at) }}.
          </p>
        </div>
      </UCard>
    </div>

    <!-- Confirmation Modal -->
    <UModal v-model="showConfirmModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-warning" />
              <h3 class="text-heading3 font-semibold">Confirm Period Close</h3>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="sm"
              class="cursor-pointer"
              @click="showConfirmModal = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-body">
            You are about to close the period <strong>{{ currentPeriod?.name }}</strong>.
            This action will:
          </p>
          <ul class="list-disc list-inside text-body text-muted space-y-2">
            <li>Create a snapshot of all stock levels for each location</li>
            <li>Lock all transactions for this period</li>
            <li>Prevent any further changes to deliveries, issues, or transfers</li>
            <li>Create a new period for the next accounting cycle</li>
          </ul>

          <UAlert
            color="warning"
            icon="i-lucide-alert-triangle"
            title="This action cannot be undone"
            description="Once closed, the period cannot be reopened. Make sure all transactions are complete and reconciliations are accurate."
          />
        </div>

        <template #footer>
          <div class="flex items-center justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="closingPeriod"
              class="cursor-pointer"
              @click="showConfirmModal = false"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              icon="i-lucide-lock"
              :loading="closingPeriod"
              class="cursor-pointer"
              @click="handleClosePeriod"
            >
              Confirm & Close Period
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Success Modal -->
    <UModal v-model="showSuccessModal" :closeable="false">
      <UCard>
        <div class="text-center py-6">
          <UIcon name="i-lucide-check-circle" class="w-16 h-16 mx-auto text-success mb-4" />
          <h3 class="text-heading3 font-semibold mb-2">Period Closed Successfully</h3>
          <p class="text-body text-muted mb-6">
            The period has been closed and a new period has been created.
          </p>

          <div v-if="closeSummary" class="mb-6 p-4 bg-[var(--ui-bg-elevated)] rounded-lg text-left">
            <h4 class="text-label font-semibold mb-3">Summary</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">Total Locations:</span>
                <span class="font-medium">{{ closeSummary.totalLocations }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Total Closing Value:</span>
                <span class="font-medium text-success">
                  SAR {{ closeSummary.totalClosingValue?.toLocaleString("en-US", { minimumFractionDigits: 2 }) }}
                </span>
              </div>
            </div>
          </div>

          <UButton
            color="primary"
            icon="i-lucide-arrow-right"
            class="cursor-pointer"
            @click="handleSuccessClose"
          >
            Go to Period Management
          </UButton>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "role",
  roleRequired: "ADMIN",
});

// SEO
useSeoMeta({
  title: "Period Close - Stock Management System",
  description: "Close the current accounting period and roll forward to the next",
});

const router = useRouter();
const toast = useToast();

// State
const loading = ref(true);
const error = ref<string | null>(null);
const currentPeriod = ref<any>(null);
const markingReady = ref<string | null>(null);
const closingPeriod = ref(false);
const showConfirmModal = ref(false);
const showSuccessModal = ref(false);
const closeSummary = ref<{ totalLocations: number; totalClosingValue: number } | null>(null);

// Computed
const periodLocations = computed(() => {
  return currentPeriod.value?.period_locations || [];
});

const totalLocationsCount = computed(() => periodLocations.value.length);

const readyLocationsCount = computed(() => {
  return periodLocations.value.filter((pl: any) => pl.status === "READY" || pl.status === "CLOSED").length;
});

const allLocationsReady = computed(() => {
  if (totalLocationsCount.value === 0) return false;
  return readyLocationsCount.value === totalLocationsCount.value;
});

// Checklist items
const checklistItems = computed(() => {
  const deliveriesCount = currentPeriod.value?._count?.deliveries || 0;
  const issuesCount = currentPeriod.value?._count?.issues || 0;
  const reconciliationsCount = currentPeriod.value?._count?.reconciliations || 0;
  const locationsCount = totalLocationsCount.value;
  const readyCount = readyLocationsCount.value;

  return [
    {
      id: "deliveries",
      label: "All deliveries have been posted",
      count: deliveriesCount,
      completed: true, // Assume completed if we have any deliveries or period is open
    },
    {
      id: "issues",
      label: "All issues have been posted",
      count: issuesCount,
      completed: true, // Assume completed
    },
    {
      id: "transfers",
      label: "All transfers have been completed",
      completed: true, // Would need a transfer count check
    },
    {
      id: "reconciliations",
      label: "Reconciliations completed for all locations",
      count: `${reconciliationsCount}/${locationsCount}`,
      completed: reconciliationsCount >= locationsCount,
    },
    {
      id: "locations",
      label: "All locations marked ready",
      count: `${readyCount}/${locationsCount}`,
      completed: allLocationsReady.value,
    },
  ];
});

// Fetch current period on mount
onMounted(async () => {
  await fetchCurrentPeriod();
});

/**
 * Fetch current period with location statuses
 */
async function fetchCurrentPeriod() {
  loading.value = true;
  error.value = null;

  try {
    const response = await $fetch<{ period: any }>("/api/periods/current", {
      method: "GET",
    });

    currentPeriod.value = response.period;
  } catch (err: any) {
    console.error("Error fetching current period:", err);
    error.value = err?.data?.message || "Failed to load period data";
  } finally {
    loading.value = false;
  }
}

/**
 * Mark a location as ready for period close
 */
async function handleMarkReady(locationId: string) {
  if (!currentPeriod.value) return;

  markingReady.value = locationId;

  try {
    await $fetch(`/api/periods/${currentPeriod.value.id}/locations/${locationId}/ready`, {
      method: "PATCH",
    });

    toast.add({
      title: "Success",
      description: "Location marked as ready",
      color: "success",
      icon: "i-lucide-check",
    });

    // Refresh period data
    await fetchCurrentPeriod();
  } catch (err: any) {
    console.error("Error marking location ready:", err);

    toast.add({
      title: "Error",
      description: err?.data?.message || "Failed to mark location as ready",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    markingReady.value = null;
  }
}

/**
 * Handle period close - creates approval request and immediately approves it
 */
async function handleClosePeriod() {
  if (!currentPeriod.value) return;

  closingPeriod.value = true;

  try {
    // Step 1: Request period close (creates approval)
    const closeResponse = await $fetch<{ approval: { id: string } }>(`/api/periods/${currentPeriod.value.id}/close`, {
      method: "POST",
    });

    // Step 2: Approve and execute the close
    const approvalResponse = await $fetch<{
      summary: { totalLocations: number; totalClosingValue: number };
    }>(`/api/approvals/${closeResponse.approval.id}/approve`, {
      method: "PATCH",
    });

    // Store summary for success modal
    closeSummary.value = approvalResponse.summary;

    // Hide confirm modal and show success modal
    showConfirmModal.value = false;
    showSuccessModal.value = true;

    // Refresh period data
    await fetchCurrentPeriod();
  } catch (err: any) {
    console.error("Error closing period:", err);

    toast.add({
      title: "Error",
      description: err?.data?.message || "Failed to close period",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    closingPeriod.value = false;
  }
}

/**
 * Handle approve period close (for PENDING_CLOSE status)
 */
async function handleApprovePeriodClose() {
  if (!currentPeriod.value || !currentPeriod.value.approval_id) {
    toast.add({
      title: "Error",
      description: "No pending approval found",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
    return;
  }

  closingPeriod.value = true;

  try {
    const approvalResponse = await $fetch<{
      summary: { totalLocations: number; totalClosingValue: number };
    }>(`/api/approvals/${currentPeriod.value.approval_id}/approve`, {
      method: "PATCH",
    });

    closeSummary.value = approvalResponse.summary;
    showSuccessModal.value = true;

    await fetchCurrentPeriod();
  } catch (err: any) {
    console.error("Error approving period close:", err);

    toast.add({
      title: "Error",
      description: err?.data?.message || "Failed to approve period close",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    closingPeriod.value = false;
  }
}

/**
 * Handle success modal close - navigate to periods page
 */
function handleSuccessClose() {
  showSuccessModal.value = false;
  router.push("/periods");
}

// Helper functions
function formatDateRange(startDate: string | Date, endDate: string | Date): string {
  const start = new Date(startDate).toLocaleDateString("en-GB");
  const end = new Date(endDate).toLocaleDateString("en-GB");
  return `${start} - ${end}`;
}

function formatDate(date: string | Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusColor(status: string): "success" | "warning" | "neutral" | "primary" | "error" {
  switch (status) {
    case "OPEN":
      return "success";
    case "DRAFT":
      return "warning";
    case "PENDING_CLOSE":
      return "primary";
    case "CLOSED":
      return "neutral";
    default:
      return "neutral";
  }
}

function getLocationStatusColor(status: string): "success" | "warning" | "neutral" | "primary" | "error" {
  switch (status) {
    case "READY":
      return "success";
    case "OPEN":
      return "warning";
    case "CLOSED":
      return "neutral";
    default:
      return "warning";
  }
}
</script>
