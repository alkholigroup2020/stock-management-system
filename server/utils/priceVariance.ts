/**
 * Price Variance Detection Utility
 *
 * Handles automatic price variance detection and NCR (Non-Conformance Report) creation
 * when delivery prices differ from period-locked prices.
 *
 * Business Context:
 * - Each period locks item prices via the ItemPrice table
 * - When a delivery is posted, the actual unit_price is compared to the period_price
 * - Any variance (positive or negative) triggers automatic NCR creation
 * - NCRs are created with type=PRICE_VARIANCE and auto_generated=true
 *
 * @module server/utils/priceVariance
 */

import type { Prisma, PrismaClient } from "@prisma/client";
import { triggerNCRNotification } from "./email";

/**
 * Price variance detection result
 */
export interface PriceVarianceResult {
  hasVariance: boolean;
  variance: number; // unit_price - period_price (can be positive or negative)
  variancePercent: number; // Percentage variance relative to period_price
  varianceAmount: number; // Total variance value (variance × quantity)
  actualPrice: number;
  expectedPrice: number;
  exceedsThreshold: boolean; // Whether variance exceeds tolerance threshold
}

/**
 * NCR creation data for price variance
 */
export interface PriceVarianceNCRData {
  locationId: string;
  deliveryId: string;
  deliveryLineId: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  quantity: number;
  actualPrice: number;
  expectedPrice: number;
  variance: number;
  varianceAmount: number;
  createdBy: string;
}

/**
 * Configuration for price variance detection
 */
export interface PriceVarianceConfig {
  /**
   * Minimum percentage variance to trigger NCR creation (default: 0)
   * Set to 0 to create NCR for any price difference
   */
  thresholdPercent?: number;

  /**
   * Minimum absolute variance amount to trigger NCR creation (default: 0)
   * Set to 0 to create NCR for any price difference
   */
  thresholdAmount?: number;
}

/**
 * Default configuration for price variance detection
 * By default, ANY price difference triggers NCR creation (as per PRD)
 */
const DEFAULT_CONFIG: Required<PriceVarianceConfig> = {
  thresholdPercent: 0,
  thresholdAmount: 0,
};

/**
 * Check if a delivery line has a price variance
 *
 * Compares the actual delivery unit price with the expected period price.
 *
 * @param unitPrice - Actual price from delivery invoice
 * @param periodPrice - Expected price locked for the period
 * @param quantity - Quantity delivered
 * @param config - Optional configuration for variance thresholds
 * @returns Price variance result with detailed variance information
 *
 * @example
 * ```typescript
 * const result = checkPriceVariance(26.00, 25.50, 100);
 * // Returns: { hasVariance: true, variance: 0.50, variancePercent: 1.96, ... }
 * ```
 */
export function checkPriceVariance(
  unitPrice: number | Prisma.Decimal,
  periodPrice: number | Prisma.Decimal,
  quantity: number | Prisma.Decimal,
  config: PriceVarianceConfig = {}
): PriceVarianceResult {
  // Convert Prisma.Decimal to number for calculations
  const actualPrice = typeof unitPrice === "number" ? unitPrice : unitPrice.toNumber();
  const expectedPrice = typeof periodPrice === "number" ? periodPrice : periodPrice.toNumber();
  const qty = typeof quantity === "number" ? quantity : quantity.toNumber();

  // Validate inputs
  if (!Number.isFinite(actualPrice) || actualPrice < 0) {
    throw new Error("Invalid unit price: must be a positive finite number");
  }
  if (!Number.isFinite(expectedPrice) || expectedPrice < 0) {
    throw new Error("Invalid period price: must be a positive finite number");
  }
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("Invalid quantity: must be a positive finite number");
  }

  // Calculate variance (positive = price increase, negative = price decrease)
  const variance = actualPrice - expectedPrice;

  // Calculate percentage variance relative to expected price
  // Handle division by zero (if period_price is 0, any non-zero price is 100% variance)
  const variancePercent =
    expectedPrice > 0 ? (variance / expectedPrice) * 100 : actualPrice > 0 ? 100 : 0;

  // Calculate total variance amount (variance × quantity)
  const varianceAmount = variance * qty;

  // Check if variance exists (any non-zero difference)
  const hasVariance = variance !== 0;

  // Check if variance exceeds configured thresholds
  // Only check threshold if it was explicitly configured
  const hasPercentThreshold = config.thresholdPercent !== undefined && config.thresholdPercent > 0;
  const hasAmountThreshold = config.thresholdAmount !== undefined && config.thresholdAmount > 0;

  const exceedsPercentThreshold = hasPercentThreshold
    ? Math.abs(variancePercent) > config.thresholdPercent!
    : false;
  const exceedsAmountThreshold = hasAmountThreshold
    ? Math.abs(varianceAmount) > config.thresholdAmount!
    : false;

  // If no thresholds configured, any variance triggers NCR
  // If thresholds configured, check if any threshold is exceeded
  const exceedsThreshold =
    hasVariance &&
    ((!hasPercentThreshold && !hasAmountThreshold) || // No thresholds = any variance
      exceedsPercentThreshold ||
      exceedsAmountThreshold);

  return {
    hasVariance,
    variance: Number(variance.toFixed(4)),
    variancePercent: Number(variancePercent.toFixed(2)),
    varianceAmount: Number(varianceAmount.toFixed(2)),
    actualPrice: Number(actualPrice.toFixed(4)),
    expectedPrice: Number(expectedPrice.toFixed(4)),
    exceedsThreshold,
  };
}

