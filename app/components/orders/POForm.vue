<script setup lang="ts">
/**
 * POForm Component
 *
 * Form for creating and editing POs (Purchase Orders).
 * Handles header fields and integrates with POLineItemsTable for line items.
 * Supports supplier selection and shipping details.
 */

import type { Unit } from "~~/shared/types/database";

// Types
export interface POLineInput {
  id: string;
  item_id: string | null;
  item_code: string;
  item_description: string;
  unit: Unit;
  quantity: string;
  unit_price: string;
  discount_percent: string;
  vat_percent: string;
  total_before_vat: number;
  vat_amount: number;
  total_after_vat: number;
  notes: string;
}

export interface POFormData {
  prf_id: string | null | undefined;
  supplier_id: string;
  quotation_ref: string;
  ship_to_location_id: string;
  ship_to_contact: string;
  ship_to_phone: string;
  payment_terms: string;
  delivery_terms: string;
  duration_days: string;
  terms_conditions: string;
  notes: string;
  lines: POLineInput[];
}

export interface ItemOption {
  id: string;
  code: string;
  name: string;
  unit: Unit;
}

export interface SupplierOption {
  id: string;
  code: string;
  name: string;
  emails: string[];
  phone?: string | null;
}

export interface LocationOption {
  id: string;
  code: string;
  name: string;
  locationType: string;
}

export interface PRFOption {
  id: string;
  prf_no: string;
  requester: string;
  total_value: string;
  location: string;
}

// Props
interface Props {
  modelValue: POFormData;
  items: ItemOption[];
  suppliers: SupplierOption[];
  locations: LocationOption[];
  prfOptions?: PRFOption[];
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
  showPrfSelect?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  loading: false,
  showPrfSelect: true,
  prfOptions: () => [],
});

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: POFormData];
  "prf-selected": [prfId: string | null];
  "supplier-selected": [supplierId: string];
}>();

// Internal model
const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

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

// Get selected supplier
const selectedSupplier = computed(() => {
  return props.suppliers.find((s) => s.id === formData.value.supplier_id);
});

// Get selected ship-to location
const selectedShipToLocation = computed(() => {
  return props.locations.find((loc) => loc.id === formData.value.ship_to_location_id);
});

// Handle PRF selection
function handlePrfSelect() {
  emit("prf-selected", formData.value.prf_id ?? null);
}

// Handle supplier selection
function handleSupplierSelect() {
  emit("supplier-selected", formData.value.supplier_id);
}

