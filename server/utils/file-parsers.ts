import * as XLSX from "xlsx";
import { parseCSV } from "./csv-parser";
import type { ImportRow, ImportError } from "~~/shared/types/import";
import { COLUMN_MAPPINGS, REQUIRED_COLUMNS } from "./item-import-validator";

/**
 * Supported file types for import
 */
export type ImportFileType = "xlsx" | "csv" | "unknown";

/**
 * Result of parsing an import file
 */
export interface ParseResult {
  success: boolean;
  rows: ImportRow[];
  headers: string[];
  totalRows: number;
  errors: ImportError[];
}

/**
 * Detect file type from filename and MIME type
 */
export function detectFileType(filename: string, mimeType?: string): ImportFileType {
  const extension = filename.split(".").pop()?.toLowerCase();

  // Check by extension first
  if (extension === "xlsx" || extension === "xls") {
    return "xlsx";
  }
  if (extension === "csv") {
    return "csv";
  }

  // Fall back to MIME type
  if (mimeType) {
    if (
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel") ||
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return "xlsx";
    }
    if (mimeType === "text/csv" || mimeType === "text/plain") {
      return "csv";
    }
  }

  return "unknown";
}

/**
 * Map detected headers to normalized field names
 * Returns a mapping of normalized field name -> original header index
 */
export function mapHeaders(headers: string[]): {
  mapping: Record<string, number>;
  missingColumns: string[];
} {
  const mapping: Record<string, number> = {};
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  // For each field, find the matching header
  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    const headerIndex = normalizedHeaders.findIndex((h) => aliases.includes(h));
    if (headerIndex !== -1) {
      mapping[field] = headerIndex;
    }
  }

  // Check for missing required columns
  const missingColumns: string[] = [];
  for (const required of REQUIRED_COLUMNS) {
    if (!(required in mapping)) {
      missingColumns.push(required);
    }
  }

  return { mapping, missingColumns };
}

/**
 * Parse Excel file from buffer
 */
export function parseExcelFile(buffer: Buffer): ParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return {
        success: false,
        rows: [],
        headers: [],
        totalRows: 0,
        errors: [
          {
            row: 0,
            message: "Excel file contains no sheets",
            code: "INVALID_FILE_FORMAT",
          },
        ],
      };
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      return {
        success: false,
        rows: [],
        headers: [],
        totalRows: 0,
        errors: [
          {
            row: 0,
            message: "Excel sheet could not be read",
            code: "INVALID_FILE_FORMAT",
          },
        ],
      };
    }

    // Convert to array of arrays (including headers)
    const rawData: string[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    if (rawData.length === 0) {
      return {
        success: false,
        rows: [],
        headers: [],
        totalRows: 0,
        errors: [
          {
            row: 0,
            message: "Excel file is empty",
            code: "EMPTY_FILE",
          },
        ],
      };
    }

    // First row is headers
    const firstRow = rawData[0];
    if (!firstRow) {
      return {
        success: false,
        rows: [],
        headers: [],
        totalRows: 0,
        errors: [
          {
            row: 0,
            message: "Excel file has no header row",
            code: "EMPTY_FILE",
          },
        ],
      };
    }

    const headers = firstRow.map((h) => String(h || "").trim());
    const dataRows = rawData.slice(1).filter((row) => row.some((cell) => cell !== ""));

    // Map headers to field names
    const { mapping, missingColumns } = mapHeaders(headers);

    if (missingColumns.length > 0) {
      return {
        success: false,
        rows: [],
        headers,
        totalRows: dataRows.length,
        errors: [
          {
            row: 0,
            message: `Required columns not found: ${missingColumns.join(", ")}`,
            code: "MISSING_REQUIRED_COLUMNS",
          },
        ],
      };
    }

    // Safely get column indices
    const codeIdx = mapping.code;
    const nameIdx = mapping.name;
    const unitIdx = mapping.unit;
    const categoryIdx = mapping.category;
    const subCategoryIdx = mapping.sub_category;

    // Convert rows to ImportRow objects
    const rows: ImportRow[] = dataRows.map((rowData) => ({
      code: codeIdx !== undefined ? String(rowData[codeIdx] || "").trim() : "",
      name: nameIdx !== undefined ? String(rowData[nameIdx] || "").trim() : "",
      unit: unitIdx !== undefined ? String(rowData[unitIdx] || "").trim() : "",
      category:
        categoryIdx !== undefined ? String(rowData[categoryIdx] || "").trim() || null : null,
      sub_category:
        subCategoryIdx !== undefined ? String(rowData[subCategoryIdx] || "").trim() || null : null,
    }));

    return {
      success: true,
      rows,
      headers,
      totalRows: rows.length,
      errors: [],
    };
  } catch (error) {
    return {
      success: false,
      rows: [],
      headers: [],
      totalRows: 0,
      errors: [
        {
          row: 0,
          message: "Failed to parse Excel file. Please ensure it is a valid .xlsx file",
          code: "INVALID_FILE_FORMAT",
        },
      ],
    };
  }
}

