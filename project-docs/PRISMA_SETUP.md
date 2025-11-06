# Prisma Setup Documentation

## Overview

Prisma has been successfully installed and configured for the Food Stock Control System. This document provides information about the setup, configuration, and known issues.

## Installation Status

✅ **Completed Tasks:**
- Prisma CLI and client installed (`@prisma/client@6.18.0` and `prisma@6.18.0`)
- Base Prisma schema created at `prisma/schema.prisma`
- PostgreSQL datasource configured
- Prisma client generator configured
- Database scripts added to `package.json`
- Prisma client utility created at `server/utils/prisma.ts`
- Health check endpoint created at `server/api/health.get.ts`

## Configuration

### Database Connection

The Prisma schema is configured to connect to the Supabase PostgreSQL database:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

The `DATABASE_URL` is stored in the `.env` file and follows this format:
```
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.skcpaeldwokskcqcrfyo.supabase.co:5432/postgres"
```

### Prisma Client

The Prisma client is configured with the standard generator:

```prisma
generator client {
  provider = "prisma-client-js"
}
```

## Available Database Scripts

The following npm scripts have been added to `package.json`:

| Script | Command | Description |
|--------|---------|-------------|
| `db:push` | `prisma db push` | Push schema changes to database (dev only) |
| `db:migrate` | `prisma migrate dev` | Create and apply migrations (development) |
| `db:migrate:deploy` | `prisma migrate deploy` | Apply migrations (production) |
| `db:studio` | `prisma studio` | Open Prisma Studio GUI |
| `db:generate` | `prisma generate` | Generate Prisma Client |
| `db:seed` | `tsx prisma/seed.ts` | Run database seed script (when created) |

## Usage

### Importing Prisma Client

In server-side code, import the Prisma client from the utility file:

```typescript
import prisma from '../utils/prisma'

// Example usage
const users = await prisma.user.findMany()
```

The utility file (`server/utils/prisma.ts`) ensures:
- Single instance in development (prevents hot reload issues)
- Proper logging configuration
- Global TypeScript type definitions

### Health Check Endpoint

A health check endpoint is available at `/api/health` that:
- Tests the Prisma client initialization
- Attempts to connect to the database
- Returns status information

Example response:
```json
{
  "status": "healthy|degraded",
  "timestamp": "2025-11-05T11:58:09.332Z",
  "database": "connected|disconnected",
  "prisma": "initialized"
}
```

## ✅ Database Connection - RESOLVED

### Working Configuration

The database connection is successfully configured using Supabase's **Session mode connection pooler**.

**Key Requirement:** Supabase does not allow direct database connections via `db.*.supabase.co:5432`. You **must** use the connection pooler at `pooler.supabase.com`.

**Correct DATABASE_URL Format:**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-[REGION-NUMBER]-[REGION].pooler.supabase.com:5432/postgres
```

**Example:**
```
DATABASE_URL="postgresql://postgres.skcpaeldwokskcqcrfyo:hhS2Y7XyhN39jyNm@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
```

### How to Get the Correct Connection String

1. Go to your Supabase dashboard: `https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/settings/database`
2. Scroll to **"Connection string"** section
3. Select **"Session"** mode (NOT "URI" or "Transaction")
4. Copy the connection string shown
5. Replace `[YOUR-PASSWORD]` with your actual database password
6. Paste it into your `.env` file as `DATABASE_URL`

### Why Direct Connections Don't Work

Supabase disables direct database connections (`db.*.supabase.co:5432`) for security and performance reasons. The hostname `db.*.supabase.co` doesn't even resolve via DNS. All Prisma connections must go through Supabase's connection pooler (`pooler.supabase.com`).

**Important:** If you see errors referencing `db.*.supabase.co`, you're using the wrong connection string format. Always use the Session pooler URL from the Supabase dashboard.

## Verification

You can verify the connection is working by:

1. **Test with health endpoint:**
   ```bash
   pnpm dev
   # Then visit http://localhost:3000/api/health
   # Should show: "status": "healthy", "database": "connected"
   ```

2. **Test with Prisma:**
   ```bash
   pnpm prisma db pull
   # Should connect successfully (even if database is empty)
   ```

3. **Test with Node script:**
   ```bash
   node test-prisma-connection.mjs
   # Should show: ✅ SUCCESS! Database connection working!
   ```

## Next Steps

✅ Database connection is working! Ready to proceed with:

1. ✅ Test database connection: `pnpm prisma db pull` - **WORKING**
2. ✅ Verify health endpoint returns `"database": "connected"` - **CONFIRMED**
3. ✅ Proceed with schema definition (Tasks 1.2.3 - 1.2.7) - **READY**
4. ✅ Run first migration: `pnpm db:migrate`
5. ✅ Test Prisma Studio: `pnpm db:studio`

## Prisma Client Generation

The Prisma client is automatically generated:
- On `pnpm install` (via postinstall hook)
- When running `pnpm db:generate`
- After running migrations

## Database Schema

Currently, the schema only contains the base configuration. The following models will be added in subsequent tasks:

- **Task 1.2.3:** Core entities (User, Location, UserLocation, Item, Supplier)
- **Task 1.2.4:** Period & Stock models (Period, PeriodLocation, ItemPrice, LocationStock)
- **Task 1.2.5:** Transaction models (PRF, PO, Delivery, DeliveryLine, Issue, IssueLine)
- **Task 1.2.6:** Transfer models (Transfer, TransferLine)
- **Task 1.2.7:** Control models (NCR, POB, Reconciliation, Approval)
- **Task 1.2.8:** Indexes & Relations

## Troubleshooting

### "Can't reach database server" Error

See [Known Issues](#database-connection-issue) section above.

### Prisma Client Not Found

Run:
```bash
pnpm db:generate
```

### Import Errors in Server Code

Ensure you're using the correct import path:
```typescript
// ✅ Correct
import prisma from '../utils/prisma'

// ❌ Incorrect
import prisma from '~/server/utils/prisma'
```

### Hot Reload Issues

The singleton pattern in `server/utils/prisma.ts` prevents multiple instances during development hot reloads.

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [Nuxt Server Directory](https://nuxt.com/docs/guide/directory-structure/server)

---

**Last Updated:** November 5, 2025
**Prisma Version:** 6.18.0
**Task:** 1.2.2 Prisma Setup
