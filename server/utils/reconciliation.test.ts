/**
 * Test file for reconciliation calculations
 *
 * This file contains manual tests to verify the reconciliation calculation utilities.
 * Run this file with: node --loader tsx server/utils/reconciliation.test.ts
 */

import {
  calculateConsumption,
  calculateMandayCost,
  calculateReconciliation,
  validateReconciliationInputs,
  type ConsumptionInput,
} from "./reconciliation";

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function logSuccess(message: string) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message: string) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function logInfo(message: string) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

function logSection(message: string) {
  console.log(`\n${colors.yellow}${message}${colors.reset}`);
}

// Test 1: Basic Consumption Calculation
logSection("Test 1: Basic Consumption Calculation");
try {
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
  logInfo(`Input: Opening=${input.openingStock}, Receipts=${input.receipts}`);
  logInfo(`       TransfersIn=${input.transfersIn}, TransfersOut=${input.transfersOut}`);
  logInfo(`       Closing=${input.closingStock}`);
  logInfo(`       BackCharges=${input.backCharges}, Credits=${input.credits}`);
  logInfo(`       Condemnations=${input.condemnations}`);
  logInfo(`Result: Consumption=${result.consumption}`);
  logInfo(`        TotalAdjustments=${result.totalAdjustments}`);

  // Expected: 125000 + 45000 + 5000 - 3000 - 137000 + 1000 - 500 - 1000 = 34500
  if (result.consumption === 34500) {
    logSuccess("Basic consumption calculation is correct (34500)");
  } else {
    logError(`Expected 34500, got ${result.consumption}`);
  }
} catch (error) {
  logError(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
}

// Test 2: Consumption with no adjustments
logSection("Test 2: Consumption with No Adjustments");
try {
  const input: ConsumptionInput = {
    openingStock: 100000,
    receipts: 50000,
    transfersIn: 0,
    transfersOut: 0,
    issues: 40000,
    closingStock: 110000,
  };

  const result = calculateConsumption(input);
  logInfo(`Input: Opening=${input.openingStock}, Receipts=${input.receipts}`);
  logInfo(`       Closing=${input.closingStock}`);
  logInfo(`Result: Consumption=${result.consumption}`);

  // Expected: 100000 + 50000 - 110000 = 40000
  if (result.consumption === 40000) {
    logSuccess("Consumption with no adjustments is correct (40000)");
  } else {
    logError(`Expected 40000, got ${result.consumption}`);
  }
} catch (error) {
  logError(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
}

// Test 3: Manday Cost Calculation
logSection("Test 3: Manday Cost Calculation");
try {
  const consumption = 34500;
  const totalMandays = 2100;

  const result = calculateMandayCost(consumption, totalMandays);
  logInfo(`Input: Consumption=${consumption}, TotalMandays=${totalMandays}`);
  logInfo(`Result: MandayCost=${result.mandayCost}`);

  // Expected: 34500 / 2100 = 16.43 (rounded to 2 decimals)
  if (result.mandayCost === 16.43) {
    logSuccess("Manday cost calculation is correct (16.43)");
  } else {
    logError(`Expected 16.43, got ${result.mandayCost}`);
  }
} catch (error) {
  logError(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
}

// Test 4: Combined Reconciliation Calculation
logSection("Test 4: Combined Reconciliation Calculation");
try {
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
  const totalMandays = 2100;

  const result = calculateReconciliation(input, totalMandays);
  logInfo(`Result: Consumption=${result.consumption.consumption}`);
  logInfo(`        MandayCost=${result.mandayCost.mandayCost}`);

  if (result.consumption.consumption === 34500 && result.mandayCost.mandayCost === 16.43) {
    logSuccess("Combined reconciliation calculation is correct");
  } else {
    logError(
      `Expected Consumption=34500, MandayCost=16.43, got ${result.consumption.consumption}, ${result.mandayCost.mandayCost}`
    );
  }
} catch (error) {
  logError(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
}

// Test 5: Zero Opening Stock (First Period)
logSection("Test 5: Zero Opening Stock (First Period)");
try {
  const input: ConsumptionInput = {
    openingStock: 0,
    receipts: 50000,
    transfersIn: 0,
    transfersOut: 0,
    issues: 30000,
    closingStock: 20000,
  };

  const result = calculateConsumption(input);
  logInfo(`Input: Opening=${input.openingStock}, Receipts=${input.receipts}`);
  logInfo(`       Closing=${input.closingStock}`);
  logInfo(`Result: Consumption=${result.consumption}`);

  // Expected: 0 + 50000 - 20000 = 30000
  if (result.consumption === 30000) {
    logSuccess("Zero opening stock calculation is correct (30000)");
  } else {
    logError(`Expected 30000, got ${result.consumption}`);
  }
} catch (error) {
  logError(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
}

// Test 6: Negative Consumption (Over-stocking)
logSection("Test 6: Negative Consumption (Over-stocking)");
try {
  const input: ConsumptionInput = {
    openingStock: 100000,
    receipts: 50000,
    transfersIn: 0,
    transfersOut: 0,
    issues: 20000,
    closingStock: 180000,
  };

  const result = calculateConsumption(input);
  logInfo(`Input: Opening=${input.openingStock}, Receipts=${input.receipts}`);
  logInfo(`       Closing=${input.closingStock}`);
  logInfo(`Result: Consumption=${result.consumption}`);

  // Expected: 100000 + 50000 - 180000 = -30000 (negative consumption indicates stock build-up)
  if (result.consumption === -30000) {
    logSuccess("Negative consumption calculation is correct (-30000)");
  } else {
    logError(`Expected -30000, got ${result.consumption}`);
  }
} catch (error) {
  logError(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
}

// Test 7: Input Validation - Negative Opening Stock
logSection("Test 7: Input Validation - Negative Opening Stock");
try {
  const input: ConsumptionInput = {
    openingStock: -1000,
    receipts: 50000,
    transfersIn: 0,
    transfersOut: 0,
    issues: 30000,
    closingStock: 20000,
  };

  calculateConsumption(input);
  logError("Should have thrown error for negative opening stock");
} catch (error) {
  if (error instanceof Error && error.message.includes("openingStock")) {
    logSuccess("Correctly rejected negative opening stock");
  } else {
    logError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Test 8: Input Validation - Zero Mandays
logSection("Test 8: Input Validation - Zero Mandays");
try {
  calculateMandayCost(34500, 0);
  logError("Should have thrown error for zero mandays");
} catch (error) {
  if (error instanceof Error && error.message.includes("totalMandays")) {
    logSuccess("Correctly rejected zero mandays");
  } else {
    logError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Test 9: Validation Helper
logSection("Test 9: Validation Helper");
try {
  const validInput: ConsumptionInput = {
    openingStock: 125000,
    receipts: 45000,
    transfersIn: 5000,
    transfersOut: 3000,
    issues: 35000,
    closingStock: 137000,
  };

  const validResult = validateReconciliationInputs(validInput, 2100);
  if (validResult.valid) {
    logSuccess("Valid input correctly validated");
  } else {
    logError(`Valid input rejected: ${validResult.error}`);
  }

  const invalidInput: ConsumptionInput = {
    openingStock: -1000,
    receipts: 45000,
    transfersIn: 5000,
    transfersOut: 3000,
    issues: 35000,
    closingStock: 137000,
  };

  const invalidResult = validateReconciliationInputs(invalidInput, 2100);
  if (!invalidResult.valid) {
    logSuccess(`Invalid input correctly rejected: ${invalidResult.error}`);
  } else {
    logError("Invalid input was not rejected");
  }
} catch (error) {
  logError(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
}

// Test 10: Decimal Precision
logSection("Test 10: Decimal Precision");
try {
  const input: ConsumptionInput = {
    openingStock: 125000.456,
    receipts: 45000.789,
    transfersIn: 5000.123,
    transfersOut: 3000.654,
    issues: 35000,
    closingStock: 137000.321,
  };

  const result = calculateConsumption(input);
  logInfo(`Input: Opening=${input.openingStock}, Receipts=${input.receipts}`);
  logInfo(`Result: Consumption=${result.consumption}`);

  // Check that result is rounded to 2 decimals
  const decimalPlaces = (result.consumption.toString().split(".")[1] || "").length;
  if (decimalPlaces <= 2) {
    logSuccess(`Decimal precision is correct (${decimalPlaces} decimal places)`);
  } else {
    logError(`Too many decimal places: ${decimalPlaces}`);
  }
} catch (error) {
  logError(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
}

logSection("All Tests Completed");
console.log("");
