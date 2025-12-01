# API Endpoints Documentation

This document provides comprehensive documentation for all API endpoints in the Stock Management System.

## Table of Contents

- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Authentication Endpoints](#authentication-endpoints)
- [Location Endpoints](#location-endpoints)
- [Item Endpoints](#item-endpoints)
- [Delivery Endpoints](#delivery-endpoints)
- [Issue Endpoints](#issue-endpoints)
- [Transfer Endpoints](#transfer-endpoints)
- [Period Endpoints](#period-endpoints)
- [NCR Endpoints](#ncr-endpoints)
- [Reconciliation Endpoints](#reconciliation-endpoints)
- [Report Endpoints](#report-endpoints)
- [Utility Endpoints](#utility-endpoints)

## API Overview

**Base URL:** `http://localhost:3000/api` (development) or `https://your-domain.com/api` (production)

**Framework:** Nuxt Server Routes (Nitro/H3)

**Authentication:** JWT tokens stored in httpOnly cookies

**Content-Type:** `application/json`

**Response Format:** JSON

## Authentication

All API routes (except `/api/auth/*` and `/api/health`) require authentication.

**Authentication Header:** Cookie-based (automatic with browser)

**For external clients:**

```http
Cookie: auth_token=<your_jwt_token>
```

**Session Management:**

- Login: `POST /api/auth/login` → Sets httpOnly cookie
- Logout: `POST /api/auth/logout` → Clears cookie
- Check session: `GET /api/auth/session` → Returns current user

## Error Handling

### Standard Error Response

```json
{
  "statusCode": 400,
  "statusMessage": "Validation Error",
  "data": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "quantity",
      "issue": "must be greater than 0"
    }
  }
}
```

### Common Error Codes

| Code                     | HTTP Status | Description                                |
| ------------------------ | ----------- | ------------------------------------------ |
| `UNAUTHORIZED`           | 401         | Not authenticated                          |
| `PERMISSION_DENIED`      | 403         | Insufficient permissions                   |
| `NOT_FOUND`              | 404         | Resource not found                         |
| `VALIDATION_ERROR`       | 400         | Invalid request data                       |
| `PERIOD_CLOSED`          | 400         | Period is not open                         |
| `INSUFFICIENT_STOCK`     | 400         | Not enough stock                           |
| `LOCATION_ACCESS_DENIED` | 403         | No access to location                      |
| `SAME_LOCATION`          | 400         | Transfer from/to same location             |
| `PRICE_VARIANCE`         | 201         | Price variance detected (auto-NCR created) |
| `SERVER_ERROR`           | 500         | Internal server error                      |

## Authentication Endpoints

### POST /api/auth/login

Authenticate user and create session.

**Request:**

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@example.com",
    "full_name": "Admin User",
    "role": "ADMIN",
    "default_location_id": "uuid",
    "is_active": true
  }
}
```

**Sets Cookie:** `auth_token` (httpOnly, secure in production)

**Errors:**

- `401` - Invalid credentials
- `403` - Account inactive

---

### POST /api/auth/register

Register new user (admin only).

**Request:**

```json
{
  "username": "operator1",
  "email": "operator@example.com",
  "full_name": "Operator One",
  "password": "securepassword",
  "role": "OPERATOR",
  "default_location_id": "uuid"
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "username": "operator1",
  "email": "operator@example.com",
  "role": "OPERATOR"
}
```

**Errors:**

- `403` - Not admin
- `409` - Username/email already exists

---

### POST /api/auth/logout

Log out current user.

**Request:** No body

**Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

**Clears Cookie:** `auth_token`

---

### GET /api/auth/session

Get current user session.

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@example.com",
    "role": "ADMIN",
    "default_location_id": "uuid"
  }
}
```

**Errors:**

- `401` - Not authenticated

---

## Location Endpoints

### GET /api/locations

Get all locations.

**Query Parameters:**

| Parameter   | Type    | Required | Description                                    |
| ----------- | ------- | -------- | ---------------------------------------------- |
| `type`      | string  | No       | Filter by location type (KITCHEN, STORE, etc.) |
| `is_active` | boolean | No       | Filter by active status                        |

**Response (200):**

```json
{
  "locations": [
    {
      "id": "uuid",
      "code": "KITCHEN",
      "name": "Main Kitchen",
      "type": "KITCHEN",
      "is_active": true,
      "manager": {
        "id": "uuid",
        "full_name": "Manager Name"
      }
    }
  ]
}
```

---

### GET /api/locations/:id

Get single location details.

**Response (200):**

```json
{
  "id": "uuid",
  "code": "KITCHEN",
  "name": "Main Kitchen",
  "type": "KITCHEN",
  "address": "Building A",
  "manager_id": "uuid",
  "timezone": "Asia/Riyadh",
  "is_active": true,
  "created_at": "2025-01-01T00:00:00Z"
}
```

**Errors:**

- `404` - Location not found
- `403` - No access to this location

---

### POST /api/locations

Create new location (admin only).

**Request:**

```json
{
  "code": "STORE",
  "name": "Main Store",
  "type": "STORE",
  "address": "Building B",
  "manager_id": "uuid",
  "timezone": "Asia/Riyadh"
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "code": "STORE",
  "name": "Main Store",
  "type": "STORE"
}
```

**Errors:**

- `403` - Not admin
- `409` - Location code already exists

---

### GET /api/locations/:locationId/dashboard

Get location dashboard data.

**Response (200):**

```json
{
  "summary": {
    "total_stock_value": 150000.0,
    "low_stock_items": 5,
    "pending_transfers": 3,
    "open_ncrs": 2
  },
  "recent_transactions": [
    {
      "type": "DELIVERY",
      "id": "uuid",
      "number": "DEL-2025-001",
      "date": "2025-01-15",
      "total": 5000.0
    }
  ],
  "stock_alerts": [
    {
      "item_id": "uuid",
      "item_code": "RICE001",
      "item_name": "Basmati Rice",
      "on_hand": 10.0,
      "min_stock": 50.0
    }
  ]
}
```

---

## Item Endpoints

### GET /api/items

Get all items with pagination.

**Query Parameters:**

| Parameter   | Type    | Required | Default | Description              |
| ----------- | ------- | -------- | ------- | ------------------------ |
| `page`      | number  | No       | 1       | Page number              |
| `limit`     | number  | No       | 50      | Items per page (max 200) |
| `category`  | string  | No       | -       | Filter by category       |
| `is_active` | boolean | No       | true    | Filter by active status  |
| `search`    | string  | No       | -       | Search by code or name   |

**Response (200):**

```json
{
  "items": [
    {
      "id": "uuid",
      "code": "RICE001",
      "name": "Basmati Rice",
      "unit": "KG",
      "category": "Grains",
      "sub_category": "Rice",
      "is_active": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "total_pages": 3
  }
}
```

---

### GET /api/items/:id

Get single item details.

**Response (200):**

```json
{
  "id": "uuid",
  "code": "RICE001",
  "name": "Basmati Rice",
  "unit": "KG",
  "category": "Grains",
  "sub_category": "Rice",
  "is_active": true,
  "current_prices": [
    {
      "period_id": "uuid",
      "period_name": "January 2025",
      "price": 25.5,
      "currency": "SAR"
    }
  ],
  "stock_levels": [
    {
      "location_id": "uuid",
      "location_name": "Main Kitchen",
      "on_hand": 100.0,
      "wac": 24.8
    }
  ]
}
```

---

### POST /api/items

Create new item (admin only).

**Request:**

```json
{
  "code": "RICE002",
  "name": "Jasmine Rice",
  "unit": "KG",
  "category": "Grains",
  "sub_category": "Rice"
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "code": "RICE002",
  "name": "Jasmine Rice"
}
```

**Errors:**

- `403` - Not admin
- `409` - Item code already exists

---

### PATCH /api/items/:id

Update item (admin only).

**Request:**

```json
{
  "name": "Premium Jasmine Rice",
  "category": "Premium Grains"
}
```

**Response (200):**

```json
{
  "id": "uuid",
  "code": "RICE002",
  "name": "Premium Jasmine Rice"
}
```

---

## Delivery Endpoints

### GET /api/locations/:locationId/deliveries

Get deliveries for a location.

**Query Parameters:**

| Parameter      | Type    | Required | Default | Description                     |
| -------------- | ------- | -------- | ------- | ------------------------------- |
| `page`         | number  | No       | 1       | Page number                     |
| `limit`        | number  | No       | 50      | Items per page                  |
| `period_id`    | string  | No       | Current | Filter by period                |
| `has_variance` | boolean | No       | -       | Filter by price variance        |
| `supplier_id`  | string  | No       | -       | Filter by supplier              |
| `start_date`   | string  | No       | -       | Filter by date range (ISO 8601) |
| `end_date`     | string  | No       | -       | Filter by date range (ISO 8601) |

**Response (200):**

```json
{
  "deliveries": [
    {
      "id": "uuid",
      "delivery_no": "DEL-2025-001",
      "delivery_date": "2025-01-15",
      "supplier": {
        "id": "uuid",
        "name": "ABC Suppliers"
      },
      "total_amount": 5000.0,
      "has_variance": true,
      "posted_by": {
        "id": "uuid",
        "full_name": "Operator One"
      },
      "posted_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25
  }
}
```

---

### POST /api/locations/:locationId/deliveries

Post a new delivery.

**Request:**

```json
{
  "supplier_id": "uuid",
  "po_id": "uuid",
  "invoice_no": "INV-12345",
  "delivery_date": "2025-01-15",
  "delivery_note": "All items received in good condition",
  "lines": [
    {
      "item_id": "uuid",
      "quantity": 100.0,
      "unit_price": 25.5
    },
    {
      "item_id": "uuid",
      "quantity": 50.0,
      "unit_price": 15.0
    }
  ]
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "delivery_no": "DEL-2025-001",
  "total_amount": 3300.0,
  "has_variance": true,
  "ncrs_created": [
    {
      "ncr_id": "uuid",
      "ncr_no": "NCR-2025-001",
      "item_id": "uuid",
      "variance_amount": 50.0
    }
  ]
}
```

**Business Logic:**

1. Validates period is OPEN
2. Validates all items exist and are active
3. Calculates price variance for each line (unit_price vs period_price)
4. If variance exists, auto-creates NCR with type PRICE_VARIANCE
5. Updates LocationStock: increases on_hand, recalculates WAC
6. WAC formula: `(currentQty × currentWAC + receivedQty × receiptPrice) / (currentQty + receivedQty)`

**Errors:**

- `400` - Period closed, invalid data
- `403` - No access to location
- `404` - Supplier or items not found

---

### GET /api/deliveries/:id

Get single delivery details.

**Response (200):**

```json
{
  "id": "uuid",
  "delivery_no": "DEL-2025-001",
  "period": {
    "id": "uuid",
    "name": "January 2025"
  },
  "location": {
    "id": "uuid",
    "name": "Main Kitchen"
  },
  "supplier": {
    "id": "uuid",
    "code": "SUP001",
    "name": "ABC Suppliers"
  },
  "po_id": "uuid",
  "invoice_no": "INV-12345",
  "delivery_date": "2025-01-15",
  "delivery_note": "All items received",
  "total_amount": 3300.0,
  "has_variance": true,
  "lines": [
    {
      "id": "uuid",
      "item": {
        "id": "uuid",
        "code": "RICE001",
        "name": "Basmati Rice",
        "unit": "KG"
      },
      "quantity": 100.0,
      "unit_price": 25.5,
      "period_price": 25.0,
      "price_variance": 0.5,
      "line_value": 2550.0,
      "ncr_id": "uuid"
    }
  ],
  "posted_by": {
    "id": "uuid",
    "full_name": "Operator One"
  },
  "posted_at": "2025-01-15T10:30:00Z"
}
```

---

## Issue Endpoints

### GET /api/locations/:locationId/issues

Get issues for a location.

**Query Parameters:**

| Parameter     | Type   | Required | Default | Description           |
| ------------- | ------ | -------- | ------- | --------------------- |
| `page`        | number | No       | 1       | Page number           |
| `limit`       | number | No       | 50      | Items per page        |
| `period_id`   | string | No       | Current | Filter by period      |
| `cost_centre` | string | No       | -       | Filter by cost centre |
| `start_date`  | string | No       | -       | Filter by date range  |
| `end_date`    | string | No       | -       | Filter by date range  |

**Response (200):**

```json
{
  "issues": [
    {
      "id": "uuid",
      "issue_no": "ISS-2025-001",
      "issue_date": "2025-01-15",
      "cost_centre": "FOOD",
      "total_value": 1500.0,
      "posted_by": {
        "id": "uuid",
        "full_name": "Operator One"
      },
      "posted_at": "2025-01-15T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 15
  }
}
```

---

### POST /api/locations/:locationId/issues

Post a new issue.

**Request:**

```json
{
  "issue_date": "2025-01-15",
  "cost_centre": "FOOD",
  "notes": "Daily kitchen consumption",
  "lines": [
    {
      "item_id": "uuid",
      "quantity": 10.0
    },
    {
      "item_id": "uuid",
      "quantity": 5.0
    }
  ]
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "issue_no": "ISS-2025-001",
  "total_value": 1500.0
}
```

**Business Logic:**

1. Validates period is OPEN
2. Validates sufficient stock for all items
3. Captures current WAC for each item (frozen at issue time)
4. Updates LocationStock: decreases on_hand, WAC unchanged
5. Calculates line_value = quantity × wac_at_issue

**Errors:**

- `400` - Period closed, insufficient stock
- `403` - No access to location
- `404` - Items not found

---

### GET /api/issues/:id

Get single issue details.

**Response (200):**

```json
{
  "id": "uuid",
  "issue_no": "ISS-2025-001",
  "period": {
    "id": "uuid",
    "name": "January 2025"
  },
  "location": {
    "id": "uuid",
    "name": "Main Kitchen"
  },
  "issue_date": "2025-01-15",
  "cost_centre": "FOOD",
  "total_value": 1500.0,
  "notes": "Daily consumption",
  "lines": [
    {
      "id": "uuid",
      "item": {
        "id": "uuid",
        "code": "RICE001",
        "name": "Basmati Rice",
        "unit": "KG"
      },
      "quantity": 10.0,
      "wac_at_issue": 25.0,
      "line_value": 250.0
    }
  ],
  "posted_by": {
    "id": "uuid",
    "full_name": "Operator One"
  },
  "posted_at": "2025-01-15T14:30:00Z"
}
```

---

## Transfer Endpoints

### GET /api/transfers

Get all transfers (with filters).

**Query Parameters:**

| Parameter          | Type   | Required | Default | Description                                            |
| ------------------ | ------ | -------- | ------- | ------------------------------------------------------ |
| `page`             | number | No       | 1       | Page number                                            |
| `limit`            | number | No       | 50      | Items per page                                         |
| `status`           | string | No       | -       | Filter by status                                       |
| `from_location_id` | string | No       | -       | Filter by source location                              |
| `to_location_id`   | string | No       | -       | Filter by destination location                         |
| `direction`        | string | No       | -       | `outbound` or `inbound` (requires location_id context) |

**Response (200):**

```json
{
  "transfers": [
    {
      "id": "uuid",
      "transfer_no": "TRF-2025-001",
      "from_location": {
        "id": "uuid",
        "name": "Main Kitchen"
      },
      "to_location": {
        "id": "uuid",
        "name": "Main Store"
      },
      "status": "PENDING_APPROVAL",
      "request_date": "2025-01-15",
      "total_value": 500.0,
      "requested_by": {
        "id": "uuid",
        "full_name": "Operator One"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 10
  }
}
```

---

### POST /api/transfers

Create new transfer.

**Request:**

```json
{
  "from_location_id": "uuid",
  "to_location_id": "uuid",
  "request_date": "2025-01-15",
  "notes": "Stock transfer for store replenishment",
  "lines": [
    {
      "item_id": "uuid",
      "quantity": 20.0
    }
  ]
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "transfer_no": "TRF-2025-001",
  "status": "DRAFT",
  "total_value": 500.0
}
```

**Business Logic:**

1. Validates from_location ≠ to_location
2. Validates user has access to both locations
3. Captures WAC from source location
4. Creates transfer with status DRAFT
5. Does NOT move stock yet (happens on approval)

**Errors:**

- `400` - Same location
- `403` - No access to locations
- `404` - Locations or items not found

---

### PATCH /api/transfers/:id/approve

Approve transfer and execute stock movement (Supervisor/Admin only).

**Request:**

```json
{
  "notes": "Approved - urgent stock need"
}
```

**Response (200):**

```json
{
  "id": "uuid",
  "transfer_no": "TRF-2025-001",
  "status": "COMPLETED",
  "transfer_date": "2025-01-15",
  "total_value": 500.0
}
```

**Business Logic:**

1. Validates user is Supervisor or Admin
2. Validates transfer status is PENDING_APPROVAL
3. Validates sufficient stock at source
4. **Atomic operation:**
   - Deducts stock from source location
   - Adds stock to destination location with source WAC
   - Updates transfer status to COMPLETED
   - Sets approval_date and transfer_date

**Errors:**

- `403` - Not supervisor/admin
- `400` - Invalid status, insufficient stock
- `404` - Transfer not found

---

### PATCH /api/transfers/:id/reject

Reject transfer (Supervisor/Admin only).

**Request:**

```json
{
  "notes": "Stock not available"
}
```

**Response (200):**

```json
{
  "id": "uuid",
  "transfer_no": "TRF-2025-001",
  "status": "REJECTED"
}
```

---

### GET /api/transfers/:id

Get single transfer details.

**Response (200):**

```json
{
  "id": "uuid",
  "transfer_no": "TRF-2025-001",
  "from_location": {
    "id": "uuid",
    "code": "KITCHEN",
    "name": "Main Kitchen"
  },
  "to_location": {
    "id": "uuid",
    "code": "STORE",
    "name": "Main Store"
  },
  "status": "COMPLETED",
  "request_date": "2025-01-15",
  "approval_date": "2025-01-15",
  "transfer_date": "2025-01-15",
  "total_value": 500.0,
  "notes": "Stock replenishment",
  "lines": [
    {
      "id": "uuid",
      "item": {
        "id": "uuid",
        "code": "RICE001",
        "name": "Basmati Rice",
        "unit": "KG"
      },
      "quantity": 20.0,
      "wac_at_transfer": 25.0,
      "line_value": 500.0
    }
  ],
  "requested_by": {
    "id": "uuid",
    "full_name": "Operator One"
  },
  "approved_by": {
    "id": "uuid",
    "full_name": "Supervisor User"
  }
}
```

---

## Period Endpoints

### GET /api/periods

Get all periods.

**Query Parameters:**

| Parameter | Type   | Required | Default | Description      |
| --------- | ------ | -------- | ------- | ---------------- |
| `status`  | string | No       | -       | Filter by status |

**Response (200):**

```json
{
  "periods": [
    {
      "id": "uuid",
      "name": "January 2025",
      "start_date": "2025-01-01",
      "end_date": "2025-01-31",
      "status": "OPEN",
      "created_at": "2024-12-30T00:00:00Z"
    }
  ]
}
```

---

### GET /api/periods/current

Get currently open period.

**Response (200):**

```json
{
  "id": "uuid",
  "name": "January 2025",
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "status": "OPEN"
}
```

**Errors:**

- `404` - No open period

---

### POST /api/periods/:periodId/close

Initiate period close (Admin only).

**Request:**

```json
{
  "notes": "End of month close for January 2025"
}
```

**Response (200):**

```json
{
  "id": "uuid",
  "name": "January 2025",
  "status": "PENDING_CLOSE",
  "locations_status": [
    {
      "location_id": "uuid",
      "location_name": "Main Kitchen",
      "status": "READY",
      "closing_value": 150000.0
    }
  ]
}
```

**Business Logic:**

1. Validates user is Admin
2. Validates all locations are READY
3. Captures stock snapshots for all locations
4. Updates period status to PENDING_CLOSE
5. Creates next period (if not exists)

**Errors:**

- `403` - Not admin
- `400` - Not all locations ready

---

### PATCH /api/periods/:periodId/locations/:locationId/ready

Mark location as ready for period close (Supervisor/Admin).

**Response (200):**

```json
{
  "period_id": "uuid",
  "location_id": "uuid",
  "status": "READY",
  "closing_value": 150000.0,
  "ready_at": "2025-01-31T23:59:00Z"
}
```

**Business Logic:**

1. Validates user is Supervisor or Admin
2. Validates user has access to location
3. Calculates closing stock value
4. Updates PeriodLocation status to READY

**Errors:**

- `403` - Not supervisor/admin or no access
- `400` - Period not open

---

## Report Endpoints

### GET /api/reports/stock-now

Get current stock report (all locations or specific location).

**Query Parameters:**

| Parameter        | Type    | Required | Default | Description               |
| ---------------- | ------- | -------- | ------- | ------------------------- |
| `location_id`    | string  | No       | All     | Filter by location        |
| `category`       | string  | No       | -       | Filter by item category   |
| `low_stock_only` | boolean | No       | false   | Show only low stock items |

**Response (200):**

```json
{
  "report_date": "2025-01-15T10:00:00Z",
  "stock": [
    {
      "item": {
        "id": "uuid",
        "code": "RICE001",
        "name": "Basmati Rice",
        "unit": "KG",
        "category": "Grains"
      },
      "location": {
        "id": "uuid",
        "code": "KITCHEN",
        "name": "Main Kitchen"
      },
      "on_hand": 100.0,
      "wac": 25.0,
      "stock_value": 2500.0,
      "min_stock": 50.0,
      "is_low_stock": false
    }
  ],
  "summary": {
    "total_stock_value": 150000.0,
    "low_stock_items": 5
  }
}
```

---

### GET /api/reports/reconciliation

Get reconciliation report for a period and location.

**Query Parameters:**

| Parameter     | Type   | Required | Description |
| ------------- | ------ | -------- | ----------- |
| `period_id`   | string | Yes      | Period ID   |
| `location_id` | string | Yes      | Location ID |

**Response (200):**

```json
{
  "period": {
    "id": "uuid",
    "name": "January 2025"
  },
  "location": {
    "id": "uuid",
    "name": "Main Kitchen"
  },
  "opening_stock": 100000.0,
  "receipts": 75000.0,
  "transfers_in": 5000.0,
  "transfers_out": 10000.0,
  "issues": 50000.0,
  "adjustments": 0.0,
  "back_charges": 500.0,
  "credits": 200.0,
  "condemnations": 300.0,
  "closing_stock": 119400.0,
  "variance": 0.0
}
```

**Formula:**

```
closing_stock = opening_stock + receipts + transfers_in
                - transfers_out - issues + adjustments
                - back_charges + credits - condemnations
```

---

## Utility Endpoints

### GET /api/health

Health check endpoint (no auth required).

**Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:00:00Z",
  "database": "connected"
}
```

---

### GET /api/user/locations

Get current user's accessible locations.

**Response (200):**

```json
{
  "locations": [
    {
      "location_id": "uuid",
      "location": {
        "id": "uuid",
        "code": "KITCHEN",
        "name": "Main Kitchen",
        "type": "KITCHEN"
      },
      "access_level": "MANAGE"
    }
  ]
}
```

---

## Request/Response Examples

### Example: Post Delivery with Price Variance

**Request:**

```http
POST /api/locations/abc-123/deliveries
Content-Type: application/json

{
  "supplier_id": "sup-123",
  "delivery_date": "2025-01-15",
  "invoice_no": "INV-5678",
  "lines": [
    {
      "item_id": "item-456",
      "quantity": 100.00,
      "unit_price": 26.00
    }
  ]
}
```

**Response (201):**

```json
{
  "id": "del-789",
  "delivery_no": "DEL-2025-001",
  "total_amount": 2600.0,
  "has_variance": true,
  "ncrs_created": [
    {
      "ncr_id": "ncr-101",
      "ncr_no": "NCR-2025-001",
      "item_id": "item-456",
      "item_name": "Basmati Rice",
      "expected_price": 25.0,
      "actual_price": 26.0,
      "variance_amount": 100.0,
      "reason": "Price variance: Actual SAR 26.00 vs Period SAR 25.00 (Variance: SAR 1.00 per KG, Total: SAR 100.00)"
    }
  ]
}
```

---

## Rate Limiting

Currently no rate limiting implemented. Future versions may include:

- 100 requests per minute per user
- 1000 requests per hour per user
- 429 Too Many Requests response

---

## API Versioning

Current version: **v1** (implicit, no version prefix)

Future versions will use:

- `GET /api/v2/items` - Versioned endpoints

---

**Last Updated:** 2025-11-27
**API Framework:** Nuxt Server Routes (Nitro/H3)
**Location:** `server/api/`
