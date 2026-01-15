# Data Model: Items Import via Excel/CSV

**Feature Branch**: `001-items-import`
**Date**: 2026-01-14
**Plan Reference**: [plan.md](./plan.md)

## Existing Entities (No Changes Required)

### Item

The import feature creates `Item` records using the existing Prisma model. No schema changes needed.

```prisma
model Item {
  id             String          @id @default(uuid()) @db.Uuid
  code           String          @unique @db.VarChar(50)
  name           String          @db.VarChar(200)
  unit           Unit
  category       String?         @db.VarChar(50)
  sub_category   String?         @db.VarChar(50)
  is_active      Boolean         @default(true)
  created_at     DateTime        @default(now()) @db.Timestamptz(6)
  updated_at     DateTime        @updatedAt @db.Timestamptz(6)
  // ... relations omitted
}

enum Unit {
  KG
  EA
  LTR
  BOX
  CASE
  PACK
}
```

**Field Constraints for Import**:

| Field        | Required  | Validation                    | Default |
| ------------ | --------- | ----------------------------- | ------- |
| code         | Yes       | Unique, max 50 chars, trimmed | -       |
| name         | Yes       | Max 200 chars, trimmed        | -       |
| unit         | Yes       | Must be valid Unit enum       | -       |
| category     | No        | Max 50 chars, trimmed         | null    |
| sub_category | No        | Max 50 chars, trimmed         | null    |
| is_active    | No (auto) | -                             | true    |

## New TypeScript Types (shared/types/import.ts)

### Import Request/Response Types

```typescript
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
 * Error details for a failed row
 */
export interface ImportError {
  row: number; // 1-indexed row number (matches spreadsheet)
  field?: string; // Field that failed validation (optional)
  message: string; // Human-readable error message
  code: ImportErrorCode; // Machine-readable error code
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
 * Import operation result
 */
export interface ImportResult {
  success: boolean;
  summary: ImportSummary;
  errors: ImportError[];
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
 * Preview data returned after file parsing
 */
export interface ImportPreview {
  headers: string[]; // Detected column headers
  rows: ImportRow[]; // First N rows of data
  totalRows: number; // Total rows in file
  hasRequiredColumns: boolean;
  missingColumns: string[];
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
```

### Zod Validation Schemas

```typescript
import { z } from "zod";

/**
 * Valid unit values (matches Prisma enum)
 */
export const UnitSchema = z.enum(["KG", "EA", "LTR", "BOX", "CASE", "PACK"]);

/**
 * Single import row validation
 */
export const ImportRowSchema = z.object({
  code: z.string().trim().min(1, "Code is required").max(50, "Code must be 50 characters or less"),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or less"),
  unit: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(
      UnitSchema.catch(() => {
        throw new Error("Invalid unit. Must be one of: KG, EA, LTR, BOX, CASE, PACK");
      })
    ),
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
 * Batch validation for entire import
 */
export const ImportBatchSchema = z.array(ImportRowSchema);
```

## Column Header Mapping

Flexible header matching to handle common variations:

```typescript
export const COLUMN_MAPPINGS: Record<string, string[]> = {
  code: ["code", "item code", "itemcode", "item_code", "sku"],
  name: ["name", "item name", "itemname", "item_name", "description", "item description"],
  unit: ["unit", "uom", "unit of measure", "units"],
  category: ["category", "cat", "item category"],
  sub_category: ["sub_category", "subcategory", "sub category", "subcat", "item subcategory"],
};

export const REQUIRED_COLUMNS = ["code", "name", "unit"];
export const OPTIONAL_COLUMNS = ["category", "sub_category"];
```

## State Transitions

Import is a one-shot operation with no state persistence. The workflow is:

```
[File Selected] → [Parsing] → [Preview] → [Validating] → [Importing] → [Complete]
     │                │           │            │              │
     ↓                ↓           ↓            ↓              ↓
  Error:           Error:      User:        Error:        Success:
  Invalid file     Parse fail  Cancel       Validation    Items created
```

## Database Operations

### Bulk Insert Strategy

```typescript
// Prisma transaction for atomic insert
await prisma.$transaction(
  validatedRows.map((row) =>
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
```

### Duplicate Check Query

```typescript
// Check for existing codes before insert
const existingCodes = await prisma.item.findMany({
  where: {
    code: { in: rowCodes },
  },
  select: { code: true },
});
```

## Template Structure

The downloadable template includes:

| Column      | Required | Description                     | Example        |
| ----------- | -------- | ------------------------------- | -------------- |
| Code        | Yes      | Unique item identifier          | ITEM-001       |
| Name        | Yes      | Item display name               | Fresh Tomatoes |
| Unit        | Yes      | KG, EA, LTR, BOX, CASE, or PACK | KG             |
| Category    | No       | Item category for grouping      | Produce        |
| Subcategory | No       | Further classification          | Vegetables     |

Sample data rows in template:

```
ITEM-001, Fresh Tomatoes, KG, Produce, Vegetables
ITEM-002, Dish Soap, EA, Cleaning, Chemicals
ITEM-003, Olive Oil, LTR, Pantry, Oils
```
