# API Contract: PRFs

**Base Path**: `/api/prfs`

---

## Endpoints Overview

| Method | Path                    | Description            | Roles                                                     |
| ------ | ----------------------- | ---------------------- | --------------------------------------------------------- |
| GET    | `/api/prfs`             | List PRFs with filters | All authenticated (PROCUREMENT_SPECIALIST: approved only) |
| POST   | `/api/prfs`             | Create new PRF         | OPERATOR, SUPERVISOR, ADMIN                               |
| GET    | `/api/prfs/:id`         | Get PRF details        | All authenticated                                         |
| PATCH  | `/api/prfs/:id`         | Update draft PRF       | Requester only                                            |
| DELETE | `/api/prfs/:id`         | Delete draft PRF       | Requester only                                            |
| PATCH  | `/api/prfs/:id/submit`  | Submit for approval    | Requester only                                            |
| PATCH  | `/api/prfs/:id/approve` | Approve PRF            | SUPERVISOR, ADMIN                                         |
| PATCH  | `/api/prfs/:id/reject`  | Reject PRF             | SUPERVISOR, ADMIN                                         |
| POST   | `/api/prfs/:id/clone`   | Clone rejected PRF     | Original requester                                        |

**Note**: PROCUREMENT_SPECIALIST can only GET (view) PRFs. They cannot create, update, delete, submit, approve, reject, or clone PRFs. The list is filtered to show only APPROVED PRFs for PROCUREMENT_SPECIALIST users.

---

## GET /api/prfs

List PRFs with pagination and filters.

### Query Parameters

| Parameter    | Type        | Required | Description                            |
| ------------ | ----------- | -------- | -------------------------------------- |
| page         | number      | No       | Page number (default: 1)               |
| limit        | number      | No       | Items per page (default: 20, max: 100) |
| status       | PRFStatus   | No       | Filter by status                       |
| location_id  | UUID        | No       | Filter by location                     |
| period_id    | UUID        | No       | Filter by period                       |
| prf_type     | PRFType     | No       | Filter by type                         |
| category     | PRFCategory | No       | Filter by category                     |
| requested_by | UUID        | No       | Filter by requester                    |
| search       | string      | No       | Search by PRF number                   |

### Response 200

