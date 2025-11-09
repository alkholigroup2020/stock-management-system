<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { usePermissions } from '~/composables/usePermissions'

// Props
const props = defineProps<{
  isOpen: boolean
  isMobileOpen: boolean
}>()

// Emits
const emit = defineEmits<{
  closeMobile: []
}>()

// Auth and permissions
const { isAuthenticated } = useAuth()
const permissions = usePermissions()

// Navigation menu structure
interface MenuItem {
  label: string
  icon: string
  to: string
  permission?: () => boolean
}

// Define all navigation menu items with permissions
const allMenuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'i-heroicons-home',
    to: '/'
    // No permission check - all authenticated users can access
  },
  {
    label: 'POB',
    icon: 'i-heroicons-users',
    to: '/pob',
    permission: () => permissions.canEnterPOB()
  },
  {
    label: 'Items & Prices',
    icon: 'i-heroicons-cube',
    to: '/items',
    permission: () => permissions.canViewStock()
  },
  {
    label: 'Deliveries & Invoices',
    icon: 'i-heroicons-truck',
    to: '/deliveries',
    permission: () => permissions.canPostDeliveries()
  },
  {
    label: 'Issues',
    icon: 'i-heroicons-arrow-trending-down',
    to: '/issues',
    permission: () => permissions.canPostIssues()
  },
  {
    label: 'Transfers',
    icon: 'i-heroicons-arrow-path',
    to: '/transfers'
    // All authenticated users can view transfers
  },
  {
    label: 'NCR',
    icon: 'i-heroicons-exclamation-triangle',
    to: '/ncrs',
    permission: () => permissions.canCreateNCR()
  },
  {
    label: 'Stock Now',
    icon: 'i-heroicons-archive-box',
    to: '/stock-now',
    permission: () => permissions.canViewStock()
  },
  {
    label: 'Reconciliations',
    icon: 'i-heroicons-calculator',
    to: '/reconciliations',
    permission: () => permissions.canEditReconciliations()
  },
  {
    label: 'Period Close',
    icon: 'i-heroicons-lock-closed',
    to: '/period-close',
    permission: () => permissions.canClosePeriod()
  }
]

// Filter menu items based on permissions
const navigationMenu = computed<MenuItem[]>(() => {
  if (!isAuthenticated.value) return []

  return allMenuItems.filter(item => {
    // If no permission check, show the item
    if (!item.permission) return true
    // Otherwise check the permission
    return item.permission()
  })
})

// Get current route
const route = useRoute()

// Check if route is active
const isActiveRoute = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

// Handle mobile sidebar close
const handleMobileClose = () => {
  emit('closeMobile')
}

// Handle navigation and close mobile menu
const handleNavigate = () => {
  if (props.isMobileOpen) {
    handleMobileClose()
  }
}
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
    <Transition
      enter-active-class="transition-transform duration-300"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-300"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-if="isOpen || isMobileOpen"
        class="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-[var(--ui-bg-elevated)] border-r border-[var(--ui-border)] z-40 overflow-y-auto transition-transform duration-300"
        :class="{
          'translate-x-0': isOpen || isMobileOpen,
          '-translate-x-full lg:translate-x-0': !isOpen && !isMobileOpen
        }"
      >
        <!-- Sidebar Content -->
        <nav class="p-4 space-y-1">
          <!-- Navigation Items -->
          <template v-for="(item, index) in navigationMenu" :key="index">
            <!-- Menu Item -->
            <NuxtLink
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group"
              :class="{
                'bg-navy-50 dark:bg-navy-900/30 text-navy-700 dark:text-navy-300 border border-navy-200 dark:border-navy-700': isActiveRoute(item.to),
                'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100': !isActiveRoute(item.to)
              }"
              @click="handleNavigate"
            >
              <!-- Icon -->
              <UIcon
                :name="item.icon"
                class="w-5 h-5 flex-shrink-0"
                :class="{
                  'text-navy-600 dark:text-navy-400': isActiveRoute(item.to),
                  'text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300': !isActiveRoute(item.to)
                }"
              />

              <!-- Label -->
              <span class="flex-1">{{ item.label }}</span>

              <!-- Active Indicator -->
              <div
                v-if="isActiveRoute(item.to)"
                class="w-1.5 h-1.5 rounded-full bg-emerald-500"
              />
            </NuxtLink>
          </template>
        </nav>

        <!-- Sidebar Footer (Optional) -->
        <div class="sticky bottom-0 p-4 border-t border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]">
          <div class="text-xs text-[var(--ui-text-muted)] text-center">
            Stock Management v1.0.0
          </div>
        </div>
      </aside>
    </Transition>
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
