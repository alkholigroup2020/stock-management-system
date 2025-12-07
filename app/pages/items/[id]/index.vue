<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading item..." />
    </div>

    <!-- Error State -->
    <ErrorAlert
      v-else-if="error"
      :message="error"
      @retry="fetchItem"
      back-url="/items"
      back-label="Back to Items"
    />

    <!-- Item Details -->
    <template v-else-if="item">
      <!-- Page Header -->
      <div class="flex items-center justify-between gap-3">
        <!-- Mobile: smaller icon and title -->
        <div class="flex items-center gap-2 sm:gap-4">
          <UIcon name="i-lucide-package-2" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
          <div>
            <h1 class="text-xl sm:text-3xl font-bold text-primary">{{ item.name }}</h1>
            <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
              {{ item.code }}
            </p>
          </div>
        </div>
        <!-- Action buttons -->
        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-arrow-left"
            size="lg"
            class="cursor-pointer rounded-full px-3 sm:px-6"
            @click="navigateTo('/items')"
          >
            <span class="hidden sm:inline">Back</span>
          </UButton>
          <UButton
            v-if="canEditItems()"
            color="primary"
            icon="i-lucide-edit"
            size="lg"
            class="cursor-pointer rounded-full px-3 sm:px-6"
            @click="navigateTo(`/items/${item.id}/edit`)"
          >
            <span class="hidden sm:inline">Edit Item</span>
            <span class="sm:hidden">Edit</span>
          </UButton>
        </div>
      </div>

      <!-- Item Information Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-6' }">
        <template #header>
          <h2 class="text-subheading font-semibold">Item Information</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Code -->
          <div>
            <label class="block text-label mb-1">Item Code</label>
            <p class="text-[var(--ui-text)] font-semibold font-mono">
              {{ item.code }}
            </p>
          </div>

          <!-- Name -->
          <div>
            <label class="block text-label mb-1">Item Name</label>
            <p class="text-[var(--ui-text)] font-semibold">
              {{ item.name }}
            </p>
          </div>

          <!-- Unit -->
          <div>
            <label class="block text-label mb-1">Unit of Measure</label>
            <UBadge color="primary" variant="subtle" size="md">
              {{ item.unit }}
            </UBadge>
          </div>

          <!-- Category -->
          <div>
            <label class="block text-label mb-1">Category</label>
            <p class="text-[var(--ui-text)]">
              {{ item.category || "-" }}
            </p>
          </div>

          <!-- Sub-Category -->
          <div>
            <label class="block text-label mb-1">Sub-Category</label>
            <p class="text-[var(--ui-text)]">
              {{ item.sub_category || "-" }}
            </p>
          </div>

          <!-- Status -->
          <div>
            <label class="block text-label mb-1">Status</label>
            <UBadge :color="item.is_active ? 'success' : 'neutral'" variant="subtle" size="md">
              {{ item.is_active ? "Active" : "Inactive" }}
            </UBadge>
          </div>

          <!-- Created At -->
          <div>
            <label class="block text-label mb-1">Created</label>
            <p class="text-[var(--ui-text)]">
              {{ formatDate(item.created_at) }}
            </p>
          </div>

          <!-- Updated At -->
          <div>
            <label class="block text-label mb-1">Last Updated</label>
            <p class="text-[var(--ui-text)]">
              {{ formatDate(item.updated_at) }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Location Stock Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-6' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-subheading font-semibold">Stock Levels</h2>
            <UButton
              v-if="!showAllLocations && (isAdmin || isSupervisor)"
              color="primary"
              variant="ghost"
              size="xs"
              icon="i-lucide-rotate-cw"
              class="cursor-pointer"
              :loading="loadingStock"
              :disabled="loadingStock"
              @click="toggleShowAllLocations"
            >
              Show All Locations
            </UButton>
            <UButton
              v-else-if="showAllLocations"
              color="primary"
              variant="ghost"
              size="xs"
              icon="i-lucide-filter"
              class="cursor-pointer"
              :loading="loadingStock"
              :disabled="loadingStock"
              @click="toggleShowAllLocations"
            >
              Show My Locations
            </UButton>
          </div>
        </template>

        <!-- Loading stock data -->
        <div v-if="loadingStock" class="flex justify-center items-center py-8">
          <LoadingSpinner size="md" color="primary" text="Loading stock..." />
        </div>

        <!-- Location Stock Table -->
        <div v-else-if="item.location_stock && item.location_stock.length > 0">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-[var(--ui-border)]">
              <thead>
                <tr class="bg-[var(--ui-bg-elevated)]">
                  <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Location</th>
                  <th class="px-4 py-3 text-right text-label uppercase tracking-wider">On Hand</th>
                  <th class="px-4 py-3 text-right text-label uppercase tracking-wider">WAC</th>
                  <th class="px-4 py-3 text-right text-label uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--ui-border)]">
                <tr v-for="stock in item.location_stock" :key="stock.location.id">
                  <td class="px-4 py-4 whitespace-nowrap text-[var(--ui-text)]">
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{{ stock.location.name }}</span>
                      <UBadge color="neutral" variant="subtle" size="xs">
                        {{ stock.location.code }}
                      </UBadge>
                    </div>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-[var(--ui-text)] text-right">
                    {{ formatQuantity(Number(stock.on_hand)) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-[var(--ui-text)] text-right">
                    {{ formatCurrency(Number(stock.wac)) }}
                  </td>
                  <td
                    class="px-4 py-4 whitespace-nowrap text-[var(--ui-text)] text-right font-medium"
                  >
                    {{ formatCurrency(Number(stock.on_hand) * Number(stock.wac)) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- No Stock Data -->
        <EmptyState
          v-else
          icon="i-lucide-package-x"
          title="No stock data"
          description="No stock information available for this item."
          :show-actions="false"
        />
      </UCard>

      <!-- Quick Actions Card -->
      <UCard
        v-if="canPostDeliveries() || canPostIssues() || canEditItems()"
        class="card-elevated"
        :ui="{ body: 'p-6' }"
      >
        <template #header>
          <h2 class="text-subheading font-semibold">Quick Actions</h2>
        </template>

        <div class="flex flex-wrap gap-3">
          <UButton
            v-if="canPostDeliveries()"
            color="success"
            variant="soft"
            icon="i-lucide-package-plus"
            class="cursor-pointer"
            @click="navigateTo('/deliveries/create')"
          >
            Record Delivery
          </UButton>
          <UButton
            v-if="canPostIssues()"
            color="warning"
            variant="soft"
            icon="i-lucide-package-minus"
            class="cursor-pointer"
            @click="navigateTo('/issues/create')"
          >
            Record Issue
          </UButton>
          <UButton
            v-if="canEditItems() && !item.is_active"
            color="success"
            variant="soft"
            icon="i-lucide-circle-check"
            class="cursor-pointer"
            @click="showActivateModal = true"
          >
            Activate Item
          </UButton>
          <UButton
            v-if="canEditItems() && item.is_active"
            color="error"
            variant="soft"
            icon="i-lucide-archive"
            class="cursor-pointer"
            @click="showDeactivateModal = true"
          >
            Deactivate Item
          </UButton>
        </div>
      </UCard>
    </template>

    <!-- Confirmation Modals -->
    <UiConfirmModal
      v-model="showActivateModal"
      title="Activate Item"
      :message="activateMessage"
      confirm-text="Activate"
      variant="success"
      :loading="isActivating"
      @confirm="handleActivate"
    />

    <UiConfirmModal
      v-model="showDeactivateModal"
      title="Deactivate Item"
      :message="deactivateMessage"
      confirm-text="Deactivate"
      variant="danger"
      :loading="isDeactivating"
      @confirm="handleDeactivate"
    />
  </div>
</template>

<script setup lang="ts">
import type { Item, LocationStock } from "@prisma/client";
import dayjs from "dayjs";

// Type for Item with location stock
type LocationStockWithLocation = LocationStock & {
  location: {
    id: string;
    code: string;
    name: string;
    type: "KITCHEN" | "STORE" | "CENTRAL" | "WAREHOUSE";
  };
};

interface ItemWithStock extends Item {
  location_stock?: LocationStockWithLocation[];
}

definePageMeta({
  layout: "default",
});

// Composables
const route = useRoute();
const { canEditItems, canPostDeliveries, canPostIssues } = usePermissions();
const authStore = useAuthStore();
const toast = useAppToast();

// Computed properties for roles
const isAdmin = computed(() => authStore.user?.role === "ADMIN");
const isSupervisor = computed(() => authStore.user?.role === "SUPERVISOR");

// Computed properties for modal messages
const activateMessage = computed(() =>
  item.value
    ? `Are you sure you want to activate "${item.value.name}"? This will allow the item to be used in new transactions.`
    : ""
);

const deactivateMessage = computed(() =>
  item.value
    ? `Are you sure you want to deactivate "${item.value.name}"? This will prevent the item from being used in new transactions. Existing transactions will not be affected.`
    : ""
);

// Reactive state
const item = ref<ItemWithStock | null>(null);
const loading = ref(false);
const loadingStock = ref(false);
const error = ref<string | null>(null);
const showAllLocations = ref(false);
const isActivating = ref(false);
const isDeactivating = ref(false);
const showActivateModal = ref(false);
const showDeactivateModal = ref(false);

/**
 * Fetch item from the API
 */
async function fetchItem() {
  loading.value = true;
  error.value = null;

  try {
    const itemId = route.params.id as string;

    const params: Record<string, string> = {};

    // Determine whether to include all locations or just user's locations
    if (showAllLocations.value && (isAdmin.value || isSupervisor.value)) {
      params.includeAllStock = "true";
    }

    const response = await $fetch<{ item: ItemWithStock }>(`/api/items/${itemId}`, {
      method: "GET",
      query: params,
    });

    item.value = response.item;
  } catch (err: unknown) {
    const errorMessage =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to load item";
    error.value = errorMessage;
    console.error("Error fetching item:", err);
    toast.error("Error", { description: errorMessage });
  } finally {
    loading.value = false;
  }
}

/**
 * Toggle showing all locations (for admins/supervisors)
 */
async function toggleShowAllLocations() {
  showAllLocations.value = !showAllLocations.value;
  loadingStock.value = true;

  try {
    const itemId = route.params.id as string;

    const params: Record<string, string> = {};

    if (showAllLocations.value) {
      params.includeAllStock = "true";
    }

    const response = await $fetch<{ item: ItemWithStock }>(`/api/items/${itemId}`, {
      method: "GET",
      query: params,
    });

    item.value = response.item;
  } catch (err: unknown) {
    const errorMessage =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to load stock data";
    toast.error("Error", { description: errorMessage });
    console.error("Error fetching stock:", err);
  } finally {
    loadingStock.value = false;
  }
}

/**
 * Handle activate action
 */
async function handleActivate() {
  if (!item.value) return;

  isActivating.value = true;

  try {
    const itemId = route.params.id as string;

    // Call API to activate item
    const response = await $fetch<{ item: ItemWithStock; message: string }>(
      `/api/items/${itemId}`,
      {
        method: "PATCH",
        body: {
          is_active: true,
        },
      }
    );

    // Update local item state
    if (item.value) {
      item.value.is_active = true;
    }

    // Show success message
    toast.success("Success", {
      description: response.message || "Item activated successfully",
    });

    // Close modal
    showActivateModal.value = false;
  } catch (err: unknown) {
    const errorMessage =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to activate item";
    toast.error("Error", { description: errorMessage });
    console.error("Error activating item:", err);
  } finally {
    isActivating.value = false;
  }
}

/**
 * Handle deactivate action
 */
async function handleDeactivate() {
  if (!item.value) return;

  isDeactivating.value = true;

  try {
    const itemId = route.params.id as string;

    // Call API to deactivate item
    const response = await $fetch<{ item: ItemWithStock; message: string }>(
      `/api/items/${itemId}`,
      {
        method: "PATCH",
        body: {
          is_active: false,
        },
      }
    );

    // Update local item state
    if (item.value) {
      item.value.is_active = false;
    }

    // Show success message
    toast.success("Success", {
      description: response.message || "Item deactivated successfully",
    });

    // Close modal
    showDeactivateModal.value = false;
  } catch (err: unknown) {
    const errorMessage =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to deactivate item";
    toast.error("Error", { description: errorMessage });
    console.error("Error deactivating item:", err);
  } finally {
    isDeactivating.value = false;
  }
}

/**
 * Format date for display
 */
function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return dayjs(date).format("DD/MM/YYYY HH:mm");
}

/**
 * Format quantity with appropriate decimal places
 */
function formatQuantity(value: number): string {
  // Show up to 4 decimal places for quantities
  return value.toFixed(4).replace(/\.?0+$/, "");
}

/**
 * Format currency (SAR)
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Fetch item on mount
onMounted(() => {
  fetchItem();
});

// Set page title
useHead({
  title: computed(() => (item.value ? `${item.value.name} - Items` : "Item Details")),
});
</script>
