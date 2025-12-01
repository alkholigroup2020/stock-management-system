# Screen List & Wireframe (1)

**Purpose:** A detailed but simple guide to all screens we plan to build, with quick wireframes and how users move between them.

> Language kept simple. Mermaid used for maps and flows.

---

## 1) App map (all screens)

```mermaid
flowchart LR
  DB[Dashboard]
  POB[POB]
  IP["Items & Prices"]
  ORD["Orders (PRF to PO)"]
  DEL["Deliveries & Invoices"]
  ISS["Issues (Food/Clean)"]
  NCR[NCR]
  SN[Stock Now]
  RECS[Reconciliations]
  CLOSE[Period Close]

  DB --> POB
  DB --> IP
  DB --> ORD
  DB --> DEL
  DB --> ISS
  DB --> NCR
  DB --> SN
  DB --> RECS
  DB --> CLOSE
```

---

## 2) Wireflow (how a typical day works)

```mermaid
flowchart TB
  A[Open Period] --> B[Receive Delivery]
  B --> C["Stock updates (WAC, On-hand)"]
  C --> D[Post Issues to Food/Clean]
  D --> E[Check Dashboard / Stock Now]
  E --> F[Enter POB]
  F --> G[Reconciliations update]
  G --> H{Month end?}
  H -- Yes --> I[Period Close]
  H -- No --> B
```

---

## 3) Screen list with wireframes

### 3.1 Dashboard

**Goal:** quick monthly status.

**Key parts:** tiles (Receipts, Issues, Mandays, Days left), recent deliveries/issues.

**Wireframe (ASCII):**

```
[Receipts]  [Issues]  [Mandays]  [Days left]
--------------------------------------------
Recent Deliveries    |  Recent Issues
R-1007  SAR 3,960    |  I-3041  SAR 720
R-1006  SAR 1,280    |  I-3040  SAR 410
```

**Notes:** read-only. Links jump to detail screens.

---

### 3.2 POB (People on Board)

**Goal:** record daily headcount for manday cost.

**Wireframe:**

```
Date        Crew   Extra   Total
2025-10-20   60     12      72
2025-10-21   62     10      72
[Save]
```

**Validation:** numbers only.

---

### 3.3 Items & Prices (Item Master)

**Goal:** manage item list; view onâ€‘hand & cost.

**Wireframe:**

```
Code      Name                 Unit  Cat   WAC    Onâ€‘hand
RICE-5KG  Rice 5kg             KG    DRY   6.40   120
CHK-1KG   Chicken Breast 1kg   KG    CHILL 18.90  55
[Add item]
```

**Rules:** WAC & Onâ€‘hand update via Deliveries/Issues; Admin edits the rest.

---

### 3.4 Orders (PRF â†’ PO) _optional in MVP_

**Goal:** request â†’ approve â†’ create PO.

**Wireframe:**

```
PRF Lines
Item                Qty
Rice 5kg            10
[Add line]  [Approve]  [Create PO]
```

**Status:** PRF Draft â†’ Approved â†’ PO Created.

---

### 3.5 Deliveries & Invoices

**Goal:** add stock + record invoice.

**Wireframe:**

```
Supplier [FreshCo]  PO [ â€” ]  Invoice [INV-001]  Note [DN-13]  Date [2025â€‘10â€‘21]

Item                Price    Qty     Line Value
Rice 5kg            6.40     10      64.00
Chicken 1kg         18.90    5       94.50
---------------------------------------------
Total: 158.50                [Add line]   [Post delivery]
```

**On post:** onâ€‘hand â†‘; WAC recalculated; receipt saved.

---

### 3.6 Issues (Food/Clean)

**Goal:** record daily usage.

**Wireframe:**

```
Date [2025â€‘10â€‘21]  Cost centre [FOOD]

Item                Onâ€‘hand   Qty to issue   Value
Rice 5kg            120       5              32.00
-----------------------------------------------
[Add line]                     [Post Issue]
```

**Rule:** no negative stock.

---

### 3.7 NCR (Nonâ€‘Conformance Report)

**Goal:** log damaged/short items and track credit.

**Wireframe:**

```
Receipt [R-1007]  Line # [0]  Reason [Damaged]  Qty [1]  Value [18.90]
[Create NCR]

NCRs
NCR-101  Damaged  Credited  SAR 18.90
```

---

### 3.8 Stock Now

**Goal:** live valuation.

**Wireframe:**

```
Item                Unit   Onâ€‘hand  WAC     Value
Rice 5kg            KG     120      6.40    768.00
Chicken 1kg         KG     55       18.90   1,039.50
-----------------------------------------------
Total valuation: SAR 1,807.50
```

---

### 3.9 Reconciliations

**Goal:** compute Consumption and Manday cost.

**Wireframe:**

```
Back-charges [   ]   Condemnations [   ]   Credits Due [   ]   Others [   ]
Closing stock value [   ]

Consumption: SAR  XX,XXX      Manday cost: SAR  XX.XX
[Save]
```

**Formula:** Opening + Receipts âˆ’ Closing + Back-charges âˆ’ Credits + Others âˆ’ Condemnations.

---

### 3.10 Period Close

**Goal:** lock period; snapshot; roll forward.

**Wireframe:**

```
[ ] All deliveries are posted
[ ] All issues are posted
[ ] Reconciliations completed

[ Close Period ]
```

---

## 4) Navigation patterns (micro)

- Keep actions clear: **Post delivery**, **Post Issue**, **Close Period**.
- Show totals near the action buttons.
- Use table inputs with sensible widths; show validation inline.

---

## 5) Component Styles & Design System

**Complete design system documentation:** See `project-docs/UI_DESIGN_GUIDE.md`

**Quick Reference:**

- **Card**: Elevated white box with navy headings - Use `.card-elevated` class
- **Pill/Badge**: Small rounded labels - Use `.badge-*` classes (e.g., `.badge-primary`, `.badge-success`)
- **Input**: Consistent form inputs - Use `.form-input` class
- **Primary button**: Navy filled - `<UButton color="primary">`
- **Secondary button**: Emerald - `<UButton color="secondary">`
- **Colors**: Navy Blue (#000046) for primary, Emerald Green (#45cf7b) for success

---

## 6) Accessibility & simplicity

- Clear labels; no jargon (Food, Clean, Delivery, Issue).
- Keyboard friendly (tab between fields).
- Error messages in plain words (e.g., "Qty exceeds onâ€‘hand").

---

## 7) Open items (to confirm)

- Exact wording on tiles and buttons (EN/AR if needed).
- Whether Orders (PRFâ†’PO) is visible in MVP nav.
- Print layout style (legacy vs modern).
