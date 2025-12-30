/**
 * POST /api/transfers
 *
 * Create a new inter-location stock transfer
 *
 * This endpoint handles:
 * - Transfer creation with multiple line items
 * - Stock validation (source location must have sufficient stock)
 * - Transfer status set to PENDING_APPROVAL
 * - Automatic transfer number generation
 *
 * Business Rules:
 * - From and To locations must be different
 * - Source location must have sufficient stock for all items
 * - Transfer created in PENDING_APPROVAL status (requires supervisor/admin approval)
 * - Stock is not moved until transfer is approved
 *
 * Permissions:
 * - User must have POST or MANAGE access to the source location
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

// Transfer line schema
const transferLineSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.number().positive(),
});

// Request body schema
const bodySchema = z.object({
  from_location_id: z.string().uuid(),
  to_location_id: z.string().uuid(),
  request_date: z.string(), // ISO date string
  notes: z.string().optional(),
  lines: z.array(transferLineSchema).min(1),
});

/**
 * Generate next transfer number
 * Format: TRF-YYYY-NNN (e.g., TRF-2025-001)
 */
async function generateTransferNumber(year?: number): Promise<string> {
  const currentYear = year || new Date().getFullYear();
  const prefix = `TRF-${currentYear}-`;

  // Find the highest transfer number for this year
  const lastTransfer = await prisma.transfer.findFirst({
    where: {
      transfer_no: {
        startsWith: prefix,
      },
    },
    orderBy: {
      transfer_no: "desc",
    },
    select: {
      transfer_no: true,
    },
  });

  if (!lastTransfer) {
    // First transfer of the year
    return `${prefix}001`;
  }

  // Extract number from last transfer and increment
  const parts = lastTransfer.transfer_no.split("-");
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

    // Validate that from and to locations are different
    if (data.from_location_id === data.to_location_id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "SAME_LOCATION_TRANSFER",
          message: "Cannot transfer from a location to itself",
        },
      });
    }

    // Extract item IDs for batch query
    const itemIds = data.lines.map((line) => line.item_id);

    // OPTIMIZATION: Batch all validation queries into a single parallel fetch
    const [fromLocation, toLocation, userLocation, items, stockRecords] = await Promise.all([
      // Check if from location exists
      prisma.location.findUnique({
        where: { id: data.from_location_id },
      }),
      // Check if to location exists
      prisma.location.findUnique({
        where: { id: data.to_location_id },
      }),
      // For operators, check location access
      user.role === "OPERATOR"
        ? prisma.userLocation.findUnique({
            where: {
              user_id_location_id: {
                user_id: user.id,
                location_id: data.from_location_id,
              },
            },
          })
        : Promise.resolve({ location_id: data.from_location_id }), // Non-null for admins/supervisors
      // Verify items exist and are active
      prisma.item.findMany({
        where: {
          id: { in: itemIds },
          is_active: true,
        },
      }),
      // Get stock levels and WACs for all items at source location
      prisma.locationStock.findMany({
        where: {
          location_id: data.from_location_id,
          item_id: { in: itemIds },
        },
      }),
    ]);

    if (!fromLocation) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "FROM_LOCATION_NOT_FOUND",
          message: "Source location not found",
        },
      });
    }

    if (!toLocation) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "TO_LOCATION_NOT_FOUND",
          message: "Destination location not found",
        },
      });
    }

    // Check user has access to source location (Operators need explicit assignment)
    if (user.role === "OPERATOR" && !userLocation) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "LOCATION_ACCESS_DENIED",
          message: "You do not have access to the source location",
        },
      });
    }
    // Admins and Supervisors have implicit access to all locations

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

    // Validate sufficient stock for all items at source location
    // Use the already-fetched stockRecords instead of making another DB call
    const stockMap = new Map<string, number>();
    stockRecords.forEach((stock) => {
      stockMap.set(stock.item_id, parseFloat(stock.on_hand.toString()));
    });

    const insufficientStock: Array<{ item: string; requested: number; available: number }> = [];
    for (const line of data.lines) {
      const available = stockMap.get(line.item_id) || 0;
      if (line.quantity > available) {
        const item = items.find((i) => i.id === line.item_id);
        insufficientStock.push({
          item: item?.name || line.item_id,
          requested: line.quantity,
          available,
        });
      }
    }

    if (insufficientStock.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "INSUFFICIENT_STOCK",
          message: "Insufficient stock for one or more items",
          details: insufficientStock,
        },
      });
    }

    // Create a map of item_id -> WAC
    const wacMap = new Map<string, number>();
    stockRecords.forEach((stock) => {
      wacMap.set(stock.item_id, parseFloat(stock.wac.toString()));
    });

    // Generate transfer number
    const transferNo = await generateTransferNumber();

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create transfer record
      const transfer = await tx.transfer.create({
        data: {
          transfer_no: transferNo,
          from_location_id: data.from_location_id,
          to_location_id: data.to_location_id,
          status: "PENDING_APPROVAL",
          requested_by: user.id,
          request_date: new Date(data.request_date),
          notes: data.notes,
          total_value: 0, // Will be calculated from lines
        },
      });

      let totalValue = 0;
      const createdLines: unknown[] = [];

      // Process each transfer line
      for (const lineData of data.lines) {
        const item = items.find((i) => i.id === lineData.item_id)!;
        const wac = wacMap.get(lineData.item_id) || 0;
        const lineValue = lineData.quantity * wac;

        // Create transfer line
        const transferLine = await tx.transferLine.create({
          data: {
            transfer_id: transfer.id,
            item_id: lineData.item_id,
            quantity: lineData.quantity,
            wac_at_transfer: wac,
            line_value: lineValue,
          },
        });

        createdLines.push({
          ...transferLine,
          item,
        });

        totalValue += lineValue;
      }

      // Update transfer with calculated total
      const updatedTransfer = await tx.transfer.update({
        where: { id: transfer.id },
        data: {
          total_value: totalValue,
        },
        include: {
          from_location: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
            },
          },
          to_location: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
            },
          },
          requester: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
        },
      });

      return {
        transfer: updatedTransfer,
        lines: createdLines,
      };
    });

    return {
      message: "Transfer created successfully and is pending approval",
      transfer: {
        id: result.transfer.id,
        transfer_no: result.transfer.transfer_no,
        request_date: result.transfer.request_date,
        status: result.transfer.status,
        total_value: result.transfer.total_value,
        notes: result.transfer.notes,
        from_location: result.transfer.from_location,
        to_location: result.transfer.to_location,
        requester: result.transfer.requester,
        created_at: result.transfer.created_at,
        lines: result.lines.map((line: unknown) => {
          const transferLine = line as {
            id: string;
            item: { id: string; code: string; name: string; unit: string };
            quantity: number;
            wac_at_transfer: number;
            line_value: number;
          };
          return {
            id: transferLine.id,
            item: {
              id: transferLine.item.id,
              code: transferLine.item.code,
              name: transferLine.item.name,
              unit: transferLine.item.unit,
            },
            quantity: transferLine.quantity,
            wac_at_transfer: transferLine.wac_at_transfer,
            line_value: transferLine.line_value,
          };
        }),
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

    console.error("Error creating transfer:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to create transfer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
