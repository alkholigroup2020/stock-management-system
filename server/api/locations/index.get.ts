/**
 * GET /api/locations
 *
 * Fetch all locations with optional filters
 *
 * Query Parameters:
 * - type: Filter by location type (KITCHEN, STORE, CENTRAL, WAREHOUSE)
 * - is_active: Filter by active status (true/false)
 * - search: Search by name or code
 *
 * Permissions:
 * - ADMIN/SUPERVISOR: Can view all locations
 * - OPERATOR: Can only view assigned locations
 */

import prisma from '../../utils/prisma'
import { z } from 'zod'

// Query schema for validation
const querySchema = z.object({
  type: z.enum(['KITCHEN', 'STORE', 'CENTRAL', 'WAREHOUSE']).optional(),
  is_active: z.string().transform((val) => val === 'true').optional(),
  search: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: {
        code: 'NOT_AUTHENTICATED',
        message: 'You must be logged in to access this resource',
      },
    })
  }

  try {
    // Parse and validate query parameters
    const query = await getQuery(event)
    const { type, is_active, search } = querySchema.parse(query)

    // Build where clause based on filters
    const where: any = {}

    // Filter by type if provided
    if (type) {
      where.type = type
    }

    // Filter by active status if provided
    if (is_active !== undefined) {
      where.is_active = is_active
    }

    // Search by name or code if provided
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    }

    // ADMIN and SUPERVISOR can view all locations
    if (user.role === 'ADMIN' || user.role === 'SUPERVISOR') {
      const locations = await prisma.location.findMany({
        where,
        include: {
          manager: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
          _count: {
            select: {
              user_locations: true,
              location_stock: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      })

      return {
        locations,
        count: locations.length,
      }
    }

    // OPERATOR can only view assigned locations
    const userLocationIds = user.locations?.map((loc: any) => loc.location_id) || []

    if (userLocationIds.length === 0) {
      return {
        locations: [],
        count: 0,
      }
    }

    // Add user location filter
    where.id = { in: userLocationIds }

    const locations = await prisma.location.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
        _count: {
          select: {
            user_locations: true,
            location_stock: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return {
      locations,
      count: locations.length,
    }
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
        },
      })
    }

    console.error('Error fetching locations:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch locations',
      },
    })
  }
})
