<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-building-2" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">
            {{ supplier?.name || "Supplier Details" }}
          </h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            View and manage supplier information
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
          @click="navigateTo('/suppliers')"
        >
          <span class="hidden sm:inline">Back</span>
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading supplier details..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" @retry="fetchSupplierDetails" />

    <!-- Supplier Details -->
    <div v-else-if="supplier" class="space-y-6">
      <!-- Edit Form -->
      <UForm v-if="isEditing" :schema="schema" :state="formData" @submit="onSubmit">
        <!-- Basic Info Card -->
        <UCard class="card-elevated mb-6" :ui="{ body: 'p-6' }">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                Edit Supplier Information
              </h2>
              <UBadge
                :color="supplier.is_active ? 'success' : 'neutral'"
                variant="subtle"
                size="lg"
              >
                {{ supplier.is_active ? "Active" : "Inactive" }}
              </UBadge>
            </div>
          </template>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Supplier Code (Read-only) -->
            <div
              class="lg:col-span-2 p-4 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border-muted)]"
            >
              <label class="form-label text-xs mb-2">Supplier Code</label>
              <span class="text-lg font-mono font-semibold text-[var(--ui-text)]">
                {{ supplier.code }}
              </span>
              <p class="text-xs text-[var(--ui-text-muted)] mt-1">
                Supplier code cannot be changed after creation
              </p>
            </div>

            <!-- Supplier Name -->
            <UFormField label="Supplier Name" name="name" required class="lg:col-span-2">
              <UInput
                v-model="formData.name"
                placeholder="Enter supplier name"
                icon="i-lucide-building-2"
                size="lg"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <!-- Contact Information -->
            <UFormField
              label="Contact Information"
              name="contact"
              help="Contact details including name, phone, email, address"
              class="lg:col-span-2"
            >
              <UTextarea
                v-model="formData.contact"
                placeholder="Enter contact details"
                :rows="4"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <!-- Active Status -->
            <UFormField label="Status" name="is_active" class="lg:col-span-2">
              <div class="flex items-center gap-3">
                <USwitch v-model="formData.is_active" :disabled="submitting" />
                <span class="text-sm">
                  {{ formData.is_active ? "Active" : "Inactive" }}
                </span>
              </div>
              <p class="text-xs text-[var(--ui-text-muted)] mt-2">
                Inactive suppliers will not appear in delivery forms
              </p>
            </UFormField>
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
            :disabled="submitting"
            @click="cancelEdit"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            color="primary"
            icon="i-lucide-save"
            size="lg"
            class="cursor-pointer w-full sm:w-auto"
            :loading="submitting"
          >
            {{ submitting ? "Saving..." : "Save Changes" }}
          </UButton>
        </div>
      </UForm>

      <!-- View Mode -->
      <template v-else>
        <!-- Basic Info Card -->
        <UCard class="card-elevated" :ui="{ body: 'p-6' }">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                Supplier Information
              </h2>
              <div class="flex items-center gap-2">
                <UBadge
                  :color="supplier.is_active ? 'success' : 'neutral'"
                  variant="subtle"
                  size="lg"
                >
                  {{ supplier.is_active ? "Active" : "Inactive" }}
                </UBadge>
                <UButton
                  v-if="canManageSuppliers()"
                  color="primary"
                  icon="i-lucide-edit"
                  size="sm"
                  class="cursor-pointer"
                  @click="startEdit"
                >
                  Edit
                </UButton>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Supplier Code -->
            <div
              class="lg:col-span-2 p-4 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border-muted)]"
            >
              <label class="form-label text-xs mb-2">Supplier Code</label>
              <span class="text-lg font-mono font-semibold text-[var(--ui-text)]">
                {{ supplier.code }}
              </span>
            </div>

            <!-- Supplier Name -->
            <div>
              <label class="form-label">Supplier Name</label>
              <p class="text-[var(--ui-text)] font-medium mt-2">{{ supplier.name }}</p>
            </div>

            <!-- Created Date -->
            <div>
              <label class="form-label">Created</label>
              <p class="text-[var(--ui-text)] font-medium mt-2">
                {{ formatDate(supplier.created_at) }}
              </p>
            </div>

            <!-- Contact Information (Full width) -->
            <div class="lg:col-span-2">
              <label class="form-label">Contact Information</label>
              <p v-if="supplier.contact" class="text-[var(--ui-text)] mt-2 whitespace-pre-wrap">
                {{ supplier.contact }}
              </p>
              <p v-else class="text-[var(--ui-text-muted)] mt-2 italic">No contact information</p>
            </div>
          </div>
        </UCard>

        <!-- Statistics Card -->
        <UCard class="card-elevated" :ui="{ body: 'p-6' }">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">Statistics</h2>
              <p class="text-xs text-[var(--ui-text-muted)]">Transaction summary</p>
            </div>
          </template>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
              <div class="flex items-baseline gap-2">
                <p class="text-2xl font-bold text-primary">
                  {{ supplier._count?.deliveries || 0 }}
                </p>
                <UIcon
                  v-if="!supplier._count?.deliveries"
                  name="i-lucide-package"
                  class="w-4 h-4 text-[var(--ui-text-muted)]"
                />
              </div>
              <p class="text-sm text-[var(--ui-text-muted)] mt-1">Deliveries</p>
              <p
                v-if="!supplier._count?.deliveries"
                class="text-xs text-[var(--ui-text-muted)] mt-1"
              >
                No deliveries yet
              </p>
            </div>
            <div class="p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
              <div class="flex items-baseline gap-2">
                <p class="text-2xl font-bold text-primary">
                  {{ supplier._count?.purchase_orders || 0 }}
                </p>
                <UIcon
                  v-if="!supplier._count?.purchase_orders"
                  name="i-lucide-file-text"
                  class="w-4 h-4 text-[var(--ui-text-muted)]"
                />
              </div>
              <p class="text-sm text-[var(--ui-text-muted)] mt-1">Purchase Orders</p>
              <p
                v-if="!supplier._count?.purchase_orders"
                class="text-xs text-[var(--ui-text-muted)] mt-1"
              >
                No purchase orders yet
              </p>
            </div>
          </div>
        </UCard>

        <!-- Danger Zone Card (Admin Only) -->
        <UCard
          v-if="canManageSuppliers()"
          class="card-elevated border-2 border-[var(--ui-error)]"
          :ui="{ body: 'p-6' }"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-error" />
              <h2 class="text-lg font-semibold text-error">Danger Zone</h2>
            </div>
          </template>

          <div class="space-y-4">
            <div>
              <p class="text-[var(--ui-text)] font-medium mb-2">Delete this supplier</p>
              <p class="text-caption text-[var(--ui-text-muted)] mb-4">
                Once you delete a supplier, there is no going back. If the supplier has delivery
                history, it will be deactivated instead.
              </p>
              <UButton
                color="error"
                icon="i-lucide-trash-2"
                size="lg"
                class="cursor-pointer"
                @click="openDeleteModal"
              >
                Delete Supplier
              </UButton>
            </div>
          </div>
        </UCard>
      </template>
    </div>

    <!-- Cancel Edit Confirmation Modal -->
    <UModal v-model:open="isCancelEditModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Discard Changes?
            </h3>
          </template>

          <div class="space-y-4">
            <p class="text-[var(--ui-text)]">
              You have unsaved changes. Are you sure you want to cancel? All changes will be lost.
            </p>

            <!-- Actions -->
            <div
              class="flex items-center justify-end gap-3 pt-4 border-t border-[var(--ui-border)]"
            >
              <UButton
                color="neutral"
                variant="ghost"
                class="cursor-pointer"
                @click="isCancelEditModalOpen = false"
              >
                Continue Editing
              </UButton>
              <UButton color="error" class="cursor-pointer" @click="confirmCancelEdit">
                Discard Changes
              </UButton>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen" :dismissible="!deletingSupplier">
      <template #content>
        <UCard :ui="{ body: 'p-6' }">
          <template #header>
            <h3 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Confirm Supplier Deletion
            </h3>
          </template>

          <div class="space-y-4">
            <div
              v-if="supplier"
              class="p-4 rounded-lg border-2 border-[var(--ui-warning)] bg-[var(--ui-warning)]/10"
            >
              <p class="font-semibold text-[var(--ui-warning)]">
                {{ supplier.name }}
              </p>
              <p class="text-caption text-[var(--ui-text-muted)] mt-1">{{ supplier.code }}</p>
            </div>

            <div class="space-y-2">
              <p class="font-medium text-[var(--ui-text)]">
                Are you sure you want to delete this supplier?
              </p>
              <ul
                class="list-disc list-inside text-caption text-[var(--ui-text-muted)] space-y-1 pl-2"
              >
                <li>If the supplier has delivery history, it will be deactivated</li>
                <li>If the supplier has no records, it will be permanently deleted</li>
              </ul>
            </div>

            <!-- Actions -->
            <div
              class="flex items-center justify-end gap-3 pt-4 border-t border-[var(--ui-border)]"
            >
              <UButton
                color="error"
                variant="soft"
                class="cursor-pointer"
                :disabled="deletingSupplier"
                @click="isDeleteModalOpen = false"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                icon="i-lucide-trash-2"
                class="cursor-pointer"
                :loading="deletingSupplier"
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
import { z } from "zod";

