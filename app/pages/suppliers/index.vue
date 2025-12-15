<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <!-- Mobile: smaller icon and title -->
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-building-2" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Suppliers</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Manage your suppliers and vendor information
          </p>
        </div>
      </div>
      <!-- Mobile: shorter button text -->
      <UButton
        v-if="canManageSuppliers"
        color="primary"
        icon="i-lucide-plus"
        size="lg"
        class="cursor-pointer rounded-full px-3 sm:px-6"
        @click="navigateTo('/suppliers/create')"
      >
        <span class="hidden sm:inline">Create Supplier</span>
        <span class="sm:hidden">Create</span>
      </UButton>
    </div>

    <!-- Filters -->
    <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
      <div class="flex items-center gap-3">
        <!-- Search -->
        <div class="flex-1 min-w-0 max-w-md">
          <UInput
            v-model="searchInput"
            placeholder="Search suppliers by name or code..."
            icon="i-lucide-search"
            size="lg"
            class="w-full"
          />
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
    </UCard>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading suppliers..." />
    </div>

    <!-- Error State -->
    <ErrorAlert
      v-else-if="error"
      :message="error?.message || 'Failed to fetch suppliers'"
      @retry="refresh"
    />

    <!-- Empty State -->
    <EmptyState
      v-else-if="!suppliers.length"
      icon="i-lucide-building-2"
      title="No suppliers found"
      description="No suppliers match your search criteria. Try adjusting your filters or create a new supplier."
    >
      <template v-if="canManageSuppliers" #actions>
        <UButton
          color="primary"
          icon="i-lucide-plus"
          class="cursor-pointer"
          @click="navigateTo('/suppliers/create')"
        >
          Create Supplier
        </UButton>
      </template>
    </EmptyState>

    <!-- Suppliers Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 py-2">
      <UCard
        v-for="supplier in suppliers"
        :key="supplier.id"
        class="card-elevated cursor-pointer"
        :ui="{ body: 'p-6' }"
        @click="handleViewDetails(supplier)"
      >
        <!-- Header Row -->
        <div class="flex items-start justify-between gap-3 mb-4">
          <div class="min-w-0 flex-1">
            <h3 class="font-semibold text-[var(--ui-text)] truncate">
              {{ supplier.name }}
            </h3>
            <p class="text-caption text-[var(--ui-text-muted)] font-mono">
              {{ supplier.code }}
            </p>
          </div>
          <UBadge :color="supplier.is_active ? 'success' : 'neutral'" variant="subtle" size="sm">
            {{ supplier.is_active ? "Active" : "Inactive" }}
          </UBadge>
        </div>

        <!-- Contact Info -->
        <div v-if="supplier.contact" class="mb-4">
          <p class="text-sm text-[var(--ui-text-muted)] line-clamp-2">
            {{ supplier.contact }}
          </p>
        </div>

        <!-- Footer Actions -->
        <div
          class="flex items-center justify-between pt-3 border-t border-[var(--ui-border-muted)]"
        >
          <span class="text-xs text-[var(--ui-text-muted)]">
            Created {{ formatDate(supplier.created_at) }}
          </span>
          <div v-if="canManageSuppliers" class="flex items-center gap-2">
            <UButton
              color="error"
              variant="ghost"
              size="sm"
              icon="i-lucide-trash-2"
              class="cursor-pointer"
              @click.stop="openDeleteModal(supplier)"
            >
              <span class="hidden sm:inline">Delete</span>
            </UButton>
            <UButton
              color="primary"
              variant="ghost"
              size="sm"
              icon="i-lucide-edit"
              class="cursor-pointer"
              @click.stop="handleEdit(supplier)"
            >
              <span class="hidden sm:inline">Edit</span>
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen" :dismissible="deletingSupplierId === null">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-subheading font-semibold">Confirm Supplier Deletion</h3>
          </template>

          <div class="space-y-4">
            <div
              v-if="supplierToDelete"
              class="p-4 rounded-lg border-2 border-warning bg-warning/10"
            >
              <p class="font-semibold text-warning">
                {{ supplierToDelete.name }}
              </p>
              <p class="text-caption mt-1">{{ supplierToDelete.code }}</p>
            </div>

            <div class="space-y-2">
              <p class="font-medium">Are you sure you want to delete this supplier?</p>
              <ul class="list-disc list-inside text-caption space-y-1 pl-2">
                <li>If the supplier has delivery history, it will be deactivated</li>
                <li>If the supplier has no records, it will be permanently deleted</li>
              </ul>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-default">
              <UButton
                color="neutral"
                variant="ghost"
                class="cursor-pointer"
                :disabled="deletingSupplierId !== null"
                @click="isDeleteModalOpen = false"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                icon="i-lucide-trash-2"
                class="cursor-pointer"
                :loading="deletingSupplierId !== null"
                @click="confirmDeleteSupplier"
              >
                Delete Supplier
              </UButton>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { refDebounced } from "@vueuse/core";
