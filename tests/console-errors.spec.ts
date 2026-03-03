import { test, expect } from '@playwright/test';

test.describe('Console Errors', () => {
  test('main page should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Listen for console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page error: ${error.message}`);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that no console errors occurred
    expect(consoleErrors).toHaveLength(0);
  });

  test('Quick start guide page should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Listen for console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page error: ${error.message}`);
    });

    await page.goto('/Quick_start_guide');
    await page.waitForLoadState('networkidle');

    // Check that no console errors occurred
    expect(consoleErrors).toHaveLength(0);
  });

  test('Installation page should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Listen for console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page error: ${error.message}`);
    });

    await page.goto('/Installation');
    await page.waitForLoadState('networkidle');

    // Check that no console errors occurred
    expect(consoleErrors).toHaveLength(0);
  });
});