```typescript
{
  data: Array<{
    id: string;
    prf_no: string;
    status: PRFStatus;
    prf_type: PRFType;
    category: PRFCategory;
    total_value: string;
    request_date: string;
    expected_delivery_date: string | null;
    requester: { id: string; full_name: string };
    location: { id: string; code: string; name: string };
    purchase_orders: Array<{ id: string }>; // For filtering PRFs that already have POs
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

**Note**: The `purchase_orders` array is included to allow the frontend to filter out PRFs that already have associated POs when creating a new PO. This is used in the PO creation form's PRF dropdown.

---

## POST /api/prfs

Create a new PRF in DRAFT status.

### Request Body

```typescript
{
  location_id: string;           // Required
  period_id: string;             // Required
  project_name?: string;
  prf_type?: PRFType;            // Default: NORMAL
  category?: PRFCategory;        // Default: FOOD
  expected_delivery_date?: string; // ISO date
  contact_person_name?: string;
  contact_person_phone?: string;
  receiver_name?: string;
  receiver_phone?: string;
  notes?: string;
  lines: Array<{
    item_id?: string;            // Optional - link to Item
    item_description: string;    // Required
    cost_code?: string;          // Optional - not displayed in UI but stored for future use
    unit: Unit;                  // Required
    required_qty: number;        // Required, > 0
    estimated_price: number;     // Required, >= 0
    notes?: string;
  }>;                            // At least 1 line required
}
```

### Validation Rules

- `location_id` must be a valid location the user has access to
- `period_id` must be a valid OPEN period
- `lines` must have at least 1 item
- Each line: `required_qty > 0`, `estimated_price >= 0`

### Response 201

```typescript
{
  data: PRF & {
    lines: PRFLine[];
    requester: User;
    location: Location;
    period: Period;
  };
}
```

### Error Responses

- 400: Validation error (missing fields, invalid values)
- 403: User cannot create PRF for this location
- 404: Period or location not found

---

## GET /api/prfs/:id

Get PRF details with lines and relations.

### Response 200

```typescript
{
  data: PRF & {
    lines: Array<PRFLine & {
      item?: { id: string; code: string; name: string };
    }>;
    requester: { id: string; username: string; full_name: string };
    approver?: { id: string; username: string; full_name: string };
    location: { id: string; code: string; name: string };
    period: { id: string; name: string };
    purchase_orders: Array<{ id: string; po_no: string; status: POStatus }>;
  };
}
```

### Error Responses

- 404: PRF not found

---

## PATCH /api/prfs/:id

Update a draft PRF. Only the requester can update.

### Request Body

```typescript
{
  project_name?: string;
  prf_type?: PRFType;
  category?: PRFCategory;
  expected_delivery_date?: string;
  contact_person_name?: string;
  contact_person_phone?: string;
  receiver_name?: string;
  receiver_phone?: string;
  notes?: string;
  lines?: Array<{
    id?: string;                 // Include for update, omit for new
    item_id?: string;
    item_description: string;
    cost_code?: string;          // Optional - not displayed in UI but stored for future use
    unit: Unit;
    required_qty: number;
    estimated_price: number;
    notes?: string;
  }>;
}
```

### Behavior

- Lines with `id`: Updated
- Lines without `id`: Created
- Lines not in array: Deleted (full replacement)

### Response 200

```typescript
{
  data: PRF & { lines: PRFLine[] };
}
```

### Error Responses

- 400: Validation error
- 403: Not the requester or PRF not in DRAFT status
- 404: PRF not found

---

## DELETE /api/prfs/:id

Delete a draft PRF. Only the requester can delete.

### Response 200

```typescript
{
  message: "PRF deleted successfully";
}
```

### Error Responses

- 403: Not the requester or PRF not in DRAFT status
- 404: PRF not found

---

## PATCH /api/prfs/:id/submit

Submit PRF for approval. Changes status from DRAFT to PENDING. Triggers email notification to Supervisors and Admins.

### Request Body

None (empty body or `{}`)

### Validation Rules

- PRF must be in DRAFT status
- PRF must have at least 1 line item
- User must be the requester

### Behavior

1. Update PRF status to PENDING
2. Send email notification to all SUPERVISOR and ADMIN users

### Response 200

```typescript
{
  data: PRF;
  message: "PRF submitted for approval";
  email_sent: boolean;           // false if no supervisors/admins or email failed
  email_recipients?: number;     // Number of recipients if sent
}
```

### Error Responses

- 400: PRF has no line items
- 403: Not the requester or PRF not in DRAFT status
- 404: PRF not found

---

## PATCH /api/prfs/:id/approve

Approve a pending PRF. Triggers email notification.

### Request Body

```typescript
{
  comments?: string;  // Optional approval comments
}
```

### Validation Rules

- PRF must be in PENDING status
- User must be SUPERVISOR or ADMIN

### Behavior

1. Update PRF status to APPROVED
2. Set approved_by and approval_date
3. Send email notification to all PROCUREMENT_SPECIALIST users

### Response 200

```typescript
{
  data: PRF;
  message: "PRF approved";
  email_sent: boolean;           // false if no procurement specialists or email failed
  email_recipients?: number;     // Number of recipients if sent
}
```

### Error Responses

- 403: User is not SUPERVISOR/ADMIN or PRF not in PENDING status
- 404: PRF not found

---

## PATCH /api/prfs/:id/reject

Reject a pending PRF. Triggers email notification to the original requester.

### Request Body

```typescript
{
  rejection_reason: string; // Required, non-empty
}
```

### Validation Rules

- PRF must be in PENDING status
- User must be SUPERVISOR or ADMIN
- `rejection_reason` is required and non-empty

### Behavior

1. Update PRF status to REJECTED
2. Set approved_by (rejector) and approval_date
3. Store rejection_reason
4. Send email notification to the PRF requester with rejection reason

### Response 200

```typescript
{
  data: PRF;
  message: "PRF rejected";
  email_sent: boolean; // false if requester has no email or email failed
}
```

### Error Responses

- 400: Missing or empty rejection_reason
- 403: User is not SUPERVISOR/ADMIN or PRF not in PENDING status
- 404: PRF not found

---

## POST /api/prfs/:id/clone

Clone a rejected PRF to create a new draft.

### Request Body

None (empty body or `{}`)

### Validation Rules

- PRF must be in REJECTED status
- User must be the original requester

### Behavior

1. Create new PRF in DRAFT status
2. Copy all fields except: id, prf_no, status, approved_by, approval_date, rejection_reason
3. Copy all line items (new IDs generated)
4. Generate new prf_no
5. Set requested_by to current user
6. Set request_date to today

### Response 201

```typescript
{
  data: PRF & { lines: PRFLine[] };
  message: "PRF cloned successfully";
  original_prf_no: string;
}
```

### Error Responses

- 403: Not the original requester or PRF not in REJECTED status
- 404: PRF not found
