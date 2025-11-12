<script setup lang="ts">
/**
 * IssueForm Component
 *
 * Reusable form component for creating/editing stock issues.
 * Encapsulates complete issue form logic including header fields,
 * dynamic multi-line management, stock validation, and totals.
 */

import { formatCurrency } from '~/utils/format'

// Props
interface Props {
  /**
   * Issue date (YYYY-MM-DD format)
   */
  issueDate: string
  /**
   * Cost centre (FOOD/CLEAN/OTHER)
   */
  costCentre: 'FOOD' | 'CLEAN' | 'OTHER'
  /**
   * Current location name (read-only display)
   */
  locationName: string
  /**
   * Array of issue lines
   */
  lines: Array<{
    id: string
    item_id: string
    quantity: string
    wac: number
    line_value: number
    on_hand: number
    has_insufficient_stock: boolean
  }>
  /**
   * Available items for selection
   */
  items: any[]
  /**
   * Stock levels map (itemId -> { on_hand, wac })
   */
  stockLevels: Record<string, { on_hand: number; wac: number }>
  /**
   * Whether form is submitting
   */
  loading?: boolean
  /**
   * Whether form is valid
   */
  isValid?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  isValid: false,
})

// Emits
const emit = defineEmits<{
  'update:issueDate': [value: string]
  'update:costCentre': [value: 'FOOD' | 'CLEAN' | 'OTHER']
  'update:lines': [value: any[]]
  'add-line': []
  'remove-line': [id: string]
  'submit': []
  'cancel': []
}>()

// Cost centre options
const costCentreOptions = [
  { value: 'FOOD', label: 'Food' },
  { value: 'CLEAN', label: 'Cleaning' },
  { value: 'OTHER', label: 'Other' },
]

// Computed
const totalValue = computed(() => {
  return props.lines.reduce((sum, line) => sum + line.line_value, 0)
})

const hasInsufficientStock = computed(() => {
  return props.lines.some(line => line.has_insufficient_stock)
})

const insufficientStockCount = computed(() => {
  return props.lines.filter(line => line.has_insufficient_stock).length
})

// Methods
const getItemById = (itemId: string) => {
  return props.items.find(item => item.id === itemId)
}

const handleAddLine = () => {
  emit('add-line')
}

const handleRemoveLine = (id: string) => {
  emit('remove-line', id)
}

const handleSubmit = () => {
  emit('submit')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Issue Header Card -->
    <UCard class="card-elevated">
      <template #header>
        <h2 class="text-lg font-semibold text-[var(--ui-text)]">Issue Information</h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Issue Date -->
        <div>
          <label class="form-label">Issue Date *</label>
          <UInput
            :model-value="issueDate"
            type="date"
            @update:model-value="emit('update:issueDate', $event)"
          />
        </div>

        <!-- Cost Centre -->
        <div>
          <label class="form-label">Cost Centre *</label>
          <USelectMenu
            :model-value="costCentre"
            :options="costCentreOptions"
            option-attribute="label"
            value-attribute="value"
            placeholder="Select cost centre"
            @update:model-value="emit('update:costCentre', $event as 'FOOD' | 'CLEAN' | 'OTHER')"
          />
        </div>

        <!-- Location (Read-only) -->
        <div>
          <label class="form-label">Location</label>
          <UInput
            :model-value="locationName"
            readonly
            disabled
          />
        </div>
      </div>
    </UCard>

    <!-- Issue Lines Card -->
    <UCard class="card-elevated">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-[var(--ui-text)]">Issue Items</h2>
          <UButton
            icon="i-lucide-plus"
            color="primary"
            variant="soft"
            size="sm"
            @click="handleAddLine"
          >
            Add Item
          </UButton>
        </div>
      </template>

      <!-- Insufficient Stock Warning -->
      <div v-if="hasInsufficientStock" class="mb-4">
        <UAlert
          icon="i-lucide-alert-triangle"
          color="error"
          variant="subtle"
          title="Insufficient Stock"
          :description="`${insufficientStockCount} item(s) have insufficient stock. Please reduce quantities.`"
        />
      </div>

      <!-- Lines Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-[var(--ui-border)]">
          <thead>
            <tr class="bg-[var(--ui-bg)]">
              <th class="px-4 py-3 text-left text-xs font-medium text-[var(--ui-text-muted)] uppercase">Item</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-[var(--ui-text-muted)] uppercase">On Hand</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-[var(--ui-text-muted)] uppercase">Quantity</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-[var(--ui-text-muted)] uppercase">WAC</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-[var(--ui-text-muted)] uppercase">Line Value</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-[var(--ui-text-muted)] uppercase">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)]">
            <IssueLineInput
              v-for="line in lines"
              :key="line.id"
              :line="line"
              :items="items"
              :stock-levels="stockLevels"
              :can-remove="lines.length > 1"
              @update:line="emit('update:lines', lines)"
              @remove="handleRemoveLine(line.id)"
            />

            <!-- Empty State -->
            <tr v-if="lines.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-[var(--ui-text-muted)]">
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
            <div class="text-sm text-[var(--ui-text-muted)]">Total Value</div>
            <div class="text-2xl font-bold text-[var(--ui-primary)]">
              {{ formatCurrency(totalValue) }}
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
        :disabled="!isValid || loading"
        @click="handleSubmit"
      >
        <slot name="submit-label">Create Issue</slot>
      </UButton>
    </div>
  </div>
</template>
