<template>
  <div
    class="flex items-center justify-between gap-3 p-3 rounded-lg bg-elevated border border-default"
  >
    <div class="flex items-center gap-2 flex-1">
      <UIcon
        :name="allowed ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
        :class="allowed ? 'text-emerald-500' : 'text-red-500'"
        class="text-lg shrink-0"
      />
      <span class="text-sm text-default">{{ label }}</span>
    </div>
    <UBadge :color="allowed ? 'success' : 'error'" variant="subtle" size="xs">
      {{ allowed ? "Allowed" : "Denied" }}
    </UBadge>
  </div>
</template>

<script setup lang="ts">
/**
 * PermissionCheck Component
 *
 * Visual indicator for permission checks showing whether a permission is granted or denied
 */
defineProps<{
  label: string;
  allowed: boolean;
}>();
</script>
