/**
 * Reconciliation Calculation Utility
 *
 * This module provides utilities for calculating stock consumption and manday costs
 * for period-end reconciliations in the Stock Management System.
 *
 * Business Rules:
 * - Consumption represents the actual food/supplies used during the period
 * - Consumption is calculated from opening stock, receipts, transfers, and closing stock
 * - Adjustments (back-charges, credits, condemnations) modify the consumption
 * - Manday cost is the consumption divided by total personnel mandays
 *
 * Formulas:
 * - Consumption = Opening + Receipts + TransfersIn - TransfersOut - Closing + Adjustments
 * - Adjustments = BackCharges - Credits - Condemnations + GeneralAdjustments
 * - MandayCost = Consumption / TotalMandays
 *
 * @module server/utils/reconciliation
 */

import { Decimal } from "@prisma/client/runtime/library";

/**
 * Input parameters for consumption calculation
 */
export interface ConsumptionInput {
  /** Opening stock value at period start */
  openingStock: number | Decimal;
  /** Total value of receipts (deliveries) during period */
  receipts: number | Decimal;
  /** Total value of transfers received from other locations */
  transfersIn: number | Decimal;
  /** Total value of transfers sent to other locations */
  transfersOut: number | Decimal;
  /** Total value of issues (stock consumption) during period */
  issues: number | Decimal;
  /** Closing stock value at period end */
  closingStock: number | Decimal;
  /** General adjustments (positive or negative) */
  adjustments?: number | Decimal;
  /** Back-charges to be added to consumption */
  backCharges?: number | Decimal;
  /** Credits to be deducted from consumption */
  credits?: number | Decimal;
  /** Condemnations to be deducted from consumption */
  condemnations?: number | Decimal;
}

/**
 * Result of consumption calculation
 */
export interface ConsumptionResult {
  /** The calculated consumption value */
  consumption: number;
  /** Total value of all adjustments applied */
  totalAdjustments: number;
  /** Breakdown of the calculation for audit purposes */
  breakdown: {
    openingStock: number;
    receipts: number;
    transfersIn: number;
    transfersOut: number;
    closingStock: number;
    adjustments: number;
    backCharges: number;
    credits: number;
    condemnations: number;
  };
}

/**
 * Result of manday cost calculation
 */
export interface MandayCostResult {
  /** The calculated manday cost */
  mandayCost: number;
  /** The consumption value used in calculation */
  consumption: number;
  /** The total mandays used in calculation */
  totalMandays: number;
}

/**
 * Convert Prisma Decimal or number to number
 *
 * @param value - Value to convert (Decimal or number)
 * @returns Number value
 */
function toNumber(value: number | Decimal): number {
  if (typeof value === "number") {
    return value;
  }
  return value.toNumber();
}

/**
 * Calculate stock consumption for a period
 *
 * This function calculates the actual consumption (food/supplies used) during
 * a period by analyzing stock movements and adjustments.
 *
 * **Formula:**
 * ```
 * Consumption = Opening + Receipts + TransfersIn - TransfersOut - Closing + TotalAdjustments
 * TotalAdjustments = BackCharges - Credits - Condemnations + GeneralAdjustments
 * ```
 *
 * **Logic:**
 * - Start with opening stock
 * - Add all receipts (deliveries)
 * - Add transfers received from other locations
 * - Subtract transfers sent to other locations
 * - Subtract closing stock (what's left)
 * - Add back-charges (additional costs to include)
 * - Subtract credits (amounts to be credited back)
 * - Subtract condemnations (waste/spoilage to exclude)
 * - Add/subtract general adjustments
 *
 * **Example:**
 * ```typescript
 * // Opening: SAR 125,000, Receipts: SAR 45,000, Closing: SAR 137,000
 * // Transfers In: SAR 5,000, Transfers Out: SAR 3,000
 * // Back-charges: SAR 1,000, Credits: SAR 500, Condemnations: SAR 1,000
 * const result = calculateConsumption({
 *   openingStock: 125000,
 *   receipts: 45000,
 *   transfersIn: 5000,
 *   transfersOut: 3000,
 *   closingStock: 137000,
 *   backCharges: 1000,
 *   credits: 500,
 *   condemnations: 1000
 * })
 * // result.consumption === 34,500
 * // Opening (125k) + Receipts (45k) + TransfersIn (5k) - TransfersOut (3k)
 * // - Closing (137k) + BackCharges (1k) - Credits (0.5k) - Condemnations (1k)
 * // = 34,500
 * ```
 *
 * @param input - Consumption calculation inputs
 * @returns ConsumptionResult with consumption value and breakdown
 * @throws Error if inputs are invalid (negative stock values, non-numeric, etc.)
 */
