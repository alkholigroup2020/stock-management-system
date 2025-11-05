# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Food Stock Control System** - A multi-location food inventory management system built with **Nuxt 4**. Replaces Excel-based workflows with a modern web application featuring real-time stock tracking, inter-location transfers, weighted average costing (WAC), and coordinated period-end close across multiple sites.

**Framework Version:** This project uses **Nuxt 4** (not Nuxt 3). Always refer to Nuxt 4 documentation when implementing features or resolving issues.

## Development Best Practices

### Component Usage and Naming Conventions

**Nuxt 4 Component Auto-Import Rules:**

When creating components in subdirectories under `/app/components/`, Nuxt 4 uses a naming convention that combines the folder path with the component name:

- **File location:** `app/components/layout/AppNavbar.vue`
- **Component reference:** `<LayoutAppNavbar />`

- **File location:** `app/components/delivery/LineItem.vue`
- **Component reference:** `<DeliveryLineItem />`

- **File location:** `app/components/common/DataTable.vue`
- **Component reference:** `<CommonDataTable />`

**Rules:**
1. Each folder name becomes a PascalCase prefix
2. The component filename becomes the suffix
3. Nested folders create longer prefixes: `app/components/ui/form/Input.vue` → `<UiFormInput />`
4. Components in the root `/app/components/` folder don't need a prefix: `app/components/Footer.vue` → `<Footer />`

**Example:**
```vue
<!-- ❌ INCORRECT - Will not work -->
<AppNavbar />

<!-- ✅ CORRECT - Follows Nuxt 4 auto-import naming -->
<LayoutAppNavbar />
```

### Always Check Official Documentation First

**CRITICAL:** Before implementing any feature using a library, tool, or framework component, **always check the official documentation online first**. This practice:

- Reduces trial-and-error time significantly
- Ensures you're using the correct API and syntax
- Prevents bugs from outdated or incorrect usage patterns
- Helps you discover built-in features you might not know about

**Examples:**

