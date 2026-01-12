<script setup lang="ts">
import type { TestingPlanItem } from "~/composables/useTestingPlanProgress";

const props = defineProps<{
  item: TestingPlanItem;
}>();

const { isItemCompleted, toggleItem } = useTestingPlanProgress();

const completed = computed(() => isItemCompleted(props.item.id));

const handleToggle = () => {
  toggleItem(props.item.id);
};
</script>

<template>
  <label
    class="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--ui-bg-elevated)] transition-colors cursor-pointer group"
    :class="{ 'opacity-60': completed }"
  >
    <UCheckbox :model-value="completed" class="mt-0.5" @update:model-value="handleToggle" />
    <div class="flex-1 min-w-0">
      <p
        class="text-sm leading-relaxed"
        :class="completed ? 'line-through text-[var(--ui-text-muted)]' : 'text-[var(--ui-text)]'"
      >
        {{ item.label }}
      </p>
      <p v-if="item.description" class="text-xs text-[var(--ui-text-muted)] mt-0.5">
        {{ item.description }}
      </p>
    </div>
  </label>
</template>
