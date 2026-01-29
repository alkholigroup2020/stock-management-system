# API Contract - Multi-Location Stock Management System

**Last Updated:** January 2026

**Status:** ✅ Fully Implemented (103+ Routes)

**Purpose:** Define the backend API for the multi-location stock management system

## Overview

### Base Configuration

- **Base URL:** `/api` (relative, same origin)
- **Architecture:** Nuxt Server Routes (Nitro/H3)
- **Auth:** JWT in httpOnly cookies via nuxt-auth-utils
- **Content-Type:** `application/json; charset=utf-8`
- **Times:** ISO 8601 UTC
- **Currency:** SAR (Saudi Riyal)
- **VAT Rate:** 15%
- **Pagination:** `?page=1&limit=50` + `X-Total-Count` header
- **Location Context:** Route parameter or query parameter

### API Architecture

```mermaid
flowchart LR
    Client[Multi-Location PWA] --> Nuxt[Nuxt 4 SPA]
    Nuxt --> API[Server Routes /server/api]
    API --> Prisma[Prisma ORM]
    Prisma --> DB[(PostgreSQL - Supabase)]
```

**Key Points:**

- Single monolithic Nuxt 4 application
- Frontend and API in same deployment
- Serverless functions on Vercel
- Direct Prisma connection to Supabase
- No separate backend service
- No Redis or message queue for MVP

---

## Authentication & Authorization ✅ Implemented

### Authentication Method

- **Cookie-based JWT** (httpOnly, secure)
- **Library:** nuxt-auth-utils
- **Session management:** Server-side via Nuxt middleware
- **No Bearer tokens** - cookies auto-sent by browser
- **Password hashing:** bcrypt with salt

### Session Structure

```typescript
interface UserSession {
  user: {
    id: string;
    username: string;
    email: string;
    full_name: string;
    role: "OPERATOR" | "SUPERVISOR" | "ADMIN" | "PROCUREMENT_SPECIALIST";
    default_location_id: string | null;
    default_location: {
      id: string;
      code: string;
      name: string;
      type: "KITCHEN" | "STORE" | "CENTRAL" | "WAREHOUSE";
    } | null;
    locations: string[]; // Array of location IDs user has access to
  };
  loggedInAt: string; // ISO date string
}
```

### Authentication Endpoints

#### Login

```
POST /api/auth/login
```

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Note:** The `email` field accepts either email or username.

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@example.com",
    "full_name": "Admin User",
    "role": "ADMIN",
    "default_location_id": "uuid",
    "default_location": {
      "id": "uuid",
      "code": "KIT",
      "name": "Kitchen",
      "type": "KITCHEN"
    },
    "locations": ["uuid1", "uuid2"]
  }
}
```

#### Logout

```
POST /api/auth/logout
```

**Response:**

```json
{ "success": true }
```

#### Get Current Session

```
GET /api/auth/session
```

**Response:** `UserSession | null`

#### Register User

```
POST /api/auth/register
```

**Body:**

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "full_name": "New User",
  "role": "OPERATOR"
}
```

**Permissions:** ADMIN only

#### Change Password

```
POST /api/auth/change-password
```

**Body:**

