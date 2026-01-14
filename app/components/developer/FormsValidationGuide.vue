<script setup lang="ts">
import type { Ref } from "vue";

// Collapsible sections state
const expandedSections = ref<string[]>([]);

const toggleSection = (section: string) => {
  if (expandedSections.value.includes(section)) {
    expandedSections.value = [];
  } else {
    expandedSections.value = [section];
  }
};

const isExpanded = (section: string) => expandedSections.value.includes(section);

// Inject the target section for deep linking
const targetSubSection = inject<Ref<string | null>>("devTargetSection", ref(null));

watch(
  targetSubSection,
  (newSection) => {
    if (newSection) {
      if (!expandedSections.value.includes(newSection)) {
        expandedSections.value.push(newSection);
      }
      nextTick(() => {
        const element = document.getElementById(`dev-section-${newSection}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (targetSubSection.value) {
          targetSubSection.value = null;
        }
      });
    }
  },
  { immediate: true }
);

// Code examples
const codeExamples = {
  formStateReactive: `// Form state with reactive()
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

const isSubmitting = ref(false);`,

  zodSchema: `import { z } from "zod";

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
  unit: z.enum(["KG", "EA", "LTR", "BOX", "CASE", "PACK"], {
    errorMap: () => ({ message: "Please select a valid unit" }),
  }),
  category: z
    .string()
    .max(50, "Category must be 50 characters or less")
    .optional(),
  sub_category: z
    .string()
    .max(50, "Sub-category must be 50 characters or less")
    .optional(),
});

// Transform patterns
const supplierSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .transform((val) => val.toUpperCase()), // Auto-uppercase
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")), // Allow empty string
});`,

  manualValidateField: `/**
 * Validate a single field on blur
 */
function validateField(field: keyof typeof form) {
  try {
    const fieldSchema = itemSchema.shape[field];
    if (fieldSchema) {
      fieldSchema.parse(form[field]);
      errors[field] = ""; // Clear error
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors[field] = error.issues[0]?.message || "Invalid value";
    }
  }
}`,

  manualValidateForm: `/**
 * Validate entire form before submission
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
}`,

  manualFormTemplate: `<form @submit.prevent="handleSubmit">
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

  <!-- Submit Button -->
  <UButton
    type="submit"
    color="primary"
    size="lg"
    class="w-full cursor-pointer"
    :loading="isSubmitting"
    :disabled="isSubmitting || !isFormValid"
  >
    {{ isSubmitting ? "Creating..." : "Create Item" }}
  </UButton>
</form>`,

  uformState: `// Form state for UForm pattern
const formData = reactive({
  code: "",
  name: "",
  contact: "",
});

// No errors object needed - UForm handles it
const submitting = ref(false);`,

  uformTemplate: `<UForm :schema="schema" :state="formData" @submit="onSubmit">
  <!-- Basic Information Section -->
  <UCard class="card-elevated mb-6" :ui="{ body: 'p-6' }">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-info" class="w-5 h-5 text-primary" />
        <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
          Supplier Information
        </h2>
      </div>
    </template>

    <!-- Supplier Code with UFormField -->
    <UFormField
      label="Supplier Code"
      name="code"
      required
      help="Unique identifier for this supplier"
    >
      <UInput
        v-model="formData.code"
        placeholder="Enter supplier code"
        icon="i-lucide-hash"
        size="lg"
        :disabled="submitting"
        class="w-full"
      />
    </UFormField>

    <!-- Supplier Name -->
    <UFormField label="Supplier Name" name="name" required>
      <UInput
        v-model="formData.name"
        placeholder="Enter supplier name"
        icon="i-lucide-building-2"
        size="lg"
        :disabled="submitting"
        class="w-full"
      />
    </UFormField>

    <!-- Contact - Multi-line text -->
    <UFormField
      label="Contact Information"
      name="contact"
      help="Optional: Contact details"
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
  </UCard>

  <!-- Submit Button -->
  <UButton
    type="submit"
    color="primary"
    icon="i-lucide-save"
    size="lg"
    class="cursor-pointer"
    :loading="submitting"
  >
    {{ submitting ? "Creating..." : "Create Supplier" }}
  </UButton>
</UForm>`,

  submitHandler: `/**
 * Handle form submission
 */
async function handleSubmit() {
  // Validate form first (manual pattern)
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
    const response = await $fetch<{ item: unknown; message: string }>(
      "/api/items",
      {
        method: "POST",
        body: data,
      }
    );

    // Show success message
    toast.success("Success", {
      description: response.message || "Item created successfully",
    });

    // Invalidate cache if using composables
    invalidateItemsCache();

    // Redirect to list
    router.push("/items");
  } catch (error: unknown) {
    console.error("Error creating item:", error);
    handleSubmitError(error);
  } finally {
    isSubmitting.value = false;
  }
}`,

  uformSubmit: `// Submit handler for UForm pattern
const onSubmit = async () => {
  submitting.value = true;

  try {
    const payload = {
      code: formData.code.toUpperCase(),
      name: formData.name,
      contact: formData.contact || undefined,
    };

    await $fetch("/api/suppliers", {
      method: "POST",
      body: payload,
    });

    // Invalidate cache before navigation
    invalidateSuppliers();

    toast.success("Success", { description: "Supplier created successfully" });
    await navigateTo("/suppliers");
  } catch (err: unknown) {
    console.error("Error creating supplier:", err);
    handleSubmitError(err);
  } finally {
    submitting.value = false;
  }
};`,

  errorHandling: `/**
 * Handle API errors during form submission
 */
function handleSubmitError(error: unknown) {
  // Type guard for error structure
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

    // Handle specific error codes
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
    // Generic error
    toast.error("Error", {
      description: "Failed to create item",
    });
  }
}`,

  errorDisplay: `<!-- Field-level error display -->
