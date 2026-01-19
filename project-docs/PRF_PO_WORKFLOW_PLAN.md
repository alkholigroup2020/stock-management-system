# PRF/PO Workflow Implementation Plan

## Overview
Implement a complete Purchase Requisition Form (PRF) / Purchase Order (PO) workflow with a new "Orders" page under the Transactions section. Includes email notifications, a new PROCUREMENT_SPECIALIST role, and mandatory delivery-PO linking.

## Workflow Summary
```
User creates PRF → DRAFT
       ↓
User submits → PENDING
       ↓
Supervisor approves → APPROVED (or REJECTED)
       ↓
Email notification sent to all PROCUREMENT_SPECIALIST users
       ↓
Procurement specialist logs in and creates PO from approved PRF → PO (OPEN)
       ↓
Email notification sent to supplier (using supplier email addresses)
       ↓
Link delivery to PO (MANDATORY) → Track delivery progress
       ↓
Close PO when complete → PO (CLOSED)
```

---

## Phase 1: Database Schema Changes

### 1.1 Add PROCUREMENT_SPECIALIST Role

**File:** `prisma/schema.prisma`

Update UserRole enum:
```prisma
enum UserRole {
  OPERATOR
  SUPERVISOR
  ADMIN
  PROCUREMENT_SPECIALIST
}
```

### 1.2 Add Supplier Email Fields

Update Supplier model:
```prisma
model Supplier {
  id              String     @id @default(uuid()) @db.Uuid
  code            String     @unique @db.VarChar(50)
  name            String     @db.VarChar(200)
  contact         String?
  emails          String[]   @default([])  // Multiple email addresses
  phone           String?    @db.VarChar(50)
  mobile          String?    @db.VarChar(50)
  vat_reg_no      String?    @db.VarChar(50)
  address         String?
  is_active       Boolean    @default(true)
  created_at      DateTime   @default(now()) @db.Timestamptz(6)
  deliveries      Delivery[]
  purchase_orders PO[]

  @@index([is_active])
  @@map("suppliers")
}
```

### 1.3 Add PRFLine Model (Based on Template)

```prisma
model PRFLine {
  id              String   @id @default(uuid()) @db.Uuid
  prf_id          String   @db.Uuid
  item_id         String?  @db.Uuid          // Optional - can be custom item
  item_description String  @db.VarChar(500)   // Custom description
  cost_code       String?  @db.VarChar(50)    // Cost Code / SPR
  stock_qty       Decimal? @db.Decimal(15, 4) // Current stock qty (reference)
  unit            Unit
  required_qty    Decimal  @db.Decimal(15, 4)
  estimated_price Decimal  @db.Decimal(15, 4)
  line_value      Decimal  @db.Decimal(15, 2) // required_qty * estimated_price
  notes           String?
  prf             PRF      @relation(fields: [prf_id], references: [id], onDelete: Cascade)
  item            Item?    @relation(fields: [item_id], references: [id])

  @@index([prf_id])
  @@index([item_id])
  @@map("prf_lines")
}
```

### 1.4 Update PRF Model (Based on Template)

```prisma
enum PRFType {
  URGENT
  DPA
  NORMAL
}

enum PRFCategory {
  MATERIAL
  CONSUMABLES
  SPARE_PARTS
  ASSET
  SERVICES
}

model PRF {
  id                      String       @id @default(uuid()) @db.Uuid
  prf_no                  String       @unique @db.VarChar(50)
  period_id               String       @db.Uuid
  location_id             String       @db.Uuid
  project_name            String?      @db.VarChar(200)
  prf_type                PRFType      @default(NORMAL)
  category                PRFCategory  @default(MATERIAL)
  expected_delivery_date  DateTime?    @db.Date
  is_reimbursable         Boolean      @default(false)
  status                  PRFStatus    @default(DRAFT)
  requested_by            String       @db.Uuid
  approved_by             String?      @db.Uuid
  request_date            DateTime     @db.Date
  approval_date           DateTime?    @db.Date
  total_value             Decimal      @default(0) @db.Decimal(15, 2)
  contact_person_name     String?      @db.VarChar(100)
  contact_person_phone    String?      @db.VarChar(50)
  receiver_name           String?      @db.VarChar(100)
  receiver_phone          String?      @db.VarChar(50)
  notes                   String?
  created_at              DateTime     @default(now()) @db.Timestamptz(6)
  updated_at              DateTime     @updatedAt @db.Timestamptz(6)
  lines                   PRFLine[]
  purchase_orders         PO[]
  approver                User?        @relation("PRFApprover", fields: [approved_by], references: [id])
  location                Location     @relation(fields: [location_id], references: [id])
  period                  Period       @relation(fields: [period_id], references: [id])
  requester               User         @relation("PRFRequester", fields: [requested_by], references: [id])

  @@index([period_id])
  @@index([location_id])
  @@index([status])
  @@index([request_date])
  @@index([prf_type])
  @@index([category])
  @@map("prfs")
}
```

