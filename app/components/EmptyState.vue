<template>
  <div :class="['flex flex-col items-center justify-center text-center', paddingClasses]">
    <!-- Icon -->
    <div class="mb-4">
      <UIcon :name="icon" :class="[iconSizeClasses, iconColorClasses]" />
    </div>

    <!-- Title -->
    <h3 :class="['font-semibold text-default mb-2', titleSizeClasses]">
      {{ title }}
    </h3>

    <!-- Description -->
    <p v-if="description" :class="['text-muted max-w-md mb-6', descriptionSizeClasses]">
      {{ description }}
    </p>

    <!-- Primary Action Button -->
    <div v-if="showAction || $slots.action" class="flex flex-col sm:flex-row gap-3">
      <slot name="action">
        <UButton
          v-if="showAction"
          :color="actionColor"
          :variant="actionVariant"
          :icon="actionIcon"
          @click="handleAction"
        >
          {{ actionText }}
        </UButton>
      </slot>
    </div>

    <!-- Custom content slot -->
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

/**
 * EmptyState Component
 * Displays a friendly empty state with icon, title, description, and optional action
 *
 * Usage:
 * <EmptyState
 *   title="No items found"
 *   description="There are no items to display. Create your first item to get started."
 *   actionText="Create Item"
 *   @action="handleCreate"
 * />
 */

interface Props {
  /** Icon to display */
  icon?: string;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Show action button */
  showAction?: boolean;
  /** Action button text */
  actionText?: string;
  /** Action button icon */
  actionIcon?: string;
  /** Action button color */
  actionColor?: "primary" | "secondary" | "success" | "error" | "neutral";
  /** Action button variant */
  actionVariant?: "solid" | "outline" | "soft" | "ghost";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Padding size */
  padding?: "sm" | "md" | "lg";
}

const props = withDefaults(defineProps<Props>(), {
  icon: "i-heroicons-inbox",
  title: "No data available",
  description: "",
  showAction: false,
  actionText: "Take Action",
  actionIcon: "",
  actionColor: "primary",
  actionVariant: "solid",
  size: "md",
  padding: "lg",
});

const emit = defineEmits<{
  action: [];
}>();

// Padding classes
const paddingClasses = computed(() => {
  const paddings = {
    sm: "py-8 px-4",
    md: "py-12 px-6",
    lg: "py-16 px-8",
  };
  return paddings[props.padding];
});

// Icon size classes
const iconSizeClasses = computed(() => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };
  return sizes[props.size];
});

// Icon color classes
const iconColorClasses = computed(() => {
  return "text-muted";
});

// Title size classes
const titleSizeClasses = computed(() => {
  const sizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };
  return sizes[props.size];
});

// Description size classes
const descriptionSizeClasses = computed(() => {
  const sizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };
  return sizes[props.size];
});

// Handle action click
const handleAction = () => {
  emit("action");
};
</script>
