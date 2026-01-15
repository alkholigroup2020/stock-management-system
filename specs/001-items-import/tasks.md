# Tasks: Items Import via Excel/CSV

**Input**: Design documents from `/specs/001-items-import/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested in specification. Tests are excluded.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions (Nuxt 4 Monolithic)

- **Frontend**: `app/components/`, `app/pages/`, `app/composables/`, `app/utils/`
- **Backend**: `server/api/`, `server/utils/`
- **Shared**: `shared/types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create shared type definitions

- [x] T001 Install xlsx and papaparse dependencies: `pnpm add xlsx papaparse && pnpm add -D @types/papaparse`
- [x] T002 [P] Create shared import types in shared/types/import.ts (ImportRow, ImportError, ImportResult, ImportSummary, ImportPreview interfaces)
- [x] T003 [P] Create Zod validation schemas in server/utils/item-import-validator.ts (UnitSchema, ImportRowSchema)
- [x] T004 [P] Create column mapping constants in server/utils/item-import-validator.ts (COLUMN_MAPPINGS, REQUIRED_COLUMNS)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core parsing utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create Excel parsing utility function in server/utils/file-parsers.ts (parseExcelFile using xlsx library)
- [x] T006 [P] Create CSV parsing utility function in server/utils/file-parsers.ts (parseCSVFile using papaparse)
- [x] T007 Create column header mapping function in server/utils/file-parsers.ts (mapHeaders with case-insensitive matching)
- [x] T008 Create file type detection function in server/utils/file-parsers.ts (detectFileType from extension and MIME type)
- [x] T009 Implement row validation function in server/utils/item-import-validator.ts (validateImportRows using Zod schema)
- [x] T010 Implement duplicate detection function in server/utils/item-import-validator.ts (findDuplicatesInFile for FR-006)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Import Items from File (Priority: P1) 🎯 MVP

**Goal**: Allow users to upload Excel/CSV files and bulk-create items in a single operation

**Independent Test**: Upload a valid file with 10 items → verify all 10 items appear in the items list

### Implementation for User Story 1

- [x] T011 [US1] Implement POST /api/items/import endpoint in server/api/items/import.post.ts
  - Auth check (Admin/Supervisor only)
  - File size validation (10MB max)
  - Row limit validation (1000 max per FR-012)
  - Parse file using file-parsers utilities
  - Validate rows using item-import-validator
  - Check for existing codes in database (FR-005)
  - Bulk insert valid rows with Prisma transaction
  - Return ImportResult with summary and errors
- [x] T012 [P] [US1] Create useItemsImport composable in app/composables/useItemsImport.ts
  - Reactive state for file, loading, results, errors
  - uploadFile() method calling /api/items/import
  - Error handling and toast notifications
  - Offline status check (FR offline-aware)
- [x] T013 [P] [US1] Create ItemsImportDialog component in app/components/items/ImportDialog.vue
  - UModal with file input accepting .xlsx and .csv
  - Upload button with loading state
  - Disable when offline with tooltip
  - cursor-pointer on all buttons
  - Dark mode support
- [x] T014 [US1] Create ItemsImportResults component in app/components/items/ImportResults.vue
  - Display ImportSummary (total, success, errors)
  - List ImportError items with row numbers
  - Success/error color coding using semantic tokens
- [x] T015 [US1] Add Import button to Items page in app/pages/items/index.vue
  - Conditionally render for canEditItems() users
  - Trigger ImportDialog open
  - Refresh items list on successful import
- [x] T016 [US1] Run pnpm typecheck and pnpm format to verify code quality gates

**Checkpoint**: User Story 1 complete - users can import items from Excel/CSV files

---

## Phase 4: User Story 2 - Download Import Template (Priority: P2)

**Goal**: Provide downloadable template file with correct columns and sample data

**Independent Test**: Download template → open in Excel → verify headers (Code, Name, Unit, Category, Subcategory) and sample rows

### Implementation for User Story 2

- [x] T017 [US2] Implement GET /api/items/import-template endpoint in server/api/items/import-template.get.ts
  - Accept ?format=xlsx|csv query parameter (default xlsx)
  - Generate template with xlsx library (for Excel) or manual CSV string
  - Include column headers: Code, Name, Unit, Category, Subcategory
  - Include 3 sample data rows
  - Set Content-Disposition header for download
  - Auth check (Admin/Supervisor only)
- [x] T018 [US2] Add Download Template link to ImportDialog in app/components/items/ImportDialog.vue
  - Link/button to /api/items/import-template?format=xlsx
  - Opens in new tab for download
  - cursor-pointer styling
- [x] T019 [US2] Run pnpm typecheck and pnpm format to verify code quality gates

**Checkpoint**: User Story 2 complete - users can download template to prepare import files

---

## Phase 5: User Story 3 - Handle Import Errors Gracefully (Priority: P2)

**Goal**: Show detailed error report for failed rows while importing valid ones

**Independent Test**: Upload file with 2 intentional errors → verify 8 items imported, 2 errors shown with specific messages

### Implementation for User Story 3

- [x] T020 [US3] Enhance ItemsImportResults to display detailed error list in app/components/items/ImportResults.vue
  - Scrollable error list with row numbers
  - Group errors by type (validation, duplicate, etc.)
  - Show field name and specific message for each error
  - Color-coded badges for error types
