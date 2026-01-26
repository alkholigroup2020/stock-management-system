# Research: PRF/PO Workflow

**Feature**: 001-prf-po-workflow
**Date**: 2026-01-19

## Overview

This document captures research findings and decisions made during the planning phase for the PRF/PO workflow implementation.

---

## 1. Email Notification Service

### Decision

Use **Office 365 SMTP** via Nodemailer for transactional email delivery.

### Rationale

- Leverages existing Office 365 subscription
- No additional third-party service required
- Direct integration with corporate email infrastructure
- Reliable deliverability through trusted Microsoft servers

### Alternatives Considered

| Option          | Pros                                            | Cons                                        | Verdict                   |
| --------------- | ----------------------------------------------- | ------------------------------------------- | ------------------------- |
| Office 365 SMTP | Uses existing O365, no extra cost, reliable     | Requires SMTP credentials                   | ✅ Selected               |
| Resend          | Simple API, TypeScript SDK, good deliverability | Requires domain verification, extra service | Previously used, replaced |
| SendGrid        | Enterprise-grade                                | Overkill for MVP, complex pricing           | Rejected                  |

### Implementation Notes

- Environment variables: `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`, `EMAIL_FROM`
- SMTP Host: `smtp.office365.com` (default)
- SMTP Port: `587` (STARTTLS)
- Fallback: Log email to console in development (when credentials not configured)
- Retry: No automatic retry; log failures for investigation

### Email Usage Scope

- **PRF Approval**: Email notifications ARE sent to PROCUREMENT_SPECIALIST users when a PRF is approved
- **PO Creation**: Email notifications are NOT sent to suppliers; supplier email addresses are stored for reference only
- **Resend**: No manual resend functionality for POs
- **Over-Delivery Approval Request**: Email sent to Supervisors/Admins when Operator saves draft with over-delivery
- **Over-Delivery Approved**: Email sent to delivery creator when Supervisor/Admin approves over-delivery
- **Over-Delivery Rejected**: Email sent to delivery creator when Supervisor/Admin rejects (includes reason)

---

## 2. Sequential Number Generation

### Decision

Use **database sequence with prefix** pattern for PRF/PO numbers.

### Rationale

- Follows existing pattern in codebase (delivery_no, issue_no, transfer_no)
- PostgreSQL handles concurrency correctly
- Human-readable format: `PRF-001`, `PO-001`

### Implementation Pattern

```typescript
// Generate next PRF number
const lastPrf = await prisma.pRF.findFirst({
  orderBy: { prf_no: "desc" },
});
const nextNum = lastPrf ? parseInt(lastPrf.prf_no.split("-")[1]) + 1 : 1;
const prf_no = `PRF-${String(nextNum).padStart(3, "0")}`;
```

### Alternatives Considered

| Option                                | Pros                              | Cons                             | Verdict     |
| ------------------------------------- | --------------------------------- | -------------------------------- | ----------- |
| Database sequence + prefix            | Simple, matches existing patterns | Requires careful ordering        | ✅ Selected |
| UUID only                             | No conflicts                      | Not human-readable               | Rejected    |
| Location-prefixed (e.g., KIT-PRF-001) | Location context                  | Complex, breaks current patterns | Rejected    |

---

## 3. VAT Calculation Logic

### Decision

Apply **15% VAT** (Saudi Arabia standard) with line-level calculation.

### Rationale

- Saudi VAT rate is 15% as of 2020
- Line-level calculation allows for future per-item VAT exceptions
- Matches typical accounting system expectations

### Calculation Formula

```typescript
// Per line item:
const totalBeforeVat = quantity * unitPrice * (1 - discountPercent / 100);
const vatAmount = totalBeforeVat * (vatPercent / 100);
const totalAfterVat = totalBeforeVat + vatAmount;

// PO totals:
const totalBeforeDiscount = sum(lines.map((l) => l.quantity * l.unitPrice));
const totalDiscount = sum(lines.map((l) => (l.quantity * l.unitPrice * l.discountPercent) / 100));
const totalAfterDiscount = totalBeforeDiscount - totalDiscount;
const totalVat = sum(lines.map((l) => l.vatAmount));
const totalAmount = totalAfterDiscount + totalVat;
```

### Alternatives Considered

