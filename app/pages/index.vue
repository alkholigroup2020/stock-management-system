<script setup lang="ts">
useSeoMeta({
  title: "Dashboard - Food Stock Control System",
  description: "Multi-location food inventory management system",
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-navy-500 dark:text-white mb-2">
          Dashboard
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Welcome to the Stock Management System
        </p>
      </div>

      <!-- Quick Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Locations
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

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Active Items
              </p>
              <p class="text-2xl font-bold text-emerald-400">0</p>
            </div>
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center bg-emerald-400"
            >
              <UIcon name="i-heroicons-cube" class="w-6 h-6 text-white" />
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Pending Approvals
              </p>
              <p class="text-2xl font-bold text-orange-500">0</p>
            </div>
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center bg-orange-500"
            >
              <UIcon name="i-heroicons-clock" class="w-6 h-6 text-white" />
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Current Period
              </p>
              <p class="text-2xl font-bold text-blue-500">Open</p>
            </div>
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-500"
            >
              <UIcon name="i-heroicons-calendar" class="w-6 h-6 text-white" />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Recent Activity Section -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
        </template>
        <div class="text-center py-12 text-gray-500 dark:text-gray-400">
          <UIcon name="i-heroicons-inbox" class="w-16 h-16 mx-auto mb-4" />
          <p>No recent activity</p>
        </div>
      </UCard>
    </div>
  </div>
</template>
