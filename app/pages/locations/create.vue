<template>
  <div>
    <!-- Page Header -->
    <PageHeader title="Create Location" icon="i-lucide-plus">
      <template #actions>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          @click="navigateTo('/locations')"
        >
          Back to Locations
        </UButton>
      </template>
    </PageHeader>

    <!-- Form Card -->
    <UCard class="max-w-3xl">
      <UForm :schema="schema" :state="(formData as any)" @submit="onSubmit">
        <div class="space-y-6">
          <!-- Code -->
          <UFormGroup
            label="Location Code"
            name="code"
            required
            help="Unique code for this location (e.g., MAIN-KIT, WH-01)"
          >
            <UInput
              v-model="formData.code"
              placeholder="Enter location code"
              icon="i-lucide-hash"
              :disabled="submitting"
            />
          </UFormGroup>

          <!-- Name -->
          <UFormGroup label="Location Name" name="name" required>
            <UInput
              v-model="formData.name"
              placeholder="Enter location name"
              icon="i-lucide-map-pin"
              :disabled="submitting"
            />
          </UFormGroup>

          <!-- Type -->
          <UFormGroup label="Location Type" name="type" required>
            <USelectMenu
              v-model="formData.type"
              :options="typeOptions"
              placeholder="Select location type"
              :disabled="submitting"
            />
          </UFormGroup>

          <!-- Address -->
          <UFormGroup
            label="Address"
            name="address"
            help="Physical address of the location (optional)"
          >
            <UTextarea
              v-model="formData.address"
              placeholder="Enter address"
              :rows="3"
              :disabled="submitting"
            />
          </UFormGroup>

          <!-- Manager -->
          <UFormGroup
            label="Manager"
            name="manager_id"
            help="Assign a manager to this location (optional)"
          >
            <USelectMenu
              v-model="formData.manager_id"
              :options="managerOptions"
              placeholder="Select manager"
              :loading="loadingManagers"
              :disabled="submitting || loadingManagers"
            />
          </UFormGroup>

          <!-- Timezone -->
          <UFormGroup
            label="Timezone"
            name="timezone"
            help="Timezone for this location"
          >
            <UInput
              v-model="formData.timezone"
              placeholder="Asia/Riyadh"
              icon="i-lucide-clock"
              :disabled="submitting"
            />
          </UFormGroup>

          <!-- Submit Buttons -->
          <div
            class="flex items-center justify-end gap-3 pt-4 border-t border-default"
          >
            <UButton
              color="neutral"
              variant="ghost"
              @click="navigateTo('/locations')"
              :disabled="submitting"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              color="primary"
              icon="i-lucide-save"
              :loading="submitting"
            >
              Create Location
            </UButton>
          </div>
        </div>
      </UForm>
    </UCard>
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

// State
const submitting = ref(false);
const loadingManagers = ref(false);
const managerOptions = ref<any[]>([{ label: "No Manager", value: null }]);

// Form data
const formData = reactive({
  code: "",
  name: "",
  type: undefined as string | undefined,
  address: "",
  manager_id: undefined as string | undefined,
  timezone: "Asia/Riyadh",
});

// Validation schema
const schema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(10, "Code must be at most 10 characters"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  type: z
    .enum(["KITCHEN", "STORE", "CENTRAL", "WAREHOUSE"])
    .describe("Location type is required"),
  address: z.string().optional(),
  manager_id: z.string().uuid().optional().nullable(),
  timezone: z.string().max(50).default("Asia/Riyadh"),
});

// Type options
const typeOptions = [
  { label: "Kitchen", value: "KITCHEN" },
  { label: "Store", value: "STORE" },
  { label: "Central", value: "CENTRAL" },
  { label: "Warehouse", value: "WAREHOUSE" },
];

// Fetch managers (active users for dropdown)
const fetchManagers = async () => {
  loadingManagers.value = true;

  try {
    const response = await $fetch<{ users: any[] }>("/api/users", {
      query: { is_active: true },
    });

    const users = response.users || [];
    managerOptions.value = [
      { label: "No Manager", value: null },
      ...users.map((user: any) => ({
        label: user.full_name || user.username,
        value: user.id,
      })),
    ];
  } catch (err: any) {
    console.error("Error fetching managers:", err);
    toast.warning("Warning", { description: "Could not load manager list" });
  } finally {
    loadingManagers.value = false;
  }
};

// Submit handler
const onSubmit = async () => {
  submitting.value = true;

  try {
    const payload = {
      code: formData.code.toUpperCase(),
      name: formData.name,
      type: formData.type,
      address: formData.address || undefined,
      manager_id: formData.manager_id || undefined,
      timezone: formData.timezone,
    };

    await $fetch("/api/locations", {
      method: "POST",
      body: payload,
    });

    toast.success("Success", { description: "Location created successfully" });
    navigateTo("/locations");
  } catch (err: any) {
    console.error("Error creating location:", err);
    const message = err.data?.message || "Failed to create location";
    toast.error("Error", { description: message });
  } finally {
    submitting.value = false;
  }
};

// Lifecycle
onMounted(() => {
  fetchManagers();
});

// Set page title
useHead({
  title: "Create Location - Stock Management System",
});
</script>
