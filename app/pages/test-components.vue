<template>
  <div class="min-h-screen bg-[var(--ui-bg)]">
    <!-- Page Header Component Test -->
    <CommonPageHeader
      title="Global UI Components"
      description="Testing all common components in isolation"
      icon="i-heroicons-cube"
      badge="Testing"
      badge-color="primary"
      :breadcrumbs="[
        { label: 'Home', to: '/' },
        { label: 'Testing' }
      ]"
    >
      <template #actions>
        <UButton color="primary" icon="i-heroicons-plus">
          Create New
        </UButton>
      </template>
    </CommonPageHeader>

    <div class="container mx-auto px-6 py-8 space-y-12">
      <!-- 1. Loading Spinner Tests -->
      <section>
        <h2 class="text-xl font-bold text-[var(--ui-text)] mb-4">1. LoadingSpinner Component</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Small -->
          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold">Small</h3>
            </template>
            <CommonLoadingSpinner size="sm" text="Loading..." />
          </UCard>

          <!-- Medium (default) -->
          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold">Medium (Default)</h3>
            </template>
            <CommonLoadingSpinner text="Please wait..." />
          </UCard>

          <!-- Large -->
          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold">Large</h3>
            </template>
            <CommonLoadingSpinner size="lg" text="Processing..." />
          </UCard>

          <!-- Extra Large with Secondary Color -->
          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold">XL Secondary</h3>
            </template>
            <CommonLoadingSpinner size="xl" color="secondary" text="Syncing..." />
          </UCard>
        </div>
      </section>

      <!-- 2. Error Alert Tests -->
      <section>
        <h2 class="text-xl font-bold text-[var(--ui-text)] mb-4">2. ErrorAlert Component</h2>
        <div class="space-y-4">
          <!-- Error -->
          <CommonErrorAlert
            type="error"
            title="Error"
            description="An error occurred while processing your request."
            dismissible
          />

          <!-- Warning -->
          <CommonErrorAlert
            type="warning"
            title="Warning"
            description="This action cannot be undone. Please proceed with caution."
            dismissible
          />

          <!-- Info -->
          <CommonErrorAlert
            type="info"
            title="Information"
            description="Your session will expire in 5 minutes. Please save your work."
          />

          <!-- Success -->
          <CommonErrorAlert
            type="success"
            title="Success!"
            description="Your changes have been saved successfully."
            dismissible
          />

          <!-- With Retry Button -->
          <CommonErrorAlert
            type="error"
            title="Connection Failed"
            description="Unable to connect to the server. Please check your connection and try again."
            show-retry
            @retry="handleRetry"
          />
        </div>
      </section>

      <!-- 3. Empty State Tests -->
      <section>
        <h2 class="text-xl font-bold text-[var(--ui-text)] mb-4">3. EmptyState Component</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Default Empty State -->
          <UCard>
            <CommonEmptyState
              title="No items found"
              description="There are no items to display. Create your first item to get started."
              show-action
              action-text="Create Item"
              action-icon="i-heroicons-plus"
              @action="handleCreate"
            />
          </UCard>

          <!-- Custom Icon Empty State -->
          <UCard>
            <CommonEmptyState
              icon="i-heroicons-folder-open"
              title="No deliveries yet"
              description="Start by posting your first delivery to track inventory."
              size="sm"
            />
          </UCard>

          <!-- Large Empty State with Action -->
          <UCard class="md:col-span-2">
            <CommonEmptyState
              icon="i-heroicons-chart-bar"
              title="No data available"
              description="Once you start recording transactions, your analytics will appear here."
              size="lg"
              show-action
              action-text="View Tutorial"
              action-color="secondary"
              @action="handleTutorial"
            />
          </UCard>
        </div>
      </section>

      <!-- 4. Page Header Variations -->
      <section>
        <h2 class="text-xl font-bold text-[var(--ui-text)] mb-4">4. PageHeader Component Variations</h2>
        <div class="space-y-4">
          <!-- With Icon and Badge -->
          <UCard>
            <CommonPageHeader
              title="Items & Prices"
              description="Manage inventory items and set period prices"
              icon="i-heroicons-cube"
              badge="12 Active"
              badge-color="success"
            >
              <template #actions>
                <UButton color="primary" icon="i-heroicons-plus">New Item</UButton>
              </template>
            </CommonPageHeader>
          </UCard>

          <!-- With Breadcrumbs -->
          <UCard>
            <CommonPageHeader
              title="Edit Item"
              description="Update item details and pricing information"
              show-back-button
              :breadcrumbs="[
                { label: 'Dashboard', to: '/' },
                { label: 'Items', to: '/items' },
                { label: 'Edit' }
              ]"
            >
              <template #actions>
                <UButton variant="ghost">Cancel</UButton>
                <UButton color="primary">Save Changes</UButton>
              </template>
            </CommonPageHeader>
          </UCard>

          <!-- Small Size -->
          <UCard>
            <CommonPageHeader
              title="Quick Actions"
              size="sm"
            >
              <template #actions>
                <UButton size="xs" variant="ghost">Help</UButton>
              </template>
            </CommonPageHeader>
          </UCard>
        </div>
      </section>

      <!-- 5. Data Table Tests -->
      <section>
        <h2 class="text-xl font-bold text-[var(--ui-text)] mb-4">5. DataTable Component</h2>

        <!-- Loading State -->
        <UCard class="mb-4">
          <template #header>
            <h3 class="text-sm font-semibold">Loading State</h3>
          </template>
          <CommonDataTable
            :columns="tableColumns"
            :loading="true"
          />
        </UCard>

        <!-- Error State -->
        <UCard class="mb-4">
          <template #header>
            <h3 class="text-sm font-semibold">Error State</h3>
          </template>
          <CommonDataTable
            :columns="tableColumns"
            error="Failed to fetch data from the server."
            @retry="handleTableRetry"
          />
        </UCard>

        <!-- Empty State -->
        <UCard class="mb-4">
          <template #header>
            <h3 class="text-sm font-semibold">Empty State</h3>
          </template>
          <CommonDataTable
            :columns="tableColumns"
            :data="[]"
            empty-title="No items found"
            empty-description="Create your first item to get started."
            show-empty-action
            empty-action-text="Create Item"
            @empty-action="handleCreate"
          />
        </UCard>

        <!-- Data with Pagination -->
        <UCard class="mb-4">
          <template #header>
            <h3 class="text-sm font-semibold">Data with Pagination</h3>
          </template>
          <CommonDataTable
            :columns="tableColumns"
            :data="tableData"
            show-pagination
            :page-size="5"
          >
            <template #actions="{ row }">
              <div class="flex gap-2">
                <UButton size="xs" variant="ghost" icon="i-heroicons-pencil" @click="handleEdit(row)">
                  Edit
                </UButton>
                <UButton size="xs" variant="ghost" color="error" icon="i-heroicons-trash" @click="handleDelete(row)">
                  Delete
                </UButton>
              </div>
            </template>
          </CommonDataTable>
        </UCard>

        <!-- Data without Pagination -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold">Data without Pagination</h3>
          </template>
          <CommonDataTable
            :columns="tableColumns"
            :data="tableData.slice(0, 5)"
          >
            <template #column-status="{ value }">
              <UBadge :color="value === 'Active' ? 'success' : 'neutral'">
                {{ value }}
              </UBadge>
            </template>
            <template #actions="{ row }">
              <UButton size="xs" color="primary" @click="handleView(row)">
                View
              </UButton>
            </template>
          </CommonDataTable>
        </UCard>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Page metadata
