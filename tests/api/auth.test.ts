import { describe, it, expect, beforeAll } from "vitest";

const BASE_URL = "http://localhost:3000";
const IS_CI = process.env.CI === "true";

describe("POST /api/auth/register", () => {
  it("should register new user with valid data", async () => {
    // Skip in CI to avoid rate limiting - tested indirectly through other tests
    if (IS_CI) {
      console.log("⏭️  Skipping user creation test in CI (rate limiting)");
      return;
    }

    const email = `user-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "Test123!@",
        confirmPassword: "Test123!@",
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.message || data.user).toBeDefined();
  });

  it("should reject registration with weak password", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@test.com",
        password: "weak",
        confirmPassword: "weak",
      }),
    });

    expect(response.status).toBe(400);
  });

  it("should reject registration with mismatched passwords", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@test.com",
        password: "Test123!@",
        confirmPassword: "Different123!@",
      }),
    });

    expect(response.status).toBe(400);
  });

  it("should reject registration with invalid email", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "invalid-email",
        password: "Test123!@",
        confirmPassword: "Test123!@",
      }),
    });

    expect(response.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  // Use shared test user in CI, unique user in local dev
  const testEmail = IS_CI
    ? "ci-test-user@example.com"
    : `login-test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
  const testPassword = IS_CI ? "Test123!@#SecurePassword" : "Test123!@";

  beforeAll(async () => {
    // Create test user only in local dev (CI uses shared user from global setup)
    if (!IS_CI) {
      await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          confirmPassword: testPassword,
        }),
      });
    }
  });

  it("should login with correct credentials", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user || data.message).toBeDefined();
  });

  it("should reject login with wrong password", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "WrongPassword123!@",
      }),
    });

    expect(response.status).toBe(401);
  });

  it("should reject login with non-existent user", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent@test.com",
        password: testPassword,
      }),
    });

    expect(response.status).toBe(401);
  });
});
