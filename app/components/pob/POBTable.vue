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
 * Format date for accessibility label
 */
function formatDateForLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
  <UCard class="card-elevated" :ui="{ body: 'p-0' }">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-[var(--ui-border)]" role="grid">
        <thead>
          <tr class="bg-[var(--ui-bg-muted)]">
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :class="[
                'px-4 py-3 text-left text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider',
                column.class,
              ]"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--ui-border-muted)]">
          <tr
            v-for="dateStr in sortedDates"
            :key="dateStr"
            :class="[
              'hover:bg-[var(--ui-bg-hover)] smooth-transition',
              isSaving(dateStr) ? 'opacity-50' : '',
            ]"
          >
            <!-- Date -->
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-calendar-days"
                  class="w-4 h-4 text-primary shrink-0"
                  aria-hidden="true"
                />
                <span class="text-sm font-medium text-[var(--ui-text)]">
                  {{ formatDateDisplay(dateStr) }}
                </span>
              </div>
            </td>

            <!-- Crew Count -->
            <td class="px-4 py-3 whitespace-nowrap text-center">
              <label :for="`crew-${dateStr}`" class="sr-only">
                Crew count for {{ formatDateForLabel(dateStr) }}
              </label>
              <UInput
                :id="`crew-${dateStr}`"
                v-model.number="entries.get(dateStr)!.crew_count"
                type="number"
                min="0"
                step="1"
                :disabled="disabled || isSaving(dateStr)"
                :aria-busy="isSaving(dateStr)"
                class="w-24 mx-auto"
                size="md"
                @blur="handleBlur(dateStr)"
                @input="handleChange(dateStr)"
              />
            </td>

            <!-- Extra Count -->
            <td class="px-4 py-3 whitespace-nowrap text-center">
              <label :for="`extra-${dateStr}`" class="sr-only">
                Extra count for {{ formatDateForLabel(dateStr) }}
              </label>
              <UInput
                :id="`extra-${dateStr}`"
                v-model.number="entries.get(dateStr)!.extra_count"
                type="number"
                min="0"
                step="1"
                :disabled="disabled || isSaving(dateStr)"
                :aria-busy="isSaving(dateStr)"
                class="w-24 mx-auto"
                size="md"
                @blur="handleBlur(dateStr)"
                @input="handleChange(dateStr)"
              />
            </td>

            <!-- Total -->
            <td class="px-4 py-3 whitespace-nowrap text-center">
              <div class="flex items-center justify-center gap-2">
                <span
                  class="text-sm font-semibold"
                  :class="
                    entries.get(dateStr)!.total_count > 0
                      ? 'text-emerald-600 dark:text-emerald-500'
                      : 'text-[var(--ui-text-muted)]'
                  "
                  :aria-label="`Total for ${formatDateForLabel(dateStr)}: ${entries.get(dateStr)!.total_count}`"
                >
                  {{ entries.get(dateStr)!.total_count }}
                </span>
                <UIcon
                  v-if="isSaving(dateStr)"
                  name="i-lucide-loader-2"
                  class="w-4 h-4 animate-spin text-primary"
                  aria-label="Saving..."
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
