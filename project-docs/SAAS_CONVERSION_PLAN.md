# SaaS Conversion Plan: Tenant-Isolated Databases (Schema-per-Tenant + Dedicated Projects)

**Status:** Revised draft (validated against codebase; pricing validated against market research)
**Last Updated:** 2026-07-07
**Revision basis:** Feasibility review against the current `main` branch (97 server files import the singleton Prisma client; deployment target is Vercel serverless; database is Supabase via the transaction pooler).

## Executive Summary

Convert the Stock Management System to a multi-tenant SaaS product with **full tenant isolation at the database layer** — no `organization_id` in the application schema. Each tenant gets either:

- **A dedicated schema** inside a shared Supabase project (Trial / Starter / Professional), or
- **A dedicated Supabase project** (Enterprise).

> **Why not "database-per-tenant" inside one project?** Supabase is designed around **one Postgres database per project**. Additional databases in a single project are unsupported by Supabase tooling (dashboard, backups, PostgREST). The isolation unit for shared infrastructure is therefore the **schema**, not the database. This is the single biggest correction from the original plan: the control plane now stores `database_schema` and an `isolation_mode`, and the connection URL builder supports both modes.

**Key strategic advantage (unchanged):** the existing application schema needs **zero changes**. The current production deployment (AKG) becomes tenant #1 by registering its existing database in the control plane — no data migration, no `organization_id` retrofit, no risk to production data. See Phase 11.

**Estimated Timeline:**

- **12–16 weeks** to a sellable product with automated Stripe billing (solo developer).
- **8–10 weeks** if billing is cut to "manual invoicing + admin toggles" for the first tenants (recommended path — see Phase 10, Option A).

The original 8–10 week estimate covered the code work in Phases 1–7 but underestimated provisioning automation, billing edge cases, operational hardening, and the migration of the existing production customer.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Request Flow                          │
│        (runs inside a Vercel serverless/Fluid instance —     │
│         many instances exist concurrently; all caches        │
│         below are PER-INSTANCE, not global)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Tenant Resolution Middleware                    │
│  - Extract tenant from subdomain (acme.stockapp.com)        │
│    or custom domain (Tenant.custom_domain)                   │
│  - TTL-cached control-plane lookup (60s) — NOT per-request   │
│  - Validate tenant status = ACTIVE                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Tenant Connection Manager                       │
│  - Per-instance memoized PrismaClient map                    │
│  - connection_limit=1 per client (serverless requirement)    │
│  - Lazy initialization per tenant                            │
│  - Best-effort eviction (no background timers on serverless) │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Tenant Data (Isolated)                          │
│  - SCHEMA mode: dedicated schema in shared Supabase project  │
│  - DEDICATED mode: dedicated Supabase project (Enterprise)   │
│  - Clean application schema (no organization_id)             │
│  - Full data isolation                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## URL Routing Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      Domain Structure                        │
└─────────────────────────────────────────────────────────────┘

  stockapp.com          → Marketing/Landing Page (SEPARATE Vercel
  www.stockapp.com        project — see note below)
  app.stockapp.com      → Tenant Login Portal (select tenant)
  acme.stockapp.com     → ACME's Application (tenant-specific)
  beta.stockapp.com     → Beta's Application (tenant-specific)
  stock.akg-legacy.com  → Custom domain mapped to a tenant
                          (Tenant.custom_domain, used for AKG cutover)
```

> **Marketing site is a separate project.** Serving marketing pages from inside the SPA is awkward (the app is `ssr: false`; marketing needs SEO/SSG) and it complicates the tenant middleware with a "landing" branch. Host the marketing site as its own Vercel project on the apex + `www`, and point the app project at `app.stockapp.com` + `*.stockapp.com`. The tenant middleware then only distinguishes **portal** vs **tenant** — the landing branch is removed entirely.

> **Vercel wildcard domains:** `*.stockapp.com` is supported by Vercel but **requires the domain to use Vercel nameservers**. This is a Phase 0 checklist item — verify domain control before building subdomain routing.

---

## Phase 0: Spikes & Prerequisites (Week 1) — NEW

These must be de-risked **before** any build work. Each is a half-day-to-two-day spike with a written pass/fail result.

### Spike 0.1 — Prisma `schema` parameter through the Supabase transaction pooler (CRITICAL)

Schema-per-tenant relies on Prisma's `?schema=<tenant>` connection-string parameter working correctly through Supavisor in transaction mode (port 6543, `pgbouncer=true`). Schema selection depends on `search_path` behaviour, which has historically been a sharp edge with transaction-mode pooling.

**Test:** create two schemas (`spike_a`, `spike_b`) in a throwaway Supabase project, run `prisma migrate deploy` and CRUD against each through port 6543 concurrently, and verify no cross-schema leakage and that each schema gets its own `_prisma_migrations` table.

**Fallback if the spike fails:** use the **session pooler (port 5432)** for schema-tenant connections with `connection_limit=1`, or fall back to dedicated-project-per-tenant for all paid tiers (worse unit economics, same code path as Enterprise).

### Spike 0.2 — Vercel wildcard domain

Add `*.stockapp.com` to the app project. Confirms nameserver delegation and TLS issuance. Also add one `custom_domain` (any test domain) to confirm per-tenant custom domains work.

### Spike 0.3 — Connection-count budget

With `connection_limit=1` per PrismaClient per instance, total client connections ≈ (active instances) × (distinct tenants per instance). Load-test against the Supavisor client connection limit for your Supabase compute tier and write down the ceiling. This number drives `MAX_TENANT_CONNECTIONS` in Phase 5.

### Decision 0.4 — Marketing site

Confirm the marketing site is a separate project (recommended, assumed by the rest of this plan).

---

## Phase 1: Control Plane Database (Week 1-2)

### New Control Plane Schema

Create `prisma/control-plane.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/control-plane-client"
}

datasource db {
  provider = "postgresql"
  url      = env("CONTROL_PLANE_DATABASE_URL")
}

model Tenant {
  id                String              @id @default(uuid()) @db.Uuid
  slug              String              @unique @db.VarChar(63)  // subdomain
  name              String              @db.VarChar(200)
  custom_domain     String?             @unique @db.VarChar(255) // e.g. legacy AKG domain

  // Isolation strategy (see Architecture Overview)
  isolation_mode    TenantIsolationMode @default(SCHEMA)

  // Database connection
  database_host     String              @db.VarChar(255)
  database_port     Int                 @default(6543)
  database_name     String              @default("postgres") @db.VarChar(100)
  database_schema   String?             @db.VarChar(63)  // REQUIRED when isolation_mode = SCHEMA
  database_user     String              @db.VarChar(100)
  database_password String              @db.VarChar(255) // encrypted with TENANT_SECRETS_KEY

  // Supabase project (if dedicated)
  supabase_project_ref String?          @db.VarChar(100)

  status            TenantStatus        @default(PENDING)

  // Migration tracking (see Phase 9)
  schema_version    String              @default("1.0.0")
  migration_state   MigrationState      @default(UP_TO_DATE)
  migration_error   String?
  provisioned_at    DateTime?

  // Customization
  settings          Json?               // Tenant-specific settings (regional/cosmetic only in v1)
  features          Json?               // Feature flags
  branding          Json?               // Custom branding (logo, colors)

  created_at        DateTime            @default(now())
  updated_at        DateTime            @updatedAt

  subscription      Subscription?
  tenant_users      TenantUser[]
}

model TenantUser {
  id         String   @id @default(uuid()) @db.Uuid
  tenant_id  String   @db.Uuid
  email      String   @db.VarChar(255)
  is_owner   Boolean  @default(false)
  tenant     Tenant   @relation(fields: [tenant_id], references: [id])

  @@unique([tenant_id, email])
  @@index([email]) // portal lookup: email → tenants (see Phase 6)
}

