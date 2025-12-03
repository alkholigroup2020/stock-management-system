<template>
  <div
    class="group relative bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-xl overflow-hidden smooth-transition hover:shadow-lg hover:border-[var(--ui-border-accented)] cursor-pointer"
    @click="handleCardClick"
  >
    <!-- Card Content -->
    <div class="p-5">
      <!-- Header Section -->
      <div class="flex items-start justify-between gap-4 mb-4">
        <!-- Name & Username -->
        <div class="min-w-0 flex-1">
          <h3
            class="text-lg font-bold text-[var(--ui-text-highlighted)] truncate mb-1 group-hover:text-[var(--ui-primary)] smooth-transition"
          >
            {{ user.full_name }}
          </h3>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-sm font-mono text-[var(--ui-text-muted)]">@{{ user.username }}</span>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <UBadge :color="roleBadgeColor" variant="subtle" size="sm">
              {{ formatRole(user.role) }}
            </UBadge>
          </div>
        </div>

        <!-- Status Badge -->
        <UBadge
          :color="user.is_active ? 'success' : 'neutral'"
          :variant="user.is_active ? 'solid' : 'soft'"
          class="flex-shrink-0"
        >
          {{ user.is_active ? "Active" : "Inactive" }}
        </UBadge>
      </div>

      <!-- Email Section -->
      <div
        v-if="user.email"
        class="mb-4 p-3 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border-muted)]"
      >
        <div class="flex items-start gap-2">
          <UIcon
            name="i-lucide-mail"
            class="w-4 h-4 text-[var(--ui-text-muted)] mt-0.5 flex-shrink-0"
          />
          <span class="text-sm text-[var(--ui-text)] truncate">
            {{ user.email }}
          </span>
        </div>
      </div>

      <!-- Location Info -->
      <div v-if="user.default_location" class="mb-4">
        <div class="flex items-center gap-2 text-sm text-[var(--ui-text-muted)]">
          <UIcon name="i-lucide-map-pin" class="w-4 h-4" />
          <span class="font-medium">Default Location:</span>
          <span class="text-[var(--ui-text)]">{{ user.default_location.name }}</span>
        </div>
      </div>

      <!-- Stats Section -->
      <div v-if="showStats && user.locations" class="mb-4">
        <div
          class="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-[var(--ui-bg-muted)] to-transparent border border-[var(--ui-border-muted)]"
        >
          <div
            class="w-10 h-10 rounded-lg bg-[var(--ui-bg-elevated)] flex items-center justify-center"
          >
            <UIcon name="i-lucide-map-pin-house" class="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-xs text-[var(--ui-text-muted)] mb-0.5">Assigned Locations</p>
            <p class="text-lg font-bold text-[var(--ui-text)]">
              {{ user.locations.length }}
            </p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2 pt-4 border-t border-[var(--ui-border)]">
        <!-- Delete Button -->
        <UButton
          v-if="showDelete && canDelete"
          color="error"
          variant="ghost"
          size="sm"
          icon="i-lucide-trash-2"
          class="cursor-pointer"
          @click.stop="$emit('delete', user)"
        >
          <span class="hidden lg:inline">Delete</span>
        </UButton>

        <!-- Spacer - hidden on small/medium screens to allow wrapping -->
        <div class="hidden xl:flex flex-1" />

        <!-- Toggle Status Button -->
        <UButton
          v-if="showToggleStatus && canToggleStatus"
          :color="user.is_active ? 'warning' : 'success'"
          variant="ghost"
          size="sm"
          :icon="user.is_active ? 'i-lucide-user-x' : 'i-lucide-user-check'"
          class="cursor-pointer"
          @click.stop="$emit('toggle-status', user)"
        >
          <span class="hidden lg:inline">
            {{ user.is_active ? "Deactivate" : "Activate" }}
          </span>
        </UButton>

        <!-- View Button -->
        <UButton
          v-if="showView"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-eye"
          class="cursor-pointer"
          @click.stop="$emit('view', user)"
        >
          <span class="hidden lg:inline">View</span>
        </UButton>

        <!-- Edit Button -->
        <UButton
          v-if="showEdit && canEdit"
          color="primary"
          variant="ghost"
          size="sm"
          icon="i-lucide-edit"
          class="cursor-pointer"
          @click.stop="$emit('edit', user)"
        >
          <span class="hidden lg:inline">Edit</span>
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserRole } from "@prisma/client";

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  default_location: {
    id: string;
    code: string;
    name: string;
  } | null;
  locations: Array<{
    location_id: string;
    code: string;
    name: string;
    access_level: string;
  }>;
}

interface Props {
  user: User;
  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showToggleStatus?: boolean;
  showStats?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canToggleStatus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showView: true,
  showEdit: true,
  showDelete: true,
  showToggleStatus: true,
  showStats: true,
  canEdit: true,
  canDelete: true,
  canToggleStatus: true,
});

const emit = defineEmits<{
  view: [user: User];
  edit: [user: User];
  delete: [user: User];
  "toggle-status": [user: User];
}>();

// Handle card click - navigate to details
const handleCardClick = () => {
  if (props.showView) {
    emit("view", props.user);
  }
};

// Badge color for role
const roleBadgeColor = computed(
  (): "primary" | "secondary" | "success" | "error" | "warning" | "info" | "neutral" => {
    const colors: Record<
      UserRole,
      "primary" | "secondary" | "success" | "error" | "warning" | "info" | "neutral"
    > = {
      ADMIN: "error",
      SUPERVISOR: "warning",
      OPERATOR: "success",
    };
    return colors[props.user.role] || "neutral";
  }
);

// Format role for display
const formatRole = (role: UserRole) => {
  const labels = {
    ADMIN: "Admin",
    SUPERVISOR: "Supervisor",
    OPERATOR: "Operator",
  };
  return labels[role] || role;
};
</script>
