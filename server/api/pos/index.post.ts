/**
 * POST /api/pos
 *
 * Create a new PO with VAT calculations
 *
 * Request Body:
 * - prf_id?: Optional - link to source PRF
 * - supplier_id: Required - Supplier UUID
 * - quotation_ref?: Supplier quotation reference
 * - ship_to_location_id?: Delivery destination
 * - ship_to_contact?: Contact name at delivery site
 * - ship_to_phone?: Contact phone at delivery site
 * - payment_terms?: Payment terms text
 * - delivery_terms?: Delivery terms text
 * - duration_days?: Contract duration
 * - terms_conditions?: Additional terms
 * - notes?: Optional notes
 * - lines: Array of line items (at least 1 required)
 *
 * Permissions:
 * - Only PROCUREMENT_SPECIALIST can create POs
 */

import prisma from "../../utils/prisma";
import { z } from "zod";
import type { UserRole } from "@prisma/client";
import {
  getLocationNameForDocument,
  formatDateForDocumentNumber,
} from "../../utils/documentNumbering";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
}

// PO Line schema
const poLineSchema = z.object({
  item_id: z.string().uuid().nullable().optional(),
  item_code: z.string().max(50).nullable().optional(),
  item_description: z.string().min(1, "Item description is required").max(500),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.enum(["KG", "EA", "LTR", "BOX", "CASE", "PACK"]),
  unit_price: z.number().min(0, "Unit price must be non-negative"),
  discount_percent: z.number().min(0).max(100).default(0),
  vat_percent: z.number().min(0).max(100).default(15),
  notes: z.string().nullable().optional(),
});

// Request body schema
const bodySchema = z.object({
  prf_id: z.string().uuid().nullable().optional(),
  supplier_id: z.string().uuid("Invalid supplier ID"),
  quotation_ref: z.string().max(100).nullable().optional(),
  ship_to_location_id: z.string().uuid().nullable().optional(),
  ship_to_contact: z.string().max(100).nullable().optional(),
  ship_to_phone: z.string().max(50).nullable().optional(),
  payment_terms: z.string().max(200).nullable().optional(),
  delivery_terms: z.string().max(200).nullable().optional(),
  duration_days: z.number().int().positive().nullable().optional(),
  terms_conditions: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(poLineSchema).min(1, "At least one line item is required"),
});

/**
 * Generate next PO number
 * Format: PO-{LocationName}-{DD}-{Mon}-{YYYY}-{NN}
 * Example: PO-KITCHEN-27-Jan-2026-01
 * Uses the PRF's location name
 */
async function generatePONumber(prfId: string): Promise<string> {
  // Fetch PRF to get location
  const prf = await prisma.pRF.findUnique({
    where: { id: prfId },
    select: {
      location_id: true,
      location: { select: { name: true } },
    },
  });

  if (!prf) {
    throw createError({
      statusCode: 404,
      statusMessage: "PRF not found",
    });
  }

  // Fetch and sanitize location name (uppercase)
  const sanitizedName = await getLocationNameForDocument(prf.location_id);

  // Format date as DD-Mon-YYYY
  const formattedDate = formatDateForDocumentNumber();

  // Build prefix: PO-LocationName-Date-
  const prefix = `PO-${sanitizedName}-${formattedDate}-`;

  // Find highest number for this location+date combination
  const lastPO = await prisma.pO.findFirst({
    where: {
      po_no: { startsWith: prefix },
      prf_id: prfId,
    },
    orderBy: { po_no: "desc" },
    select: { po_no: true },
  });

  if (!lastPO) {
    return `${prefix}01`;
  }

  // Extract number and increment
  const parts = lastPO.po_no.split("-");
  const lastNumber = parseInt(parts[parts.length - 1] || "0", 10);
  const nextNumber = lastNumber + 1;

  return `${prefix}${nextNumber.toString().padStart(2, "0")}`;
}

/**
 * Calculate VAT amounts for a line item
 */
