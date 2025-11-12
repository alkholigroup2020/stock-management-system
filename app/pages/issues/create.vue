<script setup lang="ts">
import { z } from 'zod'
import { formatCurrency } from '~/utils/format'

// SEO
useSeoMeta({
  title: 'New Issue - Stock Management System',
  description: 'Record a new stock issue',
})

// Composables
const router = useRouter()
const locationStore = useLocationStore()
const periodStore = usePeriodStore()
const toast = useAppToast()
const permissions = usePermissions()

// State
const loading = ref(false)
const items = ref<any[]>([])
const stockLevels = ref<Record<string, { on_hand: number; wac: number }>>({}) // Map of itemId -> stock info

// Computed permission check
const hasIssuePermission = computed(() => permissions.canPostIssues())

// Form state
const formData = ref({
  issue_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  cost_centre: 'FOOD' as 'FOOD' | 'CLEAN' | 'OTHER',
})

// Issue lines state
const lines = ref<Array<{
  id: string
  item_id: string
  quantity: string
  wac: number
  line_value: number
  on_hand: number
  has_insufficient_stock: boolean
}>>([])

// Add initial empty line
const addLine = () => {
  lines.value.push({
    id: crypto.randomUUID(),
    item_id: '',
    quantity: '',
    wac: 0,
    line_value: 0,
    on_hand: 0,
    has_insufficient_stock: false,
  })
}

// Remove line
const removeLine = (id: string) => {
  lines.value = lines.value.filter(line => line.id !== id)
}

// Calculate line value and check stock
const updateLineCalculations = (line: any) => {
  const quantity = parseFloat(line.quantity) || 0

  // Get stock info for this item
  const stockInfo = stockLevels.value[line.item_id]
  if (stockInfo) {
    line.wac = stockInfo.wac
    line.on_hand = stockInfo.on_hand
    line.line_value = quantity * stockInfo.wac

    // Check if quantity exceeds available stock
    line.has_insufficient_stock = quantity > stockInfo.on_hand
  } else {
    line.wac = 0
    line.on_hand = 0
    line.line_value = 0
    line.has_insufficient_stock = false
  }
}

// Computed
const totalValue = computed(() => {
  return lines.value.reduce((sum, line) => sum + line.line_value, 0)
})

const hasInsufficientStock = computed(() => {
  return lines.value.some(line => line.has_insufficient_stock)
})

const insufficientStockCount = computed(() => {
  return lines.value.filter(line => line.has_insufficient_stock).length
})

const isFormValid = computed(() => {
  return (
    formData.value.issue_date &&
    formData.value.cost_centre &&
    lines.value.length > 0 &&
    lines.value.every(line => line.item_id && line.quantity && parseFloat(line.quantity) > 0) &&
    !hasInsufficientStock.value
  )
})

// Get item by ID
const getItemById = (itemId: string) => {
  return items.value.find(item => item.id === itemId)
}

// Fetch items with stock levels
const fetchItems = async () => {
  if (!locationStore.activeLocation?.id) {
    toast.error('No active location selected')
    return
  }

  try {
    const data: any = await $fetch('/api/items', {
      query: {
        limit: 500, // Get more items for dropdown
        is_active: true,
        locationId: locationStore.activeLocation.id, // Include stock data
      }
    })
    items.value = data.items || []

    // Build stock levels map
    stockLevels.value = {}
    items.value.forEach((item: any) => {
      if (item.location_stock && item.location_stock.length > 0) {
        const stock = item.location_stock[0]
        stockLevels.value[item.id] = {
          on_hand: stock.on_hand,
          wac: stock.wac,
        }
      }
    })
  } catch (error: any) {
    toast.error('Failed to fetch items', error.message)
  }
}

