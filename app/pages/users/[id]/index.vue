<script setup lang="ts">
import type { UserRole } from "~~/shared/types/database";

definePageMeta({
  middleware: "role",
  roleRequired: "ADMIN",
  layout: "default",
});

// Composables
const route = useRoute();
const toast = useAppToast();
const { canManageUsers } = usePermissions();

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
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

// State
const loading = ref(true);
const error = ref<string | null>(null);
const user = ref<User | null>(null);

// Fetch user
const fetchUser = async () => {
  loading.value = true;
  error.value = null;

  try {
    const userId = route.params.id as string;
    const response = await $fetch<{ user: User }>(`/api/users/${userId}`);
    user.value = response.user;
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

// Role badge color
const getRoleBadgeColor = (
  role: UserRole
): "error" | "info" | "primary" | "secondary" | "success" | "warning" | "neutral" => {
  const colors: Record<
    UserRole,
    "error" | "info" | "primary" | "secondary" | "success" | "warning" | "neutral"
  > = {
    ADMIN: "error",
    SUPERVISOR: "warning",
    OPERATOR: "success",
    PROCUREMENT_SPECIALIST: "info",
  };
  return colors[role];
};

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Load user on mount
onMounted(() => {
  fetchUser();
});

// Set page title
useHead({
  title: () => `${user.value?.full_name || "User"} - Stock Management System`,
});
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-user-circle" class="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">
            {{ user?.full_name || "User Details" }}
          </h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            View user information and permissions
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
          @click="navigateTo('/users')"
        >
          <span class="hidden sm:inline">Back</span>
        </UButton>
        <UButton
          v-if="user && canManageUsers()"
          color="primary"
          icon="i-lucide-edit"
          size="lg"
          class="cursor-pointer rounded-full px-3 sm:px-6"
          @click="navigateTo(`/users/${route.params.id}/edit`)"
        >
          <span class="hidden sm:inline">Edit User</span>
          <span class="sm:hidden">Edit</span>
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading user details..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" @retry="fetchUser" />

    <!-- User Details -->
    <div v-else-if="user" class="space-y-6">
      <!-- Basic Information Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Basic Information
            </h2>
            <UBadge :color="user.is_active ? 'success' : 'neutral'" variant="subtle" size="lg">
              {{ user.is_active ? "Active" : "Inactive" }}
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Full Name -->
          <div>
            <label class="form-label">Full Name</label>
            <p class="text-[var(--ui-text)] font-medium mt-2">{{ user.full_name }}</p>
          </div>

          <!-- Username -->
          <div>
            <label class="form-label">Username</label>
            <p class="text-[var(--ui-text)] font-medium mt-2">@{{ user.username }}</p>
          </div>

          <!-- Email -->
          <div>
            <label class="form-label">Email Address</label>
            <p class="text-[var(--ui-text)] mt-2">{{ user.email }}</p>
          </div>

          <!-- Role -->
          <div>
            <label class="form-label">Role</label>
            <div class="mt-2">
              <UBadge :color="getRoleBadgeColor(user.role)" variant="subtle" size="lg">
                <UIcon
                  :name="
                    user.role === 'ADMIN'
                      ? 'i-lucide-shield-check'
                      : user.role === 'SUPERVISOR'
                        ? 'i-lucide-shield'
                        : 'i-lucide-user'
                  "
                  class="w-4 h-4 mr-1.5"
                />
                {{ user.role }}
              </UBadge>
            </div>
          </div>

          <!-- Default Location (Only for Operators) -->
          <div v-if="user.role === 'OPERATOR'">
            <label class="form-label">Default Location</label>
            <p v-if="user.default_location" class="text-[var(--ui-text)] mt-2">
              {{ user.default_location.code }} - {{ user.default_location.name }}
            </p>
            <p v-else class="text-[var(--ui-text-muted)] italic mt-2">Not set</p>
          </div>

          <!-- Created At -->
          <div>
            <label class="form-label">Created</label>
            <p class="text-[var(--ui-text)] mt-2">{{ formatDate(user.created_at) }}</p>
          </div>
        </div>
      </UCard>

      <!-- Location Access Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
        <template #header>
          <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">Location Access</h2>
        </template>

        <!-- Admin/Supervisor: All Locations Access -->
        <div
          v-if="user.role === 'ADMIN' || user.role === 'SUPERVISOR'"
          class="flex items-start gap-3 p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]"
        >
          <UIcon name="i-lucide-globe" class="w-6 h-6 flex-shrink-0 mt-0.5 text-success" />
          <div>
            <p class="text-[var(--ui-text)] font-medium">All Locations Access</p>
            <p class="text-caption text-[var(--ui-text-muted)] mt-1">
              {{
                user.role === "ADMIN"
                  ? "As an Admin, this user has implicit access to all locations in the system."
                  : "As a Supervisor, this user has implicit access to all locations in the system."
              }}
            </p>
            <div v-if="user.default_location" class="mt-3 pt-3 border-t border-[var(--ui-border)]">
              <p class="text-xs text-[var(--ui-text-muted)]">Default Location</p>
              <p class="text-[var(--ui-text)] font-medium mt-1">
                {{ user.default_location.code }} - {{ user.default_location.name }}
              </p>
            </div>
          </div>
        </div>

        <!-- Operator: Specific Location Access -->
        <template v-else>
          <!-- No Locations Assigned -->
          <EmptyState
            v-if="user.locations.length === 0"
            icon="i-lucide-map-pin"
            title="No location access"
            description="This user has not been assigned to any locations yet."
          />

          <!-- Assigned Locations List -->
          <div v-else class="space-y-3">
            <p class="text-caption text-[var(--ui-text-muted)] mb-4">
              Operators can only access and post transactions at their assigned locations.
            </p>
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
              <UBadge color="success" variant="subtle" size="sm" class="ml-3 flex-shrink-0">
                Assigned
              </UBadge>
            </div>
          </div>
        </template>
      </UCard>

      <!-- Permissions Summary Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
        <template #header>
          <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
            Permissions Summary
          </h2>
        </template>

        <!-- Admin Role -->
        <div v-if="user.role === 'ADMIN'" class="space-y-4">
          <div
            class="flex items-start gap-3 p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]"
          >
            <UIcon name="i-lucide-shield-check" class="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-[var(--ui-text)] font-medium">Full System Access</p>
              <p class="text-caption text-[var(--ui-text-muted)] mt-1">
                Can manage all aspects of the system including users, locations, items, and settings
              </p>
            </div>
          </div>
        </div>

        <!-- Supervisor Role -->
        <div v-else-if="user.role === 'SUPERVISOR'" class="space-y-4">
          <div
            class="flex items-start gap-3 p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]"
          >
            <UIcon name="i-lucide-shield" class="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-[var(--ui-text)] font-medium">Supervisor Access</p>
              <p class="text-caption text-[var(--ui-text-muted)] mt-1">
                Can approve transfers and edit reconciliations at all locations
              </p>
            </div>
          </div>
        </div>

        <!-- Operator Role -->
        <div v-else class="space-y-4">
          <div
            class="flex items-start gap-3 p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]"
          >
            <UIcon name="i-lucide-user" class="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-[var(--ui-text)] font-medium">Operator Access</p>
              <p class="text-caption text-[var(--ui-text-muted)] mt-1">
                Can post transactions and view stock at assigned locations only
              </p>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Error State (User Not Found) -->
    <div v-else class="space-y-6">
      <UCard class="card-elevated" :ui="{ body: 'p-12' }">
        <EmptyState
          icon="i-lucide-user-x"
          title="User Not Found"
          description="The user you're looking for could not be found or may have been deleted."
        >
          <template #actions>
            <UButton
              color="primary"
              icon="i-lucide-arrow-left"
              class="cursor-pointer"
              @click="navigateTo('/users')"
            >
              Back to Users
            </UButton>
          </template>
        </EmptyState>
      </UCard>
    </div>
  </div>
</template>
