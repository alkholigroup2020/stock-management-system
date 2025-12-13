/**
 * GET /api/reports/deliveries
 *
 * Generate deliveries report with detailed breakdown
 *
 * Query Parameters:
 * - periodId: Filter by period (optional)
 * - locationId: Filter by specific location (optional)
 * - supplierId: Filter by supplier (optional)
 * - startDate: Filter by delivery date from (optional)
 * - endDate: Filter by delivery date to (optional)
 * - hasVariance: Filter by price variance (true/false, optional)
 * - status: Filter by delivery status (DRAFT/POSTED, optional)
 * - myDrafts: Filter to show only current user's drafts (true/false, optional)
 *
 * Features:
 * - Delivery totals by location, supplier, and period
 * - Line item details with price variance information
 * - NCR summary for price variance deliveries
 * - Summary statistics and totals
 *
 * Permissions:
 * - OPERATOR: Can only view assigned locations
 * - SUPERVISOR/ADMIN: Can view all locations
 * - Drafts are only visible to their creator (unless ADMIN/SUPERVISOR)
 */

import prisma from "../../utils/prisma";
import { setCacheHeaders } from "../../utils/performance";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

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
  supplierId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  hasVariance: z.enum(["true", "false"]).optional(),
  status: z.enum(["DRAFT", "POSTED"]).optional(),
  myDrafts: z.enum(["true", "false"]).optional(),
});

// Delivery line type
interface DeliveryLineReport {
  item_code: string;
  item_name: string;
  item_unit: string;
  quantity: number;
  unit_price: number;
  period_price: number;
  price_variance: number;
  line_value: number;
}

// Delivery report type
interface DeliveryReport {
  id: string;
  delivery_no: string;
  delivery_date: Date;
  invoice_no: string | null;
  supplier_code: string;
  supplier_name: string;
  location_code: string;
  location_name: string;
  period_name: string;
  total_amount: number;
  has_variance: boolean;
  total_variance: number;
  status: string;
  creator_id: string;
  creator_name: string;
  created_at: Date;
  posted_at: Date | null;
  ncr_count: number;
  lines: DeliveryLineReport[];
}

// Location summary type
interface LocationDeliverySummary {
  location_id: string;
  location_code: string;
  location_name: string;
  delivery_count: number;
  total_value: number;
  variance_count: number;
  total_variance: number;
}

// Supplier summary type
interface SupplierDeliverySummary {
  supplier_id: string;
  supplier_code: string;
  supplier_name: string;
  delivery_count: number;
  total_value: number;
  variance_count: number;
  total_variance: number;
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
    const { periodId, locationId, supplierId, startDate, endDate, hasVariance, status, myDrafts } =
      querySchema.parse(query);

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

