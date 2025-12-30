<script setup lang="ts">
defineEmits<{
  click: [];
}>();
</script>

<template>
  <UTooltip text="Testing Plan">
    <UButton
      icon="i-heroicons-beaker"
      color="neutral"
      variant="ghost"
      aria-label="Testing Plan"
      class="cursor-pointer"
      @click="$emit('click')"
    />
  </UTooltip>
</template>
