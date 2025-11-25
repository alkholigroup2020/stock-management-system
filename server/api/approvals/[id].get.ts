/**
 * GET /api/approvals/:id
 *
 * Fetch a single approval by ID
 *
 * Returns:
 * - Approval details with requester and reviewer info
 * - Entity details based on entity_type
 *
 * Permissions:
 * - Authenticated users (may filter based on role in future)
 */

import prisma from "~~/server/utils/prisma";

export default defineEventHandler(async (event) => {
  const user = event.context.user;

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
    const approvalId = getRouterParam(event, "id");

    if (!approvalId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        data: {
          code: "MISSING_PARAMETERS",
          message: "Approval ID is required",
        },
      });
    }

    // Fetch the approval with requester and reviewer info
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            full_name: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    if (!approval) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        data: {
          code: "APPROVAL_NOT_FOUND",
          message: "Approval not found",
        },
      });
    }

    // Fetch entity details based on entity_type
    let entity = null;
    switch (approval.entity_type) {
      case "PERIOD_CLOSE":
        entity = await prisma.period.findUnique({
          where: { id: approval.entity_id },
          select: {
            id: true,
            name: true,
            status: true,
            start_date: true,
            end_date: true,
            period_locations: {
              select: {
                location_id: true,
                status: true,
                opening_value: true,
                closing_value: true,
                ready_at: true,
                closed_at: true,
                location: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    type: true,
                  },
                },
              },
              orderBy: {
                location: {
                  name: "asc",
                },
              },
            },
          },
        });
        break;

      case "TRANSFER":
        entity = await prisma.transfer.findUnique({
          where: { id: approval.entity_id },
          select: {
            id: true,
            transfer_no: true,
            status: true,
            from_location: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            to_location: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            total_value: true,
            request_date: true,
          },
        });
        break;

      case "PRF":
        entity = await prisma.pRF.findUnique({
          where: { id: approval.entity_id },
          select: {
            id: true,
            prf_no: true,
            status: true,
            request_date: true,
            location: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        });
        break;

      case "PO":
        entity = await prisma.pO.findUnique({
          where: { id: approval.entity_id },
          select: {
            id: true,
            po_no: true,
            status: true,
            total_amount: true,
            supplier: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        });
        break;
    }

    return {
      approval: {
        id: approval.id,
        entityType: approval.entity_type,
        entityId: approval.entity_id,
        status: approval.status,
        requester: approval.requester,
        reviewer: approval.reviewer,
        requestedAt: approval.requested_at,
        reviewedAt: approval.reviewed_at,
        comments: approval.comments,
      },
      entity,
    };
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error fetching approval:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      data: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch approval",
      },
    });
  }
});
