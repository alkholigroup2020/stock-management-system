# API Contracts: NCR Integration with Reconciliations

**Feature Branch**: `001-ncr-reconciliation-integration`
**Date**: 2026-01-17

## Overview

This document defines the API contracts for NCR-Reconciliation integration. It includes new endpoints and modifications to existing endpoints.

---

## 1. PATCH /api/ncrs/:id (MODIFIED)

### Purpose
Update an NCR's status with optional resolution fields. Extended to support `resolution_type` and `financial_impact` when status is RESOLVED.

### Request

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | NCR ID |

**Body**:
```typescript
{
  status?: "OPEN" | "SENT" | "CREDITED" | "REJECTED" | "RESOLVED";
  resolution_notes?: string;
  resolution_type?: string;      // NEW: Required when status=RESOLVED
  financial_impact?: "NONE" | "CREDIT" | "LOSS";  // NEW: Required when status=RESOLVED
}
```

### Validation Rules

```typescript
const bodySchema = z.object({
  status: z.enum(["OPEN", "SENT", "CREDITED", "REJECTED", "RESOLVED"]).optional(),
  resolution_notes: z.string().max(1000).optional(),
  resolution_type: z.string().min(1).max(200).optional(),
  financial_impact: z.enum(["NONE", "CREDIT", "LOSS"]).optional(),
}).refine(
  (data) => {
    // If status is RESOLVED, require resolution_type and financial_impact
    if (data.status === "RESOLVED") {
      return !!data.resolution_type && !!data.financial_impact;
    }
    return true;
  },
  {
    message: "resolution_type and financial_impact are required when status is RESOLVED",
    path: ["resolution_type"],
  }
);
```

### Response

**Success (200)**:
```json
{
  "message": "NCR updated successfully",
  "ncr": {
    "id": "uuid",
    "ncr_no": "NCR-2026-0001",
    "location": { "id": "uuid", "code": "KIT", "name": "Kitchen" },
    "type": "MANUAL",
    "auto_generated": false,
    "delivery": null,
    "delivery_line": null,
    "reason": "Quality issue with received goods",
    "quantity": 10.0000,
    "value": 500.00,
    "status": "RESOLVED",
    "creator": { "id": "uuid", "username": "john.doe", "full_name": "John Doe" },
    "created_at": "2026-01-15T10:00:00Z",
    "resolved_at": "2026-01-17T14:30:00Z",
    "resolution_notes": "Supplier sent replacement",
    "resolution_type": "Replacement",
    "financial_impact": "NONE"
  }
}
```

**Error Responses**:

| Code | Error Code | Description |
|------|------------|-------------|
| 400 | `RESOLUTION_FIELDS_REQUIRED` | resolution_type and financial_impact required for RESOLVED status |
| 400 | `INVALID_STATUS_TRANSITION` | Invalid status transition |
| 403 | `LOCATION_ACCESS_DENIED` | User lacks access to NCR's location |
| 404 | `NCR_NOT_FOUND` | NCR not found |

---

## 2. GET /api/ncrs/summary (NEW)

### Purpose
Retrieve NCR summary by period and location, categorized by status for reconciliation display.

### Request

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `periodId` | UUID | Yes | Period ID |
| `locationId` | UUID | Yes | Location ID |

### Response

**Success (200)**:
```json
{
  "credited": {
    "total": 500.00,
    "count": 2,
    "ncrs": [
      {
        "id": "uuid",
        "ncr_no": "NCR-2026-0001",
        "value": 300.00,
        "delivery_no": "DEL-2026-0042",
        "item_name": "Olive Oil",
        "reason": "Price variance - supplier credited"
      },
      {
        "id": "uuid",
        "ncr_no": "NCR-2026-0003",
        "value": 200.00,
        "delivery_no": null,
        "item_name": null,
        "reason": "Quality issue - credit received"
      }
    ]
  },
  "losses": {
    "total": 150.00,
    "count": 1,
    "ncrs": [
      {
        "id": "uuid",
        "ncr_no": "NCR-2026-0002",
        "value": 150.00,
        "delivery_no": "DEL-2026-0045",
        "item_name": "Fresh Vegetables",
        "reason": "Supplier rejected claim"
      }
    ]
  },
  "pending": {
    "total": 200.00,
    "count": 1,
    "ncrs": [
      {
        "id": "uuid",
        "ncr_no": "NCR-2026-0004",
        "value": 200.00,
        "delivery_no": "DEL-2026-0048",
        "item_name": "Dairy Products",
        "reason": "Price variance - awaiting supplier response"
      }
    ]
  },
  "open": {
    "count": 3,
    "ncrs": [
      {
        "id": "uuid",
        "ncr_no": "NCR-2026-0005",
        "value": 100.00,
        "delivery_no": null,
        "item_name": null,
        "reason": "Quality defect - pending investigation"
      }
    ]
  }
}
```

**Query Logic**:
```typescript
// Credited: CREDITED status OR (RESOLVED with CREDIT impact)
credited = NCRs WHERE (status = 'CREDITED')
                  OR (status = 'RESOLVED' AND financial_impact = 'CREDIT')

// Losses: REJECTED status OR (RESOLVED with LOSS impact)
losses = NCRs WHERE (status = 'REJECTED')
                OR (status = 'RESOLVED' AND financial_impact = 'LOSS')

// Pending: SENT status
pending = NCRs WHERE status = 'SENT'

// Open: OPEN status
open = NCRs WHERE status = 'OPEN'
```

**Error Responses**:

