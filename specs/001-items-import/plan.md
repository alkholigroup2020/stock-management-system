# Implementation Plan: Items Import via Excel/CSV

**Branch**: `001-items-import` | **Date**: 2026-01-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-items-import/spec.md`

## Summary

Implement a bulk import feature for the Items page that allows administrators and supervisors to upload Excel (.xlsx) or CSV files to create multiple items at once. The feature includes file validation, data preview, partial import with error reporting, and a downloadable template. This replaces manual one-by-one item creation for bulk onboarding scenarios.

## Technical Context

**Language/Version**: TypeScript 5.9, Vue 3.5, Nuxt 4.2
**Primary Dependencies**: Nuxt UI 4.1, Prisma 6.18, Zod 4.1, xlsx (for Excel parsing), papaparse (for CSV parsing)
**Storage**: PostgreSQL via Supabase (Prisma ORM)
**Testing**: Vitest for unit tests, Playwright for E2E
**Target Platform**: Web (SPA mode, PWA-enabled)
**Project Type**: Monolithic Nuxt 4 application (frontend + API in single codebase)
**Performance Goals**: 100 items imported in under 30 seconds (SC-001)
**Constraints**: Max 1000 rows per file (FR-012), file size limit 10MB, offline-aware UI
**Scale/Scope**: Single import dialog on Items page, no batch job queue needed

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Data Integrity First

| Gate                       | Status  | Notes                                        |
| -------------------------- | ------- | -------------------------------------------- |
| Unique item codes enforced | ✅ PASS | FR-005 requires rejecting existing codes     |
| Audit trail for imports    | ✅ PASS | Import operation logged with user, timestamp |
| No negative stock impact   | N/A     | Import creates items only, no stock changes  |
| Period check required      | N/A     | Items are global entities, not period-scoped |

### II. Type Safety Non-Negotiable

| Gate                    | Status      | Notes                                         |
| ----------------------- | ----------- | --------------------------------------------- |
| Zero `any` types        | ✅ REQUIRED | All import data must be typed with interfaces |
| Zod validation          | ✅ REQUIRED | Validate parsed file data with Zod schemas    |
| API responses typed     | ✅ REQUIRED | Import response interface defined             |
| `pnpm typecheck` passes | ✅ REQUIRED | Gate for task completion                      |

### III. Location-Centric Architecture

| Gate                      | Status | Notes                                    |
| ------------------------- | ------ | ---------------------------------------- |
| Location context required | N/A    | Items are global (not location-specific) |

### IV. Approval Workflow Compliance

| Gate              | Status | Notes                                          |
| ----------------- | ------ | ---------------------------------------------- |
| Approval required | N/A    | Item import does not require approval workflow |

### V. Accessible by Design

| Gate                        | Status      | Notes                                   |
| --------------------------- | ----------- | --------------------------------------- |
| WCAG AA contrast            | ✅ REQUIRED | Import dialog must meet contrast ratios |
| Semantic design tokens      | ✅ REQUIRED | Use `--ui-*` tokens                     |
| Dark mode support           | ✅ REQUIRED | Import dialog works in both modes       |
| Keyboard navigation         | ✅ REQUIRED | File input, buttons navigable           |
| `cursor-pointer` on buttons | ✅ REQUIRED | All buttons include class               |

### VI. Offline-Aware UI

| Gate              | Status      | Notes                              |
| ----------------- | ----------- | ---------------------------------- |
| Offline detection | ✅ REQUIRED | Disable import button when offline |
| User feedback     | ✅ REQUIRED | Tooltip on disabled button         |

### VII. Server-Side Security

| Gate                | Status      | Notes                                       |
| ------------------- | ----------- | ------------------------------------------- |
| Auth middleware     | ✅ REQUIRED | API route protected                         |
| Authorization check | ✅ REQUIRED | Only users with `canEditItems()` can import |
| File validation     | ✅ REQUIRED | Validate file type and size server-side     |

### VIII. Consistent Code Standards

| Gate                       | Status      | Notes                              |
| -------------------------- | ----------- | ---------------------------------- |
| Prettier formatting        | ✅ REQUIRED | Double quotes, semicolons, 2-space |
| Nuxt 4 component naming    | ✅ REQUIRED | Follow folder+file convention      |
| `pnpm format:check` passes | ✅ REQUIRED | Gate for task completion           |

**Constitution Check Result**: ✅ ALL GATES PASS - No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-items-import/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── items-import.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/
├── components/
│   └── items/
│       ├── ImportDialog.vue       # Main import modal component
│       ├── ImportPreview.vue      # Preview table for parsed data
│       └── ImportResults.vue      # Results summary with errors
├── composables/
│   └── useItemsImport.ts          # Import logic and state management
├── pages/
│   └── items/
│       └── index.vue              # Existing - add Import button
└── utils/
    └── file-parsers.ts            # Excel/CSV parsing utilities

server/
├── api/
│   └── items/
│       ├── import.post.ts         # POST /api/items/import
│       └── import-template.get.ts # GET /api/items/import-template
└── utils/
    └── item-import-validator.ts   # Server-side validation

shared/
└── types/
    └── import.ts                  # Import-related type definitions

public/
└── templates/
    └── items-import-template.xlsx # Downloadable template
```

**Structure Decision**: Monolithic Nuxt 4 structure with feature-specific components under `app/components/items/`, API routes under `server/api/items/`, and shared types in `shared/types/`.

## Complexity Tracking

> No violations requiring justification. Standard feature implementation.
