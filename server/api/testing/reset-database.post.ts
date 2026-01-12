/**
 * API Endpoint: Reset Database for Testing
 *
 * This endpoint performs Phase 0 of the testing plan:
 * - Clears all data from the database
 * - Preserves only the Admin account
 * - Resets admin password to default
 *
 * WARNING: This is a destructive operation meant for testing purposes only.
 */

import { hash } from "bcrypt";
import prisma from "../../utils/prisma";

export default defineEventHandler(async () => {
  try {
    // Delete in reverse dependency order to respect foreign key constraints

    // 1. Delete approval records first (they reference transfers, PRFs, POs, periods)
    await prisma.approval.deleteMany({});

    // 2. Delete transaction line items
    await prisma.transferLine.deleteMany({});
    await prisma.issueLine.deleteMany({});
    await prisma.deliveryLine.deleteMany({});

    // 3. Delete NCRs (references deliveries, delivery lines)
    await prisma.nCR.deleteMany({});

    // 4. Delete POB entries
    await prisma.pOB.deleteMany({});

    // 5. Delete reconciliations
    await prisma.reconciliation.deleteMany({});

    // 6. Delete main transactions
    await prisma.issue.deleteMany({});
    await prisma.delivery.deleteMany({});
    await prisma.transfer.deleteMany({});

    // 7. Delete purchase documents
    await prisma.pO.deleteMany({});
    await prisma.pRF.deleteMany({});

    // 8. Delete item prices
    await prisma.itemPrice.deleteMany({});

    // 9. Delete location stock
    await prisma.locationStock.deleteMany({});

    // 10. Delete period-location mappings
    await prisma.periodLocation.deleteMany({});

    // 11. Delete periods
    await prisma.period.deleteMany({});

    // 12. Delete items
    await prisma.item.deleteMany({});

    // 13. Delete suppliers
    await prisma.supplier.deleteMany({});

    // 14. Delete user-location mappings
    await prisma.userLocation.deleteMany({});

    // 15. Delete locations
    await prisma.location.deleteMany({});

    // 16. Delete all users EXCEPT admin
    await prisma.user.deleteMany({
      where: {
        email: {
          not: "admin@foodstock.local",
        },
      },
    });

    // Ensure admin user exists with default password
    const adminPassword = await hash("Admin@123", 10);

    await prisma.user.upsert({
      where: { email: "admin@foodstock.local" },
      update: {
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

    // Verify final state
    const userCount = await prisma.user.count();
    const locationCount = await prisma.location.count();
    const periodCount = await prisma.period.count();
    const itemCount = await prisma.item.count();

    return {
      success: true,
      message: "Database reset complete. Only Admin account remains.",
      verification: {
        users: userCount,
        locations: locationCount,
        periods: periodCount,
        items: itemCount,
      },
      admin: {
        email: "admin@foodstock.local",
        password: "Admin@123",
      },
    };
  } catch (error) {
    console.error("Database reset failed:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Database reset failed",
      data: {
        code: "RESET_FAILED",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    });
  }
});
