<!--
  SYNC IMPACT REPORT
  ====================
  Version Change: 0.0.0 → 1.0.0 (MAJOR - Initial constitution creation)

  Added Sections:
  - Core Principles (8 principles)
  - Technical Constraints
  - Development Workflow
  - Governance

  Templates Requiring Updates:
  - ✅ .specify/templates/plan-template.md - Constitution Check section now has concrete gates
  - ✅ .specify/templates/spec-template.md - Requirements align with principles
  - ✅ .specify/templates/tasks-template.md - Task categories reflect principle-driven types

  Follow-up TODOs: None
-->

# Stock Management System Constitution

## Core Principles

### I. Data Integrity First

All stock transactions MUST maintain data integrity without exception. This is the foundational
principle that protects business accuracy and audit compliance.

**Non-Negotiable Rules:**

- Never allow negative stock at any location - validate `requestedQty <= locationStock.onHand`
  before all issues and transfers
- Never modify closed periods - check `period.status === "OPEN"` before any transaction posts
- Never change WAC on issues - only deliveries recalculate Weighted Average Cost
- Always maintain complete audit trail with `userId`, `timestamp`, `action`, and `locationId`
- Price variance detection MUST auto-generate NCRs when delivery price differs from period price

**Rationale:** Stock management systems are financial tools. Data integrity failures cascade into
accounting errors, audit failures, and business losses. Prevention is non-negotiable.

### II. Type Safety Non-Negotiable

TypeScript MUST be used correctly throughout the codebase. Runtime type errors indicate
preventable defects that should never reach production.

**Non-Negotiable Rules:**

- Zero `any` types in production code - all data MUST have explicit interfaces
- All API responses MUST be properly typed with defined interfaces
- All error handlers MUST use proper type guards (not type assertions)
- Zod schemas MUST validate all external inputs (API requests, form data)
- Prisma Decimal types MUST be handled correctly (conversion to number when needed)
- `pnpm typecheck` MUST pass with zero errors before any task is considered complete

**Rationale:** TypeScript's value comes from catching errors at compile time. Permitting `any`
types defeats this purpose and creates hidden runtime failure modes.

### III. Location-Centric Architecture

Every transaction MUST have explicit location context. The multi-location architecture is
fundamental to the business model, not an afterthought.

**Non-Negotiable Rules:**

- Never skip location context - all transactions require `locationId`
- Operators MUST be explicitly assigned to locations via `UserLocation` join table
- Supervisors and Admins have implicit access to all locations (no explicit assignment required)
- Transfers MUST capture source location's WAC for cost transfer accuracy
- Location-specific stock levels (`LocationStock`) MUST be updated atomically

**Rationale:** Multi-location support is a core business requirement. Location-agnostic code
creates consolidation errors and breaks audit trails.

### IV. Approval Workflow Compliance

Business workflows with approval requirements MUST enforce those requirements. Bypassing approvals
constitutes a security and compliance violation.

**Non-Negotiable Rules:**

- PRF/PO: MUST require Supervisor approval before execution
- Transfers: MUST follow status workflow (DRAFT → PENDING_APPROVAL → APPROVED → COMPLETED)
- Period Close: MUST require Admin approval with all locations in READY state
- Issues: No approval needed - posts immediately (explicitly documented exception)
- Reconciliations: No approval needed for adjustments (explicitly documented exception)

**Rationale:** Approval workflows exist for segregation of duties and compliance. Software that
allows bypasses undermines organizational controls.

### V. Accessible by Design

Accessibility is a first-class requirement, not a post-launch enhancement. All UI components
MUST meet accessibility standards from initial implementation.

**Non-Negotiable Rules:**

- All color combinations MUST meet WCAG AA contrast ratios (4.5:1 normal text, 3:1 large text)
- Semantic design tokens MUST be used (`--ui-stock-healthy` not `--color-emerald-600`)
- Dark mode MUST be fully supported with proper token variants
- All interactive elements MUST have visible focus states using `--ui-ring`
- Color MUST NOT be the sole indicator of meaning - use text/icons alongside
- All buttons MUST include `cursor-pointer` class
- Keyboard navigation MUST work for all interactive elements

**Rationale:** Accessibility is a legal requirement in many jurisdictions and an ethical
imperative. Retrofitting accessibility is expensive and often incomplete.

### VI. Offline-Aware UI

The PWA architecture requires explicit handling of offline states. Users MUST always understand
connectivity status and its implications for their actions.

**Non-Negotiable Rules:**

- Use `useOnlineStatus()` composable to detect offline state in all data-modifying components
- Disable action buttons when offline: `<UButton :disabled="!isOnline">`
- Show clear offline indicators (OfflineBanner component)
- Prevent data-modifying operations when offline with user feedback
- Static assets MUST be cached via service worker for offline UI access

**Out of Scope (MVP):** Full offline mode with local database sync - deferred to post-MVP

**Rationale:** Users who don't know they're offline will attempt actions that fail silently or
produce confusing errors. Explicit offline awareness prevents frustration and data loss.

### VII. Server-Side Security

All security enforcement MUST happen on the server. Client-side protections are UX conveniences
only and MUST NOT be trusted for authorization.

**Non-Negotiable Rules:**

- Authentication middleware MUST validate user session on every API request
- Authorization middleware MUST check role and location access before data operations
- Return 403 Forbidden for unauthorized access attempts (not 404 or generic errors)
- Supabase service key MUST be server-only - never expose in client code
- All API routes under `/api/*` MUST be auto-protected with authentication

