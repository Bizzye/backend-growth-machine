import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    globalSetup: ["./tests/global-setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: "test",
      // Replaced at runtime by the in-memory MongoDB URI (see tests/global-setup.ts).
      MONGODB_URI: "mongodb://placeholder",
      JWT_SECRET: "test-secret-that-is-long-enough-for-hs256-signing",
      JWT_EXPIRES_IN: "1h",
      CORS_ORIGIN: "http://localhost:3000",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/server.ts", "src/scripts/**", "src/docs/**", "src/types/**", "src/config/database.ts"],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
});
