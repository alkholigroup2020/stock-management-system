# Phase 1.2: Database Setup
## Stock Management System - Development Guide

**For Junior Developers**
**Last Updated:** November 8, 2025
**Phase Status:** ✅ Complete

---

## 📖 Quick Navigation

- [Phase 1.1: Project Foundation](phase-1.1-foundation.md)
- [Phase 1.2: Database Setup](phase-1.2-database.md) ← You are here
- [Phase 1.3: Authentication & Security](phase-1.3-authentication.md)

---

## Phase 1.2: Database Setup

### What We Did

In this phase, we **created the database** where all our data lives (users, items, stock levels, transactions).

### Database Architecture Overview

```mermaid
erDiagram
    USER ||--o{ USER_LOCATION : "has access to"
    LOCATION ||--o{ USER_LOCATION : "grants access"
    LOCATION ||--o{ LOCATION_STOCK : "maintains"
    ITEM ||--o{ LOCATION_STOCK : "stored at"
    ITEM ||--o{ ITEM_PRICE : "priced per period"
    PERIOD ||--o{ ITEM_PRICE : "locks prices"
    PERIOD ||--o{ PERIOD_LOCATION : "tracks status"
    LOCATION ||--o{ PERIOD_LOCATION : "has status"
    LOCATION ||--o{ DELIVERY : "receives"
    DELIVERY ||--o{ DELIVERY_LINE : "contains"
    ITEM ||--o{ DELIVERY_LINE : "delivered"
    LOCATION ||--o{ ISSUE : "issues from"
    ISSUE ||--o{ ISSUE_LINE : "contains"
    LOCATION ||--o{ TRANSFER : "sends from"
    LOCATION ||--o{ TRANSFER : "receives to"
    TRANSFER ||--o{ TRANSFER_LINE : "contains"
    LOCATION ||--o{ NCR : "reports"
    PERIOD ||--o{ RECONCILIATION : "calculates"
```

### Tasks Completed

#### 1.2.1: Supabase Setup ✅

**Simple Explanation:**
We created a **cloud database** on Supabase (like renting storage space online).

**What Was Done:**
- Created Supabase account and project
- Set database region close to Saudi Arabia
- Got connection credentials (URL, keys)
- Updated `.env` file with credentials
- Enabled daily backups

**Connection Details:**
```bash
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_KEY="eyJhbGc..."
```

---

#### 1.2.2: Prisma Setup ✅

**Simple Explanation:**
We set up **Prisma** - a tool that makes it easy to talk to the database using TypeScript code instead of SQL.

**What Was Done:**
- Installed Prisma packages
- Created `prisma/schema.prisma` file
- Set up database connection
- Created health check API endpoint
- Fixed connection issue (switched to Session pooler)

**Important Files:**
```
prisma/
  schema.prisma         # Database structure definition
server/
  utils/
    prisma.ts          # Database client
  api/
    health.get.ts      # Health check endpoint
```

**How Prisma Works:**

```mermaid
graph LR
    A[Your Code<br/>TypeScript] -->|Uses| B[Prisma Client]
    B -->|Generates| C[SQL Queries]
    C -->|Sends to| D[PostgreSQL<br/>Database]
    D -->|Returns| E[Data]
    E -->|Typed Results| A

    style A fill:#e1f5ff
    style B fill:#4fc3f7
    style C fill:#29b6f6
    style D fill:#0277bd
    style E fill:#4fc3f7
```

**Example Usage:**
```typescript
// Instead of SQL:
// SELECT * FROM users WHERE email = 'test@example.com'

// We write:
const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' }
})
```

---

#### 1.2.3: Prisma Schema - Core Entities ✅

**Simple Explanation:**
We defined the **main tables** for users, locations, items, and suppliers.

**What Was Done:**
- Created 5 core models (tables)
- Created 4 enums (fixed lists of values)
- Set up relationships between tables
- Added indexes for fast queries

**Models Created:**

