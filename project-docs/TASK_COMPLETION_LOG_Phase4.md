# Task Completion Log - Phase 4

## 4.6.1 Deployment Setup

**Completed:** 2025-12-29

---

### Overview

This task involved preparing the Stock Management System for production deployment on Vercel with Supabase database. The deployment process revealed several configuration issues that were systematically debugged and resolved.

---

### Part 1: Prisma Client Bundling Issue

**Problem:** The production build was bundling `@prisma/client` into the client-side JavaScript bundle. This caused errors because Prisma contains Node.js-specific code that cannot run in the browser.

**Root Cause Analysis:**

- Client-side files (components, pages, stores, composables) were importing types directly from `@prisma/client`
- Vite's bundler was following these imports and including Prisma's runtime code in the client bundle
- This resulted in Node.js-specific modules being included where they don't belong

**Solution - Client-Safe Type Definitions:**

Created `shared/types/database.ts` with type definitions that mirror Prisma's generated types but are safe to use in client-side code:

```typescript
// shared/types/database.ts
export type UserRole = "OPERATOR" | "SUPERVISOR" | "ADMIN";
export type LocationType = "KITCHEN" | "STORE" | "CENTRAL" | "WAREHOUSE";
export type PeriodStatus = "DRAFT" | "OPEN" | "PENDING_CLOSE" | "APPROVED" | "CLOSED";
// ... all enums and interfaces
```

**Files Modified (21 total):**

Updated all client-side files to import from the new shared types instead of `@prisma/client`:

- `app/types.d.ts`
- `app/middleware/role.ts`
- `app/composables/useCurrentPeriod.ts`
- `app/composables/useLocations.ts`
- `app/stores/location.ts`
- `app/stores/period.ts`
- `app/components/user/UserCard.vue`
- `app/pages/index.vue`
- `app/pages/stock-now.vue`
- `app/pages/items/index.vue`
- `app/pages/items/[id]/index.vue`
- `app/pages/locations/index.vue`
- `app/pages/locations/[id]/edit.vue`
- `app/pages/periods/[id].vue`
- `app/pages/reports/deliveries.vue`
- `app/pages/reports/issues.vue`
- `app/pages/reports/reconciliation.vue`
- `app/pages/users/index.vue`
- `app/pages/users/create.vue`
- `app/pages/users/[id]/index.vue`
- `app/pages/users/[id]/edit.vue`

**Example Change:**

```typescript
// Before (causes bundling issue)
import type { UserRole, LocationType } from "@prisma/client";

// After (client-safe)
import type { UserRole, LocationType } from "~~/shared/types/database";
```

**Nitro Configuration Added:**

Added custom Rollup plugin to `nuxt.config.ts` for handling Prisma's internal `.prisma` module:

```typescript
nitro: {
  preset: process.env.VERCEL ? "vercel" : undefined,
  moduleSideEffects: ["@prisma/client"],
  rollupConfig: {
    plugins: [
      {
        name: "prisma-resolver",
        resolveId(source: string) {
          if (source.startsWith(".prisma")) {
            return { id: source, external: true };
          }
          return null;
        },
      },
    ],
  },
},
```

---

### Part 2: Deployment Configuration Files

Created the following configuration files:

