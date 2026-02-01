<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="lg" color="primary" text="Loading delivery details..." />
    </div>

    <!-- Error State -->
    <ErrorAlert v-else-if="error" :message="error" @retry="fetchDelivery" />

    <!-- Delivery Details -->
    <template v-else-if="delivery">
      <!-- Page Header -->
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 sm:gap-4">
          <UIcon name="i-lucide-truck" class="w-6 h-6 sm:w-10 sm:h-10 text-primary" />
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl sm:text-3xl font-bold text-primary">
                {{ delivery.delivery_no }}
              </h1>
              <DeliveryStatusBadge
                :status="delivery.status"
                :pending-approval="isPendingApproval && hasUnapprovedOverDelivery"
                :approved="isPendingApproval && !hasUnapprovedOverDelivery && !isRejected"
                :rejected="isRejected"
              />
            </div>
            <p v-if="isPosted" class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
              Posted by {{ delivery.creator.full_name }} on {{ formatDateTime(delivery.posted_at) }}
            </p>
            <p v-else class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
              Created by {{ delivery.creator.full_name }} on
              {{ formatDateTime(delivery.created_at) }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            size="lg"
            class="cursor-pointer"
            aria-label="Back to deliveries list"
            @click="goBack"
          >
            <span class="hidden sm:inline">Back</span>
          </UButton>

          <!-- Draft Actions -->
          <template v-if="isDraft">
            <UButton
              color="error"
              variant="soft"
              icon="i-lucide-trash-2"
              size="lg"
              class="cursor-pointer rounded-full px-3 sm:px-6"
              aria-label="Delete draft"
              :disabled="isDeletingBlocked"
              @click="showDeleteConfirmation = true"
            >
              <span class="hidden sm:inline">Delete</span>
            </UButton>
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-pencil"
              size="lg"
              class="cursor-pointer rounded-full px-3 sm:px-6"
              aria-label="Edit draft"
              :disabled="isEditingBlocked"
              @click="editDraft"
            >
              <span class="hidden sm:inline">Edit</span>
            </UButton>
            <UButton
              color="primary"
              icon="i-lucide-check"
              size="lg"
              class="cursor-pointer rounded-full px-3 sm:px-6"
              aria-label="Post delivery"
              :disabled="isPostingBlocked"
              @click="showPostConfirmation = true"
            >
              <span class="hidden sm:inline">Post</span>
            </UButton>
          </template>

          <!-- Posted Actions -->
          <UButton
            v-else
            color="neutral"
            variant="outline"
            icon="i-lucide-printer"
            size="lg"
            class="cursor-pointer rounded-full px-3 sm:px-6"
            aria-label="Print delivery"
            @click="printDelivery"
          >
            <span class="hidden sm:inline">Print</span>
          </UButton>
        </div>
      </div>

      <!-- Over-Delivery Rejected Alert -->
      <UAlert
        v-if="isDraft && isRejected"
        icon="i-lucide-x-circle"
        color="error"
        variant="subtle"
        title="Over-Delivery Rejected"
      >
        <template #description>
          <div class="space-y-3">
            <p>
              This delivery was rejected due to over-delivery quantities exceeding the PO limits.
            </p>
            <p class="text-sm">
              <strong>This delivery is now locked.</strong>
              Please create a new delivery with the correct quantities.
            </p>
            <p class="text-sm text-[var(--ui-text-muted)]">
              <UIcon name="i-lucide-lock" class="h-4 w-4 inline mr-1" />
              All actions are disabled for rejected deliveries.
            </p>
          </div>
        </template>
      </UAlert>

      <!-- Over-Delivery Alert (for drafts - not rejected) -->
      <UAlert
        v-else-if="isDraft && hasOverDeliveryLines"
        icon="i-lucide-alert-triangle"
        color="warning"
        variant="subtle"
        :title="
          hasUnapprovedOverDelivery ? 'Over-Delivery Requires Approval' : 'Over-Delivery Approved'
        "
      >
        <template #description>
          <div class="space-y-3">
            <p>
              {{ overDeliveryLinesCount }} item(s) have quantities exceeding the remaining PO
              quantity.
            </p>

            <!-- List of over-delivery items -->
            <div class="bg-[var(--ui-bg)] rounded-md p-3 space-y-1">
              <div
                v-for="line in delivery?.lines.filter((l) => l.is_over_delivery)"
                :key="line.id"
                class="flex justify-between text-sm"
              >
                <span>{{ line.item.name }}</span>
                <span class="text-[var(--ui-text-muted)]">
                  {{ line.quantity.toFixed(2) }} / {{ line.po_line_remaining_qty?.toFixed(2) ?? 0 }}
                  remaining
                  <UBadge
                    v-if="line.over_delivery_approved"
                    color="success"
                    variant="subtle"
                    size="xs"
                    class="ml-2"
                  >
                    Approved
                  </UBadge>
                  <UBadge v-else color="warning" variant="subtle" size="xs" class="ml-2">
                    Pending
                  </UBadge>
                </span>
              </div>
            </div>

            <div v-if="hasUnapprovedOverDelivery">
              <p v-if="canApproveOverDelivery" class="text-sm">
                As a {{ userRole }}, you can approve and post this delivery.
              </p>
              <p v-else class="text-sm">
                <strong>Supervisor or Admin approval is required</strong>
                to post this delivery.
              </p>

              <!-- Approve/Reject buttons for Supervisors/Admins -->
              <div v-if="canApproveOverDelivery" class="mt-3 flex gap-2">
                <UButton
                  color="success"
                  variant="solid"
                  icon="i-lucide-check-circle"
                  size="sm"
                  class="cursor-pointer"
                  :loading="approvingOverDelivery"
                  @click="showApproveOverDeliveryConfirmation = true"
                >
                  Approve
                </UButton>
                <UButton
                  color="error"
                  variant="soft"
                  icon="i-lucide-x-circle"
                  size="sm"
                  class="cursor-pointer"
                  :loading="rejectingOverDelivery"
                  @click="showRejectOverDeliveryModal = true"
                >
                  Reject
                </UButton>
              </div>
            </div>
            <p v-else class="text-sm text-emerald-600 dark:text-emerald-400">
              <UIcon name="i-lucide-check-circle" class="h-4 w-4 inline mr-1" />
              All over-delivery items have been approved. You can now post this delivery.
            </p>
          </div>
        </template>
      </UAlert>

      <!-- Price Variance Alert -->
      <UAlert
        v-if="hasVarianceLines"
        icon="i-lucide-alert-triangle"
        color="warning"
        variant="subtle"
        title="Price Variance Detected"
        :description="`${varianceLinesCount} item(s) have price variance totaling ${formatCurrency(totalVarianceAmount)}. ${delivery.summary.ncr_count} NCR(s) were automatically generated.`"
      />

      <!-- Delivery Header Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <template #header>
          <div class="flex items-start justify-between p-3 sm:p-4">
            <div>
              <h2 class="text-lg font-semibold text-[var(--ui-text)]">Delivery Information</h2>
              <p v-if="isPosted" class="text-caption mt-1">
                Posted on {{ formatDateTime(delivery.posted_at) }}
              </p>
              <p v-else class="text-caption mt-1">
                Created on {{ formatDateTime(delivery.created_at) }}
              </p>
            </div>
            <UBadge
              v-if="delivery.has_variance"
              color="warning"
              variant="subtle"
              size="md"
              class="inline-flex items-center gap-1"
            >
              <UIcon name="i-lucide-alert-triangle" class="h-4 w-4" />
              Has Variance
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Delivery Information -->
          <div>
            <h3 class="text-label uppercase mb-3">Delivery Details</h3>
            <dl class="space-y-2">
              <div>
                <dt class="text-caption">Delivery Date</dt>
                <dd class="text-[var(--ui-text)] font-medium">
                  {{ formatDate(delivery.delivery_date) }}
                </dd>
              </div>
              <div>
                <dt class="text-caption">Invoice Number</dt>
                <dd class="text-[var(--ui-text)] font-medium">
                  {{ delivery.invoice_no || "—" }}
                </dd>
              </div>
              <div v-if="delivery.po">
                <dt class="text-caption">Purchase Order</dt>
                <dd class="text-[var(--ui-text)] font-medium">
                  {{ delivery.po.po_no }}
                  <UBadge
                    :color="delivery.po.status === 'OPEN' ? 'success' : 'neutral'"
                    variant="subtle"
                    size="sm"
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
            <h3 class="text-label uppercase mb-3">Supplier</h3>
            <dl class="space-y-2">
              <div>
                <dt class="text-caption">Name</dt>
                <dd class="text-[var(--ui-text)] font-medium">
                  {{ delivery.supplier.name }}
                </dd>
              </div>
              <div>
                <dt class="text-caption">Code</dt>
                <dd class="text-[var(--ui-text)] font-medium">
                  {{ delivery.supplier.code }}
                </dd>
              </div>
              <div v-if="delivery.supplier.contact">
                <dt class="text-caption">Contact</dt>
                <dd class="text-[var(--ui-text)] font-medium">
                  {{ delivery.supplier.contact }}
                </dd>
              </div>
            </dl>
          </div>

          <!-- Location & Period -->
          <div>
            <h3 class="text-label uppercase mb-3">Location & Period</h3>
            <dl class="space-y-2">
              <div>
                <dt class="text-caption">Location</dt>
                <dd class="text-[var(--ui-text)] font-medium">
                  {{ delivery.location.name }}
                  <span class="text-caption">({{ delivery.location.code }})</span>
                </dd>
              </div>
              <div>
                <dt class="text-caption">Period</dt>
                <dd class="text-[var(--ui-text)] font-medium">
                  {{ delivery.period.name }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Delivery Note -->
        <div v-if="delivery.delivery_note" class="mt-6 pt-6 border-t border-[var(--ui-border)]">
          <h3 class="text-label uppercase mb-2">Delivery Note</h3>
          <div class="space-y-2">
            <template v-for="(note, index) in formattedDeliveryNotes" :key="index">
              <p
                v-if="note.isRejection"
                class="text-[var(--ui-error)] bg-[var(--ui-error)]/10 px-3 py-2 rounded-md text-sm"
              >
                <UIcon name="i-lucide-x-circle" class="h-4 w-4 inline mr-1" />
                {{ note.text }}
              </p>
              <p v-else class="text-[var(--ui-text)]">{{ note.text }}</p>
            </template>
          </div>
        </div>
      </UCard>

      <!-- Delivery Lines Card -->
      <UCard class="card-elevated" :ui="{ body: 'p-0' }">
        <template #header>
          <div class="flex items-center justify-between p-3 sm:p-4">
            <h2 class="text-lg font-semibold text-[var(--ui-text)]">Delivery Items</h2>
            <div class="text-caption">
              {{ delivery.summary.total_lines }} item(s),
              {{ delivery.summary.total_items.toFixed(2) }} total units
            </div>
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--ui-border)]">
            <thead>
              <tr class="bg-[var(--ui-bg-elevated)]">
                <th class="px-4 py-3 text-left text-label uppercase tracking-wider">Item</th>
                <th class="px-4 py-3 text-right text-label uppercase tracking-wider">Quantity</th>
                <th class="px-4 py-3 text-right text-label uppercase tracking-wider">Unit Price</th>
                <th class="px-4 py-3 text-right text-label uppercase tracking-wider">
                  Period Price
                </th>
                <th class="px-4 py-3 text-right text-label uppercase tracking-wider">Variance</th>
                <th class="px-4 py-3 text-right text-label uppercase tracking-wider">Line Value</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--ui-border)]">
              <tr
                v-for="line in delivery.lines"
                :key="line.id"
                :class="{
                  'bg-amber-50 dark:bg-amber-950/20': line.has_variance,
                }"
                class="hover:bg-[var(--ui-bg-elevated)] transition-colors"
              >
                <!-- Item -->
                <td class="px-4 py-4">
                  <div class="font-medium text-[var(--ui-text)]">
                    {{ line.item.name }}
                  </div>
                  <div class="text-caption">
                    {{ line.item.code }} · {{ line.item.unit }}
                    <span v-if="line.item.category">· {{ line.item.category }}</span>
                  </div>
                </td>

                <!-- Quantity -->
                <td class="px-4 py-4 text-right text-[var(--ui-text)]">
                  {{ line.quantity.toFixed(4) }}
                </td>

                <!-- Unit Price -->
                <td class="px-4 py-4 text-right text-[var(--ui-text)] font-medium">
                  {{ formatCurrency(line.unit_price) }}
                </td>

                <!-- Period Price -->
                <td class="px-4 py-4 text-right text-caption">
                  {{ line.period_price ? formatCurrency(line.period_price) : "—" }}
                </td>

                <!-- Variance -->
                <td class="px-4 py-4 text-right">
                  <div v-if="line.has_variance" class="flex items-center justify-end gap-2">
                    <UIcon name="i-lucide-alert-triangle" class="text-amber-500 h-4 w-4" />
                    <div class="text-right">
                      <div
                        :class="[
                          'text-[var(--ui-text)] font-medium',
                          line.price_variance > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400',
                        ]"
                      >
                        {{ formatCurrency(line.price_variance) }}
                      </div>
                      <div v-if="line.variance_percentage" class="text-caption">
                        ({{ line.variance_percentage }}%)
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-caption">—</span>
                </td>

                <!-- Line Value -->
                <td class="px-4 py-4 text-right text-[var(--ui-text)] font-semibold">
                  {{ formatCurrency(line.line_value) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div class="px-4 py-6 border-t border-[var(--ui-border)]">
          <div class="flex justify-end">
            <div class="space-y-2 min-w-[300px]">
              <div class="flex justify-between items-center">
                <span class="text-caption">Total Items:</span>
                <span class="text-[var(--ui-text)] font-medium">
                  {{ delivery.summary.total_lines }}
                </span>
              </div>
              <div v-if="hasVarianceLines" class="flex justify-between items-center">
                <span class="text-caption">Items with Variance:</span>
                <span class="text-[var(--ui-text)] font-medium text-amber-600 dark:text-amber-400">
                  {{ varianceLinesCount }}
                </span>
              </div>
              <div v-if="hasVarianceLines" class="flex justify-between items-center">
                <span class="text-caption">Total Variance:</span>
                <span
                  :class="[
                    'text-[var(--ui-text)] font-medium',
                    totalVarianceAmount > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-600 dark:text-emerald-400',
                  ]"
                >
                  {{ formatCurrency(totalVarianceAmount) }}
                </span>
              </div>
              <div
                class="flex justify-between items-center pt-2 border-t border-[var(--ui-border)]"
              >
                <span class="text-[var(--ui-text)] font-semibold">Total Amount:</span>
                <span class="text-2xl font-bold text-primary">
                  {{ formatCurrency(delivery.total_amount) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Auto-Generated NCRs Card -->
      <UCard v-if="delivery.ncrs.length > 0" class="card-elevated" :ui="{ body: 'p-3 sm:p-4' }">
        <template #header>
          <div class="flex items-center gap-2 p-3 sm:p-4">
            <UIcon name="i-lucide-alert-octagon" class="h-5 w-5 text-amber-500" />
            <h2 class="text-lg font-semibold text-[var(--ui-text)]">
              Non-Conformance Reports (NCRs)
            </h2>
            <UBadge color="warning" variant="subtle">
              {{ delivery.ncrs.length }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-3">
          <div
            v-for="ncr in delivery.ncrs"
            :key="ncr.id"
            class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-4 hover:bg-[var(--ui-bg-hover)] transition-colors cursor-pointer"
            @click="goToNcr(ncr.id)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-semibold text-[var(--ui-text)]">{{ ncr.ncr_no }}</span>
                  <UBadge :color="getNcrStatusColor(ncr.status)" variant="subtle" size="sm">
                    {{ ncr.status }}
                  </UBadge>
                  <UBadge
                    v-if="ncr.type === 'PRICE_VARIANCE'"
                    color="warning"
                    variant="subtle"
                    size="sm"
                  >
                    Auto-Generated
                  </UBadge>
                </div>
                <p v-if="ncr.reason" class="text-caption mb-2">
                  {{ ncr.reason }}
                </p>
                <div class="flex items-center gap-4 text-caption">
                  <span>Created: {{ formatDate(ncr.created_at) }}</span>
                  <span>By: {{ ncr.creator.full_name }}</span>
                  <span v-if="ncr.quantity">Qty: {{ ncr.quantity }}</span>
                  <span>Value: {{ formatCurrency(ncr.value) }}</span>
                </div>
              </div>
              <UIcon name="i-lucide-chevron-right" class="h-5 w-5 text-[var(--ui-text-muted)]" />
            </div>
          </div>
        </div>
      </UCard>

      <!-- Post Confirmation Modal -->
      <UiConfirmModal
        v-model="showPostConfirmation"
        title="Post Delivery"
        message="Once posted, this delivery cannot be edited. Stock levels will be updated and any price variances will generate NCRs automatically."
        confirm-text="Post Delivery"
        cancel-text="Continue Editing"
        variant="warning"
        :loading="posting"
        @confirm="postDraft"
      />

      <!-- Delete Confirmation Modal -->
      <UiConfirmModal
        v-model="showDeleteConfirmation"
        title="Delete Draft"
        message="Are you sure you want to delete this draft? This action cannot be undone."
        confirm-text="Delete Draft"
        cancel-text="Cancel"
        variant="danger"
        :loading="deleting"
        @confirm="deleteDraft"
      />

      <!-- Approve Over-Delivery Confirmation Modal -->
      <UiConfirmModal
        v-model="showApproveOverDeliveryConfirmation"
        title="Approve Over-Delivery"
        message="Are you sure you want to approve all over-delivery items? This will allow the delivery to be posted even though some quantities exceed the PO remaining amounts."
        confirm-text="Approve"
        cancel-text="Cancel"
        variant="warning"
        :loading="approvingOverDelivery"
        @confirm="approveOverDelivery"
      />

      <!-- Reject Over-Delivery Modal -->
      <UModal v-model:open="showRejectOverDeliveryModal">
        <template #content>
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3">
              <div
                class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
              >
                <UIcon name="i-lucide-x-circle" class="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-[var(--ui-text)]">Reject Over-Delivery</h3>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  Please provide a reason for rejection
                </p>
              </div>
            </div>

            <div>
              <UTextarea
                v-model="rejectionReason"
                placeholder="Enter the reason for rejecting this over-delivery..."
                :rows="3"
                class="w-full"
              />
            </div>

            <p class="text-sm text-[var(--ui-text-muted)]">
              The operator will be notified and can edit the delivery to correct the quantities.
            </p>

            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                class="cursor-pointer"
                @click="showRejectOverDeliveryModal = false"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                class="cursor-pointer"
                :loading="rejectingOverDelivery"
                :disabled="!rejectionReason.trim()"
                @click="rejectOverDelivery"
              >
                Reject
              </UButton>
            </div>
          </div>
        </template>
      </UModal>
    </template>

    <!-- Not Found State -->
    <EmptyState
      v-else
      icon="i-lucide-package-x"
      title="Delivery Not Found"
      description="The delivery you're looking for doesn't exist or has been removed."
    >
      <template #actions>
        <UButton color="primary" icon="i-lucide-arrow-left" class="cursor-pointer" @click="goBack">
          Back to Deliveries
        </UButton>
      </template>
    </EmptyState>
  </div>
</template>

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
  po_line_id: string | null;
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
  is_over_delivery: boolean;
  po_line_remaining_qty: number | null;
  over_delivery_approved: boolean;
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

type DeliveryStatus = "DRAFT" | "POSTED";

interface Delivery {
  id: string;
  delivery_no: string;
  delivery_date: string;
  invoice_no: string | null;
  delivery_note: string | null;
  total_amount: number;
  has_variance: boolean;
  has_over_delivery: boolean;
  has_unapproved_over_delivery: boolean;
  pending_approval: boolean;
  over_delivery_rejected: boolean;
  status: DeliveryStatus;
  created_at: string;
  updated_at: string;
  posted_at: string | null;
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
  creator: {
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
const showPostConfirmation = ref(false);
const showDeleteConfirmation = ref(false);
const showApproveOverDeliveryConfirmation = ref(false);
const showRejectOverDeliveryModal = ref(false);
const rejectionReason = ref("");
const posting = ref(false);
const deleting = ref(false);
const approvingOverDelivery = ref(false);
const rejectingOverDelivery = ref(false);

// Get user for role-based permissions
const { user } = useAuth();

// Computed
const deliveryId = computed(() => route.params.id as string);
const hasVarianceLines = computed(() => (delivery.value?.summary.variance_lines ?? 0) > 0);
const varianceLinesCount = computed(() => delivery.value?.summary.variance_lines ?? 0);
const totalVarianceAmount = computed(() => delivery.value?.summary.total_variance_amount ?? 0);
const isDraft = computed(() => delivery.value?.status === "DRAFT");
const isPosted = computed(() => delivery.value?.status === "POSTED");
const hasOverDeliveryLines = computed(() => delivery.value?.has_over_delivery ?? false);
const hasUnapprovedOverDelivery = computed(
  () => delivery.value?.has_unapproved_over_delivery ?? false
);
const overDeliveryLinesCount = computed(
  () => delivery.value?.lines.filter((l) => l.is_over_delivery).length ?? 0
);
const canApproveOverDelivery = computed(
  () => user.value?.role === "SUPERVISOR" || user.value?.role === "ADMIN"
);
const userRole = computed(() => user.value?.role ?? "");
const isOperator = computed(() => user.value?.role === "OPERATOR");
// Check if delivery has been rejected for over-delivery
const isRejected = computed(() => delivery.value?.over_delivery_rejected ?? false);
// Check if delivery has been sent for approval (operator locked until supervisor reviews)
const isPendingApproval = computed(() => delivery.value?.pending_approval ?? false);

// When rejected: disable ALL actions for EVERYONE - a new delivery must be created instead
const isRejectedDelivery = computed(() => isRejected.value);

// Operator can't edit/delete when delivery is sent for approval (pending_approval: true)
const isOperatorLockedForApproval = computed(() => isOperator.value && isPendingApproval.value);
// Operator can't post when there's unapproved over-delivery
const isOperatorWithPendingApproval = computed(
  () => isOperator.value && hasUnapprovedOverDelivery.value
);
// When rejected OR sent for approval, editing/deleting is blocked for operators
const isEditingBlocked = computed(
  () => isRejectedDelivery.value || isOperatorLockedForApproval.value
);
const isPostingBlocked = computed(
  () => isRejectedDelivery.value || isOperatorWithPendingApproval.value
);
const isDeletingBlocked = computed(
  () => isRejectedDelivery.value || isOperatorLockedForApproval.value
);

// Format delivery notes - separate rejection notes for styling
const formattedDeliveryNotes = computed(() => {
  const note = delivery.value?.delivery_note || "";
  if (!note) return [];

  // Split by [REJECTED pattern to separate rejection notes
  const parts = note.split(/(?=\[REJECTED)/);
  return parts
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      isRejection: part.startsWith("[REJECTED"),
    }));
});

type BadgeColor = "error" | "info" | "success" | "primary" | "secondary" | "warning" | "neutral";

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

// Get NCR status color
function getNcrStatusColor(status: string): BadgeColor {
  switch (status) {
    case "OPEN":
      return "warning";
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
  router.push(`/ncrs/${ncrId}`);
}

// Print
function printDelivery() {
  toast.info("Print functionality coming soon");
}

// Edit draft
function editDraft() {
  router.push(`/deliveries/${deliveryId.value}/edit`);
}

// Delete draft
async function deleteDraft() {
  if (!deliveryId.value) return;

  deleting.value = true;

  try {
    await $fetch(`/api/deliveries/${deliveryId.value}`, {
      method: "DELETE",
    });

    toast.success("Draft deleted successfully");
    router.push("/deliveries");
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } };
    toast.error(fetchError?.data?.message || "Failed to delete draft");
    console.error("Error deleting draft:", err);
  } finally {
    deleting.value = false;
    showDeleteConfirmation.value = false;
  }
}

// Approve over-delivery items (Supervisor/Admin only)
async function approveOverDelivery() {
  if (!deliveryId.value || !delivery.value) return;

  approvingOverDelivery.value = true;

  try {
    // Get all lines with over_delivery_approved set to true for over-delivery lines
    const updatedLines = delivery.value.lines.map((line) => ({
      id: line.id,
      item_id: line.item.id,
      po_line_id: line.po_line_id,
      quantity: line.quantity,
      unit_price: line.unit_price,
      over_delivery_approved: line.is_over_delivery ? true : line.over_delivery_approved,
    }));

    await $fetch(`/api/deliveries/${deliveryId.value}`, {
      method: "PATCH",
      body: {
        lines: updatedLines,
        notify_approval: true, // Trigger email notification to creator
      },
    });

    toast.success("Over-delivery items approved. The operator has been notified.");
    // Refresh the delivery details
    await fetchDelivery();
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } };
    toast.error(fetchError?.data?.message || "Failed to approve over-delivery items");
    console.error("Error approving over-delivery:", err);
  } finally {
    approvingOverDelivery.value = false;
    showApproveOverDeliveryConfirmation.value = false;
  }
}

// Reject over-delivery items (Supervisor/Admin only)
async function rejectOverDelivery() {
  if (!deliveryId.value || !delivery.value) return;
  if (!rejectionReason.value.trim()) {
    toast.error("Please provide a rejection reason");
    return;
  }

  rejectingOverDelivery.value = true;

  try {
    // Prepend rejection reason to delivery note
    const existingNote = delivery.value.delivery_note || "";
    const rejectionNote = `[REJECTED by ${user.value?.full_name || userRole.value}]: ${rejectionReason.value.trim()}`;
    const newNote = existingNote ? `${rejectionNote}\n\n${existingNote}` : rejectionNote;

    await $fetch(`/api/deliveries/${deliveryId.value}`, {
      method: "PATCH",
      body: {
        delivery_note: newNote,
        notify_rejection: true, // Trigger email notification to creator
        rejection_reason: rejectionReason.value.trim(), // Include reason for email
      },
    });

    toast.success("Over-delivery items rejected. The operator has been notified.");
    rejectionReason.value = "";
    // Refresh the delivery details
    await fetchDelivery();
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } };
    toast.error(fetchError?.data?.message || "Failed to reject over-delivery items");
    console.error("Error rejecting over-delivery:", err);
  } finally {
    rejectingOverDelivery.value = false;
    showRejectOverDeliveryModal.value = false;
  }
}

// Post draft
async function postDraft() {
  if (!deliveryId.value) return;

  posting.value = true;

  try {
    await $fetch(`/api/deliveries/${deliveryId.value}`, {
      method: "PATCH",
      body: {
        status: "POSTED",
      },
    });

    toast.success("Delivery posted successfully");
    // Refresh the delivery details to show updated status
    await fetchDelivery();
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } };
    toast.error(fetchError?.data?.message || "Failed to post delivery");
    console.error("Error posting delivery:", err);
  } finally {
    posting.value = false;
    showPostConfirmation.value = false;
  }
}

// Initial load
onMounted(async () => {
  await fetchDelivery();
});
</script>
