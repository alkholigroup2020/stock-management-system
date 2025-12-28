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
const schema = z
  .object({
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
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      // Only validate if password is provided
      if (data.password && data.password.length > 0) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

type Schema = z.output<typeof schema>;

// Form data
const formData = reactive({
  email: "",
  full_name: "",
  role: "OPERATOR" as UserRole,
  is_active: true,
  default_location_id: null as string | null,
  password: "",
  confirmPassword: "",
});

// Role options - with location access info
const roleOptions = [
  {
    value: "OPERATOR",
    label: "Operator",
    description: "Post transactions at assigned locations only",
  },
  {
    value: "SUPERVISOR",
    label: "Supervisor",
    description: "All locations access - approve transfers & reconciliations",
  },
  {
    value: "ADMIN",
    label: "Admin",
    description: "Full system access - all locations with complete control",
  },
];

// Check if the FORM role is OPERATOR (for showing location management)
const isOperatorRole = computed(() => formData.role === "OPERATOR");

// Check if the ORIGINAL role was OPERATOR (for role change warnings)
const wasOperatorRole = computed(() => user.value?.role === "OPERATOR");

// Show warning when changing role that affects location access
const showRoleChangeWarning = computed(() => {
  if (!user.value) return false;
  const originalRole = user.value.role;
  const newRole = formData.role;
  if (originalRole === newRole) return false;

  // Warn when changing from OPERATOR to SUPERVISOR/ADMIN (locations become irrelevant)
  if (originalRole === "OPERATOR" && (newRole === "SUPERVISOR" || newRole === "ADMIN")) {
    return "upgrading";
  }
  // Warn when changing from SUPERVISOR/ADMIN to OPERATOR (needs location assignment)
  if ((originalRole === "SUPERVISOR" || originalRole === "ADMIN") && newRole === "OPERATOR") {
    return "downgrading";
  }
  return false;
});

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
const addingLocation = ref(false);
const removingLocationId = ref<string | null>(null);

// Remove location modal state
const isRemoveLocationModalOpen = ref(false);
const locationToRemove = ref<{
  location_id: string;
  location: { id: string; code: string; name: string; type: string };
} | null>(null);

// Cancel confirmation modal state
const isCancelModalOpen = ref(false);

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

  addingLocation.value = true;

  try {
    const response = await $fetch<{ message?: string }>(
      `/api/locations/${selectedLocationId.value}/users`,
      {
        method: "POST",
        body: {
          user_id: route.params.id as string,
        },
      }
    );

    toast.success("Success", {
      description: response.message || "Location access added successfully",
    });

    await fetchUser();
    selectedLocationId.value = "";
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
  } finally {
    addingLocation.value = false;
  }
};

// Prompt remove location access - show confirmation modal
const promptRemoveLocation = (loc: {
  location_id: string;
  location: { id: string; code: string; name: string; type: string };
}) => {
  locationToRemove.value = loc;
  isRemoveLocationModalOpen.value = true;
};

// Confirm and execute remove location access
const confirmRemoveLocation = async () => {
  if (!user.value || !locationToRemove.value) return;

  removingLocationId.value = locationToRemove.value.location_id;

  try {
    await $fetch(
      `/api/locations/${locationToRemove.value.location_id}/users/${route.params.id as string}`,
      {
        method: "DELETE",
      }
    );

    toast.success("Success", {
      description: "Location access removed successfully",
    });

    isRemoveLocationModalOpen.value = false;
    locationToRemove.value = null;
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
  } finally {
    removingLocationId.value = null;
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

// Handle cancel - show modal if there are unsaved changes
const handleCancel = () => {
  if (hasChanges.value) {
    isCancelModalOpen.value = true;
  } else {
    navigateTo(`/users/${route.params.id as string}`);
  }
};

// Confirm cancel and navigate away
const confirmCancel = () => {
  isCancelModalOpen.value = false;
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
        <UIcon name="i-lucide-user-pen" class="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
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
        <UCard class="card-elevated mb-6" :ui="{ body: 'p-3 sm:p-4' }">
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
        <UCard class="card-elevated mb-6" :ui="{ body: 'p-3 sm:p-4' }">
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
              <USwitch
                v-model="formData.is_active"
                :disabled="submitting"
                size="lg"
                class="cursor-pointer"
              />
            </div>
          </div>

          <!-- Role Change Warning - Location Access Impact -->
          <div
            v-if="showRoleChangeWarning === 'upgrading'"
            class="mt-6 p-4 rounded-lg bg-primary/10 border border-primary"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-info" class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p class="font-semibold text-primary mb-1">Role Upgrade - Location Access Change</p>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  Changing to
                  <strong>{{ formData.role }}</strong>
                  will grant this user automatic access to
                  <strong>all locations</strong>
                  . The current location assignments will no longer be enforced.
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="showRoleChangeWarning === 'downgrading'"
            class="mt-6 p-4 rounded-lg bg-warning/10 border border-warning"
          >
            <div class="flex items-start gap-3">
              <UIcon
                name="i-lucide-alert-triangle"
                class="w-5 h-5 text-warning flex-shrink-0 mt-0.5"
              />
              <div>
                <p class="font-semibold text-warning mb-1">
                  Role Downgrade - Location Access Required
                </p>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  Changing to
                  <strong>Operator</strong>
                  will restrict this user to only their assigned locations. After saving, you must
                  assign at least one location for this user to work effectively.
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Change Password Section (Optional) -->
        <UCard class="card-elevated mb-6" :ui="{ body: 'p-3 sm:p-4' }">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-lock-keyhole" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                Change Password (Optional)
              </h2>
            </div>
          </template>

          <!-- Password Fields - Grid layout on large screens -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UFormField
              label="New Password"
              name="password"
              help="Leave blank to keep current password"
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

            <UFormField
              label="Confirm Password"
              name="confirmPassword"
              help="Re-enter the new password"
            >
              <UInput
                v-model="formData.confirmPassword"
                type="password"
                placeholder="••••••••"
                icon="i-lucide-lock-keyhole"
                size="lg"
                :disabled="submitting || !formData.password"
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

      <!-- Location Access Section - Different display based on role -->
      <UCard class="card-elevated mb-6" :ui="{ body: 'p-3 sm:p-4' }">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-primary" />
            <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">Location Access</h2>
          </div>
        </template>

        <!-- SUPERVISOR/ADMIN: Show automatic access info -->
        <div v-if="!isOperatorRole">
          <!-- All Locations Access Info Card -->
          <div class="p-4 rounded-lg bg-success/10 border border-success">
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-globe" class="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p class="font-semibold text-success mb-2">
                  {{ formData.role === "ADMIN" ? "Full System Access" : "All Locations Access" }}
                </p>
                <p class="text-sm text-[var(--ui-text-muted)] mb-3">
                  <template v-if="formData.role === 'ADMIN'">
                    As an
                    <strong>Admin</strong>
                    , this user automatically has
                    <strong>full access</strong>
                    to all locations in the system with complete control (MANAGE level). No manual
                    location assignment is required.
                  </template>
                  <template v-else>
                    As a
                    <strong>Supervisor</strong>
                    , this user automatically has
                    <strong>access to all locations</strong>
                    in the system. They can view, post transactions, and manage reconciliations at
                    any location. No manual location assignment is required.
                  </template>
                </p>
                <div class="flex flex-wrap gap-2">
                  <UBadge color="success" variant="subtle" size="sm">
                    <UIcon name="i-lucide-check" class="w-3 h-3 mr-1" />
                    All Locations
                  </UBadge>
                  <UBadge color="success" variant="subtle" size="sm">
                    <UIcon name="i-lucide-check" class="w-3 h-3 mr-1" />
                    Automatic Access
                  </UBadge>
                  <UBadge
                    v-if="formData.role === 'ADMIN'"
                    color="success"
                    variant="subtle"
                    size="sm"
                  >
                    <UIcon name="i-lucide-check" class="w-3 h-3 mr-1" />
                    Full Control
                  </UBadge>
                </div>
              </div>
            </div>
          </div>

          <!-- Note about Default Location -->
          <div
            class="mt-4 p-3 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border-muted)]"
          >
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-[var(--ui-text-muted)]" />
              <p class="text-sm text-[var(--ui-text-muted)]">
                The
                <strong>Default Location</strong>
                above is only used as a preference for which location to display first when the user
                logs in. It does not restrict access.
              </p>
            </div>
          </div>
        </div>

        <!-- OPERATOR: Show location management UI -->
        <div v-else>
          <!-- Operator Info Alert -->
          <div class="p-3 rounded-lg bg-primary/10 border border-primary mb-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-info" class="w-4 h-4 text-primary" />
              <p class="text-sm text-[var(--ui-text-muted)]">
                <strong>Operators</strong>
                can only access their assigned locations. Add at least one location for this user to
                post transactions.
              </p>
            </div>
          </div>

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
                <UBadge color="success" variant="subtle" size="sm">Assigned</UBadge>
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="sm"
                  class="cursor-pointer"
                  :loading="removingLocationId === loc.location_id"
                  @click="promptRemoveLocation(loc)"
                ></UButton>
              </div>
            </div>
          </div>

          <!-- No Locations Assigned -->
          <div
            v-else
            class="text-center py-8 px-4 rounded-lg bg-warning/10 border border-warning mb-6"
          >
            <UIcon name="i-lucide-alert-triangle" class="w-12 h-12 text-warning mx-auto mb-3" />
            <p class="font-semibold text-warning mb-1">No Locations Assigned</p>
            <p class="text-sm text-[var(--ui-text-muted)]">
              This operator cannot access any locations. Add at least one location below.
            </p>
          </div>

          <!-- Add New Location -->
          <div v-if="availableLocations.length > 0" class="pt-4 border-t border-[var(--ui-border)]">
            <h3 class="text-base font-semibold text-[var(--ui-text)] mb-4">Add Location Access</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <UButton
                icon="i-lucide-plus"
                color="primary"
                size="lg"
                :disabled="!selectedLocationId || addingLocation"
                :loading="addingLocation"
                class="cursor-pointer w-full"
                @click="addLocationAccess"
              >
                Add Location
              </UButton>
            </div>
          </div>

          <!-- All Locations Assigned -->
          <div
            v-else-if="user.locations.length > 0"
            class="pt-4 border-t border-[var(--ui-border)] text-center"
          >
            <p class="text-[var(--ui-text-muted)]">All locations have been assigned</p>
          </div>
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

    <!-- Cancel Confirmation Modal -->
    <UModal
      v-model:open="isCancelModalOpen"
      title="Discard Changes?"
      description="You have unsaved changes that will be lost."
    >
      <template #body>
        <div class="space-y-3">
          <p class="text-[var(--ui-text)]">
            Are you sure you want to leave? All unsaved changes will be discarded.
          </p>
        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            @click="isCancelModalOpen = false"
          >
            Continue Editing
          </UButton>
          <UButton color="error" icon="i-lucide-x" class="cursor-pointer" @click="confirmCancel">
            Discard Changes
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Remove Location Confirmation Modal -->
    <UModal
      v-model:open="isRemoveLocationModalOpen"
      title="Remove Location Access"
      description="The user will no longer be able to access this location."
      :dismissible="removingLocationId === null"
    >
      <template #body>
        <div class="space-y-4">
          <div v-if="locationToRemove" class="p-4 rounded-lg border-2 border-warning bg-warning/10">
            <p class="font-semibold text-warning">
              {{ locationToRemove.location.name }}
            </p>
            <p class="text-caption mt-1">
              {{ locationToRemove.location.code }} • {{ locationToRemove.location.type }}
            </p>
          </div>

          <div class="space-y-2">
            <p class="font-medium">
              Are you sure you want to remove this location access for {{ user?.full_name }}?
            </p>
            <ul class="list-disc list-inside text-caption space-y-1 pl-2">
              <li>The user will lose access to this location</li>
              <li>Any pending work at this location may be affected</li>
              <li>You can add the location back at any time</li>
            </ul>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            :disabled="removingLocationId !== null"
            @click="isRemoveLocationModalOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            class="cursor-pointer"
            :loading="removingLocationId !== null"
            @click="confirmRemoveLocation"
          >
            Remove Access
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
