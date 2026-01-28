<script setup lang="ts">
import type { Ref } from "vue";

// Supervisor Guide - Documentation for Supervisor role users
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
        const element = document.getElementById(`supervisor-section-${newSection}`);
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
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Supervisor Guide</h2>
      <p class="text-sm text-[var(--ui-text-muted)] mt-1">
        Oversight and approval responsibilities
      </p>
    </div>

    <!-- PRF Approval Section -->
    <section
      id="supervisor-section-prf-approval"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('prf-approval')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-check" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">PRF Approval</span>
        </span>
        <UIcon
          :name="isExpanded('prf-approval') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('prf-approval')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Purchase Requisition Forms (PRFs) submitted by Operators require Supervisor approval
          before they can be converted to Purchase Orders. This ensures proper budget control and
          verification of procurement needs. As a Supervisor, you review PRF details and either
          approve or reject with a reason.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">PRF Status Workflow</h4>
          <div class="flex items-center gap-2 text-sm text-[var(--ui-text-muted)] flex-wrap mb-2">
            <UBadge color="neutral" variant="subtle">DRAFT</UBadge>
            <UIcon name="i-heroicons-arrow-right" class="text-[var(--ui-text-dimmed)]" />
            <UBadge color="warning" variant="subtle">PENDING</UBadge>
            <UIcon name="i-heroicons-arrow-right" class="text-[var(--ui-text-dimmed)]" />
            <UBadge color="success" variant="subtle">APPROVED</UBadge>
            <span>or</span>
            <UBadge color="error" variant="subtle">REJECTED</UBadge>
          </div>
          <p class="text-sm text-[var(--ui-text-muted)]">
            You review PRFs with PENDING status. Your decision moves them to APPROVED or REJECTED.
          </p>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Viewing Pending PRFs</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>
              Click
              <strong>Orders</strong>
              in the left menu
            </li>
            <li>Navigate to the PRFs tab</li>
            <li>Filter by status PENDING to see PRFs awaiting approval</li>
            <li>Click on a PRF to view details</li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Reviewing PRF Details</h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            When reviewing a PRF, check the following:
          </p>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-user" class="text-[var(--ui-text-dimmed)]" />
              <span>
                <strong>Requester:</strong>
                Who submitted the request
              </span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-map-pin" class="text-[var(--ui-text-dimmed)]" />
              <span>
                <strong>Location:</strong>
                Which location needs the items
              </span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-tag" class="text-[var(--ui-text-dimmed)]" />
              <span>
                <strong>Type:</strong>
                URGENT, DPA, or NORMAL
              </span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-queue-list" class="text-[var(--ui-text-dimmed)]" />
              <span>
                <strong>Line Items:</strong>
                Items requested with quantities and estimated prices
              </span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-currency-dollar" class="text-[var(--ui-text-dimmed)]" />
              <span>
                <strong>Total Value:</strong>
                Estimated cost including VAT (15%)
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Approving a PRF</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Open the PRF detail view</li>
            <li>Review all items and justification</li>
            <li>
              Click
              <strong>Approve</strong>
            </li>
            <li>PRF status changes to APPROVED</li>
            <li>Email notification sent to Procurement Specialists</li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Rejecting a PRF</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Open the PRF detail view</li>
            <li>
              Click
              <strong>Reject</strong>
            </li>
            <li>
              Enter a
              <strong>rejection reason</strong>
              (required)
            </li>
            <li>PRF status changes to REJECTED</li>
            <li>Requester is notified and can clone the PRF to resubmit</li>
          </ol>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)]">
          <p class="text-sm text-[var(--ui-text-muted)] flex items-start gap-2">
            <UIcon
              name="i-heroicons-information-circle"
              class="shrink-0 mt-0.5 text-[var(--ui-info)]"
            />
            <span>
              When you approve a PRF, an email notification is automatically sent to Procurement
              Specialists alerting them that a new PRF is ready for PO creation.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Over-Delivery Approval Section -->
    <section
      id="supervisor-section-over-delivery"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('over-delivery')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-scale" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Over-Delivery Approval
          </span>
        </span>
        <UIcon
          :name="
            isExpanded('over-delivery') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('over-delivery')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Over-delivery occurs when an Operator records a delivery quantity that exceeds the
          remaining quantity on the linked Purchase Order. The system flags these deliveries for
          Supervisor approval to ensure proper oversight of quantities received beyond what was
          ordered.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            What Triggers Over-Delivery Approval
          </h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-triangle" class="text-[var(--ui-warning)]" />
              <span>Delivery quantity > PO remaining quantity for any line item</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-clock" class="text-[var(--ui-warning)]" />
              <span>Delivery status automatically set to PENDING_APPROVAL</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-lock-closed" class="text-[var(--ui-text-muted)]" />
              <span>Delivery cannot be posted until approved</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            Reviewing Pending Over-Deliveries
          </h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>
              Click
              <strong>Deliveries</strong>
              in the left menu
            </li>
            <li>Filter by status PENDING_APPROVAL</li>
            <li>Click on a delivery to view details</li>
            <li>Over-delivery items are highlighted with the excess quantity shown</li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            Approving Over-Delivery
          </h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            Approve when the over-delivery is legitimate (e.g., supplier sent extra, rounding
            differences, or intentional order increase):
          </p>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Review the over-delivery items and quantities</li>
            <li>Verify the reason is acceptable</li>
            <li>
              Click
              <strong>Approve</strong>
            </li>
            <li>Delivery is posted and stock is updated</li>
            <li>Email notification sent to the delivery creator</li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            Rejecting Over-Delivery
          </h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            Reject when the over-delivery is not acceptable:
          </p>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>
              Click
              <strong>Reject</strong>
            </li>
            <li>
              Enter a
              <strong>rejection reason</strong>
              (required)
            </li>
            <li>Delivery is permanently locked and cannot be posted</li>
            <li>Operator must create a new delivery with corrected quantities</li>
            <li>Email notification sent to the delivery creator</li>
          </ol>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-error)]/30">
          <p class="text-sm text-[var(--ui-error)] flex items-start gap-2">
            <UIcon name="i-heroicons-exclamation-circle" class="shrink-0 mt-0.5" />
            <span>
              <strong>Important:</strong>
              Rejecting an over-delivery is permanent. The delivery cannot be recovered or edited.
              The Operator will need to create a new delivery with the correct quantities.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- PO Management Section -->
    <section
      id="supervisor-section-po-management"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('po-management')"
      >
        <span class="flex items-center gap-3">
          <UIcon
            name="i-heroicons-clipboard-document-list"
            class="text-[var(--ui-primary)] text-xl"
          />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">PO Management</span>
        </span>
        <UIcon
          :name="
            isExpanded('po-management') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('po-management')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Purchase Orders (POs) are created by Procurement Specialists from approved PRFs. As a
          Supervisor, you can view POs, track their fulfillment status, and close POs when needed.
          This section covers PO oversight and closure responsibilities.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Viewing POs</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>
              Click
              <strong>Orders</strong>
              in the left menu
            </li>
            <li>Navigate to the POs tab</li>
            <li>View all POs with their status (OPEN or CLOSED)</li>
            <li>Click on a PO to view details including line items and delivery history</li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            Understanding Fulfillment Status
          </h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            Each PO line item shows fulfillment progress:
          </p>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Ordered:</strong>
              Original quantity on the PO
            </li>
            <li>
              <strong>Delivered:</strong>
              Total quantity received across all deliveries
            </li>
            <li>
              <strong>Remaining:</strong>
              Ordered minus Delivered (what's still expected)
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Auto-Closure</h4>
          <p class="text-sm text-[var(--ui-text-muted)]">
            POs are automatically closed when all line items are fully delivered (Remaining = 0 for
            all lines). No manual action is required for fully fulfilled POs.
          </p>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Manual PO Closure</h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            Sometimes you need to close a PO before all items are delivered (e.g., cancelled items,
            supplier issues, or order changes). Only Supervisors and Admins can manually close POs.
          </p>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Open the PO detail view</li>
            <li>
              Click
              <strong>Close PO</strong>
            </li>
            <li>A warning modal shows any unfulfilled line items</li>
            <li>
              Enter a
              <strong>closure reason</strong>
              (required when items are unfulfilled)
            </li>
            <li>Confirm closure</li>
            <li>PO status changes to CLOSED and cannot be reopened</li>
          </ol>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-warning)]/30">
          <p class="text-sm text-[var(--ui-warning)] flex items-start gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="shrink-0 mt-0.5" />
            <span>
              <strong>Warning:</strong>
              Closing a PO is permanent. Once closed, the PO cannot be reopened or have additional
              deliveries recorded against it. Any remaining unfulfilled items will not be tracked.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Transfer Management Section -->
    <section
      id="supervisor-section-transfers"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('transfers')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-arrows-right-left" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Transfer Management</span>
        </span>
        <UIcon
          :name="isExpanded('transfers') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('transfers')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Transfers move stock between locations. Unlike deliveries (which add stock from suppliers)
          or issues (which consume stock), transfers redistribute existing inventory within the
          organization. Each transfer requires supervisor approval to ensure proper oversight and
          prevent unauthorized stock movements. When approved, stock is deducted from the source
          location and added to the destination location atomically.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Transfer Lifecycle</h4>
          <div class="flex items-center gap-2 text-sm text-[var(--ui-text-muted)] flex-wrap mb-2">
            <UBadge color="neutral" variant="subtle">DRAFT</UBadge>
            <UIcon name="i-heroicons-arrow-right" class="text-[var(--ui-text-dimmed)]" />
            <UBadge color="warning" variant="subtle">PENDING_APPROVAL</UBadge>
            <UIcon name="i-heroicons-arrow-right" class="text-[var(--ui-text-dimmed)]" />
            <UBadge color="success" variant="subtle">APPROVED</UBadge>
            <span>or</span>
            <UBadge color="error" variant="subtle">REJECTED</UBadge>
          </div>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>DRAFT:</strong>
              Transfer created but not yet submitted for approval
            </li>
            <li>
              <strong>PENDING_APPROVAL:</strong>
              Submitted and waiting for supervisor review
            </li>
            <li>
              <strong>APPROVED:</strong>
              Stock moved successfully between locations
            </li>
            <li>
              <strong>REJECTED:</strong>
              Transfer denied - no stock movement occurs
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            Reviewing Pending Transfers
          </h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>
              Click
              <strong>Transfers</strong>
              in the left menu
            </li>
            <li>
              Filter by status
              <strong>Pending Approval</strong>
            </li>
            <li>Click on a transfer to view details</li>
            <li>Review source/destination locations and items</li>
            <li>Check that quantities are reasonable and justified</li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Approving a Transfer</h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            When you approve a transfer, stock moves immediately. Verify everything is correct
            first.
          </p>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Open the pending transfer</li>
            <li>Verify the source location has sufficient stock</li>
            <li>Verify the destination location is correct</li>
            <li>
              Click
              <strong>Approve</strong>
            </li>
            <li>Stock moves immediately between locations</li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Rejecting a Transfer</h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            Reject transfers that are incorrect, unjustified, or cannot be fulfilled.
          </p>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Open the pending transfer</li>
            <li>
              Click
              <strong>Reject</strong>
            </li>
            <li>Enter a reason for rejection (required for audit trail)</li>
            <li>No stock movement occurs</li>
          </ol>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-warning)]/30">
          <p class="text-sm text-[var(--ui-warning)] flex items-start gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="shrink-0 mt-0.5" />
            <span>
              <strong>Important:</strong>
              All pending transfers must be completed (approved or rejected) before period close.
              The system will block period close if transfers are pending.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Reconciliations Section -->
    <section
      id="supervisor-section-reconciliations"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('reconciliations')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-calculator" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Reconciliations</span>
        </span>
        <UIcon
          :name="
            isExpanded('reconciliations') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('reconciliations')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Reconciliation is the process of verifying that actual stock levels match what the system
          calculates based on transactions. At period end, each location's stock is reconciled by
          comparing the expected closing stock (calculated from opening + receipts + transfers in -
          transfers out - issues) against the actual count. Any differences become variances that
          need explanation through adjustments.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            The Reconciliation Formula
          </h4>
          <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)]">
            <p class="text-sm text-[var(--ui-text-muted)] font-mono">
              Opening Stock + Receipts + Transfers In - Transfers Out - Issues = Expected Closing
            </p>
            <p class="text-sm text-[var(--ui-text-muted)] font-mono mt-1">
              Expected Closing - Actual Count = Variance
            </p>
          </div>
          <p class="text-sm text-[var(--ui-text-muted)] mt-2">
            Variances indicate discrepancies that need investigation. Common causes include
            unrecorded breakage, theft, counting errors, or missed transactions.
          </p>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            Viewing Location Reconciliation
          </h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>
              Click
              <strong>Reconciliations</strong>
              in the left menu
            </li>
            <li>
              Select the
              <strong>Location</strong>
              to review
            </li>
            <li>View the reconciliation summary showing all items</li>
            <li>Items with variances are highlighted for attention</li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Adjustment Types</h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            Adjustments explain variances and are recorded for audit purposes:
          </p>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Back Charges:</strong>
              Charges to suppliers for quality issues or shortages
            </li>
            <li>
              <strong>Credits:</strong>
              Credits received from suppliers
            </li>
            <li>
              <strong>Condemnations:</strong>
              Stock written off due to damage, expiry, or spoilage
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">NCR Credits and Losses</h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            NCR outcomes now appear automatically in your reconciliation:
          </p>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>NCR Credits:</strong>
              Money recovered from suppliers (CREDITED NCRs or RESOLVED with CREDIT impact). This
              <strong>reduces</strong>
              your consumption.
            </li>
            <li>
              <strong>NCR Losses:</strong>
              Unrecovered costs absorbed by the business (REJECTED NCRs or RESOLVED with LOSS
              impact). This
              <strong>increases</strong>
              your consumption.
            </li>
            <li>
              <strong>Pending Credits:</strong>
              NCRs with SENT status are shown as informational. These may become credits or losses
              once the supplier responds.
            </li>
          </ul>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-warning)]/30">
          <p class="text-sm text-[var(--ui-warning)] flex items-start gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="shrink-0 mt-0.5" />
            <span>
              <strong>Open NCR Warning:</strong>
              During period close, you may see a warning about unresolved NCRs. While this is
              non-blocking, it's recommended to resolve all NCRs before closing the period for
              accurate financial reporting.
            </span>
          </p>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Entering Adjustments</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>
              Scroll to the
              <strong>Adjustments</strong>
              section
            </li>
            <li>Enter values for: Back Charges, Credits, Condemnations</li>
            <li>Add notes explaining the adjustment reason</li>
            <li>
              Click
              <strong>Save Adjustments</strong>
            </li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            Confirming Reconciliation
          </h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            When reconciliation is complete and adjustments are entered, confirm the reconciliation
            for period close:
          </p>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Verify all transactions are posted (no drafts)</li>
            <li>Verify all adjustments are entered and explained</li>
            <li>
              Click
              <strong>Confirm Reconciliation</strong>
            </li>
          </ol>
          <div class="mt-2 p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)]">
            <p class="text-sm text-[var(--ui-text-muted)] flex items-start gap-2">
              <UIcon
                name="i-heroicons-information-circle"
                class="shrink-0 mt-0.5 text-[var(--ui-info)]"
              />
              <span>
                Only an Admin can execute the final period close after all locations are marked
                READY.
              </span>
            </p>
          </div>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Consolidated View</h4>
          <p class="text-sm text-[var(--ui-text-muted)]">
            Click
            <strong>View Consolidated</strong>
            to see a summary across all locations. This helps identify organization-wide trends and
            ensures all locations are reconciled before period close.
          </p>
        </div>
      </div>
    </section>

    <!-- Manual NCR Section -->
    <section
      id="supervisor-section-ncr"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('ncr')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-text" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">NCR Management</span>
        </span>
        <UIcon
          :name="isExpanded('ncr') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('ncr')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Non-Conformance Reports (NCRs) document issues with deliveries or stock. They serve as a
          formal record of problems and help track supplier performance over time. NCRs can be
          auto-generated (when delivery prices differ from period prices) or manually created (for
          quality issues, damages, or shortages). Supervisors can create manual NCRs while Operators
          can only view them.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">NCR Types</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Auto-Generated (Price Variance):</strong>
              Created automatically when a delivery line has a different price than the locked
              period price. These help track price fluctuations and unexpected cost changes.
            </li>
            <li>
              <strong>Manual:</strong>
              Created by Supervisors for quality issues, damages, short shipments, or other
              supplier-related problems that need documentation.
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            When to Create Manual NCRs
          </h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-circle" class="text-[var(--ui-warning)]" />
              <span>Damaged goods discovered during or after delivery</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-circle" class="text-[var(--ui-warning)]" />
              <span>Short shipments (received less than invoiced)</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-circle" class="text-[var(--ui-warning)]" />
              <span>Quality issues or products not meeting specifications</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-circle" class="text-[var(--ui-warning)]" />
              <span>Expired or near-expiry products received</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-circle" class="text-[var(--ui-warning)]" />
              <span>Wrong items delivered</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Creating a Manual NCR</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>
              Click
              <strong>NCR</strong>
              in the left menu
            </li>
            <li>
              Click
              <strong>New NCR</strong>
            </li>
            <li>
              Select Type:
              <strong>MANUAL</strong>
            </li>
            <li>
              Select the
              <strong>Location</strong>
              where the issue occurred
            </li>
            <li>
              (Optional) Link to a
              <strong>Delivery</strong>
              if applicable
            </li>
            <li>
              Enter a detailed
              <strong>Reason</strong>
              describing the issue
            </li>
            <li>Add affected items with quantities</li>
            <li>
              Click
              <strong>Create NCR</strong>
            </li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            Email Notifications on NCR Creation
          </h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            When you create an NCR (manual or auto-generated), email notifications are automatically
            sent to:
          </p>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-calculator" class="text-[var(--ui-primary)]" />
              <span>Finance Team (configured by Admin in Notification Settings)</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-shopping-cart" class="text-[var(--ui-primary)]" />
              <span>Procurement Team (configured by Admin in Notification Settings)</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-building-storefront" class="text-[var(--ui-primary)]" />
              <span>Supplier (if NCR is linked to a delivery with a supplier)</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            Viewing Notification History
          </h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            On the NCR detail page, you can see a notification history section showing:
          </p>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span>Which recipient groups were notified</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span>Delivery status (SENT or FAILED)</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span>Timestamp of each notification attempt</span>
            </li>
          </ul>
          <p class="text-sm text-[var(--ui-text-muted)] mt-2">
            If a notification fails, you can click the resend button to retry (5-minute cooldown
            between attempts).
          </p>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">
            Resolving NCRs with Financial Impact
          </h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            When resolving an NCR to RESOLVED status, you must specify how it affects the
            reconciliation:
          </p>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Resolution Type:</strong>
              Free-text describing how the NCR was resolved (e.g., "Replacement received", "Written
              off as loss", "Partial credit received")
            </li>
            <li>
              <strong>Financial Impact:</strong>
              <ul class="ml-4 mt-1 space-y-1">
                <li>
                  <strong>CREDIT:</strong>
                  Value was recovered from supplier (reduces consumption)
                </li>
                <li>
                  <strong>LOSS:</strong>
                  Value was lost and absorbed by the business (increases consumption)
                </li>
                <li>
                  <strong>NONE:</strong>
                  No financial adjustment needed (e.g., replacement received in kind)
                </li>
              </ul>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">NCR Status Outcomes</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>CREDITED:</strong>
              Supplier issued credit note. Automatically reduces your location's consumption.
            </li>
            <li>
              <strong>REJECTED:</strong>
              Supplier rejected the claim. Automatically increases your consumption as a loss.
            </li>
            <li>
              <strong>RESOLVED:</strong>
              Internally resolved. You choose the financial impact (CREDIT, LOSS, or NONE).
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
              NCRs linked to suppliers help build a history of supplier performance. Use this data
              when evaluating suppliers or negotiating contracts.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Reports Section -->
    <section
      id="supervisor-section-reports"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('reports')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-chart-bar" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Reports & Analysis</span>
        </span>
        <UIcon
          :name="isExpanded('reports') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('reports')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Reports provide visibility into stock levels, transactions, and trends across all
          locations. As a Supervisor, you have access to all locations and can generate reports for
          management review, cost analysis, and operational planning. Reports can be filtered,
          sorted, and exported for further analysis in spreadsheet applications.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Available Reports</h4>
          <ul class="space-y-3 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-chart-bar" class="text-[var(--ui-primary)] mt-0.5" />
              <div>
                <strong>Stock Now:</strong>
                Current inventory levels at each location. Shows on-hand quantities, WAC values, and
                total stock value. Use to identify low stock items.
              </div>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-truck" class="text-[var(--ui-primary)] mt-0.5" />
              <div>
                <strong>Deliveries:</strong>
                History of all deliveries with supplier info, items, quantities, and any price
                variances. Use to track receiving patterns and supplier performance.
              </div>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-arrow-up-tray" class="text-[var(--ui-primary)] mt-0.5" />
              <div>
                <strong>Issues:</strong>
                Stock consumption by cost centre. Shows what items were issued, when, and to which
                department. Use for consumption analysis and budgeting.
              </div>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-calculator" class="text-[var(--ui-primary)] mt-0.5" />
              <div>
                <strong>Reconciliation:</strong>
                Period-end summary showing opening stock, movements, closing stock, and variances
                for each location. Use for period-end review.
              </div>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Generating Reports</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Navigate to the relevant report page</li>
            <li>Set filters (date range, location, category, etc.)</li>
            <li>
              Click
              <strong>Generate</strong>
              or
              <strong>Apply Filters</strong>
            </li>
            <li>Review results on screen</li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Exporting Reports</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Generate the report with desired filters</li>
            <li>
              Click
              <strong>Export CSV</strong>
            </li>
            <li>Open in Excel or Google Sheets for further analysis</li>
            <li>Use pivot tables for deeper insights</li>
          </ol>
        </div>
      </div>
    </section>

    <!-- Quick Reference -->
    <section class="p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
      <h3 class="font-semibold text-[var(--ui-text-highlighted)] mb-3 flex items-center gap-2">
        <UIcon name="i-heroicons-bolt" class="text-[var(--ui-primary)]" />
        Transfer Approval Checklist
      </h3>
      <p class="text-sm text-[var(--ui-text-muted)] mb-3">Before approving a transfer, verify:</p>
      <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
          <span>Source location has sufficient stock for all items</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
          <span>Destination location is correct and appropriate</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
          <span>Item quantities are reasonable for the request</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
          <span>Transfer reason/justification is clear</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
          <span>Current period is OPEN (transfers cannot occur in closed periods)</span>
        </li>
      </ul>
    </section>
  </div>
</template>
