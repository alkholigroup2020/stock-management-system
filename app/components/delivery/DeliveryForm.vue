<script setup lang="ts">
/**
 * DeliveryForm Component
 *
 * Reusable delivery form component that handles:
 * - Delivery header information (supplier, invoice, date, etc.)
 * - Multiple delivery lines with price variance detection
 * - Automatic WAC calculation
 * - Form validation
 * - Submit and cancel actions
 *
 * Usage:
 * <DeliveryForm
 *   :suppliers="suppliers"
 *   :items="items"
 *   :period-prices="periodPrices"
 *   :loading="loading"
 *   @submit="handleSubmit"
 *   @cancel="handleCancel"
 * />
 */

interface Supplier {
  id: string
  code: string
  name: string
  contact?: string | null
}

interface Item {
  id: string
  code: string
  name: string
  unit: string
  category?: string | null
  sub_category?: string | null
}

interface DeliveryLine {
  id: string
  item_id: string
  quantity: string
  unit_price: string
  line_value: number
  price_variance: number
  has_variance: boolean
  period_price?: number
}

interface FormData {
  supplier_id: string
  po_id: string | null
  invoice_no: string
  delivery_note: string
  delivery_date: string
}

interface Props {
  suppliers: Supplier[]
  items: Item[]
  periodPrices: Record<string, number>
  loading?: boolean
  initialData?: Partial<FormData>
  initialLines?: DeliveryLine[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  initialData: () => ({
    supplier_id: '',
    po_id: null,
    invoice_no: '',
    delivery_note: '',
    delivery_date: new Date().toISOString().split('T')[0], // Today's date
  }),
  initialLines: () => [],
})

// Emits
const emit = defineEmits<{
  'submit': [data: { formData: FormData; lines: DeliveryLine[] }]
  'cancel': []
}>()

// Form state
const formData = ref<FormData>({
  supplier_id: props.initialData?.supplier_id || '',
  po_id: props.initialData?.po_id || null,
  invoice_no: props.initialData?.invoice_no || '',
  delivery_note: props.initialData?.delivery_note || '',
  delivery_date: (props.initialData?.delivery_date || new Date().toISOString().split('T')[0]) as string,
})

// Delivery lines state
const lines = ref<DeliveryLine[]>(
  props.initialLines.length > 0
    ? props.initialLines
    : []
)

// Add initial empty line if no lines provided
onMounted(() => {
  if (lines.value.length === 0) {
    addLine()
  }
})

// Add line
const addLine = () => {
  lines.value.push({
    id: crypto.randomUUID(),
    item_id: '',
    quantity: '',
    unit_price: '',
    line_value: 0,
    price_variance: 0,
    has_variance: false,
  })
}

// Remove line
const removeLine = (id: string) => {
  lines.value = lines.value.filter(line => line.id !== id)
}

// Update line
const updateLine = (updatedLine: DeliveryLine) => {
  const index = lines.value.findIndex(line => line.id === updatedLine.id)
  if (index !== -1) {
    lines.value[index] = updatedLine
  }
}

// Computed
const totalAmount = computed(() => {
  return lines.value.reduce((sum, line) => sum + line.line_value, 0)
})

const hasVarianceLines = computed(() => {
  return lines.value.some(line => line.has_variance)
})

const varianceCount = computed(() => {
  return lines.value.filter(line => line.has_variance).length
})

const totalVarianceAmount = computed(() => {
  return lines.value.reduce((sum, line) => {
    return sum + (line.has_variance ? line.price_variance * parseFloat(line.quantity || '0') : 0)
  }, 0)
})

const isFormValid = computed(() => {
  return (
    formData.value.supplier_id &&
    formData.value.invoice_no &&
    formData.value.delivery_date &&
    lines.value.length > 0 &&
    lines.value.every(line => line.item_id && line.quantity && line.unit_price)
  )
})

const canRemoveLine = computed(() => lines.value.length > 1)

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Submit handler
const handleSubmit = () => {
  if (!isFormValid.value) {
    return
  }

  emit('submit', {
    formData: formData.value,
    lines: lines.value,
  })
}

