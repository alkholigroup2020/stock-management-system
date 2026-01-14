# Tasks: Developer Guide Documentation Layout

**Input**: Design documents from `/specs/001-dev-guide-layout/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: NOT REQUESTED - Implementation tasks only

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: Nuxt 4 monolith
- **Frontend**: `app/` directory
- **Components**: `app/components/developer/`
- **Composables**: `app/composables/`
- **Pages**: `app/pages/`
- **Layouts**: `app/layouts/`
- **Middleware**: `app/middleware/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create foundational files and structure for the documentation layout feature

- [x] T001 Create dev-mode route middleware in app/middleware/dev-only.ts
- [x] T002 [P] Create useDevGuideNav composable structure in app/composables/useDevGuideNav.ts
- [x] T003 [P] Create docs layout file in app/layouts/docs.vue

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Define DocSection and SearchResult interfaces in app/composables/useDevGuideNav.ts
- [x] T005 Create navigation sections array with all 20 doc sections in app/composables/useDevGuideNav.ts
- [x] T006 [P] Create pages directory structure: app/pages/dev-guide/
- [x] T007 Create catch-all route page in app/pages/dev-guide/[...slug].vue with basic structure

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Access Developer Guide (Priority: P1) 🎯 MVP

**Goal**: Developers can click the dev icon in navbar and be taken to a dedicated documentation page with a proper layout

**Independent Test**: Click dev icon in navbar during dev mode → Navigate to /dev-guide → See docs layout with sidebar and content

### Implementation for User Story 1

- [x] T008 [US1] Implement docs.vue layout with header, sidebar slot, and content area in app/layouts/docs.vue
- [x] T009 [P] [US1] Create DocsSidebar component in app/components/developer/DocsSidebar.vue
- [x] T010 [P] [US1] Create DocsContent wrapper component in app/components/developer/DocsContent.vue
- [x] T011 [US1] Implement basic navigation state in useDevGuideNav (activeSection from route params) in app/composables/useDevGuideNav.ts
- [x] T012 [US1] Connect DocsSidebar to useDevGuideNav for section list rendering in app/components/developer/DocsSidebar.vue
- [x] T013 [US1] Implement [...slug].vue page to render section components dynamically in app/pages/dev-guide/[...slug].vue
- [x] T014 [US1] Create index.vue that redirects to /dev-guide/getting-started in app/pages/dev-guide/index.vue
- [x] T015 [US1] Update navbar dev icon to navigate to /dev-guide instead of opening drawer in app/layouts/default.vue
- [x] T016 [US1] Update Ctrl+Shift+D keyboard shortcut to navigate instead of open drawer in app/layouts/default.vue
- [x] T017 [US1] Apply dev-only middleware to dev-guide pages in app/pages/dev-guide/[...slug].vue

**Checkpoint**: User Story 1 complete - Developers can access docs via navbar icon, see sidebar and content

---

## Phase 4: User Story 2 - Navigate Documentation Sections (Priority: P2)

**Goal**: Developers can navigate between sections using the sidebar, with active state highlighting

**Independent Test**: Click different sections in sidebar → URL updates → Content changes → Active section highlighted

### Implementation for User Story 2

- [x] T018 [US2] Add navigateToSection function to useDevGuideNav in app/composables/useDevGuideNav.ts
- [x] T019 [US2] Implement active section highlighting in DocsSidebar in app/components/developer/DocsSidebar.vue
- [x] T020 [US2] Add click handlers to sidebar items that call navigateToSection in app/components/developer/DocsSidebar.vue
- [x] T021 [US2] Implement provide/inject for devTargetSection in [...slug].vue for subsection deep linking in app/pages/dev-guide/[...slug].vue
- [x] T022 [US2] Make sidebar sticky/fixed while content scrolls in app/components/developer/DocsSidebar.vue
- [x] T023 [US2] Add keyboard navigation (arrow keys, enter) to sidebar in app/components/developer/DocsSidebar.vue

**Checkpoint**: User Story 2 complete - Full sidebar navigation working with active states

---

## Phase 5: User Story 3 - Consistent Documentation Design (Priority: P2)

**Goal**: All documentation sections have consistent visual design and reading experience

**Independent Test**: Navigate through multiple sections → Verify typography, spacing, code blocks are consistent

### Implementation for User Story 3

- [x] T024 [P] [US3] Create DocsTypography styles for consistent headings/paragraphs in app/assets/css/docs.css or app/components/developer/DocsContent.vue
- [x] T025 [P] [US3] Ensure CodeBlock component styling is consistent in app/components/developer/CodeBlock.vue
- [x] T026 [US3] Apply consistent padding and max-width to DocsContent in app/components/developer/DocsContent.vue
- [x] T027 [US3] Verify all 20 existing guide components render correctly in new layout (spot check 5 components)
- [x] T028 [US3] Add dark mode support verification to docs layout in app/layouts/docs.vue

**Checkpoint**: User Story 3 complete - Consistent design across all documentation sections

---

