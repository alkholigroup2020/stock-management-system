<template>
  <div class="px-3 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <!-- Title with icon matching the index page style -->
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-map-pin" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Create Location</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Add a new location to your inventory system
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
            <!-- Location Code -->
            <UFormField
              label="Location Code"
              name="code"
              required
              help="Unique identifier for this location (e.g., MAIN-KIT, WH-01)"
            >
              <UInput
                v-model="formData.code"
                placeholder="Enter location code"
                icon="i-lucide-hash"
                size="lg"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <!-- Location Name -->
            <UFormField label="Location Name" name="name" required>
              <UInput
                v-model="formData.name"
                placeholder="Enter location name (e.g., Main Kitchen)"
                icon="i-lucide-map-pin"
                size="lg"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <!-- Location Type -->
            <UFormField label="Location Type" name="type" required class="lg:col-span-2">
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

          <!-- Single column layout with field at 50% width on large screens -->
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
          >
            {{ submitting ? "Creating..." : "Create Location" }}
          </UButton>
        </div>
      </UForm>
    </div>
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

// Form data
const formData = reactive({
  code: "",
  name: "",
  type: undefined as "KITCHEN" | "STORE" | "CENTRAL" | "WAREHOUSE" | undefined,
  description: "",
  address: "",
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
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  address: z.string().max(500, "Address must be at most 500 characters").optional(),
  timezone: z.string().max(50).default("Asia/Riyadh"),
});

// Type options
const typeOptions = [
  { label: "Kitchen", value: "KITCHEN" },
  { label: "Store", value: "STORE" },
  { label: "Central", value: "CENTRAL" },
  { label: "Warehouse", value: "WAREHOUSE" },
];

// Timezone options
const timezoneOptions = [
  // Middle East & Gulf
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

// Submit handler
const onSubmit = async () => {
  submitting.value = true;

  try {
    const payload = {
      code: formData.code.toUpperCase(),
      name: formData.name,
      type: formData.type,
      description: formData.description || undefined,
      address: formData.address || undefined,
      timezone: formData.timezone,
    };

    await $fetch("/api/locations", {
      method: "POST",
      body: payload,
    });

    toast.success("Success", { description: "Location created successfully" });
    await navigateTo("/locations");
  } catch (err: unknown) {
    console.error("Error creating location:", err);
    const message =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to create location";
    toast.error("Error", { description: message });
  } finally {
    submitting.value = false;
  }
};

// Handle cancel
const handleCancel = () => {
  const hasData =
    formData.code ||
    formData.name ||
    formData.type ||
    formData.description ||
    formData.address ||
    formData.timezone !== "Asia/Riyadh";

  if (hasData) {
    const confirmed = confirm("You have unsaved changes. Are you sure you want to leave?");
    if (!confirmed) return;
  }
  navigateTo("/locations");
};

// Set page title
useHead({
  title: "Create Location - Stock Management System",
});
</script>
