# Stock Management System - User Roles & Permissions

## Overview

This document provides a comprehensive overview of the **User Roles & Permissions** system implemented in the Stock Management System. The system uses a **Role-Based Access Control (RBAC)** model with four distinct user roles, each with specific capabilities and access levels.

> **Status:** ✅ Fully Implemented | **Last Updated:** January 2026

> **Note:** The system implements a **four-tier role hierarchy** where roles have specific capabilities. Higher roles (SUPERVISOR, ADMIN) have implicit access to all locations.

---

## Role Hierarchy

| Role                       | Description                    | Location Access          | Primary Functions                            |
| -------------------------- | ------------------------------ | ------------------------ | -------------------------------------------- |
| **OPERATOR**               | Day-to-day operations staff    | Assigned locations only  | Post deliveries, issues, PRFs, POB entry     |
| **PROCUREMENT_SPECIALIST** | Procurement and ordering staff | All locations (PRF/PO)   | Manage PRFs, create POs from approved PRFs   |
| **SUPERVISOR**             | Team leads and managers        | All locations (implicit) | Approvals, reconciliations, reports          |
| **ADMIN**                  | System administrators          | All locations (implicit) | Full system control, period close, user mgmt |

---

## Detailed Role Permissions

### OPERATOR Role ✅ Implemented

**Purpose:** Handles routine stock operations at assigned locations

#### Capabilities

- ✅ Post deliveries at assigned locations (linked to POs)
- ✅ Post issues (stock consumption) with cost centre tracking
- ✅ Enter POB (People on Board) data
- ✅ Create PRFs (Purchase Request Forms) - types: URGENT, DPA, NORMAL
- ✅ Create NCRs (Non-Conformance Reports) - manual
- ✅ View stock levels at assigned locations
- ✅ Create transfer requests (requires supervisor approval)
- ✅ View reconciliation totals (limited view)
- ✅ Import items via Excel/CSV (bulk upload)
- ✅ Sync stock for issue entry

#### Restrictions

- ❌ Cannot access User Management
- ❌ Cannot access Location Management
- ❌ Cannot access Supplier Management
- ❌ Cannot access Period Management
- ❌ Cannot view consolidated reconciliations
- ❌ Cannot approve transfers or over-deliveries
- ❌ Cannot edit reconciliations
- ❌ Cannot create POs (only PRFs)
- ❌ Cannot send NCR/PO email notifications
- ❌ Limited to explicitly assigned locations

#### Navigation Access

| Menu Item       | Access                 |
| --------------- | ---------------------- |
| Dashboard       | ✅ Yes                 |
| Orders (PRF)    | ✅ Yes (create PRF)    |
| Deliveries      | ✅ Yes                 |
| Issues          | ✅ Yes                 |
| Transfers       | ✅ Yes (create only)   |
| NCR             | ✅ Yes (create/view)   |
| Stock Now       | ✅ Yes                 |
| Items           | ✅ Yes (view + import) |
| POB             | ✅ Yes                 |
| Users           | ❌ No                  |
| Locations       | ❌ No                  |
| Suppliers       | ❌ No                  |
| Periods         | ❌ No                  |
| Period Close    | ❌ No                  |
| Reconciliations | ✅ Limited view        |

---

### PROCUREMENT_SPECIALIST Role ✅ Implemented

**Purpose:** Manages the procurement workflow - PRFs and POs

#### Capabilities

- ✅ View all approved PRFs across locations
- ✅ Create Purchase Orders (POs) from approved PRFs
- ✅ Edit POs (quantities, prices, line items) - while OPEN
- ✅ Send PO email notifications to suppliers
- ✅ View PO status and fulfillment tracking
- ✅ Access all locations for PRF/PO management

#### Restrictions

- ❌ Cannot approve/reject PRFs (Supervisor only)
- ❌ Cannot close POs (Supervisor/Admin only)
- ❌ Cannot post deliveries or issues
- ❌ Cannot manage transfers
- ❌ Cannot access reconciliations
- ❌ Cannot access User/Location/Supplier/Period management
- ❌ Cannot access NCR management
- ❌ Limited to Orders page functionality only

#### Navigation Access

