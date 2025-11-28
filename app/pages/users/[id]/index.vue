<script setup lang="ts">
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
    access_level: string;
  }>;
}

const route = useRoute();
const toast = useToast();

const userId = computed(() => route.params.id as string);
const user = ref<User | null>(null);
const loading = ref(true);

// Fetch user
const fetchUser = async () => {
  try {
    loading.value = true;
    const response = await $fetch<{ user: User }>(`/api/users/${userId.value}`);
    user.value = response.user;
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

// Role badge
const getRoleBadge = (role: UserRole) => {
  switch (role) {
    case "ADMIN":
      return { color: "error" as const, label: "Admin" };
    case "SUPERVISOR":
      return { color: "warning" as const, label: "Supervisor" };
    case "OPERATOR":
      return { color: "success" as const, label: "Operator" };
    default:
      return { color: "neutral" as const, label: role };
  }
};

// Access level badge
const getAccessLevelBadge = (level: string) => {
  switch (level) {
    case "MANAGE":
      return { color: "error" as const, label: "Manage" };
    case "POST":
      return { color: "warning" as const, label: "Post" };
    case "VIEW":
      return { color: "neutral" as const, label: "View" };
    default:
      return { color: "neutral" as const, label: level };
  }
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
</script>

<template>
  <div class="p-4 md:p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <UButton
          icon="i-heroicons-arrow-left"
          color="neutral"
          variant="ghost"
          to="/users"
          aria-label="Back to users"
          class="cursor-pointer"
        />
        <div>
          <h1 class="text-heading">User Details</h1>
          <p class="text-caption mt-1">View user information and permissions</p>
        </div>
      </div>
      <UButton
        v-if="user"
        icon="i-heroicons-pencil"
        label="Edit User"
        color="primary"
        :to="`/users/${userId}/edit`"
        class="cursor-pointer"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-muted" />
    </div>

    <!-- User Details -->
    <div v-else-if="user" class="space-y-6">
      <!-- Basic Information -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-label">Basic Information</h2>
            <UBadge :color="user.is_active ? 'success' : 'neutral'">
              {{ user.is_active ? "Active" : "Inactive" }}
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p class="text-caption mb-1">Full Name</p>
            <p class="text-default font-medium">{{ user.full_name }}</p>
          </div>

          <div>
            <p class="text-caption mb-1">Username</p>
            <p class="text-default font-medium">@{{ user.username }}</p>
          </div>

          <div>
            <p class="text-caption mb-1">Email Address</p>
            <p class="text-default">{{ user.email }}</p>
          </div>

          <div>
            <p class="text-caption mb-1">Role</p>
            <UBadge :color="getRoleBadge(user.role).color">
              {{ getRoleBadge(user.role).label }}
            </UBadge>
          </div>

          <div>
            <p class="text-caption mb-1">Default Location</p>
            <p v-if="user.default_location" class="text-default">
              {{ user.default_location.code }} - {{ user.default_location.name }}
            </p>
            <p v-else class="text-muted italic">None</p>
          </div>

          <div>
            <p class="text-caption mb-1">Created</p>
            <p class="text-default">{{ formatDate(user.created_at) }}</p>
          </div>
        </div>
      </UCard>

      <!-- Location Access -->
      <UCard>
        <template #header>
          <h2 class="text-label">Location Access</h2>
        </template>

        <div v-if="user.locations.length > 0" class="space-y-3">
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
                <p class="text-caption">{{ loc.location.code }} • {{ loc.location.type }}</p>
              </div>
            </div>
            <UBadge :color="getAccessLevelBadge(loc.access_level).color">
              {{ getAccessLevelBadge(loc.access_level).label }}
            </UBadge>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <UIcon name="i-heroicons-map-pin" class="w-12 h-12 mx-auto mb-3 text-muted" />
          <p class="text-default font-medium mb-1">No Location Access</p>
          <p class="text-caption">This user has not been assigned to any locations yet.</p>
        </div>
      </UCard>

      <!-- Permissions Summary -->
      <UCard>
        <template #header>
          <h2 class="text-label">Permissions Summary</h2>
        </template>

        <div class="space-y-4">
          <div v-if="user.role === 'ADMIN'">
            <div class="flex items-start gap-3 p-3 bg-elevated rounded-lg">
              <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-default font-medium">Full System Access</p>
                <p class="text-caption">Can manage all aspects of the system</p>
              </div>
            </div>
          </div>

          <div v-else-if="user.role === 'SUPERVISOR'">
            <div class="flex items-start gap-3 p-3 bg-elevated rounded-lg mb-3">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-default font-medium">Supervisor Access</p>
                <p class="text-caption">Can approve transfers, edit reconciliations, and view all locations</p>
              </div>
            </div>
          </div>

          <div v-else>
            <div class="flex items-start gap-3 p-3 bg-elevated rounded-lg mb-3">
              <UIcon name="i-heroicons-user" class="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-default font-medium">Operator Access</p>
                <p class="text-caption">Can post transactions and view stock at assigned locations</p>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Error State -->
    <UCard v-else>
      <div class="text-center py-12">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 mx-auto mb-4 text-error" />
        <h3 class="text-label mb-2">User Not Found</h3>
        <p class="text-caption mb-4">The user you're looking for could not be found.</p>
        <UButton label="Back to Users" to="/users" class="cursor-pointer" />
      </div>
    </UCard>
  </div>
</template>
