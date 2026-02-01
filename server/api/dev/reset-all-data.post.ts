/**
 * API Endpoint: Reset All Data (Development Only)
 *
 * This endpoint:
 * - Only works in development environment
 * - Clears all data from the database
 * - Preserves only the Admin account
 * - Resets admin password to default
 *
 * WARNING: This is a destructive operation meant for development only.
 */

import { hash } from "bcrypt";
import prisma from "../../utils/prisma";

export default defineEventHandler(async () => {
  // Block in production environment
  if (!import.meta.dev) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "DEV_ONLY",
        message: "This endpoint is only available in development mode",
      },
    });
  }

  try {
    // Delete in reverse dependency order to respect foreign key constraints

    // 1. Delete NCR notification logs (references NCR)
    await prisma.nCRNotificationLog.deleteMany({});

    // 2. Delete approval records (they reference transfers, PRFs, POs, periods)
    await prisma.approval.deleteMany({});

    // 3. Delete transaction line items
    await prisma.transferLine.deleteMany({});
    await prisma.issueLine.deleteMany({});
    await prisma.deliveryLine.deleteMany({});

    // 4. Delete NCRs (references deliveries, delivery lines)
    await prisma.nCR.deleteMany({});

    // 5. Delete POB entries and reconciliations
    await prisma.pOB.deleteMany({});
    await prisma.reconciliation.deleteMany({});

    // 6. Delete main transactions
    await prisma.issue.deleteMany({});
    await prisma.delivery.deleteMany({});
    await prisma.transfer.deleteMany({});

    // 7. Delete purchase line items
    await prisma.pOLine.deleteMany({});
    await prisma.pRFLine.deleteMany({});

    // 8. Delete purchase documents
    await prisma.pO.deleteMany({});
    await prisma.pRF.deleteMany({});

    // 9. Delete item prices and location stock
    await prisma.itemPrice.deleteMany({});
    await prisma.locationStock.deleteMany({});

    // 10. Delete period-location mappings and periods
    await prisma.periodLocation.deleteMany({});
    await prisma.period.deleteMany({});

    // 11. Delete items and suppliers
    await prisma.item.deleteMany({});
    await prisma.supplier.deleteMany({});

    // 12. Delete notification settings
    await prisma.notificationSetting.deleteMany({});

    // 13. Delete user-location mappings
    await prisma.userLocation.deleteMany({});

    // 14. Delete locations
    await prisma.location.deleteMany({});

    // 15. Delete all users EXCEPT admin
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

    return {
      success: true,
      message: "Database reset complete. Only Admin account remains.",
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
