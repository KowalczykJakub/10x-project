# Plan Implementacji Testów - 10x-Cards MVP

## 1. Wprowadzenie

### Cel
Implementacja podstawowych testów zapewniających, że kluczowa funkcjonalność aplikacji działa poprawnie:
- Autentykacja (rejestracja, logowanie)
- Generowanie fiszek z AI
- CRUD fiszek (tworzenie, edycja, usuwanie)
- Sesje nauki

### Zakres
- **Testy jednostkowe**: Walidacja, utility functions, serwisy
- **Testy API**: Endpointy autentykacji, generowania, CRUD
- **Testy E2E**: Główne ścieżki użytkownika

### Cel ilościowy
**20-25 testów** pokrywających kluczową funkcjonalność MVP.

---

## 2. Testy jednostkowe (Unit Tests)

### 2.1 Narzędzia
- **Framework**: Vitest
- **Lokalizacja**: Obok plików źródłowych (`*.test.ts`)

### 2.2 Co testować

#### A) Walidacja Zod (auth.schema.ts)

**Plik**: `src/lib/schemas/auth.schema.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { 
  loginSchema, 
  registerSchema, 
  emailSchema, 
  passwordSchema 
} from './auth.schema';

describe('Auth Schema Validation', () => {
  describe('Email validation', () => {
    it('should accept valid email', () => {
      const result = emailSchema.safeParse('user@example.com');
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = emailSchema.safeParse('invalid-email');
      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const result = emailSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('Password validation (login)', () => {
    it('should accept password with 6+ chars', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'Test123!'
      });
      expect(result.success).toBe(true);
    });

    it('should reject password under 6 chars', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'short'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Password validation (registration)', () => {
    it('should accept strong password', () => {
      const result = passwordSchema.safeParse('Test123!@');
      expect(result.success).toBe(true);
    });

    it('should reject password without uppercase', () => {
      const result = passwordSchema.safeParse('test123!@');
      expect(result.success).toBe(false);
    });

    it('should reject password without digit', () => {
      const result = passwordSchema.safeParse('TestTest!@');
      expect(result.success).toBe(false);
    });

    it('should reject password without special char', () => {
      const result = passwordSchema.safeParse('Test1234');
      expect(result.success).toBe(false);
    });
  });

  describe('Register schema', () => {
    it('should accept matching passwords', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'Test123!@',
        confirmPassword: 'Test123!@'
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-matching passwords', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'Test123!@',
        confirmPassword: 'Different123!@'
      });
      expect(result.success).toBe(false);
    });
  });
});
```

**Testy do napisania**: 5 test cases ✅

---

#### B) Walidacja generowania (generation.schema.ts)

**Plik**: `src/lib/schemas/generation.schema.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { CreateGenerationSchema } from './generation.schema';

describe('Generation Schema Validation', () => {
  it('should accept text between 1000-10000 chars', () => {
    const text = 'A'.repeat(5000);
    const result = CreateGenerationSchema.safeParse({ source_text: text });
    expect(result.success).toBe(true);
  });

  it('should reject text under 1000 chars', () => {
    const text = 'Too short';
    const result = CreateGenerationSchema.safeParse({ source_text: text });
    expect(result.success).toBe(false);
  });

  it('should reject text over 10000 chars', () => {
    const text = 'A'.repeat(15000);
    const result = CreateGenerationSchema.safeParse({ source_text: text });
    expect(result.success).toBe(false);
  });

  it('should reject whitespace-only text', () => {
    const text = ' '.repeat(5000);
    const result = CreateGenerationSchema.safeParse({ source_text: text });
    expect(result.success).toBe(false);
  });
});
```

**Testy do napisania**: 4 test cases ✅

---

#### C) OpenRouter Service