import type { SupplierItem } from "~/composables/useSuppliers";

definePageMeta({
  middleware: "role",
  roleRequired: "ADMIN",
  layout: "default",
});

// Composables
const { canManageSuppliers } = usePermissions();
const toast = useAppToast();
const { invalidateSuppliers } = useCache();

// Raw search input (updated immediately)
const searchInput = ref("");

// Debounced search value (300ms delay for better UX)
const debouncedSearch = refDebounced(searchInput, 300);

// Status filter (updated immediately)
const statusFilter = ref<boolean | undefined>(true);

// Convert filters to ref for composable
const filtersRef = computed(() => ({
  search: debouncedSearch.value || undefined,
  is_active: statusFilter.value,
}));

// Use the suppliers composable with caching
const { suppliers, loading, error, refresh } = useSuppliers(filtersRef);

// Delete modal state
const isDeleteModalOpen = ref(false);
const deletingSupplierId = ref<string | null>(null);
const supplierToDelete = ref<SupplierItem | null>(null);

// Status dropdown items
const statusDropdownItems = computed(() => [
  [
    {
      label: "Active",
      icon: "i-lucide-circle-check",
      active: statusFilter.value === true,
      onSelect: () => selectStatus(true),
    },
    {
      label: "Inactive",
      icon: "i-lucide-archive",
      active: statusFilter.value === false,
      onSelect: () => selectStatus(false),
    },
    {
      label: "All",
      icon: "i-lucide-list",
      active: statusFilter.value === undefined,
      onSelect: () => selectStatus(undefined),
    },
  ],
]);

// Current status label for dropdown button
const currentStatusLabel = computed(() => {
  if (statusFilter.value === true) return "Active";
  if (statusFilter.value === false) return "Inactive";
  return "All";
});

// Current status icon for dropdown button
const currentStatusIcon = computed(() => {
  if (statusFilter.value === false) return "i-lucide-archive";
  if (statusFilter.value === undefined) return "i-lucide-list";
  return "i-lucide-circle-check";
});

// Select status handler - composable auto-refreshes when filters change
const selectStatus = (statusValue: boolean | undefined) => {
  statusFilter.value = statusValue;
};

// Format date helper
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Handlers
const handleEdit = (supplier: SupplierItem) => {
  navigateTo(`/suppliers/${supplier.id}?edit=true`);
};

const handleViewDetails = (supplier: SupplierItem) => {
  navigateTo(`/suppliers/${supplier.id}`);
};

// Delete handlers
const openDeleteModal = (supplier: SupplierItem) => {
  supplierToDelete.value = supplier;
  isDeleteModalOpen.value = true;
};

const confirmDeleteSupplier = async () => {
  if (!supplierToDelete.value) return;

  deletingSupplierId.value = supplierToDelete.value.id;

  try {
    const response = await $fetch<{ message: string; deactivated?: boolean; deleted?: boolean }>(
      `/api/suppliers/${supplierToDelete.value.id}`,
      {
        method: "DELETE",
      }
    );

    // Show appropriate success message based on delete type
    if (response.deactivated) {
      toast.warning("Supplier Deactivated", {
        description: response.message,
      });
    } else {
      toast.success("Supplier Deleted", {
        description: response.message,
      });
    }

    isDeleteModalOpen.value = false;
    supplierToDelete.value = null;

    // Invalidate cache and refresh list
    invalidateSuppliers();
    await refresh();
  } catch (err: unknown) {
    console.error("Error deleting supplier:", err);
    const message =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to delete supplier";
    toast.error("Error", { description: message });
  } finally {
    deletingSupplierId.value = null;
  }
};

// Set page title
useHead({
  title: "Suppliers - Stock Management System",
});
</script>
