/**
 * POST /api/prfs/:id/clone
 *
 * Clone a PRF to create a new draft
 * - Creates a new PRF with a new number and DRAFT status
 * - Copies all line items from the source PRF
 * - The current user becomes the requester of the cloned PRF
 * - Typically used to clone rejected PRFs for resubmission
 *
 * Path Parameters:
 * - id: Source PRF UUID to clone
 *
 * Request Body (optional):
 * - period_id?: Override period ID (defaults to source PRF's period or current period if closed)
 *
 * Permissions:
 * - OPERATOR, SUPERVISOR, ADMIN can clone PRFs
 * - PROCUREMENT_SPECIALIST cannot clone PRFs
 * - User must have access to the source PRF's location (or be SUPERVISOR/ADMIN)
 */

import prisma from "../../../utils/prisma";
import { z } from "zod";
import type { UserRole } from "@prisma/client";
import {
  getLocationNameForDocument,
  formatDateForDocumentNumber,
} from "../../../utils/documentNumbering";

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

// Request body schema (optional)
const bodySchema = z
  .object({
    period_id: z.string().uuid("Invalid period ID").optional(),
  })
  .optional();

/**
 * Generate next PRF number
 * Format: PRF-{LocationName}-{DD}-{Mon}-{YYYY}-{NN}
 * Example: PRF-KITCHEN-27-Jan-2026-01
 */
