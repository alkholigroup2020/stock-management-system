<script setup lang="ts">
import type { Component } from "vue";

// Props
const props = defineProps<{
  open: boolean;
}>();

// Emits
const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

// Sidebar collapsed state - collapsed on mobile by default, visible on desktop
const sidebarCollapsed = ref(true);

// Initialize sidebar state based on screen size
const initializeSidebarState = () => {
  if (typeof window !== "undefined") {
    sidebarCollapsed.value = window.innerWidth < 1024; // lg breakpoint
  }
};

// Watch for drawer open to set correct sidebar state
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      initializeSidebarState();
    }
  }
);

// Search state
const searchQuery = ref("");
const searchResults = ref<SearchResult[]>([]);
const isSearching = ref(false);

// Search result interface
interface SearchResult {
  id: string;
  section: string;
  sectionId: string;
  targetSection: string;
  title: string;
  content: string;
  icon: string;
}

// Target section for deep linking - provided to child components
const targetSubSection = ref<string | null>(null);
provide("devTargetSection", targetSubSection);

// Searchable content database
const searchableContent = computed(() => {
  const content: SearchResult[] = [];

  // Getting Started content
  content.push(
    {
      id: "gs-prerequisites",
      section: "Getting Started",
      sectionId: "getting-started-dev",
      targetSection: "prerequisites",
      title: "Prerequisites",
      content:
        "Node.js 20+ required for Nuxt 4. pnpm package manager required. Git for version control. VS Code recommended with Vue and Prettier extensions.",
      icon: "i-heroicons-rocket-launch",
    },
    {
      id: "gs-installation",
      section: "Getting Started",
      sectionId: "getting-started-dev",
      targetSection: "installation",
      title: "Installation",
      content:
        "Clone repository with git clone. Install dependencies with pnpm install. Copy .env.example to .env. Set DATABASE_URL, AUTH_SECRET, and other environment variables.",
      icon: "i-heroicons-rocket-launch",
    },
    {
      id: "gs-commands",
      section: "Getting Started",
      sectionId: "getting-started-dev",
      targetSection: "commands",
      title: "Development Commands",
      content:
        "pnpm dev starts development server at localhost:3000. pnpm build creates production build. pnpm typecheck runs TypeScript type checking. pnpm format runs Prettier formatting. pnpm lint runs ESLint.",
      icon: "i-heroicons-rocket-launch",
    },
    {
      id: "gs-database",
      section: "Getting Started",
      sectionId: "getting-started-dev",
      targetSection: "database",
      title: "Database Commands",
      content:
        "pnpm db:push syncs schema to database without migrations. pnpm db:migrate dev creates migration files. pnpm db:studio opens Prisma Studio GUI. Never use db:push in production.",
      icon: "i-heroicons-rocket-launch",
    }
  );

  // Architecture content
  content.push(
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
    }
  );

  // Authentication content
  content.push(
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
    }
  );

  // Database content
  content.push(
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
    }
  );

  // State Management content
  content.push(
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
    }
  );

  // Caching System content
  content.push(
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
    }
  );

  // Multi-Location content
  content.push(
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
    }
  );

  // Deliveries & WAC content
  content.push(
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
    }
  );

  // Issues (Stock Deductions) content
  content.push(
    {
      id: "iss-issue-model",
      section: "Issues",
      sectionId: "issues",
      targetSection: "issue-model",
      title: "Issue Model",
      content:
        "Issue model for outbound stock deductions. IssueLine stores item quantities, wac_at_issue, line_value. issue_no auto-generated ISS-YYYY-NNN. cost_centre for FOOD, CLEAN, or OTHER tracking.",
      icon: "i-heroicons-arrow-right-on-rectangle",
    },
    {
      id: "iss-cost-centre",
      section: "Issues",
      sectionId: "issues",
      targetSection: "cost-centre",
      title: "Cost Centre Tracking",
      content:
        "Cost centre tracking for consumption analysis. FOOD for food-related consumption, CLEAN for cleaning supplies, OTHER for miscellaneous. Enables reporting by category and cost per manday calculations.",
      icon: "i-heroicons-arrow-right-on-rectangle",
    },
    {
      id: "iss-wac-at-issue",
      section: "Issues",
      sectionId: "issues",
      targetSection: "wac-at-issue",
      title: "WAC at Issue Capture",
      content:
        "WAC captured at time of issue in wac_at_issue field. Issues do NOT recalculate WAC. line_value equals quantity times wac_at_issue. Preserves accurate cost for reporting and reconciliation.",
      icon: "i-heroicons-arrow-right-on-rectangle",
    },
    {
      id: "iss-stock-validation",
      section: "Issues",
      sectionId: "issues",
      targetSection: "stock-validation",
      title: "Stock Validation (No Negative)",
      content:
        "Critical business rule: never allow negative stock. Validate requestedQty less than or equal to on_hand. Check ALL items before processing ANY. Return specific item IDs that fail. INSUFFICIENT_STOCK error code.",
      icon: "i-heroicons-arrow-right-on-rectangle",
    },
    {
      id: "iss-posting-flow",
      section: "Issues",
      sectionId: "issues",
      targetSection: "posting-flow",
      title: "Issue Posting Flow",
      content:
        "Issue posting flow: validate period OPEN, start transaction, validate stock, generate issue number, create header, process lines, decrement stock, update totals. No draft state - all issues immediately posted.",
      icon: "i-heroicons-arrow-right-on-rectangle",
    },
    {
      id: "iss-stock-update",
      section: "Issues",
      sectionId: "issues",
      targetSection: "stock-update",
      title: "Stock Update Pattern",
      content:
        "Issues decrement stock with UPDATE operation. WAC remains unchanged. Different from deliveries which use UPSERT and recalculate WAC. Stock record must exist before issue. Atomic within transaction.",
      icon: "i-heroicons-arrow-right-on-rectangle",
    },
    {
      id: "iss-api-frontend",
      section: "Issues",
      sectionId: "issues",
      targetSection: "api-frontend",
      title: "API & Frontend",
      content:
        "POST /api/locations/:id/issues endpoint. useIssues composable pattern. IssueForm component with cost centre select, date picker, line items. afterIssue() cache invalidation. Error codes: INSUFFICIENT_STOCK, NO_OPEN_PERIOD.",
      icon: "i-heroicons-arrow-right-on-rectangle",
    },
    {
      id: "iss-reconciliation",
      section: "Issues",
      sectionId: "issues",
      targetSection: "reconciliation",
      title: "Reconciliation Impact",
      content:
        "Issues are key component of period-end reconciliation. Formula: Opening + Receipts + TransfersIn - TransfersOut - Issues - Adjustments = Closing. Issue totals by cost centre for reporting.",
      icon: "i-heroicons-arrow-right-on-rectangle",
    },
    {
      id: "iss-business-rules",
      section: "Issues",
      sectionId: "issues",
      targetSection: "business-rules",
      title: "Business Rules Summary",
      content:
        "Business rules: Never allow negative stock. Issues do NOT recalculate WAC. Period must be OPEN. Immediate posting, no draft state. Cost centre required. Audit trail with posted_by, posted_at, issue_no.",
      icon: "i-heroicons-arrow-right-on-rectangle",
    }
  );

  // Transfers (Inter-Location Stock Movement) content
  content.push(
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
    }
  );

  // NCR (Non-Conformance Reports) content
  content.push(
    {
      id: "ncr-model",
      section: "NCR",
      sectionId: "ncr",
      targetSection: "ncr-model",
      title: "NCR Model & Types",
      content:
        "NCR model for non-conformance reports. MANUAL for user-created NCRs, PRICE_VARIANCE for auto-generated from delivery price mismatch. ncr_no auto-generated NCR-YYYY-NNN. auto_generated flag distinguishes system vs user created.",
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
        "PATCH /api/ncrs/:id for status updates. Valid transitions enforced. CREDITED, REJECTED, RESOLVED are final states. resolved_at timestamp auto-set. resolution_notes for audit trail.",
      icon: "i-heroicons-exclamation-triangle",
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
    }
  );

  // Reconciliation content
  content.push(
    {
      id: "rec-reconciliation-model",
      section: "Reconciliation",
      sectionId: "reconciliation",
      targetSection: "reconciliation-model",
      title: "Reconciliation Model",
      content:
        "Reconciliation model stores period-end stock movement data per location. Tracks opening_stock, receipts, transfers_in, transfers_out, issues, closing_stock, and adjustment values. Composite unique key on period_id and location_id.",
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
    }
  );

  // Period Management content
  content.push(
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
    }
  );

  // POB (Persons on Board) content
  content.push(
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
    }
  );

  // Server API Patterns content
  content.push(
    {
      id: "sap-route-conventions",
      section: "Server API Patterns",
      sectionId: "server-api-patterns",
      targetSection: "route-conventions",
      title: "API Route Conventions",
      content:
        "Server API routes follow Nitro/H3 file-based routing. File names determine HTTP method and URL path. index.get.ts for collections, [id].patch.ts for dynamic params, login.post.ts for actions. Nested folders create nested URL paths.",
      icon: "i-heroicons-server",
    },
    {
      id: "sap-event-handler",
      section: "Server API Patterns",
      sectionId: "server-api-patterns",
      targetSection: "event-handler",
      title: "defineEventHandler Patterns",
      content:
        "All API routes export defineEventHandler with event object. Access user via event.context.user. Get route params with getRouterParam. Read query with getQuery. Parse body with readBody. Return JSON responses directly.",
      icon: "i-heroicons-server",
    },
    {
      id: "sap-zod-validation",
      section: "Server API Patterns",
      sectionId: "server-api-patterns",
      targetSection: "zod-validation",
      title: "Request Validation with Zod",
      content:
        "All request bodies validated with Zod schemas. Use transform for normalization like uppercase codes. Add custom error messages. Use uuid for IDs, enum for predefined values. Catch ZodError and throw VALIDATION_ERROR.",
      icon: "i-heroicons-server",
    },
    {
      id: "sap-create-error",
      section: "Server API Patterns",
      sectionId: "server-api-patterns",
      targetSection: "create-error",
      title: "Error Handling with createError",
      content:
        "Use createError from H3 for structured errors. Include statusCode, statusMessage, data.code, data.message, and optional data.details. Common codes: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Internal Error.",
      icon: "i-heroicons-server",
    },
    {
      id: "sap-error-codes",
      section: "Server API Patterns",
      sectionId: "server-api-patterns",
      targetSection: "error-codes",
      title: "Standard Error Codes",
      content:
        "Consistent error codes: NOT_AUTHENTICATED, INSUFFICIENT_PERMISSIONS, LOCATION_ACCESS_DENIED, VALIDATION_ERROR, INSUFFICIENT_STOCK, PERIOD_CLOSED, NO_OPEN_PERIOD, PRICE_VARIANCE, NOT_FOUND, DUPLICATE_CODE, INTERNAL_ERROR.",
      icon: "i-heroicons-server",
    },
    {
      id: "sap-response-format",
      section: "Server API Patterns",
      sectionId: "server-api-patterns",
      targetSection: "response-format",
      title: "Response Format Standards",
      content:
        "Success responses include resource and message. Lists include pagination with page, limit, total. Complex operations include side effects like auto-created NCRs. Error responses use createError with code and message.",
      icon: "i-heroicons-server",
    },
    {
      id: "sap-transactions",
      section: "Server API Patterns",
      sectionId: "server-api-patterns",
      targetSection: "transactions",
      title: "Prisma Transactions in Routes",
      content:
        "Use $transaction([]) for batched reads in single round-trip. Use $transaction(async tx) for atomic writes with rollback. Set timeout for complex operations. Use upsert for insert-or-update patterns.",
      icon: "i-heroicons-server",
    },
    {
      id: "sap-auth-context",
      section: "Server API Patterns",
      sectionId: "server-api-patterns",
      targetSection: "auth-context",
      title: "Auth Context (event.context.user)",
      content:
        "Auth middleware attaches user to event.context.user. Access user.id, user.username, user.email, user.role (OPERATOR, SUPERVISOR, ADMIN), user.default_location_id. Check role hierarchy for permissions.",
      icon: "i-heroicons-server",
    },
    {
      id: "sap-auth-middleware",
      section: "Server API Patterns",
      sectionId: "server-api-patterns",
      targetSection: "auth-middleware",
      title: "Auth Middleware",
      content:
        "Auth middleware protects all /api/* routes automatically. Public routes excluded: /api/auth/login, /api/auth/logout, /api/auth/session, /api/health. Uses getUserSession from nuxt-auth-utils. Throws 401 if not authenticated.",
      icon: "i-heroicons-server",
    },
    {
      id: "sap-location-middleware",
      section: "Server API Patterns",
      sectionId: "server-api-patterns",
      targetSection: "location-middleware",
      title: "Location Access Middleware",
      content:
        "Location middleware controls access to /api/locations/[id]/* routes. ADMIN and SUPERVISOR have access to all locations implicitly. OPERATOR requires UserLocation assignment. Throws LOCATION_ACCESS_DENIED error.",
      icon: "i-heroicons-server",
    },
    {
      id: "sap-complete-example",
      section: "Server API Patterns",
      sectionId: "server-api-patterns",
      targetSection: "complete-example",
      title: "Complete API Example",
      content:
        "Complete API handler flow: check authentication, check authorization, validate request body with Zod, business logic validation, database operation, return success response, handle Zod errors, re-throw known errors, catch unexpected errors.",
      icon: "i-heroicons-server",
    }
  );

  return content;
});

