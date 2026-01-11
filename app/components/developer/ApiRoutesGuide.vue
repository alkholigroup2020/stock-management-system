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
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">API Routes Guide</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">70 endpoints with RESTful conventions</p>
    </div>

    <!-- Conventions Section -->
    <section
      id="dev-section-conventions"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('conventions')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-book-open" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">RESTful Conventions</span>
        </span>
        <UIcon
          :name="isExpanded('conventions') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('conventions')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          All API routes follow RESTful conventions:
        </p>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--ui-border)] text-sm">
            <thead class="bg-[var(--ui-bg-muted)]">
              <tr>
                <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                  Method
                </th>
                <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                  Pattern
                </th>
                <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                  Purpose
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--ui-border)]">
              <tr>
                <td class="px-4 py-2">
                  <span class="rounded bg-[var(--ui-success)]/20 px-2 py-0.5 text-xs font-medium text-[var(--ui-success)]">
                    GET
                  </span>
                </td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">/api/items</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">List all items</td>
              </tr>
              <tr>
                <td class="px-4 py-2">
                  <span class="rounded bg-[var(--ui-success)]/20 px-2 py-0.5 text-xs font-medium text-[var(--ui-success)]">
                    GET
                  </span>
                </td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">/api/items/[id]</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">Get single item</td>
              </tr>
              <tr>
                <td class="px-4 py-2">
                  <span class="rounded bg-[var(--ui-primary)]/20 px-2 py-0.5 text-xs font-medium text-[var(--ui-primary)]">
                    POST
                  </span>
                </td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">/api/items</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">Create new item</td>
              </tr>
              <tr>
                <td class="px-4 py-2">
                  <span class="rounded bg-[var(--ui-warning)]/20 px-2 py-0.5 text-xs font-medium text-[var(--ui-warning)]">
                    PATCH
                  </span>
                </td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">/api/items/[id]</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">Update item</td>
              </tr>
              <tr>
                <td class="px-4 py-2">
                  <span class="rounded bg-[var(--ui-error)]/20 px-2 py-0.5 text-xs font-medium text-[var(--ui-error)]">
                    DELETE
                  </span>
                </td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">/api/items/[id]</td>
                <td class="px-4 py-2 text-[var(--ui-text-muted)]">Delete item</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Nested Resources</h4>
          <p class="mb-2 text-sm text-[var(--ui-text-muted)]">
            Location-scoped resources use nested routes:
          </p>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>/api/locations/[id]/deliveries     # Deliveries for location
/api/locations/[id]/issues          # Issues for location
/api/locations/[id]/pob             # POB for location</code></pre>
        </div>
      </div>
    </section>

    <!-- Errors Section -->
    <section
      id="dev-section-errors"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('errors')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-exclamation-triangle" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Error Response Format</span>
        </span>
        <UIcon
          :name="isExpanded('errors') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('errors')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Use <code>createError</code> from H3 for consistent error responses:
        </p>

        <pre
          class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
        ><code>throw createError({
  statusCode: 400,
  statusMessage: "Bad Request",
  data: {
    code: "VALIDATION_ERROR",
    message: "Invalid item quantity",
    details: { field: "quantity", reason: "Must be positive" }
  }
});</code></pre>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Standard Error Codes</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-[var(--ui-border)] text-sm">
              <thead class="bg-[var(--ui-bg-muted)]">
                <tr>
                  <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                    Code
                  </th>
                  <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                    HTTP Status
                  </th>
                  <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">
                    When
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--ui-border)]">
                <tr>
                  <td class="px-4 py-2"><code>VALIDATION_ERROR</code></td>
                  <td class="px-4 py-2 text-[var(--ui-text-muted)]">400</td>
                  <td class="px-4 py-2 text-[var(--ui-text-muted)]">Invalid input data</td>
                </tr>
                <tr>
                  <td class="px-4 py-2"><code>UNAUTHORIZED</code></td>
                  <td class="px-4 py-2 text-[var(--ui-text-muted)]">401</td>
                  <td class="px-4 py-2 text-[var(--ui-text-muted)]">Not logged in</td>
                </tr>
                <tr>
                  <td class="px-4 py-2"><code>LOCATION_ACCESS_DENIED</code></td>
                  <td class="px-4 py-2 text-[var(--ui-text-muted)]">403</td>
                  <td class="px-4 py-2 text-[var(--ui-text-muted)]">No location access</td>
                </tr>
                <tr>
                  <td class="px-4 py-2"><code>NOT_FOUND</code></td>
                  <td class="px-4 py-2 text-[var(--ui-text-muted)]">404</td>
                  <td class="px-4 py-2 text-[var(--ui-text-muted)]">Resource doesn't exist</td>
                </tr>
                <tr>
                  <td class="px-4 py-2"><code>INSUFFICIENT_STOCK</code></td>
                  <td class="px-4 py-2 text-[var(--ui-text-muted)]">400</td>
                  <td class="px-4 py-2 text-[var(--ui-text-muted)]">Not enough stock for issue</td>
                </tr>
                <tr>
                  <td class="px-4 py-2"><code>PERIOD_CLOSED</code></td>
                  <td class="px-4 py-2 text-[var(--ui-text-muted)]">400</td>
                  <td class="px-4 py-2 text-[var(--ui-text-muted)]">Can't modify closed period</td>
                </tr>
                <tr>
                  <td class="px-4 py-2"><code>PRICE_VARIANCE</code></td>
                  <td class="px-4 py-2 text-[var(--ui-text-muted)]">200 (info)</td>
                  <td class="px-4 py-2 text-[var(--ui-text-muted)]">Price differs, NCR created</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

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
          <UIcon name="i-heroicons-lock-closed" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Authentication</span>
        </span>
        <UIcon
          :name="isExpanded('auth') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('auth')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          All <code>/api/*</code> routes are protected except <code>/api/auth/*</code>:
        </p>

        <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
          <li class="flex items-start gap-2">
            <UIcon name="i-heroicons-check-circle" class="mt-0.5 shrink-0 text-[var(--ui-success)]" />
            <span>
              <strong>Access user:</strong> <code>event.context.user</code> contains the
              authenticated user
            </span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon name="i-heroicons-check-circle" class="mt-0.5 shrink-0 text-[var(--ui-success)]" />
            <span>
              <strong>JWT cookie:</strong> Token stored in httpOnly cookie, sent automatically
            </span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon name="i-heroicons-check-circle" class="mt-0.5 shrink-0 text-[var(--ui-success)]" />
            <span>
              <strong>Session refresh:</strong> Handled automatically by nuxt-auth-utils
            </span>
          </li>
        </ul>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Route Handler Example</h4>
          <pre
            class="overflow-x-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-muted)] p-3 text-xs"
          ><code>// server/api/items/index.get.ts