async function generatePRFNumber(locationId: string): Promise<string> {
  // Fetch and sanitize location name (uppercase)
  const sanitizedName = await getLocationNameForDocument(locationId);

  // Format date as DD-Mon-YYYY
  const formattedDate = formatDateForDocumentNumber();

  // Build prefix: PRF-LocationName-Date-
  const prefix = `PRF-${sanitizedName}-${formattedDate}-`;

  // Find highest number for this location+date combination
  const lastPRF = await prisma.pRF.findFirst({
    where: {
      prf_no: { startsWith: prefix },
      location_id: locationId,
    },
    orderBy: { prf_no: "desc" },
    select: { prf_no: true },
  });

  if (!lastPRF) {
    return `${prefix}01`;
  }

  // Extract number and increment
  const parts = lastPRF.prf_no.split("-");
  const lastNumber = parseInt(parts[parts.length - 1] || "0", 10);
  const nextNumber = lastNumber + 1;

  return `${prefix}${nextNumber.toString().padStart(2, "0")}`;
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
        message: "Procurement specialists cannot clone PRFs",
      },
    });
  }

  try {
    // Validate path params
    const params = paramsSchema.parse(event.context.params);

    // Parse optional body
    const body = await readBody(event).catch(() => ({}));
    const data = bodySchema.parse(body) || {};

    // Fetch source PRF with all lines
    const sourcePRF = await prisma.pRF.findUnique({
      where: { id: params.id },
      include: {
        lines: true,
        location: { select: { id: true, code: true, name: true } },
        period: { select: { id: true, name: true, status: true } },
      },
    });

    if (!sourcePRF) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "PRF_NOT_FOUND",
          message: "PRF not found",
        },
      });
    }

    // Check location access for OPERATOR
    if (user.role === "OPERATOR") {
      const userLocation = await prisma.userLocation.findUnique({
        where: {
          user_id_location_id: {
            user_id: user.id,
            location_id: sourcePRF.location_id,
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

    // Determine target period
    let targetPeriodId = data.period_id || sourcePRF.period_id;

    // If source period is closed, find the current open period
    if (sourcePRF.period.status !== "OPEN" && !data.period_id) {
      const currentPeriod = await prisma.period.findFirst({
        where: { status: "OPEN" },
        orderBy: { start_date: "desc" },
        select: { id: true },
      });

      if (!currentPeriod) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          data: {
            code: "NO_OPEN_PERIOD",
            message: "No open period available. Cannot clone PRF.",
          },
        });
      }

      targetPeriodId = currentPeriod.id;
    }

    // Validate target period
    const targetPeriod = await prisma.period.findUnique({
      where: { id: targetPeriodId },
      select: { id: true, name: true, status: true },
    });

    if (!targetPeriod) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "PERIOD_NOT_FOUND",
          message: "Target period not found",
        },
      });
    }

    if (targetPeriod.status !== "OPEN") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "PERIOD_NOT_OPEN",
          message: "Cannot clone PRF to a period that is not open",
        },
      });
    }

    // Generate new PRF number
    const prfNo = await generatePRFNumber(sourcePRF.location_id);

    // Get current stock quantities for items at this location
    const itemIds = sourcePRF.lines
      .filter((line) => line.item_id)
      .map((line) => line.item_id as string);

    const stockRecords =
      itemIds.length > 0
        ? await prisma.locationStock.findMany({
            where: { location_id: sourcePRF.location_id, item_id: { in: itemIds } },
            select: { item_id: true, on_hand: true },
          })
        : [];

    const stockMap = new Map<string, number>();
    stockRecords.forEach((stock) => {
      stockMap.set(stock.item_id, parseFloat(stock.on_hand.toString()));
    });

    // Clone PRF in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Calculate total value from lines
      const totalValue = sourcePRF.lines.reduce(
        (sum, line) =>
          sum +
          parseFloat(line.required_qty.toString()) * parseFloat(line.estimated_price.toString()),
        0
      );

      // Create new PRF with DRAFT status
      const clonedPRF = await tx.pRF.create({
        data: {
          prf_no: prfNo,
          period_id: targetPeriodId,
          location_id: sourcePRF.location_id,
          project_name: sourcePRF.project_name,
          prf_type: sourcePRF.prf_type,
          category: sourcePRF.category,
          expected_delivery_date: sourcePRF.expected_delivery_date,
          is_reimbursable: sourcePRF.is_reimbursable,
          status: "DRAFT",
          requested_by: user.id, // Current user becomes the requester
          request_date: new Date(),
          total_value: totalValue,
          contact_person_name: sourcePRF.contact_person_name,
          contact_person_phone: sourcePRF.contact_person_phone,
          receiver_name: sourcePRF.receiver_name,
          receiver_phone: sourcePRF.receiver_phone,
          notes: sourcePRF.notes
            ? `Cloned from ${sourcePRF.prf_no}. Original notes: ${sourcePRF.notes}`
            : `Cloned from ${sourcePRF.prf_no}`,
        },
      });

      // Clone all line items
      const clonedLines = await Promise.all(
        sourcePRF.lines.map((line) =>
          tx.pRFLine.create({
            data: {
              prf_id: clonedPRF.id,
              item_id: line.item_id,
              item_description: line.item_description,
              cost_code: line.cost_code,
              // Update stock_qty with current values
              stock_qty: line.item_id ? (stockMap.get(line.item_id) ?? null) : null,
              unit: line.unit,
              required_qty: line.required_qty,
              estimated_price: line.estimated_price,
              line_value: line.line_value,
              notes: line.notes,
            },
            include: {
              item: {
                select: { id: true, code: true, name: true },
              },
            },
          })
        )
      );

      return { prf: clonedPRF, lines: clonedLines };
    });

    // Fetch full PRF with relations
    const clonedPRF = await prisma.pRF.findUnique({
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
        ...clonedPRF,
        total_value: clonedPRF?.total_value.toString(),
        request_date: clonedPRF?.request_date.toISOString().split("T")[0],
        expected_delivery_date: clonedPRF?.expected_delivery_date
          ? clonedPRF.expected_delivery_date.toISOString().split("T")[0]
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
      message: `PRF ${prfNo} created as a clone of ${sourcePRF.prf_no}`,
      source_prf_no: sourcePRF.prf_no,
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

    console.error("Error cloning PRF:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to clone PRF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
