/**
 * PATCH /api/ncrs/:id
 *
 * Update an NCR's status and resolution notes
 *
 * This endpoint handles:
 * - Status updates through the NCR lifecycle
 * - Adding resolution notes
 * - Setting resolved timestamp when status changes to CREDITED, REJECTED, or RESOLVED
 *
 * Status Flow:
 * - OPEN → SENT → CREDITED/REJECTED/RESOLVED
 * - Can skip SENT and go directly to RESOLVED if needed
 *
 * Permissions:
 * - User must have POST or MANAGE access to the NCR's location
 * - Supervisors and Admins can update any NCR
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
  status: z.enum(["OPEN", "SENT", "CREDITED", "REJECTED", "RESOLVED"]).optional(),
  resolution_notes: z.string().optional(),
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
    // Get NCR ID from route params
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_ID",
          message: "NCR ID is required",
        },
      });
    }

    // Parse and validate request body
    const body = await readBody(event);
    const data = bodySchema.parse(body);

    // Fetch existing NCR
    const ncr = await prisma.nCR.findUnique({
      where: { id },
      include: {
        location: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!ncr) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "NCR_NOT_FOUND",
          message: "NCR not found",
        },
      });
    }

    // Check if user has access to the NCR's location
    if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
      const userLocation = await prisma.userLocation.findUnique({
        where: {
          user_id_location_id: {
            user_id: user.id,
            location_id: ncr.location_id,
          },
        },
      });

      if (!userLocation) {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            code: "LOCATION_ACCESS_DENIED",
            message: "You do not have access to this NCR",
          },
        });
      }

      if (userLocation.access_level === "VIEW") {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: "You do not have permission to update NCRs for this location",
          },
        });
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (data.status) {
      updateData.status = data.status;

      // Set resolved_at timestamp when status changes to a final state
      if (
        (data.status === "CREDITED" ||
          data.status === "REJECTED" ||
          data.status === "RESOLVED") &&
        !ncr.resolved_at
      ) {
        updateData.resolved_at = new Date();
      }
    }

    if (data.resolution_notes !== undefined) {
      updateData.resolution_notes = data.resolution_notes;
    }

    // Update NCR
    const updatedNCR = await prisma.nCR.update({
      where: { id },
      data: updateData,
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
      message: "NCR updated successfully",
      ncr: {
        id: updatedNCR.id,
        ncr_no: updatedNCR.ncr_no,
        location: updatedNCR.location,
        type: updatedNCR.type,
        auto_generated: updatedNCR.auto_generated,
        delivery: updatedNCR.delivery,
        delivery_line: updatedNCR.delivery_line
          ? {
              id: updatedNCR.delivery_line.id,
              item: updatedNCR.delivery_line.item,
              quantity: updatedNCR.delivery_line.quantity,
              unit_price: updatedNCR.delivery_line.unit_price,
              period_price: updatedNCR.delivery_line.period_price,
            }
          : null,
        reason: updatedNCR.reason,
        quantity: updatedNCR.quantity,
        value: updatedNCR.value,
        status: updatedNCR.status,
        creator: updatedNCR.creator,
        created_at: updatedNCR.created_at,
        resolved_at: updatedNCR.resolved_at,
        resolution_notes: updatedNCR.resolution_notes,
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

    console.error("Error updating NCR:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to update NCR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
