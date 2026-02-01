# PRD_Stock_Management_System

# PRD - Stock Management System

**Document owner:** Fawzy

**Status:** MVP Implementation Complete

**Target release:** MVP pilot at multiple sites

**Last Updated:** January 2026

---

## Implementation Status Summary

| Category                       | Status      | Notes                                         |
| ------------------------------ | ----------- | --------------------------------------------- |
| Authentication & Authorization | ✅ Complete | JWT, RBAC, location-based access              |
| Multi-Location Management      | ✅ Complete | Full CRUD, user assignment                    |
| Items & Pricing                | ✅ Complete | Global items, period pricing, bulk import     |
| PRF/PO Workflow                | ✅ Complete | Approval workflow, email notifications        |
| Deliveries                     | ✅ Complete | WAC calculation, over-delivery approval       |
| Issues                         | ✅ Complete | Cost centre tracking, stock validation        |
| Transfers                      | ✅ Complete | Approval workflow, WAC transfer               |
| NCR Management                 | ✅ Complete | Auto-generated + manual, email notifications  |
| Period Management              | ✅ Complete | Coordinated close, price locking              |
| Reconciliations                | ✅ Complete | Per-location + consolidated views             |
| PWA                            | ✅ Complete | Installable, offline-aware UI                 |
| Reports                        | ✅ Complete | Stock Now, Deliveries, Issues, Reconciliation |
| Email Notifications            | ✅ Complete | NCR + PO notifications                        |
| Suppliers                      | ✅ Complete | Full CRUD                                     |
| User Management                | ✅ Complete | Roles, locations, profile management          |

---

## 1) Product Overview

### 1.1 Purpose

Replace the legacy Excel workbook with a web application that tracks stock end-to-end for **multiple locations** across accounting periods (monthly). The app makes daily work faster, reduces errors, and simplifies month-end across all sites.

### 1.2 Problem

The Excel file is slow to update, easy to break, and hard to audit. Month-end takes too long and requires manual checks. Managing multiple locations in separate Excel files creates inconsistencies and consolidation challenges.

### 1.3 Vision

Add stock when deliveries arrive at any location. Subtract stock when kitchens use items. Transfer between locations as needed. Close the month with a simple checklist across all sites.

### 1.4 Primary Users

- **Operator (Store/Kitchen):** Posts Deliveries & Issues at their location, views stock
- **Supervisor:** Reviews numbers, manages transfers between locations, prepares reconciliations
- **Admin:** Maintains Items globally, approves Period Close, manages all locations

## 2) Goals and Business Objectives

- **Speed:** Post deliveries/issues quickly with minimal clicks
- **Accuracy:** Prevent negative stock; maintain WAC costing; maintain audit trail
- **Multi-location:** Support multiple sites with inter-location transfers
- **Month-end simplicity:** Provide live Reconciliations per location and consolidated views
- **Adoption:** Use simple language and modern UI familiar to users

## 3) Background & Strategic Fit

- Current operations rely on Excel per location; stakeholders want fewer manual steps and fewer errors
- The app keeps the same business logic but adds multi-location support
- Fits the broader effort to digitize site operations and improve cost control across all locations

## 4) Assumptions - CONFIRMED

✅ **Multiple sites with inter-location transfers supported**

✅ **No historical data migration (start fresh)**

✅ **Currency:** SAR (Saudi Riyal)

✅ **Tax:** Prices are net (tax-exclusive)

✅ **Costing:** WAC (Weighted Average Cost) confirmed

✅ **Internet access available** (with graceful offline handling via PWA)

## 5) Scope

### 5.1 User Stories (Core)

**Multi-Location Management:**

- As an Admin, I can create and manage multiple locations
- As an Operator, I am assigned to specific location(s) and can only post to those locations
- As a Supervisor, I can view all locations and initiate transfers between them
- As an Admin, I can view consolidated reports across all locations

**Stock Movement:**

