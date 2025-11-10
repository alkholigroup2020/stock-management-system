<script setup lang="ts">
import { formatCurrency, formatDate } from '~/utils/format'

// SEO
useSeoMeta({
  title: 'Issues - Stock Management System',
  description: 'View and manage stock issues',
})

// Composables
const router = useRouter()
const locationStore = useLocationStore()
const { canPostIssues } = usePermissions()
const toast = useAppToast()

// Types
interface Issue {
  id: string
  issue_no: string
  issue_date: string
  cost_centre: 'FOOD' | 'CLEAN' | 'OTHER'
  total_value: number
  period: {
    id: string
    name: string
  }
  posted_at: string
  posted_by_user: {
    full_name: string
  }
}

// State
const loading = ref(false)
const error = ref<string | null>(null)
const issues = ref<Issue[]>([])

// Filters
const filters = reactive({
  costCentre: '',
  startDate: '',
  endDate: '',
})

// Pagination
const pagination = reactive({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
})

// Computed
const activeLocationId = computed(() => locationStore.activeLocationId)
const hasIssues = computed(() => issues.value.length > 0)
const paginationInfo = computed(() => {
  const start = (pagination.page - 1) * pagination.limit + 1
  const end = Math.min(pagination.page * pagination.limit, pagination.total)
  return `${start}-${end} of ${pagination.total}`
})

// Active filters
const activeFilters = computed(() => {
  const activeFilters: Array<{ key: string; label: string; value: any }> = []
  if (filters.costCentre) {
    activeFilters.push({
      key: 'costCentre',
      label: 'Cost Centre',
      value: filters.costCentre,
    })
  }
  if (filters.startDate) {
    activeFilters.push({
      key: 'startDate',
      label: 'Start Date',
      value: formatDate(filters.startDate),
    })
  }
  if (filters.endDate) {
    activeFilters.push({
      key: 'endDate',
      label: 'End Date',
      value: formatDate(filters.endDate),
    })
  }
  return activeFilters
})

// Cost centre options
const costCentreOptions = [
  { value: '', label: 'All Cost Centres' },
  { value: 'FOOD', label: 'Food' },
  { value: 'CLEAN', label: 'Cleaning' },
  { value: 'OTHER', label: 'Other' },
]

// Table columns
const columns = [
  { key: 'issue_no', label: 'Issue No' },
  { key: 'issue_date', label: 'Date' },
  { key: 'cost_centre', label: 'Cost Centre' },
  { key: 'total_value', label: 'Total Value' },
]

// Fetch issues
async function fetchIssues() {
  if (!activeLocationId.value) {
    error.value = 'No active location selected'
    return
  }

  loading.value = true
  error.value = null

  try {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    })

    if (filters.costCentre) params.append('costCentre', filters.costCentre)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)

    const response = await $fetch<{
      issues: Issue[]
      pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
      }
    }>(`/api/locations/${activeLocationId.value}/issues?${params}`)

    issues.value = response.issues
    pagination.total = response.pagination.total
    pagination.totalPages = response.pagination.totalPages
  } catch (err: any) {
    error.value = err?.data?.message || 'Failed to fetch issues'
    console.error('Error fetching issues:', err)
  } finally {
    loading.value = false
  }
}

// Filter handlers
function clearFilter(key: string) {
  ;(filters as any)[key] = ''
  pagination.page = 1
  fetchIssues()
}

function applyFilters() {
  pagination.page = 1
  fetchIssues()
}

// Pagination handlers
function goToPage(page: number) {
  if (page >= 1 && page <= pagination.totalPages) {
    pagination.page = page
    fetchIssues()
  }
}

function previousPage() {
  if (pagination.page > 1) {
    goToPage(pagination.page - 1)
  }
}

function nextPage() {
  if (pagination.page < pagination.totalPages) {
    goToPage(pagination.page + 1)
  }
}

// Row click handler
function handleRowClick(issue: Issue) {
  router.push(`/issues/${issue.id}`)
}

// Navigation
function goToNewIssue() {
  router.push('/issues/create')
}

// Badge color for cost centre
function getCostCentreColor(costCentre: string) {
  switch (costCentre) {
    case 'FOOD':
      return 'emerald'
    case 'CLEAN':
      return 'blue'
    case 'OTHER':
      return 'neutral'
    default:
      return 'neutral'
  }
}

// Watch location changes
watch(activeLocationId, () => {
  if (activeLocationId.value) {
    pagination.page = 1
    fetchIssues()
  }
})

// Initial load
onMounted(async () => {
  if (activeLocationId.value) {
    await fetchIssues()
  }
})
</script>

