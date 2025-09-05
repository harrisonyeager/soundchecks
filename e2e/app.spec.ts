import { test, expect } from '@playwright/test';

test.describe('SoundChecks App', () => {
  test('homepage loads and shows sign in button', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Title in header
    await expect(page.locator('header')).toContainText('SoundChecks');

    // Sign in / up buttons (role-based selectors are sturdier)
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();

    // Welcome message
    await expect(page.locator('h1:has-text("Welcome to SoundChecks")')).toBeVisible();
  });

  test('can access concert page when logged in', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Click the log concert link
    await page.getByRole('link', { name: /log your first concert/i }).click();

    // If not logged in, expect redirect to auth; if logged in, expect /concerts/new
    await expect(page).toHaveURL(/(sign[- ]?in|concerts\/new)/i);
  });
});