<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Page Header -->
    <PageHeader
      title="Set Item Prices"
      icon="i-lucide-tag"
    >
      <template #breadcrumbs>
        <nav class="flex items-center gap-2 text-sm text-[var(--ui-text-muted)]">
          <NuxtLink to="/" class="hover:text-[var(--ui-text)]">Dashboard</NuxtLink>
          <span>/</span>
          <span class="text-[var(--ui-text)]">Set Prices</span>
        </nav>
      </template>

      <template #actions>
        <UButton
          v-if="hasChanges"
          color="primary"
          icon="i-lucide-save"
          :loading="saving"
          :disabled="!canSave || saving"
          @click="handleSaveAll"
        >
          Save All Prices
        </UButton>
      </template>
    </PageHeader>

    <!-- Period Info -->
    <div v-if="periodData" class="mb-6">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-[var(--ui-text)]">{{ periodData.name }}</h2>
            <p class="text-sm text-[var(--ui-text-muted)]">
              {{ formatDateRange(periodData.start_date, periodData.end_date) }}
            </p>
          </div>
          <UBadge
            :color="periodData.status === 'OPEN' ? 'success' : 'warning'"
            variant="subtle"
            size="lg"
          >
            {{ periodData.status }}
          </UBadge>
        </div>
      </UCard>
    </div>

    <!-- Period Closed Warning -->
    <UAlert
      v-if="periodData?.status === 'CLOSED'"
      color="warning"
      icon="i-lucide-alert-triangle"
      title="Period Closed"
      description="This period is closed. You cannot modify prices."
      class="mb-6"
    />

    <!-- Filters -->
    <div class="mb-6">
      <UCard>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
          <!-- Search -->
          <div class="flex-1">
            <label class="block text-sm font-medium text-[var(--ui-text-muted)] mb-2">
              Search Items
            </label>
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Search by name or code..."
            >
              <template #trailing>
                <UButton
                  v-if="searchQuery"
                  color="neutral"
                  variant="link"
                  icon="i-lucide-x"
                  :padded="false"
                  @click="searchQuery = ''"
                />
              </template>
            </UInput>
          </div>

          <!-- Category Filter -->
          <div class="sm:w-64">
            <label class="block text-sm font-medium text-[var(--ui-text-muted)] mb-2">
              Category
            </label>
            <USelectMenu
              v-model="selectedCategory"
              :options="categoryOptions"
              placeholder="All Categories"
              value-attribute="value"
              option-attribute="label"
            />
          </div>

          <!-- Clear Filters -->
          <UButton
            v-if="searchQuery || selectedCategory"
            color="neutral"
            variant="soft"
            icon="i-lucide-filter-x"
            @click="clearFilters"
          >
            Clear Filters
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Loading State -->
    <LoadingSpinner v-if="loading" size="lg" text="Loading prices..." class="my-12" />

    <!-- Error State -->
    <ErrorAlert
      v-else-if="error"
      :error="error"
      :retry="fetchPrices"
    />

    <!-- Prices Table -->
    <div v-else-if="pricesData">
      <UCard>
        <!-- Statistics -->
        <div class="mb-4 flex flex-wrap gap-4 text-sm">
          <div>
            <span class="text-[var(--ui-text-muted)]">Total Items:</span>
            <span class="ml-2 font-semibold text-[var(--ui-text)]">{{ pricesData.length }}</span>
          </div>
          <div>
            <span class="text-[var(--ui-text-muted)]">Prices Set:</span>
            <span class="ml-2 font-semibold text-[var(--ui-text)]">{{ pricesSetCount }}</span>
          </div>
          <div>
            <span class="text-[var(--ui-text-muted)]">Prices Missing:</span>
            <span class="ml-2 font-semibold text-[var(--ui-text)]">{{ pricesMissingCount }}</span>
          </div>
          <div v-if="hasChanges" class="ml-auto">
            <span class="text-[var(--ui-text-muted)]">Unsaved Changes:</span>
            <span class="ml-2 font-semibold text-amber-600">{{ changesCount }}</span>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-[var(--ui-border)]">
                <th class="px-4 py-3 text-left text-sm font-semibold text-[var(--ui-text)]">Code</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-[var(--ui-text)]">Item Name</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-[var(--ui-text)]">Unit</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-[var(--ui-text)]">Category</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-[var(--ui-text)]">Current WAC</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-[var(--ui-text)]">Period Price</th>
                <th class="px-4 py-3 text-center text-sm font-semibold text-[var(--ui-text)]">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in filteredPrices"
                :key="item.item_id"
                class="border-b border-[var(--ui-border)] hover:bg-[var(--ui-bg-elevated)]"
              >
                <!-- Code -->
                <td class="px-4 py-3 text-sm text-[var(--ui-text)]">
                  {{ item.item_code }}
                </td>

                <!-- Item Name -->
                <td class="px-4 py-3 text-sm text-[var(--ui-text)]">
                  {{ item.item_name }}
                </td>

                <!-- Unit -->
                <td class="px-4 py-3 text-sm text-[var(--ui-text-muted)]">
                  {{ item.item_unit }}
                </td>

                <!-- Category -->
                <td class="px-4 py-3 text-sm text-[var(--ui-text-muted)]">
                  {{ item.item_category || '-' }}
                </td>

                <!-- Current WAC -->
                <td class="px-4 py-3 text-right text-sm text-[var(--ui-text-muted)]">
                  {{ item.wac !== null ? formatCurrency(item.wac) : '-' }}
                </td>

                <!-- Period Price (Editable) -->
                <td class="px-4 py-3 text-right">
                  <UInput
                    v-model="item.editedPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    :disabled="periodData?.status === 'CLOSED' || !permissions.canSetItemPrices"
                    class="w-32 ml-auto"
                    @input="handlePriceChange(item)"
                  />
                </td>

                <!-- Status -->
                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <!-- Modified Indicator -->
                    <UBadge
                      v-if="item.isModified"
                      color="warning"
                      variant="subtle"
                      size="xs"
                    >
                      Modified
                    </UBadge>

                    <!-- Price Variance Warning -->
                    <UTooltip
                      v-if="item.hasPriceVariance"
                      text="Price differs significantly from current WAC"
                    >
                      <UIcon
                        name="i-lucide-alert-triangle"
                        class="h-5 w-5 text-amber-600"
                      />
                    </UTooltip>

                    <!-- Price Set Indicator -->
                    <UIcon
                      v-else-if="item.has_price && !item.isModified"
                      name="i-lucide-check-circle"
                      class="h-5 w-5 text-emerald-600"
                    />

                    <!-- Price Missing Indicator -->
                    <UIcon
                      v-else-if="!item.editedPrice"
                      name="i-lucide-circle-dashed"
                      class="h-5 w-5 text-zinc-400"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <EmptyState
          v-if="filteredPrices.length === 0"
          icon="i-lucide-search-x"
          title="No items found"
          description="Try adjusting your search or filters."
        />
      </UCard>
    </div>

    <!-- Footer Actions -->
    <div v-if="pricesData && pricesData.length > 0" class="mt-6 flex items-center justify-between">
      <div class="text-sm text-[var(--ui-text-muted)]">
        <span v-if="hasChanges">
          <UIcon name="i-lucide-alert-circle" class="inline h-4 w-4" />
          You have unsaved changes. Click "Save All Prices" to apply them.
        </span>
        <span v-else>
          All prices are saved.
        </span>
      </div>

      <UButton
        v-if="hasChanges"
        color="primary"
        size="lg"
        icon="i-lucide-save"
        :loading="saving"
        :disabled="!canSave || saving"
        @click="handleSaveAll"
      >
        Save All Prices ({{ changesCount }})
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDateRange } from '~/utils/format'

