# Data Model: PRF/PO Workflow

**Feature**: 001-prf-po-workflow
**Date**: 2026-01-19

## Overview

This document defines the data model changes required for the PRF/PO workflow feature. Changes are additive to the existing schema unless marked as MODIFY.

### Document Numbering Enhancement

PRF, PO, and Delivery document numbers follow an enhanced format that includes location context and date:

**Format**: `{Prefix}-{LocationName}-{DD}-{Mon}-{YYYY}-{NN}`

Where:

- `Prefix`: PRF, PO, or DLV
- `LocationName`: Location name converted to uppercase, spaces replaced with hyphens (e.g., KITCHEN, CENTRAL-STORE)
- `DD`: Two-digit day (01-31)
- `Mon`: Three-letter month abbreviation (Jan, Feb, Mar, etc.)
- `YYYY`: Four-digit year
- `NN`: Two-digit sequential number per location+date combination (01-99)

**Examples**:

- `PRF-KITCHEN-27-Jan-2026-01` (first PRF for Kitchen on Jan 27, 2026)
- `PRF-KITCHEN-27-Jan-2026-02` (second PRF for Kitchen on same day)
- `PO-KITCHEN-27-Jan-2026-01` (PO created from Kitchen PRF)
- `DLV-STORE-27-Jan-2026-03` (third delivery for Store on Jan 27, 2026)

**Implementation Notes**:

- PO numbers use the PRF's location name (since POs are created from PRFs)
- Sequential numbers restart daily for each location
- Existing documents retain their old format (no migration required)
- Location name sanitization removes special characters except hyphens

---

## 1. Enum Changes

### UserRole (MODIFY)

Add new role for procurement specialists.

```prisma
enum UserRole {
  OPERATOR
  SUPERVISOR
  ADMIN
  PROCUREMENT_SPECIALIST  // NEW
}
```

### PRFType (NEW)

Classification of purchase requisitions.

```prisma
enum PRFType {
  URGENT   // High priority, expedited processing
  DPA      // Direct Purchase Approval
  NORMAL   // Standard processing
}
```

### PRFCategory (NEW)

Category of items being requested.

```prisma
enum PRFCategory {
  FOOD
  CLEANING
  OTHER
}
```

### PRFStatus (MODIFY)

Add CLOSED status for completed PRFs.

```prisma
enum PRFStatus {
  DRAFT
  PENDING
  APPROVED
  REJECTED
  CLOSED    // NEW - auto-set when linked PO is closed
}
```

---

## 2. Entity Changes

### Supplier (MODIFY)

Add email addresses and contact details.

```prisma
model Supplier {
  id              String     @id @default(uuid()) @db.Uuid
  code            String     @unique @db.VarChar(50)
  name            String     @db.VarChar(200)
  contact         String?
  emails          String[]   @default([])  // NEW: Multiple email addresses
  phone           String?    @db.VarChar(50)  // NEW
  mobile          String?    @db.VarChar(50)  // NEW
  vat_reg_no      String?    @db.VarChar(50)  // NEW
  address         String?                      // NEW
  is_active       Boolean    @default(true)
  created_at      DateTime   @default(now()) @db.Timestamptz(6)
  deliveries      Delivery[]
  purchase_orders PO[]

  @@index([is_active])
  @@map("suppliers")
}
```

**New Fields:**
| Field | Type | Description |
|-------|------|-------------|
| emails | String[] | Array of email addresses for supplier contact (stored for reference, not used for automatic notifications) |
| phone | String? | Office phone number |
| mobile | String? | Mobile phone number |
| vat_reg_no | String? | VAT registration number (Saudi Arabia) |
| address | String? | Full mailing address |

---

### PRF (MODIFY)

Extend with additional fields from the PRF template.

