# Database Migration Guide

**Project:** Food Stock Control System - Multi-Location
**Database:** PostgreSQL 15+ on Supabase
**ORM:** Prisma 6.18.0

---

## Initial Migration (November 6, 2025)

### Migration Details

- **Migration Name:** `20251106073237_initial_schema`
- **Status:** ✅ Successfully applied
- **Tables Created:** 22 application tables
- **Enums Created:** 14 custom enums
- **Indexes Created:** 81 performance indexes
- **Foreign Keys:** All relations properly established

### Tables Created

1. **Core Entities:**
   - `users` - System users with role-based access
   - `locations` - Physical sites (Kitchen, Store, Central, Warehouse)
   - `user_locations` - Join table for location access control
   - `items` - Global product master
   - `suppliers` - Vendor management

2. **Period & Stock Management:**
   - `periods` - Monthly accounting periods
   - `period_locations` - Per-location period states
   - `item_prices` - Price locking per period
   - `location_stock` - Real-time inventory per location

3. **Transaction Models:**
   - `prfs` - Purchase Request Forms
   - `purchase_orders` - Purchase Orders
   - `deliveries` - Goods receipt transactions
   - `delivery_lines` - Delivery line items
   - `issues` - Stock consumption transactions
   - `issue_lines` - Issue line items

4. **Transfer Models:**
   - `transfers` - Inter-location stock transfers
   - `transfer_lines` - Transfer line items

5. **Control Models:**
   - `ncrs` - Non-Conformance Reports
   - `pob` - People on Board (headcount)
   - `reconciliations` - Period-end reporting
   - `approvals` - Generic approval workflow

### Enums Created

1. `UserRole` - OPERATOR, SUPERVISOR, ADMIN
2. `LocationType` - KITCHEN, STORE, CENTRAL, WAREHOUSE
3. `AccessLevel` - VIEW, POST, MANAGE
4. `Unit` - KG, EA, LTR, BOX, CASE, PACK
5. `PeriodStatus` - DRAFT, OPEN, PENDING_CLOSE, APPROVED, CLOSED
6. `PeriodLocationStatus` - OPEN, READY, CLOSED
7. `PRFStatus` - DRAFT, PENDING, APPROVED, REJECTED
8. `POStatus` - OPEN, CLOSED
9. `CostCentre` - FOOD, CLEAN, OTHER
10. `TransferStatus` - DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, COMPLETED
11. `NCRType` - MANUAL, PRICE_VARIANCE
12. `NCRStatus` - OPEN, SENT, CREDITED, REJECTED, RESOLVED
13. `ApprovalEntityType` - PRF, PO, PERIOD_CLOSE, TRANSFER
14. `ApprovalStatus` - PENDING, APPROVED, REJECTED

---

## Migration Commands

### Development Workflow

```bash
# 1. Generate Prisma Client (after schema changes)
pnpm prisma generate

# 2. Create and apply migration (development)
pnpm prisma migrate dev --name migration_name

# 3. View database in Prisma Studio
pnpm db:studio
# Opens at http://localhost:5555

# 4. Reset database (WARNING: deletes all data)
pnpm prisma migrate reset
```

### Production Deployment

```bash
# Apply pending migrations (production)
pnpm prisma migrate deploy

# Verify migration status
pnpm prisma migrate status
```

---

## Database Verification

After migration, verify the database state:

```bash
# Check all tables are created
pnpm prisma db pull

# Validate schema is in sync
pnpm prisma validate

# Open Prisma Studio to inspect tables
pnpm db:studio
```

---

## Schema Constraints

The following check constraints should be implemented in future migrations for data integrity:

1. **Positive Stock Check:**
   ```sql
   ALTER TABLE location_stock ADD CONSTRAINT check_positive_stock
   CHECK (on_hand >= 0);
   ```

2. **Positive WAC Check:**
   ```sql
   ALTER TABLE location_stock ADD CONSTRAINT check_positive_wac
   CHECK (wac >= 0);
   ```

3. **Positive Price Check:**
   ```sql
   ALTER TABLE item_prices ADD CONSTRAINT check_positive_price
   CHECK (price > 0);
   ```

4. **Different Locations for Transfers:**
   ```sql
   ALTER TABLE transfers ADD CONSTRAINT check_different_locations
   CHECK (from_location_id != to_location_id);
   ```

5. **Positive Quantity Checks** (on all transaction lines)
6. **Positive Value Checks** (on all transactions)
7. **Positive People Count** (on POB)
8. **Period Date Range** (end_date > start_date)

---

## Connection Configuration

### Environment Variables

```bash
# Connection pooler for Supabase (Session mode)
DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

# Direct connection (for migrations)
DIRECT_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Important:** Use the session pooler URL (port 5432) for migrations, not the direct connection (port 6543).

---

## Performance Indexes

The migration includes 81 strategic indexes for optimal query performance:

- **Single-field indexes:** Role, status, dates, foreign keys
- **Composite indexes:** Common query patterns (period + location, location + status, etc.)
- **Unique constraints:** Business keys (codes, numbers) and composite keys

See `prisma/schema.prisma` for complete index definitions.

---

## Troubleshooting

### Migration Fails

```bash
# Check database connection
pnpm prisma db execute --stdin <<< "SELECT 1"

# View migration history
pnpm prisma migrate status

# Resolve migration drift
pnpm prisma migrate resolve --applied migration_name
```

### Schema Drift

```bash
# Compare schema with database
pnpm prisma migrate diff

# Pull current database schema
pnpm prisma db pull
```

---

## Next Steps

1. **Seed Data** (Task 1.2.10): Create development seed data
2. **Authentication** (Task 1.3.x): Implement auth system
3. **API Routes** (Task 1.4.x): Build business logic endpoints

---

**Last Updated:** November 6, 2025
**Migration Version:** 20251106073237_initial_schema
