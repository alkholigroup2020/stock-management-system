/**
 * PATCH /api/pos/:id
 *
 * Update an open PO. Full edit capability until closed.
 *
 * Request Body:
 * - quotation_ref?: Supplier quotation reference
 * - ship_to_location_id?: Delivery destination
 * - ship_to_contact?: Contact name at delivery site
 * - ship_to_phone?: Contact phone at delivery site
 * - payment_terms?: Payment terms text
 * - delivery_terms?: Delivery terms text
 * - duration_days?: Contract duration
 * - terms_conditions?: Additional terms
 * - notes?: Optional notes
 * - lines?: Array of line items (full replacement)
 *
 * Permissions:
 * - PROCUREMENT_SPECIALIST, ADMIN can update open POs
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

// Path params schema
const paramsSchema = z.object({
  id: z.string().uuid("Invalid PO ID"),
});

// PO Line schema for update
const poLineSchema = z.object({
  id: z.string().uuid().optional(), // Include for update, omit for new
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
  quotation_ref: z.string().max(100).nullable().optional(),
  ship_to_location_id: z.string().uuid().nullable().optional(),
  ship_to_contact: z.string().max(100).nullable().optional(),
  ship_to_phone: z.string().max(50).nullable().optional(),
  payment_terms: z.string().max(200).nullable().optional(),
  delivery_terms: z.string().max(200).nullable().optional(),
  duration_days: z.number().int().positive().nullable().optional(),
  terms_conditions: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(poLineSchema).min(1, "At least one line item is required").optional(),
});

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

  // Check role permissions
  if (user.role !== "PROCUREMENT_SPECIALIST" && user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "PERMISSION_DENIED",
        message: "Only procurement specialists and admins can update POs",
      },
    });
  }

  try {
    // Validate path params
    const params = paramsSchema.parse(event.context.params);

    // Fetch existing PO
    const existingPO = await prisma.pO.findUnique({
      where: { id: params.id },
      include: { lines: true },
    });

    if (!existingPO) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "PO_NOT_FOUND",
          message: "PO not found",
        },
      });
    }

    // Check PO is still open
    if (existingPO.status === "CLOSED") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "PO_CLOSED",
          message: "Cannot update a closed PO",
        },
      });
    }

    // Parse and validate request body
    const body = await readBody(event);
    const data = bodySchema.parse(body);

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
    if (data.lines) {
      const itemIds = data.lines
        .filter((line) => line.item_id)
        .map((line) => line.item_id as string);

      if (itemIds.length > 0) {
        const items = await prisma.item.findMany({
          where: { id: { in: itemIds }, is_active: true },
          select: { id: true },
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
    }

    // Update PO and lines in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // If lines are provided, handle full replacement
      let lines = existingPO.lines;
      let totals = {
        total_before_discount: parseFloat(existingPO.total_before_discount.toString()),
        total_discount: parseFloat(existingPO.total_discount.toString()),
        total_after_discount: parseFloat(existingPO.total_after_discount.toString()),
        total_vat: parseFloat(existingPO.total_vat.toString()),
        total_amount: parseFloat(existingPO.total_amount.toString()),
      };

      if (data.lines) {
        // Delete all existing lines
        await tx.pOLine.deleteMany({
          where: { po_id: params.id },
        });

        // Calculate line amounts and create new lines
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

        // Calculate new PO totals
        totals = linesWithAmounts.reduce(
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

        // Create new lines
        const createdLines = await Promise.all(
          linesWithAmounts.map((lineData) =>
            tx.pOLine.create({
              data: {
                po_id: params.id,
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

        lines = createdLines;
      }

      // Update PO
      const po = await tx.pO.update({
        where: { id: params.id },
        data: {
          quotation_ref:
            data.quotation_ref !== undefined ? data.quotation_ref : existingPO.quotation_ref,
          ship_to_location_id:
            data.ship_to_location_id !== undefined
              ? data.ship_to_location_id
              : existingPO.ship_to_location_id,
          ship_to_contact:
            data.ship_to_contact !== undefined ? data.ship_to_contact : existingPO.ship_to_contact,
          ship_to_phone:
            data.ship_to_phone !== undefined ? data.ship_to_phone : existingPO.ship_to_phone,
          payment_terms:
            data.payment_terms !== undefined ? data.payment_terms : existingPO.payment_terms,
          delivery_terms:
            data.delivery_terms !== undefined ? data.delivery_terms : existingPO.delivery_terms,
          duration_days:
            data.duration_days !== undefined ? data.duration_days : existingPO.duration_days,
          terms_conditions:
            data.terms_conditions !== undefined
              ? data.terms_conditions
              : existingPO.terms_conditions,
          notes: data.notes !== undefined ? data.notes : existingPO.notes,
          total_before_discount: totals.total_before_discount,
          total_discount: totals.total_discount,
          total_after_discount: totals.total_after_discount,
          total_vat: totals.total_vat,
          total_amount: totals.total_amount,
        },
        include: {
          supplier: {
            select: { id: true, code: true, name: true },
          },
          prf: {
            select: { id: true, prf_no: true },
          },
          creator: {
            select: { id: true, username: true, full_name: true },
          },
          ship_to_location: {
            select: { id: true, code: true, name: true },
          },
        },
      });

      return { po, lines };
    });

    return {
      data: {
        id: result.po.id,
        po_no: result.po.po_no,
        prf_id: result.po.prf_id,
        supplier_id: result.po.supplier_id,
        quotation_ref: result.po.quotation_ref,
        ship_to_location_id: result.po.ship_to_location_id,
        ship_to_contact: result.po.ship_to_contact,
        ship_to_phone: result.po.ship_to_phone,
        status: result.po.status,
        total_before_discount: result.po.total_before_discount.toString(),
        total_discount: result.po.total_discount.toString(),
        total_after_discount: result.po.total_after_discount.toString(),
        total_vat: result.po.total_vat.toString(),
        total_amount: result.po.total_amount.toString(),
        payment_terms: result.po.payment_terms,
        delivery_terms: result.po.delivery_terms,
        duration_days: result.po.duration_days,
        terms_conditions: result.po.terms_conditions,
        notes: result.po.notes,
        created_by: result.po.created_by,
        created_at: result.po.created_at.toISOString(),
        updated_at: result.po.updated_at.toISOString(),
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
          item: "item" in line ? line.item : null,
        })),
        supplier: result.po.supplier,
        prf: result.po.prf,
        creator: result.po.creator,
        ship_to_location: result.po.ship_to_location,
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

    console.error("Error updating PO:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to update PO",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
