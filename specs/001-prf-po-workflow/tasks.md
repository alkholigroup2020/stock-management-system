# Tasks: PRF/PO Workflow

**Input**: Design documents from `/specs/001-prf-po-workflow/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `app/` (pages, components, composables)
- **Backend**: `server/api/`, `server/utils/`
- **Schema**: `prisma/schema.prisma`
- **Types**: `shared/types/database.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and schema changes

- [x] T001 Install Nodemailer email package via `pnpm add nodemailer @types/nodemailer`
- [x] T002 Add environment variables (SMTP_USER, SMTP_PASSWORD, SMTP_HOST, SMTP_PORT, EMAIL_FROM) to `.env.example`
- [x] T003 Update `prisma/schema.prisma` with new enums (PRFType, PRFCategory, PROCUREMENT_SPECIALIST role, CLOSED status)
- [x] T004 Update `prisma/schema.prisma` with Supplier model changes (emails, phone, mobile, vat_reg_no, address)
- [x] T005 [P] Update `prisma/schema.prisma` with PRF model new fields (prf_type, category, rejection_reason, total_value, etc.)
- [x] T006 [P] Create PRFLine model in `prisma/schema.prisma`
- [x] T007 [P] Update `prisma/schema.prisma` with PO model new fields (totals, terms, ship_to, created_by)
- [x] T008 [P] Create POLine model in `prisma/schema.prisma`
- [x] T009 Update `prisma/schema.prisma` with relation updates (User, Location, Item)
- [x] T010 Run database migration with `pnpm db:migrate dev --name add_prf_po_workflow`
- [x] T011 [P] Update `shared/types/database.ts` with new enums (PRFType, PRFCategory)
- [x] T012 [P] Update `shared/types/database.ts` with PRFLine interface
- [x] T013 [P] Update `shared/types/database.ts` with POLine interface
- [x] T014 [P] Update `shared/types/database.ts` with extended PRF interface
- [x] T015 [P] Update `shared/types/database.ts` with extended PO interface
- [x] T016 [P] Update `shared/types/database.ts` with extended Supplier interface (emails array)
- [x] T017 Update `shared/types/database.ts` with UserRole enum (add PROCUREMENT_SPECIALIST)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T018 Create email service utility in `server/utils/email.ts` with Office 365 SMTP integration via Nodemailer
- [x] T019 [P] Add email service error handling and logging in `server/utils/email.ts`
- [x] T020 Update `app/composables/usePermissions.ts` with PROCUREMENT_SPECIALIST role checks
- [x] T021 [P] Add PRF permissions (canCreatePRF, canApprovePRF, canViewPRF) in `app/composables/usePermissions.ts`
- [x] T022 [P] Add PO permissions (canCreatePO, canEditPO, canClosePO) in `app/composables/usePermissions.ts`
- [x] T023 Create PRF status badge component in `app/components/orders/PRFStatusBadge.vue`
- [x] T024 [P] Create PO status badge component in `app/components/orders/POStatusBadge.vue`
- [x] T025 Create Orders index page shell in `app/pages/orders/index.vue` with tabs structure
- [x] T026 Add "Orders" menu item to navigation sidebar in `app/layouts/default.vue`

**Checkpoint**: Foundation ready - user story implementation can now begin ✅

---

## Phase 3: User Story 1 - Create and Submit PRF (Priority: P1) 🎯 MVP

**Goal**: Operators can create PRFs with line items and submit for approval

**Independent Test**: Create a PRF with multiple line items, save as draft, then submit for approval

### Implementation for User Story 1

- [x] T027 [P] [US1] Create PRF list API endpoint in `server/api/prfs/index.get.ts`
- [x] T028 [P] [US1] Create PRF create API endpoint in `server/api/prfs/index.post.ts`
- [x] T029 [P] [US1] Create PRF get API endpoint in `server/api/prfs/[id].get.ts`
- [x] T030 [P] [US1] Create PRF update API endpoint in `server/api/prfs/[id].patch.ts`
- [x] T031 [P] [US1] Create PRF delete API endpoint in `server/api/prfs/[id].delete.ts`
- [x] T032 [US1] Create PRF submit API endpoint in `server/api/prfs/[id]/submit.patch.ts`
- [x] T033 [US1] Create `app/composables/usePRFs.ts` with list, get, create, update, delete, submit functions
- [x] T034 [P] [US1] Create PRF line items table component in `app/components/orders/PRFLineItemsTable.vue`
- [x] T035 [P] [US1] Create stock levels reference table in `app/components/orders/StockLevelsTable.vue`
- [x] T036 [US1] Create PRF form component in `app/components/orders/PRFForm.vue` with line item management
- [x] T037 [US1] Create PRF create page in `app/pages/orders/prfs/create.vue`
- [x] T038 [US1] Create PRF detail page in `app/pages/orders/prfs/[id].vue` with edit/submit capabilities
- [x] T039 [US1] Update Orders index page PRFs tab with list view in `app/pages/orders/index.vue`
- [x] T040 [US1] Add Zod validation schemas for PRF create/update in `server/api/prfs/index.post.ts`
- [x] T041 [US1] Implement auto-generation of PRF numbers (Format: PRF-{LocationName}-{DD}-{Mon}-{YYYY}-{NN}, e.g., PRF-KITCHEN-27-Jan-2026-01) in create endpoint

**Checkpoint**: User Story 1 complete - PRFs can be created, edited, and submitted for approval ✅

---

## Phase 4: User Story 2 - Approve or Reject PRF (Priority: P1)

**Goal**: Supervisors can review and approve/reject pending PRFs with email notification

**Independent Test**: View a PENDING PRF as Supervisor, approve or reject with reason

### Implementation for User Story 2

- [x] T042 [P] [US2] Create PRF approve API endpoint in `server/api/prfs/[id]/approve.patch.ts`
- [x] T043 [P] [US2] Create PRF reject API endpoint in `server/api/prfs/[id]/reject.patch.ts`
- [x] T044 [US2] Add approve/reject functions to `app/composables/usePRFs.ts`
- [x] T045 [US2] Create PRF approval actions component in `app/components/orders/PRFApprovalActions.vue`
- [x] T046 [US2] Add approval workflow UI to PRF detail page in `app/pages/orders/prfs/[id].vue`
- [x] T047 [US2] Implement email notification to PROCUREMENT_SPECIALIST users on approve in `server/api/prfs/[id]/approve.patch.ts`
- [x] T048 [US2] Add rejection reason validation (mandatory) in reject endpoint

