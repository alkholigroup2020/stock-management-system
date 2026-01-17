# Tasks: NCR Integration with Reconciliations

**Input**: Design documents from `/specs/001-ncr-reconciliation-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are not explicitly requested. Manual testing with Playwright MCP will be used for verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a monolithic Nuxt 4 web application:

- **Backend**: `server/api/`, `server/utils/`
- **Frontend**: `app/components/`, `app/pages/`
- **Shared**: `shared/types/`
- **Database**: `prisma/schema.prisma`

---

## Phase 1: Setup (Schema & Types)

**Purpose**: Database schema changes and shared type definitions

- [x] T001 Add NCRFinancialImpact enum to prisma/schema.prisma (after NCRStatus enum ~line 579)
- [x] T002 Add resolution_type and financial_impact fields to NCR model in prisma/schema.prisma
- [x] T003 Add ncr_credits and ncr_losses fields to Reconciliation model in prisma/schema.prisma
- [x] T004 Run database migration with `pnpm db:migrate dev --name ncr-reconciliation-integration`
- [x] T005 [P] Add NCRFinancialImpact type and NCR-related interfaces to shared/types/database.ts

---

## Phase 2: Foundational (NCR Query Utilities)

**Purpose**: Core NCR query functions that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create server/utils/ncrCredits.ts with base structure and Prisma imports
- [x] T007 Implement getCreditedNCRsForPeriod function in server/utils/ncrCredits.ts
- [x] T008 Implement getLostNCRsForPeriod function in server/utils/ncrCredits.ts
- [x] T009 Implement getPendingNCRsForPeriod function in server/utils/ncrCredits.ts
- [x] T010 Implement getOpenNCRsForPeriod function in server/utils/ncrCredits.ts
- [x] T011 Add getAllNCRSummaryForPeriod function that calls all four utilities in parallel in server/utils/ncrCredits.ts

**Checkpoint**: NCR query utilities ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View NCR Impact in Reconciliation (Priority: P1) MVP

**Goal**: Auto-calculate and display ncr_credits and ncr_losses in reconciliation summary

**Independent Test**: Create NCRs with CREDITED/REJECTED statuses, generate reconciliation, verify values appear in summary

### Implementation for User Story 1

- [x] T012 [US1] Update ConsumptionInput interface to add ncrCredits and ncrLosses in server/utils/reconciliation.ts
- [x] T013 [US1] Update calculateConsumption function formula: + ncrLosses - ncrCredits in server/utils/reconciliation.ts
- [x] T014 [US1] Update ConsumptionResult breakdown to include ncrCredits and ncrLosses in server/utils/reconciliation.ts
- [x] T015 [US1] Import NCR utilities at top of server/api/reconciliations/index.post.ts
- [x] T016 [US1] Add NCR calculation queries (parallel with stock queries) in server/api/reconciliations/index.post.ts
- [x] T017 [US1] Update upsert to include ncr_credits and ncr_losses in server/api/reconciliations/index.post.ts
- [x] T018 [US1] Update response to include ncr_credits, ncr_losses, and ncr_breakdown in server/api/reconciliations/index.post.ts
- [x] T019 [P] [US1] Update GET /api/reconciliations/consolidated to include NCR data in server/api/reconciliations/consolidated.get.ts
- [x] T020 [US1] Add NCR Credits read-only section to app/components/reconciliation/AdjustmentsForm.vue
- [x] T021 [US1] Add NCR Losses read-only section to app/components/reconciliation/AdjustmentsForm.vue
- [x] T022 [US1] Update ReconciliationSummary to display ncr_credits and ncr_losses in app/components/reconciliation/ReconciliationSummary.vue
- [x] T023 [US1] Update reconciliations page to pass NCR data to components in app/pages/reconciliations/index.vue

**Checkpoint**: User Story 1 complete - NCR values auto-calculate and display in reconciliations

---

## Phase 4: User Story 2 - Resolve NCR with Financial Impact Selection (Priority: P1)

**Goal**: Allow users to specify resolution_type and financial_impact when marking NCR as RESOLVED

**Independent Test**: Create NCR, update to RESOLVED with resolution fields, verify stored and affects reconciliation

### Implementation for User Story 2

- [x] T024 [US2] Update Zod schema to add resolution_type and financial_impact fields in server/api/ncrs/[id].patch.ts
- [x] T025 [US2] Add refinement validation: require both fields when status=RESOLVED in server/api/ncrs/[id].patch.ts
- [x] T026 [US2] Update updateData building to include new fields in server/api/ncrs/[id].patch.ts
- [x] T027 [US2] Update response to include resolution_type and financial_impact in server/api/ncrs/[id].patch.ts
- [x] T028 [US2] Add resolution_type text input field to status update modal in app/pages/ncrs/[id].vue
- [x] T029 [US2] Add financial_impact select dropdown (NONE/CREDIT/LOSS) to modal in app/pages/ncrs/[id].vue
- [x] T030 [US2] Conditionally show resolution fields only when status=RESOLVED selected in app/pages/ncrs/[id].vue
- [x] T031 [US2] Update statusUpdateForm to include resolution_type and financial_impact in app/pages/ncrs/[id].vue
- [x] T032 [US2] Update handleUpdateStatus to send resolution fields in PATCH request in app/pages/ncrs/[id].vue
- [x] T033 [US2] Display resolution_type and financial_impact in NCR detail view when resolved in app/pages/ncrs/[id].vue

**Checkpoint**: User Story 2 complete - NCRs can be resolved with financial impact selection

---

## Phase 5: User Story 3 - View Open NCR Warning During Period Close (Priority: P2)

**Goal**: Show non-blocking warning listing OPEN NCRs when attempting period close

**Independent Test**: Create OPEN NCRs for a period, initiate period close, verify warning appears with correct data

### Implementation for User Story 3

- [x] T034 [US3] Import getOpenNCRsForPeriod utility in server/api/periods/[periodId]/close.post.ts
- [x] T035 [US3] Query OPEN NCRs for all locations before creating approval in server/api/periods/[periodId]/close.post.ts
- [x] T036 [US3] Group OPEN NCRs by location with count and total value in server/api/periods/[periodId]/close.post.ts
- [x] T037 [US3] Add warnings.openNCRs object to response (only if OPEN NCRs exist) in server/api/periods/[periodId]/close.post.ts
- [x] T038 [P] [US3] Create OpenNCRWarning.vue component in app/components/reconciliation/OpenNCRWarning.vue
- [x] T039 [US3] Implement warning alert with count, total value, and expandable NCR list in OpenNCRWarning.vue
- [x] T040 [US3] Add links to individual NCR pages for resolution in OpenNCRWarning.vue
- [x] T041 [US3] Integrate OpenNCRWarning component into period close workflow UI (if applicable page exists)

**Checkpoint**: User Story 3 complete - Period close shows OPEN NCR warnings

---

## Phase 6: User Story 4 - View Pending Credits from SENT NCRs (Priority: P2)

**Goal**: Display "Pending Credits" informational section for SENT NCRs in reconciliation

**Independent Test**: Create NCRs with SENT status, view reconciliation, verify pending credits display

### Implementation for User Story 4

- [x] T042 [US4] Add Pending Credits informational section to app/components/reconciliation/AdjustmentsForm.vue
- [x] T043 [US4] Display total pending credits value with count of SENT NCRs in AdjustmentsForm.vue
- [x] T044 [US4] Add note "Awaiting supplier response" below pending credits in AdjustmentsForm.vue
- [x] T045 [US4] Make pending credits section expandable to show NCR list in AdjustmentsForm.vue
- [x] T046 [US4] Style pending credits section with appropriate warning/info color (not affecting totals)

**Checkpoint**: User Story 4 complete - Pending credits display in reconciliation

---

## Phase 7: User Story 5 - View NCR Summary by Period/Location (Priority: P3)

**Goal**: Provide dedicated NCR summary endpoint returning categorized breakdown

**Independent Test**: Call /api/ncrs/summary with periodId/locationId, verify all categories return correctly

### Implementation for User Story 5

- [x] T047 [P] [US5] Create server/api/ncrs/summary.get.ts with basic structure and auth check
- [x] T048 [US5] Add Zod validation for periodId and locationId query params in server/api/ncrs/summary.get.ts
- [x] T049 [US5] Validate period and location exist with proper error responses in server/api/ncrs/summary.get.ts
- [x] T050 [US5] Check user has access to the requested location in server/api/ncrs/summary.get.ts
- [x] T051 [US5] Call getAllNCRSummaryForPeriod utility and return formatted response in server/api/ncrs/summary.get.ts
- [x] T052 [US5] Include NCR details (ncr_no, value, delivery_no, item_name, reason) in each category

**Checkpoint**: User Story 5 complete - NCR summary endpoint available

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T053 [P] Add NCRFinancialImpact to NCR type exports in shared/types/database.ts (if not done)
- [x] T054 [P] Ensure all new API responses include proper TypeScript typing
- [x] T055 Run pnpm typecheck and fix any type errors
- [x] T056 Run pnpm format to ensure code formatting consistency
- [ ] T057 Verify NCR sections in reconciliation support dark mode (semantic tokens)
- [ ] T058 Verify offline-aware behavior: NCR resolution respects useOnlineStatus()
- [ ] T059 Manual testing: Verify all acceptance scenarios from spec.md using Playwright MCP

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion - BLOCKS all user stories
- **Phase 3-7 (User Stories)**: All depend on Phase 2 (Foundational) completion
  - US1 and US2 are both P1 priority - recommend completing both before P2 stories
  - User stories can proceed in parallel if staffed, or sequentially by priority
- **Phase 8 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Priority | Depends On   | Notes                                        |
| ----- | -------- | ------------ | -------------------------------------------- |
| US1   | P1       | Phase 2 only | Core reconciliation display - MVP            |
| US2   | P1       | Phase 2 only | NCR resolution workflow - essential          |
| US3   | P2       | Phase 2 only | Period close warning - can be added later    |
| US4   | P2       | Phase 2 only | Pending credits display - visual enhancement |
| US5   | P3       | Phase 2 only | Summary endpoint - convenience feature       |

### Within Each User Story

1. Backend changes first (API, utilities)
2. Frontend changes second (components, pages)
3. Integration last (connecting frontend to backend)

### Parallel Opportunities

**Phase 1**:

- T005 can run in parallel with T001-T004 (different files)

**Phase 2**:

- T007-T010 can all run in parallel (different functions in same file, no dependencies)

**Phase 3 (US1)**:

- T019 can run in parallel with T015-T018 (different API files)
- T020-T022 can run in parallel (different components)

**Phase 4 (US2)**:

- Backend tasks (T024-T027) must complete before frontend tasks

**Phase 5 (US3)**:

- T038 can run in parallel with T034-T037 (new component vs API updates)

**Phase 7 (US5)**:

- T047 can start immediately after Phase 2 (new file)

---

## Parallel Example: Phase 3 (User Story 1)

```bash
# After T014 completes, launch backend API updates together:
Task: T015 "Import NCR utilities in reconciliations/index.post.ts"
Task: T019 "Update consolidated.get.ts to include NCR data"

