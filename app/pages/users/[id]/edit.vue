<script setup lang="ts">
import type { FormSubmitEvent } from "#ui/types";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

definePageMeta({
  middleware: "role",
  roleRequired: "ADMIN",
  layout: "default",
});

// Composables
const route = useRoute();
const toast = useAppToast();

// Types
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

// State
const loading = ref(true);
const submitting = ref(false);
const error = ref<string | null>(null);
const user = ref<User | null>(null);
const allLocations = ref<Location[]>([]);
const formRef = ref<{ submit: () => void } | null>(null);

// Original data for change detection
const originalData = ref<{
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  default_location_id: string | null;
} | null>(null);

// Form schema
const schema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(1, "Full name is required").max(100),
  role: z.enum(["OPERATOR", "SUPERVISOR", "ADMIN"]),
  is_active: z.boolean(),
  default_location_id: z.string().uuid("Invalid location").nullable().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number, and special character (@$!%*?&)"
    )
    .optional()
    .or(z.literal("")),
});

type Schema = z.output<typeof schema>;

// Form data
const formData = reactive({
  email: "",
  full_name: "",
  role: "OPERATOR" as UserRole,
  is_active: true,
  default_location_id: null as string | null,
  password: "",
});

// Role options
const roleOptions = [
  {
    value: "OPERATOR",
    label: "Operator",
    description: "Can post transactions and view stock",
  },
  {
    value: "SUPERVISOR",
    label: "Supervisor",
    description: "Can approve transfers and edit reconciliations",
  },
  {
    value: "ADMIN",
    label: "Admin",
    description: "Full system access and management",
  },
];

// Location options
const locationOptions = computed(() => [
  { value: null, label: "None (Optional)" },
  ...allLocations.value.map((l) => ({
    value: l.id,
    label: `${l.code} - ${l.name}`,
  })),
]);

// Location access state
const selectedLocationId = ref("");
const selectedAccessLevel = ref("VIEW");

const accessLevelOptions = [
  { value: "VIEW", label: "View", description: "Can only view data" },
  { value: "POST", label: "Post", description: "Can create transactions" },
  { value: "MANAGE", label: "Manage", description: "Full location access" },
];