| Option                | Pros               | Cons                           | Verdict     |
| --------------------- | ------------------ | ------------------------------ | ----------- |
| Line-level VAT        | Flexible, standard | Slightly more complex          | ✅ Selected |
| Header-level VAT only | Simpler            | Less flexible, rounding issues | Rejected    |
| Configurable VAT rate | Future-proof       | Over-engineering for MVP       | Deferred    |

---

## 3a. PRF VAT Display (UI-Level Calculation)

### Decision

Display VAT calculations on PRF forms for user reference, but do not store VAT fields in the database.

### Rationale

- PRFs are internal requisitions, not formal orders sent to suppliers
- Users benefit from seeing the estimated total including VAT when planning purchases
- Storing VAT on PRFs would be redundant since the actual VAT is calculated and stored on the PO
- Keeping the calculation client-side reduces database complexity

### Implementation

```typescript
// PRF line VAT calculation (UI only)
const VAT_RATE = 15;

// Per line item (computed):
const total_before_vat = required_qty * estimated_price;
const vat_amount = (total_before_vat * VAT_RATE) / 100;
const total_after_vat = total_before_vat + vat_amount;

// PRF totals (computed):
const totals = lines.reduce(
  (acc, line) => ({
    total_before_vat: acc.total_before_vat + line.total_before_vat,
    total_vat: acc.total_vat + line.vat_amount,
    total_amount: acc.total_amount + line.total_after_vat,
  }),
  { total_before_vat: 0, total_vat: 0, total_amount: 0 }
);
```

### UI Display

- Table columns: Before VAT, VAT (15%), Total
- Footer summary: Total Before VAT, VAT (15%), Grand Total
- Responsive design: VAT columns hidden on smaller screens (md:table-cell, lg:table-cell)

---

## 4. PRF Status Workflow

### Decision

Follow state machine pattern with explicit transitions.

### State Diagram

```
DRAFT ──submit──> PENDING ──approve──> APPROVED
                     │                    │
                     │                    └──(1:1)──> PO created
                     │
                     └──reject──> REJECTED ──clone──> new DRAFT
```

### Valid Transitions

| From     | To          | Action                      | Who Can Do         |
| -------- | ----------- | --------------------------- | ------------------ |
| DRAFT    | PENDING     | Submit                      | Requester only     |
| PENDING  | APPROVED    | Approve                     | Supervisor, Admin  |
| PENDING  | REJECTED    | Reject                      | Supervisor, Admin  |
| REJECTED | (new DRAFT) | Clone                       | Original requester |
| APPROVED | CLOSED      | Close (auto when PO closed) | System             |

### Rationale

- Matches existing Transfer workflow pattern
- Clear separation of concerns
- Audit trail preserved

---

## 5. PO Editing Policy

### Decision

Allow full editing of OPEN POs until closed.

### Rationale

- Procurement specialists need flexibility to adjust orders based on supplier feedback
- Prices, quantities, and even line items may change during negotiation
- Closed POs become immutable for audit purposes

### Implementation Notes

