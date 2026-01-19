/**
 * GET /api/pos
 *
 * List POs with pagination and filters
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - status: Filter by status (OPEN, CLOSED)
 * - supplier_id: Filter by supplier
 * - prf_id: Filter by source PRF
 * - created_by: Filter by creator
 * - search: Search by PO number
 * - from_date: Created after date (ISO)
 * - to_date: Created before date (ISO)
 *
 * Permissions:
 * - All authenticated users can view POs
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
  status: z.enum(["OPEN", "CLOSED"]).optional(),
  supplier_id: z.string().uuid().optional(),
  prf_id: z.string().uuid().optional(),
  created_by: z.string().uuid().optional(),
  search: z.string().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
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
      supplier_id,
      prf_id,
      created_by,
      search,
      from_date,
      to_date,
    } = querySchema.parse(query);

    // Build where clause
    const where: Prisma.POWhereInput = {};

    // Apply optional filters
    if (status) {
      where.status = status;
    }

    if (supplier_id) {
      where.supplier_id = supplier_id;
    }

    if (prf_id) {
      where.prf_id = prf_id;
    }

    if (created_by) {
      where.created_by = created_by;
    }

    if (search) {
      where.po_no = { contains: search, mode: "insensitive" };
    }

    if (from_date) {
      const existingCreatedAt = where.created_at as Prisma.DateTimeFilter | undefined;
      where.created_at = { ...existingCreatedAt, gte: new Date(from_date) };
    }

    if (to_date) {
      const existingCreatedAt = where.created_at as Prisma.DateTimeFilter | undefined;
      where.created_at = {
        ...existingCreatedAt,
        lte: new Date(to_date),
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Use $transaction to batch queries
    const [pos, total] = await prisma.$transaction([
      prisma.pO.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          prf: {
            select: {
              id: true,
              prf_no: true,
            },
          },
          creator: {
            select: {
              id: true,
              full_name: true,
            },
          },
          _count: {
            select: {
              deliveries: true,
            },
          },
        },
        orderBy: [{ created_at: "desc" }],
        skip,
        take,
      }),
      prisma.pO.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    // Set cache headers (2 seconds for list data)
    setCacheHeaders(event, {
      maxAge: 2,
      staleWhileRevalidate: 2,
    });

    return {
      data: pos.map((po) => ({
        id: po.id,
        po_no: po.po_no,
        status: po.status,
        total_amount: po.total_amount.toString(),
        supplier: po.supplier,
        prf: po.prf || undefined,
        creator: po.creator,
        deliveries_count: po._count.deliveries,
        created_at: po.created_at.toISOString(),
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

    console.error("Error fetching POs:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch POs",
      },
    });
  }
});
