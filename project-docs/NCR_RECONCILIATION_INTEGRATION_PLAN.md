# NCR Integration with Reconciliations - Implementation Plan

## Summary

Comprehensive NCR integration into the Reconciliation system:

| NCR Status   | Reconciliation Impact                                             |
| ------------ | ----------------------------------------------------------------- |
| **OPEN**     | Warning shown (non-blocking)                                      |
| **SENT**     | Display as "Pending Credits" (informational)                      |
| **CREDITED** | Auto-sum to `ncr_credits` field                                   |
| **REJECTED** | Auto-sum to `ncr_losses` field                                    |
| **RESOLVED** | Based on user-selected `financial_impact` (CREDIT, LOSS, or NONE) |

---

## Phase 1: Database Schema Updates

### 1a. Add resolution tracking to NCR model

**File:** `prisma/schema.prisma` (NCR model ~line 397)

```prisma
enum NCRFinancialImpact {
  NONE       // No financial adjustment (e.g., replacement received)
  CREDIT     // Value recovered as credit (treat like CREDITED status)
  LOSS       // Value lost (treat like REJECTED status)
}

model NCR {
  // ... existing fields ...
  resolution_type    String?             // Free-text: "Replacement", "Writeoff", etc.
  financial_impact   NCRFinancialImpact? // Set when RESOLVED - determines reconciliation treatment
  // ... rest of fields ...
}
```

### 1b. Add NCR fields to Reconciliation model

**File:** `prisma/schema.prisma` (Reconciliation model ~line 454)

```prisma
model Reconciliation {
  // ... existing fields ...
  credits         Decimal  @default(0) @db.Decimal(15, 2)  // Manual credits (unchanged)
  ncr_credits     Decimal  @default(0) @db.Decimal(15, 2)  // NEW: CREDITED + RESOLVED(CREDIT)
  ncr_losses      Decimal  @default(0) @db.Decimal(15, 2)  // NEW: REJECTED + RESOLVED(LOSS)
  // ...
}
```

---

## Phase 2: Create NCR Query Utility

**New File:** `server/utils/ncrCredits.ts`

Functions:

- `getCreditedNCRsForPeriod(periodId, locationId)` - NCRs with status=CREDITED OR (status=RESOLVED AND financial_impact=CREDIT)
- `getLostNCRsForPeriod(periodId, locationId)` - NCRs with status=REJECTED OR (status=RESOLVED AND financial_impact=LOSS)
- `getPendingNCRsForPeriod(periodId, locationId)` - NCRs with status=SENT
- `getOpenNCRsForPeriod(periodId, locationId)` - NCRs with status=OPEN

**NCR-Period Filtering Logic:**

- Primary: NCRs linked to deliveries in the period (`delivery.period_id = periodId`)
- Fallback: Manual NCRs without delivery, created within period date range

---

## Phase 3: Update NCR PATCH API

**File:** `server/api/ncrs/[id].patch.ts`

When status changes to RESOLVED:

- Require `resolution_type` (free text)
- Require `financial_impact` (NONE, CREDIT, LOSS)
- Store both fields

```typescript
const bodySchema = z.object({
  status: z.enum(["OPEN", "SENT", "CREDITED", "REJECTED", "RESOLVED"]).optional(),
  resolution_notes: z.string().optional(),
  resolution_type: z.string().optional(), // NEW: Required when RESOLVED
  financial_impact: z.enum(["NONE", "CREDIT", "LOSS"]).optional(), // NEW: Required when RESOLVED
});

// Validation: If status is RESOLVED, require resolution_type and financial_impact
if (status === "RESOLVED" && (!resolution_type || !financial_impact)) {
  throw createError({ ..."Resolution type and financial impact required" });
}
```

---

## Phase 4: Update Reconciliation API

**File:** `server/api/reconciliations/index.post.ts`

Changes:

1. Import NCR query utilities
2. Calculate `ncr_credits` = CREDITED + RESOLVED(CREDIT)
3. Calculate `ncr_losses` = REJECTED + RESOLVED(LOSS)
4. Save both fields
5. Return full NCR breakdown in response

```typescript
const [creditedResult, lostResult, pendingResult, openResult] = await Promise.all([
  getCreditedNCRsForPeriod(periodId, locationId),
  getLostNCRsForPeriod(periodId, locationId),
  getPendingNCRsForPeriod(periodId, locationId),
  getOpenNCRsForPeriod(periodId, locationId),
]);

// Save to reconciliation
ncr_credits: creditedResult.totalCredits,
ncr_losses: lostResult.totalLosses,

// Response includes all categories
ncr_breakdown: {
  credited: { total: ..., count: ..., ncrs: [...] },
  losses: { total: ..., count: ..., ncrs: [...] },
  pending: { total: ..., count: ..., ncrs: [...] },  // Informational
  open: { count: ..., ncrs: [...] }                   // Warning
}
```

---

## Phase 5: Update Consumption Calculation

**File:** `server/utils/reconciliation.ts`

Updated formula:

```
Total Credits = Manual Credits + NCR Credits
Total Losses = Condemnations + NCR Losses

Consumption = Opening + Receipts + TransfersIn - TransfersOut - Closing
            + BackCharges - Total Credits - Total Losses + Adjustments
```

