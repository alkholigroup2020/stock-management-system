/**
 * GET /api/locations/:id/dashboard
 *
 * Fetch dashboard data for a location including:
 * - Location information
 * - Current period details
 * - Summary totals (receipts, issues, mandays, days left)
 * - Recent deliveries (last 5)
 * - Recent issues (last 5)
 *
 * Permissions:
 * - User must have access to the location
 * - ADMIN and SUPERVISOR have implicit access
 */

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

export default defineEventHandler(async (event) => {
  const user = event.context.user as AuthUser | undefined;

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      data: {
        code: "NOT_AUTHENTICATED",
        message: "You must be logged in to access this resource",
      },
    });
  }

  // Get location ID from route params
  const locationId = getRouterParam(event, "id");

  if (!locationId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        code: "MISSING_LOCATION_ID",
        message: "Location ID is required",
      },
    });
  }

  try {
    // Use $transaction to batch the initial queries into a single database round-trip
    // This significantly reduces latency when connecting to remote databases
    const [location, currentPeriod, userLocationAccess] = await prisma.$transaction([
      // Check if location exists
      prisma.location.findUnique({
        where: { id: locationId },
        select: {
          id: true,
          code: true,
          name: true,
        },
      }),
      // Get current open period
      prisma.period.findFirst({
        where: {
          status: { in: ["OPEN", "PENDING_CLOSE"] },
        },
        orderBy: {
          start_date: "desc",
        },
        select: {
          id: true,
          name: true,
          start_date: true,
          end_date: true,
          status: true,
        },
      }),
      // Check user access (only used for non-admin/supervisor)
      prisma.userLocation.findUnique({
        where: {
          user_id_location_id: {
            user_id: user.id,
            location_id: locationId,
          },
        },
      }),
    ]);

    if (!location) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "LOCATION_NOT_FOUND",
          message: "Location not found",
        },
      });
    }

    // Check user has access to location
    if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
      if (!userLocationAccess) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            code: "LOCATION_ACCESS_DENIED",
            message: "You do not have access to this location",
          },
        });
      }
    }

    // Calculate days left in period
    let daysLeft = 0;
    if (currentPeriod) {
      const endDate = new Date(currentPeriod.end_date);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    // Fetch dashboard data in a single batched transaction
    const periodId = currentPeriod?.id;

    // Fetch dashboard data in parallel for performance
    const [deliveriesAggregate, issuesAggregate, pobAggregate, recentDeliveries, recentIssues] =
      await Promise.all([
        // Total receipts (sum of delivery amounts for this period and location)
        periodId
          ? prisma.delivery.aggregate({
              where: {
                location_id: locationId,
                period_id: periodId,
              },
              _sum: {
                total_amount: true,
              },
            })
          : Promise.resolve({ _sum: { total_amount: null } }),

        // Total issues (sum of issue values for this period and location)
        periodId
          ? prisma.issue.aggregate({
              where: {
                location_id: locationId,
                period_id: periodId,
              },
              _sum: {
                total_value: true,
              },
            })
          : Promise.resolve({ _sum: { total_value: null } }),

        // Total mandays (sum of crew + extra for this period and location)
        periodId
          ? prisma.pOB.aggregate({
              where: {
                location_id: locationId,
                period_id: periodId,
              },
              _sum: {
                crew_count: true,
                extra_count: true,
              },
            })
          : Promise.resolve({ _sum: { crew_count: null, extra_count: null } }),

        // Recent deliveries (last 5)
        prisma.delivery.findMany({
          where: {
            location_id: locationId,
            ...(periodId && { period_id: periodId }),
          },
          orderBy: {
            delivery_date: "desc",
          },
          take: 5,
          include: {
            supplier: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        }),

        // Recent issues (last 5)
        prisma.issue.findMany({
          where: {
            location_id: locationId,
            ...(periodId && { period_id: periodId }),
          },
          orderBy: {
            issue_date: "desc",
          },
          take: 5,
        }),
      ]);

    // Calculate totals
    const totalReceipts = Number(deliveriesAggregate._sum.total_amount) || 0;
    const totalIssues = Number(issuesAggregate._sum.total_value) || 0;
    const totalMandays = (pobAggregate._sum.crew_count || 0) + (pobAggregate._sum.extra_count || 0);

    return {
      location: {
        id: location.id,
        code: location.code,
        name: location.name,
      },
      period: currentPeriod
        ? {
            id: currentPeriod.id,
            name: currentPeriod.name,
            start_date: currentPeriod.start_date.toISOString().split("T")[0],
            end_date: currentPeriod.end_date.toISOString().split("T")[0],
            status: currentPeriod.status,
          }
        : null,
      totals: {
        total_receipts: totalReceipts,
        total_issues: totalIssues,
        total_mandays: totalMandays,
        days_left: daysLeft,
      },
      recent_deliveries: recentDeliveries.map((delivery) => ({
        id: delivery.id,
        delivery_no: delivery.delivery_no,
        delivery_date: delivery.delivery_date.toISOString().split("T")[0],
        invoice_no: delivery.invoice_no,
        total_amount: Number(delivery.total_amount),
        has_variance: delivery.has_variance,
        supplier: {
          id: delivery.supplier.id,
          code: delivery.supplier.code,
          name: delivery.supplier.name,
        },
      })),
      recent_issues: recentIssues.map((issue) => ({
        id: issue.id,
        issue_no: issue.issue_no,
        issue_date: issue.issue_date.toISOString().split("T")[0],
        cost_centre: issue.cost_centre,
        total_value: Number(issue.total_value),
      })),
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching dashboard data:", error);
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
