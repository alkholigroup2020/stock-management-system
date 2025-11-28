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
    code: string;
    name: string;
    access_level: string;
  }>;
}

const toast = useToast();

// State
const users = ref<User[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const selectedRole = ref<UserRole | "ALL">("ALL");
const selectedStatus = ref<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

// Fetch users
const fetchUsers = async () => {
  try {
    loading.value = true;
    const response = await $fetch<{ users: User[] }>("/api/users");
    users.value = response.users;
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: error.data?.message || "Failed to load users",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

// Filtered users
const filteredUsers = computed(() => {
  return users.value.filter((user) => {
    // Search filter
    const matchesSearch =
      !searchQuery.value ||
      user.full_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.value.toLowerCase());

    // Role filter
    const matchesRole = selectedRole.value === "ALL" || user.role === selectedRole.value;

    // Status filter
    const matchesStatus =
      selectedStatus.value === "ALL" ||
      (selectedStatus.value === "ACTIVE" && user.is_active) ||
      (selectedStatus.value === "INACTIVE" && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });
});

// Table columns
const columns = [
  {
    accessorKey: "full_name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "default_location",
    header: "Default Location",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "actions",
    header: "Actions",
  },
];

// Role badge colors
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

    toast.add({
      title: "Success",
      description: `User ${user.is_active ? "activated" : "deactivated"} successfully`,
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: error.data?.message || "Failed to update user status",
      color: "error",
    });
  }
};

// Delete confirmation modal
const deleteModal = ref(false);
const userToDelete = ref<User | null>(null);

const confirmDelete = (user: User) => {
  userToDelete.value = user;
  deleteModal.value = true;
};

const deleteUser = async () => {
  if (!userToDelete.value) return;

  try {
    await $fetch(`/api/users/${userToDelete.value.id}`, {
      method: "DELETE",
    });

    users.value = users.value.filter((u) => u.id !== userToDelete.value!.id);

    toast.add({
      title: "Success",
      description: "User deleted successfully",
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: error.data?.message || "Failed to delete user",
      color: "error",
    });
  } finally {
    deleteModal.value = false;
    userToDelete.value = null;
  }
};

// Load users on mount
onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <div class="p-4 md:p-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-heading">Users</h1>
          <p class="text-caption mt-1">Manage user accounts and permissions</p>
        </div>
        <UButton
          icon="i-heroicons-plus"
          label="New User"
          color="primary"
          to="/users/create"
          class="cursor-pointer"
        />
      </div>

      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search users by name, email, or username..."
            class="w-full"
          />
        </div>

        <!-- Role Filter -->
        <USelect
          v-model="selectedRole"
          :items="[
            { value: 'ALL', label: 'All Roles' },
            { value: 'ADMIN', label: 'Admin' },
            { value: 'SUPERVISOR', label: 'Supervisor' },
            { value: 'OPERATOR', label: 'Operator' },
          ]"
          class="w-full sm:w-48"
        />

        <!-- Status Filter -->
        <USelect
          v-model="selectedStatus"
          :items="[
            { value: 'ALL', label: 'All Status' },
            { value: 'ACTIVE', label: 'Active Only' },
            { value: 'INACTIVE', label: 'Inactive Only' },
          ]"
          class="w-full sm:w-48"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-muted" />
    </div>

    <!-- Empty State -->
    <UCard v-else-if="filteredUsers.length === 0">
      <div class="text-center py-12">
        <UIcon name="i-heroicons-users" class="w-12 h-12 mx-auto mb-4 text-muted" />
        <h3 class="text-label mb-2">No users found</h3>
        <p class="text-caption">
          {{ searchQuery || selectedRole !== "ALL" || selectedStatus !== "ALL" ? "Try adjusting your filters" : "Get started by creating your first user" }}
        </p>
      </div>
    </UCard>

    <!-- Users Table -->
    <UCard v-else>
      <UTable :columns="columns" :data="filteredUsers">
        <!-- Name Column -->
        <template #full_name-cell="{ row }">
          <div class="flex flex-col">
            <span class="text-default font-medium">{{ row.original.full_name }}</span>
            <span class="text-caption">@{{ row.original.username }}</span>
          </div>
        </template>

        <!-- Role Column -->
        <template #role-cell="{ row }">
          <UBadge :color="getRoleBadge(row.original.role).color">
            {{ getRoleBadge(row.original.role).label }}
          </UBadge>
        </template>

        <!-- Default Location Column -->
        <template #default_location-cell="{ row }">
          <span v-if="row.original.default_location" class="text-default">
            {{ row.original.default_location?.name }}
          </span>
          <span v-else class="text-muted italic">None</span>
        </template>

        <!-- Status Column -->
        <template #status-cell="{ row }">
          <UBadge :color="row.original.is_active ? 'success' : 'neutral'">
            {{ row.original.is_active ? "Active" : "Inactive" }}
          </UBadge>
        </template>

        <!-- Actions Column -->
        <template #actions-cell="{ row }">
          <div class="flex items-center gap-2">
            <UButton
              icon="i-heroicons-eye"
              color="neutral"
              variant="ghost"
              size="sm"
              :to="`/users/${row.original.id}`"
              aria-label="View user"
              class="cursor-pointer"
            />
            <UButton
              icon="i-heroicons-pencil"
              color="neutral"
              variant="ghost"
              size="sm"
              :to="`/users/${row.original.id}/edit`"
              aria-label="Edit user"
              class="cursor-pointer"
            />
            <UButton
              :icon="row.original.is_active ? 'i-heroicons-x-circle' : 'i-heroicons-check-circle'"
              color="neutral"
              variant="ghost"
              size="sm"
              :aria-label="row.original.is_active ? 'Deactivate user' : 'Activate user'"
              class="cursor-pointer"
              @click="toggleUserStatus(row.original)"
            />
            <UButton
              icon="i-heroicons-trash"
              color="error"
              variant="ghost"
              size="sm"
              aria-label="Delete user"
              class="cursor-pointer"
              @click="confirmDelete(row.original)"
            />
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Delete Confirmation Modal -->
    <UModal
      v-model:open="deleteModal"
      title="Delete User"
      description="This action cannot be undone. All user data and access permissions will be permanently removed."
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <p class="text-default">
          Are you sure you want to delete
          <strong>{{ userToDelete?.full_name }}</strong>?
        </p>
      </template>

      <template #footer="{ close }">
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          class="cursor-pointer"
          @click="close"
        />
        <UButton
          label="Delete"
          color="error"
          class="cursor-pointer"
          @click="deleteUser"
        />
      </template>
    </UModal>
  </div>
</template>
