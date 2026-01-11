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

  // Components content
  content.push(
    {
      id: "comp-naming",
      section: "Components",
      sectionId: "components",
      targetSection: "naming",
      title: "Component Naming",
      content:
        "Nuxt 4 auto-imports components. Subdirectory names become prefixes. layout/AppNavbar.vue becomes LayoutAppNavbar. delivery/LineItem.vue becomes DeliveryLineItem. Root components have no prefix.",
      icon: "i-heroicons-puzzle-piece",
    },
    {
      id: "comp-pages",
      section: "Components",
      sectionId: "components",
      targetSection: "pages",
      title: "Pages Overview",
      content:
        "43 pages implemented. Dashboard, Deliveries (4 pages), Issues (3 pages), Transfers (3 pages), Stock Now, Periods (3 pages), Period Close, NCRs (3 pages), Items (4 pages), Locations (4 pages), Suppliers (3 pages), Users (4 pages), Profile, POB, Reports (4 pages).",
      icon: "i-heroicons-puzzle-piece",
    },
    {
      id: "comp-list",
      section: "Components",
      sectionId: "components",
      targetSection: "list",
      title: "Component Categories",
      content:
        "39 components organized by feature. Layout: PageHeader, HierarchicalNav, LocationSwitcher, PeriodIndicator, HelpDrawer. Dashboard: MetricCard, RecentActivity. Forms: TransferForm, POBTable, AdjustmentsForm. Modals: ConfirmModal. Approval: ApprovalRequest, ApprovalStatus. Status: ErrorAlert, LoadingSpinner, EmptyState, OfflineBanner.",
      icon: "i-heroicons-puzzle-piece",
    },
    {
      id: "comp-patterns",
      section: "Components",
      sectionId: "components",
      targetSection: "patterns",
      title: "Common Patterns",
      content:
        "PageHeader component for page titles with actions. EmptyState for no-data scenarios. LoadingOverlay for async operations. ConfirmModal for destructive actions. ErrorAlert for displaying errors with retry option.",
      icon: "i-heroicons-puzzle-piece",
    }
  );

  // Composables content
  content.push(
    {
      id: "comp-auth",
      section: "Composables",
      sectionId: "composables",
      targetSection: "auth",
      title: "useAuth Composable",
      content:
        "Provides authentication state. user reactive ref for current user. isAuthenticated computed boolean. isAdmin, isSupervisor, isOperator for role checks. login, logout, refreshSession methods.",
      icon: "i-heroicons-link",
    },
    {
      id: "comp-permissions",
      section: "Composables",
      sectionId: "composables",
      targetSection: "permissions",
      title: "usePermissions Composable",
      content:
        "Role-based permission checks. canPostDeliveries, canPostIssues, canApproveTransfers, canClosePeriod, canManageUsers, canManageItems, canManageLocations, canManageSuppliers, canViewStock, canCreateTransfer.",
      icon: "i-heroicons-link",
    },
    {
      id: "comp-toast",
      section: "Composables",
      sectionId: "composables",
      targetSection: "toast",
      title: "useAppToast Composable",
      content:
        "Toast notification system. showSuccess, showError, showWarning, showInfo methods. Automatically styled with semantic colors. Duration configurable. Uses Nuxt UI toast under the hood.",
      icon: "i-heroicons-link",
    },
    {
      id: "comp-error",
      section: "Composables",
      sectionId: "composables",
      targetSection: "error",
      title: "useErrorHandler Composable",
      content:
        "Centralized error handling. handleError method extracts message from error objects. Maps API error codes to user-friendly messages. Supports retry callbacks. Works with createError responses.",
      icon: "i-heroicons-link",
    },
    {
      id: "comp-offline",
      section: "Composables",
      sectionId: "composables",
      targetSection: "offline",
      title: "useOnlineStatus & useOfflineGuard",
      content:
        "useOnlineStatus provides isOnline reactive ref. useOfflineGuard wraps actions to prevent when offline. Shows toast warning when attempting offline action. Used to disable buttons when offline.",
      icon: "i-heroicons-link",
    },
    {
      id: "comp-cache",
      section: "Composables",
      sectionId: "composables",
      targetSection: "cache",
      title: "useCache Composable",
      content:
        "Client-side data caching. getCached, setCached, invalidate methods. Used for items, suppliers, locations master data. Reduces API calls for frequently accessed data.",
      icon: "i-heroicons-link",
    },
    {
      id: "comp-api",
      section: "Composables",
      sectionId: "composables",
      targetSection: "api",
      title: "API Composables",
      content:
        "useItems, useSuppliers, useLocations for master data operations. Provide fetchAll, fetchById, create, update, delete methods. Handle caching and error handling. useCurrentPeriod fetches current open period.",
      icon: "i-heroicons-link",
    }
  );

  // Stores content
  content.push(
    {
      id: "store-auth",
      section: "Stores",
      sectionId: "stores",
      targetSection: "auth",
      title: "Auth Store",
      content:
        "Pinia store for authentication. user state with id, name, email, role. isAuthenticated getter. setUser, clearUser actions. Persisted to sessionStorage. Used by useAuth composable.",
      icon: "i-heroicons-circle-stack",
    },
    {
      id: "store-location",
      section: "Stores",
      sectionId: "stores",
      targetSection: "location",
      title: "Location Store",
      content:
        "Pinia store for active location. activeLocation state. userLocations array of accessible locations. setActiveLocation action. getActiveLocationId getter. Used by LocationSwitcher component.",
      icon: "i-heroicons-circle-stack",
    },
    {
      id: "store-period",
      section: "Stores",
      sectionId: "stores",
      targetSection: "period",
      title: "Period Store",
      content:
        "Pinia store for current accounting period. currentPeriod state with id, startDate, endDate, status. fetchCurrentPeriod action. isOpen, isPendingClose getters. Used by PeriodIndicator.",
      icon: "i-heroicons-circle-stack",
    },
    {
      id: "store-ui",
      section: "Stores",
      sectionId: "stores",
      targetSection: "ui",
      title: "UI Store",
      content:
        "Pinia store for global UI state. sidebarCollapsed boolean. modalOpen states. Theme preference. Used for coordinating UI across components.",
      icon: "i-heroicons-circle-stack",
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

  // API Routes content
  content.push(
    {
      id: "api-conventions",
      section: "API Routes",
      sectionId: "api-routes",
      targetSection: "conventions",
      title: "RESTful Conventions",
      content:
        "GET for fetching, POST for creating, PATCH for updating, DELETE for removing. Plural nouns for resources: /api/items, /api/deliveries. Nested routes for relationships: /api/locations/[id]/deliveries.",
      icon: "i-heroicons-server",
    },
    {
      id: "api-errors",
      section: "API Routes",
      sectionId: "api-routes",
      targetSection: "errors",
      title: "Error Response Format",
      content:
        "Use createError with statusCode and data object. data contains code (string) and message (string). Standard codes: VALIDATION_ERROR, INSUFFICIENT_STOCK, LOCATION_ACCESS_DENIED, PERIOD_CLOSED, PRICE_VARIANCE, NOT_FOUND, UNAUTHORIZED.",
      icon: "i-heroicons-server",
    },
    {
      id: "api-auth",
      section: "API Routes",
      sectionId: "api-routes",
      targetSection: "auth",
      title: "Authentication",
      content:
        "All /api/* routes auto-protected except /api/auth/*. Access user via event.context.user. JWT stored in httpOnly cookie. Refresh token handling automatic.",
      icon: "i-heroicons-server",
    },
    {
      id: "api-endpoints",
      section: "API Routes",
      sectionId: "api-routes",
      targetSection: "endpoints",
      title: "Endpoints Overview",
      content:
        "70 endpoints. Auth (6), Locations (9), Deliveries (6), Issues (4), Transfers (5), Periods (10), Items (6), Suppliers (5), NCRs (4), Reconciliations (2), Reports (4), Users (4), Stock (2), Dashboard (1), Health (1).",
      icon: "i-heroicons-server",
    }
  );

  // UI Patterns content
  content.push(
    {
      id: "ui-cards",
      section: "UI Patterns",
      sectionId: "ui-patterns",
      targetSection: "cards",
      title: "Card Patterns",
      content:
        "card-elevated class for primary cards with navy shadow. card-muted class for secondary content. UCard component with header, default, footer slots. Rounded corners with rounded-xl.",
      icon: "i-heroicons-paint-brush",
    },
    {
      id: "ui-forms",
      section: "UI Patterns",
      sectionId: "ui-patterns",
      targetSection: "forms",
      title: "Form Patterns",
      content:
        "Two-column grid layout with grid-cols-1 md:grid-cols-2. form-label class for labels. form-input class for inputs. UInput, USelectMenu, UTextarea components. Validation with computed disabled state.",
      icon: "i-heroicons-paint-brush",
    },
    {
      id: "ui-tables",
      section: "UI Patterns",
      sectionId: "ui-patterns",
      targetSection: "tables",
      title: "Table Patterns",
      content:
        "Custom HTML tables preferred over UTable for complex layouts. thead with bg-muted. tbody with divide-y. Responsive with overflow-x-auto wrapper. Action buttons in last column.",
      icon: "i-heroicons-paint-brush",
    },
    {
      id: "ui-modals",
      section: "UI Patterns",
      sectionId: "ui-patterns",
      targetSection: "modals",
      title: "Modal Patterns",
      content:
        "UModal with v-model binding. ConfirmModal component for destructive actions. Variants: danger, warning, success, info. Icon with colored background. Cancel and confirm buttons in footer.",
      icon: "i-heroicons-paint-brush",
    },
    {
      id: "ui-buttons",
      section: "UI Patterns",
      sectionId: "ui-patterns",
      targetSection: "buttons",
      title: "Button Patterns",
      content:
        "All buttons must have cursor-pointer class. Primary actions use color primary. Cancel uses color neutral. Destructive uses color error. Loading state with :loading prop. Icon buttons with icon prop.",
      icon: "i-heroicons-paint-brush",
    },
    {
      id: "ui-badges",
      section: "UI Patterns",
      sectionId: "ui-patterns",
      targetSection: "badges",
      title: "Badge Patterns",
      content:
        "UBadge with color and variant props. Status badges: badge-pending, badge-approved, badge-rejected, badge-draft. Stock badges: badge-stock-healthy, badge-stock-low, badge-stock-critical.",
      icon: "i-heroicons-paint-brush",
    }
  );

  // Tailwind content
  content.push(
    {
      id: "tw-theme",
      section: "Tailwind CSS",
      sectionId: "tailwind",
      targetSection: "theme",
      title: "@theme Directive",
      content:
        "Tailwind CSS v4 uses @theme in main.css instead of tailwind.config.ts. Define colors with --color-navy-500: #1e4d8c. Define custom utilities with @utility directive. CSS-first configuration.",
      icon: "i-heroicons-swatch",
    },
    {
      id: "tw-tokens",
      section: "Tailwind CSS",
      sectionId: "tailwind",
      targetSection: "tokens",
      title: "Semantic Tokens",
      content:
        "--ui-primary for brand navy blue. --ui-bg, --ui-bg-elevated, --ui-bg-muted for backgrounds. --ui-text, --ui-text-muted, --ui-text-dimmed for text. --ui-border for borders. --ui-success, --ui-error, --ui-warning, --ui-info for semantic colors.",
      icon: "i-heroicons-swatch",
    },
    {
      id: "tw-utilities",
      section: "Tailwind CSS",
      sectionId: "tailwind",
      targetSection: "utilities",
      title: "Custom Utilities",
      content:
        "bg-default, bg-elevated, bg-muted for backgrounds. text-default, text-primary, text-muted for text. border-default, border-muted for borders. focus-ring for focus states. smooth-transition for animations.",
      icon: "i-heroicons-swatch",
    },
    {
      id: "tw-dark",
      section: "Tailwind CSS",
      sectionId: "tailwind",
      targetSection: "dark",
      title: "Dark Mode",
      content:
        "Dark mode via .dark class on html element. All tokens have dark mode variants. Deep navy backgrounds in dark mode. Adjusted text colors for contrast. Automatic via Nuxt UI color mode.",
      icon: "i-heroicons-swatch",
    }
  );

  // Type Safety content
  content.push(
    {
      id: "ts-strict",
      section: "Type Safety",
      sectionId: "type-safety",
      targetSection: "strict",
      title: "TypeScript Strict Mode",
      content:
        "Strict mode enabled in tsconfig. No implicit any allowed. Strict null checks. Always define return types for functions. Use interfaces for object shapes.",
      icon: "i-heroicons-shield-check",
    },
    {
      id: "ts-interfaces",
      section: "Type Safety",
      sectionId: "type-safety",
      targetSection: "interfaces",
      title: "Interface Definitions",
      content:
        "Define interfaces in /shared/types/. Entity interfaces: User, Location, Item, Delivery, Issue, Transfer, Period, NCR. API response interfaces. Form data interfaces. Props interfaces for components.",
      icon: "i-heroicons-shield-check",
    },
    {
      id: "ts-zod",
      section: "Type Safety",
      sectionId: "type-safety",
      targetSection: "zod",
      title: "Zod Validation",
      content:
        "Use Zod for runtime validation. Define schemas for API request bodies. Use z.infer to derive TypeScript types. Validate in API routes before processing. Return detailed validation errors.",
      icon: "i-heroicons-shield-check",
    },
    {
      id: "ts-prisma",
      section: "Type Safety",
      sectionId: "type-safety",
      targetSection: "prisma",
      title: "Prisma Decimal Handling",
      content:
        "Prisma Decimal type requires special handling. Convert to number with .toNumber() for calculations. Convert to string with .toString() for display. Use Decimal.js for precise arithmetic.",
      icon: "i-heroicons-shield-check",
    },
    {
      id: "ts-guards",
      section: "Type Safety",
      sectionId: "type-safety",
      targetSection: "guards",
      title: "Type Guards",
      content:
        "Use type guards for error handling. Pattern: (err as { data?: { code?: string } }). Check for specific error codes. Narrow types in conditionals. Never use bare any type.",
      icon: "i-heroicons-shield-check",
    }
  );

  // Best Practices content
  content.push(
    {
      id: "bp-formatting",
      section: "Best Practices",
      sectionId: "best-practices",
      targetSection: "formatting",
      title: "Code Formatting",
      content:
        "Prettier configured. Double quotes required. Semicolons required. 2-space indentation. 100 character line width. Arrow function parentheses always. ES5 trailing commas. Run pnpm format before commit.",
      icon: "i-heroicons-star",
    },
    {
      id: "bp-checklist",
      section: "Best Practices",
      sectionId: "best-practices",
      targetSection: "checklist",
      title: "Pre-Commit Checklist",
      content:
        "pnpm typecheck must show zero errors. No any types in code. All error handlers use type guards. All interfaces properly defined. API responses properly typed. Prisma Decimal handled correctly.",
      icon: "i-heroicons-star",
    },
    {
      id: "bp-pitfalls",
      section: "Best Practices",
      sectionId: "best-practices",
      targetSection: "pitfalls",
      title: "Common Pitfalls",
      content:
        "Never allow negative stock. Never modify closed periods. Never skip location context. Never change WAC on issues. Never use db:push in production. Never bypass approval workflows. Never forget audit trail. Never expose service keys.",
      icon: "i-heroicons-star",
    },
    {
      id: "bp-currency",
      section: "Best Practices",
      sectionId: "best-practices",
      targetSection: "currency",
      title: "Currency & Dates",
      content:
        "Currency: SAR (Saudi Riyal). Format: SAR 1,234.56. 2 decimal places for currency. Up to 4 for quantities. Date display: DD/MM/YYYY. Date API: ISO 8601. Timezone: Asia/Riyadh.",
      icon: "i-heroicons-star",
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
    id: "components",
    label: "Components",
    icon: "i-heroicons-puzzle-piece",
  },
  {
    id: "composables",
    label: "Composables",
    icon: "i-heroicons-link",
  },
  {
    id: "stores",
    label: "Stores",
    icon: "i-heroicons-circle-stack",
  },
  {
    id: "authentication",
    label: "Authentication",
    icon: "i-heroicons-lock-closed",
  },
  {
    id: "api-routes",
    label: "API Routes",
    icon: "i-heroicons-server",
  },
  {
    id: "ui-patterns",
    label: "UI Patterns",
    icon: "i-heroicons-paint-brush",
  },
  {
    id: "tailwind",
    label: "Tailwind CSS",
    icon: "i-heroicons-swatch",
  },
  {
    id: "type-safety",
    label: "Type Safety",
    icon: "i-heroicons-shield-check",
  },
  {
    id: "best-practices",
    label: "Best Practices",
    icon: "i-heroicons-star",
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
  components: defineAsyncComponent(() => import("~/components/developer/ComponentPatterns.vue")),
  composables: defineAsyncComponent(() => import("~/components/developer/ComposablesGuide.vue")),
  stores: defineAsyncComponent(() => import("~/components/developer/StoresGuide.vue")),
  authentication: defineAsyncComponent(
    () => import("~/components/developer/AuthenticationGuide.vue")
  ),
  "api-routes": defineAsyncComponent(() => import("~/components/developer/ApiRoutesGuide.vue")),
  "ui-patterns": defineAsyncComponent(() => import("~/components/developer/UIPatternsGuide.vue")),
  tailwind: defineAsyncComponent(() => import("~/components/developer/TailwindGuide.vue")),
  "type-safety": defineAsyncComponent(() => import("~/components/developer/TypeSafetyGuide.vue")),
  "best-practices": defineAsyncComponent(
    () => import("~/components/developer/BestPracticesGuide.vue")
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
    :ui="{ content: 'w-full lg:!w-[50vw] !max-w-none' }"
    @update:open="emit('update:open', $event)"
  >
    <template #content>
      <div class="flex h-full w-full flex-col bg-[var(--ui-bg)]">
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
