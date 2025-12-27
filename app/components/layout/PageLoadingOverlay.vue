<script setup lang="ts">
/**
 * Page Loading Overlay Component
 *
 * Displays the app logo with a spinner during page navigation.
 * Uses Nuxt's useLoadingIndicator composable to detect navigation state.
 * Only covers the main content area, not the sidebar, header, or footer.
 */

const { isLoading } = useLoadingIndicator();
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isLoading"
      class="absolute inset-0 z-40 flex items-center justify-center bg-default"
      aria-label="Loading page content"
      role="status"
    >
      <div class="flex flex-col items-center gap-4">
        <!-- App Logo -->
        <img
          src="~/assets/css/icons/app-icon.svg"
          alt="Stock Management System"
          class="w-16 h-16 rounded-xl"
        />
        <!-- Spinner with text -->
        <div class="flex items-center gap-3">
          <div
            class="w-5 h-5 border-3 border-primary/30 border-t-primary rounded-full animate-spin"
          />
          <span class="text-sm text-muted font-medium">Loading...</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
