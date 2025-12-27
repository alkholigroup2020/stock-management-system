<script setup lang="ts">
import { useLocationStore } from "~/stores/location";
import { usePeriodStore } from "~/stores/period";

interface Props {
  title: string;
  subtitle?: string;
  icon?: string;
  showLocation?: boolean;
  showPeriod?: boolean;
  locationScope?: "current" | "all" | "none";
}

const props = withDefaults(defineProps<Props>(), {
  showLocation: true,
  showPeriod: true,
  locationScope: "current",
});

// Get current location and period from stores
const locationStore = useLocationStore();
const periodStore = usePeriodStore();

// Current location name from store
const currentLocation = computed(() => {
  return locationStore.activeLocation?.name || null;
});

// Current period name from store
const currentPeriod = computed(() => {
  return periodStore.periodName;
});

const locationText = computed(() => {
  if (!props.showLocation || props.locationScope === "none") {
    return null;
  }
  if (props.locationScope === "all") {
    return "All Locations";
  }
  return currentLocation.value;
});
</script>

<template>
  <div class="mb-6">
    <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <!-- Left Section: Title, Location, Period -->
      <div>
        <div class="flex items-center gap-3 mb-2">
          <UIcon v-if="icon" :name="icon" class="text-3xl text-primary" />
          <div>
            <h1 class="text-display">{{ title }}</h1>
            <p v-if="subtitle" class="text-caption mt-1">{{ subtitle }}</p>
          </div>
        </div>

        <!-- Location and Period Info -->
        <div v-if="showLocation || showPeriod" class="flex items-center gap-2 text-caption">
          <template v-if="locationText">
            <UIcon name="i-lucide-map-pin" class="w-4 h-4" />
            <span>{{ locationText }}</span>
          </template>
          <template v-if="showPeriod && currentPeriod">
            <span v-if="locationText" class="ml-2">•</span>
            <span>Period: {{ currentPeriod }}</span>
          </template>
        </div>
      </div>

      <!-- Right Section: Action Buttons Slot -->
      <div v-if="$slots.actions" class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
