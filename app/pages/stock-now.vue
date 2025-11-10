<script setup lang="ts">
/**
 * Stock Now Page
 *
 * Real-time inventory visibility page showing current stock levels
 * for active location or consolidated view across all locations.
 *
 * Features:
 * - Display stock table with item details, quantities, WAC, and values
 * - Filter by category, low stock, and search
 * - Location selector for supervisors/admins
 * - Export to CSV (optional)
 * - Total inventory value display
 */

import type { LocationType } from '@prisma/client'

// Page metadata
// Auth is handled by auth.global.ts middleware automatically

// Composables
const { isAtLeastSupervisor } = useAuth()
const locationStore = useLocationStore()
const toast = useAppToast()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const selectedCategory = ref<string>('')
const showLowStockOnly = ref(false)
const selectedLocationId = ref<string>('')
const viewMode = ref<'single' | 'consolidated'>('single')

// Stock data
interface StockItem {
  item_id: string
  item_code: string
  item_name: string
  item_unit: string
  item_category: string | null
  item_sub_category: string | null
  on_hand: number
  wac: number
  value: number
  min_stock?: number | null
  max_stock?: number | null
  is_low_stock?: boolean
}

interface StockResponse {
  location?: {
    id: string
    code: string
    name: string
    type: LocationType
  }
  stock: StockItem[]
  total_value: number
  count: number
}

interface ConsolidatedStockItem {
  item_id: string
  item_code: string
  item_name: string
  item_unit: string
  item_category: string | null
  item_sub_category: string | null
  total_on_hand: number
  total_value: number
  locations: Array<{
    location_id: string
    location_code: string
    location_name: string
    location_type: string
    on_hand: number
    wac: number
    value: number
    min_stock: number | null
    max_stock: number | null
    is_low_stock: boolean
  }>
}

interface ConsolidatedStockResponse {
  consolidated_stock: ConsolidatedStockItem[]
  location_totals: Array<{
    location_id: string
    location_code: string
    location_name: string
    location_type: string
    total_value: number
    item_count: number
  }>
  grand_total_value: number
  total_items: number
  total_locations: number
}

const stockData = ref<StockResponse | null>(null)
const consolidatedData = ref<ConsolidatedStockResponse | null>(null)
const categories = ref<string[]>([])

// Computed properties
const activeLocationId = computed(() => {
  // If supervisor/admin selects a specific location
  if (selectedLocationId.value) {
    return selectedLocationId.value
  }
  // Otherwise use active location from store
  return locationStore.activeLocation?.id || ''
})

