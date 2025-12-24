<template>
  <div class="px-3 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-map-pin" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">
            {{ location?.name || "Location Details" }}
          </h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            View and manage location information
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="soft"
          icon="i-lucide-arrow-left"
          size="lg"
          class="cursor-pointer rounded-full px-3 sm:px-6"
          @click="navigateTo('/locations')"
        >
          <span class="hidden sm:inline">Back</span>
        </UButton>
        <UButton
          v-if="canManageLocations()"
          color="primary"
          icon="i-lucide-edit"
          size="lg"
          class="cursor-pointer rounded-full px-3 sm:px-6"
          @click="navigateTo(`/locations/${route.params.id}/edit`)"
        >
          <span class="hidden sm:inline">Edit Location</span>
          <span class="sm:hidden">Edit</span>
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading location details..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" @retry="fetchLocationDetails" />

    <!-- Location Details -->
    <div v-else class="space-y-6">
      <!-- Basic Info Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Location Information
            </h2>
            <UBadge :color="location.is_active ? 'success' : 'neutral'" variant="subtle" size="lg">
              {{ location.is_active ? "Active" : "Inactive" }}
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Location Code (Read-only full-width) -->
          <div
            class="lg:col-span-2 p-4 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border-muted)]"
          >
            <label class="form-label text-xs mb-2">Location Code</label>
            <span class="text-lg font-mono font-semibold text-[var(--ui-text)]">
              {{ location.code }}
            </span>
          </div>

          <!-- Location Type -->
          <div>
            <label class="form-label">Location Type</label>
            <div class="mt-2">
              <UBadge :color="locationTypeColor" variant="subtle" size="lg">
                <UIcon :name="locationTypeIcon" class="w-4 h-4 mr-1.5" />
                {{ location.type }}
              </UBadge>
            </div>
          </div>

          <!-- Timezone -->
          <div v-if="location.timezone">
            <label class="form-label">Timezone</label>
            <p class="text-[var(--ui-text)] font-medium mt-2">
              {{ location.timezone }}
            </p>
          </div>

          <!-- Address (Full width) -->
          <div v-if="location.address" class="lg:col-span-2">
            <label class="form-label">Address</label>
            <p class="text-[var(--ui-text)] mt-2">{{ location.address }}</p>
          </div>
        </div>
      </UCard>

      <!-- Danger Zone Card (Admin Only) -->
      <UCard
        v-if="canManageLocations()"
        class="card-elevated border-2 border-[var(--ui-error)]"
        :ui="{ body: 'p-4 sm:p-6' }"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-error" />
            <h2 class="text-lg font-semibold text-error">Danger Zone</h2>
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <p class="text-[var(--ui-text)] font-medium mb-2">Delete this location</p>
            <p class="text-caption text-[var(--ui-text-muted)] mb-4">
              Once you delete a location, there is no going back. If the location has transaction
              history, it will be deactivated instead.
            </p>
            <UButton
              color="error"
              icon="i-lucide-trash-2"
              size="lg"
              class="cursor-pointer"
              @click="openDeleteModal"
            >
              Delete Location
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen" :dismissible="!deletingLocation">
      <template #content>
        <UCard :ui="{ body: 'p-6' }">
          <template #header>
            <h3 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Confirm Location Deletion
            </h3>
          </template>

          <div class="space-y-4">
            <div
              v-if="location"
              class="p-4 rounded-lg border-2 border-[var(--ui-warning)] bg-[var(--ui-warning)]/10"
            >
              <p class="font-semibold text-[var(--ui-warning)]">
                {{ location.name }}
              </p>
              <p class="text-caption text-[var(--ui-text-muted)] mt-1">{{ location.code }}</p>
            </div>

            <div class="space-y-2">
              <p class="font-medium text-[var(--ui-text)]">
                Are you sure you want to delete this location?
              </p>
              <ul
                class="list-disc list-inside text-caption text-[var(--ui-text-muted)] space-y-1 pl-2"
              >
                <li>If the location has transaction history, it will be deactivated</li>
                <li>If the location is empty, it will be permanently deleted</li>
                <li>Users assigned to this location will remain assigned</li>
                <li>Users with this as default location will have it cleared</li>
              </ul>
            </div>

            <!-- Actions -->
            <div
              class="flex items-center justify-end gap-3 pt-4 border-t border-[var(--ui-border)]"
            >
              <UButton
                color="neutral"
                variant="soft"
                class="cursor-pointer"
                @click="isDeleteModalOpen = false"
                :disabled="deletingLocation"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                icon="i-lucide-trash-2"
                class="cursor-pointer"
                :loading="deletingLocation"
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
import type { LocationDeleteResponse } from "../../../../shared/types/api";

definePageMeta({
  middleware: "role",
  roleRequired: "ADMIN",
  layout: "default",
});

// Composables
const route = useRoute();
const toast = useAppToast();
const { canManageLocations } = usePermissions();

// State
const loading = ref(true);
const error = ref<string | null>(null);
const location = ref<any>(null);

// Delete modal state
const isDeleteModalOpen = ref(false);
const deletingLocation = ref(false);

// Computed
const locationTypeColor = computed(
  (): "error" | "info" | "primary" | "secondary" | "success" | "warning" | "neutral" => {
    const colors: Record<
      string,
      "error" | "info" | "primary" | "secondary" | "success" | "warning" | "neutral"
    > = {
      KITCHEN: "warning",
      STORE: "success",
      CENTRAL: "primary",
      WAREHOUSE: "neutral",
    };
    return colors[location.value?.type] || "neutral";
  }
);

const locationTypeIcon = computed(() => {
  const icons: Record<string, string> = {
    KITCHEN: "i-lucide-chef-hat",
    STORE: "i-lucide-store",
    CENTRAL: "i-lucide-building-2",
    WAREHOUSE: "i-lucide-warehouse",
  };
  return icons[location.value?.type] || "i-lucide-map-pin";
});

// Fetch location details
const fetchLocationDetails = async () => {
  loading.value = true;
  error.value = null;

  try {
    const locationId = route.params.id as string;
    const response = await $fetch<{ location: any }>(`/api/locations/${locationId}`);

    location.value = response.location;
  } catch (err: any) {
    console.error("Error fetching location details:", err);
    error.value = err.data?.message || "Failed to fetch location details";
    toast.error("Error", { description: error.value || undefined });
  } finally {
    loading.value = false;
  }
};

// Delete handlers
const openDeleteModal = () => {
  isDeleteModalOpen.value = true;
};

const confirmDeleteLocation = async () => {
  if (!location.value) return;

  deletingLocation.value = true;

  try {
    const response = await $fetch<LocationDeleteResponse>(`/api/locations/${location.value.id}`, {
      method: "DELETE",
    });

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

    // Navigate back to locations list
    navigateTo("/locations");
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
  } finally {
    deletingLocation.value = false;
  }
};

// Lifecycle
onMounted(async () => {
  await fetchLocationDetails();
});

// Set page title
useHead({
  title: () => `${location.value?.name || "Location"} - Stock Management System`,
});
</script>
