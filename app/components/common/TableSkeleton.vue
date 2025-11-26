<template>
  <div class="overflow-hidden rounded-lg border border-default bg-elevated">
    <div class="overflow-x-auto">
      <table class="w-full">
        <!-- Header Skeleton -->
        <thead class="border-b border-default bg-zinc-50 dark:bg-zinc-900">
          <tr>
            <th
              v-for="col in columns"
              :key="col"
              class="px-4 py-3 text-left"
            >
              <USkeleton class="h-4 w-24" />
            </th>
          </tr>
        </thead>

        <!-- Body Skeleton -->
        <tbody class="divide-y divide-default">
          <tr v-for="row in rows" :key="row">
            <td v-for="col in columns" :key="col" class="px-4 py-3">
              <USkeleton :class="['h-4', getColumnWidth(col)]" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * TableSkeleton Component
 * Displays a skeleton loading state for tables
 *
 * Usage:
 * <CommonTableSkeleton :columns="6" :rows="5" />
 */

interface Props {
  /** Number of columns to display */
  columns?: number;
  /** Number of rows to display */
  rows?: number;
}

const props = withDefaults(defineProps<Props>(), {
  columns: 6,
  rows: 5,
});

// Generate column widths for variation
function getColumnWidth(index: number): string {
  const widths = ["w-20", "w-32", "w-24", "w-28", "w-20", "w-24", "w-32", "w-20"];
  return widths[index % widths.length] || "w-24";
}
</script>
