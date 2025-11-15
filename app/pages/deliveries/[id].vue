<script setup lang="ts">
import { formatCurrency, formatDate, formatDateTime } from "~/utils/format";

// SEO
useSeoMeta({
  title: "Delivery Details - Stock Management System",
  description: "View delivery details and line items",
});

// Composables
const router = useRouter();
const route = useRoute();
const toast = useAppToast();

// Types
interface DeliveryLine {
  id: string;
  item: {
    id: string;
    code: string;
    name: string;
    unit: string;
    category: string | null;
    sub_category: string | null;
  };
  quantity: number;
  unit_price: number;
  period_price: number | null;
  price_variance: number;
  line_value: number;
  has_variance: boolean;
  variance_percentage: string | null;
}

interface NCR {
  id: string;
  ncr_no: string;
  type: string;
  status: string;
  reason: string | null;
  quantity: number | null;
  value: number;
  created_at: string;
  delivery_line_id: string | null;
  creator: {
    id: string;
    username: string;
    full_name: string;
  };
}

interface Delivery {
  id: string;
  delivery_no: string;
  delivery_date: string;
  invoice_no: string | null;
  delivery_note: string | null;
  total_amount: number;
  has_variance: boolean;
  posted_at: string;
  location: {
    id: string;
    code: string;
    name: string;
    type: string;
  };
  supplier: {
    id: string;
    code: string;
    name: string;
    contact: string | null;
  };
  period: {
    id: string;
    name: string;
    status: string;
    start_date: string;
    end_date: string;
  };
  po: {
    id: string;
    po_no: string;
    status: string;
    total_amount: number;
  } | null;
  poster: {
    id: string;
    username: string;
    full_name: string;
    role: string;
  };
  lines: DeliveryLine[];
  ncrs: NCR[];
  summary: {
    total_lines: number;
    total_items: number;
    total_amount: number;
    variance_lines: number;
    total_variance_amount: number;
    ncr_count: number;
  };
}

// State
const loading = ref(true);
const error = ref<string | null>(null);
const delivery = ref<Delivery | null>(null);

// Computed
const deliveryId = computed(() => route.params.id as string);
const hasVarianceLines = computed(() => delivery.value?.summary.variance_lines ?? 0 > 0);
const varianceLinesCount = computed(() => delivery.value?.summary.variance_lines ?? 0);
const totalVarianceAmount = computed(() => delivery.value?.summary.total_variance_amount ?? 0);

// Fetch delivery details
async function fetchDelivery() {
  if (!deliveryId.value) {
    error.value = "No delivery ID provided";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await $fetch<{ delivery: Delivery }>(`/api/deliveries/${deliveryId.value}`);
    delivery.value = response.delivery;
  } catch (err: any) {
    error.value = err?.data?.message || "Failed to fetch delivery details";
    console.error("Error fetching delivery:", err);
  } finally {
    loading.value = false;
  }
}

// Get variance badge color
function getVarianceBadgeColor(variance: number): string {
  if (variance > 0) return "red";
  if (variance < 0) return "emerald";
  return "gray";
}

// Get NCR status color
function getNcrStatusColor(
  status: string
): "primary" | "secondary" | "success" | "error" | "warning" | "info" | "neutral" {
  switch (status) {
    case "OPEN":
      return "warning";
    case "SENT":
      return "info";
    case "CREDITED":
      return "success";
    case "REJECTED":
      return "error";
    case "RESOLVED":
      return "neutral";
    default:
      return "neutral";
  }
}

// Navigation
function goBack() {
  router.push("/deliveries");
}

function goToNcr(ncrId: string) {
  router.push(`/ncr/${ncrId}`);
}

// Print (optional for MVP - placeholder)
function printDelivery() {
  toast.info("Print functionality coming soon");
  // In future: window.print() or generate PDF
}

// Initial load
onMounted(async () => {
  await fetchDelivery();
});
</script>

