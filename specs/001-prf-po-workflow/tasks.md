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

- [x] T001 Install Resend email package via `pnpm add resend`
- [x] T002 Add environment variables (RESEND_API_KEY, EMAIL_FROM) to `.env.example`
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

- [x] T018 Create email service utility in `server/utils/email.ts` with Resend integration
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
- [x] T041 [US1] Implement auto-generation of PRF numbers (PRF-001 format) in create endpoint

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

**Independent Test**: Create a PO from an approved PRF, verify VAT calculations, receive email notification

### Implementation for User Story 3

- [ ] T049 [P] [US3] Create PO list API endpoint in `server/api/pos/index.get.ts`
- [ ] T050 [P] [US3] Create PO create API endpoint in `server/api/pos/index.post.ts` with VAT calculations
- [ ] T051 [P] [US3] Create PO get API endpoint in `server/api/pos/[id].get.ts`
- [ ] T052 [P] [US3] Create PO update API endpoint in `server/api/pos/[id].patch.ts`
- [ ] T053 [US3] Create open POs dropdown API in `server/api/pos/open.get.ts`
- [ ] T054 [US3] Create `app/composables/usePOs.ts` with list, get, create, update functions
- [ ] T055 [P] [US3] Create PO line items table component in `app/components/orders/POLineItemsTable.vue` with VAT calculations
- [ ] T056 [US3] Create PO form component in `app/components/orders/POForm.vue` with supplier selection
- [ ] T057 [US3] Create PO create page in `app/pages/orders/pos/create.vue` with PRF pre-population
- [ ] T058 [US3] Create PO detail page in `app/pages/orders/pos/[id].vue` with edit capabilities
- [ ] T059 [US3] Update Orders index page POs tab with list view in `app/pages/orders/index.vue`
- [ ] T060 [US3] Implement auto-generation of PO numbers (PO-001 format) in create endpoint
- [ ] T061 [US3] Implement VAT calculation logic (15%) in `server/api/pos/index.post.ts`
- [ ] T062 [US3] Implement email notification to supplier on PO creation
- [ ] T063 [US3] Add "Create PO" action button on approved PRF detail page

**Checkpoint**: User Story 3 complete - POs can be created from PRFs with correct VAT calculations

---

## Phase 6: User Story 4 - Link Delivery to PO (Priority: P2)

**Goal**: Deliveries require mandatory PO selection with auto-population

**Independent Test**: Create delivery, select PO, verify supplier and items auto-populate

### Implementation for User Story 4

- [ ] T064 [US4] Update delivery create page to make PO selection mandatory in `app/pages/deliveries/create.vue`
- [ ] T065 [US4] Add PO dropdown with open POs filter in delivery form
- [ ] T066 [US4] Implement supplier auto-population when PO selected
- [ ] T067 [US4] Add PO line items as delivery line suggestions
- [ ] T068 [US4] Display "No open POs available" message when applicable
- [ ] T069 [US4] Update delivery create API to validate po_id is required for new deliveries in `server/api/deliveries/index.post.ts`
- [ ] T070 [US4] Add over-delivery warning when quantity exceeds PO quantity

**Checkpoint**: User Story 4 complete - Deliveries are linked to POs with validation

---

## Phase 7: User Story 5 - Close PO (Priority: P2)

**Goal**: Procurement Specialists can close POs, preventing further deliveries

**Independent Test**: Close an open PO, verify it no longer appears in delivery PO dropdown

### Implementation for User Story 5

- [ ] T071 [US5] Create PO close API endpoint in `server/api/pos/[id]/close.patch.ts`
- [ ] T072 [US5] Add close function to `app/composables/usePOs.ts`
- [ ] T073 [US5] Add "Close PO" button to PO detail page in `app/pages/orders/pos/[id].vue`
- [ ] T074 [US5] Update linked PRF status to CLOSED when PO is closed
- [ ] T075 [US5] Filter closed POs from delivery PO dropdown in `server/api/pos/open.get.ts`

**Checkpoint**: User Story 5 complete - POs can be closed, completing the order lifecycle

---

## Phase 8: User Story 6 - Procurement Specialist Access Control (Priority: P2)

**Goal**: PROCUREMENT_SPECIALIST role has limited access to appropriate pages

**Independent Test**: Log in as PROCUREMENT_SPECIALIST, verify menu items and page access restrictions

### Implementation for User Story 6

- [ ] T076 [P] [US6] Update navigation sidebar to show limited menu for PROCUREMENT_SPECIALIST in `app/components/layout/AppNavbar.vue`
- [ ] T077 [P] [US6] Add client-side route guards for restricted pages in `app/middleware/auth.ts`
- [ ] T078 [US6] Update server middleware to validate PROCUREMENT_SPECIALIST access in `server/middleware/`
- [ ] T079 [US6] Test PROCUREMENT_SPECIALIST cannot access Master Data, Issues, Transfers, Reconciliations
- [ ] T080 [US6] Ensure PROCUREMENT_SPECIALIST can view deliveries (PO-linked only)

**Checkpoint**: User Story 6 complete - Role-based access control enforced

---

## Phase 9: User Story 7 - Manage Supplier Emails (Priority: P3)

**Goal**: Admins can manage multiple email addresses per supplier for PO notifications

**Independent Test**: Edit supplier, add/remove emails, verify PO sends to all addresses

### Implementation for User Story 7

- [ ] T081 [P] [US7] Update supplier API to support emails array in `server/api/suppliers/[id].patch.ts`
- [ ] T082 [P] [US7] Add email array validation (format check) in supplier API
- [ ] T083 [US7] Update supplier create/edit pages with multi-email input in `app/pages/suppliers/`
- [ ] T084 [US7] Create email list input component for supplier form
- [ ] T085 [US7] Update `app/composables/useSuppliers.ts` to handle emails array

**Checkpoint**: User Story 7 complete - Suppliers can have multiple email addresses

---

## Phase 10: User Story 8 - Clone Rejected PRF (Priority: P2)

**Goal**: Users can clone rejected PRFs to create new drafts

**Independent Test**: Clone a rejected PRF, verify new draft created with copied content

### Implementation for User Story 8

- [ ] T086 [US8] Create PRF clone API endpoint in `server/api/prfs/[id]/clone.post.ts`
- [ ] T087 [US8] Add clone function to `app/composables/usePRFs.ts`
- [ ] T088 [US8] Add "Clone PRF" button on rejected PRF detail page in `app/pages/orders/prfs/[id].vue`
- [ ] T089 [US8] Verify cloned PRF has new number, DRAFT status, and copies all lines

**Checkpoint**: User Story 8 complete - Rejected PRFs can be cloned

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T090 [P] Create email resend endpoint in `server/api/pos/[id]/resend-email.post.ts`
- [ ] T091 [P] Add "Resend Email" button to PO detail page
- [ ] T092 [P] Add loading states to all form submissions using LoadingOverlay
- [ ] T093 [P] Ensure all buttons have `cursor-pointer` class
- [ ] T094 [P] Verify offline-aware UI (disable actions when offline) using `useOnlineStatus()`
- [ ] T095 Run `pnpm typecheck` and fix any type errors
- [ ] T096 Run `pnpm format` to ensure code formatting
- [ ] T097 Test complete workflow: PRF → Approve → PO → Delivery → Close PO
- [ ] T098 Verify with Playwright MCP on localhost:3000

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

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Run `pnpm typecheck` before marking any task complete
- Follow Prettier formatting (double quotes, semicolons, 2 spaces)
