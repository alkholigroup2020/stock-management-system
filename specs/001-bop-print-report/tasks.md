# Tasks: POB Print Report

**Input**: Design documents from `/specs/001-bop-print-report/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No automated tests explicitly requested. Manual testing steps provided in quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a Nuxt 4 monolith with structure:

- **Components**: `app/components/`
- **Pages**: `app/pages/`
- **Styles**: `app/assets/css/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No additional setup needed - project infrastructure already exists

- [x] T001 Review existing POB page structure in `app/pages/pob.vue`
- [x] T002 Review existing POB components in `app/components/pob/`

---

## Phase 2: Foundational (CSS Print Styles)

**Purpose**: Add global print styles that MUST be in place before print component works

**⚠️ CRITICAL**: Print component depends on these styles being present

- [x] T003 Add CSS print media queries to `app/assets/css/main.css` with A4 page setup, visibility rules, and pagination controls

**Checkpoint**: Foundation ready - print styles in place for component implementation

---

## Phase 3: User Story 1 - Print POB Report for Period Sign-off (Priority: P1) 🎯 MVP

**Goal**: Enable users to click a print button and see a print-optimized report with period header, daily entries table, and three signature blocks.

**Independent Test**: Click print button on POB page → browser print dialog opens → report shows header with period/location/mandays, entries table, and three signature blocks (Operator, Manager, Client)

### Implementation for User Story 1

- [x] T004 [US1] Create `POBPrintReport.vue` component in `app/components/pob/POBPrintReport.vue` with typed props interface
- [x] T005 [US1] Implement report header section in `POBPrintReport.vue` showing period name, date range, location, and total mandays
- [x] T006 [US1] Implement entries table section in `POBPrintReport.vue` with date, mandays, visitor meals, total columns
- [x] T007 [US1] Implement summary row in entries table showing totals
- [x] T008 [US1] Implement three signature blocks in `POBPrintReport.vue` with labels and date fields
- [x] T009 [US1] Add print button to page header in `app/pages/pob.vue` with `cursor-pointer` class and disabled state
- [x] T010 [US1] Add `handlePrint()` function in `app/pages/pob.vue` that calls `window.print()`
- [x] T011 [US1] Add `POBPrintReport` component to `app/pages/pob.vue` template with conditional rendering
- [x] T012 [US1] Run `pnpm typecheck` to verify no type errors
- [ ] T013 [US1] Test print functionality manually: verify report displays correctly in print preview

**Checkpoint**: User Story 1 complete - users can print POB reports with signature blocks

---

## Phase 4: User Story 2 - View Print Preview Before Printing (Priority: P2)

**Goal**: Ensure the browser's print preview accurately represents the final printed document with all sections visible.

**Independent Test**: Click print button → inspect print preview → verify all data fields visible, layout professional, A4 optimized

**Note**: This story shares implementation with US1. The tasks below focus on verification and refinement.

### Implementation for User Story 2

- [ ] T014 [US2] Verify print preview displays header section correctly in multiple browsers (Chrome, Edge)
- [ ] T015 [US2] Verify print preview displays entries table with all dates in period visible
- [ ] T016 [US2] Verify print preview shows signature blocks at bottom of report
- [ ] T017 [US2] Adjust CSS print styles in `app/assets/css/main.css` if any preview issues found

**Checkpoint**: User Story 2 complete - print preview accurately shows report

---

## Phase 5: User Story 3 - Print Report with Proper Formatting (Priority: P3)

**Goal**: Ensure printed output fits on A4 paper, paginates correctly for long periods, and looks professional.

**Independent Test**: Print actual report (or PDF) → verify margins correct, no cutoff, signature blocks on final page

### Implementation for User Story 3

- [x] T018 [US3] Add pagination CSS rules in `app/assets/css/main.css` for multi-page reports
- [x] T019 [US3] Add `break-inside: avoid` to table rows in print styles
- [x] T020 [US3] Add `break-before: avoid` to signature block section in print styles
- [ ] T021 [US3] Test with 31-day period data to verify multi-page pagination works correctly
- [ ] T022 [US3] Verify all content fits within A4 margins without cutoff

**Checkpoint**: User Story 3 complete - professional print output on A4 paper

---

## Phase 6: Polish & Edge Cases

**Purpose**: Handle edge cases and final verification

- [ ] T023 Verify print button disabled when no POB data exists
- [ ] T024 Verify print button disabled during loading state
- [ ] T025 Test long location names truncate gracefully in report header
- [x] T026 Run final `pnpm typecheck` to ensure no type errors
- [x] T027 Run `pnpm format` to ensure code formatting is correct
- [ ] T028 Verify feature in both light and dark mode (print should use light styling)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - review tasks only
- **Foundational (Phase 2)**: No dependencies - CSS can be added immediately
- **User Story 1 (Phase 3)**: Depends on Phase 2 (print styles must exist)
- **User Story 2 (Phase 4)**: Depends on Phase 3 (component must exist to verify preview)
- **User Story 3 (Phase 5)**: Depends on Phase 3 (component must exist to verify formatting)
- **Polish (Phase 6)**: Depends on Phase 3 completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Verification depends on US1 implementation - Can run in parallel with US3
- **User Story 3 (P3)**: Refinement depends on US1 implementation - Can run in parallel with US2

### Within Each User Story

- Component creation before integration
- TypeScript interfaces before implementation
- Core implementation before edge cases
- `pnpm typecheck` after all code changes

### Parallel Opportunities

Once Phase 3 (US1) is complete:

- **US2 verification (T014-T017)** and **US3 pagination (T018-T022)** can run in parallel
- All Phase 6 edge case tasks (T023-T028) can run in parallel

---

## Parallel Example: User Story 1 Implementation

```bash
# Tasks T004-T008 modify the same file (POBPrintReport.vue) - run sequentially
# Tasks T009-T011 modify the same file (pob.vue) - run sequentially
# But these two groups can conceptually be split if working on separate branches
```

---

## Parallel Example: Polish Phase

```bash
# All these can run in parallel (different test scenarios, no file conflicts):
Task T023: "Verify print button disabled when no POB data"
Task T024: "Verify print button disabled during loading"
Task T025: "Test long location names truncate gracefully"
Task T028: "Verify feature in both light and dark mode"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (review existing code)
2. Complete Phase 2: Foundational (add print CSS)
3. Complete Phase 3: User Story 1 (print component + button)
4. **STOP and VALIDATE**: Test print functionality manually
5. Deploy/demo if ready - users can now print POB reports!

### Incremental Delivery

1. Complete Setup + Foundational → Print styles ready
2. Add User Story 1 → Test print works → Deploy/Demo (MVP!)
3. Add User Story 2 → Verify preview accuracy → Deploy/Demo
4. Add User Story 3 → Refine pagination → Deploy/Demo
5. Each story adds polish without breaking previous functionality

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- This feature does not modify any server-side code or database
- Manual testing is sufficient - no automated test tasks included
