<script setup lang="ts">
import { formatCurrency } from "~/utils/format";

// Props
interface TransferFormProps {
  locations: Array<{
    id: string;
    code: string;
    name: string;
    type: string;
  }>;
  items: Array<{
    id: string;
    code: string;
    name: string;
    unit: string;
    category?: string;
    sub_category?: string;
    location_stock?: Array<{
      on_hand: number;
      wac: number;
    }>;
  }>;
  stockLevels: Record<string, { on_hand: number; wac: number }>;
  loading?: boolean;
  submitLabel?: string;
}

const props = withDefaults(defineProps<TransferFormProps>(), {
  loading: false,
  submitLabel: "Create Transfer",
});

// Emits
const emit = defineEmits<{
  submit: [data: TransferFormData];
  cancel: [];
}>();

// Types
interface TransferLine {
  id: string;
  item_id: string;
  quantity: string;
  wac: number;
  line_value: number;
  on_hand: number;
  has_insufficient_stock: boolean;
}

interface TransferFormData {
  from_location_id: string;
  to_location_id: string;
  transfer_date: string;
  notes: string;
  lines: Array<{
    item_id: string;
    quantity: number;
  }>;
}

// Composables
const authStore = useAuthStore();

// Form state
const formData = ref({
  from_location_id: authStore.user?.default_location_id || "",
  to_location_id: "",
  transfer_date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
  notes: "",
});

// Transfer lines state
const lines = ref<TransferLine[]>([]);

// Computed
const totalValue = computed(() => {
  return lines.value.reduce((sum, line) => sum + line.line_value, 0);
});

const hasInsufficientStock = computed(() => {
  return lines.value.some((line) => line.has_insufficient_stock);
});

const insufficientStockCount = computed(() => {
  return lines.value.filter((line) => line.has_insufficient_stock).length;
});

const isFormValid = computed(() => {
  return (
    formData.value.from_location_id &&
    formData.value.to_location_id &&
    formData.value.from_location_id !== formData.value.to_location_id &&
    formData.value.transfer_date &&
    lines.value.length > 0 &&
    lines.value.every((line) => line.item_id && line.quantity && parseFloat(line.quantity) > 0) &&
    !hasInsufficientStock.value
  );
});

// Map locations for SelectMenu (rename 'type' to 'locationType' to avoid conflict with SelectMenuItem)
const locationItems = computed(() => {
  return props.locations.map((loc) => ({
    id: loc.id,
    code: loc.code,
    name: loc.name,
    locationType: loc.type,
  }));
});

// Get available "to" locations (exclude from location)
const availableToLocations = computed(() => {
  return locationItems.value.filter((loc) => loc.id !== formData.value.from_location_id);
});

// Methods
const addLine = () => {
  lines.value.push({
    id: crypto.randomUUID(),
    item_id: "",
    quantity: "",
    wac: 0,
    line_value: 0,
    on_hand: 0,
    has_insufficient_stock: false,
  });
};

const removeLine = (id: string) => {
  lines.value = lines.value.filter((line) => line.id !== id);
};

const updateLineCalculations = (line: TransferLine) => {
  const quantity = parseFloat(line.quantity) || 0;

  // Get stock info for this item from source location
  const stockInfo = props.stockLevels[line.item_id];
  if (stockInfo) {
    line.wac = stockInfo.wac;
    line.on_hand = stockInfo.on_hand;
    line.line_value = quantity * stockInfo.wac;

    // Check if quantity exceeds available stock
    line.has_insufficient_stock = quantity > stockInfo.on_hand;
  } else {
    line.wac = 0;
    line.on_hand = 0;
    line.line_value = 0;
    line.has_insufficient_stock = false;
  }
};

const handleSubmit = () => {
  if (!isFormValid.value) return;

  // Prepare lines data
  const linesData = lines.value.map((line) => ({
    item_id: line.item_id,
    quantity: parseFloat(line.quantity),
  }));

  // Emit submit event with form data
  emit("submit", {
    from_location_id: formData.value.from_location_id,
    to_location_id: formData.value.to_location_id,
    transfer_date: formData.value.transfer_date,
    notes: formData.value.notes,
    lines: linesData,
  } as TransferFormData);
};

const handleCancel = () => {
  emit("cancel");
};

// Watch for item or quantity changes to update calculations
watch(
  lines,
  () => {
    lines.value.forEach((line) => updateLineCalculations(line));
  },
  { deep: true }
);

