/**
 * Global setup for API tests
 * Creates a shared test user once before all tests
 */

const BASE_URL = "http://localhost:3000";

export const SHARED_TEST_USER = {
  email: `test-user@gmail.com`,
  password: "Test1234",
};

export async function setup() {
  console.log("🔧 Setting up test environment...");

  // Only in CI - create shared test user
  if (process.env.CI === "true") {
    console.log("📝 Creating shared test user for CI...");
    console.log(`   Email: ${SHARED_TEST_USER.email}`);

    try {
      // Try to register
      const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: SHARED_TEST_USER.email,
          password: SHARED_TEST_USER.password,
          confirmPassword: SHARED_TEST_USER.password,
        }),
      });

      if (registerResponse.ok) {
        console.log("✅ Shared test user created successfully");
      } else {
        const error = await registerResponse.text();
        console.log(`⚠️  Could not create shared test user: ${error}`);
        console.log("   (User may already exist, which is OK)");
      }

      // IMPORTANT: Try to login to verify user can authenticate
      console.log("🔐 Testing login with shared user...");
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: SHARED_TEST_USER.email,
          password: SHARED_TEST_USER.password,
        }),
      });

      if (loginResponse.ok) {
        console.log("✅ Shared test user can login successfully");
      } else {
        const loginError = await loginResponse.text();
        console.error("❌ CRITICAL: Shared test user CANNOT login!");
        console.error(`   Status: ${loginResponse.status}`);
        console.error(`   Error: ${loginError}`);
        console.error("");
        console.error("⚠️  This means tests will fail. Possible reasons:");
        console.error("   1. Email confirmation is ENABLED in Supabase (must be OFF)");
        console.error("   2. User credentials are incorrect");
        console.error("   3. Rate limiting is blocking the user");
        console.error("");
        console.error("👉 Fix: Go to Supabase Dashboard → Authentication → Settings");
        console.error("   and DISABLE 'Enable email confirmations'");
        console.error("");
        throw new Error("Shared test user cannot login - tests will fail");
      }
    } catch (error) {
      console.error("❌ Error in global setup:", error);
      throw error; // Fail fast if setup fails
    }
  }

  console.log("✅ Test environment ready");
}

export async function teardown() {
  console.log("🧹 Cleaning up test environment...");
  // Add cleanup logic here if needed
}
