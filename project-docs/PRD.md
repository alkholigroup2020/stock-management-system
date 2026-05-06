# PRD — Stock Management System

**Document owner:** Fawzy Mohamed
**Status:** Production (MVP feature-complete)
**Last Updated:** 2026-05-06
**Source of truth:** This document reflects the implementation in the current `main` branch. Where the previous PRD disagreed with the code, the code has been treated as authoritative and the PRD updated accordingly.

---

## Implementation Status Summary

| Category                       | Status      | Notes                                                            |
| ------------------------------ | ----------- | ---------------------------------------------------------------- |
| Authentication & Authorization | ✅ Complete | JWT (httpOnly cookie), RBAC, per-location access control         |
| Multi-Location Management      | ✅ Complete | Full CRUD, multi-location user assignment via `UserLocation`     |
| Items & Pricing                | ✅ Complete | Global items, period pricing, bulk import (5 columns)            |
| PRF/PO Workflow                | ✅ Complete | Supervisor approves PRFs; Procurement creates POs                |
| Deliveries                     | ✅ Complete | WAC recalc, over-delivery hold, price-variance NCR auto-creation |
| Issues                         | ✅ Complete | Cost-centre tracking (FOOD/CLEAN/OTHER), stock validation        |
| Transfers                      | ✅ Complete | Approval workflow, atomic stock movement at source WAC           |
| NCR Management                 | ✅ Complete | Auto-generated + manual; email to Finance/Procurement/Supplier   |
| Period Management              | ✅ Complete | Coordinated close, price locking, opening/closing snapshots      |
| Reconciliations                | ✅ Complete | Per-location + consolidated; NCR credits/losses integrated       |
| PWA                            | ✅ Complete | Installable, offline-aware UI (no offline data store)            |
| Reports                        | ✅ Complete | Stock Now, Deliveries, Issues, Reconciliation (CSV export)       |
| Email Notifications            | ✅ Complete | NCR + PO + PRF approval + over-delivery + PO closed              |
| Suppliers                      | ✅ Complete | Multi-email support, VAT registration, address                   |
| User Management                | ✅ Complete | Four roles, multi-location assignment, profile / password change |

---

## 1) Product Overview

### 1.1 Purpose

Replace the legacy Excel workbook with a web application that tracks stock end-to-end for **multiple locations** across monthly accounting periods. The app makes daily work faster, reduces errors, and simplifies month-end across all sites.

### 1.2 Problem

The Excel file is slow to update, easy to break, and hard to audit. Month-end takes too long and requires manual checks. Managing multiple locations in separate Excel files creates inconsistencies and consolidation challenges.

### 1.3 Vision

Add stock when deliveries arrive at any location. Subtract stock when kitchens use items. Transfer between locations as needed. Close the month with a simple checklist across all sites.

### 1.4 Primary Users (Roles)

The system supports four roles defined in the `UserRole` enum (`OPERATOR`, `SUPERVISOR`, `ADMIN`, `PROCUREMENT_SPECIALIST`):

- **Operator (Store/Kitchen):** Posts Deliveries and Issues at assigned locations, enters POB, creates PRFs, creates manual NCRs. Access is restricted to locations explicitly assigned via `UserLocation`.
- **Supervisor:** All Operator capabilities plus PRF approval, transfer approval, over-delivery approval, PO closure, reconciliation management, manual NCR creation. Implicit access to **all** locations.
- **Procurement Specialist:** Sees only approved PRFs and creates / edits Purchase Orders. Cannot post deliveries, issues, transfers or access the rest of the system.
- **Admin:** Full system access. Manages users, locations, items, suppliers, period prices, executes period close, configures notification settings, resends failed NCR notifications.

## 2) Goals and Business Objectives

- **Speed:** Post deliveries / issues quickly with minimal clicks.
- **Accuracy:** Prevent negative stock; maintain WAC costing; full audit trail.
- **Multi-location:** Support multiple sites with inter-location transfers.
- **Month-end simplicity:** Live reconciliations per location and a consolidated view.
- **Adoption:** Simple language and modern UI familiar to users.

## 3) Background & Strategic Fit

- Current operations rely on per-location Excel files; stakeholders want fewer manual steps and fewer errors.
- The app preserves the existing business logic but adds multi-location support, formal approvals, and price-variance controls.
- Fits the broader effort to digitise site operations and improve cost control across all locations.