**Plik**: `src/lib/services/openrouter.service.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { OpenRouterService } from './openrouter.service';

describe('OpenRouterService', () => {
  describe('Initialization', () => {
    it('should throw error with empty API key', () => {
      expect(() => new OpenRouterService('')).toThrow('API key is required');
    });

    it('should throw error with invalid base URL', () => {
      expect(() => new OpenRouterService('test-key', {
        baseUrl: 'http://insecure.com'
      })).toThrow('must use HTTPS');
    });

    it('should initialize with valid config', () => {
      expect(() => new OpenRouterService('test-key')).not.toThrow();
    });
  });

  describe('Text sanitization', () => {
    it('should trim whitespace', () => {
      const service = new OpenRouterService('test-key');
      const result = service['sanitizeSourceText']('  test  ');
      expect(result).toBe('test');
    });

    it('should remove control characters', () => {
      const service = new OpenRouterService('test-key');
      const result = service['sanitizeSourceText']('test\x00\x01text');
      expect(result).toBe('testtext');
    });
  });
});
```

**Testy do napisania**: 5 test cases ✅

---

#### D) Crypto Utils

**Plik**: `src/lib/utils/crypto.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { sha256Hash } from './crypto';

describe('SHA-256 Hashing', () => {
  it('should return same hash for same input', async () => {
    const hash1 = await sha256Hash('test input');
    const hash2 = await sha256Hash('test input');
    expect(hash1).toBe(hash2);
  });

  it('should return different hash for different inputs', async () => {
    const hash1 = await sha256Hash('input 1');
    const hash2 = await sha256Hash('input 2');
    expect(hash1).not.toBe(hash2);
  });

  it('should return hex string', async () => {
    const hash = await sha256Hash('test');
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });
});
```

**Testy do napisania**: 3 test cases ✅

---

**Podsumowanie testów jednostkowych: 17 test cases**

---

## 3. Testy API (Integration Tests)

### 3.1 Narzędzia
- **Framework**: Vitest
- **Metoda**: `fetch()` z auth headers
- **Lokalizacja**: `tests/api/`

### 3.2 Setup testowy

**Plik**: `tests/api/setup.ts`

```typescript
import { beforeAll, afterAll } from 'vitest';

let testUser = {
  email: '',
  password: 'Test123!@',
  token: ''
};

export async function setupTestUser() {
  const email = `test-${Date.now()}@example.com`;
  testUser.email = email;

  // Register
  const response = await fetch('http://localhost:4321/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: testUser.password,
      confirmPassword: testUser.password
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create test user');
  }

  return testUser;
}

export async function loginTestUser() {
  const response = await fetch('http://localhost:4321/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    })
  });

  const data = await response.json();
  // Get auth cookies or token from response
  return response.headers.get('set-cookie');
}
```

---

### 3.3 Co testować

#### A) Autentykacja

**Plik**: `tests/api/auth.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = 'http://localhost:4321';

describe('POST /api/auth/register', () => {
  it('should register new user with valid data', async () => {
    const email = `user-${Date.now()}@test.com`;
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'Test123!@',
        confirmPassword: 'Test123!@'
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBeDefined();
  });

  it('should reject registration with weak password', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'weak',
        confirmPassword: 'weak'
      })
    });

    expect(response.status).toBe(400);
  });

  it('should reject registration with mismatched passwords', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'Test123!@',
        confirmPassword: 'Different123!@'
      })
    });

    expect(response.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  const testEmail = 'login-test@test.com';
  const testPassword = 'Test123!@';

  beforeAll(async () => {
    // Create test user
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword
      })
    });
  });

  it('should login with correct credentials', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword123!@'
      })
    });

    expect(response.status).toBe(401);
  });

  it('should reject login with non-existent user', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@test.com',
        password: testPassword
      })
    });

    expect(response.status).toBe(401);
  });
});
```

**Testy do napisania**: 6 test cases ✅

---

#### B) Generowanie Fiszek