export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user) {
    throw createError({ statusCode: 401 });
  }

  // User is authenticated
  const items = await prisma.item.findMany();
  return items;
});</code></pre>
        </div>
      </div>
    </section>

    <!-- Endpoints Section -->
    <section
      id="dev-section-endpoints"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('endpoints')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-queue-list" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Endpoints Overview</span>
        </span>
        <UIcon
          :name="isExpanded('endpoints') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('endpoints')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          <strong>70 endpoints</strong> organized by module:
        </p>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Authentication (6)</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>POST /api/auth/login</code></li>
              <li><code>POST /api/auth/register</code></li>
              <li><code>POST /api/auth/logout</code></li>
              <li><code>GET /api/auth/session</code></li>
              <li><code>PATCH /api/auth/profile</code></li>
              <li><code>POST /api/auth/change-password</code></li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Locations (9)</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>GET/POST /api/locations</code></li>
              <li><code>GET/PATCH/DELETE /api/locations/[id]</code></li>
              <li><code>GET /api/locations/[id]/dashboard</code></li>
              <li><code>GET/POST /api/locations/[id]/pob</code></li>
              <li><code>GET /api/user/locations</code></li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Transactions</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><strong>Deliveries (6):</strong> CRUD + location-scoped</li>
              <li><strong>Issues (4):</strong> CRUD + location-scoped</li>
              <li><strong>Transfers (5):</strong> CRUD + approve/reject</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Periods (10)</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>GET/POST /api/periods</code></li>
              <li><code>GET/PATCH /api/periods/[id]</code></li>
              <li><code>POST /api/periods/[id]/open</code></li>
              <li><code>POST /api/periods/[id]/close</code></li>
              <li><code>GET/POST /api/periods/[id]/prices</code></li>
              <li><code>GET /api/periods/current</code></li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Master Data</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><strong>Items (6):</strong> CRUD + price update</li>
              <li><strong>Suppliers (5):</strong> CRUD</li>
              <li><strong>Users (4):</strong> List, view, update, delete</li>
              <li><strong>NCRs (4):</strong> CRUD</li>
            </ul>
          </div>

          <div>
            <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Reports (4)</h4>
            <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
              <li><code>GET /api/reports/stock-now</code></li>
              <li><code>GET /api/reports/deliveries</code></li>
              <li><code>GET /api/reports/issues</code></li>
              <li><code>GET /api/reports/reconciliation</code></li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- File Naming -->
    <section class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-4">
      <h3 class="mb-3 font-semibold text-[var(--ui-text-highlighted)]">API File Naming</h3>
      <p class="mb-3 text-sm text-[var(--ui-text-muted)]">
        Nuxt uses file-based routing for API endpoints:
      </p>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-[var(--ui-border)] text-sm">
          <thead class="bg-[var(--ui-bg-muted)]">
            <tr>
              <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">File</th>
              <th class="px-4 py-2 text-left font-medium text-[var(--ui-text-highlighted)]">Route</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)]">
            <tr>
              <td class="px-4 py-2"><code>server/api/items/index.get.ts</code></td>
              <td class="px-4 py-2 text-[var(--ui-text-muted)]">GET /api/items</td>
            </tr>
            <tr>
              <td class="px-4 py-2"><code>server/api/items/index.post.ts</code></td>
              <td class="px-4 py-2 text-[var(--ui-text-muted)]">POST /api/items</td>
            </tr>
            <tr>
              <td class="px-4 py-2"><code>server/api/items/[id].get.ts</code></td>
              <td class="px-4 py-2 text-[var(--ui-text-muted)]">GET /api/items/:id</td>
            </tr>
            <tr>
              <td class="px-4 py-2"><code>server/api/items/[id].patch.ts</code></td>
              <td class="px-4 py-2 text-[var(--ui-text-muted)]">PATCH /api/items/:id</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
