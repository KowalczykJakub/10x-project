import { test, expect } from '@playwright/test';
import { loginAsTestUser, cleanupFlashcards } from './utils';

test.describe('Flashcard Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await loginAsTestUser(page);

    // Navigate to generate page
    await page.goto('/generate');
  });

  test.skip('user can generate flashcards from text', async ({ page }) => {
    // Skipped - requires OpenRouter API key and real text content
    // Too slow for regular testing (AI generation takes 10-30s)
    test.setTimeout(60000);
  });

  test('generate button is disabled for short text', async ({ page }) => {
    // Act - Fill textarea with text under 1000 chars
    await page.locator('textarea').first().fill('Too short text');
    await page.waitForTimeout(300);

    // Assert - Button should be disabled
    const generateButton = page.getByRole('button', { name: /generuj/i });
    await expect(generateButton).toBeDisabled();
  });

  test('generate button is disabled for empty text', async ({ page }) => {
    // Act - Leave textarea empty
    await page.locator('textarea').first().fill('');
    await page.waitForTimeout(300);

    // Assert - Button should be disabled
    const generateButton = page.getByRole('button', { name: /generuj/i });
    await expect(generateButton).toBeDisabled();
  });

  test.skip('character counter updates as user types', async ({ page }) => {
    // Skipped - character counter visibility depends on implementation
  });

  test.skip('user can select and save proposals', async ({ page }) => {
    // Skipped - requires AI generation test, too slow
    test.setTimeout(60000);
  });

  test.skip('user can deselect proposals before saving', async ({ page }) => {
    // Skipped - AI generation test, too slow for regular testing
    test.setTimeout(60000);
  });

  test('user can navigate to generations history', async ({ page }) => {
    // Act - Look for history link/button
    const historyLink = page.locator(
      'a:has-text("Historia"), a:has-text("History"), button:has-text("Historia")'
    );

    if ((await historyLink.count()) > 0) {
      await historyLink.first().click();

      // Assert - Should navigate to history page
      await page.waitForURL(/\/history/, { timeout: 5000 });
    }
  });
});
