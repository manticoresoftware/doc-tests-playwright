import { test, expect } from '@playwright/test';

test.describe('Page Anchors', () => {
  test('anchor links on Quick Start page point to existing elements', async ({ page }) => {
    await page.goto('/Quick_start_guide');
    await page.waitForLoadState('networkidle');

    const failures = await page.evaluate(() => {
      const anchors = document.querySelectorAll('a[href^="#"]');
      const broken: string[] = [];

      for (let i = 0; i < Math.min(anchors.length, 30); i++) {
        const href = anchors[i].getAttribute('href');
        if (!href || href === '#') continue;
        const targetId = href.substring(1);
        if (!document.getElementById(targetId)) {
          broken.push(`Anchor ${href} — target element not found`);
        }
      }
      return broken;
    });

    expect(failures, `Broken anchors:\n${failures.join('\n')}`).toHaveLength(0);
  });

  test('headings have named anchors for deep linking', async ({ page }) => {
    await page.goto('/Quick_start_guide');
    await page.waitForLoadState('networkidle');

    // Site uses <a class="anchor" name="..."> instead of heading IDs
    const anchorCount = await page.evaluate(() => {
      return document.querySelectorAll('a.anchor[name]').length;
    });

    expect(anchorCount).toBeGreaterThan(0);
  });
});
