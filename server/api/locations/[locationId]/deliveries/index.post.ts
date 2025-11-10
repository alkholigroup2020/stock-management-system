/**
 * POST /api/locations/:locationId/deliveries
 *
 * Create a new delivery (goods receipt) for a location
 *
 * This endpoint handles:
 * - Delivery creation with multiple line items
 * - Automatic price variance detection
 * - Auto-NCR creation for price variances
 * - Stock quantity updates (on_hand)
 * - WAC (Weighted Average Cost) recalculation
 *
 * Business Rules:
 * - Period must be OPEN
 * - Price variance triggers automatic NCR creation
 * - WAC is recalculated using: newWAC = (currentQty × currentWAC + receivedQty × receiptPrice) / (currentQty + receivedQty)
 * - All operations must succeed in a single database transaction
 *
 * Permissions:
 * - User must have POST or MANAGE access to the location
 */

import prisma from '../../../../utils/prisma'
import { z } from 'zod'
import { calculateWAC } from '../../../../utils/wac'
import { detectAndCreateNCR } from '../../../../utils/priceVariance'

// Delivery line schema
const deliveryLineSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
})

// Request body schema
const bodySchema = z.object({
  supplier_id: z.string().uuid(),
  po_id: z.string().uuid().optional(),
  invoice_no: z.string().max(100).optional(),
  delivery_note: z.string().optional(),
  delivery_date: z.string(), // ISO date string
  lines: z.array(deliveryLineSchema).min(1),
})

/**
 * Generate next delivery number
 * Format: DEL-YYYY-NNN (e.g., DEL-2025-001)
 */
