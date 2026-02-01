/**
 * Global setup for API tests
 * Creates a shared test user once before all tests
 */

const BASE_URL = "http://localhost:3000";

export const SHARED_TEST_USER = {
  email: `ci-test-user@example.com`,
  password: "Test123!@#SecurePassword",
};

export async function setup() {
  console.log("🔧 Setting up test environment...");

  // Only in CI - create shared test user
  if (process.env.CI === "true") {
    console.log("📝 Creating shared test user for CI...");

    try {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: SHARED_TEST_USER.email,
          password: SHARED_TEST_USER.password,
          confirmPassword: SHARED_TEST_USER.password,
        }),
      });

      if (response.ok) {
        console.log("✅ Shared test user created successfully");
      } else {
        const error = await response.text();
        console.log(`⚠️  Could not create shared test user (may already exist): ${error}`);
      }
    } catch (error) {
      console.error("❌ Error in global setup:", error);
      // Don't fail - user may already exist
    }
  }

  console.log("✅ Test environment ready");
}

export async function teardown() {
  console.log("🧹 Cleaning up test environment...");
  // Add cleanup logic here if needed
}
