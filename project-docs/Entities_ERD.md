# Entities_ERD

# Entities & ERD - Multi-Location Model

**Last Updated:** November 2025

**Purpose:** Define data objects, fields, and relationships for the multi-location food stock system

**Implementation:** Prisma ORM with PostgreSQL (Supabase)

**Note:** SQL syntax shown below is for clarity. Actual implementation uses Prisma schema at `/prisma/schema.prisma` which generates these tables.

## 1) Core Entity List

### Location Entities (NEW)

- **Location** â€” Physical site (Kitchen, Store, Central warehouse)
- **LocationStock** â€” Item quantities and costs per location
- **UserLocation** â€” User access rights to specific locations
- **Transfer** â€” Stock movement between locations
- **TransferLine** â€” Items in a transfer

### Period Entities (Updated)

- **Period** â€” Accounting period (month) across all locations
- **PeriodLocation** â€” Period status and snapshots per location
- **ItemPrice** â€” Fixed prices per item per period (NEW)

### Master Data

- **Item** â€” Product master (global across locations)
- **Supplier** â€” Vendor information
- **User** â€” System users with role-based access

### Transaction Entities

- **PRF** â€” Purchase request (location-specific)
- **PO** â€” Purchase order (can serve multiple locations)
- **Delivery** â€” Receipt at specific location
- **DeliveryLine** â€” Line items with variance tracking
- **Issue** â€” Stock usage at specific location
- **IssueLine** â€” Items consumed

### Control Entities

- **NCR** â€” Non-conformance (manual + auto price variance)
- **Reconciliation** â€” Period-end reconciliation per location
- **POB** â€” People on board per location per day
- **Approval** â€” Approval records for PRF/PO and Period Close

## 2) Detailed Entity Fields

### Location Management

### Location

```sql
id              UUID PRIMARY KEYcode            VARCHAR(10) UNIQUE NOT NULL  -- e.g., 'KSA-RYD-01'name            VARCHAR(100) NOT NULL        -- e.g., 'Riyadh Central Kitchen'type            ENUM('KITCHEN','STORE','CENTRAL','WAREHOUSE')
address         TEXT
manager_id      UUID REFERENCES User(id)
timezone        VARCHAR(50) DEFAULT 'Asia/Riyadh'is_active       BOOLEAN DEFAULT TRUEcreated_at      TIMESTAMPupdated_at      TIMESTAMP
```

### LocationStock

```sql
location_id     UUID REFERENCES Location(id)
item_id         UUID REFERENCES Item(id)
on_hand         DECIMAL(12,3) DEFAULT 0wac             DECIMAL(10,4) DEFAULT 0     -- Weighted Average Costmin_stock       DECIMAL(12,3)               -- Optional minimummax_stock       DECIMAL(12,3)               -- Optional maximumlast_counted    TIMESTAMP                   -- Physical count dateupdated_at      TIMESTAMPPRIMARY KEY (location_id, item_id)
```

### Transfer

```sql
id              UUID PRIMARY KEYtransfer_no     VARCHAR(20) UNIQUE          -- e.g., 'TRF-2025-0001'from_location   UUID REFERENCES Location(id)
to_location     UUID REFERENCES Location(id)
status          ENUM('DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','IN_TRANSIT','COMPLETED','CANCELLED')
requested_by    UUID REFERENCES User(id)
approved_by     UUID REFERENCES User(id)
request_date    TIMESTAMPapproval_date   TIMESTAMPtransfer_date   TIMESTAMPtotal_value     DECIMAL(12,2)
notes           TEXT
```

### TransferLine

```sql
id              UUID PRIMARY KEYtransfer_id     UUID REFERENCES Transfer(id)
item_id         UUID REFERENCES Item(id)
quantity        DECIMAL(12,3) NOT NULLwac_at_transfer DECIMAL(10,4) NOT NULL     -- WAC from source locationline_value      DECIMAL(12,2)
```

### Period Management (Updated)

### Period

```sql
id              UUID PRIMARY KEYname            VARCHAR(20) NOT NULL         -- e.g., '2025-11'start_date      DATE NOT NULLend_date        DATE NOT NULLstatus          ENUM('DRAFT','OPEN','PENDING_CLOSE','APPROVED','CLOSED')
approval_id     UUID REFERENCES Approval(id)
created_at      TIMESTAMPclosed_at       TIMESTAMP
```

### PeriodLocation

```sql
period_id       UUID REFERENCES Period(id)
location_id     UUID REFERENCES Location(id)
status          ENUM('OPEN','READY','CLOSED')
opening_value   DECIMAL(12,2)
closing_value   DECIMAL(12,2)
snapshot_id     UUID                        -- Reference to JSON snapshotready_at        TIMESTAMPclosed_at       TIMESTAMPPRIMARY KEY (period_id, location_id)
```