- As an Operator, I post a Delivery to increase stock at my location and update WAC
- As an Operator, I post an Issue to record usage at my location
- As a Supervisor, I can create Transfer Orders to move stock between locations
- As any user, I can view current stock levels for authorized locations

**Price Control (NEW):**

- As the system, I enforce fixed prices per period per item
- As the system, I automatically create an NCR when a delivery price differs from the period price
- As an Admin, I can review and resolve price variance NCRs

**Period Management:**

- As a Supervisor, I enter daily POB for each location
- As a Supervisor, I review Reconciliations for each location
- As an Admin, I approve and close periods for all locations simultaneously
- As an Admin, I can view consolidated period summaries

**Progressive Web App (PWA):**

- As any user, I can install the app on my device for quick access
- As any user, I see clear offline status when internet is unavailable
- As any user, I can view cached data when offline
- As the system, I prevent data-modifying operations when offline

**Approvals (CONFIRMED):**

- PRF/PO: Requires Supervisor approval
- Issues: No approval needed (posts immediately)
- Reconciliations: No approval needed
- Period Close: Requires Admin approval
- Transfers: Requires Supervisor approval

### 5.2 Features (MVP)

1. **Location Management** ✅ IMPLEMENTED
   - Create/edit locations
   - Assign users to locations
   - Set location types (Kitchen, Store, Central, Warehouse)
   - Location dashboard with aggregated data

2. **Dashboard** ✅ IMPLEMENTED
   - Location selector with persistent state
   - Period totals per location
   - Consolidated view for supervisors/admins
   - Recent activity across locations
   - Performance metrics

3. **Items** ✅ IMPLEMENTED
   - Global item master with categories
   - Period price setting (fixed per period)
   - Location-specific stock levels (LocationStock)
   - Automatic price variance detection
   - Bulk import via Excel/CSV with validation
   - Item deactivation support
   - Units: KG, EA, LTR, BOX, CASE, PACK

4. **Orders (PRF → PO)** ✅ IMPLEMENTED
   - Location-specific PRFs with types (URGENT, DPA, NORMAL)
   - Categories: FOOD, CLEANING, OTHER
   - Supervisor approval workflow
   - PO creation from approved PRFs
   - PO email notifications to suppliers
   - VAT calculation (15%)
   - Auto-closure when fully delivered
   - PRF numbering: `PRF-{Location}-{DD}-{Mon}-{YYYY}-{NN}`
   - PO numbering: `PO-{DD}-{Mon}-{YYYY}-{NNN}`

5. **Deliveries & Invoices** ✅ IMPLEMENTED
   - Post to specific location with PO linkage
   - Automatic NCR generation for price variances (zero tolerance)
   - Update location-specific WAC and stock
   - Over-delivery detection with Supervisor approval
   - Draft → Posted state management
   - Delivery numbering: `DEL-YYYY-NNN`

6. **Issues (Food/Clean)** ✅ IMPLEMENTED
   - Location-specific posting
   - Cost centre tracking (FOOD, CLEAN, OTHER)
   - No approval required
   - Prevent negative stock at location level
   - Deducts at current WAC (no recalculation)
   - Sync Stock feature for bulk item loading

7. **Transfers** ✅ IMPLEMENTED
   - Inter-location stock transfers
   - Transfer at source location's WAC
   - Supervisor approval required
   - Status flow: DRAFT → PENDING_APPROVAL → APPROVED/REJECTED → COMPLETED
   - Transfer tracking and history
   - Rejection with audit trail

8. **NCR (Non-Conformance Report)** ✅ IMPLEMENTED
   - Manual NCRs for damaged/short items
   - Automatic NCRs for price variances (type: PRICE_VARIANCE)
   - Status flow: OPEN → SENT → CREDITED/REJECTED/RESOLVED
   - Financial impact tracking (NONE, CREDIT, LOSS)
   - Email notifications to Finance, Procurement, Suppliers
   - Re-send notification capability (5-minute cooldown)
   - Notification history tracking

