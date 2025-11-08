# API_Contract

# API Contract - Multi-Location System

**Last Updated:** November 2025

**Purpose:** Define the backend API for the multi-location stock management system

## Overview

### Base Configuration

- **Base URL:** `/api` (relative, same origin)
- **Architecture:** Nuxt Server Routes (Nitro/H3)
- **Auth:** JWT in httpOnly cookies via nuxt-auth-utils
- **Content-Type:** `application/json; charset=utf-8`
- **Times:** ISO 8601 UTC
- **Currency:** SAR (Saudi Riyal)
- **Pagination:** `?page=1&limit=50` + `X-Total-Count` header
- **Location Context:** `X-Location-Id` header or route parameter

### API Architecture

```mermaid
flowchart LR
    Client[Multi-Location PWA] --> Nuxt[Nuxt 3 SPA]
    Nuxt --> API[Server Routes /server/api]
    API --> Prisma[Prisma ORM]
    Prisma --> DB[(PostgreSQL - Supabase)]
```

**Key Points:**
- Single monolithic Nuxt 3 application
- Frontend and API in same deployment
- Serverless functions on Vercel
- Direct Prisma connection to Supabase
- No separate backend service
- No Redis or message queue for MVP

## Authentication & Authorization

### Authentication Method

- **Cookie-based JWT** (httpOnly, secure)
- **Library:** nuxt-auth-utils
- **Session management:** Server-side via Nuxt middleware
- **No Bearer tokens** - cookies auto-sent by browser

### Session Structure

```typescript
interface UserSession {
  user: {
    id: string
    email: string
    role: 'OPERATOR' | 'SUPERVISOR' | 'ADMIN'
    locations: Array<{
      id: string
      code: string
      access: 'VIEW' | 'POST' | 'MANAGE'
    }>
  }
  loggedInAt: number
}
```

### Authentication Endpoints

```typescript
// Login
POST /api/auth/login
Body: { email: string, password: string }
Response: { user: UserSession['user'] }
Sets: httpOnly cookie

// Logout
POST /api/auth/logout
Response: { success: true }
Clears: httpOnly cookie

// Current session
GET /api/auth/session
Response: UserSession | null
```

### Role Permissions

| Role | Permissions |
| --- | --- |
| **OPERATOR** | View/Post at assigned locations |
| **SUPERVISOR** | All locations, approve transfers/PRF |
| **ADMIN** | Full system access, period close |

### Middleware Protection

All `/api/*` routes automatically protected via:
```typescript
// server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401 })
  }
  event.context.user = session.user
})
```

## Core Endpoints

### 1. Location Management

### List Locations

```
GET /locations
```

**Query Params:**
- `type`: KITCHEN, STORE, CENTRAL
- `active`: true/false
- `manager_id`: UUID

**Response:**

```json
{  "locations": [    {      "id": "loc_123",      "code": "RYD-01",      "name": "Riyadh Central Kitchen",      "type": "KITCHEN",      "address": "123 Main St, Riyadh",      "manager": {        "id": "user_456",        "name": "Ahmed Hassan"      },      "is_active": true    }  ],  "total": 15}
```

### Get Location Details

```
GET /locations/{id}
```

### Create Location

```
POST /locations
```

**Body:**

```json
{  "code": "RYD-02",  "name": "Riyadh Store 2",  "type": "STORE",  "address": "456 King Fahd Rd",  "manager_id": "user_789"}
```

### 2. Period Management

### Get Current Period

```
GET /periods/current
```

**Response:**

```json
{  "id": "period_202511",  "name": "2025-11",  "status": "OPEN",  "start_date": "2025-11-01",  "end_date": "2025-11-30",  "locations_ready": 3,  "locations_total": 5}
```

### Set Period Prices (NEW)

```
POST /periods/{id}/prices
```

**Body:**

```json
{  "prices": [    {      "item_id": "item_001",      "price": 25.50    },    {      "item_id": "item_002",
      "price": 18.75    }  ]}
```

**Note:** Admin only. Prices are fixed for the entire period.

### Close Period (Requires Approval)

```
POST /periods/{id}/close
```

**Body:**

```json
{  "approval_token": "approval_xyz",  "closing_notes": "All locations reconciled"}
```

### 3. Stock Operations

### Get Location Stock

```
GET /locations/{locationId}/stock
```

**Query Params:**
- `category`: Filter by category
- `low_stock`: true to show only low stock
- `search`: Item name/code search

**Response:**