✅ **CORRECT Workflow:**
1. Need to use Nuxt UI Toast component
2. Search: "Nuxt UI Toast documentation"
3. Read the official usage guide at [https://ui.nuxt.com](https://ui.nuxt.com)
4. Implement according to the documentation
5. Test and verify

❌ **INCORRECT Workflow:**
1. Need to use Nuxt UI Toast component
2. Guess the API based on similar libraries
3. Try different approaches until something works
4. End up with non-standard or buggy implementation

**Resources to Check:**

- **Nuxt 4:** [https://nuxt.com/docs](https://nuxt.com/docs)
- **Nuxt UI:** [https://ui.nuxt.com](https://ui.nuxt.com)
- **Tailwind CSS:** [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Prisma:** [https://www.prisma.io/docs](https://www.prisma.io/docs)
- **Pinia:** [https://pinia.vuejs.org](https://pinia.vuejs.org)
- **Vue 3:** [https://vuejs.org/guide](https://vuejs.org/guide)

**When to Check Documentation:**
- Before using any new UI component (UButton, UCard, UModal, UToast, etc.)
- Before implementing composables (useColorMode, useFetch, useState, etc.)
- Before using framework features (auto-imports, routing, middleware, etc.)
- When encountering unexpected behavior or errors
- When upgrading dependencies

**Key Business Concepts:**

- **Multi-location:** Support for Kitchen, Store, Central, and Warehouse locations with independent stock levels
- **WAC Costing:** Weighted Average Cost calculated per location, updated on deliveries
- **Period Management:** Monthly accounting periods with coordinated close across all locations
- **Price Variance Detection:** Automatic NCR generation when delivery prices differ from locked period prices
- **Approval Workflows:** PRF/PO and Transfers require Supervisor approval; Period Close requires Admin approval

## Development Commands

**Package Manager:** pnpm (required, not npm or yarn)

```bash
# Install dependencies
pnpm install

# Development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Database operations (not yet configured - will be added later)
# pnpm db:push          # Push schema changes to database
# pnpm db:migrate       # Create and apply migrations
# pnpm db:studio        # Open Prisma Studio GUI

# Testing (not yet configured - will be added later)
# pnpm test             # Run all tests
# pnpm test:unit        # Run unit tests only
# pnpm test:api         # Run API tests only
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

**Nuxt 4 uses an `/app/` directory for all frontend code:**

```
/app/                     # Frontend application code
  /assets/                # Static assets (CSS, images, fonts)
    /css/                 # Global styles
      main.css            # Tailwind CSS v4 theme configuration

  /components/            # Vue components (auto-imported)
    /delivery/            # Delivery-related components
    /issue/               # Issue-related components
    /common/              # Shared components
    /layout/              # Layout components

  /composables/           # Vue composables (auto-imported)
    useApi.ts             # API fetch wrapper
    useAuth.ts            # Authentication state
    useOnlineStatus.ts    # PWA offline detection

  /layouts/               # Layout templates
    default.vue           # Default layout

  /middleware/            # Client-side route middleware
    auth.ts               # Client auth guard

  /pages/                 # Nuxt pages (auto-routing)
    index.vue             # Dashboard
    /deliveries/          # Delivery screens
    /issues/              # Issue screens
    /transfers/           # Transfer screens
    stock-now.vue         # Real-time stock view
    reconciliations.vue   # Period reconciliation
    period-close.vue      # Period close workflow

  /plugins/               # Vue plugins
    pinia.ts              # Pinia store initialization

  /stores/                # Pinia stores
    auth.ts               # User session
    period.ts             # Current period state
    ui.ts                 # Global UI state

  /utils/                 # Utility functions
    formatting.ts         # Date, currency formatters
    validation.ts         # Client-side validation

  app.vue                 # Root app component
  app.config.ts           # App-level configuration

/server/                  # Backend server code
  /api/                   # API endpoints (RESTful routes)
    /locations/           # Location management
    /deliveries/          # Delivery posting
    /issues/              # Issue posting
    /transfers/           # Inter-location transfers
    /periods/             # Period management
    /auth/                # Authentication

  /middleware/            # Server-side middleware
    auth.ts               # Authentication check
    location-access.ts    # Location-based access control

  /utils/                 # Server utilities
    wac.ts                # WAC calculation functions
    validation.ts         # Zod schemas for API validation

/shared/                  # Shared code (frontend + backend)
  /types/                 # TypeScript types
    api.ts                # API request/response types
    database.ts           # Re-exported Prisma types
    business.ts           # Business logic types

/prisma/                  # Database (not yet configured)
  schema.prisma           # Prisma schema
  /migrations/            # Migration history

/public/                  # Static files (served as-is)
  favicon.ico             # App icon
  manifest.json           # PWA manifest

/project-docs/            # Project documentation
  PRD.md                  # Product requirements
  MVP_DEVELOPMENT_TASKS.md # Task checklist
  ...                     # Other docs
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

### WAC Calculation Flow

```
1. Delivery Posted → DeliveryLine created with actual price
2. Check: actual price != period price? → Create NCR (auto)
3. Update LocationStock:
   newWAC = (currentQty × currentWAC + receivedQty × receiptPrice) / (currentQty + receivedQty)
   newOnHand = currentQty + receivedQty
4. Issue Posted → Deduct at current WAC (doesn't change WAC)
```

### Transfer Flow

```
1. Transfer created (status: DRAFT)
2. Submitted → PENDING_APPROVAL
3. Supervisor approves → APPROVED
4. System executes atomically:
   - Deduct from source location at source WAC
   - Add to destination location at same WAC
   - Status → COMPLETED
```

### Period Close Flow

```
1. Each location marks ready independently (PeriodLocation.status = READY)
2. All locations must be ready before close
3. Admin approves (Approval.entity_type = PERIOD_CLOSE)
4. System closes all locations simultaneously:
   - Create snapshots per location
   - Lock period (status = CLOSED)
   - Roll opening_stock to next period
```

## API Design Patterns

### Error Handling (H3 Format)

```typescript
// Use createError for consistent responses
throw createError({
  statusCode: 400,
  statusMessage: "Insufficient Stock",
  data: {
    code: "INSUFFICIENT_STOCK",
    message: "Cannot issue 100 KG. Only 75 KG available.",
    details: { item, requested, available, location },
  },
});
```

### Standard Error Codes

- `INSUFFICIENT_STOCK` - Not enough stock for issue/transfer
- `LOCATION_ACCESS_DENIED` - User lacks location access
- `PERIOD_CLOSED` - Cannot post to closed period
- `VALIDATION_ERROR` - Zod validation failed
- `PRICE_VARIANCE` - Price differs from period (informational, NCR auto-created)

### Authentication Pattern

All `/api/*` routes automatically protected via server middleware:

```typescript
// server/middleware/auth.ts ensures session exists
// Access via: event.context.user
const user = event.context.user; // { id, role, locations[] }
```

### Location Access Pattern

```typescript
// server/middleware/location-access.ts
// Validates user has access to location in route param
const locationId = getRouterParam(event, "locationId");
if (!hasLocationAccess(user, locationId)) {
  throw createError({ statusCode: 403 });
}
```

## Business Logic Critical Rules

### No Negative Stock (Enforced Everywhere)

```typescript
// Before any issue or transfer, check:
if (requestedQty > locationStock.onHand) {
  throw createError({
    statusCode: 400,
    data: { code: 'INSUFFICIENT_STOCK', ... }
  })
}
```

### Period State Validation

```typescript
// All posts must check:
if (period.status !== "OPEN") {
  throw createError({
    statusCode: 400,
    data: { code: "PERIOD_CLOSED" },
  });
}
```

### Audit Trail Requirements

Every mutation must log:

- `userId` (who)
- `timestamp` (when)
- `action` (what - CREATE_DELIVERY, POST_ISSUE, etc.)
- `locationId` (where)
- Changes via Prisma middleware or manual logging

## PWA Implementation

### Offline Behavior

- **Level 1 PWA:** Installable, offline-aware UI, but data operations require connection
- **Offline detection:** Use `useOnlineStatus()` composable
- **UI pattern:** Show banner when offline, disable action buttons, show clear messages

```vue
<script setup>
const { isOnline } = useOnlineStatus();
</script>

<template>
  <UButton :disabled="!isOnline" @click="postDelivery"> Post Delivery </UButton>
</template>
```

### Service Worker Strategy

- Static assets cached automatically via Vite PWA
- No offline data storage in MVP (IndexedDB deferred to post-MVP)
- Navigation fallback to `/` for PWA shell

## Testing Strategy

**Note:** Testing framework is not yet configured. The following is the planned testing strategy for future implementation.

### Unit Tests (Vitest) - Planned

Focus on pure business logic:

- WAC calculation functions (critical)
- Reconciliation math
- Validation utilities
- Location: `/tests/unit/`

### API Tests (Vitest + h3) - Planned

Test critical server routes:

- POST /api/deliveries (with price variance)
- POST /api/issues (negative stock prevention)
- POST /api/transfers (approval workflow)
- POST /api/periods/close (multi-location coordination)
- Location: `/tests/api/`

### Manual Testing Checklist

For now, use manual testing for:

- Cross-location transfers
- Price variance NCR auto-creation
- Period close with multiple locations
- PWA installation (desktop + mobile)
- Offline banner behavior

## Database Migrations

**Note:** Prisma and database are not yet configured. The following is the planned database migration strategy for future implementation.

### Development Workflow - Planned

```bash
# Make schema changes in prisma/schema.prisma
# Push to dev database (prototyping)
pnpm db:push

# Create migration (production path)
pnpm db:migrate dev --create-only
# Review generated SQL
pnpm db:migrate dev
```

### Production Migrations - Planned

```bash
# Never use db:push in production
# Always use migrations for traceability
pnpm db:migrate deploy
```

## Role-Based Access Control

### Role Hierarchy

- **Operator:** Post deliveries/issues, view stock (assigned locations only)
- **Supervisor:** Approve transfers/PRF, manage reconciliations (all locations)
- **Admin:** Manage items/prices, close periods, system config (all locations)

### Permission Checks

```typescript
// In server routes, check role:
if (user.role !== "ADMIN") {
  throw createError({ statusCode: 403 });
}

// For location-specific operations:
const hasAccess = user.locations.some(
  (loc) => loc.id === locationId && loc.access !== "VIEW"
);
```

## Deployment

### Vercel Configuration

- Auto-deploys on push to `main` branch
- Preview deployments on pull requests
- Environment variables set in Vercel dashboard
- No vercel.json needed; Nuxt handles serverless functions

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]

# Supabase
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_KEY=[service-key]

# Auth
AUTH_SECRET=[generated-secret]
AUTH_ORIGIN=https://[your-domain].vercel.app

# App Config
NUXT_PUBLIC_SITE_URL=https://[your-domain].vercel.app
NUXT_PUBLIC_CURRENCY=SAR
```

## Development Workflow

### Feature Development Pattern

1. Create feature branch from `main`
2. Implement in this order:
   - Database schema (Prisma) - *when database is configured*
   - API route (/server/api/) - *when backend is implemented*
   - Composable (if needed)
   - Page/component
   - Tests - *when testing is configured*
3. Test locally with `pnpm dev`
4. Push → Vercel creates preview deployment
5. Merge to `main` → auto-deploys to production

**Current Focus:** For now, focus on frontend components and pages. Database, API routes, and tests will be added later.

### Database Schema Changes - Planned

**Note:** This will be applicable once Prisma is configured.

1. Modify `prisma/schema.prisma`
2. Run `pnpm db:push` (dev) or `pnpm db:migrate dev` (production path)
3. Prisma generates updated client types automatically
4. Use generated types in code (no manual type creation needed)

### API Route Creation - Planned

**Note:** This will be applicable once backend API routes are implemented.

```typescript
// server/api/locations/[locationId]/stock.get.ts
export default defineEventHandler(async (event) => {
  // Auth check happens in middleware
  const user = event.context.user;
  const locationId = getRouterParam(event, "locationId");

  // Validate location access
  if (!hasLocationAccess(user, locationId)) {
    throw createError({ statusCode: 403 });
  }

  // Use Prisma for queries
  const stock = await prisma.locationStock.findMany({
    where: { locationId },
    include: { item: true },
  });

  return { stock };
});
```

## Key Documentation Files

Comprehensive project documentation in `/project-docs/`:

- **PRD.md:** Product requirements, user stories, acceptance criteria
- **MVP.md:** MVP scope, development slices, timeline
- **MVP_DEVELOPMENT_TASKS.md:** Detailed checklist of all development tasks
- **TASK_COMPLETION_LOG.md:** Progress log of completed tasks (update after each main task)
- **System_Design.md:** Architecture, workflows, state machines, ERD
- **API_Contract.md:** Complete API specification with examples
- **Entities_ERD.md:** Database schema, relationships, constraints
- **development_stack.md:** Tech stack decisions, tooling, configuration
- **Workflow_Guide.md:** User workflows, business processes
- **Roles_Permissions.md:** RBAC matrix
- **pwa-implementation-guide.md:** PWA setup steps

Always reference these documents when implementing features to ensure alignment with business requirements.

### Task Completion Logging

**IMPORTANT:** After completing each main task from MVP_DEVELOPMENT_TASKS.md, update the TASK_COMPLETION_LOG.md file:

1. Add a new entry with the task number and completion date
2. Write 1-2 concise paragraphs summarizing what was accomplished
3. Keep it brief - focus on key deliverables and outcomes only
4. Update the "Next" line at the bottom to show the upcoming task

This log provides a quick reference of development progress without needing to review the full task checklist.

## Currency and Localization

- **Currency:** SAR (Saudi Riyal) - always display as "SAR 1,234.56"
- **Decimal places:** 2 for currency, up to 4 for quantities
- **Date format:** DD/MM/YYYY (display), ISO 8601 (API)
- **Timezone:** Asia/Riyadh
- **Language:** English (MVP), Arabic support planned
- **Units:** KG (Kilograms), EA (Each), LTR (Liters), BOX, CASE, PACK

## Theme Colors and Styling

### Design System Overview

The Food Stock Control System uses a comprehensive design system with **semantic color tokens** that map to business logic. All colors are defined in `app/assets/css/main.css` using Tailwind CSS v4's `@theme` directive and CSS variables.

**Philosophy:**
- **Navy Blue** (#000046) = Brand, primary actions, trust, pending states
- **Emerald Green** (#45cf7b) = Success, approvals, healthy stock, positive states
- **Amber** = Warnings, low stock, price variance, attention needed
- **Red** = Errors, critical stock, rejections, dangerous actions
- **Blue** = Informational messages
- **Zinc** (Gray) = Neutral UI, text, borders, disabled states

### Color Palettes

All color palettes available in shades `50`-`950`:

| Palette | Purpose | Key Shades |
|---------|---------|------------|
| `navy` | Brand primary | 500 (#000046) for light mode, 400 for dark mode |
| `emerald` | Success/secondary | 600 for light mode, 500 for dark mode |
| `zinc` | Neutral/text | 900 (text), 300 (borders), 100 (backgrounds) |
| `amber` | Warnings | 500 for light mode, 400 for dark mode |
| `red` | Errors/critical | 600 for light mode, 500 for dark mode |
| `blue` | Info | 600 for light mode, 500 for dark mode |

**Usage in Tailwind classes:**
```vue
<div class="text-navy-500 bg-emerald-50 border-zinc-300">
  <span class="text-amber-600 dark:text-amber-400">Warning</span>
</div>
```

### Semantic Color Tokens

**IMPORTANT:** Always prefer semantic tokens over direct color references for consistency and maintainability.

#### Background Tokens

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--ui-bg` | zinc-50 | zinc-950 | Page background |
| `--ui-bg-elevated` | white | zinc-900 | Cards, modals, elevated surfaces |
| `--ui-bg-muted` | zinc-100 | zinc-800 | Subtle backgrounds, disabled states |
| `--ui-bg-accented` | navy-50 | navy-950 | Highlighted sections |
| `--ui-bg-inverted` | zinc-900 | zinc-50 | Dark surfaces in light mode, light in dark |

**Usage:**
```vue
<div class="bg-[var(--ui-bg-elevated)] border-[var(--ui-border)]">
  <div class="bg-[var(--ui-bg-muted)]">Subtle section</div>
</div>
```

#### Text Tokens

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--ui-text` | zinc-900 | zinc-100 | Primary text |
| `--ui-text-muted` | zinc-600 | zinc-400 | Secondary/helper text |
| `--ui-text-dimmed` | zinc-400 | zinc-600 | Disabled/inactive text |
| `--ui-text-highlighted` | navy-700 | navy-300 | Important/emphasized text |
| `--ui-text-inverted` | white | zinc-900 | Text on inverted backgrounds |

**Usage:**
```vue
<h1 class="text-[var(--ui-text-highlighted)]">Title</h1>
<p class="text-[var(--ui-text-muted)]">Helper text</p>
```

#### Border Tokens

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--ui-border` | zinc-300 | zinc-700 | Default borders |
| `--ui-border-muted` | zinc-200 | zinc-800 | Subtle dividers |
| `--ui-border-accented` | navy-300 | navy-700 | Emphasized borders |

#### Interactive State Tokens

| Token | Purpose |
|-------|---------|
| `--ui-primary-hover` | Primary button/link hover state |
| `--ui-primary-active` | Primary button/link pressed state |
| `--ui-primary-contrast` | Text color on primary backgrounds (white in light, black in dark) |
| `--ui-bg-hover` | Background hover state |
| `--ui-bg-active` | Background pressed state |
| `--ui-ring` | Focus ring color |
| `--ui-focus` | Focus indicator color |

#### Feedback Tokens

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--ui-success` | emerald-600 | emerald-500 | Success messages, approvals |
| `--ui-warning` | amber-500 | amber-400 | Warnings, alerts |
| `--ui-error` | red-600 | red-500 | Errors, critical issues |
| `--ui-info` | blue-600 | blue-500 | Informational messages |

### Business-Specific Tokens

**Stock Status:**

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--ui-stock-healthy` | emerald-600 | emerald-500 | Normal stock levels |
| `--ui-stock-low` | amber-500 | amber-400 | Below minimum threshold |
| `--ui-stock-critical` | red-600 | red-500 | Out of stock, urgent |
| `--ui-stock-pending` | navy-500 | navy-400 | Stock in transfer |

**Approval Workflow:**

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--ui-status-draft` | zinc-500 | zinc-400 | Draft/unsaved state |
| `--ui-status-pending` | navy-500 | navy-400 | Awaiting approval |
| `--ui-status-approved` | emerald-600 | emerald-500 | Approved/completed |
| `--ui-status-rejected` | red-600 | red-500 | Rejected/failed |

**Period States:**

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--ui-period-open` | emerald-600 | emerald-500 | Period accepting transactions |
| `--ui-period-ready` | navy-500 | navy-400 | Location ready for close |
| `--ui-period-closed` | zinc-500 | zinc-400 | Period locked |

**Price Variance:**

| Token | Usage |
|-------|-------|
| `--ui-variance-detected` | Price differs from expected (amber) |

**Examples:**
```vue
<!-- Stock status badge -->
<span :style="{ backgroundColor: 'var(--ui-stock-healthy)', color: 'white' }">
  Healthy
</span>

<!-- Approval status -->
<span :style="{ backgroundColor: 'var(--ui-status-pending)', color: 'white' }">
  Pending Approval
</span>
```

### Utility Classes

The design system provides pre-built utility classes for common patterns:

#### Surface/Card Classes

```vue
<!-- Elevated card with border and shadow -->
<div class="card-elevated">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>

<!-- Muted background card -->
<div class="card-muted">
  <p>Subtle card</p>
</div>

<!-- Inverted surface (dark in light mode) -->
<div class="surface-inverted">
  <p>Inverted content</p>
</div>
```

#### Form Classes

```vue
<label class="form-label">Item Name</label>
<input type="text" class="form-input" placeholder="Enter name" />
<span class="form-error">This field is required</span>
```

#### Badge Classes

**Standard Badges:**
```vue
<span class="badge-primary">Primary</span>
<span class="badge-success">Success</span>
<span class="badge-warning">Warning</span>
<span class="badge-error">Error</span>
<span class="badge-info">Info</span>
```

**Business-Specific Badges:**
```vue
<!-- Stock status -->
<span class="badge-stock-healthy">Healthy Stock</span>
<span class="badge-stock-low">Low Stock</span>
<span class="badge-stock-critical">Critical</span>
<span class="badge-stock-pending">In Transfer</span>

<!-- Approval workflow -->
<span class="badge-draft">Draft</span>
<span class="badge-pending">Pending</span>
<span class="badge-approved">Approved</span>
<span class="badge-rejected">Rejected</span>
```

#### Typography Classes

```vue
<h1 class="text-display">Display Heading</h1>
<h2 class="text-heading">Section Heading</h2>
<h3 class="text-subheading">Subheading</h3>
<p class="text-body">Body text</p>
<span class="text-label">Label</span>
<small class="text-caption">Caption text</small>
```

#### Interactive Classes

```vue
<!-- Focus ring -->
<button class="focus-ring">Focused Button</button>

<!-- Smooth transitions -->
<div class="smooth-transition hover:bg-gray-100">Hover me</div>

<!-- Hover lift effect -->
<div class="hover-lift">Lifts on hover</div>

<!-- Fade in animation -->
<div class="fade-in">Fades in</div>
```

### Nuxt UI Component Colors

**IMPORTANT:** Nuxt UI components use **semantic color names**, not custom color tokens.

Semantic colors are mapped to brand colors via CSS variables:
- `"primary"` → Navy blue (#000046) via `--ui-primary`
- `"secondary"` → Emerald green (#45cf7b) via `--ui-secondary`
- `"success"`, `"info"`, `"warning"`, `"error"`, `"neutral"` → Standard semantic colors

**Usage:**
```vue
<!-- ✅ CORRECT - Use semantic color names -->
<UButton color="primary">Primary Action</UButton>
<UButton color="secondary">Secondary Action</UButton>
<UButton color="success">Approve</UButton>
<UButton color="error">Reject</UButton>

<UBadge color="primary">Navy</UBadge>
<UBadge color="secondary">Emerald</UBadge>

<UAlert color="warning" title="Price Variance Detected" />

<!-- ❌ WRONG - Custom color tokens don't work -->
<UButton color="navy">Won't work</UButton>
<UButton color="emerald">Won't work</UButton>
```

### Color Usage Guidelines

**Do's:**
- ✅ Use semantic tokens (`var(--ui-bg-elevated)`) for custom components
- ✅ Use utility classes (`.badge-stock-healthy`) when available
- ✅ Use Tailwind color classes (`text-navy-500`) for direct color references
- ✅ Use semantic colors (`color="primary"`) for Nuxt UI components
- ✅ Support both light and dark modes

**Don'ts:**
- ❌ Never use inline styles with hex colors (`style="color: #000046"`)
- ❌ Never use custom color names in Nuxt UI props (`color="navy"`)
- ❌ Never hardcode colors that should adapt to dark mode
- ❌ Never mix color systems (pick tokens OR Tailwind classes, be consistent)

### Dark Mode Support

All components automatically support dark mode via the `.dark` class:

```vue
<template>
  <div class="bg-[var(--ui-bg)] text-[var(--ui-text)]">
    <!-- Automatically adapts to light/dark mode -->
    <div class="bg-[var(--ui-bg-elevated)] border-[var(--ui-border)]">
      <h1 class="text-[var(--ui-text-highlighted)]">Title</h1>
      <p class="text-[var(--ui-text-muted)]">Description</p>
    </div>
  </div>
</template>
```

**Or use Tailwind dark mode utilities:**
```vue
<div class="bg-white dark:bg-gray-900">
  <h1 class="text-navy-500 dark:text-navy-400">Title</h1>
  <p class="text-gray-600 dark:text-gray-400">Content</p>
</div>
```

### Accessibility

**Focus States:**
- All interactive elements have visible focus rings using `--ui-ring`
- Use the `.focus-ring` utility class for consistent focus styling

**Color Contrast:**
- All text/background combinations meet WCAG AA standards
- Token combinations are pre-validated for contrast

**Reduced Motion:**
- Animations respect `prefers-reduced-motion` media query
- Transitions are disabled for users who prefer reduced motion

### Tailwind CSS v4 Important Notes

**@apply Directive Limitation:**

Tailwind CSS v4 does NOT allow using `@apply` with custom class names. You can only use `@apply` with built-in Tailwind utilities.

```css
/* ❌ WRONG - Will cause build error */
.badge-base {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full;
}

.badge-primary {
  @apply badge-base; /* ERROR: Cannot apply unknown utility class */
  background-color: var(--ui-primary);
}

/* ✅ CORRECT - Use direct CSS properties */
.badge-primary {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 500;
  background-color: var(--ui-primary);
  color: var(--ui-primary-contrast);
}

/* ✅ ALSO CORRECT - @apply with built-in utilities only */
.card-elevated {
  @apply bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)];
  @apply rounded-lg shadow-sm hover:shadow-md;
  @apply transition-shadow duration-200;
}
```

### Quick Reference

**Page Background:** `bg-[var(--ui-bg)]`
**Card Background:** `bg-[var(--ui-bg-elevated)] border-[var(--ui-border)]`
**Primary Text:** `text-[var(--ui-text)]`
**Muted Text:** `text-[var(--ui-text-muted)]`
**Primary Button:** `<UButton color="primary">`
**Success Badge:** `<span class="badge-success">Success</span>`
**Stock Healthy:** `<span class="badge-stock-healthy">Healthy</span>`
**Approval Pending:** `<span class="badge-pending">Pending</span>`

For complete documentation, see `/project-docs/DESIGN_SYSTEM.md`

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
