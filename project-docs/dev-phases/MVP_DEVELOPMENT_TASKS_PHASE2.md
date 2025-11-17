# MVP Development Tasks - Complete Checklist

**Project:** Stock Management System - Multi-Location
**Version:** 1.0

---

## Phase 1 Summary - What We Built

Phase 1 (November 4-11, 2025) established the complete foundation for the Stock Management System, delivering a production-ready platform with authentication, core inventory management, and comprehensive UI infrastructure. We built the entire database layer with 22 tables using Prisma ORM on PostgreSQL/Supabase, including all core entities (Users, Locations, Items, Suppliers), period and stock models (LocationStock with WAC tracking, ItemPrice for period-based price locking), transaction models (Deliveries, Issues, PRF/PO), and control models (NCR, POB, Reconciliation, Approval). The authentication system was fully implemented using nuxt-auth-utils with secure JWT sessions in httpOnly cookies, role-based access control (Admin/Supervisor/Operator), and comprehensive permission checks via Pinia stores and composables.

We delivered six complete feature modules with end-to-end functionality: **Locations** (CRUD with user assignments and access levels), **Items** (master data management with category filtering and pagination), **Price Management** (period-based price setting with >10% variance warnings), **Deliveries** (goods receipt with automatic price variance NCR generation and WAC recalculation), **Issues** (stock consumption with pre-transaction validation preventing negative inventory), and **Stock Now** (real-time inventory visibility with single-location and consolidated views for supervisors). The Dashboard provides location-specific metrics including total receipts, total issues, total mandays, days left in period, and recent activity.

The technical infrastructure includes a comprehensive design system with 6 color palettes (navy, emerald, zinc, amber, red, blue), 40+ semantic tokens, and 40+ utility classes aligned to business concepts. We created reusable UI components (LoadingSpinner, ErrorAlert, EmptyState, PageHeader, DataTable), a complete app layout with responsive navbar and collapsible sidebar, toast notifications, and three global Pinia stores (auth, location, period, UI). Critical business logic utilities were built and tested including WAC calculation (45 test cases), price variance detection (45 test cases), and stock validation preventing negative inventory. All code follows strict TypeScript standards with zero compilation errors, Prettier formatting, and comprehensive Zod validation on all API endpoints.

---

## Overview

This document contains a comprehensive, step-by-step task list for building the complete MVP of the Stock Management System. Tasks are organized by development slices as defined in [MVP.md](project-docs/MVP.md).

**Development Timeline:**

- **Slice 1:** Foundation & Locations
- **Slice 2:** Transfers & Controls
- **Slice 3:** Period Management
- **Slice 4:** Polish & Performance
- **Slice 5:** Post-Development: UAT & Launch

---

# Slice 2: Transfers & Controls (10 days)

## Phase 2.1: Transfer Management (Days 13-15)

### 2.1.1 Transfer API Routes

- [x] Create `server/api/transfers/index.get.ts`
  - [x] Fetch transfers with filters
  - [x] Filter by location (from/to), status, date
  - [x] Include transfer lines
  - [x] Return transfers list
- [x] Create `server/api/transfers/index.post.ts`
  - [x] Validate transfer data (Zod)
  - [x] Check user permissions
  - [x] Validate source location has sufficient stock
  - [x] Create transfer in PENDING_APPROVAL status
  - [x] Return created transfer
- [x] Create `server/api/transfers/[id].get.ts`
  - [x] Fetch single transfer by ID
  - [x] Include lines
  - [x] Return transfer details
- [x] Create `server/api/transfers/[id]/approve.patch.ts`
  - [x] Check user is supervisor or admin
  - [x] Start database transaction
  - [x] For each transfer line:
    - [x] Deduct from source location stock
    - [x] Add to destination location stock (at source WAC)
  - [x] Update transfer status to COMPLETED
  - [x] Commit transaction
  - [x] Return updated transfer
