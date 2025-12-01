/**
 * CSV Export Utility Functions
 *
 * Provides functions to generate and download CSV files from data arrays.
 * Handles proper escaping of values and special characters.
 */

/**
 * Column definition for CSV export
 */
export interface CsvColumn<T> {
  /** Header text to display in CSV */
  header: string;
  /** Key to access data from row object */
  accessor: keyof T | ((row: T) => string | number | null | undefined);
  /** Optional formatter function */
  format?: (value: unknown) => string;
}

/**
 * Escape a value for CSV format
 * @param value - The value to escape
 * @returns Escaped string safe for CSV
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If the value contains commas, quotes, or newlines, wrap in quotes and escape existing quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Generate CSV content from data array
 * @param data - Array of data objects
 * @param columns - Column definitions
 * @returns CSV string content
 */
export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: CsvColumn<T>[]
): string {
  // Generate header row
  const headerRow = columns.map((col) => escapeCSVValue(col.header)).join(",");

  // Generate data rows
  const dataRows = data.map((row) => {
    return columns
      .map((col) => {
        // Get raw value
        let value: unknown;
        if (typeof col.accessor === "function") {
          value = col.accessor(row);
        } else {
          value = row[col.accessor];
        }

        // Apply formatter if provided
        if (col.format) {
          value = col.format(value);
        }

        return escapeCSVValue(value);
      })
      .join(",");
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join("\n");
}

/**
 * Generate CSV content from simple array with headers
 * @param headers - Array of header strings
 * @param rows - Array of row arrays
 * @returns CSV string content
 */
export function generateSimpleCSV(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string {
  const headerRow = headers.map((h) => escapeCSVValue(h)).join(",");

  const dataRows = rows.map((row) => {
    return row.map((cell) => escapeCSVValue(cell)).join(",");
  });

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Trigger a download of CSV content
 * @param csvContent - The CSV string content
 * @param filename - The filename for the download (without extension)
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Generate and download CSV in one step
 * @param data - Array of data objects
 * @param columns - Column definitions
 * @param filename - The filename for the download (without extension)
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: CsvColumn<T>[],
  filename: string
): void {
  const csvContent = generateCSV(data, columns);
  downloadCSV(csvContent, filename);
}

/**
 * Format a date for CSV export (ISO format)
 * @param date - Date to format
 * @returns ISO date string or empty string
 */
export function formatDateForCSV(date: Date | string | null | undefined): string {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) return "";

  return d.toISOString().split("T")[0] || "";
}

/**
 * Format a datetime for CSV export
 * @param date - Date to format
 * @returns ISO datetime string or empty string
 */
export function formatDateTimeForCSV(date: Date | string | null | undefined): string {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) return "";

  return d.toISOString();
}

/**
 * Format a number for CSV export
 * @param num - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 */
export function formatNumberForCSV(
  num: number | string | null | undefined,
  decimals: number = 2
): string {
  if (num === null || num === undefined || num === "") return "";

  const numValue = typeof num === "string" ? parseFloat(num) : num;

  if (isNaN(numValue)) return "";

  return numValue.toFixed(decimals);
}

/**
 * Format currency for CSV export (just the number, no symbol)
 * @param amount - Amount to format
 * @returns Formatted currency number string
 */
export function formatCurrencyForCSV(amount: number | string | null | undefined): string {
  return formatNumberForCSV(amount, 2);
}
