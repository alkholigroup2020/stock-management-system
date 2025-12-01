<template>
  <UCard class="card-elevated">
    <!-- Card Header -->
    <template #header>
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-4 min-w-0">
          <UIcon :name="locationIcon" class="w-10 h-10" :class="locationIconColor" />
          <div class="min-w-0">
            <h3 class="text-subheading font-semibold truncate">
              {{ location.name }}
            </h3>
            <p class="text-caption font-medium">
              {{ location.code }}
            </p>
          </div>
        </div>
        <UBadge
          :color="location.is_active ? 'success' : 'neutral'"
          variant="subtle"
          class="flex-shrink-0"
        >
          {{ location.is_active ? "Active" : "Inactive" }}
        </UBadge>
      </div>
    </template>

    <!-- Card Body -->
    <div class="space-y-4">
      <!-- Location Type -->
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-muted" />
        <span class="text-caption">Type:</span>
        <UBadge :color="locationTypeBadgeColor" variant="subtle" size="sm">
          {{ formatLocationType(location.type) }}
        </UBadge>
      </div>

      <!-- Address -->
      <div v-if="location.address" class="flex items-start gap-2">
        <UIcon name="i-lucide-map" class="w-4 h-4 text-muted mt-0.5" />
        <span class="text-body">{{ location.address }}</span>
      </div>

      <!-- Stats -->
      <div
        v-if="showStats"
        class="flex items-center gap-6 pt-3 border-t border-default"
      >
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-users" class="w-4 h-4 text-muted" />
          <span class="text-caption font-medium">
            {{ location._count?.user_locations || 0 }} users
          </span>
        </div>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-package" class="w-4 h-4 text-muted" />
          <span class="text-caption font-medium">
            {{ location._count?.location_stock || 0 }} items
          </span>
        </div>
      </div>
    </div>

    <!-- Card Footer -->
    <template #footer>
      <div class="flex items-center justify-between gap-2">
        <!-- Left: Delete (destructive) -->
        <UButton
          v-if="showDelete && canDelete"
          color="error"
          variant="ghost"
          size="sm"
          icon="i-lucide-trash-2"
          class="cursor-pointer"
          @click="$emit('delete', location)"
        >
          Delete
        </UButton>

        <!-- Right: View & Edit -->
        <div class="flex items-center gap-2 ml-auto">
          <UButton
            v-if="showViewDetails"
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-eye"
            class="cursor-pointer"
            @click="$emit('view-details', location)"
          >
            View Details
          </UButton>
          <UButton
            v-if="showEdit && canEdit"
            color="primary"
            variant="ghost"
            size="sm"
            icon="i-lucide-edit"
            class="cursor-pointer"
            @click="$emit('edit', location)"
          >
            Edit
          </UButton>
        </div>
      </div>
    </template>
  </UCard>
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
    location_stock?: number;
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

defineEmits<{
  "view-details": [location: Location];
  edit: [location: Location];
  delete: [location: Location];
}>();

// Computed properties for location type styling
const locationIcon = computed(() => {
  const icons = {
    KITCHEN: "i-lucide-chef-hat",
    STORE: "i-lucide-store",
    CENTRAL: "i-lucide-warehouse",
    WAREHOUSE: "i-lucide-package-2",
  };
  return icons[props.location.type] || "i-lucide-map-pin";
});

const locationIconColor = computed(() => {
  const colors = {
    KITCHEN: "text-amber-500 dark:text-amber-400",
    STORE: "text-emerald-500 dark:text-emerald-400",
    CENTRAL: "text-blue-500 dark:text-blue-400",
    WAREHOUSE: "text-zinc-500 dark:text-zinc-400",
  };
  return colors[props.location.type] || "text-zinc-500 dark:text-zinc-400";
});

const locationTypeBadgeColor = computed(
  ():
    | "primary"
    | "secondary"
    | "success"
    | "error"
    | "warning"
    | "info"
    | "neutral" => {
    const colors: Record<
      string,
      | "primary"
      | "secondary"
      | "success"
      | "error"
      | "warning"
      | "info"
      | "neutral"
    > = {
      KITCHEN: "warning",
      STORE: "success",
      CENTRAL: "primary",
      WAREHOUSE: "neutral",
    };
    return colors[props.location.type] || "neutral";
  }
);

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
