import { defineStore } from "pinia";
import type { Location, UserLocation } from "@prisma/client";

// Extended location with access level
export interface LocationWithAccess extends Location {
  access_level?: "VIEW" | "POST" | "MANAGE";
}

export interface LocationState {
  activeLocationId: string | null;
  userLocations: LocationWithAccess[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheTimeout: number; // Cache duration in milliseconds (5 minutes)
}

export const useLocationStore = defineStore("location", {
  state: (): LocationState => ({
    activeLocationId: null,
    userLocations: [],
    loading: false,
    error: null,
    lastFetched: null,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
  }),

  getters: {
    // Get the active location object
    activeLocation: (state: LocationState): LocationWithAccess | null => {
      if (!state.activeLocationId) return null;
      return (
        state.userLocations.find((loc) => loc.id === state.activeLocationId) ||
        null
      );
    },

    // Check if user has any locations
    hasLocations: (state: LocationState): boolean => {
      return state.userLocations.length > 0;
    },

    // Get location by ID
    getLocationById: (state: LocationState) => {
      return (locationId: string): LocationWithAccess | null => {
        return state.userLocations.find((loc) => loc.id === locationId) || null;
      };
    },

    // Check if cache is still valid
    isCacheValid: (state: LocationState): boolean => {
      if (!state.lastFetched) return false;
      const now = Date.now();
      return now - state.lastFetched < state.cacheTimeout;
    },
  },

  actions: {
    /**
     * Fetch user's accessible locations with caching
     * @param forceRefresh - Skip cache and force a fresh fetch
     */
    async fetchUserLocations(forceRefresh = false) {
      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && this.isCacheValid && this.userLocations.length > 0) {
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const response = await $fetch<{ locations: LocationWithAccess[] }>(
          "/api/user/locations",
          {
            method: "GET",
          }
        );

        this.userLocations = response.locations;
        this.lastFetched = Date.now();

        // Set active location if not set
        if (!this.activeLocationId && this.userLocations.length > 0) {
          // Use user's default location if available
          const authStore = useAuthStore();
          const defaultLocationId = authStore.user?.default_location_id;

          if (defaultLocationId) {
            const defaultLoc = this.userLocations.find(
              (loc) => loc.id === defaultLocationId
            );
            if (defaultLoc) {
              this.activeLocationId = defaultLocationId;
            } else if (this.userLocations.length > 0) {
              // Fallback to first location
              this.activeLocationId = this.userLocations[0]!.id;
            }
          } else if (this.userLocations.length > 0) {
            // No default, use first location
            this.activeLocationId = this.userLocations[0]!.id;
          }
        }
      } catch (err: any) {
        this.error = err?.data?.message || "Failed to fetch locations";
        console.error("Error fetching user locations:", err);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Switch to a different location
     */
    async switchLocation(locationId: string) {
      const location = this.getLocationById(locationId);
      if (!location) {
        this.error = "Location not found";
        return false;
      }

      this.activeLocationId = locationId;
      this.error = null;

      // Optionally, you could persist this choice to user preferences
      // For now, just update the state
      return true;
    },

    /**
     * Clear error
     */
    clearError() {
      this.error = null;
    },

    /**
     * Reset store state
     */
    reset() {
      this.activeLocationId = null;
      this.userLocations = [];
      this.loading = false;
      this.error = null;
      this.lastFetched = null;
    },

    /**
     * Invalidate cache and force refetch on next access
     */
    invalidateCache() {
      this.lastFetched = null;
    },
  },
});
