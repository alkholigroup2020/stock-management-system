<template>
  <div class="bg-default">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
        <p class="mt-4 text-sm text-muted">Loading item...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="flex items-center justify-center min-h-[400px]">
      <UCard class="max-w-md">
        <div class="text-center">
          <UIcon
            name="i-heroicons-exclamation-triangle"
            class="w-12 h-12 text-error mx-auto mb-4"
          />
          <h2 class="text-xl font-semibold text-default mb-2">Error Loading Item</h2>
          <p class="text-sm text-muted mb-4">{{ loadError }}</p>
          <UButton color="primary" @click="router.push('/items')">Back to Items</UButton>
        </div>
      </UCard>
    </div>

    <!-- Edit Form -->
    <div v-else class="space-y-6">
      <!-- Page Header -->
      <LayoutPageHeader
        title="Edit Item"
        icon="i-lucide-package-2"
        :show-location="true"
        :show-period="true"
        location-scope="all"
      >
        <template #actions>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-heroicons-arrow-left"
            @click="handleCancel"
          >
            Back
          </UButton>
        </template>
      </LayoutPageHeader>

      <!-- Form Card -->
      <UCard class="max-w-2xl">
        <form @submit.prevent="handleSubmit">
          <div class="space-y-6">
            <!-- Item Code (Read-only) -->
            <div>
              <label for="code" class="form-label">Item Code</label>
              <UInput id="code" v-model="form.code" size="lg" disabled class="opacity-60" />
              <p class="mt-1 text-xs text-muted">Item code cannot be changed</p>
            </div>

            <!-- Item Name -->
            <div>
              <label for="name" class="form-label">
                Item Name
                <span class="text-error">*</span>
              </label>
              <UInput
                id="name"
                v-model="form.name"
                placeholder="e.g., Basmati Rice"
                size="lg"
                :disabled="isSubmitting"
                :error="!!errors.name"
                @blur="validateField('name')"
              />
              <p v-if="errors.name" class="mt-1 text-sm text-error">
                {{ errors.name }}
              </p>
            </div>

            <!-- Unit of Measure -->
            <div>
              <label for="unit" class="form-label">
                Unit of Measure
                <span class="text-error">*</span>
              </label>
              <USelectMenu
                v-model="form.unit"
                :items="unitOptions"
                value-key="value"
                placeholder="Select unit"
                size="lg"
                :disabled="isSubmitting"
                :error="!!errors.unit"
                @update:model-value="validateField('unit')"
              />
              <p v-if="errors.unit" class="mt-1 text-sm text-error">
                {{ errors.unit }}
              </p>
              <p class="mt-1 text-xs text-muted">
                How this item is measured (KG = Kilograms, EA = Each, LTR = Liters, etc.)
              </p>
            </div>

            <!-- Category -->
            <div>
              <label for="category" class="form-label">Category</label>
              <UInput
                id="category"
                v-model="form.category"
                placeholder="e.g., Dry Goods"
                size="lg"
                :disabled="isSubmitting"
                :error="!!errors.category"
                @blur="validateField('category')"
              />
              <p v-if="errors.category" class="mt-1 text-sm text-error">
                {{ errors.category }}
              </p>
              <p class="mt-1 text-xs text-muted">Optional: Main category for organizing items</p>
            </div>

            <!-- Sub-Category -->
            <div>
              <label for="sub_category" class="form-label">Sub-Category</label>
              <UInput
                id="sub_category"
                v-model="form.sub_category"
                placeholder="e.g., Rice"
                size="lg"
                :disabled="isSubmitting"
                :error="!!errors.sub_category"
                @blur="validateField('sub_category')"
              />
              <p v-if="errors.sub_category" class="mt-1 text-sm text-error">
                {{ errors.sub_category }}
              </p>
              <p class="mt-1 text-xs text-muted">Optional: Sub-category for further organization</p>
            </div>

            <!-- Form Actions -->
            <div class="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-default">
              <UButton
                type="button"
                color="neutral"
                variant="soft"
                size="lg"
                :disabled="isSubmitting || isDeactivating"
                @click="handleCancel"
                class="w-full sm:w-auto"
              >
                Cancel
              </UButton>

              <div class="flex-1"></div>

              <!-- Deactivate Button -->
              <UButton
                v-if="item?.is_active"
                type="button"
                color="error"
                variant="soft"
                size="lg"
                :loading="isDeactivating"
                :disabled="isSubmitting || isDeactivating"
                @click="handleDeactivate"
                class="w-full sm:w-auto"
              >
                {{ isDeactivating ? "Deactivating..." : "Deactivate" }}
              </UButton>

              <!-- Update Button -->
              <UButton
                type="submit"
                color="primary"
                size="lg"
                :loading="isSubmitting"
                :disabled="isSubmitting || isDeactivating || !isFormValid || !hasChanges"
                class="w-full sm:w-auto"
              >
                {{ isSubmitting ? "Updating..." : "Update Item" }}
              </UButton>
            </div>
          </div>
        </form>
      </UCard>
    </div>
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
const toast = useToast();
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

