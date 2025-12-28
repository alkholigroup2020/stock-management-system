<template>
  <div
    class="group relative bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-xl overflow-hidden smooth-transition hover:shadow-lg hover:border-[var(--ui-border-accented)] cursor-pointer"
    @click="handleCardClick"
  >
    <!-- Card Content -->
    <div class="p-5">
      <!-- Header Section -->
      <div class="flex items-start justify-between gap-4 mb-4">
        <!-- Icon & Title -->
        <div class="flex items-start gap-4 min-w-0 flex-1">
          <!-- Icon with gradient background -->
          <div
            class="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center smooth-transition group-hover:scale-110"
            :class="iconBackgroundClass"
          >
            <UIcon :name="locationIcon" class="w-7 h-7" :class="iconColorClass" />
          </div>

          <!-- Title & Code -->
          <div class="min-w-0 flex-1 pt-1">
            <h3
              class="text-lg font-bold text-[var(--ui-text-highlighted)] truncate mb-1 group-hover:text-[var(--ui-primary)] smooth-transition"
            >
              {{ location.name }}
            </h3>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-mono text-[var(--ui-text-muted)]">
                {{ location.code }}
              </span>
              <span class="text-[var(--ui-text-dimmed)]">•</span>
              <UBadge :color="locationTypeBadgeColor" variant="subtle" size="sm">
                {{ formatLocationType(location.type) }}
              </UBadge>
              <!-- Operators Count Badge (inline) -->
              <template v-if="showStats">
                <span class="text-[var(--ui-text-dimmed)]">•</span>
                <div
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--ui-bg-muted)] border border-[var(--ui-border-muted)]"
                >
                  <UIcon
                    name="i-lucide-users"
                    class="w-3.5 h-3.5 text-blue-500 dark:text-blue-400"
                  />
                  <span class="text-xs font-medium text-[var(--ui-text)]">
                    {{ location._count?.user_locations || 0 }}
                    <span class="text-[var(--ui-text-muted)]">
                      {{ (location._count?.user_locations || 0) === 1 ? "operator" : "operators" }}
                    </span>
                  </span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Status Badge -->
        <UBadge
          :color="location.is_active ? 'success' : 'neutral'"
          :variant="location.is_active ? 'solid' : 'soft'"
          class="flex-shrink-0"
        >
          {{ location.is_active ? "Active" : "Inactive" }}
        </UBadge>
      </div>

      <!-- Address Section -->
      <div
        v-if="location.address"
        class="mb-4 p-3 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border-muted)]"
      >
        <div class="flex items-start gap-2">
          <UIcon
            name="i-lucide-map-pin"
            class="w-4 h-4 text-[var(--ui-text-muted)] mt-0.5 flex-shrink-0"
          />
          <span class="text-sm text-[var(--ui-text)] line-clamp-2">
            {{ location.address }}
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-between gap-2 pt-4 border-t border-[var(--ui-border)]">
        <!-- Delete Button (Left) -->
        <UButton
          v-if="showDelete && canDelete"
          color="error"
          variant="ghost"
          size="sm"
          icon="i-lucide-trash-2"
          class="cursor-pointer"
          @click.stop="$emit('delete', location)"
        >
          <span class="hidden sm:inline">Delete</span>
        </UButton>

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- View & Edit Buttons (Right) -->
        <div class="flex items-center gap-2">
          <UButton
            v-if="showViewDetails"
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-eye"
            class="cursor-pointer"
            @click.stop="$emit('view-details', location)"
          >
            <span class="hidden sm:inline">View</span>
          </UButton>
          <UButton
            v-if="showEdit && canEdit"
            color="primary"
            variant="ghost"
            size="sm"
            icon="i-lucide-edit"
            class="cursor-pointer"
            @click.stop="$emit('edit', location)"
          >
            <span class="hidden sm:inline">Edit</span>
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Location {
  id: string;
  code: string;
  name: string;
  type: "KITCHEN" | "STORE" | "CENTRAL" | "WAREHOUSE";
  address?: string | null;
  is_active: boolean;
  _count?: {
    user_locations?: number;
  };
}

interface Props {
  location: Location;
  showViewDetails?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showStats?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showViewDetails: true,
  showEdit: true,
  showDelete: true,
  showStats: true,
  canEdit: true,
  canDelete: true,
});

const emit = defineEmits<{
  "view-details": [location: Location];
  edit: [location: Location];
  delete: [location: Location];
}>();

// Handle card click - navigate to details
const handleCardClick = () => {
  if (props.showViewDetails) {
    emit("view-details", props.location);
  }
};

// Location icon based on type
const locationIcon = computed(() => {
  const icons = {
    KITCHEN: "i-lucide-chef-hat",
    STORE: "i-lucide-store",
    CENTRAL: "i-lucide-warehouse",
    WAREHOUSE: "i-lucide-package-2",
  };
  return icons[props.location.type] || "i-lucide-map-pin";
});

// Icon background gradient class
const iconBackgroundClass = computed(() => {
  const backgrounds = {
    KITCHEN: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900",
    STORE:
      "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900",
    CENTRAL: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
    WAREHOUSE: "bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-700",
  };
  return backgrounds[props.location.type] || backgrounds.WAREHOUSE;
});

// Icon color class
const iconColorClass = computed(() => {
  const colors = {
    KITCHEN: "text-amber-600 dark:text-amber-400",
    STORE: "text-emerald-600 dark:text-emerald-400",
    CENTRAL: "text-blue-600 dark:text-blue-400",
    WAREHOUSE: "text-zinc-600 dark:text-zinc-400",
  };
  return colors[props.location.type] || "text-zinc-600 dark:text-zinc-400";
});

// Badge color for location type
const locationTypeBadgeColor = computed(
  (): "primary" | "secondary" | "success" | "error" | "warning" | "info" | "neutral" => {
    const colors: Record<
      string,
      "primary" | "secondary" | "success" | "error" | "warning" | "info" | "neutral"
    > = {
      KITCHEN: "warning",
      STORE: "success",
      CENTRAL: "primary",
      WAREHOUSE: "neutral",
    };
    return colors[props.location.type] || "neutral";
  }
);

// Format location type for display
const formatLocationType = (type: string) => {
  const labels = {
    KITCHEN: "Kitchen",
    STORE: "Store",
    CENTRAL: "Central",
    WAREHOUSE: "Warehouse",
  };
  return labels[type as keyof typeof labels] || type;
};
</script>