model Subscription {
  id                     String             @id @default(uuid()) @db.Uuid
  tenant_id              String             @unique @db.Uuid
  plan_id                String             @db.Uuid
  status                 SubscriptionStatus @default(TRIAL)
  trial_ends_at          DateTime?
  stripe_customer_id     String?
  stripe_subscription_id String?
  tenant                 Tenant             @relation(fields: [tenant_id], references: [id])
  plan                   Plan               @relation(fields: [plan_id], references: [id])
}

model Plan {
  id             String         @id @default(uuid()) @db.Uuid
  name           String         @db.VarChar(100)
  code           String         @unique  // "starter", "professional", "enterprise"
  max_locations  Int            @default(1)
  max_users      Int            @default(5)
  monthly_price  Decimal        @db.Decimal(10, 2)
  features       Json           // Default features for this plan
  subscriptions  Subscription[]
}

enum TenantIsolationMode { SCHEMA, DEDICATED }
enum TenantStatus { PENDING, PROVISIONING, ACTIVE, SUSPENDED, OFFBOARDING, DELETED }
enum MigrationState { UP_TO_DATE, PENDING, FAILED }
enum SubscriptionStatus { TRIAL, ACTIVE, PAST_DUE, CANCELLED }
```

**Changes vs original plan:**

- Added `isolation_mode` + `database_schema` (resolves the database-vs-schema contradiction).
- Added `custom_domain` (needed for the AKG cutover in Phase 11 and vanity domains later).
- Added `migration_state` / `migration_error` (Phase 9 failure handling — no silent version skew).
- Added `OFFBOARDING` status (Operations chapter).
- Added `@@index([email])` on `TenantUser` for the portal flow.

**Security hardening (optional, SCHEMA mode):** all schema tenants share one Postgres user by default, so isolation is logical (search_path), not privilege-based. For defense in depth, create a per-tenant Postgres role with `USAGE`/`ALL` granted only on its own schema, and store that role in `database_user`. Ship without it; add before onboarding tenants who ask about isolation guarantees.

**Files to create:**

- `prisma/control-plane.prisma`
- `server/utils/prisma-control.ts`

---

## Phase 2: Feature Flags & Customization System (Week 2)

### Scope correction: settings must not fork core business invariants (v1)

The original plan listed `allowNegativeStock`, `requirePOForDelivery`, `autoGeneratePriceVarianceNCR`, and configurable VAT as tenant settings. **These are cut from v1.** Each one is a fork in a core business rule that the codebase currently enforces as a hard invariant in many places (no-negative-stock validation before every issue/transfer, mandatory PO link on deliveries, zero-tolerance price-variance NCR). Making them configurable multiplies the test matrix and silently triples the project scope. All tenants get today's business rules; revisit per-tenant rule configuration post-launch as an Enterprise feature.

Flags are also limited to **features that exist**. `enableBarcodeScanning` and `enablePDFExport` referenced unshipped functionality; they are moved to a "future flags" note. The export flag is renamed to `enableCsvExport` to match what the product actually does.

### Feature Flags Structure

Define standard feature flags in `shared/types/features.ts`:

```typescript
export interface TenantFeatures {
  // Module visibility (all correspond to shipped modules)
  enableNCRModule: boolean;
  enableTransfersModule: boolean;
  enablePRFPOModule: boolean;
  enableAdvancedReports: boolean;

  // Functional features (shipped)
  enableEmailNotifications: boolean;
  enableCsvExport: boolean;

  // Limits (overrides plan defaults)
  maxLocations?: number;
  maxUsers?: number;
  maxItemsPerLocation?: number;

  // FUTURE (do not gate UI on these until the feature ships):
  // enableBarcodeScanning, enablePDFExport, customApprovalWorkflow, customFields
}

export interface TenantSettings {
  // Regional / cosmetic ONLY in v1. Business-rule settings
  // (negative stock, PO requirement, NCR policy, VAT %) are
  // intentionally excluded — see scope correction above.
  currency: string; // "SAR", "USD", "EUR" — display only in v1
  timezone: string; // "Asia/Riyadh"
  dateFormat: string; // "DD/MM/YYYY"
}

export interface TenantBranding {
  logoUrl?: string;
  primaryColor?: string; // "#000046"
  secondaryColor?: string; // "#45cf7b"
  companyName: string;
  supportEmail?: string;
}
```

### Default Features by Plan

```typescript
// server/utils/plan-features.ts
// NOTE: there is NO free plan (market research 2026-07-07: sub-$50/month tools sit in
// the industry's highest-churn, lowest-retention band, and a durable free tier invites
// schema-tenant sprawl with no revenue). Trials are a Subscription STATE, not a plan:
// status = TRIAL grants Professional-tier defaults until trial_ends_at (see middleware).
export const PLAN_DEFAULTS: Record<string, TenantFeatures> = {
  starter: {
    enableNCRModule: true,
    enableTransfersModule: true,
    enablePRFPOModule: false,
    enableAdvancedReports: false,
    enableEmailNotifications: true,
    enableCsvExport: true,
    maxLocations: 2,
    maxUsers: 5,
  },
  professional: {
    enableNCRModule: true,
    enableTransfersModule: true,
    enablePRFPOModule: true,
    enableAdvancedReports: true,
    enableEmailNotifications: true,
    enableCsvExport: true,
    maxLocations: 5,
    maxUsers: 15,
  },
  enterprise: {
    enableNCRModule: true,
    enableTransfersModule: true,
    enablePRFPOModule: true,
    enableAdvancedReports: true,
    enableEmailNotifications: true,
    enableCsvExport: true,
    // No limits
  },
};

// Trials get full Professional features — the product must demonstrate its
// differentiators (period close, WAC, NCR, mandays) during the 30-day window.
export const TRIAL_DEFAULTS: TenantFeatures = PLAN_DEFAULTS.professional;
```

### Server-Side Feature Check

```typescript
// server/utils/tenant-features.ts
import type { H3Event } from "h3";
import type { TenantFeatures } from "~/shared/types/features";

export function getTenantFeatures(event: H3Event): TenantFeatures {
  const tenant = event.context.tenant;
  const planDefaults =
    tenant.plan === "trial" ? TRIAL_DEFAULTS : PLAN_DEFAULTS[tenant.plan || "starter"];

  // Merge: plan defaults + tenant-specific overrides
  return {
    ...planDefaults,
    ...tenant.features,
  };
}

export function requireFeature(event: H3Event, feature: keyof TenantFeatures): void {
  const features = getTenantFeatures(event);
  if (!features[feature]) {
    throw createError({
      statusCode: 403,
      message: `Feature "${feature}" is not available on your plan`,
    });
  }
}

// Usage in API route
export default defineEventHandler(async (event) => {
  requireFeature(event, "enableTransfersModule");

  // ... rest of transfer logic
});
```

> **Every gated module must be enforced server-side with `requireFeature`, not just hidden in the UI.** The client-side check below is UX; the server-side check is the security boundary. Phase 7's route migration includes adding the appropriate `requireFeature` call to each gated route.

### Client-Side Feature Check

```typescript
// app/composables/useFeatures.ts
export function useFeatures() {
  const { session } = useAuth();

  const features = computed<TenantFeatures>(() => {
    return session.value?.tenant?.features || {};
  });

  const hasFeature = (feature: keyof TenantFeatures): boolean => {
    return Boolean(features.value[feature]);
  };

  const getLimit = (limit: "maxLocations" | "maxUsers"): number => {
    return features.value[limit] ?? Infinity;
  };

  return {
    features,
    hasFeature,
    getLimit,
  };
}
```

### Client-Side Usage Examples

```vue
<!-- Conditional menu item -->
<template>
  <USidebarItem v-if="hasFeature('enableTransfersModule')" label="Transfers" to="/transfers" />
</template>

