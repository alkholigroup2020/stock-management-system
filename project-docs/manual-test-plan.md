# Manual Test Plan - Stock Management System

**Test Date:** 2025-11-27
**Application:** Stock Management System MVP
**Environment:** localhost:3000
**Tester:** Automated (Claude Code via Playwright)

---

## Test Scope

### Features to Test
1. Authentication & Authorization
2. Dashboard & Navigation
3. Deliveries (Create, List, View)
4. Issues (Create, List, View)
5. Transfers (Create, List, View, Approve)
6. NCRs (Create, List, View)
7. Items Management
8. Period Management & Close
9. Reconciliations
10. Offline Detection & PWA

### User Roles to Test
- **Operator:** Post deliveries/issues, view stock
- **Supervisor:** Approve transfers/PRF, manage reconciliations
- **Admin:** Manage items/prices, close periods, system config

### Test Types
- ✅ Functional Testing (feature works as expected)
- ✅ Role-based Access Testing (permissions enforced)
- ✅ Validation Testing (proper error handling)
- ✅ Workflow Testing (end-to-end user journeys)
- ✅ UI/UX Testing (responsive, accessible, consistent)
- ✅ Performance Testing (load times, responsiveness)

---

## Test Cases

### 1. Authentication & Authorization

#### TC-AUTH-001: Login Page
- **Steps:** Navigate to login page
- **Expected:** Login form displays with email/password fields
- **Validations:**
  - Form has proper labels and placeholders
  - Submit button is enabled when fields are filled
  - Error messages display for invalid credentials

#### TC-AUTH-002: User Role Permissions
- **Steps:** Login as Operator, Supervisor, Admin
- **Expected:** Each role sees appropriate menu items and features
- **Validations:**
  - Operator: Cannot access admin settings or period close
  - Supervisor: Can approve transfers and manage reconciliations
  - Admin: Full access to all features

---

### 2. Dashboard & Navigation

#### TC-DASH-001: Dashboard Loads
- **Steps:** Login and view dashboard
- **Expected:** Dashboard displays with key metrics
- **Validations:**
  - Location switcher works
  - Period indicator shows current period
  - Quick actions display
  - Recent activity loads

#### TC-DASH-002: Mobile Navigation
- **Steps:** Resize to mobile viewport (375px)
- **Expected:** Hamburger menu appears and works
- **Validations:**
  - Menu opens as modal
  - All navigation items accessible
  - Menu closes on selection

#### TC-DASH-003: Sidebar Navigation (Desktop)
- **Steps:** View on desktop (1024px+)
- **Expected:** Sidebar shows all menu items
- **Validations:**
  - All links clickable
  - Active state highlights current page
  - Collapse button works

---

### 3. Deliveries

#### TC-DEL-001: Create Delivery
- **Steps:** Navigate to Deliveries → New Delivery
- **Expected:** Form loads with required fields
- **Validations:**
  - Supplier dropdown loads
  - Item selection works
  - Can add multiple lines
  - Price variance detection works
  - Submit creates delivery successfully

#### TC-DEL-002: List Deliveries
- **Steps:** Navigate to Deliveries list
- **Expected:** Table displays all deliveries for location
- **Validations:**
  - Pagination works
  - Filters work (date, supplier, status)
  - Empty state shows when no deliveries
  - Loading state displays while fetching

#### TC-DEL-003: View Delivery Details
- **Steps:** Click on a delivery from list
- **Expected:** Details page shows delivery information
- **Validations:**
  - All fields display correctly
  - Line items table shows
  - Auto-generated NCR links work (if price variance)

---

### 4. Issues

#### TC-ISS-001: Create Issue
- **Steps:** Navigate to Issues → New Issue
- **Expected:** Form loads with required fields
- **Validations:**
  - Item selection works
  - Stock availability shown
  - Cannot issue more than available stock
  - Can add multiple lines
  - Submit creates issue successfully

