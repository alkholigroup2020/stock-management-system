<template>
  <UCard class="card-elevated hover:shadow-lg transition-shadow duration-200">
    <!-- Card Header -->
    <template #header>
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center"
              :class="locationTypeClass"
            >
              <UIcon :name="locationIcon" class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-default">
                {{ location.name }}
              </h3>
              <p class="text-sm text-muted">
                {{ location.code }}
              </p>
            </div>
          </div>
        </div>
        <UBadge
          :color="location.is_active ? 'success' : 'neutral'"
          variant="subtle"
        >
          {{ location.is_active ? "Active" : "Inactive" }}
        </UBadge>
      </div>
    </template>

    <!-- Card Body -->
    <div class="space-y-3">
      <!-- Location Type -->
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-muted" />
        <span class="text-sm text-muted">Type:</span>
        <UBadge :color="locationTypeBadgeColor" variant="subtle" size="sm">
          {{ formatLocationType(location.type) }}
        </UBadge>
      </div>

      <!-- Address -->
      <div v-if="location.address" class="flex items-start gap-2">
        <UIcon name="i-lucide-map" class="w-4 h-4 text-muted mt-0.5" />
        <span class="text-sm text-default">{{ location.address }}</span>
      </div>

      <!-- Manager -->
      <div v-if="location.manager" class="flex items-center gap-2">
        <UIcon name="i-lucide-user" class="w-4 h-4 text-muted" />
        <span class="text-sm text-muted">Manager:</span>
        <span class="text-sm text-default">
          {{ location.manager.full_name || location.manager.username }}
        </span>
      </div>

      <!-- Stats -->
      <div
        v-if="showStats"
        class="flex items-center gap-4 pt-2 border-t border-default"
      >
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-users" class="w-4 h-4 text-muted" />
          <span class="text-sm text-muted">
            {{ location._count?.user_locations || 0 }} users
          </span>
        </div>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-package" class="w-4 h-4 text-muted" />
          <span class="text-sm text-muted">
            {{ location._count?.location_stock || 0 }} items
          </span>
        </div>
      </div>
    </div>

    <!-- Card Footer -->
    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <UButton
          v-if="showViewDetails"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-eye"
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
          @click="$emit('edit', location)"
        >
          Edit
        </UButton>
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
  manager?: {
    id: string;
    username: string;
    full_name?: string | null;
  } | null;
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
  showStats?: boolean;
  canEdit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showViewDetails: true,
  showEdit: true,
  showStats: true,
  canEdit: true,
});

defineEmits<{
  "view-details": [location: Location];
  edit: [location: Location];
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

const locationTypeClass = computed(() => {
  const classes = {
    KITCHEN:
      "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
    STORE:
      "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
    CENTRAL: "bg-navy-100 dark:bg-navy-900/20 text-navy-700 dark:text-navy-400",
    WAREHOUSE: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400",
  };
  return classes[props.location.type] || "bg-zinc-100 dark:bg-zinc-800";
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
