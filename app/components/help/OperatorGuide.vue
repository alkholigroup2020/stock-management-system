<script setup lang="ts">
import type { Ref } from "vue";

// Operator Guide - Documentation for Operator role users
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
        const element = document.getElementById(`operator-section-${newSection}`);
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
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Operator Guide</h2>
      <p class="text-sm text-[var(--ui-text-muted)] mt-1">
        Quick reference for day-to-day stock operations
      </p>
    </div>

    <!-- Deliveries Section -->
    <section
      id="operator-section-deliveries"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('deliveries')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-truck" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Deliveries</span>
        </span>
        <UIcon
          :name="isExpanded('deliveries') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('deliveries')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Deliveries record stock received from suppliers. When you post a delivery, the system adds
          the received quantities to your location's inventory and recalculates the Weighted Average
          Cost (WAC) for each item. Accurate delivery entry is critical because it directly affects
          stock levels, valuation, and period-end reconciliation.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            What Happens When You Post
          </h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-plus-circle" class="text-[var(--ui-success)]" />
              <span>Stock quantities increase at your location</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-calculator" class="text-[var(--ui-primary)]" />
              <span>WAC is recalculated based on new quantities and prices</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-document-text" class="text-[var(--ui-warning)]" />
              <span>Price variances automatically generate NCRs</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-lock-closed" class="text-[var(--ui-text-muted)]" />
              <span>Posted deliveries cannot be edited or deleted</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            Creating a New Delivery
          </h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>
              Click
              <strong>Deliveries</strong>
              in the left menu
            </li>
            <li>
              Click the
              <strong>New Delivery</strong>
              button
            </li>
            <li>
              Select the
              <strong>Supplier</strong>
              from the dropdown
            </li>
            <li>
              Enter the
              <strong>Invoice Number</strong>
              (from supplier's document, must be unique)
            </li>
            <li>
              Enter the
              <strong>Delivery Date</strong>
              (when goods were received)
            </li>
            <li>Add line items: select item, enter quantity received, enter unit price</li>
            <li>
              Review totals and click
              <strong>Post Delivery</strong>
              to finalize
            </li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Draft vs Posted</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Save as Draft:</strong>
              Use when you need to pause entry or verify details. The delivery can be edited or
              deleted. Stock is NOT updated until posted.
            </li>
            <li>
              <strong>Post Delivery:</strong>
              Finalizes the delivery. Stock levels update immediately. The delivery is locked and
              becomes part of the permanent record.
            </li>
          </ul>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-warning)]/30">
          <p class="text-sm text-[var(--ui-warning)] flex items-start gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="shrink-0 mt-0.5" />
            <span>
              <strong>Price Variance:</strong>
              If the delivery price differs from the locked period price, an NCR is automatically
              created. This is normal and expected - it helps track price changes.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Items Import Section -->
    <section
      id="operator-section-items-import"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('items-import')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-up-tray" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Items Import</span>
        </span>
        <UIcon
          :name="
            isExpanded('items-import') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('items-import')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Items Import allows you to quickly add or update multiple items at once using an Excel or
          CSV file. Instead of manually creating items one-by-one, you can prepare a spreadsheet
          with all item details and import them in a single operation. The system validates all data
          before importing and shows you a preview so you can review and fix any errors before
          committing changes.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">When to Use Import</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Initial Setup:</strong>
              When first setting up the system and you have a large inventory list to add.
            </li>
            <li>
              <strong>Bulk Updates:</strong>
              When you need to update prices, categories, or minimum stock levels for many items at
              once.
            </li>
            <li>
              <strong>New Product Range:</strong>
              When adding a new supplier's entire product catalog.
            </li>
            <li>
              <strong>Regular Updates:</strong>
              When receiving supplier price lists that need to be reflected in the system.
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            Preparing Your Import File
          </h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            Your file must include these columns (exact spelling required):
          </p>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span
                ><strong>Item Code</strong> - Unique identifier (e.g., "RICE-001")</span
              >
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span
                ><strong>Name</strong> - Item description (e.g., "Basmati Rice 5KG")</span
              >
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span
                ><strong>Category</strong> - e.g., "Dry Goods", "Dairy", "Meat"</span
              >
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span><strong>Unit</strong> - e.g., "KG", "EA", "LTR", "BOX"</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span><strong>Min Stock</strong> - Minimum quantity threshold</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span><strong>Active</strong> - "Yes" or "No"</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            Importing Items Step-by-Step
          </h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>
              Click
              <strong>Items</strong>
              in the left menu
            </li>
            <li>
              Click the
              <strong>Import Items</strong>
              button (top right)
            </li>
            <li>
              Click
              <strong>Download Template</strong>
              to get the correct format (optional but recommended)
            </li>
            <li>Prepare your Excel or CSV file with all required columns</li>
            <li>
              Click
              <strong>Choose File</strong>
              and select your prepared file
            </li>
            <li>Click <strong>Upload & Validate</strong></li>
            <li>
              Review the validation results - the system checks for errors and shows warnings for
              any issues
            </li>
            <li>Fix any errors in your file and re-upload if needed</li>
            <li>
              When validation passes, review the preview showing what will be imported
            </li>
            <li>
              Click
              <strong>Import Items</strong>
              to complete the process
            </li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            Understanding Validation Results
          </h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong class="text-[var(--ui-success)]">Valid:</strong>
              Item passes all checks and will be imported successfully.
            </li>
            <li>
              <strong class="text-[var(--ui-error)]">Errors:</strong>
              Critical issues that prevent import (e.g., missing required fields, invalid units).
              You must fix these before importing.
            </li>
            <li>
              <strong class="text-[var(--ui-warning)]">Warnings:</strong>
              Non-critical issues (e.g., duplicate item codes will update existing items). Review
              carefully but import can proceed.
            </li>
            <li>
              <strong>Update vs Create:</strong>
              If an item code already exists, the import will update that item. New codes create new
              items.
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Common Issues & Tips</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Column Names:</strong>
              Make sure column headers match exactly (case-sensitive). Download the template to
              ensure correct format.
            </li>
            <li>
              <strong>Item Codes:</strong>
              Must be unique. If you import an existing code, it will update that item with new
              data.
            </li>
            <li>
              <strong>Units:</strong>
              Only use valid units: KG, EA, LTR, BOX, CASE, PACK. Invalid units will cause errors.
            </li>
            <li>
              <strong>Numbers:</strong>
              Min Stock must be a positive number. Don't include currency symbols or commas.
            </li>
            <li>
              <strong>Active Status:</strong>
              Must be exactly "Yes" or "No" (case doesn't matter).
            </li>
            <li>
              <strong>File Format:</strong>
              Supports .xlsx (Excel) and .csv files. Excel is recommended for preserving formatting.
            </li>
          </ul>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-success)]/30">
          <p class="text-sm text-[var(--ui-success)] flex items-start gap-2">
            <UIcon name="i-heroicons-check-circle" class="shrink-0 mt-0.5" />
            <span>
              <strong>Time Saver:</strong>
              Use the template! Downloading the template ensures you have the correct column names
              and format, reducing errors and saving time.
            </span>
          </p>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)]">
          <p class="text-sm text-[var(--ui-text-muted)] flex items-start gap-2">
            <UIcon
              name="i-heroicons-information-circle"
              class="shrink-0 mt-0.5 text-[var(--ui-info)]"
            />
            <span>
              The import preview shows exactly what will happen. Take time to review it carefully
              before clicking Import Items. Once imported, changes are permanent.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Issues Section -->
    <section
      id="operator-section-issues"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('issues')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-up-tray" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Issues (Stock Usage)</span>
        </span>
        <UIcon
          :name="isExpanded('issues') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('issues')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Issues record stock consumption - items leaving your location for use. Each issue is
          assigned to a Cost Centre (department or purpose) for expense tracking and reporting. When
          posted, stock quantities decrease and the value is calculated using the current WAC.
          Issues are essential for tracking where stock goes and calculating cost-per-person
          metrics.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            What Happens When You Post
          </h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-minus-circle" class="text-[var(--ui-error)]" />
              <span>Stock quantities decrease at your location</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-currency-dollar" class="text-[var(--ui-primary)]" />
              <span>Issue value calculated at current WAC (not purchase price)</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-building-office" class="text-[var(--ui-info)]" />
              <span>Cost is assigned to the selected Cost Centre</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-lock-closed" class="text-[var(--ui-text-muted)]" />
              <span>Posted issues cannot be edited or deleted</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Creating a New Issue</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>
              Click
              <strong>Issues</strong>
              in the left menu
            </li>
            <li>
              Click the
              <strong>New Issue</strong>
              button
            </li>
            <li>
              Select the
              <strong>Issue Date</strong>
            </li>
            <li>
              Select the
              <strong>Cost Centre</strong>
              (where the stock is going)
            </li>
            <li>Add items with quantities to issue</li>
            <li>
              Review and click
              <strong>Create Issue</strong>
              to finalize
            </li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Cost Centres</h4>
          <p class="text-sm text-[var(--ui-text-muted)]">
            Cost Centres represent departments or purposes that consume stock. Common examples
            include Kitchen, Restaurant, Staff Meals, Functions, or Maintenance. Selecting the
            correct Cost Centre ensures accurate expense tracking and reporting.
          </p>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-error)]/30">
          <p class="text-sm text-[var(--ui-error)] flex items-start gap-2">
            <UIcon name="i-heroicons-x-circle" class="shrink-0 mt-0.5" />
            <span>
              <strong>Important:</strong>
              You cannot issue more than available stock. The system will prevent posting if any
              item exceeds the on-hand quantity. Check stock levels first.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Transfer Requests Section -->
    <section
      id="operator-section-transfers"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('transfers')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrows-right-left" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Transfer Requests</span>
        </span>
        <UIcon
          :name="isExpanded('transfers') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('transfers')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Transfers move stock between locations within the organization. As an Operator, you can
          create transfer requests to bring stock to your location from another, or send stock from
          your location elsewhere. All transfers require Supervisor approval before stock actually
          moves. This ensures proper oversight and prevents unauthorized stock movements.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Transfer Workflow</h4>
          <div class="flex items-center gap-2 text-sm text-[var(--ui-text-muted)] flex-wrap mb-2">
            <UBadge color="neutral" variant="subtle">You Create</UBadge>
            <UIcon name="i-heroicons-arrow-right" class="text-[var(--ui-text-dimmed)]" />
            <UBadge color="warning" variant="subtle">Pending Approval</UBadge>
            <UIcon name="i-heroicons-arrow-right" class="text-[var(--ui-text-dimmed)]" />
            <UBadge color="success" variant="subtle">Approved</UBadge>
            <span>or</span>
            <UBadge color="error" variant="subtle">Rejected</UBadge>
          </div>
          <p class="text-sm text-[var(--ui-text-muted)]">
            Stock only moves when a Supervisor approves the transfer. If rejected, no stock movement
            occurs and you'll see the rejection reason.
          </p>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            Creating a Transfer Request
          </h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>
              Click
              <strong>Transfers</strong>
              in the left menu
            </li>
            <li>
              Click
              <strong>New Transfer</strong>
            </li>
            <li>
              Select
              <strong>Source Location</strong>
              (where stock comes from)
            </li>
            <li>
              Select
              <strong>Destination Location</strong>
              (where stock goes to)
            </li>
            <li>Add items with quantities to transfer</li>
            <li>
              Add a
              <strong>Reason</strong>
              explaining why the transfer is needed
            </li>
            <li>
              Click
              <strong>Create Transfer</strong>
            </li>
          </ol>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)]">
          <p class="text-sm text-[var(--ui-text-muted)] flex items-start gap-2">
            <UIcon
              name="i-heroicons-information-circle"
              class="shrink-0 mt-0.5 text-[var(--ui-info)]"
            />
            <span>
              Provide a clear reason for the transfer. This helps Supervisors approve quickly and
              creates a good audit trail.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Stock Viewing Section -->
    <section
      id="operator-section-stock"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('stock')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-chart-bar" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Stock Viewing</span>
        </span>
        <UIcon
          :name="isExpanded('stock') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('stock')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          The Stock Now page shows current inventory levels at your location in real-time. Use it to
          check available quantities before creating issues, identify low stock items that need
          reordering, and understand the value of inventory on hand. Stock levels update immediately
          after deliveries, issues, and approved transfers.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Viewing Current Stock</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>
              Click
              <strong>Stock Now</strong>
              in the left menu
            </li>
            <li>View all items with their quantities and values</li>
            <li>Use the search box to find specific items quickly</li>
            <li>Filter by category to focus on specific item types</li>
            <li>Filter by "Low Stock" to see items below minimum levels</li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            Understanding Stock Values
          </h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>On Hand:</strong>
              The physical quantity currently available at your location. This is what you can issue
              or transfer out.
            </li>
            <li>
              <strong>WAC (Weighted Average Cost):</strong>
              The average cost per unit, calculated from all purchases. Updated each time a delivery
              is posted.
            </li>
            <li>
              <strong>Total Value:</strong>
              On Hand quantity multiplied by WAC. Represents the monetary value of that item's
              inventory.
            </li>
            <li>
              <strong>Min Stock:</strong>
              The minimum quantity threshold. Items below this level are flagged as "Low Stock" and
              may need reordering.
            </li>
          </ul>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)]">
          <p class="text-sm text-[var(--ui-text-muted)] flex items-start gap-2">
            <UIcon
              name="i-heroicons-information-circle"
              class="shrink-0 mt-0.5 text-[var(--ui-info)]"
            />
            <span>
              Check stock levels before creating issues to avoid errors. The system prevents issuing
              more than available, but checking first saves time.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- POB Entry Section -->
    <section
      id="operator-section-pob"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('pob')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-users" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">POB Entry</span>
        </span>
        <UIcon
          :name="isExpanded('pob') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('pob')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          POB (Persons On Board) tracks daily headcount at your location. This data is used to
          calculate mandays (total person-days) for the period, which enables cost-per-person
          reporting. Accurate POB entry is essential for meaningful food cost analysis and
          budgeting. Enter counts daily to maintain accurate records.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            Understanding POB Fields
          </h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Mandays:</strong>
              Regular staff/crew present at the location for that day.
            </li>
            <li>
              <strong>Visitors Meals:</strong>
              Additional personnel such as visitors, contractors, or temporary staff who consume
              meals/resources.
            </li>
            <li>
              <strong>Total:</strong>
              Automatically calculated as Mandays + Visitors Meals. This is the number used for
              cost-per-person calculations.
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Entering Daily Counts</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>
              Click
              <strong>POB</strong>
              in the left menu
            </li>
            <li>Find the date you want to enter (current month is shown)</li>
            <li>
              Enter
              <strong>Mandays</strong>
              for that day
            </li>
            <li>
              Enter
              <strong>Visitors Meals</strong>
              if applicable (or leave as 0)
            </li>
            <li>Total is calculated automatically</li>
            <li>
              Move to the next field - entries
              <strong>auto-save</strong>
            </li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            How Mandays Are Calculated
          </h4>
          <p class="text-sm text-[var(--ui-text-muted)]">
            Mandays = Sum of all daily totals for the period. For example, if you have 50 people for
            30 days, that's 1,500 mandays. This is used to calculate cost-per-person metrics like
            "food cost per manday."
          </p>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-success)]/30">
          <p class="text-sm text-[var(--ui-success)] flex items-start gap-2">
            <UIcon name="i-heroicons-check-circle" class="shrink-0 mt-0.5" />
            <span>
              <strong>Auto-save enabled:</strong>
              No need to click a save button. Your entries save automatically when you move to the
              next field or click elsewhere.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- NCR Section -->
    <section
      id="operator-section-ncr"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('ncr')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-text" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            NCR (Non-Conformance Reports)
          </span>
        </span>
        <UIcon
          :name="isExpanded('ncr') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('ncr')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Non-Conformance Reports (NCRs) document issues with deliveries or stock quality. They
          create a formal record of problems for tracking and supplier management. Most NCRs you'll
          see are auto-generated when delivery prices differ from expected period prices. As an
          Operator, you can view NCRs but cannot create them - report quality issues to your
          Supervisor who can create manual NCRs.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Types of NCRs</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Auto-Generated (Price Variance):</strong>
              Created automatically when you post a delivery with a price different from the period
              price. These are normal and help track price fluctuations.
            </li>
            <li>
              <strong>Manual:</strong>
              Created by Supervisors for quality issues like damaged goods, short shipments, or
              expired products. Report these issues to your Supervisor.
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Viewing NCRs</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>
              Click
              <strong>NCR</strong>
              in the left menu
            </li>
            <li>View NCRs for your location</li>
            <li>Click on an NCR to see details</li>
            <li>NCRs marked "Auto-generated" were created from price variances</li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">When to Report Issues</h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            Contact your Supervisor immediately if you notice:
          </p>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-circle" class="text-[var(--ui-warning)]" />
              <span>Damaged goods in a delivery</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-circle" class="text-[var(--ui-warning)]" />
              <span>Received less than invoiced (short shipment)</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-circle" class="text-[var(--ui-warning)]" />
              <span>Expired or near-expiry products</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-circle" class="text-[var(--ui-warning)]" />
              <span>Wrong items delivered</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-circle" class="text-[var(--ui-warning)]" />
              <span>Quality issues with products</span>
            </li>
          </ul>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)]">
          <p class="text-sm text-[var(--ui-text-muted)] flex items-start gap-2">
            <UIcon
              name="i-heroicons-information-circle"
              class="shrink-0 mt-0.5 text-[var(--ui-info)]"
            />
            <span>
              As an Operator, you can view NCRs but cannot create manual NCRs. Contact your
              Supervisor to report quality issues - they will create the NCR.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Profile Section -->
    <section
      id="operator-section-profile"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('profile')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-user" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Profile & Security</span>
        </span>
        <UIcon
          :name="isExpanded('profile') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('profile')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Your profile contains your account information and security settings. All actions you take
          in the system are recorded with your username for audit purposes. Keeping your password
          secure and changing it periodically helps protect the system and your account. Never share
          your login credentials with others.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Changing Your Password</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Click your name in the top right corner</li>
            <li>
              Select
              <strong>Profile</strong>
            </li>
            <li>
              Go to the
              <strong>Change Password</strong>
              section
            </li>
            <li>Enter your current password</li>
            <li>Enter your new password (twice to confirm)</li>
            <li>
              Click
              <strong>Update Password</strong>
            </li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Password Requirements</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span>At least 8 characters long</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span>Include uppercase letters (A-Z)</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span>Include lowercase letters (a-z)</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span>Include at least one number (0-9)</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span>Include a special character (@$!%*?&)</span>
            </li>
          </ul>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-warning)]/30">
          <p class="text-sm text-[var(--ui-warning)] flex items-start gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="shrink-0 mt-0.5" />
            <span>
              <strong>Security Reminder:</strong>
              Never share your password. If you suspect someone else has access to your account,
              change your password immediately and notify your administrator.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Quick Reference -->
    <section class="p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
      <h3 class="font-semibold text-[var(--ui-text-highlighted)] mb-3 flex items-center gap-2">
        <UIcon name="i-heroicons-bolt" class="text-[var(--ui-primary)]" />
        Daily Checklist
      </h3>
      <p class="text-sm text-[var(--ui-text-muted)] mb-3">Recommended daily tasks:</p>
      <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
          <span>Enter today's POB count (Mandays + Visitors Meals)</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
          <span>Post any deliveries received today</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
          <span>Post any issues for stock used today</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
          <span>Check for low stock items that need reordering</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
          <span>Review any pending transfer requests</span>
        </li>
      </ul>
    </section>
  </div>
</template>
