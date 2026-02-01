# Testing Guide

This directory contains all tests for the 10x Flashcards application.

## Test Structure

```
tests/
├── api/              # API integration tests (Vitest)
│   ├── auth.test.ts
│   ├── flashcards.test.ts
│   ├── generations.test.ts
│   └── setup.ts
├── e2e/              # End-to-end tests (Playwright)
│   ├── auth.spec.ts
│   ├── flashcards.spec.ts
│   ├── generate.spec.ts
│   ├── history.spec.ts
│   ├── navigation.spec.ts
│   ├── profile.spec.ts
│   ├── study.spec.ts
│   └── utils.ts
└── README.md
```

## Test User Credentials

The e2e tests use a pre-configured test user in Supabase:

- **User ID**: `426b7f98-5042-468c-ba13-41b2580fcc50`
- **Email**: `test-user@gmail.com`
- **Password**: `Test1234`

⚠️ **Important**: This user must exist in your Supabase database for the tests to work.

## Running Tests

### Unit & Integration Tests

```bash
# Run unit tests
npm run test:unit

# Run API tests
npm run test:api

# Run all tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run specific test by name
npx playwright test -g "user can login"
```

## Test Files Overview

### API Tests (`tests/api/`)

- **auth.test.ts**: Tests authentication endpoints (register, login, logout)
- **flashcards.test.ts**: Tests flashcard CRUD operations via API
- **generations.test.ts**: Tests flashcard generation endpoints
- **setup.ts**: Shared test setup and utilities

### E2E Tests (`tests/e2e/`)

- **auth.spec.ts**: Authentication flow tests
  - Login with valid/invalid credentials
  - Registration validation
  - Logout functionality
  - Protected route redirects

- **flashcards.spec.ts**: Flashcard management tests
  - Create flashcards manually
  - Edit flashcard content
  - Delete flashcards with confirmation
  - Filter and search flashcards
  - View statistics

- **generate.spec.ts**: Flashcard generation tests
  - Generate flashcards from text
  - Character counter validation
  - Select and save proposals
  - Input validation

- **study.spec.ts**: Study session tests
  - Complete study sessions
  - Flashcard flipping
  - Rating buttons (Easy, Medium, Hard)
  - Progress indicator
  - Empty state handling

- **profile.spec.ts**: Profile page tests
  - Display user information
  - View user statistics
  - Navigation from profile

- **history.spec.ts**: Generation history tests
  - View past generations
  - Display generation details
  - Empty state handling

- **navigation.spec.ts**: Application navigation tests
  - Sidebar navigation
  - Protected route access
  - Browser navigation (back/forward)
  - Authentication state persistence

## Test Utilities

The `tests/e2e/utils.ts` file provides helper functions:

```typescript
// Login as test user
await loginAsTestUser(page);

// Logout
await logout(page);

// Clean up flashcards
await cleanupFlashcards(page);

// Create a flashcard
await createFlashcard(page, 'Front text', 'Back text');

// Wait for element by test ID
await waitForElement(page, 'my-element');
```

## Writing New Tests

### Follow AAA Pattern

Structure tests using the Arrange-Act-Assert pattern:

```typescript
test('descriptive test name', async ({ page }) => {
  // Arrange - Set up test conditions
  await loginAsTestUser(page);
  await page.goto('/flashcards');

  // Act - Perform actions
  await page.click('button:has-text("Add")');
  await page.fill('input[name="front"]', 'Question');

  // Assert - Verify results
  expect(await page.locator('text=Question').count()).toBeGreaterThan(0);
});
```

### Use Test Hooks

Use `beforeEach` and `afterEach` for setup and cleanup:

```typescript
test.describe('Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await cleanupFlashcards(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupFlashcards(page);
  });

  test('test case', async ({ page }) => {
    // Test implementation
  });
});
```

### Use Data-TestId Selectors

Prefer `data-testid` attributes for stable selectors:

```typescript
// Good
await page.getByTestId('login-button').click();

// Fallback for existing code
await page.locator('button:has-text("Login")').click();
```

## Debugging Tests

### Visual Debugging

```bash
# Run with UI mode
npm run test:e2e:ui

# Run in headed mode
npm run test:e2e:headed

# Run with debug mode
npx playwright test --debug
```

### Generate Test Code

Use Playwright's codegen to record test actions:

```bash
npx playwright codegen http://localhost:3000
```

### View Test Traces

When a test fails, view the trace:

```bash
npx playwright show-trace trace.zip
```

### Take Screenshots

Add screenshots to tests for debugging:

```typescript
await page.screenshot({ path: 'screenshot.png' });
```

## Test Configuration

### Playwright Config (`playwright.config.ts`)

- Tests run sequentially (`fullyParallel: false`)
- Base URL: `http://localhost:3000`
- Automatic dev server startup
- Screenshots on failure
- Trace on first retry

### Vitest Config

- Unit tests: `vitest.config.ts`
- API tests: `vitest.api.config.ts`

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Manual workflow dispatch

Configure CI environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY`

## Troubleshooting

### Tests Fail with "User not found"

Ensure the test user exists in your Supabase database with the correct credentials.

### Tests Timeout

Increase timeout in `playwright.config.ts` or individual tests:

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // Test implementation
});
```

### Flaky Tests

- Add explicit waits: `await page.waitForSelector()`
- Use `page.waitForLoadState('networkidle')`
- Increase timeout for specific actions
- Check for race conditions

### Database State Issues

Ensure proper cleanup:
- Use `beforeEach` and `afterEach` hooks
- Call `cleanupFlashcards(page)` to reset state
- Avoid test interdependencies

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clean Up**: Always clean up test data
3. **Use Helpers**: Leverage utility functions in `utils.ts`
4. **Descriptive Names**: Use clear, descriptive test names
5. **One Assertion Focus**: Each test should verify one behavior
6. **Avoid Hardcoded Waits**: Use `waitFor*` methods instead of `waitForTimeout`
7. **Handle Edge Cases**: Test both happy paths and error conditions
8. **Keep Tests Fast**: Mock slow operations when possible

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Supabase Testing Guide](https://supabase.com/docs/guides/getting-started/testing)