| Code | Error Code | Description |
|------|------------|-------------|
| 400 | `MISSING_PARAMETERS` | periodId or locationId missing |
| 403 | `LOCATION_ACCESS_DENIED` | User lacks access to location |
| 404 | `PERIOD_NOT_FOUND` | Period not found |
| 404 | `LOCATION_NOT_FOUND` | Location not found |

---

## 3. POST /api/reconciliations (MODIFIED)

### Purpose
Save or update reconciliation adjustments. Extended to calculate and store NCR credits/losses.

### Request

**Body** (unchanged):
```typescript
{
  periodId: string;      // UUID
  locationId: string;    // UUID
  back_charges: number;  // >= 0
  credits: number;       // >= 0 (manual credits, NOT ncr_credits)
  condemnations: number; // >= 0
  adjustments: number;   // >= 0
}
```

### Response

**Success (200)** (extended):
```json
{
  "success": true,
  "message": "Reconciliation adjustments saved successfully",
  "reconciliation": {
    "id": "uuid",
    "period_id": "uuid",
    "location_id": "uuid",
    "opening_stock": 125000.00,
    "receipts": 45000.00,
    "transfers_in": 5000.00,
    "transfers_out": 3000.00,
    "issues": 35000.00,
    "closing_stock": 137000.00,
    "back_charges": 1000.00,
    "credits": 500.00,
    "ncr_credits": 500.00,
    "ncr_losses": 150.00,
    "condemnations": 1000.00,
    "adjustments": 0.00,
    "last_updated": "2026-01-17T15:00:00Z"
  },
  "calculations": {
    "consumption": 34150.00,
    "total_adjustments": 150.00
  },
  "ncr_breakdown": {
    "credited": { "total": 500.00, "count": 2 },
    "losses": { "total": 150.00, "count": 1 },
    "pending": { "total": 200.00, "count": 1 },
    "open": { "count": 3 }
  }
}
```

**Consumption Calculation** (updated):
```typescript
// NCR impact on adjustments
const ncrImpact = ncr_losses - ncr_credits;

// Updated total adjustments formula
const totalAdjustments = back_charges - credits - condemnations + adjustments + ncrImpact;

// Consumption formula (unchanged structure)
const consumption = openingStock + receipts + transfersIn
                  - transfersOut - closingStock + totalAdjustments;
```

---

## 4. POST /api/periods/:periodId/close (MODIFIED)

### Purpose
Request period close. Extended to include OPEN NCR warning in response.

### Request (unchanged)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `periodId` | UUID | Yes | Period ID |

### Response

**Success (200)** (extended):
```json
{
  "approval": {
    "id": "uuid",
    "status": "PENDING",
    "requestedAt": "2026-01-17T16:00:00Z",
    "entityType": "PERIOD_CLOSE"
  },
  "period": {
    "id": "uuid",
    "period_no": "2026-01",
    "status": "PENDING_CLOSE"
  },
  "warnings": {
    "openNCRs": {
      "count": 5,
      "totalValue": 1500.00,
      "byLocation": [
        {
          "locationId": "uuid",
          "locationCode": "KIT",
          "locationName": "Kitchen",
          "count": 3,
          "value": 800.00
        },
        {
          "locationId": "uuid",
          "locationCode": "STR",
          "locationName": "Store",
          "count": 2,
          "value": 700.00
        }
      ]
    }
  },
  "message": "Period close approval request created successfully"
}
```

**Note**: `warnings` object is only included if OPEN NCRs exist. Period close proceeds regardless (non-blocking).

---

## 5. GET /api/reconciliations/consolidated (MODIFIED)

### Purpose
Retrieve consolidated reconciliation data across all locations. Extended to include NCR data.

### Response (extended fields only)

```json
{
  "locations": [
    {
      "location": { "id": "uuid", "code": "KIT", "name": "Kitchen" },
      "reconciliation": {
        "ncr_credits": 500.00,
        "ncr_losses": 150.00
      }
    }
  ],
  "totals": {
    "ncr_credits": 1200.00,
    "ncr_losses": 350.00
  }
}
```

---

## Error Code Reference

| Code | HTTP | Description |
|------|------|-------------|
| `NOT_AUTHENTICATED` | 401 | User not logged in |
| `INSUFFICIENT_PERMISSIONS` | 403 | User role insufficient |
| `LOCATION_ACCESS_DENIED` | 403 | User lacks location access |
| `MISSING_PARAMETERS` | 400 | Required parameters missing |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `RESOLUTION_FIELDS_REQUIRED` | 400 | resolution_type/financial_impact required for RESOLVED |
| `INVALID_STATUS_TRANSITION` | 400 | Invalid NCR status transition |
| `NCR_NOT_FOUND` | 404 | NCR not found |
| `PERIOD_NOT_FOUND` | 404 | Period not found |
| `LOCATION_NOT_FOUND` | 404 | Location not found |
| `PERIOD_CLOSED` | 400 | Cannot modify closed period |

---

## Authentication & Authorization

All endpoints require authentication (`event.context.user`).

| Endpoint | Allowed Roles | Location Check |
|----------|---------------|----------------|
| PATCH /api/ncrs/:id | OPERATOR, SUPERVISOR, ADMIN | Operators need explicit location access |
| GET /api/ncrs/summary | SUPERVISOR, ADMIN | Validates user has location access |
| POST /api/reconciliations | SUPERVISOR, ADMIN | Validates user has location access |
| POST /api/periods/:periodId/close | ADMIN only | N/A (all locations) |
| GET /api/reconciliations/consolidated | SUPERVISOR, ADMIN | Returns all locations user can access |
