import type { Unit } from "./database";

/**
 * Single row from parsed import file
 */
export interface ImportRow {
  code: string;
  name: string;
  unit: string;
  category?: string | null;
  sub_category?: string | null;
}

/**
 * Validated row ready for database insert
 */
export interface ValidatedImportRow {
  code: string;
  name: string;
  unit: Unit;
  category: string | null;
  sub_category: string | null;
  is_active: true;
}

/**
 * Error codes for import failures
 */
export type ImportErrorCode =
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_UNIT"
  | "CODE_TOO_LONG"
  | "NAME_TOO_LONG"
  | "CATEGORY_TOO_LONG"
  | "DUPLICATE_CODE_IN_FILE"
  | "DUPLICATE_CODE_IN_DATABASE"
  | "INVALID_FILE_FORMAT"
  | "FILE_TOO_LARGE"
  | "ROW_LIMIT_EXCEEDED"
  | "EMPTY_FILE"
  | "MISSING_REQUIRED_COLUMNS";

/**
 * Error details for a failed row
 */
export interface ImportError {
  row: number; // 1-indexed row number (matches spreadsheet)
  field?: string; // Field that failed validation (optional)
  message: string; // Human-readable error message
  code: ImportErrorCode; // Machine-readable error code
}

/**
 * Summary statistics for import
 */
export interface ImportSummary {
  totalRows: number; // Total rows in file (excluding header)
  successCount: number; // Successfully imported items
  errorCount: number; // Failed rows
  fileName: string; // Original filename
  importedAt: string; // ISO timestamp
}

/**
 * Import operation result
 */
export interface ImportResult {
  success: boolean;
  summary: ImportSummary;
  errors: ImportError[];
}

/**
 * Preview data returned after file parsing
 */
export interface ImportPreview {
  fileName: string; // Original filename
  headers: string[]; // Detected column headers
  rows: ImportRow[]; // First N rows of data (preview)
  totalRows: number; // Total rows in file
  previewCount: number; // Number of rows in preview
  missingColumns: string[]; // Optional columns not found
  warnings?: ImportError[]; // Validation warnings for preview rows
}

/**
 * Template column definition
 */
export interface TemplateColumn {
  header: string;
  required: boolean;
  description: string;
  example: string;
}
