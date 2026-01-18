# Tasks: Sync Stock Button for New Issue Page

**Input**: Design documents from `/specs/002-sync-stock-issue/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Manual testing via Playwright MCP (no automated tests required)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- All tasks modify `app/pages/issues/create.vue` (single file feature)

## Path Conventions

- **Project Type**: Nuxt 4 monolithic web application
- **Primary File**: `app/pages/issues/create.vue`
- **No new files required** - feature is self-contained

---

## Phase 1: Setup

**Purpose**: Verify development environment and understand existing code

- [ ] T001 Verify dev server runs with `pnpm dev` at http://localhost:3000
- [ ] T002 Navigate to `/issues/create` and confirm existing page loads correctly
- [ ] T003 Read and understand existing code in `app/pages/issues/create.vue` (lines 1-601)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared state and infrastructure for all user stories

**⚠️ CRITICAL**: Complete these before any user story implementation

- [ ] T004 Add `syncing` ref for loading state in script section of `app/pages/issues/create.vue`
- [ ] T005 Run `pnpm typecheck` to verify no type errors introduced

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Sync All Stock Items to Issue (Priority: P1) 🎯 MVP

**Goal**: Click "Sync Stock" button to populate Issue Items table with all stocked items

**Independent Test**: Click the "Sync Stock" button and verify all in-stock items appear in the table with correct on-hand quantities and WAC values

### Implementation for User Story 1

- [ ] T006 [US1] Add "Sync Stock" button to card header template before "Add Item" button in `app/pages/issues/create.vue` (line ~78-90)
- [ ] T007 [US1] Implement `syncStock()` function that filters items with positive stock in `app/pages/issues/create.vue`
- [ ] T008 [US1] In `syncStock()`, transform filtered items to IssueLine array with correct fields (id, item_id, quantity, wac, line_value, on_hand, has_insufficient_stock)
- [ ] T009 [US1] In `syncStock()`, replace `lines.value` with new synced lines array (not append)
- [ ] T010 [US1] Handle empty stock edge case: show toast via `handleError()` when no items have positive stock
- [ ] T011 [US1] Run `pnpm typecheck` to verify no type errors
- [ ] T012 [US1] Test manually: click "Sync Stock" and verify table populates with all stocked items

**Checkpoint**: User Story 1 complete - sync button populates table with stock data

---

## Phase 4: User Story 2 - Edit Synced Quantities (Priority: P1)

**Goal**: Allow editing quantities on synced items with proper recalculation

**Independent Test**: After syncing items, modify quantity field and verify Line Value recalculates

### Implementation for User Story 2

- [ ] T013 [US2] Verify existing `updateLineCalculations()` watcher handles synced items correctly in `app/pages/issues/create.vue`
- [ ] T014 [US2] Test manually: sync items, edit a quantity, verify Line Value recalculates
- [ ] T015 [US2] Test manually: reduce quantity below on-hand, verify no insufficient stock warning
- [ ] T016 [US2] Test manually: increase quantity above on-hand, verify insufficient stock warning appears

**Checkpoint**: User Story 2 complete - editing synced quantities works correctly

---

## Phase 5: User Story 3 - Remove Unneeded Items (Priority: P2)

**Goal**: Allow deleting synced items with proper Total Value recalculation

**Independent Test**: After syncing items, click delete button and verify item is removed

### Implementation for User Story 3

- [ ] T017 [US3] Verify existing `removeLine()` function works with synced items in `app/pages/issues/create.vue`
- [ ] T018 [US3] Test manually: sync items, delete an item, verify it's removed from table
- [ ] T019 [US3] Test manually: delete items until one remains, verify delete button is disabled
- [ ] T020 [US3] Test manually: verify Total Value recalculates after deletions

**Checkpoint**: User Story 3 complete - deleting synced items works correctly

---

## Phase 6: User Story 4 - Loading State During Sync (Priority: P3)

**Goal**: Show loading indicator on button during sync operation

**Independent Test**: Click "Sync Stock" button and observe loading spinner while data loads

### Implementation for User Story 4

- [ ] T021 [US4] Add `:loading="syncing"` prop to "Sync Stock" button in `app/pages/issues/create.vue`
- [ ] T022 [US4] Set `syncing.value = true` at start of `syncStock()` function
- [ ] T023 [US4] Set `syncing.value = false` in finally block of `syncStock()` function
- [ ] T024 [US4] Add `:disabled="!isOnline || syncing"` to disable button when offline or loading
- [ ] T025 [US4] Test manually: click "Sync Stock" and verify spinner appears during operation

**Checkpoint**: User Story 4 complete - loading state shows during sync

---

## Phase 7: Polish & Validation

**Purpose**: Final verification and code quality checks

- [ ] T026 Run `pnpm typecheck` - must pass with zero errors
- [ ] T027 Run `pnpm format` to ensure code follows Prettier rules
- [ ] T028 Verify button has `cursor-pointer` class per project standards
- [ ] T029 Test offline behavior: go offline (DevTools > Network > Offline), verify button is disabled
- [ ] T030 Test full workflow: sync → edit quantities → delete items → submit issue
- [ ] T031 Run validation using Playwright MCP at http://localhost:3000/issues/create

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Depends on US1 (needs synced items to edit) - but uses existing code, mostly testing
- **User Story 3 (P2)**: Depends on US1 (needs synced items to delete) - but uses existing code, mostly testing
- **User Story 4 (P3)**: Can start after Foundational - Independent of US2/US3

### Within Each User Story

- Implementation tasks in order
- Testing at end of each story
- Run `pnpm typecheck` after implementation changes

### Parallel Opportunities

Since all tasks modify the same file (`app/pages/issues/create.vue`), parallel execution is limited.

**Can run in parallel (different sections of file):**
- T006 (template) can start while T007-T010 (script) are in progress conceptually

**Recommended sequential approach:**
- Complete one user story fully before starting next
- US1 first (core functionality), then US4 (loading state), then US2/US3 (verification of existing code)

---

## Parallel Example: N/A (Single File Feature)

This feature modifies a single file, so parallel task execution is not applicable.

**Recommended execution order:**
```text
T001 → T002 → T003 (Setup - understand existing code)
T004 → T005 (Foundational - add syncing ref)
T006 → T007 → T008 → T009 → T010 → T011 → T012 (US1 - sync functionality)
T013 → T014 → T015 → T016 (US2 - edit verification)
T017 → T018 → T019 → T020 (US3 - delete verification)
T021 → T022 → T023 → T024 → T025 (US4 - loading state)
T026 → T027 → T028 → T029 → T030 → T031 (Polish)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T005)
3. Complete Phase 3: User Story 1 (T006-T012)
4. **STOP and VALIDATE**: Test sync button independently
5. Feature is usable at this point!

### Incremental Delivery

1. US1 → Sync button works (MVP!)
2. US4 → Add loading state (quick win)
3. US2 → Verify editing works (mostly testing)
4. US3 → Verify deleting works (mostly testing)
5. Polish → Final validation

### Estimated Effort

- **US1**: ~15 minutes (core implementation)
- **US2**: ~5 minutes (verification of existing code)
- **US3**: ~5 minutes (verification of existing code)
- **US4**: ~5 minutes (add loading state)
- **Polish**: ~10 minutes (validation and testing)
- **Total**: ~40 minutes

---

## Notes

- All tasks modify single file: `app/pages/issues/create.vue`
- No new API endpoints needed - uses existing `/api/items` with stock data
- No database changes required
- US2 and US3 mostly verify existing code works with synced items
- Use Playwright MCP for final validation
- Commit after completing each user story checkpoint
