# Period Close Feature - End-to-End Report

**Document Version:** 1.0
**Date:** December 20, 2025
**System:** Stock Management System - Multi-Location

---

## Executive Summary

The **Period Close** feature is a critical month-end process that finalizes accounting for all locations simultaneously. It locks the current period, creates permanent snapshots, and automatically rolls forward opening balances to the next period. This feature requires Admin approval and cannot be undone once executed.

---

## 1. Feature Purpose

### What Period Close Does

| Action | Description |
|--------|-------------|
| **Lock the Month** | Prevents any further edits to the closed period |
| **Create Snapshots** | Saves a permanent record of each location's final state |
| **Roll Forward** | Sets opening balances for next period = closing balances |
| **Start New Period** | Automatically creates and opens the next accounting period |

### Why It Matters

- Ensures data integrity and accountability
- Creates clear audit boundaries between periods
- Prevents backdated changes after month-end reporting
- Synchronizes all locations to the same period state

---

## 2. Pre-requisites Checklist

Before Period Close can be executed, ALL of the following must be complete:

### Operations Complete
- [ ] All deliveries for the period have been posted
- [ ] All issues for the period have been posted
- [ ] All transfers between locations have been completed
- [ ] All NCRs have been reviewed (resolved or pending next period)

### Reconciliation Complete
- [ ] Physical stock count completed at each location
- [ ] Closing stock values entered in Reconciliations
- [ ] Adjustments entered (back-charges, credits, condemnations)
- [ ] Consumption and Manday Cost reviewed

### Location Readiness
- [ ] Each location marked as "READY" by Supervisor
- [ ] ALL locations must be ready (no partial closes allowed)

---

## 3. Period State Machine

The period follows a strict state progression:

```
┌─────────┐     All Locations     ┌────────────────┐     Admin      ┌──────────┐     System     ┌────────┐
│  OPEN   │ ─────── Ready ──────► │ PENDING_CLOSE  │ ── Approves ──► │ APPROVED │ ── Executes ──► │ CLOSED │
└─────────┘                       └────────────────┘                 └──────────┘                 └────────┘
     │                                    │
     │                                    │ Supervisor
     │◄─────── Issues Found ──────────────┘ Reverts
```

### State Descriptions

| State | Description | Allowed Operations |
|-------|-------------|-------------------|
| **OPEN** | Normal operations | Post deliveries, issues, transfers, update POB, edit reconciliations |
| **PENDING_CLOSE** | Awaiting approval | View only, no new transactions, Admin can approve or Supervisor can revert |
| **APPROVED** | System executing | No user operations, system processing close |
| **CLOSED** | Locked | Read-only access, historical reference only |

---

## 4. Multi-Location Coordination

### Critical Constraint

> **All locations must close together. Partial period closes are NOT supported.**

### How It Works

1. **Location Status Tracking**
   - Each location has a `PeriodLocation` record
   - Tracks: `periodId`, `locationId`, `status`, `openingSnapshot`, `closingSnapshot`
   - Status per location: NOT_READY → READY

2. **Readiness Dashboard**
   ```
   Period: 2025-11

   Location         Status      Reconciliation
   ─────────────────────────────────────────────
   Riyadh Kitchen   ✅ READY    Complete
   Riyadh Store     ✅ READY    Complete
   Central          ❌ NOT_READY Pending count
   Warehouse        ✅ READY    Complete

   Locations Ready: 3/4
   [Close Period] ← Disabled until 4/4
   ```

3. **Why Simultaneous Close?**
   - Ensures transfers between locations balance correctly
   - Prevents period mismatch between locations
   - Simplifies reporting and consolidation
   - Maintains data consistency across the organization

---

## 5. User Roles & Permissions

### Who Does What

| Role | Capabilities | Period Close Actions |
|------|-------------|---------------------|
| **Operator** | Post deliveries, issues, view stock | Cannot close or mark ready |
| **Supervisor** | Review reconciliations, approve transfers | Mark location as READY, cannot approve close |
| **Admin** | Full system access | Approve and execute Period Close |

