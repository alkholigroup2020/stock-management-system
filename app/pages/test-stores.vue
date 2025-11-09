<template>
  <div class="min-h-screen bg-[var(--ui-bg)] p-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Page Header -->
      <div class="bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-lg p-6">
        <h1 class="text-3xl font-bold text-[var(--ui-text)]">
          Global Stores Test Page
        </h1>
        <p class="text-[var(--ui-text-muted)] mt-2">
          Testing UI Store, Period Store, and Location Store
        </p>
      </div>

      <!-- UI Store Tests -->
      <div class="bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-lg p-6">
        <h2 class="text-2xl font-bold text-[var(--ui-text)] mb-4">
          UI Store
        </h2>

        <div class="space-y-4">
          <!-- Sidebar State -->
          <div>
            <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-2">
              Sidebar State
            </h3>
            <div class="flex items-center gap-4">
              <p class="text-[var(--ui-text-muted)]">
                Desktop Sidebar Collapsed:
                <span class="font-mono text-[var(--ui-text)]">{{ uiStore.sidebarCollapsed }}</span>
              </p>
              <UButton
                @click="uiStore.toggleSidebar()"
                color="primary"
                size="sm"
              >
                Toggle Desktop Sidebar
              </UButton>
            </div>
            <div class="flex items-center gap-4 mt-2">
              <p class="text-[var(--ui-text-muted)]">
                Mobile Sidebar Open:
                <span class="font-mono text-[var(--ui-text)]">{{ uiStore.mobileSidebarOpen }}</span>
              </p>
              <UButton
                @click="uiStore.toggleMobileSidebar()"
                color="primary"
                size="sm"
              >
                Toggle Mobile Sidebar
              </UButton>
            </div>
          </div>

          <!-- Toast Queue -->
          <div>
            <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-2">
              Toast Notifications
            </h3>
            <div class="flex gap-2 flex-wrap">
              <UButton @click="uiStore.showSuccess('Success!', 'This is a success message')" color="success" size="sm">
                Success Toast
              </UButton>
              <UButton @click="uiStore.showError('Error!', 'This is an error message')" color="error" size="sm">
                Error Toast
              </UButton>
              <UButton @click="uiStore.showWarning('Warning!', 'This is a warning message')" color="warning" size="sm">
                Warning Toast
              </UButton>
              <UButton @click="uiStore.showInfo('Info!', 'This is an info message')" color="primary" size="sm">
                Info Toast
              </UButton>
            </div>
            <p class="text-[var(--ui-text-muted)] mt-2">
              Active Toasts:
              <span class="font-mono text-[var(--ui-text)]">{{ uiStore.activeToasts.length }}</span>
            </p>
          </div>

          <!-- Modal State -->
          <div>
            <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-2">
              Modal Management
            </h3>
            <div class="flex gap-2 flex-wrap">
              <UButton @click="openTestModal('test-modal-1')" color="primary" size="sm">
                Open Modal 1
              </UButton>
              <UButton @click="openTestModal('test-modal-2')" color="primary" size="sm">
                Open Modal 2
              </UButton>
              <UButton @click="uiStore.closeModal('test-modal-1')" variant="outline" size="sm">
                Close Modal 1
              </UButton>
              <UButton @click="uiStore.closeModal('test-modal-2')" variant="outline" size="sm">
                Close Modal 2
              </UButton>
            </div>
            <div class="mt-2 space-y-1">
              <p class="text-[var(--ui-text-muted)]">
                Modal 1 Open:
                <span class="font-mono text-[var(--ui-text)]">{{ uiStore.isModalOpen('test-modal-1') }}</span>
              </p>
              <p class="text-[var(--ui-text-muted)]">
                Modal 2 Open:
                <span class="font-mono text-[var(--ui-text)]">{{ uiStore.isModalOpen('test-modal-2') }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Period Store Tests -->
      <div class="bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-lg p-6">
        <h2 class="text-2xl font-bold text-[var(--ui-text)] mb-4">
          Period Store
        </h2>

        <div class="space-y-4">
          <!-- Fetch Period -->
          <div>
            <UButton
              @click="periodStore.fetchCurrentPeriod()"
              :loading="periodStore.loading"
              color="primary"
            >
              Fetch Current Period
            </UButton>
            <UButton
              @click="periodStore.refresh()"
              :loading="periodStore.loading"
              color="secondary"
              class="ml-2"
            >
              Refresh Period
            </UButton>
          </div>

          <!-- Period Info -->
          <div v-if="periodStore.currentPeriod" class="space-y-2">
            <p class="text-[var(--ui-text-muted)]">
              Period Name:
              <span class="font-semibold text-[var(--ui-text)]">{{ periodStore.periodName }}</span>
            </p>
            <p class="text-[var(--ui-text-muted)]">
              Status:
              <UBadge
                :color="periodStore.isPeriodOpen ? 'success' : 'warning'"
                variant="subtle"
              >
                {{ periodStore.periodStatus }}
              </UBadge>
            </p>
            <p class="text-[var(--ui-text-muted)]">
              Date Range:
              <span class="font-mono text-[var(--ui-text)]">{{ periodStore.periodDateRange }}</span>
            </p>
            <p class="text-[var(--ui-text-muted)]">
              Days Remaining:
              <span class="font-semibold text-[var(--ui-text)]">{{ periodStore.daysRemaining }}</span>
            </p>
          </div>

          <!-- No Period -->
          <div v-else-if="!periodStore.loading">
            <UAlert
              title="No Active Period"
              description="There is no current open period in the system."
              color="warning"
            />
          </div>

          <!-- Error -->
          <div v-if="periodStore.error">
            <UAlert
              title="Error"
              :description="periodStore.error"
              color="error"
              :actions="[{ label: 'Clear', onClick: () => periodStore.clearError() }]"
            />
          </div>
        </div>
      </div>

      <!-- Location Store Tests -->
      <div class="bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-lg p-6">
        <h2 class="text-2xl font-bold text-[var(--ui-text)] mb-4">
          Location Store
        </h2>

        <div class="space-y-4">
          <!-- Fetch Locations -->
          <div>
            <UButton
              @click="locationStore.fetchUserLocations()"
              :loading="locationStore.loading"
              color="primary"
            >
              Fetch User Locations
            </UButton>
          </div>

          <!-- Active Location -->
          <div v-if="locationStore.activeLocation">
            <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-2">
              Active Location
            </h3>
            <div class="space-y-2">
              <p class="text-[var(--ui-text-muted)]">
                Code:
                <span class="font-mono text-[var(--ui-text)]">{{ locationStore.activeLocation.code }}</span>
              </p>
              <p class="text-[var(--ui-text-muted)]">
                Name:
                <span class="font-semibold text-[var(--ui-text)]">{{ locationStore.activeLocation.name }}</span>
              </p>
              <p class="text-[var(--ui-text-muted)]">
                Type:
                <UBadge color="primary" variant="subtle">
                  {{ locationStore.activeLocation.type }}
                </UBadge>
              </p>
              <p class="text-[var(--ui-text-muted)]">
                Access Level:
                <UBadge color="success" variant="subtle">
                  {{ locationStore.activeLocation.access_level || 'FULL' }}
                </UBadge>
              </p>
            </div>
          </div>

          <!-- All Locations -->
          <div v-if="locationStore.hasLocations">
            <h3 class="text-lg font-semibold text-[var(--ui-text)] mb-2">
              All User Locations ({{ locationStore.userLocations.length }})
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="location in locationStore.userLocations"
                :key="location.id"
                class="p-4 border border-[var(--ui-border)] rounded-lg"
                :class="{
                  'bg-navy-50 dark:bg-navy-900/20 border-navy-300 dark:border-navy-700': location.id === locationStore.activeLocationId
                }"
              >
                <p class="font-semibold text-[var(--ui-text)]">{{ location.name }}</p>
                <p class="text-sm text-[var(--ui-text-muted)] font-mono">{{ location.code }}</p>
                <p class="text-sm text-[var(--ui-text-muted)] mt-1">
                  {{ location.type }}
                </p>
                <UButton
                  v-if="location.id !== locationStore.activeLocationId"
                  @click="switchToLocation(location.id)"
                  color="primary"
                  variant="outline"
                  size="xs"
                  class="mt-2"
                >
                  Switch to This Location
                </UButton>
                <UBadge
                  v-else
                  color="success"
                  variant="subtle"
                  class="mt-2"
                >
                  Active
                </UBadge>
              </div>
            </div>
          </div>

          <!-- No Locations -->
          <div v-else-if="!locationStore.loading">
            <UAlert
              title="No Locations"
              description="No locations found for this user."
              color="warning"
            />
          </div>

          <!-- Error -->
          <div v-if="locationStore.error">
            <UAlert
              title="Error"
              :description="locationStore.error"
              color="error"
              :actions="[{ label: 'Clear', onClick: () => locationStore.clearError() }]"
            />
          </div>
        </div>
      </div>

      <!-- Test Results Summary -->
      <div class="bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-lg p-6">
        <h2 class="text-2xl font-bold text-[var(--ui-text)] mb-4">
          Test Results Summary
        </h2>

        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <UIcon
              :name="uiStore ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
              :class="uiStore ? 'text-emerald-500' : 'text-red-500'"
            />
            <span class="text-[var(--ui-text)]">UI Store: {{ uiStore ? 'Initialized' : 'Not Initialized' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon
              :name="periodStore ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
              :class="periodStore ? 'text-emerald-500' : 'text-red-500'"
            />
            <span class="text-[var(--ui-text)]">Period Store: {{ periodStore ? 'Initialized' : 'Not Initialized' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon
              :name="locationStore ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
              :class="locationStore ? 'text-emerald-500' : 'text-red-500'"
            />
            <span class="text-[var(--ui-text)]">Location Store: {{ locationStore ? 'Initialized' : 'Not Initialized' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUIStore } from '~/stores/ui'
import { usePeriodStore } from '~/stores/period'
import { useLocationStore } from '~/stores/location'

definePageMeta({
  layout: 'default'
})

const uiStore = useUIStore()
const periodStore = usePeriodStore()
const locationStore = useLocationStore()

// Auto-fetch on mount
onMounted(() => {
  periodStore.fetchCurrentPeriod()
  locationStore.fetchUserLocations()
})

// Helper function to open test modal
function openTestModal(modalId: string) {
  uiStore.openModal(modalId, 'TestComponent', { test: 'data' })
}

// Helper function to switch location with toast
async function switchToLocation(locationId: string) {
  const success = await locationStore.switchLocation(locationId)
  if (success) {
    const location = locationStore.getLocationById(locationId)
    uiStore.showSuccess('Location Switched', `Now viewing ${location?.name}`)
  } else {
    uiStore.showError('Switch Failed', locationStore.error || 'Failed to switch location')
  }
}
</script>
