# Reconciliations - End-to-End Report

## Stock Management System

---

## 1. Executive Summary

Reconciliations are the **month-end financial summary** that calculates consumption and cost per manday for each location. They combine all stock movements (opening stock, receipts, transfers, issues, closing stock) with manual adjustments to produce the final figures that matter to management.

**Key Points:**

- Per-location reconciliations with consolidated view
- No approval required for adjustments
- Feeds into Period Close workflow
- Primary output: **Consumption** and **Manday Cost**

---

## 2. Purpose & Business Value

### What Reconciliations Do

- Calculate actual consumption for the period
- Compute cost per person per day (Manday Cost)
- Reconcile system stock with physical counts
- Track adjustments (credits, back-charges, condemnations)
- Provide financial accountability for management

### Why It Matters

- **Accuracy:** Ensures stock values match reality
- **Cost Control:** Tracks cost per manday for budgeting
- **Audit Trail:** Documents all adjustments with reasons
- **Period Close:** Required before closing any period

---

## 3. User Roles & Permissions

| Role           | Reconciliation Access                                        |
| -------------- | ------------------------------------------------------------ |
| **Operator**   | View only (no edit)                                          |
| **Supervisor** | Full access - view, edit adjustments, prepare reconciliation |
| **Admin**      | Full access - all locations, consolidated view               |

---

## 4. The Core Formula

### Single Location Consumption

```
CONSUMPTION = Opening Stock
            + Receipts (deliveries)
            + Transfers In
            - Closing Stock (physical count)
            - Transfers Out
            +/- Adjustments
```

### Multi-Location Total

```
Total Consumption = Sum(All Location Consumptions)
```

### Manday Cost

```
Manday Cost = Total Consumption / Total Mandays
```

---

## 5. Data Components

### 5.1 Automatic Data (System-Calculated)

| Component         | Source                   | Description                                    |
| ----------------- | ------------------------ | ---------------------------------------------- |
| **Opening Stock** | Previous period snapshot | Value carried forward from last period close   |
| **Receipts**      | Deliveries posted        | Sum of all delivery values in period           |
| **Transfers In**  | Transfer records         | Stock received from other locations (at source WAC) |
| **Transfers Out** | Transfer records         | Stock sent to other locations (at current WAC) |
| **Issues**        | Issues posted            | Sum of all issue values (Food + Clean)         |
| **Total Mandays** | POB entries              | Sum of (Crew + Extra) for all days in period   |

### 5.2 Manual Adjustments (User-Entered)

| Adjustment        | Effect   | Description                            |
| ----------------- | -------- | -------------------------------------- |
| **Closing Stock** | Subtract | Physical count value entered by supervisor |
| **Back-charges**  | Add      | Costs charged back to consumption      |
| **Credits Due**   | Subtract | Supplier credits from NCRs             |
| **Condemnations** | Add      | Items written off (damaged/expired)    |
| **Others**        | +/-      | Miscellaneous adjustments              |

---

## 6. End-to-End Workflow

### 6.1 Daily Operations (Days 1-28)

```
Post Deliveries -> Stock increases, WAC updates
Post Issues -> Stock decreases at current WAC
Update POB -> Mandays accumulate
Process Transfers -> Stock moves between locations
Handle NCRs -> Credits accumulate
```

### 6.2 Month-End Preparation (Days 29-30)

```
1. Ensure all deliveries posted
2. Ensure all issues posted
3. Process all pending transfers
4. Review and update NCRs
5. Conduct physical stock count
6. Compare physical count to Stock Now
7. Enter Closing Stock value in Reconciliations
```

### 6.3 Reconciliation Entry (Day 30-31)

```
1. Supervisor opens Reconciliations page
2. System displays auto-calculated values:
   - Opening Stock (from snapshot)
   - Receipts (from deliveries)
   - Transfers In/Out
   - Issues total
   - Total Mandays (from POB)
3. Supervisor enters:
   - Closing Stock (from physical count)
   - Back-charges (if any)
   - Credits Due (from NCRs)
   - Condemnations (if any)
   - Other adjustments
4. System calculates Consumption and Manday Cost
5. Supervisor reviews final numbers
```

### 6.4 Period Close (Day 31)

```
1. All locations complete reconciliations
2. System validates all locations ready
3. Admin reviews consolidated view
4. Admin requests Period Close approval
5. System closes all locations simultaneously
6. Snapshot saved, next period opens
```

---

## 7. Calculation Example

### Sample Data

