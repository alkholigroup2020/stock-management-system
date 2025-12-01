<template>
  <div class="px-3 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <!-- Mobile: smaller icon and title -->
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-map-pin" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Locations</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Manage your inventory locations and warehouses
          </p>
        </div>
      </div>
      <!-- Mobile: shorter button text -->
      <UButton
        v-if="canManageLocations"
        color="primary"
        icon="i-lucide-plus"
        size="lg"
        class="cursor-pointer rounded-full px-3 sm:px-6"
        @click="navigateTo('/locations/create')"
      >
        <span class="hidden sm:inline">Create Location</span>
        <span class="sm:hidden">Create</span>
      </UButton>
    </div>

    <!-- Filters -->
    <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
      <!-- Desktop: Single row layout -->
      <div class="hidden lg:flex items-center gap-3">
        <!-- Search -->
        <div class="flex-1 min-w-0 max-w-md">
          <UInput
            v-model="filters.search"
            placeholder="Search locations by name or code..."
            icon="i-lucide-search"
            size="lg"
            class="w-full"
            @input="debouncedFetch"
          />
        </div>

        <!-- Type Filter Toggle Buttons -->
        <div class="flex items-center gap-1 p-1 bg-muted rounded-full">
          <button
            v-for="typeOpt in typeToggleOptions"
            :key="typeOpt.value ?? 'all'"
            type="button"
            class="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap"
            :class="getTypeButtonClass(typeOpt.value)"
            @click="selectType(typeOpt.value)"
          >
            {{ typeOpt.label }}
          </button>
        </div>

        <!-- Status Filter Dropdown (Far Right) -->
        <UDropdownMenu
          :items="statusDropdownItems"
          :ui="{ content: 'min-w-[140px]' }"
          class="ml-auto"
        >
          <UButton
            color="neutral"
            variant="outline"
            size="lg"
            class="cursor-pointer rounded-full px-5"
            trailing-icon="i-lucide-chevron-down"
          >
            <UIcon :name="currentStatusIcon" class="w-4 h-4 mr-2" />
            {{ currentStatusLabel }}
          </UButton>
        </UDropdownMenu>
      </div>

      <!-- Mobile: Stacked layout -->
      <div class="flex flex-col gap-3 lg:hidden">
        <!-- Row 1: Search and Status Dropdown -->
        <div class="flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <UInput
              v-model="filters.search"
              placeholder="Search locations..."
              icon="i-lucide-search"
              size="lg"
              class="w-full"
              @input="debouncedFetch"
            />
          </div>
          <UDropdownMenu :items="statusDropdownItems" :ui="{ content: 'min-w-[140px]' }">
            <UButton
              color="neutral"
              variant="outline"
              size="lg"
              class="cursor-pointer rounded-full px-3"
              trailing-icon="i-lucide-chevron-down"
            >
              <UIcon :name="currentStatusIcon" class="w-4 h-4" />
            </UButton>
          </UDropdownMenu>
        </div>

        <!-- Row 2: Type Filter Toggle Buttons (horizontally scrollable) -->
        <div class="overflow-x-auto -mx-3 px-3">
          <div class="flex items-center gap-1 p-1 bg-muted rounded-full w-fit">
            <button
              v-for="typeOpt in typeToggleOptions"
              :key="typeOpt.value ?? 'all'"
              type="button"
              class="px-3 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap"
              :class="getTypeButtonClass(typeOpt.value)"
              @click="selectType(typeOpt.value)"
            >
              {{ typeOpt.label }}
            </button>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading locations..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" @retry="fetchLocations" />

    <!-- Empty State -->
    <EmptyState
      v-else-if="!locations.length"
      icon="i-lucide-map-pin"
      title="No locations found"
      description="No locations match your search criteria. Try adjusting your filters or create a new location."
    >
      <template v-if="canManageLocations" #actions>
        <UButton
          color="primary"
          icon="i-lucide-plus"
          class="cursor-pointer"
          @click="navigateTo('/locations/create')"
        >
          Create Location
        </UButton>
      </template>
    </EmptyState>

    <!-- Locations Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 py-2">
      <LocationCard
        v-for="location in locations"
        :key="location.id"
        :location="location"
        :can-edit="canManageLocations()"
        :can-delete="canManageLocations()"
        @edit="handleEdit"
        @view-details="handleViewDetails"
        @delete="openDeleteModal"
      />
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen" :dismissible="deletingLocationId === null">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-subheading font-semibold">Confirm Location Deletion</h3>
          </template>

          <div class="space-y-4">
            <div
              v-if="locationToDelete"
              class="p-4 rounded-lg border-2 border-warning bg-warning/10"
            >
              <p class="font-semibold text-warning">
                {{ locationToDelete.name }}
              </p>
              <p class="text-caption mt-1">{{ locationToDelete.code }}</p>
            </div>

            <div class="space-y-2">
              <p class="font-medium">Are you sure you want to delete this location?</p>
              <ul class="list-disc list-inside text-caption space-y-1 pl-2">
                <li>If the location has transaction history, it will be deactivated</li>
                <li>If the location is empty, it will be permanently deleted</li>
                <li>Users assigned to this location will remain assigned</li>
                <li>Users with this as default location will have it cleared</li>
              </ul>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-default">
              <UButton
                color="neutral"
                variant="ghost"
                class="cursor-pointer"
                @click="isDeleteModalOpen = false"
                :disabled="deletingLocationId !== null"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                icon="i-lucide-trash-2"
                class="cursor-pointer"
                :loading="deletingLocationId !== null"
                @click="confirmDeleteLocation"
              >
                Delete Location
              </UButton>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { LocationType } from "@prisma/client";