**Plik**: `tests/api/generations.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = 'http://localhost:4321';
let authCookie = '';

beforeAll(async () => {
  // Setup: Login to get auth cookie
  const email = `gen-test-${Date.now()}@test.com`;
  await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'Test123!@',
      confirmPassword: 'Test123!@'
    })
  });

  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'Test123!@'
    })
  });

  authCookie = loginResponse.headers.get('set-cookie') || '';
});

describe('POST /api/generations', () => {
  it('should generate flashcards with valid text', async () => {
    const sourceText = 'A'.repeat(1500); // 1500 characters
    const response = await fetch(`${BASE_URL}/api/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      body: JSON.stringify({ source_text: sourceText })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.generation).toBeDefined();
    expect(data.proposals).toBeDefined();
    expect(data.proposals.length).toBeGreaterThan(0);
    expect(data.proposals.length).toBeLessThanOrEqual(10);
  });

  it('should reject text under 1000 chars', async () => {
    const sourceText = 'Too short';
    const response = await fetch(`${BASE_URL}/api/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      body: JSON.stringify({ source_text: sourceText })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Validation Error');
  });

  it('should reject text over 10000 chars', async () => {
    const sourceText = 'A'.repeat(15000);
    const response = await fetch(`${BASE_URL}/api/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      body: JSON.stringify({ source_text: sourceText })
    });

    expect(response.status).toBe(400);
  });

  it('should reject unauthenticated request', async () => {
    const sourceText = 'A'.repeat(1500);
    const response = await fetch(`${BASE_URL}/api/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_text: sourceText })
    });

    expect(response.status).toBe(401);
  });
});

describe('GET /api/generations', () => {
  it('should list generations for authenticated user', async () => {
    const response = await fetch(`${BASE_URL}/api/generations`, {
      headers: { 'Cookie': authCookie }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeInstanceOf(Array);
    expect(data.pagination).toBeDefined();
    expect(data.statistics).toBeDefined();
  });

  it('should reject unauthenticated request', async () => {
    const response = await fetch(`${BASE_URL}/api/generations`);
    expect(response.status).toBe(401);
  });
});
```

**Testy do napisania**: 6 test cases ✅

---

#### C) CRUD Fiszek

**Plik**: `tests/api/flashcards.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = 'http://localhost:4321';
let authCookie = '';
let createdFlashcardId: number;

beforeAll(async () => {
  // Setup: Login
  const email = `flash-test-${Date.now()}@test.com`;
  await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'Test123!@',
      confirmPassword: 'Test123!@'
    })
  });

  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test123!@' })
  });

  authCookie = loginResponse.headers.get('set-cookie') || '';
});

describe('POST /api/flashcards', () => {
  it('should create flashcard with valid data', async () => {
    const response = await fetch(`${BASE_URL}/api/flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      body: JSON.stringify({
        front: 'Test question',
        back: 'Test answer'
      })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.front).toBe('Test question');
    expect(data.back).toBe('Test answer');
    expect(data.source).toBe('manual');
    
    createdFlashcardId = data.id;
  });

  it('should reject empty front or back', async () => {
    const response = await fetch(`${BASE_URL}/api/flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      body: JSON.stringify({
        front: '',
        back: 'Answer'
      })
    });

    expect(response.status).toBe(400);
  });

  it('should reject unauthenticated request', async () => {
    const response = await fetch(`${BASE_URL}/api/flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        front: 'Question',
        back: 'Answer'
      })
    });

    expect(response.status).toBe(401);
  });
});

