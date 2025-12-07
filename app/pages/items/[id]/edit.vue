<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading item..." />
    </div>

    <!-- Error State -->
    <ErrorAlert
      v-else-if="loadError"
      :message="loadError"
      back-url="/items"
      back-label="Back to Items"
    />

    <!-- Edit Form -->
    <template v-else>
      <!-- Page Header -->
      <div class="flex items-center justify-between gap-3">
        <!-- Mobile: smaller icon and title -->
        <div class="flex items-center gap-2 sm:gap-4">
          <UIcon name="i-lucide-package-2" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
          <div>
            <h1 class="text-xl sm:text-3xl font-bold text-primary">Edit Item</h1>
            <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
              Update item information
            </p>
          </div>
        </div>
        <!-- Mobile: shorter button text -->
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-arrow-left"
          size="lg"
          class="cursor-pointer rounded-full px-3 sm:px-6"
          @click="handleCancel"
        >
          <span class="hidden sm:inline">Back</span>
          <span class="sm:hidden">Back</span>
        </UButton>
      </div>

      <!-- Form Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-6' }">
        <form @submit.prevent="handleSubmit">
          <!-- Status Indicator (Full Width) -->
          <div class="mb-6 flex items-center gap-3 p-4 rounded-lg bg-[var(--ui-bg-muted)]">
            <UIcon
              :name="item?.is_active ? 'i-lucide-circle-check' : 'i-lucide-archive'"
              :class="[
                'w-5 h-5',
                item?.is_active ? 'text-[var(--ui-success)]' : 'text-[var(--ui-text-muted)]',
              ]"
            />
            <div class="flex-1">
              <p class="text-sm font-medium text-[var(--ui-text)]">Item Status</p>
              <p class="text-caption">
                This item is currently
                <span
                  :class="
                    item?.is_active ? 'text-[var(--ui-success)]' : 'text-[var(--ui-text-muted)]'
                  "
                >
                  {{ item?.is_active ? "active" : "inactive" }}
                </span>
              </p>
            </div>
          </div>

          <!-- Responsive Grid: 1 column on mobile, 2 columns on large screens -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Item Code (Read-only) - Left Column -->
            <div>
              <label for="code" class="form-label">Item Code</label>
              <UInput id="code" v-model="form.code" size="lg" class="w-full opacity-60" disabled />
              <p class="mt-1 text-caption">Item code cannot be changed</p>
            </div>

            <!-- Item Name - Right Column -->
            <div>
              <label for="name" class="form-label">
                Item Name
                <span class="text-[var(--ui-error)]">*</span>
              </label>
              <UInput
                id="name"
                v-model="form.name"
                placeholder="e.g., Basmati Rice"
                size="lg"
                class="w-full"
                :disabled="isSubmitting"
                :error="!!errors.name"
                @blur="validateField('name')"
              />
              <p v-if="errors.name" class="mt-1 text-caption text-[var(--ui-error)]">
                {{ errors.name }}
              </p>
            </div>

            <!-- Unit of Measure - Left Column -->
            <div>
              <label for="unit" class="form-label">
                Unit of Measure
                <span class="text-[var(--ui-error)]">*</span>
              </label>
              <USelectMenu
                v-model="form.unit"
                :items="unitOptions"
                value-key="value"
                placeholder="Select unit"
                size="lg"
                class="w-full"
                :disabled="isSubmitting"
                :error="!!errors.unit"
                @update:model-value="validateField('unit')"
              />
              <p v-if="errors.unit" class="mt-1 text-caption text-[var(--ui-error)]">
                {{ errors.unit }}
              </p>
              <p v-else class="mt-1 text-caption">
                How this item is measured (KG = Kilograms, EA = Each, LTR = Liters, etc.)
              </p>
            </div>

            <!-- Category - Right Column -->
            <div>
              <label for="category" class="form-label">Category</label>
              <UInput
                id="category"
                v-model="form.category"
                placeholder="e.g., Dry Goods"
                size="lg"
                class="w-full"
                :disabled="isSubmitting"
                :error="!!errors.category"
                @blur="validateField('category')"
              />
              <p v-if="errors.category" class="mt-1 text-caption text-[var(--ui-error)]">
                {{ errors.category }}
              </p>
              <p v-else class="mt-1 text-caption">Optional: Main category for organizing items</p>
            </div>

            <!-- Sub-Category - Left Column -->
            <div>
              <label for="sub_category" class="form-label">Sub-Category</label>
              <UInput
                id="sub_category"
                v-model="form.sub_category"
                placeholder="e.g., Rice"
                size="lg"
                class="w-full"
                :disabled="isSubmitting"
                :error="!!errors.sub_category"
                @blur="validateField('sub_category')"
              />
              <p v-if="errors.sub_category" class="mt-1 text-caption text-[var(--ui-error)]">
                {{ errors.sub_category }}
              </p>
              <p v-else class="mt-1 text-caption">
                Optional: Sub-category for further organization
              </p>
            </div>
          </div>

          <!-- Form Actions -->
          <div
            class="flex flex-col-reverse sm:flex-row gap-3 pt-6 mt-6 border-t border-[var(--ui-border)]"
          >
            <UButton
              type="button"
              color="neutral"
              variant="soft"
              size="lg"
              class="w-full sm:w-auto cursor-pointer"
              :disabled="isSubmitting || isDeactivating || isActivating"
              @click="handleCancel"
            >
              Cancel
            </UButton>

            <div class="flex-1"></div>

            <!-- Activate Button -->
            <UButton
              v-if="!item?.is_active"
              type="button"
              color="success"
              variant="soft"
              size="lg"
              class="w-full sm:w-auto cursor-pointer"
              :disabled="isSubmitting || isDeactivating || isActivating"
              @click="showActivateModal = true"
            >
              Activate
            </UButton>

            <!-- Deactivate Button -->
            <UButton
              v-if="item?.is_active"
              type="button"
              color="error"
              variant="soft"
              size="lg"
              class="w-full sm:w-auto cursor-pointer"
              :disabled="isSubmitting || isDeactivating || isActivating"
              @click="showDeactivateModal = true"
            >
              Deactivate
            </UButton>

            <!-- Update Button -->
            <UButton
              type="submit"
              color="primary"
              size="lg"
              class="w-full sm:w-auto cursor-pointer"
              :loading="isSubmitting"
              :disabled="
                isSubmitting || isDeactivating || isActivating || !isFormValid || !hasChanges
              "
            >
              {{ isSubmitting ? "Updating..." : "Update Item" }}
            </UButton>
          </div>
        </form>
      </UCard>
    </template>

    <!-- Confirmation Modals -->
    <UiConfirmModal
      v-model="showActivateModal"
      title="Activate Item"
      :message="activateMessage"
      confirm-text="Activate"
      variant="success"
      :loading="isActivating"
      @confirm="handleActivate"
    />

    <UiConfirmModal
      v-model="showDeactivateModal"
      title="Deactivate Item"
      :message="deactivateMessage"
      confirm-text="Deactivate"
      variant="danger"
      :loading="isDeactivating"
      @confirm="handleDeactivate"
    />

    <!-- Cancel Confirmation Modal -->
    <UiConfirmModal
      v-model="showCancelModal"
      title="Discard Changes"
      message="Are you sure you want to cancel? Any unsaved changes will be lost."
      confirm-text="Discard"
      cancel-text="Keep Editing"
      variant="warning"
      @confirm="confirmCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { z } from "zod";