9. **Stock Now** ✅ IMPLEMENTED
   - View by location with filters
   - Consolidated view across locations
   - Real-time valuation per location
   - Minimum stock thresholds
   - Low stock filtering
   - CSV export capability

10. **POB (People on Board)** ✅ IMPLEMENTED
    - Entry per location
    - Daily mandays and visitor meals tracking
    - Auto-save functionality
    - Mandays aggregation for cost-per-person reporting

11. **Reconciliations** ✅ IMPLEMENTED
    - Per-location reconciliations
    - Formula: Opening + Receipts + Transfers In - Transfers Out - Issues = Expected Closing
    - Variance calculation with adjustment types
    - NCR Credits and Losses integration
    - Consolidated reconciliation view
    - Confirmation workflow

12. **Period Close** ✅ IMPLEMENTED
    - Admin approval required
    - Coordinated close: All locations must be READY
    - Location snapshots at close
    - Roll forward to next period
    - Price locking at period open
    - Status flow: DRAFT → OPEN → PENDING_CLOSE → APPROVED → CLOSED

13. **Progressive Web App (PWA)** ✅ IMPLEMENTED
    - Installable on devices (Add to Home Screen)
    - Offline awareness with clear status indicators
    - Cached UI assets for instant loading
    - Service worker for background updates
    - App-like full-screen experience
    - `useOnlineStatus()` composable for offline detection
    - Disabled action buttons when offline

14. **Suppliers** ✅ IMPLEMENTED
    - Full CRUD operations
    - Contact information (email, phone)
    - Payment terms tracking
    - NCR tracking by supplier

15. **User Management** ✅ IMPLEMENTED
    - Roles: OPERATOR, SUPERVISOR, ADMIN, PROCUREMENT_SPECIALIST
    - Location assignment for Operators
    - Profile management with password change
    - Deactivate vs Delete logic

16. **Email Notifications** ✅ IMPLEMENTED
    - NCR notifications (auto-generated on price variance)
    - PO notifications to suppliers
    - Configurable recipient settings
    - Test email functionality
    - Notification history

## 6) Out of Scope (v1)

- Complex routing (multi-stop transfers)
- Partial period closes (all locations close together)
- Mobile native apps
- Full offline mode with local database and sync
- Advanced forecasting

## 7) Functional Requirements

### 7.1 Location Management

- **Input:** Location name, type, address, manager
- **Output:** Location created with unique ID
- **Rules:** Location codes must be unique; cannot delete location with transaction history

### 7.2 Price Period Management (NEW)

- **Input:** Item prices set at period start
- **Process:** Prices locked for the period duration
- **Validation:** Any delivery with different price triggers automatic NCR
- **Output:** Price variance NCR created, original delivery posted at actual price

### 7.3 Transfers

- **Input:** Source location, destination location, items, quantities
- **Process:** Deduct from source, add to destination at source's WAC
- **Validation:** Cannot transfer more than on-hand at source
- **Output:** Transfer document with tracking number

### 7.4 Multi-Location Period Close

- **Input:** Admin approval after checklist completion
- **Process:** Validate all locations ready, create snapshots per location
- **Output:** All locations closed simultaneously, next period opened

## 8) Non-Functional Requirements

- **Performance:** Post delivery/issue < 1s; dashboard < 2s for multi-location views
- **Availability:** Business hours; daily backups per location
- **Security:** Location-based access control; HTTPS; full audit trail
- **Scalability:** Support up to 50 locations initially
- **Usability:** Modern, clean interface; keyboard navigation
- **Accessibility:** WCAG 2.1 AA compliance where applicable

## 9) Acceptance Criteria (MVP) - ALL VERIFIED ✅

✅ User can switch between authorized locations - **IMPLEMENTED**

✅ Deliveries update location-specific stock and WAC - **IMPLEMENTED**

✅ Price variances automatically generate NCRs - **IMPLEMENTED** (zero tolerance policy)

✅ Transfers move stock between locations at WAC - **IMPLEMENTED** (with approval workflow)

✅ Issues blocked if would cause negative stock at location - **IMPLEMENTED**

