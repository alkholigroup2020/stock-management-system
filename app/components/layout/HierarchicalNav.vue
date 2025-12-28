<script setup lang="ts">
/**
 * Hierarchical Navigation Component
 * Supports expandable parent items with indented child items (no icons on children)
 */

export interface NavItem {
  label: string;
  icon?: string;
  to?: string;
  children?: NavItem[];
  permission?: boolean;
}

interface Props {
  items: NavItem[];
  collapsed?: boolean;
}

const props = defineProps<Props>();
const route = useRoute();

// Track expanded sections with localStorage sync
const STORAGE_KEY = "nav-expanded-sections";

// Initialize from localStorage
const getInitialState = (): Record<string, boolean> => {
  if (import.meta.client) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
  return {};
};

const expandedSections = ref<Record<string, boolean>>(getInitialState());

// Sync to localStorage
const syncToStorage = () => {
  if (import.meta.client) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedSections.value));
    } catch {
      // Ignore localStorage errors
    }
  }
};

// Toggle section expansion
const toggleSection = (label: string) => {
  expandedSections.value[label] = !expandedSections.value[label];
  syncToStorage();
};

// Check if a section is expanded
const isSectionExpanded = (label: string) => {
  return expandedSections.value[label] ?? true; // Default to expanded
};

// Check if any child is active (including sub-pages)
const hasActiveChild = (children?: NavItem[]) => {
  if (!children) return false;
  return children.some((child) => {
    if (!child.to) return false;
    // Exact match
    if (route.path === child.to) return true;
    // Sub-page match
    if (child.to !== "/" && route.path.startsWith(child.to + "/")) return true;
    return false;
  });
};

// Check if item is active (exact match or sub-page)
const isActive = (to?: string) => {
  if (!to) return false;
  // Exact match
  if (route.path === to) return true;
  // Sub-page match: /issues/create should highlight /issues
  // But / (dashboard) should only match exactly
  if (to !== "/" && route.path.startsWith(to + "/")) return true;
  return false;
};
</script>

<template>
  <nav aria-label="Main navigation" class="space-y-1 px-2">
    <template v-for="item in items" :key="item.label">
      <!-- Skip items without permission -->
      <template v-if="item.permission !== false">
        <!-- Parent item with children (expandable) -->
        <div v-if="item.children && item.children.length > 0">
          <!-- Parent button -->
          <button
            type="button"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group relative"
            :class="[
              hasActiveChild(item.children)
                ? 'bg-muted text-primary'
                : 'text-default hover:bg-hover hover:text-highlighted',
            ]"
            @click="toggleSection(item.label)"
          >
            <!-- Icon -->
            <UIcon
              v-if="item.icon && !collapsed"
              :name="item.icon"
              class="w-5 h-5 flex-shrink-0 transition-colors"
              :class="[hasActiveChild(item.children) ? 'text-primary' : 'text-muted']"
            />

            <!-- Label -->
            <span v-if="!collapsed" class="flex-1 text-left truncate">
              {{ item.label }}
            </span>

            <!-- Expand/Collapse indicator -->
            <UIcon
              v-if="!collapsed"
              :name="
                isSectionExpanded(item.label)
                  ? 'i-heroicons-chevron-down'
                  : 'i-heroicons-chevron-right'
              "
              class="w-4 h-4 flex-shrink-0 transition-transform"
              :class="[hasActiveChild(item.children) ? 'text-primary' : 'text-muted']"
            />
          </button>

          <!-- Children items (indented container, ends at same point as parent) -->
          <div v-if="isSectionExpanded(item.label) && !collapsed" class="mt-1 space-y-1 ml-8">
            <NuxtLink
              v-for="child in item.children"
              :key="child.label"
              :to="child.to || '#'"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer relative group"
              :class="[
                isActive(child.to)
                  ? 'bg-muted text-primary border-l-4 border-primary'
                  : 'text-default hover:bg-hover hover:text-highlighted border-l-4 border-transparent',
              ]"
              :aria-current="isActive(child.to) ? 'page' : undefined"
            >
              <!-- Child label (no icon) -->
              <span class="truncate">{{ child.label }}</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Single item (no children) -->
        <NuxtLink
          v-else
          :to="item.to || '#'"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer relative group"
          :class="[
            isActive(item.to)
              ? 'bg-muted text-primary border-l-4 border-primary'
              : 'text-default hover:bg-hover hover:text-highlighted border-l-4 border-transparent',
          ]"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          <!-- Icon -->
          <UIcon
            v-if="item.icon && !collapsed"
            :name="item.icon"
            class="w-5 h-5 flex-shrink-0 transition-colors"
            :class="[isActive(item.to) ? 'text-primary' : 'text-muted']"
          />

          <!-- Label -->
          <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
        </NuxtLink>
      </template>
    </template>
  </nav>
</template>
