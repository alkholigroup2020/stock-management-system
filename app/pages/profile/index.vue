<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";

definePageMeta({
  layout: "default",
});

// Composables
const auth = useAuth();
const toast = useAppToast();

// User data from auth store
const user = computed(() => auth.user.value);
const isAdminOrSupervisor = computed(() => auth.isAdmin.value || auth.isSupervisor.value);

// Profile form state
const profileForm = reactive({
  full_name: user.value?.full_name || "",
});

// Track original values for change detection
const originalFullName = ref(user.value?.full_name || "");
const hasProfileChanges = computed(() => profileForm.full_name !== originalFullName.value);

// Loading states
const isUpdatingProfile = ref(false);
const isChangingPassword = ref(false);

// Password form state
const passwordForm = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

// Password validation schema
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain uppercase, lowercase, number, and special character (@$!%*?&)"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordSchema = z.output<typeof passwordSchema>;

// User locations with full details (for operators)
interface LocationDetail {
  location_id: string;
  location: {
    id: string;
    code: string;
    name: string;
    type: string;
  };
}

const userLocations = ref<LocationDetail[]>([]);
const loadingLocations = ref(true);

// Fetch user's full location details
const fetchUserLocations = async () => {
  // If admin/supervisor, no need to fetch - they have implicit access to all
  if (isAdminOrSupervisor.value) {
    loadingLocations.value = false;
    return;
  }

  // For operators, we need to fetch location details
  // user.locations is now a simple array of location IDs
  if (!user.value?.locations || user.value.locations.length === 0) {
    loadingLocations.value = false;
    return;
  }

  try {
    // Fetch all locations and filter to user's assigned ones
    const response = await $fetch<{
      locations: Array<{ id: string; code: string; name: string; type: string }>;
    }>("/api/locations");

    const userLocationIds = user.value.locations; // Now a string[] of location IDs
    const locationsMap = new Map(response.locations.map((l) => [l.id, l]));

    userLocations.value = userLocationIds
      .filter((locationId) => locationsMap.has(locationId))
      .map((locationId) => ({
        location_id: locationId,
        location: locationsMap.get(locationId)!,
      }));
  } catch (err) {
    console.error("Error fetching locations:", err);
  } finally {
    loadingLocations.value = false;
  }
};

// Update profile handler
const updateProfile = async () => {
  if (!hasProfileChanges.value) return;

  isUpdatingProfile.value = true;
  try {
    await $fetch("/api/auth/profile", {
      method: "PATCH",
      body: { full_name: profileForm.full_name },
    });

    // Update local state
    originalFullName.value = profileForm.full_name;

    // Refresh session to get updated user data
    await auth.fetchSession();

    toast.success("Profile Updated", {
      description: "Your profile has been updated successfully",
    });
  } catch (err: unknown) {
    console.error("Error updating profile:", err);
    const message =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to update profile";
    toast.error("Error", { description: message });
  } finally {
    isUpdatingProfile.value = false;
  }
};

// Change password handler
const changePassword = async (event: FormSubmitEvent<PasswordSchema>) => {
  isChangingPassword.value = true;
  try {
    await $fetch("/api/auth/change-password", {
      method: "POST",
      body: {
        currentPassword: event.data.currentPassword,
        newPassword: event.data.newPassword,
        confirmPassword: event.data.confirmPassword,
      },
    });

    // Clear form
    passwordForm.currentPassword = "";
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";

    toast.success("Password Changed", {
      description: "Your password has been changed successfully",
    });
  } catch (err: unknown) {
    console.error("Error changing password:", err);

    // Extract error message
    let message = "Failed to change password";
    if (
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object"
    ) {
      const data = err.data as { code?: string; message?: string };
      if (data.code === "INVALID_CURRENT_PASSWORD") {
        message = "Current password is incorrect";
      } else if (data.code === "SAME_PASSWORD") {
        message = "New password must be different from current password";
      } else if (data.message) {
        message = data.message;
      }
    }

    toast.error("Error", { description: message });
  } finally {
    isChangingPassword.value = false;
  }
};

