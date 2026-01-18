# Implementation Plan: Sync Stock Button for New Issue Page

**Branch**: `002-sync-stock-issue` | **Date**: 2026-01-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-sync-stock-issue/spec.md`

## Summary

Add a "Sync Stock" button to the New Issue page that fetches all items with positive stock from the current location and populates the Issue Items table. Users can then edit quantities or remove items before submitting the issue. This is a frontend-only feature that reuses existing API endpoints and UI patterns.

## Technical Context

**Language/Version**: TypeScript 5.x with Vue 3 Composition API
**Primary Dependencies**: Nuxt 4, Nuxt UI, Pinia (location store), `$fetch` for API calls
**Storage**: N/A (uses existing LocationStock data via API)
**Testing**: Manual testing via Playwright MCP, `pnpm typecheck`
**Target Platform**: Web (SPA mode, PWA-enabled)
**Project Type**: Web application (monolithic Nuxt 4)
**Performance Goals**: Sync operation completes in under 30 seconds for 50+ items
**Constraints**: Offline-aware (button disabled when offline), must handle locations with 0 stock gracefully
**Scale/Scope**: Single page modification (`app/pages/issues/create.vue`)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                          | Status  | Notes                                                                                                    |
| ---------------------------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| I. Data Integrity First            | ✅ PASS | No data mutations - uses existing stock data read-only; existing validation for issue creation unchanged |
| II. Type Safety Non-Negotiable     | ✅ PASS | Will use existing typed interfaces; no `any` types; `pnpm typecheck` required                            |
| III. Location-Centric Architecture | ✅ PASS | Uses `locationStore.activeLocation` for all operations; location context explicit                        |
| IV. Approval Workflow Compliance   | ✅ PASS | Issues have no approval workflow (documented exception)                                                  |
| V. Accessible by Design            | ✅ PASS | Button follows existing patterns; uses Nuxt UI components with built-in accessibility                    |
| VI. Offline-Aware UI               | ✅ PASS | FR-011 requires button disabled when offline; uses existing `useOfflineGuard` composable                 |
| VII. Server-Side Security          | ✅ PASS | Uses existing authenticated API endpoints; no new security requirements                                  |
| VIII. Consistent Code Standards    | ✅ PASS | Will follow Prettier config; `cursor-pointer` on button; existing component patterns                     |

**Gate Status**: ✅ All gates pass - proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/002-sync-stock-issue/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - no new entities)
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output (N/A - no new API endpoints)
```

### Source Code (repository root)

```text
app/
├── pages/
│   └── issues/
│       └── create.vue   # PRIMARY: Add Sync Stock button and handler
├── composables/
│   └── useOfflineGuard.ts  # EXISTING: Reuse for offline detection
└── stores/
    └── location.ts      # EXISTING: Reuse activeLocation

server/
└── api/
    └── items/
        └── index.get.ts # EXISTING: Reuse for fetching items with stock
```

**Structure Decision**: Single file modification to `app/pages/issues/create.vue`. No new files required - the feature is self-contained within the existing page component.

## Complexity Tracking

> No violations to justify - feature uses existing patterns and infrastructure.
