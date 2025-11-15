<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";
import { usePermissions } from "~/composables/usePermissions";

// Props
const props = defineProps<{
  isOpen: boolean;
  isMobileOpen: boolean;
}>();

// Emits
const emit = defineEmits<{
  closeMobile: [];
}>();

// Auth and permissions
const { isAuthenticated } = useAuth();
const permissions = usePermissions();

// Navigation menu structure
interface MenuItem {
  label: string;
  icon: string;
  to: string;
  permission?: () => boolean;
}

// Define all navigation menu items with permissions
const allMenuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: "i-heroicons-home",
    to: "/",
    // No permission check - all authenticated users can access
  },
  {
    label: "Locations",
    icon: "i-heroicons-map-pin",
    to: "/locations",
    permission: () => permissions.canManageLocations(),
  },
  {
    label: "POB",
    icon: "i-heroicons-users",
    to: "/pob",
    permission: () => permissions.canEnterPOB(),
  },
  {
    label: "Items & Prices",
    icon: "i-heroicons-cube",
    to: "/items",
    permission: () => permissions.canViewStock(),
  },
  {
    label: "Deliveries & Invoices",
    icon: "i-heroicons-truck",
    to: "/deliveries",
    permission: () => permissions.canPostDeliveries(),
  },
  {
    label: "Issues",
    icon: "i-heroicons-arrow-trending-down",
    to: "/issues",
    permission: () => permissions.canPostIssues(),
  },
  {
    label: "Transfers",
    icon: "i-heroicons-arrow-path",
    to: "/transfers",
    // All authenticated users can view transfers
  },
  {
    label: "NCR",
    icon: "i-heroicons-exclamation-triangle",
    to: "/ncrs",
    permission: () => permissions.canCreateNCR(),
  },
  {
    label: "Stock Now",
    icon: "i-heroicons-archive-box",
    to: "/stock-now",
    permission: () => permissions.canViewStock(),
  },
  {
    label: "Reconciliations",
    icon: "i-heroicons-calculator",
    to: "/reconciliations",
    permission: () => permissions.canEditReconciliations(),
  },
  {
    label: "Period Close",
    icon: "i-heroicons-lock-closed",
    to: "/period-close",
    permission: () => permissions.canClosePeriod(),
  },
];

// Filter menu items based on permissions
const navigationMenu = computed<MenuItem[]>(() => {
  if (!isAuthenticated.value) return [];

  return allMenuItems.filter((item) => {
    // If no permission check, show the item
    if (!item.permission) return true;
    // Otherwise check the permission
    return item.permission();
  });
});

// Get current route
const route = useRoute();

// Check if route is active
const isActiveRoute = (path: string) => {
  if (path === "/") {
    return route.path === "/";
  }
  return route.path.startsWith(path);
};

// Handle mobile sidebar close
const handleMobileClose = () => {
  emit("closeMobile");
};

// Handle navigation and close mobile menu
const handleNavigate = () => {
  if (props.isMobileOpen) {
    handleMobileClose();
  }
};
</script>

<template>
  <div>
    <!-- Mobile Overlay -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isMobileOpen"
        class="fixed inset-0 bg-black/50 z-40 lg:hidden"
        @click="handleMobileClose"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      class="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-elevated border-r border-default z-40 overflow-y-auto transition-transform duration-300"
      :class="{
        // Mobile behavior (< lg): Only show when mobile menu is open
        '-translate-x-full': !isMobileOpen,
        'translate-x-0': isMobileOpen,
        // Desktop behavior (>= lg): Show/hide based on desktop sidebar state
        'lg:-translate-x-full': !isOpen,
        'lg:translate-x-0': isOpen,
      }"
    >
      <!-- Sidebar Content -->
      <nav class="px-3 py-4 space-y-1">
        <!-- Navigation Items -->
        <template v-for="(item, index) in navigationMenu" :key="index">
          <!-- Menu Item -->
          <NuxtLink
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative"
            :class="{
              'bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary': isActiveRoute(
                item.to
              ),
              'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50':
                !isActiveRoute(item.to),
            }"
            @click="handleNavigate"
          >
            <!-- Left active indicator bar -->
            <div
              v-if="isActiveRoute(item.to)"
              class="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full"
            />

            <!-- Icon -->
            <UIcon
              :name="item.icon"
              class="w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110"
              :class="{
                'text-primary dark:text-primary': isActiveRoute(item.to),
                'text-zinc-500 dark:text-zinc-500': !isActiveRoute(item.to),
              }"
            />

            <!-- Label -->
            <span class="flex-1">{{ item.label }}</span>
          </NuxtLink>
        </template>
      </nav>
    </aside>
  </div>
</template>

<style scoped>
/* Custom scrollbar for sidebar */
aside {
  scrollbar-width: thin;
  scrollbar-color: var(--ui-border) transparent;
}

aside::-webkit-scrollbar {
  width: 6px;
}

aside::-webkit-scrollbar-track {
  background: transparent;
}

aside::-webkit-scrollbar-thumb {
  background-color: var(--ui-border);
  border-radius: 3px;
}

aside::-webkit-scrollbar-thumb:hover {
  background-color: var(--ui-text-muted);
}

/* Smooth transitions */
aside {
  transition: transform 0.3s ease;
}
</style>
