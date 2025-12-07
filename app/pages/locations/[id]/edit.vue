<template>
  <div class="px-3 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <!-- Title with icon matching the index page style -->
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-map-pin" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Edit Location</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Update location information and settings
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

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading location..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" @retry="fetchLocation" />

    <!-- Form Container -->
    <div v-else>
      <UForm :schema="schema" :state="formData" @submit="onSubmit">
        <!-- Basic Information Section -->
        <UCard class="card-elevated mb-6">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-info" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                Basic Information
              </h2>
            </div>
          </template>

          <!-- Responsive Grid: 1 column on mobile, 2 columns on lg+ screens -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Location Code (Read-only with prominent display) - Full width -->
            <div
              class="lg:col-span-2 p-4 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border-muted)]"
            >
              <label class="form-label text-xs mb-2">Location Code</label>
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-hash" class="w-5 h-5 text-[var(--ui-text-muted)]" />
                <span class="text-lg font-mono font-semibold text-[var(--ui-text)]">
                  {{ formData.code }}
                </span>
                <span
                  class="px-2 py-1 text-xs rounded-full bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)]"
                >
                  Cannot be changed
                </span>
              </div>
            </div>

            <!-- Location Name -->
            <UFormField label="Location Name" name="name" required>
              <UInput
                v-model="formData.name"
                placeholder="Enter location name (e.g., Main Kitchen, Central Warehouse)"
                icon="i-lucide-map-pin"
                size="lg"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <!-- Location Type -->
            <UFormField label="Location Type" name="type" required>
              <USelectMenu
                v-model="formData.type"
                :items="typeOptions"
                value-key="value"
                placeholder="Select location type"
                size="lg"
                :disabled="submitting"
                class="w-full"
              />
              <template #help>
                <div class="text-xs text-[var(--ui-text-muted)] mt-1">
                  Type determines the location's role in your inventory system
                </div>
              </template>
            </UFormField>
          </div>
        </UCard>

        <!-- Location Details Section -->
        <UCard class="card-elevated mb-6">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                Location Details
              </h2>
            </div>
          </template>

          <!-- Responsive Grid: 1 column on mobile, 2 columns on lg+ screens -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Description - Full width -->
            <UFormField
              label="Description"
              name="description"
              help="Optional: Provide additional details about this location"
              class="lg:col-span-2"
            >
              <UTextarea
                v-model="formData.description"
                placeholder="Enter a brief description of this location..."
                :rows="3"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <!-- Address - Full width -->
            <UFormField
              label="Physical Address"
              name="address"
              help="Optional: Physical address of the location"
              class="lg:col-span-2"
            >
              <UTextarea
                v-model="formData.address"
                placeholder="Enter the street address, city, and postal code..."
                :rows="3"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- Settings Section -->
        <UCard class="card-elevated mb-6">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-settings" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">Settings</h2>
            </div>
          </template>

          <!-- Single column layout with fields at 50% width on large screens -->
          <div class="space-y-6">
            <!-- Timezone -->
            <UFormField label="Timezone" name="timezone" class="w-full lg:w-1/2">
              <USelectMenu
                v-model="formData.timezone"
                :items="timezoneOptions"
                value-key="value"
                placeholder="Select timezone"
                size="lg"
                :disabled="submitting"
                searchable
                class="w-full"
              >
                <template #leading>
                  <UIcon name="i-lucide-clock" class="w-4 h-4" />
                </template>
              </USelectMenu>
              <template #help>
                <div class="text-xs text-[var(--ui-text-muted)] mt-1">
                  Timezone used for timestamps and reporting at this location
                </div>
              </template>
            </UFormField>

            <!-- Active Status Toggle -->
            <div
              class="p-4 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border)] w-full lg:w-1/2"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <UIcon
                      :name="formData.is_active ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
                      :class="[
                        'w-5 h-5',
                        formData.is_active ? 'text-success' : 'text-[var(--ui-text-muted)]',
                      ]"
                    />
                    <label class="font-semibold text-[var(--ui-text)]">Location Status</label>
                  </div>
                  <p class="text-sm text-[var(--ui-text-muted)] ml-7">
                    {{
                      formData.is_active
                        ? "This location is currently active and visible in the system"
                        : "This location is inactive and hidden from most views"
                    }}
                  </p>
                </div>
                <UToggle
                  v-model="formData.is_active"
                  :disabled="submitting"
                  size="lg"
                  class="cursor-pointer"
                />
              </div>
            </div>
          </div>
        </UCard>

        <!-- Action Buttons -->
        <div
          class="flex flex-col sm:flex-row items-center justify-end gap-3 p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]"
        >
          <UButton
            color="neutral"
            variant="soft"
            size="lg"
            class="cursor-pointer w-full sm:w-auto"
            @click="handleCancel"
            :disabled="submitting"
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
            :disabled="!hasChanges"
          >
            {{ submitting ? "Updating..." : "Update Location" }}
          </UButton>
        </div>
      </UForm>
    </div>

    <!-- Discard Changes Confirmation Modal -->
    <UModal
      v-model:open="isDiscardModalOpen"
      :dismissible="true"
      title="Discard Changes?"
      description="Confirm you want to discard unsaved changes"
    >
      <template #content>
        <UCard :ui="{ body: 'p-6' }">
          <template #header>
            <h3 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Discard Changes?
            </h3>
          </template>

          <div class="space-y-4">
            <p class="text-[var(--ui-text)]">
              You have unsaved changes. Are you sure you want to leave this page?
            </p>
            <p class="text-caption text-[var(--ui-text-muted)]">
              Your changes will be lost if you don't save them.
            </p>

            <!-- Actions -->
            <div
              class="flex items-center justify-end gap-3 pt-4 border-t border-[var(--ui-border)]"
            >
              <UButton
                color="neutral"
                variant="soft"
                class="cursor-pointer"
                @click="isDiscardModalOpen = false"
              >
                Keep Editing
              </UButton>
              <UButton
                color="error"
                icon="i-lucide-trash-2"
                class="cursor-pointer"
                @click="confirmDiscard"
              >
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
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  type: z.enum(["KITCHEN", "STORE", "CENTRAL", "WAREHOUSE"]).describe("Location type is required"),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  address: z.string().max(500, "Address must be at most 500 characters").optional(),
  timezone: z.string().max(50),
  is_active: z.boolean(),
});

