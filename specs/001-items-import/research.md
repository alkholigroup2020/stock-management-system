# Research: Items Import via Excel/CSV

**Feature Branch**: `001-items-import`
**Date**: 2026-01-14
**Plan Reference**: [plan.md](./plan.md)

## Research Topics

### 1. Excel (.xlsx) Parsing Library

**Decision**: Use **xlsx** (SheetJS)

**Rationale**:
- Most popular and battle-tested Excel parsing library for Node.js
- Built-in TypeScript support with exported types
- Supports XLSX, XLS, CSV, and many other formats
- Can run in both browser and Node.js (useful for client-side preview)
- Excellent performance for files under 1000 rows (our limit)
- Active maintenance with regular updates

**Alternatives Considered**:

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| ExcelJS | Streaming support, style handling | Heavier, more complex API | Too much for read-only import |
| node-xlsx | TypeScript built-in, simple API | Wrapper around xlsx anyway | Extra dependency layer |
| read-excel-file | Simple API, schema support | Performance issues with large files | Risk for edge cases |

**Implementation Notes**:
- Use `XLSX.read(buffer, { type: 'buffer' })` for server-side parsing
- Extract first sheet only: `workbook.Sheets[workbook.SheetNames[0]]`
- Convert to JSON: `XLSX.utils.sheet_to_json(sheet, { header: 1 })`

### 2. CSV Parsing Library

**Decision**: Use **papaparse**

**Rationale**:
- Extremely fast, especially for quoted CSVs
- Works in both browser and Node.js
- Automatic delimiter detection (handles comma and semicolon per FR-013)
- Handles malformed input gracefully
- Built-in streaming support for large files
- Well-documented with TypeScript types (`@types/papaparse`)

**Alternatives Considered**:

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| csv-parse | Native Node.js streams | Server-only, more complex | Browser preview needed |
| csv-parser | Fast on unquoted CSVs | Server-only, less flexible | Browser preview needed |
| fast-csv | Good streaming | Less auto-detection | Manual delimiter config |

**Implementation Notes**:
- Use `Papa.parse(file, { header: true, skipEmptyLines: true })`
- Enable `dynamicTyping: false` to keep all values as strings (Zod handles conversion)
- Set `delimiter: ''` for auto-detection (comma, semicolon, tab)
- Set `encoding: 'UTF-8'` explicitly

### 3. File Upload Handling in Nuxt 4

**Decision**: Use native File API with `FormData` for upload, parse on server

**Rationale**:
- Nuxt 4 supports `multipart/form-data` via `readMultipartFormData()` in H3
- Server-side parsing ensures security (no malicious file execution)
- File size validation happens before parsing
- Consistent error handling in one location

**Implementation Pattern**:
```typescript
// Client: Send file via FormData
const formData = new FormData();
formData.append('file', selectedFile);
await $fetch('/api/items/import', { method: 'POST', body: formData });

// Server: Receive and parse
const form = await readMultipartFormData(event);
const file = form?.find(f => f.name === 'file');
const buffer = file?.data;
```

### 4. Zod Validation Schema for Import Rows

**Decision**: Define strict schema with transforms for data cleaning

**Rationale**:
- FR-014 requires whitespace trimming → Zod transforms handle this
- FR-004 requires Unit enum validation → Zod enum type
- FR-003 requires Code, Name, Unit columns → Zod required fields
- Clear error messages for each validation failure

**Schema Design**:
```typescript
import { z } from 'zod';

const UnitEnum = z.enum(['KG', 'EA', 'LTR', 'BOX', 'CASE', 'PACK']);

export const ImportRowSchema = z.object({
  code: z.string().trim().min(1, 'Code is required').max(50),
  name: z.string().trim().min(1, 'Name is required').max(200),
  unit: z.string().trim().toUpperCase().pipe(UnitEnum),
  category: z.string().trim().max(50).optional().nullable(),
  sub_category: z.string().trim().max(50).optional().nullable(),
});
```

### 5. Partial Import Strategy

**Decision**: Process all rows, collect errors, commit valid rows in transaction

**Rationale**:
- FR-008 requires summary of successes and failures
- FR-009 requires specific error messages per row
- Users expect partial success rather than all-or-nothing
- Transaction ensures atomicity of successful imports

**Implementation Pattern**:
1. Parse entire file into rows array
2. Validate each row with Zod, collect errors with row numbers
3. Check for duplicate codes within file (FR-006)
4. Check for existing codes in database (FR-005)
5. Insert valid rows in single Prisma transaction
6. Return summary with success count and error details

### 6. Template File Generation

**Decision**: Generate template dynamically on server with xlsx library

**Rationale**:
- Ensures template always matches current schema
- Can include sample data rows
- Supports both .xlsx and .csv download formats
- No static file maintenance needed

**Template Structure**:
```
| Code      | Name           | Unit | Category    | Subcategory   |
|-----------|----------------|------|-------------|---------------|
| ITEM-001  | Sample Item 1  | KG   | Produce     | Vegetables    |
| ITEM-002  | Sample Item 2  | EA   | Supplies    | Cleaning      |
```

### 7. Column Header Matching

**Decision**: Case-insensitive matching with common variations

**Rationale**:
- Users may have headers in different cases (CODE, Code, code)
- Excel sometimes auto-capitalizes headers
- Flexibility reduces import errors

**Mapping Table**:
| Expected | Also Accept |
|----------|-------------|
| code | Code, CODE, Item Code, ItemCode |
| name | Name, NAME, Item Name, ItemName, Description |
| unit | Unit, UNIT, UOM, Unit of Measure |
| category | Category, CATEGORY, Cat |
| sub_category | Subcategory, Sub_Category, SubCategory, Sub Category |

### 8. Error Message Format

**Decision**: Structured error objects with row numbers

**Format**:
```typescript
interface ImportError {
  row: number;        // 1-indexed (matches spreadsheet)
  field?: string;     // Which field failed (if applicable)
  message: string;    // Human-readable error
  code: string;       // Machine-readable error code
}
```

**Error Codes**:
- `MISSING_REQUIRED_FIELD` - Required column empty
- `INVALID_UNIT` - Unit not in allowed list
- `DUPLICATE_CODE_IN_FILE` - Same code appears twice in import
- `DUPLICATE_CODE_IN_DATABASE` - Code already exists
- `INVALID_FORMAT` - Data format issue
- `ROW_LIMIT_EXCEEDED` - File has too many rows

## Dependencies to Add

```json
{
  "dependencies": {
    "xlsx": "^0.18.5",
    "papaparse": "^5.4.1"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.14"
  }
}
```

## Security Considerations

1. **File Type Validation**: Check MIME type AND file extension server-side
2. **File Size Limit**: 10MB max enforced before parsing
3. **Row Limit**: 1000 rows max (FR-012) prevents DoS
4. **No Formula Execution**: xlsx library doesn't execute formulas by default
5. **Sanitize String Values**: Trim whitespace, escape special characters

## Performance Estimates

| Operation | Expected Time (1000 rows) |
|-----------|--------------------------|
| File upload | < 2 seconds |
| Excel parsing | < 1 second |
| CSV parsing | < 0.5 seconds |
| Validation | < 1 second |
| Database insert (batch) | < 3 seconds |
| **Total** | **< 8 seconds** |

This meets SC-001 (100 items in under 30 seconds) with significant margin.
