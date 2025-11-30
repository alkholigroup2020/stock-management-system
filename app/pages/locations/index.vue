<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <LayoutPageHeader
      title="Locations"
      icon="i-lucide-store"
      :show-location="true"
      :show-period="true"
      location-scope="all"
    >
      <template #actions>
        <UButton
          v-if="canManageLocations"
          color="primary"
          icon="i-lucide-plus"
          @click="navigateTo('/locations/create')"
        >
          Create Location
        </UButton>
      </template>
    </LayoutPageHeader>

    <!-- Filters -->
    <UCard>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label class="form-label">Search</label>
          <UInput
            v-model="filters.search"
            placeholder="Search by name or code..."
            icon="i-lucide-search"
            @input="debouncedFetch"
          />
        </div>

        <!-- Type Filter -->
        <div>
          <label class="form-label">Location Type</label>
          <USelectMenu
            v-model="filters.type"
            :items="typeOptions"
            value-key="value"
            placeholder="All types"
            @update:model-value="fetchLocations"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <label class="form-label">Status</label>
          <USelectMenu
            v-model="filters.is_active"
            :items="statusOptions"
            value-key="value"
            placeholder="All statuses"
            @update:model-value="fetchLocations"
          />
        </div>

        <!-- Include Inactive Toggle -->
        <div>
          <label class="form-label">Show Inactive</label>
          <USwitch
            v-model="filters.include_inactive"
            @update:model-value="fetchLocations"
          />
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
        <UButton color="primary" icon="i-lucide-plus" class="cursor-pointer" @click="navigateTo('/locations/create')">
          Create Location
        </UButton>
      </template>
    </EmptyState>

    <!-- Locations Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <UModal v-model:open="isDeleteModalOpen">
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

// Filter options
const typeOptions: TypeOption[] = [
  { label: "All Types", value: null },
  { label: "Kitchen", value: "KITCHEN" },
  { label: "Store", value: "STORE" },
  { label: "Central", value: "CENTRAL" },
  { label: "Warehouse", value: "WAREHOUSE" },
];

const statusOptions: StatusOption[] = [
  { label: "All Statuses", value: null },
  { label: "Active", value: true },
  { label: "Inactive", value: false },
];

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
      err && typeof err === "object" && "data" in err && err.data && typeof err.data === "object" && "message" in err.data
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