**1. `vercel.json` - Vercel Deployment Configuration:**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install",
  "framework": "nuxtjs",
  "regions": ["fra1"],
  "headers": [...]
}
```

- Configured pnpm as the package manager
- Set region to Frankfurt (fra1) - closest to Saudi Arabia
- Added security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- Disabled caching for API routes

**2. `.env.example` - Environment Variables Template:**

Comprehensive template documenting all required environment variables with clear descriptions:

- Database configuration (DATABASE_URL, DIRECT_URL)
- Supabase configuration (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY)
- Authentication (AUTH_SECRET, NUXT_SESSION_PASSWORD)
- Application (NUXT_PUBLIC_SITE_URL, NUXT_PUBLIC_CURRENCY)

**3. `project-docs/VERCEL_DEPLOYMENT_GUIDE.md`:**

Step-by-step deployment guide covering:

- Vercel project creation
- GitHub repository linking
- Environment variable configuration
- Database migration
- Custom domain setup
- Troubleshooting common issues

---

### Part 3: Deployment Troubleshooting

After initial deployment to Vercel, the application showed a blank page with JavaScript errors. Through systematic debugging using Playwright and Vercel MCP tools, four distinct issues were identified and resolved:

#### Issue 1: Package Manager Mismatch

**Problem:** Vercel was using `npm install` instead of `pnpm install`, causing different module resolution and runtime errors ("Cannot access 'at' before initialization").

**Fix:** Added `packageManager` field to `package.json`:

```json
"packageManager": "pnpm@10.20.0"
```

#### Issue 2: Prisma Build Scripts Blocked

**Problem:** pnpm 10.x security feature blocks postinstall scripts by default. Prisma's `postinstall` script (which runs `prisma generate`) was being skipped, resulting in missing Prisma client and 500 errors on API routes.

**Fix:** Added `pnpm.onlyBuiltDependencies` configuration to `package.json`:

```json
"pnpm": {
  "onlyBuiltDependencies": [
    "@prisma/client",
    "@prisma/engines",
    "prisma",
    "bcrypt",
    "sharp",
    "esbuild"
  ]
}
```

Also added explicit `prisma generate` to the build command as a safety measure:

```json
"build": "prisma generate && nuxt build"
```

#### Issue 3: Tailwind CSS Resolution Failure

**Problem:** The CSS file imports `@import "tailwindcss"` (Tailwind CSS v4 syntax) but Tailwind CSS was only a transitive dependency through `@nuxt/ui`. On Vercel's clean install, the module couldn't be resolved.

**Fix:** Added `tailwindcss` as a direct dependency in `package.json`:

```json
"tailwindcss": "^4.1.8"
```

#### Issue 4: Circular Dependency from Manual Chunks

**Problem:** The Vite `manualChunks` configuration in `nuxt.config.ts` was causing module initialization order issues, resulting in "Cannot access 'we' before initialization" errors in the browser.

**Fix:** Removed the `manualChunks` configuration from `nuxt.config.ts`:

```typescript
// Before (removed):
vite: {
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@nuxt/ui")) return "vendor-ui";
            if (id.includes("vue") || id.includes("@vue")) return "vendor-vue";
            if (id.includes("pinia")) return "vendor-pinia";
            return "vendor";
          }
        },
      },
    },
  },
},

