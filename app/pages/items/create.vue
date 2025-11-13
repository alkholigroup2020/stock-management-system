<template>
  <div class="min-h-screen bg-default p-4 md:p-6">
    <!-- Page Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-arrow-left"
          @click="handleCancel"
        >
          Back
        </UButton>
      </div>
      <h1 class="text-2xl md:text-3xl font-bold text-default">
        Create New Item
      </h1>
      <p class="mt-1 text-sm text-muted">
        Add a new inventory item to the system
      </p>
    </div>

    <!-- Form Card -->
    <UCard class="max-w-2xl">
      <form @submit.prevent="handleSubmit">
        <div class="space-y-6">
          <!-- Item Code -->
          <div>
            <label for="code" class="form-label">
              Item Code
              <span class="text-error">*</span>
            </label>
            <UInput
              id="code"
              v-model="form.code"
              placeholder="e.g., RICE001"
              size="lg"
              :disabled="isSubmitting"
              :error="!!errors.code"
              @blur="validateField('code')"
              @input="form.code = form.code.toUpperCase()"
            />
            <p v-if="errors.code" class="mt-1 text-sm text-error">
              {{ errors.code }}
            </p>
            <p class="mt-1 text-xs text-muted">
              Unique identifier for the item (automatically converted to
              uppercase)
            </p>
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
              How this item is measured (KG = Kilograms, EA = Each, LTR =
              Liters, etc.)
            </p>
          </div>

          <!-- Category -->
          <div>
            <label for="category" class="form-label"> Category </label>
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
            <p class="mt-1 text-xs text-muted">
              Optional: Main category for organizing items
            </p>
          </div>

          <!-- Sub-Category -->
          <div>
            <label for="sub_category" class="form-label"> Sub-Category </label>
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
            <p class="mt-1 text-xs text-muted">
              Optional: Sub-category for further organization
            </p>
          </div>

          <!-- Form Actions -->
          <div
            class="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-default"
          >
            <UButton
              type="button"
              color="neutral"
              variant="soft"
              size="lg"
              :disabled="isSubmitting"
              @click="handleCancel"
              class="w-full sm:w-auto"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              color="primary"
              size="lg"
              :loading="isSubmitting"
              :disabled="isSubmitting || !isFormValid"
              class="w-full sm:w-auto"
            >
              {{ isSubmitting ? "Creating..." : "Create Item" }}
            </UButton>
          </div>
        </div>
      </form>
    </UCard>
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

// Check permission
if (!canEditItems()) {
  navigateTo("/");
}

// Unit options
const unitOptions = [
  { label: "KG - Kilograms", value: "KG" },
  { label: "EA - Each", value: "EA" },
  { label: "LTR - Liters", value: "LTR" },
  { label: "BOX - Box", value: "BOX" },
  { label: "CASE - Case", value: "CASE" },
  { label: "PACK - Pack", value: "PACK" },
];

// Form state
const form = reactive({
  code: "",
  name: "",
  unit: undefined as string | undefined,
  category: "",
  sub_category: "",
});

const errors = reactive({
  code: "",
  name: "",
  unit: "",
  category: "",
  sub_category: "",
});

const isSubmitting = ref(false);

// Validation schema (matches API schema)
const itemSchema = z.object({
  code: z
    .string()
    .min(1, "Item code is required")
    .max(50, "Item code must be 50 characters or less"),
  name: z
    .string()
    .min(1, "Item name is required")
    .max(200, "Item name must be 200 characters or less"),
  unit: z.enum(["KG", "EA", "LTR", "BOX", "CASE", "PACK"]).optional(),
  category: z
    .string()
    .max(50, "Category must be 50 characters or less")
    .optional(),
  sub_category: z
    .string()
    .max(50, "Sub-category must be 50 characters or less")
    .optional(),
});

/**
 * Validate a single field
 */
function validateField(field: keyof typeof form) {
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
      code: form.code,
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
    form.code &&
    form.name &&
    form.unit &&
    !errors.code &&
    !errors.name &&
    !errors.unit &&
    !errors.category &&
    !errors.sub_category
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

  isSubmitting.value = true;

  try {
    // Prepare data for API
    const data = {
      code: form.code.toUpperCase(),
      name: form.name,
      unit: form.unit,
      category: form.category || undefined,
      sub_category: form.sub_category || undefined,
    };

    // Call API to create item
    const response = await $fetch<{ item: any; message: string }>(
      "/api/items",
      {
        method: "POST",
        body: data,
      }
    );

    // Show success message
    toast.add({
      title: "Success",
      description: response.message || "Item created successfully",
      color: "success",
    });

    // Redirect to items list
    router.push("/items");
  } catch (error: any) {
    console.error("Error creating item:", error);

    // Handle specific error cases
    if (error?.data?.code === "DUPLICATE_CODE") {
      errors.code = error.data.message || "Item code already exists";
      toast.add({
        title: "Duplicate Code",
        description: errors.code,
        color: "error",
      });
    } else if (error?.data?.code === "VALIDATION_ERROR") {
      toast.add({
        title: "Validation Error",
        description: error.data.message || "Invalid item data",
        color: "error",
      });

      // Set field-specific errors if available
      if (error.data.details) {
        error.data.details.forEach((err: any) => {
          const field = err.path?.[0] as keyof typeof errors;
          if (field) {
            errors[field] = err.message;
          }
        });
      }
    } else if (error?.data?.code === "INSUFFICIENT_PERMISSIONS") {
      toast.add({
        title: "Access Denied",
        description: "You do not have permission to create items",
        color: "error",
      });
      router.push("/items");
    } else {
      toast.add({
        title: "Error",
        description: error?.data?.message || "Failed to create item",
        color: "error",
      });
    }
  } finally {
    isSubmitting.value = false;
  }
}

/**
 * Handle cancel action
 */
function handleCancel() {
  // Check if form has been modified
  const hasChanges = !!(
    form.code ||
    form.name ||
    form.unit ||
    form.category ||
    form.sub_category
  );

  if (hasChanges) {
    // Could add a confirmation modal here
    const confirmed = confirm(
      "Are you sure you want to cancel? Any unsaved changes will be lost."
    );
    if (!confirmed) return;
  }

  router.push("/items");
}
</script>
