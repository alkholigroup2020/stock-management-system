<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from "~/composables/useAuth";
import { usePermissions } from "~/composables/usePermissions";

const route = useRoute();
const { user, isAuthenticated } = useAuth();
const permissions = usePermissions();

// Get loading state for overlay visibility
const { isLoading } = useLoadingIndicator();

// Hierarchical navigation items configuration
interface NavItem {
  label: string;
  icon?: string;
  to?: string;
  children?: NavItem[];
  permission?: boolean;
}

const mainMenuItems = computed<NavItem[]>(() => {
  const items: NavItem[] = [];

  // 1. Dashboard - not visible for PROCUREMENT_SPECIALIST
  if (permissions.canAccessDashboard()) {
    items.push({
      label: "Dashboard",
      icon: "i-heroicons-home",
      to: "/",
      permission: true,
    });
  }

  // 2. Master Data section (expandable)
  const masterDataChildren: NavItem[] = [];
  if (permissions.canManageLocations()) {
    masterDataChildren.push({
      label: "Locations",
      to: "/locations",
      permission: true,
    });
  }
  if (permissions.canManageSuppliers()) {
    masterDataChildren.push({
      label: "Suppliers",
      to: "/suppliers",
      permission: true,
    });
  }
  if (permissions.canManageUsers()) {
    masterDataChildren.push({
      label: "Users",
      to: "/users",
      permission: true,
    });
  }
  if (permissions.canViewItems()) {
    masterDataChildren.push({
      label: "Items",
      to: "/items",
      permission: true,
    });
  }
  if (permissions.canManageNotificationSettings()) {
    masterDataChildren.push({
      label: "Notifications",
      to: "/settings/notifications",
      permission: true,
    });
  }

  if (masterDataChildren.length > 0) {
    items.push({
      label: "Master Data",
      icon: "i-heroicons-cog-6-tooth",
      children: masterDataChildren,
      permission: true,
    });
  }

  // 3. Transactions section (expandable)
  const transactionChildren: NavItem[] = [];

  // Orders (PRF/PO Workflow) - first in Transactions
  if (permissions.canAccessOrders()) {
    transactionChildren.push({
      label: "Orders",
      to: "/orders",
      permission: true,
    });
  }

  if (permissions.canViewDeliveries()) {
    transactionChildren.push({
      label: "Deliveries",
      to: "/deliveries",
      permission: true,
    });
  }
  if (permissions.canPostIssues()) {
    transactionChildren.push({
      label: "Issues",
      to: "/issues",
      permission: true,
    });
  }
  if (permissions.canCreateTransfer()) {
    transactionChildren.push({
      label: "Transfers",
      to: "/transfers",
      permission: true,
    });
  }

  if (transactionChildren.length > 0) {
    items.push({
      label: "Transactions",
      icon: "i-heroicons-arrow-path-rounded-square",
      children: transactionChildren,
      permission: true,
    });
  }

  // 4. POB (single item)
  if (permissions.canEnterPOB()) {
    items.push({
      label: "POB",
      icon: "i-heroicons-users",
      to: "/pob",
      permission: true,
    });
  }

  // 5. Stock Now (single item)
  if (permissions.canViewStock()) {
    items.push({
      label: "Stock Now",
      icon: "i-heroicons-cube",
      to: "/stock-now",
      permission: true,
    });
  }

  // 6. NCR (single item)
  if (permissions.canCreateNCR()) {
    items.push({
      label: "NCR",
      icon: "i-heroicons-exclamation-triangle",
      to: "/ncrs",
      permission: true,
    });
  }

  // 7. Reconciliations (single item)
  if (permissions.canViewReconciliations()) {
    items.push({
      label: "Reconciliations",
      icon: "i-heroicons-calculator",
      to: "/reconciliations",
      permission: true,
    });
  }

  // 8. Reports (single item)
  if (permissions.canViewReportsPage()) {
    items.push({
      label: "Reports",
      icon: "i-heroicons-document-chart-bar",
      to: "/reports",
      permission: true,
    });
  }

  // 9. Periods (single item)
  if (permissions.canClosePeriod()) {
    items.push({
      label: "Periods",
      icon: "i-heroicons-calendar-days",
      to: "/periods",
      permission: true,
    });
  }

  // 10. Period Close (single item)
  if (permissions.canClosePeriod()) {
    items.push({
      label: "Period Close",
      icon: "i-heroicons-lock-closed",
      to: "/period-close",
      permission: true,
    });
  }

  return items;
});

