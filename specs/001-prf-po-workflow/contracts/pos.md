# API Contract: POs (Purchase Orders)

**Base Path**: `/api/pos`

---

## Endpoints Overview

| Method | Path                 | Description           | Roles                                   |
| ------ | -------------------- | --------------------- | --------------------------------------- |
| GET    | `/api/pos`           | List POs with filters | All authenticated                       |
| POST   | `/api/pos`           | Create PO from PRF    | PROCUREMENT_SPECIALIST                  |
| GET    | `/api/pos/:id`       | Get PO details        | All authenticated                       |
| PATCH  | `/api/pos/:id`       | Update open PO        | PROCUREMENT_SPECIALIST                  |
| PATCH  | `/api/pos/:id/close` | Close PO              | ADMIN only (not PROCUREMENT_SPECIALIST) |

---

## GET /api/pos

List POs with pagination and filters.

### Query Parameters

| Parameter   | Type     | Required | Description                            |
| ----------- | -------- | -------- | -------------------------------------- |
| page        | number   | No       | Page number (default: 1)               |
| limit       | number   | No       | Items per page (default: 20, max: 100) |
| status      | POStatus | No       | Filter by status (OPEN, CLOSED)        |
| supplier_id | UUID     | No       | Filter by supplier                     |
| prf_id      | UUID     | No       | Filter by source PRF                   |
| created_by  | UUID     | No       | Filter by creator                      |
| search      | string   | No       | Search by PO number                    |
| from_date   | string   | No       | Created after date (ISO)               |
| to_date     | string   | No       | Created before date (ISO)              |

### Response 200

