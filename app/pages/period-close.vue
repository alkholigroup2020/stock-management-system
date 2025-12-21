<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-lock" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl sm:text-3xl font-bold text-primary">Period Close</h1>
            <UBadge
              v-if="currentPeriod"
              color="success"
              variant="soft"
              size="md"
              class="hidden sm:inline-flex items-center gap-1"
            >
              <UIcon name="i-lucide-calendar" class="h-3 w-3" />
              {{ currentPeriod.name }}
            </UBadge>
          </div>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Close the current accounting period and roll forward to the next
          </p>
          <!-- Mobile period badge -->
          <UBadge
            v-if="currentPeriod"
            color="success"
            variant="soft"
            size="sm"
            class="sm:hidden inline-flex items-center gap-1 mt-1"
          >
            <UIcon name="i-lucide-calendar" class="h-3 w-3" />
            {{ currentPeriod.name }}
          </UBadge>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" text="Loading period data..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" @retry="fetchCurrentPeriod" />

    <!-- No Period State -->
    <EmptyState
      v-else-if="!currentPeriod"
      icon="i-lucide-calendar-x"
      title="No Active Period"
      description="There is no active period to close. Create a new period first."
    >
      <template #actions>
        <UButton
          color="primary"
          icon="i-lucide-plus"
          class="cursor-pointer"
          @click="navigateTo('/periods')"
        >
          Go to Period Management
        </UButton>
      </template>
    </EmptyState>

    <!-- Main Content -->
    <div v-else class="space-y-3">
      <!-- Current Period Info -->
      <UCard class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-calendar" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text)]">Current Period</h2>
            </div>
            <UBadge :color="getStatusColor(currentPeriod.status)" variant="soft" size="md">
              {{ currentPeriod.status }}
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p class="text-sm text-[var(--ui-text-muted)] mb-1">Period Name</p>
            <p class="text-base font-semibold text-[var(--ui-text)]">{{ currentPeriod.name }}</p>
          </div>
          <div>
            <p class="text-sm text-[var(--ui-text-muted)] mb-1">Date Range</p>
            <p class="text-base font-semibold text-[var(--ui-text)]">
              {{ formatDateRange(currentPeriod.start_date, currentPeriod.end_date) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-[var(--ui-text-muted)] mb-1">Locations</p>
            <p class="text-base font-semibold text-[var(--ui-text)]">
              {{ currentPeriod.period_locations?.length || 0 }} locations
            </p>
          </div>
          <div>
            <p class="text-sm text-[var(--ui-text-muted)] mb-1">Active Location</p>
            <p class="text-base font-semibold text-[var(--ui-text)]">
              {{ activeLocationName || "All Locations" }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Pre-Close Checklist -->
      <UCard class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-clipboard-check" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text)]">Pre-Close Checklist</h2>
            </div>
            <UBadge v-if="activeLocationName" color="primary" variant="soft" size="md">
              <UIcon name="i-lucide-map-pin" class="h-3 w-3 mr-1" />
              {{ activeLocationName }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-4">
          <div
            v-for="item in checklistItems"
            :key="item.id"
            class="flex items-center gap-3 p-3 rounded-lg border border-[var(--ui-border)]"
          >
            <div
              :class="[
                'flex items-center justify-center w-6 h-6 rounded-full',
                item.completed
                  ? 'bg-[var(--ui-success)] text-white'
                  : 'bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)]',
              ]"
            >
              <UIcon
                :name="item.completed ? 'i-lucide-check' : 'i-lucide-circle'"
                class="w-4 h-4"
              />
            </div>
            <div class="flex-1">
              <p
                :class="[
                  'text-base',
                  item.completed ? 'text-[var(--ui-text)]' : 'text-[var(--ui-text-muted)]',
                ]"
              >
                {{ item.label }}
              </p>
            </div>
            <UBadge
              v-if="item.count !== undefined"
              :color="item.completed ? 'success' : 'warning'"
              variant="soft"
              size="sm"
            >
              {{ item.count }}
            </UBadge>
          </div>
        </div>
      </UCard>

      <!-- Location Readiness Status -->
      <UCard class="card-elevated">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text)]">Location Readiness</h2>
            </div>
            <UBadge :color="allLocationsReady ? 'success' : 'warning'" variant="soft">
              {{ readyLocationsCount }}/{{ totalLocationsCount }} Ready
            </UBadge>
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--ui-border)]">
            <thead>
              <tr class="bg-[var(--ui-bg-elevated)]">
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Location
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Ready Date
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-[var(--ui-bg)] divide-y divide-[var(--ui-border)]">
              <tr
                v-for="pl in periodLocations"
                :key="pl.location_id"
                class="hover:bg-[var(--ui-bg-elevated)] transition-colors"
              >
                <td class="py-4 px-4">
                  <div class="text-sm font-medium text-[var(--ui-text)]">
                    {{ pl.location.name }}
                  </div>
                  <div class="text-xs text-[var(--ui-text-muted)]">{{ pl.location.code }}</div>
                </td>
                <td class="py-4 px-4">
                  <UBadge color="neutral" variant="soft" size="sm">
                    {{ pl.location.type }}
                  </UBadge>
                </td>
                <td class="py-4 px-4">
                  <UBadge :color="getLocationStatusColor(pl.status)" variant="soft" size="md">
                    {{ pl.status }}
                  </UBadge>
                </td>
                <td class="py-4 px-4">
                  <span v-if="pl.ready_at" class="text-sm text-[var(--ui-text)]">
                    {{ formatDate(pl.ready_at) }}
                  </span>
                  <span v-else class="text-sm text-[var(--ui-text-muted)]">—</span>
                </td>
                <td class="py-4 px-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <UButton
                      v-if="pl.status !== 'READY' && pl.status !== 'CLOSED'"
                      color="primary"
                      variant="soft"
                      size="sm"
                      icon="i-lucide-check"
                      :loading="markingReady === pl.location_id"
                      :disabled="!!markingReady || !!unmarkingReady || currentPeriod.status !== 'OPEN' || !isOnline"
                      class="cursor-pointer"
                      @click="promptMarkReady(pl.location_id, pl.location.name)"
                    >
                      Mark Ready
                    </UButton>
                    <template v-else-if="pl.status === 'READY'">
                      <UButton
                        color="warning"
                        variant="soft"
                        size="sm"
                        icon="i-lucide-undo-2"
                        :loading="unmarkingReady === pl.location_id"
                        :disabled="!!markingReady || !!unmarkingReady || currentPeriod.status !== 'OPEN' || !isOnline"
                        class="cursor-pointer"
                        @click="promptUnmarkReady(pl.location_id, pl.location.name)"
                      >
                        Undo
                      </UButton>
                      <UBadge color="success" variant="soft">Ready</UBadge>
                    </template>
                    <UBadge v-else color="neutral" variant="soft">Closed</UBadge>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <template v-if="periodLocations.length === 0" #default>
          <div class="text-center py-8 text-[var(--ui-text-muted)]">
            No locations configured for this period
          </div>
        </template>
      </UCard>

      <!-- Close Period Section -->
      <UCard class="card-elevated" :ui="{ body: 'p-6 sm:p-8' }">
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-lock" class="w-5 h-5 text-primary" />
            <h2 class="text-lg font-semibold text-[var(--ui-text)]">Close Period</h2>
          </div>
        </template>

        <!-- Period is already pending close -->
        <div v-if="currentPeriod.status === 'PENDING_CLOSE'" class="text-center py-6">
          <UIcon
            name="i-lucide-clock"
            class="w-12 h-12 mx-auto mb-4"
            style="color: var(--ui-primary)"
          />
          <h3 class="text-xl font-semibold text-[var(--ui-text)] mb-2">
            Period Close Pending
          </h3>
          <p class="text-base text-[var(--ui-text-muted)] mb-6">
            A period close request has been submitted and is awaiting approval.
          </p>
          <UButton
            color="primary"
            icon="i-lucide-check-circle"
            size="lg"
            :loading="closingPeriod"
            :disabled="!isOnline"
            class="cursor-pointer rounded-full px-6"
            @click="showApproveCloseModal = true"
          >
            Approve & Execute Close
          </UButton>
        </div>

        <!-- Period is ready to close -->
        <div v-else-if="currentPeriod.status === 'OPEN'" class="text-center py-6">
          <template v-if="!allLocationsReady">
            <UIcon
              name="i-lucide-alert-circle"
              class="w-12 h-12 mx-auto mb-4"
              style="color: var(--ui-warning)"
            />
            <h3 class="text-xl font-semibold text-[var(--ui-text)] mb-2">
              Locations Not Ready
            </h3>
            <p class="text-base text-[var(--ui-text-muted)] mb-2">
              All locations must be marked as ready before closing the period.
            </p>
            <p class="text-sm text-[var(--ui-text-muted)]">
              {{ readyLocationsCount }} of {{ totalLocationsCount }} locations are ready.
            </p>
          </template>
          <template v-else>
            <UIcon
              name="i-lucide-check-circle"
              class="w-12 h-12 mx-auto mb-4"
              style="color: var(--ui-success)"
            />
            <h3 class="text-xl font-semibold text-[var(--ui-text)] mb-2">Ready to Close</h3>
            <p class="text-base text-[var(--ui-text-muted)] mb-6">
              All locations are ready. You can now close the period.
            </p>
            <UButton
              color="primary"
              icon="i-lucide-lock"
              size="lg"
              :disabled="closingPeriod || !isOnline"
              class="cursor-pointer rounded-full px-6"
              @click="showConfirmModal = true"
            >
              Close Period
            </UButton>
          </template>
        </div>

        <!-- Period is already closed -->
        <div v-else-if="currentPeriod.status === 'CLOSED'" class="text-center py-6">
          <UIcon
            name="i-lucide-lock"
            class="w-12 h-12 mx-auto mb-4"
            style="color: var(--ui-text-muted)"
          />
          <h3 class="text-xl font-semibold text-[var(--ui-text)] mb-2">Period Closed</h3>
          <p class="text-base text-[var(--ui-text-muted)]">
            This period has been closed on {{ formatDate(currentPeriod.closed_at) }}.
          </p>
        </div>
      </UCard>
    </div>

    <!-- Confirmation Modal -->
    <UModal v-model:open="showConfirmModal">
      <template #content>
        <UCard class="card-elevated">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <UIcon
                  name="i-lucide-alert-triangle"
                  class="w-5 h-5"
                  style="color: var(--ui-warning)"
                />
                <h3 class="text-lg font-semibold text-[var(--ui-text)]">Confirm Period Close</h3>
              </div>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                size="sm"
                aria-label="Close dialog"
                class="cursor-pointer"
                @click="showConfirmModal = false"
              />
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-base text-[var(--ui-text)]">
              You are about to close the period
              <strong>{{ currentPeriod?.name }}</strong>
              . This action will:
            </p>
            <ul class="list-disc list-inside text-base text-[var(--ui-text-muted)] space-y-2">
              <li>Create a snapshot of all stock levels for each location</li>
              <li>Lock all transactions for this period</li>
              <li>Prevent any further changes to deliveries, issues, or transfers</li>
              <li>Create a new period for the next accounting cycle</li>
            </ul>

            <UAlert
              color="warning"
              variant="soft"
              icon="i-lucide-alert-triangle"
              title="This action cannot be undone"
              description="Once closed, the period cannot be reopened. Make sure all transactions are complete and reconciliations are accurate."
            />
          </div>

          <template #footer>
            <div class="flex items-center justify-end gap-3">
              <UButton
                color="error"
                variant="soft"
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
                :disabled="!isOnline"
                class="cursor-pointer rounded-full px-6"
                @click="handleClosePeriod"
              >
                Confirm & Close Period
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Loading Overlay for Period Close -->
    <LoadingOverlay
      v-if="closingPeriod && currentStep > 0"
      title="Closing Period..."
      message="Please wait while we process your request"
      :current-step="currentStep"
      :total-steps="2"
      :step-description="currentStepDescription"
    />

    <!-- Success Modal -->
    <UModal v-model:open="showSuccessModal" :closeable="false">
      <template #content>
        <UCard class="card-elevated">
          <div class="text-center py-6">
            <UIcon
              name="i-lucide-check-circle"
              class="w-16 h-16 mx-auto mb-4"
              style="color: var(--ui-success)"
            />
            <h3 class="text-xl font-semibold text-[var(--ui-text)] mb-2">
              Period Closed Successfully
            </h3>
            <p class="text-base text-[var(--ui-text-muted)] mb-6">
              The period has been closed and a new period has been created.
            </p>

            <div
              v-if="closeSummary"
              class="mb-6 p-4 bg-[var(--ui-bg-elevated)] rounded-lg text-left border border-[var(--ui-border)]"
            >
              <h4 class="text-sm font-semibold text-[var(--ui-text)] mb-3">Summary</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-[var(--ui-text-muted)]">Total Locations:</span>
                  <span class="font-medium text-[var(--ui-text)]">
                    {{ closeSummary.totalLocations }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-[var(--ui-text-muted)]">Total Closing Value:</span>
                  <span class="font-medium" style="color: var(--ui-success)">
                    SAR
                    {{
                      closeSummary.totalClosingValue?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })
                    }}
                  </span>
                </div>
              </div>
            </div>

            <UButton
              color="primary"
              icon="i-lucide-arrow-right"
              class="cursor-pointer rounded-full px-6"
              @click="handleSuccessClose"
            >
              Go to Period Management
            </UButton>
          </div>
        </UCard>
      </template>
    </UModal>

    <!-- Mark Ready Confirmation Modal -->
    <UModal v-model:open="showMarkReadyModal">
      <template #content>
        <UCard class="card-elevated">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <UIcon
                  :name="locationToMark?.action === 'mark' ? 'i-lucide-check-circle' : 'i-lucide-undo-2'"
                  class="w-5 h-5"
                  :style="{ color: locationToMark?.action === 'mark' ? 'var(--ui-primary)' : 'var(--ui-warning)' }"
                />
                <h3 class="text-lg font-semibold text-[var(--ui-text)]">
                  {{ locationToMark?.action === "mark" ? "Confirm Mark Ready" : "Confirm Undo Ready" }}
                </h3>
              </div>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                size="sm"
                aria-label="Close dialog"
                class="cursor-pointer"
                @click="cancelMarkReady"
              />
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-base text-[var(--ui-text)]">
              <template v-if="locationToMark?.action === 'mark'">
                You are about to mark <strong>{{ locationToMark?.name }}</strong> as ready for
                period close.
              </template>
              <template v-else>
                You are about to revert <strong>{{ locationToMark?.name }}</strong> status back to
                open.
              </template>
            </p>

            <UAlert
              v-if="locationToMark?.action === 'mark'"
              color="info"
              variant="soft"
              icon="i-lucide-info"
              title="What this means"
              description="Marking a location as ready indicates that all transactions have been completed and reconciliations are accurate for this location."
            />
            <UAlert
              v-else
              color="warning"
              variant="soft"
              icon="i-lucide-alert-triangle"
              title="What this means"
              description="Reverting the status will allow additional transactions to be posted to this location before period close."
            />
          </div>

          <template #footer>
            <div class="flex items-center justify-end gap-3">
              <UButton
                color="error"
                variant="soft"
                class="cursor-pointer"
                @click="cancelMarkReady"
              >
                Cancel
              </UButton>
              <UButton
                :color="locationToMark?.action === 'mark' ? 'primary' : 'warning'"
                :icon="locationToMark?.action === 'mark' ? 'i-lucide-check' : 'i-lucide-undo-2'"
                :loading="!!markingReady || !!unmarkingReady"
                :disabled="!isOnline"
                class="cursor-pointer rounded-full px-6"
                @click="confirmMarkReady"
              >
                {{ locationToMark?.action === "mark" ? "Confirm" : "Confirm Undo" }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Approve Period Close Confirmation Modal -->
    <UModal v-model:open="showApproveCloseModal">
      <template #content>
        <UCard class="card-elevated">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <UIcon
                  name="i-lucide-shield-check"
                  class="w-5 h-5"
                  style="color: var(--ui-primary)"
                />
                <h3 class="text-lg font-semibold text-[var(--ui-text)]">
                  Approve & Execute Period Close
                </h3>
              </div>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                size="sm"
                aria-label="Close dialog"
                class="cursor-pointer"
                @click="showApproveCloseModal = false"
              />
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-base text-[var(--ui-text)]">
              You are about to approve and execute the period close for
              <strong>{{ currentPeriod?.name }}</strong>
              .
            </p>

            <UAlert
              color="warning"
              variant="soft"
              icon="i-lucide-alert-triangle"
              title="This action cannot be undone"
              description="Approving this will immediately close the period, lock all transactions, and create closing snapshots for all locations."
            />
          </div>

          <template #footer>
            <div class="flex items-center justify-end gap-3">
              <UButton
                color="error"
                variant="soft"
                :disabled="closingPeriod"
                class="cursor-pointer"
                @click="showApproveCloseModal = false"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                icon="i-lucide-check-circle"
                :loading="closingPeriod"
                :disabled="!isOnline"
                class="cursor-pointer rounded-full px-6"
                @click="executeApproveClose"
              >
                Approve & Execute
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

// SEO
useSeoMeta({
  title: "Period Close - Stock Management System",
  description: "Close the current accounting period and roll forward to the next",
});

const router = useRouter();
const toast = useToast();
const { isOnline, guardAction } = useOfflineGuard();
const locationStore = useLocationStore();

// State
const loading = ref(true);
const error = ref<string | null>(null);
const currentPeriod = ref<any>(null);
const markingReady = ref<string | null>(null);
const unmarkingReady = ref<string | null>(null);
const closingPeriod = ref(false);
const currentStep = ref(0);
const currentStepDescription = ref("");
const showConfirmModal = ref(false);
const showSuccessModal = ref(false);
const showMarkReadyModal = ref(false);
const showApproveCloseModal = ref(false);
const locationToMark = ref<{ id: string; name: string; action: "mark" | "unmark" } | null>(null);
const closeSummary = ref<{ totalLocations: number; totalClosingValue: number } | null>(null);

// Computed
const periodLocations = computed(() => {
  return currentPeriod.value?.period_locations || [];
});

const totalLocationsCount = computed(() => periodLocations.value.length);

const readyLocationsCount = computed(() => {
  return periodLocations.value.filter((pl: any) => pl.status === "READY" || pl.status === "CLOSED")
    .length;
});

const allLocationsReady = computed(() => {
  if (totalLocationsCount.value === 0) return false;
  return readyLocationsCount.value === totalLocationsCount.value;
});

// Get the active location's period data
const activeLocationPeriodData = computed(() => {
  const activeLocationId = locationStore.activeLocationId;
  if (!activeLocationId || !periodLocations.value.length) return null;

  return periodLocations.value.find((pl: any) => pl.location_id === activeLocationId) || null;
});

// Get active location name for display
const activeLocationName = computed(() => {
  return activeLocationPeriodData.value?.location?.name || locationStore.activeLocation?.name || null;
});

// Checklist items - now location-aware
const checklistItems = computed(() => {
  // Use per-location counts if available, otherwise fall back to global counts
  const locationData = activeLocationPeriodData.value;
  const globalCounts = currentPeriod.value?._count;

  // Per-location counts (from the enhanced API response)
  const deliveriesCount = locationData?._count?.deliveries ?? globalCounts?.deliveries ?? 0;
  const issuesCount = locationData?._count?.issues ?? globalCounts?.issues ?? 0;
  const transfersCount = locationData?._count?.transfers ?? 0;
  const reconciliationsCount = locationData?._count?.reconciliations ?? 0;

  // Global counts for the all locations summary
  const locationsCount = totalLocationsCount.value;
  const readyCount = readyLocationsCount.value;

  // Check if this specific location has a reconciliation
  const hasReconciliation = reconciliationsCount > 0;

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
      count: transfersCount,
      completed: true, // Assume completed
    },
    {
      id: "reconciliations",
      label: "Reconciliation completed for this location",
      count: hasReconciliation ? "✓" : "—",
      completed: hasReconciliation,
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
 * @param bypassCache - If true, forces a fresh fetch bypassing browser cache
 */
async function fetchCurrentPeriod(bypassCache = false) {
  loading.value = true;
  error.value = null;

  try {
    const fetchOptions: Parameters<typeof $fetch>[1] = {
      method: "GET",
    };

    // Bypass browser cache after mutations by using cache: 'no-store'
    if (bypassCache) {
      fetchOptions.cache = "no-store";
    }

    const response = await $fetch<{ period: any }>("/api/periods/current", fetchOptions);

    currentPeriod.value = response.period;
  } catch (err: any) {
    console.error("Error fetching current period:", err);
    error.value = err?.data?.message || "Failed to load period data";
  } finally {
    loading.value = false;
  }
}

/**
 * Show confirmation modal for Mark Ready action
 */
function promptMarkReady(locationId: string, locationName: string) {
  locationToMark.value = { id: locationId, name: locationName, action: "mark" };
  showMarkReadyModal.value = true;
}

/**
 * Show confirmation modal for Unmark Ready action
 */
function promptUnmarkReady(locationId: string, locationName: string) {
  locationToMark.value = { id: locationId, name: locationName, action: "unmark" };
  showMarkReadyModal.value = true;
}

/**
 * Cancel Mark Ready confirmation
 */
function cancelMarkReady() {
  showMarkReadyModal.value = false;
  locationToMark.value = null;
}

/**
 * Confirm and execute Mark Ready action
 */
async function confirmMarkReady() {
  if (!locationToMark.value) return;

  const { id, action } = locationToMark.value;
  showMarkReadyModal.value = false;

  if (action === "mark") {
    await handleMarkReady(id);
  } else {
    await handleUnmarkReady(id);
  }

  locationToMark.value = null;
}

/**
 * Mark a location as ready for period close
 */
async function handleMarkReady(locationId: string) {
  if (!currentPeriod.value) return;

  // Guard against offline state
  await guardAction(
    async () => {
      markingReady.value = locationId;

      try {
        await $fetch("/api/period-locations/ready", {
          method: "PATCH",
          body: {
            periodId: currentPeriod.value!.id,
            locationId,
          },
        });

        toast.add({
          title: "Success",
          description: "Location marked as ready",
          color: "success",
          icon: "i-lucide-check",
        });

        // Refresh period data (bypass cache to get fresh data)
        await fetchCurrentPeriod(true);
      } catch (err: any) {
        console.error("Error marking location ready:", err);

        // Extract error message from H3/Nuxt error structure
        const errorMessage =
          err?.data?.data?.message ||
          err?.data?.message ||
          err?.statusMessage ||
          "Failed to mark location as ready";

        toast.add({
          title: "Error",
          description: errorMessage,
          color: "error",
          icon: "i-lucide-alert-circle",
        });
      } finally {
        markingReady.value = null;
      }
    },
    {
      offlineMessage: "Cannot mark location ready",
      offlineDescription: "You need an internet connection to mark locations as ready.",
    }
  );
}

/**
 * Unmark a location as ready (revert to OPEN status)
 */
async function handleUnmarkReady(locationId: string) {
  if (!currentPeriod.value) return;

  // Guard against offline state
  await guardAction(
    async () => {
      unmarkingReady.value = locationId;

      try {
        await $fetch("/api/period-locations/unready", {
          method: "PATCH",
          body: {
            periodId: currentPeriod.value!.id,
            locationId,
          },
        });

        toast.add({
          title: "Success",
          description: "Location status reverted to open",
          color: "success",
          icon: "i-lucide-check",
        });

        // Refresh period data (bypass cache to get fresh data)
        await fetchCurrentPeriod(true);
      } catch (err: any) {
        console.error("Error unmarking location ready:", err);

        // Extract error message from H3/Nuxt error structure
        const errorMessage =
          err?.data?.data?.message ||
          err?.data?.message ||
          err?.statusMessage ||
          "Failed to revert location status";

        toast.add({
          title: "Error",
          description: errorMessage,
          color: "error",
          icon: "i-lucide-alert-circle",
        });
      } finally {
        unmarkingReady.value = null;
      }
    },
    {
      offlineMessage: "Cannot revert location status",
      offlineDescription: "You need an internet connection to change location status.",
    }
  );
}

/**
 * Handle period close - creates approval request and immediately approves it
 */
async function handleClosePeriod() {
  if (!currentPeriod.value) return;

  // Guard against offline state
  await guardAction(
    async () => {
      closingPeriod.value = true;
      currentStep.value = 0;

      try {
        // Step 1: Request period close (creates approval)
        currentStep.value = 1;
        currentStepDescription.value = "Creating period close request...";
        const closeResponse = await $fetch<{ approval: { id: string } }>(
          `/api/periods/${currentPeriod.value!.id}/close`,
          {
            method: "POST",
          }
        );

        // Step 2: Approve and execute the close
        currentStep.value = 2;
        currentStepDescription.value = "Executing period close and creating snapshots...";
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

        // Refresh period data (bypass cache to get fresh data)
        await fetchCurrentPeriod(true);
      } catch (err: any) {
        console.error("Error closing period:", err);

        // Extract error message from H3/Nuxt error structure
        const errorMessage =
          err?.data?.data?.message ||
          err?.data?.message ||
          err?.statusMessage ||
          "Failed to close period";

        toast.add({
          title: "Error",
          description: errorMessage,
          color: "error",
          icon: "i-lucide-alert-circle",
        });
      } finally {
        closingPeriod.value = false;
        currentStep.value = 0;
        currentStepDescription.value = "";
      }
    },
    {
      offlineMessage: "Cannot close period",
      offlineDescription: "You need an internet connection to close periods.",
    }
  );
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

  // Guard against offline state
  await guardAction(
    async () => {
      closingPeriod.value = true;

      try {
        const approvalResponse = await $fetch<{
          summary: { totalLocations: number; totalClosingValue: number };
        }>(`/api/approvals/${currentPeriod.value!.approval_id}/approve`, {
          method: "PATCH",
        });

        closeSummary.value = approvalResponse.summary;
        showSuccessModal.value = true;

        // Refresh period data (bypass cache to get fresh data)
        await fetchCurrentPeriod(true);
      } catch (err: any) {
        console.error("Error approving period close:", err);

        // Extract error message from H3/Nuxt error structure
        const errorMessage =
          err?.data?.data?.message ||
          err?.data?.message ||
          err?.statusMessage ||
          "Failed to approve period close";

        toast.add({
          title: "Error",
          description: errorMessage,
          color: "error",
          icon: "i-lucide-alert-circle",
        });
      } finally {
        closingPeriod.value = false;
      }
    },
    {
      offlineMessage: "Cannot approve period close",
      offlineDescription: "You need an internet connection to approve period close.",
    }
  );
}

/**
 * Execute approve close action from confirmation modal
 */
async function executeApproveClose() {
  showApproveCloseModal.value = false;
  await handleApprovePeriodClose();
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

function getLocationStatusColor(
  status: string
): "success" | "warning" | "neutral" | "primary" | "error" {
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
