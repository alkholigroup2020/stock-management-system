import { defineStore } from "pinia";

// Type definition for the user object in the session
export interface SessionUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "OPERATOR" | "SUPERVISOR" | "ADMIN";
  default_location_id: string | null;
  default_location: {
    id: string;
    code: string;
    name: string;
    type: string;
  } | null;
  locations: Array<{
    location_id: string;
    access_level: "VIEW" | "POST" | "MANAGE";
  }>;
}

// Auth store state interface
export interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
}

export const useAuthStore = defineStore("auth", {
  // State
  state: (): AuthState => ({
    user: null,
    loading: false,
    error: null,
  }),

  // Getters (Computed Properties)
  getters: {
    /**
     * Check if the user is authenticated
     */
    isAuthenticated: (state: AuthState): boolean => {
      return state.user !== null;
    },

    /**
     * Get the user's role
     */
    role: (state: AuthState): "OPERATOR" | "SUPERVISOR" | "ADMIN" | null => {
      return state.user?.role || null;
    },

    /**
     * Get the user's accessible locations
     */
    locations: (state: AuthState): Array<{ location_id: string; access_level: string }> => {
      return state.user?.locations || [];
    },

    /**
     * Check if the user is an admin
     */
    isAdmin: (state: AuthState): boolean => {
      return state.user?.role === "ADMIN";
    },

    /**
     * Check if the user is a supervisor
     */
    isSupervisor: (state: AuthState): boolean => {
      return state.user?.role === "SUPERVISOR";
    },

    /**
     * Check if the user is an operator
     */
    isOperator: (state: AuthState): boolean => {
      return state.user?.role === "OPERATOR";
    },

    /**
     * Get the user's full name
     */
    fullName: (state: AuthState): string | null => {
      return state.user?.full_name || null;
    },

    /**
     * Get the user's default location
     */
    defaultLocation: (state: AuthState) => {
      return state.user?.default_location || null;
    },
  },

  // Actions
  actions: {
    /**
     * Login action
     * @param email - Email or username
     * @param password - Password
     * @returns Promise with success status
     */
    async login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
      this.loading = true;
      this.error = null;

      try {
        const response = await $fetch("/api/auth/login", {
          method: "POST",
          body: { email, password },
        });

        if (response.success && response.user) {
          this.user = response.user as SessionUser;
          return { success: true };
        }

        this.error = response.message || "Login failed";
        return { success: false, message: this.error };
      } catch (error: any) {
        const errorMessage = error?.data?.message || error?.message || "Login failed";
        this.error = errorMessage;
        return { success: false, message: errorMessage };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Logout action
     * @returns Promise with success status
     */
    async logout(): Promise<{ success: boolean; message?: string }> {
      this.loading = true;
      this.error = null;

      try {
        const response = await $fetch("/api/auth/logout", {
          method: "POST",
        });

        if (response.success) {
          this.user = null;
          return { success: true };
        }

        this.error = response.message || "Logout failed";
        return { success: false, message: this.error };
      } catch (error: any) {
        const errorMessage = error?.data?.message || error?.message || "Logout failed";
        this.error = errorMessage;
        return { success: false, message: errorMessage };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Fetch current session
     * @returns Promise with success status
     */
    async fetchSession(): Promise<{
      success: boolean;
      authenticated: boolean;
    }> {
      this.loading = true;
      this.error = null;

      try {
        const response = await $fetch("/api/auth/session", {
          method: "GET",
        });

        if (response.success) {
          this.user = response.user ? (response.user as SessionUser) : null;
          return { success: true, authenticated: response.authenticated };
        }

        this.error = "Failed to fetch session";
        return { success: false, authenticated: false };
      } catch (error: any) {
        const errorMessage = error?.data?.message || error?.message || "Failed to fetch session";
        this.error = errorMessage;
        this.user = null;
        return { success: false, authenticated: false };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Check if user has access to a specific location
     * @param locationId - Location ID to check
     * @returns boolean
     */
    hasLocationAccess(locationId: string): boolean {
      if (!this.user) return false;

      // Admins and Supervisors have access to all locations
      if (this.user.role === "ADMIN" || this.user.role === "SUPERVISOR") {
        return true;
      }

      // Operators only have access to assigned locations
      return this.user.locations.some(
        (loc: { location_id: string; access_level: string }) => loc.location_id === locationId
      );
    },

    /**
     * Get access level for a specific location
     * @param locationId - Location ID to check
     * @returns Access level or null
     */
    getLocationAccessLevel(locationId: string): "VIEW" | "POST" | "MANAGE" | null {
      if (!this.user) return null;

      // Admins and Supervisors have MANAGE access to all locations
      if (this.user.role === "ADMIN" || this.user.role === "SUPERVISOR") {
        return "MANAGE";
      }

      // Find the location in user's assigned locations
      const userLocation = this.user.locations.find(
        (loc: { location_id: string; access_level: string }) => loc.location_id === locationId
      );
      return userLocation ? (userLocation.access_level as "VIEW" | "POST" | "MANAGE") : null;
    },

    /**
     * Check if user can post transactions at a location
     * @param locationId - Location ID to check
     * @returns boolean
     */
    canPostAtLocation(locationId: string): boolean {
      const accessLevel = this.getLocationAccessLevel(locationId);
      return accessLevel === "POST" || accessLevel === "MANAGE";
    },

    /**
     * Check if user can manage a location
     * @param locationId - Location ID to check
     * @returns boolean
     */
    canManageLocation(locationId: string): boolean {
      const accessLevel = this.getLocationAccessLevel(locationId);
      return accessLevel === "MANAGE";
    },

    /**
     * Get all location IDs the user has access to
     * @returns Array of location IDs
     */
    getAccessibleLocationIds(): string[] {
      if (!this.user) return [];

      // Admins and Supervisors have access to all locations
      // For now, we return their assigned locations or all if they're admin/supervisor
      // In practice, you'd fetch all locations for admin/supervisor
      return this.user.locations.map(
        (loc: { location_id: string; access_level: string }) => loc.location_id
      );
    },

    /**
     * Clear error state
     */
    clearError() {
      this.error = null;
    },
  },
});
