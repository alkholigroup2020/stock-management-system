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
