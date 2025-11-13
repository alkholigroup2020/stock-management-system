<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";

// Set page metadata
definePageMeta({
  layout: false, // No default layout for login page
});

// Set page title for accessibility
useHead({
  title: "Sign In - Stock Management System",
  meta: [
    {
      name: "description",
      content: "Sign in to access the Stock Management System",
    },
  ],
});

// Use auth composable
const { login, isAuthenticated, error: authError } = useAuth();

// Router for navigation
const router = useRouter();
const route = useRoute();
const toast = useToast();

// Get redirect URL from query parameter
const redirectTo = computed(() => {
  const redirect = route.query.redirect as string;
  return redirect && redirect !== "/login" ? redirect : "/";
});

// Form state
const state = reactive({
  email: "",
  password: "",
});

const loading = ref(false);
const errorMessage = ref("");

// Zod validation schema
const schema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

type Schema = z.output<typeof schema>;

// Check if already authenticated on mount
onMounted(async () => {
  if (isAuthenticated.value) {
    await router.push(redirectTo.value);
  }
});

// Watch for changes in authentication status
watch(isAuthenticated, (newValue) => {
  if (newValue) {
    router.push(redirectTo.value);
  }
});

// Form submission handler
async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true;
  errorMessage.value = "";

  try {
    // Attempt login
    await login(event.data.email, event.data.password);

    // If successful, show success toast
    toast.add({
      title: "Login successful",
      description: "Welcome back!",
      color: "primary",
      icon: "i-heroicons-check-circle",
    });

    // Redirect to dashboard (handled by watch on isAuthenticated)
  } catch (err) {
    // Handle login errors
    const message =
      err instanceof Error
        ? err.message
        : authError.value || "Login failed. Please check your credentials.";
    errorMessage.value = message;

    toast.add({
      title: "Login failed",
      description: message,
      color: "error",
      icon: "i-heroicons-x-circle",
    });
  } finally {
    loading.value = false;
  }
}

// Clear error when user starts typing
watch([() => state.email, () => state.password], () => {
  if (errorMessage.value) {
    errorMessage.value = "";
  }
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-default px-4 py-12 sm:px-6 lg:px-8"
  >
    <main class="w-full max-w-md space-y-8">
      <!-- Header -->
      <header class="text-center">
        <h1 class="text-3xl font-bold text-default">Stock Management System</h1>
        <p class="mt-2 text-sm text-muted">
          Multi-Location Inventory Management
        </p>
      </header>

      <!-- Login Card -->
      <UCard class="card-elevated">
        <template #header>
          <div class="text-center">
            <h2 class="text-2xl font-semibold text-default">
              Sign in to your account
            </h2>
            <p class="mt-1 text-sm text-muted">
              Enter your credentials to access the system
            </p>
          </div>
        </template>

        <!-- Login Form -->
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-6"
          @submit="onSubmit"
        >
          <!-- Error Alert -->
          <UAlert
            v-if="errorMessage"
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-triangle"
            :title="errorMessage"
            :close-button="{
              icon: 'i-heroicons-x-mark-20-solid',
              color: 'error',
              variant: 'link',
              padded: false,
            }"
            @close="errorMessage = ''"
          />

          <!-- Email/Username Field -->
          <UFormGroup label="Email or Username" name="email" required>
            <UInput
              v-model="state.email"
              type="text"
              placeholder="admin@foodstock.local or admin"
              icon="i-heroicons-envelope"
              size="lg"
              :disabled="loading"
              autocomplete="username"
            />
          </UFormGroup>

          <!-- Password Field -->
          <UFormGroup label="Password" name="password" required>
            <UInput
              v-model="state.password"
              type="password"
              placeholder="Enter your password"
              icon="i-heroicons-lock-closed"
              size="lg"
              :disabled="loading"
              autocomplete="current-password"
            />
          </UFormGroup>

          <!-- Remember Me feature removed - causes accessibility issues with hidden input -->
          <!-- Can be re-added in post-MVP with custom accessible checkbox implementation -->

          <!-- Submit Button -->
          <UButton
            type="submit"
            color="primary"
            size="lg"
            block
            :loading="loading"
            :disabled="loading"
          >
            Sign in
          </UButton>
        </UForm>

        <template #footer>
          <div class="text-center text-sm text-muted">
            <p>Default credentials for testing:</p>
            <p class="mt-1 font-mono text-xs">
              admin@foodstock.local / Admin@123
            </p>
          </div>
        </template>
      </UCard>

      <!-- Footer Info -->
      <footer class="text-center text-xs text-muted">
        <p>Stock Management System v1.0</p>
        <p class="mt-1">© 2025 All rights reserved</p>
      </footer>
    </main>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
