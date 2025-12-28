# POB (Personnel On Board) Feature - End-to-End Report

**Document Type:** Technical Feature Report
**Project:** Stock Management System
**Date:** December 18, 2025
**Status:** Analysis Complete

---

## 1. Executive Summary

POB (Personnel On Board) is a daily headcount tracking feature that records crew and extra personnel counts for each location within the Stock Management System. The primary purpose of POB is to calculate **Total Mandays**, which serves as the denominator for the critical **Manday Cost** calculation at period-end reconciliations.

**Key Formula:**

```
Manday Cost = Total Consumption ÷ Total Mandays
```

---

## 2. Feature Purpose & Business Value

### 2.1 What POB Does

- **Tracks daily headcount** at each location (Kitchen, Store, Central, Warehouse)
- **Records two count types:**
  - **Crew Count** – Regular staff meals
  - **Extra Count** – Guest or additional meals
- **Calculates Total Mandays** – Sum of all daily crew + extra counts for the period

### 2.2 Why POB Matters

- **Cost Control:** Enables management to understand per-person food cost
- **Period Reconciliation:** Mandays become the denominator for calculating consumption efficiency
- **Benchmarking:** Compare manday costs across locations and periods
- **Budgeting:** Forecast food costs based on expected headcount

### 2.3 Business Example

```
Period: November 2025
Total Consumption (Food + Clean): SAR 45,000
Total Mandays: 1,350 (45 days × 30 crew avg)

Manday Cost = SAR 45,000 ÷ 1,350 = SAR 33.33 per person/day
```

---

## 3. Data Model

### 3.1 POB Entity Schema (Prisma)

```prisma
model POB {
  id          String   @id @default(uuid())
  period_id   String   // Reference to Period
  location_id String   // Reference to Location
  date        DateTime // Specific date of entry
  crew_count  Int      @default(0)
  extra_count Int      @default(0)
  entered_by  String   // User who entered data
  entered_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  // Relations
  period      Period   @relation(...)
  location    Location @relation(...)
  enterer     User     @relation(...)

  @@unique([period_id, location_id, date]) // One entry per location per day
  @@index([period_id])
  @@index([location_id])
  @@index([date])
}
```

### 3.2 Key Constraints

| Constraint                | Description                                                           |
| ------------------------- | --------------------------------------------------------------------- |
| **Unique Composite Key**  | period_id + location_id + date ensures one entry per location per day |
| **Non-Negative Integers** | crew_count and extra_count must be ≥ 0                                |
| **Whole Numbers Only**    | Counts must be integers (no decimals)                                 |
| **Period Scope**          | Entries are tied to a specific accounting period                      |
| **Location Scope**        | Each entry belongs to a specific location                             |

---

## 4. User Interface

### 4.1 POB Entry Page (`/pob`)

**Page Components:**

1. **POBSummary** – Displays current period info and total mandays
2. **POBTable** – Inline editable table for daily entries

**Summary Card Shows:**

- Current Period name and date range
- Total Mandays (crew + extra sum)
- Breakdown: X crew + Y extra

**Table Columns:**

| Column      | Description                                                |
| ----------- | ---------------------------------------------------------- |
| Date        | Day of the week + formatted date (e.g., "Mon, 01/11/2025") |
| Crew Count  | Editable input field for regular staff                     |
| Extra Count | Editable input field for guests/extras                     |
| Total       | Auto-calculated (crew + extra)                             |

### 4.2 UI States

1. **Loading** – Spinner while fetching POB data
2. **No Location Selected** – Prompts user to select a location
3. **No Active Period** – Indicates no period is open
4. **Period Closed** – Read-only mode, editing disabled
5. **Normal Entry Mode** – Full editing capabilities

### 4.3 Auto-Save Feature

- POB entries are **automatically saved** when the user moves to the next field (on blur)
- Visual indicator shows saving status per row
- Success toast confirms save completion

---

## 5. API Endpoints

### 5.1 GET POB Data

```
GET /api/locations/{locationId}/pob
```

**Response:**

```json
{
  "location": { "id": "...", "code": "RYD-01", "name": "Riyadh Kitchen" },
  "period": { "id": "...", "name": "2025-11", "start_date": "...", "end_date": "..." },
  "entries": [
    {
      "id": "...",
      "date": "2025-11-01",
      "crew_count": 45,
      "extra_count": 3,
      "total_count": 48,
      "enterer": { "full_name": "Ahmed Hassan" },
      "entered_at": "..."
    }
  ],
  "summary": {
    "total_crew_count": 1350,
    "total_extra_count": 90,
    "total_mandays": 1440,
    "entries_count": 30
  }
}
```

