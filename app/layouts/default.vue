<script setup lang="ts">
import { ref } from 'vue'

// Sidebar state management
const isSidebarOpen = ref(true)
const isMobileSidebarOpen = ref(false)

// Toggle sidebar for desktop
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

// Toggle sidebar for mobile
const toggleMobileSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

// Close mobile sidebar when clicking outside
const closeMobileSidebar = () => {
  isMobileSidebarOpen.value = false
}

// Provide sidebar state to child components
provide('sidebarState', {
  isSidebarOpen,
  isMobileSidebarOpen,
  toggleSidebar,
  toggleMobileSidebar,
  closeMobileSidebar
})
</script>

<template>
  <div class="min-h-screen bg-[var(--ui-bg)]">
    <!-- App Navbar -->
    <LayoutAppNavbar
      @toggle-sidebar="toggleSidebar"
      @toggle-mobile-sidebar="toggleMobileSidebar"
    />

    <div class="flex">
      <!-- Sidebar for Desktop -->
      <LayoutAppSidebar
        :is-open="isSidebarOpen"
        :is-mobile-open="isMobileSidebarOpen"
        @close-mobile="closeMobileSidebar"
      />

      <!-- Main Content Area -->
      <main
        class="flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300"
        :class="{
          'ml-64': isSidebarOpen,
          'ml-0': !isSidebarOpen
        }"
      >
        <div class="container mx-auto px-4 py-6 max-w-7xl">
          <!-- Page Content -->
          <slot />
        </div>

        <!-- Optional Footer -->
        <footer class="mt-auto border-t border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]">
          <div class="container mx-auto px-4 py-4 max-w-7xl">
            <div class="flex flex-col md:flex-row justify-between items-center text-sm text-[var(--ui-text-muted)]">
              <p>&copy; {{ new Date().getFullYear() }} Stock Management System. All rights reserved.</p>
              <p class="mt-2 md:mt-0">Version 1.0.0</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Smooth transitions for layout changes */
main {
  transition: margin-left 0.3s ease;
}
</style>
