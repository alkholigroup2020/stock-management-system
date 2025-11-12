<template>
  <div class="min-h-screen bg-default p-4 md:p-6">
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
      title="Error loading item"
      :description="error || 'An error occurred'"
      :actions="[
        {
          label: 'Back to Items',
          onClick: () => { navigateTo('/items') }
        },
        {
          label: 'Retry',
          onClick: () => { fetchItem() }
        }
      ]"
    />

    <!-- Item Details -->
    <div v-else-if="item" class="space-y-6">
      <!-- Page Header with Breadcrumb -->
      <div>
        <nav class="flex mb-4" aria-label="Breadcrumb">
          <ol class="inline-flex items-center space-x-1 md:space-x-3">
            <li class="inline-flex items-center">
              <button
                class="inline-flex items-center text-sm text-muted hover:text-default"
                @click="navigateTo('/items')"
              >
                <UIcon name="i-heroicons-cube" class="w-4 h-4 mr-2" />
                Items
              </button>
            </li>
            <li aria-current="page">
              <div class="flex items-center">
                <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-muted" />
                <span class="ml-1 text-sm font-medium text-default md:ml-2">
                  {{ item.code }}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl md:text-3xl font-bold text-default">
                {{ item.name }}
              </h1>
              <UBadge
                v-if="!item.is_active"
                color="neutral"
                variant="subtle"
                size="md"
              >
                Inactive
              </UBadge>
            </div>
            <p class="mt-1 text-sm text-muted">
              Item Code: {{ item.code }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div v-if="canEditItems()" class="flex gap-2">
            <UButton
              color="primary"
              variant="outline"
              icon="i-heroicons-pencil-square"
              @click="navigateTo(`/items/${item.id}/edit`)"
            >
              Edit Item
            </UButton>
          </div>
        </div>
      </div>

      <!-- Item Information Card -->
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold text-default">
            Item Information
          </h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Code -->
          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              Item Code
            </label>
            <p class="text-base font-semibold text-default">
              {{ item.code }}
            </p>
          </div>

          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              Item Name
            </label>
            <p class="text-base font-semibold text-default">
              {{ item.name }}
            </p>
          </div>

          <!-- Unit -->
          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              Unit of Measure
            </label>
            <UBadge color="primary" variant="subtle" size="md">
              {{ item.unit }}
            </UBadge>
          </div>

          <!-- Category -->
          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              Category
            </label>
            <p class="text-base text-default">
              {{ item.category || '-' }}
            </p>
          </div>

          <!-- Sub-Category -->
          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              Sub-Category
            </label>
            <p class="text-base text-default">
              {{ item.sub_category || '-' }}
            </p>
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              Status
            </label>
            <UBadge
              :color="item.is_active ? 'success' : 'neutral'"
              variant="subtle"
              size="md"
            >
              {{ item.is_active ? 'Active' : 'Inactive' }}
            </UBadge>
          </div>

          <!-- Created At -->
          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              Created
            </label>
            <p class="text-base text-default">
              {{ formatDate(item.created_at) }}
            </p>
          </div>

          <!-- Updated At -->
          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              Last Updated
            </label>
            <p class="text-base text-default">
              {{ formatDate(item.updated_at) }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Location Stock Card -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-default">
              Stock Levels
            </h2>
            <UButton
              v-if="!showAllLocations && (isAdmin || isSupervisor)"
              color="primary"
              variant="ghost"
              size="xs"
              icon="i-heroicons-arrow-path"
              @click="toggleShowAllLocations"
            >
              {{ loadingStock ? 'Loading...' : 'Show All Locations' }}
            </UButton>
            <UButton
              v-else-if="showAllLocations"
              color="primary"
              variant="ghost"
              size="xs"
              icon="i-heroicons-funnel"
              @click="toggleShowAllLocations"
            >
              Show My Locations
            </UButton>
          </div>
        </template>

        <!-- Loading stock data -->
        <div v-if="loadingStock" class="flex justify-center items-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-primary" />
        </div>

        <!-- Location Stock Table Component -->
        <ItemLocationStockTable
          v-else
          :location-stock="item.location_stock as any"
          :show-totals="true"
        />
      </UCard>

      <!-- Quick Actions Card -->
      <UCard v-if="canPostDeliveries() || canPostIssues()">
        <template #header>
          <h2 class="text-lg font-semibold text-default">
            Quick Actions
          </h2>
        </template>

        <div class="flex flex-wrap gap-3">
          <UButton
            v-if="canPostDeliveries()"
            color="success"
            variant="soft"
            icon="i-heroicons-arrow-down-tray"
            @click="navigateTo('/deliveries/create')"
          >
            Record Delivery
          </UButton>
          <UButton
            v-if="canPostIssues()"
            color="warning"
            variant="soft"
            icon="i-heroicons-arrow-up-tray"
            @click="navigateTo('/issues/create')"
          >
            Record Issue
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Item, LocationStock } from '@prisma/client'
import dayjs from 'dayjs'

// Type for Item with location stock
type LocationStockWithLocation = LocationStock & {
  location: {
    id: string
    code: string
    name: string
    type: 'KITCHEN' | 'STORE' | 'CENTRAL' | 'WAREHOUSE'
  }
}

interface ItemWithStock extends Item {
  location_stock?: LocationStockWithLocation[]
}

// Composables
const route = useRoute()
const { canEditItems, canPostDeliveries, canPostIssues } = usePermissions()
const authStore = useAuthStore()
const toast = useToast()

// Computed properties for roles
const isAdmin = computed(() => authStore.user?.role === 'ADMIN')
const isSupervisor = computed(() => authStore.user?.role === 'SUPERVISOR')

// Reactive state
const item = ref<ItemWithStock | null>(null)
const loading = ref(false)
const loadingStock = ref(false)
const error = ref<string | null>(null)
const showAllLocations = ref(false)

/**
 * Fetch item from the API
 */
async function fetchItem() {
  loading.value = true
  error.value = null

  try {
    const itemId = route.params.id as string

    const params: Record<string, string> = {}

    // Determine whether to include all locations or just user's locations
    if (showAllLocations.value && (isAdmin.value || isSupervisor.value)) {
      params.includeAllStock = 'true'
    }

    const response = await $fetch<{ item: ItemWithStock }>(`/api/items/${itemId}`, {
      method: 'GET',
      query: params,
    })

    item.value = response.item
  } catch (err: any) {
    error.value = err?.data?.message || 'Failed to load item'
    console.error('Error fetching item:', err)
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
 * Toggle showing all locations (for admins/supervisors)
 */
async function toggleShowAllLocations() {
  showAllLocations.value = !showAllLocations.value
  loadingStock.value = true

  try {
    const itemId = route.params.id as string

    const params: Record<string, string> = {}

    if (showAllLocations.value) {
      params.includeAllStock = 'true'
    }

    const response = await $fetch<{ item: ItemWithStock }>(`/api/items/${itemId}`, {
      method: 'GET',
      query: params,
    })

    item.value = response.item
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.data?.message || 'Failed to load stock data',
      color: 'error',
    })
    console.error('Error fetching stock:', err)
  } finally {
    loadingStock.value = false
  }
}

/**
 * Format date for display
 */
function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  return dayjs(date).format('DD/MM/YYYY HH:mm')
}

// Fetch item on mount
onMounted(() => {
  fetchItem()
})

// No need for explicit auth middleware since it's global
</script>
