import { type Locator, type Page, expect } from '@playwright/test';

const OS_KEYWORDS = [
  'ubuntu', 'debian', 'mint', 'rhel', 'centos', 'redhat',
  'docker', 'macos', 'windows', 'kubernetes', 'k8s',
];

/**
 * DOM structure:
 *
 * div.example
 *   div.example-header
 *     div.lang-sel
 *       ul.lang-tabs
 *         li.active > span.lang-text  (active tab)
 *         li > span.lang-text         (other tabs)
 *   div.example-body  (visible — active tab content)
 *   div.example-body  (hidden)
 *   div.example-body  (hidden)
 *   ...
 *
 * Clicking a tab toggles which .example-body is visible.
 * The div.example itself stays the same.
 */
export class CodeTabsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Returns visible lang-sel blocks that contain code tabs (not OS tabs).
   * Each block is a div.lang-sel locator.
   */
  async getCodeBlocks(): Promise<Locator[]> {
    const allLangSels = this.page.locator('div.lang-sel:visible');
    const count = await allLangSels.count();
    const codeBlocks: Locator[] = [];

    for (let i = 0; i < count; i++) {
      const langSel = allLangSels.nth(i);
      const text = (await langSel.textContent())?.toLowerCase() ?? '';
      const isOs = OS_KEYWORDS.some((kw) => text.includes(kw));
      if (!isOs) {
        codeBlocks.push(langSel);
      }
    }

    return codeBlocks;
  }

  /**
   * Returns visible lang-sel blocks that contain OS tabs.
   */
  async getOsBlocks(): Promise<Locator[]> {
    const allLangSels = this.page.locator('div.lang-sel:visible');
    const count = await allLangSels.count();
    const osBlocks: Locator[] = [];

    for (let i = 0; i < count; i++) {
      const langSel = allLangSels.nth(i);
      const text = (await langSel.textContent())?.toLowerCase() ?? '';
      const isOs = OS_KEYWORDS.some((kw) => text.includes(kw));
      if (isOs) {
        osBlocks.push(langSel);
      }
    }

    return osBlocks;
  }

  /**
   * Gets the active tab text from a lang-sel block.
   */
  async getActiveTabText(langSel: Locator): Promise<string> {
    const activeTab = langSel.locator('li.active span.lang-text');
    return (await activeTab.textContent()) ?? '';
  }

  /**
   * Gets the visible content from the parent .example block.
   * Navigates from div.lang-sel up to div.example via XPath,
   * then finds the currently visible .example-body.
   */
  async getVisibleContent(langSel: Locator): Promise<string> {
    const example = langSel.locator('xpath=ancestor::div[contains(@class,"example")]');
    const visibleBody = example.locator('.example-body:visible');
    return (await visibleBody.textContent()) ?? '';
  }

  /**
   * Clicks a tab by name in the given lang-sel block.
   */
  async clickTab(langSel: Locator, tabName: string, exact = false) {
    let tab: Locator;
    if (exact) {
      // Exact match for cases like "Python" vs "Python-asyncio"
      tab = langSel.locator(`li:has(span.lang-text:text-is("${tabName}"))`);
    } else {
      // Partial match for OS tabs like "Debian, Ubuntu, Mint"
      tab = langSel.locator('li').filter({ hasText: tabName });
    }
    await tab.click();
    await expect(tab).toHaveClass(/active/, { timeout: 5_000 });
  }
}