async function generateDeliveryNumber(year?: number): Promise<string> {
  const currentYear = year || new Date().getFullYear()
  const prefix = `DEL-${currentYear}-`

  // Find the highest delivery number for this year
  const lastDelivery = await prisma.delivery.findFirst({
    where: {
      delivery_no: {
        startsWith: prefix,
      },
    },
    orderBy: {
      delivery_no: 'desc',
    },
    select: {
      delivery_no: true,
    },
  })

  if (!lastDelivery) {
    // First delivery of the year
    return `${prefix}001`
  }

  // Extract number from last delivery and increment
  const lastNumber = parseInt(lastDelivery.delivery_no.split('-')[2], 10)
  const nextNumber = lastNumber + 1

  // Pad with zeros to 3 digits
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`
}

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
    const locationId = getRouterParam(event, 'locationId')

    if (!locationId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          code: 'MISSING_LOCATION_ID',
          message: 'Location ID is required',
        },
      })
    }

    // Parse and validate request body
    const body = await readBody(event)
    const data = bodySchema.parse(body)

    // Check if location exists and user has access
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    })

    if (!location) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        data: {
          code: 'LOCATION_NOT_FOUND',
          message: 'Location not found',
        },
      })
    }

    // Check user has POST or MANAGE access to location
    const userLocation = await prisma.userLocation.findUnique({
      where: {
        user_id_location_id: {
          user_id: user.id,
          location_id: locationId,
        },
      },
    })

    if (!userLocation && user.role !== 'ADMIN' && user.role !== 'SUPERVISOR') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        data: {
          code: 'LOCATION_ACCESS_DENIED',
          message: 'You do not have access to this location',
        },
      })
    }

    if (userLocation && userLocation.access_level === 'VIEW') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        data: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to post deliveries at this location',
        },
      })
    }

    // Get current open period
    const currentPeriod = await prisma.period.findFirst({
      where: {
        status: 'OPEN',
      },
      include: {
        period_locations: {
          where: {
            location_id: locationId,
          },
        },
      },
    })

    if (!currentPeriod) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          code: 'NO_OPEN_PERIOD',
          message: 'No open period found',
        },
      })
    }

    // Check if period is open for this location
    const periodLocation = currentPeriod.period_locations[0]
    if (!periodLocation || periodLocation.status !== 'OPEN') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          code: 'PERIOD_CLOSED',
          message: 'Period is not open for this location',
        },
      })
    }

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplier_id },
    })

    if (!supplier) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        data: {
          code: 'SUPPLIER_NOT_FOUND',
          message: 'Supplier not found',
        },
      })
    }

    // Verify PO if provided
    if (data.po_id) {
      const po = await prisma.pO.findUnique({
        where: { id: data.po_id },
      })

      if (!po) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Not Found',
          data: {
            code: 'PO_NOT_FOUND',
            message: 'Purchase Order not found',
          },
        })
      }
    }

    // Verify all items exist
    const itemIds = data.lines.map((line) => line.item_id)
    const items = await prisma.item.findMany({
      where: {
        id: { in: itemIds },
        is_active: true,
      },
    })

    if (items.length !== itemIds.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          code: 'INVALID_ITEMS',
          message: 'One or more items not found or inactive',
        },
      })
    }

    // Get period prices for all items
    const periodPrices = await prisma.itemPrice.findMany({
      where: {
        period_id: currentPeriod.id,
        item_id: { in: itemIds },
      },
    })

    // Create a map of item_id -> period_price
    const periodPriceMap = new Map<string, number>()
    periodPrices.forEach((price) => {
      periodPriceMap.set(price.item_id, parseFloat(price.price.toString()))
    })

    // Check if all items have period prices
    const missingPrices = itemIds.filter((id) => !periodPriceMap.has(id))
    if (missingPrices.length > 0) {
      const missingItems = items
        .filter((item) => missingPrices.includes(item.id))
        .map((item) => item.name)

      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          code: 'MISSING_PERIOD_PRICES',
          message: `Period prices not set for items: ${missingItems.join(', ')}`,
          details: { missing_item_ids: missingPrices },
        },
      })
    }

    // Generate delivery number
    const deliveryNo = await generateDeliveryNumber()

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create delivery record
      const delivery = await tx.delivery.create({
        data: {
          delivery_no: deliveryNo,
          period_id: currentPeriod.id,
          location_id: locationId,
          supplier_id: data.supplier_id,
          po_id: data.po_id,
          invoice_no: data.invoice_no,
          delivery_note: data.delivery_note,
          delivery_date: new Date(data.delivery_date),
          total_amount: 0, // Will be calculated from lines
          has_variance: false, // Will be set based on variance detection
          posted_by: user.id,
        },
      })

      let totalAmount = 0
      let hasVariance = false
      const createdLines: any[] = []
      const createdNCRs: any[] = []

      // Process each delivery line
      for (const lineData of data.lines) {
        const item = items.find((i) => i.id === lineData.item_id)!
        const periodPrice = periodPriceMap.get(lineData.item_id)!
        const lineValue = lineData.quantity * lineData.unit_price

        // Calculate price variance
        const priceVariance = lineData.unit_price - periodPrice

        // Create delivery line
        const deliveryLine = await tx.deliveryLine.create({
          data: {
            delivery_id: delivery.id,
            item_id: lineData.item_id,
            quantity: lineData.quantity,
            unit_price: lineData.unit_price,
            period_price: periodPrice,
            price_variance: priceVariance,
            line_value: lineValue,
          },
        })

        createdLines.push({
          ...deliveryLine,
          item,
        })

        totalAmount += lineValue

        // Check for price variance and create NCR if needed
        if (priceVariance !== 0) {
          hasVariance = true

          const ncrResult = await detectAndCreateNCR(
            tx,
            {
              locationId,
              deliveryId: delivery.id,
              deliveryLineId: deliveryLine.id,
              itemId: lineData.item_id,
              itemName: item.name,
              itemCode: item.code,
              quantity: lineData.quantity,
              unitPrice: lineData.unit_price,
              periodPrice: periodPrice,
              createdBy: user.id,
            }
          )

          if (ncrResult.ncr) {
            createdNCRs.push(ncrResult.ncr)
          }
        }

        // Update or create location stock
        const existingStock = await tx.locationStock.findUnique({
          where: {
            location_id_item_id: {
              location_id: locationId,
              item_id: lineData.item_id,
            },
          },
        })

        if (existingStock) {
          // Update existing stock with new WAC
          const currentQty = parseFloat(existingStock.on_hand.toString())
          const currentWAC = parseFloat(existingStock.wac.toString())
          const receivedQty = lineData.quantity
          const receiptPrice = lineData.unit_price

          const wacResult = calculateWAC(currentQty, currentWAC, receivedQty, receiptPrice)

          await tx.locationStock.update({
            where: {
              location_id_item_id: {
                location_id: locationId,
                item_id: lineData.item_id,
              },
            },
            data: {
              on_hand: wacResult.newQuantity,
              wac: wacResult.newWAC,
            },
          })
        } else {
          // Create new stock record (first receipt for this item at this location)
          await tx.locationStock.create({
            data: {
              location_id: locationId,
              item_id: lineData.item_id,
              on_hand: lineData.quantity,
              wac: lineData.unit_price, // First receipt sets initial WAC
            },
          })
        }
      }

      // Update delivery with calculated total and variance flag
      const updatedDelivery = await tx.delivery.update({
        where: { id: delivery.id },
        data: {
          total_amount: totalAmount,
          has_variance: hasVariance,
        },
        include: {
          supplier: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          period: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          poster: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
          po: {
            select: {
              id: true,
              po_no: true,
            },
          },
        },
      })

      return {
        delivery: updatedDelivery,
        lines: createdLines,
        ncrs: createdNCRs,
      }
    })

    return {
      message: 'Delivery created successfully',
      delivery: {
        id: result.delivery.id,
        delivery_no: result.delivery.delivery_no,
        delivery_date: result.delivery.delivery_date,
        invoice_no: result.delivery.invoice_no,
        delivery_note: result.delivery.delivery_note,
        total_amount: result.delivery.total_amount,
        has_variance: result.delivery.has_variance,
        posted_at: result.delivery.posted_at,
        supplier: result.delivery.supplier,
        period: result.delivery.period,
        po: result.delivery.po,
        poster: result.delivery.poster,
        lines: result.lines.map((line) => ({
          id: line.id,
          item: {
            id: line.item.id,
            code: line.item.code,
            name: line.item.name,
            unit: line.item.unit,
          },
          quantity: line.quantity,
          unit_price: line.unit_price,
          period_price: line.period_price,
          price_variance: line.price_variance,
          line_value: line.line_value,
        })),
        ncrs: result.ncrs.map((ncr) => ({
          id: ncr.id,
          ncr_no: ncr.ncr_no,
          type: ncr.type,
          value: ncr.value,
          reason: ncr.reason,
        })),
      },
    }
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        data: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.issues,
        },
      })
    }

    // Re-throw createError errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Error creating delivery:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create delivery',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    })
  }
})