✅ Period Close requires Admin approval and closes all locations - **IMPLEMENTED**

✅ Dashboard shows location and consolidated views - **IMPLEMENTED**

✅ All transactions maintain location context in audit trail - **IMPLEMENTED**

✅ PRF/PO workflow with Supervisor approval - **IMPLEMENTED**

✅ NCR email notifications to stakeholders - **IMPLEMENTED**

✅ PWA installable with offline awareness - **IMPLEMENTED**

✅ Over-delivery detection and approval - **IMPLEMENTED**

✅ Bulk item import with validation - **IMPLEMENTED**

## 10) Analytics & Telemetry

- Transactions per location per day
- Transfer frequency and patterns
- Price variance frequency by supplier
- Location-specific close duration
- Cross-location stock imbalances

## 11) Dependencies - RESOLVED

✅ **Costing method:** WAC confirmed

✅ **Locations:** Multiple locations with transfers

✅ **Price changes:** Fixed per period, auto-NCR for variances

✅ **Tax handling:** Net prices (tax-exclusive)

✅ **Currency:** SAR

✅ **Approvals:** PRF/PO and Period Close only

✅ **Print format:** Modern format selected

## 12) Constraints

- All locations must close together (no partial closes)
- Transfers happen at source location's WAC
- No historical data migration
- Price changes mid-period not allowed (generate NCR instead)

## 13) Risks & Mitigations

- **Multi-location complexity** → Start with 2-3 pilot locations
- **Transfer errors** → Require approval, maintain detailed audit trail
- **Price variance NCRs overwhelming** → Provide bulk resolution tools
- **Network dependencies** → Implement retry logic and offline queue
- **User location access confusion** → Clear UI indicators and training

## 14) Rollout Plan

1. **Phase 1:** Deploy to 2-3 pilot locations
2. **Training:** 45-minute sessions covering multi-location features
3. **Pilot Period:** One complete month with all features
4. **Phase 2:** Expand to remaining locations
5. **Feedback:** Weekly reviews during pilot phase

## 15) Success Metrics

- Time to post reduced by 50% vs Excel
- Month-end close < 1 hour for all locations
- Transfer accuracy > 99%
- Price variance NCRs < 5% of deliveries
- User adoption > 90% within first month

## 16) Technical Architecture Notes

### Stack (Implemented)

- **Framework:** Nuxt 4 (SPA mode, `ssr: false`)
- **UI Library:** Nuxt UI with Tailwind CSS v4
- **State Management:** Pinia stores
- **Type Safety:** TypeScript with Zod validation
- **Backend:** Nuxt Server Routes (Nitro/H3) - monolithic architecture
- **Database:** PostgreSQL 15+ via Supabase, accessed through Prisma ORM
- **Auth:** nuxt-auth-utils with JWT in httpOnly cookies
- **PWA:** @vite-pwa/nuxt for installable app
- **Hosting:** Vercel (frontend + API), Supabase (database)

### Architecture Highlights

- **103+ API routes** in `/server/api/`
- Location-aware data model with `LocationStock` per item per location
- Efficient cross-location queries via Prisma relations
- Scalable to 50+ locations
- Real-time synchronization for transfers
- Consolidated reporting engine
- Smart caching with TTL invalidation
- Comprehensive error handling with typed error codes

### Key Business Rules (Enforced)

1. **No negative stock** - Validated at transaction time
2. **WAC only on deliveries** - Issues deduct at current WAC
3. **Price variance = auto-NCR** - Zero tolerance policy
4. **Period locking** - Prices locked at period start
5. **Coordinated close** - All locations must be READY
6. **Approval workflows** - PRF/PO, Transfers, Period Close

### API Patterns

- RESTful endpoints with standard error codes
- `INSUFFICIENT_STOCK`, `LOCATION_ACCESS_DENIED`, `PERIOD_CLOSED`, `VALIDATION_ERROR`, `PRICE_VARIANCE`
- Transaction-based operations for atomicity
- Audit trail on all mutations

---
