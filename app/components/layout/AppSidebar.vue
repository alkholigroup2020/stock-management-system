<script setup lang="ts">
import { computed } from 'vue'

// Props
const props = defineProps<{
  isOpen: boolean
  isMobileOpen: boolean
}>()

// Emits
const emit = defineEmits<{
  closeMobile: []
}>()

// Navigation menu structure (as per MVP_DEVELOPMENT_TASKS.md)
const navigationMenu = [
  {
    label: 'Dashboard',
    to: '/',
    icon: 'i-heroicons-home'
  },
  {
    label: 'POB',
    to: '/pob',
    icon: 'i-heroicons-user-group'
  },
  {
    label: 'Items & Prices',
    to: '/items',
    icon: 'i-heroicons-cube'
  },
  {
    label: 'Deliveries & Invoices',
    to: '/deliveries',
    icon: 'i-heroicons-truck'
  },
  {
    label: 'Issues',
    to: '/issues',
    icon: 'i-heroicons-arrow-right-on-rectangle'
  },
  {
    label: 'Transfers',
    to: '/transfers',
    icon: 'i-heroicons-arrow-path'
  },
  {
    label: 'NCR',
    to: '/ncrs',
    icon: 'i-heroicons-exclamation-triangle'
  },
  {
    label: 'Stock Now',
    to: '/stock-now',
    icon: 'i-heroicons-clipboard-document-list'
  },
  {
    label: 'Reconciliations',
    to: '/reconciliations',
    icon: 'i-heroicons-calculator'
  },
  {
    label: 'Period Close',
    to: '/period-close',
    icon: 'i-heroicons-lock-closed'
  }
]

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
</script>

<template>
  <div>
    <!-- Mobile Overlay -->
    <div
      v-if="isMobileOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="handleMobileClose"
    />

    <!-- Sidebar -->
    <aside
      class="fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] transition-transform duration-300 bg-[var(--ui-bg-elevated)] border-r border-[var(--ui-border)]"
      :class="{
        // Desktop behavior
        'w-64 translate-x-0': isOpen && !isMobileOpen,
        'w-64 -translate-x-full': !isOpen && !isMobileOpen,
        // Mobile behavior
        'w-64 translate-x-0': isMobileOpen,
        'w-64 -translate-x-full lg:translate-x-0': !isMobileOpen && isOpen,
        'w-64 -translate-x-full': !isMobileOpen && !isOpen
      }"
    >
      <nav class="h-full overflow-y-auto py-4">
        <!-- Navigation Menu -->
        <ul class="space-y-1 px-3">
          <li v-for="item in navigationMenu" :key="item.to">
            <NuxtLink
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              :class="{
                'bg-[var(--ui-primary)] text-white': isActiveRoute(item.to),
                'text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated-hover)]': !isActiveRoute(item.to)
              }"
              @click="handleMobileClose"
            >
              <UIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </aside>
  </div>
</template>

<style scoped>
/* Custom scrollbar for sidebar */
aside nav::-webkit-scrollbar {
  width: 6px;
}

aside nav::-webkit-scrollbar-track {
  background: transparent;
}

aside nav::-webkit-scrollbar-thumb {
  background: var(--ui-border);
  border-radius: 3px;
}

aside nav::-webkit-scrollbar-thumb:hover {
  background: var(--ui-text-muted);
}
</style>
