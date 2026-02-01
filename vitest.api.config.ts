import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/api/**/*.test.ts"],
    testTimeout: 30000, // 30 seconds for API calls
    globalSetup: ["tests/api/global-setup.ts"],
    // Run tests sequentially to avoid rate limiting
    sequence: {
      concurrent: false,
    },
    pool: "forks",
    // Vitest 4: poolOptions moved to top level
    fileParallelism: false,
    isolate: true,
  },
});
