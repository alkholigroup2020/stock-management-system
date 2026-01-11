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
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Best Practices</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Formatting rules, common pitfalls, and development standards
      </p>
    </div>

    <!-- Formatting Section -->
    <section
      id="dev-section-formatting"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('formatting')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-code-bracket" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Code Formatting</span>
        </span>
        <UIcon
          :name="isExpanded('formatting') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('formatting')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The project uses Prettier for consistent formatting. All code must follow these rules:
        </p>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--ui-border)] text-sm">
            <thead class="bg-[var(--ui-bg-muted)]">
              <tr>
                <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                  Rule
                </th>
                <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                  Setting
                </th>
                <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                  Example
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--ui-border)]">
              <tr>
                <td class="px-4 py-2">Semicolons</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">Always required</td>
                <td class="px-4 py-2">
                  <code class="text-xs">const x = 1;</code>
                </td>
              </tr>
              <tr>
                <td class="px-4 py-2">Quotes</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">Double quotes</td>
                <td class="px-4 py-2">
                  <code class="text-xs">"hello"</code> not <code class="text-xs">'hello'</code>
                </td>
              </tr>
              <tr>
                <td class="px-4 py-2">Indentation</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">2 spaces</td>
                <td class="px-4 py-2"><code class="text-xs">Never tabs</code></td>
              </tr>
              <tr>
                <td class="px-4 py-2">Line Width</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">100 characters max</td>
                <td class="px-4 py-2"><code class="text-xs">Wrap long lines</code></td>
              </tr>
              <tr>
                <td class="px-4 py-2">Arrow Parens</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">Always</td>
                <td class="px-4 py-2">
                  <code class="text-xs">(x) =&gt; x</code> not <code class="text-xs">x =&gt; x</code>
                </td>
              </tr>
              <tr>
                <td class="px-4 py-2">Trailing Commas</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">ES5 style</td>
                <td class="px-4 py-2"><code class="text-xs">Objects/arrays only</code></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Commands</h4>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>pnpm format        # Format all files