// Search function
const performSearch = (query: string) => {
  if (!query.trim()) {
    searchResults.value = [];
    return;
  }

  isSearching.value = true;
  const lowerQuery = query.toLowerCase();

  searchResults.value = searchableContent.value.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.content.toLowerCase().includes(lowerQuery)
  );

  isSearching.value = false;
};

// Watch search query with debounce
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, (newQuery) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    performSearch(newQuery);
  }, 200);
});

// Clear search
const clearSearch = () => {
  searchQuery.value = "";
  searchResults.value = [];
};

// Navigate to search result
const goToResult = (result: SearchResult) => {
  activeSection.value = result.sectionId;
  if (result.targetSection) {
    targetSubSection.value = result.targetSection;
  }
  clearSearch();
};

// Navigation sections
const navSections = [
  {
    id: "getting-started-dev",
    label: "Getting Started",
    icon: "i-heroicons-rocket-launch",
  },
  {
    id: "architecture",
    label: "Architecture",
    icon: "i-heroicons-squares-2x2",
  },
  {
    id: "database",
    label: "Database",
    icon: "i-heroicons-server-stack",
  },
  {
    id: "authentication",
    label: "Authentication",
    icon: "i-heroicons-lock-closed",
  },
  {
    id: "state-management",
    label: "State Management",
    icon: "i-heroicons-cube-transparent",
  },
  {
    id: "caching-system",
    label: "Caching System",
    icon: "i-heroicons-square-3-stack-3d",
  },
  {
    id: "multi-location",
    label: "Multi-Location",
    icon: "i-heroicons-map-pin",
  },
  {
    id: "period-management",
    label: "Period Management",
    icon: "i-heroicons-calendar-days",
  },
  {
    id: "deliveries-wac",
    label: "Deliveries & WAC",
    icon: "i-heroicons-truck",
  },
  {
    id: "issues",
    label: "Issues",
    icon: "i-heroicons-arrow-right-on-rectangle",
  },
  {
    id: "transfers",
    label: "Transfers",
    icon: "i-heroicons-arrows-right-left",
  },
  {
    id: "ncr",
    label: "NCR",
    icon: "i-heroicons-exclamation-triangle",
  },
  {
    id: "reconciliation",
    label: "Reconciliation",
    icon: "i-heroicons-calculator",
  },
  {
    id: "pob",
    label: "POB",
    icon: "i-heroicons-users",
  },
  {
    id: "server-api-patterns",
    label: "Server API Patterns",
    icon: "i-heroicons-server",
  },
];

