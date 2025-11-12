/**
 * POST /api/locations/:id/users
 *
 * Assign a user to a location with specific access level
 *
 * Admin only
 */

import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import type { UserRole } from '@prisma/client'

const prisma = new PrismaClient()

// User session type
interface UserSession {
  id: string
  username: string
  email: string
  role: UserRole
  default_location_id: string | null
}

// Request body validation schema
const assignUserSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  access_level: z.enum(['VIEW', 'POST', 'MANAGE']).describe('Access level must be VIEW, POST, or MANAGE'),
})

export default defineEventHandler(async (event) => {
  try {
    // Get authenticated user from session
    const session = await getUserSession(event)
    const authUser = session?.user as UserSession | undefined

    if (!authUser?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        data: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to perform this action',
        },
      })
    }

    // Only admins can assign users to locations
    if (authUser.role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        data: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only administrators can assign users to locations',
        },
      })
    }

    // Get location ID from route params
    const locationId = event.context.params?.id

    if (!locationId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          code: 'INVALID_LOCATION_ID',
          message: 'Location ID is required',
        },
      })
    }

    // Validate request body
    const body = await readBody(event)
    const validatedData = assignUserSchema.parse(body)

    // Check if location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true, name: true, code: true },
    })

    if (!location) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        data: {
          code: 'LOCATION_NOT_FOUND',
          message: `Location with ID ${locationId} not found`,
        },
      })
    }

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: validatedData.user_id },
      select: {
        id: true,
        username: true,
        full_name: true,
        is_active: true,
      },
    })

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        data: {
          code: 'USER_NOT_FOUND',
          message: `User with ID ${validatedData.user_id} not found`,
        },
      })
    }

    if (!user.is_active) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          code: 'USER_INACTIVE',
          message: 'Cannot assign inactive user to location',
        },
      })
    }

    // Check if user is already assigned to this location
    const existingAssignment = await prisma.userLocation.findUnique({
      where: {
        user_id_location_id: {
          user_id: validatedData.user_id,
          location_id: locationId,
        },
      },
    })

    if (existingAssignment) {
      // Update existing assignment
      const updatedAssignment = await prisma.userLocation.update({
        where: {
          user_id_location_id: {
            user_id: validatedData.user_id,
            location_id: locationId,
          },
        },
        data: {
          access_level: validatedData.access_level,
          assigned_by: authUser.id,
          assigned_at: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              full_name: true,
              email: true,
              role: true,
            },
          },
          location: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
            },
          },
          assigner: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
        },
      })

      return {
        success: true,
        message: `Updated ${user.full_name || user.username}'s access to ${location.name}`,
        assignment: updatedAssignment,
        updated: true,
      }
    }

    // Create new assignment
    const assignment = await prisma.userLocation.create({
      data: {
        user_id: validatedData.user_id,
        location_id: locationId,
        access_level: validatedData.access_level,
        assigned_by: authUser.id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            full_name: true,
            email: true,
            role: true,
          },
        },
        location: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
        assigner: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
      },
    })

    return {
      success: true,
      message: `Successfully assigned ${user.full_name || user.username} to ${location.name}`,
      assignment,
      updated: false,
    }
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.issues,
        },
      })
    }

    // Re-throw H3 errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    // Log unexpected errors
    console.error('Error assigning user to location:', error)

    // Generic error response
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while assigning user to location',
      },
    })
  }
})
