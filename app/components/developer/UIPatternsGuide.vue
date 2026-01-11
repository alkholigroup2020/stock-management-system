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
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">UI Patterns Guide</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Consistent patterns for cards, forms, tables, modals, and more
      </p>
    </div>

    <!-- Cards Section -->
    <section
      id="dev-section-cards"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('cards')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-rectangle-stack" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Card Patterns</span>
        </span>
        <UIcon
          :name="isExpanded('cards') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('cards')" class="space-y-4 p-4">
        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Elevated Card (Primary)</h4>
          <p class="mb-2 text-sm text-[var(--ui-text-muted)]">
            Use for main content areas with navy-tinted shadow:
          </p>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>&lt;UCard class="card-elevated"&gt;
  &lt;template #header&gt;
    &lt;h3 class="font-semibold"&gt;Card Title&lt;/h3&gt;
  &lt;/template&gt;
  &lt;!-- Content --&gt;
  &lt;template #footer&gt;
    &lt;div class="flex justify-end gap-2"&gt;
      &lt;UButton label="Cancel" color="neutral" /&gt;
      &lt;UButton label="Save" color="primary" /&gt;
    &lt;/div&gt;
  &lt;/template&gt;
&lt;/UCard&gt;</code></pre>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Muted Card (Secondary)</h4>
          <p class="mb-2 text-sm text-[var(--ui-text-muted)]">Use for secondary content or info boxes:</p>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>&lt;div class="card-muted rounded-lg p-4"&gt;
  &lt;!-- Secondary content --&gt;
&lt;/div&gt;</code></pre>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              Always use <code>rounded-xl</code> for cards and <code>rounded-lg</code> for inner
              elements.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Forms Section -->
    <section
      id="dev-section-forms"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('forms')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-text" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Form Patterns</span>
        </span>
        <UIcon
          :name="isExpanded('forms') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('forms')" class="space-y-4 p-4">
        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Two-Column Layout</h4>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>&lt;div class="grid gap-4 md:grid-cols-2"&gt;
  &lt;div&gt;
    &lt;label class="form-label"&gt;Item Name&lt;/label&gt;
    &lt;UInput v-model="name" placeholder="Enter name" /&gt;
  &lt;/div&gt;
  &lt;div&gt;
    &lt;label class="form-label"&gt;Category&lt;/label&gt;
    &lt;USelectMenu v-model="category" :options="categories" /&gt;
  &lt;/div&gt;
&lt;/div&gt;</code></pre>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Form Field Classes</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>
              <code>form-label</code> - Label styling (small, muted, medium weight)
            </li>
            <li>
              <code>form-input</code> - Input styling (when not using UInput)
            </li>
            <li>
              <code>form-error</code> - Error message styling (red, small)
            </li>
          </ul>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Validation Pattern</h4>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>const isValid = computed(() => {
  return name.value.trim() !== "" && quantity.value &gt; 0;
});

&lt;UButton
  label="Submit"
  :disabled="!isValid"
  :loading="submitting"
  class="cursor-pointer"
/&gt;</code></pre>
        </div>
      </div>
    </section>

    <!-- Tables Section -->
    <section
      id="dev-section-tables"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('tables')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-table-cells" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Table Patterns</span>
        </span>
        <UIcon
          :name="isExpanded('tables') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('tables')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Use custom HTML tables for complex layouts (editable cells, actions):
        </p>

        <pre
          class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
        ><code>&lt;div class="overflow-x-auto"&gt;
  &lt;table class="min-w-full divide-y divide-[var(--ui-border)]"&gt;
    &lt;thead class="bg-[var(--ui-bg-muted)]"&gt;
      &lt;tr&gt;
        &lt;th class="px-4 py-2 text-left font-medium"&gt;Name&lt;/th&gt;
        &lt;th class="px-4 py-2 text-right font-medium"&gt;Qty&lt;/th&gt;
        &lt;th class="px-4 py-2 text-right font-medium"&gt;Actions&lt;/th&gt;
      &lt;/tr&gt;
    &lt;/thead&gt;
    &lt;tbody class="divide-y divide-[var(--ui-border)]"&gt;
      &lt;tr v-for="item in items" :key="item.id"&gt;
        &lt;td class="px-4 py-2"&gt;&#123;&#123; item.name &#125;&#125;&lt;/td&gt;
        &lt;td class="px-4 py-2 text-right"&gt;&#123;&#123; item.qty &#125;&#125;&lt;/td&gt;
        &lt;td class="px-4 py-2 text-right"&gt;
          &lt;UButton icon="i-heroicons-pencil" size="xs" /&gt;
        &lt;/td&gt;
      &lt;/tr&gt;
    &lt;/tbody&gt;
  &lt;/table&gt;
