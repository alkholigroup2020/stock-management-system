<template>
  <UModal v-model:open="isOpen" class="sm:max-w-2xl">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-upload" class="w-5 h-5 text-primary" />
              <span class="font-semibold text-lg">Import Items</span>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="sm"
              class="cursor-pointer"
              @click="handleClose"
            />
          </div>
        </template>

        <!-- Step: File Selection -->
        <div v-if="currentStep === 'select'" class="space-y-4">
          <p class="text-[var(--ui-text-muted)] text-sm">
            Upload an Excel (.xlsx) or CSV file to import multiple items at once.
          </p>

          <!-- File Input -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-[var(--ui-text)]">Select File</label>
            <div
              class="relative border-2 border-dashed border-[var(--ui-border)] rounded-lg p-6 text-center hover:border-primary transition-colors"
              :class="{ 'border-primary bg-primary/5': selectedFile }"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".xlsx,.xls,.csv"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                @change="onFileSelect"
              />
              <div v-if="!selectedFile" class="space-y-2">
                <UIcon
                  name="i-lucide-file-spreadsheet"
                  class="w-10 h-10 mx-auto text-[var(--ui-text-muted)]"
                />
                <p class="text-sm text-[var(--ui-text-muted)]">
                  Drop your file here or click to browse
                </p>
                <p class="text-xs text-[var(--ui-text-dimmed)]">
                  Supports Excel (.xlsx) and CSV files
                </p>
              </div>
              <div v-else class="space-y-2">
                <UIcon name="i-lucide-file-check" class="w-10 h-10 mx-auto text-success" />
                <p class="text-sm font-medium text-[var(--ui-text)]">
                  {{ selectedFile.name }}
                </p>
                <p class="text-xs text-[var(--ui-text-muted)]">
                  {{ formatFileSize(selectedFile.size) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            icon="i-lucide-alert-circle"
            :title="error"
          />

          <!-- Offline Warning -->
          <UAlert
            v-if="!isOnline"
            color="warning"
            variant="subtle"
            icon="i-lucide-wifi-off"
            title="You are offline"
            description="Import requires an internet connection"
          />
        </div>

        <!-- Step: Loading Preview -->
        <div v-else-if="currentStep === 'previewing'" class="py-8 text-center space-y-4">
          <UIcon name="i-lucide-loader-2" class="w-12 h-12 mx-auto text-primary animate-spin" />
          <p class="text-[var(--ui-text)]">Parsing file...</p>
          <p class="text-sm text-[var(--ui-text-muted)]">Preparing preview</p>
        </div>

        <!-- Step: Preview -->
        <div v-else-if="currentStep === 'preview' && spreadPreview">
          <ItemsImportPreview :preview="spreadPreview" />
        </div>

        <!-- Step: Importing -->
        <div v-else-if="currentStep === 'importing'" class="py-8 text-center space-y-4">
          <UIcon name="i-lucide-loader-2" class="w-12 h-12 mx-auto text-primary animate-spin" />
          <p class="text-[var(--ui-text)]">Importing items...</p>
          <p class="text-sm text-[var(--ui-text-muted)]">This may take a moment</p>
        </div>

        <!-- Step: Results -->
        <div v-else-if="currentStep === 'results' && result">
          <ItemsImportResults :result="{ ...result, errors: [...result.errors] }" />
        </div>

        <template #footer>
          <div class="flex items-center justify-between">
            <!-- Download Template Link -->
            <UButton
              v-if="currentStep === 'select'"
              color="neutral"
              variant="link"
              icon="i-lucide-download"
              class="cursor-pointer"
              @click="downloadTemplate('xlsx')"
            >
              Download Template
            </UButton>
            <div v-else></div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2">
              <!-- Cancel/Close buttons -->
              <UButton
                v-if="currentStep === 'select'"
                color="neutral"
                variant="outline"
                class="cursor-pointer"
                @click="handleClose"
              >
                Cancel
              </UButton>
              <UButton
                v-else-if="currentStep === 'preview'"
                color="neutral"
                variant="outline"
                class="cursor-pointer"
                @click="handleBackToSelect"
              >
                Back
              </UButton>
              <UButton
                v-else-if="currentStep === 'results'"
                color="neutral"
                variant="outline"
                class="cursor-pointer"
                @click="handleClose"
              >
                Close
              </UButton>

              <!-- Primary action buttons -->
              <UButton
                v-if="currentStep === 'select'"
                color="primary"
                class="cursor-pointer"
                :disabled="!selectedFile || !isOnline"
                :loading="loading"
                @click="handlePreview"
              >
                Preview
              </UButton>
              <UButton
                v-else-if="currentStep === 'preview'"
                color="primary"
                class="cursor-pointer"
                :disabled="!isOnline"
                :loading="loading"
                @click="handleConfirmImport"
              >
                Confirm Import
              </UButton>
              <UButton
                v-else-if="currentStep === 'results'"
                color="primary"
                class="cursor-pointer"
                @click="handleImportAnother"
              >
                Import Another
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "success"): void;
}>();

// Composable
const {
  selectedFile,
  currentStep,
  loading,
  result,
  preview,
  error,
  isOnline,
  setFile,
  previewFile,
  uploadFile,
  downloadTemplate,
  reset,
} = useItemsImport();

// File input ref
const fileInput = ref<HTMLInputElement | null>(null);

// Computed for v-model
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

// Spread preview to convert readonly to mutable for component prop
const spreadPreview = computed(() => {
  if (!preview.value) return null;
  return {
    ...preview.value,
    headers: [...preview.value.headers],
    rows: [...preview.value.rows],
    missingColumns: [...preview.value.missingColumns],
    warnings: preview.value.warnings ? [...preview.value.warnings] : [],
  };
});

// Handle file selection
function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] || null;
  setFile(file);
}

// Handle preview button click
async function handlePreview() {
  await previewFile();
}

// Handle back to select
function handleBackToSelect() {
  reset();
  // Keep the file input value so user doesn't have to re-select
}

// Handle confirm import button click
async function handleConfirmImport() {
  const success = await uploadFile();
  if (success) {
    emit("success");
  }
}

// Handle import another button
function handleImportAnother() {
  reset();
  if (fileInput.value) {
    fileInput.value.value = "";
  }
}

// Handle close
function handleClose() {
  isOpen.value = false;
  // Reset after animation
  setTimeout(() => {
    reset();
    if (fileInput.value) {
      fileInput.value.value = "";
    }
  }, 300);
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

// Reset when dialog closes externally
watch(isOpen, (newVal) => {
  if (!newVal) {
    setTimeout(() => {
      reset();
      if (fileInput.value) {
        fileInput.value.value = "";
      }
    }, 300);
  }
});
</script>
