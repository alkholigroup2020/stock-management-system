# Production Migration Notes

## Baseline without reset

If production already has schema changes (manual SQL or out-of-band updates), do not reset. Instead:

1) Ensure the change exists in DB (apply SQL manually if needed).
2) Create a matching Prisma migration file in `prisma/migrations/`.
3) Mark migrations as applied with `pnpm prisma migrate resolve --applied <migration_name>`.

This keeps Prisma migration history aligned without dropping data.

## Example: deliveries.invoice_no unique index

Commands used:

```bash
# Update duplicate invoice to unblock the unique index
@'
const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const updated = await prisma.delivery.update({
    where: { id: 'dd15cf9f-460c-460a-9ac4-e72d704f57f6' },
    data: { invoice_no: '112233' },
    select: { id: true, delivery_no: true, invoice_no: true },
  });
  console.log(JSON.stringify(updated, null, 2));
  await prisma.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
'@ | node

# Create unique index (non-null only)
@'
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "deliveries_invoice_no_key"
ON "deliveries" ("invoice_no")
WHERE "invoice_no" IS NOT NULL;
'@ | pnpm prisma db execute --stdin --schema prisma/schema.prisma

# Create migration file (manual)
$migrationName = "20260117154500_add_unique_delivery_invoice_no"
$path = Join-Path "prisma/migrations" $migrationName
New-Item -ItemType Directory -Path $path -Force | Out-Null
@'
-- Ensure unique invoice numbers for deliveries (allows multiple NULLs)
CREATE UNIQUE INDEX "deliveries_invoice_no_key" ON "deliveries" ("invoice_no") WHERE ("invoice_no" IS NOT NULL);
'@ | Set-Content -Path (Join-Path $path "migration.sql") -NoNewline

# Baseline migrations in production
pnpm prisma migrate resolve --applied 20251106073237_initial_schema --schema prisma/schema.prisma
pnpm prisma migrate resolve --applied 20260117154500_add_unique_delivery_invoice_no --schema prisma/schema.prisma
```
