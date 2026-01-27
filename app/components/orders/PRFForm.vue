<script setup lang="ts">
/**
 * PRFForm Component
 *
 * Form for creating and editing PRFs (Purchase Requisition Forms).
 * Handles header fields and integrates with PRFLineItemsTable for line items.
 */

import type { PRFType, PRFCategory, Unit } from "~~/shared/types/database";

// VAT rate for Saudi Arabia
const VAT_RATE = 15;

// Types
export interface PRFLineInput {
  id: string;
  item_id: string | null;
  item_description: string;
  cost_code: string;
  unit: Unit;
  required_qty: string;
  estimated_price: string;
  line_value: number;
  vat_percent: string;
  total_before_vat: number;
  vat_amount: number;
  total_after_vat: number;
  notes: string;
}

export interface PRFFormData {
  location_id: string;
  period_id: string;
  project_name: string;
  prf_type: PRFType;
  category: PRFCategory;
  expected_delivery_date: string;
  contact_person_name: string;
  contact_person_phone: string;
  receiver_name: string;
  receiver_phone: string;
  notes: string;
  lines: PRFLineInput[];
}

export interface ItemOption {
  id: string;
  code: string;
  name: string;
  unit: Unit;
}

export interface LocationOption {
  id: string;
  code: string;
  name: string;
  locationType: string;
}

// Props
interface Props {
  modelValue: PRFFormData;
  items: ItemOption[];
  locations: LocationOption[];
  currentPeriodId: string;
  currentPeriodName: string;
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  loading: false,
});

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: PRFFormData];
}>();

// Internal model
const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// PRF Type options
const prfTypeOptions: { label: string; value: PRFType; description: string }[] = [
  { label: "Normal", value: "NORMAL", description: "Standard processing" },
  { label: "Urgent", value: "URGENT", description: "High priority, expedited" },
  { label: "DPA", value: "DPA", description: "Direct Purchase Approval" },
];

// Category options
const categoryOptions: { label: string; value: PRFCategory }[] = [
  { label: "Food", value: "FOOD" },
  { label: "Cleaning", value: "CLEANING" },
  { label: "Other", value: "OTHER" },
];

// Helper function to get location-specific icon
function getLocationIcon(locationType: string): string {
  const icons: Record<string, string> = {
    KITCHEN: "i-lucide-chef-hat",
    STORE: "i-lucide-store",
    CENTRAL: "i-lucide-warehouse",
    WAREHOUSE: "i-lucide-package-2",
  };
  return icons[locationType] || "i-lucide-map-pin";
}

// Add line item
function addLine() {
  formData.value.lines.push({
    id: crypto.randomUUID(),
    item_id: null,
    item_description: "",
    cost_code: "",
    unit: "EA",
    required_qty: "",
    estimated_price: "",
    line_value: 0,
    vat_percent: String(VAT_RATE),
    total_before_vat: 0,
    vat_amount: 0,
    total_after_vat: 0,
    notes: "",
  });
}

// Remove line item
function removeLine(id: string) {
  formData.value.lines = formData.value.lines.filter((line) => line.id !== id);
}

// Handle line change
function handleLineChange() {
  // Trigger update for parent
  emit("update:modelValue", { ...formData.value });
}

// Get selected location
const selectedLocation = computed(() => {
  return props.locations.find((loc) => loc.id === formData.value.location_id);
});
</script>

