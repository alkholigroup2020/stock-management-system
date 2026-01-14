# Quickstart: Items Import via Excel/CSV

**Feature Branch**: `001-items-import`
**Date**: 2026-01-14

## Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL database connected (via Supabase)
- Development server running (`pnpm dev`)

## Setup

### 1. Install Dependencies

```bash
pnpm add xlsx papaparse
pnpm add -D @types/papaparse
```

### 2. Create Type Definitions

Create `shared/types/import.ts`:

```typescript
import type { Unit } from "./database";

export interface ImportRow {
  code: string;
  name: string;
  unit: string;
  category?: string | null;
  sub_category?: string | null;
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  code: ImportErrorCode;
}

export type ImportErrorCode =
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_UNIT"
  | "DUPLICATE_CODE_IN_FILE"
  | "DUPLICATE_CODE_IN_DATABASE"
  | "INVALID_FILE_FORMAT"
  | "ROW_LIMIT_EXCEEDED"
  | "MISSING_REQUIRED_COLUMNS";

export interface ImportResult {
  success: boolean;
  summary: ImportSummary;
  errors: ImportError[];
}

export interface ImportSummary {
  totalRows: number;
  successCount: number;
  errorCount: number;
  fileName: string;
  importedAt: string;
}
```

### 3. Create Server Utilities

Create `server/utils/item-import-validator.ts`:

```typescript
import { z } from "zod";

export const UnitSchema = z.enum(["KG", "EA", "LTR", "BOX", "CASE", "PACK"]);

export const ImportRowSchema = z.object({
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(200),
  unit: z.string().trim().toUpperCase().pipe(UnitSchema),
  category: z.string().trim().max(50).optional().nullable().transform((v) => v || null),
  sub_category: z.string().trim().max(50).optional().nullable().transform((v) => v || null),
});
```

### 4. Create API Route

Create `server/api/items/import.post.ts`:

```typescript
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { ImportRowSchema } from "~/server/utils/item-import-validator";
import type { ImportResult, ImportError } from "~~/shared/types/import";

export default defineEventHandler(async (event) => {
  // Auth check
  const user = event.context.user;
  if (!user || !["ADMIN", "SUPERVISOR"].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  // Parse multipart form
  const form = await readMultipartFormData(event);
  const file = form?.find((f) => f.name === "file");

  if (!file?.data) {
    throw createError({ statusCode: 400, statusMessage: "No file provided" });
  }

  // Parse file based on type
  const fileName = file.filename || "import.xlsx";
  const isCSV = fileName.endsWith(".csv");

  let rows: Record<string, unknown>[];
  if (isCSV) {
    const text = file.data.toString("utf-8");
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    rows = result.data as Record<string, unknown>[];
  } else {
    const workbook = XLSX.read(file.data, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet);
  }

  // Validate and import...
  // (Full implementation in tasks)

  return {
    success: true,
    summary: { /* ... */ },
    errors: [],
  } satisfies ImportResult;
});
```

### 5. Create Import Dialog Component

Create `app/components/items/ImportDialog.vue`:

```vue
<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-upload" class="w-5 h-5" />
            <span class="font-semibold">Import Items</span>
          </div>
        </template>

        <div class="space-y-4">
          <UFormField label="Select File">
            <input
              type="file"
              accept=".xlsx,.csv"
              class="w-full"
              @change="onFileSelect"
            />
          </UFormField>

          <p class="text-sm text-[var(--ui-text-muted)]">
            Accepted formats: Excel (.xlsx) or CSV
          </p>
        </div>

        <template #footer>
          <div class="flex justify-between">
            <UButton
              variant="ghost"
              class="cursor-pointer"
              @click="downloadTemplate"
            >
              Download Template
            </UButton>
            <div class="flex gap-2">
              <UButton
                variant="outline"
                class="cursor-pointer"
                @click="isOpen = false"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                :disabled="!selectedFile || !isOnline"
                :loading="importing"
                class="cursor-pointer"
                @click="handleImport"
              >
                Import
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>("open", { default: false });
const { isOnline } = useOnlineStatus();

const selectedFile = ref<File | null>(null);
const importing = ref(false);

function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  selectedFile.value = input.files?.[0] || null;
}

async function handleImport() {
  if (!selectedFile.value) return;

  importing.value = true;
  try {
    const formData = new FormData();
    formData.append("file", selectedFile.value);

    const result = await $fetch("/api/items/import", {
      method: "POST",
      body: formData,
    });

    // Handle result...
  } finally {
    importing.value = false;
  }
}

async function downloadTemplate() {
  window.open("/api/items/import-template?format=xlsx", "_blank");
}
</script>
```

### 6. Add Import Button to Items Page

Update `app/pages/items/index.vue`:

```vue
<!-- Add after Create Item button -->
<UButton
  v-if="canEditItems()"
  color="neutral"
  variant="outline"
  icon="i-lucide-upload"
  class="cursor-pointer"
  :disabled="!isOnline"
  @click="showImportDialog = true"
>
  Import
</UButton>

<!-- Add dialog at bottom of template -->
<ItemsImportDialog v-model:open="showImportDialog" @success="fetchItems" />
```

## Testing

### Manual Test Flow

1. Navigate to Items page (`/items`)
2. Click "Import" button
3. Download template via "Download Template" link
4. Fill template with test data
5. Upload file and verify preview
6. Confirm import
7. Verify items appear in list

### Test Cases

| Test | Input | Expected |
|------|-------|----------|
| Valid Excel import | 10 valid rows | All 10 items created |
| Valid CSV import | 10 valid rows | All 10 items created |
| Invalid unit | Row with "GALLONS" | Row fails, others succeed |
| Duplicate code | Existing code in file | Row fails with specific error |
| Empty file | Headers only | Error: "No items to import" |
| Too many rows | 1500 rows | Error: "Maximum 1000 rows" |

## File Structure

```
app/
├── components/items/
│   ├── ImportDialog.vue
│   ├── ImportPreview.vue
│   └── ImportResults.vue
├── composables/
│   └── useItemsImport.ts
└── pages/items/index.vue (modified)

server/
├── api/items/
│   ├── import.post.ts
│   └── import-template.get.ts
└── utils/
    └── item-import-validator.ts

shared/types/
└── import.ts
```

## Common Issues

### File parsing fails
- Check file is not corrupted
- Ensure correct file extension (.xlsx or .csv)
- Verify file is not password protected

### Column not recognized
- Check column header spelling (case-insensitive)
- Remove extra spaces from headers
- See `COLUMN_MAPPINGS` in data-model.md for accepted variants

### Import button disabled
- Check online status (PWA offline mode)
- Verify user has item edit permission (Admin/Supervisor)
