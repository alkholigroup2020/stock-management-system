# Implementation Plan: POB Print Report

**Branch**: `001-bop-print-report` | **Date**: 2026-01-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-bop-print-report/spec.md`

## Summary

Add a "Print Report" button to the existing POB (Personnel On Board) page that generates a professional, print-optimized report. The report displays period information, location, total mandays, a table of daily POB entries, and three signature blocks (Operator, Manager, Client) for physical sign-off. Uses CSS print media queries and browser's native print dialog.

## Technical Context

**Language/Version**: TypeScript 5.9, Vue 3.5, Nuxt 4.2
**Primary Dependencies**: Nuxt UI 4.1, Tailwind CSS 4.1, Pinia 3.0
**Storage**: N/A (uses existing POB data from API)
**Testing**: Vitest (unit), Playwright (E2E)
**Target Platform**: Web (SPA mode), A4 print output
**Project Type**: Web application (Nuxt 4 monolith)
**Performance Goals**: Print dialog opens within 3 seconds of button click
**Constraints**: Must use browser's native print functionality, A4 paper optimization, offline-aware button state
**Scale/Scope**: Single page enhancement, 1 new component, CSS print styles

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Design Check (Phase 0)

| Principle                          | Status | Notes                                          |
| ---------------------------------- | ------ | ---------------------------------------------- |
| I. Data Integrity First            | N/A    | Read-only feature, no data mutations           |
| II. Type Safety Non-Negotiable     | PASS   | Will type all props/interfaces, run typecheck  |
| III. Location-Centric Architecture | PASS   | Uses existing location context from POB page   |
| IV. Approval Workflow Compliance   | N/A    | No approval workflow for printing              |
| V. Accessible by Design            | PASS   | Print button needs focus state, cursor-pointer |
| VI. Offline-Aware UI               | PASS   | Button disabled when no data available         |
| VII. Server-Side Security          | N/A    | Client-side only, no new API endpoints         |
| VIII. Consistent Code Standards    | PASS   | Follow Prettier, component naming conventions  |

**Pre-Design Gate Status**: PASSED

### Post-Design Check (Phase 1)

| Principle                          | Status | Notes                                       |
| ---------------------------------- | ------ | ------------------------------------------- |
| I. Data Integrity First            | N/A    | Confirmed: no data mutations in design      |
| II. Type Safety Non-Negotiable     | PASS   | Interfaces defined in data-model.md         |
| III. Location-Centric Architecture | PASS   | Props require location object               |
| IV. Approval Workflow Compliance   | N/A    | Confirmed: no approvals needed              |
| V. Accessible by Design            | PASS   | Button has cursor-pointer, disabled states  |
| VI. Offline-Aware UI               | PASS   | Button disabled when loading or no data     |
| VII. Server-Side Security          | N/A    | Confirmed: no server changes                |
| VIII. Consistent Code Standards    | PASS   | Component follows Nuxt 4 naming conventions |

**Post-Design Gate Status**: PASSED - Design complies with all applicable principles.

## Project Structure

### Documentation (this feature)

```text
specs/001-bop-print-report/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (empty - no new APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/
├── components/
│   └── pob/
│       ├── POBSummary.vue      # Existing - displays period/manday summary
│       ├── POBTable.vue        # Existing - displays daily entries
│       └── POBPrintReport.vue  # NEW - print-optimized report component
├── pages/
│   └── pob.vue                 # Existing - add print button here
└── assets/
    └── css/
        └── main.css            # Add @media print styles

tests/
└── e2e/                        # Playwright tests for print functionality
```

**Structure Decision**: Enhancement to existing POB feature. One new component (`POBPrintReport.vue`) for the print layout, CSS print media queries in global styles, button integration in existing `pob.vue` page.

## Complexity Tracking

> No Constitution Check violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | -          | -                                    |
