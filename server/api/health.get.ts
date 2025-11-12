import prisma from "../utils/prisma";

/**
 * Health check endpoint
 * Tests database connection and returns system status
 *
 * Note: Database connection may fail if:
 * - Supabase database is not accessible from current network
 * - Connection pooling needs to be enabled in Supabase
 * - Firewall/network restrictions
 */
export default defineEventHandler(async () => {
  let databaseStatus = "unknown";
  let databaseError: string | null = null;

  try {
    // Test database connection by executing a simple query
    await prisma.$queryRaw`SELECT 1`;
    databaseStatus = "connected";
  } catch (error) {
    console.error("Database connection failed:", error);
    databaseStatus = "disconnected";
    databaseError = error instanceof Error ? error.message : "Unknown error";
  }

  // Return status even if database is not connected
  // This allows us to verify that Prisma is initialized correctly
  const response = {
    status: databaseStatus === "connected" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    database: databaseStatus,
    prisma: "initialized",
    note:
      databaseStatus === "disconnected"
        ? "Prisma is configured but database connection failed. Check network connectivity and Supabase settings."
        : undefined,
    error: databaseError || undefined,
  };

  // Return 200 OK to indicate the API is working, even if DB is not connected
  return response;
});
