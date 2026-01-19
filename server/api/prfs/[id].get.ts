/**
 * GET /api/prfs/:id
 *
 * Get PRF details with lines and relations
 *
 * Permissions:
 * - All authenticated users can view PRF details
 * - PROCUREMENT_SPECIALIST can only see APPROVED/CLOSED PRFs
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

// Path params schema
const paramsSchema = z.object({
  id: z.string().uuid("Invalid PRF ID"),
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
    // Validate path params
    const params = paramsSchema.parse(event.context.params);

    // Fetch PRF with all relations
    const prf = await prisma.pRF.findUnique({
      where: { id: params.id },
      include: {
        lines: {
          include: {
            item: {
              select: { id: true, code: true, name: true },
            },
          },
          orderBy: { id: "asc" },
        },
        requester: {
          select: { id: true, username: true, full_name: true },
        },
        approver: {
          select: { id: true, username: true, full_name: true },
        },
        location: {
          select: { id: true, code: true, name: true },
        },
        period: {
          select: { id: true, name: true },
        },
        purchase_orders: {
          select: { id: true, po_no: true, status: true },
        },
      },
    });

    if (!prf) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "PRF_NOT_FOUND",
          message: "PRF not found",
        },
      });
    }

    // PROCUREMENT_SPECIALIST can only see APPROVED or CLOSED PRFs
    if (user.role === "PROCUREMENT_SPECIALIST") {
      if (prf.status !== "APPROVED" && prf.status !== "CLOSED") {
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
          data: {
            code: "ACCESS_DENIED",
            message: "You can only view approved or closed PRFs",
          },
        });
      }
    }

    // Set cache headers (2 seconds)
    setCacheHeaders(event, {
      maxAge: 2,
      staleWhileRevalidate: 2,
    });

    return {
      data: {
        id: prf.id,
        prf_no: prf.prf_no,
        period_id: prf.period_id,
        location_id: prf.location_id,
        project_name: prf.project_name,
        prf_type: prf.prf_type,
        category: prf.category,
        expected_delivery_date: prf.expected_delivery_date
          ? prf.expected_delivery_date.toISOString().split("T")[0]
          : null,
        is_reimbursable: prf.is_reimbursable,
        status: prf.status,
        requested_by: prf.requested_by,
        approved_by: prf.approved_by,
        request_date: prf.request_date.toISOString().split("T")[0],
        approval_date: prf.approval_date ? prf.approval_date.toISOString().split("T")[0] : null,
        rejection_reason: prf.rejection_reason,
        total_value: prf.total_value.toString(),
        contact_person_name: prf.contact_person_name,
        contact_person_phone: prf.contact_person_phone,
        receiver_name: prf.receiver_name,
        receiver_phone: prf.receiver_phone,
        notes: prf.notes,
        created_at: prf.created_at.toISOString(),
        updated_at: prf.updated_at.toISOString(),
        lines: prf.lines.map((line) => ({
          id: line.id,
          prf_id: line.prf_id,
          item_id: line.item_id,
          item_description: line.item_description,
          cost_code: line.cost_code,
          stock_qty: line.stock_qty?.toString() || null,
          unit: line.unit,
          required_qty: line.required_qty.toString(),
          estimated_price: line.estimated_price.toString(),
          line_value: line.line_value.toString(),
          notes: line.notes,
          item: line.item,
        })),
        requester: prf.requester,
        approver: prf.approver,
        location: prf.location,
        period: prf.period,
        purchase_orders: prf.purchase_orders,
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
          message: "Invalid PRF ID",
          details: error.issues,
        },
      });
    }

    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching PRF:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch PRF",
      },
    });
  }
});