// Cancel handler
const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Delivery Header Card -->
    <UCard class="card-elevated">
      <template #header>
        <h2 class="text-lg font-semibold text-[var(--ui-text)]">Delivery Information</h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Supplier -->
        <div>
          <label class="form-label">Supplier *</label>
          <USelectMenu
            v-model="formData.supplier_id"
            :options="suppliers"
            option-attribute="name"
            value-attribute="id"
            placeholder="Select supplier"
            searchable
          />
        </div>

        <!-- PO (Optional) -->
        <div>
          <label class="form-label">Purchase Order (Optional)</label>
          <UInput
            v-model="formData.po_id"
            placeholder="PO number if applicable"
          />
        </div>

        <!-- Invoice Number -->
        <div>
          <label class="form-label">Invoice Number *</label>
          <UInput
            v-model="formData.invoice_no"
            placeholder="Enter invoice number"
          />
        </div>

        <!-- Delivery Date -->
        <div>
          <label class="form-label">Delivery Date *</label>
          <UInput
            v-model="formData.delivery_date"
            type="date"
          />
        </div>

        <!-- Delivery Note -->
        <div class="md:col-span-2">
          <label class="form-label">Delivery Note</label>
          <UTextarea
            v-model="formData.delivery_note"
            placeholder="Add any notes about this delivery"
            :rows="3"
          />
        </div>
      </div>
    </UCard>

    <!-- Delivery Lines Card -->
    <UCard class="card-elevated">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-[var(--ui-text)]">Delivery Items</h2>
          <UButton
            icon="i-lucide-plus"
            color="primary"
            variant="soft"
            size="sm"
            @click="addLine"
          >
            Add Item
          </UButton>
        </div>
      </template>

      <!-- Variance Warning -->
      <div v-if="hasVarianceLines" class="mb-4">
        <DeliveryPriceVarianceAlert
          :variance-count="varianceCount"
          :total-variance-amount="totalVarianceAmount"
          :show-details="true"
        />
      </div>

      <!-- Lines Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-[var(--ui-border)]">
          <thead>
            <tr class="bg-[var(--ui-bg)]">
              <th class="px-4 py-3 text-left text-xs font-medium text-[var(--ui-text-muted)] uppercase">Item</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-[var(--ui-text-muted)] uppercase">Quantity</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-[var(--ui-text-muted)] uppercase">Unit Price</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-[var(--ui-text-muted)] uppercase">Period Price</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-[var(--ui-text-muted)] uppercase">Variance</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-[var(--ui-text-muted)] uppercase">Line Value</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-[var(--ui-text-muted)] uppercase">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)]">
            <DeliveryLineInput
              v-for="line in lines"
              :key="line.id"
              :line="line"
              :items="items"
              :period-prices="periodPrices"
              :can-remove="canRemoveLine"
              @update:line="updateLine"
              @remove="removeLine"
            />

            <!-- Empty State -->
            <tr v-if="lines.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-[var(--ui-text-muted)]">
                No items added yet. Click "Add Item" to start.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Summary -->
      <div class="mt-4 pt-4 border-t border-[var(--ui-border)]">
        <div class="flex justify-between items-center">
          <div class="text-sm text-[var(--ui-text-muted)]">
            {{ lines.length }} item(s)
          </div>
          <div class="text-right">
            <div class="text-sm text-[var(--ui-text-muted)]">Total Amount</div>
            <div class="text-2xl font-bold text-[var(--ui-primary)]">
              {{ formatCurrency(totalAmount) }}
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Form Actions -->
    <div class="flex justify-end space-x-3">
      <UButton
        color="neutral"
        variant="soft"
        @click="handleCancel"
        :disabled="loading"
      >
        Cancel
      </UButton>
      <UButton
        color="primary"
        :loading="loading"
        :disabled="!isFormValid || loading"
        @click="handleSubmit"
      >
        <slot name="submit-label">Create Delivery</slot>
      </UButton>
    </div>
  </div>
</template>
