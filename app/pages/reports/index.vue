<script setup lang="ts">
/**
 * Reports Index Page
 *
 * Lists all available reports with descriptions and navigation links.
 * Provides a central hub for accessing various report types.
 */

// Page metadata
definePageMeta({
  title: "Reports",
});

// Available reports configuration
const reports = [
  {
    id: "stock-now",
    title: "Stock Now Report",
    description:
      "Current stock levels across all locations with values, low stock indicators, and category breakdowns.",
    icon: "i-lucide-package",
    href: "/reports/stock-now",
    color: "primary" as const,
    features: ["Real-time stock levels", "Location breakdown", "Low stock alerts", "CSV export"],
  },
  {
    id: "reconciliation",
    title: "Reconciliation Report",
    description:
      "Period-based reconciliation showing opening stock, receipts, transfers, issues, and closing values.",
    icon: "i-lucide-calculator",
    href: "/reports/reconciliation",
    color: "secondary" as const,
    features: ["Period analysis", "Consumption calculation", "Manday costs", "CSV export"],
  },
  {
    id: "deliveries",
    title: "Deliveries Report",
    description:
      "Detailed delivery history with supplier breakdown, price variances, and NCR summary.",
    icon: "i-lucide-truck",
    href: "/reports/deliveries",
    color: "info" as const,
    features: ["Supplier analysis", "Price variance tracking", "NCR summary", "Date filtering"],
  },
  {
    id: "issues",
    title: "Issues Report",
    description: "Stock consumption report by location and cost centre with top consumed items.",
    icon: "i-lucide-package-minus",
    href: "/reports/issues",
    color: "warning" as const,
    features: ["Cost centre breakdown", "Top consumed items", "Period filtering", "CSV export"],
  },
];
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 sm:gap-4">
        <!-- Responsive icon size - NO background, NO border -->
        <UIcon name="i-lucide-file-bar-chart" class="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
        <div>
          <!-- Responsive title size -->
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Reports</h1>
          <!-- Description: hidden on mobile, visible on sm+ -->
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Generate and export various inventory reports
          </p>
        </div>
      </div>
    </div>

    <!-- Reports Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <NuxtLink
        v-for="report in reports"
        :key="report.id"
        :to="report.href"
        class="card-elevated"
        :class="{ body: 'p-4 sm:p-6' }"
      >
        <UCard class="h-full" :ui="{ body: 'p-4 sm:p-6' }">
          <div class="flex items-start gap-4">
            <!-- Icon - NO background -->
            <UIcon
              :name="report.icon"
              class="w-10 h-10 shrink-0"
              :class="{
                'text-primary': report.color === 'primary',
                'text-emerald-500 dark:text-emerald-400': report.color === 'secondary',
                'text-blue-500 dark:text-blue-400': report.color === 'info',
                'text-amber-500 dark:text-amber-400': report.color === 'warning',
              }"
            />

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                {{ report.title }}
              </h3>
              <p class="text-sm text-[var(--ui-text-muted)] mt-1">{{ report.description }}</p>

              <!-- Features -->
              <div class="flex flex-wrap gap-2 mt-3">
                <UBadge
                  v-for="feature in report.features"
                  :key="feature"
                  color="neutral"
                  variant="subtle"
                  size="xs"
                >
                  {{ feature }}
                </UBadge>
              </div>
            </div>

            <!-- Arrow -->
            <UIcon name="i-lucide-chevron-right" class="w-5 h-5 text-muted shrink-0" />
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <!-- Quick Info -->
    <UCard class="card-elevated" :ui="{ body: 'p-4 sm:p-6' }">
      <div class="flex items-start gap-4">
        <!-- Info icon - NO background -->
        <UIcon name="i-lucide-info" class="w-10 h-10 text-blue-500 dark:text-blue-400 shrink-0" />
        <div>
          <h4 class="font-semibold text-[var(--ui-text)]">About Reports</h4>
          <p class="text-sm text-[var(--ui-text-muted)] mt-1">
            All reports support filtering by location, period, and other criteria. Data can be
            exported to CSV format for further analysis in spreadsheet applications. Reports are
            generated in real-time based on current database values.
          </p>
          <ul class="mt-3 space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Real-time data from the database</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Export to CSV with proper formatting</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Role-based access (only see your locations)</span>
            </li>
          </ul>
        </div>
      </div>
    </UCard>
  </div>
</template>