```json
{  "location": {    "id": "loc_123",    "name": "Riyadh Central Kitchen"  },  "items": [    {      "item_id": "item_001",      "code": "RIC001",      "name": "Rice 5kg",      "unit": "KG",      "on_hand": 150.5,      "wac": 25.50,      "value": 3837.75,      "min_stock": 50,      "max_stock": 500    }  ],  "total_value": 125430.50}
```

### 4. Deliveries with Price Variance Detection

### Post Delivery

```
POST /locations/{locationId}/deliveries
```

**Body:**

```json
{  "supplier_id": "supp_123",  "invoice_no": "INV-2025-1234",  "delivery_note": "DN-5678",  "delivery_date": "2025-11-02",  "lines": [    {      "item_id": "item_001",      "quantity": 100,      "unit_price": 26.00  // Different from period price!    }  ]}
```

**Response with Price Variance:**

```json
{  "delivery": {    "id": "del_789",    "delivery_no": "D-2025-0156",    "total": 2600.00,    "has_variance": true  },  "variances": [    {      "item": "Rice 5kg",      "expected_price": 25.50,      "actual_price": 26.00,      "variance": 0.50,      "ncr_created": {        "id": "ncr_456",        "ncr_no": "NCR-2025-0089",        "type": "PRICE_VARIANCE",        "auto_generated": true      }    }  ],  "message": "Delivery posted. Price variance detected and NCR created automatically."}
```

### 5. Transfers (NEW)

### Create Transfer Request

```
POST /transfers
```

**Body:**

```json
{  "from_location_id": "loc_123",  "to_location_id": "loc_456",  "transfer_date": "2025-11-03",  "lines": [    {      "item_id": "item_001",      "quantity": 50    }  ],  "notes": "Stock rebalancing"}
```

**Response:**

```json
{  "transfer": {    "id": "trf_001",    "transfer_no": "TRF-2025-0001",    "status": "PENDING_APPROVAL",    "total_value": 1275.00,    "requires_approval": true  }}
```

### Approve Transfer

```
PATCH /transfers/{id}/approve
```

**Body:**

```json
{  "comments": "Approved for urgent requirement"}
```

### Get Transfer Status

```
GET /transfers/{id}
```

### List Transfers

```
GET /transfers
```

**Query Params:**
- `from_location`: UUID
- `to_location`: UUID
- `status`: PENDING_APPROVAL, APPROVED, etc.
- `date_from`: ISO date
- `date_to`: ISO date

### 6. Issues

### Post Issue

```
POST /locations/{locationId}/issues
```

**Body:**

```json
{  "issue_date": "2025-11-02",  "cost_centre": "FOOD",  "lines": [    {      "item_id": "item_001",      "quantity": 15.5    }  ]}
```

**Response:**

```json
{  "issue": {    "id": "iss_234",    "issue_no": "I-2025-3042",    "total_value": 395.25  },  "lines": [    {      "item": "Rice 5kg",      "quantity": 15.5,      "wac": 25.50,      "value": 395.25    }  ]}
```

### 7. NCR Management

### List NCRs

```
GET /ncrs
```

**Query Params:**
- `location_id`: UUID
- `type`: MANUAL, PRICE_VARIANCE
- `status`: OPEN, CREDITED, etc.
- `auto_generated`: true/false

### Create Manual NCR

```
POST /ncrs
```

**Body:**

```json
{  "location_id": "loc_123",  "delivery_id": "del_456",  "reason": "Items damaged in transit",  "lines": [    {      "item_id": "item_001",      "quantity": 5,      "value": 127.50    }  ]}
```

### 8. POB (People on Board)

### Update POB

```
PATCH /locations/{locationId}/pob
```

**Body:**

```json
{  "period_id": "period_202511",  "entries": [    {      "date": "2025-11-01",      "crew_count": 60,      "extra_count": 15    },    {      "date": "2025-11-02",      "crew_count": 62,      "extra_count": 10    }  ]}
```

### 9. Reconciliations

### Get Location Reconciliation

```
GET /locations/{locationId}/reconciliations/{periodId}
```

**Response:**

```json
{  "location": "Riyadh Central Kitchen",  "period": "2025-11",  "opening_stock": 125000.00,  "receipts": 45000.00,  "transfers_in": 5000.00,  "transfers_out": 3000.00,  "issues": 35000.00,  "closing_stock": 137000.00,  "adjustments": -500.00,  "consumption": 34500.00,  "total_mandays": 2100,  "manday_cost": 16.43}
```

### Update Reconciliation

```
PATCH /locations/{locationId}/reconciliations/{periodId}
```

**Body:**

```json
{  "adjustments": -500.00,  "back_charges": 1000.00,  "credits": 500.00,  "condemnations": 200.00}
```

### 10. Approvals

### Request Approval

```
POST /approvals
```