import type { LocationDeleteResponse } from "../../../shared/types/api";

definePageMeta({
  layout: "default",
});

// Types
interface LocationItem {
  id: string;
  code: string;
  name: string;
  type: LocationType;
  address?: string | null;
  manager?: {
    id: string;
    username: string;
    full_name?: string | null;
  } | null;
  is_active: boolean;
  _count?: {
    user_locations?: number;
    location_stock?: number;
  };
}

interface LocationsResponse {
  locations: LocationItem[];
}

interface TypeOption {
  label: string;
  value: LocationType | null;
}

interface StatusOption {
  label: string;
  value: boolean | null;
}

// Composables
const { canManageLocations } = usePermissions();
const toast = useAppToast();

// State
const loading = ref(false);
const error = ref<string | null>(null);
const locations = ref<LocationItem[]>([]);

// Delete modal state
const isDeleteModalOpen = ref(false);
const deletingLocationId = ref<string | null>(null);
const locationToDelete = ref<LocationItem | null>(null);

const filters = reactive({
  search: "",
  type: null as LocationType | null,
  is_active: null as boolean | null,
  include_inactive: false,
});

// Filter options for toggle buttons
const typeToggleOptions: TypeOption[] = [
  { label: "All", value: null },
  { label: "Kitchen", value: "KITCHEN" },
  { label: "Store", value: "STORE" },
  { label: "Central", value: "CENTRAL" },
  { label: "Warehouse", value: "WAREHOUSE" },
];

// Status dropdown items
const statusDropdownItems = computed(() => [
  [
    {
      label: "Active",
      icon: "i-lucide-circle-check",
      active: filters.is_active === true,
      onSelect: () => selectStatus(true),
    },
    {
      label: "Inactive",
      icon: "i-lucide-archive",
      active: filters.is_active === false,
      onSelect: () => selectStatus(false),
    },
  ],
]);

// Current status label for dropdown button
const currentStatusLabel = computed(() => {
  if (filters.is_active === true) return "Active";
  if (filters.is_active === false) return "Inactive";
  return "Active";
});

// Current status icon for dropdown button
const currentStatusIcon = computed(() => {
  if (filters.is_active === false) return "i-lucide-archive";
  return "i-lucide-circle-check";
});

// Get button class based on type selection
const getTypeButtonClass = (typeValue: LocationType | null) => {
  const isSelected = filters.type === typeValue;

  if (!isSelected) {
    return "text-muted hover:text-default hover:bg-elevated";
  }

  // All selected options use the same primary background
  switch (typeValue) {
    case "KITCHEN":
    case "STORE":
    case "CENTRAL":
    case "WAREHOUSE":
    default:
      return "bg-primary text-white shadow-sm";
  }
};

// Select type handler
const selectType = (typeValue: LocationType | null) => {
  filters.type = typeValue;
  fetchLocations();
};

// Select status handler
const selectStatus = (statusValue: boolean) => {
  filters.is_active = statusValue;
  filters.include_inactive = !statusValue;
  fetchLocations();
};

// Fetch locations
const fetchLocations = async () => {
  loading.value = true;
  error.value = null;

  try {
    const query: Record<string, string | boolean> = {};

    if (filters.search) {
      query.search = filters.search;
    }
    if (filters.type) {
      query.type = filters.type;
    }
    // Handle is_active filter logic
    if (filters.is_active !== null) {
      query.is_active = filters.is_active;
    } else if (!filters.include_inactive) {
      // Default: only show active locations unless toggle is ON
      query.is_active = true;
    }

    const response = await $fetch<LocationsResponse>("/api/locations", {
      query,
    });

    locations.value = response.locations || [];
  } catch (err) {
    console.error("Error fetching locations:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch locations";
    error.value = errorMessage;
    toast.error("Error", { description: errorMessage });
  } finally {
    loading.value = false;
  }
};

// Debounced search
const debouncedFetch = useDebounceFn(() => {
  fetchLocations();
}, 500);

// Handlers
const handleEdit = (location: LocationItem) => {
  navigateTo(`/locations/${location.id}/edit`);
};

const handleViewDetails = (location: LocationItem) => {
  navigateTo(`/locations/${location.id}`);
};

// Delete handlers
const openDeleteModal = (location: LocationItem) => {
  locationToDelete.value = location;
  isDeleteModalOpen.value = true;
};

const confirmDeleteLocation = async () => {
  if (!locationToDelete.value) return;

  deletingLocationId.value = locationToDelete.value.id;

  try {
    const response = await $fetch<LocationDeleteResponse>(
      `/api/locations/${locationToDelete.value.id}`,
      {
        method: "DELETE",
      }
    );

    // Show appropriate success message based on delete type
    if (response.deactivated) {
      toast.warning("Location Deactivated", {
        description: response.message,
      });
    } else {
      toast.success("Location Deleted", {
        description: response.message,
      });
    }

    isDeleteModalOpen.value = false;
    locationToDelete.value = null;

    // Refresh list
    await fetchLocations();
  } catch (err: unknown) {
    console.error("Error deleting location:", err);
    const message =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to delete location";
    toast.error("Error", { description: message });

    // Close modal and refresh list even on error (location might have been deleted)
    isDeleteModalOpen.value = false;
    locationToDelete.value = null;
    await fetchLocations();
  } finally {
    deletingLocationId.value = null;
  }
};

// Lifecycle
onMounted(() => {
  fetchLocations();
});

// Set page title
useHead({
  title: "Locations - Stock Management System",
});
</script>
