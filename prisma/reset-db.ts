import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log("🗑️  Starting database reset...\n");
  console.log("⚠️  This will delete ALL data except the admin user!\n");

  try {
    // Delete in reverse order of dependencies

    // 1. Delete all reconciliations
    const reconciliations = await prisma.reconciliation.deleteMany({});
    console.log(`✓ Deleted ${reconciliations.count} reconciliation records`);

    // 2. Delete all POB entries
    const pobs = await prisma.pOB.deleteMany({});
    console.log(`✓ Deleted ${pobs.count} POB records`);

    // 3. Delete all approvals
    const approvals = await prisma.approval.deleteMany({});
    console.log(`✓ Deleted ${approvals.count} approval records`);

    // 4. Delete all NCRs
    const ncrs = await prisma.nCR.deleteMany({});
    console.log(`✓ Deleted ${ncrs.count} NCR records`);

    // 5. Delete all transfer lines
    const transferLines = await prisma.transferLine.deleteMany({});
    console.log(`✓ Deleted ${transferLines.count} transfer line records`);

    // 6. Delete all transfers
    const transfers = await prisma.transfer.deleteMany({});
    console.log(`✓ Deleted ${transfers.count} transfer records`);

    // 7. Delete all issue lines
    const issueLines = await prisma.issueLine.deleteMany({});
    console.log(`✓ Deleted ${issueLines.count} issue line records`);

    // 8. Delete all issues
    const issues = await prisma.issue.deleteMany({});
    console.log(`✓ Deleted ${issues.count} issue records`);

    // 9. Delete all delivery lines
    const deliveryLines = await prisma.deliveryLine.deleteMany({});
    console.log(`✓ Deleted ${deliveryLines.count} delivery line records`);

    // 10. Delete all deliveries
    const deliveries = await prisma.delivery.deleteMany({});
    console.log(`✓ Deleted ${deliveries.count} delivery records`);

    // 11. Delete all PO lines (if any) - PO doesn't have lines in current schema, skip

    // 12. Delete all POs
    const pos = await prisma.pO.deleteMany({});
    console.log(`✓ Deleted ${pos.count} PO records`);

    // 13. Delete all PRFs
    const prfs = await prisma.pRF.deleteMany({});
    console.log(`✓ Deleted ${prfs.count} PRF records`);

    // 14. Delete all location stock
    const locationStock = await prisma.locationStock.deleteMany({});
    console.log(`✓ Deleted ${locationStock.count} location stock records`);

    // 15. Delete all item prices
    const itemPrices = await prisma.itemPrice.deleteMany({});
    console.log(`✓ Deleted ${itemPrices.count} item price records`);

    // 16. Delete all period locations
    const periodLocations = await prisma.periodLocation.deleteMany({});
    console.log(`✓ Deleted ${periodLocations.count} period location records`);

    // 17. Delete all periods
    const periods = await prisma.period.deleteMany({});
    console.log(`✓ Deleted ${periods.count} period records`);

    // 18. Delete all user locations
    const userLocations = await prisma.userLocation.deleteMany({});
    console.log(`✓ Deleted ${userLocations.count} user location records`);

    // 19. Delete all suppliers
    const suppliers = await prisma.supplier.deleteMany({});
    console.log(`✓ Deleted ${suppliers.count} supplier records`);

    // 20. Delete all items
    const items = await prisma.item.deleteMany({});
    console.log(`✓ Deleted ${items.count} item records`);

    // 21. Delete all locations
    const locations = await prisma.location.deleteMany({});
    console.log(`✓ Deleted ${locations.count} location records`);

    // 22. Delete all non-admin users
    const users = await prisma.user.deleteMany({
      where: {
        role: { not: "ADMIN" },
      },
    });
    console.log(`✓ Deleted ${users.count} non-admin user records`);

    // 23. Clear admin's default_location_id (since locations are deleted)
    await prisma.user.updateMany({
      where: { role: "ADMIN" },
      data: { default_location_id: null },
    });
    console.log(`✓ Cleared admin default location`);

    // Verify admin user remains
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    console.log("\n" + "═".repeat(50));
    console.log("✅ DATABASE RESET COMPLETE!");
    console.log("═".repeat(50));

    if (adminUser) {
      console.log("\n📋 Remaining Admin Account:");
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Username: ${adminUser.username}`);
      console.log(`   Name: ${adminUser.full_name}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log("\n🔐 Password: Admin@123");
    } else {
      console.log("\n⚠️  WARNING: No admin user found in database!");
      console.log("   You may need to run the seed script to create one.");
    }

    console.log("\n📊 Database is now empty (except admin user).");
    console.log("   Ready for end-to-end testing!\n");
  } catch (error) {
    console.error("\n❌ Reset failed with error:");
    console.error(error);
    process.exit(1);
  }
}

resetDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
