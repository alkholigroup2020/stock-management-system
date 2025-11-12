/**
 * Stock Validation Utility Tests
 *
 * Tests all stock validation functions for correctness, edge cases,
 * and error handling.
 */

import { describe, it, expect } from "vitest";
import {
  checkStockSufficiency,
  hasAllSufficientStock,
  getInsufficientStockItems,
  validatePositiveQuantity,
  validatePositiveQuantities,
  type StockValidationResult,
} from "../../server/utils/stockValidation";

describe("Stock Validation Utility", () => {
  describe("checkStockSufficiency", () => {
    it("should return valid result when sufficient stock exists", () => {
      const result = checkStockSufficiency(100, 50, {
        itemId: "item-1",
        itemCode: "ITEM001",
        itemName: "Test Item",
        unit: "KG",
      });

      expect(result).toEqual({
        isValid: true,
        itemId: "item-1",
        itemCode: "ITEM001",
        itemName: "Test Item",
        unit: "KG",
        requestedQuantity: 50,
        availableQuantity: 100,
      });
    });

    it("should return invalid result with shortfall when insufficient stock", () => {
      const result = checkStockSufficiency(30, 50, {
        itemId: "item-2",
        itemCode: "ITEM002",
        itemName: "Low Stock Item",
        unit: "EA",
      });

      expect(result).toEqual({
        isValid: false,
        itemId: "item-2",
        itemCode: "ITEM002",
        itemName: "Low Stock Item",
        unit: "EA",
        requestedQuantity: 50,
        availableQuantity: 30,
        shortfall: 20,
      });
    });

    it("should handle zero stock", () => {
      const result = checkStockSufficiency(0, 10, {
        itemId: "item-3",
        itemCode: "ITEM003",
        itemName: "Out of Stock Item",
        unit: "EA",
      });

      expect(result).toEqual({
        isValid: false,
        itemId: "item-3",
        itemCode: "ITEM003",
        itemName: "Out of Stock Item",
        unit: "EA",
        requestedQuantity: 10,
        availableQuantity: 0,
        shortfall: 10,
      });
    });

    it("should handle exact stock match", () => {
      const result = checkStockSufficiency(100, 100, {
        itemId: "item-4",
        itemCode: "ITEM004",
        itemName: "Exact Match Item",
        unit: "LTR",
      });

      expect(result.isValid).toBe(true);
      expect(result.availableQuantity).toBe(100);
      expect(result.requestedQuantity).toBe(100);
      expect(result.shortfall).toBeUndefined();
    });

    it("should handle decimal quantities", () => {
      const result = checkStockSufficiency(25.5, 20.75, {
        itemId: "item-5",
        itemCode: "ITEM005",
        itemName: "Decimal Item",
        unit: "KG",
      });

      expect(result.isValid).toBe(true);
      expect(result.availableQuantity).toBe(25.5);
      expect(result.requestedQuantity).toBe(20.75);
    });

    it("should handle decimal shortfall correctly", () => {
      const result = checkStockSufficiency(10.25, 15.75, {
        itemId: "item-6",
        itemCode: "ITEM006",
        itemName: "Decimal Shortfall Item",
        unit: "KG",
      });

      expect(result.isValid).toBe(false);
      expect(result.shortfall).toBe(5.5);
    });

    it("should handle very small decimal quantities correctly", () => {
      const result = checkStockSufficiency(0.0001, 0.00005, {
        itemId: "item-7",
        itemCode: "ITEM007",
        itemName: "Small Decimal Item",
        unit: "KG",
      });

      expect(result.isValid).toBe(true);
      expect(result.availableQuantity).toBe(0.0001);
    });

    it("should handle large quantities correctly", () => {
      const result = checkStockSufficiency(1000000, 999999, {
        itemId: "item-8",
        itemCode: "ITEM008",
        itemName: "Large Quantity Item",
        unit: "EA",
      });

      expect(result.isValid).toBe(true);
    });
  });

  describe("hasAllSufficientStock", () => {
    it("should return true when all items have sufficient stock", () => {
      const results: StockValidationResult[] = [
        {
          isValid: true,
          itemId: "item-1",
          itemCode: "ITEM001",
          itemName: "Item 1",
          unit: "KG",
          requestedQuantity: 50,
          availableQuantity: 100,
        },
        {
          isValid: true,
          itemId: "item-2",
          itemCode: "ITEM002",
          itemName: "Item 2",
          unit: "EA",
          requestedQuantity: 30,
          availableQuantity: 50,
        },
      ];

      expect(hasAllSufficientStock(results)).toBe(true);
    });

    it("should return false when any item has insufficient stock", () => {
      const results: StockValidationResult[] = [
        {
          isValid: true,
          itemId: "item-1",
          itemCode: "ITEM001",
          itemName: "Item 1",
          unit: "KG",
          requestedQuantity: 50,
          availableQuantity: 100,
        },
        {
          isValid: false,
          itemId: "item-2",
          itemCode: "ITEM002",
          itemName: "Item 2",
          unit: "EA",
          requestedQuantity: 30,
          availableQuantity: 20,
          shortfall: 10,
        },
      ];

      expect(hasAllSufficientStock(results)).toBe(false);
    });

    it("should return true for empty array", () => {
      expect(hasAllSufficientStock([])).toBe(true);
    });
  });

  describe("getInsufficientStockItems", () => {
    it("should filter only items with insufficient stock", () => {
      const results: StockValidationResult[] = [
        {
          isValid: true,
          itemId: "item-1",
          itemCode: "ITEM001",
          itemName: "Item 1",
          unit: "KG",
          requestedQuantity: 50,
          availableQuantity: 100,
        },
        {
          isValid: false,
          itemId: "item-2",
          itemCode: "ITEM002",
          itemName: "Item 2",
          unit: "EA",
          requestedQuantity: 30,
          availableQuantity: 20,
          shortfall: 10,
        },
        {
          isValid: false,
          itemId: "item-3",
          itemCode: "ITEM003",
          itemName: "Item 3",
          unit: "LTR",
          requestedQuantity: 50,
          availableQuantity: 0,
          shortfall: 50,
        },
      ];

      const insufficientItems = getInsufficientStockItems(results);

      expect(insufficientItems).toHaveLength(2);
      expect(insufficientItems[0].itemId).toBe("item-2");
      expect(insufficientItems[1].itemId).toBe("item-3");
    });

    it("should return empty array when all items have sufficient stock", () => {
      const results: StockValidationResult[] = [
        {
          isValid: true,
          itemId: "item-1",
          itemCode: "ITEM001",
          itemName: "Item 1",
          unit: "KG",
          requestedQuantity: 50,
          availableQuantity: 100,
        },
      ];

      expect(getInsufficientStockItems(results)).toEqual([]);
    });
  });

  // Note: createInsufficientStockError tests are skipped because they depend on H3's createError
  // which is not available in the test environment. This function will be tested via integration tests.

  describe("validatePositiveQuantity", () => {
    it("should not throw for positive quantities", () => {
      expect(() => validatePositiveQuantity(1, "quantity")).not.toThrow();
      expect(() => validatePositiveQuantity(0.1, "quantity")).not.toThrow();
      expect(() => validatePositiveQuantity(1000, "quantity")).not.toThrow();
    });

    it("should throw for zero quantity", () => {
      expect(() => validatePositiveQuantity(0, "quantity")).toThrow(
        "quantity must be greater than zero"
      );
    });

    it("should throw for negative quantity", () => {
      expect(() => validatePositiveQuantity(-5, "quantity")).toThrow(
        "quantity must be greater than zero"
      );
    });

    it("should throw for non-finite values", () => {
      expect(() => validatePositiveQuantity(Infinity, "quantity")).toThrow(
        "quantity must be a valid number"
      );
      expect(() => validatePositiveQuantity(NaN, "quantity")).toThrow(
        "quantity must be a valid number"
      );
    });

    it("should use custom field name in error message", () => {
      expect(() => validatePositiveQuantity(-1, "transfer quantity")).toThrow(
        "transfer quantity must be greater than zero"
      );
    });
  });

  describe("validatePositiveQuantities", () => {
    it("should not throw when all quantities are positive", () => {
      const items = [
        { quantity: 10, itemName: "Item 1" },
        { quantity: 20.5, itemName: "Item 2" },
        { quantity: 0.1, itemName: "Item 3" },
      ];

      expect(() => validatePositiveQuantities(items)).not.toThrow();
    });

    it("should throw when any quantity is zero", () => {
      const items = [
        { quantity: 10, itemName: "Item 1" },
        { quantity: 0, itemName: "Item 2" },
      ];

      expect(() => validatePositiveQuantities(items)).toThrow(
        "Item 2 must be greater than zero"
      );
    });

    it("should throw when any quantity is negative", () => {
      const items = [
        { quantity: 10, itemName: "Item 1" },
        { quantity: -5, itemName: "Item 2" },
      ];

      expect(() => validatePositiveQuantities(items)).toThrow(
        "Item 2 must be greater than zero"
      );
    });

    it("should use fallback item name when itemName not provided", () => {
      const items = [{ quantity: 10 }, { quantity: -5 }];

      expect(() => validatePositiveQuantities(items)).toThrow(
        "item 2 quantity must be greater than zero"
      );
    });

    it("should handle empty array", () => {
      expect(() => validatePositiveQuantities([])).not.toThrow();
    });
  });

  describe("Business Scenarios", () => {
    it("should validate stock for issue workflow (typical business scenario)", () => {
      // Scenario: Kitchen wants to issue 25 KG of flour, 100 KG available
      const result = checkStockSufficiency(100, 25, {
        itemId: "flour-item",
        itemCode: "FLOUR-001",
        itemName: "All Purpose Flour",
        unit: "KG",
      });

      expect(result.isValid).toBe(true);
      expect(result.itemName).toBe("All Purpose Flour");
    });

    it("should validate stock for transfer workflow (typical business scenario)", () => {
      // Scenario: Transfer 50 units from Store to Kitchen, but only 30 available
      const result = checkStockSufficiency(30, 50, {
        itemId: "cleaning-item",
        itemCode: "CLEAN-001",
        itemName: "Cleaning Supplies",
        unit: "EA",
      });

      expect(result.isValid).toBe(false);
      expect(result.shortfall).toBe(20);
    });

    it("should identify multiple insufficient items", () => {
      const insufficientResults = [
        checkStockSufficiency(10, 25, {
          itemId: "item-1",
          itemCode: "FLOUR-001",
          itemName: "Flour",
          unit: "KG",
        }),
        checkStockSufficiency(5, 20, {
          itemId: "item-2",
          itemCode: "SUGAR-001",
          itemName: "Sugar",
          unit: "KG",
        }),
      ];

      const insufficientItems = insufficientResults.filter((r) => !r.isValid);
      expect(insufficientItems).toHaveLength(2);
      expect(insufficientItems[0].itemName).toBe("Flour");
      expect(insufficientItems[0].shortfall).toBe(15);
      expect(insufficientItems[1].itemName).toBe("Sugar");
      expect(insufficientItems[1].shortfall).toBe(15);
    });

    it("should handle bulk validation for multiple items", () => {
      const items = [
        { available: 100, requested: 80 },
        { available: 50, requested: 30 },
        { available: 20, requested: 25 }, // Insufficient
      ];

      const results = items.map((item, i) =>
        checkStockSufficiency(item.available, item.requested, {
          itemId: `item-${i + 1}`,
          itemCode: `ITEM00${i + 1}`,
          itemName: `Item ${i + 1}`,
          unit: "KG",
        })
      );

      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(true);
      expect(results[2].isValid).toBe(false);
      expect(results[2].shortfall).toBe(5);
      expect(hasAllSufficientStock(results)).toBe(false);
    });
  });
});
