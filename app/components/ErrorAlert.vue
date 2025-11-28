<template>
  <UAlert
    :color="alertColor"
    :variant="variant"
    :title="alertTitle"
    :description="alertDescription"
    :icon="alertIcon"
    :closable="dismissible"
    @close="handleDismiss"
    :class="customClass"
  >
    <!-- Custom content slot if needed -->
    <template v-if="$slots.default" #default>
      <slot />
    </template>

    <!-- Actions slot for custom buttons -->
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>

    <!-- Default retry action if enabled -->
    <template v-else-if="showRetry" #actions>
      <UButton color="error" variant="ghost" size="xs" @click="handleRetry">
        {{ retryText }}
      </UButton>
    </template>
  </UAlert>
</template>

<script setup lang="ts">
import { computed } from "vue";

/**
 * ErrorAlert Component
 * Displays error, warning, info, or success messages using Nuxt UI Alert
 *
 * Usage:
 * <ErrorAlert title="Error" description="Something went wrong" />
 * <ErrorAlert type="warning" title="Warning" description="Please check your input" />
 * <ErrorAlert type="success" title="Success!" description="Data saved successfully" />
 * <ErrorAlert type="info" title="Info" description="This is informational" />
 */

interface Props {
  /** Type of alert */
  type?: "error" | "warning" | "info" | "success";
  /** Alert title */
  title?: string;
  /** Alert description/message */
  description?: string;
  /** Custom icon (overrides default type icon) */
  icon?: string;
  /** Alert variant */
  variant?: "solid" | "outline" | "soft" | "subtle";
  /** Allow user to dismiss the alert */
  dismissible?: boolean;
  /** Show retry button */
  showRetry?: boolean;
  /** Retry button text */
  retryText?: string;
  /** Custom CSS classes */
  customClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: "error",
  title: "",
  description: "",
  icon: "",
  variant: "soft",
  dismissible: false,
  showRetry: false,
  retryText: "Retry",
  customClass: "",
});

const emit = defineEmits<{
  dismiss: [];
  retry: [];
}>();

// Compute alert color based on type
const alertColor = computed(() => {
  const colorMap = {
    error: "error" as const,
    warning: "warning" as const,
    info: "primary" as const,
    success: "success" as const,
  };
  return colorMap[props.type];
});

// Compute alert title (fallback to type if not provided)
const alertTitle = computed(() => {
  if (props.title) return props.title;

  const titleMap = {
    error: "Error",
    warning: "Warning",
    info: "Information",
    success: "Success",
  };
  return titleMap[props.type];
});

// Compute alert description
const alertDescription = computed(() => props.description);

// Compute alert icon based on type (if not provided)
const alertIcon = computed(() => {
  if (props.icon) return props.icon;

  const iconMap = {
    error: "i-heroicons-exclamation-circle",
    warning: "i-heroicons-exclamation-triangle",
    info: "i-heroicons-information-circle",
    success: "i-heroicons-check-circle",
  };
  return iconMap[props.type];
});

// Handle dismiss action
const handleDismiss = () => {
  emit("dismiss");
};

// Handle retry action
const handleRetry = () => {
  emit("retry");
};
</script>
