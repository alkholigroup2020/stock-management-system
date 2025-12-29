# PRD_Stock_Management_System

# PRD - Stock Management System

**Document owner:** Fawzy

**Status:** Updated with stakeholder decisions

**Target release:** MVP pilot at multiple sites

**Last Updated:** November 2025

## 1) Product Overview

### 1.1 Purpose

Replace the legacy Excel workbook with a web application that tracks stock end-to-end for **multiple locations** across accounting periods (monthly). The app makes daily work faster, reduces errors, and simplifies month-end across all sites.

### 1.2 Problem

The Excel file is slow to update, easy to break, and hard to audit. Month-end takes too long and requires manual checks. Managing multiple locations in separate Excel files creates inconsistencies and consolidation challenges.

### 1.3 Vision

â€œAdd stock when deliveries arrive at any location. Subtract stock when kitchens use items. Transfer between locations as needed. Close the month with a simple checklist across all sites.â€

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

âœ… **Multiple sites with inter-location transfers supported**

âœ… **No historical data migration (start fresh)**

âœ… **Currency:** SAR (Saudi Riyal)

âœ… **Tax:** Prices are net (tax-exclusive)

âœ… **Costing:** WAC (Weighted Average Cost) confirmed

âœ… **Internet access available** (with graceful offline handling via PWA)

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

1. **Location Management**
   - Create/edit locations
   - Assign users to locations
   - Set location types (Kitchen, Store, Central)
2. **Dashboard**
   - Location selector
   - Period totals per location
   - Consolidated view for supervisors/admins
   - Recent activity across locations
3. **Items**
   - Global item master
   - Period price setting (fixed per period)
   - Location-specific stock levels
   - Automatic price variance detection
4. **Orders (PRF â†’ PO)**
   - Location-specific PRFs
   - Supervisor approval workflow
   - PO creation with approved PRFs
5. **Deliveries & Invoices**
   - Post to specific location
   - Automatic NCR generation for price variances
   - Update location-specific WAC and stock
6. **Issues (Food/Clean)**
   - Location-specific posting
   - No approval required
   - Prevent negative stock at location level
7. **Transfers (NEW)**
   - Inter-location stock transfers
   - Transfer at current WAC
   - Supervisor approval required
   - Transfer tracking and history
8. **NCR (Non-Conformance Report)**
   - Manual NCRs for damaged/short items
   - Automatic NCRs for price variances
   - Credit tracking per location
9. **Stock Now**
   - View by location
   - Consolidated view across locations
   - Real-time valuation per location
10. **POB (People on Board)**
    - Entry per location
    - Daily crew + extra counts
    - Location-specific manday calculations
11. **Reconciliations**
    - Per-location reconciliations
    - No approval needed for adjustments
    - Consolidated reconciliation view
12. **Period Close**
    - Admin approval required
    - Simultaneous close for all locations
    - Location snapshots
    - Roll forward to next period
13. **Progressive Web App (PWA)**
    - Installable on devices (Add to Home Screen)
    - Offline awareness with clear status indicators
    - Cached UI assets for instant loading
    - Service worker for background updates
    - App-like full-screen experience

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
- **Process:** Deduct from source, add to destination at sourceâ€™s WAC
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

## 9) Acceptance Criteria (MVP)

âœ… User can switch between authorized locations

âœ… Deliveries update location-specific stock and WAC

âœ… Price variances automatically generate NCRs

âœ… Transfers move stock between locations at WAC

âœ… Issues blocked if would cause negative stock at location

âœ… Period Close requires Admin approval and closes all locations

âœ… Dashboard shows location and consolidated views

âœ… All transactions maintain location context in audit trail

## 10) Analytics & Telemetry

- Transactions per location per day
- Transfer frequency and patterns
- Price variance frequency by supplier
- Location-specific close duration
- Cross-location stock imbalances

## 11) Dependencies - RESOLVED

âœ… **Costing method:** WAC confirmed

âœ… **Locations:** Multiple locations with transfers

âœ… **Price changes:** Fixed per period, auto-NCR for variances

âœ… **Tax handling:** Net prices (tax-exclusive)

âœ… **Currency:** SAR

âœ… **Approvals:** PRF/PO and Period Close only

âœ… **Print format:** Modern format selected

## 12) Constraints

- All locations must close together (no partial closes)
- Transfers happen at source locationâ€™s WAC
- No historical data migration
- Price changes mid-period not allowed (generate NCR instead)

## 13) Risks & Mitigations

- **Multi-location complexity** â†’ Start with 2-3 pilot locations
- **Transfer errors** â†’ Require approval, maintain detailed audit trail
- **Price variance NCRs overwhelming** â†’ Provide bulk resolution tools
- **Network dependencies** â†’ Implement retry logic and offline queue
- **User location access confusion** â†’ Clear UI indicators and training

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

- Location-aware data model
- Efficient cross-location queries
- Scalable to 50+ locations
- Real-time synchronization for transfers
- Consolidated reporting engine

---