definePageMeta({
  layout: "default",
});

// Types
interface SupplierDetail {
  id: string;
  code: string;
  name: string;
  contact?: string | null;
  is_active: boolean;
  created_at: string;
  _count?: {
    deliveries: number;
    purchase_orders: number;
  };
}

// Composables
const route = useRoute();
const toast = useAppToast();
const { canManageSuppliers } = usePermissions();
const { invalidateSuppliers } = useCache();

// State
const loading = ref(true);
const error = ref<string | null>(null);
const supplier = ref<SupplierDetail | null>(null);

const isEditing = ref(false);
const submitting = ref(false);

// Delete modal state
const isDeleteModalOpen = ref(false);
const deletingSupplier = ref(false);

// Cancel edit modal state
const isCancelEditModalOpen = ref(false);

// Form data
const formData = reactive({
  name: "",
  contact: "",
  is_active: true,
});

// Track original form data for comparison
const originalFormData = ref({
  name: "",
  contact: "",
  is_active: true,
});

// Validation schema
const schema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be at most 200 characters"),
  contact: z.string().max(1000, "Contact must be at most 1000 characters").optional(),
  is_active: z.boolean(),
});

// Format date helper
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Fetch supplier details
const fetchSupplierDetails = async () => {
  loading.value = true;
  error.value = null;

  try {
    const supplierId = route.params.id as string;
    const response = await $fetch<{ supplier: SupplierDetail }>(`/api/suppliers/${supplierId}`);

    supplier.value = response.supplier;
  } catch (err: unknown) {
    console.error("Error fetching supplier details:", err);
    error.value =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to fetch supplier details";
    toast.error("Error", { description: error.value || undefined });
  } finally {
    loading.value = false;
  }
};