```prisma
model PRF {
  id                      String       @id @default(uuid()) @db.Uuid
  prf_no                  String       @unique @db.VarChar(50)  // Format: PRF-{LocationName}-{DD}-{Mon}-{YYYY}-{NN}
  period_id               String       @db.Uuid
  location_id             String       @db.Uuid
  project_name            String?      @db.VarChar(200)         // NEW
  prf_type                PRFType      @default(NORMAL)         // NEW
  category                PRFCategory  @default(FOOD)           // NEW
  expected_delivery_date  DateTime?    @db.Date                 // NEW
  status                  PRFStatus    @default(DRAFT)
  requested_by            String       @db.Uuid
  approved_by             String?      @db.Uuid
  request_date            DateTime     @db.Date
  approval_date           DateTime?    @db.Date
  rejection_reason        String?                                // NEW
  total_value             Decimal      @default(0) @db.Decimal(15, 2)  // NEW
  contact_person_name     String?      @db.VarChar(100)         // NEW
  contact_person_phone    String?      @db.VarChar(50)          // NEW
  receiver_name           String?      @db.VarChar(100)         // NEW
  receiver_phone          String?      @db.VarChar(50)          // NEW
  notes                   String?
  created_at              DateTime     @default(now()) @db.Timestamptz(6)
  updated_at              DateTime     @updatedAt @db.Timestamptz(6)
  lines                   PRFLine[]                              // NEW relation
  purchase_orders         PO[]
  approver                User?        @relation("PRFApprover", fields: [approved_by], references: [id])
  location                Location     @relation(fields: [location_id], references: [id])
  period                  Period       @relation(fields: [period_id], references: [id])
  requester               User         @relation("PRFRequester", fields: [requested_by], references: [id])

  @@index([period_id])
  @@index([location_id])
  @@index([status])
  @@index([request_date])
  @@index([prf_type])      // NEW
  @@index([category])      // NEW
  @@map("prfs")
}
```

**New Fields:**
| Field | Type | Description |
|-------|------|-------------|
| project_name | String? | Associated project name |
| prf_type | PRFType | URGENT, DPA, or NORMAL |
| category | PRFCategory | Category classification (FOOD, CLEANING, OTHER) |
| expected_delivery_date | DateTime? | Requested delivery date |
| rejection_reason | String? | Mandatory reason when rejected |
| total_value | Decimal | Sum of all line values |
| contact_person_name | String? | Contact for delivery coordination |
| contact_person_phone | String? | Contact phone number |
| receiver_name | String? | Authorized receiver name |
| receiver_phone | String? | Receiver phone number |

---

### PRFLine (NEW)

Individual line items on a PRF.

