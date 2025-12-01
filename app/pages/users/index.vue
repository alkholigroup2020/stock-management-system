<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <!-- Mobile: smaller icon and title -->
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-users" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Users</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Manage user accounts and permissions
          </p>
        </div>
      </div>
      <!-- Mobile: shorter button text -->
      <UButton
        v-if="canManageUsers()"
        color="primary"
        icon="i-lucide-plus"
        size="lg"
        class="cursor-pointer rounded-full px-3 sm:px-6"
        @click="navigateTo('/users/create')"
      >
        <span class="hidden sm:inline">Create User</span>
        <span class="sm:hidden">Create</span>
      </UButton>
    </div>

    <!-- Filters -->
    <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
      <!-- Desktop: Single row layout -->
      <div class="hidden lg:flex items-center gap-3">
        <!-- Search -->
        <div class="flex-1 min-w-0 max-w-md">
          <UInput
            v-model="filters.search"
            placeholder="Search users by name, email, or username..."
            icon="i-lucide-search"
            size="lg"
            class="w-full"
            @input="debouncedSearch"
          />
        </div>

        <!-- Role Filter Toggle Buttons -->
        <div class="flex items-center gap-1 p-1 bg-muted rounded-full">
          <button
            v-for="roleOpt in roleToggleOptions"
            :key="roleOpt.value ?? 'all'"
            type="button"
            class="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap"
            :class="getRoleButtonClass(roleOpt.value)"
            @click="selectRole(roleOpt.value)"
          >
            {{ roleOpt.label }}
          </button>
        </div>

        <!-- Status Filter Dropdown (Far Right) -->
        <UDropdownMenu
          :items="statusDropdownItems"
          :ui="{ content: 'min-w-[140px]' }"
          class="ml-auto"
        >
          <UButton
            color="neutral"
            variant="outline"
            size="lg"
            class="cursor-pointer rounded-full px-5"
            trailing-icon="i-lucide-chevron-down"
          >
            <UIcon :name="currentStatusIcon" class="w-4 h-4 mr-2" />
            {{ currentStatusLabel }}
          </UButton>
        </UDropdownMenu>
      </div>

      <!-- Mobile: Search and Status only -->
      <div class="flex items-center gap-3 lg:hidden">
        <div class="flex-1 min-w-0">
          <UInput
            v-model="filters.search"
            placeholder="Search users..."
            icon="i-lucide-search"
            size="lg"
            class="w-full"
            @input="debouncedSearch"
          />
        </div>
        <UDropdownMenu :items="statusDropdownItems" :ui="{ content: 'min-w-[140px]' }">
          <UButton
            color="neutral"
            variant="outline"
            size="lg"
            class="cursor-pointer rounded-full px-3"
            trailing-icon="i-lucide-chevron-down"
          >
            <UIcon :name="currentStatusIcon" class="w-4 h-4" />
          </UButton>
        </UDropdownMenu>
      </div>
    </UCard>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading users..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" @retry="fetchUsers" />

    <!-- Empty State -->
    <EmptyState
      v-else-if="!filteredUsers.length"
      icon="i-lucide-users"
      title="No users found"
      description="No users match your search criteria. Try adjusting your filters or create a new user."
    >
      <template v-if="canManageUsers()" #action>
        <UButton
          color="primary"
          icon="i-lucide-plus"
          class="cursor-pointer"
          @click="navigateTo('/users/create')"
        >
          Create User
        </UButton>
      </template>
    </EmptyState>

    <!-- Users Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 py-2">
      <UserCard
        v-for="user in filteredUsers"
        :key="user.id"
        :user="user"
        :can-edit="canManageUsers()"
        :can-delete="canManageUsers()"
        :can-toggle-status="canManageUsers()"
        @view="handleView"
        @edit="handleEdit"
        @delete="confirmDelete"
        @toggle-status="toggleUserStatus"
      />
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen" :dismissible="deletingUserId === null">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-subheading font-semibold">Confirm User Deletion</h3>
          </template>

          <div class="space-y-4">
            <div
              v-if="userToDelete"
              class="p-4 rounded-lg border-2 border-warning bg-warning/10"
            >
              <p class="font-semibold text-warning">
                {{ userToDelete.full_name }}
              </p>
              <p class="text-caption mt-1">@{{ userToDelete.username }}</p>
            </div>

            <div class="space-y-2">
              <p class="font-medium">Are you sure you want to delete this user?</p>
              <ul class="list-disc list-inside text-caption space-y-1 pl-2">
                <li>All user data and access permissions will be permanently removed</li>
                <li>This action cannot be undone</li>
                <li>Consider deactivating the user instead if you may need the data later</li>
              </ul>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-default">
              <UButton
                color="neutral"
                variant="ghost"
                class="cursor-pointer"
                @click="isDeleteModalOpen = false"
                :disabled="deletingUserId !== null"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                icon="i-lucide-trash-2"
                class="cursor-pointer"
                :loading="deletingUserId !== null"
                @click="deleteUser"
              >
                Delete User
              </UButton>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import type { UserRole } from "@prisma/client";