// Props and route
const route = useRoute()
const periodId = computed(() => route.params.periodId as string)

// Composables
const { canSetItemPrices } = usePermissions()
const permissions = { canSetItemPrices }
const toast = useAppToast()
const locationStore = useLocationStore()

// State
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const periodData = ref<any>(null)
const pricesData = ref<any[]>([])
const originalPrices = ref<Map<string, number | null>>(new Map())

// Filters
const searchQuery = ref('')
const selectedCategory = ref('')

// Fetch prices on mount
onMounted(async () => {
  await fetchPrices()
})

// Fetch location stock for WAC comparison
const locationStock = ref<Map<string, number>>(new Map())

async function fetchPrices() {
  loading.value = true
  error.value = null

  try {
    // Fetch period prices
    const response = await $fetch(`/api/periods/${periodId.value}/prices`)
    periodData.value = response.period

    // Fetch location stock for current location to get WAC values
    const activeLocationId = locationStore.activeLocation?.id
    if (activeLocationId) {
      const stockResponse = await $fetch(`/api/locations/${activeLocationId}/stock`)
      if (stockResponse.stock) {
        stockResponse.stock.forEach((s: any) => {
          locationStock.value.set(s.item_id, parseFloat(s.wac) || 0)
        })
      }
    }

    // Process prices data
    pricesData.value = response.prices.map((item: any) => {
      const wac = locationStock.value.get(item.item_id) || null
      const currentPrice = item.price ? parseFloat(item.price.toString()) : null

      return {
        ...item,
        wac,
        editedPrice: currentPrice !== null ? currentPrice.toString() : '',
        originalPrice: currentPrice,
        isModified: false,
        hasPriceVariance: false,
      }
    })

    // Store original prices
    pricesData.value.forEach((item) => {
      originalPrices.value.set(item.item_id, item.originalPrice)
    })
  } catch (err: any) {
    console.error('Error fetching prices:', err)
    error.value = err.data?.message || 'Failed to load prices'
  } finally {
    loading.value = false
  }
}