```typescript
{
  data: Array<{
    id: string;
    po_no: string;
    status: POStatus;
    total_amount: string;
    supplier: { id: string; code: string; name: string };
    prf?: { id: string; prf_no: string };
    creator: { id: string; full_name: string };
    deliveries_count: number;
    created_at: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

---

## POST /api/pos

Create a new PO, typically from an approved PRF.

### Request Body

```typescript
{
  prf_id?: string;                // Optional - link to source PRF
  supplier_id: string;            // Required
  quotation_ref?: string;
  ship_to_location_id?: string;
  ship_to_contact?: string;
  ship_to_phone?: string;
  payment_terms?: string;
  delivery_terms?: string;
  duration_days?: number;
  terms_conditions?: string;
  notes?: string;
  lines: Array<{
    item_id?: string;             // Optional - link to Item
    item_code?: string;
    item_description: string;     // Required
    quantity: number;             // Required, > 0
    unit: Unit;                   // Required
    unit_price: number;           // Required, >= 0
    discount_percent?: number;    // Default: 0 (0-100)
    vat_percent?: number;         // Default: 15
    notes?: string;
  }>;                             // At least 1 line required
}
```

### Validation Rules

- `supplier_id` must be a valid, active supplier
- `prf_id` if provided, must be APPROVED and not already have a PO
- `lines` must have at least 1 item
- Each line: `quantity > 0`, `unit_price >= 0`, `0 <= discount_percent <= 100`

### Calculated Fields (Server-Side)

For each line:

```
total_before_vat = quantity × unit_price × (1 - discount_percent / 100)
vat_amount = total_before_vat × vat_percent / 100
total_after_vat = total_before_vat + vat_amount
```

For PO totals:

```
total_before_discount = SUM(quantity × unit_price)
total_discount = SUM(quantity × unit_price × discount_percent / 100)
total_after_discount = total_before_discount - total_discount
total_vat = SUM(vat_amount)
total_amount = total_after_discount + total_vat
```

### Behavior

1. Create PO in OPEN status
2. Generate unique po_no
3. Calculate all line totals and PO totals
4. Supplier email addresses are stored for reference but no email is sent on PO creation

### Response 201

```typescript
{
  data: PO & {
    lines: POLine[];
    supplier: Supplier;
    prf?: PRF;
  };
  message: "Purchase Order created";
}
```

### Error Responses

- 400: Validation error
- 403: User is not PROCUREMENT_SPECIALIST
- 404: Supplier, PRF, or ship-to location not found
- 409: PRF already has a PO (1:1 constraint)

---

## GET /api/pos/:id

Get PO details with lines (including delivery tracking), supplier, and linked deliveries.

### Response 200

```typescript
{
  data: PO & {
    lines: Array<POLine & {
      item?: { id: string; code: string; name: string };
      delivered_qty: string;    // Cumulative delivered quantity
      remaining_qty: string;    // Computed: quantity - delivered_qty
    }>;
    supplier: {
      id: string;
      code: string;
      name: string;
      emails: string[];
      phone: string | null;
      vat_reg_no: string | null;
      address: string | null;
    };
    prf?: {
      id: string;
      prf_no: string;
      status: PRFStatus;
      location: { id: string; code: string; name: string };
    };
    ship_to_location?: { id: string; code: string; name: string };
    creator: { id: string; username: string; full_name: string };
    deliveries: Array<{
      id: string;
      delivery_no: string;
      status: DeliveryStatus;
      delivery_date: string;
      total_amount: string;
    }>;
  };
}
```

### Delivery Tracking Fields

Each line includes delivery fulfillment status:

| Field | Type | Description |
|-------|------|-------------|
| delivered_qty | string | Cumulative quantity delivered against this line |
| remaining_qty | string | Computed: `quantity - delivered_qty` (minimum 0) |

### Error Responses

- 404: PO not found

---

## PATCH /api/pos/:id

Update an open PO. Full edit capability until closed.

### Request Body

```typescript
{
  quotation_ref?: string;
  ship_to_location_id?: string;
  ship_to_contact?: string;
  ship_to_phone?: string;
  payment_terms?: string;
  delivery_terms?: string;
  duration_days?: number;
  terms_conditions?: string;
  notes?: string;
  lines?: Array<{
    id?: string;                  // Include for update, omit for new
    item_id?: string;
    item_code?: string;
    item_description: string;
    quantity: number;
    unit: Unit;
    unit_price: number;
    discount_percent?: number;
    vat_percent?: number;
    notes?: string;
  }>;
}
```

### Behavior

- Lines with `id`: Updated
- Lines without `id`: Created
- Lines not in array: Deleted (full replacement)
- All totals recalculated

### Response 200

```typescript
{
  data: PO & { lines: POLine[] };
}
```

### Error Responses

- 400: Validation error
- 403: User is not PROCUREMENT_SPECIALIST or PO is CLOSED
- 404: PO not found

---

## PATCH /api/pos/:id/close

Close a PO. No further edits or deliveries allowed.

**Note**: Only ADMIN users can close POs. PROCUREMENT_SPECIALIST users cannot close POs.

### Request Body

```typescript
{
  notes?: string;  // Optional closing notes
}
```

### Validation Rules

- PO must be in OPEN status
- User must be ADMIN (PROCUREMENT_SPECIALIST cannot close POs)

### Behavior

1. Update PO status to CLOSED
2. Update linked PRF status to CLOSED (if exists)

### Response 200

```typescript
{
  data: PO;
  message: "Purchase Order closed";
  prf_closed: boolean; // true if linked PRF was also closed
}
```

### Error Responses

- 403: User is not ADMIN or PO already CLOSED
- 404: PO not found

---

## Open POs Dropdown Endpoint

### GET /api/pos/open

Get list of open POs for dropdown selection (used in Delivery creation). Includes delivery tracking information for each line.

### Query Parameters

| Parameter   | Type   | Required | Description               |
| ----------- | ------ | -------- | ------------------------- |
| supplier_id | UUID   | No       | Filter by supplier        |
| search      | string | No       | Search by PO number       |
| limit       | number | No       | Max results (default: 50) |

### Response 200

```typescript
{
  data: Array<{
    id: string;
    po_no: string;
    supplier: { id: string; code: string; name: string };
    total_amount: string;
    lines: Array<{
      id: string;
      item_id: string | null;
      item_description: string;
      quantity: string;
      delivered_qty: string;    // NEW: Cumulative delivered quantity
      remaining_qty: string;    // NEW: Computed remaining quantity
      unit: Unit;
      unit_price: string;
      item?: { id: string; code: string; name: string };
    }>;
  }>;
}
```

### Delivery Tracking in Lines

Each PO line includes tracking fields:

| Field | Type | Description |
|-------|------|-------------|
| delivered_qty | string | Total quantity already delivered against this line |
| remaining_qty | string | Quantity still to be delivered (`quantity - delivered_qty`) |

### Notes

- Only returns POs with status = OPEN
- Used by delivery creation page for mandatory PO selection
- **Delivery form pre-fills with `remaining_qty` instead of full `quantity`**
- Over-delivery (quantity > remaining_qty) requires Supervisor/Admin approval

---

## Auto-Close PO Behavior

When a delivery is posted, the system automatically checks if all PO lines are fully delivered.

### Trigger Condition

```
FOR ALL lines in PO:
  delivered_qty >= quantity
```

### Behavior

1. If all lines are fully delivered, PO status changes to `CLOSED`
2. Linked PRF (if exists and status is `APPROVED`) is also closed
3. Delivery API returns `po_auto_closed: true` flag
4. Success message includes: "PO has been automatically closed (all items fully delivered)"

### Response Flag (in Delivery POST/PATCH)

```typescript
{
  id: string;
  message: string;
  po_auto_closed: boolean;  // true if PO was automatically closed
  delivery: { ... };
}
```
