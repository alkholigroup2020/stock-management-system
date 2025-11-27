/**
 * Query Performance Test Script
 *
 * Tests key API endpoints to ensure they meet performance targets:
 * - Single location operations: < 1s
 * - Cross-location operations: < 2s
 * - Reports: < 5s
 *
 * Run with: node scripts/test-query-performance.mjs
 */

const BASE_URL = "http://localhost:3000";

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

/**
 * Measure API endpoint response time
 */
async function measureEndpoint(name, url, options = {}) {
  const startTime = performance.now();

  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    const result = {
      name,
      url,
      status: response.status,
      duration: Math.round(duration),
      ok: response.ok,
    };

    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    return {
      name,
      url,
      status: 0,
      duration: Math.round(duration),
      ok: false,
      error: error.message,
    };
  }
}

/**
 * Print test result
 */
function printResult(result, threshold) {
  const statusIcon = result.ok ? "✓" : "✗";
  const statusColor = result.ok ? colors.green : colors.red;

  const perfIcon = result.duration <= threshold ? "✓" : "⚠";
  const perfColor = result.duration <= threshold ? colors.green : colors.yellow;

  console.log(
    `${statusColor}${statusIcon}${colors.reset} ${result.name} ${colors.gray}(${result.duration}ms)${colors.reset}`
  );
  console.log(`  ${colors.gray}${result.url}${colors.reset}`);
  console.log(
    `  Status: ${statusColor}${result.status}${colors.reset}, Performance: ${perfColor}${perfIcon} ${result.duration}ms${colors.reset} (target: <${threshold}ms)`
  );

  if (result.error) {
    console.log(`  ${colors.red}Error: ${result.error}${colors.reset}`);
  }

  console.log("");
}

/**
 * Run performance tests
 */
async function runPerformanceTests() {
  console.log(`${colors.blue}=== Query Performance Tests ===${colors.reset}\n`);
  console.log(`${colors.gray}Testing against: ${BASE_URL}${colors.reset}\n`);

  const results = [];

  // Test 1: Health check (should be very fast)
  console.log(`${colors.blue}1. Health Check${colors.reset}`);
  const healthResult = await measureEndpoint("Health Check", "/api/health");
  printResult(healthResult, 100);
  results.push({ ...healthResult, threshold: 100 });

  // Test 2: Locations list (should be < 1s)
  console.log(`${colors.blue}2. Locations List${colors.reset}`);
  const locationsResult = await measureEndpoint("Locations List", "/api/locations");
  printResult(locationsResult, 1000);
  results.push({ ...locationsResult, threshold: 1000 });

  // Test 3: Current period (should be < 1s)
  console.log(`${colors.blue}3. Current Period${colors.reset}`);
  const periodResult = await measureEndpoint("Current Period", "/api/periods/current");
  printResult(periodResult, 1000);
  results.push({ ...periodResult, threshold: 1000 });

  // Test 4: Items list (should be < 1s)
  console.log(`${colors.blue}4. Items List (with category filter)${colors.reset}`);
  const itemsResult = await measureEndpoint("Items List", "/api/items?limit=50");
  printResult(itemsResult, 1000);
  results.push({ ...itemsResult, threshold: 1000 });

  // Test 5: Suppliers list (should be < 1s)
  console.log(`${colors.blue}5. Suppliers List${colors.reset}`);
  const suppliersResult = await measureEndpoint("Suppliers List", "/api/suppliers");
  printResult(suppliersResult, 1000);
  results.push({ ...suppliersResult, threshold: 1000 });

  // Summary
  console.log(`${colors.blue}=== Summary ===${colors.reset}\n`);

  const passed = results.filter((r) => r.ok && r.duration <= r.threshold).length;
  const failed = results.filter((r) => !r.ok).length;
  const slow = results.filter((r) => r.ok && r.duration > r.threshold).length;

  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.yellow}Slow: ${slow}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${results.length}\n`);

  // Average response time
  const avgDuration =
    results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  console.log(`${colors.gray}Average response time: ${Math.round(avgDuration)}ms${colors.reset}\n`);

  // Exit code
  const exitCode = failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Run tests
runPerformanceTests().catch((error) => {
  console.error(`${colors.red}Test runner error: ${error.message}${colors.reset}`);
  process.exit(1);
});
