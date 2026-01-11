<script setup lang="ts">
interface Props {
  code: string;
  language: string;
  filename?: string;
  showLineNumbers?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  filename: undefined,
  showLineNumbers: false,
});

const emit = defineEmits<{
  copied: [];
}>();

const { highlight, isLoading } = useShiki();
const highlightedCode = ref("");
const isCopied = ref(false);

// Highlight code on mount and when code/language changes
watchEffect(async () => {
  if (props.code && props.language) {
    highlightedCode.value = await highlight(props.code, props.language);
  }
});

// Copy to clipboard
const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.code);
    isCopied.value = true;
    emit("copied");

    // Reset after 2 seconds
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (error) {
    console.error("Failed to copy code:", error);
  }
};
</script>

<template>
  <div
    class="code-block overflow-hidden rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] dark:bg-[#0c1220]"
    :class="{ 'code-block-with-lines': showLineNumbers }"
  >
    <!-- Header with filename and copy button -->
    <div
      v-if="filename"
      class="flex items-center justify-between border-b border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] px-3 py-2"
    >
      <span class="flex items-center gap-2 text-xs text-[var(--ui-text-muted)]">
        <UIcon name="i-heroicons-document-text" class="size-4" />
        {{ filename }}
      </span>
      <button
        type="button"
        class="flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-bg-hover)] hover:text-[var(--ui-text)]"
        :class="{ 'text-[var(--ui-success)]': isCopied }"
        @click="copyCode"
      >
        <UIcon
          :name="isCopied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'"
          class="size-4"
        />
        <span>{{ isCopied ? "Copied!" : "Copy" }}</span>
      </button>
    </div>

    <!-- Copy button in corner if no filename -->
    <button
      v-else
      type="button"
      class="absolute right-2 top-2 z-10 flex cursor-pointer items-center gap-1 rounded bg-[var(--ui-bg-elevated)] px-2 py-1 text-xs text-[var(--ui-text-muted)] opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-[var(--ui-bg-hover)] hover:text-[var(--ui-text)]"
      :class="{ 'text-[var(--ui-success)] opacity-100': isCopied }"
      @click="copyCode"
    >
      <UIcon
        :name="isCopied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'"
        class="size-4"
      />
    </button>

    <!-- Code content -->
    <div class="group relative overflow-x-auto p-3">
      <!-- Loading state -->
      <div v-if="isLoading" class="flex items-center gap-2 text-xs text-[var(--ui-text-muted)]">
        <UIcon name="i-heroicons-arrow-path" class="size-4 animate-spin" />
        <span>Loading...</span>
      </div>

      <!-- Highlighted code -->
      <div v-else-if="highlightedCode" v-html="highlightedCode" />

      <!-- Fallback plain code -->
      <pre v-else class="text-xs"><code>{{ code }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.code-block {
  position: relative;
}

/* Show copy button on hover when no filename header */
.code-block:not(:has(.border-b)):hover button {
  opacity: 1;
}
</style>
