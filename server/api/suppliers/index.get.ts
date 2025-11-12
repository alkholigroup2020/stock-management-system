import { defineEventHandler } from "h3";
import prisma from "../../utils/prisma";

/**
 * GET /api/suppliers
 * Fetch all suppliers with optional filtering
 * Returns list of active suppliers
 */
export default defineEventHandler(async () => {
  try {
    // Fetch all active suppliers
    const suppliers = await prisma.supplier.findMany({
      where: {
        is_active: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        contact: true,
        is_active: true,
        created_at: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      suppliers,
      total: suppliers.length,
    };
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch suppliers",
      data: {
        code: "FETCH_ERROR",
        message: "An error occurred while fetching suppliers",
      },
    });
  }
});
