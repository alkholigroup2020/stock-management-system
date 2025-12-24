/**
 * POST /api/ncrs
 *
 * Create a manual NCR (Non-Conformance Report)
 *
 * This endpoint handles:
 * - Manual NCR creation (user-initiated, not auto-generated)
 * - Optional linking to delivery
 * - Automatic NCR number generation
 *
 * Business Rules:
 * - Manual NCRs can be created for any reason
 * - Auto-generated NCRs (price variance) are created via delivery posting
 * - NCRs start with status OPEN
 * - All users can create NCRs for their locations
 *
 * Permissions:
 * - User must have POST or MANAGE access to the location
 */

import prisma from "../../utils/prisma";
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

// Request body schema
const bodySchema = z.object({
  location_id: z.string().uuid(),
  delivery_id: z.string().uuid().optional(), // Optional link to delivery
  delivery_line_id: z.string().uuid().optional(), // Optional link to specific delivery line
  reason: z.string().min(1),
  quantity: z.number().optional(),
  value: z.number().positive(),
});

/**
 * Generate next NCR number
 * Format: NCR-YYYY-NNN (e.g., NCR-2025-001)
 */
async function generateNCRNumber(year?: number): Promise<string> {
  const currentYear = year || new Date().getFullYear();
  const prefix = `NCR-${currentYear}-`;

  // Find the highest NCR number for this year
  const lastNCR = await prisma.nCR.findFirst({
    where: {
      ncr_no: {
        startsWith: prefix,
      },
    },
    orderBy: {
      ncr_no: "desc",
    },
    select: {
      ncr_no: true,
    },
  });

  if (!lastNCR) {
    // First NCR of the year
    return `${prefix}001`;
  }

  // Extract number from last NCR and increment
  const parts = lastNCR.ncr_no.split("-");
  const lastNumber = parseInt(parts[2] || "0", 10);
  const nextNumber = lastNumber + 1;

  // Pad with zeros to 3 digits
  return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
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
    // Parse and validate request body
    const body = await readBody(event);
    const data = bodySchema.parse(body);

    // Check if location exists
    const location = await prisma.location.findUnique({
      where: { id: data.location_id },
    });

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

    // Check user has access to location (Operators need explicit assignment)
    if (user.role === "OPERATOR") {
      const userLocation = await prisma.userLocation.findUnique({
        where: {
          user_id_location_id: {
            user_id: user.id,
            location_id: data.location_id,
          },
        },
      });

      if (!userLocation) {
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
    // Admins and Supervisors have implicit access to all locations

    // If delivery is provided, verify it exists and belongs to the location
    if (data.delivery_id) {
      const delivery = await prisma.delivery.findUnique({
        where: { id: data.delivery_id },
      });

      if (!delivery) {
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
          data: {
            code: "DELIVERY_NOT_FOUND",
            message: "Delivery not found",
          },
        });
      }

      if (delivery.location_id !== data.location_id) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "DELIVERY_LOCATION_MISMATCH",
            message: "Delivery does not belong to the specified location",
          },
        });
      }
    }

    // If delivery line is provided, verify it exists
    if (data.delivery_line_id) {
      const deliveryLine = await prisma.deliveryLine.findUnique({
        where: { id: data.delivery_line_id },
      });

      if (!deliveryLine) {
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
          data: {
            code: "DELIVERY_LINE_NOT_FOUND",
            message: "Delivery line not found",
          },
        });
      }

      if (data.delivery_id && deliveryLine.delivery_id !== data.delivery_id) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "DELIVERY_LINE_MISMATCH",
            message: "Delivery line does not belong to the specified delivery",
          },
        });
      }
    }

    // Generate NCR number
    const ncrNo = await generateNCRNumber();

    // Create NCR
    const ncr = await prisma.nCR.create({
      data: {
        ncr_no: ncrNo,
        location_id: data.location_id,
        type: "MANUAL",
        auto_generated: false,
        delivery_id: data.delivery_id,
        delivery_line_id: data.delivery_line_id,
        reason: data.reason,
        quantity: data.quantity,
        value: data.value,
        status: "OPEN",
        created_by: user.id,
      },
      include: {
        location: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
        delivery: {
          select: {
            id: true,
            delivery_no: true,
            delivery_date: true,
          },
        },
        delivery_line: {
          select: {
            id: true,
            item: {
              select: {
                id: true,
                code: true,
                name: true,
                unit: true,
              },
            },
            quantity: true,
            unit_price: true,
            period_price: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
      },
    });

    return {
      message: "NCR created successfully",
      ncr: {
        id: ncr.id,
        ncr_no: ncr.ncr_no,
        location: ncr.location,
        type: ncr.type,
        auto_generated: ncr.auto_generated,
        delivery: ncr.delivery,
        delivery_line: ncr.delivery_line
          ? {
              id: ncr.delivery_line.id,
              item: ncr.delivery_line.item,
              quantity: ncr.delivery_line.quantity,
              unit_price: ncr.delivery_line.unit_price,
              period_price: ncr.delivery_line.period_price,
            }
          : null,
        reason: ncr.reason,
        quantity: ncr.quantity,
        value: ncr.value,
        status: ncr.status,
        creator: ncr.creator,
        created_at: ncr.created_at,
        resolved_at: ncr.resolved_at,
        resolution_notes: ncr.resolution_notes,
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
          message: "Invalid request data",
          details: error.issues,
        },
      });
    }

    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error creating NCR:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to create NCR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
