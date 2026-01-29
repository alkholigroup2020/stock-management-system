# SaaS Conversion Plan: Database-Per-Tenant Architecture

## Executive Summary

Convert the Stock Management System to a multi-tenant SaaS product with **full database isolation** - each tenant gets their own PostgreSQL database with no `organization_id` needed in schemas.

**Estimated Timeline: 8-10 weeks**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Request Flow                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Tenant Resolution Middleware                    │
│  - Extract tenant from subdomain (acme.stockapp.com)        │
│  - Query Control Plane for tenant config                     │
│  - Validate tenant status = ACTIVE                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Tenant Connection Manager                       │
│  - LRU Cache of PrismaClient instances (max 50)             │
│  - Lazy initialization per tenant                           │
│  - Automatic cleanup of idle connections                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Tenant Database (Isolated)                      │
│  - Clean schema (no organization_id)                         │
│  - Full data isolation                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## URL Routing Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      Domain Structure                        │
└─────────────────────────────────────────────────────────────┘

  stockapp.com          → Marketing/Landing Page (public)
  www.stockapp.com      → Marketing/Landing Page (public)
  app.stockapp.com      → Tenant Login Portal (select tenant)
  acme.stockapp.com     → ACME's Application (tenant-specific)
  beta.stockapp.com     → Beta's Application (tenant-specific)
```

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
  id                String       @id @default(uuid()) @db.Uuid
  slug              String       @unique @db.VarChar(63)  // subdomain
  name              String       @db.VarChar(200)

  // Database connection
  database_host     String       @db.VarChar(255)
  database_port     Int          @default(6543)
  database_name     String       @db.VarChar(100)
  database_user     String       @db.VarChar(100)
  database_password String       @db.VarChar(255)  // encrypted

  // Supabase project (if dedicated)
  supabase_project_ref String?   @db.VarChar(100)

  status            TenantStatus @default(PENDING)
  schema_version    String       @default("1.0.0")
  provisioned_at    DateTime?

  // Customization (NEW)
  settings          Json?        // Tenant-specific settings
  features          Json?        // Feature flags
  branding          Json?        // Custom branding (logo, colors)

  created_at        DateTime     @default(now())
  updated_at        DateTime     @updatedAt

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

enum TenantStatus { PENDING, PROVISIONING, ACTIVE, SUSPENDED, DELETED }
enum SubscriptionStatus { TRIAL, ACTIVE, PAST_DUE, CANCELLED }
```

**Files to create:**
- `prisma/control-plane.prisma`
- `server/utils/prisma-control.ts`

---

## Phase 2: Feature Flags & Customization System (Week 2)

### Feature Flags Structure

Define standard feature flags in `shared/types/features.ts`:

```typescript
export interface TenantFeatures {
  // Module visibility
  enableNCRModule: boolean;
  enableTransfersModule: boolean;
  enablePRFPOModule: boolean;
  enableAdvancedReports: boolean;
  
  // Functional features
  enableBarcodeScanning: boolean;
  enableEmailNotifications: boolean;
  enableExcelExport: boolean;
  enablePDFExport: boolean;
  
  // Limits (overrides plan defaults)
  maxLocations?: number;
  maxUsers?: number;
  maxItemsPerLocation?: number;
  
  // Custom features (enterprise)
  customApprovalWorkflow?: boolean;
  customFields?: boolean;
}

export interface TenantSettings {
  // Regional
  currency: string;           // "SAR", "USD", "EUR"
  timezone: string;           // "Asia/Riyadh"
  dateFormat: string;         // "DD/MM/YYYY"
  
  // Business rules
  allowNegativeStock: boolean;
  requirePOForDelivery: boolean;
  autoGeneratePriceVarianceNCR: boolean;
  
  // Defaults
  defaultVATPercent: number;
  defaultPaymentTerms: string;
}

export interface TenantBranding {
  logoUrl?: string;
  primaryColor?: string;      // "#000046"
  secondaryColor?: string;    // "#45cf7b"
  companyName: string;
  supportEmail?: string;
}
```