## 4) Assumptions — Confirmed

- ✅ Multiple sites with inter-location transfers supported
- ✅ No historical data migration (start fresh)
- ✅ Currency: SAR (Saudi Riyal)
- ✅ Tax: Net (tax-exclusive); VAT calculated separately at 15% on PRFs and POs
- ✅ Costing: WAC (Weighted Average Cost)
- ✅ Internet access available (with graceful offline UI handling via PWA — no offline writes)

## 5) Scope

### 5.1 User Stories (Core)

**Multi-Location Management:**
- As an Admin, I can create and manage multiple locations.
- As an Operator, I am assigned to specific locations and can only post to those locations.
- As a Supervisor, I can view all locations and approve transfers between them.
- As an Admin, I can view consolidated reports across all locations.

**Stock Movement:**
- As an Operator, I post a Delivery (linked to a PO) to increase stock at my location and update WAC.
- As an Operator, I post an Issue to record consumption at my location.
- As an Operator or Supervisor, I create Transfer Requests to move stock between locations.
- As a Supervisor, I approve transfers to execute the stock movement.
- As any user with location access, I can view current stock for that location.

**Procurement (PRF → PO):**
- As an Operator, I create a Purchase Requisition Form (PRF) for needed materials.
- As a Supervisor, I approve or reject PRFs.
- As a Procurement Specialist, I see approved PRFs and create Purchase Orders against them.
- As a Procurement Specialist, I edit POs while they are still OPEN and have no deliveries recorded.
- As a Supervisor or Admin, I close POs (manually or implicitly via auto-close on full delivery).

**Price Control:**
- As an Admin, I set item prices per period; prices lock when the period opens.
- As the system, I automatically create an NCR (`type: PRICE_VARIANCE`) when a posted delivery's unit price differs from the period price.
- As a Supervisor or Admin, I review and resolve NCRs with a financial impact (`CREDIT`, `LOSS`, or `NONE`).

**Period Management:**
- As an Operator or Supervisor, I enter daily POB for each assigned location.
- As a Supervisor, I review reconciliations and mark each location READY.
- As an Admin, I request period close after all locations are READY; the system creates an approval that the Admin then approves to finalise the close.
- As an Admin, I view consolidated reconciliation across all locations.

**Notifications:**
- As the system, I send NCR notifications (Finance, Procurement, Supplier) on every NCR created.
- As the system, I email the supplier when a PO is created and when a PO is closed.
- As the system, I email the PRF requester when their PRF is approved or when the resulting PO is closed.
- As the system, I notify Supervisors/Admins when an Operator submits a draft delivery with over-delivery for approval.
- As an Admin, I configure Finance Team and Procurement Team email lists.
- As an Admin, I resend failed NCR notifications (5-minute cooldown per recipient group).

**Progressive Web App (PWA):**
- As any user, I can install the app on my device.
- As any user, I see clear offline status when internet is unavailable.
- As the system, I disable data-modifying actions when offline.

### 5.2 Approval Matrix

| Action                        | Required Approver       |
| ----------------------------- | ----------------------- |
| PRF                           | Supervisor or Admin     |
| PO creation                   | None (Procurement Specialist creates directly from approved PRF) |
| PO closure (with unfulfilled lines) | Supervisor or Admin (closure reason mandatory) |
| Over-delivery on a Delivery   | Supervisor or Admin     |
| Transfer                      | Supervisor or Admin     |
| Issue                         | None (posts immediately, no draft state) |
| Reconciliation Mark-Ready     | Supervisor or Admin     |
| Period Close                  | Admin (uses an Approval record with `entity_type = PERIOD_CLOSE`) |

### 5.3 Features (MVP)

1. **Location Management** ✅
   - Create / edit / deactivate locations
   - Assign multiple users to a location (via `UserLocation`)
   - Location types: `KITCHEN`, `STORE`, `CENTRAL`, `WAREHOUSE`
   - Per-location dashboard

2. **Dashboard** ✅
   - Active-location selector with persistent state
   - Period totals per location
   - Consolidated dashboard for Supervisors / Admins (`/api/dashboard/consolidated`)
   - Recent activity widget