interface FormDataType {
  name: string;
  type: LocationType;
  description?: string;
  address?: string;
  timezone: string;
  is_active: boolean;
}

// State
const loading = ref(true);
const error = ref<string | null>(null);
const submitting = ref(false);
const isDiscardModalOpen = ref(false);

// Original data for change detection
const originalData = ref<FormDataType | null>(null);

// Form data - properly typed
const formData = reactive<{
  code: string;
  name: string;
  type: LocationType | undefined;
  description: string;
  address: string;
  timezone: string;
  is_active: boolean;
}>({
  code: "",
  name: "",
  type: undefined,
  description: "",
  address: "",
  timezone: "Asia/Riyadh",
  is_active: true,
});

// Type options with icons
const typeOptions: Array<{ label: string; value: LocationType; icon: string }> = [
  { label: "Kitchen", value: "KITCHEN", icon: "i-lucide-chef-hat" },
  { label: "Store", value: "STORE", icon: "i-lucide-store" },
  { label: "Central", value: "CENTRAL", icon: "i-lucide-building" },
  { label: "Warehouse", value: "WAREHOUSE", icon: "i-lucide-warehouse" },
];

// Helper functions for type display
const getTypeLabel = (type: LocationType | undefined) => {
  return typeOptions.find((opt) => opt.value === type)?.label || type;
};

const getTypeIcon = (type: LocationType | undefined) => {
  return typeOptions.find((opt) => opt.value === type)?.icon || "i-lucide-map-pin";
};

