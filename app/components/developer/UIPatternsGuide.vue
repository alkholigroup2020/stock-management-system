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
  elevatedCard: `<UCard class="card-elevated">
  <template #header>
    <h3 class="font-semibold">Card Title</h3>
  </template>
  <!-- Content -->
  <template #footer>
    <div class="flex justify-end gap-2">
      <UButton label="Cancel" color="neutral" />
      <UButton label="Save" color="primary" />
    </div>
  </template>
</UCard>`,

  mutedCard: `<div class="card-muted rounded-lg p-4">
  <!-- Secondary content -->
</div>`,

  formLayout: `<div class="grid gap-4 md:grid-cols-2">
  <div>
    <label class="form-label">Item Name</label>
    <UInput v-model="name" placeholder="Enter name" />
  </div>
  <div>
    <label class="form-label">Category</label>
    <USelectMenu v-model="category" :options="categories" />
  </div>
</div>`,

  validation: `const isValid = computed(() => {
  return name.value.trim() !== "" && quantity.value > 0;
});

<UButton
  label="Submit"
  :disabled="!isValid"
  :loading="submitting"
  class="cursor-pointer"
/>`,

  table: `<div class="overflow-x-auto">
  <table class="min-w-full divide-y divide-[var(--ui-border)]">
    <thead class="bg-[var(--ui-bg-muted)]">
      <tr>
        <th class="px-4 py-2 text-left font-medium">Name</th>
        <th class="px-4 py-2 text-right font-medium">Qty</th>
        <th class="px-4 py-2 text-right font-medium">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-[var(--ui-border)]">
      <tr v-for="item in items" :key="item.id">
        <td class="px-4 py-2">{{ item.name }}</td>
        <td class="px-4 py-2 text-right">{{ item.qty }}</td>
        <td class="px-4 py-2 text-right">
          <UButton icon="i-heroicons-pencil" size="xs" />
        </td>
      </tr>
    </tbody>
  </table>
</div>`,

  confirmModal: `<UiConfirmModal
  v-model="showDeleteModal"
  title="Delete Item"
  message="This action cannot be undone."
  variant="danger"
  confirm-label="Delete"
  :loading="deleting"
  @confirm="handleDelete"
/>`,

  customModal: `<UModal v-model="showModal">
  <UCard>
    <template #header>Modal Title</template>
    <!-- Content -->
    <template #footer>
      <UButton label="Cancel" @click="showModal = false" />
      <UButton label="Confirm" @click="handleConfirm" />
    </template>
  </UCard>
</UModal>`,

  buttons: `<!-- Primary action -->
<UButton label="Save" color="primary" class="cursor-pointer" />

<!-- Cancel/Secondary -->
<UButton label="Cancel" color="neutral" class="cursor-pointer" />

<!-- Destructive -->
<UButton label="Delete" color="error" class="cursor-pointer" />

<!-- Success (approve) -->
<UButton label="Approve" color="success" class="cursor-pointer" />

<!-- Icon button -->
<UButton icon="i-heroicons-pencil" size="sm" class="cursor-pointer" />

<!-- With loading -->
<UButton label="Saving..." :loading="saving" class="cursor-pointer" />`,

  statusBadges: `<UBadge color="warning" variant="soft">Pending</UBadge>
<UBadge color="success" variant="soft">Approved</UBadge>
<UBadge color="error" variant="soft">Rejected</UBadge>
<UBadge color="neutral" variant="soft">Draft</UBadge>`,

  stockBadges: `<!-- CSS classes for stock indicators -->
<span class="badge-stock-healthy">In Stock</span>
<span class="badge-stock-low">Low Stock</span>
<span class="badge-stock-critical">Critical</span>`,
};
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
          <DeveloperCodeBlock :code="codeExamples.elevatedCard" language="vue" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Muted Card (Secondary)</h4>
          <p class="mb-2 text-sm text-[var(--ui-text-muted)]">Use for secondary content or info boxes:</p>
          <DeveloperCodeBlock :code="codeExamples.mutedCard" language="vue" />
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              Always use <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">rounded-xl</code> for cards and <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">rounded-lg</code> for inner
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
          <DeveloperCodeBlock :code="codeExamples.formLayout" language="vue" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Form Field Classes</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>
              <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">form-label</code> - Label styling (small, muted, medium weight)
            </li>
            <li>
              <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">form-input</code> - Input styling (when not using UInput)
            </li>
            <li>
              <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">form-error</code> - Error message styling (red, small)
            </li>
          </ul>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Validation Pattern</h4>
          <DeveloperCodeBlock :code="codeExamples.validation" language="vue" />
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

        <DeveloperCodeBlock :code="codeExamples.table" language="vue" />

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              Wrap tables in <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">overflow-x-auto</code> for mobile responsiveness.
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
          <DeveloperCodeBlock :code="codeExamples.confirmModal" language="vue" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Variants</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">danger</code> - Red icon, for delete/reject actions</li>
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">warning</code> - Amber icon, for caution actions</li>
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">success</code> - Green icon, for approve actions</li>
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">info</code> - Blue icon, for informational confirmations</li>
          </ul>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Custom Modal</h4>
          <DeveloperCodeBlock :code="codeExamples.customModal" language="vue" />
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
              <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">class="cursor-pointer"</code>
            </span>
          </p>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Button Types</h4>
          <DeveloperCodeBlock :code="codeExamples.buttons" language="vue" />
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
          <DeveloperCodeBlock :code="codeExamples.statusBadges" language="vue" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Stock Level Badges</h4>
          <DeveloperCodeBlock :code="codeExamples.stockBadges" language="vue" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Custom Badge Classes</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">badge-pending</code> - Amber background</li>
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">badge-approved</code> - Green background</li>
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">badge-rejected</code> - Red background</li>
            <li><code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">badge-draft</code> - Gray background</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
