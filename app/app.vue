<script setup lang="ts">
/**
 * Root App Component
 *
 * The loading screen is now handled by the 00.loading-screen.client.ts plugin
 * which injects static HTML before Vue mounts. This ensures the loading screen
 * is visible immediately during page load/refresh.
 *
 * This component only renders the main app content after initialization.
 */
const appInit = useAppInit();

// Configure toast notifications position
const toaster = {
  position: "bottom-center" as const,
};
</script>

<template>
  <!-- Main App Content - renders after app initialization -->
  <UApp v-if="appInit.isReady.value" :toaster="toaster">
    <OfflineBanner />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
