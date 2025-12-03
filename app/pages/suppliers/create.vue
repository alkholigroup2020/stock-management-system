<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <!-- Title with icon matching the index page style -->
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-building-2" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Create Supplier</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Add a new supplier to your system
          </p>
        </div>
      </div>
      <!-- Back button -->
      <UButton
        color="neutral"
        variant="soft"
        icon="i-lucide-arrow-left"
        size="lg"
        class="cursor-pointer rounded-full px-3 sm:px-6"
        @click="handleCancel"
      >
        <span class="hidden sm:inline">Back</span>
      </UButton>
    </div>

    <!-- Form Container -->
    <div>
      <UForm :schema="schema" :state="formData" @submit="onSubmit">
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

          <!-- Responsive Grid: 1 column on mobile, 2 columns on lg+ screens -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Supplier Code -->
            <UFormField
              label="Supplier Code"
              name="code"
              required
              help="Unique identifier for this supplier (e.g., SUP-001, FRESH-01)"
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
                placeholder="Enter supplier name (e.g., Fresh Foods Co.)"
                icon="i-lucide-building-2"
                size="lg"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <!-- Contact Information - Full width -->
            <UFormField
              label="Contact Information"
              name="contact"
              help="Optional: Contact details including name, phone, email, address"
              class="lg:col-span-2"
            >
              <UTextarea
                v-model="formData.contact"
                placeholder="Enter contact details (e.g., Contact: Ali Hassan, Phone: +966 50 123 4567, Email: ali@example.com)"
                :rows="4"
                :disabled="submitting"
                class="w-full"
              />
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
            @click="handleCancel"
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
            {{ submitting ? "Creating..." : "Create Supplier" }}
          </UButton>
        </div>
      </UForm>
    </div>

    <!-- Cancel Confirmation Modal -->
    <UModal v-model:open="isCancelModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Discard Changes?
            </h3>
          </template>

          <div class="space-y-4">
            <p class="text-[var(--ui-text)]">
              You have unsaved changes. Are you sure you want to leave? All changes will be lost.
            </p>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-[var(--ui-border)]">
              <UButton
                color="neutral"
                variant="ghost"
                class="cursor-pointer"
                @click="isCancelModalOpen = false"
              >
                Continue Editing
              </UButton>
              <UButton color="error" class="cursor-pointer" @click="confirmCancel">
                Discard Changes
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
  middleware: ["role"],
  roleRequired: "ADMIN",
  layout: "default",
});

// Composables
const toast = useAppToast();
const { invalidateSuppliers } = useCache();

// State
const submitting = ref(false);
const isCancelModalOpen = ref(false);

// Form data
const formData = reactive({
  code: "",
  name: "",
  contact: "",
});

// Validation schema
const schema = z.object({
  code: z.string().min(1, "Code is required").max(50, "Code must be at most 50 characters"),
  name: z.string().min(1, "Name is required").max(200, "Name must be at most 200 characters"),
  contact: z.string().max(1000, "Contact must be at most 1000 characters").optional(),
});

// Submit handler
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
    const message =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to create supplier";
    toast.error("Error", { description: message });
  } finally {
    submitting.value = false;
  }
};

// Handle cancel
const handleCancel = () => {
  const hasData = formData.code || formData.name || formData.contact;

  if (hasData) {
    isCancelModalOpen.value = true;
  } else {
    navigateTo("/suppliers");
  }
};

// Confirm cancel (discard changes)
const confirmCancel = () => {
  isCancelModalOpen.value = false;
  navigateTo("/suppliers");
};

// Set page title
useHead({
  title: "Create Supplier - Stock Management System",
});
</script>
