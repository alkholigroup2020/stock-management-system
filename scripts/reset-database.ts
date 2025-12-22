import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log("🔄 Starting database reset...");
  console.log("⚠️  This will delete ALL data except Admin users.\n");

  try {
    // Delete in order respecting foreign key constraints
    console.log("Deleting Reconciliation records...");
    await prisma.reconciliation.deleteMany();

    console.log("Deleting POB records...");
    await prisma.pOB.deleteMany();

    console.log("Deleting Approval records...");
    await prisma.approval.deleteMany();

    console.log("Deleting NCR records...");
    await prisma.nCR.deleteMany();

    console.log("Deleting TransferLine records...");
    await prisma.transferLine.deleteMany();

    console.log("Deleting Transfer records...");
    await prisma.transfer.deleteMany();

    console.log("Deleting IssueLine records...");
    await prisma.issueLine.deleteMany();

    console.log("Deleting Issue records...");
    await prisma.issue.deleteMany();

    console.log("Deleting DeliveryLine records...");
    await prisma.deliveryLine.deleteMany();

    console.log("Deleting Delivery records...");
    await prisma.delivery.deleteMany();

    console.log("Deleting PO records...");
    await prisma.pO.deleteMany();

    console.log("Deleting PRF records...");
    await prisma.pRF.deleteMany();

    console.log("Deleting LocationStock records...");
    await prisma.locationStock.deleteMany();

    console.log("Deleting ItemPrice records...");
    await prisma.itemPrice.deleteMany();

    console.log("Deleting PeriodLocation records...");
    await prisma.periodLocation.deleteMany();

    console.log("Deleting Period records...");
    await prisma.period.deleteMany();

    console.log("Deleting UserLocation records...");
    await prisma.userLocation.deleteMany();

    console.log("Deleting Supplier records...");
    await prisma.supplier.deleteMany();

    console.log("Deleting Item records...");
    await prisma.item.deleteMany();

    console.log("Deleting Location records...");
    await prisma.location.deleteMany();

    console.log("Deleting non-Admin User records...");
    await prisma.user.deleteMany({
      where: {
        role: {
          not: "ADMIN",
        },
      },
    });

    // Verify results
    const remainingUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    console.log("\n✅ Database reset complete!");
    console.log("\n📋 Remaining users:");
    remainingUsers.forEach((user) => {
      console.log(`  - ${user.username} (${user.email}) - ${user.role}`);
    });

    // Count remaining records in each table
    const counts = {
      locations: await prisma.location.count(),
      items: await prisma.item.count(),
      suppliers: await prisma.supplier.count(),
      periods: await prisma.period.count(),
      deliveries: await prisma.delivery.count(),
      issues: await prisma.issue.count(),
      transfers: await prisma.transfer.count(),
      ncrs: await prisma.nCR.count(),
    };

    console.log("\n📊 Table counts (should all be 0):");
    Object.entries(counts).forEach(([table, count]) => {
      const status = count === 0 ? "✅" : "❌";
      console.log(`  ${status} ${table}: ${count}`);
    });
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
