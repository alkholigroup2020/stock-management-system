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
    // Attempt login - returns { success: boolean; message?: string }
    const result = await login(event.data.email, event.data.password);

    if (result.success) {
      // If successful, show success toast
      toast.add({
        title: "Login successful",
        description: "Welcome back!",
        color: "primary",
        icon: "i-lucide-check-circle",
      });
      // Redirect to dashboard (handled by watch on isAuthenticated)
    } else {
      // Login failed - show error
      const message =
        result.message || authError.value || "Login failed. Please check your credentials.";
      errorMessage.value = message;

      toast.add({
        title: "Login failed",
        description: message,
        color: "error",
        icon: "i-lucide-x-circle",
      });
    }
  } catch (err) {
    // Handle unexpected errors
    const message =
      err instanceof Error
        ? err.message
        : authError.value || "Login failed. Please check your credentials.";
    errorMessage.value = message;

    toast.add({
      title: "Login failed",
      description: message,
      color: "error",
      icon: "i-lucide-x-circle",
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
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-50 via-white to-emerald-50 dark:from-navy-950 dark:via-zinc-900 dark:to-emerald-950 px-4 py-12 sm:px-6 lg:px-8"
  >
    <!-- Background Pattern Overlay -->
    <div class="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]" />

    <main class="relative w-full max-w-md">
      <!-- Logo and Header Section -->
      <div class="text-center mb-8 space-y-6">
        <!-- App Logo -->
        <div class="flex justify-center">
          <div class="relative logo-wrapper">
            <!-- Logo with shine effect -->
            <div
              class="logo-shine relative w-36 h-36 sm:w-44 sm:h-44 lg:w-48 2xl:w-52 lg:h-48 2xl:h-52"
            >
              <NuxtImg
                src="/icons/app-icon.svg"
                alt="Stock Management System Logo"
                class="w-full h-full drop-shadow-2xl"
                loading="eager"
              />
            </div>
          </div>
        </div>

        <!-- Title and Subtitle -->
        <div class="space-y-2">
          <h1
            class="text-3xl sm:text-4xl xl:text-5xl font-bold text-navy-600 dark:text-navy-400 smooth-transition"
          >
            Stock Management
          </h1>
          <p class="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-medium">
            Multi-Location Inventory System
          </p>
        </div>
      </div>

      <!-- Login Card with Enhanced Design -->
      <UCard
        class="backdrop-blur-sm bg-white/80 dark:bg-zinc-900/80 shadow-2xl border border-zinc-200/50 dark:border-zinc-700/50 smooth-transition"
      >
        <template #header>
          <div class="text-center space-y-2 pb-2">
            <h2 class="text-2xl font-bold text-navy-600 dark:text-navy-400">Welcome Back</h2>
            <p class="text-sm text-zinc-600 dark:text-zinc-400">Sign in to access your dashboard</p>
          </div>
        </template>

        <!-- Login Form -->
        <UForm :schema="schema" :state="state" class="space-y-5" @submit="onSubmit">
          <!-- Error Alert with Enhanced Styling -->
          <UAlert
            v-if="errorMessage"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="errorMessage"
            class="animate-shake"
            :close-button="{
              icon: 'i-lucide-x',
              color: 'error',
              variant: 'link',
              padded: false,
            }"
            @close="errorMessage = ''"
          />

          <!-- Email/Username Field with Enhanced Design -->
          <UFormField label="Email or Username" name="email" required>
            <UInput
              v-model="state.email"
              type="text"
              placeholder="admin@foodstock.local or admin"
              icon="i-lucide-user"
              size="xl"
              :disabled="loading"
              autocomplete="username"
              class="w-full"
            />
          </UFormField>

          <!-- Password Field with Enhanced Design -->
          <UFormField label="Password" name="password" required>
            <UInput
              v-model="state.password"
              type="password"
              placeholder="Enter your password"
              icon="i-lucide-lock"
              size="xl"
              :disabled="loading"
              autocomplete="current-password"
              class="w-full"
            />
          </UFormField>

          <!-- Submit Button with Enhanced Styling -->
          <UButton
            type="submit"
            color="primary"
            size="xl"
            block
            :loading="loading"
            :disabled="loading"
            class="cursor-pointer font-semibold shadow-lg hover:shadow-xl smooth-transition mt-6"
          >
            <span class="flex items-center justify-center gap-2">
              <UIcon v-if="!loading" name="i-lucide-log-in" class="w-5 h-5" />
              <span>{{ loading ? "Signing in..." : "Sign In" }}</span>
            </span>
          </UButton>
        </UForm>

        <template #footer>
          <div class="text-center space-y-3 pt-2">
            <!-- Divider -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-zinc-200 dark:border-zinc-700" />
              </div>
              <div class="relative flex justify-center text-xs">
                <span class="px-2 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400">
                  Default Credentials
                </span>
              </div>
            </div>

            <!-- Default Credentials Info -->
            <div
              class="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700"
            >
              <p class="text-xs text-zinc-600 dark:text-zinc-400 mb-2">For testing purposes:</p>
              <div class="space-y-1">
                <div class="flex items-center justify-between gap-2 text-xs">
                  <span class="text-zinc-500 dark:text-zinc-400">Email:</span>
                  <code
                    class="font-mono text-navy-600 dark:text-navy-400 bg-white dark:bg-zinc-900 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700"
                  >
                    admin@foodstock.local
                  </code>
                </div>
                <div class="flex items-center justify-between gap-2 text-xs">
                  <span class="text-zinc-500 dark:text-zinc-400">Password:</span>
                  <code
                    class="font-mono text-navy-600 dark:text-navy-400 bg-white dark:bg-zinc-900 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700"
                  >
                    Admin@123
                  </code>
                </div>
              </div>
            </div>
          </div>
        </template>
      </UCard>

      <!-- Footer Info with Enhanced Styling -->
      <footer class="mt-8 text-center space-y-2">
        <div
          class="flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
        >
          <UIcon
            name="i-lucide-shield-check"
            class="w-4 h-4 text-emerald-600 dark:text-emerald-400"
          />
          <span>Secure Authentication</span>
        </div>
        <p class="text-xs text-zinc-500 dark:text-zinc-500">Stock Management System v1.0</p>
        <p class="text-xs text-zinc-400 dark:text-zinc-600">© 2025 All rights reserved</p>
      </footer>
    </main>
  </div>
</template>

<style scoped>
/* Grid Pattern Background */
.bg-grid-pattern {
  background-image:
    linear-gradient(to right, currentColor 1px, transparent 1px),
    linear-gradient(to bottom, currentColor 1px, transparent 1px);
  background-size: 24px 24px;
}

/* Shake Animation for Error Alert */
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-4px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(4px);
  }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

/* Smooth Transition Utility */
.smooth-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Logo Shine Effect */
.logo-shine {
  position: relative;
  overflow: hidden;
  border-radius: 9999px;
  transition: transform 0.4s ease;
}

.logo-shine::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: skewX(-25deg);
  animation: shine 4s ease-in-out infinite;
}

@keyframes shine {
  0%,
  100% {
    left: -100%;
  }
  50%,
  60% {
    left: 150%;
  }
}

/* Hover effect on logo */
.logo-shine:hover {
  transform: scale(1.05);
}
</style>
