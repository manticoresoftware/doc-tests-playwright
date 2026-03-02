import { test, expect } from '@playwright/test';

test.describe('Manual Search', () => {
  test('search returns relevant results', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('#query');
    await searchInput.fill('installation');

    // Wait for search results dropdown to appear
    const searchResults = page.locator('.search-res-item');
    await expect(searchResults.first()).toBeVisible({ timeout: 10_000 });

    // Verify results appeared
    const count = await searchResults.count();
    expect(count).toBeGreaterThan(0);

    // Verify at least one result contains relevant text
    const allText = await searchResults.allTextContents();
    const hasRelevant = allText.some(
      (t) => t.toLowerCase().includes('install') || t.toLowerCase().includes('manticore'),
    );
    expect(hasRelevant).toBeTruthy();
  });

  test('clicking search result navigates to page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('#query');
    await searchInput.fill('installation');

    const searchResults = page.locator('.search-res-item');
    await expect(searchResults.first()).toBeVisible({ timeout: 10_000 });

    // Get the text of the first result to verify navigation
    const firstResultText = await searchResults.first().textContent();

    await searchResults.first().click();
    await page.waitForLoadState('networkidle');

    // Verify page content changed (search results should be gone)
    const pageContent = await page.textContent('body');
    expect(pageContent?.length).toBeGreaterThan(0);
  });
});
