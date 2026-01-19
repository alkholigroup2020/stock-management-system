# API Contract: Suppliers (Updates)

**Base Path**: `/api/suppliers`

This document describes **changes only** to the existing supplier endpoints for the PRF/PO workflow feature.

---

## Modified Endpoints

### PATCH /api/suppliers/:id

Update supplier with new email fields.

### Request Body (Extended)

```typescript
{
  // Existing fields...
  code?: string;
  name?: string;
  contact?: string;
  is_active?: boolean;

  // NEW fields
  emails?: string[];           // Array of email addresses
  phone?: string;              // Office phone
  mobile?: string;             // Mobile phone
  vat_reg_no?: string;         // VAT registration number
  address?: string;            // Full address
}
```

### Validation Rules

- `emails`: Each email must be valid format (RFC 5322)
- `phone`, `mobile`: Max 50 characters
- `vat_reg_no`: Max 50 characters

### Response 200

```typescript
{
  data: {
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
    created_at: string;
  };
}
```

---

### POST /api/suppliers

Create supplier with new email fields.

### Request Body (Extended)

```typescript
{
  code: string;                // Required
  name: string;                // Required
  contact?: string;
  is_active?: boolean;         // Default: true

  // NEW fields
  emails?: string[];           // Default: []
  phone?: string;
  mobile?: string;
  vat_reg_no?: string;
  address?: string;
}
```

### Response 201

```typescript
{
  data: Supplier; // Full supplier object with new fields
}
```

---

### GET /api/suppliers/:id

Get supplier with new fields included.

### Response 200 (Extended)

```typescript
{
  data: {
    id: string;
    code: string;
    name: string;
    contact: string | null;
    emails: string[];           // NEW
    phone: string | null;       // NEW
    mobile: string | null;      // NEW
    vat_reg_no: string | null;  // NEW
    address: string | null;     // NEW
    is_active: boolean;
    created_at: string;
    // Relations
    _count?: {
      deliveries: number;
      purchase_orders: number;
    };
  };
}
```

---

### GET /api/suppliers

List suppliers with new fields included.

### Response 200 (Extended)

```typescript
{
  data: Array<{
    id: string;
    code: string;
    name: string;
    contact: string | null;
    emails: string[];           // NEW
    phone: string | null;       // NEW
    vat_reg_no: string | null;  // NEW
    is_active: boolean;
    created_at: string;
  }>;
  pagination: { ... };
}
```

---

## Email Validation

Server-side email validation using Zod:

```typescript
import { z } from "zod";

const emailArraySchema = z.array(z.string().email("Invalid email format")).default([]);

// Usage in request validation
const supplierUpdateSchema = z.object({
  // ... existing fields
  emails: emailArraySchema.optional(),
  phone: z.string().max(50).optional(),
  mobile: z.string().max(50).optional(),
  vat_reg_no: z.string().max(50).optional(),
  address: z.string().optional(),
});
```

---

## Migration Notes

- Existing suppliers will have `emails: []` (empty array)
- Existing suppliers will have `phone`, `mobile`, `vat_reg_no`, `address` as NULL
- No breaking changes to existing API consumers