/**
 * Generate next NCR number for a location
 *
 * Format: NCR-YYYY-NNN (e.g., NCR-2025-001)
 *
 * @param prisma - Prisma client instance
 * @param year - Year for NCR numbering (defaults to current year)
 * @returns Next available NCR number
 */
export async function generateNCRNumber(prisma: PrismaClient, year?: number): Promise<string> {
  const currentYear = year || new Date().getFullYear();
  const prefix = `NCR-${currentYear}-`;

  // Find the highest NCR number for this year
  const lastNCR = await prisma.nCR.findFirst({
    where: {
      ncr_no: {
        startsWith: prefix,
      },
    },
    orderBy: {
      ncr_no: "desc",
    },
    select: {
      ncr_no: true,
    },
  });

  if (!lastNCR) {
    // First NCR of the year
    return `${prefix}001`;
  }

  // Extract number from last NCR and increment
  const parts = lastNCR.ncr_no.split("-");
  const lastNumber = parseInt(parts[2] || "0", 10);
  const nextNumber = lastNumber + 1;

  // Pad with zeros to 3 digits
  return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
}

/**
 * Create an automatic NCR for price variance
 *
 * Creates a new NCR record in the database with:
 * - type: PRICE_VARIANCE
 * - auto_generated: true
 * - Links to delivery and delivery line
 * - Captures variance details in reason field
 *
 * @param prisma - Prisma client instance
 * @param data - NCR creation data
 * @returns Created NCR record
 *
 * @example
 * ```typescript
 * const ncr = await createPriceVarianceNCR(prisma, {
 *   locationId: 'loc-123',
 *   deliveryId: 'del-456',
 *   deliveryLineId: 'line-789',
 *   itemId: 'item-001',
 *   itemName: 'Rice 5kg',
 *   itemCode: 'RICE-5KG',
 *   quantity: 100,
 *   actualPrice: 26.00,
 *   expectedPrice: 25.50,
 *   variance: 0.50,
 *   varianceAmount: 50.00,
 *   createdBy: 'user-123',
 * });
 * ```
 */
export async function createPriceVarianceNCR(prisma: PrismaClient, data: PriceVarianceNCRData) {
  // Validate required data
  if (
    !data.locationId ||
    !data.deliveryId ||
    !data.deliveryLineId ||
    !data.itemId ||
    !data.createdBy
  ) {
    throw new Error("Missing required fields for NCR creation");
  }

  // Generate NCR number
  const ncrNo = await generateNCRNumber(prisma);

  // Format reason message with variance details
  const varianceType = data.variance > 0 ? "increase" : "decrease";
  const variancePercent =
    data.expectedPrice > 0 ? ((data.variance / data.expectedPrice) * 100).toFixed(2) : "100.00";

  const reason =
    `Automatic NCR for price variance detected on delivery.\n\n` +
    `Item: ${data.itemName} (${data.itemCode})\n` +
    `Quantity: ${data.quantity}\n` +
    `Expected Price (Period): SAR ${data.expectedPrice.toFixed(4)}\n` +
    `Actual Price (Delivery): SAR ${data.actualPrice.toFixed(4)}\n` +
    `Variance: SAR ${data.variance.toFixed(4)} (${variancePercent}% ${varianceType})\n` +
    `Total Variance Amount: SAR ${data.varianceAmount.toFixed(2)}\n\n` +
    `This NCR was automatically generated due to price difference from period-locked price.`;

  // Create NCR record
  const ncr = await prisma.nCR.create({
    data: {
      ncr_no: ncrNo,
      location_id: data.locationId,
      type: "PRICE_VARIANCE",
      auto_generated: true,
      delivery_id: data.deliveryId,
      delivery_line_id: data.deliveryLineId,
      reason,
      quantity: data.quantity,
      value: Math.abs(data.varianceAmount), // Store absolute value
      status: "OPEN",
      created_by: data.createdBy,
    },
    include: {
      location: {
        select: {
          code: true,
          name: true,
        },
      },
      delivery: {
        select: {
          delivery_no: true,
        },
      },
      creator: {
        select: {
          username: true,
          full_name: true,
        },
      },
    },
  });

  return ncr;
}

