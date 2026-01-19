# Quickstart: PRF/PO Workflow

**Feature**: 001-prf-po-workflow
**Date**: 2026-01-19

## Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 15+ (via Supabase)
- Resend API key for email notifications

## Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

New dependency to add:
```bash
pnpm add resend
```

### 2. Environment Variables

Add to `.env`:

```env
# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@amos-sa.com
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
- [ ] Approve PRF as Supervisor
- [ ] Verify email sent to PROCUREMENT_SPECIALIST users
- [ ] Reject PRF with reason as Supervisor
- [ ] Clone rejected PRF

### PO Workflow
- [ ] Create PO from approved PRF as Procurement Specialist
- [ ] Verify VAT calculations (15%)
- [ ] Verify email sent to supplier
- [ ] Edit open PO (add/remove lines)
- [ ] Close PO
- [ ] Verify linked PRF marked as CLOSED

### Delivery Integration
- [ ] Create delivery - PO selection is mandatory
- [ ] Verify only OPEN POs appear in dropdown
- [ ] Verify supplier auto-populated from PO

### Role Permissions
- [ ] PROCUREMENT_SPECIALIST sees only: Dashboard, Orders, Deliveries (limited)
- [ ] PROCUREMENT_SPECIALIST cannot access: Master Data, Issues, Transfers, etc.
- [ ] OPERATOR can create PRF but not PO
- [ ] SUPERVISOR can approve/reject PRF

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
1. Check `RESEND_API_KEY` in `.env`
2. Verify `EMAIL_FROM` domain is verified in Resend
3. Check console for email service logs
4. Supplier must have at least one email in `emails` array

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
