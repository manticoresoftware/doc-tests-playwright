import { test, expect } from '@playwright/test';
import { CodeTabsPage } from '../pages/code-tabs.page';

const INSTALLATION_PATH = '/Installation/Installation';

test.describe('OS Installation Tabs', () => {
  let codeTabs: CodeTabsPage;

  test.beforeEach(async ({ page }) => {
    codeTabs = new CodeTabsPage(page);
    await codeTabs.goto(INSTALLATION_PATH);
  });

  test('default tab is RHEL', async () => {
    const osBlocks = await codeTabs.getOsBlocks();
    expect(osBlocks.length).toBeGreaterThan(0);

    const activeTab = await codeTabs.getActiveTabText(osBlocks[0]);
    expect(activeTab).toContain('RHEL');

    const content = await codeTabs.getVisibleContent(osBlocks[0]);
    expect(content.toLowerCase()).toContain('yum');
  });

  test('switch to Debian', async () => {
    const osBlocks = await codeTabs.getOsBlocks();
    expect(osBlocks.length).toBeGreaterThan(0);

    await codeTabs.clickTab(osBlocks[0], 'Debian');
    const content = await codeTabs.getVisibleContent(osBlocks[0]);
    const hasApt = content.toLowerCase().includes('apt');
    const hasWget = content.toLowerCase().includes('wget');
    expect(hasApt || hasWget).toBeTruthy();
  });

  test('switch to Docker', async () => {
    const osBlocks = await codeTabs.getOsBlocks();
    expect(osBlocks.length).toBeGreaterThan(0);

    await codeTabs.clickTab(osBlocks[0], 'Docker');
    const content = await codeTabs.getVisibleContent(osBlocks[0]);
    expect(content.toLowerCase()).toContain('docker');
  });

  test('switch to MacOS', async () => {
    const osBlocks = await codeTabs.getOsBlocks();
    expect(osBlocks.length).toBeGreaterThan(0);

    await codeTabs.clickTab(osBlocks[0], 'MacOS');
    const content = await codeTabs.getVisibleContent(osBlocks[0]);
    expect(content.toLowerCase()).toContain('brew');
  });

  test('switch to Kubernetes', async () => {
    const osBlocks = await codeTabs.getOsBlocks();
    expect(osBlocks.length).toBeGreaterThan(0);

    await codeTabs.clickTab(osBlocks[0], 'Kubernetes');
    const content = await codeTabs.getVisibleContent(osBlocks[0]);
    expect(content.toLowerCase()).toContain('helm');
  });

  test('switching tabs changes content and restores', async () => {
    const osBlocks = await codeTabs.getOsBlocks();
    expect(osBlocks.length).toBeGreaterThan(0);

    const rhelContent = await codeTabs.getVisibleContent(osBlocks[0]);

    await codeTabs.clickTab(osBlocks[0], 'Docker');
    const dockerContent = await codeTabs.getVisibleContent(osBlocks[0]);
    expect(dockerContent).not.toBe(rhelContent);

    await codeTabs.clickTab(osBlocks[0], 'RHEL');
    const restoredContent = await codeTabs.getVisibleContent(osBlocks[0]);
    expect(restoredContent).toBe(rhelContent);
  });
});