// Access level badge color
const getAccessLevelColor = (
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

// Available locations (not already assigned)
const availableLocations = computed(() => {
  if (!user.value) return [];
  const assignedIds = user.value.locations.map((l) => l.location_id);
  return allLocations.value.filter((l) => !assignedIds.includes(l.id));
});

// Check if form has changes
const hasChanges = computed(() => {
  if (!originalData.value) return false;

  return (
    formData.email !== originalData.value.email ||
    formData.full_name !== originalData.value.full_name ||
    formData.role !== originalData.value.role ||
    formData.is_active !== originalData.value.is_active ||
    formData.default_location_id !== originalData.value.default_location_id ||
    (formData.password && formData.password.length > 0)
  );
});

// Fetch user
const fetchUser = async () => {
  loading.value = true;
  error.value = null;

  try {
    const userId = route.params.id as string;
    const response = await $fetch<{ user: User }>(`/api/users/${userId}`);
    user.value = response.user;

    // Populate form
    formData.email = user.value.email;
    formData.full_name = user.value.full_name;
    formData.role = user.value.role;
    formData.is_active = user.value.is_active;
    formData.default_location_id = user.value.default_location?.id || null;

    // Store original data for change detection
    originalData.value = {
      email: user.value.email,
      full_name: user.value.full_name,
      role: user.value.role,
      is_active: user.value.is_active,
      default_location_id: user.value.default_location?.id || null,
    };
  } catch (err: unknown) {
    console.error("Error fetching user:", err);
    const message =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to fetch user details";
    error.value = message;
    toast.error("Error", { description: message });
  } finally {
    loading.value = false;
  }
};

// Fetch locations
const fetchLocations = async () => {
  try {
    const response = await $fetch<{ locations: Location[] }>("/api/locations");
    allLocations.value = response.locations;
  } catch (err: unknown) {
    console.error("Error fetching locations:", err);
    const message =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to load locations";
    toast.error("Error", { description: message });
  }
};

// Add location access
const addLocationAccess = async () => {
  if (!selectedLocationId.value || !user.value) {
    return;
  }

  try {
    const response = await $fetch<{ message?: string }>(
      `/api/locations/${selectedLocationId.value}/users`,
      {
        method: "POST",
        body: {
          user_id: route.params.id as string,
          access_level: selectedAccessLevel.value,
        },
      }
    );

    toast.success("Success", {
      description: response.message || "Location access added successfully",
    });

    await fetchUser();
    selectedLocationId.value = "";
    selectedAccessLevel.value = "VIEW";
  } catch (err: unknown) {
    console.error("Error adding location access:", err);
    const message =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to add location access";
    toast.error("Error", { description: message });
  }
};

// Remove location access
const removeLocationAccess = async (locationId: string) => {
  if (!user.value) return;

  try {
    await $fetch(`/api/locations/${locationId}/users/${route.params.id as string}`, {
      method: "DELETE",
    });

    toast.success("Success", {
      description: "Location access removed successfully",
    });

    await fetchUser();
  } catch (err: unknown) {
    console.error("Error removing location access:", err);
    const message =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to remove location access";
    toast.error("Error", { description: message });
  }
};

// Submit handler
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  // Check if there are changes
  if (!hasChanges.value) {
    toast.warning("No Changes", {
      description: "No changes were made to the user",
    });
    return;
  }

  submitting.value = true;

  try {
    const userId = route.params.id as string;

    const updateData: Record<string, unknown> = {
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

    await $fetch(`/api/users/${userId}`, {
      method: "PATCH",
      body: updateData,
    });

    toast.success("Success", { description: "User updated successfully" });
    await navigateTo(`/users/${userId}`);
  } catch (err: unknown) {
    console.error("Error updating user:", err);
    const message =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to update user";
    toast.error("Error", { description: message });
  } finally {
    submitting.value = false;
  }
};

// Handle cancel
const handleCancel = () => {
  if (hasChanges.value) {
    const confirmed = confirm("You have unsaved changes. Are you sure you want to leave?");
    if (!confirmed) return;
  }
  navigateTo(`/users/${route.params.id as string}`);
};

// Load data on mount
onMounted(() => {
  fetchUser();
  fetchLocations();
});

// Set page title
useHead({
  title: () => `Edit ${user.value?.full_name || "User"} - Stock Management System`,
});
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <!-- Title with icon -->
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-user-pen" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Edit User</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Update user information and permissions
          </p>
        </div>
      </div>
      <!-- Back button -->
      <UButton
        color="neutral"
        variant="soft"
        icon="i-lucide-arrow-left"
        size="lg"
        class="cursor-pointer rounded-full px-3 sm:px-6"
        @click="handleCancel"
      >
        <span class="hidden sm:inline">Back</span>
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading user..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" @retry="fetchUser" />

    <!-- Form Container -->
    <div v-else-if="user">
      <UForm ref="formRef" :schema="schema" :state="formData" @submit="onSubmit">
        <!-- Account Information Section -->
        <UCard class="card-elevated mb-6">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-shield-check" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                Account Information
              </h2>
            </div>
          </template>

          <!-- Responsive Grid: 1 column on mobile, 2 columns on lg+ screens -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Username (Read-only, Full width) -->
            <div
              class="lg:col-span-2 p-4 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border-muted)]"
            >
              <label class="form-label text-xs mb-2">Username</label>
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-at-sign" class="w-5 h-5 text-[var(--ui-text-muted)]" />
                <span class="text-lg font-mono font-semibold text-[var(--ui-text)]">
                  @{{ user.username }}
                </span>
                <span
                  class="px-2 py-1 text-xs rounded-full bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)]"
                >
                  Cannot be changed
                </span>
              </div>
            </div>

            <!-- Email -->
            <UFormField label="Email Address" name="email" required help="User's email address">
              <UInput
                v-model="formData.email"
                type="email"
                placeholder="e.g., john@example.com"
                icon="i-lucide-mail"
                size="lg"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <!-- Full Name -->
            <UFormField label="Full Name" name="full_name" required help="User's full display name">
              <UInput
                v-model="formData.full_name"
                placeholder="e.g., John Doe"
                icon="i-lucide-user-circle"
                size="lg"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- Role & Permissions Section -->
        <UCard class="card-elevated mb-6">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-shield" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                Role & Permissions
              </h2>
            </div>
          </template>

          <!-- Responsive Grid: 1 column on mobile, 2 columns on lg+ screens -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- User Role -->
            <UFormField label="User Role" name="role" required help="Determines system permissions">
              <USelectMenu
                v-model="formData.role"
                :items="roleOptions"
                value-key="value"
                placeholder="Select role"
                size="lg"
                :disabled="submitting"
                class="w-full"
              >
                <template #leading>
                  <UIcon name="i-lucide-user-cog" class="w-4 h-4" />
                </template>
              </USelectMenu>
            </UFormField>

            <!-- Default Location -->
            <UFormField
              label="Default Location"
              name="default_location_id"
              help="Optional: User's default working location"
            >
              <USelectMenu
                v-model="formData.default_location_id"
                :items="locationOptions"
                value-key="value"
                placeholder="Select default location (optional)"
                size="lg"
                :disabled="submitting"
                class="w-full"
              >
                <template #leading>
                  <UIcon name="i-lucide-map-pin" class="w-4 h-4" />
                </template>
              </USelectMenu>
            </UFormField>
          </div>

          <!-- Account Status Toggle -->
          <div class="mt-6 p-4 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border)]">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <UIcon
                    :name="formData.is_active ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
                    :class="[
                      'w-5 h-5',
                      formData.is_active ? 'text-success' : 'text-[var(--ui-text-muted)]',
                    ]"
                  />
                  <label class="font-semibold text-[var(--ui-text)]">Account Status</label>
                </div>
                <p class="text-sm text-[var(--ui-text-muted)] ml-7">
                  {{
                    formData.is_active
                      ? "This user account is currently active and can access the system"
                      : "This user account is inactive and cannot log in"
                  }}
                </p>
              </div>
              <UToggle
                v-model="formData.is_active"
                :disabled="submitting"
                size="lg"
                class="cursor-pointer"
              />
            </div>
          </div>
        </UCard>

        <!-- Change Password Section (Optional) -->
        <UCard class="card-elevated mb-6">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-lock-keyhole" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                Change Password (Optional)
              </h2>
            </div>
          </template>

          <!-- Password Field at 50% width on large screens -->
          <div class="space-y-6">
            <UFormField
              label="New Password"
              name="password"
              help="Leave blank to keep current password"
              class="w-full lg:w-1/2"
            >
              <UInput
                v-model="formData.password"
                type="password"
                placeholder="••••••••"
                icon="i-lucide-lock"
                size="lg"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Password Requirements Help -->
          <div
            class="mt-6 p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]"
          >
            <div class="flex items-start gap-2">
              <UIcon name="i-lucide-info" class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p class="font-medium text-[var(--ui-text)] mb-2">Password Requirements:</p>
                <ul class="list-disc list-inside space-y-1 text-sm text-[var(--ui-text-muted)]">
                  <li>At least 8 characters long</li>
                  <li>At least one uppercase letter (A-Z)</li>
                  <li>At least one lowercase letter (a-z)</li>
                  <li>At least one number (0-9)</li>
                  <li>At least one special character (@$!%*?&)</li>
                </ul>
              </div>
            </div>
          </div>
        </UCard>
      </UForm>

      <!-- Location Access Management Section -->
      <UCard class="card-elevated mb-6">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-primary" />
            <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Location Access Management
            </h2>
          </div>
        </template>

        <!-- Current Locations -->
        <div v-if="user.locations.length > 0" class="space-y-3 mb-6">
          <div
            v-for="loc in user.locations"
            :key="loc.location_id"
            class="flex items-center justify-between p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] hover:bg-[var(--ui-bg-hover)] smooth-transition"
          >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-primary flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-[var(--ui-text)]">
                  {{ loc.location.name }}
                </p>
                <p class="text-caption text-[var(--ui-text-muted)] mt-0.5 truncate">
                  {{ loc.location.code }} • {{ loc.location.type }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3 flex-shrink-0">
              <UBadge :color="getAccessLevelColor(loc.access_level)" variant="subtle" size="sm">
                {{ loc.access_level }}
              </UBadge>
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="sm"
                class="cursor-pointer"
                @click="removeLocationAccess(loc.location_id)"
              ></UButton>
            </div>
          </div>
        </div>

        <!-- No Locations Assigned -->
        <div
          v-else
          class="text-center py-8 px-4 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border-muted)] mb-6"
        >
          <UIcon
            name="i-lucide-map-pin-off"
            class="w-12 h-12 text-[var(--ui-text-muted)] mx-auto mb-3"
          />
          <p class="text-[var(--ui-text-muted)]">No locations assigned yet</p>
        </div>

        <!-- Add New Location -->
        <div v-if="availableLocations.length > 0" class="pt-4 border-t border-[var(--ui-border)]">
          <h3 class="text-base font-semibold text-[var(--ui-text)] mb-4">Add Location Access</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <USelectMenu
              v-model="selectedLocationId"
              :items="
                availableLocations.map((l) => ({
                  value: l.id,
                  label: `${l.code} - ${l.name}`,
                }))
              "
              value-key="value"
              placeholder="Select location"
              size="lg"
              class="w-full"
            >
              <template #leading>
                <UIcon name="i-lucide-map-pin" class="w-4 h-4" />
              </template>
            </USelectMenu>
            <USelectMenu
              v-model="selectedAccessLevel"
              :items="accessLevelOptions"
              value-key="value"
              size="lg"
              class="w-full"
            >
              <template #leading>
                <UIcon name="i-lucide-key" class="w-4 h-4" />
              </template>
            </USelectMenu>
            <UButton
              icon="i-lucide-plus"
              color="primary"
              size="lg"
              :disabled="!selectedLocationId"
              class="cursor-pointer w-full"
              @click="addLocationAccess"
            >
              Add Location
            </UButton>
          </div>
        </div>

        <!-- All Locations Assigned -->
        <div v-else class="pt-4 border-t border-[var(--ui-border)] text-center pt-4">
          <p class="text-[var(--ui-text-muted)]">All locations have been assigned</p>
        </div>
      </UCard>

      <!-- Action Buttons -->
      <div
        class="flex flex-col sm:flex-row items-center justify-end gap-3 p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]"
      >
        <UButton
          color="error"
          variant="soft"
          size="lg"
          class="cursor-pointer w-full sm:w-auto"
          @click="handleCancel"
          :disabled="submitting"
        >
          Cancel
        </UButton>
        <UButton
          color="primary"
          icon="i-lucide-save"
          size="lg"
          class="cursor-pointer w-full sm:w-auto"
          :loading="submitting"
          :disabled="!hasChanges"
          @click="formRef?.submit()"
        >
          {{ submitting ? "Updating..." : "Update User" }}
        </UButton>
      </div>
    </div>
  </div>
</template>
