# MVP Development Tasks - Complete Checklist

**Project:** Stock Management System - Multi-Location
**Version:** 1.0

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

# Slice 3: Period Management (8 days)

## Phase 3.1: Period Lifecycle (Days 23-25)

### 3.1.1 Period API Routes

- [x] Create `server/api/periods/index.get.ts`
  - [x] Fetch all periods
  - [x] Filter by status, date range
  - [x] Return periods list
- [x] Create `server/api/periods/current.get.ts`
  - [x] Fetch current open period
  - [x] Include location readiness status
  - [x] Return current period
- [x] Create `server/api/periods/index.post.ts`
  - [x] Validate period data (Zod)
  - [x] Check admin role
  - [x] Create new period
  - [x] Create PeriodLocation entries for all locations
  - [x] Return created period
- [x] Create `server/api/periods/[id].get.ts`
  - [x] Fetch single period by ID
  - [x] Include location statuses
  - [x] Return period details
- [x] Test period API routes

### 3.1.2 Period Opening

- [x] Implement period opening logic
  - [x] Set start and end dates
  - [x] Create PeriodLocation entries
  - [x] Copy closing stock from previous period as opening stock
  - [x] Set status to OPEN
- [x] Create UI for period creation (admin only)
  - [x] Form with start/end dates
  - [x] Submit handler
- [x] Test period opening

### 3.1.3 Period Price Setting

- [x] Create workflow for setting period prices at start
- [x] Allow admin to bulk set prices from previous period
- [x] Allow admin to update prices before period starts
- [x] Lock prices once period opens
- [x] Test price locking

---

## Phase 3.2: Period Close Workflow (Days 25-27)

### 3.2.1 Location Readiness Tracking

- [x] Create `server/api/periods/[periodId]/locations/[locationId]/ready.patch.ts`
  - [x] Check user is supervisor or admin
  - [x] Check reconciliation completed
  - [x] Update PeriodLocation status to READY
  - [x] Return updated status
- [x] Test location readiness API

### 3.2.2 Period Close API

- [x] Create `server/api/periods/[periodId]/close.post.ts`
  - [x] Check admin role
  - [x] Validate all locations are READY
  - [x] Create approval request
  - [x] Return approval ID
- [x] Create `server/api/approvals/[id]/approve.patch.ts`
  - [x] Check admin role
  - [x] Execute period close:
    - [x] Start database transaction
    - [x] For each location:
      - [x] Create snapshot of current stock
      - [x] Update PeriodLocation status to CLOSED
      - [x] Set closing_value
    - [x] Update Period status to CLOSED
    - [x] Commit transaction
  - [x] Return approval confirmation
- [x] Test period close API

### 3.2.3 Snapshot Creation

- [x] Implement snapshot logic
  - [x] Capture all location stock levels
  - [x] Save reconciliation final values
  - [x] Store as JSON in PeriodLocation
- [x] Test snapshot creation

### 3.2.4 Roll Forward to Next Period

- [x] Implement roll forward logic
  - [x] Create next period automatically
  - [x] Copy closing stock as opening stock
  - [x] Reset reconciliation values
  - [x] Copy period prices (or allow update)
- [x] Test roll forward

---

## Phase 3.3: Period Close UI (Days 27-28)

### 3.3.1 Period Close Page

- [x] Create `pages/period-close.vue` (admin only)
- [x] Display current period info
- [x] Show checklist
  - [x] All deliveries posted
  - [x] All issues posted
  - [x] All transfers completed
  - [x] Reconciliations completed for all locations
  - [x] All locations marked ready
- [x] Show location readiness status
  - [x] Table with location, status, ready date
  - [x] "Mark Ready" button per location (if not ready)
- [x] Show "Close Period" button
  - [x] Enabled only if all locations ready
  - [x] Confirmation modal
- [x] Implement close handler
  - [x] Request approval
  - [x] Approve (admin)
  - [x] Execute close
  - [x] Show success message
- [x] Style with brand colors
- [x] Test period close UI

### 3.3.2 Approval Components

- [x] Create `components/approval/ApprovalRequest.vue`
  - [x] Display approval request details
  - [x] Approve/Reject buttons
- [x] Create `components/approval/ApprovalStatus.vue`
  - [x] Display approval status badge
- [x] Test approval components

---

## Phase 3.4: Reporting & Exports (Days 28-30)

### 3.4.1 Report API Routes

- [x] Create `server/api/reports/stock-now.get.ts`
  - [x] Generate stock report
  - [x] Filter by location, category
  - [x] Return formatted data
- [x] Create `server/api/reports/reconciliation.get.ts`
  - [x] Generate reconciliation report
  - [x] Filter by period, location
  - [x] Return formatted data
- [x] Create `server/api/reports/deliveries.get.ts`
  - [x] Generate deliveries report
  - [x] Filter by period, location, supplier
  - [x] Return formatted data
- [x] Create `server/api/reports/issues.get.ts`
  - [x] Generate issues report
  - [x] Filter by period, location, cost centre
  - [x] Return formatted data
- [x] Test report API routes

### 3.4.2 Report Pages

- [ ] Create `pages/reports/index.vue`
  - [ ] List available reports
  - [ ] Links to each report page
- [ ] Create `pages/reports/stock-now.vue`
  - [ ] Display stock report
  - [ ] Implement filters
  - [ ] Add export button (CSV)
- [ ] Create `pages/reports/reconciliation.vue`
  - [ ] Display reconciliation report
  - [ ] Implement filters
  - [ ] Add export button
- [ ] Test report pages

### 3.4.3 CSV Export Utility

- [ ] Create `utils/csvExport.ts`
- [ ] Implement CSV generation function
- [ ] Implement download trigger
- [ ] Test CSV export

---

# Task Tracking Guidelines

## How to Use This Checklist

1. **Start at the top** and work through tasks sequentially
2. **Mark tasks complete** by checking the box when done
3. **Add notes** inline if needed (use blockquotes or comments)
4. **Update progress summary** at the top regularly
5. **Skip optional tasks** marked as (optional) if not needed for MVP
6. **Report blockers** immediately if stuck on a task