### ItemPrice (NEW)

```sql
id              UUID PRIMARY KEYitem_id         UUID REFERENCES Item(id)
period_id       UUID REFERENCES Period(id)
price           DECIMAL(10,4) NOT NULL      -- Fixed price for periodcurrency        VARCHAR(3) DEFAULT 'SAR'set_by          UUID REFERENCES User(id)
set_at          TIMESTAMPUNIQUE(item_id, period_id)
```

### Master Data (Updated)

### Item

```sql
id              UUID PRIMARY KEYcode            VARCHAR(50) UNIQUE NOT NULLname            VARCHAR(200) NOT NULLunit            ENUM('KG','EA','LTR','BOX','CASE','PACK')
category        VARCHAR(50)
sub_category    VARCHAR(50)
is_active       BOOLEAN DEFAULT TRUEcreated_at      TIMESTAMPupdated_at      TIMESTAMP-- Note: Stock levels are now in LocationStock, not here
```

### User

```sql
id              UUID PRIMARY KEYusername        VARCHAR(50) UNIQUE NOT NULLemail           VARCHAR(100) UNIQUE NOT NULLfull_name       VARCHAR(100)
role            ENUM('OPERATOR','SUPERVISOR','ADMIN')
default_location UUID REFERENCES Location(id)
is_active       BOOLEAN DEFAULT TRUEcreated_at      TIMESTAMPlast_login      TIMESTAMP
```

### UserLocation

```sql
user_id         UUID REFERENCES User(id)
location_id     UUID REFERENCES Location(id)
access_level    ENUM('VIEW','POST','MANAGE')
assigned_at     TIMESTAMPassigned_by     UUID REFERENCES User(id)
PRIMARY KEY (user_id, location_id)
```

### Transaction Entities (Updated)

### Delivery

```sql
id              UUID PRIMARY KEYdelivery_no     VARCHAR(20) UNIQUEperiod_id       UUID REFERENCES Period(id)
location_id     UUID REFERENCES Location(id)    -- NEW: Location specificsupplier_id     UUID REFERENCES Supplier(id)
po_id           UUID REFERENCES PO(id)          -- Optionalinvoice_no      VARCHAR(50)
delivery_note   VARCHAR(50)
delivery_date   DATE NOT NULLtotal_amount    DECIMAL(12,2)
has_variance    BOOLEAN DEFAULT FALSE           -- NEW: Price variance flagposted_by       UUID REFERENCES User(id)
posted_at       TIMESTAMP
```

### DeliveryLine

```sql
id              UUID PRIMARY KEYdelivery_id     UUID REFERENCES Delivery(id)
item_id         UUID REFERENCES Item(id)
quantity        DECIMAL(12,3) NOT NULLunit_price      DECIMAL(10,4) NOT NULLperiod_price    DECIMAL(10,4)                   -- NEW: Expected period priceprice_variance  DECIMAL(10,4)                   -- NEW: Actual - Expectedline_value      DECIMAL(12,2)
ncr_id          UUID REFERENCES NCR(id)         -- NEW: Auto-generated NCR
```

### Issue

```sql
id              UUID PRIMARY KEYissue_no        VARCHAR(20) UNIQUEperiod_id       UUID REFERENCES Period(id)
location_id     UUID REFERENCES Location(id)     -- NEW: Location specificissue_date      DATE NOT NULLcost_centre     ENUM('FOOD','CLEAN','OTHER')
total_value     DECIMAL(12,2)
posted_by       UUID REFERENCES User(id)
posted_at       TIMESTAMP
```

### Control Entities (Updated)

### NCR

```sql
id              UUID PRIMARY KEYncr_no          VARCHAR(20) UNIQUElocation_id     UUID REFERENCES Location(id)
type            ENUM('MANUAL','PRICE_VARIANCE')  -- NEW: Type fieldauto_generated  BOOLEAN DEFAULT FALSE            -- NEW: System generateddelivery_id     UUID REFERENCES Delivery(id)
delivery_line   UUID REFERENCES DeliveryLine(id)
reason          VARCHAR(200)
quantity        DECIMAL(12,3)
value           DECIMAL(12,2)
status          ENUM('OPEN','SENT','CREDITED','REJECTED','RESOLVED')
created_by      UUID REFERENCES User(id)         -- NULL if auto-generatedcreated_at      TIMESTAMPresolved_at     TIMESTAMP
```

### Reconciliation