// Timezone options
const timezoneOptions = [
  // Middle East & Gulf (Priority)
  { label: "Asia/Riyadh (Saudi Arabia)", value: "Asia/Riyadh" },
  { label: "Asia/Dubai (UAE)", value: "Asia/Dubai" },
  { label: "Asia/Kuwait (Kuwait)", value: "Asia/Kuwait" },
  { label: "Asia/Bahrain (Bahrain)", value: "Asia/Bahrain" },
  { label: "Asia/Qatar (Qatar)", value: "Asia/Qatar" },
  { label: "Asia/Muscat (Oman)", value: "Asia/Muscat" },
  { label: "Asia/Baghdad (Iraq)", value: "Asia/Baghdad" },
  { label: "Asia/Tehran (Iran)", value: "Asia/Tehran" },
  { label: "Asia/Jerusalem (Israel)", value: "Asia/Jerusalem" },
  { label: "Asia/Beirut (Lebanon)", value: "Asia/Beirut" },
  { label: "Asia/Damascus (Syria)", value: "Asia/Damascus" },
  { label: "Asia/Amman (Jordan)", value: "Asia/Amman" },

  // Asia
  { label: "Asia/Singapore (Singapore)", value: "Asia/Singapore" },
  { label: "Asia/Hong_Kong (Hong Kong)", value: "Asia/Hong_Kong" },
  { label: "Asia/Shanghai (China)", value: "Asia/Shanghai" },
  { label: "Asia/Tokyo (Japan)", value: "Asia/Tokyo" },
  { label: "Asia/Seoul (South Korea)", value: "Asia/Seoul" },
  { label: "Asia/Bangkok (Thailand)", value: "Asia/Bangkok" },
  { label: "Asia/Jakarta (Indonesia)", value: "Asia/Jakarta" },
  { label: "Asia/Manila (Philippines)", value: "Asia/Manila" },
  { label: "Asia/Kolkata (India)", value: "Asia/Kolkata" },
  { label: "Asia/Karachi (Pakistan)", value: "Asia/Karachi" },

  // Europe
  { label: "Europe/London (UK)", value: "Europe/London" },
  { label: "Europe/Paris (France)", value: "Europe/Paris" },
  { label: "Europe/Berlin (Germany)", value: "Europe/Berlin" },
  { label: "Europe/Rome (Italy)", value: "Europe/Rome" },
  { label: "Europe/Madrid (Spain)", value: "Europe/Madrid" },
  { label: "Europe/Amsterdam (Netherlands)", value: "Europe/Amsterdam" },
  { label: "Europe/Brussels (Belgium)", value: "Europe/Brussels" },
  { label: "Europe/Zurich (Switzerland)", value: "Europe/Zurich" },
  { label: "Europe/Vienna (Austria)", value: "Europe/Vienna" },
  { label: "Europe/Stockholm (Sweden)", value: "Europe/Stockholm" },
  { label: "Europe/Moscow (Russia)", value: "Europe/Moscow" },
  { label: "Europe/Istanbul (Turkey)", value: "Europe/Istanbul" },

  // Americas
  { label: "America/New_York (US Eastern)", value: "America/New_York" },
  { label: "America/Chicago (US Central)", value: "America/Chicago" },
  { label: "America/Denver (US Mountain)", value: "America/Denver" },
  { label: "America/Los_Angeles (US Pacific)", value: "America/Los_Angeles" },
  { label: "America/Toronto (Canada Eastern)", value: "America/Toronto" },
  { label: "America/Vancouver (Canada Pacific)", value: "America/Vancouver" },
  { label: "America/Mexico_City (Mexico)", value: "America/Mexico_City" },
  { label: "America/Sao_Paulo (Brazil)", value: "America/Sao_Paulo" },
  { label: "America/Buenos_Aires (Argentina)", value: "America/Buenos_Aires" },

  // Africa
  { label: "Africa/Cairo (Egypt)", value: "Africa/Cairo" },
  { label: "Africa/Johannesburg (South Africa)", value: "Africa/Johannesburg" },
  { label: "Africa/Lagos (Nigeria)", value: "Africa/Lagos" },
  { label: "Africa/Nairobi (Kenya)", value: "Africa/Nairobi" },

  // Pacific
  { label: "Australia/Sydney (Australia Eastern)", value: "Australia/Sydney" },
  { label: "Australia/Melbourne (Australia)", value: "Australia/Melbourne" },
  { label: "Australia/Perth (Australia Western)", value: "Australia/Perth" },
  { label: "Pacific/Auckland (New Zealand)", value: "Pacific/Auckland" },

  // UTC
  { label: "UTC (Coordinated Universal Time)", value: "UTC" },
];

// Check if form has changes
const hasChanges = computed(() => {
  if (!originalData.value) return false;

  return (
    formData.name !== originalData.value.name ||
    formData.type !== originalData.value.type ||
    formData.description !== (originalData.value.description || "") ||
    formData.address !== (originalData.value.address || "") ||
    formData.timezone !== originalData.value.timezone ||
    formData.is_active !== originalData.value.is_active
  );
});

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
        description: string | null;
        address: string | null;
        timezone: string | null;
        is_active: boolean;
      };
    }

    const response = await $fetch<LocationResponse>(`/api/locations/${locationId}`);
    const location = response.location;

    // Pre-fill form with existing data
    formData.code = location.code;
    formData.name = location.name;
    formData.type = location.type ?? undefined;
    formData.description = location.description ?? "";
    formData.address = location.address ?? "";
    formData.timezone = location.timezone ?? "Asia/Riyadh";
    formData.is_active = location.is_active;

    // Store original data for change detection
    originalData.value = {
      name: location.name,
      type: (location.type as LocationType) ?? "KITCHEN",
      description: location.description ?? "",
      address: location.address ?? "",
      timezone: location.timezone ?? "Asia/Riyadh",
      is_active: location.is_active,
    };
  } catch (err) {
    console.error("Error fetching location:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch location details";
    error.value = errorMessage;
    toast.error("Error", { description: errorMessage });
  } finally {
    loading.value = false;
  }
};

// Submit handler
const onSubmit = async () => {
  // Check if there are changes
  if (!hasChanges.value) {
    toast.warning("No Changes", {
      description: "No changes were made to the location",
    });
    return;
  }

  submitting.value = true;

  try {
    const locationId = route.params.id as string;

    const payload = {
      name: formData.name,
      type: formData.type,
      description: formData.description || null,
      address: formData.address || null,
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
    const errorMessage = err instanceof Error ? err.message : "Failed to update location";
    toast.error("Error", { description: errorMessage });
  } finally {
    submitting.value = false;
  }
};

// Handle cancel
const handleCancel = () => {
  if (hasChanges.value) {
    isDiscardModalOpen.value = true;
    return;
  }
  navigateTo("/locations");
};

// Confirm discard changes
const confirmDiscard = () => {
  isDiscardModalOpen.value = false;
  navigateTo("/locations");
};

// Lifecycle
onMounted(() => {
  fetchLocation();
});

// Set page title
useHead({
  title: "Edit Location - Stock Management System",
});
</script>