## Phase 6: User Story 4 - Return to Application (Priority: P3)

**Goal**: Developers can easily return to the main application from the documentation

**Independent Test**: Click back button or logo → Return to previous app location or dashboard

### Implementation for User Story 4

- [x] T029 [US4] Add header with back-to-app button in docs.vue layout in app/layouts/docs.vue
- [x] T030 [US4] Implement back navigation using router.back() or navigateTo('/') in app/layouts/docs.vue
- [x] T031 [US4] Add app logo/branding that links to main app in app/layouts/docs.vue

**Checkpoint**: User Story 4 complete - Easy return to main application

---

## Phase 7: User Story 5 - Documentation Search (Priority: P3)

**Goal**: Developers can search within documentation and navigate to matching sections

**Independent Test**: Type search query → See results → Click result → Navigate to section

### Implementation for User Story 5

- [x] T032 [P] [US5] Create DocsSearch component with search input in app/components/developer/DocsSearch.vue
- [x] T033 [US5] Move searchable content array from DevGuideDrawer to useDevGuideNav in app/composables/useDevGuideNav.ts
- [x] T034 [US5] Implement search filtering logic in useDevGuideNav (computed property) in app/composables/useDevGuideNav.ts
- [x] T035 [US5] Add debounced search input handling (150ms) in app/components/developer/DocsSearch.vue
- [x] T036 [US5] Create search results dropdown UI in app/components/developer/DocsSearch.vue
- [x] T037 [US5] Implement goToResult function to navigate and set targetSubSection in app/components/developer/DocsSearch.vue
- [x] T038 [US5] Add "no results found" empty state in app/components/developer/DocsSearch.vue
- [x] T039 [US5] Add highlight match function for search result text in app/components/developer/DocsSearch.vue
- [x] T040 [US5] Integrate DocsSearch into docs.vue layout header in app/layouts/docs.vue

**Checkpoint**: User Story 5 complete - Full search functionality working

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T041 [P] Add responsive sidebar behavior (collapsed on mobile/tablet) in app/components/developer/DocsSidebar.vue
- [x] T042 [P] Add sidebar toggle button for mobile in app/layouts/docs.vue
- [x] T043 Add localStorage persistence for sidebar collapsed state in app/composables/useDevGuideNav.ts
- [x] T044 Add focus states to all interactive elements (Constitution V. Accessible by Design)
- [x] T045 Add cursor-pointer class to all buttons (Constitution requirement)
- [x] T046 Run pnpm typecheck and fix any type errors
- [x] T047 Run pnpm format to ensure code formatting
- [x] T048 [P] Mark DevGuideDrawer.vue as deprecated with comment in app/components/developer/DevGuideDrawer.vue
- [x] T049 Run quickstart.md validation scenarios with Playwright MCP

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (P1) → US2 (P2) → US3 (P2) → US4 (P3) → US5 (P3)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

| Story          | Depends On   | Can Start After  |
| -------------- | ------------ | ---------------- |
| US1 (Access)   | Foundational | Phase 2 complete |
| US2 (Navigate) | US1          | T017 complete    |
| US3 (Design)   | US1          | T017 complete    |
| US4 (Return)   | US1          | T017 complete    |
| US5 (Search)   | US2          | T023 complete    |

### Within Each User Story

- Components before integration
- State management before UI binding
- Core functionality before enhancements
- Commit after each task or logical group

### Parallel Opportunities

**Phase 1 (Setup):**

- T002, T003 can run in parallel

**Phase 2 (Foundational):**

- T006 can run parallel with T004, T005

**Phase 3 (US1):**

- T009, T010 can run in parallel (different components)

**Phase 5 (US3):**

- T024, T025 can run in parallel (different files)

**Phase 7 (US5):**

- T032 can run parallel with T033

**Phase 8 (Polish):**

- T041, T042, T048 can run in parallel

---

## Parallel Example: User Story 1 Implementation

```bash
# After T008 completes, launch in parallel:
Task: "T009 [P] [US1] Create DocsSidebar component"
Task: "T010 [P] [US1] Create DocsContent wrapper component"

# Then sequential:
Task: "T011 [US1] Implement navigation state"
Task: "T012 [US1] Connect DocsSidebar to useDevGuideNav"
# ... continue sequentially
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T007)
3. Complete Phase 3: User Story 1 (T008-T017)
4. **STOP and VALIDATE**: Test accessing docs via navbar icon
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → **MVP Complete!**
3. Add US2 → Test navigation → Enhanced experience
4. Add US3 → Test design consistency → Polished experience
5. Add US4 → Test return flow → Better workflow
6. Add US5 → Test search → Full feature complete
7. Polish → Production ready

---

## Notes

- All existing guide components (20+) are reused without modification
- DevGuideDrawer.vue kept but marked deprecated for rollback capability
- No tests included as not explicitly requested
- Playwright MCP used for quickstart.md validation in T049
- Constitution requirements (cursor-pointer, dark mode, focus states) addressed in Polish phase
