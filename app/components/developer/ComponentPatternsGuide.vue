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
  namingConventions: `// Nuxt 4 Component Auto-Import Naming Convention
// Components in subdirectories combine: folder path + filename

// Directory: app/components/layout/AppNavbar.vue
// Usage: <LayoutAppNavbar />

// Directory: app/components/delivery/LineItem.vue
// Usage: <DeliveryLineItem />

// Directory: app/components/ui/form/Input.vue
// Usage: <UiFormInput />

// Root /app/components/ needs no prefix:
// Directory: app/components/Footer.vue
// Usage: <Footer />

// Directory: app/components/EmptyState.vue
// Usage: <EmptyState />`,

  folderStructure: `// Component Directory Structure
app/components/
├── EmptyState.vue          // <EmptyState />
├── ErrorAlert.vue          // <ErrorAlert />
├── LoadingSpinner.vue      // <LoadingSpinner />
├── LoadingOverlay.vue      // <LoadingOverlay />
├── OfflineBanner.vue       // <OfflineBanner />
│
├── layout/                 // Layout components
│   ├── PageHeader.vue      // <LayoutPageHeader />
│   ├── LocationSwitcher.vue// <LayoutLocationSwitcher />
│   ├── PeriodIndicator.vue // <LayoutPeriodIndicator />
│   └── HierarchicalNav.vue // <LayoutHierarchicalNav />
│
├── ui/                     // Reusable UI components
│   └── ConfirmModal.vue    // <UiConfirmModal />
│
├── dashboard/              // Dashboard-specific
│   ├── MetricCard.vue      // <DashboardMetricCard />
│   └── RecentActivity.vue  // <DashboardRecentActivity />
│
├── location/               // Location-specific
│   └── LocationCard.vue    // <LocationLocationCard />
│
├── transfer/               // Transfer-specific
│   ├── TransferForm.vue    // <TransferTransferForm />
│   ├── TransferStatusBadge.vue // <TransferTransferStatusBadge />
│   └── ApprovalActions.vue // <TransferApprovalActions />
│
├── pob/                    // POB-specific
│   ├── POBTable.vue        // <PobPOBTable />
│   └── POBSummary.vue      // <PobPOBSummary />
│
└── reconciliation/         // Reconciliation-specific
    ├── AdjustmentsForm.vue // <ReconciliationAdjustmentsForm />
    └── ReconciliationSummary.vue // <ReconciliationReconciliationSummary />`,

  pageHeaderUsage: `// PageHeader Component - Standard page header with location/period context
<script setup lang="ts">
// PageHeader automatically pulls location/period from stores
<\/script>

<template>
  <LayoutPageHeader
    title="Deliveries"
    subtitle="Manage incoming stock from suppliers"
    icon="i-lucide-truck"
    :show-location="true"
    :show-period="true"
    location-scope="current"
  >
    <template #actions>
      <UButton
        icon="i-lucide-plus"
        color="primary"
        class="cursor-pointer"
        @click="createDelivery"
      >
        New Delivery
      </UButton>
    </template>
  </LayoutPageHeader>
</template>`,

  pageHeaderProps: `// PageHeader Props Interface
interface Props {
  title: string;               // Page title (required)
  subtitle?: string;           // Optional subtitle
  icon?: string;               // Optional icon (lucide format)
  showLocation?: boolean;      // Show location badge (default: true)
  showPeriod?: boolean;        // Show period badge (default: true)
  locationScope?: "current" | "all" | "none"; // Location display mode
}

// Location scope options:
// "current" - Shows active location name (e.g., "Kitchen")
// "all" - Shows "All Locations" text
// "none" - Hides location display`,

  locationSwitcherPattern: `// LocationSwitcher - Dropdown for switching active location
<script setup lang="ts">
const locationStore = useLocationStore();
const toast = useAppToast();

// Dropdown items with location-specific icons
const locationItems = computed(() => {
  return [
    locationStore.userLocations.map((location) => ({
      label: location.name,
      icon: getLocationIcon(location.type),
      active: location.id === locationStore.activeLocationId,
      onSelect: async () => {
        if (location.id === locationStore.activeLocationId) return;

        const success = await locationStore.switchLocation(location.id);
        if (success) {
          toast.success("Location Changed", {
            description: \`Switched to \${location.name}\`,
          });
          await refreshNuxtData(); // Refresh page data
        }
      },
    })),
  ];
});

// Location type to icon mapping
const getLocationIcon = (type: string) => {
  const icons = {
    KITCHEN: "i-lucide-chef-hat",
    STORE: "i-lucide-store",
    CENTRAL: "i-lucide-warehouse",
    WAREHOUSE: "i-lucide-package-2",
  };
  return icons[type] || "i-lucide-map-pin";
};
<\/script>`,

  emptyStateUsage: `// EmptyState - Friendly empty state with icon, title, description
<template>
  <!-- Basic usage -->
  <EmptyState
    title="No items found"
    description="Create your first item to get started."
    icon="i-heroicons-inbox"
  />

  <!-- With action button -->
  <EmptyState
    title="No deliveries yet"
    description="Record your first delivery to start tracking inventory."
    icon="i-lucide-truck"
    :show-action="true"
    action-text="Create Delivery"
    action-icon="i-lucide-plus"
    @action="createDelivery"
  />

  <!-- With custom slot -->
  <EmptyState title="No results" description="Try adjusting your search.">
    <template #action>
      <UButton variant="outline" @click="clearFilters">
        Clear Filters
      </UButton>
    </template>
  </EmptyState>
</template>`,

  emptyStateProps: `// EmptyState Props Interface
interface Props {
  icon?: string;                // Icon to display (default: "i-heroicons-inbox")
  title?: string;               // Title text (default: "No data available")
  description?: string;         // Description text
  showAction?: boolean;         // Show action button (default: false)
  actionText?: string;          // Action button text
  actionIcon?: string;          // Action button icon
  actionColor?: "primary" | "secondary" | "success" | "error" | "neutral";
  actionVariant?: "solid" | "outline" | "soft" | "ghost";
  size?: "sm" | "md" | "lg";    // Size variant
  padding?: "sm" | "md" | "lg"; // Padding size
}

// Emits
const emit = defineEmits<{
  action: [];  // Emitted when action button clicked
}>();`,

  errorAlertUsage: `// ErrorAlert - Display error, warning, info, or success messages
<template>
  <!-- Error alert -->
  <ErrorAlert
    type="error"
    title="Failed to save"
    description="Unable to save changes. Please try again."
    :show-retry="true"
    @retry="handleRetry"
  />

  <!-- Warning alert -->
  <ErrorAlert
    type="warning"
    title="Period closing soon"
    description="Complete all transactions before the period closes."
    :dismissible="true"
  />

  <!-- Success alert -->
  <ErrorAlert
    type="success"
    title="Saved successfully"
    description="Your changes have been saved."
  />

  <!-- Info alert -->
  <ErrorAlert
    type="info"
    title="Stock low"
    description="5 items are below minimum stock levels."
  />

  <!-- With custom actions slot -->
  <ErrorAlert type="error" title="Connection lost">
    <template #actions>
      <UButton size="xs" @click="reconnect">Reconnect</UButton>
      <UButton size="xs" variant="ghost" @click="dismiss">Dismiss</UButton>
    </template>
  </ErrorAlert>
</template>`,

  errorAlertProps: `// ErrorAlert Props Interface
interface Props {
  type?: "error" | "warning" | "info" | "success";  // Alert type
  title?: string;              // Alert title
  description?: string;        // Alert description/message
  icon?: string;               // Custom icon (overrides type default)
  variant?: "solid" | "outline" | "soft" | "subtle";
  dismissible?: boolean;       // Allow user to dismiss (default: false)
  showRetry?: boolean;         // Show retry button (default: false)
  retryText?: string;          // Retry button text (default: "Retry")
  customClass?: string;        // Custom CSS classes
}

// Emits
const emit = defineEmits<{
  dismiss: [];  // Emitted when dismissed
  retry: [];    // Emitted when retry clicked
}>();`,

  loadingSpinnerUsage: `// LoadingSpinner - Animated loading indicator
<template>
  <!-- Basic spinner -->
  <LoadingSpinner />

  <!-- With loading text -->
  <LoadingSpinner text="Loading data..." />

  <!-- Larger size -->
  <LoadingSpinner size="lg" text="Please wait..." />

  <!-- Full screen overlay -->
  <LoadingSpinner size="xl" text="Initializing..." :full-screen="true" />

  <!-- Different colors -->
  <LoadingSpinner color="primary" />
  <LoadingSpinner color="neutral" />
</template>`,

  loadingSpinnerProps: `// LoadingSpinner Props Interface
interface Props {
  text?: string;               // Loading text to display
  size?: "sm" | "md" | "lg" | "xl";  // Spinner size
  color?: "primary" | "secondary" | "neutral";  // Color variant
  fullScreen?: boolean;        // Display as full screen overlay
  centerContent?: boolean;     // Center vertically/horizontally
  icon?: string;               // Custom icon (default: arrow-path)
}

// Size classes mapping
const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};`,

  confirmModalUsage: `// ConfirmModal - Confirmation dialog with variants
<script setup lang="ts">
const showDeleteModal = ref(false);
const deleting = ref(false);

const handleDelete = async () => {
  deleting.value = true;
  try {
    await deleteItem();
    showDeleteModal.value = false;
  } finally {
    deleting.value = false;
  }
};
<\/script>

<template>
  <!-- Danger variant for destructive actions -->
  <UiConfirmModal
    v-model="showDeleteModal"
    title="Delete Item"
    message="Are you sure? This action cannot be undone."
    confirm-text="Delete"
    cancel-text="Cancel"
    loading-text="Deleting..."
    :loading="deleting"
    variant="danger"
    @confirm="handleDelete"
    @cancel="showDeleteModal = false"
  />

  <!-- Warning variant -->
  <UiConfirmModal
    v-model="showWarningModal"
    title="Close Period"
    message="All transactions will be finalized."
    variant="warning"
    @confirm="closePeriod"
  />

  <!-- Info variant -->
  <UiConfirmModal
    v-model="showInfoModal"
    title="Confirm Transfer"
    message="Stock will be moved to the destination location."
    variant="info"
    @confirm="approveTransfer"
  />
</template>`,

  confirmModalProps: `// ConfirmModal Props Interface
interface Props {
  modelValue: boolean;         // v-model for open state
  title: string;               // Modal title
  message: string;             // Confirmation message
  confirmText?: string;        // Confirm button text (default: "Confirm")
  cancelText?: string;         // Cancel button text (default: "Cancel")
  loadingText?: string;        // Text during loading (default: "Processing...")
  loading?: boolean;           // Loading state
  variant?: "danger" | "warning" | "info" | "success";  // Color variant
}

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: boolean];  // v-model support
  confirm: [];   // Emitted when confirmed
  cancel: [];    // Emitted when cancelled
}>();`,

  statusBadgePattern: `// Status Badge Pattern - Semantic color mapping
<script setup lang="ts">
interface TransferStatusBadgeProps {
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "COMPLETED";
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "soft" | "outline" | "subtle";
}

const props = withDefaults(defineProps<TransferStatusBadgeProps>(), {
  size: "md",
  variant: "soft",
});

// Map status to semantic color
const statusColor = computed(() => {
  const colorMap = {
    DRAFT: "neutral" as const,
    PENDING_APPROVAL: "primary" as const,
    APPROVED: "success" as const,
    REJECTED: "error" as const,
    COMPLETED: "success" as const,
  };
  return colorMap[props.status] || "neutral";
});

// Map status to user-friendly label
const statusLabel = computed(() => {
  const labelMap = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Pending Approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    COMPLETED: "Completed",
  };
  return labelMap[props.status] || props.status;
});

// Map status to icon
const statusIcon = computed(() => {
  const iconMap = {
    DRAFT: "i-lucide-file-edit",
    PENDING_APPROVAL: "i-lucide-clock",
    APPROVED: "i-lucide-check-circle",
    REJECTED: "i-lucide-x-circle",
    COMPLETED: "i-lucide-check-circle-2",
  };
  return iconMap[props.status];
});
<\/script>

<template>
  <UBadge :color="statusColor" :variant="variant" :size="size">
    <div class="flex items-center gap-1.5">
      <UIcon v-if="statusIcon" :name="statusIcon" class="h-3.5 w-3.5" />
      <span>{{ statusLabel }}</span>
    </div>
  </UBadge>
</template>`,

  metricCardPattern: `// MetricCard - Dashboard KPI display
<script setup lang="ts">
interface Props {
  label: string;               // Metric label
  value: string | number;      // Metric value
  icon?: string;               // Lucide icon name (without prefix)
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "neutral";
  loading?: boolean;           // Show loading spinner
  trend?: {                    // Optional trend indicator
    value: number;
    direction: "up" | "down";
  };
}

const props = withDefaults(defineProps<Props>(), {
  color: "primary",
  loading: false,
});

// Map color to background/text classes
const colorClasses = computed(() => {
  const classes = {
    primary: "bg-navy-50 dark:bg-navy-900/20 text-navy-600 dark:text-navy-400",
    success: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
    error: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
    neutral: "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  };
  return classes[props.color];
});
<\/script>

<template>
  <UCard :ui="{ body: 'p-3 sm:p-4' }">
    <div v-if="loading" class="flex items-center justify-center h-24">
      <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin" />
    </div>
    <div v-else class="flex items-center gap-4">
      <div v-if="icon" class="shrink-0 p-3 rounded-lg" :class="colorClasses">
        <UIcon :name="'i-lucide-' + icon" class="w-6 h-6" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm text-muted">{{ label }}</p>
        <p class="text-2xl font-bold truncate">{{ value }}</p>
      </div>
    </div>
  </UCard>
</template>`,

  propsPattern: `// TypeScript Props Pattern with withDefaults
<script setup lang="ts">
// Define props interface
interface Props {
  // Required props (no ? suffix)
  title: string;

  // Optional props with explicit types
  subtitle?: string;
  icon?: string;

  // Union types for constrained values
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "error";
  variant?: "solid" | "outline" | "soft" | "ghost";

  // Boolean props (default to false by convention)
  loading?: boolean;
  disabled?: boolean;

  // Complex object props
  item?: {
    id: string;
    name: string;
    status: string;
  };

  // Array props
  items?: string[];
}

// Use withDefaults for default values
const props = withDefaults(defineProps<Props>(), {
  size: "md",
  color: "primary",
  variant: "solid",
  loading: false,
  disabled: false,
  items: () => [],  // Use factory for arrays/objects
});

// Access props in script
console.log(props.title);       // string
console.log(props.size);        // "sm" | "md" | "lg"
console.log(props.loading);     // boolean
<\/script>`,

  emitsPattern: `// TypeScript Emits Pattern
<script setup lang="ts">
// Simple emits with payload types
const emit = defineEmits<{
  // No payload
  close: [];
  dismiss: [];

  // Single payload
  submit: [value: string];
  select: [id: string];

  // Multiple payloads
  update: [id: string, value: number];

  // Complex payload
  change: [item: { id: string; name: string }];

  // v-model pattern
  "update:modelValue": [value: boolean];
  "update:selected": [value: string[]];
}>();

// Emit events
const handleClose = () => {
  emit("close");
};

const handleSubmit = (value: string) => {
  emit("submit", value);
};

const handleUpdate = (id: string, value: number) => {
  emit("update", id, value);
};

// v-model emit pattern
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
<\/script>

<template>
  <button @click="emit('close')">Close</button>
  <input @input="emit('submit', ($event.target as HTMLInputElement).value)" />
</template>`,

  slotPattern: `// Slot Patterns
<script setup lang="ts">
// Define slot types for type safety (optional but recommended)
defineSlots<{
  default(): unknown;
  header(): unknown;
  actions(): unknown;
  footer(): unknown;
}());
<\/script>

<template>
  <div class="card">
    <!-- Named slot with fallback -->
    <div class="card-header">
      <slot name="header">
        <h3>Default Header</h3>
      </slot>
    </div>

    <!-- Default slot -->
    <div class="card-body">
      <slot />
    </div>

    <!-- Conditional slot rendering -->
    <div v-if="$slots.actions" class="card-actions">
      <slot name="actions" />
    </div>

    <!-- Named slot with props (scoped slot) -->
    <div class="card-footer">
      <slot name="footer" :loading="loading" :error="error">
        <p v-if="error">{{ error }}</p>
        <p v-else-if="loading">Loading...</p>
      </slot>
    </div>
  </div>
</template>`,

  scopedSlotPattern: `// Scoped Slots - Passing data to slot content
<script setup lang="ts">
interface Item {
  id: string;
  name: string;
  status: string;
}

const props = defineProps<{
  items: Item[];
}>();

// Define slots with typed props
defineSlots<{
  item(props: { item: Item; index: number }): unknown;
  empty(): unknown;
}());
<\/script>

<template>
  <ul v-if="items.length > 0">
    <li v-for="(item, index) in items" :key="item.id">
      <!-- Pass data to slot -->
      <slot name="item" :item="item" :index="index">
        <!-- Fallback content -->
        {{ item.name }}
      </slot>
    </li>
  </ul>
  <div v-else>
    <slot name="empty">
      <EmptyState title="No items found" />
    </slot>
  </div>
</template>

<!-- Usage -->
<ItemList :items="items">
  <template #item="{ item, index }">
    <div class="flex items-center gap-2">
      <span>{{ index + 1 }}.</span>
      <span>{{ item.name }}</span>
      <UBadge>{{ item.status }}</UBadge>
    </div>
  </template>
  <template #empty>
    <EmptyState
      title="No items"
      description="Create your first item"
      :show-action="true"
      @action="createItem"
    />
  </template>
</ItemList>`,

  bestPractices: `// Component Best Practices Summary

// 1. File Naming
// - Use PascalCase for component files: PageHeader.vue, EmptyState.vue
// - Group by feature in subdirectories: /transfer/TransferForm.vue

// 2. Props
// - Always use TypeScript interfaces for props
// - Use withDefaults for default values
// - Use union types for constrained values ("sm" | "md" | "lg")
// - Prefix boolean props without "is" (loading, disabled, not isLoading)

// 3. Emits
// - Define all emits with TypeScript types
// - Use "update:modelValue" for v-model support
// - Emit events with descriptive names (submit, cancel, not onSubmit)

// 4. Slots
// - Provide fallback content for slots
// - Use $slots.name to conditionally render slot containers
// - Type scoped slot props with defineSlots

// 5. Styling
// - Use CSS variables for colors: var(--ui-primary)
// - Use semantic class names: text-muted, text-default
// - Always add cursor-pointer to clickable buttons
// - Use smooth-transition for hover effects

// 6. Composition
// - Keep components focused (single responsibility)
// - Extract reusable logic into composables
// - Use provide/inject sparingly for deep prop drilling`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Component Patterns</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Naming conventions, layout components, common UI patterns, and TypeScript best practices
      </p>
    </div>

    <!-- Naming Conventions Section -->
    <section
      id="dev-section-naming-conventions"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('naming-conventions')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-tag" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Naming Conventions</span>
        </span>
        <UIcon
          :name="
            isExpanded('naming-conventions') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('naming-conventions')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Nuxt 4 auto-imports components from
          <code class="code-inline">/app/components/</code>
          . Component names are derived from their directory path and filename.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Auto-Import Rules</h4>
          <DeveloperCodeBlock :code="codeExamples.namingConventions" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Folder Structure</h4>
          <DeveloperCodeBlock :code="codeExamples.folderStructure" language="plaintext" />
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Tip:</strong>
              Components at the root of
              <code class="code-inline">/app/components/</code>
              don't need a prefix. Subdirectory components combine folder path + filename.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Layout Components Section -->
    <section
      id="dev-section-layout-components"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('layout-components')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-squares-2x2" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Layout Components</span>
        </span>
        <UIcon
          :name="
            isExpanded('layout-components') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('layout-components')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Layout components provide consistent structure across pages. They integrate with Pinia
          stores for location and period context.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">PageHeader Usage</h4>
          <DeveloperCodeBlock
            :code="codeExamples.pageHeaderUsage"
            language="vue"
            filename="app/components/layout/PageHeader.vue"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">PageHeader Props</h4>
          <DeveloperCodeBlock :code="codeExamples.pageHeaderProps" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">LocationSwitcher</h4>
          <DeveloperCodeBlock
            :code="codeExamples.locationSwitcherPattern"
            language="typescript"
            filename="app/components/layout/LocationSwitcher.vue"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Available Layout Components</h4>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-document-text" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">PageHeader</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Title, subtitle, location/period context, action slot
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-map-pin" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">LocationSwitcher</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Dropdown to switch active location
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-calendar-days" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">PeriodIndicator</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Shows current period name, status, days remaining
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-bars-3-bottom-left" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">HierarchicalNav</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Sidebar navigation with nested menu items
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Common UI Components Section -->
    <section
      id="dev-section-common-components"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('common-components')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-cube" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Common UI Components</span>
        </span>
        <UIcon
          :name="
            isExpanded('common-components') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('common-components')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Reusable UI components for common patterns: empty states, error alerts, loading spinners,
          and confirmation modals.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">EmptyState</h4>
          <DeveloperCodeBlock
            :code="codeExamples.emptyStateUsage"
            language="vue"
            filename="app/components/EmptyState.vue"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">EmptyState Props</h4>
          <DeveloperCodeBlock :code="codeExamples.emptyStateProps" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">ErrorAlert</h4>
          <DeveloperCodeBlock
            :code="codeExamples.errorAlertUsage"
            language="vue"
            filename="app/components/ErrorAlert.vue"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">ErrorAlert Props</h4>
          <DeveloperCodeBlock :code="codeExamples.errorAlertProps" language="typescript" />
        </div>
      </div>
    </section>

    <!-- Loading States Section -->
    <section
      id="dev-section-loading-states"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('loading-states')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-path" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Loading States</span>
        </span>
        <UIcon
          :name="
            isExpanded('loading-states') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('loading-states')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Loading components provide visual feedback during async operations.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">LoadingSpinner</h4>
          <DeveloperCodeBlock
            :code="codeExamples.loadingSpinnerUsage"
            language="vue"
            filename="app/components/LoadingSpinner.vue"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">LoadingSpinner Props</h4>
          <DeveloperCodeBlock :code="codeExamples.loadingSpinnerProps" language="typescript" />
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Best Practice:</strong>
              Always provide loading feedback for operations that take more than 300ms. Use
              <code class="code-inline">:loading</code>
              prop on buttons during async actions.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Modal Components Section -->
    <section
      id="dev-section-modal-components"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('modal-components')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-window" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Modal Components</span>
        </span>
        <UIcon
          :name="
            isExpanded('modal-components') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('modal-components')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Modal components for confirmations and dialogs. Always use confirmation modals for
          destructive actions.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">ConfirmModal Usage</h4>
          <DeveloperCodeBlock
            :code="codeExamples.confirmModalUsage"
            language="vue"
            filename="app/components/ui/ConfirmModal.vue"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">ConfirmModal Props</h4>
          <DeveloperCodeBlock :code="codeExamples.confirmModalProps" language="typescript" />
        </div>

        <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-error)]">
            <UIcon name="i-heroicons-exclamation-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Critical:</strong>
              Always use confirmation modals for destructive actions (delete, reject, close period).
              Use the
              <code class="code-inline">variant="danger"</code>
              for delete operations.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Feature Components Section -->
    <section
      id="dev-section-feature-components"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('feature-components')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-puzzle-piece" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]"
            >Feature-Specific Components</span
          >
        </span>
        <UIcon
          :name="
            isExpanded('feature-components') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('feature-components')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Feature-specific components encapsulate domain logic. Common patterns include status
          badges, metric cards, and data cards.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Status Badge Pattern</h4>
          <DeveloperCodeBlock
            :code="codeExamples.statusBadgePattern"
            language="vue"
            filename="app/components/transfer/TransferStatusBadge.vue"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">MetricCard Pattern</h4>
          <DeveloperCodeBlock
            :code="codeExamples.metricCardPattern"
            language="vue"
            filename="app/components/dashboard/MetricCard.vue"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Feature Component Examples</h4>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-arrows-right-left" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]"
                  >TransferStatusBadge</span
                >
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Status badge with semantic colors and icons
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-chart-bar" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">MetricCard</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Dashboard KPI card with trend indicator
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-building-storefront" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]">LocationCard</span>
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Location display card with type-specific styling
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-calculator" class="text-[var(--ui-primary)]" />
                <span class="font-medium text-[var(--ui-text-highlighted)]"
                  >ReconciliationSummary</span
                >
              </div>
              <p class="mt-1 text-xs text-[var(--ui-text-muted)]">
                Stock movement summary with calculations
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Props Pattern Section -->
    <section
      id="dev-section-props-pattern"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('props-pattern')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-down-tray" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Props TypeScript Pattern</span>
        </span>
        <UIcon
          :name="isExpanded('props-pattern') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('props-pattern')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Use TypeScript interfaces with
          <code class="code-inline">defineProps</code>
          and
          <code class="code-inline">withDefaults</code>
          for type-safe props with sensible defaults.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Props Definition Pattern</h4>
          <DeveloperCodeBlock :code="codeExamples.propsPattern" language="typescript" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Props Best Practices</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                Use
                <code class="code-inline">interface Props</code>
                for all props definitions
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                Use union types for constrained values:
                <code class="code-inline">"sm" | "md" | "lg"</code>
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>Use factory functions for default arrays/objects</span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                Name boolean props without "is" prefix:
                <code class="code-inline">loading</code>
                not
                <code class="code-inline">isLoading</code>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Emits Pattern Section -->
    <section
      id="dev-section-emits-pattern"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('emits-pattern')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-up-tray" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]"
            >Emits TypeScript Pattern</span
          >
        </span>
        <UIcon
          :name="isExpanded('emits-pattern') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('emits-pattern')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Use TypeScript with
          <code class="code-inline">defineEmits</code>
          for type-safe event emissions. Define payload types for better IDE support.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Emits Definition Pattern</h4>
          <DeveloperCodeBlock :code="codeExamples.emitsPattern" language="typescript" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Emits Best Practices</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                Use descriptive event names:
                <code class="code-inline">submit</code>
                not
                <code class="code-inline">onSubmit</code>
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                Use
                <code class="code-inline">"update:modelValue"</code>
                for v-model support
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>Type all payloads, even empty ones with <code class="code-inline">[]</code></span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>Use computed get/set pattern for two-way binding</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Slot Patterns Section -->
    <section
      id="dev-section-slot-patterns"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('slot-patterns')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-rectangle-group" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Slot Patterns</span>
        </span>
        <UIcon
          :name="isExpanded('slot-patterns') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('slot-patterns')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Slots allow flexible component composition. Use named slots for structure and scoped slots
          for passing data to slot content.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Basic Slot Pattern</h4>
          <DeveloperCodeBlock :code="codeExamples.slotPattern" language="vue" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Scoped Slots Pattern</h4>
          <DeveloperCodeBlock :code="codeExamples.scopedSlotPattern" language="vue" />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Slot Best Practices</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>Provide fallback content for optional slots</span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                Use
                <code class="code-inline">$slots.name</code>
                to conditionally render slot containers
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                Use
                <code class="code-inline">defineSlots</code>
                for TypeScript slot typing
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>Name slots descriptively: <code class="code-inline">header</code>,
                <code class="code-inline">actions</code>,
                <code class="code-inline">footer</code></span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Best Practices Section -->
    <section
      id="dev-section-best-practices"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('best-practices')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-light-bulb" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Best Practices Summary</span>
        </span>
        <UIcon
          :name="
            isExpanded('best-practices') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('best-practices')" class="space-y-4 p-4">
        <DeveloperCodeBlock :code="codeExamples.bestPractices" language="typescript" />

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key Takeaways</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-[var(--ui-success)]/30 bg-[var(--ui-bg)] p-3">
              <h5 class="mb-2 flex items-center gap-2 font-medium text-[var(--ui-success)]">
                <UIcon name="i-heroicons-check-circle" />
                Do
              </h5>
              <ul class="space-y-1 text-xs text-[var(--ui-text-muted)]">
                <li>Use TypeScript interfaces for props</li>
                <li>Provide fallback content for slots</li>
                <li>Add cursor-pointer to buttons</li>
                <li>Use semantic color variables</li>
                <li>Keep components focused</li>
              </ul>
            </div>
            <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
              <h5 class="mb-2 flex items-center gap-2 font-medium text-[var(--ui-error)]">
                <UIcon name="i-heroicons-x-circle" />
                Don't
              </h5>
              <ul class="space-y-1 text-xs text-[var(--ui-text-muted)]">
                <li>Use any type for props</li>
                <li>Skip confirmation for destructive actions</li>
                <li>Forget loading states</li>
                <li>Hard-code colors</li>
                <li>Create overly complex components</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.code-inline {
  @apply rounded bg-[var(--ui-bg-muted)] px-1.5 py-0.5 font-mono text-xs;
}
</style>
