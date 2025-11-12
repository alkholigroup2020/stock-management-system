// import { z } from 'zod'
import prisma from "../../../utils/prisma";
import type { UserRole } from "@prisma/client";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

/**
 * GET /api/locations/:locationId/dashboard
 *
 * Fetch dashboard data for a location including:
 * - Period totals (receipts, issues, mandays, days left)
 * - Recent deliveries (last 5)
 * - Recent issues (last 5)
 *
 * @requires Authentication
 * @requires Location access (operators restricted to assigned locations)
 */
export default defineEventHandler(async (event) => {
  // Auth check (handled by auth middleware)
  const user = event.context.user as AuthUser | undefined;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      data: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  }

  // Get locationId from params
  const locationId = getRouterParam(event, "locationId");
  if (!locationId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: { code: "VALIDATION_ERROR", message: "Location ID is required" },
    });
  }

  try {
    // Check location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: { code: "NOT_FOUND", message: "Location not found" },
      });
    }

    // Check location access (handled by location-access middleware)
    // Operators can only access assigned locations
    // Admins and Supervisors can access all locations

    // Fetch current open period
    const currentPeriod = await prisma.period.findFirst({
      where: { status: "OPEN" },
      orderBy: { start_date: "desc" },
    });

    if (!currentPeriod) {
      // No active period - return minimal data
      return {
        location: {
          id: location.id,
          code: location.code,
          name: location.name,
        },
        period: null,
        totals: {
          receipts: 0,
          issues: 0,
          mandays: 0,
          daysLeft: 0,
        },
        recentDeliveries: [],
        recentIssues: [],
      };
    }

    // Calculate days left in period
    const today = new Date();
    const endDate = new Date(currentPeriod.end_date);
    const daysLeft = Math.max(
      0,
      Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Fetch period totals for location
    const [totalReceipts, totalIssues, totalMandays] = await Promise.all([
      // Total receipts (sum of delivery values)
      prisma.delivery.aggregate({
        where: {
          location_id: locationId,
          period_id: currentPeriod.id,
        },
        _sum: {
          total_amount: true,
        },
      }),

      // Total issues (sum of issue values)
      prisma.issue.aggregate({
        where: {
          location_id: locationId,
          period_id: currentPeriod.id,
        },
        _sum: {
          total_value: true,
        },
      }),

      // Total mandays (sum of POB total_count)
      prisma.pOB.aggregate({
        where: {
          location_id: locationId,
          period_id: currentPeriod.id,
        },
        _sum: {
          crew_count: true,
          extra_count: true,
        },
      }),
    ]);

    // Fetch recent deliveries (last 5)
    const recentDeliveries = await prisma.delivery.findMany({
      where: {
        location_id: locationId,
        period_id: currentPeriod.id,
      },
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        delivery_date: "desc",
      },
      take: 5,
    });

    // Fetch recent issues (last 5)
    const recentIssues = await prisma.issue.findMany({
      where: {
        location_id: locationId,
        period_id: currentPeriod.id,
      },
      orderBy: {
        issue_date: "desc",
      },
      take: 5,
    });

    // Return dashboard data
    return {
      location: {
        id: location.id,
        code: location.code,
        name: location.name,
      },
      period: {
        id: currentPeriod.id,
        name: currentPeriod.name,
        start_date: currentPeriod.start_date,
        end_date: currentPeriod.end_date,
        status: currentPeriod.status,
      },
      totals: {
        receipts: totalReceipts._sum.total_amount?.toNumber() || 0,
        issues: totalIssues._sum.total_value?.toNumber() || 0,
        mandays:
          (totalMandays._sum.crew_count || 0) +
          (totalMandays._sum.extra_count || 0),
        daysLeft,
      },
      recentDeliveries: recentDeliveries.map((delivery) => ({
        id: delivery.id,
        delivery_no: delivery.delivery_no,
        delivery_date: delivery.delivery_date,
        supplier: delivery.supplier,
        invoice_no: delivery.invoice_no,
        total_amount: delivery.total_amount.toNumber(),
        has_variance: delivery.has_variance,
      })),
      recentIssues: recentIssues.map((issue) => ({
        id: issue.id,
        issue_no: issue.issue_no,
        issue_date: issue.issue_date,
        cost_centre: issue.cost_centre,
        total_value: issue.total_value.toNumber(),
      })),
    };
  } catch (error) {
    // Handle known errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Handle unexpected errors
    console.error("Dashboard fetch error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
