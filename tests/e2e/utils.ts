import { Page } from "@playwright/test";

// Test user credentials
export const TEST_USER = {
  id: "426b7f98-5042-468c-ba13-41b2580fcc50",
  email: "test-user@gmail.com",
  password: "Test1234",
};

/**
 * Login helper that uses the existing test user
 */
export async function loginAsTestUser(page: Page) {
  await page.goto("/login", { waitUntil: "networkidle" });

  // Wait for React hydration - wait for button to be enabled
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.waitFor({ state: "visible" });
  await page.waitForTimeout(500); // Additional buffer for hydration

  // Use fallback selectors if data-testid not available
  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');

  await emailInput.fill(TEST_USER.email);
  await passwordInput.fill(TEST_USER.password);
  await submitButton.click();

  // Wait for successful login and redirect
  await page.waitForURL(/\/(generate|flashcards|profile)/, {
    timeout: 10000,
  });
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  const logoutButton = page.locator('button:has-text("Wyloguj"), a:has-text("Wyloguj")');
  if ((await logoutButton.count()) > 0) {
    await logoutButton.first().click();
    await page.waitForURL(/\/login/, { timeout: 5000 });
  }
}

/**
 * Wait for element to be visible
 */
export async function waitForElement(page: Page, testId: string, timeout = 5000) {
  await page.waitForSelector(`[data-testid="${testId}"]`, { timeout });
}

/**
 * Create a flashcard helper
 */
export async function createFlashcard(page: Page, front: string, back: string) {
  const addButton = page.locator('button:has-text("Dodaj"), button:has-text("Add"), button:has-text("Nowa")').first();

  await addButton.click();
  await page.fill('input[name="front"]', front);
  await page.fill('textarea[name="back"], input[name="back"]', back);

  const saveButton = page.locator('button:has-text("Zapisz"), button:has-text("Save")');
  await saveButton.click();

  // Wait for save to complete
  await page.waitForTimeout(500);
}

/**
 * Clean up flashcards for test user
 * Note: This is a best-effort cleanup. If it fails, tests should still be isolated.
 */
export async function cleanupFlashcards(page: Page) {
  try {
    await page.goto("/flashcards", { timeout: 5000 });

    // Try to delete flashcards (fallback selectors)
    const deleteButtons = page.locator(
      'button[aria-label*="Delete"], button[aria-label*="Usuń"], button:has-text("Delete"), button:has-text("Usuń")'
    );

    const count = await deleteButtons.count();

    // Limit cleanup to avoid long waits
    const maxToDelete = Math.min(count, 10);

    for (let i = 0; i < maxToDelete; i++) {
      const deleteButton = deleteButtons.first();
      if ((await deleteButton.count()) === 0) break;

      await deleteButton.click();

      // Confirm deletion (try different selectors)
      const confirmButton = page
        .locator('button:has-text("Usuń"), button:has-text("Delete"), button:has-text("Confirm")')
        .last();

      if ((await confirmButton.count()) > 0) {
        await confirmButton.click();
        await page.waitForTimeout(300);
      }
    }
  } catch (error) {
    // Ignore cleanup errors - tests should handle their own state
    // eslint-disable-next-line no-console
    console.log("Cleanup warning:", error);
  }
}