// Helper functions
const getRoleBadgeColor = (
  role: string
): "error" | "info" | "primary" | "secondary" | "success" | "warning" | "neutral" => {
  const colors: Record<
    string,
    "error" | "info" | "primary" | "secondary" | "success" | "warning" | "neutral"
  > = {
    ADMIN: "error",
    SUPERVISOR: "warning",
    OPERATOR: "success",
  };
  return colors[role] || "neutral";
};

const getRoleIcon = (role: string) => {
  const icons: Record<string, string> = {
    ADMIN: "i-lucide-shield-check",
    SUPERVISOR: "i-lucide-shield",
    OPERATOR: "i-lucide-user",
  };
  return icons[role] || "i-lucide-user";
};


// Permissions based on role
const permissions = computed(() => {
  const role = user.value?.role;
  if (!role) return [];

  const basePermissions = [
    { icon: "i-lucide-eye", label: "View Stock Levels", description: "View stock at locations" },
    {
      icon: "i-lucide-package",
      label: "Post Deliveries",
      description: "Record incoming deliveries",
    },
    { icon: "i-lucide-package-minus", label: "Post Issues", description: "Record stock issues" },
    {
      icon: "i-lucide-arrow-left-right",
      label: "Create Transfers",
      description: "Request stock transfers",
    },
  ];

  if (role === "OPERATOR") {
    return basePermissions;
  }

  const supervisorPermissions = [
    ...basePermissions,
    {
      icon: "i-lucide-check-circle",
      label: "Approve Transfers",
      description: "Approve pending transfer requests",
    },
    {
      icon: "i-lucide-calculator",
      label: "Manage Reconciliations",
      description: "Edit and submit reconciliations",
    },
    {
      icon: "i-lucide-flag",
      label: "Mark Locations Ready",
      description: "Mark locations ready for period close",
    },
  ];

  if (role === "SUPERVISOR") {
    return supervisorPermissions;
  }

  // ADMIN
  return [
    ...supervisorPermissions,
    { icon: "i-lucide-users", label: "Manage Users", description: "Create and edit user accounts" },
    { icon: "i-lucide-box", label: "Manage Items", description: "Create and edit inventory items" },
    {
      icon: "i-lucide-calendar-check",
      label: "Close Periods",
      description: "Approve and execute period close",
    },
    {
      icon: "i-lucide-settings",
      label: "System Settings",
      description: "Configure system settings",
    },
  ];
});

// Watch for user changes and update form
watch(
  () => user.value?.full_name,
  (newName) => {
    if (newName && !isUpdatingProfile.value) {
      profileForm.full_name = newName;
      originalFullName.value = newName;
    }
  }
);

// Initialize
onMounted(() => {
  fetchUserLocations();
});