<UInput
  id="code"
  v-model="form.code"
  placeholder="e.g., RICE001"
  :error="!!errors.code"
  @blur="validateField('code')"
/>
<p v-if="errors.code" class="mt-1 text-caption text-[var(--ui-error)]">
  {{ errors.code }}
</p>
<p v-else class="mt-1 text-caption">
  Hint text goes here when no error
</p>`,

  loadingButton: `<!-- Submit button with loading state -->
<UButton
  type="submit"
  color="primary"
  size="lg"
  class="w-full cursor-pointer"
  :loading="isSubmitting"
  :disabled="isSubmitting || !isFormValid"
>
  {{ isSubmitting ? "Creating..." : "Create Item" }}
</UButton>`,

  disabledFields: `<!-- Disable all fields during submission -->
<UInput
  v-model="form.code"
  :disabled="isSubmitting"
/>

<USelectMenu
  v-model="form.unit"
  :items="unitOptions"
  :disabled="isSubmitting"
/>

<UTextarea
  v-model="form.description"
  :disabled="isSubmitting"
/>`,

  cancelConfirmation: `// Cancel confirmation state
const showCancelModal = ref(false);

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
}`,

  cancelModal: `<!-- Cancel Confirmation Modal -->
<UiConfirmModal
  v-model="showCancelModal"
  title="Discard Changes"
  message="Are you sure you want to cancel? Any unsaved changes will be lost."
  confirm-text="Discard"
  cancel-text="Keep Editing"
  variant="warning"
  @confirm="confirmCancel"
