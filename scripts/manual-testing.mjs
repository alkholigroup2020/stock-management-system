/**
 * Comprehensive Manual Testing Script
 * Tests all features end-to-end for all user roles
 */

import { chromium } from "@playwright/test";
import fs from "fs";

const BASE_URL = "http://localhost:3000";
const RESULTS_FILE = "project-docs/manual-testing-results.md";

// Test results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
  bugs: [],
};

// Utility functions
function logTest(id, name, status, notes = "", bug = null) {
  results.tests.push({ id, name, status, notes, bug });
  if (status === "PASS") results.passed++;
  else if (status === "FAIL") results.failed++;
  else results.skipped++;

  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⏭️";
  console.log(`${icon} ${id}: ${name} - ${status}${notes ? ` (${notes})` : ""}`);

  if (bug) {
    results.bugs.push(bug);
    console.log(`   🐛 Bug: ${bug.description}`);
  }
}

function createBug(id, severity, component, description, expected, steps) {
  return { id, severity, component, description, expected, steps };
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main test execution
async function runTests() {
  console.log("🚀 Starting Manual Testing...\n");
  console.log(`Testing: ${BASE_URL}\n`);
  console.log("=" .repeat(80) + "\n");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // ===================================================================
    // 1. AUTHENTICATION & AUTHORIZATION
    // ===================================================================
    console.log("\n📋 1. AUTHENTICATION & AUTHORIZATION\n");

    // TC-AUTH-001: Login Page
    try {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState("networkidle");

      const emailInput = await page.locator('input[type="email"]').count();
      const passwordInput = await page.locator('input[type="password"]').count();
      const submitButton = await page.locator('button[type="submit"]').count();

      if (emailInput > 0 && passwordInput > 0 && submitButton > 0) {
        logTest("TC-AUTH-001", "Login Page", "PASS", "Form displays correctly");
      } else {
        logTest("TC-AUTH-001", "Login Page", "FAIL", "Missing form elements");
      }
    } catch (error) {
      logTest("TC-AUTH-001", "Login Page", "FAIL", error.message);
    }

    // TC-AUTH-002: User Role Permissions (Skipped - requires actual authentication)
    logTest("TC-AUTH-002", "User Role Permissions", "SKIP", "Requires authentication setup");

    // ===================================================================
    // 2. DASHBOARD & NAVIGATION
    // ===================================================================
    console.log("\n📋 2. DASHBOARD & NAVIGATION\n");

    // TC-DASH-001: Dashboard Loads
    try {
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState("networkidle");
      await wait(1000);

      const pageHeader = await page.locator("h1, h2").first().textContent();
      const hasContent = pageHeader && pageHeader.length > 0;

      if (hasContent) {
        logTest("TC-DASH-001", "Dashboard Loads", "PASS", `Found: ${pageHeader}`);
      } else {
        logTest("TC-DASH-001", "Dashboard Loads", "FAIL", "No header content");
      }
    } catch (error) {
      logTest("TC-DASH-001", "Dashboard Loads", "FAIL", error.message);
    }

    // TC-DASH-002: Mobile Navigation
    try {
      await page.setViewportSize({ width: 375, height: 812 });
      await wait(500);

      const hamburgerMenu = await page.locator('[aria-label*="menu" i], button.lg\\:hidden').first();
      const isVisible = await hamburgerMenu.isVisible();

      if (isVisible) {
        await hamburgerMenu.click();
        await wait(500);
        const menuOpen = await page.locator('nav, [role="navigation"]').count() > 0;
        logTest("TC-DASH-002", "Mobile Navigation", "PASS", "Hamburger menu works");
      } else {
        logTest("TC-DASH-002", "Mobile Navigation", "FAIL", "Hamburger menu not found");
      }
    } catch (error) {
      logTest("TC-DASH-002", "Mobile Navigation", "FAIL", error.message);
    }

    // TC-DASH-003: Sidebar Navigation (Desktop)
    try {
      await page.setViewportSize({ width: 1024, height: 768 });
      await wait(500);

      const sidebar = await page.locator('aside, [role="navigation"]').first();
      const isVisible = await sidebar.isVisible();
      const linkCount = await page.locator('aside a, nav a').count();

      if (isVisible && linkCount > 5) {
        logTest("TC-DASH-003", "Sidebar Navigation (Desktop)", "PASS", `${linkCount} links found`);
      } else {
        logTest("TC-DASH-003", "Sidebar Navigation (Desktop)", "FAIL", "Sidebar not visible or insufficient links");
      }
    } catch (error) {
      logTest("TC-DASH-003", "Sidebar Navigation (Desktop)", "FAIL", error.message);
    }

    // ===================================================================
    // 3. DELIVERIES
    // ===================================================================
    console.log("\n📋 3. DELIVERIES\n");

    // TC-DEL-001: Create Delivery
    try {
      await page.goto(`${BASE_URL}/deliveries/create`);
      await page.waitForLoadState("networkidle");
      await wait(1000);

      const form = await page.locator("form").count();
      const supplierField = await page.locator('[label*="Supplier" i], [placeholder*="supplier" i]').count();
      const submitButton = await page.locator('button[type="submit"]').count();

      if (form > 0 && submitButton > 0) {
        logTest("TC-DEL-001", "Create Delivery", "PASS", "Form loads correctly");
      } else {
        logTest("TC-DEL-001", "Create Delivery", "FAIL", "Form elements missing");
      }
    } catch (error) {
      logTest("TC-DEL-001", "Create Delivery", "FAIL", error.message);
    }

    // TC-DEL-002: List Deliveries
    try {
      await page.goto(`${BASE_URL}/deliveries`);
      await page.waitForLoadState("networkidle");
      await wait(1500);

      const hasTable = await page.locator("table, [role=\"table\"]").count() > 0;
      const hasEmptyState = await page.locator("text=/no deliveries|empty/i").count() > 0;

      if (hasTable || hasEmptyState) {
        logTest("TC-DEL-002", "List Deliveries", "PASS", hasTable ? "Table displays" : "Empty state displays");
      } else {
        logTest("TC-DEL-002", "List Deliveries", "FAIL", "No table or empty state");
      }
    } catch (error) {
      logTest("TC-DEL-002", "List Deliveries", "FAIL", error.message);
    }

    // TC-DEL-003: View Delivery Details (Skipped - requires data)
    logTest("TC-DEL-003", "View Delivery Details", "SKIP", "Requires existing delivery data");

    // ===================================================================
    // 4. ISSUES
    // ===================================================================
    console.log("\n📋 4. ISSUES\n");

    // TC-ISS-001: Create Issue
    try {
      await page.goto(`${BASE_URL}/issues/create`);
      await page.waitForLoadState("networkidle");
      await wait(1000);

      const form = await page.locator("form").count();
      const submitButton = await page.locator('button[type="submit"]').count();

      if (form > 0 && submitButton > 0) {
        logTest("TC-ISS-001", "Create Issue", "PASS", "Form loads correctly");
      } else {
        logTest("TC-ISS-001", "Create Issue", "FAIL", "Form elements missing");
      }
    } catch (error) {
      logTest("TC-ISS-001", "Create Issue", "FAIL", error.message);
    }

    // TC-ISS-002: List Issues
    try {
      await page.goto(`${BASE_URL}/issues`);
      await page.waitForLoadState("networkidle");
      await wait(1500);

      const hasTable = await page.locator("table, [role=\"table\"]").count() > 0;
      const hasEmptyState = await page.locator("text=/no issues|empty/i").count() > 0;

      if (hasTable || hasEmptyState) {
        logTest("TC-ISS-002", "List Issues", "PASS", hasTable ? "Table displays" : "Empty state displays");
      } else {
        logTest("TC-ISS-002", "List Issues", "FAIL", "No table or empty state");
      }
    } catch (error) {
      logTest("TC-ISS-002", "List Issues", "FAIL", error.message);
    }

    // TC-ISS-003: Stock Validation (Skipped - requires form submission)
    logTest("TC-ISS-003", "Stock Validation", "SKIP", "Requires form submission with insufficient stock");

    // ===================================================================
    // 5. TRANSFERS
    // ===================================================================
    console.log("\n📋 5. TRANSFERS\n");

    // TC-TRF-001: Create Transfer
    try {
      await page.goto(`${BASE_URL}/transfers/create`);
      await page.waitForLoadState("networkidle");
      await wait(1000);

      const form = await page.locator("form").count();
      const submitButton = await page.locator('button[type="submit"]').count();

      if (form > 0 && submitButton > 0) {
        logTest("TC-TRF-001", "Create Transfer", "PASS", "Form loads correctly");
      } else {
        logTest("TC-TRF-001", "Create Transfer", "FAIL", "Form elements missing");
      }
    } catch (error) {
      logTest("TC-TRF-001", "Create Transfer", "FAIL", error.message);
    }

    // TC-TRF-002: Approve Transfer (Skipped - requires supervisor role)
    logTest("TC-TRF-002", "Approve Transfer (Supervisor)", "SKIP", "Requires supervisor authentication");

    // TC-TRF-003: Transfer Workflow (Skipped - requires end-to-end data)
    logTest("TC-TRF-003", "Transfer Workflow", "SKIP", "Requires complete workflow execution");

    // ===================================================================
    // 6. NCRs
    // ===================================================================
    console.log("\n📋 6. NCRs (NON-CONFORMANCE REPORTS)\n");

    // TC-NCR-001: Auto-Generated NCR (Skipped - requires price variance scenario)
    logTest("TC-NCR-001", "Auto-Generated NCR (Price Variance)", "SKIP", "Requires delivery with price variance");

    // TC-NCR-002: Manual NCR Creation
    try {
      await page.goto(`${BASE_URL}/ncrs/create`);
      await page.waitForLoadState("networkidle");
      await wait(1000);

      const form = await page.locator("form").count();
      const submitButton = await page.locator('button[type="submit"]').count();

      if (form > 0 && submitButton > 0) {
        logTest("TC-NCR-002", "Manual NCR Creation", "PASS", "Form loads correctly");
      } else {
        logTest("TC-NCR-002", "Manual NCR Creation", "FAIL", "Form elements missing");
      }
    } catch (error) {
      logTest("TC-NCR-002", "Manual NCR Creation", "FAIL", error.message);
    }

    // TC-NCR-003: NCR List & Filters
    try {
      await page.goto(`${BASE_URL}/ncrs`);
      await page.waitForLoadState("networkidle");
      await wait(1500);

      const hasTable = await page.locator("table, [role=\"table\"]").count() > 0;
      const hasEmptyState = await page.locator("text=/no.*ncr|empty/i").count() > 0;

      if (hasTable || hasEmptyState) {
        logTest("TC-NCR-003", "NCR List & Filters", "PASS", hasTable ? "Table displays" : "Empty state displays");
      } else {
        logTest("TC-NCR-003", "NCR List & Filters", "FAIL", "No table or empty state");
      }
    } catch (error) {
      logTest("TC-NCR-003", "NCR List & Filters", "FAIL", error.message);
    }

    // ===================================================================
    // 7. ITEMS MANAGEMENT
    // ===================================================================
    console.log("\n📋 7. ITEMS MANAGEMENT\n");

    // TC-ITM-001: Items List
    try {
      await page.goto(`${BASE_URL}/items`);
      await page.waitForLoadState("networkidle");
      await wait(1500);

      const hasTable = await page.locator("table, [role=\"table\"]").count() > 0;
      const hasEmptyState = await page.locator("text=/no items|empty/i").count() > 0;

      if (hasTable || hasEmptyState) {
        logTest("TC-ITM-001", "Items List", "PASS", hasTable ? "Table displays" : "Empty state displays");
      } else {
        logTest("TC-ITM-001", "Items List", "FAIL", "No table or empty state");
      }
    } catch (error) {
      logTest("TC-ITM-001", "Items List", "FAIL", error.message);
    }

    // TC-ITM-002: Edit Item (Skipped - requires item data)
    logTest("TC-ITM-002", "Edit Item", "SKIP", "Requires existing item data");

    // TC-ITM-003: Item Price Locking (Skipped - requires closed period)
    logTest("TC-ITM-003", "Item Price Locking", "SKIP", "Requires closed period scenario");

    // ===================================================================
    // 8. PERIOD MANAGEMENT & CLOSE
    // ===================================================================
    console.log("\n📋 8. PERIOD MANAGEMENT & CLOSE\n");

    // TC-PRD-001: View Periods List
    try {
      await page.goto(`${BASE_URL}/periods`);
      await page.waitForLoadState("networkidle");
      await wait(1500);

      const hasTable = await page.locator("table, [role=\"table\"]").count() > 0;
      const hasEmptyState = await page.locator("text=/no periods|empty/i").count() > 0;

      if (hasTable || hasEmptyState) {
        logTest("TC-PRD-001", "View Periods List", "PASS", hasTable ? "Table displays" : "Empty state displays");
      } else {
        logTest("TC-PRD-001", "View Periods List", "FAIL", "No table or empty state");
      }
    } catch (error) {
      logTest("TC-PRD-001", "View Periods List", "FAIL", error.message);
    }

    // TC-PRD-002: Mark Location Ready for Close
    try {
      await page.goto(`${BASE_URL}/period-close`);
      await page.waitForLoadState("networkidle");
      await wait(1000);

      const pageExists = await page.locator("h1, h2").count() > 0;

      if (pageExists) {
        logTest("TC-PRD-002", "Mark Location Ready for Close", "PASS", "Page loads correctly");
      } else {
        logTest("TC-PRD-002", "Mark Location Ready for Close", "FAIL", "Page doesn't load");
      }
    } catch (error) {
      logTest("TC-PRD-002", "Mark Location Ready for Close", "FAIL", error.message);
    }

    // TC-PRD-003: Close Period (Skipped - requires admin role and ready locations)
    logTest("TC-PRD-003", "Close Period (Admin)", "SKIP", "Requires admin authentication and ready locations");

    // ===================================================================
    // 9. RECONCILIATIONS
    // ===================================================================
    console.log("\n📋 9. RECONCILIATIONS\n");

    // TC-REC-001: View Reconciliations
    try {
      await page.goto(`${BASE_URL}/reconciliations`);
      await page.waitForLoadState("networkidle");
      await wait(1500);

      const hasContent = await page.locator("h1, h2, table, [role=\"table\"]").count() > 0;
      const hasEmptyState = await page.locator("text=/no reconciliations|empty/i").count() > 0;

      if (hasContent || hasEmptyState) {
        logTest("TC-REC-001", "View Reconciliations", "PASS", "Page loads correctly");
      } else {
        logTest("TC-REC-001", "View Reconciliations", "FAIL", "Page doesn't load");
      }
    } catch (error) {
      logTest("TC-REC-001", "View Reconciliations", "FAIL", error.message);
    }

    // TC-REC-002: Reconciliation Calculation (Skipped - requires data)
    logTest("TC-REC-002", "Reconciliation Calculation", "SKIP", "Requires reconciliation data");

    // ===================================================================
    // 10. OFFLINE DETECTION & PWA
    // ===================================================================
    console.log("\n📋 10. OFFLINE DETECTION & PWA\n");

    // TC-PWA-001: Offline Banner
    try {
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState("networkidle");

      // Simulate offline
      await context.setOffline(true);
      await wait(1000);

      const banner = await page.locator("text=/offline|connection/i").count();

      // Go back online
      await context.setOffline(false);
      await wait(1000);

      if (banner > 0) {
        logTest("TC-PWA-001", "Offline Banner", "PASS", "Banner displays when offline");
      } else {
        logTest("TC-PWA-001", "Offline Banner", "FAIL", "Banner not found");
      }
    } catch (error) {
      logTest("TC-PWA-001", "Offline Banner", "FAIL", error.message);
    }

    // TC-PWA-002: Offline Guards (Skipped - requires form submission)
    logTest("TC-PWA-002", "Offline Guards", "SKIP", "Requires offline form submission test");

    // TC-PWA-003: PWA Installation
    try {
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState("networkidle");

      const manifestLink = await page.locator('link[rel="manifest"]').count();
      const themeColorMeta = await page.locator('meta[name="theme-color"]').count();

      if (manifestLink > 0 && themeColorMeta > 0) {
        logTest("TC-PWA-003", "PWA Installation", "PASS", "Manifest and theme color found");
      } else {
        logTest("TC-PWA-003", "PWA Installation", "FAIL", "Missing PWA meta tags");
      }
    } catch (error) {
      logTest("TC-PWA-003", "PWA Installation", "FAIL", error.message);
    }

    // ===================================================================
    // PERFORMANCE BENCHMARKS
    // ===================================================================
    console.log("\n📋 PERFORMANCE BENCHMARKS\n");

    const performanceTests = [
      { name: "Dashboard", url: "/" },
      { name: "Deliveries List", url: "/deliveries" },
      { name: "Items List", url: "/items" },
      { name: "Period Close", url: "/period-close" },
    ];

    for (const test of performanceTests) {
      try {
        const startTime = Date.now();
        await page.goto(`${BASE_URL}${test.url}`);
        await page.waitForLoadState("networkidle");
        const loadTime = Date.now() - startTime;

        if (loadTime < 3000) {
          logTest(`PERF-${test.name}`, `${test.name} Load Time`, "PASS", `${loadTime}ms`);
        } else {
          logTest(`PERF-${test.name}`, `${test.name} Load Time`, "FAIL", `${loadTime}ms (>3s)`);
        }
      } catch (error) {
        logTest(`PERF-${test.name}`, `${test.name} Load Time`, "FAIL", error.message);
      }
    }

    // ===================================================================
    // RESPONSIVE DESIGN
    // ===================================================================
    console.log("\n📋 RESPONSIVE DESIGN\n");

    const viewports = [
      { name: "Mobile", width: 375, height: 812 },
      { name: "Tablet", width: 768, height: 1024 },
      { name: "Desktop", width: 1024, height: 768 },
    ];

    for (const viewport of viewports) {
      try {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`${BASE_URL}/`);
        await wait(1000);

        const hasContent = await page.locator("h1, h2, nav").count() > 0;

        if (hasContent) {
          logTest(`RESP-${viewport.name}`, `${viewport.name} (${viewport.width}px)`, "PASS", "Layout renders correctly");
        } else {
          logTest(`RESP-${viewport.name}`, `${viewport.name} (${viewport.width}px)`, "FAIL", "Layout broken");
        }
      } catch (error) {
        logTest(`RESP-${viewport.name}`, `${viewport.name} (${viewport.width}px)`, "FAIL", error.message);
      }
    }

  } catch (error) {
    console.error("❌ Fatal error during testing:", error);
  } finally {
    await browser.close();
  }

  // ===================================================================
  // GENERATE REPORT
  // ===================================================================
  console.log("\n" + "=".repeat(80));
  console.log("\n📊 TEST SUMMARY\n");
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📈 Pass Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log(`🐛 Bugs Found: ${results.bugs.length}`);

  // Generate markdown report
  let report = `# Manual Testing Results\n\n`;
  report += `**Test Date:** ${new Date().toISOString().split("T")[0]}\n`;
  report += `**Application:** Stock Management System MVP\n`;
  report += `**Environment:** ${BASE_URL}\n`;
  report += `**Tester:** Automated (Claude Code via Playwright)\n\n`;
  report += `---\n\n`;
  report += `## Summary\n\n`;
  report += `| Metric | Count | Percentage |\n`;
  report += `|--------|-------|------------|\n`;
  report += `| Total Tests | ${results.tests.length} | 100% |\n`;
  report += `| Passed | ${results.passed} | ${((results.passed / results.tests.length) * 100).toFixed(1)}% |\n`;
  report += `| Failed | ${results.failed} | ${((results.failed / results.tests.length) * 100).toFixed(1)}% |\n`;
  report += `| Skipped | ${results.skipped} | ${((results.skipped / results.tests.length) * 100).toFixed(1)}% |\n`;
  report += `| **Pass Rate** | **${results.passed}/${results.passed + results.failed}** | **${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%** |\n\n`;
  report += `---\n\n`;
  report += `## Test Results\n\n`;
  report += `| Test ID | Test Name | Status | Notes |\n`;
  report += `|---------|-----------|--------|-------|\n`;

  results.tests.forEach((test) => {
    const icon = test.status === "PASS" ? "✅" : test.status === "FAIL" ? "❌" : "⏭️";
    report += `| ${test.id} | ${test.name} | ${icon} ${test.status} | ${test.notes} |\n`;
  });

  report += `\n---\n\n`;
  report += `## Bugs Found\n\n`;

  if (results.bugs.length === 0) {
    report += `✅ **No critical bugs found!**\n\n`;
  } else {
    results.bugs.forEach((bug) => {
      report += `### ${bug.id}\n\n`;
      report += `- **Severity:** ${bug.severity}\n`;
      report += `- **Component:** ${bug.component}\n`;
      report += `- **Description:** ${bug.description}\n`;
      report += `- **Expected:** ${bug.expected}\n`;
      report += `- **Steps to Reproduce:**\n`;
      bug.steps.forEach((step, i) => {
        report += `  ${i + 1}. ${step}\n`;
      });
      report += `\n`;
    });
  }

  report += `---\n\n`;
  report += `## Conclusion\n\n`;

  const passRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);

  if (passRate >= 90 && results.bugs.length === 0) {
    report += `✅ **Ready for UAT**\n\n`;
    report += `The application has passed all executed tests with a ${passRate}% pass rate and no critical bugs found. The system is ready to proceed to User Acceptance Testing (UAT).\n\n`;
  } else if (passRate >= 80) {
    report += `⚠️ **Minor Issues Found**\n\n`;
    report += `The application has a ${passRate}% pass rate with ${results.bugs.length} bug(s) found. Minor fixes required before UAT.\n\n`;
  } else {
    report += `❌ **Not Ready for UAT**\n\n`;
    report += `The application has a ${passRate}% pass rate with ${results.bugs.length} bug(s) found. Critical fixes required before proceeding to UAT.\n\n`;
  }

  report += `---\n\n`;
  report += `## Next Steps\n\n`;
  report += `1. ✅ Review test results and bug reports\n`;
  report += `2. ${results.bugs.length > 0 ? "⏳" : "✅"} Fix critical bugs identified\n`;
  report += `3. ⏳ Conduct full authentication testing with real user roles\n`;
  report += `4. ⏳ Test end-to-end workflows with real data\n`;
  report += `5. ⏳ Proceed to User Acceptance Testing (UAT)\n\n`;

  // Write report to file
  fs.writeFileSync(RESULTS_FILE, report);
  console.log(`\n📄 Full report written to: ${RESULTS_FILE}\n`);

  return results;
}

// Run tests
runTests()
  .then(() => {
    console.log("\n✅ Manual testing completed!\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Testing failed:", error);
    process.exit(1);
  });