// Item data
const item = ref<any>(null);
const originalData = ref<any>(null);

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
    const response = await $fetch<{ item: any }>(`/api/items/${itemId}`);
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
  } catch (error: any) {
    console.error("Error fetching item:", error);

    if (error?.data?.code === "ITEM_NOT_FOUND") {
      loadError.value = "Item not found";
    } else if (error?.data?.code === "INSUFFICIENT_PERMISSIONS") {
      loadError.value = "You do not have permission to edit this item";
    } else {
      loadError.value = error?.data?.message || "Failed to load item";
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
 * Handle form submission
 */
async function handleSubmit() {
  // Validate form first
  if (!validateForm()) {
    toast.add({
      title: "Validation Error",
      description: "Please fix the errors in the form",
      color: "error",
    });
    return;
  }

  // Check if there are changes
  if (!hasChanges.value) {
    toast.add({
      title: "No Changes",
      description: "No changes were made to the item",
      color: "warning",
    });
    return;
  }

  isSubmitting.value = true;

  try {
    // Prepare data for API (only send changed fields)
    const data: any = {};
    if (form.name !== originalData.value.name) data.name = form.name;
    if (form.unit !== originalData.value.unit) data.unit = form.unit;
    if (form.category !== originalData.value.category) data.category = form.category || null;
    if (form.sub_category !== originalData.value.sub_category)
      data.sub_category = form.sub_category || null;

    // Call API to update item
    const response = await $fetch<{ item: any; message: string }>(`/api/items/${itemId}`, {
      method: "PATCH",
      body: data,
    });

    // Show success message
    toast.add({
      title: "Success",
      description: response.message || "Item updated successfully",
      color: "success",
    });

    // Redirect to items list
    router.push("/items");
  } catch (error: any) {
    console.error("Error updating item:", error);

    // Handle specific error cases
    if (error?.data?.code === "VALIDATION_ERROR") {
      toast.add({
        title: "Validation Error",
        description: error.data.message || "Invalid item data",
        color: "error",
      });

      // Set field-specific errors if available
      if (error.data.details) {
        error.data.details.forEach((err: any) => {
          const field = err.path?.[0];
          if (field && field in errors) {
            errors[field as keyof typeof errors] = err.message;
          }
        });
      }
    } else if (error?.data?.code === "ITEM_NOT_FOUND") {
      toast.add({
        title: "Item Not Found",
        description: "The item you are trying to edit does not exist",
        color: "error",
      });
      router.push("/items");
    } else if (error?.data?.code === "INSUFFICIENT_PERMISSIONS") {
      toast.add({
        title: "Access Denied",
        description: "You do not have permission to update items",
        color: "error",
      });
      router.push("/items");
    } else {
      toast.add({
        title: "Error",
        description: error?.data?.message || "Failed to update item",
        color: "error",
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
  // Confirm deactivation
  const confirmed = confirm(
    `Are you sure you want to deactivate "${item.value?.name}"?\n\n` +
      "This will prevent the item from being used in new transactions, but existing records will remain."
  );

  if (!confirmed) return;

  isDeactivating.value = true;

  try {
    // Call API to deactivate item
    const response = await $fetch<{ item: any; message: string; deactivated: boolean }>(
      `/api/items/${itemId}`,
      {
        method: "DELETE",
      }
    );

    // Show success message
    toast.add({
      title: "Success",
      description: response.message || "Item deactivated successfully",
      color: "success",
    });

    // Redirect to items list
    router.push("/items");
  } catch (error: any) {
    console.error("Error deactivating item:", error);

    // Handle specific error cases
    if (error?.data?.code === "ITEM_NOT_FOUND") {
      toast.add({
        title: "Item Not Found",
        description: "The item you are trying to deactivate does not exist",
        color: "error",
      });
      router.push("/items");
    } else if (error?.data?.code === "INSUFFICIENT_PERMISSIONS") {
      toast.add({
        title: "Access Denied",
        description: "You do not have permission to deactivate items",
        color: "error",
      });
    } else {
      toast.add({
        title: "Error",
        description: error?.data?.message || "Failed to deactivate item",
        color: "error",
      });
    }
  } finally {
    isDeactivating.value = false;
  }
}

/**
 * Handle cancel action
 */
function handleCancel() {
  // Check if form has been modified
  if (hasChanges.value) {
    const confirmed = confirm("Are you sure you want to cancel? Any unsaved changes will be lost.");
    if (!confirmed) return;
  }

  router.push("/items");
}

// Fetch item data on mount
onMounted(() => {
  fetchItem();
});
</script>
