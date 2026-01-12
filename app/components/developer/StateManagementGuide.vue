<script setup lang="ts">
import type { Ref } from "vue";

const expandedSections = ref<string[]>([]);

const toggleSection = (section: string) => {
  if (expandedSections.value.includes(section)) {
    expandedSections.value = [];
  } else {
    expandedSections.value = [section];
  }
};

const isExpanded = (section: string) => expandedSections.value.includes(section);

const targetSubSection = inject<Ref<string | null>>("devTargetSection", ref(null));

watch(
  targetSubSection,
  (newSection) => {
    if (newSection) {
      if (!expandedSections.value.includes(newSection)) {
        expandedSections.value.push(newSection);
      }
      nextTick(() => {
        const element = document.getElementById(`dev-section-${newSection}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (targetSubSection.value) {
          targetSubSection.value = null;
        }
      });
    }
  },
  { immediate: true }
);

// Code examples
const codeExamples = {
  piniaSetup: `// Pinia is pre-configured in Nuxt 4
// Stores are auto-imported from /app/stores/

// Store definition pattern (Composition API)
export const useExampleStore = defineStore("example", () => {
  // State (reactive refs)
  const items = ref\x3CItem[]>([]);
  const loading = ref(false);

  // Getters (computed)
  const itemCount = computed(() => items.value.length);

  // Actions (functions)
  const fetchItems = async () => {
    loading.value = true;
    items.value = await $fetch("/api/items");
    loading.value = false;
  };

  return { items, loading, itemCount, fetchItems };
});`,

  storeUsage: `// Using stores in components (auto-imported)
const authStore = useAuthStore();
const locationStore = useLocationStore();
const periodStore = usePeriodStore();
const uiStore = useUIStore();

// Access state directly
console.log(authStore.user);
console.log(locationStore.activeLocation);

// Call actions
await authStore.login(email, password);
await locationStore.switchLocation(locationId);`,

  authStoreInterface: `// Auth Store State Interface
interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
}

interface SessionUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "OPERATOR" | "SUPERVISOR" | "ADMIN";
  default_location_id: string | null;
  default_location: {
    id: string;
    code: string;
    name: string;
    type: string;
  } | null;
  locations: string[];  // Location IDs for Operators
}`,

  authStoreGetters: `// Auth Store Getters
const authStore = useAuthStore();

// Authentication state
authStore.isAuthenticated  // boolean
authStore.user             // SessionUser | null
authStore.loading          // boolean
authStore.error            // string | null

// Role checks (computed getters)
authStore.role             // "OPERATOR" | "SUPERVISOR" | "ADMIN" | null
authStore.isAdmin          // boolean
authStore.isSupervisor     // boolean
authStore.isOperator       // boolean
authStore.fullName         // string
authStore.defaultLocation  // Location object or null`,

  authStoreActions: `// Auth Store Actions
const authStore = useAuthStore();

// Login - returns { success, message? }
const result = await authStore.login(email, password);
if (result.success) {
  // Automatically fetches locations and period
}

// Logout - clears session and resets stores
await authStore.logout();

// Fetch session from server
await authStore.fetchSession();

// Location access checks
authStore.hasLocationAccess(locationId);   // Can view?
authStore.canPostAtLocation(locationId);   // Can post transactions?
authStore.canManageLocation(locationId);   // Supervisor+ only
authStore.getAccessibleLocationIds();      // string[]

// Note: Admin/Supervisor have implicit access to ALL locations`,

  locationStoreInterface: `// Location Store State Interface
interface LocationState {
  activeLocationId: string | null;
  userLocations: LocationWithAccess[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheTimeout: number;  // 5 minutes (300000ms)
}

interface LocationWithAccess extends Location {
  access_level?: "VIEW" | "POST" | "MANAGE";
}`,

  locationStoreUsage: `// Location Store Usage
const locationStore = useLocationStore();

// Fetch locations (uses cache if valid)
await locationStore.fetchUserLocations();

// Force refresh (bypass cache)
await locationStore.fetchUserLocations(true);

// Switch active location
await locationStore.switchLocation(newLocationId);

// Access current location
const current = locationStore.activeLocation;
console.log(current?.name);  // "Kitchen"
console.log(current?.code);  // "KIT"

// Check if cache is valid
if (!locationStore.isCacheValid) {
  await locationStore.fetchUserLocations(true);
}

// Manual cache invalidation
locationStore.invalidateCache();`,

  locationSwitcherExample: `// Real-world example: LocationSwitcher.vue
<script setup lang="ts">
const locationStore = useLocationStore();

const locationItems = computed(() => {
  return [
    locationStore.userLocations.map((location) => ({
      label: location.name,
      active: location.id === locationStore.activeLocationId,
      onSelect: async () => {
        await locationStore.switchLocation(location.id);
        await refreshNuxtData();  // Refresh page data
      },
    })),
  ];
});
\x3C/script>

\x3Ctemplate>
  \x3CUDropdown :items="locationItems">
    \x3CUButton>{{ locationStore.activeLocation?.name }}\x3C/UButton>
  \x3C/UDropdown>
\x3C/template>`,

  periodStoreInterface: `// Period Store State Interface
interface PeriodState {
  currentPeriod: Period | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheTimeout: number;  // 10 minutes (600000ms)
}

// Period has longer cache than Location
// because periods change less frequently`,

  periodStoreGetters: `// Period Store Getters
const periodStore = usePeriodStore();

// Period state
periodStore.hasPeriod       // boolean
periodStore.isPeriodOpen    // boolean (status === "OPEN")
periodStore.periodName      // string (e.g., "January 2026")
periodStore.periodStatus    // "OPEN" | "PENDING_CLOSE" | "CLOSED" | "DRAFT"

// Formatted date range (DD/MM/YYYY format)
periodStore.periodDateRange // "15/01/2026 - 31/01/2026"

// Days until period ends
periodStore.daysRemaining   // number (e.g., 16)

// Cache validation
periodStore.isCacheValid    // boolean`,

  periodStoreActions: `// Period Store Actions
const periodStore = usePeriodStore();

// Fetch current period (uses cache if valid)
await periodStore.fetchCurrentPeriod();

// Force refresh
await periodStore.refresh();
// or
await periodStore.fetchCurrentPeriod(true);

// Check before posting transactions
if (!periodStore.isPeriodOpen) {
  throw new Error("Cannot post: Period is not open");
}

// Manual cache invalidation
periodStore.invalidateCache();

// Reset on logout
periodStore.reset();`,

  periodIndicatorExample: `// Real-world example: PeriodIndicator.vue
<script setup lang="ts">
const periodStore = usePeriodStore();

const badgeColor = computed(() => {
  switch (periodStore.currentPeriod?.status) {
    case "OPEN":
      return "success";
    case "PENDING_CLOSE":
      return "warning";
    case "CLOSED":
      return "neutral";
    default:
      return "neutral";
  }
});
\x3C/script>

\x3Ctemplate>
  \x3Cdiv class="flex items-center gap-2">
    \x3Cspan>{{ periodStore.periodName }}\x3C/span>
    \x3CUBadge :color="badgeColor">
      {{ periodStore.periodStatus }}
    \x3C/UBadge>
    \x3Cspan v-if="periodStore.isPeriodOpen" class="text-sm">
      {{ periodStore.daysRemaining }} days left
    \x3C/span>
  \x3C/div>
\x3C/template>`,

  uiStoreInterface: `// UI Store State Interface
interface UIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  toasts: ToastMessage[];
  modals: Record\x3Cstring, ModalState>;
}

interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  timeout?: number;  // Default: 5000ms
}

interface ModalState {
  isOpen: boolean;
  component?: string;
  props?: Record\x3Cstring, unknown>;
}`,

  uiStoreToasts: `// Toast Notifications
const uiStore = useUIStore();

// Convenience methods (recommended)
uiStore.showSuccess("Saved", "Changes saved successfully");
uiStore.showError("Error", "Failed to save changes");
uiStore.showWarning("Warning", "This action cannot be undone");
uiStore.showInfo("Info", "New updates available");

// Custom timeout (default is 5000ms)
uiStore.showSuccess("Quick!", "This disappears fast", 2000);

// Manual toast management
const toastId = uiStore.addToast({
  type: "success",
  title: "Custom Toast",
  description: "With manual control",
  timeout: 10000,
});

// Remove early if needed
uiStore.removeToast(toastId);

// Get active toasts (for rendering)
const toasts = uiStore.activeToasts;`,

  uiStoreModals: `// Modal Management
const uiStore = useUIStore();

// Open a modal
uiStore.openModal("confirmDelete");

// Open with component and props
uiStore.openModal("confirmDelete", "DeleteConfirmModal", {
  itemId: "123",
  itemName: "Widget A",
});

// Check if modal is open
if (uiStore.isModalOpen("confirmDelete")) {
  // Modal is currently visible
}

// Close a modal
uiStore.closeModal("confirmDelete");`,

  uiStoreSidebar: `// Sidebar Management
const uiStore = useUIStore();

// Toggle desktop sidebar
uiStore.toggleSidebar();

// Set explicitly
uiStore.setSidebarCollapsed(true);

// Mobile sidebar
uiStore.toggleMobileSidebar();
uiStore.closeMobileSidebar();

// Access state
const isCollapsed = uiStore.sidebarCollapsed;
const isMobileOpen = uiStore.mobileSidebarOpen;`,

  storeComposition: `// Store Composition - Cross-Store Communication
// Auth store coordinates with Location and Period stores

// In auth.ts login action:
async login(email: string, password: string) {
  const response = await $fetch("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });

  if (response.success) {
    this.user = response.user;

    // Load dependent data in parallel
    await Promise.all([
      useLocationStore().fetchUserLocations(),
      usePeriodStore().fetchCurrentPeriod(),
    ]);
  }
}

// In auth.ts logout action:
async logout() {
  await $fetch("/api/auth/logout", { method: "POST" });

  // Reset all related stores
  this.user = null;
  useLocationStore().reset();
  usePeriodStore().reset();
  useUIStore().reset();
}`,

  storeDependencies: `// Store Dependencies Diagram
//
// ┌─────────────┐
// │  AuthStore  │ ─────┬────────────────────────┐
// └─────────────┘      │                        │
//        │             │                        │
//   login/logout       │                        │
//        │             ▼                        ▼
//        │    ┌────────────────┐    ┌────────────────┐
//        │    │ LocationStore  │    │  PeriodStore   │
//        │    └────────────────┘    └────────────────┘
//        │             │                        │
//        │        5-min cache             10-min cache
//        │             │                        │
//        └─────────────┼────────────────────────┘
//                      │
//                      ▼
//              ┌────────────────┐
//              │    UIStore     │
//              └────────────────┘
//              Toasts, Modals, Sidebar`,

  storeToRefs: `// Reactive Destructuring with storeToRefs
import { storeToRefs } from "pinia";

const authStore = useAuthStore();

// WRONG: Loses reactivity!
const { user, isAuthenticated } = authStore;

// CORRECT: Maintains reactivity
const { user, isAuthenticated } = storeToRefs(authStore);

// Actions don't need storeToRefs (they're not reactive)
const { login, logout } = authStore;

// In templates, access directly from store
\x3Ctemplate>
  \x3Cdiv v-if="authStore.isAuthenticated">
    Welcome, {{ authStore.user?.full_name }}
  \x3C/div>
\x3C/template>`,

  computedFromStore: `// Computed Properties from Store State
const locationStore = useLocationStore();
const authStore = useAuthStore();

// Derived state
const canPostHere = computed(() => {
  return authStore.canPostAtLocation(
    locationStore.activeLocationId ?? ""
  );
});

// Filtered data
const kitchenLocations = computed(() => {
  return locationStore.userLocations.filter(
    (loc) => loc.type === "KITCHEN"
  );
});

// Combined state from multiple stores
const isReadyToPost = computed(() => {
  return (
    authStore.isAuthenticated &&
    locationStore.activeLocation !== null &&
    usePeriodStore().isPeriodOpen
  );
});`,

  watchingStores: `// Watching Store Changes
const locationStore = useLocationStore();

// Watch specific property
watch(
  () => locationStore.activeLocationId,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      // Location changed - refresh data
      await refreshNuxtData();
      uiStore.showInfo("Location Changed", \`Switched to \${locationStore.activeLocation?.name}\`);
    }
  }
);

// Watch computed getter
watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (!isAuth) {
      navigateTo("/login");
    }
  }
);`,

  appInitFlow: `// App Initialization Flow (useAppInit)
// File: app/composables/useAppInit.ts

export const useAppInit = () => {
  const authStore = useAuthStore();
  const locationStore = useLocationStore();
  const periodStore = usePeriodStore();

  const isInitializing = ref(false);
  const isReady = ref(false);

  const initialize = async () => {
    isInitializing.value = true;

    // Step 1: Fetch auth session
    await authStore.fetchSession();

    // Step 2: If authenticated, load context data
    if (authStore.isAuthenticated) {
      await Promise.all([
        locationStore.fetchUserLocations(),
        periodStore.fetchCurrentPeriod(),
      ]);
    }

    isInitializing.value = false;
    isReady.value = true;
  };

  return { initialize, isInitializing, isReady };
};`,

  authPlugin: `// Auth Plugin - Runs on App Startup
// File: app/plugins/auth.client.ts

export default defineNuxtPlugin(async () => {
  const appInit = useAppInit();

  // Initialize app (fetches session, locations, period)
  await appInit.initialize();
});

// In app.vue or layout
\x3Ctemplate>
  \x3CLoadingScreen v-if="!appInit.isReady" />
  \x3CNuxtPage v-else />
\x3C/template>`,

  postLoginLoading: `// Post-Login Loading Pattern
// Shown in LoadingScreen after successful login

async login(email: string, password: string) {
  const response = await $fetch("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });

  if (response.success) {
    this.user = response.user;

    // Show loading screen during data fetch
    const appInit = useAppInit();
    appInit.setLoadingForPostLogin();

    // Fetch essential data in parallel
    await Promise.all([
      useLocationStore().fetchUserLocations(),
      usePeriodStore().fetchCurrentPeriod(),
    ]);

    // Ready to show dashboard
    appInit.setReadyAfterPostLogin();

    return { success: true };
  }
}`,

  cacheInvalidation: `// Cache Invalidation Patterns

// After creating/updating data that affects cached stores:
const locationStore = useLocationStore();
const periodStore = usePeriodStore();

// Invalidate and refetch
locationStore.invalidateCache();
await locationStore.fetchUserLocations(true);

// Or just invalidate (next access will fetch)
periodStore.invalidateCache();

// Check cache validity before operations
if (!locationStore.isCacheValid) {
  await locationStore.fetchUserLocations();
}

// Cache timeouts:
// - LocationStore: 5 minutes (300000ms)
// - PeriodStore: 10 minutes (600000ms)
// - AuthStore: No cache (always fresh from session)`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">State Management</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Pinia stores, reactive patterns, and app state coordination
      </p>
    </div>

    <!-- Pinia Overview Section -->
    <section
      id="dev-section-pinia-overview"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('pinia-overview')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-cube-transparent" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Pinia Overview</span>
        </span>
        <UIcon
          :name="
            isExpanded('pinia-overview') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('pinia-overview')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Pinia is the official state management library for Vue 3. In Nuxt 4, stores are
          auto-imported from <code class="code-inline">/app/stores/</code> and available globally.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Store Definition Pattern
          </h4>
          <DeveloperCodeBlock :code="codeExamples.piniaSetup" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Using Stores</h4>
          <DeveloperCodeBlock :code="codeExamples.storeUsage" language="typescript" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Available Stores</h4>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-lock-closed" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">Auth Store</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                User authentication, roles, location access
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-map-pin" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">Location Store</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Multi-location context, 5-min cache
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-calendar-days" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">Period Store</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Accounting period, 10-min cache
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-window" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">UI Store</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Toasts, modals, sidebar state
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Auth Store Section -->
    <section
      id="dev-section-auth-store"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('auth-store')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-lock-closed" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Auth Store</span>
        </span>
        <UIcon
          :name="isExpanded('auth-store') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('auth-store')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Manages user authentication state, role-based permissions, and location access control.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">State Interface</h4>
          <DeveloperCodeBlock
            :code="codeExamples.authStoreInterface"
            language="typescript"
            filename="app/stores/auth.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Getters</h4>
          <DeveloperCodeBlock :code="codeExamples.authStoreGetters" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Actions</h4>
          <DeveloperCodeBlock :code="codeExamples.authStoreActions" language="typescript" />
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              See the <strong>Authentication Guide</strong> for detailed login/logout flows and
              middleware configuration.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Location Store Section -->
    <section
      id="dev-section-location-store"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('location-store')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-map-pin" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Location Store</span>
        </span>
        <UIcon
          :name="
            isExpanded('location-store') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('location-store')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Manages multi-location context with intelligent 5-minute caching. Tracks user's accessible
          locations and the currently active location.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">State Interface</h4>
          <DeveloperCodeBlock
            :code="codeExamples.locationStoreInterface"
            language="typescript"
            filename="app/stores/location.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Usage</h4>
          <DeveloperCodeBlock :code="codeExamples.locationStoreUsage" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Real-World Example</h4>
          <DeveloperCodeBlock
            :code="codeExamples.locationSwitcherExample"
            language="vue"
            filename="app/components/layout/LocationSwitcher.vue"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              Always call <code class="code-inline">refreshNuxtData()</code> after switching
              locations to update page data.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Period Store Section -->
    <section
      id="dev-section-period-store"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('period-store')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-calendar-days" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Period Store</span>
        </span>
        <UIcon
          :name="isExpanded('period-store') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('period-store')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Manages the current accounting period with 10-minute caching. Provides status checks and
          formatted date helpers.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">State Interface</h4>
          <DeveloperCodeBlock
            :code="codeExamples.periodStoreInterface"
            language="typescript"
            filename="app/stores/period.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Getters</h4>
          <DeveloperCodeBlock :code="codeExamples.periodStoreGetters" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Actions</h4>
          <DeveloperCodeBlock :code="codeExamples.periodStoreActions" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Real-World Example</h4>
          <DeveloperCodeBlock
            :code="codeExamples.periodIndicatorExample"
            language="vue"
            filename="app/components/layout/PeriodIndicator.vue"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-error)]">
            <UIcon name="i-heroicons-exclamation-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Critical:</strong> Always check
              <code class="code-inline">isPeriodOpen</code> before allowing transaction posts.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- UI Store Section -->
    <section
      id="dev-section-ui-store"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('ui-store')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-window" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">UI Store</span>
        </span>
        <UIcon
          :name="isExpanded('ui-store') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('ui-store')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Manages application-level UI state: toast notifications, modal dialogs, and sidebar
          visibility.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">State Interface</h4>
          <DeveloperCodeBlock
            :code="codeExamples.uiStoreInterface"
            language="typescript"
            filename="app/stores/ui.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Toast Notifications</h4>
          <DeveloperCodeBlock :code="codeExamples.uiStoreToasts" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Modal Management</h4>
          <DeveloperCodeBlock :code="codeExamples.uiStoreModals" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Sidebar Control</h4>
          <DeveloperCodeBlock :code="codeExamples.uiStoreSidebar" language="typescript" />
        </div>
      </div>
    </section>

    <!-- Store Composition Section -->
    <section
      id="dev-section-store-composition"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('store-composition')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrows-pointing-in" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Store Composition</span>
        </span>
        <UIcon
          :name="
            isExpanded('store-composition') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('store-composition')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Stores can communicate with each other. The Auth Store coordinates with Location and
          Period stores during login/logout.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Cross-Store Communication
          </h4>
          <DeveloperCodeBlock :code="codeExamples.storeComposition" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Store Dependencies Diagram
          </h4>
          <DeveloperCodeBlock :code="codeExamples.storeDependencies" language="plaintext" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key Patterns</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Login:</strong> Auth store fetches Location and Period data in parallel
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Logout:</strong> Auth store resets all dependent stores
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Location Switch:</strong> May require period refresh for location-specific
                data
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Reactive Patterns Section -->
    <section
      id="dev-section-reactive-patterns"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('reactive-patterns')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-path" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Reactive Patterns</span>
        </span>
        <UIcon
          :name="
            isExpanded('reactive-patterns') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('reactive-patterns')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Best practices for using Pinia stores reactively in Vue components.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Using storeToRefs for Destructuring
          </h4>
          <DeveloperCodeBlock :code="codeExamples.storeToRefs" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Computed Properties from Stores
          </h4>
          <DeveloperCodeBlock :code="codeExamples.computedFromStore" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Watching Store Changes</h4>
          <DeveloperCodeBlock :code="codeExamples.watchingStores" language="typescript" />
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Common Mistake:</strong> Destructuring state without
              <code class="code-inline">storeToRefs()</code> loses reactivity. Actions don't need
              it.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- App Initialization Section -->
    <section
      id="dev-section-app-initialization"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('app-initialization')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-play" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Store Initialization</span>
        </span>
        <UIcon
          :name="
            isExpanded('app-initialization')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('app-initialization')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          How stores are initialized on app startup and after user login.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            useAppInit Composable Flow
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.appInitFlow"
            language="typescript"
            filename="app/composables/useAppInit.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Auth Plugin</h4>
          <DeveloperCodeBlock
            :code="codeExamples.authPlugin"
            language="typescript"
            filename="app/plugins/auth.client.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Post-Login Loading</h4>
          <DeveloperCodeBlock :code="codeExamples.postLoginLoading" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Cache Invalidation</h4>
          <DeveloperCodeBlock :code="codeExamples.cacheInvalidation" language="typescript" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Initialization Sequence</h4>
          <ol class="list-inside list-decimal space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>App starts, auth.client.ts plugin runs</li>
            <li>
              <code class="code-inline">useAppInit().initialize()</code> called
            </li>
            <li>Auth session fetched from server</li>
            <li>If authenticated: Location and Period fetched in parallel</li>
            <li>
              <code class="code-inline">isReady = true</code>, app renders
            </li>
            <li>On login: Same flow with loading screen</li>
            <li>On logout: All stores reset</li>
          </ol>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.code-inline {
  @apply rounded bg-[var(--ui-bg-muted)] px-1.5 py-0.5 font-mono text-xs;
}
</style>
