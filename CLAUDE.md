# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Stock Management System** - A multi-location inventory management system built with **Nuxt 4**. Replaces Excel-based workflows with a modern web application featuring real-time stock tracking, inter-location transfers, weighted average costing (WAC), and coordinated period-end close across multiple sites.

**Framework Version:** This project uses **Nuxt 4** (not Nuxt 3). Always refer to Nuxt 4 documentation when implementing features or resolving issues.

## Development Best Practices

### Component Usage and Naming Conventions

**Nuxt 4 Component Auto-Import:** Components in subdirectories combine folder path + filename.
- `app/components/layout/AppNavbar.vue` → `<LayoutAppNavbar />`
- `app/components/delivery/LineItem.vue` → `<DeliveryLineItem />`
- Nested: `app/components/ui/form/Input.vue` → `<UiFormInput />`
- Root `/app/components/` needs no prefix: `Footer.vue` → `<Footer />`

### Always Check Official Documentation First

**CRITICAL:** Before implementing features, **always check official docs first** to avoid trial-and-error.

**Key Resources:**
- **Nuxt 4:** https://nuxt.com/docs
- **Nuxt UI:** https://ui.nuxt.com
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Prisma:** https://www.prisma.io/docs
- **Pinia:** https://pinia.vuejs.org
- **Vue 3:** https://vuejs.org/guide

**Key Business Concepts:**

- **Multi-location:** Support for Kitchen, Store, Central, and Warehouse locations with independent stock levels
- **WAC Costing:** Weighted Average Cost calculated per location, updated on deliveries
- **Period Management:** Monthly accounting periods with coordinated close across all locations
- **Price Variance Detection:** Automatic NCR generation when delivery prices differ from locked period prices
- **Approval Workflows:** PRF/PO and Transfers require Supervisor approval; Period Close requires Admin approval

## Development Commands

**Package Manager:** pnpm (required)

```bash
pnpm install    # Install dependencies
pnpm dev        # Dev server (localhost:3000)
pnpm build      # Production build
pnpm typecheck  # Type checking
pnpm lint       # Linting

# Database (when configured): db:push, db:migrate, db:studio
# Testing (when configured): test, test:unit, test:api
```

## Architecture

### Tech Stack

- **Framework:** Nuxt 4 (SPA mode, `ssr: false`)
- **UI Library:** Nuxt UI (with Tailwind CSS v4)
- **Styling:** Tailwind CSS v4 (CSS-first configuration using `@theme` directive)
- **State Management:** Pinia
- **Type Safety:** TypeScript, Zod
- **Backend:** Nuxt Server Routes (Nitro/H3) - monolithic architecture, no separate backend
- **Database:** PostgreSQL 15+ via Supabase, accessed through Prisma ORM (not yet configured)
- **Auth:** nuxt-auth-utils with JWT in httpOnly cookies (not yet configured)
- **PWA:** @vite-pwa/nuxt for installable app with offline awareness
- **Hosting:** Vercel (frontend + API), Supabase (database)

### Monolithic Structure

This is a **single Nuxt 4 application** that contains both frontend and backend:

- Frontend: SPA pages in `/app/pages/`, components in `/app/components/`
- Backend: API routes in `/server/api/`, server middleware in `/server/middleware/`
- Shared: Composables in `/app/composables/`, utilities in `/app/utils/`, types in `/shared/types/`
- No separate backend service; all API routes are Nuxt server routes deployed as Vercel serverless functions

### Directory Structure Conventions

```
/app/                   # Frontend (Nuxt 4 uses /app/ not /src/)
  /assets/css/          # Tailwind CSS v4 theme config
  /components/          # Auto-imported Vue components (organized by feature)
  /composables/         # Auto-imported composables (useApi, useAuth, etc.)
  /layouts/             # Layout templates
  /middleware/          # Client-side route guards
  /pages/               # Auto-routing pages
  /plugins/             # Vue plugins
  /stores/              # Pinia stores
  /utils/               # Client utilities
  app.vue               # Root component

/server/                # Backend (Nitro/H3)
  /api/                 # API endpoints (RESTful routes)
  /middleware/          # Server middleware (auth, location-access)
  /utils/               # Server utilities (WAC, validation)

/shared/types/          # Shared TypeScript types
/prisma/                # Database schema & migrations (when configured)
/project-docs/          # Documentation (PRD, tasks, guides)
```

