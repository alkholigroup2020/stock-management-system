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
  <div class="relative min-h-screen flex overflow-hidden">
    <!-- Split Screen Layout -->
    <div class="flex flex-col lg:flex-row w-full">
      <!-- LEFT PANEL: Brand (Solid Blue Background) -->
      <div class="hidden lg:flex lg:w-2/5 relative overflow-hidden bg-navy-600">
        <!-- Subtle pattern overlay -->
        <div
          class="absolute inset-0 opacity-10"
          style="
            background-image: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 40%);
          "
        />

        <!-- Brand Content - Centered to align with form, raised up slightly -->
        <div class="relative z-10 flex flex-col items-center justify-center w-full px-12 pb-20">
          <!-- Logo with Elegant Glow Effect -->
          <div class="mb-8 logo-container">
            <img
              src="~/assets/css/icons/app-icon.svg"
              alt="Stock Management System Logo"
              class="w-44 h-44 relative z-10 drop-shadow-2xl"
            />
          </div>

          <!-- Branding Text -->
          <div class="text-center space-y-3 mb-10">
            <h1 class="text-4xl font-bold text-white drop-shadow-lg">Stock Management</h1>
            <p class="text-lg font-medium text-white/80">Multi-Location Inventory System</p>
          </div>

          <!-- Feature Highlights -->
          <div class="space-y-5 w-full max-w-sm">
            <div class="flex items-start gap-4 group/feature">
              <div
                class="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-white/15 border border-white/20 transition-all duration-300 group-hover/feature:bg-white/25 group-hover/feature:border-white/30"
              >
                <UIcon name="i-lucide-package" class="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 class="text-white font-semibold mb-0.5">Real-Time Tracking</h3>
                <p class="text-sm text-white/70">
                  Monitor inventory across multiple locations instantly
                </p>
              </div>
            </div>

            <div class="flex items-start gap-4 group/feature">
              <div
                class="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-white/15 border border-white/20 transition-all duration-300 group-hover/feature:bg-white/25 group-hover/feature:border-white/30"
              >
                <UIcon name="i-lucide-arrow-left-right" class="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 class="text-white font-semibold mb-0.5">Smart Transfers</h3>
                <p class="text-sm text-white/70">
                  Seamless stock movement with approval workflows
                </p>
              </div>
            </div>

            <div class="flex items-start gap-4 group/feature">
              <div
                class="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-white/15 border border-white/20 transition-all duration-300 group-hover/feature:bg-white/25 group-hover/feature:border-white/30"
              >
                <UIcon name="i-lucide-chart-line" class="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 class="text-white font-semibold mb-0.5">Analytics & Reports</h3>
                <p class="text-sm text-white/70">Comprehensive insights for better decisions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT PANEL: Login Form -->
      <div
        class="flex-1 relative flex items-center justify-center bg-slate-100 dark:bg-[#0a0f1a]"
      >
        <!-- Mobile background decorations -->
        <div class="absolute inset-0 lg:hidden">
          <div
            class="absolute top-0 right-0 w-72 h-72 rounded-full blur-[100px] animate-pulse bg-navy-500/10 dark:bg-navy-500/10"
            style="animation-duration: 6s"
          />
          <div
            class="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-[100px] animate-pulse bg-emerald-500/5"
            style="animation-duration: 8s"
          />
        </div>

        <!-- Form Container -->
        <div class="relative z-10 w-full max-w-md px-6 py-8 sm:px-8">
          <!-- Mobile Logo -->
          <div class="lg:hidden flex justify-center mb-8">
            <div class="relative group">
              <div
                class="absolute inset-0 rounded-full blur-2xl transition-all duration-300"
                style="background-color: rgba(69, 207, 123, 0.25)"
              />
              <div class="relative transition-transform duration-300 group-hover:scale-105">
                <img
                  src="~/assets/css/icons/app-icon.svg"
                  alt="Stock Management System Logo"
                  class="w-20 h-20 drop-shadow-2xl"
                />
              </div>
            </div>
          </div>

          <!-- Welcome Header -->
          <div class="mb-8 text-center">
            <h2 class="text-3xl sm:text-4xl font-bold text-navy-900 dark:text-white mb-2">
              Welcome Back
            </h2>
            <p class="text-base text-navy-600 dark:text-navy-300">
              Sign in to access your inventory dashboard
            </p>
          </div>

          <!-- Login Form Card -->
          <div
            class="backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 bg-white/95 dark:bg-navy-800/30 border border-navy-200 dark:border-navy-700/50"
          >
            <UForm :schema="schema" :state="state" class="space-y-5" @submit="onSubmit">
              <!-- Error Alert -->
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

              <!-- Email/Username Field -->
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

              <!-- Password Field -->
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

              <!-- Submit Button -->
              <UButton
                type="submit"
                size="xl"
                block
                :loading="loading"
                :disabled="loading"
                class="cursor-pointer font-semibold mt-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span class="flex items-center justify-center gap-2">
                  <UIcon v-if="!loading" name="i-lucide-log-in" class="w-5 h-5" />
                  <span>{{ loading ? "Signing in..." : "Sign In" }}</span>
                </span>
              </UButton>
            </UForm>
          </div>

          <!-- Security Badge -->
          <div
            class="mt-6 flex items-center justify-center gap-2 text-sm text-navy-500 dark:text-navy-400"
          >
            <UIcon name="i-lucide-shield-check" class="w-4 h-4 text-emerald-500" />
            <span>Secure Authentication • End-to-End Encrypted</span>
          </div>

          <!-- Footer (Mobile Only) -->
          <div class="lg:hidden mt-8 text-center">
            <div
              class="flex items-center justify-center gap-3 text-xs text-navy-500 dark:text-navy-500"
            >
              <span>Stock Management System v1.0</span>
              <span>•</span>
              <span>© 2025</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== Elegant Breathing Glow Effect ===== */

/* Container for logo with glow */
.logo-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 180px;
  height: 180px;
}

/* Soft breathing glow behind logo */
.logo-container::before {
  content: "";
  position: absolute;
  inset: -20%;
  border-radius: 50%;
  background: radial-gradient(
    circle at center,
    rgba(69, 207, 123, 0.4) 0%,
    rgba(69, 207, 123, 0.2) 30%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 70%
  );
  animation: gentle-breathe 4s ease-in-out infinite;
  filter: blur(30px);
}

/* Gentle breathing animation - very subtle */
@keyframes gentle-breathe {
  0%, 100% {
    opacity: 0.6;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

/* Optional: Slight scale on hover for interactivity */
.logo-container:hover img {
  transform: scale(1.05);
  transition: transform 0.3s ease-out;
}

/* ===== Error Alert Animation ===== */
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
</style>