- [x] Create `server/api/transfers/[id]/reject.patch.ts`
  - [x] Check user is supervisor or admin
  - [x] Update transfer status to REJECTED
  - [x] Add rejection comment
  - [x] Return updated transfer
- [x] Test transfer API routes

### 2.1.2 Transfers List Page

- [ ] Create `pages/transfers/index.vue`
- [ ] Display transfers table
  - [ ] Transfer No, Date, From Location, To Location, Status, Total Value
- [ ] Implement filters
  - [ ] Status dropdown
  - [ ] Date range
  - [ ] From/To location
- [ ] Show status badges (use brand colors)
  - [ ] Pending: navy
  - [ ] Approved: emerald
  - [ ] Rejected: red
- [ ] Add "New Transfer" button
- [ ] Add row click to view details
- [ ] Test transfers list

### 2.1.3 Create Transfer UI

- [ ] Create `pages/transfers/create.vue`
- [ ] Design transfer form
  - [ ] From location dropdown (user locations only)
  - [ ] To location dropdown (exclude from location)
  - [ ] Transfer date picker
  - [ ] Notes textarea
- [ ] Implement transfer lines table
  - [ ] Item selection dropdown
  - [ ] Show source location on-hand
  - [ ] Quantity input with validation
  - [ ] WAC display
  - [ ] Line value (auto-calculated)
  - [ ] Add/Remove line buttons
- [ ] Show total value (auto-calculated)
- [ ] Implement stock validation
  - [ ] Check quantity <= source on-hand
  - [ ] Show warnings
- [ ] Implement submit handler
  - [ ] Call API to create transfer
  - [ ] Handle success (redirect to transfers list)
  - [ ] Handle errors
- [ ] Test transfer creation

### 2.1.4 Transfer Detail & Approval

- [ ] Create `pages/transfers/[id].vue`
- [ ] Display transfer header
  - [ ] Transfer No, Date, Status
  - [ ] From/To locations
  - [ ] Requested by
- [ ] Display transfer lines table
  - [ ] Item, Quantity, WAC, Value
- [ ] Display total value
- [ ] Show approval section (supervisor/admin only)
  - [ ] Approve button (emerald)
  - [ ] Reject button (red)
  - [ ] Comments textarea
- [ ] Implement approve handler
  - [ ] Call approve API
  - [ ] Show success message
  - [ ] Refresh transfer data
- [ ] Implement reject handler
  - [ ] Call reject API
  - [ ] Show success message
  - [ ] Refresh transfer data
- [ ] Test transfer approval flow

### 2.1.5 Transfer Components

- [ ] Create `components/transfer/TransferForm.vue`
  - [ ] Reusable transfer form
- [ ] Create `components/transfer/TransferStatusBadge.vue`
  - [ ] Status badge with appropriate colors
- [ ] Create `components/transfer/ApprovalActions.vue`
  - [ ] Approve/Reject buttons with modal confirmation
- [ ] Test components

---

## Phase 2.2: NCR Management (Days 15-17)

### 2.2.1 NCR API Routes

- [ ] Create `server/api/ncrs/index.get.ts`
  - [ ] Fetch NCRs with filters
  - [ ] Filter by location, type, status, date
  - [ ] Return NCRs list
- [ ] Create `server/api/ncrs/index.post.ts`
  - [ ] Validate NCR data (Zod)
  - [ ] Check user permissions
  - [ ] Create manual NCR
  - [ ] Link to delivery if provided
  - [ ] Return created NCR
- [ ] Create `server/api/ncrs/[id].get.ts`
  - [ ] Fetch single NCR by ID
  - [ ] Include related delivery/line info
  - [ ] Return NCR details
- [ ] Create `server/api/ncrs/[id].patch.ts`
  - [ ] Update NCR status
  - [ ] Add resolution notes
  - [ ] Return updated NCR
- [ ] Test NCR API routes

### 2.2.2 NCRs List Page

- [ ] Create `pages/ncrs/index.vue`
- [ ] Display NCRs table
  - [ ] NCR No, Type, Date, Location, Reason, Value, Status
