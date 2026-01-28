<script setup lang="ts">
import { formatDateTime } from "~/utils/format";

// Types
interface NotificationLog {
  id: string;
  recipient_type: "FINANCE" | "PROCUREMENT" | "SUPPLIER";
  recipients: string[];
  status: "SENT" | "FAILED";
  error_message: string | null;
  sent_at: string;
}

// Props
const props = defineProps<{
  ncrId: string;
  logs: NotificationLog[];
  canResend?: boolean;
}>();

// Emits
const emit = defineEmits<{
  (e: "resend", recipientType: "FINANCE" | "PROCUREMENT" | "SUPPLIER"): void;
}>();

// State
const resendingType = ref<string | null>(null);
const lastResendTime = ref<Record<string, number>>({});
const now = ref(Date.now());

// Update current time every second for countdown display
let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});

// Rate limit: 5 minutes
const RATE_LIMIT_MS = 5 * 60 * 1000;

// Recipient types for iteration
type RecipientType = "FINANCE" | "PROCUREMENT" | "SUPPLIER";

// Computed
const groupedLogs = computed((): Record<RecipientType, NotificationLog[]> => {
  // Group logs by recipient type, showing latest first
  const groups: Record<RecipientType, NotificationLog[]> = {
    FINANCE: [],
    PROCUREMENT: [],
    SUPPLIER: [],
  };

  for (const log of props.logs) {
    groups[log.recipient_type].push(log);
  }

  return groups;
});

// Check if a recipient type is within rate limit period
function isRateLimited(recipientType: string): boolean {
  const lastTime = lastResendTime.value[recipientType];
  if (!lastTime) return false;
  return now.value - lastTime < RATE_LIMIT_MS;
}

// Get remaining cooldown time in seconds
function getCooldownSeconds(recipientType: string): number {
  const lastTime = lastResendTime.value[recipientType];
  if (!lastTime) return 0;
  const remaining = RATE_LIMIT_MS - (now.value - lastTime);
  return Math.max(0, Math.ceil(remaining / 1000));
}

// Format cooldown as mm:ss
function formatCooldown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Handle resend
function handleResend(recipientType: "FINANCE" | "PROCUREMENT" | "SUPPLIER") {
  if (isRateLimited(recipientType)) return;

  lastResendTime.value[recipientType] = Date.now();
  emit("resend", recipientType);
}

// Get status badge color
function getStatusColor(status: "SENT" | "FAILED"): "success" | "error" {
  return status === "SENT" ? "success" : "error";
}

// Get recipient type label
function getRecipientLabel(type: "FINANCE" | "PROCUREMENT" | "SUPPLIER"): string {
  const labels = {
    FINANCE: "Finance Team",
    PROCUREMENT: "Procurement Team",
    SUPPLIER: "Supplier",
  };
  return labels[type];
}

// Get recipient type icon
function getRecipientIcon(type: "FINANCE" | "PROCUREMENT" | "SUPPLIER"): string {
  const icons = {
    FINANCE: "i-lucide-calculator",
    PROCUREMENT: "i-lucide-shopping-cart",
    SUPPLIER: "i-lucide-building-2",
  };
  return icons[type];
}

// Check if any notification was sent for this type
function hasAnyNotification(type: RecipientType): boolean {
  return groupedLogs.value[type].length > 0;
}

// Get latest log for a recipient type
function getLatestLog(type: RecipientType): NotificationLog | null {
  const logs = groupedLogs.value[type];
  return logs.length > 0 ? (logs[0] ?? null) : null;
}
</script>

<template>
  <div class="space-y-4">
    <!-- No notifications yet -->
    <div
      v-if="logs.length === 0"
      class="text-center py-6 text-[var(--ui-text-muted)] bg-[var(--ui-bg-muted)] rounded-lg"
    >
      <UIcon name="i-lucide-mail-x" class="w-8 h-8 mb-2 mx-auto opacity-50" />
      <p class="text-sm">No notifications have been sent yet.</p>
    </div>

    <!-- Notification groups -->
    <div v-else class="space-y-3">
      <div
        v-for="recipientType in ['FINANCE', 'PROCUREMENT', 'SUPPLIER'] as const"
        :key="recipientType"
        class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
      >
        <!-- Recipient header -->
        <div
          class="flex items-center justify-between px-4 py-3 bg-[var(--ui-bg-muted)] border-b border-[var(--ui-border)]"
        >
          <div class="flex items-center gap-2">
            <UIcon :name="getRecipientIcon(recipientType)" class="w-4 h-4 text-primary" />
            <span class="font-medium text-sm">{{ getRecipientLabel(recipientType) }}</span>
          </div>

          <!-- Latest status badge -->
          <div class="flex items-center gap-2">
            <UBadge
              v-if="getLatestLog(recipientType)"
              :color="getStatusColor(getLatestLog(recipientType)!.status)"
              variant="soft"
              size="sm"
            >
              {{ getLatestLog(recipientType)!.status }}
            </UBadge>
            <UBadge v-else color="neutral" variant="soft" size="sm">Not Sent</UBadge>

            <!-- Resend button -->
            <UTooltip
              v-if="canResend && hasAnyNotification(recipientType)"
              :text="
                isRateLimited(recipientType)
                  ? `Wait ${formatCooldown(getCooldownSeconds(recipientType))}`
                  : 'Resend notification'
              "
            >
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-refresh-cw"
                class="cursor-pointer"
                :disabled="isRateLimited(recipientType) || resendingType === recipientType"
                :loading="resendingType === recipientType"
                @click="handleResend(recipientType)"
              >
                <span v-if="isRateLimited(recipientType)" class="text-xs">
                  {{ formatCooldown(getCooldownSeconds(recipientType)) }}
                </span>
              </UButton>
            </UTooltip>
          </div>
        </div>

        <!-- Notification entries -->
        <div v-if="hasAnyNotification(recipientType)" class="divide-y divide-[var(--ui-border)]">
          <div
            v-for="log in groupedLogs[recipientType]"
            :key="log.id"
            class="px-4 py-3 text-sm"
            :class="log.status === 'FAILED' ? 'bg-error/5' : ''"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <!-- Recipients -->
                <div class="flex flex-wrap gap-1 mb-1">
                  <UBadge
                    v-for="email in log.recipients"
                    :key="email"
                    color="neutral"
                    variant="subtle"
                    size="xs"
                  >
                    {{ email }}
                  </UBadge>
                </div>

                <!-- Error message -->
                <p v-if="log.error_message" class="text-error text-xs mt-1">
                  {{ log.error_message }}
                </p>
              </div>

              <!-- Timestamp -->
              <div class="text-[var(--ui-text-muted)] text-xs whitespace-nowrap">
                {{ formatDateTime(log.sent_at) }}
              </div>
            </div>
          </div>
        </div>

        <!-- No notifications for this type -->
        <div v-else class="px-4 py-3 text-sm text-[var(--ui-text-muted)]">
          No notifications sent to this group.
        </div>
      </div>
    </div>
  </div>
</template>