### 1.5 Add POLine Model (Based on Template)

```prisma
model POLine {
  id                 String   @id @default(uuid()) @db.Uuid
  po_id              String   @db.Uuid
  item_id            String?  @db.Uuid
  item_code          String?  @db.VarChar(50)
  item_description   String   @db.VarChar(500)
  quantity           Decimal  @db.Decimal(15, 4)
  unit               Unit
  unit_price         Decimal  @db.Decimal(15, 4)
  discount_percent   Decimal  @default(0) @db.Decimal(5, 2)
  total_before_vat   Decimal  @db.Decimal(15, 2)
  vat_percent        Decimal  @default(15) @db.Decimal(5, 2)  // Saudi VAT 15%
  vat_amount         Decimal  @db.Decimal(15, 2)
  total_after_vat    Decimal  @db.Decimal(15, 2)
  notes              String?
  po                 PO       @relation(fields: [po_id], references: [id], onDelete: Cascade)
  item               Item?    @relation(fields: [item_id], references: [id])

  @@index([po_id])
  @@index([item_id])
  @@map("po_lines")
}
```

### 1.6 Update PO Model (Based on Template)

```prisma
model PO {
  id                    String     @id @default(uuid()) @db.Uuid
  po_no                 String     @unique @db.VarChar(50)
  prf_id                String?    @db.Uuid
  supplier_id           String     @db.Uuid
  quotation_ref         String?    @db.VarChar(100)  // Supplier's quotation reference
  ship_to_location_id   String?    @db.Uuid
  ship_to_contact       String?    @db.VarChar(100)
  ship_to_phone         String?    @db.VarChar(50)
  status                POStatus   @default(OPEN)
  total_before_discount Decimal    @default(0) @db.Decimal(15, 2)
  total_discount        Decimal    @default(0) @db.Decimal(15, 2)
  total_after_discount  Decimal    @default(0) @db.Decimal(15, 2)
  total_vat             Decimal    @default(0) @db.Decimal(15, 2)
  total_amount          Decimal    @default(0) @db.Decimal(15, 2)  // Final total
  payment_terms         String?    @db.VarChar(200)
  delivery_terms        String?    @db.VarChar(200)
  duration_days         Int?
  terms_conditions      String?
  notes                 String?
  created_by            String     @db.Uuid
  created_at            DateTime   @default(now()) @db.Timestamptz(6)
  updated_at            DateTime   @updatedAt @db.Timestamptz(6)
  lines                 POLine[]
  deliveries            Delivery[]
  prf                   PRF?       @relation(fields: [prf_id], references: [id])
  supplier              Supplier   @relation(fields: [supplier_id], references: [id])
  ship_to_location      Location?  @relation("POShipTo", fields: [ship_to_location_id], references: [id])
  creator               User       @relation("POCreator", fields: [created_by], references: [id])

  @@index([prf_id])
  @@index([supplier_id])
  @@index([status])
  @@index([created_by])
  @@map("purchase_orders")
}
```

### 1.7 Update Delivery Model (Mandatory PO Link)

Change `po_id` from optional to required:
```prisma
model Delivery {
  // ... existing fields ...
  po_id          String         @db.Uuid  // Changed from String? to String (REQUIRED)
  // ... rest unchanged ...
}
```

### 1.8 Migration Command
```bash
pnpm db:migrate dev --name add_prf_po_workflow
```