    if (supplierId) {
      where.supplier_id = supplierId;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }
      where.delivery_date = dateFilter;
    }

    if (hasVariance !== undefined) {
      where.has_variance = hasVariance === "true";
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter for user's drafts only
    if (myDrafts === "true") {
      where.created_by = user.id;
      where.status = "DRAFT";
    } else if (status !== "DRAFT") {
      // For non-draft queries, exclude drafts from other users (unless ADMIN/SUPERVISOR)
      // If status is explicitly DRAFT, let it through (handled by my_drafts or ADMIN/SUPERVISOR)
      if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
        // Regular users can only see their own drafts or any posted delivery
        where.OR = [{ status: "POSTED" }, { status: "DRAFT", created_by: user.id }];
      }
    }

    // Fetch deliveries with all related data
    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        location: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        supplier: {
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
        creator: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
        delivery_lines: {
          include: {
            item: {
              select: {
                code: true,
                name: true,
                unit: true,
              },
            },
          },
        },
        ncrs: {
          select: {
            id: true,
            ncr_no: true,
            status: true,
          },
        },
      },
      orderBy: [{ delivery_date: "desc" }, { delivery_no: "desc" }],
    });

    // Process deliveries for report
    const deliveryReports: DeliveryReport[] = [];
    const locationMap = new Map<string, LocationDeliverySummary>();
    const supplierMap = new Map<string, SupplierDeliverySummary>();

    for (const delivery of deliveries) {
      // Calculate total variance for this delivery
      const totalVariance = delivery.delivery_lines.reduce((sum, line) => {
        return (
          sum + parseFloat(line.price_variance.toString()) * parseFloat(line.quantity.toString())
        );
      }, 0);

      // Process lines
      const lines: DeliveryLineReport[] = delivery.delivery_lines.map((line) => ({
        item_code: line.item.code,
        item_name: line.item.name,
        item_unit: line.item.unit,
        quantity: parseFloat(line.quantity.toString()),
        unit_price: parseFloat(line.unit_price.toString()),
        period_price: parseFloat(line.period_price.toString()),
        price_variance: parseFloat(line.price_variance.toString()),
        line_value: parseFloat(line.line_value.toString()),
      }));

      deliveryReports.push({
        id: delivery.id,
        delivery_no: delivery.delivery_no,
        delivery_date: delivery.delivery_date,
        invoice_no: delivery.invoice_no,
        supplier_code: delivery.supplier.code,
        supplier_name: delivery.supplier.name,
        location_code: delivery.location.code,
        location_name: delivery.location.name,
        period_name: delivery.period.name,
        total_amount: parseFloat(delivery.total_amount.toString()),
        has_variance: delivery.has_variance,
        total_variance: Math.round(totalVariance * 100) / 100,
        status: delivery.status,
        creator_id: delivery.created_by,
        creator_name: delivery.creator.full_name || delivery.creator.username,
        created_at: delivery.created_at,
        posted_at: delivery.posted_at,
        ncr_count: delivery.ncrs.length,
        lines,
      });

      // Update location summary
      const locId = delivery.location.id;
      if (!locationMap.has(locId)) {
        locationMap.set(locId, {
          location_id: locId,
          location_code: delivery.location.code,
          location_name: delivery.location.name,
          delivery_count: 0,
          total_value: 0,
          variance_count: 0,
          total_variance: 0,
        });
      }
      const locSummary = locationMap.get(locId)!;
      locSummary.delivery_count++;
      locSummary.total_value += parseFloat(delivery.total_amount.toString());
      if (delivery.has_variance) {
        locSummary.variance_count++;
        locSummary.total_variance += Math.abs(totalVariance);
      }

      // Update supplier summary
      const supId = delivery.supplier.id;
      if (!supplierMap.has(supId)) {
        supplierMap.set(supId, {
          supplier_id: supId,
          supplier_code: delivery.supplier.code,
          supplier_name: delivery.supplier.name,
          delivery_count: 0,
          total_value: 0,
          variance_count: 0,
          total_variance: 0,
        });
      }
      const supSummary = supplierMap.get(supId)!;
      supSummary.delivery_count++;
      supSummary.total_value += parseFloat(delivery.total_amount.toString());
      if (delivery.has_variance) {
        supSummary.variance_count++;
        supSummary.total_variance += Math.abs(totalVariance);
      }
    }

    // Convert maps to arrays and round values
    const locationSummaries = Array.from(locationMap.values()).map((loc) => ({
      ...loc,
      total_value: Math.round(loc.total_value * 100) / 100,
      total_variance: Math.round(loc.total_variance * 100) / 100,
    }));

    const supplierSummaries = Array.from(supplierMap.values()).map((sup) => ({
      ...sup,
      total_value: Math.round(sup.total_value * 100) / 100,
      total_variance: Math.round(sup.total_variance * 100) / 100,
    }));

    // Calculate grand totals
    const grandTotals = {
      total_deliveries: deliveryReports.length,
      total_value:
        Math.round(deliveryReports.reduce((sum, d) => sum + d.total_amount, 0) * 100) / 100,
      deliveries_with_variance: deliveryReports.filter((d) => d.has_variance).length,
      total_variance:
        Math.round(deliveryReports.reduce((sum, d) => sum + Math.abs(d.total_variance), 0) * 100) /
        100,
      total_ncrs: deliveryReports.reduce((sum, d) => sum + d.ncr_count, 0),
      total_line_items: deliveryReports.reduce((sum, d) => sum + d.lines.length, 0),
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
      report_type: "deliveries",
      generated_at: new Date().toISOString(),
      generated_by: {
        id: user.id,
        username: user.username,
      },
      filters: {
        period_id: periodId || null,
        location_id: locationId || null,
        supplier_id: supplierId || null,
        start_date: startDate || null,
        end_date: endDate || null,
        has_variance_only: hasVariance === "true",
        status: status || null,
        my_drafts_only: myDrafts === "true",
      },
      period: periodInfo,
      deliveries: deliveryReports,
      by_location: locationSummaries.sort((a, b) => a.location_code.localeCompare(b.location_code)),
      by_supplier: supplierSummaries.sort((a, b) => b.total_value - a.total_value),
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

    console.error("Error generating deliveries report:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to generate deliveries report",
      },
    });
  }
});