| Menu Item       | Access                          |
| --------------- | ------------------------------- |
| Dashboard       | ✅ Yes                          |
| Orders (PRF/PO) | ✅ Yes (full PRF/PO management) |
| Deliveries      | ❌ No                           |
| Issues          | ❌ No                           |
| Transfers       | ❌ No                           |
| NCR             | ❌ No                           |
| Stock Now       | ❌ No                           |
| Items           | ✅ Yes (view only)              |
| POB             | ❌ No                           |
| Users           | ❌ No                           |
| Locations       | ❌ No                           |
| Suppliers       | ✅ Yes (view only)              |
| Periods         | ❌ No                           |
| Period Close    | ❌ No                           |
| Reconciliations | ❌ No                           |

---

### SUPERVISOR Role ✅ Implemented

**Purpose:** Oversees operations, approves workflows, and manages reconciliations

#### Capabilities

- ✅ All OPERATOR capabilities
- ✅ Approve/reject PRF requests
- ✅ Approve/reject transfer requests
- ✅ Approve over-deliveries (when quantity exceeds PO)
- ✅ Close POs (manual closure with reason)
- ✅ Edit and manage reconciliations
- ✅ View consolidated reconciliations (all locations)
- ✅ Mark locations as ready for period close
- ✅ Update NCR status and resolve NCRs
- ✅ Send NCR email notifications
- ✅ Export reports (CSV)
- ✅ View reports for any location
- ✅ Implicit access to ALL locations

#### Restrictions

- ❌ Cannot manage users (create, edit, deactivate)
- ❌ Cannot manage locations
- ❌ Cannot manage suppliers (create/edit/delete)
- ❌ Cannot close periods (Admin only)
- ❌ Cannot manage item prices
- ❌ Cannot access Period Close functionality
- ❌ Cannot configure notification settings

#### Navigation Access

| Menu Item       | Access                           |
| --------------- | -------------------------------- |
| Dashboard       | ✅ Yes                           |
| Orders (PRF/PO) | ✅ Yes (+ approve PRF, close PO) |
| Deliveries      | ✅ Yes (+ approve over-delivery) |
| Issues          | ✅ Yes                           |
| Transfers       | ✅ Yes (+ approve/reject)        |
| NCR             | ✅ Yes (+ resolve, send email)   |
| Stock Now       | ✅ Yes                           |
| Items           | ✅ Yes (view only)               |
| POB             | ✅ Yes                           |
| Reconciliations | ✅ Yes (+ edit, consolidated)    |
| Reports         | ✅ Yes (+ export)                |
| Users           | ❌ No                            |
| Locations       | ❌ No                            |
| Suppliers       | ✅ Yes (view only)               |
| Periods         | ❌ No                            |
| Period Close    | ❌ No                            |
| Settings        | ❌ No                            |

---

### ADMIN Role ✅ Implemented

**Purpose:** Full system administration and control

#### Capabilities

- ✅ All SUPERVISOR capabilities
- ✅ Create, edit, and deactivate users
- ✅ Assign users to locations (for Operators)
- ✅ Create and manage locations (all 4 types)
- ✅ Create, edit, and delete suppliers
- ✅ Manage item master data (create, edit, deactivate)
- ✅ Set and copy item prices for periods
- ✅ Open and close accounting periods
- ✅ Execute coordinated period close (all locations)
- ✅ Configure notification settings (NCR, PO emails)
- ✅ Test email functionality
- ✅ Full system configuration access
- ✅ View notification history

#### Navigation Access

| Menu Item       | Access                           |
| --------------- | -------------------------------- |
| Dashboard       | ✅ Yes (consolidated view)       |
| Locations       | ✅ Yes (full CRUD)               |
| Users           | ✅ Yes (full CRUD + assign locs) |
| Orders (PRF/PO) | ✅ Yes (full control)            |
| Deliveries      | ✅ Yes (full control)            |
| Issues          | ✅ Yes (full control)            |
| Transfers       | ✅ Yes (full control)            |
| NCR             | ✅ Yes (full control + email)    |
| Stock Now       | ✅ Yes                           |
| Items           | ✅ Yes (full CRUD + prices)      |
| POB             | ✅ Yes                           |
| Suppliers       | ✅ Yes (full CRUD)               |
| Reconciliations | ✅ Yes (full control)            |
| Reports         | ✅ Yes (all reports + export)    |
| Periods         | ✅ Yes (open/close + prices)     |
| Period Close    | ✅ Yes (execute close)           |
| Settings        | ✅ Yes (notification config)     |
| Developer Guide | ✅ Yes                           |
| Help Center     | ✅ Yes                           |

---

## Location Access Model ✅ Implemented

> **Important:** Location access determines which locations a user can view and interact with in the system.

### Access Types

#### Explicit Assignment (Operators Only)