definePageMeta({
  layout: 'default'
})

// Types
interface TableRow {
  id: number
  code: string
  name: string
  category: string
  unit: string
  status: 'Active' | 'Inactive'
}

// Table columns (with id property for UTable compatibility)
const tableColumns = [
  { key: 'code', label: 'Code', id: 'code' },
  { key: 'name', label: 'Name', id: 'name' },
  { key: 'category', label: 'Category', id: 'category' },
  { key: 'unit', label: 'Unit', id: 'unit' },
  { key: 'status', label: 'Status', id: 'status' },
  { key: 'actions', label: 'Actions', id: 'actions' }
]

// Sample table data
const tableData = ref<TableRow[]>([
  { id: 1, code: 'ITM-001', name: 'Milk Fresh', category: 'Dairy', unit: 'LTR', status: 'Active' },
  { id: 2, code: 'ITM-002', name: 'Tomatoes', category: 'Vegetables', unit: 'KG', status: 'Active' },
  { id: 3, code: 'ITM-003', name: 'Chicken Breast', category: 'Meat', unit: 'KG', status: 'Active' },
  { id: 4, code: 'ITM-004', name: 'Rice Basmati', category: 'Dry Goods', unit: 'KG', status: 'Active' },
  { id: 5, code: 'ITM-005', name: 'Olive Oil', category: 'Cooking Oils', unit: 'LTR', status: 'Active' },
  { id: 6, code: 'ITM-006', name: 'Onions', category: 'Vegetables', unit: 'KG', status: 'Active' },
  { id: 7, code: 'ITM-007', name: 'Cheese Cheddar', category: 'Dairy', unit: 'KG', status: 'Inactive' },
  { id: 8, code: 'ITM-008', name: 'Flour White', category: 'Dry Goods', unit: 'KG', status: 'Active' },
  { id: 9, code: 'ITM-009', name: 'Sugar White', category: 'Dry Goods', unit: 'KG', status: 'Active' },
  { id: 10, code: 'ITM-010', name: 'Salt', category: 'Dry Goods', unit: 'KG', status: 'Active' },
  { id: 11, code: 'ITM-011', name: 'Pepper Black', category: 'Spices', unit: 'KG', status: 'Active' },
  { id: 12, code: 'ITM-012', name: 'Beef Ground', category: 'Meat', unit: 'KG', status: 'Active' }
])

// Event handlers
const handleRetry = () => {
  console.log('Retry clicked')
  alert('Retry action triggered')
}

const handleCreate = () => {
  console.log('Create clicked')
  alert('Create action triggered')
}

const handleTutorial = () => {
  console.log('Tutorial clicked')
  alert('Tutorial action triggered')
}

const handleTableRetry = () => {
  console.log('Table retry clicked')
  alert('Table retry action triggered')
}

const handleEdit = (row: unknown) => {
  const tableRow = row as TableRow
  console.log('Edit row:', tableRow)
  alert(`Edit: ${tableRow.name}`)
}

const handleDelete = (row: unknown) => {
  const tableRow = row as TableRow
  console.log('Delete row:', tableRow)
  alert(`Delete: ${tableRow.name}`)
}

const handleView = (row: unknown) => {
  const tableRow = row as TableRow
  console.log('View row:', tableRow)
  alert(`View: ${tableRow.name}`)
}
</script>
