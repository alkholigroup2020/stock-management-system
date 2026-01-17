# Research: NCR Integration with Reconciliations

**Feature Branch**: `001-ncr-reconciliation-integration`
**Date**: 2026-01-17

## Research Summary

This document captures research findings for integrating NCR financial data into the Reconciliation system. The research confirms existing patterns and establishes design decisions for the implementation.

---

## 1. Existing NCR Model Analysis

### Decision: Extend NCR model with two new fields

**Rationale**: The existing NCR model already has:

- `value` field (Decimal) - stores the monetary amount
- `status` enum (OPEN, SENT, CREDITED, REJECTED, RESOLVED)
- `delivery_id` - links to delivery for period association
- `resolution_notes` - free text for resolution details

Adding `resolution_type` (String) and `financial_impact` (enum) provides:

- Structured resolution categorization
- Clear financial treatment rules for RESOLVED status

**Alternatives Considered**:

- Using `resolution_notes` to infer financial impact → Rejected: unreliable parsing, no validation
- Separate resolution entity → Rejected: over-engineering for simple status extension

---

## 2. NCR-to-Period Association Strategy

### Decision: Use delivery.period_id as primary association, date range as fallback

**Rationale**:

- 90%+ NCRs are auto-generated from deliveries (PRICE_VARIANCE type)
- Deliveries already have `period_id` foreign key
- Manual NCRs without delivery link use `created_at` within period date range

**Query Pattern**:

```typescript
// Primary: NCRs linked to deliveries in the period
WHERE delivery.period_id = periodId AND location_id = locationId

// Fallback for manual NCRs without delivery
WHERE delivery_id IS NULL
  AND created_at BETWEEN period.start_date AND period.end_date
  AND location_id = locationId
```

**Alternatives Considered**:

- Adding `period_id` directly to NCR model → Rejected: redundant with delivery link, complicates manual NCR handling
- Using `created_at` for all NCRs → Rejected: delivery-linked NCRs should follow delivery's period assignment

---

## 3. Consumption Formula Integration

### Decision: NCR credits reduce consumption, NCR losses increase consumption

**Rationale**:

- `ncr_credits` = money recovered from suppliers → reduces net cost
- `ncr_losses` = unrecovered costs absorbed → increases net cost (absorbed by the business)

**Updated Formula**:

```
TotalAdjustments = BackCharges - Credits - Condemnations + Adjustments + NCR_Losses - NCR_Credits

Consumption = Opening + Receipts + TransfersIn - TransfersOut - Closing + TotalAdjustments
```

**Implementation Note**: The existing `credits` field remains for manual credits. `ncr_credits` is a separate auto-calculated field.

**Alternatives Considered**:

- Merging NCR credits into existing `credits` field → Rejected: loses traceability, manual vs auto distinction important for audit
- Displaying NCR losses as separate line item only → Rejected: must affect consumption for accurate cost reporting

---

## 4. Existing Reconciliation API Pattern

### Decision: Follow existing `reconciliations/index.post.ts` pattern

**Rationale**: The current API:

1. Validates period is OPEN
2. Calculates stock movements from transactions
3. Stores manual adjustment inputs
4. Returns calculation breakdown

NCR integration follows same pattern:

1. Query NCRs during stock calculation phase
2. Store `ncr_credits` and `ncr_losses` alongside manual fields
3. Include NCR breakdown in response

**Code Pattern from Existing API**:

```typescript
// Parallel queries for transaction data
const [deliveries, transfersIn, transfersOut, issues] = await Promise.all([...]);

// Add NCR queries to this parallel block
const [creditedNCRs, lostNCRs, pendingNCRs, openNCRs] = await Promise.all([...]);
```

---

## 5. Period Close Warning Pattern

### Decision: Non-blocking warning with NCR summary in response

**Rationale**:

- Business cannot always resolve all NCRs before period close
- Warning provides visibility without blocking operations
- Follows existing pattern where `LOCATIONS_NOT_READY` is blocking but warnings are informational

**Implementation**:

