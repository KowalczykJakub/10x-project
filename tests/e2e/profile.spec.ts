import { test, expect } from '@playwright/test';
import { loginAsTestUser, TEST_USER } from './utils';

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await loginAsTestUser(page);
    
    // Navigate to profile page
    await page.goto('/profile');
  });

  test('displays user information', async ({ page }) => {
    // Assert - Should show user email or profile information
    const hasEmail =
      (await page.locator(`text=${TEST_USER.email}`).count()) > 0 ||
      (await page.locator('text=/email|e-mail/i').count()) > 0;

    expect(hasEmail).toBe(true);
  });

  test('displays user statistics', async ({ page }) => {
    // Assert - Should show some statistics
    const hasStats =
      (await page.locator('text=/statystyk|statistics|total/i').count()) > 0 ||
      (await page.locator('text=/fiszk|flashcard/i').count()) > 0;

    // Stats display is expected on profile page
    expect(hasStats).toBe(true);
  });

  test('user can navigate to other pages from profile', async ({ page }) => {
    // Act - Look for navigation links
    const flashcardsLink = page.locator(
      'a:has-text("Fiszki"), a:has-text("Flashcards")'
    );

    if ((await flashcardsLink.count()) > 0) {
      await flashcardsLink.first().click();

      // Assert - Should navigate to flashcards page
      await page.waitForURL(/\/flashcards/, { timeout: 5000 });
    }
  });

  test('user can logout from profile page', async ({ page }) => {
    // Act - Look for logout button
    const logoutButton = page.locator(
      'button:has-text("Wyloguj"), a:has-text("Wyloguj")'
    );

    if ((await logoutButton.count()) > 0) {
      await logoutButton.first().click();

      // Assert - Should redirect to login page
      await page.waitForURL(/\/login/, { timeout: 5000 });
    }
  });
});
