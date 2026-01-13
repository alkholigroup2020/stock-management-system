<script setup lang="ts">
const expandedSections = ref<string[]>([]);

const toggleSection = (section: string) => {
  if (expandedSections.value.includes(section)) {
    expandedSections.value = [];
  } else {
    expandedSections.value = [section];
  }
};

const isExpanded = (section: string) => expandedSections.value.includes(section);

const targetSubSection = inject<Ref<string | null>>("devTargetSection", ref(null));

watch(
  targetSubSection,
  (newSection) => {
    if (newSection) {
      if (!expandedSections.value.includes(newSection)) {
        expandedSections.value.push(newSection);
      }
      nextTick(() => {
        const element = document.getElementById(`dev-section-${newSection}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (targetSubSection.value) {
          targetSubSection.value = null;
        }
      });
    }
  },
  { immediate: true }
);

// Code examples
const codeExamples = {
  serverErrorBasic: `import prisma from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const user = event.context.user;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      data: {
        code: "NOT_AUTHENTICATED",
        message: "You must be logged in to access this resource",
      },
    });
  }

  const itemId = getRouterParam(event, "id");

  if (!itemId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        code: "MISSING_PARAMETER",
        message: "Item ID is required",
      },
    });
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      data: {
        code: "ITEM_NOT_FOUND",
        message: "Item not found",
      },
    });
  }

  return { item };
});`,

  serverErrorAdvanced: `export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const data = bodySchema.parse(body);

    // Check stock availability
    const stock = await prisma.locationStock.findUnique({
      where: {
        location_id_item_id: {
          location_id: data.location_id,
          item_id: data.item_id,
        },
      },
    });

    if (!stock || stock.on_hand < data.quantity) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "INSUFFICIENT_STOCK",
          message: "Not enough stock available",
          details: {
            insufficient_items: [
              {
                item_id: data.item_id,
                item_name: item.name,
                requested: data.quantity,
                available: stock?.on_hand || 0,
              },
            ],
          },
        },
      });
    }

    // Perform operation...
    return { success: true };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: {
            errors: error.issues.map((issue) => ({
              path: issue.path,
              message: issue.message,
            })),
          },
        },
      });
    }

    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Generic server error
    console.error("Error processing request:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});`,

  clientErrorBasic: `<script setup lang="ts">
const { handleError, handleSuccess } = useErrorHandler();

const deleteItem = async (itemId: string) => {
  try {
    await $fetch(\`/api/items/\${itemId}\`, {
      method: "DELETE",
    });

    handleSuccess("Item Deleted", {
      description: "The item has been deleted successfully",
    });

    // Refresh data or redirect
    await refreshData();
  } catch (error) {
    handleError(error, { context: "deleting item" });
  }
};
<\/script>
`,

  clientErrorAdvanced: `<script setup lang="ts">
const { handleError, handleSuccess, getErrorMessage } = useErrorHandler();

const formData = reactive({
  supplier_id: "",
  invoice_no: "",
  lines: [],
});

const posting = ref(false);
const showPostConfirmation = ref(false);

const postDelivery = async () => {
  // Validate form
  if (!formData.supplier_id || !formData.invoice_no) {
    handleError({
      data: {
        code: "VALIDATION_ERROR",
        message: "Please fill in all required fields",
      },
    });
    return;
  }

  posting.value = true;

  try {
    const response = await $fetch("/api/locations/:id/deliveries", {
      method: "POST",
      body: { ...formData, status: "POSTED" },
    });

    handleSuccess("Delivery Posted", {
      description: response.message || "Delivery posted successfully",
    });

    // Invalidate caches
    await refreshNuxtData(["deliveries", "stock"]);

    // Redirect
    navigateTo("/deliveries");
  } catch (error) {
    // Custom handling for specific errors
    const errorMsg = getErrorMessage(error);

    if (errorMsg.title === "Insufficient Stock") {
      // Show custom modal or special handling
      showStockErrorDialog.value = true;
    }

    handleError(error, { context: "posting delivery" });
  } finally {
    posting.value = false;
    showPostConfirmation.value = false;
  }
};
<\/script>`,

  toastBasic: `<script setup lang="ts">
const toast = useAppToast();

// Success notification
const onSave = () => {
  toast.success("Item Saved", {
    description: "The item has been saved successfully",
  });
};

// Error notification
const onError = () => {
  toast.error("Failed to Save", {
    description: "An error occurred while saving the item",
  });
};

// Warning notification
const onWarning = () => {
  toast.warning("Low Stock", {
    description: "This item is running low on stock",
  });
};

// Info notification
const onInfo = () => {
  toast.info("Period Closing", {
    description: "The current period will close in 2 days",
  });
};
<\/script>`,

  toastAdvanced: `<script setup lang="ts">
const toast = useAppToast();

// Toast with custom icon
toast.success("Transfer Approved", {
  description: "The transfer has been approved and is ready for execution",
  icon: "i-lucide-check-circle-2",
  duration: 6000,
});

// Toast with actions
toast.info("New NCR Created", {
  description: "A price variance NCR has been automatically created",
  actions: [
    {
      label: "View NCR",
      click: () => {
        navigateTo(\`/ncrs/\${ncrId}\`);
      },
    },
  ],
});

// Clear all toasts
toast.clear();
<\/script>`,

  typeGuards: `/**
 * Type guard for H3 error format (from Nuxt server)
 */
export function isH3Error(error: unknown): error is {
  statusCode: number;
  statusMessage: string;
  data: {
    code?: string;
    message?: string;
    details?: unknown;
  };
} {
  return (
    error !== null &&
    typeof error === "object" &&
    "statusCode" in error &&
    "data" in error &&
    typeof (error as any).data === "object"
  );
}

/**
 * Type guard for Zod validation errors
 */
export function isZodError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError;
}

/**
 * Type guard for standard Error objects
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Usage example
try {
  await $fetch("/api/items", { method: "POST", body: data });
} catch (error) {
  if (isH3Error(error)) {
    // TypeScript knows error has statusCode, data, etc.
    console.error(error.data.code, error.data.message);
  } else if (isError(error)) {
    // TypeScript knows error has message property
    console.error(error.message);
  } else {
    // Unknown error type
    console.error("Unknown error:", error);
  }
}`,

  validationErrors: `<script setup lang="ts">
import { z } from "zod";

// Define validation schema
const itemSchema = z.object({
  code: z
    .string()
    .min(1, "Item code is required")
    .max(50, "Item code must be 50 characters or less"),
  name: z
    .string()
    .min(1, "Item name is required")
    .max(200, "Item name must be 200 characters or less"),
  unit: z.enum(["KG", "EA", "LTR", "BOX", "CASE", "PACK"], {
    errorMap: () => ({ message: "Please select a valid unit" }),
  }),
});

// Form state
const form = reactive({
  code: "",
  name: "",
  unit: undefined as string | undefined,
});

const errors = reactive({
  code: "",
  name: "",
  unit: "",
});

// Field-level validation
function validateField(field: keyof typeof form) {
  try {
    const fieldSchema = itemSchema.shape[field];
    if (fieldSchema) {
      fieldSchema.parse(form[field]);
      errors[field] = "";
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors[field] = error.issues[0]?.message || "Invalid value";
    }
  }
}

// Form-level validation
function validateForm(): boolean {
  try {
    itemSchema.parse(form);

    // Clear all errors
    Object.keys(errors).forEach((key) => {
      errors[key as keyof typeof errors] = "";
    });

    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Set errors for each field
      error.issues.forEach((err) => {
        const field = err.path[0] as keyof typeof errors;
        if (field) {
          errors[field] = err.message;
        }
      });
    }
    return false;
  }
}
<\/script>

<template>
  <div>
    <UInput
      v-model="form.code"
      :error="!!errors.code"
      @blur="validateField('code')"
    />
    <p v-if="errors.code" class="mt-1 text-caption text-[var(--ui-error)]">
      {{ errors.code }}
    </p>
  </div>
</template>`,

  networkErrors: `<script setup lang="ts">
const { handleError } = useErrorHandler();
const { isOnline } = useOnlineStatus();

const fetchData = async () => {
  // Check online status first
  if (!isOnline.value) {
    handleError({
      data: {
        code: "NETWORK_ERROR",
        message: "You are offline. Please check your connection.",
      },
    });
    return;
  }

  try {
    const data = await $fetch("/api/items");
    return data;
  } catch (error) {
    // Network errors typically have no response
    if (!error || typeof error !== "object" || !("statusCode" in error)) {
      handleError({
        data: {
          code: "NETWORK_ERROR",
          message: "Unable to connect to the server",
        },
      });
    } else {
      handleError(error, { context: "fetching items" });
    }
  }
};
<\/script>`,

  offlineGuard: `<script setup lang="ts">
const { isOnline, guardAction, checkOnline } = useOfflineGuard();

// Wrap async actions to guard against offline execution
const handleSubmit = async () => {
  await guardAction(async () => {
    await $fetch("/api/deliveries", {
      method: "POST",
      body: formData,
    });

    handleSuccess("Delivery Created");
  }, {
    offlineMessage: "Cannot create delivery",
    offlineDescription: "You need to be online to create a delivery",
  });
};

// Synchronous check before starting an action
const startProcess = () => {
  if (!checkOnline()) {
    return; // Toast already shown by checkOnline
  }

  // Continue with the process
  showModal.value = true;
};
<\/script>

<template>
  <div>
    <!-- Disable button when offline -->
    <UButton
      :disabled="!isOnline"
      class="cursor-pointer"
      @click="handleSubmit"
    >
      Submit
    </UButton>
  </div>
</template>`,

  apiErrorHandling: `// server/api/items/[id].patch.ts
export default defineEventHandler(async (event) => {
  try {
    const itemId = getRouterParam(event, "id");
    const body = await readBody(event);

    // Validate request
    const data = updateItemSchema.parse(body);

    // Check item exists
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "ITEM_NOT_FOUND",
          message: "Item not found",
        },
      });
    }

    // Check for duplicate code
    if (data.code && data.code !== item.code) {
      const existing = await prisma.item.findFirst({
        where: { code: data.code },
      });

      if (existing) {
        throw createError({
          statusCode: 409,
          statusMessage: "Conflict",
          data: {
            code: "DUPLICATE_CODE",
            message: "An item with this code already exists",
          },
        });
      }
    }

    // Update item
    const updated = await prisma.item.update({
      where: { id: itemId },
      data,
    });

    return {
      message: "Item updated successfully",
      item: updated,
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: {
            errors: error.issues,
          },
        },
      });
    }

    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Log and return generic error
    console.error("Error updating item:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to update item",
      },
    });
  }
});`,

  errorCodes: `/**
 * Standard Error Codes
 *
 * These error codes are used throughout the application for consistent
 * error handling and user-friendly messages.
 */

// Stock/Inventory Errors
INSUFFICIENT_STOCK          // Not enough stock for operation
NEGATIVE_STOCK_NOT_ALLOWED  // Operation would result in negative stock

// Location Errors
LOCATION_ACCESS_DENIED      // User lacks access to location
LOCATION_NOT_FOUND          // Location doesn't exist
SAME_LOCATION               // Source and destination are the same

// Period Errors
PERIOD_CLOSED               // Cannot modify closed period
PERIOD_NOT_READY            // Not all locations ready for close
NO_OPEN_PERIOD              // No open period exists

// Price Errors
PRICE_VARIANCE              // Price differs from locked period price

// Validation Errors
VALIDATION_ERROR            // General validation error
REQUIRED_FIELD              // Required field missing

// Permission Errors
PERMISSION_DENIED           // User lacks permission
UNAUTHORIZED                // Not authenticated or session expired

// Approval Errors
APPROVAL_REQUIRED           // Action requires approval
ALREADY_APPROVED            // Already approved
ALREADY_REJECTED            // Already rejected

// Network/Server Errors
NETWORK_ERROR               // Cannot connect to server
SERVER_ERROR                // Server-side error
TIMEOUT                     // Request timeout

// Database Errors
DUPLICATE_ENTRY             // Record already exists
NOT_FOUND                   // Resource not found

// Business Logic Errors
INVALID_STATUS_TRANSITION   // Invalid status change`,
};
</script>

