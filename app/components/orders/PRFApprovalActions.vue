<script setup lang="ts">
/**
 * PRF Approval Actions Component
 *
 * Provides Approve/Reject actions for pending PRFs.
 * Only visible to users with approval permissions (SUPERVISOR, ADMIN).
 * Includes rejection reason modal with mandatory reason field.
 */

// Props
interface Props {
  prfId: string;
  prfNo: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

// Emits
const emit = defineEmits<{
  approved: [result: { email_sent: boolean; email_recipients?: number }];
  rejected: [];
}>();

// Composables
const { approve, reject, loading, error } = usePRFActions();
const { handleError, handleSuccess } = useErrorHandler();
const { isOnline, guardAction } = useOfflineGuard();
const { canApprovePRF } = usePermissions();

// State
const showApproveConfirmation = ref(false);
const showRejectModal = ref(false);
const rejectionReason = ref("");
const approving = ref(false);
const rejecting = ref(false);

// Computed
const isProcessing = computed(() => approving.value || rejecting.value || loading.value);

const canApprove = computed(() => canApprovePRF() && !props.disabled && isOnline.value);

const isRejectFormValid = computed(() => rejectionReason.value.trim().length > 0);

// Methods
async function handleApprove() {
  showApproveConfirmation.value = false;

  await guardAction(
    async () => {
      approving.value = true;

      try {
        const result = await approve(props.prfId);

        if (result) {
          handleSuccess(
            "PRF Approved",
            result.email_sent
              ? `PRF ${props.prfNo} has been approved. Email notification sent to ${result.email_recipients} procurement specialist(s).`
              : `PRF ${props.prfNo} has been approved.`
          );
          emit("approved", {
            email_sent: result.email_sent,
            email_recipients: result.email_recipients,
          });
        } else if (error.value) {
          handleError({ data: { message: error.value } }, { context: "approving PRF" });
        }
      } catch (err) {
        handleError(err, { context: "approving PRF" });
      } finally {
        approving.value = false;
      }
    },
    {
      offlineMessage: "Cannot approve PRF",
      offlineDescription: "You need an internet connection to approve PRFs.",
    }
  );
}

async function handleReject() {
  if (!isRejectFormValid.value) {
    return;
  }

  await guardAction(
    async () => {
      rejecting.value = true;

      try {
        const result = await reject(props.prfId, rejectionReason.value.trim());

        if (result) {
          handleSuccess("PRF Rejected", `PRF ${props.prfNo} has been rejected.`);
          showRejectModal.value = false;
          rejectionReason.value = "";
          emit("rejected");
        } else if (error.value) {
          handleError({ data: { message: error.value } }, { context: "rejecting PRF" });
        }
      } catch (err) {
        handleError(err, { context: "rejecting PRF" });
      } finally {
        rejecting.value = false;
      }
    },
    {
      offlineMessage: "Cannot reject PRF",
      offlineDescription: "You need an internet connection to reject PRFs.",
    }
  );
}

function openRejectModal() {
  rejectionReason.value = "";
  showRejectModal.value = true;
}

function closeRejectModal() {
  if (!rejecting.value) {
    showRejectModal.value = false;
    rejectionReason.value = "";
  }
}
</script>

<template>
  <div v-if="canApprovePRF()" class="flex items-center gap-2">
    <!-- Reject Button -->
    <UButton
      color="error"
      variant="soft"
      icon="i-lucide-x-circle"
      size="md"
      class="cursor-pointer rounded-full"
      :disabled="isProcessing || !isOnline"
      @click="openRejectModal"
    >
      <span class="hidden sm:inline">Reject</span>
    </UButton>

    <!-- Approve Button -->
    <UButton
      color="success"
      icon="i-lucide-check-circle"
      size="md"
      class="cursor-pointer rounded-full"
      :loading="approving"
      :disabled="isProcessing || !isOnline"
      @click="showApproveConfirmation = true"
    >
      <span class="hidden sm:inline">Approve</span>
    </UButton>
  </div>

  <!-- Approve Confirmation Modal -->
  <UiConfirmModal
    v-model="showApproveConfirmation"
    title="Approve PRF"
    :message="`Are you sure you want to approve PRF ${prfNo}? This will notify procurement specialists to create a Purchase Order.`"
    confirm-text="Approve"
    cancel-text="Cancel"
    loading-text="Approving..."
    :loading="approving"
    variant="success"
    @confirm="handleApprove"
  />

  <!-- Reject Modal with Reason -->
  <UModal v-model:open="showRejectModal" :dismissible="!rejecting">
    <template #content>
      <UCard :ui="{ body: 'p-6', header: 'p-6 pb-4' }">
        <template #header>
          <div class="flex items-start gap-3">
            <div
              class="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--ui-error)]/10"
            >
              <UIcon name="i-lucide-x-circle" class="w-5 h-5 text-[var(--ui-error)]" />
            </div>
            <div class="flex-1">
              <h3 class="text-subheading font-semibold text-[var(--ui-text)]">Reject PRF</h3>
              <p class="text-sm text-[var(--ui-text-muted)] mt-1">
                Please provide a reason for rejecting PRF {{ prfNo }}.
              </p>
            </div>
          </div>
        </template>

        <!-- Rejection Reason Input -->
        <div class="mb-6">
          <UFormField label="Rejection Reason" required>
            <UTextarea
              v-model="rejectionReason"
              placeholder="Enter the reason for rejection..."
              :rows="4"
              :disabled="rejecting"
              autoresize
              :maxrows="8"
              class="w-full"
            />
          </UFormField>
          <p class="text-xs text-[var(--ui-text-muted)] mt-1">
            This reason will be visible to the PRF requester.
          </p>
        </div>

        <div class="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <UButton
            color="neutral"
            variant="soft"
            size="lg"
            class="cursor-pointer"
            :disabled="rejecting"
            @click="closeRejectModal"
          >
            Cancel
          </UButton>
          <UButton
            color="error"
            size="lg"
            class="cursor-pointer"
            :loading="rejecting"
            :disabled="rejecting || !isRejectFormValid"
            @click="handleReject"
          >
            {{ rejecting ? "Rejecting..." : "Reject PRF" }}
          </UButton>
        </div>
      </UCard>
    </template>
  </UModal>

  <!-- Loading Overlays -->
  <LoadingOverlay v-if="approving" title="Approving PRF..." message="Please wait" />
  <LoadingOverlay v-if="rejecting" title="Rejecting PRF..." message="Please wait" />
</template>
