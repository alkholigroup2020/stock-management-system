<template>
  <UApp>
    <div class="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <!-- Header with Color Mode Toggle -->
      <header class="bg-navy-500 dark:bg-navy-700 text-white p-4">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <h1 class="text-2xl font-bold">Stock Management System</h1>
          <UButton
            :icon="isDark ? 'i-heroicons-moon' : 'i-heroicons-sun'"
            color="white"
            variant="ghost"
            @click="toggleColorMode"
          >
            {{ isDark ? 'Dark Mode' : 'Light Mode' }}
          </UButton>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto p-8">
        <div class="space-y-8">
          <!-- Welcome Section -->
          <section>
            <h2 class="text-3xl font-bold text-navy-500 dark:text-navy-400 mb-4">
              Tailwind CSS v4 Configuration Test
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              Testing custom brand colors and dark mode functionality
            </p>
          </section>

          <!-- Navy Color Palette -->
          <section>
            <h3 class="text-xl font-semibold text-navy-500 dark:text-navy-400 mb-4">
              Navy Blue Palette (#000046)
            </h3>
            <div class="grid grid-cols-5 gap-4">
              <div v-for="shade in [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]" :key="shade">
                <div :class="`bg-navy-${shade} h-20 rounded-lg border border-gray-300 dark:border-gray-700`"></div>
                <p class="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">{{ shade }}</p>
              </div>
            </div>
          </section>

          <!-- Emerald Color Palette -->
          <section>
            <h3 class="text-xl font-semibold text-emerald-500 dark:text-emerald-400 mb-4">
              Emerald Green Palette (#45cf7b)
            </h3>
            <div class="grid grid-cols-5 gap-4">
              <div v-for="shade in [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]" :key="shade">
                <div :class="`bg-emerald-${shade} h-20 rounded-lg border border-gray-300 dark:border-gray-700`"></div>
                <p class="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">{{ shade }}</p>
              </div>
            </div>
          </section>

          <!-- Component Examples -->
          <section>
            <h3 class="text-xl font-semibold text-navy-500 dark:text-navy-400 mb-4">
              Nuxt UI Components with Custom Colors
            </h3>
            <div class="flex gap-4 flex-wrap">
              <UButton color="navy">Navy Button</UButton>
              <UButton color="emerald">Emerald Button</UButton>
              <UButton color="navy" variant="outline">Navy Outline</UButton>
              <UButton color="emerald" variant="outline">Emerald Outline</UButton>
              <UButton color="navy" variant="ghost">Navy Ghost</UButton>
              <UButton color="emerald" variant="ghost">Emerald Ghost</UButton>
            </div>
          </section>

          <!-- Card Examples -->
          <section>
            <h3 class="text-xl font-semibold text-navy-500 dark:text-navy-400 mb-4">
              Card Components
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UCard>
                <template #header>
                  <h4 class="text-lg font-semibold text-navy-500 dark:text-navy-400">Navy Card</h4>
                </template>
                <p class="text-gray-600 dark:text-gray-400">
                  This card demonstrates the navy color scheme with dark mode support.
                </p>
                <template #footer>
                  <UButton color="navy" size="sm">Action</UButton>
                </template>
              </UCard>

              <UCard>
                <template #header>
                  <h4 class="text-lg font-semibold text-emerald-500 dark:text-emerald-400">Emerald Card</h4>
                </template>
                <p class="text-gray-600 dark:text-gray-400">
                  This card demonstrates the emerald color scheme with dark mode support.
                </p>
                <template #footer>
                  <UButton color="emerald" size="sm">Action</UButton>
                </template>
              </UCard>
            </div>
          </section>

          <!-- Status Badge -->
          <section>
            <h3 class="text-xl font-semibold text-navy-500 dark:text-navy-400 mb-4">
              Test Results
            </h3>
            <UAlert
              icon="i-heroicons-check-circle"
              color="emerald"
              variant="subtle"
              title="Configuration Successful"
              description="Tailwind CSS v4 with custom theme colors is working correctly!"
            />
          </section>
        </div>
      </main>
    </div>
  </UApp>
</template>

<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

const toggleColorMode = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>
