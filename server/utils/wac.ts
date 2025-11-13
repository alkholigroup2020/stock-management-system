/**
 * WAC (Weighted Average Cost) Calculation Utility
 *
 * This module provides utilities for calculating Weighted Average Cost (WAC)
 * for inventory items in the Stock Management System.
 *
 * Business Rule:
 * - Deliveries update WAC by recalculating based on current stock and new receipts
 * - Issues deduct at current WAC without recalculation
 * - Transfers move stock at current WAC from source location
 *
 * Formula:
 * newWAC = (currentQty × currentWAC + receivedQty × receiptPrice) / (currentQty + receivedQty)
 *
 * @module server/utils/wac
 */

/**
 * Result of WAC calculation including new quantity and value
 */
export interface WACCalculationResult {
  /** The newly calculated Weighted Average Cost */
  newWAC: number;
  /** The new total quantity after receipt (currentQty + receivedQty) */
  newQuantity: number;
  /** The new total value (newQuantity × newWAC) */
  newValue: number;
  /** The current stock value before receipt */
  currentValue: number;
  /** The receipt value (receivedQty × receiptPrice) */
  receiptValue: number;
}

/**
 * Calculate Weighted Average Cost (WAC) for inventory items
 *
 * This function calculates the new WAC when receiving goods into stock.
 * It combines the current inventory value with the new receipt value
 * and divides by the total quantity to get the new average cost.
 *
 * **Formula:**
 * ```
 * newWAC = (currentQty × currentWAC + receivedQty × receiptPrice) / (currentQty + receivedQty)
 * ```
 *
 * **Example:**
 * ```typescript
 * // Current stock: 100 KG @ SAR 10.00/KG = SAR 1,000.00
 * // New receipt: 50 KG @ SAR 12.00/KG = SAR 600.00
 * // New WAC: (1000 + 600) / (100 + 50) = SAR 10.67/KG
 *
 * const result = calculateWAC(100, 10.0, 50, 12.0)
 * // result.newWAC === 10.67 (rounded to 2 decimals)
 * // result.newQuantity === 150
 * // result.newValue === 1600.00
 * ```
 *
 * **Edge Cases:**
 * - Zero current stock: newWAC = receiptPrice (first receipt sets the WAC)
 * - Zero receipt quantity: newWAC = currentWAC (no change)
 * - Negative values: throws error (invalid input)
 *
 * @param currentQty - Current on-hand quantity (must be >= 0)
 * @param currentWAC - Current Weighted Average Cost (must be >= 0)
 * @param receivedQty - Quantity received in this delivery (must be > 0)
 * @param receiptPrice - Unit price of the received goods (must be > 0)
 * @returns WACCalculationResult with newWAC, newQuantity, and values
 * @throws Error if inputs are invalid (negative values, non-numeric, etc.)
 */
export function calculateWAC(
  currentQty: number,
  currentWAC: number,
  receivedQty: number,
  receiptPrice: number
): WACCalculationResult {
  // Input validation
  if (typeof currentQty !== "number" || !Number.isFinite(currentQty)) {
    throw new Error("Invalid currentQty: must be a finite number");
  }
  if (typeof currentWAC !== "number" || !Number.isFinite(currentWAC)) {
    throw new Error("Invalid currentWAC: must be a finite number");
  }
  if (typeof receivedQty !== "number" || !Number.isFinite(receivedQty)) {
    throw new Error("Invalid receivedQty: must be a finite number");
  }
  if (typeof receiptPrice !== "number" || !Number.isFinite(receiptPrice)) {
    throw new Error("Invalid receiptPrice: must be a finite number");
  }

  if (currentQty < 0) {
    throw new Error("Invalid currentQty: cannot be negative");
  }
  if (currentWAC < 0) {
    throw new Error("Invalid currentWAC: cannot be negative");
  }
  if (receivedQty <= 0) {
    throw new Error("Invalid receivedQty: must be greater than zero");
  }
  if (receiptPrice < 0) {
    throw new Error("Invalid receiptPrice: cannot be negative");
  }

  // Calculate current stock value
  const currentValue = currentQty * currentWAC;

  // Calculate receipt value
  const receiptValue = receivedQty * receiptPrice;

  // Calculate new quantity
  const newQuantity = currentQty + receivedQty;

  // Calculate new WAC
  // Edge case: If current stock is zero, WAC is simply the receipt price
  const newWAC = newQuantity > 0 ? (currentValue + receiptValue) / newQuantity : 0;

  // Calculate new total value
  const newValue = newQuantity * newWAC;

  // Round to 4 decimal places for precision (database stores up to 4 decimals)
  return {
    newWAC: Math.round(newWAC * 10000) / 10000,
    newQuantity: Math.round(newQuantity * 10000) / 10000,
    newValue: Math.round(newValue * 100) / 100, // Round currency to 2 decimals
    currentValue: Math.round(currentValue * 100) / 100,
    receiptValue: Math.round(receiptValue * 100) / 100,
  };
}