pnpm format:check  # Check formatting (CI)</code></pre>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              Enable "Format on Save" in VS Code. When you save, the file should not change if
              formatting is correct.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Checklist Section -->
    <section
      id="dev-section-checklist"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('checklist')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-clipboard-document-check" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Pre-Commit Checklist</span>
        </span>
        <UIcon
          :name="isExpanded('checklist') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('checklist')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Before completing any task, verify all items:
        </p>

        <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
          <li class="flex items-center gap-2">
            <UIcon name="i-heroicons-check-circle" class="shrink-0 text-[var(--ui-success)]" />
            <span>
              <code>pnpm typecheck</code> shows <strong>zero errors</strong>
            </span>
          </li>
          <li class="flex items-center gap-2">
            <UIcon name="i-heroicons-check-circle" class="shrink-0 text-[var(--ui-success)]" />
            <span>
              No <code>any</code> types in the code
            </span>
          </li>
          <li class="flex items-center gap-2">
            <UIcon name="i-heroicons-check-circle" class="shrink-0 text-[var(--ui-success)]" />
            <span>All error handlers use proper type guards</span>
          </li>
          <li class="flex items-center gap-2">
            <UIcon name="i-heroicons-check-circle" class="shrink-0 text-[var(--ui-success)]" />
            <span>All interfaces are properly defined</span>
          </li>
          <li class="flex items-center gap-2">
            <UIcon name="i-heroicons-check-circle" class="shrink-0 text-[var(--ui-success)]" />
            <span>API responses are properly typed</span>
          </li>
          <li class="flex items-center gap-2">
            <UIcon name="i-heroicons-check-circle" class="shrink-0 text-[var(--ui-success)]" />
            <span>Prisma Decimal types handled correctly</span>
          </li>
          <li class="flex items-center gap-2">
            <UIcon name="i-heroicons-check-circle" class="shrink-0 text-[var(--ui-success)]" />
            <span>
              All buttons have <code>cursor-pointer</code> class
            </span>
          </li>
          <li class="flex items-center gap-2">
            <UIcon name="i-heroicons-check-circle" class="shrink-0 text-[var(--ui-success)]" />
            <span>Code follows Prettier formatting rules</span>
          </li>
        </ul>

        <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-error)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>If typecheck fails or formatting is inconsistent, the task is NOT complete.</strong>
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Pitfalls Section -->
    <section
      id="dev-section-pitfalls"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('pitfalls')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-bug-ant" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Common Pitfalls</span>
        </span>
        <UIcon
          :name="isExpanded('pitfalls') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('pitfalls')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">Avoid these critical mistakes:</p>

        <div class="space-y-3">
          <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)]" />
              <strong class="text-sm text-[var(--ui-text-highlighted)]">
                Never allow negative stock
              </strong>
            </div>
            <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
              Validate <code>requestedQty &lt;= locationStock.onHand</code> before every
              issue/transfer
            </p>
          </div>

          <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)]" />
              <strong class="text-sm text-[var(--ui-text-highlighted)]">
                Never modify closed periods
              </strong>
            </div>
            <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
              Check <code>period.status === "OPEN"</code> before any mutation
            </p>
          </div>

          <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)]" />
              <strong class="text-sm text-[var(--ui-text-highlighted)]">
                Never skip location context
              </strong>
            </div>
            <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
              All transactions must have locationId - never save without it
            </p>
          </div>

          <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)]" />
              <strong class="text-sm text-[var(--ui-text-highlighted)]">
                Never change WAC on issues
              </strong>
            </div>
            <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
              Only deliveries recalculate WAC. Issues deduct at current WAC.
            </p>
          </div>

          <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)]" />
              <strong class="text-sm text-[var(--ui-text-highlighted)]">
                Never use db:push in production
              </strong>
            </div>
            <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
              Always use <code>pnpm db:migrate deploy</code> for production deployments
            </p>
          </div>

          <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)]" />
              <strong class="text-sm text-[var(--ui-text-highlighted)]">
                Never bypass approval workflows
              </strong>
            </div>
            <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
              PRF/PO, Transfers, Period Close all need proper approval
            </p>
          </div>

          <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)]" />
              <strong class="text-sm text-[var(--ui-text-highlighted)]">
                Never forget audit trail
              </strong>
            </div>
            <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
              Log who/when/what for all mutations with userId, timestamp, action
            </p>
          </div>

          <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)]" />
              <strong class="text-sm text-[var(--ui-text-highlighted)]">
                Never expose service keys
              </strong>
            </div>
            <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
              SUPABASE_SERVICE_KEY is server-only, never in client code
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Currency Section -->
    <section
      id="dev-section-currency"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('currency')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-currency-dollar" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Currency & Dates</span>
        </span>
        <UIcon
          :name="isExpanded('currency') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('currency')" class="space-y-4 p-4">
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Currency</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><strong>Currency:</strong> SAR (Saudi Riyal)</li>
              <li><strong>Format:</strong> SAR 1,234.56</li>
              <li><strong>Currency decimals:</strong> 2 places</li>
              <li><strong>Quantity decimals:</strong> Up to 4 places</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Dates & Time</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><strong>Display format:</strong> DD/MM/YYYY</li>
              <li><strong>API format:</strong> ISO 8601</li>
              <li><strong>Timezone:</strong> Asia/Riyadh</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Units of Measure</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>KG</code> - Kilograms</li>
              <li><code>EA</code> - Each</li>
              <li><code>LTR</code> - Liters</li>
              <li><code>BOX</code> - Box</li>
              <li><code>CASE</code> - Case</li>
              <li><code>PACK</code> - Pack</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Location Types</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>KITCHEN</code> - Kitchen</li>
              <li><code>STORE</code> - Store</li>
              <li><code>CENTRAL</code> - Central</li>
              <li><code>WAREHOUSE</code> - Warehouse</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Reference Card -->
    <section class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-4">
      <h3 class="mb-3 font-semibold text-[var(--ui-text-highlighted)]">Quick Commands Reference</h3>
      <div class="grid gap-2 text-sm md:grid-cols-2">
        <div class="flex items-center gap-2">
          <code class="rounded bg-[var(--ui-bg-muted)] px-2 py-0.5 text-xs">pnpm dev</code>
          <span class="text-[var(--ui-text-muted)]">Start dev server</span>
        </div>
        <div class="flex items-center gap-2">
          <code class="rounded bg-[var(--ui-bg-muted)] px-2 py-0.5 text-xs">pnpm typecheck</code>
          <span class="text-[var(--ui-text-muted)]">Type checking</span>
        </div>
        <div class="flex items-center gap-2">
          <code class="rounded bg-[var(--ui-bg-muted)] px-2 py-0.5 text-xs">pnpm format</code>
          <span class="text-[var(--ui-text-muted)]">Format code</span>
        </div>
        <div class="flex items-center gap-2">
          <code class="rounded bg-[var(--ui-bg-muted)] px-2 py-0.5 text-xs">pnpm build</code>
          <span class="text-[var(--ui-text-muted)]">Production build</span>
        </div>
        <div class="flex items-center gap-2">
          <code class="rounded bg-[var(--ui-bg-muted)] px-2 py-0.5 text-xs">pnpm db:studio</code>
          <span class="text-[var(--ui-text-muted)]">Prisma GUI</span>
        </div>
        <div class="flex items-center gap-2">
          <code class="rounded bg-[var(--ui-bg-muted)] px-2 py-0.5 text-xs">pnpm db:push</code>
          <span class="text-[var(--ui-text-muted)]">Sync schema (dev only)</span>
        </div>
      </div>
    </section>
  </div>
</template>