<template>
  <div class="bg-default p-4 md:p-6">
    <!-- Page Header -->
    <div class="mb-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <UButton
              icon="i-lucide-arrow-left"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="goBack"
            />
            <h1 class="text-2xl font-bold text-default">Delivery Details</h1>
          </div>
          <nav class="flex items-center space-x-2 text-sm text-muted ml-10">
            <NuxtLink to="/" class="hover:text-primary">Home</NuxtLink>
            <span>/</span>
            <NuxtLink to="/deliveries" class="hover:text-primary">Deliveries</NuxtLink>
            <span>/</span>
            <span class="text-default">{{ delivery?.delivery_no || "Loading..." }}</span>
          </nav>
        </div>
        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-printer"
            label="Print"
            @click="printDelivery"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" @retry="fetchDelivery" class="mb-6" />

    <!-- Delivery Details -->
    <div v-else-if="delivery" class="space-y-6">
      <!-- Price Variance Alert -->
      <UAlert
        v-if="hasVarianceLines"
        icon="i-lucide-alert-triangle"
        color="warning"
        variant="subtle"
        title="Price Variance Detected"
        :description="`${varianceLinesCount} item(s) have price variance totaling ${formatCurrency(
          totalVarianceAmount
        )}. ${delivery.summary.ncr_count} NCR(s) were automatically generated.`"
      />

      <!-- Delivery Header Card -->
      <UCard class="card-elevated">
        <template #header>
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-xl font-bold text-default">
                {{ delivery.delivery_no }}
              </h2>
              <p class="text-sm text-muted mt-1">
                Posted by {{ delivery.poster.full_name }} on
                {{ formatDateTime(delivery.posted_at) }}
              </p>
            </div>
            <UBadge
              v-if="delivery.has_variance"
              color="warning"
              variant="soft"
              size="lg"
              class="inline-flex items-center gap-1"
            >
              <UIcon name="i-lucide-alert-triangle" class="h-4 w-4" />
              Has Variance
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Delivery Information -->
          <div>
            <h3 class="text-sm font-semibold text-muted uppercase mb-3">Delivery Information</h3>
            <dl class="space-y-2">
              <div>
                <dt class="text-sm text-muted">Delivery Date</dt>
                <dd class="text-sm font-medium text-default">
                  {{ formatDate(delivery.delivery_date) }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-muted">Invoice Number</dt>
                <dd class="text-sm font-medium text-default">
                  {{ delivery.invoice_no || "—" }}
                </dd>
              </div>
              <div v-if="delivery.po">
                <dt class="text-sm text-muted">Purchase Order</dt>
                <dd class="text-sm font-medium text-default">
                  {{ delivery.po.po_no }}
                  <UBadge
                    :color="delivery.po.status === 'OPEN' ? 'success' : 'neutral'"
                    variant="soft"
                    size="xs"
                    class="ml-2"
                  >
                    {{ delivery.po.status }}
                  </UBadge>
                </dd>
              </div>
            </dl>
          </div>

          <!-- Supplier Information -->
          <div>
            <h3 class="text-sm font-semibold text-muted uppercase mb-3">Supplier</h3>
            <dl class="space-y-2">
              <div>
                <dt class="text-sm text-muted">Name</dt>
                <dd class="text-sm font-medium text-default">
                  {{ delivery.supplier.name }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-muted">Code</dt>
                <dd class="text-sm font-medium text-default">
                  {{ delivery.supplier.code }}
                </dd>
              </div>
              <div v-if="delivery.supplier.contact">
                <dt class="text-sm text-muted">Contact</dt>
                <dd class="text-sm font-medium text-default">
                  {{ delivery.supplier.contact }}
                </dd>
              </div>
            </dl>
          </div>

          <!-- Location & Period -->
          <div>
            <h3 class="text-sm font-semibold text-muted uppercase mb-3">Location & Period</h3>
            <dl class="space-y-2">
              <div>
                <dt class="text-sm text-muted">Location</dt>
                <dd class="text-sm font-medium text-default">
                  {{ delivery.location.name }}
                  <span class="text-xs text-muted">({{ delivery.location.code }})</span>
                </dd>
              </div>
              <div>
                <dt class="text-sm text-muted">Period</dt>
                <dd class="text-sm font-medium text-default">
                  {{ delivery.period.name }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Delivery Note -->
        <div v-if="delivery.delivery_note" class="mt-6 pt-6 border-t border-default">
          <h3 class="text-sm font-semibold text-muted uppercase mb-2">Delivery Note</h3>
          <p class="text-sm text-default">{{ delivery.delivery_note }}</p>
        </div>
      </UCard>

      <!-- Delivery Lines Card -->
      <UCard class="card-elevated">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-default">Delivery Items</h2>
            <div class="text-sm text-muted">
              {{ delivery.summary.total_lines }} item(s),
              {{ delivery.summary.total_items.toFixed(2) }} total units
            </div>
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-default bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  Item
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  Quantity
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  Unit Price
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  Period Price
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  Variance
                </th>
                <th
                  class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted"
                >
                  Line Value
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr
                v-for="line in delivery.lines"
                :key="line.id"
                :class="{
                  'bg-amber-50 dark:bg-amber-950/20': line.has_variance,
                }"
              >
                <!-- Item -->
                <td class="px-4 py-3">
                  <div class="font-medium text-sm text-default">
                    {{ line.item.name }}
                  </div>
                  <div class="text-xs text-muted">
                    {{ line.item.code }} · {{ line.item.unit }}
                    <span v-if="line.item.category">· {{ line.item.category }}</span>
                  </div>
                </td>

                <!-- Quantity -->
                <td class="px-4 py-3 text-right text-sm text-default">
                  {{ line.quantity.toFixed(4) }}
                </td>

                <!-- Unit Price -->
                <td class="px-4 py-3 text-right text-sm font-medium text-default">
                  {{ formatCurrency(line.unit_price) }}
                </td>

                <!-- Period Price -->
                <td class="px-4 py-3 text-right text-sm text-muted">
                  {{ line.period_price ? formatCurrency(line.period_price) : "—" }}
                </td>

                <!-- Variance -->
                <td class="px-4 py-3 text-right">
                  <div v-if="line.has_variance" class="flex items-center justify-end gap-2">
                    <UIcon name="i-lucide-alert-triangle" class="text-amber-500 h-4 w-4" />
                    <div class="text-right">
                      <div
                        :class="[
                          'text-sm font-medium',
                          line.price_variance > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400',
                        ]"
                      >
                        {{ formatCurrency(line.price_variance) }}
                      </div>
                      <div v-if="line.variance_percentage" class="text-xs text-muted">
                        ({{ line.variance_percentage }}%)
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-sm text-muted">—</span>
                </td>

                <!-- Line Value -->
                <td class="px-4 py-3 text-right text-sm font-semibold text-default">
                  {{ formatCurrency(line.line_value) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div class="mt-6 pt-6 border-t border-default">
          <div class="flex justify-end">
            <div class="space-y-2 min-w-[300px]">
              <div class="flex justify-between items-center">
                <span class="text-sm text-muted">Total Items:</span>
                <span class="text-sm font-medium text-default">
                  {{ delivery.summary.total_lines }}
                </span>
              </div>
              <div v-if="hasVarianceLines" class="flex justify-between items-center">
                <span class="text-sm text-muted">Items with Variance:</span>
                <span class="text-sm font-medium text-amber-600 dark:text-amber-400">
                  {{ varianceLinesCount }}
                </span>
              </div>
              <div v-if="hasVarianceLines" class="flex justify-between items-center">
                <span class="text-sm text-muted">Total Variance:</span>
                <span
                  :class="[
                    'text-sm font-medium',
                    totalVarianceAmount > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-600 dark:text-emerald-400',
                  ]"
                >
                  {{ formatCurrency(totalVarianceAmount) }}
                </span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t border-default">
                <span class="text-base font-semibold text-default">Total Amount:</span>
                <span class="text-xl font-bold text-primary">
                  {{ formatCurrency(delivery.total_amount) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Auto-Generated NCRs Card -->
      <UCard v-if="delivery.ncrs.length > 0" class="card-elevated">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-alert-octagon" class="h-5 w-5 text-amber-500" />
            <h2 class="text-lg font-semibold text-default">Non-Conformance Reports (NCRs)</h2>
            <UBadge color="warning" variant="soft">
              {{ delivery.ncrs.length }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-4">
          <div
            v-for="ncr in delivery.ncrs"
            :key="ncr.id"
            class="rounded-lg border border-default bg-default p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            @click="goToNcr(ncr.id)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-semibold text-default">{{ ncr.ncr_no }}</span>
                  <UBadge :color="getNcrStatusColor(ncr.status)" variant="soft" size="xs">
                    {{ ncr.status }}
                  </UBadge>
                  <UBadge
                    v-if="ncr.type === 'PRICE_VARIANCE'"
                    color="warning"
                    variant="soft"
                    size="xs"
                  >
                    Auto-Generated
                  </UBadge>
                </div>
                <p v-if="ncr.reason" class="text-sm text-muted mb-2">
                  {{ ncr.reason }}
                </p>
                <div class="flex items-center gap-4 text-xs text-muted">
                  <span>Created: {{ formatDate(ncr.created_at) }}</span>
                  <span>By: {{ ncr.creator.full_name }}</span>
                  <span v-if="ncr.quantity">Qty: {{ ncr.quantity }}</span>
                  <span>Value: {{ formatCurrency(ncr.value) }}</span>
                </div>
              </div>
              <UIcon name="i-lucide-chevron-right" class="h-5 w-5 text-muted" />
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Not Found State -->
    <EmptyState
      v-else
      icon="i-lucide-package-x"
      title="Delivery Not Found"
      description="The delivery you're looking for doesn't exist or has been removed."
    >
      <template #action>
        <UButton
          color="primary"
          icon="i-lucide-arrow-left"
          label="Back to Deliveries"
          @click="goBack"
        />
      </template>
    </EmptyState>
  </div>
</template>
