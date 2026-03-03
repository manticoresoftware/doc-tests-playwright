import { type Locator, type Page, expect } from '@playwright/test';

export class ManualPage {
  readonly page: Page;
  readonly languageSelector: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.languageSelector = page.locator('#language-select');
    this.heading = page.locator('h1').first();
  }

  async goto(path = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async setLanguage(value: string) {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle' }),
      this.languageSelector.selectOption(value),
    ]);
  }

  async getLanguage(): Promise<string> {
    return await this.languageSelector.inputValue();
  }

  async getHeadingText(): Promise<string> {
    return (await this.heading.textContent()) ?? '';
  }

  async getCookie(name: string): Promise<string | undefined> {
    const cookies = await this.page.context().cookies();
    return cookies.find((c) => c.name === name)?.value;
  }
}
