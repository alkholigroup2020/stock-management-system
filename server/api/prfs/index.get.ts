/**
 * GET /api/prfs
 *
 * List PRFs with pagination and filters
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by PRF status
 * - location_id: Filter by location
 * - period_id: Filter by period
 * - prf_type: Filter by type (URGENT, DPA, NORMAL)
 * - category: Filter by category
 * - requested_by: Filter by requester
 * - search: Search by PRF number
 *
 * Permissions:
 * - All authenticated users can view
 * - Operators see their own PRFs + PRFs from their locations
 * - Supervisors/Admins see all PRFs
 * - PROCUREMENT_SPECIALIST see only APPROVED/CLOSED PRFs
 */

import prisma from "../../utils/prisma";
import { setCacheHeaders } from "../../utils/performance";
import { z } from "zod";
import type { UserRole, Prisma } from "@prisma/client";

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
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED", "CLOSED"]).optional(),
  location_id: z.string().uuid().optional(),
  period_id: z.string().uuid().optional(),
  prf_type: z.enum(["URGENT", "DPA", "NORMAL"]).optional(),
  category: z.enum(["FOOD", "CLEANING", "OTHER"]).optional(),
  requested_by: z.string().uuid().optional(),
  search: z.string().optional(),
});

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
    const {
      page,
      limit,
      status,
      location_id,
      period_id,
      prf_type,
      category,
      requested_by,
      search,
    } = querySchema.parse(query);

    // Build where clause
    const where: Prisma.PRFWhereInput = {};

    // Role-based filtering
    if (user.role === "PROCUREMENT_SPECIALIST") {
      // Procurement specialists can only see APPROVED or CLOSED PRFs from their assigned locations
      const userLocations = await prisma.userLocation.findMany({
        where: { user_id: user.id },
        select: { location_id: true },
      });
      const locationIds = userLocations.map((ul) => ul.location_id);

      // If no locations assigned, return empty results
      if (locationIds.length === 0) {
        where.id = "no-results"; // This will return no results
      } else {
        where.status = { in: ["APPROVED", "CLOSED"] };
        where.location_id = { in: locationIds };
      }
    } else if (user.role === "OPERATOR") {
      // Operators can see their own PRFs + PRFs from their locations
      const userLocations = await prisma.userLocation.findMany({
        where: { user_id: user.id },
        select: { location_id: true },
      });
      const locationIds = userLocations.map((ul) => ul.location_id);

      where.OR = [{ requested_by: user.id }, { location_id: { in: locationIds } }];
    }
    // Supervisors and Admins can see all PRFs

    // Apply optional filters
    if (status) {
      // For PROCUREMENT_SPECIALIST, intersect with allowed statuses
      if (user.role === "PROCUREMENT_SPECIALIST") {
        if (status === "APPROVED" || status === "CLOSED") {
          where.status = status;
        }
        // If requesting DRAFT/PENDING/REJECTED, return empty (will be handled by intersection)
      } else {
        where.status = status;
      }
    }

    if (location_id) {
      where.location_id = location_id;
    }

    if (period_id) {
      where.period_id = period_id;
    }

    if (prf_type) {
      where.prf_type = prf_type;
    }

    if (category) {
      where.category = category;
    }

    if (requested_by) {
      where.requested_by = requested_by;
    }

    if (search) {
      where.prf_no = { contains: search, mode: "insensitive" };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Use $transaction to batch queries
    const [prfs, total] = await prisma.$transaction([
      prisma.pRF.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              full_name: true,
            },
          },
          location: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          // Include purchase_orders to allow filtering PRFs that already have POs
          purchase_orders: {
            select: {
              id: true,
            },
          },
        },
        orderBy: [{ created_at: "desc" }],
        skip,
        take,
      }),
      prisma.pRF.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    // Set cache headers (2 seconds for list data)
    setCacheHeaders(event, {
      maxAge: 2,
      staleWhileRevalidate: 2,
    });

    return {
      data: prfs.map((prf) => ({
        id: prf.id,
        prf_no: prf.prf_no,
        status: prf.status,
        prf_type: prf.prf_type,
        category: prf.category,
        total_value: prf.total_value.toString(),
        request_date: prf.request_date.toISOString().split("T")[0],
        expected_delivery_date: prf.expected_delivery_date
          ? prf.expected_delivery_date.toISOString().split("T")[0]
          : null,
        requester: prf.requester,
        location: prf.location,
        purchase_orders: prf.purchase_orders,
        created_at: prf.created_at.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
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

    console.error("Error fetching PRFs:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch PRFs",
      },
    });
  }
});
