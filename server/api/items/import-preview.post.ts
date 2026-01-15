import { parseImportFile } from "../../utils/file-parsers";
import {
  validateImportRows,
  findDuplicatesInFile,
  ERROR_MESSAGES,
} from "../../utils/item-import-validator";
import type { ImportPreview, ImportError, ImportRow } from "~~/shared/types/import";

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 1000;
const PREVIEW_ROWS = 10;

/**
 * POST /api/items/import-preview
 *
 * Parses the uploaded file and returns a preview of the data without inserting into the database.
 * Returns the first 10 rows, total count, column headers, and any validation warnings.
 */
export default defineEventHandler(async (event): Promise<ImportPreview> => {
  // Auth check - require Admin or Supervisor role
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      data: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
  }

  if (!["ADMIN", "SUPERVISOR"].includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "FORBIDDEN",
        message: "Only administrators and supervisors can preview import files",
      },
    });
  }

  // Parse multipart form data
  const form = await readMultipartFormData(event);
  const file = form?.find((f) => f.name === "file");

  if (!file?.data) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        code: "MISSING_FILE",
        message: "No file provided",
      },
    });
  }

  // Validate file size
  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({
      statusCode: 413,
      statusMessage: "Payload Too Large",
      data: {
        code: "FILE_TOO_LARGE",
        message: ERROR_MESSAGES.FILE_TOO_LARGE,
      },
    });
  }

  const fileName = file.filename || "import.xlsx";
  const mimeType = file.type;

  // Parse the file
  const parseResult = parseImportFile(file.data, fileName, mimeType);

  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        code: parseResult.errors[0]?.code || "INVALID_FILE_FORMAT",
        message: parseResult.errors[0]?.message || ERROR_MESSAGES.INVALID_FILE_FORMAT,
      },
    });
  }

  // Check row limit
  if (parseResult.totalRows > MAX_ROWS) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        code: "ROW_LIMIT_EXCEEDED",
        message: `File contains ${parseResult.totalRows} rows. Maximum allowed is ${MAX_ROWS} rows per import.`,
      },
    });
  }

  // Check for empty file
  if (parseResult.totalRows === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        code: "EMPTY_FILE",
        message: ERROR_MESSAGES.EMPTY_FILE,
      },
    });
  }

  // Get preview rows (first 10)
  const previewRows = parseResult.rows.slice(0, PREVIEW_ROWS);

  // Collect warnings for preview (but don't block)
  const warnings: ImportError[] = [];

  // Check for duplicates within preview rows (just warnings)
  const duplicateWarnings = findDuplicatesInFile(previewRows);
  warnings.push(...duplicateWarnings);

  // Validate preview rows (just warnings)
  const { errors: validationWarnings } = validateImportRows(previewRows);
  warnings.push(...validationWarnings);

  // Sort warnings by row number
  warnings.sort((a, b) => a.row - b.row);

  // Check for missing optional columns based on headers
  const normalizedHeaders = parseResult.headers.map((h) => h.toLowerCase().trim());
  const missingOptionalColumns: string[] = [];

  // Check if optional columns are present
  const categoryAliases = ["category", "cat", "item category"];
  const subCategoryAliases = [
    "sub_category",
    "subcategory",
    "sub category",
    "subcat",
    "item subcategory",
  ];

  if (!normalizedHeaders.some((h) => categoryAliases.includes(h))) {
    missingOptionalColumns.push("category");
  }
  if (!normalizedHeaders.some((h) => subCategoryAliases.includes(h))) {
    missingOptionalColumns.push("subcategory");
  }

  // Build preview response
  return {
    fileName,
    headers: parseResult.headers,
    rows: previewRows.map((row: ImportRow) => ({
      code: row.code || "",
      name: row.name || "",
      unit: row.unit || "",
      category: row.category || null,
      sub_category: row.sub_category || null,
    })),
    totalRows: parseResult.totalRows,
    previewCount: previewRows.length,
    missingColumns: missingOptionalColumns,
    warnings,
  };
});
