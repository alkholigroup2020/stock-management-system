<template>
  <div class="space-y-3">
    <!-- Email List -->
    <div v-if="modelValue.length > 0" class="space-y-2">
      <div
        v-for="(email, index) in modelValue"
        :key="index"
        class="flex items-center gap-2 p-2 rounded-lg bg-[var(--ui-bg-muted)] border border-[var(--ui-border-muted)]"
      >
        <UIcon name="i-lucide-mail" class="w-4 h-4 text-[var(--ui-text-muted)] shrink-0" />
        <span class="flex-1 text-sm text-[var(--ui-text)] truncate">{{ email }}</span>
        <UButton
          color="error"
          variant="ghost"
          icon="i-lucide-x"
          size="xs"
          class="cursor-pointer shrink-0"
          :disabled="disabled"
          @click="removeEmail(index)"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="flex items-center gap-2 p-3 rounded-lg bg-[var(--ui-bg-muted)] border border-dashed border-[var(--ui-border)]"
    >
      <UIcon name="i-lucide-mail" class="w-4 h-4 text-[var(--ui-text-muted)]" />
      <span class="text-sm text-[var(--ui-text-muted)] italic">No email addresses added</span>
    </div>

    <!-- Add Email Input -->
    <div class="flex items-start gap-2">
      <div class="flex-1">
        <UInput
          v-model="newEmail"
          placeholder="Enter email address"
          icon="i-lucide-plus"
          size="md"
          :disabled="disabled || modelValue.length >= maxEmails"
          :color="emailError ? 'error' : undefined"
          class="w-full"
          @keydown.enter.prevent="addEmail"
        />
        <p v-if="emailError" class="text-xs text-error mt-1">{{ emailError }}</p>
        <p
          v-else-if="modelValue.length >= maxEmails"
          class="text-xs text-[var(--ui-text-muted)] mt-1"
        >
          Maximum {{ maxEmails }} email addresses allowed
        </p>
      </div>
      <UButton
        color="primary"
        variant="soft"
        icon="i-lucide-plus"
        size="md"
        class="cursor-pointer shrink-0"
        :disabled="disabled || !newEmail.trim() || modelValue.length >= maxEmails"
        @click="addEmail"
      >
        Add
      </UButton>
    </div>

    <!-- Help Text -->
    <p v-if="help" class="text-xs text-[var(--ui-text-muted)]">{{ help }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string[];
  disabled?: boolean;
  maxEmails?: number;
  help?: string;
}

interface Emits {
  (e: "update:modelValue", value: string[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  maxEmails: 10,
  help: "",
});

const emit = defineEmits<Emits>();

// State
const newEmail = ref("");
const emailError = ref("");

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Add email
const addEmail = () => {
  const email = newEmail.value.trim().toLowerCase();

  // Clear previous error
  emailError.value = "";

  // Validate email format
  if (!email) {
    return;
  }

  if (!emailRegex.test(email)) {
    emailError.value = "Invalid email format";
    return;
  }

  // Check for duplicates
  if (props.modelValue.includes(email)) {
    emailError.value = "This email has already been added";
    return;
  }

  // Check max limit
  if (props.modelValue.length >= props.maxEmails) {
    emailError.value = `Maximum ${props.maxEmails} email addresses allowed`;
    return;
  }

  // Add email
  emit("update:modelValue", [...props.modelValue, email]);
  newEmail.value = "";
};

// Remove email
const removeEmail = (index: number) => {
  const newEmails = [...props.modelValue];
  newEmails.splice(index, 1);
  emit("update:modelValue", newEmails);
};
</script>
