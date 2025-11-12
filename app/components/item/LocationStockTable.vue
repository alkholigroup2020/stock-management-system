<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-default">
        Stock Levels by Location
      </h3>
      <UBadge v-if="totalLocations > 0" color="primary" variant="subtle">
        {{ totalLocations }} {{ totalLocations === 1 ? 'Location' : 'Locations' }}
      </UBadge>
    </div>

    <!-- Table -->
    <div v-if="locationStock && locationStock.length > 0" class="overflow-x-auto">
      <table class="min-w-full divide-y divide-default">
        <thead class="bg-elevated">
          <tr>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Location
            </th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Type
            </th>
            <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
              On-Hand
            </th>
            <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
              WAC
            </th>
            <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
              Total Value
            </th>
          </tr>
        </thead>
        <tbody class="bg-default divide-y divide-default">
          <tr
            v-for="stock in locationStock"
            :key="stock.location_id"
            class="hover:bg-elevated transition-colors"
          >
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex flex-col">
                <span class="text-sm font-medium text-default">
                  {{ stock.location.name }}
                </span>
                <span class="text-xs text-muted">
                  {{ stock.location.code }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
              <UBadge
                :color="getLocationTypeColor(stock.location.type)"
                variant="subtle"
                size="xs"
              >
                {{ stock.location.type }}
              </UBadge>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-right">
              <span class="text-sm text-default">
                {{ formatQuantity(stock.on_hand) }}
              </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-right">
              <span class="text-sm text-default">
                {{ formatCurrency(stock.wac) }}
              </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-right">
              <span class="text-sm font-medium text-default">
                {{ formatCurrency(calculateTotalValue(stock.on_hand, stock.wac)) }}
              </span>
            </td>
          </tr>
        </tbody>
        <tfoot v-if="showTotals" class="bg-elevated border-t-2 border-default">
          <tr>
            <td colspan="4" class="px-4 py-3 text-right text-sm font-semibold text-default">
              Grand Total:
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-default">
              {{ formatCurrency(grandTotal) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-12 bg-elevated rounded-lg border border-default"
    >
      <div class="text-muted">
        <Icon name="i-heroicons-inbox" class="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p class="text-sm font-medium">No stock data available</p>
        <p class="text-xs mt-1">This item has no stock recorded in any location.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Location {
  id: string
  code: string
  name: string
  type: 'KITCHEN' | 'STORE' | 'CENTRAL' | 'WAREHOUSE'
}

interface LocationStock {
  location_id: string
  item_id: string
  on_hand: number | string
  wac: number | string
  location: Location
}

interface Props {
  locationStock?: LocationStock[]
  showTotals?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  locationStock: () => [],
  showTotals: true,
})

// Computed properties
const totalLocations = computed(() => props.locationStock?.length || 0)

const grandTotal = computed(() => {
  if (!props.locationStock || props.locationStock.length === 0) return 0

  return props.locationStock.reduce((total, stock) => {
    return total + calculateTotalValue(stock.on_hand, stock.wac)
  }, 0)
})

// Helper functions
function formatQuantity(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(num)
}

function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num).replace('SAR', 'SAR ')
}

function calculateTotalValue(onHand: number | string, wac: number | string): number {
  const quantity = typeof onHand === 'string' ? parseFloat(onHand) : onHand
  const cost = typeof wac === 'string' ? parseFloat(wac) : wac
  return quantity * cost
}

function getLocationTypeColor(type: string): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'neutral' {
  const colorMap: Record<string, 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'neutral'> = {
    KITCHEN: 'warning',
    STORE: 'info',
    CENTRAL: 'secondary',
    WAREHOUSE: 'neutral',
  }
  return colorMap[type] || 'neutral'
}
</script>