**Checkpoint**: User Story 2 complete - PRFs can be approved/rejected with email notifications ✅

---

## Phase 5: User Story 3 - Create PO from Approved PRF (Priority: P1)

**Goal**: Procurement Specialists can create POs from approved PRFs with VAT calculations

**Independent Test**: Create a PO from an approved PRF, verify VAT calculations

### Implementation for User Story 3

- [x] T049 [P] [US3] Create PO list API endpoint in `server/api/pos/index.get.ts`
- [x] T050 [P] [US3] Create PO create API endpoint in `server/api/pos/index.post.ts` with VAT calculations
- [x] T051 [P] [US3] Create PO get API endpoint in `server/api/pos/[id].get.ts`
- [x] T052 [P] [US3] Create PO update API endpoint in `server/api/pos/[id].patch.ts`
- [x] T053 [US3] Create open POs dropdown API in `server/api/pos/open.get.ts`
- [x] T054 [US3] Create `app/composables/usePOs.ts` with list, get, create, update functions
- [x] T055 [P] [US3] Create PO line items table component in `app/components/orders/POLineItemsTable.vue` with VAT calculations
- [x] T056 [US3] Create PO form component in `app/components/orders/POForm.vue` with supplier selection
- [x] T057 [US3] Create PO create page in `app/pages/orders/pos/create.vue` with PRF pre-population
- [x] T058 [US3] Create PO detail page in `app/pages/orders/pos/[id].vue` with edit capabilities
- [x] T059 [US3] Update Orders index page POs tab with list view in `app/pages/orders/index.vue`
- [x] T060 [US3] Implement auto-generation of PO numbers (Format: PO-{LocationName}-{DD}-{Mon}-{YYYY}-{NN}, e.g., PO-KITCHEN-27-Jan-2026-01, uses PRF's location) in create endpoint
- [x] T061 [US3] Implement VAT calculation logic (15%) in `server/api/pos/index.post.ts`
- [x] T062 [US3] ~~Implement email notification to supplier on PO creation~~ (REMOVED - PO creation does not send emails)
- [x] T063 [US3] Add "Create PO" action button on approved PRF detail page

**Checkpoint**: User Story 3 complete - POs can be created from PRFs with correct VAT calculations ✅

---

## Phase 6: User Story 4 - Link Delivery to PO (Priority: P2)

**Goal**: Deliveries require mandatory PO selection with auto-population

**Independent Test**: Create delivery, select PO, verify supplier and items auto-populate

### Implementation for User Story 4

- [x] T064 [US4] Update delivery create page to make PO selection mandatory in `app/pages/deliveries/create.vue`
- [x] T065 [US4] Add PO dropdown with open POs filter in delivery form
- [x] T066 [US4] Implement supplier auto-population when PO selected
- [x] T067 [US4] Add PO line items as delivery line suggestions
- [x] T068 [US4] Display "No open POs available" message when applicable
- [x] T069 [US4] Update delivery create API to validate po_id is required for new deliveries in `server/api/locations/[id]/deliveries/index.post.ts`
- [x] T070 [US4] Add over-delivery warning when quantity exceeds PO quantity

**Checkpoint**: User Story 4 complete - Deliveries are linked to POs with validation ✅

---

## Phase 7: User Story 5 - Close PO (Priority: P2)

**Goal**: Procurement Specialists can close POs, preventing further deliveries

**Independent Test**: Close an open PO, verify it no longer appears in delivery PO dropdown

### Implementation for User Story 5

- [x] T071 [US5] Create PO close API endpoint in `server/api/pos/[id]/close.patch.ts`
- [x] T072 [US5] Add close function to `app/composables/usePOs.ts`
- [x] T073 [US5] Add "Close PO" button to PO detail page in `app/pages/orders/pos/[id].vue`
- [x] T074 [US5] Update linked PRF status to CLOSED when PO is closed
- [x] T075 [US5] Filter closed POs from delivery PO dropdown in `server/api/pos/open.get.ts`

**Checkpoint**: User Story 5 complete - POs can be closed, completing the order lifecycle ✅

---

## Phase 8: User Story 6 - Procurement Specialist Access Control (Priority: P2)

**Goal**: PROCUREMENT_SPECIALIST role has limited access to appropriate pages

**Independent Test**: Log in as PROCUREMENT_SPECIALIST, verify menu items and page access restrictions

### Implementation for User Story 6

- [x] T076 [P] [US6] Update navigation sidebar to show limited menu for PROCUREMENT_SPECIALIST in `app/components/layout/AppNavbar.vue`
- [x] T077 [P] [US6] Add client-side route guards for restricted pages in `app/middleware/auth.ts`
- [x] T078 [US6] Update server middleware to validate PROCUREMENT_SPECIALIST access in `server/middleware/`
- [x] T079 [US6] Test PROCUREMENT_SPECIALIST cannot access Master Data, Issues, Transfers, Reconciliations
- [x] T080 [US6] Ensure PROCUREMENT_SPECIALIST can view deliveries (PO-linked only)

**Checkpoint**: User Story 6 complete - Role-based access control enforced ✅

---

## Phase 9: User Story 7 - Manage Supplier Emails (Priority: P3)

**Goal**: Admins can manage multiple email addresses per supplier for PO notifications

**Independent Test**: Edit supplier, add/remove emails, verify PO sends to all addresses

### Implementation for User Story 7

- [x] T081 [P] [US7] Update supplier API to support emails array in `server/api/suppliers/[id].patch.ts`
- [x] T082 [P] [US7] Add email array validation (format check) in supplier API
- [x] T083 [US7] Update supplier create/edit pages with multi-email input in `app/pages/suppliers/`
- [x] T084 [US7] Create email list input component for supplier form
- [x] T085 [US7] Update `app/composables/useSuppliers.ts` to handle emails array

**Checkpoint**: User Story 7 complete - Suppliers can have multiple email addresses ✅

---

## Phase 10: User Story 8 - Clone Rejected PRF (Priority: P2)

**Goal**: Users can clone rejected PRFs to create new drafts

**Independent Test**: Clone a rejected PRF, verify new draft created with copied content

### Implementation for User Story 8

- [x] T086 [US8] Create PRF clone API endpoint in `server/api/prfs/[id]/clone.post.ts`
- [x] T087 [US8] Add clone function to `app/composables/usePRFs.ts`
- [x] T088 [US8] Add "Clone PRF" button on rejected PRF detail page in `app/pages/orders/prfs/[id].vue`
- [x] T089 [US8] Verify cloned PRF has new number, DRAFT status, and copies all lines

**Checkpoint**: User Story 8 complete - Rejected PRFs can be cloned ✅

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T090 [P] ~~Create email resend endpoint in `server/api/pos/[id]/resend-email.post.ts`~~ (REMOVED - no email resend feature for POs)
- [x] T091 [P] ~~Add "Resend Email" button to PO detail page~~ (REMOVED - no email resend feature for POs)
- [x] T092 [P] Add loading states to all form submissions using LoadingOverlay
- [x] T093 [P] Ensure all buttons have `cursor-pointer` class
- [x] T094 [P] Verify offline-aware UI (disable actions when offline) using `useOnlineStatus()`
- [x] T095 Run `pnpm typecheck` and fix any type errors
- [x] T096 Run `pnpm format` to ensure code formatting
- [x] T097 Test complete workflow: PRF → Approve → PO → Delivery → Close PO
- [x] T098 Verify with Playwright MCP on localhost:3000

**Checkpoint**: Phase 11 complete - All polish and cross-cutting concerns addressed ✅

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - US1 (Create PRF) → US2 (Approve PRF) → US3 (Create PO) → US5 (Close PO)
  - US4 (Link Delivery) depends on US3 (POs must exist)
  - US6 (Access Control) can run in parallel after foundational
  - US7 (Supplier Emails) can run in parallel after foundational
  - US8 (Clone PRF) depends on US2 (PRFs must be rejectable)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Foundational (Phase 2)
        │
        ├──────────────────┬──────────────────┬─────────────────┐
        │                  │                  │                 │
        ▼                  ▼                  ▼                 ▼
    US1 (P1)           US6 (P2)           US7 (P3)          US8 (P2)
   Create PRF        Access Control    Supplier Emails    Clone PRF
        │                                                     │
        ▼                                                     │
    US2 (P1)                                                  │
   Approve PRF ◄──────────────────────────────────────────────┘
        │
        ▼
    US3 (P1)
   Create PO
        │
        ├──────────────────┐
        ▼                  ▼
    US4 (P2)           US5 (P2)
  Link Delivery       Close PO
```

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003-T008, T011-T016)
- All Foundational tasks marked [P] can run in parallel (T019, T021-T024)
- Within US1: T027-T031, T034-T035 can run in parallel
- Within US3: T049-T052, T055 can run in parallel
- US6 and US7 can run in parallel after foundational
- US4 and US5 can run in parallel after US3

---

## Parallel Example: User Story 1

```bash
# Launch all API endpoints for US1 together:
Task: "Create PRF list API endpoint in server/api/prfs/index.get.ts"
Task: "Create PRF create API endpoint in server/api/prfs/index.post.ts"
Task: "Create PRF get API endpoint in server/api/prfs/[id].get.ts"
Task: "Create PRF update API endpoint in server/api/prfs/[id].patch.ts"
Task: "Create PRF delete API endpoint in server/api/prfs/[id].delete.ts"

# Launch all components for US1 together:
Task: "Create PRF line items table component in app/components/orders/PRFLineItemsTable.vue"
Task: "Create stock levels reference table in app/components/orders/StockLevelsTable.vue"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Create PRF)
4. Complete Phase 4: User Story 2 (Approve PRF)
5. Complete Phase 5: User Story 3 (Create PO)
6. **STOP and VALIDATE**: Full PRF → PO workflow functional
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → PRFs can be created
3. Add User Story 2 → Test independently → PRFs can be approved
4. Add User Story 3 → Test independently → POs can be created (MVP!)
5. Add User Story 4 → Test independently → Deliveries linked
6. Add User Story 5 → Test independently → POs can be closed
7. Add User Story 6 → Test independently → Access control
8. Add User Story 7 → Test independently → Supplier emails
9. Add User Story 8 → Test independently → Clone PRFs
10. Polish phase → Production ready

