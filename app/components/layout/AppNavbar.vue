<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

// Emits
const emit = defineEmits<{
  toggleSidebar: []
  toggleMobileSidebar: []
}>()

// Color mode
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === "dark")

const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark"
}

// Auth
const { user, isAuthenticated, logout } = useAuth()

// User menu
const userMenuItems = [
  [{
    label: 'Profile',
    icon: 'i-heroicons-user',
    click: () => {
      // Navigate to profile page (to be implemented)
    }
  }],
  [{
    label: 'Logout',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    click: async () => {
      await logout()
      await navigateTo('/login')
    }
  }]
]

// Handle sidebar toggle
const handleToggleSidebar = () => {
  emit('toggleSidebar')
}

const handleToggleMobileSidebar = () => {
  emit('toggleMobileSidebar')
}
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]"
  >
    <div class="w-full h-full px-4">
      <nav class="flex items-center justify-between h-full">
        <!-- Left Section: Sidebar Toggle + Logo/Brand -->
        <div class="flex items-center gap-3">
          <!-- Sidebar Toggle (Desktop) -->
          <UButton
            icon="i-heroicons-bars-3"
            color="neutral"
            variant="ghost"
            aria-label="Toggle sidebar"
            class="hidden lg:flex"
            @click="handleToggleSidebar"
          />

          <!-- Mobile Menu Toggle -->
          <UButton
            icon="i-heroicons-bars-3"
            color="neutral"
            variant="ghost"
            aria-label="Toggle menu"
            class="lg:hidden"
            @click="handleToggleMobileSidebar"
          />

          <!-- Logo/Brand -->
          <NuxtLink to="/" class="flex items-center gap-2">
            <div
              class="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-navy-500 to-emerald-400"
            >
              <span class="text-white font-bold text-xl">SM</span>
            </div>
            <div class="hidden md:flex flex-col">
              <span
                class="text-base font-bold text-navy-600 dark:text-navy-400"
              >Stock Management</span>
            </div>
          </NuxtLink>
        </div>

        <!-- Center Section: Location & Period (if authenticated) -->
        <div v-if="isAuthenticated" class="flex items-center gap-3">
          <!-- Location Switcher -->
          <LayoutLocationSwitcher />

          <!-- Divider -->
          <div class="hidden md:block h-6 w-px bg-[var(--ui-border)]" />

          <!-- Period Indicator -->
          <LayoutPeriodIndicator />
        </div>

        <!-- Right Side Actions -->
        <div class="flex items-center gap-2">
          <!-- Theme Switcher -->
          <UButton
            :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
            color="neutral"
            variant="ghost"
            aria-label="Toggle theme"
            @click="toggleTheme"
          />

          <!-- User Menu (if authenticated) -->
          <UDropdown
            v-if="isAuthenticated && user"
            :items="userMenuItems"
            :popper="{ placement: 'bottom-end' }"
          >
            <UButton
              color="neutral"
              variant="ghost"
              :label="user.full_name || user.email"
              trailing-icon="i-heroicons-chevron-down-20-solid"
              class="hidden sm:flex"
            >
              <template #leading>
                <UAvatar
                  :alt="user.full_name || user.email"
                  size="xs"
                />
              </template>
            </UButton>

            <!-- Mobile: Just show avatar -->
            <UButton
              color="neutral"
              variant="ghost"
              class="sm:hidden"
            >
              <UAvatar
                :alt="user.full_name || user.email"
                size="xs"
              />
            </UButton>
          </UDropdown>
        </div>
      </nav>
    </div>
  </header>
</template>

<style scoped>
/* Smooth transitions for theme switching */
header {
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
</style>
