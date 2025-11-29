<script setup lang="ts">
import type { FormSubmitEvent } from "#ui/types";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

definePageMeta({
  middleware: "role",
  roleRequired: "ADMIN",
});

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  default_location: {
    id: string;
    code: string;
    name: string;
  } | null;
  locations: Array<{
    location_id: string;
    location: {
      id: string;
      code: string;
      name: string;
      type: string;
    };
    access_level: string;
  }>;
}

interface Location {
  id: string;
  code: string;
  name: string;
  type: string;
}

const route = useRoute();
const toast = useToast();
const router = useRouter();

const userId = computed(() => route.params.id as string);

// State
const loading = ref(true);
const saving = ref(false);
const user = ref<User | null>(null);
const allLocations = ref<Location[]>([]);

// Form schema
const schema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(1, "Full name is required").max(100),
  role: z.enum(["OPERATOR", "SUPERVISOR", "ADMIN"]),
  is_active: z.boolean(),
  default_location_id: z.string().uuid().nullable().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number, and special character"
    )
    .optional()
    .or(z.literal("")),
});

type Schema = z.output<typeof schema>;

// Form state
const state = reactive({
  email: "",
  full_name: "",
  role: "OPERATOR" as UserRole,
  is_active: true,
  default_location_id: null as string | null,
  password: "",
});

// Role options
const roleOptions = [
  { value: "OPERATOR", label: "Operator", description: "Can post transactions and view stock" },
  {
    value: "SUPERVISOR",
    label: "Supervisor",
    description: "Can approve transfers and edit reconciliations",
  },
  { value: "ADMIN", label: "Admin", description: "Full system access and management" },
];

// Location access management
const selectedLocationId = ref("");
const selectedAccessLevel = ref("VIEW");

const accessLevelOptions = [
  { value: "VIEW", label: "View", description: "Can only view data" },
  { value: "POST", label: "Post", description: "Can create transactions" },
  { value: "MANAGE", label: "Manage", description: "Full location access" },
];

// Fetch user
const fetchUser = async () => {
  try {
    loading.value = true;
    const response = await $fetch<{ user: User }>(`/api/users/${userId.value}`);
    user.value = response.user;

    // Populate form
    state.email = user.value!.email;
    state.full_name = user.value!.full_name;
    state.role = user.value!.role;
    state.is_active = user.value!.is_active;
    state.default_location_id = user.value!.default_location?.id || null;
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: error.data?.message || "Failed to load user",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

// Fetch locations
const fetchLocations = async () => {
  try {
    const response = await $fetch<{ locations: Location[] }>("/api/locations");
    allLocations.value = response.locations;
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: error.data?.message || "Failed to load locations",
      color: "error",
    });
  }
};

// Available locations (not already assigned)
const availableLocations = computed(() => {
  if (!user.value) return [];
  const assignedIds = user.value.locations.map((l) => l.location_id);
  return allLocations.value.filter((l) => !assignedIds.includes(l.id));
});

// Add location access
const addLocationAccess = async () => {
  if (!selectedLocationId.value || !user.value) {
    return;
  }

  try {
    const response = await $fetch(`/api/locations/${selectedLocationId.value}/users`, {
      method: "POST",
      body: {
        user_id: userId.value,
        access_level: selectedAccessLevel.value,
      },
    });

    toast.add({
      title: "Success",
      description: response.message || "Location access added successfully",
      color: "success",
    });

    await fetchUser();
    selectedLocationId.value = "";
    selectedAccessLevel.value = "VIEW";
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: error.data?.message || "Failed to add location access",
      color: "error",
    });
  }
};

// Remove location access
const removeLocationAccess = async (locationId: string) => {
  if (!user.value) return;

  try {
    await $fetch(`/api/locations/${locationId}/users/${userId.value}`, {
      method: "DELETE",
    });

    toast.add({
      title: "Success",
      description: "Location access removed successfully",
      color: "success",
    });

    // Refresh user data
    await fetchUser();
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: error.data?.message || "Failed to remove location access",
      color: "error",
    });
  }
};

// Submit handler
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  try {
    saving.value = true;

    const updateData: any = {
      email: event.data.email,
      full_name: event.data.full_name,
      role: event.data.role,
      is_active: event.data.is_active,
      default_location_id: event.data.default_location_id,
    };

    // Only include password if it was provided
    if (event.data.password && event.data.password.length > 0) {
      updateData.password = event.data.password;
    }

    await $fetch(`/api/users/${userId.value}`, {
      method: "PATCH",
      body: updateData,
    });

    toast.add({
      title: "Success",
      description: "User updated successfully",
      color: "success",
    });

    router.push(`/users/${userId.value}`);
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: error.data?.message || "Failed to update user",
      color: "error",
    });
  } finally {
    saving.value = false;
  }
};

// Load data on mount
onMounted(() => {
  fetchUser();
  fetchLocations();
});
</script>