/**
 * Calculate price variance for a delivery line and create NCR if needed
 *
 * This is the main function to use when processing delivery lines.
 * It checks for variance, and if found, creates an automatic NCR.
 *
 * @param prisma - Prisma client instance
 * @param params - Parameters for variance check and NCR creation
 * @param config - Optional configuration for variance thresholds
 * @returns Object with variance result and created NCR (if any)
 *
 * @example
 * ```typescript
 * const result = await detectAndCreateNCR(prisma, {
 *   locationId: 'loc-123',
 *   deliveryId: 'del-456',
 *   deliveryLineId: 'line-789',
 *   itemId: 'item-001',
 *   itemName: 'Rice 5kg',
 *   itemCode: 'RICE-5KG',
 *   quantity: 100,
 *   unitPrice: 26.00,
 *   periodPrice: 25.50,
 *   createdBy: 'user-123',
 * });
 *
 * if (result.varianceResult.hasVariance) {
 *   console.log('Price variance detected, NCR created:', result.ncr?.ncr_no);
 * }
 * ```
 */
export async function detectAndCreateNCR(
  prisma: PrismaClient,
  params: {
    locationId: string;
    deliveryId: string;
    deliveryLineId: string;
    itemId: string;
    itemName: string;
    itemCode: string;
    quantity: number | Prisma.Decimal;
    unitPrice: number | Prisma.Decimal;
    periodPrice: number | Prisma.Decimal;
    createdBy: string;
  },
  config: PriceVarianceConfig = {}
) {
  // Check for price variance
  const varianceResult = checkPriceVariance(
    params.unitPrice,
    params.periodPrice,
    params.quantity,
    config
  );

  // Create NCR if variance exceeds threshold
  let ncr = null;
  if (varianceResult.exceedsThreshold) {
    ncr = await createPriceVarianceNCR(prisma, {
      locationId: params.locationId,
      deliveryId: params.deliveryId,
      deliveryLineId: params.deliveryLineId,
      itemId: params.itemId,
      itemName: params.itemName,
      itemCode: params.itemCode,
      quantity: typeof params.quantity === "number" ? params.quantity : params.quantity.toNumber(),
      actualPrice: varianceResult.actualPrice,
      expectedPrice: varianceResult.expectedPrice,
      variance: varianceResult.variance,
      varianceAmount: varianceResult.varianceAmount,
      createdBy: params.createdBy,
    });

    // Trigger email notification for the created NCR (fire-and-forget)
    // This sends notifications to Finance, Procurement, and Supplier
    if (ncr) {
      triggerNCRNotification(ncr.id, prisma);
    }
  }

  return {
    varianceResult,
    ncr,
  };
}

/**
 * Validate price variance inputs
 *
 * Helper function to validate inputs before price variance detection
 *
 * @param unitPrice - Actual price from delivery
 * @param periodPrice - Expected price from period
 * @param quantity - Quantity delivered
 * @returns Validation result with any error messages
 */
export function validatePriceVarianceInputs(
  unitPrice: number | Prisma.Decimal,
  periodPrice: number | Prisma.Decimal,
  quantity: number | Prisma.Decimal
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const actualPrice = typeof unitPrice === "number" ? unitPrice : unitPrice.toNumber();
  const expectedPrice = typeof periodPrice === "number" ? periodPrice : periodPrice.toNumber();
  const qty = typeof quantity === "number" ? quantity : quantity.toNumber();

  if (!Number.isFinite(actualPrice) || actualPrice < 0) {
    errors.push("Unit price must be a positive finite number");
  }

  if (!Number.isFinite(expectedPrice) || expectedPrice < 0) {
    errors.push("Period price must be a positive finite number");
  }

  if (!Number.isFinite(qty) || qty <= 0) {
    errors.push("Quantity must be a positive finite number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
