/**
 * useFormServerErrors - Maps server errors to form field errors
 *
 * Handles server error responses and maps them to form fields for inline display.
 * Works with UForm pattern and UFormField's error prop.
 */

interface ServerError {
  code?: string;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

interface FieldErrorMap {
  [fieldName: string]: string;
}

interface ErrorCodeMapping {
  [errorCode: string]: string;
}

export const useFormServerErrors = (customMappings?: ErrorCodeMapping) => {
  // Default error code to field mappings
  const defaultMappings: ErrorCodeMapping = {
    USERNAME_EXISTS: "username",
    EMAIL_EXISTS: "email",
  };

  const mappings = { ...defaultMappings, ...customMappings };

  /**
   * Parse error object and extract server error details
   * Handles H3/Nuxt error structure where actual error data is nested at error.data.data
   */
  const parseServerError = (error: unknown): ServerError | null => {
    if (
      error &&
      typeof error === "object" &&
      "data" in error &&
      error.data &&
      typeof error.data === "object"
    ) {
      const outerData = error.data as Record<string, unknown>;

      // H3/Nuxt errors nest the actual error data inside data.data
      if (
        "data" in outerData &&
        outerData.data &&
        typeof outerData.data === "object"
      ) {
        return outerData.data as ServerError;
      }

      // Fallback to direct data if no nested structure
      return outerData as ServerError;
    }
    return null;
  };

  /**
   * Map server error to field errors
   */
  const mapServerErrorToFields = (error: unknown): FieldErrorMap => {
    const fieldErrors: FieldErrorMap = {};

    const serverError = parseServerError(error);
    if (!serverError) return fieldErrors;

    const errorCode = serverError.code;

    // Handle specific error codes (USERNAME_EXISTS, EMAIL_EXISTS, etc.)
    if (errorCode) {
      const fieldName = mappings[errorCode];
      if (fieldName) {
        fieldErrors[fieldName] = serverError.message || "This value is already taken";
      }
    }

    // Handle VALIDATION_ERROR with field-specific errors
    if (errorCode === "VALIDATION_ERROR" && serverError.errors) {
      serverError.errors.forEach((err) => {
        if (err.field) {
          fieldErrors[err.field] = err.message;
        }
      });
    }

    return fieldErrors;
  };

  /**
   * Check if error is a field-specific error (should show inline)
   */
  const isFieldError = (error: unknown): boolean => {
    const serverError = parseServerError(error);
    if (!serverError) return false;

    const errorCode = serverError.code;

    // Check if error code maps to a field
    if (errorCode && mappings[errorCode]) return true;

    // Check if it's a validation error with field details
    if (errorCode === "VALIDATION_ERROR" && serverError.errors?.length) return true;

    return false;
  };

  /**
   * Get appropriate error message for toast (general errors only)
   * Returns null if error should be shown inline on a field
   */
  const getToastErrorMessage = (error: unknown): string | null => {
    // Don't show toast for field-specific errors (they show inline)
    if (isFieldError(error)) return null;

    const serverError = parseServerError(error);
    if (!serverError) return "An unexpected error occurred";

    return serverError.message || "An unexpected error occurred";
  };

  /**
   * Apply field errors to a reactive errors object
   */
  const applyFieldErrors = (
    error: unknown,
    errorsRef: Record<string, string>
  ): boolean => {
    const fieldErrors = mapServerErrorToFields(error);
    let hasFieldErrors = false;

    Object.entries(fieldErrors).forEach(([field, message]) => {
      if (field in errorsRef) {
        errorsRef[field] = message;
        hasFieldErrors = true;
      }
    });

    return hasFieldErrors;
  };

  /**
   * Clear all field errors in a reactive errors object
   */
  const clearFieldErrors = (errorsRef: Record<string, string>): void => {
    Object.keys(errorsRef).forEach((key) => {
      errorsRef[key] = "";
    });
  };

  return {
    parseServerError,
    mapServerErrorToFields,
    isFieldError,
    getToastErrorMessage,
    applyFieldErrors,
    clearFieldErrors,
  };
};
