/**
 * Test setup utilities for API tests
 */

// Note: API tests require the dev server to be running on port 3000
const BASE_URL = "http://localhost:3000";

export interface TestUser {
  email: string;
  password: string;
  cookies?: string;
}

/**
 * Create a new test user with registration
 */
export async function setupTestUser(): Promise<TestUser> {
  // Add random string to ensure unique email even with same timestamp
  const email = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  const password = "Test123!@";

  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      confirmPassword: password,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create test user: ${error}`);
  }

  return { email, password };
}

/**
 * Login a test user and return cookies
 */
export async function loginTestUser(email: string, password: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Failed to login test user");
  }

  // Extract all cookies from Set-Cookie headers
  // In Node.js fetch, we need to use getSetCookie() to get all cookies
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cookies = (response.headers as any).getSetCookie?.() || [];
  return cookies.join("; ");
}
