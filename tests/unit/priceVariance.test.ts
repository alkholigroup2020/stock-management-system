/**
 * Unit Tests - Price Variance Detection Utility
 *
 * Tests the price variance detection and automatic NCR creation functionality.
 *
 * Test Coverage:
 * - Price variance calculation (positive, negative, zero)
 * - Percentage variance calculation
 * - Threshold checks
 * - NCR number generation
 * - NCR creation
 * - Input validation
 * - Edge cases and error handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import {
  checkPriceVariance,
  generateNCRNumber,
  createPriceVarianceNCR,
  detectAndCreateNCR,
  validatePriceVarianceInputs,
  type PriceVarianceNCRData,
  type PriceVarianceConfig,
} from "../../server/utils/priceVariance";

// ========================================
// Mock Prisma Client
// ========================================

const createMockPrisma = () => ({
  nCR: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
});

// ========================================
// Test Suite: checkPriceVariance
// ========================================

describe("checkPriceVariance", () => {
  describe("Standard Calculations", () => {
    it("should detect price increase variance", () => {
      const result = checkPriceVariance(26.0, 25.5, 100);

      expect(result.hasVariance).toBe(true);
      expect(result.variance).toBe(0.5);
      expect(result.variancePercent).toBe(1.96); // (0.5 / 25.5) * 100
      expect(result.varianceAmount).toBe(50.0); // 0.5 * 100
      expect(result.actualPrice).toBe(26.0);
      expect(result.expectedPrice).toBe(25.5);
      expect(result.exceedsThreshold).toBe(true); // Default threshold is 0
    });

    it("should detect price decrease variance", () => {
      const result = checkPriceVariance(24.5, 25.0, 50);

      expect(result.hasVariance).toBe(true);
      expect(result.variance).toBe(-0.5);
      expect(result.variancePercent).toBe(-2.0); // (-0.5 / 25.0) * 100
      expect(result.varianceAmount).toBe(-25.0); // -0.5 * 50
      expect(result.actualPrice).toBe(24.5);
      expect(result.expectedPrice).toBe(25.0);
      expect(result.exceedsThreshold).toBe(true);
    });

    it("should detect no variance when prices match", () => {
      const result = checkPriceVariance(25.0, 25.0, 100);

      expect(result.hasVariance).toBe(false);
      expect(result.variance).toBe(0);
      expect(result.variancePercent).toBe(0);
      expect(result.varianceAmount).toBe(0);
      expect(result.actualPrice).toBe(25.0);
      expect(result.expectedPrice).toBe(25.0);
      expect(result.exceedsThreshold).toBe(false);
    });
  });

  describe("Prisma Decimal Support", () => {
    it("should work with Prisma.Decimal inputs", () => {
      const unitPrice = new Prisma.Decimal(26.0);
      const periodPrice = new Prisma.Decimal(25.5);
      const quantity = new Prisma.Decimal(100);

      const result = checkPriceVariance(unitPrice, periodPrice, quantity);

      expect(result.hasVariance).toBe(true);
      expect(result.variance).toBe(0.5);
      expect(result.variancePercent).toBe(1.96);
      expect(result.varianceAmount).toBe(50.0);
    });

    it("should work with mixed number and Decimal inputs", () => {
      const unitPrice = new Prisma.Decimal(26.0);
      const periodPrice = 25.5;
      const quantity = new Prisma.Decimal(100);

      const result = checkPriceVariance(unitPrice, periodPrice, quantity);

      expect(result.hasVariance).toBe(true);
      expect(result.variance).toBe(0.5);
    });
  });

  describe("Threshold Configuration", () => {
    it("should respect percentage threshold", () => {
      const config: PriceVarianceConfig = {
        thresholdPercent: 5, // 5% threshold
      };

      // 1% variance - should not exceed threshold
      const result1 = checkPriceVariance(25.25, 25.0, 100, config);
      expect(result1.hasVariance).toBe(true);
      expect(result1.variancePercent).toBe(1.0);
      expect(result1.exceedsThreshold).toBe(false);

      // 6% variance - should exceed threshold
      const result2 = checkPriceVariance(26.5, 25.0, 100, config);
      expect(result2.hasVariance).toBe(true);
      expect(result2.variancePercent).toBe(6.0);
      expect(result2.exceedsThreshold).toBe(true);
    });

    it("should respect absolute amount threshold", () => {
      const config: PriceVarianceConfig = {
        thresholdAmount: 100, // SAR 100 threshold
      };

      // SAR 50 variance - should not exceed threshold
      const result1 = checkPriceVariance(25.5, 25.0, 100, config);
      expect(result1.varianceAmount).toBe(50.0);
      expect(result1.exceedsThreshold).toBe(false);

      // SAR 150 variance - should exceed threshold
      const result2 = checkPriceVariance(26.5, 25.0, 100, config);
      expect(result2.varianceAmount).toBe(150.0);
      expect(result2.exceedsThreshold).toBe(true);
    });

    it("should trigger if either threshold is exceeded", () => {
      const config: PriceVarianceConfig = {
        thresholdPercent: 10,
        thresholdAmount: 50,
      };

      // Exceeds percentage but not amount
      const result1 = checkPriceVariance(11.0, 10.0, 10, config);
      expect(result1.variancePercent).toBe(10); // Not exceeding (needs > 10)
      expect(result1.varianceAmount).toBe(10.0);
      expect(result1.exceedsThreshold).toBe(false);

      // Exceeds amount but not percentage
      const result2 = checkPriceVariance(10.6, 10.0, 100, config);
      expect(result2.variancePercent).toBe(6.0);
      expect(result2.varianceAmount).toBe(60.0);
      expect(result2.exceedsThreshold).toBe(true); // Amount exceeds
    });
  });

  describe("Edge Cases", () => {
    it("should handle very small variances", () => {
      const result = checkPriceVariance(25.0001, 25.0, 1000);

      expect(result.hasVariance).toBe(true);
      expect(result.variance).toBe(0.0001);
      expect(result.varianceAmount).toBe(0.1);
    });

    it("should handle large quantities", () => {
      const result = checkPriceVariance(25.5, 25.0, 10000);

      expect(result.varianceAmount).toBe(5000.0);
    });

    it("should handle zero period price (100% variance)", () => {
      const result = checkPriceVariance(10.0, 0, 100);

      expect(result.hasVariance).toBe(true);
      expect(result.variance).toBe(10.0);
      expect(result.variancePercent).toBe(100); // Any price from 0 is 100% increase
      expect(result.varianceAmount).toBe(1000.0);
    });

    it("should handle zero actual price (price decrease to 0)", () => {
      const result = checkPriceVariance(0, 25.0, 100);

      expect(result.hasVariance).toBe(true);
      expect(result.variance).toBe(-25.0);
      expect(result.variancePercent).toBe(-100);
      expect(result.varianceAmount).toBe(-2500.0);
    });

    it("should handle both prices at zero", () => {
      const result = checkPriceVariance(0, 0, 100);

      expect(result.hasVariance).toBe(false);
      expect(result.variance).toBe(0);
      expect(result.variancePercent).toBe(0);
      expect(result.varianceAmount).toBe(0);
    });
  });

  describe("Decimal Precision", () => {
    it("should round variance to 4 decimal places", () => {
      const result = checkPriceVariance(25.123456, 25.0, 100);

      expect(result.variance).toBe(0.1235); // Rounded to 4 decimals
    });

    it("should round variance percent to 2 decimal places", () => {
      const result = checkPriceVariance(25.333333, 25.0, 100);

      expect(result.variancePercent).toBe(1.33); // Rounded to 2 decimals
    });

    it("should round variance amount to 2 decimal places", () => {
      const result = checkPriceVariance(25.123, 25.0, 100);

      expect(result.varianceAmount).toBe(12.3); // Rounded to 2 decimals
    });
  });

  describe("Error Handling", () => {
    it("should throw error for negative unit price", () => {
      expect(() => checkPriceVariance(-10, 25, 100)).toThrow(
        "Invalid unit price: must be a positive finite number"
      );
    });

    it("should throw error for negative period price", () => {
      expect(() => checkPriceVariance(25, -10, 100)).toThrow(
        "Invalid period price: must be a positive finite number"
      );
    });

    it("should throw error for zero quantity", () => {
      expect(() => checkPriceVariance(25, 25, 0)).toThrow(
        "Invalid quantity: must be a positive finite number"
      );
    });

    it("should throw error for negative quantity", () => {
      expect(() => checkPriceVariance(25, 25, -100)).toThrow(
        "Invalid quantity: must be a positive finite number"
      );
    });

    it("should throw error for NaN inputs", () => {
      expect(() => checkPriceVariance(NaN, 25, 100)).toThrow("Invalid unit price");

      expect(() => checkPriceVariance(25, NaN, 100)).toThrow("Invalid period price");

      expect(() => checkPriceVariance(25, 25, NaN)).toThrow("Invalid quantity");
    });

    it("should throw error for Infinity inputs", () => {
      expect(() => checkPriceVariance(Infinity, 25, 100)).toThrow("Invalid unit price");

      expect(() => checkPriceVariance(25, Infinity, 100)).toThrow("Invalid period price");

      expect(() => checkPriceVariance(25, 25, Infinity)).toThrow("Invalid quantity");
    });
  });
});

// ========================================
// Test Suite: generateNCRNumber
// ========================================

describe("generateNCRNumber", () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
  });

  it("should generate first NCR number for the year", async () => {
    mockPrisma.nCR.findFirst.mockResolvedValue(null);

    const ncrNo = await generateNCRNumber(mockPrisma, 2025);

    expect(ncrNo).toBe("NCR-2025-001");
    expect(mockPrisma.nCR.findFirst).toHaveBeenCalledWith({
      where: {
        ncr_no: {
          startsWith: "NCR-2025-",
        },
      },
      orderBy: {
        ncr_no: "desc",
      },
      select: {
        ncr_no: true,
      },
    });
  });

  it("should increment NCR number correctly", async () => {
    mockPrisma.nCR.findFirst.mockResolvedValue({
      ncr_no: "NCR-2025-042",
    });

    const ncrNo = await generateNCRNumber(mockPrisma, 2025);

    expect(ncrNo).toBe("NCR-2025-043");
  });

  it("should pad single digit numbers with zeros", async () => {
    mockPrisma.nCR.findFirst.mockResolvedValue({
      ncr_no: "NCR-2025-008",
    });

    const ncrNo = await generateNCRNumber(mockPrisma, 2025);

    expect(ncrNo).toBe("NCR-2025-009");
  });

  it("should handle large NCR numbers", async () => {
    mockPrisma.nCR.findFirst.mockResolvedValue({
      ncr_no: "NCR-2025-999",
    });

    const ncrNo = await generateNCRNumber(mockPrisma, 2025);

    expect(ncrNo).toBe("NCR-2025-1000");
  });

  it("should use current year if not specified", async () => {
    mockPrisma.nCR.findFirst.mockResolvedValue(null);

    const currentYear = new Date().getFullYear();
    const ncrNo = await generateNCRNumber(mockPrisma);

    expect(ncrNo).toBe(`NCR-${currentYear}-001`);
  });
});

// ========================================
// Test Suite: createPriceVarianceNCR
// ========================================

describe("createPriceVarianceNCR", () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockPrisma.nCR.findFirst.mockResolvedValue(null); // For NCR number generation
  });

  it("should create NCR with correct data", async () => {
    const mockNCR = {
      id: "ncr-123",
      ncr_no: "NCR-2025-001",
      type: "PRICE_VARIANCE",
      auto_generated: true,
      value: 50.0,
      status: "OPEN",
      location: { code: "MAIN-KIT", name: "Main Kitchen" },
      delivery: { delivery_no: "DEL-2025-001" },
      creator: { username: "admin", full_name: "Admin User" },
    };

    mockPrisma.nCR.create.mockResolvedValue(mockNCR);

    const data: PriceVarianceNCRData = {
      locationId: "loc-123",
      deliveryId: "del-456",
      deliveryLineId: "line-789",
      itemId: "item-001",
      itemName: "Rice 5kg",
      itemCode: "RICE-5KG",
      quantity: 100,
      actualPrice: 26.0,
      expectedPrice: 25.5,
      variance: 0.5,
      varianceAmount: 50.0,
      createdBy: "user-123",
    };

    const ncr = await createPriceVarianceNCR(mockPrisma, data);

    expect(ncr).toEqual(mockNCR);
    expect(mockPrisma.nCR.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ncr_no: "NCR-2025-001",
        location_id: "loc-123",
        type: "PRICE_VARIANCE",
        auto_generated: true,
        delivery_id: "del-456",
        delivery_line_id: "line-789",
        quantity: 100,
        value: 50.0, // Absolute value
        status: "OPEN",
        created_by: "user-123",
      }),
      include: expect.any(Object),
    });
  });

  it("should format reason message correctly for price increase", async () => {
    mockPrisma.nCR.create.mockResolvedValue({ id: "ncr-123" });

    const data: PriceVarianceNCRData = {
      locationId: "loc-123",
      deliveryId: "del-456",
      deliveryLineId: "line-789",
      itemId: "item-001",
      itemName: "Rice 5kg",
      itemCode: "RICE-5KG",
      quantity: 100,
      actualPrice: 26.0,
      expectedPrice: 25.5,
      variance: 0.5,
      varianceAmount: 50.0,
      createdBy: "user-123",
    };

    await createPriceVarianceNCR(mockPrisma, data);

    const createCall = mockPrisma.nCR.create.mock.calls[0][0];
    const reason = createCall.data.reason;

    expect(reason).toContain("Rice 5kg (RICE-5KG)");
    expect(reason).toContain("Quantity: 100");
    expect(reason).toContain("Expected Price (Period): SAR 25.5000");
    expect(reason).toContain("Actual Price (Delivery): SAR 26.0000");
    expect(reason).toContain("Variance: SAR 0.5000 (1.96% increase)");
    expect(reason).toContain("Total Variance Amount: SAR 50.00");
  });

  it("should format reason message correctly for price decrease", async () => {
    mockPrisma.nCR.create.mockResolvedValue({ id: "ncr-123" });

    const data: PriceVarianceNCRData = {
      locationId: "loc-123",
      deliveryId: "del-456",
      deliveryLineId: "line-789",
      itemId: "item-001",
      itemName: "Rice 5kg",
      itemCode: "RICE-5KG",
      quantity: 100,
      actualPrice: 24.5,
      expectedPrice: 25.0,
      variance: -0.5,
      varianceAmount: -50.0,
      createdBy: "user-123",
    };

    await createPriceVarianceNCR(mockPrisma, data);

    const createCall = mockPrisma.nCR.create.mock.calls[0][0];
    const reason = createCall.data.reason;

    expect(reason).toContain("Variance: SAR -0.5000 (-2.00% decrease)");
  });

  it("should store absolute value for NCR value field", async () => {
    mockPrisma.nCR.create.mockResolvedValue({ id: "ncr-123" });

    const data: PriceVarianceNCRData = {
      locationId: "loc-123",
      deliveryId: "del-456",
      deliveryLineId: "line-789",
      itemId: "item-001",
      itemName: "Rice 5kg",
      itemCode: "RICE-5KG",
      quantity: 100,
      actualPrice: 24.5,
      expectedPrice: 25.0,
      variance: -0.5,
      varianceAmount: -50.0, // Negative variance
      createdBy: "user-123",
    };

    await createPriceVarianceNCR(mockPrisma, data);

    const createCall = mockPrisma.nCR.create.mock.calls[0][0];
    expect(createCall.data.value).toBe(50.0); // Absolute value stored
  });

  it("should throw error for missing required fields", async () => {
    const invalidData = {
      locationId: "",
      deliveryId: "del-456",
      deliveryLineId: "line-789",
      itemId: "item-001",
      itemName: "Rice 5kg",
      itemCode: "RICE-5KG",
      quantity: 100,
      actualPrice: 26.0,
      expectedPrice: 25.5,
      variance: 0.5,
      varianceAmount: 50.0,
      createdBy: "user-123",
    };

    await expect(createPriceVarianceNCR(mockPrisma, invalidData)).rejects.toThrow(
      "Missing required fields for NCR creation"
    );
  });
});

// ========================================
// Test Suite: detectAndCreateNCR
// ========================================

describe("detectAndCreateNCR", () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockPrisma.nCR.findFirst.mockResolvedValue(null);
    mockPrisma.nCR.create.mockResolvedValue({
      id: "ncr-123",
      ncr_no: "NCR-2025-001",
      type: "PRICE_VARIANCE",
    });
  });

  it("should detect variance and create NCR", async () => {
    const result = await detectAndCreateNCR(mockPrisma, {
      locationId: "loc-123",
      deliveryId: "del-456",
      deliveryLineId: "line-789",
      itemId: "item-001",
      itemName: "Rice 5kg",
      itemCode: "RICE-5KG",
      quantity: 100,
      unitPrice: 26.0,
      periodPrice: 25.5,
      createdBy: "user-123",
    });

    expect(result.varianceResult.hasVariance).toBe(true);
    expect(result.varianceResult.variance).toBe(0.5);
    expect(result.ncr).toBeTruthy();
    expect(result.ncr?.ncr_no).toBe("NCR-2025-001");
  });

  it("should not create NCR when no variance", async () => {
    const result = await detectAndCreateNCR(mockPrisma, {
      locationId: "loc-123",
      deliveryId: "del-456",
      deliveryLineId: "line-789",
      itemId: "item-001",
      itemName: "Rice 5kg",
      itemCode: "RICE-5KG",
      quantity: 100,
      unitPrice: 25.0,
      periodPrice: 25.0,
      createdBy: "user-123",
    });

    expect(result.varianceResult.hasVariance).toBe(false);
    expect(result.ncr).toBeNull();
    expect(mockPrisma.nCR.create).not.toHaveBeenCalled();
  });

  it("should not create NCR when variance below threshold", async () => {
    const config: PriceVarianceConfig = {
      thresholdPercent: 10, // 10% threshold
    };

    const result = await detectAndCreateNCR(
      mockPrisma,
      {
        locationId: "loc-123",
        deliveryId: "del-456",
        deliveryLineId: "line-789",
        itemId: "item-001",
        itemName: "Rice 5kg",
        itemCode: "RICE-5KG",
        quantity: 100,
        unitPrice: 25.5, // Only 2% increase
        periodPrice: 25.0,
        createdBy: "user-123",
      },
      config
    );

    expect(result.varianceResult.hasVariance).toBe(true);
    expect(result.varianceResult.variancePercent).toBe(2.0);
    expect(result.varianceResult.exceedsThreshold).toBe(false);
    expect(result.ncr).toBeNull();
  });

  it("should work with Prisma.Decimal inputs", async () => {
    const result = await detectAndCreateNCR(mockPrisma, {
      locationId: "loc-123",
      deliveryId: "del-456",
      deliveryLineId: "line-789",
      itemId: "item-001",
      itemName: "Rice 5kg",
      itemCode: "RICE-5KG",
      quantity: new Prisma.Decimal(100),
      unitPrice: new Prisma.Decimal(26.0),
      periodPrice: new Prisma.Decimal(25.5),
      createdBy: "user-123",
    });

    expect(result.varianceResult.hasVariance).toBe(true);
    expect(result.ncr).toBeTruthy();
  });
});

// ========================================
// Test Suite: validatePriceVarianceInputs
// ========================================

describe("validatePriceVarianceInputs", () => {
  it("should validate correct inputs", () => {
    const result = validatePriceVarianceInputs(25.0, 24.5, 100);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject negative unit price", () => {
    const result = validatePriceVarianceInputs(-10, 25, 100);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Unit price must be a positive finite number");
  });

  it("should reject negative period price", () => {
    const result = validatePriceVarianceInputs(25, -10, 100);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Period price must be a positive finite number");
  });

  it("should reject zero quantity", () => {
    const result = validatePriceVarianceInputs(25, 25, 0);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Quantity must be a positive finite number");
  });

  it("should reject negative quantity", () => {
    const result = validatePriceVarianceInputs(25, 25, -100);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Quantity must be a positive finite number");
  });

  it("should reject NaN values", () => {
    const result1 = validatePriceVarianceInputs(NaN, 25, 100);
    expect(result1.valid).toBe(false);

    const result2 = validatePriceVarianceInputs(25, NaN, 100);
    expect(result2.valid).toBe(false);

    const result3 = validatePriceVarianceInputs(25, 25, NaN);
    expect(result3.valid).toBe(false);
  });

  it("should reject Infinity values", () => {
    const result1 = validatePriceVarianceInputs(Infinity, 25, 100);
    expect(result1.valid).toBe(false);

    const result2 = validatePriceVarianceInputs(25, Infinity, 100);
    expect(result2.valid).toBe(false);

    const result3 = validatePriceVarianceInputs(25, 25, Infinity);
    expect(result3.valid).toBe(false);
  });

  it("should collect multiple errors", () => {
    const result = validatePriceVarianceInputs(-10, -20, -100);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(3);
  });

  it("should work with Prisma.Decimal inputs", () => {
    const result = validatePriceVarianceInputs(
      new Prisma.Decimal(25.0),
      new Prisma.Decimal(24.5),
      new Prisma.Decimal(100)
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
