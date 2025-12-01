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

      <!-- User Assignments Card (Admin Only) -->
      <UCard v-if="canManageLocations()" class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
              User Assignments
            </h2>
            <UButton
              color="primary"
              icon="i-lucide-user-plus"
              size="lg"
              class="cursor-pointer rounded-full px-3 sm:px-5"
              @click="openAssignUserModal"
            >
              <span class="hidden sm:inline">Assign User</span>
              <span class="sm:hidden">Assign</span>
            </UButton>
          </div>
        </template>

        <!-- Loading Users -->
        <div v-if="loadingUsers" class="flex justify-center py-8">
          <LoadingSpinner size="md" color="primary" text="Loading users..." />
        </div>

        <!-- No Users Assigned -->
        <EmptyState
          v-else-if="assignedUsers.length === 0"
          icon="i-lucide-users"
          title="No users assigned"
          description="No users have been assigned to this location yet."
        >
          <template #actions>
            <UButton
              color="primary"
              icon="i-lucide-user-plus"
              class="cursor-pointer"
              @click="openAssignUserModal"
            >
              Assign User
            </UButton>
          </template>
        </EmptyState>

        <!-- Assigned Users List -->
        <div v-else class="space-y-3">
          <div
            v-for="assignment in assignedUsers"
            :key="assignment.user_id"
            class="flex items-center justify-between p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] hover:bg-[var(--ui-bg-hover)] smooth-transition"
          >
            <div v-if="assignment.user" class="flex-1 min-w-0">
              <p class="font-semibold text-[var(--ui-text)]">
                {{ assignment.user.full_name || assignment.user.username }}
              </p>
              <p class="text-caption text-[var(--ui-text-muted)] mt-0.5 truncate">
                {{ assignment.user.email }}
              </p>
              <div class="flex items-center gap-2 mt-2">
                <UBadge :color="roleColor(assignment.user.role)" variant="subtle" size="sm">
                  {{ assignment.user.role }}
                </UBadge>
                <UBadge
                  :color="accessLevelColor(assignment.access_level)"
                  variant="subtle"
                  size="sm"
                >
                  {{ assignment.access_level }}
                </UBadge>
              </div>
            </div>
            <UButton
              v-if="assignment.user"
              color="error"
              variant="ghost"
              icon="i-lucide-x"
              size="sm"
              class="cursor-pointer ml-3 flex-shrink-0"
              :loading="removingUserId === assignment.user_id"
              @click="
                openRemoveModal(
                  assignment.user_id,
                  assignment.user.full_name || assignment.user.username
                )
              "
            >
              <span class="hidden sm:inline">Remove</span>
            </UButton>
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

    <!-- Assign User Modal -->
    <UModal v-model:open="isAssignModalOpen" :dismissible="!submittingAssignment">
      <template #content>
        <UCard :ui="{ body: 'p-6' }">
          <template #header>
            <h3 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Assign User to {{ location?.name }}
            </h3>
          </template>

          <UForm
            :schema="assignUserSchema"
            :state="assignFormData as any"
            @submit="submitUserAssignment"
          >
            <div class="space-y-6">
              <!-- User Selection -->
              <UFormField label="User" name="user_id" required>
                <USelectMenu
                  v-model="assignFormData.user_id"
                  :items="availableUsers"
                  value-key="value"
                  placeholder="Select a user"
                  :loading="loadingAvailableUsers"
                  :disabled="submittingAssignment || loadingAvailableUsers"
                  class="w-full"
                />
              </UFormField>

              <!-- Access Level Selection -->
              <UFormField
                label="Access Level"
                name="access_level"
                required
                help="VIEW: Read-only, POST: Can post transactions, MANAGE: Full access"
              >
                <USelectMenu
                  v-model="assignFormData.access_level"
                  :items="accessLevelOptions"
                  value-key="value"
                  placeholder="Select access level"
                  :disabled="submittingAssignment"
                  class="w-full"
                />
              </UFormField>

              <!-- Actions -->
              <div
                class="flex items-center justify-end gap-3 pt-4 border-t border-[var(--ui-border)]"
              >
                <UButton
                  color="error"
                  variant="soft"
                  class="cursor-pointer"
                  @click="isAssignModalOpen = false"
                  :disabled="submittingAssignment"
                >
                  Cancel
                </UButton>
                <UButton
                  type="submit"
                  color="primary"
                  icon="i-lucide-user-plus"
                  class="cursor-pointer"
                  :loading="submittingAssignment"
                >
                  Assign User
                </UButton>
              </div>
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>

    <!-- Remove User Confirmation Modal -->
    <UModal v-model:open="isRemoveModalOpen" :dismissible="removingUserId === null">
      <template #content>
        <UCard :ui="{ body: 'p-6' }">
          <template #header>
            <h3 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">Confirm Removal</h3>
          </template>

          <div class="space-y-4">
            <p class="text-[var(--ui-text)]">
              Are you sure you want to remove
              <strong>{{ userToRemove?.name }}</strong>
              from this location?
            </p>
            <p class="text-caption text-[var(--ui-text-muted)]">This action cannot be undone.</p>

            <!-- Actions -->
            <div
              class="flex items-center justify-end gap-3 pt-4 border-t border-[var(--ui-border)]"
            >
              <UButton
                color="error"
                variant="soft"
                class="cursor-pointer"
                @click="isRemoveModalOpen = false"
                :disabled="removingUserId !== null"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                icon="i-lucide-trash-2"
                class="cursor-pointer"
                :loading="removingUserId !== null"
                @click="confirmRemoveUser"
              >
                Remove User
              </UButton>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>

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
                color="error"
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
import { z } from "zod";
import type { LocationDeleteResponse } from "../../../../shared/types/api";

