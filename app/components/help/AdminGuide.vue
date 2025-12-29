<script setup lang="ts">
import type { Ref } from "vue";

// Admin Guide - Documentation for Admin role users
const expandedSections = ref<string[]>([]);

const toggleSection = (section: string) => {
  // Accordion behavior: only one section open at a time
  if (expandedSections.value.includes(section)) {
    expandedSections.value = [];
  } else {
    expandedSections.value = [section];
  }
};

const isExpanded = (section: string) => expandedSections.value.includes(section);

// Inject target section for deep linking from search
const targetSubSection = inject<Ref<string | null>>("helpTargetSection", ref(null));

// Watch for target section changes to expand and scroll
watch(
  targetSubSection,
  (newSection) => {
    if (newSection) {
      // Expand the section if not already expanded
      if (!expandedSections.value.includes(newSection)) {
        expandedSections.value.push(newSection);
      }
      // Scroll to the section after DOM update
      nextTick(() => {
        const element = document.getElementById(`admin-section-${newSection}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        // Clear the target after navigation
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
    <div class="pb-4 border-b border-[var(--ui-border)]">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
        Admin Guide
      </h2>
      <p class="text-sm text-[var(--ui-text-muted)] mt-1">
        System administration and configuration
      </p>
    </div>

    <!-- User Management Section -->
    <section
      id="admin-section-users"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('users')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-users" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">User Management</span>
        </span>
        <UIcon
          :name="isExpanded('users') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('users')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Users are individuals who access the system. Each user has a role that determines what
          they can see and do. Proper user management ensures that only authorized personnel can
          perform sensitive operations like approving transfers or closing periods. The system
          tracks all actions by user for audit purposes.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">User Roles Explained</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Operator:</strong> Front-line staff who handle day-to-day operations. They can
              post deliveries, record issues, and enter POB counts at their assigned locations only.
              They cannot approve transfers or access administrative functions.
            </li>
            <li>
              <strong>Supervisor:</strong> Oversight role with approval authority. Supervisors can
              approve or reject transfer requests, manage reconciliations, create manual NCRs, and
              access all locations. They cannot manage system settings or close periods.
            </li>
            <li>
              <strong>Admin:</strong> Full system control. Admins can do everything Supervisors can,
              plus manage users, locations, items, suppliers, set period prices, and execute period
              close. Use this role sparingly.
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Creating a New User</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Click <strong>Users</strong> in the left menu</li>
            <li>Click <strong>Create User</strong></li>
            <li>Enter Full Name, Username, Email, Password</li>
            <li>Select <strong>Role</strong>: Operator, Supervisor, or Admin</li>
            <li>Assign <strong>Locations</strong> (required for Operators)</li>
            <li>Click <strong>Create User</strong></li>
          </ol>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-warning)]/30">
          <p class="text-sm text-[var(--ui-warning)] flex items-start gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="shrink-0 mt-0.5" />
            <span><strong>Important:</strong> Operators MUST have at least one location assigned. Supervisors and Admins automatically have access to all locations.</span>
          </p>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Deactivating vs Deleting</h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            When a user leaves or should no longer have access:
          </p>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Deactivate (Recommended):</strong> User cannot log in, but their name remains
              on historical transactions. This preserves the audit trail.
            </li>
            <li>
              <strong>Delete:</strong> Permanent removal from the system. Only use if the user was
              created by mistake and has no transactions.
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Location Management Section -->
    <section
      id="admin-section-locations"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('locations')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-map-pin" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Location Management</span>
        </span>
        <UIcon
          :name="isExpanded('locations') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('locations')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Locations represent physical places where stock is stored and managed. Each location
          maintains its own inventory levels, Weighted Average Cost (WAC), and transaction history.
          Stock can be transferred between locations through the transfer workflow. All transactions
          (deliveries, issues, transfers) are recorded against a specific location.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Location Types</h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            Location types help categorize and organize your facilities:
          </p>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li><strong>Kitchen:</strong> Production and cooking areas that consume ingredients</li>
            <li><strong>Store:</strong> Retail or distribution points that issue stock to end users</li>
            <li><strong>Central:</strong> Main storage facility, typically receives bulk deliveries</li>
            <li><strong>Warehouse:</strong> Bulk storage for overflow or long-term holding</li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Creating a New Location</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Click <strong>Locations</strong> in the left menu</li>
            <li>Click <strong>New Location</strong></li>
            <li>Enter Location Name and Code (code should be short and unique)</li>
            <li>Select Type: Kitchen, Store, Central, or Warehouse</li>
            <li>Click <strong>Create Location</strong></li>
          </ol>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)]">
          <p class="text-sm text-[var(--ui-text-muted)] flex items-start gap-2">
            <UIcon name="i-heroicons-information-circle" class="shrink-0 mt-0.5 text-[var(--ui-info)]" />
            <span>Each location has independent stock balances. The same item can have different quantities and WAC values at different locations.</span>
          </p>
        </div>
      </div>
    </section>

    <!-- Item Management Section -->
    <section
      id="admin-section-items"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('items')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-cube" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Item Management</span>
        </span>
        <UIcon
          :name="isExpanded('items') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('items')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Items are the products and materials you track in inventory. Each item has a unique code,
          name, category, and unit of measure. Items are used in deliveries (receiving stock),
          issues (consuming stock), and transfers (moving stock). Period prices are set per item
          and control variance detection during deliveries.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Item Properties</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li><strong>Code:</strong> Unique identifier (e.g., "RICE-001", "CHICKEN-BREAST")</li>
            <li><strong>Name:</strong> Descriptive name shown throughout the system</li>
            <li><strong>Category:</strong> Grouping for reporting and filtering (e.g., "Dry Goods", "Proteins")</li>
            <li><strong>Unit of Measure:</strong> How the item is counted and priced</li>
            <li><strong>Minimum Stock:</strong> Threshold for low stock alerts (optional)</li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Units of Measure</h4>
          <div class="flex flex-wrap gap-2 mb-2">
            <UBadge color="neutral" variant="subtle">KG</UBadge>
            <UBadge color="neutral" variant="subtle">EA (Each)</UBadge>
            <UBadge color="neutral" variant="subtle">LTR</UBadge>
            <UBadge color="neutral" variant="subtle">BOX</UBadge>
            <UBadge color="neutral" variant="subtle">CASE</UBadge>
            <UBadge color="neutral" variant="subtle">PACK</UBadge>
          </div>
          <p class="text-sm text-[var(--ui-text-muted)]">
            Choose the unit that matches how you purchase and use the item. WAC calculations and
            stock quantities are based on this unit.
          </p>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Creating a New Item</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Click <strong>Items</strong> in the left menu</li>
            <li>Click <strong>New Item</strong></li>
            <li>Enter Item Code and Name</li>
            <li>Select Category and Unit of Measure</li>
            <li>Optionally set Minimum Stock Level for alerts</li>
            <li>Click <strong>Create Item</strong></li>
          </ol>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)]">
          <p class="text-sm text-[var(--ui-text-muted)] flex items-start gap-2">
            <UIcon name="i-heroicons-information-circle" class="shrink-0 mt-0.5 text-[var(--ui-info)]" />
            <span>Avoid changing the unit of measure on existing items with stock history. Create a new item instead to maintain accurate records.</span>
          </p>
        </div>
      </div>
    </section>

    <!-- Supplier Management Section -->
    <section
      id="admin-section-suppliers"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('suppliers')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-building-storefront" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Supplier Management</span>
        </span>
        <UIcon
          :name="isExpanded('suppliers') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('suppliers')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Suppliers are the vendors who provide goods to your organization. When posting a delivery,
          you must select a supplier. This allows tracking of which supplier provided which items,
          helps identify supplier-specific issues (via NCRs), and supports procurement reporting.
          Contact information stored here can be used for communication regarding orders or issues.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Supplier Properties</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li><strong>Code:</strong> Short unique identifier (e.g., "SUP-001", "SYSCO")</li>
            <li><strong>Name:</strong> Full supplier/company name</li>
            <li><strong>Contact Person:</strong> Primary contact for orders and issues</li>
            <li><strong>Email/Phone:</strong> Contact details for communication</li>
            <li><strong>Payment Terms:</strong> Standard terms (e.g., "Net 30", "COD")</li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Creating a New Supplier</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Click <strong>Suppliers</strong> in the left menu</li>
            <li>Click <strong>New Supplier</strong></li>
            <li>Enter Supplier Name and Code</li>
            <li>Enter Contact Person, Email, Phone</li>
            <li>Enter Payment Terms (e.g., "Net 30")</li>
            <li>Click <strong>Create Supplier</strong></li>
          </ol>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)]">
          <p class="text-sm text-[var(--ui-text-muted)] flex items-start gap-2">
            <UIcon name="i-heroicons-information-circle" class="shrink-0 mt-0.5 text-[var(--ui-info)]" />
            <span>NCRs (Non-Conformance Reports) are linked to suppliers through deliveries, helping track supplier performance over time.</span>
          </p>
        </div>
      </div>
    </section>

    <!-- Period Management Section -->
    <section
      id="admin-section-periods"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('periods')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-calendar" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Period Management</span>
        </span>
        <UIcon
          :name="isExpanded('periods') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('periods')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Periods represent accounting months. All transactions occur within a period, and prices
          are locked when a period opens. This ensures consistent costing throughout the month and
          enables accurate period-end reconciliation. Only one period can be OPEN at a time. Periods
          must be closed in sequence before opening a new one.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Period Lifecycle</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UBadge color="neutral" variant="subtle" size="sm">DRAFT</UBadge>
              <span>Period created but not started. Set item prices during this phase.</span>
            </li>
            <li class="flex items-center gap-2">
              <UBadge color="success" variant="subtle" size="sm">OPEN</UBadge>
              <span>Active period. Transactions can be posted. Prices are locked.</span>
            </li>
            <li class="flex items-center gap-2">
              <UBadge color="warning" variant="subtle" size="sm">PENDING_CLOSE</UBadge>
              <span>Close initiated. Locations being finalized. No new transactions.</span>
            </li>
            <li class="flex items-center gap-2">
              <UBadge color="error" variant="subtle" size="sm">CLOSED</UBadge>
              <span>Period ended. All data is locked. Opening balances set for next period.</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Why Prices Lock</h4>
          <p class="text-sm text-[var(--ui-text-muted)]">
            When a period opens, all item prices are locked. If a delivery comes in at a different
            price than the locked period price, the system automatically generates a Price Variance
            NCR. This ensures cost consistency and flags unexpected price changes for review.
          </p>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Setting Period Prices</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Click <strong>Periods</strong> in the left menu</li>
            <li>Click on a DRAFT period</li>
            <li>Click <strong>Manage Prices</strong></li>
            <li>Enter prices for each item (or import from previous period)</li>
            <li>Click <strong>Save Prices</strong></li>
            <li>When ready, click <strong>Open Period</strong></li>
          </ol>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-error)]/30">
          <p class="text-sm text-[var(--ui-error)] flex items-start gap-2">
            <UIcon name="i-heroicons-exclamation-circle" class="shrink-0 mt-0.5" />
            <span><strong>Warning:</strong> Once a period is opened, prices cannot be changed. Review all prices carefully before opening.</span>
          </p>
        </div>
      </div>
    </section>

    <!-- Period Close Section -->
    <section
      id="admin-section-periodClose"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('periodClose')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-lock-closed" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Period Close</span>
        </span>
        <UIcon
          :name="isExpanded('periodClose') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('periodClose')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Period close is the process of finalizing a month's accounting. It creates closing stock
          snapshots for each location, locks all transactions, and sets opening balances for the
          next period. This is a coordinated process - all locations must be ready and close
          simultaneously. Only Admins can execute period close.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Pre-Close Checklist</h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            Before closing, verify all of the following:
          </p>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
              <span>All deliveries posted (no drafts remaining)</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
              <span>All issues posted</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
              <span>All transfers completed (no pending approvals)</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
              <span>All location reconciliations reviewed and adjustments entered</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
              <span>All locations marked as READY by their supervisors</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Executing Period Close</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Click <strong>Period Close</strong> in the left menu</li>
            <li>Review the checklist - all items must be green</li>
            <li>Review location status - all must show READY</li>
            <li>Click <strong>Close Period</strong></li>
            <li>Confirm in the dialog (this cannot be undone)</li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">What Happens During Close</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>Closing stock snapshots are created for each location</li>
            <li>Period status changes to CLOSED permanently</li>
            <li>Opening balances for the next period are set from closing values</li>
            <li>No further changes can be made to transactions in the closed period</li>
            <li>Next period (if in DRAFT) can now be opened</li>
          </ul>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-error)]/30">
          <p class="text-sm text-[var(--ui-error)] flex items-start gap-2">
            <UIcon name="i-heroicons-exclamation-circle" class="shrink-0 mt-0.5" />
            <span><strong>Warning:</strong> Period close cannot be undone. All locations close simultaneously. Ensure all data is correct before proceeding.</span>
          </p>
        </div>
      </div>
    </section>

    <!-- Quick Reference -->
    <section class="p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
      <h3 class="font-semibold text-[var(--ui-text-highlighted)] mb-3 flex items-center gap-2">
        <UIcon name="i-heroicons-bolt" class="text-[var(--ui-primary)]" />
        Key Admin Rules
      </h3>
      <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-calendar" class="text-[var(--ui-warning)]" />
          <span><strong>One active period:</strong> Close current period before opening the next one</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-lock-closed" class="text-[var(--ui-error)]" />
          <span><strong>Prices lock on open:</strong> Set and verify all prices before opening a period</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)]" />
          <span><strong>Cannot undo close:</strong> Period close is permanent - verify everything first</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-user-minus" class="text-[var(--ui-info)]" />
          <span><strong>Deactivate, don't delete:</strong> Preserve user audit trails by deactivating instead</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-map-pin" class="text-[var(--ui-primary)]" />
          <span><strong>Operators need locations:</strong> Always assign at least one location to Operators</span>
        </li>
      </ul>
    </section>
  </div>
</template>
