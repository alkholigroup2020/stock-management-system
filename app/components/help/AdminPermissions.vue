<script setup lang="ts">
// Admin Permissions - Responsibilities and permissions for Admin role
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="pb-4 border-b border-[var(--ui-border)]">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Admin Role</h2>
      <p class="text-sm text-[var(--ui-text-muted)] mt-1">
        Your responsibilities and system permissions
      </p>
    </div>

    <!-- Your Responsibilities Section -->
    <section class="p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
      <h3 class="font-semibold text-[var(--ui-text-highlighted)] mb-3 flex items-center gap-2">
        <UIcon name="i-heroicons-shield-check" class="text-[var(--ui-primary)]" />
        Your Responsibilities
      </h3>
      <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
          <span>Manage users - create accounts, assign roles and locations</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
          <span>Manage master data - locations, suppliers, items</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
          <span>Manage periods - open periods and set prices</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
          <span>Execute period close - final approval authority</span>
        </li>
        <li class="flex items-center gap-2">
          <UIcon name="i-heroicons-check" class="text-[var(--ui-success)]" />
          <span>All Supervisor and Operator tasks</span>
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
              <td class="p-3 text-[var(--ui-text)]">Dashboard (view)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">POB (enter/edit)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Items (view)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">Items (create/edit)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Deliveries (post)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">Issues (post)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">NCR (create/update)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">Stock Now (view)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Reconciliations (view)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">Reconciliations (edit)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Transfer (create request)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">Transfer (approve)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">PRF (create/submit)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">PRF (approve/reject)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">PO (close)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">Over-delivery (approve)</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Set Period Prices</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Period Close</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">User & Role management</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr>
              <td class="p-3 text-[var(--ui-text)]">Location management</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
              </td>
            </tr>
            <tr class="bg-[var(--ui-bg-elevated)]/50">
              <td class="p-3 text-[var(--ui-text)]">Notification Settings</td>
              <td class="p-3 text-center">
                <UIcon name="i-heroicons-check-circle" class="text-[var(--ui-success)] text-lg" />
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
    <section class="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-primary)]/30">
      <p class="text-sm text-[var(--ui-text-muted)] flex items-start gap-2">
        <UIcon name="i-heroicons-shield-check" class="shrink-0 mt-0.5 text-[var(--ui-primary)]" />
        <span>
          As an Admin, you have full system access including all Supervisor and Operator
          capabilities. Use these privileges responsibly.
        </span>
      </p>
    </section>
  </div>
</template>