- OPEN status: Full CRUD on lines, all header fields editable
- CLOSED status: Read-only; no modifications allowed
- Validation: Block close if no deliveries linked (warn, don't block)

---

## 6. PROCUREMENT_SPECIALIST Role

### Decision

Add new role with limited permissions following least-privilege principle.

### Permission Matrix

| Resource        | OPERATOR            | SUPERVISOR        | ADMIN            | PROCUREMENT_SPECIALIST       |
| --------------- | ------------------- | ----------------- | ---------------- | ---------------------------- |
| Dashboard       | ✅                  | ✅                | ✅               | ❌                           |
| Orders (PRFs)   | Create, View own    | View all, Approve | Full             | View approved only           |
| Orders (POs)    | ❌                  | View              | View, Close only | Create, Edit only (no Close) |
| Deliveries      | Full (own location) | Full              | Full             | ❌                           |
| Issues          | Full (own location) | Full              | Full             | ❌                           |
| Transfers       | Full (own location) | Full + Approve    | Full             | ❌                           |
| Master Data     | ❌                  | ❌                | Full             | ❌                           |
| Reconciliations | View totals         | Full              | Full             | ❌                           |
| Period Close    | ❌                  | Ready locations   | Full             | ❌                           |

**Note**: PO creation and editing is restricted to PROCUREMENT_SPECIALIST role only. PO closing is restricted to ADMIN only. PROCUREMENT_SPECIALIST cannot create deliveries or access the Dashboard.

### Rationale

- Separation of duties: Procurement doesn't need access to stock operations
- Security: Limit access to sensitive business data
- Matches organizational structure (procurement team)

### Required API Access (Server-Side Middleware)

The following API endpoints must be accessible to PROCUREMENT_SPECIALIST for the UI to function correctly:

| Endpoint               | Method           | Purpose                              |
| ---------------------- | ---------------- | ------------------------------------ |
| `/api/periods/current` | GET              | Display current period in UI header  |
| `/api/prfs/*`          | GET              | View approved PRFs (filtered by API) |
| `/api/pos/*`           | GET, POST, PATCH | Create/Edit POs (no Close)           |
| `/api/suppliers/*`     | GET              | View suppliers for PO dropdown       |
| `/api/items/*`         | GET              | View items for PO line items         |
| `/api/locations/*`     | GET              | View locations for location switcher |

**Blocked endpoints for PROCUREMENT_SPECIALIST**:

- `/api/pos/[id]/close` - Only ADMIN can close POs
- `/api/locations/[id]/deliveries/*` - Cannot create deliveries
- `/api/reports/deliveries` - Cannot view deliveries report
- Dashboard and all other non-Orders pages

**Note**: These requirements are enforced in `server/middleware/role-access.ts`.

---

## 7. Delivery-PO Linking

### Decision

Make PO selection **mandatory** for all new deliveries with delivery tracking.

### Migration Strategy

- Existing deliveries (po_id = NULL) remain unchanged
- New deliveries require po_id to be provided
- UI shows only OPEN POs in dropdown
- API validates po_id is required and references OPEN PO

### Rationale

- Ensures complete procurement traceability
- Prevents untracked purchases
- Supports variance analysis between ordered vs delivered

### Edge Cases

- No open POs: Display message, disable delivery creation
- Over-delivery: Requires Supervisor/Admin approval (see Section 7b)
- Partial delivery: PO stays OPEN until all lines fully delivered or manually closed

---

## 7b. Delivery Tracking (PO Line Fulfillment)

### Decision

Track cumulative delivered quantities on each PO line and auto-close POs when fully delivered.

### Implementation

**Database Schema:**

```prisma
// POLine - tracks what's been delivered
delivered_qty    Decimal  @default(0)  // Cumulative delivered quantity

// DeliveryLine - links to specific PO line
po_line_id       String?  @db.Uuid     // Link to PO line
over_delivery_approved Boolean @default(false)  // Approval status
```

**Delivery Tracking Logic:**

```typescript
// When delivery is posted:
1. For each delivery line, find the matching PO line (by po_line_id or item_id fallback)
2. Increment POLine.delivered_qty by the delivery line quantity
3. Check if all PO lines have delivered_qty >= quantity
4. If yes, auto-close the PO and linked PRF
```

**API Response Fields:**

```typescript
// PO lines include:
{
  quantity: string,
  delivered_qty: string,        // From database
  remaining_qty: string,        // Computed: quantity - delivered_qty
}

// Delivery API response includes:
{
  po_auto_closed: boolean,      // True if PO was auto-closed
}
```

### Rationale

- Enables real-time visibility into PO fulfillment status
- Pre-fills delivery forms with remaining quantities (not full PO quantities)
- Reduces manual tracking and data entry errors
- Automatically closes completed POs, reducing administrative burden

---

## 7c. Over-Delivery Approval Workflow

### Decision

Require Supervisor/Admin approval when delivery quantity exceeds PO line's remaining quantity.

### Implementation

**Detection:**

```typescript
// Over-delivery detected when:
delivery_line.quantity > po_line.remaining_qty;
// Where: remaining_qty = quantity - delivered_qty
```

**Workflow States:**

```
Operator saves draft with over-delivery
    │
    ├──[is_over_delivery = true, over_delivery_approved = false]
    │
    ▼
Email sent to Supervisors/Admins
    │
    ├──[Supervisor clicks "Approve"]──> over_delivery_approved = true
    │                                   Email sent to creator
    │                                   Operator can now post
    │
    └──[Supervisor clicks "Reject"]──> Rejection reason added to notes
                                       Email sent to creator
                                       Operator can edit delivery
```

**Role-Based Behavior:**
| Role | Can Save Draft | Can Post Over-Delivery | Requires Approval |
|------|---------------|----------------------|-------------------|
| OPERATOR | Yes | No (blocked) | Yes |
| SUPERVISOR | Yes | Yes (implicit) | No |
| ADMIN | Yes | Yes (implicit) | No |

**Email Notifications:**

1. `sendOverDeliveryApprovalNotification` - To Supervisors when draft saved
2. `sendOverDeliveryApprovedNotification` - To creator when approved
3. `sendOverDeliveryRejectedNotification` - To creator when rejected

### Rationale

- Provides oversight for purchase order variances
- Prevents unauthorized receipt of goods
- Maintains audit trail for over-delivery decisions
- Allows Supervisors/Admins to quickly approve legitimate over-deliveries

---

## 7d. Automatic PO Closure

### Decision

Automatically close POs when all line items have been fully delivered.

### Implementation

**Trigger Condition:**

```typescript
// After posting a delivery:
const poLines = await prisma.pOLine.findMany({ where: { po_id } });

const allFullyDelivered = poLines.every(
  (line) => parseFloat(line.delivered_qty) >= parseFloat(line.quantity)
);

if (allFullyDelivered) {
  // Auto-close PO
  await prisma.pO.update({ where: { id: poId }, data: { status: "CLOSED" } });

  // Also close linked PRF if exists and is APPROVED
  if (po.prf && po.prf.status === "APPROVED") {
    await prisma.pRF.update({ where: { id: po.prf.id }, data: { status: "CLOSED" } });
  }
}
```

**Response:**

```typescript
return {
  message: "Delivery posted. PO has been automatically closed.",
  po_auto_closed: true,
  // ...
};
```

### Rationale

- Reduces administrative burden of manual PO closure
- Ensures POs are closed promptly when complete
- Maintains data integrity (closed POs don't appear in dropdowns)
- Linked PRF closure maintains workflow consistency

---

## 8. Existing Codebase Patterns

### API Route Pattern (from existing codebase)

```typescript
// server/api/[resource]/index.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  // ... pagination, filtering
  return { data, pagination };
});
```

### Composable Pattern (from existing codebase)

```typescript
// app/composables/use[Resource].ts
export function use[Resource]() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const list = async (params) => { ... };
  const get = async (id) => { ... };
  const create = async (data) => { ... };
  const update = async (id, data) => { ... };
  const remove = async (id) => { ... };

  return { loading, error, list, get, create, update, remove };
}
```

### Form Component Pattern (from existing codebase)

- Use `<UForm>` with Zod schema validation
- Use `<UFormField>` for each input
- Use `v-model` for two-way binding
- Disable submit when offline via `useOnlineStatus()`

---

## 9. Open Questions Resolved

| Question              | Resolution                                 |
| --------------------- | ------------------------------------------ |
| PRF-to-PO cardinality | 1:1 (clarified in spec)                    |
| Rejected PRF handling | Clone to new DRAFT (clarified in spec)     |
| PO line item editing  | Fully editable (clarified in spec)         |
| Rejection reason      | Mandatory free-text (clarified in spec)    |
| Open PO editing       | Full edit until closed (clarified in spec) |

---

## 10. Dependencies & Integrations

### New npm Packages

```json
{
  "nodemailer": "^7.0.0"
}
```

### New Environment Variables

```env
# Office 365 SMTP Configuration
SMTP_USER=your-email@your-domain.com
SMTP_PASSWORD=your-smtp-password
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
EMAIL_FROM=your-email@your-domain.com
```

### Database Migration

- Add PRFLine, POLine models
- Extend PRF model with new fields
- Extend PO model with new fields
- Extend Supplier model with emails array
- Add PROCUREMENT_SPECIALIST to UserRole enum

---

## Summary

All NEEDS CLARIFICATION items have been resolved through:

1. Spec clarification session (5 questions answered)
2. Pattern analysis from existing codebase
3. Technology evaluation for email service

The implementation can proceed to Phase 1 (Design & Contracts).
