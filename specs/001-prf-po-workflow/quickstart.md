# Quickstart: PRF/PO Workflow

**Feature**: 001-prf-po-workflow
**Date**: 2026-01-19

## Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 15+ (via Supabase)
- Office 365 SMTP credentials for email notifications

## Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

New dependencies to add:

```bash
pnpm add nodemailer
pnpm add -D @types/nodemailer
```

### 2. Environment Variables

Add to `.env`:

```env
# Email Service (Office 365 SMTP)
SMTP_USER=your-email@your-domain.com
SMTP_PASSWORD=your-smtp-password
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
EMAIL_FROM=your-email@your-domain.com
```

### 3. Database Migration

```bash
# Generate migration for new schema changes
pnpm db:migrate dev --name add_prf_po_workflow

# Or for prototyping (development only)
pnpm db:push
```

### 4. Run Development Server

```bash
pnpm dev
```

Application available at: http://localhost:3000

---

## Implementation Order

### Phase 1: Database & Types (Foundation)

1. Update `prisma/schema.prisma` with new models and enums
2. Run database migration
3. Update `shared/types/database.ts` with new TypeScript interfaces

### Phase 2: Backend API

4. Create `server/utils/email.ts` - Email notification service
5. Create PRF API endpoints (`server/api/prfs/`)
6. Create PO API endpoints (`server/api/pos/`)
7. Update Supplier API endpoints with email support

### Phase 3: Composables & Permissions

8. Update `app/composables/usePermissions.ts` - Add PROCUREMENT_SPECIALIST role
9. Create `app/composables/usePRFs.ts` - PRF CRUD operations
10. Create `app/composables/usePOs.ts` - PO CRUD operations

### Phase 4: Frontend Components

11. Create status badge components
12. Create line item table components (PRF and PO)
13. Create form components (PRF and PO)
14. Create approval actions component

### Phase 5: Pages

15. Create Orders index page with tabs
16. Create PRF create/detail pages
17. Create PO create/detail pages
18. Update Supplier pages with email fields
19. Update Delivery create page with mandatory PO selection

### Phase 6: Navigation & Integration

20. Update navigation for Orders menu item
21. Update navigation for PROCUREMENT_SPECIALIST role restrictions

---

## Key Files Reference

### Schema Changes

```
prisma/schema.prisma
├── UserRole enum (add PROCUREMENT_SPECIALIST)
├── PRFType enum (new)
├── PRFCategory enum (new)
├── PRFStatus enum (add CLOSED)
├── Supplier model (add emails, phone, mobile, vat_reg_no, address)
├── PRF model (add new fields)
├── PRFLine model (new)
├── PO model (add new fields)
└── POLine model (new)
```

### API Routes

```
server/api/
├── prfs/
│   ├── index.get.ts
│   ├── index.post.ts
│   ├── [id].get.ts
│   ├── [id].patch.ts
│   ├── [id].delete.ts
│   └── [id]/
│       ├── submit.patch.ts
│       ├── approve.patch.ts
│       ├── reject.patch.ts
│       └── clone.post.ts
├── pos/
│   ├── index.get.ts
│   ├── index.post.ts
│   ├── open.get.ts
│   ├── [id].get.ts
│   ├── [id].patch.ts
│   └── [id]/
│       ├── close.patch.ts
│       └── resend-email.post.ts
└── suppliers/
    └── [id].patch.ts (modify)
```

### Components

```
app/components/orders/
├── PRFForm.vue
├── POForm.vue
├── PRFLineItemsTable.vue
├── POLineItemsTable.vue
├── PRFStatusBadge.vue
├── POStatusBadge.vue
├── PRFApprovalActions.vue
└── StockLevelsTable.vue
```

### Pages

```
app/pages/orders/
├── index.vue
├── prfs/
│   ├── create.vue
│   └── [id].vue
└── pos/
    ├── create.vue
    └── [id].vue
```

