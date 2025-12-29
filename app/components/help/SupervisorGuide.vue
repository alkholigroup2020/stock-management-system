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
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
        Supervisor Guide
      </h2>
      <p class="text-sm text-[var(--ui-text-muted)] mt-1">
        Oversight and approval responsibilities
      </p>
    </div>

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
            <li><strong>DRAFT:</strong> Transfer created but not yet submitted for approval</li>
            <li><strong>PENDING_APPROVAL:</strong> Submitted and waiting for supervisor review</li>
            <li><strong>APPROVED:</strong> Stock moved successfully between locations</li>
            <li><strong>REJECTED:</strong> Transfer denied - no stock movement occurs</li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Reviewing Pending Transfers</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Click <strong>Transfers</strong> in the left menu</li>
            <li>Filter by status <strong>Pending Approval</strong></li>
            <li>Click on a transfer to view details</li>
            <li>Review source/destination locations and items</li>
            <li>Check that quantities are reasonable and justified</li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Approving a Transfer</h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            When you approve a transfer, stock moves immediately. Verify everything is correct first.
          </p>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Open the pending transfer</li>
            <li>Verify the source location has sufficient stock</li>
            <li>Verify the destination location is correct</li>
            <li>Click <strong>Approve</strong></li>
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
            <li>Click <strong>Reject</strong></li>
            <li>Enter a reason for rejection (required for audit trail)</li>
            <li>No stock movement occurs</li>
          </ol>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-warning)]/30">
          <p class="text-sm text-[var(--ui-warning)] flex items-start gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="shrink-0 mt-0.5" />
            <span><strong>Important:</strong> All pending transfers must be completed (approved or rejected) before period close. The system will block period close if transfers are pending.</span>
          </p>
        </div>
      </div>
    </section>

    <!-- PRF/PO Approval Section -->
    <section
      id="supervisor-section-prf"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('prf')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-clipboard-document-check" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">PRF & Purchase Orders</span>
        </span>
        <UIcon
          :name="isExpanded('prf') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('prf')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Purchase Requisition Forms (PRFs) are requests from locations to procure items. Operators
          create PRFs when stock is needed. Supervisors review and approve PRFs, then convert them
          into Purchase Orders (POs) that can be sent to suppliers. This workflow ensures proper
          authorization before any purchasing commitment is made.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">PRF Workflow</h4>
          <div class="flex items-center gap-2 text-sm text-[var(--ui-text-muted)] flex-wrap mb-2">
            <UBadge color="neutral" variant="subtle">DRAFT</UBadge>
            <UIcon name="i-heroicons-arrow-right" class="text-[var(--ui-text-dimmed)]" />
            <UBadge color="warning" variant="subtle">PENDING</UBadge>
            <UIcon name="i-heroicons-arrow-right" class="text-[var(--ui-text-dimmed)]" />
            <UBadge color="success" variant="subtle">APPROVED</UBadge>
            <UIcon name="i-heroicons-arrow-right" class="text-[var(--ui-text-dimmed)]" />
            <UBadge color="primary" variant="subtle">PO CREATED</UBadge>
          </div>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Reviewing PRFs</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Click <strong>PRF</strong> in the left menu</li>
            <li>Filter by status <strong>Pending</strong></li>
            <li>Click on a PRF to view details</li>
            <li>Review requested items, quantities, and justification</li>
            <li>Check current stock levels to verify need</li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Creating a Purchase Order</h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            After approving a PRF, convert it to a PO to formalize the purchase:
          </p>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Open the approved PRF</li>
            <li>Click <strong>Create PO</strong></li>
            <li>Select the <strong>Supplier</strong></li>
            <li>Verify or adjust quantities and prices</li>
            <li>Click <strong>Create Purchase Order</strong></li>
          </ol>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)]">
          <p class="text-sm text-[var(--ui-text-muted)] flex items-start gap-2">
            <UIcon name="i-heroicons-information-circle" class="shrink-0 mt-0.5 text-[var(--ui-info)]" />
            <span>POs can be printed or exported to send to suppliers. When goods arrive, create a Delivery referencing the PO for tracking.</span>
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
          :name="isExpanded('reconciliations') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
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
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">The Reconciliation Formula</h4>
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
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Viewing Location Reconciliation</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Click <strong>Reconciliations</strong> in the left menu</li>
            <li>Select the <strong>Location</strong> to review</li>
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
            <li><strong>Back Charges:</strong> Charges to suppliers for quality issues or shortages</li>
            <li><strong>Credits:</strong> Credits received from suppliers</li>
            <li><strong>Condemnations:</strong> Stock written off due to damage, expiry, or spoilage</li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Entering Adjustments</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Scroll to the <strong>Adjustments</strong> section</li>
            <li>Enter values for: Back Charges, Credits, Condemnations</li>
            <li>Add notes explaining the adjustment reason</li>
            <li>Click <strong>Save Adjustments</strong></li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Marking Location Ready</h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            When reconciliation is complete and adjustments are entered, mark the location as ready
            for period close:
          </p>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Verify all transactions are posted (no drafts)</li>
            <li>Verify all adjustments are entered and explained</li>
            <li>Click <strong>Mark Ready</strong></li>
          </ol>
          <div class="mt-2 p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)]">
            <p class="text-sm text-[var(--ui-text-muted)] flex items-start gap-2">
              <UIcon name="i-heroicons-information-circle" class="shrink-0 mt-0.5 text-[var(--ui-info)]" />
              <span>Only an Admin can execute the final period close after all locations are marked READY.</span>
            </p>
          </div>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Consolidated View</h4>
          <p class="text-sm text-[var(--ui-text-muted)]">
            Click <strong>View Consolidated</strong> to see a summary across all locations. This
            helps identify organization-wide trends and ensures all locations are reconciled before
            period close.
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
              <strong>Auto-Generated (Price Variance):</strong> Created automatically when a delivery
              line has a different price than the locked period price. These help track price
              fluctuations and unexpected cost changes.
            </li>
            <li>
              <strong>Manual:</strong> Created by Supervisors for quality issues, damages, short
              shipments, or other supplier-related problems that need documentation.
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">When to Create Manual NCRs</h4>
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
            <li>Click <strong>NCR</strong> in the left menu</li>
            <li>Click <strong>New NCR</strong></li>
            <li>Select Type: <strong>MANUAL</strong></li>
            <li>Select the <strong>Location</strong> where the issue occurred</li>
            <li>(Optional) Link to a <strong>Delivery</strong> if applicable</li>
            <li>Enter a detailed <strong>Reason</strong> describing the issue</li>
            <li>Add affected items with quantities</li>
            <li>Click <strong>Create NCR</strong></li>
          </ol>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)]">
          <p class="text-sm text-[var(--ui-text-muted)] flex items-start gap-2">
            <UIcon name="i-heroicons-information-circle" class="shrink-0 mt-0.5 text-[var(--ui-info)]" />
            <span>NCRs linked to suppliers help build a history of supplier performance. Use this data when evaluating suppliers or negotiating contracts.</span>
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
          locations. As a Supervisor, you have access to all locations and can generate reports
          for management review, cost analysis, and operational planning. Reports can be filtered,
          sorted, and exported for further analysis in spreadsheet applications.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Available Reports</h4>
          <ul class="space-y-3 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-chart-bar" class="text-[var(--ui-primary)] mt-0.5" />
              <div>
                <strong>Stock Now:</strong> Current inventory levels at each location. Shows on-hand
                quantities, WAC values, and total stock value. Use to identify low stock items.
              </div>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-truck" class="text-[var(--ui-primary)] mt-0.5" />
              <div>
                <strong>Deliveries:</strong> History of all deliveries with supplier info, items,
                quantities, and any price variances. Use to track receiving patterns and supplier
                performance.
              </div>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-arrow-up-tray" class="text-[var(--ui-primary)] mt-0.5" />
              <div>
                <strong>Issues:</strong> Stock consumption by cost centre. Shows what items were
                issued, when, and to which department. Use for consumption analysis and budgeting.
              </div>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-calculator" class="text-[var(--ui-primary)] mt-0.5" />
              <div>
                <strong>Reconciliation:</strong> Period-end summary showing opening stock, movements,
                closing stock, and variances for each location. Use for period-end review.
              </div>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Generating Reports</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Navigate to the relevant report page</li>
            <li>Set filters (date range, location, category, etc.)</li>
            <li>Click <strong>Generate</strong> or <strong>Apply Filters</strong></li>
            <li>Review results on screen</li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Exporting Reports</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Generate the report with desired filters</li>
            <li>Click <strong>Export CSV</strong></li>
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
