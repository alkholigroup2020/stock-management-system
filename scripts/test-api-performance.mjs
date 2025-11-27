/**
 * API Performance Testing Script
 * Tests API endpoints to ensure response times are < 1s for standard operations
 */

const BASE_URL = "http://localhost:3000";

// Test configuration
const TESTS = [
  {
    name: "Health Check",
    endpoint: "/api/health",
    method: "GET",
    expectedMaxTime: 100,
  },
  {
    name: "Get Items List",
    endpoint: "/api/items?limit=50",
    method: "GET",
    expectedMaxTime: 1000,
    requiresAuth: true,
  },
  {
    name: "Get Locations List",
    endpoint: "/api/locations",
    method: "GET",
    expectedMaxTime: 1000,
    requiresAuth: true,
  },
  {
    name: "Get Suppliers List",
    endpoint: "/api/suppliers",
    method: "GET",
    expectedMaxTime: 1000,
    requiresAuth: true,
  },
  {
    name: "Get Current Period",
    endpoint: "/api/periods/current",
    method: "GET",
    expectedMaxTime: 1000,
    requiresAuth: true,
  },
  {
    name: "Get User Locations",
    endpoint: "/api/user/locations",
    method: "GET",
    expectedMaxTime: 1000,
    requiresAuth: true,
  },
];

// ANSI color codes
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

async function testEndpoint(test, authCookie = null) {
  const url = `${BASE_URL}${test.endpoint}`;
  const headers = {};

  if (test.requiresAuth && authCookie) {
    headers.Cookie = authCookie;
  }

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: test.method,
      headers,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    const status = response.ok ? "PASS" : "FAIL";
    const statusColor = response.ok ? colors.green : colors.red;
    const timeColor =
      duration < test.expectedMaxTime ? colors.green : colors.red;

    console.log(
      `  ${statusColor}${status}${colors.reset} ${test.name} - ${timeColor}${duration}ms${colors.reset} (expected < ${test.expectedMaxTime}ms)`
    );

    return {
      test: test.name,
      duration,
      expectedMaxTime: test.expectedMaxTime,
      passed: response.ok && duration < test.expectedMaxTime,
      status: response.status,
    };
  } catch (error) {
    console.log(
      `  ${colors.red}FAIL${colors.reset} ${test.name} - ${colors.red}Error: ${error.message}${colors.reset}`
    );
    return {
      test: test.name,
      duration: 0,
      expectedMaxTime: test.expectedMaxTime,
      passed: false,
      error: error.message,
    };
  }
}

async function login() {
  console.log(`\n${colors.cyan}Attempting to log in...${colors.reset}`);

  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "admin",
        password: "admin123",
      }),
    });

    if (response.ok) {
      const cookies = response.headers.get("set-cookie");
      console.log(`${colors.green}Login successful${colors.reset}\n`);
      return cookies;
    } else {
      console.log(
        `${colors.yellow}Login failed (status ${response.status}). Some tests may fail.${colors.reset}\n`
      );
      return null;
    }
  } catch (error) {
    console.log(
      `${colors.yellow}Login error: ${error.message}. Some tests may fail.${colors.reset}\n`
    );
    return null;
  }
}

async function runTests() {
  console.log(
    `\n${colors.cyan}=== API Performance Test Suite ===${colors.reset}\n`
  );
  console.log(`Testing against: ${BASE_URL}\n`);

  // Login first
  const authCookie = await login();

  const results = [];

  // Run all tests
  for (const test of TESTS) {
    const result = await testEndpoint(test, authCookie);
    results.push(result);
  }

  // Summary
  console.log(`\n${colors.cyan}=== Summary ===${colors.reset}\n`);

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const avgTime =
    results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Average Response Time: ${Math.round(avgTime)}ms`);

  // Show slow endpoints
  const slowEndpoints = results.filter(
    (r) => r.duration >= r.expectedMaxTime && r.passed !== false
  );
  if (slowEndpoints.length > 0) {
    console.log(`\n${colors.yellow}Slow Endpoints (need optimization):${colors.reset}`);
    slowEndpoints.forEach((r) => {
      console.log(`  - ${r.test}: ${r.duration}ms (expected < ${r.expectedMaxTime}ms)`);
    });
  }

  // Performance metrics endpoint
  if (authCookie) {
    console.log(`\n${colors.cyan}=== Performance Metrics ===${colors.reset}\n`);
    try {
      const response = await fetch(`${BASE_URL}/api/metrics/performance`, {
        headers: { Cookie: authCookie },
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`Total Requests Tracked: ${data.overall.totalRequests}`);
        console.log(`Slow Requests (>1s): ${data.overall.slowRequests}`);
        console.log(`Average Response Time: ${data.overall.avgDuration}ms`);
        console.log(
          `Slow Request Percentage: ${data.overall.slowRequestPercentage}%`
        );
      }
    } catch (error) {
      console.log(`${colors.yellow}Could not fetch performance metrics${colors.reset}`);
    }
  }

  console.log("\n");

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