Operators must be explicitly assigned to locations through the **UserLocation** association table. They can only:

- View stock at assigned locations
- Post transactions at assigned locations
- See data relevant to their assigned locations
- Create PRFs for assigned locations
- Create transfer requests FROM assigned locations

#### Implicit Access (Supervisors & Admins)

Supervisors and Admins have **automatic access to all locations** without requiring explicit assignment. This allows them to:

- Oversee operations across the entire organization
- Approve cross-location transfers
- View consolidated reports and reconciliations
- Manage reconciliations at any location
- Approve PRFs and over-deliveries at any location

#### Procurement Specialist Access

Procurement Specialists have access to **all locations for PRF/PO operations only**:

- View approved PRFs from any location
- Create POs for any location
- Send PO emails to suppliers
- Cannot perform stock operations (deliveries, issues, transfers)

---

## Permission Functions Reference ✅ Implemented

The system provides granular permission check functions via `usePermissions()` composable:

### Delivery Permissions

| Function                        | Description                   | Roles                      |
| ------------------------------- | ----------------------------- | -------------------------- |
| `canPostDeliveries(locationId)` | Post deliveries at location   | All (with location access) |
| `canApproveOverDelivery()`      | Approve over-delivery amounts | SUPERVISOR, ADMIN          |

### Issue Permissions

| Function                    | Description             | Roles                      |
| --------------------------- | ----------------------- | -------------------------- |
| `canPostIssues(locationId)` | Post issues at location | All (with location access) |

### PRF/PO Permissions

| Function                   | Description                 | Roles                                     |
| -------------------------- | --------------------------- | ----------------------------------------- |
| `canCreatePRF(locationId)` | Create PRF at location      | OPERATOR, SUPERVISOR, ADMIN               |
| `canApprovePRF()`          | Approve/reject PRF          | SUPERVISOR, ADMIN                         |
| `canCreatePO()`            | Create PO from approved PRF | PROCUREMENT_SPECIALIST, ADMIN             |
| `canEditPO()`              | Edit PO (while OPEN)        | PROCUREMENT_SPECIALIST, ADMIN             |
| `canClosePO()`             | Close PO manually           | SUPERVISOR, ADMIN                         |
| `canSendPOEmail()`         | Send PO email to supplier   | PROCUREMENT_SPECIALIST, SUPERVISOR, ADMIN |

### Item Management

| Function               | Description           | Roles      |
| ---------------------- | --------------------- | ---------- |
| `canEditItems()`       | Edit item master data | ADMIN only |
| `canCreateItems()`     | Create new items      | ADMIN only |
| `canDeactivateItems()` | Deactivate items      | ADMIN only |
| `canSetItemPrices()`   | Set period prices     | ADMIN only |
| `canImportItems()`     | Bulk import items     | All roles  |

### Period Management

| Function                           | Description             | Roles             |
| ---------------------------------- | ----------------------- | ----------------- |
| `canClosePeriod()`                 | Close accounting period | ADMIN only        |
| `canOpenPeriod()`                  | Open new period         | ADMIN only        |
| `canMarkLocationReady(locationId)` | Mark location ready     | SUPERVISOR, ADMIN |
| `canCopyPrices()`                  | Copy prices to period   | ADMIN only        |

### Transfer Permissions

| Function                            | Description              | Roles                      |
| ----------------------------------- | ------------------------ | -------------------------- |
| `canCreateTransfer(fromLocationId)` | Create transfer request  | All (with location access) |
| `canApproveTransfers()`             | Approve/reject transfers | SUPERVISOR, ADMIN          |

### NCR Permissions

| Function                   | Description              | Roles                      |
| -------------------------- | ------------------------ | -------------------------- |
| `canCreateNCR()`           | Create manual NCR        | All (with location access) |
| `canResolveNCR()`          | Resolve NCR with outcome | SUPERVISOR, ADMIN          |
| `canSendNCRNotification()` | Send NCR email           | SUPERVISOR, ADMIN          |

### Reconciliation Permissions

| Function                               | Description              | Roles                      |
| -------------------------------------- | ------------------------ | -------------------------- |
| `canViewReconciliations(locationId)`   | View reconciliation data | All (with location access) |
| `canEditReconciliations(locationId)`   | Edit adjustments         | SUPERVISOR, ADMIN          |
| `canViewConsolidatedReconciliations()` | View all locations       | SUPERVISOR, ADMIN          |

### Administrative Permissions

