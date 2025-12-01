# Stock Management System - Quick Reference Card

**Keep this guide handy for daily operations**

---

## Key Actions at a Glance

| Action              | Steps                                                       |
| ------------------- | ----------------------------------------------------------- |
| **Post Delivery**   | Deliveries → + New → Select Supplier → Add Items → Post     |
| **Post Issue**      | Issues → + New → Select Cost Center → Add Items → Post      |
| **Create Transfer** | Transfers → + New → Select Destination → Add Items → Submit |
| **Check Stock**     | Stock Levels → Select Location → View/Search                |
| **Create NCR**      | NCR → + New → Select Delivery → Enter Details → Submit      |
| **Switch Location** | Click location name in header → Select new location         |

---

## Important Rules

| Rule                  | Why It Matters                                              |
| --------------------- | ----------------------------------------------------------- |
| **No Negative Stock** | System blocks issues/transfers exceeding available quantity |
| **Post Daily**        | Don't wait for month-end; keep records current              |
| **Period Locking**    | Closed periods cannot be edited - double-check before close |
| **WAC Updates**       | Only deliveries recalculate cost; issues use current cost   |
| **NCR Everything**    | Report all delivery problems; don't absorb supplier errors  |
| **Physical Count**    | Month-end accuracy depends on careful counting              |

---

## Document Status Workflow

**Transfers:**

```
DRAFT → PENDING_APPROVAL → APPROVED → COMPLETED
                        └→ REJECTED
```

**NCRs:**

```
OPEN → SENT_TO_SUPPLIER → CREDITED → CLOSED
                       └→ REJECTED → CLOSED
```

**Periods:**

```
OPEN → READY → CLOSED
```

---

## Role Permissions Summary

| Feature                | Operator | Supervisor | Admin |
| ---------------------- | :------: | :--------: | :---: |
| Post Deliveries/Issues |    X     |     X      |   X   |
| View Stock Levels      |    X     |     X      |   X   |
| Create NCRs            |    X     |     X      |   X   |
| Approve Transfers      |    -     |     X      |   X   |
| Edit Reconciliation    |    -     |     X      |   X   |
| Manage Items           |    -     |     -      |   X   |
| Close Period           |    -     |     -      |   X   |

---

## Month-End Checklist

1. [ ] All deliveries posted
2. [ ] All issues posted
3. [ ] Pending NCRs resolved
4. [ ] Physical count completed
5. [ ] Closing stock entered in Reconciliation
6. [ ] Adjustments entered (back-charges, credits)
7. [ ] Consumption numbers reviewed
8. [ ] All locations marked Ready
9. [ ] Period Close (Admin only)

---

## Common Error Messages

| Error                    | Solution                                                   |
| ------------------------ | ---------------------------------------------------------- |
| "Insufficient Stock"     | Check stock levels; reduce quantity or post delivery first |
| "Period Closed"          | Contact admin; post to next period instead                 |
| "Location Access Denied" | Switch to assigned location or request access              |
| "Price Variance"         | NCR auto-created; review with supervisor                   |
| "Pending Approval"       | Wait for supervisor to approve transfer                    |

---

## Keyboard Shortcuts

| Key      | Action                       |
| -------- | ---------------------------- |
| `Tab`    | Move to next field           |
| `Enter`  | Submit form / Confirm action |
| `Esc`    | Cancel / Close modal         |
| `Ctrl+F` | Search on current page       |

---

## WAC Calculation Quick Reference

**Formula:**

```
New WAC = (Current Qty × Current WAC + Received Qty × Receipt Price)
          ÷ (Current Qty + Received Qty)
```

**Example:**

- Current: 50 KG @ SAR 27.00 = SAR 1,350
- Received: 10 KG @ SAR 28.90 = SAR 289
- New: 60 KG @ **SAR 27.32** = SAR 1,639

---

## Reconciliation Formula

```
CONSUMPTION = Opening Stock
            + Receipts
            - Closing Stock
            + Condemnations
            - Back-charges
            - Credits Due
            ± Others
```

**Manday Cost** = Consumption ÷ Total Mandays

---

## Support Contacts

| Issue Type                | Contact                |
| ------------------------- | ---------------------- |
| Daily Operations          | Your Supervisor        |
| System Access / Technical | IT Administrator       |
| Training / Refresher      | Request via Supervisor |
| Data Corrections          | Admin Team             |

**System URL:** [Your organization's URL]

**Emergency Contact:** [Emergency support contact]

---

## Remember

> **Add stock when trucks arrive.**
> **Subtract stock when kitchen uses it.**
> **Close the month with a simple checklist.**

---

_Stock Management System v1.0 | Quick Reference Card_