// Handle price change
function handlePriceChange(item: any) {
  const editedValue = item.editedPrice ? parseFloat(item.editedPrice) : null
  const originalValue = originalPrices.value.get(item.item_id)

  // Check if modified
  item.isModified = editedValue !== originalValue

  // Check for price variance (>10% difference from WAC)
  if (editedValue !== null && item.wac !== null) {
    const variance = Math.abs((editedValue - item.wac) / item.wac) * 100
    item.hasPriceVariance = variance > 10
  } else {
    item.hasPriceVariance = false
  }
}

// Computed properties
const categoryOptions = computed(() => {
  const categories = new Set<string>()
  pricesData.value.forEach((item) => {
    if (item.item_category) {
      categories.add(item.item_category)
    }
  })
  return [
    { label: 'All Categories', value: '' },
    ...Array.from(categories).sort().map((cat) => ({ label: cat, value: cat })),
  ]
})

const filteredPrices = computed(() => {
  let filtered = pricesData.value

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (item) =>
        item.item_name.toLowerCase().includes(query) ||
        item.item_code.toLowerCase().includes(query)
    )
  }

  // Filter by category
  if (selectedCategory.value) {
    filtered = filtered.filter((item) => item.item_category === selectedCategory.value)
  }

  return filtered
})

const pricesSetCount = computed(() => {
  return pricesData.value.filter((item) => item.has_price).length
})

const pricesMissingCount = computed(() => {
  return pricesData.value.filter((item) => !item.has_price).length
})

const hasChanges = computed(() => {
  return pricesData.value.some((item) => item.isModified)
})

const changesCount = computed(() => {
  return pricesData.value.filter((item) => item.isModified).length
})

const canSave = computed(() => {
  return hasChanges.value && periodData.value?.status !== 'CLOSED' && permissions.canSetItemPrices
})

// Clear filters
function clearFilters() {
  searchQuery.value = ''
  selectedCategory.value = ''
}

// Save all prices
async function handleSaveAll() {
  if (!canSave.value) return

  saving.value = true

  try {
    // Collect modified prices
    const modifiedPrices = pricesData.value
      .filter((item) => item.isModified && item.editedPrice)
      .map((item) => ({
        item_id: item.item_id,
        price: parseFloat(item.editedPrice),
      }))

    if (modifiedPrices.length === 0) {
      toast.warning('No Changes', { description: 'No prices to save' })
      return
    }

    // Send update request
    const response = await $fetch<{ updated_count: number }>(`/api/periods/${periodId.value}/prices`, {
      method: 'POST',
      body: { prices: modifiedPrices },
    })

    toast.success('Prices Updated', { description: `Successfully updated ${response.updated_count} item prices` })

    // Refresh data
    await fetchPrices()
  } catch (err: any) {
    console.error('Error saving prices:', err)
    toast.error('Save Failed', { description: err.data?.message || 'Failed to save prices' })
  } finally {
    saving.value = false
  }
}

// Page metadata
definePageMeta({
  middleware: ['role'],
  roleRequired: 'ADMIN',
})

// Page title
useHead({
  title: 'Set Item Prices - SM Stock Management',
})
</script>
