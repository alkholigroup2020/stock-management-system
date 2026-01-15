<template>
  <div class="space-y-4">
    <!-- Summary -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-[var(--ui-text)]">Preview Import</h3>
        <p class="text-sm text-[var(--ui-text-muted)]">
          {{ preview.fileName }} - {{ preview.totalRows }} total rows
        </p>
      </div>
      <UBadge color="primary" variant="subtle" size="sm">
        Showing {{ preview.previewCount }} of {{ preview.totalRows }}
      </UBadge>
    </div>

    <!-- Missing Columns Warning -->
    <UAlert
      v-if="preview.missingColumns && preview.missingColumns.length > 0"
      color="warning"
      variant="subtle"
      icon="i-lucide-alert-triangle"
      title="Optional columns not found"
      :description="`The following optional columns were not found: ${preview.missingColumns.join(', ')}`"
    />

    <!-- Warnings Summary -->
    <UAlert
      v-if="preview.warnings && preview.warnings.length > 0"
      color="warning"
      variant="subtle"
      icon="i-lucide-alert-circle"
      title="Potential issues detected"
      :description="`${preview.warnings.length} potential issue(s) found in preview rows. Import will skip these rows.`"
    />

    <!-- Preview Table -->
    <div class="border border-[var(--ui-border)] rounded-lg overflow-hidden">
      <div class="max-h-80 overflow-auto">
        <table class="w-full text-sm">
          <thead class="bg-[var(--ui-bg-elevated)] sticky top-0 z-10">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium text-[var(--ui-text-muted)] w-10">
                #
              </th>
              <th
                v-for="header in displayHeaders"
                :key="header.key"
                class="px-3 py-2 text-left text-xs font-medium"
                :class="header.required ? 'text-[var(--ui-text)]' : 'text-[var(--ui-text-muted)]'"
              >
                {{ header.label }}
                <span v-if="header.required" class="text-error">*</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)]">
            <tr
              v-for="(row, index) in preview.rows"
              :key="index"
              class="hover:bg-[var(--ui-bg-elevated)]"
              :class="{ 'bg-warning/5': hasWarningForRow(index + 2) }"
            >
              <td class="px-3 py-2 text-[var(--ui-text-muted)] font-mono text-xs">
                {{ index + 2 }}
              </td>
              <td class="px-3 py-2 text-[var(--ui-text)]">
                <span :class="{ 'text-error': !row.code }">
                  {{ row.code || "(empty)" }}
                </span>
              </td>
              <td class="px-3 py-2 text-[var(--ui-text)]">
                <span :class="{ 'text-error': !row.name }">
                  {{ row.name || "(empty)" }}
                </span>
              </td>
              <td class="px-3 py-2">
                <UBadge
                  v-if="row.unit"
                  :color="isValidUnit(row.unit) ? 'neutral' : 'error'"
                  variant="subtle"
                  size="xs"
                >
                  {{ row.unit }}
                </UBadge>
                <span v-else class="text-error text-xs">(empty)</span>
              </td>
              <td class="px-3 py-2 text-[var(--ui-text-muted)]">
                {{ row.category || "-" }}
              </td>
              <td class="px-3 py-2 text-[var(--ui-text-muted)]">
                {{ row.sub_category || "-" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center gap-4 text-xs text-[var(--ui-text-muted)]">
      <span class="flex items-center gap-1">
        <span class="text-error">*</span>
        Required field
      </span>
      <span v-if="preview.totalRows > preview.previewCount" class="flex items-center gap-1">
        <UIcon name="i-lucide-info" class="w-3 h-3" />
        {{ preview.totalRows - preview.previewCount }} more rows not shown
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ImportPreview, ImportError } from "~~/shared/types/import";

const props = defineProps<{
  preview: ImportPreview;
}>();

const VALID_UNITS = ["KG", "EA", "LTR", "BOX", "CASE", "PACK"];

const displayHeaders = [
  { key: "code", label: "Code", required: true },
  { key: "name", label: "Name", required: true },
  { key: "unit", label: "Unit", required: true },
  { key: "category", label: "Category", required: false },
  { key: "sub_category", label: "Subcategory", required: false },
];

function isValidUnit(unit: string): boolean {
  return VALID_UNITS.includes(unit.toUpperCase());
}

function hasWarningForRow(rowNumber: number): boolean {
  if (!props.preview.warnings) return false;
  return props.preview.warnings.some((w: ImportError) => w.row === rowNumber);
}
</script>