| Function                      | Description               | Roles      |
| ----------------------------- | ------------------------- | ---------- |
| `canManageUsers()`            | User CRUD operations      | ADMIN only |
| `canAssignUserLocations()`    | Assign users to locations | ADMIN only |
| `canManageLocations()`        | Location CRUD operations  | ADMIN only |
| `canManageSuppliers()`        | Supplier CRUD operations  | ADMIN only |
| `canConfigureNotifications()` | Configure email settings  | ADMIN only |

### Reporting Permissions

| Function                     | Description        | Roles                      |
| ---------------------------- | ------------------ | -------------------------- |
| `canViewReports(locationId)` | View reports       | All (with location access) |
| `canExportReports()`         | Export report data | SUPERVISOR, ADMIN          |

---

## Security Implementation ✅ Implemented

### Server-Side Protection

All permission checks are enforced at the API level:

- **Authentication Middleware:** `server/middleware/auth.ts` - Validates user session on every request
- **Location Access Middleware:** `server/middleware/location-access.ts` - Checks location access
- **Role Access Middleware:** `server/middleware/role-access.ts` - Enforces role restrictions
- **403 Forbidden:** Returned for unauthorized access attempts with error code `LOCATION_ACCESS_DENIED`

### Client-Side Protection

- **Navigation Filtering:** `usePermissions()` composable filters menu items
- **UI Element Hiding:** Buttons and actions conditionally rendered based on role
- **Route Guards:** Client-side middleware in `app/middleware/` redirects unauthorized users
- **Pinia Auth Store:** `app/stores/auth.ts` manages user session state

### Password Security

- **Hashing:** bcrypt with salt rounds
- **Requirements:** 8+ chars, uppercase, lowercase, number, special character
- **Session:** JWT in httpOnly cookies (prevents XSS)

> **Important:** Client-side protections are for UX only. All security enforcement happens server-side to prevent bypassing.

---

## Summary Matrix ✅

| Feature                 | OPERATOR    | PROCUREMENT | SUPERVISOR | ADMIN   |
| ----------------------- | ----------- | ----------- | ---------- | ------- |
| Post Deliveries         | ✅ Assigned | ❌          | ✅ All     | ✅ All  |
| Post Issues             | ✅ Assigned | ❌          | ✅ All     | ✅ All  |
| Enter POB               | ✅ Assigned | ❌          | ✅ All     | ✅ All  |
| Create PRFs             | ✅ Assigned | ❌          | ✅ All     | ✅ All  |
| Approve PRFs            | ❌          | ❌          | ✅         | ✅      |
| Create POs              | ❌          | ✅          | ❌         | ✅      |
| Send PO Emails          | ❌          | ✅          | ✅         | ✅      |
| Close POs               | ❌          | ❌          | ✅         | ✅      |
| Approve Over-Delivery   | ❌          | ❌          | ✅         | ✅      |
| Create Transfers        | ✅ Assigned | ❌          | ✅ All     | ✅ All  |
| Approve Transfers       | ❌          | ❌          | ✅         | ✅      |
| Create NCRs             | ✅ Assigned | ❌          | ✅ All     | ✅ All  |
| Resolve NCRs            | ❌          | ❌          | ✅         | ✅      |
| Send NCR Emails         | ❌          | ❌          | ✅         | ✅      |
| View Reconciliations    | ✅ Totals   | ❌          | ✅ Full    | ✅ Full |
| Edit Reconciliations    | ❌          | ❌          | ✅         | ✅      |
| Consolidated View       | ❌          | ❌          | ✅         | ✅      |
| Export Reports          | ❌          | ❌          | ✅         | ✅      |
| Manage Users            | ❌          | ❌          | ❌         | ✅      |
| Manage Locations        | ❌          | ❌          | ❌         | ✅      |
| Manage Suppliers        | ❌          | ❌          | ❌         | ✅      |
| Manage Items/Prices     | ❌          | ❌          | ❌         | ✅      |
| Period Close            | ❌          | ❌          | ❌         | ✅      |
| Configure Notifications | ❌          | ❌          | ❌         | ✅      |

---

## Location Types

The system supports four location types:

| Type          | Description                |
| ------------- | -------------------------- |
| **KITCHEN**   | Food preparation area      |
| **STORE**     | Storage/warehouse at site  |
| **CENTRAL**   | Central distribution point |
| **WAREHOUSE** | Main warehouse/receiving   |

---

## Document Information

- **System:** Stock Management System v1.0
- **Last Updated:** January 2026
- **Status:** ✅ Production - Fully Implemented
