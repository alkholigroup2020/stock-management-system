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

| Resource        | OPERATOR            | SUPERVISOR        | ADMIN     | PROCUREMENT_SPECIALIST     |
| --------------- | ------------------- | ----------------- | --------- | -------------------------- |
| Dashboard       | ✅                  | ✅                | ✅        | ✅                         |
| Orders (PRFs)   | Create, View own    | View all, Approve | Full      | View approved only         |
| Orders (POs)    | ❌                  | View              | View only | Full CRUD (exclusive role) |
| Deliveries      | Full (own location) | Full              | Full      | View PO-linked only        |
| Issues          | Full (own location) | Full              | Full      | ❌                         |
| Transfers       | Full (own location) | Full + Approve    | Full      | ❌                         |
| Master Data     | ❌                  | ❌                | Full      | ❌                         |
| Reconciliations | View totals         | Full              | Full      | ❌                         |
| Period Close    | ❌                  | Ready locations   | Full      | ❌                         |

**Note**: PO creation, editing, and closing is restricted to PROCUREMENT_SPECIALIST role only. ADMINs can view POs but cannot create or modify them.

### Rationale

- Separation of duties: Procurement doesn't need access to stock operations
- Security: Limit access to sensitive business data
- Matches organizational structure (procurement team)

---

## 7. Delivery-PO Linking

### Decision

Make PO selection **mandatory** for all new deliveries.

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
- Over-delivery: Warn but allow (common in practice)
- Partial delivery: PO stays OPEN until manually closed

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
