import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const periodLocations = await prisma.periodLocation.findMany({
    include: { location: true, period: true },
  });
  console.log("Period Locations:");
  periodLocations.forEach((pl) => {
    console.log(
      `  - ${pl.location.name} (${pl.location.id}): status=${pl.status}, ready_at=${pl.ready_at}`
    );
  });

  const reconciliations = await prisma.reconciliation.findMany({
    include: { location: true },
  });
  console.log("\nReconciliations:");
  reconciliations.forEach((r) => {
    console.log(`  - ${r.location.name}: period=${r.period_id}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
