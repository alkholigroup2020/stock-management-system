/**
 * Stock Validation Utility
 *
 * Provides functions for validating stock availability before processing
 * stock-consuming transactions (Issues, Transfers, Adjustments).
 *
 * Critical Business Rules:
 * - No negative stock: Always validate requested qty <= on_hand
 * - Pre-transaction validation: Check before starting transaction
 * - Detailed error responses: Include item name, requested/available qty
 */

import { createError } from "h3";
import prisma from "./prisma";
import type { Prisma } from "@prisma/client";

/**
 * Stock validation result interface
 */
export interface StockValidationResult {
  isValid: boolean;
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  requestedQuantity: number;
  availableQuantity: number;
  shortfall?: number;
}

/**
 * Insufficient stock error details
 */
export interface InsufficientStockError {
  code: "INSUFFICIENT_STOCK";
  message: string;
  details: {
    locationId: string;
    locationName: string;
    insufficientItems: Array<{
      itemId: string;
      itemCode: string;
      itemName: string;
      unit: string;
      requestedQuantity: number;
      availableQuantity: number;
      shortfall: number;
    }>;
  };
}

/**
 * Pure validation function that checks if quantity is sufficient
 * Does not access database - for pure business logic testing
 *
 * @param availableQuantity - Available stock quantity
 * @param requestedQuantity - Requested quantity
 * @param itemDetails - Item details for result
 * @returns StockValidationResult - Validation result with details
 */
export function checkStockSufficiency(
  availableQuantity: number,
  requestedQuantity: number,
  itemDetails: {
    itemId: string;
    itemCode: string;
    itemName: string;
    unit: string;
  }
): StockValidationResult {
  const isValid = availableQuantity >= requestedQuantity;

  const result: StockValidationResult = {
    isValid,
    itemId: itemDetails.itemId,
    itemCode: itemDetails.itemCode,
    itemName: itemDetails.itemName,
    unit: itemDetails.unit,
    requestedQuantity,
    availableQuantity,
  };

  if (!isValid) {
    result.shortfall = requestedQuantity - availableQuantity;
  }

  return result;
}

/**
 * Validate if sufficient stock is available for a single item
 * Fetches data from database and validates
 *
 * @param locationId - The location to check stock in
 * @param itemId - The item to check
 * @param quantity - The requested quantity
 * @returns Promise<StockValidationResult> - Validation result with details
 */
export async function validateSufficientStock(
  locationId: string,
  itemId: string,
  quantity: number
): Promise<StockValidationResult> {
  // Fetch location stock with item details
  const locationStock = await prisma.locationStock.findUnique({
    where: {
      location_id_item_id: {
        location_id: locationId,
        item_id: itemId,
      },
    },
    include: {
      item: {
        select: {
          code: true,
          name: true,
          unit: true,
        },
      },
    },
  });

  // If no stock record exists, treat as zero stock
  const availableQuantity = locationStock?.on_hand ? Number(locationStock.on_hand) : 0;

  const itemDetails = {
    itemId,
    itemCode: locationStock?.item.code || "UNKNOWN",
    itemName: locationStock?.item.name || "Unknown Item",
    unit: locationStock?.item.unit || "EA",
  };

  return checkStockSufficiency(availableQuantity, quantity, itemDetails);
}

/**
 * Validate sufficient stock for multiple items (bulk validation)
 *
 * @param locationId - The location to check stock in
 * @param items - Array of items with their requested quantities
 * @returns Promise<StockValidationResult[]> - Array of validation results
 */
export async function validateSufficientStockBulk(
  locationId: string,
  items: Array<{ itemId: string; quantity: number }>
): Promise<StockValidationResult[]> {
  const results: StockValidationResult[] = [];

  for (const item of items) {
    const result = await validateSufficientStock(locationId, item.itemId, item.quantity);
    results.push(result);
  }

  return results;
}

/**
 * Check if all items have sufficient stock
 *
 * @param validationResults - Array of validation results
 * @returns boolean - True if all items have sufficient stock
 */
export function hasAllSufficientStock(validationResults: StockValidationResult[]): boolean {
  return validationResults.every((result) => result.isValid);
}

/**
 * Get only the items with insufficient stock
 *
 * @param validationResults - Array of validation results
 * @returns StockValidationResult[] - Array of items with insufficient stock
 */
