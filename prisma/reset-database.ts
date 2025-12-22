/**
 * Database Reset Script - Phase 0 of End-to-End Testing
 *
 * This script clears all data from the database while preserving
 * only the Admin account. It respects foreign key constraints by
 * deleting tables in the correct order.
 *
 * Usage: npx tsx prisma/reset-database.ts
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log("🔄 Starting database reset (Phase 0)...\n");

  try {
    // Delete in reverse dependency order to respect foreign key constraints
    console.log("🗑️  Deleting all data...\n");

    // 1. Delete approval records first (they reference transfers, PRFs, POs, periods)
    const approvalCount = await prisma.approval.deleteMany({});
    console.log(`  ✓ Deleted ${approvalCount.count} approval records`);

    // 2. Delete transaction line items
    const transferLineCount = await prisma.transferLine.deleteMany({});
    console.log(`  ✓ Deleted ${transferLineCount.count} transfer lines`);

    const issueLineCount = await prisma.issueLine.deleteMany({});
    console.log(`  ✓ Deleted ${issueLineCount.count} issue lines`);

    const deliveryLineCount = await prisma.deliveryLine.deleteMany({});
    console.log(`  ✓ Deleted ${deliveryLineCount.count} delivery lines`);

    // 3. Delete NCRs (references deliveries, delivery lines)
    const ncrCount = await prisma.nCR.deleteMany({});
    console.log(`  ✓ Deleted ${ncrCount.count} NCR records`);

    // 4. Delete POB entries
    const pobCount = await prisma.pOB.deleteMany({});
    console.log(`  ✓ Deleted ${pobCount.count} POB entries`);

    // 5. Delete reconciliations
    const reconciliationCount = await prisma.reconciliation.deleteMany({});
    console.log(`  ✓ Deleted ${reconciliationCount.count} reconciliations`);

    // 6. Delete main transactions
    const issueCount = await prisma.issue.deleteMany({});
    console.log(`  ✓ Deleted ${issueCount.count} issues`);

    const deliveryCount = await prisma.delivery.deleteMany({});
    console.log(`  ✓ Deleted ${deliveryCount.count} deliveries`);

    const transferCount = await prisma.transfer.deleteMany({});
    console.log(`  ✓ Deleted ${transferCount.count} transfers`);

    // 7. Delete purchase documents
    const poCount = await prisma.pO.deleteMany({});
    console.log(`  ✓ Deleted ${poCount.count} purchase orders`);

    const prfCount = await prisma.pRF.deleteMany({});
    console.log(`  ✓ Deleted ${prfCount.count} purchase request forms`);

    // 8. Delete item prices
    const itemPriceCount = await prisma.itemPrice.deleteMany({});
    console.log(`  ✓ Deleted ${itemPriceCount.count} item prices`);

    // 9. Delete location stock
    const locationStockCount = await prisma.locationStock.deleteMany({});
    console.log(`  ✓ Deleted ${locationStockCount.count} location stock records`);

    // 10. Delete period-location mappings
    const periodLocationCount = await prisma.periodLocation.deleteMany({});
    console.log(`  ✓ Deleted ${periodLocationCount.count} period-location mappings`);

    // 11. Delete periods
    const periodCount = await prisma.period.deleteMany({});
    console.log(`  ✓ Deleted ${periodCount.count} periods`);

    // 12. Delete items
    const itemCount = await prisma.item.deleteMany({});
    console.log(`  ✓ Deleted ${itemCount.count} items`);

    // 13. Delete suppliers
    const supplierCount = await prisma.supplier.deleteMany({});
    console.log(`  ✓ Deleted ${supplierCount.count} suppliers`);

    // 14. Delete user-location mappings
    const userLocationCount = await prisma.userLocation.deleteMany({});
    console.log(`  ✓ Deleted ${userLocationCount.count} user-location mappings`);

    // 15. Delete locations
    const locationCount = await prisma.location.deleteMany({});
    console.log(`  ✓ Deleted ${locationCount.count} locations`);

    // 16. Delete all users EXCEPT admin
    const userCount = await prisma.user.deleteMany({
      where: {
        email: {
          not: "admin@foodstock.local",
        },
      },
    });
    console.log(`  ✓ Deleted ${userCount.count} non-admin users`);

    // Ensure admin user exists
    console.log("\n👤 Ensuring admin user exists...");

    const adminPassword = await hash("Admin@123", 10);

    const adminUser = await prisma.user.upsert({
      where: { email: "admin@foodstock.local" },
      update: {
        // Reset admin to default state
        password_hash: adminPassword,
        is_active: true,
        default_location_id: null,
      },
      create: {
        username: "admin",
        email: "admin@foodstock.local",
        full_name: "System Administrator",
        role: "ADMIN",
        password_hash: adminPassword,
        is_active: true,
      },
    });

    console.log(`  ✓ Admin user verified: ${adminUser.email}`);

    // Verify final state
    console.log("\n📊 Verification...");
    const finalUserCount = await prisma.user.count();
    const finalLocationCount = await prisma.location.count();
    const finalPeriodCount = await prisma.period.count();
    const finalItemCount = await prisma.item.count();

    console.log(`  Users: ${finalUserCount} (should be 1 - Admin only)`);
    console.log(`  Locations: ${finalLocationCount} (should be 0)`);
    console.log(`  Periods: ${finalPeriodCount} (should be 0)`);
    console.log(`  Items: ${finalItemCount} (should be 0)`);

    if (finalUserCount === 1) {
      console.log("\n✅ Database reset complete! Only Admin account remains.");
      console.log("   Email: admin@foodstock.local");
      console.log("   Password: Admin@123");
    } else {
      console.log(`\n⚠️  Warning: Expected 1 user but found ${finalUserCount}`);
    }
  } catch (error) {
    console.error("\n❌ Reset failed with error:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the reset
resetDatabase();