```typescript
// Add to close.post.ts response
return {
  approval: {...},
  period: {...},
  warnings: {
    openNCRs: {
      count: 5,
      totalValue: 1500.00,
      byLocation: [
        { locationId: "...", locationName: "Kitchen", count: 3, value: 800.00 }
      ]
    }
  },
  message: "Period close approval request created successfully"
};
```

---

## 6. NCR Summary Endpoint Design

### Decision: New GET endpoint `/api/ncrs/summary` with query params

**Rationale**:

- Reconciliation page needs NCR breakdown before saving
- Period close needs OPEN NCR count
- Separate endpoint allows flexible reuse

**API Design**:

```
GET /api/ncrs/summary?periodId=xxx&locationId=yyy

Response:
{
  credited: { total: 500.00, count: 2, ncrs: [...] },
  losses: { total: 150.00, count: 1, ncrs: [...] },
  pending: { total: 200.00, count: 1, ncrs: [...] },
  open: { count: 3, ncrs: [...] }
}
```

**Alternatives Considered**:

- Embedding NCR data in reconciliation GET → Rejected: reconciliation doesn't always need full NCR breakdown
- Multiple separate endpoints per status → Rejected: unnecessary API proliferation

---

## 7. Frontend Component Strategy

### Decision: Read-only NCR sections in AdjustmentsForm, expandable breakdown

**Rationale**:

- NCR credits/losses are auto-calculated, not user-editable
- Users need visibility into what NCRs contribute to totals
- Expandable lists prevent UI clutter while maintaining access to details

**Component Additions**:

1. **AdjustmentsForm.vue**: Add read-only section showing:
   - NCR Credits total (expandable list of CREDITED + RESOLVED/CREDIT NCRs)
   - NCR Losses total (expandable list of REJECTED + RESOLVED/LOSS NCRs)
   - Pending Credits informational display (SENT NCRs)

2. **OpenNCRWarning.vue**: Alert component showing:
   - Count of OPEN NCRs
   - Total value at risk
   - Links to individual NCRs for resolution

3. **NCR [id].vue**: Add resolution fields when status changes to RESOLVED:
   - `resolution_type` text input (required)
   - `financial_impact` select (NONE/CREDIT/LOSS, required)

---

## 8. Type Safety Strategy

### Decision: Prisma enum + shared TypeScript type

**Rationale**:

- Prisma enum ensures database-level validation
- Shared TypeScript type enables compile-time checking in both server and client
- Zod schema validates API inputs

**Type Definitions**:

```prisma
// prisma/schema.prisma
enum NCRFinancialImpact {
  NONE
  CREDIT
  LOSS
}
```

```typescript
// shared/types/database.ts
export type NCRFinancialImpact = "NONE" | "CREDIT" | "LOSS";
```

---

## 9. Existing UI Patterns to Follow

### Decision: Use existing Nuxt UI components and design tokens

**Patterns from Codebase**:

- `UCard` with `card-elevated` class for sections
- `UBadge` for status indicators
- `UAlert` for warnings (color="warning", variant="soft")
- `formatCurrency()` utility for SAR formatting
- `UButton` with `cursor-pointer` class per constitution

**Accessibility**:

- Use semantic color tokens (`--ui-text`, `--ui-text-muted`, `--ui-primary`)
- Ensure NCR links are keyboard accessible
- Warning alerts include icon and descriptive text

---

## Research Conclusions

All technical decisions are validated against existing codebase patterns. No blocking unknowns remain:

| Area                | Decision                                        | Confidence               |
| ------------------- | ----------------------------------------------- | ------------------------ |
| Data Model          | Add 2 fields to NCR, 2 fields to Reconciliation | High                     |
| NCR-Period Link     | Delivery period_id primary, date fallback       | High                     |
| Consumption Formula | Credits reduce, losses increase consumption     | High (per clarification) |
| API Design          | Extend existing POST, add summary GET           | High                     |
| Period Close        | Non-blocking warning in response                | High                     |
| Frontend            | Read-only NCR sections, expandable lists        | High                     |
| Type Safety         | Prisma enum + shared TypeScript type            | High                     |

**Next Phase**: Proceed to Phase 1 (Data Model and API Contracts)