- [ ] Implement filters
  - [ ] Type (MANUAL/PRICE_VARIANCE)
  - [ ] Status dropdown
  - [ ] Location dropdown
  - [ ] Auto-generated checkbox
- [ ] Show status badges (brand colors)
- [ ] Add "New NCR" button (manual)
- [ ] Add row click to view details
- [ ] Test NCRs list

### 2.2.3 Create Manual NCR

- [ ] Create `pages/ncrs/create.vue`
- [ ] Design NCR form
  - [ ] Location dropdown
  - [ ] Delivery selection (optional)
  - [ ] Reason textarea
  - [ ] Lines table
    - [ ] Item selection
    - [ ] Quantity
    - [ ] Value
- [ ] Implement submit handler
- [ ] Test manual NCR creation

### 2.2.4 NCR Detail Page

- [ ] Create `pages/ncrs/[id].vue`
- [ ] Display NCR header
  - [ ] NCR No, Type, Date, Location
  - [ ] Status badge
- [ ] Display NCR details
  - [ ] Reason
  - [ ] Related delivery (if auto-generated)
  - [ ] Item lines
  - [ ] Total value
- [ ] Show status update section
  - [ ] Status dropdown (OPEN → SENT → CREDITED/REJECTED)
  - [ ] Resolution notes
  - [ ] Update button
- [ ] Implement status update handler
- [ ] Test NCR details and updates

### 2.2.5 Auto-Generated Price Variance NCRs

- [ ] Verify auto-NCR creation in delivery posting
- [ ] Test price variance NCR flow end-to-end
  - [ ] Post delivery with different price
  - [ ] Verify NCR created automatically
  - [ ] Check NCR appears in list
  - [ ] Verify type = PRICE_VARIANCE
  - [ ] Verify auto_generated = true
- [ ] Test price variance NCR display in UI
  - [ ] Show in delivery details
  - [ ] Link to NCR detail page

---

## Phase 2.3: POB Entry (Days 17-18)

### 2.3.1 POB API Routes

- [ ] Create `server/api/locations/[locationId]/pob.get.ts`
  - [ ] Fetch POB entries for location and period
  - [ ] Return daily entries
- [ ] Create `server/api/locations/[locationId]/pob.post.ts`
  - [ ] Validate POB data (Zod)
  - [ ] Bulk create/update daily entries
  - [ ] Return updated entries
- [ ] Create `server/api/pob/[id].patch.ts`
  - [ ] Update single POB entry
  - [ ] Return updated entry
- [ ] Test POB API routes

### 2.3.2 POB Page UI

- [ ] Create `pages/pob.vue`
- [ ] Design POB entry interface
  - [ ] Calendar view or date range selector
  - [ ] Table with dates in current period
  - [ ] Columns: Date, Crew Count, Extra Count, Total (calculated)
  - [ ] Editable cells for crew and extra
- [ ] Implement POB entry
  - [ ] Inline editing
  - [ ] Auto-save on blur (or Save button)
  - [ ] Validation (non-negative integers)
- [ ] Show period total mandays
- [ ] Style with brand colors
- [ ] Test POB entry

### 2.3.3 POB Components

- [ ] Create `components/pob/POBTable.vue`
  - [ ] Editable POB table
- [ ] Create `components/pob/POBSummary.vue`
  - [ ] Display total mandays for period
- [ ] Test components

---

## Phase 2.4: Reconciliations (Days 18-20)

### 2.4.1 Reconciliation Calculation Utility

- [ ] Create `server/utils/reconciliation.ts`
- [ ] Implement reconciliation calculation
  ```typescript
  calculateConsumption(opening, receipts, transfersIn, transfersOut, issues, closing, adjustments, ...): number
  ```
- [ ] Implement manday cost calculation
  ```typescript
  calculateMandayCost(consumption, totalMandays): number
  ```
- [ ] Test calculations

### 2.4.2 Reconciliation API Routes