/>`,

  isFormValid: `/**
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
});`,

  selectMenuOptions: `// USelectMenu options
const unitOptions = [
  { label: "KG - Kilograms", value: "KG" },
  { label: "EA - Each", value: "EA" },
  { label: "LTR - Liters", value: "LTR" },
  { label: "BOX - Box", value: "BOX" },
  { label: "CASE - Case", value: "CASE" },
  { label: "PACK - Pack", value: "PACK" },
];

// Usage in template
<USelectMenu
  v-model="form.unit"
  :items="unitOptions"
  value-key="value"
  placeholder="Select unit"
  size="lg"
  :disabled="isSubmitting"
  :error="!!errors.unit"
  @update:model-value="validateField('unit')"
/>`,

  inputTransform: `<!-- Transform input on change -->
<UInput
  v-model="form.code"
  placeholder="e.g., RICE001"
  @input="form.code = form.code.toUpperCase()"
/>

<!-- Or use transform in Zod schema -->
const schema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .transform((val) => val.toUpperCase()),
});`,

  textareaField: `<!-- Multi-line text input -->
<UFormField
  label="Contact Information"
  name="contact"
  help="Optional: Contact details"
>
  <UTextarea
    v-model="formData.contact"
    placeholder="Enter contact details"
    :rows="4"
    :disabled="submitting"
    class="w-full"
  />
</UFormField>`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Forms & Validation</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        End-to-end guide for building forms with Nuxt UI components and Zod validation
      </p>
    </div>

    <!-- Forms Overview -->
    <section
      id="dev-section-forms-overview"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('forms-overview')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-text" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Forms Overview</span>
        </span>
        <UIcon
          :name="
            isExpanded('forms-overview') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('forms-overview')" class="space-y-4 p-4">
        <div class="space-y-3 text-[var(--ui-text)]">
          <p>
            This guide covers form handling patterns in the Stock Management System, including Nuxt
            UI form components, Zod validation, error handling, and loading states.
          </p>

          <div class="rounded-lg bg-[var(--ui-bg-elevated)] p-4">
            <h3 class="mb-2 text-sm font-semibold text-[var(--ui-text-highlighted)]">
              Two Form Patterns
            </h3>
            <ul class="ml-6 list-disc space-y-2 text-sm">
              <li>
                <strong>Manual Validation Pattern:</strong>
                Full control over validation timing, field-by-field validation, custom error
                handling. Used in items, locations pages.
              </li>
              <li>
                <strong>UForm Component Pattern:</strong>
                Simplified with automatic validation, UFormField wrappers, built-in error display.
                Used in suppliers, users pages.
              </li>
            </ul>
          </div>

          <div class="rounded-lg bg-blue-500/10 p-4">
            <h3 class="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
              Key Principles
            </h3>
            <ul class="ml-6 list-disc space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li>Use Zod schemas that match API validation</li>
              <li>Show field-level errors immediately on blur</li>
              <li>Disable submit button while form is invalid</li>
              <li>Show loading states during submission</li>
              <li>Handle API errors with user-friendly messages</li>
              <li>Confirm before discarding unsaved changes</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Nuxt UI Form Components -->
    <section
      id="dev-section-nuxt-ui-components"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('nuxt-ui-components')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-squares-2x2" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Nuxt UI Form Components
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('nuxt-ui-components') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('nuxt-ui-components')" class="space-y-4 p-4">
        <div class="space-y-3 text-[var(--ui-text)]">
          <p>
            Nuxt UI provides a comprehensive set of form components:
            <code>UInput</code>
            ,
            <code>USelectMenu</code>
            ,
            <code>UTextarea</code>
            ,
            <code>UButton</code>
            ,
            <code>UForm</code>
            , and
            <code>UFormField</code>
            .
          </p>

          <div class="rounded-lg bg-[var(--ui-bg-elevated)] p-4">
            <h3 class="mb-2 text-sm font-semibold text-[var(--ui-text-highlighted)]">
              Common Form Components
            </h3>
            <ul class="ml-6 list-disc space-y-2 text-sm">
              <li>
                <strong>UInput:</strong>
                Text input with size variants, icons, error states, disabled state
              </li>
              <li>
                <strong>USelectMenu:</strong>
                Dropdown select with options array, value-key, placeholder
              </li>
              <li>
                <strong>UTextarea:</strong>
                Multi-line text input with rows prop
              </li>
              <li>
                <strong>UButton:</strong>
                Submit button with loading, disabled states, icons
              </li>
              <li>
                <strong>UForm:</strong>
                Form wrapper with schema validation (optional)
              </li>
              <li>
                <strong>UFormField:</strong>
                Field wrapper with label, help text, error display
              </li>
            </ul>
          </div>

          <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
            USelectMenu Options
          </h3>
          <DeveloperCodeBlock
            :code="codeExamples.selectMenuOptions"
            language="typescript"
            filename="app/pages/items/create.vue"
          />

          <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
            UTextarea for Multi-line Input
          </h3>
          <DeveloperCodeBlock
            :code="codeExamples.textareaField"
            language="vue"
            filename="app/pages/suppliers/create.vue"
          />
        </div>
      </div>
    </section>

    <!-- Zod Schema Validation -->
    <section
      id="dev-section-zod-validation"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('zod-validation')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-shield-check" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Zod Schema Validation</span>
        </span>
        <UIcon
          :name="
            isExpanded('zod-validation') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('zod-validation')" class="space-y-4 p-4">
        <div>
          <h2 class="mb-3 text-xl font-semibold text-[var(--ui-text-highlighted)]">
            Zod Schema Validation
          </h2>
          <div class="space-y-3 text-[var(--ui-text)]">
            <p>
              All forms use Zod schemas for validation. Schemas should match the API validation
              rules to ensure consistency between client and server.
            </p>

            <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Zod Schema Pattern
            </h3>
            <DeveloperCodeBlock :code="codeExamples.zodSchema" language="typescript" />

            <div class="rounded-lg bg-yellow-500/10 p-4">
              <h3 class="mb-2 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                Schema Best Practices
              </h3>
              <ul class="ml-6 list-disc space-y-1 text-sm text-[var(--ui-text-muted)]">
                <li>Define schemas at the top of the component, before functions</li>
                <li>Match API validation rules exactly (min, max, enum values)</li>
                <li>Provide clear, user-friendly error messages</li>
                <li>Use optional() for non-required fields</li>
                <li>Use transform() for automatic data normalization (e.g., uppercase)</li>
                <li>Use enum() for constrained values with custom error messages</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Manual Validation Pattern -->
    <section
      id="dev-section-manual-validation"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('manual-validation')"
      >
        <span class="flex items-center gap-3">
          <UIcon
            name="i-heroicons-adjustments-horizontal"
            class="text-xl text-[var(--ui-primary)]"
          />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Manual Validation Pattern
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('manual-validation') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('manual-validation')" class="space-y-4 p-4">
        <div>
          <h2 class="mb-3 text-xl font-semibold text-[var(--ui-text-highlighted)]">
            Manual Validation Pattern
          </h2>
          <div class="space-y-3 text-[var(--ui-text)]">
            <p>
              The manual validation pattern gives full control over when and how validation occurs.
              Used for complex forms with field-level validation on blur.
            </p>

            <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Form State Setup
            </h3>
            <DeveloperCodeBlock :code="codeExamples.formStateReactive" language="typescript" />

            <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Validate Single Field
            </h3>
            <DeveloperCodeBlock
              :code="codeExamples.manualValidateField"
              language="typescript"
              filename="app/pages/items/create.vue"
            />

            <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Validate Entire Form
            </h3>
            <DeveloperCodeBlock
              :code="codeExamples.manualValidateForm"
              language="typescript"
              filename="app/pages/items/create.vue"
            />

            <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Template with Manual Validation
            </h3>
            <DeveloperCodeBlock
              :code="codeExamples.manualFormTemplate"
              language="vue"
              filename="app/pages/items/create.vue"
            />

            <div class="rounded-lg bg-[var(--ui-bg-elevated)] p-4">
              <h3 class="mb-2 text-sm font-semibold text-[var(--ui-text-highlighted)]">
                When to Use Manual Pattern
              </h3>
              <ul class="ml-6 list-disc space-y-1 text-sm">
                <li>Need field-by-field validation on blur</li>
                <li>Want to show errors only after user interaction</li>
                <li>Complex validation logic with multiple conditions</li>
                <li>Custom error message formatting</li>
                <li>Need fine-grained control over validation timing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- UForm Component Pattern -->
    <section
      id="dev-section-uform-pattern"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('uform-pattern')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-rectangle-group" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            UForm Component Pattern
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('uform-pattern') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('uform-pattern')" class="space-y-4 p-4">
        <div>
          <h2 class="mb-3 text-xl font-semibold text-[var(--ui-text-highlighted)]">
            UForm Component Pattern
          </h2>
          <div class="space-y-3 text-[var(--ui-text)]">
            <p>
              The UForm pattern simplifies form handling with automatic validation, built-in error
              display, and UFormField wrappers. Recommended for simpler forms.
            </p>

            <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Form State for UForm
            </h3>
            <DeveloperCodeBlock :code="codeExamples.uformState" language="typescript" />

            <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              UForm Template
            </h3>
            <DeveloperCodeBlock
              :code="codeExamples.uformTemplate"
              language="vue"
              filename="app/pages/suppliers/create.vue"
            />

            <div class="rounded-lg bg-[var(--ui-bg-elevated)] p-4">
              <h3 class="mb-2 text-sm font-semibold text-[var(--ui-text-highlighted)]">
                UForm Benefits
              </h3>
              <ul class="ml-6 list-disc space-y-1 text-sm">
                <li>No manual errors object needed</li>
                <li>Automatic validation on submit</li>
                <li>Built-in error display with UFormField</li>
                <li>Less boilerplate code</li>
                <li>Consistent error styling</li>
              </ul>
            </div>

            <div class="rounded-lg bg-blue-500/10 p-4">
              <h3 class="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                When to Use UForm
              </h3>
              <ul class="ml-6 list-disc space-y-1 text-sm text-[var(--ui-text-muted)]">
                <li>Simpler forms with fewer fields</li>
                <li>Don't need field-level validation on blur</li>
                <li>Want less boilerplate</li>
                <li>Standard validation behavior is sufficient</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Form Submission Patterns -->
    <section
      id="dev-section-form-submission"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('form-submission')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-paper-airplane" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Form Submission Patterns
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('form-submission') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('form-submission')" class="space-y-4 p-4">
        <div>
          <h2 class="mb-3 text-xl font-semibold text-[var(--ui-text-highlighted)]">
            Form Submission Patterns
          </h2>
          <div class="space-y-3 text-[var(--ui-text)]">
            <p>
              Form submission involves validation, API calls, error handling, cache invalidation,
              and navigation. Both patterns follow similar submission flows.
            </p>

            <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Manual Pattern Submit Handler
            </h3>
            <DeveloperCodeBlock
              :code="codeExamples.submitHandler"
              language="typescript"
              filename="app/pages/items/create.vue"
            />

            <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              UForm Pattern Submit Handler
            </h3>
            <DeveloperCodeBlock
              :code="codeExamples.uformSubmit"
              language="typescript"
              filename="app/pages/suppliers/create.vue"
            />

            <div class="rounded-lg bg-[var(--ui-bg-elevated)] p-4">
              <h3 class="mb-2 text-sm font-semibold text-[var(--ui-text-highlighted)]">
                Submission Checklist
              </h3>
              <ol class="ml-6 list-decimal space-y-1 text-sm">
                <li>Validate form (manual pattern only, UForm auto-validates)</li>
                <li>Set isSubmitting / submitting to true</li>
                <li>Prepare data (transform, remove empty optionals)</li>
                <li>Call API with $fetch</li>
                <li>Invalidate cache with useCache() helpers</li>
                <li>Show success toast</li>
                <li>Navigate to list page</li>
                <li>Handle errors in catch block</li>
                <li>Set isSubmitting / submitting to false in finally</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Error Display Patterns -->
    <section
      id="dev-section-error-display"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('error-display')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-exclamation-triangle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Error Display Patterns
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('error-display') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('error-display')" class="space-y-4 p-4">
        <div>
          <h2 class="mb-3 text-xl font-semibold text-[var(--ui-text-highlighted)]">
            Error Display Patterns
          </h2>
          <div class="space-y-3 text-[var(--ui-text)]">
            <p>
              Display errors at the field level, handle API errors with user-friendly messages, and
              map server validation errors to form fields.
            </p>

            <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Field-Level Error Display
            </h3>
            <DeveloperCodeBlock :code="codeExamples.errorDisplay" language="vue" />

            <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              API Error Handling
            </h3>
            <DeveloperCodeBlock
              :code="codeExamples.errorHandling"
              language="typescript"
              filename="app/pages/items/create.vue"
            />

            <div class="rounded-lg bg-red-500/10 p-4">
              <h3 class="mb-2 text-sm font-semibold text-red-600 dark:text-red-400">
                Error Handling Rules
              </h3>
              <ul class="ml-6 list-disc space-y-1 text-sm text-[var(--ui-text-muted)]">
                <li>Show validation errors at field level immediately (red border + error text)</li>
                <li>Show API errors with toast notifications for user awareness</li>
                <li>Map server VALIDATION_ERROR details to form fields</li>
                <li>Handle specific error codes: DUPLICATE_CODE, INSUFFICIENT_PERMISSIONS, etc.</li>
                <li>Always have a fallback generic error message</li>
                <li>Use type guards for error structure to avoid runtime errors</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Loading States -->
    <section
      id="dev-section-loading-states"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('loading-states')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-path" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Loading States</span>
        </span>
        <UIcon
          :name="
            isExpanded('loading-states') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('loading-states')" class="space-y-4 p-4">
        <div>
          <h2 class="mb-3 text-xl font-semibold text-[var(--ui-text-highlighted)]">
            Loading States
          </h2>
          <div class="space-y-3 text-[var(--ui-text)]">
            <p>
              Show loading states during form submission by disabling fields and buttons, and
              displaying loading indicators.
            </p>

            <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Submit Button with Loading
            </h3>
            <DeveloperCodeBlock :code="codeExamples.loadingButton" language="vue" />

            <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Disable All Fields During Submission
            </h3>
            <DeveloperCodeBlock :code="codeExamples.disabledFields" language="vue" />

            <div class="rounded-lg bg-[var(--ui-bg-elevated)] p-4">
              <h3 class="mb-2 text-sm font-semibold text-[var(--ui-text-highlighted)]">
                Loading State Best Practices
              </h3>
              <ul class="ml-6 list-disc space-y-1 text-sm">
                <li>
                  Use
                  <code>:loading</code>
                  prop on submit button for spinner
                </li>
                <li>Change button text during submission ("Creating..." vs "Create Item")</li>
                <li>Disable submit button AND all form fields during submission</li>
                <li>
                  Disable submit button when form is invalid with
                  <code>:disabled="!isFormValid"</code>
                </li>
                <li>Use finally block to ensure loading state is always reset</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Cancel Confirmation -->
    <section
      id="dev-section-cancel-confirmation"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('cancel-confirmation')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-x-circle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Cancel Confirmation</span>
        </span>
        <UIcon
          :name="
            isExpanded('cancel-confirmation')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('cancel-confirmation')" class="space-y-4 p-4">
        <div>
          <h2 class="mb-3 text-xl font-semibold text-[var(--ui-text-highlighted)]">
            Cancel Confirmation
          </h2>
          <div class="space-y-3 text-[var(--ui-text)]">
            <p>
              Always confirm before discarding unsaved changes. Check if form has been modified
              before navigating away.
            </p>

            <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Cancel Logic
            </h3>
            <DeveloperCodeBlock
              :code="codeExamples.cancelConfirmation"
              language="typescript"
              filename="app/pages/items/create.vue"
            />

            <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Cancel Confirmation Modal
            </h3>
            <DeveloperCodeBlock
              :code="codeExamples.cancelModal"
              language="vue"
              filename="app/pages/items/create.vue"
            />

            <div class="rounded-lg bg-yellow-500/10 p-4">
              <h3 class="mb-2 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                Cancel Confirmation Rules
              </h3>
              <ul class="ml-6 list-disc space-y-1 text-sm text-[var(--ui-text-muted)]">
                <li>Always check if form has changes before navigating away</li>
                <li>Show confirmation modal if any field has data</li>
                <li>Use UiConfirmModal with variant="warning" for discard action</li>
                <li>Provide clear action labels: "Discard" vs "Keep Editing"</li>
                <li>Navigate immediately if form is pristine (no changes)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Form State Management -->
    <section
      id="dev-section-form-state-management"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('form-state-management')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-variable" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Form State Management</span>
        </span>
        <UIcon
          :name="
            isExpanded('form-state-management')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('form-state-management')" class="space-y-4 p-4">
        <div>
          <h2 class="mb-3 text-xl font-semibold text-[var(--ui-text-highlighted)]">
            Form State Management
          </h2>
          <div class="space-y-3 text-[var(--ui-text)]">
            <p>
              Manage form state with reactive objects, computed validation, and submission flags.
            </p>

            <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Form Valid Computed
            </h3>
            <DeveloperCodeBlock :code="codeExamples.isFormValid" language="typescript" />

            <div class="rounded-lg bg-[var(--ui-bg-elevated)] p-4">
              <h3 class="mb-2 text-sm font-semibold text-[var(--ui-text-highlighted)]">
                State Management Tips
              </h3>
              <ul class="ml-6 list-disc space-y-1 text-sm">
                <li>
                  Use
                  <code>reactive()</code>
                  for form data and errors objects
                </li>
                <li>
                  Use
                  <code>ref()</code>
                  for boolean flags like isSubmitting
                </li>
                <li>
                  Create computed for
                  <code>isFormValid</code>
                  to enable/disable submit
                </li>
                <li>Check both field presence AND absence of errors</li>
                <li>Reset errors when form is successfully submitted</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Field-Specific Patterns -->
    <section
      id="dev-section-field-specific-patterns"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('field-specific-patterns')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-queue-list" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Field-Specific Patterns
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('field-specific-patterns')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('field-specific-patterns')" class="space-y-4 p-4">
        <div>
          <h2 class="mb-3 text-xl font-semibold text-[var(--ui-text-highlighted)]">
            Field-Specific Patterns
          </h2>
          <div class="space-y-3 text-[var(--ui-text)]">
            <p>
              Special handling for different field types: text inputs with transformations, selects
              with options, textareas for long text.
            </p>

            <h3 class="mt-4 text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Input Transformation
            </h3>
            <DeveloperCodeBlock :code="codeExamples.inputTransform" language="vue" />

            <div class="rounded-lg bg-[var(--ui-bg-elevated)] p-4">
              <h3 class="mb-2 text-sm font-semibold text-[var(--ui-text-highlighted)]">
                Common Field Patterns
              </h3>
              <ul class="ml-6 list-disc space-y-2 text-sm">
                <li>
                  <strong>Uppercase Codes:</strong>
                  Use @input to transform or Zod transform()
                </li>
                <li>
                  <strong>Required Fields:</strong>
                  Add red asterisk * next to label
                </li>
                <li>
                  <strong>Help Text:</strong>
                  Show below field when no error, hide when error present
                </li>
                <li>
                  <strong>Icons:</strong>
                  Use icon prop on UInput for visual context
                </li>
                <li>
                  <strong>Size:</strong>
                  Use size="lg" for better touch targets
                </li>
                <li>
                  <strong>Placeholder:</strong>
                  Provide example values for clarity
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Best Practices Summary -->
    <section
      id="dev-section-best-practices"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('best-practices')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-check-badge" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Best Practices Summary
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('best-practices') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('best-practices')" class="space-y-4 p-4">
        <div>
          <h2 class="mb-3 text-xl font-semibold text-[var(--ui-text-highlighted)]">
            Best Practices Summary
          </h2>
          <div class="space-y-3 text-[var(--ui-text)]">
            <div class="rounded-lg bg-green-500/10 p-4">
              <h3 class="mb-2 text-sm font-semibold text-green-600 dark:text-green-400">Do</h3>
              <ul class="ml-6 list-disc space-y-1 text-sm text-[var(--ui-text-muted)]">
                <li>Match Zod schemas to API validation rules</li>
                <li>Show field errors immediately on blur (manual pattern)</li>
                <li>Disable submit button when form is invalid</li>
                <li>Show loading states during submission</li>
                <li>Disable all fields during submission</li>
                <li>Invalidate cache after successful mutations</li>
                <li>Handle specific error codes (DUPLICATE_CODE, VALIDATION_ERROR, etc.)</li>
                <li>Confirm before discarding unsaved changes</li>
                <li>Provide clear error messages to users</li>
                <li>Use try/catch/finally for submission</li>
                <li>Add cursor-pointer class to all buttons</li>
              </ul>
            </div>

            <div class="rounded-lg bg-red-500/10 p-4">
              <h3 class="mb-2 text-sm font-semibold text-red-600 dark:text-red-400">Don't</h3>
              <ul class="ml-6 list-disc space-y-1 text-sm text-[var(--ui-text-muted)]">
                <li>Don't skip validation before API calls</li>
                <li>Don't forget to set isSubmitting to false in finally</li>
                <li>Don't allow form submission with invalid data</li>
                <li>Don't show generic errors without checking error codes</li>
                <li>Don't forget to invalidate cache after mutations</li>
                <li>Don't navigate away from dirty forms without confirmation</li>
                <li>Don't use vague error messages</li>
                <li>Don't leave fields enabled during submission</li>
                <li>Don't forget help text for complex fields</li>
              </ul>
            </div>

            <div class="rounded-lg bg-blue-500/10 p-4">
              <h3 class="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                Pattern Selection
              </h3>
              <ul class="ml-6 list-disc space-y-1 text-sm text-[var(--ui-text-muted)]">
                <li>
                  Use
                  <strong>Manual Pattern</strong>
                  for complex forms with custom logic
                </li>
                <li>
                  Use
                  <strong>UForm Pattern</strong>
                  for simpler forms with standard behavior
                </li>
                <li>Both patterns support the same Zod schemas</li>
                <li>Both patterns follow the same submission flow</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
