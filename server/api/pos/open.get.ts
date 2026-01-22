/**
 * GET /api/pos/open
 *
 * Get list of open POs for dropdown selection (used in Delivery creation)
 *
 * Query Parameters:
 * - supplier_id: Filter by supplier
 * - search: Search by PO number
 * - limit: Max results (default: 50)
 *
 * Permissions:
 * - All authenticated users can view open POs
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
  supplier_id: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
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
    const { supplier_id, search, limit } = querySchema.parse(query);

    // Build where clause - only OPEN POs
    const where: {
      status: "OPEN";
      supplier_id?: string;
      po_no?: { contains: string; mode: "insensitive" };
    } = {
      status: "OPEN",
    };

    if (supplier_id) {
      where.supplier_id = supplier_id;
    }

    if (search) {
      where.po_no = { contains: search, mode: "insensitive" };
    }

    // Fetch open POs with lines for delivery creation
    const pos = await prisma.pO.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        lines: {
          select: {
            id: true,
            item_description: true,
            quantity: true,
            delivered_qty: true,
            unit: true,
            unit_price: true,
            item_id: true,
            item: {
              select: { id: true, code: true, name: true },
            },
          },
          orderBy: { id: "asc" },
        },
      },
      orderBy: [{ created_at: "desc" }],
      take: limit,
    });

    // Set cache headers (2 seconds for dropdown data)
    setCacheHeaders(event, {
      maxAge: 2,
      staleWhileRevalidate: 2,
    });

    return {
      data: pos.map((po) => ({
        id: po.id,
        po_no: po.po_no,
        supplier: po.supplier,
        total_amount: po.total_amount.toString(),
        lines: po.lines.map((line) => {
          const quantity = parseFloat(line.quantity.toString());
          const deliveredQty = parseFloat(line.delivered_qty.toString());
          const remainingQty = Math.max(0, quantity - deliveredQty);
          return {
            id: line.id,
            item_id: line.item_id,
            item_description: line.item_description,
            quantity: line.quantity.toString(),
            delivered_qty: line.delivered_qty.toString(),
            remaining_qty: remainingQty.toString(), // Computed field for convenience
            unit: line.unit,
            unit_price: line.unit_price.toString(),
            item: line.item,
          };
        }),
      })),
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

    console.error("Error fetching open POs:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch open POs",
      },
    });
  }
});
