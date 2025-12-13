/**
 * GET /api/reports/issues
 *
 * Generate issues (stock consumption) report with detailed breakdown
 *
 * Query Parameters:
 * - periodId: Filter by period (optional)
 * - locationId: Filter by specific location (optional)
 * - costCentre: Filter by cost centre (FOOD/CLEAN/OTHER, optional)
 * - startDate: Filter by issue date from (optional)
 * - endDate: Filter by issue date to (optional)
 *
 * Features:
 * - Issue totals by location, cost centre, and period
 * - Line item details with WAC values
 * - Summary statistics by cost centre
 * - Grand totals across all locations
 *
 * Permissions:
 * - OPERATOR: Can only view assigned locations
 * - SUPERVISOR/ADMIN: Can view all locations
 */

import prisma from "../../utils/prisma";
import { setCacheHeaders } from "../../utils/performance";
import { z } from "zod";
import type { UserRole, CostCentre } from "@prisma/client";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

// Query schema for validation
const querySchema = z.object({
  periodId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  costCentre: z.enum(["FOOD", "CLEAN", "OTHER"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Issue line type
interface IssueLineReport {
  item_code: string;
  item_name: string;
  item_unit: string;
  quantity: number;
  wac_at_issue: number;
  line_value: number;
}

// Issue report type
interface IssueReport {
  id: string;
  issue_no: string;
  issue_date: Date;
  location_code: string;
  location_name: string;
  period_name: string;
  cost_centre: CostCentre;
  total_value: number;
  poster_name: string;
  posted_at: Date;
  notes: string | null;
  line_count: number;
  lines: IssueLineReport[];
}

// Location summary type
interface LocationIssueSummary {
  location_id: string;
  location_code: string;
  location_name: string;
  issue_count: number;
  total_value: number;
  by_cost_centre: {
    FOOD: number;
    CLEAN: number;
    OTHER: number;
  };
}

// Cost centre summary type
interface CostCentreSummary {
  cost_centre: CostCentre;
  issue_count: number;
  total_value: number;
  line_count: number;
  top_items: Array<{
    item_code: string;
    item_name: string;
    total_quantity: number;
    total_value: number;
  }>;
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

  try {
    // Parse and validate query parameters
    const query = await getQuery(event);
    const { periodId, locationId, costCentre, startDate, endDate } = querySchema.parse(query);

    // Get user's accessible locations
    let accessibleLocationIds: string[] = [];

    if (user.role === "ADMIN" || user.role === "SUPERVISOR") {
      // Admin and Supervisor can see all active locations
      const allLocations = await prisma.location.findMany({
        where: { is_active: true },
        select: { id: true },
      });
      accessibleLocationIds = allLocations.map((l) => l.id);
    } else {
      // Operator can only see assigned locations
      const userLocations = await prisma.userLocation.findMany({
        where: { user_id: user.id },
        select: { location_id: true },
      });
      accessibleLocationIds = userLocations.map((ul) => ul.location_id);
    }

    // If specific location requested, verify access
    if (locationId) {
      if (!accessibleLocationIds.includes(locationId)) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            code: "LOCATION_ACCESS_DENIED",
            message: "You do not have access to this location",
          },
        });
      }
      accessibleLocationIds = [locationId];
    }

    // Build where clause
    const where: Record<string, unknown> = {
      location_id: { in: accessibleLocationIds },
    };

    if (periodId) {
      where.period_id = periodId;
    }

    if (costCentre) {
      where.cost_centre = costCentre;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }
      where.issue_date = dateFilter;
    }

    // Fetch issues with all related data
    const issues = await prisma.issue.findMany({
      where,
      include: {
        location: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
          },
        },
        poster: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
        issue_lines: {
          include: {
            item: {
              select: {
                id: true,
                code: true,
                name: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: [{ issue_date: "desc" }, { issue_no: "desc" }],
    });

    // Process issues for report
    const issueReports: IssueReport[] = [];
    const locationMap = new Map<string, LocationIssueSummary>();
    const costCentreMap = new Map<
      CostCentre,
      {
        issue_count: number;
        total_value: number;
        line_count: number;
        itemMap: Map<string, { code: string; name: string; quantity: number; value: number }>;
      }
    >();

    // Initialize cost centre map
    (["FOOD", "CLEAN", "OTHER"] as CostCentre[]).forEach((cc) => {
      costCentreMap.set(cc, {
        issue_count: 0,
        total_value: 0,
        line_count: 0,
        itemMap: new Map(),
      });
    });

    for (const issue of issues) {
      // Process lines
      const lines: IssueLineReport[] = issue.issue_lines.map((line) => ({
        item_code: line.item.code,
        item_name: line.item.name,
        item_unit: line.item.unit,
        quantity: parseFloat(line.quantity.toString()),
        wac_at_issue: parseFloat(line.wac_at_issue.toString()),
        line_value: parseFloat(line.line_value.toString()),
      }));

      issueReports.push({
        id: issue.id,
        issue_no: issue.issue_no,
        issue_date: issue.issue_date,
        location_code: issue.location.code,
        location_name: issue.location.name,
        period_name: issue.period.name,
        cost_centre: issue.cost_centre,
        total_value: parseFloat(issue.total_value.toString()),
        poster_name: issue.poster.full_name || issue.poster.username,
        posted_at: issue.posted_at,
        notes: issue.notes,
        line_count: lines.length,
        lines,
      });

      // Update location summary
      const locId = issue.location.id;
      if (!locationMap.has(locId)) {
        locationMap.set(locId, {
          location_id: locId,
          location_code: issue.location.code,
          location_name: issue.location.name,
          issue_count: 0,
          total_value: 0,
          by_cost_centre: {
            FOOD: 0,
            CLEAN: 0,
            OTHER: 0,
          },
        });
      }
      const locSummary = locationMap.get(locId)!;
      locSummary.issue_count++;
      locSummary.total_value += parseFloat(issue.total_value.toString());
      locSummary.by_cost_centre[issue.cost_centre] += parseFloat(issue.total_value.toString());

      // Update cost centre summary
      const ccData = costCentreMap.get(issue.cost_centre)!;
      ccData.issue_count++;
      ccData.total_value += parseFloat(issue.total_value.toString());
      ccData.line_count += lines.length;

      // Track top items by cost centre
      for (const line of issue.issue_lines) {
        const itemId = line.item.id;
        if (!ccData.itemMap.has(itemId)) {
          ccData.itemMap.set(itemId, {
            code: line.item.code,
            name: line.item.name,
            quantity: 0,
            value: 0,
          });
        }
        const itemData = ccData.itemMap.get(itemId)!;
        itemData.quantity += parseFloat(line.quantity.toString());
        itemData.value += parseFloat(line.line_value.toString());
      }
    }

    // Convert maps to arrays and round values
    const locationSummaries = Array.from(locationMap.values()).map((loc) => ({
      ...loc,
      total_value: Math.round(loc.total_value * 100) / 100,
      by_cost_centre: {
        FOOD: Math.round(loc.by_cost_centre.FOOD * 100) / 100,
        CLEAN: Math.round(loc.by_cost_centre.CLEAN * 100) / 100,
        OTHER: Math.round(loc.by_cost_centre.OTHER * 100) / 100,
      },
    }));

    // Process cost centre summaries with top items
    const costCentreSummaries: CostCentreSummary[] = (
      ["FOOD", "CLEAN", "OTHER"] as CostCentre[]
    ).map((cc) => {
      const data = costCentreMap.get(cc)!;
      const topItems = Array.from(data.itemMap.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
        .map((item) => ({
          item_code: item.code,
          item_name: item.name,
          total_quantity: Math.round(item.quantity * 10000) / 10000,
          total_value: Math.round(item.value * 100) / 100,
        }));

      return {
        cost_centre: cc,
        issue_count: data.issue_count,
        total_value: Math.round(data.total_value * 100) / 100,
        line_count: data.line_count,
        top_items: topItems,
      };
    });

    // Calculate grand totals
    const grandTotals = {
      total_issues: issueReports.length,
      total_value: Math.round(issueReports.reduce((sum, i) => sum + i.total_value, 0) * 100) / 100,
      total_line_items: issueReports.reduce((sum, i) => sum + i.line_count, 0),
      by_cost_centre: {
        FOOD: {
          count: costCentreSummaries.find((c) => c.cost_centre === "FOOD")?.issue_count || 0,
          value: costCentreSummaries.find((c) => c.cost_centre === "FOOD")?.total_value || 0,
        },
        CLEAN: {
          count: costCentreSummaries.find((c) => c.cost_centre === "CLEAN")?.issue_count || 0,
          value: costCentreSummaries.find((c) => c.cost_centre === "CLEAN")?.total_value || 0,
        },
        OTHER: {
          count: costCentreSummaries.find((c) => c.cost_centre === "OTHER")?.issue_count || 0,
          value: costCentreSummaries.find((c) => c.cost_centre === "OTHER")?.total_value || 0,
        },
      },
    };

    // Get period info if filtered
    let periodInfo = null;
    if (periodId) {
      const period = await prisma.period.findUnique({
        where: { id: periodId },
        select: {
          id: true,
          name: true,
          start_date: true,
          end_date: true,
          status: true,
        },
      });
      periodInfo = period;
    }

    // Set cache headers (30 seconds for report data)
    setCacheHeaders(event, {
      maxAge: 30,
      staleWhileRevalidate: 15,
    });

    return {
      report_type: "issues",
      generated_at: new Date().toISOString(),
      generated_by: {
        id: user.id,
        username: user.username,
      },
      filters: {
        period_id: periodId || null,
        location_id: locationId || null,
        cost_centre: costCentre || null,
        start_date: startDate || null,
        end_date: endDate || null,
      },
      period: periodInfo,
      issues: issueReports,
      by_location: locationSummaries.sort((a, b) => a.location_code.localeCompare(b.location_code)),
      by_cost_centre: costCentreSummaries,
      grand_totals: grandTotals,
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: error.issues,
        },
      });
    }

    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error generating issues report:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to generate issues report",
      },
    });
  }
});
