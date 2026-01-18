# Quickstart: POB Print Report

**Feature**: 001-bop-print-report
**Date**: 2026-01-18

## Overview

This guide provides a quick implementation reference for adding a print report button to the POB (Personnel On Board) page.

---

## Implementation Checklist

### 1. Create Print Report Component

**File**: `app/components/pob/POBPrintReport.vue`

```vue
<script setup lang="ts">
import { formatDate } from "~/utils/format";

interface POBEntry {
  id?: string;
  date: string;
  crew_count: number;
  extra_count: number;
  total_count: number;
}

interface Props {
  location: {
    id: string;
    code: string;
    name: string;
  };
  period: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  };
  entries: Map<string, POBEntry>;
  summary: {
    total_crew_count: number;
    total_extra_count: number;
    total_mandays: number;
    entries_count: number;
  };
  companyName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  companyName: "Stock Management System",
});

const sortedDates = computed(() => Array.from(props.entries.keys()).sort());

const formattedDateRange = computed(() => {
  const start = formatDate(props.period.start_date);
  const end = formatDate(props.period.end_date);
  return `${start} - ${end}`;
});
</script>

<template>
  <div class="print-report hidden print:block">
    <!-- Header -->
    <header class="print-header text-center mb-6">
      <h1 class="text-xl font-bold">{{ companyName }}</h1>
      <h2 class="text-lg font-semibold mt-2">Personnel On Board Report</h2>
      <div class="mt-4 text-sm">
        <p><strong>Location:</strong> {{ location.name }} ({{ location.code }})</p>
        <p><strong>Period:</strong> {{ period.name }}</p>
        <p><strong>Date Range:</strong> {{ formattedDateRange }}</p>
        <p class="mt-2 text-lg"><strong>Total Mandays:</strong> {{ summary.total_mandays.toLocaleString() }}</p>
      </div>
    </header>

    <!-- Entries Table -->
    <table class="print-table w-full border-collapse text-sm">
      <thead>
        <tr class="border-b-2 border-black">
          <th class="py-2 text-left">Date</th>
          <th class="py-2 text-center">Mandays</th>
          <th class="py-2 text-center">Visitor Meals</th>
          <th class="py-2 text-center">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="dateStr in sortedDates" :key="dateStr" class="border-b border-gray-300">
          <td class="py-1">{{ formatDate(dateStr) }}</td>
          <td class="py-1 text-center">{{ entries.get(dateStr)!.crew_count }}</td>
          <td class="py-1 text-center">{{ entries.get(dateStr)!.extra_count }}</td>
          <td class="py-1 text-center font-medium">{{ entries.get(dateStr)!.total_count }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="border-t-2 border-black font-bold">
          <td class="py-2">TOTAL</td>
          <td class="py-2 text-center">{{ summary.total_crew_count.toLocaleString() }}</td>
          <td class="py-2 text-center">{{ summary.total_extra_count.toLocaleString() }}</td>
          <td class="py-2 text-center">{{ summary.total_mandays.toLocaleString() }}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Signature Blocks -->
    <div class="print-signatures flex justify-between gap-8 mt-16">
      <div class="flex-1 text-center">
        <p class="text-sm font-medium mb-12">Operator Signature</p>
        <div class="border-t border-black pt-2">
          <p class="text-xs">Date: _______________</p>
        </div>
      </div>
      <div class="flex-1 text-center">
        <p class="text-sm font-medium mb-12">Manager Signature</p>
        <div class="border-t border-black pt-2">
          <p class="text-xs">Date: _______________</p>
        </div>
      </div>
      <div class="flex-1 text-center">
        <p class="text-sm font-medium mb-12">Client Signature</p>
        <div class="border-t border-black pt-2">
          <p class="text-xs">Date: _______________</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="print-footer mt-8 text-center text-xs text-gray-500">
      <p>Generated on {{ new Date().toLocaleDateString() }}</p>
    </footer>
  </div>
</template>
```

---

### 2. Add Print Styles to main.css

**File**: `app/assets/css/main.css`

```css
/* Print Styles for POB Report */
@media print {
  /* Hide everything except print content */
  body * {
    visibility: hidden;
  }

  .print-report,
  .print-report * {
    visibility: visible;
  }

  .print-report {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }

  /* A4 page setup */
  @page {
    size: A4;
    margin: 15mm;
  }

  /* Pagination control */
  .print-header {
    break-after: avoid;
  }

  .print-table tr {
    break-inside: avoid;
  }

  .print-signatures {
    break-before: avoid;
  }

  /* Force print backgrounds */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
```

---

### 3. Add Print Button to POB Page

**File**: `app/pages/pob.vue`

Add to the page header (after the title section):

```vue
<UButton
  icon="i-lucide-printer"
  color="primary"
  variant="soft"
  class="cursor-pointer"
  :disabled="loading || !pobData?.summary || editableEntries.size === 0"
  @click="handlePrint"
>
  Print Report
</UButton>
```

Add the print handler function:

```typescript
function handlePrint() {
  window.print();
}
```

Add the print component at the end of the template:

```vue
<!-- Print Report (hidden on screen, visible on print) -->
<PobPOBPrintReport
  v-if="pobData && pobData.summary && editableEntries.size > 0"
  :location="pobData.location || locationStore.activeLocation"
  :period="currentPeriod"
  :entries="editableEntries"
  :summary="pobData.summary"
/>
```

---

## Testing

### Manual Testing Steps

1. Navigate to POB page with data loaded
2. Verify print button is enabled
3. Click "Print Report"
4. Verify print preview shows:
   - Header with location, period, mandays
   - Table with all daily entries
   - Three signature blocks at bottom
5. Print to PDF and verify A4 layout

### Edge Cases to Test

- [ ] Print button disabled when no data
- [ ] Print button disabled during loading
- [ ] Long location names truncate gracefully
- [ ] Multi-page reports paginate correctly

---

## Key Files

| File | Purpose |
|------|---------|
| `app/components/pob/POBPrintReport.vue` | Print-optimized report layout |
| `app/pages/pob.vue` | Parent page with print button |
| `app/assets/css/main.css` | Print media query styles |

---

## Constitution Compliance

- [x] TypeScript interfaces for all props
- [x] `cursor-pointer` on print button
- [x] Button disabled when no data (offline-aware pattern)
- [x] Uses existing location/period context
- [x] No `any` types