---

## Phase 2: TypeScript Type Definitions

### File: `shared/types/database.ts`

### 2.1 Update UserRole
```typescript
export type UserRole = "OPERATOR" | "SUPERVISOR" | "ADMIN" | "PROCUREMENT_SPECIALIST";
```

### 2.2 Add New Enums
```typescript
export type PRFType = "URGENT" | "DPA" | "NORMAL";
export type PRFCategory = "MATERIAL" | "CONSUMABLES" | "SPARE_PARTS" | "ASSET" | "SERVICES";
```

### 2.3 Update Supplier Interface
```typescript
export interface Supplier {
  id: string;
  code: string;
  name: string;
  contact: string | null;
  emails: string[];           // Multiple emails
  phone: string | null;
  mobile: string | null;
  vat_reg_no: string | null;
  address: string | null;
  is_active: boolean;
  created_at: Date | string;
}
```

### 2.4 Add PRFLine Interface
```typescript
export interface PRFLine {
  id: string;
  prf_id: string;
  item_id: string | null;
  item_description: string;
  cost_code: string | null;
  stock_qty: DecimalValue | null;
  unit: Unit;
  required_qty: DecimalValue;
  estimated_price: DecimalValue;
  line_value: DecimalValue;
  notes: string | null;
}
```

### 2.5 Update PRF Interface
```typescript
export interface PRF {
  id: string;
  prf_no: string;
  period_id: string;
  location_id: string;
  project_name: string | null;
  prf_type: PRFType;
  category: PRFCategory;
  expected_delivery_date: Date | string | null;
  is_reimbursable: boolean;
  status: PRFStatus;
  requested_by: string;
  approved_by: string | null;
  request_date: Date | string;
  approval_date: Date | string | null;
  total_value: DecimalValue;
  contact_person_name: string | null;
  contact_person_phone: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  notes: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}
```

### 2.6 Add POLine Interface
```typescript
export interface POLine {
  id: string;
  po_id: string;
  item_id: string | null;
  item_code: string | null;
  item_description: string;
  quantity: DecimalValue;
  unit: Unit;
  unit_price: DecimalValue;
  discount_percent: DecimalValue;
  total_before_vat: DecimalValue;
  vat_percent: DecimalValue;
  vat_amount: DecimalValue;
  total_after_vat: DecimalValue;
  notes: string | null;
}
```

### 2.7 Update PO Interface
```typescript
export interface PO {
  id: string;
  po_no: string;
  prf_id: string | null;
  supplier_id: string;
  quotation_ref: string | null;
  ship_to_location_id: string | null;
  ship_to_contact: string | null;
  ship_to_phone: string | null;
  status: POStatus;
  total_before_discount: DecimalValue;
  total_discount: DecimalValue;
  total_after_discount: DecimalValue;
  total_vat: DecimalValue;
  total_amount: DecimalValue;
  payment_terms: string | null;
  delivery_terms: string | null;
  duration_days: number | null;
  terms_conditions: string | null;
  notes: string | null;
  created_by: string;
  created_at: Date | string;
  updated_at: Date | string;
}
```

---

## Phase 3: Email Notification Service

### 3.1 New Server Utility

**File:** `server/utils/email.ts`

```typescript
// Email service using Resend or Nodemailer
export async function sendPRFApprovalEmail(prf: PRF, procurementUsers: User[]): Promise<void>
export async function sendPOToSupplier(po: PO, supplier: Supplier): Promise<void>
```

### 3.2 Environment Variables
```env
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@amos-sa.com
```

### 3.3 Email Triggers
- **PRF Approval**: When PRF status changes to APPROVED, send to all PROCUREMENT_SPECIALIST users
- **PO Creation**: When PO is created, send to all supplier email addresses

---

## Phase 4: Permissions

### File: `app/composables/usePermissions.ts`

