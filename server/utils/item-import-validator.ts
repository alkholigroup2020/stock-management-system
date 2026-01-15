import { z } from "zod";
import type {
  ImportRow,
  ImportError,
  ImportErrorCode,
  ValidatedImportRow,
} from "~~/shared/types/import";
import type { Unit } from "~~/shared/types/database";

/**
 * Valid unit values (matches Prisma enum)
 */
export const UnitSchema = z.enum(["KG", "EA", "LTR", "BOX", "CASE", "PACK"]);

/**
 * Single import row validation schema
 */
export const ImportRowSchema = z.object({
  code: z.string().trim().min(1, "Code is required").max(50, "Code must be 50 characters or less"),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or less"),
  unit: z.string().trim().toUpperCase(),
  category: z
    .string()
    .trim()
    .max(50, "Category must be 50 characters or less")
    .optional()
    .nullable()
    .transform((v) => v || null),
  sub_category: z
    .string()
    .trim()
    .max(50, "Subcategory must be 50 characters or less")
    .optional()
    .nullable()
    .transform((v) => v || null),
});

/**
 * Column header mappings for flexible matching
 */
export const COLUMN_MAPPINGS: Record<string, string[]> = {
  code: ["code", "item code", "itemcode", "item_code", "sku"],
  name: ["name", "item name", "itemname", "item_name", "description", "item description"],
  unit: ["unit", "uom", "unit of measure", "units"],
  category: ["category", "cat", "item category"],
  sub_category: ["sub_category", "subcategory", "sub category", "subcat", "item subcategory"],
};

export const REQUIRED_COLUMNS = ["code", "name", "unit"];
export const OPTIONAL_COLUMNS = ["category", "sub_category"];

/**
 * Human-readable error messages for each error code
 */
export const ERROR_MESSAGES: Record<ImportErrorCode, string> = {
  MISSING_REQUIRED_FIELD: "Required field is missing",
  INVALID_UNIT: "Invalid unit. Must be one of: KG, EA, LTR, BOX, CASE, PACK",
  CODE_TOO_LONG: "Code must be 50 characters or less",
  NAME_TOO_LONG: "Name must be 200 characters or less",
  CATEGORY_TOO_LONG: "Category must be 50 characters or less",
  DUPLICATE_CODE_IN_FILE: "Duplicate code found in import file",
  DUPLICATE_CODE_IN_DATABASE: "Item code already exists in database",
  INVALID_FILE_FORMAT:
    "Unable to parse file. Please ensure it is a valid Excel (.xlsx) or CSV file",
  FILE_TOO_LARGE: "File size exceeds maximum allowed (10MB)",
  ROW_LIMIT_EXCEEDED: "File exceeds maximum of 1000 rows per import",
  EMPTY_FILE: "No items to import. File contains only headers",
  MISSING_REQUIRED_COLUMNS: "Required columns not found",
};

/**
 * Validate a single import row
 */
export function validateImportRow(
  row: ImportRow,
  rowNumber: number
): { valid: true; data: ValidatedImportRow } | { valid: false; errors: ImportError[] } {
  const errors: ImportError[] = [];

  // Parse with Zod
  const parsed = ImportRowSchema.safeParse(row);

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      let code: ImportErrorCode = "MISSING_REQUIRED_FIELD";

      if (issue.message.includes("required")) {
        code = "MISSING_REQUIRED_FIELD";
      } else if (field === "code" && issue.message.includes("50")) {
        code = "CODE_TOO_LONG";
      } else if (field === "name" && issue.message.includes("200")) {
        code = "NAME_TOO_LONG";
      } else if (field === "category" && issue.message.includes("50")) {
        code = "CATEGORY_TOO_LONG";
      }

      errors.push({
        row: rowNumber,
        field,
        message: issue.message,
        code,
      });
    }

    return { valid: false, errors };
  }

  // Validate unit enum
  const unitResult = UnitSchema.safeParse(parsed.data.unit);
  if (!unitResult.success) {
    errors.push({
      row: rowNumber,
      field: "unit",
      message: ERROR_MESSAGES.INVALID_UNIT,
      code: "INVALID_UNIT",
    });
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      code: parsed.data.code,
      name: parsed.data.name,
      unit: unitResult.data as Unit,
      category: parsed.data.category,
      sub_category: parsed.data.sub_category,
      is_active: true,
    },
  };
}

/**
 * Validate all import rows and collect errors
 */
export function validateImportRows(rows: ImportRow[]): {
  validRows: ValidatedImportRow[];
  errors: ImportError[];
} {
  const validRows: ValidatedImportRow[] = [];
  const errors: ImportError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const rowNumber = i + 2; // 1-indexed, skip header row
    const result = validateImportRow(row, rowNumber);

    if (result.valid) {
      validRows.push(result.data);
    } else {
      errors.push(...result.errors);
    }
  }

  return { validRows, errors };
}

/**
 * Find duplicate codes within the import file
 */
export function findDuplicatesInFile(rows: ImportRow[]): ImportError[] {
  const errors: ImportError[] = [];
  const seenCodes = new Map<string, number>(); // code -> first row number

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const rowNumber = i + 2; // 1-indexed, skip header
    const code = row.code?.trim().toUpperCase();

    if (!code) continue;

    if (seenCodes.has(code)) {
      const firstRow = seenCodes.get(code);
      errors.push({
        row: rowNumber,
        field: "code",
        message: `Duplicate code '${row.code}' - first occurrence at row ${firstRow}`,
        code: "DUPLICATE_CODE_IN_FILE",
      });
    } else {
      seenCodes.set(code, rowNumber);
    }
  }

  return errors;
}
