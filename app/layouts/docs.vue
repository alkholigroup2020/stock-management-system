<template>
  <div class="docs-layout flex flex-col">
    <!-- Header -->
    <header
      class="sticky top-0 z-10 border-b border-default bg-elevated"
    >
      <div class="flex items-center justify-between px-6 py-3 gap-4">
        <!-- Left: App Brand + Mobile Menu -->
        <div class="flex items-center gap-4">
          <!-- App Brand - Clickable to return to main app -->
          <button
            type="button"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer group"
            aria-label="Return to Stock Management System"
            @click="handleBackToApp"
          >
            <UIcon
              name="i-heroicons-cube"
              class="text-xl text-primary group-hover:scale-110 transition-transform"
            />
            <span class="text-sm font-medium text-muted group-hover:text-default hidden sm:inline">
              Stock Management
            </span>
          </button>

          <!-- Mobile sidebar toggle -->
          <UButton
            icon="i-heroicons-bars-3"
            color="neutral"
            variant="ghost"
            aria-label="Toggle Sidebar"
            class="cursor-pointer md:hidden"
            @click="toggleMobileMenu"
          />
        </div>

        <!-- Center: Dev Guide Title -->
        <div class="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <UIcon name="i-heroicons-code-bracket" class="text-xl text-primary" />
          <span class="text-lg font-semibold text-default hidden sm:inline">
            Developer Guide
          </span>
        </div>

        <!-- Right: Search Component -->
        <div class="flex-1 max-w-md hidden md:block">
          <DeveloperDocsSearch />
        </div>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Desktop Sidebar -->
      <DeveloperDocsSidebar />

      <!-- Main content area -->
      <main class="flex-1 overflow-auto">
        <!-- Content wrapper -->
        <DeveloperDocsContent>
          <slot />
        </DeveloperDocsContent>
      </main>
    </div>

    <!-- Mobile Navigation Drawer -->
    <USlideover v-model:open="mobileMenuOpen" side="left" class="md:hidden">
      <template #content>
        <div class="flex flex-col h-full bg-elevated">
          <!-- Drawer Header -->
          <div
            class="flex items-center justify-between p-4 border-b border-default"
          >
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-code-bracket" class="text-xl text-primary" />
              <span class="text-lg font-semibold text-default">
                Developer Guide
              </span>
            </div>
            <UButton
              icon="i-heroicons-x-mark"
              color="neutral"
              variant="ghost"
              aria-label="Close menu"
              class="cursor-pointer"
              @click="closeMobileMenu"
            />
          </div>

          <!-- Navigation Items -->
          <nav class="flex-1 overflow-y-auto p-4">
            <ul class="space-y-1">
              <li v-for="section in navSections" :key="section.id">
                <button
                  type="button"
                  class="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer"
                  :class="
                    activeSection === section.id
                      ? 'bg-accented text-primary font-medium'
                      : 'text-default hover:bg-muted'
                  "
                  @click="handleMobileNavClick(section.id)"
                >
                  <UIcon :name="section.icon" class="w-5 h-5 flex-shrink-0" />
                  <span class="flex-1 text-left truncate">{{ section.label }}</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const {
  toggleMobileMenu,
  closeMobileMenu,
  mobileMenuOpen,
  navSections,
  activeSection,
  navigateToSection,
} = useDevGuideNav();

const handleBackToApp = () => {
  // Navigate directly to dashboard
  navigateTo("/");
};

const handleMobileNavClick = (sectionId: string) => {
  navigateToSection(sectionId);
  closeMobileMenu();
};
</script>

<style scoped>
.docs-layout {
  min-height: 100vh;
  background-color: var(--ui-bg);
}
</style>
