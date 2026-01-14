<script setup lang="ts">
import type { Ref } from "vue";

// Collapsible sections state
const expandedSections = ref<string[]>([]);

const toggleSection = (section: string) => {
  if (expandedSections.value.includes(section)) {
    expandedSections.value = [];
  } else {
    expandedSections.value = [section];
  }
};

const isExpanded = (section: string) => expandedSections.value.includes(section);

// Inject the target section for deep linking
const targetSubSection = inject<Ref<string | null>>("devTargetSection", ref(null));

watch(
  targetSubSection,
  (newSection) => {
    if (newSection) {
      if (!expandedSections.value.includes(newSection)) {
        expandedSections.value.push(newSection);
      }
      nextTick(() => {
        const element = document.getElementById(`dev-section-${newSection}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (targetSubSection.value) {
          targetSubSection.value = null;
        }
      });
    }
  },
  { immediate: true }
);

// Code examples
const codeExamples = {
  basicTableStructure: `<UCard class="card-elevated" :ui="{ body: 'p-0' }">
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-[var(--ui-border)]">
      <thead>
        <tr class="bg-[var(--ui-bg-elevated)]">
          <th class="px-4 py-3 text-left text-label uppercase tracking-wider">
            Code
          </th>
          <th class="px-4 py-3 text-left text-label uppercase tracking-wider">
            Name
          </th>
          <th class="px-4 py-3 text-right text-label uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-[var(--ui-border)]">
        <tr
          v-for="item in items"
          :key="item.id"
          class="hover:bg-[var(--ui-bg-elevated)] transition-colors"
        >
          <td class="px-4 py-4 whitespace-nowrap font-mono text-sm">
            {{ item.code }}
          </td>
          <td class="px-4 py-4 text-[var(--ui-text)]">
            {{ item.name }}
          </td>
          <td class="px-4 py-4 whitespace-nowrap text-sm text-right">
            <UButton
              color="primary"
              variant="ghost"
              size="xs"
              icon="i-heroicons-pencil"
              class="cursor-pointer"
              @click.stop="navigateTo(\`/items/\${item.id}/edit\`)"
            >
              Edit
            </UButton>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</UCard>`,

  clickableRows: `<tr
  v-for="item in items"
  :key="item.id"
  class="hover:bg-[var(--ui-bg-elevated)] transition-colors"
>
  <!-- Clickable cells navigate to detail page -->
  <td
    class="px-4 py-4 whitespace-nowrap cursor-pointer"
    @click="navigateTo(\`/items/\${item.id}\`)"
  >
    {{ item.code }}
  </td>
  <td
    class="px-4 py-4 cursor-pointer"
    @click="navigateTo(\`/items/\${item.id}\`)"
  >
    {{ item.name }}
  </td>

  <!-- Action buttons with @click.stop to prevent row navigation -->
  <td class="px-4 py-4 text-right">
    <UButton
      icon="i-heroicons-pencil"
      @click.stop="navigateTo(\`/items/\${item.id}/edit\`)"
    >
      Edit
    </UButton>
  </td>
</tr>`,

  paginationState: `// Pagination state
const pagination = ref({
  total: 0,
  page: 1,
  limit: 50,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
});

// Fetch function includes pagination params
async function fetchItems() {
  const params: Record<string, string> = {
    page: String(pagination.value.page),
    limit: String(pagination.value.limit),
  };

  const response = await $fetch("/api/items", {
    method: "GET",
    query: params,
  });

  items.value = response.items;
  pagination.value = response.pagination; // API returns updated pagination
}

// Navigate to page
function goToPage(page: number) {
  if (page < 1 || page > pagination.value.totalPages) return;
  pagination.value.page = page;
  fetchItems();
}`,

  paginationUI: `<!-- Pagination UI -->
<div v-if="pagination.totalPages > 1" class="px-4 py-4 border-t border-[var(--ui-border)]">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <!-- Pagination Info -->
    <div class="text-caption">
      Showing
      <span class="font-medium">
        {{ (pagination.page - 1) * pagination.limit + 1 }}
      </span>
      to
      <span class="font-medium">
        {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
      </span>
      of
      <span class="font-medium">{{ pagination.total }}</span>
      items
    </div>

    <!-- Pagination Controls -->
    <div class="flex items-center gap-2">
      <UButton
        :disabled="!pagination.hasPrevPage"
        variant="soft"
        icon="i-heroicons-chevron-left"
        class="cursor-pointer"
        @click="goToPage(pagination.page - 1)"
      >
        Previous
      </UButton>

      <!-- Page Numbers -->
      <div class="flex items-center gap-1">
        <template v-for="pageNum in visiblePages" :key="pageNum">
          <UButton
            v-if="typeof pageNum === 'number'"
            :variant="pageNum === pagination.page ? 'solid' : 'soft'"
            :color="pageNum === pagination.page ? 'primary' : 'neutral'"
            size="sm"
            class="cursor-pointer"
            @click="goToPage(pageNum)"
          >
            {{ pageNum }}
          </UButton>
          <span v-else class="px-2 text-[var(--ui-text-muted)]">...</span>
        </template>
      </div>

      <UButton
        :disabled="!pagination.hasNextPage"
        variant="soft"
        icon="i-heroicons-chevron-right"
        trailing
        class="cursor-pointer"
        @click="goToPage(pagination.page + 1)"
      >
        Next
      </UButton>
    </div>
  </div>
</div>`,

  visiblePagesLogic: `/**
 * Calculate visible page numbers for pagination
 * Shows first, last, current, and surrounding pages with ellipsis
 */
const visiblePages = computed(() => {
  const current = pagination.value.page;
  const total = pagination.value.totalPages;
  const pages: (number | string)[] = [];

  if (total <= 7) {
    // Show all pages if total is 7 or less
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (current > 3) {
      pages.push("...");
    }

    // Show pages around current page
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push("...");
    }

    // Always show last page
    pages.push(total);
  }

  return pages;
});`,

  filteringSearch: `// Search and filter state
const filters = reactive({
  search: "",
  is_active: true as boolean | null,
  category: null as string | null,
});

// Debounced search using VueUse
import { useDebounceFn } from "@vueuse/core";

const debouncedSearch = useDebounceFn(() => {
  pagination.value.page = 1; // Reset to first page
  fetchItems();
}, 500);

// Fetch function includes filters
async function fetchItems() {
  const params: Record<string, string> = {
    page: String(pagination.value.page),
    limit: String(pagination.value.limit),
  };

  // Add search query if present
  if (filters.search) {
    params.search = filters.search;
  }

  // Add status filter
  if (filters.is_active !== null) {
    params.is_active = String(filters.is_active);
  }

  // Add category filter
  if (filters.category) {
    params.category = filters.category;
  }

  const response = await $fetch("/api/items", { query: params });
  items.value = response.items;
  pagination.value = response.pagination;
}`,

  searchUI: `<!-- Search Input -->
<UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
  <div class="flex items-center gap-3">
    <!-- Search -->
    <div class="flex-1 min-w-0 max-w-md">
      <UInput
        v-model="filters.search"
        placeholder="Search items by name or code..."
        icon="i-heroicons-magnifying-glass"
        size="lg"
        class="w-full"
        @input="debouncedSearch"
      />
    </div>

    <!-- Status Filter Dropdown -->
    <UDropdownMenu
      :items="statusDropdownItems"
      :ui="{ content: 'min-w-[140px]' }"
      class="ml-auto"
    >
      <UButton
        color="neutral"
        variant="outline"
        size="lg"
        class="cursor-pointer rounded-full px-5"
        trailing-icon="i-heroicons-chevron-down"
      >
        <UIcon :name="currentStatusIcon" class="w-4 h-4 mr-2" />
        {{ currentStatusLabel }}
      </UButton>
    </UDropdownMenu>
  </div>
</UCard>`,

  dropdownFilter: `// Status dropdown items
const statusDropdownItems = computed(() => [
  [
    {
      label: "Active",
      icon: "i-heroicons-check-circle",
      active: filters.is_active === true,
      onSelect: () => selectStatus(true),
    },
    {
      label: "Inactive",
      icon: "i-heroicons-archive-box",
      active: filters.is_active === false,
      onSelect: () => selectStatus(false),
    },
    {
      label: "All",
      icon: "i-heroicons-list-bullet",
      active: filters.is_active === null,
      onSelect: () => selectStatus(null),
    },
  ],
]);

// Select status handler
const selectStatus = (statusValue: boolean | null) => {
  filters.is_active = statusValue;
  pagination.value.page = 1; // Reset to first page
  fetchItems();
};`,

  loadingState: `<!-- Loading State -->
<div v-if="loading" class="flex justify-center items-center py-12">
  <LoadingSpinner size="lg" color="primary" text="Loading items..." />
</div>`,

  errorState: `<!-- Error State -->
<ErrorAlert v-else-if="error" :message="error" @retry="fetchItems" />`,

  emptyState: `<!-- Empty State -->
<EmptyState
  v-else-if="!items.length"
  icon="i-heroicons-inbox"
  title="No items found"
  description="No items match your search criteria. Try adjusting your filters or create a new item."
>
  <template v-if="canEditItems()" #actions>
    <UButton
      color="primary"
      icon="i-heroicons-plus"
      class="cursor-pointer"
      @click="navigateTo('/items/create')"
    >
      Create Item
    </UButton>
  </template>
</EmptyState>`,

  gridLayout: `<!-- Grid/Card Layout (Suppliers page example) -->
<div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 py-2">
  <UCard
    v-for="supplier in suppliers"
    :key="supplier.id"
    class="card-elevated cursor-pointer"
    :ui="{ body: 'p-6' }"
    @click="handleViewDetails(supplier)"
  >
    <!-- Header Row -->
    <div class="flex items-start justify-between gap-3 mb-4">
      <div class="min-w-0 flex-1">
        <h3 class="font-semibold text-[var(--ui-text)] truncate">
          {{ supplier.name }}
        </h3>
        <p class="text-caption text-[var(--ui-text-muted)] font-mono">
          {{ supplier.code }}
        </p>
      </div>
      <UBadge
        :color="supplier.is_active ? 'success' : 'neutral'"
        variant="subtle"
        size="sm"
      >
        {{ supplier.is_active ? "Active" : "Inactive" }}
      </UBadge>
    </div>

    <!-- Contact Info -->
    <div v-if="supplier.contact" class="mb-4">
      <p class="text-sm text-[var(--ui-text-muted)] line-clamp-2">
        {{ supplier.contact }}
      </p>
    </div>

    <!-- Footer Actions -->
    <div class="flex items-center justify-between pt-3 border-t border-[var(--ui-border-muted)]">
      <span class="text-xs text-[var(--ui-text-muted)]">
        Created {{ formatDate(supplier.created_at) }}
      </span>
      <div class="flex items-center gap-2">
        <UButton
          color="error"
          variant="ghost"
          size="sm"
          icon="i-heroicons-trash"
          class="cursor-pointer"
          @click.stop="openDeleteModal(supplier)"
        >
          Delete
        </UButton>
        <UButton
          color="primary"
          variant="ghost"
          size="sm"
          icon="i-heroicons-pencil"
          class="cursor-pointer"
          @click.stop="handleEdit(supplier)"
        >
          Edit
        </UButton>
      </div>
    </div>
  </UCard>
</div>`,

  responsiveMobile: `<!-- Responsive: Hide columns on mobile -->
<thead>
  <tr class="bg-[var(--ui-bg-elevated)]">
    <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Code</th>
    <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Name</th>
    <!-- Hide category on small screens -->
    <th class="hidden md:table-cell px-4 py-3 text-left text-label uppercase tracking-wider">
      Category
    </th>
    <!-- Hide sub-category on medium screens and below -->
    <th class="hidden lg:table-cell px-4 py-3 text-left text-label uppercase tracking-wider">
      Sub-Category
    </th>
    <th class="px-4 py-3 text-right text-label uppercase tracking-wider">Actions</th>
  </tr>
</thead>
<tbody>
  <tr v-for="item in items" :key="item.id">
    <td class="px-4 py-4">{{ item.code }}</td>
    <td class="px-4 py-4">{{ item.name }}</td>
    <td class="hidden md:table-cell px-4 py-4">{{ item.category }}</td>
    <td class="hidden lg:table-cell px-4 py-4">{{ item.sub_category }}</td>
    <td class="px-4 py-4">...</td>
  </tr>
</tbody>`,

  mobileSearchUI: `<!-- Desktop: Single row layout (lg and above) -->
<div class="hidden lg:flex items-center gap-3">
  <div class="flex-1 min-w-0 max-w-md">
    <UInput
      v-model="filters.search"
      placeholder="Search items by name or code..."
      icon="i-heroicons-magnifying-glass"
      size="lg"
    />
  </div>
  <UDropdownMenu :items="statusDropdownItems">
    <UButton trailing-icon="i-heroicons-chevron-down">
      <UIcon :name="currentStatusIcon" class="w-4 h-4 mr-2" />
      {{ currentStatusLabel }}
    </UButton>
  </UDropdownMenu>
</div>

<!-- Mobile: Stacked layout (below lg) -->
<div class="flex flex-col gap-3 lg:hidden">
  <div class="flex items-center gap-3">
    <div class="flex-1 min-w-0">
      <UInput
        v-model="filters.search"
        placeholder="Search items..."
        icon="i-heroicons-magnifying-glass"
        size="lg"
      />
    </div>
    <!-- Icon-only dropdown on mobile -->
    <UDropdownMenu :items="statusDropdownItems">
      <UButton trailing-icon="i-heroicons-chevron-down">
        <UIcon :name="currentStatusIcon" class="w-4 h-4" />
      </UButton>
    </UDropdownMenu>
  </div>
</div>`,

  columnAlignment: `<!-- Text Alignment Best Practices -->
<thead>
  <tr>
    <!-- Left-align: Text, names, codes -->
    <th class="px-4 py-3 text-left text-label">Code</th>
    <th class="px-4 py-3 text-left text-label">Name</th>

    <!-- Right-align: Numbers, currency, quantities -->
    <th class="px-4 py-3 text-right text-label">On-Hand</th>
    <th class="px-4 py-3 text-right text-label">WAC</th>
    <th class="px-4 py-3 text-right text-label">Value</th>

    <!-- Right-align: Actions column -->
    <th class="px-4 py-3 text-right text-label">Actions</th>
  </tr>
</thead>
<tbody>
  <tr v-for="item in items" :key="item.id">
    <td class="px-4 py-4 font-mono text-sm">{{ item.code }}</td>
    <td class="px-4 py-4">{{ item.name }}</td>
    <td class="px-4 py-4 text-right">{{ formatQuantity(item.on_hand) }}</td>
    <td class="px-4 py-4 text-right">{{ formatCurrency(item.wac) }}</td>
    <td class="px-4 py-4 text-right font-medium">{{ formatCurrency(item.value) }}</td>
    <td class="px-4 py-4 text-right">...</td>
  </tr>
</tbody>`,

  badgeInTable: `<!-- Using badges in table cells -->
<td class="px-4 py-4">
  <div class="flex items-center gap-2">
    {{ item.name }}
    <UBadge
      v-if="!item.is_active"
      color="neutral"
      variant="subtle"
      size="xs"
    >
      Inactive
    </UBadge>
  </div>
</td>`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Tables & Lists</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Patterns for displaying tabular data, lists, pagination, filtering, and responsive design
      </p>
    </div>

    <!-- Tables & Lists Overview -->
    <section
      id="dev-section-tables-overview"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('tables-overview')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-table-cells" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Tables & Lists Overview
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('tables-overview') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('tables-overview')" class="space-y-4 p-4">
        <div class="prose-config">
          <h2 class="section-heading">Tables & Lists Overview</h2>
          <p class="section-description">
            This guide covers patterns for displaying tabular data and lists in the Stock Management
            System. The app uses
            <strong>custom HTML tables</strong>
            wrapped in UCard components for consistent styling and responsive behavior.
          </p>

          <div class="info-box">
            <div class="flex items-start gap-3">
              <UIcon
                name="i-heroicons-information-circle"
                class="text-info text-xl flex-shrink-0"
              />
              <div>
                <h4 class="text-sm font-semibold text-[var(--ui-text-highlighted)] mb-1">
                  Why Custom HTML Tables?
                </h4>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  The app uses custom HTML
                  <code>&lt;table&gt;</code>
                  elements instead of third-party table components for maximum control over styling,
                  performance, and integration with the Nuxt UI design system. This approach
                  provides full flexibility while maintaining consistency with the UI design tokens.
                </p>
              </div>
            </div>
          </div>

          <h3 class="subsection-heading">Key Features</h3>
          <ul class="list-styled">
            <li>
              <strong>Custom HTML tables</strong>
              with Tailwind CSS v4 styling using design system tokens
            </li>
            <li>
              <strong>Clickable rows</strong>
              for navigation to detail pages
            </li>
            <li>
              <strong>Server-side pagination</strong>
              with page number controls
            </li>
            <li>
              <strong>Filtering & search</strong>
              with debounced input
            </li>
            <li>
              <strong>Loading, empty, and error states</strong>
              for better UX
            </li>
            <li>
              <strong>Responsive design</strong>
              with column hiding on mobile
            </li>
            <li>
              <strong>Grid/card layouts</strong>
              as alternative to tables
            </li>
          </ul>

          <h3 class="subsection-heading">Common Use Cases</h3>
          <ul class="list-styled">
            <li>
              <strong>Items page:</strong>
              HTML table with pagination and stock data
            </li>
            <li>
              <strong>Suppliers page:</strong>
              Grid/card layout with search
            </li>
            <li>
              <strong>Stock Now page:</strong>
              HTML table with filtering and sorting
            </li>
            <li>
              <strong>Deliveries/Issues page:</strong>
              HTML table with status badges
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Custom HTML Table Pattern -->
    <section
      id="dev-section-custom-html-table"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('custom-html-table')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-squares-2x2" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Custom HTML Table Pattern
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('custom-html-table') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('custom-html-table')" class="space-y-4 p-4">
        <div class="prose-config">
          <h2 class="section-heading">Custom HTML Table Pattern</h2>
          <p class="section-description">
            The standard pattern for displaying tabular data uses custom HTML
            <code>&lt;table&gt;</code>
            elements wrapped in a UCard component with proper styling and structure.
          </p>

          <h3 class="subsection-heading">Basic Table Structure</h3>
          <DeveloperCodeBlock
            :code="codeExamples.basicTableStructure"
            language="vue"
            filename="app/pages/items/index.vue"
          />

          <h3 class="subsection-heading">Key Components</h3>
          <ul class="list-styled">
            <li>
              <strong>UCard wrapper:</strong>
              <code>class="card-elevated"</code>
              for consistent elevation
            </li>
            <li>
              <strong>Body padding:</strong>
              <code>:ui="{ body: 'p-0' }"</code>
              removes default padding
            </li>
            <li>
              <strong>Overflow container:</strong>
              <code>overflow-x-auto</code>
              for horizontal scroll on mobile
            </li>
            <li>
              <strong>Table classes:</strong>
              <code>min-w-full</code>
              ensures full width,
              <code>divide-y</code>
              adds row dividers
            </li>
            <li>
              <strong>Header styling:</strong>
              <code>bg-[var(--ui-bg-elevated)]</code>
              with
              <code>text-label</code>
              for uppercase small text
            </li>
            <li>
              <strong>Row hover:</strong>
              <code>hover:bg-[var(--ui-bg-elevated)]</code>
              with
              <code>transition-colors</code>
            </li>
          </ul>

          <div class="warning-box">
            <div class="flex items-start gap-3">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="text-warning text-xl flex-shrink-0"
              />
              <div>
                <h4 class="text-sm font-semibold text-[var(--ui-text-highlighted)] mb-1">
                  Important
                </h4>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  Always wrap tables in a UCard with
                  <code>:ui="{ body: 'p-0' }"</code>
                  to remove default padding. The
                  <code>overflow-x-auto</code>
                  div inside ensures horizontal scrolling on mobile without breaking the card
                  layout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Table Structure & Styling -->
    <section
      id="dev-section-table-structure"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('table-structure')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-paint-brush" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Table Structure & Styling
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('table-structure') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('table-structure')" class="space-y-4 p-4">
        <div class="prose-config">
          <h2 class="section-heading">Table Structure & Styling</h2>
          <p class="section-description">
            Proper styling ensures tables are visually consistent with the design system and
            responsive across devices.
          </p>

          <h3 class="subsection-heading">Header Styling</h3>
          <ul class="list-styled">
            <li>
              <strong>Background:</strong>
              <code>bg-[var(--ui-bg-elevated)]</code>
              for subtle elevation
            </li>
            <li>
              <strong>Text:</strong>
              <code>text-label</code>
              utility (uppercase, tracking-wide, small size)
            </li>
            <li>
              <strong>Padding:</strong>
              <code>px-4 py-3</code>
              for consistent spacing
            </li>
            <li>
              <strong>Alignment:</strong>
              <code>text-left</code>
              for text columns,
              <code>text-right</code>
              for numbers
            </li>
          </ul>

          <h3 class="subsection-heading">Cell Styling</h3>
          <ul class="list-styled">
            <li>
              <strong>Padding:</strong>
              <code>px-4 py-4</code>
              for comfortable spacing
            </li>
            <li>
              <strong>Text color:</strong>
              <code>text-[var(--ui-text)]</code>
              for primary text,
              <code>text-[var(--ui-text-muted)]</code>
              for secondary
            </li>
            <li>
              <strong>Whitespace:</strong>
              <code>whitespace-nowrap</code>
              for codes/numbers to prevent wrapping
            </li>
            <li>
              <strong>Font:</strong>
              <code>font-mono</code>
              for codes,
              <code>font-medium</code>
              for emphasis
            </li>
          </ul>

          <h3 class="subsection-heading">Column Alignment Best Practices</h3>
          <DeveloperCodeBlock :code="codeExamples.columnAlignment" language="vue" />

          <div class="info-box">
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-light-bulb" class="text-info text-xl flex-shrink-0" />
              <div>
                <h4 class="text-sm font-semibold text-[var(--ui-text-highlighted)] mb-1">
                  Alignment Rule
                </h4>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  Left-align text and codes, right-align numbers and currency. This improves
                  scannability and follows standard data table conventions.
                </p>
              </div>
            </div>
          </div>

          <h3 class="subsection-heading">Using Badges in Tables</h3>
          <DeveloperCodeBlock :code="codeExamples.badgeInTable" language="vue" />
        </div>
      </div>
    </section>

    <!-- Column Definitions -->
    <section
      id="dev-section-column-definitions"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('column-definitions')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-view-columns" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Column Definitions</span>
        </span>
        <UIcon
          :name="
            isExpanded('column-definitions') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('column-definitions')" class="space-y-4 p-4">
        <div class="prose-config">
          <h2 class="section-heading">Column Definitions</h2>
          <p class="section-description">
            Define columns explicitly with proper alignment, styling, and responsive behavior.
          </p>

          <h3 class="subsection-heading">Column Types</h3>
          <ul class="list-styled">
            <li>
              <strong>Code columns:</strong>
              <code>font-mono</code>
              ,
              <code>text-sm</code>
              ,
              <code>whitespace-nowrap</code>
              , left-aligned
            </li>
            <li>
              <strong>Name columns:</strong>
              <code>text-[var(--ui-text)]</code>
              , left-aligned, allows wrapping
            </li>
            <li>
              <strong>Number columns:</strong>
              Right-aligned,
              <code>whitespace-nowrap</code>
              , use formatters
            </li>
            <li>
              <strong>Currency columns:</strong>
              Right-aligned,
              <code>font-medium</code>
              for emphasis
            </li>
            <li>
              <strong>Status columns:</strong>
              Use UBadge with appropriate color variants
            </li>
            <li>
              <strong>Action columns:</strong>
              Right-aligned,
              <code>whitespace-nowrap</code>
              , buttons in flex layout
            </li>
          </ul>

          <h3 class="subsection-heading">Responsive Column Hiding</h3>
          <DeveloperCodeBlock :code="codeExamples.responsiveMobile" language="vue" />

          <div class="info-box">
            <div class="flex items-start gap-3">
              <UIcon
                name="i-heroicons-device-phone-mobile"
                class="text-info text-xl flex-shrink-0"
              />
              <div>
                <h4 class="text-sm font-semibold text-[var(--ui-text-highlighted)] mb-1">
                  Mobile-First Approach
                </h4>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  Hide less important columns on small screens using Tailwind's responsive classes.
                  Keep code, name, and actions visible on mobile. Add
                  <code>hidden md:table-cell</code>
                  to hide columns below medium breakpoint.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Row Actions & Navigation -->
    <section
      id="dev-section-row-actions"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('row-actions')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-cursor-arrow-rays" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Row Actions & Navigation
          </span>
        </span>
        <UIcon
          :name="isExpanded('row-actions') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('row-actions')" class="space-y-4 p-4">
        <div class="prose-config">
          <h2 class="section-heading">Row Actions & Navigation</h2>
          <p class="section-description">
            Implement clickable rows for navigation and action buttons for specific operations.
          </p>

          <h3 class="subsection-heading">Clickable Rows Pattern</h3>
          <DeveloperCodeBlock :code="codeExamples.clickableRows" language="vue" />

          <h3 class="subsection-heading">Key Patterns</h3>
          <ul class="list-styled">
            <li>
              <strong>Row hover effect:</strong>
              <code>hover:bg-[var(--ui-bg-elevated)] transition-colors</code>
            </li>
            <li>
              <strong>Clickable cells:</strong>
              Add
              <code>cursor-pointer</code>
              class and
              <code>@click</code>
              handler
            </li>
            <li>
              <strong>Action buttons:</strong>
              Use
              <code>@click.stop</code>
              to prevent row navigation
            </li>
            <li>
              <strong>Button styling:</strong>
              Use
              <code>variant="ghost"</code>
              and
              <code>size="xs"</code>
              for table actions
            </li>
          </ul>

          <div class="warning-box">
            <div class="flex items-start gap-3">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="text-warning text-xl flex-shrink-0"
              />
              <div>
                <h4 class="text-sm font-semibold text-[var(--ui-text-highlighted)] mb-1">
                  Stop Event Propagation
                </h4>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  Always use
                  <code>@click.stop</code>
                  on action buttons to prevent triggering the row click handler. Without
                  <code>.stop</code>
                  , clicking a button will also navigate to the detail page.
                </p>
              </div>
            </div>
          </div>

          <h3 class="subsection-heading">Action Button Patterns</h3>
          <ul class="list-styled">
            <li>
              <strong>Edit:</strong>
              <code>color="primary"</code>
              , icon
              <code>i-heroicons-pencil</code>
            </li>
            <li>
              <strong>Delete:</strong>
              <code>color="error"</code>
              , icon
              <code>i-heroicons-trash</code>
            </li>
            <li>
              <strong>View:</strong>
              <code>color="neutral"</code>
              , icon
              <code>i-heroicons-eye</code>
            </li>
            <li>
              Always include
              <code>class="cursor-pointer"</code>
              on buttons per project guidelines
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Pagination Pattern -->
    <section
      id="dev-section-pagination-pattern"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('pagination-pattern')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrows-right-left" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Pagination Pattern</span>
        </span>
        <UIcon
          :name="
            isExpanded('pagination-pattern') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('pagination-pattern')" class="space-y-4 p-4">
        <div class="prose-config">
          <h2 class="section-heading">Pagination Pattern</h2>
          <p class="section-description">
            Implement server-side pagination with page controls, info text, and smart page number
            display.
          </p>

          <h3 class="subsection-heading">Pagination State</h3>
          <DeveloperCodeBlock
            :code="codeExamples.paginationState"
            language="typescript"
            filename="app/pages/items/index.vue"
          />

          <h3 class="subsection-heading">Pagination UI</h3>
          <DeveloperCodeBlock :code="codeExamples.paginationUI" language="vue" />

          <h3 class="subsection-heading">Visible Pages Logic</h3>
          <p class="section-description">
            Smart page number display shows first, last, current, and surrounding pages with
            ellipsis for large page counts.
          </p>
          <DeveloperCodeBlock :code="codeExamples.visiblePagesLogic" language="typescript" />

          <h3 class="subsection-heading">Pagination Best Practices</h3>
          <ul class="list-styled">
            <li>
              <strong>Default page size:</strong>
              50 items per page (adjust based on data density)
            </li>
            <li>
              <strong>Server-side pagination:</strong>
              Always paginate on the server for large datasets
            </li>
            <li>
              <strong>Reset on filter:</strong>
              Set
              <code>page = 1</code>
              when filters change
            </li>
            <li>
              <strong>Disable buttons:</strong>
              Use
              <code>:disabled</code>
              for prev/next when at edges
            </li>
            <li>
              <strong>Show pagination info:</strong>
              Display "Showing X to Y of Z items" for context
            </li>
            <li>
              <strong>Responsive layout:</strong>
              Stack info and controls on mobile with
              <code>flex-col md:flex-row</code>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Filtering & Search -->
    <section
      id="dev-section-filtering-search"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('filtering-search')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-magnifying-glass" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Filtering & Search</span>
        </span>
        <UIcon
          :name="
            isExpanded('filtering-search') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('filtering-search')" class="space-y-4 p-4">
        <div class="prose-config">
          <h2 class="section-heading">Filtering & Search</h2>
          <p class="section-description">
            Implement search and filtering with debounced input and dropdown filters for better UX.
          </p>

          <h3 class="subsection-heading">Filter State & Logic</h3>
          <DeveloperCodeBlock :code="codeExamples.filteringSearch" language="typescript" />

          <h3 class="subsection-heading">Search UI</h3>
          <DeveloperCodeBlock :code="codeExamples.searchUI" language="vue" />

          <h3 class="subsection-heading">Dropdown Filter Pattern</h3>
          <DeveloperCodeBlock :code="codeExamples.dropdownFilter" language="typescript" />

          <h3 class="subsection-heading">Filtering Best Practices</h3>
          <ul class="list-styled">
            <li>
              <strong>Debounce search:</strong>
              Use 500ms delay for search input to reduce API calls
            </li>
            <li>
              <strong>Reset pagination:</strong>
              Set
              <code>page = 1</code>
              when filters change
            </li>
            <li>
              <strong>UDropdownMenu:</strong>
              Use for status/category filters with icon and label
            </li>
            <li>
              <strong>Active indicator:</strong>
              Show
              <code>active: true</code>
              on selected filter option
            </li>
            <li>
              <strong>Empty filters:</strong>
              Use
              <code>null</code>
              or
              <code>undefined</code>
              for "All" option
            </li>
            <li>
              <strong>VueUse composables:</strong>
              Use
              <code>useDebounceFn</code>
              or
              <code>refDebounced</code>
              for debouncing
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Sorting Pattern -->
    <section
      id="dev-section-sorting-pattern"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('sorting-pattern')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrows-up-down" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Sorting Pattern</span>
        </span>
        <UIcon
          :name="
            isExpanded('sorting-pattern') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('sorting-pattern')" class="space-y-4 p-4">
        <div class="prose-config">
          <h2 class="section-heading">Sorting Pattern</h2>
          <p class="section-description">
            Implement sortable columns with visual indicators and server-side or client-side
            sorting.
          </p>

          <h3 class="subsection-heading">Server-Side Sorting (Recommended)</h3>
          <ul class="list-styled">
            <li>
              Add
              <code>sort</code>
              and
              <code>order</code>
              params to API request:
              <code>?sort=name&amp;order=asc</code>
            </li>
            <li>
              Store sort state:
              <code>const sort = ref({ field: 'name', order: 'asc' })</code>
            </li>
            <li>Add click handlers to table headers to toggle sort direction</li>
            <li>
              Show sort indicator icon:
              <code>i-heroicons-chevron-up</code>
              or
              <code>i-heroicons-chevron-down</code>
            </li>
          </ul>

          <h3 class="subsection-heading">Client-Side Sorting</h3>
          <ul class="list-styled">
            <li>
              Use computed property:
              <code>const sortedItems = computed(() => [...items].sort(...))</code>
            </li>
            <li>Suitable for small datasets (&lt; 100 items) or when data is already cached</li>
            <li>Less server load but may impact client performance on large datasets</li>
          </ul>

          <div class="info-box">
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-light-bulb" class="text-info text-xl flex-shrink-0" />
              <div>
                <h4 class="text-sm font-semibold text-[var(--ui-text-highlighted)] mb-1">
                  When to Use Each
                </h4>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  Use
                  <strong>server-side sorting</strong>
                  for large datasets, paginated tables, or when data changes frequently. Use
                  <strong>client-side sorting</strong>
                  for small, static datasets or when data is already loaded.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Loading & Empty States -->
    <section
      id="dev-section-loading-empty-states"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('loading-empty-states')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-inbox" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Loading & Empty States
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('loading-empty-states')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('loading-empty-states')" class="space-y-4 p-4">
        <div class="prose-config">
          <h2 class="section-heading">Loading & Empty States</h2>
          <p class="section-description">
            Provide visual feedback for loading, empty, and error states to improve user experience.
          </p>

          <h3 class="subsection-heading">Loading State</h3>
          <DeveloperCodeBlock :code="codeExamples.loadingState" language="vue" />

          <h3 class="subsection-heading">Error State</h3>
          <DeveloperCodeBlock :code="codeExamples.errorState" language="vue" />

          <h3 class="subsection-heading">Empty State</h3>
          <DeveloperCodeBlock :code="codeExamples.emptyState" language="vue" />

          <h3 class="subsection-heading">State Priority Order</h3>
          <ol class="list-styled">
            <li>
              <strong>Loading:</strong>
              Show
              <code>&lt;LoadingSpinner&gt;</code>
              while fetching data
            </li>
            <li>
              <strong>Error:</strong>
              Show
              <code>&lt;ErrorAlert&gt;</code>
              if fetch fails (with retry)
            </li>
            <li>
              <strong>Empty:</strong>
              Show
              <code>&lt;EmptyState&gt;</code>
              if no items match filters
            </li>
            <li>
              <strong>Data:</strong>
              Show table/grid only when data is available
            </li>
          </ol>

          <div class="info-box">
            <div class="flex items-start gap-3">
              <UIcon
                name="i-heroicons-information-circle"
                class="text-info text-xl flex-shrink-0"
              />
              <div>
                <h4 class="text-sm font-semibold text-[var(--ui-text-highlighted)] mb-1">
                  Conditional Rendering
                </h4>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  Use
                  <code>v-if</code>
                  /
                  <code>v-else-if</code>
                  chain to show states in priority order. This ensures only one state is visible at
                  a time and prevents layout shift.
                </p>
              </div>
            </div>
          </div>

          <h3 class="subsection-heading">Best Practices</h3>
          <ul class="list-styled">
            <li>
              <strong>Loading text:</strong>
              Include context like "Loading items..." instead of generic "Loading"
            </li>
            <li>
              <strong>Error actions:</strong>
              Always provide a "Retry" button in error states
            </li>
            <li>
              <strong>Empty actions:</strong>
              Include a CTA (e.g., "Create Item") when appropriate
            </li>
            <li>
              <strong>Empty message:</strong>
              Be specific about why list is empty (no results vs no items exist)
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Grid/Card Layout Pattern -->
    <section
      id="dev-section-grid-card-layout"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('grid-card-layout')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-squares-plus" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Grid/Card Layout Pattern
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('grid-card-layout') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('grid-card-layout')" class="space-y-4 p-4">
        <div class="prose-config">
          <h2 class="section-heading">Grid/Card Layout Pattern</h2>
          <p class="section-description">
            Alternative to tables for displaying items with rich metadata, images, or when
            horizontal space is limited. Used on the Suppliers page.
          </p>

          <h3 class="subsection-heading">Grid Layout Example</h3>
          <DeveloperCodeBlock
            :code="codeExamples.gridLayout"
            language="vue"
            filename="app/pages/suppliers/index.vue"
          />

          <h3 class="subsection-heading">Grid Layout Best Practices</h3>
          <ul class="list-styled">
            <li>
              <strong>Grid classes:</strong>
              Use
              <code>grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3</code>
              for responsive layout
            </li>
            <li>
              <strong>Card wrapper:</strong>
              Use
              <code>class="card-elevated cursor-pointer"</code>
              for clickable cards
            </li>
            <li>
              <strong>Card padding:</strong>
              Use
              <code>:ui="{ body: 'p-6' }"</code>
              for consistent spacing
            </li>
            <li>
              <strong>Click handler:</strong>
              Add
              <code>@click</code>
              to entire card for navigation
            </li>
            <li>
              <strong>Action buttons:</strong>
              Use
              <code>@click.stop</code>
              to prevent card navigation
            </li>
            <li>
              <strong>Truncate text:</strong>
              Use
              <code>truncate</code>
              or
              <code>line-clamp-2</code>
              for long text
            </li>
          </ul>

          <h3 class="subsection-heading">When to Use Grid vs Table</h3>
          <ul class="list-styled">
            <li>
              <strong>Use Grid when:</strong>
              Items have rich metadata (images, multi-line descriptions)
            </li>
            <li>
              <strong>Use Grid when:</strong>
              Horizontal space is limited (mobile-first design)
            </li>
            <li>
              <strong>Use Grid when:</strong>
              Visual hierarchy is important (featured items)
            </li>
            <li>
              <strong>Use Table when:</strong>
              Data is primarily numerical or needs column alignment
            </li>
            <li>
              <strong>Use Table when:</strong>
              Users need to scan/compare rows quickly
            </li>
            <li>
              <strong>Use Table when:</strong>
              Sorting/filtering by multiple columns is essential
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Responsive Design -->
    <section
      id="dev-section-responsive-tables"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('responsive-tables')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-device-phone-mobile" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Responsive Design</span>
        </span>
        <UIcon
          :name="
            isExpanded('responsive-tables') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('responsive-tables')" class="space-y-4 p-4">
        <div class="prose-config">
          <h2 class="section-heading">Responsive Design</h2>
          <p class="section-description">
            Ensure tables and lists work well on all screen sizes with proper responsive patterns.
          </p>

          <h3 class="subsection-heading">Responsive Strategies</h3>
          <ul class="list-styled">
            <li>
              <strong>Horizontal scroll:</strong>
              Wrap table in
              <code>overflow-x-auto</code>
              div for mobile
            </li>
            <li>
              <strong>Hide columns:</strong>
              Use
              <code>hidden md:table-cell</code>
              to hide less-important columns
            </li>
            <li>
              <strong>Stack filters:</strong>
              Use
              <code>flex-col md:flex-row</code>
              for filter rows
            </li>
            <li>
              <strong>Reduce padding:</strong>
              Use responsive classes like
              <code>px-2 md:px-4</code>
              on mobile
            </li>
            <li>
              <strong>Icon-only buttons:</strong>
              Show only icons on mobile, add text on larger screens
            </li>
            <li>
              <strong>Grid to list:</strong>
              Change from multi-column grid to single column on mobile
            </li>
          </ul>

          <h3 class="subsection-heading">Mobile Search UI Pattern</h3>
          <DeveloperCodeBlock :code="codeExamples.mobileSearchUI" language="vue" />

          <h3 class="subsection-heading">Responsive Breakpoints</h3>
          <ul class="list-styled">
            <li>
              <strong>sm (640px):</strong>
              Reduce button text, show shorter labels
            </li>
            <li>
              <strong>md (768px):</strong>
              Show secondary columns, expand filters to single row
            </li>
            <li>
              <strong>lg (1024px):</strong>
              Show tertiary columns, full table layout
            </li>
            <li>
              <strong>2xl (1536px):</strong>
              Add more grid columns (3-4 columns for cards)
            </li>
          </ul>

          <div class="info-box">
            <div class="flex items-start gap-3">
              <UIcon
                name="i-heroicons-device-phone-mobile"
                class="text-info text-xl flex-shrink-0"
              />
              <div>
                <h4 class="text-sm font-semibold text-[var(--ui-text-highlighted)] mb-1">
                  Mobile-First Approach
                </h4>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  Design tables mobile-first by showing only essential columns on small screens,
                  then progressively add columns as screen size increases. Test on actual devices to
                  ensure usability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Best Practices -->
    <section
      id="dev-section-best-practices-tables"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('best-practices-tables')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-check-badge" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Best Practices</span>
        </span>
        <UIcon
          :name="
            isExpanded('best-practices-tables')
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('best-practices-tables')" class="space-y-4 p-4">
        <div class="prose-config">
          <h2 class="section-heading">Best Practices Summary</h2>

          <h3 class="subsection-heading">Table Structure</h3>
          <ul class="list-styled">
            <li>
              ✅ Always wrap tables in
              <code>&lt;UCard class="card-elevated"&gt;</code>
              with
              <code>:ui="{ body: 'p-0' }"</code>
            </li>
            <li>
              ✅ Use
              <code>&lt;div class="overflow-x-auto"&gt;</code>
              wrapper for horizontal scroll
            </li>
            <li>
              ✅ Add
              <code>min-w-full</code>
              to table and
              <code>divide-y</code>
              for row separators
            </li>
            <li>
              ✅ Use
              <code>hover:bg-[var(--ui-bg-elevated)]</code>
              with
              <code>transition-colors</code>
              on rows
            </li>
            <li>❌ Don't nest tables or use table for layout purposes</li>
          </ul>

          <h3 class="subsection-heading">Styling & Design</h3>
          <ul class="list-styled">
            <li>
              ✅ Use
              <code>text-label</code>
              utility for table headers (uppercase, tracking-wide)
            </li>
            <li>✅ Left-align text columns, right-align number/currency columns</li>
            <li>
              ✅ Use
              <code>font-mono</code>
              for codes,
              <code>font-medium</code>
              for emphasis
            </li>
            <li>
              ✅ Add
              <code>whitespace-nowrap</code>
              to prevent text wrapping in code/number columns
            </li>
            <li>
              ❌ Don't use inconsistent padding (stick to
              <code>px-4 py-3</code>
              for headers,
              <code>px-4 py-4</code>
              for cells)
            </li>
          </ul>

          <h3 class="subsection-heading">Interactions</h3>
          <ul class="list-styled">
            <li>
              ✅ Add
              <code>cursor-pointer</code>
              to clickable rows for visual feedback
            </li>
            <li>
              ✅ Use
              <code>@click.stop</code>
              on action buttons to prevent row click propagation
            </li>
            <li>
              ✅ Use
              <code>variant="ghost"</code>
              and
              <code>size="xs"</code>
              for table action buttons
            </li>
            <li>
              ✅ Always include
              <code>class="cursor-pointer"</code>
              on all buttons (project guideline)
            </li>
            <li>
              ❌ Don't make entire rows clickable if you have multiple actions (confusing for users)
            </li>
          </ul>

          <h3 class="subsection-heading">Data & State</h3>
          <ul class="list-styled">
            <li>✅ Implement server-side pagination for datasets larger than 100 items</li>
            <li>✅ Debounce search input by 500ms to reduce API calls</li>
            <li>✅ Reset pagination to page 1 when filters change</li>
            <li>✅ Show loading, error, and empty states in proper priority order</li>
            <li>✅ Provide retry action on error states</li>
            <li>❌ Don't fetch data without loading indicators</li>
          </ul>

          <h3 class="subsection-heading">Responsive Design</h3>
          <ul class="list-styled">
            <li>
              ✅ Hide less important columns on mobile using
              <code>hidden md:table-cell</code>
            </li>
            <li>✅ Keep code, name, and actions visible on all screen sizes</li>
            <li>
              ✅ Stack filter controls vertically on mobile (
              <code>flex-col md:flex-row</code>
              )
            </li>
            <li>✅ Consider grid/card layout instead of table for mobile-heavy use cases</li>
            <li>❌ Don't force horizontal scroll for basic tables (hide columns instead)</li>
          </ul>

          <h3 class="subsection-heading">Performance</h3>
          <ul class="list-styled">
            <li>
              ✅ Use
              <code>v-for</code>
              with
              <code>:key="item.id"</code>
              for efficient updates
            </li>
            <li>✅ Implement virtual scrolling for very large lists (1000+ items)</li>
            <li>✅ Use computed properties for filtered/sorted data</li>
            <li>✅ Cache table data using useAsyncData or composables</li>
            <li>❌ Don't sort/filter large datasets on the client (use server-side instead)</li>
          </ul>

          <div class="success-box">
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-check-circle" class="text-success text-xl flex-shrink-0" />
              <div>
                <h4 class="text-sm font-semibold text-[var(--ui-text-highlighted)] mb-1">
                  Checklist
                </h4>
                <p class="text-sm text-[var(--ui-text-muted)] mb-3">
                  Before considering a table implementation complete, verify:
                </p>
                <ul class="text-sm text-[var(--ui-text-muted)] space-y-1">
                  <li>✓ Loading, error, and empty states are implemented</li>
                  <li>✓ Pagination works and resets on filter changes</li>
                  <li>✓ Search is debounced (500ms)</li>
                  <li>✓ Table is responsive on mobile (test on actual device)</li>
                  <li>
                    ✓ All buttons have
                    <code>cursor-pointer</code>
                    class
                  </li>
                  <li>
                    ✓ Action buttons use
                    <code>@click.stop</code>
                    to prevent row navigation
                  </li>
                  <li>✓ Column alignment follows best practices (left/right rules)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
