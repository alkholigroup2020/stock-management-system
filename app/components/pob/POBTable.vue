<script setup lang="ts">
import { formatDate } from "~/utils/format";

// Props
interface POBEntry {
  id?: string;
  date: string;
  crew_count: number;
  extra_count: number;
  total_count: number;
  enterer?: {
    full_name: string;
  };
  entered_at?: string;
  updated_at?: string;
}

interface Props {
  entries: Map<string, POBEntry>;
  disabled?: boolean;
  savingDates?: Set<string>;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  savingDates: () => new Set(),
});

// Emits
const emit = defineEmits<{
  blur: [dateStr: string];
  change: [dateStr: string];
}>();

// Table columns
const columns = [
  {
    key: "date",
    label: "Date",
    class: "font-medium",
  },
  {
    key: "crew_count",
    label: "Crew Count",
    class: "text-center",
  },
  {
    key: "extra_count",
    label: "Extra Count",
    class: "text-center",
  },
  {
    key: "total_count",
    label: "Total",
    class: "text-center font-semibold",
  },
];

/**
 * Get sorted dates array
 */
const sortedDates = computed(() => {
  return Array.from(props.entries.keys()).sort();
});

/**
 * Check if date is being saved
 */
function isSaving(dateStr: string): boolean {
  return props.savingDates.has(dateStr);
}

/**
 * Format date for display
 */
function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });
  const formatted = formatDate(dateStr);
  return `${dayOfWeek}, ${formatted}`;
}

/**
 * Handle input blur
 */
function handleBlur(dateStr: string) {
  emit("blur", dateStr);
}

/**
 * Handle input change
 */
function handleChange(dateStr: string) {
  emit("change", dateStr);
}
</script>

<template>
  <UCard>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-[var(--ui-border)]">
        <thead>
          <tr class="bg-[var(--ui-bg-elevated)]">
            <th
              v-for="column in columns"
              :key="column.key"
              :class="[
                'px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider',
                column.class,
              ]"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--ui-border)]">
          <tr
            v-for="dateStr in sortedDates"
            :key="dateStr"
            :class="[
              'hover:bg-[var(--ui-bg-elevated)] transition-colors',
              isSaving(dateStr) ? 'opacity-50' : '',
            ]"
          >
            <!-- Date -->
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-[var(--ui-text)]">
              {{ formatDateDisplay(dateStr) }}
            </td>

            <!-- Crew Count -->
            <td class="px-4 py-3 whitespace-nowrap text-center">
              <UInput
                v-model.number="entries.get(dateStr)!.crew_count"
                type="number"
                min="0"
                step="1"
                :disabled="disabled || isSaving(dateStr)"
                class="w-24 mx-auto"
                @blur="handleBlur(dateStr)"
                @input="handleChange(dateStr)"
              />
            </td>

            <!-- Extra Count -->
            <td class="px-4 py-3 whitespace-nowrap text-center">
              <UInput
                v-model.number="entries.get(dateStr)!.extra_count"
                type="number"
                min="0"
                step="1"
                :disabled="disabled || isSaving(dateStr)"
                class="w-24 mx-auto"
                @blur="handleBlur(dateStr)"
                @input="handleChange(dateStr)"
              />
            </td>

            <!-- Total -->
            <td class="px-4 py-3 whitespace-nowrap text-center text-sm font-semibold text-[var(--ui-text)]">
              <div class="flex items-center justify-center gap-2">
                <span>{{ entries.get(dateStr)!.total_count }}</span>
                <UIcon
                  v-if="isSaving(dateStr)"
                  name="i-heroicons-arrow-path"
                  class="w-4 h-4 animate-spin text-[var(--ui-primary)]"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