---

## Phase 12: Post-Implementation Bug Fixes

**Purpose**: Bug fixes discovered after initial implementation

### BF001 - PRF Selection Not Working in PO Creation Form (2026-01-21)

**Issue**: When a procurement specialist user logs in to create a PO, they cannot select an approved PRF from the dropdown. The dropdown shows errors and no items appear.

**Root Cause**:

1. **API Missing Data**: The `/api/prfs` endpoint was not returning `purchase_orders` data needed by the frontend to filter PRFs that already have POs.
2. **Invalid Empty String Value**: The `POForm.vue` component was adding a "None (Manual PO)" option with `id: ''` (empty string) to the dropdown. Nuxt UI's `USelectMenu` component doesn't allow empty string values for items, causing the error: `A <ComboboxItem /> must have a value prop that is not an empty string.`

**Fixes Applied**:

- [x] BF001a Update `server/api/prfs/index.get.ts` to include `purchase_orders` in Prisma include and response mapping
- [x] BF001b Update `app/components/orders/POForm.vue` to remove "None (Manual PO)" option with empty `id` (the `clearable` prop already provides this functionality)

**Files Changed**:

- `server/api/prfs/index.get.ts` - Added `purchase_orders: { select: { id: true } }` to include and response
- `app/components/orders/POForm.vue` - Removed empty id item from prfOptions array

**Verification**: Tested as procurement specialist user - PRF dropdown now correctly shows approved PRFs without POs, and selecting a PRF pre-populates the form correctly.

---

### BF002 - PRF Line Items Table UI Issues (2026-01-21)

**Issue**: Multiple UI issues in the "Items Required" section on the PRF creation page:

1. Total calculation not updating when entering quantity or price
2. Table headers in ALL CAPS (not consistent with design system)
3. Cost Centre column not needed (simplify UI)
4. Item selection dropdown and description field stacked vertically instead of horizontal

**Root Cause**:

1. **Total Calculation**: The `@input` event on UInput components was firing before v-model updated, causing stale values in calculations
2. **Headers**: `uppercase` CSS class was applied to all table headers
3. **Cost Centre**: Field was included but not needed for current business requirements
4. **Layout**: Item cell used `space-y-2` (vertical stacking) instead of horizontal flex layout

**Fixes Applied**:

- [x] BF002a Fix total calculation by using `@update:model-value` event and computing line values dynamically with `getLineValue()` function
- [x] BF002b Remove `uppercase` class from table headers (now sentence case: "Item", "Unit", "Qty", "Est. Price", "Line Value", "Action")
- [x] BF002c Remove Cost Centre column entirely from the table (header, cell, and colspan adjustments)
- [x] BF002d Change Item cell layout to horizontal flex (`flex items-center gap-2`) with item dropdown (`w-48`) and description input (`flex-1 min-w-[200px]`) on same line

