<script setup lang="ts">
/**
 * NotificationEmailList Component
 *
 * Reusable component for managing a list of email addresses.
 * Used in notification settings for Finance and Procurement teams.
 *
 * Auto-imports as: <SettingsNotificationEmailList />
 */

const props = defineProps<{
  /** Label for the email list section */
  label: string;
  /** Optional description text */
  description?: string;
  /** Array of email addresses */
  modelValue: string[];
  /** Disable all interactions */
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

// Local state for new email input
const newEmail = ref("");
const inputError = ref<string | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate and add a new email to the list
 */
function addEmail(): void {
  inputError.value = null;

  const email = newEmail.value.toLowerCase().trim();

  if (!email) {
    inputError.value = "Please enter an email address";
    return;
  }

  if (!emailRegex.test(email)) {
    inputError.value = "Invalid email format";
    return;
  }

  if (props.modelValue.includes(email)) {
    inputError.value = "Email already exists in the list";
    return;
  }

  // Add email and emit update
  emit("update:modelValue", [...props.modelValue, email]);
  newEmail.value = "";
}

/**
 * Remove an email from the list
 */
function removeEmail(email: string): void {
  emit(
    "update:modelValue",
    props.modelValue.filter((e) => e !== email)
  );
}

/**
 * Handle Enter key in input
 */
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === "Enter") {
    event.preventDefault();
    addEmail();
  } else if (event.key === "Escape") {
    newEmail.value = "";
    inputError.value = null;
  }
}

/**
 * Clear error when user starts typing
 */
function handleInput(): void {
  if (inputError.value) {
    inputError.value = null;
  }
}

// Computed for add button disabled state
const isAddDisabled = computed(() => {
  return props.disabled || !newEmail.value.trim();
});
</script>

<template>
  <UFormGroup :label="label" :description="description">
    <!-- Email list as badges -->
    <div v-if="modelValue.length > 0" class="mb-3 flex flex-wrap gap-2">
      <UBadge
        v-for="email in modelValue"
        :key="email"
        color="primary"
        variant="subtle"
        size="lg"
        class="inline-flex items-center gap-1.5"
      >
        <span>{{ email }}</span>
        <UButton
          icon="i-heroicons-x-mark-20-solid"
          color="neutral"
          variant="link"
          size="xs"
          :disabled="disabled"
          :aria-label="`Remove ${email}`"
          class="cursor-pointer -mr-1"
          @click="removeEmail(email)"
        />
      </UBadge>
    </div>

    <!-- Empty state -->
    <p v-else class="mb-3 text-sm text-muted">No email addresses configured</p>

    <!-- Add email input -->
    <div class="flex gap-2">
      <UInput
        ref="inputRef"
        v-model="newEmail"
        type="email"
        placeholder="email@example.com"
        :disabled="disabled"
        :color="inputError ? 'error' : undefined"
        class="flex-1"
        @keydown="handleKeydown"
        @input="handleInput"
      />
      <UButton
        icon="i-heroicons-plus-20-solid"
        color="primary"
        :disabled="isAddDisabled"
        aria-label="Add email"
        class="cursor-pointer"
        @click="addEmail"
      />
    </div>

    <!-- Error message -->
    <p v-if="inputError" class="mt-1.5 text-sm text-error">
      {{ inputError }}
    </p>
  </UFormGroup>
</template>
