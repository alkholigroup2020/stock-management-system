<template>
  <div
    :class="[
      'border-b border-default bg-default',
      paddingClasses,
      stickyHeader ? 'sticky top-16 z-10' : '',
    ]"
  >
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <!-- Left Section: Title & Description -->
      <div class="flex-1 min-w-0">
        <!-- Breadcrumb (if provided) -->
        <nav v-if="breadcrumbs && breadcrumbs.length > 0" class="mb-2">
          <ol class="flex items-center space-x-2 text-sm text-muted">
            <li v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center">
              <NuxtLink v-if="crumb.to" :to="crumb.to" class="hover:text-primary transition-colors">
                {{ crumb.label }}
              </NuxtLink>
              <span v-else>{{ crumb.label }}</span>
              <UIcon
                v-if="index < breadcrumbs.length - 1"
                name="i-heroicons-chevron-right"
                class="w-4 h-4 mx-2"
              />
            </li>
          </ol>
        </nav>

        <!-- Title Row -->
        <div class="flex items-center gap-3">
          <!-- Icon (optional) -->
          <div
            v-if="icon"
            :class="['flex items-center justify-center rounded-lg', iconBgClasses, iconSizeClasses]"
          >
            <UIcon :name="icon" :class="iconColorClasses" />
          </div>

          <!-- Title and Badge -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 :class="['font-bold text-default truncate', titleSizeClasses]">
                {{ title }}
              </h1>

              <!-- Badge (optional) -->
              <UBadge v-if="badge" :color="badgeColor" :variant="badgeVariant">
                {{ badge }}
              </UBadge>
            </div>

            <!-- Description -->
            <p v-if="description" :class="['text-muted mt-1', descriptionSizeClasses]">
              {{ description }}
            </p>
          </div>
        </div>
      </div>

      <!-- Right Section: Actions -->
      <div v-if="$slots.actions || showBackButton" class="flex items-center gap-2 sm:shrink-0">
        <!-- Back Button -->
        <UButton
          v-if="showBackButton"
          variant="ghost"
          color="neutral"
          icon="i-heroicons-arrow-left"
          @click="handleBack"
        >
          {{ backButtonText }}
        </UButton>

        <!-- Custom Actions Slot -->
        <slot name="actions" />
      </div>
    </div>

    <!-- Bottom Section: Tabs or Filters -->
    <div v-if="$slots.tabs || $slots.filters" class="mt-4">
      <slot name="tabs" />
      <slot name="filters" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

/**
 * PageHeader Component
 * Displays a consistent page header with title, description, breadcrumbs, and actions
 *
 * Usage:
 * <PageHeader
 *   title="Items & Prices"
 *   description="Manage inventory items and set period prices"
 *   icon="i-heroicons-cube"
 * >
 *   <template #actions>
 *     <UButton color="primary">Create Item</UButton>
 *   </template>
 * </PageHeader>
 */

interface Breadcrumb {
  label: string;
  to?: string;
}

interface Props {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Icon to display */
  icon?: string;
  /** Badge text */
  badge?: string;
  /** Badge color */
  badgeColor?: "primary" | "secondary" | "success" | "warning" | "error" | "neutral";
  /** Badge variant */
  badgeVariant?: "solid" | "outline" | "soft" | "subtle";
  /** Breadcrumb navigation */
  breadcrumbs?: Breadcrumb[];
  /** Show back button */
  showBackButton?: boolean;
  /** Back button text */
  backButtonText?: string;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  description: "",
  icon: "",
  badge: "",
  badgeColor: "primary",
  badgeVariant: "soft",
  breadcrumbs: undefined,
  showBackButton: false,
  backButtonText: "Back",
  stickyHeader: false,
  size: "md",
});

const emit = defineEmits<{
  back: [];
}>();

const router = useRouter();

// Padding classes
const paddingClasses = computed(() => {
  const paddings = {
    sm: "px-4 py-3",
    md: "px-6 py-4",
    lg: "px-8 py-6",
  };
  return paddings[props.size];
});

// Title size classes
const titleSizeClasses = computed(() => {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
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

// Icon size classes
const iconSizeClasses = computed(() => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };
  return sizes[props.size];
});

// Icon color classes
const iconColorClasses = computed(() => {
  return "w-5 h-5 text-primary";
});

// Icon background classes
const iconBgClasses = computed(() => {
  return "bg-elevated border border-default";
});

// Handle back button click
const handleBack = () => {
  emit("back");
  router.back();
};
</script>