**Files Changed**:

- `app/components/orders/PRFLineItemsTable.vue` - All UI fixes applied

**Verification**: Tested on localhost:3000 - calculations work correctly (10 × 50 = SAR 500.00), headers in sentence case, no Cost Centre column, item dropdown and description on same row.

---

### BF003 - PROCUREMENT_SPECIALIST Cannot Access Current Period (2026-01-21)

**Issue**: When a new user with the PROCUREMENT_SPECIALIST role logs in, they cannot see the current period in the UI header. The error shown is `Error fetching current period: FetchError: [GET] "/api/periods/current": 403 Forbidden`.

**Root Cause**: The `server/middleware/role-access.ts` had `/api/periods` in the `BLOCKED_ROUTES` array, which blocked ALL period endpoints including `/api/periods/current` that the UI needs to display the current period.

**Fixes Applied**:

- [x] BF003a Remove `/api/periods` from `BLOCKED_ROUTES` array
- [x] BF003b Add `ALLOWED_PERIOD_ROUTES` array with `/api/periods/current`
- [x] BF003c Add `/api/periods` to `METHOD_RESTRICTED_ROUTES` with only `GET` allowed
- [x] BF003d Add helper functions `isAllowedPeriodRoute()` and `isRestrictedPeriodRoute()` to handle the special case
- [x] BF003e Update `isMethodRestricted()` function to use the new period route handling

**Files Changed**:

- `server/middleware/role-access.ts` - Added allowed period routes logic

**Verification**: Tested as PROCUREMENT_SPECIALIST user - period now displays correctly as "January 2025 - Open" in the header.

---

### BF004 - PROCUREMENT_SPECIALIST Cannot Access Deliveries Page (2026-01-21)

**Issue**: When a PROCUREMENT_SPECIALIST user navigates to the Deliveries page, they get an error: `Error fetching deliveries: FetchError: [GET] "/api/reports/deliveries": 403 Forbidden`.

**Root Cause**: The `server/middleware/role-access.ts` had `/api/reports` in the `BLOCKED_ROUTES` array, which blocked all report endpoints including `/api/reports/deliveries` that the deliveries list page uses.

**Fixes Applied**:

- [x] BF004a Remove `/api/reports` from `BLOCKED_ROUTES` array
- [x] BF004b Add `ALLOWED_REPORT_ROUTES` array with `/api/reports/deliveries`
- [x] BF004c Add `/api/reports` to `METHOD_RESTRICTED_ROUTES` with only `GET` allowed
- [x] BF004d Add helper functions `isAllowedReportRoute()` and `isRestrictedReportRoute()`
- [x] BF004e Update `isMethodRestricted()` function to use the new report route handling
- [x] BF004f Update documentation comments at top of `role-access.ts` to reflect new permissions

**Files Changed**:

- `server/middleware/role-access.ts` - Added allowed report routes logic

**Verification**: Tested as PROCUREMENT_SPECIALIST user - deliveries page now loads correctly with all delivery records visible.

---

### BF005 - PROCUREMENT_SPECIALIST Should Only See Orders Tab (2026-01-21)

**Issue**: PROCUREMENT_SPECIALIST users could see Dashboard and Deliveries in the navigation and access those pages. Per updated requirements, they should ONLY have access to the Orders tab.

**Root Cause**: The initial implementation allowed PROCUREMENT_SPECIALIST users to view the Dashboard and Deliveries pages for PO tracking purposes. The requirement was updated to restrict access to only the Orders page.

**Fixes Applied**:

- [x] BF005a Update `app/composables/usePermissions.ts` - Add `canAccessDashboard()` function that returns false for PROCUREMENT_SPECIALIST
- [x] BF005b Update `app/composables/usePermissions.ts` - Change `canViewDeliveries()` to return false for PROCUREMENT_SPECIALIST
- [x] BF005c Update `app/layouts/default.vue` - Hide Dashboard menu item for PROCUREMENT_SPECIALIST using `canAccessDashboard()`
- [x] BF005d Update `app/middleware/auth.global.ts` - Add redirect from "/" to "/orders" for PROCUREMENT_SPECIALIST
- [x] BF005e Update `app/middleware/auth.global.ts` - Add "/deliveries" to `PROCUREMENT_SPECIALIST_RESTRICTED_ROUTES`
- [x] BF005f Update `server/middleware/role-access.ts` - Remove `/api/reports/deliveries` from `ALLOWED_REPORT_ROUTES`
- [x] BF005g Update `server/middleware/role-access.ts` - Add `/api/locations/[id]/deliveries/*` to `BLOCKED_PATTERNS`
- [x] BF005h Update `server/middleware/role-access.ts` - Remove delivery method restriction check (now fully blocked)

**Files Changed**:

- `app/composables/usePermissions.ts` - Added `canAccessDashboard()`, updated `canViewDeliveries()`
- `app/layouts/default.vue` - Dashboard menu item visibility check
- `app/middleware/auth.global.ts` - Dashboard redirect and deliveries route restriction
- `server/middleware/role-access.ts` - Updated permissions and blocked patterns

**Verification**: Tested as PROCUREMENT_SPECIALIST user:

- Login redirects to `/orders` instead of Dashboard
- Navigation shows only "Transactions > Orders"
- Direct URL to `/` redirects to `/orders`
- Direct URL to `/deliveries` shows 403 Access Denied error

---

### BF006 - PROCUREMENT_SPECIALIST Should Not Create Deliveries or Close POs (2026-01-21)

**Issue**: PROCUREMENT_SPECIALIST users could see "Create Delivery" and "Close PO" buttons on the PO detail page. Per updated requirements, they should NOT have these abilities.

**Root Cause**: The initial implementation allowed PROCUREMENT_SPECIALIST users to:

1. See the "Create Delivery" button on PO detail page (even though the API was blocked)
2. Close POs (both UI button and API endpoint)

**Fixes Applied**:

- [x] BF006a Update `app/pages/orders/pos/[id].vue` - Hide "Create Delivery" button for users without `canPostDeliveries()` permission
- [x] BF006b Update `app/pages/orders/pos/[id].vue` - Use `canClosePO()` permission for "Close PO" button visibility
- [x] BF006c Update `app/composables/usePermissions.ts` - Change `canClosePO()` to return `true` only for ADMIN
- [x] BF006d Update `server/api/pos/[id]/close.patch.ts` - Restrict PO close endpoint to ADMIN only

**Files Changed**:

