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
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Tailwind CSS v4 Guide</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        CSS-first configuration with @theme and semantic tokens
      </p>
    </div>

    <!-- Theme Section -->
    <section
      id="dev-section-theme"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('theme')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-paint-brush" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">@theme Directive</span>
        </span>
        <UIcon
          :name="isExpanded('theme') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('theme')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Tailwind CSS v4 uses <strong>CSS-first configuration</strong> instead of
          tailwind.config.ts:
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Configuration Location
          </h4>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>/* app/assets/css/main.css */

@import "tailwindcss";

@theme {
  /* Define custom colors */
  --color-navy-500: #1e4d8c;
  --color-emerald-500: #2eb860;

  /* Custom font sizes (shifted down) */
  --font-size-xs: 11px;
  --font-size-sm: 12px;
  --font-size-base: 14px;
}</code></pre>
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Important:</strong> All theme customization happens in
              <code>main.css</code>, not in a config file.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Tokens Section -->
    <section
      id="dev-section-tokens"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('tokens')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-swatch" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Semantic Tokens</span>
        </span>
        <UIcon
          :name="isExpanded('tokens') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('tokens')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Use semantic tokens instead of raw colors for automatic dark mode support:
        </p>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Background Tokens</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>--ui-bg</code> - Page background</li>
              <li><code>--ui-bg-elevated</code> - Cards, sidebar</li>
              <li><code>--ui-bg-muted</code> - Table headers</li>
              <li><code>--ui-bg-accented</code> - Hover states</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Text Tokens</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>--ui-text</code> - Default text</li>
              <li><code>--ui-text-highlighted</code> - Headings</li>
              <li><code>--ui-text-muted</code> - Secondary text</li>
              <li><code>--ui-text-dimmed</code> - Captions</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Semantic Colors</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>--ui-primary</code> - Navy blue brand</li>
              <li><code>--ui-success</code> - Green actions</li>
              <li><code>--ui-warning</code> - Amber cautions</li>
              <li><code>--ui-error</code> - Red errors</li>
              <li><code>--ui-info</code> - Blue info</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Border Tokens</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>--ui-border</code> - Default borders</li>
              <li><code>--ui-border-muted</code> - Subtle borders</li>
            </ul>
          </div>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Usage Pattern</h4>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>&lt;!-- Use with var() in classes --&gt;
&lt;div class="bg-[var(--ui-bg-elevated)] text-[var(--ui-text)]"&gt;
  &lt;h2 class="text-[var(--ui-text-highlighted)]"&gt;Title&lt;/h2&gt;
  &lt;p class="text-[var(--ui-text-muted)]"&gt;Description&lt;/p&gt;
&lt;/div&gt;</code></pre>
        </div>
      </div>
    </section>

    <!-- Utilities Section -->
    <section
      id="dev-section-utilities"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('utilities')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-wrench-screwdriver" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Custom Utilities</span>
        </span>
        <UIcon
          :name="isExpanded('utilities') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('utilities')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Custom utility classes are defined with <code>@utility</code> directive:
        </p>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Background Utilities</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>bg-default</code></li>
              <li><code>bg-elevated</code></li>
              <li><code>bg-muted</code></li>
              <li><code>bg-accented</code></li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Text Utilities</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>text-default</code></li>
              <li><code>text-primary</code></li>
              <li><code>text-muted</code></li>
              <li><code>text-dimmed</code></li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Border Utilities</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>border-default</code></li>
              <li><code>border-muted</code></li>
              <li><code>divide-default</code></li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Other Utilities</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>focus-ring</code> - Focus ring styling</li>
              <li><code>smooth-transition</code> - 200ms ease</li>
              <li><code>hover-lift</code> - Subtle lift on hover</li>
            </ul>
          </div>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Typography Classes</h4>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>&lt;!-- Typography helper classes --&gt;
&lt;h1 class="text-display"&gt;Large heading&lt;/h1&gt;
&lt;h2 class="text-heading"&gt;Section heading&lt;/h2&gt;
&lt;h3 class="text-subheading"&gt;Subsection&lt;/h3&gt;
&lt;label class="text-label"&gt;Form label&lt;/label&gt;
&lt;p class="text-body"&gt;Body text&lt;/p&gt;
&lt;span class="text-caption"&gt;Small caption&lt;/span&gt;</code></pre>
        </div>
      </div>
    </section>

    <!-- Dark Mode Section -->
    <section
      id="dev-section-dark"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('dark')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-moon" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Dark Mode</span>
        </span>
        <UIcon
          :name="isExpanded('dark') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('dark')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Dark mode is implemented via <code>.dark</code> class on the html element:
        </p>

        <pre
          class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
        ><code>/* main.css - Dark mode tokens */
.dark {
  --ui-bg: #0c1220;
  --ui-bg-elevated: #151c2c;
  --ui-text: #f4f4f5;
  --ui-text-highlighted: #ffffff;
  --ui-border: #2d3a50;
  /* ... other dark mode tokens */
}</code></pre>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">How It Works</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon
                name="i-heroicons-check-circle"
                class="mt-0.5 shrink-0 text-[var(--ui-success)]"
              />
              <span>Nuxt UI handles dark mode toggle automatically</span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon
                name="i-heroicons-check-circle"
                class="mt-0.5 shrink-0 text-[var(--ui-success)]"
              />
              <span>Using semantic tokens ensures automatic dark mode support</span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon
                name="i-heroicons-check-circle"
                class="mt-0.5 shrink-0 text-[var(--ui-success)]"
              />
              <span>Preference saved to localStorage</span>
            </li>
          </ul>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              Always use <code>var(--ui-*)</code> tokens instead of hardcoded colors to ensure dark
              mode compatibility.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Key Constraints -->
    <section class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-4">
      <h3 class="mb-3 font-semibold text-[var(--ui-text-highlighted)]">
        Tailwind CSS v4 Constraints
      </h3>
      <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
        <li class="flex items-start gap-2">
          <UIcon name="i-heroicons-x-circle" class="mt-0.5 shrink-0 text-[var(--ui-error)]" />
          <span>
            <strong>No @apply:</strong> Cannot use @apply with Tailwind utilities in CSS
          </span>
        </li>
        <li class="flex items-start gap-2">
          <UIcon name="i-heroicons-x-circle" class="mt-0.5 shrink-0 text-[var(--ui-error)]" />
          <span>
            <strong>No config file:</strong> Use @theme in main.css instead of tailwind.config.ts
          </span>
        </li>
        <li class="flex items-start gap-2">
          <UIcon name="i-heroicons-check-circle" class="mt-0.5 shrink-0 text-[var(--ui-success)]" />
          <span>
            <strong>Use @utility:</strong> For custom utility classes that work like Tailwind
            utilities
          </span>
        </li>
        <li class="flex items-start gap-2">
          <UIcon name="i-heroicons-check-circle" class="mt-0.5 shrink-0 text-[var(--ui-success)]" />
          <span>
            <strong>Use @layer:</strong> For component classes like .card-elevated
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>
