import { test, expect } from '@playwright/test';

test.describe('404 Error Handling', () => {
  test('non-existent page redirects or shows error', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');
    const status = response?.status() ?? 0;

    // Site may return 404 or redirect to main page (200)
    // Either behavior is acceptable, but it should not return 500
    expect(status).toBeLessThan(500);
  });

  test('non-existent page still has working navigation', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345');
    await page.waitForLoadState('networkidle');

    // Page should have some navigation elements
    const hasLinks = (await page.locator('a').count()) > 0;
    expect(hasLinks).toBeTruthy();

    // Page should have meaningful content (not blank)
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });
});
