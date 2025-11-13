import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('App-wide Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication to access protected pages
    await page.goto('http://localhost:3000/login');

    // Fill in login form
    await page.fill('input[type="text"]', 'admin@foodstock.local');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL('http://localhost:3000/');
  });

  test('Dashboard page should not have accessibility issues', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('nuxt-devtools-frame')
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('\n=== DASHBOARD ACCESSIBILITY VIOLATIONS ===\n');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`\n${violation.id} (${violation.impact}):`);
        console.log(`  Description: ${violation.description}`);
        console.log(`  Affected elements: ${violation.nodes.length}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Locations page should not have accessibility issues', async ({ page }) => {
    await page.goto('http://localhost:3000/locations');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('nuxt-devtools-frame')
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('\n=== LOCATIONS PAGE ACCESSIBILITY VIOLATIONS ===\n');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`\n${violation.id} (${violation.impact}):`);
        console.log(`  Description: ${violation.description}`);
        console.log(`  Affected elements: ${violation.nodes.length}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Items page should not have accessibility issues', async ({ page }) => {
    await page.goto('http://localhost:3000/items');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('nuxt-devtools-frame')
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('\n=== ITEMS PAGE ACCESSIBILITY VIOLATIONS ===\n');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`\n${violation.id} (${violation.impact}):`);
        console.log(`  Description: ${violation.description}`);
        console.log(`  Affected elements: ${violation.nodes.length}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Stock Now page should not have accessibility issues', async ({ page }) => {
    await page.goto('http://localhost:3000/stock-now');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('nuxt-devtools-frame')
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('\n=== STOCK NOW PAGE ACCESSIBILITY VIOLATIONS ===\n');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`\n${violation.id} (${violation.impact}):`);
        console.log(`  Description: ${violation.description}`);
        console.log(`  Affected elements: ${violation.nodes.length}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Dark mode should not introduce accessibility issues', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('nuxt-devtools-frame')
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('\n=== DARK MODE ACCESSIBILITY VIOLATIONS ===\n');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`\n${violation.id} (${violation.impact}):`);
        console.log(`  Description: ${violation.description}`);
        console.log(`  Affected elements: ${violation.nodes.length}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