const filteredStock = computed(() => {
  if (viewMode.value === 'consolidated' && consolidatedData.value) {
    let items = consolidatedData.value.consolidated_stock

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      items = items.filter(
        (item) =>
          item.item_name.toLowerCase().includes(query) ||
          item.item_code.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (selectedCategory.value) {
      items = items.filter((item) => item.item_category === selectedCategory.value)
    }

    // Apply low stock filter
    if (showLowStockOnly.value) {
      items = items.filter((item) =>
        item.locations.some((loc) => loc.is_low_stock)
      )
    }

    return items
  } else if (stockData.value) {
    let items = stockData.value.stock

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      items = items.filter(
        (item) =>
          item.item_name.toLowerCase().includes(query) ||
          item.item_code.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (selectedCategory.value) {
      items = items.filter((item) => item.item_category === selectedCategory.value)
    }

    // Apply low stock filter
    if (showLowStockOnly.value) {
      items = items.filter((item) => item.is_low_stock === true)
    }

    return items
  }

  return []
})

const totalInventoryValue = computed(() => {
  if (viewMode.value === 'consolidated' && consolidatedData.value) {
    return consolidatedData.value.grand_total_value
  } else if (stockData.value) {
    return stockData.value.total_value
  }
  return 0
})

const totalItems = computed(() => {
  if (viewMode.value === 'consolidated' && consolidatedData.value) {
    return filteredStock.value.length
  } else if (stockData.value) {
    return filteredStock.value.length
  }
  return 0
})

// Table columns for single location view
const stockColumns = [
  {
    accessorKey: 'item_code',
    header: 'Code',
  },
  {
    accessorKey: 'item_name',
    header: 'Item Name',
  },
  {
    accessorKey: 'item_unit',
    header: 'Unit',
  },
  {
    accessorKey: 'item_category',
    header: 'Category',
  },
  {
    accessorKey: 'on_hand',
    header: 'On Hand',
  },
  {
    accessorKey: 'wac',
    header: 'WAC',
  },
  {
    accessorKey: 'value',
    header: 'Total Value',
  },
]

// Table columns for consolidated view
const consolidatedColumns = [
  {
    accessorKey: 'item_code',
    header: 'Code',
  },
  {
    accessorKey: 'item_name',
    header: 'Item Name',
  },
  {
    accessorKey: 'item_unit',
    header: 'Unit',
  },
  {
    accessorKey: 'item_category',
    header: 'Category',
  },
  {
    accessorKey: 'total_on_hand',
    header: 'Total On Hand',
  },
  {
    accessorKey: 'total_value',
    header: 'Total Value',
  },
  {
    accessorKey: 'locations',
    header: 'Locations',
  },
]

// Methods
const fetchStockData = async () => {
  if (!activeLocationId.value && viewMode.value === 'single') {
    return
  }

  loading.value = true
  error.value = null

  try {
    if (viewMode.value === 'consolidated') {
      // Fetch consolidated stock
      const params = new URLSearchParams()
      if (selectedCategory.value) {
        params.append('category', selectedCategory.value)
      }
      if (showLowStockOnly.value) {
        params.append('lowStock', 'true')
      }

      const data = await $fetch<ConsolidatedStockResponse>(
        `/api/stock/consolidated?${params.toString()}`
      )
      consolidatedData.value = data

      // Extract categories from consolidated data
      const categorySet = new Set<string>()
      data.consolidated_stock.forEach((item) => {
        if (item.item_category) {
          categorySet.add(item.item_category)
        }
      })
      categories.value = Array.from(categorySet).sort()
    } else {
      // Fetch single location stock
      const params = new URLSearchParams()
      if (selectedCategory.value) {
        params.append('category', selectedCategory.value)
      }
      if (showLowStockOnly.value) {
        params.append('lowStock', 'true')
      }

      const data = await $fetch<StockResponse>(
        `/api/locations/${activeLocationId.value}/stock?${params.toString()}`
      )
      stockData.value = data

      // Extract categories from stock data
      const categorySet = new Set<string>()
      data.stock.forEach((item) => {
        if (item.item_category) {
          categorySet.add(item.item_category)
        }
      })
      categories.value = Array.from(categorySet).sort()
    }
  } catch (err: any) {
    console.error('Error fetching stock data:', err)
    error.value = err.data?.message || 'Failed to fetch stock data'
    toast.error('Error', error.value)
  } finally {
    loading.value = false
  }
}

const handleLocationChange = (locationId: string) => {
  selectedLocationId.value = locationId
  viewMode.value = 'single'
  fetchStockData()
}

const handleViewModeChange = (mode: 'single' | 'consolidated') => {
  viewMode.value = mode
  if (mode === 'single') {
    selectedLocationId.value = locationStore.activeLocation?.id || ''
  }
  fetchStockData()
}

const applyFilters = () => {
  // Filters are reactive, so just refetch
  // fetchStockData() // Not needed since filters are applied in computed
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  showLowStockOnly.value = false
}

const exportToCSV = () => {
  if (filteredStock.value.length === 0) {
    toast.warning('No Data', 'No stock data to export')
    return
  }

  // Prepare CSV content
  let csvContent = ''

  if (viewMode.value === 'consolidated') {
    // Consolidated view CSV
    csvContent =
      'Item Code,Item Name,Unit,Category,Total On Hand,Total Value,Locations\n'
    filteredStock.value.forEach((item: any) => {
      const locationCount = item.locations?.length || 0
      const row = [
        item.item_code,
        `"${item.item_name}"`,
        item.item_unit,
        item.item_category || '',
        item.total_on_hand.toFixed(4),
        item.total_value.toFixed(2),
        locationCount,
      ].join(',')
      csvContent += row + '\n'
    })
  } else {
    // Single location view CSV
    csvContent =
      'Item Code,Item Name,Unit,Category,On Hand,WAC,Total Value\n'
    filteredStock.value.forEach((item: any) => {
      const row = [
        item.item_code,
        `"${item.item_name}"`,
        item.item_unit,
        item.item_category || '',
        item.on_hand.toFixed(4),
        item.wac.toFixed(4),
        item.value.toFixed(2),
      ].join(',')
      csvContent += row + '\n'
    })
  }

  // Create and download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute(
    'download',
    `stock-${viewMode.value}-${new Date().toISOString().split('T')[0]}.csv`
  )
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  toast.success('Exported', 'Stock data exported to CSV')
}

// Lifecycle
onMounted(() => {
  // Fetch location store data first if not loaded
  if (locationStore.userLocations.length === 0) {
    locationStore.fetchUserLocations().then(() => {
      fetchStockData()
    })
  } else {
    fetchStockData()
  }
})

// Watch for active location changes
watch(
  () => locationStore.activeLocation,
  () => {
    if (viewMode.value === 'single' && !selectedLocationId.value) {
      fetchStockData()
    }
  }
)
</script>

<template>
  <div class="p-4 md:p-6 max-w-7xl mx-auto">
    <!-- Page Header -->
    <div class="page-header-section">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-package" class="text-3xl text-[var(--ui-primary)]" />
          <div>
            <h1 class="page-title">Stock Now</h1>
            <p class="page-subtitle">Real-time inventory levels</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- View Mode Toggle (Supervisor/Admin only) -->
          <UFieldGroup v-if="isAtLeastSupervisor" size="sm">
            <UButton
              :color="viewMode === 'single' ? 'primary' : 'neutral'"
              :variant="viewMode === 'single' ? 'solid' : 'outline'"
              @click="handleViewModeChange('single')"
            >
              Single Location
            </UButton>
            <UButton
              :color="viewMode === 'consolidated' ? 'primary' : 'neutral'"
              :variant="viewMode === 'consolidated' ? 'solid' : 'outline'"
              @click="handleViewModeChange('consolidated')"
            >
              All Locations
            </UButton>
          </UFieldGroup>

          <!-- Export Button -->
          <UButton
            icon="i-lucide-download"
            color="neutral"
            variant="outline"
            @click="exportToCSV"
            :disabled="loading || totalItems === 0"
          >
            Export CSV
          </UButton>
        </div>
      </div>

      <!-- Location Selector (when in single location mode and supervisor/admin) -->
      <div
        v-if="isAtLeastSupervisor && viewMode === 'single'"
        class="mt-4"
      >
        <UFormField label="Select Location">
          <USelectMenu
            v-model="selectedLocationId"
            :options="locationStore.userLocations.map((loc) => ({
              label: `${loc.name} (${loc.code})`,
              value: loc.id,
            }))"
            placeholder="Select a location"
            value-attribute="value"
            @update:model-value="handleLocationChange"
          />
        </UFormField>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Total Inventory Value -->
      <div class="card-elevated p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-[var(--ui-text-muted)]">Total Inventory Value</p>
            <p class="text-2xl font-bold text-[var(--ui-primary)] mt-1">
              {{ formatCurrency(totalInventoryValue) }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-[var(--ui-primary)]/10 flex items-center justify-center">
            <UIcon name="i-lucide-coins" class="text-2xl text-[var(--ui-primary)]" />
          </div>
        </div>
      </div>

      <!-- Total Items -->
      <div class="card-elevated p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-[var(--ui-text-muted)]">Total Items</p>
            <p class="text-2xl font-bold text-[var(--ui-text)] mt-1">
              {{ totalItems }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <UIcon name="i-lucide-boxes" class="text-2xl text-emerald-500" />
          </div>
        </div>
      </div>

      <!-- Locations (consolidated view only) -->
      <div
        v-if="viewMode === 'consolidated' && consolidatedData"
        class="card-elevated p-6"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-[var(--ui-text-muted)]">Active Locations</p>
            <p class="text-2xl font-bold text-[var(--ui-text)] mt-1">
              {{ consolidatedData.total_locations }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <UIcon name="i-lucide-map-pin" class="text-2xl text-blue-500" />
          </div>
        </div>
      </div>

      <!-- Current Location (single view only) -->
      <div
        v-else-if="stockData?.location"
        class="card-elevated p-6"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-[var(--ui-text-muted)]">Current Location</p>
            <p class="text-lg font-semibold text-[var(--ui-text)] mt-1">
              {{ stockData.location.name }}
            </p>
            <p class="text-xs text-[var(--ui-text-muted)]">
              {{ stockData.location.code }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <UIcon name="i-lucide-warehouse" class="text-2xl text-blue-500" />
          </div>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="card-elevated p-6 mb-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <!-- Search -->
        <UFormField label="Search">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Search by item name or code..."
          />
        </UFormField>

        <!-- Category Filter -->
        <UFormField label="Category">
          <USelectMenu
            v-model="selectedCategory"
            :options="[
              { label: 'All Categories', value: '' },
              ...categories.map((cat) => ({ label: cat, value: cat })),
            ]"
            placeholder="Filter by category"
            value-attribute="value"
          />
        </UFormField>

        <!-- Low Stock Toggle -->
        <UFormField label="Stock Status">
          <UCheckbox
            v-model="showLowStockOnly"
            label="Show low stock only"
          />
        </UFormField>

        <!-- Filter Actions -->
        <UFormField label="Actions">
          <div class="flex gap-2">
            <UButton
              color="neutral"
              variant="outline"
              @click="clearFilters"
              block
            >
              Clear
            </UButton>
          </div>
        </UFormField>
      </div>
    </div>

    <!-- Stock Table -->
    <div class="card-elevated">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <CommonLoadingSpinner size="lg" text="Loading stock data..." />
      </div>

      <!-- Error State -->
      <div v-else-if="error">
        <CommonErrorAlert
          :message="error"
          :retry="fetchStockData"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredStock.length === 0"
        class="py-16"
      >
        <CommonEmptyState
          icon="i-lucide-package-x"
          title="No stock data"
          :description="
            searchQuery || selectedCategory || showLowStockOnly
              ? 'No items match your filters. Try adjusting your search criteria.'
              : 'No stock data available for this location.'
          "
        />
      </div>

      <!-- Stock Table - Single Location View -->
      <div v-else-if="viewMode === 'single'" class="p-6">
        <UTable
          :columns="stockColumns"
          :data="filteredStock"
          class="w-full"
        >
          <!-- Item Code -->
          <template #item_code-data="{ row }">
            <span class="font-mono text-sm">{{ row.item_code }}</span>
          </template>

          <!-- Item Name -->
          <template #item_name-data="{ row }">
            <div>
              <p class="font-medium">{{ row.item_name }}</p>
              <p v-if="row.item_sub_category" class="text-xs text-[var(--ui-text-muted)]">
                {{ row.item_sub_category }}
              </p>
            </div>
          </template>

          <!-- Unit -->
          <template #item_unit-data="{ row }">
            <span class="text-sm">{{ row.item_unit }}</span>
          </template>

          <!-- Category -->
          <template #item_category-data="{ row }">
            <UBadge v-if="row.item_category" color="neutral" variant="subtle">
              {{ row.item_category }}
            </UBadge>
            <span v-else class="text-[var(--ui-text-muted)]">-</span>
          </template>

          <!-- On Hand -->
          <template #on_hand-data="{ row }">
            <div class="flex items-center gap-2">
              <span class="font-semibold">{{ formatQuantity(row.on_hand) }}</span>
              <UBadge
                v-if="row.is_low_stock"
                color="error"
                variant="subtle"
                size="xs"
              >
                Low
              </UBadge>
            </div>
          </template>

          <!-- WAC -->
          <template #wac-data="{ row }">
            <span class="text-sm">{{ formatCurrency(row.wac) }}</span>
          </template>

          <!-- Value -->
          <template #value-data="{ row }">
            <span class="font-semibold">{{ formatCurrency(row.value) }}</span>
          </template>
        </UTable>
      </div>

      <!-- Stock Table - Consolidated View -->
      <div v-else-if="viewMode === 'consolidated'" class="p-6">
        <UTable
          :columns="consolidatedColumns"
          :data="filteredStock"
          class="w-full"
        >
          <!-- Item Code -->
          <template #item_code-data="{ row }">
            <span class="font-mono text-sm">{{ row.item_code }}</span>
          </template>

          <!-- Item Name -->
          <template #item_name-data="{ row }">
            <div>
              <p class="font-medium">{{ row.item_name }}</p>
              <p v-if="row.item_sub_category" class="text-xs text-[var(--ui-text-muted)]">
                {{ row.item_sub_category }}
              </p>
            </div>
          </template>

          <!-- Unit -->
          <template #item_unit-data="{ row }">
            <span class="text-sm">{{ row.item_unit }}</span>
          </template>

          <!-- Category -->
          <template #item_category-data="{ row }">
            <UBadge v-if="row.item_category" color="neutral" variant="subtle">
              {{ row.item_category }}
            </UBadge>
            <span v-else class="text-[var(--ui-text-muted)]">-</span>
          </template>

          <!-- Total On Hand -->
          <template #total_on_hand-data="{ row }">
            <span class="font-semibold">{{ formatQuantity(row.total_on_hand) }}</span>
          </template>

          <!-- Total Value -->
          <template #total_value-data="{ row }">
            <span class="font-semibold">{{ formatCurrency(row.total_value) }}</span>
          </template>

          <!-- Locations -->
          <template #locations-data="{ row }">
            <div class="flex flex-wrap gap-1">
              <UBadge
                v-for="loc in row.locations"
                :key="loc.location_id"
                :color="loc.is_low_stock ? 'error' : 'neutral'"
                variant="subtle"
                size="xs"
                :title="`${loc.location_name}: ${formatQuantity(loc.on_hand)} @ ${formatCurrency(loc.wac)}`"
              >
                {{ loc.location_code }}
              </UBadge>
            </div>
          </template>
        </UTable>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--ui-border);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ui-text);
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--ui-text-muted);
}
</style>
