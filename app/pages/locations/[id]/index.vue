<template>
  <div>
    <!-- Page Header -->
    <PageHeader
      :title="location?.name || 'Location Details'"
      icon="i-lucide-map-pin"
    >
      <template #actions>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          @click="navigateTo('/locations')"
        >
          Back to Locations
        </UButton>
        <UButton
          v-if="canManageLocations()"
          color="primary"
          icon="i-lucide-edit"
          @click="navigateTo(`/locations/${route.params.id}/edit`)"
        >
          Edit Location
        </UButton>
      </template>
    </PageHeader>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner
        size="lg"
        color="primary"
        text="Loading location details..."
      />
    </div>

    <!-- Error State -->
    <ErrorAlert
      v-else-if="error"
      :message="error"
      @retry="fetchLocationDetails"
    />

    <!-- Location Details -->
    <div v-else class="space-y-6">
      <!-- Basic Info Card -->
      <UCard>
        <template #header>
          <h2 class="text-subheading font-semibold">
            Location Information
          </h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="form-label">Code</label>
            <p class="text-body font-mono">{{ location.code }}</p>
          </div>
          <div>
            <label class="form-label">Type</label>
            <UBadge :color="locationTypeColor" variant="subtle" size="lg">
              {{ location.type }}
            </UBadge>
          </div>
          <div>
            <label class="form-label">Status</label>
            <UBadge
              :color="location.is_active ? 'success' : 'neutral'"
              variant="subtle"
              size="lg"
            >
              {{ location.is_active ? "Active" : "Inactive" }}
            </UBadge>
          </div>
          <div v-if="location.timezone">
            <label class="form-label">Timezone</label>
            <p class="text-body">{{ location.timezone }}</p>
          </div>
          <div v-if="location.address" class="md:col-span-2">
            <label class="form-label">Address</label>
            <p class="text-body">{{ location.address }}</p>
          </div>
          <div v-if="location.manager">
            <label class="form-label">Manager</label>
            <p class="text-body">
              {{ location.manager.full_name || location.manager.username }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- User Assignments Card (Admin Only) -->
      <UCard v-if="canManageLocations()">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-subheading font-semibold">User Assignments</h2>
            <UButton
              color="primary"
              icon="i-lucide-user-plus"
              size="sm"
              @click="openAssignUserModal"
            >
              Assign User
            </UButton>
          </div>
        </template>

        <!-- Assigned Users List -->
        <div v-if="loadingUsers" class="flex justify-center py-8">
          <LoadingSpinner size="md" color="primary" text="Loading users..." />
        </div>

        <div v-else-if="assignedUsers.length === 0" class="text-center py-8">
          <p class="text-caption">No users assigned to this location</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="assignment in assignedUsers"
            :key="assignment.user_id"
            class="flex items-center justify-between p-4 rounded-lg border border-default bg-default"
          >
            <div v-if="assignment.user" class="flex-1">
              <p class="font-medium">
                {{ assignment.user.full_name || assignment.user.username }}
              </p>
              <div class="flex items-center gap-3 mt-1">
                <p class="text-caption">
                  {{ assignment.user.email }}
                </p>
                <UBadge
                  :color="roleColor(assignment.user.role)"
                  variant="subtle"
                  size="sm"
                >
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
              :loading="removingUserId === assignment.user_id"
              @click="
                openRemoveModal(
                  assignment.user_id,
                  assignment.user.full_name || assignment.user.username
                )
              "
            >
              Remove
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Assign User Modal -->
    <UModal v-model:open="isAssignModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-subheading font-semibold">
              Assign User to {{ location?.name }}
            </h3>
          </template>

          <UForm
            :schema="assignUserSchema"
            :state="(assignFormData as any)"
            @submit="submitUserAssignment"
          >
            <div class="space-y-4">
              <!-- User Selection -->
              <UFormField label="User" name="user_id" required>
                <USelectMenu
                  v-model="assignFormData.user_id"
                  :items="availableUsers"
                  value-key="value"
                  placeholder="Select a user"
                  :loading="loadingAvailableUsers"
                  :disabled="submittingAssignment || loadingAvailableUsers"
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
                />
              </UFormField>

              <!-- Actions -->
              <div
                class="flex items-center justify-end gap-3 pt-4 border-t border-default"
              >
                <UButton
                  color="neutral"
                  variant="ghost"
                  @click="isAssignModalOpen = false"
                  :disabled="submittingAssignment"
                >
                  Cancel
                </UButton>
                <UButton
                  type="submit"
                  color="primary"
                  icon="i-lucide-user-plus"
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
    <UModal v-model:open="isRemoveModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-subheading font-semibold">Confirm Removal</h3>
          </template>

          <div class="space-y-4">
            <p>
              Are you sure you want to remove
              <strong>{{ userToRemove?.name }}</strong> from this location?
            </p>
            <p class="text-caption">This action cannot be undone.</p>

            <!-- Actions -->
            <div
              class="flex items-center justify-end gap-3 pt-4 border-t border-default"
            >
              <UButton
                color="neutral"
                variant="ghost"
                @click="isRemoveModalOpen = false"
                :disabled="removingUserId !== null"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                icon="i-lucide-trash-2"
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
  </div>
</template>

<script setup lang="ts">
import { z } from "zod";

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

// Assign form data
const assignFormData = reactive({
  user_id: "",
  access_level: "",
});

// Validation schema
const assignUserSchema = z.object({
  user_id: z.string().uuid("Please select a user"),
  access_level: z
    .enum(["VIEW", "POST", "MANAGE"])
    .describe("Please select an access level"),
});

// Access level options
const accessLevelOptions = [
  { label: "View Only", value: "VIEW" },
  { label: "Post Transactions", value: "POST" },
  { label: "Full Management", value: "MANAGE" },
];

// Computed
const locationTypeColor = computed(
  ():
    | "error"
    | "info"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "neutral" => {
    const colors: Record<
      string,
      | "error"
      | "info"
      | "primary"
      | "secondary"
      | "success"
      | "warning"
      | "neutral"
    > = {
      KITCHEN: "warning",
      STORE: "success",
      CENTRAL: "primary",
      WAREHOUSE: "neutral",
    };
    return colors[location.value?.type] || "neutral";
  }
);

// Helper functions
const roleColor = (
  role: string
):
  | "error"
  | "info"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "neutral" => {
  const colors: Record<
    string,
    | "error"
    | "info"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "neutral"
  > = {
    ADMIN: "error",
    SUPERVISOR: "warning",
    OPERATOR: "primary",
  };
  return colors[role] || "neutral";
};

const accessLevelColor = (
  level: string
):
  | "error"
  | "info"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "neutral" => {
  const colors: Record<
    string,
    | "error"
    | "info"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "neutral"
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
    const response = await $fetch<{ location: any }>(
      `/api/locations/${locationId}`
    );

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
    const response = await $fetch<{ users: any[] }>(
      `/api/locations/${locationId}/users`
    );

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

// Lifecycle
onMounted(async () => {
  await fetchLocationDetails();
  if (canManageLocations()) {
    await fetchAssignedUsers();
  }
});

// Set page title
useHead({
  title: () =>
    `${location.value?.name || "Location"} - Stock Management System`,
});
</script>
