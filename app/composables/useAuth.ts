import { useAuthStore } from "~/stores/auth";
import type { SessionUser } from "~/stores/auth";

/**
 * Auth Composable
 *
 * Provides a convenient wrapper around the auth store with helper methods
 * for authentication and authorization checks.
 *
 * Usage:
 * ```ts
 * const auth = useAuth();
 *
 * // Check authentication
 * if (auth.isAuthenticated.value) { ... }
 *
 * // Check roles
 * if (auth.isAdmin.value) { ... }
 * if (auth.hasRole('SUPERVISOR')) { ... }
 *
 * // Check location access
 * if (auth.hasLocationAccess(locationId)) { ... }
 *
 * // Login/Logout
 * await auth.login(email, password);
 * await auth.logout();
 * ```
 */
export const useAuth = () => {
  const authStore = useAuthStore();

  return {
    // ===========================
    // State Properties
    // ===========================

    /**
     * Current authenticated user
     */
    user: computed(() => authStore.user),

    /**
     * Loading state for auth operations
     */
    loading: computed(() => authStore.loading),

    /**
     * Error message if auth operation failed
     */
    error: computed(() => authStore.error),

    /**
     * Check if user is authenticated
     */
    isAuthenticated: computed(() => authStore.isAuthenticated),

    /**
     * Get the user's role
     */
    role: computed(() => authStore.role),

    /**
     * Get the user's accessible locations
     */
    locations: computed(() => authStore.locations),

    /**
     * User's full name
     */
    fullName: computed(() => authStore.fullName),

    /**
     * User's default location
     */
    defaultLocation: computed(() => authStore.defaultLocation),

    // ===========================
    // Role Check Helpers
    // ===========================

    /**
     * Check if user is an admin
     */
    isAdmin: computed(() => authStore.isAdmin),

    /**
     * Check if user is a supervisor
     */
    isSupervisor: computed(() => authStore.isSupervisor),

    /**
     * Check if user is an operator
     */
    isOperator: computed(() => authStore.isOperator),

    /**
     * Check if user has a specific role
     * @param role - Role to check ('ADMIN', 'SUPERVISOR', or 'OPERATOR')
     * @returns boolean
     */
    hasRole: (role: "ADMIN" | "SUPERVISOR" | "OPERATOR"): boolean => {
      return authStore.role === role;
    },

    /**
     * Check if user has one of the specified roles
     * @param roles - Array of roles to check
     * @returns boolean
     */
    hasAnyRole: (roles: Array<"ADMIN" | "SUPERVISOR" | "OPERATOR">): boolean => {
      return roles.includes(authStore.role as "ADMIN" | "SUPERVISOR" | "OPERATOR");
    },

    /**
     * Check if user is at least a supervisor (SUPERVISOR or ADMIN)
     * @returns boolean
     */
    isAtLeastSupervisor: computed(() => {
      return authStore.role === "SUPERVISOR" || authStore.role === "ADMIN";
    }),

    // ===========================
    // Location Access Helpers
    // ===========================

    /**
     * Check if user has access to a specific location
     * @param locationId - Location ID to check
     * @returns boolean
     */
    hasLocationAccess: (locationId: string): boolean => {
      return authStore.hasLocationAccess(locationId);
    },

    /**
     * Get access level for a specific location
     * @param locationId - Location ID to check
     * @returns Access level ('VIEW', 'POST', 'MANAGE') or null
     */
    getLocationAccessLevel: (locationId: string): "VIEW" | "POST" | "MANAGE" | null => {
      return authStore.getLocationAccessLevel(locationId);
    },

    /**
     * Check if user can post transactions at a location
     * @param locationId - Location ID to check
     * @returns boolean
     */
    canPostAtLocation: (locationId: string): boolean => {
      return authStore.canPostAtLocation(locationId);
    },

    /**
     * Check if user can manage a location
     * @param locationId - Location ID to check
     * @returns boolean
     */
    canManageLocation: (locationId: string): boolean => {
      return authStore.canManageLocation(locationId);
    },

    /**
     * Get all location IDs the user has access to
     * @returns Array of location IDs
     */
    getAccessibleLocationIds: (): string[] => {
      return authStore.getAccessibleLocationIds();
    },

    // ===========================
    // Auth Actions
    // ===========================

    /**
     * Login with email and password
     * @param email - User's email
     * @param password - User's password
     * @returns Promise with success status and optional message
     */
    login: async (
      email: string,
      password: string
    ): Promise<{ success: boolean; message?: string }> => {
      return await authStore.login(email, password);
    },

    /**
     * Logout the current user
     * @returns Promise with success status and optional message
     */
    logout: async (): Promise<{ success: boolean; message?: string }> => {
      return await authStore.logout();
    },

    /**
     * Fetch the current session from the server
     * @returns Promise with success and authenticated status
     */
    fetchSession: async (): Promise<{
      success: boolean;
      authenticated: boolean;
    }> => {
      return await authStore.fetchSession();
    },

    /**
     * Clear any error messages
     */
    clearError: (): void => {
      authStore.clearError();
    },

    // ===========================
    // Convenience Methods
    // ===========================

    /**
     * Check if user can approve transfers
     * (Only supervisors and admins can approve transfers)
     * @returns boolean
     */
    canApproveTransfers: computed(() => {
      return authStore.role === "SUPERVISOR" || authStore.role === "ADMIN";
    }),

    /**
     * Check if user can close periods
     * (Only admins can close periods)
     * @returns boolean
     */
    canClosePeriods: computed(() => {
      return authStore.role === "ADMIN";
    }),

    /**
     * Check if user can manage items and prices
     * (Only admins can manage items and prices)
     * @returns boolean
     */
    canManageItems: computed(() => {
      return authStore.role === "ADMIN";
    }),

    /**
     * Check if user can manage users
     * (Only admins can manage users)
     * @returns boolean
     */
    canManageUsers: computed(() => {
      return authStore.role === "ADMIN";
    }),

    /**
     * Check if user can edit reconciliations
     * (Supervisors and admins can edit reconciliations)
     * @returns boolean
     */
    canEditReconciliations: computed(() => {
      return authStore.role === "SUPERVISOR" || authStore.role === "ADMIN";
    }),

    /**
     * Check if user can post deliveries at a specific location
     * @param locationId - Location ID to check
     * @returns boolean
     */
    canPostDeliveries: (locationId: string): boolean => {
      return authStore.canPostAtLocation(locationId);
    },

    /**
     * Check if user can post issues at a specific location
     * @param locationId - Location ID to check
     * @returns boolean
     */
    canPostIssues: (locationId: string): boolean => {
      return authStore.canPostAtLocation(locationId);
    },
  };
};