```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

#### Update Profile

```
PATCH /api/auth/profile
```

**Body:**

```json
{
  "full_name": "Updated Name",
  "email": "newemail@example.com"
}
```

### Role Permissions

| Role                       | Permissions                                              |
| -------------------------- | -------------------------------------------------------- |
| **OPERATOR**               | View/Post at assigned locations, create PRFs             |
| **PROCUREMENT_SPECIALIST** | All locations for PRF/PO, create POs, send PO emails     |
| **SUPERVISOR**             | All locations, approve PRFs/transfers/over-delivery, NCRs|
| **ADMIN**                  | Full system access, period close, user management        |

### Middleware Protection

All `/api/*` routes automatically protected via server middleware, except:

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/session`
- `/api/auth/register`
- `/api/health`

```typescript
// server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401 });
  }
  event.context.user = session.user;
});
```

---

## Core Endpoints

### 1. Location Management ✅ Implemented

#### List Locations

```
GET /api/locations
```

**Query Params:**

- `type`: KITCHEN, STORE, CENTRAL, WAREHOUSE
- `active`: true/false

**Response:**

```json
{
  "locations": [
    {
      "id": "uuid",
      "code": "KIT",
      "name": "Kitchen",
      "type": "KITCHEN",
      "is_active": true
    }
  ],
  "total": 4
}
```

#### Get Location Details

```
GET /api/locations/{id}
```

#### Create Location

```
POST /api/locations
```

**Body:**

```json
{
  "code": "STR",
  "name": "Store",
  "type": "STORE"
}
```

**Permissions:** ADMIN only

#### Update Location

```
PATCH /api/locations/{id}
```

#### Delete Location

```
DELETE /api/locations/{id}
```

**Permissions:** ADMIN only

#### Get Location Dashboard

```
GET /api/locations/{id}/dashboard
```

**Response:**

```json
{
  "location": {
    "id": "uuid",
    "code": "KIT",
    "name": "Kitchen"
  },
  "period": {
    "id": "uuid",
    "name": "Jan 2026",
    "start_date": "2026-01-01",
    "end_date": "2026-01-31",
    "status": "OPEN"
  },
  "totals": {
    "total_receipts": 5000.00,
    "total_issues": 3000.00,
    "total_mandays": 500,
    "days_left": 15
  },
  "recent_deliveries": [...],
  "recent_issues": [...]
}
```

#### Manage Location Users

```
POST /api/locations/{id}/users
DELETE /api/locations/{id}/users/{userId}
```

---

### 2. Dashboard ✅ Implemented

#### Get Consolidated Dashboard

```
GET /api/dashboard/consolidated
```

**Permissions:** SUPERVISOR/ADMIN only

**Response:**

```json
{
  "current_period": {...},
  "locations": [...],
  "totals": {
    "total_receipts": 50000.00,
    "total_issues": 35000.00,
    "total_stock_value": 125000.00
  },
  "pending_approvals": 3
}
```

---

### 3. Period Management ✅ Implemented

#### List Periods

```
GET /api/periods
```

#### Get Current Period

```
GET /api/periods/current
```

**Response:**

```json
{
  "id": "uuid",
  "name": "Jan 2026",
  "status": "OPEN",
  "start_date": "2026-01-01",
  "end_date": "2026-01-31",
  "locations_ready": 2,
  "locations_total": 4
}
```

#### Get Period Details

```
GET /api/periods/{id}
```

#### Create Period

```
POST /api/periods
```

**Body:**

```json
{
  "name": "Feb 2026",
  "start_date": "2026-02-01",
  "end_date": "2026-02-28"
}
```

**Permissions:** ADMIN only

#### Update Period

```
PATCH /api/periods/{id}
```

#### Get Period Prices

```
GET /api/periods/{periodId}/prices
```

#### Set Period Prices

```
POST /api/periods/{periodId}/prices
```

**Body:**

```json
{
  "prices": [
    { "item_id": "uuid", "price": 25.5 },
    { "item_id": "uuid", "price": 18.75 }
  ]
}
```

**Permissions:** ADMIN only

#### Copy Prices from Previous Period

```
POST /api/periods/{periodId}/prices-copy
```

#### Open Period

```
POST /api/periods/{periodId}/open
```

**Permissions:** ADMIN only

#### Close Period

```
POST /api/periods/{periodId}/close
```

**Body:**

```json
{
  "closing_notes": "All locations reconciled"
}
```

**Permissions:** ADMIN only. All locations must be in READY status.

#### Roll Forward Period

```
POST /api/periods/{periodId}/roll-forward
```

Creates next period and copies closing stock as opening stock.

---

### 4. Period Location Status ✅ Implemented

#### Mark Location Ready for Close

```
PATCH /api/period-locations/ready
```

**Body:**

```json
{
  "periodId": "uuid",
  "locationId": "uuid"
}
```

#### Mark Location Not Ready

```
PATCH /api/period-locations/unready
```

---

### 5. Stock Operations ✅ Implemented

#### Get Consolidated Stock

```
GET /api/stock/consolidated
```

**Query Params:**

- `category`: Filter by category
- `lowStock`: "true" to show only low stock items

**Permissions:** SUPERVISOR/ADMIN only

**Response:**

```json
{
  "consolidated_stock": [
    {
      "item_id": "uuid",
      "item_code": "PRO-001",
      "item_name": "Chicken Breast",
      "item_unit": "KG",
      "item_category": "PROTEINS",
      "total_on_hand": 250.5,
      "total_value": 6387.75,
      "locations": [
        {
          "location_id": "uuid",
          "location_code": "KIT",
          "location_name": "Kitchen",
          "on_hand": 150.5,
          "wac": 25.50,
          "value": 3837.75,
          "min_stock": 50,
          "max_stock": 500,
          "is_low_stock": false
        }
      ]
    }
  ],
  "location_totals": [...],
  "grand_total_value": 125430.50,
  "total_items": 45,
  "total_locations": 4
}
```

---

### 6. Items Management ✅ Implemented

#### List Items

```
GET /api/items
```

**Query Params:**

- `category`: Filter by category
- `active`: true/false
- `search`: Search by name or code
- `locationId`: Include stock levels for specific location

#### Get Item Details

```
GET /api/items/{id}
```

#### Create Item

```
POST /api/items
```

**Body:**

```json
{
  "code": "PRO-001",
  "name": "Chicken Breast",
  "unit": "KG",
  "category": "PROTEINS",
  "sub_category": "Poultry",
  "min_stock": 50
}
```

**Units:** KG, EA, LTR, BOX, CASE, PACK

**Permissions:** ADMIN only

#### Update Item

```
PATCH /api/items/{id}
```

#### Deactivate Item

```
PATCH /api/items/{id}
```

**Body:**

```json
{
  "is_active": false
}
```

**Permissions:** ADMIN only

#### Update Item Price

```
PATCH /api/items/{itemId}/price
```

**Body:**

```json
{
  "price": 28.5,
  "periodId": "uuid"
}
```

#### Import Items (Bulk)

```
POST /api/items/import
```

**Body:** `multipart/form-data` with Excel/CSV file

**Response:**

```json
{
  "success": true,
  "message": "Import completed",
  "summary": {
    "total_rows": 100,
    "created": 85,
    "updated": 10,
    "errors": 5
  },
  "errors": [
    {
      "row": 15,
      "code": "PRO-999",
      "message": "Duplicate item code"
    }
  ]
}
```

#### Get Import Template

```
GET /api/items/import/template
```

**Response:** Excel file download with required columns

---

### 7. Suppliers Management ✅ Implemented

#### List Suppliers

```
GET /api/suppliers
```

#### Get Supplier Details

```
GET /api/suppliers/{id}
```

#### Create Supplier

```
POST /api/suppliers
```

**Body:**

```json
{
  "code": "SUP-001",
  "name": "Fresh Foods Co.",
  "contact_person": "John Doe",
  "phone": "+966501234567",
  "email": "contact@freshfoods.com"
}
```

#### Update Supplier

```
PATCH /api/suppliers/{id}
```

#### Delete Supplier

```
DELETE /api/suppliers/{id}
```

---

### 8. PRF (Purchase Request Forms) ✅ Implemented

#### List PRFs

```
GET /api/prfs
```

**Query Params:**

- `locationId`: Filter by location
- `status`: DRAFT, PENDING, APPROVED, REJECTED, CLOSED
- `type`: URGENT, DPA, NORMAL
- `category`: FOOD, CLEANING, OTHER

**Response:**

```json
{
  "prfs": [
    {
      "id": "uuid",
      "prf_no": "PRF-KIT-25-Jan-2026-01",
      "type": "NORMAL",
      "category": "FOOD",
      "status": "PENDING",
      "location": { "id": "uuid", "code": "KIT", "name": "Kitchen" },
      "requester": { "id": "uuid", "full_name": "Operator One" },
      "total_amount": 5000.00,
      "vat_amount": 750.00,
      "grand_total": 5750.00,
      "created_at": "2026-01-15T10:00:00Z"
    }
  ],
  "total": 25
}
```

#### Get PRF Details

```
GET /api/prfs/{id}
```

#### Create PRF

```
POST /api/prfs
```

**Body:**

```json
{
  "location_id": "uuid",
  "type": "NORMAL",
  "category": "FOOD",
  "notes": "Weekly order",
  "lines": [
    {
      "item_id": "uuid",
      "quantity": 100,
      "estimated_price": 25.00
    },
    {
      "description": "Special item not in system",
      "quantity": 10,
      "estimated_price": 50.00,
      "unit": "EA"
    }
  ]
}
```

**Note:** Lines can reference an `item_id` OR use a custom `description` for non-catalog items.

#### Update PRF (Draft Only)

```
PATCH /api/prfs/{id}
```

#### Submit PRF for Approval

```
POST /api/prfs/{id}/submit
```

**Response:** PRF with status changed to `PENDING`

#### Approve PRF

```
POST /api/prfs/{id}/approve
```

**Permissions:** SUPERVISOR/ADMIN only

**Response:** PRF with status `APPROVED`, triggers email notification

#### Reject PRF

```
POST /api/prfs/{id}/reject
```

**Body:**

```json
{
  "reason": "Budget constraints"
}
```

**Permissions:** SUPERVISOR/ADMIN only

---

### 9. PO (Purchase Orders) ✅ Implemented

#### List POs

```
GET /api/pos
```

**Query Params:**

- `status`: OPEN, CLOSED
- `supplierId`: Filter by supplier
- `prfId`: Filter by originating PRF

#### Get PO Details

```
GET /api/pos/{id}
```

**Response:**

```json
{
  "po": {
    "id": "uuid",
    "po_no": "PO-25-Jan-2026-001",
    "status": "OPEN",
    "supplier": { "id": "uuid", "name": "Fresh Foods Co.", "email": "orders@freshfoods.com" },
    "prf": { "id": "uuid", "prf_no": "PRF-KIT-25-Jan-2026-01" },
    "total_amount": 5000.00,
    "vat_amount": 750.00,
    "grand_total": 5750.00,
    "delivery_terms": "Within 3 days",
    "payment_terms": "Net 30",
    "created_at": "2026-01-15T12:00:00Z"
  },
  "lines": [
    {
      "id": "uuid",
      "item": { "id": "uuid", "code": "PRO-001", "name": "Chicken Breast" },
      "quantity_ordered": 100,
      "quantity_delivered": 75,
      "quantity_remaining": 25,
      "unit_price": 25.00,
      "total": 2500.00
    }
  ],
  "fulfillment": {
    "total_ordered": 5000.00,
    "total_delivered": 3750.00,
    "percent_fulfilled": 75
  }
}
```

#### Create PO from PRF

```
POST /api/pos
```

**Body:**

```json
{
  "prf_id": "uuid",
  "supplier_id": "uuid",
  "delivery_terms": "Within 3 days",
  "payment_terms": "Net 30",
  "lines": [
    {
      "prf_line_id": "uuid",
      "quantity": 100,
      "unit_price": 25.00
    }
  ]
}
```

**Permissions:** PROCUREMENT_SPECIALIST/ADMIN only

#### Update PO (Open Only)

```
PATCH /api/pos/{id}
```

**Permissions:** PROCUREMENT_SPECIALIST/ADMIN only

#### Close PO

```
POST /api/pos/{id}/close
```

**Body:**

```json
{
  "reason": "Fully delivered"
}
```

**Permissions:** SUPERVISOR/ADMIN only

**Note:** POs auto-close when fully delivered.

#### Send PO Email

```
POST /api/pos/{id}/send-email
```

**Permissions:** PROCUREMENT_SPECIALIST/SUPERVISOR/ADMIN

**Response:**

```json
{
  "success": true,
  "message": "PO email sent to supplier",
  "sent_to": "orders@freshfoods.com"
}
```

---

### 10. Deliveries ✅ Implemented

#### List Location Deliveries

```
GET /api/locations/{id}/deliveries
```

**Query Params:**

- `status`: DRAFT, POSTED
- `supplierId`: Filter by supplier
- `poId`: Filter by PO
- `hasVariance`: true/false
- `hasOverDelivery`: true/false
- `startDate`: ISO date
- `endDate`: ISO date

#### Get Delivery Details

```
GET /api/deliveries/{id}
```

#### Create Delivery (from PO)

```
POST /api/locations/{id}/deliveries
```

**Body:**

```json
{
  "po_id": "uuid",
  "supplier_id": "uuid",
  "invoice_no": "INV-2026-001",
  "delivery_note": "DN-001",
  "delivery_date": "2026-01-25",
  "status": "DRAFT",
  "lines": [
    {
      "item_id": "uuid",
      "po_line_id": "uuid",
      "quantity": 100,
      "unit_price": 26.0
    }
  ]
}
```

**Status Options:**

- `DRAFT`: Saves without affecting stock (invoice_no optional)
- `POSTED`: Immediately updates stock and WAC (invoice_no required)

**Over-Delivery Detection:**

If `quantity > po_line.quantity_remaining`, response includes:

```json
{
  "requires_approval": true,
  "over_delivery_lines": [
    {
      "item": "Chicken Breast",
      "po_remaining": 50,
      "delivered": 75,
      "over_amount": 25
    }
  ]
}
```

**Response with Price Variance:**

```json
{
  "id": "uuid",
  "message": "Delivery posted. 1 price variance(s) detected and NCR(s) created automatically.",
  "delivery": {
    "id": "uuid",
    "delivery_no": "DEL-2026-001",
    "delivery_date": "2026-01-25",
    "invoice_no": "INV-2026-001",
    "total_amount": 2600.00,
    "has_variance": true,
    "status": "POSTED"
  },
  "lines": [...],
  "ncrs": [
    {
      "id": "uuid",
      "ncr_no": "NCR-2026-001",
      "type": "PRICE_VARIANCE",
      "item": { "id": "uuid", "code": "PRO-001", "name": "Chicken Breast" },
      "expected_price": 25.00,
      "actual_price": 26.00,
      "variance": 1.00,
      "variance_percent": 4.0
    }
  ]
}
```

#### Update Delivery (Draft Only)

```
PATCH /api/deliveries/{id}
```

#### Post Delivery

```
POST /api/deliveries/{id}/post
```

Posts a DRAFT delivery, updating stock and WAC.

#### Approve Over-Delivery

```
POST /api/deliveries/{id}/approve-overdelivery
```

**Permissions:** SUPERVISOR/ADMIN only

**Response:** Delivery posted with over-delivery amounts accepted.

#### Delete Delivery (Draft Only)

```
DELETE /api/deliveries/{id}
```

---

### 11. Issues ✅ Implemented

#### List Location Issues

```
GET /api/locations/{id}/issues
```

#### Get Issue Details

```
GET /api/issues/{id}
```

#### Create Issue

```
POST /api/locations/{id}/issues
```

**Body:**

```json
{
  "issue_date": "2025-12-25",
  "cost_centre": "FOOD",
  "lines": [
    {
      "item_id": "uuid",
      "quantity": 15.5
    }
  ]
}
```

**Response:**

```json
{
  "issue": {
    "id": "uuid",
    "issue_no": "ISS-2025-001",
    "issue_date": "2025-12-25",
    "cost_centre": "FOOD",
    "total_value": 395.25
  },
  "lines": [
    {
      "item": { "id": "uuid", "code": "PRO-001", "name": "Chicken Breast" },
      "quantity": 15.5,
      "wac": 25.5,
      "value": 395.25
    }
  ]
}
```

---

### 12. Transfers ✅ Implemented

#### List Transfers

```
GET /api/transfers
```

**Query Params:**

- `fromLocationId`: Source location UUID
- `toLocationId`: Destination location UUID
- `status`: PENDING_APPROVAL, APPROVED, COMPLETED, REJECTED
- `startDate`: ISO date
- `endDate`: ISO date

#### Get Transfer Details

```
GET /api/transfers/{id}
```

#### Create Transfer Request

```
POST /api/transfers
```

**Body:**

```json
{
  "from_location_id": "uuid",
  "to_location_id": "uuid",
  "request_date": "2025-12-25",
  "notes": "Stock rebalancing",
  "lines": [
    {
      "item_id": "uuid",
      "quantity": 50
    }
  ]
}
```

**Response:**

```json
{
  "message": "Transfer created successfully and is pending approval",
  "transfer": {
    "id": "uuid",
    "transfer_no": "TRF-2025-001",
    "request_date": "2025-12-25",
    "status": "PENDING_APPROVAL",
    "total_value": 1275.00,
    "from_location": { "id": "uuid", "code": "KIT", "name": "Kitchen" },
    "to_location": { "id": "uuid", "code": "STR", "name": "Store" },
    "lines": [...]
  }
}
```

#### Approve Transfer

```
PATCH /api/transfers/{id}/approve
```

**Permissions:** SUPERVISOR/ADMIN only

**Response:** Transfer with status COMPLETED and stock movements applied.

#### Reject Transfer

```
PATCH /api/transfers/{id}/reject
```

**Body:**

```json
{
  "reason": "Insufficient justification for transfer"
}
```

**Permissions:** SUPERVISOR/ADMIN only

---

### 13. NCR Management ✅ Implemented

#### List NCRs

```
GET /api/ncrs
```

**Query Params:**

- `locationId`: Filter by location
- `type`: MANUAL, PRICE_VARIANCE
- `status`: OPEN, SENT, CREDITED, REJECTED, RESOLVED
- `deliveryId`: Filter by delivery
- `startDate`: ISO date
- `endDate`: ISO date

#### Get NCR Details

```
GET /api/ncrs/{id}
```

**Response:**

```json
{
  "ncr": {
    "id": "uuid",
    "ncr_no": "NCR-2026-001",
    "type": "PRICE_VARIANCE",
    "status": "OPEN",
    "auto_generated": true,
    "location": { "id": "uuid", "code": "KIT", "name": "Kitchen" },
    "delivery": { "id": "uuid", "delivery_no": "DEL-2026-001" },
    "financial_impact": "NONE",
    "total_value": 100.00,
    "created_at": "2026-01-15T10:00:00Z"
  },
  "lines": [...],
  "notifications": [
    {
      "id": "uuid",
      "sent_at": "2026-01-15T10:30:00Z",
      "recipients": ["finance@company.com", "procurement@company.com"],
      "status": "SENT"
    }
  ]
}
```

#### Create Manual NCR

```
POST /api/ncrs
```

**Body:**

```json
{
  "location_id": "uuid",
  "delivery_id": "uuid",
  "reason": "Items damaged in transit",
  "lines": [
    {
      "item_id": "uuid",
      "quantity": 5,
      "value": 127.5
    }
  ]
}
```

#### Update NCR

```
PATCH /api/ncrs/{id}
```

**Body:**

```json
{
  "status": "SENT",
  "notes": "Sent to supplier"
}
```

#### Resolve NCR

```
POST /api/ncrs/{id}/resolve
```

**Body:**

```json
{
  "resolution": "CREDITED",
  "financial_impact": "CREDIT",
  "credit_amount": 127.50,
  "notes": "Credit note CN-001 received"
}
```

**Resolution Options:** CREDITED, REJECTED, RESOLVED

**Financial Impact Options:** NONE, CREDIT, LOSS

**Permissions:** SUPERVISOR/ADMIN only

#### Send NCR Notification

```
POST /api/ncrs/{id}/send-notification
```

**Permissions:** SUPERVISOR/ADMIN only

**Response:**

```json
{
  "success": true,
  "message": "NCR notification sent",
  "recipients": ["finance@company.com", "procurement@company.com", "supplier@example.com"],
  "notification_id": "uuid"
}
```

**Note:** 5-minute cooldown between notifications for the same NCR.

---

### 14. POB (People on Board) ✅ Implemented

#### Get Location POB Entries

```
GET /api/locations/{id}/pob
```

**Query Params:**

- `periodId`: Filter by period

**Response:**

```json
{
  "period": { "id": "uuid", "name": "Jan 2026" },
  "location": { "id": "uuid", "name": "Kitchen" },
  "entries": [
    {
      "id": "uuid",
      "date": "2026-01-01",
      "crew_count": 60,
      "extra_count": 15,
      "total": 75
    }
  ],
  "totals": {
    "total_crew": 1800,
    "total_extra": 450,
    "total_mandays": 2250
  }
}
```

#### Create POB Entry

```
POST /api/locations/{id}/pob
```

**Body:**

```json
{
  "periodId": "uuid",
  "date": "2026-01-01",
  "crew_count": 60,
  "extra_count": 15
}
```

#### Update POB Entry

```
PATCH /api/pob/{id}
```

**Body:**

```json
{
  "crew_count": 62,
  "extra_count": 10
}
```

---

### 15. Reconciliations ✅ Implemented

#### Get Consolidated Reconciliation

```
GET /api/reconciliations/consolidated
```

**Query Params:**

- `periodId`: Required - Period UUID
- `locationId`: Optional - Filter by location

**Response:**

```json
{
  "period": { "id": "uuid", "name": "Jan 2026" },
  "reconciliations": [
    {
      "location": { "id": "uuid", "code": "KIT", "name": "Kitchen" },
      "opening_stock": 125000.00,
      "receipts": 45000.00,
      "transfers_in": 5000.00,
      "transfers_out": 3000.00,
      "issues": 35000.00,
      "closing_stock": 137000.00,
      "back_charges": 1000.00,
      "credits": 500.00,
      "condemnations": 200.00,
      "adjustments": 0.00,
      "consumption": 34500.00,
      "total_mandays": 2100,
      "manday_cost": 16.43,
      "is_confirmed": true
    }
  ],
  "grand_totals": {...}
}
```

#### Save/Update Reconciliation

```
POST /api/reconciliations
```

**Body:**

```json
{
  "periodId": "uuid",
  "locationId": "uuid",
  "back_charges": 1000.0,
  "credits": 500.0,
  "condemnations": 200.0,
  "adjustments": 0.0
}
```

**Permissions:** SUPERVISOR/ADMIN only

**Response:**

```json
{
  "success": true,
  "message": "Reconciliation adjustments saved successfully",
  "reconciliation": {...},
  "calculations": {
    "consumption": 34500.00,
    "total_adjustments": 700.00
  }
}
```

---

### 16. Approvals ✅ Implemented

#### Get Approval Details

```
GET /api/approvals/{id}
```

**Response:**

```json
{
  "approval": {
    "id": "uuid",
    "entityType": "TRANSFER",
    "entityId": "uuid",
    "status": "PENDING",
    "requester": { "id": "uuid", "username": "operator1", "full_name": "Operator One" },
    "reviewer": null,
    "requestedAt": "2025-12-25T10:00:00Z",
    "reviewedAt": null,
    "comments": null
  },
  "entity": {
    "id": "uuid",
    "transfer_no": "TRF-2025-001",
    "status": "PENDING_APPROVAL",
    ...
  }
}
```

#### Approve

```
PATCH /api/approvals/{id}/approve
```

**Body:**

```json
{
  "comments": "Approved - verified all details"
}
```

**Permissions:** SUPERVISOR/ADMIN (role depends on entity type)

#### Reject

```
PATCH /api/approvals/{id}/reject
```

**Body:**

```json
{
  "comments": "Rejected - insufficient justification"
}
```

**Note:** Approvals are created implicitly when entities requiring approval (transfers, period close requests) are created. There is no standalone `POST /api/approvals` endpoint.

---

### 19. Users Management ✅ Implemented

#### List Users

```
GET /api/users
```

**Permissions:** ADMIN only

#### Get User Details

```
GET /api/users/{id}
```

#### Update User

```
PATCH /api/users/{id}
```

**Body:**

```json
{
  "full_name": "Updated Name",
  "role": "SUPERVISOR",
  "is_active": true
}
```

**Permissions:** ADMIN only

#### Delete User

```
DELETE /api/users/{id}
```

**Permissions:** ADMIN only

---

### 20. Reports ✅ Implemented

#### Stock Now Report

```
GET /api/reports/stock-now
```

**Query Params:**

- `locationId`: Required
- `category`: Optional filter

#### Deliveries Report

```
GET /api/reports/deliveries
```

**Query Params:**

- `locationId`: Required
- `periodId`: Required
- `supplierId`: Optional

#### Issues Report

```
GET /api/reports/issues
```

**Query Params:**

- `locationId`: Required
- `periodId`: Required
- `costCentre`: Optional

#### Reconciliation Report

```
GET /api/reports/reconciliation
```

**Query Params:**

- `periodId`: Required
- `locationId`: Optional (all locations if not specified)

---

### 17. Notification Settings ✅ Implemented

#### Get Notification Settings

```
GET /api/notification-settings
```

**Permissions:** ADMIN only

**Response:**

```json
{
  "settings": {
    "ncr_notifications": {
      "enabled": true,
      "finance_team_email": "finance@company.com",
      "procurement_team_email": "procurement@company.com",
      "notify_supplier": true
    },
    "po_notifications": {
      "enabled": true,
      "cc_procurement": true
    }
  }
}
```

#### Update Notification Settings

```
PATCH /api/notification-settings
```

**Body:**

```json
{
  "ncr_notifications": {
    "enabled": true,
    "finance_team_email": "finance@company.com",
    "procurement_team_email": "procurement@company.com",
    "notify_supplier": true
  }
}
```

**Permissions:** ADMIN only

#### Test Email Configuration

```
POST /api/notification-settings/test
```

**Body:**

```json
{
  "email": "test@company.com",
  "type": "ncr"
}
```

**Permissions:** ADMIN only

**Response:**

```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

---

### 18. System

#### Health Check

```
GET /api/health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-12-25T10:00:00Z"
}
```

#### Performance Metrics

```
GET /api/metrics/performance
```

---

## Error Handling

### Standard Error Response (H3 Format)

```typescript
// Nuxt Server Route error
throw createError({
  statusCode: 400,
  statusMessage: "Insufficient Stock",
  data: {
    code: "INSUFFICIENT_STOCK",
    message: "Cannot issue 100 KG of Chicken Breast. Only 75 KG available.",
    details: {
      item: "Chicken Breast",
      requested: 100,
      available: 75,
      location: "KIT"
    }
  }
});

// Client receives:
{
  statusCode: 400,
  statusMessage: "Insufficient Stock",
  data: {
    code: "INSUFFICIENT_STOCK",
    message: "...",
    details: { ... }
  }
}
```

### Error Codes

| Code                       | HTTP Status | Description                              |
| -------------------------- | ----------- | ---------------------------------------- |
| `NOT_AUTHENTICATED`        | 401         | User not logged in                       |
| `INSUFFICIENT_PERMISSIONS` | 403         | User role cannot perform action          |
| `LOCATION_ACCESS_DENIED`   | 403         | User lacks access to location            |
| `VALIDATION_ERROR`         | 400         | Zod validation failed                    |
| `INSUFFICIENT_STOCK`       | 400         | Not enough stock for issue/transfer      |
| `PERIOD_CLOSED`            | 400         | Cannot post to closed period             |
| `NO_OPEN_PERIOD`           | 400         | No open period exists                    |
| `INVALID_STATUS`           | 400         | Entity status doesn't allow action       |
| `PRICE_VARIANCE`           | 200         | Price differs from period price (NCR created) |
| `OVER_DELIVERY`            | 400         | Delivery quantity exceeds PO remaining   |
| `APPROVAL_REQUIRED`        | 400         | Action requires supervisor approval      |
| `PRF_NOT_APPROVED`         | 400         | Cannot create PO from unapproved PRF     |
| `PO_HAS_DELIVERIES`        | 400         | Cannot edit PO with existing deliveries  |
| `NOT_FOUND`                | 404         | Resource not found                       |
| `DUPLICATE_ENTRY`          | 409         | Duplicate invoice/document number        |
| `NOTIFICATION_COOLDOWN`    | 429         | Must wait before sending another notification |
| `INTERNAL_ERROR`           | 500         | Unexpected server error                  |

### Validation Errors (Zod)

```json
{
  "statusCode": 400,
  "statusMessage": "Bad Request",
  "data": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "path": ["lines", 0, "quantity"],
        "message": "Number must be greater than 0"
      }
    ]
  }
}
```

---

## Webhooks (Post-MVP)

**Note:** Webhooks are not included in MVP. Future implementation will support:

### Planned Event Types

- `delivery.posted`
- `price_variance.detected`
- `transfer.requested`
- `transfer.approved`
- `transfer.completed`
- `period.ready_to_close`
- `period.closed`
- `stock.low`

---

## Rate Limiting

**MVP Implementation:**

- Basic rate limiting via Nuxt middleware
- 60 requests/minute per session
- Applied at server route level
- Vercel serverless functions: 10s timeout per request

---

## Performance SLAs

| Operation             | Target Response Time |
| --------------------- | -------------------- |
| GET single record     | < 200ms              |
| GET list (paginated)  | < 500ms              |
| POST delivery/issue   | < 1000ms             |
| Transfer execution    | < 1500ms             |
| Location stock report | < 2000ms             |
| Consolidated reports  | < 5000ms             |

---

## Security

### Authentication Headers

```
Cookie: nuxt-session=<encrypted-jwt>
Content-Type: application/json
Accept: application/json
```

**Note:** No Authorization header needed - JWT in httpOnly cookie

### Security Features

- **HTTPS:** Enforced by Vercel
- **httpOnly cookies:** Cannot be accessed by JavaScript
- **Secure flag:** Cookies only sent over HTTPS
- **SameSite:** CSRF protection
- **Input validation:** Zod schemas on all endpoints
- **SQL injection:** Prevented by Prisma parameterized queries
- **XSS protection:** Vue auto-escaping + Nuxt security headers

### Audit Logging

All mutating API calls are logged with:

- User ID (from session)
- Location context
- Action performed
- Timestamp (UTC)
- Request details

---

**Note:** This API contract reflects the 103+ implemented endpoints as of January 2026. It supports multi-location operations with:
- PRF → PO → Delivery workflow with approvals
- Automatic price variance detection (zero-tolerance) with NCR generation
- Over-delivery detection and approval
- Transfer management with approval workflow
- NCR and PO email notifications
- Coordinated period close across locations
- RBAC with 4 roles: OPERATOR, PROCUREMENT_SPECIALIST, SUPERVISOR, ADMIN