// Page title mappings for cleaner display
const pageTitleMap: Record<string, string> = {
  index: "Dashboard",
  users: "Users",
  "users-create": "Create User",
  "users-id": "User Details",
  "users-id-edit": "Edit User",
  locations: "Locations",
  "locations-create": "Create Location",
  "locations-id": "Location Details",
  "locations-id-edit": "Edit Location",
  suppliers: "Suppliers",
  "suppliers-create": "Create Supplier",
  "suppliers-id": "Supplier Details",
  "suppliers-id-edit": "Edit Supplier",
  items: "Items",
  "items-create": "Create Item",
  "items-id": "Item Details",
  "items-id-edit": "Edit Item",
  deliveries: "Deliveries & Invoices",
  "deliveries-create": "Create Delivery",
  "deliveries-id": "Delivery Details",
  "deliveries-id-edit": "Edit Delivery",
  issues: "Issues",
  "issues-create": "Create Issue",
  "issues-id": "Issue Details",
  transfers: "Transfers",
  "transfers-create": "Create Transfer",
  "transfers-id": "Transfer Details",
  ncrs: "NCR",
  "ncrs-create": "Create NCR",
  "ncrs-id": "NCR Details",
  "stock-now": "Stock Now",
  reconciliations: "Reconciliations",
  "reconciliations-id": "Reconciliation Details",
  reports: "Reports",
  periods: "Periods",
  "periods-id": "Period Details",
  "period-close": "Period Close",
  pob: "POB",
  profile: "My Profile",
  orders: "Orders",
  "orders-prfs": "Purchase Requisitions",
  "orders-prfs-create": "Create PRF",
  "orders-prfs-id": "PRF Details",
  "orders-pos": "Purchase Orders",
  "orders-pos-create": "Create PO",
  "orders-pos-id": "PO Details",
  settings: "Settings",
  "settings-notifications": "Notification Settings",
};

// Get page title from route
const pageTitle = computed(() => {
  const name = route.name as string;
  if (!name) return "Dashboard";

  // Check for exact match first
  if (pageTitleMap[name]) {
    return pageTitleMap[name];
  }

  // Fallback: Format route name to title, filtering out 'id' segments
  return name
    .split("-")
    .filter((word) => word !== "id")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
});

// Theme toggle
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};

// Logout handler
const handleLogout = async () => {
  await useAuth().logout();
  await navigateTo("/login");
};

// Help drawer state
const helpDrawerOpen = ref(false);

const openHelpDrawer = () => {
  helpDrawerOpen.value = true;
};

// Developer Guide navigation (dev mode only)
const navigateToDevGuide = () => {
  navigateTo("/dev-guide");
};

// Show dev tools only in development mode
const showDevTools = computed(() => import.meta.dev);

// Testing plan state
const { isPanelOpen, isLargeScreen, togglePanel, closePanel } = useTestingPlanProgress();

// Keyboard shortcut for help (? or F1) and developer guide (Ctrl+Shift+D)
const handleGlobalKeydown = (event: KeyboardEvent) => {
  // Don't trigger if user is typing in an input
  const target = event.target as HTMLElement;
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
    return;
  }

  // Check for ? key (Shift + /) or F1 for help
  if ((event.key === "?" && !event.ctrlKey && !event.altKey) || event.key === "F1") {
    event.preventDefault();
    openHelpDrawer();
  }

  // Check for Ctrl+Shift+D for developer guide (dev mode only)
  if (event.key === "D" && event.ctrlKey && event.shiftKey && showDevTools.value) {
    event.preventDefault();
    navigateToDevGuide();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKeydown);
});
</script>

