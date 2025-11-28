<template>
  <div>
    <!-- Page Header -->
    <PageHeader title="Edit Location" icon="i-lucide-edit">
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

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading location..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" @retry="fetchLocation" />

    <!-- Form Card -->
    <UCard v-else class="max-w-3xl">
      <UForm :schema="schema" :state="formData" @submit="onSubmit">
        <div class="space-y-6">
          <!-- Code (Read-only) -->
          <UFormField
            label="Location Code"
            name="code"
            help="Code cannot be changed after creation"
          >
            <UInput v-model="formData.code" icon="i-lucide-hash" disabled />
          </UFormField>

          <!-- Name -->
          <UFormField label="Location Name" name="name" required>
            <UInput
              v-model="formData.name"
              placeholder="Enter location name"
              icon="i-lucide-map-pin"
              :disabled="submitting"
            />
          </UFormField>

          <!-- Type -->
          <UFormField label="Location Type" name="type" required>
            <USelectMenu
              v-model="formData.type"
              :items="typeOptions"
              value-key="value"
              placeholder="Select location type"
              :disabled="submitting"
            />
          </UFormField>

          <!-- Address -->
          <UFormField
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
          </UFormField>

          <!-- Manager -->
          <UFormField
            label="Manager"
            name="manager_id"
            help="Assign a manager to this location (optional)"
          >
            <USelectMenu
              v-model="formData.manager_id"
              :items="managerOptions"
              value-key="value"
              placeholder="Select manager"
              :loading="loadingManagers"
              :disabled="submitting || loadingManagers"
            />
          </UFormField>

          <!-- Timezone -->
          <UFormField
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
          </UFormField>

          <!-- Active Status -->
          <UFormField
            label="Status"
            name="is_active"
            help="Inactive locations are hidden from most views"
          >
            <USwitch v-model="formData.is_active" :disabled="submitting">
              <template #label>
                <span class="text-sm text-default">
                  {{ formData.is_active ? "Active" : "Inactive" }}
                </span>
              </template>
            </USwitch>
          </UFormField>

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
              Update Location
            </UButton>
          </div>
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { z } from "zod";
import type { LocationType } from "@prisma/client";

definePageMeta({
  middleware: ["role"],
  roleRequired: "ADMIN",
  layout: "default",
});

// Composables
const route = useRoute();
const toast = useAppToast();

// Validation schema
const schema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  type: z
    .enum(["KITCHEN", "STORE", "CENTRAL", "WAREHOUSE"])
    .describe("Location type is required"),
  address: z.string().optional(),
  manager_id: z.string().uuid().optional().nullable(),
  timezone: z.string().max(50),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface ManagerOption {
  label: string;
  value: string | null;
}

// State
const loading = ref(true);
const error = ref<string | null>(null);
const submitting = ref(false);
const loadingManagers = ref(false);
const managerOptions = ref<ManagerOption[]>([
  { label: "No Manager", value: null },
]);

// Form data - properly typed
const formData = reactive<{
  code: string;
  name: string;
  type: LocationType | undefined;
  address: string;
  manager_id: string | undefined;
  timezone: string;
  is_active: boolean;
}>({
  code: "",
  name: "",
  type: undefined,
  address: "",
  manager_id: undefined,
  timezone: "Asia/Riyadh",
  is_active: true,
});

// Type options
const typeOptions: Array<{ label: string; value: LocationType }> = [
  { label: "Kitchen", value: "KITCHEN" },
  { label: "Store", value: "STORE" },
  { label: "Central", value: "CENTRAL" },
  { label: "Warehouse", value: "WAREHOUSE" },
];

// Fetch location details
const fetchLocation = async () => {
  loading.value = true;
  error.value = null;

  try {
    const locationId = route.params.id as string;

    interface LocationResponse {
      location: {
        code: string;
        name: string;
        type: LocationType | null;
        address: string | null;
        manager_id: string | null;
        timezone: string | null;
        is_active: boolean;
      };
    }

    const response = await $fetch<LocationResponse>(
      `/api/locations/${locationId}`
    );
    const location = response.location;

    // Pre-fill form with existing data
    formData.code = location.code;
    formData.name = location.name;
    formData.type = location.type ?? undefined;
    formData.address = location.address ?? "";
    formData.manager_id = location.manager_id ?? undefined;
    formData.timezone = location.timezone ?? "Asia/Riyadh";
    formData.is_active = location.is_active;
  } catch (err) {
    console.error("Error fetching location:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Failed to fetch location details";
    error.value = errorMessage;
    toast.error("Error", { description: errorMessage });
  } finally {
    loading.value = false;
  }
};

// Fetch managers (active users for dropdown)
const fetchManagers = async () => {
  loadingManagers.value = true;

  try {
    // For now, just provide a no manager option
    // In a real app, you would fetch users from /api/users
    managerOptions.value = [{ label: "No Manager", value: null }];
  } catch (err) {
    console.error("Error fetching managers:", err);
  } finally {
    loadingManagers.value = false;
  }
};

// Submit handler
const onSubmit = async () => {
  submitting.value = true;

  try {
    const locationId = route.params.id as string;

    const payload = {
      name: formData.name,
      type: formData.type,
      address: formData.address || null,
      manager_id: formData.manager_id || null,
      timezone: formData.timezone,
      is_active: formData.is_active,
    };

    await $fetch(`/api/locations/${locationId}`, {
      method: "PATCH",
      body: payload,
    });

    toast.success("Success", { description: "Location updated successfully" });
    await navigateTo("/locations");
  } catch (err) {
    console.error("Error updating location:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Failed to update location";
    toast.error("Error", { description: errorMessage });
  } finally {
    submitting.value = false;
  }
};

// Lifecycle
onMounted(() => {
  fetchLocation();
  fetchManagers();
});

// Set page title
useHead({
  title: "Edit Location - Stock Management System",
});
</script>
