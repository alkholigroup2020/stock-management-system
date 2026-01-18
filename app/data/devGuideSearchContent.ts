import type { SearchResult } from "~/composables/useDevGuideNav";

/**
 * Searchable content database for the Developer Guide
 * Contains all sections and their searchable content
 */
export const devGuideSearchContent: SearchResult[] = [
  // ============================================
  // Getting Started
  // ============================================
  {
    id: "gs-prerequisites",
    section: "Getting Started",
    sectionId: "getting-started",
    targetSection: "prerequisites",
    title: "Prerequisites",
    content:
      "Node.js 20+ required for Nuxt 4. pnpm package manager required. Git for version control. VS Code recommended with Vue and Prettier extensions.",
    icon: "i-heroicons-rocket-launch",
  },
  {
    id: "gs-installation",
    section: "Getting Started",
    sectionId: "getting-started",
    targetSection: "installation",
    title: "Installation",
    content:
      "Clone repository with git clone. Install dependencies with pnpm install. Copy .env.example to .env. Set DATABASE_URL, AUTH_SECRET, and other environment variables.",
    icon: "i-heroicons-rocket-launch",
  },
  {
    id: "gs-commands",
    section: "Getting Started",
    sectionId: "getting-started",
    targetSection: "commands",
    title: "Development Commands",
    content:
      "pnpm dev starts development server at localhost:3000. pnpm build creates production build. pnpm typecheck runs TypeScript type checking. pnpm format runs Prettier formatting. pnpm lint runs ESLint.",
    icon: "i-heroicons-rocket-launch",
  },
  {
    id: "gs-database",
    section: "Getting Started",
    sectionId: "getting-started",
    targetSection: "database",
    title: "Database Commands",
    content:
      "pnpm db:push syncs schema to database without migrations. pnpm db:migrate dev creates migration files. pnpm db:studio opens Prisma Studio GUI. Never use db:push in production.",
    icon: "i-heroicons-rocket-launch",
  },

  // ============================================
  // Architecture
  // ============================================
  {
    id: "arch-nuxt4",
    section: "Architecture",
    sectionId: "architecture",
    targetSection: "nuxt4",
    title: "Nuxt 4 Framework",
    content:
      "Project uses Nuxt 4 with /app/ directory structure instead of Nuxt 3's root structure. SPA mode with ssr: false for client-side rendering. Nitro server for API routes.",
    icon: "i-heroicons-squares-2x2",
  },
  {
    id: "arch-folders",
    section: "Architecture",
    sectionId: "architecture",
    targetSection: "folders",
    title: "Folder Structure",
    content:
      "/app/ contains frontend: pages, components, composables, stores, layouts. /server/ contains backend: api routes, middleware, utils. /shared/types/ for shared TypeScript interfaces. /prisma/ for database schema.",
    icon: "i-heroicons-squares-2x2",
  },
  {
    id: "arch-monolithic",
    section: "Architecture",
    sectionId: "architecture",
    targetSection: "monolithic",
    title: "Monolithic Architecture",
    content:
      "Single Nuxt application contains both frontend and API. No separate backend service. API routes deployed as Vercel serverless functions. Frontend and backend share types from /shared/types/.",
    icon: "i-heroicons-squares-2x2",
  },
  {
    id: "arch-techstack",
    section: "Architecture",
    sectionId: "architecture",
    targetSection: "techstack",
    title: "Tech Stack",
    content:
      "Nuxt 4 with Vue 3 Composition API. Nuxt UI component library. Tailwind CSS v4 for styling. Pinia for state management. Prisma ORM with PostgreSQL. nuxt-auth-utils for authentication. TypeScript with Zod validation.",
    icon: "i-heroicons-squares-2x2",
  },

  // ============================================
  // Authentication
  // ============================================
  {
    id: "auth-overview",
    section: "Authentication",
    sectionId: "authentication",
    targetSection: "overview",
    title: "Authentication Overview",
    content:
      "nuxt-auth-utils with JWT in httpOnly cookies. Session-based authentication. Pinia auth store for client state. Server middleware protects API routes. App initialization coordinates auth, location, and period loading.",
    icon: "i-heroicons-lock-closed",
  },
  {
    id: "auth-login",
    section: "Authentication",
    sectionId: "authentication",
    targetSection: "login-flow",
    title: "Login Flow",
    content:
      "Login page with Zod validation. POST /api/auth/login verifies credentials with bcrypt. setUserSession creates httpOnly session cookie. Post-login loads locations and period. Redirects to intended destination or dashboard.",
    icon: "i-heroicons-lock-closed",
  },
  {
    id: "auth-logout",
    section: "Authentication",
    sectionId: "authentication",
    targetSection: "logout-flow",
    title: "Logout Flow",
    content:
      "useAuth().logout() clears session. clearUserSession on server removes httpOnly cookie. Resets location and period stores. App re-initializes for login page.",
    icon: "i-heroicons-lock-closed",
  },
  {
    id: "auth-useauth",
    section: "Authentication",
    sectionId: "authentication",
    targetSection: "useauth-composable",
    title: "useAuth Composable",
    content:
      "user, isAuthenticated, loading, error state. isAdmin, isSupervisor, isOperator role checks. hasRole, hasAnyRole for flexible checks. hasLocationAccess, canPostAtLocation for location permissions. login, logout, fetchSession actions.",
    icon: "i-heroicons-lock-closed",
  },
  {
    id: "auth-middleware",
    section: "Authentication",
    sectionId: "authentication",
    targetSection: "middleware",
    title: "Route Protection Middleware",
    content:
      "auth.global.ts runs on every navigation. Redirects unauthenticated users to /login with redirect param. role.ts middleware for role-based access. definePageMeta with roleRequired or minRole. Server auth middleware protects /api/* routes.",
    icon: "i-heroicons-lock-closed",
  },
  {
    id: "auth-roles",
    section: "Authentication",
    sectionId: "authentication",
    targetSection: "roles-permissions",
    title: "Roles & Permissions",
    content:
      "OPERATOR basic operations at assigned locations. SUPERVISOR approvals and reconciliations at all locations. ADMIN full system access including user management. usePermissions composable for granular checks. Role hierarchy for minRole checks.",
    icon: "i-heroicons-lock-closed",
  },
  {
    id: "auth-password",
    section: "Authentication",
    sectionId: "authentication",
    targetSection: "password-security",
    title: "Password Security",
    content:
      "Minimum 8 characters. Requires uppercase, lowercase, number, special character. bcrypt with 10 salt rounds. validatePasswordStrength function returns strength level. Change password with current password verification.",
    icon: "i-heroicons-lock-closed",
  },
  {
    id: "auth-init",
    section: "Authentication",
    sectionId: "authentication",
    targetSection: "app-initialization",
    title: "App Initialization",
    content:
      "auth.client.ts plugin runs on startup. useAppInit coordinates loading sequence. Fetches session, then locations and period in parallel. isReady computed for app loading state. Post-login loading with setLoadingForPostLogin.",
    icon: "i-heroicons-lock-closed",
  },

  // ============================================
  // Database
  // ============================================
  {
    id: "db-overview",
    section: "Database",
    sectionId: "database",
    targetSection: "db-overview",
    title: "Database Overview",
    content:
      "PostgreSQL 15+ hosted on Supabase. Prisma ORM for type-safe database access. Connection pooling via Supabase Transaction Mode port 6543. Schema with 21 models and 14 enums.",
    icon: "i-heroicons-server-stack",
  },
  {
    id: "db-connection",
    section: "Database",
    sectionId: "database",
    targetSection: "db-connection",
    title: "Connection Configuration",
    content:
      "DATABASE_URL uses port 6543 for runtime with pgbouncer. DIRECT_URL uses port 5432 for migrations. Supabase Transaction pooler required for Prisma. SSL mode required.",
    icon: "i-heroicons-server-stack",
  },
  {
    id: "db-prisma-singleton",
    section: "Database",
    sectionId: "database",
    targetSection: "db-prisma-singleton",
    title: "Prisma Client Singleton",
    content:
      "Global singleton pattern in server/utils/prisma.ts prevents multiple instances during hot reloads. Development logging includes query, error, warn. Production logs errors only.",
    icon: "i-heroicons-server-stack",
  },
  {
    id: "db-schema",
    section: "Database",
    sectionId: "database",
    targetSection: "db-schema",
    title: "Schema Overview",
    content:
      "21 Prisma models: User, Location, UserLocation, Item, Supplier, Period, PeriodLocation, ItemPrice, LocationStock, PRF, PO, Delivery, DeliveryLine, Issue, IssueLine, Transfer, TransferLine, NCR, POB, Reconciliation, Approval. 14 enums for type safety.",
    icon: "i-heroicons-server-stack",
  },
  {
    id: "db-key-models",
    section: "Database",
    sectionId: "database",
    targetSection: "db-key-models",
    title: "Key Domain Models",
    content:
      "LocationStock composite key (location_id, item_id) with on_hand and WAC. ItemPrice locks prices per period. DeliveryLine stores unit_price and period_price for variance detection. Transfer tracks multi-location stock movement.",
    icon: "i-heroicons-server-stack",
  },
  {
    id: "db-utilities",
    section: "Database",
    sectionId: "database",
    targetSection: "db-utilities",
    title: "Business Logic Utilities",
    content:
      "calculateWAC in server/utils/wac.ts for weighted average cost. checkPriceVariance in priceVariance.ts detects price differences. calculateConsumption in reconciliation.ts for period-end calculations. WAC formula and business rules.",
    icon: "i-heroicons-server-stack",
  },
  {
    id: "db-api-patterns",
    section: "Database",
    sectionId: "database",
    targetSection: "db-api-patterns",
    title: "API Access Patterns",
    content:
      "Import prisma from server/utils/prisma. Use $transaction for batched reads and atomic writes. Interactive transactions with timeout for complex operations. Upsert for LocationStock updates. Include relations in queries. Error handling with Prisma error codes.",
    icon: "i-heroicons-server-stack",
  },
  {
    id: "db-commands",
    section: "Database",
    sectionId: "database",
    targetSection: "db-commands",
    title: "Database Commands",
    content:
      "pnpm db:push syncs schema without migrations (dev only). pnpm db:migrate dev creates migrations. pnpm db:studio opens Prisma GUI. pnpm db:seed seeds test data. Never use db:push in production.",
    icon: "i-heroicons-server-stack",
  },

  // ============================================
  // State Management
  // ============================================
  {
    id: "sm-overview",
    section: "State Management",
    sectionId: "state-management",
    targetSection: "pinia-overview",
    title: "Pinia Overview",
    content:
      "Pinia state management library for Vue 3. Auto-imported from /app/stores/. Composition API setup function pattern. defineStore with reactive refs, computed getters, and function actions.",
    icon: "i-heroicons-cube-transparent",
  },
  {
    id: "sm-auth-store",
    section: "State Management",
    sectionId: "state-management",
    targetSection: "auth-store",
    title: "Auth Store",
    content:
      "User authentication state with SessionUser interface. Role checks: isAdmin, isSupervisor, isOperator. Location access: hasLocationAccess, canPostAtLocation. Actions: login, logout, fetchSession.",
    icon: "i-heroicons-cube-transparent",
  },
  {
    id: "sm-location-store",
    section: "State Management",
    sectionId: "state-management",
    targetSection: "location-store",
    title: "Location Store",
    content:
      "Multi-location context with 5-minute cache. activeLocation, userLocations state. fetchUserLocations with caching. switchLocation action. LocationWithAccess interface for access levels.",
    icon: "i-heroicons-cube-transparent",
  },
  {
    id: "sm-period-store",
    section: "State Management",
    sectionId: "state-management",
    targetSection: "period-store",
    title: "Period Store",
    content:
      "Accounting period management with 10-minute cache. isPeriodOpen status check. periodDateRange formatted display. daysRemaining calculation. fetchCurrentPeriod with caching.",
    icon: "i-heroicons-cube-transparent",
  },
  {
    id: "sm-ui-store",
    section: "State Management",
    sectionId: "state-management",
    targetSection: "ui-store",
    title: "UI Store",
    content:
      "Application UI state: toasts, modals, sidebar. showSuccess, showError, showWarning, showInfo toast methods. openModal, closeModal for dialogs. toggleSidebar, toggleMobileSidebar for navigation.",
    icon: "i-heroicons-cube-transparent",
  },
  {
    id: "sm-composition",
    section: "State Management",
    sectionId: "state-management",
    targetSection: "store-composition",
    title: "Store Composition",
    content:
      "Cross-store communication patterns. Auth store coordinates Location and Period on login/logout. Parallel data loading with Promise.all. Store dependencies diagram. Reset pattern on logout.",
    icon: "i-heroicons-cube-transparent",
  },
  {
    id: "sm-reactive",
    section: "State Management",
    sectionId: "state-management",
    targetSection: "reactive-patterns",
    title: "Reactive Patterns",
    content:
      "storeToRefs for reactive destructuring. Computed properties from store state. Watching store changes. Common mistake: losing reactivity without storeToRefs. Actions don't need storeToRefs.",
    icon: "i-heroicons-cube-transparent",
  },
  {
    id: "sm-initialization",
    section: "State Management",
    sectionId: "state-management",
    targetSection: "app-initialization",
    title: "Store Initialization",
    content:
      "useAppInit composable flow. auth.client.ts plugin runs on startup. Fetches session then locations and period in parallel. Post-login loading pattern. Cache invalidation strategies.",
    icon: "i-heroicons-cube-transparent",
  },

  // ============================================
  // Caching System
  // ============================================
  {
    id: "cache-overview",
    section: "Caching System",
    sectionId: "caching-system",
    targetSection: "cache-overview",
    title: "Cache Architecture Overview",
    content:
      "Nuxt payload-based caching with useAsyncData. Time-based cache expiration. Filter-aware cache keys. Manual and smart invalidation. getCachedData function for custom TTL.",
    icon: "i-heroicons-square-3-stack-3d",
  },
  {
    id: "cache-categories",
    section: "Caching System",
    sectionId: "caching-system",
    targetSection: "cache-categories",
    title: "Cache Categories",
    content:
      "Locations, items, periods, suppliers, stock, transactions, dashboard cache categories. Cache key patterns. TTL values: 20 seconds for most data, 10 seconds for current period.",
    icon: "i-heroicons-square-3-stack-3d",
  },
  {
    id: "cache-useAsyncData",
    section: "Caching System",
    sectionId: "caching-system",
    targetSection: "useAsyncData-pattern",
    title: "useAsyncData with Timestamps",
    content:
      "useAsyncData getCachedData function. Timestamp-based cache validation. nuxtApp.payload.data storage. Filter-aware unique cache keys. Automatic refetch on filter change.",
    icon: "i-heroicons-square-3-stack-3d",
  },
  {
    id: "cache-useCache",
    section: "Caching System",
    sectionId: "caching-system",
    targetSection: "useCache",
    title: "useCache Composable",
    content:
      "Centralized cache management. invalidateLocations, invalidateItems, invalidatePeriods, invalidateStock, invalidateTransactions, invalidateDashboard. invalidateAll nuclear option. getCacheStats debugging.",
    icon: "i-heroicons-square-3-stack-3d",
  },
  {
    id: "cache-smart",
    section: "Caching System",
    sectionId: "caching-system",
    targetSection: "smart-cache",
    title: "Smart Cache Invalidation",
    content:
      "useSmartCacheInvalidation composable. afterDelivery, afterIssue, afterTransfer, afterPeriodClose, afterLocationReady, afterPriceChange, afterReconciliation. Automatic related cache invalidation.",
    icon: "i-heroicons-square-3-stack-3d",
  },
  {
    id: "cache-strategies",
    section: "Caching System",
    sectionId: "caching-system",
    targetSection: "invalidation-strategies",
    title: "Cache Invalidation Strategies",
    content:
      "When to invalidate caches. Category invalidation for master data CRUD. Smart invalidation for business operations. Call refresh after invalidation. Avoid invalidateAll unless necessary.",
    icon: "i-heroicons-square-3-stack-3d",
  },
  {
    id: "cache-period",
    section: "Caching System",
    sectionId: "caching-system",
    targetSection: "period-cache",
    title: "Current Period Cache",
    content:
      "Shorter TTL for critical data. 10 second expiration for current period. Auto-refresh option with interval. isPeriodOpen check before transactions. Period status validation.",
    icon: "i-heroicons-square-3-stack-3d",
  },
  {
    id: "cache-crud",
    section: "Caching System",
    sectionId: "caching-system",
    targetSection: "crud-example",
    title: "Complete CRUD Example",
    content:
      "Full CRUD with cache invalidation. Create, update, delete with invalidateLocationsCache. Smart invalidation with afterDelivery. Migration guide from direct $fetch to caching composables.",
    icon: "i-heroicons-square-3-stack-3d",
  },
  {
    id: "cache-debugging",
    section: "Caching System",
    sectionId: "caching-system",
    targetSection: "debugging",
    title: "Debugging Cache",
    content:
      "getCacheStats for cache statistics. Inspect nuxtApp.payload.data. Check cache age with timestamps. Common issues: stale data, data not updating, wrong data for filters, too many API calls.",
    icon: "i-heroicons-square-3-stack-3d",
  },

  // ============================================
  // Multi-Location
  // ============================================
  {
    id: "ml-location-model",
    section: "Multi-Location",
    sectionId: "multi-location",
    targetSection: "location-model",
    title: "Location Model & Types",
    content:
      "Location model is central entity with KITCHEN, STORE, CENTRAL, WAREHOUSE types. Each location has code, name, type, address, timezone. Relations to deliveries, issues, transfers, location_stock, user_locations.",
    icon: "i-heroicons-map-pin",
  },
  {
    id: "ml-location-stock",
    section: "Multi-Location",
    sectionId: "multi-location",
    targetSection: "location-stock",
    title: "LocationStock (Per-Location Inventory)",
    content:
      "LocationStock maintains per-location inventory with composite key location_id, item_id. Fields: on_hand quantity, wac (Weighted Average Cost), min_stock, max_stock thresholds. Stock is isolated per location.",
    icon: "i-heroicons-map-pin",
  },
  {
    id: "ml-user-location",
    section: "Multi-Location",
    sectionId: "multi-location",
    targetSection: "user-location",
    title: "User-Location Assignment",
    content:
      "UserLocation table controls access. OPERATOR only access assigned locations. SUPERVISOR and ADMIN have implicit access to all locations. assigned_at, assigned_by fields track who assigned access.",
    icon: "i-heroicons-map-pin",
  },
  {
    id: "ml-location-switching",
    section: "Multi-Location",
    sectionId: "multi-location",
    targetSection: "location-switching",
    title: "Location Switching UI",
    content:
      "Location Store manages activeLocationId, userLocations with 5-minute cache. LocationSwitcher component with type-specific icons and colors. switchLocation action. refreshNuxtData after switching.",
    icon: "i-heroicons-map-pin",
  },
  {
    id: "ml-location-context",
    section: "Multi-Location",
    sectionId: "multi-location",
    targetSection: "location-context",
    title: "Location Context in API Routes",
    content:
      "Server routes receive location context from middleware via event.context.locationId. All database operations scoped to location. Delivery, issue, transfer APIs use location context for stock updates.",
    icon: "i-heroicons-map-pin",
  },
  {
    id: "ml-access-middleware",
    section: "Multi-Location",
    sectionId: "multi-location",
    targetSection: "access-middleware",
    title: "Location Access Middleware",
    content:
      "location-access.ts middleware protects /api/locations/[id]/* routes. ADMIN/SUPERVISOR auto-access. OPERATOR checked via UserLocation table. Error codes: LOCATION_ACCESS_DENIED, LOCATION_NOT_FOUND, LOCATION_INACTIVE.",
    icon: "i-heroicons-map-pin",
  },
  {
    id: "ml-scoped-queries",
    section: "Multi-Location",
    sectionId: "multi-location",
    targetSection: "scoped-queries",
    title: "Location-Scoped Queries",
    content:
      "All queries scoped by location_id. LocationStock composite key queries. Delivery, issue filtered by location. Transfer has from_location_id and to_location_id. Database indexes optimize location queries.",
    icon: "i-heroicons-map-pin",
  },

  // ============================================
  // Deliveries & WAC
  // ============================================
  {
    id: "dw-delivery-model",
    section: "Deliveries & WAC",
    sectionId: "deliveries-wac",
    targetSection: "delivery-model",
    title: "Delivery Model",
    content:
      "Delivery model for inbound stock from suppliers. DeliveryLine stores item quantities, unit_price, period_price, price_variance. Status DRAFT or POSTED. delivery_no auto-generated DEL-YYYY-NNN. has_variance flag for price variances.",
    icon: "i-heroicons-truck",
  },
  {
    id: "dw-delivery-flow",
    section: "Deliveries & WAC",
    sectionId: "deliveries-wac",
    targetSection: "delivery-flow",
    title: "Delivery Creation Flow",
    content:
      "Deliveries can be DRAFT (editable, no stock impact) or POSTED (finalized with stock and WAC updates). DRAFT: no stock impact, can edit/delete, invoice_no optional. POSTED: stock updated, WAC recalculated, invoice_no required, period must be OPEN.",
    icon: "i-heroicons-truck",
  },
  {
    id: "dw-wac-calculation",
    section: "Deliveries & WAC",
    sectionId: "deliveries-wac",
    targetSection: "wac-calculation",
    title: "Weighted Average Cost (WAC)",
    content:
      "WAC calculation formula: newWAC = (currentQty × currentWAC + receivedQty × receiptPrice) / (currentQty + receivedQty). calculateWAC utility in server/utils/wac.ts. Only deliveries recalculate WAC. Issues deduct at current WAC.",
    icon: "i-heroicons-truck",
  },
  {
    id: "dw-price-variance",
    section: "Deliveries & WAC",
    sectionId: "deliveries-wac",
    targetSection: "price-variance",
    title: "Price Variance Detection",
    content:
      "Price variance detection compares unit_price (invoice) vs period_price (locked). checkPriceVariance utility in server/utils/priceVariance.ts. ANY variance triggers NCR creation (threshold = 0). Calculates variance, variancePercent, varianceAmount.",
    icon: "i-heroicons-truck",
  },
  {
    id: "dw-auto-ncr",
    section: "Deliveries & WAC",
    sectionId: "deliveries-wac",
    targetSection: "auto-ncr",
    title: "Auto-NCR Generation",
    content:
      "Automatic NCR creation for price variance. createPriceVarianceNCR utility. NCR type: PRICE_VARIANCE, auto_generated: true, status: OPEN. Links to delivery_id and delivery_line_id. NCR number format: NCR-YYYY-NNN.",
    icon: "i-heroicons-truck",
  },
  {
    id: "dw-posting-flow",
    section: "Deliveries & WAC",
    sectionId: "deliveries-wac",
    targetSection: "posting-flow",
    title: "Delivery Posting Flow",
    content:
      "Posting flow: validate inputs, batch fetch period prices and current stocks, process in $transaction. For each line: calculate WAC, check variance, create line, update stock (upsert), create NCR if variance. Transaction timeout 30 seconds.",
    icon: "i-heroicons-truck",
  },
  {
    id: "dw-stock-update",
    section: "Deliveries & WAC",
    sectionId: "deliveries-wac",
    targetSection: "stock-update",
    title: "Stock Update on Receipt",
    content:
      "Stock updated using Prisma upsert pattern. LocationStock: increment on_hand, update WAC. First receipt creates record with WAC = receipt price. Subsequent receipts update existing record with recalculated WAC. Atomic within transaction.",
    icon: "i-heroicons-truck",
  },
  {
    id: "dw-api-endpoint",
    section: "Deliveries & WAC",
    sectionId: "deliveries-wac",
    targetSection: "api-endpoint",
    title: "API Endpoint",
    content:
      "POST /api/locations/:id/deliveries endpoint. Zod validation for request body. Error codes: VALIDATION_ERROR, NO_OPEN_PERIOD, LOCATION_ACCESS_DENIED, SUPPLIER_NOT_FOUND, INVALID_ITEMS. Returns delivery with lines and auto-generated NCRs.",
    icon: "i-heroicons-truck",
  },
  {
    id: "dw-frontend",
    section: "Deliveries & WAC",
    sectionId: "deliveries-wac",
    targetSection: "frontend",
    title: "Frontend Integration",
    content:
      "Frontend patterns for delivery management. afterDelivery() from useSmartCacheInvalidation() is implemented. Recommended patterns for useDeliveries composable and DeliveryForm component with period validation, supplier select, line items.",
    icon: "i-heroicons-truck",
  },
  {
    id: "dw-business-rules",
    section: "Deliveries & WAC",
    sectionId: "deliveries-wac",
    targetSection: "business-rules",
    title: "Business Rules Summary",
    content:
      "Business rules: Deliveries update WAC (recalculate). Issues deduct at current WAC (no recalc). ANY price variance creates NCR. Posted deliveries immutable. Period must be OPEN for posting. DRAFT only visible to creator.",
    icon: "i-heroicons-truck",
  },

  // ============================================
  // Issues
  // ============================================
  {
    id: "iss-issue-model",
    section: "Issues",
    sectionId: "issues",
    targetSection: "issue-model",
    title: "Issue Model",
    content:
      "Issue model for outbound stock deductions. IssueLine stores item quantities, wac_at_issue, line_value. issue_no auto-generated ISS-YYYY-NNN. cost_centre for FOOD, CLEAN, or OTHER tracking.",
    icon: "i-heroicons-archive-box-arrow-down",
  },
  {
    id: "iss-cost-centre",
    section: "Issues",
    sectionId: "issues",
    targetSection: "cost-centre",
    title: "Cost Centre Tracking",
    content:
      "Cost centre tracking for consumption analysis. FOOD for food-related consumption, CLEAN for cleaning supplies, OTHER for miscellaneous. Enables reporting by category and cost per manday calculations.",
    icon: "i-heroicons-archive-box-arrow-down",
  },
  {
    id: "iss-wac-at-issue",
    section: "Issues",
    sectionId: "issues",
    targetSection: "wac-at-issue",
    title: "WAC at Issue Capture",
    content:
      "WAC captured at time of issue in wac_at_issue field. Issues do NOT recalculate WAC. line_value equals quantity times wac_at_issue. Preserves accurate cost for reporting and reconciliation.",
    icon: "i-heroicons-archive-box-arrow-down",
  },
  {
    id: "iss-stock-validation",
    section: "Issues",
    sectionId: "issues",
    targetSection: "stock-validation",
    title: "Stock Validation (No Negative)",
    content:
      "Critical business rule: never allow negative stock. Validate requestedQty less than or equal to on_hand. Check ALL items before processing ANY. Return specific item IDs that fail. INSUFFICIENT_STOCK error code.",
    icon: "i-heroicons-archive-box-arrow-down",
  },
  {
    id: "iss-posting-flow",
    section: "Issues",
    sectionId: "issues",
    targetSection: "posting-flow",
    title: "Issue Posting Flow",
    content:
      "Issue posting flow: validate period OPEN, start transaction, validate stock, generate issue number, create header, process lines, decrement stock, update totals. No draft state - all issues immediately posted.",
    icon: "i-heroicons-archive-box-arrow-down",
  },
  {
    id: "iss-stock-update",
    section: "Issues",
    sectionId: "issues",
    targetSection: "stock-update",
    title: "Stock Update Pattern",
    content:
      "Issues decrement stock with UPDATE operation. WAC remains unchanged. Different from deliveries which use UPSERT and recalculate WAC. Stock record must exist before issue. Atomic within transaction.",
    icon: "i-heroicons-archive-box-arrow-down",
  },
  {
    id: "iss-api-frontend",
    section: "Issues",
    sectionId: "issues",
    targetSection: "api-frontend",
    title: "API & Frontend",
    content:
      "POST /api/locations/:id/issues endpoint. useIssues composable pattern. IssueForm component with cost centre select, date picker, line items. afterIssue() cache invalidation. Error codes: INSUFFICIENT_STOCK, NO_OPEN_PERIOD.",
    icon: "i-heroicons-archive-box-arrow-down",
  },
  {
    id: "iss-reconciliation",
    section: "Issues",
    sectionId: "issues",
    targetSection: "reconciliation",
    title: "Reconciliation Impact",
    content:
      "Issues are key component of period-end reconciliation. Formula: Opening + Receipts + TransfersIn - TransfersOut - Issues - Adjustments = Closing. Issue totals by cost centre for reporting.",
    icon: "i-heroicons-archive-box-arrow-down",
  },
  {
    id: "iss-business-rules",
    section: "Issues",
    sectionId: "issues",
    targetSection: "business-rules",
    title: "Business Rules Summary",
    content:
      "Business rules: Never allow negative stock. Issues do NOT recalculate WAC. Period must be OPEN. Immediate posting, no draft state. Cost centre required. Audit trail with posted_by, posted_at, issue_no.",
    icon: "i-heroicons-archive-box-arrow-down",
  },

  // ============================================
  // Transfers
  // ============================================
  {
    id: "trf-transfer-model",
    section: "Transfers",
    sectionId: "transfers",
    targetSection: "transfer-model",
    title: "Transfer Model",
    content:
      "Transfer model for inter-location stock movements. TransferLine stores item quantities, wac_at_transfer, line_value. transfer_no auto-generated TRF-YYYY-NNN. Tracks from_location, to_location, requester, approver.",
    icon: "i-heroicons-arrows-right-left",
  },
  {
    id: "trf-status-workflow",
    section: "Transfers",
    sectionId: "transfers",
    targetSection: "status-workflow",
    title: "Status Workflow",
    content:
      "Transfer status workflow: DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, COMPLETED. Approval immediately executes stock movement. Only Supervisor or Admin can approve or reject transfers.",
    icon: "i-heroicons-arrows-right-left",
  },
  {
    id: "trf-approval-requirements",
    section: "Transfers",
    sectionId: "transfers",
    targetSection: "approval-requirements",
    title: "Approval Requirements",
    content:
      "Only Supervisor or Admin can approve or reject transfers. Operators can create transfers for assigned locations. Transfer must be in PENDING_APPROVAL status. Approval executes atomic stock movement.",
    icon: "i-heroicons-arrows-right-left",
  },
  {
    id: "trf-transfer-creation",
    section: "Transfers",
    sectionId: "transfers",
    targetSection: "transfer-creation",
    title: "Transfer Creation Flow",
    content:
      "Transfer creation validates locations are different, user access, items active, stock availability. Creates in PENDING_APPROVAL status. Stock validated at creation and re-validated at approval.",
    icon: "i-heroicons-arrows-right-left",
  },
  {
    id: "trf-stock-update",
    section: "Transfers",
    sectionId: "transfers",
    targetSection: "stock-update",
    title: "Stock Updates",
    content:
      "Upon approval, stock atomically moved from source to destination. Source WAC unchanged, only quantity decremented. Destination WAC recalculated or set to source WAC if no existing stock.",
    icon: "i-heroicons-arrows-right-left",
  },
  {
    id: "trf-wac-handling",
    section: "Transfers",
    sectionId: "transfers",
    targetSection: "wac-handling",
    title: "WAC Handling",
    content:
      "Source WAC captured at transfer creation in wac_at_transfer field. Source location WAC unchanged. Destination WAC recalculated using standard WAC formula with source WAC as receipt price.",
    icon: "i-heroicons-arrows-right-left",
  },
  {
    id: "trf-api-frontend",
    section: "Transfers",
    sectionId: "transfers",
    targetSection: "api-frontend",
    title: "API & Frontend",
    content:
      "POST /api/transfers creates transfer. PATCH /api/transfers/:id/approve approves and executes. PATCH /api/transfers/:id/reject rejects. afterTransfer() cache invalidation for both locations.",
    icon: "i-heroicons-arrows-right-left",
  },
  {
    id: "trf-reconciliation",
    section: "Transfers",
    sectionId: "transfers",
    targetSection: "reconciliation",
    title: "Reconciliation Impact",
    content:
      "Transfers affect reconciliation for both locations. TransfersIn added to destination. TransfersOut deducted from source. Formula: Opening + Receipts + TransfersIn - TransfersOut - Issues - Adjustments = Closing.",
    icon: "i-heroicons-arrows-right-left",
  },
  {
    id: "trf-business-rules",
    section: "Transfers",
    sectionId: "transfers",
    targetSection: "business-rules",
    title: "Business Rules Summary",
    content:
      "Business rules: Cannot transfer to same location. Stock validated at creation AND approval. Only Supervisor/Admin can approve. Source WAC unchanged. Atomic stock movement. Rejection is final.",
    icon: "i-heroicons-arrows-right-left",
  },

  // ============================================
  // Items Management
  // ============================================
  {
    id: "im-overview",
    section: "Items Management",
    sectionId: "items-management",
    targetSection: "overview",
    title: "Items Management Overview",
    content:
      "Items are the core inventory entities. Each item has code, name, description, unit of measure, category, status. Items can be ACTIVE or INACTIVE. Inactive items cannot be used in transactions.",
    icon: "i-heroicons-cube",
  },
  {
    id: "im-item-model",
    section: "Items Management",
    sectionId: "items-management",
    targetSection: "item-model",
    title: "Item Model",
    content:
      "Item model with code (unique), name, description, unit (KG, EA, LTR, BOX, CASE, PACK), category, status (ACTIVE/INACTIVE). Relations to LocationStock, ItemPrice, DeliveryLine, IssueLine, TransferLine.",
    icon: "i-heroicons-cube",
  },
  {
    id: "im-crud-operations",
    section: "Items Management",
    sectionId: "items-management",
    targetSection: "crud-operations",
    title: "CRUD Operations",
    content:
      "GET /api/items lists all items with pagination and filters. POST /api/items creates new item. PATCH /api/items/:id updates item. Items with stock cannot be deleted, only deactivated.",
    icon: "i-heroicons-cube",
  },
  {
    id: "im-price-management",
    section: "Items Management",
    sectionId: "items-management",
    targetSection: "price-management",
    title: "Price Management",
    content:
      "ItemPrice locks prices per period. Period prices used for variance detection. Price changes mid-period create NCRs. Prices copied to new period during roll-forward.",
    icon: "i-heroicons-cube",
  },

  // ============================================
  // NCR (Non-Conformance Reports)
  // ============================================
  {
    id: "ncr-model",
    section: "NCR",
    sectionId: "ncr",
    targetSection: "ncr-model",
    title: "NCR Model & Types",
    content:
      "NCR model for non-conformance reports. MANUAL for user-created NCRs, PRICE_VARIANCE for auto-generated from delivery price mismatch. ncr_no auto-generated NCR-YYYY-NNN. auto_generated flag distinguishes system vs user created. resolution_type and financial_impact fields for reconciliation integration.",
    icon: "i-heroicons-exclamation-triangle",
  },
  {
    id: "ncr-status-workflow",
    section: "NCR",
    sectionId: "ncr",
    targetSection: "status-workflow",
    title: "Status Workflow",
    content:
      "NCR status workflow: OPEN initial state, SENT to supplier, CREDITED supplier issued credit, REJECTED supplier rejected claim, RESOLVED internally resolved. Can skip SENT and go directly to RESOLVED.",
    icon: "i-heroicons-exclamation-triangle",
  },
  {
    id: "ncr-auto-generation",
    section: "NCR",
    sectionId: "ncr",
    targetSection: "auto-generation",
    title: "Auto-Generation (Price Variance)",
    content:
      "Automatic NCR creation when delivery price differs from period-locked price. checkPriceVariance compares unit_price vs period_price. ANY variance triggers NCR creation. createPriceVarianceNCR captures variance details.",
    icon: "i-heroicons-exclamation-triangle",
  },
  {
    id: "ncr-manual-creation",
    section: "NCR",
    sectionId: "ncr",
    targetSection: "manual-ncr",
    title: "Creating Manual NCRs",
    content:
      "POST /api/ncrs endpoint for manual NCR creation. User provides location, reason, value. Optional delivery link. Validates location access. Operators need explicit assignment. Supervisors and Admins have full access.",
    icon: "i-heroicons-exclamation-triangle",
  },
  {
    id: "ncr-resolution",
    section: "NCR",
    sectionId: "ncr",
    targetSection: "ncr-resolution",
    title: "NCR Resolution",
    content:
      "PATCH /api/ncrs/:id for status updates. Valid transitions enforced. CREDITED, REJECTED, RESOLVED are final states. resolved_at timestamp auto-set. resolution_notes for audit trail. When resolving to RESOLVED status, resolution_type and financial_impact are required. financial_impact determines reconciliation treatment: CREDIT reduces consumption, LOSS increases consumption, NONE has no effect.",
    icon: "i-heroicons-exclamation-triangle",
  },
  {
    id: "ncr-reconciliation-impact",
    section: "NCR",
    sectionId: "ncr",
    targetSection: "ncr-reconciliation-impact",
    title: "NCR Reconciliation Impact",
    content:
      "NCR status and financial_impact determine reconciliation treatment. CREDITED status or RESOLVED with CREDIT impact reduces consumption (credits). REJECTED status or RESOLVED with LOSS impact increases consumption (losses). SENT NCRs shown as pending credits. OPEN NCRs generate non-blocking warnings during period close. ncrCredits.ts utility calculates NCR summaries for periods.",
    icon: "i-heroicons-calculator",
  },
  {
    id: "ncr-financial-impact-enum",
    section: "NCR",
    sectionId: "ncr",
    targetSection: "ncr-reconciliation-impact",
    title: "NCRFinancialImpact Enum",
    content:
      "NCRFinancialImpact enum values: NONE for no financial adjustment, CREDIT for value recovered from supplier (reduces consumption), LOSS for value lost and absorbed (increases consumption). Required when resolving NCR to RESOLVED status.",
    icon: "i-heroicons-tag",
  },
  {
    id: "ncr-summary-api",
    section: "NCR",
    sectionId: "ncr",
    targetSection: "api-frontend",
    title: "NCR Summary API",
    content:
      "GET /api/ncrs/summary endpoint returns categorized NCR breakdown for period and location. Categories: credited (CREDITED or RESOLVED+CREDIT), losses (REJECTED or RESOLVED+LOSS), pending (SENT status), open (OPEN status). Used by reconciliation to show NCR credits and losses. Query params: periodId, locationId.",
    icon: "i-heroicons-chart-pie",
  },
  {
    id: "ncr-api-frontend",
    section: "NCR",
    sectionId: "ncr",
    targetSection: "api-frontend",
    title: "API & Frontend",
    content:
      "GET /api/ncrs list NCRs, POST /api/ncrs create manual NCR, GET /api/ncrs/:id details, PATCH /api/ncrs/:id update status. NCR number format NCR-YYYY-NNN. afterNCR cache invalidation pattern.",
    icon: "i-heroicons-exclamation-triangle",
  },
  {
    id: "ncr-business-rules",
    section: "NCR",
    sectionId: "ncr",
    targetSection: "business-rules",
    title: "Business Rules Summary",
    content:
      "Business rules: ANY price variance creates NCR. Auto-generated NCRs always link to delivery. Final states cannot be changed. resolved_at auto-set. Location access required. NCR number unique per year.",
    icon: "i-heroicons-exclamation-triangle",
  },

  // ============================================
  // Reconciliation
  // ============================================
  {
    id: "rec-reconciliation-model",
    section: "Reconciliation",
    sectionId: "reconciliation",
    targetSection: "reconciliation-model",
    title: "Reconciliation Model",
    content:
      "Reconciliation model stores period-end stock movement data per location. Tracks opening_stock, receipts, transfers_in, transfers_out, issues, closing_stock, and adjustment values. New fields ncr_credits and ncr_losses track NCR financial impact. Composite unique key on period_id and location_id.",
    icon: "i-heroicons-calculator",
  },
  {
    id: "rec-consumption-formula",
    section: "Reconciliation",
    sectionId: "reconciliation",
    targetSection: "consumption-formula",
    title: "Consumption Formula",
    content:
      "Consumption = Opening + Receipts + TransfersIn - TransfersOut - Closing + Adjustments. MandayCost = Consumption / TotalMandays. Key KPI for kitchen and store efficiency. Target manday cost helps budget planning.",
    icon: "i-heroicons-calculator",
  },
  {
    id: "rec-adjustment-types",
    section: "Reconciliation",
    sectionId: "reconciliation",
    targetSection: "adjustment-types",
    title: "Adjustment Types",
    content:
      "Back-charges add to consumption (supplier owes). Credits reduce consumption (refund expected). Condemnations reduce consumption (written off stock). Other adjustments can be positive or negative for miscellaneous corrections.",
    icon: "i-heroicons-calculator",
  },
  {
    id: "rec-ncr-integration",
    section: "Reconciliation",
    sectionId: "reconciliation",
    targetSection: "ncr-integration",
    title: "NCR Integration in Reconciliation",
    content:
      "NCR credits and losses are now included in reconciliation calculations. NCR credits (from CREDITED or RESOLVED+CREDIT NCRs) reduce consumption. NCR losses (from REJECTED or RESOLVED+LOSS NCRs) increase consumption. Updated formula: Consumption = Opening + Receipts + TransfersIn - TransfersOut - Closing + Adjustments - NCRCredits + NCRLosses. OpenNCRWarning component displays warnings about unresolved NCRs during period close.",
    icon: "i-heroicons-link",
  },
  {
    id: "rec-auto-calculation",
    section: "Reconciliation",
    sectionId: "reconciliation",
    targetSection: "auto-calculation",
    title: "Auto-Calculation",
    content:
      "When no saved reconciliation exists, values are auto-calculated from transactions. Opening from previous period closing, receipts from deliveries, transfers from completed transfers, closing from current LocationStock. Auto-calculated records must be confirmed.",
    icon: "i-heroicons-calculator",
  },
  {
    id: "rec-consolidated-view",
    section: "Reconciliation",
    sectionId: "reconciliation",
    targetSection: "consolidated-view",
    title: "Consolidated View",
    content:
      "GET /api/reconciliations/consolidated returns all locations for a period. Includes grand totals, average manday cost, summary of saved vs auto-calculated. SUPERVISOR/ADMIN only. Optimized with batched queries and lookup maps.",
    icon: "i-heroicons-calculator",
  },
  {
    id: "rec-reconciliation-report",
    section: "Reconciliation",
    sectionId: "reconciliation",
    targetSection: "reconciliation-report",
    title: "Reconciliation Report",
    content:
      "GET /api/reports/reconciliation generates management report. OPERATOR sees assigned locations only. SUPERVISOR/ADMIN see all locations. Includes consumption analysis, manday costs, grand totals.",
    icon: "i-heroicons-calculator",
  },
  {
    id: "rec-api-frontend",
    section: "Reconciliation",
    sectionId: "reconciliation",
    targetSection: "api-frontend",
    title: "API & Frontend",
    content:
      "POST /api/reconciliations saves adjustments. ReconciliationSummary component displays stock movement. AdjustmentsForm component for entering back-charges, credits, condemnations. afterReconciliation cache invalidation.",
    icon: "i-heroicons-calculator",
  },
  {
    id: "rec-period-close-integration",
    section: "Reconciliation",
    sectionId: "reconciliation",
    targetSection: "period-close-integration",
    title: "Period Close Integration",
    content:
      "Reconciliation must be confirmed before marking location READY for period close. Closing values captured in PeriodLocation snapshots. Roll-forward carries closing_stock to next period opening_stock.",
    icon: "i-heroicons-calculator",
  },
  {
    id: "rec-business-rules",
    section: "Reconciliation",
    sectionId: "reconciliation",
    targetSection: "business-rules",
    title: "Business Rules Summary",
    content:
      "Business rules: Opening stock auto-calculated from previous period. Closing stock is real-time from LocationStock. Adjustments must be non-negative. Only SUPERVISOR/ADMIN can save. Period must be OPEN to modify. Confirmation required before period close.",
    icon: "i-heroicons-calculator",
  },

  // ============================================
  // Period Management
  // ============================================
  {
    id: "pm-period-lifecycle",
    section: "Period Management",
    sectionId: "period-management",
    targetSection: "period-lifecycle",
    title: "Period Lifecycle",
    content:
      "Period lifecycle: DRAFT created not active, OPEN active for transactions, PENDING_CLOSE all locations ready, APPROVED admin approved close, CLOSED no more transactions. Period model with start_date, end_date, status, approval_id.",
    icon: "i-heroicons-calendar-days",
  },
  {
    id: "pm-period-location",
    section: "Period Management",
    sectionId: "period-management",
    targetSection: "period-location",
    title: "PeriodLocation Status Tracking",
    content:
      "PeriodLocation tracks per-location period status: OPEN allows transactions, READY marked for close, CLOSED with snapshot. Composite key period_id, location_id. Stores opening_value, closing_value, snapshot_data.",
    icon: "i-heroicons-calendar-days",
  },
  {
    id: "pm-price-locking",
    section: "Period Management",
    sectionId: "period-management",
    targetSection: "price-locking",
    title: "Price Locking Mechanism",
    content:
      "ItemPrice locks prices at period start. DeliveryLine compares unit_price vs period_price. Price variance auto-generates NCR with type PRICE_VARIANCE and auto_generated true. Unique constraint on item_id, period_id.",
    icon: "i-heroicons-calendar-days",
  },
  {
    id: "pm-period-store",
    section: "Period Management",
    sectionId: "period-management",
    targetSection: "period-store",
    title: "Current Period Store",
    content:
      "Period Store with 10-minute cache. Getters: hasPeriod, isPeriodOpen, periodName, periodStatus, periodDateRange, daysRemaining. Actions: fetchCurrentPeriod, refresh, invalidateCache, reset.",
    icon: "i-heroicons-calendar-days",
  },
  {
    id: "pm-period-validation",
    section: "Period Management",
    sectionId: "period-management",
    targetSection: "period-validation",
    title: "Period Validation in Transactions",
    content:
      "Validate period status before posting. validatePeriodOpen checks period.status OPEN. validateLocationPeriodOpen checks periodLocation.status. Error codes: PERIOD_CLOSED, LOCATION_PERIOD_CLOSED, PERIOD_NOT_FOUND.",
    icon: "i-heroicons-calendar-days",
  },
  {
    id: "pm-period-close",
    section: "Period Management",
    sectionId: "period-management",
    targetSection: "period-close",
    title: "Period Close Workflow",
    content:
      "Period close workflow: locations mark READY, all locations ready triggers PENDING_CLOSE, admin approves, atomic close captures snapshots. Approval entity_type PERIOD_CLOSE. Coordinated close across all locations.",
    icon: "i-heroicons-calendar-days",
  },
  {
    id: "pm-roll-forward",
    section: "Period Management",
    sectionId: "period-management",
    targetSection: "roll-forward",
    title: "Roll-Forward to New Period",
    content:
      "Roll-forward creates new period from closed period. closing_value becomes opening_value. Copies ItemPrice records. New period in DRAFT, admin activates to OPEN. Ensures continuity between periods.",
    icon: "i-heroicons-calendar-days",
  },
  {
    id: "pm-period-indicator",
    section: "Period Management",
    sectionId: "period-management",
    targetSection: "period-indicator",
    title: "Period Indicator UI",
    content:
      "PeriodIndicator component displays current period name, date range, status badge, days remaining. Uses periodStore getters. Badge color varies by status: success for OPEN, warning for PENDING_CLOSE.",
    icon: "i-heroicons-calendar-days",
  },

  // ============================================
  // POB (Persons on Board)
  // ============================================
  {
    id: "pob-model",
    section: "POB",
    sectionId: "pob",
    targetSection: "pob-model",
    title: "POB Model",
    content:
      "POB model for tracking daily personnel counts per location. crew_count for regular personnel, extra_count for visitors and guests. Unique constraint on period_id, location_id, date. Used for manday cost calculations in reconciliation.",
    icon: "i-heroicons-users",
  },
  {
    id: "pob-mandays-calculation",
    section: "POB",
    sectionId: "pob",
    targetSection: "mandays-calculation",
    title: "Mandays Calculation",
    content:
      "Total Mandays = SUM(crew_count + extra_count) for all days in period. Daily Total = crew_count + extra_count. Used for cost-per-manday KPI. crew_count for employees, extra_count for visitors and additional meals.",
    icon: "i-heroicons-users",
  },
  {
    id: "pob-cost-per-manday",
    section: "POB",
    sectionId: "pob",
    targetSection: "cost-per-manday",
    title: "Cost Per Manday",
    content:
      "MandayCost = Consumption / TotalMandays. Key performance indicator for kitchen and store efficiency. calculateMandayCost function in server/utils/reconciliation.ts. TotalMandays must be greater than zero.",
    icon: "i-heroicons-users",
  },
  {
    id: "pob-daily-entry",
    section: "POB",
    sectionId: "pob",
    targetSection: "daily-entry",
    title: "Daily POB Entry",
    content:
      "POB page for entering daily personnel counts. Auto-save on blur for seamless UX. Pre-populated dates for entire period. Live summary updates after each save. Period must be OPEN for editing.",
    icon: "i-heroicons-users",
  },
  {
    id: "pob-api-endpoints",
    section: "POB",
    sectionId: "pob",
    targetSection: "api-endpoints",
    title: "POB API Endpoints",
    content:
      "GET /api/locations/:id/pob fetches entries. POST /api/locations/:id/pob creates or updates entries using upsert pattern. PATCH /api/pob/:id updates single entry. Error codes: DATE_OUT_OF_PERIOD, PERIOD_CLOSED, NO_OPEN_PERIOD.",
    icon: "i-heroicons-users",
  },
  {
    id: "pob-frontend-components",
    section: "POB",
    sectionId: "pob",
    targetSection: "frontend-components",
    title: "POB Frontend Components",
    content:
      "POBTable component for date-by-date entry with auto-save. POBSummary component displays period info and total mandays. Saving indicator per row. Disabled state when period is not open.",
    icon: "i-heroicons-users",
  },
  {
    id: "pob-business-rules",
    section: "POB",
    sectionId: "pob",
    targetSection: "business-rules",
    title: "POB Business Rules",
    content:
      "One entry per location per day per period. Period must be OPEN for create/update. Date must be within period range. Non-negative integers only. Operators need UserLocation assignment. Upsert pattern handles create-or-update.",
    icon: "i-heroicons-users",
  },

  // ============================================
  // Data Fetching
  // ============================================
  {
    id: "dfc-overview",
    section: "Data Fetching",
    sectionId: "data-fetching",
    targetSection: "data-fetching-overview",
    title: "Data Fetching Overview",
    content:
      "Multi-layered data fetching: useAsyncData composables for caching, Pinia stores for app state, direct $fetch for mutations. Automatic caching with 10-20s TTL, loading state management, filter-aware cache keys, integration with cache invalidation.",
    icon: "i-heroicons-cloud-arrow-down",
  },
  {
    id: "dfc-useitems",
    section: "Data Fetching",
    sectionId: "data-fetching",
    targetSection: "useitems-pattern",
    title: "useItems Pattern",
    content:
      "Standard composable pattern demonstrated by useItems. useAsyncData with custom getCachedData, filter-aware cache keys, timestamp-based TTL, watch option for reactive filters, loading/error state management, manual refresh capability.",
    icon: "i-heroicons-cloud-arrow-down",
  },
  {
    id: "dfc-available",
    section: "Data Fetching",
    sectionId: "data-fetching",
    targetSection: "available-composables",
    title: "Available Composables",
    content:
      "Pre-built composables: useItems (catalog with stock), useSuppliers (vendors), useLocations (locations), useCurrentPeriod (10s cache), usePeriods (all periods), usePeriod (single period). All follow same pattern with time-based caching.",
    icon: "i-heroicons-cloud-arrow-down",
  },
  {
    id: "dfc-period-advanced",
    section: "Data Fetching",
    sectionId: "data-fetching",
    targetSection: "current-period-advanced",
    title: "useCurrentPeriod Advanced",
    content:
      "Advanced period composable features: Shorter TTL (10s) for critical data, optional auto-refresh polling, helper methods isLocationReady/areAllLocationsReady/getLocationStatus, computed properties isPeriodOpen/arePricesLocked for status checks.",
    icon: "i-heroicons-cloud-arrow-down",
  },
  {
    id: "dfc-crud",
    section: "Data Fetching",
    sectionId: "data-fetching",
    targetSection: "crud-composables",
    title: "CRUD with Composables",
    content:
      "CRUD pattern: Use composables for reads (GET), direct $fetch for mutations (POST/PATCH/DELETE). Always invalidate cache after mutations with invalidateItemsCache() and refresh(). Use smart cache invalidation for business operations.",
    icon: "i-heroicons-cloud-arrow-down",
  },
  {
    id: "dfc-direct-fetch",
    section: "Data Fetching",
    sectionId: "data-fetching",
    targetSection: "direct-fetch",
    title: "Direct $fetch Pattern",
    content:
      "Manual $fetch for mutations, real-time data, custom logic. Manual state management with loading ref and try/catch. Use for POST/PATCH/DELETE operations, one-off fetches, frequently changing data, complex query logic.",
    icon: "i-heroicons-cloud-arrow-down",
  },
  {
    id: "dfc-when-to-use",
    section: "Data Fetching",
    sectionId: "data-fetching",
    targetSection: "when-to-use",
    title: "When to Use What",
    content:
      "Use composables for: list/master data with caching, automatic loading/error states, filter-based caching, cache integration. Use direct $fetch for: mutations, non-cacheable data, complex/conditional queries, one-off operations, form submissions.",
    icon: "i-heroicons-cloud-arrow-down",
  },
  {
    id: "dfc-cache-integration",
    section: "Data Fetching",
    sectionId: "data-fetching",
    targetSection: "cache-integration-fetch",
    title: "Cache Integration",
    content:
      "Composables export invalidation helpers: invalidateItemsCache() for all items, invalidateItemCache(id) for specific item. Integration with useSmartCacheInvalidation for related cache invalidation after business operations like deliveries, transfers.",
    icon: "i-heroicons-cloud-arrow-down",
  },
  {
    id: "dfc-error-handling",
    section: "Data Fetching",
    sectionId: "data-fetching",
    targetSection: "error-handling-fetch",
    title: "Error Handling",
    content:
      "All composables return error ref. Use with useErrorHandler for user-friendly messages. Watch error for toast notifications. Retry with refresh() function. Display error state in template with fallback UI and retry button.",
    icon: "i-heroicons-cloud-arrow-down",
  },
  {
    id: "dfc-pagination",
    section: "Data Fetching",
    sectionId: "data-fetching",
    targetSection: "pagination-fetch",
    title: "Pagination Pattern",
    content:
      "Include page/limit in filters. Use watch: true for automatic refetch on page change. Reset to page 1 when filters change. onPageChange updates filter, composable auto-refetches. Pagination meta returned in response.",
    icon: "i-heroicons-cloud-arrow-down",
  },
  {
    id: "dfc-real-world",
    section: "Data Fetching",
    sectionId: "data-fetching",
    targetSection: "real-world-fetch",
    title: "Real-World Example",
    content:
      "Complete items page implementation: useItems with watch: true, filters for search/pagination, CRUD operations with $fetch, cache invalidation after mutations, error handling with useErrorHandler, loading states, debounced search.",
    icon: "i-heroicons-cloud-arrow-down",
  },
  {
    id: "dfc-migration",
    section: "Data Fetching",
    sectionId: "data-fetching",
    targetSection: "migration-fetch",
    title: "Migration Guide",
    content:
      "Migrate from manual $fetch to composables: Remove manual loading/error refs, remove onMounted fetch call, remove watch for filters. Replace with single useItems(filters, { watch: true }). Reduces code from 20+ lines to 3 lines.",
    icon: "i-heroicons-cloud-arrow-down",
  },
  {
    id: "dfc-best-practices",
    section: "Data Fetching",
    sectionId: "data-fetching",
    targetSection: "best-practices-fetch",
    title: "Best Practices",
    content:
      "Do: Use composables for list/master data, enable watch for reactive filters, call invalidation after mutations, use smart cache for operations. Don't: Use composables for mutations, forget cache invalidation, use for real-time data, forget watch: true for filters.",
    icon: "i-heroicons-cloud-arrow-down",
  },

  // ============================================
  // Server API Patterns
  // ============================================
  {
    id: "sap-route-conventions",
    section: "Server API Patterns",
    sectionId: "server-api",
    targetSection: "route-conventions",
    title: "API Route Conventions",
    content:
      "Server API routes follow Nitro/H3 file-based routing. File names determine HTTP method and URL path. index.get.ts for collections, [id].patch.ts for dynamic params, login.post.ts for actions. Nested folders create nested URL paths.",
    icon: "i-heroicons-server",
  },
  {
    id: "sap-event-handler",
    section: "Server API Patterns",
    sectionId: "server-api",
    targetSection: "event-handler",
    title: "defineEventHandler Patterns",
    content:
      "All API routes export defineEventHandler with event object. Access user via event.context.user. Get route params with getRouterParam. Read query with getQuery. Parse body with readBody. Return JSON responses directly.",
    icon: "i-heroicons-server",
  },
  {
    id: "sap-zod-validation",
    section: "Server API Patterns",
    sectionId: "server-api",
    targetSection: "zod-validation",
    title: "Request Validation with Zod",
    content:
      "All request bodies validated with Zod schemas. Use transform for normalization like uppercase codes. Add custom error messages. Use uuid for IDs, enum for predefined values. Catch ZodError and throw VALIDATION_ERROR.",
    icon: "i-heroicons-server",
  },
  {
    id: "sap-create-error",
    section: "Server API Patterns",
    sectionId: "server-api",
    targetSection: "create-error",
    title: "Error Handling with createError",
    content:
      "Use createError from H3 for structured errors. Include statusCode, statusMessage, data.code, data.message, and optional data.details. Common codes: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Internal Error.",
    icon: "i-heroicons-server",
  },
  {
    id: "sap-error-codes",
    section: "Server API Patterns",
    sectionId: "server-api",
    targetSection: "error-codes",
    title: "Standard Error Codes",
    content:
      "Consistent error codes: NOT_AUTHENTICATED, INSUFFICIENT_PERMISSIONS, LOCATION_ACCESS_DENIED, VALIDATION_ERROR, INSUFFICIENT_STOCK, PERIOD_CLOSED, NO_OPEN_PERIOD, PRICE_VARIANCE, NOT_FOUND, DUPLICATE_CODE, INTERNAL_ERROR.",
    icon: "i-heroicons-server",
  },
  {
    id: "sap-response-format",
    section: "Server API Patterns",
    sectionId: "server-api",
    targetSection: "response-format",
    title: "Response Format Standards",
    content:
      "Success responses include resource and message. Lists include pagination with page, limit, total. Complex operations include side effects like auto-created NCRs. Error responses use createError with code and message.",
    icon: "i-heroicons-server",
  },
  {
    id: "sap-transactions",
    section: "Server API Patterns",
    sectionId: "server-api",
    targetSection: "transactions",
    title: "Prisma Transactions in Routes",
    content:
      "Use $transaction([]) for batched reads in single round-trip. Use $transaction(async tx) for atomic writes with rollback. Set timeout for complex operations. Use upsert for insert-or-update patterns.",
    icon: "i-heroicons-server",
  },
  {
    id: "sap-auth-context",
    section: "Server API Patterns",
    sectionId: "server-api",
    targetSection: "auth-context",
    title: "Auth Context (event.context.user)",
    content:
      "Auth middleware attaches user to event.context.user. Access user.id, user.username, user.email, user.role (OPERATOR, SUPERVISOR, ADMIN), user.default_location_id. Check role hierarchy for permissions.",
    icon: "i-heroicons-server",
  },
  {
    id: "sap-auth-middleware",
    section: "Server API Patterns",
    sectionId: "server-api",
    targetSection: "auth-middleware",
    title: "Auth Middleware",
    content:
      "Auth middleware protects all /api/* routes automatically. Public routes excluded: /api/auth/login, /api/auth/logout, /api/auth/session, /api/health. Uses getUserSession from nuxt-auth-utils. Throws 401 if not authenticated.",
    icon: "i-heroicons-server",
  },
  {
    id: "sap-location-middleware",
    section: "Server API Patterns",
    sectionId: "server-api",
    targetSection: "location-middleware",
    title: "Location Access Middleware",
    content:
      "Location middleware controls access to /api/locations/[id]/* routes. ADMIN and SUPERVISOR have access to all locations implicitly. OPERATOR requires UserLocation assignment. Throws LOCATION_ACCESS_DENIED error.",
    icon: "i-heroicons-server",
  },
  {
    id: "sap-complete-example",
    section: "Server API Patterns",
    sectionId: "server-api",
    targetSection: "complete-example",
    title: "Complete API Example",
    content:
      "Complete API handler flow: check authentication, check authorization, validate request body with Zod, business logic validation, database operation, return success response, handle Zod errors, re-throw known errors, catch unexpected errors.",
    icon: "i-heroicons-server",
  },

  // ============================================
  // Forms & Validation
  // ============================================
  {
    id: "fv-forms-overview",
    section: "Forms & Validation",
    sectionId: "forms-validation",
    targetSection: "forms-overview",
    title: "Forms Overview",
    content:
      "Form handling with Nuxt UI components and Zod validation. Two patterns: Manual Validation (full control, field-by-field) and UForm Component (simplified, automatic). Both use Zod schemas matching API validation.",
    icon: "i-heroicons-clipboard-document-check",
  },
  {
    id: "fv-nuxt-ui-components",
    section: "Forms & Validation",
    sectionId: "forms-validation",
    targetSection: "nuxt-ui-components",
    title: "Nuxt UI Form Components",
    content:
      "UInput for text input with size, icons, error states. USelectMenu for dropdowns with options array. UTextarea for multi-line text. UButton for submit with loading state. UForm wrapper with schema validation. UFormField with label, help text, error display.",
    icon: "i-heroicons-clipboard-document-check",
  },
  {
    id: "fv-zod-validation",
    section: "Forms & Validation",
    sectionId: "forms-validation",
    targetSection: "zod-validation",
    title: "Zod Schema Validation",
    content:
      "Zod schemas for validation matching API rules. String min, max, optional. Enum for constrained values. Transform for automatic normalization like uppercase. Custom error messages. Schemas defined at component top level.",
    icon: "i-heroicons-clipboard-document-check",
  },
  {
    id: "fv-manual-validation",
    section: "Forms & Validation",
    sectionId: "forms-validation",
    targetSection: "manual-validation",
    title: "Manual Validation Pattern",
    content:
      "Full control over validation timing. validateField on blur for single field. validateForm before submission. Reactive errors object. Used for complex forms with custom logic. Items and locations pages use this pattern.",
    icon: "i-heroicons-clipboard-document-check",
  },
  {
    id: "fv-uform-pattern",
    section: "Forms & Validation",
    sectionId: "forms-validation",
    targetSection: "uform-pattern",
    title: "UForm Component Pattern",
    content:
      "Simplified form handling with UForm component. Automatic validation on submit. UFormField wrappers with built-in error display. No manual errors object needed. Less boilerplate. Used in suppliers and users pages.",
    icon: "i-heroicons-clipboard-document-check",
  },
  {
    id: "fv-form-submission",
    section: "Forms & Validation",
    sectionId: "forms-validation",
    targetSection: "form-submission",
    title: "Form Submission Patterns",
    content:
      "Validate, set isSubmitting, prepare data, call API with $fetch, invalidate cache, show success toast, navigate to list, handle errors, reset isSubmitting in finally. Both patterns follow same flow.",
    icon: "i-heroicons-clipboard-document-check",
  },
  {
    id: "fv-error-display",
    section: "Forms & Validation",
    sectionId: "forms-validation",
    targetSection: "error-display",
    title: "Error Display Patterns",
    content:
      "Field-level errors with red border and error text. Toast notifications for API errors. Map server VALIDATION_ERROR details to form fields. Handle specific error codes: DUPLICATE_CODE, INSUFFICIENT_PERMISSIONS. Type guards for error structure.",
    icon: "i-heroicons-clipboard-document-check",
  },
  {
    id: "fv-loading-states",
    section: "Forms & Validation",
    sectionId: "forms-validation",
    targetSection: "loading-states",
    title: "Loading States",
    content:
      "Submit button with :loading prop for spinner. Change button text during submission. Disable submit button and all form fields during submission. Disable submit when form invalid. Use finally block to reset loading state.",
    icon: "i-heroicons-clipboard-document-check",
  },
  {
    id: "fv-cancel-confirmation",
    section: "Forms & Validation",
    sectionId: "forms-validation",
    targetSection: "cancel-confirmation",
    title: "Cancel Confirmation",
    content:
      "Confirm before discarding unsaved changes. Check if form has been modified. Show UiConfirmModal with variant warning. Provide clear actions: Discard vs Keep Editing. Navigate immediately if form is pristine.",
    icon: "i-heroicons-clipboard-document-check",
  },
  {
    id: "fv-form-state-management",
    section: "Forms & Validation",
    sectionId: "forms-validation",
    targetSection: "form-state-management",
    title: "Form State Management",
    content:
      "Use reactive() for form data and errors objects. Use ref() for isSubmitting boolean. Create computed isFormValid to enable/disable submit. Check both field presence and absence of errors. Reset errors on successful submission.",
    icon: "i-heroicons-clipboard-document-check",
  },
  {
    id: "fv-field-specific-patterns",
    section: "Forms & Validation",
    sectionId: "forms-validation",
    targetSection: "field-specific-patterns",
    title: "Field-Specific Patterns",
    content:
      "Uppercase codes with @input transform or Zod transform. Required fields with red asterisk. Help text below field when no error. Icons on UInput for visual context. Size lg for better touch targets. Placeholder with example values.",
    icon: "i-heroicons-clipboard-document-check",
  },
  {
    id: "fv-best-practices",
    section: "Forms & Validation",
    sectionId: "forms-validation",
    targetSection: "best-practices",
    title: "Best Practices Summary",
    content:
      "Match Zod schemas to API validation. Show field errors on blur. Disable submit when invalid. Show loading states. Disable fields during submission. Invalidate cache after mutations. Handle specific error codes. Confirm before discarding changes. Use cursor-pointer on buttons.",
    icon: "i-heroicons-clipboard-document-check",
  },

  // ============================================
  // Component Patterns
  // ============================================
  {
    id: "cp-naming-conventions",
    section: "Component Patterns",
    sectionId: "component-patterns",
    targetSection: "naming-conventions",
    title: "Naming Conventions",
    content:
      "Nuxt 4 component auto-import naming. Subdirectory components combine folder path + filename. layout/AppNavbar.vue becomes LayoutAppNavbar. Root components use name directly. PascalCase for files. Feature grouping in subdirectories.",
    icon: "i-heroicons-puzzle-piece",
  },
  {
    id: "cp-layout-components",
    section: "Component Patterns",
    sectionId: "component-patterns",
    targetSection: "layout-components",
    title: "Layout Components",
    content:
      "PageHeader with title, subtitle, location/period context, action slot. LocationSwitcher dropdown for switching active location with refreshNuxtData. PeriodIndicator shows period name, status badge, days remaining. HierarchicalNav for sidebar navigation.",
    icon: "i-heroicons-puzzle-piece",
  },
  {
    id: "cp-common-components",
    section: "Component Patterns",
    sectionId: "component-patterns",
    targetSection: "common-components",
    title: "Common UI Components",
    content:
      "EmptyState with icon, title, description, action button. ErrorAlert for error, warning, info, success messages with retry and dismiss. LoadingSpinner with text, size, color, fullScreen options. Reusable across the application.",
    icon: "i-heroicons-puzzle-piece",
  },
  {
    id: "cp-loading-states",
    section: "Component Patterns",
    sectionId: "component-patterns",
    targetSection: "loading-states",
    title: "Loading States",
    content:
      "LoadingSpinner sizes sm, md, lg, xl. Colors primary, secondary, neutral. Full screen overlay option. Center content vertically. Custom icon support. Loading text display. Always provide feedback for operations over 300ms.",
    icon: "i-heroicons-puzzle-piece",
  },
  {
    id: "cp-modal-components",
    section: "Component Patterns",
    sectionId: "component-patterns",
    targetSection: "modal-components",
    title: "Modal Components",
    content:
      "ConfirmModal for confirmation dialogs. Variants: danger, warning, info, success. v-model support for open state. Loading state during async operations. Always use for destructive actions like delete, reject.",
    icon: "i-heroicons-puzzle-piece",
  },
  {
    id: "cp-feature-components",
    section: "Component Patterns",
    sectionId: "component-patterns",
    targetSection: "feature-components",
    title: "Feature-Specific Components",
    content:
      "TransferStatusBadge with semantic color mapping. MetricCard for dashboard KPIs with trend indicator. LocationCard with type-specific styling. ReconciliationSummary for stock movement. Status to color/icon/label mapping pattern.",
    icon: "i-heroicons-puzzle-piece",
  },
  {
    id: "cp-props-pattern",
    section: "Component Patterns",
    sectionId: "component-patterns",
    targetSection: "props-pattern",
    title: "Props TypeScript Pattern",
    content:
      "TypeScript interface for props. defineProps with Props interface. withDefaults for default values. Union types for constrained values sm, md, lg. Factory functions for default arrays/objects. Boolean props without is prefix.",
    icon: "i-heroicons-puzzle-piece",
  },
  {
    id: "cp-emits-pattern",
    section: "Component Patterns",
    sectionId: "component-patterns",
    targetSection: "emits-pattern",
    title: "Emits TypeScript Pattern",
    content:
      "defineEmits with TypeScript types. Payload types for each event. update:modelValue for v-model support. Computed get/set pattern for two-way binding. Descriptive event names: submit, cancel, not onSubmit.",
    icon: "i-heroicons-puzzle-piece",
  },
  {
    id: "cp-slot-patterns",
    section: "Component Patterns",
    sectionId: "component-patterns",
    targetSection: "slot-patterns",
    title: "Slot Patterns",
    content:
      "Named slots: header, actions, footer. Default slot for main content. Fallback content for optional slots. $slots.name for conditional rendering. Scoped slots with defineSlots for typed props. Passing data to slot content.",
    icon: "i-heroicons-puzzle-piece",
  },
  {
    id: "cp-best-practices",
    section: "Component Patterns",
    sectionId: "component-patterns",
    targetSection: "best-practices",
    title: "Best Practices Summary",
    content:
      "PascalCase files. TypeScript interfaces for props. withDefaults for defaults. Union types for constraints. Fallback content for slots. cursor-pointer on buttons. Semantic color variables. Single responsibility components. Confirmation modals for destructive actions.",
    icon: "i-heroicons-puzzle-piece",
  },

  // ============================================
  // Tables & Lists
  // ============================================
  {
    id: "tl-overview",
    section: "Tables & Lists",
    sectionId: "tables-lists",
    targetSection: "tables-overview",
    title: "Tables & Lists Overview",
    content:
      "Custom HTML tables for displaying tabular data. Wrapped in UCard with design system tokens. Clickable rows, pagination, filtering, search. Loading, empty, error states. Responsive design with column hiding. Grid/card layouts as alternative.",
    icon: "i-heroicons-table-cells",
  },
  {
    id: "tl-custom-html",
    section: "Tables & Lists",
    sectionId: "tables-lists",
    targetSection: "custom-html-table",
    title: "Custom HTML Table Pattern",
    content:
      "HTML table wrapped in UCard with body p-0. Overflow-x-auto for horizontal scroll. min-w-full divide-y for structure. Header bg-elevated with text-label. Row hover with transition-colors. Full control over styling and behavior.",
    icon: "i-heroicons-table-cells",
  },
  {
    id: "tl-structure",
    section: "Tables & Lists",
    sectionId: "tables-lists",
    targetSection: "table-structure",
    title: "Table Structure & Styling",
    content:
      "Header: bg-elevated, text-label, px-4 py-3. Cell: px-4 py-4, text color tokens, whitespace-nowrap for codes. Left-align text, right-align numbers. font-mono for codes, font-medium for emphasis. Badges in cells for status.",
    icon: "i-heroicons-table-cells",
  },
  {
    id: "tl-columns",
    section: "Tables & Lists",
    sectionId: "tables-lists",
    targetSection: "column-definitions",
    title: "Column Definitions",
    content:
      "Code columns: font-mono, text-sm, left-aligned. Name columns: text color, left-aligned. Number columns: right-aligned, whitespace-nowrap. Currency: right-aligned, font-medium. Status: UBadge with color variants. Actions: right-aligned, buttons in flex.",
    icon: "i-heroicons-table-cells",
  },
  {
    id: "tl-row-actions",
    section: "Tables & Lists",
    sectionId: "tables-lists",
    targetSection: "row-actions",
    title: "Row Actions & Navigation",
    content:
      "Clickable rows with cursor-pointer and @click handler. Action buttons with @click.stop to prevent row navigation. variant=ghost size=xs for table actions. Edit: color=primary. Delete: color=error. Always include cursor-pointer class.",
    icon: "i-heroicons-table-cells",
  },
  {
    id: "tl-pagination",
    section: "Tables & Lists",
    sectionId: "tables-lists",
    targetSection: "pagination-pattern",
    title: "Pagination Pattern",
    content:
      "Server-side pagination with page controls. Pagination state: total, page, limit, totalPages, hasNext, hasPrev. Smart page numbers with ellipsis. Info text: Showing X to Y of Z items. Reset to page 1 on filter change. Default 50 per page.",
    icon: "i-heroicons-table-cells",
  },
  {
    id: "tl-filtering",
    section: "Tables & Lists",
    sectionId: "tables-lists",
    targetSection: "filtering-search",
    title: "Filtering & Search",
    content:
      "Debounced search with 500ms delay using useDebounceFn or refDebounced. UDropdownMenu for status/category filters. Active indicator on selected option. Reset pagination on filter change. Search by name or code. Filter by status, category.",
    icon: "i-heroicons-table-cells",
  },
  {
    id: "tl-sorting",
    section: "Tables & Lists",
    sectionId: "tables-lists",
    targetSection: "sorting-pattern",
    title: "Sorting Pattern",
    content:
      "Server-side sorting for large datasets with sort and order params. Client-side sorting for small datasets with computed property. Sort state: field and order. Click handlers on headers. Sort indicator icons: chevron-up, chevron-down.",
    icon: "i-heroicons-table-cells",
  },
  {
    id: "tl-states",
    section: "Tables & Lists",
    sectionId: "tables-lists",
    targetSection: "loading-empty-states",
    title: "Loading & Empty States",
    content:
      "State priority: Loading with LoadingSpinner, Error with ErrorAlert and retry, Empty with EmptyState and CTA, Data. Use v-if chain for conditional rendering. Loading text with context. Error retry button. Empty message specific to reason.",
    icon: "i-heroicons-table-cells",
  },
  {
    id: "tl-grid-layout",
    section: "Tables & Lists",
    sectionId: "tables-lists",
    targetSection: "grid-card-layout",
    title: "Grid/Card Layout Pattern",
    content:
      "Alternative to tables for rich metadata. grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3. card-elevated cursor-pointer. body p-6 for spacing. @click on card, @click.stop on buttons. truncate or line-clamp-2 for long text. Used on Suppliers page.",
    icon: "i-heroicons-table-cells",
  },
  {
    id: "tl-responsive",
    section: "Tables & Lists",
    sectionId: "tables-lists",
    targetSection: "responsive-tables",
    title: "Responsive Design",
    content:
      "Horizontal scroll with overflow-x-auto. Hide columns with hidden md:table-cell. Stack filters with flex-col md:flex-row. Reduce padding on mobile. Icon-only buttons on mobile. Grid to single column. Mobile-first approach.",
    icon: "i-heroicons-table-cells",
  },
  {
    id: "tl-best-practices",
    section: "Tables & Lists",
    sectionId: "tables-lists",
    targetSection: "best-practices-tables",
    title: "Best Practices",
    content:
      "Wrap in UCard with body p-0. overflow-x-auto wrapper. hover bg-elevated with transition. text-label for headers. Left-align text, right-align numbers. cursor-pointer on clickable elements. @click.stop on action buttons. Server-side pagination for large data. Debounce search 500ms. Reset pagination on filter. Loading, error, empty states. Hide columns on mobile. cursor-pointer on all buttons.",
    icon: "i-heroicons-table-cells",
  },

  // ============================================
  // Error Handling
  // ============================================
  {
    id: "eh-server-errors",
    section: "Error Handling",
    sectionId: "error-handling",
    targetSection: "server-errors",
    title: "Server Error Patterns (createError)",
    content:
      "createError() from H3/Nuxt for standardized server errors. Include statusCode, statusMessage, data.code, data.message, data.details. Standard structure for programmatic handling. Error codes like INSUFFICIENT_STOCK, PERIOD_CLOSED, VALIDATION_ERROR. Always include user-friendly message.",
    icon: "i-heroicons-exclamation-circle",
  },
  {
    id: "eh-client-errors",
    section: "Error Handling",
    sectionId: "error-handling",
    targetSection: "client-errors",
    title: "Client Error Handling (useErrorHandler)",
    content:
      "useErrorHandler composable for centralized client error handling. handleError() displays toast with user-friendly message. getErrorMessage() parses errors. Maps error codes to messages with suggestions. Context parameter for operation-specific messages. handleSuccess, handleWarning, handleInfo for other notifications.",
    icon: "i-heroicons-exclamation-circle",
  },
  {
    id: "eh-toast",
    section: "Error Handling",
    sectionId: "error-handling",
    targetSection: "toast-notifications",
    title: "Toast Notifications (useAppToast)",
    content:
      "useAppToast wraps Nuxt UI toast with brand colors. Success: emerald, 5s. Error: red, 7s. Warning: amber, 6s. Info: primary navy, 5s. Custom icons, durations, actions. clear() removes all toasts. Description for context. Actions array for clickable buttons.",
    icon: "i-heroicons-exclamation-circle",
  },
  {
    id: "eh-validation",
    section: "Error Handling",
    sectionId: "error-handling",
    targetSection: "validation-errors",
    title: "Validation Errors (Zod)",
    content:
      "Zod schemas for type-safe validation. Field-level validation on blur. Form-level validation on submit. Server-side validation always required. Inline error display below inputs. Parse ZodError and map to field errors. Same schema client and server for consistency.",
    icon: "i-heroicons-exclamation-circle",
  },
  {
    id: "eh-network",
    section: "Error Handling",
    sectionId: "error-handling",
    targetSection: "network-errors",
    title: "Network Errors & Offline",
    content:
      "useOnlineStatus() detects offline state. useOfflineGuard() prevents actions when offline. guardAction() wraps async functions. checkOnline() for synchronous checks. Disable buttons with :disabled when offline. Network errors have no statusCode. Show user-friendly offline messages.",
    icon: "i-heroicons-exclamation-circle",
  },
  {
    id: "eh-type-guards",
    section: "Error Handling",
    sectionId: "error-handling",
    targetSection: "type-guards",
    title: "Type Guards for Errors",
    content:
      "isH3Error() checks Nuxt server error format. isZodError() for Zod validation errors. isError() for standard Error objects. Type guards narrow error types for TypeScript. Enable autocomplete and type checking. Use in catch blocks for type-safe error handling.",
    icon: "i-heroicons-exclamation-circle",
  },
  {
    id: "eh-error-codes",
    section: "Error Handling",
    sectionId: "error-handling",
    targetSection: "error-codes",
    title: "Standard Error Codes",
    content:
      "Standardized error codes for consistent handling. Categories: Stock, Location, Period, Price, Validation, Permission, Approval, Network, Database, Business Logic. Each code maps to user-friendly message with suggestion. SCREAMING_SNAKE_CASE format. Documented in ERROR_MESSAGES object.",
    icon: "i-heroicons-exclamation-circle",
  },
];
