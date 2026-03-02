import { test, expect } from '@playwright/test';

test.describe('Basic Connection', () => {
  test('website loads successfully', async ({ page }) => {
    await page.goto('/');

    // Page title should not be empty
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Page should contain Manticore-related content
    const body = await page.textContent('body');
    const hasManticore = body?.toLowerCase().includes('manticore');
    const hasSearch = body?.toLowerCase().includes('search');
    expect(hasManticore || hasSearch).toBeTruthy();
  });
});
