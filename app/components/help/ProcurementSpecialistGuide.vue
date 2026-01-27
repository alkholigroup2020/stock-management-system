<script setup lang="ts">
import type { Ref } from "vue";

// Procurement Specialist Guide - Documentation for Procurement Specialist role users
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
        const element = document.getElementById(`procurement-section-${newSection}`);
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
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Procurement Guide</h2>
      <p class="text-sm text-[var(--ui-text-muted)] mt-1">
        Managing PRFs and Purchase Orders
      </p>
    </div>

    <!-- Orders Overview Section -->
    <section
      id="procurement-section-orders-overview"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('orders-overview')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-clipboard-document-list" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Orders Overview</span>
        </span>
        <UIcon
          :name="isExpanded('orders-overview') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('orders-overview')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          The Orders page is your primary workspace. It contains two tabs: PRFs (Purchase
          Requisition Forms) and POs (Purchase Orders). Understanding the relationship between
          these documents and their statuses is essential for effective procurement management.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">PRF and PO Relationship</h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            The procurement workflow follows this sequence:
          </p>
          <div class="flex items-center gap-2 text-sm text-[var(--ui-text-muted)] flex-wrap mb-2">
            <UBadge color="neutral" variant="subtle">PRF Created</UBadge>
            <UIcon name="i-heroicons-arrow-right" class="text-[var(--ui-text-dimmed)]" />
            <UBadge color="warning" variant="subtle">PRF Approved</UBadge>
            <UIcon name="i-heroicons-arrow-right" class="text-[var(--ui-text-dimmed)]" />
            <UBadge color="primary" variant="subtle">PO Created</UBadge>
            <UIcon name="i-heroicons-arrow-right" class="text-[var(--ui-text-dimmed)]" />
            <UBadge color="success" variant="subtle">Delivery</UBadge>
          </div>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">PRF Statuses</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>DRAFT:</strong>
              Created but not submitted. Not visible to you.
            </li>
            <li>
              <strong>PENDING:</strong>
              Submitted, waiting for Supervisor approval. Not visible to you.
            </li>
            <li>
              <strong>APPROVED:</strong>
              Approved by Supervisor. Ready for PO creation.
              <strong class="text-[var(--ui-success)]">You see these.</strong>
            </li>
            <li>
              <strong>REJECTED:</strong>
              Rejected by Supervisor. Not visible to you.
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">PO Statuses</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>OPEN:</strong>
              Active PO awaiting deliveries.
              <strong class="text-[var(--ui-primary)]">Can be edited.</strong>
            </li>
            <li>
              <strong>CLOSED:</strong>
              All items delivered or manually closed. Cannot be edited.
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
              As a Procurement Specialist, you only see approved PRFs that are ready for PO
              creation. Draft, pending, and rejected PRFs are managed by Operators and Supervisors.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Viewing Approved PRFs Section -->
    <section
      id="procurement-section-viewing-prfs"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('viewing-prfs')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-magnifying-glass" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Viewing Approved PRFs</span>
        </span>
        <UIcon
          :name="isExpanded('viewing-prfs') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('viewing-prfs')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          The PRFs tab shows all approved Purchase Requisition Forms from across the organization.
          These are requests from locations that have been reviewed and approved by Supervisors,
          ready for you to create Purchase Orders.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">PRF Information</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-hashtag" class="text-[var(--ui-text-dimmed)]" />
              <span>
                <strong>PRF Number:</strong>
                Format PRF-{Location}-{DD}-{Mon}-{YYYY}-{NN}
              </span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-map-pin" class="text-[var(--ui-text-dimmed)]" />
              <span>
                <strong>Location:</strong>
                The requesting location
              </span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-tag" class="text-[var(--ui-text-dimmed)]" />
              <span>
                <strong>Type:</strong>
                URGENT, DPA (Direct Purchase Authorization), or NORMAL
              </span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-folder" class="text-[var(--ui-text-dimmed)]" />
              <span>
                <strong>Category:</strong>
                MATERIAL, CONSUMABLES, SPARE_PARTS, ASSET, or SERVICES
              </span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-user" class="text-[var(--ui-text-dimmed)]" />
              <span>
                <strong>Requester:</strong>
                Who submitted the PRF
              </span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-currency-dollar" class="text-[var(--ui-text-dimmed)]" />
              <span>
                <strong>Total:</strong>
                Estimated total value (including 15% VAT)
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Filtering PRFs</h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            Use filters to find specific PRFs:
          </p>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span>Filter by location to see requests from specific sites</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span>Filter by type (URGENT, DPA, NORMAL) to prioritize</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span>Filter by category for category-specific purchasing</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span>Search by PRF number or requester name</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Reviewing PRF Details</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Click on a PRF row to open the detail view</li>
            <li>Review the line items and quantities requested</li>
            <li>Check the justification/notes provided</li>
            <li>Note any special requirements or urgency</li>
            <li>
              Click
              <strong>Create PO</strong>
              when ready to proceed
            </li>
          </ol>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-warning)]/30">
          <p class="text-sm text-[var(--ui-warning)] flex items-start gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="shrink-0 mt-0.5" />
            <span>
              <strong>Priority:</strong>
              URGENT PRFs should be processed first. DPA (Direct Purchase Authorization) PRFs may
              have pre-approved suppliers. Review the notes for any special instructions.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Creating Purchase Orders Section -->
    <section
      id="procurement-section-creating-pos"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('creating-pos')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-document-plus" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Creating Purchase Orders</span>
        </span>
        <UIcon
          :name="isExpanded('creating-pos') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('creating-pos')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Creating a Purchase Order converts an approved PRF into an official order to a supplier.
          You must select a supplier, confirm line items, adjust quantities and prices as needed,
          and save the PO. The system calculates VAT automatically.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Step-by-Step Process</h4>
          <ol class="space-y-2 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>
              <strong>Select an Approved PRF:</strong>
              From the PRFs tab, click on an approved PRF or click "Create PO" button.
            </li>
            <li>
              <strong>Choose Supplier:</strong>
              Select the supplier from the dropdown. This is required before saving.
            </li>
            <li>
              <strong>Review Line Items:</strong>
              PRF line items are pre-populated. Verify each item's description and quantity.
            </li>
            <li>
              <strong>Adjust Quantities:</strong>
              Modify quantities if needed (e.g., minimum order quantities, bulk pricing).
            </li>
            <li>
              <strong>Enter Unit Prices:</strong>
              Enter the agreed unit price for each item from the supplier quote.
            </li>
            <li>
              <strong>Review Totals:</strong>
              Check subtotal, VAT (15%), and grand total are correct.
            </li>
            <li>
              <strong>Save PO:</strong>
              Click Save to create the Purchase Order.
            </li>
          </ol>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Line Item Types</h4>
          <p class="text-sm text-[var(--ui-text-muted)] mb-2">
            PRFs can contain two types of line items:
          </p>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li>
              <strong>Item Reference:</strong>
              Links to an item in the system's item master. The item code and name are pre-filled.
              These items can be tracked for delivery against stock.
            </li>
            <li>
              <strong>Custom Description:</strong>
              Free-text description for one-off purchases or services not in the item master.
              Enter the description manually.
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">VAT Calculation</h4>
          <p class="text-sm text-[var(--ui-text-muted)]">
            VAT is calculated at 15% and displayed automatically:
          </p>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)] mt-2">
            <li>
              <strong>Line Total:</strong>
              Quantity × Unit Price
            </li>
            <li>
              <strong>Subtotal:</strong>
              Sum of all line totals
            </li>
            <li>
              <strong>VAT (15%):</strong>
              Subtotal × 0.15
            </li>
            <li>
              <strong>Grand Total:</strong>
              Subtotal + VAT
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">PO Numbering</h4>
          <p class="text-sm text-[var(--ui-text-muted)]">
            PO numbers are generated automatically in the format:
            <code class="px-1 py-0.5 rounded bg-[var(--ui-bg)] text-[var(--ui-text)]">
              PO-{DD}-{Mon}-{YYYY}-{NNN}
            </code>
          </p>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-success)]/30">
          <p class="text-sm text-[var(--ui-success)] flex items-start gap-2">
            <UIcon name="i-heroicons-check-circle" class="shrink-0 mt-0.5" />
            <span>
              <strong>Tip:</strong>
              Double-check supplier selection before saving. The supplier determines where the PO
              is sent and how deliveries are recorded.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Editing Purchase Orders Section -->
    <section
      id="procurement-section-editing-pos"
      class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
    >
      <button
        class="w-full flex items-center justify-between p-4 bg-[var(--ui-bg-elevated)] hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
        @click="toggleSection('editing-pos')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-pencil-square" class="text-[var(--ui-primary)] text-xl" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Editing Purchase Orders</span>
        </span>
        <UIcon
          :name="isExpanded('editing-pos') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('editing-pos')" class="p-4 space-y-4">
        <!-- Section Introduction -->
        <p class="text-sm text-[var(--ui-text-muted)]">
          Purchase Orders can be edited while they are in OPEN status. Once a PO is closed (either
          automatically when all items are delivered or manually by a Supervisor/Admin), it can no
          longer be modified.
        </p>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">When You Can Edit</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
              <span>PO status is OPEN</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
              <span>No deliveries have been recorded against the PO</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">When You Cannot Edit</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)]" />
              <span>PO status is CLOSED</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)]" />
              <span>Partial deliveries have been recorded</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">What You Can Edit</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span>Supplier selection</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span>Line item quantities</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span>Unit prices</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
              <span>Add or remove line items</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="font-medium text-[var(--ui-text-highlighted)] mb-2">Editing Steps</h4>
          <ol class="space-y-1 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
            <li>Go to the POs tab</li>
            <li>Click on the PO you want to edit</li>
            <li>
              Click the
              <strong>Edit</strong>
              button
            </li>
            <li>Make your changes</li>
            <li>
              Click
              <strong>Save</strong>
              to update the PO
            </li>
          </ol>
        </div>

        <div class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-warning)]/30">
          <p class="text-sm text-[var(--ui-warning)] flex items-start gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong>
              You cannot close a PO - only Supervisors and Admins have this permission. If a PO
              needs to be closed with unfulfilled items, contact your Supervisor.
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
          <span>Check for new URGENT PRFs and prioritize them</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
          <span>Review all approved PRFs awaiting PO creation</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
          <span>Create POs for PRFs with confirmed supplier quotes</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
          <span>Review open POs for any needed updates</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
          <span>Follow up on POs awaiting delivery</span>
        </li>
      </ul>
    </section>
  </div>
</template>
