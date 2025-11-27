# Stock Management System - Practice Scenarios

**Version:** 1.0
**Last Updated:** November 2025

---

## Table of Contents

1. [Introduction](#introduction)
2. [Operator Practice Scenarios](#operator-practice-scenarios)
3. [Supervisor Practice Scenarios](#supervisor-practice-scenarios)
4. [Admin Practice Scenarios](#admin-practice-scenarios)
5. [Advanced Multi-Role Scenarios](#advanced-multi-role-scenarios)

---

## Introduction

### Purpose of Practice Scenarios

These scenarios provide hands-on practice for new users to become familiar with the Stock Management System in a safe, controlled environment.

### How to Use This Document

**For Trainers:**
- Use scenarios during training sessions
- Walk through each scenario step-by-step
- Encourage trainees to ask questions
- Verify understanding at each checkpoint

**For Self-Learning:**
- Read scenario completely first
- Follow steps in the system
- Check your work against expected results
- Repeat until confident

### Practice Environment

**Important:** These scenarios should be completed in a **test/training environment**, not in production.

**Test Environment Setup:**
- Use test user accounts
- Use test locations and items
- Transactions won't affect real data
- Can be reset between sessions

---

# Operator Practice Scenarios

## Scenario 1: Record a Simple Delivery

**Role:** Operator (Kitchen)
**Duration:** 10 minutes
**Difficulty:** ⭐ Beginner

### Scenario Background

You work in the Kitchen location. Today is Monday, November 27th. A delivery truck has arrived from "ABC Food Suppliers" with your weekly rice order. You have the delivery invoice in hand.

**Invoice Details:**
```
Invoice #: INV-2024-1127
Date: 27/11/2024
Supplier: ABC Food Suppliers

Items:
- Rice, Basmati 5kg: 10 bags @ SAR 25.00 per bag
- Oil, Vegetable 1L: 5 bottles @ SAR 8.50 per bottle

Total: SAR 292.50
```

### Your Task

Record this delivery in the system.

### Step-by-Step Instructions

**1. Login to System**
- Navigate to the application
- Login with your operator credentials
- Verify you see "Kitchen" as your location

**2. Navigate to Deliveries**
- Click **"Deliveries"** in the main menu
- You should see list of past deliveries
- Click **"New Delivery"** button (top-right)

**3. Fill Header Information**
```
Location: Kitchen (should be pre-selected)
Supplier: ABC Food Suppliers (select from dropdown)
PO/Invoice Number: INV-2024-1127
Delivery Date: 27/11/2024 (today)
Notes: (leave blank for now)
```

**4. Add First Item - Rice**
- Click **"Add Item"** button
- Select item: "Rice, Basmati 5kg"
- Enter quantity: 10
- Enter unit price: SAR 25.00
- Line total should show: SAR 250.00

**5. Add Second Item - Oil**
- Click **"Add Item"** button again
- Select item: "Oil, Vegetable 1L"
- Enter quantity: 5
- Enter unit price: SAR 8.50
- Line total should show: SAR 42.50

**6. Verify Total**
- Check delivery total: SAR 292.50
- Compare with invoice total
- Should match ✓

**7. Submit Delivery**
- Click **"Submit Delivery"** button
- Wait for confirmation message
- You should see: "Delivery recorded successfully"

### Expected Results

**✓ Delivery Created:**
- Delivery number assigned (e.g., DL-2024-11-027)
- Status: Posted
- Visible in deliveries list

**✓ Stock Updated:**
- Navigate to Items or Dashboard
- Rice stock increased by 10 bags
- Oil stock increased by 5 bottles

**✓ WAC Updated:**
- System recalculated WAC for both items
- New WAC visible on item details

### Self-Check Questions

1. ❓ Can you find the delivery you just created in the deliveries list?
2. ❓ What is the new stock level for Rice in Kitchen?
3. ❓ What is the new WAC for Rice?
4. ❓ Did the system create any NCRs? (Check NCRs menu)

---

## Scenario 2: Record a Delivery with Price Variance

**Role:** Operator (Store)
**Duration:** 15 minutes
**Difficulty:** ⭐⭐ Intermediate

### Scenario Background

You work in the Store location. A delivery has arrived from "XYZ Supplies" with flour. However, the price on the invoice is higher than usual.

**Invoice Details:**
```
Invoice #: INV-2024-1128
Date: 27/11/2024
Supplier: XYZ Supplies

Items:
- Flour, All-Purpose 10kg: 20 bags @ SAR 32.00 per bag

Total: SAR 640.00
```

**Known Information:**
- Normal price for flour: SAR 30.00 per bag
- Price variance: +SAR 2.00 per bag (+6.7%)

### Your Task

Record the delivery even though the price is different. The system will handle the price variance.

### Step-by-Step Instructions

**1. Navigate to Deliveries**
- Click **"Deliveries"** → **"New Delivery"**

**2. Fill Header Information**
```
Location: Store
Supplier: XYZ Supplies
PO/Invoice Number: INV-2024-1128
Delivery Date: 27/11/2024
Notes: "Price increase noted on invoice"
```

**3. Add Item**
- Click **"Add Item"**
- Select: "Flour, All-Purpose 10kg"
- Quantity: 20
- Unit Price: SAR 32.00 (actual invoice price)

**4. Notice Price Variance Warning**
- System should show yellow banner:
  ```
  ⚠ Price Variance Detected
  Expected: SAR 30.00
  Actual: SAR 32.00
  Variance: +SAR 2.00 per bag
  An NCR will be created automatically.
  ```

**5. Verify and Submit**
- Total should be: SAR 640.00
- Click **"Submit Delivery"**
- Confirm when prompted

**6. Check NCR Created**
- Navigate to **"NCRs"** menu
- Find auto-generated NCR
- Should show:
  ```
  Type: PRICE_VARIANCE
  Item: Flour, All-Purpose 10kg
  Variance: +SAR 2.00/bag
  Total Impact: +SAR 40.00
  Status: Pending Review
  ```

### Expected Results

**✓ Delivery Posted:**
- Flour stock increased by 20 bags
- Delivery recorded with actual price (SAR 32.00)

**✓ NCR Auto-Created:**
- NCR type: PRICE_VARIANCE
- Status: Pending Review
- Assigned to supervisors for disposition

**✓ WAC Updated:**
- WAC recalculated using actual price (SAR 32.00)

### Self-Check Questions

1. ❓ Why did the system create an NCR?
2. ❓ Should you have used the old price (SAR 30.00) instead?
3. ❓ Who will review and resolve this NCR?
4. ❓ Can you still post the delivery even with price variance?

**Answers:**
1. System detected delivery price ≠ locked period price
2. No - always enter the actual invoice price
3. Supervisor will review and disposition the NCR
4. Yes - delivery posts normally, NCR handled separately

---

## Scenario 3: Record an Issue - Kitchen Consumption

**Role:** Operator (Kitchen)
**Duration:** 10 minutes
**Difficulty:** ⭐ Beginner

### Scenario Background

You work in the Kitchen. The chef has used ingredients for today's meal preparation and has given you the usage list to record.

**Usage List - November 27, 2024:**
```
Morning Shift:
- Rice, Basmati 5kg: 3.5 bags used
- Oil, Vegetable 1L: 1.2 liters used
- Salt, Table 1kg: 0.5 kg used

Purpose: Daily meal preparation
```

### Your Task

Record this usage as an ISSUE (CONSUMPTION type).

### Step-by-Step Instructions

**1. Navigate to Issues**
- Click **"Issues"** → **"New Issue"**

**2. Fill Header**
```
Location: Kitchen
Issue Type: CONSUMPTION
Reference Number: KITCHEN-DAILY-27NOV
Issue Date: 27/11/2024
Notes: "Morning shift meal preparation"
```

**3. Add Items**

**Item 1: Rice**
- Click **"Add Item"**
- Item: "Rice, Basmati 5kg"
- Quantity: 3.5
- Check current stock is sufficient (should show available qty)

**Item 2: Oil**
- Click **"Add Item"**
- Item: "Oil, Vegetable 1L"
- Quantity: 1.2

**Item 3: Salt**
- Click **"Add Item"**
- Item: "Salt, Table 1kg"
- Quantity: 0.5

**4. Submit Issue**
- Verify all quantities
- Click **"Submit Issue"**
- Confirm submission

### Expected Results

**✓ Issue Posted:**
- Issue number assigned (e.g., IS-2024-11-027)
- Status: Posted

**✓ Stock Reduced:**
- Rice: -3.5 bags
- Oil: -1.2 liters
- Salt: -0.5 kg

**✓ WAC Unchanged:**
- Issue does not recalculate WAC
- Stock deducted at current WAC

### Challenge Task

**Scenario Extension:**
Try to issue 100 bags of Rice (more than available stock).

**What happens?**
- System shows error: "Insufficient stock"
- Current stock: [X bags]
- Requested: 100 bags
- Issue is not posted

**Lesson:** System prevents negative stock.

---

## Scenario 4: Handle Insufficient Stock

**Role:** Operator (Store)
**Duration:** 10 minutes
**Difficulty:** ⭐⭐ Intermediate

### Scenario Background

You work in the Store. A customer requests 50 bottles of Oil, but you suspect you don't have enough stock.

**Request:**
- Oil, Vegetable 1L: 50 bottles
- Issue type: SALE
- Reference: CUSTOMER-ORDER-1128

### Your Task

Attempt to issue the oil, identify the stock shortage, and take appropriate action.

### Step-by-Step Instructions

**1. Check Current Stock First**
- Navigate to **"Items"** or **"Dashboard"**
- Find "Oil, Vegetable 1L"
- Note current stock (let's say 25 bottles)

**2. Attempt to Create Issue**
- Navigate to **"Issues"** → **"New Issue"**
```
Location: Store
Issue Type: SALE
Reference Number: CUSTOMER-ORDER-1128
Issue Date: 27/11/2024
```

**3. Add Item**
- Click **"Add Item"**
- Item: "Oil, Vegetable 1L"
- Quantity: 50
- Notice current stock shows: 25 bottles

**4. Try to Submit**
- Click **"Submit Issue"**
- System shows error:
  ```
  ❌ Insufficient Stock
  Item: Oil, Vegetable 1L
  Available: 25 bottles
  Requested: 50 bottles
  Shortage: 25 bottles
  ```

**5. Take Corrective Action**

**Option A: Partial Issue**
- Change quantity to 25 (available amount)
- Submit partial issue
- Note shortage for supervisor

**Option B: Request Transfer**
- Cancel this issue
- Navigate to **"Transfers"**
- Create transfer request from another location
- Wait for approval
- Complete issue after transfer arrives

**Option C: Contact Supervisor**
- Don't post issue
- Inform supervisor of shortage
- Supervisor arranges emergency delivery or transfer

### Expected Results

**✓ Understanding:**
- System prevents negative stock
- Cannot override insufficient stock
- Must use proper workflow (transfer/delivery)

**✓ Best Practice:**
- Check stock before promising to customer
- Use dashboard alerts for low stock
- Plan ahead for transfers/deliveries

### Self-Check Questions

1. ❓ Why does the system prevent issuing more than available?
2. ❓ What are your options when stock is insufficient?
3. ❓ Should you force the issue and manually adjust stock later?

**Answers:**
1. To maintain data integrity and prevent negative inventory
2. Partial issue, request transfer, order delivery, contact supervisor
3. No - never manually adjust. Use proper processes.

---

# Supervisor Practice Scenarios

## Scenario 5: Approve a Transfer Request

**Role:** Supervisor (All Locations)
**Duration:** 15 minutes
**Difficulty:** ⭐⭐ Intermediate

### Scenario Background

You are a Supervisor with access to all locations. An operator at the Kitchen has requested a transfer of flour from Central warehouse because Kitchen stock is low.

**Transfer Request:**
```
Transfer #: TR-2024-11-027
From: Central → To: Kitchen
Requested by: Maria Garcia (Kitchen Operator)
Date: 27/11/2024

Items:
- Flour, All-Purpose 10kg: 15 bags

Reason: "Kitchen running low on flour, need for weekend production"
```

### Your Task

Review and approve this transfer request.

### Step-by-Step Instructions

**1. Navigate to Transfers**
- Click **"Transfers"** menu
- Filter: **"Pending Approval"**
- Find transfer: TR-2024-11-027

**2. Review Transfer Details**
- From: Central
- To: Kitchen
- Requester: Maria Garcia
- Date: 27/11/2024

**3. Verification Checklist**

**Check 1: Stock Availability at Source**
- Click on "Central" location
- Check stock for "Flour, All-Purpose 10kg"
- Verify Central has at least 15 bags
- ✓ Central has 50 bags available

**Check 2: Business Justification**
- Read reason: "Kitchen running low"
- Check Kitchen current stock
- Kitchen has 5 bags (reorder point: 10 bags)
- ✓ Transfer is justified

**Check 3: Quantity Reasonable**
- Requesting: 15 bags
- Kitchen min: 10 bags, max: 30 bags
- After transfer: 5 + 15 = 20 bags (within range)
- ✓ Quantity reasonable

**Check 4: Period Status**
- Verify current period is OPEN
- ✓ Transactions allowed

**4. Approve Transfer**
- Click **"Approve Transfer"** button
- Add approval comment: "Approved - stock justified, source has inventory"
- Confirm approval

**5. Verify Stock Movement**

**Central (Source):**
- Before: 50 bags
- After: 50 - 15 = 35 bags
- WAC: Unchanged (source WAC stays same)

**Kitchen (Destination):**
- Before: 5 bags @ SAR 30.00 = SAR 150.00
- Received: 15 bags @ SAR 30.00 = SAR 450.00
- After: 20 bags @ SAR 30.00 = SAR 600.00
- WAC: Recalculated (if different source WAC)

### Expected Results

**✓ Transfer Approved:**
- Status changed to: COMPLETED
- Stock moved atomically

**✓ Audit Trail:**
- System records:
  - Who approved: Your name
  - When: Timestamp
  - Comment: Your approval note

**✓ Notifications:**
- Requester notified (if notifications enabled)

### Self-Check Questions

1. ❓ What would you do if Central only had 10 bags (not enough)?
2. ❓ Can you approve a transfer you created yourself?
3. ❓ What happens if you reject the transfer?

**Answers:**
1. Reject or approve partial quantity, add comment explaining
2. No - transfers require approval by a different supervisor
3. Transfer status changes to REJECTED, stock doesn't move, requester notified

---

## Scenario 6: Month-End Reconciliation

**Role:** Supervisor (Store Location)
**Duration:** 30 minutes
**Difficulty:** ⭐⭐⭐ Advanced

### Scenario Background

It's November 29th, end of the month. You need to complete a physical inventory count for the Store location and reconcile it against the system's book stock.

**Physical Count Sheet:**
```
Store Location - Physical Inventory
Date: 29/11/2024
Counted by: Supervisor Team

Item                          | Counted Qty
------------------------------|-------------
Rice, Basmati 5kg            | 44.0 bags
Flour, All-Purpose 10kg      | 38.5 bags
Oil, Vegetable 1L            | 19.0 liters
Salt, Table 1kg              | 24.5 kg
Sugar, White 5kg             | 30.0 bags
Milk, UHT 1L                 | 48.0 liters
```

**Book Stock (System):**
```
Item                          | Book Qty
------------------------------|----------
Rice, Basmati 5kg            | 45.5 bags
Flour, All-Purpose 10kg      | 38.5 bags
Oil, Vegetable 1L            | 20.0 liters
Salt, Table 1kg              | 25.0 kg
Sugar, White 5kg             | 30.0 bags
Milk, UHT 1L                 | 50.0 liters
```

### Your Task

Enter the physical count into the system and investigate/document all variances.

### Step-by-Step Instructions

**1. Navigate to Reconciliations**
- Click **"Reconciliations"** → **"New Reconciliation"**

**2. Start Reconciliation**
```
Location: Store
Period: November 2024 (auto-selected)
Count Date: 29/11/2024
Notes: "End of month physical inventory"
```

**3. System Pre-Fills Book Stock**
- Table shows all items with current book stock
- Your job: Enter counted quantities

**4. Enter Counted Quantities**

For each item, enter the physical count:

**Rice:**
- Book: 45.5 bags
- Counted: 44.0 bags
- Variance: -1.5 bags (shortage)

**Flour:**
- Book: 38.5 bags
- Counted: 38.5 bags
- Variance: 0.0 (perfect match ✓)

**Oil:**
- Book: 20.0 liters
- Counted: 19.0 liters
- Variance: -1.0 liter (shortage)

**Salt:**
- Book: 25.0 kg
- Counted: 24.5 kg
- Variance: -0.5 kg (shortage)

**Sugar:**
- Book: 30.0 bags
- Counted: 30.0 bags
- Variance: 0.0 (perfect match ✓)

**Milk:**
- Book: 50.0 liters
- Counted: 48.0 liters
- Variance: -2.0 liters (shortage)

**5. Investigate Variances**

**Rice: -1.5 bags (-3.3%)**
- Acceptable threshold: ±2%
- Variance: 3.3% (slightly over)
- Investigation:
  - Check recent issues - found 1 bag used for staff meal (not recorded)
  - Add note: "1 bag staff meal not recorded, 0.5 bag spillage during storage"

**Oil: -1.0 liter (-5%)**
- Acceptable threshold: ±3%
- Variance: 5% (exceeds threshold)
- Investigation:
  - Recount oil - confirmed 19.0 liters
  - Check recent issues - all recorded correctly
  - Possible leak in one container
  - Add note: "Investigated - possible container leak, no unrecorded issues found"

**Salt: -0.5 kg (-2%)**
- Within threshold
- Add note: "Normal consumption variance, within acceptable range"

**Milk: -2.0 liters (-4%)**
- Acceptable threshold: ±3%
- Variance: 4% (exceeds threshold)
- Investigation:
  - Found 2 liters expired and discarded (not recorded as waste)
  - Add note: "2 liters expired product discarded, not recorded as waste issue"

**6. Document All Findings**
- For each variance, add clear notes
- Explain investigation results
- Note corrective actions

**7. Submit Reconciliation**
- Review all variances one final time
- Click **"Submit Reconciliation"**
- System updates book stock to match counted stock

**8. Post-Reconciliation Actions**

**Create Waste Issue for Milk:**
- Navigate to **"Issues"** → **"New Issue"**
- Type: WASTE
- Item: Milk, UHT 1L
- Quantity: 0 (already adjusted via reconciliation)
- Notes: "Documented via month-end reconciliation - expired product"

**Tighten Controls:**
- Remind team to record all issues immediately
- Implement daily expiry date checks for milk
- Investigate oil container for leaks

### Expected Results

**✓ Reconciliation Complete:**
- All variances documented
- Book stock adjusted to match physical count
- Audit trail created

**✓ Financial Impact:**
```
Rice: -1.5 bags @ SAR 30.00 = -SAR 45.00
Oil: -1.0 L @ SAR 8.50 = -SAR 8.50
Salt: -0.5 kg @ SAR 5.00 = -SAR 2.50
Milk: -2.0 L @ SAR 4.00 = -SAR 8.00
---
Total variance: -SAR 64.00 (write-off)
```

**✓ Process Improvements Identified:**
- Staff meal recording process
- Waste disposal documentation
- Container quality checks

### Self-Check Questions

1. ❓ Why is it important to investigate variances?
2. ❓ What's the difference between book stock and physical stock?
3. ❓ Should you adjust book stock without physical count?
4. ❓ When should reconciliation be completed?

---

## Scenario 7: Resolve Price Variance NCR

**Role:** Supervisor
**Duration:** 20 minutes
**Difficulty:** ⭐⭐ Intermediate

### Scenario Background

An operator posted a delivery yesterday with a price variance. An NCR was auto-generated. You need to review and disposition this NCR.

**NCR Details:**
```
NCR #: NCR-2024-11-028
Type: PRICE_VARIANCE (Auto-generated)
Status: Pending Review
Created: 27/11/2024

Item: Sugar, White 5kg
Location: Central
Delivery: DL-2024-11-145

Period Price: SAR 15.00/bag
Delivery Price: SAR 16.50/bag
Variance: +SAR 1.50/bag (+10%)

Quantity: 100 bags
Total Variance: +SAR 150.00
```

### Your Task

Investigate the price variance and disposition the NCR appropriately.

### Step-by-Step Instructions

**1. Navigate to NCRs**
- Click **"NCRs"** menu
- Filter: **"Pending Review"**
- Find NCR: NCR-2024-11-028

**2. Review NCR Details**
- Read all information
- Note: 10% price increase
- Total impact: +SAR 150.00

**3. Gather Additional Information**

**Check Delivery:**
- Click on delivery link: DL-2024-11-145
- View delivery document
- Verify invoice price: SAR 16.50 ✓
- Operator notes: "Supplier advised price increase"

**Check Supplier Communication:**
- Contact supplier or check emails
- Supplier sent price increase notice on 20/11/2024
- New price: SAR 16.50 effective 25/11/2024
- Reason: Raw material cost increase

**Check Market Rates:**
- Call other suppliers
- Market rate for sugar: SAR 16.00 - SAR 17.00
- Our price: SAR 16.50 (competitive) ✓

**4. Make Disposition Decision**

**Analysis:**
- ✓ Price increase is legitimate (supplier notification)
- ✓ New price is competitive (market rate check)
- ✓ Price increase is permanent (not temporary)
- ✓ Invoice matches delivery (no error)

**Decision:** ACCEPT

**5. Complete NCR**

**Navigate back to NCR:**
- Click **"Edit NCR"** or **"Update Disposition"**

**Fill in Disposition:**
```
Disposition: ACCEPT
Comments:
"Investigated price variance. Supplier provided formal
price increase notice dated 20/11/2024 due to raw
material cost increase. New price SAR 16.50 is
competitive with market rates (verified with 2 other
suppliers). Price increase is legitimate and permanent.

Recommendation: Update master item price to SAR 16.50
for next period. Notify purchasing team of new baseline."

Disposition Date: 29/11/2024
```

**6. Save NCR**
- Click **"Save"** or **"Update NCR"**
- Status changes to: CLOSED
- NCR archived

**7. Follow-up Actions**

**Notify Admin:**
- Send message or email to Admin
- Request item price update
- Attach supplier communication

**Update Purchasing Team:**
- New baseline price: SAR 16.50
- Update procurement budget
- Adjust reorder calculations

### Expected Results

**✓ NCR Closed:**
- Disposition: ACCEPT
- Detailed investigation documented
- Follow-up actions identified

**✓ Audit Trail:**
- Who dispositioned: Your name
- When: Timestamp
- Justification: Complete documentation

**✓ Price Update Workflow Initiated:**
- Admin notified
- Price will be updated for next period

### Alternative Scenarios

**Scenario A: REJECT Disposition**

**Example:**
```
NCR shows delivery price: SAR 20.00
Supplier invoice shows: SAR 16.50
→ Data entry error by operator

Disposition: REJECT
Action: Correct delivery price, reimburse supplier
```

**Scenario B: INVESTIGATE Disposition**

**Example:**
```
NCR shows sudden 50% price increase
No supplier communication found
Unusual and suspicious

Disposition: INVESTIGATE
Action: Contact supplier, verify invoice authenticity,
        hold payment until resolved
```

---

# Admin Practice Scenarios

## Scenario 8: Create New Item

**Role:** Admin
**Duration:** 15 minutes
**Difficulty:** ⭐⭐ Intermediate

### Scenario Background

The purchasing team has started buying a new product that needs to be added to the system: "Tomato Paste, Canned 800g".

**Product Information:**
```
Item Name: Tomato Paste, Canned 800g
Item Code: TOM-PASTE-800
Category: CONDIMENTS
Unit of Measure: EA (Each - cans)
Supplier: Global Food Distributors
Supplier SKU: GFD-TOM-800

Pricing by Location:
- Kitchen: SAR 5.00 per can
- Store: SAR 5.00 per can
- Central: SAR 4.50 per can (bulk discount)
- Warehouse: SAR 4.50 per can

Stock Control:
- Reorder Point: 50 cans
- Maximum Stock: 200 cans
```

### Your Task

Create this new item in the system.

### Step-by-Step Instructions

**1. Navigate to Items**
- Click **"Items"** menu
- Click **"New Item"** button

**2. Fill Basic Information**
```
Item Code: TOM-PASTE-800
Name: Tomato Paste, Canned 800g
Description: "Concentrated tomato paste in 800g cans,
             suitable for cooking and sauces"
Category: CONDIMENTS (select from dropdown)
Unit: EA (select from dropdown)
```

**3. Set Stock Control**
```
Reorder Point: 50
Maximum Stock: 200
```

**4. Set Supplier Information**
```
Default Supplier: Global Food Distributors
Supplier Item Code: GFD-TOM-800
```

**5. Set Prices by Location**

**Kitchen:**
- Price: SAR 5.00

**Store:**
- Price: SAR 5.00

**Central:**
- Price: SAR 4.50

**Warehouse:**
- Price: SAR 4.50

**6. Activate Item**
- Toggle **"Is Active"**: ☑ Enabled
- Review all fields
- Click **"Save Item"**

**7. Verify Item Created**
- Search for "Tomato Paste" in items list
- Click to view details
- Verify all information correct

**8. Test Item in Transaction**
- Navigate to **"Deliveries"** → **"New Delivery"**
- Try to add the new item
- ✓ Should appear in item dropdown
- Cancel delivery (just testing)

### Expected Results

**✓ Item Created:**
- Visible in items list
- Searchable by name or code
- Available for all transaction types

**✓ Prices Locked:**
- Current period prices set
- Different locations have different prices
- Prices cannot be changed until period lock

**✓ Stock Control Active:**
- Reorder alerts will trigger at 50 cans
- Maximum prevents over-ordering

### Self-Check Questions

1. ❓ Why are prices different by location?
2. ❓ Can you change the price tomorrow?
3. ❓ What happens if you deactivate this item?

---

## Scenario 9: Execute Month-End Period Close

**Role:** Admin
**Duration:** 45 minutes
**Difficulty:** ⭐⭐⭐ Advanced

### Scenario Background

It's November 30th, the last day of the month. You need to close the November 2024 period and open December 2024.

**Current Status:**
- Period: November 2024
- Status: OPEN
- All locations operating normally
- Several reconciliations in progress

### Your Task

Coordinate and execute the period close process.

### Step-by-Step Instructions

**Phase 1: Pre-Close Communication (Day -3)**

**1. Send Closure Notice**
```
To: All users
Subject: November Period Close - Nov 30

The November 2024 accounting period will close on
November 30, 2024 at 5:00 PM.

Action Required:
- Operators: Ensure all deliveries/issues posted by 4:00 PM
- Supervisors: Complete reconciliations by Nov 29
- All: No transactions after 5:00 PM Nov 30

Questions? Contact admin@company.com
```

**2. Create Cutoff Checklist**
```
☐ All deliveries posted (by Nov 30, 4 PM)
☐ All issues posted (by Nov 30, 4 PM)
☐ All transfers approved (by Nov 30, 2 PM)
☐ All NCRs dispositioned (by Nov 29)
☐ All reconciliations submitted (by Nov 29)
☐ All locations marked ready (by Nov 30, 4 PM)
```

**Phase 2: Monitor Readiness (Nov 29-30)**

**1. Check Reconciliation Progress**
- Navigate to **"Reconciliations"**
- Filter by Period: November 2024
```
Location  | Status     | Completed Date
----------|------------|---------------
Kitchen   | ✓ Done     | Nov 29
Store     | ⏳ In Progress | -
Central   | ✓ Done     | Nov 29
Warehouse | ✓ Done     | Nov 29
```

**2. Follow Up on Store**
- Contact Store supervisor
- Reminder: Reconciliation due today
- Offer assistance if needed

**3. Check NCR Status**
- Navigate to **"NCRs"**
- Filter: Status = Pending
```
NCRs Pending: 2

NCR-2024-11-028: Price Variance - Sugar
→ Assigned to Supervisor A

NCR-2024-11-029: Quality Issue - Damaged Rice
→ Assigned to Supervisor B
```

**4. Follow Up on Pending NCRs**
- Message supervisors
- Request disposition by end of day
- Critical for period close

**Phase 3: Location Readiness (Nov 30, Morning)**

**1. Navigate to Period Close Page**
- Click **"Periods"** menu
- Click current period: "November 2024"
- Click **"Period Close"** tab

**2. Review Location Status**
```
Location  | Reconciliation | NCRs | Pending   | Ready Status
          |                |      | Transfers |
----------|----------------|------|-----------|-------------
Kitchen   | ✓ Complete     | 0    | 0         | ⏳ Not Ready
Store     | ✓ Complete     | 0    | 0         | ⏳ Not Ready
Central   | ✓ Complete     | 0    | 1         | ⏳ Not Ready
Warehouse | ✓ Complete     | 0    | 0         | ⏳ Not Ready
```

**3. Resolve Blocking Issues**

**Central has pending transfer:**
- Navigate to **"Transfers"**
- Find pending transfer: TR-2024-11-150
- From Central → To Kitchen
- Contact supervisor to approve
- Wait for approval... ✓ Approved

**4. Coordinate with Supervisors**
- Each location supervisor must mark ready
- Send reminder at 2:00 PM
- Deadline: 4:00 PM

**Phase 4: Execute Close (Nov 30, 4:00 PM)**

**1. Verify All Locations Ready**
```
Navigate to: Periods → November 2024 → Period Close

✓ Kitchen - Ready (marked at 3:45 PM)
✓ Store - Ready (marked at 3:50 PM)
✓ Central - Ready (marked at 3:30 PM)
✓ Warehouse - Ready (marked at 3:55 PM)
```

**2. Final Validation**
- All reconciliations: Complete ✓
- All NCRs: Closed ✓
- All transfers: Approved or cancelled ✓
- All locations: Ready ✓

**3. Execute Period Close**
- Click **"Close Period"** button
- System confirms:
  ```
  ⚠ Warning: This action cannot be undone

  You are about to close November 2024 period.
  This will:
  - Lock all transactions
  - Create stock snapshots for all locations
  - Archive period data
  - Prevent further changes

  Are you sure? [Cancel] [Confirm Close]
  ```
- Click **"Confirm Close"**

**4. System Processing**
```
Closing period November 2024...

✓ Validating all locations ready
✓ Checking for open transactions
✓ Creating snapshot - Kitchen
✓ Creating snapshot - Store
✓ Creating snapshot - Central
✓ Creating snapshot - Warehouse
✓ Archiving period data
✓ Updating period status

Period November 2024 successfully closed.
```

**5. Verify Snapshots**
- Navigate to **"Periods"** → **"November 2024"** → **"Snapshots"**
- View snapshots for each location
```
Kitchen Snapshot - Nov 30, 2024, 4:05 PM
Total Items: 45
Total Quantity: 2,450 units
Total Value: SAR 125,340.00

[View Detailed Snapshot]
```

**Phase 5: Open Next Period (Nov 30, 4:10 PM)**

**1. Create December Period**
- Navigate to **"Periods"**
- Click **"New Period"**

**2. Fill Period Details**
```
Period Name: December 2024
Start Date: 01/12/2024
End Date: 31/12/2024
Fiscal Year: 2024
```

**3. System Actions**
- Locks prices from November period
- Creates period price snapshot
- Sets as current period
- Status: OPEN

**4. Verify New Period Active**
```
Current Period: December 2024
Status: OPEN
Start Date: 01/12/2024
End Date: 31/12/2024

Prices locked: 150 items
```

**5. Test Transactions Allowed**
- Navigate to **"Deliveries"** → **"New Delivery"**
- Verify period shows: December 2024 ✓
- Transactions can be posted ✓
- Cancel test delivery

**Phase 6: Post-Close Tasks (Nov 30-Dec 1)**

**1. Generate Reports**
- Month-end summary
- Stock valuation report
- Variance analysis
- NCR summary

**2. Communicate Completion**
```
To: All users
Subject: November Period Closed - December Open

November 2024 period has been successfully closed.
December 2024 period is now open for transactions.

You may resume normal operations.

Month-end reports available on request.

Thank you for your cooperation.
```

**3. Price Updates**

**Review accepted NCRs:**
- Sugar: SAR 15.00 → SAR 16.50 (ACCEPTED)
- Flour: SAR 30.00 → SAR 32.00 (ACCEPTED)

**Update item prices:**
- Navigate to **"Items"**
- Update prices for next period
- Prices will apply to December transactions

**4. Backup Verification**
- Check automated backup completed
- Verify snapshot data accessible
- Test restore capability (optional)

### Expected Results

**✓ November Period Closed:**
- Status: CLOSED
- No further transactions allowed
- Snapshots created for all locations

**✓ December Period Open:**
- Status: OPEN
- Prices locked
- Ready for transactions

**✓ Data Integrity:**
- All reconciliations complete
- All NCRs resolved
- Clean cutover

**✓ Reporting:**
- Month-end reports generated
- Financial data accurate
- Audit trail complete

### Self-Check Questions

1. ❓ Why can't you close period if one location isn't ready?
2. ❓ What happens to transactions posted in November after close?
3. ❓ Can you reopen November period if you find an error?
4. ❓ Why are prices locked when period closes?

---

# Advanced Multi-Role Scenarios

## Scenario 10: Complete Business Cycle (All Roles)

**Roles:** Operator, Supervisor, Admin
**Duration:** 60 minutes
**Difficulty:** ⭐⭐⭐ Advanced

### Scenario Overview

This scenario walks through a complete business cycle from delivery to period close, involving all three user roles.

### Timeline: November 27-30, 2024

**Day 1 (Nov 27) - Operator Activities**

**1. Morning Delivery (Kitchen)**
```
Role: Operator - Kitchen
Task: Record delivery

Supplier: ABC Food Suppliers
Items:
- Rice, Basmati 5kg: 20 bags @ SAR 25.00
- Oil, Vegetable 1L: 10 liters @ SAR 8.50

Expected Result:
- Stock increased
- WAC updated
- No NCR (prices match period prices)
```

**2. Mid-Day Issue (Kitchen)**
```
Role: Operator - Kitchen
Task: Record consumption

Type: CONSUMPTION
Items:
- Rice, Basmati 5kg: 5.5 bags
- Oil, Vegetable 1L: 2.0 liters

Expected Result:
- Stock decreased
- WAC unchanged
```

**3. Low Stock Alert (Kitchen)**
```
Role: Operator - Kitchen
Task: Notice low stock alert for Flour

Current: 8 bags
Reorder point: 10 bags
→ Create transfer request from Central
```

**4. Create Transfer Request**
```
Role: Operator - Kitchen
Task: Request transfer

From: Central → To: Kitchen
Items: Flour, All-Purpose 10kg: 15 bags
Reason: "Running low, need for weekend production"

Expected Result:
- Transfer status: PENDING_APPROVAL
- Notification sent to supervisors
```

**Day 2 (Nov 28) - Supervisor Activities**

**5. Approve Transfer (Supervisor)**
```
Role: Supervisor
Task: Review and approve transfer TR-2024-11-027

Validation:
- Central stock: 50 bags ✓
- Kitchen need: Justified ✓
- Quantity: Reasonable ✓

Action: APPROVE

Expected Result:
- Stock moved: Central -15, Kitchen +15
- Transfer status: COMPLETED
- WAC recalculated at Kitchen
```

**6. Price Variance NCR (Supervisor)**
```
Role: Supervisor
Task: Disposition NCR-2024-11-028

Item: Sugar price variance
Investigation: Supplier price increase verified
Decision: ACCEPT

Expected Result:
- NCR closed
- Admin notified for price update
```

**Day 3 (Nov 29) - Month-End Activities**

**7. Physical Reconciliation (Supervisor - Kitchen)**
```
Role: Supervisor - Kitchen
Task: Month-end reconciliation

Physical count vs. Book stock:
- Rice: 35.0 vs 35.5 bags (-0.5 variance)
- Flour: 22.5 vs 23.0 bags (-0.5 variance)
- Oil: 18.0 vs 18.0 liters (perfect match)

Document variances, submit reconciliation

Expected Result:
- Book stock adjusted to physical
- Variances documented
- Location ready for period close
```

**8. Mark Location Ready (Supervisor - All Locations)**
```
Role: Supervisor (each location)
Task: Mark locations ready for period close

Kitchen: ✓ Reconciled, mark ready
Store: ✓ Reconciled, mark ready
Central: ✓ Reconciled, mark ready
Warehouse: ✓ Reconciled, mark ready

Expected Result:
- All locations ready
- Period close can proceed
```

**Day 4 (Nov 30) - Admin Period Close**

**9. Execute Period Close (Admin)**
```
Role: Admin
Task: Close November 2024 period

Pre-flight check:
- All locations ready: ✓
- All NCRs closed: ✓
- All reconciliations done: ✓

Action: Close November 2024
Expected Result:
- November CLOSED
- Snapshots created
- No further transactions allowed
```

**10. Open December Period (Admin)**
```
Role: Admin
Task: Open December 2024 period

Create new period: December 2024
Lock prices from November
Activate for transactions

Expected Result:
- December OPEN
- Operations can resume
- New month begins
```

**11. Update Prices (Admin)**
```
Role: Admin
Task: Update item prices based on accepted NCRs

Items to update:
- Sugar: SAR 15.00 → SAR 16.50

Apply for December period

Expected Result:
- New baseline prices
- December deliveries use new prices
- November locked at old prices
```

### Complete Cycle Verification

**Financial Summary:**
```
November 2024 - Kitchen Location

Opening Stock (Nov 1): SAR 120,000.00
+ Deliveries: SAR 50,000.00
+ Transfers In: SAR 450.00 (Flour transfer)
- Issues: SAR 45,000.00
- Transfers Out: SAR 0.00
- Reconciliation Variance: -SAR 30.00
= Closing Stock (Nov 30): SAR 125,420.00
```

**Audit Trail:**
```
Nov 27: Delivery DL-2024-11-145 - Rice, Oil (Operator: Maria)
Nov 27: Issue IS-2024-11-098 - Rice, Oil (Operator: Maria)
Nov 27: Transfer TR-2024-11-027 created (Operator: Maria)
Nov 28: Transfer TR-2024-11-027 approved (Supervisor: Bob)
Nov 28: NCR NCR-2024-11-028 dispositioned (Supervisor: Bob)
Nov 29: Reconciliation REC-2024-11-012 submitted (Supervisor: Bob)
Nov 29: Location Kitchen marked ready (Supervisor: Bob)
Nov 30: Period November 2024 closed (Admin: Sarah)
Nov 30: Period December 2024 opened (Admin: Sarah)
Nov 30: Item price updated - Sugar (Admin: Sarah)
```

### Learning Objectives

After completing this scenario, users should understand:

1. **Operator Role:**
   - Daily transaction posting
   - Stock monitoring
   - Transfer requests

2. **Supervisor Role:**
   - Transfer approvals
   - NCR disposition
   - Reconciliation process
   - Period readiness

3. **Admin Role:**
   - Period management
   - Price updates
   - System oversight
   - Reporting

4. **System Flow:**
   - Transaction lifecycle
   - Multi-user coordination
   - Month-end procedures
   - Data integrity controls

---

## Conclusion

### Practice Makes Perfect

These scenarios are designed to build confidence through hands-on practice. Users should:

- Complete scenarios multiple times
- Try variations and edge cases
- Ask questions during practice
- Learn from mistakes in safe environment

### Next Steps

After completing practice scenarios:

1. **Operators:**
   - Shadow experienced user for 1 week
   - Post real transactions under supervision
   - Gradually increase independence

2. **Supervisors:**
   - Observe full month-end close
   - Co-manage reconciliations
   - Build approval judgment

3. **Admins:**
   - Review system configuration
   - Plan first production period close
   - Establish monitoring routines

### Support Resources

- **User Manual:** Complete reference guide
- **Quick Reference:** One-page cheat sheet
- **FAQ:** Common questions and answers
- **Help Desk:** support@company.com

**Good luck with your training!**
