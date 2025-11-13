<template>
  <div
    :class="[
      'flex items-center justify-center',
      fullScreen ? 'min-h-screen' : 'py-8',
      centerContent ? 'flex-col' : '',
    ]"
  >
    <!-- Spinner Icon using Nuxt UI -->
    <UIcon :name="icon" :class="['animate-spin', sizeClasses, colorClasses]" />

    <!-- Loading Text -->
    <p
      v-if="text"
      :class="['text-muted', centerContent ? 'mt-3' : 'ml-3', textSizeClasses]"
    >
      {{ text }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

/**
 * LoadingSpinner Component
 * Displays an animated loading spinner with optional text
 *
 * Usage:
 * <CommonLoadingSpinner />
 * <CommonLoadingSpinner text="Loading data..." />
 * <CommonLoadingSpinner size="lg" color="primary" fullScreen />
 */

interface Props {
  /** Loading text to display next to spinner */
  text?: string;
  /** Size of the spinner */
  size?: "sm" | "md" | "lg" | "xl";
  /** Color variant */
  color?: "primary" | "secondary" | "neutral";
  /** Display as full screen overlay */
  fullScreen?: boolean;
  /** Center content vertically and horizontally */
  centerContent?: boolean;
  /** Custom icon (defaults to loading spinner) */
  icon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: "",
  size: "md",
  color: "primary",
  fullScreen: false,
  centerContent: true,
  icon: "i-heroicons-arrow-path",
});

// Size classes for spinner
const sizeClasses = computed(() => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };
  return sizes[props.size];
});

// Text size classes
const textSizeClasses = computed(() => {
  const sizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };
  return sizes[props.size];
});

// Color classes for spinner
const colorClasses = computed(() => {
  const colors = {
    primary: "text-primary",
    secondary: "text-[var(--ui-secondary)]",
    neutral: "text-muted",
  };
  return colors[props.color];
});
</script>
