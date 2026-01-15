<template>
  <div class="space-y-4">
    <!-- Summary -->
    <div class="text-center py-4">
      <UIcon
        :name="result.success ? 'i-lucide-check-circle' : 'i-lucide-alert-circle'"
        :class="['w-12 h-12 mx-auto mb-3', result.success ? 'text-success' : 'text-error']"
      />
      <h3 class="text-lg font-semibold text-[var(--ui-text)]">
        {{ result.success ? "Import Completed" : "Import Failed" }}
      </h3>
      <p class="text-sm text-[var(--ui-text-muted)] mt-1">
        {{ result.summary.fileName }}
      </p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-3">
      <div class="text-center p-3 rounded-lg bg-[var(--ui-bg-elevated)]">
        <p class="text-2xl font-bold text-[var(--ui-text)]">
          {{ result.summary.totalRows }}
        </p>
        <p class="text-xs text-[var(--ui-text-muted)]">Total Rows</p>
      </div>
      <div class="text-center p-3 rounded-lg bg-success/10">
        <p class="text-2xl font-bold text-success">
          {{ result.summary.successCount }}
        </p>
        <p class="text-xs text-[var(--ui-text-muted)]">Imported</p>
      </div>
      <div
        class="text-center p-3 rounded-lg"
        :class="result.summary.errorCount > 0 ? 'bg-error/10' : 'bg-[var(--ui-bg-elevated)]'"
      >
        <p
          class="text-2xl font-bold"
          :class="result.summary.errorCount > 0 ? 'text-error' : 'text-[var(--ui-text-muted)]'"
        >
          {{ result.summary.errorCount }}
        </p>
        <p class="text-xs text-[var(--ui-text-muted)]">Failed</p>
      </div>
    </div>

    <!-- Error Summary by Type -->
    <div v-if="result.errors.length > 0" class="flex flex-wrap gap-2">
      <UBadge
        v-for="(count, errorType) in errorsByType"
        :key="errorType"
        :color="getErrorTypeBadgeColor(errorType)"
        variant="subtle"
        size="sm"
      >
        {{ getErrorTypeLabel(errorType) }}: {{ count }}
      </UBadge>
    </div>

    <!-- Errors List -->
    <div v-if="result.errors.length > 0" class="space-y-2">
      <h4 class="text-sm font-medium text-[var(--ui-text)] flex items-center gap-2">
        <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 text-warning" />
        Error Details ({{ result.errors.length }})
      </h4>
      <div class="max-h-60 overflow-y-auto border border-[var(--ui-border)] rounded-lg">
        <table class="w-full text-sm">
          <thead class="bg-[var(--ui-bg-elevated)] sticky top-0 z-10">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium text-[var(--ui-text-muted)]">
                Row
              </th>
              <th class="px-3 py-2 text-left text-xs font-medium text-[var(--ui-text-muted)]">
                Type
              </th>
              <th class="px-3 py-2 text-left text-xs font-medium text-[var(--ui-text-muted)]">
                Field
              </th>
              <th class="px-3 py-2 text-left text-xs font-medium text-[var(--ui-text-muted)]">
                Message
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)]">
            <tr
              v-for="(error, index) in result.errors"
              :key="index"
              class="hover:bg-[var(--ui-bg-elevated)]"
            >
              <td class="px-3 py-2 whitespace-nowrap font-mono text-[var(--ui-text)]">
                {{ error.row }}
              </td>
              <td class="px-3 py-2 whitespace-nowrap">
                <UBadge :color="getErrorTypeBadgeColor(error.code)" variant="subtle" size="xs">
                  {{ getErrorTypeLabel(error.code) }}
                </UBadge>
              </td>
              <td class="px-3 py-2 whitespace-nowrap">
                <span v-if="error.field" class="font-mono text-[var(--ui-text)]">
                  {{ error.field }}
                </span>
                <span v-else class="text-[var(--ui-text-muted)]">-</span>
              </td>
              <td class="px-3 py-2 text-[var(--ui-text-muted)]">
                {{ error.message }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-[var(--ui-text-dimmed)] italic">
        Row numbers correspond to rows in your spreadsheet (including header row)
      </p>
    </div>

    <!-- Success Message -->
    <UAlert
      v-if="result.success && result.summary.errorCount === 0"
      color="success"
      variant="subtle"
      icon="i-lucide-check"
      title="All items imported successfully"
    />

    <!-- Partial Success Message -->
    <UAlert
      v-else-if="result.success && result.summary.errorCount > 0"
      color="warning"
      variant="subtle"
      icon="i-lucide-alert-triangle"
      title="Import completed with errors"
      description="Some items were imported successfully. Review the errors above and re-import the failed items after fixing the issues."
    />
  </div>
</template>

<script setup lang="ts">
import type { ImportResult, ImportErrorCode } from "~~/shared/types/import";

const props = defineProps<{
  result: ImportResult;
}>();

/**
 * Group errors by type and count them
 */
const errorsByType = computed(() => {
  const counts: Partial<Record<ImportErrorCode, number>> = {};
  for (const error of props.result.errors) {
    counts[error.code] = (counts[error.code] || 0) + 1;
  }
  return counts;
});

/**
 * Get human-readable label for error type
 */
function getErrorTypeLabel(code: ImportErrorCode | string): string {
  const labels: Record<string, string> = {
    MISSING_REQUIRED_FIELD: "Missing Field",
    INVALID_UNIT: "Invalid Unit",
    CODE_TOO_LONG: "Code Too Long",
    NAME_TOO_LONG: "Name Too Long",
    CATEGORY_TOO_LONG: "Category Too Long",
    DUPLICATE_CODE_IN_FILE: "Duplicate in File",
    DUPLICATE_CODE_IN_DATABASE: "Exists in DB",
    INVALID_FILE_FORMAT: "Invalid Format",
    FILE_TOO_LARGE: "File Too Large",
    ROW_LIMIT_EXCEEDED: "Row Limit",
    EMPTY_FILE: "Empty File",
    MISSING_REQUIRED_COLUMNS: "Missing Columns",
  };
  return labels[code] || code;
}

/**
 * Get badge color based on error type
 */
function getErrorTypeBadgeColor(code: ImportErrorCode | string): "error" | "warning" | "neutral" {
  switch (code) {
    case "DUPLICATE_CODE_IN_DATABASE":
    case "DUPLICATE_CODE_IN_FILE":
      return "warning";
    case "MISSING_REQUIRED_FIELD":
    case "INVALID_UNIT":
    case "CODE_TOO_LONG":
    case "NAME_TOO_LONG":
    case "CATEGORY_TOO_LONG":
      return "error";
    default:
      return "neutral";
  }
}
</script>