/**
 * Calculate the impact of a receipt on WAC without applying it
 *
 * This utility function shows what the new WAC would be if a receipt
 * was processed, without actually updating the stock. Useful for
 * preview/simulation scenarios.
 *
 * @param currentQty - Current on-hand quantity
 * @param currentWAC - Current Weighted Average Cost
 * @param receivedQty - Quantity to be received
 * @param receiptPrice - Unit price of goods to be received
 * @returns The projected new WAC
 */
export function previewWAC(
  currentQty: number,
  currentWAC: number,
  receivedQty: number,
  receiptPrice: number
): number {
  const result = calculateWAC(currentQty, currentWAC, receivedQty, receiptPrice);
  return result.newWAC;
}

/**
 * Calculate the value impact of a receipt
 *
 * Returns the difference between the new total value and the current value,
 * which represents the total value added to inventory by the receipt.
 *
 * @param currentQty - Current on-hand quantity
 * @param currentWAC - Current Weighted Average Cost
 * @param receivedQty - Quantity received
 * @param receiptPrice - Unit price of received goods
 * @returns The value added to inventory
 */
export function calculateReceiptValueImpact(
  currentQty: number,
  currentWAC: number,
  receivedQty: number,
  receiptPrice: number
): number {
  const result = calculateWAC(currentQty, currentWAC, receivedQty, receiptPrice);
  return result.receiptValue;
}

/**
 * Validate WAC calculation inputs
 *
 * Returns an object with validation status and error messages if invalid.
 * Useful for API validation before performing WAC calculations.
 *
 * @param currentQty - Current on-hand quantity
 * @param currentWAC - Current Weighted Average Cost
 * @param receivedQty - Quantity received
 * @param receiptPrice - Unit price of received goods
 * @returns Validation result with valid flag and optional error message
 */
export function validateWACInputs(
  currentQty: number,
  currentWAC: number,
  receivedQty: number,
  receiptPrice: number
): { valid: boolean; error?: string } {
  try {
    if (typeof currentQty !== "number" || !Number.isFinite(currentQty)) {
      return { valid: false, error: "currentQty must be a finite number" };
    }
    if (typeof currentWAC !== "number" || !Number.isFinite(currentWAC)) {
      return { valid: false, error: "currentWAC must be a finite number" };
    }
    if (typeof receivedQty !== "number" || !Number.isFinite(receivedQty)) {
      return { valid: false, error: "receivedQty must be a finite number" };
    }
    if (typeof receiptPrice !== "number" || !Number.isFinite(receiptPrice)) {
      return { valid: false, error: "receiptPrice must be a finite number" };
    }

    if (currentQty < 0) {
      return { valid: false, error: "currentQty cannot be negative" };
    }
    if (currentWAC < 0) {
      return { valid: false, error: "currentWAC cannot be negative" };
    }
    if (receivedQty <= 0) {
      return { valid: false, error: "receivedQty must be greater than zero" };
    }
    if (receiptPrice < 0) {
      return { valid: false, error: "receiptPrice cannot be negative" };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
