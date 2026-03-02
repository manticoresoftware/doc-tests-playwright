import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('sidebar contains expected sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    const expectedSections = ['Introduction', 'Installation', 'Quick start guide', 'Searching'];

    for (const section of expectedSections) {
      expect(bodyText?.toLowerCase(), `Page should contain "${section}"`).toContain(
        section.toLowerCase(),
      );
    }
  });

  test('clicking sidebar link navigates to correct page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on "Quick start guide" link
    const link = page.locator('a', { hasText: 'Quick start guide' }).first();
    await link.click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/Quick_start_guide/i);
  });

  test('page heading matches page content', async ({ page }) => {
    await page.goto('/Quick_start_guide');
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content?.toLowerCase()).toContain('quick start');
  });

  test('page title reflects current page', async ({ page }) => {
    await page.goto('/Quick_start_guide');
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    expect(title.toLowerCase()).toContain('quick start');
  });
});
