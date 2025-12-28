# Operator Quick Reference Guide

**Stock Management System**

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Deliveries](#deliveries)
3. [Issues (Stock Usage)](#issues-stock-usage)
4. [Stock Viewing](#stock-viewing)
5. [POB Entry](#pob-entry)
6. [NCR (Non-Conformance Reports)](#ncr-non-conformance-reports)
7. [Profile Management](#profile-management)
8. [Quick Reference Card](#quick-reference-card)

---

## Getting Started

### Logging In

1. Open your web browser and go to the Stock Management System URL
2. Enter your **Username** or **Email**
3. Enter your **Password**
4. Click **Sign In**

> **Tip:** Check "Remember me" if you're using a personal device to stay logged in.

### Understanding the Dashboard

When you log in, you'll see the **Dashboard** with:

- **Welcome message** showing your name and active location
- **Key metrics** - Total stock value, low stock items, pending items
- **Quick actions** - Buttons to create new deliveries, issues, or transfers
- **Recent activity** - Latest transactions at your location

### Switching Locations

If you have access to multiple locations:

1. Look at the top navigation bar
2. Find the **Location Switcher** dropdown (shows your current location)
3. Click to open the dropdown
4. Select a different location
5. The page will refresh with data for the new location

> **Important:** All transactions you create will be recorded at your currently selected location.

### Understanding the Period Indicator

In the top navigation, you'll see the **Period Indicator** showing:

- **Period name** (e.g., "January 2025")
- **Status badge** (OPEN, PENDING_CLOSE, or CLOSED)

> **Note:** You can only post transactions when the period status is **OPEN**.

---

## Deliveries

Deliveries record stock received from suppliers. When you post a delivery, the system increases your location's stock and updates item costs.

### Creating a New Delivery

1. Click **Deliveries** in the left menu
2. Click the **New Delivery** button
3. Fill in the delivery header:
   - **Supplier** - Select from the dropdown
   - **Invoice Number** - Enter the supplier's invoice number
   - **Delivery Date** - Select the date received
4. Add line items (see below)
5. Click **Post Delivery** to finalize, or **Save as Draft** to complete later

### Adding Items to a Delivery

1. Click **Add Item** in the line items section
2. For each item:
   - **Item** - Search and select the item
   - **Quantity** - Enter the amount received
   - **Unit Price** - Enter the cost per unit (SAR)
3. The system automatically calculates the **Line Total**
4. Repeat for all items on the invoice

### Understanding Price Variance Warnings

If the price you enter differs from the expected **Period Price**, you'll see a warning:

> **Price Variance Detected:** The entered price differs from the locked period price.

This means:
- An NCR (Non-Conformance Report) will be automatically created
- The supplier will need to be notified about the price difference
- You can still post the delivery

### Saving vs Posting

| Action | What Happens |
|--------|--------------|
| **Save as Draft** | Delivery is saved but not finalized. You can edit it later. Stock is NOT updated. |
| **Post Delivery** | Delivery is finalized and locked. Stock IS updated. Cannot be edited. |

### Viewing Delivery History

1. Click **Deliveries** in the left menu
2. Use filters to narrow results:
   - **Date range** - Select start and end dates
   - **Supplier** - Filter by specific supplier
   - **Status** - Show only Draft or Posted
3. Click any row to view delivery details

---

## Issues (Stock Usage)

Issues record stock taken out of inventory for use (cooking, production, etc.).

### Creating a New Issue

1. Click **Issues** in the left menu
2. Click the **New Issue** button
3. Fill in the issue header:
   - **Issue Date** - Select the date
   - **Cost Centre** - Select where the stock is being used (e.g., Kitchen, Restaurant)
4. Add items (see below)
5. Click **Post Issue** to finalize

### Adding Items to an Issue

1. Click **Add Item**
2. For each item:
   - **Item** - Search and select the item
   - **Quantity** - Enter the amount being used
3. The system shows:
   - **Available Stock** - How much you have
   - **Unit Value** - Current cost (WAC)
   - **Line Total** - Calculated value

### Understanding Stock Availability

> **Cannot issue more than available stock**

If you try to enter a quantity greater than what's available, you'll see a warning:

- The quantity field will show an error
- You cannot post until the quantity is reduced
- Check your stock levels before creating issues

### Viewing Issue History

1. Click **Issues** in the left menu
2. Use filters:
   - **Date range**
   - **Cost Centre**
   - **Status**
3. Click any row to view issue details

---

## Stock Viewing

### Viewing Current Stock at Your Location

1. Click **Stock Now** in the left menu
2. You'll see a table showing:
   - **Item Code** and **Name**
   - **Quantity On Hand**
   - **Unit Value** (WAC - Weighted Average Cost)
   - **Total Value** (Quantity x Unit Value)

### Searching and Filtering

- **Search box** - Type item name or code to find specific items
- **Category filter** - Show only items in a specific category
- **Low stock toggle** - Show only items below minimum levels

### Understanding Stock Values

| Term | Meaning |
|------|---------|
| **On Hand** | Physical quantity available at your location |
| **WAC** | Weighted Average Cost - the average cost of the item |
| **Total Value** | On Hand x WAC = Total worth of that item |

> **Note:** Stock values are in SAR (Saudi Riyal).

---

## POB Entry

POB (Personnel On Board) tracks daily crew counts for calculating consumption per person.

### Entering Daily Crew Counts

1. Click **POB** in the left menu
2. You'll see a calendar view for the current period
3. For each day, enter:
   - **Crew Count** - Regular personnel
   - **Extra Count** - Temporary or additional staff
4. The **Total** is calculated automatically (Crew + Extra)

### Understanding Auto-Save

> **Your entries save automatically** when you move to the next field.

- No need to click a save button
- A green checkmark appears when saved
- If you see a red indicator, check your internet connection

### Viewing Period Totals

At the top of the POB page, you'll see summary cards:

- **Total Crew** - Sum of all crew counts for the period
- **Total Extra** - Sum of all extra counts
- **Total Mandays** - Combined total for consumption calculations

---

## NCR (Non-Conformance Reports)

NCRs track quality issues and price discrepancies with suppliers.

### Viewing NCRs

1. Click **NCR** in the left menu
2. You'll see a list of NCRs for your location
3. Each NCR shows:
   - **NCR Number**
   - **Type** - MANUAL or PRICE_VARIANCE
   - **Supplier**
   - **Value** (SAR)
   - **Status** - OPEN, SENT, CREDITED, RESOLVED

### Understanding Auto-Generated NCRs

When you post a delivery with a price different from the period price:

- The system automatically creates an NCR
- Type is marked as **PRICE_VARIANCE**
- Shows "Auto-generated" badge
- Links back to the original delivery

> **Note:** As an Operator, you can view NCRs but cannot create manual NCRs. Contact your Supervisor to create manual NCRs for quality issues.

---

## Profile Management

### Viewing Your Profile

1. Click your **name** or **avatar** in the top right corner
2. Select **Profile**
3. You'll see:
   - Your full name and username
   - Email address
   - Role (Operator)
   - Assigned locations

### Changing Your Password

1. Go to your **Profile**
2. Scroll to the **Change Password** section
3. Enter your **Current Password**
4. Enter your **New Password**
5. Enter **Confirm New Password**
6. Click **Update Password**

**Password Requirements:**
- At least 8 characters
- Include uppercase letter (A-Z)
- Include lowercase letter (a-z)
- Include number (0-9)
- Include special character (@$!%*?&)

---

## Quick Reference Card

### Key Shortcuts

| Action | Navigation |
|--------|------------|
| Dashboard | Click logo or "Dashboard" |
| New Delivery | Deliveries > New Delivery |
| New Issue | Issues > New Issue |
| View Stock | Stock Now |
| Enter POB | POB |
| View NCRs | NCR |
| My Profile | Click name > Profile |

### Important Rules to Remember

1. **Always check your location** before creating transactions
2. **Cannot issue more than available** - Check stock first
3. **Period must be OPEN** to post transactions
4. **Price variances create NCRs** - This is automatic and normal
5. **Drafts don't update stock** - Only posted deliveries count

### Getting Help

If you encounter problems:
1. Check that you're at the correct location
2. Check that the period is OPEN
3. Check your internet connection
4. Contact your Supervisor for assistance

---

*Document Version: 1.0 | Last Updated: December 2025*
