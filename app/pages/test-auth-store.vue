<template>
  <div class="min-h-screen bg-[var(--ui-bg)] p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-8 text-[var(--ui-text)]">Auth Store Test Page</h1>

      <!-- Loading State -->
      <div v-if="authStore.loading" class="mb-6">
        <UAlert color="primary" title="Loading..." description="Processing your request..." />
      </div>

      <!-- Error State -->
      <div v-if="authStore.error" class="mb-6">
        <UAlert
          color="error"
          :title="authStore.error"
          :description="`Error occurred: ${authStore.error}`"
          @close="authStore.clearError"
        />
      </div>

      <!-- Authentication Status -->
      <div class="mb-8">
        <UCard class="card-elevated">
          <template #header>
            <h2 class="text-xl font-semibold">Authentication Status</h2>
          </template>

          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="font-medium">Is Authenticated:</span>
              <span :class="authStore.isAuthenticated ? 'text-emerald-600' : 'text-red-600'">
                {{ authStore.isAuthenticated ? "Yes" : "No" }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Role:</span>
              <span>{{ authStore.role || "N/A" }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Full Name:</span>
              <span>{{ authStore.fullName || "N/A" }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Is Admin:</span>
              <span>{{ authStore.isAdmin ? "Yes" : "No" }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Is Supervisor:</span>
              <span>{{ authStore.isSupervisor ? "Yes" : "No" }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Is Operator:</span>
              <span>{{ authStore.isOperator ? "Yes" : "No" }}</span>
            </div>
          </div>
        </UCard>
      </div>

      <!-- User Details -->
      <div v-if="authStore.user" class="mb-8">
        <UCard class="card-elevated">
          <template #header>
            <h2 class="text-xl font-semibold">User Details</h2>
          </template>

          <div class="space-y-4">
            <div>
              <h3 class="font-semibold mb-2">User Information</h3>
              <pre class="bg-zinc-100 dark:bg-zinc-800 p-4 rounded text-sm overflow-auto">{{
                JSON.stringify(authStore.user, null, 2)
              }}</pre>
            </div>

            <div v-if="authStore.locations.length > 0">
              <h3 class="font-semibold mb-2">Accessible Locations</h3>
              <ul class="list-disc list-inside space-y-1">
                <li v-for="loc in authStore.locations" :key="loc.location_id">
                  Location ID: {{ loc.location_id }} - Access Level: {{ loc.access_level }}
                </li>
              </ul>
            </div>

            <div v-if="authStore.defaultLocation">
              <h3 class="font-semibold mb-2">Default Location</h3>
              <p>
                {{ authStore.defaultLocation.name }} ({{ authStore.defaultLocation.code }}) - {{
                  authStore.defaultLocation.type
                }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Login Form (only shown when not authenticated) -->
      <div v-if="!authStore.isAuthenticated" class="mb-8">
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
            <UButton type="submit" color="primary" :loading="authStore.loading" :disabled="authStore.loading">
              Login
            </UButton>
          </form>
        </UCard>
      </div>

      <!-- Actions (only shown when authenticated) -->
      <div v-if="authStore.isAuthenticated" class="mb-8">
        <UCard class="card-elevated">
          <template #header>
            <h2 class="text-xl font-semibold">Actions</h2>
          </template>

          <div class="space-y-4">
            <div>
              <UButton color="secondary" @click="handleFetchSession" :loading="authStore.loading">
                Refresh Session
              </UButton>
            </div>
            <div>
              <UButton color="error" @click="handleLogout" :loading="authStore.loading"> Logout </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Location Access Checker -->
      <div v-if="authStore.isAuthenticated" class="mb-8">
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
                <span>{{ authStore.hasLocationAccess(testLocationId) ? "Yes" : "No" }}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Access Level:</span>
                <span>{{ authStore.getLocationAccessLevel(testLocationId) || "No Access" }}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Can Post:</span>
                <span>{{ authStore.canPostAtLocation(testLocationId) ? "Yes" : "No" }}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-medium">Can Manage:</span>
                <span>{{ authStore.canManageLocation(testLocationId) ? "Yes" : "No" }}</span>
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
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();

const loginForm = ref({
  email: "",
  password: "",
});

const testLocationId = ref("");
const testResults = ref<Array<{ message: string; success: boolean }>>([]);

// Fetch session on mount
onMounted(async () => {
  const result = await authStore.fetchSession();
  testResults.value.push({
    message: "Fetch session on mount",
    success: result.success,
  });
});

// Login handler
const handleLogin = async () => {
  testResults.value = [];
  const result = await authStore.login(loginForm.value.email, loginForm.value.password);

  if (result.success) {
    testResults.value.push({
      message: "Login successful",
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
  const result = await authStore.logout();

  if (result.success) {
    testResults.value.push({
      message: "Logout successful",
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
  const result = await authStore.fetchSession();

  if (result.success) {
    testResults.value.push({
      message: "Fetch session successful",
      success: true,
    });
  } else {
    testResults.value.push({
      message: "Fetch session failed",
      success: false,
    });
  }
};
</script>
