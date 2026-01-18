# Data Model: POB Print Report

**Feature**: 001-bop-print-report
**Date**: 2026-01-18
**Status**: Complete

## Overview

This feature is read-only and uses existing data structures from the POB page. No new database entities or API contracts are required. This document defines the TypeScript interfaces for the print report component props.

---

## Existing Entities (Reference)

These entities already exist in the codebase and are documented for reference.

### POBEntry

Represents a single day's personnel count.

| Field       | Type    | Description                            |
| ----------- | ------- | -------------------------------------- |
| id          | string? | Database ID (optional for new entries) |
| date        | string  | ISO date string (YYYY-MM-DD)           |
| crew_count  | number  | Number of crew members (mandays)       |
| extra_count | number  | Number of visitor meals                |
| total_count | number  | Sum of crew_count + extra_count        |
| enterer     | object? | User who entered the data              |
| entered_at  | string? | ISO timestamp of entry                 |
| updated_at  | string? | ISO timestamp of last update           |

### POBSummary

Aggregated totals for the period.

| Field             | Type   | Description                  |
| ----------------- | ------ | ---------------------------- |
| total_crew_count  | number | Sum of all crew counts       |
| total_extra_count | number | Sum of all visitor meals     |
| total_mandays     | number | Total mandays (crew + extra) |
| entries_count     | number | Number of days with entries  |

### Period

The accounting period context.

| Field      | Type   | Description                                |
| ---------- | ------ | ------------------------------------------ |
| id         | string | Database ID                                |
| name       | string | Period display name (e.g., "January 2026") |
| start_date | string | ISO date string                            |
| end_date   | string | ISO date string                            |
| status     | string | "OPEN" or "CLOSED"                         |

### Location

The site/location context.

| Field | Type   | Description         |
| ----- | ------ | ------------------- |
| id    | string | Database ID         |
| code  | string | Short location code |
| name  | string | Full location name  |

---

## New Component Interface

### POBPrintReportProps

Props interface for the new `POBPrintReport.vue` component.

```typescript
interface POBPrintReportProps {
  /** Location information */
  location: {
    id: string;
    code: string;
    name: string;
  };

  /** Period information */
  period: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
  };

  /** Map of date strings to POB entries */
  entries: Map<string, POBEntry>;

  /** Aggregated summary data */
  summary: {
    total_crew_count: number;
    total_extra_count: number;
    total_mandays: number;
    entries_count: number;
  };

  /** Optional company name for report header */
  companyName?: string;

  /** Optional report title override */
  reportTitle?: string;
}
```

### SignatureBlock

Internal interface for signature block rendering.

```typescript
interface SignatureBlock {
  /** Label displayed above signature line */
  label: string;
  /** Whether to show date field (default: true) */
  showDate?: boolean;
}
```

Default signature blocks:

1. `{ label: "Operator Signature", showDate: true }`
2. `{ label: "Manager Signature", showDate: true }`
3. `{ label: "Client Signature", showDate: true }`

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         pob.vue (Page)                          │
├─────────────────────────────────────────────────────────────────┤
│  - Fetches POB data via API                                     │
│  - Manages editableEntries Map                                  │
│  - Renders POBSummary, POBTable (interactive)                   │
│  - NEW: Renders POBPrintReport (print-only)                     │
│  - NEW: Print button triggers window.print()                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Props
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    POBPrintReport.vue                           │
├─────────────────────────────────────────────────────────────────┤
│  - Receives: location, period, entries, summary                 │
│  - Renders print-optimized layout                               │
│  - Hidden in screen view (class="hidden print:block")           │
│  - Contains: header, entries table, signature blocks            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Validation Rules

Since this is a read-only display component, validation is minimal:

| Rule                      | Implementation                             |
| ------------------------- | ------------------------------------------ |
| Entries must be non-empty | Disable print button if entries.size === 0 |
| Period must be defined    | Disable print button if !period            |
| Location must be defined  | Disable print button if !location          |
| Summary must be defined   | Disable print button if !summary           |

These validations already exist in the parent `pob.vue` page; the print button simply respects the same conditions.

---

## State Transitions

No state transitions for this feature. The print report is a static snapshot of current data at the time of printing.

---

## No New Database Schema

This feature does not require any database changes. All data comes from existing POB API endpoints:

- `GET /api/locations/{locationId}/pob` - Existing endpoint

---

## References

- Existing POBEntry interface: `app/pages/pob.vue:18-29`
- Existing POBSummary display: `app/components/pob/POBSummary.vue`
- Existing POBTable display: `app/components/pob/POBTable.vue`
