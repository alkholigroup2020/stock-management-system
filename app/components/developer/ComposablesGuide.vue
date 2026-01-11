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
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Composables Guide</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        12 auto-imported composables for common functionality
      </p>
    </div>

    <!-- Auth Section -->
    <section
      id="dev-section-auth"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('auth')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-finger-print" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">useAuth</span>
        </span>
        <UIcon
          :name="isExpanded('auth') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('auth')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Provides authentication state and role checking:
        </p>

        <pre
          class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
        ><code>const {
  user,           // Current user object
  isAuthenticated,// Boolean - logged in?
  isAdmin,        // Boolean - admin role?
  isSupervisor,   // Boolean - supervisor role?
  isOperator,     // Boolean - operator role?
  login,          // (credentials) => Promise
  logout,         // () => Promise
  refreshSession  // () => Promise
} = useAuth();</code></pre>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Usage Example</h4>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>&lt;script setup&gt;
const { user, isAdmin } = useAuth();
&lt;/script&gt;

&lt;template&gt;
  &lt;div v-if="isAdmin"&gt;Admin Panel&lt;/div&gt;
  &lt;p&gt;Welcome, &#123;&#123; user?.name &#125;&#125;&lt;/p&gt;
&lt;/template&gt;</code></pre>
        </div>
      </div>
    </section>

    <!-- Permissions Section -->
    <section
      id="dev-section-permissions"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('permissions')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-shield-check" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">usePermissions</span>
        </span>
        <UIcon
          :name="isExpanded('permissions') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('permissions')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Role-based permission checks for features:
        </p>

        <pre
          class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
        ><code>const permissions = usePermissions();

// Transaction permissions
permissions.canPostDeliveries()  // Operator, Supervisor, Admin
permissions.canPostIssues()      // Operator, Supervisor, Admin
permissions.canCreateTransfer()  // Operator, Supervisor, Admin
permissions.canApproveTransfers()// Supervisor, Admin

// Management permissions
permissions.canManageUsers()     // Admin only
permissions.canManageItems()     // Admin only
permissions.canManageLocations() // Admin only
permissions.canManageSuppliers() // Admin only

// Period permissions
permissions.canClosePeriod()     // Admin only
permissions.canViewStock()       // All roles</code></pre>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Usage in Navigation</h4>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>&lt;li v-if="permissions.canManageUsers()"&gt;
  &lt;NuxtLink to="/users"&gt;Users&lt;/NuxtLink&gt;
&lt;/li&gt;</code></pre>
        </div>
      </div>
    </section>

    <!-- Toast Section -->
    <section
      id="dev-section-toast"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('toast')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-bell" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">useAppToast</span>
        </span>
        <UIcon
          :name="isExpanded('toast') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('toast')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">Toast notification system with semantic colors:</p>

        <pre
          class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
        ><code>const toast = useAppToast();

toast.showSuccess("Item created successfully");
toast.showError("Failed to save changes");
toast.showWarning("Connection unstable");
toast.showInfo("New version available");</code></pre>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>Uses Nuxt UI toast component under the hood. Toasts auto-dismiss after 5 seconds.</span>
          </p>
        </div>
      </div>
    </section>

    <!-- Error Section -->
    <section
      id="dev-section-error"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('error')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-exclamation-circle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">useErrorHandler</span>
        </span>
        <UIcon
          :name="isExpanded('error') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('error')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">Centralized error handling with user-friendly messages:</p>

        <pre
          class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
        ><code>const { handleError } = useErrorHandler();

try {
  await $fetch("/api/items", { method: "POST", body });
} catch (err) {
  // Extracts message, maps error codes, shows toast
  handleError(err, "Failed to create item");
}</code></pre>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Error Code Mapping</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li><code>INSUFFICIENT_STOCK</code> → "Not enough stock available"</li>
            <li><code>LOCATION_ACCESS_DENIED</code> → "You don't have access to this location"</li>
            <li><code>PERIOD_CLOSED</code> → "Cannot modify a closed period"</li>
            <li><code>VALIDATION_ERROR</code> → Shows specific field errors</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Offline Section -->
    <section
      id="dev-section-offline"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('offline')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-wifi" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            useOnlineStatus & useOfflineGuard
          </span>
        </span>
        <UIcon
          :name="isExpanded('offline') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('offline')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">Handle offline scenarios gracefully:</p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">useOnlineStatus</h4>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>const { isOnline } = useOnlineStatus();

&lt;UButton :disabled="!isOnline" label="Save" /&gt;
&lt;OfflineBanner v-if="!isOnline" /&gt;</code></pre>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">useOfflineGuard</h4>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>const { guardAction } = useOfflineGuard();

const handleSave = () => {
  guardAction(async () => {
    await saveData();
  });
  // Shows warning toast if offline
};</code></pre>
        </div>
      </div>
    </section>

    <!-- Cache Section -->
    <section
      id="dev-section-cache"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('cache')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-archive-box" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">useCache</span>
        </span>
        <UIcon
          :name="isExpanded('cache') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('cache')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">Client-side caching for master data:</p>

        <pre
          class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
        ><code>const cache = useCache();

// Get cached data
const items = cache.getCached&lt;Item[]&gt;("items");

// Set cached data with TTL
cache.setCached("items", itemsData, 5 * 60 * 1000); // 5 min

// Invalidate cache
cache.invalidate("items");</code></pre>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              Used internally by useItems, useSuppliers, and useLocations to reduce API calls.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- API Section -->
    <section
      id="dev-section-api"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('api')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-cloud" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">API Composables</span>
        </span>
        <UIcon
          :name="isExpanded('api') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('api')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Composables for master data operations:
        </p>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--ui-border)] text-sm">
            <thead class="bg-[var(--ui-bg-muted)]">
              <tr>
                <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                  Composable
                </th>
                <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                  Methods
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--ui-border)]">
              <tr>
                <td class="px-4 py-2 font-medium">useItems</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">
                  fetchAll, fetchById, create, update, delete
                </td>
              </tr>
              <tr>
                <td class="px-4 py-2 font-medium">useSuppliers</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">
                  fetchAll, fetchById, create, update, delete
                </td>
              </tr>
              <tr>
                <td class="px-4 py-2 font-medium">useLocations</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">
                  fetchAll, fetchById, create, update, delete
                </td>
              </tr>
              <tr>
                <td class="px-4 py-2 font-medium">useCurrentPeriod</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">
                  period (ref), loading, error, refresh
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Usage Example</h4>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>const { fetchAll, create } = useItems();

// Fetch all items (cached)
const items = await fetchAll();

// Create new item
const newItem = await create({
  code: "ITM001",
  name: "New Item",
  unit: "KG",
  category: "FOOD"
});</code></pre>
        </div>
      </div>
    </section>
  </div>
</template>
