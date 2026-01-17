# Implementation Plan: NCR Integration with Reconciliations

**Branch**: `001-ncr-reconciliation-integration` | **Date**: 2026-01-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ncr-reconciliation-integration/spec.md`

## Summary

Integrate NCR (Non-Conformance Report) financial data into the Reconciliation workflow. NCRs track delivery issues (price variances, quality defects) and their resolution impacts reconciliation calculations. This feature:

- Auto-calculates `ncr_credits` (CREDITED + RESOLVED/CREDIT) and `ncr_losses` (REJECTED + RESOLVED/LOSS)
- Displays "Pending Credits" for SENT NCRs
- Shows non-blocking warnings for OPEN NCRs during period close
- Adds `resolution_type` and `financial_impact` fields to NCR for RESOLVED status tracking

## Technical Context

**Language/Version**: TypeScript 5.x (Nuxt 4 / Vue 3)
**Primary Dependencies**: Nuxt 4, Nuxt UI, Prisma ORM, Zod validation, Pinia state management
**Storage**: PostgreSQL 15+ via Supabase (Prisma ORM)
**Testing**: Manual testing with Playwright MCP, unit tests for reconciliation calculations
**Target Platform**: Web (SPA mode, Vercel deployment)
**Project Type**: Monolithic Nuxt 4 web application
**Performance Goals**: API responses < 1s for single location operations, < 2s for cross-location
**Constraints**: WCAG AA accessibility, offline-aware UI (disable actions when offline)
**Scale/Scope**: Multi-location inventory system with ~50 NCRs per period typical

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                          | Status | Notes                                                                                                            |
| ---------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| I. Data Integrity First            | PASS   | NCR calculations are read-only aggregations; no stock mutations. Audit trail maintained via existing NCR fields. |
| II. Type Safety Non-Negotiable     | PASS   | New enum `NCRFinancialImpact` and interfaces will be fully typed. Zod validation for API inputs.                 |
| III. Location-Centric Architecture | PASS   | All NCR queries filter by `location_id`. NCR-period association uses `delivery.period_id` or date fallback.      |
| IV. Approval Workflow Compliance   | PASS   | No new approval workflows. Period close remains Admin-only with existing approval flow.                          |
| V. Accessible by Design            | PASS   | New UI uses existing Nuxt UI components with semantic tokens. NCR sections read-only in adjustments form.        |
| VI. Offline-Aware UI               | PASS   | NCR sections in reconciliation are read-only display. RESOLVED status update respects `useOnlineStatus()`.       |
| VII. Server-Side Security          | PASS   | NCR PATCH API already validates role and location access. New summary endpoint follows same pattern.             |
| VIII. Consistent Code Standards    | PASS   | Prettier formatting, Nuxt 4 component naming, TypeScript strict mode.                                            |

**Gate Result**: PASS - No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-ncr-reconciliation-integration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma                    # Add NCRFinancialImpact enum, NCR fields, Reconciliation fields

server/
├── api/
│   ├── ncrs/
│   │   ├── [id].patch.ts            # UPDATE: Add resolution_type, financial_impact validation
│   │   └── summary.get.ts           # NEW: NCR summary by period/location
│   ├── reconciliations/
│   │   ├── index.post.ts            # UPDATE: Calculate ncr_credits, ncr_losses
│   │   └── consolidated.get.ts      # UPDATE: Include NCR data
│   └── periods/
│       └── [periodId]/
│           └── close.post.ts        # UPDATE: Add OPEN NCR warning
└── utils/
    ├── ncrCredits.ts                # NEW: NCR query utilities (4 functions)
    └── reconciliation.ts            # UPDATE: Consumption formula with NCR fields

shared/types/
└── database.ts                      # UPDATE: Add NCRFinancialImpact type

app/
├── components/
│   └── reconciliation/
│       ├── AdjustmentsForm.vue      # UPDATE: Display NCR credits/losses sections
│       ├── ReconciliationSummary.vue # UPDATE: NCR breakdown display
│       └── OpenNCRWarning.vue       # NEW: Warning component for OPEN NCRs
└── pages/
    ├── ncrs/
    │   └── [id].vue                 # UPDATE: Add resolution fields for RESOLVED status
    └── reconciliations/
        └── index.vue                # UPDATE: Pass NCR data to components
```

**Structure Decision**: Monolithic Nuxt 4 structure per existing codebase conventions. Backend changes in `/server/`, frontend in `/app/`, shared types in `/shared/types/`.

## Complexity Tracking

No violations to justify - all principles pass.
