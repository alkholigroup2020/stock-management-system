<script setup lang="ts">
import { formatCurrency } from "~/utils/format";

// Props
interface NCRItem {
  id: string;
  ncr_no: string;
  value: number;
  reason: string;
}

interface LocationNCRs {
  locationId: string;
  locationCode: string;
  locationName: string;
  count: number;
  totalValue: number;
  ncrs: NCRItem[];
}

interface OpenNCRWarningData {
  totalCount: number;
  totalValue: number;
  byLocation: LocationNCRs[];
}

const props = defineProps<{
  data: OpenNCRWarningData;
}>();

// State
const expandedLocations = ref<Set<string>>(new Set());

// Methods
function toggleLocation(locationId: string) {
  if (expandedLocations.value.has(locationId)) {
    expandedLocations.value.delete(locationId);
  } else {
    expandedLocations.value.add(locationId);
  }
}

function isLocationExpanded(locationId: string) {
  return expandedLocations.value.has(locationId);
}

function goToNCR(ncrId: string) {
  navigateTo(`/ncrs/${ncrId}`);
}
</script>

<template>
  <UAlert
    icon="i-lucide-alert-triangle"
    color="warning"
    variant="soft"
    title="Open NCRs Detected"
    class="mb-4"
  >
    <template #description>
      <div class="space-y-3">
        <p class="text-sm">
          There are
          <strong>{{ data.totalCount }}</strong>
          open NCR(s) totaling
          <strong>{{ formatCurrency(data.totalValue) }}</strong>
          across locations. These NCRs should be resolved before period close to ensure accurate
          reconciliation.
        </p>

        <!-- Location breakdown -->
        <div class="space-y-2">
          <p class="text-sm font-semibold">Open NCRs by Location:</p>

          <div class="space-y-2">
            <div
              v-for="location in data.byLocation"
              :key="location.locationId"
              class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] p-3"
            >
              <!-- Location header -->
              <button
                @click="toggleLocation(location.locationId)"
                class="w-full flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                :aria-expanded="isLocationExpanded(location.locationId)"
                :aria-controls="`ncr-list-${location.locationId}`"
              >
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="
                      isLocationExpanded(location.locationId)
                        ? 'i-lucide-chevron-down'
                        : 'i-lucide-chevron-right'
                    "
                    class="h-4 w-4"
                  />
                  <span class="text-sm font-medium">
                    {{ location.locationName }} ({{ location.locationCode }})
                  </span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-sm">{{ location.count }} NCR(s)</span>
                  <span class="text-sm font-semibold text-warning">
                    {{ formatCurrency(location.totalValue) }}
                  </span>
                </div>
              </button>

              <!-- Expandable NCR list -->
              <div
                v-if="isLocationExpanded(location.locationId)"
                :id="`ncr-list-${location.locationId}`"
                class="mt-3 space-y-2 border-t border-[var(--ui-border)] pt-3"
              >
                <div
                  v-for="ncr in location.ncrs"
                  :key="ncr.id"
                  class="flex items-start justify-between gap-3 p-2 rounded bg-[var(--ui-bg-muted)] hover:bg-[var(--ui-bg-elevated)] transition-colors"
                >
                  <div class="flex-1 min-w-0">
                    <button
                      @click="goToNCR(ncr.id)"
                      class="text-sm font-medium text-primary hover:underline cursor-pointer"
                    >
                      {{ ncr.ncr_no }}
                    </button>
                    <p class="text-xs text-[var(--ui-text-muted)] mt-1 line-clamp-2">
                      {{ ncr.reason }}
                    </p>
                  </div>
                  <span class="text-sm font-semibold text-error whitespace-nowrap">
                    {{ formatCurrency(ncr.value) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p class="text-xs text-[var(--ui-text-muted)] mt-2">
          Note: This is a non-blocking warning. You can still proceed with period close, but
          resolving these NCRs is recommended for accurate financial reporting.
        </p>
      </div>
    </template>
  </UAlert>
</template>
