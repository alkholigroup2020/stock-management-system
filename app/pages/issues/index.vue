<script setup lang="ts">
useSeoMeta({
  title: "Design System - Food Stock Control System",
  description: "Comprehensive design system showcase and testing page",
});

const toast = useToast();

const showNotification = (color: string) => {
  toast.add({
    title: `${color} notification`,
    description: "This is a test notification message",
    color: color as any,
  });
};
</script>

<template>
  <div class="min-h-screen bg-[var(--ui-bg)]">
    <div class="container mx-auto px-4 py-8">
      <!-- Header Section -->
      <div class="mb-8">
        <h1 class="text-display">Design System Showcase</h1>
        <p class="text-caption mt-2">
          Comprehensive testing of all design system components, semantic
          tokens, and utility classes
        </p>
      </div>

      <!-- Section 1: Nuxt UI Button Colors -->
      <div class="card-elevated mb-8 p-6">
        <h2 class="text-heading mb-6">1. Nuxt UI Button Colors</h2>

        <div class="space-y-6">
          <div>
            <h3 class="text-subheading mb-3">Solid Variant</h3>
            <div class="flex flex-wrap gap-3">
              <UButton color="primary" variant="solid">Primary (Navy)</UButton>
              <UButton color="secondary" variant="solid"
                >Secondary (Emerald)</UButton
              >
              <UButton color="success" variant="solid">Success</UButton>
              <UButton color="info" variant="solid">Info</UButton>
              <UButton color="warning" variant="solid">Warning</UButton>
              <UButton color="error" variant="solid">Error</UButton>
              <UButton color="neutral" variant="solid">Neutral</UButton>
            </div>
          </div>

          <div>
            <h3 class="text-subheading mb-3">Outline Variant</h3>
            <div class="flex flex-wrap gap-3">
              <UButton color="primary" variant="outline">Primary</UButton>
              <UButton color="secondary" variant="outline">Secondary</UButton>
              <UButton color="success" variant="outline">Success</UButton>
              <UButton color="error" variant="outline">Error</UButton>
            </div>
          </div>

          <div>
            <h3 class="text-subheading mb-3">Button Sizes</h3>
            <div class="flex flex-wrap items-center gap-3">
              <UButton color="primary" size="xs">XS</UButton>
              <UButton color="primary" size="sm">SM</UButton>
              <UButton color="primary" size="md">MD</UButton>
              <UButton color="primary" size="lg">LG</UButton>
              <UButton color="primary" size="xl">XL</UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Semantic Background Tokens -->
      <div class="card-elevated mb-8 p-6">
        <h2 class="text-heading mb-6">2. Semantic Background Tokens</h2>

        <div class="space-y-4">
          <div
            class="bg-[var(--ui-bg)] p-4 rounded-lg border-2 border-dashed border-[var(--ui-border)]"
          >
            <p class="text-body">
              <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
                >--ui-bg</code
              >
              - Page background
            </p>
          </div>

          <div
            class="bg-[var(--ui-bg-elevated)] p-4 rounded-lg border-2 border-dashed border-[var(--ui-border)]"
          >
            <p class="text-body">
              <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
                >--ui-bg-elevated</code
              >
              - Cards, modals, elevated surfaces
            </p>
          </div>

          <div
            class="bg-[var(--ui-bg-muted)] p-4 rounded-lg border-2 border-dashed border-[var(--ui-border)]"
          >
            <p class="text-body">
              <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
                >--ui-bg-muted</code
              >
              - Subtle backgrounds, disabled states
            </p>
          </div>

          <div
            class="bg-[var(--ui-bg-accented)] p-4 rounded-lg border-2 border-dashed border-[var(--ui-border)]"
          >
            <p class="text-body">
              <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
                >--ui-bg-accented</code
              >
              - Highlighted sections
            </p>
          </div>

          <div
            class="bg-[var(--ui-bg-inverted)] p-4 rounded-lg border-2 border-dashed border-[var(--ui-border-inverted)]"
          >
            <p class="text-[var(--ui-text-inverted)]">
              <code class="bg-gray-800 dark:bg-gray-100 px-2 py-1 rounded"
                >--ui-bg-inverted</code
              >
              - Inverted surfaces (dark in light mode, light in dark mode)
            </p>
          </div>
        </div>
      </div>

      <!-- Section 3: Semantic Text Tokens -->
      <div class="card-elevated mb-8 p-6">
        <h2 class="text-heading mb-6">3. Semantic Text Tokens</h2>

        <div class="space-y-3">
          <p class="text-[var(--ui-text)]">
            <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs"
              >--ui-text</code
            >
            - Primary text color (main content)
          </p>
          <p class="text-[var(--ui-text-muted)]">
            <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs"
              >--ui-text-muted</code
            >
            - Secondary/helper text (descriptions, labels)
          </p>
          <p class="text-[var(--ui-text-dimmed)]">
            <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs"
              >--ui-text-dimmed</code
            >
            - Disabled/inactive text
          </p>
          <p class="text-[var(--ui-text-highlighted)]">
            <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs"
              >--ui-text-highlighted</code
            >
            - Important/emphasized text
          </p>
        </div>
      </div>

      <!-- Section 4: Business-Specific Badges -->
      <div class="card-elevated mb-8 p-6">
        <h2 class="text-heading mb-6">4. Business-Specific Badge Classes</h2>

        <div class="space-y-6">
          <div>
            <h3 class="text-subheading mb-3">Stock Status Badges</h3>
            <div class="flex flex-wrap gap-3">
              <span class="badge-stock-healthy">Healthy Stock</span>
              <span class="badge-stock-low">Low Stock</span>
              <span class="badge-stock-critical">Critical Stock</span>
              <span class="badge-stock-pending">Stock in Transfer</span>
            </div>
            <p class="text-caption mt-2">
              Use these for displaying real-time stock status indicators
            </p>
          </div>

          <div>
            <h3 class="text-subheading mb-3">Approval Workflow Badges</h3>
            <div class="flex flex-wrap gap-3">
              <span class="badge-draft">Draft</span>
              <span class="badge-pending">Pending Approval</span>
              <span class="badge-approved">Approved</span>
              <span class="badge-rejected">Rejected</span>
            </div>
            <p class="text-caption mt-2">
              Use these for PRF/PO, Transfers, and Period Close approval states
            </p>
          </div>

          <div>
            <h3 class="text-subheading mb-3">Standard Feedback Badges</h3>
            <div class="flex flex-wrap gap-3">
              <span class="badge-primary">Primary</span>
              <span class="badge-success">Success</span>
              <span class="badge-warning">Warning</span>
              <span class="badge-error">Error</span>
              <span class="badge-info">Info</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 5: Business Token Demonstrations -->
      <div class="card-elevated mb-8 p-6">
        <h2 class="text-heading mb-6">5. Business-Specific Semantic Tokens</h2>

        <div class="space-y-6">
          <div>
            <h3 class="text-subheading mb-3">Stock Status Colors</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                class="p-4 rounded-lg"
                :style="{
                  backgroundColor: 'var(--ui-stock-healthy)',
                  color: 'white',
                }"
              >
                <code class="text-xs">--ui-stock-healthy</code>
                <p class="mt-1 text-sm">Normal stock levels, ready for use</p>
              </div>
              <div
                class="p-4 rounded-lg"
                :style="{
                  backgroundColor: 'var(--ui-stock-low)',
                  color: 'white',
                }"
              >
                <code class="text-xs">--ui-stock-low</code>
                <p class="mt-1 text-sm">
                  Below minimum threshold, needs attention
                </p>
              </div>
              <div
                class="p-4 rounded-lg"
                :style="{
                  backgroundColor: 'var(--ui-stock-critical)',
                  color: 'white',
                }"
              >
                <code class="text-xs">--ui-stock-critical</code>
                <p class="mt-1 text-sm">Out of stock, urgent action required</p>
              </div>
              <div
                class="p-4 rounded-lg"
                :style="{
                  backgroundColor: 'var(--ui-stock-pending)',
                  color: 'white',
                }"
              >
                <code class="text-xs">--ui-stock-pending</code>
                <p class="mt-1 text-sm">Stock in transfer between locations</p>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-subheading mb-3">Approval Workflow Colors</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                class="p-4 rounded-lg"
                :style="{
                  backgroundColor: 'var(--ui-status-draft)',
                  color: 'white',
                }"
              >
                <code class="text-xs">--ui-status-draft</code>
                <p class="mt-1 text-sm">Draft/unsaved state</p>
              </div>
              <div
                class="p-4 rounded-lg"
                :style="{
                  backgroundColor: 'var(--ui-status-pending)',
                  color: 'white',
                }"
              >
                <code class="text-xs">--ui-status-pending</code>
                <p class="mt-1 text-sm">Awaiting supervisor/admin approval</p>
              </div>
              <div
                class="p-4 rounded-lg"
                :style="{
                  backgroundColor: 'var(--ui-status-approved)',
                  color: 'white',
                }"
              >
                <code class="text-xs">--ui-status-approved</code>
                <p class="mt-1 text-sm">Approved and completed</p>
              </div>
              <div
                class="p-4 rounded-lg"
                :style="{
                  backgroundColor: 'var(--ui-status-rejected)',
                  color: 'white',
                }"
              >
                <code class="text-xs">--ui-status-rejected</code>
                <p class="mt-1 text-sm">Rejected by supervisor/admin</p>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-subheading mb-3">Period State Colors</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                class="p-4 rounded-lg"
                :style="{
                  backgroundColor: 'var(--ui-period-open)',
                  color: 'white',
                }"
              >
                <code class="text-xs">--ui-period-open</code>
                <p class="mt-1 text-sm">Period accepting transactions</p>
              </div>
              <div
                class="p-4 rounded-lg"
                :style="{
                  backgroundColor: 'var(--ui-period-ready)',
                  color: 'white',
                }"
              >
                <code class="text-xs">--ui-period-ready</code>
                <p class="mt-1 text-sm">Location ready for period close</p>
              </div>
              <div
                class="p-4 rounded-lg"
                :style="{
                  backgroundColor: 'var(--ui-period-closed)',
                  color: 'white',
                }"
              >
                <code class="text-xs">--ui-period-closed</code>
                <p class="mt-1 text-sm">Period locked, no modifications</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 6: Utility Surface Classes -->
      <div class="card-elevated mb-8 p-6">
        <h2 class="text-heading mb-6">6. Utility Surface Classes</h2>

        <div class="space-y-4">
          <div class="card-elevated p-4">
            <h4 class="font-semibold mb-2">.card-elevated</h4>
            <p class="text-caption">
              Elevated card with border, shadow, and hover effect
            </p>
          </div>

          <div class="card-muted p-4">
            <h4 class="font-semibold mb-2">.card-muted</h4>
            <p class="text-caption">
              Subtle background card for secondary content
            </p>
          </div>

          <div class="surface-inverted p-4">
            <h4 class="font-semibold mb-2">.surface-inverted</h4>
            <p class="text-caption">
              Inverted surface (dark in light mode, light in dark mode)
            </p>
          </div>
        </div>
      </div>

      <!-- Section 7: Form Styling -->
      <div class="card-elevated mb-8 p-6">
        <h2 class="text-heading mb-6">7. Form Utility Classes</h2>

        <div class="max-w-md space-y-4">
          <div>
            <label class="form-label">Full Name</label>
            <input
              type="text"
              class="form-input"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label class="form-label">Email Address</label>
            <input
              type="email"
              class="form-input"
              placeholder="you@example.com"
            />
            <span class="form-error">Please enter a valid email address</span>
          </div>

          <div>
            <label class="form-label">Message</label>
            <textarea
              class="form-input"
              rows="4"
              placeholder="Enter your message"
            />
          </div>

          <div class="flex gap-3">
            <UButton color="primary">Submit</UButton>
            <UButton color="neutral" variant="outline">Cancel</UButton>
          </div>
        </div>
      </div>

      <!-- Section 8: Typography Classes -->
      <div class="card-elevated mb-8 p-6">
        <h2 class="text-heading mb-6">8. Typography Utility Classes</h2>

        <div class="space-y-4">
          <div>
            <p class="text-display">Display Heading</p>
            <code class="text-xs text-gray-500">.text-display</code>
          </div>
          <div>
            <p class="text-heading">Section Heading</p>
            <code class="text-xs text-gray-500">.text-heading</code>
          </div>
          <div>
            <p class="text-subheading">Subheading</p>
            <code class="text-xs text-gray-500">.text-subheading</code>
          </div>
          <div>
            <p class="text-body">Body text for paragraphs and content</p>
            <code class="text-xs text-gray-500">.text-body</code>
          </div>
          <div>
            <p class="text-label">Label text for form fields</p>
            <code class="text-xs text-gray-500">.text-label</code>
          </div>
          <div>
            <p class="text-caption">Caption text for small notes</p>
            <code class="text-xs text-gray-500">.text-caption</code>
          </div>
        </div>
      </div>

      <!-- Section 9: Alerts & Notifications -->
      <div class="card-elevated mb-8 p-6">
        <h2 class="text-heading mb-6">9. Alerts & Notifications</h2>

        <div class="space-y-4 mb-6">
          <UAlert
            color="primary"
            title="Primary Alert"
            description="This is a primary alert using navy blue color for important information."
          />
          <UAlert
            color="secondary"
            title="Secondary Alert"
            description="This is a secondary alert using emerald green color."
          />
          <UAlert
            color="success"
            title="Success Alert"
            description="Operation completed successfully! Stock level updated."
          />
          <UAlert
            color="warning"
            title="Warning: Low Stock Detected"
            description="Item 'Tomatoes' is below minimum threshold at Kitchen location."
          />
          <UAlert
            color="error"
            title="Error: Insufficient Stock"
            description="Cannot issue 100 KG. Only 75 KG available at current location."
          />
          <UAlert
            color="info"
            title="Info: Period Close Pending"
            description="All locations are ready. Admin approval required to close period."
          />
        </div>

        <h3 class="text-subheading mb-3">Toast Notifications</h3>
        <div class="flex flex-wrap gap-3">
          <UButton color="primary" @click="showNotification('primary')"
            >Primary Toast</UButton
          >
          <UButton color="secondary" @click="showNotification('secondary')"
            >Secondary Toast</UButton
          >
          <UButton color="success" @click="showNotification('success')"
            >Success Toast</UButton
          >
          <UButton color="warning" @click="showNotification('warning')"
            >Warning Toast</UButton
          >
          <UButton color="error" @click="showNotification('error')"
            >Error Toast</UButton
          >
        </div>
      </div>

      <!-- Section 10: Real-World Examples -->
      <div class="card-elevated mb-8 p-6">
        <h2 class="text-heading mb-6">10. Real-World Use Cases</h2>

        <div class="space-y-6">
          <!-- Stock Item Card -->
          <div>
            <h3 class="text-subheading mb-3">Stock Item Card Example</h3>
            <div class="card-elevated p-4 max-w-md">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <h4 class="text-[var(--ui-text-highlighted)] font-semibold">
                    Tomatoes (Fresh)
                  </h4>
                  <p class="text-caption">Code: TOM-001 | Unit: KG</p>
                </div>
                <span class="badge-stock-low">Low Stock</span>
              </div>
              <div
                class="grid grid-cols-2 gap-4 p-3 bg-[var(--ui-bg-muted)] rounded-lg"
              >
                <div>
                  <p class="text-label">On Hand</p>
                  <p class="text-[var(--ui-text)] font-bold">15.5 KG</p>
                </div>
                <div>
                  <p class="text-label">WAC</p>
                  <p class="text-[var(--ui-text)] font-bold">SAR 12.50</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Transfer Request Card -->
          <div>
            <h3 class="text-subheading mb-3">Transfer Request Card Example</h3>
            <div class="card-elevated p-4 max-w-md">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <h4 class="text-[var(--ui-text-highlighted)] font-semibold">
                    Transfer #TR-2024-001
                  </h4>
                  <p class="text-caption">Kitchen → Store | 15 May 2024</p>
                </div>
                <span class="badge-pending">Pending Approval</span>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-[var(--ui-text-muted)]">Items:</span>
                  <span class="text-[var(--ui-text)]">8 items</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-[var(--ui-text-muted)]">Total Value:</span>
                  <span class="text-[var(--ui-text)] font-semibold"
                    >SAR 1,250.00</span
                  >
                </div>
              </div>
              <div class="flex gap-2 mt-4">
                <UButton color="success" size="sm" block>Approve</UButton>
                <UButton color="error" variant="outline" size="sm" block
                  >Reject</UButton
                >
              </div>
            </div>
          </div>

          <!-- Period Status Card -->
          <div>
            <h3 class="text-subheading mb-3">Period Status Card Example</h3>
            <div class="card-elevated p-4 max-w-md">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <h4 class="text-[var(--ui-text-highlighted)] font-semibold">
                    May 2024 Period
                  </h4>
                  <p class="text-caption">01 May - 31 May 2024</p>
                </div>
                <span
                  class="badge-base"
                  :style="{
                    backgroundColor: 'var(--ui-period-open)',
                    color: 'white',
                  }"
                  >Open</span
                >
              </div>
              <div class="space-y-2 mb-4">
                <div class="flex items-center gap-2">
                  <span class="text-green-500">✓</span>
                  <span class="text-sm text-[var(--ui-text)]"
                    >Kitchen - Ready</span
                  >
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-green-500">✓</span>
                  <span class="text-sm text-[var(--ui-text)]"
                    >Store - Ready</span
                  >
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-amber-500">○</span>
                  <span class="text-sm text-[var(--ui-text-muted)]"
                    >Central - Pending</span
                  >
                </div>
              </div>
              <UButton color="primary" disabled block
                >Close Period (Waiting for all locations)</UButton
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Section 11: Summary -->
      <div class="card-elevated p-6">
        <h2 class="text-heading mb-4">Summary</h2>
        <div class="prose dark:prose-invert max-w-none">
          <p class="text-body">This comprehensive design system provides:</p>
          <ul class="text-body space-y-2 mt-3">
            <li>
              <strong class="text-[var(--ui-text-highlighted)]"
                >Semantic color tokens</strong
              >
              for backgrounds, text, and borders that adapt to light/dark mode
            </li>
            <li>
              <strong class="text-[var(--ui-text-highlighted)]"
                >Business-specific tokens</strong
              >
              for stock status, approval workflows, and period states
            </li>
            <li>
              <strong class="text-[var(--ui-text-highlighted)]"
                >Utility classes</strong
              >
              for common patterns (cards, forms, badges, typography)
            </li>
            <li>
              <strong class="text-[var(--ui-text-highlighted)]"
                >Nuxt UI integration</strong
              >
              with custom navy/emerald brand colors
            </li>
            <li>
              <strong class="text-[var(--ui-text-highlighted)]"
                >Accessibility features</strong
              >
              including focus rings, color contrast, and reduced motion support
            </li>
          </ul>
          <p class="text-caption mt-4">
            For complete documentation, see
            <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
              >/project-docs/DESIGN_SYSTEM.md</code
            >
            and
            <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
              >CLAUDE.md</code
            >
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