3. **Items** ✅
   - Global item master (code, name, unit, category, sub-category, is_active)
   - Period prices set per Item per Period (locked on period open)
   - Per-location stock (`LocationStock` with on_hand, wac, optional min_stock / max_stock — min/max are only settable via API/DB, no UI surface yet)
   - Bulk import via Excel/CSV — exact columns: **Code, Name, Unit, Category, Subcategory** (no Min Stock, no Active flag in the import; new items are always created `is_active = true`). Permission: Admin or Supervisor.
   - Units: `KG`, `EA`, `LTR`, `BOX`, `CASE`, `PACK`

4. **Orders (PRF → PO)** ✅
   - PRF types: `URGENT`, `DPA`, `NORMAL` (DPA has no special workflow today; same approval as NORMAL)
   - PRF categories: `FOOD`, `CLEANING`, `OTHER`
   - PRF lifecycle: `DRAFT → PENDING → APPROVED → CLOSED` (or `REJECTED` from any pre-close state)
   - PRF gets auto-set to `CLOSED` when its derived PO closes
   - Clone any PRF (commonly used after rejection or for repeat orders)
   - PO lifecycle: `OPEN → CLOSED` (auto on full delivery, or manual by Supervisor/Admin)
   - PO closure email goes to the original PRF requester only
   - VAT calculated at 15% (per-line `vat_percent` defaults to 15 but is configurable per line in the schema)
   - PO email resend to supplier supported

5. **Numbering Formats** ✅ (authoritative)
   - PRF: `PRF-{LOCATION-UPPERCASE}-{DD}-{Mon}-{YYYY}-{NN}` — e.g. `PRF-KITCHEN-27-Jan-2026-01`
   - PO:  `PO-{DD}-{Mon}-{YYYY}-{NNN}`
   - Delivery: `DLV-{LOCATION-UPPERCASE}-{DD}-{Mon}-{YYYY}-{NN}` — e.g. `DLV-KITCHEN-27-Jan-2026-01`
   - Issue: `ISS-{YYYY}-{NNN}`
   - Transfer: `TRF-{YYYY}-{NNN}`
   - NCR: `NCR-{YYYY}-{NNN}`

6. **Deliveries** ✅
   - Required PO link (one PO → many deliveries)
   - Supplier auto-populated from PO and validated to match
   - Invoice number unique across all deliveries; required when posting (optional on draft)
   - `DeliveryStatus` enum is `DRAFT | POSTED`. Over-delivery hold is implemented via the boolean `pending_approval` on the delivery row (UI displays it as a "Pending Approval" badge).
   - Over-delivery rejection sets `over_delivery_rejected = true` and permanently locks the delivery
   - WAC recalculation on POST: `newWAC = (curQty × curWAC + recvQty × recvPrice) / (curQty + recvQty)`
   - Price variance auto-creates an NCR with `type: PRICE_VARIANCE` and `auto_generated: true`
   - Auto-closes the linked PO when all PO lines are fully delivered

7. **Issues** ✅
   - Cost centres: `FOOD`, `CLEAN`, `OTHER` (three values only)
   - Posts immediately (no draft / approval state)
   - Validates against `LocationStock.on_hand` to prevent negative stock
   - Deducts at the current WAC (no recalculation)
   - "Sync Stock" button bulk-loads every item with on-hand stock at the location into the issue lines

8. **Transfers** ✅
   - `TransferStatus` enum: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `COMPLETED`
   - **Effective workflow**: `DRAFT → PENDING_APPROVAL → COMPLETED` (or `REJECTED`) — the `APPROVED` state exists in the enum but is not used by the current approve flow, which moves directly to `COMPLETED` after atomic stock movement
   - Source location must have sufficient stock at approval time (re-validated)
   - Destination receives stock at the source's WAC; destination WAC is recalculated if it already had stock

9. **NCR (Non-Conformance Reports)** ✅
   - Types: `MANUAL`, `PRICE_VARIANCE`
   - `NCRStatus` enum: `OPEN`, `CREDITED`, `REJECTED`, `RESOLVED` (no `SENT` state)
   - Financial impact on resolution: `NONE`, `CREDIT`, `LOSS` (`CREDIT` and `LOSS` flow into reconciliation)
   - All authenticated roles with location access can create manual NCRs
   - Notifications on creation: Finance Team, Procurement Team, and Supplier (only if linked to a delivery whose supplier has emails)
   - Resend failed notifications: **Admin only**, 5-minute cooldown per recipient group
   - Notification history visible on each NCR detail page

