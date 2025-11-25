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
    description:
      "Stock consumption report by location and cost centre with top consumed items.",
    icon: "i-lucide-package-minus",
    href: "/reports/issues",
    color: "warning" as const,
    features: ["Cost centre breakdown", "Top consumed items", "Period filtering", "CSV export"],
  },
];
</script>

<template>
  <div class="p-4 md:p-6">
    <!-- Page Header -->
    <LayoutPageHeader
      title="Reports"
      subtitle="Generate and export various inventory reports"
      icon="i-lucide-file-bar-chart"
      :show-location="false"
      :show-period="false"
    />

    <!-- Reports Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <NuxtLink
        v-for="report in reports"
        :key="report.id"
        :to="report.href"
        class="card-elevated p-6 hover:border-[var(--ui-primary)] transition-colors group cursor-pointer"
      >
        <div class="flex items-start gap-4">
          <!-- Icon -->
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
            :class="{
              'bg-(--ui-primary)/10': report.color === 'primary',
              'bg-emerald-500/10': report.color === 'secondary',
              'bg-blue-500/10': report.color === 'info',
              'bg-amber-500/10': report.color === 'warning',
            }"
          >
            <UIcon
              :name="report.icon"
              class="text-2xl"
              :class="{
                'text-primary': report.color === 'primary',
                'text-emerald-500': report.color === 'secondary',
                'text-blue-500': report.color === 'info',
                'text-amber-500': report.color === 'warning',
              }"
            />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <h3
              class="text-subheading font-semibold group-hover:text-[var(--ui-primary)] transition-colors"
            >
              {{ report.title }}
            </h3>
            <p class="text-caption mt-1">{{ report.description }}</p>

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
          <UIcon
            name="i-lucide-chevron-right"
            class="text-muted group-hover:text-[var(--ui-primary)] transition-colors shrink-0"
          />
        </div>
      </NuxtLink>
    </div>

    <!-- Quick Info -->
    <div class="mt-8 card-elevated p-6">
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
          <UIcon name="i-lucide-info" class="text-xl text-blue-500" />
        </div>
        <div>
          <h4 class="font-medium text-default">About Reports</h4>
          <p class="text-caption mt-1">
            All reports support filtering by location, period, and other criteria. Data can be
            exported to CSV format for further analysis in spreadsheet applications. Reports are
            generated in real-time based on current database values.
          </p>
          <ul class="mt-3 space-y-1 text-caption">
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="text-emerald-500" />
              <span>Real-time data from the database</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="text-emerald-500" />
              <span>Export to CSV with proper formatting</span>
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-check" class="text-emerald-500" />
              <span>Role-based access (only see your locations)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