##### 1. User Model

```typescript
model User {
  id                  String   // Unique ID (UUID)
  username            String   // Login name (unique)
  email               String   // Email address (unique)
  password_hash       String   // Encrypted password
  full_name           String   // Display name
  role                UserRole // OPERATOR, SUPERVISOR, or ADMIN
  default_location_id String?  // Their main location
  is_active           Boolean  // Can they log in?
  created_at          DateTime // When created
  last_login          DateTime? // Last login time
}
```

**User Roles:**
- **OPERATOR**: Can post deliveries/issues, view stock
- **SUPERVISOR**: Can approve transfers, manage reconciliations
- **ADMIN**: Full access to everything

##### 2. Location Model

```typescript
model Location {
  id         String       // Unique ID
  code       String       // Short code (MAIN-KIT)
  name       String       // Display name
  type       LocationType // KITCHEN, STORE, CENTRAL, WAREHOUSE
  address    String?      // Physical address
  manager_id String?      // Who manages this location
  timezone   String       // Default: Asia/Riyadh
  is_active  Boolean      // Is it operational?
}
```

**Location Types:**
- **KITCHEN**: Food preparation area
- **STORE**: Central storage
- **CENTRAL**: Main depot
- **WAREHOUSE**: Long-term storage

##### 3. UserLocation Model (Join Table)

```typescript
model UserLocation {
  user_id      String      // Which user
  location_id  String      // Which location
  access_level AccessLevel // VIEW, POST, or MANAGE
  assigned_at  DateTime    // When granted
  assigned_by  String?     // Who granted it
}
```

**Access Levels:**
- **VIEW**: Can only view data
- **POST**: Can create transactions
- **MANAGE**: Full control

##### 4. Item Model

```typescript
model Item {
  id           String  // Unique ID
  code         String  // Item code (DAIRY-001)
  name         String  // Item name
  unit         Unit    // KG, LTR, EA, BOX, CASE, PACK
  category     String  // Dairy, Vegetables, Meat
  sub_category String? // Fresh Milk, Frozen, etc.
  is_active    Boolean // Still in use?
}
```

##### 5. Supplier Model

```typescript
model Supplier {
  id        String  // Unique ID
  code      String  // Supplier code (SUP-001)
  name      String  // Supplier name
  contact   String? // Phone/email
  is_active Boolean // Still active?
}
```

**Entity Relationships:**

```mermaid
graph TB
    U[User] -->|has default| L[Location]
    U -->|can access| UL[UserLocation]
    L -->|grants access via| UL
    L -->|managed by| U

    style U fill:#b3e5fc
    style L fill:#81d4fa
    style UL fill:#4fc3f7
```

---

#### 1.2.4: Prisma Schema - Period & Stock Models ✅

