import { test, expect, devices } from '@playwright/test';

// Use iPhone 12 viewport for all tests in this file
test.use({
  viewport: { width: 390, height: 844 },
  userAgent: devices['iPhone 12'].userAgent,
  isMobile: true,
});

test.describe('Mobile Viewport', () => {
  test('page loads on mobile viewport', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('content is readable without horizontal scroll', async ({ page }) => {
    await page.goto('/Quick_start_guide');
    await page.waitForLoadState('networkidle');

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    // Allow small tolerance (5px)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
  });

  test('code blocks are visible on mobile', async ({ page }) => {
    await page.goto('/Quick_start_guide');
    await page.waitForLoadState('networkidle');

    const codeBlocks = page.locator('.example-body:visible');
    const count = await codeBlocks.count();
    expect(count).toBeGreaterThan(0);
  });
});