// Set page title
useHead({
  title: "My Profile - Stock Management System",
});
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-user-circle" class="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">My Profile</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            View and manage your account settings
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="!user" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading profile..." />
    </div>

    <!-- Profile Content -->
    <div v-else class="space-y-6">
      <!-- Account Information Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-user" class="w-5 h-5 text-primary" />
            <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Account Information
            </h2>
          </div>
        </template>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Username (read-only) -->
          <div
            class="p-4 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border-muted)]"
          >
            <label class="form-label text-xs mb-2">Username</label>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-at-sign" class="w-5 h-5 text-[var(--ui-text-muted)]" />
              <span class="text-lg font-mono font-semibold text-[var(--ui-text)]">
                @{{ user.username }}
              </span>
            </div>
          </div>

          <!-- Email (read-only) -->
          <div
            class="p-4 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border-muted)]"
          >
            <label class="form-label text-xs mb-2">Email Address</label>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-mail" class="w-5 h-5 text-[var(--ui-text-muted)]" />
              <span class="text-[var(--ui-text)]">{{ user.email }}</span>
            </div>
          </div>

          <!-- Role (read-only with badge) -->
          <div>
            <label class="form-label">Role</label>
            <div class="mt-2">
              <UBadge :color="getRoleBadgeColor(user.role)" variant="subtle" size="lg">
                <UIcon :name="getRoleIcon(user.role)" class="w-4 h-4 mr-1.5" />
                {{ user.role }}
              </UBadge>
            </div>
          </div>

          <!-- Full Name (editable) -->
          <div>
            <label class="form-label">Full Name</label>
            <div class="mt-2">
              <UInput
                v-model="profileForm.full_name"
                placeholder="Your full name"
                icon="i-lucide-user-circle"
                size="lg"
                :disabled="isUpdatingProfile"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Update Profile Button -->
        <div class="mt-6 flex justify-end">
          <UButton
            color="primary"
            icon="i-lucide-save"
            class="cursor-pointer"
            :loading="isUpdatingProfile"
            :disabled="!hasProfileChanges"
            @click="updateProfile"
          >
            Update Profile
          </UButton>
        </div>
      </UCard>

      <!-- Assigned Locations Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-primary" />
            <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Location Access
            </h2>
          </div>
        </template>

        <!-- Loading State -->
        <div v-if="loadingLocations" class="flex justify-center py-6">
          <LoadingSpinner size="md" color="primary" text="Loading locations..." />
        </div>

        <!-- For ADMIN/SUPERVISOR: Show "All Locations Access" -->
        <div v-else-if="isAdminOrSupervisor" class="p-4 rounded-lg bg-success/10 border border-success">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-globe" class="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-semibold text-success mb-1">All Locations Access</p>
              <p class="text-sm text-[var(--ui-text-muted)]">
                As a <strong>{{ user.role }}</strong
                >, you have automatic access to all locations in the system.
                {{
                  user.role === "ADMIN"
                    ? "You can manage all aspects of the system."
                    : "You can view, post transactions, and manage reconciliations at any location."
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- For OPERATOR: Show assigned locations list -->
        <template v-else>
          <!-- No Locations Assigned -->
          <EmptyState
            v-if="userLocations.length === 0"
            icon="i-lucide-map-pin"
            title="No locations assigned"
            description="You have not been assigned to any locations yet. Contact your administrator."
          />

          <!-- Assigned Locations List -->
          <div v-else class="space-y-3">
            <div
              v-for="loc in userLocations"
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
              <UBadge color="primary" variant="subtle" size="sm" class="ml-3 flex-shrink-0">
                Assigned
              </UBadge>
            </div>
          </div>
        </template>
      </UCard>

      <!-- Permissions Summary Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-shield" class="w-5 h-5 text-primary" />
            <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">Your Permissions</h2>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="perm in permissions"
            :key="perm.label"
            class="flex items-start gap-3 p-3 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]"
          >
            <UIcon :name="perm.icon" class="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div class="flex-1 min-w-0">
              <p class="font-medium text-[var(--ui-text)]">{{ perm.label }}</p>
              <p class="text-caption text-[var(--ui-text-muted)]">{{ perm.description }}</p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Change Password Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-lock" class="w-5 h-5 text-primary" />
            <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">Change Password</h2>
          </div>
        </template>

        <UForm :schema="passwordSchema" :state="passwordForm" @submit="changePassword">
          <div class="space-y-6">
            <!-- Current Password -->
            <UFormField
              label="Current Password"
              name="currentPassword"
              required
              class="w-full lg:w-1/2"
            >
              <UInput
                v-model="passwordForm.currentPassword"
                type="password"
                placeholder="Enter your current password"
                icon="i-lucide-lock"
                size="lg"
                :disabled="isChangingPassword"
                class="w-full"
              />
            </UFormField>

            <!-- New Password -->
            <UFormField label="New Password" name="newPassword" required class="w-full lg:w-1/2">
              <UInput
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="Enter your new password"
                icon="i-lucide-lock-keyhole"
                size="lg"
                :disabled="isChangingPassword"
                class="w-full"
              />
            </UFormField>

            <!-- Confirm Password -->
            <UFormField
              label="Confirm New Password"
              name="confirmPassword"
              required
              class="w-full lg:w-1/2"
            >
              <UInput
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                icon="i-lucide-lock-keyhole"
                size="lg"
                :disabled="isChangingPassword"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Password Requirements -->
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

          <!-- Submit Button -->
          <div class="mt-6 flex justify-end">
            <UButton
              type="submit"
              color="warning"
              icon="i-lucide-key"
              class="cursor-pointer"
              :loading="isChangingPassword"
            >
              Change Password
            </UButton>
          </div>
        </UForm>
      </UCard>
    </div>
  </div>
</template>
