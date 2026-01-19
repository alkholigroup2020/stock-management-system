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

            <!-- Phone -->
            <UFormField label="Phone" name="phone">
              <UInput
                v-model="formData.phone"
                placeholder="Enter phone number"
                icon="i-lucide-phone"
                size="lg"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <!-- Mobile -->
            <UFormField label="Mobile" name="mobile">
              <UInput
                v-model="formData.mobile"
                placeholder="Enter mobile number"
                icon="i-lucide-smartphone"
                size="lg"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <!-- VAT Registration Number -->
            <UFormField label="VAT Registration No." name="vat_reg_no">
              <UInput
                v-model="formData.vat_reg_no"
                placeholder="Enter VAT registration number"
                icon="i-lucide-file-text"
                size="lg"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <!-- Address -->
            <UFormField label="Address" name="address">
              <UTextarea
                v-model="formData.address"
                placeholder="Enter full mailing address"
                :rows="2"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <!-- Contact Information -->
            <UFormField
              label="Contact Person / Notes"
              name="contact"
              help="Additional contact details or notes"
              class="lg:col-span-2"
            >
              <UTextarea
                v-model="formData.contact"
                placeholder="Enter contact person details or notes"
                :rows="3"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <!-- Email Addresses Section -->
            <div class="lg:col-span-2">
              <label class="form-label mb-2 block">
                Email Addresses
                <span class="text-[var(--ui-text-muted)] font-normal ml-2">
                  (for PO notifications)
                </span>
              </label>
              <FormEmailListInput
                v-model="formData.emails"
                :disabled="submitting"
                :max-emails="10"
              />
            </div>

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

            <!-- Phone -->
            <div>
              <label class="form-label">Phone</label>
              <p v-if="supplier.phone" class="text-[var(--ui-text)] font-medium mt-2">
                {{ supplier.phone }}
              </p>
              <p v-else class="text-[var(--ui-text-muted)] mt-2 italic">Not provided</p>
            </div>

            <!-- Mobile -->
            <div>
              <label class="form-label">Mobile</label>
              <p v-if="supplier.mobile" class="text-[var(--ui-text)] font-medium mt-2">
                {{ supplier.mobile }}
              </p>
              <p v-else class="text-[var(--ui-text-muted)] mt-2 italic">Not provided</p>
            </div>

            <!-- VAT Registration -->
            <div>
              <label class="form-label">VAT Registration No.</label>
              <p v-if="supplier.vat_reg_no" class="text-[var(--ui-text)] font-medium mt-2">
                {{ supplier.vat_reg_no }}
              </p>
              <p v-else class="text-[var(--ui-text-muted)] mt-2 italic">Not provided</p>
            </div>

            <!-- Address -->
            <div>
              <label class="form-label">Address</label>
              <p
                v-if="supplier.address"
                class="text-[var(--ui-text)] font-medium mt-2 whitespace-pre-wrap"
              >
                {{ supplier.address }}
              </p>
              <p v-else class="text-[var(--ui-text-muted)] mt-2 italic">Not provided</p>
            </div>

            <!-- Contact Information / Notes (Full width) -->
            <div class="lg:col-span-2">
              <label class="form-label">Contact Person / Notes</label>
              <p v-if="supplier.contact" class="text-[var(--ui-text)] mt-2 whitespace-pre-wrap">
                {{ supplier.contact }}
              </p>
              <p v-else class="text-[var(--ui-text-muted)] mt-2 italic">No notes</p>
            </div>

            <!-- Email Addresses (Full width) -->
            <div class="lg:col-span-2">
              <label class="form-label">Email Addresses</label>
              <div v-if="supplier.emails && supplier.emails.length > 0" class="mt-2 space-y-1">
                <div
                  v-for="(email, index) in supplier.emails"
                  :key="index"
                  class="flex items-center gap-2 text-[var(--ui-text)]"
                >
                  <UIcon name="i-lucide-mail" class="w-4 h-4 text-[var(--ui-text-muted)]" />
                  <a :href="`mailto:${email}`" class="text-primary hover:underline">
                    {{ email }}
                  </a>
                </div>
              </div>
              <p v-else class="text-[var(--ui-text-muted)] mt-2 italic">No email addresses</p>
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
  middleware: "role",
  roleRequired: "ADMIN",
  layout: "default",
});

// Types
interface SupplierDetail {
  id: string;
  code: string;
  name: string;
  contact?: string | null;
  emails: string[];
  phone?: string | null;
  mobile?: string | null;
  vat_reg_no?: string | null;
  address?: string | null;
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
  emails: [] as string[],
  phone: "",
  mobile: "",
  vat_reg_no: "",
  address: "",
  is_active: true,
});

// Track original form data for comparison
const originalFormData = ref({
  name: "",
  contact: "",
  emails: [] as string[],
  phone: "",
  mobile: "",
  vat_reg_no: "",
  address: "",
  is_active: true,
});

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validation schema
const schema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be at most 200 characters"),
  contact: z.string().max(1000, "Contact must be at most 1000 characters").optional(),
  emails: z
    .array(
      z.string().refine((email) => emailRegex.test(email), {
        message: "Invalid email format",
      })
    )
    .max(10, "Maximum 10 email addresses allowed")
    .optional(),
  phone: z.string().max(50, "Phone must be at most 50 characters").optional(),
  mobile: z.string().max(50, "Mobile must be at most 50 characters").optional(),
  vat_reg_no: z.string().max(50, "VAT registration must be at most 50 characters").optional(),
  address: z.string().max(500, "Address must be at most 500 characters").optional(),
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
    formData.emails = supplier.value.emails || [];
    formData.phone = supplier.value.phone || "";
    formData.mobile = supplier.value.mobile || "";
    formData.vat_reg_no = supplier.value.vat_reg_no || "";
    formData.address = supplier.value.address || "";
    formData.is_active = supplier.value.is_active;

    // Store original values for comparison
    originalFormData.value = {
      name: supplier.value.name,
      contact: supplier.value.contact || "",
      emails: [...(supplier.value.emails || [])],
      phone: supplier.value.phone || "",
      mobile: supplier.value.mobile || "",
      vat_reg_no: supplier.value.vat_reg_no || "",
      address: supplier.value.address || "",
      is_active: supplier.value.is_active,
    };

    isEditing.value = true;
  }
};

// Check if form has unsaved changes
const hasUnsavedChanges = () => {
  const emailsChanged =
    JSON.stringify(formData.emails) !== JSON.stringify(originalFormData.value.emails);
  return (
    formData.name !== originalFormData.value.name ||
    formData.contact !== originalFormData.value.contact ||
    emailsChanged ||
    formData.phone !== originalFormData.value.phone ||
    formData.mobile !== originalFormData.value.mobile ||
    formData.vat_reg_no !== originalFormData.value.vat_reg_no ||
    formData.address !== originalFormData.value.address ||
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
    formData.emails = supplier.value.emails || [];
    formData.phone = supplier.value.phone || "";
    formData.mobile = supplier.value.mobile || "";
    formData.vat_reg_no = supplier.value.vat_reg_no || "";
    formData.address = supplier.value.address || "";
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
      emails: formData.emails,
      phone: formData.phone || null,
      mobile: formData.mobile || null,
      vat_reg_no: formData.vat_reg_no || null,
      address: formData.address || null,
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