// Active section
const activeSection = ref("getting-started-dev");

// Component mapping
const contentComponents: Record<string, Component> = {
  "getting-started-dev": defineAsyncComponent(
    () => import("~/components/developer/GettingStartedDev.vue")
  ),
  architecture: defineAsyncComponent(
    () => import("~/components/developer/ArchitectureOverview.vue")
  ),
  database: defineAsyncComponent(() => import("~/components/developer/DatabaseGuide.vue")),
  authentication: defineAsyncComponent(
    () => import("~/components/developer/AuthenticationGuide.vue")
  ),
  "state-management": defineAsyncComponent(
    () => import("~/components/developer/StateManagementGuide.vue")
  ),
  "caching-system": defineAsyncComponent(
    () => import("~/components/developer/CachingSystemGuide.vue")
  ),
  "multi-location": defineAsyncComponent(
    () => import("~/components/developer/MultiLocationGuide.vue")
  ),
  "period-management": defineAsyncComponent(
    () => import("~/components/developer/PeriodManagementGuide.vue")
  ),
  "deliveries-wac": defineAsyncComponent(
    () => import("~/components/developer/DeliveriesWACGuide.vue")
  ),
  issues: defineAsyncComponent(() => import("~/components/developer/IssuesGuide.vue")),
  transfers: defineAsyncComponent(() => import("~/components/developer/TransfersGuide.vue")),
  ncr: defineAsyncComponent(() => import("~/components/developer/NCRGuide.vue")),
  reconciliation: defineAsyncComponent(
    () => import("~/components/developer/ReconciliationGuide.vue")
  ),
  pob: defineAsyncComponent(() => import("~/components/developer/POBGuide.vue")),
  "server-api-patterns": defineAsyncComponent(
    () => import("~/components/developer/ServerApiPatternsGuide.vue")
  ),
};

