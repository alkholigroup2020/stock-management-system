/**
 * PATCH /api/items/:id
 *
 * Update an existing item
 *
 * Body (all fields optional):
 * - name: Item name
 * - unit: Unit of measure (KG, EA, LTR, BOX, CASE, PACK)
 * - category: Category
 * - sub_category: Sub-category
 * - is_active: Active status
 *
 * Note: Item code cannot be changed
 *
 * Permissions:
 * - ADMIN only
 */

import prisma from '../../utils/prisma'
import { z } from 'zod'

// Request body schema for update (all fields optional)
const updateItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  unit: z.enum(['KG', 'EA', 'LTR', 'BOX', 'CASE', 'PACK']).optional(),
  category: z.string().max(50).optional().nullable(),
  sub_category: z.string().max(50).optional().nullable(),
  is_active: z.boolean().optional(),
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

  // Check if user is ADMIN
  if (user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      data: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only admins can update items',
      },
    })
  }

  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          code: 'MISSING_ID',
          message: 'Item ID is required',
        },
      })
    }

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id },
    })

    if (!existingItem) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        data: {
          code: 'ITEM_NOT_FOUND',
          message: 'Item not found',
        },
      })
    }

    // Parse and validate request body
    const body = await readBody(event)
    const data = updateItemSchema.parse(body)

    // Check if there's anything to update
    if (Object.keys(data).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          code: 'NO_UPDATE_DATA',
          message: 'No update data provided',
        },
      })
    }

    // Update the item
    const item = await prisma.item.update({
      where: { id },
      data,
    })

    return {
      item,
      message: 'Item updated successfully',
    }
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid item data',
          details: error.errors,
        },
      })
    }

    // Re-throw createError errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error updating item:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update item',
      },
    })
  }
})