```
Opening Stock:        SAR 12,000
+ Receipts:           SAR 45,000
+ Transfers In:       SAR  5,000
- Transfers Out:      SAR  3,000
- Closing Stock:      SAR 11,500
- Credits Due:        SAR    800
+ Back-charges:       SAR    300
+ Condemnations:      SAR    200
--------------------------------------
= CONSUMPTION:        SAR 47,200

Total Mandays: 1,350 (from POB)
MANDAY COST = SAR 47,200 / 1,350 = SAR 34.96 per person/day
```

---

## 8. API Endpoints

### Get Location Reconciliation

```
GET /api/locations/{locationId}/reconciliations/{periodId}
```

**Response:**

```json
{
  "location": "Riyadh Central Kitchen",
  "period": "2025-11",
  "opening_stock": 125000.0,
  "receipts": 45000.0,
  "transfers_in": 5000.0,
  "transfers_out": 3000.0,
  "issues": 35000.0,
  "closing_stock": 137000.0,
  "adjustments": -500.0,
  "consumption": 34500.0,
  "total_mandays": 2100,
  "manday_cost": 16.43
}
```

### Update Reconciliation

```
PATCH /api/locations/{locationId}/reconciliations/{periodId}
```

**Body:**

```json
{
  "closing_stock": 137000.0,
  "adjustments": -500.0,
  "back_charges": 1000.0,
  "credits": 500.0,
  "condemnations": 200.0
}
```

---

## 9. Data Flow Diagram

```
[DELIVERIES] --------> Receipts Total --------+
                                              |
[TRANSFERS IN] -----> Transfer Value ---------+
                                              |
[PREVIOUS PERIOD] --> Opening Stock ----------+-----> [RECONCILIATIONS]
                                              |             |
[TRANSFERS OUT] ----> Transfer Value ---------+             v
                                              |       Consumption &
[PHYSICAL COUNT] ---> Closing Stock ----------+       Manday Cost
                                              |             |
[NCRs] -------------> Credits Due ------------+             v
                                              |      [PERIOD CLOSE]
[POB] --------------> Total Mandays ----------+             |
                                                            v
                                                     Snapshot Saved
                                                            |
                                                            v
                                                     Next Period Opens
```

---

## 10. Business Rules

### Critical Validations

1. **Period must be OPEN** - Cannot modify reconciliation for closed periods
2. **Closing stock required** - Must enter physical count value before close
3. **Mandays > 0** - Cannot calculate Manday Cost with zero mandays
4. **Location access** - Users can only view/edit authorized locations

### No Approval Required

- Reconciliation adjustments post immediately
- No supervisor/admin approval workflow for adjustments
- Changes are audited (who/when/what)

### Audit Trail

Every reconciliation change logs:

- User ID
- Timestamp (UTC)
- Previous values
- New values
- Location context

---

## 11. Integration Points

| System Component | Integration                    |
| ---------------- | ------------------------------ |
| **Deliveries**   | Feeds receipts total           |
| **Issues**       | Feeds consumption ledger       |
| **Transfers**    | Feeds transfers in/out         |
| **POB**          | Feeds total mandays            |
| **NCRs**         | Feeds credits due              |
| **Stock Now**    | Reference for closing stock    |
| **Period Close** | Consumes reconciliation data   |
| **Dashboard**    | Displays reconciliation summary |

---

## 12. Performance Requirements

| Operation              | Target Response Time |
| ---------------------- | -------------------- |
| Load reconciliation    | < 2 seconds          |
| Save adjustments       | < 1 second           |
| Calculate consumption  | < 500ms              |
| Consolidated report    | < 5 seconds          |

---

## 13. Success Metrics

- **Accuracy:** Reconciliation variance < 2% from physical count
- **Timeliness:** All reconciliations completed by day 30
- **Efficiency:** Month-end close < 2 hours for all locations
- **Adoption:** 100% of locations using system reconciliations

---

## 14. Common Questions

**Q: What if my physical count differs from Stock Now?**
A: Enter your actual physical count as Closing Stock. The difference becomes part of consumption.

**Q: Can I edit reconciliation after period close?**
A: No. Closed periods are locked. Adjustments go in the next period.

**Q: Why is my Manday Cost different than expected?**
A: Check all adjustment entries and verify POB totals are correct.

**Q: Who can see all location reconciliations?**
A: Supervisors and Admins have access to all locations and consolidated views.

---

**Document Version:** 1.0
**Generated:** December 2025
**Source:** PRD, MVP, System Design, Workflow Guide, API Contract, Development Stack