<template>
  <div class="min-h-screen bg-[var(--ui-bg)] p-4 md:p-6">
    <!-- Page Header -->
    <div class="mb-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-[var(--ui-text)]">
            Issues
          </h1>
          <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
            View and manage stock issues for {{ locationStore.activeLocation?.name }}
          </p>
        </div>
        <div v-if="canPostIssues" class="flex gap-2">
          <UButton
            color="primary"
            icon="i-lucide-plus"
            label="New Issue"
            @click="goToNewIssue"
          />
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-4">
      <h2 class="mb-4 text-sm font-semibold text-[var(--ui-text)]">Filters</h2>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <!-- Date Range Start -->
        <div>
          <label class="form-label">Start Date</label>
          <input
            v-model="filters.startDate"
            type="date"
            class="form-input w-full"
            placeholder="Start date"
          />
        </div>

        <!-- Date Range End -->
        <div>
          <label class="form-label">End Date</label>
          <input
            v-model="filters.endDate"
            type="date"
            class="form-input w-full"
            placeholder="End date"
          />
        </div>

        <!-- Cost Centre Filter -->
        <div>
          <label class="form-label">Cost Centre</label>
          <select v-model="filters.costCentre" class="form-input w-full">
            <option
              v-for="option in costCentreOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Filter Actions -->
      <div class="mt-4 flex gap-2">
        <UButton
          color="primary"
          icon="i-lucide-filter"
          label="Apply Filters"
          @click="applyFilters"
        />
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-x"
          label="Clear All"
          @click="() => {
            filters.costCentre = ''
            filters.startDate = ''
            filters.endDate = ''
            applyFilters()
          }"
        />
      </div>

      <!-- Active Filters -->
      <div v-if="activeFilters.length > 0" class="mt-4 flex flex-wrap gap-2">
        <span class="text-sm text-[var(--ui-text-muted)]">Active filters:</span>
        <UBadge
          v-for="filter in activeFilters"
          :key="filter.key"
          color="primary"
          variant="soft"
          class="cursor-pointer"
          @click="clearFilter(filter.key)"
        >
          {{ filter.label }}: {{ filter.value }}
          <UIcon name="i-lucide-x" class="ml-1 h-3 w-3" />
        </UBadge>
      </div>
    </div>

    <!-- Error State -->
    <ErrorAlert
      v-if="error"
      :message="error"
      @retry="fetchIssues"
      class="mb-6"
    />

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Issues Table -->
    <div
      v-else-if="hasIssues"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]"
    >
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-[var(--ui-border)] bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ui-text-muted)]"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--ui-border)]">
            <tr
              v-for="issue in issues"
              :key="issue.id"
              class="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
              @click="handleRowClick(issue)"
            >
              <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-[var(--ui-text)]">
                {{ issue.issue_no }}
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-[var(--ui-text)]">
                {{ formatDate(issue.issue_date) }}
              </td>
              <td class="px-4 py-3 text-sm">
                <UBadge
                  :color="getCostCentreColor(issue.cost_centre)"
                  variant="soft"
                >
                  {{ issue.cost_centre }}
                </UBadge>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-[var(--ui-text)]">
                {{ formatCurrency(issue.total_value) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="pagination.totalPages > 1"
        class="flex items-center justify-between border-t border-[var(--ui-border)] px-4 py-3"
      >
        <div class="text-sm text-[var(--ui-text-muted)]">
          {{ paginationInfo }}
        </div>
        <div class="flex gap-1">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-chevron-left"
            :disabled="pagination.page === 1"
            @click="previousPage"
          />

          <template v-for="page in pagination.totalPages" :key="page">
            <UButton
              v-if="page === 1 || page === pagination.totalPages || Math.abs(page - pagination.page) <= 1"
              :color="page === pagination.page ? 'primary' : 'neutral'"
              :variant="page === pagination.page ? 'solid' : 'outline'"
              @click="goToPage(page)"
            >
              {{ page }}
            </UButton>
            <span
              v-else-if="page === 2 || page === pagination.totalPages - 1"
              class="flex items-center px-2 text-[var(--ui-text-muted)]"
            >
              ...
            </span>
          </template>

          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-chevron-right"
            :disabled="pagination.page === pagination.totalPages"
            @click="nextPage"
          />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else
      icon="i-lucide-file-minus"
      title="No Issues Found"
      :description="
        activeFilters.length > 0
          ? 'No issues match your current filters. Try adjusting your search criteria.'
          : 'No issues have been recorded yet. Click the button above to create your first issue.'
      "
    >
      <template v-if="canPostIssues" #action>
        <UButton
          color="primary"
          icon="i-lucide-plus"
          label="New Issue"
          @click="goToNewIssue"
        />
      </template>
    </EmptyState>
  </div>
</template>