### Approval Workflow

```
Supervisor (each location)           Admin
        │                              │
        ▼                              │
 Mark Location Ready                   │
        │                              │
        ├─── All Locations Ready ─────►│
                                       │
                                       ▼
                               Review & Approve
                                       │
                                       ▼
                                System Executes
                                   Close
```

---

## 6. The Close Process - Step by Step

### Phase 1: Preparation (Days 1-28 of period)

1. **Daily Operations**
   - Post deliveries as they arrive
   - Post issues as kitchen uses items
   - Update POB daily
   - Process transfers as needed

2. **NCR Management**
   - Create NCRs for damaged/short deliveries
   - Track price variance NCRs (auto-generated)
   - Update credit status

### Phase 2: Month-End (Last 3 days)

3. **Finalize Transactions (Day 29)**
   - Ensure all deliveries are posted
   - Ensure all issues are posted
   - Complete pending transfers
   - Review open NCRs

4. **Physical Count & Reconciliation (Day 30)**
   - Perform physical stock count at each location
   - Enter closing stock values in system
   - Enter adjustments:
     - Back-charges (add to consumption)
     - Credits from NCRs (subtract from consumption)
     - Condemnations (add to consumption)
     - Other adjustments

5. **Reconciliation Review**
   - Verify consumption calculation:
     ```
     Consumption = Opening Stock
                 + Receipts (deliveries)
                 + Transfers In
                 - Transfers Out
                 - Closing Stock
                 ± Adjustments
     ```
   - Verify Manday Cost:
     ```
     Manday Cost = Total Consumption ÷ Total Mandays
     ```

### Phase 3: Close Execution (Day 31)

6. **Mark Locations Ready**
   - Each Supervisor reviews their location's reconciliation
   - Marks location as READY in the system
   - System tracks progress (e.g., "3/4 locations ready")

7. **Admin Approval**
   - Admin reviews consolidated summary
   - Verifies all locations are ready
   - Submits close request
   - Confirms with closing notes

8. **System Execution**
   - Validates all locations ready
   - Creates snapshots for each location
   - Updates period status to CLOSED
   - Creates new period (next month)
   - Sets opening balances = closing balances
   - Logs audit trail

---

## 7. API Endpoints

### Period Management

```http
# Get current period status
GET /api/periods/current

Response:
{
  "id": "period_202511",
  "name": "2025-11",
  "status": "OPEN",
  "start_date": "2025-11-01",
  "end_date": "2025-11-30",
  "locations_ready": 3,
  "locations_total": 5
}
```

```http
# Get location status for period
GET /api/periods/{periodId}/locations

Response:
{
  "locations": [
    {
      "id": "loc_123",
      "name": "Riyadh Kitchen",
      "status": "READY",
      "reconciliation_complete": true
    }
  ]
}
```

### Mark Location Ready

```http
# Mark location as ready for close
PATCH /api/periods/{periodId}/locations/{locationId}/ready

Body: { "ready": true }

Response:
{
  "location_id": "loc_123",
  "status": "READY",
  "period_ready_count": 4,
  "period_total_count": 4
}
```

### Approval Workflow

```http
# Request period close approval
POST /api/approvals

Body:
{
  "entity_type": "PERIOD_CLOSE",
  "entity_id": "period_202511",
  "notes": "All locations reconciled, ready for close"
}

Response:
{
  "approval_id": "appr_001",
  "status": "PENDING",
  "requested_by": "supervisor_name",
  "requested_at": "2025-11-30T18:00:00Z"
}
```

```http
# Admin approves close
PATCH /api/approvals/{id}

Body:
{
  "action": "APPROVE",
  "comments": "Verified all reconciliations"
}
```

### Execute Period Close

```http
# Close the period (after approval)
POST /api/periods/{id}/close

Body:
{
  "approval_token": "approval_xyz",
  "closing_notes": "November 2025 closed successfully"
}

Response:
{
  "period": {
    "id": "period_202511",
    "status": "CLOSED",
    "closed_at": "2025-11-30T23:59:59Z",
    "closed_by": "admin_name"
  },
  "next_period": {
    "id": "period_202512",
    "name": "2025-12",
    "status": "OPEN",
    "start_date": "2025-12-01"
  },
  "snapshots_created": 5,
  "message": "Period closed successfully. December 2025 is now open."
}
```