10. **Stock Now** ✅
    - Per-location view with search, category filter, and low-stock filter
    - Consolidated cross-location view for Supervisors / Admins
    - Real-time valuation (on_hand × WAC)
    - CSV export (consolidated and single-location variants)
    - Low-stock badge driven by `LocationStock.min_stock` (set only via API/DB at present)

11. **POB (Personnel On Board)** ✅
    - Per-location daily entry
    - Two fields per day stored as `crew_count` and `extra_count`; UI labels them **"Mandays"** and **"Visitors Meals"**
    - Auto-saves on field blur — no explicit save button
    - Period-total summary surfaces total mandays for cost-per-person reporting
    - Printable report

12. **Reconciliations** ✅
    - Per-location and consolidated views
    - Formula: `Opening + Receipts + Transfers In − Transfers Out − Issues = Expected Closing`
    - Adjustment fields: `back_charges`, `credits`, `condemnations`, plus auto-populated `ncr_credits` and `ncr_losses` from resolved/credited/rejected NCRs
    - Mark-Ready / Mark-Unready transitions on `PeriodLocation`

13. **Period Management & Close** ✅
    - `PeriodStatus` enum: `DRAFT`, `OPEN`, `PENDING_CLOSE`, `APPROVED`, `CLOSED`
    - Workflow: Admin sets prices in DRAFT → opens period (locks prices) → all locations marked READY → Admin requests close (`PENDING_CLOSE` + Approval record) → Admin approves the request (`APPROVED`) → close finalises (`CLOSED`) → opening balances roll forward to the next period
    - Period prices can be **copied from a previous period** (`/api/periods/:id/prices-copy`) on a DRAFT period

14. **Progressive Web App (PWA)** ✅
    - Installable (Add to Home Screen)
    - `useOnlineStatus()` composable detects offline state
    - Action buttons disabled when offline
    - Static assets cached via Vite PWA / service worker
    - **No offline writes** — IndexedDB queue is explicitly out of scope for MVP

15. **Suppliers** ✅
    - Fields: `code`, `name`, `contact`, `emails` (array), `phone`, `mobile`, `vat_reg_no`, `address`, `is_active`
    - **Payment Terms is not a supplier field** — it lives on each PO
    - Supplier `emails` list drives PO and supplier-bound NCR notifications

16. **User Management** ✅
    - Four roles: `OPERATOR`, `SUPERVISOR`, `ADMIN`, `PROCUREMENT_SPECIALIST`
    - Operators have a `default_location_id` set during creation; **multi-location access is configured on the user edit page** via `UserLocation` (Operators must be assigned at least one location to access any data)
    - Profile / password change (`/api/auth/change-password`)
    - Username / email availability check before submit
    - Deactivate vs delete (deactivate preserves audit trail)

17. **Notification Settings** ✅
    - Admin-managed Finance Team and Procurement Team email lists (`/api/settings/notifications`)
    - Email validation on save
    - No "test email" feature shipped in MVP

## 6) Out of Scope (v1)

- Complex routing (multi-stop transfers)
- Partial period closes (all locations close together)
- Mobile native apps
- Full offline mode with local database / write queue / sync
- Advanced forecasting
- Barcode scanning
- Multi-currency
- FIFO / LIFO costing options
- Arabic localisation (English only at MVP)
- Test-email button on Notification Settings

## 7) Functional Requirements

### 7.1 Location Management
- **Inputs:** `name`, `code` (unique), `type` (`KITCHEN | STORE | CENTRAL | WAREHOUSE`), `address` (optional), `timezone` (default `Asia/Riyadh`)
- **Constraints:** Cannot delete a location that has any transactions; deactivate instead.
- **Note:** Locations do not currently have a "manager" field.

### 7.2 Period Price Management
- **Inputs:** Item prices set on a DRAFT period (per item, currency `SAR`, decimal precision 4)
- **Process:** Prices freeze when the period transitions to `OPEN`
- **Validation:** Any posted delivery line whose `unit_price` differs from the period price triggers an automatic `PRICE_VARIANCE` NCR
- **Output:** NCR created, delivery still posted at the actual price (with `has_variance = true`)