```sql
id              UUID PRIMARY KEYperiod_id       UUID REFERENCES Period(id)
location_id     UUID REFERENCES Location(id)     -- NEW: Per locationopening_stock   DECIMAL(12,2)
receipts        DECIMAL(12,2)
transfers_in    DECIMAL(12,2)                    -- NEWtransfers_out   DECIMAL(12,2)                    -- NEWissues          DECIMAL(12,2)
closing_stock   DECIMAL(12,2)
adjustments     DECIMAL(12,2)
back_charges    DECIMAL(12,2)
credits         DECIMAL(12,2)
condemnations   DECIMAL(12,2)
consumption     DECIMAL(12,2) GENERATED          -- Calculatedmanday_cost     DECIMAL(10,4) GENERATED          -- Calculatedlast_updated    TIMESTAMP
```

### POB

```sql
id              UUID PRIMARY KEYperiod_id       UUID REFERENCES Period(id)
location_id     UUID REFERENCES Location(id)     -- NEW: Per locationdate            DATE NOT NULLcrew_count      INTEGER DEFAULT 0extra_count     INTEGER DEFAULT 0total_count     INTEGER GENERATED (crew + extra)
entered_by      UUID REFERENCES User(id)
entered_at      TIMESTAMPUNIQUE(period_id, location_id, date)
```

### Approval (NEW)

```sql
id              UUID PRIMARY KEYentity_type     ENUM('PRF','PO','PERIOD_CLOSE','TRANSFER')
entity_id       UUID NOT NULL                    -- ID of entity being approvedstatus          ENUM('PENDING','APPROVED','REJECTED')
requested_by    UUID REFERENCES User(id)
requested_at    TIMESTAMPreviewed_by     UUID REFERENCES User(id)
reviewed_at     TIMESTAMPcomments        TEXT
```

## 3) Business Rules (Updated)

### Stock Management

1. **Location Isolation:** Each location maintains independent stock levels
2. **WAC per Location:** Each location calculates its own WAC
3. **No Negative Stock:** Issues blocked if would exceed location on-hand
4. **Transfer at WAC:** Items transfer at source locationâ€™s current WAC

### Price Control (NEW)

1. **Period Prices:** Prices fixed at period start via ItemPrice
2. **Automatic Variance Detection:** System compares delivery price to period price
3. **Auto-NCR Generation:** Price variances automatically create NCRs
4. **Variance Tracking:** DeliveryLine stores both actual and expected prices

### Period Management

1. **Simultaneous Close:** All locations must close together
2. **Approval Required:** Admin must approve period close
3. **Location Readiness:** Each location marks ready independently
4. **Snapshot per Location:** Closing creates snapshots for each location

### Approvals

1. **PRF/PO:** Require Supervisor approval
2. **Transfers:** Require Supervisor approval
3. **Period Close:** Requires Admin approval
4. **Issues:** No approval needed
5. **Reconciliations:** No approval needed

## 4) Key Relationships (ERD)

```mermaid
erDiagram
    Location ||--o{ LocationStock : has
    Location ||--o{ UserLocation : assigns
    Location ||--o{ Transfer : from
    Location ||--o{ Transfer : to
    Location ||--o{ Delivery : receives
    Location ||--o{ Issue : consumes
    Location ||--o{ PeriodLocation : tracks
    Location ||--o{ POB : counts
    Location ||--o{ Reconciliation : reconciles

    Item ||--o{ LocationStock : stored
    Item ||--o{ ItemPrice : priced
    Item ||--o{ DeliveryLine : delivered
    Item ||--o{ IssueLine : issued
    Item ||--o{ TransferLine : transferred

    Period ||--o{ PeriodLocation : contains
    Period ||--o{ ItemPrice : defines
    Period ||--o{ Delivery : includes
    Period ||--o{ Issue : includes
    Period ||--o{ POB : tracks
    Period ||--o{ Reconciliation : summarizes

    Transfer ||--o{ TransferLine : contains
    Delivery ||--o{ DeliveryLine : contains
    Delivery ||--o{ NCR : generates
    Issue ||--o{ IssueLine : contains

    User ||--o{ UserLocation : assigned
    User ||--o{ Approval : reviews

    DeliveryLine ||--o| NCR : triggers
```

## 5) Indexes for Performance