### New Functions:
| Function | Description | Roles |
|----------|-------------|-------|
| `isProcurementSpecialist` | Check if user is procurement | PROCUREMENT_SPECIALIST |
| `canViewOrders()` | Access Orders page | All authenticated |
| `canCreatePRF()` | Create PRF | OPERATOR, SUPERVISOR, ADMIN |
| `canApprovePRF()` | Approve/Reject PRF | SUPERVISOR, ADMIN |
| `canCreatePO()` | Create PO from PRF | PROCUREMENT_SPECIALIST, ADMIN |
| `canClosePO()` | Close PO | PROCUREMENT_SPECIALIST, ADMIN |

### PROCUREMENT_SPECIALIST Role Access:
- Orders page (full access)
- View approved PRFs
- Create/Edit/Close POs
- View deliveries linked to POs
- NO access to: Master Data, Issues, Transfers, Reconciliations, Period Close

---

## Phase 5: API Endpoints

### PRF Endpoints (`server/api/prfs/`):
| File | Method | Purpose |
|------|--------|---------|
| `index.get.ts` | GET | List PRFs (with filters) |
| `index.post.ts` | POST | Create PRF with lines |
| `[id].get.ts` | GET | Get PRF with lines |
| `[id].patch.ts` | PATCH | Update draft PRF |
| `[id].delete.ts` | DELETE | Delete draft PRF |
| `[id]/submit.patch.ts` | PATCH | Submit for approval |
| `[id]/approve.patch.ts` | PATCH | Approve PRF + trigger email |
| `[id]/reject.patch.ts` | PATCH | Reject PRF |

### PO Endpoints (`server/api/pos/`):
| File | Method | Purpose |
|------|--------|---------|
| `index.get.ts` | GET | List POs (with filters) |
| `index.post.ts` | POST | Create PO + trigger email to supplier |
| `[id].get.ts` | GET | Get PO with lines and deliveries |
| `[id].patch.ts` | PATCH | Update open PO |
| `[id]/close.patch.ts` | PATCH | Close PO |

### Update Supplier Endpoint:
- `server/api/suppliers/[id].patch.ts` - Support emails array field

---

## Phase 6: Frontend Pages

### Page Structure:
```
app/pages/orders/
├── index.vue          # Tabs: PRFs | POs | Stock Levels
├── prfs/
│   ├── create.vue     # Create PRF form
│   └── [id].vue       # PRF detail + approval
└── pos/
    ├── create.vue     # Create PO from PRF
    └── [id].vue       # PO detail + delivery tracking
```

### 6.1 Orders Index Page (with UTabs)

**File:** `app/pages/orders/index.vue`

```vue
<template>
  <UTabs :items="tabs" class="w-full">
    <template #prfs>
      <!-- PRFs list with filters and New PRF button -->
    </template>
    <template #pos>
      <!-- POs list with filters -->
    </template>
    <template #stock>
      <!-- Stock levels reference table -->
    </template>
  </UTabs>
</template>
```

**Tab Items:**
1. **PRFs** - List with status/date/location filters, "New PRF" button
2. **Purchase Orders** - List with status/supplier filters
3. **Stock Levels** - Current stock (read-only reference)

### 6.2 PRF Create Page Fields (from template):
- Location (pre-filled)
- Project Name
- PR Type: Urgent / DPA / Normal (radio buttons)
- Category: Material / Consumables / Spare Parts / Asset / Services (dropdown)
- Expected Delivery Date
- Reimbursable checkbox
- Contact Person (name + phone)
- Authorized Receiver (name + phone)
- Line Items Table:
  - S/N (auto)
  - Cost Code/SPR
  - Item Description (text or item selector)
  - Stock Qty (auto-filled if item selected)
  - Unit
  - Required Qty
  - Approx Value (estimated price)
  - Notes
- Notes/Comments

### 6.3 PO Create Page Fields (from template):
- PRF Reference (pre-filled if from PRF)
- Supplier (required, shows VAT/contact info)
- Quotation Reference
- Ship To Location
- Ship To Contact + Phone
- Line Items Table:
  - Item Code
  - Description
  - QTY
  - UoM
  - Unit Price
  - Disc %
  - Total Before VAT (calculated)
  - VAT % (default 15%)
  - VAT Amount (calculated)
  - Total After VAT (calculated)
- Payment Terms
- Delivery Terms
- Duration (days)
- Terms & Conditions
- Totals section (auto-calculated)

