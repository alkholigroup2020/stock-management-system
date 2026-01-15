<template>
  <aside
    class="docs-sidebar border-r border-default bg-elevated"
    @keydown="handleKeyDown"
  >
    <nav class="p-4">
      <ul class="space-y-1" role="menu">
        <li v-for="(section, index) in navSections" :key="section.id" role="none">
          <button
            :ref="(el) => (buttonRefs[index] = el as HTMLButtonElement)"
            type="button"
            role="menuitem"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
            :class="
              activeSection === section.id
                ? 'bg-accented text-primary font-medium'
                : 'text-default hover:bg-muted'
            "
            @click="navigateToSection(section.id)"
          >
            <UIcon :name="section.icon" class="w-5 h-5 flex-shrink-0" />
            <span class="flex-1 text-left truncate">{{ section.label }}</span>
          </button>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup lang="ts">
const { activeSection, navSections, navigateToSection } = useDevGuideNav();

// Keyboard navigation support
const buttonRefs = ref<HTMLButtonElement[]>([]);
const currentFocusIndex = ref<number>(navSections.findIndex((s) => s.id === activeSection.value));

const handleKeyDown = (event: KeyboardEvent) => {
  const currentIndex = currentFocusIndex.value;
  const totalItems = navSections.length;

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      currentFocusIndex.value = (currentIndex + 1) % totalItems;
      buttonRefs.value[currentFocusIndex.value]?.focus();
      break;
    case "ArrowUp":
      event.preventDefault();
      currentFocusIndex.value = (currentIndex - 1 + totalItems) % totalItems;
      buttonRefs.value[currentFocusIndex.value]?.focus();
      break;
    case "Home":
      event.preventDefault();
      currentFocusIndex.value = 0;
      buttonRefs.value[0]?.focus();
      break;
    case "End":
      event.preventDefault();
      currentFocusIndex.value = totalItems - 1;
      buttonRefs.value[totalItems - 1]?.focus();
      break;
  }
};

// Update focus index when active section changes
watch(activeSection, (newSection) => {
  currentFocusIndex.value = navSections.findIndex((s) => s.id === newSection);
});
</script>

<style scoped>
.docs-sidebar {
  width: 280px;
  height: 100vh;
  overflow-y: auto;
  position: sticky;
  top: 0;
}

/* Hide sidebar on mobile - mobile uses USlideover drawer instead */
@media (max-width: 767px) {
  .docs-sidebar {
    display: none;
  }
}
</style>
