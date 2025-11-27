/**
 * Test Page Load Times
 *
 * This script tests the page load times for critical pages in the application.
 */

import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";

const pages = [
  { name: "Login", url: "/login" },
  { name: "Dashboard", url: "/", requiresAuth: true },
  { name: "Deliveries", url: "/deliveries", requiresAuth: true },
  { name: "Issues", url: "/issues", requiresAuth: true },
  { name: "Transfers", url: "/transfers", requiresAuth: true },
  { name: "Items", url: "/items", requiresAuth: true },
  { name: "Stock Now", url: "/stock-now", requiresAuth: true },
];

async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', "admin@example.com");
  await page.fill('input[name="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/`);
}

async function measurePageLoadTime(page, url) {
  const startTime = Date.now();

  await page.goto(`${BASE_URL}${url}`, { waitUntil: "networkidle" });

  const loadTime = Date.now() - startTime;

  // Get performance metrics
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: performance.getEntriesByType("paint").find((p) => p.name === "first-paint")?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByType("paint").find((p) => p.name === "first-contentful-paint")?.startTime || 0,
    };
  });

  return {
    loadTime,
    ...performanceMetrics,
  };
}

async function main() {
  console.log("🚀 Testing Page Load Times\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  for (const pageInfo of pages) {
    try {
      // Login if required
      if (pageInfo.requiresAuth && results.length === 0) {
        console.log("🔐 Logging in...");
        await login(page);
      }

      console.log(`📊 Testing ${pageInfo.name}...`);
      const metrics = await measurePageLoadTime(page, pageInfo.url);

      results.push({
        page: pageInfo.name,
        url: pageInfo.url,
        ...metrics,
      });

      console.log(`   Load Time: ${metrics.loadTime}ms`);
      console.log(`   FP: ${metrics.firstPaint.toFixed(2)}ms`);
      console.log(`   FCP: ${metrics.firstContentfulPaint.toFixed(2)}ms`);
      console.log("");

    } catch (error) {
      console.error(`   ❌ Error testing ${pageInfo.name}:`, error.message);
    }
  }

  await browser.close();

  // Summary
  console.log("\n📈 Summary:");
  console.log("=".repeat(80));
  console.log(
    `${"Page".padEnd(20)} ${"Load Time".padEnd(15)} ${"FP".padEnd(15)} ${"FCP".padEnd(15)}`
  );
  console.log("=".repeat(80));

  for (const result of results) {
    console.log(
      `${result.page.padEnd(20)} ${(result.loadTime + "ms").padEnd(15)} ${(result.firstPaint.toFixed(0) + "ms").padEnd(15)} ${(result.firstContentfulPaint.toFixed(0) + "ms").padEnd(15)}`
    );
  }

  console.log("=".repeat(80));

  const avgLoadTime = results.reduce((sum, r) => sum + r.loadTime, 0) / results.length;
  const avgFCP = results.reduce((sum, r) => sum + r.firstContentfulPaint, 0) / results.length;

  console.log(`\nAverage Load Time: ${avgLoadTime.toFixed(0)}ms`);
  console.log(`Average FCP: ${avgFCP.toFixed(0)}ms`);

  // Performance assessment
  console.log("\n✅ Performance Assessment:");
  if (avgLoadTime < 2000) {
    console.log("   ✅ Excellent: Average load time < 2s");
  } else if (avgLoadTime < 3000) {
    console.log("   ⚠️  Good: Average load time < 3s");
  } else {
    console.log("   ❌ Needs Improvement: Average load time > 3s");
  }

  if (avgFCP < 1800) {
    console.log("   ✅ Excellent: Average FCP < 1.8s (Good Core Web Vitals)");
  } else if (avgFCP < 3000) {
    console.log("   ⚠️  Good: Average FCP < 3s");
  } else {
    console.log("   ❌ Needs Improvement: Average FCP > 3s");
  }
}

main().catch(console.error);
