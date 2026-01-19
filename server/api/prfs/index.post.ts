/**
 * POST /api/prfs
 *
 * Create a new PRF in DRAFT status
 *
 * Request Body:
 * - location_id: Required - Location UUID
 * - period_id: Required - Period UUID
 * - project_name?: Optional project name
 * - prf_type?: PRF type (default: NORMAL)
 * - category?: PRF category (default: MATERIAL)
 * - expected_delivery_date?: ISO date string
 * - is_reimbursable?: Boolean (default: false)
 * - contact_person_name?: Contact name
 * - contact_person_phone?: Contact phone
 * - receiver_name?: Receiver name
 * - receiver_phone?: Receiver phone
 * - notes?: Optional notes
 * - lines: Array of line items (at least 1 required)
 *
 * Permissions:
 * - OPERATOR, SUPERVISOR, ADMIN can create PRFs
 * - PROCUREMENT_SPECIALIST cannot create PRFs
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

// PRF Line schema
const prfLineSchema = z.object({
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
  location_id: z.string().uuid("Invalid location ID"),
  period_id: z.string().uuid("Invalid period ID"),
  project_name: z.string().max(200).nullable().optional(),
  prf_type: z.enum(["URGENT", "DPA", "NORMAL"]).default("NORMAL"),
  category: z.enum(["MATERIAL", "CONSUMABLES", "SPARE_PARTS", "ASSET", "SERVICES"]).default("MATERIAL"),
  expected_delivery_date: z.string().nullable().optional(),
  is_reimbursable: z.boolean().default(false),
  contact_person_name: z.string().max(100).nullable().optional(),
  contact_person_phone: z.string().max(50).nullable().optional(),
  receiver_name: z.string().max(100).nullable().optional(),
  receiver_phone: z.string().max(50).nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(prfLineSchema).min(1, "At least one line item is required"),
});

/**
 * Generate next PRF number
 * Format: PRF-NNN (e.g., PRF-001)
 */
async function generatePRFNumber(): Promise<string> {
  const prefix = "PRF-";

  // Find the highest PRF number
  const lastPRF = await prisma.pRF.findFirst({
    orderBy: { prf_no: "desc" },
    select: { prf_no: true },
  });

  if (!lastPRF) {
    return `${prefix}001`;
  }

  // Extract number and increment
  const lastNumber = parseInt(lastPRF.prf_no.split("-")[1] || "0", 10);
  const nextNumber = lastNumber + 1;

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

  // Check role permissions
  if (user.role === "PROCUREMENT_SPECIALIST") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "PERMISSION_DENIED",
        message: "Procurement specialists cannot create PRFs",
      },
    });
  }

  try {
    // Parse and validate request body
    const body = await readBody(event);
    const data = bodySchema.parse(body);

    // Validate location exists and user has access
    const [location, period, userLocation] = await Promise.all([
      prisma.location.findUnique({ where: { id: data.location_id } }),
      prisma.period.findUnique({ where: { id: data.period_id } }),
      user.role === "OPERATOR"
        ? prisma.userLocation.findUnique({
            where: {
              user_id_location_id: {
                user_id: user.id,
                location_id: data.location_id,
              },
            },
          })
        : Promise.resolve({ location_id: data.location_id }), // Admins/Supervisors have access to all
    ]);

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

    if (!period) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "PERIOD_NOT_FOUND",
          message: "Period not found",
        },
      });
    }

    if (period.status !== "OPEN") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "PERIOD_NOT_OPEN",
          message: "Cannot create PRF for a period that is not open",
        },
      });
    }

    if (user.role === "OPERATOR" && !userLocation) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "LOCATION_ACCESS_DENIED",
          message: "You do not have access to this location",
        },
      });
    }

    // If any lines have item_id, verify the items exist
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

    // Get stock quantities for items at this location (for reference)
    const stockRecords =
      itemIds.length > 0
        ? await prisma.locationStock.findMany({
            where: { location_id: data.location_id, item_id: { in: itemIds } },
            select: { item_id: true, on_hand: true },
          })
        : [];

    const stockMap = new Map<string, number>();
    stockRecords.forEach((stock) => {
      stockMap.set(stock.item_id, parseFloat(stock.on_hand.toString()));
    });

    // Generate PRF number
    const prfNo = await generatePRFNumber();

    // Create PRF with lines in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Calculate total value
      const totalValue = data.lines.reduce(
        (sum, line) => sum + line.required_qty * line.estimated_price,
        0
      );

      // Create PRF
      const prf = await tx.pRF.create({
        data: {
          prf_no: prfNo,
          period_id: data.period_id,
          location_id: data.location_id,
          project_name: data.project_name || null,
          prf_type: data.prf_type,
          category: data.category,
          expected_delivery_date: data.expected_delivery_date
            ? new Date(data.expected_delivery_date)
            : null,
          is_reimbursable: data.is_reimbursable,
          status: "DRAFT",
          requested_by: user.id,
          request_date: new Date(),
          total_value: totalValue,
          contact_person_name: data.contact_person_name || null,
          contact_person_phone: data.contact_person_phone || null,
          receiver_name: data.receiver_name || null,
          receiver_phone: data.receiver_phone || null,
          notes: data.notes || null,
        },
      });

      // Create PRF lines
      const lines = await Promise.all(
        data.lines.map((lineData) =>
          tx.pRFLine.create({
            data: {
              prf_id: prf.id,
              item_id: lineData.item_id || null,
              item_description: lineData.item_description,
              cost_code: lineData.cost_code || null,
              stock_qty: lineData.item_id ? (stockMap.get(lineData.item_id) ?? null) : null,
              unit: lineData.unit,
              required_qty: lineData.required_qty,
              estimated_price: lineData.estimated_price,
              line_value: lineData.required_qty * lineData.estimated_price,
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

      return { prf, lines };
    });

    // Fetch full PRF with relations
    const prf = await prisma.pRF.findUnique({
      where: { id: result.prf.id },
      include: {
        requester: {
          select: { id: true, username: true, full_name: true },
        },
        location: {
          select: { id: true, code: true, name: true },
        },
        period: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      data: {
        ...prf,
        total_value: prf?.total_value.toString(),
        request_date: prf?.request_date.toISOString().split("T")[0],
        expected_delivery_date: prf?.expected_delivery_date
          ? prf.expected_delivery_date.toISOString().split("T")[0]
          : null,
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

    console.error("Error creating PRF:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to create PRF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
