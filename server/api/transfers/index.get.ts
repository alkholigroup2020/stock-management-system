/**
 * GET /api/transfers
 *
 * Fetch transfers with optional filters
 *
 * Query Parameters:
 * - fromLocationId: Filter by source location
 * - toLocationId: Filter by destination location
 * - status: Filter by transfer status
 * - startDate: Filter by request date (from)
 * - endDate: Filter by request date (to)
 * - includeLines: Include transfer lines in response (true/false)
 *
 * Permissions:
 * - User must have access to at least one of the locations involved
 * - Supervisors and Admins can see all transfers
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
  fromLocationId: z.string().uuid().optional(),
  toLocationId: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "COMPLETED"]).optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  includeLines: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(200).default(50),
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
    const { fromLocationId, toLocationId, status, startDate, endDate, includeLines, page, limit } =
      querySchema.parse(query);

    // Build where clause for transfers
    const where: Record<string, unknown> = {};

    // Admin and Supervisor can see all transfers
    // Operators can only see transfers involving their locations
    if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
      // Get user's accessible locations
      const userLocations = await prisma.userLocation.findMany({
        where: { user_id: user.id },
        select: { location_id: true },
      });

      const locationIds = userLocations.map((ul) => ul.location_id);

      if (locationIds.length === 0) {
        // User has no location access, return empty result
        return {
          transfers: [],
          count: 0,
        };
      }

      // Filter transfers where user has access to from or to location
      where.OR = [
        { from_location_id: { in: locationIds } },
        { to_location_id: { in: locationIds } },
      ];
    }

    if (fromLocationId) {
      where.from_location_id = fromLocationId;
    }

    if (toLocationId) {
      where.to_location_id = toLocationId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      const requestDateFilter: Record<string, Date> = {};
      if (startDate) {
        requestDateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        requestDateFilter.lte = new Date(endDate);
      }
      where.request_date = requestDateFilter;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Fetch transfers with pagination
    const [transfers, total] = await Promise.all([
      prisma.transfer.findMany({
        where,
        include: {
          from_location: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
            },
          },
          to_location: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
            },
          },
          requester: {
            select: {
              id: true,
              username: true,
              full_name: true,
              role: true,
            },
          },
          approver: {
            select: {
              id: true,
              username: true,
              full_name: true,
              role: true,
            },
          },
          transfer_lines:
            includeLines === "true"
              ? {
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
                }
              : false,
        },
        orderBy: {
          request_date: "desc",
        },
        skip,
        take,
      }),
      prisma.transfer.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Set cache headers (15 seconds for list data)
    setCacheHeaders(event, {
      maxAge: 15,
      staleWhileRevalidate: 10,
    });

    return {
      transfers: transfers.map((transfer) => ({
        id: transfer.id,
        transfer_no: transfer.transfer_no,
        request_date: transfer.request_date,
        approval_date: transfer.approval_date,
        transfer_date: transfer.transfer_date,
        status: transfer.status,
        total_value: transfer.total_value,
        notes: transfer.notes,
        from_location: transfer.from_location,
        to_location: transfer.to_location,
        requester: transfer.requester,
        approver: transfer.approver,
        created_at: transfer.created_at,
        updated_at: transfer.updated_at,
        lines:
          includeLines === "true" && Array.isArray(transfer.transfer_lines)
            ? transfer.transfer_lines.map((line: unknown) => {
                const transferLine = line as {
                  id: string;
                  item: { id: string; code: string; name: string; unit: string };
                  quantity: number;
                  wac_at_transfer: number;
                  line_value: number;
                };
                return {
                  id: transferLine.id,
                  item: transferLine.item,
                  quantity: transferLine.quantity,
                  wac_at_transfer: transferLine.wac_at_transfer,
                  line_value: transferLine.line_value,
                };
              })
            : undefined,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
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

    console.error("Error fetching transfers:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch transfers",
      },
    });
  }
});
