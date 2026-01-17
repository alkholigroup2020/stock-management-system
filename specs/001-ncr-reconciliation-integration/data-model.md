# Data Model: NCR Integration with Reconciliations

**Feature Branch**: `001-ncr-reconciliation-integration`
**Date**: 2026-01-17

## Overview

This document defines the data model changes required for NCR-Reconciliation integration. All changes are additive - no existing fields are modified or removed.

---

## Schema Changes

### 1. New Enum: NCRFinancialImpact

**Purpose**: Defines the financial treatment of a RESOLVED NCR in reconciliation calculations.

```prisma
enum NCRFinancialImpact {
  NONE    // No financial adjustment (e.g., replacement received)
  CREDIT  // Value recovered as credit (treat like CREDITED status)
  LOSS    // Value lost (treat like REJECTED status)
}
```

**Placement**: After existing `NCRStatus` enum (~line 579 in schema.prisma)

---

### 2. NCR Model Extensions

**Existing Fields** (no changes):
- `id`, `ncr_no`, `location_id`, `type`, `auto_generated`
- `delivery_id`, `delivery_line_id`, `reason`, `quantity`, `value`
- `status`, `created_by`, `created_at`, `resolved_at`, `resolution_notes`

**New Fields**:

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `resolution_type` | String | Yes | null | Free-text resolution category (e.g., "Replacement", "Writeoff", "Price Adjustment") |
| `financial_impact` | NCRFinancialImpact | Yes | null | Financial treatment when status=RESOLVED |

**Prisma Schema Addition**:
```prisma
model NCR {
  // ... existing fields ...
  resolution_notes String?
  resolution_type  String?              // NEW: Free-text resolution category
  financial_impact NCRFinancialImpact?  // NEW: Financial treatment for RESOLVED status
  // ... relations ...
}
```

**Validation Rules**:
- `resolution_type` and `financial_impact` are REQUIRED when `status = RESOLVED`
- Both fields MUST be null or empty when `status != RESOLVED`
- Validation enforced at API layer via Zod schema

---

### 3. Reconciliation Model Extensions

**Existing Fields** (no changes):
- `id`, `period_id`, `location_id`
- `opening_stock`, `receipts`, `transfers_in`, `transfers_out`
- `issues`, `closing_stock`, `adjustments`
- `back_charges`, `credits`, `condemnations`, `last_updated`

**New Fields**:

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `ncr_credits` | Decimal(15,2) | No | 0 | Sum of CREDITED + RESOLVED/CREDIT NCR values |
| `ncr_losses` | Decimal(15,2) | No | 0 | Sum of REJECTED + RESOLVED/LOSS NCR values |

**Prisma Schema Addition**:
```prisma
model Reconciliation {
  // ... existing fields ...
  credits       Decimal  @default(0) @db.Decimal(15, 2)  // Existing: manual credits
  ncr_credits   Decimal  @default(0) @db.Decimal(15, 2)  // NEW: auto-calculated NCR credits
  ncr_losses    Decimal  @default(0) @db.Decimal(15, 2)  // NEW: auto-calculated NCR losses
  condemnations Decimal  @default(0) @db.Decimal(15, 2)
  // ... rest ...
}
```

**Business Rules**:
- `ncr_credits` calculated as: SUM(value) WHERE (status=CREDITED) OR (status=RESOLVED AND financial_impact=CREDIT)
- `ncr_losses` calculated as: SUM(value) WHERE (status=REJECTED) OR (status=RESOLVED AND financial_impact=LOSS)
- Both fields are auto-calculated at reconciliation save time, not user-editable

---

## Entity Relationships

### NCR → Period Association

NCRs are associated with periods through their linked delivery:

```
NCR.delivery_id → Delivery.id → Delivery.period_id → Period.id
```

**Fallback for Manual NCRs** (no delivery link):
```
NCR.created_at BETWEEN Period.start_date AND Period.end_date
```

