<script setup lang="ts">
import { useLocationStore } from '~/stores/location'
import { useUIStore } from '~/stores/ui'

const locationStore = useLocationStore()
const uiStore = useUIStore()

// Fetch locations on mount
onMounted(async () => {
  await locationStore.fetchUserLocations()
})

// Compute dropdown items for UDropdown
const locationItems = computed(() => {
  if (!locationStore.userLocations || locationStore.userLocations.length === 0) {
    return [[{
      label: 'No locations available',
      disabled: true
    }]]
  }

  return [locationStore.userLocations.map((location) => ({
    label: location.name,
    description: location.code,
    icon: 'i-heroicons-map-pin',
    active: location.id === locationStore.activeLocationId,
    click: async () => {
      const success = await locationStore.switchLocation(location.id)
      if (success) {
        uiStore.showSuccess('Location switched', `Now viewing ${location.name}`)
      }
    }
  }))]
})

// Current location for display
const currentLocation = computed(() => {
  return locationStore.activeLocation
})
</script>

<template>
  <div class="flex items-center">
    <!-- Loading State -->
    <div v-if="locationStore.loading" class="flex items-center gap-2 px-3 py-2">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
      <span class="text-sm text-[var(--ui-text-muted)]">Loading...</span>
    </div>

    <!-- Location Dropdown -->
    <UDropdown
      v-else-if="currentLocation"
      :items="locationItems"
      :popper="{ placement: 'bottom-start' }"
    >
      <UButton
        color="neutral"
        variant="ghost"
        :label="currentLocation.name"
        trailing-icon="i-heroicons-chevron-down-20-solid"
        class="hidden sm:flex"
      >
        <template #leading>
          <UIcon name="i-heroicons-map-pin" />
        </template>
      </UButton>

      <!-- Mobile: Just show icon -->
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-heroicons-map-pin"
        :aria-label="currentLocation.name"
        class="sm:hidden"
      />
    </UDropdown>

    <!-- No Location State -->
    <div v-else class="flex items-center gap-2 px-3 py-2">
      <UIcon name="i-heroicons-exclamation-triangle" class="text-amber-500" />
      <span class="text-sm text-[var(--ui-text-muted)] hidden sm:inline">No location</span>
    </div>
  </div>
</template>