### 5.2 POST/Update POB Entries

```
POST /api/locations/{locationId}/pob
```

**Request Body:**

```json
{
  "entries": [
    {
      "date": "2025-11-01",
      "crew_count": 45,
      "extra_count": 3
    }
  ]
}
```

### 5.3 PATCH Single POB Entry

```
PATCH /api/pob/{id}
```

**Request Body:**

```json
{
  "crew_count": 48,
  "extra_count": 5
}
```

---

## 6. Business Rules

### 6.1 Data Validation Rules

| Rule                    | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| **Non-Negative**        | crew_count ≥ 0, extra_count ≥ 0                      |
| **Integer Only**        | Must be whole numbers                                |
| **Period Must Be OPEN** | Cannot modify POB for closed periods                 |
| **Location Access**     | User must have POST or MANAGE access to the location |
| **One Entry Per Day**   | Unique constraint on (period + location + date)      |

### 6.2 Access Control

| Role           | Permissions                                |
| -------------- | ------------------------------------------ |
| **Operator**   | Enter/edit POB for assigned locations only |
| **Supervisor** | Enter/edit POB for all locations           |
| **Admin**      | Full access to all POB data                |

### 6.3 Period Lifecycle

```
Period OPEN → POB entries can be created/modified
Period CLOSED → POB entries are read-only
```

---

## 7. Integration with Other Features

### 7.1 Reconciliation Flow

```
POB Daily Entries → Total Mandays → Reconciliation → Manday Cost

Deliveries → Receipts ─┐
                       ├─→ Reconciliation → Manday Cost
Issues → Consumption ──┘
                       │
Total Mandays ─────────┘
```

### 7.2 Consumption Calculation

```
Consumption = Opening Stock
            + Receipts (deliveries)
            - Closing Stock (physical count)
            + Back-charges
            - Credits (from NCRs)
            + Others
            - Condemnations
```

### 7.3 Manday Cost Calculation

```typescript
// From reconciliations/consolidated.get.ts
const totalMandays = pobEntries.reduce(
  (sum, entry) => sum + entry.crew_count + entry.extra_count,
  0
);

const mandayCost = totalMandays > 0 ? consumption / totalMandays : null;
```

---

## 8. End-to-End User Flow

### 8.1 Daily Operations Flow

1. **User logs in** → Selects their assigned location
2. **Navigates to POB page** → Sees current period and entries
3. **Enters daily counts:**
   - Crew count (regular staff meals)
   - Extra count (guests, visitors, additional)
4. **Auto-save triggers** on blur → Entry saved to database
5. **Summary updates** → Total mandays recalculated

### 8.2 Period Flow

```
DAY 1 (Period Opens)
  └── POB entry begins for new period
  └── Empty table with all period dates

DAYS 1-28 (Daily Operations)
  └── Enter crew + extra counts daily
  └── Review running total mandays
  └── Correct any missed entries

DAYS 29-31 (Month-End)
  └── Ensure all POB entries are complete
  └── POB total feeds into Reconciliation
  └── Manday Cost calculated

PERIOD CLOSE
  └── POB entries become read-only
  └── Snapshot saved with period
  └── New period opens with fresh POB table
```

### 8.3 Data Flow Diagram

```
User Input
    │
    ▼
┌─────────────┐
│ POB Entry   │
│ crew_count  │
│ extra_count │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ POB Table       │
│ (per location)  │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│ Summary Calculation │
│ Total Mandays =     │
│ Σ(crew + extra)     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Reconciliation      │
│ Manday Cost =       │
│ Consumption/Mandays │
└─────────────────────┘
```

---

## 9. Technical Implementation Details

### 9.1 Frontend Components

| Component        | Location               | Purpose                       |
| ---------------- | ---------------------- | ----------------------------- |
| `pob.vue`        | `/app/pages/pob.vue`   | Main POB entry page           |
| `POBSummary.vue` | `/app/components/pob/` | Period info & mandays summary |
| `POBTable.vue`   | `/app/components/pob/` | Editable entry table          |

### 9.2 Key Frontend Logic

**Entry Initialization:**

- Generates all dates in the period
- Populates existing entries from API
- Creates empty entries for missing dates

**Auto-Save Logic:**

