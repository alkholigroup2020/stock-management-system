<script setup lang="ts">
useSeoMeta({
  title: "Deliveries - Food Stock Control System",
  description: "Multi-location food inventory management system",
});
</script>
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-navy-500 dark:text-white mb-2">
          Deliveries
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Welcome to the Deliveries Page!
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Deliveries
              </p>
              <p class="text-2xl font-bold text-navy-500">4</p>
            </div>
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center bg-navy-500"
            >
              <UIcon
                name="i-heroicons-building-storefront"
                class="w-6 h-6 text-white"
              />
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
