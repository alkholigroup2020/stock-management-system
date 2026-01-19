/**
 * GET /api/pos/:id
 *
 * Get PO details with lines, supplier, and linked deliveries
 *
 * Permissions:
 * - All authenticated users can view PO details
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
  id: z.string().uuid("Invalid PO ID"),
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

    // Fetch PO with all relations
    const po = await prisma.pO.findUnique({
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
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
            emails: true,
            phone: true,
            vat_reg_no: true,
            address: true,
          },
        },
        prf: {
          select: {
            id: true,
            prf_no: true,
            status: true,
            location: {
              select: { id: true, code: true, name: true },
            },
          },
        },
        ship_to_location: {
          select: { id: true, code: true, name: true },
        },
        creator: {
          select: { id: true, username: true, full_name: true },
        },
        deliveries: {
          select: {
            id: true,
            delivery_no: true,
            status: true,
            delivery_date: true,
            total_amount: true,
          },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!po) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "PO_NOT_FOUND",
          message: "PO not found",
        },
      });
    }

    // Set cache headers (2 seconds)
    setCacheHeaders(event, {
      maxAge: 2,
      staleWhileRevalidate: 2,
    });

    return {
      data: {
        id: po.id,
        po_no: po.po_no,
        prf_id: po.prf_id,
        supplier_id: po.supplier_id,
        quotation_ref: po.quotation_ref,
        ship_to_location_id: po.ship_to_location_id,
        ship_to_contact: po.ship_to_contact,
        ship_to_phone: po.ship_to_phone,
        status: po.status,
        total_before_discount: po.total_before_discount.toString(),
        total_discount: po.total_discount.toString(),
        total_after_discount: po.total_after_discount.toString(),
        total_vat: po.total_vat.toString(),
        total_amount: po.total_amount.toString(),
        payment_terms: po.payment_terms,
        delivery_terms: po.delivery_terms,
        duration_days: po.duration_days,
        terms_conditions: po.terms_conditions,
        notes: po.notes,
        created_by: po.created_by,
        created_at: po.created_at.toISOString(),
        updated_at: po.updated_at.toISOString(),
        lines: po.lines.map((line) => ({
          id: line.id,
          po_id: line.po_id,
          item_id: line.item_id,
          item_code: line.item_code,
          item_description: line.item_description,
          quantity: line.quantity.toString(),
          unit: line.unit,
          unit_price: line.unit_price.toString(),
          discount_percent: line.discount_percent.toString(),
          total_before_vat: line.total_before_vat.toString(),
          vat_percent: line.vat_percent.toString(),
          vat_amount: line.vat_amount.toString(),
          total_after_vat: line.total_after_vat.toString(),
          notes: line.notes,
          item: line.item,
        })),
        supplier: po.supplier,
        prf: po.prf,
        ship_to_location: po.ship_to_location,
        creator: po.creator,
        deliveries: po.deliveries.map((d) => ({
          id: d.id,
          delivery_no: d.delivery_no,
          status: d.status,
          delivery_date: d.delivery_date.toISOString().split("T")[0],
          total_amount: d.total_amount.toString(),
        })),
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
          message: "Invalid PO ID",
          details: error.issues,
        },
      });
    }

    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching PO:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch PO",
      },
    });
  }
});
