# Stock Management System - Training Presentation

**Version:** 1.0
**Last Updated:** November 2025

---

## Table of Contents

1. [System Overview (15 minutes)](#system-overview-15-minutes)
2. [Operator Training (30 minutes)](#operator-training-30-minutes)
3. [Supervisor Training (45 minutes)](#supervisor-training-45-minutes)
4. [Admin Training (60 minutes)](#admin-training-60-minutes)

---

# System Overview (15 minutes)

## Welcome to the Stock Management System

### What is This System?

The Stock Management System is a modern web application designed to replace Excel-based inventory workflows with real-time stock tracking across multiple locations.

**Key Benefits:**

- ✅ Real-time stock visibility across all locations
- ✅ Automatic calculations (no manual spreadsheets)
- ✅ Built-in approval workflows
- ✅ Accurate costing with Weighted Average Cost (WAC)
- ✅ Monthly period controls for accounting accuracy
- ✅ Works on any device (desktop, tablet, mobile)
- ✅ Installable as an app (PWA)

### Our Locations

The system manages inventory across **four distinct locations**:

| Location      | Purpose                             | Typical Users                |
| ------------- | ----------------------------------- | ---------------------------- |
| **Kitchen**   | Food preparation, daily consumption | Kitchen Operators, Chef      |
| **Store**     | Dry goods storage, supplies         | Store Operators, Supervisor  |
| **Central**   | Central warehouse, bulk storage     | Warehouse Operators, Manager |
| **Warehouse** | Main distribution center            | Warehouse Staff, Supervisor  |

**Important:** Each location has its own stock levels and operates independently. Stock moves between locations via **Transfers**.

### Key Business Concepts

#### 1. Weighted Average Cost (WAC)

**What is WAC?**
WAC is the average cost of inventory items, recalculated each time we receive new stock.

**Why WAC?**

- Provides accurate inventory valuation
- Smooths out price fluctuations
- Required for financial reporting

**Example:**

```
Current stock: 10 kg @ SAR 5.00/kg = SAR 50.00
New delivery: 20 kg @ SAR 6.00/kg = SAR 120.00
---
New WAC = (50 + 120) / (10 + 20) = SAR 5.67/kg
```

**Key Rule:** WAC is updated on **Deliveries only**, not on Issues.

#### 2. Monthly Periods

**What is a Period?**
A period is a monthly accounting cycle that locks prices and controls when transactions can be posted.

**Period Lifecycle:**

```
OPEN → READY_TO_CLOSE → CLOSED
  ↓         ↓              ↓
Post    Lock prices    No changes
transactions              allowed
```

**Important Rules:**

- Transactions can only be posted in **OPEN** periods
- Prices are locked when period is marked **READY_TO_CLOSE**
- Once **CLOSED**, no changes are allowed

#### 3. Price Variance & NCRs

**What is a Price Variance?**
When a delivery price differs from the locked period price, the system automatically creates a **Non-Conformance Report (NCR)**.

**Example:**

```
Locked price for Rice: SAR 10.00/kg
Delivery price: SAR 12.00/kg
→ System creates NCR with variance: +SAR 2.00/kg
```

**Why?**
To ensure all price changes are documented and reviewed before accepting new costs.

### System Navigation

#### Main Menu Structure

**Dashboard** - Overview of stock levels and recent activity

**Transactions:**

- Deliveries - Record goods received
- Issues - Record goods consumed/used
- Transfers - Move stock between locations

**Management:**

- Items - Product master list
- NCRs - Non-conformance reports
- Reconciliations - Month-end stock counts

**Admin:**

- Periods - Period management and close
- Locations - Location settings (Admin only)

### User Roles & Permissions

| Role           | What You Can Do                                                                               |
| -------------- | --------------------------------------------------------------------------------------------- |
| **Operator**   | Post deliveries and issues, view stock (assigned locations only)                              |
| **Supervisor** | Everything Operators can do, plus: approve transfers, manage reconciliations (all locations)  |
| **Admin**      | Everything Supervisors can do, plus: manage items/prices, close periods, system configuration |

### Accessing the System

**Desktop:**

1. Open your web browser (Chrome, Edge, Safari)
2. Navigate to: `https://[your-domain].vercel.app`
3. Login with your credentials

**Mobile:**

1. Visit the URL on your mobile browser
2. Tap the browser menu → "Add to Home Screen"
3. System will install as an app icon
4. Launch like any other app

**Offline Mode:**

- The system will warn you if you go offline
- You can still view data, but cannot submit transactions
- All changes sync when you reconnect

---

# Operator Training (30 minutes)

## Your Role as an Operator

As an Operator, you are responsible for:

- Recording daily deliveries (goods received)
- Recording daily issues (goods consumed/used)
- Viewing current stock levels
- Ensuring accurate data entry

**What you CANNOT do:**

- Approve transfers
- Edit items or prices
- Close periods
- Access locations you're not assigned to

---

## Module 1: Recording Deliveries (10 minutes)

### What is a Delivery?

A **Delivery** is when goods are received from a supplier. This increases your location's stock and updates the WAC.

### Step-by-Step: Create a Delivery

**1. Navigate to Deliveries**

- Click **"Deliveries"** in the main menu
- Click **"New Delivery"** button (top-right)

**2. Fill in Header Information**

```
Location: [Your assigned location - auto-selected]
Supplier: [Select from dropdown]
PO/Invoice Number: [Reference number from paperwork]
Delivery Date: [Date goods received]
Notes: [Optional - any special information]
```

**3. Add Delivery Lines**

Click **"Add Item"** for each product received:

```
Item: [Select from dropdown]
Quantity: [Amount received]
Unit Price: [Price per unit from invoice]
```

**Example:**

```
Rice, Basmati 5kg - Qty: 10, Price: SAR 25.00
Oil, Vegetable 1L - Qty: 20, Price: SAR 8.50
```

**4. Review Total**

- System calculates total automatically
- Verify against your invoice

**5. Submit**

- Click **"Submit Delivery"**
- System will:
  - Add stock to your location
  - Recalculate WAC
  - Create NCR if price variance detected

### Price Variance Alerts

**What happens if the price is different?**

If the delivery price differs from the locked period price:

1. System shows a **yellow warning banner**
2. Delivery is still recorded
3. **NCR is automatically created**
4. Supervisor will review the NCR

**Your action:** Make sure the price you entered matches the invoice. The variance will be handled by management.

### Common Mistakes to Avoid

❌ **Wrong quantity unit** - Check if item is in KG, EA, LTR, etc.
❌ **Decimal errors** - Enter 2.5 not 2,5 for decimals
❌ **Wrong date** - Use actual delivery date, not invoice date
❌ **Missing PO number** - Always include reference number

---

## Module 2: Recording Issues (10 minutes)

### What is an Issue?

An **Issue** is when goods are consumed, used, or removed from stock. This decreases your location's stock.

### Step-by-Step: Create an Issue

**1. Navigate to Issues**

- Click **"Issues"** in the main menu
- Click **"New Issue"** button (top-right)

**2. Fill in Header Information**

```
Location: [Your assigned location - auto-selected]
Issue Type: [Select: CONSUMPTION, TRANSFER_OUT, WASTE, SALE]
Reference Number: [Your internal reference]
Issue Date: [Date goods were used]
Notes: [Optional - purpose or reason]
```

**3. Add Issue Lines**

Click **"Add Item"** for each product issued:

```
Item: [Select from dropdown]
Quantity: [Amount to issue]
```

**CRITICAL:** System will show current stock level. You **cannot** issue more than what's available.

**Example:**

```
Current Stock: 15.5 kg
You can issue: Up to 15.5 kg
If you try 20 kg: ❌ Error - Insufficient stock
```

**4. Review and Submit**

- Verify quantities
- Click **"Submit Issue"**
- Stock is immediately reduced

### Issue Types Explained

| Type             | When to Use                         | Example                       |
| ---------------- | ----------------------------------- | ----------------------------- |
| **CONSUMPTION**  | Items used in production/cooking    | Rice used in meal preparation |
| **TRANSFER_OUT** | Moving to another location (formal) | Sending flour to Kitchen      |
| **WASTE**        | Spoiled or damaged goods            | Expired vegetables            |
| **SALE**         | Items sold to customers             | Retail sales                  |

**Note:** For informal transfers between locations, use the **Transfers** module instead of TRANSFER_OUT issues.

### Stock Validation

**Real-time Stock Check:**

- System always shows current stock
- You cannot issue more than available
- If stock is insufficient → Contact supervisor

**What if stock shows wrong amount?**

1. Don't guess or force the issue
2. Check recent deliveries/issues
3. Report to supervisor for reconciliation

---

## Module 3: Viewing Stock & Dashboard (10 minutes)

### Dashboard Overview

Your dashboard shows:

- **Stock by Location** - Current levels at your location(s)
- **Recent Activity** - Last 10 transactions
- **Alerts** - Low stock warnings, NCRs, pending approvals

### Reading the Dashboard

**Stock Cards:**

```
Rice, Basmati 5kg
Current: 45.5 kg
WAC: SAR 5.67/kg
Value: SAR 258.00
Status: ● Healthy (green) / ⚠ Low (yellow) / ❌ Critical (red)
```

**Status Indicators:**

- **Green (Healthy):** Stock above reorder level
- **Yellow (Low):** Below reorder point
- **Red (Critical):** Near stockout

**Recent Activity:**

- Shows last 10 deliveries/issues
- Click any item to view details

### Searching & Filtering

**Stock List:**

1. Click **"Items"** menu
2. Use search box to find items
3. Filter by category, status, location
4. View item details and history

**Transaction History:**

1. Click **"Deliveries"** or **"Issues"**
2. Filter by date range
3. Filter by item, supplier, or status
4. Export to Excel (if needed)

### Mobile App Usage

**Installing on Mobile:**

1. Visit site on mobile browser
2. Tap browser menu
3. Select "Add to Home Screen"
4. App icon appears on home screen

**Mobile Features:**

- Same functionality as desktop
- Optimized for smaller screens
- Offline detection
- Touch-friendly buttons

**Tips for Mobile:**

- Use landscape mode for tables
- Swipe to see more columns
- Tap to expand details

---

## Operator Best Practices

### Daily Routine

**Morning:**

1. Check dashboard for alerts
2. Review pending deliveries
3. Verify stock levels for the day

**During the Day:**

- Record deliveries as they arrive
- Record issues as they occur
- Don't batch at end of day (real-time entry)

**End of Day:**

- Verify all transactions recorded
- Check for any errors or missing entries
- Review tomorrow's schedule

### Data Entry Tips

✅ **DO:**

- Enter transactions immediately
- Double-check quantities and prices
- Use correct units (KG, EA, LTR)
- Include notes for unusual items
- Verify totals against invoices

❌ **DON'T:**

- Batch entries at end of week
- Guess quantities or prices
- Override system warnings without checking
- Enter negative quantities
- Skip reference numbers

### Getting Help

**Common Issues:**

| Problem                   | Solution                                      |
| ------------------------- | --------------------------------------------- |
| Can't find an item        | Search by name or code; check spelling        |
| Price seems wrong         | Verify invoice; proceed (NCR will be created) |
| Insufficient stock        | Check recent issues; contact supervisor       |
| System says period closed | Contact admin to open new period              |
| Offline warning           | Check internet; wait to reconnect             |

**Who to Contact:**

- **Technical issues:** IT Support
- **Stock discrepancies:** Your supervisor
- **Missing items:** Admin or supervisor
- **Permission issues:** Admin

---

# Supervisor Training (45 minutes)

## Your Role as a Supervisor

As a Supervisor, you have all Operator permissions, plus:

- **Approve transfers** between locations
- **Manage reconciliations** at month-end
- **View all locations** (not just assigned)
- **Resolve NCRs** and price variances
- **Monitor team performance**

**What you CANNOT do:**

- Edit items or prices (Admin only)
- Close periods (Admin only)
- Change system settings

---

## Module 1: Transfer Management (15 minutes)

### What is a Transfer?

A **Transfer** moves stock from one location to another. Transfers require your approval before stock actually moves.

### Transfer Lifecycle

```
DRAFT → PENDING_APPROVAL → APPROVED → COMPLETED
  ↓           ↓                ↓          ↓
Created   Waiting for    Ready to    Stock
by user   supervisor     execute     moved
```

### Reviewing Transfer Requests

**1. Navigate to Transfers**

- Click **"Transfers"** in main menu
- Filter: **"Pending Approval"**

**2. Review Transfer Details**

```
Transfer #: TR-2024-11-001
From: Central → To: Kitchen
Requested by: John Smith
Date: 24/11/2024

Items:
- Rice, Basmati 5kg - Qty: 10 bags
- Oil, Vegetable 1L - Qty: 5 bottles
```

**3. Validation Checklist**

Before approving, verify:

✅ **Stock availability** - Does source location have enough?
✅ **Business justification** - Is transfer reasonable?
✅ **Quantities** - Are amounts correct?
✅ **Timing** - Is period still open?
✅ **Destination** - Is target location correct?

**4. Approve or Reject**

**To Approve:**

- Click **"Approve Transfer"**
- System immediately moves stock
- WAC recalculated at destination

**To Reject:**

- Click **"Reject"** (if available)
- Add comment explaining why
- Requester is notified

### Stock Movement & WAC Impact

**What happens when you approve a transfer?**

**At Source Location (Central):**

```
Before: 100 kg @ SAR 5.00/kg
Transfer out: 10 kg @ SAR 5.00/kg
After: 90 kg @ SAR 5.00/kg (WAC unchanged)
```

**At Destination Location (Kitchen):**

```
Before: 20 kg @ SAR 6.00/kg = SAR 120.00
Received: 10 kg @ SAR 5.00/kg = SAR 50.00
After: 30 kg @ SAR 5.67/kg = SAR 170.00 (WAC recalculated)
```

**Key Point:** WAC is recalculated at the destination, just like a delivery.

### Creating Transfers (Supervisor-Initiated)

**When you need to move stock:**

**1. Create New Transfer**

- Navigate to **"Transfers"**
- Click **"New Transfer"**

**2. Fill Transfer Form**

```
From Location: [Source]
To Location: [Destination]
Reference Number: [Your tracking number]
Transfer Date: [Date of move]
Reason: [Why stock is moving]
```

**3. Add Items**

```
Item: [Select]
Quantity: [Amount to transfer]
```

**4. Submit**

- Click **"Submit Transfer"**
- Status: **PENDING_APPROVAL**
- Another supervisor must approve

**Important:** You cannot approve your own transfers. Another supervisor must review.

---

## Module 2: NCR Management (10 minutes)

### What are NCRs?

**Non-Conformance Reports (NCRs)** document issues requiring attention:

- Price variances
- Quality issues
- Damaged goods
- Policy violations

### Types of NCRs

**1. Auto-Generated (Price Variance)**

```
System creates when:
- Delivery price ≠ Period price
- Automatic - no manual creation
- Requires review and disposition
```

**2. Manual (Quality/Operational)**

```
Created by staff for:
- Damaged goods
- Quality issues
- Process violations
```

### Reviewing NCRs

**1. Navigate to NCRs**

- Click **"NCRs"** menu
- Filter: **"Pending Review"**

**2. Review NCR Details**

**Example: Price Variance NCR**

```
NCR #: NCR-2024-11-015
Type: PRICE_VARIANCE (Auto-generated)
Item: Rice, Basmati 5kg
Location: Central

Expected price: SAR 25.00/kg
Actual price: SAR 27.00/kg
Variance: +SAR 2.00/kg (+8%)

Delivery: DL-2024-11-120
Quantity: 50 kg
Total variance: SAR 100.00
```

**3. Investigation**

**Questions to ask:**

- Is the new price from supplier invoice?
- Was there a price increase communicated?
- Is this a temporary or permanent change?
- Should we accept this price going forward?

**4. Disposition**

Choose appropriate action:

| Disposition     | When to Use                          | Next Steps                       |
| --------------- | ------------------------------------ | -------------------------------- |
| **ACCEPT**      | Price increase is valid              | Update master price list (Admin) |
| **REJECT**      | Price error, negotiate with supplier | Return goods or get credit       |
| **INVESTIGATE** | Need more information                | Contact supplier, gather data    |

**5. Complete NCR**

- Select disposition
- Add detailed comments
- Click **"Update NCR"**

### NCR Best Practices

✅ **DO:**

- Review NCRs within 24 hours
- Document your investigation
- Provide clear disposition reasoning
- Communicate with Admin for price updates

❌ **DON'T:**

- Auto-accept all variances
- Skip investigation
- Leave NCRs pending indefinitely

---

## Module 3: Month-End Reconciliations (15 minutes)

### What is Reconciliation?

**Reconciliation** is the process of comparing system stock (book stock) with physical stock (actual count) at month-end.

### Why Reconcile?

- Ensures stock accuracy
- Identifies discrepancies
- Required before period close
- Supports financial reporting

### Reconciliation Workflow

**1. Navigate to Reconciliations**

- Click **"Reconciliations"** menu
- Click **"New Reconciliation"**

**2. Start Reconciliation**

```
Location: [Select location to count]
Period: [Current period - auto-selected]
Count Date: [Date of physical count]
```

**3. System Pre-Fills Book Stock**

The system loads all items with current stock:

```
Item               | Book Stock | Counted | Variance
-------------------|------------|---------|----------
Rice, Basmati 5kg | 45.50 kg   | _____   | _____
Oil, Vegetable 1L | 20.00 LTR  | _____   | _____
```

**4. Physical Count**

**Conduct physical inventory:**

- Count all items in location
- Use tally sheets or mobile device
- Double-check counts
- Note any damaged/expired items

**5. Enter Counted Quantities**

For each item:

```
Book Stock: 45.50 kg
Counted: 44.00 kg
Variance: -1.50 kg (shortage)
```

**6. System Calculates Variance**

**Variance Types:**

- **Positive variance:** Counted > Book (surplus)
- **Negative variance:** Counted < Book (shortage)
- **Zero variance:** Perfect match (ideal)

**7. Add Variance Notes**

For each variance, document the reason:

```
Variance: -1.50 kg
Reason: "Spillage during transfer to kitchen containers"
```

**8. Review & Submit**

- Check all variances
- Verify notes are clear
- Click **"Submit Reconciliation"**

### Acceptable Variance Thresholds

**General Guidelines:**

| Item Type               | Acceptable Variance |
| ----------------------- | ------------------- |
| Dry goods (rice, flour) | ±2%                 |
| Liquids (oil, milk)     | ±3%                 |
| High-value items        | ±1%                 |
| Perishables             | ±5%                 |

**Example:**

```
Rice: 100 kg book stock
Acceptable range: 98-102 kg (±2%)
Counted: 97 kg → Variance: -3% (INVESTIGATE)
```

### Investigating Large Variances

**When variance exceeds threshold:**

**1. Recount the Item**

- Physical count errors are common
- Double-check measurement units

**2. Review Recent Transactions**

- Check deliveries in last 7 days
- Check issues in last 7 days
- Look for data entry errors

**3. Check for Unreported Issues**

- Waste not recorded
- Spillage not documented
- Samples given out

**4. Document Findings**

- Update variance notes
- Create NCR if needed
- Recommend corrective action

### Post-Reconciliation Actions

**After reconciliation is submitted:**

**1. System Updates Book Stock**

- Book stock adjusted to match counted stock
- Variance recorded for audit trail

**2. Financial Impact**

- Positive variance → Asset increase
- Negative variance → Asset decrease (write-off)

**3. Reporting**

- Variances included in month-end reports
- Admin reviews for patterns
- Used for inventory accuracy KPIs

### Reconciliation Best Practices

✅ **DO:**

- Schedule counts during low activity times
- Use two people for high-value items
- Count systematically (shelf by shelf)
- Document everything
- Investigate variances immediately

❌ **DON'T:**

- Rush the count
- Adjust book stock without counting
- Ignore small variances (they add up)
- Skip variance notes
- Wait until period close deadline

---

## Module 4: Supervisor Reporting & Oversight (5 minutes)

### Key Reports for Supervisors

**1. Stock Levels by Location**

- Current stock across all locations
- WAC values
- Low stock alerts

**2. Transaction History**

- All deliveries, issues, transfers
- Filter by date, location, user
- Identify data entry errors

**3. Pending Approvals**

- Transfers awaiting approval
- NCRs pending disposition
- Reconciliations pending review

**4. Variance Reports**

- Price variances
- Reconciliation variances
- Trend analysis

### Monitoring Team Performance

**Operator Activity:**

- Number of transactions per user
- Error rates (corrections needed)
- Timeliness of data entry

**Quality Metrics:**

- Reconciliation accuracy
- NCR resolution time
- Transfer approval time

### Supervisor Daily Checklist

**Morning:**

- ☐ Review pending approvals
- ☐ Check NCRs for review
- ☐ Verify stock alerts

**During Day:**

- ☐ Approve/reject transfers promptly
- ☐ Monitor operator transactions
- ☐ Respond to stock queries

**End of Day:**

- ☐ Clear pending approvals
- ☐ Review day's variances
- ☐ Plan next day reconciliations

**End of Month:**

- ☐ Complete all reconciliations
- ☐ Resolve all NCRs
- ☐ Prepare for period close

---

# Admin Training (60 minutes)

## Your Role as an Admin

As an Admin, you have full system access:

- Everything Supervisors can do
- **Manage Items & Prices** - Master data control
- **Manage Periods** - Open/close accounting periods
- **Configure Locations** - Location settings
- **User Management** - Create users, assign permissions
- **System Configuration** - Settings and policies

**Critical Responsibility:** Admins control the financial integrity of the system. All actions are audited.

---

## Module 1: Item Master Management (15 minutes)

### Item Master Overview

The **Item Master** is the central database of all products tracked in the system.

**Each item includes:**

- Item code (unique identifier)
- Name and description
- Category (e.g., Grains, Oils, Dairy)
- Unit of measure (KG, LTR, EA)
- Reorder levels (min/max stock)
- Default supplier
- Current prices by location

### Creating New Items

**1. Navigate to Items**

- Click **"Items"** menu
- Click **"New Item"** button

**2. Fill Item Details**

**Basic Information:**

```
Item Code: [Unique code, e.g., RICE-001]
Name: [Display name, e.g., "Rice, Basmati 5kg"]
Description: [Details, e.g., "Premium Basmati rice, 5kg bag"]
Category: [Select: GRAINS, OILS, DAIRY, etc.]
Unit: [Select: KG, LTR, EA, BOX, etc.]
```

**Stock Control:**

```
Reorder Point: [Min stock before alert, e.g., 20]
Maximum Stock: [Max stock level, e.g., 100]
```

**Supplier Information:**

```
Default Supplier: [Select primary supplier]
Supplier Item Code: [Supplier's SKU, if any]
```

**3. Set Initial Prices**

**Price by Location:**

```
Kitchen: SAR 25.00
Store: SAR 25.00
Central: SAR 24.00 (bulk discount)
Warehouse: SAR 24.00
```

**Important:** These prices become the **period prices** for current period.

**4. Activate Item**

- Toggle **"Is Active"** to enabled
- Click **"Save Item"**

### Editing Items

**When to Edit Items:**

- Correct spelling errors
- Update descriptions
- Change reorder levels
- Update supplier information
- **NOT for price changes** (see Price Management)

**To Edit:**

1. Find item in list
2. Click item name to open
3. Click **"Edit"** button
4. Make changes
5. Click **"Save Changes"**

### Price Management

**Critical Rule:** Prices can only be changed when period is **READY_TO_CLOSE** or **CLOSED**.

**Why?** To prevent unauthorized price changes mid-period.

**Price Change Workflow:**

**1. Wait for Period Lock**

- Current period must be READY_TO_CLOSE
- All locations confirmed ready

**2. Navigate to Item**

- Click **"Items"** menu
- Find item to update
- Click to open details

**3. Edit Prices**

```
Current price: SAR 25.00
New price: SAR 27.00
Effective date: [Next period start date]
```

**4. Save Changes**

- System validates period status
- Prices locked for current period
- New prices apply to next period

**Price History:**

- System tracks all price changes
- Audit trail shows who/when/why
- Historical reports use correct prices

### Deactivating Items

**When to Deactivate:**

- Item discontinued by supplier
- No longer stocking item
- Seasonal item out of season

**How to Deactivate:**

1. Open item details
2. Toggle **"Is Active"** to disabled
3. Save changes

**Effect:**

- Item hidden from new transactions
- Existing stock still visible
- Historical data preserved

**Important:** Never delete items. Always deactivate. Deletion breaks historical data.

---

## Module 2: Period Management (20 minutes)

### Understanding Periods

**Periods** are monthly accounting cycles that control:

- When transactions can be posted
- When prices are locked
- Month-end closing procedures

### Period Lifecycle

```
OPEN → READY_TO_CLOSE → CLOSED
  ↓           ↓             ↓
Active    Prices       Archive
period    locked       period
```

### Opening a New Period

**When to Open:**

- First day of each month
- Previous period is closed
- New fiscal period starts

**Steps:**

**1. Navigate to Periods**

- Click **"Periods"** menu
- Click **"New Period"** button

**2. Define Period**

```
Period Name: November 2024
Start Date: 01/11/2024
End Date: 30/11/2024
Fiscal Year: 2024
Status: OPEN (auto-set)
```

**3. Lock Prices**

System automatically:

- Copies current item prices
- Creates **period price snapshot**
- Locks prices for this period

**Example:**

```
Item: Rice, Basmati 5kg
Current price: SAR 25.00
→ Period price locked at SAR 25.00
→ Any delivery at different price creates NCR
```

**4. Activate Period**

- Click **"Create Period"**
- System sets as current period
- Users can now post transactions

### Period Close Workflow

**Month-End Process (Critical):**

Period close is a **multi-step coordinated process** across all locations.

**Phase 1: Preparation (Days 1-25)**

- Normal operations
- Users post deliveries, issues, transfers
- Period status: **OPEN**

**Phase 2: Lock Transactions (Day 26-28)**

**1. Communicate Cutoff**

- Notify all users of cutoff date/time
- Ensure all transactions are posted
- Verify all transfers approved

**2. Location Readiness**

Each location Supervisor must:

- Complete physical reconciliation
- Resolve all variances
- Submit reconciliation
- Mark location as **"Ready to Close"**

**To Mark Ready:**

1. Navigate to **"Period Close"** page
2. Find your location
3. Click **"Mark as Ready"**

**System validates:**

- ✅ Reconciliation completed
- ✅ All variances documented
- ✅ No pending transfers involving this location

**3. Monitor Readiness**

As Admin, monitor **"Period Close"** dashboard:

```
Location  | Status         | Reconciled | Actions
----------|----------------|------------|----------
Kitchen   | ✅ Ready       | Yes        | -
Store     | ✅ Ready       | Yes        | -
Central   | ⏳ In Progress | No         | Follow up
Warehouse | ✅ Ready       | Yes        | -
```

**Phase 3: Admin Period Close (Day 29-30)**

**1. Verify All Locations Ready**

```
✅ Kitchen - Ready
✅ Store - Ready
✅ Central - Ready
✅ Warehouse - Ready
```

**2. Review NCRs**

- All price variance NCRs resolved
- Dispositions recorded
- Item prices updated if needed

**3. Execute Period Close**

**Navigate to Period Close:**

- Click **"Periods"** menu
- Click **"Close Period"** button

**System performs:**

- Validates all locations ready
- Validates all NCRs closed
- Creates stock snapshots (all locations)
- Archives period data
- Changes status to **CLOSED**

**4. Verification**

**Check snapshots:**

```
Location: Kitchen
Period: November 2024
Snapshot Date: 30/11/2024

Item               | Qty     | WAC      | Value
-------------------|---------|----------|------------
Rice, Basmati 5kg | 45.50   | SAR 5.67 | SAR 258.04
Oil, Vegetable 1L | 20.00   | SAR 8.50 | SAR 170.00
...
Total Value: SAR 45,250.00
```

**5. Open Next Period**

- Immediately create next month's period
- Follow "Opening a New Period" steps
- Operations resume

### Period Close Troubleshooting

**Problem: Location won't mark as ready**

**Possible causes:**

- Reconciliation not submitted
- Variances exceed thresholds
- Pending transfers involving location

**Solution:**

1. Check reconciliation status
2. Review variances with supervisor
3. Approve/reject pending transfers
4. Re-attempt marking ready

**Problem: Period close fails**

**Possible causes:**

- Not all locations ready
- Open NCRs exist
- Pending transactions

**Solution:**

1. Review period close checklist
2. Verify all NCRs dispositioned
3. Clear pending approvals
4. Re-attempt close

### Period Reporting

**After period close, generate reports:**

**1. Period Summary Report**

- Total deliveries value
- Total issues value
- Net stock movement
- Ending stock value

**2. Variance Analysis**

- Price variances by item
- Reconciliation variances by location
- Year-over-year comparison

**3. Financial Reports**

- Cost of goods received
- Cost of goods issued
- Inventory valuation (ending)

---

## Module 3: Location Management (10 minutes)

### Location Configuration

**Each location has:**

- Location code (unique)
- Name and description
- Address
- Is active status
- Assigned users

### Creating a New Location

**Rare but necessary when:**

- Opening new facility
- Restructuring operations
- Pilot expansion

**Steps:**

**1. Navigate to Locations (Admin Only)**

- Click **"Admin"** menu
- Click **"Locations"**

**2. Create Location**

```
Location Code: [Unique, e.g., BRANCH-01]
Name: [Display name, e.g., "Branch Store #1"]
Description: [Details]
Address: [Physical address]
Is Active: ☑ Enabled
```

**3. Assign Users**

```
Operators:
- John Smith (Operator)
- Jane Doe (Operator)

Supervisors:
- Bob Manager (Supervisor)
```

**4. Initialize Stock**

**For new locations:**

- Import opening stock (if available)
- Or start with zero stock
- Record initial deliveries

### Modifying Location Assignments

**To change user assignments:**

**1. Edit Location**

- Open location details
- Click **"Manage Users"**

**2. Add/Remove Users**

- Select users from dropdown
- Assign role (Operator, Supervisor)
- Save changes

**Effect:**

- Users immediately see location in their filters
- Access controlled by middleware

---

## Module 4: User Management (10 minutes)

### User Lifecycle

**Create → Activate → Assign → Deactivate**

### Creating Users

**1. Gather User Information**

```
Full Name: John Smith
Email: john.smith@company.com
Role: OPERATOR, SUPERVISOR, or ADMIN
Locations: [Kitchen, Store] (Operators/Supervisors only)
```

**2. Create User Account**

**Via Admin Panel:**

- Navigate to **"Users"** (if available)
- Click **"New User"**
- Fill user details
- Assign role and locations
- Generate password

**Via Database (if no UI):**

- Work with IT to create user
- Use secure password policy
- Send credentials via secure channel

**3. First Login**

- User receives welcome email
- Logs in with temp password
- Required to change password
- System enforces password policy

### User Roles & Permissions

**OPERATOR:**

```
Can:
- Post deliveries and issues
- View stock at assigned locations
- Create transfers (approval needed)

Cannot:
- Approve transfers
- Manage reconciliations
- Edit items or prices
- Close periods
```

**SUPERVISOR:**

```
Can:
- Everything Operators can
- Approve transfers
- Manage reconciliations (all locations)
- Resolve NCRs
- View all locations

Cannot:
- Edit items or prices
- Close periods
- Manage users
```

**ADMIN:**

```
Can:
- Everything (full access)
- Manage items and prices
- Close periods
- Create/edit locations
- Manage users
- View audit logs
- System configuration
```

### Deactivating Users

**When user leaves or role changes:**

**1. Deactivate Account**

- Edit user profile
- Toggle **"Is Active"** to disabled
- Save changes

**Effect:**

- User cannot log in
- Historical data preserved
- Audit trail intact

**Important:** Never delete users. Always deactivate.

---

## Module 5: System Monitoring & Maintenance (5 minutes)

### Daily Admin Tasks

**Morning:**

- ☐ Check system alerts
- ☐ Review overnight transactions
- ☐ Verify no errors in logs

**During Day:**

- ☐ Monitor NCR queue
- ☐ Respond to user questions
- ☐ Review price variance trends

**End of Day:**

- ☐ Review transaction volume
- ☐ Check reconciliation progress (month-end)
- ☐ Plan next day tasks

### Weekly Admin Tasks

**Every Monday:**

- ☐ Review last week's metrics
- ☐ Analyze price variance trends
- ☐ Check user activity logs
- ☐ Update item prices (if needed)

**Every Friday:**

- ☐ Review pending NCRs
- ☐ Clear stale data
- ☐ Backup check (automated)
- ☐ Plan next week

### Monthly Admin Tasks

**Week 1-3:**

- Normal operations monitoring
- Item master maintenance
- User feedback review

**Week 4 (Month-End):**

- ☐ Coordinate reconciliation
- ☐ Monitor location readiness
- ☐ Resolve blocking NCRs
- ☐ Execute period close
- ☐ Open next period
- ☐ Generate monthly reports

### Audit & Compliance

**Audit Trail:**

- All transactions logged with:
  - User who performed action
  - Timestamp
  - Before/after values (for edits)
  - IP address (if needed)

**Compliance Reports:**

- Monthly reconciliation summary
- Price change log
- User activity report
- NCR disposition summary

**Data Retention:**

- Transactional data: Indefinite
- Period snapshots: Indefinite
- Audit logs: Minimum 7 years
- User sessions: 90 days

### System Health Monitoring

**Key Metrics:**

**Performance:**

- API response times (target: <1s)
- Page load times (target: <3s)
- Database query performance

**Usage:**

- Active users per day
- Transactions per hour
- Peak usage times

**Quality:**

- Error rate (target: <1%)
- NCR volume and trends
- Reconciliation variance trends

**Alerts:**

- System errors
- Slow queries
- Failed logins
- Unusual activity

---

## Admin Best Practices

### Critical Do's and Don'ts

✅ **DO:**

- Verify all price changes before saving
- Communicate period close dates early
- Review all NCRs before period close
- Maintain audit trail integrity
- Keep user access current
- Document all system changes
- Test in non-peak hours
- Keep backup/restore tested

❌ **DON'T:**

- Delete data (deactivate instead)
- Change prices during open period
- Close period without all locations ready
- Share admin credentials
- Override system validations without investigation
- Skip backups
- Make changes without documentation

### Security & Access Control

**Password Policy:**

- Minimum 12 characters
- Mix of letters, numbers, symbols
- Changed every 90 days
- No password reuse

**Session Management:**

- Automatic timeout after 30 minutes
- Re-authentication for sensitive actions
- Single sign-on (if available)

**Principle of Least Privilege:**

- Users get minimum access needed
- Regular access reviews
- Remove access promptly when role changes

### Disaster Recovery

**Backup Strategy:**

- Automated daily backups
- Retention: 30 days
- Offsite storage
- Regular restore tests

**Business Continuity:**

- Document manual processes (if system down)
- Emergency contact list
- Escalation procedures
- Recovery time objective: 4 hours

---

## Conclusion

### Key Takeaways by Role

**Operators:**

- Record deliveries and issues accurately
- Check stock before issuing
- Report discrepancies immediately
- Don't guess - ask if unsure

**Supervisors:**

- Approve transfers promptly
- Complete reconciliations on time
- Investigate variances thoroughly
- Monitor team performance

**Admins:**

- Maintain master data integrity
- Coordinate period close process
- Monitor system health
- Ensure audit compliance

### Support & Resources

**Documentation:**

- User Manual: `/project-docs/user-docs/USER_MANUAL.md`
- Quick Reference: `/project-docs/user-docs/QUICK_REFERENCE_CARD.md`
- FAQ: `/project-docs/user-docs/FAQ.md`
- Workflow Guide: `/project-docs/Workflow_Guide.md`

**Getting Help:**

- Technical Issues: IT Support
- Process Questions: Your Supervisor
- System Changes: Admin
- Training: Request refresher session

**Feedback:**

- Report bugs or issues
- Suggest improvements
- Request new features
- Share success stories

---

**End of Training Presentation**

_Thank you for your attention. Questions?_