definePageMeta({
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

const loadingUsers = ref(false);
const assignedUsers = ref<any[]>([]);

const loadingAvailableUsers = ref(false);
const availableUsers = ref<any[]>([]);

const isAssignModalOpen = ref(false);
const submittingAssignment = ref(false);
const removingUserId = ref<string | null>(null);

const isRemoveModalOpen = ref(false);
const userToRemove = ref<{ id: string; name: string } | null>(null);

// Delete modal state
const isDeleteModalOpen = ref(false);
const deletingLocation = ref(false);

// Assign form data
const assignFormData = reactive({
  user_id: "",
  access_level: "",
});

// Validation schema
const assignUserSchema = z.object({
  user_id: z.string().uuid("Please select a user"),
  access_level: z.enum(["VIEW", "POST", "MANAGE"]).describe("Please select an access level"),
});

// Access level options
const accessLevelOptions = [
  { label: "View Only", value: "VIEW" },
  { label: "Post Transactions", value: "POST" },
  { label: "Full Management", value: "MANAGE" },
];

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

// Helper functions
const roleColor = (
  role: string
): "error" | "info" | "primary" | "secondary" | "success" | "warning" | "neutral" => {
  const colors: Record<
    string,
    "error" | "info" | "primary" | "secondary" | "success" | "warning" | "neutral"
  > = {
    ADMIN: "error",
    SUPERVISOR: "warning",
    OPERATOR: "primary",
  };
  return colors[role] || "neutral";
};

const accessLevelColor = (
  level: string
): "error" | "info" | "primary" | "secondary" | "success" | "warning" | "neutral" => {
  const colors: Record<
    string,
    "error" | "info" | "primary" | "secondary" | "success" | "warning" | "neutral"
  > = {
    MANAGE: "success",
    POST: "primary",
    VIEW: "neutral",
  };
  return colors[level] || "neutral";
};

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

// Fetch assigned users
const fetchAssignedUsers = async () => {
  if (!canManageLocations()) return;

  loadingUsers.value = true;

  try {
    const locationId = route.params.id as string;
    const response = await $fetch<{ users: any[] }>(`/api/locations/${locationId}/users`);

    assignedUsers.value = response.users || [];
  } catch (err: any) {
    console.error("Error fetching assigned users:", err);
    toast.error("Error", { description: "Failed to load assigned users" });
  } finally {
    loadingUsers.value = false;
  }
};

// Fetch available users for assignment
const fetchAvailableUsers = async () => {
  loadingAvailableUsers.value = true;

  try {
    const response = await $fetch<{ users: any[] }>("/api/users", {
      query: { is_active: true },
    });

    const users = response.users || [];
    availableUsers.value = users.map((user: any) => ({
      label: `${user.full_name || user.username} (${user.email})`,
      value: user.id,
    }));
  } catch (err: any) {
    console.error("Error fetching available users:", err);
    toast.error("Error", { description: "Failed to load users" });
  } finally {
    loadingAvailableUsers.value = false;
  }
};

// Open assign user modal
const openAssignUserModal = () => {
  assignFormData.user_id = "";
  assignFormData.access_level = "";
  isAssignModalOpen.value = true;
  fetchAvailableUsers();
};

// Submit user assignment
const submitUserAssignment = async () => {
  submittingAssignment.value = true;

  try {
    const locationId = route.params.id as string;

    const payload = {
      user_id: assignFormData.user_id,
      access_level: assignFormData.access_level,
    };

    const response = await $fetch(`/api/locations/${locationId}/users`, {
      method: "POST",
      body: payload,
    });

    toast.success("Success", { description: response.message });
    isAssignModalOpen.value = false;

    // Refresh assigned users list
    await fetchAssignedUsers();
  } catch (err: any) {
    console.error("Error assigning user:", err);
    const message = err.data?.message || "Failed to assign user";
    toast.error("Error", { description: message });
  } finally {
    submittingAssignment.value = false;
  }
};

// Open remove confirmation modal
const openRemoveModal = (userId: string, userName: string) => {
  userToRemove.value = { id: userId, name: userName };
  isRemoveModalOpen.value = true;
};

// Confirm and remove user assignment
const confirmRemoveUser = async () => {
  if (!userToRemove.value) return;

  removingUserId.value = userToRemove.value.id;

  try {
    const locationId = route.params.id as string;

    const response = await $fetch<{ message: string }>(
      `/api/locations/${locationId}/users/${userToRemove.value.id}`,
      {
        method: "DELETE",
      }
    );

    toast.success("Success", { description: response.message });
    isRemoveModalOpen.value = false;
    userToRemove.value = null;

    // Refresh assigned users list
    await fetchAssignedUsers();
  } catch (err: any) {
    console.error("Error removing user assignment:", err);
    const message = err.data?.message || "Failed to remove user assignment";
    toast.error("Error", { description: message });
  } finally {
    removingUserId.value = null;
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
  if (canManageLocations()) {
    await fetchAssignedUsers();
  }
});

// Set page title
useHead({
  title: () => `${location.value?.name || "Location"} - Stock Management System`,
});
</script>
