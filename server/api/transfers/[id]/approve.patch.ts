/**
 * PATCH /api/transfers/:id/approve
 *
 * Approve a transfer and execute stock movement
 *
 * This endpoint handles:
 * - Transfer approval by Supervisor or Admin
 * - Atomic stock movement in a database transaction
 * - Deduct stock from source location
 * - Add stock to destination location (using source WAC)
 * - Update transfer status to COMPLETED
 *
 * Business Rules:
 * - Only Supervisor or Admin can approve transfers
 * - Transfer must be in PENDING_APPROVAL status
 * - Source location must still have sufficient stock at approval time
 * - Stock movement is atomic (all-or-nothing)
 * - Destination receives stock at source location's WAC
 * - If destination already has stock, WAC is recalculated
 *
 * Permissions:
 * - User must be Supervisor or Admin
 */

import prisma from "../../../utils/prisma";
import { calculateWAC } from "../../../utils/wac";
import { validateAndThrowIfInsufficientStock } from "../../../utils/stockValidation";
import type { UserRole } from "@prisma/client";

// User session type
interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  default_location_id: string | null;
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
    // Check if user is Supervisor or Admin
    if (user.role !== "SUPERVISOR" && user.role !== "ADMIN") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        data: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Only Supervisors and Admins can approve transfers",
        },
      });
    }

    const transferId = getRouterParam(event, "id");

    if (!transferId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_TRANSFER_ID",
          message: "Transfer ID is required",
        },
      });
    }

    // Fetch transfer with lines
    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      include: {
        transfer_lines: {
          include: {
            item: {
              select: {
                id: true,
                code: true,
                name: true,
                unit: true,
              },
            },
          },
        },
        from_location: {
          select: {
            id: true,
            name: true,
          },
        },
        to_location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!transfer) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "TRANSFER_NOT_FOUND",
          message: "Transfer not found",
        },
      });
    }

    // Check if transfer is in PENDING_APPROVAL status
    if (transfer.status !== "PENDING_APPROVAL") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "INVALID_STATUS",
          message: `Transfer cannot be approved from status ${transfer.status}. Only transfers in PENDING_APPROVAL status can be approved.`,
        },
      });
    }

    // Validate that source location still has sufficient stock
    await validateAndThrowIfInsufficientStock(
      transfer.from_location_id,
      transfer.transfer_lines.map((line) => ({
        itemId: line.item_id,
        quantity: parseFloat(line.quantity.toString()),
      }))
    );

    // Execute transfer in a transaction with extended timeout
    // Default 5s timeout may not be enough for multiple stock updates + network latency
    const result = await prisma.$transaction(
      async (tx) => {
      // Process each transfer line
      for (const line of transfer.transfer_lines) {
        const itemId = line.item_id;
        const quantity = parseFloat(line.quantity.toString());
        const wacAtTransfer = parseFloat(line.wac_at_transfer.toString());

        // 1. Deduct from source location
        const sourceStock = await tx.locationStock.findUnique({
          where: {
            location_id_item_id: {
              location_id: transfer.from_location_id,
              item_id: itemId,
            },
          },
        });

        if (!sourceStock) {
          throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
            data: {
              code: "STOCK_RECORD_NOT_FOUND",
              message: `Stock record not found for item ${line.item.name} at source location`,
            },
          });
        }

        const newSourceQuantity = parseFloat(sourceStock.on_hand.toString()) - quantity;

        await tx.locationStock.update({
          where: {
            location_id_item_id: {
              location_id: transfer.from_location_id,
              item_id: itemId,
            },
          },
          data: {
            on_hand: newSourceQuantity,
          },
        });

        // 2. Add to destination location
        const destStock = await tx.locationStock.findUnique({
          where: {
            location_id_item_id: {
              location_id: transfer.to_location_id,
              item_id: itemId,
            },
          },
        });

        if (destStock) {
          // Update existing stock with recalculated WAC
          const currentQty = parseFloat(destStock.on_hand.toString());
          const currentWAC = parseFloat(destStock.wac.toString());
          const receivedQty = quantity;
          const receiptPrice = wacAtTransfer; // Use source WAC as receipt price

          const wacResult = calculateWAC(currentQty, currentWAC, receivedQty, receiptPrice);

          await tx.locationStock.update({
            where: {
              location_id_item_id: {
                location_id: transfer.to_location_id,
                item_id: itemId,
              },
            },
            data: {
              on_hand: wacResult.newQuantity,
              wac: wacResult.newWAC,
            },
          });
        } else {
          // Create new stock record at destination
          await tx.locationStock.create({
            data: {
              location_id: transfer.to_location_id,
              item_id: itemId,
              on_hand: quantity,
              wac: wacAtTransfer, // Use source WAC
            },
          });
        }
      }

      // 3. Update transfer status to COMPLETED
      const updatedTransfer = await tx.transfer.update({
        where: { id: transferId },
        data: {
          status: "COMPLETED",
          approved_by: user.id,
          approval_date: new Date(),
          transfer_date: new Date(),
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
          approver: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
          transfer_lines: {
            include: {
              item: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  unit: true,
                },
              },
            },
          },
        },
      });

      return updatedTransfer;
      },
      {
        timeout: 30000, // 30 seconds for stock movement operations
        maxWait: 10000, // Max 10 seconds to acquire transaction
      }
    );

    return {
      message: "Transfer approved and completed successfully. Stock has been moved.",
      transfer: {
        id: result.id,
        transfer_no: result.transfer_no,
        request_date: result.request_date,
        approval_date: result.approval_date,
        transfer_date: result.transfer_date,
        status: result.status,
        total_value: result.total_value,
        notes: result.notes,
        from_location: result.from_location,
        to_location: result.to_location,
        requester: result.requester,
        approver: result.approver,
        lines: result.transfer_lines.map((line) => ({
          id: line.id,
          item: line.item,
          quantity: line.quantity,
          wac_at_transfer: line.wac_at_transfer,
          line_value: line.line_value,
        })),
      },
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error approving transfer:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to approve transfer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});
