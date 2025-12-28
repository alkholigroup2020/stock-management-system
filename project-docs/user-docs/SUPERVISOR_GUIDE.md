# Supervisor Quick Reference Guide

**Stock Management System**

---

## Table of Contents

1. [Your Role](#your-role)
2. [Operator Tasks](#operator-tasks)
3. [Transfer Management](#transfer-management)
4. [Reconciliations](#reconciliations)
5. [Manual NCR Creation](#manual-ncr-creation)
6. [Reports](#reports)
7. [Quick Reference Card](#quick-reference-card)

---

## Your Role

As a **Supervisor**, you have oversight responsibilities across all locations. Your key duties include:

- **Approve or reject transfer requests** between locations
- **Manage period-end reconciliations** for each location
- **Create manual NCRs** for quality issues or damages
- **View consolidated reports** across all locations
- **All Operator tasks** - You can also perform deliveries, issues, and POB entry

### What You Can Do That Operators Cannot

| Capability | Supervisor | Operator |
|------------|------------|----------|
| View all locations | Yes | Assigned only |
| Approve/Reject transfers | Yes | No |
| Edit reconciliations | Yes | No |
| View consolidated reports | Yes | No |
| Create manual NCRs | Yes | No |
| Mark location ready for close | Yes | No |

---

## Operator Tasks

As a Supervisor, you can perform all Operator tasks at any location:

- **Deliveries** - Create and post deliveries
- **Issues** - Create and post issues
- **Stock Viewing** - View stock at any location
- **POB Entry** - Enter crew counts
- **Profile Management** - Update your profile

> **See:** [Operator Guide](./OPERATOR_GUIDE.md) for detailed steps on these tasks.

---

## Transfer Management

Transfers move stock between locations. Operators can create transfer requests, but only Supervisors can approve them.

### Understanding Transfer Workflow

```
DRAFT → PENDING_APPROVAL → APPROVED → COMPLETED
                        ↘ REJECTED
```

| Status | Meaning |
|--------|---------|
| **DRAFT** | Transfer is being prepared, not yet submitted |
| **PENDING_APPROVAL** | Waiting for Supervisor review |
| **APPROVED** | Approved and stock has been moved |
| **REJECTED** | Denied, no stock movement |

### Viewing Pending Transfers

1. Click **Transfers** in the left menu
2. Use the **Status** filter to select "Pending Approval"
3. You'll see all transfers waiting for your review

Each transfer shows:
- **Transfer Number**
- **From Location** (source)
- **To Location** (destination)
- **Date**
- **Items** and quantities
- **Total Value** (SAR)

### Reviewing Transfer Details

1. Click on a pending transfer to open details
2. Review:
   - **Source location** - Does it have sufficient stock?
   - **Destination location** - Is this the correct recipient?
   - **Items and quantities** - Are the amounts reasonable?
   - **Transfer reason** - Is the purpose clear?
3. Decide to approve or reject

### Approving a Transfer

1. Open the pending transfer
2. Review all details carefully
3. Click **Approve**
4. Confirm in the dialog box

**What happens when you approve:**
- Stock is immediately deducted from the source location
- Stock is immediately added to the destination location
- Stock transfers at the source location's WAC (Weighted Average Cost)
- The transfer status changes to COMPLETED

### Rejecting a Transfer

1. Open the pending transfer
2. Review the details
3. Click **Reject**
4. Enter a **reason for rejection** (required)
5. Confirm in the dialog box

**What happens when you reject:**
- No stock movement occurs
- The requester is notified
- The transfer status changes to REJECTED
- Your rejection reason is saved

> **Note:** Rejected transfers cannot be resubmitted. The requester must create a new transfer request.

### Creating a Transfer

Supervisors can also create transfers directly:

1. Click **Transfers** in the left menu
2. Click **New Transfer**
3. Fill in:
   - **From Location** - Select source
   - **To Location** - Select destination
   - **Transfer Date**
4. Add items and quantities
5. Click **Submit for Approval** (another Supervisor must approve)

---

## Reconciliations

Reconciliations verify stock levels and calculate consumption at period end.

### Understanding Reconciliation

A reconciliation compares:

| Component | Description |
|-----------|-------------|
| **Opening Stock** | Value at period start |
| **+ Receipts** | Deliveries received during period |
| **+ Transfers In** | Stock transferred to this location |
| **- Transfers Out** | Stock transferred from this location |
| **- Issues** | Stock used during period |
| **= Expected Closing** | What stock should be |
| **vs Actual Closing** | Physical count |
| **= Variance** | Difference to explain |

### Viewing Location Reconciliation

1. Click **Reconciliations** in the left menu
2. Select the **Location** from the dropdown
3. Select the **Period** if not current
4. View the reconciliation summary

The page shows:
- Opening and closing values
- All movements (receipts, issues, transfers)
- Automatic calculations
- Variance analysis

### Entering Adjustments

Adjustments account for items that don't fit standard transactions:

1. Open the reconciliation for a location
2. Scroll to the **Adjustments** section
3. Enter values for:
   - **Back Charges** - Credits owed to this location
   - **Credits** - Discounts applied
   - **Condemnations** - Damaged or expired items written off
   - **Other Adjustments** - Miscellaneous corrections
4. Click **Save Adjustments**

> **Important:** Enter adjustments as positive numbers. The system handles the accounting direction.

### Marking Location Ready for Period Close

Once reconciliation is complete:

1. Verify all transactions are posted
2. Verify adjustments are entered
3. Verify the variance is acceptable
4. Click **Mark Ready**

The location status changes to **READY**, indicating it's prepared for period close.

> **Note:** Only an Admin can execute the final period close after all locations are ready.

### Viewing Consolidated Reconciliation

To see all locations together:

1. Click **Reconciliations** in the left menu
2. Click **View Consolidated** (or navigate to Consolidated view)
3. View the summary across all locations

The consolidated view shows:
- Each location's reconciliation status
- Combined opening and closing values
- Total consumption across all locations
- Per-location breakdown

---

## Manual NCR Creation

NCRs (Non-Conformance Reports) track quality issues and corrections.

### When to Create a Manual NCR

Create a manual NCR for:
- **Damaged goods** - Items damaged during delivery
- **Short shipments** - Supplier delivered less than invoiced
- **Quality issues** - Items don't meet specifications
- **Expired products** - Items received past expiry
- **Other discrepancies** - Any supplier-related issues

> **Note:** Price variance NCRs are created automatically when posting deliveries. You don't need to create these manually.

### Creating a Manual NCR

1. Click **NCR** in the left menu
2. Click **New NCR**
3. Select **Type**: MANUAL
4. Select the **Location** where the issue occurred
5. (Optional) Link to a **Delivery** if related
6. Enter the **Reason** - describe the issue clearly
7. Add items:
   - **Item** - Select the affected item
   - **Quantity** - How many affected
   - **Unit Value** - Cost per unit
8. Click **Create NCR**

### Linking NCR to a Delivery

When you link an NCR to a delivery:
- The item list filters to show only items from that delivery
- Unit values auto-fill from the delivery
- The NCR references the delivery for tracking

### NCR Status Workflow

| Status | Meaning | Next Steps |
|--------|---------|------------|
| **OPEN** | Just created | Send to supplier |
| **SENT** | Sent to supplier | Wait for response |
| **CREDITED** | Supplier provided credit | Close the loop |
| **REJECTED** | Supplier denied claim | Escalate or close |
| **RESOLVED** | Issue resolved | Complete |

---

## Reports

Access various reports to analyze operations.

### Accessing Reports

1. Click **Reports** in the left menu
2. Select the report type from the cards

### Stock Now Report

Shows current inventory levels across locations.

1. Click **Reports** > **Stock Now**
2. Set filters:
   - **Location** - Specific location or all
   - **Category** - Filter by item category
   - **Low Stock Only** - Show items below minimum
3. View the report
4. Click **Export CSV** to download

**Report includes:**
- Item code and name
- Quantity on hand
- Unit value (WAC)
- Total value
- Location
- Low stock indicators

### Deliveries Report

Shows delivery history with supplier analysis.

1. Click **Reports** > **Deliveries**
2. Set filters:
   - **Date Range** - Start and end dates
   - **Supplier** - Specific supplier or all
   - **Location** - Specific location or all
3. View the report
4. Export to CSV if needed

**Report includes:**
- Delivery numbers and dates
- Supplier information
- Items received with quantities
- Unit and period prices
- Price variance indicators
- Related NCRs

### Issues Report

Shows stock consumption by cost centre.

1. Click **Reports** > **Issues**
2. Set filters:
   - **Date Range**
   - **Location**
   - **Cost Centre**
3. View the report

**Report includes:**
- Issue dates and numbers
- Cost centre breakdown
- Items consumed with quantities
- Value at WAC
- Consumption analysis

### Reconciliation Report

Shows period-end reconciliation details.

1. Click **Reports** > **Reconciliation**
2. Select **Period**
3. Select **Location** or view all
4. View the report

**Report includes:**
- Opening and closing values
- Movement summary
- Adjustments
- Variance analysis
- Consumption per manday

### Exporting Reports

All reports support CSV export:

1. Generate the report with desired filters
2. Click **Export CSV** button
3. The file downloads to your computer
4. Open in Excel or other spreadsheet software

---

## Quick Reference Card

### Navigation

| Task | Path |
|------|------|
| Review transfers | Transfers > Filter by "Pending Approval" |
| Approve transfer | Transfers > Click transfer > Approve |
| View reconciliation | Reconciliations > Select location |
| Consolidated view | Reconciliations > View Consolidated |
| Create manual NCR | NCR > New NCR |
| Access reports | Reports > Select report type |

### Approval Checklist

Before approving a transfer, verify:
- [ ] Source location has sufficient stock
- [ ] Destination location is correct
- [ ] Item quantities are reasonable
- [ ] Transfer reason is clear
- [ ] Period is OPEN

### Reconciliation Checklist

Before marking location ready:
- [ ] All deliveries posted
- [ ] All issues posted
- [ ] All transfers completed
- [ ] Adjustments entered
- [ ] Variance reviewed and acceptable

### Key Rules

1. **All locations access** - You can view and manage all locations
2. **Transfers need approval** - Never auto-approve your own requests
3. **Reconciliation before close** - Must be complete before period close
4. **NCRs need reason** - Always document the issue clearly
5. **Export for analysis** - Use CSV exports for detailed analysis

### Getting Help

If you encounter problems:
1. Check the period is OPEN
2. Verify your internet connection
3. For system issues, contact Admin
4. For approval questions, consult with other Supervisors

---

*Document Version: 1.0 | Last Updated: December 2025*
