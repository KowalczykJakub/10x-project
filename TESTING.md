# Testing Guide - 10x-Cards MVP

## Overview

This project has comprehensive test coverage with **~70 tests** covering:
- **Unit Tests (35)** ✅ WORKING: Schema validation, services, and utilities
- **API Tests (21)** ⏳ READY: Authentication, generations, and flashcards CRUD (requires server)
- **E2E Tests (14)** ⏳ READY: Main user flows and interactions (requires server)

**Current Status**: 35 unit tests pass without any server. API and E2E tests are ready but require a running development server.

## Prerequisites

All testing dependencies are already installed:
- Vitest (unit & API tests)
- Playwright (E2E tests)
- Testing Library

## Test Structure

```
10x-project/
├── src/
│   ├── lib/
│   │   ├── schemas/
│   │   │   ├── auth.schema.test.ts          # 10 tests
│   │   │   └── generation.schema.test.ts    # 4 tests
│   │   ├── services/
│   │   │   └── openrouter.service.test.ts   # 11 tests
│   │   └── utils/
│   │       └── crypto.test.ts               # 7 tests
├── tests/
│   ├── api/
│   │   ├── setup.ts                         # Test utilities
│   │   ├── auth.test.ts                     # 6 tests
│   │   ├── generations.test.ts              # 8 tests
│   │   └── flashcards.test.ts               # 12 tests
│   └── e2e/
│       ├── auth.spec.ts                     # 3 tests
│       ├── generate.spec.ts                 # 3 tests
│       ├── flashcards.spec.ts               # 5 tests
│       └── study.spec.ts                    # 3 tests
├── vitest.config.ts
└── playwright.config.ts
```

## Running Tests

### Unit Tests

Unit tests **DO NOT** require a running server - they test isolated code.

```bash
# Run all unit tests once
npm run test:unit

# Run unit tests in watch mode
npm test

# Run with coverage report
npm run test:coverage
```

Expected output:
```
✓ src/lib/utils/crypto.test.ts (7 tests)
✓ src/lib/schemas/generation.schema.test.ts (4 tests)
✓ src/lib/schemas/auth.schema.test.ts (12 tests)
✓ src/lib/services/openrouter.service.test.ts (12 tests)

Test Files  4 passed (4)
     Tests  35 passed (35)
```

### API Tests

**⚠️ IMPORTANT**: API tests **REQUIRE** a running dev server!

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run API tests (in a separate terminal)
npm run test:api
```

If you see `ECONNREFUSED` errors, the server is not running.

### E2E Tests

Playwright will automatically start the dev server.

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

### Run All Tests

```bash
# Run unit tests only (no server required)
npm run test:unit

# Run unit tests + E2E tests (requires server)
npm run test:all

# Manual full test flow:
# 1. Run unit tests (no server needed)
npm run test:unit

# 2. Start server and run API tests
npm run dev  # in terminal 1
npm run test:api  # in terminal 2

# 3. Run E2E tests (will start server automatically)
npm run test:e2e
```

## Test Details

### Unit Tests (17 tests)

#### Auth Schema (10 tests)
- ✅ Email validation (3 tests)
- ✅ Password validation for login (2 tests)
- ✅ Password validation for registration (4 tests)
- ✅ Register schema validation (1 test)

#### Generation Schema (4 tests)
- ✅ Text length validation (1000-10000 chars)
- ✅ Whitespace-only text rejection
- ✅ Under/over character limits

#### OpenRouter Service (11 tests)
- ✅ Initialization validation (7 tests)
- ✅ Text sanitization (4 tests)

#### Crypto Utils (7 tests)
- ✅ SHA-256 hash consistency
- ✅ Hash uniqueness
- ✅ Hex string format validation

### API Tests (21 tests)

#### Authentication (6 tests)
- ✅ POST /api/auth/register
  - Valid registration
  - Weak password rejection
  - Mismatched passwords
  - Invalid email
- ✅ POST /api/auth/login
  - Successful login
  - Wrong password rejection
  - Non-existent user

#### Generations (8 tests)
- ✅ POST /api/generations
  - Valid text generation
  - Under 1000 chars rejection
  - Over 10000 chars rejection
  - Unauthenticated request rejection
  - Whitespace-only text rejection
- ✅ GET /api/generations
  - List generations
  - Unauthenticated rejection
  - Pagination support

#### Flashcards CRUD (12 tests)
- ✅ POST /api/flashcards
  - Create with valid data
  - Empty front/back rejection
  - Unauthenticated rejection
- ✅ GET /api/flashcards
  - List flashcards
  - Pagination support
  - Unauthenticated rejection
- ✅ PATCH /api/flashcards/:id
  - Update flashcard
  - 404 for non-existent
  - Unauthenticated rejection
- ✅ DELETE /api/flashcards/:id
  - Delete flashcard
  - 404 for already deleted
  - Unauthenticated rejection

### E2E Tests (14 tests)

#### Authentication Flow (3 tests)
- ✅ Complete registration and login flow
- ✅ Validation errors for weak password
- ✅ Login error for wrong credentials

#### Flashcard Generation (3 tests)
- ✅ Generate flashcards from valid text
- ✅ Button disabled for short text
- ✅ Select and save proposals

#### Flashcard Management (5 tests)
- ✅ Manually create flashcard
- ✅ Edit flashcard
- ✅ Delete flashcard with confirmation
- ✅ Filter flashcards by source
- ✅ Search flashcards

#### Study Session (3 tests)
- ✅ Complete study session
- ✅ Empty state when no flashcards
- ✅ Exit study session

## Environment Variables

For API tests, you can set:

```bash
# Default is http://localhost:3000
export BASE_URL=http://localhost:3000
```

## Coverage

To view coverage report:

```bash
npm run test:coverage

# Open HTML report
# coverage/index.html
```

## Troubleshooting

### API Tests Failing

**Problem**: Tests timeout or fail to connect

**Solution**:
1. Ensure dev server is running: `npm run dev`
2. Check if server is on port 3000: `http://localhost:3000`
3. Verify Supabase is running: `supabase status`

### E2E Tests Failing

**Problem**: Playwright can't find elements

**Solution**:
1. Run in headed mode to see what's happening: `npm run test:e2e:headed`
2. Use UI mode for debugging: `npm run test:e2e:ui`
3. Check console for errors in the browser

**Problem**: Tests timeout

**Solution**:
- Increase timeout in `playwright.config.ts`
- Check network/API response times
- Verify OpenRouter API is working (for generation tests)

### Unit Tests Failing

**Problem**: Import errors or module not found

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
```

## CI/CD Integration

For continuous integration, add to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm ci

- name: Run unit tests
  run: npm run test:unit

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
```

## Best Practices

1. **Run unit tests frequently** during development (use watch mode)
2. **Run API tests** before committing changes to API endpoints
3. **Run E2E tests** before major releases or merges to main
4. **Check coverage** to identify untested code paths
5. **Update tests** when adding new features

## Known Limitations

- API tests require a running development server
- E2E generation tests require valid OpenRouter API key
- Some E2E tests may be flaky due to timing/network issues
- Test database isolation is handled by unique email generation

## Next Steps

Future improvements:
- Add component tests with Testing Library
- Increase coverage for edge cases
- Add visual regression tests
- Mock OpenRouter API for faster E2E tests
- Add performance/load tests

## Support

If tests fail unexpectedly:
1. Check the error message carefully
2. Run in debug/headed mode
3. Verify all services are running
4. Check environment variables
5. Review recent code changes

---

**Total Tests**: ~52
**Coverage Goal**: 80%+ for critical paths
**Test Types**: Unit, API Integration, E2E