### Default Features by Plan

```typescript
// server/utils/plan-features.ts
export const PLAN_DEFAULTS: Record<string, TenantFeatures> = {
  free: {
    enableNCRModule: true,
    enableTransfersModule: false,
    enablePRFPOModule: false,
    enableAdvancedReports: false,
    enableBarcodeScanning: false,
    enableEmailNotifications: false,
    enableExcelExport: false,
    enablePDFExport: false,
    maxLocations: 1,
    maxUsers: 2,
  },
  starter: {
    enableNCRModule: true,
    enableTransfersModule: true,
    enablePRFPOModule: false,
    enableAdvancedReports: false,
    enableBarcodeScanning: false,
    enableEmailNotifications: true,
    enableExcelExport: true,
    enablePDFExport: false,
    maxLocations: 2,
    maxUsers: 5,
  },
  professional: {
    enableNCRModule: true,
    enableTransfersModule: true,
    enablePRFPOModule: true,
    enableAdvancedReports: true,
    enableBarcodeScanning: true,
    enableEmailNotifications: true,
    enableExcelExport: true,
    enablePDFExport: true,
    maxLocations: 5,
    maxUsers: 15,
  },
  enterprise: {
    enableNCRModule: true,
    enableTransfersModule: true,
    enablePRFPOModule: true,
    enableAdvancedReports: true,
    enableBarcodeScanning: true,
    enableEmailNotifications: true,
    enableExcelExport: true,
    enablePDFExport: true,
    customApprovalWorkflow: true,
    customFields: true,
    // No limits
  },
};
```

### Server-Side Feature Check

```typescript
// server/utils/tenant-features.ts
import type { H3Event } from "h3";
import type { TenantFeatures } from "~/shared/types/features";

export function getTenantFeatures(event: H3Event): TenantFeatures {
  const tenant = event.context.tenant;
  const planDefaults = PLAN_DEFAULTS[tenant.plan?.code || "free"];
  
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
  <USidebarItem
    v-if="hasFeature('enableTransfersModule')"
    label="Transfers"
    to="/transfers"
  />
</template>

<script setup>
const { hasFeature } = useFeatures();
</script>
```

```vue
<!-- Conditional button with upgrade prompt -->
<template>
  <UButton
    v-if="hasFeature('enablePDFExport')"
    @click="exportPDF"
  >
    Export PDF
  </UButton>
  <UTooltip v-else text="Upgrade to Professional to unlock PDF export">
    <UButton disabled>Export PDF</UButton>
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

### Subdomain-Based Resolution with Landing Page Support

Create `server/middleware/01.tenant.ts`:

```typescript
import { getControlPlanePrisma } from "../utils/prisma-control";