<template>
  <!-- Skip to main content link for keyboard users -->
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
  >
    Skip to main content
  </a>

  <!-- Dashboard Layout using Nuxt UI Dashboard Components -->
  <UDashboardGroup
    storage="local"
    storage-key="stock-management-dashboard"
    class="transition-all duration-300"
    :class="{ 'lg:mr-[400px]': isPanelOpen && isLargeScreen }"
  >
    <!-- SIDEBAR -->
    <UDashboardSidebar
      collapsible
      resizable
      width="260"
      :toggle="{ color: 'neutral', variant: 'ghost', icon: 'i-heroicons-bars-3' }"
      class="bg-elevated"
    >
      <!-- Logo Header -->
      <template #header="{ collapsed }">
        <!-- Expanded: Logo + Text -->
        <NuxtLink
          v-if="!collapsed"
          to="/"
          aria-label="Go to dashboard"
          class="group flex items-center gap-3 px-2 py-3 rounded-lg transition-all duration-200 cursor-pointer hover:bg-elevated/50"
        >
          <div class="relative flex-shrink-0 w-11 h-11">
            <img
              src="~/assets/css/icons/app-icon.svg"
              alt="Stock Management System"
              class="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div class="flex flex-col min-w-0 flex-1">
            <span
              class="text-base font-bold text-primary truncate group-hover:text-emerald-400 transition-colors duration-200"
            >
              Stock Management
            </span>
            <span class="text-xs text-muted truncate">Inventory System</span>
          </div>
        </NuxtLink>

        <!-- Collapsed: Logo only, centered -->
        <div v-else class="flex justify-center w-full px-0">
          <NuxtLink
            to="/"
            aria-label="Go to dashboard"
            class="group p-2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-elevated/50"
          >
            <div class="relative w-10 h-10">
              <img
                src="~/assets/css/icons/app-icon.svg"
                alt="Stock Management System"
                class="w-full h-full object-cover rounded-xl"
              />
            </div>
          </NuxtLink>
        </div>
      </template>

      <!-- Navigation Menu -->
      <template #default="{ collapsed }">
        <!-- Hierarchical Navigation Menu -->
        <LayoutHierarchicalNav :items="mainMenuItems" :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <!-- MAIN CONTENT PANEL -->
    <UDashboardPanel :width="null">
      <!-- Header/Navbar -->
      <template #header>
        <header
          aria-label="Page header"
          class="flex items-center justify-between w-full h-12 px-4 sm:px-6 border-b border-default bg-elevated"
        >
          <!-- Left: Sidebar toggle (mobile) / collapse (desktop) -->
          <div class="flex items-center gap-4">
            <UDashboardSidebarToggle class="lg:hidden" />
            <UDashboardSidebarCollapse size="md" class="hidden lg:flex" />
          </div>

          <!-- Center section: Location and Period indicators -->
          <div class="flex items-center gap-2 sm:gap-4 flex-1 justify-center">
            <!-- Location Switcher -->
            <LayoutLocationSwitcher />

            <!-- Divider -->
            <div class="h-5 w-px bg-border opacity-50" />

            <!-- Period Indicator -->
            <LayoutPeriodIndicator />
          </div>

          <!-- Right side actions -->
          <div class="flex items-center gap-1">
            <!-- Testing Plan Toggle -->
            <TestingPlanToggle @click="togglePanel" />

            <!-- Developer Guide (dev mode only) -->
            <UButton
              v-if="showDevTools"
              icon="i-heroicons-code-bracket"
              color="neutral"
              variant="ghost"
              aria-label="Developer Guide (Ctrl+Shift+D)"
              class="cursor-pointer"
              @click="navigateToDevGuide"
            />

            <!-- Help -->
            <UButton
              icon="i-heroicons-question-mark-circle"
              color="neutral"
              variant="ghost"
              aria-label="Help (Press ? or F1)"
              class="cursor-pointer"
              @click="openHelpDrawer"
            />

            <!-- Theme Toggle -->
            <UButton
              :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
              color="neutral"
              variant="ghost"
              aria-label="Toggle color mode"
              class="cursor-pointer"
              @click="toggleTheme"
            />

            <!-- User Menu with Logout -->
            <UDropdownMenu
              v-if="isAuthenticated && user"
              :items="[
                [
                  {
                    label: user.full_name || user.email,
                    icon: 'i-heroicons-user-circle',
                    type: 'label',
                  },
                  {
                    label: user.role,
                    icon: 'i-heroicons-shield-check',
                    type: 'label',
                  },
                ],
                [
                  {
                    label: 'Profile',
                    icon: 'i-heroicons-user',
                    onSelect: () => navigateTo('/profile'),
                  },
                ],
                [
                  {
                    label: 'Logout',
                    icon: 'i-heroicons-arrow-right-on-rectangle',
                    onSelect: handleLogout,
                  },
                ],
              ]"
              :content="{ side: 'bottom', align: 'end' }"
            >
              <UButton
                icon="i-heroicons-user-circle"
                color="neutral"
                variant="ghost"
                aria-label="User menu"
                class="cursor-pointer"
              />
            </UDropdownMenu>
          </div>
        </header>
      </template>

      <!-- Body content -->
      <template #body>
        <div class="relative h-full" :class="{ 'overflow-hidden': isLoading }">
          <!-- Page navigation loading overlay -->
          <LayoutPageLoadingOverlay />

          <main
            id="main-content"
            aria-label="Main content"
            class="py-2 px-0 sm:px-12 xl:py-4 xl:px-16 max-w-[1920px] mx-auto w-full"
          >
            <slot />
          </main>
        </div>
      </template>

      <!-- Footer -->
      <template #footer>
        <footer
          role="contentinfo"
          aria-label="Site footer"
          class="border-t border-default bg-elevated w-full h-fit-content"
        >
          <div class="px-4 sm:px-6 py-2">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <p class="text-caption">
                &copy; {{ new Date().getFullYear() }}
                <span class="hidden sm:inline">Stock Management System.</span>
                All rights reserved.
              </p>
              <p class="hidden sm:block text-caption">Version 1.0.0</p>
            </div>
          </div>
        </footer>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>

  <!-- Help Drawer -->
  <LayoutHelpDrawer v-model:open="helpDrawerOpen" />

  <!-- Testing Plan Panel (lg+ screens) -->
  <TestingPlanPanel v-if="isPanelOpen && isLargeScreen" @close="closePanel" />

  <!-- Testing Plan Modal (smaller screens) -->
  <TestingPlanModal v-if="isPanelOpen && !isLargeScreen" :open="isPanelOpen" @close="closePanel" />
</template>