// After:
vite: {
  build: {
    chunkSizeWarningLimit: 500,
    // Note: Manual chunk splitting removed as it can cause circular dependency issues on Vercel
  },
},
```

---

### Summary of All Changes

#### Files Created:

| File                                      | Description                              |
| ----------------------------------------- | ---------------------------------------- |
| `vercel.json`                             | Vercel deployment configuration          |
| `.env.example`                            | Environment variables template           |
| `project-docs/VERCEL_DEPLOYMENT_GUIDE.md` | Full deployment guide                    |
| `shared/types/database.ts`                | Client-safe type definitions (343 lines) |

#### Files Modified:

| File                 | Changes                                                                         |
| -------------------- | ------------------------------------------------------------------------------- |
| `package.json`       | Added packageManager, pnpm config, tailwindcss dependency, updated build script |
| `nuxt.config.ts`     | Removed manualChunks, added Nitro preset, added Prisma resolver plugin          |
| 21 client-side files | Changed imports from `@prisma/client` to `~~/shared/types/database`             |

---

### Result

The application is now successfully deployed and fully functional at:

- **Production URL:** https://stock-management-system-opal.vercel.app/
- **Region:** Frankfurt (fra1) - closest to Saudi Arabia
- **Framework:** Nuxt 4 with Vercel serverless functions
- **Database:** Supabase PostgreSQL via Transaction mode pooler

---

### Lessons Learned

1. **Prisma + Client-Side Code:** Never import from `@prisma/client` in client-side code. Create shared type definitions that mirror Prisma types.

2. **pnpm 10.x Security:** pnpm 10.x blocks postinstall scripts by default. Use `onlyBuiltDependencies` to whitelist packages that need to run build scripts.

3. **Vercel Package Manager:** Always specify `packageManager` field in `package.json` to ensure Vercel uses the correct package manager.

4. **Transitive Dependencies:** If your code directly imports a module, add it as a direct dependency even if it's available transitively.

5. **Manual Chunk Splitting:** Avoid custom `manualChunks` configuration unless absolutely necessary - it can cause circular dependency issues that are hard to debug.

---

## Developer Guide: Issues (Stock Deductions) Section

**Completed:** 2026-01-12

---

### Overview

Added a comprehensive new section to the Developer Guide covering Issues (Stock Deductions) - the 10th section in the guide. This section explains the complete end-to-end flow of issuing stock from inventory, including the Issue model structure, cost centre tracking, WAC capture at issue time, stock validation to prevent negative inventory, and the posting flow.

---

### Files Created

| File                                       | Description                               |
| ------------------------------------------ | ----------------------------------------- |
| `app/components/developer/IssuesGuide.vue` | New Developer Guide component (545 lines) |

---

### Files Modified

| File                                          | Changes                                                                     |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| `app/components/developer/DevGuideDrawer.vue` | Added navigation entry, component mapping, and 9 searchable content entries |
| `project-docs/DEVELOPER_GUIDE_TOPICS.md`      | Marked Issues section as completed, updated summary table                   |

---

### Topics Covered in the New Section

The IssuesGuide.vue component covers these key topics with code examples, diagrams, and business rules:

1. **Issue Model & IssueLine** - Prisma schema definitions, key fields, auto-generated issue numbers (ISS-YYYY-NNN)

2. **Cost Centre Tracking** - FOOD, CLEAN, OTHER categories for consumption analysis and reporting

3. **WAC at Issue Capture** - Why and how WAC is captured at issue time (not recalculated like deliveries)

4. **Stock Validation (No Negative)** - Critical business rule with validation function that checks all items before processing any

5. **Issue Posting Flow** - Complete data flow diagram and posting steps in an atomic transaction

6. **Stock Update Pattern** - How issues decrement stock vs. how deliveries increment (key difference: WAC unchanged)

7. **API & Frontend** - Recommended composable patterns, form components, error codes, cache invalidation

8. **Reconciliation Impact** - How issues fit into the period-end reconciliation formula

9. **Business Rules Summary** - All critical rules consolidated

---

### Search Index Entries Added

Nine new searchable entries were added to DevGuideDrawer.vue for the Issues section:

- Issue Model
- Cost Centre Tracking
- WAC at Issue Capture
- Stock Validation (No Negative)
- Issue Posting Flow
- Stock Update Pattern
- API & Frontend
- Reconciliation Impact
- Business Rules Summary

---

### Developer Guide Progress

With this addition, the Developer Guide now has **10 implemented sections** covering:

1. Getting Started
2. Architecture Overview
3. Database Guide
4. Authentication Guide
5. State Management (Pinia)
6. Caching System
7. Multi-Location System
8. Period Management
9. Deliveries & WAC
10. **Issues (Stock Deductions)** ← NEW

**15 topics remaining** to comprehensively cover all development aspects.

---

## PRF/PO Workflow - Phase 8: User Story 6 - Procurement Specialist Access Control

**Completed:** 2026-01-19

---

### Overview

This task implemented role-based access control for the PROCUREMENT_SPECIALIST role, ensuring they have limited access to only the pages and API endpoints relevant to their responsibilities (managing Purchase Orders and viewing deliveries).

---

### Implementation Summary

**Files Modified:**

1. **`app/composables/usePermissions.ts`** - Added new permission functions restricting PROCUREMENT_SPECIALIST from:
   - Posting issues (`canPostIssues`)
   - Creating transfers (`canCreateTransfer`)
   - Viewing reconciliations (`canViewReconciliations`)
   - Entering POB data (`canEnterPOB`)
   - Creating NCRs (`canCreateNCR`)
   - Viewing stock (`canViewStock`)
   - Added new functions: `canViewDeliveries`, `canViewItems`, `canViewReportsPage`

2. **`app/layouts/default.vue`** - Updated navigation to use new permission functions for menu visibility

3. **`app/middleware/auth.global.ts`** - Added client-side route guards blocking PROCUREMENT_SPECIALIST from restricted pages (Items, Issues, Transfers, Reconciliations, POB, NCRs, Stock Now, Reports, Periods, Period Close, Locations, Suppliers, Users)

4. **`server/middleware/role-access.ts`** - NEW FILE - Server-side middleware enforcing API endpoint access restrictions for PROCUREMENT_SPECIALIST

5. **`app/pages/users/create.vue`** and **`app/pages/users/[id]/edit.vue`** - Added PROCUREMENT_SPECIALIST to role dropdown options

---

### Key Features

- **Navigation Restrictions**: PROCUREMENT_SPECIALIST users only see Dashboard, Orders, and Deliveries (view only) in the navigation menu
- **Client-Side Guards**: Route middleware prevents direct URL navigation to restricted pages
- **Server-Side Enforcement**: API middleware blocks unauthorized API requests with proper 403 responses
- **Role Dropdown**: Admins can now create and manage PROCUREMENT_SPECIALIST users through the UI

---

### Testing Notes

The implementation was verified through:

- TypeScript type checking passed
- Code formatting verified with Prettier
- Server middleware properly configured to reject unauthorized requests