// Add line item
function addLine() {
  formData.value.lines.push({
    id: crypto.randomUUID(),
    item_id: null,
    item_code: "",
    item_description: "",
    unit: "EA",
    quantity: "",
    unit_price: "",
    discount_percent: "0",
    vat_percent: "15",
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
</script>

<template>
  <div class="space-y-6">
    <!-- PO Header Card -->
    <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-[var(--ui-text)]">Purchase Order Details</h2>

          <!-- Supplier Indicator -->
          <div
            v-if="selectedSupplier"
            class="flex items-center gap-2 px-3 py-1.5 md:p-3 bg-[var(--ui-bg)] rounded-lg border border-[var(--ui-border)]"
          >
            <UIcon name="i-lucide-building-2" class="w-4 md:w-6 h-4 md:h-6 text-primary flex-shrink-0" />
            <div class="text-left">
              <p class="text-sm font-medium text-[var(--ui-text)]">
                {{ selectedSupplier.name }}
              </p>
              <p class="text-xs text-[var(--ui-text-muted)]">
                {{ selectedSupplier.emails.length }} email(s)
              </p>
            </div>
          </div>
        </div>
      </template>

      <!-- Source PRF and Supplier Selection -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- Source PRF (optional) -->
        <div v-if="showPrfSelect && prfOptions.length > 0">
          <label class="form-label mb-2 block">Source PRF</label>
          <USelectMenu
            :model-value="formData.prf_id ?? undefined"
            :items="[{ id: '', prf_no: 'None (Manual PO)', requester: '', total_value: '', location: '' }, ...prfOptions]"
            label-key="prf_no"
            value-key="id"
            placeholder="Select source PRF (optional)"
            searchable
            clearable
            :disabled="disabled || readonly"
            size="lg"
            class="w-full"
            @update:model-value="(val: string | undefined) => { formData.prf_id = val || null; handlePrfSelect(); }"
          >
            <template #leading>
              <UIcon name="i-lucide-file-text" class="w-5 h-5" />
            </template>
            <template #item="{ item }">
              <div v-if="item.id" class="flex flex-col">
                <span class="font-medium">{{ item.prf_no }}</span>
                <span class="text-xs text-[var(--ui-text-muted)]">
                  {{ item.requester }} • {{ item.location }} • {{ item.total_value }}
                </span>
              </div>
              <div v-else class="text-[var(--ui-text-muted)]">None (Manual PO)</div>
            </template>
          </USelectMenu>
        </div>

        <!-- Supplier -->
        <div :class="{ 'md:col-span-2': !showPrfSelect || prfOptions.length === 0 }">
          <label class="form-label mb-2 block">
            Supplier
            <span class="text-[var(--ui-error)]">*</span>
          </label>
          <USelectMenu
            v-model="formData.supplier_id"
            :items="suppliers"
            label-key="name"
            value-key="id"
            placeholder="Select supplier"
            searchable
            :disabled="disabled || readonly"
            size="lg"
            class="w-full"
            @update:model-value="handleSupplierSelect"
          >
            <template #leading>
              <UIcon name="i-lucide-building-2" class="w-5 h-5" />
            </template>
            <template #item="{ item }">
              <div class="flex flex-col">
                <span class="font-medium">{{ item.name }}</span>
                <span class="text-xs text-[var(--ui-text-muted)]">
                  {{ item.code }} • {{ item.emails.length || 0 }} email(s)
                </span>
              </div>
            </template>
          </USelectMenu>
        </div>
      </div>

      <!-- PO Details Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Quotation Reference -->
        <div>
          <label class="form-label mb-2 block">Quotation Reference</label>
          <UInput
            v-model="formData.quotation_ref"
            placeholder="Supplier quotation number"
            :disabled="disabled || readonly"
            size="lg"
            icon="i-lucide-file-badge"
            class="w-full"
          />
        </div>

        <!-- Ship-To Location -->
        <div>
          <label class="form-label mb-2 block">Ship To Location</label>
          <USelectMenu
            v-model="formData.ship_to_location_id"
            :items="locations"
            label-key="name"
            value-key="id"
            placeholder="Select delivery location"
            searchable
            clearable
            :disabled="disabled || readonly"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <UIcon
                v-if="selectedShipToLocation"
                :name="getLocationIcon(selectedShipToLocation.locationType)"
                class="w-5 h-5"
              />
              <UIcon v-else name="i-lucide-map-pin" class="w-5 h-5" />
            </template>
          </USelectMenu>
        </div>

        <!-- Contract Duration -->
        <div>
          <label class="form-label mb-2 block">Contract Duration (Days)</label>
          <UInput
            v-model="formData.duration_days"
            type="number"
            min="1"
            placeholder="e.g., 30"
            :disabled="disabled || readonly"
            size="lg"
            icon="i-lucide-calendar-days"
            class="w-full"
          />
        </div>
      </div>

      <!-- Ship-To Contact Information -->
      <div class="mt-6 pt-6 border-t border-[var(--ui-border)]">
        <h3 class="text-sm font-semibold text-[var(--ui-text-muted)] mb-4 uppercase tracking-wider">
          Shipping Contact
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Ship-To Contact Name -->
          <div>
            <label class="form-label mb-2 block">Contact Name</label>
            <UInput
              v-model="formData.ship_to_contact"
              placeholder="Contact at delivery site"
              :disabled="disabled || readonly"
              size="lg"
              icon="i-lucide-user"
              class="w-full"
            />
          </div>

          <!-- Ship-To Phone -->
          <div>
            <label class="form-label mb-2 block">Contact Phone</label>
            <UInput
              v-model="formData.ship_to_phone"
              placeholder="Phone number"
              :disabled="disabled || readonly"
              size="lg"
              icon="i-lucide-phone"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Terms Section -->
      <div class="mt-6 pt-6 border-t border-[var(--ui-border)]">
        <h3 class="text-sm font-semibold text-[var(--ui-text-muted)] mb-4 uppercase tracking-wider">
          Terms & Conditions
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Payment Terms -->
          <div>
            <label class="form-label mb-2 block">Payment Terms</label>
            <UInput
              v-model="formData.payment_terms"
              placeholder="e.g., Net 30, COD"
              :disabled="disabled || readonly"
              size="lg"
              icon="i-lucide-credit-card"
              class="w-full"
            />
          </div>

          <!-- Delivery Terms -->
          <div>
            <label class="form-label mb-2 block">Delivery Terms</label>
            <UInput
              v-model="formData.delivery_terms"
              placeholder="e.g., FOB, CIF"
              :disabled="disabled || readonly"
              size="lg"
              icon="i-lucide-truck"
              class="w-full"
            />
          </div>
        </div>

        <!-- Additional Terms -->
        <div class="mt-4">
          <label class="form-label mb-2 block">Additional Terms & Conditions</label>
          <UTextarea
            v-model="formData.terms_conditions"
            placeholder="Any special terms or conditions"
            :disabled="disabled || readonly"
            :rows="2"
            size="lg"
            class="w-full"
          />
        </div>
      </div>

      <!-- Notes Section -->
      <div class="mt-6 pt-6 border-t border-[var(--ui-border)]">
        <label class="form-label mb-2 block">Notes</label>
        <UTextarea
          v-model="formData.notes"
          placeholder="Additional notes or special instructions"
          :disabled="disabled || readonly"
          :rows="3"
          size="lg"
          class="w-full"
        />
      </div>
    </UCard>

    <!-- Line Items Card -->
    <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-list" class="w-5 h-5 text-primary" />
          <h2 class="text-lg font-semibold text-[var(--ui-text)]">Order Items</h2>
        </div>
      </template>

      <OrdersPOLineItemsTable
        :lines="formData.lines"
        :items="items"
        :disabled="disabled"
        :readonly="readonly"
        :loading="loading"
        @add-line="addLine"
        @remove-line="removeLine"
        @line-change="handleLineChange"
      />
    </UCard>
  </div>
</template>