## Data Model Key Concepts

### Multi-Location Architecture

- **Location** entity is central; all transactions are location-specific
- **LocationStock** maintains per-location inventory (quantity + WAC)
- **UserLocation** controls which users can access which locations
- Stock operations are isolated by location; transfers move stock between them

### Period Price Locking (Critical Business Rule)

- **ItemPrice** table locks prices at period start
- **DeliveryLine** stores both `unit_price` (actual) and `period_price` (expected)
- Price variance automatically creates an NCR with `type: PRICE_VARIANCE` and `auto_generated: true`
- This prevents unauthorized price changes mid-period

### Critical Workflows

**WAC Calculation:** `newWAC = (currentQty × currentWAC + receivedQty × receiptPrice) / (currentQty + receivedQty)`
- Deliveries update WAC; Issues deduct at current WAC (no recalc)
- Price variance auto-creates NCR

**Transfer Flow:** DRAFT → PENDING_APPROVAL → APPROVED → COMPLETED (atomic execution)

**Period Close:** All locations must be READY → Admin approval → Simultaneous close with snapshots

## API Design Patterns

**Error Handling:** Use `createError({ statusCode, statusMessage, data: { code, message, details } })`

**Standard Error Codes:** `INSUFFICIENT_STOCK`, `LOCATION_ACCESS_DENIED`, `PERIOD_CLOSED`, `VALIDATION_ERROR`, `PRICE_VARIANCE`

**Auth:** All `/api/*` routes auto-protected. Access user via `event.context.user`

**Location Access:** Middleware validates user has access to `locationId` in route params

## Business Logic Critical Rules

**No Negative Stock:** Always validate `requestedQty <= locationStock.onHand` before issues/transfers

**Period Validation:** Check `period.status === "OPEN"` before all transaction posts

**Audit Trail:** Log every mutation with `userId`, `timestamp`, `action`, `locationId`

## PWA Implementation

**Level 1 PWA:** Installable, offline-aware UI (no offline data in MVP)
- Use `useOnlineStatus()` composable to detect offline state
- Disable action buttons when offline: `<UButton :disabled="!isOnline">`
- Static assets cached via Vite PWA; IndexedDB deferred to post-MVP

## Testing & Database (Not Yet Configured)

**Testing (Planned):**
- Unit tests: WAC calculations, reconciliation math (`/tests/unit/`)
- API tests: Deliveries, issues, transfers, period close (`/tests/api/`)
- Manual testing: Cross-location transfers, price variance NCRs, period close, PWA

**Database Migrations (Planned):**
- Dev: `pnpm db:push` (prototyping) or `pnpm db:migrate dev` (with history)
- Production: `pnpm db:migrate deploy` (never use db:push in production)

## Role-Based Access Control

**Roles:**
- **Operator:** Post deliveries/issues, view stock (assigned locations)
- **Supervisor:** Approve transfers/PRF, manage reconciliations (all locations)
- **Admin:** Manage items/prices, close periods, system config (all locations)

**Permission Check:** Verify `user.role` and `user.locations` access in server routes

## Deployment

**Vercel:** Auto-deploys on `main` push, preview on PRs. Set env vars in dashboard.