**Client-Side (UX Only):**

- Navigation menu filtering based on user role (convenience)
- UI element hiding for unauthorized actions (convenience)
- Route guards that redirect unauthorized users (convenience)

**Rationale:** Client-side code can be inspected and modified. Security that relies on client
behavior is not security.

### VIII. Consistent Code Standards

Code formatting and structure MUST follow project standards without exception. Inconsistent code
creates merge conflicts, review burden, and maintenance debt.

**Non-Negotiable Rules:**

- Prettier formatting: double quotes, semicolons, 2-space indentation, 100-char line width
- Arrow functions: always parentheses around parameters `(x) => x` not `x => x`
- Vue files: no indentation on `<script>` and `<style>` blocks
- Nuxt 4 component naming: folder path + filename (e.g., `layout/AppNavbar.vue` → `<LayoutAppNavbar />`)
- All inputs in forms MUST have `class="w-full"` for proper grid behavior
- LoadingOverlay MUST be used for all save/post/approve operations to block UI

**Commands:**

- `pnpm format` - Format all files
- `pnpm format:check` - Verify formatting (CI gate)
- `pnpm typecheck` - Verify type safety (CI gate)

**Rationale:** Consistent code reduces cognitive load during reviews and maintenance. Format
wars waste time. Standards eliminate debates.

## Technical Constraints

This section documents framework-specific limitations that MUST be respected to avoid build
failures and runtime errors.

### Tailwind CSS v4 Limitations

**@apply Restriction:**

- `@apply` ONLY works with built-in Tailwind utilities
- Cannot use `@apply custom-class-name` - will cause build errors
- Custom classes MUST use direct CSS properties

**@utility Directive:**

- Utility names MUST be alphanumeric only (starting with lowercase letter)
- Cannot include pseudo-elements or pseudo-classes in utility name
- Use regular CSS classes for `:hover`, `::placeholder`, etc.

### Nuxt 4 Architecture

**Monolithic Structure:**

- Frontend: SPA pages in `/app/pages/`, components in `/app/components/`
- Backend: API routes in `/server/api/`, middleware in `/server/middleware/`
- Shared types: `/shared/types/`
- No separate backend service - all API routes are Nuxt server routes

**Nuxt UI Color Mapping:**

- Use semantic colors: `color="primary"`, `color="secondary"`, `color="success"`, `color="error"`
- Custom color names like `color="navy"` will NOT work
- Configure colors via CSS variables in `app/assets/css/main.css`, NOT in `app.config.ts`

### Database & ORM

**Prisma with Supabase:**

- Use Transaction pooler (port 6543) for `DATABASE_URL`
- Use Direct connection (port 5432) for `DIRECT_URL` (migrations only)
- Never use `db:push` in production - always use migrations
- Decimal types require explicit handling when converting to JavaScript numbers

## Development Workflow

### Branch Strategy

1. Create feature branch from `main`
2. Implement: Schema (Prisma) → API route → Composable → Component/Page
3. Run `pnpm typecheck` and `pnpm format:check` before considering work complete
4. Test with `pnpm dev` at `http://localhost:3000`
5. Push for preview deployment
6. Merge to `main` for production deployment

### Task Completion Checklist

Before any task is considered complete:

- [ ] Code follows Prettier formatting rules
- [ ] `pnpm typecheck` shows zero errors
- [ ] No `any` types in the code
- [ ] All error handlers use proper type guards
- [ ] All interfaces are properly defined
- [ ] API responses are properly typed
- [ ] Tested in both light and dark mode
- [ ] Verified with Playwright MCP when applicable

### Deployment

**Platform:** Vercel (frontend + API) + Supabase (PostgreSQL)

**Required Environment Variables:**

- `DATABASE_URL` - Prisma connection (Transaction pooler)
- `DIRECT_URL` - Migration connection (Direct)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `AUTH_SECRET`, `NUXT_SESSION_PASSWORD`
- `NUXT_PUBLIC_SITE_URL`, `NUXT_PUBLIC_CURRENCY`

**Deployment Flow:**

- Push to `main` → Production deployment
- Pull requests → Preview deployment

## Governance

### Constitution Authority

This constitution supersedes all other development practices and conventions. When conflicts
arise between this document and other guidance:

1. This constitution takes precedence
2. Document the conflict in the Sync Impact Report
3. Propose amendments through proper process if constitution needs updating

### Amendment Process

To amend this constitution:

1. Document the proposed change with rationale
2. Assess impact on existing code and templates
3. Update all dependent templates (plan, spec, tasks)
4. Increment version according to semantic versioning:
   - MAJOR: Backward-incompatible governance/principle changes
   - MINOR: New principles or materially expanded guidance
   - PATCH: Clarifications, wording, typo fixes
5. Update `LAST_AMENDED_DATE` to amendment date

### Compliance Review

All code reviews MUST verify:

1. Principle compliance (especially Data Integrity and Type Safety)
2. Technical constraint adherence (Tailwind v4, Nuxt 4 patterns)
3. Formatting and typecheck gates pass
4. No unauthorized complexity additions

### Runtime Guidance

For day-to-day development guidance, refer to:

- `CLAUDE.md` - AI assistant instructions and project context
- `project-docs/UI_DESIGN_SYSTEM.md` - Complete design system reference
- `project-docs/USER_ROLES_PERMISSIONS.md` - RBAC implementation details

**Version**: 1.0.0 | **Ratified**: 2026-01-14 | **Last Amended**: 2026-01-14