// Submit form
const submitIssue = async () => {
  if (!isFormValid.value) {
    toast.error('Please fill in all required fields')
    return
  }

  if (!locationStore.activeLocation?.id) {
    toast.error('No location selected')
    return
  }

  if (!hasIssuePermission.value) {
    toast.error('You do not have permission to post issues')
    return
  }

  loading.value = true

  try {
    // Prepare lines data
    const linesData = lines.value.map(line => ({
      item_id: line.item_id,
      quantity: parseFloat(line.quantity),
    }))

    // Submit issue
    const result: any = await $fetch(`/api/locations/${locationStore.activeLocation.id}/issues`, {
      method: 'POST',
      body: {
        issue_date: formData.value.issue_date ? new Date(formData.value.issue_date).toISOString() : new Date().toISOString(),
        cost_centre: formData.value.cost_centre,
        lines: linesData,
      }
    })

    toast.success('Issue created successfully', {
      description: 'Issue record has been saved'
    })

    // Redirect to issue detail page
    router.push(`/issues/${result.id}`)
  } catch (error: any) {
    console.error('Issue submission error:', error)

    // Check for insufficient stock error
    if (error.data?.code === 'INSUFFICIENT_STOCK' && error.data?.details?.insufficient_items) {
      const items = error.data.details.insufficient_items
      const itemList = items.map((item: any) =>
        `${item.item_name}: requested ${item.requested}, available ${item.available}`
      ).join('; ')
      toast.error('Insufficient Stock', {
        description: `Cannot post issue. ${itemList}`
      })
    } else {
      toast.error('Failed to create issue', {
        description: error.data?.message || error.message
      })
    }
  } finally {
    loading.value = false
  }
}

// Cancel and go back
const cancel = () => {
  router.push('/issues')
}

// Cost centre options
const costCentreOptions = [
  { value: 'FOOD', label: 'Food' },
  { value: 'CLEAN', label: 'Cleaning' },
  { value: 'OTHER', label: 'Other' },
]

// Initialize
onMounted(async () => {
  // Check permission
  if (!hasIssuePermission.value) {
    toast.error('You do not have permission to post issues')
    router.push('/issues')
    return
  }

  // Fetch required data
  await fetchItems()

  // Add initial empty line
  addLine()
})

// Watch for item or quantity changes to update calculations
watch(lines, () => {
  lines.value.forEach(line => updateLineCalculations(line))
}, { deep: true })
</script>

<template>
  <div class="min-h-screen bg-[var(--ui-bg)] p-6">
    <!-- Page Header -->
    <PageHeader
      title="New Issue"
      icon="file-minus"
    >
      <template #breadcrumbs>
        <nav class="flex items-center space-x-2 text-sm text-[var(--ui-text-muted)]">
          <NuxtLink to="/" class="hover:text-[var(--ui-primary)]">Home</NuxtLink>
          <span>/</span>
          <NuxtLink to="/issues" class="hover:text-[var(--ui-primary)]">Issues</NuxtLink>
          <span>/</span>
          <span class="text-[var(--ui-text)]">New</span>
        </nav>
      </template>
    </PageHeader>

    <!-- Main Form -->
    <div class="mt-6 space-y-6">
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
              v-model="formData.issue_date"
              type="date"
            />
          </div>

          <!-- Cost Centre -->
          <div>
            <label class="form-label">Cost Centre *</label>
            <USelectMenu
              v-model="formData.cost_centre"
              :options="costCentreOptions"
              option-attribute="label"
              value-attribute="value"
              placeholder="Select cost centre"
            />
          </div>

          <!-- Location (Read-only) -->
          <div>
            <label class="form-label">Location</label>
            <UInput
              :model-value="locationStore.activeLocation?.name"
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
              @click="addLine"
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
              <tr
                v-for="line in lines"
                :key="line.id"
                :class="{ 'bg-red-50 dark:bg-red-950/20': line.has_insufficient_stock }"
              >
                <!-- Item Selection -->
                <td class="px-4 py-3">
                  <USelectMenu
                    v-model="line.item_id"
                    :options="items"
                    option-attribute="name"
                    value-attribute="id"
                    placeholder="Select item"
                    searchable
                    class="min-w-[200px]"
                  />
                </td>

                <!-- On Hand -->
                <td class="px-4 py-3">
                  <div v-if="line.item_id" class="flex items-center space-x-2">
                    <span class="text-sm font-medium text-[var(--ui-text)]">
                      {{ line.on_hand.toFixed(4) }}
                    </span>
                    <UIcon
                      v-if="line.has_insufficient_stock"
                      name="i-lucide-alert-circle"
                      class="text-red-500"
                    />
                  </div>
                  <span v-else class="text-sm text-[var(--ui-text-muted)]">-</span>
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
                  <span v-if="line.item_id" class="text-sm text-[var(--ui-text-muted)]">
                    {{ formatCurrency(line.wac) }}
                  </span>
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
                    :disabled="lines.length === 1"
                    @click="removeLine(line.id)"
                  />
                </td>
              </tr>

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
          @click="cancel"
          :disabled="loading"
        >
          Cancel
        </UButton>
        <UButton
          color="primary"
          :loading="loading"
          :disabled="!isFormValid || loading"
          @click="submitIssue"
        >
          Create Issue
        </UButton>
      </div>
    </div>
  </div>
</template>