export function getInsufficientStockItems(
  validationResults: StockValidationResult[]
): StockValidationResult[] {
  return validationResults.filter((result) => !result.isValid);
}

/**
 * Create an H3 error response for insufficient stock
 *
 * @param locationId - The location ID
 * @param locationName - The location name
 * @param insufficientItems - Array of items with insufficient stock
 * @returns H3Error - Error object to throw
 */
export function createInsufficientStockError(
  locationId: string,
  locationName: string,
  insufficientItems: StockValidationResult[]
) {
  const itemsText = insufficientItems
    .map(
      (item) =>
        `${item.itemName} (${item.itemCode}): requested ${item.requestedQuantity} ${item.unit}, available ${item.availableQuantity} ${item.unit}`
    )
    .join("; ");

  const error: InsufficientStockError = {
    code: "INSUFFICIENT_STOCK",
    message: `Insufficient stock for ${insufficientItems.length} item(s) at location ${locationName}. ${itemsText}`,
    details: {
      locationId,
      locationName,
      insufficientItems: insufficientItems.map((item) => ({
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        unit: item.unit,
        requestedQuantity: item.requestedQuantity,
        availableQuantity: item.availableQuantity,
        shortfall: item.shortfall || 0,
      })),
    },
  };

  return createError({
    statusCode: 400,
    statusMessage: "Bad Request",
    data: error,
  });
}

/**
 * Validate and throw error if insufficient stock
 *
 * Convenience function that validates stock and throws an H3 error if insufficient.
 * Use this in API routes for simple validation + error throwing.
 *
 * @param locationId - The location ID
 * @param items - Array of items with their requested quantities
 * @throws H3Error if insufficient stock
 */
export async function validateAndThrowIfInsufficientStock(
  locationId: string,
  items: Array<{ itemId: string; quantity: number }>
): Promise<void> {
  // Fetch location details for error message
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { name: true },
  });

  if (!location) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      data: {
        code: "LOCATION_NOT_FOUND",
        message: "Location not found",
      },
    });
  }

  // Validate all items
  const validationResults = await validateSufficientStockBulk(locationId, items);

  // Check if all items have sufficient stock
  if (!hasAllSufficientStock(validationResults)) {
    const insufficientItems = getInsufficientStockItems(validationResults);
    throw createInsufficientStockError(locationId, location.name, insufficientItems);
  }
}

/**
 * Get current stock level for an item at a location
 *
 * @param locationId - The location ID
 * @param itemId - The item ID
 * @returns Promise<number> - Current on-hand quantity (0 if no stock record)
 */
export async function getCurrentStockLevel(locationId: string, itemId: string): Promise<number> {
  const locationStock = await prisma.locationStock.findUnique({
    where: {
      location_id_item_id: {
        location_id: locationId,
        item_id: itemId,
      },
    },
    select: {
      on_hand: true,
    },
  });

  return locationStock?.on_hand ? Number(locationStock.on_hand) : 0;
}

/**
 * Check if an item has any stock at a location
 *
 * @param locationId - The location ID
 * @param itemId - The item ID
 * @returns Promise<boolean> - True if stock exists (on_hand > 0)
 */
export async function hasStock(locationId: string, itemId: string): Promise<boolean> {
  const currentStock = await getCurrentStockLevel(locationId, itemId);
  return currentStock > 0;
}

/**
 * Validate quantity is positive
 *
 * @param quantity - The quantity to validate
 * @param fieldName - Name of the field for error message
 * @throws Error if quantity is not positive
 */
export function validatePositiveQuantity(quantity: number, fieldName: string = "quantity"): void {
  if (quantity <= 0) {
    throw new Error(`${fieldName} must be greater than zero`);
  }

  if (!Number.isFinite(quantity)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
}

/**
 * Validate quantities are positive for multiple items
 *
 * @param items - Array of items with quantities
 * @throws Error if any quantity is not positive
 */
export function validatePositiveQuantities(
  items: Array<{ quantity: number; itemName?: string }>
): void {
  items.forEach((item, index) => {
    const fieldName = item.itemName || `item ${index + 1} quantity`;
    validatePositiveQuantity(item.quantity, fieldName);
  });
}
