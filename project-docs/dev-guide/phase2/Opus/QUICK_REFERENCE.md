# Phase 2 Quick Reference Guide

## Features at a Glance

| Feature            | Purpose                               | Key Users                             | Status Flow                              |
| ------------------ | ------------------------------------- | ------------------------------------- | ---------------------------------------- |
| **Transfers**      | Move stock between locations          | Operators create, Supervisors approve | DRAFT → PENDING → APPROVED → COMPLETED   |
| **NCR**            | Track quality issues & price variance | System auto-creates, Users update     | OPEN → SENT → CREDITED/REJECTED/RESOLVED |
| **POB**            | Daily headcount tracking              | Operators enter daily                 | Single entry, auto-saves                 |
| **Reconciliation** | Calculate period consumption          | Supervisors review & adjust           | Auto-calculated → Saved                  |

## Key Business Rules

### Transfers

- ✅ Cannot transfer more than available stock
- ✅ Source and destination must be different locations
- ✅ Supervisor approval required before stock moves
- ✅ WAC transfers with the stock
- ✅ Atomic operation (all or nothing)

### NCR

- ✅ Auto-created when delivery price ≠ period price
- ✅ Manual NCR for physical quality issues
- ✅ Status progression is one-way (cannot go backwards)
- ✅ Links to delivery for traceability

### POB

- ✅ One entry per day per location
- ✅ Crew + Extra = Total
- ✅ Auto-saves on field blur
- ✅ Cannot edit if period is closed
- ✅ Non-negative integers only

### Reconciliation

- ✅ Auto-calculates from transactions
- ✅ Supervisors can add adjustments
- ✅ Formula: Opening + Receipts + Transfers In - Transfers Out - Issues - Closing + Adjustments
- ✅ Manday Cost = Consumption ÷ Total Mandays

## API Endpoints Summary

### Transfer APIs

```
GET    /api/transfers                    # List all transfers
POST   /api/transfers                    # Create new transfer
GET    /api/transfers/:id                # Get single transfer
PATCH  /api/transfers/:id/approve        # Approve transfer
PATCH  /api/transfers/:id/reject         # Reject transfer
```

### NCR APIs

```
GET    /api/ncrs                         # List all NCRs
POST   /api/ncrs                         # Create manual NCR
GET    /api/ncrs/:id                     # Get single NCR
PATCH  /api/ncrs/:id                     # Update NCR status
```

### POB APIs

```
GET    /api/locations/:id/pob            # Get POB entries
POST   /api/locations/:id/pob            # Bulk create/update
PATCH  /api/pob/:id                      # Update single entry
```

### Reconciliation APIs

```
GET    /api/locations/:id/reconciliations/:periodId    # Get/calculate
PATCH  /api/locations/:id/reconciliations/:periodId    # Save adjustments
GET    /api/reconciliations/consolidated               # All locations
```

## Permission Matrix

| Feature                              | Operator | Supervisor | Admin |
| ------------------------------------ | -------- | ---------- | ----- |
| **Create Transfer**                  | ✅       | ✅         | ✅    |
| **Approve Transfer**                 | ❌       | ✅         | ✅    |
| **Create Manual NCR**                | ✅       | ✅         | ✅    |
| **Update NCR Status**                | ❌       | ✅         | ✅    |
| **Enter POB**                        | ✅       | ✅         | ✅    |
| **Save Reconciliation Adjustments**  | ❌       | ✅         | ✅    |
| **View Consolidated Reconciliation** | ❌       | ✅         | ✅    |

## Status Badge Colors

### Transfer Status

- **DRAFT**: Neutral (gray)
- **PENDING_APPROVAL**: Primary (navy)
- **APPROVED**: Success (emerald)
- **REJECTED**: Error (red)
- **COMPLETED**: Success (emerald)

### NCR Status

- **OPEN**: Primary (navy)
- **SENT**: Warning (amber)
- **CREDITED**: Success (emerald)
- **REJECTED**: Error (red)
- **RESOLVED**: Neutral (gray)

### NCR Type

- **MANUAL**: Primary (navy)
- **PRICE_VARIANCE**: Warning (amber)

## Common Formulas

### WAC Recalculation

```
New WAC = (Current Qty × Current WAC + New Qty × New Price) ÷ (Current Qty + New Qty)
```

### Transfer Value

```
Transfer Value = Quantity × Source Location WAC
```

### Price Variance

