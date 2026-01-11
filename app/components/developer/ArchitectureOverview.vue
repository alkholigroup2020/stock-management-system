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
  folderStructure: `/app/                   # Frontend (Nuxt 4)
  /assets/css/          # Tailwind CSS v4 theme config
  /components/          # Auto-imported Vue components
  /composables/         # Auto-imported composables
  /layouts/             # Layout templates
  /middleware/          # Client-side route guards
  /pages/               # Auto-routing pages
  /plugins/             # Vue plugins
  /stores/              # Pinia stores
  /utils/               # Client utilities
  app.vue               # Root component

/server/                # Backend (Nitro/H3)
  /api/                 # API endpoints (RESTful routes)
  /middleware/          # Server middleware
  /utils/               # Server utilities

/shared/types/          # Shared TypeScript types
/prisma/                # Database schema & migrations
/project-docs/          # Documentation`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Architecture Overview</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Understand the project structure and technical decisions
      </p>
    </div>

    <!-- Nuxt 4 Section -->
    <section
      id="dev-section-nuxt4"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('nuxt4')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-cube" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Nuxt 4 Framework</span>
        </span>
        <UIcon
          :name="isExpanded('nuxt4') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('nuxt4')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          This project uses <strong>Nuxt 4</strong>, the latest version of the Nuxt framework. Key
          differences from Nuxt 3:
        </p>

        <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
          <li class="flex items-start gap-2">
            <UIcon name="i-heroicons-folder" class="mt-0.5 shrink-0 text-[var(--ui-primary)]" />
            <span>
              <strong>/app/ directory</strong> - Frontend code lives in /app/ instead of the root.
              This includes pages, components, composables, and stores.
            </span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon name="i-heroicons-document" class="mt-0.5 shrink-0 text-[var(--ui-primary)]" />
            <span>
              <strong>SPA Mode</strong> - Running with <code>ssr: false</code> for client-side
              rendering only. No server-side rendering.
            </span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon name="i-heroicons-server" class="mt-0.5 shrink-0 text-[var(--ui-primary)]" />
            <span>
              <strong>Nitro Server</strong> - API routes in /server/api/ are handled by Nitro and
              deployed as serverless functions.
            </span>
          </li>
        </ul>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              Always check <strong>Nuxt 4</strong> documentation at
              <a href="https://nuxt.com/docs" target="_blank" class="underline">nuxt.com/docs</a>,
              not older Nuxt 3 resources.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Folder Structure Section -->
    <section
      id="dev-section-folders"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('folders')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-folder-open" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Folder Structure</span>
        </span>
        <UIcon
          :name="isExpanded('folders') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('folders')" class="space-y-4 p-4">
        <DeveloperCodeBlock :code="codeExamples.folderStructure" language="plaintext" />

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Key Directories</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>/app/pages/</strong> - File-based routing. /pages/items/[id].vue becomes
              /items/:id
            </li>
            <li>
              <strong>/app/components/</strong> - Auto-imported. Subdirectory names become prefixes.
            </li>
            <li><strong>/server/api/</strong> - API routes. Follows RESTful conventions.</li>
            <li>
              <strong>/shared/types/</strong> - TypeScript interfaces shared between frontend and
              backend.
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Monolithic Section -->
    <section
      id="dev-section-monolithic"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('monolithic')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-building-office" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Monolithic Architecture
          </span>
        </span>
        <UIcon
          :name="isExpanded('monolithic') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('monolithic')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          This is a <strong>single Nuxt application</strong> that contains both frontend and
          backend:
        </p>

        <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
          <li class="flex items-start gap-2">
            <UIcon name="i-heroicons-window" class="mt-0.5 shrink-0 text-[var(--ui-info)]" />
            <span>
              <strong>Frontend</strong> - SPA pages in /app/pages/, components in /app/components/
            </span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon name="i-heroicons-server" class="mt-0.5 shrink-0 text-[var(--ui-success)]" />
            <span>
              <strong>Backend</strong> - API routes in /server/api/, server middleware in
              /server/middleware/
            </span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon name="i-heroicons-share" class="mt-0.5 shrink-0 text-[var(--ui-warning)]" />
            <span>
              <strong>Shared</strong> - Composables in /app/composables/, types in /shared/types/
            </span>
          </li>
        </ul>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              No separate backend service. All API routes are Nuxt server routes deployed as Vercel
              serverless functions.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Tech Stack Section -->
    <section
      id="dev-section-techstack"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('techstack')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-cpu-chip" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Tech Stack</span>
        </span>
        <UIcon
          :name="isExpanded('techstack') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('techstack')" class="space-y-4 p-4">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--ui-border)] text-sm">
            <thead class="bg-[var(--ui-bg-muted)]">
              <tr>
                <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                  Layer
                </th>
                <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                  Technology
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--ui-border)]">
              <tr>
                <td class="px-4 py-2 font-medium">Framework</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">Nuxt 4 (SPA mode, ssr: false)</td>
              </tr>
              <tr>
                <td class="px-4 py-2 font-medium">UI Library</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">Nuxt UI with Tailwind CSS v4</td>
              </tr>
              <tr>
                <td class="px-4 py-2 font-medium">State Management</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">Pinia</td>
              </tr>
              <tr>
                <td class="px-4 py-2 font-medium">Type Safety</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">TypeScript, Zod</td>
              </tr>
              <tr>
                <td class="px-4 py-2 font-medium">Backend</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">Nuxt Server Routes (Nitro/H3)</td>
              </tr>
              <tr>
                <td class="px-4 py-2 font-medium">Database</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">PostgreSQL via Supabase + Prisma</td>
              </tr>
              <tr>
                <td class="px-4 py-2 font-medium">Auth</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">
                  nuxt-auth-utils with JWT in httpOnly cookies
                </td>
              </tr>
              <tr>
                <td class="px-4 py-2 font-medium">PWA</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">
                  @vite-pwa/nuxt for installable app
                </td>
              </tr>
              <tr>
                <td class="px-4 py-2 font-medium">Hosting</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">
                  Vercel (frontend + API), Supabase (database)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Key Documentation</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>
              <a
                href="https://nuxt.com/docs"
                target="_blank"
                class="text-[var(--ui-primary)] hover:underline"
              >
                Nuxt 4 Documentation
              </a>
            </li>
            <li>
              <a
                href="https://ui.nuxt.com"
                target="_blank"
                class="text-[var(--ui-primary)] hover:underline"
              >
                Nuxt UI Components
              </a>
            </li>
            <li>
              <a
                href="https://tailwindcss.com/docs"
                target="_blank"
                class="text-[var(--ui-primary)] hover:underline"
              >
                Tailwind CSS v4
              </a>
            </li>
            <li>
              <a
                href="https://pinia.vuejs.org"
                target="_blank"
                class="text-[var(--ui-primary)] hover:underline"
              >
                Pinia State Management
              </a>
            </li>
            <li>
              <a
                href="https://www.prisma.io/docs"
                target="_blank"
                class="text-[var(--ui-primary)] hover:underline"
              >
                Prisma ORM
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
