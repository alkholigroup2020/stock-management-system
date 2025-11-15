<script setup lang="ts">
import { formatCurrency, formatDate, formatDateTime } from "~/utils/format";

// Types
interface Issue {
  id: string;
  issue_no: string;
  issue_date: string;
  cost_centre: "FOOD" | "CLEAN" | "OTHER";
  total_value: string | number;
  posted_at: string;
  location: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
  period: {
    id: string;
    name: string;
    status: string;
    start_date: string;
    end_date: string;
  };
  poster: {
    id: string;
    username: string;
    full_name: string;
    role: string;
  };
  lines: Array<{
    id: string;
    quantity: string | number;
    wac_at_issue: string | number;
    line_value: string | number;
    item: {
      id: string;
      name: string;
      code: string;
      unit: string;
      category?: string | null;
      sub_category?: string | null;
    };
  }>;
  summary: {
    total_lines: number;
    total_items: number;
    total_value: string | number;
  };
}

// SEO
useSeoMeta({
  title: "Issue Details - Stock Management System",
  description: "View stock issue details",
});

// Composables
const route = useRoute();
const router = useRouter();
const toast = useAppToast();

// State
const loading = ref(false);
const error = ref<string | null>(null);
const issue = ref<Issue | null>(null);

// Computed
const issueId = computed(() => route.params.id as string);

// Fetch issue details
async function fetchIssue() {
  loading.value = true;
  error.value = null;

  try {
    const data = (await $fetch(`/api/issues/${issueId.value}`)) as unknown;
    // API returns { issue: {...} }, extract the issue object
    const response = data as { issue: Issue };
    issue.value = response.issue;
  } catch (err) {
    error.value =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to fetch issue details";
    console.error("Error fetching issue:", err);
  } finally {
    loading.value = false;
  }
}

// Get cost centre badge color
function getCostCentreColor(
  costCentre: string
): "primary" | "secondary" | "success" | "error" | "warning" | "info" | "neutral" {
  switch (costCentre) {
    case "FOOD":
      return "success";
    case "CLEAN":
      return "info";
    case "OTHER":
      return "neutral";
    default:
      return "neutral";
  }
}

// Go back to issues list
function goBack() {
  router.push("/issues");
}

// Initial load
onMounted(() => {
  fetchIssue();
});
</script>

<template>
  <div class="bg-default p-4 md:p-6">
    <!-- Page Header -->
    <PageHeader title="Issue Details" icon="file-minus">
      <template #breadcrumbs>
        <nav class="flex items-center space-x-2 text-caption">
          <NuxtLink to="/" class="hover:text-primary">Home</NuxtLink>
          <span>/</span>
          <NuxtLink to="/issues" class="hover:text-primary">Issues</NuxtLink>
          <span>/</span>
          <span>{{ issue?.issue_no || "Loading..." }}</span>
        </nav>
      </template>
      <template #actions>
        <UButton color="neutral" variant="soft" icon="i-lucide-arrow-left" @click="goBack">
          Back to Issues
        </UButton>
      </template>
    </PageHeader>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" class="mt-6" @retry="fetchIssue" />

    <!-- Issue Details -->
    <div v-else-if="issue" class="mt-6 space-y-6">
      <!-- Issue Header Card -->
      <UCard class="card-elevated">
        <template #header>
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-heading font-bold">
                {{ issue.issue_no }}
              </h2>
              <p class="mt-1 text-caption">Posted on {{ formatDate(issue.issue_date) }}</p>
            </div>
            <UBadge :color="getCostCentreColor(issue.cost_centre)" variant="soft" size="lg">
              {{ issue.cost_centre }}
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Location -->
          <div>
            <div class="text-caption">Location</div>
            <div class="mt-1 font-medium">
              {{ issue.location?.name }}
            </div>
            <div class="text-caption">
              {{ issue.location?.code }}
            </div>
          </div>

          <!-- Period -->
          <div>
            <div class="text-caption">Period</div>
            <div class="mt-1 font-medium">
              {{ issue.period?.name }}
            </div>
          </div>

          <!-- Posted By -->
          <div>
            <div class="text-caption">Posted By</div>
            <div class="mt-1 font-medium">
              {{ issue.poster?.full_name }}
            </div>
            <div class="text-caption">
              {{ formatDateTime(issue.posted_at) }}
            </div>
          </div>

          <!-- Total Value -->
          <div>
            <div class="text-caption">Total Value</div>
            <div class="mt-1 text-heading font-bold text-primary">
              {{ formatCurrency(issue.total_value) }}
            </div>
          </div>
        </div>
      </UCard>

      <!-- Issue Lines Card -->
      <UCard class="card-elevated">
        <template #header>
          <h2 class="text-subheading font-semibold">Issue Items</h2>
        </template>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-default">
            <thead>
              <tr class="bg-default">
                <th class="px-4 py-3 text-left text-label uppercase">Item</th>
                <th class="px-4 py-3 text-right text-label uppercase">
                  Quantity
                </th>
                <th class="px-4 py-3 text-right text-label uppercase">WAC</th>
                <th class="px-4 py-3 text-right text-label uppercase">
                  Line Value
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="line in issue.lines" :key="line.id">
                <!-- Item -->
                <td class="px-4 py-3">
                  <div class="font-medium">
                    {{ line.item?.name }}
                  </div>
                  <div class="text-caption">
                    {{ line.item?.code }} - {{ line.item?.unit }}
                  </div>
                  <div v-if="line.item?.category" class="text-caption">
                    {{ line.item.category }}
                  </div>
                </td>

                <!-- Quantity -->
                <td class="px-4 py-3 text-right">
                  <span class="text-body font-medium">
                    {{
                      typeof line.quantity === "number"
                        ? line.quantity.toFixed(4)
                        : parseFloat(line.quantity).toFixed(4)
                    }}
                  </span>
                </td>

                <!-- WAC -->
                <td class="px-4 py-3 text-right">
                  <span class="text-caption">
                    {{ formatCurrency(line.wac_at_issue) }}
                  </span>
                </td>

                <!-- Line Value -->
                <td class="px-4 py-3 text-right">
                  <span class="text-body font-medium">
                    {{ formatCurrency(line.line_value) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div class="mt-4 pt-4 border-t border-default">
          <div class="flex justify-between items-center">
            <div class="text-caption">
              Total: {{ issue.summary.total_lines }} line(s),
              {{ issue.summary.total_items }} item(s)
            </div>
            <div class="text-right">
              <div class="text-caption">Grand Total</div>
              <div class="text-heading font-bold text-primary">
                {{ formatCurrency(issue.summary.total_value) }}
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Not Found -->
    <EmptyState
      v-else
      icon="i-lucide-search-x"
      title="Issue Not Found"
      description="The issue you're looking for doesn't exist or you don't have permission to view it."
    >
      <template #action>
        <UButton
          color="primary"
          icon="i-lucide-arrow-left"
          label="Back to Issues"
          @click="goBack"
        />
      </template>
    </EmptyState>
  </div>
</template>