// Get current component
const currentComponent = computed(() => contentComponents[activeSection.value]);

// Handle close
const handleClose = () => {
  emit("update:open", false);
};

// Handle section change
const selectSection = (sectionId: string) => {
  activeSection.value = sectionId;
  // Collapse sidebar on mobile after selection
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    sidebarCollapsed.value = true;
  }
};

// Toggle sidebar
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

// Keyboard shortcut to close
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    handleClose();
  }
};

// Setup keyboard listener
onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});

// Highlight matching text in search results
const highlightMatch = (text: string, query: string): string => {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return text.replace(
    regex,
    '<mark class="bg-[var(--ui-primary)]/20 text-[var(--ui-primary)]">$1</mark>'
  );
};
</script>

<template>
  <USlideover
    :open="props.open"
    side="right"
    :ui="{ content: 'w-full lg:!w-[65vw] !max-w-none' }"
    @update:open="emit('update:open', $event)"
  >
    <template #content>
      <div class="guide-content flex h-full w-full flex-col bg-[var(--ui-bg)]">
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] px-4 py-3"
        >
          <div class="flex items-center gap-3">
            <!-- Sidebar Toggle Button -->
            <UButton
              :icon="sidebarCollapsed ? 'i-heroicons-bars-3' : 'i-heroicons-x-mark'"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Toggle sidebar"
              class="cursor-pointer"
              @click="toggleSidebar"
            />
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ui-primary)]/10"
            >
              <UIcon name="i-heroicons-code-bracket" class="text-lg text-[var(--ui-primary)]" />
            </div>
            <div class="hidden sm:block">
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                Developer Guide
              </h2>
              <p class="text-xs text-[var(--ui-text-muted)]">Development mode only</p>
            </div>
          </div>
          <UButton
            icon="i-heroicons-x-mark"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Close developer guide"
            class="cursor-pointer"
            @click="handleClose"
          />
        </div>

        <!-- Search Bar -->
        <div class="border-b border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-3">
          <div class="relative">
            <UIcon
              name="i-heroicons-magnifying-glass"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search developer docs..."
              class="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] py-2 pl-10 pr-10 text-sm text-[var(--ui-text)] placeholder-[var(--ui-text-muted)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)]"
            />
            <UButton
              v-if="searchQuery"
              icon="i-heroicons-x-mark"
              color="neutral"
              variant="ghost"
              size="xs"
              class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
              aria-label="Clear search"
              @click="clearSearch"
            />
          </div>

          <!-- Search Results Dropdown -->
          <div
            v-if="searchQuery && searchResults.length > 0"
            class="absolute left-4 right-4 z-50 mt-2 max-h-64 overflow-y-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] shadow-lg"
          >
            <ul class="divide-y divide-[var(--ui-border)]">
              <li v-for="result in searchResults" :key="result.id">
                <button
                  class="w-full cursor-pointer px-4 py-3 text-left transition-colors hover:bg-[var(--ui-bg-accented)]"
                  @click="goToResult(result)"
                >
                  <div class="mb-1 flex items-center gap-2">
                    <UIcon :name="result.icon" class="text-sm text-[var(--ui-primary)]" />
                    <span class="text-xs text-[var(--ui-text-muted)]">{{ result.section }}</span>
                  </div>
                  <p
                    class="text-sm font-medium text-[var(--ui-text-highlighted)]"
                    v-html="highlightMatch(result.title, searchQuery)"
                  />
                  <p
                    class="mt-1 line-clamp-2 text-xs text-[var(--ui-text-muted)]"
                    v-html="highlightMatch(result.content.substring(0, 120) + '...', searchQuery)"
                  />
                </button>
              </li>
            </ul>
          </div>

          <!-- No Results -->
          <div
            v-if="searchQuery && searchResults.length === 0 && !isSearching"
            class="absolute left-4 right-4 z-50 mt-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-4 text-center shadow-lg"
          >
            <UIcon
              name="i-heroicons-magnifying-glass"
              class="mb-2 text-2xl text-[var(--ui-text-muted)]"
            />
            <p class="text-sm text-[var(--ui-text-muted)]">
              No results found for "{{ searchQuery }}"
            </p>
          </div>
        </div>

        <!-- Body with sidebar and content -->
        <div class="relative flex flex-1 overflow-hidden">
          <!-- Sidebar Navigation -->
          <nav
            class="flex shrink-0 flex-col overflow-y-auto border-r border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] transition-all duration-300"
            :class="[
              sidebarCollapsed ? 'invisible w-0 opacity-0' : 'visible w-48 opacity-100',
              'absolute z-40 h-full md:relative md:h-auto',
            ]"
          >
            <ul class="flex-1 space-y-1 p-2">
              <li v-for="section in navSections" :key="section.id">
                <button
                  class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                  :class="[
                    activeSection === section.id
                      ? 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)]'
                      : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-accented)] hover:text-[var(--ui-text)]',
                  ]"
                  @click="selectSection(section.id)"
                >
                  <UIcon :name="section.icon" class="text-base" />
                  <span>{{ section.label }}</span>
                </button>
              </li>
            </ul>

            <!-- Footer with keyboard hint -->
            <div class="border-t border-[var(--ui-border)] p-3">
              <p class="text-center text-xs text-[var(--ui-text-dimmed)]">
                Press
                <kbd
                  class="rounded border border-[var(--ui-border)] bg-[var(--ui-bg)] px-1 py-0.5 text-[10px]"
                >
                  Esc
                </kbd>
                to close
              </p>
            </div>
          </nav>

          <!-- Overlay for mobile when sidebar is open -->
          <div
            v-if="!sidebarCollapsed"
            class="absolute inset-0 z-30 bg-black/20 md:hidden"
            @click="sidebarCollapsed = true"
          />

          <!-- Content Area -->
          <main class="flex-1 overflow-y-auto p-4 md:p-6">
            <Suspense>
              <component :is="currentComponent" />
              <template #fallback>
                <div class="flex h-32 items-center justify-center">
                  <UIcon
                    name="i-heroicons-arrow-path"
                    class="animate-spin text-2xl text-[var(--ui-text-muted)]"
                  />
                </div>
              </template>
            </Suspense>
          </main>
        </div>
      </div>
    </template>
  </USlideover>
</template>
