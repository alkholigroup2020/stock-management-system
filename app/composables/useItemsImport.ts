import type { ImportResult, ImportPreview } from "~~/shared/types/import";

/**
 * Import step in the workflow
 */
export type ImportStep = "select" | "previewing" | "preview" | "importing" | "results";

/**
 * Composable for managing items import state and operations
 */
export function useItemsImport() {
  const { isOnline } = useOnlineStatus();
  const toast = useAppToast();

  // Reactive state
  const selectedFile = ref<File | null>(null);
  const currentStep = ref<ImportStep>("select");
  const loading = ref(false);
  const result = ref<ImportResult | null>(null);
  const preview = ref<ImportPreview | null>(null);
  const error = ref<string | null>(null);

  /**
   * Reset the import state
   */
  function reset() {
    selectedFile.value = null;
    currentStep.value = "select";
    loading.value = false;
    result.value = null;
    preview.value = null;
    error.value = null;
  }

  /**
   * Set the selected file
   */
  function setFile(file: File | null) {
    selectedFile.value = file;
    error.value = null;

    // Validate file type
    if (file) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];
      const validExtensions = [".xlsx", ".xls", ".csv"];
      const hasValidExtension = validExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

      if (!validTypes.includes(file.type) && !hasValidExtension) {
        error.value = "Please select an Excel (.xlsx) or CSV file";
        selectedFile.value = null;
      }
    }
  }

  /**
   * Preview the import file (for US4)
   */
  async function previewFile(): Promise<boolean> {
    if (!selectedFile.value) {
      error.value = "No file selected";
      return false;
    }

    if (!isOnline.value) {
      error.value = "Import requires an internet connection";
      return false;
    }

    loading.value = true;
    error.value = null;
    currentStep.value = "previewing";

    try {
      const formData = new FormData();
      formData.append("file", selectedFile.value);

      const response = await $fetch<ImportPreview>("/api/items/import-preview", {
        method: "POST",
        body: formData,
      });

      preview.value = response;
      currentStep.value = "preview";
      return true;
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      error.value = errorData?.data?.message || "Failed to preview file";
      currentStep.value = "select";
      toast.error("Preview Failed", { description: error.value });
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Upload and import the file
   */
  async function uploadFile(): Promise<boolean> {
    if (!selectedFile.value) {
      error.value = "No file selected";
      return false;
    }

    if (!isOnline.value) {
      error.value = "Import requires an internet connection";
      return false;
    }

    loading.value = true;
    error.value = null;
    currentStep.value = "importing";

    try {
      const formData = new FormData();
      formData.append("file", selectedFile.value);

      const response = await $fetch<ImportResult>("/api/items/import", {
        method: "POST",
        body: formData,
      });

      result.value = response;
      currentStep.value = "results";

      // Show toast notification
      if (response.success) {
        if (response.summary.errorCount > 0) {
          toast.warning("Import Completed with Errors", {
            description: `${response.summary.successCount} items imported, ${response.summary.errorCount} failed`,
          });
        } else {
          toast.success("Import Successful", {
            description: `${response.summary.successCount} items imported`,
          });
        }
      } else {
        toast.error("Import Failed", {
          description: `No items imported. ${response.summary.errorCount} errors found.`,
        });
      }

      return response.success;
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      error.value = errorData?.data?.message || "Failed to import file";
      currentStep.value = "select";
      toast.error("Import Failed", { description: error.value });
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Download the import template
   */
  function downloadTemplate(format: "xlsx" | "csv" = "xlsx") {
    window.open(`/api/items/import-template?format=${format}`, "_blank");
  }

  return {
    // State
    selectedFile: readonly(selectedFile),
    currentStep: readonly(currentStep),
    loading: readonly(loading),
    result: readonly(result),
    preview: readonly(preview),
    error: readonly(error),
    isOnline,

    // Actions
    setFile,
    previewFile,
    uploadFile,
    downloadTemplate,
    reset,
  };
}
