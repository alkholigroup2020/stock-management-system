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
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Component Patterns</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Naming conventions, page structure, and reusable components
      </p>
    </div>

    <!-- Naming Section -->
    <section
      id="dev-section-naming"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('naming')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-tag" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Component Naming</span>
        </span>
        <UIcon
          :name="isExpanded('naming') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('naming')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Nuxt 4 auto-imports components. Subdirectory names become part of the component name:
        </p>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--ui-border)] text-sm">
            <thead class="bg-[var(--ui-bg-muted)]">
              <tr>
                <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                  File Path
                </th>
                <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                  Component Name
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--ui-border)]">
              <tr>
                <td class="px-4 py-2">
                  <code class="text-xs">components/layout/AppNavbar.vue</code>
                </td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">
                  <code class="text-xs">&lt;LayoutAppNavbar /&gt;</code>
                </td>
              </tr>
              <tr>
                <td class="px-4 py-2">
                  <code class="text-xs">components/delivery/LineItem.vue</code>
                </td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">
                  <code class="text-xs">&lt;DeliveryLineItem /&gt;</code>
                </td>
              </tr>
              <tr>
                <td class="px-4 py-2">
                  <code class="text-xs">components/ui/form/Input.vue</code>
                </td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">
                  <code class="text-xs">&lt;UiFormInput /&gt;</code>
                </td>
              </tr>
              <tr>
                <td class="px-4 py-2"><code class="text-xs">components/Footer.vue</code></td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">
                  <code class="text-xs">&lt;Footer /&gt;</code>
                  (root = no prefix)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              Components in the root <code>/app/components/</code> directory don't get a prefix.
              Nested directories add their folder name as a prefix.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Pages Section -->
    <section
      id="dev-section-pages"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('pages')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-text" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Pages Overview</span>
        </span>
        <UIcon
          :name="isExpanded('pages') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('pages')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          <strong>43 pages</strong> implemented, organized by feature:
        </p>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Core</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>/</code> - Dashboard</li>
              <li><code>/login</code> - Authentication</li>
              <li><code>/profile</code> - User profile</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Transactions</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>/deliveries</code> - List, create, view, edit (4 pages)</li>
              <li><code>/issues</code> - List, create, view (3 pages)</li>
              <li><code>/transfers</code> - List, create, view (3 pages)</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Stock & Periods</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>/stock-now</code> - Current inventory</li>
              <li><code>/periods</code> - List, view, prices (3 pages)</li>
              <li><code>/period-close</code> - Admin period close</li>
              <li><code>/reconciliations</code> - List, consolidated (2 pages)</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Master Data</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>/items</code> - List, create, view, edit (4 pages)</li>
              <li><code>/locations</code> - List, create, view, edit (4 pages)</li>
              <li><code>/suppliers</code> - List, create, view (3 pages)</li>
              <li><code>/users</code> - List, create, view, edit (4 pages)</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Other</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>/ncrs</code> - Non-Conformance Reports (3 pages)</li>
              <li><code>/pob</code> - Personnel On Board entry</li>
              <li><code>/reports</code> - Stock, deliveries, issues, reconciliation (4 pages)</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Component List Section -->
    <section
      id="dev-section-list"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('list')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-rectangle-group" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Component Categories</span>
        </span>
        <UIcon
          :name="isExpanded('list') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('list')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          <strong>39 custom components</strong> organized by feature:
        </p>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Layout (6)</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>PageHeader</code> - Page title with actions</li>
              <li><code>HierarchicalNav</code> - Sidebar navigation</li>
              <li><code>LocationSwitcher</code> - Location dropdown</li>
              <li><code>PeriodIndicator</code> - Current period display</li>
              <li><code>HelpDrawer</code> - Help center drawer</li>
              <li><code>PageLoadingOverlay</code> - Loading state</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Dashboard (2)</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>MetricCard</code> - KPI cards with icons</li>
              <li><code>RecentActivity</code> - Recent transactions list</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Forms & Data (6)</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>TransferForm</code> - Multi-line transfer form</li>
              <li><code>POBTable</code> - Editable POB entry table</li>
              <li><code>AdjustmentsForm</code> - Stock adjustments</li>
              <li><code>POBSummary</code> - POB totals summary</li>
              <li><code>ReconciliationSummary</code> - Reconciliation display</li>
              <li><code>ConfirmModal</code> - Confirmation dialog</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Status & Feedback (5)</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>ErrorAlert</code> - Error/warning messages</li>
              <li><code>LoadingSpinner</code> - Loading indicator</li>
              <li><code>LoadingOverlay</code> - Full-screen loading</li>
              <li><code>EmptyState</code> - No data state</li>
              <li><code>OfflineBanner</code> - Offline indicator</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Approval (4)</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>ApprovalRequest</code> - Approval card</li>
              <li><code>ApprovalStatus</code> - Status badge</li>
              <li><code>ApprovalActions</code> - Approve/reject buttons</li>
              <li><code>TransferStatusBadge</code> - Transfer status</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Entity Cards (2)</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>LocationCard</code> - Location display</li>
              <li><code>UserCard</code> - User display</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Patterns Section -->
    <section
      id="dev-section-patterns"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('patterns')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-square-3-stack-3d" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Common Patterns</span>
        </span>
        <UIcon
          :name="isExpanded('patterns') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('patterns')" class="space-y-4 p-4">
        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">PageHeader Pattern</h4>
          <p class="mb-2 text-sm text-[var(--ui-text-muted)]">
            Use for page titles with optional action buttons:
          </p>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>&lt;LayoutPageHeader title="Items" icon="i-heroicons-cube"&gt;
  &lt;template #actions&gt;
    &lt;UButton
      label="New Item"
      icon="i-heroicons-plus"
      class="cursor-pointer"
      @click="goToCreate"
    /&gt;
  &lt;/template&gt;
&lt;/LayoutPageHeader&gt;</code></pre>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">EmptyState Pattern</h4>
          <p class="mb-2 text-sm text-[var(--ui-text-muted)]">Use when there's no data to display:</p>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>&lt;EmptyState
  v-if="items.length === 0"
  icon="i-heroicons-inbox"
  title="No items yet"
  description="Create your first item to get started"
  action-label="Create Item"
  @action="goToCreate"
/&gt;</code></pre>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Loading State Pattern</h4>
          <p class="mb-2 text-sm text-[var(--ui-text-muted)]">Use LoadingSpinner during data fetch:</p>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>&lt;LoadingSpinner v-if="loading" text="Loading items..." /&gt;
&lt;ErrorAlert v-else-if="error" :message="error" @retry="fetchData" /&gt;
&lt;div v-else&gt;
  &lt;!-- Content --&gt;
&lt;/div&gt;</code></pre>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">ConfirmModal Pattern</h4>
          <p class="mb-2 text-sm text-[var(--ui-text-muted)]">Use for destructive actions:</p>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>&lt;UiConfirmModal
  v-model="showDeleteModal"
  title="Delete Item"
  message="Are you sure? This cannot be undone."
  variant="danger"
  confirm-label="Delete"
  @confirm="handleDelete"
/&gt;</code></pre>
        </div>
      </div>
    </section>
  </div>
</template>
