/**
 * GET /api/deliveries/:id
 *
 * Fetch a single delivery by ID with full details
 *
 * Includes:
 * - Delivery header information
 * - All delivery lines with item details
 * - Associated NCRs (price variance reports)
 * - Supplier, period, PO, and poster information
 *
 * Permissions:
 * - User must have access to the delivery's location
 */

import prisma from '../../utils/prisma'

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
    const deliveryId = getRouterParam(event, 'id')

    if (!deliveryId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          code: 'MISSING_DELIVERY_ID',
          message: 'Delivery ID is required',
        },
      })
    }

    // Fetch delivery with all related data
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        location: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
            contact: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
            status: true,
            start_date: true,
            end_date: true,
          },
        },
        poster: {
          select: {
            id: true,
            username: true,
            full_name: true,
            role: true,
          },
        },
        po: {
          select: {
            id: true,
            po_no: true,
            status: true,
            total_amount: true,
          },
        },
        delivery_lines: {
          include: {
            item: {
              select: {
                id: true,
                code: true,
                name: true,
                unit: true,
                category: true,
                sub_category: true,
              },
            },
          },
          orderBy: {
            item: {
              name: 'asc',
            },
          },
        },
        ncrs: {
          select: {
            id: true,
            ncr_no: true,
            type: true,
            status: true,
            reason: true,
            quantity: true,
            value: true,
            created_at: true,
            delivery_line_id: true,
            creator: {
              select: {
                id: true,
                username: true,
                full_name: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    })

    if (!delivery) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        data: {
          code: 'DELIVERY_NOT_FOUND',
          message: 'Delivery not found',
        },
      })
    }

    // Check if user has access to the delivery's location
    // Admin and Supervisor have access to all locations
    if (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR') {
      const userLocation = await prisma.userLocation.findUnique({
        where: {
          user_id_location_id: {
            user_id: user.id,
            location_id: delivery.location_id,
          },
        },
      })

      if (!userLocation) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Forbidden',
          data: {
            code: 'LOCATION_ACCESS_DENIED',
            message: 'You do not have access to this delivery\'s location',
          },
        })
      }
    }

    // Format the response
    return {
      delivery: {
        id: delivery.id,
        delivery_no: delivery.delivery_no,
        delivery_date: delivery.delivery_date,
        invoice_no: delivery.invoice_no,
        delivery_note: delivery.delivery_note,
        total_amount: delivery.total_amount,
        has_variance: delivery.has_variance,
        posted_at: delivery.posted_at,
        location: delivery.location,
        supplier: delivery.supplier,
        period: delivery.period,
        po: delivery.po,
        poster: delivery.poster,
        lines: delivery.delivery_lines.map((line) => ({
          id: line.id,
          item: line.item,
          quantity: line.quantity,
          unit_price: line.unit_price,
          period_price: line.period_price,
          price_variance: line.price_variance,
          line_value: line.line_value,
          has_variance: parseFloat(line.price_variance.toString()) !== 0,
          variance_percentage: line.period_price && parseFloat(line.period_price.toString()) > 0
            ? ((parseFloat(line.price_variance.toString()) / parseFloat(line.period_price.toString())) * 100).toFixed(2)
            : null,
        })),
        ncrs: delivery.ncrs,
        summary: {
          total_lines: delivery.delivery_lines.length,
          total_items: delivery.delivery_lines.reduce((sum, line) => sum + parseFloat(line.quantity.toString()), 0),
          total_amount: delivery.total_amount,
          variance_lines: delivery.delivery_lines.filter((line) => parseFloat(line.price_variance.toString()) !== 0).length,
          total_variance_amount: delivery.delivery_lines.reduce(
            (sum, line) => sum + (parseFloat(line.price_variance.toString()) * parseFloat(line.quantity.toString())),
            0
          ),
          ncr_count: delivery.ncrs.length,
        },
      },
    }
  } catch (error) {
    // Re-throw createError errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error fetching delivery:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch delivery',
      },
    })
  }
})