- [x] T021 [US3] Add error message constants to server/utils/item-import-validator.ts
  - Human-readable messages for each ImportErrorCode
  - Consistent formatting: "Row {n}: {field} - {message}"
- [x] T022 [US3] Enhance import.post.ts error collection in server/api/items/import.post.ts
  - Collect validation errors with exact row numbers (1-indexed)
  - Collect duplicate-in-file errors with both row numbers
  - Collect duplicate-in-database errors with existing item reference
  - Return all errors even when some rows succeed
- [x] T023 [US3] Run pnpm typecheck and pnpm format to verify code quality gates

**Checkpoint**: User Story 3 complete - users see clear error messages for failed rows

---

## Phase 6: User Story 4 - Preview Before Import (Priority: P3)

**Goal**: Show parsed data preview before committing import

**Independent Test**: Upload file → see first 10 rows in preview table → click Confirm → items created

### Implementation for User Story 4

- [x] T024 [US4] Implement POST /api/items/import-preview endpoint in server/api/items/import-preview.post.ts
  - Parse file without database insert
  - Return ImportPreview with headers, first 10 rows, total count
  - Validate required columns presence
  - Auth check (Admin/Supervisor only)
- [x] T025 [P] [US4] Create ItemsImportPreview component in app/components/items/ImportPreview.vue
  - Table showing parsed data (first 10 rows)
  - Column headers from file
  - Total row count display
  - Missing columns warning if applicable
- [x] T026 [US4] Update ImportDialog workflow in app/components/items/ImportDialog.vue
  - Step 1: File selection
  - Step 2: Preview display (call preview endpoint)
  - Step 3: Confirm button to proceed with import
  - Cancel button to return to step 1
  - Loading states for each step
- [x] T027 [US4] Update useItemsImport composable in app/composables/useItemsImport.ts
  - Add previewFile() method calling /api/items/import/preview
  - Track current step state (select → preview → importing → results)
  - Handle preview errors separately from import errors
- [x] T028 [US4] Run pnpm typecheck and pnpm format to verify code quality gates

**Checkpoint**: User Story 4 complete - users can preview data before import

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting all user stories

- [x] T029 [P] Verify dark mode compatibility across all import components
- [x] T030 [P] Verify keyboard navigation works for file input and all buttons
- [x] T031 Add console logging for import operations (file name, row count, success/error counts)
- [x] T032 Test with Playwright MCP: Navigate to /items, click Import, upload test file, verify results
- [x] T033 Run final pnpm typecheck and pnpm format:check to verify all gates pass

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (BLOCKS all user stories)
    ↓
┌───────────────────────────────────────────────────┐
│  User Stories can proceed in priority order:      │
│                                                   │
│  Phase 3: US1 - Core Import (P1) 🎯 MVP          │
│      ↓                                           │
│  Phase 4: US2 - Download Template (P2)           │
│      ↓                                           │
│  Phase 5: US3 - Error Handling (P2)              │
│      ↓                                           │
│  Phase 6: US4 - Preview (P3)                     │
└───────────────────────────────────────────────────┘
    ↓
Phase 7: Polish
```

### User Story Dependencies

| Story    | Depends On                 | Can Start After  |
| -------- | -------------------------- | ---------------- |
| US1 (P1) | Foundational only          | Phase 2 complete |
| US2 (P2) | US1 (adds to ImportDialog) | Phase 3 complete |
| US3 (P2) | US1 (enhances results)     | Phase 3 complete |
| US4 (P3) | US1 (adds preview step)    | Phase 3 complete |

### Parallel Opportunities

**Phase 1 (Setup)**:

```
T002, T003, T004 can run in parallel (different files)
```

**Phase 2 (Foundational)**:

```
T005, T006 can run in parallel (same file, different functions)
After T007: T009, T010 can run in parallel
```

**Phase 3 (US1)**:

```
T012, T013 can run in parallel (different files)
```

**Phase 6 (US4)**:

```
T024, T025 can run in parallel (server vs component)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T010)
3. Complete Phase 3: User Story 1 (T011-T016)
4. **STOP and VALIDATE**: Test import with valid Excel/CSV file
5. Deploy MVP - users can bulk import items

### Incremental Delivery

| Milestone | Stories Complete | User Value                                    |
| --------- | ---------------- | --------------------------------------------- |
| MVP       | US1              | Users can import items                        |
| v1.1      | US1 + US2        | Users have template to guide file preparation |
| v1.2      | US1 + US2 + US3  | Users understand exactly what failed and why  |
| v1.3      | All              | Users can preview before committing           |

---

## Task Summary

| Phase        | Tasks  | Parallel Tasks |
| ------------ | ------ | -------------- |
| Setup        | 4      | 3              |
| Foundational | 6      | 2              |
| US1 (P1)     | 6      | 2              |
| US2 (P2)     | 3      | 0              |
| US3 (P2)     | 4      | 0              |
| US4 (P3)     | 5      | 2              |
| Polish       | 5      | 2              |
| **Total**    | **33** | **11**         |

---

## Notes

- All tasks include file paths for immediate execution
- Each user story has a typecheck/format gate task (T016, T019, T023, T028)
- MVP scope = Phase 1 + Phase 2 + Phase 3 (16 tasks)
- [P] tasks can be launched in parallel to maximize efficiency
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
