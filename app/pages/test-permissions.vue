<template>
  <div class="min-h-screen bg-[var(--ui-bg)] p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-[var(--ui-text)] mb-2">
          Permission System Test Page
        </h1>
        <p class="text-[var(--ui-text-muted)]">
          Testing role-based UI elements and permission checks
        </p>
      </div>

      <!-- Not Authenticated Warning -->
      <UAlert
        v-if="!isAuthenticated"
        color="warning"
        variant="subtle"
        title="Not Authenticated"
        description="Please log in to test permissions"
        icon="i-heroicons-exclamation-triangle"
        class="mb-6"
      >
        <template #actions>
          <UButton
            to="/login"
            color="warning"
            variant="soft"
            label="Go to Login"
          />
        </template>
      </UAlert>

      <!-- User Information Card -->
      <UCard v-if="isAuthenticated && user" class="mb-6">
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-user-circle" class="text-2xl text-navy-500" />
            <h2 class="text-xl font-semibold text-[var(--ui-text)]">
              Current User Information
            </h2>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-[var(--ui-text-muted)] mb-1">Full Name</p>
            <p class="text-[var(--ui-text)] font-medium">{{ fullName }}</p>
          </div>
          <div>
            <p class="text-sm text-[var(--ui-text-muted)] mb-1">Email</p>
            <p class="text-[var(--ui-text)] font-medium">{{ user.email }}</p>
          </div>
          <div>
            <p class="text-sm text-[var(--ui-text-muted)] mb-1">Role</p>
            <UBadge
              :color="role === 'ADMIN' ? 'primary' : role === 'SUPERVISOR' ? 'secondary' : 'neutral'"
              variant="subtle"
              size="lg"
            >
              {{ role }}
            </UBadge>
          </div>
          <div>
            <p class="text-sm text-[var(--ui-text-muted)] mb-1">Assigned Locations</p>
            <p class="text-[var(--ui-text)] font-medium">
              {{ user.locations.length }} location(s)
            </p>
          </div>
        </div>

        <!-- Locations Table -->
        <div class="mt-6">
          <h3 class="text-sm font-medium text-[var(--ui-text)] mb-3">Location Access</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-[var(--ui-border)]">
                  <th class="text-left py-2 px-3 text-[var(--ui-text-muted)] font-medium">Location ID</th>
                  <th class="text-left py-2 px-3 text-[var(--ui-text-muted)] font-medium">Access Level</th>
                  <th class="text-left py-2 px-3 text-[var(--ui-text-muted)] font-medium">Default</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="loc in user.locations"
                  :key="loc.location_id"
                  class="border-b border-[var(--ui-border)] last:border-0"
                >
                  <td class="py-2 px-3 text-[var(--ui-text)] font-mono text-xs">{{ loc.location_id }}</td>
                  <td class="py-2 px-3">
                    <UBadge
                      :color="loc.access_level === 'MANAGE' ? 'primary' : loc.access_level === 'POST' ? 'secondary' : 'neutral'"
                      variant="subtle"
                    >
                      {{ loc.access_level }}
                    </UBadge>
                  </td>
                  <td class="py-2 px-3">
                    <UIcon
                      v-if="loc.location_id === user.default_location_id"
                      name="i-heroicons-check-circle"
                      class="text-emerald-500"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </UCard>

      <!-- Permission Tests Grid -->
      <div v-if="isAuthenticated" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <!-- Delivery Permissions -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-[var(--ui-text)] flex items-center gap-2">
              <UIcon name="i-heroicons-truck" />
              Delivery Permissions
            </h3>
          </template>
          <div class="space-y-3">
            <PermissionCheck
              label="Can Post Deliveries (Default Location)"
              :allowed="permissions.canPostDeliveries()"
            />
            <PermissionCheck
              v-if="testLocationId"
              :label="`Can Post Deliveries (${testLocationId.slice(0, 8)}...)`"
              :allowed="permissions.canPostDeliveries(testLocationId)"
            />
          </div>
        </UCard>

        <!-- Issue Permissions -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-[var(--ui-text)] flex items-center gap-2">
              <UIcon name="i-heroicons-arrow-up-tray" />
              Issue Permissions
            </h3>
          </template>
          <div class="space-y-3">
            <PermissionCheck
              label="Can Post Issues (Default Location)"
              :allowed="permissions.canPostIssues()"
            />
            <PermissionCheck
              v-if="testLocationId"
              :label="`Can Post Issues (${testLocationId.slice(0, 8)}...)`"
              :allowed="permissions.canPostIssues(testLocationId)"
            />
          </div>
        </UCard>

        <!-- Item Management Permissions -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-[var(--ui-text)] flex items-center gap-2">
              <UIcon name="i-heroicons-cube" />
              Item Management
            </h3>
          </template>
          <div class="space-y-3">
            <PermissionCheck
              label="Can Edit Items"
              :allowed="permissions.canEditItems()"
            />
            <PermissionCheck
              label="Can Create Items"
              :allowed="permissions.canCreateItems()"
            />
            <PermissionCheck
              label="Can Deactivate Items"
              :allowed="permissions.canDeactivateItems()"
            />
            <PermissionCheck
              label="Can Set Item Prices"
              :allowed="permissions.canSetItemPrices()"
            />
          </div>
        </UCard>

        <!-- Period Management Permissions -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-[var(--ui-text)] flex items-center gap-2">
              <UIcon name="i-heroicons-calendar" />
              Period Management
            </h3>
          </template>
          <div class="space-y-3">
            <PermissionCheck
              label="Can Close Period"
              :allowed="permissions.canClosePeriod()"
            />
            <PermissionCheck
              label="Can Open Period"
              :allowed="permissions.canOpenPeriod()"
            />
            <PermissionCheck
              v-if="testLocationId"
              :label="`Can Mark Location Ready (${testLocationId.slice(0, 8)}...)`"
              :allowed="permissions.canMarkLocationReady(testLocationId)"
            />
          </div>
        </UCard>

        <!-- Transfer Permissions -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-[var(--ui-text)] flex items-center gap-2">
              <UIcon name="i-heroicons-arrow-path" />
              Transfer Permissions
            </h3>
          </template>
          <div class="space-y-3">
            <PermissionCheck
              v-if="testLocationId"
              :label="`Can Create Transfer (${testLocationId.slice(0, 8)}...)`"
              :allowed="permissions.canCreateTransfer(testLocationId)"
            />
            <PermissionCheck
              label="Can Approve Transfers"
              :allowed="permissions.canApproveTransfers()"
            />
          </div>
        </UCard>

        <!-- Reconciliation Permissions -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-[var(--ui-text)] flex items-center gap-2">
              <UIcon name="i-heroicons-calculator" />
              Reconciliation Permissions
            </h3>
          </template>
          <div class="space-y-3">
            <PermissionCheck
              label="Can Edit Reconciliations"
              :allowed="permissions.canEditReconciliations()"
            />
            <PermissionCheck
              v-if="testLocationId"
              :label="`Can Edit Reconciliations (${testLocationId.slice(0, 8)}...)`"
              :allowed="permissions.canEditReconciliations(testLocationId)"
            />
            <PermissionCheck
              label="Can View Consolidated Reconciliations"
              :allowed="permissions.canViewConsolidatedReconciliations()"
            />
          </div>
        </UCard>

        <!-- POB & NCR Permissions -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-[var(--ui-text)] flex items-center gap-2">
              <UIcon name="i-heroicons-users" />
              POB & NCR Permissions
            </h3>
          </template>
          <div class="space-y-3">
            <PermissionCheck
              label="Can Enter POB"
              :allowed="permissions.canEnterPOB()"
            />
            <PermissionCheck
              label="Can Create NCR"
              :allowed="permissions.canCreateNCR()"
            />
            <PermissionCheck
              label="Can Update NCR Status"
              :allowed="permissions.canUpdateNCRStatus()"
            />
          </div>
        </UCard>

        <!-- User & Location Management -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-[var(--ui-text)] flex items-center gap-2">
              <UIcon name="i-heroicons-user-group" />
              User & Location Management
            </h3>
          </template>
          <div class="space-y-3">
            <PermissionCheck
              label="Can Manage Users"
              :allowed="permissions.canManageUsers()"
            />
            <PermissionCheck
              label="Can Assign User Locations"
              :allowed="permissions.canAssignUserLocations()"
            />
            <PermissionCheck
              label="Can Manage Locations"
              :allowed="permissions.canManageLocations()"
            />
            <PermissionCheck
              label="Can Manage Suppliers"
              :allowed="permissions.canManageSuppliers()"
            />
          </div>
        </UCard>

        <!-- Reporting & Stock Permissions -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-[var(--ui-text)] flex items-center gap-2">
              <UIcon name="i-heroicons-chart-bar" />
              Reporting & Stock
            </h3>
          </template>
          <div class="space-y-3">
            <PermissionCheck
              label="Can View Reports"
              :allowed="permissions.canViewReports()"
            />
            <PermissionCheck
              label="Can Export Reports"
              :allowed="permissions.canExportReports()"
            />
            <PermissionCheck
              label="Can View Stock"
              :allowed="permissions.canViewStock()"
            />
          </div>
        </UCard>

      </div>

      <!-- Back to Tests -->
      <div class="mt-8 flex justify-center">
        <UButton
          to="/"
          color="neutral"
          variant="soft"
          icon="i-heroicons-arrow-left"
          label="Back to Home"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Use authentication and permissions composables
const { user, isAuthenticated, role, fullName } = useAuth()
const permissions = usePermissions()

// Get test location ID (first location from user's locations)
const testLocationId = computed(() => {
  return user.value?.locations[0]?.location_id || null
})

// Set page metadata
definePageMeta({
  layout: false, // Use no layout for standalone test page
})
</script>

<style scoped>
/* Scoped styles for test page */
</style>
