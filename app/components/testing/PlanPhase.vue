<script setup lang="ts">
import type { TestingPlanPhase } from "~/composables/useTestingPlanProgress";

const props = defineProps<{
  phase: TestingPlanPhase;
  expanded: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();

const { getPhaseProgress } = useTestingPlanProgress();

const progress = computed(() => getPhaseProgress(props.phase));

const progressColor = computed(() => {
  if (progress.value.percentage === 100) return "success";
  if (progress.value.percentage > 0) return "primary";
  return "neutral";
});
</script>

<template>
  <div class="border border-[var(--ui-border)] rounded-lg overflow-hidden">
    <!-- Phase Header -->
    <button
      class="w-full flex items-center justify-between p-3 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
      @click="emit('toggle')"
    >
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <UIcon
          :name="expanded ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
          class="text-[var(--ui-text-muted)] flex-shrink-0 transition-transform duration-200"
        />
        <span class="font-medium text-[var(--ui-text-highlighted)] truncate text-left">
          {{ phase.title }}
        </span>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0 ml-2">
        <UBadge :color="progressColor" variant="subtle" size="xs">
          {{ progress.completed }}/{{ progress.total }}
        </UBadge>
      </div>
    </button>

    <!-- Phase Items (collapsible) -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-[2000px]"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 max-h-[2000px]"
      leave-to-class="opacity-0 max-h-0"
    >
      <div v-if="expanded" class="border-t border-[var(--ui-border)] overflow-hidden">
        <div class="p-3 space-y-1 bg-[var(--ui-bg)]">
          <p
            v-if="phase.description"
            class="text-xs text-[var(--ui-text-muted)] mb-3 pb-2 border-b border-[var(--ui-border-muted)]"
          >
            {{ phase.description }}
          </p>
          <TestingPlanItem v-for="item in phase.items" :key="item.id" :item="item" />
        </div>
      </div>
    </Transition>
  </div>
</template>