**Required Env Vars:** `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `AUTH_SECRET`, `AUTH_ORIGIN`, `NUXT_PUBLIC_SITE_URL`, `NUXT_PUBLIC_CURRENCY`

## Development Workflow

1. Create feature branch from `main`
2. Implement: Schema (Prisma) → API route → Composable → Component/Page → Tests
3. Test with `pnpm dev` → Push for preview → Merge to `main` for production

**Current:** Focus on frontend. Database, API routes, tests added later.

**Future (when configured):**
- Schema changes: Edit `prisma/schema.prisma` → `pnpm db:migrate dev` → Use generated types
- API routes: Use `defineEventHandler`, access `event.context.user`, validate with middleware

## Key Documentation Files

See `/project-docs/` for: **PRD**, **MVP**, **MVP_DEVELOPMENT_TASKS**, **TASK_COMPLETION_LOG**, **System_Design**, **API_Contract**, **Entities_ERD**, **development_stack**, **Workflow_Guide**, **Roles_Permissions**, **pwa-implementation-guide**, **DESIGN_SYSTEM**

**IMPORTANT:** After completing main tasks from MVP_DEVELOPMENT_TASKS.md, update TASK_COMPLETION_LOG.md with 1-2 paragraph summary.

## Currency and Localization

- **Currency:** SAR (Saudi Riyal) - always display as "SAR 1,234.56"
- **Decimal places:** 2 for currency, up to 4 for quantities
- **Date format:** DD/MM/YYYY (display), ISO 8601 (API)
- **Timezone:** Asia/Riyadh
- **Language:** English (MVP), Arabic support planned
- **Units:** KG (Kilograms), EA (Each), LTR (Liters), BOX, CASE, PACK

## Theme Colors and Styling

**Design System:** Navy Blue (#000046) = primary/brand, Emerald (#45cf7b) = success/secondary, Amber = warnings, Red = errors. All colors in `app/assets/css/main.css` using Tailwind v4 + CSS variables. See `/project-docs/DESIGN_SYSTEM.md` for full reference.

**Color Palettes:** `navy`, `emerald`, `zinc`, `amber`, `red`, `blue` (shades 50-950)

**Semantic Tokens:** Use `var(--ui-bg)`, `var(--ui-bg-elevated)`, `var(--ui-text)`, `var(--ui-text-muted)`, `var(--ui-border)`, `var(--ui-success)`, `var(--ui-warning)`, `var(--ui-error)`, etc.

**Business Tokens:** `var(--ui-stock-healthy)`, `var(--ui-stock-low)`, `var(--ui-stock-critical)`, `var(--ui-status-pending)`, `var(--ui-status-approved)`, etc.

**Utility Classes:** `card-elevated`, `badge-primary`, `badge-stock-healthy`, `badge-pending`, `form-label`, `form-input`, `focus-ring`

**Nuxt UI Components:** Use semantic names: `color="primary"`, `color="secondary"`, `color="success"`, `color="error"` (NOT `color="navy"`)

**Critical Rules:**
- ✅ Use semantic tokens `var(--ui-*)` or utility classes
- ✅ Nuxt UI: `<UButton color="primary">` (semantic names only)
- ❌ Never inline hex: `style="color: #000046"`
- ❌ Never custom names in Nuxt UI: `color="navy"`
- ❌ Tailwind v4: Cannot `@apply` custom classes, only built-in utilities

**Quick Ref:** Page: `bg-[var(--ui-bg)]`, Card: `bg-[var(--ui-bg-elevated)] border-[var(--ui-border)]`, Button: `<UButton color="primary">`, Badge: `<span class="badge-stock-healthy">`

## Common Pitfalls to Avoid

1. **Never allow negative stock** - Validate before every issue/transfer
2. **Never modify closed periods** - Check period.status before mutations
3. **Never skip location context** - All transactions must have locationId
4. **Never change WAC on issues** - Only deliveries recalculate WAC
5. **Never use db:push in production** - Always use migrations
6. **Never bypass approvals** - PRF/PO, Transfers, Period Close need proper workflow
7. **Never forget audit trail** - Log who/when/what for all mutations
8. **Never expose Supabase service key** - Server-only, never in client code
9. **Never use inline color styles** - Always use Tailwind color tokens (text-navy-500, bg-emerald-400) or Nuxt UI semantic color props (color="primary", color="secondary") instead of style="color: #000046"
10. **Never use @apply with custom classes** - Tailwind CSS v4 only allows @apply with built-in utilities. Use direct CSS properties for custom classes instead.

## Performance Considerations

- **Pagination:** Default 50 items per page, max 200
- **Response time SLAs:** Single location ops < 1s, cross-location < 2s, reports < 5s
- **Database indexes:** Already defined in schema for location/period/item queries
- **Caching:** Location and Item master data cached client-side; invalidate on updates
- **Batch operations:** Group multi-line deliveries/issues into single transaction

## MVP Scope Reminder

**In Scope:**

- Multi-location stock management
- Deliveries, Issues, Transfers
- Automatic price variance detection
- Period-end reconciliations
- Coordinated period close
- PWA (installable, offline-aware)

**Out of Scope (Post-MVP):**

- Full offline mode with local database
- Mobile native apps
- Advanced forecasting
- Barcode scanning
- Email notifications (except critical)
- Multi-currency
- FIFO costing option