### Reconciliation Data Flow

```
Period + Location
       ↓
   Reconciliation (1:1 per period+location)
       ↓
   ├── Stock calculations (opening, receipts, transfers, closing)
   ├── Manual adjustments (back_charges, credits, condemnations, adjustments)
   └── NCR calculations (ncr_credits, ncr_losses) ← Auto-calculated from NCRs
```

---

## State Transitions

### NCR Status Flow with Financial Impact

```
OPEN ──────┬──→ SENT ────────┬──→ CREDITED ────→ (Final: ncr_credits)
           │                 │
           │                 ├──→ REJECTED ────→ (Final: ncr_losses)
           │                 │
           └─────────────────┴──→ RESOLVED ───→ (Final: based on financial_impact)
                                    │
                                    ├── NONE → No reconciliation impact
                                    ├── CREDIT → Adds to ncr_credits
                                    └── LOSS → Adds to ncr_losses
```

### Financial Impact Decision Tree

```
IF status = CREDITED:
    → Add value to ncr_credits

ELSE IF status = REJECTED:
    → Add value to ncr_losses

ELSE IF status = RESOLVED:
    IF financial_impact = CREDIT:
        → Add value to ncr_credits
    ELSE IF financial_impact = LOSS:
        → Add value to ncr_losses
    ELSE IF financial_impact = NONE:
        → No reconciliation impact

ELSE (OPEN, SENT):
    → No reconciliation impact (informational only)
```

---

## Indexes

No new indexes required. Existing NCR indexes support the query patterns:
- `@@index([location_id, status])` - Used for NCR summary queries
- `@@index([delivery_id])` - Used for NCR-to-period association
- `@@index([created_at])` - Used for manual NCR date range queries

---

## Migration Notes

### Forward Migration
1. Add `NCRFinancialImpact` enum to Prisma schema
2. Add `resolution_type` and `financial_impact` columns to NCR table (nullable)
3. Add `ncr_credits` and `ncr_losses` columns to Reconciliation table (default 0)
4. Run `pnpm db:migrate dev` to create migration

### Data Handling
- Existing NCRs with `status = RESOLVED` will have `financial_impact = NULL`
- These are treated as `financial_impact = NONE` (no reconciliation impact)
- No data backfill required - existing reconciliations won't change

### Rollback
- Remove new columns and enum
- No data loss since new fields are additive

---

## TypeScript Types

### Shared Type (shared/types/database.ts)

```typescript
export type NCRFinancialImpact = "NONE" | "CREDIT" | "LOSS";

export interface NCRResolution {
  resolution_type: string;
  financial_impact: NCRFinancialImpact;
}
```

### API Response Types

```typescript
export interface NCRSummaryCategory {
  total: number;      // Sum of values
  count: number;      // Number of NCRs
  ncrs: NCRSummaryItem[];
}

export interface NCRSummaryItem {
  id: string;
  ncr_no: string;
  value: number;
  delivery_no?: string;
  item_name?: string;
  reason: string;
}

export interface NCRSummaryResponse {
  credited: NCRSummaryCategory;
  losses: NCRSummaryCategory;
  pending: NCRSummaryCategory;
  open: { count: number; ncrs: NCRSummaryItem[] };
}

export interface ReconciliationWithNCR extends Reconciliation {
  ncr_credits: number;
  ncr_losses: number;
  ncr_breakdown?: NCRSummaryResponse;
}
```

---

## Validation Rules Summary

| Field | Validation | Error Code |
|-------|------------|------------|
| `resolution_type` | Required when status=RESOLVED, max 200 chars | `RESOLUTION_TYPE_REQUIRED` |
| `financial_impact` | Required when status=RESOLVED, must be valid enum | `FINANCIAL_IMPACT_REQUIRED` |
| `ncr_credits` | Auto-calculated, >= 0 | N/A (system-managed) |
| `ncr_losses` | Auto-calculated, >= 0 | N/A (system-managed) |
