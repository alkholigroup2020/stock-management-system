<script setup lang="ts">
import type { Ref } from "vue";

const expandedSections = ref<string[]>([]);

const toggleSection = (section: string) => {
  if (expandedSections.value.includes(section)) {
    expandedSections.value = [];
  } else {
    expandedSections.value = [section];
  }
};

const isExpanded = (section: string) => expandedSections.value.includes(section);

const targetSubSection = inject<Ref<string | null>>("devTargetSection", ref(null));

watch(
  targetSubSection,
  (newSection) => {
    if (newSection) {
      if (!expandedSections.value.includes(newSection)) {
        expandedSections.value.push(newSection);
      }
      nextTick(() => {
        const element = document.getElementById(`dev-section-${newSection}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (targetSubSection.value) {
          targetSubSection.value = null;
        }
      });
    }
  },
  { immediate: true }
);

// Code examples
const codeExamples = {
  authState: `interface AuthState {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "SUPERVISOR" | "OPERATOR";
  } | null;
}`,

  locationState: `interface LocationState {
  activeLocation: {
    id: string;
    name: string;
    code: string;
    type: "KITCHEN" | "STORE" | "CENTRAL" | "WAREHOUSE";
  } | null;
  userLocations: Location[];
}`,

  locationUsage: `const locationStore = useLocationStore();

// Get active location
const locationId = locationStore.getActiveLocationId;

// Switch location
locationStore.setActiveLocation(newLocation);`,

  periodState: `interface PeriodState {
  currentPeriod: {
    id: string;
    name: string;        // e.g., "January 2024"
    startDate: string;
    endDate: string;
    status: "DRAFT" | "OPEN" | "PENDING_CLOSE" | "CLOSED";
  } | null;
  loading: boolean;
  error: string | null;
}`,

  uiState: `interface UIState {
  sidebarCollapsed: boolean;
  // Additional UI state as needed
}`,

  uiUsage: `const uiStore = useUIStore();

// Toggle sidebar
uiStore.sidebarCollapsed = !uiStore.sidebarCollapsed;`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Pinia Stores</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        4 Pinia stores for global state management
      </p>
    </div>

    <!-- Auth Store Section -->
    <section
      id="dev-section-auth"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('auth')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-user-circle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Auth Store</span>
          <code class="rounded bg-[var(--ui-bg-muted)] px-1.5 py-0.5 text-xs">stores/auth.ts</code>
        </span>
        <UIcon
          :name="isExpanded('auth') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('auth')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Manages authentication state and user session:
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">State</h4>
          <DeveloperCodeBlock
            :code="codeExamples.authState"
            language="typescript"
            filename="app/stores/auth.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Getters</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">isAuthenticated</code> - Boolean, true if user is logged in</li>
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">isAdmin</code> - Boolean, true if user role is ADMIN</li>
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">isSupervisor</code> - Boolean, true if user role is SUPERVISOR</li>
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">isOperator</code> - Boolean, true if user role is OPERATOR</li>
          </ul>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Actions</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">setUser(user)</code> - Set the current user</li>
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">clearUser()</code> - Clear user on logout</li>
          </ul>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>Use <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">useAuth()</code> composable instead of accessing the store directly.</span>
          </p>
        </div>
      </div>
    </section>

    <!-- Location Store Section -->
    <section
      id="dev-section-location"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('location')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-map-pin" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Location Store</span>
          <code class="rounded bg-[var(--ui-bg-muted)] px-1.5 py-0.5 text-xs">
            stores/location.ts
          </code>
        </span>
        <UIcon
          :name="isExpanded('location') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('location')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Manages active location and user's accessible locations:
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">State</h4>
          <DeveloperCodeBlock
            :code="codeExamples.locationState"
            language="typescript"
            filename="app/stores/location.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Key Features</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>setActiveLocation(location)</strong> - Change active location, updates all
              data
            </li>
            <li>
              <strong>fetchUserLocations()</strong> - Load locations user has access to
            </li>
            <li><strong>getActiveLocationId</strong> - Getter for current location ID</li>
          </ul>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Usage</h4>
          <DeveloperCodeBlock :code="codeExamples.locationUsage" language="typescript" />
        </div>
      </div>
    </section>

    <!-- Period Store Section -->
    <section
      id="dev-section-period"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('period')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-calendar" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Period Store</span>
          <code class="rounded bg-[var(--ui-bg-muted)] px-1.5 py-0.5 text-xs">stores/period.ts</code>
        </span>
        <UIcon
          :name="isExpanded('period') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('period')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Manages current accounting period:
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">State</h4>
          <DeveloperCodeBlock
            :code="codeExamples.periodState"
            language="typescript"
            filename="app/stores/period.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Getters</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">isOpen</code> - Boolean, true if period status is OPEN</li>
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">isPendingClose</code> - Boolean, true if PENDING_CLOSE</li>
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">isClosed</code> - Boolean, true if CLOSED</li>
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">periodName</code> - Formatted period name</li>
          </ul>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Actions</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">fetchCurrentPeriod()</code> - Load current open period from API</li>
          </ul>
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              Always check <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">isOpen</code> before allowing transactions. Closed periods cannot
              be modified.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- UI Store Section -->
    <section
      id="dev-section-ui"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('ui')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-window" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">UI Store</span>
          <code class="rounded bg-[var(--ui-bg-muted)] px-1.5 py-0.5 text-xs">stores/ui.ts</code>
        </span>
        <UIcon
          :name="isExpanded('ui') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('ui')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Global UI state for coordinating across components:
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">State</h4>
          <DeveloperCodeBlock
            :code="codeExamples.uiState"
            language="typescript"
            filename="app/stores/ui.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Usage</h4>
          <DeveloperCodeBlock
            :code="codeExamples.uiUsage"
            language="typescript"
            filename="app/stores/ui.ts"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              Use this store sparingly. Prefer local component state when possible. Only use for
              truly global UI coordination.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Best Practices -->
    <section class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-4">
      <h3 class="mb-3 font-semibold text-[var(--ui-text-highlighted)]">Store Best Practices</h3>
      <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
        <li class="flex items-start gap-2">
          <UIcon name="i-heroicons-check-circle" class="mt-0.5 shrink-0 text-[var(--ui-success)]" />
          <span>Use composables (useAuth, usePermissions) as the public API, not stores directly</span>
        </li>
        <li class="flex items-start gap-2">
          <UIcon name="i-heroicons-check-circle" class="mt-0.5 shrink-0 text-[var(--ui-success)]" />
          <span>Keep stores focused on a single concern (auth, location, period)</span>
        </li>
        <li class="flex items-start gap-2">
          <UIcon name="i-heroicons-check-circle" class="mt-0.5 shrink-0 text-[var(--ui-success)]" />
          <span>Use getters for derived state instead of computing in components</span>
        </li>
        <li class="flex items-start gap-2">
          <UIcon name="i-heroicons-x-circle" class="mt-0.5 shrink-0 text-[var(--ui-error)]" />
          <span>Don't store form data in global stores - use local refs</span>
        </li>
      </ul>
    </section>
  </div>
</template>
