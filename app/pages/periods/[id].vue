<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Loading State -->
    <div v-if="pending" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading period details..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error.message" @retry="refresh" />

    <!-- Period Details -->
    <template v-else-if="period">
      <!-- Page Header -->
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 sm:gap-4">
          <UIcon name="i-lucide-calendar" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
          <div>
            <h1 class="text-xl sm:text-3xl font-bold text-primary">{{ period.name }}</h1>
            <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
              {{ formatDateRange(period.start_date, period.end_date) }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            size="lg"
            class="cursor-pointer"
            @click="goBack"
          >
            <span class="hidden sm:inline">Back</span>
          </UButton>
          <UButton
            v-if="isAdmin && period.status === 'DRAFT'"
            color="primary"
            icon="i-lucide-edit"
            size="lg"
            class="cursor-pointer rounded-full px-3 sm:px-6"
            @click="handleEdit"
          >
            <span class="hidden sm:inline">Edit</span>
          </UButton>
          <UButton
            v-if="isAdmin && period.status === 'DRAFT'"
            color="success"
            icon="i-lucide-unlock"
            size="lg"
            class="cursor-pointer rounded-full px-3 sm:px-6"
            @click="handleOpenPeriod"
          >
            <span class="hidden sm:inline">Open Period</span>
            <span class="sm:hidden">Open</span>
          </UButton>
        </div>
      </div>

      <!-- Period Info Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Status -->
          <div>
            <p class="text-label mb-2">Status</p>
            <UBadge :color="getStatusColor(period.status)" variant="subtle" size="md">
              {{ period.status }}
            </UBadge>
          </div>

          <!-- Date Range -->
          <div>
            <p class="text-label mb-2">Date Range</p>
            <p class="text-[var(--ui-text)] font-medium">
              {{ formatDateRange(period.start_date, period.end_date) }}
            </p>
          </div>

          <!-- Locations -->
          <div>
            <p class="text-label mb-2">Locations</p>
            <p class="text-[var(--ui-text)] font-medium">
              {{ period.period_locations?.length || 0 }} locations
            </p>
          </div>

          <!-- Items Priced -->
          <div>
            <p class="text-label mb-2">Items Priced</p>
            <p class="text-[var(--ui-text)] font-medium">
              {{
                "_count" in period && period._count && "item_prices" in period._count
                  ? period._count.item_prices
                  : 0
              }}
              items
            </p>
          </div>
        </div>
      </UCard>

      <!-- Summary Statistics -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Deliveries -->
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <div class="flex items-center gap-3">
            <div class="p-3 bg-[var(--ui-bg-elevated)] rounded-lg">
              <UIcon name="i-lucide-truck" class="w-6 h-6 text-primary" />
            </div>
            <div>
              <p class="text-label">Deliveries</p>
              <p class="text-2xl font-bold text-[var(--ui-text)]">
                {{ period._count?.deliveries || 0 }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Issues -->
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <div class="flex items-center gap-3">
            <div class="p-3 bg-[var(--ui-bg-elevated)] rounded-lg">
              <UIcon name="i-lucide-package-open" class="w-6 h-6 text-primary" />
            </div>
            <div>
              <p class="text-label">Issues</p>
              <p class="text-2xl font-bold text-[var(--ui-text)]">
                {{ period._count?.issues || 0 }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Reconciliations -->
        <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
          <div class="flex items-center gap-3">
            <div class="p-3 bg-[var(--ui-bg-elevated)] rounded-lg">
              <UIcon name="i-lucide-check-square" class="w-6 h-6 text-primary" />
            </div>
            <div>
              <p class="text-label">Reconciliations</p>
              <p class="text-2xl font-bold text-[var(--ui-text)]">
                {{ period._count?.reconciliations || 0 }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Locations Table -->
      <UCard class="card-elevated" :ui="{ body: 'p-0' }">
        <template #header>
          <div class="flex items-center justify-between p-3 sm:p-4">
            <h2 class="text-lg font-semibold text-[var(--ui-text)]">Location Status</h2>
          </div>
        </template>

        <!-- Empty State -->
        <EmptyState
          v-if="!period.period_locations || period.period_locations.length === 0"
          icon="i-lucide-map-pin-off"
          title="No locations assigned"
          description="This period has no locations assigned yet."
          padding="md"
        />

        <!-- Locations Table -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--ui-border)]">
            <thead>
              <tr class="bg-[var(--ui-bg-elevated)]">
                <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Location</th>
                <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Type</th>
                <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Status</th>
                <th class="px-4 py-3 text-right text-label uppercase tracking-wider">
                  Opening Value
                </th>
                <th class="px-4 py-3 text-right text-label uppercase tracking-wider">
                  Closing Value
                </th>
                <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Ready At</th>
                <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Closed At</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--ui-border)]">
              <tr
                v-for="location in period.period_locations"
                :key="location.location_id"
                class="hover:bg-[var(--ui-bg-elevated)] transition-colors"
              >
                <!-- Location Name -->
                <td class="px-4 py-4">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-primary" />
                    <div>
                      <p class="text-[var(--ui-text)] font-medium">
                        {{ location.location.name }}
                      </p>
                      <p class="text-caption">{{ location.location.code }}</p>
                    </div>
                  </div>
                </td>

                <!-- Type -->
                <td class="px-4 py-4 text-caption">
                  {{ formatLocationType(location.location.type) }}
                </td>

                <!-- Status -->
                <td class="px-4 py-4">
                  <UBadge
                    :color="getLocationStatusColor(location.status)"
                    variant="subtle"
                    size="sm"
                  >
                    {{ location.status }}
                  </UBadge>
                </td>

                <!-- Opening Value -->
                <td class="px-4 py-4 text-right text-[var(--ui-text)] font-medium">
                  {{
                    location.opening_value !== null
                      ? formatCurrency(Number(location.opening_value))
                      : "SAR 0.00"
                  }}
                </td>

                <!-- Closing Value -->
                <td class="px-4 py-4 text-right text-[var(--ui-text)] font-medium">
                  {{
                    location.closing_value !== null
                      ? formatCurrency(Number(location.closing_value))
                      : "-"
                  }}
                </td>

                <!-- Ready At -->
                <td class="px-4 py-4 text-caption">
                  {{ location.ready_at ? formatDateTime(location.ready_at) : "-" }}
                </td>

                <!-- Closed At -->
                <td class="px-4 py-4 text-caption">
                  {{ location.closed_at ? formatDateTime(location.closed_at) : "-" }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </template>

    <!-- Edit Period Modal -->
    <UModal v-model:open="showEditModal">
      <template #content>
        <UCard class="card-elevated">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Edit Period</h3>
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                size="sm"
                class="cursor-pointer"
                @click="closeEditModal"
              />
            </div>
          </template>

          <form @submit.prevent="handleUpdatePeriod">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Period Name (Full Width) -->
              <UFormField label="Period Name" name="name" required class="md:col-span-2">
                <UInput
                  id="period-name-edit"
                  v-model="editForm.name"
                  placeholder="e.g., January 2025"
                  size="lg"
                  :disabled="isUpdating"
                  class="w-full"
                />
                <template v-if="editErrors.name" #error>
                  <span class="text-[var(--ui-error)]">{{ editErrors.name }}</span>
                </template>
              </UFormField>

              <!-- Start Date -->
              <UFormField label="Start Date" name="start_date" required>
                <UInput
                  id="start-date-edit"
                  v-model="editForm.start_date"
                  type="date"
                  size="lg"
                  :disabled="isUpdating"
                  class="w-full"
                />
                <template v-if="editErrors.start_date" #error>
                  <span class="text-[var(--ui-error)]">{{ editErrors.start_date }}</span>
                </template>
              </UFormField>

              <!-- End Date -->
              <UFormField label="End Date" name="end_date" required>
                <UInput
                  id="end-date-edit"
                  v-model="editForm.end_date"
                  type="date"
                  size="lg"
                  :disabled="isUpdating"
                  class="w-full"
                />
                <template v-if="editErrors.end_date" #error>
                  <span class="text-[var(--ui-error)]">{{ editErrors.end_date }}</span>
                </template>
              </UFormField>

              <!-- Info Alert (Full Width) -->
              <div class="md:col-span-2">
                <UAlert
                  color="primary"
                  icon="i-lucide-info"
                  title="Period Status"
                  description="Status cannot be changed here. Use the workflow buttons to change period status."
                />
              </div>
            </div>
          </form>

          <template #footer>
            <div class="flex items-center justify-end gap-3">
              <UButton
                color="error"
                variant="soft"
                size="lg"
                class="cursor-pointer"
                :disabled="isUpdating"
                @click="closeEditModal"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                icon="i-lucide-save"
                size="lg"
                class="cursor-pointer"
                :loading="isUpdating"
                @click="handleUpdatePeriod"
              >
                Save Changes
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Open Period Confirmation Modal -->
    <UModal v-model:open="showOpenPeriodModal">
      <template #content>
        <UCard class="card-elevated">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="p-3 bg-[var(--ui-bg-elevated)] rounded-lg">
                <UIcon name="i-lucide-unlock" class="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-[var(--ui-text)]">Open Period</h3>
                <p class="text-sm text-[var(--ui-text-muted)]">Confirm period activation</p>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <UAlert
              color="warning"
              icon="i-lucide-alert-triangle"
              title="Important"
              description="Once a period is opened, item prices will be locked and cannot be modified. Make sure all prices are set correctly before proceeding."
            />

            <div v-if="period" class="bg-[var(--ui-bg-elevated)] rounded-lg p-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-label">Period Name</p>
                  <p class="text-[var(--ui-text)] font-medium">{{ period.name }}</p>
                </div>
                <div>
                  <p class="text-label">Date Range</p>
                  <p class="text-[var(--ui-text)] font-medium">
                    {{ formatDateRange(period.start_date, period.end_date) }}
                  </p>
                </div>
                <div>
                  <p class="text-label">Current Status</p>
                  <UBadge :color="getStatusColor(period.status)" variant="subtle" size="sm">
                    {{ period.status }}
                  </UBadge>
                </div>
                <div>
                  <p class="text-label">Items Priced</p>
                  <p class="text-[var(--ui-text)] font-medium">
                    {{ "_count" in period && period._count && "item_prices" in period._count ? period._count.item_prices : 0 }} items
                  </p>
                </div>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                size="lg"
                class="cursor-pointer"
                @click="closeOpenPeriodModal"
              >
                Cancel
              </UButton>
              <UButton
                color="success"
                icon="i-lucide-unlock"
                size="lg"
                class="cursor-pointer"
                :loading="isOpeningPeriod"
                @click="confirmOpenPeriod"
              >
                Open Period
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { Decimal } from "@prisma/client/runtime/library";

definePageMeta({
  middleware: "role",
});

const router = useRouter();
const route = useRoute();
const toast = useToast();

// Auth
const { user } = useAuth();
const isAdmin = computed(() => user.value?.role === "ADMIN");

// Fetch period details
const periodId = route.params.id as string;

const {
  data: periodData,
  pending,
  error,
  refresh,
} = await useFetch(`/api/periods/${periodId}`, {
  method: "GET",
});

const period = computed(() => periodData.value?.period);

// Helper functions
function formatDateRange(startDate: string | Date, endDate: string | Date): string {
  const start = new Date(startDate).toLocaleDateString("en-GB");
  const end = new Date(endDate).toLocaleDateString("en-GB");
  return `${start} - ${end}`;
}

function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number | Decimal | null): string {
  if (value === null || value === undefined) return "SAR 0.00";
  const numValue = typeof value === "number" ? value : parseFloat(value.toString());
  return `SAR ${numValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatLocationType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
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

function getLocationStatusColor(status: string): BadgeColor {
  switch (status) {
    case "OPEN":
      return "success";
    case "READY":
      return "primary";
    case "CLOSED":
      return "neutral";
    default:
      return "neutral";
  }
}

function goBack() {
  router.push("/periods");
}

// Edit period modal
const showEditModal = ref(false);
const isUpdating = ref(false);
const editForm = ref({
  name: "",
  start_date: "",
  end_date: "",
});
const editErrors = ref({
  name: "",
  start_date: "",
  end_date: "",
});

// Open edit modal
function handleEdit() {
  if (!period.value) return;

  // Populate form with current period data
  editForm.value = {
    name: period.value.name,
    start_date: formatDateForInput(period.value.start_date),
    end_date: formatDateForInput(period.value.end_date),
  };

  // Reset errors
  editErrors.value = {
    name: "",
    start_date: "",
    end_date: "",
  };

  // Open modal
  showEditModal.value = true;
}

// Close edit modal
function closeEditModal() {
  showEditModal.value = false;
}

// Format date for input (YYYY-MM-DD)
function formatDateForInput(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Validate edit form
function validateEditForm(): boolean {
  let isValid = true;

  // Reset errors
  editErrors.value = {
    name: "",
    start_date: "",
    end_date: "",
  };

  // Validate name
  if (!editForm.value.name.trim()) {
    editErrors.value.name = "Period name is required";
    isValid = false;
  }

  // Validate start date
  if (!editForm.value.start_date) {
    editErrors.value.start_date = "Start date is required";
    isValid = false;
  }

  // Validate end date
  if (!editForm.value.end_date) {
    editErrors.value.end_date = "End date is required";
    isValid = false;
  }

  // Validate date range
  if (editForm.value.start_date && editForm.value.end_date) {
    const startDate = new Date(editForm.value.start_date);
    const endDate = new Date(editForm.value.end_date);

    if (endDate <= startDate) {
      editErrors.value.end_date = "End date must be after start date";
      isValid = false;
    }
  }

  return isValid;
}

// Update period
async function handleUpdatePeriod() {
  if (!validateEditForm()) return;

  isUpdating.value = true;

  try {
    await $fetch<{ period: unknown; message: string }>(`/api/periods/${periodId}`, {
      method: "PATCH",
      body: {
        name: editForm.value.name.trim(),
        start_date: editForm.value.start_date,
        end_date: editForm.value.end_date,
      },
    });

    toast.add({
      title: "Success",
      description: "Period updated successfully",
      color: "success",
      icon: "i-lucide-check",
    });

    // Refresh period data
    await refresh();

    // Close modal
    closeEditModal();
  } catch (err: any) {
    console.error("Error updating period:", err);

    toast.add({
      title: "Error",
      description: err.data?.message || "Failed to update period",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    isUpdating.value = false;
  }
}

// Open Period Modal State
const showOpenPeriodModal = ref(false);
const isOpeningPeriod = ref(false);

function handleOpenPeriod() {
  showOpenPeriodModal.value = true;
}

function closeOpenPeriodModal() {
  showOpenPeriodModal.value = false;
}

async function confirmOpenPeriod() {
  isOpeningPeriod.value = true;

  try {
    await $fetch<{ period: unknown; message: string }>(`/api/periods/${periodId}/open`, {
      method: "POST",
    });

    toast.add({
      title: "Success",
      description: "Period opened successfully. Prices are now locked.",
      color: "success",
      icon: "i-lucide-check",
    });

    // Refresh period data
    await refresh();

    // Close modal
    closeOpenPeriodModal();
  } catch (err: unknown) {
    console.error("Error opening period:", err);

    // Extract error message from $fetch error structure
    const errorData = err as { data?: { data?: { message?: string }; message?: string } };
    const errorMessage =
      errorData.data?.data?.message || errorData.data?.message || "Failed to open period";

    toast.add({
      title: "Error",
      description: errorMessage,
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    isOpeningPeriod.value = false;
  }
}
</script>
