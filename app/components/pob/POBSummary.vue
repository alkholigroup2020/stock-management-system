<script setup lang="ts">
// Props
interface POBSummary {
  total_crew_count: number;
  total_extra_count: number;
  total_mandays: number;
  entries_count: number;
}

interface Period {
  name: string;
  start_date: string | Date;
  end_date: string | Date;
}

interface Props {
  period: Period;
  summary: POBSummary;
  periodDateRange?: string;
}

const props = defineProps<Props>();

/**
 * Format period date range if not provided
 */
const formattedDateRange = computed(() => {
  if (props.periodDateRange) {
    return props.periodDateRange;
  }

  const startDate = new Date(props.period.start_date);
  const endDate = new Date(props.period.end_date);

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
});
</script>

<template>
  <UCard class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Period Info -->
      <div class="flex items-center gap-4">
        <UIcon
          name="i-lucide-calendar"
          class="w-10 h-10 text-primary shrink-0"
          aria-hidden="true"
        />
        <div>
          <h3 class="text-sm font-medium text-[var(--ui-text-muted)]">Current Period</h3>
          <p class="text-lg font-semibold text-[var(--ui-text)] mt-1">
            {{ period.name }}
          </p>
          <p class="text-sm text-[var(--ui-text-muted)] mt-1">
            {{ formattedDateRange }}
          </p>
        </div>
      </div>

      <!-- Total Mandays Summary -->
      <div class="flex items-center gap-4">
        <UIcon
          name="i-lucide-users"
          class="w-10 h-10 text-emerald-500 dark:text-emerald-400 shrink-0"
          aria-hidden="true"
        />
        <div>
          <h3 class="text-sm font-medium text-[var(--ui-text-muted)]">Total Mandays</h3>
          <p class="text-3xl font-bold text-primary mt-1">
            {{ summary.total_mandays.toLocaleString() }}
          </p>
          <p class="text-xs text-[var(--ui-text-muted)] mt-1">
            {{ summary.total_crew_count.toLocaleString() }} crew +
            {{ summary.total_extra_count.toLocaleString() }} extra
          </p>
        </div>
      </div>
    </div>
  </UCard>
</template>