// Start editing
const startEdit = () => {
  if (supplier.value) {
    formData.name = supplier.value.name;
    formData.contact = supplier.value.contact || "";
    formData.is_active = supplier.value.is_active;

    // Store original values for comparison
    originalFormData.value = {
      name: supplier.value.name,
      contact: supplier.value.contact || "",
      is_active: supplier.value.is_active,
    };

    isEditing.value = true;
  }
};

// Check if form has unsaved changes
const hasUnsavedChanges = () => {
  return (
    formData.name !== originalFormData.value.name ||
    formData.contact !== originalFormData.value.contact ||
    formData.is_active !== originalFormData.value.is_active
  );
};

// Cancel editing
const cancelEdit = () => {
  if (hasUnsavedChanges()) {
    isCancelEditModalOpen.value = true;
  } else {
    isEditing.value = false;
  }
};

// Confirm cancel edit (discard changes)
const confirmCancelEdit = () => {
  isCancelEditModalOpen.value = false;
  isEditing.value = false;
  // Reset form data to original values
  if (supplier.value) {
    formData.name = supplier.value.name;
    formData.contact = supplier.value.contact || "";
    formData.is_active = supplier.value.is_active;
  }
};

// Submit handler
const onSubmit = async () => {
  submitting.value = true;

  try {
    const supplierId = route.params.id as string;

    const payload = {
      name: formData.name,
      contact: formData.contact || null,
      is_active: formData.is_active,
    };

    await $fetch(`/api/suppliers/${supplierId}`, {
      method: "PATCH",
      body: payload,
    });

    // Invalidate cache
    invalidateSuppliers();

    toast.success("Success", { description: "Supplier updated successfully" });
    isEditing.value = false;

    // Refresh supplier details
    await fetchSupplierDetails();
  } catch (err: unknown) {
    console.error("Error updating supplier:", err);
    const message =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to update supplier";
    toast.error("Error", { description: message });
  } finally {
    submitting.value = false;
  }
};

// Delete handlers
const openDeleteModal = () => {
  isDeleteModalOpen.value = true;
};

const confirmDeleteSupplier = async () => {
  if (!supplier.value) return;

  deletingSupplier.value = true;

  try {
    const response = await $fetch<{ message: string; deactivated?: boolean; deleted?: boolean }>(
      `/api/suppliers/${supplier.value.id}`,
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

    // Invalidate cache and navigate back to suppliers list
    invalidateSuppliers();
    navigateTo("/suppliers");
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
    deletingSupplier.value = false;
  }
};

// Lifecycle
onMounted(async () => {
  await fetchSupplierDetails();

  // Check if edit mode should be enabled via query parameter
  if (route.query.edit === "true" && supplier.value) {
    startEdit();
  }
});

// Set page title
useHead({
  title: () => `${supplier.value?.name || "Supplier"} - Stock Management System`,
});
</script>