```sql
-- Location queriesCREATE INDEX idx_location_stock_location ON LocationStock(location_id);
CREATE INDEX idx_delivery_location_period ON Delivery(location_id, period_id);
CREATE INDEX idx_issue_location_period ON Issue(location_id, period_id);
-- Transfer queriesCREATE INDEX idx_transfer_from_to ON Transfer(from_location, to_location);
CREATE INDEX idx_transfer_status ON Transfer(status);
-- Price variance queriesCREATE INDEX idx_delivery_line_variance ON DeliveryLine(price_variance) WHERE price_variance IS NOT NULL;
CREATE INDEX idx_ncr_auto_generated ON NCR(auto_generated, status);
-- Period operationsCREATE INDEX idx_period_location_status ON PeriodLocation(period_id, status);
CREATE INDEX idx_item_price_period ON ItemPrice(period_id);
-- User accessCREATE INDEX idx_user_location_user ON UserLocation(user_id);
```

## 6) Sample Queries

### Get Location Stock Status

```sql
SELECT
    i.code,
    i.name,
    ls.on_hand,
    ls.wac,
    (ls.on_hand * ls.wac) as valueFROM LocationStock ls
JOIN Item i ON ls.item_id = i.idWHERE ls.location_id = ?
AND ls.on_hand > 0ORDER BY i.category, i.name;
```

### Check Price Variance

```sql
SELECT
    d.delivery_no,
    i.name as item,
    dl.quantity,
    dl.unit_price as actual_price,
    dl.period_price as expected_price,
    dl.price_variance,
    n.ncr_no
FROM DeliveryLine dl
JOIN Delivery d ON dl.delivery_id = d.idJOIN Item i ON dl.item_id = i.idLEFT JOIN NCR n ON dl.ncr_id = n.idWHERE d.period_id = ?
AND dl.price_variance IS NOT NULL;
```

### Transfer Status

```sql
SELECT
    t.transfer_no,
    fl.name as from_location,
    tl.name as to_location,
    t.status,
    t.total_value,
    u.full_name as requested_by
FROM Transfer t
JOIN Location fl ON t.from_location = fl.idJOIN Location tl ON t.to_location = tl.idJOIN User u ON t.requested_by = u.idWHERE t.status = 'PENDING_APPROVAL';
```

## 7) Data Constraints

### Unique Constraints

- Location.code must be unique
- Item.code must be unique
- (item_id, period_id) unique in ItemPrice
- (period_id, location_id, date) unique in POB

### Referential Integrity

- Cannot delete Location with transactions
- Cannot delete Item with stock
- Cannot delete Period once closed
- Cascade delete TransferLines when Transfer deleted

### Check Constraints

```sql
ALTER TABLE LocationStock
    ADD CONSTRAINT chk_positive_stock CHECK (on_hand >= 0);
ALTER TABLE Transfer
    ADD CONSTRAINT chk_different_locations CHECK (from_location != to_location);
ALTER TABLE ItemPrice
    ADD CONSTRAINT chk_positive_price CHECK (price > 0);
```

## 8) Audit Requirements

All transaction tables include:
- Who: User reference
- When: Timestamp
- What: Complete record of changes
- Where: Location context

Audit log table structure:

```sql
CREATE TABLE AuditLog (
    id              UUID PRIMARY KEY,
    table_name      VARCHAR(50),
    record_id       UUID,
    location_id     UUID,
    action          ENUM('INSERT','UPDATE','DELETE'),
    old_values      JSONB,
    new_values      JSONB,
    user_id         UUID REFERENCES User(id),
    timestamp       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address      INET
);
```

## 9) Migration Considerations

### From Single to Multi-Location

1. Create default location for existing data
2. Migrate stock levels to LocationStock
3. Associate all transactions with default location
4. Set up location access for existing users
5. Create period prices from last known prices

### Data Seeding

```sql
-- Create default locationINSERT INTO Location (code, name, type)
VALUES ('DEFAULT', 'Main Location', 'CENTRAL');
-- Migrate existing stockINSERT INTO LocationStock (location_id, item_id, on_hand, wac)
SELECT (SELECT id FROM Location WHERE code = 'DEFAULT'),
       id, on_hand, wac
FROM Item WHERE on_hand > 0;
-- Set period pricesINSERT INTO ItemPrice (item_id, period_id, price)
SELECT id, ?, wac FROM Item;
```

## 10) Performance Optimization

### Partitioning Strategy

- Partition Delivery/Issue by period_id and location_id
- Partition AuditLog by month
- Archive closed periods after 24 months

### Caching Strategy

- Cache Location and Item master data
- Cache current period prices
- Cache user location access
- Invalidate on updates

### Query Optimization

- Materialized views for location dashboards
- Aggregate tables for period summaries
- Background jobs for report generation

---

**Note:** This data model supports efficient multi-location operations while maintaining data integrity and providing comprehensive audit trails. Automatic price variance detection and approval workflows ensure control while keeping operations smooth.