export function calculateConsumption(input: ConsumptionInput): ConsumptionResult {
  // Convert all inputs to numbers
  const openingStock = toNumber(input.openingStock);
  const receipts = toNumber(input.receipts);
  const transfersIn = toNumber(input.transfersIn);
  const transfersOut = toNumber(input.transfersOut);
  const issues = toNumber(input.issues);
  const closingStock = toNumber(input.closingStock);
  const adjustments = toNumber(input.adjustments || 0);
  const backCharges = toNumber(input.backCharges || 0);
  const credits = toNumber(input.credits || 0);
  const condemnations = toNumber(input.condemnations || 0);

  // Input validation
  if (!Number.isFinite(openingStock)) {
    throw new Error("Invalid openingStock: must be a finite number");
  }
  if (!Number.isFinite(receipts)) {
    throw new Error("Invalid receipts: must be a finite number");
  }
  if (!Number.isFinite(transfersIn)) {
    throw new Error("Invalid transfersIn: must be a finite number");
  }
  if (!Number.isFinite(transfersOut)) {
    throw new Error("Invalid transfersOut: must be a finite number");
  }
  if (!Number.isFinite(closingStock)) {
    throw new Error("Invalid closingStock: must be a finite number");
  }
  if (!Number.isFinite(adjustments)) {
    throw new Error("Invalid adjustments: must be a finite number");
  }
  if (!Number.isFinite(backCharges)) {
    throw new Error("Invalid backCharges: must be a finite number");
  }
  if (!Number.isFinite(credits)) {
    throw new Error("Invalid credits: must be a finite number");
  }
  if (!Number.isFinite(condemnations)) {
    throw new Error("Invalid condemnations: must be a finite number");
  }

  // Validate non-negative values for stock and receipts
  if (openingStock < 0) {
    throw new Error("Invalid openingStock: cannot be negative");
  }
  if (receipts < 0) {
    throw new Error("Invalid receipts: cannot be negative");
  }
  if (transfersIn < 0) {
    throw new Error("Invalid transfersIn: cannot be negative");
  }
  if (transfersOut < 0) {
    throw new Error("Invalid transfersOut: cannot be negative");
  }
  if (closingStock < 0) {
    throw new Error("Invalid closingStock: cannot be negative");
  }

  // Calculate total adjustments
  const totalAdjustments = backCharges - credits - condemnations + adjustments;

  // Calculate consumption
  // Consumption = Opening + Receipts + TransfersIn - TransfersOut - Closing + TotalAdjustments
  const consumption =
    openingStock +
    receipts +
    transfersIn -
    transfersOut -
    closingStock +
    totalAdjustments;

  // Round to 2 decimal places for currency
  const roundedConsumption = Math.round(consumption * 100) / 100;
  const roundedTotalAdjustments = Math.round(totalAdjustments * 100) / 100;

  return {
    consumption: roundedConsumption,
    totalAdjustments: roundedTotalAdjustments,
    breakdown: {
      openingStock: Math.round(openingStock * 100) / 100,
      receipts: Math.round(receipts * 100) / 100,
      transfersIn: Math.round(transfersIn * 100) / 100,
      transfersOut: Math.round(transfersOut * 100) / 100,
      closingStock: Math.round(closingStock * 100) / 100,
      adjustments: Math.round(adjustments * 100) / 100,
      backCharges: Math.round(backCharges * 100) / 100,
      credits: Math.round(credits * 100) / 100,
      condemnations: Math.round(condemnations * 100) / 100,
    },
  };
}