<template>
  <div class="space-y-4">
    <!-- Overview -->
    <div class="prose prose-sm max-w-none">
      <p class="text-body leading-relaxed">
        This guide covers error handling patterns across the application, from server-side error
        creation to client-side error handling with user-friendly notifications.
      </p>
    </div>

    <!-- Navigation Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <button
        class="p-4 rounded-lg border border-[var(--ui-border)] hover:border-primary hover:bg-[var(--ui-bg-elevated)] transition-all text-left group cursor-pointer"
        @click="
          () => {
            expandedSections.value = ['server-errors'];
            nextTick(() =>
              document
                .getElementById('dev-section-server-errors')
                ?.scrollIntoView({ behavior: 'smooth' })
            );
          }
        "
      >
        <div class="flex items-center gap-3 mb-2">
          <UIcon
            name="i-lucide-server"
            class="w-5 h-5 text-primary group-hover:scale-110 transition-transform"
          />
          <h3 class="font-semibold text-[var(--ui-text)] group-hover:text-primary transition-colors">
            Server Error Patterns
          </h3>
        </div>
        <p class="text-caption leading-relaxed">createError() for API errors</p>
      </button>

      <button
        class="p-4 rounded-lg border border-[var(--ui-border)] hover:border-primary hover:bg-[var(--ui-bg-elevated)] transition-all text-left group cursor-pointer"
        @click="
          () => {
            expandedSections.value = ['client-errors'];
            nextTick(() =>
              document
                .getElementById('dev-section-client-errors')
                ?.scrollIntoView({ behavior: 'smooth' })
            );
          }
        "
      >
        <div class="flex items-center gap-3 mb-2">
          <UIcon
            name="i-lucide-alert-circle"
            class="w-5 h-5 text-primary group-hover:scale-110 transition-transform"
          />
          <h3 class="font-semibold text-[var(--ui-text)] group-hover:text-primary transition-colors">
            Client Error Handling
          </h3>
        </div>
        <p class="text-caption leading-relaxed">useErrorHandler composable</p>
      </button>

      <button
        class="p-4 rounded-lg border border-[var(--ui-border)] hover:border-primary hover:bg-[var(--ui-bg-elevated)] transition-all text-left group cursor-pointer"
        @click="
          () => {
            expandedSections.value = ['toast-notifications'];
            nextTick(() =>
              document
                .getElementById('dev-section-toast-notifications')
                ?.scrollIntoView({ behavior: 'smooth' })
            );
          }
        "
      >
        <div class="flex items-center gap-3 mb-2">
          <UIcon
            name="i-lucide-message-square"
            class="w-5 h-5 text-primary group-hover:scale-110 transition-transform"
          />
          <h3 class="font-semibold text-[var(--ui-text)] group-hover:text-primary transition-colors">
            Toast Notifications
          </h3>
        </div>
        <p class="text-caption leading-relaxed">useAppToast for user feedback</p>
      </button>

      <button
        class="p-4 rounded-lg border border-[var(--ui-border)] hover:border-primary hover:bg-[var(--ui-bg-elevated)] transition-all text-left group cursor-pointer"
        @click="
          () => {
            expandedSections.value = ['validation-errors'];
            nextTick(() =>
              document
                .getElementById('dev-section-validation-errors')
                ?.scrollIntoView({ behavior: 'smooth' })
            );
          }
        "
      >
        <div class="flex items-center gap-3 mb-2">
          <UIcon
            name="i-lucide-shield-alert"
            class="w-5 h-5 text-primary group-hover:scale-110 transition-transform"
          />
          <h3 class="font-semibold text-[var(--ui-text)] group-hover:text-primary transition-colors">
            Validation Errors
          </h3>
        </div>
        <p class="text-caption leading-relaxed">Zod schema validation patterns</p>
      </button>

      <button
        class="p-4 rounded-lg border border-[var(--ui-border)] hover:border-primary hover:bg-[var(--ui-bg-elevated)] transition-all text-left group cursor-pointer"
        @click="
          () => {
            expandedSections.value = ['network-errors'];
            nextTick(() =>
              document
                .getElementById('dev-section-network-errors')
                ?.scrollIntoView({ behavior: 'smooth' })
            );
          }
        "
      >
        <div class="flex items-center gap-3 mb-2">
          <UIcon
            name="i-lucide-wifi-off"
            class="w-5 h-5 text-primary group-hover:scale-110 transition-transform"
          />
          <h3 class="font-semibold text-[var(--ui-text)] group-hover:text-primary transition-colors">
            Network Errors
          </h3>
        </div>
        <p class="text-caption leading-relaxed">Offline detection & handling</p>
      </button>

      <button
        class="p-4 rounded-lg border border-[var(--ui-border)] hover:border-primary hover:bg-[var(--ui-bg-elevated)] transition-all text-left group cursor-pointer"
        @click="
          () => {
            expandedSections.value = ['type-guards'];
            nextTick(() =>
              document
                .getElementById('dev-section-type-guards')
                ?.scrollIntoView({ behavior: 'smooth' })
            );
          }
        "
      >
        <div class="flex items-center gap-3 mb-2">
          <UIcon
            name="i-lucide-shield-check"
            class="w-5 h-5 text-primary group-hover:scale-110 transition-transform"
          />
          <h3 class="font-semibold text-[var(--ui-text)] group-hover:text-primary transition-colors">
            Type Guards
          </h3>
        </div>
        <p class="text-caption leading-relaxed">Type-safe error handling</p>
      </button>

      <button
        class="p-4 rounded-lg border border-[var(--ui-border)] hover:border-primary hover:bg-[var(--ui-bg-elevated)] transition-all text-left group cursor-pointer"
        @click="
          () => {
            expandedSections.value = ['error-codes'];
            nextTick(() =>
              document
                .getElementById('dev-section-error-codes')
                ?.scrollIntoView({ behavior: 'smooth' })
            );
          }
        "
      >
        <div class="flex items-center gap-3 mb-2">
          <UIcon
            name="i-lucide-list"
            class="w-5 h-5 text-primary group-hover:scale-110 transition-transform"
          />
          <h3 class="font-semibold text-[var(--ui-text)] group-hover:text-primary transition-colors">
            Standard Error Codes
          </h3>
        </div>
        <p class="text-caption leading-relaxed">Consistent error code reference</p>
      </button>
    </div>

    <!-- 1. Server Error Patterns -->
    <UCard id="dev-section-server-errors" class="card-elevated">
      <template #header>
        <button
          class="w-full flex items-center justify-between cursor-pointer hover:text-primary transition-colors"
          @click="toggleSection('server-errors')"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-server" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">Server Error Patterns (createError)</h3>
          </div>
          <UIcon
            :name="isExpanded('server-errors') ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="w-5 h-5"
          />
        </button>
      </template>

      <div v-if="isExpanded('server-errors')" class="space-y-4">
        <div class="prose prose-sm max-w-none">
          <p class="text-body leading-relaxed">
            Server routes use <code>createError()</code> from H3/Nuxt to throw standardized errors
            with consistent structure. All errors include a <code>code</code> for programmatic
            handling and a user-friendly <code>message</code>.
          </p>

          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">Error Structure</h4>
          <ul class="list-disc list-inside space-y-2 text-body">
            <li>
              <strong>statusCode:</strong> HTTP status code (400, 401, 403, 404, 500, etc.)
            </li>
            <li><strong>statusMessage:</strong> HTTP status text (e.g., "Bad Request")</li>
            <li>
              <strong>data.code:</strong> Application-specific error code (e.g.,
              "INSUFFICIENT_STOCK")
            </li>
            <li><strong>data.message:</strong> User-friendly error message</li>
            <li>
              <strong>data.details:</strong> Optional additional context (e.g., which items are out
              of stock)
            </li>
          </ul>

          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">Basic Example</h4>
        </div>

        <DeveloperCodeBlock
          :code="codeExamples.serverErrorBasic"
          language="typescript"
          filename="server/api/items/[id].get.ts"
        />

        <div class="prose prose-sm max-w-none">
          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">
            Advanced Example with Details
          </h4>
        </div>

        <DeveloperCodeBlock
          :code="codeExamples.serverErrorAdvanced"
          language="typescript"
          filename="server/api/locations/[id]/issues/index.post.ts"
        />

        <UAlert
          color="primary"
          variant="subtle"
          title="Best Practice"
          description="Always include a code in data for programmatic error handling on the client. Use details to provide context-specific information like which items are insufficient."
          icon="i-lucide-lightbulb"
        />
      </div>
    </UCard>

    <!-- 2. Client Error Handling -->
    <UCard id="dev-section-client-errors" class="card-elevated">
      <template #header>
        <button
          class="w-full flex items-center justify-between cursor-pointer hover:text-primary transition-colors"
          @click="toggleSection('client-errors')"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">Client Error Handling (useErrorHandler)</h3>
          </div>
          <UIcon
            :name="isExpanded('client-errors') ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="w-5 h-5"
          />
        </button>
      </template>

      <div v-if="isExpanded('client-errors')" class="space-y-4">
        <div class="prose prose-sm max-w-none">
          <p class="text-body leading-relaxed">
            The <code>useErrorHandler</code> composable provides centralized error handling with
            automatic toast notifications and user-friendly error messages. It maps standard error
            codes to user-friendly messages with suggestions.
          </p>

          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">Composable API</h4>
          <ul class="list-disc list-inside space-y-2 text-body">
            <li>
              <strong>handleError(error, options):</strong> Display error with toast notification
            </li>
            <li>
              <strong>handleSuccess(title, description):</strong> Display success toast
            </li>
            <li>
              <strong>handleWarning(title, options):</strong> Display warning toast
            </li>
            <li><strong>handleInfo(title, description):</strong> Display info toast</li>
            <li>
              <strong>getErrorMessage(error):</strong> Parse error and return formatted message
            </li>
            <li><strong>parseError(error):</strong> Extract error details from various formats</li>
          </ul>

          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">Basic Usage</h4>
        </div>

        <DeveloperCodeBlock
          :code="codeExamples.clientErrorBasic"
          language="vue"
          filename="app/pages/items/[id].vue"
        />

        <div class="prose prose-sm max-w-none">
          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">Advanced Usage</h4>
        </div>

        <DeveloperCodeBlock
          :code="codeExamples.clientErrorAdvanced"
          language="vue"
          filename="app/pages/deliveries/create.vue"
        />

        <UAlert
          color="primary"
          variant="subtle"
          title="Error Context"
          description="Always provide context when calling handleError() to help users understand what operation failed. Use { context: 'creating delivery' } to generate messages like 'Error creating delivery'."
          icon="i-lucide-lightbulb"
        />
      </div>
    </UCard>

    <!-- 3. Toast Notifications -->
    <UCard id="dev-section-toast-notifications" class="card-elevated">
      <template #header>
        <button
          class="w-full flex items-center justify-between cursor-pointer hover:text-primary transition-colors"
          @click="toggleSection('toast-notifications')"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-message-square" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">Toast Notifications (useAppToast)</h3>
          </div>
          <UIcon
            :name="
              isExpanded('toast-notifications') ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'
            "
            class="w-5 h-5"
          />
        </button>
      </template>

      <div v-if="isExpanded('toast-notifications')" class="space-y-4">
        <div class="prose prose-sm max-w-none">
          <p class="text-body leading-relaxed">
            The <code>useAppToast</code> composable wraps Nuxt UI's toast system with predefined
            colors and icons for consistent notifications across the app.
          </p>

          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">Toast Types</h4>
          <ul class="list-disc list-inside space-y-2 text-body">
            <li>
              <strong>success:</strong> Emerald color, check icon, 5s duration - for successful
              operations
            </li>
            <li>
              <strong>error:</strong> Red color, X icon, 7s duration - for errors (stays longer)
            </li>
            <li>
              <strong>warning:</strong> Amber color, triangle icon, 6s duration - for warnings
            </li>
            <li>
              <strong>info:</strong> Primary (navy) color, info icon, 5s duration - for
              informational messages
            </li>
          </ul>

          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">Basic Usage</h4>
        </div>

        <DeveloperCodeBlock
          :code="codeExamples.toastBasic"
          language="vue"
          filename="app/pages/items/create.vue"
        />

        <div class="prose prose-sm max-w-none">
          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">Advanced Features</h4>
        </div>

        <DeveloperCodeBlock
          :code="codeExamples.toastAdvanced"
          language="vue"
          filename="app/pages/transfers/[id].vue"
        />

        <UAlert
          color="primary"
          variant="subtle"
          title="Toast Best Practices"
          description="Use success for confirmations, error for failures, warning for cautions, and info for neutral updates. Always provide a description for context. Keep messages concise and actionable."
          icon="i-lucide-lightbulb"
        />
      </div>
    </UCard>

    <!-- 4. Validation Errors -->
    <UCard id="dev-section-validation-errors" class="card-elevated">
      <template #header>
        <button
          class="w-full flex items-center justify-between cursor-pointer hover:text-primary transition-colors"
          @click="toggleSection('validation-errors')"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-shield-alert" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">Validation Errors (Zod)</h3>
          </div>
          <UIcon
            :name="
              isExpanded('validation-errors') ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'
            "
            class="w-5 h-5"
          />
        </button>
      </template>

      <div v-if="isExpanded('validation-errors')" class="space-y-4">
        <div class="prose prose-sm max-w-none">
          <p class="text-body leading-relaxed">
            Validation errors use <strong>Zod</strong> schemas for type-safe validation on both
            client and server. Forms display field-level errors inline, with general errors shown
            via toast.
          </p>

          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">Validation Patterns</h4>
          <ul class="list-disc list-inside space-y-2 text-body">
            <li><strong>Field-level validation:</strong> Run on blur to validate individual fields</li>
            <li><strong>Form-level validation:</strong> Run on submit to validate entire form</li>
            <li>
              <strong>Server-side validation:</strong> Always validate in API routes with Zod
            </li>
            <li><strong>Error display:</strong> Show inline errors below fields, toast for general errors</li>
          </ul>

          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">
            Client-Side Validation
          </h4>
        </div>

        <DeveloperCodeBlock
          :code="codeExamples.validationErrors"
          language="vue"
          filename="app/pages/items/create.vue"
        />

        <div class="prose prose-sm max-w-none">
          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">
            Server-Side Validation
          </h4>
          <p class="text-body leading-relaxed">
            Always validate request bodies in API routes. Catch Zod errors and return a standardized
            VALIDATION_ERROR response.
          </p>
        </div>

        <DeveloperCodeBlock
          :code="codeExamples.apiErrorHandling"
          language="typescript"
          filename="server/api/items/[id].patch.ts"
        />

        <UAlert
          color="primary"
          variant="subtle"
          title="Validation Best Practice"
          description="Use the same Zod schema on both client and server for consistency. Validate on blur for immediate feedback, and on submit to catch any remaining errors. Always validate on the server even if client validation passes."
          icon="i-lucide-lightbulb"
        />
      </div>
    </UCard>

    <!-- 5. Network Errors -->
    <UCard id="dev-section-network-errors" class="card-elevated">
      <template #header>
        <button
          class="w-full flex items-center justify-between cursor-pointer hover:text-primary transition-colors"
          @click="toggleSection('network-errors')"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-wifi-off" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">Network Errors & Offline Handling</h3>
          </div>
          <UIcon
            :name="isExpanded('network-errors') ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="w-5 h-5"
          />
        </button>
      </template>

      <div v-if="isExpanded('network-errors')" class="space-y-4">
        <div class="prose prose-sm max-w-none">
          <p class="text-body leading-relaxed">
            Network errors occur when the client cannot reach the server. The app uses
            <code>useOnlineStatus()</code> to detect offline state and <code>useOfflineGuard()</code>
            to prevent actions when offline.
          </p>

          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">Network Error Types</h4>
          <ul class="list-disc list-inside space-y-2 text-body">
            <li><strong>Offline:</strong> User has no internet connection (detected by browser)</li>
            <li><strong>Timeout:</strong> Request took too long to complete</li>
            <li><strong>Connection Error:</strong> Cannot reach the server (server down, DNS issues)</li>
            <li><strong>CORS Error:</strong> Cross-origin request blocked</li>
          </ul>

          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">
            Detecting Network Errors
          </h4>
        </div>

        <DeveloperCodeBlock
          :code="codeExamples.networkErrors"
          language="vue"
          filename="app/pages/items/index.vue"
        />

        <div class="prose prose-sm max-w-none">
          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">
            Using Offline Guard
          </h4>
        </div>

        <DeveloperCodeBlock
          :code="codeExamples.offlineGuard"
          language="vue"
          filename="app/composables/useOfflineGuard.ts"
        />

        <UAlert
          color="primary"
          variant="subtle"
          title="Offline Detection"
          description="Use useOfflineGuard() to disable action buttons when offline. The composable automatically shows a toast when users try to perform actions while offline. Network errors have no statusCode in the error object."
          icon="i-lucide-lightbulb"
        />
      </div>
    </UCard>

    <!-- 6. Type Guards -->
    <UCard id="dev-section-type-guards" class="card-elevated">
      <template #header>
        <button
          class="w-full flex items-center justify-between cursor-pointer hover:text-primary transition-colors"
          @click="toggleSection('type-guards')"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-shield-check" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">Type Guards for Error Types</h3>
          </div>
          <UIcon
            :name="isExpanded('type-guards') ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="w-5 h-5"
          />
        </button>
      </template>

      <div v-if="isExpanded('type-guards')" class="space-y-4">
        <div class="prose prose-sm max-w-none">
          <p class="text-body leading-relaxed">
            Type guards provide type-safe error handling by narrowing the error type. This enables
            TypeScript to understand the error structure and provide autocomplete and type checking.
          </p>

          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">Common Error Types</h4>
          <ul class="list-disc list-inside space-y-2 text-body">
            <li>
              <strong>H3Error:</strong> Standard Nuxt server error with statusCode and data
            </li>
            <li><strong>ZodError:</strong> Validation error from Zod schema</li>
            <li><strong>Error:</strong> Standard JavaScript Error object</li>
            <li><strong>Unknown:</strong> Catch-all for unexpected error formats</li>
          </ul>

          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">Type Guard Examples</h4>
        </div>

        <DeveloperCodeBlock
          :code="codeExamples.typeGuards"
          language="typescript"
          filename="app/utils/errorTypeGuards.ts"
        />

        <UAlert
          color="primary"
          variant="subtle"
          title="Type Safety"
          description="Always use type guards when handling errors in catch blocks. This ensures TypeScript knows the error structure and prevents runtime errors from accessing non-existent properties."
          icon="i-lucide-lightbulb"
        />
      </div>
    </UCard>

    <!-- 7. Standard Error Codes -->
    <UCard id="dev-section-error-codes" class="card-elevated">
      <template #header>
        <button
          class="w-full flex items-center justify-between cursor-pointer hover:text-primary transition-colors"
          @click="toggleSection('error-codes')"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-list" class="w-5 h-5 text-primary" />
            <h3 class="text-lg font-semibold">Standard Error Codes Reference</h3>
          </div>
          <UIcon
            :name="isExpanded('error-codes') ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="w-5 h-5"
          />
        </button>
      </template>

      <div v-if="isExpanded('error-codes')" class="space-y-4">
        <div class="prose prose-sm max-w-none">
          <p class="text-body leading-relaxed">
            The application uses standardized error codes for consistent error handling across
            server and client. Each code maps to a user-friendly message with a helpful suggestion.
          </p>

          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">
            Error Code Categories
          </h4>
        </div>

        <DeveloperCodeBlock
          :code="codeExamples.errorCodes"
          language="typescript"
          filename="app/composables/useErrorHandler.ts"
        />

        <div class="prose prose-sm max-w-none">
          <h4 class="text-md font-semibold text-[var(--ui-text)] mt-6 mb-3">Usage Guidelines</h4>
          <ul class="list-disc list-inside space-y-2 text-body">
            <li>
              <strong>Server:</strong> Always include a <code>code</code> in createError data
            </li>
            <li>
              <strong>Client:</strong> useErrorHandler automatically maps codes to user messages
            </li>
            <li>
              <strong>New codes:</strong> Add to ERROR_MESSAGES in useErrorHandler with title,
              description, and suggestion
            </li>
            <li>
              <strong>Consistency:</strong> Use existing codes where applicable before creating new
              ones
            </li>
          </ul>
        </div>

        <UAlert
          color="primary"
          variant="subtle"
          title="Error Code Best Practice"
          description="Use descriptive, SCREAMING_SNAKE_CASE error codes. Always provide a user-friendly message and actionable suggestion. Document new codes in useErrorHandler.ts."
          icon="i-lucide-lightbulb"
        />
      </div>
    </UCard>

    <!-- Best Practices Summary -->
    <UCard class="card-elevated border-primary/20">
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-check-circle-2" class="w-5 h-5 text-success" />
          <h3 class="text-lg font-semibold text-[var(--ui-text)]">
            Error Handling Best Practices
          </h3>
        </div>
      </template>

      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Do's -->
          <div>
            <h4 class="text-md font-semibold text-success mb-3 flex items-center gap-2">
              <UIcon name="i-lucide-check" class="w-4 h-4" />
              Do
            </h4>
            <ul class="space-y-2 text-caption">
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span
                  >Use <code>createError()</code> with standardized structure in server routes</span
                >
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Always include a <code>code</code> in error data for programmatic handling</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Use <code>useErrorHandler</code> for consistent client-side error handling</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Provide context when calling <code>handleError()</code></span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Validate on both client (for UX) and server (for security)</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Use type guards for type-safe error handling in catch blocks</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Check online status before making network requests</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Display field-level validation errors inline below inputs</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Log errors to console for debugging in development</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Provide actionable suggestions in error messages</span>
              </li>
            </ul>
          </div>

          <!-- Don'ts -->
          <div>
            <h4 class="text-md font-semibold text-[var(--ui-error)] mb-3 flex items-center gap-2">
              <UIcon name="i-lucide-x" class="w-4 h-4" />
              Don't
            </h4>
            <ul class="space-y-2 text-caption">
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-x" class="w-4 h-4 text-[var(--ui-error)] mt-0.5 flex-shrink-0" />
                <span>Don't expose sensitive information in error messages</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-x" class="w-4 h-4 text-[var(--ui-error)] mt-0.5 flex-shrink-0" />
                <span>Don't show technical stack traces to end users</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-x" class="w-4 h-4 text-[var(--ui-error)] mt-0.5 flex-shrink-0" />
                <span>Don't use generic messages like "An error occurred"</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-x" class="w-4 h-4 text-[var(--ui-error)] mt-0.5 flex-shrink-0" />
                <span>Don't silently catch and ignore errors</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-x" class="w-4 h-4 text-[var(--ui-error)] mt-0.5 flex-shrink-0" />
                <span>Don't skip server-side validation even if client validates</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-x" class="w-4 h-4 text-[var(--ui-error)] mt-0.5 flex-shrink-0" />
                <span>Don't access error properties without type guards</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-x" class="w-4 h-4 text-[var(--ui-error)] mt-0.5 flex-shrink-0" />
                <span>Don't create new error codes without adding to ERROR_MESSAGES</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-x" class="w-4 h-4 text-[var(--ui-error)] mt-0.5 flex-shrink-0" />
                <span>Don't allow operations when offline without checking first</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-x" class="w-4 h-4 text-[var(--ui-error)] mt-0.5 flex-shrink-0" />
                <span>Don't use toast for validation errors (use inline display)</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-x" class="w-4 h-4 text-[var(--ui-error)] mt-0.5 flex-shrink-0" />
                <span>Don't throw raw strings or objects from server routes</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