### 7.3 Transfers
- **Inputs:** Source location, destination location, items with quantities, optional notes
- **Process:** On approval, deduct from source at source WAC and add to destination, recalculating destination WAC if it already had stock
- **Validation:** Source on-hand re-checked at approval time, not creation time
- **Output:** Transfer marked `COMPLETED`

### 7.4 Multi-Location Period Close
- **Inputs:** All `PeriodLocation` rows must be `READY`; Admin invokes `POST /api/periods/:id/close`
- **Process:** Period moves to `PENDING_CLOSE`; an `Approval` record (`entity_type = PERIOD_CLOSE`) is created; Admin approves it; the close finalises with snapshots per location
- **Output:** Period `CLOSED`, all transactions locked, opening balances rolled forward to the next period

### 7.5 Email Notifications
The system sends the following emails (all asynchronous; failures are logged but do not block the originating action):

| Trigger                                 | Recipients                                            |
| --------------------------------------- | ----------------------------------------------------- |
| PRF approved                            | All active Procurement Specialists + the PRF requester |
| Over-delivery sent for approval         | Supervisors and Admins with access to the location    |
| PO created                              | Supplier (using `Supplier.emails`)                    |
| PO closed (manual or auto)              | Original PRF requester                                |
| NCR created (manual or auto)            | Finance Team, Procurement Team, Supplier (if delivery-linked and has emails) |
| NCR notification resend                 | Same recipient group (Admin-only action)              |

## 8) Non-Functional Requirements

- **Performance:** Single-location ops < 1s; multi-location dashboard < 2s; reports < 5s
- **Availability:** Business-hours operation; daily Supabase backups
- **Security:** JWT in httpOnly cookie; per-location access enforcement at API layer; HTTPS only; full audit trail (`created_by`, `posted_by`, `approved_by`, etc.)
- **Scalability:** Initial target 50 locations
- **Usability:** Modern Nuxt UI; keyboard-friendly forms
- **Accessibility:** WCAG 2.1 AA target where applicable
- **Data integrity:** All multi-step state changes wrapped in Prisma `$transaction` with appropriate timeouts (delivery posting uses a 30s timeout)
- **Pagination:** Default 50 per page, max 200

## 9) Acceptance Criteria (MVP)

- ✅ User can switch between authorised locations
- ✅ Deliveries update location-specific stock and WAC
- ✅ Price variances automatically generate NCRs (zero tolerance)
- ✅ Transfers move stock between locations atomically at source WAC
- ✅ Issues blocked when they would cause negative stock at the location
- ✅ Period close requires Admin approval and closes all locations simultaneously
- ✅ Dashboard shows location and consolidated views
- ✅ All transactions retain location context for audit
- ✅ PRF/PO workflow with Supervisor approval
- ✅ NCR email notifications to Finance / Procurement / Supplier
- ✅ PWA installable with offline awareness (read-only when offline)
- ✅ Over-delivery detection with Supervisor/Admin approval
- ✅ Bulk item import with validation (Code, Name, Unit, Category, Subcategory)

## 10) Analytics & Telemetry

- Transactions per location per day
- Transfer frequency and patterns
- Price variance frequency by supplier
- Per-location close duration
- Cross-location stock imbalances

## 11) Dependencies & Decisions — Resolved

- ✅ Costing method: WAC
- ✅ Locations: Multiple, with inter-location transfers
- ✅ Price changes: Locked per period, auto-NCR on variance
- ✅ Tax handling: Net (VAT 15% added on PRF/PO, configurable per line)
- ✅ Currency: SAR
- ✅ Approvals: PRF (Supervisor/Admin), Transfer (Supervisor/Admin), Over-delivery (Supervisor/Admin), PO closure with unfulfilled lines (Supervisor/Admin), Period Close (Admin)
- ✅ Document numbering: Per Section 5.3 #5

## 12) Constraints

- All locations close together (no partial closes)
- Transfers happen at source location's WAC
- No historical data migration
- Price changes mid-period not allowed (auto-NCR instead)
- A delivery must be linked to an OPEN PO of the same supplier
- Period must be `OPEN` for any posting (deliveries / issues / transfer execution)

## 13) Risks & Mitigations

