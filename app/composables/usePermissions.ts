/**
 * Permissions Composable
 *
 * Provides granular permission checks for specific business operations
 * in the Stock Management System based on user roles and location access.
 *
 * Role Hierarchy:
 * - OPERATOR: Basic operations (deliveries, issues, POB entry, PRF creation)
 * - SUPERVISOR: All operator functions + approvals, reconciliations, reports
 * - ADMIN: Full system access including items, prices, users, period close
 * - PROCUREMENT_SPECIALIST: Limited access - PO management, deliveries (view)
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
    isOperator,
    isProcurementSpecialist,
    locations,
  } = useAuth();

  // Helper: Check if Operator has any assigned locations
  // Used for navigation when no specific locationId is provided
  const operatorHasAnyLocation = (): boolean => {
    return isOperator.value && locations.value.length > 0;
  };

  // Helper: Check if Procurement Specialist has any assigned locations
  const procurementSpecialistHasAnyLocation = (): boolean => {
    return isProcurementSpecialist.value && locations.value.length > 0;
  };

  // ==================== DELIVERY PERMISSIONS ====================

  /**
   * Check if user can post deliveries at a specific location
   *
   * Requirements:
   * - User must be authenticated
   * - User must have access to the location
   * - All roles (OPERATOR, SUPERVISOR, ADMIN) can post deliveries
   *
   * @param locationId - Location ID to check (optional, for navigation shows menu if user has any location)
   * @returns true if user can post deliveries at the location
   */
  const canPostDeliveries = (locationId?: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    // Admins and Supervisors have implicit access to all locations
    if (isAdmin.value || isSupervisor.value) return true;

    // If no specific location requested, check if operator has ANY assigned locations
    // This is used for navigation menu visibility
    if (!locationId) {
      return operatorHasAnyLocation();
    }

    // Operators need to be assigned to the specific location
    return hasLocationAccess(locationId);
  };

  // ==================== ISSUE PERMISSIONS ====================

  /**
   * Check if user can post issues (stock consumption) at a specific location
   *
   * Requirements:
   * - User must be authenticated
   * - User must have access to the location
   * - All roles (OPERATOR, SUPERVISOR, ADMIN) can post issues
   *
   * @param locationId - Location ID to check (optional, for navigation shows menu if user has any location)
   * @returns true if user can post issues at the location
   */
  const canPostIssues = (locationId?: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    // Admins and Supervisors have implicit access to all locations
    if (isAdmin.value || isSupervisor.value) return true;

    // If no specific location requested, check if operator has ANY assigned locations
    if (!locationId) {
      return operatorHasAnyLocation();
    }

    // Operators need to be assigned to the specific location
    return hasLocationAccess(locationId);
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
   * @param fromLocationId - Source location ID (optional, for button visibility shows if user has any location)
   * @returns true if user can create a transfer
   */
  const canCreateTransfer = (fromLocationId?: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    // Admins and Supervisors have implicit access to all locations
    if (isAdmin.value || isSupervisor.value) return true;

    // If no specific location requested, check if operator has ANY assigned locations
    if (!fromLocationId) {
      return operatorHasAnyLocation();
    }

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
   * Check if user can view reconciliations (totals only for operators)
   *
   * Requirements:
   * - User must be authenticated
   * - User must have access to the location
   * - All roles can VIEW reconciliations (operators see totals only)
   *
   * @param locationId - Location ID to check (optional, for navigation shows menu if user has any location)
   * @returns true if user can view reconciliations
   */
  const canViewReconciliations = (locationId?: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    // Admins and Supervisors have access to all locations
    if (isAdmin.value || isSupervisor.value) return true;

    // If no specific location requested, check if operator has ANY assigned locations
    if (!locationId) {
      return operatorHasAnyLocation();
    }

    return hasLocationAccess(locationId);
  };

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
   * @param locationId - Location ID to check (optional, for navigation shows menu if user has any location)
   * @returns true if user can enter POB
   */
  const canEnterPOB = (locationId?: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    // Admins and Supervisors have access to all locations
    if (isAdmin.value || isSupervisor.value) return true;

    // If no specific location requested, check if operator has ANY assigned locations
    if (!locationId) {
      return operatorHasAnyLocation();
    }

    return hasLocationAccess(locationId);
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
   * @param locationId - Location ID to check (optional, for navigation shows menu if user has any location)
   * @returns true if user can create NCRs
   */
  const canCreateNCR = (locationId?: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    // Admins and Supervisors have access to all locations
    if (isAdmin.value || isSupervisor.value) return true;

    // If no specific location requested, check if operator has ANY assigned locations
    if (!locationId) {
      return operatorHasAnyLocation();
    }

    return hasLocationAccess(locationId);
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
   * @param locationId - Location ID to check (optional, for navigation shows menu if user has any location)
   * @returns true if user can view reports
   */
  const canViewReports = (locationId?: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    // Admins and Supervisors have access to all locations
    if (isAdmin.value || isSupervisor.value) return true;

    // If no specific location requested, check if operator has ANY assigned locations
    if (!locationId) {
      return operatorHasAnyLocation();
    }

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
   * - User must have access to the location
   *
   * @param locationId - Location ID to check (optional, for navigation shows menu if user has any location)
   * @returns true if user can view stock
   */
  const canViewStock = (locationId?: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    // Admins and Supervisors have access to all locations
    if (isAdmin.value || isSupervisor.value) return true;

    // If no specific location requested, check if operator has ANY assigned locations
    if (!locationId) {
      return operatorHasAnyLocation();
    }

    return hasLocationAccess(locationId);
  };

  // ==================== PRF (PURCHASE REQUISITION FORM) PERMISSIONS ====================

  /**
   * Check if user can view PRFs
   *
   * Requirements:
   * - User must be authenticated
   * - OPERATOR: Can view own PRFs
   * - SUPERVISOR/ADMIN: Can view all PRFs
   * - PROCUREMENT_SPECIALIST: Can view approved PRFs only
   *
   * @returns true if user can view PRFs
   */
  const canViewPRFs = (): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    // All authenticated users can view PRFs (filtered by role on the backend)
    return true;
  };

  /**
   * Check if user can create a PRF
   *
   * Requirements:
   * - User must be authenticated
   * - OPERATOR, SUPERVISOR, ADMIN can create PRFs
   * - PROCUREMENT_SPECIALIST cannot create PRFs
   *
   * @param locationId - Location ID to check (optional)
   * @returns true if user can create PRFs
   */
  const canCreatePRF = (locationId?: string): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    // Procurement Specialists cannot create PRFs
    if (isProcurementSpecialist.value) return false;

    // Admins and Supervisors have implicit access to all locations
    if (isAdmin.value || isSupervisor.value) return true;

    // If no specific location requested, check if operator has ANY assigned locations
    if (!locationId) {
      return operatorHasAnyLocation();
    }

    // Operators need to be assigned to the specific location
    return hasLocationAccess(locationId);
  };

  /**
   * Check if user can edit a PRF (only DRAFT status)
   *
   * Requirements:
   * - User must be authenticated
   * - PRF must be in DRAFT status (checked by caller)
   * - Only the requester or Admin can edit
   *
   * @returns true if user can edit PRFs (role-based check only)
   */
  const canEditPRF = (): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    // Procurement Specialists cannot edit PRFs
    if (isProcurementSpecialist.value) return false;

    // Admins, Supervisors, and Operators can edit their own PRFs
    return true;
  };

  /**
   * Check if user can submit a PRF for approval
   *
   * Requirements:
   * - User must be authenticated
   * - Only the requester can submit (checked by caller with userId)
   * - PROCUREMENT_SPECIALIST cannot submit
   *
   * @returns true if user can submit PRFs (role-based check only)
   */
  const canSubmitPRF = (): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    // Procurement Specialists cannot submit PRFs
    if (isProcurementSpecialist.value) return false;

    return true;
  };

  /**
   * Check if user can approve or reject PRFs
   *
   * Requirements:
   * - User must be SUPERVISOR or ADMIN
   *
   * @returns true if user can approve PRFs
   */
  const canApprovePRF = (): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    return isSupervisor.value || isAdmin.value;
  };

  /**
   * Check if user can clone a rejected PRF
   *
   * Requirements:
   * - User must be authenticated
   * - PROCUREMENT_SPECIALIST cannot clone PRFs
   *
   * @returns true if user can clone PRFs
   */
  const canClonePRF = (): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    // Procurement Specialists cannot clone PRFs
    if (isProcurementSpecialist.value) return false;

    return true;
  };

  // ==================== PO (PURCHASE ORDER) PERMISSIONS ====================

  /**
   * Check if user can view POs
   *
   * Requirements:
   * - User must be authenticated
   * - All roles can view POs
   *
   * @returns true if user can view POs
   */
  const canViewPOs = (): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    return true;
  };

  /**
   * Check if user can create a PO
   *
   * Requirements:
   * - User must be PROCUREMENT_SPECIALIST or ADMIN
   * - POs are created from approved PRFs
   *
   * @returns true if user can create POs
   */
  const canCreatePO = (): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    return isProcurementSpecialist.value || isAdmin.value;
  };

  /**
   * Check if user can edit a PO (only OPEN status)
   *
   * Requirements:
   * - User must be PROCUREMENT_SPECIALIST or ADMIN
   * - PO must be in OPEN status (checked by caller)
   *
   * @returns true if user can edit POs
   */
  const canEditPO = (): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    return isProcurementSpecialist.value || isAdmin.value;
  };

  /**
   * Check if user can close a PO
   *
   * Requirements:
   * - User must be PROCUREMENT_SPECIALIST or ADMIN
   *
   * @returns true if user can close POs
   */
  const canClosePO = (): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    return isProcurementSpecialist.value || isAdmin.value;
  };

  /**
   * Check if user can resend PO email to supplier
   *
   * Requirements:
   * - User must be PROCUREMENT_SPECIALIST or ADMIN
   *
   * @returns true if user can resend PO emails
   */
  const canResendPOEmail = (): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    return isProcurementSpecialist.value || isAdmin.value;
  };

  // ==================== ORDERS PAGE PERMISSIONS ====================

  /**
   * Check if user can access the Orders page
   *
   * Requirements:
   * - User must be authenticated
   * - All roles can access Orders page
   *
   * @returns true if user can access Orders page
   */
  const canAccessOrders = (): boolean => {
    if (!isAuthenticated.value || !user.value) return false;

    return true;
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
    canViewReconciliations,
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

    // PRF (Purchase Requisition Form)
    canViewPRFs,
    canCreatePRF,
    canEditPRF,
    canSubmitPRF,
    canApprovePRF,
    canClonePRF,

    // PO (Purchase Order)
    canViewPOs,
    canCreatePO,
    canEditPO,
    canClosePO,
    canResendPOEmail,

    // Orders Page
    canAccessOrders,
  };
}
