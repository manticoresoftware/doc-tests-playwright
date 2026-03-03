import { test, expect } from '@playwright/test';

test.describe('Broken Links', () => {
  test('sidebar navigation links return 200', async ({ page, request }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Collect all sidebar links
    const links = await page.locator('#docs-tree a[href]').all();
    expect(links.length).toBeGreaterThan(0);

    const hrefs: string[] = [];
    for (const link of links.slice(0, 20)) {
      const href = await link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('http')) {
        hrefs.push(href);
      }
    }

    // Check each link returns 200
    const failures: string[] = [];
    for (const href of hrefs) {
      const url = `https://manual.manticoresearch.com${href}`;
      const response = await request.get(url);
      if (response.status() !== 200) {
        failures.push(`${href} → ${response.status()}`);
      }
    }

    expect(failures, `Broken links found:\n${failures.join('\n')}`).toHaveLength(0);
  });

  test('main page external links are reachable', async ({ page, request }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Collect external links (https://) from the main content area
    const links = await page.locator('.content a[href^="https://"]').all();

    const hrefs: string[] = [];
    for (const link of links.slice(0, 10)) {
      const href = await link.getAttribute('href');
      if (href) hrefs.push(href);
    }

    const failures: string[] = [];
    for (const href of hrefs) {
      try {
        const response = await request.get(href, { timeout: 10_000 });
        if (response.status() >= 400) {
          failures.push(`${href} → ${response.status()}`);
        }
      } catch {
        failures.push(`${href} → timeout/unreachable`);
      }
    }

    expect(failures, `Broken external links:\n${failures.join('\n')}`).toHaveLength(0);
  });
});
