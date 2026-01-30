import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Playwright E2E Test Configuration for Admin App
 *
 * These tests require:
 * - Clerk API keys (VITE_CLERK_PUBLISHABLE_KEY)
 * - Running admin and API servers (started automatically by this config)
 *
 * To run tests:
 * 1. Copy .env.local.example to .env.local and fill in values
 * 2. Run: pnpm --filter @axori/admin test:e2e
 *
 * @see https://playwright.dev/docs/test-configuration
 */

// ============================================================================
// EARLY ENVIRONMENT CHECK
// ============================================================================

const REQUIRED_ENV_VARS = ["VITE_CLERK_PUBLISHABLE_KEY"];
const missingEnvVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);

if (missingEnvVars.length > 0) {
  console.log("\n");
  console.log("╔" + "═".repeat(62) + "╗");
  console.log(
    "║" + "  E2E TESTS CANNOT RUN - Missing Configuration".padEnd(62) + "║"
  );
  console.log("╚" + "═".repeat(62) + "╝");
  console.log("");
  console.log("Missing required environment variables:");
  missingEnvVars.forEach((v) => console.log(`  - ${v}`));
  console.log("");
  console.log("To fix this:");
  console.log("   1. Copy .env.local.example to .env.local");
  console.log("   2. Fill in the missing values");
  console.log("   3. Re-run: pnpm --filter @axori/admin test:e2e");
  console.log("");
  process.exit(1);
}

export default defineConfig({
  testDir: "./tests/e2e",

  /* Global setup/teardown */
  globalSetup: path.join(__dirname, "tests/e2e/global-setup.ts"),

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: process.env.CI ? "github" : "html",

  /* Maximum time one test can run for */
  timeout: 60000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
  },

  /* Shared settings for all projects */
  use: {
    /* Base URL for admin app */
    baseURL: "http://localhost:3002",

    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",

    /* Video recording on failure */
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Run local dev servers before starting tests */
  webServer: [
    {
      command: "pnpm --filter @axori/api dev",
      url: "http://localhost:3001/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: "pnpm --filter @axori/admin dev",
      url: "http://localhost:3002",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
