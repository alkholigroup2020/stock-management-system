/**
 * Simple CSV parser that auto-detects delimiters
 * Replaces papaparse to avoid Rollup bundling issues
 */

export interface CSVParseResult {
  data: string[][];
  errors: Array<{ message: string }>;
}

/**
 * Detect the delimiter used in CSV content
 */
function detectDelimiter(content: string): string {
  const firstLine = content.split(/\r?\n/)[0] || "";

  // Count occurrences of common delimiters
  const delimiters = [",", ";", "\t", "|"];
  let maxCount = 0;
  let bestDelimiter = ",";

  for (const delimiter of delimiters) {
    // Count occurrences outside of quoted strings
    let count = 0;
    let inQuotes = false;

    for (const char of firstLine) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        count++;
      }
    }

    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
      i++;
      continue;
    }

    current += char;
    i++;
  }

  // Push the last field
  result.push(current);

  return result;
}

/**
 * Parse CSV content into a 2D array
 */
export function parseCSV(content: string, options?: { skipEmptyLines?: boolean }): CSVParseResult {
  const skipEmptyLines = options?.skipEmptyLines ?? true;

  try {
    // Normalize line endings and split
    const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

    // Detect delimiter
    const delimiter = detectDelimiter(content);

    // Parse each line
    const data: string[][] = [];

    for (const line of lines) {
      // Skip empty lines if requested
      if (skipEmptyLines && line.trim() === "") {
        continue;
      }

      const row = parseLine(line, delimiter);
      data.push(row);
    }

    return {
      data,
      errors: [],
    };
  } catch (error) {
    return {
      data: [],
      errors: [{ message: error instanceof Error ? error.message : "Failed to parse CSV" }],
    };
  }
}
