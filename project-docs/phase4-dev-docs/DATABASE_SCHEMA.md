# Database Schema Documentation

This document provides comprehensive documentation of the Stock Management System database schema.

## Table of Contents

- [Overview](#overview)
- [Database Technology](#database-technology)
- [Schema Organization](#schema-organization)
- [Core Models](#core-models)
- [Period & Stock Models](#period--stock-models)
- [Transaction Models](#transaction-models)
- [Transfer Models](#transfer-models)
- [Control Models](#control-models)
- [Indexes and Performance](#indexes-and-performance)
- [Business Rules and Constraints](#business-rules-and-constraints)
- [Data Types](#data-types)

## Overview

The database schema is designed to support multi-location inventory management with comprehensive transaction tracking, period-based accounting, and coordinated period-end close workflows.

**Key Design Principles:**

- **Location-centric**: All transactions and stock are associated with a specific location
- **Period-locked pricing**: Prices are locked at period start to detect variances
- **Audit trail**: Every transaction records who, when, and what
- **Referential integrity**: Foreign keys enforce data consistency
- **Performance**: Strategic indexes on high-traffic queries

## Database Technology

- **Database:** PostgreSQL 15+
- **ORM:** Prisma
- **Hosting:** Supabase
- **Connection:** Transaction pooler (port 6543)

**Schema File Location:** `prisma/schema.prisma`

## Schema Organization

The schema is organized into logical groups:

1. **Enums** - Type definitions for status fields, roles, and categories
2. **Core Models** - Users, Locations, Items, Suppliers
3. **Period & Stock Models** - Periods, Item Prices, Location Stock
4. **Transaction Models** - PRF, PO, Deliveries, Issues
5. **Transfer Models** - Inter-location transfers
6. **Control Models** - NCRs, POB, Reconciliations, Approvals

## Core Models

### User

System users with role-based access control.

**Table:** `users`

| Column                | Type         | Nullable | Default    | Description                             |
| --------------------- | ------------ | -------- | ---------- | --------------------------------------- |
| `id`                  | UUID         | No       | `uuid()`   | Primary key                             |
| `username`            | VARCHAR(50)  | No       | -          | Unique username                         |
| `email`               | VARCHAR(100) | No       | -          | Unique email address                    |
| `full_name`           | VARCHAR(100) | Yes      | -          | Display name                            |
| `role`                | UserRole     | No       | `OPERATOR` | User role (OPERATOR, SUPERVISOR, ADMIN) |
| `password_hash`       | VARCHAR(255) | No       | -          | Bcrypt password hash                    |
| `default_location_id` | UUID         | Yes      | -          | Default location for user               |
| `is_active`           | BOOLEAN      | No       | `true`     | Account active status                   |
| `created_at`          | TIMESTAMPTZ  | No       | `now()`    | Account creation timestamp              |
| `last_login`          | TIMESTAMPTZ  | Yes      | -          | Last login timestamp                    |

**Relationships:**

- `default_location` → Location (many-to-one)
- `managed_locations` → Location[] (one-to-many)
- `user_locations` → UserLocation[] (one-to-many)
- Plus relations to transactions (deliveries, issues, transfers, etc.)

**Indexes:**

- `role` - For role-based queries
- `is_active` - For active user filtering
- `default_location_id` - For location user lookups

**Business Rules:**

- Username and email must be unique
- Password must be hashed with bcrypt
- Users can be assigned to multiple locations via UserLocation
- Role determines permission level (Operator < Supervisor < Admin)

### Location

Physical sites (Kitchen, Store, Central, Warehouse).

**Table:** `locations`

| Column       | Type         | Nullable | Default       | Description                                        |
| ------------ | ------------ | -------- | ------------- | -------------------------------------------------- |
| `id`         | UUID         | No       | `uuid()`      | Primary key                                        |
| `code`       | VARCHAR(10)  | No       | -             | Unique location code (e.g., "KITCHEN")             |
| `name`       | VARCHAR(100) | No       | -             | Display name                                       |
| `type`       | LocationType | No       | -             | Location type (KITCHEN, STORE, CENTRAL, WAREHOUSE) |
| `address`    | TEXT         | Yes      | -             | Physical address                                   |
| `manager_id` | UUID         | Yes      | -             | Location manager user ID                           |
| `timezone`   | VARCHAR(50)  | No       | `Asia/Riyadh` | Timezone for date operations                       |
| `is_active`  | BOOLEAN      | No       | `true`        | Active status                                      |
| `created_at` | TIMESTAMPTZ  | No       | `now()`       | Creation timestamp                                 |
| `updated_at` | TIMESTAMPTZ  | No       | `now()`       | Last update timestamp                              |

**Relationships:**

- `manager` → User (many-to-one)
- `user_locations` → UserLocation[] (one-to-many)
- `location_stock` → LocationStock[] (one-to-many)
- `deliveries`, `issues`, `transfers_from`, `transfers_to` (one-to-many)

**Indexes:**

- `type` - For filtering by location type
- `is_active` - For active location queries
- `manager_id` - For manager's locations

### UserLocation

Join table for user-location access control.

**Table:** `user_locations`

| Column         | Type        | Nullable | Default | Description                        |
| -------------- | ----------- | -------- | ------- | ---------------------------------- |
| `user_id`      | UUID        | No       | -       | User ID (part of composite PK)     |
| `location_id`  | UUID        | No       | -       | Location ID (part of composite PK) |
| `access_level` | AccessLevel | No       | `VIEW`  | Access level (VIEW, POST, MANAGE)  |
| `assigned_at`  | TIMESTAMPTZ | No       | `now()` | Assignment timestamp               |
| `assigned_by`  | UUID        | Yes      | -       | User who assigned access           |

**Primary Key:** `(user_id, location_id)`

**Relationships:**

- `user` → User (many-to-one, CASCADE on delete)
- `location` → Location (many-to-one, CASCADE on delete)
- `assigner` → User (many-to-one)

**Indexes:**

- `user_id` - For user's locations lookup
- `location_id` - For location's users lookup
- `(user_id, access_level)` - For permission checks

### Item

Product master data (global across locations).

**Table:** `items`

| Column         | Type         | Nullable | Default  | Description                                    |
| -------------- | ------------ | -------- | -------- | ---------------------------------------------- |
| `id`           | UUID         | No       | `uuid()` | Primary key                                    |
| `code`         | VARCHAR(50)  | No       | -        | Unique item code                               |
| `name`         | VARCHAR(200) | No       | -        | Item name                                      |
| `unit`         | Unit         | No       | -        | Unit of measure (KG, EA, LTR, BOX, CASE, PACK) |
| `category`     | VARCHAR(50)  | Yes      | -        | Category (e.g., "Meat", "Dairy")               |
| `sub_category` | VARCHAR(50)  | Yes      | -        | Sub-category                                   |
| `is_active`    | BOOLEAN      | No       | `true`   | Active status                                  |
| `created_at`   | TIMESTAMPTZ  | No       | `now()`  | Creation timestamp                             |
| `updated_at`   | TIMESTAMPTZ  | No       | `now()`  | Last update timestamp                          |

**Relationships:**

- `item_prices` → ItemPrice[] (one-to-many)
- `location_stock` → LocationStock[] (one-to-many)
- `delivery_lines`, `issue_lines`, `transfer_lines` (one-to-many)

**Indexes:**

- `category` - For category filtering
- `is_active` - For active item queries
- `(is_active, category)` - Compound index for filtered queries

### Supplier

Vendor information.

**Table:** `suppliers`

| Column       | Type         | Nullable | Default  | Description          |
| ------------ | ------------ | -------- | -------- | -------------------- |
| `id`         | UUID         | No       | `uuid()` | Primary key          |
| `code`       | VARCHAR(50)  | No       | -        | Unique supplier code |
| `name`       | VARCHAR(200) | No       | -        | Supplier name        |
| `contact`    | TEXT         | Yes      | -        | Contact information  |
| `is_active`  | BOOLEAN      | No       | `true`   | Active status        |
| `created_at` | TIMESTAMPTZ  | No       | `now()`  | Creation timestamp   |

**Relationships:**

- `purchase_orders` → PO[] (one-to-many)
- `deliveries` → Delivery[] (one-to-many)

**Indexes:**

- `is_active` - For active supplier queries

## Period & Stock Models

### Period

Monthly accounting periods.

**Table:** `periods`

| Column        | Type         | Nullable | Default  | Description                        |
| ------------- | ------------ | -------- | -------- | ---------------------------------- |
| `id`          | UUID         | No       | `uuid()` | Primary key                        |
| `name`        | VARCHAR(100) | No       | -        | Period name (e.g., "January 2025") |
| `start_date`  | DATE         | No       | -        | Period start date                  |
| `end_date`    | DATE         | No       | -        | Period end date                    |
| `status`      | PeriodStatus | No       | `DRAFT`  | Period status                      |
| `approval_id` | UUID         | Yes      | -        | Approval record ID                 |
| `created_at`  | TIMESTAMPTZ  | No       | `now()`  | Creation timestamp                 |
| `closed_at`   | TIMESTAMPTZ  | Yes      | -        | Close timestamp                    |

**Period Status Lifecycle:**

1. `DRAFT` - Period created but not yet opened
2. `OPEN` - Period is active for transactions
3. `PENDING_CLOSE` - Closing initiated, awaiting approval
4. `APPROVED` - Close approved, ready to execute
5. `CLOSED` - Period is closed

**Relationships:**

- `period_locations` → PeriodLocation[] (one-to-many)
- `item_prices` → ItemPrice[] (one-to-many)
- All transactions (deliveries, issues, reconciliations)

**Indexes:**

- `status` - For period status filtering
- `(start_date, end_date)` - For date range queries

**Business Rules:**

- Only one period can be OPEN at a time (enforced in application)
- Transactions can only be posted in OPEN periods
- End date must be after start date

### PeriodLocation

Period status per location for coordinated close.

**Table:** `period_locations`

| Column          | Type                 | Nullable | Default | Description                        |
| --------------- | -------------------- | -------- | ------- | ---------------------------------- |
| `period_id`     | UUID                 | No       | -       | Period ID (part of composite PK)   |
| `location_id`   | UUID                 | No       | -       | Location ID (part of composite PK) |
| `status`        | PeriodLocationStatus | No       | `OPEN`  | Location status for this period    |
| `opening_value` | DECIMAL(15,2)        | Yes      | -       | Total opening stock value          |
| `closing_value` | DECIMAL(15,2)        | Yes      | -       | Total closing stock value          |
| `snapshot_id`   | UUID                 | Yes      | -       | Stock snapshot reference           |
| `snapshot_data` | JSON                 | Yes      | -       | Stock snapshot at period close     |
| `ready_at`      | TIMESTAMPTZ          | Yes      | -       | When location marked ready         |
| `closed_at`     | TIMESTAMPTZ          | Yes      | -       | When location closed               |

**Primary Key:** `(period_id, location_id)`

**Status Lifecycle:**

1. `OPEN` - Location can post transactions
2. `READY` - Location ready for period close
3. `CLOSED` - Location closed for this period

**Relationships:**

- `period` → Period (many-to-one, CASCADE on delete)
- `location` → Location (many-to-one, CASCADE on delete)

**Indexes:**

- `period_id` - For period location lookups
- `location_id` - For location period history
- `status` - For readiness checking
- `(period_id, status)` - For close coordination

**Business Rules:**

- All locations must be READY before period can be APPROVED
- Snapshot captures stock levels at close time
- Opening value of next period = closing value of previous period

### ItemPrice

Locked prices per period (for variance detection).

**Table:** `item_prices`

| Column      | Type          | Nullable | Default  | Description         |
| ----------- | ------------- | -------- | -------- | ------------------- |
| `id`        | UUID          | No       | `uuid()` | Primary key         |
| `item_id`   | UUID          | No       | -        | Item ID             |
| `period_id` | UUID          | No       | -        | Period ID           |
| `price`     | DECIMAL(15,4) | No       | -        | Unit price          |
| `currency`  | VARCHAR(3)    | No       | `SAR`    | Currency code       |
| `set_by`    | UUID          | Yes      | -        | User who set price  |
| `set_at`    | TIMESTAMPTZ   | No       | `now()`  | Price set timestamp |

**Unique Constraint:** `(item_id, period_id)` - One price per item per period

**Relationships:**

- `item` → Item (many-to-one, CASCADE on delete)
- `period` → Period (many-to-one, CASCADE on delete)

**Indexes:**

- `period_id` - For period price lookups
- `item_id` - For item price history

**Business Rules:**

- Prices are locked at period start
- Delivery prices compared against period prices to detect variances
- Price variance triggers automatic NCR creation

### LocationStock

Current stock levels per location.

**Table:** `location_stock`

| Column         | Type          | Nullable | Default | Description                           |
| -------------- | ------------- | -------- | ------- | ------------------------------------- |
| `location_id`  | UUID          | No       | -       | Location ID (part of composite PK)    |
| `item_id`      | UUID          | No       | -       | Item ID (part of composite PK)        |
| `on_hand`      | DECIMAL(15,4) | No       | `0`     | Quantity on hand                      |
| `wac`          | DECIMAL(15,4) | No       | `0`     | Weighted Average Cost                 |
| `min_stock`    | DECIMAL(15,4) | Yes      | -       | Minimum stock level (alert threshold) |
| `max_stock`    | DECIMAL(15,4) | Yes      | -       | Maximum stock level                   |
| `last_counted` | TIMESTAMPTZ   | Yes      | -       | Last physical count date              |
| `updated_at`   | TIMESTAMPTZ   | No       | `now()` | Last update timestamp                 |

**Primary Key:** `(location_id, item_id)`

**Relationships:**

- `location` → Location (many-to-one, CASCADE on delete)
- `item` → Item (many-to-one, CASCADE on delete)

**Indexes:**

- `location_id` - For location stock queries
- `item_id` - For item stock across locations
- `on_hand` - For low stock alerts

**Business Rules:**

- Stock cannot go negative (enforced by check constraint)
- WAC updated only on deliveries, not issues
- WAC formula: `(currentQty × currentWAC + receivedQty × receiptPrice) / (currentQty + receivedQty)`

## Transaction Models

### Delivery

Goods receipt transactions (increase stock, update WAC).

**Table:** `deliveries`

| Column          | Type          | Nullable | Default  | Description                         |
| --------------- | ------------- | -------- | -------- | ----------------------------------- |
| `id`            | UUID          | No       | `uuid()` | Primary key                         |
| `delivery_no`   | VARCHAR(50)   | No       | -        | Unique delivery number              |
| `period_id`     | UUID          | No       | -        | Period ID                           |
| `location_id`   | UUID          | No       | -        | Location ID                         |
| `supplier_id`   | UUID          | No       | -        | Supplier ID                         |
| `po_id`         | UUID          | Yes      | -        | Purchase Order ID (optional)        |
| `invoice_no`    | VARCHAR(100)  | Yes      | -        | Supplier invoice number             |
| `delivery_note` | TEXT          | Yes      | -        | Delivery notes                      |
| `delivery_date` | DATE          | No       | -        | Delivery date                       |
| `total_amount`  | DECIMAL(15,2) | No       | `0`      | Total delivery value                |
| `has_variance`  | BOOLEAN       | No       | `false`  | True if any line has price variance |
| `posted_by`     | UUID          | No       | -        | User who posted                     |
| `posted_at`     | TIMESTAMPTZ   | No       | `now()`  | Post timestamp                      |

**Relationships:**

- `period`, `location`, `supplier`, `po`, `poster` (many-to-one)
- `delivery_lines` → DeliveryLine[] (one-to-many)
- `ncrs` → NCR[] (one-to-many, auto-generated)

**Indexes:**

- `(period_id, location_id)` - For location deliveries in period
- `(location_id, has_variance)` - For variance filtering
- `(location_id, delivery_date)` - For date-based queries
- `posted_at` - For sorting by timestamp

**Business Rules:**

- Increases stock and updates WAC for each line
- Price variance auto-creates NCR if delivery price ≠ period price
- Must be posted in OPEN period only

### DeliveryLine

Line items in delivery.

**Table:** `delivery_lines`

| Column           | Type          | Nullable | Default  | Description                 |
| ---------------- | ------------- | -------- | -------- | --------------------------- |
| `id`             | UUID          | No       | `uuid()` | Primary key                 |
| `delivery_id`    | UUID          | No       | -        | Delivery ID                 |
| `item_id`        | UUID          | No       | -        | Item ID                     |
| `quantity`       | DECIMAL(15,4) | No       | -        | Quantity received           |
| `unit_price`     | DECIMAL(15,4) | No       | -        | Actual price from delivery  |
| `period_price`   | DECIMAL(15,4) | No       | -        | Expected price from period  |
| `price_variance` | DECIMAL(15,4) | No       | `0`      | `unit_price - period_price` |
| `line_value`     | DECIMAL(15,2) | No       | -        | `quantity × unit_price`     |
| `ncr_id`         | UUID          | Yes      | -        | Auto-generated NCR ID       |

**Relationships:**

- `delivery` → Delivery (many-to-one, CASCADE on delete)
- `item` → Item (many-to-one, RESTRICT on delete)
- `ncrs` → NCR[] (one-to-many)

**Indexes:**

- `delivery_id` - For delivery line lookups
- `item_id` - For item delivery history
- `ncr_id` - For NCR linkage

**Business Rules:**

- Quantity must be positive
- If `price_variance ≠ 0`, auto-create NCR with type `PRICE_VARIANCE`

### Issue

Stock issue transactions (decrease stock, use current WAC).

**Table:** `issues`

| Column        | Type          | Nullable | Default  | Description                      |
| ------------- | ------------- | -------- | -------- | -------------------------------- |
| `id`          | UUID          | No       | `uuid()` | Primary key                      |
| `issue_no`    | VARCHAR(50)   | No       | -        | Unique issue number              |
| `period_id`   | UUID          | No       | -        | Period ID                        |
| `location_id` | UUID          | No       | -        | Location ID                      |
| `issue_date`  | DATE          | No       | -        | Issue date                       |
| `cost_centre` | CostCentre    | No       | `FOOD`   | Cost centre (FOOD, CLEAN, OTHER) |
| `total_value` | DECIMAL(15,2) | No       | `0`      | Total issue value at WAC         |
| `notes`       | TEXT          | Yes      | -        | Issue notes                      |
| `posted_by`   | UUID          | No       | -        | User who posted                  |
| `posted_at`   | TIMESTAMPTZ   | No       | `now()`  | Post timestamp                   |

**Relationships:**

- `period`, `location`, `poster` (many-to-one)
- `issue_lines` → IssueLine[] (one-to-many)

**Indexes:**

- `(period_id, location_id)` - For location issues in period
- `(location_id, cost_centre)` - For cost centre filtering
- `(location_id, issue_date)` - For date-based queries
- `posted_at` - For sorting

**Business Rules:**

- Decreases stock (must have sufficient quantity)
- Uses current WAC, does NOT recalculate WAC
- Must be posted in OPEN period only
- Stock cannot go negative

### IssueLine

Line items in issue.

**Table:** `issue_lines`

| Column         | Type          | Nullable | Default  | Description                   |
| -------------- | ------------- | -------- | -------- | ----------------------------- |
| `id`           | UUID          | No       | `uuid()` | Primary key                   |
| `issue_id`     | UUID          | No       | -        | Issue ID                      |
| `item_id`      | UUID          | No       | -        | Item ID                       |
| `quantity`     | DECIMAL(15,4) | No       | -        | Quantity issued               |
| `wac_at_issue` | DECIMAL(15,4) | No       | -        | WAC at time of issue (frozen) |
| `line_value`   | DECIMAL(15,2) | No       | -        | `quantity × wac_at_issue`     |

**Relationships:**

- `issue` → Issue (many-to-one, CASCADE on delete)
- `item` → Item (many-to-one, RESTRICT on delete)

**Indexes:**

- `issue_id` - For issue line lookups
- `item_id` - For item issue history

**Business Rules:**

- Quantity must be positive
- WAC captured at issue time and frozen (not recalculated)

## Transfer Models

### Transfer

Inter-location stock transfers.

**Table:** `transfers`

| Column             | Type           | Nullable | Default  | Description                           |
| ------------------ | -------------- | -------- | -------- | ------------------------------------- |
| `id`               | UUID           | No       | `uuid()` | Primary key                           |
| `transfer_no`      | VARCHAR(50)    | No       | -        | Unique transfer number                |
| `from_location_id` | UUID           | No       | -        | Source location ID                    |
| `to_location_id`   | UUID           | No       | -        | Destination location ID               |
| `status`           | TransferStatus | No       | `DRAFT`  | Transfer status                       |
| `requested_by`     | UUID           | No       | -        | User who requested                    |
| `approved_by`      | UUID           | Yes      | -        | User who approved/rejected            |
| `request_date`     | DATE           | No       | -        | Request date                          |
| `approval_date`    | DATE           | Yes      | -        | Approval date                         |
| `transfer_date`    | DATE           | Yes      | -        | Actual transfer date (when completed) |
| `total_value`      | DECIMAL(15,2)  | No       | `0`      | Total transfer value at source WAC    |
| `notes`            | TEXT           | Yes      | -        | Transfer notes                        |
| `created_at`       | TIMESTAMPTZ    | No       | `now()`  | Creation timestamp                    |
| `updated_at`       | TIMESTAMPTZ    | No       | `now()`  | Last update timestamp                 |

**Transfer Status Lifecycle:**

1. `DRAFT` - Transfer being created
2. `PENDING_APPROVAL` - Awaiting supervisor/admin approval
3. `APPROVED` - Approved, ready to execute
4. `REJECTED` - Rejected by approver
5. `COMPLETED` - Transfer completed (stock moved)

**Relationships:**

- `from_location`, `to_location` → Location (many-to-one, RESTRICT)
- `requester`, `approver` → User (many-to-one)
- `transfer_lines` → TransferLine[] (one-to-many)

**Indexes:**

- `(from_location_id, status)` - For outbound transfers
- `(to_location_id, status)` - For inbound transfers
- `requested_by` - For user's transfers
- `(status, request_date)` - For filtering and sorting

**Business Rules:**

- Source and destination locations must be different
- Requires approval before execution (Supervisor or Admin)
- Stock deducted from source, added to destination (atomic operation)
- WAC transferred from source to destination

### TransferLine

Line items in transfer.

**Table:** `transfer_lines`

| Column            | Type          | Nullable | Default  | Description                  |
| ----------------- | ------------- | -------- | -------- | ---------------------------- |
| `id`              | UUID          | No       | `uuid()` | Primary key                  |
| `transfer_id`     | UUID          | No       | -        | Transfer ID                  |
| `item_id`         | UUID          | No       | -        | Item ID                      |
| `quantity`        | DECIMAL(15,4) | No       | -        | Quantity transferred         |
| `wac_at_transfer` | DECIMAL(15,4) | No       | -        | WAC from source location     |
| `line_value`      | DECIMAL(15,2) | No       | -        | `quantity × wac_at_transfer` |

**Relationships:**

- `transfer` → Transfer (many-to-one, CASCADE on delete)
- `item` → Item (many-to-one, RESTRICT on delete)

**Indexes:**

- `transfer_id` - For transfer line lookups
- `item_id` - For item transfer history

**Business Rules:**

- Quantity must be positive
- Source location must have sufficient stock
- WAC from source used for destination

## Control Models

### NCR (Non-Conformance Report)

Quality and price variance issues.

**Table:** `ncrs`

| Column             | Type          | Nullable | Default  | Description                         |
| ------------------ | ------------- | -------- | -------- | ----------------------------------- |
| `id`               | UUID          | No       | `uuid()` | Primary key                         |
| `ncr_no`           | VARCHAR(50)   | No       | -        | Unique NCR number                   |
| `location_id`      | UUID          | No       | -        | Location ID                         |
| `type`             | NCRType       | No       | `MANUAL` | NCR type (MANUAL, PRICE_VARIANCE)   |
| `auto_generated`   | BOOLEAN       | No       | `false`  | True if auto-created from variance  |
| `delivery_id`      | UUID          | Yes      | -        | Linked delivery (if price variance) |
| `delivery_line_id` | UUID          | Yes      | -        | Specific delivery line              |
| `reason`           | TEXT          | No       | -        | NCR reason/description              |
| `quantity`         | DECIMAL(15,4) | Yes      | -        | Affected quantity                   |
| `value`            | DECIMAL(15,2) | No       | -        | NCR value                           |
| `status`           | NCRStatus     | No       | `OPEN`   | NCR status                          |
| `created_by`       | UUID          | No       | -        | User who created                    |
| `created_at`       | TIMESTAMPTZ   | No       | `now()`  | Creation timestamp                  |
| `resolved_at`      | TIMESTAMPTZ   | Yes      | -        | Resolution timestamp                |
| `resolution_notes` | TEXT          | Yes      | -        | Resolution notes                    |

**NCR Status Lifecycle:**

1. `OPEN` - NCR created, not yet sent
2. `SENT` - NCR sent to supplier
3. `CREDITED` - Credit received from supplier
4. `REJECTED` - Supplier rejected NCR
5. `RESOLVED` - NCR resolved/closed

**Relationships:**

- `location` → Location (many-to-one, RESTRICT)
- `delivery`, `delivery_line` (many-to-one, SET NULL)
- `creator` → User (many-to-one, RESTRICT)

**Indexes:**

- `(location_id, status)` - For location NCRs by status
- `(location_id, type)` - For NCR type filtering
- `(location_id, created_at)` - For recent NCRs
- `created_by` - For user's NCRs

**Business Rules:**

- Auto-generated NCRs created when delivery price ≠ period price
- Manual NCRs for quality issues, damages, etc.

### Reconciliation

Period-end reconciliation per location.

**Table:** `reconciliations`

| Column          | Type          | Nullable | Default  | Description           |
| --------------- | ------------- | -------- | -------- | --------------------- |
| `id`            | UUID          | No       | `uuid()` | Primary key           |
| `period_id`     | UUID          | No       | -        | Period ID             |
| `location_id`   | UUID          | No       | -        | Location ID           |
| `opening_stock` | DECIMAL(15,2) | No       | `0`      | Opening stock value   |
| `receipts`      | DECIMAL(15,2) | No       | `0`      | Total deliveries      |
| `transfers_in`  | DECIMAL(15,2) | No       | `0`      | Inbound transfers     |
| `transfers_out` | DECIMAL(15,2) | No       | `0`      | Outbound transfers    |
| `issues`        | DECIMAL(15,2) | No       | `0`      | Total issues          |
| `closing_stock` | DECIMAL(15,2) | No       | `0`      | Closing stock value   |
| `adjustments`   | DECIMAL(15,2) | No       | `0`      | General adjustments   |
| `back_charges`  | DECIMAL(15,2) | No       | `0`      | Back charges          |
| `credits`       | DECIMAL(15,2) | No       | `0`      | Credits received      |
| `condemnations` | DECIMAL(15,2) | No       | `0`      | Condemned stock       |
| `last_updated`  | TIMESTAMPTZ   | No       | `now()`  | Last update timestamp |

**Unique Constraint:** `(period_id, location_id)` - One reconciliation per location per period

**Relationships:**

- `period` → Period (many-to-one, CASCADE on delete)
- `location` → Location (many-to-one, CASCADE on delete)

**Indexes:**

- `period_id` - For period reconciliations
- `location_id` - For location history

**Business Rules:**

- Formula: `opening_stock + receipts + transfers_in - transfers_out - issues + adjustments - back_charges + credits - condemnations = closing_stock`
- Auto-calculated from transactions
- Used for period-end reporting

## Indexes and Performance

### Composite Indexes

Strategic compound indexes for common query patterns:

**Deliveries:**

- `(period_id, location_id)` - Location deliveries in period
- `(location_id, has_variance)` - Variance filtering
- `(location_id, delivery_date)` - Date-based queries

**Issues:**

- `(period_id, location_id)` - Location issues in period
- `(location_id, cost_centre)` - Cost centre filtering
- `(location_id, issue_date)` - Date-based queries

**Transfers:**

- `(from_location_id, status)` - Outbound transfers by status
- `(to_location_id, status)` - Inbound transfers by status
- `(status, request_date)` - Filtering and sorting

**NCRs:**

- `(location_id, status)` - Location NCRs by status
- `(location_id, type)` - NCR type filtering
- `(location_id, created_at)` - Recent NCRs

**Period Locations:**

- `(period_id, status)` - Close coordination

**Items:**

- `(is_active, category)` - Filtered queries

**User Locations:**

- `(user_id, access_level)` - Permission checks

### Performance Considerations

**Pagination:** Default 50 items, max 200
**Response SLAs:**

- Single location operations: < 1s
- Cross-location queries: < 2s
- Reports: < 5s

## Business Rules and Constraints

### Check Constraints

The following constraints ensure data integrity:

1. **Positive Stock**: `location_stock.on_hand >= 0`
2. **Positive WAC**: `location_stock.wac >= 0`
3. **Positive Price**: `item_prices.price > 0`
4. **Different Locations**: `transfers.from_location_id != transfers.to_location_id`
5. **Positive Quantities**: All transaction line quantities > 0
6. **Positive Totals**: All transaction totals >= 0
7. **Positive People**: POB counts >= 0
8. **Valid Date Range**: `periods.end_date > periods.start_date`

### Foreign Key Constraints

**Cascade Delete:**

- UserLocation when User or Location deleted
- All transaction lines when parent transaction deleted
- Period data when Period deleted

**Restrict Delete:**

- Items, Suppliers, Locations referenced in transactions
- Users who posted transactions

**Set Null:**

- Optional references (PO, approver, etc.)

## Data Types

### Decimal Precision

| Field Type      | Precision | Scale | Use Case                                           |
| --------------- | --------- | ----- | -------------------------------------------------- |
| Quantities      | 15        | 4     | Stock quantities (up to 4 decimal places)          |
| Unit Prices     | 15        | 4     | Item prices (precise for WAC calculations)         |
| Monetary Values | 15        | 2     | Transaction totals (2 decimal places for currency) |

### UUID

All primary keys use UUIDv4 for:

- Globally unique identifiers
- Distributed system compatibility
- Security (non-sequential IDs)

### Timestamps

All timestamps use `TIMESTAMPTZ` (timezone-aware) for:

- Consistent time handling across locations
- Correct sorting and comparisons
- Audit trail accuracy

---

**Schema Version:** 1.0
**Last Updated:** 2025-11-27
**Schema File:** `prisma/schema.prisma`