#### TC-ISS-002: List Issues
- **Steps:** Navigate to Issues list
- **Expected:** Table displays all issues for location
- **Validations:**
  - Pagination works
  - Filters work (date, item, type)
  - Empty state shows when no issues
  - Loading state displays while fetching

#### TC-ISS-003: Stock Validation
- **Steps:** Try to issue more than available stock
- **Expected:** Validation error prevents submission
- **Validations:**
  - Error message is clear
  - Suggests checking stock levels
  - Form stays populated (not cleared)

---

### 5. Transfers

#### TC-TRF-001: Create Transfer
- **Steps:** Navigate to Transfers → New Transfer
- **Expected:** Form loads with required fields
- **Validations:**
  - From/To location selection works
  - Cannot select same location
  - Item selection works
  - Stock availability shown
  - Can add multiple lines
  - Submit creates transfer in PENDING status

#### TC-TRF-002: Approve Transfer (Supervisor)
- **Steps:** Login as Supervisor, view pending transfer
- **Expected:** Approve button available
- **Validations:**
  - Approve button works
  - Status changes to APPROVED
  - Stock moves between locations
  - WAC recalculated at destination

#### TC-TRF-003: Transfer Workflow
- **Steps:** Create → Approve → Execute transfer
- **Expected:** Complete lifecycle works
- **Validations:**
  - DRAFT → PENDING_APPROVAL
  - PENDING_APPROVAL → APPROVED (supervisor)
  - APPROVED → COMPLETED (automatic)
  - Stock updated at both locations

---

### 6. NCRs (Non-Conformance Reports)

#### TC-NCR-001: Auto-Generated NCR (Price Variance)
- **Steps:** Create delivery with different price than period price
- **Expected:** NCR auto-created
- **Validations:**
  - NCR type is PRICE_VARIANCE
  - auto_generated flag is true
  - Linked to delivery
  - Shows variance amount

#### TC-NCR-002: Manual NCR Creation
- **Steps:** Navigate to NCRs → New NCR
- **Expected:** Form loads with required fields
- **Validations:**
  - NCR type selection works
  - Description required
  - Can link to item/location
  - Submit creates NCR successfully

#### TC-NCR-003: NCR List & Filters
- **Steps:** Navigate to NCRs list
- **Expected:** Table displays all NCRs for location
- **Validations:**
  - Pagination works
  - Filters work (type, status, date)
  - Empty state shows when no NCRs
  - Auto-generated badge displays

---

### 7. Items Management

#### TC-ITM-001: Items List
- **Steps:** Navigate to Items (Admin only)
- **Expected:** Table displays all items
- **Validations:**
  - Pagination works
  - Filters work (category, active status)
  - Search works
  - Empty state shows correctly

#### TC-ITM-002: Edit Item
- **Steps:** Click edit on an item
- **Expected:** Edit form loads with current values
- **Validations:**
  - All fields editable
  - Validation works (required fields)
  - Save updates item
  - Success message displays

#### TC-ITM-003: Item Price Locking
- **Steps:** View item during closed period
- **Expected:** Prices locked and not editable
- **Validations:**
  - Edit button disabled during closed period
  - Warning message displays
  - Historical prices viewable

---

### 8. Period Management & Close

#### TC-PRD-001: View Periods List
- **Steps:** Navigate to Periods (Admin only)
- **Expected:** Table displays all periods
- **Validations:**
  - Current period highlighted
  - Status badges display correctly
  - Action buttons available based on status

#### TC-PRD-002: Mark Location Ready for Close
- **Steps:** Navigate to Period Close page
- **Expected:** Can mark location as ready
- **Validations:**
  - Ready button works
  - Status updates to READY
  - All locations must be ready before close

#### TC-PRD-003: Close Period (Admin)
- **Steps:** Login as Admin, close period
- **Expected:** Period closes successfully
- **Validations:**
  - Requires all locations READY
  - Confirmation dialog appears
  - Snapshots created
  - New period auto-created
  - Old period locked

