# Roles & Permissions (1)

**Purpose:** Explain who can do what in the system. Simple and clear.

---

## Roles (MVP)

| **Role**   | **Main actions**                                                                                                    | **Cannot do**                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Operator   | Post Deliveries and Issues; view Stock Now; view **Dashboard**                                                      | Edit Items & Prices; Close Period; change Reconciliations |
| Supervisor | Everything Operator can do plus: edit Reconciliations (Back‑charges, Credits, Others, Condemnations); print/ export | Change Items & Prices; Close Period (unless granted)      |
| Admin      | Everything Supervisor can do plus: manage Items & Prices (create/edit), manage users/roles, **Close Period**        |                                                           |

> Tip: Keep roles few and clear. If approvals are not needed, keep it simple: everyone can post, only Admin can Close.

---

## Permissions matrix (detailed)

| **Feature**                  | **Operator** | **Supervisor** | **Admin** |
| ---------------------------- | ------------ | -------------- | --------- |
| Dashboard (view)             | ✔️           | ✔️             | ✔️        |
| POB (enter/edit)             | ✔️           | ✔️             | ✔️        |
| Items & Prices (create/edit) | —            | —              | ✔️        |
| Deliveries (post)            | ✔️           | ✔️             | ✔️        |
| Issues (post)                | ✔️           | ✔️             | ✔️        |
| NCR (create/update)          | ✔️           | ✔️             | ✔️        |
| Stock Now (view)             | ✔️           | ✔️             | ✔️        |
| Reconciliations (edit)       | —            | ✔️             | ✔️        |
| Period Close                 | —            | —              | ✔️        |
| User & Role management       | —            | —              | ✔️        |

---

## Approval options (optional, can be added later)

- **PRF/PO approvals**: Supervisor approves PRF; Admin (or Supervisor) creates PO.
- **Issues approvals**: off by default. If enabled, Supervisor reviews daily Issues before they appear in Reconciliations.
- **Reconciliations approvals**: Supervisor prepares; Admin approves for Close.
- **Period Close**: Admin only.

---

## Guardrails (apply to all roles)

- **No negative stock**: posting is blocked if it would take on‑hand below zero.
- **Dates**: you can post only inside the **open period**. Closed periods are read‑only.
- **Audit trail**: the system records who did what and when (Deliveries, Issues, NCR, Recs, Close).

---

## Data access (who sees what)

- All roles can **view**: Dashboard, Stock Now, posted Deliveries/Issues/NCR for the current period.
- **Reconciliations**: Operators can view totals; only Supervisor/Admin can change numbers.
- **Items & Prices**: Operators/Supervisors can view; only Admin can change.

---

## Future (post‑MVP)

- **Granular permissions**: per‑page or per‑action toggles (e.g., allow Supervisor to Close Period).
- **Location roles**: if multiple stores/areas are added, restrict actions by location.
- **Read‑only guest**: for auditors or finance reviewers.

---

<aside>
🔐

**Simple rule to remember:** Operators post; Supervisors review; Admins configure and close.

</aside>
