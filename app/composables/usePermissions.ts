/**
 * Permissions Composable
 *
 * Provides granular permission checks for specific business operations
 * in the Stock Management System based on user roles and location access.
 *
 * Role Hierarchy:
 * - OPERATOR: Basic operations (deliveries, issues, POB entry)
 * - SUPERVISOR: All operator functions + approvals, reconciliations, reports
 * - ADMIN: Full system access including items, prices, users, period close
 */

// import type { UserRole } from "@prisma/client";

/**
 * Main permissions composable
 * Returns all permission check functions for use in components
 */
export function usePermissions() {
  const {
    user,
    isAuthenticated,
    // role,
    hasLocationAccess,
    isAdmin,
    isSupervisor,
    // isOperator,
  } = useAuth();

  // ==================== DELIVERY PERMISSIONS ====================

  /**
   * Check if user can post deliveries at a specific location
   *
   * Requirements:
   * - User must be authenticated
   * - User must have at least POST access level to the location
   * - All roles (OPERATOR, SUPERVISOR, ADMIN) can post deliveries
   *
   * @param locationId - Location ID to check (optional, uses default location if not provided)
   * @returns true if user can post deliveries at the location
   */
  const canPostDeliveries = (locationId?: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    const targetLocationId = locationId || user.value.default_location_id;
    if (!targetLocationId) return false;

    // Admins and Supervisors have access to all locations
    if (isAdmin.value || isSupervisor.value) return true;

    // Operators need POST or MANAGE access level
    const accessLevel = user.value.locations.find(
      (loc) => loc.location_id === targetLocationId
    )?.access_level;

    return accessLevel === "POST" || accessLevel === "MANAGE";
  };

  // ==================== ISSUE PERMISSIONS ====================

  /**
   * Check if user can post issues (stock consumption) at a specific location
   *
   * Requirements:
   * - User must be authenticated
   * - User must have at least POST access level to the location
   * - All roles (OPERATOR, SUPERVISOR, ADMIN) can post issues
   *
   * @param locationId - Location ID to check (optional, uses default location if not provided)
   * @returns true if user can post issues at the location
   */
  const canPostIssues = (locationId?: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    const targetLocationId = locationId || user.value.default_location_id;
    if (!targetLocationId) return false;

    // Admins and Supervisors have access to all locations
    if (isAdmin.value || isSupervisor.value) return true;

    // Operators need POST or MANAGE access level
    const accessLevel = user.value.locations.find(
      (loc) => loc.location_id === targetLocationId
    )?.access_level;

    return accessLevel === "POST" || accessLevel === "MANAGE";
  };

  // ==================== ITEM MANAGEMENT PERMISSIONS ====================

  /**
   * Check if user can edit items (master data)
   *
   * Requirements:
   * - User must be ADMIN role
   * - Item management includes: create, update, deactivate items
   *
   * @returns true if user can edit items
   */
  const canEditItems = (): boolean => {
    return isAdmin.value;
  };

  /**
   * Check if user can create new items
   * Alias for canEditItems
   */
  const canCreateItems = (): boolean => {
    return canEditItems();
  };

  /**
   * Check if user can deactivate items
   * Alias for canEditItems
   */
  const canDeactivateItems = (): boolean => {
    return canEditItems();
  };

  /**
   * Check if user can set item prices for a period
   *
   * Requirements:
   * - User must be ADMIN role
   *
   * @returns true if user can set item prices
   */
  const canSetItemPrices = (): boolean => {
    return isAdmin.value;
  };

  // ==================== PERIOD MANAGEMENT PERMISSIONS ====================

  /**
   * Check if user can close a period
   *
   * Requirements:
   * - User must be ADMIN role
   * - Period close is a critical operation requiring highest privileges
   *
   * @returns true if user can close periods
   */
  const canClosePeriod = (): boolean => {
    return isAdmin.value;
  };

  /**
   * Check if user can create/open a new period
   * Alias for canClosePeriod
   */
  const canOpenPeriod = (): boolean => {
    return canClosePeriod();
  };

  /**
   * Check if user can mark a location as ready for period close
   *
   * Requirements:
   * - User must be at least SUPERVISOR
   * - Must have access to the location
   *
   * @param locationId - Location ID to check
   * @returns true if user can mark location ready
   */
  const canMarkLocationReady = (locationId: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;
    if (!isSupervisor.value && !isAdmin.value) return false;

    return hasLocationAccess(locationId);
  };

  // ==================== TRANSFER PERMISSIONS ====================

  /**
   * Check if user can create a transfer request
   *
   * Requirements:
   * - User must be authenticated
   * - User must have access to the source location
   * - All roles can create transfers (requires supervisor approval)
   *
   * @param fromLocationId - Source location ID
   * @returns true if user can create a transfer
   */
  const canCreateTransfer = (fromLocationId: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;
    return hasLocationAccess(fromLocationId);
  };

  /**
   * Check if user can approve or reject transfer requests
   *
   * Requirements:
   * - User must be at least SUPERVISOR
   * - Supervisors and Admins can approve transfers for any location
   *
   * @returns true if user can approve transfers
   */
  const canApproveTransfers = (): boolean => {
    return isSupervisor.value || isAdmin.value;
  };

  // ==================== RECONCILIATION PERMISSIONS ====================

  /**
   * Check if user can edit reconciliations (adjustments)
   *
   * Requirements:
   * - User must be at least SUPERVISOR
   * - Must have access to the location
   *
   * @param locationId - Location ID to check
   * @returns true if user can edit reconciliations
   */
  const canEditReconciliations = (locationId?: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;
    if (!isSupervisor.value && !isAdmin.value) return false;

    if (!locationId) return true; // Admins/Supervisors can edit in general

    return hasLocationAccess(locationId);
  };

  /**
   * Check if user can view consolidated reconciliations (all locations)
   *
   * Requirements:
   * - User must be at least SUPERVISOR
   *
   * @returns true if user can view consolidated reconciliations
   */
  const canViewConsolidatedReconciliations = (): boolean => {
    return isSupervisor.value || isAdmin.value;
  };

  // ==================== POB (People on Board) PERMISSIONS ====================

  /**
   * Check if user can enter POB (People on Board) data
   *
   * Requirements:
   * - User must be authenticated
   * - User must have access to the location
   * - All roles can enter POB data
   *
   * @param locationId - Location ID to check
   * @returns true if user can enter POB
   */
  const canEnterPOB = (locationId?: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    const targetLocationId = locationId || user.value.default_location_id;
    if (!targetLocationId) return false;

    return hasLocationAccess(targetLocationId);
  };

  // ==================== NCR PERMISSIONS ====================

  /**
   * Check if user can create manual NCRs
   *
   * Requirements:
   * - User must be authenticated
   * - User must have access to the location
   * - All roles can create NCRs
   *
   * @param locationId - Location ID to check
   * @returns true if user can create NCRs
   */
  const canCreateNCR = (locationId?: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    const targetLocationId = locationId || user.value.default_location_id;
    if (!targetLocationId) return false;

    return hasLocationAccess(targetLocationId);
  };

  /**
   * Check if user can update NCR status
   *
   * Requirements:
   * - User must be at least SUPERVISOR
   * - Must have access to the location
   *
   * @param locationId - Location ID to check
   * @returns true if user can update NCR status
   */
  const canUpdateNCRStatus = (locationId?: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;
    if (!isSupervisor.value && !isAdmin.value) return false;

    if (!locationId) return true;

    return hasLocationAccess(locationId);
  };

  // ==================== USER MANAGEMENT PERMISSIONS ====================

  /**
   * Check if user can manage users (create, edit, deactivate)
   *
   * Requirements:
   * - User must be ADMIN role
   *
   * @returns true if user can manage users
   */
  const canManageUsers = (): boolean => {
    return isAdmin.value;
  };

  /**
   * Check if user can assign users to locations
   * Alias for canManageUsers
   */
  const canAssignUserLocations = (): boolean => {
    return canManageUsers();
  };

  // ==================== LOCATION MANAGEMENT PERMISSIONS ====================

  /**
   * Check if user can manage locations (create, edit)
   *
   * Requirements:
   * - User must be ADMIN role
   *
   * @returns true if user can manage locations
   */
  const canManageLocations = (): boolean => {
    return isAdmin.value;
  };

  // ==================== SUPPLIER MANAGEMENT PERMISSIONS ====================

  /**
   * Check if user can manage suppliers (create, edit)
   *
   * Requirements:
   * - User must be ADMIN role
   *
   * @returns true if user can manage suppliers
   */
  const canManageSuppliers = (): boolean => {
    return isAdmin.value;
  };

  // ==================== REPORTING PERMISSIONS ====================

  /**
   * Check if user can view reports for a specific location
   *
   * Requirements:
   * - User must be authenticated
   * - User must have access to the location
   *
   * @param locationId - Location ID to check
   * @returns true if user can view reports
   */
  const canViewReports = (locationId?: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    if (!locationId) return true; // All authenticated users can view some reports

    return hasLocationAccess(locationId);
  };

  /**
   * Check if user can export reports
   *
   * Requirements:
   * - User must be at least SUPERVISOR
   *
   * @returns true if user can export reports
   */
  const canExportReports = (): boolean => {
    return isSupervisor.value || isAdmin.value;
  };

  // ==================== STOCK PERMISSIONS ====================

  /**
   * Check if user can view stock levels for a location
   *
   * Requirements:
   * - User must be authenticated
   * - User must have at least VIEW access to the location
   *
   * @param locationId - Location ID to check
   * @returns true if user can view stock
   */
  const canViewStock = (locationId?: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    const targetLocationId = locationId || user.value.default_location_id;
    if (!targetLocationId) return false;

    return hasLocationAccess(targetLocationId);
  };

  // ==================== RETURN ALL PERMISSION FUNCTIONS ====================

  return {
    // Deliveries
    canPostDeliveries,

    // Issues
    canPostIssues,

    // Items
    canEditItems,
    canCreateItems,
    canDeactivateItems,
    canSetItemPrices,

    // Periods
    canClosePeriod,
    canOpenPeriod,
    canMarkLocationReady,

    // Transfers
    canCreateTransfer,
    canApproveTransfers,

    // Reconciliations
    canEditReconciliations,
    canViewConsolidatedReconciliations,

    // POB
    canEnterPOB,

    // NCR
    canCreateNCR,
    canUpdateNCRStatus,

    // Users
    canManageUsers,
    canAssignUserLocations,

    // Locations
    canManageLocations,

    // Suppliers
    canManageSuppliers,

    // Reports
    canViewReports,
    canExportReports,

    // Stock
    canViewStock,
  };
}
