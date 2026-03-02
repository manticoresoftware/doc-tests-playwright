import { test, expect } from '@playwright/test';
import { CodeTabsPage } from '../pages/code-tabs.page';

const QUICK_START_PATH = '/Quick_start_guide';

test.describe('Code Tabs (SQL / HTTP / PHP / Python)', () => {
  let codeTabs: CodeTabsPage;

  test.beforeEach(async ({ page }) => {
    codeTabs = new CodeTabsPage(page);
    await codeTabs.goto(QUICK_START_PATH);
  });

  test('default tab is SQL', async () => {
    const blocks = await codeTabs.getCodeBlocks();
    expect(blocks.length).toBeGreaterThan(0);

    const activeTab = await codeTabs.getActiveTabText(blocks[0]);
    expect(activeTab.toUpperCase()).toContain('SQL');
  });

  for (const tabName of ['HTTP', 'PHP', 'Python']) {
    test(`switch to ${tabName} tab`, async () => {
      const blocks = await codeTabs.getCodeBlocks();
      expect(blocks.length).toBeGreaterThan(0);

      const sqlContent = await codeTabs.getVisibleContent(blocks[0]);

      await codeTabs.clickTab(blocks[0], tabName, true);

      const newActiveTab = await codeTabs.getActiveTabText(blocks[0]);
      const newContent = await codeTabs.getVisibleContent(blocks[0]);

      expect(newActiveTab).toContain(tabName);
      expect(newContent).not.toBe(sqlContent);
    });
  }

  test('tab content changes on switch and restores', async () => {
    const blocks = await codeTabs.getCodeBlocks();
    expect(blocks.length).toBeGreaterThan(0);

    const sqlContent = await codeTabs.getVisibleContent(blocks[0]);

    // Switch to HTTP
    await codeTabs.clickTab(blocks[0], 'HTTP', true);
    const httpContent = await codeTabs.getVisibleContent(blocks[0]);
    expect(httpContent).not.toBe(sqlContent);

    // Switch back to SQL
    await codeTabs.clickTab(blocks[0], 'SQL', true);
    const restoredContent = await codeTabs.getVisibleContent(blocks[0]);
    expect(restoredContent).toBe(sqlContent);
  });

  test('global tab sync across code blocks', async ({ page }) => {
    const blocks = await codeTabs.getCodeBlocks();

    if (blocks.length < 2) {
      test.skip();
      return;
    }

    // Switch first block to HTTP
    await codeTabs.clickTab(blocks[0], 'HTTP', true);

    // Wait for sync to propagate
    await page.waitForTimeout(1_000);

    // Verify at least one other block also switched to HTTP
    const activeTab = await codeTabs.getActiveTabText(blocks[1]);
    expect(activeTab).toContain('HTTP');
  });
});