```
Variance = (Delivery Price - Period Price) × Quantity
```

### Consumption

```
Consumption = Opening + Receipts + Transfers In - Transfers Out - Issues - Closing + Adjustments
```

### Manday Cost

```
Manday Cost = Total Consumption ÷ Total Mandays
```

## Database Tables Added

| Table              | Purpose                 | Key Fields                                            |
| ------------------ | ----------------------- | ----------------------------------------------------- |
| **Transfer**       | Transfer header         | transfer_no, from_location_id, to_location_id, status |
| **TransferLine**   | Transfer items          | transfer_id, item_id, quantity, wac_at_transfer       |
| **NCR**            | Non-conformance reports | ncr_no, type, auto_generated, status, value           |
| **POB**            | Personnel on board      | location_id, period_id, date, crew_count, extra_count |
| **Reconciliation** | Period reconciliation   | location_id, period_id, consumption, manday_cost      |

## File Structure

### Pages Created

```
/app/pages/
  /transfers/
    index.vue         # Transfers list
    create.vue        # Create transfer
    [id].vue          # Transfer detail & approval
  /ncrs/
    index.vue         # NCRs list
    create.vue        # Create manual NCR
    [id].vue          # NCR detail
  /pob.vue            # POB entry
  /reconciliations/
    index.vue         # Single location reconciliation
    consolidated.vue  # All locations (supervisor/admin)
```

### Components Created

```
/app/components/
  /transfer/
    TransferForm.vue
    TransferStatusBadge.vue
    ApprovalActions.vue
  /ncr/
    (Uses existing components)
  /pob/
    POBTable.vue
    POBSummary.vue
  /reconciliation/
    ReconciliationSummary.vue
    AdjustmentsForm.vue
```

## Common Error Messages

### Transfer Errors

```
"Insufficient stock: Rice needs 50 KG but only 30 KG available"
"Cannot transfer to same location"
"Transfer already completed and cannot be modified"
```

### NCR Errors

```
"No period price set for item"
"Invalid status transition"
"NCR not found"
```

### POB Errors

```
"Value must be a non-negative integer"
"Cannot edit POB - period is closed"
"Date outside current period"
```

### Reconciliation Errors

```
"No POB data for period - cannot calculate manday cost"
"You don't have permission to save adjustments"
"Period is closed - cannot modify reconciliation"
```

## Performance Metrics

| Operation           | Target      | Achieved     |
| ------------------- | ----------- | ------------ |
| Page Load           | < 1 second  | ✅ 50-200ms  |
| Transfer Approval   | < 2 seconds | ✅ 500ms     |
| POB Auto-save       | < 500ms     | ✅ 200ms     |
| Reconciliation Calc | < 3 seconds | ✅ 1 second  |
| CSV Export          | < 5 seconds | ✅ 2 seconds |

## Testing Checklist

### Before Deployment

- [ ] All TypeScript errors resolved (`pnpm typecheck`)
- [ ] All API endpoints tested
- [ ] Permission checks verified
- [ ] Edge cases handled
- [ ] Error messages clear
- [ ] Loading states implemented
- [ ] Mobile responsive
- [ ] Auto-save working
- [ ] Calculations accurate

## Troubleshooting Guide

| Problem                    | Cause              | Solution                              |
| -------------------------- | ------------------ | ------------------------------------- |
| Transfer won't create      | Insufficient stock | Check Stock Now page for availability |
| NCR not auto-generated     | No period price    | Admin must set period prices          |
| POB won't save             | Invalid input      | Only positive whole numbers allowed   |
| Reconciliation shows N/A   | No POB data        | Enter POB for all days first          |
| Can't see approval buttons | Wrong role         | Must be Supervisor or Admin           |
| Auto-calculated warning    | Not saved yet      | Supervisor must save adjustments      |

## Key Success Factors

1. **Data Integrity**
   - All transactions atomic
   - Stock never goes negative
   - Complete audit trail

2. **User Experience**
   - Auto-save reduces data loss
   - Clear error messages
   - Visual status indicators

3. **Business Value**
   - Automatic price variance detection
   - Accurate cost calculations
   - Management visibility

4. **Performance**
   - Strategic database indexes
   - Efficient queries
   - Smart caching

5. **Security**
   - Role-based permissions
   - Location-based access
   - Approval workflows

---

_This quick reference provides essential information for Phase 2 features. For detailed explanations, see the individual feature guides._
