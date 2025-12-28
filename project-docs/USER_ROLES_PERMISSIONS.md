# Stock Management System - User Roles & Permissions

## Overview

This document provides a comprehensive overview of the **User Roles & Permissions** system implemented in the Stock Management System. The system uses a **Role-Based Access Control (RBAC)** model with three distinct user roles, each with specific capabilities and access levels.

> **Note:** The system implements a **three-tier role hierarchy** where each role builds upon the previous one's capabilities. Higher roles have implicit access to all features available to lower roles.

---

## Role Hierarchy

| Role           | Description                 | Location Access          | Primary Functions                   |
| -------------- | --------------------------- | ------------------------ | ----------------------------------- |
| **OPERATOR**   | Day-to-day operations staff | Assigned locations only  | Post deliveries, issues, POB entry  |
| **SUPERVISOR** | Team leads and managers     | All locations (implicit) | Approvals, reconciliations, reports |
| **ADMIN**      | System administrators       | All locations (implicit) | Full system control                 |

---

## Detailed Role Permissions

### OPERATOR Role

**Purpose:** Handles routine stock operations at assigned locations

#### Capabilities

- ✅ Post deliveries at assigned locations
- ✅ Post issues (stock consumption) at assigned locations
- ✅ Enter POB (People on Board) data
- ✅ Create NCRs (Non-Conformance Reports)
- ✅ View stock levels at assigned locations
- ✅ Create transfer requests (requires supervisor approval)
- ✅ View reconciliation totals (limited view)

#### Restrictions

- ❌ Cannot access User Management
- ❌ Cannot access Location Management
- ❌ Cannot access Supplier Management
- ❌ Cannot access Period Management
- ❌ Cannot view consolidated reconciliations
- ❌ Cannot approve transfers
- ❌ Cannot edit reconciliations
- ❌ Limited to explicitly assigned locations

#### Navigation Access

| Menu Item    | Access |
| ------------ | ------ |
| Dashboard    | ✅ Yes |
| Transfers    | ✅ Yes |
| Users        | ❌ No  |
| Locations    | ❌ No  |
| Suppliers    | ❌ No  |
| Periods      | ❌ No  |
| Period Close | ❌ No  |

---

### SUPERVISOR Role

**Purpose:** Oversees operations, approves workflows, and manages reconciliations

#### Capabilities

- ✅ All OPERATOR capabilities
- ✅ Approve/reject transfer requests
- ✅ Edit and manage reconciliations
- ✅ View consolidated reconciliations (all locations)
- ✅ Mark locations as ready for period close
- ✅ Update NCR status
- ✅ Export reports
- ✅ View reports for any location
- ✅ Implicit access to ALL locations

#### Restrictions

- ❌ Cannot manage users (create, edit, deactivate)
- ❌ Cannot manage locations
- ❌ Cannot manage suppliers
- ❌ Cannot close periods
- ❌ Cannot manage item prices
- ❌ Cannot access Period Close functionality

#### Navigation Access

| Menu Item             | Access                  |
| --------------------- | ----------------------- |
| Dashboard             | ✅ Yes                  |
| POB                   | ✅ Yes                  |
| Items & Prices        | ✅ Yes (view only)      |
| Deliveries & Invoices | ✅ Yes                  |
| Issues                | ✅ Yes                  |
| Transfers             | ✅ Yes (+ approve)      |
| NCR                   | ✅ Yes                  |
| Stock Now             | ✅ Yes                  |
| Reconciliations       | ✅ Yes (+ consolidated) |
| Reports               | ✅ Yes (+ export)       |
| Users                 | ❌ No                   |
| Locations             | ❌ No                   |
| Suppliers             | ❌ No                   |
| Periods               | ❌ No                   |
| Period Close          | ❌ No                   |

---

### ADMIN Role

**Purpose:** Full system administration and control

#### Capabilities

- ✅ All SUPERVISOR capabilities
- ✅ Create, edit, and deactivate users
- ✅ Assign users to locations
- ✅ Create and manage locations
- ✅ Create and manage suppliers
- ✅ Manage item master data
- ✅ Set item prices for periods
- ✅ Open and close accounting periods
- ✅ Execute period close operations
- ✅ Full system configuration access

#### Navigation Access

| Menu Item             | Access                |
| --------------------- | --------------------- |
| Dashboard             | ✅ Yes                |
| Locations             | ✅ Yes                |
| Users                 | ✅ Yes                |
| POB                   | ✅ Yes                |
| Suppliers             | ✅ Yes                |
| Items & Prices        | ✅ Yes (full control) |
| Deliveries & Invoices | ✅ Yes                |
| Issues                | ✅ Yes                |
| Transfers             | ✅ Yes                |
| NCR                   | ✅ Yes                |
| Stock Now             | ✅ Yes                |
| Reconciliations       | ✅ Yes                |
| Reports               | ✅ Yes                |
| Periods               | ✅ Yes                |
| Period Close          | ✅ Yes                |

---

## Location Access Model

> **Important:** Location access determines which locations a user can view and interact with in the system.

### Access Types