---

## 8. Data Captured in Snapshots

When a period closes, the system captures permanent snapshots:

### Per Location Snapshot

```json
{
  "location_id": "loc_123",
  "location_name": "Riyadh Kitchen",
  "period_id": "period_202511",
  "snapshot_type": "CLOSING",
  "captured_at": "2025-11-30T23:59:59Z",
  "data": {
    "stock_items": [
      {
        "item_id": "item_001",
        "item_code": "RIC001",
        "item_name": "Rice 5kg",
        "quantity": 150.5,
        "wac": 25.50,
        "value": 3837.75
      }
    ],
    "total_stock_value": 125430.50,
    "total_items": 156
  }
}
```

### Reconciliation Final Values

```json
{
  "location_id": "loc_123",
  "period_id": "period_202511",
  "opening_stock": 125000.00,
  "receipts": 45000.00,
  "transfers_in": 5000.00,
  "transfers_out": 3000.00,
  "issues": 35000.00,
  "closing_stock": 137000.00,
  "adjustments": {
    "back_charges": 1000.00,
    "credits": -500.00,
    "condemnations": 200.00,
    "others": 0.00
  },
  "consumption": 34500.00,
  "total_mandays": 2100,
  "manday_cost": 16.43
}
```

---

## 9. Error Handling

### Common Errors

| Error Code | HTTP Status | Scenario | Resolution |
|------------|-------------|----------|------------|
| `LOCATIONS_NOT_READY` | 400 | Not all locations marked ready | Supervisor must mark all locations ready |
| `PERIOD_ALREADY_CLOSED` | 400 | Attempting to close already closed period | No action needed |
| `PENDING_TRANSACTIONS` | 400 | Unposted deliveries/issues exist | Complete all transactions first |
| `APPROVAL_REQUIRED` | 202 | Close attempted without approval | Submit approval request first |
| `APPROVAL_EXPIRED` | 400 | Approval token expired | Request new approval |
| `INSUFFICIENT_PERMISSIONS` | 403 | Non-admin attempting close | Admin must perform close |

### Post-Close Errors

If a user tries to post to a closed period:

```json
{
  "statusCode": 400,
  "statusMessage": "Period Closed",
  "data": {
    "code": "PERIOD_CLOSED",
    "message": "Cannot post to period 2025-11. Period was closed on 2025-11-30.",
    "details": {
      "period_id": "period_202511",
      "closed_at": "2025-11-30T23:59:59Z",
      "current_period": "period_202512"
    }
  }
}
```

---

## 10. Post-Close Considerations

### What Happens After Close

1. **Period is Read-Only**
   - All data viewable but not editable
   - Historical reference preserved permanently

2. **Next Period Automatically Opened**
   - Opening balances = previous closing balances
   - Ready for new transactions immediately

3. **New Period Prices**
   - Admin can set new period prices
   - New prices become effective immediately
   - Previous period prices preserved in snapshot

### Adjustments for Closed Periods

> If errors are discovered after close, adjustments go in the NEXT period.

- No backdating allowed
- Create adjustment entries in current open period
- Document reason for adjustment

---

## 11. Consolidated Reporting

### Admin Dashboard - Period Close View