- [ ] Create `server/api/locations/[locationId]/reconciliations/[periodId].get.ts`
  - [ ] Fetch reconciliation for location and period
  - [ ] Auto-calculate if not exists:
    - [ ] Opening stock (from previous period)
    - [ ] Receipts (sum deliveries)
    - [ ] Transfers in/out (sum transfers)
    - [ ] Issues (sum issues)
    - [ ] Closing stock (from Stock Now)
  - [ ] Return reconciliation
- [ ] Create `server/api/locations/[locationId]/reconciliations/[periodId].patch.ts`
  - [ ] Validate reconciliation data (Zod)
  - [ ] Check user is supervisor or admin
  - [ ] Update adjustments:
    - [ ] Back-charges
    - [ ] Credits
    - [ ] Condemnations
    - [ ] Others
  - [ ] Recalculate consumption and manday cost
  - [ ] Return updated reconciliation
- [ ] Create `server/api/reconciliations/consolidated.get.ts`
  - [ ] Fetch reconciliations for all locations in period
  - [ ] Aggregate totals
  - [ ] Return consolidated view (supervisor/admin only)
- [ ] Test reconciliation API routes

### 2.4.3 Reconciliations Page

- [ ] Create `pages/reconciliations.vue`
- [ ] Display reconciliation for current location and period
- [ ] Show calculated values (read-only)
  - [ ] Opening Stock
  - [ ] Receipts
  - [ ] Transfers In
  - [ ] Transfers Out
  - [ ] Issues
  - [ ] Closing Stock
- [ ] Show editable adjustment fields
  - [ ] Back-charges
  - [ ] Credits Due
  - [ ] Condemnations
  - [ ] Others
- [ ] Show calculated results
  - [ ] Consumption
  - [ ] Total Mandays (from POB)
  - [ ] Manday Cost
- [ ] Implement save handler
- [ ] Show location selector (supervisor/admin)
- [ ] Style with brand colors
- [ ] Test reconciliations page

### 2.4.4 Consolidated Reconciliation View

- [ ] Create `pages/reconciliations/consolidated.vue` (supervisor/admin only)
- [ ] Display reconciliations for all locations
- [ ] Show totals per location
- [ ] Show grand totals
- [ ] Implement export to CSV (optional)
- [ ] Test consolidated view

### 2.4.5 Reconciliation Components

- [ ] Create `components/reconciliation/ReconciliationSummary.vue`
  - [ ] Display reconciliation breakdown
- [ ] Create `components/reconciliation/AdjustmentsForm.vue`
  - [ ] Form for entering adjustments
- [ ] Test components

---

## Phase 2.5: Slice 2 Testing & Polish (Days 20-22)

### 2.5.1 Integration Testing

- [ ] Test complete transfer flow
  - [ ] Create transfer
  - [ ] Approve transfer
  - [ ] Verify stock updates in both locations
- [ ] Test complete NCR flow
  - [ ] Manual NCR creation
  - [ ] Auto-NCR from price variance
  - [ ] Status updates
- [ ] Test POB entry and usage in reconciliations
- [ ] Test reconciliation calculations with real data
- [ ] Test consolidated views

### 2.5.2 UI/UX Refinements

- [ ] Review all forms for consistency
- [ ] Ensure brand colors used consistently
- [ ] Test responsive design on mobile
- [ ] Add loading states to all async operations
- [ ] Improve error messages
- [ ] Add success confirmations

### 2.5.3 Performance Optimization

- [ ] Optimize database queries (add indexes if needed)
- [ ] Implement pagination where missing
- [ ] Add caching for frequently accessed data
- [ ] Test API response times

---

# Task Tracking Guidelines

## How to Use This Checklist

1. **Start at the top** and work through tasks sequentially
2. **Mark tasks complete** by checking the box when done
3. **Add notes** inline if needed (use blockquotes or comments)
4. **Update progress summary** at the top regularly
5. **Skip optional tasks** marked as (optional) if not needed for MVP
6. **Report blockers** immediately if stuck on a task
