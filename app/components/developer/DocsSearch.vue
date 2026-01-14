<template>
  <div class="docs-search relative">
    <UInput
      v-model="localSearchQuery"
      placeholder="Search documentation..."
      icon="i-heroicons-magnifying-glass"
      size="lg"
      class="w-full"
      @focus="showResults = true"
      @blur="handleBlur"
    />

    <!-- Search Results Dropdown -->
    <div
      v-if="showResults && localSearchQuery.trim()"
      class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
    >
      <!-- Results List -->
      <div v-if="searchResults.length > 0" class="divide-y divide-gray-200 dark:divide-gray-800">
        <button
          v-for="result in searchResults"
          :key="result.id"
          type="button"
          class="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          @click="handleResultClick(result)"
        >
          <div class="flex items-start gap-3">
            <UIcon :name="result.icon" class="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ result.title }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ result.section }}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                {{ result.content }}
              </div>
            </div>
          </div>
        </button>
      </div>

      <!-- No Results -->
      <div v-else class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
        <UIcon name="i-heroicons-magnifying-glass" class="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p class="text-sm">No results found for "{{ localSearchQuery }}"</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { searchQuery, searchResults, navigateToSection } = useDevGuideNav();

// Local search query for debouncing
const localSearchQuery = ref("");
const showResults = ref(false);

// Debounce search query updates (150ms)
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const debouncedUpdate = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    searchQuery.value = localSearchQuery.value;
  }, 150);
};

watch(localSearchQuery, () => {
  debouncedUpdate();
});

// Handle result click
const handleResultClick = (result: any) => {
  navigateToSection(result.sectionId);
  localSearchQuery.value = "";
  searchQuery.value = "";
  showResults.value = false;
};

// Handle blur with delay to allow clicks
const handleBlur = () => {
  setTimeout(() => {
    showResults.value = false;
  }, 200);
};
</script>