---

### 9. Reconciliations

#### TC-REC-001: View Reconciliations
- **Steps:** Navigate to Reconciliations
- **Expected:** List displays reconciliations for location
- **Validations:**
  - Filters work (period, status)
  - Empty state shows correctly
  - Can view details

#### TC-REC-002: Reconciliation Calculation
- **Steps:** View reconciliation with variances
- **Expected:** Variances calculated correctly
- **Validations:**
  - Opening + Deliveries - Issues = Expected
  - Physical Count captured
  - Variance = Physical - Expected
  - Formula displayed clearly

---

### 10. Offline Detection & PWA

#### TC-PWA-001: Offline Banner
- **Steps:** Simulate offline mode
- **Expected:** Banner displays at top
- **Validations:**
  - "You're offline" message shows
  - Red background color
  - Dismisses on reconnect

#### TC-PWA-002: Offline Guards
- **Steps:** Go offline, try to submit form
- **Expected:** Form submission prevented
- **Validations:**
  - Submit button disabled
  - Warning toast displays
  - Form data preserved

#### TC-PWA-003: PWA Installation
- **Steps:** Check manifest and service worker
- **Expected:** App is installable
- **Validations:**
  - Manifest loads correctly
  - Service worker registered
  - Icons display properly
  - Theme colors correct

---

## Performance Benchmarks

### Page Load Times
- **Target:** < 3s on 4G connection
- **Measure:** First Contentful Paint (FCP)
- **Pages to Test:**
  - Dashboard
  - Deliveries List
  - Items List
  - Period Close

### API Response Times
- **Target:** < 1s for standard operations
- **Measure:** Network request duration
- **Endpoints to Test:**
  - GET /api/locations
  - GET /api/items
  - POST /api/locations/:id/deliveries
  - POST /api/transfers

---

## Accessibility Checks

### Keyboard Navigation
- ✅ Tab order is logical
- ✅ All interactive elements focusable
- ✅ Enter key activates buttons
- ✅ Escape closes modals

### Screen Reader
- ✅ Semantic HTML used
- ✅ ARIA labels on icons
- ✅ Form labels present
- ✅ Error messages announced

### Color Contrast
- ✅ Text contrast ratio ≥ 4.5:1
- ✅ UI elements contrast ≥ 3:1
- ✅ Focus indicators visible
- ✅ No color-only information

---

## Responsive Design

### Mobile (375px - 768px)
- ✅ Hamburger menu works
- ✅ Tables scroll horizontally
- ✅ Forms stack vertically
- ✅ Touch targets ≥ 44px

### Tablet (768px - 1024px)
- ✅ Sidebar visible or collapsible
- ✅ Two-column layouts
- ✅ Filters accessible
- ✅ No horizontal scroll

### Desktop (1024px+)
- ✅ Full sidebar navigation
- ✅ Multi-column dashboards
- ✅ All features accessible
- ✅ Optimal use of screen space

---

## Bug Tracking Template

### Bug Format
**Bug ID:** BUG-XXX
**Severity:** Critical | High | Medium | Low
**Component:** Component/Page name
**Description:** What happened
**Expected:** What should happen
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Environment:** Browser, viewport size
**Status:** Open | In Progress | Fixed | Won't Fix

---

## Test Execution Log

| Test ID | Status | Notes | Bugs Found |
|---------|--------|-------|------------|
| TC-AUTH-001 | ⏳ Pending | | |
| TC-AUTH-002 | ⏳ Pending | | |
| TC-DASH-001 | ⏳ Pending | | |
| ... | ... | ... | ... |

---

## Sign-Off

**Tests Executed:** [X] / [Y]
**Pass Rate:** [X]%
**Critical Bugs:** [X]
**Ready for UAT:** ☐ Yes ☐ No

**Tester Signature:** _______________
**Date:** _______________
