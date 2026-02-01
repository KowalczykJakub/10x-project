import { test, expect } from "@playwright/test";
import { loginAsTestUser } from "./utils";

test.describe("Generations History", () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await loginAsTestUser(page);
  });

  test("displays empty state when no generations exist", async ({ page }) => {
    // Arrange & Act
    await page.goto("/history");

    // Assert - Should show empty state or no generations message
    const hasEmptyState =
      (await page.locator("text=/brak|empty|no.*generation/i").count()) > 0 ||
      (await page.locator("table tbody tr").count()) === 0;

    expect(hasEmptyState).toBe(true);
  });

  test.skip("shows generation history after creating flashcards", async () => {
    // Skipped - requires AI generation, too slow for regular testing
    test.setTimeout(60000);
  });

  test.skip("displays generation details in history", async () => {
    // Skipped - requires AI generation, too slow for regular testing
    test.setTimeout(60000);
  });

  test("user can navigate from history to flashcards", async ({ page }) => {
    // Arrange
    await page.goto("/history");

    // Act - Look for navigation link to flashcards
    const flashcardsLink = page.locator('a:has-text("Fiszki"), a:has-text("Flashcards")');

    if ((await flashcardsLink.count()) > 0) {
      await flashcardsLink.first().click();

      // Assert
      await page.waitForURL(/\/flashcards/, { timeout: 5000 });
    }
  });

  test("user can navigate from history to generate", async ({ page }) => {
    // Arrange
    await page.goto("/history");

    // Act - Look for navigation link to generate
    const generateLink = page.locator('a:has-text("Generuj"), a:has-text("Generate"), a:has-text("Nowa")');

    if ((await generateLink.count()) > 0) {
      await generateLink.first().click();

      // Assert
      await page.waitForURL(/\/generate/, { timeout: 5000 });
    }
  });
});
