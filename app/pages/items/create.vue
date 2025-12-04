<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <!-- Mobile: smaller icon and title -->
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-package-2" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Create New Item</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Add a new inventory item to the system
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
        <!-- Responsive Grid: 1 column on mobile, 2 columns on large screens -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Item Code -->
          <div>
            <label for="code" class="form-label">
              Item Code
              <span class="text-[var(--ui-error)]">*</span>
            </label>
            <UInput
              id="code"
              v-model="form.code"
              placeholder="e.g., RICE001"
              size="lg"
              class="w-full"
              :disabled="isSubmitting"
              :error="!!errors.code"
              @blur="validateField('code')"
              @input="form.code = form.code.toUpperCase()"
            />
            <p v-if="errors.code" class="mt-1 text-caption text-[var(--ui-error)]">
              {{ errors.code }}
            </p>
            <p v-else class="mt-1 text-caption">
              Unique identifier for the item (automatically converted to uppercase)
            </p>
          </div>

          <!-- Item Name -->
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

          <!-- Unit of Measure -->
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

          <!-- Category -->
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

          <!-- Sub-Category -->
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
            :disabled="isSubmitting"
            @click="handleCancel"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            color="primary"
            size="lg"
            class="w-full sm:w-auto cursor-pointer"
            :loading="isSubmitting"
            :disabled="isSubmitting || !isFormValid"
          >
            {{ isSubmitting ? "Creating..." : "Create Item" }}
          </UButton>
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
const toast = useAppToast();
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
  category: z.string().max(50, "Category must be 50 characters or less").optional(),
  sub_category: z.string().max(50, "Sub-category must be 50 characters or less").optional(),
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
    toast.error("Validation Error", {
      description: "Please fix the errors in the form",
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
    const response = await $fetch<{ item: unknown; message: string }>("/api/items", {
      method: "POST",
      body: data,
    });

    // Show success message
    toast.success("Success", {
      description: response.message || "Item created successfully",
    });

    // Redirect to items list
    router.push("/items");
  } catch (error: unknown) {
    console.error("Error creating item:", error);

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

      if (errorData.code === "DUPLICATE_CODE") {
        errors.code = errorData.message || "Item code already exists";
        toast.error("Duplicate Code", {
          description: errors.code,
        });
      } else if (errorData.code === "VALIDATION_ERROR") {
        toast.error("Validation Error", {
          description: errorData.message || "Invalid item data",
        });

        // Set field-specific errors if available
        if (errorData.details) {
          errorData.details.forEach((err) => {
            const field = err.path?.[0] as keyof typeof errors;
            if (field && field in errors) {
              errors[field] = err.message;
            }
          });
        }
      } else if (errorData.code === "INSUFFICIENT_PERMISSIONS") {
        toast.error("Access Denied", {
          description: "You do not have permission to create items",
        });
        router.push("/items");
      } else {
        toast.error("Error", {
          description: errorData.message || "Failed to create item",
        });
      }
    } else {
      toast.error("Error", {
        description: "Failed to create item",
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

// Set page title
useHead({
  title: "Create Item - Stock Management System",
});
</script>
