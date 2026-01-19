/**
 * PATCH /api/prfs/:id
 *
 * Update a draft PRF. Only the requester can update.
 *
 * Request Body:
 * - project_name?: Project name
 * - prf_type?: PRF type
 * - category?: PRF category
 * - expected_delivery_date?: ISO date string
 * - is_reimbursable?: Boolean
 * - contact_person_name?: Contact name
 * - contact_person_phone?: Contact phone
 * - receiver_name?: Receiver name
 * - receiver_phone?: Receiver phone
 * - notes?: Notes
 * - lines?: Array of line items (full replacement)
 *
 * Permissions:
 * - Only the original requester can update
 * - PRF must be in DRAFT status
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
  id: z.string().uuid("Invalid PRF ID"),
});

// PRF Line schema for update
const prfLineSchema = z.object({
  id: z.string().uuid().optional(), // Include for update, omit for new
  item_id: z.string().uuid().nullable().optional(),
  item_description: z.string().min(1, "Item description is required").max(500),
  cost_code: z.string().max(50).nullable().optional(),
  unit: z.enum(["KG", "EA", "LTR", "BOX", "CASE", "PACK"]),
  required_qty: z.number().positive("Required quantity must be positive"),
  estimated_price: z.number().min(0, "Estimated price must be non-negative"),
  notes: z.string().nullable().optional(),
});

// Request body schema
const bodySchema = z.object({
  project_name: z.string().max(200).nullable().optional(),
  prf_type: z.enum(["URGENT", "DPA", "NORMAL"]).optional(),
  category: z.enum(["MATERIAL", "CONSUMABLES", "SPARE_PARTS", "ASSET", "SERVICES"]).optional(),
  expected_delivery_date: z.string().nullable().optional(),
  is_reimbursable: z.boolean().optional(),
  contact_person_name: z.string().max(100).nullable().optional(),
  contact_person_phone: z.string().max(50).nullable().optional(),
  receiver_name: z.string().max(100).nullable().optional(),
  receiver_phone: z.string().max(50).nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(prfLineSchema).min(1).optional(),
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

    // Parse and validate request body
    const body = await readBody(event);
    const data = bodySchema.parse(body);

    // Fetch existing PRF
    const existingPRF = await prisma.pRF.findUnique({
      where: { id: params.id },
      include: {
        lines: { select: { id: true } },
      },
    });

    if (!existingPRF) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "PRF_NOT_FOUND",
          message: "PRF not found",
        },
      });
    }

    // Check if user is the requester
    if (existingPRF.requested_by !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "NOT_REQUESTER",
          message: "Only the original requester can update this PRF",
        },
      });
    }

    // Check if PRF is in DRAFT status
    if (existingPRF.status !== "DRAFT") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "NOT_DRAFT",
          message: "Only draft PRFs can be updated",
        },
      });
    }

    // If lines are provided, validate item_ids
    if (data.lines) {
      const itemIds = data.lines.filter((line) => line.item_id).map((line) => line.item_id as string);

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

      // Get stock quantities for items at this location
      const stockRecords =
        itemIds.length > 0
          ? await prisma.locationStock.findMany({
              where: { location_id: existingPRF.location_id, item_id: { in: itemIds } },
              select: { item_id: true, on_hand: true },
            })
          : [];

      var stockMap = new Map<string, number>();
      stockRecords.forEach((stock) => {
        stockMap.set(stock.item_id, parseFloat(stock.on_hand.toString()));
      });
    }

    // Update PRF in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Build update data
      const updateData: Record<string, unknown> = {};

      if (data.project_name !== undefined) updateData.project_name = data.project_name;
      if (data.prf_type !== undefined) updateData.prf_type = data.prf_type;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.expected_delivery_date !== undefined) {
        updateData.expected_delivery_date = data.expected_delivery_date
          ? new Date(data.expected_delivery_date)
          : null;
      }
      if (data.is_reimbursable !== undefined) updateData.is_reimbursable = data.is_reimbursable;
      if (data.contact_person_name !== undefined) updateData.contact_person_name = data.contact_person_name;
      if (data.contact_person_phone !== undefined) updateData.contact_person_phone = data.contact_person_phone;
      if (data.receiver_name !== undefined) updateData.receiver_name = data.receiver_name;
      if (data.receiver_phone !== undefined) updateData.receiver_phone = data.receiver_phone;
      if (data.notes !== undefined) updateData.notes = data.notes;

      // Handle lines if provided (full replacement)
      if (data.lines) {
        // Delete all existing lines
        await tx.pRFLine.deleteMany({ where: { prf_id: params.id } });

        // Create new lines
        const totalValue = data.lines.reduce(
          (sum, line) => sum + line.required_qty * line.estimated_price,
          0
        );
        updateData.total_value = totalValue;

        // Create new lines
        for (const lineData of data.lines) {
          await tx.pRFLine.create({
            data: {
              prf_id: params.id,
              item_id: lineData.item_id || null,
              item_description: lineData.item_description,
              cost_code: lineData.cost_code || null,
              stock_qty: lineData.item_id ? (stockMap?.get(lineData.item_id) ?? null) : null,
              unit: lineData.unit,
              required_qty: lineData.required_qty,
              estimated_price: lineData.estimated_price,
              line_value: lineData.required_qty * lineData.estimated_price,
              notes: lineData.notes || null,
            },
          });
        }
      }

      // Update PRF
      const prf = await tx.pRF.update({
        where: { id: params.id },
        data: updateData,
        include: {
          lines: {
            include: {
              item: { select: { id: true, code: true, name: true } },
            },
            orderBy: { id: "asc" },
          },
          requester: { select: { id: true, username: true, full_name: true } },
          location: { select: { id: true, code: true, name: true } },
          period: { select: { id: true, name: true } },
        },
      });

      return prf;
    });

    return {
      data: {
        id: result.id,
        prf_no: result.prf_no,
        period_id: result.period_id,
        location_id: result.location_id,
        project_name: result.project_name,
        prf_type: result.prf_type,
        category: result.category,
        expected_delivery_date: result.expected_delivery_date
          ? result.expected_delivery_date.toISOString().split("T")[0]
          : null,
        is_reimbursable: result.is_reimbursable,
        status: result.status,
        requested_by: result.requested_by,
        request_date: result.request_date.toISOString().split("T")[0],
        total_value: result.total_value.toString(),
        contact_person_name: result.contact_person_name,
        contact_person_phone: result.contact_person_phone,
        receiver_name: result.receiver_name,
        receiver_phone: result.receiver_phone,
        notes: result.notes,
        created_at: result.created_at.toISOString(),
        updated_at: result.updated_at.toISOString(),
        lines: result.lines.map((line) => ({
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
        requester: result.requester,
        location: result.location,
        period: result.period,
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

    console.error("Error updating PRF:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to update PRF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
