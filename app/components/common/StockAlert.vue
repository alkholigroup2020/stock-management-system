<script setup lang="ts">
/**
 * StockAlert Component
 *
 * Alert component for displaying stock-related warnings and errors.
 * Used for insufficient stock alerts, low stock warnings, etc.
 */

// Props
interface Props {
  /**
   * Alert variant
   */
  variant?: "subtle" | "solid" | "outline";
  /**
   * Alert type/severity
   */
  type?: "error" | "warning" | "info";
  /**
   * Alert title
   */
  title?: string;
  /**
   * Alert message/description
   */
  message: string;
  /**
   * Optional item details causing the alert
   */
  items?: Array<{
    item_name: string;
    requested: number;
    available: number;
  }>;
  /**
   * Whether alert is dismissible
   */
  dismissible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "subtle",
  type: "error",
  title: undefined,
  dismissible: false,
});

// Computed
const color = computed(() => {
  switch (props.type) {
    case "error":
      return "error";
    case "warning":
      return "warning";
    case "info":
      return "primary";
    default:
      return "error";
  }
});

const icon = computed(() => {
  switch (props.type) {
    case "error":
      return "i-lucide-alert-circle";
    case "warning":
      return "i-lucide-alert-triangle";
    case "info":
      return "i-lucide-info";
    default:
      return "i-lucide-alert-circle";
  }
});

const itemsText = computed(() => {
  if (!props.items || props.items.length === 0) return "";

  return props.items
    .map(
      (item) =>
        `${item.item_name}: requested ${item.requested}, available ${item.available}`
    )
    .join("; ");
});
</script>

<template>
  <UAlert
    :icon="icon"
    :color="color"
    :variant="variant"
    :title="
      title || (type === 'error' ? 'Insufficient Stock' : 'Stock Warning')
    "
    :description="
      items && items.length > 0 ? `${message} ${itemsText}` : message
    "
    :dismissible="dismissible"
  >
    <!-- Item Details -->
    <template v-if="items && items.length > 0" #default>
      <div class="mt-3 space-y-2">
        <div
          v-for="(item, index) in items"
          :key="index"
          class="flex items-center justify-between text-sm"
        >
          <span class="font-medium">{{ item.item_name }}</span>
          <span class="text-muted">
            Requested: <span class="font-semibold">{{ item.requested }}</span> /
            Available: <span class="font-semibold">{{ item.available }}</span>
          </span>
        </div>
      </div>
    </template>
  </UAlert>
</template>
