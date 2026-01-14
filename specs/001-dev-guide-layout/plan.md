# Implementation Plan: Developer Guide Documentation Layout

**Branch**: `001-dev-guide-layout` | **Date**: 2026-01-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-dev-guide-layout/spec.md`

## Summary

Move the Developer Guide from a slide-over drawer (`USlideover`) to a dedicated documentation page with its own layout. The new layout will provide a full-page documentation experience with persistent sidebar navigation, search functionality, and consistent design across all sections. Access remains dev-mode only via the navbar icon and Ctrl+Shift+D shortcut.

## Technical Context

**Language/Version**: TypeScript 5.x with Vue 3 Composition API
**Primary Dependencies**: Nuxt 4, Nuxt UI, Tailwind CSS v4, Vue Router
**Storage**: N/A (client-side only, no database involvement)
**Testing**: Playwright MCP for visual/functional verification
**Target Platform**: Web browser (SPA mode, client-side rendering)
**Project Type**: Web application (Nuxt 4 monolith)
**Performance Goals**: Page load < 2 seconds, search results < 500ms
**Constraints**: Dev-mode only (`import.meta.dev`), responsive design (mobile/tablet/desktop)
**Scale/Scope**: ~20 documentation sections, single page with dynamic content

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                          | Status         | Notes                                               |
| ---------------------------------- | -------------- | --------------------------------------------------- |
| I. Data Integrity First            | N/A            | No stock transactions involved                      |
| II. Type Safety Non-Negotiable     | ✅ PASS        | All interfaces defined, zero `any` types            |
| III. Location-Centric Architecture | N/A            | No location context required                        |
| IV. Approval Workflow Compliance   | N/A            | No approval workflows involved                      |
| V. Accessible by Design            | ✅ MUST COMPLY | Keyboard navigation, focus states, WCAG AA contrast |
| VI. Offline-Aware UI               | ✅ PARTIAL     | Static docs work offline; search is client-side     |
| VII. Server-Side Security          | N/A            | Dev-mode only, no server routes                     |
| VIII. Consistent Code Standards    | ✅ MUST COMPLY | Prettier formatting, Nuxt 4 conventions             |

**Key Constitution Requirements:**

- All buttons MUST include `cursor-pointer` class
- Dark mode MUST be fully supported
- Keyboard navigation MUST work for sidebar and search
- `pnpm typecheck` MUST pass with zero errors

## Project Structure

### Documentation (this feature)

```text
specs/001-dev-guide-layout/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (navigation structure)
├── quickstart.md        # Phase 1 output (testing scenarios)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/
├── layouts/
│   └── docs.vue                    # NEW: Documentation layout
├── pages/
│   └── dev-guide/
│       ├── index.vue               # NEW: Documentation landing page
│       └── [...slug].vue           # NEW: Dynamic section routes
├── components/
│   └── developer/
│       ├── DevGuideDrawer.vue      # EXISTING: Will be deprecated
│       ├── DocsLayout.vue          # NEW: Main docs layout component
│       ├── DocsSidebar.vue         # NEW: Sidebar navigation
│       ├── DocsSearch.vue          # NEW: Search component
│       ├── DocsContent.vue         # NEW: Content wrapper
│       ├── CodeBlock.vue           # EXISTING: Reuse
│       ├── GettingStartedDev.vue   # EXISTING: Reuse
│       ├── ArchitectureOverview.vue # EXISTING: Reuse
│       └── [other guide components] # EXISTING: Reuse all ~20 components
├── composables/
│   └── useDevGuideNav.ts           # NEW: Navigation state management
└── middleware/
    └── dev-only.ts                 # NEW: Dev-mode route guard
```

**Structure Decision**: Nuxt 4 monolithic structure with:

- New `docs` layout for documentation pages
- Page-based routing under `/dev-guide/` namespace
- Reuse all existing documentation content components
- New composable for navigation state
- Route middleware to restrict access to dev mode only

## Complexity Tracking

> No violations detected. Implementation follows existing patterns.

| Consideration                  | Decision                          | Rationale                                    |
| ------------------------------ | --------------------------------- | -------------------------------------------- |
| Separate layout vs. page       | Separate `docs.vue` layout        | Cleaner separation, reusable for future docs |
| Dynamic routes vs. single page | Dynamic `[...slug].vue`           | Enables deep linking per spec requirement    |
| Keep drawer vs. remove         | Keep temporarily, mark deprecated | Allows rollback if issues discovered         |