<template>
  <div class="space-y-3">
    <!-- Unified Form Card with Internal Sections -->
    <UCard class="card-elevated overflow-hidden" :ui="{ body: 'p-0' }">
      <!-- PRF Information Section -->
      <div class="p-4 sm:p-6 bg-gradient-to-br from-[var(--ui-bg)] to-[var(--ui-bg-elevated)]">
        <div class="flex items-center gap-3 mb-6">
          <div
            class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20"
          >
            <UIcon name="i-lucide-file-text" class="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-[var(--ui-text)]">PRF Information</h2>
            <p class="text-xs text-[var(--ui-text-muted)]">Basic details about this requisition</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Location (if multiple) -->
          <div v-if="locations.length > 1">
            <label class="form-label mb-2 block">
              Location
              <span class="text-[var(--ui-error)]">*</span>
            </label>
            <USelectMenu
              v-model="formData.location_id"
              :items="locations"
              label-key="name"
              value-key="id"
              placeholder="Select location"
              :disabled="disabled || readonly"
              size="lg"
              class="w-full"
            >
              <template #leading>
                <UIcon
                  v-if="selectedLocation"
                  :name="getLocationIcon(selectedLocation.locationType)"
                  class="w-5 h-5"
                />
              </template>
            </USelectMenu>
          </div>

          <!-- PRF Type -->
          <div>
            <label class="form-label mb-2 block">
              PRF Type
              <span class="text-[var(--ui-error)]">*</span>
            </label>
            <USelectMenu
              v-model="formData.prf_type"
              :items="prfTypeOptions"
              label-key="label"
              value-key="value"
              :disabled="disabled || readonly"
              size="lg"
              class="w-full"
            >
              <template #item="{ item }">
                <div class="flex flex-col">
                  <span class="font-medium">{{ item.label }}</span>
                  <span class="text-xs text-[var(--ui-text-muted)]">{{ item.description }}</span>
                </div>
              </template>
            </USelectMenu>
          </div>

          <!-- Category -->
          <div>
            <label class="form-label mb-2 block">
              Category
              <span class="text-[var(--ui-error)]">*</span>
            </label>
            <USelectMenu
              v-model="formData.category"
              :items="categoryOptions"
              label-key="label"
              value-key="value"
              :disabled="disabled || readonly"
              size="lg"
              class="w-full"
            />
          </div>

          <!-- Project Name -->
          <div>
            <label class="form-label mb-2 block">Project Name</label>
            <UInput
              v-model="formData.project_name"
              placeholder="Optional project name"
              :disabled="disabled || readonly"
              size="lg"
              icon="i-lucide-folder"
              class="w-full"
            />
          </div>

          <!-- Expected Delivery Date -->
          <div>
            <label class="form-label mb-2 block">Expected Delivery Date</label>
            <UInput
              v-model="formData.expected_delivery_date"
              type="date"
              :disabled="disabled || readonly"
              size="lg"
              icon="i-lucide-calendar"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="h-px bg-gradient-to-r from-transparent via-[var(--ui-border)] to-transparent" />

      <!-- Contact Information Section -->
      <div class="p-4 sm:p-6 bg-[var(--ui-bg)]">
        <div class="flex items-center gap-3 mb-6">
          <div
            class="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/20"
          >
            <UIcon name="i-lucide-users" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-[var(--ui-text)]">Contact Information</h3>
            <p class="text-xs text-[var(--ui-text-muted)]">Who to contact for this requisition</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Contact Person -->
          <div>
            <label class="form-label mb-2 block">Contact Person Name</label>
            <UInput
              v-model="formData.contact_person_name"
              placeholder="Person to contact for this PRF"
              :disabled="disabled || readonly"
              size="lg"
              icon="i-lucide-user"
              class="w-full"
            />
          </div>

          <!-- Contact Phone -->
          <div>
            <label class="form-label mb-2 block">Contact Phone</label>
            <UInput
              v-model="formData.contact_person_phone"
              placeholder="Phone number"
              :disabled="disabled || readonly"
              size="lg"
              icon="i-lucide-phone"
              class="w-full"
            />
          </div>

          <!-- Receiver Name -->
          <div>
            <label class="form-label mb-2 block">Receiver Name</label>
            <UInput
              v-model="formData.receiver_name"
              placeholder="Person authorized to receive delivery"
              :disabled="disabled || readonly"
              size="lg"
              icon="i-lucide-user-check"
              class="w-full"
            />
          </div>

          <!-- Receiver Phone -->
          <div>
            <label class="form-label mb-2 block">Receiver Phone</label>
            <UInput
              v-model="formData.receiver_phone"
              placeholder="Receiver phone number"
              :disabled="disabled || readonly"
              size="lg"
              icon="i-lucide-phone"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="h-px bg-gradient-to-r from-transparent via-[var(--ui-border)] to-transparent" />

      <!-- Notes Section -->
      <div class="p-4 sm:p-6 bg-[var(--ui-bg-elevated)]">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 dark:bg-amber-400/20"
          >
            <UIcon
              name="i-lucide-message-square"
              class="w-5 h-5 text-amber-600 dark:text-amber-400"
            />
          </div>
          <div>
            <h3 class="text-lg font-bold text-[var(--ui-text)]">Additional Notes</h3>
            <p class="text-xs text-[var(--ui-text-muted)]">Special instructions or requirements</p>
          </div>
        </div>

        <UTextarea
          v-model="formData.notes"
          placeholder="Add any special instructions, requirements, or notes for this requisition..."
          :disabled="disabled || readonly"
          :rows="4"
          size="lg"
          class="w-full"
        />
      </div>
    </UCard>

    <!-- Line Items Card -->
    <UCard class="card-elevated overflow-hidden" :ui="{ body: 'p-0' }">
      <!-- Header -->
      <div
        class="p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border-b border-[var(--ui-border)]"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 dark:bg-primary/30"
          >
            <UIcon name="i-lucide-shopping-cart" class="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-[var(--ui-text)]">Items Required</h2>
            <p class="text-xs text-[var(--ui-text-muted)]">Add all items you need to requisition</p>
          </div>
        </div>
      </div>

      <!-- Line Items Table -->
      <div class="p-4 sm:p-6">
        <OrdersPRFLineItemsTable
          :lines="formData.lines"
          :items="items"
          :disabled="disabled"
          :readonly="readonly"
          :loading="loading"
          @add-line="addLine"
          @remove-line="removeLine"
          @line-change="handleLineChange"
        />
      </div>
    </UCard>
  </div>
</template>