<script setup>
const { hasFeature } = useFeatures();
</script>
```

```vue
<!-- Conditional button with upgrade prompt -->
<template>
  <UButton v-if="hasFeature('enableAdvancedReports')" @click="openReports">Advanced Reports</UButton>
  <UTooltip v-else text="Upgrade to Professional to unlock advanced reports">
    <UButton disabled>Advanced Reports</UButton>
  </UTooltip>
</template>
```

### Branding Implementation

```vue
<!-- app/app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
const { session } = useAuth();

// Apply tenant branding as CSS variables
watchEffect(() => {
  if (session.value?.tenant?.branding) {
    const { primaryColor, secondaryColor } = session.value.tenant.branding;
    if (primaryColor) {
      document.documentElement.style.setProperty("--color-primary", primaryColor);
    }
    if (secondaryColor) {
      document.documentElement.style.setProperty("--color-secondary", secondaryColor);
    }
  }
});
</script>
```

**Files to create:**

- `shared/types/features.ts`
- `server/utils/plan-features.ts`
- `server/utils/tenant-features.ts`
- `app/composables/useFeatures.ts`

---

## Phase 3: Tenant Resolution Middleware (Week 3)

### Design corrections vs original plan

1. **TTL-cached tenant lookup.** The original middleware queried the control plane on every request — that adds a full round-trip of latency to every API call and makes the control plane a hot single point of failure. Tenant config is now cached in-instance for 60 seconds. Consequence to accept: suspension/feature changes take up to 60s to propagate per warm instance.
2. **No "landing" branch.** The marketing site is a separate project (Phase 0, Decision 0.4), so the middleware only distinguishes portal vs tenant. The broken `app/middleware/landing.ts` snippet from the original plan is dropped.
3. **Dev-only tenant override is hard-gated on environment.** A `?tenant=` override reachable in production is a tenant-hopping vulnerability.
4. **Custom-domain resolution** added (checked before subdomain parsing).

Create `server/middleware/01.tenant.ts` (the `01.` prefix guarantees it runs before the auth middleware):

```typescript
import { getTenantConfigCached } from "../utils/tenant-config-cache";

export default defineEventHandler(async (event) => {
  const path = event.path || "";
  const host = getHeader(event, "host") || "";

  // === ROUTES THAT NEVER NEED A TENANT ===
  const publicPaths = [
    "/api/health",
    "/api/portal/", // tenant discovery for app.stockapp.com (Phase 6)
    "/api/public/", // pricing etc. (reads control plane only)
    "/_nuxt/", // Static assets
    "/favicon.ico",
  ];

  if (publicPaths.some((p) => path.startsWith(p))) {
    return; // Skip tenant resolution
  }

  // === DETERMINE ROUTING MODE ===
  const routingResult = await resolveRouting(event, host);

  // Handle tenant portal (app.stockapp.com)
  if (routingResult.type === "portal") {
    event.context.isTenantPortal = true;
    return; // Tenant selection happens client-side via /api/portal/*
  }

  // === TENANT-SPECIFIC ROUTES ===
  const lookup = routingResult.lookup;

  if (!lookup) {
    throw createError({
      statusCode: 400,
      message: "Tenant not specified. Please access via your-company.stockapp.com",
    });
  }

  // TTL-cached control-plane lookup (60s per instance) — by slug or custom domain
  const tenant = await getTenantConfigCached(lookup);

  if (!tenant) {
    throw createError({
      statusCode: 404,
      message: "Tenant not found",
    });
  }

  if (tenant.status === "SUSPENDED") {
    throw createError({
      statusCode: 403,
      message: "This account has been suspended. Please contact support.",
    });
  }

  if (tenant.status !== "ACTIVE") {
    throw createError({
      statusCode: 403,
      message: "This account is not active. Please complete setup.",
    });
  }

  // Trial handling: trials get Professional-tier features until trial_ends_at.
  // Expiry is checked here (not at login) so it takes effect within the 60s cache TTL.
  const sub = tenant.subscription;
  const onTrial =
    sub?.status === "TRIAL" && sub.trial_ends_at !== null && sub.trial_ends_at > new Date();

  if (sub?.status === "TRIAL" && !onTrial) {
    throw createError({
      statusCode: 402,
      message: "Your 30-day trial has ended. Please choose a plan to continue.",
    });
  }

  // Attach full tenant context
  event.context.tenantId = tenant.id;
  event.context.tenantSlug = tenant.slug;
  event.context.tenantName = tenant.name;
  event.context.tenant = {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    features: onTrial
      ? { ...TRIAL_DEFAULTS, ...((tenant.features as Partial<TenantFeatures>) || {}) }
      : mergeFeatures(sub?.plan?.features, tenant.features),
    settings: tenant.settings,
    branding: tenant.branding,
    plan: onTrial ? "trial" : sub?.plan?.code || "starter",
  };
});

interface RoutingResult {
  type: "portal" | "tenant";
  lookup?: { slug: string } | { customDomain: string };
}

async function resolveRouting(event: H3Event, host: string): Promise<RoutingResult> {
  // Remove port if present
  const hostname = host.split(":")[0];

  // Local development ONLY — never active in production builds
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    if (process.env.NODE_ENV !== "production") {
      // Query param override for multi-tenant testing (dev only)
      const url = new URL(event.node.req.url || "", `http://${host}`);
      const tenantParam = url.searchParams.get("tenant");
      if (tenantParam) {
        return { type: "tenant", lookup: { slug: tenantParam } };
      }

      const defaultTenant = process.env.DEFAULT_TENANT_SLUG;
      if (defaultTenant) {
        return { type: "tenant", lookup: { slug: defaultTenant } };
      }
    }
    return { type: "portal" };
  }

  // Local hosts-file domains (dev only): acme.stockapp.local
  if (hostname.endsWith(".local") && process.env.NODE_ENV !== "production") {
    const parts = hostname.replace(".local", "").split(".");
    if (parts.length >= 2) {
      return { type: "tenant", lookup: { slug: parts[0] } };
    }
  }

  const appDomain = process.env.APP_DOMAIN || "stockapp.com";

  // Subdomain of the app domain
  if (hostname.endsWith(`.${appDomain}`)) {
    const subdomain = hostname.slice(0, -(appDomain.length + 1));

    // app.stockapp.com → Tenant portal
    if (subdomain === "app") {
      return { type: "portal" };
    }

    // acme.stockapp.com → Tenant application
    if (subdomain && !subdomain.includes(".")) {
      return { type: "tenant", lookup: { slug: subdomain } };
    }
  }

  // Anything else → try custom-domain mapping (e.g. legacy AKG domain)
  return { type: "tenant", lookup: { customDomain: hostname } };
}

function mergeFeatures(planFeatures: unknown, tenantFeatures: unknown): TenantFeatures {
  const plan = (planFeatures as TenantFeatures) || {};
  const tenant = (tenantFeatures as Partial<TenantFeatures>) || {};
  return { ...PLAN_DEFAULTS.starter, ...plan, ...tenant };
}
```

### Tenant Config Cache

Create `server/utils/tenant-config-cache.ts`:

```typescript
// Per-instance TTL cache for control-plane tenant lookups.
// Serverless note: each Vercel instance holds its own copy; Fluid Compute
// instance reuse means warm requests skip the control-plane round-trip.
import { getControlPlanePrisma } from "./prisma-control";

const TTL_MS = 60_000;
const cache = new Map<string, { tenant: TenantWithPlan | null; cachedAt: number }>();

type Lookup = { slug: string } | { customDomain: string };