---

## Testing Checklist

### PRF Workflow

- [ ] Create PRF as Operator
- [ ] Add/edit/remove line items
- [ ] Submit PRF for approval
- [ ] Verify email sent to all SUPERVISOR and ADMIN users (PRF submission notification)
- [ ] Approve PRF as Supervisor
- [ ] Verify email sent to PROCUREMENT_SPECIALIST users (PRF approval notification)
- [ ] Reject PRF with reason as Supervisor
- [ ] Verify email sent to original requester with rejection reason (PRF rejection notification)
- [ ] Clone rejected PRF

### PO Workflow

- [ ] Create PO from approved PRF as Procurement Specialist (only PROCUREMENT_SPECIALIST role can create POs)
- [ ] Verify VAT calculations (15%)
- [ ] Verify no email is sent to supplier on PO creation
- [ ] Edit open PO (add/remove lines) as Procurement Specialist
- [ ] Verify PROCUREMENT_SPECIALIST cannot see "Close PO" button
- [ ] Close PO as Admin or Supervisor (ADMIN and SUPERVISOR can close POs)
- [ ] Verify linked PRF marked as CLOSED
- [ ] Verify email sent to original PRF requester (PO closed notification)

### Delivery Integration

- [ ] Create delivery - PO selection is mandatory
- [ ] Verify only OPEN POs appear in dropdown
- [ ] Verify supplier auto-populated from PO

### Role Permissions

- [ ] PROCUREMENT_SPECIALIST sees only: Orders (no Dashboard, no Deliveries)
- [ ] PROCUREMENT_SPECIALIST cannot access: Dashboard, Deliveries, Master Data, Issues, Transfers, etc.
- [ ] PROCUREMENT_SPECIALIST can create/edit POs but NOT close them or create deliveries
- [ ] OPERATOR can create PRF but not PO
- [ ] SUPERVISOR can approve/reject PRF
- [ ] ADMIN and SUPERVISOR can view POs and close them (but cannot create/edit POs)

---

## Common Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm typecheck        # Type checking
pnpm lint             # Linting
pnpm format           # Format code

# Database
pnpm db:push          # Push schema (dev only)
pnpm db:migrate dev   # Create migration
pnpm db:studio        # Open Prisma Studio

# Testing
pnpm test             # Run tests
```

---

## Troubleshooting

### Email Not Sending

1. Check `SMTP_USER` and `SMTP_PASSWORD` in `.env`
2. Verify `EMAIL_FROM` matches your SMTP_USER or an authorized alias
3. Ensure SMTP_HOST is `smtp.office365.com` and SMTP_PORT is `587`
4. Check console for email service logs (emails are logged in development mode)
5. If MFA is enabled on O365, create an App Password instead of using your regular password
6. Verify users have valid email addresses in the database
7. Check API response `email_sent` flag to confirm notification status
8. Ensure at least one user exists with the recipient role (e.g., PROCUREMENT_SPECIALIST, SUPERVISOR, or ADMIN)

### PRF/PO Number Conflicts

- Numbers are auto-generated sequentially
- If conflicts occur, check for concurrent requests
- Consider adding database-level sequence in production

### Permission Denied Errors

1. Verify user role in database
2. Check `usePermissions.ts` for role checks
3. Verify API middleware validates role correctly

### VAT Calculation Mismatch

- All calculations use Decimal with 2-4 decimal places
- Frontend should match backend calculation logic
- Use the calculation formulas from `research.md`

### PRF Dropdown Empty in PO Creation

If the PRF dropdown shows no items or errors when creating a PO:

1. Verify the `/api/prfs` endpoint returns `purchase_orders` array in the response
2. Check that there are APPROVED PRFs without existing POs
3. Ensure the user has PROCUREMENT_SPECIALIST role with location assignments
4. Check browser console for `ComboboxItem` errors - this may indicate empty value keys in dropdown items
