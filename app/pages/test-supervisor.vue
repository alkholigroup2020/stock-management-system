<script setup lang="ts">
/**
 * Test Page: Supervisor or Higher Access
 *
 * This page is restricted to SUPERVISOR and ADMIN roles.
 * Use this to test minimum role-based access control.
 */

definePageMeta({
  middleware: ['role'],
  minRole: 'SUPERVISOR', // SUPERVISOR or ADMIN can access
})

const auth = useAuth()
</script>

<template>
  <div class="min-h-screen bg-[var(--ui-bg)] px-4 py-12">
    <div class="container mx-auto max-w-4xl">
      <UCard class="card-elevated">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center">
              <UIcon name="i-heroicons-user-group" class="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-[var(--ui-text)]">
                Supervisor or Higher Page
              </h1>
              <p class="text-sm text-[var(--ui-text-muted)]">
                This page requires minimum SUPERVISOR role
              </p>
            </div>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Success Message -->
          <UAlert
            color="success"
            variant="soft"
            icon="i-heroicons-check-circle"
            title="Access Granted!"
            description="You have successfully accessed the supervisor-level page."
          />

          <!-- User Info -->
          <div class="bg-[var(--ui-bg-elevated)] rounded-lg p-6 border border-[var(--ui-border)]">
            <h2 class="text-lg font-semibold text-[var(--ui-text)] mb-4">
              Current User Information
            </h2>
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm font-medium text-[var(--ui-text-muted)]">
                  Full Name
                </dt>
                <dd class="mt-1 text-sm text-[var(--ui-text)]">
                  {{ auth.fullName.value }}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-[var(--ui-text-muted)]">
                  Email
                </dt>
                <dd class="mt-1 text-sm text-[var(--ui-text)]">
                  {{ auth.user.value?.email }}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-[var(--ui-text-muted)]">
                  Username
                </dt>
                <dd class="mt-1 text-sm text-[var(--ui-text)]">
                  {{ auth.user.value?.username }}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-[var(--ui-text-muted)]">
                  Role
                </dt>
                <dd class="mt-1">
                  <span class="badge-primary">
                    {{ auth.role.value }}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <!-- Role Checks -->
          <div class="bg-[var(--ui-bg-elevated)] rounded-lg p-6 border border-[var(--ui-border)]">
            <h2 class="text-lg font-semibold text-[var(--ui-text)] mb-4">
              Role Verification
            </h2>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm text-[var(--ui-text-muted)]">Is Admin</span>
                <UIcon
                  :name="auth.isAdmin.value ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                  :class="auth.isAdmin.value ? 'text-emerald-400' : 'text-red-500'"
                  class="w-5 h-5"
                />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-[var(--ui-text-muted)]">Is Supervisor</span>
                <UIcon
                  :name="auth.isSupervisor.value ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                  :class="auth.isSupervisor.value ? 'text-emerald-400' : 'text-red-500'"
                  class="w-5 h-5"
                />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-[var(--ui-text-muted)]">Is At Least Supervisor</span>
                <UIcon
                  :name="auth.isAtLeastSupervisor.value ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                  :class="auth.isAtLeastSupervisor.value ? 'text-emerald-400' : 'text-red-500'"
                  class="w-5 h-5"
                />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-[var(--ui-text-muted)]">Is Operator</span>
                <UIcon
                  :name="auth.isOperator.value ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                  :class="auth.isOperator.value ? 'text-emerald-400' : 'text-red-500'"
                  class="w-5 h-5"
                />
              </div>
            </div>
          </div>

          <!-- Permissions Check -->
          <div class="bg-[var(--ui-bg-elevated)] rounded-lg p-6 border border-[var(--ui-border)]">
            <h2 class="text-lg font-semibold text-[var(--ui-text)] mb-4">
              General Permission Checks
            </h2>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm text-[var(--ui-text-muted)]">Can Approve Transfers</span>
                <UIcon
                  :name="auth.canApproveTransfers.value ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                  :class="auth.canApproveTransfers.value ? 'text-emerald-400' : 'text-red-500'"
                  class="w-5 h-5"
                />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-[var(--ui-text-muted)]">Can Manage Items</span>
                <UIcon
                  :name="auth.canManageItems.value ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                  :class="auth.canManageItems.value ? 'text-emerald-400' : 'text-red-500'"
                  class="w-5 h-5"
                />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-[var(--ui-text-muted)]">Can Manage Users</span>
                <UIcon
                  :name="auth.canManageUsers.value ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                  :class="auth.canManageUsers.value ? 'text-emerald-400' : 'text-red-500'"
                  class="w-5 h-5"
                />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-[var(--ui-text-muted)]">Can Close Periods</span>
                <UIcon
                  :name="auth.canClosePeriods.value ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                  :class="auth.canClosePeriods.value ? 'text-emerald-400' : 'text-red-500'"
                  class="w-5 h-5"
                />
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <div class="flex gap-4">
            <UButton
              to="/"
              color="primary"
              icon="i-heroicons-home"
            >
              Back to Dashboard
            </UButton>
            <UButton
              to="/test-admin"
              color="secondary"
              variant="outline"
            >
              Test Admin Page
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