- **Multi-location complexity** → Pilot with 2–3 locations before full rollout
- **Transfer errors** → Mandatory Supervisor approval + atomic transaction + audit trail
- **Price variance NCRs overwhelming** → Per-NCR resolution UI with bulk filters; Admin-managed notification recipient lists
- **Network dependency** → Offline-aware UI disables writes; user is informed when offline. Full offline write-queue deferred to post-MVP.
- **User location access confusion** → Operators are forced to be assigned at least one location to access data; UI shows "No locations assigned" guidance

## 14) Rollout Plan

1. **Phase 1:** Deploy to 2–3 pilot locations
2. **Training:** 45-minute sessions per role (Operator, Supervisor, Procurement, Admin)
3. **Pilot Period:** One complete month with all features, including a real period close
4. **Phase 2:** Expand to remaining locations
5. **Feedback:** Weekly reviews during pilot phase; bugs and UX issues triaged into the dev-phases backlog

## 15) Success Metrics

- Time to post a delivery / issue reduced by 50% versus Excel
- Month-end close completed in < 1 hour for all locations combined
- Transfer accuracy > 99%
- Price variance NCRs < 5% of posted deliveries
- User adoption > 90% within the first month

## 16) Technical Architecture

### 16.1 Stack (As Implemented)

- **Framework:** Nuxt 4 (SPA mode, `ssr: false`)
- **UI Library:** Nuxt UI on Tailwind CSS v4 (CSS-first `@theme` configuration)
- **State Management:** Pinia
- **Validation:** Zod schemas at every API boundary
- **Type Safety:** TypeScript end-to-end (no `any`)
- **Backend:** Nuxt Server Routes (Nitro / H3) — monolithic; deploys as Vercel serverless functions
- **Database:** PostgreSQL (Supabase) via Prisma ORM (Transaction pooler, port 6543)
- **Auth:** `nuxt-auth-utils` with JWT in httpOnly cookies
- **PWA:** `@vite-pwa/nuxt`
- **Hosting:** Vercel (frontend + API), Supabase (DB)

### 16.2 Architecture Highlights

- 100+ API routes under `/server/api/`
- Location-aware data model centred on `LocationStock` per (item, location)
- Cross-location aggregation via Prisma relations (`/api/dashboard/consolidated`, `/api/stock/consolidated`, `/api/reconciliations/consolidated`)
- All multi-step writes wrapped in Prisma `$transaction` for atomicity
- Async email pipeline — failures logged but never block writes
- Server-only Supabase service key (never exposed to client)

### 16.3 Key Business Rules (Enforced in Code)

1. **No negative stock** — validated before issues, transfers, and over-delivery checks
2. **WAC only on deliveries** — issues deduct at current WAC without recalculation
3. **Price variance ⇒ auto-NCR** — zero-tolerance policy on every posted delivery line
4. **Period locking** — prices locked at period open; all postings require an OPEN period
5. **Coordinated close** — every location must be `READY` before close can be requested
6. **Approval workflows** — PRF, Transfer, Over-delivery, Period Close, PO closure-with-unfulfilled
7. **Audit trail** — every mutation records `created_by` / `posted_by` / `approved_by` and timestamps

### 16.4 Standard API Error Codes

`INSUFFICIENT_STOCK`, `LOCATION_ACCESS_DENIED`, `PERIOD_CLOSED`, `NO_OPEN_PERIOD`, `VALIDATION_ERROR`, `PRICE_VARIANCE`, `OVER_DELIVERY_NOT_APPROVED`, `DUPLICATE_INVOICE_NO`, `PO_NOT_OPEN`, `SUPPLIER_MISMATCH`, `INSUFFICIENT_PERMISSIONS`, `NOT_AUTHENTICATED`.

---

## Change Log

- **2026-05-06** — Aligned PRD with current implementation: corrected delivery numbering format (`DLV-…`, not `DEL-YYYY-NNN`); corrected NCR status enum (no `SENT` state); corrected Transfer effective workflow (`APPROVED` state unused); added Procurement Specialist role to user lists; corrected items import column list (5 columns, no Min Stock / Active); replaced supplier "Payment Terms" with the actual supplier fields and noted Payment Terms lives on PO; clarified resend-notification is Admin-only; added PRF `CLOSED` status; added Period `APPROVED` status; documented period prices copy and PRF clone; removed unimplemented "test email" feature; removed "manager" from Location inputs; expanded numbering, approval matrix, and email notification tables; added Change Log section.
