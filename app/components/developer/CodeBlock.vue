<script setup lang="ts">
interface Props {
  code: string;
  language: string;
  filename?: string;
  showLineNumbers?: boolean;
  showLanguage?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  filename: undefined,
  showLineNumbers: false,
  showLanguage: true,
});

const emit = defineEmits<{
  copied: [];
}>();

const { highlight, isLoading } = useHighlight();
const highlightedCode = ref("");
const isCopied = ref(false);

// Language display names
const languageLabels: Record<string, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  vue: "Vue",
  "vue-html": "Vue",
  css: "CSS",
  bash: "Bash",
  shell: "Shell",
  json: "JSON",
  sql: "SQL",
  html: "HTML",
  plaintext: "Text",
  text: "Text",
  prisma: "Prisma",
};

const displayLanguage = computed(() => languageLabels[props.language] || props.language);

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
    class="code-block group relative overflow-hidden rounded-lg border border-[var(--ui-border)]"
    :class="{ 'code-block-with-lines': showLineNumbers }"
  >
    <!-- Header with filename/language and copy button -->
    <div
      class="code-header flex items-center justify-between border-b border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] px-3 py-2"
    >
      <div class="flex items-center gap-2">
        <!-- Language badge -->
        <span
          v-if="showLanguage && !filename"
          class="rounded bg-[var(--ui-bg-accented)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--ui-text-muted)]"
        >
          {{ displayLanguage }}
        </span>

        <!-- Filename with icon -->
        <span v-if="filename" class="flex items-center gap-2 text-xs text-[var(--ui-text-muted)]">
          <UIcon name="i-heroicons-document-text" class="size-4 shrink-0" />
          <span class="truncate">{{ filename }}</span>
        </span>
      </div>

      <!-- Copy button -->
      <button
        type="button"
        class="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all"
        :class="
          isCopied
            ? 'bg-[var(--ui-success)]/10 text-[var(--ui-success)]'
            : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-accented)] hover:text-[var(--ui-text)]'
        "
        @click="copyCode"
      >
        <UIcon
          :name="isCopied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'"
          class="size-4"
        />
        <span>{{ isCopied ? "Copied!" : "Copy" }}</span>
      </button>
    </div>

    <!-- Code content -->
    <div class="code-content overflow-x-auto bg-[var(--ui-bg)] p-4">
      <!-- Loading state -->
      <div v-if="isLoading" class="flex items-center gap-2 text-xs text-[var(--ui-text-muted)]">
        <UIcon name="i-heroicons-arrow-path" class="size-4 animate-spin" />
        <span>Loading...</span>
      </div>

      <!-- Highlighted code -->
      <div v-else-if="highlightedCode" v-html="highlightedCode" />

      <!-- Fallback plain code -->
      <pre v-else class="text-xs leading-relaxed"><code>{{ code }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.code-block {
  font-size: 0.8125rem;
}

/* Code content area styling */
.code-content {
  scrollbar-width: thin;
  scrollbar-color: var(--ui-border) transparent;
}

.code-content::-webkit-scrollbar {
  height: 6px;
}

.code-content::-webkit-scrollbar-track {
  background: transparent;
}

.code-content::-webkit-scrollbar-thumb {
  background-color: var(--ui-border);
  border-radius: 3px;
}

.code-content::-webkit-scrollbar-thumb:hover {
  background-color: var(--ui-text-muted);
}
</style>

<style>
/* Dark mode override for consistent code block background - unscoped to ensure specificity */
html.dark .code-block .code-header,
html.dark .code-block .code-content {
  background-color: #0d1117 !important;
}
</style>
