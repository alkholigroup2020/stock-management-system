/**
 * GET /api/dashboard/consolidated
 *
 * Fetch consolidated dashboard data across all locations including:
 * - Aggregated totals (receipts, issues, mandays)
 * - Per-location breakdown
 * - Current period details
 * - Recent activity across all locations
 *
 * Permissions:
 * - Only ADMIN and SUPERVISOR users can access this endpoint
 */

import prisma from "../../utils/prisma";
import type { UserRole } from "@prisma/client";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

// Location totals breakdown
interface LocationTotals {
  location_id: string;
  location_code: string;
  location_name: string;
  location_type: string;
  total_receipts: number;
  total_issues: number;
  total_mandays: number;
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

  // Only ADMIN and SUPERVISOR can access consolidated view
  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "ACCESS_DENIED",
        message: "You must be a Supervisor or Admin to access consolidated dashboard",
      },
    });
  }

  try {
    // Use $transaction to batch the initial queries into a single database round-trip
    const [locations, currentPeriod] = await prisma.$transaction([
      // Get all active locations
      prisma.location.findMany({
        where: { is_active: true },
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
        },
        orderBy: { code: "asc" },
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
    ]);

    // Calculate days left in period
    let daysLeft = 0;
    if (currentPeriod) {
      const endDate = new Date(currentPeriod.end_date);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const periodId = currentPeriod?.id;

    // Fetch aggregated data across all locations in parallel
    const [
      totalDeliveriesAggregate,
      totalIssuesAggregate,
      totalPobAggregate,
      deliveriesByLocation,
      issuesByLocation,
      pobByLocation,
      recentDeliveries,
      recentIssues,
      pendingTransfers,
      pendingApprovals,
    ] = await Promise.all([
      // Global totals - deliveries
      periodId
        ? prisma.delivery.aggregate({
            where: { period_id: periodId },
            _sum: { total_amount: true },
          })
        : Promise.resolve({ _sum: { total_amount: null } }),

      // Global totals - issues
      periodId
        ? prisma.issue.aggregate({
            where: { period_id: periodId },
            _sum: { total_value: true },
          })
        : Promise.resolve({ _sum: { total_value: null } }),

      // Global totals - POB
      periodId
        ? prisma.pOB.aggregate({
            where: { period_id: periodId },
            _sum: { crew_count: true, extra_count: true },
          })
        : Promise.resolve({ _sum: { crew_count: null, extra_count: null } }),

      // Per-location deliveries
      periodId
        ? prisma.delivery.groupBy({
            by: ["location_id"],
            where: { period_id: periodId },
            _sum: { total_amount: true },
          })
        : Promise.resolve([]),

      // Per-location issues
      periodId
        ? prisma.issue.groupBy({
            by: ["location_id"],
            where: { period_id: periodId },
            _sum: { total_value: true },
          })
        : Promise.resolve([]),

      // Per-location POB
      periodId
        ? prisma.pOB.groupBy({
            by: ["location_id"],
            where: { period_id: periodId },
            _sum: { crew_count: true, extra_count: true },
          })
        : Promise.resolve([]),

      // Recent deliveries across all locations (last 10)
      prisma.delivery.findMany({
        where: periodId ? { period_id: periodId } : {},
        orderBy: { delivery_date: "desc" },
        take: 10,
        include: {
          supplier: { select: { id: true, code: true, name: true } },
          location: { select: { id: true, code: true, name: true } },
        },
      }),

      // Recent issues across all locations (last 10)
      prisma.issue.findMany({
        where: periodId ? { period_id: periodId } : {},
        orderBy: { issue_date: "desc" },
        take: 10,
        include: {
          location: { select: { id: true, code: true, name: true } },
        },
      }),

      // Pending transfers count
      prisma.transfer.count({
        where: { status: "PENDING_APPROVAL" },
      }),

      // Pending approvals (PRFs waiting for approval)
      prisma.pRF.count({
        where: { status: "PENDING" },
      }),
    ]);

    // Calculate global totals
    const globalTotalReceipts = Number(totalDeliveriesAggregate._sum.total_amount) || 0;
    const globalTotalIssues = Number(totalIssuesAggregate._sum.total_value) || 0;
    const globalTotalMandays =
      (totalPobAggregate._sum.crew_count || 0) + (totalPobAggregate._sum.extra_count || 0);

    // Build per-location breakdown
    const deliveriesMap = new Map(
      (deliveriesByLocation as Array<{ location_id: string; _sum: { total_amount: unknown } }>).map(
        (d) => [d.location_id, Number(d._sum.total_amount) || 0]
      )
    );
    const issuesMap = new Map(
      (issuesByLocation as Array<{ location_id: string; _sum: { total_value: unknown } }>).map(
        (i) => [i.location_id, Number(i._sum.total_value) || 0]
      )
    );
    const pobMap = new Map(
      (
        pobByLocation as Array<{
          location_id: string;
          _sum: { crew_count: number | null; extra_count: number | null };
        }>
      ).map((p) => [p.location_id, (p._sum.crew_count || 0) + (p._sum.extra_count || 0)])
    );

    const locationBreakdown: LocationTotals[] = locations.map((loc) => ({
      location_id: loc.id,
      location_code: loc.code,
      location_name: loc.name,
      location_type: loc.type,
      total_receipts: deliveriesMap.get(loc.id) || 0,
      total_issues: issuesMap.get(loc.id) || 0,
      total_mandays: pobMap.get(loc.id) || 0,
    }));

    return {
      period: currentPeriod
        ? {
            id: currentPeriod.id,
            name: currentPeriod.name,
            start_date: currentPeriod.start_date.toISOString().split("T")[0],
            end_date: currentPeriod.end_date.toISOString().split("T")[0],
            status: currentPeriod.status,
          }
        : null,
      global_totals: {
        total_receipts: globalTotalReceipts,
        total_issues: globalTotalIssues,
        total_mandays: globalTotalMandays,
        days_left: daysLeft,
        location_count: locations.length,
        pending_transfers: pendingTransfers,
        pending_approvals: pendingApprovals,
      },
      location_breakdown: locationBreakdown,
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
        location: {
          id: delivery.location.id,
          code: delivery.location.code,
          name: delivery.location.name,
        },
      })),
      recent_issues: recentIssues.map((issue) => ({
        id: issue.id,
        issue_no: issue.issue_no,
        issue_date: issue.issue_date.toISOString().split("T")[0],
        cost_centre: issue.cost_centre,
        total_value: Number(issue.total_value),
        location: {
          id: issue.location.id,
          code: issue.location.code,
          name: issue.location.name,
        },
      })),
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching consolidated dashboard data:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch consolidated dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