```prisma
model PRFLine {
  id               String   @id @default(uuid()) @db.Uuid
  prf_id           String   @db.Uuid
  item_id          String?  @db.Uuid          // Optional - can be custom item
  item_description String   @db.VarChar(500)   // Custom description
  cost_code        String?  @db.VarChar(50)    // Cost Code / SPR
  stock_qty        Decimal? @db.Decimal(15, 4) // Current stock qty (reference)
  unit             Unit
  required_qty     Decimal  @db.Decimal(15, 4)
  estimated_price  Decimal  @db.Decimal(15, 4)
  line_value       Decimal  @db.Decimal(15, 2) // required_qty × estimated_price
  notes            String?
  prf              PRF      @relation(fields: [prf_id], references: [id], onDelete: Cascade)
  item             Item?    @relation(fields: [item_id], references: [id])

  @@index([prf_id])
  @@index([item_id])
  @@map("prf_lines")
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| prf_id | UUID | Yes | Parent PRF reference |
| item_id | UUID | No | Optional link to Item master |
| item_description | String | Yes | Free-text description |
| cost_code | String | No | Cost center / SPR code |
| stock_qty | Decimal | No | Reference stock quantity |
| unit | Unit | Yes | Unit of measure |
| required_qty | Decimal | Yes | Quantity requested |
| estimated_price | Decimal | Yes | Estimated unit price |
| line_value | Decimal | Yes | Calculated: qty × price |
| notes | String | No | Line-specific notes |

**Validation Rules:**

- `required_qty > 0`
- `estimated_price >= 0`
- `line_value = required_qty × estimated_price`

**UI-Level VAT Calculation (Not Stored):**

PRF VAT is calculated at the UI level for display purposes only. Since PRFs are internal requisitions, VAT amounts are not stored in the database. The following fields are computed client-side:

| Computed Field   | Type    | Formula                                |
| ---------------- | ------- | -------------------------------------- |
| vat_percent      | Decimal | Fixed at 15% (Saudi Arabia)            |
| total_before_vat | Decimal | `required_qty × estimated_price`       |
| vat_amount       | Decimal | `total_before_vat × vat_percent / 100` |
| total_after_vat  | Decimal | `total_before_vat + vat_amount`        |

This differs from PO lines where VAT is stored because POs are formal orders sent to suppliers.

---

### PO (MODIFY)

Extend with detailed pricing and terms fields.

```prisma
model PO {
  id                    String     @id @default(uuid()) @db.Uuid
  po_no                 String     @unique @db.VarChar(50)  // Format: PO-{LocationName}-{DD}-{Mon}-{YYYY}-{NN} (uses PRF's location)
  prf_id                String?    @db.Uuid
  supplier_id           String     @db.Uuid
  quotation_ref         String?    @db.VarChar(100)  // NEW
  ship_to_location_id   String?    @db.Uuid          // NEW
  ship_to_contact       String?    @db.VarChar(100)  // NEW
  ship_to_phone         String?    @db.VarChar(50)   // NEW
  status                POStatus   @default(OPEN)
  total_before_discount Decimal    @default(0) @db.Decimal(15, 2)  // NEW
  total_discount        Decimal    @default(0) @db.Decimal(15, 2)  // NEW
  total_after_discount  Decimal    @default(0) @db.Decimal(15, 2)  // NEW
  total_vat             Decimal    @default(0) @db.Decimal(15, 2)  // NEW
  total_amount          Decimal    @default(0) @db.Decimal(15, 2)  // Final total
  payment_terms         String?    @db.VarChar(200)  // NEW
  delivery_terms        String?    @db.VarChar(200)  // NEW
  duration_days         Int?                          // NEW
  terms_conditions      String?                       // NEW
  notes                 String?
  created_by            String     @db.Uuid          // NEW
  created_at            DateTime   @default(now()) @db.Timestamptz(6)
  updated_at            DateTime   @updatedAt @db.Timestamptz(6)
  lines                 POLine[]                      // NEW relation
  deliveries            Delivery[]
  prf                   PRF?       @relation(fields: [prf_id], references: [id])
  supplier              Supplier   @relation(fields: [supplier_id], references: [id])
  ship_to_location      Location?  @relation("POShipTo", fields: [ship_to_location_id], references: [id])
  creator               User       @relation("POCreator", fields: [created_by], references: [id])

  @@index([prf_id])
  @@index([supplier_id])
  @@index([status])
  @@index([created_by])    // NEW
  @@map("purchase_orders")
}
```

**New Fields:**
| Field | Type | Description |
|-------|------|-------------|
| quotation_ref | String? | Supplier's quotation reference |
| ship_to_location_id | UUID? | Delivery destination location |
| ship_to_contact | String? | Contact name at delivery site |
| ship_to_phone | String? | Contact phone at delivery site |
| total_before_discount | Decimal | Sum of line totals before discount |
| total_discount | Decimal | Total discount amount |
| total_after_discount | Decimal | Amount after discount |
| total_vat | Decimal | Total VAT amount |
| payment_terms | String? | Payment terms text |
| delivery_terms | String? | Delivery terms text |
| duration_days | Int? | Contract duration in days |
| terms_conditions | String? | Additional terms |
| created_by | UUID | User who created the PO |

---

### POLine (NEW)

Individual line items on a PO with VAT calculations and delivery tracking.

```prisma
model POLine {
  id                 String         @id @default(uuid()) @db.Uuid
  po_id              String         @db.Uuid
  item_id            String?        @db.Uuid
  item_code          String?        @db.VarChar(50)
  item_description   String         @db.VarChar(500)
  quantity           Decimal        @db.Decimal(15, 4)
  delivered_qty      Decimal        @default(0) @db.Decimal(15, 4)  // NEW: Cumulative delivered quantity
  unit               Unit
  unit_price         Decimal        @db.Decimal(15, 4)
  discount_percent   Decimal        @default(0) @db.Decimal(5, 2)
  total_before_vat   Decimal        @db.Decimal(15, 2)
  vat_percent        Decimal        @default(15) @db.Decimal(5, 2)  // Saudi VAT 15%
  vat_amount         Decimal        @db.Decimal(15, 2)
  total_after_vat    Decimal        @db.Decimal(15, 2)
  notes              String?
  po                 PO             @relation(fields: [po_id], references: [id], onDelete: Cascade)
  item               Item?          @relation(fields: [item_id], references: [id])
  delivery_lines     DeliveryLine[] // NEW: Track which deliveries fulfilled this PO line

  @@index([po_id])
  @@index([item_id])
  @@map("po_lines")
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| po_id | UUID | Yes | Parent PO reference |
| item_id | UUID | No | Optional link to Item master |
| item_code | String | No | Item code (denormalized) |
| item_description | String | Yes | Item description |
| quantity | Decimal | Yes | Order quantity |
| **delivered_qty** | **Decimal** | **No** | **Cumulative delivered quantity (updated on each delivery post)** |
| unit | Unit | Yes | Unit of measure |
| unit_price | Decimal | Yes | Unit price |
| discount_percent | Decimal | No | Line discount (0-100%) |
| total_before_vat | Decimal | Yes | qty × price × (1 - discount%) |
| vat_percent | Decimal | No | VAT rate (default 15%) |
| vat_amount | Decimal | Yes | Calculated VAT amount |
| total_after_vat | Decimal | Yes | Line total including VAT |
| notes | String | No | Line-specific notes |

**Computed Field (API-level):**
| Field | Type | Description |
|-------|------|-------------|
| remaining_qty | Decimal | `quantity - delivered_qty` (computed by API, not stored) |

**Validation Rules:**

- `quantity > 0`
- `unit_price >= 0`
- `0 <= discount_percent <= 100`
- `0 <= vat_percent <= 100`
- `total_before_vat = quantity × unit_price × (1 - discount_percent / 100)`
- `vat_amount = total_before_vat × vat_percent / 100`
- `total_after_vat = total_before_vat + vat_amount`
- `delivered_qty >= 0` (cannot be negative)

**Delivery Tracking Behavior:**

- When a delivery is **posted**, each delivery line increments the corresponding `delivered_qty`
- The `remaining_qty` is computed as `quantity - delivered_qty`
- Over-delivery (when `delivered_qty > quantity`) is allowed but requires Supervisor/Admin approval

---

### Delivery (MODIFY)

Change po_id from optional to required and add over-delivery rejection tracking.

```prisma
model Delivery {
  // ... existing fields ...
  po_id                   String         @db.Uuid  // CHANGED: String? → String (REQUIRED)
  over_delivery_rejected  Boolean        @default(false)  // NEW: True if over-delivery was rejected by Supervisor/Admin
  // ... rest unchanged ...
}
```

**New Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| over_delivery_rejected | Boolean | No | True if a Supervisor/Admin rejected the over-delivery. When true, the delivery is permanently locked (all actions disabled). |

**Over-Delivery Rejection Workflow:**

1. When a Supervisor/Admin rejects over-delivery, `over_delivery_rejected` is set to `true`
2. The rejection reason is prepended to the delivery notes with `[REJECTED by {username}]: {reason}` format
3. The delivery becomes **permanently locked** - all API PATCH requests are blocked
4. The frontend disables all action buttons (Delete, Edit, Post)
5. An "Over-Delivery Rejected" alert is displayed indicating the delivery is locked
6. User must create a new delivery with correct quantities

**Migration Note:**

- Existing deliveries with `po_id = NULL` must be handled
- Option: Create a "Legacy" PO or allow NULL for existing records only
- Recommendation: Allow NULL for existing, require for new (validation in API layer)

---

### DeliveryLine (MODIFY)

Add PO line tracking and over-delivery approval fields.

```prisma
model DeliveryLine {
  id                      String   @id @default(uuid()) @db.Uuid
  delivery_id             String   @db.Uuid
  item_id                 String   @db.Uuid
  po_line_id              String?  @db.Uuid          // NEW: Link to the PO line this delivery fulfills
  quantity                Decimal  @db.Decimal(15, 4)
  unit_price              Decimal  @db.Decimal(15, 4)
  period_price            Decimal  @db.Decimal(15, 4)
  price_variance          Decimal  @default(0) @db.Decimal(15, 4)
  line_value              Decimal  @db.Decimal(15, 2)
  ncr_id                  String?  @db.Uuid
  over_delivery_approved  Boolean  @default(false)   // NEW: True if Supervisor/Admin approved over-delivery
  delivery                Delivery @relation(fields: [delivery_id], references: [id], onDelete: Cascade)
  item                    Item     @relation(fields: [item_id], references: [id])
  po_line                 POLine?  @relation(fields: [po_line_id], references: [id])  // NEW relation
  ncrs                    NCR[]

  @@index([delivery_id])
  @@index([item_id])
  @@index([po_line_id])  // NEW index
  @@index([ncr_id])
  @@map("delivery_lines")
}
```

**New Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| po_line_id | UUID | No | Link to the specific PO line this delivery fulfills |
| over_delivery_approved | Boolean | No | True if a Supervisor/Admin approved exceeding PO quantity |

**Over-Delivery Workflow:**

1. When delivery quantity exceeds PO line's remaining quantity, it's flagged as over-delivery
2. Operators can save drafts with over-delivery, but cannot post without approval
3. Supervisors/Admins can approve over-delivery lines (sets `over_delivery_approved = true`)
4. Once approved, the delivery can be posted
5. Supervisors/Admins can also reject with a reason (appended to delivery notes)

---

### Location (MODIFY)

Add relation for PO ship-to location.

```prisma
model Location {
  // ... existing fields ...
  ship_to_pos       PO[]           @relation("POShipTo")  // NEW
  // ... rest unchanged ...
}
```

---

### User (MODIFY)

Add relation for PO creator.

```prisma
model User {
  // ... existing fields ...
  created_pos       PO[]           @relation("POCreator")  // NEW
  // ... rest unchanged ...
}
```

---

### Item (MODIFY)

Add relations for PRF and PO lines.

```prisma
model Item {
  // ... existing fields ...
  prf_lines      PRFLine[]   // NEW
  po_lines       POLine[]    // NEW
  // ... rest unchanged ...
}
```

---

## 3. Entity Relationships

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │     │   Location  │     │   Period    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ requested_by      │ location_id       │ period_id
       │ approved_by       │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│                         PRF                          │
│  (1:1 with PO, 1:N with PRFLine)                    │
└──────────────────────────┬──────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       ┌─────────────┐          ┌─────────────┐
       │   PRFLine   │          │     PO      │
       │   (1:N)     │          │   (1:1)     │
       └─────────────┘          └──────┬──────┘
                                       │
                          ┌────────────┴────────────┐
                          │                         │
                          ▼                         ▼
                   ┌─────────────┐          ┌─────────────┐
                   │   POLine    │          │  Delivery   │
                   │   (1:N)     │          │   (1:N)     │
                   └─────────────┘          └─────────────┘
```

---

## 4. State Transitions

### PRF Status Flow

```
DRAFT ──[submit]──> PENDING ──[approve]──> APPROVED ──[po_closed]──> CLOSED
                        │
                        └──[reject]──> REJECTED
```

| Transition         | Trigger | Conditions                                |
| ------------------ | ------- | ----------------------------------------- |
| DRAFT → PENDING    | Submit  | Has at least 1 line item                  |
| PENDING → APPROVED | Approve | User is Supervisor/Admin                  |
| PENDING → REJECTED | Reject  | User is Supervisor/Admin, reason provided |
| APPROVED → CLOSED  | Auto    | When linked PO is closed                  |

### PO Status Flow

```
OPEN ──[close]──> CLOSED
OPEN ──[auto]───> CLOSED (when all items fully delivered)
```

| Transition    | Trigger      | Conditions                                                        |
| ------------- | ------------ | ----------------------------------------------------------------- |
| OPEN → CLOSED | Manual Close | User is Admin or Supervisor (Procurement Specialist cannot close) |
| OPEN → CLOSED | Auto-Close   | All PO lines have `delivered_qty >= quantity` after delivery      |

**Auto-Close Behavior:**

When a delivery is posted, the system checks if all PO lines are fully delivered:

- If `delivered_qty >= quantity` for ALL lines, the PO is automatically closed
- The linked PRF (if any) is also automatically closed
- The API returns `po_auto_closed: true` flag in the response
- A success message indicates the PO was auto-closed

---

## 5. TypeScript Interfaces

Add to `shared/types/database.ts`:

```typescript
// New Enums
export type PRFType = "URGENT" | "DPA" | "NORMAL";
export type PRFCategory = "FOOD" | "CLEANING" | "OTHER";

// Updated UserRole
export type UserRole = "OPERATOR" | "SUPERVISOR" | "ADMIN" | "PROCUREMENT_SPECIALIST";

// PRFLine Interface
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

// PRF Interface (extended)
export interface PRF {
  id: string;
  prf_no: string;
  period_id: string;
  location_id: string;
  project_name: string | null;
  prf_type: PRFType;
  category: PRFCategory;
  expected_delivery_date: Date | string | null;
  status: PRFStatus;
  requested_by: string;
  approved_by: string | null;
  request_date: Date | string;
  approval_date: Date | string | null;
  rejection_reason: string | null;
  total_value: DecimalValue;
  contact_person_name: string | null;
  contact_person_phone: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  notes: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

// POLine Interface
export interface POLine {
  id: string;
  po_id: string;
  item_id: string | null;
  item_code: string | null;
  item_description: string;
  quantity: DecimalValue;
  delivered_qty: DecimalValue; // NEW: Cumulative delivered quantity
  unit: Unit;
  unit_price: DecimalValue;
  discount_percent: DecimalValue;
  total_before_vat: DecimalValue;
  vat_percent: DecimalValue;
  vat_amount: DecimalValue;
  total_after_vat: DecimalValue;
  notes: string | null;
}

// Delivery Interface (extended)
export interface Delivery {
  id: string;
  delivery_no: string;
  period_id: string;
  location_id: string;
  supplier_id: string;
  po_id: string | null;
  invoice_no: string | null;
  delivery_note: string | null;
  delivery_date: Date | string;
  total_amount: DecimalValue;
  has_variance: boolean;
  over_delivery_rejected: boolean; // NEW: True if over-delivery was rejected by Supervisor/Admin
  status: DeliveryStatus;
  created_by: string;
  posted_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

// DeliveryLine Interface (extended)
export interface DeliveryLine {
  id: string;
  delivery_id: string;
  item_id: string;
  po_line_id: string | null; // NEW: Link to PO line
  quantity: DecimalValue;
  unit_price: DecimalValue;
  period_price: DecimalValue;
  price_variance: DecimalValue;
  line_value: DecimalValue;
  ncr_id: string | null;
  over_delivery_approved: boolean; // NEW: Over-delivery approval status
}

// PO Interface (extended)
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

// Supplier Interface (extended)
export interface Supplier {
  id: string;
  code: string;
  name: string;
  contact: string | null;
  emails: string[];
  phone: string | null;
  mobile: string | null;
  vat_reg_no: string | null;
  address: string | null;
  is_active: boolean;
  created_at: Date | string;
}
```

---

## 6. Migration Strategy

### Phase 1: Schema Changes

1. Add new enums (PRFType, PRFCategory)
2. Modify UserRole enum (add PROCUREMENT_SPECIALIST)
3. Add PRFLine model
4. Add POLine model
5. Modify Supplier model (add emails, phone, mobile, vat_reg_no, address)
6. Modify PRF model (add new fields)
7. Modify PO model (add new fields)
8. Add relations to User, Location, Item models

### Phase 2: Data Migration

1. No data migration needed (new fields have defaults or are nullable)
2. Existing deliveries with po_id = NULL remain valid (API validates new only)

### Migration Command

```bash
pnpm db:migrate dev --name add_prf_po_workflow
```
