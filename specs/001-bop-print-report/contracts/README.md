# API Contracts: POB Print Report

**Feature**: 001-bop-print-report
**Date**: 2026-01-18

## No New Contracts Required

This feature is a **client-side enhancement** that does not require any new API endpoints.

### Existing API Used

The print report component consumes data from the existing POB API:

```
GET /api/locations/{locationId}/pob
```

**Response Structure** (existing):
```typescript
interface POBData {
  location?: {
    id: string;
    code: string;
    name: string;
  };
  period?: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  entries: POBEntry[];
  summary?: {
    total_crew_count: number;
    total_extra_count: number;
    total_mandays: number;
    entries_count: number;
  };
}
```

### Why No New Endpoints

1. **Print is client-side** - Uses `window.print()` with CSS media queries
2. **Data already available** - POB page already fetches all required data
3. **No PDF generation** - Browser handles print-to-PDF natively
4. **No server-side rendering** - SPA architecture, print layout in Vue component

### Future Consideration

If PDF generation server-side is needed in the future, a new endpoint could be added:

```
GET /api/locations/{locationId}/pob/report.pdf
```

This is **out of scope** for the current feature as per the spec's Success Criteria (SC-005): "Users can successfully print the report using standard browser print functionality without requiring additional software or plugins."
