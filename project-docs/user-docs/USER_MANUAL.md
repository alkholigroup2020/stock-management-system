# Stock Management System - User Manual

**Version:** 1.0
**Last Updated:** November 2025

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Understanding Roles](#understanding-roles)
4. [System Overview](#system-overview)
5. [Page-by-Page Guide](#page-by-page-guide)
6. [Daily Workflows](#daily-workflows)
7. [Month-End Procedures](#month-end-procedures)
8. [Multi-Location Operations](#multi-location-operations)
9. [Troubleshooting](#troubleshooting)
10. [Glossary](#glossary)

---

## Introduction

### What is the Stock Management System?

The Stock Management System is a modern web application designed to replace Excel-based inventory workflows. It provides real-time stock tracking, inter-location transfers, weighted average costing (WAC), and coordinated period-end close across multiple sites.

### Key Benefits

- **Real-time Visibility**: See current stock levels instantly across all locations
- **Accurate Costing**: Automatic WAC calculation keeps your costs precise
- **Simplified Month-End**: Close periods with a clear checklist instead of complex spreadsheets
- **Multi-Location Support**: Manage Kitchen, Store, Central, and Warehouse from one system
- **Audit Trail**: Every transaction is tracked with who, when, and what
- **Works Anywhere**: Installable as an app on desktop and mobile devices

### Core Principle

**Add stock when trucks arrive. Subtract stock when the kitchen uses it. Close the month with a simple checklist.**

---

## Getting Started

### Logging In

1. Open your browser and navigate to the system URL
2. Enter your username and password
3. Click **Sign In**
4. Select your working location (if you have access to multiple locations)

### First-Time Setup

- Your administrator will create your account and assign you to locations
- You will receive credentials via email or from your supervisor
- Change your password after first login (recommended)

### Navigation

The main navigation menu provides access to all features:

| Icon           | Page            | Description                         |
| -------------- | --------------- | ----------------------------------- |
| Dashboard      | Home            | Overview of current period activity |
| Items          | Items & Prices  | Product catalog and pricing         |
| Deliveries     | Deliveries      | Record incoming goods               |
| Issues         | Issues          | Record goods sent to kitchen        |
| Transfers      | Transfers       | Move stock between locations        |
| Stock          | Stock Levels    | Current inventory by location       |
| NCR            | Non-Conformance | Track delivery problems             |
| Reconciliation | Reconciliation  | Month-end calculations              |
| Periods        | Periods         | Manage accounting periods           |

### Location Switcher

- Your current location is displayed in the header
- Click the location name to switch to another assigned location
- All operations are location-specific

---

## Understanding Roles

### Operator

**Primary Responsibilities:**

- Post deliveries as goods arrive
- Post issues as kitchen uses items
- Check stock levels
- Create NCRs for delivery problems

**What You Cannot Do:**

- Edit item prices
- Close periods
- Modify reconciliation values
- Approve transfers

### Supervisor

**Primary Responsibilities:**

- Everything an Operator can do
- Approve transfer requests
- Edit reconciliation adjustments (back-charges, credits)
- Review and resolve NCRs
- Generate reports

**What You Cannot Do:**

- Close periods
- Manage item master data
- Manage user accounts

### Admin

**Primary Responsibilities:**

- Everything a Supervisor can do
- Manage Items & Prices catalog
- Close accounting periods
- Create and manage user accounts
- System configuration

**Full Access:** Admins have unrestricted access to all features.

---

## System Overview

### How Data Flows

```
DELIVERIES → Increase Stock → ITEMS & PRICES
                              ↓
                         STOCK LEVELS
                              ↓
ISSUES → Decrease Stock → ITEMS & PRICES

POB → Total Mandays
         ↓
DELIVERIES → Receipts Total ─┐
STOCK LEVELS → Closing Value ├→ RECONCILIATION
ISSUES → Consumption ────────┤      ↓
NCR → Credits ───────────────┘  PERIOD CLOSE
                                    ↓
                               NEXT PERIOD
```

### Key Concepts

**Weighted Average Cost (WAC)**

- The system calculates average cost automatically
- Only deliveries recalculate WAC
- Issues use current WAC but don't change it

**Period Management**

- All transactions belong to an accounting period (usually monthly)
- Periods must be OPEN to post transactions
- Once closed, periods become read-only

**Location Isolation**

- Each location maintains its own stock levels
- Transfers move stock between locations
- Users can only access assigned locations

---

## Page-by-Page Guide

### Dashboard

**Purpose:** Quick overview of current period activity

**What You See:**

- **Total Receipts**: Sum of all deliveries this period
- **Total Issues**: Sum of all issues this period
- **Stock Value**: Current inventory value
- **Recent Activity**: Latest transactions

**Actions Available:**

- View summary metrics
- Click cards to navigate to detailed pages
- Quick-access buttons for common actions

---

### Items & Prices

**Purpose:** View and manage the product catalog

**Columns Displayed:**
| Column | Description |
|--------|-------------|
| Code | Unique item identifier (e.g., CHK001) |
| Name | Item description |
| Category | Product group (Meat, Dairy, etc.) |
| Unit | Measurement unit (KG, EA, LTR) |
| Period Price | Locked price for current period |
| WAC | Current weighted average cost |

**For Admins:**

- Click **+ New Item** to add products
- Click an item row to edit details
- Set period prices before closing periods

**Price Variance:**

- When delivery price differs from period price, an NCR is auto-generated
- This tracks unexpected price changes

---

### Deliveries

**Purpose:** Record goods received from suppliers

**How to Post a Delivery:**

1. Click **+ New Delivery**
2. Select the **Supplier**
3. Enter **Invoice Number** and **Delivery Note** reference
4. Add line items:
   - Select Item from catalog
   - Enter Quantity received
   - Enter Unit Price from invoice
5. Review the total
6. Click **Post Delivery**

**What Happens:**

- Stock quantity increases
- WAC is recalculated
- If price differs from period price, NCR is created
- Transaction appears in audit trail

**Example:**

```
Before: 50 KG chicken @ SAR 27.00 = SAR 1,350
Receive: 10 KG @ SAR 28.90 = SAR 289
After: 60 KG @ SAR 27.32 = SAR 1,639 (new WAC)
```

**Important Notes:**

- Verify quantities before posting
- Keep invoice/delivery note for reference
- Report problems via NCR, not by adjusting quantities

---

### Issues

**Purpose:** Record goods consumed by kitchen

**How to Post an Issue:**

1. Click **+ New Issue**
2. Select the **Date** (defaults to today)
3. Choose **Cost Center**: Food or Clean
4. Add line items:
   - Select Item
   - Enter Quantity used
5. Review the total value
6. Click **Post Issue**

**What Happens:**

- Stock quantity decreases
- Value calculated at current WAC
- Transaction logged in audit trail

**Example:**

```
Before: 60 KG chicken @ SAR 27.32
Issue: 8 KG @ SAR 27.32 = SAR 218.56
After: 52 KG @ SAR 27.32 (WAC unchanged)
```

**Important Rules:**

- Cannot issue more than available stock
- Cost center affects reporting categories
- Posted issues cannot be edited (contact supervisor)

---

### Transfers

**Purpose:** Move stock between locations

**Transfer Workflow:**

1. **Create Transfer** (Operator/Supervisor)
   - Select source and destination locations
   - Add items and quantities
   - Submit for approval

2. **Pending Approval**
   - Transfer awaits supervisor review
   - Status: PENDING_APPROVAL

3. **Approve Transfer** (Supervisor)
   - Review transfer details
   - Click **Approve** or **Reject**

4. **Complete Transfer**
   - Stock moves from source to destination
   - Both locations' stock levels update
   - Status: COMPLETED

**Important Notes:**

- Cannot transfer more than available stock
- WAC transfers with the goods
- Both locations must be accessible to complete

---

### Stock Levels

**Purpose:** View current inventory across locations

**What You See:**

- Item code and name
- Current quantity on hand
- Current WAC per unit
- Total value (Qty × WAC)
- Stock status indicators:
  - **Healthy**: Above reorder level
  - **Low**: Below reorder level
  - **Critical**: Near zero

**Actions:**

- Filter by category
- Search by item name/code
- Export to CSV

**Multi-Location View:**

- Switch locations to see different stock levels
- Compare stock across locations

---

### NCR (Non-Conformance Reports)

**Purpose:** Track problems with deliveries

**When to Create an NCR:**

- Items arrived damaged
- Quantity short from invoice
- Items expired or poor quality
- Price different from expected (auto-generated)

**NCR Types:**

- **Quality**: Damaged or poor quality items
- **Quantity**: Short shipments
- **Price Variance**: Unexpected price change (auto-generated)

**NCR Status Flow:**

```
OPEN → SENT_TO_SUPPLIER → CREDITED → CLOSED
                       └→ REJECTED → CLOSED
```

**How to Create:**

1. Click **+ New NCR**
2. Select the related Delivery
3. Choose affected line items
4. Enter reason and quantities affected
5. Submit NCR

**Resolution:**

- Supervisor updates status as supplier responds
- Credit value reduces consumption in reconciliation

---

### Reconciliation

**Purpose:** Calculate month-end consumption and costs

**The Formula:**

```
CONSUMPTION = Opening Stock
            + Receipts (deliveries)
            - Closing Stock (physical count)
            ± Adjustments
```

**Adjustment Fields:**
| Field | Description |
|-------|-------------|
| Back-charges | Costs charged back (reduces consumption) |
| Condemnations | Items written off (adds to consumption) |
| Credits Due | Supplier credits from NCRs (reduces consumption) |
| Others | Miscellaneous adjustments |

**Key Outputs:**

- **Total Consumption**: What was actually used
- **Manday Cost**: Consumption ÷ Total Mandays

**How to Complete:**

1. Enter physical count as **Closing Stock**
2. Enter any adjustments
3. Review calculated consumption
4. Mark as **Ready for Close**

---

### Periods

**Purpose:** Manage accounting periods

**Period Status:**

- **Open**: Current active period (transactions allowed)
- **Ready**: Location prepared for close
- **Closed**: Locked (read-only)

**Period Close Checklist:**

1. All deliveries posted
2. All issues posted
3. Physical count entered in reconciliation
4. All adjustments entered
5. All locations marked Ready

**How to Close (Admin only):**

1. Verify checklist is complete
2. Click **Close Period**
3. Confirm the action
4. System creates snapshot and opens next period

**Warning:** Period close cannot be undone. Review carefully before closing.

---

## Daily Workflows

### Morning Routine

1. **Check Dashboard**
   - Review overnight activity
   - Note any pending transfers

2. **Receive Deliveries**
   - Post each delivery as trucks arrive
   - Verify quantities against invoices
   - Create NCRs for any problems

### Throughout the Day

3. **Process Issues**
   - Post issues as kitchen requests items
   - Record the correct cost center

4. **Monitor Stock**
   - Check Stock Levels for low items
   - Plan orders as needed

### End of Day

5. **Review Activity**
   - Verify all transactions posted
   - Address any pending items

---

## Month-End Procedures

### Week Before Close

1. **Verify Transactions**
   - Ensure all deliveries posted
   - Ensure all issues posted
   - Follow up on pending NCRs

### Day Before Close

2. **Physical Count Preparation**
   - Print current stock list
   - Schedule count time
   - Assign counting teams

### Count Day

3. **Conduct Physical Count**
   - Count all inventory items
   - Record quantities accurately
   - Investigate discrepancies

4. **Enter Closing Stock**
   - Open Reconciliation page
   - Enter counted values
   - Note any variances

### Close Day

5. **Final Review**
   - Review consumption numbers
   - Enter any final adjustments
   - Verify manday cost is reasonable

6. **Period Close (Admin)**
   - Complete checklist
   - Close the period
   - Begin new period operations

---

## Multi-Location Operations

### Working with Multiple Locations

1. **Location Context**
   - All actions apply to your current location
   - Switch locations using the header dropdown

2. **Transfers Between Locations**
   - Initiate transfer from sending location
   - Receiver confirms when goods arrive
   - Stock moves atomically on approval

3. **Coordinated Period Close**
   - All locations must be Ready
   - Admin closes all locations simultaneously
   - Prevents discrepancies between locations

### Location-Specific Data

- Stock levels are per-location
- WAC is calculated per-location
- Deliveries post to receiving location
- Issues post from issuing location

---

## Troubleshooting

### Common Issues

**"Insufficient Stock" Error**

- You're trying to issue more than available
- Check Stock Levels for actual quantity
- Adjust issue quantity or post a delivery first

**"Period Closed" Error**

- The current period is locked
- Contact admin to confirm correct period
- Transactions must go in the next period

**"Location Access Denied"**

- You don't have permission for this location
- Contact admin to request access
- Switch to an assigned location

**"Price Variance Detected"**

- Delivery price differs from period price
- An NCR was automatically created
- Review with supervisor if unexpected

### Getting Help

- **Daily Operations**: Contact your supervisor
- **Technical Issues**: Contact system administrator
- **Training**: Request a walkthrough session

---

## Glossary

| Term               | Definition                                                                      |
| ------------------ | ------------------------------------------------------------------------------- |
| **WAC**            | Weighted Average Cost - the average cost per unit calculated from all purchases |
| **NCR**            | Non-Conformance Report - documents problems with deliveries                     |
| **Period**         | An accounting period, typically one month                                       |
| **Issue**          | Goods taken from stock for use (consumption)                                    |
| **Delivery**       | Goods received from suppliers                                                   |
| **Transfer**       | Movement of goods between locations                                             |
| **Reconciliation** | Month-end calculation comparing book vs. physical stock                         |
| **Manday**         | One person's daily food allocation                                              |
| **POB**            | People on Board - daily headcount for manday calculations                       |
| **Cost Center**    | Category for expense tracking (Food, Clean)                                     |

---

## Quick Tips

- **Post Daily**: Don't wait until month-end
- **Double-Check Quantities**: Especially for high-value items
- **Use NCRs**: Don't absorb supplier errors silently
- **Count Carefully**: Month-end accuracy depends on physical counts
- **Ask Questions**: Better to clarify than guess
- **Review Before Posting**: Transactions cannot be easily reversed

---

_For additional support, please contact your system administrator._

_Document Version: 1.0 | Stock Management System_
