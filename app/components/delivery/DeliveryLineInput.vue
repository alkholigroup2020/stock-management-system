<script setup lang="ts">
/**
 * DeliveryLineInput Component
 *
 * Renders a single delivery line input row with:
 * - Item selection dropdown
 * - Quantity input
 * - Unit price input
 * - Period price display
 * - Price variance detection and display
 * - Line value calculation
 * - Remove button
 */

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

interface Props {
  line: DeliveryLine
  items: Item[]
  periodPrices: Record<string, number>
  canRemove?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canRemove: true,
})

// Emits
const emit = defineEmits<{
  'update:line': [line: DeliveryLine]
  'remove': [lineId: string]
}>()

// Local reactive copy of line
const localLine = computed({
  get: () => props.line,
  set: (value) => emit('update:line', value),
})

// Get item by ID
const selectedItem = computed(() => {
  return props.items.find(item => item.id === localLine.value.item_id)
})

// Update line calculations
const updateCalculations = () => {
  const quantity = parseFloat(localLine.value.quantity) || 0
  const unitPrice = parseFloat(localLine.value.unit_price) || 0
  localLine.value.line_value = quantity * unitPrice

  // Check for price variance
  const periodPrice = props.periodPrices[localLine.value.item_id]
  if (periodPrice !== undefined && unitPrice > 0) {
    localLine.value.period_price = periodPrice
    localLine.value.price_variance = unitPrice - periodPrice
    localLine.value.has_variance = Math.abs(localLine.value.price_variance) > 0.01 // Variance threshold
  } else {
    localLine.value.period_price = undefined
    localLine.value.price_variance = 0
    localLine.value.has_variance = false
  }
}

// Watch for changes and update calculations
watch(
  () => [localLine.value.item_id, localLine.value.quantity, localLine.value.unit_price],
  () => {
    updateCalculations()
  },
  { immediate: true }
)

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Remove line handler
const handleRemove = () => {
  emit('remove', localLine.value.id)
}
</script>

<template>
  <tr :class="{ 'bg-amber-50 dark:bg-amber-950/20': line.has_variance }">
    <!-- Item Selection -->
    <td class="px-4 py-3">
      <USelectMenu
        v-model="localLine.item_id"
        :options="items"
        option-attribute="name"
        value-attribute="id"
        placeholder="Select item"
        searchable
        class="min-w-[200px]"
      >
        <template #label>
          <span v-if="selectedItem">
            {{ selectedItem.name }}
          </span>
          <span v-else class="text-[var(--ui-text-muted)]">Select item</span>
        </template>
        <template #option="{ option }">
          <div>
            <div class="font-medium">{{ option.name }}</div>
            <div class="text-xs text-[var(--ui-text-muted)]">{{ option.code }} - {{ option.unit }}</div>
          </div>
        </template>
      </USelectMenu>
    </td>

    <!-- Quantity -->
    <td class="px-4 py-3">
      <UInput
        v-model="localLine.quantity"
        type="number"
        step="0.0001"
        min="0"
        placeholder="0.00"
        class="w-32"
      />
    </td>

    <!-- Unit Price -->
    <td class="px-4 py-3">
      <UInput
        v-model="localLine.unit_price"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        class="w-32"
      />
    </td>

    <!-- Period Price -->
    <td class="px-4 py-3">
      <span v-if="line.period_price !== undefined" class="text-sm text-[var(--ui-text-muted)]">
        {{ formatCurrency(line.period_price) }}
      </span>
      <span v-else class="text-sm text-[var(--ui-text-muted)]">-</span>
    </td>

    <!-- Variance -->
    <td class="px-4 py-3">
      <div v-if="line.has_variance" class="flex items-center space-x-2">
        <UIcon name="i-lucide-alert-triangle" class="text-amber-500" />
        <span
          :class="[
            'text-sm font-medium',
            line.price_variance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
          ]"
        >
          {{ formatCurrency(line.price_variance) }}
        </span>
      </div>
      <span v-else class="text-sm text-[var(--ui-text-muted)]">-</span>
    </td>

    <!-- Line Value -->
    <td class="px-4 py-3 text-right">
      <span class="text-sm font-medium text-[var(--ui-text)]">
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
        :disabled="!canRemove"
        @click="handleRemove"
      />
    </td>
  </tr>
</template>