#### Explicit Assignment (Operators Only)

Operators must be explicitly assigned to locations through the **UserLocation** association. They can only:

- View stock at assigned locations
- Post transactions at assigned locations
- See data relevant to their assigned locations

#### Implicit Access (Supervisors & Admins)

Supervisors and Admins have **automatic access to all locations** without requiring explicit assignment. This allows them to:

- Oversee operations across the entire organization
- Approve cross-location transfers
- View consolidated reports
- Manage reconciliations at any location

---

## Permission Functions Reference

The system provides granular permission check functions for use throughout the application:

### Delivery Permissions

| Function                        | Description                 | Roles                      |
| ------------------------------- | --------------------------- | -------------------------- |
| `canPostDeliveries(locationId)` | Post deliveries at location | All (with location access) |

### Issue Permissions

| Function                    | Description             | Roles                      |
| --------------------------- | ----------------------- | -------------------------- |
| `canPostIssues(locationId)` | Post issues at location | All (with location access) |

### Item Management

| Function               | Description           | Roles      |
| ---------------------- | --------------------- | ---------- |
| `canEditItems()`       | Edit item master data | ADMIN only |
| `canCreateItems()`     | Create new items      | ADMIN only |
| `canDeactivateItems()` | Deactivate items      | ADMIN only |
| `canSetItemPrices()`   | Set period prices     | ADMIN only |

### Period Management

| Function                           | Description             | Roles             |
| ---------------------------------- | ----------------------- | ----------------- |
| `canClosePeriod()`                 | Close accounting period | ADMIN only        |
| `canOpenPeriod()`                  | Open new period         | ADMIN only        |
| `canMarkLocationReady(locationId)` | Mark location ready     | SUPERVISOR, ADMIN |

### Transfer Permissions

| Function                            | Description              | Roles                      |
| ----------------------------------- | ------------------------ | -------------------------- |
| `canCreateTransfer(fromLocationId)` | Create transfer request  | All (with location access) |
| `canApproveTransfers()`             | Approve/reject transfers | SUPERVISOR, ADMIN          |

### Reconciliation Permissions

| Function                               | Description              | Roles                      |
| -------------------------------------- | ------------------------ | -------------------------- |
| `canViewReconciliations(locationId)`   | View reconciliation data | All (with location access) |
| `canEditReconciliations(locationId)`   | Edit adjustments         | SUPERVISOR, ADMIN          |
| `canViewConsolidatedReconciliations()` | View all locations       | SUPERVISOR, ADMIN          |

### Administrative Permissions

| Function                   | Description               | Roles      |
| -------------------------- | ------------------------- | ---------- |
| `canManageUsers()`         | User CRUD operations      | ADMIN only |
| `canAssignUserLocations()` | Assign users to locations | ADMIN only |
| `canManageLocations()`     | Location CRUD operations  | ADMIN only |
| `canManageSuppliers()`     | Supplier CRUD operations  | ADMIN only |

### Reporting Permissions

| Function                     | Description        | Roles                      |
| ---------------------------- | ------------------ | -------------------------- |
| `canViewReports(locationId)` | View reports       | All (with location access) |
| `canExportReports()`         | Export report data | SUPERVISOR, ADMIN          |

---

## Security Implementation

### Server-Side Protection

All permission checks are enforced at the API level:

- **Authentication Middleware:** Validates user session on every request
- **Authorization Middleware:** Checks role and location access
- **403 Forbidden:** Returned for unauthorized access attempts

### Client-Side Protection

- **Navigation Filtering:** Menu items filtered based on user role
- **UI Element Hiding:** Buttons and actions hidden when unauthorized
- **Route Guards:** Client-side middleware redirects unauthorized users

> **Important:** Client-side protections are for UX only. All security enforcement happens server-side to prevent bypassing.

---

## Summary Matrix

| Feature              | OPERATOR    | SUPERVISOR | ADMIN   |
| -------------------- | ----------- | ---------- | ------- |
| Post Deliveries      | ✅ Assigned | ✅ All     | ✅ All  |
| Post Issues          | ✅ Assigned | ✅ All     | ✅ All  |
| Enter POB            | ✅ Assigned | ✅ All     | ✅ All  |
| Create Transfers     | ✅ Assigned | ✅ All     | ✅ All  |
| Approve Transfers    | ❌          | ✅         | ✅      |
| View Reconciliations | ✅ Totals   | ✅ Full    | ✅ Full |
| Edit Reconciliations | ❌          | ✅         | ✅      |
| Consolidated View    | ❌          | ✅         | ✅      |
| Export Reports       | ❌          | ✅         | ✅      |
| Manage Users         | ❌          | ❌         | ✅      |
| Manage Locations     | ❌          | ❌         | ✅      |
| Manage Suppliers     | ❌          | ❌         | ✅      |
| Manage Items/Prices  | ❌          | ❌         | ✅      |
| Period Close         | ❌          | ❌         | ✅      |

---

## Document Information

- **System:** Stock Management System v1.0
- **Last Updated:** 23 December 2025
- **Status:** Production
