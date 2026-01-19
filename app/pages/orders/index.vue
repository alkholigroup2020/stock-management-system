<script setup lang="ts">
/**
 * Orders Index Page
 *
 * Main page for the PRF/PO workflow with tabs for:
 * - PRFs (Purchase Requisition Forms)
 * - POs (Purchase Orders)
 * - Stock Reference (read-only stock levels for PRF creation)
 */

// SEO
useSeoMeta({
  title: "Orders - Stock Management System",
  description: "Manage purchase requisitions and purchase orders",
});

// Composables
const router = useRouter();
const route = useRoute();
const locationStore = useLocationStore();
const { canCreatePRF, canCreatePO, canViewPRFs, canViewPOs } = usePermissions();
const { isProcurementSpecialist } = useAuth();

// State
const activeTab = ref("prfs");

// Sync tab from URL query
onMounted(() => {
  const tab = route.query.tab as string;
  if (tab && ["prfs", "pos", "stock"].includes(tab)) {
    activeTab.value = tab;
  }
});

// Watch tab changes and update URL
watch(activeTab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } });
});

// Computed
const activeLocation = computed(() => locationStore.activeLocation);

// Tab items configuration
const tabItems = computed(() => {
  const items: { value: string; label: string; icon: string }[] = [];

  if (canViewPRFs()) {
    items.push({
      value: "prfs",
      label: "Purchase Requisitions",
      icon: "i-lucide-file-text",
    });
  }

  if (canViewPOs()) {
    items.push({
      value: "pos",
      label: "Purchase Orders",
      icon: "i-lucide-shopping-cart",
    });
  }

  // Stock reference tab - not for procurement specialists
  if (!isProcurementSpecialist.value) {
    items.push({
      value: "stock",
      label: "Stock Reference",
      icon: "i-lucide-package",
    });
  }

  return items;
});

// Navigation handlers
function goToNewPRF() {
  router.push("/orders/prfs/create");
}

function goToNewPO() {
  router.push("/orders/pos/create");
}
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-clipboard-list" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl sm:text-3xl font-bold text-primary">Orders</h1>
            <UBadge
              v-if="activeLocation"
              color="primary"
              variant="soft"
              size="md"
              class="hidden sm:inline-flex items-center gap-1"
            >
              <UIcon name="i-lucide-map-pin" class="h-3 w-3" />
              {{ activeLocation.name }}
            </UBadge>
          </div>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Manage purchase requisitions and purchase orders
          </p>
          <!-- Mobile location badge (smaller, below title) -->
          <UBadge
            v-if="activeLocation"
            color="primary"
            variant="soft"
            size="sm"
            class="sm:hidden inline-flex items-center gap-1 mt-1"
          >
            <UIcon name="i-lucide-map-pin" class="h-3 w-3" />
            {{ activeLocation.name }}
          </UBadge>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <!-- New PRF Button -->
        <UButton
          v-if="canCreatePRF() && activeTab === 'prfs'"
          color="primary"
          icon="i-lucide-plus"
          size="lg"
          class="cursor-pointer rounded-full px-3 sm:px-6"
          @click="goToNewPRF"
        >
          <span class="hidden sm:inline">New PRF</span>
          <span class="sm:hidden">New</span>
        </UButton>

        <!-- New PO Button -->
        <UButton
          v-if="canCreatePO() && activeTab === 'pos'"
          color="primary"
          icon="i-lucide-plus"
          size="lg"
          class="cursor-pointer rounded-full px-3 sm:px-6"
          @click="goToNewPO"
        >
          <span class="hidden sm:inline">New PO</span>
          <span class="sm:hidden">New</span>
        </UButton>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="border-b border-[var(--ui-border)]">
      <nav class="flex gap-1" aria-label="Orders tabs">
        <button
          v-for="tab in tabItems"
          :key="tab.value"
          type="button"
          class="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors"
          :class="[
            activeTab === tab.value
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-default hover:border-default/50',
          ]"
          @click="activeTab = tab.value"
        >
          <UIcon :name="tab.icon" class="w-4 h-4" />
          <span class="hidden sm:inline">{{ tab.label }}</span>
          <span class="sm:hidden">
            {{ tab.value === "prfs" ? "PRFs" : tab.value === "pos" ? "POs" : "Stock" }}
          </span>
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <!-- PRFs Tab Content -->
    <UCard v-if="activeTab === 'prfs'" class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
      <div class="text-center py-12">
        <UIcon name="i-lucide-file-text" class="w-16 h-16 mx-auto text-muted mb-4" />
        <h3 class="text-lg font-medium text-default mb-2">Purchase Requisitions</h3>
        <p class="text-muted mb-6">PRF list and management will be implemented in User Story 1.</p>
        <UButton
          v-if="canCreatePRF()"
          color="primary"
          icon="i-lucide-plus"
          class="cursor-pointer"
          @click="goToNewPRF"
        >
          Create New PRF
        </UButton>
      </div>
    </UCard>

    <!-- POs Tab Content -->
    <UCard v-else-if="activeTab === 'pos'" class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
      <div class="text-center py-12">
        <UIcon name="i-lucide-shopping-cart" class="w-16 h-16 mx-auto text-muted mb-4" />
        <h3 class="text-lg font-medium text-default mb-2">Purchase Orders</h3>
        <p class="text-muted mb-6">PO list and management will be implemented in User Story 3.</p>
        <UButton
          v-if="canCreatePO()"
          color="primary"
          icon="i-lucide-plus"
          class="cursor-pointer"
          @click="goToNewPO"
        >
          Create New PO
        </UButton>
      </div>
    </UCard>

    <!-- Stock Reference Tab Content -->
    <UCard v-else-if="activeTab === 'stock'" class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
      <div class="text-center py-12">
        <UIcon name="i-lucide-package" class="w-16 h-16 mx-auto text-muted mb-4" />
        <h3 class="text-lg font-medium text-default mb-2">Stock Reference</h3>
        <p class="text-muted mb-6">
          View current stock levels to help with PRF creation. This is a read-only reference.
        </p>
        <p class="text-sm text-muted">Stock reference table will be implemented in User Story 1.</p>
      </div>
    </UCard>
  </div>
</template>
