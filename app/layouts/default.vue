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

  if (permissions.canEnterPOB()) {
    items.push({
      label: "POB",
      icon: "i-heroicons-users",
      to: "/pob",
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

  items.push({
    label: "Transfers",
    icon: "i-heroicons-arrow-path",
    to: "/transfers",
  });

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

  if (permissions.canEditReconciliations()) {
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

// Get page title from route
const pageTitle = computed(() => {
  // Format route name to title (e.g., "dashboard" -> "Dashboard")
  const name = route.name as string;
  if (!name) return "Dashboard";
  if (name === "index") return "Dashboard";
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
});

// Theme toggle
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};
</script>

<template>
  <UApp>
    <!-- Dashboard Layout using Nuxt UI Dashboard Components -->
    <UDashboardGroup storage="local" storage-key="stock-management-dashboard">
      <!-- SIDEBAR -->
      <UDashboardSidebar collapsible resizable>
        <!-- Logo Header -->
        <template #header="{ collapsed }">
          <NuxtLink
            to="/"
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
          <div class="space-y-1">
            <UNavigationMenu
              :collapsed="collapsed"
              :items="mainMenuItems"
              orientation="vertical"
              class="[&_a]:py-3"
            />
          </div>
        </template>

        <!-- User Profile Footer -->
        <template #footer="{ collapsed }">
          <UDropdown
            v-if="isAuthenticated && user"
            :items="[
              [
                {
                  label: 'Profile',
                  icon: 'i-heroicons-user',
                  click: () => {},
                },
              ],
              [
                {
                  label: 'Logout',
                  icon: 'i-heroicons-arrow-right-on-rectangle',
                  click: async () => {
                    await useAuth().logout();
                    await navigateTo('/login');
                  },
                },
              ],
            ]"
            :popper="{ placement: 'top-start' }"
          >
            <UButton
              :avatar="{ alt: user.full_name || user.email }"
              :label="collapsed ? undefined : user.full_name || 'User'"
              color="neutral"
              variant="ghost"
              class="w-full"
              :block="collapsed"
            />
          </UDropdown>
        </template>
      </UDashboardSidebar>

      <!-- MAIN CONTENT PANEL -->
      <UDashboardPanel>
        <!-- Header/Navbar -->
        <template #header>
          <div
            class="flex items-center justify-between w-full h-12 px-4 sm:px-6 border-b border-default bg-elevated"
          >
            <!-- Left: Sidebar collapse and title -->
            <div class="flex items-center gap-4">
              <UDashboardSidebarCollapse size="md" />
              <h1 class="text-default">{{ pageTitle }}</h1>
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
              />

              <!-- Theme Toggle -->
              <UButton
                :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
                color="neutral"
                variant="ghost"
                aria-label="Toggle color mode"
                @click="toggleTheme"
              />
            </div>
          </div>
        </template>

        <!-- Body content -->
        <template #body>
          <div class="py-2 px-4 sm:px-12 xl:py-4 xl:px-16">
            <slot />
          </div>
        </template>

        <!-- Footer -->
        <template #footer>
          <footer class="border-t border-default bg-elevated w-full h-fit-content">
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
  </UApp>
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