export async function getTenantConfigCached(lookup: Lookup): Promise<TenantWithPlan | null> {
  const key = "slug" in lookup ? `s:${lookup.slug}` : `d:${lookup.customDomain}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.cachedAt < TTL_MS) {
    return hit.tenant;
  }

  const controlPrisma = getControlPlanePrisma();
  const tenant = await controlPrisma.tenant.findUnique({
    where: "slug" in lookup ? { slug: lookup.slug } : { custom_domain: lookup.customDomain },
    include: { subscription: { include: { plan: true } } },
  });

  cache.set(key, { tenant, cachedAt: Date.now() });
  return tenant;
}
```

### Public Pricing API

Create `server/api/public/pricing.get.ts`:

```typescript
// Public API for the marketing site — reads control plane only, no tenant required
export default defineEventHandler(async (event) => {
  const controlPrisma = getControlPlanePrisma();

  const plans = await controlPrisma.plan.findMany({
    orderBy: { monthly_price: "asc" },
  });

  return plans.map((plan) => ({
    name: plan.name,
    code: plan.code,
    price: plan.monthly_price,
    maxLocations: plan.max_locations,
    maxUsers: plan.max_users,
    features: plan.features,
  }));
});
```

**Files to create:**

- `server/middleware/01.tenant.ts`
- `server/utils/tenant-config-cache.ts`
- `server/api/public/pricing.get.ts`
- `server/api/public/register.post.ts` (tenant signup)

---

## Phase 4: Local Development Guide (Week 3)

### Development Setup Options

#### Option A: Default Tenant (Simplest)

Set a default tenant in `.env`:

```env
# .env.development
DEFAULT_TENANT_SLUG="demo"
```

This automatically routes `localhost:3000` to the "demo" tenant.

#### Option B: Query Parameter Override (dev builds only)

Already built into the Phase 3 middleware — and **hard-gated on `NODE_ENV !== "production"`**, so it cannot be exploited in production.

```
http://localhost:3000?tenant=acme    → ACME's schema/database
http://localhost:3000?tenant=beta    → Beta's schema/database
http://localhost:3000                → Default tenant or portal
```

#### Option C: Local Hosts File (Realistic)

Edit `/etc/hosts` (Mac/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1   acme.stockapp.local
127.0.0.1   beta.stockapp.local
127.0.0.1   app.stockapp.local
```

Then access:

```
http://acme.stockapp.local:3000   → ACME tenant
http://beta.stockapp.local:3000   → Beta tenant
```

The `.local` handling is already in the Phase 3 middleware (also dev-gated).

### Development Tenant Seeding

Create `scripts/seed-dev-tenants.ts`:

```typescript
import { getControlPlanePrisma } from "../server/utils/prisma-control";
import { encrypt } from "../server/utils/encryption";

async function seedDevTenants() {
  const prisma = getControlPlanePrisma();

  // Create demo tenant (schema-per-tenant, mirrors production shared mode)
  await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      slug: "demo",
      name: "Demo Company",
      isolation_mode: "SCHEMA",
      database_host: process.env.DEV_DB_HOST || "localhost",
      database_port: 5432,
      database_name: "stockapp_dev",
      database_schema: "tenant_demo",
      database_user: "postgres",
      database_password: encrypt("postgres"),
      status: "ACTIVE",
      features: {
        enableNCRModule: true,
        enableTransfersModule: true,
        enablePRFPOModule: true,
        enableAdvancedReports: true,
      },
    },
  });

  // Create test tenant for multi-tenant isolation testing
  await prisma.tenant.upsert({
    where: { slug: "test" },
    update: {},
    create: {
      slug: "test",
      name: "Test Company",
      isolation_mode: "SCHEMA",
      database_host: process.env.DEV_DB_HOST || "localhost",
      database_port: 5432,
      database_name: "stockapp_dev",
      database_schema: "tenant_test",
      database_user: "postgres",
      database_password: encrypt("postgres"),
      status: "ACTIVE",
      features: {
        enableNCRModule: true,
        enableTransfersModule: false, // Test limited features
      },
    },
  });

  console.log("✅ Dev tenants seeded");
}

seedDevTenants();
```

> Dev tenants now live as **two schemas in one local database**, exactly mirroring the production shared-project topology — so schema-isolation bugs surface locally, not in production.

### Development Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "nuxt dev",
    "dev:acme": "DEFAULT_TENANT_SLUG=acme nuxt dev",
    "dev:beta": "DEFAULT_TENANT_SLUG=beta nuxt dev",
    "dev:seed": "tsx scripts/seed-dev-tenants.ts",
    "dev:reset": "tsx scripts/reset-dev-tenants.ts"
  }
}
```

### Local Development Checklist

1. Set up Control Plane database:

   ```bash
   createdb stockapp_control
   pnpm prisma db push --schema=prisma/control-plane.prisma
   ```

2. Set up the shared dev database and tenant schemas:

   ```bash
   createdb stockapp_dev
   pnpm dev:seed   # creates tenant rows; provisioning script creates the schemas
   pnpm tsx scripts/provision-tenant-schema.ts demo
   pnpm tsx scripts/provision-tenant-schema.ts test
   ```

3. Configure environment:

   ```env
   # .env.development
   CONTROL_PLANE_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stockapp_control"
   DEFAULT_TENANT_SLUG="demo"
   ```

4. Start development:

   ```bash
   pnpm dev
   ```

5. Access application:
   - Default tenant: http://localhost:3000
   - Switch tenant: http://localhost:3000?tenant=test

**Files to create:**

- `scripts/seed-dev-tenants.ts`
- `scripts/reset-dev-tenants.ts`
- `scripts/provision-tenant-schema.ts`
- `docs/LOCAL_DEVELOPMENT.md`

---

## Phase 5: Tenant Connection Manager (Week 3-4) — REDESIGNED FOR SERVERLESS

### Why the original design was wrong

The original `TenantConnectionManager` (LRU of 50 PrismaClients, idle timers, periodic `cleanupIdle()`) assumed a single long-running Node process. The app deploys to **Vercel serverless/Fluid Compute**, where:

- Each function instance holds its **own copy** of any in-memory cache — there is no global LRU. "Max 50 connections" as written would actually mean 50 × (number of live instances).
- Nothing ever calls a periodic cleanup loop; there are no background timers.
- Instance lifecycle is managed by the platform; `$disconnect()` on eviction can race with a concurrent request using that client in the same instance.

### Redesigned approach

- **Per-instance memoization** of PrismaClients (Fluid Compute reuses instances, so warm requests skip client creation).
- **`connection_limit=1`** on every tenant client — the standard Prisma-on-serverless setting. Total Postgres client connections ≈ instances × distinct tenants per instance; validated against the pooler ceiling in Spike 0.3.
- **TTL config cache** (Phase 3) so client creation doesn't add a control-plane query on the hot path.
- **Best-effort soft eviction**: only evict clients idle longer than a threshold, checked opportunistically on access (no timers). Never evict recently-used clients — that is what raced in the original design.

Create `server/utils/tenant-connection.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import type { H3Event } from "h3";
import { getTenantConfigCached } from "./tenant-config-cache";
import { decrypt } from "./encryption";

interface CachedClient {
  prisma: PrismaClient;
  lastAccessed: number;
}

// PER-INSTANCE cache. Each serverless instance holds its own copy.
const clients = new Map<string, CachedClient>();

const MAX_CLIENTS = Number(process.env.MAX_TENANT_CONNECTIONS ?? 10);
const IDLE_EVICT_MS = Number(process.env.TENANT_CONNECTION_IDLE_TIMEOUT_MS ?? 300_000);

export async function getTenantPrisma(event: H3Event): Promise<PrismaClient> {
  const tenantId = event.context.tenantId;
  if (!tenantId) {
    throw createError({ statusCode: 400, message: "Tenant context required" });
  }

  const cached = clients.get(tenantId);
  if (cached) {
    cached.lastAccessed = Date.now();
    return cached.prisma;
  }

  const tenant = await getTenantConfigCached({ slug: event.context.tenantSlug });
  if (!tenant || tenant.status !== "ACTIVE") {
    throw createError({ statusCode: 403, message: "Tenant not found or inactive" });
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: buildConnectionUrl(tenant) } },
  });

  evictIdleIfNeeded();

  clients.set(tenantId, { prisma, lastAccessed: Date.now() });
  return prisma;
}

function buildConnectionUrl(tenant: TenantConnectionConfig): string {
  const password = decrypt(tenant.database_password);
  const base =
    `postgresql://${tenant.database_user}:${password}` +
    `@${tenant.database_host}:${tenant.database_port}/${tenant.database_name}`;

  const params = new URLSearchParams({
    sslmode: "require",
    pgbouncer: "true",
    connection_limit: "1", // serverless: one connection per client per instance
  });

  // SCHEMA mode: pin the tenant schema (validated by Spike 0.1)
  if (tenant.isolation_mode === "SCHEMA") {
    if (!tenant.database_schema) {
      throw new Error(`Tenant ${tenant.slug} is SCHEMA mode but has no database_schema`);
    }
    params.set("schema", tenant.database_schema);
  }

  return `${base}?${params.toString()}`;
}

