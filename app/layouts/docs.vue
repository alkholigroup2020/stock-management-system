<template>
  <div class="docs-layout flex flex-col">
    <!-- Header -->
    <header
      class="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
    >
      <div class="flex items-center justify-between px-6 py-3 gap-4">
        <div class="flex items-center gap-2">
          <UButton
            icon="i-heroicons-arrow-left"
            color="neutral"
            variant="ghost"
            aria-label="Back to Application"
            class="cursor-pointer"
            @click="handleBackToApp"
          />

          <!-- Mobile sidebar toggle -->
          <UButton
            icon="i-heroicons-bars-3"
            color="neutral"
            variant="ghost"
            aria-label="Toggle Sidebar"
            class="cursor-pointer lg:hidden"
            @click="toggleSidebar"
          />

          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-code-bracket" class="text-xl text-primary-600" />
            <span class="text-lg font-semibold text-gray-900 dark:text-gray-100 hidden sm:inline">
              Developer Guide
            </span>
          </div>
        </div>

        <!-- Search Component -->
        <div class="flex-1 max-w-md hidden md:block">
          <DeveloperDocsSearch />
        </div>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <DeveloperDocsSidebar />

      <!-- Main content area -->
      <main class="flex-1 overflow-auto">
        <!-- Content wrapper -->
        <DeveloperDocsContent>
          <slot />
        </DeveloperDocsContent>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const { toggleSidebar } = useDevGuideNav();

const handleBackToApp = () => {
  // Try to go back in history, otherwise navigate to dashboard
  if (window.history.length > 1) {
    router.back();
  } else {
    navigateTo("/");
  }
};
</script>

<style scoped>
.docs-layout {
  min-height: 100vh;
  background-color: var(--color-gray-50);
}

.dark .docs-layout {
  background-color: var(--color-gray-950);
}
</style>
