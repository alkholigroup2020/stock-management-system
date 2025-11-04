<script setup lang="ts">
const colorMode = useColorMode();

const isDark = computed(() => colorMode.value === "dark");

const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};

// Navigation items
const navigation = [
  {
    label: "Dashboard",
    to: "/",
    icon: "i-heroicons-home",
  },
  {
    label: "Deliveries",
    to: "/deliveries",
    icon: "i-heroicons-truck",
  },
  {
    label: "Issues",
    to: "/issues",
    icon: "i-heroicons-arrow-right-on-rectangle",
  },
  {
    label: "Transfers",
    to: "/transfers",
    icon: "i-heroicons-arrow-path",
  },
  {
    label: "Stock",
    to: "/stock-now",
    icon: "i-heroicons-cube",
  },
];
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
  >
    <div class="container mx-auto px-4">
      <nav class="flex items-center justify-between h-16">
        <!-- Logo/Brand -->
        <div class="flex items-center space-x-2">
          <div
            class="flex items-center justify-center w-10 h-10 rounded-lg bg-linear-to-br from-navy-500 to-emerald-400"
          >
            <span class="text-white font-bold text-xl">FS</span>
          </div>
          <div class="flex flex-col">
            <span
              class="px-2 text-lg font-bold text-emerald-700 dark:text-emerald-400"
              >Stock Management System</span
            >
          </div>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-1">
          <UButton
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            :icon="item.icon"
            color="neutral"
            variant="ghost"
            :label="item.label"
            class="font-medium"
          />
        </div>

        <!-- Right Side Actions -->
        <div class="flex items-center space-x-2">
          <!-- Theme Switcher -->
          <UButton
            :icon="
              isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'
            "
            color="neutral"
            variant="ghost"
            aria-label="Toggle theme"
            @click="toggleTheme"
          />

          <!-- User Menu -->
          <UButton
            icon="i-heroicons-user-circle"
            color="neutral"
            variant="ghost"
            aria-label="User menu"
          />

          <!-- Mobile Menu Toggle -->
          <UButton
            icon="i-heroicons-bars-3"
            color="neutral"
            variant="ghost"
            aria-label="Menu"
            class="md:hidden"
          />
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
