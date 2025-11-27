/**
 * Unit Tests for Reconciliation Calculation Utility
 *
 * Tests consumption calculation, manday cost calculation, and validation functions.
 *
 * Run with: pnpm test:unit
 */

import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import {
  calculateConsumption,
  calculateMandayCost,
  calculateReconciliation,
  validateReconciliationInputs,
  type ConsumptionInput,
} from "../../server/utils/reconciliation";

describe("Reconciliation Calculation Utility", () => {
  describe("calculateConsumption", () => {
    describe("Standard Calculations", () => {
      it("should calculate consumption correctly for typical scenario", () => {
        const input: ConsumptionInput = {
          openingStock: 125000,
          receipts: 45000,
          transfersIn: 5000,
          transfersOut: 3000,
          issues: 35000,
          closingStock: 137000,
          backCharges: 1000,
          credits: 500,
          condemnations: 1000,
        };

        const result = calculateConsumption(input);

        // Expected: 125000 + 45000 + 5000 - 3000 - 137000 + 1000 - 500 - 1000 = 34500
        expect(result.consumption).toBe(34500);
        expect(result.totalAdjustments).toBe(-500); // 1000 - 500 - 1000 + 0
        expect(result.breakdown).toEqual({
          openingStock: 125000,
          receipts: 45000,
          transfersIn: 5000,
          transfersOut: 3000,
          closingStock: 137000,
          adjustments: 0,
          backCharges: 1000,
          credits: 500,
          condemnations: 1000,
        });
      });

      it("should calculate consumption with no adjustments", () => {
        const input: ConsumptionInput = {
          openingStock: 100000,
          receipts: 50000,
          transfersIn: 0,
          transfersOut: 0,
          issues: 40000,
          closingStock: 110000,
        };

        const result = calculateConsumption(input);

        // Expected: 100000 + 50000 - 110000 = 40000
        expect(result.consumption).toBe(40000);
        expect(result.totalAdjustments).toBe(0);
      });

      it("should handle general adjustments", () => {
        const input: ConsumptionInput = {
          openingStock: 100000,
          receipts: 50000,
          transfersIn: 0,
          transfersOut: 0,
          issues: 40000,
          closingStock: 110000,
          adjustments: 2000, // Positive adjustment
        };

        const result = calculateConsumption(input);

        // Expected: 100000 + 50000 - 110000 + 2000 = 42000
        expect(result.consumption).toBe(42000);
        expect(result.totalAdjustments).toBe(2000);
      });

      it("should handle transfers in and out", () => {
        const input: ConsumptionInput = {
          openingStock: 100000,
          receipts: 50000,
          transfersIn: 10000,
          transfersOut: 8000,
          issues: 40000,
          closingStock: 115000,
        };

        const result = calculateConsumption(input);

        // Expected: 100000 + 50000 + 10000 - 8000 - 115000 = 37000
        expect(result.consumption).toBe(37000);
      });
    });

    describe("Edge Cases", () => {
      it("should handle zero opening stock (first period)", () => {
        const input: ConsumptionInput = {
          openingStock: 0,
          receipts: 50000,
          transfersIn: 0,
          transfersOut: 0,
          issues: 30000,
          closingStock: 20000,
        };

        const result = calculateConsumption(input);

        // Expected: 0 + 50000 - 20000 = 30000
        expect(result.consumption).toBe(30000);
      });

      it("should handle negative consumption (over-stocking)", () => {
        const input: ConsumptionInput = {
          openingStock: 100000,
          receipts: 50000,
          transfersIn: 0,
          transfersOut: 0,
          issues: 20000,
          closingStock: 180000,
        };

        const result = calculateConsumption(input);

        // Expected: 100000 + 50000 - 180000 = -30000
        expect(result.consumption).toBe(-30000);
      });

      it("should handle all adjustments", () => {
        const input: ConsumptionInput = {
          openingStock: 100000,
          receipts: 50000,
          transfersIn: 0,
          transfersOut: 0,
          issues: 40000,
          closingStock: 110000,
          adjustments: 500,
          backCharges: 2000,
          credits: 800,
          condemnations: 1200,
        };

        const result = calculateConsumption(input);

        // TotalAdjustments = 2000 - 800 - 1200 + 500 = 500
        // Expected: 100000 + 50000 - 110000 + 500 = 40500
        expect(result.consumption).toBe(40500);
        expect(result.totalAdjustments).toBe(500);
      });
    });

    describe("Decimal Support", () => {
      it("should work with Prisma.Decimal inputs", () => {
        const input: ConsumptionInput = {
          openingStock: new Prisma.Decimal(125000),
          receipts: new Prisma.Decimal(45000),
          transfersIn: new Prisma.Decimal(5000),
          transfersOut: new Prisma.Decimal(3000),
          issues: new Prisma.Decimal(35000),
          closingStock: new Prisma.Decimal(137000),
        };

        const result = calculateConsumption(input);

        expect(result.consumption).toBe(35000);
      });

      it("should handle mixed number and Decimal inputs", () => {
        const input: ConsumptionInput = {
          openingStock: 100000,
          receipts: new Prisma.Decimal(50000),
          transfersIn: 0,
          transfersOut: new Prisma.Decimal(0),
          issues: 40000,
          closingStock: new Prisma.Decimal(110000),
        };

        const result = calculateConsumption(input);

        expect(result.consumption).toBe(40000);
      });

      it("should handle decimal values correctly", () => {
        const input: ConsumptionInput = {
          openingStock: 125000.45,
          receipts: 45000.78,
          transfersIn: 5000.12,
          transfersOut: 3000.65,
          issues: 35000,
          closingStock: 137000.32,
        };

        const result = calculateConsumption(input);

        // Check that result is rounded to 2 decimals
        const decimalPlaces = (result.consumption.toString().split(".")[1] || "").length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });
    });

    describe("Error Handling", () => {
      it("should throw error for negative opening stock", () => {
        const input: ConsumptionInput = {
          openingStock: -1000,
          receipts: 50000,
          transfersIn: 0,
          transfersOut: 0,
          issues: 30000,
          closingStock: 20000,
        };

        expect(() => calculateConsumption(input)).toThrow(
          "Invalid openingStock: cannot be negative"
        );
      });

      it("should throw error for negative receipts", () => {
        const input: ConsumptionInput = {
          openingStock: 100000,
          receipts: -50000,
          transfersIn: 0,
          transfersOut: 0,
          issues: 30000,
          closingStock: 20000,
        };

        expect(() => calculateConsumption(input)).toThrow("Invalid receipts: cannot be negative");
      });

      it("should throw error for negative transfers in", () => {
        const input: ConsumptionInput = {
          openingStock: 100000,
          receipts: 50000,
          transfersIn: -5000,
          transfersOut: 0,
          issues: 30000,
          closingStock: 20000,
        };

        expect(() => calculateConsumption(input)).toThrow(
          "Invalid transfersIn: cannot be negative"
        );
      });

      it("should throw error for negative transfers out", () => {
        const input: ConsumptionInput = {
          openingStock: 100000,
          receipts: 50000,
          transfersIn: 0,
          transfersOut: -3000,
          issues: 30000,
          closingStock: 20000,
        };

        expect(() => calculateConsumption(input)).toThrow(
          "Invalid transfersOut: cannot be negative"
        );
      });

      it("should throw error for negative closing stock", () => {
        const input: ConsumptionInput = {
          openingStock: 100000,
          receipts: 50000,
          transfersIn: 0,
          transfersOut: 0,
          issues: 30000,
          closingStock: -20000,
        };

        expect(() => calculateConsumption(input)).toThrow(
          "Invalid closingStock: cannot be negative"
        );
      });

      it("should throw error for non-finite values", () => {
        const input: ConsumptionInput = {
          openingStock: NaN,
          receipts: 50000,
          transfersIn: 0,
          transfersOut: 0,
          issues: 30000,
          closingStock: 20000,
        };

        expect(() => calculateConsumption(input)).toThrow(
          "Invalid openingStock: must be a finite number"
        );
      });
    });

    describe("Precision and Rounding", () => {
      it("should round consumption to 2 decimal places", () => {
        const input: ConsumptionInput = {
          openingStock: 125000.456,
          receipts: 45000.789,
          transfersIn: 5000.123,
          transfersOut: 3000.654,
          issues: 35000,
          closingStock: 137000.321,
        };

        const result = calculateConsumption(input);

        const decimalPlaces = (result.consumption.toString().split(".")[1] || "").length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });

      it("should round breakdown values to 2 decimal places", () => {
        const input: ConsumptionInput = {
          openingStock: 125000.456,
          receipts: 45000.789,
          transfersIn: 0,
          transfersOut: 0,
          issues: 35000,
          closingStock: 137000.321,
        };

        const result = calculateConsumption(input);

        expect(result.breakdown.openingStock).toBe(125000.46);
        expect(result.breakdown.receipts).toBe(45000.79);
        expect(result.breakdown.closingStock).toBe(137000.32);
      });
    });
  });

  describe("calculateMandayCost", () => {
    describe("Standard Calculations", () => {
      it("should calculate manday cost correctly", () => {
        const result = calculateMandayCost(34500, 2100);

        // Expected: 34500 / 2100 = 16.43 (rounded)
        expect(result.mandayCost).toBe(16.43);
        expect(result.consumption).toBe(34500);
        expect(result.totalMandays).toBe(2100);
      });

      it("should handle large consumption values", () => {
        const result = calculateMandayCost(250000, 5000);

        // Expected: 250000 / 5000 = 50.00
        expect(result.mandayCost).toBe(50.0);
      });

      it("should handle small consumption values", () => {
        const result = calculateMandayCost(1500, 500);

        // Expected: 1500 / 500 = 3.00
        expect(result.mandayCost).toBe(3.0);
      });

      it("should handle decimal consumption", () => {
        const result = calculateMandayCost(34567.89, 2123);

        // Expected: 34567.89 / 2123 = 16.28 (rounded)
        expect(result.mandayCost).toBe(16.28);
      });
    });

    describe("Decimal Support", () => {
      it("should work with Prisma.Decimal consumption", () => {
        const result = calculateMandayCost(new Prisma.Decimal(34500), 2100);

        expect(result.mandayCost).toBe(16.43);
      });

      it("should work with decimal values", () => {
        const result = calculateMandayCost(34500.789, 2100);

        // Check that result is rounded to 2 decimals
        const decimalPlaces = (result.mandayCost.toString().split(".")[1] || "").length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });
    });

    describe("Error Handling", () => {
      it("should throw error for zero mandays", () => {
        expect(() => calculateMandayCost(34500, 0)).toThrow(
          "Invalid totalMandays: must be greater than zero"
        );
      });

      it("should throw error for negative mandays", () => {
        expect(() => calculateMandayCost(34500, -2100)).toThrow(
          "Invalid totalMandays: must be greater than zero"
        );
      });

      it("should throw error for non-finite consumption", () => {
        expect(() => calculateMandayCost(NaN, 2100)).toThrow(
          "Invalid consumption: must be a finite number"
        );
      });

      it("should throw error for non-finite mandays", () => {
        expect(() => calculateMandayCost(34500, NaN)).toThrow(
          "Invalid totalMandays: must be a finite number"
        );
      });
    });

    describe("Precision and Rounding", () => {
      it("should round manday cost to 2 decimal places", () => {
        const result = calculateMandayCost(34567.891, 2123);

        const decimalPlaces = (result.mandayCost.toString().split(".")[1] || "").length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });
    });
  });

  describe("calculateReconciliation", () => {
    it("should calculate both consumption and manday cost", () => {
      const input: ConsumptionInput = {
        openingStock: 125000,
        receipts: 45000,
        transfersIn: 5000,
        transfersOut: 3000,
        issues: 35000,
        closingStock: 137000,
        backCharges: 1000,
        credits: 500,
        condemnations: 1000,
      };

      const result = calculateReconciliation(input, 2100);

      expect(result.consumption.consumption).toBe(34500);
      expect(result.mandayCost.mandayCost).toBe(16.43);
      expect(result.mandayCost.consumption).toBe(34500);
      expect(result.mandayCost.totalMandays).toBe(2100);
    });

    it("should use consumption result in manday cost", () => {
      const input: ConsumptionInput = {
        openingStock: 100000,
        receipts: 50000,
        transfersIn: 0,
        transfersOut: 0,
        issues: 40000,
        closingStock: 110000,
      };

      const result = calculateReconciliation(input, 2000);

      expect(result.consumption.consumption).toBe(40000);
      expect(result.mandayCost.consumption).toBe(40000);
      expect(result.mandayCost.mandayCost).toBe(20.0); // 40000 / 2000
    });
  });

  describe("validateReconciliationInputs", () => {
    describe("Valid Inputs", () => {
      it("should validate correct inputs without mandays", () => {
        const input: ConsumptionInput = {
          openingStock: 125000,
          receipts: 45000,
          transfersIn: 5000,
          transfersOut: 3000,
          issues: 35000,
          closingStock: 137000,
        };

        const result = validateReconciliationInputs(input);

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it("should validate correct inputs with mandays", () => {
        const input: ConsumptionInput = {
          openingStock: 125000,
          receipts: 45000,
          transfersIn: 5000,
          transfersOut: 3000,
          issues: 35000,
          closingStock: 137000,
        };

        const result = validateReconciliationInputs(input, 2100);

        expect(result.valid).toBe(true);
      });
    });

    describe("Invalid Inputs", () => {
      it("should reject invalid consumption inputs", () => {
        const input: ConsumptionInput = {
          openingStock: -1000,
          receipts: 45000,
          transfersIn: 5000,
          transfersOut: 3000,
          issues: 35000,
          closingStock: 137000,
        };

        const result = validateReconciliationInputs(input);

        expect(result.valid).toBe(false);
        expect(result.error).toContain("openingStock");
      });

      it("should reject invalid mandays", () => {
        const input: ConsumptionInput = {
          openingStock: 125000,
          receipts: 45000,
          transfersIn: 5000,
          transfersOut: 3000,
          issues: 35000,
          closingStock: 137000,
        };

        const result = validateReconciliationInputs(input, 0);

        expect(result.valid).toBe(false);
        expect(result.error).toBe("totalMandays must be greater than zero");
      });

      it("should reject non-finite mandays", () => {
        const input: ConsumptionInput = {
          openingStock: 125000,
          receipts: 45000,
          transfersIn: 5000,
          transfersOut: 3000,
          issues: 35000,
          closingStock: 137000,
        };

        const result = validateReconciliationInputs(input, NaN);

        expect(result.valid).toBe(false);
        expect(result.error).toBe("totalMandays must be a finite number");
      });
    });
  });

  describe("Business Scenarios", () => {
    it("should calculate for restaurant kitchen monthly consumption", () => {
      // Scenario: Main Kitchen - Month of November 2024
      const input: ConsumptionInput = {
        openingStock: 145000, // Opening stock at start of month
        receipts: 68000, // Food deliveries during month
        transfersIn: 3500, // Transfers from warehouse
        transfersOut: 2000, // Transfers to other kitchen
        issues: 55000, // Issues to production
        closingStock: 159500, // Stock count at month end
        backCharges: 800, // Staff meals to be charged
        credits: 400, // Returned items
        condemnations: 1200, // Spoiled/expired items
      };

      const result = calculateConsumption(input);

      // Consumption = 145000 + 68000 + 3500 - 2000 - 159500 + 800 - 400 - 1200
      expect(result.consumption).toBe(54200);
      expect(result.totalAdjustments).toBe(-800);
    });

    it("should calculate manday cost for crew feeding", () => {
      // Scenario: Offshore platform - 70 crew @ 30 days = 2100 mandays
      const consumption = 54200;
      const totalMandays = 2100;

      const result = calculateMandayCost(consumption, totalMandays);

      // Expected: 54200 / 2100 = 25.81 SAR per person per day
      expect(result.mandayCost).toBe(25.81);
    });

    it("should calculate full reconciliation with consumption and cost", () => {
      const input: ConsumptionInput = {
        openingStock: 145000,
        receipts: 68000,
        transfersIn: 3500,
        transfersOut: 2000,
        issues: 55000,
        closingStock: 159500,
        backCharges: 800,
        credits: 400,
        condemnations: 1200,
      };

      const result = calculateReconciliation(input, 2100);

      expect(result.consumption.consumption).toBe(54200);
      expect(result.mandayCost.mandayCost).toBe(25.81);
      expect(result.mandayCost.totalMandays).toBe(2100);
    });

    it("should handle first period with zero opening stock", () => {
      const input: ConsumptionInput = {
        openingStock: 0, // First month
        receipts: 75000, // Initial stock purchase
        transfersIn: 0,
        transfersOut: 0,
        issues: 40000,
        closingStock: 35000,
      };

      const result = calculateConsumption(input);

      // Consumption = 0 + 75000 - 35000 = 40000
      expect(result.consumption).toBe(40000);
    });

    it("should detect stock buildup (negative consumption)", () => {
      const input: ConsumptionInput = {
        openingStock: 100000,
        receipts: 80000, // Large delivery
        transfersIn: 10000,
        transfersOut: 5000,
        issues: 30000, // Low usage
        closingStock: 165000, // Higher closing stock
      };

      const result = calculateConsumption(input);

      // Calculation: 100000 + 80000 + 10000 - 5000 - 165000 = 20000
      expect(result.consumption).toBe(20000);
    });
  });
});