// Page metadata
definePageMeta({
  middleware: ["role"],
  roleRequired: "ADMIN",
  layout: "default",
});

// Composables
const { canEditItems } = usePermissions();
const toast = useAppToast();
const router = useRouter();
const route = useRoute();

// Check permission
if (!canEditItems()) {
  navigateTo("/");
}

// Get item ID from route
const itemId = route.params.id as string;

// Unit options
const unitOptions = [
  { label: "KG - Kilograms", value: "KG" },
  { label: "EA - Each", value: "EA" },
  { label: "LTR - Liters", value: "LTR" },
  { label: "BOX - Box", value: "BOX" },
  { label: "CASE - Case", value: "CASE" },
  { label: "PACK - Pack", value: "PACK" },
];

// Loading states
const isLoading = ref(true);
const loadError = ref("");
const isSubmitting = ref(false);
const isDeactivating = ref(false);
const isActivating = ref(false);
const showActivateModal = ref(false);
const showDeactivateModal = ref(false);
const showCancelModal = ref(false);

// Item data
const item = ref<{
  id: string;
  code: string;
  name: string;
  unit: string;
  category: string | null;
  sub_category: string | null;
  is_active: boolean;
} | null>(null);
const originalData = ref<{
  name: string;
  unit: string;
  category: string;
  sub_category: string;
} | null>(null);

// Form state
const form = reactive({
  code: "",
  name: "",
  unit: undefined as string | undefined,
  category: "",
  sub_category: "",
});

const errors = reactive({
  name: "",
  unit: "",
  category: "",
  sub_category: "",
});

// Validation schema (matches API schema)
const itemSchema = z.object({
  name: z
    .string()
    .min(1, "Item name is required")
    .max(200, "Item name must be 200 characters or less"),
  unit: z.enum(["KG", "EA", "LTR", "BOX", "CASE", "PACK"]).optional(),
  category: z.string().max(50, "Category must be 50 characters or less").optional(),
  sub_category: z.string().max(50, "Sub-category must be 50 characters or less").optional(),
});

