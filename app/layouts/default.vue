<script setup lang="ts">
import { computed } from "vue";
import type { NavigationMenuItem } from "@nuxt/ui";
import { useRoute } from "vue-router";
import { useAuth } from "~/composables/useAuth";
import { usePermissions } from "~/composables/usePermissions";

const route = useRoute();
const { user, isAuthenticated } = useAuth();
const permissions = usePermissions();

// Navigation items configuration
const mainMenuItems = computed<NavigationMenuItem[]>(() => {
  const items: NavigationMenuItem[] = [
    {
      label: "Dashboard",
      icon: "i-heroicons-home",
      to: "/",
    },
  ];

  if (permissions.canManageLocations()) {
    items.push({
      label: "Locations",
      icon: "i-heroicons-map-pin",
      to: "/locations",
    });
  }

  if (permissions.canManageUsers()) {
    items.push({
      label: "Users",
      icon: "i-heroicons-user-group",
      to: "/users",
    });
  }

  if (permissions.canEnterPOB()) {
    items.push({
      label: "POB",
      icon: "i-heroicons-users",
      to: "/pob",
    });
  }

  if (permissions.canManageSuppliers()) {
    items.push({
      label: "Suppliers",
      icon: "i-heroicons-building-office-2",
      to: "/suppliers",
    });
  }

  if (permissions.canViewStock()) {
    items.push({
      label: "Items & Prices",
      icon: "i-heroicons-cube",
      to: "/items",
    });
  }

  if (permissions.canPostDeliveries()) {
    items.push({
      label: "Deliveries & Invoices",
      icon: "i-heroicons-truck",
      to: "/deliveries",
    });
  }

  if (permissions.canPostIssues()) {
    items.push({
      label: "Issues",
      icon: "i-heroicons-arrow-trending-down",
      to: "/issues",
    });
  }

  if (permissions.canCreateTransfer()) {
    items.push({
      label: "Transfers",
      icon: "i-heroicons-arrow-path",
      to: "/transfers",
    });
  }

  if (permissions.canCreateNCR()) {
    items.push({
      label: "NCR",
      icon: "i-heroicons-exclamation-triangle",
      to: "/ncrs",
    });
  }

  if (permissions.canViewStock()) {
    items.push({
      label: "Stock Now",
      icon: "i-heroicons-archive-box",
      to: "/stock-now",
    });
  }

  if (permissions.canViewReconciliations()) {
    items.push({
      label: "Reconciliations",
      icon: "i-heroicons-calculator",
      to: "/reconciliations",
    });
  }

  if (permissions.canViewStock()) {
    items.push({
      label: "Reports",
      icon: "i-heroicons-document-chart-bar",
      to: "/reports",
    });
  }

  if (permissions.canClosePeriod()) {
    items.push({
      label: "Periods",
      icon: "i-heroicons-calendar-days",
      to: "/periods",
    });
  }

  if (permissions.canClosePeriod()) {
    items.push({
      label: "Period Close",
      icon: "i-heroicons-lock-closed",
      to: "/period-close",
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
  items: "Items & Prices",
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
  <UDashboardGroup storage="local" storage-key="stock-management-dashboard">
      <!-- SIDEBAR -->
      <UDashboardSidebar
        collapsible
        resizable
        width="260"
        :toggle="{ color: 'neutral', variant: 'ghost', icon: 'i-heroicons-bars-3' }"
      >
        <!-- Logo Header -->
        <template #header="{ collapsed }">
          <NuxtLink
            to="/"
            aria-label="Go to dashboard"
            class="flex items-center justify-center gap-2 hover:opacity-75 transition-opacity"
          >
            <img
              src="~/assets/css/icons/app-icon.svg"
              alt="Stock Management System"
              class="w-10 h-10 rounded-lg"
            />
            <div v-if="!collapsed" class="flex flex-col min-w-0">
              <span class="text-label truncate">Stock</span>
              <span class="text-caption truncate">Management</span>
            </div>
          </NuxtLink>
        </template>

        <!-- Navigation Menu -->
        <template #default="{ collapsed }">
          <!-- Main Navigation Menu with increased padding -->
          <nav aria-label="Main navigation" class="space-y-1">
            <UNavigationMenu
              :collapsed="collapsed"
              :items="mainMenuItems"
              orientation="vertical"
              class="[&_a]:py-3"
            />
          </nav>
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
            <div class="hidden md:flex items-center gap-4 flex-1 justify-center">
              <!-- Location Switcher -->
              <LayoutLocationSwitcher />

              <!-- Divider -->
              <div class="h-5 w-px bg-border opacity-50" />

              <!-- Period Indicator -->
              <LayoutPeriodIndicator />
            </div>

            <!-- Right side actions -->
            <div class="flex items-center gap-1">
              <!-- Notifications -->
              <UButton
                icon="i-heroicons-bell"
                color="neutral"
                variant="ghost"
                aria-label="Notifications"
                class="cursor-pointer"
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
          <div class="relative h-full">
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
</template>

<style scoped>
/* Active navigation indicator */
:deep(.dashboard-sidebar nav a[aria-current="page"])::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background-color: var(--ui-success, #45cf7b);
  border-radius: 0 2px 2px 0;
}
</style>
