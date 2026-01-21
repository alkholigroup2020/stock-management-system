# Implementation Plan: PRF/PO Workflow

**Branch**: `001-prf-po-workflow` | **Date**: 2026-01-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-prf-po-workflow/spec.md`

## Summary

Implement a complete Purchase Requisition Form (PRF) and Purchase Order (PO) workflow with:

- New PROCUREMENT_SPECIALIST role with limited access (only role that can create/edit POs)
- PRF creation, submission, and approval workflow
- PO creation from approved PRFs with VAT calculations
- Email notifications for PRF approval (to procurement specialists)
- Mandatory PO-Delivery linking
- PRF clone functionality for rejected PRFs

**Note**: PO creation does not send email notifications to suppliers. Supplier email addresses are stored for reference only.

## Technical Context

**Language/Version**: TypeScript 5.x (Nuxt 4 / Vue 3)
**Primary Dependencies**: Nuxt 4, Nuxt UI, Pinia, Prisma, H3/Nitro, Zod
**Storage**: PostgreSQL 15+ via Supabase (Prisma ORM)
**Testing**: Vitest (unit), Playwright MCP (E2E verification)
**Target Platform**: Web SPA (Vercel deployment)
**Project Type**: Monolithic Nuxt 4 web application
**Performance Goals**: PRF/PO operations < 1s, Email delivery < 1 minute
**Constraints**: Offline-aware UI (disable actions when offline), 15% VAT rate (Saudi Arabia)
**Scale/Scope**: Multi-location stock management, ~50 screens total

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                          | Status  | Notes                                                                                 |
| ---------------------------------- | ------- | ------------------------------------------------------------------------------------- |
| I. Data Integrity First            | ✅ PASS | PRF/PO transactions tied to periods; audit trail via created_by/approved_by           |
| II. Type Safety Non-Negotiable     | ✅ PASS | All new types to be defined in shared/types/database.ts; Zod validation on all inputs |
| III. Location-Centric Architecture | ✅ PASS | PRFs tied to locations; POs inherit context from PRF                                  |
| IV. Approval Workflow Compliance   | ✅ PASS | PRF requires Supervisor approval; workflow states enforced                            |
| V. Accessible by Design            | ✅ PASS | Will use Nuxt UI components; follow UI_DESIGN_SYSTEM.md                               |
| VI. Offline-Aware UI               | ✅ PASS | useOnlineStatus() will disable action buttons when offline                            |
| VII. Server-Side Security          | ✅ PASS | API routes validate roles; PROCUREMENT_SPECIALIST role checked server-side            |
| VIII. Consistent Code Standards    | ✅ PASS | Follow Prettier config; pnpm typecheck must pass                                      |

**No violations requiring justification.**

## Project Structure

### Documentation (this feature)

```text
specs/001-prf-po-workflow/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma        # Extended with PRFLine, POLine, PRF/PO/Supplier updates

shared/types/
└── database.ts          # Extended with new types and enums

app/
├── composables/
│   ├── usePermissions.ts  # Extended with PROCUREMENT_SPECIALIST permissions
│   ├── usePRFs.ts         # NEW: PRF CRUD operations
│   └── usePOs.ts          # NEW: PO CRUD operations
├── components/orders/
│   ├── PRFForm.vue              # NEW: PRF creation/edit form
│   ├── POForm.vue               # NEW: PO creation/edit form
│   ├── PRFLineItemsTable.vue    # NEW: Editable PRF line items
│   ├── POLineItemsTable.vue     # NEW: Editable PO lines with VAT
│   ├── PRFStatusBadge.vue       # NEW: Status badge component
│   ├── POStatusBadge.vue        # NEW: Status badge component
│   ├── PRFApprovalActions.vue   # NEW: Approve/Reject buttons
│   └── StockLevelsTable.vue     # NEW: Read-only stock reference
├── pages/orders/
│   ├── index.vue          # NEW: Orders page with tabs (PRFs, POs, Stock)
│   ├── prfs/
│   │   ├── create.vue     # NEW: Create PRF
│   │   └── [id].vue       # NEW: PRF detail + approval
│   └── pos/
│       ├── create.vue     # NEW: Create PO from PRF
│       └── [id].vue       # NEW: PO detail + delivery tracking
├── pages/suppliers/
│   ├── create.vue         # MODIFY: Add email fields
│   └── [id]/edit.vue      # MODIFY: Add email fields
└── pages/deliveries/
    └── create.vue         # MODIFY: Make PO selection mandatory

server/
├── api/prfs/
│   ├── index.get.ts           # NEW: List PRFs
│   ├── index.post.ts          # NEW: Create PRF
│   ├── [id].get.ts            # NEW: Get PRF
│   ├── [id].patch.ts          # NEW: Update draft PRF
│   ├── [id].delete.ts         # NEW: Delete draft PRF
│   ├── [id]/submit.patch.ts   # NEW: Submit for approval
│   ├── [id]/approve.patch.ts  # NEW: Approve PRF
│   ├── [id]/reject.patch.ts   # NEW: Reject PRF
│   └── [id]/clone.post.ts     # NEW: Clone PRF
├── api/pos/
│   ├── index.get.ts           # NEW: List POs
│   ├── index.post.ts          # NEW: Create PO
│   ├── [id].get.ts            # NEW: Get PO
│   ├── [id].patch.ts          # NEW: Update open PO
│   └── [id]/close.patch.ts    # NEW: Close PO
├── api/suppliers/
│   └── [id].patch.ts          # MODIFY: Support emails array
└── utils/
    └── email.ts               # NEW: Email notification service
```

**Structure Decision**: Monolithic Nuxt 4 architecture with frontend in `/app/` and backend in `/server/`. All new pages under `/orders/` following existing patterns.

## Complexity Tracking

> No constitution violations requiring justification.

| Area             | Complexity | Justification                                                   |
| ---------------- | ---------- | --------------------------------------------------------------- |
| Email Service    | Low        | Simple SMTP via environment variables; no external dependencies |
| VAT Calculations | Low        | Fixed 15% rate; standard arithmetic                             |
| PRF/PO Workflow  | Medium     | Standard approval workflow matching existing Transfer pattern   |
