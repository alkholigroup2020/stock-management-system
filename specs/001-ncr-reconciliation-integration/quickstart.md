# Quickstart: NCR Integration with Reconciliations

**Feature Branch**: `001-ncr-reconciliation-integration`
**Date**: 2026-01-17

## What This Feature Does

This feature integrates Non-Conformance Reports (NCRs) into the Reconciliation system so that:

1. **NCR Credits** (supplier refunds) automatically reduce consumption costs
2. **NCR Losses** (rejected claims) automatically increase consumption costs
3. **Pending Credits** (SENT NCRs) are displayed for visibility
4. **Open NCR Warnings** appear during period close

## Quick Reference

### NCR Status → Reconciliation Impact

| Status   | Impact on Reconciliation              |
| -------- | ------------------------------------- |
| OPEN     | Warning only (non-blocking)           |
| SENT     | "Pending Credits" display             |
| CREDITED | Adds to `ncr_credits`                 |
| REJECTED | Adds to `ncr_losses`                  |
| RESOLVED | Based on `financial_impact` selection |

### When Resolving an NCR

When marking an NCR as RESOLVED, you must specify:

- **Resolution Type**: Free text (e.g., "Replacement", "Writeoff", "Price Adjustment")
- **Financial Impact**:
  - `NONE` - No financial adjustment (replacement received, no money exchanged)
  - `CREDIT` - Value recovered (treat as credit)
  - `LOSS` - Value lost (treat as loss)

## Files to Modify

### Backend (Priority Order)

1. **prisma/schema.prisma**
   - Add `NCRFinancialImpact` enum
   - Add `resolution_type`, `financial_impact` to NCR model
   - Add `ncr_credits`, `ncr_losses` to Reconciliation model

2. **server/utils/ncrCredits.ts** (NEW)
   - `getCreditedNCRsForPeriod()` - Queries CREDITED + RESOLVED/CREDIT
   - `getLostNCRsForPeriod()` - Queries REJECTED + RESOLVED/LOSS
   - `getPendingNCRsForPeriod()` - Queries SENT status
   - `getOpenNCRsForPeriod()` - Queries OPEN status

3. **server/api/ncrs/[id].patch.ts**
   - Add `resolution_type` and `financial_impact` to Zod schema
   - Validate both required when status=RESOLVED

4. **server/api/ncrs/summary.get.ts** (NEW)
   - Query params: `periodId`, `locationId`
   - Returns categorized NCR summary

5. **server/api/reconciliations/index.post.ts**
   - Import NCR utilities
   - Calculate `ncr_credits` and `ncr_losses`
   - Include in upsert and response

6. **server/utils/reconciliation.ts**
   - Add `ncrCredits` and `ncrLosses` to `ConsumptionInput`
   - Update formula: `+ ncrLosses - ncrCredits`

7. **server/api/periods/[periodId]/close.post.ts**
   - Query OPEN NCRs before creating approval
   - Include warning summary in response

### Frontend (Priority Order)

1. **app/pages/ncrs/[id].vue**
   - Add `resolution_type` input (required for RESOLVED)
   - Add `financial_impact` select (required for RESOLVED)
   - Conditional display when status → RESOLVED

2. **app/components/reconciliation/AdjustmentsForm.vue**
   - Add read-only NCR Credits section
   - Add read-only NCR Losses section
   - Add Pending Credits informational display

3. **app/components/reconciliation/OpenNCRWarning.vue** (NEW)
   - Warning alert for OPEN NCRs
   - Expandable list with NCR details
   - Links to NCR pages for resolution

4. **app/components/reconciliation/ReconciliationSummary.vue**
   - Display NCR breakdown in summary section

### Shared Types

1. **shared/types/database.ts**
   - Add `NCRFinancialImpact` type
   - Add `NCRSummaryResponse` interface

## Testing Checklist

After implementation, verify:

- [ ] Resolve NCR → RESOLVED requires resolution_type and financial_impact
- [ ] CREDITED NCRs appear in reconciliation `ncr_credits`
- [ ] REJECTED NCRs appear in reconciliation `ncr_losses`
- [ ] RESOLVED with CREDIT → appears in `ncr_credits`
- [ ] RESOLVED with LOSS → appears in `ncr_losses`
- [ ] RESOLVED with NONE → no reconciliation impact
- [ ] SENT NCRs appear in "Pending Credits" display
- [ ] Period close shows OPEN NCR warning
- [ ] Period close succeeds despite OPEN NCRs
- [ ] Consumption formula correctly uses NCR values
- [ ] `pnpm typecheck` passes with zero errors

## Database Migration

After schema changes:

```bash
pnpm db:migrate dev --name ncr-reconciliation-integration
```

This creates migration for:

- `NCRFinancialImpact` enum
- `NCR.resolution_type` (nullable string)
- `NCR.financial_impact` (nullable enum)
- `Reconciliation.ncr_credits` (decimal, default 0)
- `Reconciliation.ncr_losses` (decimal, default 0)

## Key Business Rules

1. **NCR-Period Association**: NCRs link to periods via `delivery.period_id`, or by `created_at` date range for manual NCRs

2. **Consumption Formula**:

   ```
   TotalAdjustments = BackCharges - Credits - Condemnations + Adjustments + NCR_Losses - NCR_Credits
   Consumption = Opening + Receipts + TransfersIn - TransfersOut - Closing + TotalAdjustments
   ```

3. **Non-blocking Warning**: OPEN NCRs generate a warning during period close but do not block the operation

4. **Audit Trail**: Existing NCR `created_at`, `resolved_at`, `resolution_notes` fields plus new fields provide complete history