// Opportunistic, best-effort eviction — called on client creation, never on a timer.
// Only evicts clients idle past the threshold, so it cannot race an in-flight query
// (any concurrent request would have refreshed lastAccessed).
function evictIdleIfNeeded(): void {
  if (clients.size < MAX_CLIENTS) return;

  const now = Date.now();
  for (const [key, conn] of clients) {
    if (now - conn.lastAccessed > IDLE_EVICT_MS) {
      clients.delete(key);
      conn.prisma.$disconnect().catch(() => {});
    }
  }

  // If still at capacity (MAX_CLIENTS busy tenants on one instance), allow the map
  // to grow rather than evicting a hot client. Alert on this in Operations —
  // it means MAX_TENANT_CONNECTIONS is undersized for real traffic.
}
```

**Files to create:**

- `server/utils/tenant-connection.ts`
- `server/utils/encryption.ts` (AES-256-GCM with `TENANT_SECRETS_KEY`)

---

## Phase 6: Auth Flow Updates (Week 4-5)

### Updated Login Flow

Modify `server/api/auth/login.post.ts`:

```typescript
export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event);

  // Get tenant's Prisma (not control plane!)
  const prisma = await getTenantPrisma(event);

  // Query user in tenant's database
  const user = await prisma.user.findUnique({
    where: { email },
    include: { locations: true },
  });

  if (!user || !verifyPassword(password, user.password_hash)) {
    throw createError({ statusCode: 401, message: "Invalid credentials" });
  }

  // Create session with tenant context
  await setUserSession(event, {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      locations: user.locations.map((l) => l.location_id),
    },
    tenant: {
      id: event.context.tenant.id,
      slug: event.context.tenant.slug,
      name: event.context.tenant.name,
      features: event.context.tenant.features,
      settings: event.context.tenant.settings,
      branding: event.context.tenant.branding,
      plan: event.context.tenant.plan,
    },
  });

  return { success: true };
});
```

### Session/tenant binding check (NEW)

The auth middleware must verify on every request that **the session's tenant matches the resolved tenant** (`session.tenant.id === event.context.tenantId`). Cookies are subdomain-scoped so this should never mismatch in practice, but it is the backstop against a session replayed across tenant hosts (especially with custom domains in play).

### Stale-flags decision (explicit)

Feature flags and branding are embedded in the session **at login**. Plan upgrades/downgrades therefore take effect on next login, not immediately. This is accepted for v1 — with one exception: **server-side `requireFeature` reads flags from `event.context.tenant` (fresh, TTL ≤ 60s), never from the session.** So a downgraded tenant can briefly see a menu item, but the API will reject the action. Optionally add `GET /api/auth/refresh-session` post-launch to rebuild the session without re-login.

### Tenant Portal flow (app.stockapp.com) — minimal v1

The `TenantUser` control-plane model powers a deliberately minimal portal:

1. User enters their email at `app.stockapp.com`.
2. `POST /api/portal/discover` looks up `TenantUser` by email and returns matching tenant slugs/names. To avoid email enumeration, respond identically when there are no matches ("If this email is registered, check your inbox") and send the tenant list by email instead of returning it in the response.
3. User follows the link to `acme.stockapp.com/login` and signs in there (authentication always happens against the tenant database, never the portal).

`TenantUser` rows are maintained by tenant provisioning (owner) and by user create/delete inside the app (Phase 7 touches `server/api/users/*` anyway).

### Updated Session Interface

Update `shared/types/session.ts`:

```typescript
export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  features: TenantFeatures;
  settings: TenantSettings;
  branding: TenantBranding;
  plan: string;
}

export interface SaaSSession {
  user: SessionUser;
  tenant: TenantContext;
}
```

**Files to create/modify:**

- `server/api/auth/login.post.ts` (modify)
- `server/middleware/auth.ts` (modify — add session↔tenant binding check)
- `server/api/portal/discover.post.ts` (new)
- `app/stores/auth.ts` (modify)
- `shared/types/session.ts` (modify)

---

## Phase 7: API Route & Shared-Utility Migration (Week 5-7) — SCOPE EXPANDED

### Real scope (measured against the codebase)

**97 server files** import the singleton Prisma client — not just API routes. The migration has four distinct workstreams:

**7a. API routes (~90 files)** — mechanical swap:

**Before:**

```typescript
import prisma from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const items = await prisma.item.findMany();
});
```

**After:**

```typescript
import { getTenantPrisma } from "../../utils/tenant-connection";

export default defineEventHandler(async (event) => {
  const prisma = await getTenantPrisma(event);
  const items = await prisma.item.findMany();
});
```

Plus `requireFeature(event, ...)` on every route belonging to a gated module (Transfers, PRF/PO, NCR, Reports, CSV export endpoints).

**7b. Shared server utilities (NOT mechanical)** — these import the singleton at module scope and are called from inside routes and transactions. They must be **parameterized** to accept a client:

- `server/utils/documentNumbering.ts` — sequence generation must run against the tenant DB (and inside the caller's `$transaction` where applicable): signature becomes `(prisma: PrismaClient | Prisma.TransactionClient, ...)`.
- `server/utils/stockValidation.ts` — same treatment.
- `server/utils/ncrCredits.ts` — same treatment.

Every call site updates accordingly. This is the fiddly part of Phase 7 — do it first, before the mechanical route sweep.

**7c. Email/notification pipeline** — notifications fire asynchronously after writes. Anything they read from the database (supplier emails, notification settings, NCR details) must come from **the tenant's client, passed in explicitly** — never a module-scope import. Additionally, outbound emails should carry tenant branding/name, and the email "from"/reply-to may become tenant-configurable (branding.supportEmail).

**7d. Dangerous/dev endpoints:**

- `server/api/dev/reset-all-data.post.ts` — must be tenant-scoped AND hard-gated to non-production. As written today it would wipe whichever database it's pointed at.
- `server/api/health.get.ts` — should check the control plane, not a tenant DB.

### Migration order

**Tier 0 — Shared utilities (do first):** `documentNumbering`, `stockValidation`, `ncrCredits`, email pipeline.

**Tier 1 - Core Transactions:**

- `server/api/locations/[id]/deliveries/*.ts`
- `server/api/locations/[id]/issues/*.ts`
- `server/api/transfers/*.ts`
- `server/api/prfs/*.ts`
- `server/api/pos/*.ts`

**Tier 2 - Master Data:**

- `server/api/items/*.ts`
- `server/api/suppliers/*.ts`
- `server/api/locations/*.ts`
- `server/api/users/*.ts` (also maintains control-plane `TenantUser` rows)

**Tier 3 - Supporting:**

- `server/api/periods/*.ts`
- `server/api/ncrs/*.ts`
- `server/api/reports/*.ts`
- `server/api/dashboard/*.ts`
- `server/api/approvals/*.ts`, `server/api/pob/*.ts`, `server/api/reconciliations/*.ts`, `server/api/settings/*.ts`

> **Guardrail:** once migration starts, add a lint rule (or a simple CI grep) that fails the build on any new `import prisma from ".../utils/prisma"` in `server/api/`, so the singleton can't creep back in. Delete `server/utils/prisma.ts` entirely at the end of Phase 7.

---

## Phase 8: Tenant Provisioning (Week 7-8)

### Provisioning Workflow

```
1. POST /api/admin/tenants
   { slug: "acme", name: "ACME Corp", owner_email: "admin@acme.com", plan: "starter" }
                     │
                     ▼
2. Control Plane: Create tenant record (status: PENDING → PROVISIONING)
                     │
                     ▼
3. Database Provisioning (background job):
   - SCHEMA mode (Trial/Starter/Pro):
       CREATE SCHEMA "tenant_acme" in the shared Supabase project
   - DEDICATED mode (Enterprise):
       Create Supabase project via the Supabase Management API,
       store supabase_project_ref + connection details
                     │
                     ▼
4. Run Prisma migrations against the new schema/database
   (SCHEMA mode: migrate deploy with ?schema=tenant_acme —
    each schema gets its own _prisma_migrations table)
                     │
                     ▼
5. Seed initial data (admin user, default period)
   + create TenantUser row (owner_email, is_owner: true)
                     │
                     ▼
6. Update status to ACTIVE, set schema_version, send welcome email
   (any step failing → status stays PROVISIONING with error logged;
    provisioning job is idempotent and re-runnable)
```

### Supabase Strategy (corrected)

| Plan           | Isolation                                        | Cost          |
| -------------- | ------------------------------------------------ | ------------- |
| Trial (30-day) | Schema in shared Supabase project                | ~$0/tenant    |
| Starter/Pro    | Schema in shared Supabase project                | ~$0–2/tenant  |
| Enterprise     | Dedicated Supabase project (via Management API)  | ~$25+/tenant  |

Notes:

- Schema count in one Postgres database is comfortable at hundreds of tenants; the practical limit is migration wall-time (Phase 9), not Postgres itself.
- When the shared project approaches its comfort ceiling (connections, storage, migration time), add a **second shared project** and place new tenants there — `database_host` per tenant already supports this with no code change.

**Files to create:**

- `server/api/admin/tenants/index.post.ts`
- `server/api/admin/tenants/[id]/provision.post.ts`
- `server/jobs/provision-tenant.ts`

---

## Phase 9: Migration Management (Week 8-9) — FAILURE HANDLING ADDED

### Multi-Tenant Migration Script

The original script continued silently past failures, leaving tenants version-skewed with no record. Corrected behaviour: **record state per tenant, halt on first failure by default, and alert.**

Create `scripts/migrate-all-tenants.ts`:

```typescript
async function migrateAllTenants(targetVersion: string, opts = { continueOnError: false }) {
  const controlPrisma = getControlPlanePrisma();
  const tenants = await controlPrisma.tenant.findMany({
    where: { status: "ACTIVE" },
    orderBy: { created_at: "asc" },
  });

  const failures: string[] = [];

  for (const tenant of tenants) {
    if (tenant.schema_version === targetVersion) continue;

    await controlPrisma.tenant.update({
      where: { id: tenant.id },
      data: { migration_state: "PENDING" },
    });

    try {
      // Pass the URL via env, not argv — connection strings with passwords
      // must never appear in the process list.
      await execAsync("npx prisma migrate deploy", {
        env: { ...process.env, DATABASE_URL: buildConnectionUrl(tenant) },
      });

      await controlPrisma.tenant.update({
        where: { id: tenant.id },
        data: {
          schema_version: targetVersion,
          migration_state: "UP_TO_DATE",
          migration_error: null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(tenant.slug);

      await controlPrisma.tenant.update({
        where: { id: tenant.id },
        data: { migration_state: "FAILED", migration_error: message },
      });

      console.error(`❌ Migration failed for ${tenant.slug}: ${message}`);
      if (!opts.continueOnError) {
        console.error("Halting. Fix the failure, then re-run (idempotent).");
        break;
      }
    }
  }

  if (failures.length > 0) {
    // Alert (email/Slack) — version skew across tenants is an incident, not a log line
    await notifyAdmins(`Tenant migrations failed: ${failures.join(", ")}`);
    process.exitCode = 1;
  }
}
```

### Deployment coupling rule

App code deploys to **all tenants at once** (single Vercel deployment), but migrations run **per tenant**. Therefore every migration must be **backwards-compatible with the previous app version** (expand/contract pattern: add columns nullable → deploy code → backfill → tighten). This was already implicit in the production rules (CLAUDE.md); with N tenants it becomes mandatory, because there is always a window where some tenants are on the old schema.

**Files to create:**

- `scripts/migrate-all-tenants.ts`
- `scripts/migrate-single-tenant.ts`

---

## Phase 10: Billing Integration (Week 9-10 manual / Week 11-14 Stripe)

### Option A (recommended first): Manual billing

Ship first tenants **without Stripe**: an internal admin UI toggles `Subscription.status` and plan; invoicing happens out-of-band. This removes webhooks, checkout flows, proration, dunning, and tax handling from the critical path — roughly 3–4 weeks of work deferred until there is revenue to justify it.

**Trial lifecycle (applies to both options):** new tenants are provisioned with `Subscription.status = TRIAL` and `trial_ends_at = provisioned_at + 30 days`, receiving full Professional-tier features (`TRIAL_DEFAULTS`). The tenant middleware rejects expired trials with HTTP 402 until an admin (Option A) or a Stripe checkout (Option B) activates a paid plan. No credit card is required to start a trial. Annual billing is the default quote (see Subscription Tiers); Saudi invoices must be ZATCA-compliant regardless of billing option.

**Routes:**

- `server/api/admin/tenants/[id]/subscription.patch.ts` (set plan/status manually)

### Option B: Stripe Integration (post-launch)

**New routes:**

- `server/api/billing/subscription.get.ts`
- `server/api/billing/checkout.post.ts`
- `server/api/billing/portal.post.ts`
- `server/api/billing/webhook.post.ts` (webhook drives `Subscription.status`; `PAST_DUE` → grace period → tenant `SUSPENDED`)

---

## Phase 11: Migrate the Existing Production Customer as Tenant #1 (Week 9) — NEW

The current AKG production deployment becomes the first tenant with **no data migration and no schema changes**. This phase is the proof that the architecture works and the rehearsal for every future enterprise onboarding.

### Steps

1. **Register the tenant.** Insert a `Tenant` row: `slug: "akg"`, `isolation_mode: DEDICATED`, pointing at the **existing** Supabase project's connection details (host, port 6543, `postgres` database, encrypted password). Plan: `enterprise`, all features enabled, no limits (grandfathered).
2. **Map domains.** `akg.stockapp.com` via subdomain; set `custom_domain` to the current production hostname so existing bookmarks, the installed PWA, and login cookies keep working through the cutover.
3. **Deploy with a fallback flag.** Ship the multi-tenant build with `SINGLE_TENANT_FALLBACK_SLUG="akg"`: if tenant resolution fails on the legacy hostname for any reason, resolve to AKG instead of erroring. This makes the cutover reversible and non-breaking for real users.
4. **Verify.** Run the full regression pass (the 20-step scenario from `EXECUTIVE_BRIEF.html`) against the AKG tenant on the new build, including a period-close dry run on a test period, plus the tenant-isolation checks against a second (demo) tenant.
5. **Remove the fallback** after one clean production week; AKG is then a normal tenant.

### Non-negotiables

- Full database backup verified restorable **before** step 3 (per production rules).
- No `db:push`, no schema changes — this phase touches zero application tables.
- Users, passwords, sessions, and data are untouched; only the routing layer above them changes.

---

## Phase 12: Operations & Tenant Lifecycle (Week 10) — NEW

The original plan had no operational chapter. Minimum viable ops for taking money from strangers:

### Backups & restore

- **DEDICATED tenants:** Supabase's native daily backups apply per project. Document the restore procedure once.
- **SCHEMA tenants:** the shared project's backup covers all tenants **together** — restoring one tenant from it is not point-and-click. Add a nightly per-schema `pg_dump --schema=tenant_x` job to object storage, and script + rehearse a single-tenant restore (`pg_restore` into a fresh schema, repoint the tenant row). A backup that has never been restored is a hypothesis, not a backup.

### Offboarding & deletion

- Cancellation → status `OFFBOARDING`: tenant locked out, final `pg_dump` exported and offered to the customer, 30-day grace.
- After grace: `DROP SCHEMA` (or delete the Supabase project), status `DELETED`, connection secrets erased. Tenant row is retained for billing history.

### Monitoring & alerts

- Per-tenant request count/error rate (log `tenantSlug` on every API request — one line in the tenant middleware).
- Alerts: migration `FAILED` state (Phase 9), provisioning stuck in `PROVISIONING`, connection-pool saturation (Spike 0.3 ceiling), control-plane DB unreachable.
- A minimal internal admin page: tenant list with status, plan, schema_version, migration_state, last-activity.

### Support tooling

- `scripts/impersonate-tenant.ts` — generate a time-boxed support session against a tenant (audit-logged), or at minimum a documented read-only SQL path per tenant schema.

---

## Critical Files Summary

| File                                    | Action | Purpose                                            |
| --------------------------------------- | ------ | -------------------------------------------------- |
| `prisma/control-plane.prisma`            | NEW    | Central tenant management schema                    |
| `server/utils/prisma-control.ts`         | NEW    | Control plane Prisma client                         |
| `server/utils/tenant-config-cache.ts`    | NEW    | TTL-cached tenant lookups (per instance)            |
| `server/utils/tenant-connection.ts`      | NEW    | Serverless-aware per-instance client manager        |
| `server/utils/encryption.ts`             | NEW    | Encrypt/decrypt tenant DB credentials               |
| `server/utils/tenant-features.ts`        | NEW    | Feature flag utilities (server-side enforcement)    |
| `server/middleware/01.tenant.ts`         | NEW    | Tenant resolution (subdomain + custom domain)       |
| `shared/types/features.ts`               | NEW    | Feature/settings type definitions                   |
| `app/composables/useFeatures.ts`         | NEW    | Client-side feature checks                          |
| `server/api/portal/discover.post.ts`     | NEW    | Portal: email → tenant discovery                    |
| `scripts/seed-dev-tenants.ts`            | NEW    | Development tenant seeding                          |
| `scripts/provision-tenant-schema.ts`     | NEW    | Schema provisioning (also used by dev setup)        |
| `scripts/migrate-all-tenants.ts`         | NEW    | Per-tenant migrations with failure tracking         |
| `server/api/auth/login.post.ts`          | MODIFY | Tenant-aware login                                  |
| `server/middleware/auth.ts`              | MODIFY | Session↔tenant binding check                        |
| `app/stores/auth.ts`                     | MODIFY | Add TenantContext to session                        |
| `server/utils/documentNumbering.ts`      | MODIFY | Parameterize Prisma client (Tier 0)                 |
| `server/utils/stockValidation.ts`        | MODIFY | Parameterize Prisma client (Tier 0)                 |
| `server/utils/ncrCredits.ts`             | MODIFY | Parameterize Prisma client (Tier 0)                 |
| All ~90 API routes (97 files total)      | MODIFY | Use `getTenantPrisma(event)` + `requireFeature`     |
| `server/utils/prisma.ts`                 | DELETE | Singleton removed at end of Phase 7                 |

---

## Environment Variables

```env
# Control Plane Database
CONTROL_PLANE_DATABASE_URL="postgresql://..."

# Encryption
TENANT_SECRETS_KEY="base64-encoded-32-byte-key"

# Connection Pool (per serverless instance — see Phase 5 / Spike 0.3)
MAX_TENANT_CONNECTIONS=10
TENANT_CONNECTION_IDLE_TIMEOUT_MS=300000

# Routing
APP_DOMAIN="stockapp.com"
DEFAULT_TENANT_SLUG="demo"            # dev only
SINGLE_TENANT_FALLBACK_SLUG=""        # set to "akg" during Phase 11 cutover only

# Marketing site (separate Vercel project)
MARKETING_SITE_URL="https://www.stockapp.com"

# Stripe (Phase 10 Option B only)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Verification Plan

1. **Spike 0.1 passes**: Prisma `?schema=` isolation confirmed through the transaction pooler (or fallback decision recorded).
2. Create two test tenants (acme, beta) as **schemas in one database**.
3. Verify acme.stockapp.com only shows ACME data; beta.stockapp.com only Beta's.
4. Verify cross-tenant API access is blocked, including a session cookie from one tenant replayed against another tenant's host (Phase 6 binding check).
5. Verify the `?tenant=` override returns 400/is inert on a production build.
6. Test tenant provisioning workflow end-to-end (PENDING → ACTIVE), including re-running a failed provisioning job (idempotency).
7. Test migration across all tenants, **including a deliberately failing migration** — confirm halt, `migration_state = FAILED`, and alert.
8. Load test connection counts against the Supavisor ceiling (Spike 0.3 number) with 50+ concurrent tenants.
9. Verify feature flags per tenant — both UI hiding and server-side 403 from `requireFeature`.
10. Verify local development with multiple tenants (two schemas, one local DB).
11. **Phase 11 rehearsal**: register a copy of the production database as a DEDICATED tenant in staging and run the full 20-step regression scenario against it.
12. Single-tenant restore drill: restore one SCHEMA tenant from its nightly dump without touching neighbours.

---

## Subscription Tiers — REVISED PER MARKET RESEARCH (2026-07-07)

> **Basis:** `project-docs/MARKET_RESEARCH.md`. Three findings drive this revision: (1) competitors cluster at **$160–350/month per location** (MarketMan $199–249/mo — verified; MarginEdge ~$330–350/location; category norm $200–350/location), so the original $49/$149 tiers were 3–7× under market and signalled "cheap tool" rather than "system of record"; (2) sub-$50/month B2B tools sit in the **highest-churn, lowest-revenue-retention band** in the industry (~23% gross revenue retention vs 70–85% above $250/month — unverified benchmark, directionally consistent), a poor match for a product whose value (WAC history, NCR audit trail, period closes) compounds over months; (3) the realistic Saudi beachhead is **~30–100 contract/camp caterers**, so revenue must come from price per logo, not logo volume. The free tier is removed entirely and replaced by a 30-day full-featured trial (`SubscriptionStatus.TRIAL` + `trial_ends_at` — both already in the control-plane schema).

| Tier         | Users     | Locations                      | Isolation         | Price/mo — annual billing | Price/mo — monthly billing | Key Features                                                                                                        |
| ------------ | --------- | ------------------------------ | ----------------- | ------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| TRIAL        | 15        | 5                              | Shared (schema)   | $0 for 30 days            | —                          | Full Professional features; locks at `trial_ends_at` until a plan is chosen (no credit card to start)                |
| STARTER      | 5         | 2                              | Shared (schema)   | SAR 749 (~$199)           | SAR 949 (~$249)            | Core stock, Deliveries/Issues, **Period close + WAC + NCR + POB/mandays**, Transfers, CSV export, Email notifications |
| PROFESSIONAL | 15        | 5 (+SAR 299 / ~$79 per extra)  | Shared (schema)   | SAR 1,899 (~$499)         | SAR 2,249 (~$599)          | + PRF/PO approval workflow, Advanced reports, Priority support                                                       |
| ENTERPRISE   | Unlimited | Unlimited                      | Dedicated project | Custom — from ~SAR 4,700 (~$1,250) | Custom            | + Dedicated database, Branding, Custom domain, SLA, onboarding/training, accounting-integration assistance           |

**Pricing rules (from the research):**

- **Annual billing is the anchor** (monthly ≈ +25%). Annual commitments are reported to cut SMB churn 40–60% and match how the ICP budgets — a period-based accounting culture buys in yearly cycles. Quote SAR first for the Saudi ICP; USD for GCC/international prospects.
- **Period close, WAC, price-variance NCRs, and POB/mandays are in every paid tier.** These are the validated white-space differentiators — gating them out of Starter would remove the reason to buy this product over MarketMan or Supy.
- **Positioning check:** a 5-location caterer pays SAR 1,899 (~$499) vs ~$1,200–1,800/month at MarketMan or ~$1,650–1,750 at MarginEdge — "roughly half the price of the generic tools, built for how Saudi contract caterers actually close their month."
- **Revenue sanity (bootstrapped):** 30 customers at a ~$400 blended average ≈ $12k MRR (~$144k ARR); 60 customers ≈ $24k MRR — a healthy solo business inside the ~30–100-logo Saudi beachhead alone. The original $49/$149 tiers would have produced ~$4k MRR at the same 30 logos, below sustainability for the support/integration burden this product carries.
- **These numbers are provisional** until validated in discovery calls with Saudi contract caterers (the research's explicit caveat). The floor, however, is firm: **no paid tier below ~$150/month** — that band is empirically where churn destroys compounding-value products.

> Custom approval workflows and custom fields (originally listed under Enterprise) are **post-launch roadmap**, consistent with the Phase 2 scope correction — sell them only when built.

---

## Revised Timeline Summary

| Weeks  | Phase                                                    |
| ------ | -------------------------------------------------------- |
| 1      | Phase 0: Spikes (pooler/schema, wildcard DNS, conn budget) |
| 1–2    | Phase 1: Control plane                                    |
| 2      | Phase 2: Feature flags (trimmed scope)                    |
| 3      | Phase 3–4: Tenant resolution + local dev                  |
| 3–4    | Phase 5: Connection manager (serverless design)           |
| 4–5    | Phase 6: Auth + portal (minimal)                          |
| 5–7    | Phase 7: Utility + route migration (97 files)             |
| 7–8    | Phase 8: Provisioning                                     |
| 8–9    | Phase 9: Migration management                             |
| 9      | Phase 11: AKG cutover as tenant #1                        |
| 10     | Phase 12: Operations + Phase 10 Option A (manual billing) |
| 11–14  | Phase 10 Option B: Stripe (post-launch, optional)         |

**8–10 weeks** to first external tenants with manual billing; **12–16 weeks** with full Stripe automation.

---

## Appendix A: Feature Flag Decision Matrix

| Customer Request                    | Approach                         | Effort     | v1?  |
| ----------------------------------- | -------------------------------- | ---------- | ---- |
| Hide a module                       | Feature flag                     | Low        | ✅   |
| Custom branding/colors              | Tenant branding                  | Low        | ✅   |
| Regional formats (currency display, timezone, dates) | Tenant settings | Low        | ✅   |
| Add custom field                    | JSON metadata column             | Low-Medium | ❌ post-launch |
| Different default values (VAT %, payment terms) | Tenant settings      | Medium     | ❌ post-launch |
| Different business rules (negative stock, PO requirement, NCR policy) | Conditional core logic | **High — forks core invariants, multiplies test matrix** | ❌ post-launch |
| Different approval workflow         | Feature flag + conditional logic | High       | ❌ post-launch |
| Completely different business logic | Enterprise custom branch         | Very High  | ❌   |
| On-premise deployment               | Separate deployment              | Very High  | ❌   |

---

## Appendix B: Local Development Quick Reference

```bash
# Start with default tenant
pnpm dev

# Start with specific tenant
DEFAULT_TENANT_SLUG=acme pnpm dev

# Switch tenant via URL (dev builds only — inert in production)
http://localhost:3000?tenant=beta

# Seed development tenants (two schemas in one local DB)
pnpm dev:seed

# Reset all dev tenant data
pnpm dev:reset
```

---

## Appendix C: Plan Revision Log

**2026-07-07 — Pricing revision (based on `project-docs/MARKET_RESEARCH.md`):**

1. **Free tier removed**, replaced by a 30-day full-featured trial using the existing `SubscriptionStatus.TRIAL` + `trial_ends_at` fields. Rationale: sub-$50/month tools sit in the industry's highest-churn band, and a durable free tier invites schema-tenant sprawl with zero revenue and real support cost.
2. **Starter raised $49 → SAR 749 (~$199); Professional raised $149 → SAR 1,899 (~$499)** with 5 locations included and extra locations at SAR 299 (~$79); Enterprise given a from-price (~SAR 4,700 / ~$1,250, dedicated project cost baked in). Competitors cluster at $160–350/month per location — the old tiers were 3–7× under market.
3. **Annual billing made the anchor** (monthly ≈ +25%); SAR quoted first for the Saudi ICP, USD for GCC/international.
4. **Differentiators confirmed in every paid tier**: period close, WAC, price-variance NCRs, and POB/mandays are the validated white space and are never gated above Starter.
5. **Code snippets updated for the no-free-plan model**: `PLAN_DEFAULTS.free` removed, `TRIAL_DEFAULTS` added (= Professional), tenant middleware enforces trial expiry with HTTP 402, and all plan-code fallbacks changed from `"free"` to `"starter"`.

**2026-07-06 — Feasibility review corrections (validated against `main`):**

1. **Isolation model fixed:** Supabase supports one database per project, so "shared project" tenants are **schema-per-tenant**, not database-per-tenant. Control plane gains `isolation_mode` + `database_schema`; connection URL builder handles both modes. Added Spike 0.1 (Prisma `?schema=` through the transaction pooler) as a day-one go/no-go gate with a documented fallback.
2. **Connection manager redesigned for serverless:** the LRU-with-timers design assumed a long-running process; replaced with per-instance memoization, `connection_limit=1`, opportunistic idle-only eviction (fixes the evict-while-in-use race), and a TTL cache for control-plane lookups (the original queried the control plane on every request).
3. **Business-rule settings cut from v1:** `allowNegativeStock`, `requirePOForDelivery`, `autoGeneratePriceVarianceNCR`, configurable VAT — each forks a core invariant enforced throughout the codebase. Flags now cover shipped features only (`enableBarcodeScanning`/`enablePDFExport` moved to future; `enableExcelExport` renamed `enableCsvExport`).
4. **Phase 7 scope corrected:** 97 files import the singleton client, including shared utils (`documentNumbering`, `stockValidation`, `ncrCredits`) that must be parameterized first, the async email pipeline (tenant context must be passed explicitly), and `dev/reset-all-data` (must be tenant-scoped and prod-gated). Added CI guard against singleton reintroduction.
5. **Security:** `?tenant=` override hard-gated to non-production; session↔tenant binding check added to auth middleware; portal email discovery made enumeration-safe; migration script no longer puts connection strings in argv.
6. **New Phase 11:** migrate the existing AKG production deployment as tenant #1 (DEDICATED mode, custom-domain mapping, `SINGLE_TENANT_FALLBACK_SLUG` for reversible cutover, backup verified first).
7. **New Phase 12 (operations):** per-schema nightly dumps + rehearsed single-tenant restore, offboarding lifecycle (`OFFBOARDING` status), monitoring/alerting, minimal internal admin page.
8. **Migration management hardened:** per-tenant `migration_state`/`migration_error`, halt-on-failure default, alerting; documented the expand/contract requirement (one deployment serves all tenants while migrations roll per tenant).
9. **Routing simplified:** marketing site moved to a separate Vercel project (landing branch and broken `landing.ts` middleware removed); wildcard-domain nameserver requirement called out; `custom_domain` support added.
10. **Timeline revised:** 8–10 weeks to first tenants with manual billing (Phase 10 Option A), 12–16 weeks with Stripe. Original 8–10 week estimate covered code but not provisioning automation, billing, ops hardening, or the production cutover.
11. **Session staleness decision made explicit:** flags snapshot at login for UI; server-side enforcement always reads fresh (≤60s) tenant context.
