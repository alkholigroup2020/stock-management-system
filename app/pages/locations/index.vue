<template>
  <div>
    <!-- Page Header -->
    <PageHeader title="Locations" icon="i-lucide-map-pin">
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
    </PageHeader>

    <!-- Filters -->
    <UCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            :options="typeOptions"
            placeholder="All types"
            @update:model-value="fetchLocations"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <label class="form-label">Status</label>
          <USelectMenu
            v-model="filters.is_active"
            :options="statusOptions"
            placeholder="All statuses"
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
        <UButton
          color="primary"
          icon="i-lucide-plus"
          @click="navigateTo('/locations/create')"
        >
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
        @edit="handleEdit"
        @view-details="handleViewDetails"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { LocationType } from "@prisma/client";

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

const filters = reactive({
  search: "",
  type: null as LocationType | null,
  is_active: null as boolean | null,
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
    if (filters.is_active !== null) {
      query.is_active = filters.is_active;
    }

    const response = await $fetch<LocationsResponse>("/api/locations", {
      query,
    });

    locations.value = response.locations || [];
  } catch (err) {
    console.error("Error fetching locations:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Failed to fetch locations";
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

// Lifecycle
onMounted(() => {
  fetchLocations();
});

// Set page title
useHead({
  title: "Locations - Stock Management System",
});
</script>