**Simple Explanation:**
We created tables for **monthly periods** (accounting months) and **stock tracking** (what's in each location).

**Models Created:**

##### 1. Period Model

```typescript
model Period {
  id          String       // Unique ID
  name        String       // "November 2025"
  start_date  DateTime     // Period start
  end_date    DateTime     // Period end
  status      PeriodStatus // DRAFT, OPEN, CLOSED
  approval_id String?      // Link to approval
  created_at  DateTime     // When created
  closed_at   DateTime?    // When closed
}
```

**Period Status Flow:**

```mermaid
graph LR
    A[DRAFT] -->|Admin Opens| B[OPEN]
    B -->|All Locations Ready| C[PENDING_CLOSE]
    C -->|Admin Approves| D[APPROVED]
    D -->|System Closes| E[CLOSED]

    style A fill:#ffd54f
    style B fill:#4caf50,color:#fff
    style C fill:#ff9800
    style D fill:#2196f3,color:#fff
    style E fill:#9e9e9e,color:#fff
```

##### 2. PeriodLocation Model

```typescript
model PeriodLocation {
  period_id      String                // Which period
  location_id    String                // Which location
  status         PeriodLocationStatus  // OPEN, READY, CLOSED
  opening_value  Decimal?              // Stock value at start
  closing_value  Decimal?              // Stock value at end
  snapshot       Json?                 // Full stock snapshot
  ready_at       DateTime?             // When marked ready
  closed_at      DateTime?             // When closed
}
```

**How Period Closing Works:**

```mermaid
sequenceDiagram
    participant S as Supervisor
    participant L1 as Location 1
    participant L2 as Location 2
    participant A as Admin
    participant P as Period

    S->>L1: Mark Ready
    L1->>L1: Status = READY
    S->>L2: Mark Ready
    L2->>L2: Status = READY
    A->>P: Check All Ready?
    P->>A: Yes, all READY
    A->>P: Approve Close
    P->>L1: Close Location
    P->>L2: Close Location
    L1->>L1: Create Snapshot
    L2->>L2: Create Snapshot
    P->>P: Status = CLOSED
```

##### 3. ItemPrice Model

```typescript
model ItemPrice {
  id        String   // Unique ID
  item_id   String   // Which item
  period_id String   // Which period
  price     Decimal  // Locked price
  currency  String   // Default: SAR
  set_by    String   // Who set it
  set_at    DateTime // When set
}
```

**Why Price Locking?**
When a period starts, we **lock prices**. If a delivery comes with a different price, we automatically create an **NCR** (problem report).

##### 4. LocationStock Model

```typescript
model LocationStock {
  location_id  String   // Which location
  item_id      String   // Which item
  on_hand      Decimal  // Current quantity
  wac          Decimal  // Weighted Average Cost
  min_stock    Decimal? // Minimum level
  max_stock    Decimal? // Maximum level
  last_counted DateTime? // Last physical count
  updated_at   DateTime // Last updated
}
```

**WAC (Weighted Average Cost) Calculation:**

```
Example:
- Current stock: 100 KG at SAR 10 = SAR 1,000
- Receive: 50 KG at SAR 12 = SAR 600
- New WAC = (1,000 + 600) / (100 + 50) = SAR 10.67
```

**Stock Tracking Flow:**

```mermaid
graph TB
    D[Delivery] -->|Increases| LS[LocationStock]
    LS -->|Updates| WAC[WAC Calculation]
    I[Issue] -->|Decreases| LS
    T1[Transfer Out] -->|Decreases| LS
    T2[Transfer In] -->|Increases| LS

    style D fill:#4caf50,color:#fff
    style I fill:#f44336,color:#fff
    style T1 fill:#ff9800,color:#fff
    style T2 fill:#2196f3,color:#fff
    style LS fill:#9c27b0,color:#fff
```

---

#### 1.2.5: Prisma Schema - Transaction Models ✅

**Simple Explanation:**
We created tables for **business transactions**: purchase requests, deliveries, and stock issues.

**Models Created:**

##### 1. PRF (Purchase Request Form)

```typescript
model PRF {
  id            String    // Unique ID
  prf_no        String    // PRF-2025-001
  period_id     String    // Which period
  location_id   String    // Which location
  status        PRFStatus // DRAFT, PENDING, APPROVED, REJECTED
  requested_by  String    // Who requested
  approved_by   String?   // Who approved
  request_date  DateTime  // When requested
  approval_date DateTime? // When approved/rejected
}
```

##### 2. PO (Purchase Order)

```typescript
model PO {
  id           String   // Unique ID
  po_no        String   // PO-2025-001
  prf_id       String?  // Link to PRF
  supplier_id  String   // Which supplier
  status       POStatus // OPEN, CLOSED
  total_amount Decimal  // Total value
  created_at   DateTime // When created
}
```

##### 3. Delivery & DeliveryLine

```typescript
model Delivery {
  id            String   // Unique ID
  delivery_no   String   // DEL-2025-001
  period_id     String   // Which period
  location_id   String   // Which location
  supplier_id   String   // Which supplier
  po_id         String?  // Link to PO (optional)
  invoice_no    String   // Supplier invoice #
  delivery_note String?  // Notes
  delivery_date DateTime // When delivered
  total_amount  Decimal  // Total value
  has_variance  Boolean  // Price difference?
  posted_by     String   // Who posted
  posted_at     DateTime // When posted
}

model DeliveryLine {
  id            String  // Unique ID
  delivery_id   String  // Which delivery
  item_id       String  // Which item
  quantity      Decimal // How much
  unit_price    Decimal // Actual price
  period_price  Decimal // Expected price
  price_variance Decimal // Difference
  line_value    Decimal // quantity × unit_price
  ncr_id        String? // Link to NCR if variance
}
```

**Price Variance Detection:**

```mermaid
graph TB
    DL[Delivery Line] --> PC{Compare Prices}
    PC -->|unit_price = period_price| OK[No Problem]
    PC -->|unit_price ≠ period_price| PV[Price Variance!]
    PV --> NCR[Auto-Create NCR]
    NCR --> Flag[Set has_variance = true]

    style OK fill:#4caf50,color:#fff
    style PV fill:#ff9800,color:#fff
    style NCR fill:#f44336,color:#fff
```

##### 4. Issue & IssueLine

```typescript
model Issue {
  id          String     // Unique ID
  issue_no    String     // ISS-2025-001
  period_id   String     // Which period
  location_id String     // Which location
  issue_date  DateTime   // When issued
  cost_centre CostCentre // FOOD, CLEAN, OTHER
  total_value Decimal    // Total value
  posted_by   String     // Who posted
  posted_at   DateTime   // When posted
}

model IssueLine {
  id            String  // Unique ID
  issue_id      String  // Which issue
  item_id       String  // Which item
  quantity      Decimal // How much
  wac_at_issue  Decimal // WAC when issued
  line_value    Decimal // quantity × wac_at_issue
}
```

**Stock Movement Flow:**

```mermaid
graph LR
    S[Supplier] -->|Delivery| L[Location Stock]
    L -->|Issue| CC[Cost Centre]

    D[Delivery Line] -->|Updates| LS[LocationStock]
    LS -->|on_hand += quantity| LS
    LS -->|WAC recalculated| LS

    IL[Issue Line] -->|Updates| LS2[LocationStock]
    LS2 -->|on_hand -= quantity| LS2
    LS2 -->|WAC unchanged| LS2

    style S fill:#2196f3,color:#fff
    style L fill:#4caf50,color:#fff
    style CC fill:#ff9800,color:#fff
```

---

#### 1.2.6: Prisma Schema - Transfer Models ✅

**Simple Explanation:**
We created tables for **moving stock between locations** (Kitchen → Store, Warehouse → Kitchen, etc.).

**Models Created:**

##### Transfer & TransferLine

```typescript
model Transfer {
  id               String         // Unique ID
  transfer_no      String         // TRF-2025-001
  from_location_id String         // Source location
  to_location_id   String         // Destination location
  status           TransferStatus // DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, COMPLETED
  requested_by     String         // Who requested
  approved_by      String?        // Who approved
  request_date     DateTime       // When requested
  approval_date    DateTime?      // When approved
  transfer_date    DateTime?      // When completed
  total_value      Decimal        // Total value
  notes            String?        // Reason for transfer
}

model TransferLine {
  id              String  // Unique ID
  transfer_id     String  // Which transfer
  item_id         String  // Which item
  quantity        Decimal // How much
  wac_at_transfer Decimal // WAC from source location
  line_value      Decimal // quantity × wac_at_transfer
}
```

**Transfer Workflow:**

```mermaid
sequenceDiagram
    participant O as Operator
    participant T as Transfer
    participant S as Supervisor
    participant F as From Location
    participant T2 as To Location

    O->>T: Create Transfer (DRAFT)
    O->>T: Submit for Approval
    T->>T: Status = PENDING_APPROVAL
    S->>T: Review Transfer
    alt Approved
        S->>T: Approve
        T->>T: Status = APPROVED
        T->>F: Deduct Stock
        T->>T2: Add Stock (at source WAC)
        T->>T: Status = COMPLETED
    else Rejected
        S->>T: Reject
        T->>T: Status = REJECTED
    end
```

**Transfer Status Flow:**

```mermaid
graph LR
    A[DRAFT] -->|Submit| B[PENDING_APPROVAL]
    B -->|Approve| C[APPROVED]
    C -->|Execute| D[COMPLETED]
    B -->|Reject| E[REJECTED]

    style A fill:#ffd54f
    style B fill:#ff9800
    style C fill:#4caf50,color:#fff
    style D fill:#2196f3,color:#fff
    style E fill:#f44336,color:#fff
```

---

#### 1.2.7: Prisma Schema - Control Models ✅

**Simple Explanation:**
We created tables for **quality control** (NCRs), **people counting** (POB), **reconciliations**, and **approvals**.

**Models Created:**

##### 1. NCR (Non-Conformance Report)

```typescript
model NCR {
  id                String    // Unique ID
  ncr_no            String    // NCR-2025-001
  location_id       String    // Which location
  type              NCRType   // MANUAL or PRICE_VARIANCE
  auto_generated    Boolean   // Created automatically?
  delivery_id       String?   // Link to delivery
  delivery_line_id  String?   // Link to delivery line
  reason            String    // What's wrong
  quantity          Decimal?  // How much affected
  value             Decimal?  // Cost impact
  status            NCRStatus // OPEN, SENT, CREDITED, REJECTED, RESOLVED
  created_by        String    // Who reported
  created_at        DateTime  // When reported
  resolved_at       DateTime? // When resolved
}
```

**NCR Types:**
- **PRICE_VARIANCE**: Auto-created when delivery price ≠ period price
- **MANUAL**: Created by users for other issues

##### 2. POB (People on Board)

```typescript
model POB {
  id          String   // Unique ID
  period_id   String   // Which period
  location_id String   // Which location
  date        DateTime // Which day
  crew_count  Int      // Number of crew
  extra_count Int      // Extra people
  total_count Int      // Auto-calculated
  entered_by  String   // Who entered
  entered_at  DateTime // When entered
}
```

**Why POB?**
We track how many people are at each location each day. This helps calculate **cost per person per day**.

##### 3. Reconciliation

```typescript
model Reconciliation {
  id               String   // Unique ID
  period_id        String   // Which period
  location_id      String   // Which location
  opening_stock    Decimal  // Stock value at start
  receipts         Decimal  // Deliveries total
  transfers_in     Decimal  // Transfers received
  transfers_out    Decimal  // Transfers sent
  issues           Decimal  // Issues total
  closing_stock    Decimal  // Stock value at end
  adjustments      Decimal  // Manual adjustments
  back_charges     Decimal  // Charges to suppliers
  credits          Decimal  // Credits received
  condemnations    Decimal  // Damaged/expired stock
  consumption      Decimal  // Calculated consumption
  manday_cost      Decimal  // Cost per person per day
  last_updated     DateTime // Last updated
}
```

**Reconciliation Formula:**

```
Opening Stock
+ Receipts (Deliveries)
+ Transfers In
- Transfers Out
- Issues
- Adjustments
- Back Charges
+ Credits
- Condemnations
= Closing Stock

Consumption = Opening + Receipts + Transfers In - Transfers Out - Closing Stock

Manday Cost = Consumption / Total Mandays (from POB)
```

##### 4. Approval

```typescript
model Approval {
  id            String              // Unique ID
  entity_type   ApprovalEntityType  // PRF, PO, PERIOD_CLOSE, TRANSFER
  entity_id     String              // ID of what needs approval
  status        ApprovalStatus      // PENDING, APPROVED, REJECTED
  requested_by  String              // Who requested
  reviewed_by   String?             // Who reviewed
  requested_at  DateTime            // When requested
  reviewed_at   DateTime?           // When reviewed
  comments      String?             // Approval/rejection notes
}
```

**Approval System:**

```mermaid
graph TB
    T[Transfer] -->|Needs Approval| A[Approval]
    P[PRF] -->|Needs Approval| A
    PC[Period Close] -->|Needs Approval| A

    A -->|PENDING| S{Supervisor/Admin Reviews}
    S -->|Approve| AP[APPROVED]
    S -->|Reject| R[REJECTED]
    AP --> E[Execute Action]

    style A fill:#ffd54f
    style AP fill:#4caf50,color:#fff
    style R fill:#f44336,color:#fff
```

---

#### 1.2.8: Prisma Schema - Indexes & Relations ✅

**Simple Explanation:**
We added **indexes** (speed up searches) and verified all **relationships** between tables work correctly.

**What Was Done:**
- Added 23 performance indexes
- Documented 8 database constraints
- Verified all relationships (80+ relations)

**Why Indexes Matter:**

Imagine finding a book in a library:
- ❌ **Without index**: Check every book (slow)
- ✅ **With index**: Use catalog to find it quickly (fast)

**Example Indexes:**

```typescript
// User Model
@@index([role])           // Fast: Find all admins
@@index([is_active])      // Fast: Find active users
@@index([default_location_id]) // Fast: Find users by location

// Delivery Model
@@index([period_id, location_id]) // Fast: Find deliveries by period+location
@@index([location_id, has_variance]) // Fast: Find price variances
```

**Database Constraints** (Rules the database enforces):

1. Stock must be positive (on_hand ≥ 0)
2. WAC must be positive (wac ≥ 0)
3. Prices must be positive (price ≥ 0)
4. Transfers must be between different locations
5. Quantities must be positive
6. Period dates must be valid (start < end)

---

#### 1.2.9: Database Migration ✅

**Simple Explanation:**
We **applied all the schema** to the actual database on Supabase. Now all 22 tables exist!

**What Was Done:**
- Generated Prisma Client
- Created migration file
- Applied migration to Supabase
- Verified all tables created
- Tested Prisma Studio

**Migration Process:**

```mermaid
graph LR
    A[schema.prisma<br/>Definition] -->|prisma migrate dev| B[Migration File<br/>SQL]
    B -->|Apply to| C[Supabase<br/>PostgreSQL]
    C -->|Creates| D[22 Tables<br/>14 Enums<br/>81 Indexes]

    style A fill:#e1f5ff
    style B fill:#81d4fa
    style C fill:#29b6f6,color:#fff
    style D fill:#0277bd,color:#fff
```

**Tables Created:**

| Category | Tables |
|----------|--------|
| **Core** | users, locations, user_locations, items, suppliers |
| **Period & Stock** | periods, period_locations, item_prices, location_stock |
| **Transactions** | prfs, purchase_orders, deliveries, delivery_lines, issues, issue_lines |
| **Transfers** | transfers, transfer_lines |
| **Controls** | ncrs, pob, reconciliations, approvals |

**Total:** 22 tables, 14 enums, 81 indexes ✅

---

#### 1.2.10: Seed Data ✅

**Simple Explanation:**
We added **test data** to the database so we can start testing the app.

**What Was Done:**
- Created seed script (`prisma/seed.ts`)
- Added 1 admin user
- Added 3 test locations
- Added 15 sample items
- Added 1 test supplier

**Seed Data Details:**

**Admin User:**
```
Username: admin
Email: admin@foodstock.local
Password: Admin@123
Role: ADMIN
```

**Locations:**
1. Main Kitchen (MAIN-KIT) - Type: KITCHEN
2. Central Store (CENTRAL-01) - Type: CENTRAL
3. Main Warehouse (WH-01) - Type: WAREHOUSE

**Items (15 total):**
- **Dairy** (4): Fresh Milk, Butter, Yogurt, Cheese
- **Vegetables** (4): Tomatoes, Onions, Carrots, Potatoes
- **Meat** (3): Chicken Breast, Beef, Lamb
- **Dry Goods** (4): Rice, Flour, Sugar, Salt

**Running the Seed:**
```bash
pnpm db:seed
```

---

## Key Concepts Learned

### 1. Prisma Schema Structure

```typescript
// 1. Define enum types
enum UserRole {
  OPERATOR
  SUPERVISOR
  ADMIN
}

// 2. Define models (tables)
model User {
  id       String   @id @default(uuid()) @db.Uuid
  username String   @unique @db.VarChar(50)
  role     UserRole

  // 3. Define relations
  locations UserLocation[]

  // 4. Add indexes
  @@index([role])
  @@map("users")
}

// 5. Join tables with composite keys
model UserLocation {
  user_id     String
  location_id String

  user     User     @relation(fields: [user_id])
  location Location @relation(fields: [location_id])

  @@id([user_id, location_id])
  @@map("user_locations")
}
```

### 2. WAC (Weighted Average Cost)

**Why WAC?**
WAC is an inventory costing method that averages the cost of all items.

**Formula:**
```
New WAC = (Current Value + Receipt Value) / (Current Qty + Receipt Qty)

Where:
  Current Value = Current Qty × Current WAC
  Receipt Value = Receipt Qty × Receipt Price
```

**Example:**
```
Day 1: Buy 100 KG at SAR 10 = SAR 1,000
       WAC = SAR 10

Day 5: Buy 50 KG at SAR 12 = SAR 600
       New WAC = (1,000 + 600) / (100 + 50)
       New WAC = 1,600 / 150 = SAR 10.67

Day 10: Issue 80 KG
        Value = 80 × 10.67 = SAR 853.60
        WAC stays SAR 10.67 (no recalculation)
```

### 3. Database Migrations

**Development workflow:**
```bash
# Make schema changes in schema.prisma
# Then:
pnpm db:migrate dev

# This creates a migration file and applies it
```

**Production workflow:**
```bash
# Never use db:push in production!
# Use migrations:
pnpm db:migrate deploy
```

### 4. Prisma Client Usage

```typescript
// Create
const user = await prisma.user.create({
  data: {
    username: 'john',
    email: 'john@example.com',
    role: 'OPERATOR'
  }
})

// Read
const user = await prisma.user.findUnique({
  where: { email: 'john@example.com' }
})

// Update
const user = await prisma.user.update({
  where: { id: userId },
  data: { is_active: false }
})

// Delete
await prisma.user.delete({
  where: { id: userId }
})

// Relations
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    locations: true,  // Include user locations
    default_location: true
  }
})
```

---

## Common Database Terms

| Term | Simple Explanation |
|------|-------------------|
| **Schema** | Blueprint of database structure |
| **Model** | Table definition in Prisma |
| **Migration** | Version-controlled database change |
| **Seed** | Initial test data |
| **Relation** | Connection between tables |
| **Index** | Speed up searches |
| **Constraint** | Rule enforced by database |
| **Primary Key** | Unique identifier for a row |
| **Foreign Key** | Reference to another table |
| **Join Table** | Connects two tables (many-to-many) |

---

## What's Next?

After completing the database setup, we moved to:

**→ [Phase 1.3: Authentication & Security](phase-1.3-authentication.md)**

In the next phase, we:
- Set up nuxt-auth-utils for sessions
- Created password hashing utilities
- Built authentication API routes
- Implemented login/logout functionality
- Created route protection

---

**Made with ❤️ for Junior Developers**

---

**Last Updated:** November 8, 2025
**Phase:** 1.2 Database Setup ✅ Complete
**Previous:** [Phase 1.1: Project Foundation](phase-1.1-foundation.md)
**Next:** [Phase 1.3: Authentication & Security](phase-1.3-authentication.md)
