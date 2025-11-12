<template>
  <div class="min-h-screen bg-[var(--ui-bg)] p-4 md:p-6">
    <!-- Page Header -->
    <div class="mb-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-[var(--ui-text)]">
            Items
          </h1>
          <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
            Manage inventory items and view stock levels
          </p>
        </div>

        <!-- Create Item Button (Admin Only) -->
        <div v-if="canEditItems()">
          <UButton
            color="primary"
            size="lg"
            icon="i-heroicons-plus"
            @click="navigateTo('/items/create')"
          >
            Create Item
          </UButton>
        </div>
      </div>
    </div>

    <!-- Filters Card -->
    <UCard class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Search Input -->
        <div class="md:col-span-2">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search by item name or code..."
            size="lg"
            @update:model-value="handleSearch"
          />
        </div>

        <!-- Category Filter -->
        <div>
          <USelectMenu
            v-model="selectedCategory"
            :options="categoryOptions"
            placeholder="All Categories"
            size="lg"
            @update:model-value="handleCategoryChange"
          />
        </div>
      </div>

      <!-- Active Filter Chips -->
      <div v-if="searchQuery || selectedCategory" class="mt-4 flex flex-wrap gap-2">
        <UBadge
          v-if="searchQuery"
          color="primary"
          variant="subtle"
          size="md"
        >
          Search: {{ searchQuery }}
          <button
            class="ml-1 hover:text-[var(--ui-error)]"
            @click="clearSearch"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          </button>
        </UBadge>

        <UBadge
          v-if="selectedCategory"
          color="primary"
          variant="subtle"
          size="md"
        >
          Category: {{ selectedCategory }}
          <button
            class="ml-1 hover:text-[var(--ui-error)]"
            @click="clearCategory"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          </button>
        </UBadge>
      </div>
    </UCard>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="error"
      icon="i-heroicons-exclamation-triangle"
      color="error"
      variant="soft"
      title="Error loading items"
      :description="error || 'An error occurred'"
      :actions="[{
        label: 'Retry',
        onClick: () => fetchItems()
      }]"
    />

    <!-- Empty State -->
    <UCard v-else-if="items.length === 0 && !loading">
      <div class="text-center py-12">
        <UIcon name="i-heroicons-inbox" class="w-16 h-16 mx-auto text-[var(--ui-text-muted)] mb-4" />
        <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-2">
          No items found
        </h3>
        <p class="text-sm text-[var(--ui-text-muted)] mb-6">
          {{ searchQuery || selectedCategory
            ? 'Try adjusting your filters'
            : 'Get started by creating your first item'
          }}
        </p>
        <UButton
          v-if="canEditItems() && !searchQuery && !selectedCategory"
          color="primary"
          @click="navigateTo('/items/create')"
        >
          Create First Item
        </UButton>
        <UButton
          v-else
          variant="soft"
          @click="clearFilters"
        >
          Clear Filters
        </UButton>
      </div>
    </UCard>

    <!-- Items Table -->
    <UCard v-else>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-[var(--ui-border)]">
          <thead>
            <tr class="bg-[var(--ui-bg-elevated)]">
              <th class="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text)] uppercase tracking-wider">
                Code
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text)] uppercase tracking-wider">
                Name
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text)] uppercase tracking-wider">
                Unit
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text)] uppercase tracking-wider">
                Category
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-[var(--ui-text)] uppercase tracking-wider">
                On-Hand
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-[var(--ui-text)] uppercase tracking-wider">
                WAC
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-[var(--ui-text)] uppercase tracking-wider">
                Value
              </th>
              <th v-if="canEditItems()" class="px-4 py-3 text-right text-xs font-semibold text-[var(--ui-text)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)]">
            <tr
              v-for="item in items"
              :key="item.id"
              class="hover:bg-[var(--ui-bg-elevated)] transition-colors cursor-pointer"
              @click="navigateTo(`/items/${item.id}`)"
            >
              <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-[var(--ui-text)]">
                {{ item.code }}
              </td>
              <td class="px-4 py-4 text-sm text-[var(--ui-text)]">
                <div class="flex items-center gap-2">
                  {{ item.name }}
                  <UBadge
                    v-if="!item.is_active"
                    color="neutral"
                    variant="subtle"
                    size="xs"
                  >
                    Inactive
                  </UBadge>
                </div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-[var(--ui-text-muted)]">
                {{ item.unit }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-[var(--ui-text-muted)]">
                {{ item.category || '-' }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-right text-[var(--ui-text)]">
                {{ formatQuantity(getStockData(item).onHand) }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-right text-[var(--ui-text)]">
                {{ formatCurrency(getStockData(item).wac) }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-[var(--ui-text)]">
                {{ formatCurrency(getStockData(item).value) }}
              </td>
              <td v-if="canEditItems()" class="px-4 py-4 whitespace-nowrap text-sm text-right">
                <UButton
                  color="primary"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-pencil-square"
                  @click.stop="navigateTo(`/items/${item.id}/edit`)"
                >
                  Edit
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="mt-6 border-t border-[var(--ui-border)] pt-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <!-- Pagination Info -->
          <div class="text-sm text-[var(--ui-text-muted)]">
            Showing
            <span class="font-medium text-[var(--ui-text)]">
              {{ (pagination.page - 1) * pagination.limit + 1 }}
            </span>
            to
            <span class="font-medium text-[var(--ui-text)]">
              {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
            </span>
            of
            <span class="font-medium text-[var(--ui-text)]">
              {{ pagination.total }}
            </span>
            items
          </div>

          <!-- Pagination Controls -->
          <div class="flex items-center gap-2">
            <UButton
              :disabled="!pagination.hasPrevPage"
              variant="soft"
              icon="i-heroicons-chevron-left"
              @click="goToPage(pagination.page - 1)"
            >
              Previous
            </UButton>

            <!-- Page Numbers -->
            <div class="flex items-center gap-1">
              <template v-for="pageNum in visiblePages" :key="pageNum">
                <UButton
                  v-if="typeof pageNum === 'number'"
                  :variant="pageNum === pagination.page ? 'solid' : 'soft'"
                  :color="pageNum === pagination.page ? 'primary' : 'neutral'"
                  size="sm"
                  @click="goToPage(pageNum)"
                >
                  {{ pageNum }}
                </UButton>
                <span v-else class="px-2 text-[var(--ui-text-muted)]">...</span>
              </template>
            </div>

            <UButton
              :disabled="!pagination.hasNextPage"
              variant="soft"
              icon="i-heroicons-chevron-right"
              trailing
              @click="goToPage(pagination.page + 1)"
            >
              Next
            </UButton>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { Item, LocationStock } from '@prisma/client'

// Type for Item with optional location stock
interface ItemWithStock extends Item {
  location_stock?: Array<LocationStock & {
    location: {
      id: string
      code: string
      name: string
    }
  }>
}

// Composables
const { canEditItems } = usePermissions()
const locationStore = useLocationStore()
const toast = useToast()

// Reactive state
const items = ref<ItemWithStock[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)
const categoryOptions = ref<string[]>([])
const searchTimeout = ref<NodeJS.Timeout | null>(null)

// Pagination state
const pagination = ref({
  total: 0,
  page: 1,
  limit: 50,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
})

/**
 * Fetch items from the API
 */
async function fetchItems() {
  loading.value = true
  error.value = null

  try {
    const params: Record<string, string> = {
      page: String(pagination.value.page),
      limit: String(pagination.value.limit),
      is_active: 'true', // Only show active items by default
    }

    // Add locationId if available to include stock data
    if (locationStore.activeLocationId) {
      params.locationId = locationStore.activeLocationId
    }

    // Add search query if present
    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    // Add category filter if present
    if (selectedCategory.value) {
      params.category = selectedCategory.value
    }

    const response = await $fetch<{
      items: ItemWithStock[]
      pagination: typeof pagination.value
    }>('/api/items', {
      method: 'GET',
      query: params,
    })

    items.value = response.items
    pagination.value = response.pagination

    // Extract unique categories from items for filter
    extractCategories(response.items)
  } catch (err: any) {
    error.value = err?.data?.message || 'Failed to load items'
    console.error('Error fetching items:', err)
    toast.add({
      title: 'Error',
      description: error.value || undefined,
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

/**
 * Extract unique categories from items
 */
function extractCategories(itemsList: ItemWithStock[]) {
  const categories = new Set<string>()

  itemsList.forEach((item) => {
    if (item.category) {
      categories.add(item.category)
    }
  })

  // Only update if we have new categories
  const newCategories = Array.from(categories).sort()
  if (newCategories.length > categoryOptions.value.length) {
    categoryOptions.value = newCategories
  }
}

/**
 * Handle search with debounce
 */
function handleSearch() {
  // Clear existing timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  // Set new timeout
  searchTimeout.value = setTimeout(() => {
    pagination.value.page = 1 // Reset to first page
    fetchItems()
  }, 500) // 500ms debounce
}

/**
 * Handle category filter change
 */
function handleCategoryChange() {
  pagination.value.page = 1 // Reset to first page
  fetchItems()
}

/**
 * Clear search filter
 */
function clearSearch() {
  searchQuery.value = ''
  pagination.value.page = 1
  fetchItems()
}

/**
 * Clear category filter
 */
function clearCategory() {
  selectedCategory.value = null
  pagination.value.page = 1
  fetchItems()
}

/**
 * Clear all filters
 */
function clearFilters() {
  searchQuery.value = ''
  selectedCategory.value = null
  pagination.value.page = 1
  fetchItems()
}

/**
 * Navigate to a specific page
 */
function goToPage(page: number) {
  if (page < 1 || page > pagination.value.totalPages) return
  pagination.value.page = page
  fetchItems()
}

/**
 * Calculate visible page numbers for pagination
 */
const visiblePages = computed(() => {
  const current = pagination.value.page
  const total = pagination.value.totalPages
  const pages: (number | string)[] = []

  if (total <= 7) {
    // Show all pages if total is 7 or less
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)

    if (current > 3) {
      pages.push('...')
    }

    // Show pages around current page
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i)
    }

    if (current < total - 2) {
      pages.push('...')
    }

    // Always show last page
    pages.push(total)
  }

  return pages
})

/**
 * Get stock data for an item
 */
function getStockData(item: ItemWithStock) {
  if (!item.location_stock || item.location_stock.length === 0) {
    return {
      onHand: 0,
      wac: 0,
      value: 0,
    }
  }

  const stock = item.location_stock[0]
  const onHand = Number(stock?.on_hand || 0)
  const wac = Number(stock?.wac || 0)
  const value = onHand * wac

  return {
    onHand,
    wac,
    value,
  }
}

/**
 * Format quantity with appropriate decimal places
 */
function formatQuantity(value: number): string {
  // Show up to 4 decimal places for quantities
  return value.toFixed(4).replace(/\.?0+$/, '')
}

/**
 * Format currency (SAR)
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// Fetch items on mount
onMounted(() => {
  fetchItems()
})

// Watch for location changes
watch(
  () => locationStore.activeLocationId,
  () => {
    // Refetch items when location changes to update stock data
    fetchItems()
  }
)

// Cleanup timeout on unmount
onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
})
</script>
