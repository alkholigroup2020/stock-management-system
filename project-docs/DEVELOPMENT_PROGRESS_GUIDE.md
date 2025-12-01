# Development Progress Guide

## Stock Management System - Journey So Far

**For Junior Developers**
**Last Updated:** November 8, 2025
**Project Status:** Phase 1.3 Complete (Authentication & Authorization) ✅

---

## 📖 Table of Contents

1. [What is This Project?](#what-is-this-project)
2. [Technology Stack - Simple Explanation](#technology-stack---simple-explanation)
3. [What We've Built So Far](#what-weve-built-so-far)
4. [Phase 1.1: Project Foundation](#phase-11-project-foundation)
5. [Phase 1.2: Database Setup](#phase-12-database-setup)
6. [Phase 1.3: Authentication & Security](#phase-13-authentication--security)
7. [How Everything Connects](#how-everything-connects)
8. [What's Next?](#whats-next)
9. [Important Files to Know](#important-files-to-know)
10. [Common Terms Explained](#common-terms-explained)

---

## What is This Project?

### The Problem We're Solving

Imagine a restaurant business with **multiple locations** (kitchens, stores, warehouses). They currently track their food inventory using **Excel spreadsheets**. This causes many problems:

- ❌ Hard to know stock levels in real-time
- ❌ Mistakes when moving items between locations
- ❌ Price changes are not tracked properly
- ❌ Difficult to close accounting periods
- ❌ No approval system for important actions

### Our Solution

We're building a **web application** that:

- ✅ Tracks stock in real-time for all locations
- ✅ Manages deliveries, issues, and transfers
- ✅ Detects price changes automatically
- ✅ Coordinates period-end closing across all locations
- ✅ Requires approvals for important operations
- ✅ Works on computers, tablets, and phones (PWA)

```mermaid
graph TB
    A[Old System<br/>Excel Spreadsheets] -->|Problems| B[Manual Work<br/>Errors<br/>No Real-Time Data]
    C[New System<br/>Web Application] -->|Solutions| D[Automated<br/>Accurate<br/>Real-Time]

    style A fill:#ffcccc
    style B fill:#ffcccc
    style C fill:#ccffcc
    style D fill:#ccffcc
```

---

## Technology Stack - Simple Explanation

### Frontend (What Users See)

| Technology          | What It Does      | Why We Use It                                |
| ------------------- | ----------------- | -------------------------------------------- |
| **Nuxt 4**          | Main framework    | Builds modern web apps with Vue.js           |
| **Vue 3**           | UI library        | Creates interactive user interfaces          |
| **Nuxt UI**         | Component library | Ready-made buttons, forms, cards, etc.       |
| **Tailwind CSS v4** | Styling           | Makes the app look good with utility classes |
| **Pinia**           | State management  | Stores user data, settings across pages      |
| **TypeScript**      | Type checking     | Catches errors before they happen            |

### Backend (Behind the Scenes)

| Technology             | What It Does     | Why We Use It                             |
| ---------------------- | ---------------- | ----------------------------------------- |
| **Nuxt Server Routes** | API endpoints    | Handles requests from the frontend        |
| **Prisma ORM**         | Database tool    | Talks to the database easily              |
| **PostgreSQL**         | Database         | Stores all our data (users, items, stock) |
| **Supabase**           | Database hosting | Cloud service for PostgreSQL              |
| **nuxt-auth-utils**    | Authentication   | Manages user login/logout                 |
| **Zod**                | Validation       | Checks if data is correct                 |

### How They Work Together

```mermaid
graph LR
    A[User's Browser] -->|Requests| B[Nuxt Frontend<br/>Vue + Nuxt UI]
    B -->|API Calls| C[Nuxt Server<br/>API Routes]
    C -->|Queries| D[Prisma ORM]
    D -->|SQL| E[Supabase<br/>PostgreSQL]
    E -->|Data| D
    D -->|Results| C
    C -->|Response| B
    B -->|Display| A

    style A fill:#e1f5ff
    style B fill:#b3e5fc
    style C fill:#81d4fa
    style D fill:#4fc3f7
    style E fill:#29b6f6
```

---

## What We've Built So Far

### Progress Overview

We've completed **23 tasks** organized into **3 major phases**:

```mermaid
gantt
    title Development Progress
    dateFormat YYYY-MM-DD
    section Phase 1.1 Foundation
    Project Setup           :done, p11, 2025-11-04, 1d
    Environment Config      :done, p12, 2025-11-04, 1d
    Design System           :done, p13, 2025-11-05, 1d
    section Phase 1.2 Database
    Supabase Setup          :done, p21, 2025-11-05, 1d
    Prisma Schema           :done, p22, 2025-11-06, 1d
    Migration & Seed        :done, p23, 2025-11-06, 1d
    section Phase 1.3 Auth
    Auth Setup              :done, p31, 2025-11-06, 1d
    API Routes              :done, p32, 2025-11-06, 1d
    Frontend Auth           :done, p33, 2025-11-08, 1d
    section Next Steps
    Layout & Navigation     :active, p41, 2025-11-08, 3d
```

**✅ Completed:** 23 tasks
**🔄 In Progress:** 0 tasks
**⏳ Remaining:** 177+ tasks

---

## Phase 1.1: Project Foundation

### What We Did

In this phase, we **set up the basic structure** of our project - like building the foundation of a house before building the walls.

### Tasks Completed

#### 1.1.1: Project Initialization ✅

**Simple Explanation:**
We created a new Nuxt 4 project and installed all the tools (packages) we need.

**What Was Done:**

- Created the project folder structure
- Installed 289 packages using `pnpm` (like downloading all the tools)
- Set up TypeScript for type checking
- Tested that the development server works

**Result:**
Dev server runs on `http://localhost:3000` ✅

---

#### 1.1.2: Environment Configuration ✅

**Simple Explanation:**
We set up **secret keys** and **configuration** that the app needs to work (like passwords for databases).

**What Was Done:**

- Created `.env.example` (template file)
- Created `.env` (actual secrets file - not in git)
- Set up configuration in `nuxt.config.ts`
- Documented what each environment variable does

**Important Files Created:**

```
.env.example          # Template (safe to share)
.env                  # Real secrets (NEVER share)
nuxt.config.ts        # App configuration
```

**Environment Variables:**

```bash
# Database
DATABASE_URL=postgresql://...

# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Authentication
AUTH_SECRET=...

# App Settings
NUXT_PUBLIC_SITE_URL=http://localhost:3000
NUXT_PUBLIC_CURRENCY=SAR
```

---

#### 1.1.3: Tailwind CSS v4 Configuration ✅

**Simple Explanation:**
We set up the **design system** - the colors and styles that make the app look good.

**What Was Done:**

- Configured Tailwind CSS v4 using `@theme` directive
- Created color palettes for brand colors:
  - **Navy Blue** (#000046) - primary brand color
  - **Emerald Green** (#45cf7b) - success/secondary color
- Set up light and dark mode support
- Tested all colors work correctly

**Color System:**

```css
/* In app/assets/css/main.css */
@theme {
  --color-navy-500: #000046; /* Main brand color */
  --color-emerald-500: #45cf7b; /* Success color */
  /* + 50 more shades from 50-950 */
}
```

**How to Use Colors:**

```vue
<!-- In components -->
<button class="bg-navy-500 text-white">
  Click Me
</button>
```

---

#### 1.1.4: Comprehensive Design System ✅

**Simple Explanation:**
We created a **complete style guide** with colors, buttons, forms, and badges that match our brand.

**What Was Done:**

- Expanded to 6 color palettes (navy, emerald, zinc, amber, red, blue)
- Created 40+ semantic color tokens (like variables for colors)
- Created 40+ utility classes for common styles
- Built business-specific design tokens (stock status, approval badges)
- Documented everything in `DESIGN_SYSTEM.md` (750+ lines)

**Semantic Tokens:**

```css
/* Background Colors */
--ui-bg: var(--color-zinc-50); /* Page background */
--ui-bg-elevated: var(--color-white); /* Cards, modals */

/* Text Colors */
--ui-text: var(--color-zinc-900); /* Main text */
--ui-text-muted: var(--color-zinc-500); /* Less important text */

/* Status Colors */
--ui-success: var(--color-emerald-500); /* Success messages */
--ui-error: var(--color-red-500); /* Error messages */
```

**Utility Classes:**

```vue
<!-- Card with elevation -->
<div class="card-elevated">
  Content here
</div>

<!-- Stock status badges -->
<span class="badge-stock-healthy">In Stock</span>
<span class="badge-stock-low">Low Stock</span>
<span class="badge-stock-critical">Critical</span>
```

**Design System Structure:**

```mermaid
graph TB
    A[Design System] --> B[Colors<br/>6 Palettes]
    A --> C[Semantic Tokens<br/>40+ Variables]
    A --> D[Utility Classes<br/>40+ Classes]

    B --> B1[Navy Blue<br/>Brand Primary]
    B --> B2[Emerald Green<br/>Success/Secondary]
    B --> B3[Zinc Gray<br/>Neutrals]
    B --> B4[Amber<br/>Warnings]
    B --> B5[Red<br/>Errors]
    B --> B6[Blue<br/>Info]

    C --> C1[Backgrounds]
    C --> C2[Text]
    C --> C3[Borders]
    C --> C4[Interactive States]

    D --> D1[Surfaces<br/>Cards, Panels]
    D --> D2[Forms<br/>Inputs, Labels]
    D --> D3[Badges<br/>Status Indicators]
    D --> D4[Typography<br/>Headings, Text]

    style A fill:#000046,color:#fff
    style B fill:#45cf7b
    style C fill:#45cf7b
    style D fill:#45cf7b
```

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
  where: { email: "test@example.com" },
});
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

| Category           | Tables                                                                 |
| ------------------ | ---------------------------------------------------------------------- |
| **Core**           | users, locations, user_locations, items, suppliers                     |
| **Period & Stock** | periods, period_locations, item_prices, location_stock                 |
| **Transactions**   | prfs, purchase_orders, deliveries, delivery_lines, issues, issue_lines |
| **Transfers**      | transfers, transfer_lines                                              |
| **Controls**       | ncrs, pob, reconciliations, approvals                                  |

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

## Phase 1.3: Authentication & Security

### What We Did

In this phase, we built the **login system** - how users log in, who can access what, and protecting pages.

### Authentication Architecture

```mermaid
graph TB
    U[User] -->|1. Login| LP[Login Page]
    LP -->|2. Submit| LA[Login API]
    LA -->|3. Verify| DB[Database]
    DB -->|4. Check Password| LA
    LA -->|5. Create Session| C[httpOnly Cookie]
    C -->|6. Store Token| B[Browser]
    B -->|7. All Requests| M[Auth Middleware]
    M -->|8. Verify Token| A{Valid?}
    A -->|Yes| P[Allow Access]
    A -->|No| R[Redirect to Login]

    style LP fill:#e1f5ff
    style LA fill:#81d4fa
    style C fill:#4fc3f7,color:#fff
    style M fill:#29b6f6,color:#fff
    style P fill:#4caf50,color:#fff
    style R fill:#f44336,color:#fff
```

### Tasks Completed

#### 1.3.1: Auth Setup with nuxt-auth-utils ✅

**Simple Explanation:**
We installed and configured **nuxt-auth-utils** - a tool that manages login sessions using secure cookies.

**What Was Done:**

- Installed nuxt-auth-utils package (v0.5.25)
- Configured session settings:
  - **httpOnly cookies** (JavaScript can't access them - safer)
  - **Secure flag** (only sent over HTTPS in production)
  - **SameSite: lax** (protects against CSRF attacks)
  - **7-day expiration** (users stay logged in for a week)
- Created test endpoint to verify setup

**Security Features:**

```mermaid
graph TB
    C[Session Cookie] --> H[httpOnly<br/>❌ No JS Access]
    C --> S[Secure<br/>✅ HTTPS Only]
    C --> SS[SameSite: lax<br/>✅ CSRF Protection]
    C --> E[7-day Expiration<br/>✅ Auto Logout]

    style C fill:#000046,color:#fff
    style H fill:#45cf7b
    style S fill:#45cf7b
    style SS fill:#45cf7b
    style E fill:#45cf7b
```

**Configuration:**

```typescript
// nuxt.config.ts
auth: {
  session: {
    cookie: {
      httpOnly: true,      // Can't be read by JavaScript
      secure: true,        // HTTPS only (production)
      sameSite: 'lax',     // CSRF protection
      maxAge: 604800       // 7 days in seconds
    }
  }
}
```

---

#### 1.3.2: Password Hashing Utility ✅

**Simple Explanation:**
We created functions to **safely store passwords**. Never store plain text passwords!

**What Was Done:**

- Created password hashing function (uses bcrypt with 10 salt rounds)
- Created password verification function (checks if password is correct)
- Created password strength validator (checks if password is strong enough)

**How Password Hashing Works:**

```mermaid
graph LR
    P[Plain Password<br/>Admin@123] -->|Hash with bcrypt| H[Hashed Password<br/>$2a$10$aB3Xc...]
    H -->|Store in DB| DB[Database]

    LP[Login Attempt<br/>Admin@123] -->|Hash & Compare| H
    H -->|Match?| V{Verify}
    V -->|Yes| OK[✅ Login Success]
    V -->|No| NO[❌ Login Failed]

    style P fill:#ff9800
    style H fill:#4caf50,color:#fff
    style DB fill:#2196f3,color:#fff
    style OK fill:#4caf50,color:#fff
    style NO fill:#f44336,color:#fff
```

**Password Strength Requirements:**

- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&\*)

**Functions Created:**

```typescript
// Hash a password
const hashed = await hashUserPassword("Admin@123");
// Result: $2a$10$aB3Xc...

// Verify a password
const isValid = await verifyUserPassword("Admin@123", hashed);
// Result: true

// Check password strength
const validation = validatePasswordStrength("weak");
// Result: { valid: false, message: "...", strength: "weak" }
```

---

#### 1.3.3: Auth API Routes ✅

**Simple Explanation:**
We created **4 API endpoints** for login, logout, session check, and user registration.

**API Endpoints Created:**

##### 1. POST /api/auth/login

**What it does:** Logs in a user

**Request:**

```json
{
  "email": "admin@foodstock.local", // or "admin" (username)
  "password": "Admin@123"
}
```

**Response (Success):**

```json
{
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@foodstock.local",
    "full_name": "System Administrator",
    "role": "ADMIN",
    "is_active": true,
    "locations": [
      {
        "location_id": "...",
        "code": "MAIN-KIT",
        "name": "Main Kitchen",
        "access_level": "MANAGE"
      }
    ],
    "default_location": { ... }
  }
}
```

**Response (Error):**

```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

##### 2. POST /api/auth/logout

**What it does:** Logs out the current user

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

##### 3. GET /api/auth/session

**What it does:** Gets the current user's session

**Response (Logged in):**

```json
{
  "user": { ... }  // Same as login response
}
```

**Response (Not logged in):**

```json
{
  "user": null
}
```

##### 4. POST /api/auth/register

**What it does:** Creates a new user (Admin only)

**Request:**

```json
{
  "username": "operator1",
  "email": "operator1@foodstock.local",
  "password": "StrongPass123!",
  "full_name": "Operator One",
  "role": "OPERATOR",
  "default_location_id": "..."
}
```

**Security:**

- ✅ Only admins can create users
- ✅ Username must be unique
- ✅ Email must be unique
- ✅ Password must be strong

**Login Flow:**

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as /api/auth/login
    participant D as Database
    participant S as Session

    U->>F: Enter email & password
    F->>A: POST /api/auth/login
    A->>D: Find user by email
    D->>A: User record
    A->>A: Verify password (bcrypt)
    alt Password Valid
        A->>S: Create session (JWT)
        S->>A: Session token
        A->>F: User data + cookie
        F->>U: Redirect to dashboard
    else Password Invalid
        A->>F: 401 Invalid credentials
        F->>U: Show error message
    end
```

---

#### 1.3.4: Auth Middleware ✅

**Simple Explanation:**
We created **guards** that protect API routes. If you're not logged in, you can't access them.

**What Was Done:**

- Created auth middleware (protects all `/api/*` routes)
- Created location-access middleware (checks if user can access a location)

**Middleware Created:**

##### 1. Auth Middleware

**File:** `server/middleware/auth.ts`

**What it does:**

- ✅ Runs on ALL API routes except `/api/auth/*`
- ✅ Checks if user is logged in
- ✅ If not logged in → Returns 401 error
- ✅ If logged in → Attaches user to `event.context.user`

##### 2. Location Access Middleware

**File:** `server/middleware/location-access.ts`

**What it does:**

- ✅ Extracts `locationId` from URL
- ✅ Checks if user has access to that location
- ✅ Admins/Supervisors → Access to ALL locations
- ✅ Operators → Only locations they're assigned to
- ✅ If no access → Returns 403 error

**How Middleware Works:**

```mermaid
graph TB
    R[API Request] --> AM{Auth Middleware}
    AM -->|Not Logged In| E1[❌ 401 Unauthorized]
    AM -->|Logged In| LAM{Location Access<br/>Middleware}
    LAM -->|No Access| E2[❌ 403 Forbidden]
    LAM -->|Has Access| H[✅ Route Handler<br/>Execute Request]

    style R fill:#e1f5ff
    style AM fill:#81d4fa
    style LAM fill:#4fc3f7,color:#fff
    style E1 fill:#f44336,color:#fff
    style E2 fill:#f44336,color:#fff
    style H fill:#4caf50,color:#fff
```

**Example:**

```typescript
// In API route handlers:
export default defineEventHandler(async (event) => {
  // User is already attached by auth middleware
  const user = event.context.user;

  console.log(user.role); // "ADMIN"
  console.log(user.email); // "admin@foodstock.local"

  // Do your logic here...
});
```

---

#### 1.3.5: Auth Store (Pinia) ✅

**Simple Explanation:**
We created a **state manager** that stores user information across all pages in the app.

**What Was Done:**

- Created Pinia store (`app/stores/auth.ts`)
- Added user state, loading state, error state
- Created 9 computed getters (quick checks)
- Created 3 actions (login, logout, fetchSession)
- Created 5 location helper methods

**Store Structure:**

```typescript
interface AuthState {
  user: SessionUser | null; // Current user data
  loading: boolean; // Is loading?
  error: string | null; // Error message
}
```

**Computed Getters:**

```typescript
isAuthenticated; // Is user logged in?
role; // User's role (ADMIN, SUPERVISOR, OPERATOR)
locations; // User's accessible locations
isAdmin; // Is user an admin?
isSupervisor; // Is user a supervisor?
isOperator; // Is user an operator?
fullName; // User's full name
defaultLocation; // User's default location
```

**Actions:**

```typescript
login(email, password); // Log in
logout(); // Log out
fetchSession(); // Get current session
```

**Location Helpers:**

```typescript
hasLocationAccess(locationId); // Can access this location?
getLocationAccessLevel(locationId); // VIEW, POST, or MANAGE?
canPostAtLocation(locationId); // Can create transactions?
canManageLocation(locationId); // Can manage location?
getAccessibleLocationIds(); // Array of accessible IDs
```

**How the Store Works:**

```mermaid
graph TB
    subgraph Store State
        U[user: SessionUser | null]
        L[loading: boolean]
        E[error: string | null]
    end

    subgraph Computed Getters
        IA[isAuthenticated]
        R[role]
        LOC[locations]
    end

    subgraph Actions
        LI[login()]
        LO[logout()]
        FS[fetchSession()]
    end

    C[Component] -->|Uses| IA
    C -->|Calls| LI
    LI -->|Updates| U
    U -->|Reactive| C

    style U fill:#000046,color:#fff
    style IA fill:#45cf7b
    style LI fill:#45cf7b
```

---

#### 1.3.6: Auth Composable ✅

**Simple Explanation:**
We created a **wrapper function** that makes it easy to use the auth store in any component.

**What Was Done:**

- Created `useAuth()` composable
- Exported all state as reactive refs
- Added role checking helpers
- Added location access methods
- Added permission methods

**How to Use:**

```vue
<script setup lang="ts">
const {
  // State
  user,
  isAuthenticated,
  role,

  // Actions
  login,
  logout,

  // Role Checks
  isAdmin,
  hasRole,

  // Location Checks
  hasLocationAccess,
  canPostAtLocation,

  // Permissions
  canApproveTransfers,
  canClosePeriods,
  canPostDeliveries,
} = useAuth();
</script>

<template>
  <div v-if="isAuthenticated">
    <p>Welcome {{ user.full_name }}!</p>
    <p>Role: {{ role }}</p>

    <button v-if="canPostDeliveries">Post Delivery</button>

    <button v-if="canApproveTransfers">Approve Transfer</button>
  </div>
</template>
```

**Permission Methods:**

```typescript
// Role-based
canApproveTransfers(); // Supervisor or Admin
canClosePeriods(); // Admin only
canManageItems(); // Admin only
canManageUsers(); // Admin only

// Location-based
canPostDeliveries(locId); // Can post at this location
canEditReconciliations(); // Supervisor or Admin
```

---

#### 1.3.7: Login Page ✅

**Simple Explanation:**
We created the **login page** where users enter their email and password.

**What Was Done:**

- Created `/login` page
- Built login form with validation
- Added error handling
- Added success handling with redirect
- Styled with Nuxt UI components

**Login Page Features:**

```mermaid
graph TB
    L[Login Page] --> F[Form<br/>Email/Username + Password]
    F --> V{Validate}
    V -->|Invalid| E1[Show Validation Error]
    V -->|Valid| S[Submit to API]
    S -->|Success| R[Redirect to Dashboard]
    S -->|Error| E2[Show Error Message]

    style L fill:#e1f5ff
    style F fill:#81d4fa
    style R fill:#4caf50,color:#fff
    style E1 fill:#ff9800
    style E2 fill:#f44336,color:#fff
```

**Form Fields:**

- **Email/Username** (required, supports both)
- **Password** (required, hidden)
- **Remember Me** (optional checkbox)

**Validation:**

- Email must be valid format
- Password required

**Error Messages:**

- Invalid credentials
- User not found
- Account disabled
- Network errors

**Screenshot:**

```
┌─────────────────────────────────────┐
│  Stock Management System            │
│                                     │
│  Login to Your Account              │
│                                     │
│  Email or Username                  │
│  ┌─────────────────────────────┐   │
│  │ admin@foodstock.local       │   │
│  └─────────────────────────────┘   │
│                                     │
│  Password                           │
│  ┌─────────────────────────────┐   │
│  │ ••••••••                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ☐ Remember me                      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     Sign In                 │   │
│  └─────────────────────────────┘   │
│                                     │
│  Default: admin / Admin@123         │
└─────────────────────────────────────┘
```

---

#### 1.3.8: Route Protection ✅

**Simple Explanation:**
We created **guards** that protect pages. If you're not logged in or don't have permission, you can't access them.

**What Was Done:**

- Created global auth middleware (redirects to login)
- Created role middleware (checks user role)
- Enhanced login page with redirect support

**Middleware Created:**

##### 1. Global Auth Middleware

**File:** `app/middleware/auth.global.ts`

**What it does:**

- ✅ Runs on EVERY page navigation
- ✅ Checks if user is logged in
- ✅ If not logged in → Redirect to `/login?redirect=/intended-page`
- ✅ If logged in → Allow access
- ✅ Fetches session on first load

##### 2. Role Middleware

**File:** `app/middleware/role.ts`

**What it does:**

- ✅ Checks if user has required role
- ✅ Supports single role: `roleRequired: 'ADMIN'`
- ✅ Supports multiple roles: `roleRequired: ['ADMIN', 'SUPERVISOR']`
- ✅ Supports minimum role: `minRole: 'SUPERVISOR'` (SUPERVISOR or ADMIN)
- ✅ If no access → Redirect to dashboard with error toast

**How to Protect a Page:**

```vue
<!-- pages/admin-only.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: "role",
  roleRequired: "ADMIN", // Only admins can access
});
</script>

<template>
  <div>
    <h1>Admin Only Page</h1>
  </div>
</template>
```

```vue
<!-- pages/supervisors.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: "role",
  minRole: "SUPERVISOR", // SUPERVISOR or ADMIN can access
});
</script>

<template>
  <div>
    <h1>Supervisor Dashboard</h1>
  </div>
</template>
```

**Route Protection Flow:**

```mermaid
sequenceDiagram
    participant U as User
    participant R as Router
    participant AM as Auth Middleware
    participant RM as Role Middleware
    participant P as Page

    U->>R: Navigate to /admin
    R->>AM: Check authentication
    alt Not Logged In
        AM->>U: Redirect to /login?redirect=/admin
    else Logged In
        AM->>RM: Check role
        alt Has Required Role
            RM->>P: Allow access
            P->>U: Show page
        else No Permission
            RM->>U: Redirect to / + error toast
        end
    end
```

---

#### 1.3.9: Role-Based UI Elements ✅

**Simple Explanation:**
We created **permission checks** that show/hide buttons and features based on user role.

**What Was Done:**

- Created `usePermissions()` composable
- Added 30+ permission check functions
- Created reusable `PermissionCheck` component

**Permission Categories:**

```mermaid
graph TB
    P[Permissions] --> D[Deliveries<br/>canPostDeliveries]
    P --> I[Issues<br/>canPostIssues]
    P --> IT[Items<br/>canEditItems<br/>canSetItemPrices]
    P --> PR[Periods<br/>canClosePeriod<br/>canOpenPeriod]
    P --> T[Transfers<br/>canCreateTransfer<br/>canApproveTransfers]
    P --> R[Reconciliations<br/>canEditReconciliations]
    P --> U[Users<br/>canManageUsers]

    style P fill:#000046,color:#fff
    style D fill:#45cf7b
    style I fill:#45cf7b
    style IT fill:#45cf7b
    style PR fill:#45cf7b
    style T fill:#45cf7b
    style R fill:#45cf7b
    style U fill:#45cf7b
```

**Example Usage:**

```vue
<script setup lang="ts">
const { canPostDeliveries, canApproveTransfers, canClosePeriod, canEditItems } = usePermissions();
</script>

<template>
  <div>
    <!-- Show button only if user can post deliveries -->
    <UButton v-if="canPostDeliveries(currentLocationId)" @click="createDelivery">
      New Delivery
    </UButton>

    <!-- Show button only if user can approve transfers -->
    <UButton v-if="canApproveTransfers" @click="approveTransfer">Approve Transfer</UButton>

    <!-- Show button only if user is admin -->
    <UButton v-if="canClosePeriod" @click="closePeriod">Close Period</UButton>
  </div>
</template>
```

**Permission Check Component:**

```vue
<template>
  <PermissionCheck :allowed="canEditItems">
    <!-- This content only shows if user can edit items -->
    <UButton @click="editItem">Edit Item</UButton>
  </PermissionCheck>
</template>
```

**Role Hierarchy:**

```mermaid
graph TB
    A[ADMIN<br/>Level 3] -->|Can Do| S[Everything SUPERVISOR Can]
    A -->|Plus| A1[Manage Items<br/>Manage Users<br/>Close Periods]

    S[SUPERVISOR<br/>Level 2] -->|Can Do| O[Everything OPERATOR Can]
    S -->|Plus| S1[Approve Transfers<br/>Edit Reconciliations<br/>View All Locations]

    O[OPERATOR<br/>Level 1] -->|Can Do| O1[Post Deliveries<br/>Post Issues<br/>Enter POB<br/>View Stock]

    style A fill:#000046,color:#fff
    style S fill:#2196f3,color:#fff
    style O fill:#45cf7b
```

---

## How Everything Connects

### Complete System Architecture

```mermaid
graph TB
    subgraph Frontend
        P[Pages<br/>Login, Dashboard, etc.]
        C[Components<br/>Forms, Tables, etc.]
        CO[Composables<br/>useAuth, usePermissions]
        S[Stores<br/>Auth Store]
    end

    subgraph Backend
        API[API Routes<br/>/api/auth/*, /api/items/*]
        MW[Middleware<br/>Auth, Location Access]
        PR[Prisma Client<br/>Database ORM]
    end

    subgraph Database
        DB[(Supabase<br/>PostgreSQL)]
    end

    P -->|Uses| CO
    P -->|Uses| C
    CO -->|Uses| S
    S -->|Calls| API
    C -->|Calls| API
    API -->|Protected by| MW
    API -->|Queries| PR
    PR -->|SQL| DB

    style P fill:#e1f5ff
    style API fill:#81d4fa
    style MW fill:#4fc3f7,color:#fff
    style PR fill:#29b6f6,color:#fff
    style DB fill:#0277bd,color:#fff
```

### Request Flow Example: Login

```mermaid
sequenceDiagram
    participant U as User
    participant LP as Login Page
    participant AS as Auth Store
    participant LA as /api/auth/login
    participant PR as Prisma
    participant DB as Database

    U->>LP: Enter email & password
    LP->>AS: Call login(email, password)
    AS->>LA: POST /api/auth/login
    LA->>PR: findUnique({ email })
    PR->>DB: SELECT * FROM users WHERE email = ?
    DB->>PR: User record
    PR->>LA: User data
    LA->>LA: Verify password (bcrypt)
    alt Password Valid
        LA->>LA: setUserSession(user)
        LA->>AS: Return user data
        AS->>LP: Update state (user)
        LP->>U: Redirect to dashboard
    else Password Invalid
        LA->>AS: Return 401 error
        AS->>LP: Set error
        LP->>U: Show error message
    end
```

### Data Flow: Posting a Delivery

```mermaid
sequenceDiagram
    participant U as User
    participant F as Delivery Form
    participant A as /api/deliveries
    participant P as Prisma
    participant D as Database

    U->>F: Fill delivery details
    U->>F: Add delivery lines
    F->>A: POST /api/locations/:id/deliveries
    A->>A: Auth middleware (check login)
    A->>A: Location middleware (check access)
    A->>P: Start transaction
    P->>D: INSERT INTO deliveries
    loop Each Line
        P->>D: Get item price (period_price)
        P->>D: Compare with unit_price
        alt Price Variance
            P->>D: INSERT INTO ncrs (auto)
        end
        P->>D: UPDATE location_stock (on_hand)
        P->>D: Recalculate WAC
    end
    P->>D: Commit transaction
    P->>A: Success
    A->>F: Return delivery data
    F->>U: Show success message
```

---

## What's Next?

We're currently at **Phase 1.3 Complete** (23 tasks done). Here's what comes next:

### Phase 1.4: Base Layout & Navigation (Days 4-5)

```mermaid
graph LR
    A[Current:<br/>Phase 1.3<br/>✅ Complete] --> B[Next:<br/>Phase 1.4<br/>Layout & Nav]
    B --> C[Then:<br/>Phase 1.5<br/>Locations]
    C --> D[Then:<br/>Phase 1.6<br/>Items]

    style A fill:#4caf50,color:#fff
    style B fill:#ff9800,color:#fff
    style C fill:#e0e0e0
    style D fill:#e0e0e0
```

**What We'll Build:**

1. **App Layout** - Header, sidebar, main content area
2. **Navbar** - Logo, location selector, user menu
3. **Sidebar** - Navigation menu with role-based filtering
4. **Global Components** - Loading spinners, error alerts
5. **Toast Notifications** - Success/error messages
6. **Global Stores** - UI state, period state, location state

### Phase 1.5: Location Management (Days 5-6)

**What We'll Build:**

1. Location list page
2. Create location page
3. Edit location page
4. User-location assignment
5. Location switcher component

### Phase 1.6: Items & Prices (Days 6-8)

**What We'll Build:**

1. Items list page
2. Create item page
3. Edit item page
4. Period price setting page
5. Location stock display

### Remaining Slices

- **Slice 2:** Transfers & Controls (10 days)
- **Slice 3:** Period Management (8 days)
- **Slice 4:** Polish & Performance (5 days)

**Total Remaining:** ~30 days of development

---

## Important Files to Know

### Configuration Files

| File             | What It Does                    |
| ---------------- | ------------------------------- |
| `nuxt.config.ts` | Main app configuration          |
| `package.json`   | Dependencies and scripts        |
| `.env`           | Environment variables (secrets) |
| `tsconfig.json`  | TypeScript configuration        |

### Backend Files

| File/Folder            | What It Does                           |
| ---------------------- | -------------------------------------- |
| `prisma/schema.prisma` | Database structure                     |
| `server/api/`          | API endpoints                          |
| `server/middleware/`   | Server middleware (auth, location)     |
| `server/utils/`        | Server utilities (Prisma client, auth) |

### Frontend Files

| File/Folder        | What It Does                             |
| ------------------ | ---------------------------------------- |
| `app/pages/`       | Pages (auto-routing)                     |
| `app/components/`  | Reusable components                      |
| `app/composables/` | Reusable logic (useAuth, usePermissions) |
| `app/stores/`      | Pinia stores (auth.ts)                   |
| `app/middleware/`  | Client middleware (route guards)         |
| `app/layouts/`     | Page layouts                             |
| `app/assets/css/`  | Styles (main.css with design system)     |

### Documentation Files

| File                                    | What It Does                 |
| --------------------------------------- | ---------------------------- |
| `CLAUDE.md`                             | Instructions for Claude Code |
| `README.md`                             | Project overview and setup   |
| `project-docs/MVP_DEVELOPMENT_TASKS.md` | Complete task list           |
| `project-docs/TASK_COMPLETION_LOG.md`   | Completed tasks log          |
| `project-docs/DESIGN_SYSTEM.md`         | Design system documentation  |
| `project-docs/PRD.md`                   | Product requirements         |
| `project-docs/System_Design.md`         | Technical design             |

---

## Common Terms Explained

### Technical Terms

| Term           | Simple Explanation                                                      | Example                      |
| -------------- | ----------------------------------------------------------------------- | ---------------------------- |
| **API**        | Application Programming Interface - how frontend talks to backend       | `/api/auth/login`            |
| **ORM**        | Object-Relational Mapping - talks to database using code instead of SQL | Prisma                       |
| **JWT**        | JSON Web Token - encrypted session token                                | Login token                  |
| **httpOnly**   | Cookie that JavaScript can't access (more secure)                       | Session cookie               |
| **Migration**  | Database version control - applying schema changes                      | Creating tables              |
| **Seed**       | Adding test data to database                                            | Admin user, test items       |
| **Middleware** | Code that runs before route handlers                                    | Auth check, permission check |
| **Composable** | Reusable logic function in Vue                                          | useAuth(), usePermissions()  |
| **Store**      | Global state manager (Pinia)                                            | Auth store                   |
| **Component**  | Reusable UI piece                                                       | Login form, button           |
| **WAC**        | Weighted Average Cost - inventory costing method                        | Stock valuation              |
| **NCR**        | Non-Conformance Report - quality issue report                           | Price variance               |
| **POB**        | People on Board - daily headcount                                       | Manday tracking              |

### Business Terms

| Term               | Simple Explanation                         | Example                     |
| ------------------ | ------------------------------------------ | --------------------------- |
| **Location**       | Physical site where stock is stored        | Kitchen, Warehouse          |
| **Period**         | Monthly accounting cycle                   | November 2025               |
| **Delivery**       | Goods received from supplier               | Food delivery               |
| **Issue**          | Stock taken out for use                    | Kitchen issues flour        |
| **Transfer**       | Moving stock between locations             | Warehouse → Kitchen         |
| **Reconciliation** | Period-end stock calculation               | Monthly stock report        |
| **Cost Centre**    | Department that uses items                 | FOOD, CLEAN, OTHER          |
| **Price Variance** | Delivery price different from locked price | Expected SAR 10, got SAR 12 |
| **Period Close**   | Closing accounting period                  | End of month process        |
| **Approval**       | Manager permission for action              | Approve transfer            |

### Role Terms

| Role           | What They Can Do                                            |
| -------------- | ----------------------------------------------------------- |
| **OPERATOR**   | Post deliveries, issues; view stock                         |
| **SUPERVISOR** | Approve transfers, edit reconciliations, view all locations |
| **ADMIN**      | Full access - manage items, users, close periods            |

---

## Learning Path for New Developers

### Week 1: Understanding the Foundation

1. **Day 1-2:** Read this document thoroughly
2. **Day 3:** Explore the file structure
3. **Day 4:** Run the app locally (`pnpm dev`)
4. **Day 5:** Login and test the auth system

### Week 2: Database & Backend

1. **Day 1:** Study the Prisma schema
2. **Day 2:** Open Prisma Studio and explore data
3. **Day 3:** Read API route examples
4. **Day 4:** Understand middleware (auth, location)
5. **Day 5:** Try creating a simple API endpoint

### Week 3: Frontend & UI

1. **Day 1:** Study the design system
2. **Day 2:** Explore components
3. **Day 3:** Understand composables (useAuth, usePermissions)
4. **Day 4:** Study the auth store
5. **Day 5:** Build a simple page

### Week 4: Business Logic

1. **Day 1:** Understand multi-location concept
2. **Day 2:** Learn about WAC calculation
3. **Day 3:** Study period management
4. **Day 4:** Understand price variance detection
5. **Day 5:** Review the complete flow

---

## Summary

We've successfully built the **foundation** of the Stock Management System:

✅ **Project Setup** - Nuxt 4, TypeScript, all dependencies
✅ **Design System** - Colors, styles, components
✅ **Database** - 22 tables, complete schema
✅ **Authentication** - Login, logout, sessions
✅ **Authorization** - Roles, permissions, guards
✅ **Security** - Password hashing, httpOnly cookies, middleware

**What Works Now:**

- Users can log in/out
- Sessions persist for 7 days
- Pages are protected by authentication
- Roles control what users can see/do
- Locations control where users can work
- Database stores all data
- API endpoints are secure

**What's Next:**

- Building the UI (layout, navigation)
- Creating location management pages
- Creating item management pages
- Building transaction pages (deliveries, issues, transfers)
- Implementing period management
- Adding reports

---

**Made with ❤️ for Junior Developers**
_Remember: Every expert was once a beginner. Take your time, ask questions, and keep learning!_

---

**Last Updated:** November 8, 2025
**Project:** Stock Management System v1.0
**Framework:** Nuxt 4
**Status:** Phase 1.3 Complete ✅
