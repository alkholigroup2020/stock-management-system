import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Login Page Accessibility', () => {
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Run axe accessibility scan
    // Exclude Nuxt DevTools (only present in dev mode)
    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('nuxt-devtools-frame')
      .analyze();

    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('\n=== ACCESSIBILITY VIOLATIONS ===\n');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`\n${violation.id} (${violation.impact}):`);
        console.log(`  Description: ${violation.description}`);
        console.log(`  Help: ${violation.help}`);
        console.log(`  Affected elements (${violation.nodes.length}):`);
        violation.nodes.forEach((node, i) => {
          console.log(`    ${i + 1}. ${node.html}`);
          console.log(`       Target: ${node.target.join(', ')}`);
          console.log(`       Message: ${node.failureSummary}`);
        });
      });
      console.log('\n===============================\n');
    }

    // Expect no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have any accessibility issues in dark mode', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // Enable dark mode
    await page.emulateMedia({ colorScheme: 'dark' });

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Run axe accessibility scan
    // Exclude Nuxt DevTools (only present in dev mode)
    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('nuxt-devtools-frame')
      .analyze();

    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('\n=== DARK MODE ACCESSIBILITY VIOLATIONS ===\n');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`\n${violation.id} (${violation.impact}):`);
        console.log(`  Description: ${violation.description}`);
        console.log(`  Help: ${violation.help}`);
        console.log(`  Affected elements (${violation.nodes.length}):`);
        violation.nodes.forEach((node, i) => {
          console.log(`    ${i + 1}. ${node.html}`);
          console.log(`       Target: ${node.target.join(', ')}`);
          console.log(`       Message: ${node.failureSummary}`);
        });
      });
      console.log('\n===============================\n');
    }

    // Expect no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
