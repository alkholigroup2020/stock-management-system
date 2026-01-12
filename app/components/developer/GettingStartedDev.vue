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
  clone: `git clone <repository-url>
cd stock-management-system`,

  install: `pnpm install`,

  envSetup: `cp .env.example .env`,

  runDev: `pnpm dev`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Getting Started</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Set up your development environment and start contributing
      </p>
    </div>

    <!-- Prerequisites Section -->
    <section
      id="dev-section-prerequisites"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('prerequisites')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-check-badge" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Prerequisites</span>
        </span>
        <UIcon
          :name="
            isExpanded('prerequisites') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('prerequisites')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Before you begin, ensure you have the following installed on your development machine:
        </p>

        <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
          <li class="flex items-start gap-2">
            <UIcon
              name="i-heroicons-check-circle"
              class="mt-0.5 shrink-0 text-[var(--ui-success)]"
            />
            <span>
              <strong>Node.js 20+</strong>
              - Required for Nuxt 4.
              <a
                href="https://nodejs.org/"
                target="_blank"
                class="text-[var(--ui-primary)] hover:underline"
              >
                Download
              </a>
            </span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon
              name="i-heroicons-check-circle"
              class="mt-0.5 shrink-0 text-[var(--ui-success)]"
            />
            <span>
              <strong>pnpm</strong>
              - Package manager (required, not npm/yarn). Install with:
              <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">
                npm install -g pnpm
              </code>
            </span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon
              name="i-heroicons-check-circle"
              class="mt-0.5 shrink-0 text-[var(--ui-success)]"
            />
            <span>
              <strong>Git</strong>
              - For version control
            </span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon
              name="i-heroicons-check-circle"
              class="mt-0.5 shrink-0 text-[var(--ui-success)]"
            />
            <span>
              <strong>VS Code</strong>
              (recommended) with extensions: Vue - Official, ESLint, Prettier
            </span>
          </li>
        </ul>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              This project uses
              <strong>Nuxt 4</strong>
              , not Nuxt 3. Always refer to the latest Nuxt 4 documentation.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Installation Section -->
    <section
      id="dev-section-installation"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('installation')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-down-tray" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Installation</span>
        </span>
        <UIcon
          :name="isExpanded('installation') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('installation')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">Follow these steps to set up the project:</p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            1. Clone the Repository
          </h4>
          <DeveloperCodeBlock :code="codeExamples.clone" language="bash" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            2. Install Dependencies
          </h4>
          <DeveloperCodeBlock :code="codeExamples.install" language="bash" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            3. Set Up Environment Variables
          </h4>
          <DeveloperCodeBlock :code="codeExamples.envSetup" language="bash" />
          <p class="mt-2 text-sm text-[var(--ui-text-muted)]">
            Then edit
            <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">.env</code>
            with:
          </p>
          <ul class="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>
              <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">DATABASE_URL</code>
              - PostgreSQL connection string (Supabase port 6543)
            </li>
            <li>
              <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">AUTH_SECRET</code>
              - Random secret for JWT signing
            </li>
            <li>
              <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">
                NUXT_PUBLIC_SITE_URL
              </code>
              - http://localhost:3000 for dev
            </li>
            <li>
              <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">
                NUXT_PUBLIC_CURRENCY
              </code>
              - SAR
            </li>
          </ul>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            4. Start Development Server
          </h4>
          <DeveloperCodeBlock :code="codeExamples.runDev" language="bash" />
          <p class="mt-2 text-sm text-[var(--ui-text-muted)]">
            Open
            <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">
              http://localhost:3000
            </code>
            in your browser.
          </p>
        </div>
      </div>
    </section>

    <!-- Commands Section -->
    <section
      id="dev-section-commands"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('commands')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-command-line" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Development Commands</span>
        </span>
        <UIcon
          :name="isExpanded('commands') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('commands')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          All commands use
          <strong>pnpm</strong>
          as the package manager:
        </p>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--ui-border)] text-sm">
            <thead class="bg-[var(--ui-bg-muted)]">
              <tr>
                <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                  Command
                </th>
                <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                  Description
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--ui-border)]">
              <tr>
                <td class="px-4 py-2">
                  <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">pnpm dev</code>
                </td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">
                  Start development server at localhost:3000
                </td>
              </tr>
              <tr>
                <td class="px-4 py-2">
                  <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">
                    pnpm build
                  </code>
                </td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">Create production build</td>
              </tr>
              <tr>
                <td class="px-4 py-2">
                  <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">
                    pnpm typecheck
                  </code>
                </td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">
                  Run TypeScript type checking (must pass with zero errors)
                </td>
              </tr>
              <tr>
                <td class="px-4 py-2">
                  <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">pnpm lint</code>
                </td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">Run ESLint</td>
              </tr>
              <tr>
                <td class="px-4 py-2">
                  <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">
                    pnpm format
                  </code>
                </td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">
                  Format all files with Prettier
                </td>
              </tr>
              <tr>
                <td class="px-4 py-2">
                  <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">
                    pnpm format:check
                  </code>
                </td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">Check formatting (used in CI)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Database Section -->
    <section
      id="dev-section-database"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('database')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-circle-stack" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Database Commands</span>
        </span>
        <UIcon
          :name="isExpanded('database') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('database')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Database operations use Prisma ORM with PostgreSQL (Supabase):
        </p>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--ui-border)] text-sm">
            <thead class="bg-[var(--ui-bg-muted)]">
              <tr>
                <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                  Command
                </th>
                <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                  Description
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--ui-border)]">
              <tr>
                <td class="px-4 py-2">
                  <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">
                    pnpm db:push
                  </code>
                </td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">
                  Sync schema to database (dev only)
                </td>
              </tr>
              <tr>
                <td class="px-4 py-2">
                  <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">
                    pnpm db:migrate dev
                  </code>
                </td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">Create migration files</td>
              </tr>
              <tr>
                <td class="px-4 py-2">
                  <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">
                    pnpm db:studio
                  </code>
                </td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">Open Prisma Studio GUI</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="rounded-lg border border-[var(--ui-error)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-error)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Never use db:push in production.</strong>
              Always use
              <code class="rounded bg-[var(--ui-bg-muted)] px-1 py-0.5 text-xs">
                pnpm db:migrate deploy
              </code>
              for production deployments.
            </span>
          </p>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Supabase Connection:</strong>
              Use port 6543 (Transaction pooler) for Prisma, not port 5432 (Direct connection).
            </span>
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