---

## Phase 7: Components

### New Components:
```
app/components/orders/
├── PRFForm.vue              # PRF form with all fields
├── POForm.vue               # PO form with VAT calculations
├── PRFLineItemsTable.vue    # Editable PRF lines
├── POLineItemsTable.vue     # Editable PO lines with VAT
├── PRFStatusBadge.vue       # Status badge
├── POStatusBadge.vue        # Status badge
├── PRFApprovalActions.vue   # Approve/Reject buttons
└── StockLevelsTable.vue     # Read-only stock reference
```

---

## Phase 8: Navigation & Layout Updates

### 8.1 Update Navigation (`app/layouts/default.vue`)

Add "Orders" to Transactions section:
```typescript
if (permissions.canViewOrders()) {
  transactionChildren.push({
    label: "Orders",
    to: "/orders",
    permission: true,
  });
}
```

### 8.2 PROCUREMENT_SPECIALIST Menu
For PROCUREMENT_SPECIALIST role, show only:
- Dashboard
- Orders (full access)
- Deliveries (view only for PO-linked)

### 8.3 Page Title Mappings
```typescript
orders: "Orders",
"orders-prfs-create": "Create PRF",
"orders-prfs-id": "PRF Details",
"orders-pos-create": "Create PO",
"orders-pos-id": "PO Details",
```

---

## Phase 9: Delivery Integration (MANDATORY)

### 9.1 Update Delivery Create Page

**File:** `app/pages/deliveries/create.vue`

- Make PO selection REQUIRED (not optional)
- PO dropdown filters to OPEN status only
- When PO selected, auto-populate supplier and line items

### 9.2 Validation
- Block delivery creation without PO
- Warn if delivery quantities exceed PO quantities

---

## Phase 10: Supplier Management Updates

### Update Supplier Forms

**Files:**
- `app/pages/suppliers/create.vue`
- `app/pages/suppliers/[id]/edit.vue`

Add fields:
- Email addresses (multiple - array input)
- Phone
- Mobile
- VAT Registration Number
- Address

---

## Implementation Order

1. **Database**: Schema + migration
2. **Types**: TypeScript interfaces
3. **Permissions**: New functions + PROCUREMENT_SPECIALIST handling
4. **Email Service**: Server utility + env setup
5. **PRF API**: All endpoints
6. **PRF Composable**: usePRFs()
7. **PO API**: All endpoints
8. **PO Composable**: usePOs()
9. **Supplier Updates**: Email field support
10. **Orders Page**: Main page with UTabs
11. **PRF Pages**: Create + Detail
12. **PO Pages**: Create + Detail
13. **Components**: Reusable forms/tables
14. **Navigation**: Sidebar updates
15. **Delivery Updates**: Mandatory PO link

---

## Verification Plan

1. **Database**: `pnpm db:studio` - verify new tables/fields
2. **Typecheck**: `pnpm typecheck` - zero errors
3. **Dev Server**: `pnpm dev` at http://localhost:3000
4. **Manual Testing**:
   - Create PRF with all fields
   - Submit and approve PRF
   - Verify email sent to procurement (check logs)
   - Create PO from approved PRF
   - Verify email sent to supplier
   - Create delivery linked to PO
   - Verify delivery cannot be created without PO
5. **Playwright**: Browser MCP for UI verification

---

## Key Files Summary

| Category | Files |
|----------|-------|
| Schema | `prisma/schema.prisma` |
| Types | `shared/types/database.ts` |
| Email | `server/utils/email.ts` |
| Permissions | `app/composables/usePermissions.ts` |
| PRF API | `server/api/prfs/*.ts` (8 files) |
| PO API | `server/api/pos/*.ts` (5 files) |
| Composables | `app/composables/usePRFs.ts`, `app/composables/usePOs.ts` |
| Pages | `app/pages/orders/**/*.vue` (5 files) |
| Components | `app/components/orders/*.vue` (8 files) |
| Navigation | `app/layouts/default.vue` |
| Suppliers | `app/pages/suppliers/create.vue`, `app/pages/suppliers/[id]/edit.vue` |
| Deliveries | `app/pages/deliveries/create.vue` |
