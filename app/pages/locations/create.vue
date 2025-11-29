<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <LayoutPageHeader
      title="Create Location"
      icon="i-lucide-map-pin"
      :show-location="true"
      :show-period="true"
      location-scope="all"
    >
      <template #actions>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-arrow-left"
          @click="navigateTo('/locations')"
        >
          Back to Locations
        </UButton>
      </template>
    </LayoutPageHeader>

    <!-- Form Card -->
    <UCard class="max-w-3xl">
      <UForm :schema="schema" :state="(formData as any)" @submit="onSubmit">
        <div class="space-y-6">
          <!-- Code -->
          <UFormField
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

          <!-- Timezone -->
          <UFormField
            label="Timezone"
            name="timezone"
            help="Timezone for this location"
          >
            <USelectMenu
              v-model="formData.timezone"
              :items="timezoneOptions"
              value-key="value"
              placeholder="Select timezone"
              icon="i-lucide-clock"
              :disabled="submitting"
            />
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

// Form data
const formData = reactive({
  code: "",
  name: "",
  type: undefined as string | undefined,
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
  address: z.string().optional(),
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
      address: formData.address || undefined,
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

// Set page title
useHead({
  title: "Create Location - Stock Management System",
});
</script>