function calculateLineAmounts(line: {
  quantity: number;
  unit_price: number;
  discount_percent: number;
  vat_percent: number;
}) {
  const grossAmount = line.quantity * line.unit_price;
  const discountAmount = (grossAmount * line.discount_percent) / 100;
  const totalBeforeVat = grossAmount - discountAmount;
  const vatAmount = (totalBeforeVat * line.vat_percent) / 100;
  const totalAfterVat = totalBeforeVat + vatAmount;

  return {
    total_before_vat: Math.round(totalBeforeVat * 100) / 100,
    vat_amount: Math.round(vatAmount * 100) / 100,
    total_after_vat: Math.round(totalAfterVat * 100) / 100,
  };
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

  // Check role permissions - only PROCUREMENT_SPECIALIST can create POs
  if (user.role !== "PROCUREMENT_SPECIALIST") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "PERMISSION_DENIED",
        message: "Only procurement specialists can create POs",
      },
    });
  }

  try {
    // Parse and validate request body
    const body = await readBody(event);
    const data = bodySchema.parse(body);

    // Validate supplier exists and is active
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplier_id },
      select: { id: true, name: true, emails: true, is_active: true },
    });

    if (!supplier) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "SUPPLIER_NOT_FOUND",
          message: "Supplier not found",
        },
      });
    }

    if (!supplier.is_active) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "SUPPLIER_INACTIVE",
          message: "Cannot create PO for an inactive supplier",
        },
      });
    }

    // Validate PRF if provided
    let prf = null;
    if (data.prf_id) {
      prf = await prisma.pRF.findUnique({
        where: { id: data.prf_id },
        include: {
          purchase_orders: { select: { id: true } },
          requester: { select: { full_name: true } },
          location: { select: { name: true } },
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

      if (prf.status !== "APPROVED") {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "PRF_NOT_APPROVED",
            message: "PRF must be approved to create a PO",
          },
        });
      }

      // Check 1:1 constraint - PRF can only have one PO
      if (prf.purchase_orders.length > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: "Conflict",
          data: {
            code: "PRF_HAS_PO",
            message: "This PRF already has a Purchase Order",
          },
        });
      }
    }

    // Validate ship-to location if provided
    if (data.ship_to_location_id) {
      const location = await prisma.location.findUnique({
        where: { id: data.ship_to_location_id },
        select: { id: true, is_active: true },
      });

      if (!location) {
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
          data: {
            code: "LOCATION_NOT_FOUND",
            message: "Ship-to location not found",
          },
        });
      }

      if (!location.is_active) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "LOCATION_INACTIVE",
            message: "Cannot ship to an inactive location",
          },
        });
      }
    }

    // Validate items if any have item_id
    const itemIds = data.lines.filter((line) => line.item_id).map((line) => line.item_id as string);

    if (itemIds.length > 0) {
      const items = await prisma.item.findMany({
        where: { id: { in: itemIds }, is_active: true },
        select: { id: true, code: true },
      });

      if (items.length !== itemIds.length) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "INVALID_ITEMS",
            message: "One or more items not found or inactive",
          },
        });
      }
    }

    // PRF ID is required for new naming scheme
    if (!data.prf_id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "PRF_REQUIRED",
          message: "PRF ID is required to create a PO",
        },
      });
    }

    // Generate PO number
    const poNo = await generatePONumber(data.prf_id);

    // Calculate line amounts and PO totals
    const linesWithAmounts = data.lines.map((line) => {
      const amounts = calculateLineAmounts({
        quantity: line.quantity,
        unit_price: line.unit_price,
        discount_percent: line.discount_percent,
        vat_percent: line.vat_percent,
      });

      return {
        ...line,
        ...amounts,
      };
    });

    // Calculate PO totals
    const totals = linesWithAmounts.reduce(
      (acc, line) => {
        const grossAmount = line.quantity * line.unit_price;
        const discountAmount = (grossAmount * line.discount_percent) / 100;

        return {
          total_before_discount: acc.total_before_discount + grossAmount,
          total_discount: acc.total_discount + discountAmount,
          total_after_discount: acc.total_after_discount + line.total_before_vat,
          total_vat: acc.total_vat + line.vat_amount,
          total_amount: acc.total_amount + line.total_after_vat,
        };
      },
      {
        total_before_discount: 0,
        total_discount: 0,
        total_after_discount: 0,
        total_vat: 0,
        total_amount: 0,
      }
    );

    // Round totals
    totals.total_before_discount = Math.round(totals.total_before_discount * 100) / 100;
    totals.total_discount = Math.round(totals.total_discount * 100) / 100;
    totals.total_after_discount = Math.round(totals.total_after_discount * 100) / 100;
    totals.total_vat = Math.round(totals.total_vat * 100) / 100;
    totals.total_amount = Math.round(totals.total_amount * 100) / 100;

    // Create PO with lines in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create PO
      const po = await tx.pO.create({
        data: {
          po_no: poNo,
          prf_id: data.prf_id || null,
          supplier_id: data.supplier_id,
          quotation_ref: data.quotation_ref || null,
          ship_to_location_id: data.ship_to_location_id || null,
          ship_to_contact: data.ship_to_contact || null,
          ship_to_phone: data.ship_to_phone || null,
          status: "OPEN",
          total_before_discount: totals.total_before_discount,
          total_discount: totals.total_discount,
          total_after_discount: totals.total_after_discount,
          total_vat: totals.total_vat,
          total_amount: totals.total_amount,
          payment_terms: data.payment_terms || null,
          delivery_terms: data.delivery_terms || null,
          duration_days: data.duration_days || null,
          terms_conditions: data.terms_conditions || null,
          notes: data.notes || null,
          created_by: user.id,
        },
      });

      // Create PO lines
      const lines = await Promise.all(
        linesWithAmounts.map((lineData) =>
          tx.pOLine.create({
            data: {
              po_id: po.id,
              item_id: lineData.item_id || null,
              item_code: lineData.item_code || null,
              item_description: lineData.item_description,
              quantity: lineData.quantity,
              unit: lineData.unit,
              unit_price: lineData.unit_price,
              discount_percent: lineData.discount_percent,
              total_before_vat: lineData.total_before_vat,
              vat_percent: lineData.vat_percent,
              vat_amount: lineData.vat_amount,
              total_after_vat: lineData.total_after_vat,
              notes: lineData.notes || null,
            },
            include: {
              item: {
                select: { id: true, code: true, name: true },
              },
            },
          })
        )
      );

      return { po, lines };
    });

    // Fetch full PO with relations
    const po = await prisma.pO.findUnique({
      where: { id: result.po.id },
      include: {
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
          },
        },
        creator: {
          select: { id: true, username: true, full_name: true },
        },
        ship_to_location: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    // Note: Email notification to supplier is disabled on PO creation.
    // Supplier email addresses are stored for future use (manual sending via resend-email endpoint).

    return {
      data: {
        id: po?.id,
        po_no: po?.po_no,
        prf_id: po?.prf_id,
        supplier_id: po?.supplier_id,
        quotation_ref: po?.quotation_ref,
        ship_to_location_id: po?.ship_to_location_id,
        ship_to_contact: po?.ship_to_contact,
        ship_to_phone: po?.ship_to_phone,
        status: po?.status,
        total_before_discount: po?.total_before_discount.toString(),
        total_discount: po?.total_discount.toString(),
        total_after_discount: po?.total_after_discount.toString(),
        total_vat: po?.total_vat.toString(),
        total_amount: po?.total_amount.toString(),
        payment_terms: po?.payment_terms,
        delivery_terms: po?.delivery_terms,
        duration_days: po?.duration_days,
        terms_conditions: po?.terms_conditions,
        notes: po?.notes,
        created_by: po?.created_by,
        created_at: po?.created_at.toISOString(),
        updated_at: po?.updated_at.toISOString(),
        lines: result.lines.map((line) => ({
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
        supplier: po?.supplier,
        prf: po?.prf,
        creator: po?.creator,
        ship_to_location: po?.ship_to_location,
      },
      message: "Purchase Order created",
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

    console.error("Error creating PO:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to create PO",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
