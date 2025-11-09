import { defineStore } from 'pinia'
import type { Location, UserLocation } from '@prisma/client'

// Extended location with access level
export interface LocationWithAccess extends Location {
  access_level?: 'VIEW' | 'POST' | 'MANAGE'
}

export interface LocationState {
  activeLocationId: string | null
  userLocations: LocationWithAccess[]
  loading: boolean
  error: string | null
}

export const useLocationStore = defineStore('location', {
  state: (): LocationState => ({
    activeLocationId: null,
    userLocations: [],
    loading: false,
    error: null
  }),

  getters: {
    // Get the active location object
    activeLocation: (state: LocationState): LocationWithAccess | null => {
      if (!state.activeLocationId) return null
      return state.userLocations.find((loc) => loc.id === state.activeLocationId) || null
    },

    // Check if user has any locations
    hasLocations: (state: LocationState): boolean => {
      return state.userLocations.length > 0
    },

    // Get location by ID
    getLocationById: (state: LocationState) => {
      return (locationId: string): LocationWithAccess | null => {
        return state.userLocations.find((loc) => loc.id === locationId) || null
      }
    }
  },

  actions: {
    /**
     * Fetch user's accessible locations
     */
    async fetchUserLocations() {
      this.loading = true
      this.error = null

      try {
        const response = await $fetch<{ locations: LocationWithAccess[] }>(
          '/api/user/locations',
          {
            method: 'GET'
          }
        )

        this.userLocations = response.locations

        // Set active location if not set
        if (!this.activeLocationId && this.userLocations.length > 0) {
          // Use user's default location if available
          const authStore = useAuthStore()
          const defaultLocationId = authStore.user?.default_location_id

          if (defaultLocationId) {
            const defaultLoc = this.userLocations.find(
              (loc) => loc.id === defaultLocationId
            )
            if (defaultLoc) {
              this.activeLocationId = defaultLocationId
            } else {
              // Fallback to first location
              this.activeLocationId = this.userLocations[0].id
            }
          } else {
            // No default, use first location
            this.activeLocationId = this.userLocations[0].id
          }
        }
      } catch (err: any) {
        this.error = err?.data?.message || 'Failed to fetch locations'
        console.error('Error fetching user locations:', err)
      } finally {
        this.loading = false
      }
    },

    /**
     * Switch to a different location
     */
    async switchLocation(locationId: string) {
      const location = this.getLocationById(locationId)
      if (!location) {
        this.error = 'Location not found'
        return false
      }

      this.activeLocationId = locationId
      this.error = null

      // Optionally, you could persist this choice to user preferences
      // For now, just update the state
      return true
    },

    /**
     * Clear error
     */
    clearError() {
      this.error = null
    },

    /**
     * Reset store state
     */
    reset() {
      this.activeLocationId = null
      this.userLocations = []
      this.loading = false
      this.error = null
    }
  }
})
