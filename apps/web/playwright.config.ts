import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Playwright E2E Test Configuration
 *
 * These tests require:
 * - Clerk API keys (CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY)
 * - Database connection (DATABASE_URL)
 * - Running web and API servers (started automatically by this config)
 *
 * To run tests:
 * 1. Copy .env.local.example to .env.local and fill in values
 * 2. Run: pnpm --filter @axori/web test:e2e
 *
 * For running against already-running servers:
 * Set reuseExistingServer by running with servers already up
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Global setup/teardown */
  globalSetup: path.join(__dirname, 'tests/e2e/global-setup.ts'),

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'github' : 'html',

  /* Maximum time one test can run for */
  timeout: 60000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
  },

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video recording on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests 
   * 
   * IMPORTANT: These tests require proper environment configuration:
   * 1. Copy .env.local.example to .env.local
   * 2. Fill in VITE_CLERK_PUBLISHABLE_KEY (get from Clerk dashboard)
   * 3. Fill in DATABASE_URL (get from Supabase)
   * 
   * For CI, ensure these secrets are configured in GitHub Actions.
   */
  webServer: [
    {
      command: 'pnpm --filter @axori/api dev',
      url: 'http://localhost:3001/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'pnpm --filter @axori/web dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
})