&lt;/div&gt;</code></pre>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              Wrap tables in <code>overflow-x-auto</code> for mobile responsiveness.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Modals Section -->
    <section
      id="dev-section-modals"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('modals')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-window" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Modal Patterns</span>
        </span>
        <UIcon
          :name="isExpanded('modals') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('modals')" class="space-y-4 p-4">
        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">ConfirmModal Component</h4>
          <p class="mb-2 text-sm text-[var(--ui-text-muted)]">
            Use for destructive actions (delete, reject, etc.):
          </p>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>&lt;UiConfirmModal
  v-model="showDeleteModal"
  title="Delete Item"
  message="This action cannot be undone."
  variant="danger"
  confirm-label="Delete"
  :loading="deleting"
  @confirm="handleDelete"
/&gt;</code></pre>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Variants</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li><code>danger</code> - Red icon, for delete/reject actions</li>
            <li><code>warning</code> - Amber icon, for caution actions</li>
            <li><code>success</code> - Green icon, for approve actions</li>
            <li><code>info</code> - Blue icon, for informational confirmations</li>
          </ul>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Custom Modal</h4>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>&lt;UModal v-model="showModal"&gt;
  &lt;UCard&gt;
    &lt;template #header&gt;Modal Title&lt;/template&gt;
    &lt;!-- Content --&gt;
    &lt;template #footer&gt;
      &lt;UButton label="Cancel" @click="showModal = false" /&gt;
      &lt;UButton label="Confirm" @click="handleConfirm" /&gt;
    &lt;/template&gt;
  &lt;/UCard&gt;
&lt;/UModal&gt;</code></pre>
        </div>
      </div>
    </section>

    <!-- Buttons Section -->
    <section
      id="dev-section-buttons"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('buttons')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-cursor-arrow-rays" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Button Patterns</span>
        </span>
        <UIcon
          :name="isExpanded('buttons') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('buttons')" class="space-y-4 p-4">
        <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-error)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Required:</strong> All buttons MUST have
              <code>class="cursor-pointer"</code>
            </span>
          </p>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Button Types</h4>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>&lt;!-- Primary action --&gt;
&lt;UButton label="Save" color="primary" class="cursor-pointer" /&gt;

&lt;!-- Cancel/Secondary --&gt;
&lt;UButton label="Cancel" color="neutral" class="cursor-pointer" /&gt;

&lt;!-- Destructive --&gt;
&lt;UButton label="Delete" color="error" class="cursor-pointer" /&gt;

&lt;!-- Success (approve) --&gt;
&lt;UButton label="Approve" color="success" class="cursor-pointer" /&gt;

&lt;!-- Icon button --&gt;
&lt;UButton icon="i-heroicons-pencil" size="sm" class="cursor-pointer" /&gt;

&lt;!-- With loading --&gt;
&lt;UButton label="Saving..." :loading="saving" class="cursor-pointer" /&gt;</code></pre>
        </div>
      </div>
    </section>

    <!-- Badges Section -->
    <section
      id="dev-section-badges"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('badges')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-tag" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Badge Patterns</span>
        </span>
        <UIcon
          :name="isExpanded('badges') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('badges')" class="space-y-4 p-4">
        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Status Badges</h4>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>&lt;UBadge color="warning" variant="soft"&gt;Pending&lt;/UBadge&gt;
&lt;UBadge color="success" variant="soft"&gt;Approved&lt;/UBadge&gt;
&lt;UBadge color="error" variant="soft"&gt;Rejected&lt;/UBadge&gt;
&lt;UBadge color="neutral" variant="soft"&gt;Draft&lt;/UBadge&gt;</code></pre>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Stock Level Badges</h4>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>&lt;!-- CSS classes for stock indicators --&gt;
&lt;span class="badge-stock-healthy"&gt;In Stock&lt;/span&gt;
&lt;span class="badge-stock-low"&gt;Low Stock&lt;/span&gt;
&lt;span class="badge-stock-critical"&gt;Critical&lt;/span&gt;</code></pre>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Custom Badge Classes</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li><code>badge-pending</code> - Amber background</li>
            <li><code>badge-approved</code> - Green background</li>
            <li><code>badge-rejected</code> - Red background</li>
            <li><code>badge-draft</code> - Gray background</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