Or if NCR losses should increase consumption (representing unrecovered costs):

```
Consumption = Opening + Receipts + TransfersIn - TransfersOut - Closing
            + BackCharges - Total Credits + NCR Losses - Condemnations + Adjustments
```

---

## Phase 6: Add OPEN NCR Warning to Period Close

**File:** `server/api/periods/[periodId]/close.post.ts`

- Query OPEN NCRs for all locations
- Include warning in response (non-blocking)
- Return summary by location

---

## Phase 7: Frontend UI Updates

### 7a. Update NCR Detail Page for Resolution

**File:** `app/pages/ncrs/[id].vue`

When updating status to RESOLVED, show additional fields:

- Resolution Type (text input): "Replacement", "Writeoff", "Price Adjustment", etc.
- Financial Impact (select): NONE / CREDIT / LOSS
- Validation: Both required for RESOLVED status

### 7b. Update AdjustmentsForm

**File:** `app/components/reconciliation/AdjustmentsForm.vue`

Add NCR sections:

- **NCR Credits** (read-only): Sum of CREDITED + RESOLVED(CREDIT)
- **NCR Losses** (read-only): Sum of REJECTED + RESOLVED(LOSS)
- **Pending Credits** (informational): Sum of SENT NCRs
- Show breakdown lists for each category

### 7c. Update ReconciliationSummary

**File:** `app/components/reconciliation/ReconciliationSummary.vue`

Display:

- NCR Credits breakdown
- NCR Losses breakdown
- Pending Credits (with note: "awaiting supplier response")

### 7d. Create OpenNCRWarning Component

**New File:** `app/components/reconciliation/OpenNCRWarning.vue`

- Warning alert for OPEN NCRs
- Expandable list showing each NCR
- Link to NCR detail page for resolution

---

## Phase 8: New API Endpoint

**New File:** `server/api/ncrs/summary.get.ts`

Query params: `periodId`, `locationId`

Returns:

```json
{
  "credited": { "total": 500.00, "count": 2, "ncrs": [...] },
  "losses": { "total": 150.00, "count": 1, "ncrs": [...] },
  "pending": { "total": 200.00, "count": 1, "ncrs": [...] },
  "open": { "count": 3, "ncrs": [...] }
}
```

---

## Files to Modify

| File                                                      | Change                                                           |
| --------------------------------------------------------- | ---------------------------------------------------------------- |
| `prisma/schema.prisma`                                    | Add `NCRFinancialImpact` enum, NCR fields, Reconciliation fields |
| `server/utils/ncrCredits.ts`                              | NEW - NCR query utilities (4 functions)                          |
| `server/utils/reconciliation.ts`                          | Update consumption formula                                       |
| `server/api/ncrs/[id].patch.ts`                           | Add resolution_type and financial_impact handling                |
| `server/api/reconciliations/index.post.ts`                | Calculate ncr_credits and ncr_losses                             |
| `server/api/reports/reconciliation.get.ts`                | Include NCR data in report                                       |
| `server/api/reconciliations/consolidated.get.ts`          | Include NCR data                                                 |
| `server/api/periods/[periodId]/close.post.ts`             | Add OPEN NCR warning                                             |
| `server/api/ncrs/summary.get.ts`                          | NEW - NCR summary endpoint                                       |
| `shared/types/database.ts`                                | Add NCRFinancialImpact type                                      |
| `app/pages/ncrs/[id].vue`                                 | Add resolution fields for RESOLVED status                        |
| `app/components/reconciliation/AdjustmentsForm.vue`       | Display NCR credits/losses                                       |
| `app/components/reconciliation/ReconciliationSummary.vue` | NCR breakdown display                                            |
| `app/components/reconciliation/OpenNCRWarning.vue`        | NEW - Warning component                                          |
| `app/pages/reconciliations/index.vue`                     | Pass NCR data to components                                      |

---

## Verification Plan

1. **CREDITED NCR Flow:**
   - Create delivery with price variance → NCR auto-generated
   - Update NCR status to CREDITED
   - Check reconciliation → NCR value in `ncr_credits`

2. **REJECTED NCR Flow:**
   - Create manual NCR
   - Update status to REJECTED
   - Check reconciliation → NCR value in `ncr_losses`

3. **RESOLVED NCR Flow:**
   - Create NCR → Update to RESOLVED
   - Set resolution_type="Replacement", financial_impact=NONE
   - Verify no reconciliation impact
   - Try with financial_impact=CREDIT → appears in ncr_credits
   - Try with financial_impact=LOSS → appears in ncr_losses

4. **SENT NCR (Pending):**
   - Update NCR to SENT
   - Check reconciliation → appears in "Pending Credits" display

5. **OPEN NCR Warning:**
   - Leave NCR in OPEN status
   - Go to period close → verify warning appears
   - Verify period close still works (non-blocking)

6. Run `pnpm typecheck` → zero errors

---

## Migration Notes

- New columns (`ncr_credits`, `ncr_losses`, `resolution_type`, `financial_impact`) all nullable or default to 0/null
- Existing NCRs with RESOLVED status will need `financial_impact` set manually or default to NONE
- No data migration required - system handles null gracefully