- `app/pages/orders/pos/[id].vue` - Updated button visibility conditions
- `app/composables/usePermissions.ts` - Updated `canClosePO()` to only allow ADMIN
- `server/api/pos/[id]/close.patch.ts` - Updated role check to only allow ADMIN

**Verification**: Tested as PROCUREMENT_SPECIALIST user:

- PO detail page shows only "Edit" button for OPEN POs
- "Create Delivery" button is NOT visible
- "Close PO" button is NOT visible
- Navigation shows only "Transactions > Orders"

---

## Phase 13: Delivery Tracking & Over-Delivery Workflow (2026-01-22)

**Purpose**: Implement PO line delivery tracking, over-delivery approval workflow, and automatic PO closure

### DT001 - PO Line Delivery Tracking

**Feature**: Track cumulative delivered quantities on each PO line and display remaining quantities.

**Implementation**:

- [x] DT001a Update `prisma/schema.prisma` - Add `delivered_qty` field to POLine model
- [x] DT001b Update `prisma/schema.prisma` - Add `po_line_id` field to DeliveryLine model
- [x] DT001c Update `prisma/schema.prisma` - Add relation from DeliveryLine to POLine
- [x] DT001d Update `shared/types/database.ts` - Add new fields to POLine and DeliveryLine interfaces
- [x] DT001e Update `app/composables/usePOs.ts` - Add `delivered_qty` and `remaining_qty` to interfaces
- [x] DT001f Update `server/api/pos/[id].get.ts` - Return `delivered_qty` and computed `remaining_qty`
- [x] DT001g Update `server/api/pos/open.get.ts` - Return delivery tracking info for dropdown
- [x] DT001h Update `app/components/orders/POLineItemsTable.vue` - Add "Delivered" and "Remaining" columns
- [x] DT001i Update `app/pages/orders/pos/[id].vue` - Enable delivery tracking display

**Files Changed**:

- `prisma/schema.prisma` - New fields and relations
- `shared/types/database.ts` - Updated interfaces
- `app/composables/usePOs.ts` - Updated types
- `server/api/pos/[id].get.ts` - Return delivery tracking data
- `server/api/pos/open.get.ts` - Include delivery tracking in dropdown
- `app/components/orders/POLineItemsTable.vue` - New columns
- `app/pages/orders/pos/[id].vue` - Enable tracking display

---

### DT002 - Delivery Form Pre-fill with Remaining Quantities

**Feature**: Pre-fill delivery lines with remaining PO quantities instead of full quantities.

**Implementation**:

- [x] DT002a Update `app/pages/deliveries/create.vue` - Add `poLineTrackingMap` computed for tracking info
- [x] DT002b Update `app/pages/deliveries/create.vue` - Change `poQuantityMap` to use `remaining_qty`
- [x] DT002c Update `app/pages/deliveries/create.vue` - Pre-fill lines with remaining qty in `populateLinesFromPO()`
- [x] DT002d Update `app/pages/deliveries/create.vue` - Add "Remaining" column to line items table
- [x] DT002e Update `app/pages/deliveries/create.vue` - Show delivered qty info alongside remaining

**Files Changed**:

- `app/pages/deliveries/create.vue` - All pre-fill and display logic

---

### DT003 - Over-Delivery Approval Workflow

**Feature**: Require Supervisor/Admin approval when delivery quantity exceeds PO remaining quantity.

**Implementation**:

- [x] DT003a Update `prisma/schema.prisma` - Add `over_delivery_approved` field to DeliveryLine
- [x] DT003b Update `server/api/locations/[id]/deliveries/index.post.ts` - Detect over-delivery and block Operators
- [x] DT003c Update `server/api/deliveries/[id].patch.ts` - Validate over-delivery approval on post
- [x] DT003d Update `server/api/deliveries/[id].get.ts` - Return over-delivery status in response
- [x] DT003e Update `app/pages/deliveries/create.vue` - Add approval status tracking to lines
- [x] DT003f Update `app/pages/deliveries/create.vue` - Show approval alert for Supervisors/Admins
- [x] DT003g Update `app/pages/deliveries/[id]/index.vue` - Add over-delivery alert banner
- [x] DT003h Update `app/pages/deliveries/[id]/index.vue` - Add Approve/Reject buttons for Supervisors
- [x] DT003i Update `app/pages/deliveries/[id]/index.vue` - Disable Operator actions when pending approval
- [x] DT003j Update `app/pages/deliveries/[id]/index.vue` - Add rejection modal with reason field

**Files Changed**:

- `prisma/schema.prisma` - New field
- `server/api/locations/[id]/deliveries/index.post.ts` - Over-delivery validation
- `server/api/deliveries/[id].patch.ts` - Approval validation and processing
- `server/api/deliveries/[id].get.ts` - Over-delivery status in response
- `app/pages/deliveries/create.vue` - UI for over-delivery in create form
- `app/pages/deliveries/[id]/index.vue` - Approval workflow UI

---

### DT004 - Over-Delivery Email Notifications

**Feature**: Send email notifications for over-delivery approval workflow.

**Implementation**:

- [x] DT004a Update `server/utils/email.ts` - Add `sendOverDeliveryApprovalNotification()` function
- [x] DT004b Update `server/utils/email.ts` - Add `sendOverDeliveryApprovedNotification()` function
- [x] DT004c Update `server/utils/email.ts` - Add `sendOverDeliveryRejectedNotification()` function
- [x] DT004d Update `server/api/locations/[id]/deliveries/index.post.ts` - Send approval request email
- [x] DT004e Update `server/api/deliveries/[id].patch.ts` - Send approved/rejected emails

**Files Changed**:

- `server/utils/email.ts` - Three new email templates
- `server/api/locations/[id]/deliveries/index.post.ts` - Approval request email trigger
- `server/api/deliveries/[id].patch.ts` - Approved/rejected email triggers

---

### DT005 - Automatic PO Closure

**Feature**: Automatically close PO when all line items have been fully delivered.

**Implementation**:

- [x] DT005a Update `server/api/locations/[id]/deliveries/index.post.ts` - Add auto-close check after delivery post
- [x] DT005b Update `server/api/deliveries/[id].patch.ts` - Add auto-close check after delivery post
- [x] DT005c Update both APIs - Close linked PRF when PO auto-closes
- [x] DT005d Update both APIs - Return `po_auto_closed` flag in response
- [x] DT005e Update `app/pages/deliveries/create.vue` - Show auto-close notification in success message

**Files Changed**:

