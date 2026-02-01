import { describe, it, expect, beforeAll } from 'vitest';
import { setupTestUser, loginTestUser } from './setup';

const BASE_URL = 'http://localhost:3000';
let authCookie = '';

beforeAll(async () => {
  // Setup: Register and login to get auth cookie
  const testUser = await setupTestUser();
  authCookie = await loginTestUser(testUser.email, testUser.password);
});

describe('POST /api/generations', () => {
  it('should reject text under 1000 chars', async () => {
    const sourceText = 'Too short';
    const response = await fetch(`${BASE_URL}/api/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({ source_text: sourceText }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('should reject text over 10000 chars', async () => {
    const sourceText = 'A'.repeat(15000);
    const response = await fetch(`${BASE_URL}/api/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({ source_text: sourceText }),
    });

    expect(response.status).toBe(400);
  });

  it('should reject whitespace-only text', async () => {
    const sourceText = ' '.repeat(5000);
    const response = await fetch(`${BASE_URL}/api/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie,
      },
      body: JSON.stringify({ source_text: sourceText }),
    });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/generations', () => {
  it('should list generations for authenticated user', async () => {
    const response = await fetch(`${BASE_URL}/api/generations`, {
      headers: { Cookie: authCookie },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.pagination).toBeDefined();
  });

  it('should support pagination parameters', async () => {
    const response = await fetch(
      `${BASE_URL}/api/generations?page=1&limit=5`,
      {
        headers: { Cookie: authCookie },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.pagination).toBeDefined();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(5);
  });
});