// Initialize with one empty line
onMounted(() => {
  if (lines.value.length === 0) {
    addLine();
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Transfer Header Card -->
    <UCard class="card-elevated">
      <template #header>
        <h2 class="text-subheading font-semibold">Transfer Information</h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- From Location -->
        <div>
          <label class="form-label">From Location *</label>
          <USelectMenu
            v-model="formData.from_location_id"
            :items="locationItems"
            label-key="name"
            value-key="id"
            placeholder="Select source location"
            searchable
          />
        </div>

        <!-- To Location -->
        <div>
          <label class="form-label">To Location *</label>
          <USelectMenu
            v-model="formData.to_location_id"
            :items="availableToLocations"
            label-key="name"
            value-key="id"
            placeholder="Select destination location"
            searchable
            :disabled="!formData.from_location_id"
          />
          <p v-if="!formData.from_location_id" class="text-caption mt-1">
            Please select a source location first
          </p>
        </div>

        <!-- Transfer Date -->
        <div>
          <label class="form-label">Transfer Date *</label>
          <UInput v-model="formData.transfer_date" type="date" />
        </div>

        <!-- Notes -->
        <div class="md:col-span-2">
          <label class="form-label">Notes</label>
          <UTextarea
            v-model="formData.notes"
            placeholder="Add any notes about this transfer"
            :rows="3"
          />
        </div>
      </div>
    </UCard>

    <!-- Transfer Lines Card -->
    <UCard class="card-elevated">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-subheading font-semibold">Transfer Items</h2>
          <UButton
            icon="i-lucide-plus"
            color="primary"
            variant="soft"
            size="sm"
            @click="addLine"
            :disabled="!formData.from_location_id"
          >
            Add Item
          </UButton>
        </div>
      </template>

      <!-- No Source Location Warning -->
      <div v-if="!formData.from_location_id" class="mb-4">
        <UAlert
          icon="i-lucide-info"
          color="primary"
          variant="subtle"
          title="Select Source Location"
          description="Please select a source location to add items to the transfer"
        />
      </div>

      <!-- Insufficient Stock Warning -->
      <div v-if="hasInsufficientStock" class="mb-4">
        <UAlert
          icon="i-lucide-alert-triangle"
          color="error"
          variant="subtle"
          title="Insufficient Stock"
          :description="`${insufficientStockCount} item(s) have insufficient stock at source location. Please reduce quantities.`"
        />
      </div>

      <!-- Lines Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-default">
          <thead>
            <tr class="bg-default">
              <th class="px-4 py-3 text-left text-label uppercase">Item</th>
              <th class="px-4 py-3 text-left text-label uppercase">On Hand (Source)</th>
              <th class="px-4 py-3 text-left text-label uppercase">Quantity</th>
              <th class="px-4 py-3 text-left text-label uppercase">WAC</th>
              <th class="px-4 py-3 text-right text-label uppercase">Line Value</th>
              <th class="px-4 py-3 text-center text-label uppercase">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr
              v-for="line in lines"
              :key="line.id"
              :class="{
                'bg-red-50 dark:bg-red-950/20': line.has_insufficient_stock,
              }"
            >
              <!-- Item Selection -->
              <td class="px-4 py-3">
                <USelectMenu
                  v-model="line.item_id"
                  :items="items"
                  label-key="name"
                  value-key="id"
                  placeholder="Select item"
                  searchable
                  class="min-w-[200px]"
                  :disabled="!formData.from_location_id"
                />
              </td>

              <!-- On Hand -->
              <td class="px-4 py-3">
                <div v-if="line.item_id" class="flex items-center space-x-2">
                  <span class="text-body font-medium">
                    {{ line.on_hand.toFixed(4) }}
                  </span>
                  <UIcon
                    v-if="line.has_insufficient_stock"
                    name="i-lucide-alert-circle"
                    class="text-red-500"
                  />
                </div>
                <span v-else class="text-caption">-</span>
              </td>

              <!-- Quantity -->
              <td class="px-4 py-3">
                <UInput
                  v-model="line.quantity"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="0.00"
                  class="w-32"
                />
              </td>

              <!-- WAC (Read-only) -->
              <td class="px-4 py-3">
                <span v-if="line.item_id" class="text-caption">
                  {{ formatCurrency(line.wac) }}
                </span>
                <span v-else class="text-caption">-</span>
              </td>

              <!-- Line Value -->
              <td class="px-4 py-3 text-right">
                <span class="text-body font-medium">
                  {{ formatCurrency(line.line_value) }}
                </span>
              </td>

              <!-- Action -->
              <td class="px-4 py-3 text-center">
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="sm"
                  :disabled="lines.length === 1"
                  @click="removeLine(line.id)"
                />
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="lines.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-caption">
                No items added yet. Click "Add Item" to start.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Summary -->
      <div class="mt-4 pt-4 border-t border-default">
        <div class="flex justify-between items-center">
          <div class="text-caption">{{ lines.length }} item(s)</div>
          <div class="text-right">
            <div class="text-caption">Total Value</div>
            <div class="text-heading font-bold text-primary">
              {{ formatCurrency(totalValue) }}
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Form Actions -->
    <div class="flex justify-end space-x-3">
      <UButton color="neutral" variant="soft" @click="handleCancel" :disabled="loading">
        Cancel
      </UButton>
      <UButton
        color="primary"
        :loading="loading"
        :disabled="!isFormValid || loading"
        @click="handleSubmit"
      >
        <slot name="submit-label">{{ submitLabel }}</slot>
      </UButton>
    </div>
  </div>
</template>