# After T018 completes, launch frontend updates together:
Task: T020 "Add NCR Credits section to AdjustmentsForm.vue"
Task: T021 "Add NCR Losses section to AdjustmentsForm.vue"
Task: T022 "Update ReconciliationSummary to display NCR values"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (schema changes)
2. Complete Phase 2: Foundational (NCR query utilities)
3. Complete Phase 3: User Story 1 (NCR values in reconciliation)
4. Complete Phase 4: User Story 2 (NCR resolution with financial impact)
5. **STOP and VALIDATE**: Test both stories independently
6. Deploy/demo if ready - core functionality complete

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test → Deploy (MVP: NCR values show in reconciliation)
3. Add User Story 2 → Test → Deploy (Complete NCR workflow)
4. Add User Story 3 → Test → Deploy (Period close warnings)
5. Add User Story 4 → Test → Deploy (Pending credits visibility)
6. Add User Story 5 → Test → Deploy (Summary endpoint)

### Suggested MVP Scope

**Minimum Viable Product**: Phase 1 + Phase 2 + Phase 3 (User Story 1)

- NCR credits and losses auto-calculate in reconciliations
- Consumption formula includes NCR impact
- UI displays NCR values in adjustments section

**Recommended MVP**: Phase 1 + Phase 2 + Phase 3 + Phase 4 (User Stories 1 + 2)

- Adds ability to resolve NCRs with financial impact selection
- Complete end-to-end NCR-to-reconciliation workflow

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Run `pnpm typecheck` frequently to catch type errors early
- All new UI must use semantic color tokens per constitution
