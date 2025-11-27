# Stock Management System - Frequently Asked Questions

**Version:** 1.0
**Last Updated:** November 2025

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Daily Operations](#daily-operations)
3. [Deliveries](#deliveries)
4. [Issues](#issues)
5. [Transfers](#transfers)
6. [Stock Management](#stock-management)
7. [NCRs (Non-Conformance Reports)](#ncrs-non-conformance-reports)
8. [Reconciliation](#reconciliation)
9. [Period Management](#period-management)
10. [Multi-Location](#multi-location)
11. [Troubleshooting](#troubleshooting)
12. [Technical Issues](#technical-issues)

---

## Getting Started

### Q: How do I log in for the first time?
**A:** Your administrator will provide your username and password. Navigate to the system URL, enter your credentials, and click Sign In. We recommend changing your password after first login.

### Q: I forgot my password. What do I do?
**A:** Contact your system administrator to reset your password. They can issue a new temporary password for you.

### Q: How do I know which location I'm working in?
**A:** Your current location is displayed in the header at the top of every page. Click on it to switch to a different assigned location.

### Q: Can I access the system from my phone?
**A:** Yes! The system is a Progressive Web App (PWA) that works on any device. You can even install it as an app on your phone or tablet for quick access.

### Q: What happens if I lose internet connection?
**A:** The system will display an "Offline" banner. You can view cached data but cannot post new transactions. Wait for your connection to restore before making changes.

---

## Daily Operations

### Q: What should I do first thing in the morning?
**A:** Check the Dashboard for an overview, then process any deliveries that arrived overnight or first thing in the morning.

### Q: How often should I post transactions?
**A:** Post transactions as they happen throughout the day. Don't wait until the end of the day or week - real-time posting keeps stock levels accurate.

### Q: Can I post a delivery and issue on the same item on the same day?
**A:** Yes, absolutely. Each transaction is processed independently and updates the stock level accordingly.

### Q: Who should I contact if something looks wrong?
**A:** Contact your supervisor for operational questions. For technical issues, contact your system administrator.

---

## Deliveries

### Q: How do I record a delivery?
**A:** Go to Deliveries → Click "+ New Delivery" → Select the supplier → Enter invoice number → Add line items with quantities and prices → Click "Post Delivery."

### Q: What if I don't have a Purchase Order (PO) number?
**A:** That's fine. You can post deliveries without linking them to a PO. Just enter the supplier and invoice details directly.

### Q: What if the delivery price is different from what we expected?
**A:** Post the actual price from the invoice. The system will automatically create an NCR (Non-Conformance Report) if the price differs from the locked period price.

### Q: Can I edit a delivery after posting?
**A:** No, posted deliveries cannot be edited directly. If you made an error, contact your supervisor. They may need to create a reversal entry or adjustment.

### Q: What if only part of my order arrived?
**A:** Post what actually arrived with the correct quantities. Create an NCR for the shortage to track it and potentially claim credit from the supplier.

### Q: The delivery includes items not in the system. What do I do?
**A:** Contact your Admin to add the new item to the Items & Prices catalog. Once added, you can include it in the delivery.

---

## Issues

### Q: What's the difference between Food and Clean cost centers?
**A:** "Food" is for items consumed in food preparation. "Clean" is for cleaning supplies and non-food consumables. This separation helps with reporting and cost tracking.

### Q: Why can't I issue more than what's on hand?
**A:** The system prevents negative stock to maintain accurate inventory records. Check Stock Levels for available quantity. If stock is lower than expected, verify recent transactions or report the discrepancy.

### Q: Can I issue items for a date in the past?
**A:** You can select a different date within the current open period. However, you cannot post to closed periods.

### Q: What if the kitchen used more than we thought?
**A:** Post the actual quantity used. This will be reflected in month-end reconciliation. Discrepancies between book and physical stock are normal and captured during the physical count.

### Q: Can I reverse an issue if I made a mistake?
**A:** Posted issues cannot be directly reversed. Contact your supervisor to discuss options, which may include adjusting through reconciliation or posting a corrective delivery.

---

## Transfers

### Q: How do I request items from another location?
**A:** Create a transfer request from your location specifying what you need. The transfer will go to the sending location for approval.

### Q: Why does my transfer say "Pending Approval"?
**A:** All transfers require supervisor approval before execution. Wait for your supervisor or the receiving location's supervisor to review and approve.

### Q: What happens when a transfer is approved?
**A:** The stock is automatically moved from the source location to the destination. Both locations' stock levels update immediately.

### Q: Can I cancel a transfer?
**A:** You can cancel transfers that are still in DRAFT status. Once submitted for approval, contact a supervisor to reject it if needed.

### Q: Why was my transfer rejected?
**A:** Common reasons include insufficient stock at the source location, incorrect quantities, or business reasons. Check the rejection notes or contact the supervisor.

---

## Stock Management

### Q: How is the item cost calculated?
**A:** The system uses Weighted Average Cost (WAC). Each delivery recalculates the average cost based on existing stock and new receipts. Issues use the current WAC but don't change it.

### Q: Why is my stock level different from what I physically see?
**A:** Discrepancies can occur due to unposted transactions, counting errors, theft, damage, or data entry mistakes. Conduct a physical count and note variances in reconciliation.

### Q: How do I see stock at another location?
**A:** Use the Location Switcher in the header to change your active location (if you have access), then view Stock Levels.

### Q: What do the stock status colors mean?
- **Green (Healthy):** Stock is above the reorder level
- **Yellow (Low):** Stock is below the reorder level but not critical
- **Red (Critical):** Stock is very low or nearly zero

### Q: Can I add new items to the catalog?
**A:** Only Admins can add items. Contact your administrator with the item details (code, name, unit, category, price).

---

## NCRs (Non-Conformance Reports)

### Q: When should I create an NCR?
**A:** Create an NCR when:
- Delivered items are damaged
- Quantities are short from the invoice
- Items are expired or poor quality
- Received wrong items

### Q: The system automatically created an NCR. Why?
**A:** Automatic NCRs are created when the delivery price differs from the period's locked price. This tracks price variances for review.

### Q: What does each NCR status mean?
- **Open:** NCR created, awaiting action
- **Sent to Supplier:** Claim submitted to supplier
- **Credited:** Supplier issued credit
- **Rejected:** Supplier denied claim
- **Closed:** NCR resolved and closed

### Q: How do NCR credits affect my numbers?
**A:** Credited amounts reduce your consumption in the reconciliation, so you don't pay for supplier problems.

---

## Reconciliation

### Q: What is reconciliation?
**A:** Reconciliation is the month-end process of comparing book inventory to physical inventory and calculating actual consumption.

### Q: How do I enter my physical count?
**A:** Go to Reconciliation, find each item, and enter the counted quantity as the Closing Stock value.

### Q: What are the adjustment fields for?
- **Back-charges:** Costs charged back to departments
- **Condemnations:** Items written off (spoilage, damage)
- **Credits Due:** Expected credits from NCRs
- **Others:** Any other adjustments

### Q: What if my book stock and physical stock don't match?
**A:** Enter the actual physical count. The difference becomes part of your consumption variance. Investigate large variances.

### Q: How is Manday Cost calculated?
**A:** Manday Cost = Total Consumption ÷ Total Mandays. This shows the average food cost per person per day.

---

## Period Management

### Q: What is a period?
**A:** A period is an accounting timeframe (usually one month) during which transactions are recorded. Each period has an opening balance, transactions, and closing balance.

### Q: Why can't I post to last month?
**A:** The previous period is closed and locked. All transactions must go into the current open period. This ensures historical data integrity.

### Q: What does "Period Closed" mean?
**A:** A closed period is read-only. No new transactions can be posted, and existing data cannot be changed. This preserves the audit trail.

### Q: Can a closed period be reopened?
**A:** No. Closed periods cannot be reopened. Any corrections must be made as adjustments in the next open period.

### Q: What happens when the period closes?
1. All data is locked (read-only)
2. A snapshot is saved for records
3. Closing stock becomes next period's opening stock
4. A new period opens automatically

---

## Multi-Location

### Q: How do I switch between locations?
**A:** Click the location name in the header and select a different location from your assigned list.

### Q: Can I see stock at all locations at once?
**A:** You can view one location at a time. Switch between locations to compare stock levels.

### Q: Why do different locations have different costs for the same item?
**A:** Each location calculates its own WAC based on the deliveries received at that location. Transfer costs are based on the source location's WAC.

### Q: How does period close work with multiple locations?
**A:** All locations must be marked "Ready" before an Admin can close the period. This ensures all locations are reconciled together.

---

## Troubleshooting

### Q: The page won't load or is very slow.
**A:** Try refreshing the page. Check your internet connection. Clear your browser cache if problems persist. Contact IT if the issue continues.

### Q: I can't find an item in the list.
**A:** Use the search box to filter items. Check if you're in the correct location. The item may not be set up - contact your Admin.

### Q: My changes aren't saving.
**A:** Ensure you're clicking the Save or Post button. Check for error messages. Verify you're online. Try refreshing and re-entering.

### Q: I'm getting "Access Denied" errors.
**A:** You may not have permission for that action or location. Check with your supervisor about your role and assigned locations.

### Q: The numbers don't look right.
**A:** Double-check recent transactions. Verify you're in the correct period and location. Contact your supervisor if discrepancies persist.

### Q: I accidentally posted the wrong quantity.
**A:** Contact your supervisor immediately. Depending on the situation, they can help correct it through adjustments or coordinate with Admin.

---

## Technical Issues

### Q: How do I install the app on my device?
**A:** Look for "Install" or "Add to Home Screen" in your browser menu. On Chrome, click the install icon in the address bar.

### Q: The app shows "Offline" but I have internet.
**A:** Try refreshing the page. Check if other websites work. The server may be temporarily unavailable - try again in a few minutes.

### Q: My session expired. What happened?
**A:** For security, sessions expire after inactivity. Simply log in again to continue. Your unsaved work may be lost - always save before leaving.

### Q: The screen looks wrong on my device.
**A:** Try rotating your device or adjusting zoom level. The system works best in landscape mode on tablets and portrait on phones.

### Q: How do I report a bug?
**A:** Contact your system administrator with:
- What you were trying to do
- What happened instead
- Any error messages
- Screenshots if possible

---

## Still Have Questions?

If your question isn't answered here:

1. **Check the User Manual** for detailed instructions
2. **Ask your Supervisor** for operational guidance
3. **Contact IT/Admin** for technical issues
4. **Request Training** for comprehensive help

---

*Stock Management System v1.0 | FAQ Document*
