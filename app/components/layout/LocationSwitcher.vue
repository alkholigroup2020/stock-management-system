<script setup lang="ts">
import { useLocationStore } from "~/stores/location";

const locationStore = useLocationStore();
const toast = useAppToast();

// Fetch locations on mount
onMounted(async () => {
  if (!locationStore.userLocations.length && !locationStore.loading) {
    await locationStore.fetchUserLocations();
  }
});

// Helper function to get location-specific icon
const getLocationIcon = (type: string): string => {
  const icons: Record<string, string> = {
    KITCHEN: "i-lucide-chef-hat",
    STORE: "i-lucide-store",
    CENTRAL: "i-lucide-warehouse",
    WAREHOUSE: "i-lucide-package-2",
  };
  return icons[type] || "i-lucide-map-pin";
};

// Helper function to get location icon color class
const getLocationIconClass = (type: string): string => {
  const classes: Record<string, string> = {
    KITCHEN: "text-amber-600 dark:text-amber-400",
    STORE: "text-emerald-600 dark:text-emerald-400",
    CENTRAL: "text-navy-600 dark:text-navy-400",
    WAREHOUSE: "text-zinc-600 dark:text-zinc-400",
  };
  return classes[type] || "text-zinc-600 dark:text-zinc-400";
};

// Compute dropdown items for UDropdown
const locationItems = computed(() => {
  if (
    !locationStore.userLocations ||
    locationStore.userLocations.length === 0
  ) {
    return [
      [
        {
          label: "No locations available",
          disabled: true,
          icon: "i-lucide-alert-circle",
        },
      ],
    ];
  }

  return [
    locationStore.userLocations.map((location) => ({
      label: location.name,
      description: location.code,
      icon: getLocationIcon(location.type),
      iconClass: getLocationIconClass(location.type),
      active: location.id === locationStore.activeLocationId,
      click: async () => {
        // Don't switch if already active
        if (location.id === locationStore.activeLocationId) {
          return;
        }

        try {
          const success = await locationStore.switchLocation(location.id);
          if (success) {
            // Show success toast
            toast.success("Location Changed", {
              description: `Switched to ${location.name}`,
            });

            // Refresh page data to reflect new location
            await refreshNuxtData();
          } else {
            toast.error("Error", {
              description: "Failed to switch location",
            });
          }
        } catch (error: unknown) {
          console.error("Error switching location:", error);
          const message =
            error instanceof Error
              ? error.message
              : String(error) || "Failed to switch location";
          toast.error("Error", {
            description: message,
          });
        }
      },
    })),
  ];
});

// Current location for display
const currentLocation = computed(() => {
  return locationStore.activeLocation;
});

// Current location icon
const currentLocationIcon = computed(() => {
  if (!currentLocation.value) return "i-lucide-map-pin";
  return getLocationIcon(currentLocation.value.type);
});
</script>

<template>
  <div class="flex items-center">
    <!-- Loading State -->
    <div v-if="locationStore.loading" class="flex items-center gap-2 px-3 py-2">
      <UIcon name="i-lucide-loader-2" class="animate-spin w-4 h-4" />
      <span class="text-sm text-muted">Loading...</span>
    </div>

    <!-- Location Dropdown -->
    <UDropdown
      v-else-if="currentLocation"
      :items="locationItems"
      :popper="{ placement: 'bottom-start' }"
    >
      <template #default>
        <!-- Desktop: Show full name -->
        <UButton
          color="neutral"
          variant="ghost"
          :label="currentLocation.name"
          trailing-icon="i-lucide-chevron-down"
          class="hidden sm:flex"
        >
          <template #leading>
            <UIcon :name="currentLocationIcon" class="w-4 h-4" />
          </template>
        </UButton>

        <!-- Mobile: Just show icon -->
        <UButton
          color="neutral"
          variant="ghost"
          :icon="currentLocationIcon"
          :aria-label="currentLocation.name"
          class="sm:hidden"
        />
      </template>

      <template #item="{ item }">
        <div class="flex items-center gap-3 w-full">
          <UIcon :name="item.icon" class="w-4 h-4" :class="item.iconClass" />
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm truncate">{{ item.label }}</p>
            <p
              v-if="item.description"
              class="text-xs text-muted truncate"
            >
              {{ item.description }}
            </p>
          </div>
          <UIcon
            v-if="item.active"
            name="i-lucide-check"
            class="w-4 h-4 flex-shrink-0"
            style="color: var(--ui-success)"
          />
        </div>
      </template>
    </UDropdown>

    <!-- No Location State -->
    <div v-else class="flex items-center gap-2 px-3 py-2">
      <UIcon name="i-lucide-alert-circle" class="w-4 h-4 text-amber-500" />
      <span class="text-sm text-muted hidden sm:inline"
        >No location</span
      >
    </div>
  </div>
</template>
