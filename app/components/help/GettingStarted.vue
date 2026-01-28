<script setup lang="ts">
// Getting Started - Welcome content for all users
</script>

<template>
  <div class="space-y-8">
    <!-- Welcome Section -->
    <section>
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)] mb-4">
        Welcome to Stock Management System
      </h2>
      <p class="text-sm text-[var(--ui-text-muted)] leading-relaxed mb-4">
        This system helps you manage inventory across multiple locations. Track deliveries, record
        stock usage, transfer items between locations, and maintain accurate records for period-end
        reconciliation.
      </p>
      <h3
        class="text-lg font-semibold text-[var(--ui-text-highlighted)] mb-3 flex items-center gap-2"
      >
        <UIcon name="i-heroicons-sparkles" class="text-[var(--ui-primary)]" />
        Key Capabilities
      </h3>
      <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-map-pin" class="text-[var(--ui-primary)] shrink-0" />
          <span>
            <strong>Multi-Location Stock Tracking</strong>
            - Maintain independent inventory levels for Kitchen, Store, Central, and Warehouse
          </span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon
            name="i-heroicons-clipboard-document-list"
            class="text-[var(--ui-primary)] shrink-0"
          />
          <span>
            <strong>Purchase Requisitions (PRF)</strong>
            - Request materials with approval workflow before ordering
          </span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-shopping-cart" class="text-[var(--ui-primary)] shrink-0" />
          <span>
            <strong>Purchase Orders (PO)</strong>
            - Create orders from approved PRFs with supplier and VAT management
          </span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-truck" class="text-[var(--ui-primary)] shrink-0" />
          <span>
            <strong>Delivery Management</strong>
            - Record supplier deliveries linked to POs with over-delivery detection
          </span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-arrow-up-tray" class="text-[var(--ui-primary)] shrink-0" />
          <span>
            <strong>Stock Issues</strong>
            - Track consumption by cost centre with real-time stock deductions
          </span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-arrows-right-left" class="text-[var(--ui-primary)] shrink-0" />
          <span>
            <strong>Inter-Location Transfers</strong>
            - Move stock between locations with approval workflows
          </span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-document-text" class="text-[var(--ui-primary)] shrink-0" />
          <span>
            <strong>Price Variance Detection</strong>
            - Automatic NCRs when delivery prices differ from period prices
          </span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-users" class="text-[var(--ui-primary)] shrink-0" />
          <span>
            <strong>POB & Mandays Calculation</strong>
            - Record daily crew counts for cost-per-person reporting
          </span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-calculator" class="text-[var(--ui-primary)] shrink-0" />
          <span>
            <strong>Period-End Reconciliation</strong>
            - Coordinated month-end close with opening/closing snapshots
          </span>
        </li>
      </ul>
    </section>

    <!-- Understanding Periods -->
    <section>
      <h3
        class="text-lg font-semibold text-[var(--ui-text-highlighted)] mb-3 flex items-center gap-2"
      >
        <UIcon name="i-heroicons-calendar" class="text-[var(--ui-primary)]" />
        Understanding Periods
      </h3>
      <p class="text-sm text-[var(--ui-text-muted)] mb-4">
        The system operates on monthly accounting periods. The
        <strong>Period Indicator</strong>
        in the top navigation shows the current period status:
      </p>
      <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
        <li class="flex items-start gap-2">
          <UBadge color="success" variant="subtle" size="sm">OPEN</UBadge>
          <span>You can post transactions normally</span>
        </li>
        <li class="flex items-start gap-2">
          <UBadge color="warning" variant="subtle" size="sm">PENDING_CLOSE</UBadge>
          <span>Period close is in progress - check with your admin</span>
        </li>
        <li class="flex items-start gap-2">
          <UBadge color="error" variant="subtle" size="sm">CLOSED</UBadge>
          <span>No transactions can be posted to this period</span>
        </li>
      </ul>
    </section>

    <!-- Switching Locations -->
    <section>
      <h3
        class="text-lg font-semibold text-[var(--ui-text-highlighted)] mb-3 flex items-center gap-2"
      >
        <UIcon name="i-heroicons-map-pin" class="text-[var(--ui-primary)]" />
        Switching Locations
      </h3>
      <p class="text-sm text-[var(--ui-text-muted)] mb-4">
        If you have access to multiple locations:
      </p>
      <ol class="space-y-2 text-sm text-[var(--ui-text-muted)] list-decimal list-inside">
        <li>Look at the top navigation bar</li>
        <li>
          Find the
          <strong>Location Switcher</strong>
          dropdown (shows your current location)
        </li>
        <li>Click to open the dropdown</li>
        <li>Select a different location</li>
        <li>The page will refresh with data for the new location</li>
      </ol>
      <div class="mt-4 p-3 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
        <p class="text-sm text-[var(--ui-warning)] flex items-center gap-2">
          <UIcon name="i-heroicons-exclamation-triangle" class="shrink-0" />
          <span>
            All transactions you create will be recorded at your currently selected location.
          </span>
        </p>
      </div>
    </section>

    <!-- Key Rules -->
    <section>
      <h3
        class="text-lg font-semibold text-[var(--ui-text-highlighted)] mb-3 flex items-center gap-2"
      >
        <UIcon name="i-heroicons-shield-check" class="text-[var(--ui-primary)]" />
        Key Rules to Remember
      </h3>
      <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] shrink-0" />
          <span>
            <strong>No negative stock</strong>
            - You cannot issue more than what's available
          </span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-map-pin" class="text-[var(--ui-primary)] shrink-0" />
          <span>
            <strong>Location-specific</strong>
            - All transactions belong to your active location
          </span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-calendar" class="text-[var(--ui-warning)] shrink-0" />
          <span>
            <strong>Period must be OPEN</strong>
            - Transactions require an open period
          </span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-document-text" class="text-[var(--ui-info)] shrink-0" />
          <span>
            <strong>Price variances create NCRs</strong>
            - This is automatic and normal
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>
