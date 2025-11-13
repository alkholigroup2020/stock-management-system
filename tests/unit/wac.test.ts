/**
 * Unit Tests for WAC (Weighted Average Cost) Calculation
 *
 * This test suite validates the WAC calculation utility functions
 * including edge cases, error handling, and business logic.
 */

import { describe, it, expect } from "vitest";
import {
  calculateWAC,
  previewWAC,
  calculateReceiptValueImpact,
  validateWACInputs,
} from "../../server/utils/wac";

describe("WAC Calculation Utility", () => {
  describe("calculateWAC", () => {
    it("should calculate WAC correctly for standard case", () => {
      // Current stock: 100 KG @ SAR 10.00/KG = SAR 1,000.00
      // New receipt: 50 KG @ SAR 12.00/KG = SAR 600.00
      // Expected: (1000 + 600) / (100 + 50) = SAR 10.67/KG
      const result = calculateWAC(100, 10.0, 50, 12.0);

      expect(result.newWAC).toBeCloseTo(10.6667, 4);
      expect(result.newQuantity).toBe(150);
      expect(result.newValue).toBeCloseTo(1600.0, 2);
      expect(result.currentValue).toBe(1000.0);
      expect(result.receiptValue).toBe(600.0);
    });

    it("should handle first receipt (zero current stock)", () => {
      // No current stock, first receipt sets the WAC
      // Receipt: 50 KG @ SAR 12.00/KG
      // Expected WAC: SAR 12.00/KG
      const result = calculateWAC(0, 0, 50, 12.0);

      expect(result.newWAC).toBe(12.0);
      expect(result.newQuantity).toBe(50);
      expect(result.newValue).toBe(600.0);
      expect(result.currentValue).toBe(0);
      expect(result.receiptValue).toBe(600.0);
    });

    it("should handle receipt at same price as current WAC", () => {
      // Current: 100 KG @ SAR 10.00/KG
      // Receipt: 50 KG @ SAR 10.00/KG
      // Expected: WAC remains SAR 10.00/KG
      const result = calculateWAC(100, 10.0, 50, 10.0);

      expect(result.newWAC).toBe(10.0);
      expect(result.newQuantity).toBe(150);
      expect(result.newValue).toBe(1500.0);
    });

    it("should handle receipt at lower price than current WAC", () => {
      // Current: 100 KG @ SAR 10.00/KG = SAR 1,000.00
      // Receipt: 50 KG @ SAR 8.00/KG = SAR 400.00
      // Expected: (1000 + 400) / 150 = SAR 9.33/KG
      const result = calculateWAC(100, 10.0, 50, 8.0);

      expect(result.newWAC).toBeCloseTo(9.3333, 4);
      expect(result.newQuantity).toBe(150);
      expect(result.newValue).toBeCloseTo(1400.0, 2);
    });

    it("should handle receipt at higher price than current WAC", () => {
      // Current: 100 KG @ SAR 10.00/KG = SAR 1,000.00
      // Receipt: 50 KG @ SAR 15.00/KG = SAR 750.00
      // Expected: (1000 + 750) / 150 = SAR 11.67/KG
      const result = calculateWAC(100, 10.0, 50, 15.0);

      expect(result.newWAC).toBeCloseTo(11.6667, 4);
      expect(result.newQuantity).toBe(150);
      expect(result.newValue).toBeCloseTo(1750.0, 2);
    });

    it("should handle small receipt quantity", () => {
      // Current: 1000 KG @ SAR 10.00/KG = SAR 10,000.00
      // Receipt: 1 KG @ SAR 20.00/KG = SAR 20.00
      // Expected: (10000 + 20) / 1001 = SAR 10.01/KG
      const result = calculateWAC(1000, 10.0, 1, 20.0);

      expect(result.newWAC).toBeCloseTo(10.01, 2);
      expect(result.newQuantity).toBe(1001);
    });

    it("should handle large receipt quantity", () => {
      // Current: 10 KG @ SAR 10.00/KG = SAR 100.00
      // Receipt: 1000 KG @ SAR 12.00/KG = SAR 12,000.00
      // Expected: (100 + 12000) / 1010 = SAR 11.98/KG
      const result = calculateWAC(10, 10.0, 1000, 12.0);

      expect(result.newWAC).toBeCloseTo(11.9802, 4);
      expect(result.newQuantity).toBe(1010);
    });

    it("should handle decimal quantities", () => {
      // Current: 10.5 KG @ SAR 10.50/KG
      // Receipt: 5.25 KG @ SAR 11.00/KG
      const result = calculateWAC(10.5, 10.5, 5.25, 11.0);

      expect(result.newWAC).toBeCloseTo(10.6667, 4);
      expect(result.newQuantity).toBe(15.75);
    });

    it("should handle decimal prices", () => {
      // Current: 100 KG @ SAR 10.5555/KG
      // Receipt: 50 KG @ SAR 12.7777/KG
      const result = calculateWAC(100, 10.5555, 50, 12.7777);

      const expectedWAC = (100 * 10.5555 + 50 * 12.7777) / 150;
      expect(result.newWAC).toBeCloseTo(expectedWAC, 4);
    });

    it("should round to 4 decimal places for WAC", () => {
      const result = calculateWAC(100, 10.123456789, 50, 12.987654321);

      // Check that WAC has max 4 decimal places
      const wacString = result.newWAC.toString();
      const decimals = wacString.includes(".") ? wacString.split(".")[1].length : 0;
      expect(decimals).toBeLessThanOrEqual(4);
    });

    it("should round to 2 decimal places for currency values", () => {
      const result = calculateWAC(100, 10.123456, 50, 12.987654);

      // Check that values have max 2 decimal places
      const valueString = result.newValue.toString();
      const decimals = valueString.includes(".") ? valueString.split(".")[1].length : 0;
      expect(decimals).toBeLessThanOrEqual(2);
    });
  });

  describe("calculateWAC - Error Handling", () => {
    it("should throw error for negative current quantity", () => {
      expect(() => calculateWAC(-10, 10.0, 50, 12.0)).toThrow(
        "Invalid currentQty: cannot be negative"
      );
    });

    it("should throw error for negative current WAC", () => {
      expect(() => calculateWAC(100, -10.0, 50, 12.0)).toThrow(
        "Invalid currentWAC: cannot be negative"
      );
    });

    it("should throw error for zero received quantity", () => {
      expect(() => calculateWAC(100, 10.0, 0, 12.0)).toThrow(
        "Invalid receivedQty: must be greater than zero"
      );
    });

    it("should throw error for negative received quantity", () => {
      expect(() => calculateWAC(100, 10.0, -50, 12.0)).toThrow(
        "Invalid receivedQty: must be greater than zero"
      );
    });

    it("should throw error for negative receipt price", () => {
      expect(() => calculateWAC(100, 10.0, 50, -12.0)).toThrow(
        "Invalid receiptPrice: cannot be negative"
      );
    });

    it("should throw error for non-numeric current quantity", () => {
      expect(() => calculateWAC(NaN, 10.0, 50, 12.0)).toThrow(
        "Invalid currentQty: must be a finite number"
      );
    });

    it("should throw error for infinite values", () => {
      expect(() => calculateWAC(Infinity, 10.0, 50, 12.0)).toThrow(
        "Invalid currentQty: must be a finite number"
      );
    });

    it("should throw error for non-numeric inputs", () => {
      // @ts-expect-error - Testing invalid input
      expect(() => calculateWAC("100", 10.0, 50, 12.0)).toThrow();
    });
  });

  describe("previewWAC", () => {
    it("should return only the new WAC value", () => {
      const newWAC = previewWAC(100, 10.0, 50, 12.0);

      expect(newWAC).toBeCloseTo(10.6667, 4);
      expect(typeof newWAC).toBe("number");
    });

    it("should match calculateWAC result", () => {
      const fullResult = calculateWAC(100, 10.0, 50, 12.0);
      const previewResult = previewWAC(100, 10.0, 50, 12.0);

      expect(previewResult).toBe(fullResult.newWAC);
    });
  });

  describe("calculateReceiptValueImpact", () => {
    it("should return the receipt value correctly", () => {
      // Receipt: 50 KG @ SAR 12.00/KG = SAR 600.00
      const impact = calculateReceiptValueImpact(100, 10.0, 50, 12.0);

      expect(impact).toBe(600.0);
    });

    it("should match calculateWAC receipt value", () => {
      const fullResult = calculateWAC(100, 10.0, 50, 12.0);
      const impactResult = calculateReceiptValueImpact(100, 10.0, 50, 12.0);

      expect(impactResult).toBe(fullResult.receiptValue);
    });
  });

  describe("validateWACInputs", () => {
    it("should return valid for correct inputs", () => {
      const validation = validateWACInputs(100, 10.0, 50, 12.0);

      expect(validation.valid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it("should return invalid for negative current quantity", () => {
      const validation = validateWACInputs(-10, 10.0, 50, 12.0);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe("currentQty cannot be negative");
    });

    it("should return invalid for negative current WAC", () => {
      const validation = validateWACInputs(100, -10.0, 50, 12.0);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe("currentWAC cannot be negative");
    });

    it("should return invalid for zero received quantity", () => {
      const validation = validateWACInputs(100, 10.0, 0, 12.0);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe("receivedQty must be greater than zero");
    });

    it("should return invalid for negative receipt price", () => {
      const validation = validateWACInputs(100, 10.0, 50, -12.0);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe("receiptPrice cannot be negative");
    });

    it("should return invalid for NaN inputs", () => {
      const validation = validateWACInputs(NaN, 10.0, 50, 12.0);

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain("must be a finite number");
    });

    it("should return invalid for infinite inputs", () => {
      const validation = validateWACInputs(100, Infinity, 50, 12.0);

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain("must be a finite number");
    });
  });

  describe("Business Logic Scenarios", () => {
    it("should calculate WAC for typical delivery scenario", () => {
      // Scenario: Restaurant kitchen receiving vegetables
      // Current: 25 KG Tomatoes @ SAR 8.50/KG
      // Receipt: 15 KG Tomatoes @ SAR 9.20/KG
      const result = calculateWAC(25, 8.5, 15, 9.2);

      expect(result.newWAC).toBeCloseTo(8.7625, 4);
      expect(result.newQuantity).toBe(40);
      expect(result.newValue).toBeCloseTo(350.5, 2);
    });

    it("should calculate WAC for bulk warehouse delivery", () => {
      // Scenario: Warehouse receiving large bulk order
      // Current: 500 EA @ SAR 15.00/EA
      // Receipt: 1000 EA @ SAR 14.50/EA
      const result = calculateWAC(500, 15.0, 1000, 14.5);

      expect(result.newWAC).toBeCloseTo(14.6667, 4);
      expect(result.newQuantity).toBe(1500);
    });

    it("should calculate WAC for price increase scenario", () => {
      // Scenario: Item price increased due to supply chain
      // Current: 100 LTR @ SAR 20.00/LTR
      // Receipt: 50 LTR @ SAR 25.00/LTR (25% price increase)
      const result = calculateWAC(100, 20.0, 50, 25.0);

      expect(result.newWAC).toBeCloseTo(21.6667, 4);
      // WAC increased by approximately 8.3%
      const percentIncrease = ((result.newWAC - 20.0) / 20.0) * 100;
      expect(percentIncrease).toBeCloseTo(8.3333, 2);
    });

    it("should calculate WAC for promotional pricing", () => {
      // Scenario: Supplier offering promotional discount
      // Current: 200 BOX @ SAR 50.00/BOX
      // Receipt: 100 BOX @ SAR 40.00/BOX (20% discount)
      const result = calculateWAC(200, 50.0, 100, 40.0);

      expect(result.newWAC).toBeCloseTo(46.6667, 4);
      expect(result.newValue).toBeCloseTo(14000.0, 2);
    });

    it("should handle zero current stock with first delivery", () => {
      // Scenario: New item first time ordering
      // No stock, first receipt establishes WAC
      const result = calculateWAC(0, 0, 100, 15.75);

      expect(result.newWAC).toBe(15.75);
      expect(result.newQuantity).toBe(100);
      expect(result.newValue).toBe(1575.0);
      expect(result.currentValue).toBe(0);
    });
  });

  describe("Precision and Rounding", () => {
    it("should maintain precision for 4-decimal quantities", () => {
      // Testing with 4-decimal precision quantities
      const result = calculateWAC(10.1234, 5.6789, 20.4567, 6.789);

      // Calculate expected: (10.1234 * 5.6789 + 20.4567 * 6.7890) / 30.5801
      // = (57.5097... + 138.8599...) / 30.5801 = 6.4215...
      expect(result.newQuantity).toBeCloseTo(30.5801, 4);
      expect(result.newWAC).toBeCloseTo(6.4215, 4);
    });

    it("should handle very small quantities", () => {
      const result = calculateWAC(0.001, 100.0, 0.001, 150.0);

      expect(result.newQuantity).toBe(0.002);
      expect(result.newWAC).toBe(125.0);
    });

    it("should handle very large values", () => {
      const result = calculateWAC(10000, 1000.0, 5000, 1200.0);

      expect(result.newWAC).toBeCloseTo(1066.6667, 4);
      expect(result.newValue).toBeCloseTo(16000000.0, 2);
    });
  });
});
