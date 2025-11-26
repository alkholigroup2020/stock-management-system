/**
 * Error Handler Composable
 * Provides consistent error handling and user-friendly error messages across the application
 *
 * Usage:
 * const { handleError, getErrorMessage } = useErrorHandler();
 * try {
 *   await $fetch('/api/...');
 * } catch (error) {
 *   handleError(error, { context: 'creating delivery' });
 * }
 */

interface ErrorDetails {
  code?: string;
  message?: string;
  details?: any;
  statusCode?: number;
}

interface ErrorOptions {
  /** Context for the error (e.g., "creating delivery", "fetching items") */
  context?: string;
  /** Show a retry action */
  showRetry?: boolean;
  /** Custom error handler instead of toast */
  customHandler?: (message: string, description?: string) => void;
  /** Fallback message if error cannot be parsed */
  fallbackMessage?: string;
}

interface ErrorMessageResult {
  title: string;
  description: string;
  suggestion?: string;
}

export const useErrorHandler = () => {
  const toast = useAppToast();

  /**
   * Standard error codes and their user-friendly messages
   */
  const ERROR_MESSAGES: Record<string, ErrorMessageResult> = {
    // Stock/Inventory errors
    INSUFFICIENT_STOCK: {
      title: "Insufficient Stock",
      description: "Not enough stock available to complete this operation.",
      suggestion:
        "Please check the stock levels and reduce the quantity, or wait for a delivery to arrive.",
    },

    // Location errors
    LOCATION_ACCESS_DENIED: {
      title: "Access Denied",
      description: "You do not have access to this location.",
      suggestion: "Please contact your supervisor to request access to this location.",
    },

    SAME_LOCATION: {
      title: "Invalid Transfer",
      description: "Source and destination locations must be different.",
      suggestion: "Please select a different destination location for the transfer.",
    },

    // Period errors
    PERIOD_CLOSED: {
      title: "Period Closed",
      description: "Cannot modify data for a closed accounting period.",
      suggestion: "Please wait for the next period to open, or contact an administrator.",
    },

    PERIOD_NOT_READY: {
      title: "Period Not Ready",
      description: "Not all locations are ready to close the period.",
      suggestion: "Ensure all locations have completed their reconciliations and marked as ready.",
    },

    // Price variance errors
    PRICE_VARIANCE: {
      title: "Price Variance Detected",
      description: "The delivery price differs from the locked period price.",
      suggestion:
        "An NCR (Non-Conformance Report) will be automatically created for review and approval.",
    },

    // Validation errors
    VALIDATION_ERROR: {
      title: "Validation Error",
      description: "The submitted data contains errors.",
      suggestion: "Please check all required fields and ensure the data is valid.",
    },

    REQUIRED_FIELD: {
      title: "Required Field Missing",
      description: "Please fill in all required fields.",
      suggestion: "Fields marked with an asterisk (*) are required.",
    },

    // Permission errors
    PERMISSION_DENIED: {
      title: "Permission Denied",
      description: "You do not have permission to perform this action.",
      suggestion: "Please contact your supervisor or administrator for access.",
    },

    UNAUTHORIZED: {
      title: "Unauthorized",
      description: "Your session has expired or you are not logged in.",
      suggestion: "Please log in again to continue.",
    },

    // Approval errors
    APPROVAL_REQUIRED: {
      title: "Approval Required",
      description: "This action requires supervisor or admin approval.",
      suggestion: "The request has been submitted and is pending approval.",
    },

    ALREADY_APPROVED: {
      title: "Already Approved",
      description: "This request has already been approved.",
      suggestion: "No further action is required.",
    },

    ALREADY_REJECTED: {
      title: "Already Rejected",
      description: "This request has already been rejected.",
      suggestion: "You may need to create a new request.",
    },

    // Network/Server errors
    NETWORK_ERROR: {
      title: "Network Error",
      description: "Unable to connect to the server.",
      suggestion: "Please check your internet connection and try again.",
    },

    SERVER_ERROR: {
      title: "Server Error",
      description: "An unexpected error occurred on the server.",
      suggestion: "Please try again later. If the problem persists, contact support.",
    },

    TIMEOUT: {
      title: "Request Timeout",
      description: "The request took too long to complete.",
      suggestion: "Please try again. If the problem persists, try with less data.",
    },

    // Database errors
    DUPLICATE_ENTRY: {
      title: "Duplicate Entry",
      description: "A record with this information already exists.",
      suggestion: "Please use a different value or update the existing record.",
    },

    NOT_FOUND: {
      title: "Not Found",
      description: "The requested resource could not be found.",
      suggestion: "The item may have been deleted or moved. Please refresh and try again.",
    },

    // Business logic errors
    NEGATIVE_STOCK_NOT_ALLOWED: {
      title: "Negative Stock Not Allowed",
      description: "This operation would result in negative stock.",
      suggestion: "Please adjust the quantity to match available stock.",
    },

    INVALID_STATUS_TRANSITION: {
      title: "Invalid Status Change",
      description: "Cannot change status from current state.",
      suggestion: "Please check the allowed status transitions for this item.",
    },
  };

  /**
   * Parse error object and extract error details
   */
  const parseError = (error: any): ErrorDetails => {
    // H3 error format (from Nuxt server)
    if (error?.data) {
      return {
        code: error.data.code,
        message: error.data.message,
        details: error.data.details,
        statusCode: error.statusCode || error.data.statusCode,
      };
    }

    // Fetch error
    if (error?.statusCode) {
      return {
        statusCode: error.statusCode,
        message: error.statusMessage || error.message,
      };
    }

    // Standard Error object
    if (error instanceof Error) {
      return {
        message: error.message,
      };
    }

    // String error
    if (typeof error === "string") {
      return {
        message: error,
      };
    }

    // Unknown error format
    return {
      message: "An unexpected error occurred",
    };
  };

  /**
   * Get user-friendly error message based on error code or HTTP status
   */
  const getErrorMessage = (
    error: any,
    context?: string
  ): { title: string; description: string; suggestion?: string } => {
    const parsed = parseError(error);

    // Check for known error code
    if (parsed.code && ERROR_MESSAGES[parsed.code]) {
      const errorMsg = ERROR_MESSAGES[parsed.code]!; // Non-null assertion since we check above

      // Add context-specific details if available
      let description = errorMsg.description;

      // Special handling for insufficient stock
      if (
        parsed.code === "INSUFFICIENT_STOCK" &&
        parsed.details?.insufficient_items?.length > 0
      ) {
        const items = parsed.details.insufficient_items;
        const itemList = items
          .map(
            (item: any) =>
              `${item.item_name}: requested ${item.requested}, available ${item.available}`
          )
          .join("; ");
        description = `${errorMsg.description} ${itemList}`;
      }

      // Add specific validation details
      if (parsed.code === "VALIDATION_ERROR" && parsed.details?.errors) {
        const validationErrors = Array.isArray(parsed.details.errors)
          ? parsed.details.errors.join(", ")
          : parsed.details.errors;
        description = `${errorMsg.description} ${validationErrors}`;
      }

      return {
        title: errorMsg.title,
        description,
        suggestion: errorMsg.suggestion,
      };
    }

    // Check for HTTP status codes
    if (parsed.statusCode) {
      switch (parsed.statusCode) {
        case 401:
          return ERROR_MESSAGES.UNAUTHORIZED as ErrorMessageResult;
        case 403:
          return ERROR_MESSAGES.PERMISSION_DENIED as ErrorMessageResult;
        case 404:
          return ERROR_MESSAGES.NOT_FOUND as ErrorMessageResult;
        case 408:
          return ERROR_MESSAGES.TIMEOUT as ErrorMessageResult;
        case 409:
          return ERROR_MESSAGES.DUPLICATE_ENTRY as ErrorMessageResult;
        case 500:
        case 502:
        case 503:
        case 504:
          return ERROR_MESSAGES.SERVER_ERROR as ErrorMessageResult;
        default:
          break;
      }
    }

    // Fallback: use the error message if available
    const title = context ? `Error ${context}` : "Error";
    const description = parsed.message || "An unexpected error occurred";

    return {
      title,
      description,
      suggestion: "Please try again. If the problem persists, contact support.",
    };
  };

  /**
   * Handle error with toast notification
   */
  const handleError = (error: any, options: ErrorOptions = {}): ErrorMessageResult => {
    const { context, showRetry, customHandler, fallbackMessage } = options;

    const errorMsg = getErrorMessage(error, context);

    // Use custom handler if provided
    if (customHandler) {
      customHandler(errorMsg.title, errorMsg.description);
      return errorMsg;
    }

    // Build description with suggestion
    let description = errorMsg.description;
    if (errorMsg.suggestion) {
      description = `${errorMsg.description}\n\n${errorMsg.suggestion}`;
    }

    // Show toast notification
    const toastOptions: any = {};
    if (description) toastOptions.description = description;

    toast.error(errorMsg.title, toastOptions);

    // Log error for debugging
    console.error(`[Error Handler] ${errorMsg.title}:`, error);

    return errorMsg;
  };

  /**
   * Handle success with toast notification
   */
  const handleSuccess = (
    title: string,
    description?: string,
    options?: { duration?: number }
  ) => {
    const toastOptions: any = {};
    if (description) toastOptions.description = description;
    if (options?.duration) toastOptions.duration = options.duration;

    toast.success(title, toastOptions);
  };

  /**
   * Handle warning with toast notification
   */
  const handleWarning = (
    title: string,
    options?: { description?: string; duration?: number }
  ) => {
    const toastOptions: any = {};
    if (options?.description) toastOptions.description = options.description;
    if (options?.duration) toastOptions.duration = options.duration;

    toast.warning(title, toastOptions);
  };

  /**
   * Handle info with toast notification
   */
  const handleInfo = (title: string, description?: string) => {
    const toastOptions: any = {};
    if (description) toastOptions.description = description;

    toast.info(title, toastOptions);
  };

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
    getErrorMessage,
    parseError,
  };
};
