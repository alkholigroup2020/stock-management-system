# Admin Quick Reference Guide

**Stock Management System**

---

## Table of Contents

1. [Your Role](#your-role)
2. [Supervisor Tasks](#supervisor-tasks)
3. [User Management](#user-management)
4. [Location Management](#location-management)
5. [Supplier Management](#supplier-management)
6. [Item Management](#item-management)
7. [Period Management](#period-management)
8. [Period Close](#period-close)
9. [Quick Reference Card](#quick-reference-card)

---

## Your Role

As an **Admin**, you have complete system control. Your key duties include:

- **Manage users** - Create accounts, assign roles and locations
- **Manage master data** - Locations, suppliers, and items
- **Manage periods** - Open periods and set prices
- **Execute period close** - Final approval for closing accounting periods
- **All Supervisor and Operator tasks**

### Full System Access Overview

| Capability | Admin | Supervisor | Operator |
|------------|-------|------------|----------|
| Create/manage users | Yes | No | No |
| Create/manage locations | Yes | No | No |
| Create/manage suppliers | Yes | No | No |
| Create/manage items | Yes | No | No |
| Set period prices | Yes | No | No |
| Execute period close | Yes | No | No |
| Approve transfers | Yes | Yes | No |
| Edit reconciliations | Yes | Yes | No |
| Post deliveries/issues | Yes | Yes | Yes |

---

## Supervisor Tasks

As an Admin, you can perform all Supervisor tasks:

- **Transfer Management** - Approve/reject transfer requests
- **Reconciliations** - View and edit reconciliations at any location
- **Manual NCR Creation** - Create NCRs for quality issues
- **Reports** - Access all reports with export capability

> **See:** [Supervisor Guide](./SUPERVISOR_GUIDE.md) for detailed steps on these tasks.

---

## User Management

### Viewing All Users

1. Click **Users** in the left menu
2. You'll see a list of all system users
3. Use filters to narrow the list:
   - **Search** - Type name, email, or username
   - **Role** - Filter by Admin, Supervisor, or Operator
   - **Status** - Active, Inactive, or All

### Creating a New User

1. Click **Users** in the left menu
2. Click **Create User** button
3. Fill in the user information:

**Basic Information:**
- **Full Name** - User's complete name
- **Username** - Unique login identifier (no spaces)
- **Email** - Unique email address
- **Password** - Initial password (user can change later)

**Role Assignment:**
- **Role** - Select one:
  - **Operator** - Basic data entry at assigned locations
  - **Supervisor** - Approval authority and all locations
  - **Admin** - Full system control

**Location Assignment (for Operators):**
- **Assigned Locations** - Check the locations this user can access
- **Default Location** - Primary location for this user

4. Click **Create User**

> **Important:** Operators MUST have at least one location assigned. Supervisors and Admins automatically have access to all locations.

### Editing a User

1. Click **Users** in the left menu
2. Find the user and click **Edit** button
3. Modify the information as needed:
   - Change name, email
   - Change role
   - Update location assignments
   - Reset password (leave blank to keep current)
4. Click **Save Changes**

### Deactivating a User

Deactivating prevents login while preserving the user's history.

1. Click **Users** in the left menu
2. Find the user and click **Deactivate** (or toggle switch)
3. Confirm the action

**What happens:**
- User cannot log in
- User's transactions remain in the system
- User can be reactivated later

### Reactivating a User

1. Click **Users** in the left menu
2. Filter by **Status: Inactive**
3. Find the user and click **Activate**
4. Confirm the action

### Deleting a User

> **Warning:** Deleting a user is permanent and may affect historical records.

1. Click **Users** in the left menu
2. Find the user and click **Delete**
3. Read the warning carefully
4. Type the user's name to confirm
5. Click **Delete Permanently**

---

## Location Management

Locations represent physical sites where stock is managed (e.g., Kitchen, Store, Central Warehouse).

### Viewing Locations

1. Click **Locations** in the left menu
2. You'll see cards for each location showing:
   - Location name and code
   - Type (Kitchen, Store, Central, Warehouse)
   - Current stock value
   - Active users assigned
   - Status (Active/Inactive)

### Creating a New Location

1. Click **Locations** in the left menu
2. Click **New Location** button
3. Fill in the details:
   - **Location Name** - Descriptive name (e.g., "Main Kitchen")
   - **Location Code** - Short unique code (e.g., "KIT-01")
   - **Type** - Select: Kitchen, Store, Central, or Warehouse
   - **Address** - Physical address (optional)
   - **Status** - Active or Inactive
4. Click **Create Location**

### Editing a Location

1. Click **Locations** in the left menu
2. Click on the location card or **Edit** button
3. Modify the details as needed
4. Click **Save Changes**

### Deactivating a Location

> **Note:** You cannot deactivate a location with pending transactions or open reconciliations.

1. Click **Locations** in the left menu
2. Click on the location
3. Toggle **Status** to Inactive
4. Confirm the action

---

## Supplier Management

Suppliers are vendors who provide stock through deliveries.

### Viewing Suppliers

1. Click **Suppliers** in the left menu
2. You'll see a list of all suppliers with:
   - Supplier name and code
   - Contact person
   - Email and phone
   - Payment terms
   - Total deliveries

### Creating a New Supplier

1. Click **Suppliers** in the left menu
2. Click **New Supplier** button
3. Fill in the details:
   - **Supplier Name** - Company name
   - **Supplier Code** - Unique identifier
   - **Contact Person** - Primary contact name
   - **Email** - Contact email
   - **Phone** - Contact phone
   - **Address** - Business address
   - **Payment Terms** - e.g., "Net 30", "COD"
4. Click **Create Supplier**

### Editing a Supplier

1. Click **Suppliers** in the left menu
2. Click on the supplier row or **Edit** button
3. Modify the details as needed
4. Click **Save Changes**

---

## Item Management

Items are products or materials tracked in inventory.

### Viewing Items

1. Click **Items** in the left menu
2. You'll see a list of all items with:
   - Item code and name
   - Category
   - Unit of measure
   - Current stock across locations
   - Status (Active/Inactive)

### Creating a New Item

1. Click **Items** in the left menu
2. Click **New Item** button
3. Fill in the details:

**Basic Information:**
- **Item Code** - Unique identifier (e.g., "BEEF-001")
- **Item Name** - Descriptive name
- **Category** - Select or create category
- **Unit of Measure** - KG, EA, LTR, BOX, CASE, or PACK

**Optional Settings:**
- **Minimum Stock Level** - Low stock warning threshold
- **Description** - Additional details
- **Status** - Active or Inactive

4. Click **Create Item**

### Editing an Item

1. Click **Items** in the left menu
2. Click on the item row or **Edit** button
3. Modify the details as needed
4. Click **Save Changes**

> **Note:** Changing the unit of measure on an existing item may cause calculation issues. Create a new item instead if the unit changes.

### Setting Item Prices for a Period

Period prices lock the expected cost of items for price variance detection.

1. Click **Periods** in the left menu
2. Click on the period (must be in DRAFT or OPEN status)
3. Click **Manage Prices** or navigate to the prices section
4. For each item:
   - View current price
   - Enter new **Period Price** (SAR per unit)
5. Click **Save Prices**

> **Important:** Once prices are set and the period is opened, they cannot be changed. Any delivery with a different price will generate a price variance NCR.

---

## Period Management

Periods are accounting cycles (typically monthly) that organize transactions.

### Understanding Period Status

| Status | Meaning | What Can Be Done |
|--------|---------|------------------|
| **DRAFT** | Period created but not started | Set prices, configure |
| **OPEN** | Active period for transactions | Post deliveries, issues, transfers |
| **PENDING_CLOSE** | Close requested, awaiting approval | Review, approve/reject close |
| **CLOSED** | Period ended, locked | View only, no changes |

### Viewing Periods

1. Click **Periods** in the left menu
2. You'll see a list of periods with:
   - Period name (e.g., "January 2025")
   - Start and end dates
   - Status badge
   - Number of locations
   - Created date

### Creating a New Period

> **Note:** Only create a new period when the current one is closed.

1. Click **Periods** in the left menu
2. Click **New Period** button
3. Fill in the details:
   - **Period Name** - e.g., "February 2025"
   - **Start Date** - First day of period
   - **End Date** - Last day of period
4. Click **Create Period**

The period is created in DRAFT status.

### Opening a Period

1. Click **Periods** in the left menu
2. Click on the DRAFT period
3. Verify:
   - Period prices are set
   - Date range is correct
4. Click **Open Period**
5. Confirm the action

> **Warning:** Once opened, you cannot change the period dates or prices.

---

## Period Close

Period close is the final step in the accounting cycle, locking all transactions and creating snapshots.

### Pre-Close Checklist

Before initiating period close, ensure:

- [ ] All deliveries are posted (no drafts)
- [ ] All issues are posted
- [ ] All transfers are completed (no pending approvals)
- [ ] All location reconciliations are complete
- [ ] All locations are marked as READY

### Viewing Period Close Status

1. Click **Period Close** in the left menu
2. You'll see:
   - Current period information
   - Pre-close checklist with status indicators
   - Location readiness table

### Location Readiness Table

The table shows each location's status:

| Status | Meaning |
|--------|---------|
| **OPEN** | Transactions ongoing, not ready |
| **READY** | Reconciliation complete, waiting for close |
| **CLOSED** | Period is closed for this location |

### Executing Period Close

When all locations are READY:

1. Click **Period Close** in the left menu
2. Verify all checklist items are green
3. Verify all locations show READY status
4. Click **Close Period**
5. Review the confirmation dialog:
   - This action cannot be undone
   - All locations will be closed simultaneously
   - Closing snapshots will be created
6. Click **Confirm Close**

### What Happens During Close

When you execute period close:

1. **Snapshot creation** - Each location's closing values are recorded
2. **Status update** - Period status changes to CLOSED
3. **Opening balances** - New period gets opening balances from snapshots
4. **Lock transactions** - No more changes to the closed period
5. **New period starts** - The next period becomes active

### After Period Close

Once closed:
- View the closed period in Reports
- Opening balances appear in the new period
- Historical transactions remain viewable but not editable
- Reconciliation reports show final values

---

## Quick Reference Card

### Navigation

| Task | Path |
|------|------|
| Manage users | Users |
| Create user | Users > Create User |
| Manage locations | Locations |
| Manage suppliers | Suppliers |
| Manage items | Items |
| Set period prices | Periods > [Period] > Manage Prices |
| Period close | Period Close |

### User Setup Checklist

When creating a new user:
- [ ] Full name and email entered
- [ ] Username is unique
- [ ] Role selected (Operator/Supervisor/Admin)
- [ ] Locations assigned (for Operators)
- [ ] Default location set
- [ ] User notified of login credentials

### Period Close Checklist

Before closing a period:
- [ ] All drafts posted
- [ ] All pending transfers resolved
- [ ] All reconciliations complete
- [ ] All locations marked READY
- [ ] Final review completed

### Key Rules

1. **Only one period active** - Close current before opening next
2. **Prices lock on open** - Set all prices before opening period
3. **Cannot undo close** - Period close is permanent
4. **All locations close together** - No partial closes
5. **Deactivate, don't delete** - Preserve user history

### Common Issues

| Issue | Solution |
|-------|----------|
| Can't close period | Check all locations are READY |
| Location not ready | Complete reconciliation first |
| User can't log in | Check status is Active |
| Operator sees no data | Check location assignments |
| Price variance NCRs | Normal - review and process |

### Emergency Contacts

For system issues that cannot be resolved:
1. Check internet connection
2. Try logging out and back in
3. Contact IT support
4. Document the issue with screenshots

---

*Document Version: 1.0 | Last Updated: December 2025*