definePageMeta({
  middleware: "role",
  roleRequired: "ADMIN",
  layout: "default",
});

// Types
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
    code: string;
    name: string;
    access_level: string;
  }>;
}

interface UsersResponse {
  users: User[];
}

interface RoleOption {
  label: string;
  value: UserRole | null;
}

// Composables
const { canManageUsers } = usePermissions();
const toast = useAppToast();

// State
const loading = ref(false);
const error = ref<string | null>(null);
const users = ref<User[]>([]);

// Delete modal state
const isDeleteModalOpen = ref(false);
const deletingUserId = ref<string | null>(null);
const userToDelete = ref<User | null>(null);

const filters = reactive({
  search: "",
  role: null as UserRole | null,
  is_active: true as boolean | null,
});

// Filter options for toggle buttons
const roleToggleOptions: RoleOption[] = [
  { label: "All", value: null },
  { label: "Admin", value: "ADMIN" },
  { label: "Supervisor", value: "SUPERVISOR" },
  { label: "Operator", value: "OPERATOR" },
];

// Status dropdown items
const statusDropdownItems = computed(() => [
  [
    {
      label: "Active",
      icon: "i-lucide-user-check",
      active: filters.is_active === true,
      onSelect: () => selectStatus(true),
    },
    {
      label: "Inactive",
      icon: "i-lucide-user-x",
      active: filters.is_active === false,
      onSelect: () => selectStatus(false),
    },
    {
      label: "All",
      icon: "i-lucide-users",
      active: filters.is_active === null,
      onSelect: () => selectStatus(null),
    },
  ],
]);

// Current status label for dropdown button
const currentStatusLabel = computed(() => {
  if (filters.is_active === true) return "Active";
  if (filters.is_active === false) return "Inactive";
  return "All";
});

// Current status icon for dropdown button
const currentStatusIcon = computed(() => {
  if (filters.is_active === true) return "i-lucide-user-check";
  if (filters.is_active === false) return "i-lucide-user-x";
  return "i-lucide-users";
});

// Get button class based on role selection
const getRoleButtonClass = (roleValue: UserRole | null) => {
  const isSelected = filters.role === roleValue;

  if (!isSelected) {
    return "text-muted hover:text-default hover:bg-elevated";
  }

  // Selected state uses primary background
  return "bg-primary text-white shadow-sm";
};

// Select role handler
const selectRole = (roleValue: UserRole | null) => {
  filters.role = roleValue;
};

// Select status handler
const selectStatus = (statusValue: boolean | null) => {
  filters.is_active = statusValue;
};

// Filtered users
const filteredUsers = computed(() => {
  return users.value.filter((user) => {
    // Search filter
    const matchesSearch =
      !filters.search ||
      user.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.username.toLowerCase().includes(filters.search.toLowerCase());

    // Role filter
    const matchesRole = filters.role === null || user.role === filters.role;

    // Status filter
    const matchesStatus =
      filters.is_active === null ||
      (filters.is_active === true && user.is_active) ||
      (filters.is_active === false && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });
});

// Fetch users
const fetchUsers = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await $fetch<UsersResponse>("/api/users");
    users.value = response.users || [];
  } catch (err) {
    console.error("Error fetching users:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch users";
    error.value = errorMessage;
    toast.error("Error", { description: errorMessage });
  } finally {
    loading.value = false;
  }
};

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  // Search is done client-side, no need to fetch
}, 300);

// Handlers
const handleView = (user: User) => {
  navigateTo(`/users/${user.id}`);
};

const handleEdit = (user: User) => {
  navigateTo(`/users/${user.id}/edit`);
};

// Toggle user active status
const toggleUserStatus = async (user: User) => {
  try {
    await $fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      body: {
        is_active: !user.is_active,
      },
    });

    user.is_active = !user.is_active;

    toast.success("Success", {
      description: `User ${user.is_active ? "activated" : "deactivated"} successfully`,
    });
  } catch (err: unknown) {
    console.error("Error toggling user status:", err);
    const message =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to update user status";
    toast.error("Error", { description: message });
  }
};

// Delete handlers
const confirmDelete = (user: User) => {
  userToDelete.value = user;
  isDeleteModalOpen.value = true;
};

const deleteUser = async () => {
  if (!userToDelete.value) return;

  deletingUserId.value = userToDelete.value.id;

  try {
    await $fetch(`/api/users/${userToDelete.value.id}`, {
      method: "DELETE",
    });

    toast.success("User Deleted", {
      description: "User has been permanently deleted",
    });

    isDeleteModalOpen.value = false;
    userToDelete.value = null;

    // Refresh list
    await fetchUsers();
  } catch (err: unknown) {
    console.error("Error deleting user:", err);
    const message =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to delete user";
    toast.error("Error", { description: message });

    // Close modal and refresh list even on error
    isDeleteModalOpen.value = false;
    userToDelete.value = null;
    await fetchUsers();
  } finally {
    deletingUserId.value = null;
  }
};

// Lifecycle
onMounted(() => {
  fetchUsers();
});

// Set page title
useHead({
  title: "Users - Stock Management System",
});
</script>
