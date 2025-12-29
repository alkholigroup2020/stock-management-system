<script setup lang="ts">
// Operator Permissions - Responsibilities and permissions for Operator role
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="pb-4 border-b border-[var(--ui-border)]">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
        Operator Role
      </h2>
      <p class="text-sm text-[var(--ui-text-muted)] mt-1">
        Your responsibilities and system permissions
      </p>
    </div>

    <!-- Your Responsibilities Section -->
    <section class="p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
      <h3 class="font-semibold text-[var(--ui-text-highlighted)] mb-3 flex items-center gap-2">
        <UIcon name="i-heroicons-clipboard-document-list" class="text-[var(--ui-primary)]" />
        Your Responsibilities
      </h3>
      <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
          <span>Post deliveries and record goods receipts at your assigned locations</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
          <span>Post issues to record stock usage by cost centres</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
          <span>Enter daily POB (Persons on Board) counts</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
          <span>View current stock levels and item prices</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
          <span>Create transfer requests between locations</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
          <span>Create purchase requisitions (PRF)</span>
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
              <th class="text-left p-3 font-medium text-[var(--ui-text-highlighted)] border-b border-[var(--ui-border)]">Feature</th>
              <th class="text-center p-3 font-medium text-[var(--ui-text-highlighted)] border-b border-[var(--ui-border)]">Access</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)]">
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Dashboard (view)</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" /></td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">POB (enter/edit)</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" /></td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Items (view)</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" /></td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">Items (create/edit)</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" /></td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Deliveries (post)</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" /></td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">Issues (post)</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" /></td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">NCR (create/update)</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" /></td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">Stock Now (view)</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" /></td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Reconciliations (view)</td>
              <td class="p-3 text-center">
                <span class="text-[var(--ui-warning)] text-xs">Totals only</span>
              </td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">Reconciliations (edit)</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" /></td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Transfer (create request)</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" /></td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">Transfer (approve)</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" /></td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">PRF (create)</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" /></td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">PRF (approve)</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" /></td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">PO (create)</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" /></td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">Set Period Prices</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" /></td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Period Close</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" /></td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">User & Role management</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" /></td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Location management</td>
              <td class="p-3 text-center"><UIcon name="i-heroicons-x-circle" class="text-[var(--ui-error)] text-lg" /></td>
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
        <UIcon name="i-heroicons-information-circle" class="shrink-0 mt-0.5 text-[var(--ui-info)]" />
        <span>Operators only have access to their assigned locations. Contact your Supervisor or Admin for location assignment changes.</span>
      </p>
    </section>
  </div>
</template>