/**
 * Calculate manday cost (cost per person per day)
 *
 * This function calculates the cost per manday by dividing the total
 * consumption by the total number of mandays in the period.
 *
 * **Formula:**
 * ```
 * MandayCost = Consumption / TotalMandays
 * ```
 *
 * **Business Logic:**
 * - Mandays represent the total person-days worked during the period
 * - This is calculated from POB (Personnel On Board) daily entries
 * - Manday cost is a key performance indicator for kitchen/store efficiency
 *
 * **Example:**
 * ```typescript
 * // Consumption: SAR 34,500, Total Mandays: 2,100
 * const result = calculateMandayCost(34500, 2100)
 * // result.mandayCost === 16.43 (SAR per person per day)
 * ```
 *
 * @param consumption - Total consumption value (in currency)
 * @param totalMandays - Total number of mandays in the period
 * @returns MandayCostResult with cost per manday
 * @throws Error if inputs are invalid or totalMandays is zero
 */
export function calculateMandayCost(
  consumption: number | Decimal,
  totalMandays: number
): MandayCostResult {
  // Convert consumption to number
  const consumptionValue = toNumber(consumption);

  // Input validation
  if (!Number.isFinite(consumptionValue)) {
    throw new Error("Invalid consumption: must be a finite number");
  }
  if (!Number.isFinite(totalMandays)) {
    throw new Error("Invalid totalMandays: must be a finite number");
  }
  if (totalMandays <= 0) {
    throw new Error("Invalid totalMandays: must be greater than zero");
  }

  // Calculate manday cost
  const mandayCost = consumptionValue / totalMandays;

  // Round to 2 decimal places for currency
  const roundedMandayCost = Math.round(mandayCost * 100) / 100;

  return {
    mandayCost: roundedMandayCost,
    consumption: Math.round(consumptionValue * 100) / 100,
    totalMandays,
  };
}

/**
 * Calculate both consumption and manday cost in one operation
 *
 * Convenience function that combines both calculations.
 *
 * @param input - Consumption calculation inputs
 * @param totalMandays - Total number of mandays
 * @returns Object with both consumption and manday cost results
 * @throws Error if inputs are invalid
 */
export function calculateReconciliation(
  input: ConsumptionInput,
  totalMandays: number
): {
  consumption: ConsumptionResult;
  mandayCost: MandayCostResult;
} {
  const consumptionResult = calculateConsumption(input);
  const mandayCostResult = calculateMandayCost(consumptionResult.consumption, totalMandays);

  return {
    consumption: consumptionResult,
    mandayCost: mandayCostResult,
  };
}

/**
 * Validate reconciliation inputs
 *
 * Returns an object with validation status and error messages if invalid.
 * Useful for API validation before performing calculations.
 *
 * @param input - Consumption calculation inputs
 * @param totalMandays - Total number of mandays (optional)
 * @returns Validation result with valid flag and optional error message
 */
export function validateReconciliationInputs(
  input: ConsumptionInput,
  totalMandays?: number
): { valid: boolean; error?: string } {
  try {
    // Validate consumption inputs
    calculateConsumption(input);

    // Validate mandays if provided
    if (totalMandays !== undefined) {
      if (!Number.isFinite(totalMandays)) {
        return { valid: false, error: "totalMandays must be a finite number" };
      }
      if (totalMandays <= 0) {
        return { valid: false, error: "totalMandays must be greater than zero" };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
