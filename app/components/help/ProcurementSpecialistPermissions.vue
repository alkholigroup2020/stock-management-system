<script setup lang="ts">
// Procurement Specialist Permissions - Responsibilities and permissions for Procurement Specialist role
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="pb-4 border-b border-[var(--ui-border)]">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
        Procurement Specialist Role
      </h2>
      <p class="text-sm text-[var(--ui-text-muted)] mt-1">
        Your responsibilities and system permissions
      </p>
    </div>

    <!-- Your Responsibilities Section -->
    <section class="p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
      <h3 class="font-semibold text-[var(--ui-text-highlighted)] mb-3 flex items-center gap-2">
        <UIcon name="i-heroicons-shopping-cart" class="text-[var(--ui-primary)]" />
        Your Responsibilities
      </h3>
      <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
          <span>View approved Purchase Requisition Forms (PRFs) from all locations</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
          <span>Create Purchase Orders (POs) from approved PRFs</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
          <span>Edit Purchase Orders while in OPEN status</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
          <span>Select suppliers and manage line item details</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
          <span>Track PO fulfillment status</span>
        </li>
      </ul>
    </section>

    <!-- Permissions Matrix -->
    <section>
      <h3 class="font-semibold text-[var(--ui-text-highlighted)] mb-3 flex items-center gap-2">
        <UIcon name="i-heroicons-shield-check" class="text-[var(--ui-primary)]" />
        Permissions Summary
      </h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border border-[var(--ui-border)] rounded-lg overflow-hidden">
          <thead>
            <tr class="bg-[var(--ui-bg-elevated)]">
              <th
                class="text-left p-3 font-medium text-[var(--ui-text-highlighted)] border-b border-[var(--ui-border)]"
              >
                Feature
              </th>
              <th
                class="text-center p-3 font-medium text-[var(--ui-text-highlighted)] border-b border-[var(--ui-border)]"
              >
                Access
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)]">
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Orders page (view)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">PRF (view approved)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">PRF (create/submit)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" />
              </td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">PO (create/edit)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">PO (close)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" />
              </td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">Dashboard (view)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" />
              </td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Deliveries (post)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" />
              </td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">Issues (post)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" />
              </td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Stock Now (view)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" />
              </td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">Transfers</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" />
              </td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Reconciliations</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" />
              </td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">User & Role management</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Legend -->
    <section class="flex items-center gap-6 text-sm text-[var(--ui-text-muted)]">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)]" />
        <span>Allowed</span>
      </div>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)]" />
        <span>Not allowed</span>
      </div>
    </section>

    <!-- Note -->
    <section class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)]">
      <p class="text-sm text-[var(--ui-text-muted)] flex items-start gap-2">
        <UIcon
          name="i-heroicons-information-circle"
          class="shrink-0 mt-0.5 text-[var(--ui-info)]"
        />
        <span>
          Procurement Specialists have a focused role limited to the Orders page. You can view
          approved PRFs from all locations and create Purchase Orders, but cannot access other
          system functions like deliveries, stock management, or administrative features.
        </span>
      </p>
    </section>
  </div>
</template>
