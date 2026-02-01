import { test, expect } from "@playwright/test";
import { TEST_USER, loginAsTestUser, logout } from "./utils";

test.describe("Authentication Flow", () => {
  test("user can login with valid credentials", async ({ page }) => {
    // Arrange
    await page.goto("/login", { waitUntil: "networkidle" });

    // Wait for React hydration
    await page.locator('button[type="submit"]').waitFor({ state: "visible" });
    await page.waitForTimeout(500);

    // Act
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Assert - Should redirect to /generate or be logged in
    await page.waitForURL(/\/(generate|flashcards|profile)/, {
      timeout: 10000,
    });

    // Verify we're logged in by checking for logout button or user menu
    const loggedIn =
      (await page.locator("text=/wyloguj/i").count()) > 0 || (await page.locator("text=/profil/i").count()) > 0;
    expect(loggedIn).toBe(true);
  });

  test("user can logout successfully", async ({ page }) => {
    // Arrange - Login first
    await loginAsTestUser(page);

    // Act - Logout
    const logoutButton = page.locator('button:has-text("Wyloguj"), a:has-text("Wyloguj")');
    await logoutButton.first().click();

    // Assert - Should redirect to login page
    await page.waitForURL(/\/login/, { timeout: 5000 });
  });

  test("user can logout and login again", async ({ page }) => {
    // Arrange - Login first
    await loginAsTestUser(page);

    // Act - Logout
    await logout(page);

    // Act - Login again
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.locator('button[type="submit"]').waitFor({ state: "visible" });
    await page.waitForTimeout(500);

    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Assert - Should be logged in again
    await page.waitForURL(/\/(generate|flashcards|profile)/, {
      timeout: 10000,
    });
  });

  test("registration shows validation errors for weak password", async ({ page }) => {
    // Arrange
    await page.goto("/register", { waitUntil: "networkidle" });
    await page.locator('button[type="submit"]').waitFor({ state: "visible" });
    await page.waitForTimeout(500);

    // Act
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "weak");
    await page.fill('input[name="confirmPassword"]', "weak");
    await page.click('button[type="submit"]');

    // Assert - Should show validation errors
    const hasValidationError =
      (await page.locator("text=/minimum|musi|zawiera|znaki|znak/i").count()) > 0 ||
      (await page.locator('.error, [role="alert"]').count()) > 0;

    expect(hasValidationError).toBe(true);
  });

  test("registration shows error for mismatched passwords", async ({ page }) => {
    // Arrange
    await page.goto("/register", { waitUntil: "networkidle" });
    await page.locator('button[type="submit"]').waitFor({ state: "visible" });
    await page.waitForTimeout(500);

    // Act
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "ValidPassword123!");
    await page.fill('input[name="confirmPassword"]', "DifferentPassword123!");
    await page.click('button[type="submit"]');

    // Assert - Should show validation error
    await page.waitForTimeout(500);
    const hasValidationError =
      (await page.locator("text=/nie.*identyczne|nie.*pasuj|match/i").count()) > 0 ||
      (await page.locator('.error, [role="alert"]').count()) > 0;

    expect(hasValidationError).toBe(true);
  });

  test("login shows error for wrong credentials", async ({ page }) => {
    // Arrange
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.locator('button[type="submit"]').waitFor({ state: "visible" });
    await page.waitForTimeout(500);

    // Act
    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "WrongPassword123!");
    await page.click('button[type="submit"]');

    // Assert - Should show error message
    await page.waitForTimeout(1000);
    const hasError = (await page.locator('[role="alert"]').count()) > 0;

    expect(hasError).toBe(true);
  });

  test("login shows error for invalid email format", async ({ page }) => {
    // Arrange
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.locator('button[type="submit"]').waitFor({ state: "visible" });
    await page.waitForTimeout(500);

    // Act
    await page.fill('input[name="email"]', "invalid-email");
    await page.fill('input[name="password"]', "SomePassword123");
    await page.click('button[type="submit"]');

    // Assert - Should show validation error
    await page.waitForTimeout(500);
    const hasValidationError =
      (await page.locator("text=/email|prawidłowy/i").count()) > 0 ||
      (await page.locator('[role="alert"]').count()) > 0;

    expect(hasValidationError).toBe(true);
  });

  test("protected routes redirect to login when not authenticated", async ({ page }) => {
    // Act - Try to access protected route without authentication
    await page.goto("/flashcards");

    // Assert - Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 });
  });

  test("authenticated user cannot access login page (redirects)", async ({ page }) => {
    // Arrange - Login first
    await loginAsTestUser(page);

    // Act - Try to access login page
    await page.goto("/login");

    // Assert - Should redirect away from login
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain("/login");
  });
});