- `server/api/locations/[id]/deliveries/index.post.ts` - Auto-close logic
- `server/api/deliveries/[id].patch.ts` - Auto-close logic
- `app/pages/deliveries/create.vue` - UI notification

---

### DT006 - Update PO Line delivered_qty on Delivery Post

**Feature**: Increment PO line delivered_qty when delivery is posted.

**Implementation**:

- [x] DT006a Update `server/api/locations/[id]/deliveries/index.post.ts` - Increment delivered_qty in transaction
- [x] DT006b Update `server/api/deliveries/[id].patch.ts` - Increment delivered_qty in transaction
- [x] DT006c Both APIs - Match delivery lines to PO lines by po_line_id or item_id fallback

**Files Changed**:

- `server/api/locations/[id]/deliveries/index.post.ts` - delivered_qty increment
- `server/api/deliveries/[id].patch.ts` - delivered_qty increment

**Checkpoint**: Phase 13 complete - Full delivery tracking with over-delivery approval and auto-PO closure ✅

---

### DT007 - Over-Delivery Rejection Locking (2026-01-22)

**Feature**: Permanently lock deliveries when over-delivery is rejected.

**Issue**: When an admin/supervisor rejected an over-delivery, only a note was added to the delivery but all other actions (Post, Edit, Delete) remained available, allowing the delivery to still be posted.

**Solution**: Add `over_delivery_rejected` field to permanently lock rejected deliveries.

**Implementation**:

- [x] DT007a Update `prisma/schema.prisma` - Add `over_delivery_rejected` Boolean field to Delivery model
- [x] DT007b Update `shared/types/database.ts` - Add `over_delivery_rejected` to Delivery interface
- [x] DT007c Update `server/api/deliveries/[id].get.ts` - Return `over_delivery_rejected` status in response
- [x] DT007d Update `server/api/deliveries/[id].patch.ts` - Block ALL PATCH requests for rejected deliveries
- [x] DT007e Update `server/api/deliveries/[id].patch.ts` - Set `over_delivery_rejected: true` when rejecting
- [x] DT007f Update `app/pages/deliveries/[id]/index.vue` - Disable ALL action buttons when rejected (Delete, Edit, Post)
- [x] DT007g Update `app/pages/deliveries/[id]/index.vue` - Add "Over-Delivery Rejected" alert with lock icon
- [x] DT007h Update `app/pages/deliveries/[id]/index.vue` - Format delivery notes with rejection notes on separate lines
- [x] DT007i Update `app/pages/deliveries/[id]/index.vue` - Style rejection notes with error color variant

**Files Changed**:

- `prisma/schema.prisma` - New `over_delivery_rejected` field
- `shared/types/database.ts` - Updated Delivery interface
- `server/api/deliveries/[id].get.ts` - Return rejection status
- `server/api/deliveries/[id].patch.ts` - Block actions for rejected deliveries
- `app/pages/deliveries/[id]/index.vue` - UI for locked delivery state

**Verification**: Tested rejection workflow:

1. Created delivery with over-delivery quantity
2. Rejected as admin with reason
3. Verified all buttons (Delete, Edit, Post) are disabled
4. Verified "Over-Delivery Rejected" alert shows with lock message
5. Verified rejection notes display in error color on separate lines
6. Verified backend blocks all PATCH requests for rejected deliveries

**Checkpoint**: DT007 complete - Rejected deliveries are permanently locked ✅

---

### DT008 - Delivery Display Status Badges (2026-01-25)

**Feature**: Display meaningful status badges on deliveries list and detail pages based on over-delivery approval workflow state.

**Issue**: Deliveries with over-delivery approval workflow showed incorrect statuses:

1. All non-posted deliveries showed "Draft" regardless of approval state
2. "Pending Approval" status was not being computed correctly in the reports API
3. "Approved" status was not being preserved after approval (flag was being reset)

**Root Causes**:

1. **remainingQty calculation bug**: In `server/api/reports/deliveries.get.ts`, the `remainingQty` formula was adding back `lineQty` for DRAFT deliveries, causing `isOverDelivery` to be false when it should be true
2. **pending_approval flag reset**: In `server/api/deliveries/[id].patch.ts`, the `pending_approval` flag was being reset to `false` when approval notification was sent, instead of only when posting

**Implementation**:

- [x] DT008a Fix `server/api/reports/deliveries.get.ts` - Conditional `remainingQty` calculation based on delivery status (DRAFT vs POSTED)
- [x] DT008b Fix `server/api/deliveries/[id].patch.ts` - Only reset `pending_approval` when posting, not when approving
- [x] DT008c Create `app/components/delivery/StatusBadge.vue` - Reusable component for delivery status display
- [x] DT008d Update `app/pages/deliveries/index.vue` - Use DeliveryStatusBadge component in list view
- [x] DT008e Update `app/pages/deliveries/[id]/index.vue` - Use DeliveryStatusBadge component in detail view
- [x] DT008f Update status colors - Change "Approved" from blue (info) to warning (amber)
- [x] DT008g Update PRF status colors - Change "Pending Approval" from primary (blue) to warning (amber)

**Files Changed**:

- `server/api/reports/deliveries.get.ts` - Simplified effective status logic: trusts `pending_approval` flag instead of recomputing over-delivery from PO quantities
- `server/api/deliveries/[id].patch.ts` - Fixed pending_approval flag preservation
- `app/components/delivery/StatusBadge.vue` - Reusable status badge component with amber for "Approved"
- `app/components/orders/PRFStatusBadge.vue` - Updated "Pending Approval" from primary (blue) to warning (amber)
- `app/pages/deliveries/index.vue` - Uses DeliveryStatusBadge component
- `app/pages/deliveries/[id]/index.vue` - Uses DeliveryStatusBadge component

**Display Status Mapping**:

| Database State                                             | Display Status   | Color           | Icon                  |
| ---------------------------------------------------------- | ---------------- | --------------- | --------------------- |
| `status=DRAFT`, `pending_approval=false`, `rejected=false` | Draft            | neutral (gray)  | i-lucide-file-edit    |
| `status=DRAFT`, `pending_approval=true`, `rejected=false`  | Pending Approval | warning (amber) | i-lucide-clock        |
| `status=DRAFT`, all over-delivery approved, not rejected   | Approved         | warning (amber) | i-lucide-check        |
| `status=DRAFT`, `rejected=true`                            | Rejected         | error (red)     | i-lucide-x-circle     |
| `status=POSTED`                                            | Posted           | success (green) | i-lucide-check-circle |

**Verification**: Tested complete workflow:

1. Created PRF → PO → Delivery with over-delivery (15 KG on 10 KG PO line)
2. Verified "Pending Approval" status appears in list and detail views
3. Approved over-delivery as admin
4. Verified "Approved" status appears (amber) after approval
5. Rejected over-delivery in separate test to verify "Rejected" status

**Checkpoint**: DT008 complete - Delivery status badges correctly reflect approval workflow state ✅

---

### DT009: PRF Status Badge Color Update

**Context**: PRF "Pending Approval" status badge was using primary (blue) color, which didn't convey the "action required" urgency. Changed to warning (amber) to be consistent with delivery "Pending Approval" badge.

**PRF Status Badge Mapping**:

| PRF Status | Display Label    | Color           | Icon                  |
| ---------- | ---------------- | --------------- | --------------------- |
| DRAFT      | Draft            | neutral (gray)  | i-lucide-file-edit    |
| PENDING    | Pending Approval | warning (amber) | i-lucide-clock        |
| APPROVED   | Approved         | success (green) | i-lucide-check-circle |
| REJECTED   | Rejected         | error (red)     | i-lucide-x-circle     |
| CLOSED     | Closed           | info (blue)     | i-lucide-lock         |

**Files Changed**:

- `app/components/orders/PRFStatusBadge.vue` - Changed PENDING status from primary to warning color

**Checkpoint**: DT009 complete - PRF status badges use consistent color scheme ✅

---

### DT010: PRF Tax Calculation (2026-01-26)

**Feature**: Add VAT calculation to PRF line items table, consistent with PO line items.

**Implementation**:

- [x] DT010a Update `app/components/orders/PRFLineItemsTable.vue` - Add VAT_RATE constant (15%)
- [x] DT010b Update `app/components/orders/PRFLineItemsTable.vue` - Extend PRFLineInput interface with VAT fields (vat_percent, total_before_vat, vat_amount, total_after_vat)
- [x] DT010c Update `app/components/orders/PRFLineItemsTable.vue` - Add computed totals with VAT breakdown
- [x] DT010d Update `app/components/orders/PRFLineItemsTable.vue` - Add "Before VAT", "VAT (15%)", and "Total" columns to table
- [x] DT010e Update `app/components/orders/PRFLineItemsTable.vue` - Update footer to show VAT breakdown (Before VAT, VAT 15%, Grand Total)
- [x] DT010f Update `app/components/orders/PRFForm.vue` - Add VAT_RATE constant and update PRFLineInput interface
- [x] DT010g Update `app/components/orders/PRFForm.vue` - Update addLine() to include VAT default values
- [x] DT010h Update `app/pages/orders/prfs/create.vue` - Update createEmptyLine() with VAT fields
- [x] DT010i Update `app/pages/orders/prfs/[id].vue` - Update createEmptyLine() and line mappings with VAT fields

**Files Changed**:

- `app/components/orders/PRFLineItemsTable.vue` - VAT calculation and display
- `app/components/orders/PRFForm.vue` - Interface and default values
- `app/pages/orders/prfs/create.vue` - Empty line helper with VAT fields
- `app/pages/orders/prfs/[id].vue` - Line mapping with VAT calculations

**Calculation Formula**:

```
Line Value (Before VAT) = Quantity × Estimated Price
VAT Amount = Line Value × 15%
Total (After VAT) = Line Value + VAT Amount
```

**Verification**: Tested on localhost:3000 - PRF form now shows:

- Table columns: Item, Unit, Qty, Est. Price, Before VAT, VAT (15%), Total, Action
- Footer summary: Before VAT, VAT (15%), Grand Total
- Example: 10 × SAR 100 = SAR 1,000.00 Before VAT + SAR 150.00 VAT = SAR 1,150.00 Total

**Checkpoint**: DT010 complete - PRF form includes tax calculation ✅

---

### DT011: PO Edit/Close Permission Restrictions (2026-01-26)

**Feature**: Restrict ADMIN and SUPERVISOR roles from editing POs after creation. Both roles retain the ability to manually close POs.

**Previous Permissions:**

| Operation | OPERATOR | SUPERVISOR | ADMIN | PROCUREMENT_SPECIALIST |
| --------- | -------- | ---------- | ----- | ---------------------- |
| Edit PO   | No       | No         | Yes   | Yes                    |
| Close PO  | No       | No         | Yes   | No                     |

**New Permissions:**

| Operation | OPERATOR | SUPERVISOR | ADMIN | PROCUREMENT_SPECIALIST |
| --------- | -------- | ---------- | ----- | ---------------------- |
| Edit PO   | No       | No         | No    | Yes                    |
| Close PO  | No       | Yes        | Yes   | No                     |

**Implementation**:

- [x] DT011a Update `app/composables/usePermissions.ts` - Change `canEditPO()` to only allow PROCUREMENT_SPECIALIST
- [x] DT011b Update `app/composables/usePermissions.ts` - Change `canClosePO()` to allow ADMIN and SUPERVISOR
- [x] DT011c Update `server/api/pos/[id].patch.ts` - Restrict PO edit to PROCUREMENT_SPECIALIST only
- [x] DT011d Update `server/api/pos/[id]/close.patch.ts` - Allow SUPERVISOR to close POs alongside ADMIN

**Files Changed**:

- `app/composables/usePermissions.ts` - Updated `canEditPO()` and `canClosePO()` functions
- `server/api/pos/[id].patch.ts` - Restricted edit permission to PROCUREMENT_SPECIALIST only
- `server/api/pos/[id]/close.patch.ts` - Added SUPERVISOR to allowed roles for closing POs

**Verification**: Run `pnpm typecheck` - passed with no errors

**Checkpoint**: DT011 complete - PO edit/close permissions updated ✅

---

### DT012: Additional Email Notifications (2026-01-26)

**Feature**: Add email notifications for PRF submission, PRF rejection, and PO closure to complete the notification coverage for all major workflow state transitions.

**Email Notifications Added**:

1. **PRF Submission Notification**
   - Trigger: When an Operator submits a PRF for approval
   - Recipients: All SUPERVISOR and ADMIN users
   - Purpose: Alert approvers about pending PRF requiring review

2. **PRF Rejection Notification**
   - Trigger: When a Supervisor/Admin rejects a PRF
   - Recipients: The original PRF requester (Operator)
   - Purpose: Inform requester their PRF was rejected with reason

3. **PO Closed Notification**
   - Trigger: When a Supervisor/Admin manually closes a PO
   - Recipients: The original PRF requester
   - Purpose: Inform requester that their purchase request is fulfilled

**Implementation**:

- [x] DT012a Add `sendPRFSubmissionNotification()` function to `server/utils/email.ts`
- [x] DT012b Update `server/api/prfs/[id]/submit.patch.ts` to send email when PRF is submitted
- [x] DT012c Add `sendPRFRejectionNotification()` function to `server/utils/email.ts`
- [x] DT012d Update `server/api/prfs/[id]/reject.patch.ts` to send email when PRF is rejected
- [x] DT012e Add `sendPOClosedNotification()` function to `server/utils/email.ts`
- [x] DT012f Update `server/api/pos/[id]/close.patch.ts` to send email when PO is closed

**Files Changed**:

- `server/utils/email.ts` - Added three new email notification functions
- `server/api/prfs/[id]/submit.patch.ts` - Added email notification trigger for PRF submission
- `server/api/prfs/[id]/reject.patch.ts` - Added email notification trigger for PRF rejection
- `server/api/pos/[id]/close.patch.ts` - Added email notification trigger for PO closure

**Email Notification Summary** (Updated):

| Trigger Event          | Recipients                 | Color Theme   | Status    |
| ---------------------- | -------------------------- | ------------- | --------- |
| PRF Submitted          | All SUPERVISOR & ADMIN     | Amber/Warning | ✅ Active |
| PRF Rejected           | PRF requester (Operator)   | Red/Error     | ✅ Active |
| PRF Approved           | All PROCUREMENT_SPECIALIST | Green/Success | ✅ Active |
| PO Closed              | Original PRF requester     | Blue/Info     | ✅ Active |
| Over-Delivery Created  | All SUPERVISOR & ADMIN     | Amber/Warning | ✅ Active |
| Over-Delivery Approved | Delivery creator           | Green/Success | ✅ Active |
| Over-Delivery Rejected | Delivery creator           | Red/Error     | ✅ Active |

**Verification**: All emails are non-blocking (failures don't prevent operations), include `email_sent` status in API responses, and follow existing email template patterns.

**Checkpoint**: DT012 complete - Email notification coverage is now complete for all PRF/PO workflow state transitions ✅

---

### DT013: Invoice Number Required for Over-Delivery Approval (2026-01-26)

**Bug**: Operators could submit an over-delivery for approval without filling in the invoice number.

**Root Cause**: The "Send For Approval" button was using the `isDraftValid` computed property for its disabled state, which does not require an invoice number. The stricter `isFormValid` validation requires invoice number but is only used for "Post Delivery".

**Solution**: Added a new `isSendForApprovalValid` computed property that requires invoice number, and updated the "Send For Approval" button to use this validation. Also added server-side validation to reject `send_for_approval` requests without an invoice number.

**Implementation**:

- [x] DT013a Update `app/pages/deliveries/create.vue` - Add `isSendForApprovalValid` computed property that requires invoice_no
- [x] DT013b Update `app/pages/deliveries/create.vue` - Change "Send For Approval" button to use `isSendForApprovalValid` for disabled state
- [x] DT013c Update `server/api/locations/[id]/deliveries/index.post.ts` - Add server-side validation for invoice_no when send_for_approval is true
- [x] DT013d Update `app/pages/deliveries/[id]/edit.vue` - Add `isSendForApprovalValid` computed property that requires invoice_no
- [x] DT013e Update `app/pages/deliveries/[id]/edit.vue` - Change "Send For Approval" button to use `isSendForApprovalValid` for disabled state
- [x] DT013f Update `server/api/deliveries/[id].patch.ts` - Add server-side validation for invoice_no when send_for_approval is true

**Files Changed**:

- `app/pages/deliveries/create.vue` - Added validation and updated button disabled condition
- `app/pages/deliveries/[id]/edit.vue` - Added validation and updated button disabled condition
- `server/api/locations/[id]/deliveries/index.post.ts` - Added server-side validation
- `server/api/deliveries/[id].patch.ts` - Added server-side validation

**Verification**: Tested as OPERATOR (mwilliams) with PO-040:

1. **Create page**: Selected PO-040, increased quantity to 15 (over remaining 12) to trigger over-delivery
2. Verified "Send For Approval" button is disabled when invoice number is empty
3. Filled in invoice number → button becomes enabled
4. **Edit page**: Saved draft without invoice, then edited
5. Verified "Send For Approval" button is disabled on edit page without invoice
6. Filled in invoice number → button becomes enabled

**Checkpoint**: DT013 complete - Invoice number now required for over-delivery approval requests on both create and edit pages ✅

---

### DT014: Manual PO Closure with Shortage Warning & Mandatory Reason (2026-01-27)

**Feature**: When manually closing a PO that has unfulfilled quantities (shortage or no deliveries), require a closure reason and show a warning with the unfulfilled items.

**Business Rules**:

- POs that are 100% fulfilled are automatically closed (no manual action needed)
- When manually closing a PO with unfulfilled quantities:
  - Show warning listing all unfulfilled items with ordered/delivered/remaining quantities
  - Require a mandatory closure reason
  - Store the reason in notes with timestamp and username
  - Include fulfillment status in closure notification email

**Implementation**:

- [x] DT014a Update `server/api/pos/[id]/close.patch.ts` - Calculate fulfillment status for each line
- [x] DT014b Update `server/api/pos/[id]/close.patch.ts` - Require `closure_reason` if any line has remaining qty > 0
- [x] DT014c Update `server/api/pos/[id]/close.patch.ts` - Store closure reason in notes with timestamp
- [x] DT014d Update `server/api/pos/[id]/close.patch.ts` - Return fulfillment summary in response
- [x] DT014e Update `server/utils/email.ts` - Add line items with fulfillment status to `sendPOClosedNotification`
- [x] DT014f Update `app/composables/usePOs.ts` - Add `closure_reason` parameter to close function
- [x] DT014g Create `app/components/orders/POCloseModal.vue` - Custom modal with warning and reason input
- [x] DT014h Update `app/pages/orders/pos/[id].vue` - Use new POCloseModal component

**Files Changed**:

- `server/api/pos/[id]/close.patch.ts` - Validation and storage logic
- `server/utils/email.ts` - Enhanced email with fulfillment details
- `app/composables/usePOs.ts` - Updated close function signature
- `app/components/orders/POCloseModal.vue` - New component
- `app/pages/orders/pos/[id].vue` - Use new modal

**Checkpoint**: DT014 complete - Manual PO closure requires reason when items are unfulfilled ✅

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Run `pnpm typecheck` before marking any task complete
- Follow Prettier formatting (double quotes, semicolons, 2 spaces)
