<template>
  <div class="w-full">
    <!-- Loading State -->
    <LoadingSpinner v-if="loading" text="Loading data..." :size="loadingSize" />

    <!-- Error State -->
    <ErrorAlert
      v-else-if="error"
      type="error"
      :title="errorTitle"
      :description="error"
      :show-retry="showRetry"
      @retry="handleRetry"
    />

    <!-- Empty State -->
    <EmptyState
      v-else-if="!data || data.length === 0"
      :icon="emptyIcon"
      :title="emptyTitle"
      :description="emptyDescription"
      :show-action="showEmptyAction"
      :action-text="emptyActionText"
      :action-icon="emptyActionIcon"
      @action="handleEmptyAction"
    />

    <!-- Data Table -->
    <div v-else class="overflow-x-auto">
      <UTable :data="paginatedData" :columns="normalizedColumns">
        <!-- Custom column slots -->
        <template v-for="column in columns" :key="column.key" #[`${column.key}-data`]="{ row }">
          <slot :name="`column-${column.key}`" :row="row" :value="getRowValue(row, column.key)">
            {{ getRowValue(row, column.key) }}
          </slot>
        </template>

        <!-- Actions column (if actions slot provided) -->
        <template v-if="$slots.actions" #actions-data="{ row }">
          <slot name="actions" :row="row" />
        </template>
      </UTable>

      <!-- Pagination -->
      <div
        v-if="showPagination && totalPages > 1"
        class="flex items-center justify-between px-4 py-3 border-t border-default"
      >
        <!-- Page info -->
        <div class="text-caption">
          Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ data.length }} results
        </div>

        <!-- Pagination controls -->
        <div class="flex items-center gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-heroicons-chevron-left"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            Previous
          </UButton>

          <div class="flex items-center gap-1">
            <UButton
              v-for="page in visiblePages"
              :key="page"
              :variant="page === currentPage ? 'solid' : 'ghost'"
              :color="page === currentPage ? 'primary' : 'neutral'"
              size="sm"
              @click="goToPage(page)"
            >
              {{ page }}
            </UButton>
          </div>

          <UButton
            variant="ghost"
            color="neutral"
            icon="i-heroicons-chevron-right"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            Next
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

/**
 * DataTable Component
 * A reusable data table with loading, error, empty states, and pagination
 *
 * Usage:
 * <DataTable
 *   :data="items"
 *   :columns="[
 *     { key: 'code', label: 'Code' },
 *     { key: 'name', label: 'Name' }
 *   ]"
 *   :loading="loading"
 * >
 *   <template #actions="{ row }">
 *     <UButton size="xs" @click="edit(row)">Edit</UButton>
 *   </template>
 * </DataTable>
 */

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  class?: string;
}

interface Props {
  /** Table data */
  data?: any[];
  /** Column definitions */
  columns: Column[];
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** Error title */
  errorTitle?: string;
  /** Show retry button on error */
  showRetry?: boolean;
  /** Loading spinner size */
  loadingSize?: "sm" | "md" | "lg" | "xl";
  /** Empty state icon */
  emptyIcon?: string;
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Show empty action button */
  showEmptyAction?: boolean;
  /** Empty action button text */
  emptyActionText?: string;
  /** Empty action button icon */
  emptyActionIcon?: string;
  /** Enable pagination */
  showPagination?: boolean;
  /** Items per page */
  pageSize?: number;
  /** Enable row selection */
  selectable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: false,
  error: "",
  errorTitle: "Error loading data",
  showRetry: true,
  loadingSize: "md",
  emptyIcon: "i-heroicons-inbox",
  emptyTitle: "No data available",
  emptyDescription: "There are no items to display.",
  showEmptyAction: false,
  emptyActionText: "Create New",
  emptyActionIcon: "i-heroicons-plus",
  showPagination: false,
  pageSize: 10,
  selectable: false,
});

const emit = defineEmits<{
  retry: [];
  emptyAction: [];
  select: [rows: any[]];
}>();

// Pagination state
const currentPage = ref(1);

// Normalize columns to ensure they have both key and id for UTable compatibility
const normalizedColumns = computed(() => {
  return props.columns.map((col) => ({
    ...col,
    key: col.key,
    id: col.key,
  }));
});

// Helper function to safely get row value
const getRowValue = (row: any, key: string) => {
  return row?.[key] ?? "";
};

// Pagination calculations
const totalPages = computed(() => {
  if (!props.showPagination || !props.data) return 1;
  return Math.ceil(props.data.length / props.pageSize);
});

const startIndex = computed(() => {
  if (!props.showPagination) return 0;
  return (currentPage.value - 1) * props.pageSize;
});

const endIndex = computed(() => {
  if (!props.showPagination) return props.data?.length || 0;
  return Math.min(startIndex.value + props.pageSize, props.data?.length || 0);
});

const paginatedData = computed(() => {
  if (!props.showPagination) return props.data;
  return props.data?.slice(startIndex.value, endIndex.value) || [];
});

// Visible page numbers (max 5)
const visiblePages = computed(() => {
  const pages: number[] = [];
  const total = totalPages.value;
  const current = currentPage.value;

  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, 5);
    } else if (current >= total - 2) {
      pages.push(total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(current - 2, current - 1, current, current + 1, current + 2);
    }
  }

  return pages;
});

// Go to specific page
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// Handle retry
const handleRetry = () => {
  emit("retry");
};

// Handle empty action
const handleEmptyAction = () => {
  emit("emptyAction");
};

// Expose methods for parent component
defineExpose({
  goToPage,
  currentPage,
  totalPages,
});
</script>
