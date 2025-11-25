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

- [ ] Create `server/api/periods/[periodId]/close.post.ts`
  - [ ] Check admin role
  - [ ] Validate all locations are READY
  - [ ] Create approval request
  - [ ] Return approval ID
- [ ] Create `server/api/approvals/[id]/approve.patch.ts`
  - [ ] Check admin role
  - [ ] Execute period close:
    - [ ] Start database transaction
    - [ ] For each location:
      - [ ] Create snapshot of current stock
      - [ ] Update PeriodLocation status to CLOSED
      - [ ] Set closing_value
    - [ ] Update Period status to CLOSED
    - [ ] Commit transaction
  - [ ] Return approval confirmation
- [ ] Test period close API

### 3.2.3 Snapshot Creation

- [ ] Implement snapshot logic
  - [ ] Capture all location stock levels
  - [ ] Save reconciliation final values
  - [ ] Store as JSON in PeriodLocation
- [ ] Test snapshot creation

### 3.2.4 Roll Forward to Next Period

- [ ] Implement roll forward logic
  - [ ] Create next period automatically
  - [ ] Copy closing stock as opening stock
  - [ ] Reset reconciliation values
  - [ ] Copy period prices (or allow update)
- [ ] Test roll forward

---

## Phase 3.3: Period Close UI (Days 27-28)

### 3.3.1 Period Close Page

- [ ] Create `pages/period-close.vue` (admin only)
- [ ] Display current period info
- [ ] Show checklist
  - [ ] All deliveries posted
  - [ ] All issues posted
  - [ ] All transfers completed
  - [ ] Reconciliations completed for all locations
  - [ ] All locations marked ready
- [ ] Show location readiness status
  - [ ] Table with location, status, ready date
  - [ ] "Mark Ready" button per location (if not ready)
- [ ] Show "Close Period" button
  - [ ] Enabled only if all locations ready
  - [ ] Confirmation modal
- [ ] Implement close handler
  - [ ] Request approval
  - [ ] Approve (admin)
  - [ ] Execute close
  - [ ] Show success message
- [ ] Style with brand colors
- [ ] Test period close UI

### 3.3.2 Approval Components

- [ ] Create `components/approval/ApprovalRequest.vue`
  - [ ] Display approval request details
  - [ ] Approve/Reject buttons
- [ ] Create `components/approval/ApprovalStatus.vue`
  - [ ] Display approval status badge
- [ ] Test approval components

---

## Phase 3.4: Reporting & Exports (Days 28-30)

### 3.4.1 Report API Routes

- [ ] Create `server/api/reports/stock-now.get.ts`
  - [ ] Generate stock report
  - [ ] Filter by location, category
  - [ ] Return formatted data
- [ ] Create `server/api/reports/reconciliation.get.ts`
  - [ ] Generate reconciliation report
  - [ ] Filter by period, location
  - [ ] Return formatted data
- [ ] Create `server/api/reports/deliveries.get.ts`
  - [ ] Generate deliveries report
  - [ ] Filter by period, location, supplier
  - [ ] Return formatted data
- [ ] Create `server/api/reports/issues.get.ts`
  - [ ] Generate issues report
  - [ ] Filter by period, location, cost centre
  - [ ] Return formatted data
- [ ] Test report API routes

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