/**
 * Parse CSV file from string
 */
export function parseCSVFile(content: string): ParseResult {
  try {
    // Parse CSV with custom parser (auto-detects delimiter)
    const result = parseCSV(content, {
      skipEmptyLines: true,
    });

    if (result.errors.length > 0) {
      return {
        success: false,
        rows: [],
        headers: [],
        totalRows: 0,
        errors: [
          {
            row: 0,
            message: `CSV parsing error: ${result.errors[0]?.message || "Unknown error"}`,
            code: "INVALID_FILE_FORMAT",
          },
        ],
      };
    }

    const rawData = result.data;

    if (rawData.length === 0) {
      return {
        success: false,
        rows: [],
        headers: [],
        totalRows: 0,
        errors: [
          {
            row: 0,
            message: "CSV file is empty",
            code: "EMPTY_FILE",
          },
        ],
      };
    }

    // First row is headers
    const firstRow = rawData[0];
    if (!firstRow) {
      return {
        success: false,
        rows: [],
        headers: [],
        totalRows: 0,
        errors: [
          {
            row: 0,
            message: "CSV file has no header row",
            code: "EMPTY_FILE",
          },
        ],
      };
    }

    const headers = firstRow.map((h) => String(h || "").trim());
    const dataRows = rawData.slice(1).filter((row) => row.some((cell) => cell !== ""));

    // Map headers to field names
    const { mapping, missingColumns } = mapHeaders(headers);

    if (missingColumns.length > 0) {
      return {
        success: false,
        rows: [],
        headers,
        totalRows: dataRows.length,
        errors: [
          {
            row: 0,
            message: `Required columns not found: ${missingColumns.join(", ")}`,
            code: "MISSING_REQUIRED_COLUMNS",
          },
        ],
      };
    }

    // Safely get column indices
    const codeIdx = mapping.code;
    const nameIdx = mapping.name;
    const unitIdx = mapping.unit;
    const categoryIdx = mapping.category;
    const subCategoryIdx = mapping.sub_category;

    // Convert rows to ImportRow objects
    const rows: ImportRow[] = dataRows.map((rowData) => ({
      code: codeIdx !== undefined ? String(rowData[codeIdx] || "").trim() : "",
      name: nameIdx !== undefined ? String(rowData[nameIdx] || "").trim() : "",
      unit: unitIdx !== undefined ? String(rowData[unitIdx] || "").trim() : "",
      category:
        categoryIdx !== undefined ? String(rowData[categoryIdx] || "").trim() || null : null,
      sub_category:
        subCategoryIdx !== undefined ? String(rowData[subCategoryIdx] || "").trim() || null : null,
    }));

    return {
      success: true,
      rows,
      headers,
      totalRows: rows.length,
      errors: [],
    };
  } catch (error) {
    return {
      success: false,
      rows: [],
      headers: [],
      totalRows: 0,
      errors: [
        {
          row: 0,
          message: "Failed to parse CSV file",
          code: "INVALID_FILE_FORMAT",
        },
      ],
    };
  }
}

/**
 * Parse import file based on detected type
 */
export function parseImportFile(buffer: Buffer, filename: string, mimeType?: string): ParseResult {
  const fileType = detectFileType(filename, mimeType);

  if (fileType === "unknown") {
    return {
      success: false,
      rows: [],
      headers: [],
      totalRows: 0,
      errors: [
        {
          row: 0,
          message: "Unsupported file format. Please use Excel (.xlsx) or CSV files",
          code: "INVALID_FILE_FORMAT",
        },
      ],
    };
  }

  if (fileType === "xlsx") {
    return parseExcelFile(buffer);
  }

  // CSV - convert buffer to string (UTF-8)
  const content = buffer.toString("utf-8");
  return parseCSVFile(content);
}
