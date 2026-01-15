import { parseImportFile } from "../../utils/file-parsers";
import {
  validateImportRows,
  findDuplicatesInFile,
  ERROR_MESSAGES,
} from "../../utils/item-import-validator";
import prisma from "../../utils/prisma";
import type {
  ImportResult,
  ImportError,
  ImportRow,
  ValidatedImportRow,
} from "~~/shared/types/import";

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 1000;

export default defineEventHandler(async (event): Promise<ImportResult> => {
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
        message: "Only administrators and supervisors can import items",
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

  const allErrors: ImportError[] = [];

  // Check for duplicate codes within the file
  const duplicateErrors = findDuplicatesInFile(parseResult.rows);
  allErrors.push(...duplicateErrors);

  // Filter rows that don't have duplicate codes (keep first occurrence)
  const seenCodes = new Set<string>();
  const rowsToValidate = parseResult.rows.filter((row: ImportRow) => {
    const code = row.code?.trim().toUpperCase();
    if (!code || seenCodes.has(code)) {
      return false;
    }
    seenCodes.add(code);
    return true;
  });

  // Validate rows with Zod
  const { validRows, errors: validationErrors } = validateImportRows(rowsToValidate);
  allErrors.push(...validationErrors);

  // Check for existing codes in database
  if (validRows.length > 0) {
    const codesToCheck = validRows.map((r: ValidatedImportRow) => r.code);
    const existingItems = await prisma.item.findMany({
      where: {
        code: { in: codesToCheck },
      },
      select: { code: true },
    });

    const existingCodes = new Set(existingItems.map((i: { code: string }) => i.code.toUpperCase()));

    // Filter out rows with existing codes and add errors
    const rowsToInsert = validRows.filter((row: ValidatedImportRow) => {
      if (existingCodes.has(row.code.toUpperCase())) {
        // Find the original row number
        const originalIndex = parseResult.rows.findIndex(
          (r: ImportRow) => r.code?.trim().toUpperCase() === row.code.toUpperCase()
        );
        allErrors.push({
          row: originalIndex + 2, // 1-indexed, skip header
          field: "code",
          message: `Item code '${row.code}' already exists in database`,
          code: "DUPLICATE_CODE_IN_DATABASE",
        });
        return false;
      }
      return true;
    });

    // Bulk insert valid rows using transaction
    if (rowsToInsert.length > 0) {
      await prisma.$transaction(
        rowsToInsert.map((row: ValidatedImportRow) =>
          prisma.item.create({
            data: {
              code: row.code,
              name: row.name,
              unit: row.unit,
              category: row.category,
              sub_category: row.sub_category,
              is_active: true,
            },
          })
        )
      );
    }

    // Sort errors by row number
    allErrors.sort((a, b) => a.row - b.row);

    const successCount = rowsToInsert.length;

    // Log the import operation
    console.log(
      `[Items Import] User ${user.username} imported ${successCount}/${parseResult.totalRows} items from ${fileName}`
    );

    return {
      success: successCount > 0,
      summary: {
        totalRows: parseResult.totalRows,
        successCount,
        errorCount: allErrors.length,
        fileName,
        importedAt: new Date().toISOString(),
      },
      errors: allErrors,
    };
  }

  // No valid rows to insert
  return {
    success: false,
    summary: {
      totalRows: parseResult.totalRows,
      successCount: 0,
      errorCount: allErrors.length,
      fileName,
      importedAt: new Date().toISOString(),
    },
    errors: allErrors,
  };
});