export default defineEventHandler(async (event) => {
  const path = event.path || "";
  const host = getHeader(event, "host") || "";
  
  // === LANDING PAGE ROUTES (No tenant required) ===
  const publicPaths = [
    "/api/health",
    "/api/auth/register-tenant",
    "/api/public/",           // Public marketing API
    "/_nuxt/",                // Static assets
    "/favicon.ico",
  ];
  
  if (publicPaths.some(p => path.startsWith(p))) {
    return; // Skip tenant resolution
  }
  
  // === DETERMINE ROUTING MODE ===
  const routingResult = resolveRouting(host);
  
  // Handle landing page / marketing site
  if (routingResult.type === "landing") {
    event.context.isLandingPage = true;
    return; // No tenant context needed
  }
  
  // Handle tenant portal (app.stockapp.com)
  if (routingResult.type === "portal") {
    event.context.isTenantPortal = true;
    return; // Tenant selection happens client-side
  }
  
  // === TENANT-SPECIFIC ROUTES ===
  const subdomain = routingResult.subdomain;
  
  if (!subdomain) {
    throw createError({
      statusCode: 400,
      message: "Tenant not specified. Please access via your-company.stockapp.com",
    });
  }
  
  // Look up tenant in control plane
  const controlPrisma = getControlPlanePrisma();
  const tenant = await controlPrisma.tenant.findUnique({
    where: { slug: subdomain },
    include: {
      subscription: {
        include: { plan: true },
      },
    },
  });
  
  if (!tenant) {
    throw createError({
      statusCode: 404,
      message: `Tenant "${subdomain}" not found`,
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
  
  // Attach full tenant context
  event.context.tenantId = tenant.id;
  event.context.tenantSlug = tenant.slug;
  event.context.tenantName = tenant.name;
  event.context.tenant = {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    features: mergeFeatures(tenant.subscription?.plan?.features, tenant.features),
    settings: tenant.settings,
    branding: tenant.branding,
    plan: tenant.subscription?.plan?.code || "free",
  };
});

interface RoutingResult {
  type: "landing" | "portal" | "tenant";
  subdomain?: string;
}

function resolveRouting(host: string): RoutingResult {
  // Remove port if present
  const hostname = host.split(":")[0];
  
  // Local development
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const defaultTenant = process.env.DEFAULT_TENANT_SLUG;
    if (defaultTenant) {
      return { type: "tenant", subdomain: defaultTenant };
    }
    return { type: "portal" }; // Show tenant selector in dev
  }
  
  // Production domain parsing
  const parts = hostname.split(".");
  
  // stockapp.com or www.stockapp.com → Landing page
  if (parts.length <= 2 || parts[0] === "www") {
    return { type: "landing" };
  }
  
  // app.stockapp.com → Tenant portal
  if (parts[0] === "app") {
    return { type: "portal" };
  }
  
  // acme.stockapp.com → Tenant application
  return { type: "tenant", subdomain: parts[0] };
}

function mergeFeatures(planFeatures: unknown, tenantFeatures: unknown): TenantFeatures {
  const plan = (planFeatures as TenantFeatures) || {};
  const tenant = (tenantFeatures as Partial<TenantFeatures>) || {};
  return { ...PLAN_DEFAULTS.free, ...plan, ...tenant };
}
```

### Landing Page Handling

Create `server/api/public/pricing.get.ts`:

```typescript
// Public API for marketing site - no tenant required
export default defineEventHandler(async (event) => {
  const controlPrisma = getControlPlanePrisma();
  
  const plans = await controlPrisma.plan.findMany({
    orderBy: { monthly_price: "asc" },
  });
  
  return plans.map(plan => ({
    name: plan.name,
    code: plan.code,
    price: plan.monthly_price,
    maxLocations: plan.max_locations,
    maxUsers: plan.max_users,
    features: plan.features,
  }));
});
```

Create a landing page redirect in `app/middleware/landing.ts`:

```typescript
export default defineNuxtRouteMiddleware((to) => {
  const { isLandingPage } = useRequestHeaders();
  
  // If accessing root on landing domain, show marketing content
  // Otherwise this middleware doesn't interfere
});
```

**Files to create:**
- `server/middleware/01.tenant.ts` (replaces original)
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

This automatically routes `localhost:3000` to the "demo" tenant database.

#### Option B: Query Parameter Override

Support tenant switching via query parameter for testing:

```typescript
// In resolveRouting() function
if (hostname === "localhost" || hostname === "127.0.0.1") {
  // Check for query param override (dev only)
  const url = new URL(event.node.req.url || "", `http://${host}`);
  const tenantParam = url.searchParams.get("tenant");
  if (tenantParam) {
    return { type: "tenant", subdomain: tenantParam };
  }
  
  // Fall back to env default
  const defaultTenant = process.env.DEFAULT_TENANT_SLUG;
  if (defaultTenant) {
    return { type: "tenant", subdomain: defaultTenant };
  }
  
  return { type: "portal" };
}
```

**Usage:**
```
http://localhost:3000?tenant=acme    → ACME's database
http://localhost:3000?tenant=beta    → Beta's database
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

Update middleware to recognize `.local` domain:

```typescript
// In resolveRouting()
if (hostname.endsWith(".local")) {
  const parts = hostname.replace(".local", "").split(".");
  if (parts.length >= 2) {
    return { type: "tenant", subdomain: parts[0] };
  }
}
```

### Development Tenant Seeding

Create `scripts/seed-dev-tenants.ts`:

```typescript
import { getControlPlanePrisma } from "../server/utils/prisma-control";

async function seedDevTenants() {
  const prisma = getControlPlanePrisma();
  
  // Create demo tenant
  await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      slug: "demo",
      name: "Demo Company",
      database_host: process.env.DEV_DB_HOST || "localhost",
      database_port: 5432,
      database_name: "stockapp_demo",
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
  
  // Create test tenant for multi-tenant testing
  await prisma.tenant.upsert({
    where: { slug: "test" },
    update: {},
    create: {
      slug: "test",
      name: "Test Company",
      database_host: process.env.DEV_DB_HOST || "localhost",
      database_port: 5432,
      database_name: "stockapp_test",
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

```markdown
## Local Development Setup

1. Set up Control Plane database:
   ```bash
   createdb stockapp_control
   pnpm db:push --schema=prisma/control-plane.prisma
   ```

2. Set up at least one tenant database:
   ```bash
   createdb stockapp_demo
   pnpm db:push
   ```

3. Seed dev tenants:
   ```bash
   pnpm dev:seed
   ```

4. Configure environment:
   ```env
   # .env.development
   CONTROL_PLANE_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stockapp_control"
   DEFAULT_TENANT_SLUG="demo"
   ```

5. Start development:
   ```bash
   pnpm dev
   ```

6. Access application:
   - Default tenant: http://localhost:3000
   - Switch tenant: http://localhost:3000?tenant=test
```

**Files to create:**
- `scripts/seed-dev-tenants.ts`
- `scripts/reset-dev-tenants.ts`
- `docs/LOCAL_DEVELOPMENT.md`

---

## Phase 5: Tenant Connection Manager (Week 3-4)

### Connection Pool Architecture

Create `server/utils/tenant-connection.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import { getControlPlanePrisma } from "./prisma-control";

interface TenantConnection {
  prisma: PrismaClient;
  lastAccessed: Date;
  tenantId: string;
}

class TenantConnectionManager {
  private connections = new Map<string, TenantConnection>();
  private maxConnections = 50;
  private idleTimeoutMs = 5 * 60 * 1000;

  async getConnection(tenantId: string): Promise<PrismaClient> {
    // Check cache
    const cached = this.connections.get(tenantId);
    if (cached) {
      cached.lastAccessed = new Date();
      return cached.prisma;
    }

    // Fetch tenant config from control plane
    const controlPrisma = getControlPlanePrisma();
    const tenant = await controlPrisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant || tenant.status !== "ACTIVE") {
      throw new Error("Tenant not found or inactive");
    }

    // Create new connection
    const connectionUrl = this.buildConnectionUrl(tenant);
    const prisma = new PrismaClient({
      datasources: { db: { url: connectionUrl } }
    });

    // Evict if at capacity
    if (this.connections.size >= this.maxConnections) {
      this.evictOldest();
    }

    this.connections.set(tenantId, {
      prisma,
      lastAccessed: new Date(),
      tenantId
    });

    return prisma;
  }

  private buildConnectionUrl(tenant: Tenant): string {
    const password = decrypt(tenant.database_password);
    return `postgresql://${tenant.database_user}:${password}@${tenant.database_host}:${tenant.database_port}/${tenant.database_name}?sslmode=require&pgbouncer=true`;
  }
  
  private evictOldest(): void {
    let oldest: { key: string; time: Date } | null = null;
    
    for (const [key, conn] of this.connections) {
      if (!oldest || conn.lastAccessed < oldest.time) {
        oldest = { key, time: conn.lastAccessed };
      }
    }
    
    if (oldest) {
      const conn = this.connections.get(oldest.key);
      conn?.prisma.$disconnect();
      this.connections.delete(oldest.key);
    }
  }
  
  // Cleanup idle connections (call periodically)
  async cleanupIdle(): Promise<void> {
    const now = Date.now();
    
    for (const [key, conn] of this.connections) {
      if (now - conn.lastAccessed.getTime() > this.idleTimeoutMs) {
        await conn.prisma.$disconnect();
        this.connections.delete(key);
      }
    }
  }
}

export const connectionManager = new TenantConnectionManager();

export async function getTenantPrisma(event: H3Event): Promise<PrismaClient> {
  const tenantId = event.context.tenantId;
  if (!tenantId) {
    throw createError({ statusCode: 400, message: "Tenant context required" });
  }
  return connectionManager.getConnection(tenantId);
}
```

**Files to create:**
- `server/utils/tenant-connection.ts`
- `server/utils/encryption.ts` (for password encryption)

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
    include: { locations: true }
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
      locations: user.locations.map(l => l.location_id)
    },
    tenant: {
      id: event.context.tenant.id,
      slug: event.context.tenant.slug,
      name: event.context.tenant.name,
      features: event.context.tenant.features,
      settings: event.context.tenant.settings,
      branding: event.context.tenant.branding,
      plan: event.context.tenant.plan,
    }
  });

  return { success: true };
});
```

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

**Files to modify:**
- `server/api/auth/login.post.ts`
- `server/middleware/auth.ts`
- `app/stores/auth.ts`
- `shared/types/session.ts`

---

## Phase 7: API Route Migration (Week 5-7)

### Migration Pattern

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

### Routes to Migrate (103+ files)

**Tier 1 - Core Transactions (Priority):**
- `server/api/locations/[id]/deliveries/*.ts`
- `server/api/locations/[id]/issues/*.ts`
- `server/api/transfers/*.ts`
- `server/api/prfs/*.ts`
- `server/api/pos/*.ts`

**Tier 2 - Master Data:**
- `server/api/items/*.ts`
- `server/api/suppliers/*.ts`
- `server/api/locations/*.ts`
- `server/api/users/*.ts`

**Tier 3 - Supporting:**
- `server/api/periods/*.ts`
- `server/api/ncrs/*.ts`
- `server/api/reports/*.ts`
- `server/api/dashboard/*.ts`

---

## Phase 8: Tenant Provisioning (Week 7-8)

### Provisioning Workflow

```
1. POST /api/admin/tenants
   { slug: "acme", name: "ACME Corp", owner_email: "admin@acme.com" }
                     │
                     ▼
2. Control Plane: Create tenant record (status: PENDING)
                     │
                     ▼
3. Database Provisioning (background job):
   - Option A: Create schema in shared Supabase project
   - Option B: Create dedicated Supabase project (Enterprise)
                     │
                     ▼
4. Run Prisma migrations on new database
                     │
                     ▼
5. Seed initial data (admin user, default period)
                     │
                     ▼
6. Update status to ACTIVE, send welcome email
```

### Supabase Strategy

| Plan | Database Strategy | Cost |
|------|------------------|------|
| Starter/Pro | Shared project, separate schemas | ~$0-2/tenant |
| Enterprise | Dedicated Supabase project | $25+/tenant |

**Files to create:**
- `server/api/admin/tenants/index.post.ts`
- `server/api/admin/tenants/[id]/provision.post.ts`
- `server/jobs/provision-tenant.ts`

---

## Phase 9: Migration Management (Week 8-9)

### Multi-Tenant Migration Script

Create `scripts/migrate-all-tenants.ts`:

```typescript
async function migrateAllTenants(targetVersion: string) {
  const controlPrisma = getControlPlanePrisma();
  const tenants = await controlPrisma.tenant.findMany({
    where: { status: "ACTIVE" }
  });

  for (const tenant of tenants) {
    if (tenant.schema_version === targetVersion) continue;

    const connectionUrl = buildConnectionUrl(tenant);
    await execAsync(`DATABASE_URL="${connectionUrl}" npx prisma migrate deploy`);

    await controlPrisma.tenant.update({
      where: { id: tenant.id },
      data: { schema_version: targetVersion }
    });
  }
}
```

**Files to create:**
- `scripts/migrate-all-tenants.ts`
- `scripts/migrate-single-tenant.ts`

---

## Phase 10: Billing Integration (Week 9-10)

### Stripe Integration

**New routes:**
- `server/api/billing/subscription.get.ts`
- `server/api/billing/checkout.post.ts`
- `server/api/billing/portal.post.ts`
- `server/api/billing/webhook.post.ts`

---

## Critical Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `prisma/control-plane.prisma` | NEW | Central tenant management schema |
| `server/utils/prisma-control.ts` | NEW | Control plane Prisma client |
| `server/utils/tenant-connection.ts` | NEW | Connection pool manager |
| `server/utils/tenant-features.ts` | NEW | Feature flag utilities |
| `server/middleware/01.tenant.ts` | NEW | Tenant resolution + landing page routing |
| `shared/types/features.ts` | NEW | Feature/settings type definitions |
| `app/composables/useFeatures.ts` | NEW | Client-side feature checks |
| `scripts/seed-dev-tenants.ts` | NEW | Development tenant seeding |
| `server/api/auth/login.post.ts` | MODIFY | Tenant-aware login |
| `server/middleware/auth.ts` | MODIFY | Include tenant in session |
| `app/stores/auth.ts` | MODIFY | Add TenantContext to session |
| All 103+ API routes | MODIFY | Use `getTenantPrisma(event)` |

---

## Environment Variables

```env
# Control Plane Database
CONTROL_PLANE_DATABASE_URL="postgresql://..."

# Encryption
TENANT_SECRETS_KEY="base64-encoded-32-byte-key"

# Connection Pool
MAX_TENANT_CONNECTIONS=50
TENANT_CONNECTION_IDLE_TIMEOUT_MS=300000

# Routing
ENABLE_TENANT_SUBDOMAIN_ROUTING=true
DEFAULT_TENANT_SLUG="demo"

# Domain Configuration
APP_DOMAIN="stockapp.com"
MARKETING_SITE_URL="https://www.stockapp.com"

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Verification Plan

1. Create two test tenants (acme, beta)
2. Verify acme.stockapp.com only shows ACME data
3. Verify beta.stockapp.com only shows Beta data
4. Verify cross-tenant API access is blocked
5. Test tenant provisioning workflow
6. Test migration across all tenants
7. Load test with 50+ concurrent tenants
8. **NEW:** Verify feature flags work per tenant
9. **NEW:** Verify local development with multiple tenants
10. **NEW:** Verify landing page routes correctly

---

## Subscription Tiers

| Tier | Users | Locations | Database | Price/mo | Key Features |
|------|-------|-----------|----------|----------|--------------|
| FREE | 2 | 1 | Shared | $0 | Basic stock management |
| STARTER | 5 | 2 | Shared | $49 | + Transfers, Email notifications |
| PROFESSIONAL | 15 | 5 | Shared | $149 | + PRF/PO, Reports, PDF export |
| ENTERPRISE | Unlimited | Unlimited | Dedicated | Custom | + Custom workflows, Branding, SLA |

---

## Appendix A: Feature Flag Decision Matrix

| Customer Request | Approach | Effort |
|-----------------|----------|--------|
| Hide a module | Feature flag | Low |
| Add custom field | JSON metadata column | Low-Medium |
| Different default values | Tenant settings | Low |
| Custom branding/colors | Tenant branding | Low |
| Different approval workflow | Feature flag + conditional logic | Medium |
| Completely different business logic | Enterprise custom branch | High |
| On-premise deployment | Separate deployment | Very High |

---

## Appendix B: Local Development Quick Reference

```bash
# Start with default tenant
pnpm dev

# Start with specific tenant
DEFAULT_TENANT_SLUG=acme pnpm dev

# Switch tenant via URL
http://localhost:3000?tenant=beta

# Seed development tenants
pnpm dev:seed

# Reset all dev tenant data
pnpm dev:reset
```