<template>
  <div class="p-4 md:p-6">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <UButton
        icon="i-heroicons-arrow-left"
        color="neutral"
        variant="ghost"
        :to="`/users/${userId}`"
        aria-label="Back to user details"
        class="cursor-pointer"
      />
      <div>
        <h1 class="text-heading">Edit User</h1>
        <p class="text-caption mt-1">Update user information and permissions</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-muted" />
    </div>

    <!-- Edit Form -->
    <div v-else-if="user" class="space-y-6">
      <!-- Basic Information -->
      <UCard>
        <template #header>
          <h2 class="text-label">Basic Information</h2>
        </template>

        <UForm :schema="schema" :state="state" @submit="onSubmit">
          <div class="space-y-6">
            <!-- Account Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-caption mb-2">Username</p>
                <p class="text-default font-medium">@{{ user.username }}</p>
                <p class="text-caption mt-1">Username cannot be changed</p>
              </div>

              <UFormField name="email" label="Email Address" required>
                <UInput
                  v-model="state.email"
                  type="email"
                  icon="i-heroicons-envelope"
                />
              </UFormField>

              <UFormField name="full_name" label="Full Name" required>
                <UInput v-model="state.full_name" icon="i-heroicons-user" />
              </UFormField>

              <UFormField name="role" label="User Role" required>
                <USelect v-model="state.role" :items="roleOptions" />
              </UFormField>

              <UFormField
                name="default_location_id"
                label="Default Location"
                description="User's default working location"
              >
                <USelect
                  v-model="state.default_location_id"
                  :items="[
                    { value: null, label: 'None' },
                    ...allLocations.map((l) => ({
                      value: l.id,
                      label: `${l.code} - ${l.name}`,
                    })),
                  ]"
                />
              </UFormField>

              <UFormField name="is_active" label="Account Status">
                <USwitch v-model="state.is_active">
                  <template #label>
                    <span :class="state.is_active ? 'text-success' : 'text-muted'">
                      {{ state.is_active ? "Active" : "Inactive" }}
                    </span>
                  </template>
                </USwitch>
              </UFormField>
            </div>

            <!-- Password Change (Optional) -->
            <div>
              <h3 class="text-label mb-4">Change Password (Optional)</h3>
              <UFormField
                name="password"
                label="New Password"
                description="Leave blank to keep current password"
              >
                <UInput
                  v-model="state.password"
                  type="password"
                  placeholder="••••••••"
                  icon="i-heroicons-lock-closed"
                />
              </UFormField>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t border-default">
              <UButton
                label="Cancel"
                color="neutral"
                variant="ghost"
                :to="`/users/${userId}`"
                class="cursor-pointer"
              />
              <UButton
                type="submit"
                label="Save Changes"
                color="primary"
                :loading="saving"
                :disabled="saving"
                class="cursor-pointer"
              />
            </div>
          </div>
        </UForm>
      </UCard>

      <!-- Location Access Management -->
      <UCard>
        <template #header>
          <h2 class="text-label">Location Access</h2>
        </template>

        <!-- Current Locations -->
        <div v-if="user.locations.length > 0" class="space-y-3 mb-6">
          <div
            v-for="loc in user.locations"
            :key="loc.location_id"
            class="flex items-center justify-between p-3 bg-elevated rounded-lg border border-default"
          >
            <div class="flex items-center gap-3">
              <UIcon
                name="i-heroicons-map-pin"
                class="w-5 h-5 text-primary flex-shrink-0"
              />
              <div>
                <p class="text-default font-medium">{{ loc.location.name }}</p>
                <p class="text-caption">{{ loc.location.code }} • {{ loc.access_level }}</p>
              </div>
            </div>
            <UButton
              icon="i-heroicons-trash"
              color="error"
              variant="ghost"
              size="sm"
              aria-label="Remove access"
              class="cursor-pointer"
              @click="removeLocationAccess(loc.location_id)"
            />
          </div>
        </div>

        <div v-else class="text-center py-6 mb-6">
          <p class="text-caption">No locations assigned yet</p>
        </div>

        <!-- Add New Location -->
        <div v-if="availableLocations.length > 0" class="pt-4 border-t border-default">
          <h3 class="text-label mb-4">Add Location Access</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <USelect
              v-model="selectedLocationId"
              :items="availableLocations.map((l) => ({
                value: l.id,
                label: `${l.code} - ${l.name}`,
              }))"
              value-key="value"
              placeholder="Select location"
            />
            <USelect
              v-model="selectedAccessLevel"
              :items="accessLevelOptions"
              value-key="value"
            />
            <UButton
              label="Add Location"
              icon="i-heroicons-plus"
              color="primary"
              :disabled="!selectedLocationId"
              class="cursor-pointer"
              @click="addLocationAccess"
            />
          </div>
        </div>

        <div v-else class="pt-4 border-t border-default text-center">
          <p class="text-caption">All locations have been assigned</p>
        </div>
      </UCard>
    </div>
  </div>
</template>
