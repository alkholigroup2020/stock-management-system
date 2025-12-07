<template>
  <UModal v-model:open="isOpen" :dismissible="!loading">
    <template #content>
      <UCard :ui="{ body: 'p-6', header: 'p-6 pb-4' }">
        <template #header>
          <div class="flex items-start gap-3">
            <div
              class="flex items-center justify-center w-10 h-10 rounded-full"
              :class="iconBgClass"
            >
              <UIcon :name="icon" :class="iconClass" class="w-5 h-5" />
            </div>
            <div class="flex-1">
              <h3 class="text-subheading font-semibold text-[var(--ui-text)]">
                {{ title }}
              </h3>
              <p class="text-sm text-[var(--ui-text-muted)] mt-1">
                {{ message }}
              </p>
            </div>
          </div>
        </template>

        <div class="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <UButton
            color="neutral"
            variant="soft"
            size="lg"
            class="cursor-pointer"
            :disabled="loading"
            @click="handleCancel"
          >
            {{ cancelText }}
          </UButton>
          <UButton
            :color="confirmColor"
            size="lg"
            class="cursor-pointer"
            :loading="loading"
            :disabled="loading"
            @click="handleConfirm"
          >
            {{ loading ? loadingText : confirmText }}
          </UButton>
        </div>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loadingText?: string;
  loading?: boolean;
  variant?: "danger" | "warning" | "info" | "success";
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: "Confirm",
  cancelText: "Cancel",
  loadingText: "Processing...",
  loading: false,
  variant: "danger",
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
  cancel: [];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const icon = computed(() => {
  switch (props.variant) {
    case "danger":
      return "i-lucide-alert-triangle";
    case "warning":
      return "i-lucide-alert-circle";
    case "success":
      return "i-lucide-check-circle";
    case "info":
    default:
      return "i-lucide-info";
  }
});

const iconBgClass = computed(() => {
  switch (props.variant) {
    case "danger":
      return "bg-[var(--ui-error)]/10";
    case "warning":
      return "bg-[var(--ui-warning)]/10";
    case "success":
      return "bg-[var(--ui-success)]/10";
    case "info":
    default:
      return "bg-[var(--ui-primary)]/10";
  }
});

const iconClass = computed(() => {
  switch (props.variant) {
    case "danger":
      return "text-[var(--ui-error)]";
    case "warning":
      return "text-[var(--ui-warning)]";
    case "success":
      return "text-[var(--ui-success)]";
    case "info":
    default:
      return "text-[var(--ui-primary)]";
  }
});

const confirmColor = computed(() => {
  switch (props.variant) {
    case "danger":
      return "error";
    case "warning":
      return "warning";
    case "success":
      return "success";
    case "info":
    default:
      return "primary";
  }
});

function handleConfirm() {
  if (!props.loading) {
    emit("confirm");
  }
}

function handleCancel() {
  if (!props.loading) {
    isOpen.value = false;
    emit("cancel");
  }
}
</script>
