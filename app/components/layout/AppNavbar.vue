<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";

// Emits
const emit = defineEmits<{
  toggleSidebar: [];
  toggleMobileSidebar: [];
}>();

// Color mode
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};

// Auth
const { user, isAuthenticated, logout } = useAuth();

// User menu
const userMenuItems = [
  [
    {
      label: "Profile",
      icon: "i-heroicons-user",
      click: () => {
        // Navigate to profile page (to be implemented)
      },
    },
  ],
  [
    {
      label: "Logout",
      icon: "i-heroicons-arrow-right-on-rectangle",
      click: async () => {
        await logout();
        await navigateTo("/login");
      },
    },
  ],
];

// Handle sidebar toggle
const handleToggleSidebar = () => {
  emit("toggleSidebar");
};

const handleToggleMobileSidebar = () => {
  emit("toggleMobileSidebar");
};
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 h-[100px] border-b border-default bg-elevated">
    <div class="w-full h-full flex items-center justify-between px-4 md:px-6">
      <!-- Left Section: Navigation Toggle + Brand -->
      <div class="flex items-center gap-4 flex-1">
        <!-- Sidebar Toggle Button -->
        <UButton
          icon="i-heroicons-bars-3-20-solid"
          color="neutral"
          variant="ghost"
          aria-label="Toggle sidebar"
          class="lg:hidden"
          @click="handleToggleMobileSidebar"
        />

        <UButton
          icon="i-heroicons-bars-3-20-solid"
          color="neutral"
          variant="ghost"
          aria-label="Toggle sidebar"
          class="hidden lg:inline-flex"
          @click="handleToggleSidebar"
        />

        <!-- Brand/Logo -->
        <NuxtLink
          to="/"
          class="flex items-center gap-3 hover:opacity-75 transition-opacity"
          aria-label="Home"
        >
          <div
            class="flex items-center justify-center w-10 h-10 rounded-lg bg-linear-to-br from-primary to-secondary shadow-sm"
          >
            <span class="text-white font-bold text-sm">SM</span>
          </div>
          <div class="hidden sm:block">
            <div class="text-sm font-semibold text-default">Stock Management</div>
          </div>
        </NuxtLink>
      </div>

      <!-- Center Section: Context Info (Desktop) -->
      <div v-if="isAuthenticated" class="hidden md:flex items-center gap-4 flex-1 justify-center">
        <!-- Location Switcher -->
        <!-- <LayoutLocationSwitcher /> -->

        <!-- Divider -->
        <div class="h-5 w-px bg-border opacity-50" />

        <!-- Period Indicator -->
        <LayoutPeriodIndicator />
      </div>

      <!-- Right Section: Actions -->
      <div class="flex items-center gap-1 ml-auto">
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

        <!-- User Menu -->
        <UDropdown
          v-if="isAuthenticated && user"
          :items="userMenuItems"
          :popper="{ placement: 'bottom-end' }"
        >
          <UButton color="neutral" variant="ghost" aria-label="User menu">
            <UAvatar :alt="user.full_name || user.email" size="sm" />
          </UButton>
        </UDropdown>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Smooth transitions for theme switching */
header {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}
</style>
