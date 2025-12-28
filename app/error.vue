<script setup lang="ts">
import type { NuxtError } from "#app";

// Error object from Nuxt
const props = defineProps<{
  error: NuxtError;
}>();

// Computed properties for error details
const statusCode = computed(() => props.error.statusCode || 500);
const statusMessage = computed(() => props.error.statusMessage || "An error occurred");

// Determine error type
const errorType = computed(() => {
  if (statusCode.value === 403) return "forbidden";
  if (statusCode.value === 404) return "notFound";
  if (statusCode.value >= 500) return "server";
  return "client";
});

// Error configuration by type
const errorConfig = computed(() => {
  const configs = {
    forbidden: {
      title: "Access Denied",
      description:
        "You don't have permission to access this page. Please contact your administrator if you believe this is an error.",
      icon: "i-lucide-shield-alert",
      iconColor: "text-amber-500 dark:text-amber-400",
      showHomeButton: true,
      showBackButton: true,
    },
    notFound: {
      title: "Page Not Found",
      description: "The page you're looking for doesn't exist or has been moved.",
      icon: "i-lucide-search-x",
      iconColor: "text-zinc-500 dark:text-zinc-400",
      showHomeButton: true,
      showBackButton: true,
    },
    server: {
      title: "Server Error",
      description: "An unexpected error occurred. Please try again later.",
      icon: "i-lucide-server-crash",
      iconColor: "text-red-500 dark:text-red-400",
      showHomeButton: true,
      showBackButton: false,
    },
    client: {
      title: "Something Went Wrong",
      description: "An error occurred while processing your request.",
      icon: "i-lucide-alert-triangle",
      iconColor: "text-amber-500 dark:text-amber-400",
      showHomeButton: true,
      showBackButton: true,
    },
  };

  return configs[errorType.value];
});

// Navigation actions
const router = useRouter();

const handleGoHome = () => {
  clearError({ redirect: "/" });
};

const handleGoBack = () => {
  // Clear error and navigate back
  clearError();
  router.back();
};

// Clear error and allow user to try again
const handleClearError = () => {
  clearError();
};
</script>

<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center bg-default px-4 py-12">
      <main class="w-full max-w-2xl">
        <!-- Error Card -->
        <UCard class="card-elevated">
          <!-- Error Icon and Status -->
          <div class="text-center space-y-6">
            <!-- Icon -->
            <div class="flex justify-center">
              <UIcon :name="errorConfig.icon" :class="errorConfig.iconColor" class="w-24 h-24" />
            </div>

            <!-- Status Code -->
            <div>
              <h1 class="text-6xl font-bold text-primary mb-2">
                {{ statusCode }}
              </h1>
              <h2 class="text-2xl font-semibold text-[var(--ui-text)]">
                {{ errorConfig.title }}
              </h2>
            </div>

            <!-- Error Message -->
            <div class="space-y-2">
              <p class="text-[var(--ui-text-muted)] text-lg">
                {{ errorConfig.description }}
              </p>

              <!-- Display specific error message if provided -->
              <p
                v-if="statusMessage && statusMessage !== errorConfig.title"
                class="text-sm text-[var(--ui-text-muted)] bg-[var(--ui-bg-muted)] rounded-lg p-3 mt-3"
              >
                {{ statusMessage }}
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <!-- Go Back Button -->
              <UButton
                v-if="errorConfig.showBackButton"
                color="neutral"
                variant="outline"
                size="lg"
                icon="i-lucide-arrow-left"
                class="cursor-pointer rounded-full px-6"
                @click="handleGoBack"
              >
                Go Back
              </UButton>

              <!-- Go to Dashboard Button -->
              <UButton
                v-if="errorConfig.showHomeButton"
                color="primary"
                size="lg"
                icon="i-lucide-home"
                class="cursor-pointer rounded-full px-6"
                @click="handleGoHome"
              >
                Go to Dashboard
              </UButton>
            </div>

            <!-- Additional Help for 403 Errors -->
            <div v-if="errorType === 'forbidden'" class="pt-6 border-t border-[var(--ui-border)]">
              <div class="text-sm text-[var(--ui-text-muted)] space-y-2">
                <p class="font-semibold">Need access to this page?</p>
                <ul class="text-left space-y-1 max-w-md mx-auto">
                  <li class="flex items-start gap-2">
                    <UIcon
                      name="i-lucide-check"
                      class="w-4 h-4 mt-0.5 text-primary flex-shrink-0"
                    />
                    <span>Contact your supervisor or administrator</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <UIcon
                      name="i-lucide-check"
                      class="w-4 h-4 mt-0.5 text-primary flex-shrink-0"
                    />
                    <span>Request the appropriate role permissions</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <UIcon
                      name="i-lucide-check"
                      class="w-4 h-4 mt-0.5 text-primary flex-shrink-0"
                    />
                    <span>Ensure you're logged in with the correct account</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Footer Info -->
        <footer class="text-center text-caption mt-6">
          <p>Stock Management System</p>
          <p class="mt-1">If this problem persists, please contact support</p>
        </footer>
      </main>
    </div>
  </UApp>
</template>