/**
 * Fetch item data on mount
 */
async function fetchItem() {
  isLoading.value = true;
  loadError.value = "";

  try {
    const response = await $fetch<{ item: typeof item.value }>(`/api/items/${itemId}`);

    if (!response.item) {
      throw new Error("Item not found");
    }

    item.value = response.item;

    // Populate form with existing data
    form.code = response.item.code;
    form.name = response.item.name;
    form.unit = response.item.unit;
    form.category = response.item.category || "";
    form.sub_category = response.item.sub_category || "";

    // Store original data for change detection
    originalData.value = {
      name: response.item.name,
      unit: response.item.unit,
      category: response.item.category || "",
      sub_category: response.item.sub_category || "",
    };
  } catch (error: unknown) {
    console.error("Error fetching item:", error);

    if (
      error &&
      typeof error === "object" &&
      "data" in error &&
      error.data &&
      typeof error.data === "object"
    ) {
      const errorData = error.data as { code?: string; message?: string };

      if (errorData.code === "ITEM_NOT_FOUND") {
        loadError.value = "Item not found";
      } else if (errorData.code === "INSUFFICIENT_PERMISSIONS") {
        loadError.value = "You do not have permission to edit this item";
      } else {
        loadError.value = errorData.message || "Failed to load item";
      }
    } else {
      loadError.value = "Failed to load item";
    }
  } finally {
    isLoading.value = false;
  }
}

/**
 * Validate a single field
 */
function validateField(field: keyof typeof errors) {
  try {
    const fieldSchema = itemSchema.shape[field];
    if (fieldSchema) {
      fieldSchema.parse(form[field]);
      errors[field] = "";
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors[field] = error.issues[0]?.message || "Invalid value";
    }
  }
}

/**
 * Validate entire form
 */
function validateForm(): boolean {
  try {
    // Prepare data for validation
    const data = {
      name: form.name,
      unit: form.unit,
      category: form.category || undefined,
      sub_category: form.sub_category || undefined,
    };

    itemSchema.parse(data);

    // Clear all errors
    Object.keys(errors).forEach((key) => {
      errors[key as keyof typeof errors] = "";
    });

    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Set errors for each field
      error.issues.forEach((err: z.ZodIssue) => {
        const field = err.path[0] as keyof typeof errors;
        if (field) {
          errors[field] = err.message;
        }
      });
    }
    return false;
  }
}

/**
 * Check if form is valid for submission
 */
const isFormValid = computed(() => {
  return !!(
    form.name &&
    form.unit &&
    !errors.name &&
    !errors.unit &&
    !errors.category &&
    !errors.sub_category
  );
});

/**
 * Check if form has changes
 */
const hasChanges = computed(() => {
  if (!originalData.value) return false;

  return (
    form.name !== originalData.value.name ||
    form.unit !== originalData.value.unit ||
    form.category !== originalData.value.category ||
    form.sub_category !== originalData.value.sub_category
  );
});

/**
 * Computed properties for modal messages
 */
const activateMessage = computed(() =>
  item.value
    ? `Are you sure you want to activate "${item.value.name}"? This will allow the item to be used in new transactions.`
    : ""
);

const deactivateMessage = computed(() =>
  item.value
    ? `Are you sure you want to deactivate "${item.value.name}"? This will prevent the item from being used in new transactions, but existing records will remain.`
    : ""
);

/**
 * Handle form submission
 */
async function handleSubmit() {
  // Validate form first
  if (!validateForm()) {
    toast.error("Validation Error", {
      description: "Please fix the errors in the form",
    });
    return;
  }

  // Check if there are changes
  if (!hasChanges.value) {
    toast.warning("No Changes", {
      description: "No changes were made to the item",
    });
    return;
  }

  isSubmitting.value = true;

  try {
    // Prepare data for API (only send changed fields)
    const data: {
      name?: string;
      unit?: string;
      category?: string | null;
      sub_category?: string | null;
    } = {};

    if (form.name !== originalData.value?.name) data.name = form.name;
    if (form.unit !== originalData.value?.unit) data.unit = form.unit;
    if (form.category !== originalData.value?.category) data.category = form.category || null;
    if (form.sub_category !== originalData.value?.sub_category)
      data.sub_category = form.sub_category || null;

    // Call API to update item
    const response = await $fetch<{ item: unknown; message: string }>(`/api/items/${itemId}`, {
      method: "PATCH",
      body: data,
    });

    // Show success message
    toast.success("Success", {
      description: response.message || "Item updated successfully",
    });

    // Redirect to items list
    router.push("/items");
  } catch (error: unknown) {
    console.error("Error updating item:", error);

    // Handle specific error cases
    if (
      error &&
      typeof error === "object" &&
      "data" in error &&
      error.data &&
      typeof error.data === "object"
    ) {
      const errorData = error.data as {
        code?: string;
        message?: string;
        details?: Array<{ path?: string[]; message: string }>;
      };

      if (errorData.code === "VALIDATION_ERROR") {
        toast.error("Validation Error", {
          description: errorData.message || "Invalid item data",
        });

        // Set field-specific errors if available
        if (errorData.details) {
          errorData.details.forEach((err) => {
            const field = err.path?.[0];
            if (field && field in errors) {
              errors[field as keyof typeof errors] = err.message;
            }
          });
        }
      } else if (errorData.code === "ITEM_NOT_FOUND") {
        toast.error("Item Not Found", {
          description: "The item you are trying to edit does not exist",
        });
        router.push("/items");
      } else if (errorData.code === "INSUFFICIENT_PERMISSIONS") {
        toast.error("Access Denied", {
          description: "You do not have permission to update items",
        });
        router.push("/items");
      } else {
        toast.error("Error", {
          description: errorData.message || "Failed to update item",
        });
      }
    } else {
      toast.error("Error", {
        description: "Failed to update item",
      });
    }
  } finally {
    isSubmitting.value = false;
  }
}

