import { defineEventHandler, getQuery } from "h3";
import prisma from "../../utils/prisma";

/**
 * GET /api/suppliers
 * Fetch all suppliers with optional filtering
 *
 * Query Parameters:
 * - search: Search by name or code (optional)
 * - is_active: Filter by active status (optional, defaults to true if not provided)
 */
export default defineEventHandler(async (event) => {
  try {
    // Get query parameters
    const query = getQuery(event);
    const search = query.search as string | undefined;
    const isActiveParam = query.is_active;

    // Build where clause
    const where: {
      is_active?: boolean;
      OR?: Array<{ name?: { contains: string; mode: "insensitive" }; code?: { contains: string; mode: "insensitive" } }>;
    } = {};

    // Handle is_active filter
    if (isActiveParam !== undefined && isActiveParam !== "") {
      where.is_active = isActiveParam === "true" || isActiveParam === true;
    }

    // Handle search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch suppliers
    const suppliers = await prisma.supplier.findMany({
      where,
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
