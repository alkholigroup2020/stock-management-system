<template>
  <div class="min-h-screen bg-[var(--ui-bg)] p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-8 text-[var(--ui-text)]">Auth Composable Test Page</h1>

      <!-- Loading State -->
      <div v-if="auth.loading.value" class="mb-6">
        <UAlert color="primary" title="Loading..." description="Processing your request..." />
      </div>

      <!-- Error State -->
      <div v-if="auth.error.value" class="mb-6">
        <UAlert
          color="error"
          :title="auth.error.value"
          :description="`Error occurred: ${auth.error.value}`"
          @close="auth.clearError"
        />
      </div>

      <!-- Authentication Status -->
      <div class="mb-8">
        <UCard class="card-elevated">
          <template #header>
            <h2 class="text-xl font-semibold">Authentication Status (via Composable)</h2>
          </template>

          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="font-medium">Is Authenticated:</span>
              <span :class="auth.isAuthenticated.value ? 'text-emerald-600' : 'text-red-600'">
                {{ auth.isAuthenticated.value ? "Yes" : "No" }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Role:</span>
              <span>{{ auth.role.value || "N/A" }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Full Name:</span>
              <span>{{ auth.fullName.value || "N/A" }}</span>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Role Checks -->
      <div v-if="auth.isAuthenticated.value" class="mb-8">
        <UCard class="card-elevated">
          <template #header>
            <h2 class="text-xl font-semibold">Role Checks</h2>
          </template>

          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="font-medium">Is Admin:</span>
              <span :class="auth.isAdmin.value ? 'text-emerald-600' : 'text-red-600'">
                {{ auth.isAdmin.value ? "Yes" : "No" }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Is Supervisor:</span>
              <span :class="auth.isSupervisor.value ? 'text-emerald-600' : 'text-red-600'">
                {{ auth.isSupervisor.value ? "Yes" : "No" }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Is Operator:</span>
              <span :class="auth.isOperator.value ? 'text-emerald-600' : 'text-red-600'">
                {{ auth.isOperator.value ? "Yes" : "No" }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Is At Least Supervisor:</span>
              <span :class="auth.isAtLeastSupervisor.value ? 'text-emerald-600' : 'text-red-600'">
                {{ auth.isAtLeastSupervisor.value ? "Yes" : "No" }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">hasRole('ADMIN'):</span>
              <span :class="auth.hasRole('ADMIN') ? 'text-emerald-600' : 'text-red-600'">
                {{ auth.hasRole('ADMIN') ? "Yes" : "No" }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">hasAnyRole(['SUPERVISOR', 'ADMIN']):</span>
              <span :class="auth.hasAnyRole(['SUPERVISOR', 'ADMIN']) ? 'text-emerald-600' : 'text-red-600'">
                {{ auth.hasAnyRole(['SUPERVISOR', 'ADMIN']) ? "Yes" : "No" }}
              </span>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Permission Checks -->
      <div v-if="auth.isAuthenticated.value" class="mb-8">
        <UCard class="card-elevated">
          <template #header>
            <h2 class="text-xl font-semibold">Permission Checks</h2>
          </template>

          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="font-medium">Can Approve Transfers:</span>
              <span :class="auth.canApproveTransfers.value ? 'text-emerald-600' : 'text-red-600'">
                {{ auth.canApproveTransfers.value ? "Yes" : "No" }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Can Close Periods:</span>
              <span :class="auth.canClosePeriods.value ? 'text-emerald-600' : 'text-red-600'">
                {{ auth.canClosePeriods.value ? "Yes" : "No" }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Can Manage Items:</span>
              <span :class="auth.canManageItems.value ? 'text-emerald-600' : 'text-red-600'">
                {{ auth.canManageItems.value ? "Yes" : "No" }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Can Manage Users:</span>
              <span :class="auth.canManageUsers.value ? 'text-emerald-600' : 'text-red-600'">
                {{ auth.canManageUsers.value ? "Yes" : "No" }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Can Edit Reconciliations:</span>
              <span :class="auth.canEditReconciliations.value ? 'text-emerald-600' : 'text-red-600'">
                {{ auth.canEditReconciliations.value ? "Yes" : "No" }}
              </span>
            </div>
          </div>
        </UCard>
      </div>

      <!-- User Details -->
      <div v-if="auth.user.value" class="mb-8">
        <UCard class="card-elevated">
          <template #header>
            <h2 class="text-xl font-semibold">User Details</h2>
          </template>

          <div class="space-y-4">
            <div>
              <h3 class="font-semibold mb-2">User Information</h3>
              <pre class="bg-zinc-100 dark:bg-zinc-800 p-4 rounded text-sm overflow-auto">{{
                JSON.stringify(auth.user.value, null, 2)
              }}</pre>
            </div>

            <div v-if="auth.locations.value.length > 0">
              <h3 class="font-semibold mb-2">Accessible Locations</h3>
              <ul class="list-disc list-inside space-y-1">
                <li v-for="loc in auth.locations.value" :key="loc.location_id">
                  Location ID: {{ loc.location_id }} - Access Level: {{ loc.access_level }}
                </li>
              </ul>
              <div class="mt-2">
                <p class="font-medium">All Accessible Location IDs:</p>
                <p class="text-sm">{{ auth.getAccessibleLocationIds().join(", ") }}</p>
              </div>
            </div>

            <div v-if="auth.defaultLocation.value">
              <h3 class="font-semibold mb-2">Default Location</h3>
              <p>
                {{ auth.defaultLocation.value.name }} ({{ auth.defaultLocation.value.code }}) - {{
                  auth.defaultLocation.value.type
                }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Login Form (only shown when not authenticated) -->
      <div v-if="!auth.isAuthenticated.value" class="mb-8">
        <UCard class="card-elevated">
          <template #header>
            <h2 class="text-xl font-semibold">Login</h2>
          </template>

          <form @submit.prevent="handleLogin" class="space-y-4">
            <div>
              <label class="form-label">Email or Username</label>
              <UInput v-model="loginForm.email" type="text" placeholder="Enter email or username" class="form-input" />
            </div>
            <div>
              <label class="form-label">Password</label>
              <UInput v-model="loginForm.password" type="password" placeholder="Enter password" class="form-input" />
            </div>
            <UButton type="submit" color="primary" :loading="auth.loading.value" :disabled="auth.loading.value">
              Login
            </UButton>
          </form>
        </UCard>
      </div>

      <!-- Actions (only shown when authenticated) -->
      <div v-if="auth.isAuthenticated.value" class="mb-8">
        <UCard class="card-elevated">
          <template #header>
            <h2 class="text-xl font-semibold">Actions</h2>
          </template>

          <div class="space-y-4">
            <div>
              <UButton color="secondary" @click="handleFetchSession" :loading="auth.loading.value">
                Refresh Session
              </UButton>
            </div>
            <div>
              <UButton color="error" @click="handleLogout" :loading="auth.loading.value"> Logout </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Location Access Checker -->
      <div v-if="auth.isAuthenticated.value" class="mb-8">
        <UCard class="card-elevated">
          <template #header>
            <h2 class="text-xl font-semibold">Location Access Checker</h2>
          </template>

          <div class="space-y-4">
            <div>
              <label class="form-label">Enter Location ID</label>
              <UInput v-model="testLocationId" type="text" placeholder="Enter a location ID to test" class="form-input" />
            </div>

            <div v-if="testLocationId" class="space-y-2">
              <div class="flex justify-between">
                <span class="font-medium">Has Access:</span>
                <span :class="auth.hasLocationAccess(testLocationId) ? 'text-emerald-600' : 'text-red-600'">
                  {{ auth.hasLocationAccess(testLocationId) ? "Yes" : "No" }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Access Level:</span>
                <span>{{ auth.getLocationAccessLevel(testLocationId) || "No Access" }}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Can Post:</span>
                <span :class="auth.canPostAtLocation(testLocationId) ? 'text-emerald-600' : 'text-red-600'">
                  {{ auth.canPostAtLocation(testLocationId) ? "Yes" : "No" }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Can Manage:</span>
                <span :class="auth.canManageLocation(testLocationId) ? 'text-emerald-600' : 'text-red-600'">
                  {{ auth.canManageLocation(testLocationId) ? "Yes" : "No" }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Can Post Deliveries:</span>
                <span :class="auth.canPostDeliveries(testLocationId) ? 'text-emerald-600' : 'text-red-600'">
                  {{ auth.canPostDeliveries(testLocationId) ? "Yes" : "No" }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Can Post Issues:</span>
                <span :class="auth.canPostIssues(testLocationId) ? 'text-emerald-600' : 'text-red-600'">
                  {{ auth.canPostIssues(testLocationId) ? "Yes" : "No" }}
                </span>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Test Results -->
      <div v-if="testResults.length > 0" class="mb-8">
        <UCard class="card-elevated">
          <template #header>
            <h2 class="text-xl font-semibold">Test Results</h2>
          </template>

          <div class="space-y-2">
            <div v-for="(result, index) in testResults" :key="index" class="p-3 bg-zinc-100 dark:bg-zinc-800 rounded">
              <div class="flex items-center justify-between">
                <span>{{ result.message }}</span>
                <span
                  :class="result.success ? 'text-emerald-600' : 'text-red-600'"
                  class="font-semibold"
                >
                  {{ result.success ? "✓ PASS" : "✗ FAIL" }}
                </span>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

// Use the auth composable
const auth = useAuth();

const loginForm = ref({
  email: "",
  password: "",
});

const testLocationId = ref("");
const testResults = ref<Array<{ message: string; success: boolean }>>([]);

// Fetch session on mount
onMounted(async () => {
  const result = await auth.fetchSession();
  testResults.value.push({
    message: "Fetch session on mount",
    success: result.success,
  });
});

// Login handler
const handleLogin = async () => {
  testResults.value = [];
  const result = await auth.login(loginForm.value.email, loginForm.value.password);

  if (result.success) {
    testResults.value.push({
      message: "Login successful via composable",
      success: true,
    });
  } else {
    testResults.value.push({
      message: `Login failed: ${result.message}`,
      success: false,
    });
  }
};

// Logout handler
const handleLogout = async () => {
  testResults.value = [];
  const result = await auth.logout();

  if (result.success) {
    testResults.value.push({
      message: "Logout successful via composable",
      success: true,
    });
  } else {
    testResults.value.push({
      message: `Logout failed: ${result.message}`,
      success: false,
    });
  }
};

// Fetch session handler
const handleFetchSession = async () => {
  testResults.value = [];
  const result = await auth.fetchSession();

  if (result.success) {
    testResults.value.push({
      message: "Fetch session successful via composable",
      success: true,
    });
  } else {
    testResults.value.push({
      message: "Fetch session failed via composable",
      success: false,
    });
  }
};
</script>