describe('GET /api/flashcards', () => {
  it('should list flashcards for authenticated user', async () => {
    const response = await fetch(`${BASE_URL}/api/flashcards`, {
      headers: { 'Cookie': authCookie }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeInstanceOf(Array);
    expect(data.pagination).toBeDefined();
  });

  it('should support pagination', async () => {
    const response = await fetch(`${BASE_URL}/api/flashcards?page=1&limit=5`, {
      headers: { 'Cookie': authCookie }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(5);
  });

  it('should reject unauthenticated request', async () => {
    const response = await fetch(`${BASE_URL}/api/flashcards`);
    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/flashcards/:id', () => {
  it('should update flashcard', async () => {
    const response = await fetch(`${BASE_URL}/api/flashcards/${createdFlashcardId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      body: JSON.stringify({
        back: 'Updated answer'
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.back).toBe('Updated answer');
  });

  it('should return 404 for non-existent flashcard', async () => {
    const response = await fetch(`${BASE_URL}/api/flashcards/999999`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      body: JSON.stringify({ back: 'Test' })
    });

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/flashcards/:id', () => {
  it('should delete flashcard', async () => {
    const response = await fetch(`${BASE_URL}/api/flashcards/${createdFlashcardId}`, {
      method: 'DELETE',
      headers: { 'Cookie': authCookie }
    });

    expect(response.status).toBe(200);
  });

  it('should return 404 for already deleted flashcard', async () => {
    const response = await fetch(`${BASE_URL}/api/flashcards/${createdFlashcardId}`, {
      method: 'DELETE',
      headers: { 'Cookie': authCookie }
    });

    expect(response.status).toBe(404);
  });
});
```

**Testy do napisania**: 9 test cases ✅

---

**Podsumowanie testów API: 21 test cases**

---

## 4. Testy E2E (End-to-End)

### 4.1 Narzędzia
- **Framework**: Playwright
- **Lokalizacja**: `tests/e2e/`

### 4.2 Co testować

#### A) Autentykacja

**Plik**: `tests/e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can register and login', async ({ page }) => {
    const email = `e2e-test-${Date.now()}@example.com`;
    const password = 'Test123!@';

    // Register
    await page.goto('/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');

    // Should redirect to /generate
    await expect(page).toHaveURL('/generate');
    
    // Logout
    await page.click('text=Wyloguj');
    await expect(page).toHaveURL('/login');

    // Login again
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Should be logged in
    await expect(page).toHaveURL('/generate');
  });

  test('registration shows validation errors for weak password', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');

    // Should show validation errors
    await expect(page.locator('text=minimum 8 znaków')).toBeVisible();
  });

  test('login shows error for wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Nieprawidłowy email lub hasło')).toBeVisible();
  });
});
```

**Testy do napisania**: 3 test cases ✅

---

#### B) Generowanie Fiszek

**Plik**: `tests/e2e/generate.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Flashcard Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const email = `e2e-gen-${Date.now()}@example.com`;
    await page.goto('/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Test123!@');
    await page.fill('input[name="confirmPassword"]', 'Test123!@');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/generate');
  });

  test('user can generate flashcards from text', async ({ page }) => {
    // Fill textarea with valid text
    const sourceText = 'A'.repeat(1500);
    await page.fill('textarea', sourceText);

    // Character counter should show green
    await expect(page.locator('text=/1500/')).toBeVisible();

    // Click generate
    await page.click('button:text("Generuj fiszki")');

    // Should show loading
    await expect(page.locator('text=Generuję fiszki')).toBeVisible();

    // Should show proposals (wait up to 10 seconds)
    await expect(page.locator('.proposal').first()).toBeVisible({ timeout: 10000 });

    // Should have between 3-10 proposals
    const proposals = await page.locator('.proposal').count();
    expect(proposals).toBeGreaterThanOrEqual(3);
    expect(proposals).toBeLessThanOrEqual(10);
  });

  test('generate button is disabled for short text', async ({ page }) => {
    // Fill textarea with text under 1000 chars
    await page.fill('textarea', 'Too short');

    // Button should be disabled
    const button = page.locator('button:text("Generuj fiszki")');
    await expect(button).toBeDisabled();

    // Character counter should be red
    await expect(page.locator('text=/minimum 1000 znaków/')).toBeVisible();
  });

  test('user can select and save proposals', async ({ page }) => {
    // Generate flashcards first
    const sourceText = 'A'.repeat(1500);
    await page.fill('textarea', sourceText);
    await page.click('button:text("Generuj fiszki")');
    await expect(page.locator('.proposal').first()).toBeVisible({ timeout: 10000 });

    // Select first 3 proposals
    await page.click('.proposal >> nth=0 >> input[type="checkbox"]');
    await page.click('.proposal >> nth=1 >> input[type="checkbox"]');
    await page.click('.proposal >> nth=2 >> input[type="checkbox"]');

    // Click save button
    await page.click('button:text("Zapisz zaznaczone")');

    // Should show success message
    await expect(page.locator('text=Pomyślnie zapisano')).toBeVisible();

    // Textarea should be cleared
    await expect(page.locator('textarea')).toHaveValue('');
  });
});
```

**Testy do napisania**: 3 test cases ✅

---

#### C) Zarządzanie Fiszkami

**Plik**: `tests/e2e/flashcards.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Flashcard Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    const email = `e2e-flash-${Date.now()}@example.com`;
    await page.goto('/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Test123!@');
    await page.fill('input[name="confirmPassword"]', 'Test123!@');
    await page.click('button[type="submit"]');
  });

  test('user can manually create flashcard', async ({ page }) => {
    await page.goto('/flashcards');

    // Click add flashcard button
    await page.click('button:text("Dodaj fiszkę")');

    // Fill modal
    await page.fill('input[name="front"]', 'Test Question');
    await page.fill('textarea[name="back"]', 'Test Answer');

    // Save
    await page.click('button:text("Zapisz")');

    // Should close modal and show flashcard in list
    await expect(page.locator('text=Test Question')).toBeVisible();
    await expect(page.locator('text=Test Answer')).toBeVisible();
  });

  test('user can edit flashcard', async ({ page }) => {
    // First create a flashcard
    await page.goto('/flashcards');
    await page.click('button:text("Dodaj fiszkę")');
    await page.fill('input[name="front"]', 'Original Question');
    await page.fill('textarea[name="back"]', 'Original Answer');
    await page.click('button:text("Zapisz")');

    // Click edit button
    await page.click('button[aria-label="Edytuj"]');

    // Update back field
    await page.fill('textarea[name="back"]', 'Updated Answer');
    await page.click('button:text("Zapisz")');

    // Should show updated text
    await expect(page.locator('text=Updated Answer')).toBeVisible();
  });

  test('user can delete flashcard with confirmation', async ({ page }) => {
    // First create a flashcard
    await page.goto('/flashcards');
    await page.click('button:text("Dodaj fiszkę")');
    await page.fill('input[name="front"]', 'To Delete');
    await page.fill('textarea[name="back"]', 'Will be deleted');
    await page.click('button:text("Zapisz")');

    // Click delete button
    await page.click('button[aria-label="Usuń"]');

    // Should show confirmation dialog
    await expect(page.locator('text=Czy na pewno chcesz usunąć')).toBeVisible();

    // Confirm deletion
    await page.click('button:text("Usuń")');

    // Flashcard should disappear
    await expect(page.locator('text=To Delete')).not.toBeVisible();
  });

  test('user can filter flashcards by source', async ({ page }) => {
    await page.goto('/flashcards');

    // Select filter
    await page.click('select[name="source"]');
    await page.selectOption('select[name="source"]', 'manual');

    // URL should update
    await expect(page).toHaveURL(/source=manual/);
  });

  test('user can search flashcards', async ({ page }) => {
    // Create flashcard first
    await page.goto('/flashcards');
    await page.click('button:text("Dodaj fiszkę")');
    await page.fill('input[name="front"]', 'Searchable Question');
    await page.fill('textarea[name="back"]', 'Findable Answer');
    await page.click('button:text("Zapisz")');

    // Search
    await page.fill('input[placeholder*="Szukaj"]', 'Searchable');

    // Should show matching flashcard
    await expect(page.locator('text=Searchable Question')).toBeVisible();
  });
});
```

**Testy do napisania**: 5 test cases ✅

---

#### D) Sesja Nauki

**Plik**: `tests/e2e/study.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Study Session', () => {
  test.beforeEach(async ({ page }) => {
    // Login and create some flashcards
    const email = `e2e-study-${Date.now()}@example.com`;
    await page.goto('/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Test123!@');
    await page.fill('input[name="confirmPassword"]', 'Test123!@');
    await page.click('button[type="submit"]');

    // Create 3 flashcards
    await page.goto('/flashcards');
    for (let i = 1; i <= 3; i++) {
      await page.click('button:text("Dodaj fiszkę")');
      await page.fill('input[name="front"]', `Question ${i}`);
      await page.fill('textarea[name="back"]', `Answer ${i}`);
      await page.click('button:text("Zapisz")');
      await page.waitForTimeout(500);
    }
  });

  test('user can complete study session', async ({ page }) => {
    await page.goto('/study');

    // Should show progress
    await expect(page.locator('text=/Fiszka 1 z 3/')).toBeVisible();

    // Should show flashcard front
    await expect(page.locator('.flashcard')).toBeVisible();

    // Click to reveal back
    await page.click('.flashcard');

    // Should show back and rating buttons
    await expect(page.locator('button:text("Hard")')).toBeVisible();
    await expect(page.locator('button:text("Medium")')).toBeVisible();
    await expect(page.locator('button:text("Easy")')).toBeVisible();

    // Rate it
    await page.click('button:text("Medium")');

    // Should move to next flashcard
    await expect(page.locator('text=/Fiszka 2 z 3/')).toBeVisible();

    // Complete remaining flashcards
    await page.click('.flashcard');
    await page.click('button:text("Easy")');
    
    await page.click('.flashcard');
    await page.click('button:text("Hard")');

    // Should show completion screen
    await expect(page.locator('text=Sesja ukończona')).toBeVisible();
    await expect(page.locator('text=3')).toBeVisible(); // 3 flashcards reviewed
  });

  test('shows empty state when no flashcards', async ({ page }) => {
    // Login as new user without flashcards
    const email = `e2e-empty-${Date.now()}@example.com`;
    await page.goto('/register');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Test123!@');
    await page.fill('input[name="confirmPassword"]', 'Test123!@');
    await page.click('button[type="submit"]');

    await page.goto('/study');

    // Should show empty state
    await expect(page.locator('text=Brak fiszek do nauki')).toBeVisible();
    await expect(page.locator('button:text("Wygeneruj fiszki")')).toBeVisible();
  });

  test('user can exit study session', async ({ page }) => {
    await page.goto('/study');

    // Click exit button
    await page.click('button:text("Wyjdź")');

    // Should show confirmation (if implemented)
    // Or should navigate away
    await expect(page).not.toHaveURL('/study');
  });
});
```

**Testy do napisania**: 3 test cases ✅

---

**Podsumowanie testów E2E: 14 test cases**

---

## 5. Setup i konfiguracja

### 5.1 Instalacja zależności

```bash
# Vitest dla testów jednostkowych i API
npm install -D vitest @vitest/coverage-v8

# Playwright dla testów E2E
npm install -D @playwright/test

# Testing Library dla komponentów (opcjonalnie)
npm install -D @testing-library/react @testing-library/user-event
```

### 5.2 Konfiguracja Vitest

**Plik**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.d.ts',
        'src/db/database.types.ts'
      ]
    }
  }
});
```

### 5.3 Konfiguracja Playwright

**Plik**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run tests in sequence for MVP
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### 5.4 package.json scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:api": "vitest run tests/api",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "npm run test:unit && npm run test:e2e"
  }
}
```

---

## 6. Struktura plików

```
10x-project/
├── src/
│   ├── lib/
│   │   ├── schemas/
│   │   │   ├── auth.schema.ts
│   │   │   ├── auth.schema.test.ts          ← Unit tests
│   │   │   ├── generation.schema.ts
│   │   │   └── generation.schema.test.ts    ← Unit tests
│   │   ├── services/
│   │   │   ├── openrouter.service.ts
│   │   │   └── openrouter.service.test.ts   ← Unit tests
│   │   └── utils/
│   │       ├── crypto.ts
│   │       └── crypto.test.ts               ← Unit tests
│   └── ...
├── tests/
│   ├── api/
│   │   ├── setup.ts
│   │   ├── auth.test.ts                     ← API tests
│   │   ├── generations.test.ts              ← API tests
│   │   └── flashcards.test.ts               ← API tests
│   └── e2e/
│       ├── auth.spec.ts                     ← E2E tests
│       ├── generate.spec.ts                 ← E2E tests
│       ├── flashcards.spec.ts               ← E2E tests
│       └── study.spec.ts                    ← E2E tests
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

---

## 7. Uruchamianie testów

### Development workflow

```bash
# 1. Start dev server (terminal 1)
npm run dev

# 2. Run unit tests in watch mode (terminal 2)
npm test

# 3. Run specific API test
npm run test:api -- auth.test.ts

# 4. Run E2E tests with UI
npm run test:e2e:ui

# 5. Run E2E tests in headed mode (see browser)
npm run test:e2e:headed
```

### Before commit

```bash
# Run all unit tests
npm run test:unit

# Check coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### CI/CD

```bash
# Run everything
npm run test:all
```

---

## 8. Checklist przed zaliczeniem

### Must-have (Funkcjonalność działa)
- [ ] Użytkownik może się zarejestrować
- [ ] Użytkownik może się zalogować
- [ ] Użytkownik może wylogować się
- [ ] Użytkownik może wygenerować fiszki z AI (1000-10000 znaków)
- [ ] Użytkownik może zapisać wygenerowane fiszki
- [ ] Użytkownik może dodać fiszkę ręcznie
- [ ] Użytkownik może edytować fiszkę
- [ ] Użytkownik może usunąć fiszkę
- [ ] Użytkownik może odbyć sesję nauki
- [ ] Dane użytkowników są odizolowane (RLS)

### Testy napisane
- [ ] 17 testów jednostkowych (schemas, services, utils)
- [ ] 21 testów API (auth, generations, flashcards)
- [ ] 14 testów E2E (główne ścieżki użytkownika)
- [ ] **Łącznie: ~52 testy** pokrywające kluczową funkcjonalność

### Testy przechodzą
- [ ] Wszystkie testy jednostkowe są zielone
- [ ] Wszystkie testy API są zielone
- [ ] Wszystkie testy E2E są zielone
- [ ] Brak błędów w konsoli przy testach E2E

---

## 9. Szybki start

### Dzień 1: Testy jednostkowe (2-3h)
1. Zainstaluj Vitest: `npm install -D vitest`
2. Stwórz `vitest.config.ts`
3. Napisz testy dla `auth.schema.test.ts`
4. Napisz testy dla `generation.schema.test.ts`
5. Napisz testy dla `crypto.test.ts`
6. Uruchom: `npm test`

### Dzień 2: Testy API (3-4h)
1. Stwórz folder `tests/api/`
2. Napisz `auth.test.ts`
3. Napisz `generations.test.ts`
4. Napisz `flashcards.test.ts`
5. Uruchom: `npm run test:api`

### Dzień 3: Testy E2E (3-4h)
1. Zainstaluj Playwright: `npx playwright install`
2. Stwórz `playwright.config.ts`
3. Napisz `auth.spec.ts`
4. Napisz `generate.spec.ts`
5. Napisz `flashcards.spec.ts`
6. Napisz `study.spec.ts`
7. Uruchom: `npm run test:e2e:ui`

### Dzień 4: Poprawki i dokumentacja (1-2h)
1. Fix failing tests
2. Sprawdź coverage: `npm run test:coverage`
3. Uzupełnij brakujące testy
4. Dokumentuj wyniki

---

## 10. Troubleshooting

### Problem: Testy API nie działają
```bash
# Sprawdź czy dev server działa
curl http://localhost:4321/api/flashcards

# Sprawdź czy Supabase jest uruchomiony
supabase status
```

### Problem: Testy E2E timeout
```typescript
// Zwiększ timeout w playwright.config.ts
use: {
  timeout: 30000, // 30 seconds
}
```

### Problem: Testy E2E nie znajdują elementów
```typescript
// Użyj bardziej specyficznych selektorów
await page.locator('button[type="submit"]:text("Zaloguj")').click();

// Dodaj waitFor
await page.waitForSelector('.flashcard', { timeout: 10000 });
```

### Problem: OpenRouter API w testach
```typescript
// Mockuj OpenRouter API w testach jednostkowych
vi.mock('./openrouter.service', () => ({
  OpenRouterService: vi.fn().mockImplementation(() => ({
    generateFlashcards: vi.fn().mockResolvedValue([
      { front: 'Q1', back: 'A1' },
      { front: 'Q2', back: 'A2' },
    ])
  }))
}));
```

---

## 11. Podsumowanie

**Cel**: 52 testy pokrywające kluczową funkcjonalność MVP

**Breakdown**:
- ✅ 17 testów jednostkowych (walidacja, serwisy, utils)
- ✅ 21 testów API (auth, generations, flashcards CRUD)
- ✅ 14 testów E2E (główne ścieżki użytkownika)

**Czas realizacji**: 3-4 dni robocze

**Rezultat**: Pewność, że aplikacja działa + materiał na zaliczenie kursu 🎯
