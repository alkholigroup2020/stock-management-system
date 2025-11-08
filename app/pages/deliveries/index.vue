<script setup lang="ts">
useSeoMeta({
  title: "Deliveries - Stock Management System",
  description: "Multi-location inventory management system",
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-navy-500 dark:text-navy-400 mb-2">
          Deliveries
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Welcome to the Deliveries Page!
        </p>
      </div>

      <div>
        <UButton color="primary" variant="solid" size="lg"
          >Add New Delivery</UButton
        >
      </div>
    </div>
  </div>
</template>