```typescript
function handleBlur(dateStr: string) {
  updateTotal(dateStr); // Recalculate total
  saveEntry(dateStr); // POST to API
}
```

### 9.3 Backend API Logic

**Permission Check:**

1. User must be authenticated
2. User must have location access (or be Supervisor/Admin)
3. Period must be OPEN for the location

**Update Logic:**

- Upsert pattern: Create if not exists, update if exists
- Tracks last modifier (entered_by)
- Timestamps automatically updated

---

## 10. Error Handling

### 10.1 Common Error Codes

| Code                       | HTTP | Description                           |
| -------------------------- | ---- | ------------------------------------- |
| `NOT_AUTHENTICATED`        | 401  | User not logged in                    |
| `LOCATION_ACCESS_DENIED`   | 403  | No access to location                 |
| `INSUFFICIENT_PERMISSIONS` | 403  | VIEW-only access, cannot edit         |
| `PERIOD_CLOSED`            | 400  | Period not open for editing           |
| `VALIDATION_ERROR`         | 400  | Invalid input (negative, non-integer) |
| `POB_NOT_FOUND`            | 404  | POB entry ID not found                |

### 10.2 UI Error States

- **API Not Ready** – Feature coming soon message
- **No Location** – Prompt to select location
- **No Period** – No active period available
- **Period Closed** – Warning that period is read-only

---

## 11. Reports & Analytics

### 11.1 POB Data in Reports

POB data appears in:

1. **Dashboard** – Total Mandays for current period
2. **Reconciliation Page** – Manday cost calculation
3. **Consolidated Reconciliation** – Cross-location totals
4. **Period Close Report** – Final mandays snapshot

### 11.2 Key Metrics

| Metric            | Formula                                |
| ----------------- | -------------------------------------- |
| **Total Mandays** | Σ(crew_count + extra_count) for period |
| **Daily Average** | Total Mandays ÷ Days in Period         |
| **Manday Cost**   | Total Consumption ÷ Total Mandays      |
| **Crew Ratio**    | crew_count ÷ total_count               |

---

## 12. Performance Considerations

### 12.1 Query Optimization

- **Indexed fields:** period_id, location_id, date
- **Composite index:** (period_id, location_id) for location queries
- **Single query:** Fetch all POB entries for period/location in one call

### 12.2 Response Time Targets

| Operation         | Target                |
| ----------------- | --------------------- |
| Load POB page     | < 500ms               |
| Save single entry | < 300ms               |
| Calculate summary | < 100ms (client-side) |

---

## 13. Future Enhancements

### 13.1 Planned Features (Post-MVP)

- **Bulk Import** – Import POB data from Excel/CSV
- **Copy Previous Day** – Quick-fill from yesterday's counts
- **Default Templates** – Preset crew counts per location
- **POB History** – View historical POB data across periods
- **Variance Alerts** – Notify if counts deviate significantly

### 13.2 Analytics Enhancements

- **Trend Charts** – Visualize mandays over time
- **Location Comparison** – Compare manday costs across sites
- **Forecasting** – Predict future mandays based on patterns

---

## 14. Testing Checklist

### 14.1 Functional Tests

- [ ] Can enter POB for assigned location
- [ ] Cannot enter POB for unauthorized location
- [ ] Cannot edit POB when period is closed
- [ ] Total count auto-calculates correctly
- [ ] Summary updates after save
- [ ] Manday cost calculates correctly in reconciliation

### 14.2 Validation Tests

- [ ] Rejects negative crew_count
- [ ] Rejects negative extra_count
- [ ] Rejects decimal values
- [ ] Accepts zero values
- [ ] Handles large numbers correctly

### 14.3 Edge Cases

- [ ] Empty period (no entries yet)
- [ ] All zeros (no personnel on board)
- [ ] Very large counts (1000+ per day)
- [ ] Mid-period location addition

---

## 15. Conclusion

POB is a foundational feature that enables accurate cost-per-person calculations in the Stock Management System. By tracking daily headcounts, the system can compute meaningful **Manday Cost** metrics that help management understand and control food costs across all locations.

**Key Takeaways:**

1. POB data is entered daily per location
2. Total Mandays = Sum of (crew + extra) for the period
3. Manday Cost = Consumption ÷ Total Mandays
4. POB entries are locked when period closes
5. Proper access control ensures data integrity

---

_Report generated from project documentation analysis_
_Stock Management System - December 2025_
