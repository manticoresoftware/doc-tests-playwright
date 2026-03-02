import { test, expect } from '@playwright/test';
import { ManualPage } from '../pages/manual.page';

test.describe('Language Switcher', () => {
  let manual: ManualPage;

  test.beforeEach(async ({ page }) => {
    manual = new ManualPage(page);
    await manual.goto('/');
  });

  test('switch to Russian', async ({ page }) => {
    await manual.setLanguage('ru');

    await expect(page).toHaveURL(/\/ru\//);
    const heading = await manual.getHeadingText();
    expect(heading).toMatch(/[а-яА-ЯёЁ]/);
  });

  test('switch to Chinese', async ({ page }) => {
    await manual.setLanguage('zh');

    await expect(page).toHaveURL(/\/zh\//);
  });

  test('switch back to English', async ({ page }) => {
    // First switch to Russian
    await manual.setLanguage('ru');
    await expect(page).toHaveURL(/\/ru\//);

    // Then switch back to English (value is empty string)
    await manual.setLanguage('');
    await expect(page).not.toHaveURL(/\/ru\//);

    const heading = await manual.getHeadingText();
    expect(heading).toMatch(/[a-zA-Z]/);
  });

  test('language persists across navigation', async ({ page }) => {
    await manual.setLanguage('ru');
    await expect(page).toHaveURL(/\/ru\//);

    // Navigate via sidebar link instead of direct goto
    // (direct goto doesn't preserve language in URL)
    await page.locator('a', { hasText: /Руководство по быстрому старту|Quick start guide/i }).first().click();
    await page.waitForLoadState('networkidle');

    // Language selector should still show Russian
    const currentLang = await manual.getLanguage();
    expect(currentLang).toBe('ru');
  });
});
