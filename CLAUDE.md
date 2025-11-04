# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Food Stock Control System** - A multi-location food inventory management system built with **Nuxt 4**. Replaces Excel-based workflows with a modern web application featuring real-time stock tracking, inter-location transfers, weighted average costing (WAC), and coordinated period-end close across multiple sites.

**Framework Version:** This project uses **Nuxt 4** (not Nuxt 3). Always refer to Nuxt 4 documentation when implementing features or resolving issues.

## Development Best Practices

### Component Usage and Naming Conventions

**Nuxt 4 Component Auto-Import Rules:**

When creating components in subdirectories under `/components/`, Nuxt 4 uses a naming convention that combines the folder path with the component name:

- **File location:** `components/layout/AppNavbar.vue`
- **Component reference:** `<LayoutAppNavbar />`

- **File location:** `components/delivery/LineItem.vue`
- **Component reference:** `<DeliveryLineItem />`

- **File location:** `components/common/DataTable.vue`
- **Component reference:** `<CommonDataTable />`

**Rules:**
1. Each folder name becomes a PascalCase prefix
2. The component filename becomes the suffix
3. Nested folders create longer prefixes: `components/ui/form/Input.vue` → `<UiFormInput />`
4. Components in the root `/components/` folder don't need a prefix: `components/Footer.vue` → `<Footer />`

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

- Frontend: SPA pages in `/pages/`, components in `/components/`
- Backend: API routes in `/server/api/`, server middleware in `/server/middleware/`
- Shared: Types in `/types/`, composables in `/composables/`
- No separate backend service; all API routes are Nuxt server routes deployed as Vercel serverless functions

### Directory Structure Conventions

```
/server/api/          # API endpoints (RESTful routes)
  /locations/         # Location management
  /deliveries/        # Delivery posting
  /issues/            # Issue posting
  /transfers/         # Inter-location transfers
  /periods/           # Period management
  /auth/              # Authentication

/server/middleware/   # Server-side middleware
  auth.ts             # Authentication check
  location-access.ts  # Location-based access control

/server/utils/        # Server utilities
  wac.ts              # WAC calculation functions
  validation.ts       # Zod schemas for API validation

/composables/         # Vue composables
  useApi.ts           # API fetch wrapper
  useAuth.ts          # Authentication state
  useOnlineStatus.ts  # PWA offline detection

/stores/              # Pinia stores
  auth.ts             # User session
  period.ts           # Current period state
  ui.ts               # Global UI state

/components/          # Vue components
  /delivery/          # Delivery-related components
  /issue/             # Issue-related components
  /common/            # Shared components
  /layout/            # Layout components

/pages/               # Nuxt pages (auto-routing)
  index.vue           # Dashboard
  /deliveries/        # Delivery screens
  /issues/            # Issue screens
  /transfers/         # Transfer screens
  stock-now.vue       # Real-time stock view
  reconciliations.vue # Period reconciliation
  period-close.vue    # Period close workflow

/prisma/              # Database
  schema.prisma       # Prisma schema
  /migrations/        # Migration history

/types/               # TypeScript types
  api.ts              # API request/response types
  database.ts         # Re-exported Prisma types
  business.ts         # Business logic types
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

### Brand Colors

The application uses a custom color palette defined in `app/assets/css/main.css` using the `@theme` directive:

- **Primary Color (Navy Blue):** #000046
  - Token: `navy` (shades 50-950)
  - Used for primary brand elements, headings, primary buttons, important text

- **Secondary Color (Emerald Green):** #45cf7b
  - Token: `emerald` (shades 50-950)
  - Used for success states, secondary actions, accents

### Color Token Usage Rules

**CRITICAL:** Always use Tailwind color tokens, never inline styles with hardcoded hex colors.

✅ **CORRECT:**
```vue
<p class="text-navy-500">Total Locations</p>
<div class="bg-emerald-400">...</div>
<span class="text-navy-700 dark:text-navy-400">...</span>
```

❌ **INCORRECT:**
```vue
<p style="color: #000046">Total Locations</p>
<div style="background-color: #45cf7b">...</div>
```

### Available Color Shades

Both `navy` and `emerald` colors are available in the following shades:
- `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`, `950`

**Common Usage:**
- Text: `text-navy-500`, `text-emerald-400`
- Background: `bg-navy-500`, `bg-emerald-400`
- Borders: `border-navy-500`, `border-emerald-400`
- Dark mode variants: `dark:text-navy-400`, `dark:bg-emerald-500`

### Nuxt UI Component Colors

For Nuxt UI components, you can use color names directly:
- Use `navy` for primary brand color
- Use `emerald` for secondary/success color
- Use `neutral` (zinc) for neutral UI elements

Example:
```vue
<UButton color="navy">Primary Action</UButton>
<UButton color="emerald">Secondary Action</UButton>
<UButton color="neutral" variant="ghost">Neutral Action</UButton>
```

**Note:** The `app.config.ts` color mapping has no effect with Tailwind CSS v4's `@theme` directive. Colors are defined only in `main.css`.

### Theme Configuration Files

1. **app/assets/css/main.css** - Defines ALL custom color palettes using `@theme` directive (this is the only place where colors are configured)
2. **nuxt.config.ts** - Configures color mode (light/dark theme support)

**Important:** `app.config.ts` color configuration is NOT needed and has no effect when using Tailwind CSS v4's `@theme` directive.

### Dark Mode Support

All components should support both light and dark modes:
```vue
<div class="bg-white dark:bg-gray-900">
  <h1 class="text-navy-500 dark:text-navy-400">Title</h1>
  <p class="text-gray-600 dark:text-gray-400">Content</p>
</div>
```

Default mode is `light`, users can toggle between modes using the theme switcher in the navbar.

## Common Pitfalls to Avoid

1. **Never allow negative stock** - Validate before every issue/transfer
2. **Never modify closed periods** - Check period.status before mutations
3. **Never skip location context** - All transactions must have locationId
4. **Never change WAC on issues** - Only deliveries recalculate WAC
5. **Never use db:push in production** - Always use migrations
6. **Never bypass approvals** - PRF/PO, Transfers, Period Close need proper workflow
7. **Never forget audit trail** - Log who/when/what for all mutations
8. **Never expose Supabase service key** - Server-only, never in client code
9. **Never use inline color styles** - Always use Tailwind color tokens (text-navy-500, bg-emerald-400) instead of style="color: #000046"

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