/**
 * Handle deactivate action
 */
async function handleDeactivate() {
  isDeactivating.value = true;

  try {
    // Call API to deactivate item
    const response = await $fetch<{ item: unknown; message: string; deactivated: boolean }>(
      `/api/items/${itemId}`,
      {
        method: "DELETE",
      }
    );

    // Show success message
    toast.success("Success", {
      description: response.message || "Item deactivated successfully",
    });

    // Close modal
    showDeactivateModal.value = false;

    // Redirect to items list
    router.push("/items");
  } catch (error: unknown) {
    console.error("Error deactivating item:", error);

    // Handle specific error cases
    if (
      error &&
      typeof error === "object" &&
      "data" in error &&
      error.data &&
      typeof error.data === "object"
    ) {
      const errorData = error.data as { code?: string; message?: string };

      if (errorData.code === "ITEM_NOT_FOUND") {
        toast.error("Item Not Found", {
          description: "The item you are trying to deactivate does not exist",
        });
        router.push("/items");
      } else if (errorData.code === "INSUFFICIENT_PERMISSIONS") {
        toast.error("Access Denied", {
          description: "You do not have permission to deactivate items",
        });
      } else {
        toast.error("Error", {
          description: errorData.message || "Failed to deactivate item",
        });
      }
    } else {
      toast.error("Error", {
        description: "Failed to deactivate item",
      });
    }
  } finally {
    isDeactivating.value = false;
  }
}

/**
 * Handle activate action
 */
async function handleActivate() {
  isActivating.value = true;

  try {
    // Call API to activate item
    const response = await $fetch<{ item: typeof item.value; message: string }>(
      `/api/items/${itemId}`,
      {
        method: "PATCH",
        body: {
          is_active: true,
        },
      }
    );

    // Update local item state
    if (item.value) {
      item.value.is_active = true;
    }

    // Show success message
    toast.success("Success", {
      description: response.message || "Item activated successfully",
    });

    // Close modal
    showActivateModal.value = false;
  } catch (error: unknown) {
    console.error("Error activating item:", error);

    // Handle specific error cases
    if (
      error &&
      typeof error === "object" &&
      "data" in error &&
      error.data &&
      typeof error.data === "object"
    ) {
      const errorData = error.data as { code?: string; message?: string };

      if (errorData.code === "ITEM_NOT_FOUND") {
        toast.error("Item Not Found", {
          description: "The item you are trying to activate does not exist",
        });
        router.push("/items");
      } else if (errorData.code === "INSUFFICIENT_PERMISSIONS") {
        toast.error("Access Denied", {
          description: "You do not have permission to activate items",
        });
      } else if (errorData.code === "VALIDATION_ERROR") {
        toast.error("Validation Error", {
          description: errorData.message || "Invalid activation request",
        });
      } else {
        toast.error("Error", {
          description: errorData.message || "Failed to activate item",
        });
      }
    } else {
      toast.error("Error", {
        description: "Failed to activate item",
      });
    }
  } finally {
    isActivating.value = false;
  }
}

/**
 * Handle cancel action
 */
function handleCancel() {
  // Check if form has been modified
  if (hasChanges.value) {
    showCancelModal.value = true;
  } else {
    router.push("/items");
  }
}

/**
 * Confirm cancel and navigate away
 */
function confirmCancel() {
  showCancelModal.value = false;
  router.push("/items");
}

// Fetch item data on mount
onMounted(() => {
  fetchItem();
});

// Set page title
useHead({
  title: computed(() => (item.value ? `Edit ${item.value.name}` : "Edit Item")),
});
</script>
