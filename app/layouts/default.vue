<script setup lang="ts">
import { ref, provide } from "vue";

// Sidebar state management
const isSidebarOpen = ref(true);
const isMobileSidebarOpen = ref(false);

// Toggle sidebar for desktop
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// Toggle sidebar for mobile
const toggleMobileSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value;
};

// Close mobile sidebar when clicking outside
const closeMobileSidebar = () => {
  isMobileSidebarOpen.value = false;
};

// Provide sidebar state to child components
provide("sidebarState", {
  isSidebarOpen,
  isMobileSidebarOpen,
  toggleSidebar,
  toggleMobileSidebar,
  closeMobileSidebar,
});
</script>

<template>
  <div class="flex flex-col min-h-screen bg-default">
    <!-- App Navbar (Fixed) -->
    <LayoutAppNavbar
      @toggle-sidebar="toggleSidebar"
      @toggle-mobile-sidebar="toggleMobileSidebar"
    />

    <!-- Content wrapper with sidebar and main -->
    <div class="flex flex-1 pt-16 pb-14">
      <!-- Sidebar for Desktop -->
      <LayoutAppSidebar
        :is-open="isSidebarOpen"
        :is-mobile-open="isMobileSidebarOpen"
        @close-mobile="closeMobileSidebar"
      />

      <!-- Main Content Area -->
      <main
        class="flex flex-col flex-1 transition-all duration-300 ml-0"
        :class="{
          'lg:ml-64': isSidebarOpen,
          'lg:ml-0': !isSidebarOpen,
        }"
      >
        <div class="container mx-auto px-4 py-6 max-w-7xl">
          <!-- Page Content -->
          <slot />
        </div>
      </main>
    </div>

    <!-- Footer (Fixed at Bottom of Viewport) -->
    <footer
      class="fixed bottom-0 left-0 right-0 border-t border-default bg-elevated z-40"
    >
      <div class="container mx-auto px-4 py-2 max-w-7xl">
        <div
          class="flex flex-row justify-between items-center text-xs text-muted"
        >
          <p>
            &copy; {{ new Date().getFullYear() }}
            <span class="hidden sm:inline">Stock Management System.</span>
            All rights reserved.
          </p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Smooth transitions for layout changes */
main {
  transition: margin-left 0.3s ease;
}
</style>