```
╔══════════════════════════════════════════════════════════════╗
║                    PERIOD CLOSE - 2025-11                     ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Location Status                                              ║
║  ─────────────────────────────────────────────────────────── ║
║  ✅ Riyadh Kitchen      READY    Consumption: SAR 34,500     ║
║  ✅ Riyadh Store        READY    Consumption: SAR 28,200     ║
║  ✅ Central Warehouse   READY    Consumption: SAR 12,100     ║
║  ❌ Jeddah Kitchen      NOT READY (Pending reconciliation)   ║
║                                                               ║
║  ─────────────────────────────────────────────────────────── ║
║                                                               ║
║  Consolidated Summary                                         ║
║  ─────────────────────────────────────────────────────────── ║
║  Total Opening Stock:       SAR 485,000                      ║
║  Total Receipts:            SAR 156,000                      ║
║  Total Transfers:           SAR 0 (balanced)                 ║
║  Total Closing Stock:       SAR 498,500                      ║
║  Total Consumption:         SAR 142,500                      ║
║  Total Mandays:             6,250                            ║
║  Average Manday Cost:       SAR 22.80                        ║
║                                                               ║
║  ─────────────────────────────────────────────────────────── ║
║                                                               ║
║  [ Request Close Approval ]  ← Disabled (1 location not ready)║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 12. Audit Trail

Every period close action is logged:

```json
{
  "audit_id": "aud_123456",
  "action": "PERIOD_CLOSE",
  "entity_type": "PERIOD",
  "entity_id": "period_202511",
  "user_id": "user_admin_001",
  "user_name": "Ahmed Hassan",
  "role": "ADMIN",
  "timestamp": "2025-11-30T23:59:59Z",
  "ip_address": "192.168.1.100",
  "details": {
    "period_name": "2025-11",
    "locations_closed": 4,
    "approval_id": "appr_001",
    "closing_notes": "All locations reconciled successfully"
  }
}
```

---

## 13. Performance Requirements

| Operation | Target Response Time |
|-----------|---------------------|
| Get period status | < 200ms |
| Mark location ready | < 500ms |
| Request approval | < 500ms |
| Execute period close | < 5000ms |
| Retrieve closed period data | < 2000ms |

---

## 14. Security Considerations

### Access Control

- Only **Admin** role can execute Period Close
- **Supervisor** can only mark their locations ready
- **Operator** has no Period Close permissions

### Data Protection

- Closed periods are immutable
- Snapshots stored with cryptographic hash
- All actions logged with user identity
- Cannot delete closed period data

### Validation

- Server-side validation of all locations ready
- Approval token verified before execution
- Concurrent close attempts blocked (optimistic locking)

---

## 15. Best Practices

### For Supervisors

1. **Daily Diligence**
   - Post transactions same day they occur
   - Don't backlog deliveries or issues

2. **Early Preparation**
   - Start reconciliation review 2-3 days before month-end
   - Schedule physical count in advance

3. **Communication**
   - Notify Admin when location is ready
   - Report any blockers immediately

### For Admins

1. **Monitor Progress**
   - Check locations ready count daily in last week
   - Follow up on locations not ready

2. **Verify Before Close**
   - Review consolidated numbers
   - Check for unusual variances
   - Ensure all NCRs are addressed

3. **Document Everything**
   - Add meaningful closing notes
   - Record any exceptions or issues

---

## 16. Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Cannot mark location ready | Reconciliation not complete | Complete all reconciliation entries |
| Close button disabled | Not all locations ready | Contact supervisors of pending locations |
| Approval request fails | Missing required data | Ensure all locations have snapshots |
| Close timeout | Large dataset | Wait and retry; contact support if persists |
| Wrong period closed | User error | Cannot undo; document in next period |

### Recovery Scenarios

**If close fails mid-execution:**
- System automatically rolls back
- Period returns to PENDING_CLOSE
- Admin can retry after issue resolved

**If system error during snapshot:**
- Snapshots are transactional
- All-or-nothing execution
- Retry safe after investigation

---

## 17. Summary

The Period Close feature is the cornerstone of the accounting cycle in the Stock Management System. Key points:

1. **Coordinated Close** - All locations must close together
2. **Approval Required** - Admin must explicitly approve
3. **Irreversible** - Cannot undo once closed
4. **Automatic Rollforward** - Next period created automatically
5. **Complete Audit Trail** - Every action logged permanently

Following the checklist and best practices ensures smooth month-end operations across all locations.

---

**Document Author:** System Analysis
**Based On:** PRD, MVP, System Design, Workflow Guide, API Contract, Development Stack
**For:** Stock Management System v1.0