**Body:**

```json
{  "entity_type": "PERIOD_CLOSE",  "entity_id": "period_202511",  "notes": "All locations reconciled, ready for close"}
```

### Get Pending Approvals

```
GET /approvals/pending
```

### Approve/Reject

```
PATCH /approvals/{id}
```

**Body:**

```json
{  "action": "APPROVE",  "comments": "Verified all reconciliations"}
```

## Error Handling

### Standard Error Response (H3 Format)

```typescript
// Nuxt Server Route error
throw createError({
  statusCode: 400,
  statusMessage: 'Insufficient Stock',
  data: {
    code: 'INSUFFICIENT_STOCK',
    message: 'Cannot issue 100 KG of Rice. Only 75 KG available at location RYD-01',
    details: {
      item: 'Rice 5kg',
      requested: 100,
      available: 75,
      location: 'RYD-01'
    }
  }
})

// Client receives:
{
  statusCode: 400,
  statusMessage: 'Insufficient Stock',
  data: {
    code: 'INSUFFICIENT_STOCK',
    message: '...',
    details: { ... }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
| --- | --- | --- |
| `INSUFFICIENT_STOCK` | 400 | Not enough stock for issue/transfer |
| `PRICE_VARIANCE` | 200 | Price differs from period (NCR created) |
| `LOCATION_ACCESS_DENIED` | 403 | User lacks access to location |
| `PERIOD_CLOSED` | 400 | Cannot post to closed period |
| `APPROVAL_REQUIRED` | 202 | Action needs approval |
| `DUPLICATE_ENTRY` | 409 | Duplicate invoice/document number |
| `VALIDATION_ERROR` | 400 | Zod validation failed |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Insufficient permissions |

### Validation Errors (Zod)

```typescript
// Zod validation error format
{
  statusCode: 400,
  data: {
    code: 'VALIDATION_ERROR',
    issues: [
      {
        path: ['lines', 0, 'quantity'],
        message: 'Must be greater than 0'
      }
    ]
  }
}
```

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

### Future Implementation

Will use server-side events or webhook endpoints for integration with:
- Email notifications
- Slack/Teams alerts
- Third-party inventory systems
- Analytics platforms

## Rate Limiting

**MVP Implementation:**
- Basic rate limiting via Nuxt middleware
- 60 requests/minute per session
- Applied at server route level

**Headers (Future):**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1698768060
```

**Current Limits:**
- Standard operations: 60/minute per user
- No separate limits for bulk operations in MVP
- Vercel serverless functions: 10s timeout per request

## Versioning

- API version in URL: `/v2/`
- Breaking changes require new version
- Deprecation notice: 6 months minimum
- Sunset period: 12 months

## Performance SLAs

| Operation | Target Response Time |
| --- | --- |
| GET single record | < 200ms |
| GET list (paginated) | < 500ms |
| POST delivery/issue | < 1000ms |
| Transfer execution | < 1500ms |
| Location stock report | < 2000ms |
| Consolidated reports | < 5000ms |

## Security

### Authentication Headers

```
Cookie: nuxt-session=<encrypted-jwt>
Content-Type: application/json
Accept: application/json
X-Location-Context: <location-id> (when applicable)
```

**Note:** No Authorization header needed - JWT in httpOnly cookie

### CORS Configuration

**Not Required for MVP:**
- SPA and API on same origin (Vercel deployment)
- No cross-origin requests
- Cookies work automatically

**Future (if API exposed externally):**
```
Access-Control-Allow-Origin: https://app.foodstock.com
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

### Security Features

- **HTTPS:** Enforced by Vercel
- **httpOnly cookies:** Cannot be accessed by JavaScript
- **Secure flag:** Cookies only sent over HTTPS
- **SameSite:** CSRF protection
- **Input validation:** Zod schemas on all endpoints
- **SQL injection:** Prevented by Prisma parameterized queries
- **XSS protection:** Vue auto-escaping + Nuxt security headers

### Audit Logging

All API calls logged with:
- User ID (from session)
- Location context
- Action performed
- Timestamp (UTC)
- Request IP (from Vercel headers)
- Changes (via Prisma middleware)

**Implementation:**
```typescript
// Prisma middleware for audit trail
prisma.$use(async (params, next) => {
  const result = await next(params)
  
  if (['create', 'update', 'delete'].includes(params.action)) {
    await prisma.auditLog.create({
      data: {
        userId: context.user.id,
        action: params.action,
        model: params.model,
        data: params.args
      }
    })
  }
  
  return result
})
```

---

**Note:** This API contract supports multi-location operations with automatic price variance detection, transfer management, and comprehensive approval workflows.